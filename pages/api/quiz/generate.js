import mongoose from 'mongoose'
import connectDB from '../../../lib/mongodb'
import Book from '../../../models/Book'
import Quiz from '../../../models/Quiz'
import { generateQuiz } from '../../../lib/gemini'
import {
  findCachedQuiz,
  saveQuizToCache,
  logCacheSavings,
} from '../../../lib/quizCache'

/**
 * API Route: Generate Quiz using Gemini AI
 * POST /api/quiz/generate - Generates a quiz from book content
 */

// Gemini token limits (approximate)
// Conservative limits to avoid quota issues
const MAX_TOKENS = 15000 // Reduced from 30000 to save quota
const CHARS_PER_TOKEN = 4 // Rough estimate: 1 token ≈ 4 characters
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN // ~60,000 characters

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  try {
    // Parse and validate request body
    const { bookId, pageRange, numberOfQuestions, difficulty } = req.body

    // Validate required fields
    if (!bookId) {
      return res.status(400).json({
        success: false,
        error: 'bookId is required',
      })
    }

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bookId format',
      })
    }

    // Validate numberOfQuestions
    const numQuestions = numberOfQuestions || 5
    if (numQuestions < 1 || numQuestions > 20) {
      return res.status(400).json({
        success: false,
        error: 'numberOfQuestions must be between 1 and 20',
      })
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard']
    const quizDifficulty = difficulty || 'medium'
    if (!validDifficulties.includes(quizDifficulty)) {
      return res.status(400).json({
        success: false,
        error: 'difficulty must be easy, medium, or hard',
      })
    }

    // Validate page range if provided
    if (pageRange) {
      if (!pageRange.start || !pageRange.end) {
        return res.status(400).json({
          success: false,
          error: 'pageRange must include start and end',
        })
      }

      if (pageRange.start < 1 || pageRange.end < 1) {
        return res.status(400).json({
          success: false,
          error: 'Page numbers must be greater than 0',
        })
      }

      if (pageRange.start > pageRange.end) {
        return res.status(400).json({
          success: false,
          error: 'start page must be less than or equal to end page',
        })
      }
    }

    console.log('🎯 Generating quiz for book:', bookId)

    // Connect to MongoDB
    await connectDB()

    // Fetch book from database
    const book = await Book.findById(bookId)

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
      })
    }

    console.log('📖 Found book:', book.title)

    // Determine actual page range
    let actualPageRange = pageRange || { start: 1, end: book.totalPages }

    // Check cache first
    console.log('🔍 Checking quiz cache...')
    const cachedQuiz = await findCachedQuiz(
      bookId,
      actualPageRange,
      numQuestions,
      quizDifficulty
    )

    if (cachedQuiz) {
      // Cache HIT - return existing quiz
      logCacheSavings(cachedQuiz)

      return res.status(200).json({
        success: true,
        quizId: cachedQuiz._id.toString(),
        fromCache: true,
        usageCount: cachedQuiz.usageCount,
        message: 'Quiz retrieved from cache',
        quiz: {
          id: cachedQuiz._id,
          title: cachedQuiz.title,
          bookId: cachedQuiz.bookId,
          bookTitle: book.title,
          generatedDate: cachedQuiz.generatedDate,
          pageRange: cachedQuiz.pageRange,
          difficulty: cachedQuiz.difficulty,
          numberOfQuestions: cachedQuiz.numberOfQuestions,
          questions: cachedQuiz.questions,
        },
      })
    }

    // Cache MISS - generate new quiz
    console.log('  Cache MISS: Generating new quiz with Gemini')

    // Extract relevant text from per-page storage
    let contentText = ''

    if (pageRange) {
      // Validate page range against book's total pages
      if (pageRange.end > book.totalPages) {
        return res.status(400).json({
          success: false,
          error: `Page range exceeds book's total pages (${book.totalPages})`,
        })
      }

      console.log(
        `📄 Extracting text from pages ${pageRange.start}-${pageRange.end}`
      )

      // Extract text from specific page range using per-page storage
      contentText = extractTextFromPages(book, pageRange.start, pageRange.end)
    } else {
      // Use all pages or fallback to legacy pdfText
      console.log('📄 Using full book text')
      if (book.pages && book.pages.length > 0) {
        contentText = book.pages.map((page) => page.text).join('\n\n')
      } else if (book.pdfText) {
        // Fallback to legacy storage
        contentText = book.pdfText
      }
    }

    // Check if we have text
    if (!contentText || contentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No text content available for quiz generation',
      })
    }

    // Truncate text if too large for Gemini
    const { text: truncatedText, wasTruncated } = truncateText(
      contentText,
      MAX_CHARS
    )

    if (wasTruncated) {
      console.log(
        `⚠️  Text truncated from ${contentText.length} to ${truncatedText.length} characters`
      )
    }

    console.log(
      `📊 Text length: ${truncatedText.length} characters (~${Math.ceil(
        truncatedText.length / CHARS_PER_TOKEN
      )} tokens)`
    )

    // Generate quiz using Gemini AI
    console.log(
      ` Generating ${numQuestions} ${quizDifficulty} questions...`
    )

    const questions = await generateQuiz(
      truncatedText,
      numQuestions,
      quizDifficulty
    )

    console.log(`  Generated ${questions.length} questions`)

    // Create quiz title
    const quizTitle = pageRange
      ? `${book.title} - Pages ${pageRange.start}-${pageRange.end}`
      : `${book.title} - Full Book Quiz`

    // Save quiz to cache
    const quiz = await saveQuizToCache({
      bookId: book._id,
      title: quizTitle,
      generatedDate: new Date(),
      pageRange: actualPageRange,
      questions: questions,
      difficulty: quizDifficulty,
      numberOfQuestions: questions.length,
    })

    console.log('💾 Quiz saved to database with cache key:', quiz.cacheKey)

    // Return success response
    return res.status(200).json({
      success: true,
      quizId: quiz._id.toString(),
      fromCache: false,
      usageCount: 1,
      message: 'Quiz generated successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        bookId: quiz.bookId,
        bookTitle: book.title,
        generatedDate: quiz.generatedDate,
        pageRange: quiz.pageRange,
        difficulty: quiz.difficulty,
        numberOfQuestions: quiz.numberOfQuestions,
        questions: quiz.questions,
        wasTruncated: wasTruncated,
      },
    })
  } catch (error) {
    console.error('  Quiz generation error:', error)

    // Handle specific error types
    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error. Please check server settings.',
      })
    }

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please check server settings.',
      })
    }

    if (error.message.includes('Failed to generate quiz')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate quiz. Please try again.',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }

    if (error.message.includes('Failed to extract')) {
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from specified pages.',
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to generate quiz',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

/**
 * Extract text from specific pages using per-page storage
 * @param {Object} book - Book document
 * @param {number} startPage - Starting page (1-indexed)
 * @param {number} endPage - Ending page (1-indexed)
 * @returns {string} Extracted text
 */
function extractTextFromPages(book, startPage, endPage) {
  try {
    // Use per-page storage if available
    if (book.pages && book.pages.length > 0) {
      const selectedPages = book.pages.filter(
        (page) => page.pageNumber >= startPage && page.pageNumber <= endPage
      )

      // Sort by page number and combine text
      selectedPages.sort((a, b) => a.pageNumber - b.pageNumber)
      return selectedPages.map((page) => page.text).join('\n\n')
    }

    // Fallback to legacy pdfText with estimation
    if (book.pdfText) {
      const totalPages = book.totalPages
      const totalChars = book.pdfText.length
      const charsPerPage = Math.ceil(totalChars / totalPages)

      // Calculate character positions
      const startChar = (startPage - 1) * charsPerPage
      const endChar = endPage * charsPerPage

      // Extract text slice
      return book.pdfText.substring(startChar, endChar)
    }

    throw new Error('No text content available in book document')
  } catch (error) {
    console.error('  Error extracting pages:', error)
    throw new Error(`Failed to extract text from pages: ${error.message}`)
  }
}

/**
 * Truncate text to fit within token limits
 * @param {string} text - Original text
 * @param {number} maxChars - Maximum characters
 * @returns {Object} { text: truncated text, wasTruncated: boolean }
 */
function truncateText(text, maxChars) {
  if (text.length <= maxChars) {
    return { text, wasTruncated: false }
  }

  // Truncate at word boundary
  let truncated = text.substring(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 0) {
    truncated = truncated.substring(0, lastSpace)
  }

  return {
    text: truncated,
    wasTruncated: true,
  }
}

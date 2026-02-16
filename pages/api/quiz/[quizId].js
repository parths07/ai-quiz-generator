import mongoose from 'mongoose'
import connectDB from '../../../lib/mongodb'
import Quiz from '../../../models/Quiz'

/**
 * API Route: Get Quiz by ID
 * GET /api/quiz/[quizId] - Returns quiz with populated book information
 */
export default async function handler(req, res) {
  const { quizId } = req.query

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    })
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(quizId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid quiz ID format',
    })
  }

  try {
    // Connect to MongoDB
    await connectDB()

    // Find quiz and populate book information
    const quiz = await Quiz.findById(quizId)
      .populate('bookId', 'title author totalPages fileName uploadDate')
      .lean()

    // Check if quiz exists
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      })
    }

    console.log(`📝 Retrieved quiz: ${quiz.title} (${quiz._id})`)

    // Return quiz with full details
    return res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          generatedDate: quiz.generatedDate,
          difficulty: quiz.difficulty,
          numberOfQuestions: quiz.numberOfQuestions,
          pageRange: quiz.pageRange,
          questions: quiz.questions,
          book: quiz.bookId
            ? {
                id: quiz.bookId._id,
                title: quiz.bookId.title,
                author: quiz.bookId.author,
                totalPages: quiz.bookId.totalPages,
                fileName: quiz.bookId.fileName,
                uploadDate: quiz.bookId.uploadDate,
              }
            : null,
          createdAt: quiz.createdAt,
          updatedAt: quiz.updatedAt,
        },
      },
    })
  } catch (error) {
    console.error('  Error fetching quiz:', error)

    // Handle specific error types
    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error. Please check server settings.',
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

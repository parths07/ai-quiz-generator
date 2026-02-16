import Quiz from '../models/Quiz'

/**
 * Quiz Cache Utility
 * Manages intelligent caching of quiz questions to reduce Gemini API calls
 * and improve response times
 */

/**
 * Generate a consistent cache key from quiz parameters
 * @param {string} bookId - Book ID
 * @param {Object} pageRange - Page range {start, end}
 * @param {number} numberOfQuestions - Number of questions
 * @param {string} difficulty - Difficulty level
 * @returns {string} Cache key
 */
export function generateCacheKey(bookId, pageRange, numberOfQuestions, difficulty) {
  const start = pageRange?.start || 1
  const end = pageRange?.end || 1
  
  return `${bookId}-${start}-${end}-${numberOfQuestions}-${difficulty}`
}

/**
 * Find a cached quiz with the same parameters
 * Increments usage count if found
 * @param {string} bookId - Book ID
 * @param {Object} pageRange - Page range {start, end}
 * @param {number} numberOfQuestions - Number of questions
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Object|null>} Quiz document or null
 */
export async function findCachedQuiz(bookId, pageRange, numberOfQuestions, difficulty) {
  try {
    const cacheKey = generateCacheKey(bookId, pageRange, numberOfQuestions, difficulty)
    
    console.log('🔍 Checking cache for key:', cacheKey)

    // Find quiz with matching cache key
    const cachedQuiz = await Quiz.findOne({ cacheKey })

    if (cachedQuiz) {
      // Increment usage count
      await cachedQuiz.incrementUsage()
      
      console.log(`  Cache HIT: Found existing quiz (used ${cachedQuiz.usageCount} times)`)
      
      return cachedQuiz
    }

    console.log('  Cache MISS: No cached quiz found')
    return null
  } catch (error) {
    console.error('⚠️  Error checking cache:', error.message)
    // Return null on error to fall back to generating new quiz
    return null
  }
}

/**
 * Save a new quiz to the cache
 * @param {Object} quizData - Quiz data to save
 * @returns {Promise<Object>} Saved quiz document
 */
export async function saveQuizToCache(quizData) {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(
      quizData.bookId,
      quizData.pageRange,
      quizData.numberOfQuestions,
      quizData.difficulty
    )

    // Create quiz with cache key
    const quiz = new Quiz({
      ...quizData,
      cacheKey,
      usageCount: 1, // First use
      lastUsedAt: new Date(),
      generatedBy: 'gemini',
    })

    await quiz.save()
    
    console.log('💾 Quiz saved to cache with key:', cacheKey)
    
    return quiz
  } catch (error) {
    console.error('  Error saving quiz to cache:', error.message)
    throw error
  }
}

/**
 * Get cache statistics for a book
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} Cache statistics
 */
export async function getCacheStats(bookId) {
  try {
    // Get all quizzes for this book
    const quizzes = await Quiz.find({ bookId })

    if (quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        uniqueConfigurations: 0,
        cacheHitRate: 0,
        tokensSaved: 0,
        topConfigurations: [],
      }
    }

    // Calculate statistics
    const totalQuizzes = quizzes.length
    const uniqueConfigurations = new Set(quizzes.map(q => q.cacheKey)).size
    
    // Calculate total usage (including initial generation)
    const totalUsage = quizzes.reduce((sum, q) => sum + q.usageCount, 0)
    
    // Cache hits = total usage - unique configurations (initial generations)
    const cacheHits = totalUsage - uniqueConfigurations
    const cacheHitRate = totalUsage > 0 ? (cacheHits / totalUsage) * 100 : 0

    // Estimate tokens saved (assuming ~1500 tokens per quiz generation)
    const tokensPerQuiz = 1500
    const tokensSaved = cacheHits * tokensPerQuiz

    // Find top configurations by usage
    const topConfigurations = quizzes
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(q => ({
        pageRange: `${q.pageRange.start}-${q.pageRange.end}`,
        difficulty: q.difficulty,
        questions: q.numberOfQuestions,
        usageCount: q.usageCount,
        lastUsed: q.lastUsedAt,
      }))

    console.log(`📊 Cache stats for book ${bookId}:`)
    console.log(`   Total quizzes: ${totalQuizzes}`)
    console.log(`   Unique configurations: ${uniqueConfigurations}`)
    console.log(`   Cache hit rate: ${cacheHitRate.toFixed(1)}%`)
    console.log(`   Tokens saved: ~${tokensSaved.toLocaleString()}`)

    return {
      totalQuizzes,
      uniqueConfigurations,
      cacheHitRate: parseFloat(cacheHitRate.toFixed(1)),
      tokensSaved,
      topConfigurations,
    }
  } catch (error) {
    console.error('  Error getting cache stats:', error.message)
    throw error
  }
}

/**
 * Calculate tokens saved by a cached quiz
 * @param {number} usageCount - Number of times quiz was used
 * @returns {number} Estimated tokens saved
 */
export function calculateTokensSaved(usageCount) {
  // Assuming ~1500 tokens per quiz generation
  const tokensPerQuiz = 1500
  
  // Subtract 1 because first use was the generation
  const cacheHits = Math.max(0, usageCount - 1)
  
  return cacheHits * tokensPerQuiz
}

/**
 * Log cache savings
 * @param {Object} quiz - Quiz document
 */
export function logCacheSavings(quiz) {
  if (quiz.usageCount > 1) {
    const tokensSaved = calculateTokensSaved(quiz.usageCount)
    console.log(`💰 Cache saved ~${tokensSaved.toLocaleString()} tokens (quiz used ${quiz.usageCount} times)`)
  }
}

export default {
  generateCacheKey,
  findCachedQuiz,
  saveQuizToCache,
  getCacheStats,
  calculateTokensSaved,
  logCacheSavings,
}

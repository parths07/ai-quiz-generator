import connectDB from '../../../lib/mongodb'
import Book from '../../../models/Book'

/**
 * API Route: List All Books
 * GET /api/books - Returns paginated list of books
 */
export default async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    })
  }

  try {
    // Connect to MongoDB
    await connectDB()

    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page number must be greater than 0',
      })
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
      })
    }

    // Get total count for pagination info
    const totalBooks = await Book.countDocuments()

    // Query books with pagination
    // Exclude pdfText from list for performance
    const books = await Book.find()
      .select('_id title author totalPages uploadDate fileSize fileName createdAt')
      .sort({ uploadDate: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean() // Convert to plain JavaScript objects for better performance

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalBooks / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    console.log(`📚 Retrieved ${books.length} books (page ${page}/${totalPages})`)

    // Return success response with pagination info
    return res.status(200).json({
      success: true,
      data: {
        books: books,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalBooks: totalBooks,
          booksPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
      },
    })
  } catch (error) {
    console.error('  Error fetching books:', error)

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
      error: 'Failed to fetch books',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

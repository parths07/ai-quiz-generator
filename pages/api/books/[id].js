import mongoose from 'mongoose'
import connectDB from '../../../lib/mongodb'
import Book from '../../../models/Book'

/**
 * API Route: Get or Delete Single Book
 * GET /api/books/[id] - Returns single book with full details
 * DELETE /api/books/[id] - Deletes a book by ID
 */
export default async function handler(req, res) {
  const { id } = req.query

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid book ID format',
    })
  }

  try {
    // Connect to MongoDB
    await connectDB()

    // Handle GET request - Retrieve single book
    if (req.method === 'GET') {
      return await handleGet(req, res, id)
    }

    // Handle DELETE request - Delete book
    if (req.method === 'DELETE') {
      return await handleDelete(req, res, id)
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or DELETE.',
    })
  } catch (error) {
    console.error('  Error handling book request:', error)

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
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

/**
 * Handle GET request - Retrieve single book with full details
 */
async function handleGet(req, res, id) {
  try {
    // Find book by ID (includes pdfText for quiz generation)
    const book = await Book.findById(id).lean()

    // Check if book exists
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
      })
    }

    console.log(`📖 Retrieved book: ${book.title} (${book._id})`)

    // Return book with full details including pdfText
    return res.status(200).json({
      success: true,
      data: {
        book: book,
      },
    })
  } catch (error) {
    console.error('  Error retrieving book:', error)
    throw error
  }
}

/**
 * Handle DELETE request - Delete book by ID
 */
async function handleDelete(req, res, id) {
  try {
    // Find and delete book
    const book = await Book.findByIdAndDelete(id)

    // Check if book existed
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
      })
    }

    console.log(`🗑️  Deleted book: ${book.title} (${book._id})`)

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: {
        deletedBook: {
          id: book._id,
          title: book.title,
          author: book.author,
        },
      },
    })
  } catch (error) {
    console.error('  Error deleting book:', error)
    throw error
  }
}

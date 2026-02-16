import mongoose from 'mongoose'
import connectDB from '../../../../lib/mongodb'
import { getPdfStreamFromGridFS, getPdfMetadata } from '../../../../lib/gridfs'
import Book from '../../../../models/Book'

/**
 * API Route: Serve PDF Files from GridFS
 * GET /api/books/pdf/[fileId] - Streams PDF file to browser
 * 
 * This endpoint is used by PDF.js viewer in the frontend
 */

export default async function handler(req, res) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.',
    })
  }

  const { fileId } = req.query

  try {
    console.log('📄 Serving PDF file:', fileId)

    // Validate fileId parameter
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'File ID is required',
      })
    }

    // Validate fileId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID format',
      })
    }

    // Connect to MongoDB
    await connectDB()

    // Get file metadata to check if file exists and get filename
    let metadata
    try {
      metadata = await getPdfMetadata(fileId)
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'PDF file not found',
        })
      }
      throw error
    }

    console.log('  Found PDF file:', metadata.filename)

    // Optional: Find book document to get book title for better filename
    let bookTitle = null
    try {
      const book = await Book.findOne({ pdfFileId: fileId })
      if (book) {
        bookTitle = book.title
      }
    } catch (error) {
      // If book not found, just use the original filename
      console.warn('⚠️  Book document not found for PDF:', fileId)
    }

    // Determine filename for Content-Disposition header
    const filename = bookTitle
      ? `${bookTitle}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_')
      : metadata.filename

    // Get PDF stream from GridFS
    const pdfStream = await getPdfStreamFromGridFS(fileId)

    // Set response headers for PDF streaming
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.setHeader('Content-Length', metadata.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    res.setHeader('Accept-Ranges', 'bytes')

    console.log('📤 Streaming PDF to client:', filename)

    // Stream PDF to response
    pdfStream.pipe(res)

    // Handle stream errors
    pdfStream.on('error', (error) => {
      console.error('  Stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to stream PDF file',
        })
      }
    })

    // Log when streaming completes
    pdfStream.on('end', () => {
      console.log('  PDF streaming completed:', fileId)
    })
  } catch (error) {
    console.error('  Error serving PDF:', error)

    // Don't send JSON if headers already sent (streaming started)
    if (res.headersSent) {
      return
    }

    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found',
      })
    }

    if (error.message.includes('Invalid file ID')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID format',
      })
    }

    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error',
      })
    }

    if (error.message.includes('GridFS')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve PDF from storage',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to serve PDF file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

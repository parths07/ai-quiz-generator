import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import connectDB from '../../../lib/mongodb'
import Book from '../../../models/Book'
import {
  extractPageByPage,
  isValidPDF,
} from '../../../lib/pdfParser'
import { uploadPdfToGridFS } from '../../../lib/gridfs'

/**
 * API Route: Upload and Process PDF Books
 * Handles PDF file uploads, extracts text, and saves to MongoDB
 */

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  try {
    // Parse the uploaded file
    const { fields, files } = await parseForm(req)

    // Validate file upload
    const file = files.file
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a PDF file.',
      })
    }

    // Get the first file if multiple were uploaded
    const uploadedFile = Array.isArray(file) ? file[0] : file

    // Validate file type
    if (
      !uploadedFile.mimetype ||
      uploadedFile.mimetype !== 'application/pdf'
    ) {
      // Clean up the uploaded file
      await cleanupFile(uploadedFile.filepath)
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF files are allowed.',
      })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (uploadedFile.size > maxSize) {
      await cleanupFile(uploadedFile.filepath)
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is 10MB. Your file is ${(
          uploadedFile.size /
          1024 /
          1024
        ).toFixed(2)}MB.`,
      })
    }

    console.log('📄 Processing PDF:', uploadedFile.originalFilename)

    // Read the PDF file
    const pdfBuffer = await fs.promises.readFile(uploadedFile.filepath)

    // Validate PDF before processing
    console.log('🔍 Validating PDF...')
    const validation = await isValidPDF(pdfBuffer)
    if (!validation.isValid) {
      await cleanupFile(uploadedFile.filepath)
      return res.status(400).json({
        success: false,
        error: `Invalid PDF file: ${validation.error}`,
      })
    }
    console.log(`  Valid PDF with ${validation.pageCount} pages`)

    // Connect to MongoDB first (needed for GridFS)
    await connectDB()

    // Upload PDF to GridFS
    console.log('☁️  Uploading PDF to GridFS...')
    const pdfFileId = await uploadPdfToGridFS(pdfBuffer, uploadedFile.originalFilename, {
      originalName: uploadedFile.originalFilename,
      uploadDate: new Date(),
      mimeType: uploadedFile.mimetype,
    })
    console.log('  PDF uploaded to GridFS:', pdfFileId)

    // Extract text from all pages individually with metadata
    console.log('🔍 Extracting text page-by-page...')
    const extractionResult = await extractPageByPage(pdfBuffer)

    // Check if PDF has extractable text
    const totalCharacters = extractionResult.metadata.totalCharacters
    if (!extractionResult.pages || extractionResult.pages.length === 0 || totalCharacters < 50) {
      await cleanupFile(uploadedFile.filepath)
      return res.status(400).json({
        success: false,
        error:
          'PDF appears to be scanned or has no extractable text. Please upload a PDF with text content.',
      })
    }

    // Extract title from metadata or filename
    const title =
      fields.title ||
      extractionResult.metadata.title ||
      path.basename(uploadedFile.originalFilename, '.pdf')

    // Extract author from metadata or form field
    const author =
      fields.author ||
      extractionResult.metadata.author ||
      ''

    // Create book document with GridFS reference and per-page text
    const book = new Book({
      title: title,
      author: author,
      fileName: uploadedFile.originalFilename,
      uploadDate: new Date(),
      totalPages: extractionResult.totalPages,
      fileSize: uploadedFile.size,
      pdfFileId: pdfFileId, // GridFS reference
      pages: extractionResult.pages, // Per-page text storage
      chapters: [], // Can be populated later
    })

    // Save to database
    await book.save()
    console.log('💾 Book saved to database:', book._id)

    // Clean up temporary file
    await cleanupFile(uploadedFile.filepath)

    // Return success response with requested format
    return res.status(200).json({
      success: true,
      bookId: book._id.toString(),
      title: book.title,
      totalPages: book.totalPages,
      pdfFileId: book.pdfFileId.toString(),
      message: `Book uploaded successfully with ${book.totalPages} pages extracted`,
      // Additional details
      details: {
        author: book.author,
        fileName: book.fileName,
        fileSize: book.fileSize,
        uploadDate: book.uploadDate,
        textLength: totalCharacters,
        pagesStored: extractionResult.pages.length,
        metadata: extractionResult.metadata,
      },
    })
  } catch (error) {
    console.error('  Upload error:', error)

    // Handle specific error types
    if (error.message.includes('MONGODB_URI')) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error. Please check server settings.',
      })
    }

    if (error.message.includes('Failed to extract')) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process PDF. The file may be corrupted or invalid.',
      })
    }

    if (error.message.includes('GridFS') || error.message.includes('upload file')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload PDF to storage. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }

    if (error.message.includes('validation failed') || error.message.includes('Book validation')) {
      return res.status(400).json({
        success: false,
        error: 'Failed to save book data. Please check your input.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to upload and process book',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

/**
 * Parse multipart form data using formidable
 * @param {object} req - Next.js request object
 * @returns {Promise<{fields: object, files: object}>}
 */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
      multiples: false,
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }

      // Formidable v3 returns arrays for fields, extract first value
      const normalizedFields = {}
      for (const key in fields) {
        normalizedFields[key] = Array.isArray(fields[key])
          ? fields[key][0]
          : fields[key]
      }

      resolve({ fields: normalizedFields, files })
    })
  })
}

/**
 * Clean up temporary uploaded file
 * @param {string} filepath - Path to temporary file
 */
async function cleanupFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath)
      console.log('🗑️  Cleaned up temporary file')
    }
  } catch (error) {
    console.error('⚠️  Failed to cleanup file:', error.message)
    // Don't throw error, just log it
  }
}

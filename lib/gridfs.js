import mongoose from 'mongoose'
import { Readable } from 'stream'

/**
 * GridFS Utility for PDF File Storage
 * Handles uploading, downloading, and deleting PDF files in MongoDB GridFS
 */

// Configuration
const BUCKET_NAME = 'pdfs'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

// GridFS bucket instance
let gfsBucket = null

/**
 * Initialize GridFS bucket
 * Called automatically when connection is established
 */
function initGridFS() {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established')
  }

  if (!gfsBucket) {
    gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: BUCKET_NAME,
    })
    console.log('  GridFS bucket initialized:', BUCKET_NAME)
  }

  return gfsBucket
}

/**
 * Get GridFS bucket instance
 * Initializes if not already done
 * @returns {GridFSBucket} GridFS bucket instance
 */
function getGridFSBucket() {
  if (!gfsBucket) {
    return initGridFS()
  }
  return gfsBucket
}

/**
 * Upload PDF file to GridFS
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata (bookId, uploadDate, etc.)
 * @returns {Promise<string>} File ID of uploaded file
 */
export async function uploadPdfToGridFS(buffer, filename, metadata = {}) {
  try {
    // Validate buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Buffer is required')
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      )
    }

    // Validate filename
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename: Filename is required')
    }

    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Create readable stream from buffer
    const readableStream = Readable.from(buffer)

    // Prepare metadata
    const fileMetadata = {
      originalName: filename,
      uploadDate: new Date(),
      contentType: 'application/pdf',
      size: buffer.length,
      ...metadata,
    }

    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: fileMetadata,
    })

    // Upload file
    await new Promise((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on('error', (error) => {
          console.error('  GridFS upload error:', error)
          reject(new Error(`Failed to upload file: ${error.message}`))
        })
        .on('finish', () => {
          console.log('  File uploaded to GridFS:', uploadStream.id)
          resolve()
        })
    })

    return uploadStream.id.toString()
  } catch (error) {
    console.error('  Error uploading to GridFS:', error)
    throw error
  }
}

/**
 * Download PDF file from GridFS
 * @param {string} fileId - File ID to download
 * @returns {Promise<Buffer>} File buffer
 */
export async function downloadPdfFromGridFS(fileId) {
  try {
    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required')
    }

    // Convert to ObjectId
    let objectId
    try {
      objectId = new mongoose.Types.ObjectId(fileId)
    } catch (error) {
      throw new Error('Invalid file ID format')
    }

    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Check if file exists
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      throw new Error('File not found in GridFS')
    }

    // Create download stream
    const downloadStream = bucket.openDownloadStream(objectId)

    // Read stream into buffer
    const chunks = []
    await new Promise((resolve, reject) => {
      downloadStream
        .on('data', (chunk) => {
          chunks.push(chunk)
        })
        .on('error', (error) => {
          console.error('  GridFS download error:', error)
          reject(new Error(`Failed to download file: ${error.message}`))
        })
        .on('end', () => {
          console.log('  File downloaded from GridFS:', fileId)
          resolve()
        })
    })

    return Buffer.concat(chunks)
  } catch (error) {
    console.error('  Error downloading from GridFS:', error)
    throw error
  }
}

/**
 * Get PDF file stream from GridFS
 * Useful for streaming large files without loading into memory
 * @param {string} fileId - File ID to stream
 * @returns {Promise<ReadableStream>} File stream
 */
export async function getPdfStreamFromGridFS(fileId) {
  try {
    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required')
    }

    // Convert to ObjectId
    let objectId
    try {
      objectId = new mongoose.Types.ObjectId(fileId)
    } catch (error) {
      throw new Error('Invalid file ID format')
    }

    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Check if file exists
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      throw new Error('File not found in GridFS')
    }

    // Return download stream
    return bucket.openDownloadStream(objectId)
  } catch (error) {
    console.error('  Error getting stream from GridFS:', error)
    throw error
  }
}

/**
 * Delete PDF file from GridFS
 * @param {string} fileId - File ID to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePdfFromGridFS(fileId) {
  try {
    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required')
    }

    // Convert to ObjectId
    let objectId
    try {
      objectId = new mongoose.Types.ObjectId(fileId)
    } catch (error) {
      throw new Error('Invalid file ID format')
    }

    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Check if file exists
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      throw new Error('File not found in GridFS')
    }

    // Delete file
    await bucket.delete(objectId)

    console.log('  File deleted from GridFS:', fileId)
    return true
  } catch (error) {
    console.error('  Error deleting from GridFS:', error)
    throw error
  }
}

/**
 * Get PDF file metadata from GridFS
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} File metadata
 */
export async function getPdfMetadata(fileId) {
  try {
    // Validate fileId
    if (!fileId) {
      throw new Error('File ID is required')
    }

    // Convert to ObjectId
    let objectId
    try {
      objectId = new mongoose.Types.ObjectId(fileId)
    } catch (error) {
      throw new Error('Invalid file ID format')
    }

    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Find file
    const files = await bucket.find({ _id: objectId }).toArray()
    if (files.length === 0) {
      throw new Error('File not found in GridFS')
    }

    const file = files[0]

    return {
      id: file._id.toString(),
      filename: file.filename,
      length: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      contentType: file.metadata?.contentType || 'application/pdf',
    }
  } catch (error) {
    console.error('  Error getting metadata from GridFS:', error)
    throw error
  }
}

/**
 * List all PDF files in GridFS
 * @param {Object} filter - Optional filter criteria
 * @param {number} limit - Maximum number of files to return
 * @returns {Promise<Array>} Array of file metadata
 */
export async function listPdfFiles(filter = {}, limit = 100) {
  try {
    // Get GridFS bucket
    const bucket = getGridFSBucket()

    // Find files
    const files = await bucket.find(filter).limit(limit).toArray()

    return files.map((file) => ({
      id: file._id.toString(),
      filename: file.filename,
      length: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      contentType: file.metadata?.contentType || 'application/pdf',
    }))
  } catch (error) {
    console.error('  Error listing files from GridFS:', error)
    throw error
  }
}

/**
 * Generate temporary URL for PDF access
 * Note: This is a placeholder - actual implementation would require
 * a separate API endpoint to serve the file
 * @param {string} fileId - File ID
 * @returns {string} URL to access the PDF
 */
export function getPdfUrl(fileId) {
  if (!fileId) {
    throw new Error('File ID is required')
  }

  // Return API endpoint URL for downloading the file
  // This would need to be implemented as an API route
  return `/api/files/${fileId}`
}

/**
 * Check if GridFS is initialized
 * @returns {boolean} True if initialized
 */
export function isGridFSInitialized() {
  return gfsBucket !== null
}

/**
 * Get file size limit
 * @returns {number} Maximum file size in bytes
 */
export function getMaxFileSize() {
  return MAX_FILE_SIZE
}

/**
 * Validate PDF file
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Filename
 * @returns {Object} Validation result
 */
export function validatePdfFile(buffer, filename) {
  const errors = []

  // Check buffer
  if (!buffer || !Buffer.isBuffer(buffer)) {
    errors.push('Invalid file buffer')
  }

  // Check size
  if (buffer && buffer.length > MAX_FILE_SIZE) {
    errors.push(
      `File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`
    )
  }

  // Check filename
  if (!filename || typeof filename !== 'string') {
    errors.push('Invalid filename')
  }

  // Check file extension
  if (filename && !filename.toLowerCase().endsWith('.pdf')) {
    errors.push('File must be a PDF')
  }

  // Check if buffer starts with PDF signature
  if (buffer && buffer.length > 4) {
    const pdfSignature = buffer.toString('utf8', 0, 4)
    if (pdfSignature !== '%PDF') {
      errors.push('File does not appear to be a valid PDF')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Initialize GridFS when MongoDB connection is ready
if (mongoose.connection.readyState === 1) {
  initGridFS()
} else {
  mongoose.connection.once('open', () => {
    initGridFS()
  })
}

export default {
  uploadPdfToGridFS,
  downloadPdfFromGridFS,
  getPdfStreamFromGridFS,
  deletePdfFromGridFS,
  getPdfMetadata,
  listPdfFiles,
  getPdfUrl,
  isGridFSInitialized,
  getMaxFileSize,
  validatePdfFile,
}

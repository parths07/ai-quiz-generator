import { getPdfStreamFromGridFS, getPdfMetadata } from '../../../lib/gridfs'

/**
 * API Route: Download PDF from GridFS
 * GET /api/files/[fileId] - Stream PDF file
 */
export default async function handler(req, res) {
  const { fileId } = req.query

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate fileId
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' })
    }

    console.log('📥 Downloading file from GridFS:', fileId)

    // Get file metadata
    const metadata = await getPdfMetadata(fileId)

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${metadata.filename}"`
    )
    res.setHeader('Content-Length', metadata.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year

    // Stream file to response
    const stream = await getPdfStreamFromGridFS(fileId)
    stream.pipe(res)

    console.log('  File streamed successfully:', fileId)
  } catch (error) {
    console.error('  Error downloading file:', error)

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'File not found',
        details: error.message,
      })
    }

    if (error.message.includes('Invalid file ID')) {
      return res.status(400).json({
        error: 'Invalid file ID',
        details: error.message,
      })
    }

    return res.status(500).json({
      error: 'Failed to download file',
      details: error.message,
    })
  }
}

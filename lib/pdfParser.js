import pdfParse from 'pdf-parse'

/**
 * PDF Parser Utility
 * Handles PDF text extraction using pdf-parse library
 * Compatible with Next.js and Vercel serverless functions
 */

/**
 * Extract all text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{text: string, pages: number, info: object}>}
 */
export async function extractFullText(buffer) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    // Parse the PDF
    const data = await pdfParse(buffer)

    // Clean up the extracted text
    const cleanedText = cleanTextContent(data.text)

    return {
      text: cleanedText,
      pages: data.numpages,
      info: data.info,
    }
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`)
  }
}

/**
 * Extract text from a specific page range
 * @param {Buffer} buffer - PDF file buffer
 * @param {number} startPage - Starting page (1-indexed)
 * @param {number} endPage - Ending page (1-indexed)
 * @returns {Promise<string>}
 */
export async function extractPageRange(buffer, startPage, endPage) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    if (startPage < 1 || endPage < 1) {
      throw new Error('Page numbers must be greater than 0')
    }

    if (startPage > endPage) {
      throw new Error('Start page must be less than or equal to end page')
    }

    // Parse the PDF with page rendering
    const data = await pdfParse(buffer, {
      max: endPage, // Only parse up to endPage for efficiency
    })

    // Check if requested pages exist
    if (startPage > data.numpages || endPage > data.numpages) {
      throw new Error(
        `Requested pages (${startPage}-${endPage}) exceed total pages (${data.numpages})`
      )
    }

    // Extract text for the specified range
    // Note: pdf-parse doesn't provide per-page text directly,
    // so we need to use a custom page render function
    let pageTexts = []
    
    const options = {
      pagerender: async (pageData) => {
        const pageNum = pageData.pageNumber
        if (pageNum >= startPage && pageNum <= endPage) {
          const textContent = await pageData.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          pageTexts.push({ pageNum, text: pageText })
        }
      },
    }

    await pdfParse(buffer, options)

    // Sort by page number and combine
    pageTexts.sort((a, b) => a.pageNum - b.pageNum)
    const combinedText = pageTexts.map(p => p.text).join('\n\n')

    return cleanTextContent(combinedText)
  } catch (error) {
    throw new Error(`Failed to extract page range: ${error.message}`)
  }
}

/**
 * Get the total number of pages in a PDF
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<number>}
 */
export async function getPageCount(buffer) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    // Parse PDF metadata only (faster than full parse)
    const data = await pdfParse(buffer, {
      max: 0, // Don't parse any pages, just get metadata
    })

    return data.numpages
  } catch (error) {
    throw new Error(`Failed to get page count: ${error.message}`)
  }
}

/**
 * Extract text from a single page
 * @param {Buffer} buffer - PDF file buffer
 * @param {number} pageNumber - Page number (1-indexed)
 * @returns {Promise<string>}
 */
export async function extractPageText(buffer, pageNumber) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    if (pageNumber < 1) {
      throw new Error('Page number must be greater than 0')
    }

    // Use extractPageRange for a single page
    return await extractPageRange(buffer, pageNumber, pageNumber)
  } catch (error) {
    throw new Error(`Failed to extract page ${pageNumber}: ${error.message}`)
  }
}

/**
 * Clean extracted text by removing excessive whitespace
 * @param {string} text - Raw extracted text
 * @returns {string}
 */
function cleanTextContent(text) {
  if (!text) return ''

  return (
    text
      // Replace multiple spaces with single space
      .replace(/  +/g, ' ')
      // Replace multiple newlines with double newline
      .replace(/\n\n+/g, '\n\n')
      // Trim whitespace from each line
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Remove leading/trailing whitespace
      .trim()
  )
}

/**
 * Check if a PDF contains extractable text
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<boolean>}
 */
export async function hasExtractableText(buffer) {
  try {
    const { text } = await extractFullText(buffer)
    // Consider PDF as having text if it has more than 50 characters
    return text.length > 50
  } catch (error) {
    console.error('Error checking for extractable text:', error.message)
    return false
  }
}

/**
 * Get PDF metadata and basic information
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<object>}
 */
export async function getPdfInfo(buffer) {
  try {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    const data = await pdfParse(buffer, { max: 0 })

    return {
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
    }
  } catch (error) {
    throw new Error(`Failed to get PDF info: ${error.message}`)
  }
}

/**
 * Extract text from all pages individually
 * Returns an array of page objects with page number, text, and character count
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Array<{pageNumber: number, text: string, characterCount: number}>>}
 */
export async function extractAllPages(buffer) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    const pageTexts = []

    // Custom page render function to extract text from each page
    const options = {
      pagerender: async (pageData) => {
        const pageNum = pageData.pageNumber
        const textContent = await pageData.getTextContent()
        const pageText = textContent.items.map((item) => item.str).join(' ')
        const cleanedText = cleanTextContent(pageText)

        pageTexts.push({
          pageNumber: pageNum,
          text: cleanedText,
          characterCount: cleanedText.length,
        })
      },
    }

    await pdfParse(buffer, options)

    // Sort by page number
    pageTexts.sort((a, b) => a.pageNumber - b.pageNumber)

    return pageTexts
  } catch (error) {
    throw new Error(`Failed to extract all pages: ${error.message}`)
  }
}

/**
 * Extract text page-by-page with metadata and progress logging
 * Returns detailed information including pages array and metadata
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{totalPages: number, pages: Array, metadata: object}>}
 */
export async function extractPageByPage(buffer) {
  try {
    // Validate input
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer: Expected a Buffer object')
    }

    // First, get metadata
    const pdfInfo = await getPdfInfo(buffer)
    const totalPages = pdfInfo.pages

    console.log(`📄 Starting page-by-page extraction for ${totalPages} pages...`)

    const pages = []
    let processedPages = 0

    // Custom page render function to extract text from each page
    const options = {
      pagerender: async (pageData) => {
        const pageNum = pageData.pageNumber
        
        try {
          const textContent = await pageData.getTextContent()
          const pageText = textContent.items.map((item) => item.str).join(' ')
          const cleanedText = cleanTextContent(pageText)

          pages.push({
            pageNumber: pageNum,
            text: cleanedText,
            characterCount: cleanedText.length,
          })

          processedPages++

          // Progress logging for large PDFs (every 10 pages or at milestones)
          if (totalPages > 20) {
            if (processedPages % 10 === 0 || processedPages === totalPages) {
              console.log(`   📖 Extracting page ${processedPages}/${totalPages}...`)
            }
          }
        } catch (pageError) {
          // Handle pages with no text (images/blank pages)
          console.warn(`   ⚠️  Page ${pageNum} has no extractable text (blank/image page)`)
          pages.push({
            pageNumber: pageNum,
            text: '',
            characterCount: 0,
          })
          processedPages++
        }
      },
    }

    await pdfParse(buffer, options)

    // Sort by page number
    pages.sort((a, b) => a.pageNumber - b.pageNumber)

    console.log(`  Extracted ${pages.length} pages successfully`)

    // Calculate total characters
    const totalCharacters = pages.reduce((sum, page) => sum + page.characterCount, 0)
    console.log(`   📊 Total characters: ${totalCharacters.toLocaleString()}`)

    return {
      totalPages: pages.length,
      pages: pages,
      metadata: {
        title: pdfInfo.info?.Title || null,
        author: pdfInfo.info?.Author || null,
        subject: pdfInfo.info?.Subject || null,
        creator: pdfInfo.info?.Creator || null,
        producer: pdfInfo.info?.Producer || null,
        creationDate: pdfInfo.info?.CreationDate || null,
        modificationDate: pdfInfo.info?.ModDate || null,
        pdfVersion: pdfInfo.version || null,
        totalCharacters: totalCharacters,
      },
    }
  } catch (error) {
    throw new Error(`Failed to extract pages: ${error.message}`)
  }
}

/**
 * Validate if a buffer contains a valid PDF
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{isValid: boolean, error: string|null, pageCount: number|null}>}
 */
export async function isValidPDF(buffer) {
  try {
    // Check if buffer exists and is a Buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        isValid: false,
        error: 'Invalid buffer: Expected a Buffer object',
        pageCount: null,
      }
    }

    // Check minimum size (PDF header is at least 5 bytes: %PDF-)
    if (buffer.length < 5) {
      return {
        isValid: false,
        error: 'File too small to be a valid PDF',
        pageCount: null,
      }
    }

    // Check PDF signature (should start with %PDF-)
    const header = buffer.slice(0, 5).toString('ascii')
    if (!header.startsWith('%PDF-')) {
      return {
        isValid: false,
        error: 'Invalid PDF signature: File does not start with %PDF-',
        pageCount: null,
      }
    }

    // Try to parse the PDF
    const data = await pdfParse(buffer, { max: 0 })

    // Check if PDF has pages
    if (!data.numpages || data.numpages < 1) {
      return {
        isValid: false,
        error: 'PDF has no pages',
        pageCount: 0,
      }
    }

    return {
      isValid: true,
      error: null,
      pageCount: data.numpages,
    }
  } catch (error) {
    return {
      isValid: false,
      error: `PDF validation failed: ${error.message}`,
      pageCount: null,
    }
  }
}

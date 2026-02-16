/**
 * Test script for PDF upload API
 * Run with: node test-upload-api.js
 * 
 * Note: Make sure your dev server is running (npm run dev)
 * and you have a test PDF file ready
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

async function testUpload() {
  try {
    console.log('🧪 Testing PDF Upload API...\n')

    // Check if test PDF exists
    const testPdfPath = process.argv[2] || './test.pdf'
    
    if (!fs.existsSync(testPdfPath)) {
      console.error('Test PDF not found!')
      console.log('Usage: node test-upload-api.js <path-to-pdf>')
      console.log('Example: node test-upload-api.js ./sample.pdf')
      process.exit(1)
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', fs.createReadStream(testPdfPath))
    formData.append('title', 'Test Book')
    formData.append('author', 'Test Author')

    console.log('📤 Uploading:', testPdfPath)
    console.log('📊 File size:', (fs.statSync(testPdfPath).size / 1024 / 1024).toFixed(2), 'MB\n')

    // Send request
    const response = await fetch('http://localhost:3000/api/books/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      console.log('  Upload successful!\n')
      console.log('Book Details:')
      console.log('  ID:', data.book.id)
      console.log('  Title:', data.book.title)
      console.log('  Author:', data.book.author)
      console.log('  File:', data.book.fileName)
      console.log('  Pages:', data.book.totalPages)
      console.log('  Size:', (data.book.fileSize / 1024 / 1024).toFixed(2), 'MB')
      console.log('  Text Length:', data.book.textLength.toLocaleString(), 'characters')
      console.log('  Uploaded:', new Date(data.book.uploadDate).toLocaleString())
    } else {
      console.error('  Upload failed!')
      console.error('Error:', data.error)
      if (data.details) {
        console.error('Details:', data.details)
      }
    }
  } catch (error) {
    console.error('  Test failed!')
    console.error('Error:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure your dev server is running:')
      console.error('   npm run dev')
    }
  }
}

testUpload()

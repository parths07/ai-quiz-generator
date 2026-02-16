import { useState } from 'react'
import { useRouter } from 'next/router'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

/**
 * Test page for PDF upload functionality
 * Visit: http://localhost:3000/upload-test
 */
export default function UploadTest() {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill title from filename
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''))
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      showToast('Please select a PDF file', 'error')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title) formData.append('title', title)
      if (author) formData.append('author', author)

      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.book)
        showToast('Book uploaded successfully! Redirecting to quiz generator...', 'success', 3000)
        
        // Redirect to quiz generator after 2 seconds
        setTimeout(() => {
          router.push('/quiz-generator')
        }, 2000)
      } else {
        setError(data.error || 'Upload failed')
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch (err) {
      const errorMsg = 'Network error: ' + err.message
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PDF Upload Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF File *
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter book title (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter author name (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-3">
                Upload Successful!
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">ID:</span> {result.id}
              </p>
              <p>
                <span className="font-medium">Title:</span> {result.title}
              </p>
              {result.author && (
                <p>
                  <span className="font-medium">Author:</span> {result.author}
                </p>
              )}
              <p>
                <span className="font-medium">File:</span> {result.fileName}
              </p>
              <p>
                <span className="font-medium">Pages:</span> {result.totalPages}
              </p>
              <p>
                <span className="font-medium">Size:</span>{' '}
                {(result.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
              <p>
                <span className="font-medium">Text Length:</span>{' '}
                {result.textLength.toLocaleString()} characters
              </p>
              <p>
                <span className="font-medium">Uploaded:</span>{' '}
                {new Date(result.uploadDate).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 font-semibold mb-2">Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Select a PDF file (max 10MB)</li>
            <li>Optionally enter title and author</li>
            <li>Click Upload to process the PDF</li>
            <li>The PDF text will be extracted and saved to MongoDB</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

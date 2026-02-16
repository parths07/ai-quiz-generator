import { useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import connectDB from '../../lib/mongodb'
import Book from '../../models/Book'
import PageHead from '../../components/PageHead'
import ErrorMessage from '../../components/ErrorMessage'
import QuizGenerationForm from '../../components/QuizGenerationForm'

// Import PDFViewer dynamically to avoid SSR issues
const PDFViewer = dynamic(() => import('../../components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-12">
      <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Loading PDF viewer...</p>
    </div>
  ),
})

/**
 * Book Detail Page
 * View book information and generate quizzes
 */
export default function BookDetail({ book }) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerateQuiz = async (params) => {
    setError(null)
    setGenerating(true)

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (data.success) {
        const quizId = data.quizId || data.quiz?.id
        router.push(`/quiz/${quizId}`)
      } else {
        setError(data.error || 'Failed to generate quiz')
      }
    } catch (err) {
      setError('Network error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHead title={book.title} description={`Generate quizzes from ${book.title}`} />

      <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-4 sm:mb-6 text-blue-600 hover:text-blue-700 flex items-center text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>

          {/* Book Information */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h1 
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 truncate cursor-help" 
              title={book.title}
            >
              {book.title}
            </h1>
            
            {book.author && (
              <p 
                className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4 truncate cursor-help" 
                title={book.author}
              >
                by {book.author}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Pages</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{book.totalPages}</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">File Size</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {(book.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Uploaded</div>
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  <span className="hidden sm:inline">{new Date(book.uploadDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                  <span className="sm:hidden">{new Date(book.uploadDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: '2-digit'
                  })}</span>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Pages Stored</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  {book.pages?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Viewer Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 sm:mb-6">
            <div className="p-4 sm:p-6 pb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Book Preview</h2>
            </div>
            {book.pdfFileId ? (
              <PDFViewer
                pdfUrl={`/api/books/pdf/${book.pdfFileId}`}
                fileName={book.fileName}
                totalPages={book.totalPages}
              />
            ) : (
              <div className="p-4 sm:p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs sm:text-sm text-yellow-700">
                        PDF preview not available. This book was uploaded before PDF storage was enabled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quiz Generation Form */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Generate Quiz</h2>

            {error && <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-4 sm:mb-6" />}

            <QuizGenerationForm 
              book={book} 
              onGenerate={handleGenerateQuiz} 
              loading={generating} 
            />
          </div>
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ params }) {
  try {
    await connectDB()
    const book = await Book.findById(params.id).lean()

    if (!book) {
      return { notFound: true }
    }

    return {
      props: {
        book: JSON.parse(JSON.stringify(book)),
      },
    }
  } catch (error) {
    console.error('Error fetching book:', error)
    return { notFound: true }
  }
}

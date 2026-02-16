import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import PageHead from '../components/PageHead'
import ErrorMessage from '../components/ErrorMessage'
import QuizGenerationForm from '../components/QuizGenerationForm'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

/**
 * Quiz Generator Page - Production Ready Design
 * Generate quizzes from uploaded books using Gemini AI
 * Visit: http://localhost:3000/quiz-generator
 */
export default function QuizGenerator() {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Fetch books on mount
  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/books?limit=100')
      const data = await response.json()

      if (data.success) {
        setBooks(data.data.books)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch books: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBook = (book) => {
    // Prevent selection if quiz is being generated
    if (generating) {
      showToast('Please wait for the current quiz generation to complete', 'warning')
      return
    }
    
    setSelectedBook(book)
    // Smooth scroll to the form
    setTimeout(() => {
      document.getElementById(`book-${book._id}`)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      })
    }, 100)
  }

  const handleGenerateQuiz = async (params) => {
    if (generating) {
      showToast('Quiz generation already in progress', 'warning')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (data.success) {
        const quizId = data.quizId || data.quiz?.id
        showToast('Quiz generated successfully! Redirecting...', 'success', 2000)
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push(`/quiz/${quizId}`)
        }, 1500)
      } else {
        const errorMsg = data.error || 'Failed to generate quiz'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        setGenerating(false)
      }
    } catch (err) {
      const errorMsg = 'Network error: ' + err.message
      setError(errorMsg)
      showToast(errorMsg, 'error')
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHead 
        title="Quiz Generator - AI-Powered Quiz Creation" 
        description="Generate AI-powered quizzes from your uploaded books with custom settings"
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <button
              onClick={() => router.push('/books')}
              className="text-white/80 hover:text-white font-medium mb-4 flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Books
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  Generate Your Quiz
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl">
                  Select a book, customize your settings, and let AI create the perfect quiz for you
                </p>
              </div>
              
              {/* Stats */}
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{books.length}</div>
                  <div className="text-sm text-blue-200">Books Available</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">AI</div>
                  <div className="text-sm text-blue-200">Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          {error && (
            <ErrorMessage error={error} onDismiss={() => setError(null)} className="mb-6" />
          )}

          {/* Instructions Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Book</h2>
                <p className="text-gray-600 text-lg">
                  Choose a book from your library below, then click "Select & Generate Quiz" to configure your quiz settings
                </p>
              </div>
            </div>
          </div>

          {/* Books List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your books...</p>
            </div>
          ) : books.length === 0 ? (
            // No Books Empty State
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Books Yet</h3>
              <p className="text-gray-600 mb-8">
                Upload your first book to start creating AI-powered quizzes
              </p>
              <button
                onClick={() => router.push('/books')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                📚 Upload Your First Book
              </button>
            </div>
          ) : (
            // Books List - Horizontal Cards
            <div className="space-y-4">
              {books.map((book) => (
                <div
                  key={book._id}
                  id={`book-${book._id}`}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
                    selectedBook?._id === book._id 
                      ? 'border-blue-500 shadow-2xl' 
                      : 'border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* Book Icon/Cover */}
                      <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                          {book.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            {book.totalPages} pages
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {(book.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(book.uploadDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          {book.author && (
                            <span className="flex items-center gap-1.5 truncate">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {book.author}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0 w-full md:w-auto">
                        {selectedBook?._id === book._id ? (
                          <button
                            onClick={() => setSelectedBook(null)}
                            disabled={generating}
                            className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectBook(book)}
                            disabled={generating}
                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {generating ? 'Generating...' : 'Select & Generate Quiz'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quiz Form - Shows when book is selected */}
                  {selectedBook?._id === book._id && (
                    <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 animate-slideDown">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">2</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Configure Your Quiz</h3>
                          <p className="text-sm text-gray-600">Customize settings and generate your quiz</p>
                        </div>
                      </div>
                      <QuizGenerationForm 
                        book={selectedBook} 
                        onGenerate={handleGenerateQuiz} 
                        loading={generating} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </>
  )
}

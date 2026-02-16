import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

/**
 * Books List Page
 * Displays all uploaded books with pagination
 * Visit: http://localhost:3000/books
 */
export default function BooksPage() {
  const router = useRouter()
  const { toast, showToast, hideToast } = useToast()
  const [books, setBooks] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch books on mount and when page changes
  useEffect(() => {
    fetchBooks(currentPage)
  }, [currentPage])

  const fetchBooks = async (page) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/books?page=${page}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setBooks(data.data.books)
        setPagination(data.data.pagination)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch books: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteBook = async (bookId, bookTitle) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        showToast('Book deleted successfully!', 'success')
        fetchBooks(currentPage)
      } else {
        showToast('Failed to delete book: ' + data.error, 'error')
      }
    } catch (err) {
      showToast('Error deleting book: ' + err.message, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Books Library</h1>
          <div className="flex gap-2">
            <a
              href="/upload-test"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all transform hover:scale-105 btn-press"
            >
              Upload New Book
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div>
          {/* Books List */}
          <div>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading books...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 mb-4">No books uploaded yet</p>
                <a
                  href="/upload-test"
                  className="text-blue-600 hover:underline"
                >
                  Upload your first book
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {books.map((book, index) => (
                    <div
                      key={book._id}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all card-hover animate-fadeIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-gray-600 mb-2">
                              by {book.author}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>📄 {book.totalPages} pages</span>
                            <span>
                              💾 {(book.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span>
                              📅{' '}
                              {new Date(book.uploadDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => router.push(`/books/${book._id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-all transform hover:scale-105 btn-press"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => deleteBook(book._id, book.title)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-all transform hover:scale-105 btn-press"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="px-4 py-2 bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 bg-white border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}

                {pagination && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing {books.length} of {pagination.totalBooks} books
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

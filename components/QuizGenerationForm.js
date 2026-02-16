import { useState } from 'react'
import LoadingModal from './LoadingModal'

/**
 * Reusable Quiz Generation Form Component
 * Used in both book detail page and quiz generator page
 */
export default function QuizGenerationForm({ book, onGenerate, loading }) {
  const [usePageRange, setUsePageRange] = useState(false)
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(book?.totalPages ? Math.min(10, book.totalPages) : 10)
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')

  const handleSubmit = (e) => {
    e.preventDefault()
    onGenerate({
      bookId: book._id,
      pageRange: usePageRange ? { start: parseInt(startPage), end: parseInt(endPage) } : null,
      numberOfQuestions: parseInt(numQuestions),
      difficulty
    })
  }

  return (
    <>
      {loading && (
        <LoadingModal 
          title="Generating Your Quiz"
          message="Our AI is analyzing your book and creating intelligent questions tailored to your difficulty level..."
          duration="20-40 seconds"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Range Toggle */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={usePageRange}
            onChange={(e) => setUsePageRange(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="ml-3 font-medium text-gray-900">
            Generate quiz from specific page range
          </span>
        </label>
        <p className="text-sm text-gray-600 mt-2 ml-8">
          Leave unchecked to use the entire book ({book?.totalPages || 0} pages)
        </p>
      </div>

      {/* Page Range Inputs */}
      {usePageRange && (
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Page
            </label>
            <input
              type="number"
              min="1"
              max={book?.totalPages || 1000}
              value={startPage}
              onChange={(e) => setStartPage(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Page
            </label>
            <input
              type="number"
              min={startPage}
              max={book?.totalPages || 1000}
              value={endPage}
              onChange={(e) => setEndPage(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
        </div>
      )}

      {/* Number of Questions Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Number of Questions: <span className="text-blue-600 font-bold text-lg">{numQuestions}</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={numQuestions}
          onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(numQuestions / 20) * 100}%, #e5e7eb ${(numQuestions / 20) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>1 question</span>
          <span>10 questions</span>
          <span>20 questions</span>
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Difficulty Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['easy', 'medium', 'hard'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={`py-3 px-4 rounded-lg font-semibold transition-all transform ${
                difficulty === level
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] btn-press"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            Generating Quiz...
          </span>
        ) : (
          'Generate Quiz with AI'
        )}
      </button>
    </form>
    </>
  )
}

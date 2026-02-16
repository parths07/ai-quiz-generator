/**
 * Error Message Component
 * Displays error messages with optional dismiss button
 */
export default function ErrorMessage({ error, onDismiss, className = '' }) {
  if (!error) return null

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <span className="text-red-600 mr-2 text-xl" aria-hidden="true">⚠️</span>
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors ml-4"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

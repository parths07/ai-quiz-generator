/**
 * Professional Loading Modal Component
 * Full-screen overlay with animated spinner and message
 */
export default function LoadingModal({ title, message, duration }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl transform animate-fadeIn">
        {/* Animated Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin-slow"></div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {title || 'Processing...'}
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-4 leading-relaxed">
          {message || 'Please wait while we process your request...'}
        </p>

        {/* Duration Hint */}
        {duration && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg py-2 px-4 inline-block">
            ⏱️ Usually takes {duration}
          </div>
        )}

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

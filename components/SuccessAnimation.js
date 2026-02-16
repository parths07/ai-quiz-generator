/**
 * Success Animation Component
 * Shows animated checkmark with message
 */
export default function SuccessAnimation({ message, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl animate-slideInBottom">
        {/* Animated Checkmark */}
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Success!
        </h3>
        <p className="text-gray-600 mb-6">
          {message || 'Operation completed successfully'}
        </p>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all transform hover:scale-105 btn-press"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}

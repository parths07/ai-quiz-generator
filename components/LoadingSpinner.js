/**
 * Loading Spinner Component
 * Reusable loading indicator with optional text
 */
export default function LoadingSpinner({ size = 'md', text, className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="mt-3 text-gray-600 text-sm font-medium">{text}</p>
      )}
    </div>
  )
}

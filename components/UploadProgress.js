import { useState, useEffect } from 'react'

/**
 * Upload Progress Component
 * Shows animated progress bar with steps
 */
export default function UploadProgress({ stage = 'uploading', progress = 0 }) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  const stages = [
    { key: 'uploading', label: 'Uploading PDF', icon: '📤' },
    { key: 'extracting', label: 'Extracting Text', icon: '📄' },
    { key: 'processing', label: 'Processing Pages', icon: '⚙️' },
    { key: 'saving', label: 'Saving to Database', icon: '💾' },
    { key: 'complete', label: 'Complete!', icon: ' ' }
  ]

  const currentStageIndex = stages.findIndex(s => s.key === stage)

  return (
    <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span className="font-semibold text-blue-600">{Math.round(displayProgress)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
          >
            <div className="h-full w-full bg-white opacity-20 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {stages.map((s, index) => {
          const isActive = index === currentStageIndex
          const isComplete = index < currentStageIndex
          const isPending = index > currentStageIndex

          return (
            <div 
              key={s.key}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive ? 'bg-blue-50 scale-105' : 
                isComplete ? 'bg-green-50' : 
                'bg-gray-50 opacity-50'
              }`}
            >
              <div className={`text-2xl transition-transform duration-300 ${
                isActive ? 'animate-bounce' : ''
              }`}>
                {isComplete ? ' ' : s.icon}
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  isActive ? 'text-blue-900' : 
                  isComplete ? 'text-green-900' : 
                  'text-gray-600'
                }`}>
                  {s.label}
                </div>
              </div>
              {isActive && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
              {isComplete && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

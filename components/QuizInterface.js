import { useState } from 'react'

/**
 * Interactive Quiz Interface Component
 * Shows one question at a time with immediate feedback
 */
export default function QuizInterface({ quiz, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [userAnswers, setUserAnswers] = useState([])
  const [score, setScore] = useState(0)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    setUserAnswers([
      ...userAnswers,
      {
        questionIndex: currentQuestionIndex,
        question: currentQuestion.question,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
    ])

    if (isCorrect) setScore(score + 1)
    setShowFeedback(true)
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete({
        score: score + (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0),
        total: quiz.questions.length,
        userAnswers: [
          ...userAnswers,
          {
            questionIndex: currentQuestionIndex,
            question: currentQuestion.question,
            selectedAnswer,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect: selectedAnswer === currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation,
          },
        ],
      })
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Section */}
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-blue-600">
            Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
            {quiz.difficulty?.toUpperCase() || 'MEDIUM'}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const optionLetter = ['A', 'B', 'C', 'D'][index]
            const isSelected = selectedAnswer === optionLetter
            const isCorrect = optionLetter === currentQuestion.correctAnswer

            let bgColor = 'bg-gray-50 hover:bg-gray-100 border-gray-200'
            let textColor = 'text-gray-800'
            let borderWidth = 'border-2'

            if (showFeedback) {
              if (isCorrect) {
                bgColor = 'bg-green-50 border-green-500'
                textColor = 'text-green-900'
                borderWidth = 'border-2'
              } else if (isSelected && !isCorrect) {
                bgColor = 'bg-red-50 border-red-500'
                textColor = 'text-red-900'
                borderWidth = 'border-2'
              }
            } else if (isSelected) {
              bgColor = 'bg-blue-50 border-blue-500'
              textColor = 'text-blue-900'
              borderWidth = 'border-2'
            }

            return (
              <button
                key={optionLetter}
                onClick={() => !showFeedback && setSelectedAnswer(optionLetter)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-lg ${borderWidth} transition-all duration-200 ${bgColor} ${
                  !showFeedback && 'cursor-pointer hover:shadow-md'
                } ${showFeedback && 'cursor-default'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                      showFeedback && isCorrect
                        ? 'bg-green-500 border-green-600 text-white'
                        : showFeedback && isSelected && !isCorrect
                        ? 'bg-red-500 border-red-600 text-white'
                        : isSelected
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {optionLetter}
                  </span>
                  <span className={`flex-1 ${textColor} font-medium`}>{option}</span>
                  {showFeedback && isCorrect && (
                    <span className="text-2xl">✓</span>
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <span className="text-2xl">✗</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Feedback Section */}
        {showFeedback && (
          <div
            className={`mt-6 p-5 rounded-lg border-l-4 ${
              selectedAnswer === currentQuestion.correctAnswer
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <p className="font-bold text-lg mb-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <span className="text-green-700">🎉 Correct!</span>
              ) : (
                <span className="text-red-700">  Incorrect</span>
              )}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">Explanation: </span>
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {!showFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg disabled:shadow-none"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {isLastQuestion ? 'View Results' : 'Next Question'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useRouter } from 'next/router'
import connectDB from '../../lib/mongodb'
import Quiz from '../../models/Quiz'
import PageHead from '../../components/PageHead'

/**
 * Quiz Taking Page
 * Interactive quiz with scoring and explanations
 */
export default function QuizPage({ quiz }) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [revealedQuestions, setRevealedQuestions] = useState({})
  const [showFinalResults, setShowFinalResults] = useState(false)
  const [score, setScore] = useState(0)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const isAnswered = revealedQuestions[currentQuestionIndex]

  const handleAnswerSelect = (answer) => {
    if (revealedQuestions[currentQuestionIndex]) return // Don't allow changes after revealing

    // Set the selected answer
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    })

    // Immediately reveal the answer for this question
    setRevealedQuestions({
      ...revealedQuestions,
      [currentQuestionIndex]: true,
    })
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate final score
      let correct = 0
      quiz.questions.forEach((q, index) => {
        if (selectedAnswers[index] === q.correctAnswer) {
          correct++
        }
      })
      setScore(correct)
      setShowFinalResults(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const percentage = Math.round((score / quiz.numberOfQuestions) * 100)

  return (
    <>
      <PageHead title={quiz.title} description={`Take the quiz: ${quiz.title}`} />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {quiz.title}
                </h1>
                <p className="text-gray-600">
                  📚 Book: <span className="font-medium">{quiz.book?.title || 'Unknown'}</span>
                </p>
                {quiz.book?.author && (
                  <p className="text-gray-600 text-sm">by {quiz.book.author}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
              <div className="flex items-center">
                <span className="mr-2">📝</span>
                <span>{quiz.numberOfQuestions} Questions</span>
              </div>
              {quiz.pageRange && (
                <div className="flex items-center">
                  <span className="mr-2">📄</span>
                  <span>
                    Pages {quiz.pageRange.start}-{quiz.pageRange.end}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <span className="mr-2">📅</span>
                <span>{new Date(quiz.generatedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Results Banner */}
          {showFinalResults && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Quiz Complete! 🎉</h2>
              <p className={`text-5xl font-bold ${getScoreColor(percentage)} mb-2`}>
                {score} / {quiz.numberOfQuestions}
              </p>
              <p className="text-xl text-gray-600">
                {percentage}% Correct
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {percentage >= 80
                  ? 'Excellent work! 🌟'
                  : percentage >= 60
                  ? 'Good job! Keep practicing! 👍'
                  : 'Keep studying and try again! 📚'}
              </p>
            </div>
          )}

          {/* Progress Indicator */}
          {!showFinalResults && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700">
                  Question {currentQuestionIndex + 1} of {quiz.numberOfQuestions}
                </div>
                <div className="text-sm font-medium text-blue-600">
                  Score: {Object.keys(selectedAnswers).filter((key) => 
                    selectedAnswers[key] === quiz.questions[key].correctAnswer
                  ).length} / {Object.keys(selectedAnswers).length}
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quiz.numberOfQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Current Question */}
          {!showFinalResults && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start mb-6">
                <span className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold mr-4 text-lg">
                  {currentQuestionIndex + 1}
                </span>
                <h3 className="text-xl font-semibold text-gray-900 flex-1">
                  {currentQuestion.question}
                </h3>
                {isAnswered && (
                  <span className="ml-2 text-3xl">
                    {selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer ? ' ' : ' '}
                  </span>
                )}
              </div>

              <div className="space-y-3 ml-14">
                {currentQuestion.options.map((option, optIndex) => {
                  const optionLetter = option.charAt(0)
                  const isSelected = selectedAnswers[currentQuestionIndex] === optionLetter
                  const isCorrectOption = optionLetter === currentQuestion.correctAnswer

                  let optionClass = 'border-gray-300 hover:border-blue-400 bg-white cursor-pointer'
                  let textClass = 'text-gray-900'

                  if (isAnswered) {
                    if (isCorrectOption) {
                      optionClass = 'border-green-500 bg-green-100'
                      textClass = 'text-green-900 font-semibold'
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = 'border-red-500 bg-red-100'
                      textClass = 'text-red-900 font-semibold'
                    } else {
                      optionClass = 'border-gray-200 bg-gray-50 cursor-default'
                      textClass = 'text-gray-500'
                    }
                  } else if (isSelected) {
                    optionClass = 'border-blue-500 bg-blue-50'
                    textClass = 'text-blue-900'
                  }

                  return (
                    <label
                      key={optIndex}
                      className={`block p-4 rounded-lg border-2 transition-all ${optionClass} ${
                        isAnswered ? '' : 'hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={optionLetter}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(optionLetter)}
                          disabled={isAnswered}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <span className={`text-lg ${textClass}`}>
                          {option}
                          {isAnswered && isCorrectOption && (
                            <span className="ml-2 text-green-600 font-bold">✓ Correct</span>
                          )}
                          {isAnswered && isSelected && !isCorrectOption && (
                            <span className="ml-2 text-red-600 font-bold">✗ Wrong</span>
                          )}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Explanation (shown immediately after selection) */}
              {isAnswered && (
                <div className={`mt-6 ml-14 p-4 rounded-lg border-2 ${
                  selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm font-semibold mb-2 ${
                    selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer
                      ? 'text-green-900' : 'text-blue-900'
                  }`}>
                    💡 Explanation:
                  </p>
                  <p className={`text-sm ${
                    selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer
                      ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Question Button */}
              {isAnswered && (
                <div className="mt-6 ml-14">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-md hover:shadow-lg"
                  >
                    {isLastQuestion ? '🎉 See Final Results' : '➡️ Next Question'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {showFinalResults && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(quiz.book?.id ? `/books/${quiz.book.id}` : '/')}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-md hover:shadow-lg"
              >
                📚 Back to Book
              </button>
              <button
                onClick={() => router.push('/')}
                className="sm:w-auto px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                🏠 Home
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps({ params }) {
  try {
    await connectDB()
    const quiz = await Quiz.findById(params.quizId)
      .populate('bookId', 'title author totalPages')
      .lean()

    if (!quiz) {
      return { notFound: true }
    }

    // Transform bookId to book for easier access in component
    const transformedQuiz = {
      ...quiz,
      book: quiz.bookId ? {
        id: quiz.bookId._id,
        title: quiz.bookId.title,
        author: quiz.bookId.author,
        totalPages: quiz.bookId.totalPages
      } : null
    }

    return {
      props: {
        quiz: JSON.parse(JSON.stringify(transformedQuiz)),
      },
    }
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return { notFound: true }
  }
}

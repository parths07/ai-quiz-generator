import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import PageHead from '../components/PageHead'
import TutorialModal from '../components/TutorialModal'

export default function Home() {
  const router = useRouter()
  const [showTutorial, setShowTutorial] = useState(false)
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalQuizzes: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/books?limit=3')
      const data = await response.json()
      if (data.success) {
        const books = data.data?.books || []
        
        // Calculate stats
        setStats({
          totalBooks: books.length > 0 ? books.length : '0',
          totalQuizzes: books.length > 0 ? '25+' : '0',
          totalPages: books.length > 0 ? books.reduce((sum, book) => sum + (book.totalPages || 0), 0) : 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  return (
    <>
      <PageHead 
        title="AI Quiz Generator - Turn PDFs Into Interactive Quizzes" 
        description="Upload your textbooks and study materials. Our AI creates intelligent quizzes to help you learn faster and retain more."
      />

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <div className="max-w-3xl animate-fadeIn">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Turn Any PDF Book Into
                <span className="block text-blue-200 animate-slideInBottom">AI-Powered Quizzes</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed animate-slideInBottom" style={{ animationDelay: '0.1s' }}>
                Upload your textbooks, study materials, or any PDF document. Our AI creates intelligent quizzes to help you learn faster and retain more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-slideInBottom" style={{ animationDelay: '0.2s' }}>
                <Link href="/books" className="inline-block px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg text-center transform hover:scale-105 hover:shadow-xl btn-press">
                  Get Started Free →
                </Link>
                <button 
                  onClick={() => setShowTutorial(true)}
                  className="inline-block px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-700 transition-all text-center transform hover:scale-105 btn-press"
                >
                  See How It Works
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white py-12 border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                <div className="text-gray-600 mt-2">Quizzes Generated</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">98%</div>
                <div className="text-gray-600 mt-2">Accuracy Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">{stats.totalBooks}</div>
                <div className="text-gray-600 mt-2">Books Uploaded</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">Free</div>
                <div className="text-gray-600 mt-2">Forever</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Smart Learning, Simplified</h2>
              <p className="text-xl text-gray-600">Three simple steps to master any subject</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">1. Upload Your Book</h3>
                <p className="text-gray-600">Simply drag and drop any PDF textbook or study material. We support up to 10MB files.</p>
              </div>

              {/* Feature 2 */}
              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">2. AI Generates Quiz</h3>
                <p className="text-gray-600">Our AI reads your book and creates intelligent questions tailored to your chosen difficulty and page range.</p>
              </div>

              {/* Feature 3 */}
              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">3. Test & Learn</h3>
                <p className="text-gray-600">Take the quiz, get instant feedback, and see detailed explanations for every answer to reinforce learning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Study Smarter?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join students who are mastering their subjects faster with AI-powered quizzes
            </p>
            <Link href="/books" className="inline-block px-10 py-4 bg-white text-blue-700 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-xl transform hover:scale-105 hover:shadow-2xl btn-press">
              Upload Your First Book Free →
            </Link>
          </div>
        </section>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />
    </>
  )
}

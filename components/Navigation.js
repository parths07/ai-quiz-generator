import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

/**
 * Navigation Component
 * Sticky header with responsive mobile menu
 */
export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const isActive = (path) => router.pathname === path

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            🤖 AI Quiz Generator
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <NavLink href="/" active={isActive('/')}>
              Home
            </NavLink>
            <NavLink href="/books" active={isActive('/books')}>
              My Books
            </NavLink>
            <NavLink href="/quiz-generator" active={isActive('/quiz-generator')}>
              Generate Quiz
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <MobileNavLink href="/" active={isActive('/')} onClick={() => setMobileMenuOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/books" active={isActive('/books')} onClick={() => setMobileMenuOpen(false)}>
                My Books
              </MobileNavLink>
              <MobileNavLink href="/quiz-generator" active={isActive('/quiz-generator')} onClick={() => setMobileMenuOpen(false)}>
                Generate Quiz
              </MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, active, onClick, children }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  )
}

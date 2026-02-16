import { useState, useCallback } from 'react'

/**
 * Custom hook for managing toast notifications
 * Usage:
 * const { toast, showToast } = useToast()
 * showToast('Success!', 'success')
 */
export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    setToast({ message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  return {
    toast,
    showToast,
    hideToast
  }
}

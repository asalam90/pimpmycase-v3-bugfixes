import { useEffect, useRef } from 'react'

/**
 * Hook to handle pinch-to-zoom gestures for resizing selected elements
 * @param {boolean} isElementSelected - Whether an element is currently selected
 * @param {function} onScale - Callback function to handle scale changes (receives new scale multiplier)
 * @returns {object} - Touch event handlers to attach to container
 */
export const usePinchToScale = (isElementSelected, onScale) => {
  const touchStartDistance = useRef(null)
  const initialScale = useRef(1)
  const isPinching = useRef(false)

  useEffect(() => {
    // Reset when selection changes
    if (!isElementSelected) {
      touchStartDistance.current = null
      initialScale.current = 1
      isPinching.current = false
    }
  }, [isElementSelected])

  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e) => {
    if (!isElementSelected) return

    if (e.touches.length === 2) {
      isPinching.current = true
      touchStartDistance.current = getDistance(e.touches[0], e.touches[1])
      initialScale.current = 1
      e.preventDefault()
    }
  }

  const handleTouchMove = (e) => {
    if (!isElementSelected || !isPinching.current) return

    if (e.touches.length === 2 && touchStartDistance.current) {
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scaleChange = currentDistance / touchStartDistance.current

      // Call the onScale callback with the scale multiplier
      onScale(scaleChange)

      e.preventDefault()
    }
  }

  const handleTouchEnd = (e) => {
    if (!isElementSelected) return

    if (e.touches.length < 2) {
      isPinching.current = false
      touchStartDistance.current = null
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}

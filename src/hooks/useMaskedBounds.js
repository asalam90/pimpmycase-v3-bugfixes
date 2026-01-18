import { useState, useEffect, useRef } from 'react'

/**
 * High-performance hook for tracking masked bounds
 * Uses ResizeObserver for efficient size change detection
 * Only recalculates when container or masked element actually changes size
 *
 * @param {React.RefObject} containerRef - Ref to the container element
 * @returns {Object|null} maskedBounds - The calculated bounds { left, top, right, bottom }
 */
export const useMaskedBounds = (containerRef) => {
  const [maskedBounds, setMaskedBounds] = useState(null)
  const observerRef = useRef(null)
  const boundsRef = useRef(null)

  useEffect(() => {
    const computeBounds = () => {
      if (!containerRef.current) return null

      const rect = containerRef.current.getBoundingClientRect()
      const probe = containerRef.current.querySelector('[data-masked-content]')

      if (!probe) return null

      const probeRect = probe.getBoundingClientRect()
      const bounds = {
        left: ((probeRect.left - rect.left) / rect.width) * 100,
        top: ((probeRect.top - rect.top) / rect.height) * 100,
        right: ((probeRect.right - rect.left) / rect.width) * 100,
        bottom: ((probeRect.bottom - rect.top) / rect.height) * 100
      }

      boundsRef.current = bounds
      setMaskedBounds(bounds)
      return bounds
    }

    // Initial calculation - do it synchronously first to avoid position shifts
    computeBounds()

    // Then also schedule one with RAF to catch any layout changes
    const frame = requestAnimationFrame(() => {
      computeBounds()
    })

    // Use ResizeObserver for efficient size change detection
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver((entries) => {
        // Debounce with requestAnimationFrame for optimal performance
        requestAnimationFrame(() => {
          computeBounds()
        })
      })

      observerRef.current.observe(containerRef.current)

      // Also observe the masked content element
      const probe = containerRef.current.querySelector('[data-masked-content]')
      if (probe) {
        observerRef.current.observe(probe)
      }
    } else {
      // Fallback to window resize for older browsers
      const handleResize = () => {
        requestAnimationFrame(() => {
          computeBounds()
        })
      }

      window.addEventListener('resize', handleResize)

      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', handleResize)
      }
    }

    return () => {
      cancelAnimationFrame(frame)
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [containerRef])

  return maskedBounds
}

/**
 * Get the current cached bounds without triggering a recalculation
 * Useful during gestures to avoid unnecessary DOM queries
 */
export const useMaskedBoundsRef = (containerRef) => {
  const maskedBounds = useMaskedBounds(containerRef)
  const boundsRef = useRef(null)

  useEffect(() => {
    if (maskedBounds) {
      boundsRef.current = maskedBounds
    }
  }, [maskedBounds])

  return { maskedBounds, boundsRef }
}

import { useRef, useCallback } from 'react'

/**
 * High-performance gesture hook using direct DOM manipulation
 * Avoids React re-renders during gestures for 60fps performance
 *
 * @param {Object} options Configuration options
 * @param {Function} options.onDragEnd Callback when drag ends (finalX, finalY)
 * @param {Function} options.onPinchEnd Callback when pinch ends (newScale, newRotation)
 * @param {Function} options.getBounds Function to get boundary constraints
 * @param {Object} options.initialPosition Initial position {x, y}
 * @param {number} options.initialScale Initial scale
 * @param {number} options.initialRotation Initial rotation
 */
export const useDirectManipulation = ({
  onDragEnd,
  onPinchEnd,
  getBounds,
  initialPosition = { x: 50, y: 50 },
  initialScale = 1,
  initialRotation = 0
}) => {
  const elementRef = useRef(null)
  const stateRef = useRef({
    isDragging: false,
    isGesturing: false,
    startX: 0,
    startY: 0,
    currentTranslateX: 0,
    currentTranslateY: 0,
    pointers: new Map(),
    gestureStartDistance: 0,
    gestureStartAngle: 0,
    gestureStartScale: initialScale,
    gestureStartRotation: initialRotation,
    basePosition: initialPosition
  })

  // Apply transform directly to DOM - NO REACT RENDER
  const applyTransform = useCallback((translateX = 0, translateY = 0, scale = null, rotation = null) => {
    const element = elementRef.current
    if (!element) return

    const currentScale = scale !== null ? scale : stateRef.current.gestureStartScale
    const currentRotation = rotation !== null ? rotation : stateRef.current.gestureStartRotation

    // Direct DOM manipulation - bypasses React completely
    element.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale}) rotate(${currentRotation}deg)`
  }, [])

  // One-finger drag handler
  const handleDragStart = useCallback((e, containerRect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    stateRef.current.isDragging = true
    stateRef.current.startX = clientX
    stateRef.current.startY = clientY
    stateRef.current.currentTranslateX = 0
    stateRef.current.currentTranslateY = 0

    const element = elementRef.current
    if (element) {
      element.style.willChange = 'transform'
      element.style.cursor = 'grabbing'
    }
  }, [])

  const handleDragMove = useCallback((e, containerRect) => {
    if (!stateRef.current.isDragging) return

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    // Calculate pixel delta
    const deltaX = clientX - stateRef.current.startX
    const deltaY = clientY - stateRef.current.startY

    stateRef.current.currentTranslateX = deltaX
    stateRef.current.currentTranslateY = deltaY

    // Apply immediately via DOM - no React render
    applyTransform(deltaX, deltaY)
  }, [applyTransform])

  const handleDragEnd = useCallback((e, containerRect) => {
    if (!stateRef.current.isDragging) return

    const deltaX = stateRef.current.currentTranslateX
    const deltaY = stateRef.current.currentTranslateY

    // Convert pixels to percentage
    const deltaXPercent = (deltaX / containerRect.width) * 100
    const deltaYPercent = (deltaY / containerRect.height) * 100

    // Calculate final position
    let finalX = stateRef.current.basePosition.x + deltaXPercent
    let finalY = stateRef.current.basePosition.y + deltaYPercent

    // Apply bounds if provided
    if (getBounds) {
      const bounds = getBounds()
      finalX = Math.max(bounds.left, Math.min(bounds.right, finalX))
      finalY = Math.max(bounds.top, Math.min(bounds.bottom, finalY))
    }

    // Reset transform and update base position
    stateRef.current.basePosition = { x: finalX, y: finalY }
    stateRef.current.isDragging = false
    stateRef.current.currentTranslateX = 0
    stateRef.current.currentTranslateY = 0

    const element = elementRef.current
    if (element) {
      element.style.transform = ''
      element.style.willChange = 'auto'
      element.style.cursor = 'grab'
    }

    // Update React state ONCE at the end
    if (onDragEnd) {
      onDragEnd(finalX, finalY)
    }
  }, [onDragEnd, getBounds, applyTransform])

  // Two-finger pinch/rotate handler
  const handlePinchStart = useCallback((touches) => {
    if (touches.length !== 2) return

    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY

    stateRef.current.isGesturing = true
    stateRef.current.gestureStartDistance = Math.hypot(dx, dy)
    stateRef.current.gestureStartAngle = Math.atan2(dy, dx) * (180 / Math.PI)

    const element = elementRef.current
    if (element) {
      element.style.willChange = 'transform'
    }
  }, [])

  const handlePinchMove = useCallback((touches) => {
    if (!stateRef.current.isGesturing || touches.length !== 2) return

    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY

    const currentDistance = Math.hypot(dx, dy)
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI)

    // Calculate scale and rotation deltas
    const scaleChange = currentDistance / stateRef.current.gestureStartDistance
    const newScale = Math.max(0.5, Math.min(3, stateRef.current.gestureStartScale * scaleChange))

    const angleChange = currentAngle - stateRef.current.gestureStartAngle
    const newRotation = (stateRef.current.gestureStartRotation + angleChange) % 360

    // Apply immediately via DOM
    applyTransform(
      stateRef.current.currentTranslateX,
      stateRef.current.currentTranslateY,
      newScale,
      newRotation
    )
  }, [applyTransform])

  const handlePinchEnd = useCallback(() => {
    if (!stateRef.current.isGesturing) return

    // Calculate final scale and rotation from current transform
    const element = elementRef.current
    if (!element) return

    const transform = element.style.transform
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/)
    const rotateMatch = transform.match(/rotate\(([\d.-]+)deg\)/)

    const finalScale = scaleMatch ? parseFloat(scaleMatch[1]) : stateRef.current.gestureStartScale
    const finalRotation = rotateMatch ? parseFloat(rotateMatch[1]) : stateRef.current.gestureStartRotation

    // Update base values
    stateRef.current.gestureStartScale = finalScale
    stateRef.current.gestureStartRotation = finalRotation
    stateRef.current.isGesturing = false

    element.style.willChange = 'auto'

    // Update React state ONCE at the end
    if (onPinchEnd) {
      onPinchEnd(finalScale, finalRotation)
    }
  }, [onPinchEnd])

  // Reset when position/scale/rotation change externally
  const reset = useCallback((position, scale, rotation) => {
    stateRef.current.basePosition = position || stateRef.current.basePosition
    stateRef.current.gestureStartScale = scale !== undefined ? scale : stateRef.current.gestureStartScale
    stateRef.current.gestureStartRotation = rotation !== undefined ? rotation : stateRef.current.gestureStartRotation

    const element = elementRef.current
    if (element) {
      element.style.transform = ''
    }
  }, [])

  return {
    elementRef,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handlePinchStart,
    handlePinchMove,
    handlePinchEnd,
    reset
  }
}

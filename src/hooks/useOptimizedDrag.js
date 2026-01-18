import { useRef, useCallback } from 'react'

/**
 * Ultra-optimized drag hook that uses direct DOM manipulation
 * Avoids React re-renders during drag for buttery-smooth 60fps performance
 */
export const useOptimizedDrag = (onDragEnd) => {
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    elementStartX: 0,
    elementStartY: 0,
    element: null,
    containerRect: null
  })

  const startDrag = useCallback((e, element, currentPosX, currentPosY, containerRect) => {
    e.preventDefault()
    e.stopPropagation()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    dragStateRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      elementStartX: currentPosX,
      elementStartY: currentPosY,
      element,
      containerRect
    }

    const handleMove = (e) => {
      if (!dragStateRef.current.isDragging) return

      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY

      dragStateRef.current.currentX = clientX
      dragStateRef.current.currentY = clientY

      const deltaX = clientX - dragStateRef.current.startX
      const deltaY = clientY - dragStateRef.current.startY

      const { containerRect, elementStartX, elementStartY } = dragStateRef.current

      // Convert pixel delta to percentage
      const deltaXPercent = (deltaX / containerRect.width) * 100
      const deltaYPercent = (deltaY / containerRect.height) * 100

      const newX = elementStartX + deltaXPercent
      const newY = elementStartY + deltaYPercent

      // Apply transform directly to DOM (no React re-render!)
      if (dragStateRef.current.element) {
        dragStateRef.current.element.style.left = `${newX}%`
        dragStateRef.current.element.style.top = `${newY}%`
      }
    }

    const handleEnd = () => {
      if (!dragStateRef.current.isDragging) return

      const deltaX = dragStateRef.current.currentX - dragStateRef.current.startX
      const deltaY = dragStateRef.current.currentY - dragStateRef.current.startY

      const { containerRect, elementStartX, elementStartY } = dragStateRef.current

      const deltaXPercent = (deltaX / containerRect.width) * 100
      const deltaYPercent = (deltaY / containerRect.height) * 100

      const finalX = elementStartX + deltaXPercent
      const finalY = elementStartY + deltaYPercent

      dragStateRef.current.isDragging = false

      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('touchend', handleEnd)

      // Update React state once at the end
      if (onDragEnd) {
        onDragEnd(finalX, finalY)
      }
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
  }, [onDragEnd])

  return { startDrag }
}

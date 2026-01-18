import React, { useRef, useCallback, useEffect, memo } from 'react'

/**
 * HIGH-PERFORMANCE Draggable Text Component
 * Uses direct DOM manipulation to avoid React re-renders during gestures
 * Achieves 60fps on touch devices
 */
const OptimizedDraggableText = memo(({
  textElement,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onRotate,
  onDelete,
  onConfirm,
  onTextChange,
  onTextBlur,
  onTextDoubleClick,
  onKeyDown,
  containerRect,
  maskedBounds,
  overlayRef,
  onDebug
}) => {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const animationFrameRef = useRef(null)
  const stateRef = useRef({
    isDragging: false,
    isGesturing: false,
    pointers: new Map(),
    interaction: null,
    containerRect: containerRect,
    hasMoved: false,
    pendingTransform: null,
    rafScheduled: false
  })

  // Debug updater
  const updateDebug = useCallback((info) => {
    if (onDebug && isSelected) {
      onDebug(info)
    }
  }, [onDebug, isSelected])

  const hideDebug = useCallback(() => {
    if (onDebug) {
      onDebug('')
    }
  }, [onDebug])

  // Update container rect when it changes
  useEffect(() => {
    stateRef.current.containerRect = containerRect
  }, [containerRect])

  const getBounds = useCallback(() => {
    return maskedBounds || { left: 0, top: 0, right: 100, bottom: 100 }
  }, [maskedBounds])

  const getHalfSizePercent = useCallback(() => {
    const rect = stateRef.current.containerRect
    const box = containerRef.current?.getBoundingClientRect()
    if (!rect || !box || rect.width === 0 || rect.height === 0) {
      return { halfWidthPercent: 0, halfHeightPercent: 0 }
    }

    const widthPercent = (box.width / rect.width) * 100
    const heightPercent = (box.height / rect.height) * 100

    return {
      halfWidthPercent: widthPercent / 2,
      halfHeightPercent: heightPercent / 2
    }
  }, [])

  //======================================
  // DIRECT DOM MANIPULATION - NO REACT RENDERS
  //======================================

  const applyTransform = useCallback((translateX = 0, translateY = 0, size = null, rotation = null) => {
    const element = containerRef.current
    if (!element) return

    // Store the desired transform in pending state
    stateRef.current.pendingTransform = {
      translateX,
      translateY,
      size,
      rotation: rotation !== null ? rotation : (textElement.rotation || 0)
    }

    // Only schedule ONE RAF per interaction - prevents race conditions
    if (!stateRef.current.rafScheduled) {
      stateRef.current.rafScheduled = true

      animationFrameRef.current = requestAnimationFrame(() => {
        const pending = stateRef.current.pendingTransform
        if (!pending || !containerRef.current) {
          stateRef.current.rafScheduled = false
          return
        }

        // Apply the LATEST transform (not stale values)
        const element = containerRef.current
        const currentRotation = pending.rotation

        // Direct DOM update - bypasses React completely
        if (pending.translateX !== 0 || pending.translateY !== 0) {
          element.style.transform = `translate(-50%, -50%) translate(${pending.translateX}px, ${pending.translateY}px) rotate(${currentRotation}deg)`
        } else {
          element.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`
        }
        element.style.willChange = 'transform'

        // Update font size directly if resizing
        if (pending.size !== null && textRef.current) {
          textRef.current.style.fontSize = `${pending.size}px`
        }

        // Clear flags
        stateRef.current.pendingTransform = null
        stateRef.current.rafScheduled = false
      })
    }
  }, [textElement.rotation])

  const clearTransform = useCallback(() => {
    const element = containerRef.current
    if (!element) return

    // Cancel any pending animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      stateRef.current.rafScheduled = false
    }

    // Reset to base transform from React state (keeps centering!)
    element.style.transform = `translate(-50%, -50%) rotate(${textElement.rotation || 0}deg)`
    element.style.willChange = 'auto'

    // Reset font size to element prop
    if (textRef.current) {
      textRef.current.style.fontSize = `${textElement.size}px`
    }
  }, [textElement.size, textElement.rotation])

  //======================================
  // POINTER EVENT HANDLERS
  //======================================

  const handlePointerDown = useCallback((e) => {
    // Don't intercept if editing or clicking control handles
    if (textElement.isEditing || e.target.closest('.text-control-handle')) return
    if (!containerRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    // Prevent default for all pointer types to avoid scrolling and other browser behaviors
    e.preventDefault()
    e.stopPropagation()

    // Reset movement tracking for new interaction
    stateRef.current.hasMoved = false

    // Capture pointer for better tracking - capture ALL pointer types including touch
    if (containerRef.current.setPointerCapture) {
      try {
        containerRef.current.setPointerCapture(e.pointerId)
      } catch (error) {
        // Ignore - pointer capture might fail in some scenarios
      }
    }

    stateRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    onSelect(textElement.id)

    const pointerCount = stateRef.current.pointers.size
    updateDebug(`Pointers: ${pointerCount}`)

    if (pointerCount === 1) {
      // Start drag
      stateRef.current.isDragging = true
      stateRef.current.interaction = {
        type: 'drag',
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTextX: textElement.position.x,
        startTextY: textElement.position.y,
        translateX: 0,
        translateY: 0,
        bounds: getBounds()
      }
    } else if (pointerCount === 2) {
      updateDebug(`PINCH START - 2 fingers`)
      // Transition from drag to pinch - keep current visual state to prevent jump
      const currentInteraction = stateRef.current.interaction
      let currentTranslateX = 0
      let currentTranslateY = 0

      if (currentInteraction && currentInteraction.type === 'drag') {
        // Remember the current drag offset to maintain visual position
        currentTranslateX = currentInteraction.translateX || 0
        currentTranslateY = currentInteraction.translateY || 0
      }

      // Start pinch gesture while maintaining the current visual position
      const pointers = Array.from(stateRef.current.pointers.values())
      const dx = pointers[1].x - pointers[0].x
      const dy = pointers[1].y - pointers[0].y

      stateRef.current.isGesturing = true
      stateRef.current.isDragging = false
      const bounds = getBounds()
      const { halfWidthPercent, halfHeightPercent } = getHalfSizePercent()
      stateRef.current.interaction = {
        type: 'gesture',
        startDistance: Math.hypot(dx, dy),
        startAngle: Math.atan2(dy, dx) * (180 / Math.PI),
        startSize: textElement.size || 30,
        startRotation: textElement.rotation || 0,
        bounds,
        centerX: textElement.position.x,
        centerY: textElement.position.y,
        startWidthPercent: halfWidthPercent * 2,
        startHeightPercent: halfHeightPercent * 2,
        // Store drag offset to maintain visual position during pinch
        dragOffsetX: currentTranslateX,
        dragOffsetY: currentTranslateY,
        initialTextX: currentInteraction?.startTextX || textElement.position.x,
        initialTextY: currentInteraction?.startTextY || textElement.position.y
      }

      // Keep the visual transform with current drag offset
      applyTransform(currentTranslateX, currentTranslateY, textElement.size, textElement.rotation || 0)
    }
  }, [textElement, onSelect, clearTransform, getBounds, getHalfSizePercent, onMove, updateDebug, applyTransform])

  const handlePointerMove = useCallback((e) => {
    if (!stateRef.current.pointers.has(e.pointerId)) return

    // Prevent default for all pointer types for smooth dragging
    e.preventDefault()

    stateRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const interaction = stateRef.current.interaction
    if (!interaction) return

    //=== DRAG INTERACTION ===
    if (interaction.type === 'drag' && interaction.pointerId === e.pointerId) {
      const deltaX = e.clientX - interaction.startX
      const deltaY = e.clientY - interaction.startY

      // Mark as moved if there's significant movement (more than 5 pixels)
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        stateRef.current.hasMoved = true
      }

      // Store the raw pixel delta directly for smooth 1:1 finger tracking
      interaction.translateX = deltaX
      interaction.translateY = deltaY

      // Apply transform directly - NO REACT RENDER
      // The text will follow finger exactly (constraints applied on pointerEnd)
      applyTransform(interaction.translateX, interaction.translateY)
    }
    //=== PINCH/ROTATE INTERACTION ===
    else if (interaction.type === 'gesture') {
      const pointers = Array.from(stateRef.current.pointers.values())
      if (pointers.length !== 2) return

      const dx = pointers[1].x - pointers[0].x
      const dy = pointers[1].y - pointers[0].y
      const currentDistance = Math.hypot(dx, dy)

      const scaleChange = currentDistance / interaction.startDistance
      const desiredSize = interaction.startSize * scaleChange

      const MIN_SIZE = 200
      const MAX_SIZE = 450
      const clampedSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, desiredSize))

      updateDebug(`PINCH: size=${clampedSize.toFixed(1)} dist=${currentDistance.toFixed(0)}`)

      // Store the current size for committing later
      interaction.currentSize = clampedSize

      // NO ROTATION - only resize via pinch
      // Maintain drag offset during pinch to prevent position jump
      const dragOffsetX = interaction.dragOffsetX || 0
      const dragOffsetY = interaction.dragOffsetY || 0
      applyTransform(dragOffsetX, dragOffsetY, clampedSize, textElement.rotation || 0)
    }
  }, [applyTransform, getBounds, getHalfSizePercent, textElement.position.x, textElement.position.y, textElement.rotation, updateDebug])

  const handlePointerEnd = useCallback((e) => {
    // Release pointer capture
    if (containerRef.current?.hasPointerCapture?.(e.pointerId)) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId)
      } catch (error) {
        // Ignore
      }
    }

    const interaction = stateRef.current.interaction
    stateRef.current.pointers.delete(e.pointerId)

    // Handle end of interaction
    if (interaction) {
      //=== END DRAG ===
      if (interaction.type === 'drag' && interaction.pointerId === e.pointerId) {
        const rect = overlayRef?.current?.getBoundingClientRect() || stateRef.current.containerRect
        if (rect) {
          // Convert pixels to percentage
          const deltaXPercent = (interaction.translateX / rect.width) * 100
          const deltaYPercent = (interaction.translateY / rect.height) * 100

          // Calculate final position
          let finalX = interaction.startTextX + deltaXPercent
          let finalY = interaction.startTextY + deltaYPercent

          const bounds = interaction.bounds || getBounds()
          const { halfWidthPercent, halfHeightPercent } = getHalfSizePercent()

          if (bounds) {
            const minX = bounds.left + halfWidthPercent
            const maxX = bounds.right - halfWidthPercent
            const minY = bounds.top + halfHeightPercent
            const maxY = bounds.bottom - halfHeightPercent
            finalX = Math.min(Math.max(finalX, minX), maxX)
            finalY = Math.min(Math.max(finalY, minY), maxY)
          }

          // Clear transform
          clearTransform()

          // Update React state ONCE at the end
          onMove(textElement.id, finalX, finalY)
        }

        stateRef.current.isDragging = false
        stateRef.current.interaction = null
      }
      //=== END GESTURE ===
      else if (interaction.type === 'gesture' && stateRef.current.pointers.size < 2) {
        const finalSize = interaction.currentSize || interaction.startSize
        const finalRotation = interaction.startRotation

        // If there was a drag offset when pinch started, commit the position too
        if (interaction.dragOffsetX !== undefined && interaction.dragOffsetY !== undefined) {
          const rect = overlayRef?.current?.getBoundingClientRect() || stateRef.current.containerRect
          if (rect) {
            const deltaXPercent = (interaction.dragOffsetX / rect.width) * 100
            const deltaYPercent = (interaction.dragOffsetY / rect.height) * 100

            let finalX = interaction.initialTextX + deltaXPercent
            let finalY = interaction.initialTextY + deltaYPercent

            const bounds = interaction.bounds || getBounds()
            const { halfWidthPercent, halfHeightPercent } = getHalfSizePercent()

            if (bounds) {
              const minX = bounds.left + halfWidthPercent
              const maxX = bounds.right - halfWidthPercent
              const minY = bounds.top + halfHeightPercent
              const maxY = bounds.bottom - halfHeightPercent
              finalX = Math.min(Math.max(finalX, minX), maxX)
              finalY = Math.min(Math.max(finalY, minY), maxY)
            }

            // Clear transform first
            clearTransform()

            // Update position, size, and rotation
            onMove(textElement.id, finalX, finalY)
            onResize(textElement.id, finalSize)
            onRotate(textElement.id, finalRotation)
          }
        } else {
          // No position change, just size
          clearTransform()
          onResize(textElement.id, finalSize)
          onRotate(textElement.id, finalRotation)
        }

        stateRef.current.isGesturing = false
        stateRef.current.interaction = null
      }
    }

    // Clean up if no pointers left
    if (stateRef.current.pointers.size === 0) {
      stateRef.current.isDragging = false
      stateRef.current.isGesturing = false
      stateRef.current.interaction = null
      hideDebug()
    }
  }, [textElement, onMove, onResize, onRotate, clearTransform, getBounds, getHalfSizePercent, hideDebug])

  //======================================
  // TEXT EDITING HANDLERS
  //======================================

  const handleClick = useCallback((e) => {
    e.stopPropagation() // Prevent deselection when clicking the selected element

    // Don't do anything if we just finished dragging
    if (stateRef.current.hasMoved) {
      stateRef.current.hasMoved = false
      return
    }

    // ONLY select - never enter edit mode from clicking
    // Text should only be edited via the "Add text or emoji" input box
    onSelect(textElement.id)
  }, [textElement.id, onSelect])

  const handleInput = useCallback((e) => {
    const text = e.currentTarget.textContent || e.currentTarget.innerText || ''
    onTextChange(textElement.id, text, e.currentTarget)
  }, [textElement.id, onTextChange])

  const handleBlur = useCallback(() => {
    onTextBlur(textElement.id)
  }, [textElement.id, onTextBlur])

  const handleKeyDown = useCallback((e) => {
    onKeyDown(textElement.id, e)
  }, [textElement.id, onKeyDown])

  useEffect(() => {
    const overlayEl = overlayRef?.current
    if (!overlayEl || !isSelected || textElement.isEditing) {
      return
    }

    const getMaskedRect = () => {
      const maskedEl = overlayEl.querySelector('[data-masked-content]')
      return maskedEl ? maskedEl.getBoundingClientRect() : null
    }

    const isWithinMask = (event) => {
      const rect = getMaskedRect()
      if (!rect) return true
      const { clientX, clientY } = event
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }

    const handleOverlayPointerDown = (event) => {
      // Allow second finger on text for pinch zoom
      if (!containerRef.current) {
        return
      }

      // If this is the FIRST pointer and it's on the text, let the text handle it
      if (stateRef.current.pointers.size === 0 && containerRef.current.contains(event.target)) {
        return
      }

      // If pointer already being tracked, ignore
      if (stateRef.current.pointers.has(event.pointerId)) {
        return
      }

      // For second+ pointers, check mask boundary
      if (!isWithinMask(event)) {
        return
      }

      // Handle this pointer (could be second finger for pinch)
      handlePointerDown(event)
    }

    const handleOverlayPointerMove = (event) => {
      if (!containerRef.current) {
        return
      }
      if (!stateRef.current.pointers.has(event.pointerId)) {
        return
      }
      handlePointerMove(event)
    }

    const handleOverlayPointerEnd = (event) => {
      if (!stateRef.current.pointers.has(event.pointerId)) {
        return
      }
      handlePointerEnd(event)
    }

    overlayEl.addEventListener('pointerdown', handleOverlayPointerDown, { passive: false })
    overlayEl.addEventListener('pointermove', handleOverlayPointerMove, { passive: false })
    overlayEl.addEventListener('pointerup', handleOverlayPointerEnd, { passive: false })
    overlayEl.addEventListener('pointercancel', handleOverlayPointerEnd, { passive: false })

    return () => {
      overlayEl.removeEventListener('pointerdown', handleOverlayPointerDown)
      overlayEl.removeEventListener('pointermove', handleOverlayPointerMove)
      overlayEl.removeEventListener('pointerup', handleOverlayPointerEnd)
      overlayEl.removeEventListener('pointercancel', handleOverlayPointerEnd)
    }
  }, [overlayRef, isSelected, textElement.isEditing, handlePointerDown, handlePointerMove, handlePointerEnd])

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  //======================================
  // RENDER
  //======================================

  return (
    <div
      ref={containerRef}
      data-text-container={textElement.id}
      style={{
        position: 'absolute',
        left: `${textElement.position.x}%`,
        top: `${textElement.position.y}%`,
        transform: `translate(-50%, -50%) rotate(${textElement.rotation}deg)`,
        zIndex: isSelected ? 20 : 15,
        pointerEvents: 'auto'
      }}
    >
      {/* Text Content */}
      <div
        ref={textRef}
        data-text-id={textElement.id}
        contentEditable={textElement.isEditing}
        suppressContentEditableWarning={true}
        dir="ltr"
        onClick={handleClick}
        onPointerDown={textElement.isEditing ? undefined : handlePointerDown}
        onPointerMove={textElement.isEditing ? undefined : handlePointerMove}
        onPointerUp={textElement.isEditing ? undefined : handlePointerEnd}
        onPointerCancel={textElement.isEditing ? undefined : handlePointerEnd}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          fontFamily: textElement.font.family,
          fontSize: `${textElement.size}px`,
          fontWeight: 'bold',
          color: textElement.color,
          textAlign: 'left',
          cursor: textElement.isEditing ? 'text' : 'move',
          userSelect: textElement.isEditing ? 'text' : 'none',
          whiteSpace: 'pre',
          padding: '8px',
          border: textElement.isEditing
            ? '2px solid #FF7CA3'
            : (isSelected ? '2px dashed #FF7CA3' : 'none'),
          borderRadius: '4px',
          backgroundColor: 'transparent',
          outline: 'none',
          minWidth: '40px',
          touchAction: textElement.isEditing ? 'auto' : 'none',
          // GPU acceleration
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          transition: 'none'
        }}
      >
        {textElement.text}
      </div>

      {/* Control Handles - Only show when selected and not editing */}
      {isSelected && !textElement.isEditing && (
        <>
          {/* Confirm Button - Only show if not confirmed */}
          {!textElement.confirmed && (
            <button
              className="text-control-handle"
              onClick={(e) => {
                e.stopPropagation()
                onConfirm(textElement.id)
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onConfirm(textElement.id)
              }}
              style={{
                position: 'absolute',
                top: '-12px',
                left: '-12px',
                width: '32px',
                height: '32px',
                backgroundColor: '#00CC66',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 25,
                touchAction: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Delete Button */}
          <button
            className="text-control-handle"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(textElement.id)
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete(textElement.id)
            }}
            style={{
              position: 'absolute',
              top: '3px',
              right: '3px',
              width: '100px',
              height: '100px',
              backgroundColor: '#FF4757',
              border: '7px solid white',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '67px',
              color: 'white',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              zIndex: 25,
              touchAction: 'none',
              transform: `scale(${300 / (textElement.size || 300)})`,
              transformOrigin: 'top right'
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  )
})

OptimizedDraggableText.displayName = 'OptimizedDraggableText'

export default OptimizedDraggableText

import React, { useRef, useCallback, useEffect, memo } from 'react'
import { IS_WEBKIT } from '../utils/browserDetect'

/**
 * WEBKIT-NATIVE Gesture Implementation
 *
 * KEY INSIGHT: iOS Safari's gesture events (gesturestart/change/end) provide
 * e.scale and e.rotation DIRECTLY - no manual distance calculation needed.
 *
 * The previous approach BLOCKED gestures globally, creating a "dead zone" where
 * Safari paused touch events. This approach EMBRACES WebKit's native gestures.
 *
 * Strategy:
 * - Single-finger: Pointer Events for drag
 * - Two-finger (WebKit): Gesture Events with native e.scale/e.rotation
 * - Two-finger (Android): Touch Events with manual distance calculation
 */
const OptimizedDraggableSticker = memo(({
  sticker,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onRotate,
  onDelete,
  containerRect,
  maskedBounds,
  overlayRef,
  onDebug
}) => {
  const stickerRef = useRef(null)
  const imgRef = useRef(null)
  const deleteButtonRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Gesture state
  const stateRef = useRef({
    // Drag state (pointer events)
    isDragging: false,
    dragPointerId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragStartStickerX: 0,
    dragStartStickerY: 0,
    dragTranslateX: 0,
    dragTranslateY: 0,

    // Pinch state (WebKit gesture events or touch events)
    isPinching: false,
    pinchStartScale: 1,
    pinchStartRotation: 0,
    pinchCurrentScale: 1,
    pinchCurrentRotation: 0,

    // For non-WebKit touch fallback
    pinchStartDistance: 0,
    pinchStartAngle: 0,

    // RAF scheduling
    pendingTransform: null,
    rafScheduled: false,

    // Other
    containerRect: containerRect,
    highresLoaded: false
  })

  // Debug helper
  const updateDebug = useCallback((info) => {
    if (onDebug && isSelected) onDebug(info)
  }, [onDebug, isSelected])

  const hideDebug = useCallback(() => {
    if (onDebug) onDebug('')
  }, [onDebug])

  // Update container rect
  useEffect(() => {
    stateRef.current.containerRect = containerRect
  }, [containerRect])

  // Progressive image loading
  useEffect(() => {
    if (sticker.type !== 'image' || stateRef.current.highresLoaded || !imgRef.current) return

    const highresImg = new Image()
    const highresUrl = sticker.highresUrl || sticker.imageUrl

    highresImg.onload = () => {
      if (imgRef.current && !stateRef.current.highresLoaded) {
        imgRef.current.src = highresUrl
        stateRef.current.highresLoaded = true
      }
    }

    highresImg.onerror = () => {
      if (imgRef.current && sticker.fallbackUrl && !stateRef.current.highresLoaded) {
        imgRef.current.src = sticker.fallbackUrl
        stateRef.current.highresLoaded = true
      }
    }

    setTimeout(() => { highresImg.src = highresUrl }, 100)
  }, [sticker])

  const clampScale = useCallback((scaleValue) => {
    // Min 20, Max 180 - allows stickers up to ~40% of phone cover
    return Math.max(20, Math.min(180, scaleValue))
  }, [])

  const constrainPosition = useCallback((x, y, scale) => {
    if (!maskedBounds) return { x, y }

    const isImageSticker = sticker.type === 'image'
    const stickerSize = isImageSticker ? scale * 2 : scale * 2.4
    const effectiveRadius = stickerSize / 2
    const radiusXPercent = (effectiveRadius / 250) * 100
    const radiusYPercent = (effectiveRadius / 416) * 100

    return {
      x: Math.max(maskedBounds.left + radiusXPercent, Math.min(maskedBounds.right - radiusXPercent, x)),
      y: Math.max(maskedBounds.top + radiusYPercent, Math.min(maskedBounds.bottom - radiusYPercent, y))
    }
  }, [maskedBounds, sticker.type])

  //======================================
  // DIRECT DOM MANIPULATION - 60fps
  //======================================

  const applyTransform = useCallback((translateX = 0, translateY = 0, scale = null, rotation = null) => {
    const element = stickerRef.current
    if (!element) return

    stateRef.current.pendingTransform = {
      translateX,
      translateY,
      scale: scale !== null ? scale : (sticker.scale || 45),
      rotation: rotation !== null ? rotation : (sticker.rotation || 0)
    }

    if (!stateRef.current.rafScheduled) {
      stateRef.current.rafScheduled = true

      animationFrameRef.current = requestAnimationFrame(() => {
        const pending = stateRef.current.pendingTransform
        if (!pending || !stickerRef.current) {
          stateRef.current.rafScheduled = false
          return
        }

        const element = stickerRef.current
        const currentScale = clampScale(pending.scale)
        const currentRotation = pending.rotation
        const baseScale = clampScale(sticker.scale || 45)
        const gestureScaleRatio = currentScale / baseScale

        let transformValue
        if (pending.translateX !== 0 || pending.translateY !== 0) {
          transformValue = IS_WEBKIT
            ? `translate(-50%, -50%) translate(${pending.translateX}px, ${pending.translateY}px) scale(${gestureScaleRatio}) rotate(${currentRotation}deg)`
            : `translate3d(-50%, -50%, 0) translate3d(${pending.translateX}px, ${pending.translateY}px, 0) scale(${currentScale}) rotate(${currentRotation}deg)`
        } else {
          transformValue = IS_WEBKIT
            ? `translate(-50%, -50%) scale(${gestureScaleRatio}) rotate(${currentRotation}deg)`
            : `translate3d(-50%, -50%, 0) scale(${currentScale}) rotate(${currentRotation}deg)`
        }

        element.style.transform = transformValue
        element.style.webkitTransform = transformValue
        element.style.willChange = 'transform'

        // Update delete button counter-scale during gesture
        // WebKit uses gestureScaleRatio, non-WebKit uses currentScale
        if (deleteButtonRef.current && isSelected) {
          const counterScale = IS_WEBKIT ? (1 / gestureScaleRatio) : (1 / currentScale)
          deleteButtonRef.current.style.transform = `scale(${counterScale})`
        }

        stateRef.current.pendingTransform = null
        stateRef.current.rafScheduled = false
      })
    }
  }, [sticker.scale, sticker.rotation, clampScale, isSelected])

  const clearTransform = useCallback(() => {
    const element = stickerRef.current
    if (!element) return

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      stateRef.current.rafScheduled = false
    }

    const finalScale = clampScale(sticker.scale || 45)
    const transformValue = IS_WEBKIT
      ? `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`
      : `translate3d(-50%, -50%, 0) scale(${finalScale}) rotate(${sticker.rotation || 0}deg)`
    element.style.transform = transformValue
    element.style.webkitTransform = transformValue
    element.style.willChange = 'auto'

    if (IS_WEBKIT && imgRef.current) {
      const displaySize = finalScale * 2
      imgRef.current.style.width = `${displaySize}px`
      imgRef.current.style.height = `${displaySize}px`
    }

    if (deleteButtonRef.current && isSelected) {
      deleteButtonRef.current.style.transform = 'none'
    }

    // Smooth transition back to final state
    const transitionValue = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    element.style.transition = transitionValue
    element.style.webkitTransition = transitionValue

    setTimeout(() => {
      if (element) {
        element.style.transition = ''
        element.style.webkitTransition = ''
      }
    }, 150)
  }, [sticker.scale, sticker.rotation, clampScale, isSelected])

  //======================================
  // TOUCH UTILITY FUNCTIONS (for non-WebKit fallback)
  //======================================

  const getTouchDistance = useCallback((touches) => {
    if (touches.length < 2) return 0
    const [t1, t2] = touches
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  }, [])

  const getTouchAngle = useCallback((touches) => {
    if (touches.length < 2) return 0
    const [t1, t2] = touches
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
  }, [])

  //======================================
  // POINTER EVENT HANDLERS (for drag)
  //======================================

  const handlePointerDown = useCallback((e) => {
    if (!stickerRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    // Don't start drag if pinching
    if (stateRef.current.isPinching) {
      e.preventDefault()
      return
    }

    // For touch, only handle the primary pointer (first finger)
    if (e.pointerType === 'touch' && !e.isPrimary) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    // Capture pointer
    try {
      stickerRef.current.setPointerCapture(e.pointerId)
    } catch (err) {}

    onSelect(sticker.placedId)

    stateRef.current.isDragging = true
    stateRef.current.dragPointerId = e.pointerId
    stateRef.current.dragStartX = e.clientX
    stateRef.current.dragStartY = e.clientY
    stateRef.current.dragStartStickerX = sticker.x
    stateRef.current.dragStartStickerY = sticker.y
    stateRef.current.dragTranslateX = 0
    stateRef.current.dragTranslateY = 0

    updateDebug('DRAG START')
  }, [sticker, onSelect, updateDebug])

  const handlePointerMove = useCallback((e) => {
    // Skip if pinching
    if (stateRef.current.isPinching) return
    if (!stateRef.current.isDragging) return
    if (stateRef.current.dragPointerId !== e.pointerId) return

    e.preventDefault()

    const deltaX = e.clientX - stateRef.current.dragStartX
    const deltaY = e.clientY - stateRef.current.dragStartY

    stateRef.current.dragTranslateX = deltaX
    stateRef.current.dragTranslateY = deltaY

    applyTransform(deltaX, deltaY, stateRef.current.pinchCurrentScale || sticker.scale, stateRef.current.pinchCurrentRotation || sticker.rotation)
  }, [applyTransform, sticker.scale, sticker.rotation])

  const handlePointerUp = useCallback((e) => {
    if (!stateRef.current.isDragging) return
    if (stateRef.current.dragPointerId !== e.pointerId) return

    // Release capture
    try {
      stickerRef.current?.releasePointerCapture(e.pointerId)
    } catch (err) {}

    const rect = overlayRef?.current?.getBoundingClientRect() || stateRef.current.containerRect
    if (rect && (stateRef.current.dragTranslateX !== 0 || stateRef.current.dragTranslateY !== 0)) {
      const deltaXPercent = (stateRef.current.dragTranslateX / rect.width) * 100
      const deltaYPercent = (stateRef.current.dragTranslateY / rect.height) * 100

      const finalX = stateRef.current.dragStartStickerX + deltaXPercent
      const finalY = stateRef.current.dragStartStickerY + deltaYPercent
      const constrained = constrainPosition(finalX, finalY, sticker.scale || 45)

      clearTransform()
      onMove(sticker.placedId, constrained.x, constrained.y)
    } else {
      clearTransform()
    }

    stateRef.current.isDragging = false
    stateRef.current.dragPointerId = null
    hideDebug()
  }, [sticker, onMove, constrainPosition, clearTransform, hideDebug, overlayRef])

  //======================================
  // WEBKIT GESTURE EVENT HANDLERS (iOS Safari)
  // These are the KEY to fixing pinch on iOS!
  //======================================

  const handleGestureStart = useCallback((e) => {
    // CRITICAL: Prevent default to stop page zoom, but handle locally
    e.preventDefault()
    e.stopPropagation()

    // Cancel any drag
    stateRef.current.isDragging = false

    stateRef.current.isPinching = true
    stateRef.current.pinchStartScale = sticker.scale || 45
    stateRef.current.pinchStartRotation = sticker.rotation || 0
    stateRef.current.pinchCurrentScale = sticker.scale || 45
    stateRef.current.pinchCurrentRotation = sticker.rotation || 0

    onSelect(sticker.placedId)
    updateDebug('GESTURE START (WebKit)')
  }, [sticker, onSelect, updateDebug])

  const handleGestureChange = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!stateRef.current.isPinching) return

    // iOS Safari gives us e.scale relative to gesture start (1.0 = no change)
    // and e.rotation in degrees relative to gesture start (0 = no change)
    // Rotation dampened to 0.4x for more controlled feel
    const newScale = clampScale(stateRef.current.pinchStartScale * e.scale)
    const newRotation = stateRef.current.pinchStartRotation + (e.rotation * 0.4)

    stateRef.current.pinchCurrentScale = newScale
    stateRef.current.pinchCurrentRotation = newRotation

    updateDebug(`GESTURE: scale=${newScale.toFixed(1)} rot=${newRotation.toFixed(0)}`)

    applyTransform(
      stateRef.current.dragTranslateX,
      stateRef.current.dragTranslateY,
      newScale,
      newRotation
    )
  }, [clampScale, applyTransform, updateDebug])

  const handleGestureEnd = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!stateRef.current.isPinching) return

    // Commit final values - e.scale is still available in gestureend
    // Use same 0.4x rotation dampening as gesturechange
    const finalScale = clampScale(stateRef.current.pinchStartScale * e.scale)
    const finalRotation = stateRef.current.pinchStartRotation + (e.rotation * 0.4)

    stateRef.current.isPinching = false

    clearTransform()
    onResize(sticker.placedId, finalScale)
    if (onRotate) {
      onRotate(sticker.placedId, finalRotation)
    }

    updateDebug(`GESTURE END: scale=${finalScale.toFixed(1)}`)
    setTimeout(hideDebug, 500)
  }, [sticker.placedId, clampScale, clearTransform, onResize, onRotate, updateDebug, hideDebug])

  //======================================
  // TOUCH EVENT HANDLERS (Android fallback)
  //======================================

  const handleTouchStart = useCallback((e) => {
    // Only use touch events for pinch on NON-WebKit browsers
    // WebKit uses gesture events above
    if (IS_WEBKIT) return

    if (e.touches.length === 2) {
      e.preventDefault()
      e.stopPropagation()

      stateRef.current.isDragging = false

      const distance = getTouchDistance(e.touches)
      const angle = getTouchAngle(e.touches)

      stateRef.current.isPinching = true
      stateRef.current.pinchStartDistance = distance
      stateRef.current.pinchStartAngle = angle
      stateRef.current.pinchStartScale = sticker.scale || 45
      stateRef.current.pinchStartRotation = sticker.rotation || 0
      stateRef.current.pinchCurrentScale = sticker.scale || 45
      stateRef.current.pinchCurrentRotation = sticker.rotation || 0

      onSelect(sticker.placedId)
      updateDebug(`TOUCH PINCH START dist=${distance.toFixed(0)}`)
    }
  }, [sticker, onSelect, getTouchDistance, getTouchAngle, updateDebug])

  const handleTouchMove = useCallback((e) => {
    // Only use touch events for pinch on NON-WebKit browsers
    if (IS_WEBKIT) return

    if (!stateRef.current.isPinching) return
    if (e.touches.length !== 2) return

    e.preventDefault()

    // Manual distance calculation for Android with reduced sensitivity
    const currentDistance = getTouchDistance(e.touches)
    const scaleRatio = currentDistance / stateRef.current.pinchStartDistance

    // Apply dampening to reduce sensitivity (0.4 = 40% sensitivity)
    const scaleDelta = scaleRatio - 1.0
    const dampenedDelta = scaleDelta * 0.4
    const dampenedRatio = 1.0 + dampenedDelta
    const newScale = clampScale(stateRef.current.pinchStartScale * dampenedRatio)

    const currentAngle = getTouchAngle(e.touches)
    const angleDelta = currentAngle - stateRef.current.pinchStartAngle
    const newRotation = stateRef.current.pinchStartRotation + (angleDelta * 0.4)

    stateRef.current.pinchCurrentScale = newScale
    stateRef.current.pinchCurrentRotation = newRotation

    updateDebug(`TOUCH PINCH: scale=${newScale.toFixed(1)}`)

    applyTransform(
      stateRef.current.dragTranslateX,
      stateRef.current.dragTranslateY,
      newScale,
      newRotation
    )
  }, [clampScale, getTouchDistance, getTouchAngle, applyTransform, updateDebug])

  const handleTouchEnd = useCallback((e) => {
    // Only use touch events for pinch on NON-WebKit browsers
    if (IS_WEBKIT) return

    if (!stateRef.current.isPinching) return

    if (e.touches.length < 2) {
      const finalScale = clampScale(stateRef.current.pinchCurrentScale)
      const finalRotation = stateRef.current.pinchCurrentRotation

      stateRef.current.isPinching = false

      clearTransform()
      onResize(sticker.placedId, finalScale)
      if (onRotate) {
        onRotate(sticker.placedId, finalRotation)
      }

      updateDebug(`TOUCH PINCH END: scale=${finalScale.toFixed(1)}`)
      setTimeout(hideDebug, 500)
    }
  }, [sticker.placedId, clampScale, clearTransform, onResize, onRotate, updateDebug, hideDebug])

  //======================================
  // EVENT LISTENER SETUP
  //======================================

  useEffect(() => {
    const element = stickerRef.current
    if (!element) return

    // Pointer events for drag
    element.addEventListener('pointerdown', handlePointerDown, { passive: false })
    element.addEventListener('pointermove', handlePointerMove, { passive: false })
    element.addEventListener('pointerup', handlePointerUp, { passive: false })
    element.addEventListener('pointercancel', handlePointerUp, { passive: false })

    // WebKit Gesture events for iOS Safari pinch
    // CRITICAL: These are attached to the ELEMENT, not the document!
    // This allows us to handle pinch locally while preventing page zoom
    if (IS_WEBKIT) {
      element.addEventListener('gesturestart', handleGestureStart, { passive: false })
      element.addEventListener('gesturechange', handleGestureChange, { passive: false })
      element.addEventListener('gestureend', handleGestureEnd, { passive: false })
    }

    // Touch events for Android fallback (non-WebKit)
    if (!IS_WEBKIT) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false })
      element.addEventListener('touchmove', handleTouchMove, { passive: false })
      element.addEventListener('touchend', handleTouchEnd, { passive: false })
      element.addEventListener('touchcancel', handleTouchEnd, { passive: false })
    }

    // Prevent context menu
    const preventContextMenu = (e) => e.preventDefault()
    element.addEventListener('contextmenu', preventContextMenu)

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)

      if (IS_WEBKIT) {
        element.removeEventListener('gesturestart', handleGestureStart)
        element.removeEventListener('gesturechange', handleGestureChange)
        element.removeEventListener('gestureend', handleGestureEnd)
      }

      if (!IS_WEBKIT) {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchmove', handleTouchMove)
        element.removeEventListener('touchend', handleTouchEnd)
        element.removeEventListener('touchcancel', handleTouchEnd)
      }

      element.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [
    handlePointerDown, handlePointerMove, handlePointerUp,
    handleGestureStart, handleGestureChange, handleGestureEnd,
    handleTouchStart, handleTouchMove, handleTouchEnd
  ])

  // Cleanup RAF on unmount
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

  const renderScale = clampScale(sticker.scale || 45)
  const stickerDisplaySize = sticker.type === 'image' ? renderScale * 2 : renderScale * 2.4

  return (
    <div
      ref={stickerRef}
      data-sticker-id={sticker.placedId}
      data-testid="draggable-sticker"
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: IS_WEBKIT ? `${stickerDisplaySize}px` : undefined,
        height: IS_WEBKIT ? `${stickerDisplaySize}px` : undefined,
        transform: IS_WEBKIT
          ? `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`
          : `translate3d(-50%, -50%, 0) scale(${renderScale}) rotate(${sticker.rotation || 0}deg)`,
        WebkitTransform: IS_WEBKIT
          ? `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`
          : `translate3d(-50%, -50%, 0) scale(${renderScale}) rotate(${sticker.rotation || 0}deg)`,
        fontSize: sticker.type === 'image' ? '20px' : '24px',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        zIndex: sticker.zIndex || 1,
        border: 'none',
        borderRadius: sticker.type === 'image' ? '4px' : '8px',
        padding: '0px',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        backfaceVisibility: IS_WEBKIT ? 'visible' : 'hidden',
        WebkitBackfaceVisibility: IS_WEBKIT ? 'visible' : 'hidden',
        transformStyle: IS_WEBKIT ? 'flat' : 'preserve-3d',
        WebkitTransformStyle: IS_WEBKIT ? 'flat' : 'preserve-3d',
        willChange: 'transform'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(sticker.placedId)
      }}
    >
      {sticker.type === 'emoji' ? (
        sticker.emoji
      ) : (
        <img
          ref={imgRef}
          src={sticker.imageUrl || sticker.fallbackUrl}
          alt={sticker.name}
          onError={(e) => {
            if (e.target.src !== sticker.fallbackUrl) {
              e.target.src = sticker.fallbackUrl
            }
          }}
          style={{
            width: IS_WEBKIT ? `${stickerDisplaySize}px` : '20px',
            height: IS_WEBKIT ? `${stickerDisplaySize}px` : '20px',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
          }}
          draggable={false}
        />
      )}

      {isSelected && (
        <div
          ref={deleteButtonRef}
          data-testid="sticker-delete"
          style={{
            position: 'absolute',
            top: IS_WEBKIT ? '-8px' : `${-8 / renderScale}px`,
            right: IS_WEBKIT ? '-8px' : `${-8 / renderScale}px`,
            width: '32px',
            height: '32px',
            backgroundColor: '#FF4757',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid white',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            touchAction: 'none',
            transform: IS_WEBKIT ? 'none' : `scale(${1 / renderScale})`,
            transformOrigin: 'top right'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(sticker.placedId)
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onDelete(sticker.placedId)
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  )
})

OptimizedDraggableSticker.displayName = 'OptimizedDraggableSticker'

export default OptimizedDraggableSticker

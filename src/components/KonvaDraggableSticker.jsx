/**
 * KonvaDraggableSticker.jsx
 *
 * Konva-based draggable sticker with proper Transformer handles.
 * Replaces OptimizedDraggableSticker.jsx for the canvas.
 *
 * Features:
 * - Native Konva drag/drop
 * - Transformer for resize/rotate handles
 * - Touch gesture support
 * - Consistent rendering for preview AND export (WYSIWYG)
 */

import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Image as KonvaImage, Group, Rect } from 'react-konva'
import useImage from 'use-image'

/**
 * Individual sticker component rendered on Konva Stage
 */
const KonvaDraggableSticker = memo(({
  sticker,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onDelete,
  containerWidth,
  containerHeight
}) => {
  const shapeRef = useRef(null)

  // Load sticker image
  const [image] = useImage(sticker.imageUrl || sticker.fallbackUrl, 'anonymous')

  // Convert percentage position to absolute pixels
  const x = (sticker.x / 100) * containerWidth
  const y = (sticker.y / 100) * containerHeight

  // Sticker size based on scale (similar logic to OptimizedDraggableSticker)
  const baseSize = sticker.type === 'image' ? sticker.scale * 2 : sticker.scale * 2.4
  const width = baseSize
  const height = baseSize

  // Handle drag end - convert back to percentage
  const handleDragEnd = useCallback((e) => {
    const node = e.target
    const newX = (node.x() / containerWidth) * 100
    const newY = (node.y() / containerHeight) * 100

    onDragEnd(sticker.placedId, newX, newY)
  }, [sticker.placedId, containerWidth, containerHeight, onDragEnd])

  // Handle transform end (resize/rotate)
  const handleTransformEnd = useCallback((e) => {
    const node = shapeRef.current
    if (!node) return

    // Get new scale and rotation from transform
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()

    // Calculate new size (use average of x/y scale)
    const avgScale = (scaleX + scaleY) / 2
    const newScale = sticker.scale * avgScale

    // Reset scale on node (we store scale in our state, not on the node)
    node.scaleX(1)
    node.scaleY(1)

    // Get new position (might have changed during transform)
    const newX = (node.x() / containerWidth) * 100
    const newY = (node.y() / containerHeight) * 100

    onTransformEnd(sticker.placedId, {
      x: newX,
      y: newY,
      scale: Math.max(20, Math.min(180, newScale)), // Clamp scale
      rotation: rotation
    })
  }, [sticker.placedId, sticker.scale, containerWidth, containerHeight, onTransformEnd])

  // Handle click to select
  const handleClick = useCallback((e) => {
    e.cancelBubble = true
    onSelect(sticker.placedId)
  }, [sticker.placedId, onSelect])

  // Handle tap for mobile
  const handleTap = useCallback((e) => {
    e.cancelBubble = true
    onSelect(sticker.placedId)
  }, [sticker.placedId, onSelect])

  if (sticker.type === 'emoji') {
    // For emoji stickers, render as text
    // Note: Konva Text would be used here, but for simplicity
    // we'll focus on image stickers for now
    return null
  }

  if (!image) {
    // Show placeholder while loading
    return (
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        offsetX={width / 2}
        offsetY={height / 2}
        rotation={sticker.rotation || 0}
        fill="#f0f0f0"
        cornerRadius={4}
        draggable
        onClick={handleClick}
        onTap={handleTap}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
    )
  }

  return (
    <KonvaImage
      ref={shapeRef}
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      rotation={sticker.rotation || 0}
      draggable
      onClick={handleClick}
      onTap={handleTap}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      // Performance optimisations
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      hitStrokeWidth={0}
    />
  )
})

KonvaDraggableSticker.displayName = 'KonvaDraggableSticker'

export default KonvaDraggableSticker

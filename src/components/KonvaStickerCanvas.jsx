/**
 * KONVA STICKER CANVAS - Premium Sticker Editor with Proper Clipping
 *
 * Replaces the problematic SVG foreignObject approach in MaskedPhoneDisplay
 * with a Konva-based solution that:
 * 1. Properly clips stickers to phone case boundary
 * 2. Provides premium Casetify-style transform handles
 * 3. Works reliably on iOS Safari (no foreignObject issues)
 *
 * Design System: PimpMyCase Kiosk Brand
 * - Primary: Mint #98D4BB, Sky #7ECFED, Coral #E8734A
 * - Transform handles: Coral with white fill (premium feel)
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Shape, Rect } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { getClipPathData, getMaskPosition } from '../utils/phoneCaseLayout'

// Enable touch events
Konva.hitOnDragEnabled = true
Konva.captureTouchEventsEnabled = true

// Design system colors (from pimpmycase-design-system-v3.md)
const COLORS = {
  coral: '#E8734A',      // Primary accent
  mint: '#98D4BB',       // Primary
  sky: '#7ECFED',        // Primary variant
  pink: '#F5C1C1',       // Decorative
  white: '#FFFFFF',
  black: '#1A1A1A',
  danger: '#FF4757',     // Delete button
  grey: '#6B7280'
}

// =====================
// SVG PATH PARSER - Same as KonvaCanvasEditor for consistency
// =====================
const parseSvgPath = (pathString) => {
  if (!pathString) return []

  const commands = []
  const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi
  let match

  while ((match = regex.exec(pathString)) !== null) {
    const cmd = match[1].toUpperCase()
    const args = match[2].trim().split(/[\s,]+/).filter(s => s).map(Number)
    commands.push({ cmd, args })
  }

  return commands
}

// Draw SVG path on Konva context
const drawSvgPath = (ctx, commands, scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0) => {
  let currentX = 0
  let currentY = 0

  commands.forEach(({ cmd, args }) => {
    switch (cmd) {
      case 'M':
        currentX = args[0] * scaleX + offsetX
        currentY = args[1] * scaleY + offsetY
        ctx.moveTo(currentX, currentY)
        break
      case 'L':
        currentX = args[0] * scaleX + offsetX
        currentY = args[1] * scaleY + offsetY
        ctx.lineTo(currentX, currentY)
        break
      case 'H':
        currentX = args[0] * scaleX + offsetX
        ctx.lineTo(currentX, currentY)
        break
      case 'V':
        currentY = args[0] * scaleY + offsetY
        ctx.lineTo(currentX, currentY)
        break
      case 'C':
        ctx.bezierCurveTo(
          args[0] * scaleX + offsetX, args[1] * scaleY + offsetY,
          args[2] * scaleX + offsetX, args[3] * scaleY + offsetY,
          args[4] * scaleX + offsetX, args[5] * scaleY + offsetY
        )
        currentX = args[4] * scaleX + offsetX
        currentY = args[5] * scaleY + offsetY
        break
      case 'Q':
        ctx.quadraticCurveTo(
          args[0] * scaleX + offsetX, args[1] * scaleY + offsetY,
          args[2] * scaleX + offsetX, args[3] * scaleY + offsetY
        )
        currentX = args[2] * scaleX + offsetX
        currentY = args[3] * scaleY + offsetY
        break
      case 'Z':
        ctx.closePath()
        break
      default:
        for (let i = 0; i < args.length; i += 2) {
          if (args[i] !== undefined && args[i + 1] !== undefined) {
            currentX = args[i] * scaleX + offsetX
            currentY = args[i + 1] * scaleY + offsetY
            ctx.lineTo(currentX, currentY)
          }
        }
    }
  })
}

// =====================
// DRAGGABLE STICKER COMPONENT
// =====================
const DraggableSticker = ({
  id,
  type,
  src,
  emoji,
  x,
  y,
  width,
  height,
  rotation,
  scaleX = 1,
  scaleY = 1,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  containerWidth,
  containerHeight,
  maskedBounds
}) => {
  const [image] = useImage(src, 'anonymous')
  const stickerRef = useRef()
  const transformerRef = useRef()

  // Calculate sticker size
  const stickerSize = useMemo(() => {
    if (width && height) return { width, height }

    // Default size based on type
    const baseSize = type === 'image' ? 70 : 50
    return { width: baseSize, height: baseSize }
  }, [type, width, height])

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && stickerRef.current) {
      transformerRef.current.nodes([stickerRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // Constrain position within bounds
  const constrainPosition = useCallback((newX, newY) => {
    if (!maskedBounds) return { x: newX, y: newY }

    const padding = 5
    const minX = (maskedBounds.left / 100) * containerWidth + padding
    const maxX = (maskedBounds.right / 100) * containerWidth - stickerSize.width - padding
    const minY = (maskedBounds.top / 100) * containerHeight + padding
    const maxY = (maskedBounds.bottom / 100) * containerHeight - stickerSize.height - padding

    return {
      x: Math.max(minX, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY))
    }
  }, [maskedBounds, containerWidth, containerHeight, stickerSize])

  const handleDragEnd = useCallback((e) => {
    const { x, y } = constrainPosition(e.target.x(), e.target.y())

    // Convert to percentage
    const xPercent = (x / containerWidth) * 100
    const yPercent = (y / containerHeight) * 100

    onChange({ x: xPercent, y: yPercent })
  }, [constrainPosition, containerWidth, containerHeight, onChange])

  const handleTransformEnd = useCallback(() => {
    const node = stickerRef.current
    if (!node) return

    const newScale = node.scaleX()
    const newRotation = node.rotation()

    // Convert position to percentage
    const xPercent = (node.x() / containerWidth) * 100
    const yPercent = (node.y() / containerHeight) * 100

    // Calculate new scale value (20-180 range like OptimizedDraggableSticker)
    const currentScale = type === 'image' ? stickerSize.width / 2 : stickerSize.width / 2.4
    const newScaleValue = Math.max(20, Math.min(180, currentScale * newScale))

    onChange({
      x: xPercent,
      y: yPercent,
      scale: newScaleValue,
      rotation: newRotation
    })

    // Reset transform
    node.scaleX(1)
    node.scaleY(1)
  }, [containerWidth, containerHeight, onChange, type, stickerSize])

  // Convert percentage position to pixels
  const pixelX = (x / 100) * containerWidth
  const pixelY = (y / 100) * containerHeight

  // Render image sticker
  if (type === 'image') {
    if (!image) {
      // Loading placeholder
      return (
        <Rect
          x={pixelX - stickerSize.width / 2}
          y={pixelY - stickerSize.height / 2}
          width={stickerSize.width}
          height={stickerSize.height}
          fill="#E5E5E5"
          cornerRadius={4}
        />
      )
    }

    return (
      <>
        <KonvaImage
          ref={stickerRef}
          id={id}
          image={image}
          x={pixelX}
          y={pixelY}
          width={stickerSize.width}
          height={stickerSize.height}
          offsetX={stickerSize.width / 2}
          offsetY={stickerSize.height / 2}
          rotation={rotation || 0}
          scaleX={scaleX}
          scaleY={scaleY}
          draggable
          onClick={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onTap={(e) => {
            e.cancelBubble = true
            onSelect()
          }}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
        />
        {isSelected && (
          <Transformer
            ref={transformerRef}
            // Premium styling - Coral accent (matches KonvaCanvasEditor)
            anchorSize={14}
            anchorCornerRadius={7}
            anchorFill={COLORS.white}
            anchorStroke={COLORS.coral}
            anchorStrokeWidth={2}
            borderStroke={COLORS.coral}
            borderStrokeWidth={2}
            borderDash={[4, 4]}
            // Rotation
            rotateEnabled={true}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            rotationSnapTolerance={10}
            // Keep aspect ratio
            keepRatio={true}
            // Only corner anchors for clean mobile UX
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            // Scale limits
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox
              }
              if (Math.abs(newBox.width) > 200 || Math.abs(newBox.height) > 200) {
                return oldBox
              }
              return newBox
            }}
          />
        )}
      </>
    )
  }

  // Emoji sticker - render as text on canvas
  return (
    <>
      <Group
        ref={stickerRef}
        id={id}
        x={pixelX}
        y={pixelY}
        rotation={rotation || 0}
        scaleX={scaleX}
        scaleY={scaleY}
        draggable
        onClick={(e) => {
          e.cancelBubble = true
          onSelect()
        }}
        onTap={(e) => {
          e.cancelBubble = true
          onSelect()
        }}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        <Shape
          width={stickerSize.width}
          height={stickerSize.height}
          offsetX={stickerSize.width / 2}
          offsetY={stickerSize.height / 2}
          sceneFunc={(context, shape) => {
            context.font = `${stickerSize.width * 0.8}px Arial`
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(emoji || '⭐', 0, 0)
          }}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          anchorSize={14}
          anchorCornerRadius={7}
          anchorFill={COLORS.white}
          anchorStroke={COLORS.coral}
          anchorStrokeWidth={2}
          borderStroke={COLORS.coral}
          borderStrokeWidth={2}
          borderDash={[4, 4]}
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          keepRatio={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />
      )}
    </>
  )
}

// =====================
// DELETE BUTTON (rendered outside Konva for reliability)
// =====================
const DeleteButton = ({ x, y, containerRef, onDelete }) => {
  if (!containerRef?.current) return null

  const containerRect = containerRef.current.getBoundingClientRect()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onDelete()
      }}
      style={{
        position: 'absolute',
        left: x - 16,
        top: y - 16,
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: COLORS.danger,
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        touchAction: 'none'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M1 1L11 11M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

// =====================
// MAIN KONVA STICKER CANVAS COMPONENT
// =====================
const KonvaStickerCanvas = ({
  stickers = [],
  selectedStickerId,
  onStickerSelect,
  onStickerMove,
  onStickerResize,
  onStickerRotate,
  onStickerDelete,
  phoneModel = 'iPhone 17 Pro Max',
  containerWidth = 250,
  containerHeight = 416,
  maskedBounds
}) => {
  const stageRef = useRef()
  const containerRef = useRef()

  // Get clip path data for this phone model
  const clipPathData = useMemo(() => getClipPathData(phoneModel), [phoneModel])
  const maskPosition = useMemo(() => getMaskPosition(phoneModel), [phoneModel])

  // Parse SVG path for clipping
  const clipCommands = useMemo(() => {
    if (!clipPathData?.path) return []
    return parseSvgPath(clipPathData.path)
  }, [clipPathData])

  // Calculate clip path scaling
  const clipScale = useMemo(() => {
    if (!clipPathData?.viewBox) return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 }

    const [, , vbWidth, vbHeight] = clipPathData.viewBox.split(' ').map(Number)

    const parsePercent = (str) => parseFloat(str) / 100
    const maskX = parsePercent(maskPosition.x) * containerWidth
    const maskY = parsePercent(maskPosition.y) * containerHeight
    const maskW = parsePercent(maskPosition.width) * containerWidth
    const maskH = parsePercent(maskPosition.height) * containerHeight

    return {
      scaleX: maskW / vbWidth,
      scaleY: maskH / vbHeight,
      offsetX: maskX,
      offsetY: maskY
    }
  }, [clipPathData, maskPosition, containerWidth, containerHeight])

  // Clip function for Layer
  const clipFunction = useCallback((ctx) => {
    if (clipCommands.length === 0) {
      // Fallback: rounded rectangle
      const padding = containerWidth * 0.08
      const radius = 30
      ctx.beginPath()
      ctx.moveTo(padding + radius, padding)
      ctx.lineTo(containerWidth - padding - radius, padding)
      ctx.quadraticCurveTo(containerWidth - padding, padding, containerWidth - padding, padding + radius)
      ctx.lineTo(containerWidth - padding, containerHeight - padding - radius)
      ctx.quadraticCurveTo(containerWidth - padding, containerHeight - padding, containerWidth - padding - radius, containerHeight - padding)
      ctx.lineTo(padding + radius, containerHeight - padding)
      ctx.quadraticCurveTo(padding, containerHeight - padding, padding, containerHeight - padding - radius)
      ctx.lineTo(padding, padding + radius)
      ctx.quadraticCurveTo(padding, padding, padding + radius, padding)
      ctx.closePath()
      return
    }

    ctx.beginPath()
    drawSvgPath(
      ctx,
      clipCommands,
      clipScale.scaleX,
      clipScale.scaleY,
      clipScale.offsetX,
      clipScale.offsetY
    )
  }, [clipCommands, clipScale, containerWidth, containerHeight])

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty && onStickerSelect) {
      onStickerSelect(null)
    }
  }, [onStickerSelect])

  // Handle sticker changes
  const handleStickerChange = useCallback((stickerId, updates) => {
    if (updates.x !== undefined && updates.y !== undefined && onStickerMove) {
      onStickerMove(stickerId, updates.x, updates.y)
    }
    if (updates.scale !== undefined && onStickerResize) {
      onStickerResize(stickerId, updates.scale)
    }
    if (updates.rotation !== undefined && onStickerRotate) {
      onStickerRotate(stickerId, updates.rotation)
    }
  }, [onStickerMove, onStickerResize, onStickerRotate])

  // Calculate delete button position
  const selectedSticker = stickers.find(s => s.placedId === selectedStickerId)
  const deleteButtonPos = useMemo(() => {
    if (!selectedSticker) return null

    const scale = selectedSticker.scale || 45
    const size = selectedSticker.type === 'image' ? scale * 2 : scale * 2.4

    const pixelX = (selectedSticker.x / 100) * containerWidth
    const pixelY = (selectedSticker.y / 100) * containerHeight

    return {
      x: pixelX + size / 2 + 8,
      y: pixelY - size / 2 - 8
    }
  }, [selectedSticker, containerWidth, containerHeight])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: stickers.length > 0 ? 'auto' : 'none',
        zIndex: 10,
        touchAction: 'none'
      }}
    >
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        onClick={handleStageClick}
        onTap={handleStageClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* Clipped Layer - stickers are masked to phone boundary */}
        <Layer clipFunc={clipFunction}>
          {stickers.map((sticker) => {
            // Calculate pixel dimensions from scale
            const scale = sticker.scale || 45
            const isImageSticker = sticker.type === 'image'
            const stickerWidth = isImageSticker ? scale * 2 : scale * 2.4
            const stickerHeight = stickerWidth

            return (
              <DraggableSticker
                key={sticker.placedId}
                id={sticker.placedId}
                type={sticker.type}
                src={sticker.imageUrl || sticker.highresUrl || sticker.fallbackUrl}
                emoji={sticker.emoji}
                x={sticker.x}
                y={sticker.y}
                width={stickerWidth}
                height={stickerHeight}
                rotation={sticker.rotation || 0}
                isSelected={selectedStickerId === sticker.placedId}
                onSelect={() => onStickerSelect && onStickerSelect(sticker.placedId)}
                onChange={(updates) => handleStickerChange(sticker.placedId, updates)}
                onDelete={() => onStickerDelete && onStickerDelete(sticker.placedId)}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                maskedBounds={maskedBounds}
              />
            )
          })}
        </Layer>
      </Stage>

      {/* Delete button - HTML for reliable touch */}
      {selectedStickerId && deleteButtonPos && (
        <DeleteButton
          x={deleteButtonPos.x}
          y={deleteButtonPos.y}
          containerRef={containerRef}
          onDelete={() => onStickerDelete && onStickerDelete(selectedStickerId)}
        />
      )}
    </div>
  )
}

export default KonvaStickerCanvas

/**
 * PREMIUM KONVA CANVAS EDITOR v2
 *
 * Professional phone case customization editor with PROPER CLIPPING
 *
 * KEY FIX: User images are now CLIPPED to the phone case printable area
 * using Konva's clipFunc with SVG path data from phoneCaseLayout.js
 *
 * Architecture:
 * 1. Container with phone back image (static, visual only)
 * 2. Konva Stage with clipped Layer (user's design is masked to case boundary)
 * 3. Premium transform controls (Konva Transformer)
 * 4. Clean, intuitive toolbar
 *
 * Design System: PimpMyCase Kiosk Brand
 * - Primary: Mint #98D4BB, Sky #7ECFED, Coral #E8734A
 * - Typography: System fonts (SF Pro for Apple-like feel)
 * - Rounded corners: 12-16px
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Stage, Layer, Image, Transformer, Group, Shape } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { getPhoneBackImage, getClipPathData, getMaskPosition } from '../utils/phoneCaseLayout'

// Enable touch events for mobile
Konva.hitOnDragEnabled = true
Konva.captureTouchEventsEnabled = true

// Design system colors
const COLORS = {
  coral: '#E8734A',
  mint: '#98D4BB',
  sky: '#7ECFED',
  white: '#FFFFFF',
  black: '#1A1A1A',
  grey: '#6B7280',
  lightGrey: '#F5F5F5',
  danger: '#E53935'
}

// =====================
// SVG PATH PARSER - Converts SVG path string to Konva-compatible drawing commands
// =====================
const parseSvgPath = (pathString) => {
  if (!pathString) return []

  const commands = []
  // Match SVG path commands: letter followed by numbers (with optional decimals and negatives)
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
      case 'M': // Move to
        currentX = args[0] * scaleX + offsetX
        currentY = args[1] * scaleY + offsetY
        ctx.moveTo(currentX, currentY)
        break
      case 'L': // Line to
        currentX = args[0] * scaleX + offsetX
        currentY = args[1] * scaleY + offsetY
        ctx.lineTo(currentX, currentY)
        break
      case 'H': // Horizontal line
        currentX = args[0] * scaleX + offsetX
        ctx.lineTo(currentX, currentY)
        break
      case 'V': // Vertical line
        currentY = args[0] * scaleY + offsetY
        ctx.lineTo(currentX, currentY)
        break
      case 'C': // Cubic bezier
        ctx.bezierCurveTo(
          args[0] * scaleX + offsetX, args[1] * scaleY + offsetY,
          args[2] * scaleX + offsetX, args[3] * scaleY + offsetY,
          args[4] * scaleX + offsetX, args[5] * scaleY + offsetY
        )
        currentX = args[4] * scaleX + offsetX
        currentY = args[5] * scaleY + offsetY
        break
      case 'Q': // Quadratic bezier
        ctx.quadraticCurveTo(
          args[0] * scaleX + offsetX, args[1] * scaleY + offsetY,
          args[2] * scaleX + offsetX, args[3] * scaleY + offsetY
        )
        currentX = args[2] * scaleX + offsetX
        currentY = args[3] * scaleY + offsetY
        break
      case 'Z': // Close path
        ctx.closePath()
        break
      default:
        // For unsupported commands, try to handle as line segments
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
// DRAGGABLE IMAGE COMPONENT
// =====================
const DraggableImage = ({
  id,
  src,
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
  containerWidth,
  containerHeight
}) => {
  const [image] = useImage(src, 'anonymous')
  const imageRef = useRef()
  const transformerRef = useRef()

  // Calculate initial dimensions preserving aspect ratio
  const imageDimensions = useMemo(() => {
    if (!image) return { width: width || 150, height: height || 150 }

    const imgWidth = image.width
    const imgHeight = image.height
    const imgRatio = imgWidth / imgHeight

    // Fit within 80% of container (leave room for case frame)
    const maxWidth = containerWidth * 0.80
    const maxHeight = containerHeight * 0.80

    let targetWidth, targetHeight

    if (imgRatio > maxWidth / maxHeight) {
      targetWidth = maxWidth
      targetHeight = maxWidth / imgRatio
    } else {
      targetHeight = maxHeight
      targetWidth = maxHeight * imgRatio
    }

    return {
      width: width || targetWidth,
      height: height || targetHeight
    }
  }, [image, width, height, containerWidth, containerHeight])

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  if (!image) return null

  return (
    <>
      <Image
        ref={imageRef}
        id={id}
        image={image}
        x={x}
        y={y}
        width={imageDimensions.width}
        height={imageDimensions.height}
        rotation={rotation || 0}
        scaleX={scaleX}
        scaleY={scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y()
          })
        }}
        onTransformEnd={() => {
          const node = imageRef.current
          if (!node) return

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(30, node.width() * node.scaleX()),
            height: Math.max(30, node.height() * node.scaleY()),
            rotation: node.rotation(),
            scaleX: 1,
            scaleY: 1
          })

          // Reset scale after baking into dimensions
          node.scaleX(1)
          node.scaleY(1)
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          // Premium styling - clean and minimal
          anchorSize={12}
          anchorCornerRadius={6}
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
          // Keep aspect ratio (CRITICAL - prevents distortion)
          keepRatio={true}
          // Only corner anchors for clean mobile UX
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          // Bounds
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 30 || Math.abs(newBox.height) < 30) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}

// =====================
// TOOLBAR BUTTON
// =====================
const ToolbarButton = ({ onClick, disabled, icon, label, variant = 'default' }) => {
  const variants = {
    default: {
      background: COLORS.lightGrey,
      color: COLORS.black,
      border: 'none'
    },
    primary: {
      background: COLORS.coral,
      color: COLORS.white,
      border: 'none'
    },
    danger: {
      background: '#FFF0F0',
      color: COLORS.danger,
      border: 'none'
    }
  }

  const style = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '8px 12px',
    minWidth: '52px',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 150ms ease',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
    ...variants[variant]
  }

  return (
    <button onClick={onClick} disabled={disabled} style={style} aria-label={label}>
      {icon}
      <span style={{
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
      }}>
        {label}
      </span>
    </button>
  )
}

// =====================
// ICONS
// =====================
const UndoIcon = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
)

const RedoIcon = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
)

const UploadIcon = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const TrashIcon = ({ color = 'currentColor' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

// =====================
// MAIN KONVA EDITOR COMPONENT
// =====================
const KonvaCanvasEditor = ({
  initialImage,
  phoneModel = 'iPhone 17 Pro Max',
  onExport,
  onTransformChange,
  containerWidth = 250,
  containerHeight = 416
}) => {
  const stageRef = useRef()
  const fileInputRef = useRef()

  // Get phone assets
  const phoneBackImage = useMemo(() => getPhoneBackImage(phoneModel), [phoneModel])
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

    // Parse mask position percentages
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

  // State
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Pinch-to-zoom state
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)
  const lastCenter = useRef(null)
  const lastDist = useRef(0)

  // =====================
  // HISTORY MANAGEMENT
  // =====================
  const pushHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(newElements))
    // Limit history to 20 items
    if (newHistory.length > 20) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements(JSON.parse(history[newIndex]))
      setSelectedId(null)
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements(JSON.parse(history[newIndex]))
      setSelectedId(null)
    }
  }, [historyIndex, history])

  // =====================
  // ELEMENT OPERATIONS
  // =====================
  const addImage = useCallback((src) => {
    const tempImg = new window.Image()
    tempImg.crossOrigin = 'anonymous'
    tempImg.onload = () => {
      const imgRatio = tempImg.width / tempImg.height

      // Fit within printable area
      const maxWidth = containerWidth * 0.78
      const maxHeight = containerHeight * 0.78

      let targetWidth, targetHeight

      if (imgRatio > maxWidth / maxHeight) {
        targetWidth = maxWidth
        targetHeight = maxWidth / imgRatio
      } else {
        targetHeight = maxHeight
        targetWidth = maxHeight * imgRatio
      }

      const id = `img-${Date.now()}`
      const newElement = {
        id,
        type: 'image',
        src,
        x: (containerWidth - targetWidth) / 2,
        y: (containerHeight - targetHeight) / 2,
        width: targetWidth,
        height: targetHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }

      const newElements = [...elements, newElement]
      setElements(newElements)
      pushHistory(newElements)
      setSelectedId(id)
    }
    tempImg.onerror = () => {
      console.error('Failed to load image:', src?.substring(0, 50))
    }
    tempImg.src = src
  }, [elements, containerWidth, containerHeight, pushHistory])

  const updateElement = useCallback((id, updates) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    )
    setElements(newElements)
    pushHistory(newElements)

    if (onTransformChange) {
      const element = newElements.find(el => el.id === id)
      if (element) {
        onTransformChange({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          rotation: element.rotation
        })
      }
    }
  }, [elements, pushHistory, onTransformChange])

  const deleteElement = useCallback((id) => {
    const newElements = elements.filter((el) => el.id !== id)
    setElements(newElements)
    pushHistory(newElements)
    setSelectedId(null)
  }, [elements, pushHistory])

  // =====================
  // FILE UPLOAD
  // =====================
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      addImage(event.target.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [addImage])

  // =====================
  // PINCH-TO-ZOOM
  // =====================
  const getDistance = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  const getCenter = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 })

  const handleTouchMove = useCallback((e) => {
    e.evt.preventDefault()
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]

    if (touch1 && touch2) {
      const stage = stageRef.current
      if (stage?.isDragging()) stage.stopDrag()

      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }

      if (!lastCenter.current) {
        lastCenter.current = getCenter(p1, p2)
        return
      }

      const newCenter = getCenter(p1, p2)
      const dist = getDistance(p1, p2)

      if (!lastDist.current) {
        lastDist.current = dist
        return
      }

      const scale = Math.max(0.5, Math.min(3, stageScale * (dist / lastDist.current)))

      setStageScale(scale)
      setStagePos({
        x: newCenter.x - (newCenter.x - stagePos.x) * (scale / stageScale),
        y: newCenter.y - (newCenter.y - stagePos.y) * (scale / stageScale)
      })

      lastDist.current = dist
      lastCenter.current = newCenter
    }
  }, [stagePos, stageScale])

  const handleTouchEnd = useCallback(() => {
    lastDist.current = 0
    lastCenter.current = null
  }, [])

  // =====================
  // CLICK HANDLING
  // =====================
  const handleStageClick = useCallback((e) => {
    // Deselect when clicking empty space
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      setSelectedId(null)
    }
  }, [])

  // =====================
  // EXPORT
  // =====================
  const handleExport = useCallback(() => {
    if (!stageRef.current) return null

    setSelectedId(null)

    return new Promise((resolve) => {
      setTimeout(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 })
        if (onExport) onExport(dataURL)
        resolve(dataURL)
      }, 100)
    })
  }, [onExport])

  // Initialize with provided image
  useEffect(() => {
    if (initialImage && elements.length === 0) {
      addImage(initialImage)
    }
  }, [initialImage, elements.length, addImage])

  // Expose export method
  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.exportImage = handleExport
    }
  }, [handleExport])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  // =====================
  // CLIP FUNCTION - This is the KEY fix for the "big square" problem
  // =====================
  const clipFunction = useCallback((ctx) => {
    if (clipCommands.length === 0) {
      // Fallback: simple rounded rectangle
      const padding = containerWidth * 0.08
      const radius = 35
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

    // Draw SVG path scaled to container
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

  return (
    <div style={{
      position: 'relative',
      width: containerWidth,
      height: containerHeight,
      touchAction: 'none',
      userSelect: 'none',
      margin: '0 auto'
    }}>
      {/* PHONE BACK IMAGE - Visual layer behind canvas */}
      <img
        src={phoneBackImage}
        alt="Phone case"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 0
        }}
        onError={(e) => {
          console.warn('Phone back image failed:', phoneBackImage)
        }}
      />

      {/* KONVA STAGE - User's design layer with CLIPPING */}
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      >
        {/* CLIPPED LAYER - This clips user content to phone case boundary */}
        <Layer clipFunc={clipFunction}>
          {elements.map((el) => (
            <DraggableImage
              key={el.id}
              id={el.id}
              src={el.src}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rotation={el.rotation}
              scaleX={el.scaleX}
              scaleY={el.scaleY}
              isSelected={el.id === selectedId}
              onSelect={() => setSelectedId(el.id)}
              onChange={(updates) => updateElement(el.id, updates)}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
            />
          ))}
        </Layer>
      </Stage>

      {/* PREMIUM TOOLBAR */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 16,
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(12px)',
        zIndex: 10
      }}>
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          icon={<UndoIcon color={canUndo ? COLORS.black : '#CCC'} />}
          label="Undo"
        />
        <ToolbarButton
          onClick={redo}
          disabled={!canRedo}
          icon={<RedoIcon color={canRedo ? COLORS.black : '#CCC'} />}
          label="Redo"
        />

        <div style={{
          width: 1,
          height: 28,
          background: '#E5E5E5',
          margin: '0 4px'
        }} />

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          icon={<UploadIcon color={COLORS.white} />}
          label="Upload"
          variant="primary"
        />

        {selectedId && (
          <>
            <div style={{
              width: 1,
              height: 28,
              background: '#E5E5E5',
              margin: '0 4px'
            }} />
            <ToolbarButton
              onClick={() => deleteElement(selectedId)}
              icon={<TrashIcon color={COLORS.danger} />}
              label="Delete"
              variant="danger"
            />
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Empty state prompt */}
      {elements.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <div style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            borderRadius: 16,
            background: 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UploadIcon color="#999" />
          </div>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: '600',
            color: COLORS.black,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Add Your Photo
          </p>
          <p style={{
            margin: '8px 0 0',
            fontSize: 12,
            color: COLORS.grey,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Tap Upload below to begin
          </p>
        </div>
      )}
    </div>
  )
}

export default KonvaCanvasEditor

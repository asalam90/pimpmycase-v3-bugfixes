/**
 * PREMIUM KONVA CANVAS EDITOR
 * 
 * Professional-grade phone case customization editor with realistic mockup rendering
 * Inspired by Casetify, dbrand, and Apple's case customizers
 * 
 * Architecture:
 * 1. Phone back image layer (actual case with camera cutout)
 * 2. User design layer (clipped to printable area using mask)
 * 3. Premium transform controls
 * 4. Seamless integration with existing mask system
 * 
 * Features:
 * - Realistic phone case mockup using actual phone back images
 * - Proper image aspect ratio preservation (no distortion)
 * - Premium, minimal transform handles  
 * - Clean, intuitive toolbar
 * - Multi-touch pinch-to-zoom
 * - Undo/redo with state snapshots
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Stage, Layer, Image, Transformer, Rect, Group } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { getPhoneBackImage, getDisplayMaskImage, getClipPathData } from '../utils/phoneCaseLayout'

// Enable touch events
Konva.hitOnDragEnabled = true
Konva.captureTouchEventsEnabled = true

// =====================
// PHONE BACK LAYER - The actual phone case image
// =====================
const PhoneBackLayer = ({ src, width, height }) => {
  const [image] = useImage(src, 'anonymous')
  
  if (!image) return null
  
  return (
    <Image
      image={image}
      width={width}
      height={height}
      listening={false}
    />
  )
}

// =====================
// DRAGGABLE IMAGE ELEMENT - User's uploaded design
// =====================
const DraggableImage = ({
  id,
  src,
  x,
  y,
  width,
  height,
  rotation,
  isSelected,
  onSelect,
  onChange,
  containerWidth,
  containerHeight
}) => {
  const [image] = useImage(src, 'anonymous')
  const imageRef = useRef()
  const transformerRef = useRef()
  
  // Calculate proper dimensions to preserve aspect ratio
  const imageDimensions = useMemo(() => {
    if (!image) return { width: width || 150, height: height || 150 }
    
    const imgWidth = image.width
    const imgHeight = image.height
    const imgRatio = imgWidth / imgHeight
    
    // Target size (fit within container with padding for the case frame)
    const maxWidth = containerWidth * 0.82
    const maxHeight = containerHeight * 0.82
    
    let targetWidth, targetHeight
    
    // Calculate dimensions that preserve aspect ratio
    if (imgRatio > maxWidth / maxHeight) {
      targetWidth = maxWidth
      targetHeight = maxWidth / imgRatio
    } else {
      targetHeight = maxHeight
      targetWidth = maxHeight * imgRatio
    }
    
    return {
      width: width || targetWidth,
      height: height || targetHeight,
      naturalWidth: imgWidth,
      naturalHeight: imgHeight
    }
  }, [image, width, height, containerWidth, containerHeight])

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
        rotation={rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          })
        }}
        onTransformEnd={(e) => {
          const node = imageRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          // Reset scale and bake into dimensions
          node.scaleX(1)
          node.scaleY(1)

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: node.rotation(),
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          // Premium minimal handles - thin, elegant
          anchorSize={10}
          anchorCornerRadius={5}
          anchorFill="#FFFFFF"
          anchorStroke="#000000"
          anchorStrokeWidth={1}
          borderStroke="#000000"
          borderStrokeWidth={1}
          borderDash={[3, 3]}
          // Rotation settings
          rotateEnabled={true}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={10}
          // Keep aspect ratio (CRITICAL for preventing distortion)
          keepRatio={true}
          // Only corner anchors for clean mobile UX
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          // Size constraints
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 40 || Math.abs(newBox.height) < 40) {
              return oldBox
            }
            if (Math.abs(newBox.width) > containerWidth * 2.5 || Math.abs(newBox.height) > containerHeight * 2.5) {
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
// TOOLBAR BUTTON COMPONENT - Premium styled
// =====================
const ToolbarButton = ({ onClick, disabled, icon, label, variant = 'default' }) => {
  const baseStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    padding: '6px 10px',
    minWidth: '48px',
    border: 'none',
    borderRadius: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 120ms ease-out',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
  }
  
  const variants = {
    default: { background: '#F5F5F5', color: '#333' },
    primary: { background: '#000', color: '#FFF' },
    danger: { background: '#FFF0F0', color: '#E53935' }
  }
  
  const style = { ...baseStyle, ...variants[variant] }
  
  return (
    <button onClick={onClick} disabled={disabled} style={style} aria-label={label}>
      {icon}
      <span style={{ fontSize: '9px', fontWeight: '500', letterSpacing: '0.2px' }}>{label}</span>
    </button>
  )
}

// =====================
// ICON COMPONENTS - Clean, recognizable
// =====================
const UndoIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
)

const RedoIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
)

const UploadIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const TrashIcon = ({ color = 'currentColor' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

// =====================
// MAIN KONVA EDITOR
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

  // Get phone back image for realistic mockup
  const phoneBackImage = useMemo(() => getPhoneBackImage(phoneModel), [phoneModel])

  // Canvas state
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // Stage transform for pinch-to-zoom
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)

  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Pinch state refs
  const lastCenter = useRef(null)
  const lastDist = useRef(0)

  // =====================
  // HISTORY MANAGEMENT
  // =====================
  const pushHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(newElements))
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
      
      // Fit within printable area (inside the case frame)
      const maxWidth = containerWidth * 0.82
      const maxHeight = containerHeight * 0.82
      
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
        naturalWidth: tempImg.width,
        naturalHeight: tempImg.height
      }
      
      const newElements = [...elements, newElement]
      setElements(newElements)
      pushHistory(newElements)
      setSelectedId(id)
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
          scale: element.width / (element.naturalWidth || element.width)
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
      if (stage.isDragging()) stage.stopDrag()

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

      const pointTo = {
        x: (newCenter.x - stagePos.x) / stageScale,
        y: (newCenter.y - stagePos.y) / stageScale,
      }

      const scale = Math.max(0.5, Math.min(3, stageScale * (dist / lastDist.current)))
      const dx = newCenter.x - lastCenter.current.x
      const dy = newCenter.y - lastCenter.current.y

      setStageScale(scale)
      setStagePos({
        x: newCenter.x - pointTo.x * scale + dx,
        y: newCenter.y - pointTo.y * scale + dy,
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
  // DESELECT ON EMPTY CLICK
  // =====================
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }
  }, [])

  // =====================
  // EXPORT
  // =====================
  const handleExport = useCallback(() => {
    if (!stageRef.current) return
    
    setSelectedId(null)
    
    setTimeout(() => {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
      if (onExport) onExport(dataURL)
      return dataURL
    }, 50)
  }, [onExport])

  // Initialize with provided image
  useEffect(() => {
    if (initialImage && elements.length === 0) {
      addImage(initialImage)
    }
  }, [initialImage, elements.length, addImage])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div style={{
      position: 'relative',
      width: containerWidth,
      height: containerHeight,
      touchAction: 'none',
      userSelect: 'none'
    }}>
      {/* PHONE BACK IMAGE - Realistic case mockup */}
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
          console.warn('Phone back image failed to load:', phoneBackImage)
        }}
      />

      {/* KONVA STAGE - User's design layer */}
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
        <Layer>
          {/* Render user's uploaded images */}
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
        bottom: 8,
        left: 8,
        right: 8,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: '8px 10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 10
      }}>
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          icon={<UndoIcon color={canUndo ? '#333' : '#CCC'} />}
          label="Undo"
        />
        <ToolbarButton
          onClick={redo}
          disabled={!canRedo}
          icon={<RedoIcon color={canRedo ? '#333' : '#CCC'} />}
          label="Redo"
        />
        
        <div style={{ width: 1, height: 24, background: '#E0E0E0', margin: '0 2px' }} />
        
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          icon={<UploadIcon color="#FFF" />}
          label="Upload"
          variant="primary"
        />
        
        {selectedId && (
          <>
            <div style={{ width: 1, height: 24, background: '#E0E0E0', margin: '0 2px' }} />
            <ToolbarButton
              onClick={() => deleteElement(selectedId)}
              icon={<TrashIcon color="#E53935" />}
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

      {/* Empty state */}
      {elements.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <div style={{
            width: 56,
            height: 56,
            margin: '0 auto 12px',
            borderRadius: 14,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UploadIcon color="#999" />
          </div>
          <p style={{
            margin: 0,
            fontSize: 13,
            fontWeight: '500',
            color: '#666',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Tap Upload to add a photo
          </p>
          <p style={{
            margin: '6px 0 0',
            fontSize: 11,
            color: '#999',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}>
            Pinch to zoom • Drag to move
          </p>
        </div>
      )}
    </div>
  )
}

export default KonvaCanvasEditor

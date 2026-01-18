/**
 * KonvaStickerTransformer.jsx
 *
 * Konva Transformer component for sticker selection handles.
 * Provides resize and rotate functionality with delete button.
 *
 * Usage:
 * <KonvaStickerTransformer
 *   selectedId={selectedStickerId}
 *   stickersRef={mapOfStickerRefs}
 *   onDelete={handleDelete}
 * />
 */

import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Transformer, Group, Circle, Line } from 'react-konva'

const KonvaStickerTransformer = memo(({
  selectedId,
  stickersRef,
  onDelete,
  containerWidth,
  containerHeight
}) => {
  const transformerRef = useRef(null)
  const deleteButtonRef = useRef(null)

  // Attach transformer to selected node
  useEffect(() => {
    const transformer = transformerRef.current
    if (!transformer) return

    if (selectedId && stickersRef.current) {
      const selectedNode = stickersRef.current.get(selectedId)
      if (selectedNode) {
        transformer.nodes([selectedNode])
        transformer.getLayer()?.batchDraw()
      } else {
        transformer.nodes([])
      }
    } else {
      transformer.nodes([])
    }
  }, [selectedId, stickersRef])

  // Update delete button position when transformer changes
  const updateDeleteButton = useCallback(() => {
    const transformer = transformerRef.current
    const deleteButton = deleteButtonRef.current
    if (!transformer || !deleteButton) return

    const nodes = transformer.nodes()
    if (nodes.length === 0) {
      deleteButton.visible(false)
      return
    }

    const node = nodes[0]
    const box = node.getClientRect()

    // Position delete button at top-right corner
    deleteButton.position({
      x: box.x + box.width + 5,
      y: box.y - 5
    })
    deleteButton.visible(true)
  }, [])

  // Handle delete click
  const handleDeleteClick = useCallback((e) => {
    e.cancelBubble = true
    if (selectedId && onDelete) {
      onDelete(selectedId)
    }
  }, [selectedId, onDelete])

  if (!selectedId) {
    return null
  }

  return (
    <>
      <Transformer
        ref={transformerRef}
        // Styling for transform handles
        borderStroke="#0066FF"
        borderStrokeWidth={2}
        anchorStroke="#0066FF"
        anchorFill="#FFFFFF"
        anchorSize={12}
        anchorCornerRadius={6}
        // Enable rotation
        rotateEnabled={true}
        rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        rotationSnapTolerance={5}
        // Enable resize from corners and edges
        enabledAnchors={[
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right'
        ]}
        // Keep aspect ratio
        keepRatio={true}
        // Bounds
        boundBoxFunc={(oldBox, newBox) => {
          // Limit minimum size
          const minSize = 20
          if (newBox.width < minSize || newBox.height < minSize) {
            return oldBox
          }
          // Limit maximum size
          const maxSize = Math.min(containerWidth, containerHeight) * 0.8
          if (newBox.width > maxSize || newBox.height > maxSize) {
            return oldBox
          }
          return newBox
        }}
        // Update delete button position on transform
        onTransform={updateDeleteButton}
        onTransformEnd={updateDeleteButton}
      />

      {/* Delete button */}
      <Group
        ref={deleteButtonRef}
        visible={false}
        onClick={handleDeleteClick}
        onTap={handleDeleteClick}
      >
        {/* Red circle background */}
        <Circle
          radius={16}
          fill="#FF4757"
          stroke="#FFFFFF"
          strokeWidth={2}
          shadowColor="rgba(0,0,0,0.3)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
        />
        {/* X icon */}
        <Line
          points={[-6, -6, 6, 6]}
          stroke="#FFFFFF"
          strokeWidth={2.5}
          lineCap="round"
        />
        <Line
          points={[6, -6, -6, 6]}
          stroke="#FFFFFF"
          strokeWidth={2.5}
          lineCap="round"
        />
      </Group>
    </>
  )
})

KonvaStickerTransformer.displayName = 'KonvaStickerTransformer'

export default KonvaStickerTransformer

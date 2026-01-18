import React, { forwardRef, useEffect, useState, useMemo, useRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva'
import { getPhoneBackImage } from '../utils/phoneCaseLayout'
import { createPhoneClipFunc, getViewBoxDimensions } from '../utils/konvaClipPaths'

/**
 * KonvaPhoneDisplay Component
 *
 * Unified Konva-based phone display for both preview AND export.
 * Replaces MaskedPhoneDisplay with a single rendering engine.
 *
 * @param {Object} props
 * @param {string|string[]} props.image - Single image URL or array of images
 * @param {Object|Object[]} props.transform - Transform for image(s) {x, y, scale}
 * @param {string} props.backgroundColor - Background colour (optional)
 * @param {React.ReactNode} props.children - Additional Konva nodes (stickers, text)
 * @param {Object} props.style - Additional styles for container div
 * @param {string} props.className - Additional classes for container div
 * @param {number} props.width - Container width (default: 288)
 * @param {number} props.height - Container height (default: 480)
 * @param {string} props.modelName - Phone model name for dynamic assets
 * @param {number} props.zoom - Zoom scale for image
 * @param {number} props.zoomX - Horizontal zoom scale
 * @param {number} props.zoomY - Vertical zoom scale
 */
const KonvaPhoneDisplay = forwardRef(({
  image,
  transform,
  backgroundColor,
  children,
  style = {},
  className = '',
  width = 288,
  height = 480,
  modelName,
  zoom,
  zoomX,
  zoomY
}, ref) => {
  const stageRef = useRef(null)
  const [phoneBackImg, setPhoneBackImg] = useState(null)
  const [userImages, setUserImages] = useState([])

  // Normalise image/transform to arrays
  const images = useMemo(() => {
    return Array.isArray(image) ? image : image ? [image] : []
  }, [image])

  const transforms = useMemo(() => {
    return Array.isArray(transform) ? transform : transform ? [transform] : []
  }, [transform])

  // Get phone back image path
  const phoneBackPath = useMemo(() => getPhoneBackImage(modelName), [modelName])

  // Create clip function for the content layer
  const clipFunc = useMemo(() => {
    return createPhoneClipFunc(modelName, width, height)
  }, [modelName, width, height])

  // Load phone back image
  useEffect(() => {
    if (!phoneBackPath) return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setPhoneBackImg(img)
    img.onerror = () => console.warn('Failed to load phone back:', phoneBackPath)
    img.src = phoneBackPath
  }, [phoneBackPath])

  // Load user images
  useEffect(() => {
    if (images.length === 0) {
      setUserImages([])
      return
    }

    const loadImages = async () => {
      const loaded = await Promise.all(
        images.map((src) => {
          return new Promise((resolve) => {
            if (!src) {
              resolve(null)
              return
            }
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => {
              console.warn('Failed to load user image:', src)
              resolve(null)
            }
            img.src = src
          })
        })
      )
      setUserImages(loaded.filter(Boolean))
    }

    loadImages()
  }, [images])

  // Expose stage ref and export method to parent
  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    /**
     * Export the stage to a data URL
     * @param {Object} options - Export options
     * @param {number} options.pixelRatio - Scale factor for export (e.g., 1390/288 for print)
     * @returns {string} Data URL of the exported image
     */
    toDataURL: (options = {}) => {
      if (!stageRef.current) return null
      return stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        ...options
      })
    },
    /**
     * Export at print resolution (1390px width)
     * @returns {string} Data URL at print resolution
     */
    toPrintDataURL: () => {
      if (!stageRef.current) return null
      const printWidth = 1390
      const pixelRatio = printWidth / width
      return stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio
      })
    }
  }), [width])

  // Calculate image position and scale based on transform/zoom props
  const getImageProps = (img, idx) => {
    if (!img) return null

    const t = transforms[idx] || {}
    const effectiveZoomX = t.scale || zoomX || zoom || 1
    const effectiveZoomY = t.scale || zoomY || zoom || 1

    // Calculate aspect-fit dimensions
    const imgAspect = img.width / img.height
    const containerAspect = width / height

    let drawWidth, drawHeight

    if (imgAspect > containerAspect) {
      // Image is wider - fit to width
      drawWidth = width * effectiveZoomX
      drawHeight = (width / imgAspect) * effectiveZoomY
    } else {
      // Image is taller - fit to height
      drawHeight = height * effectiveZoomY
      drawWidth = (height * imgAspect) * effectiveZoomX
    }

    // Centre the image, then apply transform offset
    const offsetX = (width - drawWidth) / 2 + (t.x || 0) * width / 100
    const offsetY = (height - drawHeight) / 2 + (t.y || 0) * height / 100

    return {
      x: offsetX,
      y: offsetY,
      width: drawWidth,
      height: drawHeight
    }
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
    >
      {/* Phone back image - positioned behind the Konva Stage */}
      {phoneBackImg && (
        <img
          src={phoneBackPath}
          alt="Phone back"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}

      {/* Konva Stage - content layer with clipping */}
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        {/* Clipped content layer */}
        <Layer clipFunc={clipFunc}>
          {/* Background colour */}
          {backgroundColor && (
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={backgroundColor}
            />
          )}

          {/* User uploaded image(s) */}
          {userImages.length === 1 && userImages[0] && (
            <KonvaImage
              image={userImages[0]}
              {...getImageProps(userImages[0], 0)}
            />
          )}

          {/* Multi-image layouts (2-in-1, 3-in-1, 4-in-1) */}
          {userImages.length > 1 && (
            <Group>
              {userImages.length === 4 ? (
                // 4-in-1 grid layout
                userImages.map((img, idx) => {
                  if (!img) return null
                  const col = idx % 2
                  const row = Math.floor(idx / 2)
                  const cellWidth = width / 2
                  const cellHeight = height / 2

                  return (
                    <Group
                      key={idx}
                      x={col * cellWidth}
                      y={row * cellHeight}
                      clipFunc={(ctx) => {
                        ctx.beginPath()
                        ctx.rect(0, 0, cellWidth, cellHeight)
                      }}
                    >
                      <KonvaImage
                        image={img}
                        x={0}
                        y={0}
                        width={cellWidth}
                        height={cellHeight}
                      />
                    </Group>
                  )
                })
              ) : (
                // 2-in-1 or 3-in-1 vertical stack
                userImages.map((img, idx) => {
                  if (!img) return null
                  const cellHeight = height / userImages.length
                  const cellWidth = width

                  return (
                    <Group
                      key={idx}
                      x={0}
                      y={idx * cellHeight}
                      clipFunc={(ctx) => {
                        ctx.beginPath()
                        ctx.rect(0, 0, cellWidth, cellHeight)
                      }}
                    >
                      <KonvaImage
                        image={img}
                        x={0}
                        y={0}
                        width={cellWidth}
                        height={cellHeight}
                      />
                    </Group>
                  )
                })
              )}
            </Group>
          )}

          {/* Render children (stickers, text) - must be Konva nodes */}
          {children}
        </Layer>
      </Stage>
    </div>
  )
})

KonvaPhoneDisplay.displayName = 'KonvaPhoneDisplay'

export default KonvaPhoneDisplay

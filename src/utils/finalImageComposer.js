/**
 * Final Image Composer - Creates the final composed image with all user customizations
 * This handles text overlay, background colors, and image transformations for all template types
 */

export async function composeFinalImage(options) {
  const {
    template,
    uploadedImages = [], // Array of images for multi-image templates
    uploadedImage = null, // Single image for basic templates
    imageTransforms = [],
    inputText = '',
    selectedFont = 'Arial',
    fontSize = 30,
    selectedTextColor = '#ffffff',
    selectedBackgroundColor = '#ffffff',
    textPosition = { x: 50, y: 50 },
    transform = { x: 0, y: 0, scale: 1 },
    modelData = null, // Phone model data with physical dimensions
    placedStickers = [], // Array of stickers to render
    textElements = [] // CRITICAL: Array of text objects with individual positions
  } = options

  // DEBUG: Log what we received
  console.log('🎨 composeFinalImage called with:')
  console.log('  - template:', template?.id)
  console.log('  - uploadedImage:', uploadedImage ? `${uploadedImage.substring(0, 50)}...` : 'null')
  console.log('  - uploadedImages count:', uploadedImages?.length || 0)
  console.log('  - inputText:', inputText ? `"${inputText.substring(0, 30)}..."` : 'empty')
  console.log('  - textElements count:', textElements?.length || 0)
  console.log('  - placedStickers count:', placedStickers?.length || 0)
  console.log('  - backgroundColor:', selectedBackgroundColor)

  // Canvas dimensions - proportional to phone model physical dimensions
  // Use fixed width of 1390px and calculate height based on physical dimensions ratio
  const CANVAS_WIDTH = 1390  // Fixed reference width for consistent quality

  // CRITICAL: Require Chinese API dimensions - no fallbacks
  let CANVAS_HEIGHT
  if (!modelData?.width || !modelData?.height) {
    throw new Error('Chinese API dimensions required for final image composition. modelData.width and modelData.height must be provided.')
  }

  // Validate and parse physical dimensions from Chinese API (in mm)
  const physicalWidth = parseFloat(modelData.width)
  const physicalHeight = parseFloat(modelData.height)

  // Strict validation - no fallbacks
  if (isNaN(physicalWidth) || isNaN(physicalHeight)) {
    throw new Error(`Invalid dimensions from Chinese API: width=${modelData.width}, height=${modelData.height}`)
  }

  // Validation: Ensure dimensions are reasonable for phone cases
  const isValidWidth = physicalWidth > 30 && physicalWidth < 200  // 30-200mm width range
  const isValidHeight = physicalHeight > 100 && physicalHeight < 300  // 100-300mm height range
  const aspectRatio = physicalHeight / physicalWidth
  const isValidAspectRatio = aspectRatio > 1.2 && aspectRatio < 3.0  // Reasonable phone aspect ratios

  if (!isValidWidth || !isValidHeight || !isValidAspectRatio) {
    throw new Error(`Invalid dimensions from Chinese API - Width: ${physicalWidth}mm (expected 30-200mm), Height: ${physicalHeight}mm (expected 100-300mm), Aspect ratio: ${aspectRatio.toFixed(3)} (expected 1.2-3.0)`)
  }

  // Calculate proportional height using validated physical dimensions
  CANVAS_HEIGHT = Math.round((physicalHeight / physicalWidth) * CANVAS_WIDTH)

  // Additional validation: Ensure calculated height is reasonable
  if (CANVAS_HEIGHT < 1000 || CANVAS_HEIGHT > 5000) {
    throw new Error(`Calculated canvas height ${CANVAS_HEIGHT}px is outside valid range (1000-5000px). Physical dimensions: ${physicalWidth}mm x ${physicalHeight}mm`)
  }

  console.log(`📐 Using proportional canvas dimensions from Chinese API:`)
  console.log(`   Physical: ${physicalWidth}mm x ${physicalHeight}mm`)
  console.log(`   Canvas: ${CANVAS_WIDTH}px x ${CANVAS_HEIGHT}px`)
  console.log(`   Aspect ratio: ${aspectRatio.toFixed(3)}`)

  // Get mask position for this phone model (from phoneCaseLayout.js)
  // Text and sticker positions in preview are relative to this masked overlay area
  const maskPosition = {
    x: 0.08,      // 8% left margin (default for iPhones)
    y: 0,         // No top margin
    width: 0.85,  // 85% width
    height: 1.0   // 100% height
  }

  // TODO: Could import getMaskPosition from phoneCaseLayout.js for model-specific masks
  // For now, using default iPhone mask (8% left, 85% width)

  console.log('🎨 Final Image Composition:')
  console.log(`  Canvas: ${CANVAS_WIDTH}×${CANVAS_HEIGHT}px`)
  console.log(`  Masked area: left=${maskPosition.x * 100}%, width=${maskPosition.width * 100}%`)
  console.log(`  Text elements: ${textElements?.length || 0}`)
  console.log(`  Stickers: ${placedStickers?.length || 0}`)

  // Optional verification logging for known iPhone models
  if (modelData?.model) {
    const modelName = modelData.model.toLowerCase()
    if (modelName.includes('iphone 16') && !modelName.includes('pro')) {
      const expectedHeight = Math.round((150.96 / 74.42) * 1390)
      console.log(`🔍 iPhone 16 verification: Expected ~${expectedHeight}px, Actual ${CANVAS_HEIGHT}px`)
    } else if (modelName.includes('iphone 15') && !modelName.includes('pro')) {
      const expectedHeight = Math.round((151.72 / 76.28) * 1390)
      console.log(`🔍 iPhone 15 verification: Expected ~${expectedHeight}px, Actual ${CANVAS_HEIGHT}px`)
    }
  }

  // Create canvas with high-quality settings
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // Additional quality settings
  ctx.textRenderingOptimization = 'optimizeQuality'
  ctx.antialias = true
  
  console.log(`Canvas created: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} (high resolution, quality optimized)`)

  // Set background color
  ctx.fillStyle = selectedBackgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  try {
    // Handle different template types
    if (template?.id === 'classic' || template?.id === 'basic') {
      // Single image template - support both uploadedImage and uploadedImages[0]
      const singleImage = uploadedImage || (uploadedImages && uploadedImages[0])
      // Use imageTransforms[0] if uploadedImages is being used, otherwise use transform
      const singleTransform = (!uploadedImage && imageTransforms && imageTransforms[0])
        ? imageTransforms[0]
        : transform

      if (singleImage) {
        console.log(`📸 Drawing single image for ${template?.id} template`)
        console.log(`   Using transform:`, singleTransform)
        await drawSingleImage(ctx, singleImage, singleTransform, CANVAS_WIDTH, CANVAS_HEIGHT)
      } else {
        console.warn(`⚠️ No image provided for ${template?.id} template! uploadedImage:`, uploadedImage, 'uploadedImages:', uploadedImages)
      }
    } else if (template?.imageCount > 1) {
      // Multi-image templates (2-in-1, 3-in-1, 4-in-1, film-strip)
      await drawMultipleImages(ctx, template, uploadedImages, imageTransforms, CANVAS_WIDTH, CANVAS_HEIGHT)
    } else if (template?.id?.includes('film')) {
      // Film strip template
      await drawFilmStripImages(ctx, uploadedImages, imageTransforms, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Add stickers if provided (render before text so text appears on top)
    if (placedStickers && placedStickers.length > 0) {
      console.log(`🎨 Drawing ${placedStickers.length} stickers`)
      await drawStickers(ctx, placedStickers, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Add text overlay - support both single text and textElements array
    if (textElements && textElements.length > 0) {
      // NEW: Multi-text support (array of text objects)
      console.log(`📝 Drawing ${textElements.length} text elements`)
      textElements.forEach(textElement => {
        if (textElement.text && textElement.text.trim()) {
          drawTextOverlay(ctx, {
            text: textElement.text,
            font: textElement.font?.family || selectedFont,
            fontSize: textElement.size || fontSize,
            color: textElement.color || selectedTextColor,
            position: textElement.position || textPosition,
            rotation: textElement.rotation || 0,
            canvasWidth: CANVAS_WIDTH,
            canvasHeight: CANVAS_HEIGHT
          }, maskPosition)
        }
      })
    } else if (inputText && inputText.trim()) {
      // LEGACY: Single text support
      console.log(`📝 Drawing single text element`)
      drawTextOverlay(ctx, {
        text: inputText,
        font: selectedFont,
        fontSize: fontSize,
        color: selectedTextColor,
        position: textPosition,
        rotation: 0,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT
      }, maskPosition)
    }

    // Convert to data URL with maximum quality
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    console.log(`✅ Final image composed successfully - data URL length: ${dataUrl.length} bytes`)
    console.log(`   Canvas size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`)

    return dataUrl

  } catch (error) {
    console.error('❌ Error composing final image:', error)
    throw new Error('Failed to compose final image: ' + error.message)
  }
}

async function drawSingleImage(ctx, imageDataUrl, transform, canvasWidth, canvasHeight) {
  return new Promise((resolve, reject) => {
    if (!imageDataUrl) {
      console.error('❌ drawSingleImage called with null/undefined imageDataUrl')
      reject(new Error('No image data provided'))
      return
    }

    console.log(`🖼️  Loading image (${imageDataUrl.substring(0, 50)}...)`)

    const img = new Image()
    img.onload = () => {
      try {
        console.log(`✅ Image loaded successfully: ${img.width}x${img.height}`)

        // Calculate position and size based on transform (USER'S CROPPING CHOICES)
        const { x = 0, y = 0, scale = 1 } = transform || {}

        // Calculate how to fit the image within the canvas (object-fit: contain logic)
        const imageAspect = img.width / img.height
        const canvasAspect = canvasWidth / canvasHeight

        let baseWidth, baseHeight
        if (imageAspect > canvasAspect) {
          // Image is wider - fit to canvas width
          baseWidth = canvasWidth
          baseHeight = canvasWidth / imageAspect
        } else {
          // Image is taller - fit to canvas height
          baseHeight = canvasHeight
          baseWidth = canvasHeight * imageAspect
        }

        console.log(`📏 Image scaling: ${img.width}x${img.height} -> ${Math.round(baseWidth)}x${Math.round(baseHeight)} (aspect: ${imageAspect.toFixed(2)})`)
        console.log(`🎯 User transform: scale=${scale}, x=${x}, y=${y}`)

        // Apply transform
        ctx.save()

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Move to center for scaling and positioning
        const centerX = canvasWidth / 2
        const centerY = canvasHeight / 2
        ctx.translate(centerX, centerY)

        // Apply user's scale factor on top of the base fit-to-canvas scaling
        ctx.scale(scale, scale)

        // Apply user's position offset (convert from percentage to pixels)
        const offsetX = (x / 100) * canvasWidth
        const offsetY = (y / 100) * canvasHeight
        ctx.translate(offsetX, offsetY)

        // Draw image centered with calculated dimensions (WITH user transforms applied)
        ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight)

        ctx.restore()
        console.log(`✅ Image drawn successfully on canvas`)
        resolve()
      } catch (error) {
        console.error('❌ Error drawing image on canvas:', error)
        reject(error)
      }
    }
    img.onerror = (error) => {
      console.error('❌ Failed to load image:', error)
      console.error('   Image URL:', imageDataUrl.substring(0, 100))
      reject(new Error('Failed to load image'))
    }
    img.src = imageDataUrl
  })
}

async function drawMultipleImages(ctx, template, images, transforms, canvasWidth, canvasHeight) {
  const imageCount = template.imageCount || images.length

  // Calculate grid layout
  let cols, rows
  switch (imageCount) {
    case 2:
      cols = 1; rows = 2
      break
    case 3:
      cols = 1; rows = 3
      break
    case 4:
      cols = 2; rows = 2
      break
    default:
      cols = Math.ceil(Math.sqrt(imageCount))
      rows = Math.ceil(imageCount / cols)
  }

  // Border width in pixels (2px total between images)
  const borderWidth = 2
  const totalBorderHeight = (rows - 1) * borderWidth
  const totalBorderWidth = (cols - 1) * borderWidth

  // Calculate cell dimensions accounting for borders
  const cellWidth = (canvasWidth - totalBorderWidth) / cols
  const cellHeight = (canvasHeight - totalBorderHeight) / rows

  // Draw each image in its cell
  for (let i = 0; i < Math.min(images.length, imageCount); i++) {
    if (!images[i] || !images[i].src) continue

    const col = i % cols
    const row = Math.floor(i / cols)
    const cellX = col * (cellWidth + borderWidth)
    const cellY = row * (cellHeight + borderWidth)

    await drawImageInCell(ctx, images[i].src, transforms[i] || {}, cellX, cellY, cellWidth, cellHeight)
  }

  // Draw borders between cells
  ctx.fillStyle = '#000000'

  // Draw horizontal borders (between rows)
  for (let row = 1; row < rows; row++) {
    const borderY = row * cellHeight + (row - 1) * borderWidth
    ctx.fillRect(0, borderY, canvasWidth, borderWidth)
  }

  // Draw vertical borders (between columns)
  for (let col = 1; col < cols; col++) {
    const borderX = col * cellWidth + (col - 1) * borderWidth
    ctx.fillRect(borderX, 0, borderWidth, canvasHeight)
  }
}

async function drawImageInCell(ctx, imageDataUrl, transform, cellX, cellY, cellWidth, cellHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        ctx.save()
        
        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Clip to cell boundaries
        ctx.beginPath()
        ctx.rect(cellX, cellY, cellWidth, cellHeight)
        ctx.clip()
        
        // Calculate how to fit the image within the cell (object-fit: contain logic)
        const imageAspect = img.width / img.height
        const cellAspect = cellWidth / cellHeight
        
        let baseDrawWidth, baseDrawHeight
        if (imageAspect > cellAspect) {
          // Image is wider - fit to cell width
          baseDrawWidth = cellWidth
          baseDrawHeight = cellWidth / imageAspect
        } else {
          // Image is taller - fit to cell height
          baseDrawHeight = cellHeight
          baseDrawWidth = cellHeight * imageAspect
        }
        
        // Apply user transforms (positioning and scaling)
        const { x = 0, y = 0, scale = 1 } = transform || {}

        // Apply user's scale to base dimensions
        const drawWidth = baseDrawWidth * scale
        const drawHeight = baseDrawHeight * scale

        // Calculate position within cell with user's positioning offset
        // To match CSS transform: scale(s) translate(x%, y%), translate is in scaled space
        const centerX = cellX + cellWidth / 2
        const centerY = cellY + cellHeight / 2
        const offsetX = (x / 100) * drawWidth // Offset as percentage of SCALED image size
        const offsetY = (y / 100) * drawHeight

        // Draw image with user transforms applied
        ctx.drawImage(
          img,
          centerX - drawWidth / 2 + offsetX,
          centerY - drawHeight / 2 + offsetY,
          drawWidth,
          drawHeight
        )
        
        ctx.restore()
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = reject
    img.src = imageDataUrl
  })
}

async function drawFilmStripImages(ctx, images, transforms, canvasWidth, canvasHeight) {
  // Film strip layout - vertical strips with film perforations
  const stripCount = images.length
  const stripHeight = canvasHeight / stripCount
  const perfWidth = 20 // Width of film perforations
  const imageWidth = canvasWidth - (perfWidth * 2)

  // Draw film background
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  for (let i = 0; i < images.length; i++) {
    if (!images[i] || !images[i].src) continue

    const stripY = i * stripHeight
    
    // Draw perforations
    drawFilmPerforations(ctx, stripY, stripHeight, perfWidth, canvasWidth)
    
    // Draw image in strip
    await drawImageInCell(ctx, images[i].src, transforms[i] || {}, perfWidth, stripY, imageWidth, stripHeight)
  }
}

function drawFilmPerforations(ctx, stripY, stripHeight, perfWidth, canvasWidth) {
  ctx.fillStyle = '#000'
  
  // Left perforations
  const perfHeight = 8
  const perfSpacing = 12
  const perfsPerStrip = Math.floor(stripHeight / perfSpacing)
  
  for (let j = 0; j < perfsPerStrip; j++) {
    const perfY = stripY + (j * perfSpacing)
    // Left side
    ctx.fillRect(5, perfY, perfWidth - 10, perfHeight)
    // Right side
    ctx.fillRect(canvasWidth - perfWidth + 5, perfY, perfWidth - 10, perfHeight)
  }
}

function drawTextOverlay(ctx, options, maskPosition) {
  const { text, font, fontSize, color, position, rotation = 0, canvasWidth, canvasHeight } = options

  ctx.save()

  // Scale font size for high-resolution canvas (1390x2542)
  // The UI uses 30px as base, but the canvas is much larger than typical preview
  // Scale factor based on canvas width (1390px is about 5.4x larger than typical 256px preview)
  const scaleFactor = Math.max(4.5, canvasWidth / 300) // Minimum 4.5x scaling for high-res canvas
  const scaledFontSize = fontSize * scaleFactor

  console.log(`Text rendering: "${text.substring(0, 20)}..." original ${fontSize}px -> scaled ${scaledFontSize}px, rotation ${rotation}°`)

  // Calculate text position accounting for masked area bounds
  // Preview positions are relative to masked overlay (8% offset, 85% width)
  // Convert to canvas pixels: offset + (percentage × masked width)
  const maskedLeft = maskPosition.x * canvasWidth
  const maskedTop = maskPosition.y * canvasHeight
  const maskedWidth = maskPosition.width * canvasWidth
  const maskedHeight = maskPosition.height * canvasHeight

  const textX = maskedLeft + (position.x / 100) * maskedWidth
  const textY = maskedTop + (position.y / 100) * maskedHeight

  console.log(`📍 Text position: ${position.x}%, ${position.y}% → Canvas: ${textX.toFixed(0)}px, ${textY.toFixed(0)}px (masked area: ${maskedLeft.toFixed(0)}px + ${(position.x/100 * maskedWidth).toFixed(0)}px)`)

  // Apply rotation transform (like stickers do)
  ctx.translate(textX, textY)
  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180)
  }

  // Set font with scaled size
  ctx.font = `${scaledFontSize}px ${font}, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Enable text stroke for better visibility (also scale stroke width)
  ctx.strokeStyle = color === '#ffffff' ? '#000000' : '#ffffff'
  ctx.lineWidth = Math.max(2, scaleFactor * 0.5) // Scale stroke width

  // Handle multi-line text with scaled line height
  const lines = text.split('\n')
  const lineHeight = scaledFontSize * 1.2
  const totalTextHeight = lines.length * lineHeight
  const startY = -(totalTextHeight / 2) + (lineHeight / 2) // Center vertically around 0 (since we translated)

  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight)
    // Draw stroke first (outline)
    ctx.strokeText(line, 0, y) // Use 0 since we've already translated to textX
    // Draw fill text on top
    ctx.fillText(line, 0, y)
  })

  ctx.restore()
}

async function drawStickers(ctx, stickers, canvasWidth, canvasHeight) {
  // Draw stickers in order they were placed
  for (const sticker of stickers) {
    await drawSticker(ctx, sticker, canvasWidth, canvasHeight)
  }
}

async function drawSticker(ctx, sticker, canvasWidth, canvasHeight) {
  return new Promise((resolve) => {
    // Sticker format: { placedId, id, name, imageUrl, x, y, scale, rotation, type, emoji }
    // OR legacy format: { placedId, id, name, imageUrl, position: { x, y }, size, rotation }
    const { type, emoji, imageUrl, highresUrl, fallbackUrl, position, x: directX, y: directY, scale = 1, size = 100, rotation = 0 } = sticker

    // Handle emoji stickers (text-based, not images)
    if (type === 'emoji' && emoji) {
      ctx.save()

      // Convert position from percentage to pixels
      const posX = directX !== undefined ? directX : (position?.x || 50)
      const posY = directY !== undefined ? directY : (position?.y || 50)
      const x = (posX / 100) * canvasWidth
      const y = (posY / 100) * canvasHeight

      // Scale size appropriately for high-res canvas
      const scaleFactor = canvasWidth / 200 // Match preview width of 200px
      const baseFontSize = 40 // Base emoji size (matches preview)
      const effectiveScale = scale !== undefined ? scale : (size / 100)
      const scaledFontSize = baseFontSize * effectiveScale * scaleFactor

      console.log(`🎨 Drawing emoji "${emoji}" at ${posX}%, ${posY}% with size ${scaledFontSize}px, rotation ${rotation}°`)

      // Move to sticker position and apply rotation
      ctx.translate(x, y)
      if (rotation) {
        ctx.rotate((rotation * Math.PI) / 180)
      }

      // Draw emoji text
      ctx.font = `${scaledFontSize}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, 0, 0)

      ctx.restore()
      resolve()
      return
    }

    // Handle image stickers
    const stickerUrl = highresUrl || imageUrl || fallbackUrl

    if (!stickerUrl) {
      console.warn('⚠️ Sticker missing image URL:', sticker)
      resolve()
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous' // Enable CORS for external images

    img.onload = () => {
      try {
        ctx.save()

        // Enable high-quality image rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Convert position from percentage to pixels
        // Support both direct x/y and position object
        const posX = directX !== undefined ? directX : (position?.x || 50)
        const posY = directY !== undefined ? directY : (position?.y || 50)

        // Apply same masked area adjustment as text
        // Preview positions are relative to masked overlay (8% offset, 85% width)
        const maskedLeft = maskPosition.x * canvasWidth
        const maskedTop = maskPosition.y * canvasHeight
        const maskedWidth = maskPosition.width * canvasWidth
        const maskedHeight = maskPosition.height * canvasHeight

        const x = maskedLeft + (posX / 100) * maskedWidth
        const y = maskedTop + (posY / 100) * maskedHeight

        // Scale size appropriately for high-res canvas
        // UI size is based on 256px preview, canvas is 1390px (about 5.4x larger)
        const scaleFactor = canvasWidth / 200 // Match preview width of 200px

        // Use scale property if available (preferred), otherwise use size
        const baseStickerSize = 40 // Base size in pixels at 100% scale
        const effectiveScale = scale !== undefined ? scale : (size / 100)
        const scaledSize = baseStickerSize * effectiveScale * scaleFactor

        console.log(`🎨 Drawing image sticker "${sticker.name}" at ${posX}%, ${posY}% with size ${scaledSize}px, rotation ${rotation}°`)
        console.log(`📍 Sticker "${sticker.name}" position: ${posX}%, ${posY}% → Canvas: ${x.toFixed(0)}px, ${y.toFixed(0)}px`)

        // Move to sticker position and apply rotation
        ctx.translate(x, y)
        if (rotation) {
          ctx.rotate((rotation * Math.PI) / 180)
        }

        // Draw sticker centered at position
        ctx.drawImage(img, -scaledSize / 2, -scaledSize / 2, scaledSize, scaledSize)

        ctx.restore()
        resolve()
      } catch (error) {
        console.error('Error drawing sticker:', error)
        resolve() // Don't reject, just skip this sticker
      }
    }

    img.onerror = (error) => {
      console.warn(`⚠️ Failed to load sticker image: ${stickerUrl}`, error)
      resolve() // Don't reject, just skip this sticker
    }

    img.src = stickerUrl
  })
}
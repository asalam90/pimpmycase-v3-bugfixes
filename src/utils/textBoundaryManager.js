import { useState, useEffect, useRef, useCallback } from 'react'
import { fonts, DEFAULT_FONT_SIZE } from './fontManager'
import {
  getPhoneCaseLayout,
  isInCameraArea,
  getSafeBoundaries as getLayoutSafeBoundaries,
  getRecommendedTextPosition
} from './phoneCaseLayout'

// Default container dimensions (fallback if model data not available)
const DEFAULT_CONTAINER_DIMENSIONS = {
  PHONE_CASE: { width: 230, height: 380 }, 
  FILM_STRIP: { width: 525, height: 525 },
  // Safe zones to keep text well within bounds
  SAFE_MARGIN: 20 // pixels from edge
}

// Calculate model-specific container dimensions from Chinese API data
const getModelSpecificDimensions = (modelData) => {
  if (modelData?.width && modelData?.height) {
    // Convert millimeters to pixels at 96 DPI and scale down for text UI
    const mmToPixels = (mm) => (mm / 25.4) * 96
    const widthPx = mmToPixels(modelData.width)
    const heightPx = mmToPixels(modelData.height)
    
    // Scale down for text boundary calculations (similar to preview scaling)
    const scaleFactor = 0.3 // Adjust this to match text overlay size relative to preview
    
    return {
      width: Math.round(widthPx * scaleFactor),
      height: Math.round(heightPx * scaleFactor)
    }
  }
  
  // Chinese API data should be available - log error if missing
  console.error('❌ Chinese API dimensions missing for text boundaries:', modelData)
  console.error('❌ This will cause incorrect text positioning')
  
  // Use minimal fallback for debugging only
  return { width: 230, height: 380 }
}

// Enhanced text boundary management hook with model-specific dimensions and camera awareness
const useTextBoundaries = (template, inputText, fontSize, selectedFont, modelData = null) => {
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 })
  const [containerDimensions, setContainerDimensions] = useState(DEFAULT_CONTAINER_DIMENSIONS.PHONE_CASE)
  const [safeBoundaries, setSafeBoundaries] = useState({ minX: 10, maxX: 90, minY: 10, maxY: 90 })
  const [cameraAwareBoundaries, setCameraAwareBoundaries] = useState(null)
  const measureRef = useRef(null)

  // Get font style for consistent rendering using the central font manager
  const getFontStyle = useCallback(() => {
    return {
      fontFamily: fonts.find((f) => f.name === selectedFont)?.style || 'Arial, sans-serif',
      fontSize: `${fontSize || DEFAULT_FONT_SIZE}px`,
      fontWeight: '500',
      lineHeight: '1.2',
      whiteSpace: 'nowrap'
    }
  }, [selectedFont, fontSize])

  // Set container dimensions based on template and model data
  useEffect(() => {
    if (template?.id?.startsWith('film-strip')) {
      setContainerDimensions(DEFAULT_CONTAINER_DIMENSIONS.FILM_STRIP)
    } else {
      // Use model-specific dimensions for phone case templates
      const modelSpecificDimensions = getModelSpecificDimensions(modelData)
      setContainerDimensions(modelSpecificDimensions)
      console.log('📐 Text boundaries using model-specific dimensions:', modelSpecificDimensions)
    }
  }, [template, modelData])

  // Measure text dimensions accurately
  const measureTextDimensions = useCallback(() => {
    if (!inputText?.trim()) {
      setTextDimensions({ width: 0, height: 0 })
      return
    }

    // Create a temporary element to measure text
    const tempElement = document.createElement('div')
    tempElement.style.position = 'absolute'
    tempElement.style.visibility = 'hidden'
    tempElement.style.whiteSpace = 'nowrap'
    tempElement.style.fontSize = `${fontSize}px`
    tempElement.style.fontFamily = getFontStyle().fontFamily
    tempElement.style.fontWeight = '500'
    tempElement.style.lineHeight = '1.2'
    tempElement.textContent = inputText
    
    document.body.appendChild(tempElement)
    const rect = tempElement.getBoundingClientRect()
    document.body.removeChild(tempElement)
    
    setTextDimensions({
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height)
    })
  }, [inputText, fontSize, getFontStyle])

  // Calculate safe boundaries with camera awareness
  useEffect(() => {
    if (!inputText?.trim() || textDimensions.width === 0 || textDimensions.height === 0) {
      setSafeBoundaries({ minX: 10, maxX: 90, minY: 10, maxY: 90 })
      return
    }

    const { width: containerWidth, height: containerHeight } = containerDimensions
    const { width: textWidth, height: textHeight } = textDimensions

    // Get model name from modelData
    const modelName = modelData?.model_name || modelData?.name || 'Generic iPhone'

    // Get camera-aware layout boundaries
    const layout = getPhoneCaseLayout(modelName)
    const textWidthPercent = (textWidth / containerWidth) * 100
    const textHeightPercent = (textHeight / containerHeight) * 100

    const layoutBoundaries = getLayoutSafeBoundaries(modelName, textWidthPercent, textHeightPercent)

    // Calculate minimum safe distances from edges (in pixels)
    const minXPixels = Math.max(DEFAULT_CONTAINER_DIMENSIONS.SAFE_MARGIN * 1.5, textWidth / 2 + 5)
    const minYPixels = Math.max(DEFAULT_CONTAINER_DIMENSIONS.SAFE_MARGIN, textHeight / 2)

    // Convert to percentages
    const minXPercent = (minXPixels / containerWidth) * 100
    const maxXPercent = 100 - minXPercent
    const minYPercent = (minYPixels / containerHeight) * 100
    const maxYPercent = 100 - minYPercent

    // Combine layout boundaries with calculated boundaries
    const safeMinX = Math.max(layoutBoundaries.minX, Math.max(10, Math.min(55, minXPercent)))
    const safeMaxX = Math.min(layoutBoundaries.maxX, Math.min(90, Math.max(45, maxXPercent)))
    const safeMinY = Math.max(layoutBoundaries.minY, Math.max(5, Math.min(45, minYPercent)))
    const safeMaxY = Math.min(layoutBoundaries.maxY, Math.min(95, Math.max(55, maxYPercent)))

    setSafeBoundaries({
      minX: safeMinX,
      maxX: safeMaxX,
      minY: safeMinY,
      maxY: safeMaxY
    })

    // Store camera-aware info for additional checks
    setCameraAwareBoundaries({
      cameraArea: layout.cameraArea,
      modelName
    })

    console.log('📐 Camera-aware boundaries:', { safeMinX, safeMaxX, safeMinY, safeMaxY, modelName })
  }, [textDimensions, containerDimensions, inputText, modelData])

  // Re-measure when dependencies change
  useEffect(() => {
    measureTextDimensions()
  }, [measureTextDimensions])

  // Constrain position to safe boundaries with camera area check
  const constrainPosition = useCallback((position) => {
    let constrainedX = Math.max(safeBoundaries.minX, Math.min(safeBoundaries.maxX, position.x))
    let constrainedY = Math.max(safeBoundaries.minY, Math.min(safeBoundaries.maxY, position.y))

    // Check if position would place text in camera area
    if (cameraAwareBoundaries) {
      const { modelName } = cameraAwareBoundaries
      if (isInCameraArea(constrainedX, constrainedY, modelName)) {
        // Push text below camera area
        const recommendedPos = getRecommendedTextPosition(modelName)
        constrainedY = Math.max(constrainedY, recommendedPos.y)
        console.log('⚠️ Text position adjusted to avoid camera area')
      }
    }

    return {
      x: constrainedX,
      y: constrainedY
    }
  }, [safeBoundaries, cameraAwareBoundaries])

  // Validate if text would fit at current settings
  const validateTextFit = useCallback(() => {
    if (!inputText?.trim()) return true
    
    const { width: containerWidth, height: containerHeight } = containerDimensions
    const { width: textWidth, height: textHeight } = textDimensions
    
    // Check if text dimensions plus safe margins exceed container
    const requiredWidth = textWidth + (DEFAULT_CONTAINER_DIMENSIONS.SAFE_MARGIN * 2)
    const requiredHeight = textHeight + (DEFAULT_CONTAINER_DIMENSIONS.SAFE_MARGIN * 2)
    
    return requiredWidth <= containerWidth && requiredHeight <= containerHeight
  }, [inputText, textDimensions, containerDimensions])

  // Calculate maximum safe character count for current font/size
  const getMaxSafeCharacters = useCallback(() => {
    const { width: containerWidth } = containerDimensions
    const availableWidth = containerWidth - (DEFAULT_CONTAINER_DIMENSIONS.SAFE_MARGIN * 2)
    
    // Estimate character width based on font and size
    const estimatedCharWidth = fontSize * 0.6 // Rough estimate
    const maxChars = Math.floor(availableWidth / estimatedCharWidth)
    
    return Math.max(15, Math.min(50, maxChars)) // Between 10-50 chars
  }, [fontSize, containerDimensions])

  return {
    textDimensions,
    containerDimensions,
    safeBoundaries,
    cameraAwareBoundaries,
    constrainPosition,
    validateTextFit,
    getMaxSafeCharacters,
    getFontStyle,
    measureRef
  }
}

// Enhanced text input validation
const validateTextInput = (text, maxLength) => {
  // Remove any characters that could cause issues (newlines, tabs, but keep spaces)
  const cleanText = text.replace(/[\n\r\t]/g, '')
  
  // Limit length
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength)
  }
  
  return cleanText
}

// Enhanced position movement with boundary checking
const createPositionHandlers = (currentPosition, safeBoundaries, setPosition) => {
  const moveStep = 3 // Smaller steps for more precise control
  
  return {
    moveLeft: () => {
      const newX = Math.max(safeBoundaries.minX, currentPosition.x - moveStep)
      setPosition(prev => ({ ...prev, x: newX }))
    },
    moveRight: () => {
      const newX = Math.min(safeBoundaries.maxX, currentPosition.x + moveStep)
      setPosition(prev => ({ ...prev, x: newX }))
    },
    moveUp: () => {
      const newY = Math.max(safeBoundaries.minY, currentPosition.y - moveStep)
      setPosition(prev => ({ ...prev, y: newY }))
    },
    moveDown: () => {
      const newY = Math.min(safeBoundaries.maxY, currentPosition.y + moveStep)
      setPosition(prev => ({ ...prev, y: newY }))
    }
  }
}

// Font size validation – simplified.  We no longer auto-shrink the text.  The
// size is clamped between a sensible range but otherwise left unchanged.
const validateFontSize = (newSize /* ignoredArgs */) => {
  const minSize = 12
  const maxSize = 30
  return Math.max(minSize, Math.min(maxSize, newSize))
}

export {
  useTextBoundaries,
  validateTextInput,
  createPositionHandlers,
  validateFontSize,
  DEFAULT_CONTAINER_DIMENSIONS,
  getModelSpecificDimensions
} 
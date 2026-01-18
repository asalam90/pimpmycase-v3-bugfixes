/**
 * Phone Case Layout Configuration System
 *
 * Defines precise boundaries, camera cutouts, and safe zones for each phone model
 * to prevent backgrounds and content from overflowing into camera areas or edges.
 *
 * All measurements are in percentages (0-100) relative to the case dimensions.
 */

// iPhone 15 Layout Configuration
// Based on actual case dimensions: 147mm height x 71.6mm width
const IPHONE_15_LAYOUT = {
  modelId: 'iPhone 15',

  // Main content area boundaries (where images/backgrounds can be placed)
  contentArea: {
    top: 0.7,      // 1px in a ~480px container ≈ 0.2%, adjusted for safety
    left: 8,       // 8% from left edge
    right: 8,      // 8% from right edge
    bottom: 0.7,   // 1px in a ~480px container ≈ 0.2%, adjusted for safety
    borderRadius: 42, // Border radius in pixels for content clipping
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  // Camera cutout zone (restricted area - no content allowed)
  // Values extracted from IP15.svg (800x600 viewBox, case: 203.49-596.16 x 197.94-468.61)
  cameraArea: {
    // Camera module is in top-left corner
    top: 1.4,      // Start 1.4% from top (SVG: 201.67-197.94 / 270.67)
    left: 6.8,     // Start 6.8% from left (SVG: 230.12-203.49 / 392.67)
    width: 11.5,   // Camera area width (SVG: 45.02 / 392.67 = 11.47%)
    height: 26.1,  // Camera area height (SVG: 70.63 / 270.67 = 26.09%)
    borderRadius: 21, // Rounded corners of camera cutout (SVG avg: 21.45px)

    // Additional safety margin around camera (for rhinestones, branding)
    margin: {
      top: 3,      // Extra space above camera
      left: 3,     // Extra space left of camera
      right: 2,    // Extra space right of camera
      bottom: 2    // Extra space below camera
    }
  },

  // Safe zones for text and important content
  safeZones: {
    // Avoid placing critical content in these areas
    topDeadZone: 28,    // Top 28% is risky due to taller camera (26.1% + margins)
    bottomDeadZone: 5,  // Bottom 5% for edge safety
    leftDeadZone: 20,   // Left 20% for edge safety (camera at 6.8% + 11.5% width + margins)
    rightDeadZone: 12   // Right 12% for edge safety
  },

  // Edge boundaries (physical case edges)
  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45 // Physical case corner radius
  }
}

// iPhone 15 Pro Layout Configuration
// Camera is larger and positioned differently
const IPHONE_15_PRO_LAYOUT = {
  modelId: 'iPhone 15 Pro',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  cameraArea: {
    // Pro model has larger camera module than standard iPhone 15
    top: 1.4,      // Same positioning as iPhone 15
    left: 6.8,     // Same positioning as iPhone 15
    width: 13.5,   // Slightly larger than iPhone 15 (11.5%), scaled from 35%→13.5%
    height: 28.5,  // Slightly taller than iPhone 15 (26.1%), scaled from 25%→28.5%
    borderRadius: 22, // Slightly larger radius for Pro camera

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 32,    // Larger top zone for bigger camera (28.5% + margins)
    bottomDeadZone: 5,
    leftDeadZone: 22,   // Increased from 12 (camera at 6.8% + 13.5% width + margins)
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 15 Pro Max Layout Configuration
const IPHONE_15_PRO_MAX_LAYOUT = {
  modelId: 'iPhone 15 Pro Max',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  cameraArea: {
    // Pro Max has same camera module as Pro, just on larger phone
    top: 1.4,      // Same positioning as iPhone 15
    left: 6.8,     // Same positioning as iPhone 15
    width: 13.5,   // Same as iPhone 15 Pro
    height: 28.0,  // Slightly less than Pro due to larger phone body (scaled from 24%→28%)
    borderRadius: 22, // Same as iPhone 15 Pro

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 32,    // Same as Pro (28% + margins)
    bottomDeadZone: 5,
    leftDeadZone: 22,   // Same as Pro (camera at 6.8% + 13.5% width + margins)
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 14 Pro Layout Configuration
const IPHONE_14_PRO_LAYOUT = {
  modelId: 'iPhone 14 Pro',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  cameraArea: {
    top: 2,
    left: 10,
    width: 33,
    height: 25,
    borderRadius: 18,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 28,
    bottomDeadZone: 5,
    leftDeadZone: 12,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 17 Pro Layout Configuration
const IPHONE_17_PRO_LAYOUT = {
  modelId: 'iPhone 17 Pro',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone17promax-mask.png'
    }
  },

  cameraArea: {
    // iPhone 17 Pro has horizontal camera bar in top-left
    top: 1.4,
    left: 6.8,
    width: 13.5,
    height: 28.5,
    borderRadius: 22,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 32,
    bottomDeadZone: 5,
    leftDeadZone: 22,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 17 Pro Max Layout Configuration
const IPHONE_17_PRO_MAX_LAYOUT = {
  modelId: 'iPhone 17 Pro Max',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone17promax-mask.png'
    }
  },

  cameraArea: {
    // iPhone 17 Pro Max has horizontal camera bar in top-left
    top: 1.4,
    left: 6.8,
    width: 13.5,
    height: 28.5,
    borderRadius: 22,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 32,
    bottomDeadZone: 5,
    leftDeadZone: 22,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 16 Layout Configuration
const IPHONE_16_LAYOUT = {
  modelId: 'iPhone 16',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iPhone 16 & 16 Plus.svg'
    }
  },

  cameraArea: {
    // iPhone 16 has vertical dual camera in top-left
    top: 1.4,
    left: 6.8,
    width: 12,
    height: 26,
    borderRadius: 20,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 30,
    bottomDeadZone: 5,
    leftDeadZone: 20,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// iPhone 17 Air Layout Configuration
const IPHONE_17_AIR_LAYOUT = {
  modelId: 'iPhone 17 Air',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone17air-mask.png'
    }
  },

  cameraArea: {
    // iPhone 17 Air has slim camera module in top-left
    top: 1.4,
    left: 6.8,
    width: 12,
    height: 26,
    borderRadius: 20,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 30,
    bottomDeadZone: 5,
    leftDeadZone: 20,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// Generic iPhone Layout (fallback for unlisted models)
const GENERIC_IPHONE_LAYOUT = {
  modelId: 'Generic iPhone',

  contentArea: {
    top: 1,
    left: 8,
    right: 8,
    bottom: 1,
    borderRadius: 42,
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  cameraArea: {
    top: 2,
    left: 10,
    width: 30,
    height: 22,
    borderRadius: 16,

    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 25,
    bottomDeadZone: 5,
    leftDeadZone: 12,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// Samsung S23 Layout Configuration
const SAMSUNG_S23_LAYOUT = {
  modelId: 'Samsung S23',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 38,
    mask: {
      maskUrl: '/masks/iphone15-mask.svg'
    }
  },

  cameraArea: {
    // Samsung has vertical camera array in top-left
    top: 3,
    left: 12,
    width: 25,
    height: 30,
    borderRadius: 12,

    margin: {
      top: 2,
      left: 2,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 35,    // Taller camera array
    bottomDeadZone: 5,
    leftDeadZone: 12,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 42
  }
}

// Samsung S25 & S25 Plus Layout Configuration
const SAMSUNG_S25_LAYOUT = {
  modelId: 'Samsung S25',

  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 40,
    mask: {
      maskUrl: '/masks/samsung-s25-mask.svg'
    }
  },

  cameraArea: {
    // Samsung S25 has vertical triple camera array in top-left with decorative border
    top: 2.5,
    left: 10,
    width: 28,
    height: 32,
    borderRadius: 14,

    margin: {
      top: 2,
      left: 2,
      right: 2,
      bottom: 2
    }
  },

  safeZones: {
    topDeadZone: 38,    // Extra space for taller camera module with decorative elements
    bottomDeadZone: 5,
    leftDeadZone: 12,
    rightDeadZone: 12
  },

  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 44
  }
}

// Model mapping object
const PHONE_LAYOUTS = {
  'iPhone 15': IPHONE_15_LAYOUT,
  'iPhone 15 Pro': IPHONE_15_PRO_LAYOUT,
  'iPhone 15 Pro Max': IPHONE_15_PRO_MAX_LAYOUT,
  'iPhone 14 Pro': IPHONE_14_PRO_LAYOUT,
  'iPhone 16': IPHONE_16_LAYOUT,
  'iPhone 16 Plus': IPHONE_16_LAYOUT,
  'iPhone 16 Pro': IPHONE_16_LAYOUT,
  'iPhone 16 Pro Max': IPHONE_16_LAYOUT,
  'iPhone 17 Air': IPHONE_17_AIR_LAYOUT,
  'iPhone 17AIR': IPHONE_17_AIR_LAYOUT, // API variant without space
  'iPhone 17 Pro': IPHONE_17_PRO_LAYOUT,
  'iPhone 17 Pro Max': IPHONE_17_PRO_MAX_LAYOUT,
  'iPhone 17ProMax': IPHONE_17_PRO_MAX_LAYOUT, // API variant without space
  'Samsung S23': SAMSUNG_S23_LAYOUT,
  'Samsung S25': SAMSUNG_S25_LAYOUT,
  'Samsung S25 Plus': SAMSUNG_S25_LAYOUT,
  'S25': SAMSUNG_S25_LAYOUT,
  'S25 Plus': SAMSUNG_S25_LAYOUT,
  // Add more models as needed
}

/**
 * Get layout configuration for a specific phone model
 * @param {string} modelName - Name of the phone model
 * @returns {Object} Layout configuration object
 */
export const getPhoneCaseLayout = (modelName) => {
  if (!modelName) {
    console.warn('⚠️ No model name provided, using iPhone 17 Pro Max layout as default')
    return IPHONE_17_PRO_MAX_LAYOUT
  }

  // Try exact match first
  if (PHONE_LAYOUTS[modelName]) {
    return PHONE_LAYOUTS[modelName]
  }

  // Try partial match (case-insensitive)
  const normalizedModelName = modelName.toLowerCase()
  for (const [key, layout] of Object.entries(PHONE_LAYOUTS)) {
    if (key.toLowerCase().includes(normalizedModelName) ||
        normalizedModelName.includes(key.toLowerCase())) {
      return layout
    }
  }

  // Fallback to iPhone 17 Pro Max layout
  console.warn(`⚠️ No specific layout found for ${modelName}, using iPhone 17 Pro Max layout as default`)
  return IPHONE_17_PRO_MAX_LAYOUT
}

/**
 * Check if a point (x, y) falls within the camera cutout area
 * @param {number} x - X coordinate (percentage 0-100)
 * @param {number} y - Y coordinate (percentage 0-100)
 * @param {string} modelName - Phone model name
 * @returns {boolean} True if point is in camera area
 */
export const isInCameraArea = (x, y, modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const { cameraArea } = layout

  // Calculate camera area boundaries including margins
  const cameraLeft = cameraArea.left - cameraArea.margin.left
  const cameraRight = cameraArea.left + cameraArea.width + cameraArea.margin.right
  const cameraTop = cameraArea.top - cameraArea.margin.top
  const cameraBottom = cameraArea.top + cameraArea.height + cameraArea.margin.bottom

  return (
    x >= cameraLeft &&
    x <= cameraRight &&
    y >= cameraTop &&
    y <= cameraBottom
  )
}

/**
 * Check if a rectangle overlaps with the camera cutout area
 * @param {Object} rect - Rectangle with {x, y, width, height} in percentages
 * @param {string} modelName - Phone model name
 * @returns {boolean} True if rectangle overlaps camera area
 */
export const overlapsCamera = (rect, modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const { cameraArea } = layout

  // Calculate camera area boundaries including margins
  const cameraLeft = cameraArea.left - cameraArea.margin.left
  const cameraRight = cameraArea.left + cameraArea.width + cameraArea.margin.right
  const cameraTop = cameraArea.top - cameraArea.margin.top
  const cameraBottom = cameraArea.top + cameraArea.height + cameraArea.margin.bottom

  // Rectangle boundaries
  const rectLeft = rect.x
  const rectRight = rect.x + rect.width
  const rectTop = rect.y
  const rectBottom = rect.y + rect.height

  // Check for overlap
  return !(
    rectRight < cameraLeft ||
    rectLeft > cameraRight ||
    rectBottom < cameraTop ||
    rectTop > cameraBottom
  )
}

/**
 * Get safe positioning boundaries that avoid camera and edges
 * @param {string} modelName - Phone model name
 * @param {number} contentWidth - Content width in percentage
 * @param {number} contentHeight - Content height in percentage
 * @returns {Object} Safe boundaries {minX, maxX, minY, maxY}
 */
export const getSafeBoundaries = (modelName, contentWidth = 0, contentHeight = 0) => {
  const layout = getPhoneCaseLayout(modelName)
  const { safeZones, contentArea } = layout

  return {
    minX: Math.max(contentArea.left, safeZones.leftDeadZone),
    maxX: Math.min(100 - contentArea.right, 100 - safeZones.rightDeadZone - contentWidth),
    minY: Math.max(contentArea.top, safeZones.topDeadZone),
    maxY: Math.min(100 - contentArea.bottom, 100 - safeZones.bottomDeadZone - contentHeight)
  }
}

/**
 * Get CSS styles for the phone case content area
 * @param {string} modelName - Phone model name
 * @returns {Object} CSS style object
 */
export const getContentAreaStyles = (modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const { contentArea } = layout

  const styles = {
    position: 'absolute',
    top: `${contentArea.top}%`,
    left: `${contentArea.left}%`,
    right: `${contentArea.right}%`,
    bottom: `${contentArea.bottom}%`,
    borderRadius: `${contentArea.borderRadius}px`,
    overflow: 'hidden'
  }

  if (contentArea.mask) {
    styles.maskImage = `url('${contentArea.mask.maskUrl}')`
    styles.maskSize = '100% 100%'
    styles.maskPosition = 'center'
    styles.maskRepeat = 'no-repeat'
    styles.maskMode = 'alpha'
    styles.WebkitMaskImage = `url('${contentArea.mask.maskUrl}')`
    styles.WebkitMaskSize = '100% 100%'
    styles.WebkitMaskPosition = 'center'
    styles.WebkitMaskRepeat = 'no-repeat'
    styles.WebkitMaskMode = 'alpha'
    if (contentArea.mask.clipPath) {
      styles.clipPath = contentArea.mask.clipPath
      styles.WebkitClipPath = contentArea.mask.clipPath
    }
  }

  return styles
}

/**
 * Retrieve only the mask-related style properties for free-form layouts.
 */
export const getMaskStyles = (modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const mask = layout.contentArea?.mask
  if (!mask) {
    return {}
  }

  const maskStyles = {
    maskImage: `url('${mask.maskUrl}')`,
    maskSize: '100% 100%',
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskMode: 'alpha',
    WebkitMaskImage: `url('${mask.maskUrl}')`,
    WebkitMaskSize: '100% 100%',
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskMode: 'alpha'
  }

  if (mask.clipPath) {
    maskStyles.clipPath = mask.clipPath
    maskStyles.WebkitClipPath = mask.clipPath
  }

  return maskStyles
}

/**
 * Convert a model name into the CSS-friendly class used for masking logic
 * @param {string} modelName
 * @returns {string}
 */
export const getPhoneModelClass = (modelName) => {
  if (!modelName) return 'generic-iphone'

  return modelName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Get CSS mask/clip-path to exclude camera area from backgrounds
 * @param {string} modelName - Phone model name
 * @returns {string} CSS clip-path value
 */
export const getCameraExclusionClipPath = (modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const { cameraArea, contentArea } = layout

  // Create a polygon that covers the entire content area except camera
  // This is a complex polygon that goes around the camera cutout

  const cameraLeft = cameraArea.left
  const cameraRight = cameraArea.left + cameraArea.width
  const cameraTop = cameraArea.top
  const cameraBottom = cameraArea.top + cameraArea.height

  // For simplicity, we'll use inset() with rounded corners
  // A more complex implementation would use polygon() to cut out the camera

  return `polygon(
    0% 0%,
    0% 100%,
    100% 100%,
    100% 0%,
    ${cameraRight}% 0%,
    ${cameraRight}% ${cameraTop}%,
    ${cameraRight}% ${cameraBottom}%,
    ${cameraLeft}% ${cameraBottom}%,
    ${cameraLeft}% ${cameraTop}%,
    ${cameraLeft}% 0%
  )`
}

/**
 * Get recommended text position that avoids camera
 * @param {string} modelName - Phone model name
 * @returns {Object} Recommended position {x, y} in percentages
 */
export const getRecommendedTextPosition = (modelName) => {
  const layout = getPhoneCaseLayout(modelName)
  const { safeZones, cameraArea } = layout

  // Position text below camera area in center
  return {
    x: 50, // Center horizontally
    y: Math.max(
      cameraArea.top + cameraArea.height + cameraArea.margin.bottom + 5,
      safeZones.topDeadZone + 5
    )
  }
}

/**
 * Format phone model name for nice display on frontend
 * Handles cases like "iphone 17PROMAX" -> "iPhone 17 Pro Max"
 * @param {string} modelName - Raw model name from API
 * @returns {string} Formatted model name for display
 */
export const formatModelName = (modelName) => {
  if (!modelName) return ''

  let formatted = modelName.trim()

  // Handle iPhone naming conventions
  if (formatted.toLowerCase().includes('iphone')) {
    // Replace "iphone" with "iPhone" (proper capitalization)
    formatted = formatted.replace(/iphone/gi, 'iPhone')

    // Fix common patterns like "PROMAX", "PRO MAX", "promax" to "Pro Max"
    formatted = formatted.replace(/\s*PRO\s*MAX/gi, ' Pro Max')
    formatted = formatted.replace(/\s*PROMAX/gi, ' Pro Max')

    // Fix "PRO" to "Pro"
    formatted = formatted.replace(/\s*PRO(?!\s*Max)/gi, ' Pro')

    // Fix "PLUS" to "Plus"
    formatted = formatted.replace(/\s*PLUS/gi, ' Plus')

    // Fix "AIR" to "Air"
    formatted = formatted.replace(/\s*AIR/gi, ' Air')

    // Fix "MAX" (if not already part of "Pro Max")
    formatted = formatted.replace(/\s*MAX(?![\w])/gi, ' Max')

    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ')
  }

  // Handle Samsung naming conventions
  if (formatted.toLowerCase().includes('samsung') || formatted.toLowerCase().includes('galaxy')) {
    // Capitalize Samsung properly
    formatted = formatted.replace(/samsung/gi, 'Samsung')
    formatted = formatted.replace(/galaxy/gi, 'Galaxy')

    // Fix S-series naming (S23, S24, S25)
    formatted = formatted.replace(/\s*s(\d+)/gi, ' S$1')

    // Fix "ULTRA" to "Ultra"
    formatted = formatted.replace(/\s*ULTRA/gi, ' Ultra')

    // Fix "PLUS" to "Plus"
    formatted = formatted.replace(/\s*PLUS/gi, ' Plus')

    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ')
  }

  // Final cleanup: trim and remove extra spaces
  return formatted.trim()
}

/**
 * Get phone back image path for a specific phone model
 * Handles various name formats from different APIs
 * @param {string} modelName - Name of the phone model (raw or formatted)
 * @returns {string} Path to the phone back image
 */
export const getPhoneBackImage = (modelName) => {
  if (!modelName) {
    return '/Phone backs/iphone 17 pro, 17 promax.png'
  }

  // Normalize: lowercase, remove extra spaces, remove common separators
  const normalizedModelName = modelName.toLowerCase().trim().replace(/\s+/g, ' ')

  // Helper function to check if model name matches pattern (handles variations)
  const matches = (pattern) => {
    const normalized = pattern.toLowerCase().replace(/\s+/g, '')
    const modelNormalized = normalizedModelName.replace(/\s+/g, '')
    return modelNormalized.includes(normalized)
  }

  // Samsung S25 Ultra - specific image
  if (matches('s25 ultra') || matches('s25ultra')) {
    console.log('📱 Using Samsung S25 Ultra phone back for model:', modelName)
    return '/Phone backs/Samsung S25 Ultra.png'
  }

  // Samsung S25 and S25 Plus
  if (matches('s25 plus') || matches('s25plus') || normalizedModelName.includes('s25')) {
    console.log('📱 Using Samsung S25 phone back for model:', modelName)
    return '/Phone backs/Samsung S25, S25 Plus.png'
  }

  // Any other Samsung model - use S25 as fallback
  if (normalizedModelName.includes('samsung') ||
      normalizedModelName.includes('galaxy') ||
      normalizedModelName.includes('s24') ||
      normalizedModelName.includes('s23')) {
    console.log('📱 Using Samsung phone back for model:', modelName)
    return '/Phone backs/Samsung S25, S25 Plus.png'
  }

  // iPhone 17 Air - specific image
  if (matches('iphone 17 air') || matches('iphone17air')) {
    console.log('🎯 Using iPhone 17 Air phone back for model:', modelName)
    return '/Phone backs/iphone 17 AIR.png'
  }

  // iPhone 17 Pro Max (check before Pro to avoid matching "Pro" alone)
  if (matches('iphone 17 pro max') || matches('iphone17promax')) {
    console.log('🎯 Using iPhone 17 Pro Max phone back for model:', modelName)
    return '/Phone backs/iphone 17 pro, 17 promax.png'
  }

  // iPhone 17 Pro
  if (matches('iphone 17 pro') || matches('iphone17pro')) {
    console.log('🎯 Using iPhone 17 Pro phone back for model:', modelName)
    return '/Phone backs/iphone 17 pro, 17 promax.png'
  }

  // iPhone 17 (standard)
  if (matches('iphone 17') || matches('iphone17')) {
    console.log('🎯 Using iPhone 17 phone back for model:', modelName)
    return '/Phone backs/iphone 16, 16 plus, 17.png'
  }

  // iPhone 16 Pro Max (check before Pro)
  if (matches('iphone 16 pro max') || matches('iphone16promax')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 16 Pro
  if (matches('iphone 16 pro') || matches('iphone16pro')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 16 Plus (check before standard 16)
  if (matches('iphone 16 plus') || matches('iphone16plus')) {
    console.log('🎯 Using iPhone 16 phone back for model:', modelName)
    return '/Phone backs/iphone 16, 16 plus, 17.png'
  }

  // iPhone 16 (standard)
  if (matches('iphone 16') || matches('iphone16')) {
    console.log('🎯 Using iPhone 16 phone back for model:', modelName)
    return '/Phone backs/iphone 16, 16 plus, 17.png'
  }

  // iPhone 15 Pro Max (check before Pro)
  if (matches('iphone 15 pro max') || matches('iphone15promax')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 15 Pro
  if (matches('iphone 15 pro') || matches('iphone15pro')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 15 Plus (check before standard 15)
  if (matches('iphone 15 plus') || matches('iphone15plus')) {
    console.log('🎯 Using iPhone 15 phone back for model:', modelName)
    return '/Phone backs/iphone15.png'
  }

  // iPhone 15 (standard) - use old image
  if (matches('iphone 15') || matches('iphone15')) {
    console.log('🎯 Using iPhone 15 phone back for model:', modelName)
    return '/Phone backs/iphone15.png'
  }

  // iPhone 14 Pro Max (check before Pro)
  if (matches('iphone 14 pro max') || matches('iphone14promax')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 14 Pro
  if (matches('iphone 14 pro') || matches('iphone14pro')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 14 Plus (check before standard 14)
  if (matches('iphone 14 plus') || matches('iphone14plus')) {
    console.log('🎯 Using iPhone 14 phone back for model:', modelName)
    return '/Phone backs/iphone 13, 14, 15plus,14plus.png'
  }

  // iPhone 14 (standard)
  if (matches('iphone 14') || matches('iphone14')) {
    console.log('🎯 Using iPhone 14 phone back for model:', modelName)
    return '/Phone backs/iphone 13, 14, 15plus,14plus.png'
  }

  // iPhone 13 Pro Max (check before Pro)
  if (matches('iphone 13 pro max') || matches('iphone13promax')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 13 Pro
  if (matches('iphone 13 pro') || matches('iphone13pro')) {
    console.log('🎯 Using iPhone Pro models phone back for model:', modelName)
    return '/Phone backs/iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max .png'
  }

  // iPhone 13 (standard)
  if (matches('iphone 13') || matches('iphone13')) {
    console.log('🎯 Using iPhone 13 phone back for model:', modelName)
    return '/Phone backs/iphone 13, 14, 15plus,14plus.png'
  }

  // Older iPhone models - use iPhone 15 as fallback
  if (normalizedModelName.includes('iphone')) {
    console.log('🍎 Using fallback iPhone phone back for model:', modelName)
    return '/Phone backs/iphone15.png'
  }

  // Default fallback to iPhone
  console.log('⚠️ Using default iPhone phone back for unknown model:', modelName)
  return '/Phone backs/iphone15.png'
}

/**
 * Get display mask image path for use in MaskedPhoneDisplay component
 * This returns PNG/SVG masks used for SVG <image> masking
 * @param {string} modelName - Name of the phone model
 * @returns {string} Path to the mask image
 */
export const getDisplayMaskImage = (modelName) => {
  if (!modelName) {
    return "/masks/iphone17promax-mask.png"
  }

  const normalizedModelName = modelName.toLowerCase().trim()

  // Any Samsung model - use Samsung SVG mask
  if (normalizedModelName.includes('samsung') ||
      normalizedModelName.includes('galaxy') ||
      normalizedModelName.includes('s25') ||
      normalizedModelName.includes('s24') ||
      normalizedModelName.includes('s23')) {
    console.log('🎭 Using Samsung mask for model:', modelName)
    return '/masks/samsung-s25-mask.svg'
  }

  // Remove all spaces for comparison to handle any spacing variation
  const noSpaces = normalizedModelName.replace(/\s+/g, '')

  // iPhone 17 Air - use iPhone 17 Air PNG mask (same approach as iPhone 15)
  // Must check BEFORE generic iPhone 17 or iPhone checks
  // Handles: "iPhone 17 Air", "iPhone 17AIR", "iPhone17Air", "IPhone 17AIR", etc.
  if (noSpaces.includes('iphone17air')) {
    console.log('🎯 Using iPhone 17 Air PNG mask for model:', modelName)
    return '/masks/iphone17air-mask.png'
  }

  // iPhone 17 Pro Max - use iPhone 17 Pro Max PNG mask
  if (noSpaces.includes('iphone17promax')) {
    console.log('🎯 Using iPhone 17 Pro Max PNG mask for model:', modelName)
    return '/masks/iphone17promax-mask.png'
  }

  // iPhone 17 Pro - use same PNG mask as Pro Max (same back design)
  if (noSpaces.includes('iphone17pro')) {
    console.log('🎯 Using iPhone 17 Pro PNG mask for model:', modelName)
    return '/masks/iphone17promax-mask.png'
  }

  // iPhone 16 series - use iPhone 16 SVG mask
  if (noSpaces.includes('iphone16')) {
    console.log('🎯 Using iPhone 16 mask for model:', modelName)
    return '/masks/iPhone 16 & 16 Plus.svg'
  }

  // iPhone models - use iPhone PNG mask (fallback for iPhone 15, 14, 13, etc.)
  if (normalizedModelName.includes('iphone')) {
    console.log('🎭 Using iPhone 15 mask for model:', modelName)
    return "/masks/iphone15's mask.png"
  }

  // Default fallback to iPhone
  console.log('⚠️ Using default iPhone mask for unknown model:', modelName)
  return "/masks/iphone15's mask.png"
}

/**
 * Get phone display dimensions based on phone model
 * Returns {width, height} for preview displays
 * @param {string} modelName - Name of the phone model
 * @param {string} size - Size variant: 'large' (default) or 'thumbnail'
 * @returns {object} Object with width and height properties
 */
export const getPhoneDimensions = (modelName, size = 'large') => {
  if (!modelName) {
    return size === 'thumbnail'
      ? { width: 160, height: 266 } // iPhone thumbnail
      : { width: 200, height: 333 } // iPhone large
  }

  const normalizedModelName = modelName.toLowerCase().trim()

  // Samsung models - square aspect ratio (600x600 source)
  if (normalizedModelName.includes('samsung') ||
      normalizedModelName.includes('galaxy') ||
      normalizedModelName.includes('s25') ||
      normalizedModelName.includes('s24') ||
      normalizedModelName.includes('s23')) {
    return size === 'thumbnail'
      ? { width: 160, height: 160 } // Samsung thumbnail (square)
      : { width: 300, height: 300 } // Samsung large (square)
  }

  // iPhone models - tall aspect ratio (1236x2460 source, ~1:2)
  if (normalizedModelName.includes('iphone')) {
    return size === 'thumbnail'
      ? { width: 160, height: 266 } // iPhone thumbnail
      : { width: 200, height: 333 } // iPhone large
  }

  // Default to iPhone dimensions
  return size === 'thumbnail'
    ? { width: 160, height: 266 }
    : { width: 200, height: 333 }
}

/**
 * Get mask positioning and dimensions for SVG mask element
 * Returns positioning values for proper mask alignment on phone back
 * @param {string} modelName - Name of the phone model
 * @returns {object} Object with x, y, width, height for mask positioning
 */
export const getMaskPosition = (modelName) => {
  if (!modelName) {
    // iPhone 17 Pro Max default
    return { x: '6.6%', y: '8.84%', width: '86.4%', height: '92%' }
  }

  const normalizedModelName = modelName.toLowerCase().trim()
  const noSpaces = normalizedModelName.replace(/\s+/g, '')

  // Samsung models - both phone back PNG and mask SVG are 600x600
  // The mask positioning is already baked into the SVG, so overlay 1:1
  if (normalizedModelName.includes('samsung') ||
      normalizedModelName.includes('galaxy') ||
      normalizedModelName.includes('s25') ||
      normalizedModelName.includes('s24') ||
      normalizedModelName.includes('s23')) {
    return {
      x: '-5.25%',      // No offset - start at container edge
      y: '-5.7%',      // No offset - start at container edge
      width: '108%', // Full width - mask SVG handles internal positioning
      height: '109%' // Full height - mask SVG handles internal positioning
    }
  }

  // iPhone 17 Air - adjusted 2px to the left, 1px wider on right, 1px bigger on top and bottom
  if (noSpaces.includes('iphone17air')) {
    return { x: '7.3%', y: '-0.21%', width: '85.35%', height: '100.42%' }
  }

  // iPhone 17 Pro Max - adjusted down and left, extended on right, top edge moved down 8% (bottom stays in place)
  if (noSpaces.includes('iphone17promax')) {
    return { x: '6.6%', y: '8.84%', width: '86.4%', height: '92%' }
  }

  // iPhone 17 Pro - adjusted down and left, extended on right, top edge moved down 8% (same as Pro Max)
  if (noSpaces.includes('iphone17pro')) {
    return { x: '6.6%', y: '8.84%', width: '86.4%', height: '92%' }
  }

  // iPhone models - default positioning
  if (normalizedModelName.includes('iphone')) {
    return { x: '8%', y: '0', width: '85%', height: '100%' }
  }

  // Default to iPhone positioning
  return { x: '8%', y: '0', width: '85%', height: '100%' }
}

/**
 * SVG clipPath data for models with SVG path-based masks
 * Models not listed here use PNG-embedded masks and fall back to overflow clipping
 */
const CLIP_PATH_DATA = {
  iphone15: {
    viewBox: '0 0 1000 1000',
    path: 'M 40.49 856.04 L 42.11 296.06 L 442.11 296.06 L 531.17 275.72 L 561.94 255.39 L 583.00 224.07 L 584.62 21.96 L 811.34 21.96 L 859.92 28.06 L 927.94 55.31 L 948.99 74.83 L 958.70 95.97 L 958.70 912.16 L 939.27 942.25 L 887.45 969.09 L 822.67 980.07 L 212.15 980.48 L 155.47 973.57 L 103.64 957.30 L 63.16 932.09 L 40.49 894.67 Z',
    transform: 'translate(0,0)'
  },
  iphone17air: {
    viewBox: '0 0 1000 1000',
    path: 'M 83.74 215.00 L 98.52 207.50 L 167.49 227.50 L 270.94 235.00 L 753.69 233.75 L 817.73 228.75 L 896.55 207.50 L 906.40 215.00 L 906.40 893.75 L 886.70 923.75 L 852.22 942.50 L 793.10 953.75 L 206.90 953.75 L 123.15 936.25 L 93.60 913.75 L 83.74 895.00 Z',
  },
  iphone17pro: {
    viewBox: '0 0 1000 1000',
    path: 'M 124.55 282.87 L 139.04 276.23 L 206.12 294.49 L 306.87 301.47 L 777.04 300.31 L 790.72 295.58 L 848.01 276.23 L 857.59 282.87 L 857.59 913.68 L 838.41 941.69 L 804.83 959.10 L 747.25 969.70 L 244.51 969.70 L 162.93 953.27 L 134.14 932.45 L 124.55 915.85 Z',
    transform: 'translate(0,0)'
  },
  samsungs25: {
    viewBox: '0 0 334 709',
    path: 'M0 0 C1.26731964 -0.00379669 2.53463928 -0.00759338 3.84036255 -0.01150513 C7.31209562 -0.02118691 10.78331313 -0.00590397 14.2549839 0.01440096 C17.90041097 0.03202012 21.54582321 0.02844573 25.19128418 0.02767944 C31.3212948 0.02955223 37.45110741 0.04690164 43.58105469 0.07421875 C50.63881396 0.10555713 57.69635562 0.1162187 64.75417948 0.11474764 C72.29672616 0.1133885 79.83919038 0.12732887 87.38171196 0.14564085 C89.53913062 0.14987564 91.6965357 0.15131946 93.85395813 0.15211868 C97.90534393 0.15453105 101.95648165 0.174074 106.0078125 0.1953125 C107.18751617 0.19440613 108.36721985 0.19349976 109.58267212 0.19256592 C122.87101352 0.29365198 135.20654254 1.27026648 145.61914062 10.30615234 C151.93817955 16.93376429 155.6418553 25.946269 155.65028554 35.11625808 C155.65355774 36.04933726 155.65682993 36.98241643 155.66020128 37.94377074 C155.65871766 38.96755816 155.65723403 39.99134559 155.65570545 41.04615688 C155.65805768 42.13925528 155.66040991 43.23235368 155.66283342 44.35857627 C155.66953609 48.05306112 155.66906482 51.74751091 155.6686554 55.44200134 C155.67195324 58.10493592 155.67564078 60.76786739 155.67979687 63.4308005 C155.68912919 70.00233091 155.69304599 76.57385459 155.69531584 83.14539081 C155.6982763 91.01457769 155.70697284 98.88375562 155.71573012 106.75293782 C155.73658276 125.77540904 155.7470459 144.79788182 155.75585973 163.82036181 C155.76006537 172.81880219 155.7652875 181.8172419 155.77054426 190.81568171 C155.78843582 221.61571334 155.80343173 252.41574516 155.81086445 283.21578121 C155.81133921 285.14975464 155.8118151 287.08372806 155.81229211 289.01770148 C155.81252849 289.97678411 155.81276486 290.93586675 155.8130084 291.92401249 C155.81420961 296.78324466 155.81542505 301.64247682 155.81665039 306.50170898 C155.81689054 307.46604079 155.81713069 308.4303726 155.81737812 309.42392659 C155.82527033 340.68701613 155.84869985 371.95006773 155.88120633 403.2131407 C155.91550737 436.26244475 155.93521588 469.31172661 155.93850869 502.36104876 C155.93892623 505.98950963 155.93940579 509.61797049 155.93993187 513.24643135 C155.94005506 514.13986721 155.94017825 515.03330307 155.94030518 515.95381275 C155.94263695 530.32998496 155.95829576 544.70611309 155.97877372 559.0822696 C155.9990339 573.53493673 156.00450811 587.98755094 155.99500308 602.44022965 C155.98978875 611.02478272 155.99566234 619.60915957 156.01753775 628.19368727 C156.03105505 633.93235551 156.02996066 639.67090257 156.0171358 645.40957205 C156.01024522 648.67662203 156.01177321 651.94326899 156.02669588 655.21030187 C156.16396515 687.24936014 156.16396515 687.24936014 145.52148438 698.48583984 C144.9465625 699.11232422 144.37164062 699.73880859 143.77929688 700.38427734 C135.50229016 708.52390636 124.87022824 710.08995828 113.68115234 710.00050354 C112.55230558 710.00744907 111.42345882 710.0143946 110.26040459 710.0215506 C106.51128744 710.03971731 102.76281049 710.02958469 99.01367188 710.01928711 C96.31217513 710.02635074 93.61072251 710.03496198 90.90924072 710.0453949 C84.35352415 710.06695274 77.79798171 710.06692938 71.24224138 710.05876935 C65.91080587 710.05245075 60.57942085 710.05362337 55.24798584 710.06004143 C54.48707669 710.06094308 53.72616754 710.06184474 52.94220054 710.06277372 C51.39607571 710.06462505 49.8499509 710.06648761 48.30382609 710.06836127 C33.83062605 710.08491078 19.3575237 710.0762445 4.88432956 710.0593757 C-8.33739939 710.04467786 -21.5589011 710.0593133 -34.78060079 710.08814586 C-48.38189264 710.11758366 -61.98307978 710.1284996 -75.58440208 710.11896366 C-77.12460707 710.11794118 -78.66481207 710.11694657 -80.20501709 710.11598015 C-81.34151614 710.11526556 -81.34151614 710.11526556 -82.50097477 710.11453654 C-87.82151163 710.11237838 -93.14194864 710.12214438 -98.46246338 710.13675117 C-104.95291579 710.1543226 -111.44307856 710.15408847 -117.93351984 710.13139952 C-121.24053033 710.12030107 -124.54692957 710.11972666 -127.85393524 710.13570023 C-131.44916589 710.15168815 -135.04301707 710.13662323 -138.63818359 710.11402893 C-140.18432689 710.13178252 -140.18432689 710.13178252 -141.7617054 710.14989477 C-151.32243338 710.02844822 -160.90867548 706.99085812 -167.95507812 700.27099609 C-177.74159382 688.80320719 -178.9254284 676.58212705 -178.85946655 662.06219482 C-178.862927 660.39966756 -178.86769417 658.7371426 -178.87364829 657.07462239 C-178.88613418 652.52530393 -178.87999895 647.97617505 -178.87068963 643.42685604 C-178.86388981 638.5134295 -178.87438485 633.6000351 -178.88262939 628.68661499 C-178.89595776 619.06992058 -178.89309332 609.45329647 -178.88439147 599.83659932 C-178.87761339 592.02223762 -178.87669874 584.2078956 -178.87996292 576.3935318 C-178.88042262 575.28092382 -178.88088232 574.16831584 -178.88135595 573.02199246 C-178.88231513 570.76172818 -178.88328777 568.50146391 -178.88427372 566.24119964 C-178.89282458 545.05641751 -178.88299742 523.87167436 -178.86687262 502.68689862 C-178.85346233 484.5052762 -178.85580399 466.32371123 -178.86962891 448.14208984 C-178.88567734 427.02635542 -178.89200842 405.91065511 -178.88279212 384.79491544 C-178.88183646 382.54423857 -178.88089335 380.2935617 -178.87996292 378.04288483 C-178.87950009 376.93550665 -178.87903727 375.82812847 -178.87856042 374.68719338 C-178.87596887 366.87923011 -178.88034492 359.07128847 -178.88740158 351.26332855 C-178.89580826 341.75267811 -178.89355365 332.24210197 -178.87755935 322.73146006 C-178.86966658 317.87806703 -178.86660228 313.02479795 -178.87650681 308.17140579 C-178.8854329 303.73038892 -178.88055536 299.28961116 -178.86457415 294.84861603 C-178.86121759 293.24047668 -178.86294002 291.63231721 -178.87020151 290.02419075 C-178.87930662 287.840631 -178.86998586 285.65789336 -178.85603905 283.47437668 C-178.85555199 282.26089514 -178.85506493 281.04741361 -178.85456312 279.79715991 C-178.27435322 274.68806935 -176.31529428 271.4481353 -172.97851562 267.61083984 C-169.376843 264.8962787 -165.89630087 264.6708584 -161.47851562 264.85693359 C-156.8293705 265.83155907 -153.29858804 268.19315117 -149.33398438 270.73193359 C-139.30080701 276.89458289 -128.17010078 276.65087142 -116.75976562 276.68896484 C-116.10088852 276.69179222 -115.44201141 276.6946196 -114.76316833 276.69753265 C-111.27049367 276.71246779 -107.77785964 276.72173085 -104.28515625 276.72607422 C-100.72299756 276.73152527 -97.16122758 276.75549751 -93.59918976 276.78404617 C-90.82091277 276.80291118 -88.04272458 276.80789079 -85.26438904 276.8094101 C-83.32664517 276.81381289 -81.38894931 276.8323438 -79.45129395 276.85137939 C-59.30455825 276.80172077 -41.3520278 271.24486068 -26.26757812 257.46630859 C-14.46605313 245.28044275 -9.39087667 228.11196979 -9.3313446 211.45645142 C-9.32766792 210.78459537 -9.32399123 210.11273932 -9.32020313 209.420524 C-9.30926365 207.18789341 -9.3053391 204.95530951 -9.30151367 202.72265625 C-9.29524141 201.11375789 -9.28859395 199.50486096 -9.28160095 197.89596558 C-9.26064022 192.6264546 -9.25020266 187.35694361 -9.24023438 182.08740234 C-9.23618315 180.26541504 -9.23206612 178.44342789 -9.22788429 176.62144089 C-9.20884628 168.05442988 -9.1946151 159.48742738 -9.18627232 150.92039931 C-9.17651973 141.07124952 -9.15024617 131.22232566 -9.10977143 121.37325537 C-9.07947511 113.73554261 -9.06479052 106.09789409 -9.06149131 98.46012247 C-9.05915529 93.91058509 -9.05038626 89.36128941 -9.02503014 84.81181717 C-9.00150786 80.52218072 -8.99761156 76.23294095 -9.00779152 71.94325638 C-9.00828126 70.38297189 -9.00213019 68.82266624 -8.98823547 67.26244354 C-8.85354223 51.21879031 -11.39241137 34.11499623 -20.47851562 20.48583984 C-21.25844046 14.60095245 -20.91731554 9.46617076 -17.47851562 4.48583984 C-12.73617664 -1.03333778 -6.71889961 -0.06314404 0 0 Z ',
    transform: 'translate(176.478515625,-0.48583984375) translate(-3, 354.5) scale(0.88, 0.93) translate(3, -354.5)'
  },
  iphone13_14_15plus: {
    viewBox: '0 0 401 763',
    path: 'M 50.12 223.29 L 78.20 230.30 L 164.41 230.30 L 194.48 218.29 L 206.52 207.27 L 214.54 197.26 L 216.54 57.07 L 328.82 58.08 L 346.87 70.09 L 356.89 97.13 L 356.89 670.88 L 350.88 692.91 L 336.84 708.93 L 316.79 714.94 L 92.23 714.94 L 64.16 704.92 L 56.14 695.91 L 50.12 678.89 Z',
    transform: 'translate(0,0)'
  },
  iphoneProModels: {
    viewBox: '0 0 401 763',
    path: 'M 56.14 625.82 L 58.14 263.35 L 92.23 272.36 L 196.49 271.36 L 226.56 256.34 L 238.59 242.32 L 240.60 75.10 L 306.76 73.10 L 330.82 83.11 L 342.86 104.14 L 344.86 269.35 L 344.86 638.84 L 342.86 662.87 L 336.84 673.88 L 318.80 688.90 L 298.75 691.91 L 106.27 691.91 L 70.17 680.89 L 60.15 667.88 L 56.14 647.85 Z',
    transform: 'translate(0,0)'
  },
  iphone16_16plus_17: {
    viewBox: '0 0 401 763',
    path: 'M 40.10 243.32 L 44.11 239.31 L 78.20 251.33 L 152.38 250.33 L 182.46 240.31 L 200.50 224.29 L 204.51 218.29 L 208.52 35.05 L 322.81 36.05 L 350.88 56.07 L 358.89 82.11 L 358.89 677.89 L 350.88 703.92 L 330.82 721.95 L 302.75 726.95 L 94.23 726.95 L 56.14 714.94 L 40.10 686.90 Z',
    transform: 'translate(0,0)'
  }
}

/**
 * Get SVG clipPath data for a specific phone model
 * All models now use SVG clipPath for masking (no PNG or SVG mask fallbacks)
 * @param {string} modelName - Name of the phone model
 * @returns {Object} clipPath data with viewBox and path
 */
export const getClipPathData = (modelName) => {
  if (!modelName) {
    console.log('⚠️ No model name provided for clipPath, using iPhone 17 Pro Max clipPath')
    return CLIP_PATH_DATA.iphone17pro
  }

  const normalizedModelName = modelName.toLowerCase().trim()
  const noSpaces = normalizedModelName.replace(/\s+/g, '')

  console.log('🔍 getClipPathData - Original model:', modelName)
  console.log('🔍 getClipPathData - Normalized (no spaces):', noSpaces)

  // iPhone 17 Air - use clipPath
  if (noSpaces.includes('iphone17air')) {
    console.log('✅ iPhone 17 Air - using clipPath')
    return CLIP_PATH_DATA.iphone17air
  }

  // iPhone 17 Pro Max - use clipPath (same as Pro)
  if (noSpaces.includes('iphone17promax')) {
    console.log('✅ iPhone 17 Pro Max - using clipPath')
    return CLIP_PATH_DATA.iphone17pro
  }

  // iPhone 17 Pro - use clipPath
  if (noSpaces.includes('iphone17pro')) {
    console.log('✅ iPhone 17 Pro - using clipPath')
    return CLIP_PATH_DATA.iphone17pro
  }

  // iPhone 17 (non-pro) - matches "iphone 16, 16 plus, 17.png"
  if (noSpaces.includes('iphone17') && !noSpaces.includes('pro') && !noSpaces.includes('air')) {
    console.log('📱 Using iPhone 16/16Plus/17 clipPath for iPhone 17:', modelName)
    return CLIP_PATH_DATA.iphone16_16plus_17
  }

  // iPhone 16 Pro models - matches "iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max.png"
  if (noSpaces.includes('iphone16pro')) {
    console.log('📱 Using Pro models clipPath for iPhone 16 Pro:', modelName)
    return CLIP_PATH_DATA.iphoneProModels
  }

  // iPhone 16 / 16 Plus (non-pro) - matches "iphone 16, 16 plus, 17.png"
  if (noSpaces.includes('iphone16') && !noSpaces.includes('pro')) {
    console.log('📱 Using iPhone 16/16Plus/17 clipPath for iPhone 16:', modelName)
    return CLIP_PATH_DATA.iphone16_16plus_17
  }

  // iPhone 15 Pro models - matches "iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max.png"
  if (noSpaces.includes('iphone15pro')) {
    console.log('📱 Using Pro models clipPath for iPhone 15 Pro:', modelName)
    return CLIP_PATH_DATA.iphoneProModels
  }

  // iPhone 15 Plus (non-pro) - matches "iphone 13, 14, 15plus,14plus.png"
  if (noSpaces.includes('iphone15plus')) {
    console.log('📱 Using iPhone 13/14/15Plus clipPath for iPhone 15 Plus:', modelName)
    return CLIP_PATH_DATA.iphone13_14_15plus
  }

  // iPhone 14 Pro models - matches "iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max.png"
  if (noSpaces.includes('iphone14pro')) {
    console.log('📱 Using Pro models clipPath for iPhone 14 Pro:', modelName)
    return CLIP_PATH_DATA.iphoneProModels
  }

  // iPhone 14 / 14 Plus (non-pro) - matches "iphone 13, 14, 15plus,14plus.png"
  if (noSpaces.includes('iphone14')) {
    console.log('📱 Using iPhone 13/14/15Plus clipPath for iPhone 14:', modelName)
    return CLIP_PATH_DATA.iphone13_14_15plus
  }

  // iPhone 13 Pro models - matches "iphone 13 pro max, 13 pro, 14 pro, 14 pro max, 15 pro, 15 pro max, 16 pro, 16 pro max.png"
  if (noSpaces.includes('iphone13pro')) {
    console.log('📱 Using Pro models clipPath for iPhone 13 Pro:', modelName)
    return CLIP_PATH_DATA.iphoneProModels
  }

  // iPhone 13 (non-pro) - matches "iphone 13, 14, 15plus,14plus.png"
  if (noSpaces.includes('iphone13')) {
    console.log('📱 Using iPhone 13/14/15Plus clipPath for iPhone 13:', modelName)
    return CLIP_PATH_DATA.iphone13_14_15plus
  }

  // Samsung models - use clipPath approach
  if (normalizedModelName.includes('samsung') ||
      normalizedModelName.includes('galaxy') ||
      normalizedModelName.includes('s25') ||
      normalizedModelName.includes('s24') ||
      normalizedModelName.includes('s23')) {
    console.log('📱 Using Samsung S25 clipPath for model:', modelName)
    return CLIP_PATH_DATA.samsungs25
  }

  // Default iPhone fallback - use iPhone 15 clipPath
  if (normalizedModelName.includes('iphone')) {
    console.log('📱 Using default iPhone 15 clipPath for model:', modelName)
    return CLIP_PATH_DATA.iphone15
  }

  // Default fallback to iPhone 15
  console.log('⚠️ Unknown model, using iPhone 15 clipPath')
  return CLIP_PATH_DATA.iphone15
}

// Export all layouts for direct access if needed
export {
  IPHONE_15_LAYOUT,
  IPHONE_15_PRO_LAYOUT,
  IPHONE_15_PRO_MAX_LAYOUT,
  IPHONE_14_PRO_LAYOUT,
  IPHONE_16_LAYOUT,
  IPHONE_17_AIR_LAYOUT,
  IPHONE_17_PRO_LAYOUT,
  IPHONE_17_PRO_MAX_LAYOUT,
  SAMSUNG_S23_LAYOUT,
  SAMSUNG_S25_LAYOUT,
  GENERIC_IPHONE_LAYOUT
}

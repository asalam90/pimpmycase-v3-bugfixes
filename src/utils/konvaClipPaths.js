/**
 * Konva Clip Path Utilities
 *
 * Converts SVG path data from phoneCaseLayout.js into Konva clipFunc functions.
 * This enables unified clipping for preview AND export.
 */

import { getClipPathData } from './phoneCaseLayout'

/**
 * Parse SVG path string into array of commands
 * Handles M (moveTo), L (lineTo), Z (closePath), and C (bezierCurveTo)
 *
 * @param {string} pathData - SVG path d attribute
 * @returns {Array} Array of {command, args} objects
 */
export const parseSvgPath = (pathData) => {
  if (!pathData) return []

  const commands = []
  // Match command letter followed by numbers (including negative and decimals)
  const regex = /([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi
  let match

  while ((match = regex.exec(pathData)) !== null) {
    const command = match[1].toUpperCase()
    const argsString = match[2].trim()

    // Parse numbers from the args string
    const args = argsString
      .split(/[\s,]+/)
      .filter(s => s.length > 0)
      .map(parseFloat)
      .filter(n => !isNaN(n))

    commands.push({ command, args })
  }

  return commands
}

/**
 * Draw SVG path commands onto a Canvas 2D context
 * This is used by Konva's clipFunc
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} commands - Parsed SVG commands from parseSvgPath
 * @param {number} scaleX - Horizontal scale factor (containerWidth / viewBoxWidth)
 * @param {number} scaleY - Vertical scale factor (containerHeight / viewBoxHeight)
 * @param {number} offsetX - X offset for transform
 * @param {number} offsetY - Y offset for transform
 */
export const drawPathOnContext = (ctx, commands, scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0) => {
  ctx.beginPath()

  let currentX = 0
  let currentY = 0

  for (const { command, args } of commands) {
    switch (command) {
      case 'M': // moveTo
        if (args.length >= 2) {
          currentX = args[0]
          currentY = args[1]
          ctx.moveTo(
            (currentX + offsetX) * scaleX,
            (currentY + offsetY) * scaleY
          )
        }
        break

      case 'L': // lineTo
        if (args.length >= 2) {
          currentX = args[0]
          currentY = args[1]
          ctx.lineTo(
            (currentX + offsetX) * scaleX,
            (currentY + offsetY) * scaleY
          )
        }
        break

      case 'H': // horizontal lineTo
        if (args.length >= 1) {
          currentX = args[0]
          ctx.lineTo(
            (currentX + offsetX) * scaleX,
            (currentY + offsetY) * scaleY
          )
        }
        break

      case 'V': // vertical lineTo
        if (args.length >= 1) {
          currentY = args[0]
          ctx.lineTo(
            (currentX + offsetX) * scaleX,
            (currentY + offsetY) * scaleY
          )
        }
        break

      case 'C': // bezierCurveTo (cubic)
        if (args.length >= 6) {
          ctx.bezierCurveTo(
            (args[0] + offsetX) * scaleX,
            (args[1] + offsetY) * scaleY,
            (args[2] + offsetX) * scaleX,
            (args[3] + offsetY) * scaleY,
            (args[4] + offsetX) * scaleX,
            (args[5] + offsetY) * scaleY
          )
          currentX = args[4]
          currentY = args[5]
        }
        break

      case 'Q': // quadraticCurveTo
        if (args.length >= 4) {
          ctx.quadraticCurveTo(
            (args[0] + offsetX) * scaleX,
            (args[1] + offsetY) * scaleY,
            (args[2] + offsetX) * scaleX,
            (args[3] + offsetY) * scaleY
          )
          currentX = args[2]
          currentY = args[3]
        }
        break

      case 'Z': // closePath
        ctx.closePath()
        break

      default:
        console.warn(`Unsupported SVG path command: ${command}`)
    }
  }
}

/**
 * Create a Konva clipFunc for a phone model
 * This is the main function used by KonvaPhoneDisplay
 *
 * @param {string} modelName - Phone model name
 * @param {number} containerWidth - Width of the Konva Stage/Layer
 * @param {number} containerHeight - Height of the Konva Stage/Layer
 * @returns {Function} clipFunc for Konva Layer
 */
export const createPhoneClipFunc = (modelName, containerWidth, containerHeight) => {
  const clipPathData = getClipPathData(modelName)

  if (!clipPathData || !clipPathData.path) {
    // Fallback: no clipping (full rectangle)
    return (ctx) => {
      ctx.beginPath()
      ctx.rect(0, 0, containerWidth, containerHeight)
    }
  }

  // Parse viewBox to get original dimensions
  const viewBoxParts = clipPathData.viewBox.split(' ').map(parseFloat)
  const viewBoxWidth = viewBoxParts[2] || 1000
  const viewBoxHeight = viewBoxParts[3] || 1000

  // Calculate scale factors
  const scaleX = containerWidth / viewBoxWidth
  const scaleY = containerHeight / viewBoxHeight

  // Parse transform if present (e.g., "translate(0,0)")
  let offsetX = 0
  let offsetY = 0
  if (clipPathData.transform) {
    const translateMatch = clipPathData.transform.match(/translate\(\s*([-\d.]+)\s*,?\s*([-\d.]+)?\s*\)/)
    if (translateMatch) {
      offsetX = parseFloat(translateMatch[1]) || 0
      offsetY = parseFloat(translateMatch[2]) || 0
    }
  }

  // Parse the path once
  const commands = parseSvgPath(clipPathData.path)

  // Return the clipFunc
  return (ctx) => {
    drawPathOnContext(ctx, commands, scaleX, scaleY, offsetX, offsetY)
  }
}

/**
 * Get viewBox dimensions for a phone model
 * Useful for coordinate calculations
 *
 * @param {string} modelName - Phone model name
 * @returns {Object} {width, height} from viewBox
 */
export const getViewBoxDimensions = (modelName) => {
  const clipPathData = getClipPathData(modelName)

  if (!clipPathData || !clipPathData.viewBox) {
    return { width: 1000, height: 1000 }
  }

  const viewBoxParts = clipPathData.viewBox.split(' ').map(parseFloat)
  return {
    width: viewBoxParts[2] || 1000,
    height: viewBoxParts[3] || 1000
  }
}

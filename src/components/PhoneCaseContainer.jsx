import React from 'react'
import { getPhoneCaseLayout, getContentAreaStyles, getPhoneModelClass } from '../utils/phoneCaseLayout'

/**
 * PhoneCaseContainer Component
 *
 * Renders a phone case container with camera-aware layout that prevents
 * backgrounds and content from overflowing into camera cutout areas.
 *
 * @param {Object} props
 * @param {string} props.modelName - Phone model name (e.g., "iPhone 15")
 * @param {React.ReactNode} props.children - Content to render inside the case
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.showCameraOverlay - Show visual indicator of camera area (debug)
 * @param {Object} props.containerDimensions - Container dimensions {width, height} in pixels
 */
const PhoneCaseContainer = ({
  modelName,
  children,
  className = '',
  style = {},
  showCameraOverlay = false,
  containerDimensions = { width: 288, height: 480 }
}) => {
  const layout = getPhoneCaseLayout(modelName)
  const contentStyles = getContentAreaStyles(modelName)

  // Generate CSS class name from model
  const modelClass = getPhoneModelClass(modelName)

  // Calculate camera overlay position if enabled
  const cameraOverlayStyle = showCameraOverlay
    ? {
        position: 'absolute',
        top: `${layout.cameraArea.top}%`,
        left: `${layout.cameraArea.left}%`,
        width: `${layout.cameraArea.width}%`,
        height: `${layout.cameraArea.height}%`,
        border: '2px dashed rgba(255, 100, 100, 0.5)',
        borderRadius: `${layout.cameraArea.borderRadius}px`,
        background: 'rgba(255, 100, 100, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000
      }
    : null

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${containerDimensions.width}px`,
        height: `${containerDimensions.height}px`,
        ...style
      }}
    >
      {/* Content area with camera-aware clipping */}
      <div
        className={`phone-case-content ${modelClass}`}
        style={contentStyles}
      >
        {children}
      </div>

      {/* Camera cutout visual indicator (debug mode) */}
      {showCameraOverlay && (
        <div style={cameraOverlayStyle}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              color: 'rgba(255, 0, 0, 0.7)',
              fontWeight: 'bold',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            CAMERA
            <br />
            AREA
          </div>
        </div>
      )}

      {/* Safe zones visualization (debug mode) */}
      {showCameraOverlay && (
        <>
          {/* Top dead zone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${layout.safeZones.topDeadZone}%`,
              background: 'rgba(255, 200, 0, 0.05)',
              border: '1px dashed rgba(255, 200, 0, 0.3)',
              pointerEvents: 'none',
              zIndex: 999
            }}
          />
          {/* Left dead zone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${layout.safeZones.leftDeadZone}%`,
              background: 'rgba(0, 100, 255, 0.05)',
              border: '1px dashed rgba(0, 100, 255, 0.3)',
              pointerEvents: 'none',
              zIndex: 999
            }}
          />
          {/* Right dead zone */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: `${layout.safeZones.rightDeadZone}%`,
              background: 'rgba(0, 100, 255, 0.05)',
              border: '1px dashed rgba(0, 100, 255, 0.3)',
              pointerEvents: 'none',
              zIndex: 999
            }}
          />
          {/* Bottom dead zone */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${layout.safeZones.bottomDeadZone}%`,
              background: 'rgba(100, 255, 0, 0.05)',
              border: '1px dashed rgba(100, 255, 0, 0.3)',
              pointerEvents: 'none',
              zIndex: 999
            }}
          />
        </>
      )}
    </div>
  )
}

export default PhoneCaseContainer

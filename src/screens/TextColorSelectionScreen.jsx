import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Type, X, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
// Positioning utilities
import { useTextBoundaries, createPositionHandlers } from '../utils/textBoundaryManager'
import CircleSubmitButton from '../components/CircleSubmitButton'
import { fonts as availableFonts } from '../utils/fontManager'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const TextColorSelectionScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand, model, color, template, uploadedImage, uploadedImages, imageTransforms, inputText, selectedFont, fontSize, textPosition, transform: initialTransform, stripCount, selectedModelData, deviceId } = location.state || {}
  
  // Local state for adjustable text position
  const [adjustedTextPosition, setAdjustedTextPosition] = useState(textPosition || { x: 50, y: 50 })
  const [isPositionBeingAdjusted, setIsPositionBeingAdjusted] = useState(false)

  // Hook for text boundaries with model-specific dimensions
  const {
    textDimensions,
    containerDimensions,
    safeBoundaries,
    constrainPosition,
    validateTextFit,
    getFontStyle,
    measureRef
  } = useTextBoundaries(template, inputText, fontSize, selectedFont, selectedModelData)

  // Position handlers
  const positionHandlers = createPositionHandlers(adjustedTextPosition, safeBoundaries, setAdjustedTextPosition)

  // Sync position when text or dimensions change
  useEffect(() => {
    if (inputText?.trim() && textDimensions.width > 0 && !isPositionBeingAdjusted) {
      const constrainedPosition = constrainPosition(adjustedTextPosition)
      if (constrainedPosition.x !== adjustedTextPosition.x || constrainedPosition.y !== adjustedTextPosition.y) {
        setIsPositionBeingAdjusted(true)
        setAdjustedTextPosition(constrainedPosition)
        setTimeout(() => setIsPositionBeingAdjusted(false), 100)
      }
    }
  }, [textDimensions, inputText, selectedFont, fontSize, constrainPosition, adjustedTextPosition, isPositionBeingAdjusted])

  const [selectedTextColor, setSelectedTextColor] = useState(location.state?.selectedTextColor || '#ffffff')

  const colors = [
    { name: 'White', value: '#ffffff', bg: 'bg-white', border: 'border-gray-300' },
    { name: 'Black', value: '#000000', bg: 'bg-black', border: 'border-gray-800' },
    { name: 'Red', value: '#ef4444', bg: 'bg-red-500', border: 'border-red-500' },
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500', border: 'border-blue-500' },
    { name: 'Green', value: '#22c55e', bg: 'bg-green-500', border: 'border-green-500' },
    { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500', border: 'border-yellow-500' },
    { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500', border: 'border-purple-500' },
    { name: 'Orange', value: '#f97316', bg: 'bg-orange-500', border: 'border-orange-500' },
    { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500', border: 'border-teal-500' },
    { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500', border: 'border-indigo-500' },
    { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500', border: 'border-pink-500' },
    { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', border: 'border-rose-500' },
    { name: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500', border: 'border-sky-500' },
    { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', border: 'border-cyan-500' },
    { name: 'Lime', value: '#84cc16', bg: 'bg-lime-500', border: 'border-lime-500' },
    { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500', border: 'border-gray-500' }
  ]

  const handleBack = () => {
    navigate('/font-selection', { 
      state: { 
        brand, 
        model, 
        color, 
        template, 
        uploadedImage,
        uploadedImages,
        imageTransforms,
        inputText,
        selectedFont,
        fontSize,
        textPosition: adjustedTextPosition,
        selectedTextColor,
        transform: initialTransform,
        stripCount,
        selectedModelData,
        deviceId
      } 
    })
  }

  const handleNext = () => {
    navigate('/background-color-selection', {
      state: {
        brand,
        model,
        color,
        template,
        uploadedImage,
        uploadedImages,
        imageTransforms,
        inputText,
        selectedFont,
        fontSize,
        selectedTextColor,
        textPosition: adjustedTextPosition,
        transform: initialTransform,
        stripCount,
        selectedModelData,
        deviceId
      }
    })
  }

  const getPreviewStyle = () => {
    const fonts = availableFonts
    return {
      fontFamily: fonts.find(f => f.name === selectedFont)?.style || 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: selectedTextColor,
      whiteSpace: 'nowrap',
      fontWeight: '500',
      lineHeight: '1.2'
    }
  }

  const getTextStyle = () => ({
    position: 'absolute',
    left: `${adjustedTextPosition.x}%`,
    top: `${adjustedTextPosition.y}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  })

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Hidden measurement div */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
        <div ref={measureRef} style={getFontStyle()}>
          {inputText || 'M'}
        </div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1
          style={{
            fontSize: '48px',
            fontFamily: 'Futura Heavy, Futura, sans-serif',
            fontWeight: '900',
            color: '#333333',
            textAlign: 'center',
            lineHeight: '1.1',
            letterSpacing: '-0.02em'
          }}
        >
          Text Color
        </h1>
        <div className="w-12 h-12"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Phone Case Preview */}
        <div className="relative mb-8">
          {template?.id?.startsWith('film-strip') ? (
            <div className="relative w-[525px] h-[525px] overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 flex flex-col justify-center items-center z-10"
                style={{ paddingTop:'0px', paddingBottom:'0px', paddingLeft:'180px', paddingRight:'179px'}}
              >
                {uploadedImages && uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full overflow-hidden rounded-sm transition-all duration-300 border-t-[8px] border-b-[8px] border-black"
                    style={{ height: `${100 / (stripCount || 3) - 2}%` }}
                  >
                    <img 
                      src={img} 
                      alt={`Photo ${idx + 1}`} 
                      className="w-full h-full object-contain"
                      style={{
                        objectPosition: `${imageTransforms?.[idx]?.x || 50}% ${imageTransforms?.[idx]?.y || 50}%`,
                        transform: `scale(${imageTransforms?.[idx]?.scale || 1})`
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 z-20 pointer-events-none">
                <img src="/filmstrip-case.png" alt="Film strip case" className="w-full h-full object-contain" />
              </div>
              
              {/* Text overlay for film strip - positioned above everything */}
              {inputText && (
                <div 
                  className="absolute z-30 pointer-events-none"
                  style={getTextStyle()}
                >
                  <div className="px-4 py-2 whitespace-nowrap">
                    <p style={getPreviewStyle()}>{inputText}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: '250px',
                height: '416px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <MaskedPhoneDisplay
                image={appState.uploadedImages.length > 1 ? appState.uploadedImages : (appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null)}
                transform={appState.uploadedImages.length > 1 ? appState.imageTransforms : (appState.transform || (appState.imageTransforms && appState.imageTransforms[0]))}
                width={250}
                height={416}
                modelName={selectedModelData?.model_name || model}
              >
                {/* Text overlay preview */}
                {inputText && (
                  <div style={getTextStyle()}>
                    <div className="px-4 py-2 whitespace-nowrap">
                      <p style={getPreviewStyle()}>{inputText}</p>
                    </div>
                  </div>
                )}
              </MaskedPhoneDisplay>
            </div>
          )}
        </div>

        {/* Selection Label */}
        <div className="w-full max-w-xs mb-6 flex items-center justify-center">
          <div
            className="bg-white rounded-full px-4 py-2 border border-gray-300"
            style={{
              fontSize: '16px',
              fontWeight: '300',
              color: '#999999'
            }}
          >
            Text Color
          </div>
        </div>

        {/* Position Control Buttons */}
        {inputText && (
          <div className="mb-6">
            <p
              style={{
                fontSize: '16px',
                fontWeight: '300',
                color: '#999999',
                textAlign: 'center',
                marginBottom: '12px'
              }}
            >
              Position Text
            </p>

            {/* Up button */}
            <div className="flex justify-center mb-2">
              <button
                onClick={positionHandlers.moveUp}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowUp size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Left and Right buttons */}
            <div className="flex items-center justify-center space-x-12 mb-2">
              <button
                onClick={positionHandlers.moveLeft}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={positionHandlers.moveRight}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowRight size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Down button */}
            <div className="flex justify-center">
              <button
                onClick={positionHandlers.moveDown}
                className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
              >
                <ArrowDown size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* 4x4 Color Grid */}
        <div className="w-full mb-8 flex justify-center">
          <div className="grid grid-cols-4 gap-4 max-w-xs">
            {colors.map((colorOption) => (
              <button
                key={colorOption.value}
                onClick={() => setSelectedTextColor(colorOption.value)}
                className={`
                  w-16 h-16 rounded-full border-2 transition-all duration-300
                  ${colorOption.bg}
                  ${selectedTextColor === colorOption.value
                    ? 'border-gray-800 scale-110 shadow-lg'
                    : `${colorOption.border} hover:scale-105 active:scale-95`}
                `}
                title={colorOption.name}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-black text-white rounded-2xl active:scale-95 transition-transform"
          style={{
            fontSize: '16px',
            fontWeight: '300'
          }}
        >
          Submit
        </button>
      </div>

    </div>
  )
}

export default TextColorSelectionScreen 

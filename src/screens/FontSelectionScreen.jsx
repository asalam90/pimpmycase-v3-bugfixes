import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon, Type, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import CircleSubmitButton from '../components/CircleSubmitButton'
import { useTextBoundaries, validateFontSize, createPositionHandlers } from '../utils/textBoundaryManager'
import { fonts as availableFonts } from '../utils/fontManager'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const FontSelectionScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand, model, color, template, uploadedImage, uploadedImages, imageTransforms, inputText, textPosition, transform: initialTransform, stripCount, selectedTextColor, selectedModelData, deviceId } = location.state || {}
  
  const [selectedFont, setSelectedFont] = useState(location.state?.selectedFont || 'Arial')
  const [fontSize, setFontSize] = useState(location.state?.fontSize || 30)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [adjustedTextPosition, setAdjustedTextPosition] = useState(textPosition || { x: 50, y: 50 })
  const [isPositionBeingAdjusted, setIsPositionBeingAdjusted] = useState(false)

  // Use the enhanced text boundary management system with model-specific dimensions
  const {
    textDimensions,
    containerDimensions,
    safeBoundaries,
    constrainPosition,
    validateTextFit,
    getFontStyle,
    measureRef
  } = useTextBoundaries(template, inputText, fontSize, selectedFont, selectedModelData)

  // Position handlers for manual adjustment
  const positionHandlers = createPositionHandlers(adjustedTextPosition, safeBoundaries, setAdjustedTextPosition)

  // The centralised font catalogue
  const fonts = availableFonts

  // Initialize adjusted position when component mounts
  useEffect(() => {
    if (textPosition) {
      setAdjustedTextPosition(textPosition)
    }
  }, [textPosition])

  // Adjust position when text size changes due to font/size changes
  useEffect(() => {
    if (inputText?.trim() && textDimensions.width > 0 && !isPositionBeingAdjusted) {
      const constrainedPosition = constrainPosition(adjustedTextPosition)
      
      if (constrainedPosition.x !== adjustedTextPosition.x || constrainedPosition.y !== adjustedTextPosition.y) {
        setIsPositionBeingAdjusted(true)
        setAdjustedTextPosition(constrainedPosition)
        
        // Reset the flag after a short delay
        setTimeout(() => {
          setIsPositionBeingAdjusted(false)
        }, 100)
      }
    }
  }, [textDimensions, inputText, selectedFont, fontSize, constrainPosition, adjustedTextPosition, isPositionBeingAdjusted])

  const handleBack = () => {
    navigate('/text-input', { 
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
        textPosition: adjustedTextPosition, // Pass the adjusted position back
        selectedTextColor,
        transform: initialTransform,
        stripCount,
        selectedModelData,
        deviceId
      } 
    })
  }

  const handleNext = () => {
    navigate('/text-color-selection', { 
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
        textPosition: adjustedTextPosition, // Pass the adjusted position forward
        selectedTextColor,
        transform: initialTransform,
        stripCount,
        selectedModelData,
        deviceId
      } 
    })
  }

  const increaseFontSize = () => {
    const newSize = validateFontSize(Math.min(30, fontSize + 2), inputText?.length || 0, containerDimensions)
    setFontSize(newSize)
  }

  const decreaseFontSize = () => {
    const newSize = validateFontSize(Math.max(12, fontSize - 2), inputText?.length || 0, containerDimensions)
    setFontSize(newSize)
  }

  const getPreviewStyle = () => ({
    ...getFontStyle(),
    color: selectedTextColor || '#ffffff'
  })

  const handleFontSelect = (fontName) => {
    setSelectedFont(fontName)
    setIsDropdownOpen(false)
  }

  const getTextStyle = () => ({
    position: 'absolute',
    left: `${adjustedTextPosition.x}%`,
    top: `${adjustedTextPosition.y}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    textAlign: 'center'
  })

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd', overflow: 'visible' }}>
      {/* Hidden measurement div */}
      <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none">
        <div
          ref={measureRef}
          style={getFontStyle()}
        >
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
          Choose Font
        </h1>
        <div className="w-12 h-12"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-50 flex-1 flex flex-col items-center justify-center px-6">
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
              
              {/* Text overlay for film strip */}
              {inputText && (
                <div 
                  className="absolute z-30 pointer-events-none"
                  style={getTextStyle()}
                >
                  <div 
                    className="text-white"
                    style={{
                      ...getFontStyle(),
                      color: selectedTextColor || '#ffffff'
                    }}
                  >
                    {inputText}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <MaskedPhoneDisplay
              image={uploadedImages && uploadedImages.length > 0 ? uploadedImages : uploadedImage}
              transform={uploadedImages && uploadedImages.length > 0 ? imageTransforms : initialTransform}
              width={288}
              height={480}
              modelName={selectedModelData?.model_name || model}
            >
              {/* Text overlay preview */}
              {inputText && (
                <div style={getTextStyle()}>
                  <div
                    className="text-white"
                    style={{
                      ...getFontStyle(),
                      color: selectedTextColor || '#ffffff'
                    }}
                  >
                    {inputText}
                  </div>
                </div>
              )}
            </MaskedPhoneDisplay>
          )}
        </div>

        {/* Navigation Arrows with Font Size Controls */}
        <div className="w-full max-w-xs mb-6 flex items-center justify-between">
          {/* Left Arrow */}
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          {/* Font Size Controls */}
          <div className="flex items-center justify-between bg-white rounded-full p-4 border border-gray-300 mx-2 flex-1">
            <button 
              onClick={decreaseFontSize}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center active:scale-95 transition-transform"
              disabled={fontSize <= 12}
            >
              <Minus size={16} className="text-gray-600" />
            </button>
            <div className="text-center px-2 flex-1">
              <span className="text-lg font-medium text-gray-800">{fontSize}px</span>
              <p className="text-xs text-gray-500">Font Size</p>
            </div>
            <button 
              onClick={increaseFontSize}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center active:scale-95 transition-transform"
              disabled={fontSize >= 30}
            >
              <Plus size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Font Selection Dropdown */}
        <div className="w-full max-w-sm mb-8 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white border border-gray-300 rounded-2xl p-4 active:scale-95 transition-all duration-200 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Type size={16} className="text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800" style={{ fontFamily: fonts.find(f => f.name === selectedFont)?.style }}>
                  {selectedFont}
                </p>
                <p className="text-xs text-gray-500">Font Family</p>
              </div>
            </div>
            <ChevronDown 
              size={20} 
              className={`text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="dropdown-menu absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-300 max-h-64 overflow-y-auto pointer-events-auto z-50">
              {fonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => handleFontSelect(font.name)}
                  className="w-full p-4 text-left hover:bg-gray-50 first:rounded-t-2xl last:rounded-b-2xl transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                >
                  <p 
                    className="font-medium text-gray-800"
                    style={{ fontFamily: font.style }}
                  >
                    {font.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: font.style }}>
                    The quick brown fox jumps
                  </p>
                </button>
              ))}
            </div>
          )}
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
                <ArrowRightIcon size={20} className="text-gray-600" />
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
      </div>

      {/* Overlay to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

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

export default FontSelectionScreen
import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Type, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, ArrowRight as ArrowForward, ArrowUp, ArrowDown } from 'lucide-react'
import CircleSubmitButton from '../components/CircleSubmitButton'
import { fonts as availableFonts } from '../utils/fontManager'
import { useAppState } from '../contexts/AppStateContext'
import { composeFinalImage } from '../utils/finalImageComposer'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import environment from '../config/environment'

const BackgroundColorSelectionScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useAppState()

  // First extract location state to get deviceIdFromState
  const {
    brand, 
    model, 
    color, 
    template, 
    uploadedImage, 
    uploadedImages, 
    imageTransforms: initialImageTransforms, 
    inputText, 
    selectedFont, 
    fontSize, 
    textPosition, 
    transform: initialTransform, 
    stripCount,
    selectedTextColor,
    selectedModelData,
    deviceId: deviceIdFromState
  } = location.state || {}

  // Extract device_id (needed later on PaymentScreen)
  const currentUrl = window.location.href
  const urlParams = new URLSearchParams(window.location.search)
  const deviceIdMatch = currentUrl.match(/device_id=([^&]+)/)
  const deviceIdFromUrl = urlParams.get('device_id') || (deviceIdMatch ? deviceIdMatch[1] : null)
  const deviceId = deviceIdFromState || appState?.vendingMachineSession?.deviceId || deviceIdFromUrl || null

  // Maintain local copy of image transforms for live editing
  const [imageTransforms, setImageTransforms] = useState(initialImageTransforms || (uploadedImages ? uploadedImages.map(() => ({ x: 0, y: 0, scale: 2.5 })) : []))

  // We'll edit only the first image for now (or single image template)
  const activeIdx = 0

  // CRITICAL FIX: Add loading state and debouncing to prevent duplicate image uploads
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const uploadInProgressRef = useRef(false)

  const hasImage = uploadedImages && uploadedImages[activeIdx]

  const updateTransform = (delta) => {
    setImageTransforms((prev) => {
      const next = [...prev]
      const current = next[activeIdx] || { x: 0, y: 0, scale: 2.5 }
      next[activeIdx] = { ...current, ...delta }
      return next
    })
  }

  // Control handlers
  const moveLeft = () => hasImage && updateTransform({ x: Math.max(-100, (imageTransforms[activeIdx]?.x || 0) - 10) })
  const moveRight = () => hasImage && updateTransform({ x: Math.min(100, (imageTransforms[activeIdx]?.x || 0) + 10) })
  const moveUp = () => hasImage && updateTransform({ y: Math.max(-100, (imageTransforms[activeIdx]?.y || 0) - 10) })
  const moveDown = () => hasImage && updateTransform({ y: Math.min(100, (imageTransforms[activeIdx]?.y || 0) + 10) })
  const zoomInImg = () => hasImage && updateTransform({ scale: Math.min(5, (imageTransforms[activeIdx]?.scale || 2.5) + 0.2) })
  const zoomOutImg = () => hasImage && updateTransform({ scale: Math.max(0.1, (imageTransforms[activeIdx]?.scale || 2.5) - 0.2) })
  const resetTransform = () => hasImage && updateTransform({ x: 0, y: 0, scale: 2.5 })

  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#ffffff')

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
    { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500', border: 'border-gray-500' },
    { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500', border: 'border-rose-500' },
    { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { name: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500', border: 'border-sky-500' },
    { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-500', border: 'border-violet-500' },
    { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500', border: 'border-amber-500' },
    { name: 'Lime', value: '#84cc16', bg: 'bg-lime-500', border: 'border-lime-500' },
    { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500', border: 'border-cyan-500' },
    { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-500', border: 'border-fuchsia-500' },
    { name: 'Slate', value: '#64748b', bg: 'bg-slate-500', border: 'border-slate-500' },
    { name: 'Stone', value: '#78716c', bg: 'bg-stone-500', border: 'border-stone-500' },
    { name: 'Zinc', value: '#71717a', bg: 'bg-zinc-500', border: 'border-zinc-500' },
    { name: 'Neutral', value: '#737373', bg: 'bg-neutral-500', border: 'border-neutral-500' }
  ]

  const handleBack = () => {
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
        textPosition,
        transform: initialTransform,
        stripCount,
        selectedTextColor,
        selectedModelData,
        deviceId
      } 
    })
  }

  const handleNext = async () => {
    // CRITICAL FIX: Prevent duplicate uploads with debouncing
    if (isProcessingImage || uploadInProgressRef.current) {
      console.log('🚫 Image upload already in progress, ignoring duplicate request')
      return
    }
    
    setIsProcessingImage(true)
    uploadInProgressRef.current = true
    
    try {
      console.log('🔄 Composing and uploading final image...')
      
      // Compose the final image with all customizations
      const finalImageData = await composeFinalImage({
        template,
        uploadedImages,
        uploadedImage,
        imageTransforms,
        inputText,
        selectedFont,
        fontSize,
        selectedTextColor,
        selectedBackgroundColor,
        textPosition,
        transform: initialTransform,
        modelData: appState.modelData, // Pass phone model data with physical dimensions
        placedStickers: appState.placedStickers, // Pass stickers to be rendered
        textElements: appState.textElements || [] // Pass text elements for multi-text support
      })
      
      console.log('✅ Final image composed successfully')
      
      // Upload final composed image to server
      const uploadResult = await uploadFinalImage(finalImageData, template)
      
      let finalImageUrl = finalImageData // Fallback to local blob URL
      let imageSessionId = null
      
      if (uploadResult && uploadResult.success) {
        console.log('✅ Final image uploaded successfully')
        console.log('📄 Public URL:', uploadResult.public_url)
        finalImageUrl = uploadResult.public_url // Use the permanent URL
        imageSessionId = uploadResult.session_id
      } else {
        console.warn('⚠️ Final image upload failed, continuing with local image')
      }
      
      // Preserve original query parameters (keeps device_id & session data in URL for refresh safety)
      const search = window.location.search || ''
      navigate('/payment' + search, {
        state: {
          designImage: finalImageUrl, // Use permanent URL if available, fallback to blob URL
          finalImagePublicUrl: uploadResult?.public_url || finalImageUrl, // Store separately for Chinese API with fallback
          imageSessionId: imageSessionId, // For tracking
          uploadedImages,
          imageTransforms,
          inputText,
          selectedFont,
          fontSize,
          selectedTextColor,
          selectedBackgroundColor,
          textPosition,
          transform: initialTransform,
          template,
          stripCount,
          deviceId // pass through explicitly so PaymentScreen can still read it even if query params are lost
        }
      })
      
    } catch (error) {
      console.error('❌ Error creating final image:', error)
      // Fallback to original behavior if composition fails
      const search = window.location.search || ''
      navigate('/payment' + search, {
        state: {
          designImage: uploadedImage, // Fallback to original image
          finalImagePublicUrl: uploadedImage, // Provide fallback for Chinese API
          uploadedImages,
          imageTransforms,
          inputText,
          selectedFont,
          fontSize,
          selectedTextColor,
          selectedBackgroundColor,
          textPosition,
          transform: initialTransform,
          template,
          stripCount,
          deviceId
        }
      })
    } finally {
      // CRITICAL FIX: Always reset loading state to prevent UI lock
      setIsProcessingImage(false)
      uploadInProgressRef.current = false
    }
  }

  const API_BASE_URL = environment.apiBaseUrl

  const uploadFinalImage = async (finalImageData, template) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/upload-final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          template_id: template?.id || 'classic',
          final_image_data: finalImageData,
          metadata: JSON.stringify({
            inputText,
            selectedFont,
            fontSize,
            selectedTextColor,
            selectedBackgroundColor,
            textPosition,
            uploadTimestamp: new Date().toISOString()
          })
        })
      })
      
      if (!response.ok) {
        console.error('Final image upload failed:', response.status, await response.text())
        return false
      }
      
      const result = await response.json()
      console.log('Final image upload result:', result)
      
      // Return both success status and the image data for tracking
      return {
        success: true,
        public_url: result.public_url,
        filename: result.filename,
        session_id: result.session_id
      }
      
    } catch (error) {
      console.error('Error uploading final image:', error)
      return false
    }
  }

  const getPreviewStyle = () => {
    const fonts = availableFonts
    return {
      fontFamily: fonts.find(f => f.name === selectedFont)?.style || 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: selectedTextColor || '#ffffff',
      whiteSpace: 'nowrap',
      fontWeight: '500',
      lineHeight: '1.2'
    }
  }

  const getTextStyle = () => ({
    position: 'absolute',
    left: `${textPosition?.x || 50}%`,
    top: `${textPosition?.y || 50}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  })

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
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
          Background Colour
        </h1>
        <div className="w-12 h-12"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Phone Case Preview */}
        <div className="relative mb-8">
          {template?.id?.startsWith('film-strip') ? (
            <div className="relative w-[525px] h-[525px] overflow-hidden pointer-events-none">
              {/* Background color layer for film strip - using proper film strip constraints */}
              <div
                className="absolute z-5"
                style={{ 
                  backgroundColor: selectedBackgroundColor,
                  top: '2%',
                  bottom: '2%',
                  left: '28%',
                  right: '28%',
                  borderRadius: '16px'
                }}
              ></div>
              
              {/* Images container */}
              <div
                className="absolute inset-0 flex flex-col justify-center items-center z-10"
                style={{ 
                  paddingTop:'0px', 
                  paddingBottom:'0px', 
                  paddingLeft:'180px', 
                  paddingRight:'180px'
                }}
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
              
              {/* Film strip case overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <img src="/filmstrip-case.png" alt="Film strip case" className="w-full h-full object-contain" />
              </div>
              
              {/* Text overlay for film strip - positioned above everything */}
              {inputText && (
                <div 
                  className="absolute z-30 pointer-events-none"
                  style={{
                    left: `${textPosition?.x || 50}%`,
                    top: `${textPosition?.y || 50}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <p style={getPreviewStyle()}>{inputText}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-72 h-[480px]">
              {/* Phone Back Image - Base layer */}
              <div className="absolute inset-0">
                <img
                  src={`${import.meta.env.BASE_URL}Phone backs/iphone15.png`}
                  alt="Phone back"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Background color layer with mask */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <mask id="bgColorMask">
                    <image
                      href={`${import.meta.env.BASE_URL}masks/iphone15's mask.png`}
                      x="8%"
                      y="0"
                      width="85%"
                      height="100%"
                      preserveAspectRatio="none"
                    />
                  </mask>
                </defs>
                <foreignObject width="100%" height="100%" mask="url(#bgColorMask)">
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: selectedBackgroundColor }}
                  />
                </foreignObject>
              </svg>

              {/* User's uploaded image content - Masked using SVG mask */}
              {(uploadedImages && uploadedImages.length > 0) || uploadedImage ? (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <mask id="userImageMask">
                      <image
                        href={`${import.meta.env.BASE_URL}masks/iphone15's mask.png`}
                        x="8%"
                        y="0"
                        width="85%"
                        height="100%"
                        preserveAspectRatio="none"
                      />
                    </mask>
                  </defs>
                  <foreignObject width="100%" height="100%" mask="url(#userImageMask)">
                    <div className="w-full h-full" style={{ pointerEvents: 'auto' }}>
                      {uploadedImages && uploadedImages.length > 0 ? (
                        // Multi-image layouts
                        <div className="w-full h-full overflow-hidden">
                          {uploadedImages.length === 4 ? (
                            <div className="w-full h-full flex flex-wrap">
                              {uploadedImages.map((img, idx) => (
                                <div key={idx} className="w-1/2 h-1/2 overflow-hidden">
                                  <img
                                    src={img}
                                    alt={`design ${idx+1}`}
                                    className="w-full h-full object-cover"
                                    style={{
                                      transform: imageTransforms && imageTransforms[idx]
                                        ? `translate(${imageTransforms[idx].x}%, ${imageTransforms[idx].y}%) scale(${imageTransforms[idx].scale})`
                                        : 'translate(0%, 0%) scale(1)',
                                      transformOrigin: 'center center'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col">
                              {uploadedImages.map((img, idx) => (
                                <div key={idx} className="flex-1 overflow-hidden">
                                  <img
                                    src={img}
                                    alt={`design ${idx+1}`}
                                    className="w-full h-full object-cover"
                                    style={{
                                      transform: imageTransforms && imageTransforms[idx]
                                        ? `translate(${imageTransforms[idx].x}%, ${imageTransforms[idx].y}%) scale(${imageTransforms[idx].scale})`
                                        : 'translate(0%, 0%) scale(1)',
                                      transformOrigin: 'center center'
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : uploadedImage ? (
                        <img
                          src={uploadedImage}
                          alt="Uploaded design"
                          className="w-full h-full object-cover"
                          style={imageTransforms && imageTransforms[0] ? {
                            transform: `translate(${imageTransforms[0].x}%, ${imageTransforms[0].y}%) scale(${imageTransforms[0].scale})`,
                            transformOrigin: 'center center'
                          } : initialTransform ? {
                            transform: `translate(${initialTransform.x}%, ${initialTransform.y}%) scale(${initialTransform.scale})`,
                            transformOrigin: 'center center'
                          } : undefined}
                        />
                      ) : null}
                    </div>
                  </foreignObject>
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center text-gray-400">
                    <Type size={48} className="mx-auto mb-3" />
                    <p className="text-sm">Your design here</p>
                  </div>
                </div>
              )}

              {/* Text overlay preview - highest layer for user content */}
              {inputText && (
                <div className="absolute z-15" style={getTextStyle()}>
                  <p style={getPreviewStyle()}>{inputText}</p>
                </div>
              )}
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
            Background Color
          </div>
        </div>

        {/* Control Buttons Row */}
        {uploadedImages && uploadedImages.length > 0 && (
          <div className="flex items-center justify-center space-x-3 mb-6">
            <button onClick={zoomOutImg} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ZoomOut size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={zoomInImg} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ZoomIn size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={resetTransform} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <RefreshCw size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={moveRight} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ArrowForward size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={moveLeft} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ArrowLeft size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={moveDown} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ArrowDown size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
            <button onClick={moveUp} disabled={!hasImage} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${hasImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}>
              <ArrowUp size={20} className={hasImage ? 'text-gray-700' : 'text-gray-400'} />
            </button>
          </div>
        )}

        {/* Horizontal Color Slider */}
        <div className="w-full mb-8">
          <div className="relative">
            <div className="color-slider flex space-x-3 px-4 py-2 overflow-x-auto">
              {colors.map((colorOption, index) => (
                <button
                  key={colorOption.value}
                  onClick={() => setSelectedBackgroundColor(colorOption.value)}
                  className={`
                    color-option w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${colorOption.bg}
                    ${selectedBackgroundColor === colorOption.value
                      ? 'border-gray-800 scale-125'
                      : `${colorOption.border} hover:scale-110 active:scale-95`}
                  `}
                  title={colorOption.name}
                  style={{
                    minWidth: '2.5rem',
                    marginRight: index === colors.length - 1 ? '1rem' : '0'
                  }}
                />
              ))}
            </div>

            {/* Scroll Indicators */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-6 h-12 bg-gradient-to-r from-white/80 to-transparent pointer-events-none rounded-r-full"></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-6 h-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none rounded-l-full"></div>
          </div>

          {/* Scroll hint */}
          <p className="text-center text-xs text-gray-500 mt-2">
            Slide to see more colors →
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={handleNext}
          disabled={isProcessingImage}
          className={`px-8 py-3 rounded-2xl transition-transform ${
            isProcessingImage
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white active:scale-95'
          }`}
          style={{
            fontSize: '16px',
            fontWeight: '300'
          }}
        >
          {isProcessingImage ? '...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

export default BackgroundColorSelectionScreen 

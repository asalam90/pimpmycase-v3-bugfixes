import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { enhanceImage } from '../utils/imageEnhancer'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import KonvaCanvasEditor from '../components/KonvaCanvasEditor'
import PhoneModelSelector from '../components/PhoneModelSelector'
import aiImageService from '../services/aiImageService'
import { formatModelName } from '../utils/phoneCaseLayout'

const PhonePreviewScreen = ({ useKonvaEditor = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState, actions } = useAppState()
  const { brand: locationBrand, model: locationModel, color: locationColor, template, selectedModelData: locationSelectedModelData, deviceId } = location.state || {}

  // Fallback to appState if location.state is empty
  const brand = locationBrand || appState.brand
  const model = locationModel || appState.model
  const color = locationColor || appState.color
  const selectedModelData = locationSelectedModelData || appState.modelData

  // Use centralized state for uploaded images and transforms
  const uploadedImage = appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null
  const [localUploadedImage, setLocalUploadedImage] = useState(uploadedImage)

  // Use centralized transform state with zoomed out initial view
  const transform = appState.transform || { x: 0, y: 0, scale: 0.8 }

  // Model selection state (from DesignPreviewScreen)
  const [allModels, setAllModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const dropdownRef = useRef(null)

  // CRITICAL: Sync single transform to imageTransforms array for other screens
  useEffect(() => {
    // Keep imageTransforms in sync with transform for single-image templates
    if (transform && (!appState.imageTransforms?.length || appState.imageTransforms.length === 1)) {
      actions.setImageTransforms([transform])
    }
  }, [transform.x, transform.y, transform.scale])

  // Load models from Chinese API (from DesignPreviewScreen)
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Get brands from Chinese API
        const brandsResult = await aiImageService.getChineseBrands()
        if (!brandsResult.success) {
          throw new Error('Failed to load brands from Chinese API')
        }

        // Get both Apple and Samsung brands
        const appleBrand = brandsResult.brands.find(b => {
          const eName = b.e_name?.toLowerCase()
          return eName === 'apple' || eName === 'iphone' || b.name === '苹果' || b.name === 'iPhone'
        })

        const samsungBrand = brandsResult.brands.find(b => {
          const eName = b.e_name?.toLowerCase()
          return eName === 'samsung' || b.name === '三星' || b.name === 'Samsung'
        })

        const allModelsList = []

        // Load Apple models
        if (appleBrand) {
          const appleModelsResult = await aiImageService.getPhoneModels(appleBrand.id)
          if (appleModelsResult.success && appleModelsResult.models.length) {
            const appleModels = appleModelsResult.models.map(m => ({
              mobile_model_id: m.mobile_model_id,
              mobile_shell_id: m.mobile_shell_id,
              model_name: m.model_name || m.mobile_model_name,
              brand_name: 'APPLE',
              price: m.price || 35.00,
              width: m.dimensions?.width || m.width,
              height: m.dimensions?.height || m.height,
              stock: m.stock,
              chinese_brand_id: appleBrand.id
            }))
            allModelsList.push(...appleModels)
          }
        }

        // Load Samsung models
        if (samsungBrand) {
          const samsungModelsResult = await aiImageService.getPhoneModels(samsungBrand.id)
          if (samsungModelsResult.success && samsungModelsResult.models.length) {
            const samsungModels = samsungModelsResult.models.map(m => ({
              mobile_model_id: m.mobile_model_id,
              mobile_shell_id: m.mobile_shell_id,
              model_name: m.model_name || m.mobile_model_name,
              brand_name: 'SAMSUNG',
              price: m.price || 35.00,
              width: m.dimensions?.width || m.width,
              height: m.dimensions?.height || m.height,
              stock: m.stock,
              chinese_brand_id: samsungBrand.id
            }))
            allModelsList.push(...samsungModels)
          }
        }

        if (allModelsList.length === 0) {
          throw new Error('No models available from Chinese API')
        }

        // Sort models: iPhones latest to oldest, then Samsung latest to oldest
        const sortedModels = allModelsList.sort((a, b) => {
          // First, group by brand (Apple first, Samsung second)
          if (a.brand_name !== b.brand_name) {
            return a.brand_name === 'APPLE' ? -1 : 1
          }

          // Within same brand, sort by model version (latest to oldest)
          // Extract number from model name (e.g., "iPhone 15" -> 15, "Galaxy S24" -> 24)
          const extractNumber = (modelName) => {
            const match = modelName?.match(/(\d+)/)
            return match ? parseInt(match[1], 10) : 0
          }

          const aNum = extractNumber(a.model_name)
          const bNum = extractNumber(b.model_name)

          // Sort descending (latest first)
          return bNum - aNum
        })

        setAllModels(sortedModels)

        // Set initial selected model to iPhone 17 Pro Max or first available
        const iPhone17ProMax = sortedModels.find(m => m.model_name?.includes('iPhone 17 Pro Max'))
        const initialModel = iPhone17ProMax || sortedModels[0]
        const modelWithPrice = {
          ...initialModel,
          price: initialModel.price || 35.00
        }
        setSelectedModel(modelWithPrice)

        // CRITICAL: Update appState with full model data including width/height
        console.log('✅ PhonePreview - Setting initial model with dimensions:', {
          model: modelWithPrice.model_name,
          width: modelWithPrice.width,
          height: modelWithPrice.height
        })
        actions.setPhoneSelection(
          modelWithPrice.brand_name,
          modelWithPrice.model_name,
          modelWithPrice
        )
      } catch (error) {
        console.error('Error loading models from Chinese API:', error)
        // No fallback - let the error be visible
        setSelectedModel(null)
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadModels()
  }, [])

  // Close dropdown when clicking outside (from DesignPreviewScreen)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Calculate model-specific dimensions from Chinese API data (memoized to prevent excessive logging)
  const modelDimensions = useMemo(() => {
    // CRITICAL: Prioritize appState.modelData (fresh from Chinese API) over selectedModelData (stale from navigation)
    const modelData = appState.modelData || selectedModelData

    if (modelData?.width && modelData?.height) {
      // Convert millimeters to pixels at 96 DPI (standard web resolution)
      // 1 inch = 25.4 mm, 96 pixels per inch
      const mmToPixels = (mm) => (mm / 25.4) * 96

      const widthPx = mmToPixels(modelData.width)
      const heightPx = mmToPixels(modelData.height)

      // Apply same scaling factors as before to maintain UI proportions
      const containerWidth = widthPx * 0.84  // 8% margins on each side
      const containerHeight = heightPx * 0.98 // 1px margins top/bottom

      // Log once when dimensions are calculated
      console.log(`📐 Using model-specific dimensions: ${modelData.width}mm x ${modelData.height}mm = ${widthPx.toFixed(1)}px x ${heightPx.toFixed(1)}px`)
      return { containerWidth, containerHeight, widthPx, heightPx }
    } else {
      // Chinese API data should be available - log error if missing
      console.error('❌ Chinese API dimensions missing from modelData:', modelData)
      console.error('❌ This will cause image cropping and incorrect preview proportions')

      // No fallback - return null to indicate missing data
      return null
    }
  }, [appState.modelData, selectedModelData])

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        const processed = await enhanceImage(file)

        // Update centralized state
        if (appState.uploadedImages.length > 0) {
          // Replace existing image
          actions.removeImage(0)
        }
        actions.addImage(processed)
        setLocalUploadedImage(processed)
        
        // Calculate auto-fit scale based on image dimensions and standard phone size (200x333)
        const img = new Image()
        img.onload = () => {
          const containerWidth = 200
          const containerHeight = 333

          const scaleX = containerWidth / img.width
          const scaleY = containerHeight / img.height

          // For uploads, use larger scale to ensure mask is completely filled
          const autoScale = Math.max(scaleX, scaleY)

          // Multiply by 2.5 and ensure minimum of 2.5 to fill the mask area
          const finalScale = Math.max(autoScale * 2.5, 2.5)

          // Update centralized state
          actions.setTransform({ x: 0, y: 0, scale: finalScale })
        }
        img.src = processed
      } catch (err) {
        console.error('Image processing failed', err)
      }
    }
  }

  // Use standard phone dimensions matching other screens (200x333 ratio)
  const previewWidth = 288
  const previewHeight = 480
  const imageSource = localUploadedImage || uploadedImage

  const handleBack = () => {
    // Clear uploaded images and stickers when going back
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }
    actions.clearStickers()

    navigate('/template-selection', {
      state: {
        brand,
        model,
        color,
        selectedModelData,
        deviceId
      }
    })
  }

  const handleNext = () => {
    // Use centralized transform state for all navigation
    const currentTransform = appState.transform
    const currentImageTransforms = appState.imageTransforms.length > 0
      ? appState.imageTransforms
      : [currentTransform]

    console.log('🔍 PhonePreview handleNext - template:', template)
    console.log('🔍 Template ID:', template?.id)

    if (template?.id === 'retro-remix') {
      navigate('/retro-remix', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.id === 'funny-toon' || template?.id === 'toonify') {
      navigate('/funny-toon', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.id === 'footy-fan') {
      navigate('/footy-fan', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.id === 'glitch-pro') {
      navigate('/glitch', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.id === 'cover-shoot') {
      navigate('/cover-shoot', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.id?.startsWith('film-strip')) {
      navigate('/film-strip', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else if (template?.imageCount && template.imageCount > 1) {
      navigate('/multi-image-upload', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId
        }
      })
    } else {
      // Classic template - go to stickers screen
      navigate('/add-stickers', {
        state: {
          brand,
          model,
          color,
          template,
          uploadedImages: appState.uploadedImages,
          transform: currentTransform,
          imageTransforms: currentImageTransforms,
          selectedModelData,
          deviceId,
          imageMode: 'full-background'
        }
      })
    }
  }

  const resetInputs = () => {
    // Clear from centralized state
    if (appState.uploadedImages.length > 0) {
      actions.removeImage(0)
    }
    setLocalUploadedImage(null)
    resetTransform()
  }

  const getColorClass = (colorId) => {
    const colorMap = {
      black: 'bg-gray-900',
      white: 'bg-gray-100',
      blue: 'bg-blue-500',
      pink: 'bg-pink-400',
      green: 'bg-green-600'
    }
    return colorMap[colorId] || 'bg-gray-900'
  }

  /* --------------------------------------------------------------------
   * IMAGE TRANSFORM HELPERS - Using centralized state
   * ------------------------------------------------------------------*/
  const moveLeft = () => {
    const currentX = transform?.x || 0
    actions.setTransform({ x: Math.max(currentX - 5, -50), y: transform?.y || 0, scale: transform?.scale || 1.0 })
  }
  const moveRight = () => {
    const currentX = transform?.x || 0
    actions.setTransform({ x: Math.min(currentX + 5, 50), y: transform?.y || 0, scale: transform?.scale || 1.0 })
  }
  const moveUp = () => {
    const currentY = transform?.y || 0
    actions.setTransform({ x: transform?.x || 0, y: Math.max(currentY - 5, -50), scale: transform?.scale || 1.0 })
  }
  const moveDown = () => {
    const currentY = transform?.y || 0
    actions.setTransform({ x: transform?.x || 0, y: Math.min(currentY + 5, 50), scale: transform?.scale || 1.0 })
  }
  const zoomIn = () => {
    const currentScale = transform?.scale || 1.0
    actions.setTransform({ x: transform?.x || 0, y: transform?.y || 0, scale: Math.min(currentScale + 0.1, 5) })
  }
  const zoomOut = () => {
    const currentScale = transform?.scale || 1.0
    actions.setTransform({ x: transform?.x || 0, y: transform?.y || 0, scale: Math.max(currentScale - 0.1, 0.5) })
  }
  const resetTransform = () => actions.setTransform({ x: 0, y: 0, scale: 0.8 })

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        {/* Back Arrow */}
        <button
          onClick={handleBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            transition: 'all 150ms ease-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="w-12 h-12"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Premium Phone Model Selector */}
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '20px', zIndex: 9999 }}>
          <PhoneModelSelector
            models={allModels}
            selectedModel={selectedModel}
            onSelect={(model) => {
              setSelectedModel(model)
              actions.setPhoneSelection(model.brand_name, model.model_name, model)
            }}
            isLoading={isLoadingModels}
          />
        </div>

        {/* Phone Case Preview */}
        <div className="relative mb-8">
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
            {useKonvaEditor ? (
              /* Konva Canvas Editor - Direct manipulation with transform handles */
              <KonvaCanvasEditor
                initialImage={appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null}
                phoneModel={selectedModel?.model_name || selectedModelData?.model_name || model}
                containerWidth={250}
                containerHeight={416}
                onExport={(dataUrl) => {
                  // Handle export - save to appState for use in subsequent screens
                  console.log('Canvas exported:', dataUrl?.substring(0, 50))
                }}
                onTransformChange={(newTransform) => {
                  // Sync Konva transform to AppState for other screens
                  if (newTransform) {
                    actions.setTransform({
                      x: newTransform.x || 0,
                      y: newTransform.y || 0,
                      scale: newTransform.scale || 1.0
                    })
                  }
                }}
              />
            ) : (
              /* Legacy MaskedPhoneDisplay with button controls */
              <>
                <MaskedPhoneDisplay
                  image={appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null}
                  transform={transform}
                  width={250}
                  height={416}
                  modelName={selectedModel?.model_name || selectedModelData?.model_name || model}
                >
                  {!(appState.uploadedImages.length > 0) && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 text-gray-400">
                      <div className="text-center">
                        <Upload size={48} className="mx-auto" />
                      </div>
                    </div>
                  )}
                </MaskedPhoneDisplay>

                {!(appState.uploadedImages.length > 0) && (
                  <div className="absolute inset-0 z-20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="phone-upload-input"
                    />
                    <label htmlFor="phone-upload-input" className="w-full h-full block cursor-pointer" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Control Buttons Row - Only show for legacy editor */}
        {!useKonvaEditor && (
          <div className="flex items-center justify-center gap-2.5 mb-6 px-4">
            {[
              { Icon: ZoomOut, action: zoomOut },
              { Icon: ZoomIn, action: zoomIn },
              { Icon: RefreshCw, action: resetTransform },
              { Icon: ArrowRight, action: moveRight },
              { Icon: ArrowLeft, action: moveLeft },
              { Icon: ArrowDown, action: moveDown },
              { Icon: ArrowUp, action: moveUp },
            ].map(({ Icon, action }, idx) => (
              <button
                key={idx}
                onClick={action}
                disabled={!(localUploadedImage || uploadedImage)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${(localUploadedImage || uploadedImage) ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
              >
                <Icon size={20} className={(localUploadedImage || uploadedImage) ? 'text-gray-700' : 'text-gray-400'} />
              </button>
            ))}
          </div>
        )}

        {/* Upload Image Button */}
        <div className="w-full max-w-xs mb-4 flex justify-center">
          <label style={{ display: 'block', width: '200px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '200px',
                padding: '8px 22px',
                backgroundColor: 'transparent',
                border: '1px solid #000000',
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#000000'
              }}
            >
              <span style={{
                fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                fontWeight: '500',
                color: '#000000',
                letterSpacing: '0.5px',
                transition: 'color 200ms ease-out'
              }}>
                Upload Image
              </span>
            </div>
          </label>
        </div>

        {/* Reset Inputs Button */}
        {(localUploadedImage || uploadedImage) && (
          <div className="w-full max-w-xs mb-4 flex justify-center">
            <button
              onClick={resetInputs}
              style={{
                width: '200px',
                padding: '8px 22px',
                backgroundColor: 'transparent',
                border: '1px solid #000000',
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#000000'
              }}
            >
              <span style={{
                fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                fontWeight: '500',
                color: '#000000',
                letterSpacing: '0.5px',
                transition: 'color 200ms ease-out'
              }}>
                Reset Inputs
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="relative z-10 p-6 flex justify-center">
        {(template?.id?.startsWith('film-strip') || (template?.imageCount && template.imageCount > 1) || localUploadedImage || uploadedImage) ? (
          <button
            onClick={handleNext}
            style={{
              width: '200px',
              padding: '8px 22px',
              backgroundColor: 'transparent',
              border: '1px solid #000000',
              borderRadius: '100px',
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#000000'
              const span = e.currentTarget.querySelector('span')
              if (span) span.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              const span = e.currentTarget.querySelector('span')
              if (span) span.style.color = '#000000'
            }}
          >
            <span style={{
              fontSize: '11px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '500',
              color: '#000000',
              letterSpacing: '0.5px',
              transition: 'color 200ms ease-out'
            }}>
              Submit
            </span>
          </button>
        ) : (
          <button
            disabled={true}
            style={{
              width: '200px',
              padding: '8px 22px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #CCCCCC',
              borderRadius: '100px',
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6
            }}
          >
            <span style={{
              fontSize: '11px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '500',
              color: '#999999',
              letterSpacing: '0.5px'
            }}>
              Submit
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default PhonePreviewScreen 

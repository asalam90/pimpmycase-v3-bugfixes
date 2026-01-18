import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Upload, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ArrowRight as ArrowForward, ArrowUp, ArrowDown } from 'lucide-react'
import { enhanceImage } from '../utils/imageEnhancer'
import { getPhoneModelClass, getMaskStyles, formatModelName } from '../utils/phoneCaseLayout'
import { useAppState } from '../contexts/AppStateContext'
import aiImageService from '../services/aiImageService'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const MultiImageUploadScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand, model, color, template, selectedModelData, deviceId } = location.state || {}
  const { state: appState, actions } = useAppState()
  const modelClass = getPhoneModelClass(selectedModelData?.model_name || model)
  const maskStyles = getMaskStyles(selectedModelData?.model_name || model)
  const requiredCount = template?.imageCount || 2

  // Each slot keeps src + transform data with zoomed out initial view
  const [images, setImages] = useState(
    Array(requiredCount).fill(null).map(() => ({ src: null, x: 0, y: 0, scale: 0.8 }))
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const fileInputRef = useRef(null)

  // Model selection state (from DesignPreviewScreen)
  const [allModels, setAllModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const dropdownRef = useRef(null)

  // Initialize from centralized state if available
  useEffect(() => {
    if (appState.uploadedImages?.length > 0 && appState.imageTransforms?.length > 0) {
      const initialImages = Array(requiredCount).fill(null).map((_, idx) => {
        const src = appState.uploadedImages[idx] || null
        const transform = appState.imageTransforms[idx]
        return {
          src,
          x: transform?.x || 0,
          y: transform?.y || 0,
          scale: transform?.scale || 0.8
        }
      })
      setImages(initialImages)
    }
  }, []) // Run only on mount

  // Load models from Chinese API (from DesignPreviewScreen)
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Get brands from Chinese API
        const brandsResult = await aiImageService.getChineseBrands()
        if (!brandsResult.success) {
          throw new Error('Failed to load brands from Chinese API')
        }

        // Get stock for Apple/iPhone brand (default)
        const appleBrand = brandsResult.brands.find(b => {
          const eName = b.e_name?.toLowerCase()
          return eName === 'apple' || eName === 'iphone' || b.name === '苹果' || b.name === 'iPhone'
        })
        if (!appleBrand) {
          throw new Error('Apple/iPhone brand not found in Chinese API')
        }

        const modelsResult = await aiImageService.getPhoneModels(appleBrand.id)
        if (!modelsResult.success || !modelsResult.models.length) {
          throw new Error('No models available from Chinese API')
        }

        // Map to existing data structure expected by UI
        const models = modelsResult.models.map(m => ({
          mobile_model_id: m.mobile_model_id,
          mobile_shell_id: m.mobile_shell_id,
          model_name: m.model_name || m.mobile_model_name,
          brand_name: 'APPLE',
          price: m.price || 35.00,
          width: m.dimensions?.width || m.width,
          height: m.dimensions?.height || m.height,
          stock: m.stock
        }))

        setAllModels(models)

        // Set initial selected model to iPhone 17 Pro Max or first available
        const iPhone17ProMax = models.find(m => m.model_name?.includes('iPhone 17 Pro Max'))
        const initialModel = iPhone17ProMax || models[0]
        setSelectedModel({
          ...initialModel,
          price: initialModel.price || 35.00
        })
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

  const handleBack = () => {
    // Clear uploaded images and stickers when going back
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }
    actions.clearStickers()

    navigate('/template-selection', {
      state: { brand, model, color, selectedModelData, deviceId }
    })
  }

  // Open picker for current slot
  const openPickerForCurrent = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const processed = await enhanceImage(file)
      setImages((prev) => {
        const next = [...prev]
        next[currentIdx] = { ...next[currentIdx], src: processed, scale: 0.9, x: 0, y: 0 }
        return next
      })

      // Auto-advance to next empty slot after upload
      const nextEmptyIndex = images.findIndex((img, idx) => !img.src && idx > currentIdx)
      if (nextEmptyIndex !== -1) {
        setCurrentIdx(nextEmptyIndex)
      } else {
        // If no empty slot after current, check from the beginning
        const firstEmptyIndex = images.findIndex((img) => !img.src)
        if (firstEmptyIndex !== -1 && firstEmptyIndex !== currentIdx) {
          setCurrentIdx(firstEmptyIndex)
        }
      }
    } catch (err) {
      console.error('Image processing failed', err)
    }
    e.target.value = ''
  }

  // Helper to update transform fields
  const updateCurrentImage = (delta) => {
    setImages((prev) => {
      const next = [...prev]
      const img = next[currentIdx]
      next[currentIdx] = { ...img, ...delta }
      return next
    })
  }

  // Control handlers - work on currently selected image OR the image that was just uploaded
  const getActiveImageIndex = () => {
    // Find the most recently uploaded image or current selection
    return currentIdx
  }

  const moveLeft = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      console.log('Moving left, current x:', images[activeIdx].x, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, x: Math.max(-300, img.x - 10) }
        return next
      })
    }
  }
  const moveRight = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      console.log('Moving right, current x:', images[activeIdx].x, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, x: Math.min(300, img.x + 10) }
        return next
      })
    }
  }
  const moveUp = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      console.log('Moving up, current y:', images[activeIdx].y, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, y: Math.max(-300, img.y - 10) }
        return next
      })
    }
  }
  const moveDown = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      console.log('Moving down, current y:', images[activeIdx].y, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, y: Math.min(300, img.y + 10) }
        return next
      })
    }
  }
  const zoomInImg = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      const currentScale = images[activeIdx].scale || 1.0
      console.log('Zooming in, current scale:', currentScale, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, scale: Math.min(5, currentScale + 0.2) }
        return next
      })
    }
  }
  const zoomOutImg = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      const currentScale = images[activeIdx].scale || 1.0
      console.log('Zooming out, current scale:', currentScale, 'for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        const img = next[activeIdx]
        next[activeIdx] = { ...img, scale: Math.max(0.1, currentScale - 0.2) }
        return next
      })
    }
  }
  const resetTransform = () => {
    const activeIdx = getActiveImageIndex()
    if (images[activeIdx]?.src) {
      console.log('Resetting transform for image', activeIdx)
      setImages((prev) => {
        const next = [...prev]
        next[activeIdx] = { ...next[activeIdx], x: 0, y: 0, scale: 0.8 }
        return next
      })
    }
  }

  const resetImages = () => setImages(Array(requiredCount).fill(null).map(() => ({ src: null, x: 0, y: 0, scale: 0.8 })))

  const createCompositeImage = async () => {
    return new Promise((resolve, reject) => {
      // Create a canvas that matches phone case dimensions
      const canvas = document.createElement('canvas')
      const canvasWidth = 1000
      const canvasHeight = 2000
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext('2d')

      // Fill background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      let loadedCount = 0
      const imagesToLoad = images.filter(img => img.src).length

      if (imagesToLoad === 0) {
        resolve(canvas.toDataURL('image/png'))
        return
      }

      // Load all images
      images.forEach((imgData, idx) => {
        if (!imgData.src) return

        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          // Calculate position and size based on layout
          let slotX, slotY, slotW, slotH

          if (requiredCount === 4) {
            // 2x2 grid
            const col = idx % 2
            const row = Math.floor(idx / 2)
            slotW = canvasWidth / 2
            slotH = canvasHeight / 2
            slotX = col * slotW
            slotY = row * slotH
          } else {
            // Vertical layout (2-in-1 or 3-in-1)
            slotW = canvasWidth
            slotH = canvasHeight / requiredCount
            slotX = 0
            slotY = idx * slotH
          }

          // Save context
          ctx.save()

          // Clip to slot area
          ctx.beginPath()
          ctx.rect(slotX, slotY, slotW, slotH)
          ctx.clip()

          // Calculate object-contain dimensions (fit entire image within slot, no cropping)
          const imgAspect = img.width / img.height
          const slotAspect = slotW / slotH

          let baseWidth, baseHeight
          if (imgAspect > slotAspect) {
            // Image is wider - fit width
            baseWidth = slotW
            baseHeight = slotW / imgAspect
          } else {
            // Image is taller - fit height
            baseHeight = slotH
            baseWidth = slotH * imgAspect
          }

          // Apply user's scale transform
          const finalWidth = baseWidth * imgData.scale
          const finalHeight = baseHeight * imgData.scale

          // Calculate center position in slot
          const centerX = slotX + slotW / 2
          const centerY = slotY + slotH / 2

          // Apply position offset as percentage of SCALED image size (to match CSS transform behavior)
          // CSS: scale(s) translate(x%, y%) means translate is in scaled space
          const offsetX = (imgData.x / 100) * finalWidth
          const offsetY = (imgData.y / 100) * finalHeight

          // Final draw position (centered + offset)
          const drawX = centerX - finalWidth / 2 + offsetX
          const drawY = centerY - finalHeight / 2 + offsetY

          // Draw image
          ctx.drawImage(img, drawX, drawY, finalWidth, finalHeight)

          // Restore context (removes clip)
          ctx.restore()

          // Draw border between images
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 4
          ctx.strokeRect(slotX, slotY, slotW, slotH)

          loadedCount++
          if (loadedCount === imagesToLoad) {
            resolve(canvas.toDataURL('image/png'))
          }
        }

        img.onerror = () => {
          reject(new Error(`Failed to load image ${idx}`))
        }

        img.src = imgData.src
      })
    })
  }

  const handleNext = async () => {
    try {
      // Extract image sources and transforms from the images array
      const uploadedImages = images.map(img => img.src)
      const imageTransforms = images.map(img => ({ x: img.x, y: img.y, scale: img.scale }))

      // Store multi-image array in centralized state (preserves exact zoom/pan per image)
      actions.setImages(uploadedImages)
      actions.setImageTransforms(imageTransforms)

      // Navigate to stickers screen with multi-image array (not composite)
      // This ensures exact same rendering as preview
      navigate('/add-stickers', {
        state: {
          brand,
          model,
          color,
          template,
          selectedModelData,
          deviceId,
          uploadedImages,
          imageTransforms,
          imageMode: 'multi-image'
        }
      })
    } catch (error) {
      console.error('Failed to process images:', error)
      alert('Failed to process images. Please try again.')
    }
  }

  const filledCount = images.filter((i) => i.src).length
  const canSubmit = filledCount === requiredCount

  const goPrev = () => setCurrentIdx((prev) => Math.max(0, prev - 1))
  const goNext = () => setCurrentIdx((prev) => Math.min(requiredCount - 1, prev + 1))

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
        {/* Model Name Dropdown in Transparent Capsule (from DesignPreviewScreen) */}
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '30px', zIndex: 9999 }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoadingModels}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'transparent',
              border: '1px solid #000000',
              borderRadius: '24px',
              padding: '12px 32px',
              cursor: isLoadingModels ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease-out'
            }}
          >
            <span style={{
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
              fontSize: '16px',
              fontWeight: '700',
              color: '#000000',
              letterSpacing: '0.5px'
            }}>
              {isLoadingModels ? 'Loading...' : formatModelName(selectedModel?.model_name)}
            </span>
            {!isLoadingModels && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease-out'
                }}
              >
                <path d="M6 9L12 15L18 9" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              backgroundColor: '#fdfdfd',
              border: '2px solid #000000',
              borderRadius: '16px',
              maxHeight: '300px',
              width: '280px',
              overflowY: 'auto',
              zIndex: 10000,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
            }}>
              {allModels.map((model, index) => (
                <button
                  key={model.mobile_model_id || index}
                  onClick={() => {
                    setSelectedModel(model)
                    setShowDropdown(false)
                    // Update appState
                    actions.setPhoneSelection(model.brand_name, model.model_name, model)
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    border: 'none',
                    borderBottom: index < allModels.length - 1 ? '1px solid #E5E5E5' : 'none',
                    backgroundColor: '#fdfdfd',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 150ms ease-out',
                    borderRadius: index === 0 ? '16px 16px 0 0' : index === allModels.length - 1 ? '0 0 16px 16px' : '0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5F5F5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                >
                  <div style={{
                    fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#000000',
                    marginBottom: '4px'
                  }}>
                    {formatModelName(model.model_name)}
                  </div>
                  <div style={{
                    fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                    fontSize: '12px',
                    color: '#666666'
                  }}>
                    {model.brand_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative mb-6">
          {/* Phone mockup using MaskedPhoneDisplay */}
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
              image={images.map(img => img.src)}
              transform={images.map(img => ({ x: img.x, y: img.y, scale: img.scale }))}
              width={250}
              height={416}
              modelName={selectedModel?.model_name || selectedModelData?.model_name || model}
            >
              {/* Overlay for all slots - clickable to select */}
              {requiredCount === 4 ? (
                <div className="w-full h-full flex flex-wrap">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-1/2 h-1/2 flex items-center justify-center relative"
                      style={{
                        backgroundColor: !img.src ? '#F9FAFB' : 'transparent',
                        border: currentIdx === idx ? '2px solid #3B82F6' : '2px solid transparent',
                        boxSizing: 'border-box'
                      }}
                    >
                      {!img.src && <Upload size={24} className="text-gray-400" />}
                      <div
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentIdx(idx)
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex items-center justify-center relative"
                      style={{
                        backgroundColor: !img.src ? '#F9FAFB' : 'transparent',
                        borderColor: currentIdx === idx ? '#3B82F6' : '#000000',
                        borderStyle: 'solid',
                        borderTopWidth: idx === 0 ? '0' : '2px',
                        borderBottomWidth: idx === requiredCount - 1 ? '0' : '2px',
                        borderLeftWidth: currentIdx === idx ? '2px' : '0',
                        borderRightWidth: currentIdx === idx ? '2px' : '0',
                        boxSizing: 'border-box'
                      }}
                    >
                      {!img.src && <Upload size={24} className="text-gray-400" />}
                      <div
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentIdx(idx)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </MaskedPhoneDisplay>
          </div>
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-center gap-2.5 mb-6 px-4">
          {[
            { Icon: ZoomOut, action: zoomOutImg },
            { Icon: ZoomIn, action: zoomInImg },
            { Icon: RefreshCw, action: resetTransform },
            { Icon: ArrowForward, action: moveRight },
            { Icon: ArrowLeft, action: moveLeft },
            { Icon: ArrowDown, action: moveDown },
            { Icon: ArrowUp, action: moveUp },
          ].map(({ Icon, action }, idx) => (
            <button
              key={idx}
              onClick={action}
              disabled={!images[getActiveImageIndex()]?.src}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${images[getActiveImageIndex()]?.src ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
            >
              <Icon size={20} className={images[getActiveImageIndex()]?.src ? 'text-gray-700' : 'text-gray-400'} />
            </button>
          ))}
        </div>

        {/* Upload Image Button */}
        <div className="w-full max-w-xs mb-4 flex justify-center">
          <label style={{ display: 'block', width: '200px' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
            />
            <div
              onClick={openPickerForCurrent}
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
                textTransform: 'uppercase',
                transition: 'color 200ms ease-out'
              }}>
                Upload Image {currentIdx + 1}
              </span>
            </div>
          </label>
        </div>

        {/* Reset Inputs Button */}
        {filledCount > 0 && (
          <div className="w-full max-w-xs mb-4 flex justify-center">
            <button
              onClick={resetImages}
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
                textTransform: 'uppercase',
                transition: 'color 200ms ease-out'
              }}>
                Reset Inputs
              </span>
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {/* Submit Button */}
      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!canSubmit}
          style={{
            width: '200px',
            padding: '12px 32px',
            backgroundColor: canSubmit ? '#000000' : '#E5E5E5',
            color: canSubmit ? '#FFFFFF' : '#9CA3AF',
            border: 'none',
            borderRadius: '100px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease-out',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: '11px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            if (canSubmit) {
              e.currentTarget.style.backgroundColor = '#333333'
            }
          }}
          onMouseLeave={(e) => {
            if (canSubmit) {
              e.currentTarget.style.backgroundColor = '#000000'
            }
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default MultiImageUploadScreen 

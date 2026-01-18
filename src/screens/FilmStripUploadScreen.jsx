import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Upload, ZoomIn, ZoomOut, RefreshCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react'
import { enhanceImage } from '../utils/imageEnhancer'
import { useAppState } from '../contexts/AppStateContext'
import aiImageService from '../services/aiImageService'
import { formatModelName } from '../utils/phoneCaseLayout'

const FilmStripUploadScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState, actions } = useAppState()
  const { brand, model, color, template, stripCount, uploadedImages: incomingImages, imageTransforms: incomingTransforms, imageOrientations: incomingOrientations, selectedModelData, deviceId } = location.state || {}
  const totalSlots = stripCount || 3

  const [uploadedImages, setUploadedImages] = useState(
    incomingImages || Array(totalSlots).fill(null)
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const fileInputRef = useRef(null)
  const defaultTransform = { x: 50, y: 50, scale: 1 }
  const [imageTransforms, setImageTransforms] = useState(
    incomingTransforms || Array(totalSlots).fill(defaultTransform)
  )
  const [imageOrientations, setImageOrientations] = useState(
    incomingOrientations || Array(totalSlots).fill('unknown')
  )

  // Model selection state
  const [allModels, setAllModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const dropdownRef = useRef(null)

  // Load models from Chinese API
  useEffect(() => {
    const loadModels = async () => {
      try {
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
          if (a.brand_name !== b.brand_name) {
            return a.brand_name === 'APPLE' ? -1 : 1
          }
          const extractNumber = (modelName) => {
            const match = modelName?.match(/(\d+)/)
            return match ? parseInt(match[1], 10) : 0
          }
          const aNum = extractNumber(a.model_name)
          const bNum = extractNumber(b.model_name)
          return bNum - aNum
        })

        setAllModels(sortedModels)

        // Set initial selected model to iPhone 17 Pro Max or first available
        const iPhone17ProMax = sortedModels.find(m => m.model_name?.includes('iPhone 17 Pro Max'))
        const initialModel = iPhone17ProMax || sortedModels[0]
        setSelectedModel({
          ...initialModel,
          price: initialModel.price || 35.00
        })

        // Update app state
        actions.setPhoneSelection(
          initialModel.brand_name,
          initialModel.model_name,
          initialModel
        )
      } catch (error) {
        console.error('Error loading models from Chinese API:', error)
        setSelectedModel(null)
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadModels()
  }, [])

  // Close dropdown when clicking outside
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

  const handleModelSelect = (model) => {
    setSelectedModel(model)
    setShowDropdown(false)
    actions.setPhoneSelection(model.brand_name, model.model_name, model)
  }

  const handleBack = () => {
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }
    actions.clearStickers()
    navigate('/')
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const processed = await enhanceImage(file, { targetAspectRatio: 4 / 3 })

      setUploadedImages((prev) => {
        const next = [...prev]
        next[currentIdx] = processed
        return next
      })

      const nextEmptySlot = uploadedImages.findIndex((img, idx) => !img && idx > currentIdx)
      if (nextEmptySlot !== -1) {
        setCurrentIdx(nextEmptySlot)
      }

      setImageTransforms((prev) => {
        const next = [...prev]
        next[currentIdx] = { ...defaultTransform }
        return next
      })

      const probe = new Image()
      probe.onload = () => {
        setImageOrientations((prev) => {
          const next = [...prev]
          next[currentIdx] = probe.width >= probe.height ? 'landscape' : 'portrait'
          return next
        })
      }
      probe.src = processed
    } catch (err) {
      console.error('Image processing failed', err)
    }
    e.target.value = ''
  }

  const goPrev = () => setCurrentIdx((prev) => Math.max(0, prev - 1))
  const goNext = () => setCurrentIdx((prev) => Math.min(totalSlots - 1, prev + 1))

  const handleNext = () => {
    navigate('/add-stickers', {
      state: {
        brand: selectedModel?.brand_name,
        model: selectedModel?.model_name,
        color,
        template,
        uploadedImages,
        imageTransforms,
        stripCount,
        selectedModelData: selectedModel,
        deviceId,
        imageMode: 'full-background'
      }
    })
  }

  const resetImages = () => {
    setUploadedImages(Array(totalSlots).fill(null))
    setImageTransforms(Array(totalSlots).fill(defaultTransform))
    setImageOrientations(Array(totalSlots).fill('unknown'))
  }

  const filledCount = uploadedImages.filter((img) => img).length
  const canSubmit = filledCount === totalSlots

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val))

  const updateTransform = (idx, updater) => {
    setImageTransforms((prev) => {
      const next = [...prev]
      const current = next[idx]
      const changes = typeof updater === 'function' ? updater(current) : updater
      const updated = { ...current, ...changes }
      updated.x = clamp(updated.x, 0, 100)
      updated.y = clamp(updated.y, 0, 100)
      updated.scale = clamp(updated.scale, 1, 3)
      next[idx] = updated
      return next
    })
  }

  const moveUp = () => updateTransform(currentIdx, (t) => ({ y: t.y - 5 }))
  const moveDown = () => updateTransform(currentIdx, (t) => ({ y: t.y + 5 }))
  const moveLeft = () => updateTransform(currentIdx, (t) => ({ x: t.x - 10 }))
  const moveRight = () => updateTransform(currentIdx, (t) => ({ x: t.x + 10 }))
  const zoomIn = () => updateTransform(currentIdx, (t) => ({ scale: t.scale + 0.1 }))
  const zoomOut = () => updateTransform(currentIdx, (t) => ({ scale: t.scale - 0.1 }))
  const resetTransform = () => updateTransform(currentIdx, defaultTransform)

  const modelName = selectedModel?.model_name
  const price = selectedModel?.price ? `£${selectedModel.price.toFixed(2)}` : null

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Header with Back Button */}
      <div className="relative z-10 flex items-center justify-between p-4">
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
        {/* Model Selector - Transparent Capsule */}
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
                  key={`${model.brand_name}-${model.model_name}-${index}`}
                  onClick={() => handleModelSelect(model)}
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

        {/* Film Strip Preview */}
        <div className="relative mb-6">
          <div style={{
            position: 'relative',
            width: '250px',
            height: '416px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible'
          }}>
            {/* Phone case background */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none'
            }}>
              <img
                src="/filmstrip-case.png"
                alt="Film strip phone case"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Images container */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
              paddingTop: '60px',
              paddingBottom: '60px',
              paddingLeft: '69px',
              paddingRight: '68px'
            }}>
              {Array.from({ length: totalSlots }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '100%',
                    height: `${100 / totalSlots - 2}%`,
                    overflow: 'hidden',
                    borderRadius: '2px',
                    transition: 'all 300ms',
                    borderTop: '4px solid #000000',
                    borderBottom: '4px solid #000000',
                    borderLeft: currentIdx === idx ? '3px solid #3B82F6' : 'none',
                    borderRight: currentIdx === idx ? '3px solid #3B82F6' : 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIdx(idx)
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: uploadedImages[idx] ? '#FFFFFF' : (currentIdx === idx ? '#F0F8FF' : '#F5F5F5'),
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {uploadedImages[idx] ? (
                      <img
                        src={uploadedImages[idx]}
                        alt={`Photo ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `${imageTransforms[idx].x}% ${imageTransforms[idx].y}%`,
                          transform: `scale(${imageTransforms[idx].scale})`,
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                      }}>
                        <Upload size={20} color={currentIdx === idx ? '#4A90E2' : '#CCCCCC'} />
                        {currentIdx === idx && (
                          <p style={{
                            fontSize: '10px',
                            marginTop: '4px',
                            color: '#4A90E2',
                            fontWeight: '500',
                            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif'
                          }}>
                            Current
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <button
            onClick={zoomOut}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ZoomOut size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={zoomIn}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ZoomIn size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={resetTransform}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <RefreshCw size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={moveLeft}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ArrowLeft size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={moveRight}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ArrowRight size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={moveDown}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ArrowDown size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
          <button
            onClick={moveUp}
            disabled={!uploadedImages[currentIdx]}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImages[currentIdx] ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
          >
            <ArrowUp size={20} className={uploadedImages[currentIdx] ? "text-gray-700" : "text-gray-400"} />
          </button>
        </div>

        {/* Upload button */}
        <div className="w-full max-w-xs mb-4 flex justify-center">
          <label style={{ display: 'block', width: '200px' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
            />
            <div
              onClick={openFilePicker}
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

        {/* Show current selection info */}
        <div className="text-center text-sm text-gray-600 mb-2">
          Selected: Image {currentIdx + 1} of {totalSlots}
          {uploadedImages[currentIdx] && <span className="text-green-600"> ✓</span>}
        </div>

        {/* Progress indicator */}
        <div className="w-full max-w-xs mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{filledCount}/{totalSlots}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(filledCount / totalSlots) * 100}%` }}
            ></div>
          </div>
        </div>

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

export default FilmStripUploadScreen

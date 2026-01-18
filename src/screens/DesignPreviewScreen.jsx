import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import aiImageService from '../services/aiImageService'
import { formatModelName } from '../utils/phoneCaseLayout'

const DesignPreviewScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData: locationSelectedModelData, deviceId, imageMode, brand: locationBrand, model: locationModel, designName, isColor, fromCustomUpload } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Fallback to appState if location.state is empty
  const brand = locationBrand || appState.brand
  const model = locationModel || appState.model
  const selectedModelData = locationSelectedModelData || appState.modelData

  const [allModels, setAllModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const dropdownRef = useRef(null)

  // Load models from Chinese API
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

  const modelName = selectedModel?.model_name
  const price = selectedModel?.price ? `£${selectedModel.price.toFixed(2)}` : null
  const isMagSafeCompatible = selectedModel?.brand_name === 'APPLE'

  const handleBack = () => {
    // Clear uploaded images and stickers when going back to landing
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }
    actions.clearStickers()

    navigate('/')
  }

  const handleAddStickers = () => {
    navigate('/add-stickers', {
      state: {
        selectedModelData: selectedModel,
        deviceId,
        imageMode,
        brand: selectedModel?.brand_name,
        model: selectedModel?.model_name,
        uploadedImages: appState.uploadedImages,
        imageTransforms: appState.imageTransforms || []
      }
    })
  }

  const handleSelectTemplate = () => {
    navigate('/template-selection', {
      state: {
        selectedModelData: selectedModel,
        deviceId,
        imageMode: 'full-background',
        brand: selectedModel?.brand_name,
        model: selectedModel?.model_name
      }
    })
  }

  const handleModelSelect = (model) => {
    // Use model's price or default to £35.00
    setSelectedModel({
      ...model,
      price: model.price || 35.00
    })
    setShowDropdown(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px',
        paddingTop: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'visible'
      }}
    >
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

      {/* Heading */}
      <h2 style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        fontWeight: '500',
        color: '#666666',
        marginBottom: '16px',
        textAlign: 'center',
        letterSpacing: '-0.01em'
      }}>
        Select your model to preview
      </h2>

      {/* Model Name Dropdown in Transparent Capsule */}
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
            {isLoadingModels ? 'Loading...' : formatModelName(modelName)}
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

      {/* Phone with Background Design Overlay */}
      <div style={{
        marginBottom: '40px'
      }}>
        <div
          style={{
            width: '200px',
            height: '333px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <MaskedPhoneDisplay
            image={appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null}
            width={200}
            height={333}
            modelName={modelName}
          />
        </div>
      </div>

      {/* Add Sticker Button */}
      <button
        onClick={fromCustomUpload ? handleSelectTemplate : handleAddStickers}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '100px',
          width: '180px',
          height: '50px',
          border: '1px solid #000000',
          cursor: 'pointer',
          marginBottom: '40px',
          transition: 'all 200ms ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <span style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          color: '#000000',
          letterSpacing: '0',
          textTransform: 'uppercase'
        }}>
          {fromCustomUpload ? 'Select Template' : 'Add Stickers'}
        </span>
      </button>

      {/* Design Details */}
      <div style={{
        textAlign: 'left',
        maxWidth: '350px',
        paddingLeft: '20px'
      }}>
        {/* Design Name */}
        {designName && (
          <div style={{
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            fontSize: '18px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '12px',
            letterSpacing: '0.2px'
          }}>
            {designName}
          </div>
        )}

        {/* Model */}
        <div style={{
          fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          color: '#666666',
          marginBottom: '6px'
        }}>
          Model: {modelName}
        </div>

        {/* MagSafe Compatible */}
        {isMagSafeCompatible && (
          <div style={{
            fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '400',
            color: '#666666',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#666666" strokeWidth="2"/>
              <path d="M8 12L11 15L16 9" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            MagSafe Compatible
          </div>
        )}

        {/* Price */}
        <div style={{
          fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
          fontSize: '20px',
          fontWeight: '700',
          color: '#000000',
          marginTop: '12px'
        }}>
          {price}
        </div>
      </div>
    </div>
  )
}

export default DesignPreviewScreen

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import aiImageService from '../services/aiImageService'
import { useAppState } from '../contexts/AppStateContext'

const PhoneModelScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand: locationBrand, apiSource: locationApiSource } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Fallback to appState if location.state is empty
  const brand = locationBrand || (appState.brand ? {
    display_name: appState.brand,
    chinese_api_id: appState.modelData?.chinese_brand_id,
    name: appState.brand.toLowerCase()
  } : null)
  const apiSource = locationApiSource || 'chinese_api'
  
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // CRITICAL: No fallback models - always use real API data

  // Load models on component mount
  useEffect(() => {
    if (brand) {
      loadModels()
    } else {
      // Redirect back if no brand data
      navigate('/phone-brand')
    }
  }, [brand])

  const loadModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 PhoneModelScreen - Loading models for brand:', brand.chinese_api_id || brand.id)
      
      if (apiSource === 'chinese_api' && brand.chinese_api_id) {
        // Try Chinese API first
        const response = await aiImageService.getPhoneModels(brand.chinese_api_id)
        
        if (response.success && response.models) {
          setModels(response.models)
          // Set first available model as default
          const availableModel = response.models.find(m => m.available)
          if (availableModel) {
            setSelectedModel(availableModel.name)
          }
          console.log('✅ PhoneModelScreen - Models loaded from Chinese API')
          return
        }
      }
      
      // CRITICAL: No fallback data - API must be available for vending machine operation
      console.error('❌ PhoneModelScreen - Chinese API returned no models')
      setModels([])
      setError(`No models available for ${brand.display_name || brand.id}. Please try again or contact support.`)
      
    } catch (error) {
      console.error('❌ PhoneModelScreen - Failed to load models:', error)
      
      // CRITICAL: No fallback data - show error state instead of mock data
      console.error('❌ PhoneModelScreen - Failed to load models:', error)
      setModels([])
      setSelectedModel('')
      setError(`Failed to load models: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    const selectedModelObj = models.find(m => m.name === selectedModel)
    
    // Prepare complete model data with physical dimensions from Chinese API
    const selectedModelData = {
      brand: brand?.name?.toLowerCase() || brand?.display_name?.toLowerCase() || 'unknown',
      model: selectedModelObj?.name || selectedModelObj?.display_name,
      chinese_model_id: selectedModelObj?.chinese_model_id || selectedModelObj?.mobile_model_id || selectedModelObj?.id,
      price: selectedModelObj?.price,
      stock: selectedModelObj?.stock,
      device_id: selectedModelObj?.device_id,
      // Chinese API physical dimensions in millimeters
      width: selectedModelObj?.width ? parseFloat(selectedModelObj.width) : null,
      height: selectedModelObj?.height ? parseFloat(selectedModelObj.height) : null,
      mobile_shell_id: selectedModelObj?.mobile_shell_id
    }
    
    console.log('PhoneModelScreen - Selected model data with physical dimensions:', selectedModelData)
    
    // Validate physical dimensions from Chinese API
    if (selectedModelData.width && selectedModelData.height) {
      const physicalWidth = parseFloat(selectedModelData.width)
      const physicalHeight = parseFloat(selectedModelData.height) 
      const aspectRatio = physicalHeight / physicalWidth
      
      if (physicalWidth < 30 || physicalWidth > 200 || physicalHeight < 100 || physicalHeight > 300 || aspectRatio < 1.2 || aspectRatio > 3.0) {
        console.warn('⚠️  Unusual physical dimensions detected:', {
          width: physicalWidth,
          height: physicalHeight,
          aspectRatio: aspectRatio.toFixed(3),
          model: selectedModelData.model
        })
      } else {
        console.log('✅ Valid physical dimensions:', {
          width: physicalWidth,
          height: physicalHeight,
          aspectRatio: aspectRatio.toFixed(3)
        })
      }
    } else {
      console.warn('⚠️  No physical dimensions available for selected model:', selectedModelData.model)
    }
    
    // Save to app state for access throughout the app
    actions.setPhoneSelection(selectedModelData.brand, selectedModelData.model, selectedModelData)
    
    navigate('/template-selection', {
      state: {
        brand: brand,
        model: selectedModelObj,
        apiSource: apiSource,
        selectedModelData: selectedModelData
      }
    })
  }

  const handleBack = () => {
    navigate('/phone-brand')
  }

  // Loading state
  if (loading) {
    return (
      <div className="screen-container" style={{ background: '#fdfdfd' }}>
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          color: '#666666',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e3e3e3',
            borderTop: '4px solid #666666',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ fontSize: '24px', margin: '0', fontFamily: 'Futura Heavy, sans-serif', fontWeight: 900 }}>
            Loading {brand?.display_name} Models...
          </h2>
          <p style={{ fontSize: '16px', margin: '10px 0 0', opacity: 0.7, fontFamily: 'Futura, sans-serif', fontWeight: 300 }}>
            Getting latest inventory...
          </p>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="screen-container" style={{ background: '#fdfdfd' }}>
      {/* API Source Indicator */}
      {!error && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: apiSource === 'chinese_api' ? '#d7efd4' : '#fff2cc',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#474746',
            zIndex: 10,
            border: '1px solid rgba(71, 71, 70, 0.1)'
          }}
        >
          {apiSource === 'chinese_api' ? '🟢 Live Inventory' : '🟡 Fallback Mode'}
        </div>
      )}

      {/* Error indicator with retry */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            background: '#ffe6e6',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#cc0000',
            textAlign: 'center',
            zIndex: 10,
            border: '1px solid #ffcccc'
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            {error}
          </div>
          <button
            onClick={loadModels}
            style={{
              background: '#474746',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Back Arrow */}
        <div className="w-full flex justify-start mb-8">
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Brand Header */}
        <div className="mb-8">
          <h1
            className="text-4xl leading-tight text-center"
            style={{ fontFamily: 'Futura Heavy, sans-serif', fontWeight: 900, color: '#000000' }}
          >
            {brand?.display_name} MODELS
          </h1>
          <p className="text-lg text-center mt-2" style={{ fontFamily: 'Futura, sans-serif', fontWeight: 300, color: '#666666' }}>
            Choose your {brand?.display_name} model
          </p>
        </div>

        {/* Model Dropdown */}
        <div className="w-full max-w-sm mb-8">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full bg-white text-gray-800 font-medium py-4 px-6 rounded-2xl text-center active:scale-95 transition-transform border border-gray-300"
              style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}
            >
              {selectedModel || 'Select Model'}
              <span className="absolute right-6 top-1/2 transform -translate-y-1/2">
                {dropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-300 max-h-60 overflow-y-auto z-20">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.name)
                      setDropdownOpen(false)
                    }}
                    disabled={!model.available}
                    className={`w-full text-left px-6 py-3 hover:bg-gray-50 transition-colors ${
                      selectedModel === model.name ? 'bg-gray-100 font-semibold' : ''
                    } ${!model.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ fontFamily: 'Futura, sans-serif', fontWeight: 300 }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{model.name}</span>
                      <div className="text-sm text-gray-500">
                        {model.price ? `£${model.price}` : ''}
                        {model.stock !== undefined && (
                          <span className="ml-2">
                            {model.available ? `(${model.stock} left)` : '(Out of stock)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Model Info */}
        {selectedModel && (
          <div className="w-full max-w-sm mb-8">
            <div className="bg-white rounded-2xl p-4 border border-gray-300">
              <div className="text-center">
                <p className="text-lg font-medium text-gray-800" style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}>
                  {selectedModel}
                </p>
                <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Futura, sans-serif', fontWeight: 300 }}>
                  {brand?.display_name} • Ready to customize
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedModel}
          className={`px-8 py-3 rounded-2xl flex items-center justify-center transition-transform ${
            selectedModel
              ? 'bg-black text-white active:scale-95 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}
        >
          <span>Next</span>
        </button>
      </div>
    </div>
  )
}

export default PhoneModelScreen 
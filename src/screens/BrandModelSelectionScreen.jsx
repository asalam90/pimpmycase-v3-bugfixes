import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import environment from '../config/environment'
import { formatModelName } from '../utils/phoneCaseLayout'

const BrandModelSelectionScreen = () => {
  const navigate = useNavigate()
  const { state: appState, actions } = useAppState()
  const API_BASE_URL = environment.apiBaseUrl
  const [brands, setBrands] = useState([])
  const [brandModels, setBrandModels] = useState({}) // Store models for each brand
  const [selectedModels, setSelectedModels] = useState({}) // Store selected model for each brand
  const [openDropdowns, setOpenDropdowns] = useState({}) // Track which dropdowns are open
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadingRef = useRef(false)

  console.log('BrandModelSelectionScreen initialized')

  // Load brands and models from local database
  const loadBrandsAndModels = useCallback(async () => {
    if (loadingRef.current) {
      console.log('🚫 BrandModelSelectionScreen - Skipping API call, already loading')
      return
    }

    // Skip if we already loaded brands
    if (brands.length > 0) {
      console.log('📋 BrandModelSelectionScreen - Using loaded brands')
      return
    }

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      console.log('🔄 BrandModelSelectionScreen - Loading brands from database')

      // Fetch brands from local database
      const brandsResponse = await fetch(`${API_BASE_URL}/api/brands`)

      if (!brandsResponse.ok) {
        throw new Error(`Failed to fetch brands: ${brandsResponse.status} ${brandsResponse.statusText}`)
      }

      const brandsResult = await brandsResponse.json()

      if (!brandsResult.success) {
        throw new Error(`Brands API error: ${brandsResult.detail || 'Unknown error'}`)
      }

      console.log('✅ BrandModelSelectionScreen - Brands loaded:', brandsResult.brands)
      setBrands(brandsResult.brands)

      // Load models for all available brands
      const modelsData = {}
      const defaultSelections = {}

      for (const brand of brandsResult.brands) {
        if (brand.available) {
          try {
            const modelsResponse = await fetch(`${API_BASE_URL}/api/brands/${brand.id}/models`)
            if (modelsResponse.ok) {
              const modelsResult = await modelsResponse.json()
              if (modelsResult.success && modelsResult.models) {
                modelsData[brand.id] = modelsResult.models
                // Set first model as default selection
                if (modelsResult.models.length > 0) {
                  defaultSelections[brand.id] = modelsResult.models[0]
                }
                console.log(`✅ BrandModelSelectionScreen - Models loaded for ${brand.name}:`, modelsResult.models.length)
              }
            }
          } catch (error) {
            console.error(`❌ BrandModelSelectionScreen - Failed to load models for ${brand.name}:`, error)
          }
        }
      }

      setBrandModels(modelsData)
      setSelectedModels(defaultSelections)
      console.log('✅ BrandModelSelectionScreen - Brands and models loaded')

    } catch (error) {
      console.error('❌ BrandModelSelectionScreen - Failed to load brands:', error)
      setError(`Failed to load brands: ${error.message}`)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [brands.length])

  useEffect(() => {
    loadBrandsAndModels()
  }, [loadBrandsAndModels])

  // Toggle dropdown open/close
  const toggleDropdown = (brandId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [brandId]: !prev[brandId]
    }))
  }

  // Handle model selection and navigate immediately
  const handleModelSelect = (brandId, model) => {
    // Close dropdown
    setOpenDropdowns(prev => ({
      ...prev,
      [brandId]: false
    }))

    // Find the brand
    const selectedBrand = brands.find(brand => brand.id === brandId)

    if (!selectedBrand) {
      return
    }

    // Prepare model data
    const selectedModelData = {
      brand: selectedBrand.id,
      model: model.name || model.display_name || model.mobile_model_name,
      chinese_model_id: model.chinese_model_id || model.mobile_model_id || model.id,
      price: model.price,
      stock: model.stock,
      width: model.width ? parseFloat(model.width) : null,
      height: model.height ? parseFloat(model.height) : null,
      mobile_shell_id: model.mobile_shell_id
    }

    console.log('BrandModelSelectionScreen - Selected model data:', selectedModelData)

    actions.setPhoneSelection(selectedModelData.brand, selectedModelData.model, selectedModelData)
    navigate('/customize-image', {
      state: {
        selectedModelData
      }
    })
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#fdfdfd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}
      >
        <div style={{
          textAlign: 'center',
          color: '#111111'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #D0D0D0',
            borderTop: '4px solid #666666',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 32px'
          }}></div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: '#111111'
          }}>
            Loading Phone Models
          </h2>
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

  // Error state
  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#fdfdfd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}
      >
        <div style={{
          textAlign: 'center',
          maxWidth: '480px',
          color: '#111111'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 24px 0',
            color: '#EB5757'
          }}>
            Connection Error
          </h2>
          <p style={{
            fontSize: '16px',
            fontWeight: '300',
            margin: '0 0 32px 0',
            lineHeight: '1.5',
            color: '#666666'
          }}>
            {error}
          </p>
          <button
            onClick={loadBrandsAndModels}
            style={{
              padding: '16px 32px',
              backgroundColor: '#666666',
              color: 'white',
              border: 'none',
              borderRadius: '28px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '300',
              transition: 'all 150ms ease-out',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#555555'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#666666'
              e.target.style.transform = 'translateY(0px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        position: 'relative'
      }}
    >
      {/* Main content container */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          flexDirection: 'column',
          gap: '80px'
        }}
      >
        {brands.filter(brand => brand.available && brandModels[brand.id]?.length > 0).map((brand) => {
          const models = brandModels[brand.id] || []
          const selectedModel = selectedModels[brand.id]
          const isOpen = openDropdowns[brand.id] || false

          // Format brand names properly
          // Use display_name or name for brand identification (Chinese IDs are opaque)
          const brandName = (brand.display_name || brand.name || '').toLowerCase()
          let displayName = brand.display_name || brand.name
          if (brandName === 'iphone') {
            displayName = 'iPhone'
          } else if (brandName === 'samsung') {
            displayName = 'Samsung'
          }

          return (
            <div
              key={brand.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
              }}
            >
              {/* Brand heading */}
              <h1
                style={{
                  fontSize: '64px',
                  fontFamily: 'Futura Heavy, Futura, sans-serif',
                  fontWeight: '900',
                  color: '#333333',
                  margin: '0',
                  textAlign: 'center',
                  lineHeight: '1',
                  letterSpacing: '-0.02em'
                }}
              >
                {displayName}
              </h1>

              {/* Model dropdown */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
                <button
                  onClick={() => toggleDropdown(brand.id)}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    backgroundColor: '#fdfdfd',
                    border: '2px solid #CCCCCC',
                    borderRadius: '56px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '20px',
                    fontWeight: '300',
                    color: '#666666',
                    transition: 'all 150ms ease-out',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#999999'
                    e.target.style.boxShadow = 'none'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#CCCCCC'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <span>
                    {selectedModel ? formatModelName(selectedModel.name || selectedModel.display_name || selectedModel.mobile_model_name) : 'Select Model'}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      transition: 'transform 200ms ease-out',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#666666"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '0',
                      width: '100%',
                      backgroundColor: '#fdfdfd',
                      border: '2px solid #CCCCCC',
                      borderRadius: '16px',
                      boxShadow: 'none',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}
                  >
                    {models.map((model, index) => {
                      const modelName = model.name || model.display_name || model.mobile_model_name
                      const isSelected = selectedModel === model
                      const isDisabled = model.stock === 0

                      return (
                        <button
                          key={index}
                          onClick={() => !isDisabled && handleModelSelect(brand.id, model)}
                          disabled={isDisabled}
                          style={{
                            width: '100%',
                            padding: '16px 24px',
                            backgroundColor: isSelected ? '#F5F5F5' : 'transparent',
                            border: 'none',
                            borderBottom: index < models.length - 1 ? '1px solid #E8E8E8' : 'none',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            fontWeight: '300',
                            color: isDisabled ? '#CCCCCC' : '#666666',
                            textAlign: 'left',
                            transition: 'background-color 100ms ease-out',
                            opacity: isDisabled ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isDisabled) {
                              e.target.style.backgroundColor = '#F5F5F5'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && !isDisabled) {
                              e.target.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{formatModelName(modelName)}</span>
                            {isDisabled && (
                              <span style={{ fontSize: '14px', color: '#999999' }}>Out of Stock</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default BrandModelSelectionScreen

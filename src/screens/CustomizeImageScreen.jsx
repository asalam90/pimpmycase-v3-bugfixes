import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'

const CustomizeImageScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData: locationSelectedModelData, deviceId, uploadMode, fromTemplateSelection, template } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Fallback to appState if location.state is empty
  const selectedModelData = locationSelectedModelData || appState.modelData

  const fileInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleBack = () => {
    // Navigate back to brand/model selection screen
    navigate('/brand-model-selection')
  }

  const handleUploadPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setIsLoading(true)

      try {
        const reader = new FileReader()

        const imageData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // Clear any existing uploaded images first (asynchronously)
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            const currentImageCount = appState.uploadedImages.length
            for (let i = 0; i < currentImageCount; i++) {
              actions.removeImage(0) // Always remove the first image
            }
            resolve()
          })
        })

        // Add image to centralized state
        actions.addImage(imageData)

        // Check if coming from template selection (new flow)
        const selectedTemplate = template || appState.template

        if (fromTemplateSelection && selectedTemplate) {
          // Navigate to appropriate template screen based on selection
          const commonState = {
            selectedModelData,
            deviceId,
            imageMode: 'full-background',
            brand: selectedModelData?.brand,
            model: selectedModelData?.model,
            template: selectedTemplate
          }

          if (selectedTemplate.id === 'classic') {
            navigate('/phone-preview', { state: commonState })
          } else if (selectedTemplate.id === 'retro-remix') {
            navigate('/retro-remix', { state: commonState })
          } else if (selectedTemplate.id === 'film-strip') {
            navigate('/film-strip', {
              state: {
                ...commonState,
                imageTransforms: appState.imageTransforms?.length > 0
                  ? appState.imageTransforms
                  : (appState.uploadedImages[0] ? [appState.transform || { x: 0, y: 0, scale: 2.5 }] : []),
                imageOrientations: ['portrait']
              }
            })
          } else if (selectedTemplate.id === 'funny-toon' || selectedTemplate.id === 'toonify') {
            navigate('/funny-toon', {
              state: {
                ...commonState,
                template: { ...selectedTemplate, id: 'funny-toon' }
              }
            })
          } else if (selectedTemplate.id === 'footy-fan') {
            navigate('/phone-preview', { state: commonState })
          } else {
            // Fallback to phone preview for unknown templates
            navigate('/phone-preview', { state: commonState })
          }
        } else {
          // Navigate to design preview with custom upload flag
          navigate('/design-preview', {
            state: {
              selectedModelData,
              deviceId,
              imageMode: 'full-background',
              brand: selectedModelData?.brand,
              model: selectedModelData?.model,
              fromCustomUpload: true  // Flag to show "Select Template" button
            }
          })
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBrowseDesigns = () => {
    // Navigate to browse designs screen
    navigate('/browse-designs', {
      state: {
        selectedModelData,
        deviceId,
        imageMode: 'full-background',
        brand: selectedModelData?.brand,
        model: selectedModelData?.model
      }
    })
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
        padding: '40px 20px',
        position: 'relative'
      }}
    >
      {/* Back Button */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#fdfdfd',
          border: '2px solid #E5E5E5',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          transition: 'all 150ms ease-out',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#111111'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#E5E5E5'
          e.target.style.transform = 'scale(1)'
        }}
        aria-label="Go back to brand and model selection"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Header */}
      <h1
        style={{
          fontSize: '48px',
          fontFamily: 'Futura Heavy, Futura, sans-serif',
          fontWeight: '900',
          color: '#333333',
          textAlign: 'center',
          margin: '0 0 80px 0',
          lineHeight: '1.1',
          letterSpacing: '-0.02em'
        }}
      >
        Choose<br/>Background
      </h1>

      {/* Primary Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          maxWidth: '280px',
          width: '100%'
        }}
      >
        {/* Upload Photo Button - Square */}
        <button
          onClick={handleUploadPhoto}
          disabled={isLoading}
          style={{
            width: '280px',
            height: '200px',
            backgroundColor: '#fdfdfd',
            border: '2px solid #CCCCCC',
            borderRadius: '32px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.borderColor = '#999999'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.borderColor = '#CCCCCC'
              e.target.style.transform = 'translateY(0px)'
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
            }
          }}
          aria-label="Upload your own photo"
        >
          {/* Upload Icon or Loading Spinner */}
          {isLoading ? (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #E5E5E5',
                borderTop: '4px solid #666666',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 5L17 10" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5V15" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}

          {/* Button Text */}
          <span
            style={{
              fontSize: '16px',
              fontWeight: '300',
              color: '#999999',
              textAlign: 'center'
            }}
          >
            {isLoading ? 'Processing...' : 'Upload Photo'}
          </span>
        </button>

        {/* Explore Collections Button - Square */}
        <button
          onClick={handleBrowseDesigns}
          style={{
            width: '280px',
            height: '200px',
            backgroundColor: '#fdfdfd',
            border: '2px solid #CCCCCC',
            borderRadius: '32px',
            cursor: 'pointer',
            transition: 'all 200ms ease-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#999999'
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#CCCCCC'
            e.target.style.transform = 'translateY(0px)'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
          aria-label="Browse our design collections"
        >
          {/* Button Text - Centered, Multi-line */}
          <span
            style={{
              fontSize: '16px',
              fontWeight: '300',
              color: '#999999',
              textAlign: 'center',
              lineHeight: '1.4'
            }}
          >
            Explore<br/>Collections
          </span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CustomizeImageScreen
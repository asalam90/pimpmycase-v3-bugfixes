import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import { getPhoneModelClass, getMaskStyles, getPhoneBackImage, getDisplayMaskImage, getPhoneDimensions, getMaskPosition } from '../utils/phoneCaseLayout'
import TopNavBar from '../components/TopNavBar'

const TemplateSelectionScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand: locationBrand, model: locationModel, color: locationColor, selectedModelData: locationSelectedModelData, deviceId, imageMode, uploadMode, fromLanding } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Fallback to appState if location.state is empty
  const brand = locationBrand || appState.brand
  const model = locationModel || appState.model
  const color = locationColor || appState.color
  const selectedModelData = locationSelectedModelData || appState.modelData

  const [selectedTemplate, setSelectedTemplate] = useState('')

  // Get uploaded image from centralized state
  const uploadedImage = appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null
  const modelClass = getPhoneModelClass(selectedModelData?.model_name || selectedModelData?.model || model)
  const maskStyles = getMaskStyles(selectedModelData?.model_name || selectedModelData?.model || model)

  // Get model-specific assets
  const modelName = selectedModelData?.model_name || selectedModelData?.model || model
  const phoneBackImage = useMemo(() => getPhoneBackImage(modelName), [modelName])
  const displayMaskImage = useMemo(() => getDisplayMaskImage(modelName), [modelName])
  const phoneDimensions = useMemo(() => getPhoneDimensions(modelName), [modelName])
  const maskPosition = useMemo(() => getMaskPosition(modelName), [modelName])

  // Programme definitions - all templates with image paths
  const programmes = [
    {
      id: 'classic',
      name: 'Classic',
      category: 'basic',
      imageCount: 1,
      description: 'Single photo. Maximum impact.',
      image: '/templates/Classic.png'
    },
    {
      id: '2-in-1',
      name: '2 in 1',
      category: 'basic',
      imageCount: 2,
      description: 'Two images. One custom case.',
      image: '/templates/2 in 1.png'
    },
    {
      id: '3-in-1',
      name: '3 in 1',
      category: 'basic',
      imageCount: 3,
      description: '3 images · 1 case.',
      image: '/templates/3 in 1.png'
    },
    {
      id: '4-in-1',
      name: '4 in 1',
      category: 'basic',
      imageCount: 4,
      description: '4 images · 1 case.',
      image: '/templates/4 in 1.png'
    },
    {
      id: 'film-strip',
      name: 'Film Strip',
      category: 'film',
      imageCount: 3,
      description: 'Turn your photos into a film strip with 3 images',
      image: '/templates/film strip.png'
    },
    {
      id: 'retro-remix',
      name: 'Retro Remix',
      category: 'ai',
      imageCount: 1,
      description: 'Your photos reworked with AI into a vibrant retro inspired finish',
      image: '/templates/Retro remix.png'
    },
    {
      id: 'cover-shoot',
      name: 'Cover Shoot',
      category: 'ai',
      imageCount: 1,
      description: 'Your photo, styled like a magazine cover',
      image: '/templates/Cover shoot.png'
    },
    {
      id: 'funny-toon',
      name: 'Funny Toon',
      category: 'ai',
      imageCount: 1,
      description: 'Turn your photo into a cartoon-style character.',
      image: '/templates/Funny toon.png'
    },
    {
      id: 'glitch-pro',
      name: 'Glitch Pro',
      category: 'ai',
      imageCount: 1,
      description: 'Your photo, enhanced with a pro-level glitch effect.',
      image: '/templates/Glitch pro.png'
    }
  ]

  const handleBack = () => {
    // Clear uploaded images and stickers when going back to landing
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }
    actions.clearStickers()

    navigate('/')
  }

  const handleProgrammeSelect = (programmeId) => {
    const programme = programmes.find(p => p.id === programmeId)
    setSelectedTemplate(programmeId)

    console.log('🎯 Template selected:', programmeId, programme)

    // Store template in centralized state
    actions.setTemplate(programme)

    // Prepare common state data (without uploadedImage since it's in centralized state)
    // CRITICAL: Use appState for brand/model/modelData to preserve Chinese API dimensions
    const commonState = {
      brand: brand || appState.brand,
      model: model || appState.model,
      color: color || appState.color,
      template: programme,
      selectedModelData: selectedModelData || appState.modelData,
      deviceId: deviceId,
      imageMode: imageMode
    }

    console.log('📦 Common state for navigation:', commonState)
    console.log('📦 AppState modelData:', appState.modelData)

    // Warn if critical data is missing
    if (!commonState.selectedModelData?.width || !commonState.selectedModelData?.height) {
      console.warn('⚠️ TemplateSelection: Chinese API dimensions missing from modelData:', commonState.selectedModelData)
    }

    // Navigate directly to main template screens
    if (programme.id === '2-in-1' || programme.id === '3-in-1' || programme.id === '4-in-1') {
      // Multi-image templates go directly to multi-image upload
      navigate('/multi-image-upload', {
        state: commonState
      })
    } else if (programme.id === 'film-strip') {
      // Film Strip goes directly to upload screen
      navigate('/film-strip-upload', {
        state: {
          ...commonState,
          stripCount: 3
        }
      })
    } else {
      // All other templates (Classic and AI templates) go to phone preview screen
      // Phone preview screen has upload functionality
      navigate('/phone-preview', {
        state: commonState
      })
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'relative'
      }}
    >
      {/* Navigation Bar */}
      <TopNavBar />

      {/* Main Content */}
      <div style={{
        marginTop: '85px',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Heading */}
        <h1
          style={{
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: '24px',
            fontWeight: '400',
            color: '#5d5d5d',
            margin: '0 0 40px 0',
            lineHeight: '1.2',
            letterSpacing: '0',
            textAlign: 'center',
            textTransform: 'uppercase'
          }}
        >
          SELECT YOUR <span style={{ fontWeight: '700' }}>STYLE</span>
        </h1>

        {/* Template Grid - 2 Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            maxWidth: '800px',
            width: '100%'
          }}
        >
          {programmes.map((programme) => (
            <div
              key={programme.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Button on top */}
              <button
                onClick={() => handleProgrammeSelect(programme.id)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid #000000',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '140px',
                  fontSize: '14px',
                  fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontWeight: '500',
                  color: '#000000',
                  textAlign: 'center',
                  letterSpacing: '0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#000000'
                }}
              >
                {programme.name}
              </button>

              {/* Image underneath */}
              <div
                style={{
                  width: '100%',
                  height: '280px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 200ms ease-out',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => handleProgrammeSelect(programme.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <img
                  src={programme.image}
                  alt={programme.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TemplateSelectionScreen

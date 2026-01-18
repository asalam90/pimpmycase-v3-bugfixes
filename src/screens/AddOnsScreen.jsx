import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import KonvaStickerCanvas from '../components/KonvaStickerCanvas'
import { useMaskedBounds } from '../hooks/useMaskedBounds'
import { composeFinalImage } from '../utils/finalImageComposer'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const AddOnsScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useAppState()

  const [selectedAddOns, setSelectedAddOns] = useState([])
  const [isUploading, setIsUploading] = useState(false)

  const overlayRef = useRef(null)
  const maskedBounds = useMaskedBounds(overlayRef)

  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  // Get text elements and images from location state or app state
  const textElements = location.state?.textElements || appState.textElements || []
  const uploadedImages = location.state?.uploadedImages || appState.uploadedImages || []

  // Use centralized transform state with fallback to location state
  const imageTransforms = appState.imageTransforms?.length > 0
    ? appState.imageTransforms
    : (location.state?.imageTransforms || [])

  // Add-on options
  const addOnOptions = [
    { id: 'screen-protector', name: 'Screen Protector', price: 7.99 }
  ]

  const handleBack = () => {
    navigate(-1)
  }

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns((prev) => {
      if (prev.includes(addOnId)) {
        return prev.filter((id) => id !== addOnId)
      } else {
        return [...prev, addOnId]
      }
    })
  }

  const uploadFinalImage = async (finalImageData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/upload-final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          template_id: location.state?.template?.id || 'classic',
          final_image_data: finalImageData,
          metadata: JSON.stringify({
            uploadTimestamp: new Date().toISOString(),
            source: 'own_collection'
          })
        })
      })

      if (!response.ok) {
        console.error('Final image upload failed:', response.status, await response.text())
        return false
      }

      const result = await response.json()
      console.log('✅ Final image upload result:', result)

      return {
        success: true,
        public_url: result.public_url,
        filename: result.filename,
        session_id: result.session_id
      }
    } catch (error) {
      console.error('❌ Error uploading final image:', error)
      return false
    }
  }

  const handleContinue = async () => {
    if (isUploading) return

    setIsUploading(true)

    try {
      // Calculate total with add-ons
      const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
        const addOn = addOnOptions.find((option) => option.id === addOnId)
        return total + (addOn?.price || 0)
      }, 0)

      // CRITICAL FIX: Compose and upload final image before going to payment
      console.log('🔄 Composing final image for own collection...')
      console.log('📝 Text elements:', textElements)
      console.log('🎨 Placed stickers:', appState.placedStickers)

      const finalImageData = await composeFinalImage({
        template: location.state?.template || { id: 'classic', name: 'Classic' },
        uploadedImages: uploadedImages,
        uploadedImage: uploadedImages[0],
        imageTransforms: appState.imageTransforms, // Use centralized state
        inputText: location.state?.inputText || '',
        selectedFont: location.state?.selectedFont || null,
        fontSize: location.state?.fontSize || 30,
        selectedTextColor: location.state?.selectedTextColor || '#000000',
        selectedBackgroundColor: location.state?.selectedBackgroundColor || 'transparent',
        textPosition: location.state?.textPosition || { x: 50, y: 50 },
        transform: appState.transform, // Use centralized state
        modelData: appState.modelData || location.state?.selectedModelData || {},  // Defensive fallback
        placedStickers: appState.placedStickers || [],
        textElements: textElements || [] // CRITICAL: Pass textElements for multi-text support
      })

      console.log('✅ Final image composed')

      // Upload to server
      const uploadResult = await uploadFinalImage(finalImageData)

      let finalImagePublicUrl = null
      if (uploadResult && uploadResult.success) {
        finalImagePublicUrl = uploadResult.public_url
        console.log('✅ Final image uploaded:', finalImagePublicUrl)
      } else {
        console.warn('⚠️ Failed to upload final image')
      }

      navigate('/payment', {
        state: {
          ...location.state,
          selectedAddOns,
          addOnsTotal,
          uploadedImages,
          finalImagePublicUrl: finalImagePublicUrl, // CRITICAL: Pass the uploaded image URL
          imageSessionId: uploadResult?.session_id
        }
      })

    } catch (error) {
      console.error('❌ Error in handleContinue:', error)
      // Navigate anyway but without image
      const addOnsTotal = selectedAddOns.reduce((total, addOnId) => {
        const addOn = addOnOptions.find((option) => option.id === addOnId)
        return total + (addOn?.price || 0)
      }, 0)

      navigate('/payment', {
        state: {
          ...location.state,
          selectedAddOns,
          addOnsTotal,
          uploadedImages
        }
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px'
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

      {/* Page Heading */}
      <div style={{ marginTop: '100px', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'transparent',
          border: '1px solid #000000',
          borderRadius: '24px',
          padding: '12px 32px'
        }}>
          <h1
            style={{
              fontSize: '20px',
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
              fontWeight: '700',
              color: '#000000',
              margin: '0',
              lineHeight: '1',
              letterSpacing: '0.5px'
            }}
          >
            Add-Ons
          </h1>
        </div>
      </div>

      {/* Phone Preview */}
      <div style={{
        maxWidth: '300px',
        margin: '0 auto 40px auto',
        position: 'relative'
      }}>
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
            image={appState.uploadedImages.length > 1 ? appState.uploadedImages : (appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null)}
            transform={appState.uploadedImages.length > 1 ? imageTransforms : (appState.transform || (imageTransforms && imageTransforms[0]))}
            width={250}
            height={416}
            modelName={location.state?.selectedModelData?.model_name || location.state?.model}
            ref={overlayRef}
          />

          {/* KONVA STICKER CANVAS - Display only */}
          <KonvaStickerCanvas
            stickers={appState.placedStickers || []}
            selectedStickerId={null}
            onStickerSelect={() => {}}
            onStickerMove={() => {}}
            onStickerResize={() => {}}
            onStickerRotate={() => {}}
            onStickerDelete={() => {}}
            phoneModel={location.state?.selectedModelData?.model_name || location.state?.model}
            containerWidth={250}
            containerHeight={416}
            maskedBounds={maskedBounds}
          />

          {/* Text Elements - Overlay div */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 250, height: 416, pointerEvents: 'none', zIndex: 20 }}>
            {/* Text Elements */}
            {textElements.map((textElement) => (
              <div
                key={textElement.id}
                style={{
                  position: 'absolute',
                  left: `${textElement.position.x}%`,
                  top: `${textElement.position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${textElement.rotation}deg)`,
                  zIndex: 15,
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    fontFamily: textElement.font.family,
                    fontSize: `${textElement.size}px`,
                    fontWeight: 'bold',
                    color: textElement.color,
                    textAlign: 'left',
                    userSelect: 'none',
                    whiteSpace: 'pre',
                    padding: '8px'
                  }}
                >
                  {textElement.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add-ons Section */}
      <div style={{ maxWidth: '450px', margin: '0 auto 80px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {addOnOptions.map((addOn) => (
            <button
              key={addOn.id}
              onClick={() => toggleAddOn(addOn.id)}
              style={{
                padding: '18px 20px',
                backgroundColor: selectedAddOns.includes(addOn.id) ? '#000000' : '#FAFAFA',
                color: selectedAddOns.includes(addOn.id) ? '#FFFFFF' : '#000000',
                border: selectedAddOns.includes(addOn.id) ? '1px solid #000000' : '1px solid #E0E0E0',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 200ms ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!selectedAddOns.includes(addOn.id)) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                  e.currentTarget.style.borderColor = '#000000'
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedAddOns.includes(addOn.id)) {
                  e.currentTarget.style.backgroundColor = '#FAFAFA'
                  e.currentTarget.style.borderColor = '#E0E0E0'
                }
              }}
            >
              <span style={{
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {addOn.name}
              </span>
              <span style={{
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                +£{addOn.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={isUploading}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: isUploading ? '#CCCCCC' : '#FFFFFF',
          borderRadius: '100px',
          width: '140px',
          height: '45px',
          border: '1px solid #000000',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease-out',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          opacity: isUploading ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isUploading) e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'
        }}
        onMouseLeave={(e) => {
          if (!isUploading) e.currentTarget.style.transform = 'translateX(-50%) scale(1)'
        }}
      >
        <span style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
          fontSize: '13px',
          fontWeight: '500',
          color: '#000000',
          letterSpacing: '0',
          textTransform: 'uppercase'
        }}>
          {isUploading ? 'Processing...' : 'Continue'}
        </span>
      </button>
    </div>
  )
}

export default AddOnsScreen

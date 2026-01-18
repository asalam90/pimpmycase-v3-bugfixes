import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import OptimizedDraggableSticker from '../components/OptimizedDraggableSticker'
import { useMaskedBounds } from '../hooks/useMaskedBounds'

const CustomStickerScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData, deviceId, imageMode, brand, model, uploadedImages: navImages, imageTransforms: navTransforms } = location.state || {}
  const { state: appState, actions } = useAppState()

  const uploadedImages = navImages || appState.uploadedImages || []
  const imageTransforms = navTransforms || appState.imageTransforms || []
  const transform = appState.transform || (imageTransforms.length > 0 ? imageTransforms[0] : null)
  const [customStickerImage, setCustomStickerImage] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedStickerForEdit, setSelectedStickerForEdit] = useState(null)
  const overlayRef = useRef(null)
  const fileInputRef = useRef(null)

  const maskedBounds = useMaskedBounds(overlayRef)

  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setIsUploading(true)

    try {
      // Create object URL for the uploaded image
      const imageUrl = URL.createObjectURL(file)

      // Create an image element to get dimensions
      const img = new Image()
      img.onload = () => {
        // Automatically add sticker to phone case
        const newSticker = {
          placedId: `custom-${Date.now()}`,
          id: `custom-${Date.now()}`,
          name: 'Custom Sticker',
          type: 'image',
          imageUrl: imageUrl,
          highresUrl: imageUrl,
          fallbackUrl: imageUrl,
          thumbnailUrl: imageUrl,
          x: 50,
          y: 50,
          scale: 25,
          rotation: 0,
          zIndex: (appState.placedStickers?.length || 0) + 1,
          isCustom: true,
          customFile: file
        }

        actions.addSticker(newSticker)
        setSelectedStickerForEdit(newSticker.placedId)
        setIsUploading(false)

        // Reset file input to allow same file upload again
        if (event.target) {
          event.target.value = ''
        }
      }
      img.onerror = () => {
        alert('Failed to load image')
        setIsUploading(false)
      }
      img.src = imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
      setIsUploading(false)
    }
  }

  const handleAddCustomSticker = () => {
    if (!customStickerImage) return

    const newSticker = {
      placedId: `custom-${Date.now()}`,
      id: `custom-${Date.now()}`,
      name: 'Custom Sticker',
      type: 'image',
      imageUrl: customStickerImage.url,
      highresUrl: customStickerImage.url,
      fallbackUrl: customStickerImage.url,
      thumbnailUrl: customStickerImage.url,
      x: 50,
      y: 50,
      scale: 25,
      rotation: 0,
      zIndex: (appState.placedStickers?.length || 0) + 1,
      isCustom: true,
      customFile: customStickerImage.file
    }

    actions.addSticker(newSticker)
    setSelectedStickerForEdit(newSticker.placedId)
  }

  const handleBack = () => {
    // Clear all stickers when going back (they're going back to AddStickersScreen to re-select)
    actions.clearStickers()
    navigate(-1)
  }

  const handleContinue = () => {
    navigate('/text-input', {
      state: {
        selectedModelData,
        deviceId,
        imageMode,
        brand,
        model,
        uploadedImages,
        imageTransforms: appState.imageTransforms || []
      }
    })
  }

  const handleSkip = () => {
    handleContinue()
  }

  const handleStickerMove = (placedId, x, y) => {
    actions.updateSticker(placedId, { x, y })
  }

  const handleStickerResize = (placedId, scale) => {
    // Constrain scale between 20 and 180 - allows stickers up to ~40% of phone cover
    const MIN_SCALE = 20
    const MAX_SCALE = 180
    const constrainedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    actions.updateSticker(placedId, { scale: constrainedScale })
  }

  const handleStickerRotate = (placedId, rotation) => {
    actions.updateSticker(placedId, { rotation })
  }

  const handleStickerDelete = (placedId) => {
    actions.removeSticker(placedId)
    if (selectedStickerForEdit === placedId) {
      setSelectedStickerForEdit(null)
    }
  }

  const handleStickerSelect = (placedId) => {
    setSelectedStickerForEdit(placedId)
  }

  const handleBackgroundClick = () => {
    setSelectedStickerForEdit(null)
  }

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px'
      }}
    >
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        {/* Back Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleBack()
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms ease-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Skip Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSkip()
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '300',
              color: '#999999',
              cursor: 'pointer',
              padding: '8px 12px'
            }}
          >
            Skip
          </button>
        </div>
      </div>

      {/* Page Heading */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '32px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '900',
            color: '#333333',
            margin: '0 0 20px 0',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            textAlign: 'center'
          }}
        >
          Custom Sticker
        </h1>
        <p
          style={{
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '400',
            color: '#666666',
            margin: '0 0 60px 0',
            lineHeight: '1.4',
            textAlign: 'center',
            padding: '0 20px'
          }}
        >
          Upload your own image to use as a sticker
        </p>
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
            position: 'relative',
            transform: 'scaleX(1)'
          }}
        >
          <MaskedPhoneDisplay
            image={uploadedImages.length > 1 ? uploadedImages : (uploadedImages.length > 0 ? uploadedImages[0] : null)}
            transform={uploadedImages.length > 1 ? imageTransforms : (transform || (imageTransforms && imageTransforms[0]))}
            width={250}
            height={416}
            modelName={selectedModelData?.model_name || model}
            ref={overlayRef}
          >
            {/* Placed Stickers */}
            {appState.placedStickers?.map((sticker) => (
              <OptimizedDraggableSticker
                key={sticker.placedId}
                sticker={sticker}
                isSelected={selectedStickerForEdit === sticker.placedId}
                onSelect={handleStickerSelect}
                onMove={handleStickerMove}
                onResize={handleStickerResize}
                onRotate={handleStickerRotate}
                onDelete={handleStickerDelete}
                containerRect={getContainerRect()}
                maskedBounds={maskedBounds}
                overlayRef={overlayRef}
              />
            ))}
          </MaskedPhoneDisplay>
        </div>
      </div>

      {/* Upload Button - Centered under phone */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', width: '100%' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
          disabled={isUploading}
          style={{
            width: '200px',
            height: '56px',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: '1px solid #000000',
            borderRadius: '100px',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '500',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease-out',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            opacity: isUploading ? 0.6 : 1,
            textTransform: 'uppercase',
            letterSpacing: '0'
          }}
          onMouseEnter={(e) => {
            if (!isUploading) {
              e.currentTarget.style.transform = 'scale(1.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isUploading) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {isUploading ? 'UPLOADING...' : (appState.placedStickers?.filter(s => s.isCustom)?.length > 0 ? 'ADD ANOTHER' : 'UPLOAD YOUR STICKER')}
        </button>
      </div>

      {/* Continue Button - Centered */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', width: '100%' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleContinue()
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '100px',
            width: '140px',
            height: '45px',
            border: '1px solid #000000',
            cursor: 'pointer',
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
            fontSize: '13px',
            fontWeight: '500',
            color: '#000000',
            letterSpacing: '0',
            textTransform: 'uppercase'
          }}>
            Continue
          </span>
        </button>
      </div>
    </div>
  )
}

export default CustomStickerScreen

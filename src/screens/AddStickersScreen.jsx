import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import KonvaStickerCanvas from '../components/KonvaStickerCanvas'
import { getImageStickerPacks, preloadStickerPack } from '../utils/stickerLoader'
import { useMaskedBounds } from '../hooks/useMaskedBounds'
import { usePinchToScale } from '../hooks/usePinchToScale'

const AddStickersScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData, deviceId, imageMode, brand, model } = location.state || {}
  const { state: appState, actions } = useAppState()

  const [selectedPack, setSelectedPack] = useState(null)
  const [loadingPacks, setLoadingPacks] = useState({})
  const [selectedStickerForEdit, setSelectedStickerForEdit] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const overlayRef = useRef(null)
  const stickerPacksRef = useRef(null)

  // Show scroll to top button when user scrolls past the phone preview
  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down past 400px (roughly where sticker packs start)
      const scrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
      setShowScrollTop(scrolled > 400)
    }

    // Check initial position
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Use optimized maskedBounds hook with ResizeObserver
  const maskedBounds = useMaskedBounds(overlayRef)

  // REMOVED: Eager preloading - now using lazy loading per pack

  // Get container rect for optimized sticker positioning
  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  const handleBack = () => {
    // Only clear stickers, preserve the design/images
    actions.clearStickers()

    // Go back to previous screen
    navigate(-1)
  }

  // Lazy load sticker pack when selected
  const handleStickerPackSelect = useCallback(async (pack) => {
    setSelectedPack(pack.name)

    // Only load if not already loaded/loading
    if (!loadingPacks[pack.key] && pack.key) {
      setLoadingPacks(prev => ({ ...prev, [pack.key]: 'loading' }))

      try {
        await preloadStickerPack(pack.key)
        setLoadingPacks(prev => ({ ...prev, [pack.key]: 'loaded' }))
      } catch (error) {
        console.error(`Failed to load pack ${pack.name}:`, error)
        setLoadingPacks(prev => ({ ...prev, [pack.key]: 'error' }))
      }
    }
  }, [loadingPacks])

  const handleStickerSelect = (sticker) => {
    console.log('🎯 handleStickerSelect called for:', sticker.name)

    // Calculate safe starting position using the same boundary system
    const isImageSticker = sticker.type === 'image'

    const PHONE_BOUNDARIES = {
      left: 8, right: 93, top: 0, bottom: 100
    }

    // Use shape-aware sizing
    const baseStickerSize = isImageSticker ? 40 : 32
    const visibilityFactor = isImageSticker ? 0.7 : 0.9
    const effectiveRadius = (baseStickerSize * visibilityFactor) / 2

    // Calculate center position of background area
    const centerX = (PHONE_BOUNDARIES.left + PHONE_BOUNDARIES.right) / 2
    const centerY = (PHONE_BOUNDARIES.top + PHONE_BOUNDARIES.bottom) / 2

    // CRITICAL: Use full resolution highresUrl for placed stickers, not thumbnails
    const newPlacedSticker = {
      ...sticker,
      // Override to use full resolution image (highresUrl is 2000px WebP @ 95%)
      imageUrl: sticker.highresUrl || sticker.fallbackUrl,
      placedId: Date.now() + Math.random(),
      x: centerX,
      y: centerY,
      scale: 25,
      rotation: 0,
      zIndex: appState.placedStickers.length + 1
    }

    console.log('✅ Adding sticker to state:', {
      name: newPlacedSticker.name,
      imageUrl: newPlacedSticker.imageUrl,
      position: { x: newPlacedSticker.x, y: newPlacedSticker.y }
    })

    actions.addSticker(newPlacedSticker)

    console.log('📊 Total stickers after add:', appState.placedStickers.length + 1)

    setSelectedStickerForEdit(newPlacedSticker.placedId)

    // Scroll to top to show the phone preview with the new sticker
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStickerMove = (placedId, newX, newY) => {
    actions.updateSticker(placedId, { x: newX, y: newY })
  }

  // Store current scale for pinch gestures
  const currentStickerScaleRef = useRef(1)

  const handleStickerResize = (placedId, newScale) => {
    // Constrain scale between 20 and 180 - allows stickers up to ~40% of phone cover
    const MIN_SCALE = 20
    const MAX_SCALE = 180
    const constrainedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
    currentStickerScaleRef.current = constrainedScale

    // Update with new scale
    actions.updateSticker(placedId, { scale: constrainedScale })
  }

  const handleStickerRotate = (placedId, newRotation) => {
    actions.updateSticker(placedId, { rotation: newRotation })
  }

  const handleStickerDelete = (placedId) => {
    actions.removeSticker(placedId)
    if (selectedStickerForEdit === placedId) {
      setSelectedStickerForEdit(null)
    }
  }

  // Pinch-to-scale gesture support
  const handlePinchScale = useCallback((scaleMultiplier) => {
    if (selectedStickerForEdit) {
      const selectedSticker = appState.placedStickers.find(s => s.placedId === selectedStickerForEdit)
      if (selectedSticker) {
        const baseScale = selectedSticker.scale || 1
        const newScale = baseScale * scaleMultiplier
        handleStickerResize(selectedStickerForEdit, newScale)
      }
    }
  }, [selectedStickerForEdit, appState.placedStickers])

  const pinchHandlers = usePinchToScale(!!selectedStickerForEdit, handlePinchScale)

  const handleReset = () => {
    const confirmed = window.confirm('This will remove all stickers from the design. Are you sure?')
    if (confirmed) {
      // Clear only the placed stickers, keep everything else
      actions.clearStickers()
      setSelectedStickerForEdit(null)
    }
  }

  const handleContinue = () => {
    console.log('🚀 CONTINUE button clicked on AddStickersScreen')
    console.log('📊 Current appState.placedStickers:', appState.placedStickers.length)
    console.log('📊 Current appState.uploadedImages:', appState.uploadedImages.length)

    appState.placedStickers.forEach((s, idx) => {
      console.log(`  Sticker ${idx}:`, s.name, 'imageUrl:', s.imageUrl?.substring(0, 50))
    })

    // Pass uploadedImages in navigation state since they're not persisted to localStorage
    navigate('/custom-sticker', {
      state: {
        selectedModelData,
        deviceId,
        imageMode,
        brand,
        model,
        uploadedImages: appState.uploadedImages, // CRITICAL: Pass images through navigation
        imageTransforms: appState.imageTransforms || []
      }
    })

    console.log('✅ Navigated to /custom-sticker')
  }

  const handleSkip = () => {
    // Skip directly to text input screen
    navigate('/text-input', {
      state: {
        selectedModelData,
        deviceId,
        imageMode,
        brand,
        model,
        uploadedImages: appState.uploadedImages,
        imageTransforms: appState.imageTransforms || []
      }
    })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get image sticker packs only
  const stickerPacks = getImageStickerPacks()

  return (
    <div
      onClick={() => setSelectedStickerForEdit(null)}
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px',
        paddingTop: '100px',
        touchAction: selectedStickerForEdit ? 'none' : 'auto'
      }}
      {...pinchHandlers}
    >
      {/* Back Arrow */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleBack()
        }}
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

      {/* Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleSkip()
        }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
          fontWeight: '400',
          color: '#666666',
          cursor: 'pointer',
          zIndex: 20,
          padding: '8px 12px'
        }}
      >
        Skip
      </button>

      {/* Phone Case Preview */}
      <div style={{
        maxWidth: '300px',
        margin: '0 auto 20px auto',
        textAlign: 'center'
      }}>
        <div
          data-preview-container
          style={{
            width: '250px',
            height: '416px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
            touchAction: selectedStickerForEdit ? 'none' : 'auto'
          }}
          onClick={() => setSelectedStickerForEdit(null)}
        >
          {/* Camera-aware phone case with masking - NO children, stickers rendered separately */}
          <MaskedPhoneDisplay
            image={appState.uploadedImages.length > 1 ? appState.uploadedImages : (appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null)}
            transform={appState.uploadedImages.length > 1 ? appState.imageTransforms : (appState.transform || (appState.imageTransforms && appState.imageTransforms[0]))}
            width={250}
            height={416}
            modelName={selectedModelData?.model_name || model}
            ref={overlayRef}
          />

          {/* KONVA STICKER CANVAS - Replaces SVG foreignObject approach */}
          {/* This renders on TOP of MaskedPhoneDisplay with proper clipping */}
          <KonvaStickerCanvas
            stickers={appState.placedStickers}
            selectedStickerId={selectedStickerForEdit}
            onStickerSelect={setSelectedStickerForEdit}
            onStickerMove={handleStickerMove}
            onStickerResize={handleStickerResize}
            onStickerRotate={handleStickerRotate}
            onStickerDelete={handleStickerDelete}
            phoneModel={selectedModelData?.model_name || model}
            containerWidth={250}
            containerHeight={416}
            maskedBounds={maskedBounds}
          />
        </div>
      </div>

      {/* All Sticker Packs with Thumbnails */}
      <div ref={stickerPacksRef} style={{ maxWidth: '100%', margin: '0 auto 40px auto', padding: '0 10px' }}>
        {stickerPacks.map((pack) => (
          <div key={pack.name} style={{ marginBottom: '48px' }}>
            {/* Pack Name - Matching Landing Page Category Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px'
              }}
            >
              <div
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #333333',
                  borderRadius: '24px',
                  padding: '8px 20px'
                }}
              >
                <span
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                    fontSize: '18px',
                    color: '#333333'
                  }}
                >
                  {pack.name.replace(/\s*pack\s*/gi, '').trim()}
                </span>
              </div>
            </div>

            {/* Pack Stickers Freeform Collage */}
            {loadingPacks[pack.key] === 'loading' ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                width: '100%'
              }}>
                <div className="spinner" style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #E5E5E5',
                  borderTopColor: '#000000',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                  margin: '0 auto 12px'
                }} />
                Loading stickers...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                rowGap: '32px',
                padding: '0',
                width: '100%',
                maxWidth: '100%'
              }}>
                {pack.stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStickerPackSelect(pack)
                        handleStickerSelect(sticker)
                      }}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        maxWidth: '175px',
                        border: '0.12px solid #000000',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 150ms ease-out',
                        padding: '0',
                        overflow: 'hidden',
                        position: 'relative',
                        margin: '0 auto'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15) rotate(3deg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                      }}
                      title={sticker.name}
                    >
                      {sticker.type === 'emoji' ? (
                        <span style={{ fontSize: '72px' }}>{sticker.emoji}</span>
                      ) : (
                        <img
                          src={sticker.thumbnailUrl || sticker.fallbackUrl}
                          alt={sticker.name}
                          loading="lazy"
                          onError={(e) => {
                            if (e.target.src !== sticker.fallbackUrl) {
                              e.target.src = sticker.fallbackUrl
                            }
                          }}
                          style={{
                            width: `${125 * (sticker.thumbnailZoom || 1.0)}%`,
                            height: `${125 * (sticker.thumbnailZoom || 1.0)}%`,
                            objectFit: 'cover',
                            transform: `translateY(${sticker.thumbnailOffsetY || 0}%)`
                          }}
                        />
                      )}
                    </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Buttons - Reset and Continue */}
      {appState.placedStickers.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          {/* Reset Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReset()
            }}
            style={{
              width: '140px',
              height: '45px',
              borderRadius: '100px',
              border: '1px solid #FF4444',
              backgroundColor: '#FFFFFF',
              color: '#FF4444',
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 68, 68, 0.15)',
              transition: 'all 200ms ease-out',
              letterSpacing: '0',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.backgroundColor = '#FF4444'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.backgroundColor = '#FFFFFF'
              e.currentTarget.style.color = '#FF4444'
            }}
          >
            Reset
          </button>

          {/* Continue Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleContinue()
            }}
            style={{
              width: '140px',
              height: '45px',
              borderRadius: '100px',
              border: '1px solid #000000',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontSize: '13px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 200ms ease-out',
              letterSpacing: '0',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Scroll to Top Button - Fixed at bottom right */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: appState.placedStickers.length > 0 ? '90px' : '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 200ms ease-out',
            zIndex: 20
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Font Import & Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default AddStickersScreen

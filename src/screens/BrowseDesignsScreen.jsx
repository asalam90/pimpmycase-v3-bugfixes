import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
// Stickers rendered as simple divs for preview (non-interactive)
import { useMaskedBounds } from '../hooks/useMaskedBounds'
import { getPhoneBackImage, getDisplayMaskImage, getPhoneDimensions, getMaskPosition } from '../utils/phoneCaseLayout'

const BrowseDesignsScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData, deviceId, imageMode, brand, model } = location.state || {}
  const { state: appState, actions } = useAppState()

  const [selectedDesign, setSelectedDesign] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [designPacks, setDesignPacks] = useState([])
  const [resolvedImageUrls, setResolvedImageUrls] = useState({})
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [isColorMode, setIsColorMode] = useState(false)

  const overlayRef = useRef(null)
  const maskedBounds = useMaskedBounds(overlayRef)

  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  // Get model-specific assets
  const modelName = selectedModelData?.model_name || model
  const phoneBackImage = useMemo(() => getPhoneBackImage(modelName), [modelName])
  const displayMaskImage = useMemo(() => getDisplayMaskImage(modelName), [modelName])
  const phoneDimensions = useMemo(() => getPhoneDimensions(modelName, 'large'), [modelName])
  const thumbnailDimensions = useMemo(() => getPhoneDimensions(modelName, 'thumbnail'), [modelName])
  const maskPosition = useMemo(() => getMaskPosition(modelName), [modelName])

  const handleColorChange = (e) => {
    const colorValue = e.target.value
    setSelectedColor(colorValue)
    setIsColorMode(true)
    setSelectedDesign(null)

    // Clear existing images
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }

    // Create a solid color canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 2000
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = colorValue
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Convert to data URL and add to state
    const dataUrl = canvas.toDataURL('image/png')
    actions.addImage(dataUrl)
  }

  // Load background images on component mount
  useEffect(() => {
    const loadBackgrounds = async () => {
      // Map of category folders with actual file names
      const categoryMap = {
        'ABSTRACT': {
          name: 'Abstract Pack',
          files: [
            'Dreamscape.jpg',
            'Rainy Day In London.jpg',
            'Serenity.jpg',
            'Sing Me An Old Fashioned Song.jpg'
          ]
        },
        'ANIMAL_PRINT': {
          name: 'Animal Print Pack',
          subfolder: 'FINAL',
          files: [
            'Ethereal Wild.webp',
            'Natures Pulse.webp',
            'Stripes and Shadows.webp',
            'Wild Instinct.webp'
          ]
        },
        'CATS': {
          name: 'Cats Pack',
          files: [
            'Art Cats Society.webp',
            'Dreams of the Cat.webp',
            'Hello Kitty.webp',
            'Whiskers and Wonder.webp'
          ]
        },
        'DOGS': {
          name: 'Dogs Pack',
          files: [
            'Bark and Bloom.webp',
            'Happy Howls.webp',
            'Paws and Poetry.png',
            'Woofology.png'
          ]
        },
        'FLORAL': {
          name: 'Floral Pack',
          files: [
            'Petals in a Dream.webp',
            'Sunny Botanica.webp',
            'The Abstract Garden.webp',
            'Whispers in Color.webp'
          ]
        },
        'GRAFITTI': {
          name: 'Graffiti Pack',
          files: [
            'Color Chaos.webp',
            'No Rules Club.webp',
            'Off the Wall.webp',
            'Spray and Slay.webp'
          ]
        },
        'HIPHOP': {
          name: 'Hip Hop Pack',
          files: [
            '808 Dreams.webp',
            'Born to Flex.webp',
            'Rhythms of the Street.webp',
            'Sound in Motion.webp'
          ]
        },
        'LOVE': {
          name: 'Love Pack',
          files: [
            'Love Beyond Form.png',
            'Love in Fragments.webp',
            'When Hearts Dream.webp',
            'Whispers of a Ladybug.png'
          ]
        },
        'MONOCHROME': {
          name: 'Monochrome Pack',
          files: [
            'Black Whisper.webp',
            'Pure Form.webp',
            'The Absence of Color.jpg',
            'The Space Between.webp'
          ]
        },
        'MONSTERS': {
          name: 'Monsters Pack',
          files: [
            'Cotton Candy Chaos.webp',
            'He Wanted to Be Loved.webp',
            'The Kind Monster.webp',
            'When Monsters Dream.webp'
          ]
        },
        'POSITIVE_VIBE': {
          name: 'Positive Vibe Pack',
          zoomX: 0.85,
          zoomY: 1.0,
          files: [
            'Be the Sun.webp',
            'Good Energy Only.webp',
            'Kindness Era.webp',
            'No Bad Vibes.webp'
          ]
        },
        'RETRO_POPUP': {
          name: 'Retro Pack',
          files: [
            'Everybodys Famous.webp',
            'Fame Frequency.webp',
            'Pop Girl Energy.webp',
            'The Color Shouts Back.webp'
          ]
        },
        'ROCK': {
          name: 'Rock Pack',
          files: [
            'Born Loud.webp',
            'Electric Soul.webp',
            'Rock n Roll Spirit.webp',
            'Wild and Wired.webp'
          ]
        },
        'SPACE': {
          name: 'Space Pack',
          files: [
            'Born of Supernovas.webp',
            'Dancing with Planets.webp',
            'ETERNAL VOID.webp',
            'Interstellar.webp'
          ]
        },
        'SURREAL': {
          name: 'Surreal Pack',
          files: [
            'Eyes That Remember Dreams.webp',
            'Illusions of Memory.webp',
            'SUBCONSCIOUS GARDEN.webp',
            'THE UNREAL THINGS.webp'
          ]
        },
        'TECH_LUXE': {
          name: 'Tech Luxe Pack',
          files: [
            'CYBER BLOOM.webp',
            'Platinum Mind.jpg',
            'Signal Aura.webp',
            'Silent Code.webp'
          ]
        }
      }

      const packs = []
      let designId = 1

      for (const [folder, info] of Object.entries(categoryMap)) {
        const designs = []

        for (const file of info.files) {
          // Extract design name from filename (remove extension)
          const designName = file.replace(/\.(webp|jpg|png)$/i, '')

          // Build the path (with subfolder if specified)
          // Note: Don't encode - browsers handle spaces automatically
          const pathPrefix = info.subfolder
            ? `/Backgrounds/${folder}/${info.subfolder}`
            : `/Backgrounds/${folder}`

          const design = {
            id: designId++,
            imageUrl: `${pathPrefix}/${file}`,
            fallbackUrl: `${pathPrefix}/${file}`,
            category: folder,
            customFilename: file,
            designName: designName
          }

          // Add zoom if specified for this category
          if (info.zoom) {
            design.zoom = info.zoom
          }

          // Add separate X/Y zoom if specified for this category
          if (info.zoomX !== undefined || info.zoomY !== undefined) {
            design.zoomX = info.zoomX
            design.zoomY = info.zoomY
          }

          designs.push(design)
        }

        packs.push({
          name: info.name,
          designs
        })
      }

      setDesignPacks(packs)
    }

    loadBackgrounds()
  }, [])

  const handleBack = () => {
    navigate('/customize-image', {
      state: {
        selectedModelData,
        deviceId
      }
    })
  }

  const handleDesignSelect = async (design) => {
    console.log('🚀 FUNCTION START - handleDesignSelect for design:', design.id)

    console.log('📝 Setting selectedDesign state...')
    setSelectedDesign(design)
    setIsColorMode(false)

    console.log('⏳ Setting isLoading to true...')
    setIsLoading(true)

    console.log('💾 Current uploadedImages count:', appState.uploadedImages.length)

    try {
      console.log('🧹 Starting image clearing process...')
      // Clear any existing uploaded images first
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          const currentImageCount = appState.uploadedImages.length
          for (let i = 0; i < currentImageCount; i++) {
            actions.removeImage(0)
          }
          resolve()
        })
      })

      // Load the actual background image
      console.log('🎨 Loading background image...')

      // Try multiple formats: original → alternative formats
      const loadImage = (url) => new Promise((resolve, reject) => {
        const testImg = new Image()
        testImg.onload = () => resolve(url)
        testImg.onerror = () => reject()
        testImg.src = url
      })

      let imageUrl = null

      // Try to load the primary URL first
      try {
        imageUrl = await loadImage(design.imageUrl)
        console.log('✅ Image loaded successfully:', imageUrl)
      } catch {
        console.log(`Failed to load primary URL: ${design.imageUrl}`)

        // Try alternative formats
        const basePath = design.imageUrl.substring(0, design.imageUrl.lastIndexOf('.'))
        const possibleFormats = ['webp', 'png', 'jpg', 'JPG']

        for (const format of possibleFormats) {
          const fallbackUrl = `${basePath}.${format}`
          try {
            imageUrl = await loadImage(fallbackUrl)
            console.log('✅ Fallback image loaded successfully:', imageUrl)
            break
          } catch {
            console.log(`Failed to load: ${fallbackUrl}`)
          }
        }

        if (!imageUrl) {
          console.error('All image formats failed')
          throw new Error('Failed to load background image')
        }
      }

      // Add the loaded image to state
      actions.addImage(imageUrl)

    } catch (error) {
      console.error('❌ ERROR in handleDesignSelect:', error)
      alert('Failed to load background image. Please try another design.')
    } finally {
      console.log('🏁 FINALLY BLOCK - Setting loading to false')
      setIsLoading(false)
      console.log('🏁 FUNCTION END - handleDesignSelect completed')
    }
  }

  const handleContinue = () => {
    console.log('🧭 Preparing navigation state...')
    const navigationState = {
      selectedModelData,
      deviceId,
      imageMode,
      brand,
      model,
      designName: selectedDesign || (isColorMode ? 'Solid Color' : null)
    }
    console.log('🧭 Navigation state:', navigationState)

    console.log('➡️ Navigating to design preview...')
    navigate('/design-preview', { state: navigationState })
    console.log('✅ Navigation initiated')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px'
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
        aria-label="Go back to background options"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Skip Button */}
      <button
        onClick={handleContinue}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          fontWeight: '300',
          color: '#999999',
          cursor: 'pointer',
          zIndex: 20,
          padding: '8px 12px'
        }}
      >
        Skip
      </button>

      {/* Header */}
      <div style={{ marginTop: '80px', marginBottom: '40px' }}>
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
          Browse Our Designs
        </h1>
        <p
          style={{
            fontSize: '16px',
            fontWeight: '300',
            color: '#999999',
            textAlign: 'center',
            margin: '0',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          Choose from our curated collection of design packs
        </p>
      </div>

      {/* Phone Model Preview */}
      <div style={{
        maxWidth: '350px',
        margin: '0 auto 40px auto',
        position: 'relative'
      }}>
        <div
          style={{
            width: `${phoneDimensions.width}px`,
            height: `${phoneDimensions.height}px`,
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Phone Back Image - Base layer */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0
          }}>
            <img
              src={phoneBackImage}
              alt="Phone back"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Design background with mask */}
          {appState.uploadedImages.length > 0 && (
            <svg style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}>
              <defs>
                <mask id="browseDesignMask">
                  <image
                    href={displayMaskImage}
                    x={maskPosition.x}
                    y={maskPosition.y}
                    width={maskPosition.width}
                    height={maskPosition.height}
                    preserveAspectRatio="none"
                  />
                </mask>
              </defs>
              <foreignObject width="100%" height="100%" mask="url(#browseDesignMask)">
                <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                  <img
                    src={appState.uploadedImages[0]}
                    alt="Selected design"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </foreignObject>
            </svg>
          )}

          {/* Placed Stickers - Using consistent sizing */}
          {appState.placedStickers.map((sticker) => (
            <div
              key={sticker.placedId}
              style={{
                position: 'absolute',
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
                fontSize: sticker.type === 'image' ? '20px' : '24px',
                zIndex: 5,
                pointerEvents: 'none'
              }}
            >
              {sticker.type === 'emoji' ? (
                sticker.emoji
              ) : (
                <img
                  src={sticker.imageUrl || sticker.highresUrl || sticker.fallbackUrl}
                  alt={sticker.name}
                  onError={(e) => {
                    if (e.target.src === sticker.imageUrl && sticker.highresUrl) {
                      e.target.src = sticker.highresUrl
                    } else if (e.target.src !== sticker.fallbackUrl && sticker.fallbackUrl) {
                      e.target.src = sticker.fallbackUrl
                    }
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
                  }}
                  draggable={false}
                />
              )}
            </div>
          ))}

        </div>
      </div>

      {/* Design Packs */}
      <div style={{ maxWidth: '500px', margin: '0 auto 100px auto' }}>
        {/* Solid Color Picker */}
        <div style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '28px',
              fontFamily: 'Futura, sans-serif',
              fontWeight: '300',
              color: '#666666',
              margin: '0 0 25px 0',
              textAlign: 'center',
              letterSpacing: '0.05em'
            }}
          >
            Solid Color
          </h2>

          {/* Color Picker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}
          >
            <input
              type="color"
              value={selectedColor}
              onChange={handleColorChange}
              style={{
                width: '120px',
                height: '120px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: isColorMode ? '0 4px 16px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                transform: isColorMode ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 200ms ease-out'
              }}
            />
            <p
              style={{
                fontSize: '14px',
                fontFamily: 'Futura, sans-serif',
                fontWeight: '400',
                color: '#666666',
                margin: '0'
              }}
            >
              Click to pick a color
            </p>
          </div>
        </div>

        {designPacks.map((pack, packIndex) => (
          <div key={packIndex} style={{ marginBottom: '40px' }}>
            {/* Pack Name */}
            <h2
              style={{
                fontSize: '28px',
                fontFamily: 'Futura, sans-serif',
                fontWeight: '300',
                color: '#666666',
                margin: '0 0 25px 0',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}
            >
              {pack.name.replace(' Pack', '')}
            </h2>

            {/* Artist Credit for Abstract Pack */}
            {pack.name === 'Abstract Pack' && (
              <p
                style={{
                  fontSize: '12px',
                  fontFamily: 'Futura, sans-serif',
                  fontWeight: '300',
                  color: '#999999',
                  margin: '0 0 20px 0',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }}
              >
                Our collections are represented by the artist Mahsa Shirazi.
                <br />
                Follow on Instagram: @mahsa_shirazi_artist
              </p>
            )}

            {/* Pack Phone Mockups - 2x2 Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                marginBottom: '15px'
              }}
            >
              {pack.designs.map((design) => (
                <div
                  key={design.id}
                  onClick={() => {
                    if (!isLoading) {
                      console.log('🔘 DESIGN CLICKED - Design ID:', design.id)
                      handleDesignSelect(design)
                    }
                  }}
                  style={{
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading && selectedDesign?.id !== design.id ? 0.5 : 1,
                    transition: 'all 300ms ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transform: selectedDesign?.id === design.id ? 'scale(1.08)' : 'scale(1)',
                    filter: selectedDesign?.id === design.id ? 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25))' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDesign?.id !== design.id && !isLoading) {
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDesign?.id !== design.id) {
                      e.currentTarget.style.transform = 'scale(1)'
                    } else {
                      e.currentTarget.style.transform = 'scale(1.08)'
                    }
                  }}
                >
                  {/* Phone Mockup */}
                  <div style={{
                    width: `${thumbnailDimensions.width}px`,
                    height: `${thumbnailDimensions.height}px`,
                    position: 'relative',
                    borderRadius: '20px',
                    overflow: 'hidden'
                  }}>
                    {isLoading && selectedDesign?.id === design.id ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f5'
                        }}
                      >
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            border: '3px solid #ccc',
                            borderTop: '3px solid #111111',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <MaskedPhoneDisplay
                          image={resolvedImageUrls[design.id] || design.imageUrl}
                          width={thumbnailDimensions.width}
                          height={thumbnailDimensions.height}
                          modelName={modelName}
                          zoom={design.zoom}
                          zoomX={design.zoomX}
                          zoomY={design.zoomY}
                        />
                        {/* Hidden img for fallback handling */}
                        <img
                          src={resolvedImageUrls[design.id] || design.imageUrl}
                          onError={(e) => {
                            const currentSrc = e.target.src
                            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('.'))
                            const currentFormat = currentSrc.split('.').pop()

                            // Try formats: webp → png → jpg → JPG
                            const formats = ['webp', 'png', 'jpg', 'JPG']
                            const formatIndex = formats.indexOf(currentFormat)

                            if (formatIndex >= 0 && formatIndex < formats.length - 1) {
                              const newSrc = `${basePath}.${formats[formatIndex + 1]}`
                              console.log(`Trying fallback format for design ${design.id}:`, newSrc)
                              e.target.src = newSrc
                              // Update state to trigger re-render
                              setResolvedImageUrls(prev => ({
                                ...prev,
                                [design.id]: newSrc
                              }))
                            } else {
                              console.error(`All formats failed for design ${design.id}`)
                            }
                          }}
                          style={{ display: 'none' }}
                          alt=""
                        />
                      </div>
                    )}
                  </div>

                  {/* Design Name */}
                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontFamily: 'Futura, sans-serif',
                        fontWeight: '400',
                        color: '#666666',
                        margin: '0 0 1px 0'
                      }}
                    >
                      {design.designName}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        fontFamily: 'Futura, sans-serif',
                        fontWeight: '300',
                        color: '#999999',
                        margin: '0'
                      }}
                    >
                      iPhone
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button - Shows after design or color selection */}
      {(selectedDesign || isColorMode) && !isLoading && (
        <button
          onClick={handleContinue}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '180px',
            height: '50px',
            borderRadius: '100px',
            border: '1px solid #000000',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            zIndex: 10,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateX(-50%) scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateX(-50%) scale(1)'
          }}
        >
          Continue
        </button>
      )}

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

export default BrowseDesignsScreen

import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import TopNavBar from '../components/TopNavBar'
import { getPhoneDimensions } from '../utils/phoneCaseLayout'

const LandingScreen = () => {
  const navigate = useNavigate()
  const { state: appState, actions } = useAppState()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const designSectionRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [designPacks, setDesignPacks] = useState([])
  const [customColor, setCustomColor] = useState('#FF6B6B')
  const [visiblePacks, setVisiblePacks] = useState(3) // Only show first 3 packs initially

  // Detect entry source on mount - QR vs Vanilla
  useEffect(() => {
    const qrParam = searchParams.get('qr')
    const machineId = searchParams.get('machine_id')
    const sessionId = searchParams.get('session_id')
    const location = searchParams.get('location')

    if (qrParam === 'true' && machineId) {
      // QR Entry - user scanned QR from vending machine
      console.log('QR Entry detected:', { machineId, sessionId })
      actions.setEntrySource('qr')
      actions.setVendingMachineSession({
        isVendingMachine: true,
        machineId: machineId,
        sessionId: sessionId,
        deviceId: machineId, // machine_id is the device_id
        sessionStatus: 'active',
        location: location
      })
    } else {
      // Vanilla Entry - user visited website directly
      console.log('Vanilla entry detected')
      actions.setEntrySource('vanilla')
      actions.setVendingMachineSession({
        isVendingMachine: false,
        deviceId: null, // Will use default JMSOOMSZRQO9 on backend
        sessionStatus: null
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Get iPhone 17 Pro Max assets for preview
  const modelName = 'iPhone 17 Pro Max'
  // Original dimensions for MaskedPhoneDisplay (solid color section)
  const maskedPhoneDimensions = useMemo(() => getPhoneDimensions(modelName, 'thumbnail'), [])

  const handleUploadPhoto = () => {
    // Navigate directly to template selection
    // No hardcoded model data - let PhonePreview load from Chinese API
    navigate('/template-selection', {
      state: {
        fromLanding: true
      }
    })
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

        // Add image to centralized state
        actions.addImage(imageData)

        // Navigate to design preview with custom upload flag
        // No hardcoded model data - let DesignPreview load from Chinese API
        navigate('/design-preview', {
          state: {
            imageMode: 'full-background',
            fromCustomUpload: true  // Show "Select Template" button
          }
        })
      } catch (error) {
        console.error('Error uploading image:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleBrowseCollections = () => {
    // Scroll to design section
    designSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const handleCustomize = async (design) => {
    // Clear existing images
    const currentImageCount = appState.uploadedImages.length
    for (let i = 0; i < currentImageCount; i++) {
      actions.removeImage(0)
    }

    // Add design to app state
    if (design.isColor) {
      // Create a solid color canvas
      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 2000
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = design.imageUrl
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Convert to data URL and add to state
      const dataUrl = canvas.toDataURL('image/png')
      actions.addImage(dataUrl)
    } else {
      // Load background image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = design.imageUrl

      await new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/png')
          actions.addImage(dataUrl)
          resolve()
        }
        img.onerror = reject
      })
    }

    // Navigate to design preview screen
    // No hardcoded model data - let DesignPreview load from Chinese API
    navigate('/design-preview', {
      state: {
        imageMode: 'full-background',
        designName: design.designName,
        isColor: design.isColor
      }
    })
  }

  // Intersection Observer to load more packs as user scrolls
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && visiblePacks < designPacks.length) {
            // Load 3 more packs when user reaches bottom
            setVisiblePacks(prev => Math.min(prev + 3, designPacks.length))
          }
        })
      },
      { rootMargin: '200px' } // Start loading 200px before reaching the end
    )

    const sentinel = document.getElementById('pack-load-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [visiblePacks, designPacks.length])

  // Load background designs
  useEffect(() => {
    const loadBackgrounds = async () => {
      const categoryMap = {
        'ABSTRACT': {
          name: 'Abstract Pack',
          files: [
            { filename: 'Dreamscape.webp', displayName: 'Dreamscape' },
            { filename: 'Rainy Day In London.webp', displayName: 'Rainy Day' },
            { filename: 'Serenity.webp', displayName: 'Serenity' },
            { filename: 'Sing Me An Old Fashioned Song.webp', displayName: 'An Old Song' }
          ]
        },
        'ANIMAL_PRINT': {
          name: 'Animal Print Pack',
          subfolder: 'FINAL',
          files: [
            { filename: 'Ethereal Wild.webp', displayName: 'Ethereal Wild' },
            { filename: 'Natures Pulse.webp', displayName: 'Natures Pulse' },
            { filename: 'Stripes and Shadows.webp', displayName: 'Stripes' },
            { filename: 'Wild Instinct.webp', displayName: 'Wild Instinct' }
          ]
        },
        'CATS': {
          name: 'Cats Pack',
          files: [
            { filename: 'Art Cats Society.webp', displayName: 'Cats Society' },
            { filename: 'Dreams of the Cat.webp', displayName: 'Dreams Of Cat' },
            { filename: 'Hello Kitty.webp', displayName: 'Hello Kitty' },
            { filename: 'Whiskers and Wonder.webp', displayName: 'Whiskers' }
          ]
        },
        'DOGS': {
          name: 'Dogs Pack',
          files: [
            { filename: 'Bark and Bloom.webp', displayName: 'Bark And Bloom' },
            { filename: 'Happy Howls.webp', displayName: 'Happy Howls' },
            { filename: 'Paws and Poetry.png', displayName: 'Paws' },
            { filename: 'Woofology.png', displayName: 'Woofology' }
          ]
        },
        'FLORAL': {
          name: 'Floral Pack',
          files: [
            { filename: 'Petals in a Dream.webp', displayName: 'Petals Dream' },
            { filename: 'Sunny Botanica.webp', displayName: 'Sunny Botanica' },
            { filename: 'The Abstract Garden.webp', displayName: 'Garden' },
            { filename: 'Whispers in Color.webp', displayName: 'Color Whispers' }
          ]
        },
        'GRAFITTI': {
          name: 'Graffiti Pack',
          files: [
            { filename: 'Color Chaos.webp', displayName: 'Color Chaos' },
            { filename: 'No Rules Club.webp', displayName: 'No Rules Club' },
            { filename: 'Off the Wall.webp', displayName: 'Off The Wall' },
            { filename: 'Spray and Slay.webp', displayName: 'Spray And Slay' }
          ]
        },
        'HIPHOP': {
          name: 'Hip Hop Pack',
          files: [
            { filename: '808 Dreams.webp', displayName: '808 Dreams' },
            { filename: 'Born to Flex.webp', displayName: 'Born To Flex' },
            { filename: 'Rhythms of the Street.webp', displayName:'Street Rhythms' },
            { filename: 'Sound in Motion.webp', displayName: 'Sound Motion' }
          ]
        },
        'LOVE': {
          name: 'Love Pack',
          files: [
            { filename: 'Love Beyond Form.png', displayName: 'Beyond Form' },
            { filename: 'Love in Fragments.webp', displayName: 'Love Fragments' },
            { filename: 'When Hearts Dream.webp', displayName: 'Dream of Heart' },
            { filename: 'Whispers of a Ladybug.png', displayName: 'Ladybug ' }
          ]
        },
        'MONOCHROME': {
          name: 'Monochrome Pack',
          files: [
            { filename: 'Black Whisper.webp', displayName: 'Black Whisper' },
            { filename: 'Pure Form.webp', displayName: 'Pure Form' },
            { filename: 'The Absence of Color.jpg', displayName: 'Absent Color' },
            { filename: 'The Space Between.webp', displayName: 'Space Between' }
          ]
        },
        'MONSTERS': {
          name: 'Monsters Pack',
          files: [
            { filename: 'Cotton Candy Chaos.webp', displayName: 'Chaos' },
            { filename: 'He Wanted to Be Loved.webp', displayName: 'Joy of Monster' },
            { filename: 'The Kind Monster.webp', displayName: 'Kind Monster' },
            { filename: 'When Monsters Dream.webp', displayName: 'Monster Dream' }
          ]
        },
        'POSITIVE_VIBE': {
          name: 'Positive Vibe Pack',
          zoomX: 0.95,
          zoomY: 1.1,
          files: [
            { filename: 'Be the Sun.webp', displayName: 'Be the Sun' },
            { filename: 'Good Energy Only.webp', displayName: 'Good Energy' },
            { filename: 'Kindness Era.webp', displayName: 'Kindness Era' },
            { filename: 'No Bad Vibes.webp', displayName: 'No Bad Vibes' }
          ]
        },
        'RETRO_POPUP': {
          name: 'Retro Pack',
          files: [
            { filename: 'Everybodys Famous.webp', displayName: 'Pop It Up' },
            { filename: 'Fame Frequency.webp', displayName: 'Frequency' },
            { filename: 'Pop Girl Energy.webp', displayName: 'Pop Girl Energy' },
            { filename: 'The Color Shouts Back.webp', displayName: 'Shout of Color' }
          ]
        },
        'ROCK': {
          name: 'Rock Pack',
          files: [
            { filename: 'Born Loud.webp', displayName: 'Born Loud' },
            { filename: 'Electric Soul.webp', displayName: 'Electric Soul' },
            { filename: 'Rock n Roll Spirit.webp', displayName: 'Rock N Roll' },
            { filename: 'Wild and Wired.webp', displayName: 'Wild And Wired' }
          ]
        },
        'SPACE': {
          name: 'Space Pack',
          files: [
            { filename: 'Born of Supernovas.webp', displayName: 'Supernovas' },
            { filename: 'Dancing with Planets.webp', displayName: 'Planets' },
            { filename: 'ETERNAL VOID.webp', displayName: 'Eternal Void' },
            { filename: 'Interstellar.webp', displayName: 'Interstellar' }
          ]
        },
        'SURREAL': {
          name: 'Surreal Pack',
          files: [
            { filename: 'Eyes That Remember Dreams.webp', displayName: 'Dreamy Eyes' },
            { filename: 'Illusions of Memory.webp', displayName: 'Illusions' },
            { filename: 'SUBCONSCIOUS GARDEN.webp', displayName: 'Subconscious' },
            { filename: 'THE UNREAL THINGS.webp', displayName: 'Unreal Things' }
          ]
        },
        'TECH_LUXE': {
          name: 'Tech Luxe Pack',
          files: [
            { filename: 'CYBER BLOOM.webp', displayName: 'Cyber Bloom' },
            { filename: 'Platinum Mind.jpg', displayName: 'Platinum Mind' },
            { filename: 'Signal Aura.webp', displayName: 'Signal Aura' },
            { filename: 'Silent Code.webp', displayName: 'Silent Code' }
          ]
        }
      }

      const packs = []
      let designId = 1

      for (const [folder, info] of Object.entries(categoryMap)) {
        const designs = []

        for (const file of info.files) {
          const filename = typeof file === 'string' ? file : file.filename
          const displayName = typeof file === 'string' ? file.replace(/\.(webp|jpg|png)$/i, '') : file.displayName
          const pathPrefix = info.subfolder
            ? `/Backgrounds/${folder}/${info.subfolder}`
            : `/Backgrounds/${folder}`

          const design = {
            id: designId++,
            imageUrl: `${pathPrefix}/${filename}`,
            designName: displayName
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

  return (
    <>
      <TopNavBar />
      <div
        style={{
          minHeight: '72vh',
          position: 'relative',
          overflowX: 'hidden',
          margin: 0,
          padding: 0,
          paddingTop: '60px',
          backgroundColor: '#fdfdfd'
        }}
      >
      {/* Navigation Bar - Hidden for now */}
      {/* <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#fdfdfd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 20px',
          gap: '16px',
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
          aria-label="Menu"
        >
          <div style={{ width: '24px', height: '2px', backgroundColor: '#000000' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#000000' }} />
          <div style={{ width: '24px', height: '2px', backgroundColor: '#000000' }} />
        </button>

        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Search"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="#000000" strokeWidth="2"/>
            <path d="M20 20L16.65 16.65" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </nav> */}

      {/* Background Image Section */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          marginTop: '85px',
          backgroundColor: '#fdfdfd'
        }}
      >
        <img
          src="/background.png"
          alt="Background"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '40px 20px',
          backgroundColor: '#fdfdfd'
        }}
      >
        <style>
          {`
            .action-button {
              width: 200px;
              padding: 8px 22px;
              background-color: transparent;
              border: 1px solid #000000;
              border-radius: 100px;
              cursor: pointer;
              transition: background-color 200ms ease-out;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .action-button:hover:not(:disabled) {
              background-color: #000000;
            }

            .action-button:disabled {
              opacity: 0.7;
              cursor: not-allowed;
            }

            .action-button-text {
              font-size: 11px;
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif;
              font-weight: 500;
              color: #000000;
              text-align: center;
              letter-spacing: -0.05em;
              white-space: nowrap;
              transition: color 200ms ease-out;
            }

            .action-button:hover:not(:disabled) .action-button-text {
              color: #FFFFFF;
            }

            @media (min-width: 768px) {
              .action-button {
                width: 250px;
                padding: 10px 30px;
              }
              .action-button-text {
                font-size: 12px;
              }
            }

            @media (min-width: 1024px) {
              .action-button {
                width: 280px;
                padding: 12px 35px;
              }
              .action-button-text {
                font-size: 13px;
              }
            }

            /* Responsive grid for design packs */
            @media (min-width: 1024px) {
              .designs-grid {
                grid-template-columns: repeat(4, 1fr) !important;
                max-width: 1200px !important;
                gap: 20px !important;
              }
            }

            /* Phone preview responsive sizing - smaller on mobile for better resolution */
            .phone-preview-container {
              width: 112px;
              height: 223px;
            }

            .phone-preview-container img {
              image-rendering: auto;
              -webkit-backface-visibility: hidden;
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-font-smoothing: antialiased;
            }

            @media (min-width: 768px) {
              .phone-preview-container {
                width: 128px;
                height: 254px;
              }
            }

            @media (min-width: 1024px) {
              .phone-preview-container {
                width: 160px;
                height: 318px;
              }
            }

            /* Customise button styling */
            .customise-button {
              background-color: transparent;
              border: 1px solid #000000;
              border-radius: 30px;
              padding: 6px 16px;
              cursor: pointer;
              transition: all 200ms ease-out;
            }

            .customise-button:hover {
              background-color: #000000;
            }

            .customise-button-text {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif;
              font-size: 14px;
              color: #333333;
              font-weight: 400;
              letter-spacing: -0.04em;
              transition: color 200ms ease-out;
            }

            .customise-button:hover .customise-button-text {
              color: #FFFFFF;
            }
          `}
        </style>
        {/* Upload My Image Button */}
        <button
          onClick={handleUploadPhoto}
          disabled={isLoading}
          className="action-button"
          aria-label="Upload your own image"
        >
          <span className="action-button-text">
            {isLoading ? 'Processing...' : 'Upload My Image'}
          </span>
        </button>

        {/* Browse Our Collections Button */}
        <button
          onClick={handleBrowseCollections}
          className="action-button"
          aria-label="Browse our collections"
        >
          <span className="action-button-text">
            Our Collections
          </span>
        </button>

        {/* Tagline Text */}
        <div
          style={{
            maxWidth: '800px',
            marginTop: '30px',
            textAlign: 'center',
            padding: '0 20px'
          }}
        >
          <style>
            {`
              .tagline-text {
                font-size: 12px;
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif;
                font-weight: 400;
                color: #333333;
                line-height: 1.6;
                letter-spacing: -0.04em;
                margin: 0;
              }

              @media (min-width: 480px) {
                .tagline-text {
                  font-size: 18px;
                }
              }

              @media (min-width: 640px) {
                .tagline-text {
                  font-size: 20px;
                }
              }

              @media (min-width: 768px) {
                .tagline-text {
                  font-size: 23px;
                }
              }

              @media (min-width: 1024px) {
                .tagline-text {
                  font-size: 25px;
                }
              }
            `}
          </style>
          <p className="tagline-text">
            Because your phone should carry your story:<br />
            instantly, effortlessly, unapologetically you.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Design Packs Section */}
      <div
        ref={designSectionRef}
        style={{
          backgroundColor: '#fdfdfd',
          padding: '30px 20px 40px 20px',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 20,
          marginTop: '0'
        }}
      >
        {/* Solid Colors Pack */}
        <div style={{ marginBottom: '60px', marginTop: '0' }}>
          {/* Category Name */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '30px',
              paddingTop: '0'
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
                Solid Colors Collection
              </span>
            </div>
          </div>

          {/* Single Color Preview with Picker */}
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              {/* Color Preview Phone */}
              <div
                style={{
                  width: `${maskedPhoneDimensions.width}px`,
                  height: `${maskedPhoneDimensions.height}px`,
                  maxWidth: '100%',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  margin: '0 auto'
                }}
              >
                <MaskedPhoneDisplay
                  backgroundColor={customColor}
                  width={maskedPhoneDimensions.width}
                  height={maskedPhoneDimensions.height}
                  modelName={modelName}
                />
              </div>

              {/* Color Info */}
              <div
                style={{
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '8px',
                  paddingLeft: '24px'
                }}
              >
                <div
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                    fontSize: '16px',
                    color: '#333333',
                    marginBottom: '2px',
                    fontWeight: 'normal',
                    letterSpacing: '-0.03em',
                    lineHeight: '1.3'
                  }}
                >
                  Custom Color
                </div>
                <div
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '2px',
                    letterSpacing: '-0.03em',
                    lineHeight: '1.3'
                  }}
                >
                  iPhone 17 Pro Max
                </div>
                <div
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                    fontSize: '12px',
                    color: '#666666',
                    marginBottom: '2px',
                    letterSpacing: '-0.03em',
                    lineHeight: '1.3'
                  }}
                >
                  MagSafe Compatible
                </div>
                <div
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                    fontSize: '12px',
                    color: '#333333',
                    fontWeight: 'bold',
                    lineHeight: '1.3'
                  }}
                >
                  £35.00
                </div>
              </div>

              {/* Color Picker Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px' }}>
                <label
                  htmlFor="colorPicker"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#fdfdfd',
                    border: '1px solid #E5E5E5',
                    borderRadius: '16px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#EBEBEB'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#F5F5F5'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#333333" strokeWidth="2"/>
                    <path d="M12 2C12 2 15 6 15 12C15 18 12 22 12 22" stroke="#333333" strokeWidth="2"/>
                    <path d="M12 2C12 2 9 6 9 12C9 18 12 22 12 22" stroke="#333333" strokeWidth="2"/>
                    <path d="M2 12H22" stroke="#333333" strokeWidth="2"/>
                  </svg>
                  <span
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                      fontSize: '14px',
                      color: '#333333',
                      fontWeight: '400'
                    }}
                  >
                    Pick Color
                  </span>
                  <input
                    id="colorPicker"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    style={{
                      width: '0',
                      height: '0',
                      opacity: 0,
                      position: 'absolute'
                    }}
                  />
                </label>

                {/* Customize Button */}
                <button
                  onClick={() => handleCustomize({ imageUrl: customColor, designName: `Custom ${customColor}`, isColor: true })}
                  className="customise-button"
                >
                  <span className="customise-button-text">
                    Customise
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {designPacks.slice(0, visiblePacks).map((pack, index) => (
          <div key={index} style={{ marginBottom: '60px' }}>
            {/* Category Name */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '30px',
                paddingTop: index === 0 ? '10px' : '0'
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
                  {pack.name.replace(/\s*Pack\s*/gi, ' Collection')}
                </span>
              </div>
            </div>

            {/* Designs Grid - 2 per row on mobile, 4 per row on desktop */}
            <div
              className="designs-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '30px',
                maxWidth: '800px',
                margin: '0 auto'
              }}
            >
              {pack.designs.map((design) => (
                <div
                  key={design.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Design on Phone Preview */}
                  <div
                    className="phone-preview-container"
                    style={{
                      width: `${maskedPhoneDimensions.width}px`,
                      height: `${maskedPhoneDimensions.height}px`,
                      maxWidth: '100%',
                      marginBottom: '16px',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      margin: '0 auto 16px'
                    }}
                  >
                    <MaskedPhoneDisplay
                      image={design.imageUrl}
                      width={maskedPhoneDimensions.width}
                      height={maskedPhoneDimensions.height}
                      modelName={modelName}
                      zoom={design.zoom}
                      zoomX={design.zoomX}
                      zoomY={design.zoomY}
                    />
                  </div>

                  {/* Design Info */}
                  <div
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      marginBottom: '8px',
                      paddingLeft: '24px'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                        fontSize: '16px',
                        color: '#333333',
                        marginBottom: '2px',
                        fontWeight: 'normal',
                        letterSpacing: '-0.03em',
                        lineHeight: '1.3'
                      }}
                    >
                      {design.designName}
                    </div>
                    <div
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                        fontSize: '14px',
                        color: '#666666',
                        marginBottom: '2px',
                        letterSpacing: '-0.03em',
                        lineHeight: '1.3'
                      }}
                    >
                      iPhone 17 Pro Max
                    </div>
                    <div
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                        fontSize: '12px',
                        color: '#666666',
                        marginBottom: '2px',
                        letterSpacing: '-0.03em',
                        lineHeight: '1.3'
                      }}
                    >
                      MagSafe Compatible
                    </div>
                    <div
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                        fontSize: '12px',
                        color: '#333333',
                        fontWeight: 'bold',
                        lineHeight: '1.3'
                      }}
                    >
                      £35.00
                    </div>
                  </div>

                  {/* Customize Button */}
                  <div
                    style={{
                      width: '100%',
                      paddingLeft: '24px'
                    }}
                  >
                    <button
                      onClick={() => handleCustomize(design)}
                      className="customise-button"
                    >
                      <span className="customise-button-text">
                        Customise
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sentinel element for lazy loading */}
        <div id="pack-load-sentinel" style={{ height: '1px' }}></div>

        {/* Loading indicator */}
        {visiblePacks < designPacks.length && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #333333',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}
      </div>
      </div>
    </>
  )
}

export default LandingScreen

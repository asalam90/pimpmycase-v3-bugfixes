import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import aiImageService from '../services/aiImageService'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const GlitchScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand, model, color, template, transform: initialTransform, selectedModelData, deviceId } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Get uploaded image from centralized state
  const uploadedImage = appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null

  const [glitchMode, setGlitchMode] = useState('')
  const [transform, setTransform] = useState(initialTransform || { x: 0, y: 0, scale: 2 })

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)
  const [originalImageFile, setOriginalImageFile] = useState(null)
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)

  // Available modes
  const availableModes = ['Retro', 'Chaos']

  // AI Credits from centralized state
  const aiCredits = appState.aiCredits

  // Convert data URL to File object for AI generation
  useEffect(() => {
    if (uploadedImage && uploadedImage.startsWith('data:')) {
      fetch(uploadedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'uploaded-image.png', { type: 'image/png' })
          setOriginalImageFile(file)
        })
        .catch(err => {
          console.error('Error converting image:', err)
          setError('Failed to process uploaded image')
        })
    }
  }, [uploadedImage])

  /* Image transform helpers */
  const moveLeft = () => setTransform((p) => ({ ...p, x: Math.max(p.x - 5, -50) }))
  const moveRight = () => setTransform((p) => ({ ...p, x: Math.min(p.x + 5, 50) }))
  const moveUp = () => setTransform((p) => ({ ...p, y: Math.max(p.y - 5, -50) }))
  const moveDown = () => setTransform((p) => ({ ...p, y: Math.min(p.y + 5, 50) }))
  const zoomIn = () => setTransform((p) => ({ ...p, scale: Math.min(p.scale + 0.1, 5) }))
  const zoomOut = () => setTransform((p) => ({ ...p, scale: Math.max(p.scale - 0.1, 0.5) }))
  const resetTransform = () => setTransform({ x: 0, y: 0, scale: 2 })

  const handleBack = () => {
    navigate('/phone-preview', {
      state: {
        brand,
        model,
        color,
        template,
        uploadedImage,
        transform,
        selectedModelData,
        deviceId
      }
    })
  }

  const handleGenerate = async () => {
    if (appState.aiCredits <= 0 || !originalImageFile || !glitchMode) return

    setIsGenerating(true)
    setError(null)

    try {
      await aiImageService.checkHealth()
      const result = await aiImageService.generateGlitchPro(glitchMode, originalImageFile, 'low')

      if (result.success) {
        const generatedImageUrl = aiImageService.getImageUrl(result.filename, result)
        setGeneratedImage(generatedImageUrl)
        actions.deductAiCredit()
      } else {
        throw new Error('Generation failed')
      }
    } catch (err) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateClick = () => {
    if (appState.aiCredits <= 0) return
    setShowRegenerateDialog(true)
  }

  const handleRegenerateConfirm = async () => {
    setShowRegenerateDialog(false)
    if (appState.aiCredits <= 0 || !originalImageFile || !glitchMode) return

    setGeneratedImage(null)
    setIsGenerating(true)
    setError(null)

    try {
      await aiImageService.checkHealth()
      const result = await aiImageService.generateGlitchPro(glitchMode, originalImageFile, 'low')

      if (result.success) {
        const generatedImageUrl = aiImageService.getImageUrl(result.filename, result)
        setGeneratedImage(generatedImageUrl)
        actions.deductAiCredit()
      } else {
        throw new Error('Generation failed')
      }
    } catch (err) {
      setError(err.message || 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinue = () => {
    // Replace the uploaded image with the generated image in centralized state
    if (generatedImage) {
      // Remove old uploaded image
      if (appState.uploadedImages.length > 0) {
        actions.removeImage(0)
      }
      // Add generated image as the new uploaded image
      actions.addImage(generatedImage)
    }

    navigate('/add-stickers', {
      state: {
        brand,
        model,
        color,
        template,
        uploadedImages: [generatedImage],
        imageTransforms: [transform],
        selectedModelData,
        deviceId
      }
    })
  }

  /* --------------------------------------------------------------------
   * RENDER HELPERS
   * ------------------------------------------------------------------*/
  const ControlButton = ({ Icon, action }) => (
    <button
      onClick={action}
      disabled={!uploadedImage}
      className={`w-10 h-10 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${uploadedImage ? 'bg-white border border-gray-300 hover:bg-gray-50' : 'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
    >
      <Icon size={18} className={uploadedImage ? 'text-gray-700' : 'text-gray-400'} />
    </button>
  )

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Back arrow */}
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

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center px-6 mt-2">
        {/* Header */}
        <div className="flex items-center justify-center p-4 w-full">
          <h1 style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif', fontWeight: 400, color: '#5d5d5d', fontSize: '24px', textTransform: 'uppercase', letterSpacing: '0' }}>Glitch Pro</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm text-center max-w-xs">
            {error}
          </div>
        )}

        {/* PHONE PREVIEW */}
        <div style={{ position: 'relative' }}>
          <MaskedPhoneDisplay
            image={generatedImage || uploadedImage}
            transform={transform}
            width={288}
            height={480}
            modelName={selectedModelData?.model_name || model}
            className="mb-4"
          >
            {isGenerating && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="text-white text-sm">Generating...</div>
              </div>
            )}
          </MaskedPhoneDisplay>
        </div>

        {/* CONTROLS ROW */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          {[
            { icon: ZoomOut, action: zoomOut },
            { icon: ZoomIn, action: zoomIn },
            { icon: RefreshCw, action: resetTransform },
            { icon: ArrowRight, action: moveRight },
            { icon: ArrowLeft, action: moveLeft },
            { icon: ArrowDown, action: moveDown },
            { icon: ArrowUp, action: moveUp },
          ].map(({ icon: Icon, action }, idx) => (
            <ControlButton key={idx} Icon={Icon} action={action} />
          ))}
        </div>

        {/* Mode Selection */}
        <div className="w-full flex flex-col items-center mb-3">
          <div className="flex items-center w-72 justify-center mx-auto">
            <select
              value={glitchMode}
              onChange={(e) => setGlitchMode(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-2xl px-4 py-3 text-center text-base text-black focus:outline-none focus:border-gray-400 transition-colors"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif', fontWeight: 500 }}
            >
              <option value="" disabled>Select Glitch Mode</option>
              {availableModes.map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
            <button
              onClick={generatedImage ? handleRegenerateClick : handleGenerate}
              disabled={!glitchMode || appState.aiCredits <= 0 || !originalImageFile}
              className={`flex-shrink-0 w-10 h-10 rounded-2xl border border-gray-300 flex items-center justify-center active:scale-95 transition-transform ml-2 ${
                glitchMode && appState.aiCredits > 0 && originalImageFile ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
              }`}
            >
              <RefreshCw size={18} className={`${glitchMode && appState.aiCredits > 0 && originalImageFile ? 'text-gray-700' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>

        {/* Generate Button */}
        {!generatedImage && (
          <div className="w-full max-w-xs mb-4 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={appState.aiCredits === 0 || isGenerating || !glitchMode || !originalImageFile}
              style={{
                width: '200px',
                padding: '8px 22px',
                backgroundColor: 'transparent',
                border: '1px solid #000000',
                borderRadius: '100px',
                cursor: appState.aiCredits === 0 || isGenerating || !glitchMode || !originalImageFile ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: appState.aiCredits === 0 || isGenerating || !glitchMode || !originalImageFile ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (appState.aiCredits > 0 && !isGenerating && glitchMode && originalImageFile) {
                  e.currentTarget.style.backgroundColor = '#000000'
                  const span = e.currentTarget.querySelector('span')
                  if (span) span.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (appState.aiCredits > 0 && !isGenerating && glitchMode && originalImageFile) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  const span = e.currentTarget.querySelector('span')
                  if (span) span.style.color = '#000000'
                }
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontWeight: '500',
                  color: '#000000',
                  letterSpacing: '0.5px',
                  transition: 'color 200ms ease-out'
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </span>
            </button>
          </div>
        )}

        {/* Regenerate Button - only show if image has been generated */}
        {generatedImage && (
          <div className="w-full max-w-xs mb-4 flex justify-center">
            <button
              onClick={handleRegenerateClick}
              disabled={appState.aiCredits === 0 || isGenerating}
              style={{
                width: '200px',
                padding: '8px 22px',
                backgroundColor: 'transparent',
                border: '1px solid #000000',
                borderRadius: '100px',
                cursor: appState.aiCredits === 0 || isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: appState.aiCredits === 0 || isGenerating ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (appState.aiCredits > 0 && !isGenerating) {
                  e.currentTarget.style.backgroundColor = '#000000'
                  const span = e.currentTarget.querySelector('span')
                  if (span) span.style.color = '#FFFFFF'
                }
              }}
              onMouseLeave={(e) => {
                if (appState.aiCredits > 0 && !isGenerating) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  const span = e.currentTarget.querySelector('span')
                  if (span) span.style.color = '#000000'
                }
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontWeight: '500',
                  color: '#000000',
                  letterSpacing: '0.5px',
                  transition: 'color 200ms ease-out'
                }}
              >
                {isGenerating ? 'Regenerating...' : 'Regenerate'}
              </span>
            </button>
          </div>
        )}

        {/* Continue Button - only show if image has been generated */}
        {generatedImage && (
          <div className="w-full max-w-xs mb-4 flex justify-center">
            <button
              onClick={handleContinue}
              style={{
                width: '200px',
                padding: '8px 22px',
                backgroundColor: 'transparent',
                border: '1px solid #000000',
                borderRadius: '100px',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#000000'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontWeight: '500',
                  color: '#000000',
                  letterSpacing: '0.5px',
                  transition: 'color 200ms ease-out'
                }}
              >
                Continue
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Regenerate Confirmation Dialog */}
      {showRegenerateDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowRegenerateDialog(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                fontSize: '18px',
                fontWeight: '600',
                color: '#000000',
                marginBottom: '12px',
                textAlign: 'center'
              }}
            >
              Regenerate Image?
            </h3>
            <p
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                fontSize: '14px',
                color: '#666666',
                marginBottom: '20px',
                textAlign: 'center',
                lineHeight: '1.5'
              }}
            >
              This will use 1 AI credit. You have {aiCredits} credit{aiCredits !== 1 ? 's' : ''} remaining.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowRegenerateDialog(false)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #000000',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#000000',
                  transition: 'all 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateConfirm}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  backgroundColor: '#000000',
                  border: '1px solid #000000',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#FFFFFF',
                  transition: 'all 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#333333'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#000000'
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlitchScreen

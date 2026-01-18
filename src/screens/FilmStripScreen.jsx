import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useAppState } from '../contexts/AppStateContext'

const FilmStripScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { brand, model, color, template, imageTransforms: navImageTransforms, imageOrientations, stripCount: incomingStripCount, selectedModelData, deviceId } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Get uploaded images from centralized state
  const uploadedImages = appState.uploadedImages

  // Use centralized transform state with fallback to navigation state
  const imageTransforms = appState.imageTransforms?.length > 0
    ? appState.imageTransforms
    : (navImageTransforms || [])

  // keep track of user flow
  const [stripCount, setStripCount] = useState(incomingStripCount || null) // 3 or 4

  const handleChooseStrip = (count) => {
    setStripCount(count)
    
    // If we have uploaded images and the new count is less than current images,
    // we need to clear the excess images
    if (uploadedImages && uploadedImages.length > 0) {
      const currentImageCount = uploadedImages.filter(img => img).length
      if (count < currentImageCount) {
        // Clear excess images by navigating with reduced data
        const reducedImages = uploadedImages.slice(0, count)
        const reducedTransforms = imageTransforms ? imageTransforms.slice(0, count) : []
        const reducedOrientations = imageOrientations ? imageOrientations.slice(0, count) : []
        
        navigate('/film-strip', {
          state: {
            brand,
            model,
            color,
            template,
            stripCount: count,
            uploadedImages: reducedImages,
            imageTransforms: reducedTransforms,
            imageOrientations: reducedOrientations
          }
        })
      }
    }
  }

  const handleBack = () => {
    // go back to template selection
    navigate('/template-selection', {
      state: { brand, model, color, selectedModelData, deviceId }
    })
  }

  const handleNext = () => {
    navigate('/film-strip-upload', {
      state: {
        brand,
        model,
        color,
        template,
        stripCount,
        uploadedImages,
        imageTransforms,
        imageOrientations,
        selectedModelData,
        deviceId
      }
    })
  }

  const resetInputs = () => {
    setStripCount(null)
    // Clear uploaded images when resetting
    navigate('/film-strip', {
      state: { brand, model, color, template }
    })
  }

  const canSubmit = !!stripCount

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <button
          onClick={handleBack}
          className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        {/* Center placeholder to maintain spacing */}
        <div className="flex-1"></div>
        <div className="w-12 h-12" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 mt-4">
        {/* Phone Case Preview */}
        <div className="relative mb-6">
          <div
            className="relative"
            style={{
              width: '288px',
              height: '480px'
            }}
          >
            {/* Phone Back Image - Base layer */}
            <div className="absolute inset-0">
              <img
                src={`${import.meta.env.BASE_URL}Phone backs/iphone15.png`}
                alt="Phone back"
                className="w-full h-full object-contain"
              />
            </div>

            {/* User's filmstrip content - Masked using SVG mask */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="filmstripMask">
                  <image
                    href={`${import.meta.env.BASE_URL}masks/iphone15's mask.png`}
                    x="8%"
                    y="0"
                    width="85%"
                    height="100%"
                    preserveAspectRatio="none"
                  />
                </mask>
              </defs>
              <foreignObject width="100%" height="100%" mask="url(#filmstripMask)">
                <div className="w-full h-full flex flex-col justify-center items-center px-8 py-12">
                  {Array.from({ length: stripCount || 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-full mb-2 overflow-hidden bg-gray-200/50"
                      style={{
                        height: `${100 / (stripCount || 3) - 2}%`,
                        aspectRatio: '4/3'
                      }}
                    >
                      {uploadedImages && uploadedImages[idx] ? (
                        <img
                          src={uploadedImages[idx]}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${imageTransforms?.[idx]?.x || 50}% ${imageTransforms?.[idx]?.y || 50}%`,
                            transform: `scale(${imageTransforms?.[idx]?.scale || 1})`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Frame {idx + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </foreignObject>
            </svg>

            {/* Filmstrip overlay on top */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              <img
                src={`${import.meta.env.BASE_URL}filmstrip.png`}
                alt="Film strip overlay"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Upload Status Indicator */}
        {uploadedImages && uploadedImages.length > 0 && (
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">
              Images uploaded: {uploadedImages.filter(img => img).length}/{stripCount || 3}
            </div>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadedImages.filter(img => img).length / (stripCount || 3)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Control Buttons Row */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          {[ZoomOut, ZoomIn, RefreshCw, ArrowRight, ArrowLeft, ArrowDown, ArrowUp].map((Icon, idx) => (
            <button
              key={idx}
              className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icon size={20} className="text-gray-700" />
            </button>
          ))}
        </div>

        {/* Choose strip buttons */}
        <div className="flex flex-col w-full max-w-xs mb-6 space-y-3">
          <button
            onClick={() => handleChooseStrip(3)}
            className={`w-full py-3 rounded-2xl text-base font-medium transition-transform active:scale-95 ${stripCount === 3 ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Choose 3 image strip
          </button>
          <button
            onClick={() => handleChooseStrip(4)}
            className={`w-full py-3 rounded-2xl text-base font-medium transition-transform active:scale-95 ${stripCount === 4 ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Choose 4 image strip
          </button>
        </div>

        {/* Reset Inputs Button */}
        {stripCount && (
          <button
            onClick={resetInputs}
            className="w-full max-w-xs bg-white border border-gray-300 text-gray-800 font-medium py-3 px-6 rounded-2xl text-center active:scale-95 transition-transform mb-4"
          >
            Reset Inputs
          </button>
        )}
      </div>

      {/* Submit Button */}
      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!canSubmit}
          className={`px-8 py-3 rounded-2xl transition-transform font-medium ${
            canSubmit
              ? 'bg-black text-white active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default FilmStripScreen 

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import aiImageService from '../services/aiImageService'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const CoverShootGenerateScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, actions } = useAppState()
  const {
    brand,
    model,
    color,
    template,
    uploadedImage: uploadedImageFromState,
    selectedStyle,
    transform: initialTransform,
    selectedModelData,
    deviceId
  } = location.state || {}

  // CRITICAL FIX: Fall back to centralized state if location.state doesn't have the image
  const uploadedImage = uploadedImageFromState || (state.uploadedImages.length > 0 ? state.uploadedImages[0] : null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [originalImageFile, setOriginalImageFile] = useState(null)
  const [error, setError] = useState(null)
  const [transform, setTransform] = useState(initialTransform || { x: 0, y: 0, scale: 2 })

  /* -------- transform helpers ---------- */
  const moveLeft = () => setTransform((p)=>({...p,x:Math.max(p.x-5,-50)}))
  const moveRight = () => setTransform((p)=>({...p,x:Math.min(p.x+5,50)}))
  const moveUp = () => setTransform((p)=>({...p,y:Math.max(p.y-5,-50)}))
  const moveDown = () => setTransform((p)=>({...p,y:Math.min(p.y+5,50)}))
  const zoomIn = () => setTransform((p)=>({...p,scale:Math.min(p.scale+0.1,5)}))
  const zoomOut = () => setTransform((p)=>({...p,scale:Math.max(p.scale-0.1,0.5)}))
  const resetTransform = () => setTransform({x:0,y:0,scale:2})

  /* ---- setup original file ---- */
  useEffect(()=>{
    if(uploadedImage && uploadedImage.startsWith('data:')){
      fetch(uploadedImage)
        .then(res=>res.blob())
        .then(blob=>setOriginalImageFile(new File([blob],'uploaded-image.png',{type:'image/png'})))
        .catch(()=>setError('Failed to process image'))
    }
  },[uploadedImage])

  /* navigation */
  const handleBack = () => {
    navigate('/cover-shoot',{
      state:{brand,model,color,template,uploadedImage,selectedStyle,transform}
    })
  }

  /* regenerate */
  const handleRegenerate = async () => {
    if(state.aiCredits<=0 || !originalImageFile) return
    setIsGenerating(true)
    setError(null)
    try{
      console.log('🔄 Starting health check...')
      await aiImageService.checkHealth()
      console.log('✅ Health check passed, generating image...')
      const result = await aiImageService.generateCoverShoot(selectedStyle, originalImageFile, 'low')
      if(result.success){
        setGeneratedImage(aiImageService.getImageUrl(result.filename, result))
        actions.deductAiCredit()
        console.log('✅ Image generated successfully')
      } else {
        throw new Error('Generation failed')
      }
    }catch(err){
      console.error('❌ Generation error:', err)
      let errorMessage = 'Failed to generate image'
      
      // Provide specific error messages based on error type
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_CONNECTION_TIMED_OUT')) {
        errorMessage = 'Cannot connect to AI server. Please make sure the API server is running on port 8000.'
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Connection blocked by browser. Please check CORS configuration.'
      } else if (err.message.includes('API key')) {
        errorMessage = 'OpenAI API key error. Please check your API key configuration.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }finally{
      setIsGenerating(false)
    }
  }

  const handleGenerate = () => {
    navigate('/text-input',{
      state:{brand,model,color,template,uploadedImages:[generatedImage||uploadedImage],transform,imageTransforms:[transform],selectedModelData,deviceId}
    })
  }

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* header */}
      <div className="relative z-10 flex items-center justify-center p-4">
        <button onClick={handleBack} style={{
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
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif', fontWeight: 700, fontSize: '24px', color: '#000000' }}>Cover Shoot</h1>
      </div>

      {/* main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm text-center max-w-xs">{error}</div>}

        <div
          style={{
            width: '250px',
            height: '416px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <MaskedPhoneDisplay
            image={generatedImage || uploadedImage}
            width={250}
            height={416}
            modelName={selectedModelData?.model_name || model}
          >
              {isGenerating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <div className="text-white text-sm">Generating…</div>
                </div>
              )}
              {!generatedImage && !uploadedImage && (
                <div className="absolute inset-0 flex items-center justify-center z-10 text-gray-400">
                  <div className="text-center">
                    <Upload size={48} className="mx-auto mb-3" />
                    <p className="text-sm">Upload an image</p>
                  </div>
                </div>
              )}
            </MaskedPhoneDisplay>
        </div>

        {/* controls */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          {[{Icon:ZoomOut,action:zoomOut},{Icon:ZoomIn,action:zoomIn},{Icon:RefreshCw,action:resetTransform},{Icon:ArrowRight,action:moveRight},{Icon:ArrowLeft,action:moveLeft},{Icon:ArrowDown,action:moveDown},{Icon:ArrowUp,action:moveUp}].map(({Icon,action},idx)=>(<button key={idx} onClick={action} disabled={isGenerating||(!generatedImage&&!uploadedImage)} className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-transform ${isGenerating?'bg-gray-100 border border-gray-200 cursor-not-allowed':'bg-white border border-gray-300 hover:bg-gray-50'}`}><Icon size={20} className="text-gray-700"/></button>))}
        </div>

        {/* credits row */}
        <div className="flex items-center w-full max-w-sm mb-6 px-2">
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-gray-600"/>
          </button>
          <div className="flex flex-col flex-grow mx-2 space-y-2">
            <div className="w-full py-2 rounded-2xl text-sm font-semibold bg-white border border-gray-300 text-gray-800 text-center whitespace-nowrap" style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}>AI CREDITS REMAINING: {state.aiCredits}</div>
            <button onClick={handleRegenerate} disabled={state.aiCredits===0||isGenerating} className={`w-full py-2 rounded-2xl text-sm font-semibold text-white active:scale-95 ${state.aiCredits===0||isGenerating?'bg-gray-300':'bg-black'}`} style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}>{isGenerating?'Generating...':'GENERATE IMAGE'}</button>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!generatedImage}
            className={`w-12 h-12 rounded-2xl border border-gray-300 flex items-center justify-center ${
              generatedImage ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={24} className={`${generatedImage ? 'text-gray-600' : 'text-gray-400'}`}/>
          </button>
        </div>
      </div>

      {/* Generate/Submit button */}
      <div className="relative z-10 p-6 flex justify-center">
        <button
          onClick={generatedImage ? handleGenerate : handleRegenerate}
          disabled={state.aiCredits===0||isGenerating}
          className={`px-8 py-3 rounded-2xl text-white active:scale-95 transition-transform font-medium ${state.aiCredits===0||isGenerating?'bg-gray-300 text-gray-500 cursor-not-allowed':'bg-black'}`}
          style={{ fontFamily: 'Futura, sans-serif', fontWeight: 500 }}
        >
          <span>{generatedImage ? 'Submit' : 'Generate'}</span>
        </button>
      </div>
    </div>
  )
}

export default CoverShootGenerateScreen 

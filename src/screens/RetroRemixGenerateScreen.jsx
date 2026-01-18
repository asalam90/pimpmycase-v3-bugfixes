import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft as ArrowL, Upload, ZoomIn, ZoomOut, RefreshCw, ArrowRight, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import aiImageService from '../services/aiImageService'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'

const RetroRemixGenerateScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, actions } = useAppState()
  const {
    brand,
    model,
    color,
    template,
    uploadedImage: uploadedImageFromState,
    keyword = '',
    optionalText = '',
    transform: initialTransform,
    generatedImage: initialGeneratedImage,
    selectedModelData,
    deviceId
  } = location.state || {}

  // CRITICAL FIX: Fall back to centralized state if location.state doesn't have the image
  const uploadedImage = uploadedImageFromState || (state.uploadedImages.length > 0 ? state.uploadedImages[0] : null)

  const [isGenerating,setIsGenerating] = useState(false)
  const [generatedImage,setGeneratedImage] = useState(initialGeneratedImage || null)
  const [originalImageFile,setOriginalImageFile] = useState(null)
  const [error,setError] = useState(null)
  const [transform,setTransform] = useState(initialTransform||{x:0,y:0,scale:2})
  const modelName = selectedModelData?.model_name || model

  /* transform helpers */
  const moveLeft = () => setTransform((p)=>({...p,x:Math.max(p.x-5,-50)}))
  const moveRight = () => setTransform((p)=>({...p,x:Math.min(p.x+5,50)}))
  const moveUp = () => setTransform((p)=>({...p,y:Math.max(p.y-5,-50)}))
  const moveDown = () => setTransform((p)=>({...p,y:Math.min(p.y+5,50)}))
  const zoomIn = () => setTransform((p)=>({...p,scale:Math.min(p.scale+0.1,5)}))
  const zoomOut = () => setTransform((p)=>({...p,scale:Math.max(p.scale-0.1,0.5)}))
  const resetTransform = () => setTransform({x:0,y:0,scale:2})

  /* file setup */
  useEffect(()=>{
    if(uploadedImage && uploadedImage.startsWith('data:')){
      fetch(uploadedImage).then(res=>res.blob()).then(blob=>setOriginalImageFile(new File([blob],'uploaded-image.png',{type:'image/png'}))).catch(()=>setError('Failed to process image'))
    }
  },[uploadedImage])

  const handleBack = () => {
    navigate('/retro-remix',{
      state:{brand,model,color,template,uploadedImage,keyword,optionalText,transform,generatedImage}
    })
  }

  const handleRegenerate = async () => {
    if(state.aiCredits<=0 || !originalImageFile) return
    setIsGenerating(true)
    setError(null)
    try{
      await aiImageService.checkHealth()
      const result = await aiImageService.generateRetroRemix(keyword,optionalText,originalImageFile,'low')
      if(result.success){
        setGeneratedImage(aiImageService.getImageUrl(result.filename, result))
        actions.deductAiCredit()
      } else {
        throw new Error('Generation failed')
      }
    }catch(err){
      setError(err.message||'Failed to generate image')
    }finally{
      setIsGenerating(false)
    }
  }

  const handleGenerate = () => {
    navigate('/text-input',{
      state:{brand,model,color,template,uploadedImages:[generatedImage||uploadedImage],generatedImage,keyword,optionalText,transform,imageTransforms:[transform],selectedModelData,deviceId}
    })
  }

  return (
    <div className="screen-container" style={{ backgroundColor: '#fdfdfd' }}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
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
        <div className="w-12 h-12"></div>
      </div>
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
        {/* Control Buttons Row */}
        <div className="flex items-center justify-center gap-2.5 mb-6 px-4">
          {[{Icon:ZoomOut,action:zoomOut},{Icon:ZoomIn,action:zoomIn},{Icon:RefreshCw,action:resetTransform},{Icon:ArrowRight,action:moveRight},{Icon:ArrowL,action:moveLeft},{Icon:ArrowDown,action:moveDown},{Icon:ArrowUp,action:moveUp}].map(({Icon,action},idx)=>(
            <button
              key={idx}
              onClick={action}
              disabled={isGenerating||(!generatedImage&&!uploadedImage)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all ${(generatedImage||uploadedImage)&&!isGenerating?'bg-white border border-gray-300 hover:bg-gray-50':'bg-gray-100 border border-gray-200 cursor-not-allowed'}`}
            >
              <Icon size={20} className={(generatedImage||uploadedImage)&&!isGenerating?'text-gray-700':'text-gray-400'}/>
            </button>
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-between w-full max-w-xs mb-6 px-2">
          <button
            onClick={handleBack}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-300 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <button
            onClick={handleGenerate}
            disabled={!generatedImage}
            className={`w-12 h-12 rounded-2xl border border-gray-300 flex items-center justify-center active:scale-95 transition-transform ${
              generatedImage ? 'bg-white cursor-pointer' : 'bg-gray-100 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={24} className={`${generatedImage ? 'text-gray-600' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* AI Credits Display */}
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: '1px solid #333333',
            borderRadius: '24px'
          }}
        >
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333333',
              letterSpacing: '0.5px'
            }}
          >
            AI CREDITS REMAINING: {state.aiCredits}
          </span>
        </div>

        {/* Generate Button */}
        <div className="w-full max-w-xs mb-4 flex justify-center">
          <button
            onClick={handleRegenerate}
            disabled={state.aiCredits === 0 || isGenerating}
            style={{
              width: '200px',
              padding: '8px 22px',
              backgroundColor: 'transparent',
              border: '1px solid #000000',
              borderRadius: '100px',
              cursor: state.aiCredits === 0 || isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: state.aiCredits === 0 || isGenerating ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (state.aiCredits > 0 && !isGenerating) {
                e.currentTarget.style.backgroundColor = '#000000'
                const span = e.currentTarget.querySelector('span')
                if (span) span.style.color = '#FFFFFF'
              }
            }}
            onMouseLeave={(e) => {
              if (state.aiCredits > 0 && !isGenerating) {
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
                textTransform: 'uppercase',
                transition: 'color 200ms ease-out'
              }}
            >
              {isGenerating ? 'GENERATING...' : 'GENERATE IMAGE'}
            </span>
          </button>
        </div>
      </div>
      {/* Submit Button (removed - using navigation arrows instead) */}
    </div>
  )
}

export default RetroRemixGenerateScreen 

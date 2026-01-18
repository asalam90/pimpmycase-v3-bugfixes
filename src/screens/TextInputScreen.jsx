import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import OptimizedDraggableText from '../components/OptimizedDraggableText'
import OptimizedDraggableSticker from '../components/OptimizedDraggableSticker'
import { useMaskedBounds } from '../hooks/useMaskedBounds'
import { usePinchToScale } from '../hooks/usePinchToScale'

const CUSTOM_FONTS = [
  // Bold & Impact Fonts
  { name: 'Black Ops', family: '"Black Ops One", cursive' },
  { name: 'Bebas Neue', family: '"Bebas Neue", cursive' },
  { name: 'Anton', family: '"Anton", sans-serif' },
  { name: 'Archivo Black', family: '"Archivo Black", sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },

  // Artistic & Creative
  { name: 'Monoton', family: '"Monoton", cursive' },
  { name: 'Bungee Shade', family: '"Bungee Shade", cursive' },
  { name: 'Fascinate', family: '"Fascinate", cursive' },
  { name: 'Wallpoet', family: '"Wallpoet", cursive' },
  { name: 'Nosifer', family: '"Nosifer", cursive' },

  // Retro & Vintage
  { name: 'Abril Fatface', family: '"Abril Fatface", cursive' },
  { name: 'Righteous', family: '"Righteous", cursive' },
  { name: 'Bungee', family: '"Bungee", cursive' },
  { name: 'Turret Road', family: '"Turret Road", cursive' },
  { name: 'VT323', family: '"VT323", monospace' },

  // Graffiti & Street Style
  { name: 'Permanent Marker', family: '"Permanent Marker", cursive' },
  { name: 'Graffiti', family: '"Covered By Your Grace", cursive' },
  { name: 'Shadows', family: '"Shadows Into Light", cursive' },
  { name: 'Indie Flower', family: '"Indie Flower", cursive' },
  { name: 'Kalam', family: '"Kalam", cursive' },

  // Playful & Fun
  { name: 'Luckiest Guy', family: '"Luckiest Guy", cursive' },
  { name: 'Fredoka One', family: '"Fredoka One", cursive' },
  { name: 'Bangers', family: '"Bangers", cursive' },
  { name: 'Chewy', family: '"Chewy", cursive' },
  { name: 'Titan One', family: '"Titan One", cursive' },

  // Elegant Script
  { name: 'Pacifico', family: '"Pacifico", cursive' },
  { name: 'Dancing Script', family: '"Dancing Script", cursive' },
  { name: 'Satisfy', family: '"Satisfy", cursive' },
  { name: 'Yellowtail', family: '"Yellowtail", cursive' },
  { name: 'Kaushan Script', family: '"Kaushan Script", cursive' },

  // Modern & Futuristic
  { name: 'Orbitron', family: '"Orbitron", monospace' },
  { name: 'Audiowide', family: '"Audiowide", cursive' },
  { name: 'Russo One', family: '"Russo One", sans-serif' },
  { name: 'Exo 2', family: '"Exo 2", sans-serif' },
  { name: 'Saira Stencil', family: '"Saira Stencil One", cursive' }
]

const TextInputScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedModelData, deviceId, imageMode, brand, model, uploadedImages: navImages, imageTransforms: navImageTransforms } = location.state || {}
  const { state: appState, actions } = useAppState()

  // Use images from navigation state if available, otherwise from appState
  const uploadedImages = navImages || appState.uploadedImages || []

  // Use centralized transform state with fallback to navigation state
  const imageTransforms = appState.imageTransforms?.length > 0
    ? appState.imageTransforms
    : (navImageTransforms || (location.state?.transform ? [location.state.transform] : [{ x: 0, y: 0, scale: 2.5 }]))

  const [textElements, setTextElements] = useState([])
  const textElementsRef = useRef(textElements)
  const [hasUnconfirmedText, setHasUnconfirmedText] = useState(false)
  const [inputText, setInputText] = useState('')

  useEffect(() => {
    textElementsRef.current = textElements
  }, [textElements])
  const caretPositionsRef = useRef({})
  const [selectedFont, setSelectedFont] = useState(CUSTOM_FONTS[0])
  const [selectedColor, setSelectedColor] = useState('#FFFFFF')
  const [selectedTextId, setSelectedTextId] = useState(null)

  const overlayRef = useRef(null)
  const fontScrollRef = useRef(null)

  // Use optimized maskedBounds hook with ResizeObserver
  const maskedBounds = useMaskedBounds(overlayRef)

  // Get container rect for optimized text positioning
  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  const handleFontScroll = (direction) => {
    if (fontScrollRef.current) {
      const scrollAmount = 120
      fontScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }


  const handleBack = () => {
    // Use navigate(-1) to go back to the previous screen (either PhonePreview or AddStickers)
    navigate(-1)
  }

  const handleReset = () => {
    const confirmed = window.confirm('This will undo all changes and return to the landing page. Are you sure?')
    if (confirmed) {
      // Clear localStorage
      localStorage.removeItem('pimpMyCase_state')

      // Reset app state
      actions.resetState()

      // Navigate to landing page
      navigate('/')
    }
  }

  const handleContinue = () => {
    console.log('handleContinue clicked!')
    const validTextElements = textElements.filter(text => text.text && text.text.trim())

    console.log('Navigating to /add-ons with state:', {
      selectedModelData,
      deviceId,
      imageMode,
      brand,
      model,
      textElements: validTextElements,
      uploadedImages: uploadedImages.length
    })

    navigate('/add-ons', {
      state: {
        ...location.state, // Forward template and other state
        selectedModelData,
        deviceId,
        imageMode,
        brand,
        model,
        textElements: validTextElements,
        uploadedImages, // Pass images forward
        // Use centralized transform state
        transform: appState.transform,
        imageTransforms: appState.imageTransforms
      }
    })
  }

  // Handle text double-click to edit
  const handleTextDoubleClick = (textId, event) => {
    event.stopPropagation()
    setTextElements(prev => prev.map(text =>
      text.id === textId
        ? { ...text, isEditing: true }
        : { ...text, isEditing: false }
    ))
    setSelectedTextId(textId)

    setTimeout(() => {
      const element = document.querySelector(`[data-text-id="${textId}"]`)
      if (element) {
        // Set direction explicitly
        element.setAttribute('dir', 'ltr')
        element.focus()

        // Move cursor to end of text
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(element)
        range.collapse(false) // collapse to end
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }, 10)
  }

  // Handle text content change
  const handleTextChange = (textId, content, target) => {
    const selection = window.getSelection()
    if (selection && target.contains(selection.anchorNode)) {
      caretPositionsRef.current[textId] = {
        offset: selection.anchorOffset,
        focusOffset: selection.focusOffset
      }
    }

    setTextElements(prev => prev.map(text =>
      text.id === textId ? { ...text, text: content } : text
    ))

    requestAnimationFrame(() => {
      try {
        const element = document.querySelector(`[data-text-id="${textId}"]`)
        if (!element) {
          console.warn(`Text element ${textId} not found during caret recovery`)
          return
        }

        const textNode = element.firstChild
        if (!textNode || !textNode.textContent) {
          return
        }

        const saved = caretPositionsRef.current[textId]
        const length = textNode.textContent.length

        const start = Math.min(
          Math.min(saved?.offset ?? length, saved?.focusOffset ?? length),
          length
        )
        const end = Math.min(
          Math.max(saved?.offset ?? length, saved?.focusOffset ?? length),
          length
        )

        const range = document.createRange()
        range.setStart(textNode, start)
        range.setEnd(textNode, end)

        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      } catch (error) {
        console.error('Error recovering caret position:', error)
        // Silent fail - don't crash the app
      }
    })
  }

  // Handle text blur
  const handleTextBlur = (textId) => {
    delete caretPositionsRef.current[textId]
    setTextElements(prev => prev.map(text =>
      text.id === textId ? { ...text, isEditing: false } : text
    ))
  }

  // Handle enter key
  const handleKeyDown = (textId, e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const element = document.querySelector(`[data-text-id="${textId}"]`)
      if (element) {
        element.blur()
      }
    }
  }

  // Sync input text with selected text element (only when selection changes)
  const prevSelectedIdRef = useRef(null)
  useEffect(() => {
    if (selectedTextId !== prevSelectedIdRef.current) {
      if (selectedTextId) {
        const selectedText = textElements.find(text => text.id === selectedTextId)
        if (selectedText) {
          setInputText(selectedText.text)
        }
      }
      prevSelectedIdRef.current = selectedTextId
    }
  }, [selectedTextId, textElements])

  // Handle move (optimized for direct manipulation)
  const handleTextMove = (textId, newX, newY) => {
    setTextElements((prev) =>
      prev.map((text) =>
        text.id === textId
          ? { ...text, position: { x: newX, y: newY } }
          : text
      )
    )
  }

  // Handle resize (optimized for direct manipulation)
  const handleTextResize = (textId, newSize) => {
    // Constrain text size between 200 and 450
    const MIN_SIZE = 200
    const MAX_SIZE = 450
    const constrainedSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newSize))

    setTextElements((prev) =>
      prev.map((text) =>
        text.id === textId
          ? { ...text, size: constrainedSize }
          : text
      )
    )
  }

  // Pinch-to-scale gesture support for text
  const handlePinchScale = useCallback((scaleMultiplier) => {
    if (selectedTextId) {
      const selectedText = textElements.find(t => t.id === selectedTextId)
      if (selectedText) {
        const MIN_SIZE = 200
        const MAX_SIZE = 450
        const newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, selectedText.size * scaleMultiplier))
        handleTextResize(selectedTextId, newSize)
      }
    }
  }, [selectedTextId, textElements])

  const pinchHandlers = usePinchToScale(!!selectedTextId, handlePinchScale)

  // Handle rotate (optimized for direct manipulation)
  const handleTextRotate = (textId, newRotation) => {
    setTextElements((prev) =>
      prev.map((text) =>
        text.id === textId
          ? { ...text, rotation: newRotation }
          : text
      )
    )
  }

  // Handle delete
  const handleDeleteText = (textId) => {
    setTextElements(prev => prev.filter(text => text.id !== textId))
    setSelectedTextId(null)
  }

  // Handle text confirmation
  const handleConfirmText = (textId) => {
    setTextElements(prev => prev.map(text =>
      text.id === textId ? { ...text, confirmed: true } : text
    ))
    setHasUnconfirmedText(false)
  }

  // Handle input text change
  const handleInputTextChange = (value) => {
    const wasEmpty = !inputText.trim()
    setInputText(value)

    if (!value.trim()) {
      // If input is empty, don't remove the text element, just clear input
      return
    }

    // If user starts typing in empty input and there's a selected text, deselect it and create new one
    if (wasEmpty && selectedTextId) {
      const newText = {
        id: Date.now() + Math.random(),
        text: value,
        font: selectedFont,
        color: selectedColor,
        position: { x: 50, y: 50 },
        size: 300,
        rotation: 0,
        isEditing: false,
        confirmed: true
      }
      setTextElements(prev => [...prev, newText])
      setSelectedTextId(newText.id)
    } else if (selectedTextId) {
      // Update existing text element
      setTextElements(prev => prev.map(text =>
        text.id === selectedTextId ? { ...text, text: value } : text
      ))
    } else {
      // Create new text element
      const newText = {
        id: Date.now() + Math.random(),
        text: value,
        font: selectedFont,
        color: selectedColor,
        position: { x: 50, y: 50 },
        size: 300,
        rotation: 0,
        isEditing: false,
        confirmed: true
      }
      setTextElements(prev => [...prev, newText])
      setSelectedTextId(newText.id)
    }
  }

  // Handle font selection
  const handleFontSelect = (font) => {
    setSelectedFont(font)
    if (selectedTextId) {
      // Update existing selected text
      setTextElements(prev => prev.map(text =>
        text.id === selectedTextId ? { ...text, font: font } : text
      ))
    }
  }

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color)
    if (selectedTextId) {
      setTextElements(prev => prev.map(text =>
        text.id === selectedTextId ? { ...text, color: color } : text
      ))
    }
  }

  // Handle background click
  const handleBackgroundClick = () => {
    // Always deselect on background click
    setSelectedTextId(null)
    setInputText('') // Clear input when deselecting
    setTextElements(prev => prev.map(text => ({ ...text, isEditing: false })))
  }

  return (
    <div
      onClick={handleBackgroundClick}
      style={{
        minHeight: '100vh',
        backgroundColor: '#fdfdfd',
        padding: '20px',
        touchAction: selectedTextId ? 'none' : 'auto'
      }}
      {...pinchHandlers}
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

        {/* Skip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleContinue()
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

      {/* Page Heading */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '28px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '700',
            color: '#2F3842',
            margin: '0 0 20px 0',
            lineHeight: '1.2',
            letterSpacing: '0',
            textAlign: 'center'
          }}
        >
          Add Text
        </h1>
        {textElements.length === 0 && (
          <p
            style={{
              fontSize: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontWeight: '400',
              color: '#666666',
              margin: '0 0 30px 0',
              lineHeight: '1.4',
              textAlign: 'center',
              padding: '0 20px'
            }}
          >
            Type your text and customize with fonts and colors
          </p>
        )}
        {textElements.length > 0 && (
          <div style={{ height: '30px' }} />
        )}
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
            overflow: 'visible',
            touchAction: selectedTextId ? 'none' : 'auto'
          }}
        >
          <MaskedPhoneDisplay
            image={appState.uploadedImages.length > 1 ? appState.uploadedImages : (appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null)}
            transform={appState.uploadedImages.length > 1 ? appState.imageTransforms : (appState.transform || (appState.imageTransforms && appState.imageTransforms[0]))}
            width={250}
            height={416}
            modelName={selectedModelData?.model_name || model}
            ref={overlayRef}
          >
            {/* Placed Stickers - Using same component as CustomStickerScreen for exact consistency */}
            {appState.placedStickers?.map((sticker) => (
              <OptimizedDraggableSticker
                key={sticker.placedId}
                sticker={sticker}
                isSelected={false}
                onSelect={() => {}}
                onMove={() => {}}
                onResize={() => {}}
                onRotate={() => {}}
                onDelete={() => {}}
                containerRect={getContainerRect()}
                maskedBounds={maskedBounds}
                overlayRef={overlayRef}
              />
            ))}

            {/* Text Elements */}
            {textElements.map((textElement) => (
              <OptimizedDraggableText
                key={textElement.id}
                textElement={textElement}
                isSelected={selectedTextId === textElement.id}
                onSelect={setSelectedTextId}
                onMove={handleTextMove}
                onResize={handleTextResize}
                onRotate={handleTextRotate}
                onDelete={handleDeleteText}
                onConfirm={handleConfirmText}
                onTextChange={handleTextChange}
                onTextBlur={handleTextBlur}
                onTextDoubleClick={handleTextDoubleClick}
                onKeyDown={handleKeyDown}
                containerRect={getContainerRect()}
                maskedBounds={maskedBounds}
                overlayRef={overlayRef}
              />
            ))}
          </MaskedPhoneDisplay>
        </div>
      </div>

      {/* Text Input Capsule */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: '40px', maxWidth: '400px', margin: '0 auto 40px auto', position: 'relative' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => handleInputTextChange(e.target.value)}
          placeholder="Add text or emoji 😊"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          style={{
            width: '100%',
            padding: '16px 56px 16px 24px',
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '400',
            color: '#333333',
            backgroundColor: '#fdfdfd',
            border: '1px solid #000000',
            borderRadius: '30px',
            outline: 'none',
            transition: 'all 150ms ease-out',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#000000'
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#000000'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        />
        {inputText.trim() && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setInputText('')
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease-out',
              boxShadow: '0 2px 6px rgba(76, 175, 80, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50'
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13l4 4L19 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Font Selector */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: '30px' }}>
        <h3 style={{
          fontSize: '14px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
          fontWeight: '600',
          color: '#666666',
          textAlign: 'center',
          marginBottom: '15px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Font Style
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => handleFontScroll('left')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fdfdfd',
              border: '1px solid #E5E5E5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>

          <div
            ref={fontScrollRef}
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              flex: 1,
              padding: '5px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {CUSTOM_FONTS.map((font) => (
              <button
                key={font.name}
                onClick={() => handleFontSelect(font)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: selectedFont.name === font.name ? '#000000' : '#FFFFFF',
                  color: selectedFont.name === font.name ? '#FFFFFF' : '#000000',
                  border: selectedFont.name === font.name ? '1px solid #000000' : '1px solid #E5E5E5',
                  borderRadius: '8px',
                  fontFamily: font.family,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease-out'
                }}
                onMouseEnter={(e) => {
                  if (selectedFont.name !== font.name) {
                    e.currentTarget.style.borderColor = '#000000'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFont.name !== font.name) {
                    e.currentTarget.style.borderColor = '#E5E5E5'
                  }
                }}
              >
                {font.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleFontScroll('right')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fdfdfd',
              border: '1px solid #E5E5E5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Color Selector */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: '30px' }}>
        <h3 style={{
          fontSize: '14px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
          fontWeight: '600',
          color: '#666666',
          textAlign: 'center',
          marginBottom: '15px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Text Colour
        </h3>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto',
          paddingBottom: '20px'
        }}>
          {/* Custom Color Picker */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px'
          }}>
            <label htmlFor="colorPicker"
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              backgroundColor: '#fdfdfd',
              border: '1px solid #E5E5E5',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              transition: 'all 150ms ease-out',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textTransform: 'uppercase'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#000000'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E5E5'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 14.5 3.5 16.5 5.5 17.5C6.5 18 7 18 7.5 17.5C8 17 8 16 8.5 15.5C9 15 10 15 10.5 15.5C11 16 11 17 11.5 17.5C12 18 13 18 14 17.5C16 16.5 22 14.5 22 12C22 6.48 17.52 2 12 2Z" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="1.5" fill="#FF6B6B"/>
                <circle cx="15" cy="9" r="1.5" fill="#4ECDC4"/>
                <circle cx="12" cy="7" r="1.5" fill="#FFD700"/>
                <circle cx="9" cy="13" r="1.5" fill="#9D4EDD"/>
                <circle cx="15" cy="13" r="1.5" fill="#4CAF50"/>
              </svg>
              Pick Custom Colour
              <input
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Buttons - Reset and Continue */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        paddingBottom: '40px'
      }}>
        {/* Reset Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleReset()
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '100px',
            width: '140px',
            height: '45px',
            border: '1px solid #FF4444',
            color: '#FF4444',
            cursor: 'pointer',
            transition: 'all 200ms ease-out',
            boxShadow: '0 4px 12px rgba(255, 68, 68, 0.15)',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: '500',
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

export default TextInputScreen

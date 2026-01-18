import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import environment from '../config/environment'

const AppStateContext = createContext()

const API_BASE_URL = environment.apiBaseUrl

// Initial state
const initialState = {
  // Entry source tracking
  entrySource: null, // 'qr' | 'vanilla'

  // Vending Machine Session
  vendingMachineSession: {
    isVendingMachine: false,
    sessionId: null,
    deviceId: null,
    machineId: null,
    sessionStatus: null,
    location: null
  },

  // User selections
  brand: null,
  model: null,
  modelData: null,  // Complete model data
  color: null,

  // Images and design
  uploadedImages: [],
  template: null,

  // Image transforms
  transform: { x: 0, y: 0, scale: 1 }, // Single transform for basic templates
  imageTransforms: [], // Array of transform objects for multi-image templates

  // Stickers
  placedStickers: [],
  customStickers: [],

  // Text customization (if applicable)
  customText: '',
  selectedFont: null,
  textColor: null,

  // AI Credits
  aiCredits: 100,

  // Order flow
  designComplete: false,
  orderNumber: null,
  queuePosition: null,
  orderStatus: 'designing', // designing, payment, queue, printing, completed

  // E-COMMERCE: Customer Information
  customerInfo: {
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    notes: ''
  },

  // Error handling
  error: null,
  loading: false
}

// Action types
const ACTIONS = {
  SET_ENTRY_SOURCE: 'SET_ENTRY_SOURCE',
  SET_VENDING_MACHINE_SESSION: 'SET_VENDING_MACHINE_SESSION',
  SET_PHONE_SELECTION: 'SET_PHONE_SELECTION',
  SET_TEMPLATE: 'SET_TEMPLATE',
  ADD_IMAGE: 'ADD_IMAGE',
  REMOVE_IMAGE: 'REMOVE_IMAGE',
  SET_IMAGES: 'SET_IMAGES',
  ADD_STICKER: 'ADD_STICKER',
  UPDATE_STICKER: 'UPDATE_STICKER',
  REMOVE_STICKER: 'REMOVE_STICKER',
  CLEAR_STICKERS: 'CLEAR_STICKERS',
  ADD_CUSTOM_STICKER: 'ADD_CUSTOM_STICKER',
  REMOVE_CUSTOM_STICKER: 'REMOVE_CUSTOM_STICKER',
  CLEAR_CUSTOM_STICKERS: 'CLEAR_CUSTOM_STICKERS',
  SET_CUSTOM_TEXT: 'SET_CUSTOM_TEXT',
  SET_FONT: 'SET_FONT',
  SET_TEXT_COLOR: 'SET_TEXT_COLOR',
  SET_AI_CREDITS: 'SET_AI_CREDITS',
  DEDUCT_AI_CREDIT: 'DEDUCT_AI_CREDIT',
  SET_DESIGN_COMPLETE: 'SET_DESIGN_COMPLETE',
  SET_ORDER_STATUS: 'SET_ORDER_STATUS',
  SET_ORDER_NUMBER: 'SET_ORDER_NUMBER',
  SET_QUEUE_POSITION: 'SET_QUEUE_POSITION',
  SET_CUSTOMER_INFO: 'SET_CUSTOMER_INFO',  // E-COMMERCE: Set customer information
  SET_TRANSFORM: 'SET_TRANSFORM',
  SET_IMAGE_TRANSFORMS: 'SET_IMAGE_TRANSFORMS',
  UPDATE_IMAGE_TRANSFORM: 'UPDATE_IMAGE_TRANSFORM',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  RESET_STATE: 'RESET_STATE'
}

// Reducer
const appStateReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_ENTRY_SOURCE:
      return {
        ...state,
        entrySource: action.payload
      }

    case ACTIONS.SET_VENDING_MACHINE_SESSION:
      return {
        ...state,
        vendingMachineSession: {
          ...state.vendingMachineSession,
          ...action.payload
        }
      }

    case ACTIONS.SET_PHONE_SELECTION:
      return {
        ...state,
        brand: action.payload.brand,
        model: action.payload.model,
        modelData: action.payload.modelData,  // Store complete model data including chinese_model_id
        color: action.payload.modelData?.color || null  // Extract color from modelData if present
      }
    
    case ACTIONS.SET_TEMPLATE:
      return {
        ...state,
        template: action.payload
      }
    
    case ACTIONS.ADD_IMAGE:
      return {
        ...state,
        uploadedImages: [...state.uploadedImages, action.payload]
      }
    
    case ACTIONS.REMOVE_IMAGE:
      return {
        ...state,
        uploadedImages: state.uploadedImages.filter((_, index) => index !== action.payload)
      }

    case ACTIONS.SET_IMAGES:
      return {
        ...state,
        uploadedImages: action.payload
      }

    case ACTIONS.ADD_STICKER:
      console.log('➕ ADD_STICKER action:', action.payload.name)
      console.log('  Current count:', state.placedStickers.length, '→ New count:', state.placedStickers.length + 1)
      return {
        ...state,
        placedStickers: [...state.placedStickers, action.payload]
      }

    case ACTIONS.UPDATE_STICKER:
      return {
        ...state,
        placedStickers: state.placedStickers.map(sticker =>
          sticker.placedId === action.payload.placedId
            ? { ...sticker, ...action.payload.updates }
            : sticker
        )
      }

    case ACTIONS.REMOVE_STICKER:
      return {
        ...state,
        placedStickers: state.placedStickers.filter(sticker => sticker.placedId !== action.payload)
      }

    case ACTIONS.CLEAR_STICKERS:
      return {
        ...state,
        placedStickers: []
      }

    case ACTIONS.ADD_CUSTOM_STICKER:
      return {
        ...state,
        customStickers: [...state.customStickers, action.payload]
      }

    case ACTIONS.REMOVE_CUSTOM_STICKER:
      return {
        ...state,
        customStickers: state.customStickers.filter(sticker => sticker.id !== action.payload)
      }

    case ACTIONS.CLEAR_CUSTOM_STICKERS:
      return {
        ...state,
        customStickers: []
      }

    case ACTIONS.SET_CUSTOM_TEXT:
      return {
        ...state,
        customText: action.payload
      }
    
    case ACTIONS.SET_FONT:
      return {
        ...state,
        selectedFont: action.payload
      }
    
    case ACTIONS.SET_TEXT_COLOR:
      return {
        ...state,
        textColor: action.payload
      }
    
    case ACTIONS.SET_AI_CREDITS:
      return {
        ...state,
        aiCredits: action.payload
      }
    
    case ACTIONS.DEDUCT_AI_CREDIT:
      return {
        ...state,
        aiCredits: Math.max(0, state.aiCredits - 1)
      }
    
    case ACTIONS.SET_DESIGN_COMPLETE:
      return {
        ...state,
        designComplete: action.payload
      }
    
    case ACTIONS.SET_ORDER_STATUS:
      return {
        ...state,
        orderStatus: action.payload
      }
    
    case ACTIONS.SET_ORDER_NUMBER:
      return {
        ...state,
        orderNumber: action.payload
      }
    
    case ACTIONS.SET_QUEUE_POSITION:
      return {
        ...state,
        queuePosition: action.payload
      }

    case ACTIONS.SET_CUSTOMER_INFO:
      return {
        ...state,
        customerInfo: {
          ...state.customerInfo,
          ...action.payload
        }
      }

    case ACTIONS.SET_TRANSFORM:
      return {
        ...state,
        transform: action.payload
      }

    case ACTIONS.SET_IMAGE_TRANSFORMS:
      return {
        ...state,
        imageTransforms: action.payload
      }

    case ACTIONS.UPDATE_IMAGE_TRANSFORM:
      const newTransforms = [...state.imageTransforms]
      newTransforms[action.payload.index] = action.payload.transform
      return {
        ...state,
        imageTransforms: newTransforms
      }

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      }
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    
    case ACTIONS.RESET_STATE:
      return {
        ...initialState,
        aiCredits: 100
      }

    case 'LOAD_STATE':
      console.log('🔄 LOAD_STATE action fired')
      console.log('  Current state brand:', state.brand)
      console.log('  Loaded state brand:', action.payload?.brand)
      console.log('  Loading placedStickers:', action.payload.placedStickers?.length || 0)
      console.log('  Loading uploadedImages:', action.payload.uploadedImages?.length || 0)

      // Auto-upgrade old credits (4 or less) to new limit (100)
      const loadedCredits = action.payload?.aiCredits || 0
      const upgradedCredits = loadedCredits <= 4 ? 100 : loadedCredits

      // MERGE loaded state with current state, preserving critical fields
      return {
        ...state,              // Keep current state as base
        ...action.payload,     // Apply loaded state on top
        // Preserve current values if loaded state has null/undefined
        brand: action.payload?.brand || state.brand,
        model: action.payload?.model || state.model,
        modelData: action.payload?.modelData || state.modelData,
        template: action.payload?.template || state.template,
        color: action.payload?.color || state.color,
        // Auto-upgrade credits from old limit to new limit
        aiCredits: upgradedCredits,
        // Always reset loading states
        loading: false,
        error: null
      }
    
    default:
      return state
  }
}

// Provider component
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  // Persist state to localStorage (excluding large image data to avoid quota errors)
  useEffect(() => {
    try {
      const stateToSave = {
        ...state,
        // Don't persist loading states
        loading: false,
        error: null,
        // E-COMMERCE FIX: Don't persist large image data (causes quota exceeded errors)
        uploadedImages: [], // Images are too large for localStorage
        // Only save essential sticker data to avoid quota issues
        placedStickers: state.placedStickers?.map(s => ({
          placedId: s.placedId,
          id: s.id,
          name: s.name,
          type: s.type,
          emoji: s.emoji,
          imageUrl: s.imageUrl,
          thumbnailUrl: s.thumbnailUrl,
          highresUrl: s.highresUrl,
          fallbackUrl: s.fallbackUrl,
          x: s.x,
          y: s.y,
          scale: s.scale,
          rotation: s.rotation,
          zIndex: s.zIndex
        })) || [],
        customStickers: [], // Don't persist custom uploaded stickers
        // Persist transform state for image positioning/zoom
        transform: state.transform,
        imageTransforms: state.imageTransforms,
        // Explicitly preserve critical fields for order processing
        brand: state.brand,
        model: state.model,
        modelData: state.modelData,  // CRITICAL: Required for image composition
        template: state.template,
        color: state.color
      }

      // Don't save if critical data is missing (likely an initial/empty state)
      const hasValidData = state.brand || state.model || state.template ||
                           state.uploadedImages?.length > 0 ||
                           state.placedStickers?.length > 0

      if (!hasValidData) {
        console.log('⚠️ Skipping localStorage save - no meaningful data to save')
        return
      }

      // Check size before saving (rough estimate: 1 char = 2 bytes in UTF-16)
      const stateString = JSON.stringify(stateToSave)
      const sizeInBytes = new Blob([stateString]).size
      const sizeInMB = sizeInBytes / (1024 * 1024)

      // Skip save if > 4MB (localStorage limit is usually 5-10MB)
      if (sizeInMB > 4) {
        console.warn(`⚠️ State too large to save (${sizeInMB.toFixed(2)}MB). Skipping localStorage save.`)
        return
      }

      console.log(`💾 Saving state to localStorage (${sizeInMB.toFixed(2)}MB)`)
      console.log(`  - Stickers: ${stateToSave.placedStickers?.length || 0}`)
      console.log(`  - Images: ${stateToSave.uploadedImages?.length || 0}`)
      console.log(`  - brand: ${stateToSave.brand || 'null'}`)
      console.log(`  - model: ${stateToSave.model || 'null'}`)
      console.log(`  - modelData: ${stateToSave.modelData ? 'present' : 'null'}`)
      console.log(`  - template: ${stateToSave.template || 'null'}`)

      localStorage.setItem('pimpMyCase_state', stateString)
    } catch (error) {
      // Handle quota exceeded errors gracefully
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('⚠️ localStorage quota exceeded. Clearing old data...')
        // Clear localStorage and try saving minimal state
        localStorage.removeItem('pimpMyCase_state')
        try {
          const minimalState = {
            brand: state.brand,
            model: state.model,
            modelData: state.modelData,  // CRITICAL: Must be saved even in minimal mode
            template: state.template,
            color: state.color,
            customerInfo: state.customerInfo,
            placedStickers: [] // Skip stickers in minimal save
          }
          localStorage.setItem('pimpMyCase_state', JSON.stringify(minimalState))
        } catch (e) {
          console.error('Failed to save even minimal state:', e)
          // Last resort: clear everything
          localStorage.clear()
        }
      } else {
        console.error('Failed to persist state to localStorage:', error)
      }
    }
  }, [state])

  // Load state from localStorage on mount (but DO NOT override live QR session params if present in URL)
  useEffect(() => {
    const savedState = localStorage.getItem('pimpMyCase_state')
    if (savedState) {
      try {
        // Check saved state size to prevent loading corrupted/oversized data
        const sizeInBytes = new Blob([savedState]).size
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 4) {
          console.warn(`⚠️ Saved state too large (${sizeInMB.toFixed(2)}MB). Clearing and starting fresh.`)
          localStorage.removeItem('pimpMyCase_state')
          return
        }

        const parsedState = JSON.parse(savedState)
        // Restore state but ensure arrays exist
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...parsedState,
            // Ensure arrays are initialized even if not in saved state
            uploadedImages: parsedState.uploadedImages || [],
            placedStickers: parsedState.placedStickers || [],
            customStickers: parsedState.customStickers || [],
            customerInfo: parsedState.customerInfo || initialState.customerInfo,
            // Ensure transform state is initialized
            transform: parsedState.transform || initialState.transform,
            imageTransforms: parsedState.imageTransforms || initialState.imageTransforms
          }
        })
      } catch (error) {
        console.error('Failed to load saved state:', error)
        // Clear corrupted localStorage
        localStorage.removeItem('pimpMyCase_state')
      }
    }
  }, [])

  // Action creators
  const actions = {
    setEntrySource: (source) => dispatch({
      type: ACTIONS.SET_ENTRY_SOURCE,
      payload: source
    }),

    setVendingMachineSession: (sessionData) => dispatch({
      type: ACTIONS.SET_VENDING_MACHINE_SESSION,
      payload: sessionData
    }),

    setQrSession: (sessionId, qrSession) => dispatch({
      type: ACTIONS.SET_QR_SESSION,
      payload: { sessionId, qrSession }
    }),

    setPhoneSelection: (brand, model, modelData) => dispatch({
      type: ACTIONS.SET_PHONE_SELECTION,
      payload: { brand, model, modelData }
    }),
    
    setTemplate: (template) => dispatch({
      type: ACTIONS.SET_TEMPLATE,
      payload: template
    }),
    
    addImage: (image) => dispatch({
      type: ACTIONS.ADD_IMAGE,
      payload: image
    }),
    
    removeImage: (index) => dispatch({
      type: ACTIONS.REMOVE_IMAGE,
      payload: index
    }),

    setImages: (images) => dispatch({
      type: ACTIONS.SET_IMAGES,
      payload: images
    }),

    addSticker: (sticker) => dispatch({
      type: ACTIONS.ADD_STICKER,
      payload: sticker
    }),

    updateSticker: (placedId, updates) => dispatch({
      type: ACTIONS.UPDATE_STICKER,
      payload: { placedId, updates }
    }),

    removeSticker: (placedId) => dispatch({
      type: ACTIONS.REMOVE_STICKER,
      payload: placedId
    }),

    clearStickers: () => dispatch({
      type: ACTIONS.CLEAR_STICKERS
    }),

    addCustomSticker: (sticker) => dispatch({
      type: ACTIONS.ADD_CUSTOM_STICKER,
      payload: sticker
    }),

    removeCustomSticker: (stickerId) => dispatch({
      type: ACTIONS.REMOVE_CUSTOM_STICKER,
      payload: stickerId
    }),

    clearCustomStickers: () => dispatch({
      type: ACTIONS.CLEAR_CUSTOM_STICKERS
    }),

    setCustomText: (text) => dispatch({
      type: ACTIONS.SET_CUSTOM_TEXT,
      payload: text
    }),
    
    setFont: (font) => dispatch({
      type: ACTIONS.SET_FONT,
      payload: font
    }),
    
    setTextColor: (color) => dispatch({
      type: ACTIONS.SET_TEXT_COLOR,
      payload: color
    }),
    
    setAiCredits: (credits) => dispatch({
      type: ACTIONS.SET_AI_CREDITS,
      payload: credits
    }),
    
    deductAiCredit: () => dispatch({
      type: ACTIONS.DEDUCT_AI_CREDIT
    }),
    
    setDesignComplete: (complete) => dispatch({
      type: ACTIONS.SET_DESIGN_COMPLETE,
      payload: complete
    }),
    
    setOrderStatus: (status) => dispatch({
      type: ACTIONS.SET_ORDER_STATUS,
      payload: status
    }),
    
    setOrderNumber: (orderNumber) => dispatch({
      type: ACTIONS.SET_ORDER_NUMBER,
      payload: orderNumber
    }),
    
    setQueuePosition: (position) => dispatch({
      type: ACTIONS.SET_QUEUE_POSITION,
      payload: position
    }),

    setCustomerInfo: (customerInfo) => dispatch({
      type: ACTIONS.SET_CUSTOMER_INFO,
      payload: customerInfo
    }),

    setTransform: (transform) => dispatch({
      type: ACTIONS.SET_TRANSFORM,
      payload: transform
    }),

    setImageTransforms: (transforms) => dispatch({
      type: ACTIONS.SET_IMAGE_TRANSFORMS,
      payload: transforms
    }),

    updateImageTransform: (index, transform) => dispatch({
      type: ACTIONS.UPDATE_IMAGE_TRANSFORM,
      payload: { index, transform }
    }),

    setError: (error) => dispatch({
      type: ACTIONS.SET_ERROR,
      payload: error
    }),
    
    setLoading: (loading) => dispatch({
      type: ACTIONS.SET_LOADING,
      payload: loading
    }),
    
    resetState: () => dispatch({
      type: ACTIONS.RESET_STATE
    }),

    updateVendingSessionStatus: (statusData) => dispatch({
      type: ACTIONS.UPDATE_VENDING_SESSION_STATUS,
      payload: statusData
    }),
    
    setBrandsCache: (brands, apiModels, deviceId) => dispatch({
      type: ACTIONS.SET_BRANDS_CACHE,
      payload: { brands, apiModels, deviceId }
    }),
    
    clearBrandsCache: () => dispatch({
      type: ACTIONS.CLEAR_BRANDS_CACHE
    })
  }

  return (
    <AppStateContext.Provider value={{ state, actions }}>
      {children}
    </AppStateContext.Provider>
  )
}

// Custom hook
export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}

export default AppStateContext 

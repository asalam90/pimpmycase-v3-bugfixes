import { ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fonts as availableFonts } from '../utils/fontManager'
import { getTemplatePrice, getTemplatePricePence, isFreePromoMachine } from '../config/templatePricing'
import { useState, useRef } from 'react'
import { useAppState } from '../contexts/AppStateContext'
import MaskedPhoneDisplay from '../components/MaskedPhoneDisplay'
import KonvaStickerCanvas from '../components/KonvaStickerCanvas'
import { useMaskedBounds } from '../hooks/useMaskedBounds'
import environment from '../config/environment'

const PaymentScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useAppState()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)

  const overlayRef = useRef(null)
  const maskedBounds = useMaskedBounds(overlayRef)

  const getContainerRect = () => {
    return overlayRef.current?.getBoundingClientRect() || null
  }

  // Get images from location state or app state
  const uploadedImages = location.state?.uploadedImages || appState.uploadedImages || []

  // Use centralized transform state with fallback to location state
  const currentImageTransforms = appState.imageTransforms?.length > 0
    ? appState.imageTransforms
    : (location.state?.imageTransforms || [])

  // Delivery form state
  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom'
  })
  const [formErrors, setFormErrors] = useState({})
  
  // Get entry source and vending machine session info
  const entrySource = appState.entrySource // 'qr' | 'vanilla'
  const isQREntry = entrySource === 'qr'
  const isVanillaEntry = entrySource === 'vanilla'

  const { vendingMachineSession } = appState
  const isVendingMachine = vendingMachineSession?.isVendingMachine || false
  const isRegisteredVending = isVendingMachine && vendingMachineSession?.sessionStatus === 'registered'

  // Determine which features to show
  const showPayViaMachineButton = isQREntry && isRegisteredVending
  const showAddressForm = isVanillaEntry // Only vanilla needs delivery address
  const requiresAddress = isVanillaEntry // Validation requirement

  // Extract device_id from multiple sources
  const currentUrl = window.location.href
  const urlParams = new URLSearchParams(window.location.search)
  
  // Also try manual extraction as backup
  const deviceIdMatch = currentUrl.match(/device_id=([^&]+)/)
  const deviceIdFromUrl = urlParams.get('device_id') || (deviceIdMatch ? deviceIdMatch[1] : null)
  
  const deviceIdFromSession = vendingMachineSession?.deviceId
  const deviceIdFromState = location.state?.deviceId

  const API_BASE_URL = environment.apiBaseUrl
  
  // Use first available device_id
  const deviceId = deviceIdFromSession || deviceIdFromUrl || deviceIdFromState
  
  console.log('PaymentScreen - Current URL:', currentUrl)
  console.log('PaymentScreen - URL search params:', window.location.search)
  console.log('PaymentScreen - Device ID from session:', deviceIdFromSession)
  console.log('PaymentScreen - Device ID from URL:', deviceIdFromUrl)  
  console.log('PaymentScreen - Device ID from state:', deviceIdFromState)
  console.log('PaymentScreen - Final Device ID:', deviceId)
  
  // Get Chinese model data from app state
  const phoneSelection = appState.modelData || {}
  const chineseModelId = phoneSelection.chinese_model_id
  
  console.log('PaymentScreen - Device ID:', deviceId)
  console.log('PaymentScreen - Phone Selection:', phoneSelection)
  console.log('PaymentScreen - Chinese Model ID:', chineseModelId)
  console.log('PaymentScreen - App State:', appState)
  if (isVendingMachine && !isRegisteredVending) {
    console.warn('PaymentScreen - Vending session not registered. sessionStatus:', vendingMachineSession?.sessionStatus)
  }

  // Expecting these values from previous step, otherwise use sensible defaults
  const {
    designImage,
    imageTransforms,
    inputText,
    selectedFont = 'Arial',
    fontSize = 30,
    selectedTextColor = '#ffffff',
    selectedBackgroundColor = '#ffffff',
    textPosition,
    transform: initialTransform,
    template,
    stripCount,
    price,
    selectedAddOns = [],
    addOnsTotal = 0
  } = location.state || {}


  // CRITICAL FIX: Use pence-based pricing to avoid floating point errors
  const basePricePence = template?.id
    ? getTemplatePricePence(template.id)
    : 3500 // Default £35.00 in pence
  const addOnsPence = Math.round(addOnsTotal * 100) // Convert add-ons to pence
  const effectivePricePence = basePricePence + addOnsPence // Total in pence
  const effectivePrice = effectivePricePence / 100 // Convert to pounds for display
  const basePrice = basePricePence / 100 // Base price for display

  // ============================================
  // PROMOTIONAL: Override all pricing for promotional machines
  // TODO: Remove when promotional period ends
  // ============================================
  const machineId = vendingMachineSession?.machineId || vendingMachineSession?.deviceId
  const isFreePromo = machineId && isFreePromoMachine(machineId)

  let finalBasePricePence = basePricePence
  let finalAddOnsPence = addOnsPence
  let finalEffectivePricePence = effectivePricePence
  let finalBasePrice = basePrice
  let finalAddOnsTotal = addOnsTotal
  let finalEffectivePrice = effectivePrice

  if (isFreePromo) {
    console.log('🎉 PROMOTIONAL: Free pricing for machine', machineId)
    finalBasePricePence = 0
    finalAddOnsPence = 0
    finalEffectivePricePence = 0
    finalBasePrice = 0.00
    finalAddOnsTotal = 0.00
    finalEffectivePrice = 0.00
  }
  // ============================================

  console.log('PaymentScreen - Pricing Info:', {
    templateId: template?.id,
    basePricePence: finalBasePricePence,
    addOnsPence: finalAddOnsPence,
    totalPricePence: finalEffectivePricePence,
    basePrice: finalBasePrice,
    addOnsTotal: finalAddOnsTotal,
    finalPrice: finalEffectivePrice,
    selectedAddOns: selectedAddOns,
    isPromoMachine: isFreePromo,
    machineId: machineId
  })

  // Compute style helpers reused from previous screens
  const getPreviewStyle = () => ({
    fontFamily: availableFonts.find(f => f.name === selectedFont)?.style || 'Arial, sans-serif',
    fontSize: `${fontSize}px`,
    color: selectedTextColor,
    whiteSpace: 'nowrap',
    fontWeight: '500',
    lineHeight: '1.2'
  })

  const getTextStyle = () => ({
    position: 'absolute',
    left: `${textPosition?.x || 50}%`,
    top: `${textPosition?.y || 50}%`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none'
  })
  const handleBack = () => {
    navigate(-1)
  }

  // Form validation
  const validateForm = () => {
    const errors = {}

    if (!deliveryDetails.customerName.trim()) {
      errors.customerName = 'Name is required'
    }

    if (!deliveryDetails.customerEmail.trim()) {
      errors.customerEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(deliveryDetails.customerEmail)) {
      errors.customerEmail = 'Email is invalid'
    }

    if (!deliveryDetails.customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required'
    }

    if (!deliveryDetails.addressLine1.trim()) {
      errors.addressLine1 = 'Address is required'
    }

    if (!deliveryDetails.city.trim()) {
      errors.city = 'City is required'
    }

    if (!deliveryDetails.postcode.trim()) {
      errors.postcode = 'Postcode is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setDeliveryDetails(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handlePayOnApp = async () => {
    if (isProcessingPayment) return

    console.log('🚀 Pay button clicked - Starting payment process')
    console.log('📋 Entry source:', entrySource)
    console.log('📋 Delivery details:', deliveryDetails)
    console.log('🌐 API Base URL:', API_BASE_URL)

    // Only validate address form if required (vanilla entry)
    if (requiresAddress && !validateForm()) {
      console.log('❌ Form validation failed')
      setPaymentError('Please fill in all required delivery details')
      return
    }

    console.log('✅ Validation passed (address check:', requiresAddress, ')')
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      // Get all the order data we need from app state and location
      const { brand, model, color } = location.state || {}
      const selectedModelData = location.state?.selectedModelData || phoneSelection
      
      // Extract order data from app state and location state consistently
      const brandFromState = appState.brand || selectedModelData?.brand || brand
      const modelFromState = appState.model || selectedModelData?.model || model
      const colorFromState = appState.color || selectedModelData?.color || color
      
      console.log('PaymentScreen - Order data:', { brandFromState, modelFromState, colorFromState, selectedModelData, mobile_shell_id: selectedModelData?.mobile_shell_id })
      
      // Get final image data from location state or app state
      const finalImagePublicUrl = location.state?.finalImagePublicUrl
      const imageSessionId = location.state?.imageSessionId
      const hasImageInState = appState.uploadedImages && appState.uploadedImages.length > 0

      console.log('PaymentScreen - Final image data:', {
        finalImagePublicUrl,
        imageSessionId,
        hasValidImageUrl: !!finalImagePublicUrl,
        hasImageInState,
        uploadedImagesCount: appState.uploadedImages?.length
      })

      // CRITICAL: Ensure we have either a final public URL or an image in state
      if (!finalImagePublicUrl && !hasImageInState) {
        setPaymentError('Image upload failed. Please try again or go back to upload a new image.')
        setIsProcessingPayment(false)
        return
      }

      // Block base64 data URLs for final public URL
      if (finalImagePublicUrl && finalImagePublicUrl.startsWith('data:')) {
        setPaymentError('Image upload failed. Please try again or go back to upload a new image.')
        setIsProcessingPayment(false)
        return
      }
      
      // Prepare order data (no localStorage - will be handled by backend via Stripe metadata)
      console.log('PaymentScreen - Preparing order data')
      console.log('mobile_shell_id:', selectedModelData?.mobile_shell_id)
      
      // Chinese API integration - Call payData BEFORE Stripe checkout to inform machine of payment amount
      let chinesePaymentId = null
      if (deviceId && selectedModelData?.chinese_model_id) {
        try {
          console.log('PaymentScreen - Calling payData API before Stripe checkout...')
          
          // CRITICAL FIX: Use UTC timezone for consistent date generation to prevent date boundary issues
          const now = new Date()
          const dateStr = now.getUTCFullYear().toString().slice(-2) + 
                         (now.getUTCMonth() + 1).toString().padStart(2, '0') + 
                         now.getUTCDate().toString().padStart(2, '0')
          const randomPart = Math.floor(Math.random() * 900000 + 100000).toString()
          const paymentThirdId = `PYEN${dateStr}${randomPart}`
          console.log('PaymentScreen - Generated paymentThirdId (UTC):', paymentThirdId)
          
          const payDataResponse = await fetch(`${API_BASE_URL}/api/chinese/order/payData`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mobile_model_id: selectedModelData.chinese_model_id,
              device_id: deviceId,
              third_id: paymentThirdId,
              pay_amount: finalEffectivePrice, // Send exact display price to match Stripe
              pay_type: 12 // UK online payment
            }),
          })
          
          if (payDataResponse.ok) {
            const payDataResult = await payDataResponse.json()
            if (payDataResult.code === 200) {
              chinesePaymentId = payDataResult.data?.id
              console.log('✅ PaymentScreen - PayData successful:', chinesePaymentId)
            } else {
              console.warn('⚠️ PaymentScreen - PayData API returned error:', payDataResult.msg)
            }
          } else {
            console.warn('⚠️ PaymentScreen - PayData HTTP error:', payDataResponse.status)
          }
        } catch (payDataError) {
          console.warn('⚠️ PaymentScreen - PayData failed, proceeding with Stripe anyway:', payDataError)
          // Don't block Stripe checkout if payData fails - backend will handle it
        }
      } else {
        console.log('📋 PaymentScreen - Skipping payData (missing deviceId or chinese_model_id)')
      }
      
      // CRITICAL FIX: Store final image URL in localStorage for PaymentSuccessScreen
      const orderMetadata = {
        finalImagePublicUrl: finalImagePublicUrl,
        imageSessionId: imageSessionId,
        selectedModelData: selectedModelData,
        deviceId: deviceId,
        template_id: template?.id || 'classic',
        mobile_shell_id: selectedModelData?.mobile_shell_id
      }
      localStorage.setItem('currentOrderMetadata', JSON.stringify(orderMetadata))
      console.log('💾 Stored order metadata for post-payment processing:', orderMetadata)

      // Create Stripe checkout session
      console.log('💳 Creating Stripe checkout session...')
      const requestData = {
        amount_pence: finalEffectivePricePence,
        template_id: template?.id,
        brand: brandFromState,
        model: modelFromState,
        color: colorFromState,
        design_image: designImage,
        final_image_url: finalImagePublicUrl, // CRITICAL: Include final image URL for Chinese API
        selected_add_ons: selectedAddOns,
        add_ons_total: addOnsTotal,
        base_price: basePrice,

        // Entry source tracking
        entry_source: entrySource,
        is_machine_collection: isQREntry,

        // For QR entry: include machine info for collection
        ...(isQREntry && {
          machine_id: vendingMachineSession?.machineId || vendingMachineSession?.deviceId
        }),

        // For vanilla entry: include delivery details
        ...(isVanillaEntry && {
          customer_name: deliveryDetails.customerName,
          customer_email: deliveryDetails.customerEmail,
          customer_phone: deliveryDetails.customerPhone,
          shipping_address_line1: deliveryDetails.addressLine1,
          shipping_address_line2: deliveryDetails.addressLine2,
          shipping_city: deliveryDetails.city,
          shipping_postcode: deliveryDetails.postcode,
          shipping_country: deliveryDetails.country
        })
      }

      console.log('📤 Request URL:', `${API_BASE_URL}/create-checkout-session`)
      console.log('📤 Request data:', requestData)

      const checkoutResponse = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('📥 Checkout response status:', checkoutResponse.status)
      console.log('📥 Checkout response ok:', checkoutResponse.ok)
      
      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text()
        console.error('❌ Checkout session creation failed:', errorText)
        throw new Error(`Checkout session creation failed: ${errorText}`)
      }

      console.log('📦 Parsing response JSON...')
      const responseData = await checkoutResponse.json()
      console.log('✅ Checkout response data:', responseData)

      const { checkout_url } = responseData

      if (!checkout_url) {
        console.error('❌ No checkout_url in response')
        throw new Error('No checkout URL received from server')
      }

      console.log('🔗 Checkout URL:', checkout_url)
      console.log('🚀 Redirecting to Stripe checkout...')
      
      // Add a small delay and fallback for redirect
      setTimeout(() => {
        console.log('PaymentScreen - Redirect timeout, showing fallback message')
        setPaymentError('Redirect taking too long. Click here to continue: ' + checkout_url)
        setIsProcessingPayment(false)
      }, 3000)
      
      // Redirect to Stripe hosted checkout
      window.location.href = checkout_url
      
    } catch (error) {
      console.error('Payment error:', error)
      console.error('Error stack:', error.stack)
      console.error('Error message:', error.message)

      // Show detailed error message
      const errorMessage = error.message || 'Payment setup failed. Please try again.'
      setPaymentError(`Payment setup failed: ${errorMessage}`)
      setIsProcessingPayment(false)
    }
  }

  const handlePayViaVendingMachine = async () => {
    if (isProcessingPayment) return
    
    setIsProcessingPayment(true)
    setPaymentError(null)
    
    try {
      // Get all the order data we need from app state and location
      const { brand, model, color } = location.state || {}
      const selectedModelData = location.state?.selectedModelData || phoneSelection
      
      if (!deviceId) {
        throw new Error('Device ID is required for vending machine payment')
      }
      
      if (!selectedModelData?.chinese_model_id) {
        throw new Error('Chinese model ID is required for payment processing')
      }
      
      // Extract order data from app state and location state properly
      const brandFromState = appState.brand || selectedModelData?.brand || brand
      const modelFromState = appState.model || selectedModelData?.model || model
      const colorFromState = appState.color || selectedModelData?.color || color
      
      console.log('PaymentScreen - Vending machine payment data:', { 
        brandFromState, modelFromState, colorFromState, selectedModelData, deviceId 
      })
      
      // Get final image data for vending machine flow or app state
      const finalImagePublicUrl = location.state?.finalImagePublicUrl
      const imageSessionId = location.state?.imageSessionId
      const hasImageInState = appState.uploadedImages && appState.uploadedImages.length > 0

      console.log('PaymentScreen - Vending final image data:', {
        finalImagePublicUrl,
        imageSessionId,
        hasValidImageUrl: !!finalImagePublicUrl,
        hasImageInState,
        uploadedImagesCount: appState.uploadedImages?.length
      })

      // CRITICAL: Ensure we have either a final public URL or an image in state
      if (!finalImagePublicUrl && !hasImageInState) {
        setPaymentError('Image upload failed. Please try again or go back to upload a new image.')
        setIsProcessingPayment(false)
        return
      }

      // Block base64 data URLs for final public URL
      if (finalImagePublicUrl && finalImagePublicUrl.startsWith('data:')) {
        setPaymentError('Image upload failed. Please try again or go back to upload a new image.')
        setIsProcessingPayment(false)
        return
      }
      
      // Store current order data in localStorage  
      console.log('PaymentScreen - mobile_shell_id being added to vending orderData:', selectedModelData?.mobile_shell_id)
      
      // After migration, brand.id IS the Chinese brand ID
      // Get it from selectedModelData which should contain chinese_brand_id
      const chineseBrandId = selectedModelData?.chinese_brand_id ||
                             location.state?.chineseBrandId ||
                             appState.modelData?.chinese_brand_id ||
                             appState.brand  // After migration, this will be the Chinese ID
      
      console.log('PaymentScreen - Using Chinese brand_id:', chineseBrandId)
      
      const orderData = {
        designImage,
        finalImagePublicUrl: finalImagePublicUrl || null, // Store the permanent URL separately (if available)
        imageSessionId, // Store session ID for tracking
        uploadedImages: appState.uploadedImages, // Use images from app state
        uploadedImage: appState.uploadedImages?.[0] || null, // Primary image
        placedStickers: appState.placedStickers || [], // Include stickers
        textElements: appState.textElements || [], // Include text elements
        imageTransforms,
        price: effectivePrice,
        basePrice: basePrice,
        addOnsTotal: addOnsTotal,
        selectedAddOns: selectedAddOns,
        brand: brandFromState,
        brand_id: chineseBrandId,  // CRITICAL: Use Chinese brand ID, not lowercase brand name
        model: modelFromState,
        color: colorFromState,
        chinese_model_id: selectedModelData?.chinese_model_id,
        mobile_shell_id: selectedModelData?.mobile_shell_id,
        device_id: deviceId,
        template,
        inputText,
        selectedFont,
        selectedTextColor,
        selectedBackgroundColor,
        textPosition,
        paymentMethod: 'vending_machine'
      }
      localStorage.setItem('pendingOrder', JSON.stringify(orderData))
      
      // CRITICAL: Send order summary FIRST before initializing payment
      console.log('Sending order summary to vending machine:', {
        session_id: vendingMachineSession.sessionId,
        payment_amount: effectivePrice,
        currency: 'GBP',
        order_data: orderData
      })
      
      const orderSummaryResponse = await fetch(`${API_BASE_URL}/api/vending/session/${vendingMachineSession.sessionId}/order-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: vendingMachineSession.sessionId,
          payment_amount: effectivePrice,
          currency: 'GBP',
          order_data: orderData
        })
      })
      
      if (!orderSummaryResponse.ok) {
        const errorData = await orderSummaryResponse.json()
        throw new Error(`Order summary failed: ${errorData.detail || 'Unknown error'}`)
      }
      
      const orderSummaryResult = await orderSummaryResponse.json()
      console.log('Order summary sent to vending machine:', orderSummaryResult)

      // CRITICAL: Initialize vending payment through proper backend endpoint
      console.log('PaymentScreen - Initializing vending payment through backend...')
      try {
        const initPaymentResponse = await fetch(`${API_BASE_URL}/api/vending/session/${vendingMachineSession.sessionId}/init-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!initPaymentResponse.ok) {
          const errorData = await initPaymentResponse.json()
          console.error('PaymentScreen - Vending payment initialization failed:', errorData)
          throw new Error(`Payment initialization failed: ${errorData.detail || 'Unknown error'}`)
        }
        
        const initResult = await initPaymentResponse.json()
        console.log('✅ PaymentScreen - Vending payment and order completed:', initResult)
        
        // Check if this is immediate completion (shouldn't happen for pay_type 5)
        if (initResult.queue_number) {
          console.log('✅ PaymentScreen - Order completed with queue number:', initResult.queue_number)
          
          // Store completed order data
          orderData.paymentThirdId = initResult.third_id
          orderData.orderThirdId = initResult.order_third_id
          orderData.chinesePaymentId = initResult.chinese_response?.data?.id
          orderData.chineseOrderId = initResult.chinese_order_id
          orderData.queueNumber = initResult.queue_number
          orderData.mobileModelId = initResult.mobile_model_id
          orderData.paymentCompleted = true
          orderData.orderCompleted = true
          
          // Navigate directly to success screen with queue number
          navigate('/order-confirmed', {
            state: {
              orderData,
              queueNumber: initResult.queue_number,
              paymentAmount: initResult.payment_amount,
              orderResponse: initResult.order_response,
              isVendingMachine: true,
              vendingMachineSession
            }
          })
          return // Exit function - no need for polling/waiting
        } 
        
        // For vending machine payments, we expect status "awaiting_payment"
        if (initResult.status === "awaiting_payment") {
          console.log('🔄 PaymentScreen - Payment initialized, awaiting physical payment completion')
          console.log('📱 Instructions:', initResult.instructions)
          
          // Store payment initialization data
          orderData.paymentThirdId = initResult.third_id
          orderData.chinesePaymentId = initResult.chinese_payment_id
          orderData.mobileModelId = initResult.mobile_model_id
          orderData.paymentStatus = "awaiting_payment"
          
          // Continue to waiting screen with polling enabled
        } else {
          console.warn('PaymentScreen - Unexpected payment initialization response:', initResult)
          // Store available data for fallback handling
          orderData.paymentThirdId = initResult.third_id
          orderData.chinesePaymentId = initResult.chinese_response?.data?.id
          orderData.mobileModelId = initResult.mobile_model_id
        }
        
      } catch (initError) {
        console.error('PaymentScreen - Vending payment initialization failed:', initError)
        throw new Error(`Payment initialization failed: ${initError.message}`)
      }
      
      // If in vending machine mode, send order summary to vending machine
  if (isRegisteredVending && vendingMachineSession?.sessionId) {
        // Prepare order data in the format expected by the backend API
        const backendOrderData = {
          brand: brandFromState,
          brand_id: brandFromState?.toLowerCase(),
          model: modelFromState,
          template: template ? {
            id: template.id,
            name: template.name || template.id
          } : null,
          color: colorFromState,
          inputText: inputText,
          selectedFont: selectedFont,
          selectedTextColor: selectedTextColor,
          image_count: uploadedImages ? uploadedImages.length : 0,
          colors: {
            background: selectedBackgroundColor || '#ffffff',
            text: selectedTextColor || '#ffffff'
          },
          price: effectivePrice,
          basePrice: basePrice,
          addOnsTotal: addOnsTotal,
          selectedAddOns: selectedAddOns,
          chinese_model_id: selectedModelData?.chinese_model_id,
          device_id: deviceId
        }

        // DISABLED: Duplicate order-summary call (already sent before init-payment)
        // Order summary is now sent BEFORE init-payment to ensure proper flow
        
        // Chinese API integration will be handled after payment confirmation
        // Store the necessary data for post-payment processing
        orderData.deviceId = deviceId
        orderData.selectedModelData = selectedModelData
        orderData.finalImagePublicUrl = finalImagePublicUrl
        localStorage.setItem('pendingOrder', JSON.stringify(orderData))
        
        // Order is ready - no alert needed, navigation will handle user feedback
        
        // Navigate to waiting screen with vending machine context
        navigate('/vending-payment-waiting', { 
          state: { 
            orderData,
            price: effectivePrice,
            vendingMachineSession,
            isVendingMachine: true
          } 
        })
      } else if (isVendingMachine && !isRegisteredVending) {
        // Degraded mode: vending detected but not registered; inform user and fallback to app payment flow
        alert('Machine connection not established (machine busy). You can pay in-app instead.')
        navigate('/vending-payment-waiting', { 
          state: { 
            orderData,
            price: effectivePrice,
            vendingMachineSession: { ...vendingMachineSession, sessionStatus: 'registration_failed' },
            isVendingMachine: false
          } 
        })
      } else {
        // Regular flow for non-vending machine users
        navigate('/vending-payment-waiting', { 
          state: { 
            orderData,
            price: effectivePrice 
          } 
        })
      }
      
    } catch (error) {
      console.error('Vending machine payment error:', error)
      setPaymentError('Vending machine payment setup failed. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fdfdfd',
      padding: '20px',
      paddingTop: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Back Button */}
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

      {/* Phone render */}
      <div style={{ marginBottom: '40px' }}>
          {template?.id?.startsWith('film-strip') ? (
            <div className="relative w-[525px] h-[525px] overflow-hidden pointer-events-none">
              {/* Background color layer for film strip */}
              <div
                className="absolute z-5"
                style={{ 
                  backgroundColor: selectedBackgroundColor,
                  top: '2%',
                  bottom: '2%',
                  left: '28%',
                  right: '28%',
                  borderRadius: '16px'
                }}
              ></div>
              
              <div
                className="absolute inset-0 flex flex-col justify-center items-center z-10"
                style={{ paddingTop:'0px', paddingBottom:'0px', paddingLeft:'180px', paddingRight:'179px'}}
              >
                {uploadedImages && uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full overflow-hidden rounded-sm transition-all duration-300 border-t-[8px] border-b-[8px] border-black"
                    style={{ height: `${100 / (stripCount || 3) - 2}%` }}
                  >
                    <img 
                      src={img} 
                      alt={`Photo ${idx + 1}`} 
                      className="w-full h-full object-contain"
                      style={{
                        // RESTORE USER TRANSFORMS for film strip preview
                        ...(imageTransforms && imageTransforms[idx] 
                          ? { 
                              transform: `scale(${imageTransforms[idx].scale})`,
                              transformOrigin: 'center center',
                              objectPosition: `${imageTransforms[idx].x || 50}% ${imageTransforms[idx].y || 50}%`
                            }
                          : {}),
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 z-20 pointer-events-none">
                <img src="/filmstrip-case.png" alt="Film strip case" className="w-full h-full object-contain" />
              </div>
              
              {/* Text overlay for film strip - positioned above everything */}
              {inputText && (
                <div 
                  className="absolute z-30 pointer-events-none"
                  style={{
                    left: `${textPosition?.x || 50}%`,
                    top: `${textPosition?.y || 50}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <p style={getPreviewStyle()}>{inputText}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: '250px',
                height: '416px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <MaskedPhoneDisplay
                image={appState.uploadedImages.length > 1 ? appState.uploadedImages : (appState.uploadedImages.length > 0 ? appState.uploadedImages[0] : null)}
                transform={appState.uploadedImages.length > 1 ? currentImageTransforms : (appState.transform || (currentImageTransforms && currentImageTransforms[0]))}
                width={250}
                height={416}
                modelName={location.state?.selectedModelData?.model_name || location.state?.model}
                ref={overlayRef}
              />

              {/* KONVA STICKER CANVAS - Display only */}
              <KonvaStickerCanvas
                stickers={appState.placedStickers || []}
                selectedStickerId={null}
                onStickerSelect={() => {}}
                onStickerMove={() => {}}
                onStickerResize={() => {}}
                onStickerRotate={() => {}}
                onStickerDelete={() => {}}
                phoneModel={location.state?.selectedModelData?.model_name || location.state?.model}
                containerWidth={250}
                containerHeight={416}
                maskedBounds={maskedBounds}
              />

              {/* Text Elements - Overlay div */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: 250, height: 416, pointerEvents: 'none', zIndex: 20 }}>
              {/* Text Elements */}
              {(location.state?.textElements || appState.textElements || []).map((textElement) => (
                <div
                  key={textElement.id}
                  style={{
                    position: 'absolute',
                    left: `${textElement.position.x}%`,
                    top: `${textElement.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${textElement.rotation}deg)`,
                    zIndex: 15,
                    pointerEvents: 'none'
                  }}
                >
                  <div
                    style={{
                      fontFamily: textElement.font.family,
                      fontSize: `${textElement.size}px`,
                      fontWeight: 'bold',
                      color: textElement.color,
                      textAlign: 'left',
                      userSelect: 'none',
                      whiteSpace: 'pre',
                      padding: '8px'
                    }}
                  >
                    {textElement.text}
                  </div>
                </div>
              ))}

                {/* Legacy text overlay (fallback for old format) */}
                {inputText && !location.state?.finalImagePublicUrl && !location.state?.textElements?.length && !appState.textElements?.length && (
                  <div className="absolute z-15" style={getTextStyle()}>
                    <p style={getPreviewStyle()}>{inputText}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description under phone preview */}
        <div style={{
          width: '200px',
          margin: '0 auto 32px auto',
          textAlign: 'left',
          paddingLeft: '24px'
        }}>
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: '16px',
            color: '#333333',
            marginBottom: '4px',
            fontWeight: 'normal',
            letterSpacing: '-0.01em',
            lineHeight: '1.3'
          }}>
            {location.state?.selectedModelData?.model_name || location.state?.model || 'Custom Phone Case'}
          </div>
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: '14px',
            color: '#666666',
            marginBottom: '4px',
            letterSpacing: '-0.01em',
            lineHeight: '1.3'
          }}>
            MagSafe Compatible
          </div>
          <div style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: '14px',
            color: '#333333',
            fontWeight: 'bold',
            lineHeight: '1.3'
          }}>
            £{finalEffectivePrice.toFixed(2)}
          </div>
        </div>

        {/* Price Summary */}
        <div style={{
          width: '100%',
          maxWidth: '450px',
          marginBottom: '40px',
          backgroundColor: '#FAFAFA',
          borderRadius: '16px',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          {selectedAddOns.length > 0 ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  fontSize: '15px',
                  color: '#666666'
                }}>
                  Phone Case
                </span>
                <span style={{
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  fontSize: '15px',
                  color: '#333333'
                }}>
                  £{finalBasePrice.toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <span style={{
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  fontSize: '15px',
                  color: '#666666'
                }}>
                  Add-ons
                </span>
                <span style={{
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  fontSize: '15px',
                  color: '#333333'
                }}>
                  £{finalAddOnsTotal.toFixed(2)}
                </span>
              </div>
              <div style={{
                borderTop: '1px solid #E0E0E0',
                marginBottom: '16px'
              }} />
            </>
          ) : null}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
              fontSize: '18px',
              fontWeight: '600',
              color: '#333333'
            }}>
              Total
            </span>
            <span style={{
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
              fontSize: '24px',
              fontWeight: '700',
              color: '#000000'
            }}>
              £{finalEffectivePrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Conditional: Delivery Form for Vanilla Entry OR Collection Notice for QR Entry */}
        {showAddressForm ? (
          /* Delivery Details Form - Only for vanilla entry */
          <div style={{
            width: '100%',
            maxWidth: '450px',
            marginBottom: '30px',
            marginTop: '40px'
          }}>

            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={deliveryDetails.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                border: formErrors.customerName ? '1px solid #FF4444' : '1px solid #E0E0E0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF'
                if (!formErrors.customerName) {
                  e.target.style.borderColor = '#000000'
                }
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FAFAFA'
                if (!formErrors.customerName) {
                  e.target.style.borderColor = '#E0E0E0'
                }
              }}
            />
            {formErrors.customerName && (
              <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                {formErrors.customerName}
              </span>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={deliveryDetails.customerEmail}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                border: formErrors.customerEmail ? '1px solid #FF4444' : '1px solid #E0E0E0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF'
                if (!formErrors.customerEmail) {
                  e.target.style.borderColor = '#000000'
                }
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FAFAFA'
                if (!formErrors.customerEmail) {
                  e.target.style.borderColor = '#E0E0E0'
                }
              }}
            />
            {formErrors.customerEmail && (
              <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                {formErrors.customerEmail}
              </span>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="tel"
              placeholder="Phone Number"
              value={deliveryDetails.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                border: formErrors.customerPhone ? '1px solid #FF4444' : '1px solid #E0E0E0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF'
                if (!formErrors.customerPhone) {
                  e.target.style.borderColor = '#000000'
                }
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FAFAFA'
                if (!formErrors.customerPhone) {
                  e.target.style.borderColor = '#E0E0E0'
                }
              }}
            />
            {formErrors.customerPhone && (
              <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                {formErrors.customerPhone}
              </span>
            )}
          </div>

          {/* Address Line 1 */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Address Line 1"
              value={deliveryDetails.addressLine1}
              onChange={(e) => handleInputChange('addressLine1', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                border: formErrors.addressLine1 ? '1px solid #FF4444' : '1px solid #E0E0E0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF'
                if (!formErrors.addressLine1) {
                  e.target.style.borderColor = '#000000'
                }
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FAFAFA'
                if (!formErrors.addressLine1) {
                  e.target.style.borderColor = '#E0E0E0'
                }
              }}
            />
            {formErrors.addressLine1 && (
              <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                {formErrors.addressLine1}
              </span>
            )}
          </div>

          {/* Address Line 2 */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={deliveryDetails.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '15px',
                fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 200ms ease',
                boxSizing: 'border-box',
                backgroundColor: '#FAFAFA'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = '#FFFFFF'
                e.target.style.borderColor = '#000000'
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#FAFAFA'
                e.target.style.borderColor = '#E0E0E0'
              }}
            />
          </div>

          {/* City and Postcode - Side by Side */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {/* City */}
            <div style={{ flex: '1' }}>
              <input
                type="text"
                placeholder="City"
                value={deliveryDetails.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '15px',
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  border: formErrors.city ? '1px solid #FF4444' : '1px solid #E0E0E0',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxSizing: 'border-box',
                  backgroundColor: '#FAFAFA'
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF'
                  if (!formErrors.city) {
                    e.target.style.borderColor = '#000000'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = '#FAFAFA'
                  if (!formErrors.city) {
                    e.target.style.borderColor = '#E0E0E0'
                  }
                }}
              />
              {formErrors.city && (
                <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                  {formErrors.city}
                </span>
              )}
            </div>

            {/* Postcode */}
            <div style={{ flex: '0.8' }}>
              <input
                type="text"
                placeholder="Postcode"
                value={deliveryDetails.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '15px',
                  fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif',
                  border: formErrors.postcode ? '1px solid #FF4444' : '1px solid #E0E0E0',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxSizing: 'border-box',
                  backgroundColor: '#FAFAFA'
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF'
                  if (!formErrors.postcode) {
                    e.target.style.borderColor = '#000000'
                  }
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = '#FAFAFA'
                  if (!formErrors.postcode) {
                    e.target.style.borderColor = '#E0E0E0'
                  }
                }}
              />
              {formErrors.postcode && (
                <span style={{ color: '#FF4444', fontSize: '13px', marginTop: '6px', display: 'block', marginLeft: '4px' }}>
                  {formErrors.postcode}
                </span>
              )}
            </div>
          </div>
          </div>
        ) : (
          /* Collection Notice - For QR entry */
          <div style={{
            width: '100%',
            maxWidth: '450px',
            marginBottom: '30px',
            marginTop: '40px',
            backgroundColor: isFreePromo ? '#FFF4E6' : '#E8F5E9',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            {isFreePromo && (
              <div style={{
                backgroundColor: '#FF6B35',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '12px',
                display: 'inline-block'
              }}>
                🎉 FREE PROMOTIONAL CASE
              </div>
            )}
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: isFreePromo ? '#C44D00' : '#2E7D32',
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif'
            }}>
              Collect from Machine
            </h3>
            <p style={{
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'Helvetica Now, Helvetica, Arial, sans-serif'
            }}>
              {isFreePromo
                ? "This is a FREE promotional case! After confirming, your case will print at the vending machine."
                : "After payment, your case will print at the vending machine you scanned. Please wait by the machine to collect your order."
              }
            </p>
          </div>
        )}

        {/* Payment Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
          {/* Pay via App Button - Always available */}
          <button
            onClick={handlePayOnApp}
            disabled={isProcessingPayment}
            style={{
              width: '180px',
              height: '50px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #000000',
              borderRadius: '100px',
              cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              opacity: isProcessingPayment ? 0.5 : 1,
              transition: 'all 200ms ease-out'
            }}
            onMouseEnter={(e) => {
              if (!isProcessingPayment) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {isProcessingPayment ? '...' : 'Pay'}
            </span>
          </button>

          {/* Pay at Machine Button - Only for QR entry */}
          {showPayViaMachineButton && (
            <button
              onClick={handlePayViaVendingMachine}
              disabled={isProcessingPayment}
              style={{
                width: '200px',
                height: '50px',
                backgroundColor: '#000000',
                border: 'none',
                borderRadius: '100px',
                cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                opacity: isProcessingPayment ? 0.5 : 1,
                transition: 'all 200ms ease-out'
              }}
              onMouseEnter={(e) => {
                if (!isProcessingPayment) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <span style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                {isProcessingPayment ? '...' : 'Pay at Machine'}
              </span>
            </button>
          )}
        </div>

        {/* Error message */}
        {paymentError && (
          <div className="mb-4 px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {paymentError}
          </div>
        )}
    </div>
  )
}

export default PaymentScreen 

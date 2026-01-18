import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppState } from '../contexts/AppStateContext'
import environment from '../config/environment'

const PaymentSuccessScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, actions } = useAppState()
  const [isProcessing, setIsProcessing] = useState(true)
  const [orderData, setOrderData] = useState(null)
  const [error, setError] = useState(null)

  const API_BASE_URL = environment.apiBaseUrl

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get session ID from URL params
        const urlParams = new URLSearchParams(location.search)
        const sessionId = urlParams.get('session_id')
        
        if (!sessionId) {
          throw new Error('No session ID found')
        }

        console.log('PaymentSuccessScreen - Processing payment for session:', sessionId)

        // CRITICAL FIX: Retrieve final image URL from localStorage
        let orderData = {}
        try {
          const storedMetadata = localStorage.getItem('currentOrderMetadata')
          if (storedMetadata) {
            const metadata = JSON.parse(storedMetadata)
            console.log('✅ Retrieved order metadata from localStorage:', metadata)
            orderData = {
              finalImagePublicUrl: metadata.finalImagePublicUrl,
              imageSessionId: metadata.imageSessionId,
              mobile_shell_id: metadata.mobile_shell_id,
              selectedModelData: metadata.selectedModelData,
              deviceId: metadata.deviceId
            }
          } else {
            console.warn('⚠️ No order metadata found in localStorage')
          }
        } catch (e) {
          console.error('Error retrieving order metadata:', e)
        }

        // Process payment success with backend
        const response = await fetch(`${API_BASE_URL}/process-payment-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            final_image_url: orderData.finalImagePublicUrl, // CRITICAL: Send final image URL for Chinese API
            order_data: orderData
          }),
        })

        let result
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Backend payment processing had issues:', response.status, errorText)
          
          // CRITICAL FIX: For 503 errors (Chinese API failures), don't show fake success
          // These are order fulfillment failures that need user attention
          if (response.status === 503) {
            console.error('PaymentSuccessScreen - Chinese API integration failed - order not queued for printing')
            throw new Error(`Order processing failed: ${errorText}. Your payment was successful but the order could not be queued for printing. Please contact support with session ID: ${sessionId}`)
          } else if (response.status >= 500) {
            // Other server errors - also don't fake success 
            throw new Error(`Server error during order processing: ${errorText}. Please contact support with session ID: ${sessionId}`)
          } else {
            // For 4xx errors, might be recoverable - show generic error
            throw new Error(`Order processing error: ${errorText}. Please try again or contact support.`)
          }
        } else {
          result = await response.json()
          console.log('Payment processing successful:', result)
        }

        // Set order data from backend result
        setOrderData(result)

        // Clear any pending order from localStorage (if exists)
        try {
          localStorage.removeItem('pendingOrder')
          localStorage.removeItem('currentOrderMetadata') // CRITICAL FIX: Clean up order metadata
          console.log('🧹 Cleared order metadata from localStorage')
        } catch (e) {
          console.warn('Could not clear localStorage:', e)
        }

        // Reset AI credits after successful payment
        actions.setAiCredits(100)

        // Skip payment success screen and go directly to order confirmed
        navigate('/order-confirmed', {
          state: result
        })
        return
        
      } catch (err) {
        console.error('Payment processing error:', err)
        setError(err.message)
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [location.search])

  const handleContinue = () => {
    if (orderData) {
      navigate('/order-confirmed', { 
        state: orderData
      })
    }
  }

  const handleBack = () => {
    navigate('/')
  }

  if (isProcessing) {
    return (
      <div className="screen-container" style={{ background: '#fdfdfd' }}>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
            <h1
              style={{
                fontSize: '48px',
                fontFamily: 'Futura Heavy, Futura, sans-serif',
                fontWeight: '900',
                color: '#333333',
                textAlign: 'center',
                marginBottom: '16px',
                lineHeight: '1.1',
                letterSpacing: '-0.02em'
              }}
            >
              Processing Payment...
            </h1>
            <p className="text-gray-600">Please wait while we confirm your payment</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-container" style={{ background: '#fdfdfd' }}>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">✕</span>
            </div>
            <h1
              style={{
                fontSize: '48px',
                fontFamily: 'Futura Heavy, Futura, sans-serif',
                fontWeight: '900',
                color: '#333333',
                textAlign: 'center',
                marginBottom: '16px',
                lineHeight: '1.1',
                letterSpacing: '-0.02em'
              }}
            >
              Payment Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-pink-400 text-white rounded-full font-semibold"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-container" style={{ background: '#fdfdfd' }}>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-500 text-2xl">✓</span>
          </div>
          <h1
            style={{
              fontSize: '48px',
              fontFamily: 'Futura Heavy, Futura, sans-serif',
              fontWeight: '900',
              color: '#333333',
              textAlign: 'center',
              marginBottom: '16px',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}
          >
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">Your payment has been processed successfully</p>
          
          {orderData?.orderData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '300',
                  color: '#333333',
                  marginBottom: '16px'
                }}
              >
                Order Details
              </h3>
              <p className="text-sm text-gray-600">Order ID: {orderData.orderData.order_id}</p>
              <p className="text-sm text-gray-600">Payment ID: {orderData.orderData.payment_id}</p>
              <p className="text-sm text-gray-600">Amount: £{orderData.price?.toFixed(2)}</p>
            </div>
          )}
          
          <button
            onClick={handleContinue}
            className="bg-white text-black rounded-full uppercase shadow-lg hover:scale-105 transition-transform"
            style={{
              width: '180px',
              height: '50px',
              border: '1px solid #000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, sans-serif',
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}
          >
            View Order Status
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessScreen

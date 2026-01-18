import { Check } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const OrderConfirmedScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showCheck, setShowCheck] = useState(false)

  // Get real order data from payment screen
  const orderData = location.state || {}
  const orderNumber = orderData?.queue_no || orderData?.order_id || 'Loading...'

  // Determine if this is a machine collection or delivery order
  const isMachineCollection = orderData?.is_machine_collection || false
  const collectionDeviceId = orderData?.collection_device_id || null

  useEffect(() => {
    // Trigger checkmark animation after component mounts
    setTimeout(() => setShowCheck(true), 100)
  }, [])

  const handleBackToSite = () => {
    // Navigate to landing page (QR scan screen or home)
    navigate('/')
  }

  return (
    <div className="screen-container flex items-center justify-center" style={{ background: '#fdfdfd', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes checkmarkDraw {
            0% {
              stroke-dashoffset: 100;
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              stroke-dashoffset: 0;
              opacity: 1;
            }
          }

          @keyframes circleScale {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .checkmark-icon {
            animation: checkmarkDraw 0.8s ease-out forwards;
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }

          .circle-container {
            animation: circleScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>

      <div className="flex flex-col items-center justify-center gap-8 px-6 py-12">
        {/* Big black circle with animated checkmark */}
        <div
          className={`circle-container flex items-center justify-center bg-black rounded-full ${showCheck ? '' : 'opacity-0'}`}
          style={{ width: '200px', height: '200px' }}
        >
          <Check
            size={100}
            strokeWidth={3}
            className="checkmark-icon text-white"
          />
        </div>

        {/* Success message - Conditional based on order type */}
        {isMachineCollection ? (
          <>
            <h1
              style={{
                fontSize: '32px',
                fontFamily: 'Futura Heavy, Futura, sans-serif',
                fontWeight: '700',
                color: '#333333',
                textAlign: 'center',
                lineHeight: '1.2',
                marginTop: '16px'
              }}
            >
              Collect Your Case
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontFamily: 'Poppins, sans-serif',
                color: '#666666',
                textAlign: 'center',
                marginTop: '12px',
                lineHeight: '1.6',
                maxWidth: '400px'
              }}
            >
              Your phone case is printing now!
              <br />
              Please wait by the vending machine to collect your order.
            </p>
            {collectionDeviceId && (
              <div
                style={{
                  backgroundColor: '#E3F2FD',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  marginTop: '20px',
                  marginBottom: '16px'
                }}
              >
                <p
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1976D2',
                    margin: 0
                  }}
                >
                  Machine: {collectionDeviceId}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <h1
              style={{
                fontSize: '32px',
                fontFamily: 'Futura Heavy, Futura, sans-serif',
                fontWeight: '700',
                color: '#333333',
                textAlign: 'center',
                lineHeight: '1.2',
                marginTop: '16px'
              }}
            >
              Your order is placed successfully
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontFamily: 'Poppins, sans-serif',
                color: '#666666',
                textAlign: 'center',
                marginTop: '12px',
                lineHeight: '1.6',
                maxWidth: '400px'
              }}
            >
              Your custom phone case will be delivered to your address.
              <br />
              You will receive a confirmation email with tracking details.
            </p>
          </>
        )}

        {/* Order ID */}
        <div className="text-center" style={{ marginTop: '24px' }}>
          <p
            style={{
              fontSize: '16px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: '300',
              color: '#666666',
              marginBottom: '4px'
            }}
          >
            Order ID
          </p>
          <p
            style={{
              fontSize: '24px',
              fontFamily: 'Futura Heavy, Futura, sans-serif',
              fontWeight: '600',
              color: '#333333'
            }}
          >
            {orderNumber}
          </p>
        </div>

        {/* Back to site button */}
        <button
          onClick={handleBackToSite}
          className="mt-8 px-12 py-4 bg-black text-white rounded-full font-semibold text-lg active:scale-95 transition-transform shadow-lg hover:bg-gray-800"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '18px'
          }}
        >
          Back to site
        </button>
      </div>
    </div>
  )
}

export default OrderConfirmedScreen
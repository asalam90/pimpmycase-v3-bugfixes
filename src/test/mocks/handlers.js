import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:8000'

export const handlers = [
  // Mock Stripe checkout session creation
  http.post(`${API_BASE_URL}/api/payment/create-checkout-session`, async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      checkout_url: 'https://checkout.stripe.com/test-session',
      session_id: 'cs_test_123456'
    })
  }),

  // Mock payment success processing
  http.post(`${API_BASE_URL}/api/payment/process-payment-success`, async ({ request }) => {
    const body = await request.json()
    const metadata = body.metadata || {}

    return HttpResponse.json({
      order_id: 'PMC-00001',
      queue_no: 'PMC-00001',
      entry_source: metadata.entry_source || 'vanilla',
      is_machine_collection: metadata.is_machine_collection || false,
      collection_device_id: metadata.machine_id || null
    })
  }),

  // Mock Chinese API payData
  http.post(`${API_BASE_URL}/api/chinese/order/payData`, () => {
    return HttpResponse.json({
      code: 200,
      data: { id: 'chinese_pay_123' },
      msg: 'success'
    })
  }),

  // Mock brands endpoint
  http.get(`${API_BASE_URL}/api/brands`, () => {
    return HttpResponse.json([
      { id: 'iphone', display_name: 'iPhone', chinese_brand_id: '1' }
    ])
  }),

  // Mock models endpoint
  http.get(`${API_BASE_URL}/api/models`, () => {
    return HttpResponse.json([
      { id: 'iphone-15', brand_id: 'iphone', display_name: 'iPhone 15', chinese_model_id: '101' }
    ])
  }),

  // Mock templates endpoint
  http.get(`${API_BASE_URL}/api/templates`, () => {
    return HttpResponse.json([
      {
        id: 'classic',
        name: 'Classic',
        description: 'Classic phone case design',
        price: 35.00,
        requires_image: true,
        requires_ai: false
      }
    ])
  })
]

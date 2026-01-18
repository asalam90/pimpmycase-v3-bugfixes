import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import OrderConfirmedScreen from '../OrderConfirmedScreen'

// Mock useLocation to provide order data
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: vi.fn()
  }
})

import { useLocation } from 'react-router-dom'

describe('OrderConfirmedScreen - Machine Collection', () => {
  it('should show collection message for machine collection orders', () => {
    // Mock location state with machine collection data
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: true,
          collection_device_id: 'TEST123',
          queue_no: 'PMC-00001',
          order_id: 'PMC-00001'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should show collection-specific messaging
    const collectionMessage = screen.queryByText(/collect your case/i)
    expect(collectionMessage).toBeInTheDocument()
  })

  it('should display machine ID for collection orders', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: true,
          collection_device_id: 'MACHINE_XYZ',
          queue_no: 'PMC-00002',
          order_id: 'PMC-00002'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should display the machine ID
    const machineId = screen.queryByText(/MACHINE_XYZ/i)
    expect(machineId).toBeInTheDocument()
  })

  it('should show waiting message for machine collection', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: true,
          collection_device_id: 'TEST123',
          queue_no: 'PMC-00003'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should mention waiting by the machine
    const waitingMessage = screen.queryByText(/wait.*machine/i) || screen.queryByText(/printing/i)
    expect(waitingMessage).toBeInTheDocument()
  })
})

describe('OrderConfirmedScreen - Delivery', () => {
  it('should show delivery message for vanilla orders', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: false,
          queue_no: 'PMC-00004',
          order_id: 'PMC-00004'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should show delivery-specific messaging
    const deliveryMessage = screen.queryByText(/order.*placed.*success/i) || screen.queryByText(/deliver/i)
    expect(deliveryMessage).toBeTruthy()
  })

  it('should not display machine ID for delivery orders', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: false,
          collection_device_id: null,
          queue_no: 'PMC-00005'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should NOT show machine-specific info box
    const machineInfo = screen.queryByText(/machine:/i)
    expect(machineInfo).not.toBeInTheDocument()
  })

  it('should not show "collect from machine" message for delivery', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          is_machine_collection: false,
          queue_no: 'PMC-00006'
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should NOT show collection message
    const collectionMessage = screen.queryByText(/collect your case/i)
    expect(collectionMessage).not.toBeInTheDocument()
  })
})

describe('OrderConfirmedScreen - Edge Cases', () => {
  it('should handle missing orderData gracefully', () => {
    useLocation.mockReturnValue({
      state: null
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should still render without crashing
    expect(screen.getByText(/order|success|thank/i)).toBeInTheDocument()
  })

  it('should default to delivery behavior when is_machine_collection is undefined', () => {
    useLocation.mockReturnValue({
      state: {
        orderData: {
          queue_no: 'PMC-00007'
          // is_machine_collection is undefined
        }
      }
    })

    renderWithProviders(<OrderConfirmedScreen />, {
      route: '/order-confirmed'
    })

    // Should default to delivery flow (no collection message)
    const collectionMessage = screen.queryByText(/collect your case/i)
    expect(collectionMessage).not.toBeInTheDocument()
  })
})

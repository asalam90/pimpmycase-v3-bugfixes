import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import PaymentScreen from '../PaymentScreen'

describe('PaymentScreen - QR Entry', () => {
  const qrInitialState = {
    entrySource: 'qr',
    vendingMachineSession: {
      isVendingMachine: true,
      machineId: 'TEST123',
      sessionStatus: 'registered',
      deviceId: 'TEST123'
    },
    brand: 'iPhone',
    model: 'iPhone 15',
    modelData: { chinese_model_id: '101' },
    uploadedImages: [{ data: 'test-image' }],
    template: { id: 'classic', name: 'Classic', price: 35.00 },
    color: 'Clear'
  }

  it('should show "Pay at Machine" button for registered QR session', async () => {
    renderWithProviders(<PaymentScreen />, {
      initialState: qrInitialState,
      route: '/payment'
    })

    // Wait for component to render
    await screen.findByText(/phone case checkout/i)

    // Should show "Pay at Machine" button
    const payAtMachineButton = screen.queryByText(/pay at machine/i)
    expect(payAtMachineButton).toBeInTheDocument()
  })

  it('should hide "Pay at Machine" button for unregistered QR session', async () => {
    const unregisteredState = {
      ...qrInitialState,
      vendingMachineSession: {
        ...qrInitialState.vendingMachineSession,
        sessionStatus: 'active' // Not 'registered'
      }
    }

    renderWithProviders(<PaymentScreen />, {
      initialState: unregisteredState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Should NOT show "Pay at Machine" button
    const payAtMachineButton = screen.queryByText(/pay at machine/i)
    expect(payAtMachineButton).not.toBeInTheDocument()
  })

  it('should show collection notice for QR entry', async () => {
    renderWithProviders(<PaymentScreen />, {
      initialState: qrInitialState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Should show collection notice
    const collectionNotice = screen.queryByText(/collect.*machine/i)
    expect(collectionNotice).toBeInTheDocument()
  })
})

describe('PaymentScreen - Vanilla Entry', () => {
  const vanillaInitialState = {
    entrySource: 'vanilla',
    vendingMachineSession: {
      isVendingMachine: false,
      deviceId: null
    },
    brand: 'iPhone',
    model: 'iPhone 15',
    modelData: { chinese_model_id: '101' },
    uploadedImages: [{ data: 'test-image' }],
    template: { id: 'classic', name: 'Classic', price: 35.00 },
    color: 'Clear'
  }

  it('should hide "Pay at Machine" button for vanilla entry', async () => {
    renderWithProviders(<PaymentScreen />, {
      initialState: vanillaInitialState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Should NOT show "Pay at Machine" button
    const payAtMachineButton = screen.queryByText(/pay at machine/i)
    expect(payAtMachineButton).not.toBeInTheDocument()
  })

  it('should show delivery form for vanilla entry', async () => {
    renderWithProviders(<PaymentScreen />, {
      initialState: vanillaInitialState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Should show delivery form fields
    const nameInput = screen.queryByLabelText(/name/i) || screen.queryByPlaceholderText(/name/i)
    const emailInput = screen.queryByLabelText(/email/i) || screen.queryByPlaceholderText(/email/i)

    // At least one of these should be present
    expect(nameInput || emailInput).toBeTruthy()
  })

  it('should not show collection notice for vanilla entry', async () => {
    renderWithProviders(<PaymentScreen />, {
      initialState: vanillaInitialState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Should NOT show collection notice specific to machines
    const collectionNotice = screen.queryByText(/collect.*vending machine/i)
    expect(collectionNotice).not.toBeInTheDocument()
  })
})

describe('PaymentScreen - Entry Source Detection', () => {
  it('should detect QR entry from state', async () => {
    const qrState = {
      entrySource: 'qr',
      vendingMachineSession: {
        isVendingMachine: true,
        machineId: 'TEST123',
        sessionStatus: 'active'
      },
      brand: 'iPhone',
      model: 'iPhone 15',
      modelData: { chinese_model_id: '101' },
      uploadedImages: [{ data: 'test-image' }],
      template: { id: 'classic', name: 'Classic', price: 35.00 },
      color: 'Clear'
    }

    renderWithProviders(<PaymentScreen />, {
      initialState: qrState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Verify QR-specific elements
    const collectionNotice = screen.queryByText(/collect/i)
    expect(collectionNotice).toBeInTheDocument()
  })

  it('should detect vanilla entry from state', async () => {
    const vanillaState = {
      entrySource: 'vanilla',
      vendingMachineSession: {
        isVendingMachine: false,
        deviceId: null
      },
      brand: 'iPhone',
      model: 'iPhone 15',
      modelData: { chinese_model_id: '101' },
      uploadedImages: [{ data: 'test-image' }],
      template: { id: 'classic', name: 'Classic', price: 35.00 },
      color: 'Clear'
    }

    renderWithProviders(<PaymentScreen />, {
      initialState: vanillaState,
      route: '/payment'
    })

    await screen.findByText(/phone case checkout/i)

    // Verify vanilla-specific behavior (no "Pay at Machine" button)
    const payAtMachineButton = screen.queryByText(/pay at machine/i)
    expect(payAtMachineButton).not.toBeInTheDocument()
  })
})

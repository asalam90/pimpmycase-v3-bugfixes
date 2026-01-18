import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/testUtils'
import LandingScreen from '../LandingScreen'

describe('LandingScreen - Entry Source Detection', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should detect QR entry from URL parameters', async () => {
    const route = '/?qr=true&machine_id=TEST123&session_id=SESSION456'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.entrySource).toBe('qr')
      expect(stored.vendingMachineSession.machineId).toBe('TEST123')
      expect(stored.vendingMachineSession.sessionId).toBe('SESSION456')
      expect(stored.vendingMachineSession.isVendingMachine).toBe(true)
      expect(stored.vendingMachineSession.deviceId).toBe('TEST123')
      expect(stored.vendingMachineSession.sessionStatus).toBe('active')
    }, { timeout: 2000 })
  })

  it('should detect vanilla entry when no QR parameters', async () => {
    const route = '/'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.entrySource).toBe('vanilla')
      expect(stored.vendingMachineSession.isVendingMachine).toBe(false)
      expect(stored.vendingMachineSession.deviceId).toBeNull()
    }, { timeout: 2000 })
  })

  it('should default to vanilla when qr param is missing machine_id', async () => {
    const route = '/?qr=true'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.entrySource).toBe('vanilla')
      expect(stored.vendingMachineSession.isVendingMachine).toBe(false)
    }, { timeout: 2000 })
  })

  it('should default to vanilla when qr=false', async () => {
    const route = '/?qr=false&machine_id=TEST123'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.entrySource).toBe('vanilla')
      expect(stored.vendingMachineSession.isVendingMachine).toBe(false)
    }, { timeout: 2000 })
  })

  it('should include location parameter if provided', async () => {
    const route = '/?qr=true&machine_id=TEST123&location=London%20Mall'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.vendingMachineSession.location).toBe('London Mall')
    }, { timeout: 2000 })
  })

  it('should set deviceId same as machineId for QR entry', async () => {
    const route = '/?qr=true&machine_id=MACHINE_XYZ&session_id=SESSION999'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.vendingMachineSession.deviceId).toBe('MACHINE_XYZ')
      expect(stored.vendingMachineSession.machineId).toBe('MACHINE_XYZ')
    }, { timeout: 2000 })
  })

  it('should handle missing session_id parameter gracefully', async () => {
    const route = '/?qr=true&machine_id=TEST123'

    renderWithProviders(<LandingScreen />, { route })

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('appState'))
      expect(stored.entrySource).toBe('qr')
      expect(stored.vendingMachineSession.machineId).toBe('TEST123')
      // sessionId should be null or undefined, but entry should still be QR
      expect(stored.vendingMachineSession.isVendingMachine).toBe(true)
    }, { timeout: 2000 })
  })
})

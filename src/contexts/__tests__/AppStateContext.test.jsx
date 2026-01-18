import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppStateProvider, useAppState } from '../AppStateContext'

describe('AppStateContext - Entry Source Management', () => {
  const wrapper = ({ children }) => (
    <AppStateProvider>{children}</AppStateProvider>
  )

  it('should initialize with null entry source', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })
    expect(result.current.state.entrySource).toBeNull()
  })

  it('should set entry source to "qr"', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    act(() => {
      result.current.actions.setEntrySource('qr')
    })

    expect(result.current.state.entrySource).toBe('qr')
  })

  it('should set entry source to "vanilla"', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    act(() => {
      result.current.actions.setEntrySource('vanilla')
    })

    expect(result.current.state.entrySource).toBe('vanilla')
  })

  it('should set vending machine session for QR entry', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    const sessionData = {
      isVendingMachine: true,
      machineId: 'TEST123',
      sessionId: 'SESSION456',
      deviceId: 'TEST123',
      sessionStatus: 'active'
    }

    act(() => {
      result.current.actions.setVendingMachineSession(sessionData)
    })

    expect(result.current.state.vendingMachineSession.isVendingMachine).toBe(true)
    expect(result.current.state.vendingMachineSession.machineId).toBe('TEST123')
    expect(result.current.state.vendingMachineSession.sessionId).toBe('SESSION456')
    expect(result.current.state.vendingMachineSession.deviceId).toBe('TEST123')
    expect(result.current.state.vendingMachineSession.sessionStatus).toBe('active')
  })

  it('should clear vending machine session for vanilla entry', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    // First set a QR session
    act(() => {
      result.current.actions.setVendingMachineSession({
        isVendingMachine: true,
        machineId: 'TEST123',
        deviceId: 'TEST123'
      })
    })

    // Verify it was set
    expect(result.current.state.vendingMachineSession.isVendingMachine).toBe(true)

    // Then clear it for vanilla
    act(() => {
      result.current.actions.setVendingMachineSession({
        isVendingMachine: false,
        deviceId: null
      })
    })

    expect(result.current.state.vendingMachineSession.isVendingMachine).toBe(false)
    expect(result.current.state.vendingMachineSession.deviceId).toBeNull()
  })

  it('should persist entry source to localStorage', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    act(() => {
      result.current.actions.setEntrySource('qr')
    })

    const stored = JSON.parse(localStorage.getItem('appState'))
    expect(stored.entrySource).toBe('qr')
  })

  it('should handle location parameter in vending machine session', () => {
    const { result } = renderHook(() => useAppState(), { wrapper })

    const sessionData = {
      isVendingMachine: true,
      machineId: 'TEST123',
      sessionId: 'SESSION456',
      deviceId: 'TEST123',
      sessionStatus: 'active',
      location: 'London Mall'
    }

    act(() => {
      result.current.actions.setVendingMachineSession(sessionData)
    })

    expect(result.current.state.vendingMachineSession.location).toBe('London Mall')
  })
})

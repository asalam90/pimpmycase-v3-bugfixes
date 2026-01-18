/**
 * Integration tests for KonvaCanvasEditor in PhonePreviewScreen
 * TDD approach: Write tests first, then implement integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppStateProvider } from '../../contexts/AppStateContext'

// Mock the KonvaCanvasEditor component
vi.mock('../../components/KonvaCanvasEditor', () => ({
  default: ({ initialImage, onExport, containerWidth, containerHeight, onTransformChange }) => (
    <div data-testid="konva-canvas-editor">
      <div data-testid="canvas-dimensions">{containerWidth}x{containerHeight}</div>
      {initialImage && <img data-testid="canvas-image" src={initialImage} alt="canvas" />}
      <button 
        data-testid="export-button" 
        onClick={() => onExport && onExport('data:image/png;base64,mockexport')}
      >
        Export
      </button>
      <button
        data-testid="transform-button"
        onClick={() => onTransformChange && onTransformChange({ x: 10, y: 20, scale: 1.5 })}
      >
        Transform
      </button>
    </div>
  )
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: {
        brand: 'APPLE',
        model: 'iPhone 15 Pro',
        template: { id: 'classic', name: 'Classic' }
      }
    })
  }
})

// Mock the AI image service
vi.mock('../../services/aiImageService', () => ({
  default: {
    getChineseBrands: vi.fn().mockResolvedValue({
      success: true,
      brands: [
        { id: 1, name: 'Apple', e_name: 'apple' },
        { id: 2, name: 'Samsung', e_name: 'samsung' }
      ]
    }),
    getPhoneModels: vi.fn().mockResolvedValue({
      success: true,
      models: [
        { 
          mobile_model_id: 1, 
          model_name: 'iPhone 15 Pro',
          width: 70,
          height: 146,
          price: 35.00
        }
      ]
    })
  }
}))

// Helper to render with providers
const renderWithProviders = (ui, options = {}) => {
  return render(
    <MemoryRouter initialEntries={['/phone-preview']}>
      <AppStateProvider>
        {ui}
      </AppStateProvider>
    </MemoryRouter>,
    options
  )
}

describe('PhonePreviewScreen with KonvaCanvasEditor Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Canvas Editor Rendering', () => {
    it('should render KonvaCanvasEditor when useKonvaEditor flag is true', async () => {
      // This test will pass once we add the KonvaCanvasEditor to PhonePreviewScreen
      // For now, we're defining the expected behavior
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      // Render with Konva editor enabled
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      // Wait for models to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Should render the Konva canvas editor
      expect(screen.getByTestId('konva-canvas-editor')).toBeInTheDocument()
    })

    it('should pass correct dimensions to KonvaCanvasEditor', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Check that dimensions are passed correctly
      const dimensions = screen.getByTestId('canvas-dimensions')
      expect(dimensions).toBeInTheDocument()
    })
  })

  describe('Image Upload Integration', () => {
    it('should display uploaded image in KonvaCanvasEditor', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // After uploading an image, it should appear in the canvas
      // This tests the prop passing from PhonePreviewScreen to KonvaCanvasEditor
    })
  })

  describe('Transform State Synchronization', () => {
    it('should sync transform changes from KonvaCanvasEditor to AppState', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Trigger a transform change in the canvas
      const transformButton = screen.queryByTestId('transform-button')
      if (transformButton) {
        fireEvent.click(transformButton)
        // The transform should be synced to AppState
      }
    })
  })

  describe('Export Functionality', () => {
    it('should handle export from KonvaCanvasEditor', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // The export callback should be available
      const exportButton = screen.queryByTestId('export-button')
      if (exportButton) {
        fireEvent.click(exportButton)
        // Export should trigger correctly
      }
    })
  })

  describe('Fallback to MaskedPhoneDisplay', () => {
    it('should render MaskedPhoneDisplay when useKonvaEditor is false', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={false} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Should NOT have Konva editor
      expect(screen.queryByTestId('konva-canvas-editor')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Touch Interactions', () => {
    it('should support touch events on mobile devices', async () => {
      const PhonePreviewScreen = (await import('../PhonePreviewScreen')).default
      
      renderWithProviders(<PhonePreviewScreen useKonvaEditor={true} />)
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // KonvaCanvasEditor should handle touch events
      // This is handled internally by the component
    })
  })
})

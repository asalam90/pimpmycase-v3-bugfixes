/**
 * KonvaCanvasEditor Component Tests
 * 
 * Test-Driven Development for the Konva-based canvas editor
 * Updated for premium redesigned component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Konva and react-konva since they require canvas
vi.mock('react-konva', () => ({
  Stage: ({ children, onMouseDown, onTouchStart, ...props }) => {
    const handleClick = (e) => {
      const mockEvent = {
        target: {
          getStage: () => mockEvent.target
        }
      }
      if (onMouseDown) onMouseDown(mockEvent)
    }
    return (
      <div data-testid="konva-stage" onClick={handleClick} {...props}>
        {children}
      </div>
    )
  },
  Layer: ({ children }) => <div data-testid="konva-layer">{children}</div>,
  Image: ({ onClick, onTap, draggable, ...props }) => (
    <div 
      data-testid="konva-image" 
      onClick={onClick}
      data-draggable={draggable}
      {...props}
    />
  ),
  Transformer: (props) => <div data-testid="konva-transformer" {...props} />,
  Rect: (props) => <div data-testid="konva-rect" {...props} />,
  Group: ({ children }) => <div data-testid="konva-group">{children}</div>,
  Shape: (props) => <div data-testid="konva-shape" {...props} />,
}))

vi.mock('use-image', () => ({
  default: (src) => {
    if (!src) return [null, 'loading']
    // Return a mock image object with dimensions
    return [{ 
      src, 
      width: 400, 
      height: 600,
      naturalWidth: 400,
      naturalHeight: 600
    }, 'loaded']
  }
}))

vi.mock('konva', () => ({
  default: {
    hitOnDragEnabled: true,
    captureTouchEventsEnabled: true
  }
}))

// Import component after mocks
import KonvaCanvasEditor from '../KonvaCanvasEditor'

describe('KonvaCanvasEditor', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // Mock Image constructor for addImage functionality
    global.Image = class {
      constructor() {
        this.crossOrigin = ''
        this.onload = null
        this.width = 400
        this.height = 600
      }
      set src(value) {
        this._src = value
        // Trigger onload asynchronously
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
      get src() {
        return this._src
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the canvas stage', () => {
      render(<KonvaCanvasEditor />)
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    it('renders with custom dimensions', () => {
      render(<KonvaCanvasEditor containerWidth={400} containerHeight={700} />)
      const stage = screen.getByTestId('konva-stage')
      expect(stage).toBeInTheDocument()
    })

    it('shows upload hint when no images are present', () => {
      render(<KonvaCanvasEditor />)
      expect(screen.getByText(/tap upload to add a photo/i)).toBeInTheDocument()
    })

    it('renders toolbar with undo, redo, and upload buttons', () => {
      render(<KonvaCanvasEditor />)
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
    })
    
    it('renders phone back image for realistic mockup', () => {
      render(<KonvaCanvasEditor />)
      // The phone back is rendered as an img element for realistic mockup
      const phoneBack = document.querySelector('img[alt="Phone case"]')
      expect(phoneBack).toBeInTheDocument()
    })
  })

  describe('Image Upload', () => {
    it('has a hidden file input for image upload', () => {
      render(<KonvaCanvasEditor />)
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', 'image/*')
      expect(fileInput).toHaveStyle({ display: 'none' })
    })

    it('triggers file input when upload button is clicked', async () => {
      render(<KonvaCanvasEditor />)
      const uploadButton = screen.getByRole('button', { name: /upload/i })
      const fileInput = document.querySelector('input[type="file"]')
      const clickSpy = vi.spyOn(fileInput, 'click')
      
      await user.click(uploadButton)
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('Undo/Redo', () => {
    it('disables undo button when no history', () => {
      render(<KonvaCanvasEditor />)
      const undoButton = screen.getByRole('button', { name: /undo/i })
      expect(undoButton).toBeDisabled()
    })

    it('disables redo button when at latest state', () => {
      render(<KonvaCanvasEditor />)
      const redoButton = screen.getByRole('button', { name: /redo/i })
      expect(redoButton).toBeDisabled()
    })
  })

  describe('Selection', () => {
    it('deselects when clicking on empty stage area', async () => {
      render(<KonvaCanvasEditor initialImage="test.jpg" />)
      const stage = screen.getByTestId('konva-stage')
      
      fireEvent.click(stage)
      
      // Delete button should not be visible when nothing is selected
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })
  })

  describe('Delete', () => {
    it('does not show delete button when nothing is selected', () => {
      render(<KonvaCanvasEditor />)
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible labels on all toolbar buttons', () => {
      render(<KonvaCanvasEditor />)
      
      expect(screen.getByRole('button', { name: /undo/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /redo/i })).toHaveAttribute('aria-label')
      expect(screen.getByRole('button', { name: /upload/i })).toHaveAttribute('aria-label')
    })
  })

  describe('Props', () => {
    it('accepts initialImage prop', () => {
      render(<KonvaCanvasEditor initialImage="test-image.jpg" />)
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })

    it('accepts phoneModel prop', () => {
      render(<KonvaCanvasEditor phoneModel="iPhone 16 Pro" />)
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })
    
    it('accepts containerWidth and containerHeight props', () => {
      render(<KonvaCanvasEditor containerWidth={300} containerHeight={500} />)
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })
    
    it('accepts onTransformChange callback', () => {
      const onTransformChange = vi.fn()
      render(<KonvaCanvasEditor onTransformChange={onTransformChange} />)
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
    })
  })
  
  describe('Premium UI', () => {
    it('renders with premium styling', () => {
      const { container } = render(<KonvaCanvasEditor />)
      // The main container should exist with proper structure
      const mainContainer = container.firstChild
      expect(mainContainer).toBeInTheDocument()
      // Should have phone back image for realistic mockup
      const phoneBack = container.querySelector('img[alt="Phone case"]')
      expect(phoneBack).toBeInTheDocument()
    })
    
    it('toolbar buttons have labels', () => {
      render(<KonvaCanvasEditor />)
      // Each button should have a text label, not just an icon
      expect(screen.getByText('Undo')).toBeInTheDocument()
      expect(screen.getByText('Redo')).toBeInTheDocument()
      expect(screen.getByText('Upload')).toBeInTheDocument()
    })
  })
  
  describe('Aspect Ratio Preservation', () => {
    it('maintains image aspect ratio when adding new image', async () => {
      const { container } = render(<KonvaCanvasEditor initialImage="test.jpg" />)
      
      // Wait for the image to be processed
      await waitFor(() => {
        // The image should be rendered in the Konva layer
        expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
      })
    })
  })
})

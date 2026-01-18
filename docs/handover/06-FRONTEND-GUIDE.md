# Frontend Guide - PimpMyCase Webstore

## Quick Reference

- **Framework**: React 18.2 + Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 6.21
- **State**: Context + Reducer Pattern
- **Entry Point**: `src/main.jsx` → `src/App.jsx`

## Directory Structure

```
src/
├── App.jsx                  # Main router (36 routes)
├── main.jsx                 # React entry point
├── index.css                # Global styles + Tailwind
├── screens/                 # 35 screen components
│   ├── LandingScreen.jsx          # Entry (37KB - largest)
│   ├── BrandModelSelectionScreen.jsx
│   ├── TemplateSelectionScreen.jsx
│   ├── CustomizeImageScreen.jsx
│   ├── PhonePreviewScreen.jsx
│   ├── AddStickersScreen.jsx
│   ├── TextInputScreen.jsx
│   ├── PaymentScreen.jsx          # Payment flow (56KB)
│   ├── RetroRemixScreen.jsx       # AI templates
│   ├── FunnyToonScreen.jsx
│   ├── GlitchProGenerateScreen.jsx
│   └── ...more screens
├── components/              # 7 shared components
│   ├── MaskedPhoneDisplay.jsx     # Phone case preview (15KB)
│   ├── OptimizedDraggableSticker.jsx (23KB)
│   ├── OptimizedDraggableText.jsx    (23KB)
│   ├── CircleSubmitButton.jsx
│   └── TopNavBar.jsx
├── contexts/               # State management
│   └── AppStateContext.jsx        # Global state (reducer pattern)
├── services/               # API communication
│   └── aiImageService.js          # Backend API client
├── hooks/                  # Custom React hooks
│   ├── useMaskedBounds.js         # Sticker boundary constraints
│   └── usePinchToScale.js         # Touch gestures
├── utils/                  # Utility functions
│   ├── phoneCaseLayout.js         # Layout calculations (38KB)
│   ├── finalImageComposer.js      # Image export (25KB)
│   ├── stickerLoader.js           # Sticker loading (18KB)
│   ├── fontManager.js             # Font definitions
│   └── imageEnhancer.js           # Image processing
├── config/                 # Configuration
│   ├── environment.js             # Environment vars
│   └── templatePricing.js         # Template prices
└── styles/                 # Styling
    ├── fonts.css                  # Font imports
    └── PHONE_CASE_LAYOUT_GUIDE.md
```

## State Management (AppStateContext)

### Global State Structure

```javascript
const initialState = {
  // Phone Selection
  brand: 'iPhone',
  model: 'iPhone 15 Pro',
  modelData: { width: 74.42, height: 150.96, chinese_model_id: '...' },

  // Template
  template: { id: 'classic', name: 'Classic', imageCount: 1 },

  // Images
  uploadedImages: [{id, src, transform: {x, y, scale}}],

  // Customization
  placedStickers: [{placedId, id, x, y, scale, rotation}],
  customText: [{text, font, color, position, rotation}],
  selectedFont: 'Arial',
  selectedTextColor: '#ffffff',
  selectedBackgroundColor: '#ffffff',

  // Session
  vendingMachineSession: {sessionId, machineId, expiresAt},

  // Order
  currentOrder: {orderId, queueNumber, status}
}
```

### Dispatch Actions

```javascript
// Phone selection
dispatch({type: 'SET_BRAND', payload: 'iPhone'})
dispatch({type: 'SET_MODEL', payload: {model: '...', modelData: {...}}})

// Template
dispatch({type: 'SET_TEMPLATE', payload: {id: 'classic', ...}})

// Images
dispatch({type: 'SET_UPLOADED_IMAGES', payload: [...]})
dispatch({type: 'UPDATE_IMAGE_TRANSFORM', payload: {index, transform}})

// Stickers
dispatch({type: 'ADD_STICKER', payload: {id, x, y, ...}})
dispatch({type: 'UPDATE_STICKER', payload: {placedId, updates}})
dispatch({type: 'REMOVE_STICKER', payload: placedId})

// Text
dispatch({type: 'ADD_TEXT', payload: {text, font, color, ...}})
dispatch({type: 'SET_SELECTED_FONT', payload: 'Helvetica'})

// Session
dispatch({type: 'SET_VENDING_SESSION', payload: {sessionId, ...}})

// Reset
dispatch({type: 'RESET_STATE'})
```

### LocalStorage Persistence

Auto-saves to `localStorage` on state changes:
- Key: `pimpmycaseAppState`
- Size limit: 5MB (enforced)
- Excludes: Loading states, errors

## Key Components

### MaskedPhoneDisplay

**Purpose**: Phone case preview with SVG mask for camera cutout

**Props**:
```javascript
<MaskedPhoneDisplay
  uploadedImages={[{src, transform}]}
  placedStickers={[{x, y, scale, rotation, imageUrl}]}
  customText={[{text, font, color, position, rotation}]}
  selectedBackgroundColor="#ffffff"
  modelData={{width, height, model}}
/>
```

**Features**:
- SVG clip-path for camera cutouts
- Responsive sizing
- Real-time preview updates

### OptimizedDraggableSticker

**Purpose**: Touch-optimized sticker with drag, resize, rotate

**Props**:
```javascript
<OptimizedDraggableSticker
  sticker={{id, x, y, scale, rotation, imageUrl}}
  onUpdate={(updates) => {...}}
  onRemove={() => {...}}
  bounds={{minX, minY, maxX, maxY}}
/>
```

**Features**:
- Touch/mouse drag
- Pinch-to-zoom
- Two-finger rotation
- Delete button
- Boundary constraints

## Key Utilities

### phoneCaseLayout.js

```javascript
// Get mask position for phone model
const maskPosition = getMaskPosition(model)
// Returns: {x, y, width, height} as percentages

// Get physical dimensions
const dimensions = getPhysicalDimensions(model)
// Returns: {width: mm, height: mm}

// Calculate aspect ratio
const aspectRatio = calculateAspectRatio(width, height)
```

### finalImageComposer.js

```javascript
// Compose final exportable image
const dataUrl = await composeFinalImage({
  template,
  uploadedImages,
  placedStickers,
  textElements,
  selectedBackgroundColor,
  modelData
})
// Returns: PNG data URL (1390px wide, proportional height)
```

### stickerLoader.js

```javascript
// Load stickers by category
const stickers = await loadStickersByCategory('CATS')
// Returns: [{id, name, category, imageUrl, thumbnail}]

// Get all categories
const categories = getStickerCategories()
// Returns: ['ABSTRACT', 'CATS', 'DOGS', ...]
```

## Routing Flow

### E-Commerce Flow
```
/ → /brand-model-selection → /template-selection →
[Template-specific upload] → /phone-preview →
/text-input → /font-selection → /add-stickers →
/payment → /payment-success
```

### Vending Flow
```
/qr?session_id=xxx → /brand-model-selection →
/template-selection → [Customization] →
/vending-payment-waiting → /vending-payment-success
```

## Styling Approach

### Tailwind CSS

**Utility-first classes**:
```jsx
<div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md">
```

### Inline Styles (for dynamic values)

```jsx
<div style={{
  backgroundColor: selectedBackgroundColor,
  transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`
}}>
```

### CSS Modules (not used)

This project uses global CSS and Tailwind, not CSS modules.

## API Integration

### aiImageService.js

```javascript
// Generate AI image
const result = await aiImageService.generateImage({
  imageData: 'data:image/...',
  style: 'funny-toon',
  quality: 'standard'
})
// Returns: {image_url: '...'}

// Create checkout session
const session = await aiImageService.createCheckoutSession({
  amount_pence: 3500,
  template_id: 'classic',
  customer_email: 'user@example.com',
  ...
})
// Returns: {checkout_url: '...', session_id: '...'}
```

## Adding a New Screen

1. **Create component**:
```jsx
// src/screens/NewScreen.jsx
export default function NewScreen() {
  const {state, dispatch} = useAppState()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
    </div>
  )
}
```

2. **Add route** in `App.jsx`:
```jsx
<Route path="/new-screen" element={<NewScreen />} />
```

3. **Navigate** from another screen:
```jsx
navigate('/new-screen')
```

## Performance Tips

- **Code splitting**: Use `React.lazy()` for large screens
- **Memoization**: Use `useMemo()` for expensive calculations
- **Virtualization**: Use for long sticker lists
- **Image optimization**: Compress before upload
- **Debouncing**: For text input and drag operations

## Common Patterns

### Loading States
```jsx
const [loading, setLoading] = useState(false)
if (loading) return <div>Loading...</div>
```

### Error Handling
```jsx
try {
  await apiCall()
} catch (error) {
  alert('Error: ' + error.message)
}
```

### Navigation with State
```jsx
navigate('/next-screen', {state: {someData: '...'}})
// In next screen:
const {someData} = useLocation().state || {}
```

---

**Next**: See `07-BACKEND-GUIDE.md` for backend architecture.

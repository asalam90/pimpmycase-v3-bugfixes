# Phone Case Layout System

## Overview

The phone case layout system provides precise boundary definitions, camera cutout awareness, and safe zones for each phone model to prevent backgrounds and content from overflowing into camera areas or edges.

## Architecture

### Core Files

1. **`src/utils/phoneCaseLayout.js`**
   - Defines layout configurations for each phone model
   - Exports utility functions for boundary calculations
   - Handles camera cutout detection and avoidance

2. **`src/utils/textBoundaryManager.js`**
   - Enhanced with camera-aware boundary calculations
   - Integrates with phoneCaseLayout for safe text positioning
   - Automatically adjusts text position to avoid camera areas

3. **`src/components/PhoneCaseContainer.jsx`**
   - React component for rendering camera-aware phone cases
   - Handles content clipping around camera cutouts
   - Provides debug mode with visual indicators

4. **`src/index.css`**
   - CSS classes for camera-aware content clipping
   - Model-specific clip-path definitions
   - Visual overlay styles for camera areas

## Usage

### Using PhoneCaseContainer Component

```jsx
import PhoneCaseContainer from '../components/PhoneCaseContainer'

// In your component
<PhoneCaseContainer
  modelName="iPhone 15"
  containerDimensions={{ width: 288, height: 480 }}
  showCameraOverlay={false} // Set to true for debugging
>
  <img src={backgroundImage} alt="Background" />
</PhoneCaseContainer>
```

### Using Layout Utilities Directly

```javascript
import {
  getPhoneCaseLayout,
  isInCameraArea,
  overlapsCamera,
  getSafeBoundaries,
  getContentAreaStyles,
  getRecommendedTextPosition
} from '../utils/phoneCaseLayout'

// Get layout configuration for a model
const layout = getPhoneCaseLayout('iPhone 15')

// Check if a point is in the camera area
const isInCamera = isInCameraArea(x, y, 'iPhone 15')

// Check if a rectangle overlaps with camera
const overlaps = overlapsCamera(
  { x: 10, y: 5, width: 30, height: 20 },
  'iPhone 15'
)

// Get safe boundaries for content placement
const boundaries = getSafeBoundaries('iPhone 15', contentWidth, contentHeight)

// Get CSS styles for content area
const styles = getContentAreaStyles('iPhone 15')

// Get recommended position for text (avoids camera)
const position = getRecommendedTextPosition('iPhone 15')
```

### Using Camera-Aware Text Boundaries

```javascript
import { useTextBoundaries } from '../utils/textBoundaryManager'

// In your component
const {
  textDimensions,
  containerDimensions,
  safeBoundaries,
  cameraAwareBoundaries,
  constrainPosition
} = useTextBoundaries(template, inputText, fontSize, selectedFont, modelData)

// constrainPosition automatically avoids camera area
const safePosition = constrainPosition({ x: 50, y: 20 })
```

## Layout Configuration Structure

Each phone model has a layout configuration with the following structure:

```javascript
{
  modelId: 'iPhone 15',

  // Main content area boundaries
  contentArea: {
    top: 0.7,        // Percentage from top
    left: 8,         // Percentage from left
    right: 8,        // Percentage from right
    bottom: 0.7,     // Percentage from bottom
    borderRadius: 42 // Border radius in pixels
  },

  // Camera cutout zone (restricted area)
  cameraArea: {
    top: 2,          // Start position from top (%)
    left: 10,        // Start position from left (%)
    width: 32,       // Width of camera area (%)
    height: 23,      // Height of camera area (%)
    borderRadius: 18, // Border radius in pixels

    // Safety margins around camera
    margin: {
      top: 3,
      left: 3,
      right: 2,
      bottom: 2
    }
  },

  // Safe zones for text and important content
  safeZones: {
    topDeadZone: 25,    // Top % to avoid
    bottomDeadZone: 5,   // Bottom % to avoid
    leftDeadZone: 12,    // Left % to avoid
    rightDeadZone: 12    // Right % to avoid
  },

  // Physical case edges
  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}
```

## Supported Models

Currently configured models:

- **iPhone 15** - Standard camera layout
- **iPhone 15 Pro** - Larger camera module
- **iPhone 15 Pro Max** - Similar to Pro
- **iPhone 14 Pro** - Previous generation
- **Samsung S23** - Vertical camera array
- **Generic iPhone** - Fallback for unlisted models

## Adding New Models

To add a new phone model:

1. Open `src/utils/phoneCaseLayout.js`
2. Create a new layout configuration following the structure above
3. Add it to the `PHONE_LAYOUTS` object
4. Export it at the bottom of the file
5. (Optional) Add model-specific CSS clip-path in `src/index.css`

Example:

```javascript
const IPHONE_16_LAYOUT = {
  modelId: 'iPhone 16',
  contentArea: {
    top: 0.7,
    left: 8,
    right: 8,
    bottom: 0.7,
    borderRadius: 42
  },
  cameraArea: {
    top: 2,
    left: 10,
    width: 35,
    height: 26,
    borderRadius: 20,
    margin: { top: 3, left: 3, right: 2, bottom: 2 }
  },
  safeZones: {
    topDeadZone: 30,
    bottomDeadZone: 5,
    leftDeadZone: 12,
    rightDeadZone: 12
  },
  edges: {
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    cornerRadius: 45
  }
}

// Add to PHONE_LAYOUTS
const PHONE_LAYOUTS = {
  'iPhone 16': IPHONE_16_LAYOUT,
  // ... existing models
}
```

## CSS Clip-Path for Camera Cutouts

For advanced camera cutout clipping, add CSS classes in `src/index.css`:

```css
.phone-case-content.iphone-16 {
  clip-path: polygon(
    /* Define polygon points that go around camera */
    0% 0%,
    10% 0%,
    10% 2%,
    45% 2%,
    45% 28%,
    10% 28%,
    10% 0%,
    0% 0%,
    0% 100%,
    100% 100%,
    100% 0%,
    45% 0%,
    45% 2%
  );
}
```

## Debugging

### Enable Visual Overlays

```jsx
<PhoneCaseContainer
  modelName="iPhone 15"
  showCameraOverlay={true}
>
  {/* Your content */}
</PhoneCaseContainer>
```

This will show:
- Red dashed overlay on camera area
- Yellow overlay on top dead zone
- Blue overlays on left/right dead zones
- Green overlay on bottom dead zone

### Console Logging

The boundary manager logs camera-aware boundary calculations:

```
📐 Camera-aware boundaries: { safeMinX: 25, safeMaxX: 75, safeMinY: 30, safeMaxY: 90, modelName: "iPhone 15" }
⚠️ Text position adjusted to avoid camera area
```

## Best Practices

1. **Always pass model data** to components that use the layout system
2. **Use PhoneCaseContainer** for image backgrounds to ensure proper clipping
3. **Test with showCameraOverlay={true}** during development
4. **Verify boundaries** for new phone models by comparing with physical mockups
5. **Update both** phoneCaseLayout.js and CSS when adding new models

## Measuring Camera Cutouts

To get precise measurements for new models:

1. Open the mockup SVG file in `mockups/`
2. Use the viewBox to determine overall dimensions
3. Identify camera cutout coordinates in the SVG paths
4. Convert to percentages: `(coordinate / totalDimension) * 100`
5. Add safety margins based on rhinestone/branding placement

Example calculation for iPhone 15:
- SVG viewBox: 800x600
- Camera starts at X: 80 (80/800 = 10%)
- Camera starts at Y: 12 (12/600 = 2%)
- Camera width: 256 (256/800 = 32%)
- Camera height: 138 (138/600 = 23%)

## Integration with Existing Screens

The system is designed to integrate seamlessly with existing screens. Replace standard content containers with PhoneCaseContainer:

**Before:**
```jsx
<div className="phone-case-content">
  <img src={background} />
</div>
```

**After:**
```jsx
<PhoneCaseContainer modelName={modelData?.model_name}>
  <img src={background} />
</PhoneCaseContainer>
```

## Future Enhancements

Potential improvements:

1. Dynamic clip-path generation from layout config (eliminate manual CSS)
2. Support for multiple camera cutouts (Samsung models)
3. Automatic mockup analysis tool to extract dimensions
4. Interactive configuration editor
5. SVG mask generation for complex cutouts
6. Animation-aware boundaries for moving content

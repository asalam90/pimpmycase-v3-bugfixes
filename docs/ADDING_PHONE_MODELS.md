# Adding New Phone Models to PimpMyCase

This guide explains how to add support for new phone models to the application.

## Required Files

For each new phone model, you need:

1. **Phone Back Image** - `/public/Phone backs/[model-name].png`
   - The visual phone case shell image
   - Recommended size: 1000-1500px width
   - Format: PNG with transparency preferred

2. **Mask Image** - `/public/masks/[model-name]-mask.png` or `.svg`
   - Defines the visible content area
   - Format: White (#FFFFFF) = visible, Transparent = hidden (camera cutout)
   - Must match the phone back proportions

## Configuration Files to Update

### 1. phoneCaseLayout.js (`src/utils/phoneCaseLayout.js`)

Add entries to THREE functions:

#### a) getPhoneBackImage(modelName)
```javascript
// Around line 708
case 'new-model-name':
  return '/Phone backs/new-model.png'
```

#### b) getDisplayMaskImage(modelName)
```javascript
// Around line 756
case 'new-model-name':
  return '/masks/new-model-mask.png'
```

#### c) getMaskPosition(modelName)
```javascript
// Around line 800
case 'new-model-name':
  return {
    x: '8%',      // Horizontal offset (negative for Samsung-style)
    y: '0',       // Vertical offset
    width: '85%', // Mask width (>100% for Samsung-style)
    height: '100%'
  }
```

### 2. getPhoneDimensions(modelName)
```javascript
// Define aspect ratio for the phone preview container
case 'new-model-name':
  return {
    width: 250,   // Preview width in pixels
    height: 416   // Preview height (maintain phone aspect ratio)
  }
```

## File Naming Conventions

- **Avoid special characters**: No apostrophes ('), ampersands (&), or spaces
- **Use lowercase** with hyphens: `iphone-16-pro-max.png`
- **Be consistent** between phone back and mask files

## Testing New Models

1. Select the new model from brand/model selection
2. Verify phone back image loads
3. Upload a test image and verify mask clipping
4. Add stickers and verify they stay within mask bounds
5. Test on both iOS Safari and Chrome
6. Verify final image composition includes correct mask

## Mask Positioning Guide

| Device Type | x | y | width | height |
|-------------|---|---|-------|--------|
| iPhone (standard) | 8% | 0 | 85% | 100% |
| iPhone (notch/pill) | 8% | 0 | 85% | 100% |
| Samsung (edge) | -5.25% | -5.7% | 108% | 109% |

## Troubleshooting

- **Mask not clipping**: Check mask image is white on transparent
- **Phone back not showing**: Verify file path has no special characters
- **Offset issues**: Adjust getMaskPosition() values for your mask

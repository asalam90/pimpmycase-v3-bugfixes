# PimpMyCase: Professional Mask System Fix

## The Problem (Current Amateur Approach)

The current `MaskedPhoneDisplay.jsx` uses hand-drawn SVG clipPaths in `CLIP_PATH_DATA`:

```javascript
// phoneCaseLayout.js - CURRENT BUGGY CODE
iphone17pro: {
  viewBox: '0 0 1000 1000',
  path: 'M 124.55 282.87 L 139.04 276.23 ...'  // ← Starts at Y=282!
}
```

**Result:** 28.2% gap at the top because the path doesn't extend to Y=0.

## The Solution (Professional Casetify-Style Approach)

Use the **Chinese manufacturer mockups** as the source of truth:
- `/Users/as-home/Library/Mobile Documents/com~apple~CloudDocs/Downloads/pmc-phone-masks-chinese/3米效果图/`

### Generated Assets

Located at `/tmp/production-masks/` (ready to copy to project):

| Asset Type | Purpose |
|------------|---------|
| `{model}-mask.png` | Grayscale mask: white=printable area |
| `{model}-overlay.png` | Phone frame with transparent center |
| `manifest.json` | Metadata for all 15 models |

### Rendering Approach

```
┌─────────────────────────────────────┐
│  Layer 3: Overlay                   │  ← Frame + camera on TOP
│  (transparent center)               │
├─────────────────────────────────────┤
│  Layer 2: Mask                      │  ← Clips user content
│  (white=visible, black=hidden)      │
├─────────────────────────────────────┤
│  Layer 1: User Content              │  ← Image/color fills canvas
│  (design, photo, solid color)       │
└─────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Copy Assets to Project

```bash
# Copy masks to project public folder
cp /tmp/production-masks/*.png /Users/as-home/Projects/pimpmycase-website-main-12Jan-fork/public/masks/professional/

# Copy manifest
cp /tmp/production-masks/manifest.json /Users/as-home/Projects/pimpmycase-website-main-12Jan-fork/public/masks/professional/
```

### Step 2: Update phoneCaseLayout.js

Add new function to get professional mask paths:

```javascript
// Add to phoneCaseLayout.js
export const getProfessionalMaskPath = (modelName) => {
  const modelMap = {
    'iphone 17 pro max': 'iphone-17-pro-max',
    'iphone 17 pro': 'iphone-17-pro',
    'iphone 17 air': 'iphone-17-air',
    // ... etc
  };
  
  const modelId = modelMap[modelName.toLowerCase().trim()] || 'iphone-17-pro-max';
  return `/masks/professional/${modelId}-mask.png`;
};

export const getProfessionalOverlayPath = (modelName) => {
  const modelMap = { /* same as above */ };
  const modelId = modelMap[modelName.toLowerCase().trim()] || 'iphone-17-pro-max';
  return `/masks/professional/${modelId}-overlay.png`;
};
```

### Step 3: Update MaskedPhoneDisplay.jsx

Replace SVG clipPath approach with PNG mask approach:

```jsx
const MaskedPhoneDisplay = forwardRef(({ image, backgroundColor, modelName, ...props }, ref) => {
  const maskPath = useMemo(() => getProfessionalMaskPath(modelName), [modelName]);
  const overlayPath = useMemo(() => getProfessionalOverlayPath(modelName), [modelName]);
  
  return (
    <div className="relative" style={{ width, height }}>
      {/* Layer 1: User Content (masked) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: backgroundColor,
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: `url(${maskPath})`,
          maskImage: `url(${maskPath})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      
      {/* Layer 2: Frame Overlay */}
      <img 
        src={overlayPath}
        alt=""
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
});
```

### Step 4: Delete CLIP_PATH_DATA

Remove or deprecate the hand-drawn SVG paths in `phoneCaseLayout.js`.

## Visual Comparison

### Before (Amateur)
- White gap at top (Y=282 in 1000px viewBox = 28% gap)
- Hand-drawn paths don't match actual printable area
- Looks unprofessional

### After (Professional)
- User content fills entire printable area
- Pixel-perfect masks from manufacturer templates
- Frame overlay includes branding and camera module
- Matches what Casetify does

## Files to Modify

1. **`/public/masks/professional/`** - New folder with assets
2. **`/src/utils/phoneCaseLayout.js`** - Add mask path functions
3. **`/src/components/MaskedPhoneDisplay.jsx`** - Use CSS mask-image
4. **Remove reliance on `CLIP_PATH_DATA`**

## Testing

1. Navigate to phone preview with solid color selected
2. Verify color fills ENTIRE printable area (no white gaps)
3. Verify camera module area is NOT covered
4. Test on multiple phone models
5. Test on iOS Safari (WebKit) and Chrome

## Notes

- The Chinese manufacturer folder has 23 mockups covering all supported models
- Web-optimized sizes generated (600px width for iPhones, 500px for Samsung)
- Original high-res available in source folder for print exports

import React, { forwardRef, useMemo } from 'react'
import { getPhoneBackImage, getDisplayMaskImage, getMaskPosition, getClipPathData } from '../utils/phoneCaseLayout'

/**
 * MaskedPhoneDisplay Component
 *
 * Displays phone back with masked user content
 * @param {Object} props
 * @param {string|string[]} props.image - Single image or array of images
 * @param {Object|Object[]} props.transform - Transform for image(s) {x, y, scale}
 * @param {string} props.backgroundColor - Background color (optional)
 * @param {React.ReactNode} props.children - Additional content to render on top (like text)
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.className - Additional classes
 * @param {number} props.width - Container width (default: 288)
 * @param {number} props.height - Container height (default: 480)
 * @param {string} props.modelName - Phone model name for dynamic assets
 * @param {number} props.zoom - Zoom scale for image (e.g., 0.95 for 95% zoom)
 * @param {number} props.zoomX - Horizontal zoom scale (e.g., 1.0 for 100%)
 * @param {number} props.zoomY - Vertical zoom scale (e.g., 0.9 for 90%)
 */
const MaskedPhoneDisplay = forwardRef(({
  image,
  transform,
  backgroundColor,
  children,
  style = {},
  className = '',
  width = 288,
  height = 480,
  modelName,
  zoom,
  zoomX,
  zoomY
}, overlayRef) => {
  const images = Array.isArray(image) ? image : image ? [image] : []
  const transforms = Array.isArray(transform) ? transform : transform ? [transform] : []

  // Get model-specific assets
  const phoneBackImage = useMemo(() => getPhoneBackImage(modelName), [modelName])
  const displayMaskImage = useMemo(() => getDisplayMaskImage(modelName), [modelName])
  const maskPosition = useMemo(() => getMaskPosition(modelName), [modelName])
  const clipPathData = useMemo(() => getClipPathData(modelName), [modelName])

  const backgroundMaskId = useMemo(
    () => `bg-mask-${Math.random().toString(36).slice(2)}`,
    []
  )
  const imageMaskId = useMemo(
    () => `img-mask-${Math.random().toString(36).slice(2)}`,
    []
  )
  const stickerMaskId = useMemo(
    () => `sticker-mask-${Math.random().toString(36).slice(2)}`,
    []
  )

  return (
    <div
      className={`relative ${className}`}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
    >
      {/* Phone Back Image - Base layer */}
      <div className="absolute inset-0" style={{
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}>
        <img
          src={phoneBackImage}
          alt="Phone back"
          className="w-full h-full object-contain"
          onError={(e) => {
            console.warn('Phone back image failed to load:', phoneBackImage)
            e.target.style.display = 'none'
          }}
        />
      </div>

      {/* Background color layer - clipPath for SVG path masks, SVG mask for PNG masks */}
      {backgroundColor && clipPathData && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={clipPathData.viewBox} preserveAspectRatio="none" style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}>
          <defs>
            <clipPath id={backgroundMaskId}>
              <path d={clipPathData.path} transform={clipPathData.transform || "translate(0,0)"} />
            </clipPath>
          </defs>
          <rect
            x="0" y="0"
            width="100%" height="100%"
            fill={backgroundColor}
            clipPath={`url(#${backgroundMaskId})`}
          />
        </svg>
      )}
      {backgroundColor && !clipPathData && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}>
          <defs>
            <mask id={backgroundMaskId}>
              <image
                href={displayMaskImage}
                xlinkHref={displayMaskImage}
                x={maskPosition.x}
                y={maskPosition.y}
                width={maskPosition.width}
                height={maskPosition.height}
                preserveAspectRatio="none"
              />
            </mask>
          </defs>
          <foreignObject width="100%" height="100%" mask={`url(#${backgroundMaskId})`}>
            <div className="w-full h-full" style={{ backgroundColor }} />
          </foreignObject>
        </svg>
      )}

      {/* User's uploaded image(s) - clipPath for SVG path masks, SVG mask for PNG masks */}
      {images.length > 0 && clipPathData && images.length === 1 && (
        <svg className="absolute inset-0 w-full h-full" viewBox={clipPathData.viewBox} preserveAspectRatio="none" style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          shapeRendering: 'auto',
          imageRendering: 'auto',
          pointerEvents: 'none'
        }}>
          <defs>
            <clipPath id={imageMaskId} clipPathUnits="userSpaceOnUse">
              <path d={clipPathData.path} transform={clipPathData.transform || "translate(0,0)"} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${imageMaskId})`}>
            <image
              href={images[0]}
              x="0" y="0"
              width="100%" height="100%"
              preserveAspectRatio={transforms[0] || zoom || zoomX !== undefined || zoomY !== undefined ? 'xMidYMid meet' : 'xMidYMid slice'}
              transform={
                transforms[0]
                  ? `translate(${parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${parseFloat(clipPathData.viewBox.split(' ')[3]) / 2}) scale(${transforms[0].scale}) translate(${(transforms[0].x / 100) * parseFloat(clipPathData.viewBox.split(' ')[2]) / transforms[0].scale} ${(transforms[0].y / 100) * parseFloat(clipPathData.viewBox.split(' ')[3]) / transforms[0].scale}) translate(${-parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${-parseFloat(clipPathData.viewBox.split(' ')[3]) / 2})`
                  : (zoomX !== undefined || zoomY !== undefined)
                  ? `translate(${parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${parseFloat(clipPathData.viewBox.split(' ')[3]) / 2}) scale(${zoomX !== undefined ? zoomX : 1} ${zoomY !== undefined ? zoomY : 1}) translate(${-parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${-parseFloat(clipPathData.viewBox.split(' ')[3]) / 2})`
                  : zoom
                  ? `translate(${parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${parseFloat(clipPathData.viewBox.split(' ')[3]) / 2}) scale(${zoom}) translate(${-parseFloat(clipPathData.viewBox.split(' ')[2]) / 2} ${-parseFloat(clipPathData.viewBox.split(' ')[3]) / 2})`
                  : ''
              }
            />
          </g>
        </svg>
      )}
      {images.length > 1 && clipPathData && (
        <svg className="absolute inset-0 w-full h-full" viewBox={clipPathData.viewBox} preserveAspectRatio="none" style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          shapeRendering: 'auto',
          imageRendering: 'auto',
          pointerEvents: 'none'
        }}>
          <defs>
            <clipPath id={imageMaskId} clipPathUnits="userSpaceOnUse">
              <path d={clipPathData.path} transform={clipPathData.transform || "translate(0,0)"} />
            </clipPath>
          </defs>
          <foreignObject width="100%" height="100%" clipPath={`url(#${imageMaskId})`}>
            <div className="w-full h-full" xmlns="http://www.w3.org/1999/xhtml">
              {images.length === 4 ? (
                <div className="w-full h-full flex flex-wrap">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-1/2 h-1/2 overflow-hidden"
                      style={{
                        borderColor: '#000000',
                        borderStyle: 'solid',
                        borderTopWidth: idx < 2 ? '0' : '1px',
                        borderBottomWidth: idx >= 2 ? '0' : '1px',
                        borderLeftWidth: idx % 2 === 0 ? '0' : '1px',
                        borderRightWidth: idx % 2 === 1 ? '0' : '1px'
                      }}
                    >
                      <img
                        src={img}
                        alt={`design ${idx + 1}`}
                        className="w-full h-full"
                        style={{
                          objectFit: 'contain',
                          transform: transforms[idx]
                            ? `scale(${transforms[idx].scale}) translate(${transforms[idx].x}%, ${transforms[idx].y}%)`
                            : 'none',
                          transformOrigin: 'center center',
                          imageRendering: 'auto',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-1 overflow-hidden"
                      style={{
                        borderColor: '#000000',
                        borderStyle: 'solid',
                        borderTopWidth: idx === 0 ? '0' : '1px',
                        borderBottomWidth: idx === images.length - 1 ? '0' : '1px',
                        borderLeftWidth: '0',
                        borderRightWidth: '0'
                      }}
                    >
                      <img
                        src={img}
                        alt={`design ${idx + 1}`}
                        className="w-full h-full"
                        style={{
                          objectFit: 'contain',
                          transform: transforms[idx]
                            ? `scale(${transforms[idx].scale}) translate(${transforms[idx].x}%, ${transforms[idx].y}%)`
                            : 'none',
                          transformOrigin: 'center center',
                          imageRendering: 'auto',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </foreignObject>
        </svg>
      )}
      {images.length > 0 && !clipPathData && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          shapeRendering: 'auto',
          imageRendering: 'auto'
        }}>
          <defs>
            <mask id={imageMaskId}>
              <image
                href={displayMaskImage}
                xlinkHref={displayMaskImage}
                x={maskPosition.x}
                y={maskPosition.y}
                width={maskPosition.width}
                height={maskPosition.height}
                preserveAspectRatio="none"
              />
            </mask>
          </defs>
          <foreignObject width="100%" height="100%" mask={`url(#${imageMaskId})`}>
            <div className="w-full h-full" style={{ pointerEvents: 'auto' }}>
              {images.length === 1 ? (
                <img
                  src={images[0]}
                  alt="Uploaded design"
                  className="w-full h-full"
                  style={{
                    objectFit: transforms[0] || zoom || zoomX !== undefined || zoomY !== undefined ? 'contain' : 'cover',
                    transform: transforms[0]
                      ? `scale(${transforms[0].scale}) translate(${transforms[0].x}%, ${transforms[0].y}%)`
                      : (zoomX !== undefined || zoomY !== undefined)
                      ? `scaleX(${zoomX !== undefined ? zoomX : 1}) scaleY(${zoomY !== undefined ? zoomY : 1})`
                      : zoom
                      ? `scale(${zoom})`
                      : 'none',
                    transformOrigin: 'center center',
                    imageRendering: 'auto',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                />
              ) : images.length === 4 ? (
                <div className="w-full h-full flex flex-wrap">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-1/2 h-1/2 overflow-hidden"
                      style={{
                        borderColor: '#000000',
                        borderStyle: 'solid',
                        borderTopWidth: idx < 2 ? '0' : '1px',
                        borderBottomWidth: idx >= 2 ? '0' : '1px',
                        borderLeftWidth: idx % 2 === 0 ? '0' : '1px',
                        borderRightWidth: idx % 2 === 1 ? '0' : '1px'
                      }}
                    >
                      <img
                        src={img}
                        alt={`design ${idx + 1}`}
                        className="w-full h-full"
                        style={{
                          objectFit: 'contain',
                          transform: transforms[idx]
                            ? `scale(${transforms[idx].scale}) translate(${transforms[idx].x}%, ${transforms[idx].y}%)`
                            : 'none',
                          transformOrigin: 'center center',
                          imageRendering: 'auto',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-1 overflow-hidden"
                      style={{
                        borderColor: '#000000',
                        borderStyle: 'solid',
                        borderTopWidth: idx === 0 ? '0' : '1px',
                        borderBottomWidth: idx === images.length - 1 ? '0' : '1px',
                        borderLeftWidth: '0',
                        borderRightWidth: '0'
                      }}
                    >
                      <img
                        src={img}
                        alt={`design ${idx + 1}`}
                        className="w-full h-full"
                        style={{
                          objectFit: 'contain',
                          transform: transforms[idx]
                            ? `scale(${transforms[idx].scale}) translate(${transforms[idx].x}%, ${transforms[idx].y}%)`
                            : 'none',
                          transformOrigin: 'center center',
                          imageRendering: 'auto',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </foreignObject>
        </svg>
      )}

      {/* Additional content (text, stickers, etc.) - SVG mask with iOS Safari compatibility */}
      {children && clipPathData && (
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={clipPathData.viewBox}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            pointerEvents: 'none',
            zIndex: 10,
            overflow: 'visible'
          }}
        >
          <defs>
            <clipPath id={stickerMaskId} clipPathUnits="userSpaceOnUse">
              <path d={clipPathData.path} transform={clipPathData.transform || "translate(0,0)"} />
            </clipPath>
          </defs>
          <foreignObject
            x="0"
            y="0"
            width="100%"
            height="100%"
            clipPath={`url(#${stickerMaskId})`}
            style={{
              overflow: 'visible'
            }}
          >
            <div
              ref={overlayRef}
              className="w-full h-full"
              style={{
                pointerEvents: 'auto',
                overflow: 'hidden',
                position: 'relative',
                WebkitOverflowScrolling: 'touch'
              }}
              data-masked-content
              xmlns="http://www.w3.org/1999/xhtml"
            >
              {children}
            </div>
          </foreignObject>
        </svg>
      )}
      {children && !clipPathData && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: 'translate3d(0,0,0)',
            WebkitTransform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            zIndex: 10,
            overflow: 'visible'
          }}
        >
          <defs>
            <mask id={stickerMaskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
              <image
                href={displayMaskImage}
                xlinkHref={displayMaskImage}
                x={maskPosition.x}
                y={maskPosition.y}
                width={maskPosition.width}
                height={maskPosition.height}
                preserveAspectRatio="none"
              />
            </mask>
          </defs>
          <foreignObject
            x="0"
            y="0"
            width="100%"
            height="100%"
            mask={`url(#${stickerMaskId})`}
            style={{
              overflow: 'visible'
            }}
          >
            <div
              ref={overlayRef}
              className="w-full h-full"
              style={{
                pointerEvents: 'auto',
                overflow: 'hidden',
                position: 'relative',
                WebkitOverflowScrolling: 'touch'
              }}
              data-masked-content
              xmlns="http://www.w3.org/1999/xhtml"
            >
              {children}
            </div>
          </foreignObject>
        </svg>
      )}
    </div>
  )
})

MaskedPhoneDisplay.displayName = 'MaskedPhoneDisplay'

export default MaskedPhoneDisplay

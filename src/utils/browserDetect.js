/**
 * Browser Detection Utility
 *
 * Detects WebKit-based browsers (Safari, iOS Safari, WKWebView)
 * Used to apply platform-specific gesture handling for optimal touch interactions
 */

// Check for WebKit engine
// - window.webkitURL exists in WebKit browsers
// - GestureEvent exists only in iOS Safari/WebKit
// - Exclude Chrome which uses Blink (has chrome object)
export const IS_WEBKIT = (() => {
  if (typeof window === 'undefined') return false

  const hasWebkitURL = 'webkitURL' in window
  const hasGestureEvent = 'GestureEvent' in window
  const isChrome = typeof window.chrome !== 'undefined'

  // iOS Safari or Safari (not Chrome)
  return (hasWebkitURL || hasGestureEvent) && !isChrome
})()

export default { IS_WEBKIT }

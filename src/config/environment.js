// Centralized environment configuration for frontend API + asset URLs
// Allows quick switching between production and local testing.

const ENVIRONMENTS = {
  production: {
    label: 'Production',
    apiBaseUrl: 'https://pimpmycase-webstore.onrender.com',
    fileBaseUrl: 'https://pimpmycase-webstore.onrender.com',
    stickerBaseUrl: '', // Will use VITE_STICKER_BASE_URL env variable (Google Drive)
  },
  local: {
    label: 'Local',
    apiBaseUrl: 'http://localhost:8000',
    fileBaseUrl: 'http://localhost:8000',
    stickerBaseUrl: '', // Empty = use local public/ folder
  },
}

const normalizeKey = (value) => (value || '').trim().toLowerCase()

const explicitKey = normalizeKey(import.meta.env.VITE_APP_ENV)
const fallbackKey = import.meta.env.DEV ? 'local' : 'production'
const resolvedKey = ENVIRONMENTS[explicitKey] ? explicitKey : fallbackKey

const resolvedEnvironment = ENVIRONMENTS[resolvedKey]

// Debug logging
console.log('[Environment] import.meta.env.DEV:', import.meta.env.DEV)
console.log('[Environment] import.meta.env.VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('[Environment] resolvedKey:', resolvedKey)
console.log('[Environment] resolvedEnvironment.apiBaseUrl:', resolvedEnvironment.apiBaseUrl)

// Use environment variables with fallback to resolved environment
const API_BASE_URL_VALUE = import.meta.env.VITE_API_BASE_URL || resolvedEnvironment.apiBaseUrl

const FILE_BASE_URL_VALUE = import.meta.env.VITE_FILE_BASE_URL || resolvedEnvironment.fileBaseUrl

console.log('[Environment] Final API_BASE_URL:', API_BASE_URL_VALUE)
console.log('[Environment] Final FILE_BASE_URL:', FILE_BASE_URL_VALUE)

export const ACTIVE_ENVIRONMENT_KEY = resolvedKey
export const ENVIRONMENT_OPTIONS = ENVIRONMENTS
export const API_BASE_URL = API_BASE_URL_VALUE
export const FILE_BASE_URL = FILE_BASE_URL_VALUE

const environment = {
  key: resolvedKey,
  label: resolvedEnvironment.label,
  apiBaseUrl: API_BASE_URL_VALUE,
  fileBaseUrl: FILE_BASE_URL_VALUE,
  isProduction: resolvedKey === 'production',
  isLocal: resolvedKey === 'local',
  options: ENVIRONMENTS,
  chineseApiDeviceId: import.meta.env.VITE_CHINESE_API_DEVICE_ID || 'JMSOOMSZRQO9', // Default to production device
}

export default environment

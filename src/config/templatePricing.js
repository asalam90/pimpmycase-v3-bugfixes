export const TEMPLATE_PRICING = {
  // Basic Templates - £35.00 (stored as 3500 pence)
  'classic': {
    pricePence: 3500, // CRITICAL FIX: Store price in pence to avoid floating point errors
    priceDisplay: 35.00, // For display only
    currency: '£',
    category: 'basic',
    displayPrice: '£35.00'
  },
  '2-in-1': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'basic',
    displayPrice: '£35.00'
  },
  '3-in-1': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'basic',
    displayPrice: '£35.00'
  },
  '4-in-1': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'basic',
    displayPrice: '£35.00'
  },
  'film-strip-3': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'film',
    displayPrice: '£35.00'
  },

  // AI Templates - £35.00 (stored as 3500 pence)
  'funny-toon': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai',
    displayPrice: '£35.00'
  },
  'retro-remix': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai',
    displayPrice: '£35.00'
  },
  'cover-shoot': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai',
    displayPrice: '£35.00'
  },
  'glitch-pro': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai',
    displayPrice: '£35.00'
  },
  'footy-fan': {
    pricePence: 3500,
    priceDisplay: 35.00,
    currency: '£',
    category: 'ai',
    displayPrice: '£35.00'
  }
}

// CRITICAL FIX: Updated pricing functions to handle pence correctly
export const getTemplatePricePence = (templateId) => {
  const pricing = TEMPLATE_PRICING[templateId]
  return pricing ? pricing.pricePence : 3500 // Default to £35.00 in pence
}

export const getTemplatePrice = (templateId) => {
  const pricing = TEMPLATE_PRICING[templateId]
  return pricing ? pricing.priceDisplay : 35.00 // For display - backward compatibility
}

export const getTemplatePriceDisplay = (templateId) => {
  const pricing = TEMPLATE_PRICING[templateId]
  return pricing ? pricing.displayPrice : '£35.00'
}

export const getTemplateCategory = (templateId) => {
  const pricing = TEMPLATE_PRICING[templateId]
  return pricing ? pricing.category : 'basic'
}

// ============================================
// PROMOTIONAL: Free machines configuration
// TODO: Remove when promotional period ends
// See docs/2025-12-24-promotional-pricing-removal-guide.md
// ============================================
export const FREE_MACHINE_IDS = [
  "16DCTRYUJSJH"  // Promotional vending machine - FREE CASES
]

export const isFreePromoMachine = (machineId) => {
  if (!machineId) return false
  return FREE_MACHINE_IDS.includes(machineId.toUpperCase().trim())
}
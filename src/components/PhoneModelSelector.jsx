/**
 * PREMIUM PHONE MODEL SELECTOR
 * 
 * Professional UX for phone model selection inspired by:
 * - Casetify's streamlined selection flow
 * - Apple's product configurator
 * - Modern e-commerce filter patterns
 * 
 * Features:
 * - Brand tabs (Apple | Samsung) for quick filtering
 * - Search with instant autocomplete
 * - Visual chips showing current selection
 * - Smart grouping (Pro/Standard, Latest first)
 * - Mobile-optimized touch targets
 * 
 * Sources:
 * - Baymard Institute UX Research
 * - Material Design chip specifications
 * - Mobile e-commerce best practices 2025
 */

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { formatModelName } from '../utils/phoneCaseLayout'

// =====================
// BRAND TAB COMPONENT
// =====================
const BrandTab = ({ brand, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: '10px 16px',
      border: 'none',
      borderBottom: isActive ? '2px solid #000' : '2px solid transparent',
      background: 'transparent',
      cursor: 'pointer',
      transition: 'all 150ms ease-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      fontSize: '13px',
      fontWeight: isActive ? '600' : '400',
      color: isActive ? '#000' : '#666',
      letterSpacing: '0.3px'
    }}
  >
    {brand}
    {count > 0 && (
      <span style={{
        marginLeft: '6px',
        fontSize: '11px',
        color: '#999',
        fontWeight: '400'
      }}>
        ({count})
      </span>
    )}
  </button>
)

// =====================
// MODEL CHIP COMPONENT
// =====================
const ModelChip = ({ model, isSelected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 14px',
      border: isSelected ? '2px solid #000' : '1px solid #E0E0E0',
      borderRadius: '20px',
      background: isSelected ? '#000' : '#FFF',
      color: isSelected ? '#FFF' : '#333',
      cursor: 'pointer',
      transition: 'all 120ms ease-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      WebkitTapHighlightColor: 'transparent'
    }}
  >
    {formatModelName(model.model_name)}
  </button>
)

// =====================
// SEARCH INPUT COMPONENT
// =====================
const SearchInput = ({ value, onChange, placeholder }) => (
  <div style={{
    position: 'relative',
    marginBottom: '12px'
  }}>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none'
      }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px 10px 40px',
        border: '1px solid #E0E0E0',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        outline: 'none',
        transition: 'border-color 150ms ease-out',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => e.target.style.borderColor = '#000'}
      onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
    />
    {value && (
      <button
        onClick={() => onChange('')}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#E0E0E0',
          border: 'none',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
)

// =====================
// MODEL GROUP COMPONENT
// =====================
const ModelGroup = ({ title, models, selectedModel, onSelect }) => {
  if (models.length === 0) return null
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
      }}>
        {title}
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {models.map((model) => (
          <ModelChip
            key={model.mobile_model_id || model.model_name}
            model={model}
            isSelected={selectedModel?.mobile_model_id === model.mobile_model_id}
            onClick={() => onSelect(model)}
          />
        ))}
      </div>
    </div>
  )
}

// =====================
// MAIN SELECTOR COMPONENT
// =====================
const PhoneModelSelector = ({
  models = [],
  selectedModel,
  onSelect,
  isLoading = false
}) => {
  const [activeBrand, setActiveBrand] = useState('APPLE')
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)

  // Group models by brand
  const { appleModels, samsungModels } = useMemo(() => {
    const apple = models.filter(m => 
      m.brand_name?.toUpperCase() === 'APPLE' || 
      m.model_name?.toLowerCase().includes('iphone')
    )
    const samsung = models.filter(m => 
      m.brand_name?.toUpperCase() === 'SAMSUNG' ||
      m.model_name?.toLowerCase().includes('samsung') ||
      m.model_name?.toLowerCase().includes('galaxy') ||
      m.model_name?.toLowerCase().startsWith('s2')
    )
    return { appleModels: apple, samsungModels: samsung }
  }, [models])

  // Filter models based on search and brand
  const filteredModels = useMemo(() => {
    let filtered = activeBrand === 'APPLE' ? appleModels : samsungModels
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.model_name?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [activeBrand, appleModels, samsungModels, searchQuery])

  // Group filtered models (Pro vs Standard for Apple, Ultra vs Standard for Samsung)
  const groupedModels = useMemo(() => {
    if (activeBrand === 'APPLE') {
      const proMax = filteredModels.filter(m => 
        m.model_name?.toLowerCase().includes('pro max')
      )
      const pro = filteredModels.filter(m => 
        m.model_name?.toLowerCase().includes('pro') && 
        !m.model_name?.toLowerCase().includes('pro max')
      )
      const air = filteredModels.filter(m => 
        m.model_name?.toLowerCase().includes('air')
      )
      const standard = filteredModels.filter(m => 
        !m.model_name?.toLowerCase().includes('pro') &&
        !m.model_name?.toLowerCase().includes('air')
      )
      
      return [
        { title: 'Pro Max', models: proMax },
        { title: 'Pro', models: pro },
        { title: 'Air', models: air },
        { title: 'Standard', models: standard }
      ].filter(g => g.models.length > 0)
    } else {
      const ultra = filteredModels.filter(m => 
        m.model_name?.toLowerCase().includes('ultra')
      )
      const plus = filteredModels.filter(m => 
        m.model_name?.toLowerCase().includes('plus') &&
        !m.model_name?.toLowerCase().includes('ultra')
      )
      const standard = filteredModels.filter(m => 
        !m.model_name?.toLowerCase().includes('ultra') &&
        !m.model_name?.toLowerCase().includes('plus')
      )
      
      return [
        { title: 'Ultra', models: ultra },
        { title: 'Plus', models: plus },
        { title: 'Standard', models: standard }
      ].filter(g => g.models.length > 0)
    }
  }, [activeBrand, filteredModels])

  // Auto-switch brand if selected model changes
  useEffect(() => {
    if (selectedModel) {
      const isApple = selectedModel.brand_name?.toUpperCase() === 'APPLE' || 
                      selectedModel.model_name?.toLowerCase().includes('iphone')
      setActiveBrand(isApple ? 'APPLE' : 'SAMSUNG')
    }
  }, [selectedModel])

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#999',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        fontSize: '14px'
      }}>
        Loading models...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: '#FFF',
        borderRadius: '16px',
        border: '1px solid #E5E5E5',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      {/* Current Selection Display */}
      {selectedModel && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '10px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '2px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}>
              Selected Model
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
            }}>
              {formatModelName(selectedModel.model_name)}
            </div>
          </div>
          <div style={{
            padding: '4px 10px',
            background: '#F5F5F5',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            color: '#666'
          }}>
            £{selectedModel.price?.toFixed(2) || '35.00'}
          </div>
        </div>
      )}

      {/* Brand Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #F0F0F0'
      }}>
        <BrandTab
          brand="Apple"
          isActive={activeBrand === 'APPLE'}
          onClick={() => setActiveBrand('APPLE')}
          count={appleModels.length}
        />
        <BrandTab
          brand="Samsung"
          isActive={activeBrand === 'SAMSUNG'}
          onClick={() => setActiveBrand('SAMSUNG')}
          count={samsungModels.length}
        />
      </div>

      {/* Search & Models */}
      <div style={{ padding: '12px 16px' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeBrand === 'APPLE' ? 'iPhone' : 'Samsung'} models...`}
        />

        {/* Model Groups */}
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '4px'
        }}>
          {groupedModels.length > 0 ? (
            groupedModels.map((group) => (
              <ModelGroup
                key={group.title}
                title={group.title}
                models={group.models}
                selectedModel={selectedModel}
                onSelect={onSelect}
              />
            ))
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px'
            }}>
              No models found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PhoneModelSelector

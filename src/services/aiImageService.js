import environment from '../config/environment'

// AI Image Generation Service
// Handles communication with the FastAPI backend

const API_BASE_URL = environment.apiBaseUrl
const FILE_BASE_URL = environment.fileBaseUrl

class AIImageService {
  /**
   * Generate AI image based on template and style parameters
   * @param {string} templateId - Template identifier (e.g., 'retro-remix', 'funny-toon')
   * @param {Object} styleParams - Style parameters specific to the template
   * @param {File|null} imageFile - Reference image file (optional)
   * @param {string} quality - Image quality (legacy parameter, not used by Nano Banana Pro)
   * @param {string} size - Image size ('1024x1024', '1024x1536', '1536x1024', 'auto')
   * @returns {Promise<Object>} Generation result
   */
  async generateImage(templateId, styleParams, imageFile = null, quality = 'low', size = '1024x1536') {
    try {
      console.log('🔍 Service - generateImage called')
      console.log('🔍 Service - templateId:', templateId)
      console.log('🔍 Service - styleParams:', styleParams)
      console.log('🔍 Service - imageFile:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null')
      console.log('🔍 Service - quality:', quality)
      
      const formData = new FormData()
      formData.append('template_id', templateId)
      formData.append('style_params', JSON.stringify(styleParams))
      formData.append('quality', quality)
      formData.append('size', size)
      
      if (imageFile) {
        formData.append('image', imageFile)
        console.log('🔍 Service - Image file attached to form data')
      } else {
        console.log('🔍 Service - No image file provided')
      }

      console.log('🔍 Service - Making request to:', `${API_BASE_URL}/api/images/generate`)

      const response = await fetch(`${API_BASE_URL}/api/images/generate`, {
        method: 'POST',
        body: formData,
      })

      console.log('🔍 Service - Response status:', response.status)
      console.log('🔍 Service - Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('🔍 Service - Error response:', errorData)
        throw new Error(errorData.detail || 'Generation failed')
      }

      const result = await response.json()
      console.log('🔍 Service - Success response:', result)
      return result
    } catch (error) {
      console.error('AI Generation Error:', error)
      throw error
    }
  }

  /**
   * Get generated image URL
   * @param {string} filename - Generated image filename
   * @param {Object} result - Optional full result object with public_url
   * @returns {string} Image URL
   */
  getImageUrl(filename, result = null) {
    // If result contains public_url (with token), use that
    if (result && result.public_url) {
      return result.public_url
    }
    // Otherwise fall back to basic URL (may require token)
    return `${FILE_BASE_URL}/image/${filename}`
  }

  /**
   * Get secure image URL with authentication token for Chinese manufacturing partners
   * @param {string} filename - Generated image filename
   * @param {string} partnerType - Partner type (chinese_manufacturing, end_user)
   * @param {number} expiryHours - Token expiry in hours
   * @returns {Promise<string>} Secure image URL with token
   */
  async getSecureImageUrl(filename, partnerType = 'chinese_manufacturing', expiryHours = 48) {
    try {
      console.log(`🔒 Generating secure URL for ${filename}, partner: ${partnerType}, expiry: ${expiryHours}h`)
      
      const response = await fetch(`${API_BASE_URL}/api/image/generate-secure-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          filename: filename,
          partner_type: partnerType,
          expiry_hours: expiryHours.toString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to generate secure URL')
      }

      const result = await response.json()
      console.log(`🔒 Secure URL generated successfully: ${result.secure_url}`)
      return result.secure_url
      
    } catch (error) {
      console.error('❌ Error generating secure image URL:', error)
      // Fallback to basic URL if secure URL generation fails
      console.warn('⚠️  Falling back to basic URL')
      return this.getImageUrl(filename)
    }
  }


  /**
   * Get available phone brands from Chinese API
   * @returns {Promise<Object>} Brands response
   */
  async getChineseBrands() {
    try {
      console.log('🔍 Service - Getting brands from Chinese API')
      
      const response = await fetch(`${API_BASE_URL}/api/chinese/brands`)
      
      if (!response.ok) {
        throw new Error(`Brands request failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🔍 Service - Brands received:', result)
      
      if (result.success) {
        return result
      } else {
        throw new Error(`Chinese API brands failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Get Chinese Brands Error:', error)
      throw error
    }
  }

  /**
   * Get available phone models for a specific brand and device from Chinese API
   * @param {string} brandId - Brand ID from Chinese API
   * @param {string} deviceId - Device ID for stock check (defaults to env config)
   * @returns {Promise<Object>} Models response with stock data
   */
  async getPhoneModels(brandId, deviceId = environment.chineseApiDeviceId) {
    try {
      console.log('🔍 Service - Getting phone models for brand:', brandId, 'device:', deviceId)
      
      const response = await fetch(`${API_BASE_URL}/api/chinese/stock/${deviceId}/${brandId}`)
      
      if (!response.ok) {
        throw new Error(`Stock request failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('🔍 Service - Stock data received:', result)
      
      if (result.success) {
        return {
          success: true,
          models: result.available_items || result.stock_items || [],
          total_models: result.available_count || result.total_items || 0,
          device_id: result.device_id,
          brand_id: result.brand_id,
          message: result.message
        }
      } else {
        throw new Error(`Chinese API stock failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Get Phone Models Error:', error)
      throw error
    }
  }




  /**
   * Get available styles for a template
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object>} Available styles/options
   */
  async getTemplateStyles(templateId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/styles/${templateId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch template styles')
      }

      return await response.json()
    } catch (error) {
      console.error('Template Styles Error:', error)
      throw error
    }
  }

  /**
   * Check API health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      return await response.json()
    } catch (error) {
      console.error('Health Check Error:', error)
      throw error
    }
  }

  /**
   * Convert image file to data URL for preview
   * @param {File} file - Image file
   * @returns {Promise<string>} Data URL
   */
  async fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Template-specific generation helpers
   */

  /**
   * Generate Retro Remix image
   * @param {string} keyword - Retro style keyword
   * @param {string} optionalText - Optional text to include
   * @param {File} imageFile - Reference image
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Generation result
   */
  async generateRetroRemix(keyword, optionalText = '', imageFile, quality = 'low') {
    const styleParams = {
      keyword,
      optional_text: optionalText
    }
    
    return this.generateImage('retro-remix', styleParams, imageFile, quality)
  }

  /**
   * Generate Funny Toon image
   * @param {string} style - Cartoon style
   * @param {File} imageFile - Reference image
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Generation result
   */
  async generateFunnyToon(style, imageFile, quality = 'low') {
    const styleParams = { style }
    
    return this.generateImage('funny-toon', styleParams, imageFile, quality)
  }

  /**
   * Generate Cover Shoot image
   * @param {string} style - Cover shoot style
   * @param {File} imageFile - Reference image
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Generation result
   */
  async generateCoverShoot(style, imageFile, quality = 'low') {
    const styleParams = { style }
    return this.generateImage('cover-shoot', styleParams, imageFile, quality)
  }

  /**
   * Generate Glitch Pro image
   * @param {string} mode - Glitch mode
   * @param {File} imageFile - Reference image
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Generation result
   */
  async generateGlitchPro(mode, imageFile, quality = 'low') {
    const styleParams = { style: mode }
    
    return this.generateImage('glitch-pro', styleParams, imageFile, quality)
  }

  /**
   * Generate Footy Fan image
   * @param {string} team - Team name
   * @param {string} style - Fan style
   * @param {File} imageFile - Reference image
   * @param {string} quality - Image quality
   * @returns {Promise<Object>} Generation result
   */

  /**
   * Estimate generation cost for Nano Banana Pro
   * @param {string} quality - Legacy parameter (not used by Nano Banana Pro)
   * @param {string} size - Image size ('1024x1024', '1024x1536', '1536x1024', 'auto')
   * @param {boolean} hasReference - Whether reference image is used
   * @returns {Object} Cost estimation
   */
  estimateCost(quality = 'low', size = '1024x1536', hasReference = false) {
    // Nano Banana Pro pricing (per image, ~$0.134 per image regardless of size)
    const baseCost = 0.134

    // Input tokens add minimal cost (~$2 per 1M input tokens)
    // Reference images are charged as input tokens
    const inputCost = hasReference ? 0.002 : 0.0001

    return {
      size,
      totalCost: baseCost + inputCost,
      breakdown: `${size} image${hasReference ? ' with reference image' : ''} (~$${(baseCost + inputCost).toFixed(3)})`
    }
  }
}

// Export singleton instance
export default new AIImageService() 

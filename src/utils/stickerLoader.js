// Utility to load stickers from Cloudflare R2
// Stickers can be loaded directly from R2 (fast) or via backend proxy (slower fallback)
import { API_BASE_URL } from '../config/environment'

// R2 Public URL (if configured) - much faster than backend proxy
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || null

// Use direct R2 URL if available, otherwise fallback to backend proxy
const USE_DIRECT_R2 = !!R2_PUBLIC_URL

export const STICKER_CATEGORIES = {
  "alien": {
    "name": "Alien",
    "icon": "👽",
    "folder": "ALIEN",
    "stickers": [
      {
        "filename": "1.png",
        "name": "ALIEN 1",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "2.png",
        "name": "ALIEN 2",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "3.png",
        "name": "ALIEN 3",
        "thumbnailZoom": 0.95
      },
      {
        "filename": "4.png",
        "name": "ALIEN 4"
      },
      {
        "filename": "5.png",
        "name": "ALIEN 5"
      },
      {
        "filename": "6.png",
        "name": "ALIEN 6",
        "thumbnailZoom": 1.10
      }
    ]
  },
  "british": {
    "name": "British",
    "icon": "🇬🇧",
    "folder": "BRITISH",
    "stickers": [
      {
        "filename": "7.png",
        "name": "BRITISH 1",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "8.png",
        "name": "BRITISH 2",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "9.png",
        "name": "BRITISH 3",
        "thumbnailZoom": 1.05
      },
      {
        "filename": "10.png",
        "name": "BRITISH 4",
        "thumbnailZoom": 1.25
      },
      {
        "filename": "11.png",
        "name": "BRITISH 5"
      },
      {
        "filename": "12.png",
        "name": "BRITISH 6"
      }
    ]
  },
  "cartoon": {
    "name": "Cartoon",
    "icon": "🎨",
    "folder": "CARTOON",
    "stickers": [
      {
        "filename": "13.png",
        "name": "CARTOON 1",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "14.png",
        "name": "CARTOON 2",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "15.png",
        "name": "CARTOON 3",
        "thumbnailZoom": 1.19
      },
      {
        "filename": "16.png",
        "name": "CARTOON 4",
        "thumbnailZoom": 1.30
      },
      {
        "filename": "17.png",
        "name": "CARTOON 5",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "18.png",
        "name": "CARTOON 6",
        "thumbnailZoom": 1.10
      }
    ]
  },
  "cat": {
    "name": "Cat",
    "icon": "🐱",
    "folder": "CAT",
    "stickers": [
      {
        "filename": "160.png",
        "name": "CAT 1"
      },
      {
        "filename": "161.png",
        "name": "CAT 2",
        "thumbnailZoom": 0.80
      },
      {
        "filename": "162.png",
        "name": "CAT 3",
        "thumbnailZoom": 0.90
      },
      {
        "filename": "163.png",
        "name": "CAT 4"
      },
      {
        "filename": "164.png",
        "name": "CAT 5",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "165.png",
        "name": "CAT 6"
      }
    ]
  },
  "dog": {
    "name": "Dog",
    "icon": "🐶",
    "folder": "DOG",
    "stickers": [
      {
        "filename": "166.png",
        "name": "DOG 1",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "167.png",
        "name": "DOG 2",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "168.png",
        "name": "DOG 3",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "169.png",
        "name": "DOG 4",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "170.png",
        "name": "DOG 5",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "171.png",
        "name": "DOG 6",
        "thumbnailZoom": 0.95
      }
    ]
  },
  "grafitti": {
    "name": "Graffiti",
    "icon": "🎨",
    "folder": "GRAFITTI",
    "stickers": [
      {
        "filename": "35.png",
        "name": "GRAFITTI 1",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "36.png",
        "name": "GRAFITTI 2",
        "thumbnailZoom": 1.32
      },
      {
        "filename": "37.png",
        "name": "GRAFITTI 3",
        "thumbnailZoom": 1.50
      },
      {
        "filename": "38.png",
        "name": "GRAFITTI 4",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "39.png",
        "name": "GRAFITTI 5",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "40.png",
        "name": "GRAFITTI 6",
        "thumbnailZoom": 1.20
      }
    ]
  },
  "hiphop": {
    "name": "Hip Hop",
    "icon": "🎤",
    "folder": "HIPHOP",
    "stickers": [
      {
        "filename": "180.png",
        "name": "HIPHOP 1",
        "thumbnailZoom": 1.14
      },
      {
        "filename": "181.png",
        "name": "HIPHOP 2",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "182.png",
        "name": "HIPHOP 3",
        "thumbnailZoom": 1.14
      },
      {
        "filename": "183.png",
        "name": "HIPHOP 4",
        "thumbnailZoom": 1.14
      },
      {
        "filename": "184.png",
        "name": "HIPHOP 5",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "185.png",
        "name": "HIPHOP 6",
        "thumbnailZoom": 1.14
      }
    ]
  },
  "jesus": {
    "name": "Jesus",
    "icon": "✝️",
    "folder": "JESUS",
    "stickers": [
      {
        "filename": "46.png",
        "name": "JESUS 1",
        "thumbnailZoom": 1.30
      },
      {
        "filename": "47.png",
        "name": "JESUS 2",
        "thumbnailZoom": 1.30
      },
      {
        "filename": "48.png",
        "name": "JESUS 3",
        "thumbnailZoom": 1.25
      },
      {
        "filename": "49.png",
        "name": "JESUS 4",
        "thumbnailZoom": 1.26
      },
      {
        "filename": "50.png",
        "name": "JESUS 5",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "51.png",
        "name": "JESUS 6",
        "thumbnailZoom": 1.200
        
      }
    ]
  },
  "love": {
    "name": "Love",
    "icon": "💕",
    "folder": "LOVE",
    "stickers": [
      {
        "filename": "151.png",
        "name": "LOVE 1"
      },
      {
        "filename": "152.png",
        "name": "LOVE 2"
      },
      {
        "filename": "153.png",
        "name": "LOVE 3",
        "thumbnailOffsetY": 5
      },
      {
        "filename": "154.png",
        "name": "LOVE 4",
        "thumbnailOffsetY": 0
      },
      {
        "filename": "155.png",
        "name": "LOVE 5"
      },
      {
        "filename": "158.png",
        "name": "LOVE 6"
      }
    ]
  },
  "mamasandpapas": {
    "name": "Mamas And Papas",
    "icon": "👨‍👩‍👧‍👦",
    "folder": "MAMAS AND PAPAS",
    "stickers": [
      {
        "filename": "19.png",
        "name": "MAMAS AND PAPAS 1",
        "thumbnailZoom": 1.40
      },
      {
        "filename": "20.png",
        "name": "MAMAS AND PAPAS 2",
        "thumbnailZoom": 1.35
      },
      {
        "filename": "21.png",
        "name": "MAMAS AND PAPAS 3",
        "thumbnailZoom": 1.50
      },
      {
        "filename": "22.png",
        "name": "MAMAS AND PAPAS 4",
        "thumbnailZoom": 1.40
      },
      {
        "filename": "23.png",
        "name": "MAMAS AND PAPAS 5",
        "thumbnailZoom": 1.30
      },
      {
        "filename": "24.png",
        "name": "MAMAS AND PAPAS 6",
        "thumbnailZoom": 1.20
      }
    ]
  },
  "monsters": {
    "name": "Monsters",
    "icon": "👹",
    "folder": "MONSTERS",
    "stickers": [
      {
        "filename": "sticker collection-2.png",
        "name": "MONSTERS 1",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "62.png",
        "name": "MONSTERS 2",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "63.png",
        "name": "MONSTERS 3",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "64.png",
        "name": "MONSTERS 4",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "66.png",
        "name": "MONSTERS 5",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "67.png",
        "name": "MONSTERS 6",
        "thumbnailZoom": 1.10
      }
    ]
  },
  "popart": {
    "name": "Pop Art",
    "icon": "🎨",
    "folder": "POP-ART",
    "stickers": [
      {
        "filename": "221.png",
        "name": "POP-ART 1"
      },
      {
        "filename": "222.png",
        "name": "POP-ART 2"
      },
      {
        "filename": "223.png",
        "name": "POP-ART 3"
      },
      {
        "filename": "224.png",
        "name": "POP-ART 4"
      },
      {
        "filename": "229.png",
        "name": "POP-ART 5"
      },
      {
        "filename": "230.png",
        "name": "POP-ART 6"
      }
    ]
  },
  "positivevibe": {
    "name": "Positive Vibe",
    "icon": "✨",
    "folder": "POSITIVE VIBE",
    "stickers": [
      {
        "filename": "213.png",
        "name": "POSITIVE VIBE 1",
        "thumbnailZoom": 1.30
      },
      {
        "filename": "216.png",
        "name": "POSITIVE VIBE 2",
        "thumbnailZoom": 1.15
      },
      {
        "filename": "217.png",
        "name": "POSITIVE VIBE 3"
      },
      {
        "filename": "218.png",
        "name": "POSITIVE VIBE 4"
      },
      {
        "filename": "219.png",
        "name": "POSITIVE VIBE 5"
      },
      {
        "filename": "220.png",
        "name": "POSITIVE VIBE 6"
      }
    ]
  },
  "retro": {
    "name": "Retro",
    "icon": "📼",
    "folder": "RETRO",
    "stickers": [
      {
        "filename": "201.png",
        "name": "RETRO 1"
      },
      {
        "filename": "203.png",
        "name": "RETRO 2",
        "thumbnailZoom": 0.90
      },
      {
        "filename": "205.png",
        "name": "RETRO 3"
      },
      {
        "filename": "206.png",
        "name": "RETRO 4"
      },
      {
        "filename": "207.png",
        "name": "RETRO 5"
      },
      {
        "filename": "208.png",
        "name": "RETRO 6",
        "thumbnailZoom": 1.15
      }
    ]
  },
  "rock": {
    "name": "Rock",
    "icon": "🎸",
    "folder": "ROCK",
    "stickers": [
      {
        "filename": "191.png",
        "name": "ROCK 1",
        "thumbnailZoom": 0.90
      },
      {
        "filename": "193.png",
        "name": "ROCK 2"
      },
      {
        "filename": "194.png",
        "name": "ROCK 3",
        "thumbnailZoom": 0.90
      },
      {
        "filename": "195.png",
        "name": "ROCK 4",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "199.png",
        "name": "ROCK 5",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "200.png",
        "name": "ROCK 6"
      }
    ]
  },
  "skull": {
    "name": "Skull",
    "icon": "💀",
    "folder": "SKULL",
    "stickers": [
      {
        "filename": "141.png",
        "name": "SKULL 1",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "145.png",
        "name": "SKULL 2"
      },
      {
        "filename": "146.png",
        "name": "SKULL 3",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "147.png",
        "name": "SKULL 4",
        "thumbnailZoom": 1.10
      },
      {
        "filename": "148.png",
        "name": "SKULL 5",
        "thumbnailZoom": 1
      },
      {
        "filename": "150.png",
        "name": "SKULL 6",
        "thumbnailZoom": 1.10
      }
    ]
  },
  "space": {
    "name": "Space",
    "icon": "🚀",
    "folder": "SPACE",
    "stickers": [
      {
        "filename": "100.png",
        "name": "SPACE 1",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "101.png",
        "name": "SPACE 2",
        "thumbnailZoom": 1.45
      },
      {
        "filename": "102.png",
        "name": "SPACE 3",
        "thumbnailZoom": 1.40
      },
      {
        "filename": "103.png",
        "name": "SPACE 4",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "104.png",
        "name": "SPACE 5",
        "thumbnailZoom": 1.20
      },
      {
        "filename": "105.png",
        "name": "SPACE 6",
        "thumbnailZoom": 1.20
      }
    ]
  }
}

// Convert sticker categories to the format expected by AddStickersScreen
export const getImageStickerPacks = () => {
  return Object.entries(STICKER_CATEGORIES).map(([category, data]) => ({
    name: data.name,
    icon: data.icon,
    key: category, // Add key for lazy loading
    folder: data.folder, // Store folder for URL generation
    stickers: data.stickers.map((sticker, index) => {
      const webpFilename = sticker.filename.replace('.png', '.webp')
      // Use sourceFolder if available (for merged packs), otherwise use main folder
      const folder = sticker.sourceFolder || data.folder

      // Generate URLs - use direct R2 if available (MUCH faster), otherwise backend proxy
      // R2 structure: Stickers/{CATEGORY}/highres/{filename}.webp
      const thumbnailUrl = USE_DIRECT_R2
        ? `${R2_PUBLIC_URL}/Stickers/${folder}/highres/${webpFilename}`
        : `${API_BASE_URL}/api/stickers/image/${folder}/highres/${webpFilename}`

      const highresUrl = USE_DIRECT_R2
        ? `${R2_PUBLIC_URL}/Stickers/${folder}/highres/${webpFilename}`
        : `${API_BASE_URL}/api/stickers/image/${folder}/highres/${webpFilename}`

      const fallbackUrl = USE_DIRECT_R2
        ? `${R2_PUBLIC_URL}/Stickers/${folder}/${sticker.filename}`
        : `${API_BASE_URL}/api/stickers/image/${folder}/${sticker.filename}`

      return {
        id: `${category}_${index + 1}`,
        name: sticker.name,
        folder: folder,
        webpFilename: webpFilename,
        originalFilename: sticker.filename,
        thumbnailUrl,
        highresUrl,
        fallbackUrl,
        type: 'image',
        thumbnailZoom: sticker.thumbnailZoom || 1.0,
        thumbnailOffsetY: sticker.thumbnailOffsetY || 0
      }
    })
  }))
}

// Log which mode we're using
if (USE_DIRECT_R2) {
  console.log('🚀 Using DIRECT R2 loading (fast) from:', R2_PUBLIC_URL)
} else {
  console.log('⚠️ Using backend proxy (slower). Set VITE_R2_PUBLIC_URL for faster loading.')
}

// Fetch presigned URLs for a specific pack (much faster than proxying)
export const fetchPresignedUrlsForPack = async (pack) => {
  try {
    const folder = pack.folder

    // Fetch presigned URLs for all stickers in this pack
    const urlPromises = pack.stickers.map(async (sticker) => {
      try {
        // Get presigned URLs for thumbnail, highres, and fallback
        const [thumbnailRes, highresRes, fallbackRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/stickers/url/${folder}/thumbnails/${sticker.webpFilename}?expires_in=86400`).catch(() => null),
          fetch(`${API_BASE_URL}/api/stickers/url/${folder}/highres/${sticker.webpFilename}?expires_in=86400`).catch(() => null),
          fetch(`${API_BASE_URL}/api/stickers/url/${folder}/${sticker.originalFilename}?expires_in=86400`).catch(() => null)
        ])

        const thumbnailData = thumbnailRes?.ok ? await thumbnailRes.json() : null
        const highresData = highresRes?.ok ? await highresRes.json() : null
        const fallbackData = fallbackRes?.ok ? await fallbackRes.json() : null

        return {
          ...sticker,
          thumbnailUrl: thumbnailData?.url || null,
          highresUrl: highresData?.url || null,
          fallbackUrl: fallbackData?.url || null
        }
      } catch (error) {
        console.warn(`Failed to get URLs for ${sticker.name}:`, error)
        return sticker
      }
    })

    const stickersWithUrls = await Promise.all(urlPromises)

    return {
      ...pack,
      stickers: stickersWithUrls
    }
  } catch (error) {
    console.error(`Error fetching presigned URLs for pack:`, error)
    return pack
  }
}

// Helper to get thumbnail or full image URL from R2 via backend API
const getStickerUrl = (folder, filename, useThumbnail = true) => {
  const name = filename.replace('.png', '.webp') // Prefer WebP if available

  if (useThumbnail) {
    // Try thumbnail first from R2
    return `${API_BASE_URL}/api/stickers/image/${folder}/thumbnails/${name}`
  }
  return `${API_BASE_URL}/api/stickers/image/${folder}/${filename}`
}

// Function to preload stickers for a specific pack (lazy loading)
export const preloadStickerPack = async (packKey) => {
  if (!STICKER_CATEGORIES[packKey]) {
    console.warn(`⚠️ Sticker pack not found: ${packKey}`)
    return []
  }

  const pack = STICKER_CATEGORIES[packKey]
  const preloadPromises = pack.stickers.map(sticker => {
    return new Promise((resolve) => {
      const img = new Image()
      const thumbnailUrl = getStickerUrl(pack.folder, sticker.filename, true)

      img.onload = () => resolve({ success: true, url: thumbnailUrl })
      img.onerror = () => {
        // Fallback to original if thumbnail fails
        const fallbackImg = new Image()
        const originalUrl = getStickerUrl(pack.folder, sticker.filename, false)
        fallbackImg.onload = () => resolve({ success: true, url: originalUrl, fallback: true })
        fallbackImg.onerror = () => resolve({ success: false, url: originalUrl })
        fallbackImg.src = originalUrl
      }
      img.src = thumbnailUrl
    })
  })

  try {
    const results = await Promise.all(preloadPromises)
    const successful = results.filter(r => r.success).length
    console.log(`✅ Loaded ${successful}/${results.length} stickers for ${pack.name}`)
    return results
  } catch (error) {
    console.warn(`⚠️ Error loading sticker pack ${pack.name}:`, error)
    return []
  }
}

// REMOVED: Eager preloading function - now using lazy loading per pack

// Function to check if a sticker image exists
export const checkStickerExists = async (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = imageUrl
  })
}

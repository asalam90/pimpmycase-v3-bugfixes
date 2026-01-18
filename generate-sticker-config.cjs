#!/usr/bin/env node
/**
 * Auto-generate STICKER_CATEGORIES configuration from actual files
 * Scans public/STICKERS/ and creates correct configuration
 */

const fs = require('fs');
const path = require('path');

const STICKERS_DIR = path.join(__dirname, 'public', 'STICKERS');
const OUTPUT_FILE = path.join(__dirname, 'src', 'utils', 'stickerLoader.js');

// Icon mapping for each category
const CATEGORY_ICONS = {
  'ALIEN': '👽',
  'BRITISH': '🇬🇧',
  'CARTOON': '🎨',
  'CAT': '🐱',
  'DOG': '🐶',
  'GRAFITTI': '🎨',
  'HIPHOP': '🎤',
  'JESUS': '✝️',
  'LOVE': '💕',
  'MAMAS AND PAPAS': '👨‍👩‍👧‍👦',
  'MONSTERS': '👹',
  'POP-ART': '🎨',
  'POSITIVE VIBE': '✨',
  'RETRO': '📼',
  'ROCK': '🎸',
  'SKULL': '💀',
  'SPACE': '🚀'
};

// Convert folder name to category key
function folderToKey(folderName) {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^(.)/g, (m) => m.toLowerCase());
}

// Convert folder name to display name
function folderToName(folderName) {
  return folderName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    + ' Pack';
}

// Scan directory and build configuration
function generateConfig() {
  console.log('🔍 Scanning sticker directories...\n');

  const categories = {};
  const folders = fs.readdirSync(STICKERS_DIR)
    .filter(item => {
      const itemPath = path.join(STICKERS_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort();

  for (const folder of folders) {
    const folderPath = path.join(STICKERS_DIR, folder);
    const files = fs.readdirSync(folderPath)
      .filter(file => file.toLowerCase().endsWith('.png'))
      .sort((a, b) => {
        // Sort numerically if possible
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });

    if (files.length === 0) {
      console.log(`⚠️  Skipping ${folder} (no PNG files)`);
      continue;
    }

    const key = folderToKey(folder);
    const name = folderToName(folder);
    const icon = CATEGORY_ICONS[folder] || '🎨';

    categories[key] = {
      name: name,
      icon: icon,
      folder: folder,
      stickers: files.map((file, index) => ({
        filename: file,
        name: `${folder.replace(/_/g, ' ')} ${index + 1}`
      }))
    };

    console.log(`✅ ${folder}: ${files.length} stickers`);
  }

  console.log(`\n📊 Total: ${Object.keys(categories).length} categories`);
  return categories;
}

// Generate JavaScript code
function generateCode(categories) {
  let code = `// Utility to load stickers from Cloudflare R2
// Stickers can be loaded directly from R2 (fast) or via backend proxy (slower fallback)
import { API_BASE_URL } from '../config/environment'

// R2 Public URL (if configured) - much faster than backend proxy
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || null

// Use direct R2 URL if available, otherwise fallback to backend proxy
const USE_DIRECT_R2 = !!R2_PUBLIC_URL

export const STICKER_CATEGORIES = `;

  code += JSON.stringify(categories, null, 2);

  code += `

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
      const thumbnailUrl = USE_DIRECT_R2
        ? \`\${R2_PUBLIC_URL}/Stickers/\${folder}/highres/\${webpFilename}\`
        : \`\${API_BASE_URL}/api/stickers/image/\${folder}/highres/\${webpFilename}\`

      const highresUrl = USE_DIRECT_R2
        ? \`\${R2_PUBLIC_URL}/Stickers/\${folder}/highres/\${webpFilename}\`
        : \`\${API_BASE_URL}/api/stickers/image/\${folder}/highres/\${webpFilename}\`

      const fallbackUrl = USE_DIRECT_R2
        ? \`\${R2_PUBLIC_URL}/Stickers/\${folder}/\${sticker.filename}\`
        : \`\${API_BASE_URL}/api/stickers/image/\${folder}/\${sticker.filename}\`

      return {
        id: \`\${category}_\${index + 1}\`,
        name: sticker.name,
        folder: folder,
        webpFilename: webpFilename,
        originalFilename: sticker.filename,
        thumbnailUrl,
        highresUrl,
        fallbackUrl,
        type: 'image'
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
          fetch(\`\${API_BASE_URL}/api/stickers/url/\${folder}/thumbnails/\${sticker.webpFilename}?expires_in=86400\`).catch(() => null),
          fetch(\`\${API_BASE_URL}/api/stickers/url/\${folder}/highres/\${sticker.webpFilename}?expires_in=86400\`).catch(() => null),
          fetch(\`\${API_BASE_URL}/api/stickers/url/\${folder}/\${sticker.originalFilename}?expires_in=86400\`).catch(() => null)
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
        console.warn(\`Failed to get URLs for \${sticker.name}:\`, error)
        return sticker
      }
    })

    const stickersWithUrls = await Promise.all(urlPromises)

    return {
      ...pack,
      stickers: stickersWithUrls
    }
  } catch (error) {
    console.error(\`Error fetching presigned URLs for pack:\`, error)
    return pack
  }
}

// Helper to get thumbnail or full image URL from R2 via backend API
const getStickerUrl = (folder, filename, useThumbnail = true) => {
  const name = filename.replace('.png', '.webp') // Prefer WebP if available

  if (useThumbnail) {
    // Try thumbnail first from R2
    return \`\${API_BASE_URL}/api/stickers/image/\${folder}/thumbnails/\${name}\`
  }
  return \`\${API_BASE_URL}/api/stickers/image/\${folder}/\${filename}\`
}

// Function to preload stickers for a specific pack (lazy loading)
export const preloadStickerPack = async (packKey) => {
  if (!STICKER_CATEGORIES[packKey]) {
    console.warn(\`⚠️ Sticker pack not found: \${packKey}\`)
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
    console.log(\`✅ Loaded \${successful}/\${results.length} stickers for \${pack.name}\`)
    return results
  } catch (error) {
    console.warn(\`⚠️ Error loading sticker pack \${pack.name}:\`, error)
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
`;

  return code;
}

// Main function
function main() {
  console.log('🚀 Generating sticker configuration...\n');

  if (!fs.existsSync(STICKERS_DIR)) {
    console.error(`❌ STICKERS directory not found: ${STICKERS_DIR}`);
    process.exit(1);
  }

  const categories = generateConfig();
  const code = generateCode(categories);

  // Backup original file
  if (fs.existsSync(OUTPUT_FILE)) {
    const backupFile = OUTPUT_FILE + '.backup';
    fs.copyFileSync(OUTPUT_FILE, backupFile);
    console.log(`\n💾 Backed up original to: ${backupFile}`);
  }

  // Write new file
  fs.writeFileSync(OUTPUT_FILE, code, 'utf8');
  console.log(`✅ Generated: ${OUTPUT_FILE}`);
  console.log('\n✨ Done!\n');
}

main();

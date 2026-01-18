/**
 * Script to download all iPhone 15 design mockups from the Browse Designs screen
 * This captures each design with the complete phone overlay as shown on the webpage
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Design packs and files from BrowseDesignsScreen.jsx
const designPacks = {
  'ABSTRACT': {
    name: 'Abstract Pack',
    files: [
      'Dreamscape.jpg',
      'Rainy Day In London.jpg',
      'Serenity.jpg',
      'Sing Me An Old Fashioned Song.jpg'
    ]
  },
  'ANIMAL_PRINT': {
    name: 'Animal Print Pack',
    subfolder: 'FINAL',
    files: [
      'Ethereal Wild.webp',
      'Natures Pulse.webp',
      'Stripes and Shadows.webp',
      'Wild Instinct.webp'
    ]
  },
  'CATS': {
    name: 'Cats Pack',
    files: [
      'Art Cats Society.webp',
      'Dreams of the Cat.webp',
      'Hello Kitty.webp',
      'Whiskers and Wonder.webp'
    ]
  },
  'DOGS': {
    name: 'Dogs Pack',
    files: [
      'Bark and Bloom.webp',
      'Happy Howls.webp',
      'Paws and Poetry.png',
      'Woofology.png'
    ]
  },
  'FLORAL': {
    name: 'Floral Pack',
    files: [
      'Petals in a Dream.webp',
      'Sunny Botanica.webp',
      'The Abstract Garden.webp',
      'Whispers in Color.webp'
    ]
  },
  'GRAFITTI': {
    name: 'Graffiti Pack',
    files: [
      'Color Chaos.webp',
      'No Rules Club.webp',
      'Off the Wall.webp',
      'Spray and Slay.webp'
    ]
  },
  'HIPHOP': {
    name: 'Hip Hop Pack',
    files: [
      '808 Dreams.webp',
      'Born to Flex.webp',
      'Rhythms of the Street.webp',
      'Sound in Motion.webp'
    ]
  },
  'LOVE': {
    name: 'Love Pack',
    files: [
      'Love Beyond Form.png',
      'Love in Fragments.webp',
      'When Hearts Dream.webp',
      'Whispers of a Ladybug.png'
    ]
  },
  'MONOCHROME': {
    name: 'Monochrome Pack',
    files: [
      'Black Whisper.webp',
      'Pure Form.webp',
      'The Absence of Color.jpg',
      'The Space Between.webp'
    ]
  },
  'MONSTERS': {
    name: 'Monsters Pack',
    files: [
      'Cotton Candy Chaos.webp',
      'He Wanted to Be Loved.webp',
      'The Kind Monster.webp',
      'When Monsters Dream.webp'
    ]
  },
  'POSITIVE_VIBE': {
    name: 'Positive Vibe Pack',
    files: [
      'Be the Sun.webp',
      'Good Energy Only.webp',
      'Kindness Era.webp',
      'No Bad Vibes.webp'
    ]
  },
  'RETRO_POPUP': {
    name: 'Retro Pack',
    files: [
      'Everybodys Famous.webp',
      'Fame Frequency.webp',
      'Pop Girl Energy.webp',
      'The Color Shouts Back.webp'
    ]
  },
  'ROCK': {
    name: 'Rock Pack',
    files: [
      'Born Loud.webp',
      'Electric Soul.webp',
      'Rock n Roll Spirit.webp',
      'Wild and Wired.webp'
    ]
  },
  'SPACE': {
    name: 'Space Pack',
    files: [
      'Born of Supernovas.webp',
      'Dancing with Planets.webp',
      'ETERNAL VOID.webp',
      'Interstellar.webp'
    ]
  },
  'SURREAL': {
    name: 'Surreal Pack',
    files: [
      'Eyes That Remember Dreams.webp',
      'Illusions of Memory.webp',
      'SUBCONSCIOUS GARDEN.webp',
      'THE UNREAL THINGS.webp'
    ]
  },
  'TECH_LUXE': {
    name: 'Tech Luxe Pack',
    files: [
      'CYBER BLOOM.webp',
      'Platinum Mind.jpg',
      'Signal Aura.webp',
      'Silent Code.webp'
    ]
  }
};

const BASE_URL = 'http://10.107.150.193:5173';
const OUTPUT_DIR = path.join(__dirname, 'downloaded-designs-iphone15');

async function downloadDesigns() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Starting design download...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Navigate to browse designs page
    console.log(`🌐 Navigating to ${BASE_URL}/browse-designs...`);
    await page.goto(`${BASE_URL}/browse-designs`, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('✅ Page loaded');

    let designIndex = 0;
    let totalDesigns = 0;

    // Count total designs
    for (const pack of Object.values(designPacks)) {
      totalDesigns += pack.files.length;
    }

    console.log(`📊 Total designs to download: ${totalDesigns}`);

    // Iterate through each pack
    for (const [category, pack] of Object.entries(designPacks)) {
      const packDir = path.join(OUTPUT_DIR, category);
      if (!fs.existsSync(packDir)) {
        fs.mkdirSync(packDir, { recursive: true });
      }

      console.log(`\n📦 Processing ${pack.name}...`);

      // For each design in the pack
      for (const file of pack.files) {
        designIndex++;
        const designName = file.replace(/\.(webp|jpg|png)$/i, '');

        console.log(`  [${designIndex}/${totalDesigns}] ${designName}`);

        try {
          // Wait for the design to be visible in the grid
          await page.waitForSelector('[style*="gridTemplateColumns"]', { timeout: 5000 });

          // Click on the design to load it in the preview
          const designElements = await page.$$('[style*="gridTemplateColumns"] > div > div');

          if (designElements[designIndex - 1]) {
            await designElements[designIndex - 1].click();

            // Wait for the preview to update
            await page.waitForTimeout(2000);

            // Find the phone preview container
            const previewElement = await page.$('[style*="maxWidth"][style*="300px"]');

            if (previewElement) {
              // Take screenshot of the phone preview
              const screenshot = await previewElement.screenshot({
                type: 'png'
              });

              // Save the screenshot
              const outputPath = path.join(packDir, `${designName}.png`);
              fs.writeFileSync(outputPath, screenshot);

              console.log(`    ✅ Saved: ${designName}.png`);
            } else {
              console.log(`    ⚠️  Preview element not found for ${designName}`);
            }
          } else {
            console.log(`    ⚠️  Design element not found at index ${designIndex - 1}`);
          }
        } catch (error) {
          console.error(`    ❌ Error capturing ${designName}:`, error.message);
        }

        // Small delay between captures
        await page.waitForTimeout(500);
      }
    }

    console.log('\n✨ Download complete!');
    console.log(`📁 All designs saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

// Run the script
downloadDesigns().catch(console.error);

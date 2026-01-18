#!/usr/bin/env node
/**
 * Generate high-resolution WebP thumbnails for all stickers
 * Structure: public/STICKERS/{CATEGORY}/highres/{filename}.webp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const STICKERS_DIR = path.join(__dirname, 'public', 'STICKERS');
const OUTPUT_FOLDER = 'highres';

// Maximum thumbnail size (2000x2000px for faster loading)
const MAX_SIZE = 2000;

// High quality WebP settings for thumbnails
const WEBP_OPTIONS = {
  quality: 95,
  effort: 6,
  lossless: false
};

async function processCategory(categoryPath, categoryName) {
  console.log(`\n📁 Processing category: ${categoryName}`);

  const files = fs.readdirSync(categoryPath);
  const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log(`  ⚠️  No PNG files found in ${categoryName}`);
    return { processed: 0, skipped: 0 };
  }

  // Create highres folder
  const highresDir = path.join(categoryPath, OUTPUT_FOLDER);
  if (!fs.existsSync(highresDir)) {
    fs.mkdirSync(highresDir, { recursive: true });
    console.log(`  ✅ Created highres directory`);
  }

  let processed = 0;
  let skipped = 0;

  for (const file of pngFiles) {
    const inputPath = path.join(categoryPath, file);
    const outputFilename = file.replace(/\.png$/i, '.webp');
    const outputPath = path.join(highresDir, outputFilename);

    try {
      // Check if output already exists and is newer than input
      if (fs.existsSync(outputPath)) {
        const inputStats = fs.statSync(inputPath);
        const outputStats = fs.statSync(outputPath);

        if (outputStats.mtime > inputStats.mtime) {
          console.log(`  ⏭️  Skipping ${file} (already up to date)`);
          skipped++;
          continue;
        }
      }

      // Convert to high-quality WebP with max 2000x2000px
      await sharp(inputPath)
        .resize(MAX_SIZE, MAX_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp(WEBP_OPTIONS)
        .toFile(outputPath);

      // Get file sizes for logging
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(outputPath).size;
      const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

      console.log(`  ✅ ${file} → ${outputFilename} (${savings}% smaller)`);
      processed++;

    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
    }
  }

  return { processed, skipped };
}

async function main() {
  console.log('🚀 Starting sticker thumbnail generation...\n');
  console.log(`Source: ${STICKERS_DIR}`);
  console.log(`Output folder: ${OUTPUT_FOLDER}/`);
  console.log(`Max size: ${MAX_SIZE}x${MAX_SIZE}px`);
  console.log(`WebP quality: ${WEBP_OPTIONS.quality}\n`);

  if (!fs.existsSync(STICKERS_DIR)) {
    console.error(`❌ STICKERS directory not found: ${STICKERS_DIR}`);
    process.exit(1);
  }

  const categories = fs.readdirSync(STICKERS_DIR).filter(item => {
    const itemPath = path.join(STICKERS_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`Found ${categories.length} categories\n`);
  console.log('━'.repeat(60));

  let totalProcessed = 0;
  let totalSkipped = 0;

  for (const category of categories) {
    const categoryPath = path.join(STICKERS_DIR, category);
    const result = await processCategory(categoryPath, category);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  ✅ Processed: ${totalProcessed} files`);
  console.log(`  ⏭️  Skipped: ${totalSkipped} files`);
  console.log(`  📁 Categories: ${categories.length}`);
  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

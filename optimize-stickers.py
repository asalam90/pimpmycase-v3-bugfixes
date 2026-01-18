#!/usr/bin/env python3
"""
Sticker Image Optimization Script
Generates optimized thumbnails and medium-sized versions of sticker images.
"""

import os
import sys
from pathlib import Path
from PIL import Image
import shutil

# Configuration
SOURCE_DIR = Path("public/Stickers")
# Tiny thumbnails for grid display (shown at 65px)
THUMBNAIL_SIZE = (150, 150)
THUMBNAIL_QUALITY = 75
# High-res for placed stickers (print quality)
HIGHRES_SIZE = (2000, 2000)
HIGHRES_QUALITY = 95
PNG_OPTIMIZE = True

def optimize_image(input_path, output_path, max_size, format='WEBP', quality=85):
    """
    Optimize and resize an image.

    Args:
        input_path: Path to input image
        output_path: Path to save optimized image
        max_size: Tuple of (width, height) max dimensions
        format: Output format ('WEBP' or 'PNG')
        quality: Quality setting (1-100)
    """
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB for JPEG, keep RGBA for WebP/PNG
            if img.mode in ('RGBA', 'LA'):
                if format == 'JPEG':
                    # Create white background for JPEG
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                    img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Calculate new size maintaining aspect ratio
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Create output directory if it doesn't exist
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Save optimized image
            save_kwargs = {}
            if format == 'WEBP':
                save_kwargs = {
                    'format': 'WEBP',
                    'quality': quality,
                    'method': 6  # Best compression
                }
            elif format == 'PNG':
                save_kwargs = {
                    'format': 'PNG',
                    'optimize': PNG_OPTIMIZE,
                    'compress_level': 9
                }

            img.save(output_path, **save_kwargs)

            # Get file sizes for reporting
            input_size = input_path.stat().st_size / 1024  # KB
            output_size = output_path.stat().st_size / 1024  # KB
            reduction = ((input_size - output_size) / input_size) * 100 if input_size > 0 else 0

            return {
                'success': True,
                'input_size': input_size,
                'output_size': output_size,
                'reduction': reduction
            }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def process_stickers():
    """Process all sticker images and generate optimized versions."""

    if not SOURCE_DIR.exists():
        print(f"❌ Source directory not found: {SOURCE_DIR}")
        return

    print(f"🎨 Sticker Optimization Starting...")
    print(f"📁 Source: {SOURCE_DIR.absolute()}")
    print(f"📐 Thumbnail size: {THUMBNAIL_SIZE} @ {THUMBNAIL_QUALITY}% (for grid)")
    print(f"📐 High-res size: {HIGHRES_SIZE} @ {HIGHRES_QUALITY}% (for placement)")
    print("-" * 60)

    stats = {
        'total': 0,
        'success': 0,
        'failed': 0,
        'total_original_size': 0,
        'total_thumbnail_size': 0,
        'total_highres_size': 0
    }

    # Find all PNG files
    png_files = list(SOURCE_DIR.rglob("*.png"))
    png_files = [f for f in png_files if 'sticker collection' not in f.name.lower()]

    print(f"📊 Found {len(png_files)} sticker images\n")

    for i, png_file in enumerate(png_files, 1):
        stats['total'] += 1

        # Get relative path from SOURCE_DIR
        rel_path = png_file.relative_to(SOURCE_DIR)
        category = rel_path.parent
        filename = rel_path.stem

        print(f"[{i}/{len(png_files)}] Processing: {category}/{png_file.name}")

        # Create output paths
        thumbnail_webp = SOURCE_DIR / category / "thumbnails" / f"{filename}.webp"
        highres_webp = SOURCE_DIR / category / "highres" / f"{filename}.webp"

        # Generate tiny thumbnail for grid display
        thumb_result = optimize_image(
            png_file,
            thumbnail_webp,
            THUMBNAIL_SIZE,
            format='WEBP',
            quality=THUMBNAIL_QUALITY
        )

        if thumb_result['success']:
            stats['total_thumbnail_size'] += thumb_result['output_size']
            print(f"  ✓ Thumbnail (grid): {thumb_result['output_size']:.1f}KB ({thumb_result['reduction']:.1f}% reduction)")
        else:
            print(f"  ✗ Thumbnail failed: {thumb_result['error']}")
            stats['failed'] += 1
            continue

        # Generate high-res for placed stickers (print quality)
        highres_result = optimize_image(
            png_file,
            highres_webp,
            HIGHRES_SIZE,
            format='WEBP',
            quality=HIGHRES_QUALITY
        )

        if highres_result['success']:
            stats['total_highres_size'] += highres_result['output_size']
            print(f"  ✓ High-res (placement): {highres_result['output_size']:.1f}KB ({highres_result['reduction']:.1f}% reduction)")
            stats['success'] += 1
        else:
            print(f"  ✗ High-res failed: {highres_result['error']}")
            stats['failed'] += 1
            continue

        # Track original size
        stats['total_original_size'] += png_file.stat().st_size / 1024

        print()

    # Print summary
    print("-" * 60)
    print("📊 OPTIMIZATION SUMMARY")
    print("-" * 60)
    print(f"Total images processed: {stats['total']}")
    print(f"Successful: {stats['success']}")
    print(f"Failed: {stats['failed']}")
    print()
    print(f"Original total size: {stats['total_original_size']/1024:.1f} MB")
    print(f"Thumbnail total size (grid): {stats['total_thumbnail_size']/1024:.1f} MB")
    print(f"High-res total size (placement): {stats['total_highres_size']/1024:.1f} MB")
    print(f"Combined optimized size: {(stats['total_thumbnail_size'] + stats['total_highres_size'])/1024:.1f} MB")
    print()

    if stats['total_original_size'] > 0:
        total_optimized = stats['total_thumbnail_size'] + stats['total_highres_size']
        total_reduction = ((stats['total_original_size'] - total_optimized) / stats['total_original_size']) * 100
        print(f"💾 Total size reduction: {total_reduction:.1f}%")
        print(f"💰 Space saved: {(stats['total_original_size'] - total_optimized)/1024:.1f} MB")
        print()
        print(f"📱 Grid browsing: Only ~{stats['total_thumbnail_size']/1024:.1f} MB loaded (thumbnails)")
        print(f"🎨 High-quality placement: {stats['total_highres_size']/1024:.1f} MB available on-demand")

    print("\n✅ Optimization complete!")
    print("\n📝 Next steps:")
    print("   1. Thumbnails are used for grid display (ultra-fast)")
    print("   2. High-res versions load when stickers are placed")
    print("   3. Originals kept as fallback")

if __name__ == "__main__":
    try:
        process_stickers()
    except KeyboardInterrupt:
        print("\n\n⚠️  Optimization cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

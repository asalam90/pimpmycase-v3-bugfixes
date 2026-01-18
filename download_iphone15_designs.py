#!/usr/bin/env python3
"""
Script to create iPhone 15 design mockups by compositing background images
with phone overlay and mask - exactly as shown on the Browse Designs screen
"""

import os
from PIL import Image, ImageDraw
import json

# Design packs configuration from BrowseDesignsScreen.jsx
DESIGN_PACKS = {
    'ABSTRACT': {
        'name': 'Abstract Pack',
        'files': [
            'Dreamscape.jpg',
            'Rainy Day In London.jpg',
            'Serenity.jpg',
            'Sing Me An Old Fashioned Song.jpg'
        ]
    },
    'ANIMAL_PRINT': {
        'name': 'Animal Print Pack',
        'subfolder': 'FINAL',
        'files': [
            'Ethereal Wild.webp',
            'Natures Pulse.webp',
            'Stripes and Shadows.webp',
            'Wild Instinct.webp'
        ]
    },
    'CATS': {
        'name': 'Cats Pack',
        'files': [
            'Art Cats Society.webp',
            'Dreams of the Cat.webp',
            'Hello Kitty.webp',
            'Whiskers and Wonder.webp'
        ]
    },
    'DOGS': {
        'name': 'Dogs Pack',
        'files': [
            'Bark and Bloom.webp',
            'Happy Howls.webp',
            'Paws and Poetry.png',
            'Woofology.png'
        ]
    },
    'FLORAL': {
        'name': 'Floral Pack',
        'files': [
            'Petals in a Dream.webp',
            'Sunny Botanica.webp',
            'The Abstract Garden.webp',
            'Whispers in Color.webp'
        ]
    },
    'GRAFITTI': {
        'name': 'Graffiti Pack',
        'files': [
            'Color Chaos.webp',
            'No Rules Club.webp',
            'Off the Wall.webp',
            'Spray and Slay.webp'
        ]
    },
    'HIPHOP': {
        'name': 'Hip Hop Pack',
        'files': [
            '808 Dreams.webp',
            'Born to Flex.webp',
            'Rhythms of the Street.webp',
            'Sound in Motion.webp'
        ]
    },
    'LOVE': {
        'name': 'Love Pack',
        'files': [
            'Love Beyond Form.png',
            'Love in Fragments.webp',
            'When Hearts Dream.webp',
            'Whispers of a Ladybug.png'
        ]
    },
    'MONOCHROME': {
        'name': 'Monochrome Pack',
        'files': [
            'Black Whisper.webp',
            'Pure Form.webp',
            'The Absence of Color.jpg',
            'The Space Between.webp'
        ]
    },
    'MONSTERS': {
        'name': 'Monsters Pack',
        'files': [
            'Cotton Candy Chaos.webp',
            'He Wanted to Be Loved.webp',
            'The Kind Monster.webp',
            'When Monsters Dream.webp'
        ]
    },
    'POSITIVE_VIBE': {
        'name': 'Positive Vibe Pack',
        'files': [
            'Be the Sun.webp',
            'Good Energy Only.webp',
            'Kindness Era.webp',
            'No Bad Vibes.webp'
        ]
    },
    'RETRO_POPUP': {
        'name': 'Retro Pack',
        'files': [
            'Everybodys Famous.webp',
            'Fame Frequency.webp',
            'Pop Girl Energy.webp',
            'The Color Shouts Back.webp'
        ]
    },
    'ROCK': {
        'name': 'Rock Pack',
        'files': [
            'Born Loud.webp',
            'Electric Soul.webp',
            'Rock n Roll Spirit.webp',
            'Wild and Wired.webp'
        ]
    },
    'SPACE': {
        'name': 'Space Pack',
        'files': [
            'Born of Supernovas.webp',
            'Dancing with Planets.webp',
            'ETERNAL VOID.webp',
            'Interstellar.webp'
        ]
    },
    'SURREAL': {
        'name': 'Surreal Pack',
        'files': [
            'Eyes That Remember Dreams.webp',
            'Illusions of Memory.webp',
            'SUBCONSCIOUS GARDEN.webp',
            'THE UNREAL THINGS.webp'
        ]
    },
    'TECH_LUXE': {
        'name': 'Tech Luxe Pack',
        'files': [
            'CYBER BLOOM.webp',
            'Platinum Mind.jpg',
            'Signal Aura.webp',
            'Silent Code.webp'
        ]
    }
}

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'public')  # Try public first
if not os.path.exists(DIST_DIR):
    DIST_DIR = os.path.join(BASE_DIR, 'dist')  # Fallback to dist

PHONE_BACK = os.path.join(DIST_DIR, 'Phone backs', 'iphone15.png')
MASK_IMAGE = os.path.join(DIST_DIR, 'masks', "iphone15's mask.png")
OUTPUT_DIR = os.path.join(BASE_DIR, 'downloaded-designs-iphone15')

# Display dimensions from BrowseDesignsScreen.jsx (line 441-442)
DISPLAY_WIDTH = 200
DISPLAY_HEIGHT = 333

# Native phone back dimensions
PHONE_NATIVE_WIDTH = 1236
PHONE_NATIVE_HEIGHT = 2460

# Calculate HD output dimensions (scale up from display to native phone height)
SCALE_FACTOR = PHONE_NATIVE_HEIGHT / DISPLAY_HEIGHT  # 7.387
HD_WIDTH = int(DISPLAY_WIDTH * SCALE_FACTOR)  # 1477
HD_HEIGHT = PHONE_NATIVE_HEIGHT  # 2460

# Phone back render position with objectFit: 'contain' (centered)
PHONE_ASPECT = PHONE_NATIVE_WIDTH / PHONE_NATIVE_HEIGHT
DISPLAY_ASPECT = DISPLAY_WIDTH / DISPLAY_HEIGHT
PHONE_RENDER_WIDTH = int(DISPLAY_HEIGHT * PHONE_ASPECT)  # 167.31
PHONE_OFFSET_X = (DISPLAY_WIDTH - PHONE_RENDER_WIDTH) / 2  # 16.34

# HD phone positioning (phone is 1236 wide, centered in 1477 wide canvas)
HD_PHONE_OFFSET_X = int((HD_WIDTH - PHONE_NATIVE_WIDTH) / 2)  # (1477-1236)/2 = 120.5

# SVG mask positioning from BrowseDesignsScreen.jsx (lines 481-486)
MASK_X_PERCENT = 8  # x="8%"
MASK_WIDTH_PERCENT = 85  # width="85%"


def composite_design(background_path, output_path):
    """
    Create HD phone case mockup matching exact BrowseDesignsScreen.jsx rendering

    Display: 200x333 container
    Phone renders at: 167.31x333 (objectFit: contain, centered at x=16.34)
    Mask: x=16px (8%), width=170px (85%), height=333px

    HD output: 1477x2460 (scaled up 7.387x)
    Phone: 1236x2460 native (centered at x=120.5)
    Mask: x=118, width=1255, height=2460
    """
    try:
        # Load images at native resolution
        phone_back = Image.open(PHONE_BACK).convert('RGBA')
        mask_original = Image.open(MASK_IMAGE).convert('L')
        background = Image.open(background_path).convert('RGBA')

        # HD dimensions
        mask_x = int(HD_WIDTH * MASK_X_PERCENT / 100)  # 118
        mask_width = int(HD_WIDTH * MASK_WIDTH_PERCENT / 100)  # 1255
        mask_height = HD_HEIGHT  # 2460

        # Stretch mask to SVG dimensions (preserveAspectRatio="none")
        mask_stretched = mask_original.resize((mask_width, mask_height), Image.Resampling.LANCZOS)

        # Resize background to fill entire canvas (objectFit: 'cover')
        background_resized = background.resize((HD_WIDTH, HD_HEIGHT), Image.Resampling.LANCZOS)

        # Create HD canvas
        canvas = Image.new('RGBA', (HD_WIDTH, HD_HEIGHT), (0, 0, 0, 0))

        # Layer 1: Phone back (centered with objectFit: contain)
        # Phone is already at native size (1236x2460), just center it
        canvas.paste(phone_back, (HD_PHONE_OFFSET_X, 0), phone_back)

        # Layer 2: Create alpha mask
        full_mask = Image.new('L', (HD_WIDTH, HD_HEIGHT), 0)
        full_mask.paste(mask_stretched, (mask_x, 0))

        # Layer 3: Apply mask to background design
        design_layer = background_resized.copy()
        design_layer.putalpha(full_mask)

        # Composite design on top of phone back
        canvas = Image.alpha_composite(canvas, design_layer)

        # Save as PNG
        canvas.save(output_path, 'PNG', optimize=False)
        return True

    except Exception as e:
        print(f"    ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print('🚀 Starting iPhone 15 design mockup generation...')
    print(f'📁 Output directory: {OUTPUT_DIR}')
    print(f'📱 Phone back: {PHONE_BACK}')
    print(f'🎭 Mask: {MASK_IMAGE}')
    print()

    # Check if required files exist
    if not os.path.exists(PHONE_BACK):
        print(f'❌ Phone back not found: {PHONE_BACK}')
        return
    if not os.path.exists(MASK_IMAGE):
        print(f'❌ Mask not found: {MASK_IMAGE}')
        return

    total_designs = sum(len(pack['files']) for pack in DESIGN_PACKS.values())
    current = 0

    # Process each pack
    for category, pack in DESIGN_PACKS.items():
        pack_dir = os.path.join(OUTPUT_DIR, category)
        os.makedirs(pack_dir, exist_ok=True)

        print(f"\n📦 Processing {pack['name']}...")

        # Determine base path for backgrounds
        subfolder = pack.get('subfolder')
        if subfolder:
            base_path = os.path.join(DIST_DIR, 'Backgrounds', category, subfolder)
        else:
            base_path = os.path.join(DIST_DIR, 'Backgrounds', category)

        # Process each design
        for filename in pack['files']:
            current += 1
            design_name = os.path.splitext(filename)[0]

            print(f"  [{current}/{total_designs}] {design_name}")

            # Try to find the background image
            background_path = os.path.join(base_path, filename)

            if not os.path.exists(background_path):
                # Try alternative formats
                base_name = os.path.splitext(filename)[0]
                for ext in ['.webp', '.png', '.jpg', '.JPG']:
                    alt_path = os.path.join(base_path, base_name + ext)
                    if os.path.exists(alt_path):
                        background_path = alt_path
                        break

            if not os.path.exists(background_path):
                print(f"    ⚠️  Background not found: {background_path}")
                continue

            # Create composite
            output_path = os.path.join(pack_dir, f"{design_name}.png")

            if composite_design(background_path, output_path):
                print(f"    ✅ Saved: {design_name}.png")
            else:
                print(f"    ❌ Failed to create mockup for {design_name}")

    print('\n✨ Generation complete!')
    print(f'📁 All iPhone 15 design mockups saved to: {OUTPUT_DIR}')
    print(f'📊 Total mockups created: {current}')


if __name__ == '__main__':
    main()

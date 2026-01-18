#!/usr/bin/env python3
"""
Script to create Samsung S25 design mockups by compositing background images
with phone overlay and mask - exactly as shown on the Browse Designs screen
"""

import os
from PIL import Image, ImageDraw
from io import BytesIO
import base64
import xml.etree.ElementTree as ET
import cairosvg

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

PHONE_BACK = os.path.join(DIST_DIR, 'Phone backs', 'samsung-s25.png')
MASK_SVG = os.path.join(DIST_DIR, 'masks', 'samsung-s25-mask.svg')
OUTPUT_DIR = os.path.join(BASE_DIR, 'downloaded-designs-samsung-s25')

# Display dimensions from BrowseDesignsScreen.jsx - Samsung thumbnail in grid
DISPLAY_WIDTH = 160  # Samsung thumbnail (square) from line 696-697
DISPLAY_HEIGHT = 160

# Native phone back dimensions (Samsung S25 is square)
PHONE_NATIVE_WIDTH = 600
PHONE_NATIVE_HEIGHT = 600

# Calculate HD output dimensions (scale up from display to native phone size)
SCALE_FACTOR = PHONE_NATIVE_HEIGHT / DISPLAY_HEIGHT  # 3.75
HD_WIDTH = int(DISPLAY_WIDTH * SCALE_FACTOR)  # 600
HD_HEIGHT = PHONE_NATIVE_HEIGHT  # 600

# Samsung mask positioning from phoneCaseLayout.js (getMaskPosition)
# x: '-5.25%', y: '-5.7%', width: '108%', height: '109%'
MASK_X_PERCENT = -5.25
MASK_Y_PERCENT = -5.7
MASK_WIDTH_PERCENT = 108
MASK_HEIGHT_PERCENT = 109


def render_svg_mask(svg_path, width, height):
    """
    Render the complete SVG file to a PNG mask at specified dimensions
    This preserves all internal transforms and positioning
    """
    try:
        # Render SVG to PNG bytes using cairosvg
        png_data = cairosvg.svg2png(
            url=svg_path,
            output_width=width,
            output_height=height
        )

        # Load as PIL Image and convert to grayscale mask
        mask_img = Image.open(BytesIO(png_data)).convert('L')
        return mask_img

    except Exception as e:
        print(f"❌ Error rendering SVG mask: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def composite_design(background_path, output_path):
    """
    Create HD Samsung S25 phone case mockup matching BrowseDesignsScreen.jsx thumbnail rendering

    Display: 160x160 square thumbnail (line 696-697, 728-729)
    Phone renders at: 160x160 (objectFit: contain, fills container)
    Mask: x=-5.25%, y=-5.7%, width=108%, height=109%

    HD output: 600x600 (scaled up 3.75x to match native phone back)
    Phone: 600x600 native (fills canvas)
    Mask: positioned with negative offsets to extend beyond edges
    """
    try:
        # Load images at native resolution
        phone_back = Image.open(PHONE_BACK).convert('RGBA')
        background = Image.open(background_path).convert('RGBA')

        # HD mask dimensions (with negative offsets for extension)
        mask_x = int(HD_WIDTH * MASK_X_PERCENT / 100)  # Negative value extends left
        mask_y = int(HD_HEIGHT * MASK_Y_PERCENT / 100)  # Negative value extends up
        mask_width = int(HD_WIDTH * MASK_WIDTH_PERCENT / 100)  # Wider than canvas
        mask_height = int(HD_HEIGHT * MASK_HEIGHT_PERCENT / 100)  # Taller than canvas

        # Render SVG to exact mask dimensions
        # This preserves the internal SVG transform and positioning
        mask_rendered = render_svg_mask(MASK_SVG, mask_width, mask_height)
        if mask_rendered is None:
            return False

        # Resize background to fill entire canvas (objectFit: 'cover')
        background_resized = background.resize((HD_WIDTH, HD_HEIGHT), Image.Resampling.LANCZOS)

        # Create HD canvas
        canvas = Image.new('RGBA', (HD_WIDTH, HD_HEIGHT), (0, 0, 0, 0))

        # Layer 1: Phone back (already at native 600x600, fills canvas)
        canvas.paste(phone_back, (0, 0), phone_back)

        # Layer 2: Create alpha mask (positioned with offsets)
        full_mask = Image.new('L', (HD_WIDTH, HD_HEIGHT), 0)
        full_mask.paste(mask_rendered, (mask_x, mask_y))

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

    print('🚀 Starting Samsung S25 design mockup generation...')
    print(f'📁 Output directory: {OUTPUT_DIR}')
    print(f'📱 Phone back: {PHONE_BACK}')
    print(f'🎭 Mask SVG: {MASK_SVG}')
    print()

    # Check if required files exist
    if not os.path.exists(PHONE_BACK):
        print(f'❌ Phone back not found: {PHONE_BACK}')
        return
    if not os.path.exists(MASK_SVG):
        print(f'❌ Mask SVG not found: {MASK_SVG}')
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
    print(f'📁 All Samsung S25 design mockups saved to: {OUTPUT_DIR}')
    print(f'📊 Total mockups created: {current}')


if __name__ == '__main__':
    main()

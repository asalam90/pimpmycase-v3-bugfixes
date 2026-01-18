#!/usr/bin/env python3
"""
Create a transparent phone case overlay from the mockup image.

This script:
1. Loads the phone case mockup (IMG_9790.PNG)
2. Removes the white background
3. Creates a transparent overlay showing only the case edges and camera cutout
4. Saves it for use in the React app
"""

from PIL import Image, ImageDraw

def create_phone_overlay():
    print("📱 Creating phone case overlay...")

    # Load the original mockup image
    print("📂 Loading IMG_9790.PNG...")
    img = Image.open('IMG_9790.PNG').convert('RGBA')
    width, height = img.size
    print(f"📐 Image dimensions: {width}x{height}")

    # Get pixel data
    pixels = img.load()

    # Remove white background
    print("🎨 Removing white background...")
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # If pixel is light/white (all channels > 240), make it transparent
            if r > 240 and g > 240 and b > 240:
                pixels[x, y] = (r, g, b, 0)

    # Now we need to make the main black area transparent while keeping:
    # 1. Camera cutout and rhinestones visible
    # 2. Case edges/outline visible

    print("✂️ Creating content area mask...")

    # Define the content area (where user images go) based on measurements
    # From the image analysis:
    # - Content area is roughly centered
    # - Camera cutout is top-left corner
    # - Need to preserve case edges (about 8% margin on sides)

    # Calculate content area boundaries (in pixels)
    margin_left = int(width * 0.08)  # 8% left margin
    margin_right = int(width * 0.08)  # 8% right margin
    margin_top = int(height * 0.01)  # 1% top margin
    margin_bottom = int(height * 0.01)  # 1% bottom margin

    # Camera cutout area (top-left) - keep this opaque
    camera_left = int(width * 0.10)
    camera_right = int(width * 0.42)
    camera_top = int(height * 0.02)
    camera_bottom = int(height * 0.25)

    # Make the content area transparent
    print("🔧 Making content area transparent...")
    for y in range(height):
        if y % 100 == 0:
            print(f"   Processing row {y}/{height}...")
        for x in range(width):
            # Check if pixel is in content area (not in camera or edges)
            in_content_area = (
                x > margin_left and x < width - margin_right and
                y > margin_top and y < height - margin_bottom and
                not (x >= camera_left and x <= camera_right and y >= camera_top and y <= camera_bottom)
            )

            # If in content area and pixel is dark (part of case body)
            if in_content_area:
                r, g, b, a = pixels[x, y]
                # If it's a dark pixel (case body), make it transparent
                if r < 100 and g < 100 and b < 100 and a > 0:
                    pixels[x, y] = (r, g, b, 0)  # Make transparent

    # Final image is our modified img
    final_image = img

    # Save the overlay
    output_path = 'public/phone-case-overlay.png'
    print(f"💾 Saving overlay to {output_path}...")
    final_image.save(output_path, 'PNG')

    # Create a smaller version for web use (optimize size)
    print("🔧 Creating optimized web version...")
    target_width = 800
    target_height = int(height * (target_width / width))
    optimized = final_image.resize((target_width, target_height), Image.Resampling.LANCZOS)

    output_optimized_path = 'public/phone-case-overlay-optimized.png'
    optimized.save(output_optimized_path, 'PNG', optimize=True)

    print("✅ Phone case overlay created successfully!")
    print(f"   - Full size: {output_path} ({width}x{height})")
    print(f"   - Optimized: {output_optimized_path} ({target_width}x{target_height})")

    # Create a visualization showing the content area
    print("🎨 Creating visualization...")
    vis = img.copy()
    draw = ImageDraw.Draw(vis, 'RGBA')

    # Draw content area boundary in green
    draw.rectangle(
        [margin_left, margin_top, width - margin_right, height - margin_bottom],
        outline=(0, 255, 0, 128),
        width=10
    )

    # Draw camera area in red
    draw.rectangle(
        [camera_left, camera_top, camera_right, camera_bottom],
        outline=(255, 0, 0, 128),
        width=10
    )

    vis.save('public/phone-case-overlay-visualization.png', 'PNG')
    print("   - Visualization: public/phone-case-overlay-visualization.png")

if __name__ == '__main__':
    try:
        create_phone_overlay()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

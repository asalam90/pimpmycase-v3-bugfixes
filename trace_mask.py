#!/usr/bin/env python3
"""
Script to trace PNG masks and extract SVG path data
"""
import numpy as np
from PIL import Image
import os

def trace_mask_to_path(png_path):
    """
    Convert a PNG mask to an SVG path string
    Simple edge detection approach
    """
    try:
        # Load the image
        img = Image.open(png_path)

        # Convert to grayscale and then to binary
        img_gray = img.convert('L')
        img_array = np.array(img_gray)

        # Get dimensions
        height, width = img_array.shape

        # Find the bounding box of white pixels (mask area)
        # Assuming the mask is white and background is black/transparent
        white_pixels = np.where(img_array > 128)

        if len(white_pixels[0]) == 0:
            print(f"No white pixels found in {png_path}")
            return None

        min_y = white_pixels[0].min()
        max_y = white_pixels[0].max()
        min_x = white_pixels[1].min()
        max_x = white_pixels[1].max()

        # Create a simple rectangular path based on the mask bounds
        # This is a simplified version - for production, you'd want proper vectorization
        path = f"M{min_x},{min_y} L{max_x},{min_y} L{max_x},{max_y} L{min_x},{max_y} Z"

        return {
            'path': path,
            'viewBox': f'0 0 {width} {height}',
            'width': width,
            'height': height,
            'bounds': {'minX': int(min_x), 'maxX': int(max_x), 'minY': int(min_y), 'maxY': int(max_y)}
        }
    except Exception as e:
        print(f"Error processing {png_path}: {e}")
        return None

if __name__ == "__main__":
    masks_dir = "/home/icrop/Desktop/PerceptiaAI/Projects/pimpmycase-webstore/public/masks"

    # Process iPhone 17 Air mask
    iphone17air_path = os.path.join(masks_dir, "iphone17air-mask.png")
    print(f"\nProcessing iPhone 17 Air mask...")
    air_result = trace_mask_to_path(iphone17air_path)
    if air_result:
        print(f"iPhone 17 Air:")
        print(f"  ViewBox: {air_result['viewBox']}")
        print(f"  Dimensions: {air_result['width']}x{air_result['height']}")
        print(f"  Bounds: {air_result['bounds']}")
        print(f"  Path: {air_result['path']}")

    # Process iPhone 17 Pro Max mask
    iphone17pro_path = os.path.join(masks_dir, "iphone17promax-mask.png")
    print(f"\nProcessing iPhone 17 Pro Max mask...")
    pro_result = trace_mask_to_path(iphone17pro_path)
    if pro_result:
        print(f"iPhone 17 Pro Max:")
        print(f"  ViewBox: {pro_result['viewBox']}")
        print(f"  Dimensions: {pro_result['width']}x{pro_result['height']}")
        print(f"  Bounds: {pro_result['bounds']}")
        print(f"  Path: {pro_result['path']}")

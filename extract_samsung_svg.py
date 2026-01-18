#!/usr/bin/env python3
"""
Extract SVG path and transform from Samsung S25 SVG file
"""
import re

svg_file = "/home/icrop/Desktop/PerceptiaAI/Projects/pimpmycase-webstore/public/masks/Samsung S25, S25 plus.svg"

with open(svg_file, 'r') as f:
    content = f.read()

# Extract width and height
width_match = re.search(r'width="(\d+)"', content)
height_match = re.search(r'height="(\d+)"', content)

width = width_match.group(1) if width_match else "334"
height = height_match.group(1) if height_match else "709"

# Extract path data
path_match = re.search(r'd="([^"]+)"', content)
path_data = path_match.group(1) if path_match else ""

# Extract transform
transform_match = re.search(r'transform="([^"]+)"', content)
transform_data = transform_match.group(1) if transform_match else "translate(0,0)"

print("=" * 80)
print("Samsung S25 SVG Path Data Extracted")
print("=" * 80)
print(f"\nViewBox: 0 0 {width} {height}")
print(f"\nTransform: {transform_data}")
print(f"\nPath (length: {len(path_data)} chars):")
print("-" * 80)
print(path_data)
print("-" * 80)

print("\n\nAdd this to CLIP_PATH_DATA in phoneCaseLayout.js:")
print("=" * 80)
print(f"  samsungs25: {{")
print(f"    viewBox: '0 0 {width} {height}',")
print(f"    path: '{path_data}',")
print(f"    transform: '{transform_data}'")
print(f"  }}")
print("=" * 80)

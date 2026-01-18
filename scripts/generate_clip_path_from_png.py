#!/usr/bin/env python3
"""Generate clip-path / mask polygons from a phone case PNG overlay.

The script assumes the PNG has a transparent background and an opaque case body.
It removes the camera module (using either automatic detection or manual bounds),
shrinks the safe zone by a configurable edge margin, then samples the top/bottom
contour to produce a CSS `polygon(...)` and an SVG path.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

from PIL import Image, ImageFilter

Polygon = List[Tuple[float, float]]


def build_mask(
    image: Image.Image,
    alpha_threshold: int,
    camera_box: Tuple[int, int, int, int] | None,
    edge_margin_px: int,
) -> Image.Image:
    """Return an eroded binary mask (255 = printable, 0 = excluded)."""

    w, h = image.size
    mask = Image.new('L', (w, h), 0)
    src_pixels = image.load()

    for y in range(h):
        for x in range(w):
            if src_pixels[x, y][3] > alpha_threshold:
                mask.putpixel((x, y), 255)

    if camera_box:
        x0, x1, y0, y1 = camera_box
        for x in range(max(0, x0), min(w, x1 + 1)):
            for y in range(max(0, y0), min(h, y1 + 1)):
                mask.putpixel((x, y), 0)

    if edge_margin_px > 0:
        size = edge_margin_px * 2 + 1
        mask = mask.filter(ImageFilter.MinFilter(size))

    return mask


def detect_camera_box(
    image: Image.Image,
    alpha_threshold: int,
    camera_threshold: int,
    camera_max_y_ratio: float,
) -> Tuple[int, int, int, int] | None:
    w, h = image.size
    limit_y = int(h * camera_max_y_ratio)
    pixels = image.load()
    candidates: List[Tuple[int, int]] = []

    for y in range(limit_y):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > alpha_threshold and (r + g + b) / 3 <= camera_threshold:
                candidates.append((x, y))

    if not candidates:
        return None

    xs, ys = zip(*candidates)
    return min(xs), max(xs), min(ys), max(ys)


def override_to_pixels(
    override: Sequence[float] | None,
    width: int,
    height: int,
) -> Tuple[int, int, int, int] | None:
    if not override:
        return None
    if len(override) != 4:
        raise SystemExit('Camera override must contain four percentage values.')
    min_x, max_x, min_y, max_y = override
    return (
        int(round(min_x / 100 * (width - 1))),
        int(round(max_x / 100 * (width - 1))),
        int(round(min_y / 100 * (height - 1))),
        int(round(max_y / 100 * (height - 1))),
    )


def load_safe_polygon(
    image_path: Path,
    *,
    epsilon: float,
    step: int,
    alpha_threshold: int,
    camera_threshold: int,
    camera_max_y_ratio: float,
    camera_override: Sequence[float] | None,
    edge_margin_px: int,
) -> Polygon:
    image = Image.open(image_path).convert('RGBA')
    w, h = image.size

    camera_box = override_to_pixels(camera_override, w, h)
    if camera_box is None:
        camera_box = detect_camera_box(image, alpha_threshold, camera_threshold, camera_max_y_ratio)

    mask = build_mask(image, alpha_threshold, camera_box, edge_margin_px)
    mask_pixels = mask.load()

    top_points: Polygon = []
    bottom_points: Polygon = []

    for x in range(0, w, step):
        top_y = None
        bottom_y = None
        for y in range(h):
            if mask_pixels[x, y] > 0:
                top_y = y
                break
        for y in range(h - 1, -1, -1):
            if mask_pixels[x, y] > 0:
                bottom_y = y
                break
        if top_y is None or bottom_y is None or bottom_y < top_y:
            continue

        x_percent = (x / (w - 1)) * 100
        top_points.append((x_percent, (top_y / (h - 1)) * 100))
        bottom_points.append((x_percent, (bottom_y / (h - 1)) * 100))

    if not top_points:
        raise SystemExit('No printable pixels detected – check PNG/thresholds.')

    polygon = top_points + list(reversed(bottom_points))
    return rdp(polygon, epsilon)


def rdp(points: Polygon, epsilon: float) -> Polygon:
    if len(points) < 3:
        return points

    start = points[0]
    end = points[-1]

    def perp_distance(point, line_start, line_end):
        (x0, y0), (x1, y1) = line_start, line_end
        (x, y) = point
        dx = x1 - x0
        dy = y1 - y0
        if dx == dy == 0:
            return ((x - x0) ** 2 + (y - y0) ** 2) ** 0.5
        return abs(dy * x - dx * y + x1 * y0 - y1 * x0) / ((dx ** 2 + dy ** 2) ** 0.5)

    max_dist = -1
    index = -1
    for i in range(1, len(points) - 1):
        dist = perp_distance(points[i], start, end)
        if dist > max_dist:
            max_dist = dist
            index = i

    if max_dist > epsilon:
        left = rdp(points[: index + 1], epsilon)
        right = rdp(points[index:], epsilon)
        return left[:-1] + right
    return [start, end]


def polygon_to_clip_path(points: Polygon) -> str:
    return 'polygon(' + ', '.join(f'{x:.2f}% {y:.2f}%' for x, y in points) + ')'


def polygon_to_svg_path(points: Polygon, view_w: int, view_h: int) -> str:
    def to_abs(p):
        return (p[0] / 100 * view_w, p[1] / 100 * view_h)

    abs_points = [to_abs(p) for p in points]
    parts = [f'M {abs_points[0][0]:.2f} {abs_points[0][1]:.2f}']
    for x, y in abs_points[1:]:
        parts.append(f'L {x:.2f} {y:.2f}')
    parts.append('Z')
    return ' '.join(parts)


def parse_override(args: Iterable[str]) -> Sequence[float] | None:
    values = list(args)
    if not values:
        return None
    return [float(value) for value in values]


def main(argv: Sequence[str]) -> None:
    if len(argv) < 1:
        print('Usage: python scripts/generate_clip_path_from_png.py <png_path> [epsilon] [step] [alpha_threshold] [camera_threshold] [camera_max_y_ratio] [edge_margin_px] [camera_min_x% camera_max_x% camera_min_y% camera_max_y%]')
        return

    image_path = Path(argv[0])
    epsilon = float(argv[1]) if len(argv) > 1 else 0.5
    step = int(argv[2]) if len(argv) > 2 else 2
    alpha_threshold = int(argv[3]) if len(argv) > 3 else 1
    camera_threshold = int(argv[4]) if len(argv) > 4 else 20
    camera_ratio = float(argv[5]) if len(argv) > 5 else 0.4
    edge_margin_px = int(argv[6]) if len(argv) > 6 else 6
    camera_override = parse_override(argv[7:11]) if len(argv) > 10 else parse_override(argv[7:])

    polygon = load_safe_polygon(
        image_path,
        epsilon=epsilon,
        step=step,
        alpha_threshold=alpha_threshold,
        camera_threshold=camera_threshold,
        camera_max_y_ratio=camera_ratio,
        camera_override=camera_override,
        edge_margin_px=edge_margin_px,
    )

    clip_path = polygon_to_clip_path(polygon)
    svg_path = polygon_to_svg_path(polygon, 1000, 1000)

    print('/* clip-path */')
    print(clip_path)
    print('\n/* SVG path (viewBox 0 0 1000 1000) */')
    print(svg_path)


if __name__ == '__main__':
    main(sys.argv[1:])

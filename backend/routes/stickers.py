"""Sticker API routes - serving stickers from Cloudflare R2"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from typing import List, Dict, Optional
import logging
from backend.services.r2_service import get_r2_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/stickers/categories")
async def get_sticker_categories():
    """Get list of all sticker categories"""
    try:
        r2_service = get_r2_service()
        categories = r2_service.list_sticker_categories()
        return {
            "status": "success",
            "categories": categories,
            "count": len(categories)
        }
    except Exception as e:
        logger.error(f"Error fetching sticker categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch sticker categories")


@router.get("/api/stickers/category/{category}")
async def get_stickers_by_category(category: str):
    """Get all stickers in a specific category"""
    try:
        r2_service = get_r2_service()
        stickers = r2_service.list_stickers_in_category(category)

        # Generate presigned URLs for each sticker
        stickers_with_urls = []
        for sticker in stickers:
            url = r2_service.get_sticker_url(sticker['key'])
            if url:
                stickers_with_urls.append({
                    **sticker,
                    'url': url
                })

        return {
            "status": "success",
            "category": category,
            "stickers": stickers_with_urls,
            "count": len(stickers_with_urls)
        }
    except Exception as e:
        logger.error(f"Error fetching stickers for category {category}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stickers for category: {category}")


@router.get("/api/stickers/image/{category}/{filename:path}")
async def get_sticker_image(category: str, filename: str):
    """Get a specific sticker image directly from R2"""
    try:
        r2_service = get_r2_service()

        # Construct the full key with Stickers/ prefix
        key = f"Stickers/{category}/{filename}"

        # Check if sticker exists
        if not r2_service.check_sticker_exists(key):
            raise HTTPException(status_code=404, detail="Sticker not found")

        # Get the image data
        image_data = r2_service.get_sticker_object(key)

        if not image_data:
            raise HTTPException(status_code=500, detail="Failed to retrieve sticker")

        # Determine content type based on file extension
        content_type = "image/png"
        if filename.lower().endswith('.webp'):
            content_type = "image/webp"
        elif filename.lower().endswith(('.jpg', '.jpeg')):
            content_type = "image/jpeg"
        elif filename.lower().endswith('.gif'):
            content_type = "image/gif"

        return Response(
            content=image_data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
                "Access-Control-Allow-Origin": "*"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving sticker {category}/{filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to serve sticker image")


@router.get("/api/stickers/url/{category}/{filename:path}")
async def get_sticker_url(category: str, filename: str, expires_in: int = 3600):
    """Get a presigned URL for a specific sticker (valid for specified duration)"""
    try:
        r2_service = get_r2_service()

        # Construct the full key with Stickers/ prefix
        key = f"Stickers/{category}/{filename}"

        # Check if sticker exists
        if not r2_service.check_sticker_exists(key):
            raise HTTPException(status_code=404, detail="Sticker not found")

        # Generate presigned URL
        url = r2_service.get_sticker_url(key, expires_in=expires_in)

        if not url:
            raise HTTPException(status_code=500, detail="Failed to generate sticker URL")

        return {
            "status": "success",
            "url": url,
            "expires_in": expires_in,
            "key": key
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating URL for sticker {category}/{filename}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate sticker URL")


@router.get("/api/stickers/all")
async def get_all_stickers():
    """Get all stickers organized by category"""
    try:
        r2_service = get_r2_service()
        categories = r2_service.list_sticker_categories()

        all_stickers = {}
        total_count = 0

        for category in categories:
            stickers = r2_service.list_stickers_in_category(category)

            # Generate presigned URLs for each sticker
            stickers_with_urls = []
            for sticker in stickers:
                url = r2_service.get_sticker_url(sticker['key'])
                if url:
                    stickers_with_urls.append({
                        **sticker,
                        'url': url
                    })

            all_stickers[category] = stickers_with_urls
            total_count += len(stickers_with_urls)

        return {
            "status": "success",
            "stickers": all_stickers,
            "total_count": total_count,
            "category_count": len(categories)
        }

    except Exception as e:
        logger.error(f"Error fetching all stickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch all stickers")

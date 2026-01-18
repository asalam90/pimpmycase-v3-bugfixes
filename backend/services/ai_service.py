"""AI service for image generation using Google's Nano Banana Pro"""

import base64
from fastapi import HTTPException
from typing import Optional
from backend.config.settings import GOOGLE_API_KEY
from google import genai
from google.genai import types

def get_google_client():
    """Initialize Google GenAI client"""
    api_key = GOOGLE_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Google GenAI client: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize Google AI client: {str(e)}")

async def generate_image_nano_banana_pro(
    prompt: str,
    reference_image: Optional[str] = None,
    size: str = "1024x1536"
) -> dict:
    """
    Generate image using Google's Nano Banana Pro (gemini-3-pro-image-preview)

    Args:
        prompt: Text prompt for image generation
        reference_image: Optional base64 data URL of reference image for editing
        size: Image size - "1024x1024", "1024x1536", "1536x1024", or "auto"

    Returns:
        dict with success, image_data (base64), and mime_type
    """
    client = get_google_client()

    try:
        # Configure generation settings - Gemini uses simple pixel dimensions
        config = types.GenerateContentConfig(
            response_modalities=["IMAGE"]
        )

        # Build contents based on whether we have a reference image
        if reference_image:
            # Image editing mode - combine reference image with prompt
            print(f"🎨 Using Nano Banana Pro for image transformation with prompt: {prompt}")

            # Extract base64 data and convert to bytes
            if ',' in reference_image:
                _, base64_data = reference_image.split(',', 1)
            else:
                base64_data = reference_image

            image_bytes = base64.b64decode(base64_data)

            # Create content with both image and text
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=image_bytes, mime_type='image/png'),
                        types.Part.from_text(text=prompt)
                    ]
                )
            ]

            print(f"📸 Reference image size: {len(image_bytes)} bytes")

        else:
            # Text-to-image generation
            print(f"🎨 Using Nano Banana Pro for text-to-image with prompt: {prompt}")
            contents = [prompt]

        # Generate image
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=contents,
            config=config
        )

        # Extract image from response
        for part in response.parts:
            if part.inline_data is not None:
                print(f"✅ Nano Banana Pro generation completed successfully")

                # Debug: Check what type inline_data.data is
                print(f"📊 Debug - inline_data.data type: {type(part.inline_data.data)}")
                print(f"📊 Debug - inline_data.data length: {len(part.inline_data.data)}")
                print(f"📊 Debug - First 100 chars: {str(part.inline_data.data)[:100]}")

                # inline_data.data should already be bytes from the API
                # We need to return it as base64 string for save_generated_image
                import base64 as b64

                # If it's already a string (base64), use it directly
                # If it's bytes, encode it to base64 string
                if isinstance(part.inline_data.data, bytes):
                    print(f"📊 Debug - Data is bytes, encoding to base64 string")
                    image_base64 = b64.b64encode(part.inline_data.data).decode('utf-8')
                else:
                    print(f"📊 Debug - Data is already string")
                    image_base64 = part.inline_data.data

                print(f"📊 Debug - Final base64 length: {len(image_base64)}")

                return {
                    "success": True,
                    "image_data": image_base64,  # base64 string
                    "mime_type": part.inline_data.mime_type
                }

        # No image found in response
        print(f"❌ No image data in Nano Banana Pro response")
        return {
            "success": False,
            "error": "No image generated in response"
        }

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Nano Banana Pro generation failed: {error_msg}")

        # Provide helpful error messages for common issues
        if "429" in error_msg or "quota" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Google AI API rate limit exceeded. Please try again in a few moments."
            )
        elif "401" in error_msg or "authentication" in error_msg.lower():
            raise HTTPException(
                status_code=500,
                detail="Google AI API authentication failed. Please check API key configuration."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"AI image generation failed: {error_msg}"
            )

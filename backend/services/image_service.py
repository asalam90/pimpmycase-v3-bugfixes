"""Image processing service for handling image operations"""

import base64
import io
import time
import uuid
from pathlib import Path
from PIL import Image
from fastapi import HTTPException
from backend.config.settings import GENERATED_IMAGES_DIR, MAX_IMAGE_DIMENSION

def ensure_directories():
    """Ensure generated images directory exists"""
    generated_dir = Path(GENERATED_IMAGES_DIR)
    generated_dir.mkdir(exist_ok=True)
    return generated_dir

def convert_image_for_api(image_file):
    """Convert uploaded image to base64 format for OpenAI API"""
    try:
        img = Image.open(image_file)
        
        # Convert to RGB if necessary
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        
        # Resize if too large
        width, height = img.size
        max_dimension = MAX_IMAGE_DIMENSION
        
        if width > max_dimension or height > max_dimension:
            if width > height:
                new_height = int((height * max_dimension) / width)
                new_width = max_dimension
            else:
                new_width = int((width * max_dimension) / height)
                new_height = max_dimension
            
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to base64
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG', optimize=True)
        img_buffer.seek(0)
        
        base64_data = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{base64_data}"
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

def save_generated_image(base64_data: str, template_id: str, session_id: str = None,
                        image_type: str = "generated") -> tuple:
    """Save generated image and return path and filename with session-based naming

    Args:
        base64_data: Base64 encoded image data
        template_id: Template identifier
        session_id: Optional session/order ID for unique naming
        image_type: Type of image (generated, final, uploaded)

    Returns:
        tuple: (file_path, filename)
    """
    try:
        print(f"🔍 save_generated_image called:")
        print(f"   - template_id: {template_id}")
        print(f"   - session_id: {session_id}")
        print(f"   - image_type: {image_type}")
        print(f"   - base64_data length: {len(base64_data)} chars")
        print(f"   - base64_data preview: {base64_data[:100]}...")

        image_bytes = base64.b64decode(base64_data)
        print(f"   - Decoded to {len(image_bytes)} bytes")

        # Validate that we have actual image data
        if len(image_bytes) < 1000:
            print(f"⚠️ WARNING: Image size is suspiciously small ({len(image_bytes)} bytes)")

        timestamp = int(time.time())
        random_id = str(uuid.uuid4())[:8]

        # Create session-based filename if session_id provided
        if session_id:
            filename = f"order-{session_id}-{image_type}-{timestamp}-{random_id}.png"
        else:
            # Fallback to original naming for backward compatibility
            filename = f"{template_id}-{timestamp}-{random_id}.png"

        generated_dir = ensure_directories()
        file_path = generated_dir / filename

        print(f"   - Saving to: {file_path}")

        with open(file_path, 'wb') as f:
            bytes_written = f.write(image_bytes)

        print(f"✅ Image saved successfully:")
        print(f"   - Filename: {filename}")
        print(f"   - Bytes written: {bytes_written}")
        print(f"   - File exists: {file_path.exists()}")
        if file_path.exists():
            actual_size = file_path.stat().st_size
            print(f"   - Actual file size on disk: {actual_size} bytes")
            if actual_size != len(image_bytes):
                print(f"⚠️ WARNING: File size mismatch! Expected {len(image_bytes)}, got {actual_size}")

            # Verify the image is valid by trying to open it
            try:
                with Image.open(file_path) as img:
                    print(f"   - Image validation: ✅ Valid PNG")
                    print(f"   - Image dimensions: {img.width}x{img.height}")
                    print(f"   - Image mode: {img.mode}")
            except Exception as img_error:
                print(f"   - Image validation: ❌ FAILED - {img_error}")
                print(f"⚠️ WARNING: Saved file is not a valid image!")

        return str(file_path), filename

    except Exception as e:
        print(f"❌ Error saving image: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

def get_image_public_url(filename: str, partner_type: str = "end_user", expiry_hours: int = None) -> str:
    """Get secure public URL for accessing stored image with token"""
    from backend.services.file_service import generate_secure_image_url
    
    # Generate secure URL with appropriate token for the partner type
    return generate_secure_image_url(
        filename=filename, 
        partner_type=partner_type,
        custom_expiry_hours=expiry_hours
    )

def get_image_url_for_chinese_api(filename: str) -> str:
    """Get secure URL specifically for Chinese API access with 48-hour expiry"""
    return get_image_public_url(filename, partner_type="chinese_manufacturing", expiry_hours=48)

def get_image_url_for_user(filename: str) -> str:
    """Get secure URL for end user access with 1-hour expiry"""
    return get_image_public_url(filename, partner_type="end_user", expiry_hours=1)
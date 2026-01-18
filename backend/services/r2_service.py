"""Cloudflare R2 Storage Service"""

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import os
from typing import Optional, List, Dict
import logging
from io import BytesIO

logger = logging.getLogger(__name__)


class R2Service:
    """Service for interacting with Cloudflare R2 storage"""

    def __init__(self):
        """Initialize R2 client with credentials from environment"""
        self.access_key_id = os.getenv('R2_ACCESS_KEY_ID')
        self.secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
        self.endpoint_url = os.getenv('R2_ENDPOINT_URL')
        self.bucket_name = os.getenv('R2_BUCKET_NAME', 'pimpmycase-newstickers')

        if not all([self.access_key_id, self.secret_access_key, self.endpoint_url]):
            logger.error("R2 credentials not configured properly")
            raise ValueError("R2 credentials missing in environment variables")

        # Initialize S3-compatible client for R2
        self.client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'  # R2 uses 'auto' for region
        )

        logger.info(f"R2 Service initialized for bucket: {self.bucket_name}")

    def list_sticker_categories(self) -> List[str]:
        """List all sticker category folders in R2"""
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Delimiter='/'
            )

            categories = []
            if 'CommonPrefixes' in response:
                for prefix in response['CommonPrefixes']:
                    category = prefix['Prefix'].rstrip('/')
                    categories.append(category)

            logger.info(f"Found {len(categories)} sticker categories")
            return categories

        except ClientError as e:
            logger.error(f"Error listing sticker categories: {str(e)}")
            return []

    def list_stickers_in_category(self, category: str) -> List[Dict[str, str]]:
        """List all stickers in a specific category folder"""
        try:
            # List all objects in the category folder
            response = self.client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{category}/"
            )

            stickers = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    # Skip folder markers and non-image files
                    if key.endswith('/') or not self._is_image_file(key):
                        continue

                    # Extract filename and check if it's in a subfolder
                    parts = key.split('/')
                    filename = parts[-1]
                    subfolder = parts[-2] if len(parts) > 2 else None

                    stickers.append({
                        'key': key,
                        'filename': filename,
                        'subfolder': subfolder,
                        'size': obj['Size'],
                        'last_modified': obj['LastModified'].isoformat()
                    })

            logger.info(f"Found {len(stickers)} stickers in category {category}")
            return stickers

        except ClientError as e:
            logger.error(f"Error listing stickers in category {category}: {str(e)}")
            return []

    def get_sticker_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        """Generate a presigned URL for accessing a sticker"""
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expires_in
            )
            return url

        except ClientError as e:
            logger.error(f"Error generating presigned URL for {key}: {str(e)}")
            return None

    def get_sticker_object(self, key: str) -> Optional[bytes]:
        """Get sticker image data directly from R2"""
        try:
            response = self.client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return response['Body'].read()

        except ClientError as e:
            logger.error(f"Error getting sticker object {key}: {str(e)}")
            return None

    def check_sticker_exists(self, key: str) -> bool:
        """Check if a sticker exists in R2"""
        try:
            self.client.head_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return True

        except ClientError:
            return False

    def _is_image_file(self, filename: str) -> bool:
        """Check if file is an image based on extension"""
        image_extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
        return any(filename.lower().endswith(ext) for ext in image_extensions)

    def upload_sticker(self, key: str, file_data: bytes, content_type: str = 'image/png') -> bool:
        """Upload a sticker to R2"""
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_data,
                ContentType=content_type
            )
            logger.info(f"Successfully uploaded sticker: {key}")
            return True

        except ClientError as e:
            logger.error(f"Error uploading sticker {key}: {str(e)}")
            return False


# Global R2 service instance
_r2_service: Optional[R2Service] = None


def get_r2_service() -> R2Service:
    """Get or create the global R2 service instance"""
    global _r2_service
    if _r2_service is None:
        _r2_service = R2Service()
    return _r2_service

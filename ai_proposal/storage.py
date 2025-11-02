"""Cloud storage integration for proposal files."""

import logging
from pathlib import Path
from typing import Optional
from .config import settings


logger = logging.getLogger(__name__)


class StorageManager:
    """Manages proposal file storage (local and cloud)."""
    
    def __init__(self):
        self.s3_enabled = self._check_s3_config()
        if self.s3_enabled:
            self._init_s3()
    
    def _check_s3_config(self) -> bool:
        """Check if S3 configuration is available."""
        import os
        bucket = os.getenv('AWS_S3_BUCKET')
        region = os.getenv('AWS_REGION')
        return bool(bucket and region)
    
    def _init_s3(self):
        """Initialize S3 client."""
        try:
            import boto3
            import os
            
            self.s3_client = boto3.client(
                's3',
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
            self.bucket_name = os.getenv('AWS_S3_BUCKET')
            logger.info(f"S3 storage enabled: {self.bucket_name}")
        except ImportError:
            logger.warning("boto3 not installed, S3 upload disabled")
            self.s3_enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize S3: {e}")
            self.s3_enabled = False
    
    def upload_to_s3(self, local_path: str, proposal_id: str) -> Optional[str]:
        """
        Upload proposal to S3.
        
        Args:
            local_path: Path to local file
            proposal_id: Proposal UUID
        
        Returns:
            S3 URL if successful, None otherwise
        """
        if not self.s3_enabled:
            logger.debug("S3 not enabled, skipping upload")
            return None
        
        try:
            file_path = Path(local_path)
            if not file_path.exists():
                logger.error(f"File not found: {local_path}")
                return None
            
            # S3 key (path in bucket)
            s3_key = f"proposals/{proposal_id}.md"
            
            # Upload file
            self.s3_client.upload_file(
                str(file_path),
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': 'text/markdown',
                    'ContentDisposition': f'attachment; filename="proposal_{proposal_id}.md"'
                }
            )
            
            # Generate URL
            s3_url = f"https://{self.bucket_name}.s3.{self.s3_client.meta.region_name}.amazonaws.com/{s3_key}"
            
            logger.info(f"Uploaded to S3: {s3_url}")
            return s3_url
            
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            return None
    
    def generate_presigned_url(self, proposal_id: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for secure, temporary access.
        
        Args:
            proposal_id: Proposal UUID
            expiration: URL validity in seconds (default 1 hour)
        
        Returns:
            Presigned URL if successful
        """
        if not self.s3_enabled:
            return None
        
        try:
            s3_key = f"proposals/{proposal_id}.md"
            
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            
            return url
            
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None


# Global instance
storage_manager = StorageManager()


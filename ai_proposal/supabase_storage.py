"""Supabase Storage integration for proposal files."""

import logging
from pathlib import Path
from typing import Optional


logger = logging.getLogger(__name__)


class SupabaseStorageManager:
    """Manages proposal files in Supabase Storage."""
    
    def __init__(self):
        self.enabled = self._check_supabase_config()
        if self.enabled:
            self._init_supabase()
    
    def _check_supabase_config(self) -> bool:
        """Check if Supabase configuration is available."""
        import os
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')
        return bool(url and key)
    
    def _init_supabase(self):
        """Initialize Supabase client."""
        try:
            from supabase import create_client
            import os
            
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_KEY')
            
            self.client = create_client(supabase_url, supabase_key)
            self.bucket_name = os.getenv('SUPABASE_BUCKET', 'proposals')
            
            # Ensure bucket exists
            try:
                self.client.storage.get_bucket(self.bucket_name)
                logger.info(f"Supabase storage enabled: {self.bucket_name}")
            except:
                # Try to create bucket
                self.client.storage.create_bucket(self.bucket_name, options={"public": False})
                logger.info(f"Created Supabase bucket: {self.bucket_name}")
                
        except ImportError:
            logger.warning("supabase-py not installed, Supabase storage disabled")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize Supabase storage: {e}")
            self.enabled = False
    
    def upload_to_supabase(self, local_path: str, proposal_id: str) -> Optional[str]:
        """
        Upload proposal to Supabase Storage.
        
        Args:
            local_path: Path to local file
            proposal_id: Proposal UUID
        
        Returns:
            Public URL if successful
        """
        if not self.enabled:
            logger.debug("Supabase storage not enabled")
            return None
        
        try:
            file_path = Path(local_path)
            if not file_path.exists():
                logger.error(f"File not found: {local_path}")
                return None
            
            # Read file
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Upload to Supabase
            storage_path = f"proposals/{proposal_id}.md"
            
            result = self.client.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": "text/markdown"}
            )
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            logger.info(f"Uploaded to Supabase: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}")
            return None
    
    def get_signed_url(self, proposal_id: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a signed URL for secure access.
        
        Args:
            proposal_id: Proposal UUID
            expiration: URL validity in seconds
        
        Returns:
            Signed URL
        """
        if not self.enabled:
            return None
        
        try:
            storage_path = f"proposals/{proposal_id}.md"
            
            result = self.client.storage.from_(self.bucket_name).create_signed_url(
                path=storage_path,
                expires_in=expiration
            )
            
            return result.get('signedURL')
            
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            return None


# Global instance
supabase_storage = SupabaseStorageManager()


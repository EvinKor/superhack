"""Configuration management for AI Proposal Assistant."""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # AWS Configuration (optional)
    SM_ENDPOINT_NAME: Optional[str] = None
    BEDROCK_MODEL_ID: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # Data paths
    CATALOG_PATH: str = "data/service_catalog.csv"
    SLA_PATH: str = "data/sla_templates.csv"
    TIERS_PATH: str = "data/pricing_tiers.csv"
    
    # Output configuration
    OUTPUT_DIR: str = "output/proposals"
    TEMPLATES_DIR: str = "templates"
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Feature flags
    ENABLE_ML_SELECTION: bool = True
    ENABLE_LLM_POLISH: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env (shared with Node.js backend)


# Global settings instance
settings = Settings()


def ensure_directories():
    """Ensure required directories exist."""
    Path(settings.OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    Path("data").mkdir(exist_ok=True)
    Path(settings.TEMPLATES_DIR).mkdir(exist_ok=True)


def validate_aws_config() -> dict:
    """Validate AWS configuration and return capabilities."""
    capabilities = {
        "sagemaker_available": bool(settings.SM_ENDPOINT_NAME),
        "bedrock_available": bool(settings.BEDROCK_MODEL_ID)
    }
    return capabilities


# Initialize directories on import
ensure_directories()


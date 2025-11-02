"""Pydantic models for API contracts and data validation."""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum


class PricingTierID(str, Enum):
    """Available pricing tiers."""
    TIER_STARTER = "TIER_STARTER"
    TIER_STANDARD = "TIER_STANDARD"
    TIER_PREMIUM = "TIER_PREMIUM"
    TIER_ENTERPRISE = "TIER_ENTERPRISE"


class SLAID(str, Enum):
    """Available SLA levels."""
    SLA_BRONZE = "SLA_BRONZE"
    SLA_SILVER = "SLA_SILVER"
    SLA_GOLD = "SLA_GOLD"
    SLA_PLATINUM = "SLA_PLATINUM"


class GenerateRequest(BaseModel):
    """Request model for proposal generation."""
    client_name: str = Field(..., min_length=1, max_length=200)
    requirements: str = Field(..., min_length=10, max_length=5000)
    pricing_tier_id: str = Field(..., description="Pricing tier identifier")
    sla_id: str = Field(..., description="SLA template identifier")
    quantities: Dict[str, int] = Field(default_factory=dict, description="Service-specific quantity overrides")
    use_llm: bool = Field(default=False, description="Enable LLM-based content polishing")
    
    @validator('requirements')
    def validate_requirements(cls, v):
        """Validate requirements text for safety."""
        # Basic prompt injection prevention
        dangerous_patterns = ['<script>', 'javascript:', 'onerror=']
        v_lower = v.lower()
        for pattern in dangerous_patterns:
            if pattern in v_lower:
                raise ValueError(f"Invalid content detected in requirements")
        return v
    
    @validator('quantities')
    def validate_quantities(cls, v):
        """Ensure quantities are positive."""
        for service_id, qty in v.items():
            if qty < 0:
                raise ValueError(f"Quantity for {service_id} must be positive")
        return v


class BOMRow(BaseModel):
    """Bill of Materials row."""
    service_id: str
    service_name: str
    unit: str
    quantity: int
    unit_price: float
    extended: float
    category: Optional[str] = None


class SLAInfo(BaseModel):
    """SLA information."""
    sla_id: str
    name: str
    response_time: str
    uptime_guarantee: str
    price_multiplier: float
    support_hours: str


class TierInfo(BaseModel):
    """Pricing tier information."""
    tier_id: str
    name: str
    base_multiplier: float
    min_monthly: Optional[float] = None
    max_users: Optional[int] = None


class GenerateResponse(BaseModel):
    """Response model for generated proposal."""
    proposal_id: str
    summary: str
    bom: List[BOMRow]
    subtotal_base: float
    subtotal_tiered: float
    total_price: float
    sla: SLAInfo
    tier: TierInfo
    file_path: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    client_name: str


class ServiceCatalogItem(BaseModel):
    """Service catalog entry."""
    service_id: str
    service_name: str
    category: str
    description: str
    unit: str
    unit_price: float
    keywords: List[str]
    default_quantity: int = 1


class SLATemplate(BaseModel):
    """SLA template entry."""
    sla_id: str
    name: str
    response_time: str
    uptime_guarantee: str
    price_multiplier: float
    support_hours: str


class PricingTier(BaseModel):
    """Pricing tier entry."""
    tier_id: str
    name: str
    base_multiplier: float
    min_monthly: Optional[float] = None
    max_users: Optional[int] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    capabilities: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)


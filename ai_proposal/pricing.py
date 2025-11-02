"""Pricing calculations with tier and SLA multipliers."""

import logging
from typing import List, Tuple
from .models import BOMRow, PricingTier, SLATemplate


logger = logging.getLogger(__name__)


def compute_totals(
    bom: List[BOMRow],
    tier: PricingTier,
    sla: SLATemplate
) -> Tuple[float, float, float]:
    """
    Compute pricing totals with tier and SLA multipliers.
    
    Args:
        bom: Bill of Materials
        tier: Pricing tier
        sla: SLA template
    
    Returns:
        Tuple of (subtotal_base, subtotal_tiered, total_price)
    """
    # Base subtotal from BOM
    subtotal_base = round(sum(row.extended for row in bom), 2)
    
    # Apply tier multiplier
    subtotal_tiered = round(subtotal_base * tier.base_multiplier, 2)
    
    # Apply SLA multiplier
    total_price = round(subtotal_tiered * sla.price_multiplier, 2)
    
    # Ensure minimum monthly if specified
    if tier.min_monthly and total_price < tier.min_monthly:
        logger.info(f"Applying minimum monthly: ${tier.min_monthly}")
        total_price = tier.min_monthly
    
    logger.info(
        f"Pricing: Base=${subtotal_base}, "
        f"Tiered=${subtotal_tiered} (×{tier.base_multiplier}), "
        f"Final=${total_price} (×{sla.price_multiplier})"
    )
    
    return subtotal_base, subtotal_tiered, total_price


def apply_margin(price: float, margin_percent: float = 15.0) -> float:
    """
    Apply profit margin to a price.
    
    Args:
        price: Base price
        margin_percent: Margin percentage (default 15%)
    
    Returns:
        Price with margin
    """
    return round(price * (1 + margin_percent / 100), 2)


def calculate_monthly_recurring(total_price: float, one_time_fees: float = 0) -> float:
    """
    Calculate monthly recurring revenue (MRR).
    
    Args:
        total_price: Total monthly price
        one_time_fees: One-time setup/implementation fees
    
    Returns:
        Monthly recurring amount
    """
    return round(total_price - one_time_fees, 2)


def format_price(price: float) -> str:
    """Format price for display."""
    return f"${price:,.2f}"


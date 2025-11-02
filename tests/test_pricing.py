"""Tests for pricing calculations."""

import pytest
from ai_proposal.pricing import compute_totals, apply_margin, format_price
from ai_proposal.models import BOMRow, PricingTier, SLATemplate


def test_compute_totals_basic():
    """Test basic total calculation with tier and SLA multipliers."""
    bom = [
        BOMRow(
            service_id="S001",
            service_name="Monitoring",
            unit="Device",
            quantity=50,
            unit_price=25.0,
            extended=1250.0
        ),
        BOMRow(
            service_id="S007",
            service_name="Help Desk",
            unit="User",
            quantity=100,
            unit_price=12.0,
            extended=1200.0
        )
    ]
    
    tier = PricingTier(
        tier_id="TIER_STANDARD",
        name="Standard",
        base_multiplier=0.95,
        min_monthly=2500.0
    )
    
    sla = SLATemplate(
        sla_id="SLA_GOLD",
        name="Gold",
        response_time="1 hour",
        uptime_guarantee="99.9%",
        price_multiplier=1.30,
        support_hours="24x7"
    )
    
    base, tiered, total = compute_totals(bom, tier, sla)
    
    assert base == 2450.00  # 1250 + 1200
    assert tiered == 2327.50  # 2450 * 0.95
    assert total == 3025.75  # 2327.50 * 1.30


def test_compute_totals_with_minimum():
    """Test that minimum monthly is enforced."""
    bom = [
        BOMRow(
            service_id="S001",
            service_name="Test Service",
            unit="Unit",
            quantity=10,
            unit_price=10.0,
            extended=100.0
        )
    ]
    
    tier = PricingTier(
        tier_id="TIER_ENTERPRISE",
        name="Enterprise",
        base_multiplier=0.85,
        min_monthly=5000.0
    )
    
    sla = SLATemplate(
        sla_id="SLA_BRONZE",
        name="Bronze",
        response_time="4 hours",
        uptime_guarantee="99.0%",
        price_multiplier=1.0,
        support_hours="8x5"
    )
    
    base, tiered, total = compute_totals(bom, tier, sla)
    
    assert base == 100.00
    assert tiered == 85.00  # 100 * 0.85
    assert total == 5000.00  # Minimum enforced


def test_apply_margin():
    """Test profit margin application."""
    assert apply_margin(1000.0, 15.0) == 1150.00
    assert apply_margin(2500.0, 20.0) == 3000.00
    assert apply_margin(100.0, 10.0) == 110.00


def test_format_price():
    """Test price formatting."""
    assert format_price(1234.56) == "$1,234.56"
    assert format_price(1000000.00) == "$1,000,000.00"
    assert format_price(99.99) == "$99.99"


def test_multiple_services_pricing():
    """Test pricing with multiple services of different categories."""
    bom = [
        BOMRow(service_id="S001", service_name="Monitoring", unit="Device", 
               quantity=50, unit_price=25.0, extended=1250.0),
        BOMRow(service_id="S002", service_name="Patching", unit="Endpoint", 
               quantity=50, unit_price=8.5, extended=425.0),
        BOMRow(service_id="S003", service_name="SIEM", unit="IP", 
               quantity=20, unit_price=150.0, extended=3000.0),
        BOMRow(service_id="S007", service_name="Help Desk", unit="User", 
               quantity=120, unit_price=12.0, extended=1440.0),
    ]
    
    tier = PricingTier(
        tier_id="TIER_PREMIUM",
        name="Premium",
        base_multiplier=0.90,
        min_monthly=5000.0
    )
    
    sla = SLATemplate(
        sla_id="SLA_PLATINUM",
        name="Platinum",
        response_time="30 minutes",
        uptime_guarantee="99.95%",
        price_multiplier=1.50,
        support_hours="24x7 + TAM"
    )
    
    base, tiered, total = compute_totals(bom, tier, sla)
    
    expected_base = 6115.00  # Sum of all extended prices
    expected_tiered = 5503.50  # 6115 * 0.90
    expected_total = 8255.25  # 5503.50 * 1.50
    
    assert base == expected_base
    assert tiered == expected_tiered
    assert total == expected_total


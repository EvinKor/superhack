"""Quick proposal generation - Simplified interface for instant proposal creation."""

import logging
import uuid
from typing import Dict, List, Optional
from datetime import datetime
from .data_store import data_store
from .selectors import select_services, build_bom
from .pricing import compute_totals
from .renderer import generate_summary, render_markdown_file


logger = logging.getLogger(__name__)


class QuickProposalGenerator:
    """Simplified proposal generation with smart defaults."""
    
    def create_instant_proposal(
        self,
        client_name: str,
        client_requirements: str,
        pricing_tier_id: str = "TIER_STANDARD",
        sla_id: str = "SLA_GOLD",
        custom_services: Optional[List[str]] = None,
        custom_quantities: Optional[Dict[str, int]] = None
    ) -> Dict:
        """
        Generate proposal instantly with smart defaults.
        
        Args:
            client_name: Name of the client
            client_requirements: Text description of what client needs
            pricing_tier_id: Pricing tier (default: TIER_STANDARD)
            sla_id: SLA level (default: SLA_GOLD)
            custom_services: Optional list of specific service IDs to include
            custom_quantities: Optional quantity overrides per service
        
        Returns:
            Complete proposal with all details
        """
        logger.info(f"Generating instant proposal for {client_name}")
        
        try:
            # Get tier and SLA
            tier = data_store.get_tier(pricing_tier_id)
            sla = data_store.get_sla(sla_id)
            
            if not tier or not sla:
                raise ValueError(f"Invalid tier or SLA: {pricing_tier_id}, {sla_id}")
            
            # Select services
            if custom_services:
                # Use custom service list
                catalog = data_store.get_catalog()
                selected_services = [catalog[sid] for sid in custom_services if sid in catalog]
                logger.info(f"Using {len(selected_services)} custom services")
            else:
                # Auto-select based on requirements
                selected_services = select_services(client_requirements, client_name)
                logger.info(f"Auto-selected {len(selected_services)} services")
            
            if not selected_services:
                raise ValueError("No services could be selected. Please specify services or provide more detailed requirements.")
            
            # Build BOM with smart quantity estimation
            quantities = custom_quantities or {}
            bom = build_bom(selected_services, quantities)
            
            # Calculate totals
            subtotal_base, subtotal_tiered, total_price = compute_totals(bom, tier, sla)
            
            # Generate summary
            summary = generate_summary_quick(client_name, client_requirements, selected_services, tier, sla)
            
            # Generate proposal file
            proposal_id = str(uuid.uuid4())
            file_path = render_markdown_file(
                proposal_id=proposal_id,
                client_name=client_name,
                summary=summary,
                selected_services=selected_services,
                bom=bom,
                tier=tier,
                sla=sla,
                totals=(subtotal_base, subtotal_tiered, total_price)
            )
            
            # Prepare response
            result = {
                "success": True,
                "proposal_id": proposal_id,
                "client_name": client_name,
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "services_selected": len(bom),
                    "pricing_tier": tier.name,
                    "sla_level": sla.name,
                    "total_monthly_price": total_price
                },
                "pricing": {
                    "subtotal_base": subtotal_base,
                    "subtotal_after_tier": subtotal_tiered,
                    "total_with_sla": total_price,
                    "tier_discount": f"{(1 - tier.base_multiplier) * 100:.1f}%",
                    "sla_premium": f"{(sla.price_multiplier - 1) * 100:.1f}%"
                },
                "services": [
                    {
                        "id": item.service_id,
                        "name": item.service_name,
                        "category": item.category,
                        "quantity": item.quantity,
                        "unit": item.unit,
                        "unit_price": item.unit_price,
                        "monthly_cost": item.extended
                    }
                    for item in bom
                ],
                "sla_details": {
                    "level": sla.name,
                    "response_time": sla.response_time,
                    "uptime": sla.uptime_guarantee,
                    "support_hours": sla.support_hours
                },
                "files": {
                    "local_path": file_path,
                    "download_url": f"/api/v1/proposals/{proposal_id}/download",
                    "proposal_id": proposal_id
                }
            }
            
            logger.info(f"Successfully generated proposal {proposal_id}: ${total_price}/month")
            return result
            
        except Exception as e:
            logger.error(f"Error generating proposal: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to generate proposal. Please check your inputs and try again."
            }
    
    def get_available_options(self) -> Dict:
        """Get all available tiers, SLAs, and services for selection."""
        catalog = data_store.get_catalog()
        tiers = data_store.get_tiers()
        slas = data_store.get_slas()
        
        # Group services by category
        services_by_category = {}
        for service_id, service in catalog.items():
            category = service.category
            if category not in services_by_category:
                services_by_category[category] = []
            
            services_by_category[category].append({
                "id": service.service_id,
                "name": service.service_name,
                "description": service.description,
                "unit": service.unit,
                "unit_price": service.unit_price,
                "default_quantity": service.default_quantity,
                "keywords": service.keywords
            })
        
        return {
            "pricing_tiers": [
                {
                    "id": tier.tier_id,
                    "name": tier.name,
                    "discount": f"{(1 - tier.base_multiplier) * 100:.0f}%",
                    "multiplier": tier.base_multiplier,
                    "min_monthly": tier.min_monthly,
                    "max_users": tier.max_users,
                    "recommended_for": self._get_tier_recommendation(tier.tier_id)
                }
                for tier in tiers.values()
            ],
            "sla_levels": [
                {
                    "id": sla.sla_id,
                    "name": sla.name,
                    "response_time": sla.response_time,
                    "uptime": sla.uptime_guarantee,
                    "support_hours": sla.support_hours,
                    "premium": f"{(sla.price_multiplier - 1) * 100:.0f}%",
                    "multiplier": sla.price_multiplier
                }
                for sla in slas.values()
            ],
            "services_by_category": services_by_category,
            "total_services_available": len(catalog)
        }
    
    def _get_tier_recommendation(self, tier_id: str) -> str:
        """Get recommendation text for tier."""
        recommendations = {
            "TIER_STARTER": "Small businesses, 1-25 users",
            "TIER_STANDARD": "Growing companies, 25-100 users",
            "TIER_PREMIUM": "Mid-market, 100-250 users",
            "TIER_ENTERPRISE": "Large organizations, 250+ users"
        }
        return recommendations.get(tier_id, "General use")


def generate_summary_quick(
    client_name: str,
    requirements: str,
    selected_services: List,
    tier,
    sla
) -> str:
    """Generate a concise summary for quick proposals."""
    service_names = [s.service_name for s in selected_services]
    
    summary = f"""**Proposal for {client_name}**

We've analyzed your requirements and recommend a comprehensive managed services solution 
tailored to your needs.

**Your Requirements:**
{requirements[:200]}{'...' if len(requirements) > 200 else ''}

**Recommended Services ({len(service_names)}):**
{chr(10).join('- ' + name for name in service_names)}

**Pricing Package:**
- **Tier:** {tier.name} ({(1 - tier.base_multiplier) * 100:.0f}% volume discount)
- **SLA:** {sla.name} ({sla.uptime_guarantee} uptime, {sla.response_time} response)

This solution provides enterprise-grade infrastructure management, security, and support 
designed to help your business thrive while reducing IT complexity and costs.
"""
    return summary


# Global instance
quick_generator = QuickProposalGenerator()


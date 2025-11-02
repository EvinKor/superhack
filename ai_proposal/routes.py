"""FastAPI routes for proposal generation API."""

import logging
import uuid
from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional
from .config import settings, validate_aws_config
from .models import GenerateRequest, GenerateResponse, HealthResponse, SLAInfo, TierInfo
from .data_store import data_store
from . import selectors, pricing, renderer
from .predictive_pricing import pricing_engine
from .growth_dashboard import growth_dashboard
from .msp_integration import msp_integration
from .quick_proposal import quick_generator


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/proposals/generate", response_model=GenerateResponse, tags=["Proposals"])
async def generate_proposal(req: GenerateRequest):
    """
    Generate a managed services proposal.
    
    This endpoint:
    1. Selects appropriate services based on requirements
    2. Calculates pricing with tier and SLA multipliers
    3. Generates a professional Markdown proposal
    4. Optionally polishes content with LLM
    
    **Example Request:**
    ```json
    {
      "client_name": "Acme Retail",
      "requirements": "Need AWS cloud migration, SIEM, vuln scans, helpdesk for 120 users. High uptime.",
      "pricing_tier_id": "TIER_STANDARD",
      "sla_id": "SLA_GOLD",
      "quantities": {"S007": 120},
      "use_llm": false
    }
    ```
    """
    logger.info(f"Generating proposal for {req.client_name}")
    
    try:
        # Get tier and SLA
        tier = data_store.get_tier(req.pricing_tier_id)
        sla = data_store.get_sla(req.sla_id)
        
        if not tier:
            raise HTTPException(status_code=400, detail=f"Invalid pricing tier: {req.pricing_tier_id}")
        if not sla:
            raise HTTPException(status_code=400, detail=f"Invalid SLA: {req.sla_id}")
        
        # Check LLM prerequisites
        if req.use_llm and not settings.BEDROCK_MODEL_ID:
            raise HTTPException(
                status_code=400,
                detail="LLM polishing requested but BEDROCK_MODEL_ID not configured. "
                       "Please set the environment variable or disable use_llm."
            )
        
        # Select services
        selected_services = selectors.select_services(req.requirements, req.client_name)
        
        if not selected_services:
            raise HTTPException(
                status_code=422,
                detail="Could not identify suitable services from requirements. "
                       "Please provide more specific details."
            )
        
        # Build BOM
        bom = selectors.build_bom(selected_services, req.quantities)
        
        # Calculate pricing
        subtotal_base, subtotal_tiered, total_price = pricing.compute_totals(bom, tier, sla)
        
        # Generate summary
        summary = renderer.generate_summary(req, selected_services)
        
        # Polish with LLM if requested
        if req.use_llm:
            summary = renderer.polish_with_bedrock(summary, req)
        
        # Generate proposal file
        proposal_id = str(uuid.uuid4())
        file_path = renderer.render_markdown_file(
            proposal_id=proposal_id,
            client_name=req.client_name,
            summary=summary,
            selected_services=selected_services,
            bom=bom,
            tier=tier,
            sla=sla,
            totals=(subtotal_base, subtotal_tiered, total_price)
        )
        
        # Build response
        response = GenerateResponse(
            proposal_id=proposal_id,
            summary=summary,
            bom=bom,
            subtotal_base=subtotal_base,
            subtotal_tiered=subtotal_tiered,
            total_price=total_price,
            sla=SLAInfo(
                sla_id=sla.sla_id,
                name=sla.name,
                response_time=sla.response_time,
                uptime_guarantee=sla.uptime_guarantee,
                price_multiplier=sla.price_multiplier,
                support_hours=sla.support_hours
            ),
            tier=TierInfo(
                tier_id=tier.tier_id,
                name=tier.name,
                base_multiplier=tier.base_multiplier,
                min_monthly=tier.min_monthly,
                max_users=tier.max_users
            ),
            file_path=file_path,
            client_name=req.client_name
        )
        
        logger.info(f"Successfully generated proposal {proposal_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating proposal: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/proposals/{proposal_id}/download", tags=["Proposals"])
async def download_proposal(proposal_id: str):
    """
    Download a generated proposal as Markdown file.
    
    Returns the Markdown file with appropriate Content-Disposition header
    for browser download.
    """
    file_path = Path(settings.OUTPUT_DIR) / f"proposal_{proposal_id}.md"
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    return FileResponse(
        path=file_path,
        media_type="text/markdown",
        filename=f"proposal_{proposal_id}.md",
        headers={"Content-Disposition": f'attachment; filename="proposal_{proposal_id}.md"'}
    )


@router.post("/proposals/quick-generate", tags=["Proposals"])
async def quick_generate_proposal(
    client_name: str = Query(..., description="Client company name"),
    requirements: str = Query(..., description="Client requirements and needs"),
    pricing_tier: str = Query("TIER_STANDARD", description="Pricing tier ID"),
    sla_level: str = Query("SLA_GOLD", description="SLA level ID"),
    custom_services: Optional[str] = Query(None, description="Comma-separated service IDs (optional)"),
    custom_quantities: Optional[str] = Query(None, description="Service quantities as JSON (optional)")
):
    """
    **Quick proposal generation** - Simplified endpoint for instant proposals.
    
    This endpoint provides a simpler interface than the full /proposals/generate.
    Just provide client name, requirements, and optionally tier/SLA.
    
    **Example:**
    ```
    GET /proposals/quick-generate?client_name=Acme Corp&requirements=Need monitoring and support for 50 users&pricing_tier=TIER_STANDARD&sla_level=SLA_GOLD
    ```
    
    **Returns:** Complete proposal with download link.
    """
    import json
    
    # Parse custom services
    service_list = None
    if custom_services:
        service_list = [s.strip() for s in custom_services.split(',')]
    
    # Parse custom quantities
    quantities = {}
    if custom_quantities:
        try:
            quantities = json.loads(custom_quantities)
        except:
            pass
    
    # Generate proposal
    result = quick_generator.create_instant_proposal(
        client_name=client_name,
        client_requirements=requirements,
        pricing_tier_id=pricing_tier,
        sla_id=sla_level,
        custom_services=service_list,
        custom_quantities=quantities
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))
    
    return result


@router.get("/proposals/options", tags=["Proposals"])
async def get_proposal_options():
    """
    Get all available options for proposal generation.
    
    Returns:
    - Available pricing tiers with details
    - Available SLA levels with details  
    - Service catalog organized by category
    
    Use this to build dynamic forms or dropdowns.
    """
    options = quick_generator.get_available_options()
    return options


@router.post("/proposals/reload-data", tags=["Admin"])
async def reload_data():
    """
    Reload CSV data files.
    
    Useful for hot-reloading after updating service catalog, SLAs, or pricing tiers.
    """
    try:
        data_store.reload()
        catalog = data_store.get_catalog()
        slas = data_store.get_slas()
        tiers = data_store.get_tiers()
        
        return {
            "status": "success",
            "counts": {
                "services": len(catalog),
                "slas": len(slas),
                "tiers": len(tiers)
            }
        }
    except Exception as e:
        logger.error(f"Error reloading data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint.
    
    Returns system status and available capabilities (ML, LLM).
    """
    capabilities = validate_aws_config()
    capabilities["services_loaded"] = len(data_store.get_catalog())
    capabilities["slas_loaded"] = len(data_store.get_slas())
    capabilities["tiers_loaded"] = len(data_store.get_tiers())
    
    from . import __version__
    
    return HealthResponse(
        status="healthy",
        version=__version__,
        capabilities=capabilities
    )


@router.get("/status", tags=["System"])
async def module_status():
    """
    Get status of all AI modules showing which are live vs demo.
    """
    return {
        "modules": {
            "ai_proposal_assistant": {
                "name": "AI Proposal Assistant",
                "status": "🟢 Live AI",
                "type": "production",
                "description": "Real ML-powered proposal generation",
                "endpoints": [
                    "POST /api/v1/proposals/generate",
                    "GET /api/v1/proposals/{id}/download"
                ]
            },
            "predictive_pricing": {
                "name": "AI Predictive Pricing Engine",
                "status": "🟡 Demo (Dummy Data)",
                "type": "demo",
                "description": "Simulated pricing optimization and upsell recommendations",
                "endpoints": [
                    "GET /api/v1/ai/predictive-pricing",
                    "GET /api/v1/ai/pricing-trends"
                ],
                "note": "Will be replaced with real SageMaker model"
            },
            "growth_dashboard": {
                "name": "Growth Dashboard",
                "status": "🟡 Demo (Dummy Data)",
                "type": "demo",
                "description": "Simulated analytics, churn prediction, and forecasting",
                "endpoints": [
                    "GET /api/v1/dashboard/growth",
                    "GET /api/v1/dashboard/churn-predictions",
                    "GET /api/v1/dashboard/growth-opportunities"
                ],
                "note": "Will be replaced with real DynamoDB + QuickSight metrics"
            },
            "msp_integration": {
                "name": "MSP Platform Integration",
                "status": "🟡 Demo (Dummy Data)",
                "type": "demo",
                "description": "Simulated PSA/RMM integration status",
                "endpoints": [
                    "GET /api/v1/integration/msp-sync",
                    "GET /api/v1/integration/sync-history",
                    "POST /api/v1/integration/trigger-sync"
                ],
                "note": "Will be replaced with real SuperOps/ConnectWise APIs"
            }
        },
        "legend": {
            "🟢 Live AI": "Powered by real ML models and production data",
            "🟡 Demo": "Using synthetic data for demonstration purposes"
        }
    }


# ============================================
# AI PREDICTIVE PRICING ENDPOINTS (Demo)
# ============================================

@router.get("/ai/predictive-pricing", tags=["AI - Predictive Pricing (Demo)"])
async def get_predictive_pricing(
    client_id: str = Query("C2001", description="Client identifier"),
    industry: str = Query("Retail", description="Client industry"),
    user_count: int = Query(100, description="Number of users"),
    services: str = Query("S001,S007,S003", description="Comma-separated service IDs")
):
    """
    **[DEMO with dummy data]** Get AI-powered pricing optimization.
    
    Simulates predictive pricing recommendations based on:
    - Historical pricing data
    - Industry benchmarks
    - Client characteristics
    - Service mix
    
    In production, this would call a SageMaker endpoint trained on real pricing data.
    """
    service_list = services.split(",") if services else []
    
    prediction = pricing_engine.predict_optimal_price(
        client_id=client_id,
        current_services=service_list,
        client_industry=industry,
        user_count=user_count
    )
    
    return prediction


@router.get("/ai/pricing-trends", tags=["AI - Predictive Pricing (Demo)"])
async def get_pricing_trends(months: int = Query(6, ge=1, le=24)):
    """
    **[DEMO with dummy data]** Get pricing trends over time.
    
    Shows historical pricing patterns and margins.
    """
    trends = pricing_engine.get_pricing_trends(months=months)
    return trends


# ============================================
# GROWTH DASHBOARD ENDPOINTS (Demo)
# ============================================

@router.get("/dashboard/growth", tags=["Dashboard - Growth Analytics (Demo)"])
async def get_growth_metrics():
    """
    **[DEMO with dummy data]** Get comprehensive growth dashboard metrics.
    
    Includes:
    - MRR/ARR metrics
    - Growth rates
    - Churn predictions
    - Profitability index
    - Revenue forecasts
    
    In production, this would query real analytics databases and ML models.
    """
    metrics = growth_dashboard.get_overview_metrics()
    return metrics


@router.get("/dashboard/client-breakdown", tags=["Dashboard - Growth Analytics (Demo)"])
async def get_client_breakdown():
    """
    **[DEMO with dummy data]** Get client segmentation analysis.
    
    Breaks down clients by tier and industry with value metrics.
    """
    breakdown = growth_dashboard.get_client_breakdown()
    return breakdown


@router.get("/dashboard/churn-predictions", tags=["Dashboard - Growth Analytics (Demo)"])
async def get_churn_predictions(top_n: int = Query(10, ge=1, le=50)):
    """
    **[DEMO with dummy data]** Get clients at risk of churning.
    
    ML-powered churn risk scoring with recommended retention actions.
    """
    predictions = growth_dashboard.get_churn_predictions(top_n=top_n)
    return {
        "at_risk_clients": predictions,
        "total_value_at_risk": sum(c["monthly_value_at_risk"] for c in predictions),
        "is_demo": True
    }


@router.get("/dashboard/growth-opportunities", tags=["Dashboard - Growth Analytics (Demo)"])
async def get_growth_opportunities(top_n: int = Query(10, ge=1, le=50)):
    """
    **[DEMO with dummy data]** Get expansion opportunities.
    
    Identifies clients with high growth potential and upsell recommendations.
    """
    opportunities = growth_dashboard.get_growth_opportunities(top_n=top_n)
    return {
        "opportunities": opportunities,
        "total_expansion_potential": sum(
            o["predicted_expansion_value"] - o["current_monthly_value"]
            for o in opportunities
        ),
        "is_demo": True
    }


# ============================================
# MSP INTEGRATION ENDPOINTS (Demo)
# ============================================

@router.get("/integration/msp-sync", tags=["Integration - MSP Platforms (Demo)"])
async def get_integration_status():
    """
    **[DEMO with dummy data]** Get MSP platform integration status.
    
    Shows connection status for:
    - SuperOps.ai
    - ConnectWise Manage
    - AWS Services
    - Microsoft 365
    - SIEM Platform
    
    In production, this would check real API connections.
    """
    status = msp_integration.get_integration_status()
    return status


@router.get("/integration/sync-history", tags=["Integration - MSP Platforms (Demo)"])
async def get_sync_history(limit: int = Query(20, ge=1, le=100)):
    """
    **[DEMO with dummy data]** Get recent sync history across all integrations.
    """
    history = msp_integration.get_sync_history(limit=limit)
    return {
        "sync_history": history,
        "is_demo": True
    }


@router.post("/integration/trigger-sync/{integration_name}", tags=["Integration - MSP Platforms (Demo)"])
async def trigger_sync(integration_name: str):
    """
    **[DEMO with dummy data]** Manually trigger sync for a specific integration.
    
    Available integrations: superops, connectwise, aws, microsoft365, siem
    """
    result = msp_integration.trigger_manual_sync(integration_name)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    
    return result


@router.get("/integration/data-flow", tags=["Integration - MSP Platforms (Demo)"])
async def get_data_flow_metrics():
    """
    **[DEMO with dummy data]** Get data flow and API metrics.
    
    Shows API calls, data volume, webhook deliveries, etc.
    """
    metrics = msp_integration.get_data_flow_metrics()
    return metrics


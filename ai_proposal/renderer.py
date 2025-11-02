"""Markdown proposal rendering with Jinja2 and optional LLM polishing."""

import logging
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Tuple
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from .config import settings
from .models import BOMRow, ServiceCatalogItem, SLATemplate, PricingTier, GenerateRequest
from .pricing import format_price


logger = logging.getLogger(__name__)


def get_jinja_env() -> Environment:
    """Get Jinja2 environment with templates directory."""
    return Environment(
        loader=FileSystemLoader(settings.TEMPLATES_DIR),
        autoescape=False,
        trim_blocks=True,
        lstrip_blocks=True
    )


def generate_summary(req: GenerateRequest, selected_services: List[ServiceCatalogItem]) -> str:
    """
    Generate proposal summary text.
    
    Args:
        req: Generation request
        selected_services: Selected services
    
    Returns:
        Summary text
    """
    service_categories = {}
    for service in selected_services:
        cat = service.category
        if cat not in service_categories:
            service_categories[cat] = []
        service_categories[cat].append(service.service_name)
    
    summary_parts = [
        f"Proposal for {req.client_name}",
        "",
        "Based on your requirements, we recommend the following managed services:",
        ""
    ]
    
    for category, services in sorted(service_categories.items()):
        summary_parts.append(f"**{category}:**")
        for service in services:
            summary_parts.append(f"- {service}")
        summary_parts.append("")
    
    summary_parts.append(
        "This comprehensive solution provides enterprise-grade security, "
        "infrastructure management, and support tailored to your business needs."
    )
    
    return "\n".join(summary_parts)


def polish_with_bedrock(text: str, req: GenerateRequest) -> str:
    """
    Polish text using AWS Bedrock LLM.
    
    Args:
        text: Text to polish
        req: Generation request
    
    Returns:
        Polished text
    """
    if not settings.BEDROCK_MODEL_ID:
        logger.info("Bedrock not configured, skipping LLM polish")
        return text
    
    if not req.use_llm:
        return text
    
    try:
        import boto3
        import json
        
        client = boto3.client('bedrock-runtime', region_name=settings.AWS_REGION)
        
        prompt = f"""You are a professional MSP proposal writer. Polish the following proposal summary 
to make it more compelling and professional. Keep all factual information (services, prices, SLAs) intact.
Only improve the writing style and presentation.

Original summary:
{text}

Polished version:"""
        
        # Claude 3 format
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        })
        
        response = client.invoke_model(
            modelId=settings.BEDROCK_MODEL_ID,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        polished = response_body['content'][0]['text']
        
        logger.info("Successfully polished text with Bedrock")
        return polished.strip()
        
    except ImportError:
        logger.warning("boto3 not installed, skipping Bedrock polish")
        return text
    except Exception as e:
        logger.error(f"Bedrock polishing failed: {e}")
        return text


def render_markdown_file(
    proposal_id: str,
    client_name: str,
    summary: str,
    selected_services: List[ServiceCatalogItem],
    bom: List[BOMRow],
    tier: PricingTier,
    sla: SLATemplate,
    totals: Tuple[float, float, float]
) -> str:
    """
    Render complete proposal as Markdown file.
    
    Args:
        proposal_id: Unique proposal ID
        client_name: Client name
        summary: Proposal summary
        selected_services: Selected services
        bom: Bill of materials
        tier: Pricing tier
        sla: SLA template
        totals: Tuple of (base, tiered, total) prices
    
    Returns:
        Path to generated file
    """
    env = get_jinja_env()
    
    try:
        template = env.get_template('proposal_template.md')
    except TemplateNotFound:
        logger.warning("Template not found, using default")
        template = env.from_string(get_default_template())
    
    subtotal_base, subtotal_tiered, total_price = totals
    
    # Prepare template context
    context = {
        'proposal_id': proposal_id,
        'client_name': client_name,
        'date': datetime.now().strftime('%B %d, %Y'),
        'summary': summary,
        'bom': bom,
        'subtotal_base': format_price(subtotal_base),
        'subtotal_tiered': format_price(subtotal_tiered),
        'total_price': format_price(total_price),
        'tier': tier,
        'sla': sla,
        'services_by_category': _group_by_category(selected_services)
    }
    
    # Render markdown
    markdown_content = template.render(**context)
    
    # Write to file
    output_path = Path(settings.OUTPUT_DIR) / f"proposal_{proposal_id}.md"
    output_path.write_text(markdown_content, encoding='utf-8')
    
    logger.info(f"Generated proposal: {output_path}")
    return str(output_path)


def _group_by_category(services: List[ServiceCatalogItem]) -> dict:
    """Group services by category."""
    grouped = {}
    for service in services:
        if service.category not in grouped:
            grouped[service.category] = []
        grouped[service.category].append(service)
    return grouped


def get_default_template() -> str:
    """Get default proposal template."""
    return """# Managed Services Proposal

**Proposal ID:** {{ proposal_id }}  
**Client:** {{ client_name }}  
**Date:** {{ date }}

---

## Executive Summary

{{ summary }}

---

## Proposed Services

{% for category, services in services_by_category.items() %}
### {{ category }}

{% for service in services %}
- **{{ service.service_name }}**  
  {{ service.description }}
{% endfor %}

{% endfor %}

---

## Pricing Details

### Bill of Materials

| Service | Unit | Quantity | Unit Price | Extended |
|---------|------|----------|------------|----------|
{% for item in bom -%}
| {{ item.service_name }} | {{ item.unit }} | {{ item.quantity }} | ${{ "%.2f"|format(item.unit_price) }} | ${{ "%.2f"|format(item.extended) }} |
{% endfor %}

**Subtotal (Base):** {{ subtotal_base }}  
**Subtotal ({{ tier.name }}):** {{ subtotal_tiered }} *(×{{ tier.base_multiplier }})*  

### Service Level Agreement: {{ sla.name }}

- **Response Time:** {{ sla.response_time }}
- **Uptime Guarantee:** {{ sla.uptime_guarantee }}
- **Support Hours:** {{ sla.support_hours }}
- **SLA Multiplier:** ×{{ sla.price_multiplier }}

**TOTAL MONTHLY INVESTMENT:** {{ total_price }}

---

## Terms & Conditions

1. Prices are in USD and represent monthly recurring charges
2. One-time setup fees may apply
3. Contract term: 12 months minimum
4. Payment terms: Net 30
5. Services subject to acceptable use policy

---

## Next Steps

1. Review and approve this proposal
2. Schedule kickoff meeting
3. Complete onboarding documentation
4. Begin service delivery

For questions, please contact your account manager.

*Generated on {{ date }}*
"""


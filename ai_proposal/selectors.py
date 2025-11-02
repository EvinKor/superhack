"""Service selection logic with rule-based and ML-powered approaches."""

import logging
import json
from typing import Dict, List, Set, Tuple
from .config import settings
from .models import ServiceCatalogItem, BOMRow
from .data_store import data_store


logger = logging.getLogger(__name__)


def select_services_rule_based(requirements: str, catalog: Dict[str, ServiceCatalogItem]) -> Set[str]:
    """
    Select services using keyword matching.
    
    Args:
        requirements: Client requirements text
        catalog: Service catalog dictionary
    
    Returns:
        Set of selected service IDs
    """
    requirements_lower = requirements.lower()
    selected = set()
    
    for service_id, service in catalog.items():
        # Check if any keyword matches
        for keyword in service.keywords:
            if keyword in requirements_lower:
                selected.add(service_id)
                logger.debug(f"Matched service {service_id} on keyword '{keyword}'")
                break
    
    logger.info(f"Rule-based selection found {len(selected)} services")
    return selected


def select_services_ml(requirements: str, client_name: str = "") -> Set[str]:
    """
    Select services using SageMaker ML model.
    
    Args:
        requirements: Client requirements text
        client_name: Client name for context
    
    Returns:
        Set of selected service IDs
    """
    if not settings.SM_ENDPOINT_NAME:
        logger.info("SageMaker endpoint not configured, skipping ML selection")
        return set()
    
    try:
        import boto3
        
        client = boto3.client('sagemaker-runtime', region_name=settings.AWS_REGION)
        
        payload = {
            "requirements": requirements,
            "client_meta": {"name": client_name}
        }
        
        response = client.invoke_endpoint(
            EndpointName=settings.SM_ENDPOINT_NAME,
            ContentType='application/json',
            Body=json.dumps(payload)
        )
        
        result = json.loads(response['Body'].read().decode())
        
        # Expected format: {"predictions": [{"service_id": "S001", "confidence": 0.95}, ...]}
        selected = set()
        if 'predictions' in result:
            for pred in result['predictions']:
                if pred.get('confidence', 0) > 0.5:  # Confidence threshold
                    selected.add(pred['service_id'])
        
        logger.info(f"ML selection found {len(selected)} services")
        return selected
        
    except ImportError:
        logger.warning("boto3 not installed, skipping ML selection")
        return set()
    except Exception as e:
        logger.error(f"ML selection failed: {e}")
        return set()


def select_services(requirements: str, client_name: str = "") -> List[ServiceCatalogItem]:
    """
    Select services using both rule-based and ML approaches.
    
    Args:
        requirements: Client requirements text
        client_name: Client name for context
    
    Returns:
        List of selected service catalog items
    """
    catalog = data_store.get_catalog()
    
    # Start with rule-based
    selected_ids = select_services_rule_based(requirements, catalog)
    
    # Augment with ML if enabled
    if settings.ENABLE_ML_SELECTION and settings.SM_ENDPOINT_NAME:
        ml_ids = select_services_ml(requirements, client_name)
        selected_ids = selected_ids.union(ml_ids)
        logger.info(f"Combined selection: {len(selected_ids)} services")
    
    # Ensure we have at least some services
    if not selected_ids:
        # Fallback: select a few common services
        logger.warning("No services selected, using fallback services")
        fallback_ids = ['S007', 'S002', 'S001']  # Help desk, patching, monitoring
        selected_ids = set([sid for sid in fallback_ids if sid in catalog])
    
    # Return full service objects
    selected_services = [catalog[sid] for sid in selected_ids if sid in catalog]
    return selected_services


def estimate_quantity(service: ServiceCatalogItem, requirements: str) -> int:
    """
    Estimate quantity for a service based on requirements.
    
    Args:
        service: Service catalog item
        requirements: Client requirements text
    
    Returns:
        Estimated quantity
    """
    requirements_lower = requirements.lower()
    
    # Look for user count mentions
    import re
    user_matches = re.findall(r'(\d+)\s*(?:users?|employees?|seats?)', requirements_lower)
    if user_matches:
        user_count = int(user_matches[0])
        
        # User-based services
        if service.unit.lower() in ['user', 'seat', 'license']:
            return user_count
        
        # Endpoint-based (assume 1.2 devices per user)
        if service.unit.lower() in ['endpoint', 'device']:
            return int(user_count * 1.2)
    
    # Look for IP count
    ip_matches = re.findall(r'(\d+)\s*(?:ips?|servers?|hosts?)', requirements_lower)
    if ip_matches and service.unit.lower() in ['ip', 'server', 'host']:
        return int(ip_matches[0])
    
    # Default quantity
    return service.default_quantity


def build_bom(
    selected_services: List[ServiceCatalogItem],
    quantity_overrides: Dict[str, int]
) -> List[BOMRow]:
    """
    Build Bill of Materials from selected services.
    
    Args:
        selected_services: List of selected services
        quantity_overrides: Manual quantity overrides
    
    Returns:
        List of BOM rows
    """
    bom = []
    
    for service in selected_services:
        # Use override or estimate
        quantity = quantity_overrides.get(
            service.service_id,
            service.default_quantity
        )
        
        extended = round(quantity * service.unit_price, 2)
        
        row = BOMRow(
            service_id=service.service_id,
            service_name=service.service_name,
            unit=service.unit,
            quantity=quantity,
            unit_price=service.unit_price,
            extended=extended,
            category=service.category
        )
        bom.append(row)
    
    logger.info(f"Built BOM with {len(bom)} line items")
    return bom


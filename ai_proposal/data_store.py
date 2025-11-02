"""CSV data loaders with caching and hot-reload support."""

import csv
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from .config import settings
from .models import ServiceCatalogItem, SLATemplate, PricingTier


logger = logging.getLogger(__name__)


class DataStore:
    """Manages CSV data with caching and hot-reload."""
    
    def __init__(self):
        self._catalog: Dict[str, ServiceCatalogItem] = {}
        self._slas: Dict[str, SLATemplate] = {}
        self._tiers: Dict[str, PricingTier] = {}
        self._last_loaded: Dict[str, float] = {}
        self._load_all()
    
    def _should_reload(self, file_path: str) -> bool:
        """Check if file should be reloaded based on modification time."""
        path = Path(file_path)
        if not path.exists():
            return False
        
        current_mtime = path.stat().st_mtime
        last_mtime = self._last_loaded.get(file_path, 0)
        
        if current_mtime > last_mtime:
            self._last_loaded[file_path] = current_mtime
            return True
        return False
    
    def _load_catalog(self) -> None:
        """Load service catalog from CSV."""
        path = settings.CATALOG_PATH
        if not Path(path).exists():
            logger.warning(f"Catalog file not found: {path}")
            return
        
        if not self._should_reload(path) and self._catalog:
            return
        
        self._catalog.clear()
        try:
            with open(path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    keywords = [k.strip().lower() for k in row['keywords'].split(',')]
                    item = ServiceCatalogItem(
                        service_id=row['service_id'],
                        service_name=row['service_name'],
                        category=row['category'],
                        description=row['description'],
                        unit=row['unit'],
                        unit_price=float(row['unit_price']),
                        keywords=keywords,
                        default_quantity=int(row.get('default_quantity', 1))
                    )
                    self._catalog[item.service_id] = item
            logger.info(f"Loaded {len(self._catalog)} services from catalog")
        except Exception as e:
            logger.error(f"Error loading catalog: {e}")
    
    def _load_slas(self) -> None:
        """Load SLA templates from CSV."""
        path = settings.SLA_PATH
        if not Path(path).exists():
            logger.warning(f"SLA file not found: {path}")
            return
        
        if not self._should_reload(path) and self._slas:
            return
        
        self._slas.clear()
        try:
            with open(path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sla = SLATemplate(
                        sla_id=row['sla_id'],
                        name=row['name'],
                        response_time=row['response_time'],
                        uptime_guarantee=row['uptime_guarantee'],
                        price_multiplier=float(row['price_multiplier']),
                        support_hours=row['support_hours']
                    )
                    self._slas[sla.sla_id] = sla
            logger.info(f"Loaded {len(self._slas)} SLA templates")
        except Exception as e:
            logger.error(f"Error loading SLAs: {e}")
    
    def _load_tiers(self) -> None:
        """Load pricing tiers from CSV."""
        path = settings.TIERS_PATH
        if not Path(path).exists():
            logger.warning(f"Tiers file not found: {path}")
            return
        
        if not self._should_reload(path) and self._tiers:
            return
        
        self._tiers.clear()
        try:
            with open(path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    tier = PricingTier(
                        tier_id=row['tier_id'],
                        name=row['name'],
                        base_multiplier=float(row['base_multiplier']),
                        min_monthly=float(row['min_monthly']) if row.get('min_monthly') else None,
                        max_users=int(row['max_users']) if row.get('max_users') else None
                    )
                    self._tiers[tier.tier_id] = tier
            logger.info(f"Loaded {len(self._tiers)} pricing tiers")
        except Exception as e:
            logger.error(f"Error loading tiers: {e}")
    
    def _load_all(self) -> None:
        """Load all data files."""
        self._load_catalog()
        self._load_slas()
        self._load_tiers()
    
    def reload(self) -> None:
        """Force reload all data files."""
        self._last_loaded.clear()
        self._load_all()
    
    def get_catalog(self) -> Dict[str, ServiceCatalogItem]:
        """Get service catalog."""
        self._load_catalog()  # Auto-reload if needed
        return self._catalog
    
    def get_slas(self) -> Dict[str, SLATemplate]:
        """Get SLA templates."""
        self._load_slas()
        return self._slas
    
    def get_tiers(self) -> Dict[str, PricingTier]:
        """Get pricing tiers."""
        self._load_tiers()
        return self._tiers
    
    def get_service(self, service_id: str) -> Optional[ServiceCatalogItem]:
        """Get specific service by ID."""
        return self.get_catalog().get(service_id)
    
    def get_sla(self, sla_id: str) -> Optional[SLATemplate]:
        """Get specific SLA by ID."""
        return self.get_slas().get(sla_id)
    
    def get_tier(self, tier_id: str) -> Optional[PricingTier]:
        """Get specific tier by ID."""
        return self.get_tiers().get(tier_id)


# Global data store instance
data_store = DataStore()


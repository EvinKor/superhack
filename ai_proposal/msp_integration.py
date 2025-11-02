"""MSP Platform Integration - Demo with dummy sync status.

This module simulates integration with external MSP platforms.
In production, this would use real APIs (SuperOps, ConnectWise, etc.)
"""

import logging
import random
from typing import Dict, List
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class MSPIntegrationManager:
    """Simulates MSP platform integration status."""
    
    def __init__(self):
        self._integrations = self._initialize_integrations()
        self._sync_history = self._generate_sync_history()
    
    def _initialize_integrations(self) -> Dict:
        """Initialize integration configurations."""
        return {
            "superops": {
                "name": "SuperOps.ai",
                "type": "PSA/RMM",
                "status": random.choice(["Connected", "Connected", "Connected", "Syncing"]),
                "last_sync": datetime.now() - timedelta(minutes=random.randint(5, 60)),
                "sync_frequency": "Every 15 minutes",
                "entities_synced": ["Tickets", "Assets", "Clients", "Invoices"]
            },
            "connectwise": {
                "name": "ConnectWise Manage",
                "type": "PSA",
                "status": random.choice(["Connected", "Connected", "Warning"]),
                "last_sync": datetime.now() - timedelta(minutes=random.randint(10, 90)),
                "sync_frequency": "Every 30 minutes",
                "entities_synced": ["Tickets", "Time Entries", "Agreements"]
            },
            "aws": {
                "name": "AWS Services",
                "type": "Cloud Provider",
                "status": "Connected",
                "last_sync": datetime.now() - timedelta(minutes=random.randint(1, 30)),
                "sync_frequency": "Real-time",
                "entities_synced": ["EC2 Instances", "RDS Databases", "S3 Buckets", "Cost Data"]
            },
            "microsoft365": {
                "name": "Microsoft 365",
                "type": "SaaS Platform",
                "status": "Connected",
                "last_sync": datetime.now() - timedelta(minutes=random.randint(5, 45)),
                "sync_frequency": "Every 10 minutes",
                "entities_synced": ["Users", "Licenses", "Security Alerts"]
            },
            "siem": {
                "name": "SIEM Platform",
                "type": "Security",
                "status": random.choice(["Connected", "Connected", "Active"]),
                "last_sync": datetime.now() - timedelta(minutes=random.randint(1, 10)),
                "sync_frequency": "Every 5 minutes",
                "entities_synced": ["Security Events", "Alerts", "Threats"]
            }
        }
    
    def _generate_sync_history(self) -> List[Dict]:
        """Generate synthetic sync history."""
        history = []
        for i in range(50):
            timestamp = datetime.now() - timedelta(hours=i)
            history.append({
                "timestamp": timestamp.isoformat(),
                "integration": random.choice(list(self._integrations.keys())),
                "status": random.choice(["Success", "Success", "Success", "Warning", "Error"]),
                "records_synced": random.randint(10, 500),
                "duration_ms": random.randint(200, 5000),
                "errors": random.randint(0, 3) if random.random() < 0.2 else 0
            })
        return history
    
    def get_integration_status(self) -> Dict:
        """Get current status of all integrations."""
        logger.info("Fetching integration status")
        
        total_integrations = len(self._integrations)
        connected = sum(1 for i in self._integrations.values() if i["status"] in ["Connected", "Active", "Syncing"])
        
        # Calculate sync health
        recent_syncs = [s for s in self._sync_history if 
                       datetime.fromisoformat(s["timestamp"]) > datetime.now() - timedelta(hours=1)]
        success_rate = (sum(1 for s in recent_syncs if s["status"] == "Success") / len(recent_syncs) * 100) if recent_syncs else 100
        
        return {
            "summary": {
                "total_integrations": total_integrations,
                "active_connections": connected,
                "health_score": round(success_rate, 1),
                "last_check": datetime.now().isoformat()
            },
            "integrations": {
                name: {
                    **info,
                    "last_sync": info["last_sync"].isoformat(),
                    "health_status": "Healthy" if info["status"] in ["Connected", "Active"] else "Degraded"
                }
                for name, info in self._integrations.items()
            },
            "recent_activity": {
                "last_hour_syncs": len(recent_syncs),
                "success_rate_percent": round(success_rate, 1),
                "total_records_synced": sum(s["records_synced"] for s in recent_syncs),
                "avg_sync_duration_ms": round(sum(s["duration_ms"] for s in recent_syncs) / len(recent_syncs), 0) if recent_syncs else 0
            },
            "is_demo": True
        }
    
    def get_sync_history(self, limit: int = 20) -> List[Dict]:
        """Get recent sync history."""
        return self._sync_history[:limit]
    
    def trigger_manual_sync(self, integration_name: str) -> Dict:
        """Simulate manual sync trigger."""
        if integration_name not in self._integrations:
            return {
                "success": False,
                "error": f"Integration '{integration_name}' not found"
            }
        
        # Simulate sync
        logger.info(f"Triggering manual sync for {integration_name}")
        
        sync_result = {
            "success": True,
            "integration": integration_name,
            "started_at": datetime.now().isoformat(),
            "status": "In Progress",
            "estimated_duration_seconds": random.randint(30, 120),
            "message": f"Manual sync initiated for {self._integrations[integration_name]['name']}",
            "is_demo": True
        }
        
        return sync_result
    
    def get_data_flow_metrics(self) -> Dict:
        """Get data flow and API call metrics."""
        return {
            "api_calls": {
                "last_24_hours": random.randint(5000, 15000),
                "avg_response_time_ms": random.randint(50, 200),
                "error_rate_percent": round(random.uniform(0.1, 2.0), 2),
                "rate_limit_hits": random.randint(0, 5)
            },
            "data_volume": {
                "records_processed_24h": random.randint(10000, 50000),
                "data_transferred_mb": round(random.uniform(100, 1000), 2),
                "peak_hour": f"{random.randint(9, 17)}:00-{random.randint(9, 17)}:00"
            },
            "webhooks": {
                "total_configured": random.randint(5, 15),
                "active": random.randint(5, 15),
                "deliveries_24h": random.randint(100, 1000),
                "failed_deliveries": random.randint(0, 10)
            },
            "is_demo": True
        }


# Global instance
msp_integration = MSPIntegrationManager()


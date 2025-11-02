"""Growth Dashboard - Demo with dummy analytics data.

This module simulates comprehensive business analytics.
In production, this would connect to real databases and analytics platforms.
"""

import logging
import random
from typing import Dict, List
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class GrowthDashboard:
    """Simulates business growth analytics and predictions."""
    
    def __init__(self):
        self._clients = self._generate_dummy_clients()
    
    def _generate_dummy_clients(self) -> List[Dict]:
        """Generate synthetic client dataset."""
        industries = ["Healthcare", "Retail", "Manufacturing", "Finance", "Education", "Technology"]
        tiers = ["Starter", "Standard", "Premium", "Enterprise"]
        
        clients = []
        for i in range(100):
            monthly_value = random.randint(2000, 50000)
            months_active = random.randint(3, 36)
            
            clients.append({
                "client_id": f"C{2000 + i}",
                "client_name": f"Client Corp {i}",
                "industry": random.choice(industries),
                "tier": random.choice(tiers),
                "monthly_value": monthly_value,
                "annual_value": monthly_value * 12,
                "months_active": months_active,
                "churn_risk": random.uniform(0.01, 0.25),
                "growth_potential": random.uniform(1.0, 2.5),
                "satisfaction_score": random.uniform(3.5, 5.0)
            })
        
        return clients
    
    def get_overview_metrics(self) -> Dict:
        """Get high-level growth metrics."""
        logger.info("Generating growth dashboard overview")
        
        total_clients = len(self._clients)
        total_mrr = sum(c["monthly_value"] for c in self._clients)
        total_arr = total_mrr * 12
        
        # Simulate month-over-month growth
        mom_growth = round(random.uniform(5, 15), 1)
        
        # Calculate average metrics
        avg_contract_value = round(sum(c["monthly_value"] for c in self._clients) / total_clients, 2)
        avg_retention_months = round(sum(c["months_active"] for c in self._clients) / total_clients, 1)
        
        # Profitability index (revenue / costs)
        simulated_costs = total_mrr * 0.65  # Assume 65% cost ratio
        profitability_index = round(total_mrr / simulated_costs, 2)
        
        # Churn prediction
        high_risk_clients = [c for c in self._clients if c["churn_risk"] > 0.15]
        predicted_churn_rate = round((len(high_risk_clients) / total_clients) * 100, 1)
        
        # Growth prediction
        expansion_revenue = sum(
            c["monthly_value"] * (c["growth_potential"] - 1)
            for c in self._clients
        )
        
        return {
            "overview": {
                "total_clients": total_clients,
                "monthly_recurring_revenue": round(total_mrr, 2),
                "annual_recurring_revenue": round(total_arr, 2),
                "average_contract_value": avg_contract_value,
                "profitability_index": profitability_index,
                "customer_lifetime_months": avg_retention_months
            },
            "growth_metrics": {
                "monthly_growth_rate": mom_growth,
                "predicted_churn_rate": predicted_churn_rate,
                "at_risk_clients": len(high_risk_clients),
                "expansion_opportunity": round(expansion_revenue, 2)
            },
            "forecasts": {
                "next_month_mrr": round(total_mrr * (1 + mom_growth / 100), 2),
                "next_quarter_revenue": round(total_mrr * 3 * (1 + mom_growth / 300), 2),
                "end_of_year_arr": round(total_arr * (1 + mom_growth / 100) ** 12, 2)
            },
            "model_info": {
                "model": "ARIMA + Random Forest Ensemble (Demo)",
                "last_updated": datetime.now().isoformat(),
                "accuracy_score": 0.89
            },
            "is_demo": True
        }
    
    def get_client_breakdown(self) -> Dict:
        """Get client segmentation analysis."""
        by_tier = {}
        by_industry = {}
        
        for client in self._clients:
            tier = client["tier"]
            industry = client["industry"]
            
            if tier not in by_tier:
                by_tier[tier] = {"count": 0, "total_value": 0}
            by_tier[tier]["count"] += 1
            by_tier[tier]["total_value"] += client["monthly_value"]
            
            if industry not in by_industry:
                by_industry[industry] = {"count": 0, "total_value": 0}
            by_industry[industry]["count"] += 1
            by_industry[industry]["total_value"] += client["monthly_value"]
        
        return {
            "by_tier": by_tier,
            "by_industry": by_industry,
            "is_demo": True
        }
    
    def get_churn_predictions(self, top_n: int = 10) -> List[Dict]:
        """Get clients at risk of churning."""
        at_risk = sorted(self._clients, key=lambda x: x["churn_risk"], reverse=True)[:top_n]
        
        return [
            {
                "client_id": c["client_id"],
                "client_name": c["client_name"],
                "churn_probability": round(c["churn_risk"] * 100, 1),
                "monthly_value_at_risk": c["monthly_value"],
                "recommended_actions": [
                    "Schedule quarterly business review",
                    "Offer service optimization assessment",
                    "Provide pricing incentive for renewal"
                ][:random.randint(1, 3)],
                "risk_factors": random.sample([
                    "Below average satisfaction score",
                    "Decreased ticket volume",
                    "Payment delays",
                    "Reduced engagement",
                    "Competitive pressure"
                ], k=random.randint(2, 3))
            }
            for c in at_risk
        ]
    
    def get_growth_opportunities(self, top_n: int = 10) -> List[Dict]:
        """Get expansion opportunities."""
        opportunities = sorted(
            self._clients,
            key=lambda x: x["monthly_value"] * x["growth_potential"],
            reverse=True
        )[:top_n]
        
        return [
            {
                "client_id": c["client_id"],
                "client_name": c["client_name"],
                "current_monthly_value": c["monthly_value"],
                "predicted_expansion_value": round(c["monthly_value"] * c["growth_potential"], 2),
                "expansion_potential_percent": round((c["growth_potential"] - 1) * 100, 1),
                "recommended_upsells": random.sample([
                    "Endpoint Security Suite",
                    "Cloud Backup & DR",
                    "24/7 Premium Support",
                    "SIEM Security Monitoring",
                    "Database Management",
                    "Application Performance Monitoring"
                ], k=random.randint(2, 4)),
                "engagement_score": round(c["satisfaction_score"], 1),
                "months_active": c["months_active"]
            }
            for c in opportunities
        ]


# Global instance
growth_dashboard = GrowthDashboard()


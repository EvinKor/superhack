"""AI Predictive Pricing Engine - Demo with dummy data.

This module simulates ML-powered pricing optimization.
In production, this would be replaced with a real SageMaker model.
"""

import logging
import random
from typing import List, Dict
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class PredictivePricingEngine:
    """Simulates predictive pricing recommendations."""
    
    def __init__(self):
        self._historical_data = self._generate_dummy_historical_data()
    
    def _generate_dummy_historical_data(self) -> List[Dict]:
        """Generate synthetic historical pricing data."""
        return [
            {
                "client_id": f"C{1000 + i}",
                "client_name": f"Client {i}",
                "industry": random.choice(["Healthcare", "Retail", "Manufacturing", "Finance", "Education"]),
                "contracted_price": random.randint(5000, 50000),
                "actual_value": random.randint(6000, 55000),
                "retention_months": random.randint(6, 36)
            }
            for i in range(50)
        ]
    
    def predict_optimal_price(
        self,
        client_id: str,
        current_services: List[str],
        client_industry: str = "General",
        user_count: int = 100
    ) -> Dict:
        """
        Simulate predictive pricing optimization.
        
        Args:
            client_id: Client identifier
            current_services: List of service IDs
            client_industry: Industry vertical
            user_count: Number of users
        
        Returns:
            Pricing prediction with recommendations
        """
        logger.info(f"Generating predictive pricing for client {client_id}")
        
        # Simulate base price calculation
        base_price = len(current_services) * 1500 + user_count * 50
        
        # Add industry-based variance
        industry_multipliers = {
            "Healthcare": 1.25,  # Higher compliance needs
            "Finance": 1.30,      # Strict security requirements
            "Retail": 1.10,
            "Manufacturing": 1.15,
            "Education": 0.95
        }
        multiplier = industry_multipliers.get(client_industry, 1.0)
        
        # Simulate ML prediction with confidence
        predicted_price = round(base_price * multiplier * random.uniform(0.95, 1.15), 2)
        confidence = round(random.uniform(0.85, 0.98), 2)
        
        # Generate upsell recommendations
        all_upsells = [
            "Upgrade to Platinum SLA for 99.95% uptime guarantee",
            "Add Endpoint Detection & Response (EDR) for enhanced security",
            "Include Backup & Disaster Recovery service",
            "Expand to 24/7 Help Desk Support",
            "Add Cloud Infrastructure Management",
            "Implement SIEM Security Monitoring",
            "Enable VPN & Remote Access for distributed workforce",
            "Add Microsoft 365 Management",
            "Include Identity & Access Management (IAM)",
            "Add Database Administration services"
        ]
        
        upsell_recommendations = random.sample(all_upsells, k=random.randint(2, 4))
        
        # Calculate potential margin
        current_margin_percent = random.uniform(12, 25)
        suggested_margin_percent = min(current_margin_percent + random.uniform(3, 8), 30)
        margin_suggestion = f"+{suggested_margin_percent - current_margin_percent:.1f}%"
        
        # Simulate competitive analysis
        market_avg = predicted_price * random.uniform(0.9, 1.1)
        competitive_position = "Below Market" if predicted_price < market_avg else "Above Market"
        
        # Revenue impact simulation
        estimated_annual_value = predicted_price * 12
        potential_expansion = round(estimated_annual_value * random.uniform(1.15, 1.40), 2)
        
        return {
            "client_id": client_id,
            "industry": client_industry,
            "user_count": user_count,
            "current_services_count": len(current_services),
            "predicted_optimal_price": predicted_price,
            "confidence_score": confidence,
            "upsell_recommendations": upsell_recommendations,
            "margin_suggestion": margin_suggestion,
            "current_margin_percent": round(current_margin_percent, 1),
            "suggested_margin_percent": round(suggested_margin_percent, 1),
            "competitive_analysis": {
                "market_average": round(market_avg, 2),
                "position": competitive_position,
                "differential_percent": round(((predicted_price - market_avg) / market_avg) * 100, 1)
            },
            "revenue_impact": {
                "monthly_recurring": predicted_price,
                "estimated_annual_value": estimated_annual_value,
                "potential_expansion_value": potential_expansion,
                "expansion_opportunity_percent": round(((potential_expansion - estimated_annual_value) / estimated_annual_value) * 100, 1)
            },
            "model_info": {
                "model_type": "XGBoost Regressor (Demo)",
                "features_used": ["service_count", "user_count", "industry", "historical_patterns"],
                "last_trained": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
            },
            "is_demo": True
        }
    
    def get_pricing_trends(self, months: int = 6) -> Dict:
        """Simulate pricing trends analysis."""
        trends = []
        for i in range(months):
            month_date = datetime.now() - timedelta(days=30 * (months - i - 1))
            trends.append({
                "month": month_date.strftime("%Y-%m"),
                "avg_contract_value": round(random.uniform(12000, 25000), 2),
                "avg_margin_percent": round(random.uniform(15, 25), 1),
                "deals_closed": random.randint(5, 20),
                "avg_deal_size": round(random.uniform(8000, 18000), 2)
            })
        
        return {
            "trends": trends,
            "summary": {
                "overall_growth": round(random.uniform(5, 15), 1),
                "margin_improvement": round(random.uniform(2, 6), 1),
                "pricing_volatility": round(random.uniform(0.05, 0.15), 2)
            }
        }


# Global instance
pricing_engine = PredictivePricingEngine()


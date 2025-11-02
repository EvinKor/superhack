"""
Test script to demonstrate AI Proposal Assistant API.

Run the server first:
    uvicorn ai_proposal.server:app --reload

Then run this script:
    python test_proposal_api.py
"""

import requests
import json
import time
from pathlib import Path


API_BASE = "http://localhost:8000/api/v1"


def test_health():
    """Test health endpoint."""
    print("🏥 Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    data = response.json()
    
    print(f"✅ Status: {data['status']}")
    print(f"   Version: {data['version']}")
    print(f"   Services loaded: {data['capabilities'].get('services_loaded', 0)}")
    print(f"   SLAs loaded: {data['capabilities'].get('slas_loaded', 0)}")
    print(f"   Tiers loaded: {data['capabilities'].get('tiers_loaded', 0)}")
    print()


def test_generate_proposal():
    """Test proposal generation."""
    print("📝 Generating proposal...")
    
    payload = {
        "client_name": "Acme Retail Corporation",
        "requirements": (
            "We need comprehensive IT services for 120 employees across 3 locations. "
            "Requirements include AWS cloud migration from on-prem servers, "
            "24/7 SIEM security monitoring, regular vulnerability scanning, "
            "managed firewall services, help desk support for all users, "
            "email security, and backup/disaster recovery. "
            "High uptime is critical for our e-commerce operations."
        ),
        "pricing_tier_id": "TIER_STANDARD",
        "sla_id": "SLA_GOLD",
        "quantities": {
            "S007": 120,  # Help desk for 120 users
            "S008": 120   # Email security for 120 users
        },
        "use_llm": False
    }
    
    response = requests.post(
        f"{API_BASE}/proposals/generate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None
    
    data = response.json()
    
    print("✅ Proposal generated successfully!")
    print(f"   Proposal ID: {data['proposal_id']}")
    print(f"   Client: {data['client_name']}")
    print(f"   Total Price: ${data['total_price']:,.2f}/month")
    print(f"   Services: {len(data['bom'])} line items")
    print(f"   File: {data['file_path']}")
    print()
    
    print("📊 Bill of Materials:")
    for item in data['bom']:
        print(f"   - {item['service_name']}: {item['quantity']} {item['unit']} × ${item['unit_price']:.2f} = ${item['extended']:.2f}")
    print()
    
    print(f"💰 Pricing Breakdown:")
    print(f"   Base Subtotal: ${data['subtotal_base']:,.2f}")
    print(f"   {data['tier']['name']} (×{data['tier']['base_multiplier']}): ${data['subtotal_tiered']:,.2f}")
    print(f"   {data['sla']['name']} (×{data['sla']['price_multiplier']}): ${data['total_price']:,.2f}")
    print()
    
    return data['proposal_id']


def test_download_proposal(proposal_id):
    """Test proposal download."""
    if not proposal_id:
        print("⚠️  Skipping download test (no proposal ID)")
        return
    
    print(f"📥 Downloading proposal {proposal_id}...")
    
    response = requests.get(f"{API_BASE}/proposals/{proposal_id}/download")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return
    
    # Save to local file
    filename = f"test_proposal_{proposal_id[:8]}.md"
    Path(filename).write_bytes(response.content)
    
    print(f"✅ Downloaded to: {filename}")
    print(f"   Size: {len(response.content)} bytes")
    print()


def test_multiple_scenarios():
    """Test different tier/SLA combinations."""
    print("🎯 Testing multiple scenarios...")
    
    scenarios = [
        {
            "name": "Small Business - Bronze",
            "client_name": "Small Biz LLC",
            "requirements": "Basic monitoring and helpdesk for 25 users",
            "tier": "TIER_STARTER",
            "sla": "SLA_BRONZE",
            "quantities": {}
        },
        {
            "name": "Growing Company - Silver",
            "client_name": "GrowthCo Inc",
            "requirements": "Cloud services, security monitoring, support for 75 users",
            "tier": "TIER_STANDARD",
            "sla": "SLA_SILVER",
            "quantities": {}
        },
        {
            "name": "Enterprise - Platinum",
            "client_name": "BigCorp Enterprise",
            "requirements": "Full managed services stack with compliance requirements for 500 users",
            "tier": "TIER_ENTERPRISE",
            "sla": "SLA_PLATINUM",
            "quantities": {}
        }
    ]
    
    for scenario in scenarios:
        print(f"\n📋 Scenario: {scenario['name']}")
        
        payload = {
            "client_name": scenario["client_name"],
            "requirements": scenario["requirements"],
            "pricing_tier_id": scenario["tier"],
            "sla_id": scenario["sla"],
            "quantities": scenario["quantities"],
            "use_llm": False
        }
        
        response = requests.post(f"{API_BASE}/proposals/generate", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Generated: ${data['total_price']:,.2f}/month")
            print(f"   Services: {len(data['bom'])}")
        else:
            print(f"   ❌ Failed: {response.status_code}")
    
    print()


def test_data_reload():
    """Test data reload endpoint."""
    print("🔄 Testing data reload...")
    
    response = requests.post(f"{API_BASE}/proposals/reload-data")
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return
    
    data = response.json()
    print(f"✅ Data reloaded:")
    print(f"   Services: {data['counts']['services']}")
    print(f"   SLAs: {data['counts']['slas']}")
    print(f"   Tiers: {data['counts']['tiers']}")
    print()


def main():
    """Run all tests."""
    print("="* 60)
    print("🤖 AI Proposal Assistant - API Test Suite")
    print("="* 60)
    print()
    
    try:
        # Test 1: Health check
        test_health()
        
        # Test 2: Generate main proposal
        proposal_id = test_generate_proposal()
        
        # Test 3: Download proposal
        test_download_proposal(proposal_id)
        
        # Test 4: Multiple scenarios
        test_multiple_scenarios()
        
        # Test 5: Data reload
        test_data_reload()
        
        print("="* 60)
        print("✅ All tests completed!")
        print("="* 60)
        print()
        print("Next steps:")
        print("1. Check generated Markdown files in output/proposals/")
        print("2. Review the downloaded test proposal")
        print("3. Visit http://localhost:8000/docs for interactive API")
        print()
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("   Make sure the server is running:")
        print("   uvicorn ai_proposal.server:app --reload")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()


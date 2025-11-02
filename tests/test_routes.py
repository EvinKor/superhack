"""Tests for API routes."""

import pytest
from fastapi.testclient import TestClient
from ai_proposal.server import app


client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["name"] == "AI Proposal Assistant"


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data
    assert "version" in data


def test_generate_proposal_success():
    """Test successful proposal generation."""
    payload = {
        "client_name": "Acme Retail",
        "requirements": "Need AWS cloud migration, SIEM, vuln scans, helpdesk for 120 users. High uptime.",
        "pricing_tier_id": "TIER_STANDARD",
        "sla_id": "SLA_GOLD",
        "quantities": {"S007": 120},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "proposal_id" in data
    assert "summary" in data
    assert "bom" in data
    assert "total_price" in data
    assert "file_path" in data
    assert data["client_name"] == "Acme Retail"
    assert len(data["bom"]) > 0
    assert data["total_price"] > 0


def test_generate_proposal_invalid_tier():
    """Test proposal generation with invalid tier."""
    payload = {
        "client_name": "Test Client",
        "requirements": "Need monitoring and support",
        "pricing_tier_id": "INVALID_TIER",
        "sla_id": "SLA_GOLD",
        "quantities": {},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 400
    assert "Invalid pricing tier" in response.json()["detail"]


def test_generate_proposal_invalid_sla():
    """Test proposal generation with invalid SLA."""
    payload = {
        "client_name": "Test Client",
        "requirements": "Need monitoring and support",
        "pricing_tier_id": "TIER_STANDARD",
        "sla_id": "INVALID_SLA",
        "quantities": {},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 400
    assert "Invalid SLA" in response.json()["detail"]


def test_generate_proposal_missing_fields():
    """Test proposal generation with missing required fields."""
    payload = {
        "client_name": "Test Client",
        "requirements": "Need services"
        # Missing tier and SLA
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 422  # Validation error


def test_generate_proposal_minimal_requirements():
    """Test proposal with minimal requirements."""
    payload = {
        "client_name": "Small Business",
        "requirements": "Basic IT support needed",
        "pricing_tier_id": "TIER_STARTER",
        "sla_id": "SLA_BRONZE",
        "quantities": {},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["bom"]) > 0  # Should have fallback services


def test_download_proposal_not_found():
    """Test downloading non-existent proposal."""
    response = client.get("/api/v1/proposals/nonexistent-id/download")
    assert response.status_code == 404


def test_download_proposal_success():
    """Test downloading an existing proposal."""
    # First generate a proposal
    payload = {
        "client_name": "Download Test",
        "requirements": "Need monitoring for 50 devices",
        "pricing_tier_id": "TIER_STANDARD",
        "sla_id": "SLA_GOLD",
        "quantities": {},
        "use_llm": False
    }
    
    gen_response = client.post("/api/v1/proposals/generate", json=payload)
    assert gen_response.status_code == 200
    proposal_id = gen_response.json()["proposal_id"]
    
    # Now download it
    download_response = client.get(f"/api/v1/proposals/{proposal_id}/download")
    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "text/markdown; charset=utf-8"
    assert "Content-Disposition" in download_response.headers


def test_reload_data():
    """Test data reload endpoint."""
    response = client.post("/api/v1/proposals/reload-data")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "counts" in data
    assert data["counts"]["services"] > 0


def test_proposal_with_quantity_overrides():
    """Test proposal generation with quantity overrides."""
    payload = {
        "client_name": "Custom Quantities Corp",
        "requirements": "Need cloud, monitoring, and helpdesk",
        "pricing_tier_id": "TIER_PREMIUM",
        "sla_id": "SLA_SILVER",
        "quantities": {
            "S001": 75,  # Override monitoring
            "S007": 150  # Override helpdesk
        },
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Check that overrides were applied
    bom = data["bom"]
    for item in bom:
        if item["service_id"] == "S007":
            assert item["quantity"] == 150


def test_proposal_input_validation():
    """Test input validation for dangerous patterns."""
    payload = {
        "client_name": "Test",
        "requirements": "<script>alert('xss')</script>",  # Should be rejected
        "pricing_tier_id": "TIER_STANDARD",
        "sla_id": "SLA_GOLD",
        "quantities": {},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 422  # Validation error


@pytest.mark.parametrize("tier_id,sla_id", [
    ("TIER_STARTER", "SLA_BRONZE"),
    ("TIER_STANDARD", "SLA_SILVER"),
    ("TIER_PREMIUM", "SLA_GOLD"),
    ("TIER_ENTERPRISE", "SLA_PLATINUM"),
])
def test_all_tier_sla_combinations(tier_id, sla_id):
    """Test all valid tier and SLA combinations."""
    payload = {
        "client_name": f"Test {tier_id} {sla_id}",
        "requirements": "Need comprehensive IT services with monitoring, security, and support",
        "pricing_tier_id": tier_id,
        "sla_id": sla_id,
        "quantities": {},
        "use_llm": False
    }
    
    response = client.post("/api/v1/proposals/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["tier"]["tier_id"] == tier_id
    assert data["sla"]["sla_id"] == sla_id


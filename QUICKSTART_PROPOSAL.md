# 🚀 AI Proposal Assistant - Quick Start Guide

Get your proposal generation API running in 5 minutes!

## ⚡ Super Quick Start

### On Windows (PowerShell):

```powershell
# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn ai_proposal.server:app --reload --port 8000
```

### On Linux/Mac:

```bash
# Install dependencies
pip install -r requirements.txt

# Start server  
uvicorn ai_proposal.server:app --reload --port 8000
```

The server starts at http://localhost:8000

## 🎯 Test It Immediately

### 1. Open Browser

Visit: http://localhost:8000/docs

You'll see the interactive API documentation (Swagger UI).

### 2. Generate Your First Proposal

Click on **POST /api/v1/proposals/generate** → **Try it out**

Paste this example:

```json
{
  "client_name": "Acme Retail",
  "requirements": "Need AWS cloud migration, SIEM, vulnerability scans, and helpdesk support for 120 users. Require high uptime guarantees.",
  "pricing_tier_id": "TIER_STANDARD",
  "sla_id": "SLA_GOLD",
  "quantities": {
    "S007": 120
  },
  "use_llm": false
}
```

Click **Execute** → You'll get a complete proposal!

### 3. Download the Proposal

Copy the `proposal_id` from the response.

Visit: http://localhost:8000/api/v1/proposals/{proposal_id}/download

The Markdown file downloads automatically! 📄

## 📋 Or Use cURL

```bash
# Generate proposal
curl -X POST http://localhost:8000/api/v1/proposals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Acme Retail",
    "requirements": "Need AWS migration, SIEM, vuln scans, helpdesk for 120 users. High uptime.",
    "pricing_tier_id": "TIER_STANDARD",
    "sla_id": "SLA_GOLD",
    "quantities": {"S007": 120},
    "use_llm": false
  }' | python -m json.tool

# Download proposal (replace {id} with actual proposal_id)
curl -O http://localhost:8000/api/v1/proposals/{id}/download
```

## 🎛️ Available Pricing Tiers

- `TIER_STARTER` - For small businesses (<25 users)
- `TIER_STANDARD` - Most popular (25-100 users)
- `TIER_PREMIUM` - Growing companies (100-250 users)
- `TIER_ENTERPRISE` - Large organizations (250+ users)

## 🏆 Available SLA Levels

- `SLA_BRONZE` - Business hours support (99.0% uptime)
- `SLA_SILVER` - Extended hours support (99.5% uptime)
- `SLA_GOLD` - 24x7 support (99.9% uptime)
- `SLA_PLATINUM` - 24x7 + dedicated TAM (99.95% uptime)

## 📊 Check What's Loaded

```bash
curl http://localhost:8000/api/v1/health
```

You'll see:
- Number of services loaded from catalog
- Number of SLA templates
- Number of pricing tiers
- AWS capabilities (if configured)

## 🎨 Customize Services

Edit these CSV files:

- `data/service_catalog.csv` - Add/modify services
- `data/sla_templates.csv` - Customize SLA levels
- `data/pricing_tiers.csv` - Adjust tier multipliers

Changes are auto-reloaded! Or force reload:

```bash
curl -X POST http://localhost:8000/api/v1/proposals/reload-data
```

## 🤖 Optional: Enable AI Features

### For ML-powered service selection:

```env
SM_ENDPOINT_NAME=your-sagemaker-endpoint
AWS_REGION=us-east-1
```

### For LLM content polishing:

```env
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
AWS_REGION=us-east-1
```

Then set `"use_llm": true` in your requests.

## 🧪 Run Tests

```bash
# Install test dependencies (already in requirements.txt)
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/ -v

# Or use make
make test
```

All tests should pass! ✅

## 📂 Where Are Generated Files?

All proposals are saved to:

```
output/proposals/proposal_{uuid}.md
```

## 🔧 Troubleshooting

### Port 8000 already in use?

```bash
uvicorn ai_proposal.server:app --reload --port 8080
```

### Can't find module 'ai_proposal'?

Make sure you're in the project root directory:

```bash
cd /path/to/superhack
python -m uvicorn ai_proposal.server:app --reload
```

### Services not being selected?

Check the keywords in `data/service_catalog.csv`. The system matches keywords from your requirements text.

### Want to see detailed logs?

```bash
export LOG_LEVEL=DEBUG  # Linux/Mac
# or
set LOG_LEVEL=DEBUG     # Windows

uvicorn ai_proposal.server:app --reload
```

## 🚢 Production Deployment

For production with multiple workers:

```bash
uvicorn ai_proposal.server:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --no-access-log \
  --log-level info
```

Or with Gunicorn:

```bash
gunicorn ai_proposal.server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

## 🌐 Integration with Your Frontend

```javascript
// Example React/JavaScript integration
async function generateProposal(clientData) {
  const response = await fetch('http://localhost:8000/api/v1/proposals/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_name: clientData.name,
      requirements: clientData.requirements,
      pricing_tier_id: 'TIER_STANDARD',
      sla_id: 'SLA_GOLD',
      quantities: {},
      use_llm: false
    })
  });
  
  const proposal = await response.json();
  console.log('Generated:', proposal.proposal_id);
  
  // Download link
  const downloadUrl = `http://localhost:8000/api/v1/proposals/${proposal.proposal_id}/download`;
  window.open(downloadUrl, '_blank');
}
```

## 🎓 Learn More

- Full Documentation: See `AI_PROPOSAL_README.md`
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## ✅ You're Ready!

Your AI Proposal Assistant is now running. Generate professional MSP proposals in seconds!

Need help? Check the main README or open an issue.

---

Happy proposing! 🎉


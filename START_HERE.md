# 🚀 AI Proposal Assistant - Start Here!

## ✅ Installation Complete!

All dependencies are installed and ready to go.

## 🎯 Start the Server (Choose One Method)

### Method 1: PowerShell Script (Easiest)

```powershell
.\start-proposal.ps1
```

### Method 2: Direct Command

```powershell
C:/Users/Craaazyyyy/AppData/Local/Programs/Python/Python314/python.exe -m uvicorn ai_proposal.server:app --reload --host 0.0.0.0 --port 8000
```

### Method 3: If Python is in PATH

```powershell
python -m uvicorn ai_proposal.server:app --reload --port 8000
```

## 📍 Access Points

Once the server starts, visit:

- **Interactive API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health  
- **Alternative Docs**: http://localhost:8000/redoc

## 🧪 Test It Immediately

### Option 1: Use the Web Interface

1. Open http://localhost:8000/docs
2. Click on **POST /api/v1/proposals/generate**
3. Click **Try it out**
4. Paste this example:

```json
{
  "client_name": "Acme Retail",
  "requirements": "Need AWS cloud migration, SIEM, vulnerability scans, and helpdesk support for 120 users. High uptime required.",
  "pricing_tier_id": "TIER_STANDARD",
  "sla_id": "SLA_GOLD",
  "quantities": {
    "S007": 120
  },
  "use_llm": false
}
```

5. Click **Execute**
6. See the generated proposal!

### Option 2: Run Test Script

```powershell
python test_proposal_api.py
```

### Option 3: Use PowerShell Invoke-WebRequest

```powershell
$body = @{
    client_name = "Test Company"
    requirements = "Need monitoring and support for 50 users"
    pricing_tier_id = "TIER_STANDARD"
    sla_id = "SLA_GOLD"
    quantities = @{}
    use_llm = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/proposals/generate" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" | Select-Object -ExpandProperty Content
```

## 📥 Generated Proposals

All proposals are saved to:

```
output/proposals/proposal_{uuid}.md
```

You can download them via the API or open them directly.

## 🎨 Customize Your Installation

### 1. Add Your Services

Edit `data/service_catalog.csv`:
- Add rows with your service offerings
- Include keywords for matching
- Set unit prices

### 2. Adjust Pricing Tiers

Edit `data/pricing_tiers.csv`:
- Modify multipliers (0.85-1.0)
- Set minimum monthly amounts
- Define user limits

### 3. Customize Proposal Template

Edit `templates/proposal_template.md`:
- Add your company logo reference
- Include your contact information
- Customize sections and styling

### 4. Reload Data Without Restart

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/proposals/reload-data" -Method POST
```

## 🔧 Troubleshooting

### "Cannot connect to localhost:8000"

Make sure the server is running. Check for error messages in the terminal.

### "Module not found: ai_proposal"

Ensure you're running from the project root:
```powershell
cd C:\Users\Craaazyyyy\Documents\www\superhack
```

### "Port 8000 already in use"

Change the port:
```powershell
python -m uvicorn ai_proposal.server:app --reload --port 8080
```

### Unicode/Emoji Errors in Console

This is just a display issue with Windows console. The server works fine, just some emojis won't display.

## 📚 Full Documentation

- **QUICKSTART_PROPOSAL.md** - Quick start guide (5 minutes)
- **AI_PROPOSAL_README.md** - Complete documentation
- **AI_PROPOSAL_INTEGRATION.md** - Integration with your MSP platform
- **AI_PROPOSAL_SUMMARY.md** - Feature summary

## 🎉 You're Ready!

Your AI Proposal Assistant is fully installed and ready to generate professional MSP proposals!

**Next command to run:**

```powershell
.\start-proposal.ps1
```

Then visit http://localhost:8000/docs to start generating proposals! 🚀


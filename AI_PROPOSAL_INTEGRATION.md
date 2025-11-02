# 🔗 Integrating AI Proposal Assistant with Your MSP Platform

This guide shows how to integrate the AI Proposal Assistant with your existing Node.js/React MSP platform.

## 🏗️ Architecture Overview

```
Your MSP Platform (Port 5000)
    ↓
    ├─→ Supabase PostgreSQL (Data Storage)
    └─→ AI Proposal Assistant (Port 8000) → Generates Proposals
```

The AI Proposal Assistant runs as a **separate microservice** alongside your main backend.

## 🚀 Running Both Services

### Option 1: Separate Terminals

**Terminal 1 - MSP Platform Backend:**
```bash
cd C:\Users\Craaazyyyy\Documents\www\superhack
npm run dev
```

**Terminal 2 - AI Proposal Assistant:**
```bash
cd C:\Users\Craaazyyyy\Documents\www\superhack
uvicorn ai_proposal.server:app --reload --port 8000
```

### Option 2: Process Manager (Production)

Use PM2 or similar:

```bash
# Start MSP backend
pm2 start "npm run backend" --name msp-backend

# Start proposal service
pm2 start "uvicorn ai_proposal.server:app --host 0.0.0.0 --port 8000" --name proposal-service

# View status
pm2 status
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  msp-backend:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
  
  proposal-service:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./templates:/app/templates
      - ./output:/app/output
    environment:
      - AWS_REGION=${AWS_REGION}
```

## 💻 Frontend Integration

### Add Proposal Generation to React Frontend

**1. Create Proposal Service:**

```javascript
// frontend/src/services/proposalApi.js
import axios from 'axios';

const PROPOSAL_API = 'http://localhost:8000/api/v1';

export const proposalService = {
  /**
   * Generate a new proposal
   */
  async generate(proposalData) {
    const response = await axios.post(`${PROPOSAL_API}/proposals/generate`, {
      client_name: proposalData.clientName,
      requirements: proposalData.requirements,
      pricing_tier_id: proposalData.pricingTier,
      sla_id: proposalData.slaLevel,
      quantities: proposalData.quantities || {},
      use_llm: proposalData.useLLM || false
    });
    return response.data;
  },

  /**
   * Download proposal file
   */
  downloadProposal(proposalId) {
    window.open(`${PROPOSAL_API}/proposals/${proposalId}/download`, '_blank');
  },

  /**
   * Get available tiers and SLAs
   */
  async getOptions() {
    const response = await axios.get(`${PROPOSAL_API}/health`);
    return response.data.capabilities;
  }
};
```

**2. Create Proposal Page Component:**

```jsx
// frontend/src/pages/ProposalGenerator.js
import React, { useState } from 'react';
import { proposalService } from '../services/proposalApi';

export default function ProposalGenerator() {
  const [formData, setFormData] = useState({
    clientName: '',
    requirements: '',
    pricingTier: 'TIER_STANDARD',
    slaLevel: 'SLA_GOLD',
    quantities: {},
    useLLM: false
  });
  
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await proposalService.generate(formData);
      setProposal(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (proposal) {
      proposalService.downloadProposal(proposal.proposal_id);
    }
  };

  return (
    <div className="proposal-generator">
      <h1>AI Proposal Generator</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Client Name:</label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Requirements:</label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData({...formData, requirements: e.target.value})}
            rows={6}
            placeholder="Describe the client's IT needs, number of users, services required..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Pricing Tier:</label>
            <select
              value={formData.pricingTier}
              onChange={(e) => setFormData({...formData, pricingTier: e.target.value})}
            >
              <option value="TIER_STARTER">Starter</option>
              <option value="TIER_STANDARD">Standard</option>
              <option value="TIER_PREMIUM">Premium</option>
              <option value="TIER_ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div className="form-group">
            <label>SLA Level:</label>
            <select
              value={formData.slaLevel}
              onChange={(e) => setFormData({...formData, slaLevel: e.target.value})}
            >
              <option value="SLA_BRONZE">Bronze (99.0%)</option>
              <option value="SLA_SILVER">Silver (99.5%)</option>
              <option value="SLA_GOLD">Gold (99.9%)</option>
              <option value="SLA_PLATINUM">Platinum (99.95%)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Proposal'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {proposal && (
        <div className="proposal-result">
          <h2>✅ Proposal Generated!</h2>
          <div className="proposal-summary">
            <p><strong>Proposal ID:</strong> {proposal.proposal_id}</p>
            <p><strong>Total Price:</strong> ${proposal.total_price.toLocaleString()}/month</p>
            <p><strong>Services:</strong> {proposal.bom.length} items</p>
          </div>

          <h3>Bill of Materials</h3>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {proposal.bom.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.service_name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td>${item.extended.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleDownload} className="download-btn">
            📥 Download Proposal (Markdown)
          </button>
        </div>
      )}
    </div>
  );
}
```

**3. Add Route:**

```javascript
// frontend/src/App.js
import ProposalGenerator from './pages/ProposalGenerator';

// Add to routes
<Route path="/proposals/generate" element={<ProposalGenerator />} />
```

## 🔌 Backend Integration

### Call from Node.js Backend

```javascript
// server/src/services/proposalService.js
const axios = require('axios');

const PROPOSAL_API = process.env.PROPOSAL_API_URL || 'http://localhost:8000/api/v1';

class ProposalService {
  async generateForClient(clientId) {
    // Fetch client data from Supabase
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (!client) {
      throw new Error('Client not found');
    }

    // Build requirements from client data
    const requirements = this.buildRequirements(client);

    // Generate proposal
    const response = await axios.post(`${PROPOSAL_API}/proposals/generate`, {
      client_name: client.client_name,
      requirements,
      pricing_tier_id: 'TIER_STANDARD',
      sla_id: 'SLA_GOLD',
      quantities: {},
      use_llm: false
    });

    // Optionally store proposal reference in database
    await supabase.from('proposals').insert({
      client_id: clientId,
      proposal_id: response.data.proposal_id,
      total_price: response.data.total_price,
      created_at: new Date().toISOString()
    });

    return response.data;
  }

  buildRequirements(client) {
    // Auto-generate requirements from client profile
    return `
      ${client.industry} company requiring managed IT services.
      Infrastructure: ${client.server_count || 'TBD'} servers, ${client.user_count || 50} users.
      Primary needs: Monitoring, security, helpdesk support.
      Additional requirements: ${client.notes || 'Standard MSP services'}.
    `.trim();
  }
}

module.exports = new ProposalService();
```

### Add Express Route:

```javascript
// server/src/routes/proposals.js
const express = require('express');
const router = express.Router();
const proposalService = require('../services/proposalService');
const { authenticate } = require('../middleware/auth');

router.post('/clients/:clientId/generate-proposal', authenticate, async (req, res) => {
  try {
    const proposal = await proposalService.generateForClient(req.params.clientId);
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// In server.ts, add:
// app.use('/api/proposals', require('./routes/proposals'));
```

## 📊 Database Schema Extension

Add proposal tracking to Supabase:

```sql
-- Proposals table to track generated proposals
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id VARCHAR(255) NOT NULL UNIQUE,
  total_price DECIMAL(12,2),
  pricing_tier VARCHAR(50),
  sla_level VARCHAR(50),
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
```

## 🔐 Security Considerations

### 1. Add API Gateway/Reverse Proxy

```nginx
# nginx.conf
upstream msp_backend {
    server localhost:5000;
}

upstream proposal_service {
    server localhost:8000;
}

server {
    listen 80;
    
    location /api/msp/ {
        proxy_pass http://msp_backend/;
    }
    
    location /api/proposals/ {
        proxy_pass http://proposal_service/api/v1/;
    }
}
```

### 2. Add Authentication Middleware

```python
# ai_proposal/middleware.py
from fastapi import Header, HTTPException
import jwt

async def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization header")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Add to routes.py
@router.post("/proposals/generate", dependencies=[Depends(verify_token)])
```

### 3. Rate Limiting

```python
# ai_proposal/server.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/proposals/generate")
@limiter.limit("10/minute")
async def generate_proposal(request: Request, req: GenerateRequest):
    # ... existing code
```

## 📈 Monitoring & Logging

### Integrate with Your Logging System

```python
# ai_proposal/config.py
import logging
from pythonjsonlogger import jsonlogger

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(name)s %(levelname)s %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)
```

### Add Metrics Endpoint

```python
# ai_proposal/routes.py
from prometheus_client import Counter, Histogram
import time

proposals_generated = Counter('proposals_generated_total', 'Total proposals generated')
generation_duration = Histogram('proposal_generation_seconds', 'Time to generate proposal')

@router.post("/proposals/generate")
async def generate_proposal(req: GenerateRequest):
    start_time = time.time()
    try:
        # ... existing code ...
        proposals_generated.inc()
        return response
    finally:
        generation_duration.observe(time.time() - start_time)
```

## 🎯 Usage Examples

### From JavaScript/TypeScript:

```typescript
// Generate proposal for an existing client
const proposal = await fetch('http://localhost:5000/api/proposals/clients/123/generate-proposal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await proposal.json();
console.log(`Proposal generated: ${data.proposal_id}`);
```

### From Python (Backend Job):

```python
import requests

def batch_generate_proposals(client_ids):
    """Generate proposals for multiple clients."""
    for client_id in client_ids:
        response = requests.post(
            'http://localhost:5000/api/proposals/clients/{}/generate-proposal',
            headers={'Authorization': f'Bearer {token}'}
        )
        print(f"Generated for {client_id}: {response.json()['proposal_id']}")
```

## 🚀 Next Steps

1. **Test Integration**: Run both services and test the API calls
2. **Add UI**: Create frontend components for proposal generation
3. **Customize Templates**: Modify `templates/proposal_template.md`
4. **Add Services**: Update `data/service_catalog.csv` with your offerings
5. **Deploy**: Use Docker or systemd for production deployment

## 📞 Support

For integration issues:
1. Check server logs for both services
2. Verify network connectivity between services
3. Review CORS settings if calling from browser
4. Test with curl/Postman first before frontend integration

---

**Ready to integrate!** 🎉

The proposal service is designed as a microservice and can be deployed independently or alongside your existing stack.


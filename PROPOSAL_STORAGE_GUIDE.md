# 📁 Proposal File Storage Guide

## 🎯 Current Setup - Where Files Are Saved

### Local Storage (Default)

All generated proposals are saved to:
```
C:\Users\Craaazyyyy\Documents\www\superhack\output\proposals\
```

**File naming format:**
```
proposal_{uuid}.md
```

**Example:**
```
proposal_c309aee6-28b9-4a76-bdfe-14c1051664ec.md
```

---

## 📥 How to Access Generated Proposals

### Option 1: Download via API

```bash
# Get proposal ID from generation response
GET http://localhost:8000/api/v1/proposals/{proposal_id}/download
```

**Example:**
```bash
curl -O http://localhost:8000/api/v1/proposals/c309aee6-28b9-4a76-bdfe-14c1051664ec/download
```

### Option 2: Direct File Access

```powershell
# Open folder in Explorer
explorer C:\Users\Craaazyyyy\Documents\www\superhack\output\proposals

# Open specific file in VS Code
code output\proposals\proposal_c309aee6-28b9-4a76-bdfe-14c1051664ec.md

# Or Notepad
notepad output\proposals\proposal_c309aee6-28b9-4a76-bdfe-14c1051664ec.md
```

### Option 3: From Web Interface

Visit: http://localhost:8000/proposal-generator

1. Fill in client details
2. Click "Generate Proposal"
3. Click "📥 Download Full Proposal" button

---

## ☁️ Upload to Cloud Storage (Production)

### Option A: Supabase Storage (Recommended - You Already Have It!)

**Setup:**

1. **Create Storage Bucket in Supabase:**
   - Go to https://app.supabase.com
   - Select your project
   - Click "Storage" in sidebar
   - Click "Create a new bucket"
   - Name: `proposals`
   - Public: No (keep private)

2. **Add to .env:**
```env
# Add this line to your .env file
SUPABASE_BUCKET=proposals
```

3. **Install Supabase Python client:**
```bash
pip install supabase
```

4. **The system will automatically upload proposals to Supabase!**

**Access proposals:**
```javascript
// From your React frontend
const { data, error } = await supabase
  .storage
  .from('proposals')
  .download(`proposals/${proposalId}.md`)

// Or get signed URL for download link
const { data } = await supabase
  .storage
  .from('proposals')
  .createSignedUrl(`proposals/${proposalId}.md`, 3600) // 1 hour expiry
```

---

### Option B: AWS S3

**Setup:**

1. **Create S3 Bucket:**
```bash
aws s3 mb s3://your-company-proposals
```

2. **Add to .env:**
```env
AWS_S3_BUCKET=your-company-proposals
AWS_REGION=us-east-1
```

3. **Install boto3:**
```bash
pip install boto3
```

4. **Configure AWS credentials:**
```bash
aws configure
# Enter your AWS access key and secret
```

**The storage module will automatically upload to S3!**

**Access URLs:**
```
https://your-company-proposals.s3.us-east-1.amazonaws.com/proposals/{proposal_id}.md
```

---

### Option C: Azure Blob Storage

**Setup:**

1. **Create storage account and container**

2. **Add to .env:**
```env
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_CONTAINER_NAME=proposals
```

3. **Install Azure SDK:**
```bash
pip install azure-storage-blob
```

---

### Option D: Google Cloud Storage

**Setup:**

1. **Create GCS bucket**

2. **Add to .env:**
```env
GCS_BUCKET_NAME=your-proposals-bucket
GCS_PROJECT_ID=your-project-id
```

3. **Install Google Cloud SDK:**
```bash
pip install google-cloud-storage
```

---

## 💾 Save Proposals to Database (Track Metadata)

### Store Proposal Records in Supabase

Create a table to track all generated proposals:

```sql
-- In Supabase SQL Editor
CREATE TABLE proposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id VARCHAR(255) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id),
  total_price DECIMAL(12,2),
  pricing_tier VARCHAR(50),
  sla_level VARCHAR(50),
  services_count INTEGER,
  file_path TEXT,
  storage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'generated'
);

CREATE INDEX idx_proposal_history_client ON proposal_history(client_id);
CREATE INDEX idx_proposal_history_created_at ON proposal_history(created_at DESC);
```

**Then in your Node.js backend, after generating:**

```javascript
// server/src/services/proposalService.js
const axios = require('axios');
const { supabase } = require('../utils/supabase');

async function generateAndTrackProposal(clientId, userId) {
  // Generate via AI API
  const response = await axios.post('http://localhost:8000/api/v1/proposals/quick-generate', null, {
    params: {
      client_name: client.client_name,
      requirements: client.requirements,
      pricing_tier: 'TIER_STANDARD',
      sla_level: 'SLA_GOLD'
    }
  });

  const proposal = response.data;

  // Save to database
  await supabase.from('proposal_history').insert({
    proposal_id: proposal.proposal_id,
    client_name: proposal.client_name,
    client_id: clientId,
    total_price: proposal.pricing.total_with_sla,
    pricing_tier: proposal.summary.pricing_tier,
    sla_level: proposal.summary.sla_level,
    services_count: proposal.summary.services_selected,
    file_path: proposal.files.local_path,
    created_by: userId,
    status: 'generated'
  });

  return proposal;
}
```

---

## 🔗 Integration Options

### 1. Direct API Call from Frontend

```javascript
// React/JavaScript
async function generateProposal(clientData) {
  const response = await fetch('http://localhost:8000/api/v1/proposals/quick-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_name: clientData.name,
      requirements: clientData.requirements,
      pricing_tier: 'TIER_STANDARD',
      sla_level: 'SLA_GOLD'
    })
  });

  const proposal = await response.json();
  
  // Download file
  window.open(`http://localhost:8000/api/v1/proposals/${proposal.proposal_id}/download`);
  
  return proposal;
}
```

### 2. Proxy Through Node.js Backend

```javascript
// server/src/routes/proposals.js
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { clientId, requirements } = req.body;
    
    // Get client details
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    // Call AI API
    const aiResponse = await axios.post('http://localhost:8000/api/v1/proposals/quick-generate', null, {
      params: {
        client_name: client.client_name,
        requirements: requirements || `Services for ${client.industry} company`,
        pricing_tier: 'TIER_STANDARD',
        sla_level: 'SLA_GOLD'
      }
    });

    res.json(aiResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📤 Email Proposals Directly

### Option: Send via Email

Add email functionality:

```python
# ai_proposal/email_sender.py
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from pathlib import Path

def email_proposal(
    proposal_id: str,
    recipient_email: str,
    client_name: str,
    total_price: float
):
    """Send proposal via email."""
    
    # Read proposal file
    file_path = Path(f"output/proposals/proposal_{proposal_id}.md")
    
    # Create email
    msg = MIMEMultipart()
    msg['Subject'] = f'MSP Proposal for {client_name}'
    msg['From'] = 'proposals@yourcompany.com'
    msg['To'] = recipient_email

    # Email body
    body = f"""
    Dear {client_name},

    Thank you for your interest in our managed services!

    Please find attached your customized proposal with a total monthly 
    investment of ${total_price:,.2f}.

    We look forward to discussing this proposal with you.

    Best regards,
    Your MSP Team
    """
    
    msg.attach(MIMEText(body, 'plain'))

    # Attach proposal
    with open(file_path, 'rb') as f:
        attach = MIMEApplication(f.read(), _subtype="markdown")
        attach.add_header('Content-Disposition', 'attachment', filename=f'proposal.md')
        msg.attach(attach)

    # Send
    smtp = smtplib.SMTP('smtp.gmail.com', 587)
    smtp.starttls()
    smtp.login('your-email@gmail.com', 'your-app-password')
    smtp.send_message(msg)
    smtp.quit()
```

---

## 🌐 Web Interface Access Points

### New Simplified Generator

**URL:** http://localhost:8000/proposal-generator  
**OR:** http://localhost:8000/generator

**Features:**
- ✅ Beautiful user-friendly form
- ✅ Auto-fills example data
- ✅ Real-time generation
- ✅ Instant download
- ✅ Shows pricing breakdown
- ✅ Lists all services selected

### Full Feature Demo

**URL:** http://localhost:8000/demo

Shows all 4 AI modules.

### API Documentation

**URL:** http://localhost:8000/docs

Test all endpoints interactively.

---

## 🎯 Recommended Workflow

### For Development/Testing

1. Generate proposals locally
2. Files saved to `output/proposals/`
3. Download via API or web interface

### For Production

**Option 1: Supabase Storage (Easiest)**
```env
SUPABASE_BUCKET=proposals
```
- Integrated with your existing Supabase
- Automatic uploads
- Secure signed URLs
- Easy access from frontend

**Option 2: AWS S3**
```env
AWS_S3_BUCKET=your-proposals-bucket
AWS_REGION=us-east-1
```
- Scalable
- CDN integration
- Lifecycle policies
- Cost-effective

**Option 3: Hybrid**
- Save locally for immediate download
- Upload to cloud for long-term storage
- Track in database for searching

---

## 📊 File Management Best Practices

### 1. Track in Database

Always save proposal metadata to database:
- proposal_id
- client_id
- created_at
- total_price
- status (generated/sent/accepted/rejected)
- storage_url

### 2. Retention Policy

```python
# Delete old proposals after 90 days
import os
from datetime import datetime, timedelta

retention_days = 90
cutoff = datetime.now() - timedelta(days=retention_days)

for file in Path('output/proposals').glob('*.md'):
    if file.stat().st_mtime < cutoff.timestamp():
        file.unlink()  # Delete old file
```

### 3. Backup Strategy

- Daily backup to cloud storage
- Keep local copies for 30 days
- Archive old proposals to cheaper storage (S3 Glacier)

---

## 🚀 Quick Start - New Proposal Generator

### Step 1: Server Running

Make sure the AI platform is running:
```powershell
python -m uvicorn ai_proposal.server:app --reload --port 8000
```

### Step 2: Open Generator

Visit in browser:
```
http://localhost:8000/proposal-generator
```

### Step 3: Fill Form

1. **Client Name:** Enter company name
2. **Requirements:** Describe what they need
3. **Pricing Tier:** Select appropriate tier
4. **SLA Level:** Choose support level

### Step 4: Generate!

Click "🚀 Generate Proposal"

You'll see:
- ✅ Total monthly price
- ✅ Services selected
- ✅ Pricing breakdown
- ✅ SLA details
- ✅ Download button

### Step 5: Download

Click "📥 Download Full Proposal"

The Markdown file downloads to your computer!

---

## 💡 Pro Tips

### Tip 1: Keyword Optimization

Include these keywords in requirements for better service selection:
- "monitoring" → Monitoring services
- "helpdesk" or "support" → Help Desk
- "security" or "SIEM" → Security services
- "cloud" or "AWS" or "Azure" → Cloud services
- "backup" → Backup & DR
- "patch" → Patch Management
- "firewall" → Firewall Management
- "email" → Email Security

### Tip 2: Specify User Count

Always mention user count for accurate quantity estimation:
- "for 120 users"
- "50 employees"
- "200 seats"

### Tip 3: Tier Selection

- **Starter**: <25 users, budget-conscious
- **Standard**: 25-100 users, most popular
- **Premium**: 100-250 users, growing companies
- **Enterprise**: 250+ users, large organizations

### Tip 4: SLA Selection

- **Bronze**: Basic support, business hours
- **Silver**: Extended support, good for most
- **Gold**: 24/7 support, e-commerce/critical
- **Platinum**: Mission-critical, dedicated TAM

---

## 🔄 Current File Locations

### Generated Proposals
```
output/proposals/proposal_*.md
```

### Configuration Files
```
.env                             # Your Supabase keys here
data/service_catalog.csv         # Your services
data/sla_templates.csv           # SLA levels  
data/pricing_tiers.csv           # Pricing tiers
templates/proposal_template.md   # Markdown template
```

### Access Points
```
http://localhost:8000/proposal-generator    # Simple form
http://localhost:8000/demo                  # Full demo
http://localhost:8000/docs                  # API docs
```

---

## 📧 Share Proposals with Clients

### Method 1: Email Directly

Attach the Markdown file to email manually, or use automation:

```javascript
// From Node.js backend
const nodemailer = require('nodemailer');

async function emailProposal(proposalId, clientEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: 'proposals@yourcompany.com',
    to: clientEmail,
    subject: 'Your MSP Proposal',
    text: 'Please find attached your customized proposal.',
    attachments: [{
      filename: `proposal.md`,
      path: `output/proposals/proposal_${proposalId}.md`
    }]
  });
}
```

### Method 2: Share via Link

If using Supabase Storage with signed URLs:

```javascript
// Generate shareable link (expires in 7 days)
const { data } = await supabase.storage
  .from('proposals')
  .createSignedUrl(`proposals/${proposalId}.md`, 604800);

// Send link to client
const shareLink = data.signedUrl;
```

### Method 3: Portal Access

Create a client portal where they can:
- View all their proposals
- Download when needed
- Accept/reject proposals
- E-sign agreements

---

## 🎯 Recommended Setup for Your MSP Platform

### Production Architecture

```
1. User generates proposal via web interface
   ↓
2. AI Platform creates proposal (local + cloud)
   ↓
3. Save metadata to Supabase database
   ↓
4. Upload file to Supabase Storage
   ↓
5. Generate signed download URL
   ↓
6. Email link to client
   ↓
7. Client downloads from secure link
```

### Implementation

**Backend Route (Node.js):**
```javascript
router.post('/clients/:id/generate-proposal', authenticate, async (req, res) => {
  const { id } = req.params;
  
  // 1. Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  // 2. Generate via AI
  const aiResponse = await axios.post('http://localhost:8000/api/v1/proposals/quick-generate', null, {
    params: {
      client_name: client.client_name,
      requirements: req.body.requirements,
      pricing_tier: req.body.tier || 'TIER_STANDARD',
      sla_level: req.body.sla || 'SLA_GOLD'
    }
  });

  const proposal = aiResponse.data;

  // 3. Save to database
  const { data: record } = await supabase.from('proposal_history').insert({
    proposal_id: proposal.proposal_id,
    client_id: id,
    client_name: client.client_name,
    total_price: proposal.pricing.total_with_sla,
    pricing_tier: proposal.summary.pricing_tier,
    sla_level: proposal.summary.sla_level,
    services_count: proposal.summary.services_selected,
    file_path: proposal.files.local_path,
    created_by: req.user.id
  }).select().single();

  // 4. (Optional) Email to client
  if (req.body.sendEmail) {
    await emailProposal(proposal.proposal_id, client.email);
  }

  res.json({
    success: true,
    proposal_id: proposal.proposal_id,
    download_url: `http://localhost:8000${proposal.files.download_url}`,
    total_price: proposal.pricing.total_with_sla
  });
});
```

---

## ✅ Summary

**Current (Working Now):**
- ✅ Proposals saved to `output/proposals/`
- ✅ Downloadable via API
- ✅ Accessible via web interface
- ✅ Works perfectly for development

**For Production (Easy to Add):**
- Add Supabase Storage (just set env var + create bucket)
- Or AWS S3 (set env vars + configure AWS)
- Track in database for history
- Optional email delivery

**Access Your Proposals:**
1. **Web Interface**: http://localhost:8000/proposal-generator
2. **Download API**: http://localhost:8000/api/v1/proposals/{id}/download
3. **File System**: `output\proposals\proposal_*.md`

---

**Next:** Visit http://localhost:8000/proposal-generator and create a proposal! 🚀


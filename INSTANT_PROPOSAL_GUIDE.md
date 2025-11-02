# ⚡ Instant Proposal Generation - User Guide

## 🎯 Quick Access

### **🌟 NEW: Simple Proposal Generator**

**URL:** http://localhost:8000/proposal-generator

This is the **easiest way** to generate proposals! Just:
1. Fill in client name
2. Paste client requirements
3. Select pricing tier & SLA
4. Click "Generate Proposal"
5. Download your professional proposal!

---

## 📋 How the System Works

### What You Input:

1. **Client Name** - Company name
2. **Client Requirements** - What they need (free text)
3. **Service Catalog** - Auto-loaded from `data/service_catalog.csv`
4. **SLA Templates** - Select from Bronze/Silver/Gold/Platinum
5. **Pricing Tier** - Select from Starter/Standard/Premium/Enterprise

### What the AI Does:

1. **Analyzes Requirements** - Reads your text
2. **Selects Services** - Matches keywords to catalog
3. **Estimates Quantities** - Extracts user counts, server counts
4. **Calculates Pricing** - Applies tier discounts & SLA premiums
5. **Generates Proposal** - Creates professional Markdown file
6. **Saves & Returns** - Gives you download link

---

## 🚀 Three Ways to Generate Proposals

### Method 1: Web Form (Easiest) ⭐ RECOMMENDED

**URL:** http://localhost:8000/proposal-generator

**Steps:**
1. Open the URL in browser
2. Fill in the form (example pre-filled)
3. Click "Generate Proposal"
4. Click "Download" button
5. Done! File downloads to your computer

**Perfect for:**
- Sales team usage
- Quick demos
- Non-technical users

---

### Method 2: Simple API Call

**Endpoint:** `POST /api/v1/proposals/quick-generate`

**Example (PowerShell):**
```powershell
$params = @{
    client_name = "Tech Startup Inc"
    requirements = "Need cloud migration, security monitoring, and support for 75 users"
    pricing_tier = "TIER_STANDARD"
    sla_level = "SLA_GOLD"
}

$url = "http://localhost:8000/api/v1/proposals/quick-generate?" + ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$([uri]::EscapeDataString($_.Value))" }) -join '&'

Invoke-WebRequest -Uri $url -Method POST
```

**Example (cURL):**
```bash
curl -X POST "http://localhost:8000/api/v1/proposals/quick-generate?client_name=Tech%20Startup&requirements=Need%20monitoring%20and%20support&pricing_tier=TIER_STANDARD&sla_level=SLA_GOLD"
```

**Perfect for:**
- Automated workflows
- Batch generation
- Integration with other systems

---

### Method 3: Full API (Most Control)

**Endpoint:** `POST /api/v1/proposals/generate`

**Example:**
```javascript
fetch('http://localhost:8000/api/v1/proposals/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_name: "Enterprise Corp",
    requirements: "Full managed services for 200 users",
    pricing_tier_id: "TIER_PREMIUM",
    sla_id: "SLA_PLATINUM",
    quantities: {
      "S007": 200,  // Helpdesk for 200 users
      "S001": 100   // Monitoring for 100 devices
    },
    use_llm: false
  })
})
```

**Perfect for:**
- Custom integrations
- Advanced configurations
- Full control over quantities

---

## 📂 Where Files Are Saved

### Locally (Always)

```
output/proposals/proposal_{uuid}.md
```

**Example:**
```
output\proposals\proposal_c309aee6-28b9-4a76-bdfe-14c1051664ec.md
```

### To Cloud (Optional Setup)

**Supabase Storage:**
- Set `SUPABASE_BUCKET=proposals` in .env
- Create bucket in Supabase Dashboard
- Files auto-upload

**AWS S3:**
- Set `AWS_S3_BUCKET=your-bucket` in .env
- Configure AWS credentials
- Files auto-upload

**Manual Upload:**
```powershell
# Upload to your preferred service manually
# Files are in: output\proposals\
```

---

## 🎨 Customization

### Change Services Offered

Edit: `data/service_catalog.csv`

```csv
service_id,service_name,category,description,unit,unit_price,keywords,default_quantity
S001,Your Service,Your Category,Description,Unit,99.00,"keyword1,keyword2",10
```

Then reload:
```bash
curl -X POST http://localhost:8000/api/v1/proposals/reload-data
```

### Change Pricing Tiers

Edit: `data/pricing_tiers.csv`

```csv
tier_id,name,base_multiplier,min_monthly,max_users
TIER_CUSTOM,Custom,0.92,3000,150
```

### Change SLA Levels

Edit: `data/sla_templates.csv`

```csv
sla_id,name,response_time,uptime_guarantee,price_multiplier,support_hours
SLA_CUSTOM,Custom,1 hour,99.9%,1.25,24x7
```

### Change Proposal Template

Edit: `templates/proposal_template.md`

Add your:
- Company logo reference
- Contact information
- Custom sections
- Branding

---

## 💼 Integration with Your MSP Platform

### Add to Your React Frontend

```jsx
// frontend/src/components/GenerateProposal.js
import React from 'react';

function GenerateProposalButton({ client }) {
  const handleGenerate = async () => {
    const response = await fetch('http://localhost:8000/api/v1/proposals/quick-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_name: client.client_name,
        requirements: `Services for ${client.industry} company with ${client.user_count || 50} users`,
        pricing_tier: 'TIER_STANDARD',
        sla_level: 'SLA_GOLD'
      })
    });

    const proposal = await response.json();
    
    // Download automatically
    window.open(`http://localhost:8000/api/v1/proposals/${proposal.proposal_id}/download`);
    
    // Show success message
    alert(`Proposal generated! Total: $${proposal.pricing.total_with_sla.toLocaleString()}/month`);
  };

  return (
    <button onClick={handleGenerate}>
      🚀 Generate AI Proposal
    </button>
  );
}
```

### Add to Your Node.js Backend

```javascript
// server/src/routes/proposals.js
router.post('/clients/:id/auto-proposal', authenticate, async (req, res) => {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.params.id)
      .single();

    // Call AI service
    const response = await axios.post('http://localhost:8000/api/v1/proposals/quick-generate', null, {
      params: {
        client_name: client.client_name,
        requirements: `Services for ${client.industry} company`,
        pricing_tier: 'TIER_STANDARD',
        sla_level: 'SLA_GOLD'
      }
    });

    // Save to your database
    await supabase.from('proposals').insert({
      client_id: req.params.id,
      proposal_id: response.data.proposal_id,
      total_price: response.data.pricing.total_with_sla,
      created_by: req.user.id
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 What Gets Generated

### Proposal File Contains:

1. **Executive Summary**
   - Client name
   - Recommended services
   - Solution overview

2. **Service Details**
   - All selected services by category
   - Descriptions
   - Pricing per service

3. **Bill of Materials**
   - Service breakdown table
   - Quantities and unit prices
   - Extended totals

4. **Pricing Breakdown**
   - Base subtotal
   - Tier discount applied
   - SLA premium applied
   - Final monthly total

5. **SLA Commitments**
   - Response times
   - Uptime guarantees
   - Support hours
   - Service promises

6. **Implementation Timeline**
   - Project phases
   - Durations
   - Milestones

7. **Terms & Conditions**
   - Contract terms
   - Payment terms
   - Policies

8. **Next Steps**
   - Action items
   - Contact information

---

## 🎯 Example Usage Scenarios

### Scenario 1: Quick Quote for Sales Call

```
1. Client calls asking for pricing
2. Open http://localhost:8000/proposal-generator
3. Fill in: "Client Corp, 50 users, need monitoring and support"
4. Generate in 2 seconds
5. Email proposal immediately
```

### Scenario 2: Batch Proposals for Campaign

```python
clients = ['CompanyA', 'CompanyB', 'CompanyC']

for client in clients:
    response = requests.post('http://localhost:8000/api/v1/proposals/quick-generate', params={
        'client_name': client,
        'requirements': 'Standard MSP services',
        'pricing_tier': 'TIER_STANDARD',
        'sla_level': 'SLA_SILVER'
    })
    print(f"Generated for {client}: {response.json()['proposal_id']}")
```

### Scenario 3: Client Self-Service Portal

Let clients generate their own proposals:
```html
<form action="http://localhost:8000/api/v1/proposals/quick-generate" method="POST">
    <input name="client_name" required />
    <textarea name="requirements" required></textarea>
    <select name="pricing_tier">...</select>
    <select name="sla_level">...</select>
    <button>Get My Proposal</button>
</form>
```

---

## ✅ You're All Set!

**Everything is ready to use RIGHT NOW:**

🌟 **Visit:** http://localhost:8000/proposal-generator  
📖 **Docs:** http://localhost:8000/docs  
📊 **Status:** http://localhost:8000/api/v1/status  
📁 **Files:** output\proposals\

**The system will:**
- ✅ Analyze any requirements you enter
- ✅ Auto-select appropriate services
- ✅ Calculate accurate pricing
- ✅ Generate professional proposals
- ✅ Save files locally
- ✅ Provide download links

**Start generating proposals now!** 🚀


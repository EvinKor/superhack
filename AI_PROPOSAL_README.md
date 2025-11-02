# 🤖 AI Proposal Assistant

Automated MSP proposal generation with ML-powered service selection, intelligent pricing, and professional Markdown output.

## 🎯 Features

- **Intelligent Service Selection**: Rule-based keyword matching + optional ML predictions
- **Dynamic Pricing**: Configurable tiers and SLA multipliers
- **Professional Output**: Jinja2-templated Markdown proposals
- **LLM Polish**: Optional AWS Bedrock integration for content enhancement
- **Hot Reload**: CSV data updates without server restart
- **Production Ready**: Comprehensive error handling, logging, and validation

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- (Optional) AWS credentials for SageMaker/Bedrock

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or using Poetry
poetry install
```

### Configuration

Create a `.env` file (copy from env.example):

```env
# Optional AWS features
SM_ENDPOINT_NAME=your-sagemaker-endpoint
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
AWS_REGION=us-east-1

# Server config
PORT=8000
LOG_LEVEL=INFO
```

### Run Development Server

```bash
# Using make
make dev

# Or directly
uvicorn ai_proposal.server:app --reload

# With custom port
uvicorn ai_proposal.server:app --reload --port 8080
```

Server will start at `http://localhost:8000`

- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/health

## 📋 Usage

### Generate a Proposal

```bash
curl -X POST http://localhost:8000/api/v1/proposals/generate \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Acme Retail",
    "requirements": "Need AWS migration, SIEM, vuln scans, helpdesk for 120 users. High uptime.",
    "pricing_tier_id": "TIER_STANDARD",
    "sla_id": "SLA_GOLD",
    "quantities": {"S007": 120},
    "use_llm": false
  }'
```

### Download Generated Proposal

```bash
curl -O http://localhost:8000/api/v1/proposals/{proposal_id}/download
```

### Response Format

```json
{
  "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "Proposal summary...",
  "bom": [
    {
      "service_id": "S007",
      "service_name": "Help Desk Support",
      "unit": "User",
      "quantity": 120,
      "unit_price": 12.00,
      "extended": 1440.00,
      "category": "Support Services"
    }
  ],
  "subtotal_base": 12345.00,
  "subtotal_tiered": 13000.50,
  "total_price": 14950.65,
  "sla": {...},
  "tier": {...},
  "file_path": "output/proposals/proposal_550e8400....md",
  "generated_at": "2025-01-15T10:30:00Z",
  "client_name": "Acme Retail"
}
```

## 🗂️ Project Structure

```
ai_proposal/
├── __init__.py
├── config.py          # Settings and env vars
├── models.py          # Pydantic schemas
├── data_store.py      # CSV loaders with caching
├── selectors.py       # Service selection logic
├── pricing.py         # Pricing calculations
├── renderer.py        # Markdown generation
├── routes.py          # FastAPI endpoints
└── server.py          # App factory

data/
├── service_catalog.csv
├── sla_templates.csv
└── pricing_tiers.csv

templates/
└── proposal_template.md

output/
└── proposals/         # Generated .md files

tests/
├── test_routes.py
└── test_pricing.py
```

## 📊 Data Files

### service_catalog.csv

Defines available services with:
- service_id, service_name, category
- description, unit, unit_price
- keywords (comma-separated)
- default_quantity

### sla_templates.csv

SLA levels with:
- sla_id, name
- response_time, uptime_guarantee
- price_multiplier, support_hours

### pricing_tiers.csv

Volume-based pricing:
- tier_id, name
- base_multiplier (0.85-1.0)
- min_monthly, max_users

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
pytest --cov=ai_proposal --cov-report=html

# Run specific test file
pytest tests/test_routes.py -v
```

## 🔧 Development

```bash
# Format code
make fmt

# Lint code
make lint

# Clean generated files
make clean
```

## 🌩️ AWS Integration

### SageMaker (Optional)

For ML-powered service selection:

```python
# Expected endpoint input
{
  "requirements": "string",
  "client_meta": {"name": "string"}
}

# Expected endpoint output
{
  "predictions": [
    {"service_id": "S001", "confidence": 0.95},
    {"service_id": "S007", "confidence": 0.87}
  ]
}
```

Set `SM_ENDPOINT_NAME` env var to enable.

### Bedrock (Optional)

For LLM content polishing:

```env
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

Enable in request with `"use_llm": true`.

## 🔒 Security

- Input validation with Pydantic
- Prompt injection guards for LLM mode
- Request size limits (5000 chars for requirements)
- No execution of user input
- Secure file paths (UUID-based naming)

## ⚡ Performance

- CSV caching with hot-reload
- Async FastAPI handlers
- GZip compression
- Multiple workers support:

```bash
uvicorn ai_proposal.server:app --workers 4
```

## 📈 Production Deployment

```bash
# Using Gunicorn + Uvicorn workers
gunicorn ai_proposal.server:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "ai_proposal.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🎛️ Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SM_ENDPOINT_NAME` | SageMaker endpoint | None | No |
| `BEDROCK_MODEL_ID` | Bedrock model ID | None | No |
| `AWS_REGION` | AWS region | us-east-1 | No |
| `CATALOG_PATH` | Service catalog CSV | data/service_catalog.csv | No |
| `SLA_PATH` | SLA templates CSV | data/sla_templates.csv | No |
| `TIERS_PATH` | Pricing tiers CSV | data/pricing_tiers.csv | No |
| `OUTPUT_DIR` | Output directory | output/proposals | No |
| `PORT` | Server port | 8000 | No |
| `WORKERS` | Number of workers | 4 | No |
| `LOG_LEVEL` | Logging level | INFO | No |

## 🛣️ API Endpoints

### `POST /api/v1/proposals/generate`

Generate new proposal.

**Rate Limits:** Configure at reverse proxy level.

### `GET /api/v1/proposals/{id}/download`

Download Markdown file.

### `POST /api/v1/proposals/reload-data`

Hot-reload CSV data files.

### `GET /api/v1/health`

Health check with capabilities.

### `GET /`

Root with API information.

## 🐛 Troubleshooting

### Services not selected

- Check `keywords` in `service_catalog.csv`
- Review requirements text for keyword matches
- Fallback services activate if none match

### Pricing seems incorrect

- Verify `base_multiplier` in tier (0.85-1.0)
- Check `price_multiplier` in SLA (1.0-1.5)
- Ensure `min_monthly` applies if set

### LLM polish fails

- Verify `BEDROCK_MODEL_ID` is set
- Check AWS credentials (IAM permissions)
- Review CloudWatch logs for Bedrock errors
- Fallback: returns original text

### File not found errors

- Ensure CSV files exist in `data/` directory
- Check file permissions
- Verify paths in `.env` if overridden

## 📞 Integration with Existing MSP Platform

This module can run standalone or integrate with your Node.js backend:

```javascript
// In your Express/FastAPI integration
const axios = require('axios');

async function generateProposal(clientData) {
  const response = await axios.post('http://localhost:8000/api/v1/proposals/generate', {
    client_name: clientData.name,
    requirements: clientData.requirements,
    pricing_tier_id: 'TIER_STANDARD',
    sla_id: 'SLA_GOLD',
    quantities: clientData.quantities || {},
    use_llm: false
  });
  
  return response.data;
}
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Format code: `make fmt`
6. Submit a pull request

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [AWS SageMaker](https://aws.amazon.com/sagemaker/)

---

**Version:** 1.0.0  
**Author:** MSP Platform Team  
**Support:** Email support@yourcompany.com


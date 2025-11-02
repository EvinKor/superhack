# Managed Services Proposal

**Proposal ID:** {{ proposal_id }}  
**Client:** {{ client_name }}  
**Date:** {{ date }}  
**Pricing Tier:** {{ tier.name }}  
**Service Level:** {{ sla.name }}

---

## Executive Summary

{{ summary }}

---

## Proposed Services

{% for category, services in services_by_category.items() %}
### {{ category }}

{% for service in services %}
**{{ service.service_name }}**  
{{ service.description }}  
*Unit Price: ${{ "%.2f"|format(service.unit_price) }} per {{ service.unit }}*

{% endfor %}
{% endfor %}

---

## Pricing Details

### Bill of Materials

| Service | Unit | Quantity | Unit Price | Monthly Cost |
|---------|------|----------|------------|--------------|
{% for item in bom -%}
| {{ item.service_name }} | {{ item.unit }} | {{ item.quantity }} | ${{ "%.2f"|format(item.unit_price) }} | ${{ "%.2f"|format(item.extended) }} |
{% endfor %}
| | | | **Subtotal (Base):** | **{{ subtotal_base }}** |

### Pricing Tier: {{ tier.name }}
- **Base Multiplier:** ×{{ tier.base_multiplier }}
- **Tiered Subtotal:** {{ subtotal_tiered }}

### Service Level Agreement: {{ sla.name }}
- **Response Time:** {{ sla.response_time }}
- **Uptime Guarantee:** {{ sla.uptime_guarantee }}
- **Support Hours:** {{ sla.support_hours }}
- **SLA Multiplier:** ×{{ sla.price_multiplier }}

---

## **TOTAL MONTHLY INVESTMENT: {{ total_price }}**

---

## Service Level Agreement Details

### {{ sla.name }} includes:
- **Incident Response:** {{ sla.response_time }}
- **Guaranteed Uptime:** {{ sla.uptime_guarantee }}
- **Support Availability:** {{ sla.support_hours }}
- Proactive monitoring and alerting
- Regular service reviews
- Dedicated support portal access
{% if sla.sla_id == 'SLA_PLATINUM' %}
- Dedicated Technical Account Manager (TAM)
- Quarterly business reviews
- Priority escalation path
{% endif %}

---

## Implementation Timeline

| Phase | Activities | Duration |
|-------|-----------|----------|
| **Week 1-2** | Discovery & Planning | 2 weeks |
| **Week 3-4** | Infrastructure Setup | 2 weeks |
| **Week 5-6** | Service Deployment | 2 weeks |
| **Week 7-8** | Testing & Transition | 2 weeks |
| **Week 9+** | Ongoing Operations | Continuous |

---

## Terms & Conditions

1. **Contract Term:** 12 months minimum, auto-renewing
2. **Payment Terms:** Net 30 days from invoice date
3. **Price Protection:** Rates locked for initial term
4. **Termination:** 90 days written notice required
5. **One-Time Fees:** Setup and onboarding fees may apply (quoted separately)
6. **Usage Policy:** Services subject to Acceptable Use Policy
7. **Changes:** Service modifications require mutual agreement
8. **Confidentiality:** All client data treated as confidential

---

## Why Choose Us

- **Proven Expertise:** 15+ years in managed services
- **24/7 Operations:** Round-the-clock monitoring and support
- **Certified Team:** Industry certifications (CISSP, AWS, Azure, etc.)
- **Scalable Solutions:** Grow as your business grows
- **Transparent Pricing:** No hidden fees or surprises
- **Customer Success:** Dedicated to your business outcomes

---

## Next Steps

1. **Review** this proposal with your team
2. **Schedule** a discussion to address any questions
3. **Approve** and return signed agreement
4. **Kickoff** - We'll schedule your onboarding meeting
5. **Go Live** - Begin receiving world-class managed services

---

## Contact Information

For questions or to proceed with this proposal:

**Email:** sales@yourcompany.com  
**Phone:** (555) 123-4567  
**Portal:** portal.yourcompany.com

---

*This proposal is valid for 30 days from the date above. Pricing and availability subject to change after expiration.*

*Proposal generated on {{ date }} - ID: {{ proposal_id }}*


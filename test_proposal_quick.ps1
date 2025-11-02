# Quick test script for AI Proposal Assistant

Write-Host "Testing AI Proposal Assistant..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    client_name = "Acme Retail"
    requirements = "Need AWS cloud migration, SIEM, vulnerability scans, and helpdesk support for 120 users. High uptime required."
    pricing_tier_id = "TIER_STANDARD"
    sla_id = "SLA_GOLD"
    quantities = @{ "S007" = 120 }
    use_llm = $false
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/proposals/generate" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json

    Write-Host ""
    Write-Host "SUCCESS! Proposal Generated" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Proposal ID: " -NoNewline; Write-Host $data.proposal_id -ForegroundColor Cyan
    Write-Host "Client: " -NoNewline; Write-Host $data.client_name -ForegroundColor Cyan
    Write-Host "Total Price: " -NoNewline; Write-Host ("`${0:N2}" -f $data.total_price) -ForegroundColor Green
    Write-Host "Services: " -NoNewline; Write-Host $data.bom.Count -ForegroundColor Cyan
    Write-Host "File: " -NoNewline; Write-Host $data.file_path -ForegroundColor Cyan
    Write-Host ""
    Write-Host "BOM (Bill of Materials):" -ForegroundColor Yellow
    foreach ($item in $data.bom) {
        Write-Host ("  - {0}: {1} {2} x `${3:N2} = `${4:N2}" -f $item.service_name, $item.quantity, $item.unit, $item.unit_price, $item.extended)
    }
    Write-Host ""
    Write-Host "Open file: output/proposals/proposal_$($data.proposal_id).md" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response
}


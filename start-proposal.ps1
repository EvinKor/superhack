# PowerShell script to start AI Proposal Assistant

Write-Host "Starting AI Proposal Assistant..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:8000/api/v1/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

$pythonPath = "C:/Users/Craaazyyyy/AppData/Local/Programs/Python/Python314/python.exe"

& $pythonPath -m uvicorn ai_proposal.server:app --reload --host 0.0.0.0 --port 8000


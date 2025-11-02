@echo off
REM Start AI Proposal Assistant server on Windows

echo 🚀 Starting AI Proposal Assistant...
echo.
echo 📡 Server will be available at: http://localhost:8000
echo 📚 API Documentation: http://localhost:8000/docs
echo 🏥 Health Check: http://localhost:8000/api/v1/health
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
if not exist "venv\.installed" (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo. > venv\.installed
)

REM Start server
uvicorn ai_proposal.server:app --reload --host 0.0.0.0 --port 8000


@echo off
echo ===================================================
echo   SAHAYAK AI - Real-Time Emergency Assistance
echo ===================================================
echo.

IF NOT EXIST venv (
    echo [1/3] Creating virtual environment 'venv'...
    python -m venv venv
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment. Ensure Python is installed in PATH.
        pause
        exit /b %ERRORLEVEL%
    )
)

echo [2/3] Activating virtual environment and installing dependencies...
call venv\Scripts\activate
pip install -r backend\requirements.txt "pydantic[email]"

echo.
echo [3/3] Launching Sahayak AI Server...
echo ---------------------------------------------------
echo   Local Web Interface: http://127.0.0.1:8000
echo   Interactive API Docs: http://127.0.0.1:8000/docs
echo   Default Admin Login: admin@sahayak.ai / Admin@12345
echo ---------------------------------------------------
echo.

uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause

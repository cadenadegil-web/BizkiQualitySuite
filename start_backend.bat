@echo off
echo Iniciando el servidor Backend de MDH Quality Suite...
cd /d "%~dp0backend"
call .\.venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload
pause

@echo off
echo Iniciando el servidor Backend de BizkiQualitySuite...
cd /d "%~dp0backend"
call .\.venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload
pause

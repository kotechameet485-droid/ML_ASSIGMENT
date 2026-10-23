@echo off
setlocal enabledelayedexpansion
title EngineMind 2.0 — Turbofan Predictive Maintenance Intelligence

echo =====================================================================
echo           ENGINEMIND 2.0 — INDUSTRIAL PREDICTIVE MAINTENANCE         
echo           NASA C-MAPSS Turbofan Engine Degradation Benchmark         
echo           FastAPI Analytical Backend + React TypeScript Frontend     
echo =====================================================================
echo.

set VENV_PYTHON=.venv\Scripts\python.exe
set VENV_UVICORN=.venv\Scripts\uvicorn.exe
set VENV_PYTEST=.venv\Scripts\pytest.exe

if not exist "%VENV_PYTHON%" (
    echo [ERROR] Virtual environment not found at .venv!
    echo Please create the virtual environment first using:
    echo   python -m venv .venv
    echo   .venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo [1] Launch EngineMind 2.0 (FastAPI Backend on :8000 + React Frontend on :5173) [RECOMMENDED]
echo [2] Launch FastAPI Backend Only (http://127.0.0.1:8000)
echo [3] Launch React Frontend Only (http://127.0.0.1:5173)
echo [4] Execute Complete Automated Test Suite (pytest: 32 tests)
echo [5] Run Model Training and Hyperparameter Tuning (src/train.py)
echo [6] Run Official Test Set Evaluation (src/evaluate.py)
echo [7] Run Legacy Streamlit Dashboard (app.py)
echo.
set /p CHOICE="Enter choice [1-7, default=1]: "

if "%CHOICE%"=="" set CHOICE=1

if "%CHOICE%"=="1" (
    echo.
    echo Starting FastAPI Analytical Backend on http://127.0.0.1:8000...
    start "EngineMind 2.0 Backend [FastAPI :8000]" cmd /k "%VENV_PYTHON% -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"
    
    timeout /t 2 /nobreak >nul
    
    echo Starting React TypeScript Frontend on http://127.0.0.1:5173...
    start "EngineMind 2.0 Frontend [Vite :5173]" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"
    
    timeout /t 3 /nobreak >nul
    start http://127.0.0.1:5173/
    echo EngineMind 2.0 is now running at http://127.0.0.1:5173/
) else if "%CHOICE%"=="2" (
    echo.
    echo Starting FastAPI Backend...
    "%VENV_PYTHON%" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
) else if "%CHOICE%"=="3" (
    echo.
    echo Starting React Frontend...
    cd frontend && npm run dev -- --host 127.0.0.1 --port 5173
) else if "%CHOICE%"=="4" (
    echo.
    echo Running all automated tests with pytest...
    "%VENV_PYTHON%" -m pytest -v tests/
    pause
) else if "%CHOICE%"=="5" (
    echo.
    echo Starting model training and hyperparameter tuning...
    "%VENV_PYTHON%" -m src.train
    pause
) else if "%CHOICE%"=="6" (
    echo.
    echo Running evaluation against official test set...
    "%VENV_PYTHON%" -m src.evaluate
    pause
) else if "%CHOICE%"=="7" (
    echo.
    echo Starting Legacy Streamlit Dashboard...
    .venv\Scripts\streamlit.exe run app.py
) else (
    echo Invalid choice. Exiting.
)

endlocal

"""
EngineMind 2.0 — FastAPI Analytical Backend Application.
Provides industrial-grade REST endpoints for NASA C-MAPSS dataset exploration,
dynamic RUL inference, 5-fold CV benchmarks, SHAP explainability, and error audits.
"""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Register workspace root in sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.append(str(WORKSPACE_ROOT))

from backend.app.api import datasets, predictions, benchmarks, explainability, errors, artifacts

app = FastAPI(
    title="EngineMind 2.0 Analytical API",
    description="Industrial turbofan predictive maintenance, RUL estimation, and ML diagnostics system.",
    version="2.0.0"
)

import os

# Configurable CORS origins for development and production environments
raw_origins = os.getenv(
    "ENGINEMIND_CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
allow_creds = "*" not in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=allow_creds,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount figures directory for direct image asset access
figures_path = WORKSPACE_ROOT / "results" / "figures"
if figures_path.exists():
    app.mount("/figures", StaticFiles(directory=str(figures_path)), name="figures")

# Register API routers
app.include_router(datasets.router)
app.include_router(predictions.router)
app.include_router(benchmarks.router)
app.include_router(explainability.router)
app.include_router(errors.router)
app.include_router(artifacts.router)


@app.get("/")
def root():
    return {
        "service": "EngineMind 2.0 Analytical API",
        "documentation": "/docs",
        "health": "/api/artifacts/health"
    }


@app.get("/api/health")
def api_health():
    return artifacts.health_check()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

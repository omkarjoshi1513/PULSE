import sys
import types
from pathlib import Path

# Ensure backend package is importable whether running from repo root or service root (backend/)
_backend_dir = Path(__file__).resolve().parent
_repo_dir = _backend_dir.parent
if str(_repo_dir) not in sys.path:
    sys.path.insert(0, str(_repo_dir))
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))
if "backend" not in sys.modules:
    _pkg = types.ModuleType("backend")
    _pkg.__path__ = [str(_backend_dir)]
    sys.modules["backend"] = _pkg

import uvicorn
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.api.endpoints.api import router as api_router
from backend.app.models.models import Project

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto-seed if database is empty
def ensure_seeded():
    db = SessionLocal()
    try:
        if db.query(Project).count() == 0:
            print("Database empty. Auto-seeding initial synthetic data...")
            from backend.app.seed.seed_data import seed_database
            seed_database()
    except Exception as e:
        print(f"Notice on seed check: {e}")
    finally:
        db.close()

ensure_seeded()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PAIMANA Pulse: From project monitoring to proactive intervention (MoSPI DIID SIH 2026)",
    version="1.0.0",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "authority": "Ministry of Statistics and Programme Implementation (MoSPI)"
    }

@app.get("/docs", include_in_schema=False)
def docs_redirect():
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")

@app.get("/openapi.json", include_in_schema=False)
def openapi_redirect():
    return RedirectResponse(url=f"{settings.API_V1_STR}/openapi.json")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

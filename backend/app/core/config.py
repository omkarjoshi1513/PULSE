import os
import shutil
from pathlib import Path

def _resolve_database_url() -> str:
    db_env = os.getenv("DATABASE_URL")
    if db_env:
        return db_env

    # If running in Vercel serverless environment, SQLite must reside in /tmp to be writable
    if os.getenv("VERCEL"):
        tmp_db = Path("/tmp/paimana_pulse.db")
        if not tmp_db.exists():
            candidates = [
                Path(__file__).resolve().parent.parent.parent / "paimana_pulse.db",
                Path(__file__).resolve().parent.parent.parent.parent / "paimana_pulse.db"
            ]
            for candidate in candidates:
                if candidate.is_file():
                    try:
                        shutil.copy2(candidate, tmp_db)
                        break
                    except Exception:
                        pass
        return f"sqlite:///{tmp_db.as_posix()}"

    # Check if paimana_pulse.db is in repo root or backend root
    root_db = Path(__file__).resolve().parent.parent.parent.parent / "paimana_pulse.db"
    backend_db = Path(__file__).resolve().parent.parent.parent / "paimana_pulse.db"
    if root_db.is_file():
        return f"sqlite:///{root_db.resolve().as_posix()}"
    elif backend_db.is_file():
        return f"sqlite:///{backend_db.resolve().as_posix()}"

    return "sqlite:///./paimana_pulse.db"

class Settings:
    PROJECT_NAME: str = "PAIMANA Pulse"
    TAGLINE: str = "From project monitoring to proactive intervention."
    API_V1_STR: str = "/api"
    DATABASE_URL: str = _resolve_database_url()
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Portfolio statistics context (based on official MoSPI / PAIMANA framework)
    PORTFOLIO_TOTAL_PROJECTS: int = 1981
    PORTFOLIO_TOTAL_MINISTRIES: int = 17
    PORTFOLIO_TOTAL_SECTORS: int = 22
    PORTFOLIO_ORIGINAL_COST_LAKH_CR: float = 37.13
    PORTFOLIO_REVISED_COST_LAKH_CR: float = 42.78
    PORTFOLIO_EXPENDITURE_LAKH_CR: float = 20.36

settings = Settings()

import os

class Settings:
    PROJECT_NAME: str = "PAIMANA Pulse"
    TAGLINE: str = "From project monitoring to proactive intervention."
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paimana_pulse.db")
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

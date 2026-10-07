import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment or .env file."""

    # Application settings
    APP_NAME: str = "Sworders SOC API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # Database settings
    # Default to standard PostgreSQL connection format; allows overriding via env
    DATABASE_URL: str = "postgresql+psycopg2://postgres:password@localhost:5432/sworders_soc"

    # Demo safety nets: fall back to a local SQLite file if PostgreSQL is
    # unreachable, and seed clearly simulated data into an empty database.
    DEMO_DB_FALLBACK: bool = True
    DEMO_FALLBACK_URL: str = "sqlite:///./sworders_demo.db"
    SEED_DEMO_DATA: bool = True

    # Azure OpenAI settings (Future Phase 4)
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

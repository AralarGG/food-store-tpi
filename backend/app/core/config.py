"""Configuración de la aplicación leída desde el archivo .env."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Obligatorias: sin ellas la aplicación no arranca
    DATABASE_URL: str
    SECRET_KEY: str = Field(min_length=32)

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_ORIGIN: str = "http://localhost:5173"


# Instancia única que importa el resto de la aplicación
settings = Settings()

from pydantic_settings import BaseSettings

import os

class Settings(BaseSettings):
    DATABASE_URL: str
    MIMO_API_KEY: str
    MIMO_MODEL: str = "mimo-v2-flash"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    STEAM_RETURN_URL: str = "http://localhost:8000/api/auth/steam/callback"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", ".env")

settings = Settings()

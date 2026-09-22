import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Sahayak AI"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/sahayak_ai"

    SECRET_KEY: str = "change-this-secret-key"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    AI_API_KEY: str = ""

    AI_PROVIDER: str = "hybrid"

    SMS_PROVIDER_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )


settings = Settings()
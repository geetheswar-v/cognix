from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DEBUG: bool = False

    EMAIL_FUNCTION: str
    EMAIL_KEY: str
    EMAIL_FROM: str

    FRONTEND_URL: str

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()  # type: ignore

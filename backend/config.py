from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_version: str = "1.0.0"
    app_env: str = "development"
    secret_key: str = "change_me"

    # Database
    database_url: str

    # Redis
    redis_url: str

    # External APIs (optional in dev)
    lastfm_api_key: str = ""
    genius_access_token: str = ""

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_not_be_default_in_prod(cls, v: str, info: any) -> str:
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()


# Sentry
SENTRY_DSN: str = ""  # Set in .env — leave empty to disable

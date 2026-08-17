from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GymSense AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    database_url: str = "sqlite:///./gymsense.db"
    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000

    db_type: str = "sqlite"

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "sales_os"
    db_user: str = "postgres"
    db_password: str = "postgres"

    @property
    def database_url(self) -> str:
        if self.db_type == "postgresql":
            return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
        else:
            return f"sqlite:///data/{self.db_name}.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

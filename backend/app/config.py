from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App configuration, read from environment variables (e.g. OPENAI_MODEL)"""

    openai_api_key: str | None = None
    # the one place the triage model is chosen; override with the OPENAI_MODEL env var
    openai_model: str = "gpt-6-luna"
    openai_timeout_seconds: float = 30.0


settings = Settings()

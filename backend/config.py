import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    IMAGINE_API_KEY: str = "278b88a2-8f68-42f7-818e-0442a7d294a3"
    IMAGINE_ENDPOINT_URL: str = "https://aisuite.cirrascale.com/apis/v2"
    
    # Model configuration
    MODEL_70B: str = "Llama-3.3-70B"
    MODEL_8B: str = "Llama-3.1-8B"
    MODEL_EMBEDDING: str = "BAAI/bge-large-en-v1.5"
    MODEL_REASONING: str = "Llama-3.3-70B"
    
    # Operational configuration
    MOCK_MODE: bool = False
    TIMEOUT_SECONDS: float = 120.0
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

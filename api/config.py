"""
Application settings — loaded from environment variables / .env file.

The .env file is looked up relative to this file (api/.env), so uvicorn
can be run from any working directory.
"""
from functools import lru_cache
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    environment: str = "development"

    # Clerk
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""
    clerk_jwt_issuer: str = ""          # e.g. https://clerk.yourdomain.com

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    # Anthropic
    anthropic_api_key: str = ""

    # OpenAI-compatible NVIDIA endpoint for Nemotron
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nemotron_model: str = "nvidia/llama-3.1-nemotron-nano-8b-instruct"

    # eBay Browse API — https://developer.ebay.com (free key, instant approval)
    ebay_app_id: str = ""          # App ID / Client ID
    ebay_client_secret: str = ""   # Client Secret

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # App
    cors_origins: List[str] = ["http://localhost:3000"]
    mock_listings: bool = False     # true → skip eBay, use fixture JSON
    max_upload_mb: int = 10
    listing_radius_miles: int = 25  # radius passed to eBay buyerLocationRadius

    # ngrok (set when tunnelling locally for Twilio webhooks)
    public_webhook_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

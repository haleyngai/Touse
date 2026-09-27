"""
Supabase client singleton.
Returns a real client when SUPABASE_URL + SERVICE_ROLE_KEY are configured,
or raises a clear error when they're placeholders (local dev without Docker).
"""
from supabase import create_client, Client
from api.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = settings.supabase_url
        key = settings.supabase_service_role_key
        if not url or url == "placeholder" or "placeholder" in url:
            raise RuntimeError(
                "Supabase is not configured. Either:\n"
                "  1. Run Docker + `supabase start` and set real values in api/.env\n"
                "  2. Create a free project at https://supabase.com and paste credentials into api/.env"
            )
        _client = create_client(url, key)
    return _client

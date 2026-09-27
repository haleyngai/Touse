"""
Clerk JWT verification dependency for FastAPI.
Validates the Bearer token issued by Clerk and extracts the user_id (sub claim).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx

from api.config import settings

_bearer = HTTPBearer(auto_error=True)
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    jwks_url = f"{settings.clerk_jwt_issuer}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    Validates Clerk JWT and returns the Clerk user_id (sub claim).
    Raises 401 if the token is missing or invalid.
    """
    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {e}",
        )

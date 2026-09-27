"""
Listing provider implementations.

Providers
---------
EbayListingProvider   — eBay Browse API (used furniture, location-filtered by zip code)
FixtureListingProvider — JSON fallback (active when MOCK_LISTINGS=true or eBay fails)

eBay Browse API notes
---------------------
- Free developer key, instant approval: https://developer.ebay.com
- OAuth2 client-credentials flow (no user login required)
- Supports buyerPostalCode + buyerLocationRadius filter for local results
- USED condition filter ensures secondhand listings only
- Category 3197 = Furniture; 175750 = Sofas; we use the parent so all sub-cats match
- Token expiry tracked and auto-refreshed
"""
from __future__ import annotations

import json
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional

import httpx

from api.config import settings
from api.models import FurnitureItem, LatLng, Listing, ListingProvider


# ── Abstract base ─────────────────────────────────────────────────────────────

class BaseListingProvider(ABC):
    @abstractmethod
    async def search(
        self,
        item: FurnitureItem,
        location: LatLng,
        radius_miles: int = 25,
    ) -> List[Listing]:
        ...


# ── eBay Browse API ───────────────────────────────────────────────────────────

# eBay furniture category IDs (parent + most-used sub-categories)
EBAY_FURNITURE_CATEGORIES = "3197"   # Furniture (parent — catches all sub-cats)

# Condition IDs: 3000=Used, 4000=Very Good, 5000=Good, 6000=Acceptable
EBAY_USED_CONDITIONS = "3000|4000|5000|6000"

# eBay uses miles for radius (max 200)
EBAY_MAX_RADIUS = 100


class EbayListingProvider(BaseListingProvider):
    """
    Searches eBay used furniture listings near the user's location.

    eBay Browse API filters used:
      - buyerPostalCode + buyerLocationRadius  → local results
      - conditions:{USED}                      → secondhand only
      - price:[min..max]                       → budget-gated
      - category_ids=3197                      → Furniture only
    """

    _access_token: Optional[str] = None
    _token_expires_at: float = 0.0

    # eBay Browse API endpoint
    _search_url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    _token_url  = "https://api.ebay.com/identity/v1/oauth2/token"
    _scope      = "https://api.ebay.com/oauth/api_scope"

    async def _get_token(self) -> str:
        """Fetch or return a cached OAuth2 client-credentials token."""
        now = time.monotonic()
        if self._access_token and now < self._token_expires_at - 30:
            return self._access_token

        import base64
        credentials = base64.b64encode(
            f"{settings.ebay_app_id}:{settings.ebay_client_secret}".encode()
        ).decode()

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                self._token_url,
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"grant_type": "client_credentials", "scope": self._scope},
            )
            resp.raise_for_status()
            payload = resp.json()

        self._access_token = payload["access_token"]
        self._token_expires_at = now + int(payload.get("expires_in", 7200))
        return self._access_token  # type: ignore[return-value]

    @staticmethod
    def _build_query(item: FurnitureItem) -> str:
        """
        Construct a keyword query from the FurnitureItem spec.
        E.g. 'scandinavian minimal oak sofa warm grey used'
        """
        parts = item.style_keywords[:2] + [item.category]
        # Add color only if it's specific enough to be useful
        if item.color and item.color.lower() not in ("neutral", "various", "mixed"):
            parts.append(item.color)
        return " ".join(parts)

    @staticmethod
    def _latlng_to_zip(lat: float, lng: float) -> Optional[str]:
        """
        Best-effort reverse geocode using a free endpoint (no API key).
        Falls back to None — eBay will return national results without zip.
        """
        try:
            import urllib.request
            url = (
                f"https://nominatim.openstreetmap.org/reverse"
                f"?lat={lat}&lon={lng}&format=json"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "touse-app/1.0"})
            with urllib.request.urlopen(req, timeout=4) as r:
                data = json.loads(r.read())
            return data.get("address", {}).get("postcode")
        except Exception:
            return None

    async def search(
        self,
        item: FurnitureItem,
        location: LatLng,
        radius_miles: int = 25,
    ) -> List[Listing]:
        try:
            token = await self._get_token()
            query = self._build_query(item)

            # Build filter string
            radius = min(radius_miles, EBAY_MAX_RADIUS)
            price_max = max(10, int(item.max_price_usd))
            condition_filter = f"conditions:{{{EBAY_USED_CONDITIONS}}}"
            price_filter = f"price:[5..{price_max}]"

            filter_parts = [condition_filter, price_filter]

            # Attempt zip-based local filter
            zip_code = self._latlng_to_zip(location.lat, location.lng)
            if zip_code:
                filter_parts.append(f"buyerPostalCode:{zip_code}")
                filter_parts.append(f"buyerLocationRadius:{radius}mi")

            params: dict[str, str] = {
                "q": query,
                "category_ids": EBAY_FURNITURE_CATEGORIES,
                "filter": ",".join(filter_parts),
                "sort": "distance" if zip_code else "price",
                "limit": "8",
                "fieldgroups": "MATCHING_ITEMS,ADDITIONAL_SELLER_DETAILS",
            }

            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(
                    self._search_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-EBAY-C-ENDUSERCTX": f"contextualLocation=country=US,zip={zip_code or ''}",
                    },
                    params=params,
                )
                resp.raise_for_status()
                data = resp.json()

            results: List[Listing] = []
            for it in data.get("itemSummaries", []):
                price_info = it.get("price", {})
                price_val  = float(price_info.get("value", 0))
                if price_val <= 0:
                    continue

                image_url = (
                    it.get("image", {}).get("imageUrl")
                    or f"https://picsum.photos/seed/{it.get('itemId','x')}/400/300"
                )

                # eBay sometimes returns distance in shippingOptions or itemLocation
                distance: Optional[float] = None
                item_loc = it.get("itemLocation", {})
                if item_loc.get("postalCode") and zip_code:
                    # We don't compute real distance here; eBay returns it when
                    # sort=distance — parse from distanceFromPickupLocation field
                    dist_obj = it.get("distanceFromPickupLocation", {})
                    if dist_obj.get("value"):
                        distance = float(dist_obj["value"])

                seller_info = it.get("seller", {})

                results.append(Listing(
                    provider=ListingProvider.ebay,
                    title=it.get("title", ""),
                    description=None,                      # not returned in summary
                    price=price_val,
                    image_url=image_url,
                    listing_url=it.get("itemWebUrl", ""),
                    seller_name=seller_info.get("username"),
                    seller_phone=None,                     # eBay doesn't expose phone
                    distance_miles=distance,
                    condition=it.get("condition", "Used"),
                    posted_at=it.get("itemCreationDate"),
                    furniture_item_id=item.id,
                ))

            return results

        except httpx.HTTPStatusError as e:
            # 401 = bad credentials, 429 = rate limit — both should surface clearly
            print(f"[eBay] HTTP {e.response.status_code}: {e.response.text[:200]}")
            return []
        except Exception as e:
            print(f"[eBay] search error: {e}")
            return []


# ── Fixture fallback ──────────────────────────────────────────────────────────

class FixtureListingProvider(BaseListingProvider):
    """
    Loads api/fixtures/furniture_listings.json.
    Active when MOCK_LISTINGS=true OR when eBay returns zero results.
    50 realistic listings across all furniture categories.
    """
    _data: Optional[List[dict]] = None

    def _load(self) -> List[dict]:
        if self._data is None:
            path = Path(__file__).parent.parent / "fixtures" / "furniture_listings.json"
            with open(path) as f:
                self._data = json.load(f)
        return self._data  # type: ignore[return-value]

    async def search(
        self,
        item: FurnitureItem,
        location: LatLng,
        radius_miles: int = 25,
    ) -> List[Listing]:
        data = self._load()
        cat = item.category.lower()

        # Two-pass: exact category match first, then partial title match
        exact   = [r for r in data if cat == r.get("category", "").lower()]
        partial = [r for r in data if cat in r.get("title", "").lower() and r not in exact]
        matches = (exact + partial) or data

        results: List[Listing] = []
        for r in matches[:6]:
            results.append(Listing(
                provider=ListingProvider.fixture,
                title=r["title"],
                description=r.get("description"),
                price=float(r["price"]),
                image_url=r.get("image_url", f"https://picsum.photos/seed/{r.get('id', 1)}/400/300"),
                listing_url=r.get("listing_url", "#"),
                seller_name=r.get("seller_name"),
                seller_phone=r.get("seller_phone"),
                distance_miles=float(r.get("distance_miles", 5.0)),
                condition=r.get("condition", "good"),
                furniture_item_id=item.id,
            ))
        return results

"""
ListingMatcher — fetches and scores eBay listings per FurnitureItem.

Provider cascade
----------------
1. EbayListingProvider  — live eBay used-furniture search (location-filtered)
2. FixtureListingProvider — JSON fallback when eBay returns 0 results OR MOCK_LISTINGS=true

Scoring
-------
score = 0.5 × price_fit + 0.3 × distance_score + 0.2 × recency_score
Returns top-3 per item.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import List

from api.config import settings
from api.models import FurnitureItem, LatLng, Listing
from api.services.listing_provider import EbayListingProvider, FixtureListingProvider


_ebay     = EbayListingProvider()
_fixtures = FixtureListingProvider()


# ── Scoring helpers ───────────────────────────────────────────────────────────

def _price_fit(listing: Listing, item: FurnitureItem) -> float:
    """
    Scores how well the listing price matches the item budget.
    - At or below max price → scales up to 1.0 (sweet spot 50–100 % of budget)
    - Over max price → decays linearly to 0
    """
    if listing.price <= 0 or item.max_price_usd <= 0:
        return 0.0
    ratio = listing.price / item.max_price_usd
    if ratio > 1.0:
        return max(0.0, 1.0 - (ratio - 1.0) * 2)   # steep penalty over budget
    return min(1.0, ratio / 0.5)                     # prefer ≥50 % of budget


def _distance_score(listing: Listing) -> float:
    """
    Closer = higher score.
    0 mi → 1.0 | 50 mi → 0.0 | unknown → 0.5 (neutral)
    eBay with zip filter returns distance; without zip it's None.
    """
    if listing.distance_miles is None:
        return 0.5
    return max(0.0, 1.0 - listing.distance_miles / 50.0)


def _recency_score(listing: Listing) -> float:
    """
    More recently listed = higher score.
    Uses itemCreationDate when eBay provides it; otherwise neutral 0.5.
    Within 7 days → 1.0 | older than 90 days → 0.0
    """
    if not listing.posted_at:
        return 0.5
    try:
        listed = datetime.fromisoformat(listing.posted_at.replace("Z", "+00:00"))
        age_days = (datetime.now(timezone.utc) - listed).days
        return max(0.0, 1.0 - age_days / 90.0)
    except Exception:
        return 0.5


def score_listing(listing: Listing, item: FurnitureItem) -> float:
    return (
        0.5 * _price_fit(listing, item)
        + 0.3 * _distance_score(listing)
        + 0.2 * _recency_score(listing)
    )


# ── Public search entry-point ─────────────────────────────────────────────────

async def find_listings_for_item(
    item: FurnitureItem,
    location: LatLng,
    radius_miles: int = 25,
) -> List[Listing]:
    """
    Returns top-3 scored listings for a single FurnitureItem.
    Cascade: eBay → fixtures (if eBay returns nothing or MOCK_LISTINGS=true).
    """
    if settings.mock_listings:
        results = await _fixtures.search(item, location, radius_miles)
    else:
        results = await _ebay.search(item, location, radius_miles)
        if not results:
            # eBay returned nothing — use fixtures as graceful fallback
            results = await _fixtures.search(item, location, radius_miles)

    for listing in results:
        listing.score = score_listing(listing, item)
    results.sort(key=lambda l: l.score or 0.0, reverse=True)
    return results[:3]


async def match_listings_for_design(design_data: dict, location: LatLng) -> dict:
    """
    Fan-out: match listings for every FurnitureItem in a design in parallel.
    Updates design_data["items"] in-place and returns the modified dict.
    """
    items = design_data.get("items", [])

    async def _match(item_dict: dict) -> dict:
        item = FurnitureItem(**item_dict)
        matched = await find_listings_for_item(item, location)
        item_dict["matched_listings"] = [lst.model_dump() for lst in matched]
        return item_dict

    design_data["items"] = list(await asyncio.gather(*[_match(i) for i in items]))
    return design_data

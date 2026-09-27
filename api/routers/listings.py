"""
Listing match router.
POST /designs/{design_id}/match-listings — fan-out listing search for all items in design
GET  /listings/{listing_id}              — single listing
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from api.auth import get_current_user_id
from api.db import get_supabase
from api.services.listing_matcher import match_listings_for_design
from api.models import LatLng

router = APIRouter()


@router.post("/{design_id}/match-listings")
async def match_listings(
    design_id: str,
    location: LatLng,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    row = sb.table("room_designs").select("*").eq("id", design_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Design not found")

    design_data = row.data
    matched_design = await match_listings_for_design(design_data, location)

    # Persist updated items with matched listings
    sb.table("room_designs").update({
        "items": matched_design["items"],
    }).eq("id", design_id).execute()

    return matched_design


@router.get("/{listing_id}")
async def get_listing(listing_id: str, user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    row = sb.table("listings").select("*").eq("id", listing_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Listing not found")
    return row.data

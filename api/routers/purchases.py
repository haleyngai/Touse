"""
Purchases router.
POST /purchases        — mark item as purchased
GET  /purchases        — list user purchases
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime

from api.auth import get_current_user_id
from api.db import get_supabase

router = APIRouter()


class CreatePurchaseRequest(BaseModel):
    listing_id: str
    price_paid: float


@router.post("/")
async def create_purchase(
    body: CreatePurchaseRequest,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()

    # Verify listing exists
    listing = sb.table("listings").select("id").eq("id", body.listing_id).single().execute()
    if not listing.data:
        raise HTTPException(404, "Listing not found")

    row = sb.table("purchases").insert({
        "user_id": user_id,
        "listing_id": body.listing_id,
        "price_paid": body.price_paid,
        "purchased_at": datetime.utcnow().isoformat(),
    }).execute()

    return row.data[0]


@router.get("/")
async def list_purchases(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    rows = (
        sb.table("purchases")
        .select("*, listing:listings(*)")
        .eq("user_id", user_id)
        .order("purchased_at", desc=True)
        .execute()
    )
    return rows.data

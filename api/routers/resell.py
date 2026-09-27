"""
Resell router.
POST /resell/generate   — Claude generates resell listing + FB deep link
GET  /resell/           — list user's resell listings
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from urllib.parse import urlencode

from api.auth import get_current_user_id
from api.db import get_supabase
from api.services.resell_generator import generate_resell_listing
from api.models import Condition

router = APIRouter()


class ResellGenerateRequest(BaseModel):
    purchase_id: str
    condition: Condition
    photo_url: Optional[str] = None


def build_fb_deep_link(title: str, description: str, price: float, category: str) -> str:
    params = urlencode({
        "title": title,
        "description": description,
        "price": int(price),
        "category": category,
    })
    return f"https://www.facebook.com/marketplace/create/item?{params}"


@router.post("/generate")
async def generate_resell(
    body: ResellGenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()

    # Fetch purchase + listing
    purchase_row = (
        sb.table("purchases")
        .select("*, listing:listings(*)")
        .eq("id", body.purchase_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not purchase_row.data:
        raise HTTPException(404, "Purchase not found")

    purchase = purchase_row.data
    listing = purchase.get("listing") or {}

    generated = await generate_resell_listing(
        listing_title=listing.get("title", "Furniture item"),
        listing_description=listing.get("description", ""),
        condition=body.condition,
        price_paid=purchase["price_paid"],
        category=listing.get("category", "furniture"),
    )

    deep_link = build_fb_deep_link(
        title=generated["title"],
        description=generated["description"],
        price=generated["price"],
        category=generated["fb_category"],
    )

    row = sb.table("resell_listings").insert({
        "user_id": user_id,
        "purchase_id": body.purchase_id,
        "title": generated["title"],
        "description": generated["description"],
        "price": generated["price"],
        "condition": body.condition,
        "fb_category": generated["fb_category"],
        "photo_url": body.photo_url,
        "deep_link": deep_link,
        "status": "draft",
    }).execute()

    return row.data[0]


@router.get("/")
async def list_resell(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    rows = (
        sb.table("resell_listings")
        .select("*, purchase:purchases(*, listing:listings(*))")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data

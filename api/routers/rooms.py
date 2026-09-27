"""
Room upload + Claude vision analysis router.
POST /rooms/upload          — receive image, store in Supabase Storage, create room row
POST /rooms/{id}/analyze    — trigger Claude vision, persist RoomAnalysis
POST /rooms/{id}/generate   — alias: trigger design pipeline
GET  /rooms/{id}            — fetch room + analysis
GET  /rooms/{id}/designs    — list designs for this room
GET  /rooms/                — list all rooms for user
"""
import uuid
import io
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel

from api.auth import get_current_user_id
from api.db import get_supabase
from api.services.vision import analyze_room_image
from api.config import settings

router = APIRouter()

MAX_BYTES = settings.max_upload_mb * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


@router.post("/upload")
async def upload_room(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(400, f"File exceeds {settings.max_upload_mb} MB limit")

    sb = get_supabase()
    room_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{room_id}.jpg"

    # Upload to Supabase Storage
    sb.storage.from_("room-photos").upload(
        path=storage_path,
        file=io.BytesIO(raw),
        file_options={"content-type": file.content_type or "image/jpeg"},
    )

    photo_url = sb.storage.from_("room-photos").get_public_url(storage_path)

    # Create rooms row
    row = sb.table("rooms").insert({
        "id": room_id,
        "user_id": user_id,
        "photo_url": photo_url,
    }).execute()

    return row.data[0]


@router.post("/{room_id}/analyze")
async def analyze_room(
    room_id: str,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()

    # Fetch room
    row = sb.table("rooms").select("*").eq("id", room_id).eq("user_id", user_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Room not found")

    room = row.data
    photo_url: str = room["photo_url"]

    # Run Claude vision
    analysis = await analyze_room_image(photo_url)

    # Persist
    updated = sb.table("rooms").update({
        "analysis": analysis.model_dump(),
    }).eq("id", room_id).execute()

    return updated.data[0]


@router.get("/{room_id}")
async def get_room(
    room_id: str,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    row = sb.table("rooms").select("*").eq("id", room_id).eq("user_id", user_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Room not found")
    return row.data


@router.get("/")
async def list_rooms(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    rows = sb.table("rooms").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return rows.data


@router.get("/{room_id}/designs")
async def list_room_designs(
    room_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """List all designs for a given room."""
    sb = get_supabase()
    # Verify room ownership
    room = sb.table("rooms").select("id").eq("id", room_id).eq("user_id", user_id).single().execute()
    if not room.data:
        raise HTTPException(404, "Room not found")
    rows = (
        sb.table("room_designs")
        .select("*")
        .eq("room_id", room_id)
        .order("created_at", desc=False)
        .execute()
    )
    return rows.data


class GenerateDesignsRequest(BaseModel):
    budget_usd: Optional[float] = None


@router.post("/{room_id}/designs")
async def generate_designs_for_room(
    room_id: str,
    body: GenerateDesignsRequest = GenerateDesignsRequest(),
    user_id: str = Depends(get_current_user_id),
):
    """Trigger the LangGraph design pipeline for this room."""
    from api.agents.design_pipeline import run_design_pipeline

    sb = get_supabase()
    room_row = (
        sb.table("rooms")
        .select("*")
        .eq("id", room_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not room_row.data:
        raise HTTPException(404, "Room not found")
    if not room_row.data.get("analysis"):
        raise HTTPException(400, "Room has not been analyzed yet. Call POST /rooms/{id}/analyze first.")

    designs = await run_design_pipeline(
        room_id=room_id,
        analysis=room_row.data["analysis"],
        user_id=user_id,
        budget_usd=body.budget_usd,
    )
    return designs

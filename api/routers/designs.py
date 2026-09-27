"""
Design pipeline router.
POST /designs/rooms/{room_id}/generate  — trigger LangGraph pipeline
GET  /designs/{design_id}               — fetch single design
GET  /rooms/{room_id}/designs           — list designs for a room
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from api.auth import get_current_user_id
from api.db import get_supabase
from api.agents.design_pipeline import run_design_pipeline

router = APIRouter()


class BudgetRequest(BaseModel):
    budget_usd: Optional[float] = None


@router.post("/{room_id}/generate")
async def generate_designs(
    room_id: str,
    body: BudgetRequest = BudgetRequest(),
    user_id: str = Depends(get_current_user_id),
):
    """Triggers the full LangGraph design pipeline and persists 3 RoomDesign rows."""
    sb = get_supabase()

    # Verify room belongs to user
    room_row = sb.table("rooms").select("*").eq("id", room_id).eq("user_id", user_id).single().execute()
    if not room_row.data:
        raise HTTPException(404, "Room not found")

    room = room_row.data
    if not room.get("analysis"):
        raise HTTPException(400, "Room has not been analyzed yet. Call /rooms/{id}/analyze first.")

    designs = await run_design_pipeline(
        room_id=room_id,
        analysis=room["analysis"],
        user_id=user_id,
        budget_usd=body.budget_usd,
    )

    return designs


@router.get("/{design_id}")
async def get_design(
    design_id: str,
    user_id: str = Depends(get_current_user_id),
):
    sb = get_supabase()
    row = sb.table("room_designs").select("*").eq("id", design_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Design not found")
    return row.data


# This route is mounted at /rooms prefix separately (see rooms router)
# Re-export helper so rooms router can use it

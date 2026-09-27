"""
Messages router.
POST /messages/send-batch  — generate + send AI messages to all selected listings
POST /messages/webhook     — Twilio inbound SMS webhook
GET  /messages/            — list messages for user
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from typing import List

from api.auth import get_current_user_id
from api.db import get_supabase
from api.services.messaging import generate_and_send_batch, handle_twilio_webhook

router = APIRouter()


class SendBatchRequest(BaseModel):
    listing_ids: List[str]


@router.post("/send-batch")
async def send_batch(
    body: SendBatchRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not body.listing_ids:
        raise HTTPException(400, "listing_ids cannot be empty")

    result = await generate_and_send_batch(
        listing_ids=body.listing_ids,
        user_id=user_id,
    )
    return result


@router.post("/webhook")
async def twilio_webhook(request: Request):
    """
    Twilio calls this URL when an SMS reply arrives.
    Must be publicly reachable — tunnel via ngrok locally.
    """
    form = await request.form()
    await handle_twilio_webhook(dict(form))
    # Twilio expects an empty TwiML response
    return Response(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="application/xml",
    )


@router.get("/")
async def list_messages(user_id: str = Depends(get_current_user_id)):
    sb = get_supabase()
    rows = (
        sb.table("messages")
        .select("*, listing:listings(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return rows.data

"""
AI message generation + Twilio send service.
"""
from __future__ import annotations
import asyncio
from datetime import datetime

import anthropic
from twilio.rest import Client as TwilioClient

from api.models import Message, MessageStatus, MessageDirection
from api.db import get_supabase
from api.config import settings

_claude: anthropic.AsyncAnthropic | None = None
_twilio: TwilioClient | None = None


def get_claude() -> anthropic.AsyncAnthropic:
    global _claude
    if _claude is None:
        _claude = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _claude


def get_twilio() -> TwilioClient:
    global _twilio
    if _twilio is None:
        _twilio = TwilioClient(settings.twilio_account_sid, settings.twilio_auth_token)
    return _twilio


MESSAGE_SYSTEM = """You are a friendly, savvy second-hand furniture buyer.
Write a casual, warm SMS opening message to a seller that:
1. References the specific item title and where you found it
2. Mentions your design context (aesthetic + room type)
3. Confirms availability and gently opens price negotiation
Keep it under 160 characters. Return ONLY the message text, no quotes."""


async def generate_message(
    listing_title: str,
    listing_source: str,
    seller_name: str | None,
    aesthetic_name: str,
    room_type: str,
    asking_price: float,
) -> str:
    user_msg = (
        f"Item: {listing_title}\n"
        f"Found on: {listing_source}\n"
        f"Seller: {seller_name or 'the seller'}\n"
        f"My room: {room_type} in {aesthetic_name} style\n"
        f"Asking price: ${asking_price:.0f}\n"
        "Write the SMS:"
    )
    client = get_claude()
    resp = await client.messages.create(
        model="claude-opus-4-5",
        max_tokens=200,
        system=MESSAGE_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    return resp.content[0].text.strip()


async def _send_or_manual(
    listing_id: str,
    user_id: str,
    content: str,
    seller_phone: str | None,
) -> Message:
    sb = get_supabase()

    if seller_phone and settings.twilio_account_sid:
        try:
            twilio = get_twilio()
            twilio_msg = twilio.messages.create(
                body=content,
                from_=settings.twilio_phone_number,
                to=seller_phone,
            )
            status = MessageStatus.sent
            twilio_sid = twilio_msg.sid
        except Exception:
            status = MessageStatus.failed
            twilio_sid = None
    else:
        status = MessageStatus.pending_manual
        twilio_sid = None

    row = sb.table("messages").insert({
        "user_id": user_id,
        "listing_id": listing_id,
        "content": content,
        "direction": MessageDirection.outbound,
        "status": status,
        "twilio_sid": twilio_sid,
        "seller_phone": seller_phone,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }).execute()

    return row.data[0]


async def generate_and_send_batch(listing_ids: list[str], user_id: str) -> dict:
    sb = get_supabase()

    # Fetch all listings + their design context
    listings_resp = (
        sb.table("listings")
        .select("*")
        .in_("id", listing_ids)
        .execute()
    )
    listings = listings_resp.data

    async def process(listing: dict):
        content = await generate_message(
            listing_title=listing.get("title", "item"),
            listing_source=listing.get("provider", "listing"),
            seller_name=listing.get("seller_name"),
            aesthetic_name="your space",
            room_type="room",
            asking_price=listing.get("price", 0),
        )
        return await _send_or_manual(
            listing_id=listing["id"],
            user_id=user_id,
            content=content,
            seller_phone=listing.get("seller_phone"),
        )

    results = await asyncio.gather(*[process(l) for l in listings])

    sent = sum(1 for r in results if r["status"] == "sent")
    pending = sum(1 for r in results if r["status"] == "pending_manual")

    return {
        "sent": sent,
        "pending_manual": pending,
        "messages": results,
    }


async def handle_twilio_webhook(form: dict) -> None:
    """Process an inbound SMS reply from Twilio."""
    from_number = form.get("From", "")
    body = form.get("Body", "")

    sb = get_supabase()

    # Find the most recent outbound message to this number
    row = (
        sb.table("messages")
        .select("*")
        .eq("seller_phone", from_number)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if row.data:
        original = row.data[0]
        # Insert inbound reply
        sb.table("messages").insert({
            "user_id": original["user_id"],
            "listing_id": original["listing_id"],
            "content": body,
            "direction": MessageDirection.inbound,
            "status": MessageStatus.replied,
            "seller_phone": from_number,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }).execute()

        # Update original thread status
        sb.table("messages").update({
            "status": MessageStatus.replied,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", original["id"]).execute()

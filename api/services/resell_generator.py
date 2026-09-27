"""
Claude-powered resell listing generator.
"""
import json
import anthropic

from api.config import settings
from api.models import Condition

_client: anthropic.AsyncAnthropic | None = None

CONDITION_MULTIPLIERS = {
    Condition.excellent: 1.3,
    Condition.good: 1.1,
    Condition.fair: 0.85,
    Condition.poor: 0.6,
}

RESELL_SYSTEM = """You are an expert copywriter for secondhand furniture marketplaces.
Given the original listing info, condition, and purchase price, generate a resell listing.

Return ONLY valid JSON:
{
  "title": "punchy, specific resell title under 80 chars",
  "description": "honest, appealing 2-3 sentence description. Reference style if known. Note condition honestly.",
  "price": <integer price in USD>,
  "fb_category": "one of: FURNITURE, HOME_GOODS, APPLIANCES, ELECTRONICS"
}"""


async def generate_resell_listing(
    listing_title: str,
    listing_description: str,
    condition: Condition,
    price_paid: float,
    category: str,
) -> dict:
    multiplier = CONDITION_MULTIPLIERS[condition]
    suggested_price = round(price_paid * multiplier)

    user_msg = (
        f"Original title: {listing_title}\n"
        f"Original description: {listing_description[:500]}\n"
        f"Category: {category}\n"
        f"Condition: {condition}\n"
        f"Purchase price: ${price_paid:.0f}\n"
        f"Suggested price: ${suggested_price} (feel free to adjust based on category/condition)\n"
        "Generate the resell listing:"
    )

    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    resp = await _client.messages.create(
        model="claude-opus-4-5",
        max_tokens=500,
        system=RESELL_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = resp.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    data = json.loads(raw)
    # Ensure price is reasonable
    if data.get("price", 0) <= 0:
        data["price"] = suggested_price

    return data

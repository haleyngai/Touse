"""
Claude vision service — analyzes a room photo URL and returns a structured RoomAnalysis.
"""
import httpx
import anthropic

from api.models import RoomAnalysis, RoomSize
from api.config import settings

_client: anthropic.AsyncAnthropic | None = None


def get_claude() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


VISION_SYSTEM_PROMPT = """You are an expert interior design analyst. 
Analyze the room photo and return a JSON object matching exactly this schema:
{
  "room_type": "string (living room | bedroom | dining room | home office | studio | other)",
  "style_keywords": ["array", "of", "style", "keywords"],
  "dominant_colors": ["hex or named colors", "max 5"],
  "dimensions_estimate": "small | medium | large",
  "empty_zones": ["natural language descriptions of empty areas, e.g. 'left wall near window'"],
  "sq_ft_estimate": null_or_integer
}
Be concise. Return ONLY valid JSON, no markdown.
"""


async def analyze_room_image(photo_url: str) -> RoomAnalysis:
    """Download the image and pass to Claude claude-opus-4-5 for structured vision analysis."""
    # Download image bytes
    async with httpx.AsyncClient() as http:
        resp = await http.get(photo_url)
        resp.raise_for_status()
        image_data = resp.content
        content_type = resp.headers.get("content-type", "image/jpeg")
        if not content_type.startswith("image/"):
            content_type = "image/jpeg"

    import base64
    b64 = base64.standard_b64encode(image_data).decode("utf-8")

    client = get_claude()
    message = await client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=VISION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": content_type,  # type: ignore[arg-type]
                            "data": b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Analyze this room and return the JSON schema described.",
                    },
                ],
            }
        ],
    )

    import json
    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw)

    return RoomAnalysis(
        room_type=data.get("room_type", "living room"),
        style_keywords=data.get("style_keywords", []),
        dominant_colors=data.get("dominant_colors", []),
        dimensions_estimate=RoomSize(data.get("dimensions_estimate", "medium")),
        empty_zones=data.get("empty_zones", []),
        sq_ft_estimate=data.get("sq_ft_estimate"),
    )

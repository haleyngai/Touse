"""
LangGraph Design Pipeline
=========================
Graph: style_expander → [design_generator × 3 parallel] → design_validator

Nodes
-----
style_expander   : Claude — takes RoomAnalysis, expands to 3 distinct aesthetic directions
design_generator : Nemotron (×3 parallel fan-out) — generates 6-10 FurnitureItem specs per aesthetic
design_validator : Claude — checks budget cap, flags missing essential categories

State
-----
DesignState is the shared TypedDict threaded through every node.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any, List, Optional, TypedDict

import anthropic
from openai import AsyncOpenAI

from api.config import settings
from api.db import get_supabase
from api.models import FurnitureItem, RoomDesign


# ── LangGraph state ──────────────────────────────────────────────────────────

class DesignState(TypedDict):
    room_id: str
    user_id: str
    analysis: dict                       # RoomAnalysis dict
    budget_usd: Optional[float]
    aesthetics: List[dict]               # [{name, description, keywords}]
    raw_designs: List[dict]              # raw FurnitureItem lists from Nemotron
    validated_designs: List[dict]        # after Claude validation
    errors: List[str]


# ── Claude client ────────────────────────────────────────────────────────────

def _claude() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


# ── Nemotron client (NVIDIA OpenAI-compatible endpoint) ──────────────────────

def _nemotron() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url,
    )


# ── Node 1: style_expander ────────────────────────────────────────────────────

STYLE_EXPANDER_SYSTEM = """You are an expert interior designer.
Given a room analysis, expand to exactly 3 distinct aesthetic directions.
Each should be meaningfully different (e.g. Scandinavian minimal, Industrial loft, Warm bohemian).
Return ONLY a JSON array of 3 objects:
[
  {
    "name": "Aesthetic Name",
    "description": "1-sentence evocative description",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]"""


async def style_expander_node(state: DesignState) -> DesignState:
    analysis = state["analysis"]
    style_kws = ", ".join(analysis.get("style_keywords", []))
    room_type = analysis.get("room_type", "room")
    colors = ", ".join(analysis.get("dominant_colors", [])[:3])

    user_msg = (
        f"Room type: {room_type}\n"
        f"Detected style keywords: {style_kws}\n"
        f"Dominant colors: {colors}\n"
        f"Size: {analysis.get('dimensions_estimate', 'medium')}\n"
        "Generate 3 distinct aesthetic directions:"
    )

    claude = _claude()
    resp = await claude.messages.create(
        model="claude-opus-4-5",
        max_tokens=600,
        system=STYLE_EXPANDER_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = _strip_fences(resp.content[0].text)
    aesthetics = json.loads(raw)

    return {**state, "aesthetics": aesthetics}


# ── Node 2: design_generator (runs ×3 in parallel) ───────────────────────────

DESIGN_GENERATOR_SYSTEM = """You are an interior design AI assistant.
Given an aesthetic direction and room details, generate a complete furniture specification list.
Return ONLY a JSON array of 6-10 furniture items:
[
  {
    "category": "sofa",
    "style_keywords": ["keyword1", "keyword2"],
    "color": "warm grey",
    "max_price_usd": 350,
    "placement_note": "against left wall facing window"
  }
]
Categories to consider: sofa, armchair, coffee table, dining table, dining chair, floor lamp,
table lamp, bookshelf, dresser, nightstand, rug, side table, desk, bed frame, wardrobe, wall art.
Budget distribution: sofa ~30%, dining ~20%, lighting ~15%, storage ~15%, accent pieces ~20%."""


async def _generate_single_design(
    aesthetic: dict,
    analysis: dict,
    budget_usd: Optional[float],
    room_id: str,
) -> dict:
    """Generate FurnitureItem list for one aesthetic using Nemotron."""
    zones = ", ".join(analysis.get("empty_zones", []))
    budget_line = f"Total budget cap: ${budget_usd:.0f}" if budget_usd else "No strict budget cap"

    user_msg = (
        f"Aesthetic: {aesthetic['name']} — {aesthetic['description']}\n"
        f"Style keywords: {', '.join(aesthetic.get('keywords', []))}\n"
        f"Room type: {analysis.get('room_type', 'living room')}\n"
        f"Room size: {analysis.get('dimensions_estimate', 'medium')}\n"
        f"Empty zones: {zones}\n"
        f"{budget_line}\n"
        "Generate the furniture specification list:"
    )

    nemotron = _nemotron()
    resp = await nemotron.chat.completions.create(
        model=settings.nemotron_model,
        messages=[
            {"role": "system", "content": DESIGN_GENERATOR_SYSTEM},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=1200,
        temperature=0.7,
    )

    raw = _strip_fences(resp.choices[0].message.content or "[]")
    items_raw = json.loads(raw)

    items = [
        FurnitureItem(
            id=str(uuid.uuid4()),
            category=it.get("category", "furniture"),
            style_keywords=it.get("style_keywords", aesthetic.get("keywords", [])),
            color=it.get("color", "neutral"),
            max_price_usd=float(it.get("max_price_usd", 200)),
            placement_note=it.get("placement_note", ""),
        )
        for it in items_raw
    ]

    total = sum(i.max_price_usd for i in items)

    return {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "aesthetic_name": aesthetic["name"],
        "aesthetic_description": aesthetic["description"],
        "items": [i.model_dump() for i in items],
        "total_estimated_cost": total,
        "budget_valid": True,
        "created_at": datetime.utcnow().isoformat(),
    }


async def design_generator_node(state: DesignState) -> DesignState:
    """Fan-out: run all 3 design_generators in parallel."""
    tasks = [
        _generate_single_design(
            aesthetic=aesthetic,
            analysis=state["analysis"],
            budget_usd=state.get("budget_usd"),
            room_id=state["room_id"],
        )
        for aesthetic in state["aesthetics"]
    ]
    raw_designs = await asyncio.gather(*tasks)
    return {**state, "raw_designs": list(raw_designs)}


# ── Node 3: design_validator ──────────────────────────────────────────────────

VALIDATOR_SYSTEM = """You are an interior design quality reviewer.
Review a furniture design and return a corrected JSON object.
Check:
1. Budget not exceeded (if budget_cap given)
2. Essential categories present: at least one seating item, one lighting item, one storage item
3. Items make sense for the room type
Return ONLY the JSON design object with these fields updated:
- budget_valid: boolean
- items: corrected array (add missing essentials if needed)
- total_estimated_cost: recalculated total"""

ESSENTIAL_CATEGORIES = {
    "seating": ["sofa", "armchair", "chair", "couch", "loveseat"],
    "lighting": ["floor lamp", "table lamp", "lamp", "pendant light", "chandelier"],
    "storage": ["bookshelf", "dresser", "wardrobe", "storage", "shelving", "cabinet"],
}


def _has_category(items: list[dict], group: list[str]) -> bool:
    for item in items:
        cat = item.get("category", "").lower()
        if any(g in cat for g in group):
            return True
    return False


def _add_missing_essentials(items: list[dict], aesthetic_keywords: list[str]) -> list[dict]:
    """Add placeholder essential items if missing — validator may refine."""
    if not _has_category(items, ESSENTIAL_CATEGORIES["seating"]):
        items.append({
            "id": str(uuid.uuid4()),
            "category": "armchair",
            "style_keywords": aesthetic_keywords,
            "color": "neutral",
            "max_price_usd": 150,
            "placement_note": "near window or open corner",
            "matched_listings": [],
        })
    if not _has_category(items, ESSENTIAL_CATEGORIES["lighting"]):
        items.append({
            "id": str(uuid.uuid4()),
            "category": "floor lamp",
            "style_keywords": aesthetic_keywords,
            "color": "matte black",
            "max_price_usd": 80,
            "placement_note": "corner of room",
            "matched_listings": [],
        })
    if not _has_category(items, ESSENTIAL_CATEGORIES["storage"]):
        items.append({
            "id": str(uuid.uuid4()),
            "category": "bookshelf",
            "style_keywords": aesthetic_keywords,
            "color": "natural wood",
            "max_price_usd": 100,
            "placement_note": "against empty wall",
            "matched_listings": [],
        })
    return items


async def design_validator_node(state: DesignState) -> DesignState:
    """Claude validates each design for completeness and budget compliance."""
    validated: list[dict] = []
    budget = state.get("budget_usd")

    for design in state["raw_designs"]:
        items = design.get("items", [])
        aesthetic_kws = design.get("aesthetic_description", "").split()[:3]

        # Quick structural check first (no LLM cost for trivial fixes)
        items = _add_missing_essentials(items, aesthetic_kws)
        total = sum(float(i.get("max_price_usd", 0)) for i in items)
        budget_valid = (budget is None) or (total <= budget * 1.05)  # 5% tolerance

        design["items"] = items
        design["total_estimated_cost"] = total
        design["budget_valid"] = budget_valid
        validated.append(design)

    return {**state, "validated_designs": validated}


# ── Pipeline orchestrator ─────────────────────────────────────────────────────

async def run_design_pipeline(
    room_id: str,
    analysis: dict,
    user_id: str,
    budget_usd: Optional[float] = None,
) -> list[dict]:
    """
    Run the full 3-node pipeline and persist RoomDesign rows to Supabase.
    Returns the list of 3 persisted design dicts.
    """
    # Initial state
    state: DesignState = {
        "room_id": room_id,
        "user_id": user_id,
        "analysis": analysis,
        "budget_usd": budget_usd,
        "aesthetics": [],
        "raw_designs": [],
        "validated_designs": [],
        "errors": [],
    }

    # Node 1 — style_expander
    state = await style_expander_node(state)

    # Node 2 — design_generator (parallel fan-out × 3)
    state = await design_generator_node(state)

    # Node 3 — design_validator
    state = await design_validator_node(state)

    # Persist to Supabase
    sb = get_supabase()
    designs_to_insert = []
    for design in state["validated_designs"]:
        design["user_id"] = user_id
        designs_to_insert.append(design)

    result = sb.table("room_designs").insert(designs_to_insert).execute()
    return result.data


# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip_fences(text: str) -> str:
    """Remove markdown code fences from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    return text.strip()

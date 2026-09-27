"""
Shared domain models (Pydantic schemas).
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
import uuid


# ── Enums ──────────────────────────────────────────────────────────────────

class RoomSize(str, Enum):
    small = "small"
    medium = "medium"
    large = "large"


class ListingProvider(str, Enum):
    ebay = "ebay"
    fixture = "fixture"


class MessageStatus(str, Enum):
    pending_manual = "pending_manual"
    sent = "sent"
    delivered = "delivered"
    replied = "replied"
    failed = "failed"


class MessageDirection(str, Enum):
    outbound = "outbound"
    inbound = "inbound"


class Condition(str, Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"


# ── Core domain models ─────────────────────────────────────────────────────

class LatLng(BaseModel):
    lat: float
    lng: float


class RoomAnalysis(BaseModel):
    room_type: str
    style_keywords: List[str]
    dominant_colors: List[str]
    dimensions_estimate: RoomSize
    empty_zones: List[str]
    sq_ft_estimate: Optional[int] = None


class FurnitureItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    style_keywords: List[str]
    color: str
    max_price_usd: float
    placement_note: str
    matched_listings: List["Listing"] = []


class Listing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: ListingProvider
    title: str
    description: Optional[str] = None
    price: float
    image_url: str
    listing_url: str
    seller_name: Optional[str] = None
    seller_phone: Optional[str] = None
    distance_miles: Optional[float] = None
    condition: Optional[str] = None
    posted_at: Optional[str] = None
    furniture_item_id: Optional[str] = None
    design_id: Optional[str] = None
    score: Optional[float] = None


class RoomDesign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    aesthetic_name: str
    aesthetic_description: str
    items: List[FurnitureItem]
    total_estimated_cost: float = 0.0
    budget_valid: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    content: str
    direction: MessageDirection = MessageDirection.outbound
    status: MessageStatus = MessageStatus.pending_manual
    twilio_sid: Optional[str] = None
    seller_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Purchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    listing_id: str
    price_paid: float
    purchased_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ResellListing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    purchase_id: str
    title: str
    description: str
    price: float
    condition: Condition
    fb_category: str
    photo_url: Optional[str] = None
    deep_link: Optional[str] = None
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)

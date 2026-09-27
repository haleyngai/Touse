// ============================================================
// Core domain types for Touse
// ============================================================

export interface User {
  id: string
  clerk_id: string
  email: string
  full_name?: string
  avatar_url?: string
  lat?: number
  lng?: number
  zip?: string
  city?: string
  created_at: string
}

export interface Room {
  id: string
  user_id: string
  photo_url: string
  analysis?: RoomAnalysis
  created_at: string
}

export interface RoomAnalysis {
  room_type: string
  style_keywords: string[]
  dominant_colors: string[]
  dimensions_estimate: 'small' | 'medium' | 'large'
  empty_zones: string[]
  sq_ft_estimate?: number
}

export interface FurnitureItem {
  id: string
  category: string
  style_keywords: string[]
  color: string
  max_price_usd: number
  placement_note: string
  matched_listings?: Listing[]
}

export interface RoomDesign {
  id: string
  room_id: string
  aesthetic_name: string
  aesthetic_description: string
  items: FurnitureItem[]
  total_estimated_cost: number
  budget_valid: boolean
  created_at: string
}

export interface Listing {
  id: string
  provider: 'ebay' | 'fixture'
  title: string
  description?: string
  price: number
  image_url: string
  listing_url: string
  seller_name?: string
  seller_phone?: string
  distance_miles?: number
  condition?: string
  posted_at?: string
  furniture_item_id?: string
  design_id?: string
  score?: number
}

export interface Message {
  id: string
  user_id: string
  listing_id: string
  listing?: Listing
  content: string
  direction: 'outbound' | 'inbound'
  status: 'pending_manual' | 'sent' | 'delivered' | 'replied' | 'failed'
  twilio_sid?: string
  seller_phone?: string
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  user_id: string
  listing_id: string
  listing?: Listing
  price_paid: number
  purchased_at: string
  created_at: string
}

export interface ResellListing {
  id: string
  user_id: string
  purchase_id: string
  purchase?: Purchase
  title: string
  description: string
  price: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  fb_category: string
  photo_url?: string
  deep_link?: string
  status: 'draft' | 'posted'
  created_at: string
}

// API response shapes
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface DesignPipelineResponse {
  designs: RoomDesign[]
  room_id: string
}

export interface MessageBatchRequest {
  listing_ids: string[]
}

export interface MessageBatchResponse {
  sent: number
  pending_manual: number
  messages: Message[]
}

export interface ResellGenerateRequest {
  purchase_id: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  photo_url?: string
}

// Location
export interface LatLng {
  lat: number
  lng: number
}

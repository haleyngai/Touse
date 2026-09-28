# Touse
## AI Powered Furniture Marketplace Extension

> **Empty room → fully furnished** using real nearby second-hand listings, in minutes.

Touse is a full-stack web + mobile PWA that takes a photo of an empty room, generates 3 AI-designed furnished room concepts grounded in real local eBay listings, lets you message every seller simultaneously with AI-written SMS, and makes reselling just as frictionless with one-tap AI listing generation → Facebook Marketplace deep-link.

---

## Architecture

```
/
├── web/          Next.js 16 + React 19 + TypeScript + Tailwind (PWA)
└── api/          FastAPI + LangGraph multi-agent pipeline (Python)
```

**Stack at a glance:**

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, App Router |
| Auth | Clerk (frontend) + Clerk JWT verification (FastAPI middleware) |
| Database | Supabase Postgres + Realtime |
| Storage | Supabase Storage (room-photos, item-photos) |
| AI Orchestrator | Claude claude-opus-4-5 (Anthropic) — vision, design, messaging, resell copy |
| AI Workers | NVIDIA Nemotron (parallel design generation via LangGraph fan-out) |
| Listings | eBay Browse API — used furniture, zip-filtered + JSON fixture fallback |
| Messaging | Twilio Programmable SMS (send + webhook receive) |
| Resell | Facebook Marketplace deep-link (no API review) |
| Location | Nominatim (free, no key) — lat/lng → zip for eBay location filter |

---

## North Star User Flow

1. 📸 **Photograph** empty room on phone
2. 🎨 **AI generates 3 designs** — each item is a real nearby listing (price, distance, photo)
3. 🛒 **Pick items** across designs, tap **"Message All Sellers"** — AI texts every seller
4. 💬 **Seller replies** surface in real-time inbox (Supabase Realtime + Twilio webhooks)
5. ✅ **Mark as Purchased** → saved to My Furniture
6. ♻️ **One-tap Resell** → AI generates listing → opens pre-filled Facebook Marketplace

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| ngrok | latest | https://ngrok.com/download |

---

## Setup (~34 minutes total)

### 1. Clone & install dependencies

```bash
# Web
cd web
npm install

# API
cd ../api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
# Copy template
cp .env.example .env              # for FastAPI
cp .env.example web/.env.local    # for Next.js (only NEXT_PUBLIC_* vars needed)
```

Fill in each service below:

#### Clerk Auth (~5 min)
1. Create app at https://dashboard.clerk.com
2. Copy **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy **Secret Key** → `CLERK_SECRET_KEY`
4. Copy **Frontend API URL** → `CLERK_JWT_ISSUER`

#### Supabase (~5 min)
```bash
# Initialize and start local Supabase
supabase init
supabase start
# Copy the output values (URL, anon key, service role key) into .env
```

Apply schema:
```bash
supabase db reset
# OR paste api/migrations/001_initial_schema.sql into Supabase Dashboard > SQL Editor
```

Enable Realtime:
```sql
alter publication supabase_realtime add table public.messages;
```

Create Storage buckets in Dashboard > Storage:
- `room-photos` (public)
- `item-photos` (public)

#### Anthropic Claude (~2 min)
1. Get API key at https://console.anthropic.com
2. Set `ANTHROPIC_API_KEY`

#### NVIDIA Nemotron (~5 min)
1. Get API key at https://build.nvidia.com
2. Set `NVIDIA_API_KEY`

#### eBay Browse API (~15 min)
1. Create developer account at https://developer.ebay.com
2. Create app → copy **App ID** → `EBAY_APP_ID` and **Client Secret** → `EBAY_CLIENT_SECRET`
3. No review required for Browse API

#### Twilio SMS (~5 min)
1. Create account at https://console.twilio.com
2. Get a phone number (free trial)
3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

#### ngrok for Twilio webhooks (~2 min)
```bash
ngrok http 8000
# Copy the https URL → PUBLIC_WEBHOOK_URL in .env
# In Twilio Console → Phone Numbers → Your number → Messaging webhook:
#   Set to: https://YOUR-NGROK-URL.ngrok-free.app/messages/webhook
```

---

## Running locally

Open **3 terminals**:

```bash
# Terminal 1 — Supabase
supabase start

# Terminal 2 — FastAPI
cd api
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Terminal 3 — Next.js
cd web
npm run dev
```

Then open: **http://localhost:3000**

> **Use fixture listings while developing** (no eBay key needed):
> Set `MOCK_LISTINGS=true` in `.env`

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/rooms/upload` | Upload room photo |
| POST | `/rooms/{id}/analyze` | Claude vision analysis |
| POST | `/rooms/{id}/designs` | Trigger LangGraph design pipeline |
| GET | `/rooms/{id}/designs` | List 3 designs for room |
| POST | `/designs/{id}/match-listings` | Match listings for all design items |
| POST | `/messages/send-batch` | AI generate + send SMS to all sellers |
| POST | `/messages/webhook` | Twilio inbound SMS webhook |
| GET | `/messages/` | List messages (with Realtime) |
| POST | `/purchases/` | Mark item as purchased |
| GET | `/purchases/` | List purchased items |
| POST | `/resell/generate` | AI generate resell listing + FB deep-link |
| GET | `/resell/` | List resell listings |

Interactive docs: **http://localhost:8000/docs**

---

## Project Structure

```
web/src/
  app/
    page.tsx              — Landing page
    layout.tsx            — Root layout (Clerk + BottomNav + SW)
    middleware.ts         — Clerk auth protection
    dashboard/            — Authenticated home
    scan/                 — Room photo upload (mobile camera + drag-drop)
    designs/              — 3 AI room designs with listings
    inbox/                — Realtime seller message threads
    my-furniture/         — Purchased items grid
    resell/               — Resell item management
    api/webhook/twilio/   — Next.js Twilio webhook proxy
  components/
    BottomNav.tsx         — Mobile bottom navigation
    PreSendModal.tsx      — AI message preview + bulk send
    ResellModal.tsx       — Condition select + AI listing + FB deep-link
    RoomSummaryCard.tsx   — Style tags, color swatches, zone map
    ServiceWorkerRegistrar.tsx
  lib/
    api.ts                — Fetch wrapper with Clerk JWT
    utils.ts              — cn(), formatCurrency(), generateFBDeepLink()
    useRealtimeMessages.ts — Supabase Realtime hook
    supabase/client.ts    — Browser Supabase client
    supabase/server.ts    — Server Supabase client

api/
  main.py                 — FastAPI app + CORS
  config.py               — Pydantic settings
  models.py               — Shared domain models
  auth.py                 — Clerk JWT verification dependency
  db.py                   — Supabase client singleton
  routers/
    health.py             — GET /health
    rooms.py              — Upload, analyze, list, design trigger
    designs.py            — Design fetch
    listings.py           — Listing match trigger + fetch
    messages.py           — SMS batch send + Twilio webhook
    purchases.py          — Mark purchased, list
    resell.py             — AI resell generation + FB deep-link
  services/
    vision.py             — Claude vision → RoomAnalysis
    listing_provider.py   — EbayListingProvider + FixtureListingProvider
    listing_matcher.py    — Score + merge listings, fan-out
    messaging.py          — Claude message gen + Twilio send
    resell_generator.py   — Claude resell copy + price calc
  agents/
    design_pipeline.py    — LangGraph: style_expander → design_generator×3 → validator
  fixtures/
    furniture_listings.json — 50 realistic fallback listings
  migrations/
    001_initial_schema.sql  — Full Postgres schema + RLS
```

---

## LangGraph Design Pipeline

```
RoomAnalysis
     │
     ▼
[style_expander]          Claude: 3 distinct aesthetic directions
     │
     ├─────────────────────────────────────┐
     ▼                                     ▼
[design_generator #1]  [design_generator #2]  [design_generator #3]
  Nemotron               Nemotron               Nemotron
  (parallel)             (parallel)             (parallel)
     │                                     │
     └─────────────────────────────────────┘
                          │
                          ▼
              [design_validator]     Claude: budget check + essentials
                          │
                          ▼
              3× RoomDesign objects → Supabase
```

---

## Listing Scoring

```
score = 0.5 × price_fit + 0.3 × distance_score + 0.2 × recency_score
```

Provider priority: **eBay** (used furniture, zip-filtered for local results) → **Fixtures** (fallback when eBay returns 0 results or `MOCK_LISTINGS=true`)

---

## Facebook Marketplace Deep-Link

No API approval. No app review. Just a URL:

```
https://www.facebook.com/marketplace/create/item?title=…&description=…&price=…&category=…
```

Opens FB Marketplace create form pre-filled. User taps Post (~3 seconds).

---

## Resell Pricing Logic

| Condition | Multiplier |
|---|---|
| Excellent | 1.3× purchase price |
| Good | 1.1× |
| Fair | 0.85× |
| Poor | 0.6× |

Claude also adjusts based on furniture category trends.

---

## Cost Estimate

| Service | Cost |
|---|---|
| Anthropic Claude | Pay per token (~$0.01–0.05 per full flow) |
| NVIDIA Nemotron | Free tier / pay per token |
| Twilio SMS | $0.0079/SMS sent |
| eBay Browse API | Free (instant key) |
| Supabase | Free tier |
| Clerk | Free tier |
| ngrok | Free tier |
| **Total per scan** | **< $0.10** |

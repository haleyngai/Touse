'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { ArrowUpRight, RefreshCcw, Plus, Tag, ScanLine } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Purchase, ResellListing } from '@/types'
import { ResellModal } from '@/components/ResellModal'
import Link from 'next/link'

// ── Dummy data ────────────────────────────────────────────────────────────────
const DUMMY_PURCHASES: Purchase[] = [
  {
    id: 'p1', user_id: 'u1', listing_id: 'l1', price_paid: 300,
    purchased_at: '2025-06-28T12:00:00Z', created_at: '2025-06-28T12:00:00Z',
    listing: {
      id: 'l1', provider: 'ebay', title: 'Mid-Century Modern Sofa — Walnut Legs, Heather Grey',
      price: 320, image_url: 'https://picsum.photos/seed/sofa1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p2', user_id: 'u1', listing_id: 'l2', price_paid: 55,
    purchased_at: '2025-07-01T09:30:00Z', created_at: '2025-07-01T09:30:00Z',
    listing: {
      id: 'l2', provider: 'ebay', title: 'Arc Floor Lamp — Brushed Gold Finish',
      price: 65, image_url: 'https://picsum.photos/seed/lamp1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p3', user_id: 'u1', listing_id: 'l3', price_paid: 105,
    purchased_at: '2025-07-03T15:00:00Z', created_at: '2025-07-03T15:00:00Z',
    listing: {
      id: 'l3', provider: 'ebay', title: 'Solid Oak Round Coffee Table — 36 inch',
      price: 120, image_url: 'https://picsum.photos/seed/coffee1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p4', user_id: 'u1', listing_id: 'l4', price_paid: 80,
    purchased_at: '2025-07-05T11:00:00Z', created_at: '2025-07-05T11:00:00Z',
    listing: {
      id: 'l4', provider: 'ebay', title: 'Rattan Accent Chair — Natural Finish with Cushion',
      price: 90, image_url: 'https://picsum.photos/seed/chair1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p5', user_id: 'u1', listing_id: 'l5', price_paid: 45,
    purchased_at: '2025-07-06T16:20:00Z', created_at: '2025-07-06T16:20:00Z',
    listing: {
      id: 'l5', provider: 'ebay', title: 'Jute Area Rug 8x10 — Natural Beige',
      price: 50, image_url: 'https://picsum.photos/seed/rug1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p6', user_id: 'u1', listing_id: 'l6', price_paid: 195,
    purchased_at: '2025-07-07T10:00:00Z', created_at: '2025-07-07T10:00:00Z',
    listing: {
      id: 'l6', provider: 'ebay', title: 'Mid-Century 6-Drawer Dresser — Walnut Veneer',
      price: 210, image_url: 'https://picsum.photos/seed/dresser1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p7', user_id: 'u1', listing_id: 'l7', price_paid: 38,
    purchased_at: '2025-07-08T13:00:00Z', created_at: '2025-07-08T13:00:00Z',
    listing: {
      id: 'l7', provider: 'ebay', title: 'Industrial Metal Bookshelf — Black Frame, 5 Tier',
      price: 45, image_url: 'https://picsum.photos/seed/shelf1/400/300', listing_url: '#',
    },
  },
  {
    id: 'p8', user_id: 'u1', listing_id: 'l8', price_paid: 220,
    purchased_at: '2025-07-09T10:00:00Z', created_at: '2025-07-09T10:00:00Z',
    listing: {
      id: 'l8', provider: 'ebay', title: 'Queen Platform Bed Frame — Dark Walnut, No Box Spring',
      price: 240, image_url: 'https://picsum.photos/seed/bed1/400/300', listing_url: '#',
    },
  },
]

const DUMMY_RESELLS: ResellListing[] = [
  {
    id: 'r1', user_id: 'u1', purchase_id: 'p2',
    title: 'Gold Arc Floor Lamp — Great Condition',
    description: 'Brushed gold arc lamp, works perfectly. Moving sale.',
    price: 60, condition: 'good', fb_category: 'HOME_GOODS',
    deep_link: '#', status: 'posted', created_at: '2025-07-06T14:00:00Z',
  },
]

export default function MyFurniturePage() {
  const [reselling, setReselling] = useState<Purchase | null>(null)
  const resellMap = new Map(DUMMY_RESELLS.map(r => [r.purchase_id, r]))
  const totalSpent = DUMMY_PURCHASES.reduce((s, p) => s + p.price_paid, 0)
  const listedCount = DUMMY_RESELLS.length

  return (
    <div className="min-h-screen bg-[#E4E2DD]">

      {/* Header */}
      <header className="px-6 md:px-10 py-8 border-b border-[#1E1E1E]/10 bg-[#E4E2DD]">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="rf-label mb-2">Collection</p>
              <h1
                className="font-display font-bold uppercase tracking-[-0.04em] leading-[0.88]"
                style={{ fontSize: 'clamp(2rem, 7vw, 5rem)' }}
              >
                MY FURNITURE
              </h1>
            </div>
            <Link href="/scan" className="rf-btn px-5 py-3 text-xs tracking-widest uppercase self-start sm:self-end">
              <ScanLine className="w-3.5 h-3.5" style={{ position: 'relative', zIndex: 1 }} />
              <span>Scan Room</span>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-6 pt-6 border-t border-[#1E1E1E]/10">
            <div>
              <p className="font-display font-bold text-2xl md:text-3xl text-[#DB4A2B]">{DUMMY_PURCHASES.length}</p>
              <p className="text-xs text-[#1E1E1E]/40 mt-0.5 uppercase tracking-wide">items owned</p>
            </div>
            <div className="w-px h-10 bg-[#1E1E1E]/10" />
            <div>
              <p className="font-display font-bold text-2xl md:text-3xl">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-[#1E1E1E]/40 mt-0.5 uppercase tracking-wide">total spent</p>
            </div>
            {listedCount > 0 && (
              <>
                <div className="w-px h-10 bg-[#1E1E1E]/10" />
                <div>
                  <p className="font-display font-bold text-2xl md:text-3xl text-[#F8A348]">{listedCount}</p>
                  <p className="text-xs text-[#1E1E1E]/40 mt-0.5 uppercase tracking-wide">listed for sale</p>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-8 pb-24 sm:pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#1E1E1E]/8">
          {DUMMY_PURCHASES.map(purchase => {
            const resell = resellMap.get(purchase.id)
            return (
              <FurnitureCard
                key={purchase.id}
                purchase={purchase}
                resell={resell}
                onResell={() => setReselling(purchase)}
              />
            )
          })}
        </div>
      </main>

      {reselling && (
        <ResellModal purchase={reselling} onClose={() => setReselling(null)} />
      )}
    </div>
  )
}

function FurnitureCard({
  purchase,
  resell,
  onResell,
}: {
  purchase: Purchase
  resell?: ResellListing
  onResell: () => void
}) {
  return (
    <div className="group relative bg-[#E4E2DD] overflow-hidden">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#D9D6D0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={purchase.listing?.image_url ?? `https://picsum.photos/seed/${purchase.id}/400/300`}
          alt={purchase.listing?.title ?? 'Furniture'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Listed badge */}
        {resell && (
          <div className="absolute top-0 left-0 right-0 px-3 py-1.5 bg-[#DB4A2B] flex items-center justify-between">
            <span className="text-white text-[10px] font-display font-bold uppercase tracking-widest">Listed</span>
            <span className="text-white text-xs font-bold">{formatCurrency(resell.price)}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-[#1E1E1E] opacity-0 group-hover:opacity-55 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {resell ? (
            <a
              href={resell.deep_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white text-xs font-medium border border-white/50 px-3 py-1.5 hover:bg-white hover:text-[#1E1E1E] transition-colors"
            >
              <Tag className="w-3 h-3" />
              View Listing
            </a>
          ) : (
            <button
              onClick={onResell}
              className="flex items-center gap-1.5 text-white text-xs font-medium border border-white/50 px-3 py-1.5 hover:bg-white hover:text-[#1E1E1E] transition-colors"
            >
              <RefreshCcw className="w-3 h-3" />
              Resell
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-white border-t border-[#1E1E1E]/8">
        <p className="text-xs text-[#1E1E1E] font-medium leading-tight line-clamp-2 mb-2">
          {purchase.listing?.title ?? 'Furniture item'}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-sm text-[#DB4A2B]">{formatCurrency(purchase.price_paid)}</p>
          <p className="text-[10px] text-[#1E1E1E]/30 uppercase tracking-wide">{formatDate(purchase.purchased_at)}</p>
        </div>
      </div>

      {/* Bottom action */}
      <div className="border-t border-[#1E1E1E]/8 px-3 py-2 bg-white">
        {resell ? (
          <a
            href={resell.deep_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs text-[#1E1E1E]/45 hover:text-[#DB4A2B] transition-colors"
          >
            <span>View on Facebook</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        ) : (
          <button
            onClick={onResell}
            className="flex items-center justify-between w-full text-xs text-[#1E1E1E]/45 hover:text-[#DB4A2B] transition-colors"
          >
            <span>Generate resell listing</span>
            <RefreshCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

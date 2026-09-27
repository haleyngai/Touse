'use client'
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, ArrowLeft, ExternalLink, RefreshCcw, Package2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Purchase, ResellListing } from '@/types'
import { ResellModal } from '@/components/ResellModal'
import { useState } from 'react'
import Link from 'next/link'

// ── Dummy data (mirrors my-furniture) ────────────────────────────────────────
const DUMMY_PURCHASES: Purchase[] = [
  {
    id: 'p1', user_id: 'u1', listing_id: 'l1', price_paid: 300,
    purchased_at: '2025-06-28T12:00:00Z', created_at: '2025-06-28T12:00:00Z',
    listing: { id: 'l1', provider: 'ebay', title: 'Mid-Century Modern Sofa — Walnut Legs, Heather Grey', price: 320, image_url: 'https://picsum.photos/seed/sofa1/80/80', listing_url: '#' },
  },
  {
    id: 'p2', user_id: 'u1', listing_id: 'l2', price_paid: 55,
    purchased_at: '2025-07-01T09:30:00Z', created_at: '2025-07-01T09:30:00Z',
    listing: { id: 'l2', provider: 'ebay', title: 'Arc Floor Lamp — Brushed Gold Finish', price: 65, image_url: 'https://picsum.photos/seed/lamp1/80/80', listing_url: '#' },
  },
  {
    id: 'p3', user_id: 'u1', listing_id: 'l3', price_paid: 105,
    purchased_at: '2025-07-03T15:00:00Z', created_at: '2025-07-03T15:00:00Z',
    listing: { id: 'l3', provider: 'ebay', title: 'Solid Oak Round Coffee Table — 36 inch', price: 120, image_url: 'https://picsum.photos/seed/coffee1/80/80', listing_url: '#' },
  },
  {
    id: 'p4', user_id: 'u1', listing_id: 'l4', price_paid: 80,
    purchased_at: '2025-07-05T11:00:00Z', created_at: '2025-07-05T11:00:00Z',
    listing: { id: 'l4', provider: 'ebay', title: 'Rattan Accent Chair — Natural Finish with Cushion', price: 90, image_url: 'https://picsum.photos/seed/chair1/80/80', listing_url: '#' },
  },
  {
    id: 'p5', user_id: 'u1', listing_id: 'l5', price_paid: 45,
    purchased_at: '2025-07-06T16:20:00Z', created_at: '2025-07-06T16:20:00Z',
    listing: { id: 'l5', provider: 'ebay', title: 'Jute Area Rug 8x10 — Natural Beige', price: 50, image_url: 'https://picsum.photos/seed/rug1/80/80', listing_url: '#' },
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

export default function ResellPage() {
  const router = useRouter()
  const [reselling, setReselling] = useState<Purchase | null>(null)

  // Try live API first, fall back to dummy
  const { data: livePurchases, isLoading } = useSWR<Purchase[]>(
    '/purchases',
    (url: string) => api.get<Purchase[]>(url).catch(() => [] as Purchase[]),
    { revalidateOnFocus: false }
  )
  const { data: liveResells } = useSWR<ResellListing[]>(
    '/resell',
    (url: string) => api.get<ResellListing[]>(url).catch(() => [] as ResellListing[]),
    { revalidateOnFocus: false }
  )

  const purchases = livePurchases?.length ? livePurchases : DUMMY_PURCHASES
  const resells = liveResells?.length ? liveResells : DUMMY_RESELLS

  const resellMap = new Map(resells.map(r => [r.purchase_id, r]))
  const unresold = purchases.filter(p => !resellMap.has(p.id))
  const listed = purchases.filter(p => resellMap.has(p.id))

  return (
    <div className="min-h-screen bg-[#E4E2DD]">

      {/* Header */}
      <header className="px-6 md:px-10 py-6 border-b border-[#1E1E1E]/10 bg-[#E4E2DD]">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center border border-[#1E1E1E]/20 hover:border-[#1E1E1E]/50 text-[#1E1E1E]/40 hover:text-[#1E1E1E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="rf-label mb-0.5">AI Listing Generator</p>
            <h1 className="font-display font-bold text-2xl md:text-3xl uppercase tracking-[-0.04em] leading-tight">
              RESELL
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-10 py-8 space-y-10 pb-24 sm:pb-10">

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-6 h-6 text-[#DB4A2B] animate-spin-slow" />
              <p className="rf-label">Loading purchases...</p>
            </div>
          </div>
        )}

        {/* Ready to resell */}
        {unresold.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight">
                Ready to Resell
              </h2>
              <span className="font-display font-bold text-2xl text-[#DB4A2B]">{unresold.length}</span>
            </div>
            <div className="border border-[#1E1E1E]/10 divide-y divide-[#1E1E1E]/8">
              {unresold.map(purchase => (
                <ResellItemRow
                  key={purchase.id}
                  purchase={purchase}
                  onResell={() => setReselling(purchase)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Already listed */}
        {listed.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl uppercase tracking-tight">
                Already Listed
              </h2>
              <span className="font-display font-bold text-2xl text-[#F8A348]">{listed.length}</span>
            </div>
            <div className="border border-[#1E1E1E]/10 divide-y divide-[#1E1E1E]/8">
              {listed.map(purchase => {
                const resell = resellMap.get(purchase.id)!
                return (
                  <div key={purchase.id} className="flex items-center gap-4 p-4 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={purchase.listing?.image_url ?? 'https://picsum.photos/80/80'}
                      alt=""
                      className="w-14 h-14 object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1E1E1E] text-sm truncate">
                        {purchase.listing?.title}
                      </p>
                      <p className="text-sm text-[#F8A348] font-display font-bold mt-0.5">
                        Listed at {formatCurrency(resell.price)}
                      </p>
                    </div>
                    <a
                      href={resell.deep_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rf-btn-ghost px-4 py-2 text-xs tracking-wide uppercase gap-1.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && unresold.length === 0 && listed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-16 h-16 border-2 border-[#1E1E1E]/10 flex items-center justify-center">
              <Package2 className="w-7 h-7 text-[#1E1E1E]/20" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl uppercase tracking-tight text-[#1E1E1E]/25">
                Nothing to resell yet
              </p>
              <p className="text-sm text-[#1E1E1E]/35 mt-1.5">Mark items as purchased from your inbox first.</p>
            </div>
            <Link href="/inbox" className="rf-btn px-6 py-3 text-xs tracking-widest uppercase">
              <span>Go to Inbox</span>
            </Link>
          </div>
        )}

      </main>

      {reselling && (
        <ResellModal purchase={reselling} onClose={() => setReselling(null)} />
      )}
    </div>
  )
}

function ResellItemRow({
  purchase,
  onResell,
}: {
  purchase: Purchase
  onResell: () => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white hover:bg-[#E4E2DD]/50 transition-colors">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={purchase.listing?.image_url ?? 'https://picsum.photos/80/80'}
        alt=""
        className="w-14 h-14 object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1E1E1E] text-sm leading-tight truncate">
          {purchase.listing?.title ?? 'Furniture item'}
        </p>
        <p className="text-xs text-[#1E1E1E]/40 mt-0.5">
          Paid {formatCurrency(purchase.price_paid)}
        </p>
      </div>
      <button
        onClick={onResell}
        className="rf-btn px-4 py-2.5 text-xs tracking-widest uppercase"
      >
        <RefreshCcw className="w-3.5 h-3.5" style={{ position: 'relative', zIndex: 1 }} />
        <span>Resell</span>
      </button>
    </div>
  )
}

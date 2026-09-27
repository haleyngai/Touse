'use client'
export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, ShoppingBag, MessageSquare, ChevronDown, ChevronUp, MapPin, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDistance, truncate } from '@/lib/utils'
import type { RoomDesign, Listing } from '@/types'
import { PreSendModal } from '@/components/PreSendModal'
import { RoomSummaryCard } from '@/components/RoomSummaryCard'
import { cn } from '@/lib/utils'

const ACCENT_SCHEMES = [
  { border: 'border-[#DB4A2B]/30', bg: 'bg-[#DB4A2B]/5', badge: 'bg-[#DB4A2B] text-white', number: 'text-[#DB4A2B]' },
  { border: 'border-[#F8A348]/40', bg: 'bg-[#F8A348]/8',  badge: 'bg-[#F8A348] text-[#1E1E1E]', number: 'text-[#F8A348]' },
  { border: 'border-[#FF89A9]/40', bg: 'bg-[#FF89A9]/8',  badge: 'bg-[#FF89A9] text-[#1E1E1E]', number: 'text-[#FF89A9]' },
]

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    sofa: 'S', couch: 'S', chair: 'C', 'dining table': 'D', desk: 'D',
    lamp: 'L', 'floor lamp': 'L', bookshelf: 'B', dresser: 'R', bed: 'B',
    nightstand: 'N', rug: 'R', mirror: 'M', 'coffee table': 'T', 'side table': 'T',
    storage: 'S', wardrobe: 'W', artwork: 'A', plant: 'P',
  }
  return map[category.toLowerCase()] ?? category.charAt(0).toUpperCase()
}

function DesignsContent() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get('room')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showPreSend, setShowPreSend] = useState(false)

  const { data: designs, error, isLoading } = useSWR<RoomDesign[]>(
    roomId ? `/rooms/${roomId}/designs` : null,
    (url: string) => api.get<RoomDesign[]>(url),
    {
      revalidateOnFocus: false,
      refreshInterval: (data) => (!data || data.length < 3 ? 3000 : 0),
    }
  )

  const { data: room } = useSWR(
    roomId ? `/rooms/${roomId}` : null,
    (url: string) => api.get(url),
    { revalidateOnFocus: false }
  )

  const toggleItem = (listingId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.has(listingId) ? next.delete(listingId) : next.add(listingId)
      return next
    })
  }

  const allListings = designs?.flatMap(d =>
    d.items.flatMap(item => item.matched_listings ?? [])
  ) ?? []
  const selectedListings = allListings.filter(l => selectedItems.has(l.id))

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[#E4E2DD] flex items-center justify-center">
        <p className="font-display font-bold text-2xl uppercase text-[#1E1E1E]/30">No room selected.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E4E2DD]">

      {/* Header */}
      <header className="sticky top-0 z-10 px-6 md:px-10 py-5 border-b border-[#1E1E1E]/10 bg-[#E4E2DD]/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="rf-label mb-1">AI Designs</p>
            <h1 className="font-display font-bold text-2xl md:text-3xl uppercase tracking-[-0.04em] leading-tight">
              YOUR ROOM
            </h1>
          </div>
          {selectedItems.size > 0 && (
            <button
              onClick={() => setShowPreSend(true)}
              className="rf-btn px-5 py-3 text-xs tracking-widest uppercase"
            >
              <MessageSquare className="w-4 h-4" style={{ position: 'relative', zIndex: 1 }} />
              <span>Message All ({selectedItems.size})</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-10 py-8 space-y-10 pb-24 sm:pb-10">

        {/* Room summary */}
        {room && <RoomSummaryCard room={room as never} />}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-6 py-24">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-[#DB4A2B]/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#DB4A2B] animate-spin-slow" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl uppercase tracking-tight text-[#1E1E1E]">
                Generating 3 Designs
              </p>
              <p className="text-sm text-[#1E1E1E]/45 mt-1.5">Matching real nearby listings...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border-l-4 border-[#DB4A2B] bg-[#DB4A2B]/8 px-5 py-4">
            <p className="text-sm text-[#1E1E1E]/70">Failed to load designs. Try refreshing the page.</p>
          </div>
        )}

        {/* Design cards */}
        {designs?.map((design, idx) => (
          <DesignCard
            key={design.id}
            design={design}
            index={idx}
            selectedItems={selectedItems}
            onToggleItem={toggleItem}
          />
        ))}

      </main>

      {showPreSend && (
        <PreSendModal listings={selectedListings} onClose={() => setShowPreSend(false)} />
      )}
    </div>
  )
}

function DesignCard({
  design,
  index,
  selectedItems,
  onToggleItem,
}: {
  design: RoomDesign
  index: number
  selectedItems: Set<string>
  onToggleItem: (id: string) => void
}) {
  const scheme = ACCENT_SCHEMES[index % 3]

  return (
    <section className={cn('border-2 animate-slide-up', scheme.border, scheme.bg)} style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Card header */}
      <div className="flex items-start justify-between p-6 border-b border-[#1E1E1E]/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={cn('rf-pill text-[10px]', scheme.badge)}>Design {index + 1}</span>
          </div>
          <h2 className="font-display font-bold text-2xl uppercase tracking-tight">{design.aesthetic_name}</h2>
          <p className="text-sm text-[#1E1E1E]/55 mt-1 max-w-md">{design.aesthetic_description}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="rf-label mb-1">Est. Total</p>
          <p className={cn('font-display font-bold text-2xl', scheme.number)}>
            {formatCurrency(design.total_estimated_cost)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#1E1E1E]/8">
        {design.items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            selectedItems={selectedItems}
            onToggle={onToggleItem}
          />
        ))}
      </div>
    </section>
  )
}

function ItemRow({
  item,
  selectedItems,
  onToggle,
}: {
  item: RoomDesign['items'][0]
  selectedItems: Set<string>
  onToggle: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const listings = item.matched_listings ?? []
  const topListing = listings[0]

  return (
    <div className="p-5">
      {/* Item meta */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-[#1E1E1E] flex items-center justify-center flex-shrink-0">
          <span className="text-[#E4E2DD] text-xs font-display font-bold">
            {getCategoryIcon(item.category)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1E1E1E] capitalize text-sm">{item.category}</p>
          <p className="text-xs text-[#1E1E1E]/40 truncate">{item.placement_note}</p>
        </div>
        <span className="rf-pill bg-[#1E1E1E]/8 text-[#1E1E1E]/60 text-[10px]">{item.color}</span>
      </div>

      {/* Top listing */}
      {topListing && (
        <ListingThumbnail
          listing={topListing}
          selected={selectedItems.has(topListing.id)}
          onToggle={() => onToggle(topListing.id)}
        />
      )}

      {/* Expand alternatives */}
      {listings.length > 1 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1.5 text-xs text-[#1E1E1E]/45 hover:text-[#DB4A2B] transition-colors tracking-wide"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded
            ? 'Hide alternatives'
            : `Show ${listings.length - 1} more option${listings.length > 2 ? 's' : ''}`
          }
        </button>
      )}

      {expanded && listings.slice(1).map(l => (
        <div key={l.id} className="mt-2">
          <ListingThumbnail
            listing={l}
            selected={selectedItems.has(l.id)}
            onToggle={() => onToggle(l.id)}
          />
        </div>
      ))}

      {listings.length === 0 && (
        <p className="text-xs text-[#1E1E1E]/35 italic">No listings matched yet.</p>
      )}
    </div>
  )
}

function ListingThumbnail({
  listing,
  selected,
  onToggle,
}: {
  listing: Listing
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer border-2 transition-all duration-200',
        selected
          ? 'border-[#DB4A2B] bg-[#DB4A2B]/5'
          : 'border-[#1E1E1E]/10 hover:border-[#1E1E1E]/25 bg-white'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={listing.image_url}
        alt={listing.title}
        className="w-14 h-14 object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1E1E1E] leading-tight">
          {truncate(listing.title, 60)}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="font-display font-bold text-sm text-[#DB4A2B]">
            {formatCurrency(listing.price)}
          </span>
          {listing.distance_miles != null && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#1E1E1E]/45 uppercase tracking-wide">
              <MapPin className="w-3 h-3" />
              {formatDistance(listing.distance_miles)} away
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-[#1E1E1E]/35 uppercase tracking-wide">
            <Tag className="w-3 h-3" />
            {listing.provider}
          </span>
        </div>
      </div>
      <ShoppingBag
        className={cn(
          'w-5 h-5 shrink-0 transition-colors',
          selected ? 'text-[#DB4A2B]' : 'text-[#1E1E1E]/20'
        )}
      />
    </div>
  )
}

export default function DesignsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#E4E2DD]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#DB4A2B] animate-spin-slow" />
            <p className="rf-label">Loading designs...</p>
          </div>
        </div>
      }
    >
      <DesignsContent />
    </Suspense>
  )
}

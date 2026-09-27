'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import {
  MessageSquare, CheckCircle2, Clock, CornerUpLeft, Send, X, Minus, DollarSign
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

// ── Dummy data ────────────────────────────────────────────────────────────────
const DUMMY_THREADS = [
  {
    phone: '+15551112222',
    sellerName: 'Marcus T.',
    listingId: 'l1',
    latestStatus: 'replied' as const,
    listing: {
      id: 'l1', provider: 'ebay' as const,
      title: 'Mid-Century Modern Sofa — Walnut Legs, Heather Grey',
      image_url: 'https://picsum.photos/seed/sofa1/120/90',
      price: 320, listing_url: '#',
    },
    messages: [
      {
        id: 'm1', user_id: 'u1', listing_id: 'l1',
        content: "Hi! Saw your walnut sofa — I'm furnishing a Scandinavian-style living room and it's perfect. Still available? Would you take $290?",
        direction: 'outbound' as const, status: 'delivered' as const,
        seller_phone: '+15551112222', created_at: '2025-07-05T10:22:00Z', updated_at: '2025-07-05T10:22:00Z',
      },
      {
        id: 'm2', user_id: 'u1', listing_id: 'l1',
        content: "Hey! Yes still available. I could do $300 — can you pick up this Saturday?",
        direction: 'inbound' as const, status: 'replied' as const,
        seller_phone: '+15551112222', created_at: '2025-07-05T11:45:00Z', updated_at: '2025-07-05T11:45:00Z',
      },
    ],
  },
  {
    phone: '+15553334444',
    sellerName: 'Sandra L.',
    listingId: 'l2',
    latestStatus: 'sent' as const,
    listing: {
      id: 'l2', provider: 'ebay' as const,
      title: 'Arc Floor Lamp — Brushed Gold, Like New',
      image_url: 'https://picsum.photos/seed/lamp1/120/90',
      price: 65, listing_url: '#',
    },
    messages: [
      {
        id: 'm3', user_id: 'u1', listing_id: 'l2',
        content: "Hi Sandra! Saw your gold arc lamp — I'm going for a warm Bohemian look and this would be perfect. Still available? Open to $55?",
        direction: 'outbound' as const, status: 'sent' as const,
        seller_phone: '+15553334444', created_at: '2025-07-06T09:10:00Z', updated_at: '2025-07-06T09:10:00Z',
      },
    ],
  },
  {
    phone: '+15555556666',
    sellerName: 'David W.',
    listingId: 'l3',
    latestStatus: 'delivered' as const,
    listing: {
      id: 'l3', provider: 'ebay' as const,
      title: 'Solid Oak Round Coffee Table — 36 inch diameter',
      image_url: 'https://picsum.photos/seed/coffee1/120/90',
      price: 120, listing_url: '#',
    },
    messages: [
      {
        id: 'm4', user_id: 'u1', listing_id: 'l3',
        content: "Hey! Your oak coffee table looks great for the industrial loft vibe I'm going for. Is $105 workable?",
        direction: 'outbound' as const, status: 'delivered' as const,
        seller_phone: '+15555556666', created_at: '2025-07-06T14:30:00Z', updated_at: '2025-07-06T14:30:00Z',
      },
    ],
  },
  {
    phone: '+15557778888',
    sellerName: 'Priya N.',
    listingId: 'l4',
    latestStatus: 'replied' as const,
    listing: {
      id: 'l4', provider: 'ebay' as const,
      title: 'Rattan Accent Chair — Natural Finish with Cushion',
      image_url: 'https://picsum.photos/seed/chair1/120/90',
      price: 90, listing_url: '#',
    },
    messages: [
      {
        id: 'm5', user_id: 'u1', listing_id: 'l4',
        content: "Hi Priya! The rattan chair would be perfect for my boho corner. Is $75 okay?",
        direction: 'outbound' as const, status: 'delivered' as const,
        seller_phone: '+15557778888', created_at: '2025-07-07T08:00:00Z', updated_at: '2025-07-07T08:00:00Z',
      },
      {
        id: 'm6', user_id: 'u1', listing_id: 'l4',
        content: "Hi! Sure, $75 works. It's in great shape. Can you do Sunday pickup?",
        direction: 'inbound' as const, status: 'replied' as const,
        seller_phone: '+15557778888', created_at: '2025-07-07T09:15:00Z', updated_at: '2025-07-07T09:15:00Z',
      },
      {
        id: 'm7', user_id: 'u1', listing_id: 'l4',
        content: "Sunday works perfectly. I'll be there around 11am!",
        direction: 'outbound' as const, status: 'delivered' as const,
        seller_phone: '+15557778888', created_at: '2025-07-07T09:30:00Z', updated_at: '2025-07-07T09:30:00Z',
      },
    ],
  },
]

type DummyThread = typeof DUMMY_THREADS[number]

export default function InboxPage() {
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [pricePaid, setPricePaid] = useState('')
  const [activeThread, setActiveThread] = useState<DummyThread | null>(null)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())

  const markPurchased = async (listingId: string) => {
    if (!pricePaid) return
    try {
      await api.post('/purchases', { listing_id: listingId, price_paid: parseFloat(pricePaid) })
    } catch {
      // graceful — works in dev without DB
    }
    setPurchased(prev => new Set(prev).add(listingId))
    setPurchasing(null)
    setPricePaid('')
  }

  const repliedCount = DUMMY_THREADS.filter(t => t.latestStatus === 'replied').length

  return (
    <div className="min-h-screen bg-[#E4E2DD] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[#1E1E1E]/10 bg-[#E4E2DD] shrink-0">
        <div>
          <p className="rf-label mb-1">Messages</p>
          <h1 className="font-display font-bold text-3xl md:text-4xl uppercase tracking-[-0.04em] leading-tight">INBOX</h1>
        </div>
        <div className="flex items-center gap-4">
          {repliedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#DB4A2B] rounded-full" />
              <span className="text-xs text-[#1E1E1E]/55 tracking-wide">{repliedCount} replied</span>
            </div>
          )}
          <span className="font-display font-bold text-3xl text-[#DB4A2B]">{DUMMY_THREADS.length}</span>
        </div>
      </header>

      {/* Body — thread list + conversation pane */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 81px)' }}>

        {/* Thread list */}
        <aside className={cn(
          'w-full md:w-80 lg:w-96 border-r border-[#1E1E1E]/10 overflow-y-auto flex-shrink-0 bg-[#E4E2DD]',
          activeThread && 'hidden md:block'
        )}>
          {DUMMY_THREADS.map(thread => {
            const isActive = activeThread?.phone === thread.phone
            const isPurchased = purchased.has(thread.listingId)
            return (
              <button
                key={thread.phone}
                onClick={() => setActiveThread(thread)}
                className={cn(
                  'w-full text-left px-5 py-4 border-b border-[#1E1E1E]/8 hover:bg-[#1E1E1E]/[0.04] transition-colors',
                  isActive && 'bg-[#1E1E1E]/[0.07]'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    'w-10 h-10 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm',
                    thread.latestStatus === 'replied' ? 'bg-[#DB4A2B] text-white' : 'bg-[#1E1E1E] text-[#E4E2DD]'
                  )}>
                    {thread.sellerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-display font-bold text-sm uppercase tracking-tight text-[#1E1E1E] truncate">
                        {thread.sellerName}
                      </p>
                      <StatusDot status={thread.latestStatus} />
                    </div>
                    <p className="text-xs text-[#1E1E1E]/45 truncate leading-snug">{thread.listing.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-[#1E1E1E]/28">
                        {formatDate(thread.messages[thread.messages.length - 1]?.created_at ?? '')}
                      </p>
                      {isPurchased && (
                        <span className="text-[10px] text-[#DB4A2B] font-medium uppercase tracking-widest">Purchased</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {/* Conversation pane */}
        {activeThread ? (
          <section className="flex-1 flex flex-col overflow-hidden bg-[#E4E2DD]">

            {/* Thread header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E1E1E]/10 bg-[#E4E2DD] shrink-0">
              <button
                onClick={() => setActiveThread(null)}
                className="md:hidden w-8 h-8 flex items-center justify-center border border-[#1E1E1E]/20 hover:border-[#1E1E1E]/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className={cn(
                'w-9 h-9 flex items-center justify-center font-display font-bold text-xs shrink-0',
                activeThread.latestStatus === 'replied' ? 'bg-[#DB4A2B] text-white' : 'bg-[#1E1E1E] text-[#E4E2DD]'
              )}>
                {activeThread.sellerName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-base uppercase tracking-tight leading-tight">
                  {activeThread.sellerName}
                </p>
                <p className="text-xs text-[#1E1E1E]/40 truncate">{activeThread.listing.title}</p>
              </div>
              <StatusPill status={activeThread.latestStatus} />
            </div>

            {/* Listing reference card */}
            <div className="mx-5 mt-4 flex items-center gap-3 border border-[#1E1E1E]/10 p-3 bg-white shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeThread.listing.image_url}
                alt=""
                className="w-12 h-10 object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1E1E1E] leading-tight truncate">
                  {activeThread.listing.title}
                </p>
                <p className="text-xs text-[#DB4A2B] font-display font-bold mt-0.5">
                  ${activeThread.listing.price}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {activeThread.messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[85%] md:max-w-sm px-4 py-3 text-sm leading-relaxed',
                    msg.direction === 'outbound'
                      ? 'ml-auto bg-[#1E1E1E] text-[#E4E2DD]'
                      : 'bg-white border border-[#1E1E1E]/10 text-[#1E1E1E]'
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn(
                    'text-[10px] mt-2 uppercase tracking-wide',
                    msg.direction === 'outbound' ? 'text-white/30' : 'text-[#1E1E1E]/30'
                  )}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              ))}
            </div>

            {/* Mark purchased footer */}
            <div className="px-5 pb-5 pt-3 border-t border-[#1E1E1E]/10 bg-[#E4E2DD] shrink-0">
              {purchased.has(activeThread.listingId) ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-[#1E1E1E]/5 border border-[#1E1E1E]/10">
                  <CheckCircle2 className="w-4 h-4 text-[#DB4A2B]" />
                  <span className="text-xs font-medium text-[#1E1E1E]/60 tracking-wide">Marked as Purchased</span>
                </div>
              ) : purchasing === activeThread.listingId ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E1E1E]/35 pointer-events-none" />
                    <input
                      type="number"
                      placeholder="Price paid"
                      value={pricePaid}
                      onChange={e => setPricePaid(e.target.value)}
                      className="rf-input pl-8 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => markPurchased(activeThread.listingId)}
                    className="rf-btn px-5 py-2.5 text-xs tracking-widest"
                  >
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => setPurchasing(null)}
                    className="rf-btn-ghost px-3 py-2.5"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPurchasing(activeThread.listingId)}
                  className="w-full rf-btn-ghost py-3 text-xs tracking-widest uppercase"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Purchased
                </button>
              )}
            </div>
          </section>
        ) : (
          /* Empty state — desktop only */
          <div className="flex-1 hidden md:flex flex-col items-center justify-center gap-5 text-[#1E1E1E]/15">
            <div className="w-16 h-16 border-2 border-[#1E1E1E]/10 flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl uppercase tracking-tight text-[#1E1E1E]/20">
                Select a conversation
              </p>
              <p className="text-sm text-[#1E1E1E]/20 mt-1">Choose a thread on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Status helpers ─────────────────────────────────────────────── */

function StatusDot({ status }: { status: Message['status'] }) {
  const colorMap: Record<Message['status'], string> = {
    pending_manual: 'bg-[#F8A348]',
    sent:           'bg-blue-400',
    delivered:      'bg-blue-500',
    replied:        'bg-[#DB4A2B]',
    failed:         'bg-red-400',
  }
  return <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1', colorMap[status])} />
}

function StatusPill({ status }: { status: Message['status'] }) {
  const map: Record<Message['status'], { label: string; classes: string; icon: React.ReactNode }> = {
    pending_manual: { label: 'Pending',   classes: 'bg-[#F8A348]/15 text-[#1E1E1E]',  icon: <Clock className="w-3 h-3" /> },
    sent:           { label: 'Sent',      classes: 'bg-blue-50 text-blue-700',         icon: <Send className="w-3 h-3" /> },
    delivered:      { label: 'Delivered', classes: 'bg-blue-50 text-blue-700',         icon: <Send className="w-3 h-3" /> },
    replied:        { label: 'Replied',   classes: 'bg-[#DB4A2B]/10 text-[#DB4A2B]',  icon: <CornerUpLeft className="w-3 h-3" /> },
    failed:         { label: 'Failed',    classes: 'bg-red-50 text-red-600',           icon: null },
  }
  const s = map[status]
  return (
    <span className={cn('rf-pill', s.classes)}>
      {s.icon}
      {s.label}
    </span>
  )
}

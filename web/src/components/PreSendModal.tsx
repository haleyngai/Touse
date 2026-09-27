'use client'

import { useState } from 'react'
import { X, MessageCircle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { truncate, formatCurrency } from '@/lib/utils'
import type { Listing, MessageBatchResponse } from '@/types'

interface Props {
  listings: Listing[]
  onClose: () => void
}

export function PreSendModal({ listings, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(listings.map(l => l.id)))
  const [state, setState] = useState<'preview' | 'sending' | 'done'>('preview')
  const [result, setResult] = useState<MessageBatchResponse | null>(null)

  const toggleListing = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const sendAll = async () => {
    setState('sending')
    try {
      const res = await api.post<MessageBatchResponse>('/messages/send-batch', {
        listing_ids: [...selected],
      })
      setResult(res)
      setState('done')
    } catch {
      setState('preview')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900 text-lg">
            {state === 'done' ? 'Messages sent!' : `Message ${selected.size} seller${selected.size !== 1 ? 's' : ''}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {state === 'sending' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-neutral-600">Generating AI messages & sending…</p>
            </div>
          )}

          {state === 'done' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">{result.sent} auto-sent via SMS</p>
                  {result.pending_manual > 0 && (
                    <p className="text-sm text-green-700">{result.pending_manual} manual SMS deep-links below</p>
                  )}
                </div>
              </div>
              {result.messages.filter(m => m.status === 'pending_manual').map(msg => (
                <ManualSMSRow key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {state === 'preview' && listings.map(listing => (
            <div
              key={listing.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                selected.has(listing.id) ? 'border-brand-300 bg-brand-50' : 'border-neutral-100'
              }`}
              onClick={() => toggleListing(listing.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 leading-tight">{truncate(listing.title, 50)}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {formatCurrency(listing.price)} · {listing.seller_phone ? '📱 Auto-SMS' : '✉️ Manual link'}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                selected.has(listing.id) ? 'bg-brand-500 border-brand-500' : 'border-neutral-300'
              }`} />
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        {state === 'preview' && (
          <div className="px-6 py-4 border-t border-neutral-100">
            <button
              onClick={sendAll}
              disabled={selected.size === 0}
              className="btn-primary w-full gap-2 py-4"
            >
              <MessageCircle className="w-5 h-5" />
              Message {selected.size} Seller{selected.size !== 1 ? 's' : ''}
            </button>
            <p className="text-center text-xs text-neutral-400 mt-2">
              AI will craft a personalized opening message for each seller
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className="px-6 py-4 border-t border-neutral-100">
            <button onClick={onClose} className="btn-secondary w-full">Done — check Inbox for replies</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ManualSMSRow({ message }: { message: import('@/types').Message }) {
  const smsLink = `sms:${message.seller_phone ?? ''}?body=${encodeURIComponent(message.content)}`
  return (
    <a
      href={smsLink}
      className="flex items-center gap-3 p-3 bg-yellow-50 rounded-2xl border border-yellow-200 hover:bg-yellow-100 transition-colors"
    >
      <div className="flex-1">
        <p className="text-sm text-yellow-800 font-medium">Tap to send via your SMS app</p>
        <p className="text-xs text-yellow-600 mt-0.5 line-clamp-2">{message.content}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-yellow-600 shrink-0" />
    </a>
  )
}

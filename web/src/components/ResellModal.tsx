'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, generateFBDeepLink } from '@/lib/utils'
import type { Purchase, ResellListing } from '@/types'

interface Props {
  purchase: Purchase
  onClose: () => void
}

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', emoji: '✨', desc: 'Like new' },
  { value: 'good', label: 'Good', emoji: '👍', desc: 'Minor wear' },
  { value: 'fair', label: 'Fair', emoji: '🔧', desc: 'Visible wear' },
  { value: 'poor', label: 'Poor', emoji: '📦', desc: 'Heavy wear' },
] as const

type Condition = (typeof CONDITIONS)[number]['value']

export function ResellModal({ purchase, onClose }: Props) {
  const router = useRouter()
  const [condition, setCondition] = useState<Condition>('good')
  const [state, setState] = useState<'form' | 'generating' | 'done'>('form')
  const [resell, setResell] = useState<ResellListing | null>(null)

  const generate = async () => {
    setState('generating')
    try {
      const res = await api.post<ResellListing>('/resell/generate', {
        purchase_id: purchase.id,
        condition,
      })
      // Attach deep link on client side too (also generated server-side)
      const deepLink = generateFBDeepLink({
        title: res.title,
        description: res.description,
        price: res.price,
        category: res.fb_category,
      })
      setResell({ ...res, deep_link: res.deep_link ?? deepLink })
      setState('done')
    } catch {
      setState('form')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900 text-lg">Resell Item</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Item preview */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={purchase.listing?.image_url ?? 'https://picsum.photos/80/80'}
              alt=""
              className="w-14 h-14 rounded-xl object-cover"
            />
            <div>
              <p className="font-medium text-neutral-900 text-sm leading-tight line-clamp-2">
                {purchase.listing?.title ?? 'Furniture item'}
              </p>
              <p className="text-neutral-400 text-xs mt-1">Paid {formatCurrency(purchase.price_paid)}</p>
            </div>
          </div>

          {state === 'form' && (
            <>
              {/* Condition selector */}
              <div>
                <p className="text-sm font-semibold text-neutral-700 mb-3">Current condition</p>
                <div className="grid grid-cols-4 gap-2">
                  {CONDITIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCondition(c.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                        condition === c.value
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      <span className="text-xs font-medium text-neutral-700">{c.label}</span>
                      <span className="text-xs text-neutral-400">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={generate} className="btn-primary w-full gap-2 py-4">
                ✨ Generate AI Listing
              </button>
            </>
          )}

          {state === 'generating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-neutral-600">Claude is writing your listing…</p>
            </div>
          )}

          {state === 'done' && resell && (
            <div className="space-y-4">
              {/* Generated listing preview */}
              <div className="p-4 bg-neutral-50 rounded-2xl space-y-2">
                <p className="font-semibold text-neutral-900">{resell.title}</p>
                <p className="text-sm text-neutral-600">{resell.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-600 text-lg">{formatCurrency(resell.price)}</span>
                  <span className="badge bg-neutral-200 text-neutral-600 capitalize">{resell.condition}</span>
                </div>
              </div>

              {/* Post to FB button */}
              <a
                href={resell.deep_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full gap-2 py-4 justify-center"
                onClick={() => router.refresh()}
              >
                <ExternalLink className="w-4 h-4" />
                Post to Facebook Marketplace
              </a>
              <p className="text-center text-xs text-neutral-400">
                Opens pre-filled — just tap Post in Facebook
              </p>

              <button onClick={onClose} className="btn-secondary w-full">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

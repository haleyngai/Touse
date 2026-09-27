'use client'

import type { Room } from '@/types'
import { cn } from '@/lib/utils'

export function RoomSummaryCard({ room }: { room: Room }) {
  const analysis = room.analysis
  if (!analysis) return null

  const sizeLabel = { small: '< 200 sq ft', medium: '200–400 sq ft', large: '> 400 sq ft' }[analysis.dimensions_estimate]

  return (
    <div className="card p-5 bg-white">
      <div className="flex items-start gap-4">
        {room.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.photo_url}
            alt="Room"
            className="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Room Analysis</p>
          <h2 className="font-semibold text-neutral-900 capitalize mb-2">{analysis.room_type}</h2>

          {/* Style tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {analysis.style_keywords.map(kw => (
              <span key={kw} className="badge bg-brand-50 text-brand-700 capitalize">{kw}</span>
            ))}
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-neutral-400">Colors:</span>
            <div className="flex gap-1">
              {analysis.dominant_colors.map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-neutral-200 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span>{sizeLabel}</span>
            <span>·</span>
            <span>{analysis.empty_zones.length} zone{analysis.empty_zones.length !== 1 ? 's' : ''} detected</span>
          </div>
        </div>
      </div>

      {/* Empty zones */}
      {analysis.empty_zones.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <p className="text-xs text-neutral-400 mb-2">Open zones for furniture</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.empty_zones.map((zone, i) => (
              <span key={i} className={cn('badge bg-neutral-100 text-neutral-600')}>{zone}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

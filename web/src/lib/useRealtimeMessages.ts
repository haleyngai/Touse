'use client'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const hasRealSupabase = SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('placeholder') && SUPABASE_URL !== 'http://localhost:54321'

/**
 * Subscribe to Supabase Realtime on the messages table.
 * Safe-guards against placeholder/missing credentials — returns empty array
 * in dev mode without a real Supabase project.
 */
export function useRealtimeMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId || !hasRealSupabase) return

    let cancelled = false

    async function init() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        if (cancelled) return

        const { data } = await supabase
          .from('messages')
          .select('*, listing:listings(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!cancelled && data) setMessages(data as Message[])

        channelRef.current = supabase
          .channel(`messages:${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: `user_id=eq.${userId}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setMessages(prev => [payload.new as Message, ...prev])
              } else if (payload.eventType === 'UPDATE') {
                setMessages(prev =>
                  prev.map(m => m.id === payload.new.id ? { ...m, ...(payload.new as Message) } : m)
                )
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.warn('[useRealtimeMessages] Supabase unavailable:', err)
      }
    }

    init()

    return () => {
      cancelled = true
      channelRef.current?.unsubscribe()
    }
  }, [userId])

  return messages
}

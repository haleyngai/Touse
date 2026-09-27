/**
 * API client — thin wrapper around fetch for the FastAPI backend.
 * All requests include the Clerk JWT in the Authorization header.
 *
 * Usage in components: import { useApiClient } from '@/lib/api'
 * Usage in SWR fetchers: import { api } from '@/lib/api'  (token injected via cookie-based flow)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/**
 * Retrieve the Clerk session token from the Clerk JS global.
 * Clerk sets window.Clerk after hydration; this is safe in browser contexts.
 */
async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    // Clerk v5+ exposes Clerk.session on the window object after initialization
    const w = window as unknown as Record<string, unknown>
    const clerkInstance = w.Clerk as {
      session?: { getToken: () => Promise<string | null> }
    } | undefined
    return (await clerkInstance?.session?.getToken()) ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getClerkToken()
  const headers: Record<string, string> = {
    ...(!init.body || typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Stateless API client — works in SWR fetchers, event handlers, useEffect */
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /** Multipart form upload — does NOT set Content-Type (browser sets boundary) */
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', body: formData, headers: {} }),
}

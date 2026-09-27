import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function formatDistance(miles: number): string {
  if (miles < 1) return `${Math.round(miles * 5280)} ft`
  return `${miles.toFixed(1)} mi`
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

export function generateFBDeepLink(params: {
  title: string
  description: string
  price: number
  category: string
}): string {
  const base = 'https://www.facebook.com/marketplace/create/item'
  const query = new URLSearchParams({
    title: params.title,
    description: params.description,
    price: String(params.price),
    category: params.category,
  })
  return `${base}?${query.toString()}`
}

export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str
}

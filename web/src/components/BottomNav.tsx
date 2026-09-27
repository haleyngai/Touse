'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScanLine, MessageSquare, Armchair } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { href: '/scan',         icon: ScanLine,        label: 'Scan' },
  { href: '/inbox',        icon: MessageSquare,   label: 'Inbox' },
  { href: '/my-furniture', icon: Armchair,        label: 'Furniture' },
]

export function BottomNav() {
  const pathname = usePathname()

  // Hide on landing page
  if (pathname === '/') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom bg-[#1E1E1E] border-t border-white/10 flex sm:hidden">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 transition-colors duration-200',
              active
                ? 'text-[#DB4A2B]'
                : 'text-white/35 hover:text-white/70'
            )}
          >
            <item.icon
              className={cn('w-5 h-5', active && 'stroke-[2.5]')}
            />
            <span className={cn(
              'text-[10px] font-medium tracking-widest uppercase',
              active ? 'text-[#DB4A2B]' : 'text-white/30'
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

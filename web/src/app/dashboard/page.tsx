export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowUpRight, ScanLine, Package2, MessageSquare, RefreshCcw, ArrowRight } from 'lucide-react'

const STATS = [
  { value: '3',      label: 'AI room designs per scan' },
  { value: '50+',    label: 'Live eBay listings matched' },
  { value: '1-tap',  label: 'Message all sellers' },
  { value: '~$0.10', label: 'Cost per full scan' },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#E4E2DD]">

      {/* ── Top nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-[#1E1E1E]/10 bg-[#E4E2DD]">
        <Link href="/" className="font-display font-bold text-xl uppercase tracking-tight text-[#1E1E1E]">
          TOUSE
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {([
            ['/scan',         'Scan'],
            ['/designs',      'Designs'],
            ['/inbox',        'Inbox'],
            ['/my-furniture', 'Furniture'],
          ] as [string, string][]).map(([href, label]) => (
            <Link key={href} href={href} className="text-[#1E1E1E]/50 hover:text-[#1E1E1E] tracking-[0.06em] transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden md:block w-24" />
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">

        {/* Dev notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-10 px-5 py-4 border-l-4 border-[#F8A348] bg-[#F8A348]/10 animate-slide-up">
            <p className="text-sm text-[#1E1E1E]/70">
              <strong className="text-[#1E1E1E]">Dev mode</strong> — running with placeholder credentials.
              Set real keys in{' '}
              <code className="font-mono bg-[#1E1E1E]/8 px-1 text-xs">web/.env.local</code>
              {' '}and{' '}
              <code className="font-mono bg-[#1E1E1E]/8 px-1 text-xs">api/.env</code>
              {' '}to enable auth and database.
            </p>
          </div>
        )}

        {/* Headline */}
        <div className="mb-14 animate-slide-up">
          <p className="rf-label mb-3">Dashboard</p>
          <h1
            className="font-display font-bold uppercase tracking-[-0.04em] leading-[0.88]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
          >
            READY TO<br />
            <span className="text-[#DB4A2B]">FURNISH?</span>
          </h1>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-[#1E1E1E]/12 mb-12 animate-slide-up delay-100">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="p-5 md:p-7 border-r border-[#1E1E1E]/12 last:border-r-0 border-b md:border-b-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r"
            >
              <p className="font-display font-bold text-3xl md:text-4xl text-[#DB4A2B]">{s.value}</p>
              <p className="text-xs text-[#1E1E1E]/45 mt-1.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-[#1E1E1E]/12 animate-slide-up delay-200">
          {[
            { href: '/scan',         Icon: ScanLine,       title: 'Scan a Room',   desc: 'Upload or photograph your empty room to start.' },
            { href: '/my-furniture', Icon: Package2,        title: 'My Furniture',  desc: 'View purchased items and resell with one tap.' },
            { href: '/inbox',        Icon: MessageSquare,   title: 'Inbox',         desc: 'Seller replies surface here in real time.' },
            { href: '/resell',       Icon: RefreshCcw,      title: 'Resell',        desc: 'Turn old pieces into cash. AI writes the listing.' },
          ].map(({ href, Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col justify-between p-7 md:p-8 border-r border-[#1E1E1E]/12 last:border-r-0 bg-[#E4E2DD] hover:bg-[#1E1E1E] transition-colors duration-300 min-h-[200px] border-b sm:border-b-0"
            >
              <div className="flex items-start justify-between">
                <Icon className="w-5 h-5 text-[#DB4A2B] group-hover:text-[#F8A348] transition-colors" />
                <ArrowRight className="w-4 h-4 text-[#1E1E1E]/20 group-hover:text-[#E4E2DD]/35 translate-x-0 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl uppercase tracking-tight mb-2 text-[#1E1E1E] group-hover:text-[#E4E2DD] transition-colors">
                  {title}
                </h2>
                <p className="text-sm text-[#1E1E1E]/50 group-hover:text-[#E4E2DD]/45 transition-colors leading-relaxed">
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick CTA */}
        <div className="mt-12 flex items-center gap-4 animate-slide-up delay-300">
          <Link href="/scan" className="rf-btn px-8 py-4 tracking-widest uppercase text-sm">
            <span>Start Scanning</span>
            <ArrowUpRight className="w-4 h-4" style={{ position: 'relative', zIndex: 1 }} />
          </Link>
          <Link href="/my-furniture" className="rf-btn-ghost px-8 py-4 tracking-widest uppercase text-sm">
            My Furniture
          </Link>
        </div>

      </main>
    </div>
  )
}

import Link from 'next/link'
import { ArrowUpRight, ScanLine, Package2, MessageSquare, RefreshCcw } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#E4E2DD] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 bg-[#E4E2DD]/90 backdrop-blur-sm border-b border-[#1E1E1E]/[0.07]">
        <Link href="/" className="font-display font-bold text-xl uppercase tracking-[-0.04em] text-[#1E1E1E]">
          TOUSE
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {([['Scan', '/scan'], ['Designs', '/designs'], ['Inbox', '/inbox'], ['Furniture', '/my-furniture']] as [string, string][]).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium tracking-[0.08em] text-[#1E1E1E]/55 hover:text-[#1E1E1E] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <Link href="/dashboard" className="rf-btn text-xs px-5 py-2.5 tracking-widest uppercase">
          <span>Dashboard</span>
        </Link>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-10 px-6 md:px-10 overflow-hidden">

        {/* Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute animate-blob"
            style={{
              width: '60vw', height: '60vw',
              top: '-15%', left: '-8%',
              background: '#DB4A2B',
              filter: 'blur(140px)',
              mixBlendMode: 'multiply',
            }}
          />
          <div
            className="absolute animate-blob-2"
            style={{
              width: '55vw', height: '55vw',
              top: '25%', right: '-12%',
              background: '#F8A348',
              filter: 'blur(140px)',
              mixBlendMode: 'multiply',
            }}
          />
          <div
            className="absolute animate-blob-3"
            style={{
              width: '40vw', height: '40vw',
              bottom: '-5%', left: '30%',
              background: '#FF89A9',
              filter: 'blur(160px)',
              mixBlendMode: 'multiply',
            }}
          />
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <p className="rf-label animate-slide-up mb-6">AI-Powered Furniture Discovery</p>

          <h1
            className="font-display font-bold uppercase animate-slide-up delay-100"
            style={{
              fontSize: 'clamp(3.5rem, 14vw, 13rem)',
              lineHeight: '0.82',
              letterSpacing: '-0.05em',
            }}
          >
            EMPTY<br />
            <span
              className="text-[#DB4A2B] inline-block"
              style={{ paddingLeft: 'clamp(1rem, 12vw, 12rem)' }}
            >
              ROOM.
            </span>
          </h1>
          <h1
            className="font-display font-bold uppercase animate-slide-up delay-200 mt-3"
            style={{
              fontSize: 'clamp(2rem, 7.5vw, 7.5rem)',
              lineHeight: '0.88',
              letterSpacing: '-0.05em',
            }}
          >
            FULLY FURNISHED.
          </h1>

          <p className="mt-10 max-w-md text-base md:text-lg text-[#1E1E1E]/60 leading-relaxed animate-slide-up delay-300">
            Photograph your space. AI designs three styled rooms using real nearby listings.
            Message every seller in one tap. Resell just as easily when you move on.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-slide-up delay-400">
            <Link href="/scan" className="rf-btn px-8 py-4 text-sm tracking-widest uppercase">
              <span>Scan My Room</span>
              <ArrowUpRight className="w-4 h-4" style={{ position: 'relative', zIndex: 1 }} />
            </Link>
            <a href="#how" className="rf-btn-ghost px-8 py-4 text-sm tracking-widest uppercase">
              How it works
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-slide-up delay-500 flex flex-col items-center gap-2">
          <div className="w-px h-14 bg-gradient-to-b from-transparent to-[#1E1E1E]/25" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="py-24 md:py-32 px-6 md:px-10 bg-[#D9D6D0] relative overflow-hidden">
        {/* Faint warm blob background */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-1/2 h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 80% 50%, #F8A348 0%, transparent 70%)',
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <h2
            className="font-display font-bold uppercase tracking-[-0.05em] leading-none opacity-90 mb-16 md:mb-20"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 9rem)' }}
          >
            HOW IT<br />WORKS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1E1E1E]/12 border-t border-b border-[#1E1E1E]/12">
            {[
              { icon: ScanLine,     step: '01', title: 'Photograph', desc: 'Snap your empty room. AI reads dimensions, style cues, and open zones.' },
              { icon: Package2,     step: '02', title: 'Design',     desc: 'Get 3 AI-designed room concepts. Every item is a real eBay listing with price.' },
              { icon: MessageSquare,step: '03', title: 'Message',    desc: 'Pick your pieces, tap Message All — AI writes personalized SMS to every seller.' },
              { icon: RefreshCcw,   step: '04', title: 'Resell',     desc: 'Done with a piece? One tap generates a listing and pre-fills Facebook Marketplace.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="p-8 md:p-10">
                <div className="flex items-start justify-between mb-10">
                  <span className="rf-label">{step}</span>
                  <Icon className="w-5 h-5 text-[#DB4A2B]" />
                </div>
                <h3 className="font-display font-bold text-2xl uppercase tracking-tight mb-3">{title}</h3>
                <p className="text-sm text-[#1E1E1E]/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Campaign / CTA block ─────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 md:px-10 bg-[#E4E2DD]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-end">
          <div className="md:col-span-8">
            <h2
              className="font-display font-bold uppercase tracking-[-0.05em]"
              style={{ fontSize: 'clamp(2rem, 5.5vw, 5.5rem)', lineHeight: '0.9' }}
            >
              SECOND-HAND<br />
              <span className="text-[#DB4A2B]">NEVER LOOKED</span><br />
              THIS GOOD.
            </h2>
          </div>
          <div className="md:col-span-4 flex flex-col gap-6">
            <hr className="border-[#1E1E1E]/15" />
            <p className="text-sm text-[#1E1E1E]/55 leading-relaxed">
              Real listings from eBay matched to your room&apos;s exact aesthetic, dimensions, and budget — no scrolling required.
            </p>
            <hr className="border-[#1E1E1E]/15" />
            <Link href="/scan" className="rf-btn px-6 py-4 text-xs tracking-widest uppercase self-start">
              <span>Start For Free</span>
              <ArrowUpRight className="w-3.5 h-3.5" style={{ position: 'relative', zIndex: 1 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <section className="bg-[#1E1E1E] py-16 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
          {[
            { value: '3',      label: 'AI designs per scan' },
            { value: '50+',    label: 'Live listings matched' },
            { value: '1-tap',  label: 'Message all sellers' },
            { value: '~$0.10', label: 'Cost per full scan' },
          ].map(s => (
            <div key={s.label} className="px-6 md:px-10 py-4 first:pl-0">
              <p className="font-display font-bold text-3xl md:text-4xl text-[#DB4A2B]">{s.value}</p>
              <p className="text-xs text-white/35 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-[#1E1E1E] text-[#E4E2DD] px-6 md:px-10 pt-16 pb-10 relative overflow-hidden border-t border-white/8">
        <div
          className="pointer-events-none absolute bottom-0 right-0 font-display font-bold text-[#ffffff]/[0.05] leading-none select-none"
          style={{ fontSize: '16vw', lineHeight: 1 }}
        >
          2025
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 border-b border-[#E4E2DD]/8 pb-16">
            <div className="col-span-2 md:col-span-1">
              <p className="font-display font-bold text-3xl uppercase tracking-tight mb-4">TOUSE</p>
              <p className="text-sm text-[#E4E2DD]/40 leading-relaxed max-w-xs">
                AI-powered second-hand furniture marketplace.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Scan Room', 'Browse Designs', 'Inbox', 'My Furniture'] },
              { title: 'Stack',   links: ['Claude AI', 'eBay Browse API', 'Twilio SMS', 'Supabase'] },
              { title: 'Legal',   links: ['Privacy Policy', 'Terms of Service', 'Open Source'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-[0.15em] text-[#E4E2DD]/25 mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm text-[#E4E2DD]/50 hover:text-[#E4E2DD] transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-[#E4E2DD]/25">
            <p>© 2025 Touse.</p>
            <p className="hidden md:block">AI furniture discovery</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

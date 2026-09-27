import type { Metadata, Viewport } from 'next'
import { BottomNav } from '@/components/BottomNav'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Touse — AI Furniture Marketplace',
  description: 'Go from empty room to fully furnished using real nearby second-hand listings, powered by AI.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Touse' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'Touse — AI Furniture Marketplace',
    description: 'AI-powered room design with real nearby listings.',
    siteName: 'Touse',
  },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E4E2DD',
}

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const hasRealClerkKey =
  CLERK_KEY.length > 20 &&
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder')

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const htmlBody = (
    <html lang="en">
      <head>
        {/* Clash Display + Satoshi from Fontshare */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#E4E2DD] antialiased pb-16 sm:pb-0">
        {children}
        <BottomNav />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )

  if (!hasRealClerkKey) {
    return htmlBody
  }

  const { ClerkProvider } = await import('@clerk/nextjs')
  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      {htmlBody}
    </ClerkProvider>
  )
}

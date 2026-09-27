import { NextRequest, NextResponse } from 'next/server'

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const hasRealClerkKey =
  CLERK_KEY.length > 20 &&
  CLERK_KEY.startsWith('pk_') &&
  !CLERK_KEY.includes('placeholder')

const PROTECTED = ['/dashboard', '/scan', '/designs', '/inbox', '/my-furniture', '/resell']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _clerkMiddleware: any = null

async function getClerkMiddleware() {
  if (_clerkMiddleware) return _clerkMiddleware
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server')
  const isProtected = createRouteMatcher(PROTECTED.map(p => `${p}(.*)`))
  _clerkMiddleware = clerkMiddleware(async (auth, req) => {
    if (isProtected(req)) {
      const { userId, redirectToSignIn } = await auth()
      if (!userId) return redirectToSignIn({ returnBackUrl: req.url })
    }
    return NextResponse.next()
  })
  return _clerkMiddleware
}

export async function middleware(req: NextRequest) {
  // In dev with placeholder keys — skip all auth, let every route through
  if (!hasRealClerkKey) return NextResponse.next()

  const handler = await getClerkMiddleware()
  return handler(req, {} as never)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

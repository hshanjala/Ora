import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Admin login/logout endpoints pass through — they handle their own auth
  if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return supabaseResponse
  }

  // All other /admin and /api/admin routes pass through — they verify the httpOnly cookie internally
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Enforce subscription/suspension on every dashboard request
  if (user && !pathname.startsWith('/blocked') && !pathname.startsWith('/api/')) {
    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('subscription_status, trial_end, subscription_end')
      .eq('clinic_id', user.id)
      .single()

    if (settings) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let blockReason = null

      if (settings.subscription_status === 'suspended') {
        blockReason = 'suspended'
      } else {
        const isOnTrial = settings.subscription_status === 'trial' || !settings.subscription_status
        const isActive  = settings.subscription_status === 'active'
        const endStr = isOnTrial ? settings.trial_end : isActive ? settings.subscription_end : null
        if (endStr) {
          const end = new Date(endStr + 'T00:00:00')
          if (end < today) blockReason = 'expired'
        }
      }

      if (blockReason) {
        const url = request.nextUrl.clone()
        url.pathname = '/blocked'
        url.searchParams.set('reason', blockReason)
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

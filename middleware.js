import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { getBlockReason } from '@/lib/subscriptionAccess'

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

  if (pathname.startsWith('/auth/')) {
    return supabaseResponse
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
    || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage && !pathname.startsWith('/reset-password')) {
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
      const blockReason = getBlockReason(settings)

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

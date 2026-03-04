import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const response = NextResponse.redirect(new URL(next, request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }

    // Log error details for debugging
    console.error('[auth/callback] Exchange failed:', error.message)

    // If PKCE verifier not found, redirect with specific error
    if (error.message.includes('code verifier')) {
      return NextResponse.redirect(
        new URL('/login?error=auth_failed&detail=pkce', request.url)
      )
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=auth_failed', request.url)
  )
}

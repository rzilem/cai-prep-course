import { NextResponse } from 'next/server'

// Middleware is a no-op — auth is handled client-side in the dashboard layout.
// This avoids cookie/localStorage sync issues with Supabase PKCE + Azure AD.
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}

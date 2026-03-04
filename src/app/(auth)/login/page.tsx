'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { GraduationCap, AlertCircle } from 'lucide-react'

function getAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    const supabase = getAuthClient()
    const hash = window.location.hash

    // Case 1: Implicit flow — tokens in URL hash (#access_token=...)
    if (hash.includes('access_token')) {
      setExchanging(true)
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (access_token) {
        supabase.auth
          .setSession({
            access_token,
            refresh_token: refresh_token || '',
          })
          .then(({ error: sessionError }) => {
            if (sessionError) {
              setError('Sign-in failed: ' + sessionError.message)
              setExchanging(false)
            } else {
              window.location.href = '/'
            }
          })
      }
      return
    }

    // Case 2: PKCE flow — code in query string (?code=...)
    const code = searchParams.get('code')
    if (code) {
      setExchanging(true)
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError('Sign-in failed: ' + exchangeError.message)
          setExchanging(false)
        } else {
          window.location.href = '/'
        }
      })
      return
    }

    // Case 3: Already signed in — redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/'
      }
    })

    // Show URL errors
    const urlError = searchParams.get('error')
    if (urlError === 'auth_failed') {
      setError('Sign-in failed. Please try again.')
    }
  }, [searchParams])

  async function handleMicrosoftLogin() {
    setError(null)
    setLoading(true)

    try {
      const supabase = getAuthClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'email profile',
          redirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CAI Prep Course</h1>
            <p className="text-blue-100 mt-1 text-sm">Staff Training Portal</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs text-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PS Property Management
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="text-center space-y-5">
              {exchanging ? (
                <div className="py-4">
                  <span className="inline-block w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-slate-700">Signing you in...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    Sign in with your PS Property Management account
                  </p>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 text-left">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    onClick={handleMicrosoftLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#1a1a1a] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                      </svg>
                    )}
                    {loading ? 'Redirecting...' : 'Sign in with Microsoft'}
                  </button>

                  <p className="text-xs text-slate-400">
                    Only <span className="font-medium">@psprop.net</span> accounts are allowed.
                    <br />
                    Contact your manager if you need access.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Serving Central Texas communities since 1987
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

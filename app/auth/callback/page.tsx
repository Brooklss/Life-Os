'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Prefer reading from window.location to avoid any hook timing issues
        const url = typeof window !== 'undefined' ? new URL(window.location.href) : null
        const qp = url ? url.searchParams : searchParams
        const nextParam = (qp.get('next') || '/')

        const resolveNext = (value: string | null | undefined) => {
          const candidate = value || '/'
          try {
            // Only allow relative internal paths
            return candidate.startsWith('/') ? candidate : '/'
          } catch {
            return '/'
          }
        }

        // 1) Handle explicit provider error params from Supabase
        const supaError = qp.get('error')
        const supaErrorDesc = qp.get('error_description') || qp.get('description')
        if (supaError && supaError !== 'null' && supaError !== 'undefined') {
          router.replace('/auth/auth-code-error?error=' + encodeURIComponent(supaError) + '&description=' + encodeURIComponent(supaErrorDesc || 'Authentication error'))
          return
        }

        // 2) Handle implicit/hash-based tokens (magic link, some providers)
        const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
        const hashParams = new URLSearchParams(hash)
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')
        // Some environments may deliver tokens via query instead of hash
        const queryAccessToken = qp.get('access_token')
        const queryRefreshToken = qp.get('refresh_token')
        const accessToken = hashAccessToken || queryAccessToken
        const refreshToken = hashRefreshToken || queryRefreshToken

        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          if (error) {
            router.push('/auth/auth-code-error?error=session_error&description=' + encodeURIComponent(error.message))
            return
          }

          // Clean hash and redirect
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          }
          router.replace(resolveNext(nextParam))
          return
        }

        // 3) Handle PKCE authorization code flow
        // Read from window search params to avoid any timing/cache issues
        const code = qp.get('code')
        if (code) {
          // First, allow the SDK's detectSessionInUrl to auto-exchange
          // Give the SDK a short tick to process the URL
          await new Promise((r) => setTimeout(r, 150))

          const { data: existing } = await supabase.auth.getSession()
          if (existing.session) {
            router.replace(resolveNext(nextParam))
            return
          }

          // Fallback: manually exchange if auto-detect did not run
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            router.push('/auth/auth-code-error?error=exchange_failed&description=' + encodeURIComponent(error.message))
            return
          }
          if (data.session) {
            router.replace(resolveNext(nextParam))
            return
          }
        }

        // 4) Nothing found — provide more context for debugging
        router.replace('/auth/auth-code-error?error=no_code&description=' + encodeURIComponent('No authentication code provided'))
      } catch (err) {
        router.replace('/auth/auth-code-error?error=callback_error&description=' + encodeURIComponent('An error occurred during authentication'))
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Completing authentication...</p>
      </div>
    </div>
  )
}



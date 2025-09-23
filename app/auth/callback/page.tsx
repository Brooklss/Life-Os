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
        const nextParam = searchParams.get('next') || '/'

        const resolveNext = (value: string | null | undefined) => {
          const candidate = value || '/'
          try {
            // Only allow relative internal paths
            return candidate.startsWith('/') ? candidate : '/'
          } catch {
            return '/'
          }
        }

        // 1) Handle implicit/hash-based tokens (magic link, some providers)
        const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

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

        // 2) Handle PKCE authorization code flow
        const code = searchParams.get('code')
        if (code) {
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

        // 3) Nothing found
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



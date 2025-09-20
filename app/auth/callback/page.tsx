'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have tokens in the URL hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const expiresAt = hashParams.get('expires_at')
        const tokenType = hashParams.get('token_type')

        if (accessToken) {
          console.log('Handling implicit flow tokens')
          
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (error) {
            console.error('Error setting session:', error)
            router.push('/auth/auth-code-error?error=session_error&description=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            console.log('Session established successfully')
            // Clear the URL hash and redirect to home
            window.history.replaceState({}, document.title, window.location.pathname)
            router.push('/')
            return
          }
        }

        // If no tokens in hash, check for code parameter (authorization code flow)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (code) {
          console.log('Handling authorization code flow')
          // The server-side route should handle this, but if we're here, redirect to server route
          window.location.href = '/auth/callback?' + window.location.search
          return
        }

        // No authentication data found
        console.log('No authentication data found in URL')
        router.push('/auth/auth-code-error?error=no_auth_data&description=' + encodeURIComponent('No authentication data found'))
        
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/auth/auth-code-error?error=callback_error&description=' + encodeURIComponent('An error occurred during authentication'))
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-slate-300">Completing authentication...</p>
      </div>
    </div>
  )
}

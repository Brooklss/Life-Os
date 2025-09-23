'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')
  const nextParam = searchParams.get('next') || '/'

  useEffect(() => {
    const tryRecoverFromHash = async () => {
      try {
        const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
        if (!hash) return
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (!accessToken) return

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        if (!sessionError) {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
            window.location.replace(nextParam.startsWith('/') ? nextParam : '/')
          }
        }
      } catch {
        // ignore and show error UI
      }
    }
    tryRecoverFromHash()
  }, [nextParam])

  const getErrorMessage = () => {
    switch (error) {
      case 'exchange_failed':
        return 'Failed to exchange authentication code for session. The code may have expired or already been used.'
      case 'no_code':
        return 'No authentication code was provided. Please try signing in again.'
      case 'unexpected':
        return 'An unexpected error occurred during authentication.'
      default:
        return 'There was an error processing your authentication. This could be due to:'
    }
  }

  const getErrorDetails = () => {
    if (description) {
      return (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-300 font-mono break-all">
            {description}
          </p>
        </div>
      )
    }
    
    if (!error || error === 'general') {
      return (
        <ul className="mt-4 text-sm text-slate-400 text-left space-y-2">
          <li>• The authentication code has expired</li>
          <li>• The code has already been used</li>
          <li>• There was a network error</li>
          <li>• The redirect URL is not properly configured</li>
        </ul>
      )
    }
    
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {getErrorMessage()}
          </p>
          {getErrorDetails()}
        </div>
        <div className="mt-8 space-y-4">
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/">
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
            <Link href="/">
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

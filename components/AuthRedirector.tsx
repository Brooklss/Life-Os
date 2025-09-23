'use client'

import { useEffect } from 'react'

export function AuthRedirector() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      const hasHash = window.location.hash.includes('access_token=') || window.location.hash.includes('provider_token=')
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const next = url.pathname + url.search

      if (hasHash || code) {
        const target = new URL('/auth/callback', window.location.origin)
        if (code) target.searchParams.set('code', code)
        target.searchParams.set('next', next.startsWith('/') ? next : '/')
        window.location.replace(target.toString())
      }
    } catch {
      // ignore
    }
  }, [])

  return null
}



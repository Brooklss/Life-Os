'use client'

import { useEffect } from 'react'

export function AuthRedirector() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      // Avoid redirect logic on the callback page itself
      if (window.location.pathname.startsWith('/auth/callback')) return

      const hasHash = window.location.hash.includes('access_token=') || window.location.hash.includes('provider_token=')
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      // Use only pathname for next to avoid nesting code/next recursively
      const nextPathOnly = url.pathname

      if (hasHash || code) {
        // Preserve all existing search params (code, state, etc.)
        const target = new URL('/auth/callback', window.location.origin)
        url.searchParams.forEach((value, key) => {
          target.searchParams.set(key, value)
        })
        // Ensure state is forwarded if present
        if (state && !target.searchParams.get('state')) {
          target.searchParams.set('state', state)
        }
        // Carry along where to return after session is set, but do not nest
        if (!target.searchParams.get('next')) {
          target.searchParams.set('next', nextPathOnly.startsWith('/') ? nextPathOnly : '/')
        } else {
          // Sanitize an existing next that may already contain /auth/callback and code
          const existingNext = target.searchParams.get('next') || '/'
          try {
            const decoded = decodeURIComponent(existingNext)
            if (decoded.includes('/auth/callback')) {
              target.searchParams.set('next', '/')
            }
          } catch {
            target.searchParams.set('next', '/')
          }
        }
        // Preserve hash fragment so callback can process hash tokens
        const hash = window.location.hash
        const targetUrl = target.toString() + (hash ? hash : '')
        window.location.replace(targetUrl)
      }
    } catch {
      // ignore
    }
  }, [])

  return null
}



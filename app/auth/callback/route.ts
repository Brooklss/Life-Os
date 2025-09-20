import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // Debug logging
  console.log('Auth callback received:', {
    url: request.url,
    origin,
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries())
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&description=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.session) {
        const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'
        if (isLocalEnv) {
          // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected&description=${encodeURIComponent('An unexpected error occurred')}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code&description=${encodeURIComponent('No authentication code provided')}`)
}

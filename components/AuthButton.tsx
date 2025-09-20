"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"

export default function AuthButton() {
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser()
      if (!isMounted) return
      setUserEmail(data.user?.email ?? null)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })

    loadSession()

    return () => {
      isMounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (provider: 'github' | 'google' | 'email') => {
    setLoading(true)
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined
      
      if (provider === 'email') {
        const email = typeof window !== "undefined" ? window.prompt("Enter your email to receive a sign-in link") : null
        if (email) {
          const { error: emailError } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo },
          })
          if (emailError) {
            console.error(emailError)
            alert("Failed to send sign-in link: " + emailError.message)
          } else {
            alert("Check your email for a sign-in link.")
          }
        }
        return
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      })
      
      if (error) {
        // Fallback: if provider is not enabled, try magic link sign-in
        if (error.message?.toLowerCase().includes("provider is not enabled") || error.status === 400) {
          const email = typeof window !== "undefined" ? window.prompt("Enter your email to receive a sign-in link") : null
          if (email) {
            const { error: emailError } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: redirectTo },
            })
            if (emailError) {
              console.error(emailError)
              alert("Failed to send sign-in link: " + emailError.message)
            } else {
              alert("Check your email for a sign-in link.")
            }
          }
        } else {
          console.error(error)
          alert("Sign-in failed: " + error.message)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-slate-300 hidden md:inline">{userEmail}</span>
        <Button onClick={handleSignOut} disabled={loading} variant="ghost" className="text-slate-300 hover:text-white">
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {/* Mobile: Compact buttons with just icons */}
      <div className="flex sm:hidden items-center gap-2">
        <Button 
          onClick={() => handleSignIn('google')} 
          disabled={loading} 
          variant="outline" 
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white p-2"
          title="Sign in with Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </Button>
        <Button 
          onClick={() => handleSignIn('github')} 
          disabled={loading} 
          variant="outline" 
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white p-2"
          title="Sign in with GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </Button>
        <Button 
          onClick={() => handleSignIn('email')} 
          disabled={loading} 
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3"
          title="Sign in with Email"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </Button>
      </div>

      {/* Desktop: Full buttons with text */}
      <div className="hidden sm:flex items-center gap-2">
        <Button 
          onClick={() => handleSignIn('google')} 
          disabled={loading} 
          variant="outline" 
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </Button>
        <Button 
          onClick={() => handleSignIn('github')} 
          disabled={loading} 
          variant="outline" 
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </Button>
        <Button 
          onClick={() => handleSignIn('email')} 
          disabled={loading} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </Button>
      </div>
    </div>
  )
}



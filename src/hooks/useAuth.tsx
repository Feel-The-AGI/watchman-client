'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import {
  SIGN_OUT_ENDPOINT,
  clearSupabaseBrowserSession,
  isSignOutNavigationPending,
  markSignOutNavigationPending,
} from '@/lib/auth-session'

interface UserProfile {
  id: string
  email: string
  name: string
  timezone: string
  tier: 'free' | 'pro' | 'admin'
  role: 'user' | 'admin'
  onboarding_completed: boolean
  settings: {
    constraint_mode: 'binary' | 'weighted'
    weighted_mode_enabled: boolean
    max_concurrent_commitments: number
    notifications_email: boolean
    notifications_whatsapp: boolean
    theme: 'dark' | 'light'
  }
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  resendSignupConfirmation: (email: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Pages that don't require redirect after auth
const PUBLIC_PATHS = ['/login', '/auth/callback']
// Pages where logged-in users should NOT be redirected away from (can browse freely)
const NO_REDIRECT_PATHS = ['/', '/pricing']

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      api.setToken(accessToken)
      const response = await api.auth.getProfile()
      if (response) {
        setProfile(response as UserProfile)
        return response as UserProfile
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
    return null
  }, [])

  const refreshProfile = async () => {
    if (session?.access_token) {
      await fetchProfile(session.access_token)
    }
  }

  // Handle redirect after sign in - this is our own logic, no Supabase callback dependency
  const handleAuthRedirect = useCallback((newSession: Session | null, profile: UserProfile | null) => {
    if (!newSession) return
    
    // Don't redirect on certain pages (e.g., pricing - users should stay there)
    const shouldNotRedirect = NO_REDIRECT_PATHS.some(path => pathname === path)
    if (shouldNotRedirect) return
    
    // Only redirect if we're on public/auth pages
    const isOnPublicPage = PUBLIC_PATHS.some(path => pathname === path || pathname?.startsWith('/auth/'))
    
    if (isOnPublicPage) {
      // Check if onboarding is complete
      if (profile && !profile.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    }
  }, [pathname, router])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isSignOutNavigationPending()) return

        if (session) {
          setSession(session)
          setUser(session.user)
          const userProfile = await fetchProfile(session.access_token)
          if (isSignOutNavigationPending()) return
          // Redirect if we have session and on public page
          handleAuthRedirect(session, userProfile)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (!isSignOutNavigationPending()) setLoading(false)
      }
    }

    initAuth()

    // The callback must return before it touches the network. Supabase runs it
    // inside the auth lock, and an awaited profile fetch there blocks signOut.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.access_token) {
        setProfile(null)
        api.setToken(null)
        if (event === 'SIGNED_OUT' && !isSignOutNavigationPending()) {
          router.push('/login')
        }
        return
      }

      const accessToken = session.access_token
      setTimeout(() => {
        if (isSignOutNavigationPending()) return
        void fetchProfile(accessToken).then((userProfile) => {
          if (isSignOutNavigationPending()) return
          if (event === 'SIGNED_IN') {
            handleAuthRedirect(session, userProfile)
          }
        })
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, handleAuthRedirect, router])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Redirect handled by onAuthStateChange
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })
    return { error, needsEmailConfirmation: !error && !data.session }
  }

  const signOut = async () => {
    // auth-js leaves the cookie in place when the revoke request returns anything
    // other than success, 401, 403, or 404. The promise still resolves, so the
    // caller cannot tell the session survived. Always drop local state, then
    // load a document that expires whatever cookies the browser still sends.
    markSignOutNavigationPending()
    try {
      await supabase.auth.stopAutoRefresh()
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Sign out failed:', error)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
    clearSupabaseBrowserSession()
    setSession(null)
    setUser(null)
    setProfile(null)
    api.setToken(null)
    if (typeof document === 'undefined') return
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = SIGN_OUT_ENDPOINT
    form.hidden = true
    try {
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error('Sign out navigation failed:', error)
      window.location.assign('/login')
    }
  }

  const signInWithGoogle = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })
    return { error }
  }

  const resendSignupConfirmation = async (email: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithMagicLink = async (email: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithMagicLink,
        resendSignupConfirmation,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

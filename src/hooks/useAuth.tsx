'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import {
  SIGN_OUT_ENDPOINT,
  blockAuthPersistence,
  clearSupabaseBrowserSession,
  isSignOutNavigationPending,
  markSignOutNavigationPending,
  navChoiceAfterUserCheck,
  type DashboardAuthError,
} from '@/lib/auth-session'
import {
  browserFirstTouchStorage,
  emailSignupData,
  magicLinkSignupData,
  oauthFirstTouchBackfill,
  readFirstTouch,
  type BackfillAttemptStore,
} from '@/lib/first-touch'
import { localhostE2EAuth } from '@/lib/e2e-auth'

const oauthBackfillAttempted = new Set<string>()

function oauthBackfillAttempts(): BackfillAttemptStore {
  return {
    has: (key) => {
      if (oauthBackfillAttempted.has(key)) return true
      try {
        return window.sessionStorage.getItem(key) === '1'
      } catch {
        return false
      }
    },
    add: (key) => {
      oauthBackfillAttempted.add(key)
      try {
        window.sessionStorage.setItem(key, '1')
      } catch {
        // The in-memory set still stops a second call in this tab.
      }
    },
  }
}

function maybeBackfillOAuthFirstTouch(user: User | null | undefined) {
  if (!user) return
  const plan = oauthFirstTouchBackfill({
    user: {
      id: user.id,
      created_at: user.created_at,
      app_metadata: user.app_metadata,
      identities: user.identities,
      user_metadata: user.user_metadata,
    },
    now: Date.now(),
    touch: readFirstTouch(browserFirstTouchStorage()),
    attempted: oauthBackfillAttempts(),
  })
  if (!plan) return
  void supabase.auth.updateUser({ data: plan.data }).catch((error) => {
    console.error('Could not save the signup source:', error)
  })
}

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
  const sessionCheck = useRef(false)
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
    if (localhostE2EAuth()) {
      const e2eUser = {
        id: 'e2e-user',
        email: 'e2e@trywatchman.app',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-10-22T08:00:00.000Z',
      } as User
      const e2eSession = {
        access_token: 'e2e',
        refresh_token: 'e2e',
        expires_in: 3600,
        token_type: 'bearer',
        user: e2eUser,
      } as Session
      api.setToken('e2e')
      setSession(e2eSession)
      setUser(e2eUser)
      setProfile({
        id: 'e2e-user',
        email: 'e2e@trywatchman.app',
        name: 'Tim',
        timezone: 'UTC',
        tier: 'free',
        role: 'user',
        onboarding_completed: true,
        settings: {
          constraint_mode: 'binary',
          weighted_mode_enabled: false,
          max_concurrent_commitments: 2,
          notifications_email: false,
          notifications_whatsapp: false,
          theme: 'dark',
        },
      })
      setLoading(false)
      return
    }

    const initAuth = async () => {
      sessionCheck.current = true
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isSignOutNavigationPending()) return
        if (!session) return

        let checkedUser: User | null = null
        let checkedError: DashboardAuthError | null = null
        try {
          const { data, error } = await supabase.auth.getUser()
          checkedUser = data.user
          checkedError = error
        } catch (error) {
          checkedError = thrownAuthError(error)
        }
        if (isSignOutNavigationPending()) return

        const choice = navChoiceAfterUserCheck({
          checked: true,
          localUser: session.user,
          user: checkedUser,
          error: checkedError,
        })
        if (choice !== 'in') {
          // The cookie still answered getSession(), but the server rejected it.
          // Drop the in-memory session first so auto-refresh cannot write it back.
          try {
            const { error } = await supabase.auth.signOut({ scope: 'local' })
            if (error) console.error('Sign out failed:', error)
          } catch (error) {
            console.error('Sign out failed:', error)
          }
          clearSupabaseBrowserSession()
          setSession(null)
          setUser(null)
          setProfile(null)
          api.setToken(null)
          return
        }

        setSession(session)
        setUser(checkedUser ?? session.user)
        maybeBackfillOAuthFirstTouch(checkedUser ?? session.user)
        const userProfile = await fetchProfile(session.access_token)
        if (isSignOutNavigationPending()) return
        handleAuthRedirect(session, userProfile)
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        sessionCheck.current = false
        if (!isSignOutNavigationPending()) setLoading(false)
      }
    }

    initAuth()

    // The callback must return before it touches the network. Supabase runs it
    // inside the auth lock, and an awaited profile fetch there blocks signOut.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      // getSession() already published this. initAuth validates it with getUser().
      if (event === 'INITIAL_SESSION') return
      if (isSignOutNavigationPending()) return
      if (sessionCheck.current && event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return

      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.access_token) {
        setProfile(null)
        api.setToken(null)
        if (event === 'SIGNED_OUT' && !sessionCheck.current) {
          router.push('/login')
        }
        return
      }

      const accessToken = session.access_token
      setTimeout(() => {
        if (isSignOutNavigationPending() || sessionCheck.current) return
        maybeBackfillOAuthFirstTouch(session.user)
        void fetchProfile(accessToken).then((userProfile) => {
          if (isSignOutNavigationPending() || sessionCheck.current) return
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
        data: emailSignupData(name, browserFirstTouchStorage()),
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    })
    return { error, needsEmailConfirmation: !error && !data.session }
  }

  const signOut = async () => {
    // auth-js leaves the cookie in place when the revoke request returns anything
    // other than success, 401, 403, or 404. The promise still resolves. Block
    // later session writes, remove the local session anyway, then load a
    // document that expires the whole auth-cookie family.
    markSignOutNavigationPending()
    blockAuthPersistence()
    try {
      await supabase.auth.stopAutoRefresh()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out failed:', error)
        const local = await supabase.auth.signOut({ scope: 'local' })
        if (local.error) console.error('Sign out failed:', local.error)
      }
    } catch (error) {
      console.error('Sign out failed:', error)
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (localError) {
        console.error('Sign out failed:', localError)
      }
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
    // auth-js 2.89 signInWithOAuth has no options.data. A new Google account
    // is tagged once, after the session starts, by maybeBackfillOAuthFirstTouch.
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
    const firstTouch = magicLinkSignupData(browserFirstTouchStorage())
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        shouldCreateUser: true,
        ...(firstTouch ? { data: firstTouch } : {}),
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

function thrownAuthError(error: unknown): DashboardAuthError {
  if (error instanceof Error) {
    const status = (error as { status?: unknown }).status
    const code = (error as { code?: unknown }).code
    return {
      name: error.name,
      message: error.message,
      status: typeof status === 'number' ? status : undefined,
      code: typeof code === 'string' ? code : undefined,
    }
  }
  return { name: 'TypeError', message: 'Failed to fetch' }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

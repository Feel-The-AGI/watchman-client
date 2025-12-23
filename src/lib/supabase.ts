import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured')
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey
  )
}

// Lazy initialization for build time
let _supabase: ReturnType<typeof createBrowserClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient()
    }
    return (_supabase as any)[prop]
  }
})

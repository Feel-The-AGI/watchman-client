'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastContainer } from '@/components/ui/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ToastContainer />
    </AuthProvider>
  )
}

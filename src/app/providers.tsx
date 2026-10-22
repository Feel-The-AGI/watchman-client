'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastContainer } from '@/components/ui/Toast'
import { browserFirstTouchStorage, captureFirstTouch } from '@/lib/first-touch'

function FirstTouchCapture() {
  const pathname = usePathname()
  useEffect(() => {
    captureFirstTouch({
      search: window.location.search,
      pathname: window.location.pathname,
      referrer: document.referrer,
      storage: browserFirstTouchStorage(),
    })
  }, [pathname])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FirstTouchCapture />
      {children}
      <ToastContainer />
    </AuthProvider>
  )
}

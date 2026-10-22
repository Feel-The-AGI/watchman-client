import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { SHARE_DESCRIPTION } from '@/lib/marketing-copy'
import { PUBLIC_SITE_ORIGIN } from '@/lib/public-site'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_ORIGIN),
  title: 'Watchman - Time Under Control',
  description: 'Plan rotating shifts, leave and personal commitments in one calendar. Built for people whose working week changes.',
  keywords: ['calendar', 'schedule', 'rotation', 'shift work', 'planning', 'life management'],
  authors: [{ name: 'Watchman' }],
  icons: {
    icon: '/watchman-logo.png',
    shortcut: '/watchman-logo.png',
    apple: '/watchman-logo.png',
  },
  openGraph: {
    title: 'Watchman - Time Under Control',
    description: SHARE_DESCRIPTION,
    url: PUBLIC_SITE_ORIGIN,
    siteName: 'Watchman',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watchman - Time Under Control',
    description: SHARE_DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-watchman-bg text-watchman-text antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

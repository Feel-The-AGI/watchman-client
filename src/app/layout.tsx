import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Ignore a malformed site URL and use the public production origin.
    }
  }
  return 'https://trywatchman.app'
}

const siteUrl = publicSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    description: 'See your year clearly. Change it deliberately.',
    url: siteUrl,
    type: 'website',
    images: ['/watchman-logo.png'],
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

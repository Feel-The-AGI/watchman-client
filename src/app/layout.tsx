import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Watchman - Time Under Control',
  description: 'A deterministic life-state simulator with approval-gated change control. Guard your hours. Live by rule, not noise.',
  keywords: ['calendar', 'schedule', 'rotation', 'shift work', 'planning', 'life management'],
  authors: [{ name: 'Watchman' }],
  openGraph: {
    title: 'Watchman - Time Under Control',
    description: 'See your year clearly. Change it deliberately.',
    type: 'website',
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

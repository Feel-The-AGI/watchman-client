import Link from 'next/link'

export const metadata = { title: 'Page not found | Watchman' }

export default function NotFound() {
  return (
    <main className="min-h-screen bg-watchman-bg text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-watchman-accent mb-3">404</p>
        <h1 className="text-3xl font-bold mb-3">This page doesn&apos;t exist</h1>
        <p className="text-watchman-text-secondary mb-8">
          The link may be old or mistyped. Your calendar is safe.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-3 rounded-xl bg-watchman-accent hover:bg-watchman-accent-hover font-medium transition-colors"
          >
            Open my calendar
          </Link>
          <Link
            href="/"
            className="px-5 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 font-medium transition-colors"
          >
            Go to the home page
          </Link>
        </div>
      </div>
    </main>
  )
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Settings,
  BarChart3,
  Sliders,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const navigation = [
  { name: 'Calendar', href: '/dashboard', icon: Calendar },
  { name: 'Rules', href: '/dashboard/rules', icon: Sliders },
  { name: 'Statistics', href: '/dashboard/stats', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut, loading } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-watchman-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-watchman-surface border-r border-white/5 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <Link href="/dashboard">
              <Logo size="sm" />
            </Link>
            <button
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-watchman-accent/10 text-watchman-accent'
                      : 'text-watchman-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-watchman-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-watchman-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {profile?.name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-watchman-muted truncate">
                    {profile?.tier === 'admin' ? 'Admin' : profile?.tier === 'pro' ? 'Pro' : 'Free'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-watchman-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 py-2 bg-watchman-bg border border-white/10 rounded-xl shadow-xl"
                  >
                    <Link
                      href="/dashboard/settings"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setSidebarOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-watchman-muted hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-watchman-error hover:bg-watchman-error/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-watchman-bg/80 backdrop-blur-md border-b border-white/5 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold">
              {navigation.find((n) => 
                pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
              )?.name || 'Calendar'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-watchman-muted hidden sm:flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat with agent on dashboard
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

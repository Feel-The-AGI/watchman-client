'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

const navigation = [
  { name: 'Calendar', href: '/dashboard', icon: Calendar, description: 'View your schedule' },
  { name: 'Master Settings', href: '/dashboard/rules', icon: Sliders, description: 'Manage rotation' },
  { name: 'Statistics', href: '/dashboard/stats', icon: BarChart3, description: 'Analytics & insights' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Account & prefs' },
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
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-watchman-accent/20 border-t-watchman-accent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-watchman-accent" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tierBadge = {
    admin: { label: 'Admin', color: 'text-watchman-purple', bg: 'bg-watchman-purple/10' },
    pro: { label: 'Pro', color: 'text-watchman-mint', bg: 'bg-watchman-mint/10' },
    free: { label: 'Free', color: 'text-watchman-muted', bg: 'bg-white/5' },
  };

  const currentTier = tierBadge[profile?.tier as keyof typeof tierBadge] || tierBadge.free;

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex">
      {/* Mesh Background */}
      <div className="fixed inset-0 mesh-bg opacity-30 pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 glass-strong border-r border-white/5 transform transition-transform duration-300 ease-spring lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <Image 
                src="/watchman-logo.png" 
                alt="Watchman" 
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold tracking-tight">Watchman</span>
            </Link>
            <button
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-watchman-accent text-white shadow-lg shadow-watchman-accent/20'
                        : 'text-watchman-text-secondary hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{item.name}</span>
                      {!isActive && (
                        <p className="text-xs text-watchman-muted group-hover:text-watchman-text-secondary transition-colors">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center border border-white/10">
                  <User className="w-5 h-5 text-watchman-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {profile?.name || user.email?.split('@')[0]}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${currentTier.bg} ${currentTier.color}`}>
                    {profile?.tier === 'pro' && <Crown className="w-3 h-3" />}
                    {currentTier.label}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-watchman-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 py-2 glass-strong border border-white/10 rounded-xl shadow-xl overflow-hidden"
                  >
                    <Link
                      href="/dashboard/settings"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setSidebarOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-watchman-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-watchman-error hover:bg-watchman-error/10 transition-colors"
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
      <main className="flex-1 flex flex-col min-h-screen relative">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 glass-subtle border-b border-white/5 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2.5 -ml-2 hover:bg-white/5 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold">
                {navigation.find((n) => 
                  pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
                )?.name || 'Calendar'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.tier !== 'pro' && profile?.tier !== 'admin' && (
              <Link href="/pricing">
                <Button variant="glass" size="sm" className="gap-2">
                  <Crown className="w-4 h-4 text-watchman-mint" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              </Link>
            )}
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

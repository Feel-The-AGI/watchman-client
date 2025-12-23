'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, Sparkles, Shield, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'signin' | 'signup' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, loading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email);
        setMagicLinkSent(true);
        return;
      }

      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    }
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-watchman-bg text-white flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-watchman-accent/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-watchman-purple/20 rounded-full blur-[150px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30"
          >
            <Mail className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
          <p className="text-watchman-muted mb-8 leading-relaxed">
            We sent a magic link to <span className="text-white font-medium">{email}</span>. 
            Click the link in your email to sign in securely.
          </p>
          <Button 
            variant="glass" 
            onClick={() => setMagicLinkSent(false)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Try a different email
          </Button>
        </motion.div>
      </div>
    );
  }

  const features = [
    { icon: Clock, text: 'Deterministic scheduling' },
    { icon: Shield, text: 'Approval-gated mutations' },
    { icon: Zap, text: 'Complete statistics' },
    { icon: Sparkles, text: 'Undo / Redo anytime' },
  ];

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-watchman-accent/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-watchman-purple/10 rounded-full blur-[150px]" />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="absolute inset-0 glass-strong border-r border-white/5" />
        <div className="relative max-w-md z-10">
          <Link href="/" className="flex items-center gap-4 mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Logo size="xl" />
            </motion.div>
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold tracking-tight"
            >
              Watchman
            </motion.span>
          </Link>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold mb-4"
          >
            Enter the watchtower.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-watchman-muted leading-relaxed mb-10 text-lg"
          >
            Define your rotation. Set your constraints. 
            Generate a year of clarity. Every change approved by you.
          </motion.p>
          
          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-4 p-3 glass rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-watchman-accent" />
                </div>
                <span className="text-sm text-watchman-muted">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <Logo size="lg" />
            <span className="text-2xl font-bold">Watchman</span>
          </Link>

          <div className="glass rounded-3xl p-8 border border-white/10">
            <div className="text-center mb-8">
              <motion.h1 
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold mb-2"
              >
                {mode === 'signin' && 'Welcome back'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'magic' && 'Sign in with magic link'}
              </motion.h1>
              <p className="text-watchman-muted text-sm">
                {mode === 'signin' && 'Sign in to access your calendar'}
                {mode === 'signup' && 'Start watching your time'}
                {mode === 'magic' && "We'll email you a secure link"}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Full Name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jason Mensah"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <AnimatePresence mode="wait">
                {mode !== 'magic' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full gap-2 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'magic' && 'Send Magic Link'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-watchman-surface text-watchman-muted">or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="glass"
                size="lg"
                className="w-full gap-3"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              {mode !== 'magic' && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => setMode('magic')}
                >
                  <Mail className="w-5 h-5" />
                  Magic Link
                </Button>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-watchman-muted">
              {mode === 'signin' && (
                <p>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-watchman-accent hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-watchman-accent hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {mode === 'magic' && (
                <p>
                  Want to use password?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-watchman-accent hover:underline font-medium"
                  >
                    Sign in with password
                  </button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

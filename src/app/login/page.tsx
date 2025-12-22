'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Loader2, Chrome } from 'lucide-react';
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
      <div className="min-h-screen bg-watchman-bg text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-watchman-mint/10 border border-watchman-mint/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-watchman-mint" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p className="text-watchman-muted mb-6">
            We sent a magic link to <span className="text-white">{email}</span>. 
            Click the link to sign in.
          </p>
          <Button 
            variant="ghost" 
            onClick={() => setMagicLinkSent(false)}
          >
            Try a different email
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-watchman-surface border-r border-white/5 items-center justify-center p-12">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <Logo size="xl" />
            <span className="text-3xl font-bold">Watchman</span>
          </Link>
          <h2 className="text-2xl font-semibold mb-4">Enter the watchtower.</h2>
          <p className="text-watchman-muted leading-relaxed mb-8">
            Define your rotation. Set your constraints. 
            Generate a year of clarity. Every change approved by you.
          </p>
          <div className="space-y-4">
            {[
              'Deterministic scheduling',
              'Approval-gated mutations',
              'Complete statistics',
              'Undo / Redo anytime',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-watchman-accent" />
                <span className="text-sm text-watchman-muted">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <Logo size="md" />
            <span className="text-xl font-bold">Watchman</span>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'magic' && 'Sign in with magic link'}
            </h1>
            <p className="text-watchman-muted">
              {mode === 'signin' && 'Sign in to access your calendar'}
              {mode === 'signup' && 'Start watching your time'}
              {mode === 'magic' && "No password needed"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-watchman-error/10 border border-watchman-error/20">
              <p className="text-sm text-watchman-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jason Mensah"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {mode !== 'magic' && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-2"
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
              <span className="px-4 bg-watchman-bg text-watchman-muted">or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="secondary"
              size="lg"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <Chrome className="w-5 h-5" />
              Google
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
                  className="text-watchman-accent hover:underline"
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
                  className="text-watchman-accent hover:underline"
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
                  className="text-watchman-accent hover:underline"
                >
                  Sign in with password
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // For OAuth callbacks, Supabase puts the tokens in the URL hash
        // The auth state change listener in AuthProvider will pick this up
        // We just need to wait for it and then redirect
        
        setStatus('Verifying authentication...');
        
        // Listen for the auth state to change (triggered by URL hash processing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setStatus('Success! Redirecting...');
              // Small delay to ensure state is synced
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
              subscription.unsubscribe();
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Also handle token refresh
              router.push('/dashboard');
              subscription.unsubscribe();
            }
          }
        );

        // Also check if we already have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
          return;
        }

        if (session) {
          setStatus('Success! Redirecting...');
          router.push('/dashboard');
          subscription.unsubscribe();
          return;
        }

        // If no session yet, wait a bit for the hash to be processed
        // The onAuthStateChange listener will handle the redirect
        setTimeout(() => {
          // Final check after delay
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              router.push('/dashboard');
            } else {
              // No session after timeout, redirect to login
              router.push('/login?error=no_session');
            }
            subscription.unsubscribe();
          });
        }, 3000);

      } catch (error) {
        console.error('Callback error:', error);
        router.push('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-watchman-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-watchman-accent mx-auto mb-4" />
        <p className="text-watchman-muted">{status}</p>
      </div>
    </div>
  );
}

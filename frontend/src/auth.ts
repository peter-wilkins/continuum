import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase.js';

export async function getInitialSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(redirectTo = `${window.location.origin}/continuum`) {
  const nativeShell = navigator.userAgent.includes('ContinuumShell');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: nativeShell ? 'continuum://auth-callback' : redirectTo,
    },
  });

  if (error) throw error;
}

export function onAuthChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

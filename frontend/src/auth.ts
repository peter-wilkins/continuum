import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase.js';

export const authRedirectNextKey = 'continuum.authRedirect.next';

export function getSafeAuthNextPath(rawReturnTo: string, currentOrigin: string) {
  try {
    const returnTo = new URL(rawReturnTo, currentOrigin);
    if (returnTo.origin !== currentOrigin) return '/continuum';
    if (returnTo.pathname === '/auth/callback') return '/continuum';
    return `${returnTo.pathname}${returnTo.search}${returnTo.hash}`;
  } catch {
    return '/continuum';
  }
}

export function getOAuthCallbackRedirectUrl(currentOrigin: string) {
  return new URL('/auth/callback', currentOrigin).toString();
}

export function getStoredAuthRedirectNext(currentLocation: Location) {
  const nextFromUrl = new URL(currentLocation.href).searchParams.get('next');
  const nextFromStorage = window.sessionStorage.getItem(authRedirectNextKey);
  return getSafeAuthNextPath(nextFromUrl ?? nextFromStorage ?? '/continuum', currentLocation.origin);
}

export function getAuthRedirectError(currentLocation: Location) {
  const params = new URLSearchParams(currentLocation.hash.slice(1));
  const errorDescription = params.get('error_description');
  return errorDescription ? errorDescription.replace(/\+/g, ' ') : null;
}

export function clearStoredAuthRedirectNext() {
  window.sessionStorage.removeItem(authRedirectNextKey);
}

export async function getInitialSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(redirectTo = `${window.location.origin}/continuum`) {
  const nativeShell = navigator.userAgent.includes('ContinuumShell');
  const webRedirectTo = getOAuthCallbackRedirectUrl(window.location.origin);
  window.sessionStorage.setItem(
    authRedirectNextKey,
    getSafeAuthNextPath(redirectTo, window.location.origin),
  );

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: nativeShell ? 'continuum://auth-callback' : webRedirectTo,
    },
  });

  if (error) throw error;
}

export async function signOutCurrentDevice() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export function onAuthChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => data.subscription.unsubscribe();
}

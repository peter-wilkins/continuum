import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseAnonKey, supabaseAuthStorageKey, supabaseUrl } from './supabase.js';

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

export function getImplicitAuthRedirectTokens(hash: string) {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresIn = Number(params.get('expires_in') ?? '3600');
  const expiresAt = Number(
    params.get('expires_at') ?? Math.round(Date.now() / 1000) + expiresIn,
  );
  const tokenType = 'bearer' as const;
  const providerToken = params.get('provider_token');
  const providerRefreshToken = params.get('provider_refresh_token');

  if (!accessToken || !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    expiresIn,
    expiresAt,
    tokenType,
    providerToken,
    providerRefreshToken,
  };
}

export function getStoredAuthRedirectNext(currentLocation: Location) {
  const nextFromUrl = new URL(currentLocation.href).searchParams.get('next');
  const nextFromStorage = window.sessionStorage.getItem(authRedirectNextKey);
  return getSafeAuthNextPath(nextFromUrl ?? nextFromStorage ?? '/continuum', currentLocation.origin);
}

export function getAuthRedirectError(currentLocation: Location) {
  const params = new URLSearchParams(currentLocation.hash.slice(1));
  new URLSearchParams(currentLocation.search).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  const errorDescription = params.get('error_description');
  return errorDescription ? errorDescription.replace(/\+/g, ' ') : null;
}

export function clearStoredAuthRedirectNext() {
  window.sessionStorage.removeItem(authRedirectNextKey);
}

export async function completeImplicitAuthRedirect(currentLocation: Location) {
  const tokens = getImplicitAuthRedirectTokens(currentLocation.hash);
  if (!tokens) return null;

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error(`Failed to validate Supabase session (${userResponse.status})`);
  }

  const user = (await userResponse.json()) as Session['user'];
  const session: Session = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_at: tokens.expiresAt,
    expires_in: tokens.expiresIn,
    token_type: tokens.tokenType,
    user,
  };

  if (tokens.providerToken) {
    session.provider_token = tokens.providerToken;
  }

  if (tokens.providerRefreshToken) {
    session.provider_refresh_token = tokens.providerRefreshToken;
  }

  window.localStorage.setItem(supabaseAuthStorageKey, JSON.stringify(session));
  window.history.replaceState(
    window.history.state,
    '',
    `${currentLocation.pathname}${currentLocation.search}`,
  );

  return session;
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

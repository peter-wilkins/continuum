import type { Session } from '@supabase/supabase-js';
import type { PublicContinuumResponse, PublicLensFeedbackSummary } from '@continuum/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPublicLensFeedbackSummary, submitPublicLensFeedback } from './api.js';
import { signInWithGoogle, signOutCurrentDevice } from './auth.js';

export type PublicAuthState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'logged_in'; session: Session };

export type PublicFeedbackState =
  | { status: 'idle' }
  | { status: 'submitting'; lensOutputId: string }
  | { status: 'recorded'; lensOutputId: string }
  | { status: 'error'; error: string };

export type PreferencePulse = {
  id: number;
  lensOutputId: string;
};

const publicFeedbackIntentKey = 'continuum.publicAda.pendingLensOutputId';

export function usePublicLensPreference(
  continuum: PublicContinuumResponse | null,
  authState: PublicAuthState,
) {
  const [feedbackState, setFeedbackState] = useState<PublicFeedbackState>({ status: 'idle' });
  const [feedbackSummary, setFeedbackSummary] = useState<PublicLensFeedbackSummary | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [preferencePulses, setPreferencePulses] = useState<PreferencePulse[]>([]);
  const submittedPendingFeedbackRef = useRef<string | null>(null);
  const nextPreferencePulseIdRef = useRef(0);

  const refreshFeedbackSummary = useCallback(() => {
    void fetchPublicLensFeedbackSummary()
      .then(setFeedbackSummary)
      .catch(() => setFeedbackSummary(null));
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchPublicLensFeedbackSummary()
      .then((summary) => {
        if (!mounted) return;
        setFeedbackSummary(summary);
      })
      .catch(() => {
        if (!mounted) return;
        setFeedbackSummary(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const submitPreference = useCallback(
    async (activeContinuum: PublicContinuumResponse, lensOutputId: string, session: Session) => {
      setFeedbackState({ status: 'submitting', lensOutputId });

      try {
        await submitPublicLensFeedback(session, {
          scopeId: activeContinuum.scope.id,
          queryId: activeContinuum.query.id,
          selectedLensOutputId: lensOutputId,
          candidateLensOutputIds: activeContinuum.outputs.map((output) => output.id),
        });
        window.sessionStorage.removeItem(publicFeedbackIntentKey);
        setFeedbackState({ status: 'recorded', lensOutputId });
        setPreferencePulses((current) => [
          ...current,
          {
            id: nextPreferencePulseIdRef.current++,
            lensOutputId,
          },
        ]);
        refreshFeedbackSummary();
      } catch (err: unknown) {
        setFeedbackState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to record Lens feedback',
        });
      }
    },
    [refreshFeedbackSummary],
  );

  useEffect(() => {
    if (!continuum || authState.status !== 'logged_in') return;

    const pendingLensOutputId = window.sessionStorage.getItem(publicFeedbackIntentKey);
    if (!pendingLensOutputId) return;

    if (!continuum.outputs.some((output) => output.id === pendingLensOutputId)) {
      window.sessionStorage.removeItem(publicFeedbackIntentKey);
      return;
    }

    if (submittedPendingFeedbackRef.current === pendingLensOutputId) return;
    submittedPendingFeedbackRef.current = pendingLensOutputId;
    void submitPreference(continuum, pendingLensOutputId, authState.session);
  }, [authState, continuum, submitPreference]);

  async function preferLens(lensOutputId: string) {
    if (!continuum) return;

    if (authState.status !== 'logged_in') {
      window.sessionStorage.setItem(publicFeedbackIntentKey, lensOutputId);
      setFeedbackState({ status: 'submitting', lensOutputId });
      await signInWithGoogle(window.location.href);
      return;
    }

    await submitPreference(continuum, lensOutputId, authState.session);
  }

  async function signOut() {
    try {
      setAuthError(null);
      window.sessionStorage.removeItem(publicFeedbackIntentKey);
      await signOutCurrentDevice();
      setFeedbackState({ status: 'idle' });
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  }

  function clearPreferencePulse(id: number) {
    setPreferencePulses((current) => current.filter((pulse) => pulse.id !== id));
  }

  return {
    authError,
    clearPreferencePulse,
    feedbackState,
    feedbackSummary,
    preferencePulses,
    preferLens,
    signOut,
  };
}

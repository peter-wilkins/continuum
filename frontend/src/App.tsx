import type { Session } from '@supabase/supabase-js';
import type { ContinuumEvent } from '@continuum/shared';
import { useEffect, useMemo, useState } from 'react';
import { fetchEvents } from './api.js';
import { getInitialSession, onAuthChange, signInWithGoogle } from './auth.js';

type LoadState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'logged_in'; session: Session };

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [events, setEvents] = useState<ContinuumEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const debug = useMemo(() => new URLSearchParams(window.location.search).get('debug') === '1', []);

  useEffect(() => {
    let mounted = true;

    getInitialSession()
      .then((session) => {
        if (!mounted) return;
        setLoadState(session ? { status: 'logged_in', session } : { status: 'logged_out' });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
        setLoadState({ status: 'logged_out' });
      });

    const unsubscribe = onAuthChange((session) => {
      setLoadState(session ? { status: 'logged_in', session } : { status: 'logged_out' });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loadState.status !== 'logged_in') {
      setEvents([]);
      return;
    }

    fetchEvents(loadState.session)
      .then(setEvents)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      });
  }, [loadState]);

  if (loadState.status === 'loading') {
    return (
      <main className="screen">
        {debug ? <DebugBadge /> : null}
      </main>
    );
  }

  if (loadState.status === 'logged_out') {
    return (
      <main className="login-screen">
        <button className="login-button" type="button" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
        {error ? <p className="error">{error}</p> : null}
        {debug ? <DebugBadge /> : null}
      </main>
    );
  }

  return (
    <main className="log-screen">
      {events.length === 0 ? (
        <p className="empty">Speak in a quiet place. Transcript events will appear here.</p>
      ) : (
        <ol className="event-list">
          {events.map((event) => (
            <li className="event" key={event.id}>
              <p>{event.transcript}</p>
              <time dateTime={event.serverCreatedAt}>
                {new Date(event.serverCreatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              {debug ? (
                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {error ? <p className="error">{error}</p> : null}
      {debug ? <DebugBadge /> : null}
    </main>
  );
}

function DebugBadge() {
  return <div className="debug-badge">commit {__COMMIT_HASH__}</div>;
}

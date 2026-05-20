import type { Session } from '@supabase/supabase-js';
import type { ContinuumEvent } from '@continuum/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEvents, transcribeAudio } from './api.js';
import { type AudioCaptureChunk, useForegroundAudioCapture } from './audioCapture.js';
import { getInitialSession, onAuthChange, signInWithGoogle } from './auth.js';

type LoadState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'logged_in'; session: Session };

type LocalTranscript = {
  id: string;
  transcript: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [events, setEvents] = useState<ContinuumEvent[]>([]);
  const [localTranscripts, setLocalTranscripts] = useState<LocalTranscript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const processedChunkIds = useRef(new Set<string>());
  const transcribingRef = useRef(false);

  const debug = useMemo(() => new URLSearchParams(window.location.search).get('debug') === '1', []);
  const audioCapture = useForegroundAudioCapture(loadState.status === 'logged_in');

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

  useEffect(() => {
    if (loadState.status !== 'logged_in') return;
    if (transcribingRef.current) return;

    const nextChunk = audioCapture.chunks.find((chunk) => !processedChunkIds.current.has(chunk.id));
    if (!nextChunk) return;

    processedChunkIds.current.add(nextChunk.id);
    void transcribeChunk(loadState.session, nextChunk);
  }, [audioCapture.chunks, loadState]);

  async function transcribeChunk(session: Session, chunk: AudioCaptureChunk) {
    transcribingRef.current = true;
    try {
      const result = await transcribeAudio(session, chunk.blob);
      if (!result.transcript) return;

      setLocalTranscripts((current) => [
        {
          id: chunk.id,
          transcript: result.transcript,
          createdAt: new Date().toISOString(),
          metadata: {
            audio: {
              durationMs: chunk.durationMs,
              sizeBytes: chunk.sizeBytes,
              mimeType: chunk.mimeType,
              speechFrames: chunk.speechFrames,
              silenceFrames: chunk.silenceFrames,
              averageRms: chunk.averageRms,
              peakRms: chunk.peakRms,
            },
            transcription: result.metadata,
          },
        },
        ...current,
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      transcribingRef.current = false;
    }
  }

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
      {localTranscripts.length === 0 && events.length === 0 ? (
        <p className="empty">Speak in a quiet place. Transcript events will appear here.</p>
      ) : (
        <ol className="event-list">
          {localTranscripts.map((event) => (
            <li className="event" key={event.id}>
              <p>{event.transcript}</p>
              <time dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              {debug ? (
                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
              ) : null}
            </li>
          ))}
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
      {debug ? (
        <section className="debug-panel" aria-label="Audio capture debug">
          <p>audio {audioCapture.status}</p>
          {audioCapture.error ? <p className="error">{audioCapture.error}</p> : null}
          {audioCapture.chunks.length > 0 ? (
            <ol>
              {audioCapture.chunks.map((chunk) => (
                <li key={chunk.id}>
                  {Math.round(chunk.durationMs)}ms · {chunk.sizeBytes} bytes · peak{' '}
                  {chunk.peakRms.toFixed(3)}
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}
      {debug ? <DebugBadge /> : null}
    </main>
  );
}

function DebugBadge() {
  return <div className="debug-badge">commit {__COMMIT_HASH__}</div>;
}

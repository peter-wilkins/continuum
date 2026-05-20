import type { Session } from '@supabase/supabase-js';
import type { ContinuumEvent } from '@continuum/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchEvents, transcribeAudio } from './api.js';
import { type AudioCaptureChunk, useManualAudioCapture } from './audioCapture.js';
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

type TranscriptionDebug = {
  status: 'idle' | 'transcribing' | 'done' | 'empty' | 'error';
  lastChunkId: string | null;
  lastTranscriptLength: number;
  completedCount: number;
  emptyCount: number;
  error: string | null;
};

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [events, setEvents] = useState<ContinuumEvent[]>([]);
  const [localTranscripts, setLocalTranscripts] = useState<LocalTranscript[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionDebug, setTranscriptionDebug] = useState<TranscriptionDebug>({
    status: 'idle',
    lastChunkId: null,
    lastTranscriptLength: 0,
    completedCount: 0,
    emptyCount: 0,
    error: null,
  });
  const processedChunkIds = useRef(new Set<string>());
  const transcribingRef = useRef(false);

  const debug = useMemo(() => new URLSearchParams(window.location.search).get('debug') === '1', []);
  const audioCapture = useManualAudioCapture(loadState.status === 'logged_in');

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
    setTranscriptionDebug((current) => ({
      ...current,
      status: 'transcribing',
      lastChunkId: chunk.id,
      error: null,
    }));
    try {
      const result = await transcribeAudio(session, chunk.blob);
      if (!result.transcript) {
        setTranscriptionDebug((current) => ({
          ...current,
          status: 'empty',
          lastTranscriptLength: 0,
          emptyCount: current.emptyCount + 1,
        }));
        return;
      }

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
            },
            transcription: result.metadata,
          },
        },
        ...current,
      ]);
      setTranscriptionDebug((current) => ({
        ...current,
        status: 'done',
        lastTranscriptLength: result.transcript.length,
        completedCount: current.completedCount + 1,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transcribe audio';
      setError(message);
      setTranscriptionDebug((current) => ({
        ...current,
        status: 'error',
        error: message,
      }));
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
      <RecordButton
        status={audioCapture.status}
        elapsedMs={audioCapture.elapsedMs}
        onStart={() => void audioCapture.startRecording()}
        onStop={audioCapture.stopRecording}
      />
      {debug ? (
        <section className="debug-panel" aria-label="Audio capture debug">
          <p>commit {import.meta.env.VITE_COMMIT_HASH}</p>
          <p>audio {audioCapture.status}</p>
          {audioCapture.recordingStartedAt ? (
            <p>recording started {new Date(audioCapture.recordingStartedAt).toLocaleTimeString()}</p>
          ) : null}
          <p>
            transcription {transcriptionDebug.status} · done {transcriptionDebug.completedCount} ·
            empty {transcriptionDebug.emptyCount} · last {transcriptionDebug.lastTranscriptLength}
            chars
          </p>
          {transcriptionDebug.error ? <p className="error">{transcriptionDebug.error}</p> : null}
          {audioCapture.error ? <p className="error">{audioCapture.error}</p> : null}
          {audioCapture.chunks.length > 0 ? (
            <ol>
              {audioCapture.chunks.map((chunk) => (
                <li key={chunk.id}>
                  {Math.round(chunk.durationMs)}ms · {chunk.sizeBytes} bytes
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
  return <div className="debug-badge">commit {import.meta.env.VITE_COMMIT_HASH}</div>;
}

type RecordButtonProps = {
  status: 'idle' | 'starting' | 'recording' | 'stopping' | 'error';
  elapsedMs: number;
  onStart(): void;
  onStop(): void;
};

function RecordButton({ status, elapsedMs, onStart, onStop }: RecordButtonProps) {
  const recording = status === 'recording' || status === 'stopping';
  const busy = status === 'starting' || status === 'stopping';
  const label = recording ? 'Stop recording' : 'Start recording';

  return (
    <button
      aria-label={label}
      className={`record-button${recording ? ' is-recording' : ''}`}
      disabled={busy}
      title={label}
      type="button"
      onClick={recording ? onStop : onStart}
    >
      <span className="record-dot" aria-hidden="true" />
      <span className="record-time">{recording ? formatElapsed(elapsedMs) : 'REC'}</span>
    </button>
  );
}

function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

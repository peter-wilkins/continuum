import type { Session } from '@supabase/supabase-js';
import type { ContinuumEvent } from '@continuum/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createEvent, fetchEvents, transcribeAudio } from './api.js';
import { type AudioCaptureChunk, useManualAudioCapture } from './audioCapture.js';
import { getInitialSession, onAuthChange, signInWithGoogle } from './auth.js';
import {
  deletePendingAudio,
  enqueuePendingAudio,
  getPendingAudioSummary,
  listPendingAudio,
  markPendingAudioFailed,
  markPendingAudioProcessing,
  type PendingAudioItem,
  type PendingAudioSummary,
} from './pendingAudioQueue.js';

type LoadState =
  | { status: 'loading' }
  | { status: 'logged_out' }
  | { status: 'logged_in'; session: Session };

type TranscriptionDebug = {
  status: 'idle' | 'queued' | 'transcribing' | 'done' | 'empty' | 'error';
  lastChunkId: string | null;
  lastTranscriptLength: number;
  completedCount: number;
  emptyCount: number;
  error: string | null;
};

export function App() {
  const path = window.location.pathname;

  if (path === '/' || path === '/index.html') {
    return <PrototypeIndex />;
  }

  return <ContinuumApp />;
}

function ContinuumApp() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [events, setEvents] = useState<ContinuumEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [queueSummary, setQueueSummary] = useState<PendingAudioSummary>({
    total: 0,
    pending: 0,
    processing: 0,
    failed: 0,
    totalSizeBytes: 0,
  });
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
  const sessionRef = useRef<Session | null>(null);

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
    sessionRef.current = loadState.status === 'logged_in' ? loadState.session : null;
  }, [loadState]);

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

    const nextChunk = audioCapture.chunks.find((chunk) => !processedChunkIds.current.has(chunk.id));
    if (!nextChunk) return;

    processedChunkIds.current.add(nextChunk.id);
    void queueChunk(nextChunk);
  }, [audioCapture.chunks, loadState]);

  useEffect(() => {
    void refreshQueueSummary();

    function retryWhenOnline() {
      void processPendingQueue();
    }

    window.addEventListener('online', retryWhenOnline);
    return () => window.removeEventListener('online', retryWhenOnline);
  }, []);

  useEffect(() => {
    if (loadState.status !== 'logged_in') return;
    void processPendingQueue();
  }, [loadState]);

  async function queueChunk(chunk: AudioCaptureChunk) {
    try {
      await enqueuePendingAudio(chunk);
      await refreshQueueSummary();
      setTranscriptionDebug((current) => ({
        ...current,
        status: 'queued',
        lastChunkId: chunk.id,
        error: null,
      }));
      void processPendingQueue();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to store recording for retry';
      setError(message);
      setTranscriptionDebug((current) => ({
        ...current,
        status: 'error',
        error: message,
      }));
    }
  }

  async function processPendingQueue() {
    if (transcribingRef.current) return;
    if (!navigator.onLine) return;

    const session = sessionRef.current;
    if (!session) return;

    transcribingRef.current = true;

    try {
      const items = await listPendingAudio();
      for (const item of items) {
        await transcribeQueuedItem(session, item);
      }
    } finally {
      transcribingRef.current = false;
      await refreshQueueSummary();
    }
  }

  async function transcribeQueuedItem(session: Session, item: PendingAudioItem) {
    await markPendingAudioProcessing(item.id);
    await refreshQueueSummary();
    setTranscriptionDebug((current) => ({
      ...current,
      status: 'transcribing',
      lastChunkId: item.id,
      error: null,
    }));
    try {
      const result = await transcribeAudio(session, item.blob, item.durationMs);
      if (!result.transcript) {
        await markPendingAudioFailed(item.id, 'Transcription returned no text');
        setTranscriptionDebug((current) => ({
          ...current,
          status: 'empty',
          lastTranscriptLength: 0,
          emptyCount: current.emptyCount + 1,
        }));
        return;
      }

      const savedEvent = await createEvent(session, {
        source: 'speech',
        transcript: result.transcript,
        clientCreatedAt: item.createdAt,
        metadata: {
          audio: {
            durationMs: item.durationMs,
            sizeBytes: item.sizeBytes,
            mimeType: item.mimeType,
            queuedAt: item.createdAt,
            attemptCount: item.attemptCount + 1,
          },
          transcription: result.metadata,
        },
      });

      await deletePendingAudio(item.id);
      await refreshQueueSummary();
      setEvents((current) => [
        savedEvent,
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
      await markPendingAudioFailed(item.id, message);
      await refreshQueueSummary();
      setError(message);
      setTranscriptionDebug((current) => ({
        ...current,
        status: 'error',
        error: message,
      }));
    }
  }

  async function refreshQueueSummary() {
    try {
      setQueueSummary(await getPendingAudioSummary());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to inspect pending recordings');
    }
  }

  if (loadState.status === 'loading') {
    return (
      <main className="screen">
        <CommitHeader />
      </main>
    );
  }

  if (loadState.status === 'logged_out') {
    return (
      <main className="login-screen">
        <CommitHeader />
        <button className="login-button" type="button" onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
        {error ? <p className="error">{error}</p> : null}
      </main>
    );
  }

  return (
    <main className="log-screen">
      <CommitHeader />
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
      {queueSummary.total > 0 ? (
        <p className="pending-notice">
          {queueSummary.total} recording{queueSummary.total === 1 ? '' : 's'} waiting to sync
        </p>
      ) : null}
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
          <p>
            queue {queueSummary.total} · pending {queueSummary.pending} · failed{' '}
            {queueSummary.failed} · {formatBytes(queueSummary.totalSizeBytes)}
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
    </main>
  );
}

function PrototypeIndex() {
  const continuumUrl = `/continuum${window.location.search}`;

  return (
    <main className="index-screen">
      <header className="index-header">
        <p className="index-kicker">Peter's MVP bench</p>
        <h1>Small prototypes, live enough to try.</h1>
        <p>
          A lightweight lab page for sharing rough but working experiments with friends and family.
          These are personal MVPs: useful, incomplete, and changing quickly.
        </p>
      </header>

      <section className="prototype-section" aria-labelledby="prototype-heading">
        <div className="section-heading">
          <p className="index-kicker">Prototype</p>
          <h2 id="prototype-heading">Available now</h2>
        </div>
        <article className="prototype-card">
          <div>
            <p className="status-pill">Testing today</p>
            <h3>Continuum</h3>
            <p>
              A speech-first log for thinking out loud when you are alone in a quiet place. Press
              record, speak naturally, and save a transcript into an immutable timeline.
            </p>
          </div>
          <dl className="prototype-details">
            <div>
              <dt>Try</dt>
              <dd>Record a short thought, stop, then check the newest transcript at the top.</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Google login, Whisper transcription, saved event log, debug metadata.</dd>
            </div>
          </dl>
          <a className="prototype-link" href={continuumUrl}>
            Open Continuum
          </a>
        </article>
        <article className="prototype-card">
          <div>
            <p className="status-pill">Live prototype</p>
            <h3>JobDone</h3>
            <p>
              A lightweight capture tool for turning quick notes into structured job records. It is
              the earlier prototype that taught us useful lessons about auth, recording, and mobile
              workflow.
            </p>
          </div>
          <dl className="prototype-details">
            <div>
              <dt>Try</dt>
              <dd>Open it, sign in, and capture a small job note from the phone.</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Hosted on Vercel as a separate prototype.</dd>
            </div>
          </dl>
          <a className="prototype-link" href="https://frontend-jobdone1.vercel.app/">
            Open JobDone
          </a>
        </article>
      </section>

      <section className="blog-section" aria-labelledby="blog-heading">
        <div className="section-heading">
          <p className="index-kicker">Notebook</p>
          <h2 id="blog-heading">Build notes</h2>
        </div>
        <article className="blog-entry">
          <time dateTime="2026-05-20">20 May 2026</time>
          <h3>Day one: capture the thought first</h3>
          <p>
            Today&apos;s goal was to get one loop working: record speech, transcribe it, and keep
            the result as an append-only event. We tried always-on capture, then moved to a manual
            record button because it is clearer, cheaper, and easier to trust.
          </p>
        </article>
        <article className="blog-entry">
          <time dateTime="2026-05-20">20 May 2026</time>
          <h3>JobDone joins the bench</h3>
          <p>
            JobDone is now linked from the MVP bench alongside Continuum. It is useful as its own
            experiment and as a reference point for login, recording, and phone-first workflow.
          </p>
        </article>
        <article className="blog-entry">
          <time dateTime="2026-05-20">20 May 2026</time>
          <h3>Security before cleverness</h3>
          <p>
            The prototype is behind login, uses backend-only API keys, tracks transcription spend,
            and keeps SQL migrations in the repo. The AI parts are intentionally simple until the
            log is solid.
          </p>
        </article>
      </section>
    </main>
  );
}

function CommitHeader() {
  return (
    <header className="commit-header">
      <span>commit {import.meta.env.VITE_COMMIT_HASH}</span>
    </header>
  );
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

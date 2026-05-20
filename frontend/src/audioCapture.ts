import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type AudioCaptureStatus = 'idle' | 'starting' | 'recording' | 'stopping' | 'error';

export type AudioCaptureChunk = {
  id: string;
  blob: Blob;
  createdAt: string;
  durationMs: number;
  sizeBytes: number;
  mimeType: string;
};

export type AudioCaptureState = {
  status: AudioCaptureStatus;
  error: string | null;
  chunks: AudioCaptureChunk[];
  recordingStartedAt: string | null;
  elapsedMs: number;
  startRecording(): Promise<void>;
  stopRecording(): void;
};

const RECENT_CHUNK_LIMIT = 12;

export function useManualAudioCapture(enabled: boolean): AudioCaptureState {
  const [status, setStatus] = useState<AudioCaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<AudioCaptureChunk[]>([]);
  const [recordingStartedAt, setRecordingStartedAt] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef(0);

  const resetRecorder = useCallback(() => {
    window.clearInterval(timerRef.current);
    timerRef.current = 0;
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    startedAtRef.current = 0;
    setRecordingStartedAt(null);
    setElapsedMs(0);
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setStatus('stopping');
    recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    if (!enabled || status === 'starting' || status === 'recording' || status === 'stopping') return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('Microphone capture is not supported in this browser');
      return;
    }

    if (!window.MediaRecorder) {
      setStatus('error');
      setError('Audio recording is not supported in this browser');
      return;
    }

    setStatus('starting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const mimeType = chooseMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const parts: BlobPart[] = [];
      const startedAt = performance.now();
      const startedAtIso = new Date().toISOString();

      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = startedAt;

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) parts.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        const blob = new Blob(parts, { type: recorder.mimeType || mimeType || 'audio/webm' });
        const durationMs = Math.round(performance.now() - startedAt);

        resetRecorder();
        setStatus('idle');

        if (blob.size === 0 || durationMs < 300) return;

        setChunks((current) => [
          {
            id: crypto.randomUUID(),
            blob,
            createdAt: new Date().toISOString(),
            durationMs,
            sizeBytes: blob.size,
            mimeType: blob.type,
          },
          ...current,
        ].slice(0, RECENT_CHUNK_LIMIT));
      });

      recorder.addEventListener('error', (event) => {
        resetRecorder();
        setStatus('error');
        setError(event.error?.message || 'Audio recording failed');
      });

      recorder.start(250);
      setRecordingStartedAt(startedAtIso);
      setElapsedMs(0);
      setStatus('recording');
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Math.round(performance.now() - startedAtRef.current));
      }, 250);
    } catch (err: unknown) {
      resetRecorder();
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Audio recording failed');
    }
  }, [enabled, resetRecorder, status]);

  useEffect(() => {
    if (enabled) return;
    stopRecording();
  }, [enabled, stopRecording]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      resetRecorder();
    };
  }, [resetRecorder]);

  return useMemo(
    () => ({
      status,
      error,
      chunks,
      recordingStartedAt,
      elapsedMs,
      startRecording,
      stopRecording,
    }),
    [chunks, elapsedMs, error, recordingStartedAt, startRecording, status, stopRecording],
  );
}

function chooseMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

import { useEffect, useMemo, useRef, useState } from 'react';

export type AudioCaptureStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'speech'
  | 'stopped'
  | 'error';

export type AudioCaptureChunk = {
  id: string;
  blob: Blob;
  createdAt: string;
  durationMs: number;
  sizeBytes: number;
  mimeType: string;
  speechFrames: number;
  silenceFrames: number;
  averageRms: number;
  peakRms: number;
};

export type AudioCaptureState = {
  status: AudioCaptureStatus;
  error: string | null;
  chunks: AudioCaptureChunk[];
};

const SAMPLE_INTERVAL_MS = 100;
const SPEECH_THRESHOLD = 0.025;
const ACTIVE_FRAMES_TO_START = 2;
const SILENT_FRAMES_TO_STOP = 10;
const MIN_CHUNK_MS = 600;
const MAX_CHUNK_MS = 15_000;
const RECENT_CHUNK_LIMIT = 12;

export function useForegroundAudioCapture(enabled: boolean): AudioCaptureState {
  const [state, setState] = useState<AudioCaptureState>({
    status: 'idle',
    error: null,
    chunks: [],
  });
  const runtimeRef = useRef<AudioRuntime | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      if (cancelled) return;

      const shouldListen = enabledRef.current && document.visibilityState === 'visible' && document.hasFocus();

      if (!shouldListen) {
        runtimeRef.current?.stop();
        runtimeRef.current = null;
        setState((current) => ({
          ...current,
          status: enabledRef.current ? 'stopped' : 'idle',
          error: null,
        }));
        return;
      }

      if (runtimeRef.current) return;

      setState((current) => ({ ...current, status: 'starting', error: null }));

      try {
        const runtime = await AudioRuntime.create({
          onStatus(status) {
            setState((current) => ({ ...current, status, error: null }));
          },
          onChunk(chunk) {
            setState((current) => ({
              ...current,
              status: 'listening',
              error: null,
              chunks: [chunk, ...current.chunks].slice(0, RECENT_CHUNK_LIMIT),
            }));
          },
          onError(error) {
            setState((current) => ({
              ...current,
              status: 'error',
              error: error instanceof Error ? error.message : 'Audio capture failed',
            }));
          },
        });

        if (cancelled || !enabledRef.current || document.visibilityState !== 'visible' || !document.hasFocus()) {
          runtime.stop();
          return;
        }

        runtimeRef.current = runtime;
        runtime.start();
      } catch (error) {
        setState((current) => ({
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Audio capture failed',
        }));
      }
    }

    void reconcile();

    window.addEventListener('focus', reconcile);
    window.addEventListener('blur', reconcile);
    document.addEventListener('visibilitychange', reconcile);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', reconcile);
      window.removeEventListener('blur', reconcile);
      document.removeEventListener('visibilitychange', reconcile);
      runtimeRef.current?.stop();
      runtimeRef.current = null;
    };
  }, [enabled]);

  return useMemo(() => state, [state]);
}

type AudioRuntimeCallbacks = {
  onStatus(status: AudioCaptureStatus): void;
  onChunk(chunk: AudioCaptureChunk): void;
  onError(error: unknown): void;
};

class AudioRuntime {
  private intervalId = 0;
  private activeFrames = 0;
  private silentFrames = 0;
  private recording: RecordingState | null = null;
  private stopped = false;

  private constructor(
    private readonly stream: MediaStream,
    private readonly audioContext: AudioContext,
    private readonly analyser: AnalyserNode,
    private readonly data: Float32Array<ArrayBuffer>,
    private readonly callbacks: AudioRuntimeCallbacks,
  ) {}

  static async create(callbacks: AudioRuntimeCallbacks): Promise<AudioRuntime> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is not supported in this browser');
    }

    if (!window.MediaRecorder) {
      throw new Error('Audio recording is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    return new AudioRuntime(
      stream,
      audioContext,
      analyser,
      new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>,
      callbacks,
    );
  }

  start() {
    this.callbacks.onStatus('listening');
    this.intervalId = window.setInterval(this.sample, SAMPLE_INTERVAL_MS);
  }

  stop() {
    this.stopped = true;
    clearInterval(this.intervalId);
    this.stopRecording();
    this.stream.getTracks().forEach((track) => track.stop());
    void this.audioContext.close();
  }

  private sample = () => {
    if (this.stopped) return;

    const now = performance.now();
    this.analyser.getFloatTimeDomainData(this.data);
    const rms = calculateRms(this.data);

    if (rms >= SPEECH_THRESHOLD) {
      this.activeFrames += 1;
      this.silentFrames = 0;
    } else {
      this.silentFrames += 1;
      this.activeFrames = 0;
    }

    if (!this.recording && this.activeFrames >= ACTIVE_FRAMES_TO_START) {
      this.startRecording(now);
    }

    if (!this.recording) return;

    this.recording.rmsTotal += rms;
    this.recording.rmsSamples += 1;
    this.recording.peakRms = Math.max(this.recording.peakRms, rms);

    if (rms >= SPEECH_THRESHOLD) {
      this.recording.speechFrames += 1;
    } else {
      this.recording.silenceFrames += 1;
    }

    const durationMs = now - this.recording.startedAt;
    if (
      (durationMs >= MIN_CHUNK_MS && this.silentFrames >= SILENT_FRAMES_TO_STOP) ||
      durationMs >= MAX_CHUNK_MS
    ) {
      this.stopRecording();
    }
  };

  private startRecording(now: number) {
    try {
      const mimeType = chooseMimeType();
      const recorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);
      const chunks: BlobPart[] = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });

      recorder.addEventListener('stop', () => {
        const recording = this.recording;
        if (!recording) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        this.callbacks.onChunk({
          id: crypto.randomUUID(),
          blob,
          createdAt: new Date().toISOString(),
          durationMs: Math.round(performance.now() - recording.startedAt),
          sizeBytes: blob.size,
          mimeType: blob.type,
          speechFrames: recording.speechFrames,
          silenceFrames: recording.silenceFrames,
          averageRms: recording.rmsSamples > 0 ? recording.rmsTotal / recording.rmsSamples : 0,
          peakRms: recording.peakRms,
        });
      });

      recorder.start(250);
      this.recording = {
        recorder,
        startedAt: now,
        speechFrames: 0,
        silenceFrames: 0,
        rmsTotal: 0,
        rmsSamples: 0,
        peakRms: 0,
      };
      this.callbacks.onStatus('speech');
    } catch (error) {
      this.callbacks.onError(error);
    }
  }

  private stopRecording() {
    if (!this.recording) return;

    const recorder = this.recording.recorder;
    this.recording = null;
    this.activeFrames = 0;
    this.silentFrames = 0;

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  }
}

type RecordingState = {
  recorder: MediaRecorder;
  startedAt: number;
  speechFrames: number;
  silenceFrames: number;
  rmsTotal: number;
  rmsSamples: number;
  peakRms: number;
};

function calculateRms(data: ArrayLike<number>) {
  let total = 0;

  for (let index = 0; index < data.length; index += 1) {
    const sample = data[index] ?? 0;
    total += sample * sample;
  }

  return Math.sqrt(total / data.length);
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

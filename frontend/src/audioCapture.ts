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

export type AudioInputDevice = {
  deviceId: string;
  groupId: string;
  label: string;
};

export type ActiveAudioTrack = {
  label: string;
  deviceId?: string;
  groupId?: string;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
};

export type AudioCaptureState = {
  status: AudioCaptureStatus;
  error: string | null;
  chunks: AudioCaptureChunk[];
  inputDevices: AudioInputDevice[];
  activeTrack: ActiveAudioTrack | null;
  recordingStartedAt: string | null;
  elapsedMs: number;
  startRecording(deviceId?: string): Promise<void>;
  stopRecording(): void;
  refreshDevices(): Promise<void>;
};

const RECENT_CHUNK_LIMIT = 12;

export function useManualAudioCapture(enabled: boolean): AudioCaptureState {
  const [status, setStatus] = useState<AudioCaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<AudioCaptureChunk[]>([]);
  const [inputDevices, setInputDevices] = useState<AudioInputDevice[]>([]);
  const [activeTrack, setActiveTrack] = useState<ActiveAudioTrack | null>(null);
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
    setActiveTrack(null);
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

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputDevices(devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        groupId: device.groupId,
        label: device.label || `Audio input ${index + 1}`,
      })));
  }, []);

  const startRecording = useCallback(async (deviceId?: string) => {
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
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const audioTrack = stream.getAudioTracks()[0] ?? null;
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
      setActiveTrack(audioTrack ? toActiveAudioTrack(audioTrack) : null);
      void refreshDevices();

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
  }, [enabled, refreshDevices, resetRecorder, status]);

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

  useEffect(() => {
    void refreshDevices();

    if (!navigator.mediaDevices?.addEventListener) return;

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
  }, [refreshDevices]);

  return useMemo(
    () => ({
      status,
      error,
      chunks,
      inputDevices,
      activeTrack,
      recordingStartedAt,
      elapsedMs,
      startRecording,
      stopRecording,
      refreshDevices,
    }),
    [
      activeTrack,
      chunks,
      elapsedMs,
      error,
      inputDevices,
      recordingStartedAt,
      refreshDevices,
      startRecording,
      status,
      stopRecording,
    ],
  );
}

function toActiveAudioTrack(track: MediaStreamTrack): ActiveAudioTrack {
  const settings = track.getSettings();
  const activeTrack: ActiveAudioTrack = {
    label: track.label || 'Unknown audio input',
  };

  if (settings.deviceId) activeTrack.deviceId = settings.deviceId;
  if (settings.groupId) activeTrack.groupId = settings.groupId;
  if (settings.sampleRate) activeTrack.sampleRate = settings.sampleRate;
  if (settings.channelCount) activeTrack.channelCount = settings.channelCount;
  if (settings.echoCancellation !== undefined) activeTrack.echoCancellation = settings.echoCancellation;
  if (settings.noiseSuppression !== undefined) activeTrack.noiseSuppression = settings.noiseSuppression;
  if (settings.autoGainControl !== undefined) activeTrack.autoGainControl = settings.autoGainControl;

  return activeTrack;
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

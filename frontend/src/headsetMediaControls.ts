import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type HeadsetMediaControlStatus = 'disabled' | 'unsupported' | 'idle' | 'arming' | 'armed' | 'error';

export type HeadsetMediaControlState = {
  status: HeadsetMediaControlStatus;
  error: string | null;
  lastAction: string | null;
  supportedActions: string[];
  arm(): Promise<void>;
};

type MediaLoop = {
  context: AudioContext;
  oscillator: OscillatorNode;
  audio: HTMLAudioElement;
};

const MEDIA_ACTIONS = [
  'play',
  'pause',
  'stop',
  'previoustrack',
  'nexttrack',
  'togglemicrophone',
] as const;

export function useHeadsetMediaControls(
  enabled: boolean,
  recording: boolean,
  onToggleRecording: () => void,
): HeadsetMediaControlState {
  const [status, setStatus] = useState<HeadsetMediaControlStatus>(enabled ? 'idle' : 'disabled');
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [supportedActions, setSupportedActions] = useState<string[]>([]);
  const mediaLoopRef = useRef<MediaLoop | null>(null);
  const onToggleRecordingRef = useRef(onToggleRecording);

  useEffect(() => {
    onToggleRecordingRef.current = onToggleRecording;
  }, [onToggleRecording]);

  const stopMediaLoop = useCallback(() => {
    const mediaLoop = mediaLoopRef.current;
    mediaLoopRef.current = null;
    if (!mediaLoop) return;

    mediaLoop.audio.pause();
    mediaLoop.audio.srcObject = null;
    mediaLoop.oscillator.stop();
    void mediaLoop.context.close();
  }, []);

  const arm = useCallback(async () => {
    if (!enabled) return;

    if (!('mediaSession' in navigator)) {
      setStatus('unsupported');
      setError('Media Session is not supported in this browser');
      return;
    }

    if (mediaLoopRef.current) {
      setStatus('armed');
      return;
    }

    setStatus('arming');
    setError(null);

    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      const audio = new Audio();

      oscillator.frequency.value = 30;
      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start();

      audio.srcObject = destination.stream;
      audio.loop = true;
      audio.setAttribute('playsinline', '');

      await context.resume();
      await audio.play();

      mediaLoopRef.current = { context, oscillator, audio };
      navigator.mediaSession.playbackState = 'playing';
      setStatus('armed');
    } catch (err: unknown) {
      stopMediaLoop();
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to arm headset media controls');
    }
  }, [enabled, recording, stopMediaLoop]);

  useEffect(() => {
    if (!enabled) {
      setStatus('disabled');
      setError(null);
      setLastAction(null);
      setSupportedActions([]);
      stopMediaLoop();
      return;
    }

    if (!('mediaSession' in navigator)) {
      setStatus('unsupported');
      setError('Media Session is not supported in this browser');
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Continuum capture',
      artist: 'Peter',
      album: 'Headset experiment',
    });

    const enabledActions: string[] = [];

    for (const action of MEDIA_ACTIONS) {
      try {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, () => {
          setLastAction(action);
          onToggleRecordingRef.current();
          if (mediaLoopRef.current) {
            void mediaLoopRef.current.context.resume();
            void mediaLoopRef.current.audio.play();
          }
        });
        enabledActions.push(action);
      } catch {
        // Some Chromium builds expose only the older media actions.
      }
    }

    setSupportedActions(enabledActions);
    setStatus((current) => current === 'disabled' ? 'idle' : current);

    return () => {
      for (const action of enabledActions) {
        try {
          navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
        } catch {
          // Best-effort cleanup for experimental browser APIs.
        }
      }
      navigator.mediaSession.playbackState = 'none';
      stopMediaLoop();
    };
  }, [enabled, stopMediaLoop]);

  useEffect(() => {
    if (!enabled || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = recording ? 'playing' : 'paused';
  }, [enabled, recording]);

  return useMemo(
    () => ({
      status,
      error,
      lastAction,
      supportedActions,
      arm,
    }),
    [arm, error, lastAction, status, supportedActions],
  );
}

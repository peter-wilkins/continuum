import { useCallback, useEffect, useMemo, useState } from 'react';

export type NativeShellEvent = {
  action: string;
  receivedAt: string;
  source: 'global' | 'event';
};

export type NativeShellBridgeState = {
  eventCount: number;
  lastEvent: NativeShellEvent | null;
  installed: boolean;
};

declare global {
  interface Window {
    ContinuumNativeBridge?: {
      mediaButton(action?: string): void;
    };
  }
}

const NATIVE_MEDIA_BUTTON_EVENT = 'continuum:native-media-button';

export function useNativeShellBridge(onMediaButton: (action: string) => void): NativeShellBridgeState {
  const [eventCount, setEventCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<NativeShellEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const recordNativeEvent = useCallback((action: string, source: NativeShellEvent['source']) => {
    const event = {
      action,
      receivedAt: new Date().toISOString(),
      source,
    };

    setLastEvent(event);
    setEventCount((current) => current + 1);
    onMediaButton(action);
  }, [onMediaButton]);

  useEffect(() => {
    window.ContinuumNativeBridge = {
      mediaButton(action = 'media-button') {
        recordNativeEvent(action, 'global');
      },
    };
    setInstalled(true);

    function handleEvent(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : null;
      const action = typeof detail?.action === 'string' ? detail.action : 'media-button';
      recordNativeEvent(action, 'event');
    }

    window.addEventListener(NATIVE_MEDIA_BUTTON_EVENT, handleEvent);

    return () => {
      if (window.ContinuumNativeBridge?.mediaButton) {
        delete window.ContinuumNativeBridge;
      }
      window.removeEventListener(NATIVE_MEDIA_BUTTON_EVENT, handleEvent);
      setInstalled(false);
    };
  }, [recordNativeEvent]);

  return useMemo(
    () => ({
      eventCount,
      lastEvent,
      installed,
    }),
    [eventCount, installed, lastEvent],
  );
}

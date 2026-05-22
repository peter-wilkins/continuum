import {
  CreateEventResponseSchema,
  EventsListResponseSchema,
  LocalSourceCacheSummaryResponseSchema,
  LocalSourceCacheTimelineResponseSchema,
  type CreateEventRequest,
  TranscriptionResponseSchema,
  type ContinuumEvent,
  type LocalSourceCacheEvent,
  type LocalSourceCacheSummaryResponse,
  type TranscriptionResponse,
} from '@continuum/shared';
import type { Session } from '@supabase/supabase-js';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchEvents(session: Session): Promise<ContinuumEvent[]> {
  const response = await fetch(`${API_URL}/api/events`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load events');
  }

  const parsed = EventsListResponseSchema.parse(await response.json());
  return parsed.events;
}

export async function createEvent(
  session: Session,
  event: CreateEventRequest,
): Promise<ContinuumEvent> {
  const response = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Failed to save event');
  }

  const parsed = CreateEventResponseSchema.parse(await response.json());
  return parsed.event;
}

export async function transcribeAudio(
  session: Session,
  audioBlob: Blob,
  durationMs: number,
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, `speech-${Date.now()}.webm`);

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Audio-Duration-Ms': String(Math.round(durationMs)),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  return TranscriptionResponseSchema.parse(await response.json());
}

export async function fetchLocalSourceCacheSummary(
  session: Session,
): Promise<LocalSourceCacheSummaryResponse> {
  const response = await fetch(`${API_URL}/api/local-source-cache/summary`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load local source cache summary');
  }

  return LocalSourceCacheSummaryResponseSchema.parse(await response.json());
}

export async function fetchLocalSourceCacheEvents(
  session: Session,
  limit = 12,
): Promise<LocalSourceCacheEvent[]> {
  const response = await fetch(`${API_URL}/api/local-source-cache/events?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load local source cache events');
  }

  const parsed = LocalSourceCacheTimelineResponseSchema.parse(await response.json());
  return parsed.events;
}

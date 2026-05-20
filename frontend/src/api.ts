import {
  EventsListResponseSchema,
  TranscriptionResponseSchema,
  type ContinuumEvent,
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

export async function transcribeAudio(session: Session, audioBlob: Blob): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, `speech-${Date.now()}.webm`);

  const response = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  return TranscriptionResponseSchema.parse(await response.json());
}

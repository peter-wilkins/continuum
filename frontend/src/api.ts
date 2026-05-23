import {
  CreateEventResponseSchema,
  EventsListResponseSchema,
  LocalImportPreviewSummariesResponseSchema,
  PublicContinuumResponseSchema,
  PublicConciergeRunResponseSchema,
  DevopsFeedbackResponseSchema,
  PublicLensFeedbackResponseSchema,
  PublicLensFeedbackSummarySchema,
  LocalSourceCacheSummaryResponseSchema,
  LocalSourceCacheTimelineResponseSchema,
  type CreateEventRequest,
  type DevopsFeedbackRequest,
  type DevopsFeedbackResponse,
  TranscriptionResponseSchema,
  type ContinuumEvent,
  type LocalImportPreviewSummary,
  type PublicConciergeRunRequest,
  type PublicConciergeRunResponse,
  type PublicContinuumResponse,
  type PublicLensFeedbackRequest,
  type PublicLensFeedbackResponse,
  type PublicLensFeedbackSummary,
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

export async function fetchLocalImportPreviewSummaries(
  session: Session,
): Promise<LocalImportPreviewSummary[]> {
  const response = await fetch(`${API_URL}/api/local-source-cache/previews`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load local import previews');
  }

  const parsed = LocalImportPreviewSummariesResponseSchema.parse(await response.json());
  return parsed.previews;
}

export async function fetchPublicContinuum(
  targetId: string,
  options: { question?: string | null } = {},
): Promise<PublicContinuumResponse> {
  const search = new URLSearchParams();
  if (options.question) {
    search.set('question', options.question);
  }
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  const response = await fetch(`${API_URL}/api/public-continuum/${targetId}${suffix}`);

  if (!response.ok) {
    throw new Error('Failed to load public Continuum');
  }

  return PublicContinuumResponseSchema.parse(await response.json());
}

export async function fetchPublicLensFeedbackSummary(
  targetId: string,
): Promise<PublicLensFeedbackSummary> {
  const response = await fetch(`${API_URL}/api/public-continuum/${targetId}/feedback-summary`);

  if (!response.ok) {
    throw new Error('Failed to load Lens feedback summary');
  }

  return PublicLensFeedbackSummarySchema.parse(await response.json());
}

export async function submitPublicConciergeRun(
  targetId: string,
  run: PublicConciergeRunRequest,
): Promise<PublicConciergeRunResponse> {
  const response = await fetch(`${API_URL}/api/public-continuum/${targetId}/concierge-runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(run),
  });

  if (!response.ok) {
    throw new Error('Failed to record Chairman reply');
  }

  return PublicConciergeRunResponseSchema.parse(await response.json());
}

export async function submitPublicLensFeedback(
  targetId: string,
  session: Session,
  feedback: PublicLensFeedbackRequest,
): Promise<PublicLensFeedbackResponse> {
  const response = await fetch(`${API_URL}/api/public-continuum/${targetId}/feedback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to record Lens feedback');
  }

  return PublicLensFeedbackResponseSchema.parse(await response.json());
}

export async function submitDevopsFeedback(
  feedback: DevopsFeedbackRequest,
): Promise<DevopsFeedbackResponse> {
  const response = await fetch(`${API_URL}/api/devops-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to send feedback');
  }

  return DevopsFeedbackResponseSchema.parse(await response.json());
}

import {
  EventsListResponseSchema,
  type ContinuumEvent,
} from '@continuum/shared';
import type { Session } from '@supabase/supabase-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

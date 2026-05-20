import {
  EventsListResponseSchema,
  type ContinuumEvent,
} from '@continuum/shared';
import type { Session } from '@supabase/supabase-js';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const http = axios.create({
  baseURL: API_URL,
});

export async function fetchEvents(session: Session): Promise<ContinuumEvent[]> {
  const response = await http.get('/api/events', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const parsed = EventsListResponseSchema.parse(response.data);
  return parsed.events;
}

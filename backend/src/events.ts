import type { FastifyInstance } from 'fastify';
import {
  CreateEventRequestSchema,
  ContinuumEventSchema,
  type ContinuumEvent,
} from '@continuum/shared';
import { requireAuth } from './auth.js';
import { supabaseAdmin } from './supabase.js';

type EventRow = {
  id: string;
  user_id: string;
  source: string;
  transcript: string;
  client_created_at: string;
  server_created_at: string;
  metadata: Record<string, unknown>;
};

function mapRow(row: EventRow): ContinuumEvent {
  return ContinuumEventSchema.parse({
    id: row.id,
    userId: row.user_id,
    source: row.source,
    transcript: row.transcript,
    clientCreatedAt: row.client_created_at,
    serverCreatedAt: row.server_created_at,
    metadata: row.metadata,
  });
}

export async function registerEventRoutes(app: FastifyInstance) {
  app.get('/api/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const { data, error } = await supabaseAdmin
      .schema('continuum')
      .from('events')
      .select('id,user_id,source,transcript,client_created_at,server_created_at,metadata')
      .eq('user_id', user.id)
      .order('server_created_at', { ascending: false })
      .limit(100);

    if (error) {
      request.log.error(error);
      await reply.status(500).send({ error: 'Failed to load events' });
      return;
    }

    return { events: (data as EventRow[]).map(mapRow) };
  });

  app.post('/api/events', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const parsed = CreateEventRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid event payload' });
      return;
    }

    const input = parsed.data;
    const { data, error } = await supabaseAdmin
      .schema('continuum')
      .from('events')
      .insert({
        user_id: user.id,
        source: input.source ?? 'speech',
        transcript: input.transcript,
        client_created_at: input.clientCreatedAt,
        metadata: input.metadata ?? {},
      })
      .select('id,user_id,source,transcript,client_created_at,server_created_at,metadata')
      .single();

    if (error) {
      request.log.error(error);
      await reply.status(500).send({ error: 'Failed to save event' });
      return;
    }

    return reply.status(201).send({ event: mapRow(data as EventRow) });
  });
}

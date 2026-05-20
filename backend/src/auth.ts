import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';

export type AuthUser = {
  id: string;
  email?: string;
};

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    await reply.status(401).send({ error: 'Authorization required' });
    return null;
  }

  const token = header.slice('Bearer '.length);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    await reply.status(401).send({ error: 'Invalid or expired token' });
    return null;
  }

  const email = data.user.email?.toLowerCase();
  if (env.ALLOWED_EMAILS.length > 0 && (!email || !env.ALLOWED_EMAILS.includes(email))) {
    await reply.status(403).send({ error: 'Account is not allowed' });
    return null;
  }

  return data.user.email
    ? { id: data.user.id, email: data.user.email }
    : { id: data.user.id };
}

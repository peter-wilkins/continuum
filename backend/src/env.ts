import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_TRANSCRIPTION_MODEL: z.enum(['whisper-1', 'gpt-4o-mini-transcribe']).default('whisper-1'),
  OPENAI_TRANSCRIPTION_LANGUAGE: z.string().min(2).default('en'),
  OPENAI_TRANSCRIPTION_USD_PER_MINUTE: z.coerce.number().positive().default(0.006),
  DAILY_TRANSCRIPTION_BUDGET_USD: z.coerce.number().positive().default(1),
  ALLOWED_EMAILS: z.string().default(''),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(3000),
  WORKFLOW_MANAGER_BRIDGE_URL: z.string().url().default('http://127.0.0.1:8787'),
  WORKFLOW_MANAGER_BRIDGE_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  ALLOWED_EMAILS: parsed.ALLOWED_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

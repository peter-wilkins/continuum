import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';

export type TranscriptionUsageEstimate = {
  durationMs: number;
  billedSeconds: number;
  estimatedCostUsd: number;
};

export type TranscriptionUsageRecord = TranscriptionUsageEstimate & {
  userId: string;
  model: string;
  language: string;
  audioSizeBytes: number;
  metadata?: Record<string, unknown>;
};

const MAX_RECORDED_DURATION_MS = 30 * 60 * 1000;

export function parseDurationHeader(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const durationMs = Number.parseInt(raw, 10);
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_RECORDED_DURATION_MS) {
    return null;
  }

  return durationMs;
}

export function estimateTranscriptionUsage(durationMs: number): TranscriptionUsageEstimate {
  const billedSeconds = Math.ceil(durationMs / 1000);
  const estimatedCostUsd = roundUsd((billedSeconds / 60) * env.OPENAI_TRANSCRIPTION_USD_PER_MINUTE);

  return {
    durationMs,
    billedSeconds,
    estimatedCostUsd,
  };
}

export async function assertDailyTranscriptionBudget(
  userId: string,
  nextCostUsd: number,
): Promise<{ spentTodayUsd: number; remainingTodayUsd: number }> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .schema('continuum')
    .from('transcription_usage')
    .select('estimated_cost_usd')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (error) {
    throw error;
  }

  const spentTodayUsd = roundUsd(
    (data ?? []).reduce((total, row) => total + Number(row.estimated_cost_usd ?? 0), 0),
  );
  const remainingTodayUsd = roundUsd(env.DAILY_TRANSCRIPTION_BUDGET_USD - spentTodayUsd);

  if (spentTodayUsd + nextCostUsd > env.DAILY_TRANSCRIPTION_BUDGET_USD) {
    throw new DailyTranscriptionBudgetExceeded(spentTodayUsd, remainingTodayUsd);
  }

  return { spentTodayUsd, remainingTodayUsd };
}

export async function recordTranscriptionUsage(record: TranscriptionUsageRecord) {
  const { error } = await supabaseAdmin
    .schema('continuum')
    .from('transcription_usage')
    .insert({
      user_id: record.userId,
      model: record.model,
      language: record.language,
      duration_ms: record.durationMs,
      billed_seconds: record.billedSeconds,
      estimated_cost_usd: record.estimatedCostUsd,
      audio_size_bytes: record.audioSizeBytes,
      metadata: record.metadata ?? {},
    });

  if (error) {
    throw error;
  }
}

export class DailyTranscriptionBudgetExceeded extends Error {
  constructor(
    readonly spentTodayUsd: number,
    readonly remainingTodayUsd: number,
  ) {
    super('Daily transcription budget exceeded');
  }
}

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PublicLensFeedbackSignalSchema,
  PublicLensFeedbackSummarySchema,
  type PublicContinuumResponse,
  type PublicLensFeedbackRequest,
  type PublicLensFeedbackSignal,
  type PublicLensFeedbackSummary,
} from '@continuum/shared';

const feedbackLogPath = fileURLToPath(
  new URL('../../data/public-lens-feedback.jsonl', import.meta.url),
);

export function feedbackMatchesContinuum(
  feedback: PublicLensFeedbackRequest,
  continuum: PublicContinuumResponse,
): boolean {
  if (feedback.scopeId !== continuum.scope.id || feedback.queryId !== continuum.query.id) {
    return false;
  }

  const outputIds = continuum.outputs.map((output) => output.id);
  if (feedback.candidateLensOutputIds.length !== outputIds.length) {
    return false;
  }

  return (
    outputIds.every((outputId) => feedback.candidateLensOutputIds.includes(outputId)) &&
    outputIds.includes(feedback.selectedLensOutputId)
  );
}

export async function appendPublicLensFeedback(
  feedback: PublicLensFeedbackSignal,
): Promise<void> {
  await mkdir(dirname(feedbackLogPath), { recursive: true });
  await appendFile(feedbackLogPath, `${JSON.stringify(feedback)}\n`, 'utf8');
}

export async function summarizePublicLensFeedback(
  continuum: PublicContinuumResponse,
): Promise<PublicLensFeedbackSummary> {
  const feedback = await readPublicLensFeedback();
  const counts = new Map(continuum.outputs.map((output) => [output.id, 0]));

  for (const signal of feedback) {
    if (!feedbackMatchesContinuum(signal, continuum)) continue;
    counts.set(signal.selectedLensOutputId, (counts.get(signal.selectedLensOutputId) ?? 0) + 1);
  }

  return PublicLensFeedbackSummarySchema.parse({
    total: [...counts.values()].reduce((total, count) => total + count, 0),
    byLensOutput: continuum.outputs.map((output) => ({
      lensOutputId: output.id,
      count: counts.get(output.id) ?? 0,
    })),
  });
}

async function readPublicLensFeedback(): Promise<PublicLensFeedbackSignal[]> {
  let contents: string;

  try {
    contents = await readFile(feedbackLogPath, 'utf8');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return [];
    }

    throw err;
  }

  const feedback: PublicLensFeedbackSignal[] = [];

  for (const line of contents.split('\n')) {
    if (line.trim().length === 0) continue;

    try {
      const parsed = PublicLensFeedbackSignalSchema.safeParse(JSON.parse(line));
      if (parsed.success) feedback.push(parsed.data);
    } catch {
      continue;
    }
  }

  return feedback;
}

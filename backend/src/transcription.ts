import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import { openai } from './openai.js';

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';
const TRANSCRIPTION_LANGUAGE = 'en';
const COMPARISON_TRANSCRIPTION_MODEL = 'whisper-1';

export async function registerTranscriptionRoutes(app: FastifyInstance) {
  app.post('/api/transcribe', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const file = await request.file({
      limits: {
        fileSize: MAX_AUDIO_BYTES,
        files: 1,
      },
    });

    if (!file) {
      await reply.status(400).send({ error: 'Audio file is required' });
      return;
    }

    const audioBuffer = await file.toBuffer();
    if (audioBuffer.length === 0) {
      await reply.status(400).send({ error: 'Audio file is empty' });
      return;
    }

    try {
      request.log.info({
        mimeType: file.mimetype,
        sizeBytes: audioBuffer.length,
      }, 'transcribing audio chunk');

      const [primaryResult, comparisonResult] = await Promise.allSettled([
        transcribeAudioBuffer({
          audioBuffer,
          filename: file.filename || 'speech.webm',
          mimeType: file.mimetype || 'audio/webm',
          model: TRANSCRIPTION_MODEL,
        }),
        transcribeAudioBuffer({
          audioBuffer,
          filename: file.filename || 'speech.webm',
          mimeType: file.mimetype || 'audio/webm',
          model: COMPARISON_TRANSCRIPTION_MODEL,
        }),
      ]);

      if (primaryResult.status === 'rejected') {
        throw primaryResult.reason;
      }

      const transcript = primaryResult.value.transcript;
      const voiceInstruction = extractVoiceInstruction(transcript);
      const comparisonError = comparisonResult.status === 'rejected'
        ? comparisonResult.reason instanceof Error
          ? comparisonResult.reason.message
          : 'Comparison transcription failed'
        : null;
      const comparisons = [
        primaryResult.value,
        comparisonResult.status === 'fulfilled'
          ? comparisonResult.value
          : {
              model: COMPARISON_TRANSCRIPTION_MODEL,
              language: TRANSCRIPTION_LANGUAGE,
              transcript: '',
              error: comparisonError,
            },
      ];

      request.log.info({
        transcriptLength: transcript.length,
        comparisonTranscriptLength: comparisons[1]?.transcript.length,
        comparisonError,
        voiceInstruction,
      }, 'audio transcription completed');

      return {
        transcript,
        metadata: {
          model: TRANSCRIPTION_MODEL,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: audioBuffer.length,
          language: TRANSCRIPTION_LANGUAGE,
          comparisons,
        },
      };
    } catch (error) {
      request.log.error(error);
      await reply.status(502).send({ error: 'Transcription failed' });
    }
  });
}

type TranscriptionExperiment = {
  audioBuffer: Buffer;
  filename: string;
  mimeType: string;
  model: string;
};

async function transcribeAudioBuffer({
  audioBuffer,
  filename,
  mimeType,
  model,
}: TranscriptionExperiment) {
  const audioArrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength,
  ) as ArrayBuffer;
  const audioFile = new File([audioArrayBuffer], filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file: audioFile,
    model,
    language: TRANSCRIPTION_LANGUAGE,
  });

  return {
    model,
    language: TRANSCRIPTION_LANGUAGE,
    transcript: result.text.trim(),
  };
}

function extractVoiceInstruction(transcript: string) {
  const normalized = transcript.trim();
  if (!/^hi\b/i.test(normalized)) return null;

  return normalized.replace(/^hi\b[:,]?\s*/i, '').trim();
}

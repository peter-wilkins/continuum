import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import { env } from './env.js';
import { openai } from './openai.js';

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

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

      const result = await transcribeAudioBuffer({
        audioBuffer,
        filename: file.filename || 'speech.webm',
        mimeType: file.mimetype || 'audio/webm',
        model: env.OPENAI_TRANSCRIPTION_MODEL,
        language: env.OPENAI_TRANSCRIPTION_LANGUAGE,
      });
      const transcript = result.transcript;
      const voiceInstruction = extractVoiceInstruction(transcript);

      request.log.info({
        transcriptLength: transcript.length,
        model: result.model,
        language: result.language,
        voiceInstruction,
      }, 'audio transcription completed');

      return {
        transcript,
        metadata: {
          model: result.model,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: audioBuffer.length,
          language: result.language,
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
  language: string;
};

async function transcribeAudioBuffer({
  audioBuffer,
  filename,
  mimeType,
  model,
  language,
}: TranscriptionExperiment) {
  const audioArrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength,
  ) as ArrayBuffer;
  const audioFile = new File([audioArrayBuffer], filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    file: audioFile,
    model,
    language,
  });

  return {
    model,
    language,
    transcript: result.text.trim(),
  };
}

function extractVoiceInstruction(transcript: string) {
  const normalized = transcript.trim();
  if (!/^hi\b/i.test(normalized)) return null;

  return normalized.replace(/^hi\b[:,]?\s*/i, '').trim();
}

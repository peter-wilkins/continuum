import type { FastifyInstance } from 'fastify';
import { requireAuth } from './auth.js';
import { openai } from './openai.js';

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

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
      const audioArrayBuffer = audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength,
      ) as ArrayBuffer;
      const audioFile = new File([audioArrayBuffer], file.filename || 'speech.webm', {
        type: file.mimetype || 'audio/webm',
      });

      const result = await openai.audio.transcriptions.create({
        file: audioFile,
        model: TRANSCRIPTION_MODEL,
      });

      return {
        transcript: result.text.trim(),
        metadata: {
          model: TRANSCRIPTION_MODEL,
          filename: file.filename,
          mimeType: file.mimetype,
          sizeBytes: audioBuffer.length,
        },
      };
    } catch (error) {
      request.log.error(error);
      await reply.status(502).send({ error: 'Transcription failed' });
    }
  });
}

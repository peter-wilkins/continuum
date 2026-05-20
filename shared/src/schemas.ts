import { z } from 'zod';

export const EventMetadataSchema = z.record(z.unknown()).default({});

export const EventSourceSchema = z.string().trim().min(1).default('speech');
export const EventDateTimeSchema = z.string().datetime({ offset: true });

export const ContinuumEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  source: EventSourceSchema,
  transcript: z.string().trim().min(1),
  clientCreatedAt: EventDateTimeSchema,
  serverCreatedAt: EventDateTimeSchema,
  metadata: EventMetadataSchema,
});

export const CreateEventRequestSchema = z.object({
  source: EventSourceSchema.optional(),
  transcript: z.string().trim().min(1),
  clientCreatedAt: EventDateTimeSchema,
  metadata: EventMetadataSchema.optional(),
});

export const EventsListResponseSchema = z.object({
  events: z.array(ContinuumEventSchema),
});

export const CreateEventResponseSchema = z.object({
  event: ContinuumEventSchema,
});

export const TranscriptionResponseSchema = z.object({
  transcript: z.string(),
  metadata: z.record(z.unknown()).default({}),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;
export type ContinuumEvent = z.infer<typeof ContinuumEventSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type EventsListResponse = z.infer<typeof EventsListResponseSchema>;
export type CreateEventResponse = z.infer<typeof CreateEventResponseSchema>;
export type TranscriptionResponse = z.infer<typeof TranscriptionResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

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

export const LocalSourceCacheEventSchema = z.object({
  id: z.string().min(1),
  sourcePlatform: z.string().min(1),
  sourceName: z.string().min(1),
  sourceKey: z.string().min(1),
  externalConversationId: z.string().min(1),
  externalMessageId: z.string().min(1),
  createdAt: EventDateTimeSchema,
  createdAtConfidence: z.string().min(1),
  ingestedAt: EventDateTimeSchema,
  actorRole: z.string().min(1),
  subject: z.string().nullable(),
  text: z.string(),
  eventJson: z.string().min(1),
});

export const LocalSourceCacheImportRequestSchema = z.object({
  jsonl: z.string(),
  batchName: z.string().trim().min(1).optional(),
});

export const LocalSourceCacheImportResponseSchema = z.object({
  batch: z.object({
    id: z.string().min(1),
    sourceName: z.string().nullable(),
    importStartedAt: EventDateTimeSchema,
    importFinishedAt: EventDateTimeSchema,
    totalRows: z.number().int().nonnegative(),
    importedRows: z.number().int().nonnegative(),
    quarantinedRows: z.number().int().nonnegative(),
  }),
});

export const LocalSourceCacheTimelineResponseSchema = z.object({
  events: z.array(LocalSourceCacheEventSchema),
});

export const LocalSourceCacheDetailResponseSchema = z.object({
  event: LocalSourceCacheEventSchema,
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
export type LocalSourceCacheEvent = z.infer<typeof LocalSourceCacheEventSchema>;
export type LocalSourceCacheImportRequest = z.infer<typeof LocalSourceCacheImportRequestSchema>;
export type LocalSourceCacheImportResponse = z.infer<typeof LocalSourceCacheImportResponseSchema>;
export type LocalSourceCacheTimelineResponse = z.infer<typeof LocalSourceCacheTimelineResponseSchema>;
export type LocalSourceCacheDetailResponse = z.infer<typeof LocalSourceCacheDetailResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

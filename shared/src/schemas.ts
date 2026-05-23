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

export const ImportFilterDecisionSchema = z.object({
  action: z.enum(['include', 'exclude', 'needs_review']),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const ImportFilterSummarySchema = z.object({
  included: z.number().int().nonnegative(),
  excluded: z.number().int().nonnegative(),
  needsReview: z.number().int().nonnegative(),
  reasons: z.record(z.number().int().nonnegative()),
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
  filterDecision: ImportFilterDecisionSchema,
  memoryActive: z.boolean(),
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

export const LocalSourceCacheSummaryResponseSchema = z.object({
  totalEvents: z.number().int().nonnegative(),
  filterSummary: ImportFilterSummarySchema,
  bySourcePlatform: z.array(z.object({
    sourcePlatform: z.string().min(1),
    totalEvents: z.number().int().nonnegative(),
    included: z.number().int().nonnegative(),
    excluded: z.number().int().nonnegative(),
    needsReview: z.number().int().nonnegative(),
  })),
});

export const LocalImportPreviewSummarySchema = z.object({
  filename: z.string().min(1),
  sourcePlatform: z.string().min(1),
  recordsSeen: z.number().int().nonnegative(),
  eventsCreated: z.number().int().nonnegative(),
  quarantined: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  filterSummary: ImportFilterSummarySchema,
});

export const LocalImportPreviewSummariesResponseSchema = z.object({
  previews: z.array(LocalImportPreviewSummarySchema),
});

export const PublicContinuumEventSchema = z.object({
  id: z.string().min(1),
  sourceName: z.string().min(1),
  sourceFamily: z.string().min(1),
  sourceUrl: z.string().url().nullable(),
  subject: z.string().nullable(),
  text: z.string(),
  license: z.string().nullable(),
});

export const PublicContinuumLensDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  userBlurb: z.string().min(1),
  technicalBlurb: z.string().min(1),
});

export const PublicContinuumLensOutputSchema = z.object({
  id: z.string().min(1),
  lensId: z.string().min(1),
  lensVersion: z.string().min(1),
  thoughtCardIds: z.array(z.string().min(1)),
  sections: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    eventIds: z.array(z.string().min(1)),
  })),
});

export const PublicContinuumSourceParagraphSchema = z.object({
  id: z.string().min(1),
  canonicalEventId: z.string().min(1),
  title: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  license: z.string().min(1),
  paragraphIndex: z.number().int().nonnegative(),
});

export const PublicContinuumThoughtCardSchema = z.object({
  id: z.string().min(1),
  lensOutputId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  sourceParagraphIds: z.array(z.string().min(1)).min(1),
});

export const PublicContinuumResponseSchema = z.object({
  scope: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    primaryLabel: z.string().min(1),
    focusLabel: z.string().nullable(),
  }),
  query: z.object({
    id: z.string().min(1),
    text: z.string().min(1),
  }),
  events: z.array(PublicContinuumEventSchema),
  sourceParagraphs: z.array(PublicContinuumSourceParagraphSchema),
  thoughtCards: z.array(PublicContinuumThoughtCardSchema),
  lenses: z.array(PublicContinuumLensDefinitionSchema),
  outputs: z.array(PublicContinuumLensOutputSchema),
});

export const PublicLensFeedbackRequestSchema = z.object({
  scopeId: z.string().min(1),
  queryId: z.string().min(1),
  selectedLensOutputId: z.string().min(1),
  candidateLensOutputIds: z.array(z.string().min(1)).min(1),
});

export const PublicLensFeedbackSignalSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  scopeId: z.string().min(1),
  queryId: z.string().min(1),
  selectedLensOutputId: z.string().min(1),
  candidateLensOutputIds: z.array(z.string().min(1)).min(1),
  signal: z.literal('preferred'),
  createdAt: EventDateTimeSchema,
});

export const PublicLensFeedbackResponseSchema = z.object({
  feedback: PublicLensFeedbackSignalSchema,
});

export const PublicLensFeedbackSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byLensOutput: z.array(z.object({
    lensOutputId: z.string().min(1),
    count: z.number().int().nonnegative(),
  })),
});

export const DevopsFeedbackKindSchema = z.enum([
  'bug',
  'confusing',
  'improvement',
  'content',
  'small_fix',
  'other',
]);

export const DevopsFeedbackContextSchema = z.object({
  targetId: z.string().min(1),
  scopeId: z.string().min(1).nullable(),
  queryId: z.string().min(1).nullable(),
  queryText: z.string().min(1).nullable(),
  lensOutputId: z.string().min(1).nullable(),
  path: z.string().min(1).max(500),
  gitHash: z.string().min(1).max(80),
  authStatus: z.enum(['loading', 'logged_in', 'logged_out']),
  userAgent: z.string().min(1).max(500),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

export const DevopsFeedbackRequestSchema = z.object({
  kind: DevopsFeedbackKindSchema,
  message: z.string().trim().min(1).max(4000),
  smallFix: z.boolean(),
  context: DevopsFeedbackContextSchema,
});

export const DevopsFeedbackResponseSchema = z.object({
  messageId: z.string().min(1),
  queuedAt: EventDateTimeSchema,
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
export type ImportFilterDecision = z.infer<typeof ImportFilterDecisionSchema>;
export type ImportFilterSummary = z.infer<typeof ImportFilterSummarySchema>;
export type LocalSourceCacheEvent = z.infer<typeof LocalSourceCacheEventSchema>;
export type LocalSourceCacheImportRequest = z.infer<typeof LocalSourceCacheImportRequestSchema>;
export type LocalSourceCacheImportResponse = z.infer<typeof LocalSourceCacheImportResponseSchema>;
export type LocalSourceCacheTimelineResponse = z.infer<typeof LocalSourceCacheTimelineResponseSchema>;
export type LocalSourceCacheDetailResponse = z.infer<typeof LocalSourceCacheDetailResponseSchema>;
export type LocalSourceCacheSummaryResponse = z.infer<typeof LocalSourceCacheSummaryResponseSchema>;
export type LocalImportPreviewSummary = z.infer<typeof LocalImportPreviewSummarySchema>;
export type LocalImportPreviewSummariesResponse = z.infer<typeof LocalImportPreviewSummariesResponseSchema>;
export type PublicContinuumEvent = z.infer<typeof PublicContinuumEventSchema>;
export type PublicContinuumLensDefinition = z.infer<typeof PublicContinuumLensDefinitionSchema>;
export type PublicContinuumLensOutput = z.infer<typeof PublicContinuumLensOutputSchema>;
export type PublicContinuumSourceParagraph = z.infer<typeof PublicContinuumSourceParagraphSchema>;
export type PublicContinuumThoughtCard = z.infer<typeof PublicContinuumThoughtCardSchema>;
export type PublicContinuumResponse = z.infer<typeof PublicContinuumResponseSchema>;
export type PublicLensFeedbackRequest = z.infer<typeof PublicLensFeedbackRequestSchema>;
export type PublicLensFeedbackSignal = z.infer<typeof PublicLensFeedbackSignalSchema>;
export type PublicLensFeedbackResponse = z.infer<typeof PublicLensFeedbackResponseSchema>;
export type PublicLensFeedbackSummary = z.infer<typeof PublicLensFeedbackSummarySchema>;
export type DevopsFeedbackKind = z.infer<typeof DevopsFeedbackKindSchema>;
export type DevopsFeedbackContext = z.infer<typeof DevopsFeedbackContextSchema>;
export type DevopsFeedbackRequest = z.infer<typeof DevopsFeedbackRequestSchema>;
export type DevopsFeedbackResponse = z.infer<typeof DevopsFeedbackResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

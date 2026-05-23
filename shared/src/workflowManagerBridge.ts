import { z } from 'zod';

import { EventDateTimeSchema } from './schemas.js';

export const WorkflowManagerPhoneInboxSchemaVersionSchema = z.literal(
  'workflow-manager.phone-inbox-message.v1',
);

export const WorkflowManagerPhoneOutboxSchemaVersionSchema = z.literal(
  'workflow-manager.phone-outbox-message.v1',
);

export const WorkflowManagerPhoneJourneyStateSchemaVersionSchema = z.literal(
  'workflow-manager.phone-journey-state.v1',
);

export const WorkflowManagerBridgeSourceSchema = z.enum([
  'android',
  'android-network',
  'web',
  'cli',
]);

export const WorkflowManagerBridgePrivacySchema = z.literal('local_only');

export const WorkflowManagerBridgeInboxEventTypeSchema = z.enum([
  'user_message',
  'control_signal',
]);

export const WorkflowManagerBridgeInputModeSchema = z.enum([
  'text',
  'control_button',
]);

export const WorkflowManagerBridgeControlSchema = z.enum([
  'plus',
  'minus',
  'split',
  'facepalm',
  'skip_journey',
]);

export const WorkflowManagerBridgeMembraneSchema = z.enum([
  'personal',
  'team',
  'public',
  'dev',
]);

export const WorkflowManagerBridgeIntentSchema = z.enum([
  'message',
  'agree',
  'approve',
  'command-request',
  'capture',
  'status',
  'control',
]);

export const WorkflowManagerBridgeRouteEnvelopeSchema = z.object({
  sender: z.string().min(1),
  membrane: WorkflowManagerBridgeMembraneSchema,
  target: z.string().min(1),
  journeyId: z.string().min(1),
  intent: WorkflowManagerBridgeIntentSchema,
});

export const WorkflowManagerBridgeDeliveryPlanSchema = z.object({
  destinationType: z.string().min(1),
  sessionName: z.string().min(1),
  action: z.string().min(1),
});

export const WorkflowManagerBridgePolicyStepSchema = z.enum([
  'capture_raw',
  'attach_identity',
  'apply_frontend_preferences',
  'rewrite_with_dictionary',
  'check_confidence',
  'resolve_route',
  'deliver_to_destination',
  'project_response',
]);

export const WorkflowManagerBridgePolicyChainV0 = [
  'capture_raw',
  'attach_identity',
  'apply_frontend_preferences',
  'rewrite_with_dictionary',
  'check_confidence',
  'resolve_route',
  'deliver_to_destination',
  'project_response',
] as const satisfies readonly z.infer<typeof WorkflowManagerBridgePolicyStepSchema>[];

const RoutableBridgeFieldsSchema = z.object({
  membrane: WorkflowManagerBridgeMembraneSchema.optional(),
  target: z.string().min(1).optional(),
  intent: WorkflowManagerBridgeIntentSchema.optional(),
});

const PhoneInboxBaseSchema = z.object({
  schemaVersion: WorkflowManagerPhoneInboxSchemaVersionSchema,
  eventId: z.string().min(1),
  createdAt: EventDateTimeSchema,
  source: WorkflowManagerBridgeSourceSchema,
  deviceId: z.string().min(1),
  userId: z.string().min(1),
  journeyId: z.string().min(1),
  body: z.string().min(1),
  clientMessageId: z.string().min(1),
  privacy: WorkflowManagerBridgePrivacySchema,
}).merge(RoutableBridgeFieldsSchema);

export const WorkflowManagerPhoneUserMessageEventSchema = PhoneInboxBaseSchema.extend({
  eventType: z.literal('user_message'),
  inputMode: z.literal('text'),
});

export const WorkflowManagerPhoneControlSignalEventSchema = PhoneInboxBaseSchema.extend({
  eventType: z.literal('control_signal'),
  inputMode: z.literal('control_button'),
  control: WorkflowManagerBridgeControlSchema,
});

export const WorkflowManagerPhoneInboxEventSchema = z.discriminatedUnion('eventType', [
  WorkflowManagerPhoneUserMessageEventSchema,
  WorkflowManagerPhoneControlSignalEventSchema,
]);

export const WorkflowManagerPhoneOutboxEventTypeSchema = z.enum([
  'assistant_message',
  'progress_update',
  'blocked',
  'summary_published',
  'chairman_delivery',
]);

export const WorkflowManagerPhoneOutboxLevelSchema = z.enum([
  'info',
  'success',
  'warning',
  'blocked',
  'error',
]);

export const WorkflowManagerPhoneOutboxDisplayModeSchema = z.literal('journey_detail');

// This is an external JSON boundary. Optional fields mirror the Workflow Manager
// append-only log; Continuum should normalize before storing any internal state.
export const WorkflowManagerPhoneOutboxEventSchema = z.object({
  schemaVersion: WorkflowManagerPhoneOutboxSchemaVersionSchema,
  eventId: z.string().min(1),
  createdAt: EventDateTimeSchema,
  journeyId: z.string().min(1),
  agentId: z.string().min(1),
  eventType: WorkflowManagerPhoneOutboxEventTypeSchema,
  level: WorkflowManagerPhoneOutboxLevelSchema,
  displayMode: WorkflowManagerPhoneOutboxDisplayModeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  phoneVisible: z.boolean(),
  inReplyToEventId: z.string().min(1).optional(),
  suggestedNextStep: z.string().optional(),
  workId: z.string().min(1).optional(),
  metrics: z.record(z.unknown()).optional(),
  artifacts: z.array(z.unknown()).optional(),
  progress: z.number().min(0).max(1).optional(),
  sequence: z.number().int().positive().optional(),
});

export const WorkflowManagerPhoneJourneyStatusSchema = z.enum([
  'active',
  'idle',
  'blocked',
  'completed',
]);

export const WorkflowManagerPhoneJourneyRecentEventSchema = z.object({
  eventId: z.string().min(1),
  createdAt: EventDateTimeSchema,
  role: z.enum(['user', 'assistant']),
  label: z.string().min(1),
  body: z.string().min(1),
  pending: z.boolean(),
  inReplyToEventId: z.string().min(1).optional(),
});

export const WorkflowManagerPhoneJourneyStateSchema = z.object({
  schemaVersion: WorkflowManagerPhoneJourneyStateSchemaVersionSchema,
  generatedAt: EventDateTimeSchema,
  currentJourneyId: z.string().min(1),
  currentJourneyTitle: z.string().min(1),
  status: WorkflowManagerPhoneJourneyStatusSchema,
  progress: z.number().min(0).max(1),
  progressLabel: z.string(),
  latestOutboxEventId: z.string().min(1).optional(),
  latestBody: z.string(),
  suggestedNextStep: z.string(),
  pendingBody: z.string().min(1).optional(),
  pendingEventId: z.string().min(1).optional(),
  recentEvents: z.array(WorkflowManagerPhoneJourneyRecentEventSchema).optional(),
});

export type WorkflowManagerBridgeSource = z.infer<typeof WorkflowManagerBridgeSourceSchema>;
export type WorkflowManagerBridgePrivacy = z.infer<typeof WorkflowManagerBridgePrivacySchema>;
export type WorkflowManagerBridgeInboxEventType = z.infer<typeof WorkflowManagerBridgeInboxEventTypeSchema>;
export type WorkflowManagerBridgeInputMode = z.infer<typeof WorkflowManagerBridgeInputModeSchema>;
export type WorkflowManagerBridgeControl = z.infer<typeof WorkflowManagerBridgeControlSchema>;
export type WorkflowManagerBridgeMembrane = z.infer<typeof WorkflowManagerBridgeMembraneSchema>;
export type WorkflowManagerBridgeIntent = z.infer<typeof WorkflowManagerBridgeIntentSchema>;
export type WorkflowManagerBridgeRouteEnvelope = z.infer<typeof WorkflowManagerBridgeRouteEnvelopeSchema>;
export type WorkflowManagerBridgeDeliveryPlan = z.infer<typeof WorkflowManagerBridgeDeliveryPlanSchema>;
export type WorkflowManagerBridgePolicyStep = z.infer<typeof WorkflowManagerBridgePolicyStepSchema>;
export type WorkflowManagerPhoneUserMessageEvent = z.infer<typeof WorkflowManagerPhoneUserMessageEventSchema>;
export type WorkflowManagerPhoneControlSignalEvent = z.infer<typeof WorkflowManagerPhoneControlSignalEventSchema>;
export type WorkflowManagerPhoneInboxEvent = z.infer<typeof WorkflowManagerPhoneInboxEventSchema>;
export type WorkflowManagerPhoneOutboxEventType = z.infer<typeof WorkflowManagerPhoneOutboxEventTypeSchema>;
export type WorkflowManagerPhoneOutboxLevel = z.infer<typeof WorkflowManagerPhoneOutboxLevelSchema>;
export type WorkflowManagerPhoneOutboxEvent = z.infer<typeof WorkflowManagerPhoneOutboxEventSchema>;
export type WorkflowManagerPhoneJourneyStatus = z.infer<typeof WorkflowManagerPhoneJourneyStatusSchema>;
export type WorkflowManagerPhoneJourneyRecentEvent = z.infer<typeof WorkflowManagerPhoneJourneyRecentEventSchema>;
export type WorkflowManagerPhoneJourneyState = z.infer<typeof WorkflowManagerPhoneJourneyStateSchema>;

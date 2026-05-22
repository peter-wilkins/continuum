import { mkdir, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import {
  createLensFeedbackSignal,
  createDefaultPublicLensOutputs,
  createImportScope,
  createPublicContinuumQuery,
  defaultPublicLensDefinitions,
  importScopeTitle,
  normalizePublicDocument,
  normalizeWikidataEntity,
  type PublicDocumentNormalizationInput,
  type WikidataEntityNormalizationInput,
} from '@continuum/core';
import {
  PublicContinuumResponseSchema,
  PublicLensFeedbackRequestSchema,
  PublicLensFeedbackResponseSchema,
  type PublicLensFeedbackRequest,
  type PublicLensFeedbackSignal,
} from '@continuum/shared';
import { requireAuth } from './auth.js';

const feedbackLogPath = fileURLToPath(
  new URL('../../data/public-lens-feedback.jsonl', import.meta.url),
);

const adaScope = createImportScope({
  id: 'scope:ada-lovelace-through-computing',
  primaryEntity: {
    kind: 'person',
    label: 'Ada Lovelace',
    aliases: ['Augusta Ada Byron', 'Ada King'],
    sourceIds: [
      {
        sourceFamily: 'wikimedia',
        id: 'Q7259',
        url: 'https://www.wikidata.org/wiki/Q7259',
      },
    ],
  },
  focusEntity: {
    kind: 'topic',
    label: 'computing',
    aliases: ['Analytical Engine', 'programming'],
    sourceIds: [],
  },
  sourceFamilies: ['wikimedia', 'public_archive'],
  publicness: {
    access: 'public_only',
    licenseIntent: 'respect_source_license',
  },
  provenancePolicy: {
    sourceFamiliesCountAsIndependentEvidence: false,
  },
  createdAt: '2026-05-22T12:00:00.000Z',
});

const adaQuery = createPublicContinuumQuery(adaScope, {
  id: 'query:ada-lovelace-contribution',
  scopeId: adaScope.id,
  text: 'What did Ada Lovelace contribute to early computing?',
  origin: 'system_seed',
  createdAt: '2026-05-22T12:25:00.000Z',
});

const wikidataAda = {
  entities: {
    Q7259: {
      pageid: 8067,
      ns: 0,
      title: 'Q7259',
      lastrevid: 2495481811,
      modified: '2026-05-21T12:08:07Z',
      type: 'item',
      id: 'Q7259',
      labels: {
        en: {
          language: 'en',
          value: 'Ada Lovelace',
        },
      },
      descriptions: {
        en: {
          language: 'en',
          value: 'English mathematician (1815-1852)',
        },
      },
      aliases: {
        en: [
          {
            language: 'en',
            value: 'Lady Ada',
          },
          {
            language: 'en',
            value: 'Augusta Ada Byron',
          },
        ],
      },
      claims: {
        P101: [
          {
            mainsnak: {
              property: 'P101',
              snaktype: 'value',
            },
            rank: 'normal',
          },
        ],
      },
      sitelinks: {
        enwiki: {
          site: 'enwiki',
          title: 'Ada Lovelace',
        },
      },
    },
  },
} satisfies WikidataEntityNormalizationInput;

const analyticalEngineDocument = {
  source: {
    platform: 'public_archive',
    sourceFamily: 'public_archive',
    sourceName: 'project_gutenberg',
    sourceId: '75107',
    sourceUrl: 'https://www.gutenberg.org/files/75107/75107-h/75107-h.htm',
    retrievedAt: '2026-05-22T11:55:00.000Z',
    license: 'Public domain in the USA.',
    upstreamSources: ['scientific_memoirs_volume_3_1843'],
    derivedFrom: [],
  },
  document: {
    title: 'Sketch of the Analytical Engine invented by Charles Babbage, Esq.',
    language: 'en',
    publishedAt: '1843-01-01T00:00:00.000Z',
    publishedAtConfidence: 'inferred',
    creators: [
      {
        role: 'author',
        name: 'Luigi Federico Menabrea',
      },
      {
        role: 'translator',
        name: 'Ada Lovelace',
      },
    ],
    subjectTags: ['Analytical Engine', 'computing', 'Ada Lovelace'],
    text: 'In studying the action of the Analytical Engine, operations are distinguished from the objects operated upon.',
  },
} satisfies PublicDocumentNormalizationInput;

export async function registerPublicContinuumRoutes(app: FastifyInstance) {
  app.get('/api/public-continuum/ada-lovelace', async () => {
    return createAdaPublicContinuum();
  });

  app.post('/api/public-continuum/ada-lovelace/feedback', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const parsed = PublicLensFeedbackRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.status(400).send({ error: 'Invalid feedback payload' });
      return;
    }

    const continuum = createAdaPublicContinuum();
    if (!feedbackMatchesContinuum(parsed.data, continuum)) {
      await reply.status(400).send({ error: 'Feedback does not match the active Continuum' });
      return;
    }

    const feedback = createLensFeedbackSignal({
      id: `lens-feedback:${randomUUID()}`,
      userId: user.id,
      scopeId: parsed.data.scopeId,
      queryId: parsed.data.queryId,
      selectedLensOutputId: parsed.data.selectedLensOutputId,
      candidateLensOutputIds: parsed.data.candidateLensOutputIds,
      signal: 'preferred',
      createdAt: new Date().toISOString(),
    }) satisfies PublicLensFeedbackSignal;

    await appendFeedback(feedback);

    return reply.status(201).send(PublicLensFeedbackResponseSchema.parse({ feedback }));
  });
}

function createAdaPublicContinuum() {
  const events = [
    normalizeWikidataEntity(wikidataAda),
    normalizePublicDocument(analyticalEngineDocument),
  ];
  const outputs = createDefaultPublicLensOutputs(
    adaScope,
    adaQuery,
    events,
    '2026-05-22T12:30:00.000Z',
  );

  return PublicContinuumResponseSchema.parse({
    scope: {
      id: adaScope.id,
      title: importScopeTitle(adaScope),
      primaryLabel: adaScope.primaryEntity.label,
      focusLabel: adaScope.focusEntity?.label ?? null,
    },
    query: {
      id: adaQuery.id,
      text: adaQuery.text,
    },
      events: events.map((event) => ({
        id: event.id,
        sourceName: event.provenance.sourceName,
        sourceFamily: event.provenance.sourceFamily,
        sourceUrl: sourceUrlForEvent(event.source.artifactId),
        subject: event.content.subject,
        text: event.content.text,
        license: event.provenance.license,
    })),
    lenses: defaultPublicLensDefinitions,
    outputs: outputs.map((output) => ({
      id: output.id,
      lensId: output.lensId,
      lensVersion: output.lensVersion,
      sections: output.sections,
    })),
  });
}

function feedbackMatchesContinuum(
  feedback: PublicLensFeedbackRequest,
  continuum: ReturnType<typeof createAdaPublicContinuum>,
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

async function appendFeedback(feedback: PublicLensFeedbackSignal): Promise<void> {
  await mkdir(dirname(feedbackLogPath), { recursive: true });
  await appendFile(feedbackLogPath, `${JSON.stringify(feedback)}\n`, 'utf8');
}

function sourceUrlForEvent(artifactId: string | null): string | null {
  if (artifactId === null) return null;

  if (artifactId.startsWith('https://') || artifactId.startsWith('http://')) {
    return artifactId;
  }

  if (artifactId.startsWith('wikidata:')) {
    return `https://www.wikidata.org/wiki/${artifactId.slice('wikidata:'.length)}`;
  }

  return null;
}

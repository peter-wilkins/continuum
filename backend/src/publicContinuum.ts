import type { FastifyInstance } from 'fastify';
import {
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
import { PublicContinuumResponseSchema } from '@continuum/shared';

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
  });
}

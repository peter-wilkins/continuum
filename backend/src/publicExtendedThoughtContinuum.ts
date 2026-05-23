import { readFileSync } from 'node:fs';

import { defaultPublicLensDefinitions } from '@continuum/core';
import { PublicContinuumResponseSchema } from '@continuum/shared';

const materializedPreviewPath = new URL(
  '../../../continuum-core/data/bootstrap-public-sources/materialized-preview.json',
  import.meta.url,
);

type MaterializedPreviewJson = {
  scopeTitle: string;
  scope: {
    id: string;
    primaryEntity: {
      label: string;
    };
    focusEntity: {
      label: string;
    } | null;
  };
  query: {
    id: string;
    text: string;
  };
  materialization: {
    events: Array<{
      id: string;
      source: {
        artifactId: string | null;
      };
      provenance: {
        sourceName: string;
        sourceFamily: string;
        license: string | null;
      };
      content: {
        subject: string | null;
        text: string;
      };
    }>;
    sourceParagraphs: Array<{
      id: string;
      canonicalEventId: string;
      paragraphIndex: number;
      context: {
        title: string;
        sourceName: string;
        sourceUrl: string;
        license: string;
      };
    }>;
    thoughtCards: Array<{
      id: string;
      lensOutputId: string;
      title: string;
      body: string;
      sourceParagraphIds: string[];
    }>;
    synthesizedAnswer: {
      id: string;
      queryId: string;
      status: 'answered' | 'insufficient_evidence';
      answer: string;
      sourceSupport: Array<{
        thoughtCardId: string;
        sourceParagraphIds: string[];
      }>;
      lensOutputIdsForCompare: string[];
      generatedAt: string;
      generation: {
        strategy: string;
        model: string | null;
        parameters: Array<{
          key: string;
          value: string;
        }>;
      };
    };
    linesOfInquiry: {
      queryId: string;
      recommendedLineId: string;
      lines: Array<{
        id: string;
        queryId: string;
        title: string;
        question: string;
        desiredOutcome: string;
        synthesisMove: 'core_claim' | 'tension' | 'next_question';
        status: 'candidate';
        recommended: boolean;
        sourceSupport: Array<{
          thoughtCardId: string;
          sourceParagraphIds: string[];
        }>;
        whyThis: {
          synthesisMove: 'core_claim' | 'tension' | 'next_question';
          explanation: string;
        };
        confidence: number;
        generatedAt: string;
        generation: {
          strategy: string;
          model: string | null;
          parameters: Array<{
            key: string;
            value: string;
          }>;
        };
      }>;
      generatedAt: string;
      generation: {
        strategy: string;
        model: string | null;
        parameters: Array<{
          key: string;
          value: string;
        }>;
      };
    };
    lensOutputs: Array<{
      id: string;
      lensId: string;
      lensVersion: string;
      sections: Array<{
        id: string;
        title: string;
        eventIds: string[];
      }>;
    }>;
  };
};

export function createExtendedThoughtPublicContinuum() {
  const preview = JSON.parse(
    readFileSync(materializedPreviewPath, 'utf8'),
  ) as MaterializedPreviewJson;
  const { materialization } = preview;

  return PublicContinuumResponseSchema.parse({
    scope: {
      id: preview.scope.id,
      title: preview.scopeTitle,
      primaryLabel: preview.scope.primaryEntity.label,
      focusLabel: preview.scope.focusEntity?.label ?? null,
    },
    query: {
      id: preview.query.id,
      text: preview.query.text,
    },
    events: materialization.events.map((event) => ({
      id: event.id,
      sourceName: event.provenance.sourceName,
      sourceFamily: event.provenance.sourceFamily,
      sourceUrl: sourceUrlForEvent(event.source.artifactId),
      subject: event.content.subject,
      text: event.content.text,
      license: event.provenance.license,
    })),
    sourceParagraphs: materialization.sourceParagraphs.map((paragraph) => ({
      id: paragraph.id,
      canonicalEventId: paragraph.canonicalEventId,
      title: paragraph.context.title,
      sourceName: paragraph.context.sourceName,
      sourceUrl: paragraph.context.sourceUrl,
      license: paragraph.context.license,
      paragraphIndex: paragraph.paragraphIndex,
    })),
    thoughtCards: materialization.thoughtCards.map((card) => ({
      id: card.id,
      lensOutputId: card.lensOutputId,
      title: card.title,
      body: card.body,
      sourceParagraphIds: card.sourceParagraphIds,
    })),
    synthesizedAnswer: materialization.synthesizedAnswer,
    linesOfInquiry: materialization.linesOfInquiry,
    lenses: defaultPublicLensDefinitions,
    outputs: materialization.lensOutputs.map((output) => ({
      id: output.id,
      lensId: output.lensId,
      lensVersion: output.lensVersion,
      thoughtCardIds: materialization.thoughtCards
        .filter((card) => card.lensOutputId === output.id)
        .map((card) => card.id),
      sections: output.sections,
    })),
  });
}

function sourceUrlForEvent(artifactId: string | null): string | null {
  if (artifactId === null) return null;

  if (artifactId.startsWith('https://') || artifactId.startsWith('http://')) {
    return artifactId;
  }

  return null;
}

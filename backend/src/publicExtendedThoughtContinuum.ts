import { readFileSync } from 'node:fs';

import {
  defaultPublicLensDefinitions,
  extendedThoughtGuidedInquiryJourney,
} from '@continuum/core';
import {
  isExtendedThoughtQuestionInScope,
  publicQuestionId,
  PublicContinuumResponseSchema,
} from '@continuum/shared';

import type { PublicContinuumTargetOptions } from './publicContinuumTargets.js';

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

export function createExtendedThoughtPublicContinuum(options: PublicContinuumTargetOptions = {}) {
  const preview = JSON.parse(
    readFileSync(materializedPreviewPath, 'utf8'),
  ) as MaterializedPreviewJson;
  const { materialization } = preview;
  const selectedQuestion =
    options.question && isExtendedThoughtQuestionInScope(options.question)
      ? options.question.trim().replace(/\s+/g, ' ')
      : null;
  const queryText = selectedQuestion ?? preview.query.text;
  const selectedQueryId = selectedQuestion ? publicQuestionId(selectedQuestion) : preview.query.id;
  const openingJourneyStep = extendedThoughtGuidedInquiryJourney.steps[0];

  return PublicContinuumResponseSchema.parse({
    scope: {
      id: preview.scope.id,
      title: preview.scopeTitle,
      primaryLabel: preview.scope.primaryEntity.label,
      focusLabel: preview.scope.focusEntity?.label ?? null,
    },
    query: {
      id: selectedQueryId,
      text: queryText,
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
    synthesizedAnswer: {
      ...materialization.synthesizedAnswer,
      queryId: selectedQueryId,
    },
    linesOfInquiry: {
      ...materialization.linesOfInquiry,
      queryId: selectedQueryId,
      lines: materialization.linesOfInquiry.lines.map((line) => ({
        ...line,
        queryId: selectedQueryId,
        ...(line.id === materialization.linesOfInquiry.recommendedLineId && openingJourneyStep
          ? {
              title: 'Start here',
              question: openingJourneyStep.question,
              desiredOutcome: 'A small answer that keeps the thought moving.',
              whyThis: {
                ...line.whyThis,
                explanation:
                  'This opens with a Socratic boundary question before showing more source detail.',
              },
            }
          : {}),
      })),
    },
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

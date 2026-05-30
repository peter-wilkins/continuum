import type {
  PublicConciergeRun,
  PublicContinuumResponse,
  WorkflowManagerPhoneJourneyState,
} from '@continuum/shared';

export type PublicAnswerSupportItem = {
  support: PublicContinuumResponse['synthesizedAnswer']['sourceSupport'][number];
  card: PublicContinuumResponse['thoughtCards'][number];
  sourceParagraphs: PublicContinuumResponse['sourceParagraphs'];
};

export type PublicContinuumView = {
  eventsById: Map<string, PublicContinuumResponse['events'][number]>;
  sourceParagraphsById: Map<string, PublicContinuumResponse['sourceParagraphs'][number]>;
  thoughtCardsById: Map<string, PublicContinuumResponse['thoughtCards'][number]>;
  answerSupport: PublicAnswerSupportItem[];
  recommendedLine: PublicContinuumResponse['linesOfInquiry']['lines'][number] | null;
  currentQuestion: string | null;
  agreement: string | null;
  desiredOutcome: string | null;
  chairmanProgress: number;
  chairmanProgressPercent: string;
  chairmanProgressLabel: string;
};

export function derivePublicContinuumView(input: {
  continuum: PublicContinuumResponse;
  activeRecommendedLine: PublicContinuumResponse['linesOfInquiry']['lines'][number] | null;
  chairmanBridgeState: WorkflowManagerPhoneJourneyState | null;
  chairmanRun: PublicConciergeRun | null;
}): PublicContinuumView {
  const eventsById = new Map(input.continuum.events.map((event) => [event.id, event]));
  const sourceParagraphsById = new Map(
    input.continuum.sourceParagraphs.map((paragraph) => [paragraph.id, paragraph]),
  );
  const thoughtCardsById = new Map(
    input.continuum.thoughtCards.map((card) => [card.id, card]),
  );
  const answerSupport = input.continuum.synthesizedAnswer.sourceSupport
    .map((support) => {
      const card = thoughtCardsById.get(support.thoughtCardId);
      if (!card) return null;

      return {
        support,
        card,
        sourceParagraphs: support.sourceParagraphIds
          .map((paragraphId) => sourceParagraphsById.get(paragraphId))
          .filter((paragraph) => paragraph !== undefined),
      };
    })
    .filter((item) => item !== null);
  const chairmanProgress =
    input.chairmanBridgeState?.progress ?? input.chairmanRun?.progress ?? 0.25;
  const recommendedLine = input.activeRecommendedLine;
  const currentQuestion =
    input.chairmanRun?.nextLineQuestion ?? recommendedLine?.question ?? null;
  const agreement =
    input.chairmanBridgeState?.latestBody ?? input.chairmanRun?.chairmanReply ?? null;

  return {
    eventsById,
    sourceParagraphsById,
    thoughtCardsById,
    answerSupport,
    recommendedLine,
    currentQuestion,
    agreement,
    desiredOutcome: recommendedLine?.desiredOutcome ?? null,
    chairmanProgress,
    chairmanProgressPercent: `${Math.round(chairmanProgress * 100)}%`,
    chairmanProgressLabel:
      input.chairmanBridgeState?.progressLabel ??
      input.chairmanRun?.progressLabel ??
      'Line opened',
  };
}

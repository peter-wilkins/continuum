import type { PublicContinuumResponse } from '@continuum/shared';
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { fetchPublicContinuum } from './api.js';
import { BuildHash } from './buildInfo.js';
import {
  applyLearningAnswer,
  deriveLearningJourneyView,
  initialLearningJourneyState,
  learningJourneyStepCount,
  type LearningJourneyState,
} from './learningJourney.js';
import './thoughtScreenPrototype.css';

type PrototypeState =
  | { status: 'loading' }
  | { status: 'ready'; continuum: PublicContinuumResponse }
  | { status: 'error'; error: string };

const variants = [
  { key: 'journey', label: 'Chairman Journey' },
  { key: 'teacher', label: 'Socratic Teacher' },
  { key: 'learning', label: 'Learning Journey' },
  { key: 'constellation', label: 'Thought Constellation' },
  { key: 'compass', label: 'Synthesis Compass' },
] as const;

type VariantKey = (typeof variants)[number]['key'];

export function ThoughtScreenPrototype() {
  const [state, setState] = useState<PrototypeState>({ status: 'loading' });
  const [variant, setVariant] = useState<VariantKey>(() => currentVariantFromUrl());

  useEffect(() => {
    let mounted = true;

    fetchPublicContinuum('extended-thought')
      .then((continuum) => {
        if (!mounted) return;
        setState({ status: 'ready', continuum });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to load prototype data',
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => setVariant(currentVariantFromUrl());
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function setVariantInUrl(nextVariant: VariantKey) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('variant', nextVariant);
    window.history.replaceState(null, '', nextUrl);
    setVariant(nextVariant);
  }

  if (state.status === 'loading') {
    return <main className="thought-prototype thought-prototype-loading" />;
  }

  if (state.status === 'error') {
    return (
      <main className="thought-prototype thought-prototype-error">
        <p>{state.error}</p>
      </main>
    );
  }

  const current = variants.find((item) => item.key === variant) ?? variants[0];

  return (
    <main className="thought-prototype">
      <PrototypeQuestion />
      {variant === 'journey' ? <ChairmanJourneyPrototype continuum={state.continuum} /> : null}
      {variant === 'teacher' ? <SocraticTeacherPrototype continuum={state.continuum} /> : null}
      {variant === 'learning' ? <LearningJourneyPrototype continuum={state.continuum} /> : null}
      {variant === 'constellation' ? (
        <ThoughtConstellationPrototype continuum={state.continuum} />
      ) : null}
      {variant === 'compass' ? <SynthesisCompassPrototype continuum={state.continuum} /> : null}
      <PrototypeSwitcher
        current={current}
        onChange={setVariantInUrl}
      />
    </main>
  );
}

function PrototypeQuestion() {
  return (
    <p className="prototype-intent">
      Prototype question: what does thought look like when it is not a document?
    </p>
  );
}

function ChairmanJourneyPrototype({ continuum }: { continuum: PublicContinuumResponse }) {
  const model = useThoughtModel(continuum);

  return (
    <section className="journey-prototype" aria-label="Chairman Journey prototype">
      <div className="journey-state">
        <div className="journey-progress-shell">
          <span style={{ width: '62%' }} />
        </div>
        <div className="journey-branch-meter">
          <span>{model.branchCount} branches</span>
          <strong>2 open</strong>
        </div>
      </div>

      <div className="journey-current">
        <p className="thought-kicker">Now thinking</p>
        <h1>{model.line.question}</h1>
        <div className="journey-claim">
          <span>Current claim</span>
          <p>{model.answer}</p>
        </div>
      </div>

      <div className="journey-evidence">
        {model.evidence.slice(0, 4).map((item, index) => (
          <button className="evidence-chip" type="button" key={item.id}>
            <span>{index + 1}</span>
            {item.title}
          </button>
        ))}
      </div>

      <div className="journey-actions" aria-label="Thought actions">
        <button type="button">Useful</button>
        <button type="button">Confusing</button>
      </div>

      <BuildHash />
    </section>
  );
}

function LearningJourneyPrototype({ continuum }: { continuum: PublicContinuumResponse }) {
  const model = useThoughtModel(continuum);
  const [answer, setAnswer] = useState('');
  const [journey, setJourney] = useState<LearningJourneyState>(initialLearningJourneyState);
  const journeyView = deriveLearningJourneyView(journey, {
    firstEvidenceTitle: model.evidence[0]?.title ?? '',
    fallbackAnswer: model.answer,
  });

  function handleLearningSubmit(event: FormEvent) {
    event.preventDefault();
    setJourney((current) => applyLearningAnswer(current, answer));
    setAnswer('');
  }

  return (
    <section className={`learning-prototype is-${journey.move}`} aria-label="Learning Journey prototype">
      <div className="learning-topline">
        <span>Learning Journey</span>
        <strong>{journeyView.progressLabel}</strong>
      </div>

      <div className="learning-tree" aria-label="Decision tree progress">
        {Array.from({ length: learningJourneyStepCount }, (_, index) => index + 1).map((index) => (
          <span
            className={
              index < journey.step ? 'is-done' : index === journey.step ? 'is-current' : ''
            }
            key={index}
          />
        ))}
      </div>

      <div className="learning-question">
        <p>Extended thought</p>
        <h1>{journeyView.question}</h1>
      </div>

      <form className="learning-freeform" aria-label="Freeform answer" onSubmit={handleLearningSubmit}>
        <label htmlFor="learning-answer">Your answer</label>
        <textarea
          id="learning-answer"
          value={answer}
          rows={4}
          placeholder="Say it in your own words..."
          onChange={(event) => setAnswer(event.target.value)}
        />
        <div className="learning-freeform-actions">
          <button type="button">Speak</button>
          <button type="submit" disabled={answer.trim().length === 0}>Continue</button>
        </div>
      </form>

      <div className="learning-context">
        <span>{journeyView.label}</span>
        <p>{journeyView.clue}</p>
      </div>
    </section>
  );
}

function SocraticTeacherPrototype({ continuum }: { continuum: PublicContinuumResponse }) {
  const model = useThoughtModel(continuum);
  const steps = teacherSteps(model.evidence);

  return (
    <section className="teacher-prototype" aria-label="Socratic Teacher prototype">
      <div className="teacher-progress" aria-label="Understanding progress">
        {steps.map((step, index) => (
          <span className={index <= 1 ? 'is-complete' : ''} key={step.label}>
            {index + 1}
          </span>
        ))}
      </div>

      <div className="teacher-current">
        <p className="thought-kicker">Teach me extended thought</p>
        <h1>When does a tool become part of thinking?</h1>
        <div className="teacher-prompt">
          <span>Question 1</span>
          <p>
            Think of a notebook, phone, or conversation. What changes when the idea lives partly
            outside your head?
          </p>
        </div>
      </div>

      <div className="teacher-clues" aria-label="Clues">
        {steps.map((step) => (
          <button type="button" key={step.label}>
            <span>{step.label}</span>
            {step.clue}
          </button>
        ))}
      </div>

      <div className="teacher-response">
        <button type="button">I have an answer</button>
        <button type="button">Give me a smaller question</button>
      </div>
    </section>
  );
}

function ThoughtConstellationPrototype({ continuum }: { continuum: PublicContinuumResponse }) {
  const model = useThoughtModel(continuum);
  const nodes = model.evidence.slice(0, 9);

  return (
    <section className="constellation-prototype" aria-label="Thought Constellation prototype">
      <div className="constellation-sky">
        <div className="constellation-core">
          <span>claim</span>
          <p>{compactText(model.answer, 118)}</p>
        </div>
        {nodes.map((node, index) => (
          <button
            className={`thought-node node-${index + 1}`}
            type="button"
            key={node.id}
            style={{ '--node-weight': String(0.8 + index * 0.05) } as CSSProperties}
          >
            <span>{node.source}</span>
            {compactText(node.title, 44)}
          </button>
        ))}
        <svg className="constellation-lines" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 50 L22 22 M50 50 L72 18 M50 50 L84 58 M50 50 L30 76 M50 50 L62 84" />
        </svg>
      </div>
      <div className="constellation-dock">
        <button type="button">Pull closer</button>
        <button type="button">Find tension</button>
      </div>
    </section>
  );
}

function SynthesisCompassPrototype({ continuum }: { continuum: PublicContinuumResponse }) {
  const model = useThoughtModel(continuum);
  const moves = continuum.linesOfInquiry.lines.slice(0, 3);

  return (
    <section className="compass-prototype" aria-label="Synthesis Compass prototype">
      <div className="compass-orbit">
        <div className="compass-answer">
          <p className="thought-kicker">Signal</p>
          <h1>{compactText(model.answer, 128)}</h1>
        </div>
        {moves.map((move, index) => (
          <button className={`compass-move move-${index + 1}`} type="button" key={move.id}>
            <span>{move.synthesisMove.replace('_', ' ')}</span>
            {move.title}
          </button>
        ))}
      </div>
      <div className="compass-footer">
        <div>
          <span>Next pressure</span>
          <strong>{model.line.question}</strong>
        </div>
        <button type="button">Advance</button>
      </div>
    </section>
  );
}

function PrototypeSwitcher({
  current,
  onChange,
}: {
  current: (typeof variants)[number];
  onChange: (variant: VariantKey) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        onChange(nextVariant(current.key, -1));
      }
      if (event.key === 'ArrowRight') {
        onChange(nextVariant(current.key, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current.key, onChange]);

  if (!import.meta.env.DEV) return null;

  return (
    <nav className="prototype-switcher" aria-label="Prototype variants">
      <button type="button" aria-label="Previous variant" onClick={() => onChange(nextVariant(current.key, -1))}>
        ‹
      </button>
      <span>{current.label}</span>
      <button type="button" aria-label="Next variant" onClick={() => onChange(nextVariant(current.key, 1))}>
        ›
      </button>
    </nav>
  );
}

function useThoughtModel(continuum: PublicContinuumResponse) {
  return useMemo(() => {
    const thoughtCardsById = new Map(continuum.thoughtCards.map((card) => [card.id, card]));
    const paragraphsById = new Map(continuum.sourceParagraphs.map((paragraph) => [paragraph.id, paragraph]));
    const line =
      continuum.linesOfInquiry.lines.find(
        (item) => item.id === continuum.linesOfInquiry.recommendedLineId,
      ) ?? continuum.linesOfInquiry.lines[0]!;
    const evidence = continuum.synthesizedAnswer.sourceSupport
      .map((support) => {
        const card = thoughtCardsById.get(support.thoughtCardId);
        const paragraph = support.sourceParagraphIds
          .map((id) => paragraphsById.get(id))
          .find((item) => item !== undefined);
        if (!card || !paragraph) return null;

        return {
          id: card.id,
          title: card.title,
          body: card.body,
          source: paragraph.title,
        };
      })
      .filter((item) => item !== null);

    return {
      answer: continuum.synthesizedAnswer.answer,
      branchCount: continuum.linesOfInquiry.lines.length,
      evidence,
      line,
    };
  }, [continuum]);
}

function currentVariantFromUrl(): VariantKey {
  const requested = new URLSearchParams(window.location.search).get('variant');
  const variant = variants.find((item) => item.key === requested);

  return variant?.key ?? 'journey';
}

function nextVariant(current: VariantKey, direction: -1 | 1): VariantKey {
  const index = variants.findIndex((item) => item.key === current);
  const nextIndex = (index + direction + variants.length) % variants.length;

  return variants[nextIndex]!.key;
}

function compactText(text: string, maxLength: number): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function teacherSteps(evidence: Array<{ title: string; source: string }>) {
  const fallback = [
    { title: 'External marks hold thoughts in place', source: 'Evidence' },
    { title: 'Tools reshape what people can notice', source: 'Evidence' },
    { title: 'Shared systems spread thinking across people', source: 'Evidence' },
  ];
  const selected = evidence.length >= 3 ? evidence.slice(0, 3) : fallback;

  return selected.map((item, index) => ({
    label: ['Notice', 'Test', 'Name'][index] ?? 'Reflect',
    clue: compactText(item.title || item.source, 54),
  }));
}

import type {
  DevopsFeedbackKind,
  PublicConciergeRun,
  PublicContinuumResponse,
  WorkflowManagerPhoneJourneyState,
} from '@continuum/shared';
import { useEffect, useMemo, useRef, useState, type FormEvent, type UIEvent } from 'react';
import {
  fetchLatestPublicConciergeRun,
  fetchPublicChairmanBridgeState,
  fetchPublicContinuum,
  submitDevopsFeedback,
  submitPublicChairmanBridgeMessage,
  submitPublicConciergeRun,
} from './api.js';
import { getInitialSession, onAuthChange } from './auth.js';
import { BuildHash, gitHash } from './buildInfo.js';
import {
  browserSpeechRecognitionCaveat,
  getSpeechRecognitionConstructor,
  normalizeSpokenText,
  speechRecognitionUnavailableMessage,
  transcriptFromSpeechEvent,
  type BrowserSpeechRecognition,
} from './browserSpeech.js';
import { getPublicClientInstanceId } from './publicClientInstance.js';
import { derivePublicContinuumView } from './publicContinuumView.js';
import { type PublicAuthState, usePublicLensPreference } from './usePublicLensPreference.js';
import { usePwaInstallPrompt } from './usePwaInstallPrompt.js';
import './publicContinuum.css';

type PublicContinuumState =
  | { status: 'loading' }
  | { status: 'ready'; continuum: PublicContinuumResponse }
  | { status: 'error'; error: string };

type DevopsFeedbackState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent'; messageId: string }
  | { status: 'error'; error: string };

type ChairmanTalkState =
  | { status: 'idle' }
  | { status: 'listening' }
  | { status: 'reviewing' }
  | { status: 'unsupported' }
  | { status: 'submitting' }
  | { status: 'answered' }
  | { status: 'error'; message: string };

function shuffleItems<T>(items: readonly T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index]!;
    shuffled[index] = shuffled[swapIndex]!;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

export function PublicContinuum({ targetId }: { targetId: string }) {
  const [state, setState] = useState<PublicContinuumState>({ status: 'loading' });
  const [authState, setAuthState] = useState<PublicAuthState>({ status: 'loading' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [devopsFeedbackOpen, setDevopsFeedbackOpen] = useState(false);
  const [devopsFeedbackKind, setDevopsFeedbackKind] = useState<DevopsFeedbackKind>('bug');
  const [devopsFeedbackMessage, setDevopsFeedbackMessage] = useState('');
  const [devopsFeedbackSmallFix, setDevopsFeedbackSmallFix] = useState(true);
  const [devopsFeedbackState, setDevopsFeedbackState] = useState<DevopsFeedbackState>({
    status: 'idle',
  });
  const [activeSnapIndex, setActiveSnapIndex] = useState(0);
  const [whyThisOpen, setWhyThisOpen] = useState(false);
  const [chairmanTalkOpen, setChairmanTalkOpen] = useState(false);
  const [chairmanTalkStatus, setChairmanTalkStatus] = useState<ChairmanTalkState>({
    status: 'idle',
  });
  const [chairmanText, setChairmanText] = useState('');
  const [chairmanDraftInputMode, setChairmanDraftInputMode] = useState<'speech' | 'text'>('text');
  const [chairmanRun, setChairmanRun] = useState<PublicConciergeRun | null>(null);
  const [chairmanBridgeState, setChairmanBridgeState] =
    useState<WorkflowManagerPhoneJourneyState | null>(null);
  const [chairmanBridgePollingEnabled, setChairmanBridgePollingEnabled] = useState(false);
  const pwaInstall = usePwaInstallPrompt();
  const lensStripRef = useRef<HTMLElement | null>(null);
  const guidePageRef = useRef<HTMLElement | null>(null);
  const chairmanSpeechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const publicClientInstanceId = useMemo(() => getPublicClientInstanceId(), []);
  const selectedQuestion = new URLSearchParams(window.location.search).get('question');
  const readyContinuum = state.status === 'ready' ? state.continuum : null;
  const chairmanSpeechSupported = useMemo(() => getSpeechRecognitionConstructor() !== null, []);
  const activeQueryId = readyContinuum?.query.id ?? null;
  const activeRecommendedLine = useMemo(() => {
    if (!readyContinuum) return null;

    return (
      readyContinuum.linesOfInquiry.lines.find(
        (line) => line.id === readyContinuum.linesOfInquiry.recommendedLineId,
      ) ??
      readyContinuum.linesOfInquiry.lines[0] ??
      null
    );
  }, [readyContinuum]);
  const {
    authError,
    clearPreferencePulse,
    feedbackState,
    feedbackSummary,
    preferencePulses,
    preferLens,
    signOut,
  } = usePublicLensPreference(targetId, readyContinuum, authState);
  const displayedOutputs = useMemo(() => {
    if (!readyContinuum) return [];

    return shuffleItems(readyContinuum.outputs);
  }, [readyContinuum]);
  const activeLensOutputId =
    activeSnapIndex > 0 ? displayedOutputs[activeSnapIndex - 1]?.id ?? null : null;

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!devopsFeedbackOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDevopsFeedbackOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devopsFeedbackOpen]);

  useEffect(() => {
    return () => {
      const recognition = chairmanSpeechRecognitionRef.current;
      if (!recognition) return;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.abort();
    };
  }, []);

  useEffect(() => {
    setChairmanRun(null);
    setChairmanTalkStatus({ status: 'idle' });
    setChairmanText('');
    setChairmanDraftInputMode('text');
    setChairmanTalkOpen(false);
    setChairmanBridgeState(null);
    setChairmanBridgePollingEnabled(false);
  }, [activeQueryId, activeRecommendedLine?.id]);

  useEffect(() => {
    if (!readyContinuum || !activeRecommendedLine) return;

    let mounted = true;

    fetchLatestPublicConciergeRun(targetId, {
      clientInstanceId: publicClientInstanceId,
      queryId: readyContinuum.query.id,
      lineId: activeRecommendedLine.id,
    })
      .then((response) => {
        if (!mounted) return;
        setChairmanRun(response.run);
        if (response.run !== null) {
          setChairmanTalkStatus({ status: 'answered' });
        }
      })
      .catch(() => {
        if (!mounted) return;
        setChairmanRun(null);
      });

    return () => {
      mounted = false;
    };
  }, [activeRecommendedLine, publicClientInstanceId, readyContinuum, targetId]);

  useEffect(() => {
    if (
      !readyContinuum ||
      !activeRecommendedLine ||
      !chairmanBridgePollingEnabled ||
      authState.status !== 'logged_in'
    ) return;

    let mounted = true;

    const loadBridgeState = () => {
      fetchPublicChairmanBridgeState(targetId, authState.session)
        .then((response) => {
          if (!mounted) return;
          setChairmanBridgeState(response.state);
        })
        .catch(() => {
          if (!mounted) return;
          setChairmanBridgeState(null);
        });
    };

    loadBridgeState();
    const intervalId = window.setInterval(loadBridgeState, 4000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [activeRecommendedLine, authState, chairmanBridgePollingEnabled, readyContinuum, targetId]);

  useEffect(() => {
    setActiveSnapIndex(0);
  }, [displayedOutputs]);

  useEffect(() => {
    let mounted = true;

    fetchPublicContinuum(targetId, { question: selectedQuestion })
      .then((continuum) => {
        if (!mounted) return;
        setState({ status: 'ready', continuum });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to load public Continuum',
        });
      });

    return () => {
      mounted = false;
    };
  }, [selectedQuestion, targetId]);

  useEffect(() => {
    let mounted = true;

    getInitialSession()
      .then((session) => {
        if (!mounted) return;
        setAuthState(session ? { status: 'logged_in', session } : { status: 'logged_out' });
      })
      .catch(() => {
        if (!mounted) return;
        setAuthState({ status: 'logged_out' });
      });

    const unsubscribe = onAuthChange((session) => {
      setAuthState(session ? { status: 'logged_in', session } : { status: 'logged_out' });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  function handleGuideJump() {
    guidePageRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start',
    });
    setMenuOpen(false);
  }

  function handleLensCompareJump() {
    const strip = lensStripRef.current;
    if (!strip) return;

    strip.scrollTo({
      left: strip.clientWidth,
      behavior: 'smooth',
    });
    setMenuOpen(false);
  }

  function handleReload() {
    window.location.reload();
  }

  async function handleInstallFromMenu() {
    await pwaInstall.install();
    setMenuOpen(false);
  }

  async function handleSignOutFromMenu() {
    setMenuOpen(false);
    await signOut();
  }

  function handleLensStripScroll(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    const pageWidth = Math.max(element.clientWidth, 1);
    const nextIndex = Math.round(element.scrollLeft / pageWidth);
    setActiveSnapIndex(nextIndex);
  }

  function handleFeedbackFromMenu() {
    setMenuOpen(false);
    setDevopsFeedbackOpen(true);
    setDevopsFeedbackState({ status: 'idle' });
  }

  async function handleDevopsFeedbackSubmit(event: FormEvent) {
    event.preventDefault();
    const message = devopsFeedbackMessage.trim();
    if (!message || !readyContinuum) return;

    setDevopsFeedbackState({ status: 'submitting' });

    try {
      const response = await submitDevopsFeedback({
        kind: devopsFeedbackSmallFix ? 'small_fix' : devopsFeedbackKind,
        message,
        smallFix: devopsFeedbackSmallFix,
        context: {
          targetId,
          scopeId: readyContinuum.scope.id,
          queryId: readyContinuum.query.id,
          queryText: readyContinuum.query.text,
          lensOutputId: activeLensOutputId,
          path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          gitHash,
          authStatus: authState.status,
          userAgent: window.navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      });

      setDevopsFeedbackMessage('');
      setDevopsFeedbackState({ status: 'sent', messageId: response.messageId });
    } catch (err: unknown) {
      setDevopsFeedbackState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to send feedback',
      });
    }
  }

  async function submitChairmanResponse(userResponse: string, inputMode: 'speech' | 'text') {
    const normalizedResponse = normalizeSpokenText(userResponse);
    if (!normalizedResponse) return;

    if (!readyContinuum || !activeRecommendedLine) {
      setChairmanTalkOpen(true);
      setChairmanTalkStatus({
        status: 'error',
        message: 'No Chairman Line is available here yet.',
      });
      return;
    }

    setChairmanTalkOpen(true);
    setChairmanTalkStatus({ status: 'submitting' });

    try {
      const bridgeRequest = {
        clientInstanceId: publicClientInstanceId,
        scopeId: readyContinuum.scope.id,
        queryId: readyContinuum.query.id,
        queryText: readyContinuum.query.text,
        lineId: activeRecommendedLine.id,
        lineQuestion: activeRecommendedLine.question,
        userResponse: normalizedResponse,
        inputMode,
      };

      if (authState.status === 'logged_in') {
        try {
          const bridgeResponse = await submitPublicChairmanBridgeMessage(
            targetId,
            authState.session,
            bridgeRequest,
          );

          setChairmanBridgeState(bridgeResponse.state);
          setChairmanBridgePollingEnabled(true);
          setChairmanRun(null);
          setChairmanText('');
          setChairmanDraftInputMode('text');
          setChairmanTalkStatus({ status: 'answered' });
          return;
        } catch {
          setChairmanBridgeState(null);
        }
      }

      const response = await submitPublicConciergeRun(targetId, {
        ...bridgeRequest,
      });

      setChairmanRun(response.run);
      setChairmanText('');
      setChairmanDraftInputMode('text');
      setChairmanTalkStatus({ status: 'answered' });
    } catch (err: unknown) {
      setChairmanTalkStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'Chairman reply failed',
      });
    }
  }

  function startChairmanSpeech() {
    setChairmanTalkOpen(true);

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setChairmanTalkStatus({ status: 'unsupported' });
      return;
    }

    chairmanSpeechRecognitionRef.current?.abort();
    setChairmanTalkStatus({ status: 'listening' });

    const recognition = new SpeechRecognition();
    let receivedTranscript = false;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = window.navigator.language || 'en-GB';
    recognition.onstart = () => setChairmanTalkStatus({ status: 'listening' });
    recognition.onresult = (event) => {
      const transcript = transcriptFromSpeechEvent(event);
      if (!transcript) return;
      receivedTranscript = true;
      setChairmanDraftInputMode('speech');
      setChairmanText((current) =>
        normalizeSpokenText([current, transcript].filter(Boolean).join(' ')),
      );
      setChairmanTalkStatus({ status: 'reviewing' });
    };
    recognition.onerror = (event) => {
      receivedTranscript = true;
      const message =
        event.error === 'not-allowed'
          ? 'Speech permission was blocked. Type the reply instead.'
          : 'Speech did not work here. Type the reply instead.';
      setChairmanTalkStatus({ status: 'error', message });
    };
    recognition.onend = () => {
      chairmanSpeechRecognitionRef.current = null;
      if (!receivedTranscript) {
        setChairmanTalkStatus({
          status: 'error',
          message: 'Speech ended before a reply was recognized. Type it instead.',
        });
      }
    };

    chairmanSpeechRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      chairmanSpeechRecognitionRef.current = null;
      setChairmanTalkStatus({
        status: 'error',
        message: 'Speech could not start in this browser. Type the reply instead.',
      });
    }
  }

  function handleChairmanTextSubmit(event: FormEvent) {
    event.preventDefault();
    void submitChairmanResponse(chairmanText, chairmanDraftInputMode);
  }

  if (state.status === 'loading') {
    return <main className="public-screen" />;
  }

  if (state.status === 'error') {
    return (
      <main className="public-screen">
        <p className="error">{state.error}</p>
      </main>
    );
  }

  const { continuum } = state;
  const {
    answerSupport,
    chairmanProgress,
    chairmanProgressLabel,
    chairmanProgressPercent,
    eventsById,
    recommendedLine,
    sourceParagraphsById,
    thoughtCardsById,
  } = derivePublicContinuumView({
    continuum,
    activeRecommendedLine,
    chairmanBridgeState,
    chairmanRun,
  });

  return (
    <main
      className={`public-screen public-continuum-screen${pwaInstall.installed ? ' is-installed' : ''}`}
    >
      <header className="public-app-chrome">
        <div className="public-app-title">
          <h1>{continuum.scope.title}</h1>
          <span>{continuum.query.text}</span>
        </div>
      </header>
      <div className="public-menu">
        <button
          className={`public-menu-button${menuOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-controls="public-continuum-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        {menuOpen ? (
          <div className="public-menu-panel" id="public-continuum-menu" role="menu">
            <button type="button" role="menuitem" onClick={handleReload}>
              Reload
            </button>
            <button type="button" role="menuitem" onClick={handleGuideJump}>
              Guide
            </button>
            <button type="button" role="menuitem" onClick={handleLensCompareJump}>
              Lens Compare
            </button>
            <button type="button" role="menuitem" onClick={handleFeedbackFromMenu}>
              Feedback
            </button>
            {pwaInstall.canInstall ? (
              <button
                type="button"
                role="menuitem"
                disabled={pwaInstall.installing}
                onClick={() => void handleInstallFromMenu()}
              >
                {pwaInstall.installing ? 'Installing' : 'Install'}
              </button>
            ) : null}
            {pwaInstall.installed ? <span className="public-menu-note">Installed</span> : null}
            {authState.status === 'logged_in' ? (
              <button type="button" role="menuitem" onClick={() => void handleSignOutFromMenu()}>
                Sign out
              </button>
            ) : null}
            <span className="public-menu-note">Git {gitHash}</span>
          </div>
        ) : null}
      </div>

      <section
        ref={lensStripRef}
        className="public-lens-strip"
        aria-label="Answer, Lens Compare, and guide"
        onScroll={handleLensStripScroll}
      >
        <article className="public-lens public-answer-page" aria-label="Synthesized answer">
          <div className="public-lens-body public-answer-body">
            <section className="public-answer-main">
              <p className="index-kicker">Answer</p>
              <p className="public-query-context">Asked: {continuum.query.text}</p>
              <h2>{continuum.synthesizedAnswer.answer}</h2>
              {recommendedLine ? (
                <div className="public-line-of-inquiry">
                  <p>Line</p>
                  <h3>{recommendedLine.question}</h3>
                  <p>{recommendedLine.desiredOutcome}</p>
                  <div className="public-journey-progress">
                    <div className="public-journey-progress-label">
                      <span>Journey</span>
                      <strong>{chairmanProgressLabel}</strong>
                    </div>
                    <div
                      className="public-journey-progress-track"
                      aria-label="Thought Journey progress"
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={Math.round(chairmanProgress * 100)}
                      role="progressbar"
                    >
                      <span style={{ width: chairmanProgressPercent }} />
                    </div>
                  </div>
                  {chairmanBridgeState ? (
                    <div className="public-chairman-reply">
                      <p>Chairman</p>
                      <h4>{chairmanBridgeState.latestBody}</h4>
                      {chairmanBridgeState.pendingBody ? (
                        <div className="public-chairman-heard">
                          <span>Heard</span>
                          <p>{chairmanBridgeState.pendingBody}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : chairmanRun ? (
                    <div className="public-chairman-reply">
                      <p>Chairman</p>
                      <h4>{chairmanRun.chairmanReply}</h4>
                      <div className="public-chairman-heard">
                        <span>Heard</span>
                        <p>{chairmanRun.userResponse}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="public-answer-actions">
                <button
                  className="chrome-button"
                  type="button"
                  aria-expanded={whyThisOpen}
                  onClick={() => setWhyThisOpen((current) => !current)}
                >
                  Why this?
                </button>
                <button className="chrome-button" type="button" onClick={handleLensCompareJump}>
                  Lens Compare
                </button>
              </div>
            </section>

            {whyThisOpen ? (
              <section className="public-answer-sources" aria-label="Sources">
                <h3>Sources</h3>
                <ol>
                  {answerSupport.map(({ card, sourceParagraphs, support }) => {
                    if (!card) return null;

                    return (
                      <li key={support.thoughtCardId}>
                        <h4>{card.title}</h4>
                        <p>{card.body}</p>
                        <footer className="public-thought-provenance">
                          {sourceParagraphs.map((paragraph) => {
                            const event = eventsById.get(paragraph.canonicalEventId);

                            return (
                              <a
                                href={paragraph.sourceUrl}
                                key={paragraph.id}
                                target="_blank"
                                rel="noreferrer"
                                title={event?.subject ?? paragraph.title}
                              >
                                {paragraph.sourceName} / {paragraph.title} / paragraph{' '}
                                {paragraph.paragraphIndex + 1}
                              </a>
                            );
                          })}
                        </footer>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}
          </div>
        </article>
        {displayedOutputs.map((output) => {
          const submitting =
            feedbackState.status === 'submitting' && feedbackState.lensOutputId === output.id;
          const recorded =
            feedbackState.status === 'recorded' && feedbackState.lensOutputId === output.id;
          const pulses = preferencePulses.filter((pulse) => pulse.lensOutputId === output.id);

          return (
            <article className="public-lens" key={output.id} aria-label="Lens candidate">
              <div className="lens-vote-dock">
                <button
                  className={`lens-vote-button${recorded ? ' selected' : ''}`}
                  type="button"
                  disabled={feedbackState.status === 'submitting'}
                  onClick={() => void preferLens(output.id)}
                  title={authState.status === 'logged_in' ? 'Prefer this Lens' : 'Sign in to vote'}
                >
                  {submitting ? '...' : recorded ? 'OK' : '+1'}
                  {pulses.map((pulse) => (
                    <span
                      aria-hidden="true"
                      className="lens-vote-pulse"
                      key={pulse.id}
                      onAnimationEnd={() => clearPreferencePulse(pulse.id)}
                    >
                      +1
                    </span>
                  ))}
                </button>
              </div>
              <div className="public-lens-body">
                <ol className="public-thought-card-list">
                  {output.thoughtCardIds.map((cardId) => {
                    const card = thoughtCardsById.get(cardId);
                    if (!card) return null;
                    const sourceParagraphs = card.sourceParagraphIds
                      .map((paragraphId) => sourceParagraphsById.get(paragraphId))
                      .filter((paragraph) => paragraph !== undefined);

                    return (
                      <li className="public-thought-card" key={card.id}>
                        <h2>{card.title}</h2>
                        <p>{card.body}</p>
                        <footer className="public-thought-provenance">
                          {sourceParagraphs.map((paragraph) => {
                            const event = eventsById.get(paragraph.canonicalEventId);

                            return (
                              <a
                                href={paragraph.sourceUrl}
                                key={paragraph.id}
                                target="_blank"
                                rel="noreferrer"
                                title={event?.subject ?? paragraph.title}
                              >
                                {paragraph.sourceName} / {paragraph.title} / paragraph{' '}
                                {paragraph.paragraphIndex + 1}
                              </a>
                            );
                          })}
                        </footer>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          );
        })}
        <article
          className="public-lens public-guide-page"
          ref={guidePageRef}
          aria-label="Guide and settings"
        >
          <div className="public-lens-body public-guide-body">
            <section className="public-guide-section">
              <p className="index-kicker">Guide</p>
              <h2>Lens guide</h2>
              <p>
                Each Lens is a different projection over the same query and the same source-backed
                Thought Cards. Candidate order is shuffled each page load.
              </p>
            </section>

            <div className="public-guide-actions">
              <a className="chrome-link" href="/public/lenses">
                Open guide page
              </a>
              <button className="chrome-button" type="button" onClick={handleFeedbackFromMenu}>
                Feedback
              </button>
              {pwaInstall.canInstall ? (
                <button
                  className="chrome-button"
                  type="button"
                  disabled={pwaInstall.installing}
                  onClick={() => void pwaInstall.install()}
                >
                  {pwaInstall.installing ? 'Installing' : 'Install'}
                </button>
              ) : null}
              {pwaInstall.installed ? <span className="chrome-muted">Installed</span> : null}
              {authState.status === 'logged_in' ? (
                <button className="chrome-button" type="button" onClick={() => void signOut()}>
                  Sign out
                </button>
              ) : null}
              <span className="chrome-hash">Git {gitHash}</span>
            </div>

            <section className="public-guide-section">
              <h3>Lens approaches</h3>
              <div className="public-guide-list">
                {continuum.lenses.map((lens) => (
                  <article className="public-guide-card" key={lens.id}>
                    <p>{lens.version}</p>
                    <h4>{lens.name}</h4>
                    <p>{lens.userBlurb}</p>
                    <p>{lens.technicalBlurb}</p>
                  </article>
                ))}
              </div>
            </section>

            {feedbackSummary ? (
              <section className="public-guide-section">
                <h3>Feedback so far</h3>
                <ul className="public-feedback-list">
                  {continuum.outputs.map((output) => {
                    const lens = continuum.lenses.find(
                      (candidate) => candidate.id === output.lensId,
                    );
                    const preferenceCount =
                      feedbackSummary.byLensOutput.find((item) => item.lensOutputId === output.id)
                        ?.count ?? 0;

                    return (
                      <li key={output.id}>
                        <span>{lens?.name ?? output.lensId}</span>
                        <strong>{preferenceCount}</strong>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        </article>
      </section>
      {feedbackState.status === 'error' ? (
        <p className="public-feedback-error">{feedbackState.error}</p>
      ) : null}
      {authError ? <p className="public-feedback-error">{authError}</p> : null}
      {recommendedLine && activeSnapIndex === 0 ? (
        <div className="chairman-talk-dock">
          {chairmanTalkOpen ? (
            <form className="chairman-talk-panel" onSubmit={handleChairmanTextSubmit}>
              <div className="chairman-talk-panel-header">
                <h2>Chairman</h2>
                <button
                  type="button"
                  aria-label="Close Chairman"
                  onClick={() => setChairmanTalkOpen(false)}
                >
                  Close
                </button>
              </div>
              {chairmanTalkStatus.status === 'listening' ? (
                <p className="chairman-talk-status">Listening...</p>
              ) : null}
              {chairmanTalkStatus.status === 'reviewing' ? (
                <p className="chairman-talk-status">Review the dictation, then Send.</p>
              ) : null}
              {chairmanTalkStatus.status === 'unsupported' ? (
                <p className="chairman-talk-status">{speechRecognitionUnavailableMessage}</p>
              ) : null}
              {chairmanTalkStatus.status === 'submitting' ? (
                <p className="chairman-talk-status">Saving reply...</p>
              ) : null}
              {chairmanTalkStatus.status === 'answered' && chairmanBridgeState ? (
                <div className="chairman-talk-status">
                  <p>{chairmanBridgeState.latestBody}</p>
                  {chairmanBridgeState.pendingBody ? (
                    <div className="chairman-talk-heard">
                      <span>Heard</span>
                      <p>{chairmanBridgeState.pendingBody}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {chairmanTalkStatus.status === 'answered' && !chairmanBridgeState && chairmanRun ? (
                <div className="chairman-talk-status">
                  <p>{chairmanRun.chairmanReply}</p>
                  <div className="chairman-talk-heard">
                    <span>Heard</span>
                    <p>{chairmanRun.userResponse}</p>
                  </div>
                </div>
              ) : null}
              {chairmanTalkStatus.status === 'error' ? (
                <p className="chairman-talk-status is-error">{chairmanTalkStatus.message}</p>
              ) : null}
              <textarea
                aria-label="Reply to Chairman"
                placeholder="Dictate or type reply"
                rows={3}
                value={chairmanText}
                onChange={(event) => {
                  setChairmanText(event.target.value);
                  if (chairmanTalkStatus.status !== 'reviewing') {
                    setChairmanDraftInputMode('text');
                  }
                }}
              />
              <div className="chairman-talk-actions">
                <button
                  className="chrome-button"
                  type="submit"
                  disabled={
                    !chairmanText.trim() || chairmanTalkStatus.status === 'submitting'
                  }
                >
                  Send
                </button>
                {chairmanSpeechSupported ? (
                  <button
                    className="chrome-button"
                    type="button"
                    disabled={chairmanTalkStatus.status === 'listening'}
                    onClick={startChairmanSpeech}
                  >
                    Dictate
                  </button>
                ) : null}
              </div>
              <p className="chairman-talk-note">{browserSpeechRecognitionCaveat}</p>
            </form>
          ) : null}
          <button
            className={`chairman-talk-button${
              chairmanTalkStatus.status === 'listening' ? ' is-listening' : ''
            }`}
            type="button"
            aria-label="Talk to Chairman"
            title="Talk to Chairman"
            disabled={chairmanTalkStatus.status === 'listening'}
            onClick={startChairmanSpeech}
          >
            <span className="chairman-mic-icon" aria-hidden="true">
              <span />
            </span>
          </button>
        </div>
      ) : null}
      {devopsFeedbackOpen ? (
        <div
          className="devops-feedback-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDevopsFeedbackOpen(false);
          }}
        >
          <form
            className="devops-feedback-panel"
            onSubmit={(event) => void handleDevopsFeedbackSubmit(event)}
          >
            <div className="devops-feedback-header">
              <h2>Feedback</h2>
              <button
                type="button"
                aria-label="Close feedback"
                onClick={() => setDevopsFeedbackOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="devops-feedback-fields">
              <select
                aria-label="Feedback kind"
                value={devopsFeedbackKind}
                onChange={(event) =>
                  setDevopsFeedbackKind(event.target.value as DevopsFeedbackKind)
                }
              >
                <option value="bug">Bug</option>
                <option value="confusing">Confusing</option>
                <option value="improvement">Improvement</option>
                <option value="content">Content</option>
                <option value="other">Other</option>
              </select>
              <textarea
                aria-label="Feedback"
                autoFocus
                maxLength={4000}
                placeholder="What should change?"
                rows={5}
                value={devopsFeedbackMessage}
                onChange={(event) => {
                  setDevopsFeedbackMessage(event.target.value);
                  if (devopsFeedbackState.status !== 'idle') {
                    setDevopsFeedbackState({ status: 'idle' });
                  }
                }}
              />
              <label className="devops-feedback-check">
                <input
                  type="checkbox"
                  checked={devopsFeedbackSmallFix}
                  onChange={(event) => setDevopsFeedbackSmallFix(event.target.checked)}
                />
                <span>Small fix</span>
              </label>
            </div>
            <div className="devops-feedback-actions">
              <button
                className="chrome-button"
                type="submit"
                disabled={
                  !devopsFeedbackMessage.trim() || devopsFeedbackState.status === 'submitting'
                }
              >
                {devopsFeedbackState.status === 'submitting' ? 'Sending' : 'Send'}
              </button>
              <button
                className="chrome-button"
                type="button"
                onClick={() => setDevopsFeedbackOpen(false)}
              >
                Cancel
              </button>
            </div>
            {devopsFeedbackState.status === 'sent' ? (
              <p className="devops-feedback-status">Sent to agent</p>
            ) : null}
            {devopsFeedbackState.status === 'error' ? (
              <p className="devops-feedback-status is-error">{devopsFeedbackState.error}</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </main>
  );
}

export function PublicLensGuide({ targetId }: { targetId: string }) {
  const [state, setState] = useState<PublicContinuumState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    fetchPublicContinuum(targetId)
      .then((continuum) => {
        if (!mounted) return;
        setState({ status: 'ready', continuum });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to load Lens guide',
        });
      });

    return () => {
      mounted = false;
    };
  }, [targetId]);

  if (state.status === 'loading') {
    return <main className="public-screen" />;
  }

  if (state.status === 'error') {
    return (
      <main className="public-screen">
        <p className="error">{state.error}</p>
      </main>
    );
  }

  const { continuum } = state;

  return (
    <main className="public-screen">
      <header className="public-header">
        <p className="index-kicker">Lens guide</p>
        <h1>How the Lens candidates work</h1>
        <p>
          Each Lens is a different projection over the same query and the same source-backed
          Thought Cards.
        </p>
        <div className="public-header-actions">
          <a className="text-link" href={`/public/${targetId}`}>
            Back to Continuum
          </a>
        </div>
      </header>

      <section className="lens-guide-list" aria-label="Lens guide">
        {continuum.lenses.map((lens) => {
          const output = continuum.outputs.find((candidate) => candidate.lensId === lens.id);

          return (
            <article className="public-lens lens-guide-card" key={lens.id}>
              <p className="status-pill">{lens.version}</p>
              <h2>{lens.name}</h2>
              <p>{lens.userBlurb}</p>
              <dl className="lens-guide-meta">
                <div>
                  <dt>Implementation</dt>
                  <dd>{lens.technicalBlurb}</dd>
                </div>
                <div>
                  <dt>Sections</dt>
                  <dd>{output ? `${output.thoughtCardIds.length} Thought Cards` : 'None'}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>
      <BuildHash />
    </main>
  );
}

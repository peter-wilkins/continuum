import type { PublicContinuumResponse } from '@continuum/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchPublicContinuum } from './api.js';
import { getInitialSession, onAuthChange } from './auth.js';
import { BuildHash, gitHash } from './buildInfo.js';
import { type PublicAuthState, usePublicLensPreference } from './usePublicLensPreference.js';
import { usePwaInstallPrompt } from './usePwaInstallPrompt.js';
import './publicContinuum.css';

type PublicContinuumState =
  | { status: 'loading' }
  | { status: 'ready'; continuum: PublicContinuumResponse }
  | { status: 'error'; error: string };

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
  const pwaInstall = usePwaInstallPrompt();
  const guidePageRef = useRef<HTMLElement | null>(null);
  const readyContinuum = state.status === 'ready' ? state.continuum : null;
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
          error: err instanceof Error ? err.message : 'Failed to load public Continuum',
        });
      });

    return () => {
      mounted = false;
    };
  }, [targetId]);

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
  const eventsById = new Map(continuum.events.map((event) => [event.id, event]));
  const sourceParagraphsById = new Map(
    continuum.sourceParagraphs.map((paragraph) => [paragraph.id, paragraph]),
  );
  const thoughtCardsById = new Map(continuum.thoughtCards.map((card) => [card.id, card]));

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

      <section className="public-lens-strip" aria-label="Lens candidates and guide">
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

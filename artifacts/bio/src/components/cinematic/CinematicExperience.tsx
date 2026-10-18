import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CinematicEnvironment } from './CinematicEnvironment';
import { JournalScene } from './JournalScene';
import './cinematic-experience.css';

export type CinematicPhase = 'opening' | 'dark' | 'to-light' | 'light' | 'ending' | 'exit';

interface CinematicExperienceProps {
  audioElement: HTMLAudioElement | null;
  audioUnavailable: boolean;
  onAudioUnavailable: () => void;
  onClose: () => void;
}

type DialogueSection = 'opening' | 'dark' | 'light';
type DialoguePlacement = 'intro' | 'focus' | 'right' | 'left' | 'center';

interface DialogueBeat {
  id: string;
  text: string;
  cue: number;
  revealSeconds: number;
  section: DialogueSection;
  placement: DialoguePlacement;
  left: number;
  top: number;
  width: number;
  align: 'left' | 'center';
}

interface ActiveBeat extends DialogueBeat {
  startedAt: number;
}

const OPENING_BEATS: DialogueBeat[] = [
  {
    id: 'opening-0',
    text: "If we lived forever, maybe we'd have\ntime to understand things",
    cue: 3.2,
    revealSeconds: 1.9,
    section: 'opening',
    placement: 'intro',
    left: 50,
    top: 41,
    width: 66,
    align: 'center',
  },
  {
    id: 'opening-1',
    text: 'But as it is, I think the best we\ncould do is try to open our eyes',
    cue: 6.6,
    revealSeconds: 2.1,
    section: 'opening',
    placement: 'intro',
    left: 50,
    top: 48,
    width: 66,
    align: 'center',
  },
];

const DARK_BEATS: DialogueBeat[] = [
  {
    id: 'dark-0',
    text: 'And appreciate how strange\nand brief all of this is',
    cue: 13.6,
    revealSeconds: 1.75,
    section: 'dark',
    placement: 'focus',
    left: 50,
    top: 69,
    width: 74,
    align: 'center',
  },
  {
    id: 'dark-1',
    text: 'This journal was\nsupposed to be\nfor you',
    cue: 22,
    revealSeconds: 1.8,
    section: 'dark',
    placement: 'right',
    left: 66,
    top: 51,
    width: 34,
    align: 'left',
  },
  {
    id: 'dark-2',
    text: "But now I\nhope you'll\nnever see it",
    cue: 27.5,
    revealSeconds: 1.65,
    section: 'dark',
    placement: 'left',
    left: 35,
    top: 51,
    width: 32,
    align: 'left',
  },
  {
    id: 'dark-3',
    text: 'I just want\nto meet you',
    cue: 31.7,
    revealSeconds: 1.45,
    section: 'dark',
    placement: 'center',
    left: 50,
    top: 51,
    width: 43,
    align: 'center',
  },
  {
    id: 'dark-4',
    text: 'And tell you all\nthese stories\nmyself',
    cue: 35.5,
    revealSeconds: 1.65,
    section: 'dark',
    placement: 'center',
    left: 50,
    top: 53,
    width: 47,
    align: 'center',
  },
  {
    id: 'dark-5',
    text: "But I guess if\nyou're reading\nthis now...",
    cue: 39.5,
    revealSeconds: 1.8,
    section: 'dark',
    placement: 'center',
    left: 50,
    top: 53,
    width: 44,
    align: 'center',
  },
  {
    id: 'dark-6',
    text: "Things didn't\nwork out\nthat way",
    cue: 43.5,
    revealSeconds: 1.6,
    section: 'dark',
    placement: 'center',
    left: 50,
    top: 53,
    width: 42,
    align: 'center',
  },
];

const LIGHT_BEATS: DialogueBeat[] = [
  {
    id: 'light-0',
    text: 'This is where your story begins.',
    cue: 52.4,
    revealSeconds: 1.35,
    section: 'light',
    placement: 'center',
    left: 50,
    top: 51,
    width: 84,
    align: 'center',
  },
  {
    id: 'light-1',
    text: "I'm sorry I won't be there to see it.",
    cue: 56.5,
    revealSeconds: 1.55,
    section: 'light',
    placement: 'center',
    left: 50,
    top: 51,
    width: 82,
    align: 'center',
  },
  {
    id: 'light-2',
    text: "It's a lot to ask,\nbut I don't want you\nto be sad that I'm gone.",
    cue: 59.6,
    revealSeconds: 2.25,
    section: 'light',
    placement: 'center',
    left: 50,
    top: 51,
    width: 76,
    align: 'center',
  },
  {
    id: 'light-3',
    text: 'I want you to be amazed that any\nof us ever had a chance to be here\nat all.',
    cue: 63.5,
    revealSeconds: 2.35,
    section: 'light',
    placement: 'center',
    left: 50,
    top: 51,
    width: 82,
    align: 'center',
  },
  {
    id: 'light-4',
    text: 'Good luck',
    cue: 67.5,
    revealSeconds: 0.8,
    section: 'light',
    placement: 'center',
    left: 50,
    top: 51,
    width: 70,
    align: 'center',
  },
];

const DARK_PRESS_COUNTS = [3, 3, 3, 3, 2, 1];
const DARK_TO_LIGHT_CUE = 46.4;
const LIGHT_TRANSITION_SECONDS = 3.35;
const OPENING_FADE_SECONDS = 1.6;
const GOOD_LUCK_HOLD_SECONDS = 2.1;
const ENDING_FADE_SECONDS = 7.4;
const EXIT_FADE_SECONDS = 1.25;
const CINEMATIC_AUDIO_VOLUME = 0.78;
const AUDIO_END_FADE_SECONDS = 3.5;

export function CinematicExperience({
  audioElement,
  audioUnavailable,
  onAudioUnavailable,
  onClose,
}: CinematicExperienceProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [phase, setPhaseState] = useState<CinematicPhase>('opening');
  const [activeBeat, setActiveBeat] = useState<ActiveBeat | null>(null);
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [cameraStep, setCameraStep] = useState(0);
  const [pressCount, setPressCount] = useState(0);

  const phaseRef = useRef<CinematicPhase>('opening');
  const phaseStartedAtRef = useRef(0);
  const activeBeatRef = useRef<ActiveBeat | null>(null);
  const visibleCharactersRef = useRef(0);
  const currentClockRef = useRef(0);
  const darkIndexRef = useRef(-1);
  const pendingDarkIndexRef = useRef<number | null>(null);
  const pressCountRef = useRef(0);
  const cameraStepRef = useRef(0);
  const transitionLockUntilRef = useRef(0);
  const heldSpaceRef = useRef(false);
  const closingRef = useRef(false);
  const exitStartVolumeRef = useRef(0);
  const audioUnavailableRef = useRef(audioUnavailable);
  const audioRef = useRef(audioElement);
  const onAudioUnavailableRef = useRef(onAudioUnavailable);
  const onCloseRef = useRef(onClose);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  audioUnavailableRef.current = audioUnavailable;
  audioRef.current = audioElement;
  onAudioUnavailableRef.current = onAudioUnavailable;
  onCloseRef.current = onClose;

  const activateBeat = useCallback((beat: DialogueBeat, startedAt: number) => {
    const nextBeat = { ...beat, startedAt };
    activeBeatRef.current = nextBeat;
    visibleCharactersRef.current = 0;
    setActiveBeat(nextBeat);
    setVisibleCharacters(0);
  }, []);

  const changePhase = useCallback((nextPhase: CinematicPhase, at: number) => {
    if (phaseRef.current === nextPhase) return;
    if (nextPhase === 'exit') {
      closingRef.current = true;
      exitStartVolumeRef.current = audioRef.current?.volume ?? 0;
    }
    phaseRef.current = nextPhase;
    phaseStartedAtRef.current = at;
    setPhaseState(nextPhase);
  }, []);

  const advanceRef = useRef<() => void>(() => undefined);
  const advance = useCallback(() => {
    if (phaseRef.current !== 'dark' || closingRef.current) return;
    if (pendingDarkIndexRef.current !== null) return;

    const clock = currentClockRef.current;
    if (clock < transitionLockUntilRef.current) return;
    const index = darkIndexRef.current;
    if (index < 0 || index >= DARK_PRESS_COUNTS.length) return;

    const nextCount = pressCountRef.current + 1;
    pressCountRef.current = nextCount;
    cameraStepRef.current += 1;
    setPressCount(nextCount);
    setCameraStep(cameraStepRef.current);
    transitionLockUntilRef.current = clock + 0.46;

    if (nextCount >= DARK_PRESS_COUNTS[index] && index < DARK_BEATS.length - 1) {
      pendingDarkIndexRef.current = index + 1;
    }
  }, []);
  advanceRef.current = advance;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const scrollY = window.scrollY;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    containerRef.current?.focus({ preventScroll: true });
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        return;
      }
      if (event.code === 'Escape') {
        event.preventDefault();
        changePhase('exit', currentClockRef.current);
        return;
      }
      if (event.code !== 'Space') return;
      event.preventDefault();
      if (event.repeat || heldSpaceRef.current) return;
      heldSpaceRef.current = true;
      advanceRef.current();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') heldSpaceRef.current = false;
    };
    const onWindowBlur = () => {
      heldSpaceRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onWindowBlur);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [changePhase]);

  useEffect(() => {
    let animationFrame = 0;
    let previousFrameAt = performance.now();
    let lastAudioTime = audioElement?.currentTime ?? 0;
    let lastAudioProgressAt = previousFrameAt;
    let audioTailStartedAt: number | null = null;
    let audioTailClock = 0;
    let unavailableWasReported = audioUnavailableRef.current;

    const tick = (now: number) => {
      const delta = Math.min((now - previousFrameAt) / 1000, 0.05);
      previousFrameAt = now;

      let clock: number;
      if (audioElement && !audioUnavailableRef.current) {
        if (audioElement.ended) {
          if (audioTailStartedAt === null) {
            audioTailStartedAt = now;
            audioTailClock = audioElement.currentTime;
          }
          clock = audioTailClock + (now - audioTailStartedAt) / 1000;
        } else {
          audioTailStartedAt = null;
          clock = audioElement.currentTime;
          if (Math.abs(clock - lastAudioTime) > 0.015) {
            lastAudioTime = clock;
            lastAudioProgressAt = now;
          } else if (!audioElement.paused && now - lastAudioProgressAt > 2600) {
            if (!unavailableWasReported) {
              unavailableWasReported = true;
              onAudioUnavailableRef.current();
            }
          }
        }
      } else {
        clock = currentClockRef.current + delta;
      }
      currentClockRef.current = clock;

      const currentPhase = phaseRef.current;
      if (audioElement && !audioUnavailableRef.current) {
        if (currentPhase === 'opening' || currentPhase === 'dark' || currentPhase === 'to-light') {
          audioElement.volume = CINEMATIC_AUDIO_VOLUME * Math.min(clock / OPENING_FADE_SECONDS, 1);
        } else if (
          (currentPhase === 'light' || currentPhase === 'ending')
          && Number.isFinite(audioElement.duration)
          && audioElement.duration > 0
        ) {
          const remaining = Math.max(audioElement.duration - clock, 0);
          audioElement.volume = CINEMATIC_AUDIO_VOLUME * Math.min(remaining / AUDIO_END_FADE_SECONDS, 1);
        } else if (currentPhase === 'ending') {
          const progress = Math.min((clock - phaseStartedAtRef.current) / ENDING_FADE_SECONDS, 1);
          audioElement.volume = CINEMATIC_AUDIO_VOLUME * (1 - progress);
        } else if (currentPhase === 'exit') {
          const progress = Math.min((clock - phaseStartedAtRef.current) / EXIT_FADE_SECONDS, 1);
          audioElement.volume = exitStartVolumeRef.current * (1 - progress);
        } else {
          audioElement.volume = CINEMATIC_AUDIO_VOLUME;
        }
      }

      if (currentPhase === 'opening') {
        const openingIndex = OPENING_BEATS.findLastIndex((beat) => clock >= beat.cue);
        if (openingIndex >= 0 && activeBeatRef.current?.id !== OPENING_BEATS[openingIndex].id) {
          activateBeat(OPENING_BEATS[openingIndex], OPENING_BEATS[openingIndex].cue);
        }
        if (clock >= DARK_BEATS[0].cue && activeBeatRef.current?.id !== DARK_BEATS[0].id) {
          darkIndexRef.current = 0;
          pressCountRef.current = 0;
          setPressCount(0);
          activateBeat(DARK_BEATS[0], DARK_BEATS[0].cue);
        }
        const firstDarkBeat = activeBeatRef.current;
        if (
          firstDarkBeat?.id === DARK_BEATS[0].id
          && clock >= firstDarkBeat.startedAt + firstDarkBeat.revealSeconds
        ) {
          changePhase('dark', clock);
        }
      } else if (currentPhase === 'dark') {
        const pendingIndex = pendingDarkIndexRef.current;
        if (pendingIndex !== null && clock >= DARK_BEATS[pendingIndex].cue) {
          pendingDarkIndexRef.current = null;
          darkIndexRef.current = pendingIndex;
          pressCountRef.current = 0;
          setPressCount(0);
          activateBeat(DARK_BEATS[pendingIndex], clock);
          transitionLockUntilRef.current = clock + 0.48;
        }

        const finalDarkBeat = activeBeatRef.current;
        if (
          darkIndexRef.current === DARK_BEATS.length - 1
          && finalDarkBeat?.id === DARK_BEATS[DARK_BEATS.length - 1].id
          && clock >= Math.max(DARK_TO_LIGHT_CUE, finalDarkBeat.startedAt + finalDarkBeat.revealSeconds)
        ) {
          changePhase('to-light', clock);
        }
      } else if (currentPhase === 'to-light') {
        if (clock - phaseStartedAtRef.current >= LIGHT_TRANSITION_SECONDS) {
          changePhase('light', clock);
        }
      } else if (currentPhase === 'light') {
        const lightIndex = LIGHT_BEATS.findLastIndex((beat) => clock >= beat.cue);
        if (lightIndex >= 0 && activeBeatRef.current?.id !== LIGHT_BEATS[lightIndex].id) {
          activateBeat(LIGHT_BEATS[lightIndex], LIGHT_BEATS[lightIndex].cue);
        }
        const finalBeat = activeBeatRef.current;
        if (
          lightIndex === LIGHT_BEATS.length - 1
          && finalBeat?.id === LIGHT_BEATS[LIGHT_BEATS.length - 1].id
          && clock >= finalBeat.startedAt + finalBeat.revealSeconds + GOOD_LUCK_HOLD_SECONDS
        ) {
          changePhase('ending', clock);
        }
      } else if (currentPhase === 'ending') {
        if (clock - phaseStartedAtRef.current >= ENDING_FADE_SECONDS) {
          changePhase('exit', clock);
        }
      } else if (currentPhase === 'exit') {
        if (clock - phaseStartedAtRef.current >= EXIT_FADE_SECONDS) {
          onCloseRef.current();
          return;
        }
      }

      const beat = activeBeatRef.current;
      if (beat) {
        const progress = Math.max(0, Math.min((clock - beat.startedAt) / beat.revealSeconds, 1));
        const visible = Math.min(Array.from(beat.text).length, Math.floor(progress * Array.from(beat.text).length));
        if (visible !== visibleCharactersRef.current) {
          visibleCharactersRef.current = visible;
          setVisibleCharacters(visible);
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activateBeat, audioElement, changePhase]);

  const handleTouchAdvance = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    advanceRef.current();
  };

  const characterCount = activeBeat ? Array.from(activeBeat.text).length : 0;
  const revealedCharacters = Math.min(visibleCharacters, characterCount);
  const showJournal = phase === 'ending'
    || phase === 'exit'
    || (
      phase === 'light'
      && activeBeat?.section === 'light'
      && activeBeat.id !== LIGHT_BEATS[0].id
    );
  const showDialogue = activeBeat !== null
    && phase !== 'ending'
    && phase !== 'exit'
    && !(
      phase === 'light'
      && (activeBeat.section !== 'light' || activeBeat.id !== LIGHT_BEATS[0].id)
    );
  const accessibleText = showJournal
    ? `${LIGHT_BEATS.map((beat) => beat.text.replace(/\n/g, ' ')).join(' ')} Edith`
    : activeBeat?.text.replace(/\n/g, ' ') ?? '';

  return (
    <div
      ref={containerRef}
      className={`cinematic-experience cinematic-experience--${phase}`}
      data-testid="cinematic-overlay"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label="A quiet story"
      tabIndex={-1}
      onPointerUp={handleTouchAdvance}
    >
      <CinematicEnvironment
        phase={phase}
        cameraStep={cameraStep}
        reducedMotion={prefersReducedMotion}
      />
      <div className="cinematic-experience__scene">
        {showJournal && <JournalScene closed={phase === 'ending' || phase === 'exit'} />}
        {showDialogue && activeBeat && (
          <p
            key={activeBeat.id}
            className={[
              'cinematic-experience__copy',
              `cinematic-experience__copy--${activeBeat.placement}`,
              activeBeat.section === 'light' ? 'cinematic-experience__copy--paper' : '',
            ].filter(Boolean).join(' ')}
            data-testid="cinematic-dialogue"
            data-beat={activeBeat.id}
            style={{
              left: `${activeBeat.left}%`,
              top: `${activeBeat.top}%`,
              width: `min(${activeBeat.width}vw, 64rem)`,
              textAlign: activeBeat.align,
            }}
            aria-hidden="true"
          >
            {Array.from(activeBeat.text).map((character, index) => (
              character === '\n'
                ? <React.Fragment key={`${activeBeat.id}-${index}`}><br /></React.Fragment>
                : (
                  <span
                    key={`${activeBeat.id}-${index}`}
                    className="cinematic-experience__character"
                    data-revealed={index < revealedCharacters}
                  >
                    {character === ' ' ? '\u00a0' : character}
                  </span>
                )
            ))}
          </p>
        )}
        <span className="cinematic-experience__sr-only" aria-live="polite">
          {accessibleText}
        </span>
      </div>
      {audioUnavailable && (
        <p
          className="cinematic-experience__fallback"
          data-testid="cinematic-audio-fallback"
          role="status"
        >
          Audio could not be loaded. The story will continue silently.
        </p>
      )}
      <span className="cinematic-experience__press-count" aria-hidden="true">
        {phase === 'dark' && pressCount > 0 ? `${pressCount}` : ''}
      </span>
    </div>
  );
}

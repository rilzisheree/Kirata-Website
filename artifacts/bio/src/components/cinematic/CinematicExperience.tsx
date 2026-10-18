import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './cinematic-experience.css';

interface CinematicExperienceProps {
  audioElement: HTMLAudioElement | null;
  audioUnavailable: boolean;
  onAudioUnavailable: () => void;
  onClose: () => void;
}

type ScenePhase = 'opening' | 'dark' | 'to-light' | 'light' | 'ending' | 'exit';

const DIALOGUE = [
  'And appreciate how strange and brief all of this is',
  'This journal was supposed to be for you',
  "But now I hope you'll never see it",
  'I just want to meet you',
  'And tell you all these stories myself',
  "But I guess if you're reading this now...",
  "Things didn't work out that way",
  'This is where your story begins.',
  "I'm sorry I won't be there to see it.",
  "It's a lot to ask, but I don't want you to be sad that I'm gone.",
  'I want you to be amazed that any of us ever had a chance to be here at all.',
  'Good luck',
] as const;

// Cue offsets are seconds into the supplied, trimmed audio file (source 11.5s–82.5s).
// Adjust these values to tune each line against the final audio edit.
const CUE_SHEET_SECONDS = [0.5, 12.5, 16.5, 20.5, 24.5, 28.5, 32.5, 48.5, 50.5, 52.5, 54.5, 56.5];
const DARK_PRESS_COUNTS = [3, 3, 3, 3, 2, 1];
const CINEMATIC_AUDIO_VOLUME = 0.78;
const AUDIO_FADE_IN_MS = 1200;
const DARK_TO_LIGHT_DELAY_MS = 4100;
const LIGHT_ENDING_HOLD_MS = 5200;
const ENDING_DIM_MS = 7600;
const SCENE_FADE_MS = 1500;
const LINE_FADE_MS = 680;

export function CinematicExperience({
  audioElement,
  audioUnavailable,
  onAudioUnavailable,
  onClose,
}: CinematicExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<ScenePhase>('opening');
  const [lineIndex, setLineIndex] = useState(0);
  const [zoomStep, setZoomStep] = useState(0);
  const [endingOpacity, setEndingOpacity] = useState(1);
  const phaseRef = useRef<ScenePhase>('opening');
  const lineIndexRef = useRef(0);
  const pressesRef = useRef(0);
  const transitioningRef = useRef(true);
  const heldSpaceRef = useRef(false);
  const closingRef = useRef(false);
  const audioFadeInStartedRef = useRef(false);
  const appliedCueRef = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const timerRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const audioRef = useRef(audioElement);
  audioRef.current = audioElement;

  const introDuration = prefersReducedMotion ? 180 : SCENE_FADE_MS;
  const lineDuration = prefersReducedMotion ? 120 : LINE_FADE_MS;

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timerRefs.current.delete(timer);
      callback();
    }, delay);
    timerRefs.current.add(timer);
    return timer;
  }, []);

  const updatePhase = useCallback((next: ScenePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const closeExperience = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    transitioningRef.current = true;
    updatePhase('exit');
    schedule(() => onCloseRef.current(), prefersReducedMotion ? 180 : SCENE_FADE_MS);
  }, [prefersReducedMotion, schedule, updatePhase]);

  const activateLine = useCallback((nextIndex: number) => {
    lineIndexRef.current = nextIndex;
    setLineIndex(nextIndex);
    pressesRef.current = 0;
    transitioningRef.current = true;
    schedule(() => {
      if (!closingRef.current) transitioningRef.current = false;
    }, lineDuration);
  }, [lineDuration, schedule]);

  const advance = useCallback(() => {
    if (closingRef.current || transitioningRef.current) return;
    const currentPhase = phaseRef.current;
    const currentIndex = lineIndexRef.current;
    if (currentPhase === 'dark') {
      if (currentIndex >= 6) return;
      pressesRef.current += 1;
      setZoomStep((step) => step + 1);
      if (pressesRef.current >= DARK_PRESS_COUNTS[currentIndex]) {
        activateLine(currentIndex + 1);
      }
      return;
    }

  }, [activateLine]);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const closeExperienceRef = useRef(closeExperience);
  closeExperienceRef.current = closeExperience;

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
        closeExperienceRef.current();
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
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current.clear();
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // The host may have detached its media element during teardown.
        }
      }
    };
  }, []);

  useEffect(() => {
    schedule(() => {
      if (closingRef.current) return;
      updatePhase('dark');
      transitioningRef.current = false;
    }, introDuration);
  }, [introDuration, schedule, updatePhase]);

  useEffect(() => {
    const currentPhase = phase;
    const currentIndex = lineIndex;
    if ((currentPhase !== 'dark' && currentPhase !== 'light') || currentIndex >= DIALOGUE.length) return;

    const cueKey = `${currentPhase}-${currentIndex}`;
    if (appliedCueRef.current === cueKey) return;
    appliedCueRef.current = cueKey;
    if (!audioElement || audioUnavailable) return;

    if (currentPhase === 'dark' && currentIndex === 0 && !audioFadeInStartedRef.current) {
      audioFadeInStartedRef.current = true;
      audioElement.volume = 0;
      const fadeStartedAt = performance.now();
      const fadeTimer = window.setInterval(() => {
        const progress = Math.min((performance.now() - fadeStartedAt) / AUDIO_FADE_IN_MS, 1);
        audioElement.volume = CINEMATIC_AUDIO_VOLUME * progress;
        if (progress >= 1) {
          window.clearInterval(fadeTimer);
        }
      }, 40);
    }

    const cue = CUE_SHEET_SECONDS[currentIndex];
    try {
      if (Number.isFinite(cue) && Math.abs(audioElement.currentTime - cue) > 0.35) {
        audioElement.currentTime = cue;
      }
      if (audioElement.paused) {
        void audioElement.play().catch(onAudioUnavailable);
      }
    } catch {
      onAudioUnavailable();
    }
  }, [audioElement, audioUnavailable, lineIndex, onAudioUnavailable, phase]);

  useEffect(() => {
    if (phase !== 'dark' || lineIndex !== 6) return;
    transitioningRef.current = true;
    schedule(() => {
      if (closingRef.current) return;
      updatePhase('to-light');
      schedule(() => {
        if (closingRef.current) return;
        updatePhase('light');
        activateLine(7);
      }, prefersReducedMotion ? 180 : 3300);
    }, prefersReducedMotion ? 500 : DARK_TO_LIGHT_DELAY_MS);
  }, [activateLine, lineIndex, phase, prefersReducedMotion, schedule, updatePhase]);

  useEffect(() => {
    if (phase !== 'light' || lineIndex < 7 || lineIndex >= DIALOGUE.length - 1) return;

    const nextIndex = lineIndex + 1;
    const nextCue = CUE_SHEET_SECONDS[nextIndex];
    const currentCue = CUE_SHEET_SECONDS[lineIndex];
    const audio = audioRef.current;
    let advanced = false;

    const advanceOnce = () => {
      if (advanced || closingRef.current) return;
      advanced = true;
      activateLine(nextIndex);
    };
    const advanceAtAudioCue = () => {
      if (!audio || audio.currentTime >= nextCue - 0.12) advanceOnce();
    };

    if (audio && !audioUnavailable) {
      audio.addEventListener('timeupdate', advanceAtAudioCue);
      audio.addEventListener('seeked', advanceAtAudioCue);
    }

    // Keep the story moving if audio is unavailable or playback stalls.
    const fallbackDelay = Math.max(250, (nextCue - currentCue) * 1000 + 500);
    const fallbackTimer = schedule(advanceOnce, fallbackDelay);

    return () => {
      if (audio && !audioUnavailable) {
        audio.removeEventListener('timeupdate', advanceAtAudioCue);
        audio.removeEventListener('seeked', advanceAtAudioCue);
      }
      clearTimeout(fallbackTimer);
      timerRefs.current.delete(fallbackTimer);
    };
  }, [activateLine, audioUnavailable, lineIndex, phase, schedule]);

  useEffect(() => {
    if (phase !== 'light' || lineIndex !== DIALOGUE.length - 1) return;
    transitioningRef.current = true;
    schedule(() => {
      if (closingRef.current) return;
      updatePhase('ending');
      setEndingOpacity(0.24);
      schedule(() => {
        if (!closingRef.current) closeExperience();
      }, prefersReducedMotion ? 250 : ENDING_DIM_MS);
    }, prefersReducedMotion ? 400 : LIGHT_ENDING_HOLD_MS);
  }, [closeExperience, lineIndex, phase, prefersReducedMotion, schedule, updatePhase]);

  useEffect(() => {
    if (phase !== 'light' || lineIndex !== DIALOGUE.length - 1 || !audioElement || audioUnavailable) return;

    const holdDuration = prefersReducedMotion ? 400 : LIGHT_ENDING_HOLD_MS;
    const dimDuration = prefersReducedMotion ? 250 : ENDING_DIM_MS;
    const exitDuration = prefersReducedMotion ? 180 : SCENE_FADE_MS;
    const fadeDuration = holdDuration + dimDuration + exitDuration;
    const initialVolume = audioElement.volume;
    const startedAt = performance.now();
    const fadeTimer = window.setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / fadeDuration, 1);
      audioElement.volume = initialVolume * (1 - progress);
      if (progress >= 1) window.clearInterval(fadeTimer);
    }, 80);

    return () => window.clearInterval(fadeTimer);
  }, [audioElement, audioUnavailable, lineIndex, phase, prefersReducedMotion]);

  const handleTouchAdvance = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    advance();
  };

  const darkScene = phase === 'opening' || phase === 'dark' || phase === 'to-light';
  const backgroundColor = phase === 'light'
    ? '#f7f5ef'
    : phase === 'ending'
      ? '#050406'
      : phase === 'to-light'
        ? '#f7f5ef'
        : '#09080d';
  const transformScale = 1 + Math.min(zoomStep * 0.0045, 0.065);
  const isLineVisible = phase === 'dark' || phase === 'light' || phase === 'ending';
  const dialogue = DIALOGUE[lineIndex] ?? '';

  return (
    <motion.div
      ref={containerRef}
      className={[
        'cinematic-experience',
        darkScene ? 'cinematic-experience--dark' : '',
        phase === 'opening' ? 'cinematic-experience--opening' : '',
        phase === 'light' ? 'cinematic-experience--light' : '',
        phase === 'ending' ? 'cinematic-experience--ending' : '',
      ].filter(Boolean).join(' ')}
      data-testid="cinematic-overlay"
      initial={{ opacity: 0, backgroundColor: '#09080d' }}
      animate={{
        opacity: phase === 'exit' ? 0 : 1,
        backgroundColor,
      }}
      transition={{
        opacity: { duration: phase === 'opening' ? introDuration / 1000 : (prefersReducedMotion ? 0.18 : 1.5), ease: 'easeInOut' },
        backgroundColor: {
          duration: phase === 'to-light' ? (prefersReducedMotion ? 0.18 : 3.3) : phase === 'ending' ? (prefersReducedMotion ? 0.25 : ENDING_DIM_MS / 1000) : 0,
          ease: 'easeInOut',
        },
      }}
      onPointerUp={handleTouchAdvance}
      role="dialog"
      aria-modal="true"
      aria-label="A quiet story"
      tabIndex={-1}
    >
      <motion.div
        className="cinematic-experience__scene"
        data-testid="cinematic-scene"
        animate={{ scale: transformScale }}
        transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className="cinematic-experience__glow" aria-hidden="true" />
        <div className="cinematic-experience__glyphs" aria-hidden="true">
          <span className="cinematic-experience__glyph">a</span>
          <span className="cinematic-experience__glyph">r</span>
          <span className="cinematic-experience__glyph">m</span>
          <span className="cinematic-experience__glyph">s</span>
        </div>
        {isLineVisible && (
          <motion.p
            key={lineIndex}
            className="cinematic-experience__copy"
            data-testid="cinematic-dialogue"
            aria-live="polite"
            initial={{ opacity: 0, y: 5 }}
            animate={{
              opacity: phase === 'ending' ? endingOpacity : 1,
              color: phase === 'ending' ? '#b8b1be' : undefined,
              y: 0,
            }}
            transition={{
              opacity: { duration: phase === 'ending' ? ENDING_DIM_MS / 1000 : lineDuration / 1000, ease: 'easeOut' },
              color: { duration: phase === 'ending' ? ENDING_DIM_MS / 1000 : 0 },
              y: { duration: lineDuration / 1000, ease: 'easeOut' },
            }}
          >
            {dialogue}
          </motion.p>
        )}
      </motion.div>
      {audioUnavailable && (
        <p className="cinematic-experience__fallback" data-testid="cinematic-audio-fallback" role="status">
          Audio is unavailable for this story.
        </p>
      )}
    </motion.div>
  );
}

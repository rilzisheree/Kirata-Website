import { useEffect, useRef } from 'react';
import type { CinematicPhase, CinematicTimeline } from './CinematicExperience';

interface CinematicEnvironmentProps {
  phase: CinematicPhase;
  cameraStep: number;
  reducedMotion: boolean;
  timelineRef: { readonly current: CinematicTimeline };
}

interface PurpleFrame {
  time: number;
  x: number;
  y: number;
  aura: number;
  brightness: number;
  core: number;
  rings: number;
  ringOpacity: number;
}

interface EnvironmentalLetter {
  character: string;
  start: number;
  duration: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  size: number;
  rotation: number;
}

const PURPLE_FRAMES: PurpleFrame[] = [
  { time: 0, x: 0.2, y: 0.29, aura: 0.34, brightness: 0.58, core: 0, rings: 0, ringOpacity: 0 },
  { time: 6, x: 0.49, y: 0.44, aura: 0.1, brightness: 0.08, core: 0, rings: 0, ringOpacity: 0 },
  { time: 12, x: 0.6, y: 0.38, aura: 0.22, brightness: 0.28, core: 0, rings: 0, ringOpacity: 0 },
  { time: 18, x: 0.79, y: 0.31, aura: 0.34, brightness: 0.8, core: 0, rings: 0, ringOpacity: 0 },
  { time: 24, x: 0.5, y: 0.54, aura: 0.38, brightness: 0.68, core: 0.006, rings: 0.035, ringOpacity: 0.1 },
  { time: 30, x: 0.5, y: 0.54, aura: 0.43, brightness: 0.78, core: 0.009, rings: 0.075, ringOpacity: 0.12 },
  { time: 36, x: 0.5, y: 0.54, aura: 0.47, brightness: 0.86, core: 0.012, rings: 0.105, ringOpacity: 0.14 },
  { time: 42, x: 0.5, y: 0.54, aura: 0.5, brightness: 0.9, core: 0.015, rings: 0.14, ringOpacity: 0.15 },
  { time: 48, x: 0.5, y: 0.54, aura: 0.56, brightness: 0.92, core: 0.019, rings: 0.2, ringOpacity: 0.17 },
  { time: 54, x: 0.5, y: 0.54, aura: 0.63, brightness: 0.96, core: 0.027, rings: 0.27, ringOpacity: 0.2 },
  { time: 60, x: 0.5, y: 0.54, aura: 0.7, brightness: 1, core: 0.037, rings: 0.34, ringOpacity: 0.22 },
  { time: 66, x: 0.5, y: 0.54, aura: 0.78, brightness: 1, core: 0.05, rings: 0.43, ringOpacity: 0.24 },
  { time: 70, x: 0.5, y: 0.54, aura: 0.8, brightness: 1, core: 0.052, rings: 0.45, ringOpacity: 0.24 },
];

const ENVIRONMENTAL_LETTERS: EnvironmentalLetter[] = [
  { character: 'W', start: 16.2, duration: 8.4, fromX: 0.95, fromY: -0.08, toX: 0.85, toY: 0.16, size: 0.12, rotation: 0.42 },
  { character: 'I', start: 23.5, duration: 10, fromX: 0.08, fromY: 0.08, toX: 0.2, toY: 0.3, size: 0.08, rotation: -0.34 },
  { character: 'A', start: 43, duration: 12, fromX: 0.91, fromY: 0.16, toX: 0.75, toY: 0.34, size: 0.1, rotation: 0.6 },
  { character: 'E', start: 53, duration: 13, fromX: 0.17, fromY: -0.04, toX: 0.3, toY: 0.18, size: 0.07, rotation: -0.48 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

function readPurpleFrame(time: number): PurpleFrame {
  const nextIndex = PURPLE_FRAMES.findIndex((frame) => frame.time >= time);
  if (nextIndex < 0) return PURPLE_FRAMES[PURPLE_FRAMES.length - 1];
  if (nextIndex === 0) return PURPLE_FRAMES[0];

  const from = PURPLE_FRAMES[nextIndex - 1];
  const to = PURPLE_FRAMES[nextIndex];
  const rawProgress = clamp((time - from.time) / (to.time - from.time), 0, 1);
  const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
  const mix = (key: Exclude<keyof PurpleFrame, 'time'>) =>
    from[key] + (to[key] - from[key]) * progress;

  return {
    time,
    x: mix('x'),
    y: mix('y'),
    aura: mix('aura'),
    brightness: mix('brightness'),
    core: mix('core'),
    rings: mix('rings'),
    ringOpacity: mix('ringOpacity'),
  };
}

export function CinematicEnvironment({
  phase,
  cameraStep,
  reducedMotion,
  timelineRef,
}: CinematicEnvironmentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase, cameraStep, reducedMotion });
  stateRef.current = { phase, cameraStep, reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return;

    let frame = 0;
    let width = 1;
    let height = 1;
    let pixelRatio = 1;

    const resize = () => {
      width = Math.max(1, canvas.clientWidth || window.innerWidth);
      height = Math.max(1, canvas.clientHeight || window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    };

    const draw = () => {
      const state = stateRef.current;
      const timeline = timelineRef.current;
      const time = timeline.clock;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      context.filter = 'none';

      if (state.phase === 'light' || state.phase === 'ending' || state.phase === 'exit') {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
        frame = window.requestAnimationFrame(draw);
        return;
      }

      context.fillStyle = '#020106';
      context.fillRect(0, 0, width, height);

      const scene = readPurpleFrame(time);
      const centerX = width * scene.x;
      const centerY = height * scene.y;
      const minDimension = Math.min(width, height);
      const reveal = state.phase === 'opening' ? timeline.openingReveal : 1;
      const travel = state.reducedMotion
        ? state.cameraStep
        : state.cameraStep === 0
          ? 0
          : state.cameraStep - 1 + clamp(
            (time - timeline.cameraStepStartedAt) / 0.42,
            0,
            1,
          );

      context.globalAlpha = reveal;

      const auraRadius = minDimension * scene.aura * (1 + Math.min(travel, 5) * 0.025);
      const aura = context.createRadialGradient(
        centerX,
        centerY,
        Math.max(1, minDimension * 0.006),
        centerX,
        centerY,
        Math.max(1, auraRadius),
      );
      aura.addColorStop(0, `rgba(193, 96, 255, ${0.42 * scene.brightness})`);
      aura.addColorStop(0.2, `rgba(130, 35, 206, ${0.32 * scene.brightness})`);
      aura.addColorStop(0.54, `rgba(68, 14, 128, ${0.2 * scene.brightness})`);
      aura.addColorStop(1, 'rgba(14, 4, 31, 0)');
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      if (scene.rings > 0) {
        const ringRadius = minDimension * scene.rings;
        context.save();
        context.globalCompositeOperation = 'screen';
        for (let ring = 1; ring <= 5; ring += 1) {
          const radius = ringRadius * ring * 0.205;
          const alpha = scene.ringOpacity * (1 - (ring - 1) * 0.14);
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, Math.PI * 2);
          context.strokeStyle = `rgba(181, 47, 246, ${alpha})`;
          context.lineWidth = Math.max(1, minDimension * 0.0018);
          context.stroke();
        }
        context.restore();
      }

      for (const letter of ENVIRONMENTAL_LETTERS) {
        const progress = clamp((time - letter.start) / letter.duration, 0, 1);
        if (progress <= 0 || progress >= 1) continue;
        const ease = progress * progress * (3 - 2 * progress);
        const x = width * (letter.fromX + (letter.toX - letter.fromX) * ease);
        const y = height * (letter.fromY + (letter.toY - letter.fromY) * ease);
        const size = minDimension * letter.size * (0.85 + progress * 0.45);
        const alpha = reveal * Math.sin(Math.PI * progress) * 0.34;

        context.save();
        context.translate(x, y);
        context.rotate(letter.rotation * (1 - progress * 0.35));
        context.font = `600 ${size}px "Patrick Hand", cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = `rgba(5, 1, 13, ${alpha})`;
        context.fillText(letter.character, 0, 0);
        context.restore();
      }

      if (scene.core > 0) {
        const coreRadius = Math.max(1, minDimension * scene.core);
        const coreGlow = context.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          coreRadius * 7,
        );
        coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.9 * scene.brightness})`);
        coreGlow.addColorStop(0.1, `rgba(255, 225, 255, ${0.82 * scene.brightness})`);
        coreGlow.addColorStop(0.28, `rgba(239, 123, 255, ${0.58 * scene.brightness})`);
        coreGlow.addColorStop(0.58, `rgba(190, 35, 246, ${0.22 * scene.brightness})`);
        coreGlow.addColorStop(1, 'rgba(117, 16, 193, 0)');
        context.save();
        context.globalCompositeOperation = 'screen';
        context.fillStyle = coreGlow;
        context.beginPath();
        context.arc(centerX, centerY, coreRadius * 7, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(255, 245, 255, ${0.88 * scene.brightness})`;
        context.beginPath();
        context.arc(centerX, centerY, coreRadius * 0.34, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (state.phase === 'to-light') {
        context.globalAlpha = timeline.lightTransitionProgress;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, width, height);
      }

      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    void document.fonts?.load('16px "Patrick Hand"');
    window.addEventListener('resize', resize);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [timelineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="cinematic-experience__environment"
      data-testid="cinematic-environment"
      aria-hidden="true"
    />
  );
}

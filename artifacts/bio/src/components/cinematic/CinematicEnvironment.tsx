import { useEffect, useRef } from 'react';
import type { CinematicPhase, CinematicTimeline } from './CinematicExperience';
import {
  FLOATING_LETTER_COUNT,
  getFloatingLetterPose,
} from './CinematicTunnel';

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

function drawTunnel(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  scene: PurpleFrame,
  motionTime: number,
  cameraStep: number,
  reducedMotion: boolean,
) {
  const minDimension = Math.min(width, height);
  const ringCount = 16;
  const sliceCount = 12;
  const flowSpeed = reducedMotion ? 0.018 : 0.052;
  const phase = ((motionTime * flowSpeed + cameraStep * 0.04) % 1 + 1) % 1;
  const rings = Array.from({ length: ringCount }, (_, index) => {
    const depth = (index + phase) / ringCount;
    const perspective = Math.pow(depth, 1.62);
    return {
      depth,
      radiusX: minDimension * (0.018 + perspective * 1.03),
      radiusY: minDimension * (0.014 + perspective * 0.72),
    };
  });

  context.save();
  context.globalCompositeOperation = 'source-over';

  for (let layer = 0; layer < rings.length - 1; layer += 1) {
    const far = rings[layer];
    const near = rings[layer + 1];

    for (let slice = 0; slice < sliceCount; slice += 1) {
      const startAngle = (slice / sliceCount) * Math.PI * 2;
      const endAngle = ((slice + 1) / sliceCount) * Math.PI * 2;
      const shimmer = 0.5 + 0.5 * Math.sin(slice * 2.1 + layer * 0.73 + motionTime * 0.4);
      const alpha = (0.025 + near.depth * 0.065 + shimmer * 0.018) * scene.brightness;
      const alternate = (slice + layer) % 3 === 0;

      context.beginPath();
      context.ellipse(centerX, centerY, near.radiusX, near.radiusY, 0, startAngle, endAngle);
      context.lineTo(
        centerX + Math.cos(endAngle) * far.radiusX,
        centerY + Math.sin(endAngle) * far.radiusY,
      );
      context.ellipse(
        centerX,
        centerY,
        far.radiusX,
        far.radiusY,
        0,
        endAngle,
        startAngle,
        true,
      );
      context.closePath();
      context.fillStyle = alternate
        ? `rgba(98, 35, 148, ${alpha})`
        : `rgba(49, 14, 87, ${alpha * 1.35})`;
      context.fill();
    }
  }

  context.globalCompositeOperation = 'screen';
  for (let index = 0; index < rings.length; index += 1) {
    const ring = rings[index];
    const pulse = 0.8 + Math.sin(motionTime * 0.52 - index * 0.48) * 0.2;
    context.beginPath();
    context.ellipse(centerX, centerY, ring.radiusX, ring.radiusY, 0, 0, Math.PI * 2);
    context.strokeStyle =
      `rgba(177, 104, 255, ${(0.035 + ring.depth * 0.15) * scene.brightness * pulse})`;
    context.lineWidth = 0.75 + ring.depth * Math.max(1, minDimension * 0.004);
    context.shadowColor = '#a84aff';
    context.shadowBlur = 1 + ring.depth * minDimension * 0.018;
    context.stroke();
  }

  context.shadowBlur = 0;
  const railCount = 10;
  for (let rail = 0; rail < railCount; rail += 1) {
    const baseAngle = (rail / railCount) * Math.PI * 2;
    context.beginPath();

    for (let index = 0; index < rings.length; index += 1) {
      const ring = rings[index];
      const sway = Math.sin(ring.depth * 4 + motionTime * 0.22 + rail) * ring.depth * 0.075;
      const angle = baseAngle + sway;
      const x = centerX + Math.cos(angle) * ring.radiusX;
      const y = centerY + Math.sin(angle) * ring.radiusY;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.strokeStyle = `rgba(202, 145, 255, ${0.09 * scene.brightness})`;
    context.lineWidth = 0.8 + Math.sin(baseAngle * 3) * 0.25;
    context.stroke();
  }

  context.restore();
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
      const sceneTime = timeline.clock;
      const motionTime = timeline.motionClock;

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

      const scene = readPurpleFrame(sceneTime);
      const centerX = width * scene.x;
      const centerY = height * scene.y;
      const minDimension = Math.min(width, height);
      const reveal = state.phase === 'opening' ? timeline.openingReveal : 1;
      const tunnelGlow = context.createRadialGradient(
        centerX,
        centerY,
        Math.max(1, minDimension * 0.012),
        centerX,
        centerY,
        minDimension * 0.88,
      );
      tunnelGlow.addColorStop(0, `rgba(126, 42, 199, ${0.28 * scene.brightness})`);
      tunnelGlow.addColorStop(0.3, `rgba(69, 22, 121, ${0.22 * scene.brightness})`);
      tunnelGlow.addColorStop(0.72, `rgba(29, 9, 55, ${0.13 * scene.brightness})`);
      tunnelGlow.addColorStop(1, 'rgba(7, 3, 14, 0)');
      context.globalAlpha = reveal;
      context.fillStyle = tunnelGlow;
      context.fillRect(0, 0, width, height);

      drawTunnel(
        context,
        width,
        height,
        centerX,
        centerY,
        scene,
        motionTime,
        state.cameraStep,
        state.reducedMotion,
      );

      const reservedLetters = new Set(timeline.assemblyGlyphIndices);
      const bounds = timeline.dialogueBounds;
      for (let index = 0; index < FLOATING_LETTER_COUNT; index += 1) {
        if (reservedLetters.has(index)) continue;
        const letter = getFloatingLetterPose(
          index,
          motionTime,
          width,
          height,
          state.cameraStep,
          state.reducedMotion,
        );
        if (
          bounds
          && letter.x >= bounds.left
          && letter.x <= bounds.right
          && letter.y >= bounds.top
          && letter.y <= bounds.bottom
        ) {
          continue;
        }

        context.save();
        context.globalAlpha = letter.opacity * (0.45 + scene.brightness * 0.55) * reveal;
        context.translate(letter.x, letter.y);
        context.rotate(letter.rotation);
        context.font = `600 ${letter.size}px "Patrick Hand", cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = letter.color;
        context.shadowColor = letter.color;
        context.shadowBlur = Math.min(letter.size * 0.24, minDimension * 0.02);
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

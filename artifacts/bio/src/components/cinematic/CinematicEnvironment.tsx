import { useEffect, useRef } from 'react';
import type { CinematicPhase } from './CinematicExperience';

interface CinematicEnvironmentProps {
  phase: CinematicPhase;
  cameraStep: number;
  reducedMotion: boolean;
}

interface FloatingGlyph {
  angle: number;
  radius: number;
  depth: number;
  speed: number;
  rotation: number;
  spin: number;
  character: string;
}

const GLYPH_SET = 'abcdefghjkmnpqrstuvwxyz0123456789+−×=';
const GLYPH_COUNT = 64;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function CinematicEnvironment({
  phase,
  cameraStep,
  reducedMotion,
}: CinematicEnvironmentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase, cameraStep, reducedMotion });
  stateRef.current = { phase, cameraStep, reducedMotion };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return;

    let frame = 0;
    let lastFrameAt = 0;
    let phaseStartedAt = performance.now();
    let lastPhase = stateRef.current.phase;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let easedCameraStep = stateRef.current.cameraStep;

    const glyphs: FloatingGlyph[] = Array.from({ length: GLYPH_COUNT }, () => ({
      angle: randomBetween(0, Math.PI * 2),
      radius: randomBetween(0.22, 2.4),
      depth: randomBetween(0.55, 8.5),
      speed: randomBetween(0.18, 0.42),
      rotation: randomBetween(-Math.PI, Math.PI),
      spin: randomBetween(-0.16, 0.16),
      character: GLYPH_SET[Math.floor(Math.random() * GLYPH_SET.length)],
    }));

    const resize = () => {
      width = Math.max(1, canvas.clientWidth || window.innerWidth);
      height = Math.max(1, canvas.clientHeight || window.innerHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
    };

    const draw = (now: number) => {
      const state = stateRef.current;
      const elapsed = lastFrameAt ? Math.min((now - lastFrameAt) / 1000, 0.05) : 0;
      lastFrameAt = now;

      if (state.phase !== lastPhase) {
        lastPhase = state.phase;
        phaseStartedAt = now;
      }

      if (canvas.width !== Math.round((canvas.clientWidth || window.innerWidth) * pixelRatio)
        || canvas.height !== Math.round((canvas.clientHeight || window.innerHeight) * pixelRatio)) {
        resize();
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.filter = 'none';
      context.fillStyle = '#05030b';
      context.fillRect(0, 0, width, height);

      if (state.phase === 'light' || state.phase === 'ending' || state.phase === 'exit') {
        if (state.reducedMotion) return;
        frame = window.requestAnimationFrame(draw);
        return;
      }

      const dt = state.reducedMotion ? 0 : elapsed;
      const minDimension = Math.min(width, height);
      const centerX = width * 0.5;
      const centerY = height * 0.535;
      const travel = state.reducedMotion
        ? state.cameraStep
        : (easedCameraStep += (state.cameraStep - easedCameraStep) * (1 - Math.exp(-dt * 3.2)));
      const advance = Math.min(travel / 16, 1);
      const openingReveal = state.phase === 'opening'
        ? Math.min((now - phaseStartedAt) / 3200, 1)
        : 1;
      const light = 0.12 + advance * 0.78;
      const pulse = state.reducedMotion ? 0 : Math.sin(now * 0.00055) * 0.018;
      const rotation = state.reducedMotion ? 0 : now * 0.000045 + travel * 0.025;
      const radius = Math.max(width, height) * 0.72;

      const ambient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      ambient.addColorStop(0, `rgba(231, 185, 255, ${(0.05 + light * 0.22 + pulse) * openingReveal})`);
      ambient.addColorStop(0.025, `rgba(192, 61, 255, ${(0.16 + light * 0.3) * openingReveal})`);
      ambient.addColorStop(0.11, `rgba(105, 20, 165, ${(0.26 + light * 0.28) * openingReveal})`);
      ambient.addColorStop(0.31, `rgba(53, 19, 91, ${(0.37 + light * 0.12) * openingReveal})`);
      ambient.addColorStop(0.62, `rgba(20, 10, 39, ${0.72 * openingReveal})`);
      ambient.addColorStop(1, '#05030b');
      context.fillStyle = ambient;
      context.fillRect(0, 0, width, height);

      // Concentric, imperfect rings establish the deep, lens-like tunnel in the reference.
      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotation * 0.24);
      context.globalCompositeOperation = 'screen';
      for (let index = 0; index < 13; index += 1) {
        const fraction = (index + 1) / 13;
        const ringRadius = minDimension * (0.035 + fraction * (0.42 + advance * 0.08));
        const wobble = state.reducedMotion ? 0 : Math.sin(now * 0.0003 + index * 1.7) * minDimension * 0.003;
        context.beginPath();
        context.ellipse(
          Math.cos(index * 1.6 + rotation) * wobble,
          Math.sin(index * 1.2 + rotation) * wobble,
          ringRadius * (1.35 + Math.sin(index * 0.7) * 0.025),
          ringRadius * 0.76,
          rotation * 0.11 + Math.sin(index * 0.8) * 0.025,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(175, 72, 238, ${(0.035 + (1 - fraction) * 0.085) * openingReveal})`;
        context.lineWidth = 0.7 + (1 - fraction) * (1.2 + advance * 1.6);
        context.stroke();
      }

      // A soft spiral gives the rings a forward-flowing, non-static shape.
      context.beginPath();
      for (let index = 0; index <= 320; index += 1) {
        const progress = index / 320;
        const spiralAngle = progress * Math.PI * 10 + rotation;
        const spiralRadius = minDimension * (0.012 + progress * (0.42 + advance * 0.1));
        const x = Math.cos(spiralAngle) * spiralRadius * 1.24;
        const y = Math.sin(spiralAngle) * spiralRadius * 0.76;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(185, 92, 244, ${(0.025 + advance * 0.075) * openingReveal})`;
      context.lineWidth = 1.1 + advance * 1.1;
      context.stroke();
      context.restore();

      // The distant core grows brighter as each key press moves the camera forward.
      const coreRadius = minDimension * (0.035 + advance * 0.045 + Math.max(pulse, 0));
      const core = context.createRadialGradient(centerX, centerY, 1, centerX, centerY, coreRadius * 2.8);
      core.addColorStop(0, `rgba(255, 247, 255, ${(0.12 + advance * 0.72) * openingReveal})`);
      core.addColorStop(0.15, `rgba(235, 172, 255, ${(0.18 + advance * 0.55) * openingReveal})`);
      core.addColorStop(0.5, `rgba(176, 63, 236, ${(0.1 + advance * 0.24) * openingReveal})`);
      core.addColorStop(1, 'rgba(146, 47, 206, 0)');
      context.fillStyle = core;
      context.fillRect(centerX - coreRadius * 3, centerY - coreRadius * 3, coreRadius * 6, coreRadius * 6);

      const lens = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 0.42);
      lens.addColorStop(0, `rgba(255, 250, 255, ${0.25 + advance * 0.68})`);
      lens.addColorStop(0.22, `rgba(255, 224, 255, ${0.14 + advance * 0.45})`);
      lens.addColorStop(1, 'rgba(224, 153, 255, 0)');
      context.fillStyle = lens;
      context.beginPath();
      context.ellipse(centerX, centerY, coreRadius * 0.27, coreRadius * 0.48, 0, 0, Math.PI * 2);
      context.fill();

      // Vignette keeps the eye on the small center of light rather than the edges.
      const vignette = context.createRadialGradient(
        centerX,
        centerY,
        minDimension * 0.12,
        centerX,
        centerY,
        Math.max(width, height) * 0.76,
      );
      vignette.addColorStop(0, 'rgba(2, 1, 8, 0)');
      vignette.addColorStop(0.55, 'rgba(3, 2, 10, 0.08)');
      vignette.addColorStop(1, 'rgba(1, 1, 5, 0.82)');
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      const focalLength = minDimension * (0.64 + advance * 0.08);
      for (const glyph of glyphs) {
        if (!state.reducedMotion) {
          glyph.depth -= dt * glyph.speed * (1 + advance * 0.16);
          glyph.angle += dt * (0.006 + glyph.spin * 0.045);
          glyph.rotation += dt * glyph.spin;
        }
        if (glyph.depth < 0.42) {
          glyph.depth = randomBetween(7.2, 9.2);
          glyph.angle = randomBetween(0, Math.PI * 2);
          glyph.radius = randomBetween(0.18, 2.3);
          glyph.character = GLYPH_SET[Math.floor(Math.random() * GLYPH_SET.length)];
          glyph.speed = randomBetween(0.18, 0.42);
          glyph.rotation = randomBetween(-Math.PI, Math.PI);
        }

        const angle = glyph.angle + rotation * 0.32;
        const projectedRadius = glyph.radius * focalLength / glyph.depth;
        const x = centerX + Math.cos(angle) * projectedRadius;
        const y = centerY + Math.sin(angle) * projectedRadius * 0.7;
        if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;

        const fontSize = Math.max(9, Math.min(96, minDimension * 0.035 / glyph.depth));
        const opacity = Math.max(0.035, Math.min(0.34, (1 - glyph.depth / 10) * (0.17 + advance * 0.12)));
        context.save();
        context.translate(x, y);
        context.rotate(glyph.rotation + Math.sin(angle) * 0.08);
        context.font = `${fontSize}px "Patrick Hand", cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = `rgba(13, 8, 24, ${opacity})`;
        context.fillText(glyph.character, 0, 0);
        context.restore();
      }

      if (!state.reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cinematic-experience__environment"
      data-testid="cinematic-environment"
      aria-hidden="true"
    />
  );
}

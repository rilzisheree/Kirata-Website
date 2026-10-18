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

const GLYPH_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+−×=?!';
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
      speed: randomBetween(0.38, 0.92),
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
      if (state.phase === 'light') {
        context.fillStyle = '#f3f1f1';
        context.fillRect(0, 0, width, height);
        frame = window.requestAnimationFrame(draw);
        return;
      }

      if (state.phase === 'ending' || state.phase === 'exit') {
        const garden = context.createLinearGradient(0, 0, 0, height);
        garden.addColorStop(0, '#24311d');
        garden.addColorStop(0.55, '#141f14');
        garden.addColorStop(1, '#080e0a');
        context.fillStyle = garden;
        context.fillRect(0, 0, width, height);
        frame = window.requestAnimationFrame(draw);
        return;
      }

      context.fillStyle = '#05030b';
      context.fillRect(0, 0, width, height);

      const dt = state.reducedMotion ? 0 : elapsed;
      const minDimension = Math.min(width, height);
      const centerX = width * 0.5;
      const centerY = height * 0.535;
      const travel = state.reducedMotion
        ? state.cameraStep
        : (easedCameraStep += (state.cameraStep - easedCameraStep) * (1 - Math.exp(-dt * 3.2)));
      const advance = Math.min(travel / 16, 1);
      const tunnelReveal = state.phase === 'opening' ? 0.14 : 1;
      const openingReveal = state.phase === 'opening'
        ? Math.min((now - phaseStartedAt) / 1600, 1)
        : 1;
      const light = state.phase === 'opening' ? 0.08 : 0.18 + advance * 0.78;
      const pulse = state.reducedMotion ? 0 : Math.sin(now * 0.00055) * 0.025;
      const rotation = state.reducedMotion ? 0 : now * 0.00004 + travel * 0.035;
      const radius = Math.max(width, height) * 0.72;

      const ambient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      ambient.addColorStop(0, `rgba(243, 204, 255, ${(0.06 + light * 0.22 + pulse) * openingReveal})`);
      ambient.addColorStop(0.025, `rgba(183, 48, 232, ${(0.18 + light * 0.34) * openingReveal})`);
      ambient.addColorStop(0.11, `rgba(105, 23, 164, ${(0.3 + light * 0.3) * openingReveal})`);
      ambient.addColorStop(0.31, `rgba(51, 22, 93, ${(0.4 + light * 0.12) * openingReveal})`);
      ambient.addColorStop(0.62, `rgba(19, 11, 41, ${0.78 * openingReveal})`);
      ambient.addColorStop(1, '#05030b');
      context.fillStyle = ambient;
      context.fillRect(0, 0, width, height);

      // Soft, uneven rings give the dark field the depth of the reference tunnel.
      context.save();
      context.translate(centerX, centerY);
      context.rotate(rotation * 0.24);
      context.globalCompositeOperation = 'screen';
      context.filter = 'blur(3px)';
      for (let index = 0; index < 9; index += 1) {
        const fraction = (index + 1) / 9;
        const ringRadius = minDimension * (0.045 + fraction * (0.4 + advance * 0.13));
        const wobble = state.reducedMotion ? 0 : Math.sin(now * 0.00031 + index * 1.9) * minDimension * 0.006;
        context.beginPath();
        context.ellipse(
          Math.cos(index * 1.6 + rotation) * wobble,
          Math.sin(index * 1.2 + rotation) * wobble,
          ringRadius * (1.3 + Math.sin(index * 0.7) * 0.05),
          ringRadius * (0.73 + Math.cos(index * 0.53) * 0.04),
          rotation * 0.1 + Math.sin(index * 0.8) * 0.04,
          0,
          Math.PI * 2,
        );
        context.strokeStyle = `rgba(184, 71, 243, ${(0.055 + (1 - fraction) * 0.12) * openingReveal * tunnelReveal})`;
        context.lineWidth = 2 + (1 - fraction) * (4 + advance * 7);
        context.stroke();
      }
      context.restore();
      context.filter = 'none';

      // The distant core grows brighter as each key press moves the camera forward.
      const coreRadius = minDimension * (0.032 + advance * 0.065 + Math.max(pulse, 0));
      const core = context.createRadialGradient(centerX, centerY, 1, centerX, centerY, coreRadius * 2.8);
      core.addColorStop(0, `rgba(255, 247, 255, ${(0.1 + advance * 0.78) * openingReveal * tunnelReveal})`);
      core.addColorStop(0.15, `rgba(235, 172, 255, ${(0.2 + advance * 0.58) * openingReveal * tunnelReveal})`);
      core.addColorStop(0.5, `rgba(190, 48, 244, ${(0.13 + advance * 0.3) * openingReveal * tunnelReveal})`);
      core.addColorStop(1, 'rgba(146, 47, 206, 0)');
      context.fillStyle = core;
      context.fillRect(centerX - coreRadius * 3, centerY - coreRadius * 3, coreRadius * 6, coreRadius * 6);

      const lens = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 0.42);
      lens.addColorStop(0, `rgba(255, 250, 255, ${(0.25 + advance * 0.68) * openingReveal * tunnelReveal})`);
      lens.addColorStop(0.22, `rgba(255, 224, 255, ${(0.14 + advance * 0.45) * openingReveal * tunnelReveal})`);
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

      const focalLength = minDimension * (0.64 + advance * 0.48);
      for (const glyph of glyphs) {
        if (!state.reducedMotion) {
          glyph.depth -= dt * glyph.speed * (1 + advance * 0.16);
          glyph.angle += dt * (0.012 + glyph.spin * 0.12);
          glyph.rotation += dt * glyph.spin;
        }
        if (glyph.depth < 0.42) {
          glyph.depth = randomBetween(7.2, 9.2);
          glyph.angle = randomBetween(0, Math.PI * 2);
          glyph.radius = randomBetween(0.18, 2.3);
          glyph.character = GLYPH_SET[Math.floor(Math.random() * GLYPH_SET.length)];
          glyph.speed = randomBetween(0.38, 0.92);
          glyph.rotation = randomBetween(-Math.PI, Math.PI);
        }

        const angle = glyph.angle + rotation * 0.32;
        const projectedRadius = glyph.radius * focalLength / glyph.depth;
        const x = centerX + Math.cos(angle) * projectedRadius;
        const y = centerY + Math.sin(angle) * projectedRadius * 0.7;
        if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;

        const fontSize = Math.max(9, Math.min(96, minDimension * 0.035 / glyph.depth));
        const depthOpacity = Math.max(0.045, Math.min(0.48, (1 - glyph.depth / 10) * (0.25 + advance * 0.18)));
        const coreProximity = Math.max(0, 1 - Math.hypot(x - centerX, (y - centerY) * 1.25) / (minDimension * 0.58));
        const foregroundLight = Math.max(0, Math.min(1, (4.3 - glyph.depth) / 3.8)) * (0.24 + coreProximity * 0.76);
        const opacity = depthOpacity * openingReveal;
        context.save();
        context.translate(x, y);
        context.rotate(glyph.rotation + Math.sin(angle) * 0.08);
        context.font = `${fontSize}px "Patrick Hand", cursive`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = foregroundLight > 0.18
          ? `rgba(255, 244, 255, ${opacity * foregroundLight})`
          : `rgba(12, 6, 23, ${opacity})`;
        context.fillText(glyph.character, 0, 0);
        context.restore();
      }

      if (state.phase === 'to-light') {
        const whiteProgress = Math.max(0, Math.min((now - phaseStartedAt) / 3350, 1));
        context.fillStyle = `rgba(255, 248, 255, ${whiteProgress})`;
        context.fillRect(0, 0, width, height);
      }

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

export const FLOATING_LETTER_COUNT = 96;

export interface FloatingLetterPose {
  character: string;
  x: number;
  y: number;
  depth: number;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
}

interface FloatingLetterProfile {
  character: string;
  seed: number;
  angle: number;
  radial: number;
  speed: number;
  drift: number;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
}

const COLORS = ['#f4dcff', '#d8b3ff', '#bb8af5', '#fff1ff', '#a56cdb'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CLUSTERS = ['th', 'in', 'we', 'to', 'of', 'it', 'on', 'er'];

function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function wrap01(value: number) {
  return ((value % 1) + 1) % 1;
}

const LETTER_FIELD: FloatingLetterProfile[] = Array.from(
  { length: FLOATING_LETTER_COUNT },
  (_, index) => {
    const seed = index + 1;
    const useCluster = noise(seed * 1.7) > 0.88;
    return {
      character: useCluster
        ? CLUSTERS[Math.floor(noise(seed * 3.1) * CLUSTERS.length)]
        : ALPHABET[Math.floor(noise(seed * 2.3) * ALPHABET.length)],
      seed: noise(seed * 4.7),
      angle: noise(seed * 5.9) * Math.PI * 2,
      radial: 0.58 + noise(seed * 7.3) * 0.4,
      speed: 0.034 + noise(seed * 8.1) * 0.045,
      drift: (noise(seed * 9.7) - 0.5) * 0.16,
      size: 0.68 + noise(seed * 10.9) * 0.72,
      opacity: 0.62 + noise(seed * 12.1) * 0.38,
      rotation: (noise(seed * 13.3) - 0.5) * 0.6,
      color: COLORS[Math.floor(noise(seed * 14.7) * COLORS.length)],
    };
  },
);

export function getDialogueGlyphSlot(characterIndex: number, beatId: string) {
  let beatHash = 0;
  for (const character of beatId) {
    beatHash = (beatHash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return (beatHash + characterIndex * 37) % FLOATING_LETTER_COUNT;
}

export function getFloatingLetterPose(
  index: number,
  motionTime: number,
  width: number,
  height: number,
  cameraStep = 0,
  reducedMotion = false,
): FloatingLetterPose {
  const profile = LETTER_FIELD[index % FLOATING_LETTER_COUNT];
  const minDimension = Math.min(width, height);
  const motionScale = reducedMotion ? 0.22 : 1;
  const depth = wrap01(
    profile.seed
    + motionTime * profile.speed * motionScale
    + cameraStep * 0.024,
  );
  const tunnelX = minDimension * (0.025 + Math.pow(depth, 1.62) * 0.98);
  const tunnelY = minDimension * (0.02 + Math.pow(depth, 1.62) * 0.69);
  const angle = profile.angle
    + motionTime * profile.drift * motionScale
    + Math.sin(motionTime * 0.24 + profile.seed * 9) * 0.08;
  const sideDrift = Math.sin(motionTime * 0.32 + profile.seed * 20) * minDimension * 0.018;
  const x = width * 0.5
    + Math.cos(angle) * tunnelX * profile.radial
    + sideDrift;
  const y = height * 0.54
    + Math.sin(angle) * tunnelY * profile.radial
    + Math.cos(motionTime * 0.27 + profile.seed * 16) * minDimension * 0.013;
  const perspectiveSize = minDimension * (0.009 + Math.pow(depth, 1.72) * 0.055);

  return {
    character: profile.character,
    x,
    y,
    depth,
    size: perspectiveSize * profile.size,
    opacity: (0.2 + depth * 0.58) * profile.opacity,
    rotation: profile.rotation
      + Math.sin(motionTime * 0.38 + profile.seed * 7) * 0.18,
    color: profile.color,
  };
}

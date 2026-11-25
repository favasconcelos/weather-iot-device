import * as THREE from 'three';
import type { Theme } from './types';

const TEXTURE_SIZE = 2048;
export const GROUND_RADIUS = 380;
const MINOR_STEP = 10;
const MAJOR_STEP = 50;

const LINES: Record<Theme, { minor: string; major: string }> = {
  dark: { minor: 'rgba(130, 170, 200, 0.1)', major: 'rgba(130, 180, 210, 0.24)' },
  light: { minor: 'rgba(30, 50, 70, 0.1)', major: 'rgba(30, 50, 70, 0.22)' },
};

function drawGrid(canvas: HTMLCanvasElement, theme: Theme): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  const scale = TEXTURE_SIZE / (GROUND_RADIUS * 2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  for (let unit = -GROUND_RADIUS; unit <= GROUND_RADIUS; unit += MINOR_STEP) {
    const major = unit % MAJOR_STEP === 0;
    ctx.strokeStyle = major ? LINES[theme].major : LINES[theme].minor;
    ctx.lineWidth = major ? 2 : 1;
    const position = (unit + GROUND_RADIUS) * scale;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, TEXTURE_SIZE);
    ctx.moveTo(0, position);
    ctx.lineTo(TEXTURE_SIZE, position);
    ctx.stroke();
  }

  // Fade the grid out toward the edge instead of ending in a hard square.
  const half = TEXTURE_SIZE / 2;
  const fade = ctx.createRadialGradient(half, half, TEXTURE_SIZE * 0.06, half, half, half);
  fade.addColorStop(0, 'rgba(0, 0, 0, 1)');
  fade.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
  fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

export interface Ground {
  mesh: THREE.Mesh;
  setTheme: (theme: Theme) => void;
}

/**
 * A faded measurement grid on the floor. It is a transparent texture, so the
 * page background shows through and works in both themes.
 */
export function createGround(theme: Theme, maxAnisotropy: number): Ground {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  drawGrid(canvas, theme);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, maxAnisotropy);

  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(GROUND_RADIUS, 96),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.25;
  mesh.raycast = () => undefined;

  return {
    mesh,
    setTheme(next: Theme): void {
      drawGrid(canvas, next);
      texture.needsUpdate = true;
    },
  };
}

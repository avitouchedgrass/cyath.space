// Vanilla ShapeGrid implementation for landing.html (Zero React overhead, pure Canvas 2D)

const SHAPES = ['square', 'tile', 'hexagon', 'triangle', 'diamond', 'circle', 'cross', 'dot'];
const DIRECTIONS: Record<string, [number, number]> = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  diagonal: [Math.SQRT1_2, -Math.SQRT1_2],
  none: [0, 0]
};
const SQRT3 = Math.sqrt(3);
const OFFSET = 32768;
const FAR = 2.5;
const MAX_PIXELS = 8e6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const keyOf = (i: number, j: number) => (i + OFFSET) * 65536 + (j + OFFSET);

const lightnessOf = (color: string) => {
  let hex = String(color).trim().replace(/^#/, '');
  if (hex.length === 3 || hex.length === 4) hex = hex.replace(/./g, '$&$&');
  hex = hex.slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return 0.6;
  const value = parseInt(hex, 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255];
  return (Math.max(...channels) + Math.min(...channels)) / 510;
};

const tint = (hue: number, lightness: number) =>
  `hsl(${(((hue % 360) + 360) % 360).toFixed(1)}, 90%, ${(lightness * 100).toFixed(1)}%)`;

const multiply = (a: number[], b: number[]) =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => {
    const r = k - (k % 3);
    const c = k % 3;
    return a[r] * b[c] + a[r + 1] * b[c + 3] + a[r + 2] * b[c + 6];
  });

const invert = (m: number[]) => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(
    value => value / det
  );
};

const project = (m: number[], x: number, y: number) => {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
};

const flatView = (width: number, height: number) => ({
  x0: 0,
  y0: 0,
  width,
  height,
  inverse: null as number[] | null,
  transform: 'none',
  mist: null as number[] | null,
  far: FAR,
  reach: Math.hypot(width, height) / 2
});

const layoutFor = (shape: string, size: number) => {
  if (shape === 'hexagon') {
    const radius = size / SQRT3;
    return { stepX: radius * 1.5, stepY: size, radius, side: 0 };
  }
  if (shape === 'triangle') {
    const side = (size * 2) / SQRT3;
    return { stepX: side / 2, stepY: size, radius: 0, side };
  }
  return { stepX: size, stepY: size, radius: 0, side: 0 };
};

const centerOf = (shape: string, layout: any, i: number, j: number) => {
  const { stepX, stepY } = layout;
  if (shape === 'hexagon') return [i * stepX, j * stepY + (Math.abs(i) % 2 === 1 ? stepY / 2 : 0)];
  if (shape === 'triangle') {
    const up = (((i + j) % 2) + 2) % 2 === 0;
    return [i * stepX, j * stepY + (up ? stepY * (2 / 3) : stepY / 3)];
  }
  if (shape === 'cross' || shape === 'dot') return [i * stepX, j * stepY];
  return [(i + 0.5) * stepX, (j + 0.5) * stepY];
};

const traceCell = (ctx: CanvasRenderingContext2D, shape: string, layout: any, size: number, i: number, j: number, x: number, y: number, inset: number) => {
  if (shape === 'triangle') {
    const up = (((i + j) % 2) + 2) % 2 === 0;
    const half = layout.side / 2 - inset * 1.7;
    const height = size - inset * 2.6;
    const top = up ? y - height * (2 / 3) : y + height * (2 / 3);
    const base = up ? y + height / 3 : y - height / 3;
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, base);
    ctx.lineTo(x - half, base);
    ctx.closePath();
  } else {
    const half = size / 2 - inset;
    ctx.rect(x - half, y - half, half * 2, half * 2);
  }
};

export interface ShapeGridOptions {
  shape?: string;
  direction?: string;
  lineColor?: string;
  hoverColor?: string;
  hoverFillColor?: string;
  fillOpacity?: number;
  cellSize?: number;
  speed?: number;
  tiltX?: number;
  tiltY?: number;
  rainbow?: boolean;
  trail?: number;
  glow?: number;
  twinkle?: number;
  fade?: number;
  clickCascade?: boolean;
}

export function initShapeGrid(container: HTMLElement, options: ShapeGridOptions = {}) {
  const opts = {
    shape: 'triangle',
    direction: 'none',
    lineColor: '#1b1920',
    hoverColor: '#ffffff',
    hoverFillColor: '#ffffff',
    fillOpacity: 0.15,
    cellSize: 40,
    speed: 0.5,
    tiltX: 0,
    tiltY: 0,
    rainbow: false,
    trail: 0.1,
    glow: 0.55,
    twinkle: 0.3,
    fade: 0,
    clickCascade: false,
    ...options
  };

  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.pointerEvents = 'none';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => {} };

  let width = container.clientWidth || window.innerWidth;
  let height = container.clientHeight || 600;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  let mouseX = -1000;
  let mouseY = -1000;
  let active = true;
  let rafId = 0;

  const onPointerMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };

  const onPointerLeave = () => {
    mouseX = -1000;
    mouseY = -1000;
  };

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  document.addEventListener('mouseleave', onPointerLeave);

  const resize = () => {
    width = container.clientWidth || window.innerWidth;
    height = container.clientHeight || 600;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  };

  window.addEventListener('resize', resize, { passive: true });

  const layout = layoutFor(opts.shape, opts.cellSize);
  let time = 0;

  const render = () => {
    if (!active) return;
    time += 0.016 * opts.speed;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const cols = Math.ceil(width / layout.stepX) + 2;
    const rows = Math.ceil(height / layout.stepY) + 2;

    for (let i = -1; i < cols; i++) {
      for (let j = -1; j < rows; j++) {
        const [cx, cy] = centerOf(opts.shape, layout, i, j);
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        const hoverIntensity = Math.max(0, 1 - dist / (opts.cellSize * 3.5));

        ctx.beginPath();
        traceCell(ctx, opts.shape, layout, opts.cellSize, i, j, cx, cy, 1);

        if (hoverIntensity > 0.05) {
          ctx.strokeStyle = opts.hoverColor;
          ctx.lineWidth = 1 + hoverIntensity * 1.5;
          ctx.stroke();

          ctx.fillStyle = opts.hoverFillColor;
          ctx.globalAlpha = hoverIntensity * opts.fillOpacity;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else {
          ctx.strokeStyle = opts.lineColor;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
    rafId = requestAnimationFrame(render);
  };

  rafId = requestAnimationFrame(render);

  return {
    destroy: () => {
      active = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}

if (typeof window !== 'undefined') {
  (window as any).ShapeGridVanilla = { initShapeGrid };
}

// Vanilla ShapeGrid implementation matching React Bits ShapeGrid.jsx 1:1
// Zero React overhead, pure Canvas 2D engine

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

const fadeMask = (amount: number) => {
  if (amount <= 0) return 'none';
  const edge = amount * 26;
  const stops: string[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    stops.push(`rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * edge).toFixed(2)}%`);
  }
  const inner = stops.join(', ');
  const outer = [...stops]
    .reverse()
    .map(stop => stop.replace(/ ([\d.]+)%$/, (_, value) => ` ${(100 - parseFloat(value)).toFixed(2)}%`))
    .join(', ');
  const axis = (direction: string) => `linear-gradient(${direction}, ${inner}, ${outer})`;
  return `${axis('to right')}, ${axis('to bottom')}`;
};

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

const viewFor = (tiltX: number, tiltY: number, width: number, height: number, cellSize: number) => {
  if (!tiltX && !tiltY) return flatView(width, height);
  const ax = (tiltX * Math.PI) / 180;
  const ay = (tiltY * Math.PI) / 180;
  const depth = Math.max(width, height) * 1.25;
  const cx = width / 2;
  const cy = height / 2;
  const tilt = [
    Math.cos(ay),
    0,
    0,
    Math.sin(ax) * Math.sin(ay),
    Math.cos(ax),
    0,
    (Math.sin(ay) * Math.cos(ax)) / depth,
    -Math.sin(ax) / depth,
    1
  ];
  const forward = multiply(multiply([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [1, 0, -cx, 0, 1, -cy, 0, 0, 1]);
  const inverse = invert(forward);
  const facing = Math.cos(ax) * Math.cos(ay);
  const far = clamp(Math.sqrt((facing * cellSize) / 5), 1.15, FAR);
  const corners = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height]
  ];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const include = (x: number, y: number) => {
    const [px, py] = project(inverse, x, y);
    x0 = Math.min(x0, px);
    y0 = Math.min(y0, py);
    x1 = Math.max(x1, px);
    y1 = Math.max(y1, py);
  };
  corners.forEach((a, k) => {
    const b = corners[(k + 1) % 4];
    include(a[0], a[1]);
    include(b[0], b[1]);
  });
  return {
    x0,
    y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
    inverse,
    transform: 'none',
    mist: null as number[] | null,
    far,
    reach: Math.hypot(width, height) / 2
  };
};

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
  if (shape === 'hexagon') {
    const r = layout.radius - inset;
    for (let k = 0; k < 6; k++) {
      const angle = (Math.PI / 3) * k;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'triangle') {
    const up = (((i + j) % 2) + 2) % 2 === 0;
    const half = layout.side / 2 - inset * 1.7;
    const height = size - inset * 2.6;
    const top = up ? y - height * (2 / 3) : y + height * (2 / 3);
    const base = up ? y + height / 3 : y - height / 3;
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, base);
    ctx.lineTo(x - half, base);
    ctx.closePath();
  } else if (shape === 'diamond') {
    const r = size / 2 - inset;
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (shape === 'circle') {
    ctx.moveTo(x + size / 2 - inset, y);
    ctx.arc(x, y, Math.max(0.5, size / 2 - inset), 0, Math.PI * 2);
  } else if (shape === 'tile') {
    const half = size / 2 - Math.max(inset, size * 0.06);
    const r = Math.min(half, size * 0.22);
    ctx.roundRect ? ctx.roundRect(x - half, y - half, half * 2, half * 2, r) : ctx.rect(x - half, y - half, half * 2, half * 2);
  } else if (shape === 'cross') {
    const arm = size * 0.16 + inset;
    ctx.moveTo(x - arm, y);
    ctx.lineTo(x + arm, y);
    ctx.moveTo(x, y - arm);
    ctx.lineTo(x, y + arm);
  } else if (shape === 'dot') {
    const r = size * 0.05 + inset;
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else {
    const half = size / 2 - inset;
    ctx.rect(x - half, y - half, half * 2, half * 2);
  }
};

export interface ShapeGridOptions {
  shape?: string;
  cellSize?: number;
  lineWidth?: number;
  direction?: string;
  speed?: number;
  lineColor?: string;
  hoverColor?: string;
  hoverFillColor?: string;
  fillOpacity?: number;
  rainbow?: boolean;
  tiltX?: number;
  tiltY?: number;
  radius?: number;
  trail?: number;
  glow?: number;
  twinkle?: number;
  fade?: number;
  clickCascade?: boolean;
  intro?: boolean;
  opacity?: number;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
}

export function initShapeGrid(container: HTMLElement, options: ShapeGridOptions = {}) {
  const shape = SHAPES.includes(options.shape || '') ? options.shape! : 'square';
  const cellSize = Math.max(8, options.cellSize ?? 40);
  const lineWidth = Math.max(0.25, options.lineWidth ?? 1);
  const direction = DIRECTIONS[options.direction || ''] ? options.direction! : 'none';
  const speed = Math.max(0, options.speed ?? 0.5);
  const lineColor = options.lineColor ?? '#1b1920';
  const hoverColor = options.hoverColor ?? '#ffffff';
  const hoverFillColor = options.hoverFillColor ?? hoverColor;
  const fillOpacity = clamp(options.fillOpacity ?? 0.15, 0, 1);
  const rainbow = options.rainbow ?? false;
  const tone = clamp(lightnessOf(hoverColor), 0.45, 0.68);
  const tiltX = clamp(options.tiltX ?? 0, -70, 70);
  const tiltY = clamp(options.tiltY ?? 0, -70, 70);
  const radius = Math.max(0, options.radius ?? 1.5);
  const trail = Math.max(0.05, options.trail ?? 0.1);
  const glow = clamp(options.glow ?? 0.55, 0, 1);
  const twinkle = clamp(options.twinkle ?? 0.3, 0, 1);
  const clickCascade = options.clickCascade ?? false;
  const intro = options.intro ?? true;
  const paused = options.paused ?? false;
  const customDpr = options.dpr;

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
  if (options.fade && options.fade > 0) {
    const mask = fadeMask(clamp(options.fade, 0, 1));
    container.style.maskImage = mask;
    (container.style as any).webkitMaskImage = mask;
  }
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: () => {} };

  const state = {
    alive: true,
    raf: 0,
    last: 0,
    time: 0,
    visible: true,
    width: 1,
    height: 1,
    ratio: 1,
    view: flatView(1, 1),
    offsetX: 0,
    offsetY: 0,
    started: false,
    startedAt: 0,
    inside: false,
    pointerX: 0,
    pointerY: 0,
    spotX: 0,
    spotY: 0,
    spotVX: 0,
    spotVY: 0,
    spotPower: 0,
    lit: new Map<number, number>(),
    hues: new Map<number, number>(),
    cascades: [] as any[],
    cascadeHue: 0
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || 600);
    const view = viewFor(tiltX, tiltY, width, height, cellSize);
    let ratio = customDpr ?? Math.min(window.devicePixelRatio || 1, 2);
    const pixels = view.width * view.height * ratio * ratio;
    if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
    state.width = width;
    state.height = height;
    state.ratio = ratio;
    state.view = view;
    const pixelWidth = Math.max(1, Math.round(view.width * ratio));
    const pixelHeight = Math.max(1, Math.round(view.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
  };

  const toPlane = (x: number, y: number) => {
    const { inverse, far } = state.view;
    if (!inverse) return [x, y];
    if (inverse[6] * x + inverse[7] * y + inverse[8] < 1 / far) return null;
    return project(inverse, x, y);
  };

  const range = (layout: any, margin: number) => {
    const { stepX, stepY } = layout;
    const { view } = state;
    return [
      Math.floor((state.offsetX + view.x0 - margin) / stepX) - 1,
      Math.ceil((state.offsetX + view.x0 + view.width + margin) / stepX) + 1,
      Math.floor((state.offsetY + view.y0 - margin) / stepY) - 1,
      Math.ceil((state.offsetY + view.y0 + view.height + margin) / stepY) + 1
    ];
  };

  const nearestCell = (layout: any, wx: number, wy: number) => {
    const { stepX, stepY } = layout;
    const ci = Math.round(wx / stepX);
    const cj = Math.round(wy / stepY);
    let best = Infinity;
    let cell = [ci, cj];
    for (let i = ci - 2; i <= ci + 2; i++) {
      for (let j = cj - 2; j <= cj + 2; j++) {
        const [x, y] = centerOf(shape, layout, i, j);
        const d = (x - wx) ** 2 + (y - wy) ** 2;
        if (d < best) {
          best = d;
          cell = [i, j];
        }
      }
    }
    return cell;
  };

  const illuminate = (layout: any, dt: number) => {
    const decay = Math.exp(-dt / trail);
    for (const [key, value] of state.lit) {
      const next = value * decay;
      if (next < 0.004) {
        state.lit.delete(key);
        state.hues.delete(key);
      } else state.lit.set(key, next);
    }
    if (state.spotPower < 0.01) return;
    const wx = state.spotX + state.offsetX;
    const wy = state.spotY + state.offsetY;
    const reach = Math.max(radius, 0.5) * cellSize;
    const [hi, hj] = nearestCell(layout, wx, wy);
    const spanI = Math.ceil(reach / layout.stepX) + 2;
    const spanJ = Math.ceil(reach / layout.stepY) + 2;
    const hue = state.time * 120;
    for (let i = hi - spanI; i <= hi + spanI; i++) {
      for (let j = hj - spanJ; j <= hj + spanJ; j++) {
        const [x, y] = centerOf(shape, layout, i, j);
        const distance = Math.hypot(x - wx, y - wy);
        let value = radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
        if (i === hi && j === hj) value = Math.max(value, 1);
        value *= state.spotPower;
        if (value <= 0.004) continue;
        const key = keyOf(i, j);
        if (value > (state.lit.get(key) ?? 0)) {
          state.lit.set(key, value);
          state.hues.set(key, hue + ((x + y) / cellSize) * 12);
        }
      }
    }
  };

  const cascadeAt = (x: number, y: number) => {
    let value = 0;
    for (const cascade of state.cascades) {
      const ring = Math.round(Math.hypot(x - cascade.x, y - cascade.y) / cellSize);
      const local = state.time - cascade.time - ring * 0.055;
      if (local < 0) continue;
      const pulse = Math.exp(-((local / 0.085) ** 2)) * cascade.power * Math.max(0, 1 - ring / cascade.reach);
      if (pulse > value) {
        value = pulse;
        state.cascadeHue = cascade.hue + ring * 16;
      }
    }
    return value;
  };

  const draw = () => {
    const { view, ratio } = state;
    const layout = layoutFor(shape, cellSize);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, -view.x0 * ratio, -view.y0 * ratio);

    const left = view.x0;
    const top = view.y0;
    const right = view.x0 + view.width;
    const bottom = view.y0 + view.height;
    const size = cellSize;
    const [i0, i1, j0, j1] = range(layout, size);
    const markers = shape === 'cross' || shape === 'dot';
    const elapsed = state.time - state.startedAt;
    const introRadius = intro ? elapsed * view.reach * 1.8 : Infinity;
    const originX = state.width / 2;
    const originY = state.height / 2;
    const centerX = originX + state.offsetX;
    const centerY = originY + state.offsetY;

    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = lineColor;
    ctx.fillStyle = lineColor;
    ctx.beginPath();

    if (shape === 'square') {
      for (let i = i0; i <= i1; i++) {
        const x = i * layout.stepX - state.offsetX;
        ctx.moveTo(x, top - size);
        ctx.lineTo(x, bottom + size);
      }
      for (let j = j0; j <= j1; j++) {
        const y = j * layout.stepY - state.offsetY;
        ctx.moveTo(left - size, y);
        ctx.lineTo(right + size, y);
      }
    } else {
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const [cx, cy] = centerOf(shape, layout, i, j);
          traceCell(ctx, shape, layout, size, i, j, cx - state.offsetX, cy - state.offsetY, 0);
        }
      }
    }
    if (shape === 'dot') ctx.fill();
    else ctx.stroke();

    if (introRadius !== Infinity) {
      const gradient = ctx.createRadialGradient(originX, originY, 0, originX, originY, Math.max(1, introRadius));
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.82, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    const glowing = glow > 0;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const [cx, cy] = centerOf(shape, layout, i, j);
        const key = keyOf(i, j);
        let value = state.lit.get(key) ?? 0;
        let hue = state.hues.get(key) ?? 0;
        if (state.cascades.length) {
          const pulse = cascadeAt(cx, cy);
          if (pulse > value) {
            value = pulse;
            hue = state.cascadeHue;
          }
        }
        if (twinkle > 0) {
          const seed = hash(i, j);
          const wave = Math.sin(state.time * (0.35 + seed * 0.5) + seed * 40);
          const sparkle = twinkle * 0.7 * Math.max(0, wave) ** 18;
          if (sparkle > value) {
            value = sparkle;
            hue = seed * 360;
          }
        }
        if (introRadius !== Infinity) {
          const front = introRadius - Math.hypot(cx - centerX, cy - centerY);
          if (front < 0) continue;
          const wave = Math.exp(-((front / (size * 1.4)) ** 2)) * 0.85;
          if (wave > value) {
            value = wave;
            hue = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI + state.time * 120;
          }
        }
        if (value <= 0.01) continue;
        const color = rainbow ? tint(hue, tone) : hoverColor;
        const x = cx - state.offsetX;
        const y = cy - state.offsetY;
        ctx.beginPath();
        traceCell(ctx, shape, layout, size, i, j, x, y, markers ? value * size * 0.08 : lineWidth * 0.5);

        if (fillOpacity > 0) {
          ctx.globalAlpha = Math.min(1, value) * fillOpacity;
          ctx.fillStyle = rainbow ? color : hoverFillColor;
          ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, value) * 0.85;
        if (glowing) {
          ctx.shadowColor = color;
          ctx.shadowBlur = glow * 16 * value;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    state.raf = 0;
    if (!state.alive) return;
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    resize();
    if (!state.started) {
      state.started = true;
      state.startedAt = state.time;
    }
    if (!paused) {
      state.time += dt;
      if (direction !== 'none') {
        const [dx, dy] = DIRECTIONS[direction];
        state.offsetX -= dx * speed * 60 * dt;
        state.offsetY -= dy * speed * 60 * dt;
      }
      const want = state.inside ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
      const stiffness = 220;
      const damping = 2 * Math.sqrt(stiffness) * 0.85;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;
      illuminate(layoutFor(shape, cellSize), dt);
      state.cascades = state.cascades.filter(cascade => state.time - cascade.time < cascade.reach * 0.055 + 0.4);
    }
    draw();
    if (state.alive && state.visible) state.raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
  };

  const pointFrom = (event: MouseEvent | PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return toPlane(x, y);
  };

  const onMove = (event: PointerEvent | MouseEvent) => {
    const point = pointFrom(event);
    if (point && !state.inside && state.spotPower < 0.02) {
      state.spotX = point[0];
      state.spotY = point[1];
      state.spotVX = 0;
      state.spotVY = 0;
    }
    state.inside = point !== null;
    if (point) {
      state.pointerX = point[0];
      state.pointerY = point[1];
      wake();
    }
  };

  const onLeave = () => {
    state.inside = false;
  };

  const onDown = (event: MouseEvent) => {
    if (!clickCascade) return;
    const point = pointFrom(event);
    if (!point) return;
    state.cascades.push({
      x: point[0] + state.offsetX,
      y: point[1] + state.offsetY,
      time: state.time,
      power: 1,
      reach: Math.hypot(state.view.width, state.view.height) / cellSize,
      hue: state.time * 120
    });
    if (state.cascades.length > 6) state.cascades.shift();
    wake();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown as any, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  resize();
  wake();

  return {
    destroy: () => {
      state.alive = false;
      cancelAnimationFrame(state.raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown as any);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}

if (typeof window !== 'undefined') {
  (window as any).ShapeGridVanilla = { initShapeGrid };
}

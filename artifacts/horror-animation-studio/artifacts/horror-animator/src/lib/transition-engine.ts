// transition-engine.ts — 100+ transitions for Horror Animation Studio

export interface TransitionState {
  active: boolean;
  id: string;
  progress: number;       // 0..1
  durationMs: number;
  startTime: number;
  fromImageId: string | null;
  toImageId: string | null;
}

export function makeTransitionState(): TransitionState {
  return { active: false, id: 'none', progress: 0, durationMs: 600, startTime: 0, fromImageId: null, toImageId: null };
}

export function tickTransition(state: TransitionState, nowMs: number): TransitionState {
  if (!state.active || state.id === 'none') return state;
  const elapsed = nowMs - state.startTime;
  const progress = Math.min(1, elapsed / state.durationMs);
  if (progress >= 1) return { ...state, active: false, progress: 1 };
  return { ...state, progress };
}

// Easing functions
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function easeIn(t: number) { return t * t * t; }
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function elasticOut(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}
function bounceOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

// Draw a single image centered/scaled to fill canvas
function drawImg(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement | null, W: number, H: number, alpha = 1) {
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// MAIN DRAW FUNCTION — dispatches to individual transition renderers
// ════════════════════════════════════════════════════════════════
export function drawTransition(
  ctx: CanvasRenderingContext2D,
  from: HTMLCanvasElement | null,
  to: HTMLCanvasElement | null,
  id: string,
  p: number,   // 0..1 raw progress
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);
  const e = easeInOut(p);

  switch (id) {
    // ─────────────────────── BASIC ───────────────────────
    case 'fade':
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      break;

    case 'dissolve': {
      // Pixel dissolve using noise pattern
      drawImg(ctx, from, W, H, 1);
      ctx.save();
      ctx.globalAlpha = p;
      // Create dissolve mask via clip pattern
      const cells = 40;
      const cw = W / cells, ch = H / cells;
      ctx.beginPath();
      for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
          // Deterministic pseudo-random threshold
          const thresh = ((row * 7 + col * 13 + row * col * 3) % 100) / 100;
          if (p > thresh) {
            ctx.rect(col * cw, row * ch, cw, ch);
          }
        }
      }
      ctx.clip();
      drawImg(ctx, to, W, H, 1);
      ctx.restore();
      break;
    }

    case 'hard-cut':
      if (p < 0.5) drawImg(ctx, from, W, H);
      else drawImg(ctx, to, W, H);
      break;

    case 'dip-black': {
      if (p < 0.5) { drawImg(ctx, from, W, H, 1 - p * 2); }
      else { drawImg(ctx, to, W, H, (p - 0.5) * 2); }
      ctx.fillStyle = '#000';
      ctx.globalAlpha = p < 0.5 ? p * 2 : 2 - p * 2;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      break;
    }

    case 'dip-white': {
      if (p < 0.5) drawImg(ctx, from, W, H, 1 - p * 2);
      else drawImg(ctx, to, W, H, (p - 0.5) * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = p < 0.5 ? p * 2 : 2 - p * 2;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      break;
    }

    case 'cross-zoom': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      const s = 1 + p * 0.3;
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      break;
    }

    // ─────────────────────── ZOOM ───────────────────────
    case 'zoom-in': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      const s = 0.3 + e * 0.7;
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    case 'zoom-out': {
      ctx.save();
      const s = 1 + (1 - e) * 0.5;
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, from, W, H, 1 - e);
      ctx.restore();
      drawImg(ctx, to, W, H, e);
      break;
    }

    case 'zoom-blur': {
      // Simulate zoom blur via multiple alpha passes
      drawImg(ctx, from, W, H, 1 - p);
      for (let i = 1; i <= 5; i++) {
        const sp = 1 + (p * 0.4 * i) / 5;
        ctx.save();
        ctx.globalAlpha = p / 6;
        ctx.translate(W / 2, H / 2);
        ctx.scale(sp, sp);
        ctx.translate(-W / 2, -H / 2);
        if (to) ctx.drawImage(to, 0, 0, W, H);
        ctx.restore();
      }
      break;
    }

    case 'punch-in': {
      const s = easeOut(p);
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(s * 1.2, s * 1.2);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      break;
    }

    case 'zoom-rotate': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      const angle = (1 - e) * Math.PI * 0.5;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(angle);
      ctx.scale(e, e);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    // ─────────────────────── SLIDE ───────────────────────
    case 'slide-left': {
      const x = -W * e;
      ctx.save(); ctx.translate(x, 0); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(x + W, 0); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }
    case 'slide-right': {
      const x = W * e;
      ctx.save(); ctx.translate(x, 0); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(x - W, 0); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }
    case 'slide-up': {
      const y = -H * e;
      ctx.save(); ctx.translate(0, y); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(0, y + H); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }
    case 'slide-down': {
      const y = H * e;
      ctx.save(); ctx.translate(0, y); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(0, y - H); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }

    case 'push-left': {
      ctx.save(); ctx.translate(-W * e, 0); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(W * (1 - e), 0); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }
    case 'push-right': {
      ctx.save(); ctx.translate(W * e, 0); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(-W * (1 - e), 0); drawImg(ctx, to, W, H); ctx.restore();
      break;
    }

    case 'wipe-left': {
      drawImg(ctx, from, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(W * (1 - e), 0, W * e, H); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }
    case 'wipe-right': {
      drawImg(ctx, from, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W * e, H); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }
    case 'wipe-up': {
      drawImg(ctx, from, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, H * (1 - e), W, H * e); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }
    case 'wipe-down': {
      drawImg(ctx, from, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H * e); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }

    // ─────────────────────── CREATIVE ───────────────────────
    case 'spin-360': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(e * Math.PI * 2);
      const sc = 0.5 + e * 0.5;
      ctx.scale(sc, sc);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    case 'spin-half': {
      if (p < 0.5) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(p * Math.PI);
        ctx.scale(1 - p, 1 - p);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, from, W, H);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate((p - 0.5) * Math.PI);
        ctx.scale(p, p);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      break;
    }

    case 'flip-h': {
      if (p < 0.5) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1 - p * 2, 1);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, from, W, H);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale((p - 0.5) * 2, 1);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      break;
    }

    case 'flip-v': {
      if (p < 0.5) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1, 1 - p * 2);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, from, W, H);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1, (p - 0.5) * 2);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      break;
    }

    case 'cube-left': {
      const angle = e * Math.PI / 2;
      // FROM — rotates left
      ctx.save();
      ctx.translate(W * (1 - e), 0);
      ctx.scale(Math.cos(angle), 1);
      drawImg(ctx, from, W, H, 1 - e);
      ctx.restore();
      // TO — rotates into view
      ctx.save();
      ctx.translate(W * e * 0.5, 0);
      ctx.scale(Math.sin(angle), 1);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    case 'ripple': {
      drawImg(ctx, from, W, H, 1 - p);
      // Ripple effect via multiple ring clips
      ctx.save();
      ctx.beginPath();
      const r = Math.max(W, H) * e;
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.clip();
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    case 'shockwave': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      const maxR = Math.sqrt(W * W + H * H) / 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, maxR * e * 1.5, 0, Math.PI * 2);
      ctx.clip();
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      // Shockwave ring
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${(1 - e) * 0.8})`;
      ctx.lineWidth = 8 * (1 - e);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, maxR * e, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'heart-wipe': {
      drawImg(ctx, from, W, H);
      ctx.save();
      const hs = e * Math.max(W, H) * 1.5;
      ctx.translate(W / 2, H / 2);
      ctx.scale(hs / 200, hs / 200);
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.bezierCurveTo(50, -100, 100, -20, 0, 50);
      ctx.bezierCurveTo(-100, -20, -50, -100, 0, -50);
      ctx.closePath();
      ctx.clip();
      ctx.scale(200 / hs, 200 / hs);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    // ─────────────────────── HORROR ───────────────────────
    case 'horror-noise': {
      drawImg(ctx, from, W, H, 1 - p);
      // Static noise overlay
      const idata = ctx.createImageData(W, H);
      for (let i = 0; i < idata.data.length; i += 4) {
        const v = Math.random() * 255 * p;
        idata.data[i] = v; idata.data[i + 1] = v; idata.data[i + 2] = v; idata.data[i + 3] = 255 * p;
      }
      ctx.putImageData(idata, 0, 0);
      drawImg(ctx, to, W, H, p);
      break;
    }

    case 'blood-wipe': {
      drawImg(ctx, from, W, H);
      ctx.save();
      // Jagged blood drip wipe from top
      const drip = H * e;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * W;
        const jag = Math.sin(i * 2.3) * 30 * (1 - e);
        ctx.lineTo(x, drip + jag);
      }
      ctx.lineTo(W, 0); ctx.closePath(); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      // Red blood line
      ctx.save();
      ctx.strokeStyle = `rgba(180,0,0,${0.8 * (1 - e)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const steps2 = 20;
      for (let i = 0; i <= steps2; i++) {
        const x = (i / steps2) * W;
        const jag = Math.sin(i * 2.3) * 30 * (1 - e);
        i === 0 ? ctx.moveTo(x, H * e + jag) : ctx.lineTo(x, H * e + jag);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'glitch-cut': {
      // Glitch horizontal slice effect
      const slices = 12;
      const sh = H / slices;
      for (let i = 0; i < slices; i++) {
        const offset = (Math.sin(i * 7.3 + p * 20) * W * 0.08 * (1 - p)) | 0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, i * sh, W, sh);
        ctx.clip();
        drawImg(ctx, p < 0.5 ? from : to, W, H);
        if (p > 0.3 && p < 0.7) {
          ctx.translate(offset, 0);
          drawImg(ctx, to, W, H, (p - 0.3) / 0.4);
        }
        ctx.restore();
      }
      break;
    }

    case 'static-burst': {
      if (p < 0.4) {
        drawImg(ctx, from, W, H, 1 - p * 2.5);
        // Static noise
        const id2 = ctx.createImageData(W, H);
        for (let i = 0; i < id2.data.length; i += 4) {
          const v = Math.random() > 0.5 ? 255 : 0;
          id2.data[i] = v; id2.data[i + 1] = v; id2.data[i + 2] = v; id2.data[i + 3] = Math.random() * 200;
        }
        ctx.putImageData(id2, 0, 0);
      } else {
        drawImg(ctx, to, W, H, (p - 0.4) / 0.6);
      }
      break;
    }

    case 'nightmare-fade': {
      drawImg(ctx, from, W, H, 1 - p);
      // Red tint
      ctx.save();
      ctx.fillStyle = `rgba(120,0,0,${Math.sin(p * Math.PI) * 0.5})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      drawImg(ctx, to, W, H, easeIn(p));
      break;
    }

    case 'demon-flash': {
      const flashes = Math.floor(p * 6);
      if (flashes % 2 === 0) drawImg(ctx, from, W, H, 1 - p);
      else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
      }
      if (p > 0.7) drawImg(ctx, to, W, H, (p - 0.7) / 0.3);
      break;
    }

    case 'void-swallow': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const vsc = easeIn(p);
      ctx.scale(vsc, vsc);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      // Dark vignette
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, `rgba(0,0,0,${Math.sin(p * Math.PI) * 0.8})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      break;
    }

    case 'shatter': {
      drawImg(ctx, from, W, H);
      const pieces = 16;
      const pw = W / 4; const ph = H / 4;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const delay = (row * 4 + col) / pieces * 0.5;
          const localP = Math.max(0, Math.min(1, (p - delay) / 0.5));
          const ex = (col - 1.5) * 60 * localP;
          const ey = (row - 1.5) * 60 * localP + localP * H * 0.3;
          const rot = (Math.random() * 0.4 - 0.2) * localP * Math.PI;
          ctx.save();
          ctx.translate(col * pw + pw / 2 + ex, row * ph + ph / 2 + ey);
          ctx.rotate(rot);
          ctx.globalAlpha = 1 - localP;
          ctx.drawImage(from!, col * pw - W / 2, row * ph - H / 2, W, H);
          ctx.restore();
        }
      }
      drawImg(ctx, to, W, H, easeOut(p));
      break;
    }

    // ─────────────────────── FILM ───────────────────────
    case 'film-burn': {
      drawImg(ctx, from, W, H, 1 - p);
      // Burn effect — orange/white hot center
      ctx.save();
      const burnR = Math.max(W, H) * p;
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, burnR);
      bg.addColorStop(0, `rgba(255,255,200,${p * 0.9})`);
      bg.addColorStop(0.3, `rgba(255,120,0,${p * 0.7})`);
      bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      drawImg(ctx, to, W, H, easeIn(p));
      break;
    }

    case 'film-roll': {
      // Horizontal roll like old projector
      const offset = H * (1 - e);
      ctx.save(); ctx.translate(0, -offset); drawImg(ctx, from, W, H); ctx.restore();
      ctx.save(); ctx.translate(0, H - offset); drawImg(ctx, to, W, H); ctx.restore();
      // Sprocket holes
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${(1 - e) * 0.6})`;
      for (let y = 0; y < H; y += 30) {
        ctx.fillRect(0, y, 10, 15);
        ctx.fillRect(W - 10, y, 10, 15);
      }
      ctx.restore();
      break;
    }

    case 'old-film': {
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      // Scratches
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,200,${(1 - Math.abs(p - 0.5) * 2) * 0.6})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const x = ((i * 137 + 42) % W);
        ctx.beginPath();
        for (let y = 0; y < H; y += 20) {
          y === 0 ? ctx.moveTo(x + Math.random() * 4 - 2, y) : ctx.lineTo(x + Math.random() * 4 - 2, y);
        }
        ctx.stroke();
      }
      // Sepia overlay
      ctx.fillStyle = `rgba(180,120,40,${Math.sin(p * Math.PI) * 0.2})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      break;
    }

    case 'film-noir': {
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      // B&W desaturation effect via luminance overlay
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${Math.sin(p * Math.PI) * 0.7})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      break;
    }

    case 'projector-flicker': {
      const flicker = 0.7 + Math.sin(p * 80) * 0.3;
      if (p < 0.5) drawImg(ctx, from, W, H, (1 - p * 2) * flicker);
      else drawImg(ctx, to, W, H, ((p - 0.5) * 2) * flicker);
      // Vignette
      ctx.save();
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(1, `rgba(0,0,0,${0.6 * Math.sin(p * Math.PI)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      break;
    }

    case 'iris-open': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.max(W, H) * e, 0, Math.PI * 2);
      ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }

    case 'iris-close': {
      drawImg(ctx, from, W, H);
      ctx.save();
      // Draw black with iris cutout
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.max(W, H) * (1 - e) * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawImg(ctx, to, W, H, e);
      break;
    }

    // ─────────────────────── DISCO / PARTY ───────────────────────
    case 'disco-flash': {
      const colors = ['#ff0080', '#00ffff', '#ffff00', '#ff6600', '#8000ff', '#00ff40'];
      const ci = Math.floor(p * colors.length * 3) % colors.length;
      if (Math.floor(p * 12) % 2 === 0) {
        drawImg(ctx, from, W, H, 1 - p);
      } else {
        ctx.fillStyle = colors[ci];
        ctx.fillRect(0, 0, W, H);
      }
      drawImg(ctx, to, W, H, p > 0.5 ? (p - 0.5) * 2 : 0);
      break;
    }

    case 'disco-spin': {
      // Multiple rotating color panels
      const panels = 8;
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(e * Math.PI * 2);
      const discColors = ['#ff0080', '#00ffff', '#ffff00', '#ff6600', '#8000ff', '#00ff40', '#ff4040', '#40ffff'];
      for (let i = 0; i < panels; i++) {
        ctx.save();
        ctx.rotate((i / panels) * Math.PI * 2);
        ctx.fillStyle = discColors[i % discColors.length];
        ctx.globalAlpha = e * 0.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(W, H), 0, (Math.PI * 2) / panels);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      drawImg(ctx, to, W, H, e);
      break;
    }

    case 'strobe-cut': {
      const freq = 16;
      if (Math.floor(p * freq) % 2 === 0) {
        drawImg(ctx, from, W, H, 1 - p);
      } else {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
      }
      if (p > 0.6) drawImg(ctx, to, W, H, (p - 0.6) / 0.4);
      break;
    }

    case 'rainbow-sweep': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      const rg = ctx.createLinearGradient(0, 0, W * p, 0);
      rg.addColorStop(0, 'rgba(255,0,0,0.6)');
      rg.addColorStop(0.17, 'rgba(255,165,0,0.6)');
      rg.addColorStop(0.33, 'rgba(255,255,0,0.6)');
      rg.addColorStop(0.5, 'rgba(0,255,0,0.6)');
      rg.addColorStop(0.67, 'rgba(0,0,255,0.6)');
      rg.addColorStop(0.83, 'rgba(128,0,128,0.6)');
      rg.addColorStop(1, 'rgba(255,0,255,0.6)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      drawImg(ctx, to, W, H, p);
      break;
    }

    case 'neon-pulse': {
      drawImg(ctx, from, W, H, 1 - p);
      const neonColors = ['#ff00ff', '#00ffff', '#ffff00'];
      ctx.save();
      ctx.shadowBlur = 40 * Math.sin(p * Math.PI);
      ctx.shadowColor = neonColors[Math.floor(p * 3) % 3];
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      break;
    }

    // ─────────────────────── HOLLYWOOD ───────────────────────
    case 'hollywood-star': {
      drawImg(ctx, from, W, H, 1 - e);
      // Star burst from center
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const rays = 16;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        const len = Math.max(W, H) * e;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(255,255,200,${(1 - e) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, len);
        ctx.lineTo(10, len);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      drawImg(ctx, to, W, H, e);
      break;
    }

    case 'spotlight': {
      drawImg(ctx, from, W, H, 1 - p);
      const spotR = Math.max(W, H) * e * 0.8;
      const sg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, spotR);
      sg.addColorStop(0, `rgba(255,255,220,${p * 0.4})`);
      sg.addColorStop(0.5, 'transparent');
      sg.addColorStop(1, `rgba(0,0,0,${p * 0.8})`);
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
      drawImg(ctx, to, W, H, e);
      break;
    }

    case 'curtain-open': {
      // Left and right curtain panels opening
      drawImg(ctx, to, W, H, p);
      ctx.save();
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, W / 2 * (1 - e), H);
      ctx.fillRect(W - W / 2 * (1 - e), 0, W / 2 * (1 - e), H);
      ctx.restore();
      break;
    }

    case 'curtain-close': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      ctx.fillStyle = '#1a0000';
      ctx.fillRect(0, 0, W / 2 * e, H);
      ctx.fillRect(W - W / 2 * e, 0, W / 2 * e, H);
      ctx.restore();
      drawImg(ctx, to, W, H, p > 0.8 ? (p - 0.8) * 5 : 0);
      break;
    }

    case 'film-leader': {
      if (p < 0.3) {
        // Film countdown look
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, H * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${H * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.ceil(3 - p * 10)), W / 2, H / 2);
        ctx.restore();
      } else {
        drawImg(ctx, to, W, H, (p - 0.3) / 0.7);
      }
      break;
    }

    case 'cinematic-bars': {
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      const barH = H * 0.12 * Math.sin(p * Math.PI);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, barH);
      ctx.fillRect(0, H - barH, W, barH);
      break;
    }

    case 'lens-flare': {
      drawImg(ctx, from, W, H, 1 - e);
      // Lens flare streak
      ctx.save();
      const flareX = W * e;
      const flareG = ctx.createRadialGradient(flareX, H / 2, 0, flareX, H / 2, W * 0.3);
      flareG.addColorStop(0, `rgba(255,255,255,${(1 - e) * 0.9})`);
      flareG.addColorStop(0.3, `rgba(255,220,100,${(1 - e) * 0.4})`);
      flareG.addColorStop(1, 'transparent');
      ctx.fillStyle = flareG;
      ctx.fillRect(0, 0, W, H);
      // Streak
      ctx.strokeStyle = `rgba(255,255,255,${(1 - e) * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.restore();
      drawImg(ctx, to, W, H, e);
      break;
    }

    // ─────────────────────── GLITCH / DIGITAL ───────────────────────
    case 'rgb-split': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const shift = W * 0.04 * Math.sin(p * Math.PI);
      ctx.globalAlpha = p * 0.9;
      ctx.translate(-shift, 0); drawImg(ctx, to, W, H); ctx.translate(shift * 2, 0); drawImg(ctx, to, W, H);
      ctx.restore();
      drawImg(ctx, to, W, H, p * 0.5);
      break;
    }

    case 'pixel-sort': {
      // Simulated pixel sorting
      const rows2 = 20;
      const rh = H / rows2;
      for (let i = 0; i < rows2; i++) {
        const rowDelay = i / rows2 * 0.5;
        const rowP = Math.max(0, Math.min(1, (p - rowDelay) / 0.5));
        const dirOffset = (i % 2 === 0 ? 1 : -1) * W * rowP;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, i * rh, W, rh);
        ctx.clip();
        ctx.translate(dirOffset, 0);
        drawImg(ctx, rowP > 0.5 ? to : from, W, H);
        ctx.restore();
      }
      break;
    }

    case 'data-mosh': {
      const blockSize = 40;
      drawImg(ctx, from, W, H);
      const blocksX = Math.ceil(W / blockSize);
      const blocksY = Math.ceil(H / blockSize);
      for (let bx = 0; bx < blocksX; bx++) {
        for (let by = 0; by < blocksY; by++) {
          const threshold = ((bx * 7 + by * 11) % 100) / 100;
          if (p > threshold) {
            const offsetX = Math.sin(bx + p * 10) * 20 * (1 - p);
            const offsetY = Math.cos(by + p * 8) * 20 * (1 - p);
            ctx.save();
            ctx.beginPath();
            ctx.rect(bx * blockSize, by * blockSize, blockSize, blockSize);
            ctx.clip();
            ctx.translate(offsetX, offsetY);
            drawImg(ctx, to, W, H, p);
            ctx.restore();
          }
        }
      }
      break;
    }

    case 'matrix-rain': {
      drawImg(ctx, from, W, H, 1 - p);
      // Green code rain columns
      ctx.save();
      ctx.fillStyle = `rgba(0,255,0,${p * 0.3})`;
      const cols = 20;
      const cw2 = W / cols;
      for (let c = 0; c < cols; c++) {
        const speed = 0.5 + (c % 5) * 0.1;
        const dropH = H * Math.min(1, p / speed);
        ctx.fillRect(c * cw2, 0, cw2 - 1, dropH);
      }
      ctx.restore();
      drawImg(ctx, to, W, H, easeIn(p));
      break;
    }

    case 'scan-lines': {
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.sin(p * Math.PI)})`;
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 2);
      }
      ctx.restore();
      break;
    }

    case 'vhs-rewind': {
      // VHS rewind horizontal lines
      const lineH2 = H * p;
      ctx.save();
      ctx.translate(0, -lineH2);
      drawImg(ctx, from, W, H, 1 - p);
      ctx.restore();
      ctx.save();
      ctx.translate(0, H - lineH2);
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      // Tracking noise band
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - p)})`;
      ctx.fillRect(0, lineH2 - 5, W, 10);
      ctx.fillStyle = `rgba(0,0,0,0.6)`;
      ctx.fillRect(0, lineH2 - 2, W, 4);
      ctx.restore();
      break;
    }

    // ─────────────────────── NATURE ───────────────────────
    case 'lightning': {
      if (p < 0.4) {
        drawImg(ctx, from, W, H, 1 - p * 2.5);
        if (Math.random() < 0.3) {
          ctx.save();
          ctx.strokeStyle = `rgba(200,200,255,${1 - p * 2.5})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#aaaaff';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          let lx = W / 2, ly = 0;
          ctx.moveTo(lx, ly);
          while (ly < H) {
            lx += Math.random() * 80 - 40;
            ly += Math.random() * 60 + 20;
            ctx.lineTo(lx, ly);
          }
          ctx.stroke();
          ctx.restore();
        }
      } else {
        drawImg(ctx, to, W, H, (p - 0.4) / 0.6);
      }
      break;
    }

    case 'fire-wipe': {
      drawImg(ctx, from, W, H);
      const fireX = W * e;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= fireX; x += 10) {
        const flicker = Math.sin(x * 0.3 + p * 20) * 30;
        ctx.lineTo(x, H * (1 - e) + flicker);
      }
      ctx.lineTo(fireX, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.clip();
      drawImg(ctx, to, W, H);
      ctx.restore();
      // Fire edge
      ctx.save();
      ctx.strokeStyle = `rgba(255,120,0,${(1 - e) * 0.8})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let x2 = 0; x2 <= fireX; x2 += 5) {
        const fl = Math.sin(x2 * 0.3 + p * 20) * 30;
        x2 === 0 ? ctx.moveTo(x2, H * (1 - e) + fl) : ctx.lineTo(x2, H * (1 - e) + fl);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'snow-fall': {
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${Math.sin(p * Math.PI) * 0.7})`;
      const flakes = 80;
      for (let i = 0; i < flakes; i++) {
        const fx = ((i * 137 + 42) % W);
        const fy = (p * H * 2 + i * 19) % H;
        const fr = 1 + (i % 4);
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'water-ripple': {
      drawImg(ctx, from, W, H, 1 - p);
      // Concentric ripple circles
      ctx.save();
      for (let ring = 0; ring < 5; ring++) {
        const r2 = (e + ring * 0.15) * Math.max(W, H);
        const alpha = Math.max(0, (1 - (e + ring * 0.15)) * 0.4);
        ctx.strokeStyle = `rgba(100,160,255,${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      drawImg(ctx, to, W, H, easeIn(p));
      break;
    }

    // ─────────────────────── GEOMETRIC ───────────────────────
    case 'diamond-reveal': {
      drawImg(ctx, from, W, H);
      ctx.save();
      const ds = e * Math.max(W, H) * 1.5;
      ctx.translate(W / 2, H / 2);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.rect(-ds / 2, -ds / 2, ds, ds);
      ctx.clip();
      ctx.rotate(-Math.PI / 4);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }

    case 'clock-wipe': {
      drawImg(ctx, from, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.max(W, H), -Math.PI / 2, -Math.PI / 2 + e * Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H);
      ctx.restore();
      break;
    }

    case 'pinwheel': {
      drawImg(ctx, from, W, H, 1 - e);
      const blades = 6;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      for (let b = 0; b < blades; b++) {
        ctx.save();
        ctx.rotate((b / blades) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(W, H), 0, e * Math.PI * 2 / blades);
        ctx.closePath();
        ctx.clip();
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      ctx.restore();
      break;
    }

    case 'venetian-h': {
      // Horizontal blinds
      drawImg(ctx, from, W, H);
      const blinds = 8;
      const bh = H / blinds;
      ctx.save();
      for (let i = 0; i < blinds; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, i * bh, W, bh * e);
        ctx.clip();
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      ctx.restore();
      break;
    }

    case 'venetian-v': {
      // Vertical blinds
      drawImg(ctx, from, W, H);
      const vblinds = 8;
      const vbw = W / vblinds;
      ctx.save();
      for (let i = 0; i < vblinds; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * vbw, 0, vbw * e, H);
        ctx.clip();
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      ctx.restore();
      break;
    }

    case 'checker-board': {
      drawImg(ctx, from, W, H);
      const cs = 60;
      const cols2 = Math.ceil(W / cs);
      const rows3 = Math.ceil(H / cs);
      ctx.save();
      for (let r = 0; r < rows3; r++) {
        for (let c2 = 0; c2 < cols2; c2++) {
          const thresh = ((r + c2) % 2 === 0)
            ? ((r * cols2 + c2) / (rows3 * cols2)) * 0.5
            : 0.5 + ((r * cols2 + c2) / (rows3 * cols2)) * 0.5;
          if (p > thresh) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(c2 * cs, r * cs, cs, cs);
            ctx.clip();
            drawImg(ctx, to, W, H);
            ctx.restore();
          }
        }
      }
      ctx.restore();
      break;
    }

    // ─────────────────────── ELASTIC / BOUNCE ───────────────────────
    case 'elastic-in': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      const esc = elasticOut(p);
      ctx.translate(W / 2, H / 2);
      ctx.scale(esc, esc);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      break;
    }

    case 'bounce-in': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      const bsc = bounceOut(p);
      ctx.translate(W / 2, H / 2);
      ctx.scale(bsc, bsc);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, p);
      ctx.restore();
      break;
    }

    case 'swing-in': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(0, H / 2);
      const swingAngle = (1 - e) * Math.PI * 0.3;
      ctx.transform(Math.cos(swingAngle), Math.sin(swingAngle), -Math.sin(swingAngle), Math.cos(swingAngle), 0, 0);
      ctx.translate(0, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      break;
    }

    // ─────────────────────── ADVANCED ───────────────────────
    case 'morph-circle': {
      drawImg(ctx, from, W, H, 1 - p);
      ctx.save();
      // Morphing circle grid
      const mc = 5;
      const mcw = W / mc; const mch = H / mc;
      for (let r = 0; r < mc; r++) {
        for (let c = 0; c < mc; c++) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c * mcw + mcw / 2, r * mch + mch / 2, mcw / 2 * e, 0, Math.PI * 2);
          ctx.clip();
          drawImg(ctx, to, W, H, p);
          ctx.restore();
        }
      }
      ctx.restore();
      break;
    }

    case 'kaleidoscope': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const segs = 6;
      for (let s = 0; s < segs; s++) {
        ctx.save();
        ctx.rotate(s * Math.PI * 2 / segs + e * Math.PI);
        ctx.scale(e, e);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(W, H) / 2, 0, Math.PI * 2 / segs);
        ctx.closePath();
        ctx.clip();
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      ctx.restore();
      break;
    }

    case 'smoke-dissolve': {
      drawImg(ctx, from, W, H, 1 - p);
      // Smoke tendrils
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const sx = (W / 8) * i + W / 16;
        const sy = H * (1 - p);
        const sh2 = H * p;
        const sg2 = ctx.createLinearGradient(sx, sy, sx, sy + sh2);
        sg2.addColorStop(0, `rgba(200,200,200,${p * 0.3 * (1 - Math.abs((i - 3.5) / 4))})`);
        sg2.addColorStop(1, 'transparent');
        ctx.fillStyle = sg2;
        ctx.beginPath();
        ctx.ellipse(sx, sy + sh2 / 2, 20 + Math.sin(i * 1.3) * 10, sh2 / 2, Math.sin(i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      drawImg(ctx, to, W, H, easeIn(p));
      break;
    }

    case 'portal': {
      drawImg(ctx, from, W, H, 1 - e);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(e * Math.PI * 4);
      const psc = e;
      ctx.scale(psc, psc);
      ctx.translate(-W / 2, -H / 2);
      drawImg(ctx, to, W, H, e);
      ctx.restore();
      // Portal ring glow
      ctx.save();
      ctx.strokeStyle = `rgba(120,60,255,${Math.sin(e * Math.PI) * 0.8})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = '#8040ff';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, H * 0.4 * e, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'tv-off': {
      const compress = 1 - p;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (compress > 0.05) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1, compress);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, from, W, H);
        ctx.restore();
      }
      if (p > 0.6) {
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(1, p - 0.6);
        ctx.translate(-W / 2, -H / 2);
        drawImg(ctx, to, W, H);
        ctx.restore();
      }
      // TV scanline
      ctx.fillStyle = `rgba(255,255,255,${compress * 0.6})`;
      ctx.fillRect(0, H / 2 - 2, W, 4);
      break;
    }

    case 'tv-static': {
      if (p < 0.5) {
        drawImg(ctx, from, W, H, 1 - p * 2);
      } else {
        drawImg(ctx, to, W, H, (p - 0.5) * 2);
      }
      // Static noise
      const noise = ctx.createImageData(W, H);
      const noiseFactor = 1 - Math.abs(p - 0.5) * 2;
      for (let ni = 0; ni < noise.data.length; ni += 4) {
        const v = Math.random() > 0.5 ? 200 : 20;
        noise.data[ni] = v; noise.data[ni + 1] = v; noise.data[ni + 2] = v;
        noise.data[ni + 3] = noiseFactor * 200;
      }
      ctx.putImageData(noise, 0, 0);
      break;
    }

    default:
      // Fallback: simple fade
      drawImg(ctx, from, W, H, 1 - p);
      drawImg(ctx, to, W, H, p);
  }
}


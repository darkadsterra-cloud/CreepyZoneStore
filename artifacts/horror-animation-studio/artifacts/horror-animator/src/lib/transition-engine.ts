// src/lib/transition-engine.ts
// Canvas-based transition renderer for recording + live preview

export interface TransitionState {
  active: boolean;
  id: string;
  progress: number;   // 0 → 1
  durationMs: number;
  startTime: number;
  fromImageId: string | null;
  toImageId: string | null;
}

export function makeTransitionState(): TransitionState {
  return {
    active: false, id: 'none', progress: 0, durationMs: 600,
    startTime: 0, fromImageId: null, toImageId: null,
  };
}

/**
 * Call every frame. Returns updated state + whether to skip normal draw.
 */
export function tickTransition(state: TransitionState, nowMs: number): TransitionState {
  if (!state.active || state.id === 'none' || state.durationMs === 0) {
    return { ...state, active: false, progress: 1 };
  }
  const elapsed = nowMs - state.startTime;
  const progress = Math.min(1, elapsed / state.durationMs);
  if (progress >= 1) return { ...state, active: false, progress: 1 };
  return { ...state, progress };
}

// ─── easing ──────────────────────────────────────────────────────
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function easeOut(t: number) { return 1 - Math.pow(1 - t, 2); }

/**
 * Draw a transition between fromEl and toEl onto ctx.
 * Both images are pre-rendered to offscreen canvases passed in.
 */
export function drawTransition(
  ctx: CanvasRenderingContext2D,
  fromCanvas: HTMLCanvasElement | null,
  toCanvas: HTMLCanvasElement | null,
  transitionId: string,
  rawProgress: number,   // 0→1
  W: number,
  H: number,
) {
  const p = easeInOut(rawProgress);
  const pOut = easeOut(rawProgress);

  const drawFrom = (alpha = 1, sx = 0, sy = 0, sc = 1) => {
    if (!fromCanvas) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(W / 2 + sx, H / 2 + sy);
    ctx.scale(sc, sc);
    ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
    ctx.restore();
  };

  const drawTo = (alpha = 1, sx = 0, sy = 0, sc = 1) => {
    if (!toCanvas) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(W / 2 + sx, H / 2 + sy);
    ctx.scale(sc, sc);
    ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
    ctx.restore();
  };

  switch (transitionId) {

    // ── BASIC ──
    case 'fade':
      drawFrom(1 - p);
      drawTo(p);
      break;

    case 'dissolve': {
      drawFrom(1);
      // Pixel dissolve approximation — noise overlay
      ctx.save();
      ctx.globalAlpha = p;
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      break;
    }

    case 'cut':
      if (rawProgress < 0.5) drawFrom();
      else drawTo();
      break;

    case 'dip-black':
      if (p < 0.5) {
        drawFrom(1 - p * 2);
      } else {
        drawTo((p - 0.5) * 2);
      }
      break;

    case 'dip-white':
      if (p < 0.5) {
        drawFrom(1 - p * 2);
        ctx.save(); ctx.globalAlpha = p * 2; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore();
      } else {
        ctx.save(); ctx.globalAlpha = 1 - (p - 0.5) * 2; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore();
        drawTo((p - 0.5) * 2);
      }
      break;

    case 'crossblur': {
      // Fake blur using scale trick
      const blurScale = p < 0.5 ? 1 + p * 0.05 : 1 + (1 - p) * 0.05;
      drawFrom(1 - p, 0, 0, blurScale);
      drawTo(p, 0, 0, blurScale);
      break;
    }

    // ── ZOOM ──
    case 'zoom-in':
      drawFrom(1 - p);
      drawTo(p, 0, 0, 0.5 + p * 0.5);
      break;

    case 'zoom-out':
      drawFrom(1 - p, 0, 0, 1 + p * 0.3);
      drawTo(p);
      break;

    case 'zoom-punch': {
      const punch = p < 0.3 ? 1 + p / 0.3 * 0.25 : 1;
      drawFrom(p < 0.5 ? 1 : 0, 0, 0, punch);
      if (p > 0.5) drawTo(1);
      break;
    }

    case 'zoom-spin': {
      const angle = p * Math.PI * 0.5;
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.translate(W / 2, H / 2); ctx.rotate(-angle); ctx.scale(1 + p * 0.2, 1 + p * 0.2);
      if (fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(W / 2, H / 2); ctx.rotate(angle); ctx.scale(1.2 - p * 0.2, 1.2 - p * 0.2);
      if (toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'scale-bounce': {
      const bounce = p < 0.5 ? 1 - p * 0.3 : 0.7 + (p - 0.5) * 0.6;
      drawFrom(1 - p, 0, 0, bounce);
      drawTo(p, 0, 0, bounce);
      break;
    }

    // ── SLIDE ──
    case 'slide-left':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, -p * W, 0, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, W - p * W, 0, W, H); ctx.restore(); }
      break;

    case 'slide-right':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, p * W, 0, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, -W + p * W, 0, W, H); ctx.restore(); }
      break;

    case 'slide-up':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, 0, -p * H, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, 0, H - p * H, W, H); ctx.restore(); }
      break;

    case 'slide-down':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, 0, p * H, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, 0, -H + p * H, W, H); ctx.restore(); }
      break;

    case 'push-left':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, -p * W, 0, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, W * (1 - p), 0, W, H); ctx.restore(); }
      break;

    case 'push-right':
      if (fromCanvas) { ctx.save(); ctx.drawImage(fromCanvas, p * W, 0, W, H); ctx.restore(); }
      if (toCanvas)   { ctx.save(); ctx.drawImage(toCanvas, -W * (1 - p), 0, W, H); ctx.restore(); }
      break;

    case 'wipe-left': {
      drawFrom();
      ctx.save();
      ctx.beginPath();
      ctx.rect(W * (1 - p), 0, W * p, H);
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      break;
    }

    case 'wipe-right': {
      drawFrom();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W * p, H);
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      break;
    }

    // ── CREATIVE ──
    case 'spin-180': {
      const flip = p < 0.5;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(p * Math.PI);
      ctx.scale(Math.abs(Math.cos(p * Math.PI)), 1);
      if (flip && fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      else if (!flip && toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'spin-360': {
      const flip360 = p < 0.5;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(p * Math.PI * 2);
      const s360 = 1 - Math.abs(Math.sin(p * Math.PI)) * 0.3;
      ctx.scale(s360, s360);
      ctx.globalAlpha = flip360 ? 1 - p * 1.5 : Math.min(1, (p - 0.4) * 2.5);
      if (flip360 && fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      else if (!flip360 && toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'flip-h': {
      const scaleX = Math.cos(p * Math.PI);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(scaleX, 1);
      if (scaleX >= 0 && fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      else if (scaleX < 0 && toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'flip-v': {
      const scaleY = Math.cos(p * Math.PI);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(1, scaleY);
      if (scaleY >= 0 && fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      else if (scaleY < 0 && toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'cube-left': {
      // Left face moving out
      ctx.save();
      ctx.translate(W / 2, H / 2);
      const cubeAngle = p * Math.PI * 0.5;
      ctx.transform(Math.cos(cubeAngle), 0, Math.sin(cubeAngle) * 0.3, 1, 0, 0);
      ctx.globalAlpha = 1 - p;
      if (fromCanvas) ctx.drawImage(fromCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.transform(Math.cos(cubeAngle), 0, -Math.sin(cubeAngle) * 0.3, 1, 0, 0);
      ctx.globalAlpha = p;
      if (toCanvas) ctx.drawImage(toCanvas, -W / 2, -H / 2, W, H);
      ctx.restore();
      break;
    }

    case 'ripple': {
      // Radial reveal with ripple rings
      drawFrom(1 - p * 0.5);
      ctx.save();
      const radius = pOut * Math.sqrt(W * W + H * H);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      // Ripple ring
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 8 * (1 - p);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'shockwave': {
      drawFrom(1 - p);
      const shock = pOut * Math.sqrt(W * W + H * H) * 0.6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, shock, 0, Math.PI * 2);
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      // Shockwave ring
      ctx.save();
      ctx.strokeStyle = `rgba(255,100,0,${0.8 * (1 - p)})`;
      ctx.lineWidth = 20 * (1 - p);
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, shock, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'heart-wipe': {
      // Approximate heart with circle + clip trick
      drawFrom(1);
      const heartR = pOut * Math.sqrt(W * W + H * H) * 0.8;
      ctx.save();
      ctx.beginPath();
      // Draw heart path scaled
      const hx = W / 2, hy = H / 2, hs = heartR * 0.7;
      ctx.moveTo(hx, hy + hs * 0.4);
      ctx.bezierCurveTo(hx - hs, hy - hs * 0.5, hx - hs, hy + hs * 0.2, hx, hy + hs * 0.8);
      ctx.bezierCurveTo(hx + hs, hy + hs * 0.2, hx + hs, hy - hs * 0.5, hx, hy + hs * 0.4);
      ctx.closePath();
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      break;
    }

    // ── HORROR ──
    case 'horror-glitch': {
      const glitchSlices = 8;
      const sliceH = H / glitchSlices;
      if (p < 0.4) {
        if (fromCanvas) {
          for (let i = 0; i < glitchSlices; i++) {
            const glitchX = Math.random() < 0.3 ? (Math.random() - 0.5) * W * 0.1 : 0;
            ctx.drawImage(fromCanvas, 0, i * sliceH, W, sliceH, glitchX, i * sliceH, W, sliceH);
          }
        }
      } else if (p < 0.6) {
        // Static flash
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,0' : '255,255,255'},0.6)`;
        ctx.fillRect(0, 0, W, H);
        if (Math.random() > 0.5 && toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      } else {
        if (toCanvas) {
          for (let i = 0; i < glitchSlices; i++) {
            const glitchX = Math.random() < 0.2 ? (Math.random() - 0.5) * W * 0.05 : 0;
            ctx.drawImage(toCanvas, 0, i * sliceH, W, sliceH, glitchX, i * sliceH, W, sliceH);
          }
        }
      }
      break;
    }

    case 'blood-wipe': {
      drawFrom(1);
      // Blood drip wipe from top
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H * p);
      // Add drip teeth at bottom of wipe
      const teethCount = 12;
      const teethW = W / teethCount;
      for (let i = 0; i < teethCount; i++) {
        const drip = Math.sin(i * 2.3 + p * 10) * H * 0.04 * p;
        ctx.lineTo(i * teethW + teethW, H * p + drip);
        ctx.lineTo(i * teethW + teethW / 2, H * p - H * 0.02 + drip);
      }
      ctx.closePath();
      ctx.clip();
      if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      ctx.restore();
      // Blood tint on edge
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - p);
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(0, H * p - 4, W, 8);
      ctx.restore();
      break;
    }

    case 'static-cut': {
      if (p < 0.3 || p > 0.7) {
        if (p < 0.5 && fromCanvas) ctx.drawImage(fromCanvas, 0, 0, W, H);
        else if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
      }
      // Static noise in middle
      if (p >= 0.25 && p <= 0.75) {
        const intensity = p < 0.5 ? (p - 0.25) / 0.25 : (0.75 - p) / 0.25;
        ctx.save();
        ctx.globalAlpha = intensity;
        // Draw noise lines
        for (let y = 0; y < H; y += 4) {
          ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
          ctx.fillRect(0, y, W, 2);
        }
        ctx.restore();
      }
      break;
    }

    case 'nightmare-fade': {
      drawFrom(1 - p);
      // Red nightmare overlay
      ctx.save();
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.6;
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      drawTo(p);
      break;
    }

    case 'demon-flash': {
      if (p < 0.3) {
        drawFrom(1);
        // Build up to flash
        ctx.save();
        ctx.globalAlpha = p / 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      } else if (p < 0.5) {
        // Full white flash
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      } else {
        // Reveal new with red tint fading
        drawTo(1);
        ctx.save();
        ctx.globalAlpha = (1 - (p - 0.5) * 2) * 0.5;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      break;
    }

    case 'void-swallow': {
      // Current image shrinks into void center, new expands out
      if (p < 0.5) {
        const sc = 1 - p * 1.6;
        drawFrom(Math.max(0, 1 - p * 3), 0, 0, Math.max(0.01, sc));
        // Void dark overlay growing
        ctx.save();
        ctx.globalAlpha = p * 2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        drawTo(Math.min(1, (p - 0.5) * 2), 0, 0, 0.1 + (p - 0.5) * 1.8);
      }
      break;
    }

    case 'skull-iris': {
      // Iris wipe (circle) — skull approximation with circle
      drawFrom(1);
      const irisR = p < 0.5
        ? 0
        : pOut * Math.sqrt(W * W + H * H);
      if (irisR > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, irisR, 0, Math.PI * 2);
        ctx.clip();
        if (toCanvas) ctx.drawImage(toCanvas, 0, 0, W, H);
        ctx.restore();
      }
      // Skull icon approximation as circle with inner circles
      if (p > 0.3 && p < 0.7) {
        ctx.save();
        ctx.globalAlpha = Math.sin((p - 0.3) / 0.4 * Math.PI) * 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, irisR + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'shatter-cut': {
      // Shatter effect — mosaic blocks shift
      const blockSize = 80;
      const cols = Math.ceil(W / blockSize);
      const rows = Math.ceil(H / blockSize);
      if (p < 0.5 && fromCanvas) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const dist = Math.sqrt((c - cols / 2) ** 2 + (r - rows / 2) ** 2) / Math.sqrt(cols * cols + rows * rows);
            const delay = dist * 0.5;
            const localP = Math.max(0, Math.min(1, (p * 2 - delay) / (1 - delay)));
            const offX = (Math.random() > 0.5 ? 1 : -1) * localP * W * 0.3;
            const offY = localP * H * 0.4;
            ctx.save();
            ctx.globalAlpha = 1 - localP;
            ctx.drawImage(fromCanvas, c * blockSize, r * blockSize, blockSize, blockSize,
              c * blockSize + offX, r * blockSize + offY, blockSize, blockSize);
            ctx.restore();
          }
        }
      } else if (p >= 0.5 && toCanvas) {
        ctx.drawImage(toCanvas, 0, 0, W, H);
      }
      break;
    }

    default:
      // Fallback: fade
      drawFrom(1 - p);
      drawTo(p);
      break;
  }
}

import { useEffect, useRef } from 'react';

interface ParticleOverlayProps {
  effects: string[];
  width: number;
  height: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; life: number; maxLife: number;
  color: string; type: string;
}

function createParticle(type: string, w: number, h: number): Particle {
  switch (type) {
    case 'blood-drip':
      return { x: Math.random() * w, y: -10, vx: (Math.random()-0.5)*0.5, vy: 1.5+Math.random()*3, size: 2+Math.random()*4, opacity: 0.7+Math.random()*0.3, life: 0, maxLife: h/2, color: `hsl(0,90%,${20+Math.random()*20}%)`, type };
    case 'fire-flakes':
      return { x: Math.random() * w, y: h + 10, vx: (Math.random()-0.5)*2, vy: -(1+Math.random()*2.5), size: 1.5+Math.random()*3, opacity: 0.6+Math.random()*0.4, life: 0, maxLife: h * 0.7, color: `hsl(${20+Math.random()*30},100%,${50+Math.random()*30}%)`, type };
    case 'ashes':
      return { x: Math.random() * w, y: -10, vx: (Math.random()-0.5)*1.5, vy: 0.5+Math.random()*1.5, size: 1+Math.random()*3, opacity: 0.4+Math.random()*0.5, life: 0, maxLife: h*1.2, color: `hsl(0,0%,${15+Math.random()*25}%)`, type };
    case 'fog':
      return { x: Math.random()*w, y: h - Math.random()*h*0.4, vx: (Math.random()-0.5)*0.5, vy: -(Math.random()*0.3), size: 40+Math.random()*80, opacity: 0.02+Math.random()*0.06, life: 0, maxLife: 300, color: `hsl(0,0%,${60+Math.random()*20}%)`, type };
    case 'sparks':
      return { x: Math.random()*w, y: h*0.7+Math.random()*h*0.3, vx: (Math.random()-0.5)*5, vy: -(2+Math.random()*5), size: 1+Math.random()*2, opacity: 0.8+Math.random()*0.2, life: 0, maxLife: 60, color: `hsl(${Math.random()<0.7?0:30},100%,60%)`, type };
    case 'skulls':
      return { x: Math.random()*w, y: h+20, vx: (Math.random()-0.5)*0.8, vy: -(0.3+Math.random()*0.8), size: 12+Math.random()*8, opacity: 0.3+Math.random()*0.5, life: 0, maxLife: h*1.5, color: `rgba(200,200,200,0.6)`, type };
    case 'tears':
      return { x: Math.random()*w, y: -10, vx: (Math.random()-0.5)*0.3, vy: 1+Math.random()*2, size: 1.5+Math.random()*2.5, opacity: 0.5+Math.random()*0.4, life: 0, maxLife: h, color: `hsl(230,50%,${30+Math.random()*20}%)`, type };
    case 'lightning':
      return { x: Math.random()*w, y: 0, vx: 0, vy: h, size: 1+Math.random()*2, opacity: 0.8, life: 0, maxLife: 20, color: 'rgba(200,220,255,0.9)', type };
    default:
      return { x:0,y:0,vx:0,vy:0,size:2,opacity:1,life:0,maxLife:60,color:'red',type };
  }
}

export default function ParticleOverlay({ effects, width, height }: ParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ particles: Particle[]; effects: string[] }>({ particles: [], effects: [] });

  useEffect(() => {
    stateRef.current.effects = effects;
  }, [effects]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const SPAWN_RATES: Record<string, number> = {
      'blood-drip': 0.3,
      'fire-flakes': 2,
      'ashes': 1.5,
      'fog': 0.1,
      'sparks': 1.5,
      'skulls': 0.05,
      'tears': 0.4,
      'lightning': 0.03,
    };

    const render = () => {
      const { particles, effects: activeEffects } = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const type of activeEffects) {
        const rate = SPAWN_RATES[type] || 0.5;
        if (Math.random() < rate) {
          particles.push(createParticle(type, w, h));
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'fire-flakes') { p.vx += Math.sin(frame * 0.05 + p.x) * 0.1; }
        if (p.type === 'ashes') { p.vx += Math.sin(frame * 0.03 + p.y) * 0.08; }
        if (p.type === 'sparks') { p.vy += 0.15; }
        const progress = p.life / p.maxLife;
        if (p.life >= p.maxLife || p.y < -20 || p.y > h + 50 || p.x < -50 || p.x > w + 50) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity * (1 - Math.max(0, progress - 0.7) * 3.33);

        if (p.type === 'blood-drip') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 0.4, p.y);
          ctx.lineTo(p.x + p.size * 0.4, p.y);
          ctx.lineTo(p.x + p.size * 0.2, p.y + p.size * 3);
          ctx.lineTo(p.x - p.size * 0.2, p.y + p.size * 3);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'fire-flakes') {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grd.addColorStop(0, p.color);
          grd.addColorStop(0.6, p.color.replace(/[\d.]+%\)/, '50%)'));
          grd.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        } else if (p.type === 'ashes') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, Math.sin(frame * 0.02) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'fog') {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, `rgba(200,200,220,${p.opacity * 2})`);
          grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else if (p.type === 'sparks') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.stroke();
        } else if (p.type === 'skulls') {
          ctx.font = `${p.size}px serif`;
          ctx.fillStyle = 'rgba(200,200,200,0.7)';
          ctx.fillText('💀', p.x, p.y);
        } else if (p.type === 'tears') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x - p.size * 0.6, p.y);
          ctx.lineTo(p.x, p.y + p.size * 2.5);
          ctx.lineTo(p.x + p.size * 0.6, p.y);
          ctx.fill();
        } else if (p.type === 'lightning') {
          if (p.life === 1) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.shadowColor = 'rgba(200,220,255,0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            let lx = p.x, ly = 0;
            ctx.moveTo(lx, ly);
            while (ly < h) {
              lx += (Math.random() - 0.5) * 40;
              ly += 30 + Math.random() * 40;
              ctx.lineTo(lx, ly);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        ctx.restore();
      }

      frame++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  if (effects.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

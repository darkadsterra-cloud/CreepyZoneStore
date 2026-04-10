import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  type: 'ember' | 'blood';
  drift: number;
  delay: number;
}

export default function AppBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const NUM_EMBERS = 40;
    const NUM_BLOOD = 15;

    for (let i = 0; i < NUM_EMBERS; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 100,
        size: 1 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.7,
        type: 'ember',
        drift: (Math.random() - 0.5) * 1.5,
        delay: Math.random() * 100,
      });
    }

    for (let i = 0; i < NUM_BLOOD; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -Math.random() * 200,
        size: 2 + Math.random() * 4,
        speed: 0.8 + Math.random() * 2,
        opacity: 0.4 + Math.random() * 0.6,
        type: 'blood',
        drift: (Math.random() - 0.5) * 0.5,
        delay: Math.random() * 120,
      });
    }

    let frame = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      for (const p of particles) {
        if (p.delay > 0) { p.delay--; continue; }

        if (p.type === 'ember') {
          p.y -= p.speed;
          p.x += p.drift + Math.sin(frame * 0.02 + p.x) * 0.5;
          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.x = Math.random() * canvas.width;
          }
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grd.addColorStop(0, `rgba(255, 200, 50, ${p.opacity})`);
          grd.addColorStop(0.5, `rgba(255, 80, 0, ${p.opacity * 0.6})`);
          grd.addColorStop(1, `rgba(200, 0, 0, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        } else {
          p.y += p.speed;
          p.x += p.drift;
          if (p.y > canvas.height + 100) {
            p.y = -Math.random() * 100;
            p.x = Math.random() * canvas.width;
          }
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.drift * 2, p.y + p.size * 8);
          ctx.strokeStyle = `rgba(180, 0, 0, ${p.opacity * 0.6})`;
          ctx.lineWidth = p.size * 0.6;
          ctx.lineCap = 'round';
          ctx.stroke();
          const headGrd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          headGrd.addColorStop(0, `rgba(220, 0, 0, ${p.opacity})`);
          headGrd.addColorStop(1, `rgba(180, 0, 0, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = headGrd;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.15 }}
    />
  );
}

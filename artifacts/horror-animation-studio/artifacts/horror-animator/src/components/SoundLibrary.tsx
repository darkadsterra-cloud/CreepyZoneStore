import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, Mic } from 'lucide-react';
import { HORROR_SOUNDS } from '@/lib/animations';

interface SoundLibraryProps {
  activeSounds: string[];
  onToggleSound: (id: string) => void;
  masterVolume: number;
  onVolumeChange: (v: number) => void;
}

type SoundInstance = {
  gainNode: GainNode;
  stopFns: (() => void)[];
};

function createHorrorSound(ctx: AudioContext, id: string, vol: number): SoundInstance | null {
  try {
    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, vol));
    gainNode.connect(ctx.destination);
    const stopFns: (() => void)[] = [];

    const osc = (freq: number, type: OscillatorType = 'sine') => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o;
    };
    const mkGain = (val: number) => { const g = ctx.createGain(); g.gain.value = val; return g; };
    const mkFilter = (type: BiquadFilterType, freq: number, q = 1) => {
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f;
    };
    const startOsc = (o: OscillatorNode) => {
      o.start(); stopFns.push(() => { try { o.stop(); o.disconnect(); } catch {} });
    };
    const mkNoise = (secs = 2) => {
      const size = ctx.sampleRate * secs;
      const buf = ctx.createBuffer(1, size, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    };
    const startNoise = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      stopFns.push(() => { try { s.stop(); s.disconnect(); } catch {} });
      return s;
    };
    const addInterval = (fn: () => void, ms: number) => {
      fn();
      const id = setInterval(() => { if (ctx.state !== 'closed') fn(); }, ms);
      stopFns.push(() => clearInterval(id));
    };

    switch (id) {
      case 'deep-drone': {
        [30, 60, 90].forEach((freq, i) => {
          const o = osc(freq + i * 0.3, 'sawtooth');
          const g = mkGain(0.25);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.15 + i * 0.05;
          const lg = mkGain(4); lfo.connect(lg); lg.connect(o.frequency);
          o.connect(g); g.connect(gainNode); o.start(); lfo.start();
          stopFns.push(() => { try { o.stop(); lfo.stop(); } catch {} });
        });
        break;
      }
      case 'wind-howl': {
        const o = osc(180, 'sawtooth');
        const f = mkFilter('bandpass', 700, 0.4); const g = mkGain(0.35);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.25;
        const lg = mkGain(350); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); o.start(); lfo.start();
        stopFns.push(() => { try { o.stop(); lfo.stop(); } catch {} });
        break;
      }
      case 'heavy-rain': {
        const s = startNoise(mkNoise(2));
        const f1 = mkFilter('bandpass', 2500, 0.2); const f2 = mkFilter('highpass', 800, 0.5);
        const g = mkGain(0.55); s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(gainNode); s.start();
        break;
      }
      case 'thunderstorm': {
        const s1 = startNoise(mkNoise(2));
        const ft = mkFilter('lowpass', 100, 2); const gt = mkGain(0.6);
        s1.connect(ft); ft.connect(gt); gt.connect(gainNode); s1.start();
        const s2 = startNoise(mkNoise(2));
        const fr = mkFilter('bandpass', 3000, 0.25); const gr = mkGain(0.35);
        s2.connect(fr); fr.connect(gr); gr.connect(gainNode); s2.start();
        break;
      }
      case 'thunder-rumble': {
        const s = startNoise(mkNoise(2));
        const f = mkFilter('lowpass', 100, 2); const g = mkGain(0.45);
        s.connect(f); f.connect(g); g.connect(gainNode); s.start();
        break;
      }
      case 'void-hum': {
        const o = osc(18, 'sine'); const g = mkGain(0.5);
        o.connect(g); g.connect(gainNode); startOsc(o);
        break;
      }
      case 'static-loop':
      case 'tv-static': {
        const s = startNoise(mkNoise(1));
        const f = mkFilter('bandpass', 2000, 0.4); const g = mkGain(0.25);
        s.connect(f); f.connect(g); g.connect(gainNode); s.start();
        break;
      }
      case 'haunted-room': {
        const o = osc(50, 'sine'); const f = mkFilter('lowpass', 180, 3); const g = mkGain(0.18);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
        const lg = mkGain(8); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); o.start(); lfo.start();
        stopFns.push(() => { try { o.stop(); lfo.stop(); } catch {} });
        break;
      }
      case 'inferno': {
        const s = startNoise(mkNoise(2));
        const f = mkFilter('bandpass', 350, 0.4); const g = mkGain(0.45);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 1.5;
        const lg = mkGain(0.25); lfo.connect(lg); lg.connect(g.gain);
        s.connect(f); f.connect(g); g.connect(gainNode); s.start(); lfo.start();
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'ritual-chant': {
        [110, 130, 165].forEach((freq, i) => {
          const o = osc(freq, 'sine'); const g = mkGain(0.18);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.25 + i * 0.08;
          const lg = mkGain(6); lfo.connect(lg); lg.connect(o.frequency);
          o.connect(g); g.connect(gainNode); o.start(); lfo.start();
          stopFns.push(() => { try { o.stop(); lfo.stop(); } catch {} });
        });
        break;
      }
      case 'heartbeat': {
        addInterval(() => {
          const beat = (freq: number, vol: number, delay: number) => {
            setTimeout(() => {
              if (ctx.state === 'closed') return;
              const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
              o.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
              const g = ctx.createGain();
              g.gain.setValueAtTime(vol, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
              o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 0.25);
            }, delay);
          };
          beat(60, 0.9, 0); beat(52, 0.7, 140);
        }, 950);
        break;
      }
      case 'church-bell': {
        addInterval(() => {
          [220, 440, 880].forEach(freq => {
            if (ctx.state === 'closed') return;
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.25, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
            o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 3);
          });
        }, 4200);
        break;
      }
      case 'jumpscare-sting': {
        addInterval(() => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(700, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.9, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 0.3);
        }, 5500);
        break;
      }
      case 'scream':
      case 'scream-female':
      case 'possessed-scream':
      case 'death-scream':
      case 'wail': {
        const base = id === 'scream-female' ? 750 : id === 'death-scream' ? 280 : id === 'wail' ? 550 : 460;
        const o1 = osc(base, 'sawtooth'); const o2 = osc(base * 1.4, 'square');
        const f = mkFilter('bandpass', base * 1.8, 1.5); const g = mkGain(0.35);
        const lfo = ctx.createOscillator(); lfo.frequency.value = id === 'possessed-scream' ? 14 : 7;
        const lg = mkGain(120); lfo.connect(lg); lg.connect(o1.frequency);
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(gainNode);
        o1.start(); o2.start(); lfo.start();
        stopFns.push(() => { try { o1.stop(); o2.stop(); lfo.stop(); } catch {} });
        break;
      }
      case 'demon-roar':
      case 'growl': {
        [38, 76, 152].forEach(freq => {
          const o = osc(freq, 'sawtooth'); const f = mkFilter('lowpass', 450, 4); const g = mkGain(0.22);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 2.5;
          const lg = mkGain(15); lfo.connect(lg); lg.connect(o.frequency);
          o.connect(f); f.connect(g); g.connect(gainNode); o.start(); lfo.start();
          stopFns.push(() => { try { o.stop(); lfo.stop(); } catch {} });
        });
        break;
      }
      case 'violin-shriek': {
        const o = osc(840, 'sawtooth'); const f = mkFilter('highpass', 550, 4); const g = mkGain(0.28);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 11;
        const lg = mkGain(18); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'dark-piano': {
        const notes = [130.81, 155.56, 146.83, 123.47, 116.54];
        let ni = 0;
        addInterval(() => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = notes[ni++ % notes.length];
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.45, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
          o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 2.5);
        }, 2200);
        break;
      }
      case 'horror-strings': {
        [220, 277, 330].forEach((freq, i) => {
          const o = osc(freq, 'sawtooth'); const f = mkFilter('bandpass', freq * 2, 1); const g = mkGain(0.12);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 5 + i;
          const lg = mkGain(2.5); lfo.connect(lg); lg.connect(o.detune);
          o.connect(f); f.connect(g); g.connect(gainNode); startOsc(o);
          lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }
      case 'organ-drone': {
        [65, 130, 195, 260].forEach(freq => {
          const o = osc(freq, 'square'); const g = mkGain(0.08);
          o.connect(g); g.connect(gainNode); startOsc(o);
        });
        break;
      }
      case 'whisper':
      case 'breathing': {
        const s = startNoise(mkNoise(2));
        const f = mkFilter('bandpass', 1400, 1.5); const g = mkGain(0.28);
        const lfo = ctx.createOscillator(); lfo.frequency.value = id === 'breathing' ? 0.28 : 0.08;
        const lg = mkGain(0.22); lfo.connect(lg); lg.connect(g.gain);
        s.connect(f); f.connect(g); g.connect(gainNode); s.start(); lfo.start();
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'electric-zap': {
        addInterval(() => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(150 + Math.random() * 350, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.7, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 0.18);
        }, 2200);
        break;
      }
      case 'door-creak': {
        const o = osc(180, 'sawtooth'); const f = mkFilter('bandpass', 280, 2.5); const g = mkGain(0.28);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.4;
        const lg = mkGain(80); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'chains': {
        addInterval(() => {
          if (ctx.state === 'closed') return;
          const s = ctx.createBufferSource(); s.buffer = mkNoise(0.25);
          const f = mkFilter('highpass', 900, 1.5); const g = ctx.createGain();
          g.gain.setValueAtTime(0.7, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          s.connect(f); f.connect(g); g.connect(gainNode); s.start(); s.stop(ctx.currentTime + 0.25);
        }, 1600);
        break;
      }
      case 'child-laugh':
      case 'laugh':
      case 'evil-laugh-sfx': {
        const base = id === 'child-laugh' ? 380 : 190;
        const o = osc(base, 'sine'); const g = mkGain(0.28);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 4.5;
        const lg = mkGain(45); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'moan':
      case 'crying':
      case 'death-rattle': {
        const freq = id === 'crying' ? 280 : id === 'death-rattle' ? 120 : 140;
        const o = osc(freq, 'sine'); const g = mkGain(0.22);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.35;
        const lg = mkGain(id === 'death-rattle' ? 25 : 12); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'music-box': {
        const notes = [523, 587, 659, 698, 784, 698, 659, 587];
        let ni = 0;
        addInterval(() => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = notes[ni++ % notes.length] * 0.5;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.28, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
          o.connect(g); g.connect(gainNode); o.start(); o.stop(ctx.currentTime + 0.7);
        }, 620);
        break;
      }
      case 'choir-dark': {
        [108, 216, 162].forEach((freq, i) => {
          const o = osc(freq, 'sine'); const g = mkGain(0.12);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 4.5 + i * 0.25;
          const lg = mkGain(1.8); lfo.connect(lg); lg.connect(o.detune);
          o.connect(g); g.connect(gainNode); startOsc(o);
          lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }
      case 'synth-horror': {
        const o = osc(52, 'square'); const f = mkFilter('lowpass', 280, 1.5); const g = mkGain(0.28);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.45;
        const lg = mkGain(90); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      case 'hiss': {
        const s = startNoise(mkNoise(1));
        const f = mkFilter('highpass', 3000, 1); const g = mkGain(0.35);
        s.connect(f); f.connect(g); g.connect(gainNode); s.start();
        break;
      }
      case 'howl': {
        const o = osc(120, 'sawtooth'); const f = mkFilter('bandpass', 600, 1.2); const g = mkGain(0.32);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.5;
        const lg = mkGain(200); lfo.connect(lg); lg.connect(o.frequency);
        o.connect(f); f.connect(g); g.connect(gainNode); startOsc(o);
        lfo.start(); stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }
      default: {
        const o = osc(55 + Math.random() * 30, 'sine'); const g = mkGain(0.12);
        o.connect(g); g.connect(gainNode); startOsc(o);
        break;
      }
    }
    return { gainNode, stopFns };
  } catch (err) {
    console.warn('SoundLibrary error for', id, err);
    return null;
  }
}

const categoryMeta = {
  ambient: { label: 'Ambient',          icon: Wind,  color: 'text-blue-400'   },
  effect:  { label: 'Effects',          icon: Zap,   color: 'text-orange-400' },
  music:   { label: 'Music',            icon: Music, color: 'text-purple-400' },
  voice:   { label: 'Voices & Screams', icon: Mic,   color: 'text-red-400'    },
};

export default function SoundLibrary({ activeSounds, onToggleSound, masterVolume, onVolumeChange }: SoundLibraryProps) {
  const instancesRef = useRef<Record<string, SoundInstance>>({});
  const ctxRef = useRef<AudioContext | null>(null);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    ambient: true, effect: false, music: false, voice: false,
  });

  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    } catch (e) {
      console.warn('AudioContext failed:', e);
      return null;
    }
  }, []);

  const stopInstance = useCallback((id: string) => {
    const inst = instancesRef.current[id];
    if (inst) {
      inst.stopFns.forEach(fn => { try { fn(); } catch {} });
      try { inst.gainNode.disconnect(); } catch {}
      delete instancesRef.current[id];
    }
  }, []);

  const startInstance = useCallback((id: string) => {
    const ctx = getCtx();
    if (!ctx) return;
    stopInstance(id);
    const inst = createHorrorSound(ctx, id, masterVolume);
    if (inst) instancesRef.current[id] = inst;
  }, [getCtx, stopInstance, masterVolume]);

  const handleToggle = (id: string) => {
    if (activeSounds.includes(id)) {
      stopInstance(id);
    } else {
      startInstance(id);
    }
    onToggleSound(id);
  };

  useEffect(() => {
    Object.values(instancesRef.current).forEach(inst => {
      try { inst.gainNode.gain.value = Math.max(0, Math.min(1, masterVolume)); } catch {}
    });
  }, [masterVolume]);

  useEffect(() => {
    return () => {
      Object.keys(instancesRef.current).forEach(id => stopInstance(id));
      try { ctxRef.current?.close(); } catch {}
    };
  }, [stopInstance]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sound Library</h3>
        {activeSounds.length > 0 && (
          <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
            {activeSounds.length} playing
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeSounds.length > 0
          ? <Volume2 className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          : <VolumeX className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
        <input type="range" min="0" max="1" step="0.05" value={masterVolume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
        <span className="text-[9px] text-zinc-500 font-mono w-6">{Math.round(masterVolume * 100)}</span>
      </div>

      {(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const meta = categoryMeta[cat];
        const Icon = meta.icon;
        const sounds = HORROR_SOUNDS.filter(s => s.category === cat);
        const activeInCat = sounds.filter(s => activeSounds.includes(s.id)).length;
        const isOpen = openCats[cat];
        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${meta.color}`} />
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                {activeInCat > 0 && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded">
                    {activeInCat} on
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-600">{sounds.length}</span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-1 p-2 bg-zinc-900/30 max-h-[250px] overflow-y-auto">
                {sounds.map(sound => {
                  const isActive = activeSounds.includes(sound.id);
                  return (
                    <button key={sound.id} onClick={() => handleToggle(sound.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                          : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-700'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium truncate">{sound.name}</p>
                        <p className="text-[8px] text-zinc-600 truncate">{sound.description}</p>
                      </div>
                      {isActive && <span className="text-[8px] text-red-400 flex-shrink-0">▶</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

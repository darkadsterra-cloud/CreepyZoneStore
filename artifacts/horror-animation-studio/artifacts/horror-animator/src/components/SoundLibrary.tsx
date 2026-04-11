import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, Mic } from 'lucide-react';
import { HORROR_SOUNDS } from '@/lib/animations';

interface SoundLibraryProps {
  activeSounds: string[];
  onToggleSound: (id: string) => void;
  masterVolume: number;
  onVolumeChange: (v: number) => void;
}

type AudioNodes = {
  ctx: AudioContext;
  gainNode: GainNode;
  nodes: AudioNode[];
  stop: () => void;
};

function createHorrorSound(ctx: AudioContext, id: string, masterVol: number): AudioNodes | null {
  const master = ctx.createGain();
  master.gain.value = masterVol;
  master.connect(ctx.destination);
  const nodes: AudioNode[] = [master];
  const stopFns: (() => void)[] = [];

  const osc = (freq: number, type: OscillatorType = 'sine') => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    return o;
  };
  const gain = (val: number) => {
    const g = ctx.createGain();
    g.gain.value = val;
    return g;
  };
  const filter = (type: BiquadFilterType, freq: number, q = 1) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };
  const playOsc = (o: OscillatorNode) => {
    o.start();
    nodes.push(o);
    stopFns.push(() => { try { o.stop(); } catch {} });
  };
  const noiseBuffer = (seconds = 2) => {
    const size = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  };
  const playNoise = (buf: AudioBuffer) => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    nodes.push(s);
    stopFns.push(() => { try { s.stop(); } catch {} });
    return s;
  };

  try {
    switch (id) {

      case 'deep-drone': {
        [30, 60, 90].forEach((freq, i) => {
          const o = osc(freq + i * 0.3, 'sawtooth');
          const g = gain(0.3);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.2 + i * 0.05;
          const lfoG = gain(5);
          lfo.connect(lfoG);
          lfoG.connect(o.frequency);
          lfo.start();
          o.connect(g); g.connect(master);
          playOsc(o);
          stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }

      case 'wind-howl': {
        const o = osc(200, 'sawtooth');
        const f = filter('bandpass', 800, 0.5);
        const g = gain(0.4);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.3;
        const lfoG = gain(400);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(f); f.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'heavy-rain': {
        const s = playNoise(noiseBuffer(2));
        const f1 = filter('bandpass', 2500, 0.2);
        const f2 = filter('highpass', 800, 0.5);
        const g = gain(0.6);
        s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(master);
        s.start();
        break;
      }

      case 'thunderstorm': {
        const thunder = playNoise(noiseBuffer(2));
        const ft = filter('lowpass', 120, 2);
        const gt = gain(0.7);
        thunder.connect(ft); ft.connect(gt); gt.connect(master);
        thunder.start();

        const rain = playNoise(noiseBuffer(2));
        const fr = filter('bandpass', 3000, 0.3);
        const gr = gain(0.4);
        rain.connect(fr); fr.connect(gr); gr.connect(master);
        rain.start();
        break;
      }

      case 'thunder-rumble': {
        const s = playNoise(noiseBuffer(2));
        const f = filter('lowpass', 120, 2);
        const g = gain(0.5);
        s.connect(f); f.connect(g); g.connect(master);
        s.start();
        break;
      }

      case 'void-hum': {
        const o = osc(20, 'sine');
        const g = gain(0.6);
        o.connect(g); g.connect(master);
        playOsc(o);
        break;
      }

      case 'static-loop':
      case 'tv-static': {
        const s = playNoise(noiseBuffer(1));
        const f = filter('bandpass', 2000, 0.5);
        const g = gain(0.3);
        s.connect(f); f.connect(g); g.connect(master);
        s.start();
        break;
      }

      case 'haunted-room': {
        const o = osc(55, 'sine');
        const f = filter('lowpass', 200, 3);
        const g = gain(0.2);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoG = gain(10);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(f); f.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'inferno': {
        const s = playNoise(noiseBuffer(2));
        const f = filter('bandpass', 400, 0.5);
        const g = gain(0.5);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 2;
        const lfoG = gain(0.3);
        lfoG.connect(g.gain); lfo.connect(lfoG); lfo.start();
        s.connect(f); f.connect(g); g.connect(master);
        s.start();
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'ritual-chant': {
        [110, 130, 165].forEach((freq, i) => {
          const o = osc(freq, 'sine');
          const g = gain(0.2);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.3 + i * 0.1;
          const lfoG = gain(8);
          lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
          o.connect(g); g.connect(master);
          playOsc(o);
          stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }

      case 'heartbeat': {
        const beat = () => {
          if (ctx.state === 'closed') return;
          const k = ctx.createOscillator();
          k.type = 'sine'; k.frequency.value = 60;
          k.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          k.connect(g); g.connect(master);
          k.start(); k.stop(ctx.currentTime + 0.3);
          setTimeout(() => {
            if (ctx.state === 'closed') return;
            const k2 = ctx.createOscillator();
            k2.type = 'sine'; k2.frequency.value = 55;
            k2.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            const g2 = ctx.createGain();
            g2.gain.setValueAtTime(0.8, ctx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            k2.connect(g2); g2.connect(master);
            k2.start(); k2.stop(ctx.currentTime + 0.2);
          }, 150);
        };
        beat();
        const iv = setInterval(beat, 900);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'church-bell': {
        const playBell = () => {
          if (ctx.state === 'closed') return;
          [220, 440, 880].forEach(freq => {
            const o = ctx.createOscillator();
            o.type = 'sine'; o.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
            o.connect(g); g.connect(master);
            o.start(); o.stop(ctx.currentTime + 3);
          });
        };
        playBell();
        const iv = setInterval(playBell, 4000);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'jumpscare-sting': {
        const strike = () => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(800, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          o.connect(g); g.connect(master);
          o.start(); o.stop(ctx.currentTime + 0.3);
        };
        strike();
        const iv = setInterval(strike, 5000);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'scream':
      case 'scream-female':
      case 'possessed-scream':
      case 'death-scream':
      case 'wail': {
        const base = id === 'scream-female' ? 800 : id === 'death-scream' ? 300 : id === 'wail' ? 600 : 500;
        const o1 = osc(base, 'sawtooth');
        const o2 = osc(base * 1.5, 'square');
        const f = filter('bandpass', base * 2, 2);
        const g = gain(0.4);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = id === 'possessed-scream' ? 15 : 8;
        const lfoG = gain(150);
        lfo.connect(lfoG); lfoG.connect(o1.frequency); lfo.start();
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
        playOsc(o1); playOsc(o2);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'demon-roar':
      case 'growl': {
        [40, 80, 160].forEach(freq => {
          const o = osc(freq, 'sawtooth');
          const f = filter('lowpass', 500, 5);
          const g = gain(0.25);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 3;
          const lfoG = gain(20);
          lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
          o.connect(f); f.connect(g); g.connect(master);
          playOsc(o);
          stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }

      case 'violin-shriek': {
        const o = osc(880, 'sawtooth');
        const f = filter('highpass', 600, 5);
        const g = gain(0.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 12;
        const lfoG = gain(20);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(f); f.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'dark-piano': {
        const notes = [130.81, 155.56, 146.83, 123.47];
        let ni = 0;
        const playNote = () => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator();
          o.type = 'sine'; o.frequency.value = notes[ni++ % notes.length];
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.5, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          o.connect(g); g.connect(master);
          o.start(); o.stop(ctx.currentTime + 2);
        };
        playNote();
        const iv = setInterval(playNote, 2000);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'horror-strings': {
        [220, 277, 330].forEach((freq, i) => {
          const o = osc(freq, 'sawtooth');
          const f = filter('bandpass', freq * 2, 1);
          const g = gain(0.15);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 5 + i;
          const lfoG = gain(3);
          lfo.connect(lfoG); lfoG.connect(o.detune); lfo.start();
          o.connect(f); f.connect(g); g.connect(master);
          playOsc(o);
          stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }

      case 'organ-drone': {
        [65, 130, 195, 260].forEach(freq => {
          const o = osc(freq, 'square');
          const g = gain(0.1);
          o.connect(g); g.connect(master);
          playOsc(o);
        });
        break;
      }

      case 'whisper':
      case 'breathing': {
        const s = playNoise(noiseBuffer(2));
        const f = filter('bandpass', 1500, 2);
        const g = gain(0.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = id === 'breathing' ? 0.3 : 0.1;
        const lfoG = gain(0.25);
        lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start();
        s.connect(f); f.connect(g); g.connect(master);
        s.start();
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'electric-zap': {
        const zap = () => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(200 + Math.random() * 400, ctx.currentTime);
          o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.8, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          o.connect(g); g.connect(master);
          o.start(); o.stop(ctx.currentTime + 0.2);
        };
        zap();
        const iv = setInterval(zap, 2000 + Math.random() * 2000);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'door-creak': {
        const o = osc(200, 'sawtooth');
        const f = filter('bandpass', 300, 3);
        const g = gain(0.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.5;
        const lfoG = gain(100);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(f); f.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'chains': {
        const clank = () => {
          if (ctx.state === 'closed') return;
          const s = ctx.createBufferSource();
          const buf = noiseBuffer(0.3);
          s.buffer = buf;
          const f = filter('highpass', 1000, 2);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.8, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          s.connect(f); f.connect(g); g.connect(master);
          s.start(); s.stop(ctx.currentTime + 0.3);
        };
        clank();
        const iv = setInterval(clank, 1500 + Math.random() * 1000);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'child-laugh':
      case 'laugh':
      case 'evil-laugh-sfx': {
        const o = osc(id === 'child-laugh' ? 400 : 200, 'sine');
        const g = gain(0.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5;
        const lfoG = gain(50);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'moan':
      case 'crying':
      case 'death-rattle': {
        const o = osc(id === 'crying' ? 300 : 150, 'sine');
        const g = gain(0.25);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.4;
        const lfoG = gain(id === 'death-rattle' ? 30 : 15);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      case 'music-box': {
        const notes = [523, 587, 659, 698, 784, 698, 659, 587];
        let ni = 0;
        const playNote = () => {
          if (ctx.state === 'closed') return;
          const o = ctx.createOscillator();
          o.type = 'sine'; o.frequency.value = notes[ni++ % notes.length] * 0.5;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.3, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          o.connect(g); g.connect(master);
          o.start(); o.stop(ctx.currentTime + 0.8);
        };
        playNote();
        const iv = setInterval(playNote, 600);
        stopFns.push(() => clearInterval(iv));
        break;
      }

      case 'choir-dark': {
        [110, 220, 165].forEach((freq, i) => {
          const o = osc(freq, 'sine');
          const g = gain(0.15);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 5 + i * 0.3;
          const lfoG = gain(2);
          lfo.connect(lfoG); lfoG.connect(o.detune); lfo.start();
          o.connect(g); g.connect(master);
          playOsc(o);
          stopFns.push(() => { try { lfo.stop(); } catch {} });
        });
        break;
      }

      case 'synth-horror': {
        const o = osc(55, 'square');
        const f = filter('lowpass', 300, 2);
        const g = gain(0.3);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.5;
        const lfoG = gain(100);
        lfo.connect(lfoG); lfoG.connect(o.frequency); lfo.start();
        o.connect(f); f.connect(g); g.connect(master);
        playOsc(o);
        stopFns.push(() => { try { lfo.stop(); } catch {} });
        break;
      }

      default: {
        const o = osc(60 + Math.random() * 40, 'sine');
        const g = gain(0.15);
        o.connect(g); g.connect(master);
        playOsc(o);
        break;
      }
    }
  } catch (e) {
    console.warn('Sound error for', id, e);
    return null;
  }

  return { ctx, gainNode: master, nodes, stop: () => stopFns.forEach(fn => fn()) };
}

const categoryMeta = {
  ambient: { label: 'Ambient',          icon: Wind,  color: 'text-blue-400'   },
  effect:  { label: 'Effects',          icon: Zap,   color: 'text-orange-400' },
  music:   { label: 'Music',            icon: Music, color: 'text-purple-400' },
  voice:   { label: 'Voices & Screams', icon: Mic,   color: 'text-red-400'    },
};

export default function SoundLibrary({
  activeSounds,
  onToggleSound,
  masterVolume,
  onVolumeChange,
}: SoundLibraryProps) {
  const audioNodes = useRef<Record<string, AudioNodes>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    ambient: true, effect: false, music: false, voice: false,
  });

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const startSound = useCallback((id: string) => {
  const sound = HORROR_SOUNDS.find(s => s.id === id);
  if (sound?.file) {
    const audio = new Audio(sound.file);
    audio.loop = true;
    audio.volume = masterVolume;
    audio.play().catch(e => console.warn('Audio play failed:', e));
    audioNodes.current[id] = {
      ctx: null as any,
      gainNode: null as any,
      nodes: [],
      stop: () => { audio.pause(); audio.currentTime = 0; },
    };
    return;
  }
  const ctx = getCtx();
  const nodes = createHorrorSound(ctx, id, masterVolume);
  if (nodes) audioNodes.current[id] = nodes;
}, [getCtx, masterVolume]);

  const stopSound = useCallback((id: string) => {
    const n = audioNodes.current[id];
    if (n) { n.stop(); delete audioNodes.current[id]; }
  }, []);

  const handleToggle = (id: string) => {
    if (activeSounds.includes(id)) stopSound(id);
    else startSound(id);
    onToggleSound(id);
  };

  useEffect(() => {
    Object.values(audioNodes.current).forEach(n => {
      n.gainNode.gain.value = masterVolume;
    });
  }, [masterVolume]);

  useEffect(() => {
    return () => { Object.values(audioNodes.current).forEach(n => n.stop()); };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Sound Library
        </h3>
        {activeSounds.length > 0 && (
          <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
            {activeSounds.length} playing
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeSounds.length > 0
          ? <Volume2 className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          : <VolumeX className="w-3 h-3 text-zinc-600 flex-shrink-0" />
        }
        <input
          type="range" min="0" max="1" step="0.05" value={masterVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <span className="text-[9px] text-zinc-500 font-mono w-6">
          {Math.round(masterVolume * 100)}
        </span>
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
                    <button
                      key={sound.id}
                      onClick={() => handleToggle(sound.id)}
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

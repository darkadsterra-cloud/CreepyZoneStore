import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, RotateCcw, Type } from 'lucide-react';

const HORROR_PRESETS = [
  'Your soul is mine...',
  'They are watching you...',
  'You cannot escape me...',
  'The darkness is coming...',
  'I see you in the shadows...',
  'Welcome to your nightmare...',
  'You should not have come here...',
  'We are all going to die...',
  'The ritual has begun...',
  'Your end is near...',
  'Run. While you still can.',
  'No one can hear you scream...',
];

const EFFECTS = [
  { id: 'normal', label: 'Normal' },
  { id: 'slow', label: 'Slow & Deep' },
  { id: 'fast', label: 'Frantic' },
  { id: 'whisper', label: 'Whisper' },
  { id: 'echo', label: 'Echo' },
];

export default function TTSPanel() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [effect, setEffect] = useState('normal');
  const [speaking, setSpeaking] = useState(false);
  const [pitch, setPitch] = useState(0.7);
  const [rate, setRate] = useState(0.7);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const load = () => {
      const all = speechSynthesis.getVoices();
      setVoices(all);
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  const applyEffect = (u: SpeechSynthesisUtterance) => {
    switch (effect) {
      case 'slow':   u.pitch = 0.3; u.rate = 0.5; break;
      case 'fast':   u.pitch = 1.2; u.rate = 1.8; break;
      case 'whisper':u.pitch = 0.5; u.rate = 0.6; u.volume = 0.3; break;
      case 'echo':   u.pitch = pitch; u.rate = rate * 0.7; break;
      default:       u.pitch = pitch; u.rate = rate; break;
    }
  };

  const speak = () => {
    if (!text.trim()) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voices[selectedVoice]) u.voice = voices[selectedVoice];
    u.volume = 0.9;
    applyEffect(u);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    speechSynthesis.speak(u);

    if (effect === 'echo') {
      setTimeout(() => {
        const u2 = new SpeechSynthesisUtterance(text);
        if (voices[selectedVoice]) u2.voice = voices[selectedVoice];
        u2.pitch = pitch * 0.8;
        u2.rate = rate * 0.6;
        u2.volume = 0.4;
        speechSynthesis.speak(u2);
      }, 600);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="w-3.5 h-3.5 text-zinc-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Text-to-Speech
        </h3>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type horror text to speak..."
          rows={3}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-1">
        {HORROR_PRESETS.slice(0, 6).map((p, i) => (
          <button key={i} onClick={() => setText(p)}
            className="text-[9px] text-left text-zinc-500 hover:text-zinc-300 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 rounded px-1.5 py-1 transition-colors truncate"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-500 uppercase">Voice</span>
        </div>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(Number(e.target.value))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {voices.map((v, i) => (
            <option key={i} value={i}>{v.name} ({v.lang})</option>
          ))}
          {voices.length === 0 && <option>Loading voices...</option>}
        </select>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500 uppercase">Horror Effect</span>
        <div className="grid grid-cols-3 gap-1">
          {EFFECTS.map(e => (
            <button key={e.id} onClick={() => setEffect(e.id)}
              className={`text-[10px] py-1 rounded-lg border transition-colors ${effect === e.id ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {effect === 'normal' || effect === 'echo' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500">Pitch ({pitch.toFixed(1)})</span>
            <input type="range" min="0.1" max="2" step="0.1" value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500">Rate ({rate.toFixed(1)})</span>
            <input type="range" min="0.1" max="2" step="0.1" value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          onClick={speaking ? stop : speak}
          disabled={!text.trim()}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${speaking ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'}`}
        >
          {speaking ? <><Square className="w-3 h-3 fill-current" /> Stop</> : <><Play className="w-3 h-3 fill-current" /> Speak</>}
        </button>
        <button onClick={() => setText('')} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, RotateCcw, Type, ChevronDown } from 'lucide-react';

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
  'تمہاری روح میری ہے...',
  'اندھیرا آ رہا ہے...',
  'تم بھاگ نہیں سکتے...',
  'यह तुम्हारा अंत है...',
  'मैं तुम्हें देख रहा हूँ...',
  'अंधेरे से बाहर मत जाओ...',
];

const HORROR_VOICE_PROFILES = [
  {
    id: 'demonic',
    label: '😈 Demonic',
    description: 'Deep possessed demon voice',
    pitch: 0.1,
    rate: 0.55,
    volume: 1.0,
    echoDelay: 0,
    echoVolume: 0,
  },
  {
    id: 'possessed',
    label: '👿 Possessed by Evil',
    description: 'Erratic possession voice',
    pitch: 0.2,
    rate: 0.45,
    volume: 1.0,
    echoDelay: 300,
    echoVolume: 0.5,
  },
  {
    id: 'ghost',
    label: '👻 Ghost Whisper',
    description: 'Ethereal ghostly whisper',
    pitch: 0.5,
    rate: 0.5,
    volume: 0.25,
    echoDelay: 700,
    echoVolume: 0.3,
  },
  {
    id: 'witch',
    label: '🧙 Witch Curse',
    description: 'Cackling witch voice',
    pitch: 1.8,
    rate: 0.65,
    volume: 0.85,
    echoDelay: 0,
    echoVolume: 0,
  },
  {
    id: 'monster',
    label: '👹 Monster Roar',
    description: 'Guttural monster growl',
    pitch: 0.1,
    rate: 0.4,
    volume: 1.0,
    echoDelay: 0,
    echoVolume: 0,
  },
  {
    id: 'child-evil',
    label: '🎠 Evil Child',
    description: 'Creepy possessed child',
    pitch: 2.0,
    rate: 0.7,
    volume: 0.8,
    echoDelay: 500,
    echoVolume: 0.4,
  },
  {
    id: 'banshee',
    label: '🌀 Banshee Wail',
    description: 'Shrieking banshee scream',
    pitch: 1.9,
    rate: 0.8,
    volume: 1.0,
    echoDelay: 200,
    echoVolume: 0.6,
  },
  {
    id: 'satan',
    label: '🔥 Satan\'s Voice',
    description: 'Ultimate dark lord voice',
    pitch: 0.1,
    rate: 0.35,
    volume: 1.0,
    echoDelay: 400,
    echoVolume: 0.7,
  },
  {
    id: 'normal',
    label: '🎙️ Normal',
    description: 'Standard voice',
    pitch: 1.0,
    rate: 1.0,
    volume: 0.9,
    echoDelay: 0,
    echoVolume: 0,
  },
];

const LANG_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'en', label: 'English' },
  { id: 'ur', label: 'اردو' },
  { id: 'hi', label: 'हिंदी' },
];

export default function TTSPanel() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState('demonic');
  const [speaking, setSpeaking] = useState(false);
  const [langFilter, setLangFilter] = useState('all');
  const [showPresets, setShowPresets] = useState(false);
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

  const filteredVoices = voices.filter(v => {
    if (langFilter === 'all') return true;
    return v.lang.toLowerCase().startsWith(langFilter);
  });

  const profile = HORROR_VOICE_PROFILES.find(p => p.id === selectedProfile) || HORROR_VOICE_PROFILES[0];

  const speak = () => {
    if (!text.trim()) return;
    speechSynthesis.cancel();

    const makeUtterance = (vol: number, pitchMod = 1, rateMod = 1) => {
      const u = new SpeechSynthesisUtterance(text);
      const voiceList = filteredVoices.length > 0 ? filteredVoices : voices;
      if (voiceList[selectedVoice]) u.voice = voiceList[selectedVoice];
      u.pitch = Math.max(0.1, Math.min(2, profile.pitch * pitchMod));
      u.rate = Math.max(0.1, Math.min(10, profile.rate * rateMod));
      u.volume = vol;
      return u;
    };

    const u = makeUtterance(profile.volume);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    speechSynthesis.speak(u);

    if (profile.echoDelay > 0 && profile.echoVolume > 0) {
      setTimeout(() => {
        const u2 = makeUtterance(profile.echoVolume, 0.85, 0.85);
        speechSynthesis.speak(u2);
      }, profile.echoDelay);
      if (profile.id === 'possessed') {
        setTimeout(() => {
          const u3 = makeUtterance(profile.echoVolume * 0.5, 0.7, 0.7);
          speechSynthesis.speak(u3);
        }, profile.echoDelay * 2);
      }
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

      {/* Text input */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type horror text... (English / اردو / हिंदी)"
          rows={3}
          className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 resize-none focus:outline-none focus:ring-1 focus:ring-red-500 placeholder-zinc-600"
        />
        <div className="absolute bottom-2 right-2 text-[9px] text-zinc-700">{text.length}</div>
      </div>

      {/* Presets toggle */}
      <button
        onClick={() => setShowPresets(p => !p)}
        className="w-full flex items-center justify-between text-[10px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/30 border border-zinc-800 rounded px-2 py-1 transition-colors"
      >
        <span>Horror Presets</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
      </button>

      {showPresets && (
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
          {HORROR_PRESETS.map((p, i) => (
            <button key={i} onClick={() => setText(p)}
              className="text-[9px] text-left text-zinc-500 hover:text-zinc-300 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 rounded px-1.5 py-1 transition-colors truncate"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Horror Voice Profiles */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">😈 Horror Voice</span>
        <div className="grid grid-cols-2 gap-1">
          {HORROR_VOICE_PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              title={p.description}
              className={`text-[9px] py-1.5 px-1 rounded-lg border transition-colors text-left leading-tight ${
                selectedProfile === p.id
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {profile && (
          <p className="text-[9px] text-zinc-600 italic px-1">{profile.description}</p>
        )}
      </div>

      {/* Language filter */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Language Filter</span>
        <div className="flex gap-1">
          {LANG_FILTERS.map(l => (
            <button
              key={l.id}
              onClick={() => { setLangFilter(l.id); setSelectedVoice(0); }}
              className={`flex-1 text-[9px] py-1 rounded border transition-colors ${
                langFilter === l.id
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-zinc-800/30 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice selector */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-500 uppercase">
            Voice ({filteredVoices.length > 0 ? filteredVoices.length : voices.length} available)
          </span>
        </div>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(Number(e.target.value))}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {(filteredVoices.length > 0 ? filteredVoices : voices).map((v, i) => (
            <option key={i} value={i}>{v.name} ({v.lang})</option>
          ))}
          {voices.length === 0 && <option>Loading voices...</option>}
          {voices.length > 0 && filteredVoices.length === 0 && (
            <option>No {langFilter} voices found — try another language</option>
          )}
        </select>
      </div>

      {/* Profile params display */}
      {selectedProfile !== 'normal' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 grid grid-cols-3 gap-1">
          <div className="text-center">
            <p className="text-[8px] text-zinc-600 uppercase">Pitch</p>
            <p className="text-[10px] text-red-400 font-mono">{profile.pitch.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-zinc-600 uppercase">Rate</p>
            <p className="text-[10px] text-red-400 font-mono">{profile.rate.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-zinc-600 uppercase">Echo</p>
            <p className="text-[10px] text-red-400 font-mono">{profile.echoDelay > 0 ? `${profile.echoDelay}ms` : 'off'}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={speaking ? stop : speak}
          disabled={!text.trim() || (filteredVoices.length === 0 && voices.length === 0)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            speaking
              ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {speaking
            ? <><Square className="w-3 h-3 fill-current" /> Stop</>
            : <><Play className="w-3 h-3 fill-current" /> {profile.label.split(' ').slice(1).join(' ') || 'Speak'}</>
          }
        </button>
        <button onClick={() => setText('')} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {voices.length === 0 && (
        <p className="text-[9px] text-zinc-600 italic text-center">
          Browser voices loading... (may take a moment)
        </p>
      )}
    </div>
  );
}

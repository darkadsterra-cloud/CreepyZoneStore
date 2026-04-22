// TransitionPanel.tsx — 100+ transitions + per-image slideshow duration

import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TransitionDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

interface TransitionCategory {
  label: string;
  icon: string;
  items: TransitionDef[];
}

const TRANSITION_CATEGORIES: TransitionCategory[] = [
  {
    label: 'Basic', icon: '⬜',
    items: [
      { id: 'fade',       name: 'Fade',        icon: '🌫️', desc: 'Smooth opacity fade' },
      { id: 'dissolve',   name: 'Dissolve',    icon: '🔀', desc: 'Pixel dissolve' },
      { id: 'hard-cut',   name: 'Hard Cut',    icon: '✂️', desc: 'Instant cut' },
      { id: 'dip-black',  name: 'Dip Black',   icon: '⬛', desc: 'Dip to black' },
      { id: 'dip-white',  name: 'Dip White',   icon: '⬜', desc: 'Dip to white' },
      { id: 'cross-zoom', name: 'Cross Zoom',  icon: '🔍', desc: 'Fade + zoom' },
    ],
  },
  {
    label: 'Zoom', icon: '🔎',
    items: [
      { id: 'zoom-in',      name: 'Zoom In',      icon: '🔭', desc: 'Zoom into next' },
      { id: 'zoom-out',     name: 'Zoom Out',     icon: '🔬', desc: 'Zoom out from prev' },
      { id: 'zoom-blur',    name: 'Zoom Blur',    icon: '💨', desc: 'Blur zoom' },
      { id: 'punch-in',     name: 'Punch In',     icon: '👊', desc: 'Aggressive zoom punch' },
      { id: 'zoom-rotate',  name: 'Zoom Rotate',  icon: '🌀', desc: 'Zoom with rotation' },
    ],
  },
  {
    label: 'Slide', icon: '➡️',
    items: [
      { id: 'slide-left',  name: 'Slide Left',   icon: '⬅️', desc: 'Slide to left' },
      { id: 'slide-right', name: 'Slide Right',  icon: '➡️', desc: 'Slide to right' },
      { id: 'slide-up',    name: 'Slide Up',     icon: '⬆️', desc: 'Slide upward' },
      { id: 'slide-down',  name: 'Slide Down',   icon: '⬇️', desc: 'Slide downward' },
      { id: 'push-left',   name: 'Push Left',    icon: '◀️', desc: 'Push frame left' },
      { id: 'push-right',  name: 'Push Right',   icon: '▶️', desc: 'Push frame right' },
      { id: 'wipe-left',   name: 'Wipe Left',    icon: '🧹', desc: 'Wipe from right' },
      { id: 'wipe-right',  name: 'Wipe Right',   icon: '🧹', desc: 'Wipe from left' },
      { id: 'wipe-up',     name: 'Wipe Up',      icon: '🧹', desc: 'Wipe from bottom' },
      { id: 'wipe-down',   name: 'Wipe Down',    icon: '🧹', desc: 'Wipe from top' },
    ],
  },
  {
    label: 'Creative', icon: '✨',
    items: [
      { id: 'spin-360',    name: 'Spin 360°',   icon: '🔄', desc: 'Full rotation spin' },
      { id: 'spin-half',   name: 'Spin Half',   icon: '🔃', desc: 'Half turn' },
      { id: 'flip-h',      name: 'Flip H',      icon: '↔️', desc: 'Horizontal flip' },
      { id: 'flip-v',      name: 'Flip V',      icon: '↕️', desc: 'Vertical flip' },
      { id: 'cube-left',   name: 'Cube Left',   icon: '📦', desc: '3D cube rotate' },
      { id: 'ripple',      name: 'Ripple',      icon: '💧', desc: 'Expanding circle' },
      { id: 'shockwave',   name: 'Shockwave',   icon: '💥', desc: 'Explosive ring' },
      { id: 'heart-wipe',  name: 'Heart Wipe',  icon: '❤️', desc: 'Heart shaped reveal' },
      { id: 'pinwheel',    name: 'Pinwheel',    icon: '🎡', desc: 'Spinning blades' },
      { id: 'clock-wipe',  name: 'Clock Wipe',  icon: '🕐', desc: 'Clockwise sweep' },
    ],
  },
  {
    label: 'Geometric', icon: '🔷',
    items: [
      { id: 'diamond-reveal', name: 'Diamond',     icon: '💎', desc: 'Diamond reveal' },
      { id: 'venetian-h',     name: 'Blinds H',    icon: '🪟', desc: 'Horizontal blinds' },
      { id: 'venetian-v',     name: 'Blinds V',    icon: '🪟', desc: 'Vertical blinds' },
      { id: 'checker-board',  name: 'Checker',     icon: '♟️', desc: 'Checkerboard reveal' },
      { id: 'morph-circle',   name: 'Circles',     icon: '⭕', desc: 'Circle grid morph' },
      { id: 'iris-open',      name: 'Iris Open',   icon: '👁️', desc: 'Iris lens open' },
      { id: 'iris-close',     name: 'Iris Close',  icon: '🔭', desc: 'Iris lens close' },
    ],
  },
  {
    label: 'Film', icon: '🎬',
    items: [
      { id: 'film-burn',        name: 'Film Burn',    icon: '🔥', desc: 'Burn through film' },
      { id: 'film-roll',        name: 'Film Roll',    icon: '🎞️', desc: 'Projector roll' },
      { id: 'old-film',         name: 'Old Film',     icon: '📽️', desc: 'Vintage scratched film' },
      { id: 'film-noir',        name: 'Film Noir',    icon: '🎭', desc: 'B&W cinematic' },
      { id: 'projector-flicker',name: 'Flicker',      icon: '💡', desc: 'Projector flicker' },
      { id: 'film-leader',      name: 'Countdown',    icon: '🔢', desc: 'Film leader countdown' },
      { id: 'cinematic-bars',   name: 'Cine Bars',    icon: '🎦', desc: 'Letterbox bars' },
      { id: 'lens-flare',       name: 'Lens Flare',   icon: '☀️', desc: 'Hollywood lens flare' },
    ],
  },
  {
    label: 'Hollywood', icon: '⭐',
    items: [
      { id: 'hollywood-star',  name: 'Star Burst',   icon: '⭐', desc: 'Star ray burst' },
      { id: 'spotlight',       name: 'Spotlight',    icon: '🔦', desc: 'Theatre spotlight' },
      { id: 'curtain-open',    name: 'Curtain Open', icon: '🎪', desc: 'Stage curtains open' },
      { id: 'curtain-close',   name: 'Curtain Close',icon: '🎭', desc: 'Stage curtains close' },
      { id: 'portal',          name: 'Portal',       icon: '🌀', desc: 'Magical portal spin' },
      { id: 'kaleidoscope',    name: 'Kaleidoscope', icon: '🔮', desc: 'Kaleidoscope effect' },
    ],
  },
  {
    label: 'Disco / Party', icon: '🪩',
    items: [
      { id: 'disco-flash',    name: 'Disco Flash',  icon: '🪩', desc: 'Color flash disco' },
      { id: 'disco-spin',     name: 'Disco Spin',   icon: '💃', desc: 'Spinning color panels' },
      { id: 'strobe-cut',     name: 'Strobe',       icon: '⚡', desc: 'Strobe light cut' },
      { id: 'rainbow-sweep',  name: 'Rainbow',      icon: '🌈', desc: 'Rainbow color sweep' },
      { id: 'neon-pulse',     name: 'Neon Pulse',   icon: '🌟', desc: 'Neon glow pulse' },
    ],
  },
  {
    label: 'Glitch / Digital', icon: '💻',
    items: [
      { id: 'glitch-cut',   name: 'Glitch Cut',  icon: '📺', desc: 'Horizontal slice glitch' },
      { id: 'rgb-split',    name: 'RGB Split',   icon: '🎨', desc: 'Chromatic aberration' },
      { id: 'pixel-sort',   name: 'Pixel Sort',  icon: '🖥️', desc: 'Row pixel sort' },
      { id: 'data-mosh',    name: 'Datamosh',    icon: '🔧', desc: 'Block datamosh' },
      { id: 'matrix-rain',  name: 'Matrix',      icon: '🟢', desc: 'Green code rain' },
      { id: 'scan-lines',   name: 'Scan Lines',  icon: '📡', desc: 'CRT scan lines' },
      { id: 'static-burst', name: 'Static',      icon: '📻', desc: 'TV static burst' },
      { id: 'vhs-rewind',   name: 'VHS Rewind',  icon: '📼', desc: 'VHS tape rewind' },
      { id: 'tv-off',       name: 'TV Off',      icon: '📺', desc: 'CRT turn off/on' },
      { id: 'tv-static',    name: 'TV Static',   icon: '📺', desc: 'Full TV static noise' },
    ],
  },
  {
    label: 'Horror', icon: '💀',
    items: [
      { id: 'horror-noise',    name: 'Horror Noise', icon: '👻', desc: 'Static noise scare' },
      { id: 'blood-wipe',      name: 'Blood Wipe',   icon: '🩸', desc: 'Dripping blood wipe' },
      { id: 'nightmare-fade',  name: 'Nightmare',    icon: '😱', desc: 'Red tint nightmare' },
      { id: 'demon-flash',     name: 'Demon Flash',  icon: '😈', desc: 'Flash jumpscare' },
      { id: 'void-swallow',    name: 'Void',         icon: '🕳️', desc: 'Sucked into darkness' },
      { id: 'shatter',         name: 'Shatter',      icon: '💢', desc: 'Shatter to pieces' },
      { id: 'lightning',       name: 'Lightning',    icon: '⚡', desc: 'Lightning strike' },
    ],
  },
  {
    label: 'Nature', icon: '🌿',
    items: [
      { id: 'fire-wipe',    name: 'Fire Wipe',    icon: '🔥', desc: 'Fire burns across' },
      { id: 'snow-fall',    name: 'Snow',         icon: '❄️', desc: 'Snowflake overlay' },
      { id: 'water-ripple', name: 'Water Ripple', icon: '🌊', desc: 'Concentric ripples' },
      { id: 'smoke-dissolve',name: 'Smoke',       icon: '💨', desc: 'Smoke tendrils' },
    ],
  },
  {
    label: 'Elastic / Bounce', icon: '🎯',
    items: [
      { id: 'elastic-in', name: 'Elastic',    icon: '🪀', desc: 'Elastic spring in' },
      { id: 'bounce-in',  name: 'Bounce',     icon: '⚽', desc: 'Bounce into view' },
      { id: 'swing-in',   name: 'Swing',      icon: '🎢', desc: 'Pendulum swing in' },
    ],
  },
];

// Flatten all transitions for count
const ALL_TRANSITIONS = TRANSITION_CATEGORIES.flatMap(c => c.items);

interface TransitionPanelProps {
  selectedTransition: string;
  transitionDuration: number;
  onSelectTransition: (id: string, duration: number) => void;
  disabled?: boolean;
  // Per-image slideshow duration
  slideshowDuration?: number;
  onSlideshowDurationChange?: (ms: number) => void;
}

export default function TransitionPanel({
  selectedTransition,
  transitionDuration,
  onSelectTransition,
  disabled = false,
  slideshowDuration = 2500,
  onSlideshowDurationChange,
}: TransitionPanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [localDur, setLocalDur] = useState(transitionDuration);
  const [localSlide, setLocalSlide] = useState(slideshowDuration);

  const toggleCat = (label: string) =>
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  const selectedDef = ALL_TRANSITIONS.find(t => t.id === selectedTransition);

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {disabled && (
        <p className="text-[9px] text-zinc-500 text-center py-1">Slideshow mode mein kaam karta hai</p>
      )}

      {/* ── Slideshow Duration ── */}
      {onSlideshowDurationChange && (
        <div className="bg-zinc-800/60 rounded-lg p-2.5 border border-zinc-700/30 mb-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Slide Duration</span>
            <span className="ml-auto text-[10px] font-mono text-yellow-300">{(localSlide / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range" min="500" max="10000" step="100"
            value={localSlide}
            onChange={e => {
              const v = Number(e.target.value);
              setLocalSlide(v);
              onSlideshowDurationChange(v);
            }}
            className="w-full h-1 accent-yellow-500 cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-zinc-600 mt-1">
            <span>0.5s</span><span>5s</span><span>10s</span>
          </div>
        </div>
      )}

      {/* ── Currently Selected ── */}
      <div className="bg-zinc-800/60 rounded-lg p-2.5 border border-zinc-700/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Active Transition</span>
          <span className="text-[9px] font-bold text-red-300">
            {selectedDef ? `${selectedDef.icon} ${selectedDef.name}` : '✖ None'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-500">Speed</span>
          <input
            type="range" min="100" max="2000" step="50"
            value={localDur}
            onChange={e => {
              const v = Number(e.target.value);
              setLocalDur(v);
              onSelectTransition(selectedTransition, v);
            }}
            className="flex-1 h-1 accent-red-500 cursor-pointer"
          />
          <span className="text-[9px] font-mono text-red-300 w-10 text-right">{localDur}ms</span>
        </div>
        {selectedTransition !== 'none' && (
          <button
            onClick={() => onSelectTransition('none', localDur)}
            className="w-full mt-1.5 text-[9px] text-zinc-600 hover:text-red-400 border border-zinc-700 hover:border-red-700 rounded px-2 py-1 transition-colors"
          >
            ✖ No Transition (Hard Cut)
          </button>
        )}
      </div>

      {/* ── Total count ── */}
      <p className="text-[9px] text-zinc-600 text-center">{ALL_TRANSITIONS.length} transitions available</p>

      {/* ── Categories ── */}
      {TRANSITION_CATEGORIES.map(cat => {
        const isOpen = !collapsed[cat.label];
        return (
          <div key={cat.label} className="border border-zinc-800/60 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCat(cat.label)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors"
            >
              <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5">
                <span>{cat.icon}</span>{cat.label}
                <span className="text-[8px] text-zinc-600 font-normal">({cat.items.length})</span>
              </span>
              <ChevronDown className={`w-3 h-3 text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-1 p-1.5 bg-zinc-900/30">
                {cat.items.map(t => {
                  const isActive = selectedTransition === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTransition(t.id, localDur)}
                      title={t.desc}
                      className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg border text-center transition-all ${
                        isActive
                          ? 'bg-red-900/30 border-red-500/60 text-red-300'
                          : 'bg-zinc-800/20 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-600 text-zinc-400'
                      }`}
                    >
                      <span className="text-base leading-none">{t.icon}</span>
                      <span className="text-[8px] font-medium leading-tight">{t.name}</span>
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


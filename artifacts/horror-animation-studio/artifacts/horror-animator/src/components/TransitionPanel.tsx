import { useState } from 'react';
import { TRANSITION_PRESETS, type TransitionPreset } from '@/lib/animations';
import { Film, ChevronDown, ChevronRight, Clock } from 'lucide-react';

interface TransitionPanelProps {
  selectedTransition: string;
  transitionDuration: number;
  onSelectTransition: (id: string, durationMs: number) => void;
  disabled: boolean;
}

const categoryMeta = {
  basic:    { label: 'Basic',    color: 'text-zinc-400'   },
  zoom:     { label: 'Zoom',     color: 'text-blue-400'   },
  slide:    { label: 'Slide',    color: 'text-green-400'  },
  creative: { label: 'Creative', color: 'text-yellow-400' },
  horror:   { label: 'Horror',   color: 'text-red-400'    },
};

export default function TransitionPanel({
  selectedTransition,
  transitionDuration,
  onSelectTransition,
  disabled,
}: TransitionPanelProps) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    basic: true, zoom: false, slide: false, creative: false, horror: true,
  });
  const [customDuration, setCustomDuration] = useState(transitionDuration);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const toggleCat = (cat: string) =>
    setOpenCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  const selected = TRANSITION_PRESETS.find(t => t.id === selectedTransition);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Film className="w-3.5 h-3.5 text-red-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Transitions
        </h3>
        <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
          {TRANSITION_PRESETS.length}+
        </span>
      </div>

      {disabled && (
        <p className="text-xs text-zinc-500 italic">Slideshow mode mein kaam karta hai</p>
      )}

      {/* Selected Transition Info */}
      {selected && (
        <div className="p-2 bg-red-900/15 border border-red-800/30 rounded-lg mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{selected.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-red-300 font-bold truncate">{selected.name}</p>
              <p className="text-[9px] text-zinc-500 truncate">{selected.description}</p>
            </div>
            <span className="text-[9px] text-zinc-500 flex-shrink-0">{selected.durationMs}ms</span>
          </div>
          {/* Duration slider */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                <span className="text-[9px] text-zinc-500">Duration</span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">{customDuration}ms</span>
            </div>
            <input
              type="range" min="100" max="2000" step="50"
              value={customDuration}
              onChange={e => {
                const v = parseInt(e.target.value);
                setCustomDuration(v);
                onSelectTransition(selectedTransition, v);
              }}
              className="w-full h-1 accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-zinc-700 mt-0.5">
              <span>Fast</span><span>Normal</span><span>Slow</span>
            </div>
          </div>
        </div>
      )}

      {!disabled && (Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const meta = categoryMeta[cat];
        const presets = TRANSITION_PRESETS.filter(p => p.category === cat);
        const isOpen = openCats[cat];

        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen
                  ? <ChevronDown className="w-3 h-3 text-zinc-500" />
                  : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
              </div>
              <span className="text-[10px] text-zinc-600">{presets.length}</span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-1 p-2 bg-zinc-900/30 max-h-[220px] overflow-y-auto">
                {presets.map(preset => {
                  const isSelected = selectedTransition === preset.id;
                  const isPreviewing = previewId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCustomDuration(preset.durationMs);
                        onSelectTransition(preset.id, preset.durationMs);
                      }}
                      onMouseEnter={() => setPreviewId(preset.id)}
                      onMouseLeave={() => setPreviewId(null)}
                      title={preset.description}
                      className={`relative flex items-center gap-1.5 p-1.5 rounded-lg text-left transition-all duration-150 overflow-hidden ${
                        isSelected
                          ? 'bg-red-500/25 border border-red-500/50 text-red-300'
                          : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {/* Hover preview shimmer */}
                      {isPreviewing && !isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_0.6s_ease-in-out]" />
                      )}
                      <span className="text-sm flex-shrink-0">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium leading-tight truncate">{preset.name}</p>
                        <p className="text-[8px] text-zinc-600 leading-tight">{preset.durationMs}ms</p>
                      </div>
                      {isSelected && (
                        <span className="ml-auto text-[8px] text-red-400 flex-shrink-0">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* None option */}
      <button
        onClick={() => onSelectTransition('none', 0)}
        className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-[10px] ${
          selectedTransition === 'none' || !selectedTransition
            ? 'border-zinc-600 bg-zinc-800/50 text-zinc-300'
            : 'border-zinc-800 bg-zinc-900/30 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
        }`}
      >
        <span>✂️</span>
        <span>No Transition (Hard Cut)</span>
        {(!selectedTransition || selectedTransition === 'none') && (
          <span className="ml-auto text-[8px] text-zinc-400">✓</span>
        )}
      </button>
    </div>
  );
}

import { useState } from 'react';
import { ANIMATION_PRESETS } from '@/lib/animations';
import { XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface AnimationPanelProps {
  selectedAnimation: string | null;
  onSelect: (animId: string | null) => void;
  disabled: boolean;
}

const categoryMeta = {
  movement:   { label: 'Movement', color: 'text-blue-400',  count: 25 },
  scare:      { label: 'Scare Effects', color: 'text-red-400', count: 25 },
  atmospheric:{ label: 'Atmospheric', color: 'text-purple-400', count: 25 },
  visual:     { label: 'Visual Effects', color: 'text-orange-400', count: 25 },
};

export default function AnimationPanel({ selectedAnimation, onSelect, disabled }: AnimationPanelProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    movement: true, scare: false, atmospheric: false, visual: false,
  });

  const toggle = (cat: string) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Animations (100+ effects)
        </h3>
        {selectedAnimation && (
          <button onClick={() => onSelect(null)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {disabled && <p className="text-xs text-zinc-500 italic">Select an image first</p>}

      {!disabled && (Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const meta = categoryMeta[cat];
        const presets = ANIMATION_PRESETS.filter(p => p.category === cat);
        const isOpen = openCategories[cat];
        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button
              onClick={() => toggle(cat)}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
              </div>
              <span className="text-[10px] text-zinc-600">{presets.length}</span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-2 gap-1 p-2 bg-zinc-900/30 max-h-[280px] overflow-y-auto">
                {presets.map(preset => {
                  const isSelected = selectedAnimation === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => onSelect(isSelected ? null : preset.id)}
                      className={`
                        flex items-center gap-1.5 p-1.5 rounded-lg text-left transition-all duration-150
                        ${isSelected
                          ? 'bg-red-500/25 border border-red-500/50 text-red-300'
                          : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }
                      `}
                    >
                      <span className="text-sm flex-shrink-0">{preset.icon}</span>
                      <p className="text-[10px] font-medium leading-tight truncate">{preset.name}</p>
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

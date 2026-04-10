import { useState } from 'react';
import { HORROR_SOUNDS } from '@/lib/animations';
import { audioEngine } from '@/lib/audio-engine';
import { Volume2, VolumeX, ChevronDown, ChevronRight, X } from 'lucide-react';

interface SoundLibraryProps {
  activeSounds: string[];
  onToggleSound: (soundId: string) => void;
  masterVolume: number;
  onVolumeChange: (vol: number) => void;
}

const categoryMeta = {
  ambient: { label: 'Ambient', icon: '🌫️' },
  effect:  { label: 'Sound Effects', icon: '💥' },
  music:   { label: 'Music', icon: '🎵' },
  voice:   { label: 'Voices & Screams', icon: '👄' },
};

export default function SoundLibrary({ activeSounds, onToggleSound, masterVolume, onVolumeChange }: SoundLibraryProps) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ ambient: true, effect: false, music: false, voice: false });

  const toggle = (cat: string) => setOpenCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  const handleToggle = (soundId: string) => {
    if (activeSounds.includes(soundId)) {
      audioEngine.stopSound(soundId);
    } else {
      audioEngine.playSound(soundId);
    }
    onToggleSound(soundId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Horror Sound Library
        </h3>
        {activeSounds.length > 0 && (
          <button
            onClick={() => { audioEngine.stopAll(); activeSounds.forEach(id => onToggleSound(id)); }}
            className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Stop All
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-2 py-1.5">
        {masterVolume > 0 ? <Volume2 className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
        <input type="range" min="0" max="1" step="0.05" value={masterVolume}
          onChange={(e) => { const v = parseFloat(e.target.value); onVolumeChange(v); audioEngine.setMasterVolume(v); }}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <span className="text-[10px] text-zinc-500 w-7 text-right">{Math.round(masterVolume * 100)}%</span>
      </div>

      {activeSounds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeSounds.map(id => {
            const s = HORROR_SOUNDS.find(s => s.id === id);
            return (
              <div key={id} className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 rounded px-1.5 py-0.5">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => <div key={i} className="w-0.5 h-2 bg-red-500 rounded-full animate-pulse" style={{animationDelay:`${i*0.1}s`}} />)}
                </div>
                <span className="text-[9px] text-red-300">{s?.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const sounds = HORROR_SOUNDS.filter(s => s.category === cat);
        const meta = categoryMeta[cat];
        const isOpen = openCats[cat];
        const activeCount = sounds.filter(s => activeSounds.includes(s.id)).length;
        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button
              onClick={() => toggle(cat)}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                <span className="text-sm">{meta.icon}</span>
                <span className="text-xs font-medium text-zinc-300">{meta.label}</span>
                {activeCount > 0 && <span className="text-[10px] bg-red-500/30 text-red-400 px-1 rounded">{activeCount} playing</span>}
              </div>
              <span className="text-[10px] text-zinc-600">{sounds.length}</span>
            </button>

            {isOpen && (
              <div className="space-y-0.5 p-1.5 bg-zinc-900/30 max-h-[260px] overflow-y-auto">
                {sounds.map(sound => {
                  const isActive = activeSounds.includes(sound.id);
                  return (
                    <button
                      key={sound.id}
                      onClick={() => handleToggle(sound.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all duration-150 ${isActive ? 'bg-red-500/15 border border-red-500/30 text-red-300' : 'bg-zinc-800/20 border border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'}`}
                    >
                      <div className="text-left min-w-0">
                        <p className="text-xs font-medium">{sound.name}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{sound.description}</p>
                      </div>
                      {isActive && (
                        <div className="flex gap-0.5 ml-2 flex-shrink-0">
                          {[0,1,2,3].map(i => <div key={i} className="w-0.5 rounded-full bg-red-500 animate-pulse" style={{height:`${6+i*2}px`,animationDelay:`${i*0.08}s`}} />)}
                        </div>
                      )}
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

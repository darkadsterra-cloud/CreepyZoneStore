import { Globe } from 'lucide-react';

export interface EnvironmentTheme {
  id: string;
  name: string;
  icon: string;
  background: string;
  overlay?: string;
  filter?: string;
}

export const ENVIRONMENT_THEMES: EnvironmentTheme[] = [
  { id: 'midnight-forest', name: 'Midnight Forest', icon: '🌲', background: 'radial-gradient(ellipse at top, #0a1a0a 0%, #000000 100%)', overlay: 'linear-gradient(180deg, rgba(0,20,0,0.8) 0%, rgba(0,0,0,0.95) 100%)' },
  { id: 'blood-moon', name: 'Blood Moon', icon: '🌕', background: 'radial-gradient(ellipse at 70% 20%, #3d0000 0%, #1a0000 40%, #000000 100%)', overlay: 'radial-gradient(ellipse at 70% 20%, rgba(180,0,0,0.3) 0%, transparent 60%)' },
  { id: 'haunted-mansion', name: 'Haunted Mansion', icon: '🏚️', background: 'linear-gradient(180deg, #0d0d1a 0%, #1a0a0a 50%, #0a0a0a 100%)', overlay: 'radial-gradient(ellipse at center bottom, rgba(40,0,0,0.6) 0%, transparent 70%)' },
  { id: 'hellfire', name: 'Hellfire Pit', icon: '🔥', background: 'radial-gradient(ellipse at bottom, #3d1000 0%, #1a0500 50%, #000000 100%)', overlay: 'linear-gradient(0deg, rgba(255,60,0,0.25) 0%, transparent 60%)' },
  { id: 'graveyard', name: 'Graveyard Mist', icon: '⚰️', background: 'linear-gradient(180deg, #0a0a14 0%, #14141e 50%, #0a0a0f 100%)', overlay: 'radial-gradient(ellipse at bottom, rgba(100,100,150,0.2) 0%, transparent 70%)', filter: 'saturate(0.5) brightness(0.8)' },
  { id: 'void', name: 'The Void', icon: '🌑', background: '#000000', overlay: 'radial-gradient(ellipse at center, rgba(20,0,40,0.8) 0%, #000000 100%)' },
  { id: 'catacombs', name: 'Catacombs', icon: '💀', background: 'linear-gradient(180deg, #0f0a00 0%, #1a1000 100%)', overlay: 'radial-gradient(ellipse at center, rgba(60,40,0,0.3) 0%, transparent 70%)', filter: 'sepia(0.3)' },
  { id: 'deep-abyss', name: 'The Abyss', icon: '🌊', background: 'radial-gradient(ellipse at top, #000a1a 0%, #00050f 100%)', overlay: 'linear-gradient(180deg, rgba(0,20,60,0.4) 0%, rgba(0,0,20,0.8) 100%)' },
  { id: 'asylum', name: 'Asylum', icon: '🏥', background: 'linear-gradient(180deg, #0f0f0f 0%, #141414 100%)', filter: 'saturate(0) contrast(1.2)' },
  { id: 'ritual-circle', name: 'Ritual Circle', icon: '🔮', background: 'radial-gradient(circle at center, #1a0020 0%, #0a0010 50%, #000000 100%)', overlay: 'radial-gradient(circle at center, rgba(150,0,255,0.15) 0%, transparent 60%)' },
  { id: 'thunderstorm-sky', name: 'Thunderstorm', icon: '⛈️', background: 'linear-gradient(180deg, #0a0a14 0%, #14141e 40%, #1e1e28 100%)', overlay: 'linear-gradient(180deg, rgba(100,100,200,0.1) 0%, transparent 50%)' },
  { id: 'crimson-church', name: 'Crimson Church', icon: '⛪', background: 'linear-gradient(180deg, #1a0000 0%, #0f0000 60%, #050000 100%)', overlay: 'radial-gradient(ellipse at top, rgba(200,0,0,0.2) 0%, transparent 60%)' },
];

interface EnvironmentPanelProps {
  activeEnvironment: string | null;
  onSelect: (id: string | null) => void;
}

export default function EnvironmentPanel({ activeEnvironment, onSelect }: EnvironmentPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-zinc-400" />
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Environment
        </h3>
        {activeEnvironment && (
          <button
            onClick={() => onSelect(null)}
            className="ml-auto text-[9px] text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1">
        {ENVIRONMENT_THEMES.map(theme => {
          const isActive = activeEnvironment === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelect(isActive ? null : theme.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left border transition-all ${
                isActive
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-zinc-800/30 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span style={{ fontSize: '14px' }}>{theme.icon}</span>
              <p className="text-[9px] font-medium leading-tight truncate">{theme.name}</p>
              {isActive && <span className="ml-auto text-[8px] text-purple-400">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

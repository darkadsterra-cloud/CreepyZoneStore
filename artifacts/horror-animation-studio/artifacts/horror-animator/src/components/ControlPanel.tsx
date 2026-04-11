import { ASPECT_RATIOS, PARTICLE_EFFECTS } from '@/lib/animations';
import type { UploadedImage, AnimationMode } from '@/lib/animations';
import { Monitor, Move, RotateCcw, ZoomIn, Sun, Layers, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  selectedImage: UploadedImage | null;
  aspectRatio: string;
  greenScreenEnabled: boolean;
  animationMode: AnimationMode;
  activeParticles: string[];
  onAspectRatioChange: (ratio: string) => void;
  onGreenScreenToggle: (enabled: boolean) => void;
  onAnimationModeChange: (mode: AnimationMode) => void;
  onParticleToggle: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
}

const MODE_OPTIONS: { id: AnimationMode; label: string; desc: string }[] = [
  { id: 'single',        label: 'Single',      desc: 'Show selected image'  },
  { id: 'slideshow',    label: 'Slideshow',   desc: 'Cycle through images'  },
  { id: 'all-visible',  label: 'All Visible', desc: 'All images at once'    },
  { id: 'random-appear',label: 'Random',      desc: 'Random appearances'    },
];

export default function ControlPanel({
  selectedImage,
  aspectRatio,
  greenScreenEnabled,
  animationMode,
  activeParticles,
  onAspectRatioChange,
  onGreenScreenToggle,
  onAnimationModeChange,
  onParticleToggle,
  onUpdateImage,
}: ControlPanelProps) {
  const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className="space-y-4">

      {/* Resolution */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resolution & Platform</h3>
        </div>
        <select value={aspectRatio} onChange={e => onAspectRatioChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {ASPECT_RATIOS.map(r => (
            <option key={r.id} value={r.id}>[{r.tag}] {r.label}</option>
          ))}
        </select>
        <div className="text-[10px] text-zinc-600 text-center">{ratio.width}×{ratio.height} px</div>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Background</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => onGreenScreenToggle(false)}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${!greenScreenEnabled ? 'bg-zinc-700 text-zinc-200 border border-zinc-600' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}
          >
            🖤 Dark
          </button>
          <button onClick={() => onGreenScreenToggle(true)}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${greenScreenEnabled ? 'bg-green-700/30 text-green-300 border border-green-500/40' : 'bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:bg-zinc-800'}`}
          >
            🟢 Green Screen
          </button>
        </div>
      </div>

      {/* Animation Mode */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Animation Mode</h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MODE_OPTIONS.map(m => (
            <button key={m.id} onClick={() => onAnimationModeChange(m.id)}
              className={`p-2 rounded-lg text-left transition-all ${animationMode === m.id ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
            >
              <p className="text-[10px] font-semibold">{m.label}</p>
              <p className="text-[9px] text-zinc-600">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Particle Overlay */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Particle Overlay</h3>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PARTICLE_EFFECTS.map(p => (
            <button key={p.id} onClick={() => onParticleToggle(p.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all ${
                activeParticles.includes(p.id)
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                  : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <span className="text-xs">{p.icon}</span>
              <span className="text-[10px] font-medium truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Image Transform */}
      {selectedImage && (
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Image Transform</h3>

          {/* Position X */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Move className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">Position X</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono">{selectedImage.position.x}%</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={selectedImage.position.x}
              onChange={e => onUpdateImage(selectedImage.id, { position: { ...selectedImage.position, x: parseFloat(e.target.value) } })}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Position Y */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Move className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">Position Y</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono">{selectedImage.position.y}%</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={selectedImage.position.y}
              onChange={e => onUpdateImage(selectedImage.id, { position: { ...selectedImage.position, y: parseFloat(e.target.value) } })}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ZoomIn className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">Scale</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono">{(selectedImage.scale * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={5} step={0.05} value={selectedImage.scale}
              onChange={e => onUpdateImage(selectedImage.id, { scale: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            {/* Quick scale buttons */}
            <div className="flex gap-1 mt-1">
              {[0.25, 0.5, 1, 1.5, 2].map(s => (
                <button key={s} onClick={() => onUpdateImage(selectedImage.id, { scale: s })}
                  className={`flex-1 text-[8px] py-0.5 rounded border transition-all ${
                    Math.abs(selectedImage.scale - s) < 0.01
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {s * 100}%
                </button>
              ))}
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">Rotation</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono">{selectedImage.rotation}°</span>
            </div>
            <input type="range" min={-180} max={180} step={1} value={selectedImage.rotation}
              onChange={e => onUpdateImage(selectedImage.id, { rotation: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex gap-1 mt-1">
              {[-180, -90, 0, 90, 180].map(r => (
                <button key={r} onClick={() => onUpdateImage(selectedImage.id, { rotation: r })}
                  className={`flex-1 text-[8px] py-0.5 rounded border transition-all ${
                    selectedImage.rotation === r
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {r}°
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase">Opacity</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono">{(selectedImage.opacity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={selectedImage.opacity}
              onChange={e => onUpdateImage(selectedImage.id, { opacity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={() => onUpdateImage(selectedImage.id, {
              position: { x: 50, y: 50 },
              scale: 1,
              rotation: 0,
              opacity: 1,
            })}
            className="w-full py-1.5 text-[10px] bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-lg transition-all uppercase tracking-wider"
          >
            ↺ Reset Transform
          </button>
        </div>
      )}
    </div>
  );
}

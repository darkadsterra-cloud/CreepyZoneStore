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
  { id: 'single', label: 'Single', desc: 'Show selected image' },
  { id: 'slideshow', label: 'Slideshow', desc: 'Cycle through images' },
  { id: 'all-visible', label: 'All Visible', desc: 'All images at once' },
  { id: 'random-appear', label: 'Random', desc: 'Random appearances' },
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resolution & Platform</h3>
        </div>
        <select value={aspectRatio} onChange={(e) => onAspectRatioChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {ASPECT_RATIOS.map(r => (
            <option key={r.id} value={r.id}>[{r.tag}] {r.label}</option>
          ))}
        </select>
        <div className="text-[10px] text-zinc-600 text-center">{ratio.width}×{ratio.height} px</div>
      </div>

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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Particle Overlay</h3>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PARTICLE_EFFECTS.map(p => (
            <button key={p.id} onClick={() => onParticleToggle(p.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all ${activeParticles.includes(p.id) ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}
            >
              <span className="text-xs">{p.icon}</span>
              <span className="text-[10px] font-medium truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Image Transform</h3>
          {[
            { label: 'Position X', icon: <Move className="w-3 h-3 text-zinc-500"/>, min:0, max:100, step:1, val:selectedImage.position.x, onChange:(v:number)=>onUpdateImage(selectedImage.id,{position:{...selectedImage.position,x:v}}) },
            { label: 'Position Y', icon: <Move className="w-3 h-3 text-zinc-500"/>, min:0, max:100, step:1, val:selectedImage.position.y, onChange:(v:number)=>onUpdateImage(selectedImage.id,{position:{...selectedImage.position,y:v}}) },
            { label: `Scale (${(selectedImage.scale*100).toFixed(0)}%)`, icon: <ZoomIn className="w-3 h-3 text-zinc-500"/>, min:0.1, max:3, step:0.05, val:selectedImage.scale, onChange:(v:number)=>onUpdateImage(selectedImage.id,{scale:v}) },
            { label: `Rotation (${selectedImage.rotation}°)`, icon: <RotateCcw className="w-3 h-3 text-zinc-500"/>, min:-180, max:180, step:1, val:selectedImage.rotation, onChange:(v:number)=>onUpdateImage(selectedImage.id,{rotation:v}) },
            { label: `Opacity (${(selectedImage.opacity*100).toFixed(0)}%)`, icon: <Sun className="w-3 h-3 text-zinc-500"/>, min:0, max:1, step:0.05, val:selectedImage.opacity, onChange:(v:number)=>onUpdateImage(selectedImage.id,{opacity:v}) },
          ].map(ctrl => (
            <div key={ctrl.label} className="space-y-1">
              <div className="flex items-center gap-1.5">
                {ctrl.icon}
                <span className="text-[10px] text-zinc-500 uppercase">{ctrl.label}</span>
              </div>
              <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.val}
                onChange={(e)=>ctrl.onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

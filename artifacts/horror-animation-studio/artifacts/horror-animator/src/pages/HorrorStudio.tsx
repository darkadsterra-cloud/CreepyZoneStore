import { useState, useRef, useCallback, useEffect } from 'react';
import { ANIMATION_PRESETS, ASPECT_RATIOS } from '@/lib/animations';
import type { UploadedImage, AnimationMode } from '@/lib/animations';
import { loadProjects, saveProject, deleteProject, generateId, urlToBase64 } from '@/lib/project-store';
import type { HorrorProject } from '@/lib/project-store';
import AppBackground from '@/components/AppBackground';
import AnimationPanel from '@/components/AnimationPanel';
import SoundLibrary from '@/components/SoundLibrary';
import ControlPanel from '@/components/ControlPanel';
import ParticleOverlay from '@/components/ParticleOverlay';
import TTSPanel from '@/components/TTSPanel';
import { ANIMATION_PRESETS, ASPECT_RATIOS, TRANSITION_PRESETS } from '@/lib/animations';
import type { UploadedImage, AnimationMode, TransitionPreset } from '@/lib/animations';
import TransitionPanel from '@/components/TransitionPanel';
import { drawTransition, tickTransition, makeTransitionState } from '@/lib/transition-engine';
import type { TransitionState } from '@/lib/transition-engine';
import {
  Upload, ImageIcon, Download, CircleDot,
  ChevronLeft, ChevronRight, Maximize2, Skull, X,
  FolderOpen, Plus, Save, CheckCircle, Clock, Trash2, User,
  Film, Video, Play, Pause, Volume2, VolumeX,
  ChevronDown, Maximize, Minimize, Mic, MicOff, Settings2,
  Monitor, Speaker, Eye, Edit3,
} from 'lucide-react';

let imageCounter = 0;

interface ProjectVideo {
  id: string;
  name: string;
  blob: Blob;
  size: number;
  duration: number;
  createdAt: number;
  thumbnail: string;
}

interface RecordingSettings {
  audioSource: 'microphone' | 'desktop' | 'none';
  quality: 'high' | 'medium' | 'low';
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDur(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

const videoStore: Record<string, ProjectVideo[]> = {};
function getProjectVideos(pid: string): ProjectVideo[] { return videoStore[pid] ?? []; }
function addProjectVideo(pid: string, v: ProjectVideo) {
  if (!videoStore[pid]) videoStore[pid] = [];
  videoStore[pid].unshift(v);
}
function removeProjectVideo(pid: string, vid: string) {
  if (!videoStore[pid]) return;
  videoStore[pid] = videoStore[pid].filter(v => v.id !== vid);
}

// Global image store — persists across project switches in same session
const imageBlobStore: Record<string, string> = {};
const imageElementCache: Record<string, HTMLImageElement> = {};

function preloadImage(id: string, url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    if (!url) { resolve(new Image()); return; }
    const cached = imageElementCache[id];
    if (cached && cached.complete && cached.naturalWidth > 0) {
      resolve(cached); return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageElementCache[id] = img; resolve(img); };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => { imageElementCache[id] = img2; resolve(img2); };
      img2.onerror = () => resolve(img);
      img2.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    };
    img.src = url;
  });
}

function getAnimValues(animId: string, t: number, W: number, H: number) {
  let offX = 0, offY = 0, sc = 1, rot = 0, alpha = 1;
  const id = animId.toLowerCase().replace(/[^a-z0-9]/g, '-');

  if (id.includes('float') || id.includes('ghostly')) {
    offY = Math.sin(t * 1.6) * H * 0.025;
    offX = Math.sin(t * 0.8) * W * 0.008;
  } else if (id.includes('shake') || id.includes('earthquake')) {
    const intensity = id.includes('earthquake') ? 0.025 : 0.012;
    offX = (Math.random() - 0.5) * W * intensity;
    offY = (Math.random() - 0.5) * H * intensity * 0.8;
  } else if (id.includes('swing') || id.includes('pendulum')) {
    rot = Math.sin(t * 2.2) * 0.18;
  } else if (id.includes('sway') || id.includes('corpse')) {
    rot = Math.sin(t * 1.0) * 0.12;
    offY = Math.abs(Math.sin(t * 1.0)) * H * 0.01;
  } else if (id.includes('creep') || id.includes('crawl')) {
    offX = ((t * 0.05) % 1.2 - 0.1) * W;
  } else if (id.includes('spiral') || id.includes('death-spiral')) {
    rot = t * 1.2;
    sc = 1 + Math.sin(t * 1.2) * 0.1;
  } else if (id.includes('bounce')) {
    offY = -Math.abs(Math.sin(t * 3.5)) * H * 0.08;
  } else if (id.includes('teleport')) {
    alpha = Math.floor(t * 3) % 2 === 0 ? 1 : 0;
    if (alpha === 1) { offX = (Math.random() - 0.5) * W * 0.1; offY = (Math.random() - 0.5) * H * 0.1; }
  } else if (id.includes('orbit')) {
    offX = Math.cos(t * 1.0) * W * 0.06;
    offY = Math.sin(t * 1.0) * H * 0.06;
  } else if (id.includes('levitate')) {
    offY = Math.sin(t * 1.5) * H * 0.02;
    rot = t * 0.4;
  } else if (id.includes('zigzag') || id.includes('possessed')) {
    offX = Math.sin(t * 4) * W * 0.04;
    offY = Math.sin(t * 8) * H * 0.02;
  } else if (id.includes('jerk')) {
    offX = Math.random() < 0.3 ? (Math.random() - 0.5) * W * 0.03 : 0;
    offY = Math.random() < 0.3 ? (Math.random() - 0.5) * H * 0.03 : 0;
  } else if (id.includes('drift-left')) {
    offX = -(((t * 0.08) % 1.2) * W);
  } else if (id.includes('drift-right')) {
    offX = (((t * 0.08) % 1.2) * W);
  } else if (id.includes('drift')) {
    offX = Math.sin(t * 0.5) * W * 0.05;
  } else if (id.includes('marionette')) {
    offY = Math.abs(Math.sin(t * 2.5)) * H * 0.05;
    rot = Math.sin(t * 2.5) * 0.08;
  } else if (id.includes('tidal')) {
    offX = Math.sin(t * 1.2) * W * 0.08;
    sc = 1 + Math.sin(t * 1.2) * 0.05;
  } else if (id.includes('chaotic')) {
    offX = (Math.random() - 0.5) * W * 0.04;
    offY = (Math.random() - 0.5) * H * 0.04;
    rot = (Math.random() - 0.5) * 0.2;
  } else if (id.includes('warp')) {
    offX = Math.sin(t * 0.9) * W * 0.03;
    offY = Math.cos(t * 1.1) * H * 0.03;
    sc = 1 + Math.sin(t * 1.3) * 0.04;
  } else if (id.includes('sidewind')) {
    offX = Math.sin(t * 2) * W * 0.05;
    offY = Math.cos(t * 4) * H * 0.015;
  } else if (id.includes('pulse-move')) {
    sc = 1 + Math.sin(t * 2) * 0.05;
    offX = Math.sin(t * 0.7) * W * 0.015;
  } else if (id.includes('rise-fall') || id.includes('rise-and-fall')) {
    offY = Math.sin(t * 1.3) * H * 0.04;
  } else if (id.includes('slide-down') || id.includes('descend')) {
    offY = Math.sin(t * 0.7) * H * 0.06;
  } else if (id.includes('slide-up') || id.includes('rise-from')) {
    offY = -Math.sin(t * 0.7) * H * 0.06;
  } else if (id.includes('jumpscare') || id.includes('jump-scare')) {
    const c = t % 3.0;
    if (c > 2.7) { sc = 1 + (c - 2.7) / 0.3 * 1.5; alpha = Math.min(1, (3.0 - c) * 10); }
  } else if (id.includes('flash') || id.includes('blink')) {
    alpha = Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  } else if (id.includes('strobe')) {
    alpha = Math.floor(t * 10) % 2 === 0 ? 1 : 0;
  } else if (id.includes('loom')) {
    const c = (t * 0.5) % 1;
    sc = c < 0.15 ? 1 + c / 0.15 * 0.6 : c < 0.25 ? 1.6 - (c - 0.15) / 0.1 * 0.6 : 1;
  } else if (id.includes('evil-zoom')) {
    sc = 1 + (t * 0.03) % 0.5;
  } else if (id.includes('rapid-approach')) {
    const c = (t * 0.5) % 1;
    sc = 0.3 + c * 1.2;
    alpha = c < 0.9 ? 1 : 1 - (c - 0.9) / 0.1;
  } else if (id.includes('crash-in')) {
    const c = (t * 0.5) % 1;
    offX = c < 0.2 ? (0.2 - c) / 0.2 * -W * 0.6 : 0;
    sc = c < 0.2 ? 0.5 + c / 0.2 * 0.5 : 1;
  } else if (id.includes('slam-down')) {
    const c = (t * 0.5) % 1;
    offY = c < 0.2 ? (0.2 - c) / 0.2 * -H * 0.5 : 0;
  } else if (id.includes('nuclear')) {
    const c = (t * 0.7) % 1;
    sc = 1 + Math.sin(c * Math.PI) * 0.4;
    alpha = 1 - c * 0.3;
  } else if (id.includes('horror-snap')) {
    offX = Math.random() < 0.2 ? (Math.random() - 0.5) * W * 0.06 : 0;
    offY = Math.random() < 0.2 ? (Math.random() - 0.5) * H * 0.06 : 0;
    rot = Math.random() < 0.1 ? (Math.random() - 0.5) * 0.4 : 0;
  } else if (id.includes('rage')) {
    const c = (t * 1.0) % 1;
    sc = 1 + Math.sin(c * Math.PI) * 0.3;
  } else if (id.includes('terror-vibrate') || id.includes('vibrate')) {
    offX = (Math.random() - 0.5) * W * 0.008;
    offY = (Math.random() - 0.5) * H * 0.008;
  } else if (id.includes('appear') || id.includes('ghost-appear')) {
    const c = (t * 0.4) % 1;
    alpha = c < 0.5 ? c * 2 : 1 - (c - 0.5) * 2;
  } else if (id.includes('grab') || id.includes('reach')) {
    offX = Math.sin(t * 1.5) * W * 0.03;
    sc = 1 + Math.sin(t * 1.5) * 0.05;
  } else if (id.includes('shatter')) {
    const c = (t * 0.5) % 1;
    if (c > 0.8) { offX = (Math.random() - 0.5) * W * 0.04; offY = (Math.random() - 0.5) * H * 0.04; }
  } else if (id.includes('death-drop')) {
    const c = (t * 0.4) % 1;
    offY = c * H * 0.15;
    alpha = 1 - c * 0.8;
  } else if (id.includes('possession')) {
    offX = (Math.random() - 0.5) * W * 0.03;
    offY = (Math.random() - 0.5) * H * 0.03;
    sc = 1 + (Math.random() - 0.5) * 0.1;
  } else if (id.includes('dive-bomb')) {
    const c = (t * 0.5) % 1;
    offY = c < 0.3 ? -H * 0.3 + c / 0.3 * H * 0.3 : 0;
    sc = c < 0.3 ? 0.5 + c / 0.3 * 0.5 : 1;
  } else if (id.includes('haunting')) {
    alpha = 0.3 + Math.sin(t * 0.7) * 0.7;
    offY = Math.sin(t * 0.5) * H * 0.015;
  } else if (id.includes('pulse') || id.includes('glow')) {
    sc = 1 + Math.sin(t * Math.PI * 1.5) * 0.06;
  } else if (id.includes('flicker')) {
    alpha = 0.6 + Math.sin(t * 7) * 0.4 + (Math.random() > 0.9 ? -0.4 : 0);
  } else if (id.includes('breathe') || id.includes('shadow-breathe')) {
    sc = 1 + Math.sin(t * 0.8) * 0.07;
    alpha = 0.8 + Math.sin(t * 0.8) * 0.2;
  } else if (id.includes('spectral') || id.includes('nightmare')) {
    alpha = 0.4 + Math.abs(Math.sin(t * 0.5)) * 0.6;
  } else if (id.includes('ritual')) {
    sc = 1 + Math.sin(t * 2) * 0.04;
    rot = Math.sin(t * 1.5) * 0.05;
  } else if (id.includes('spirit')) {
    alpha = Math.abs(Math.sin(t * 0.4));
    offY = Math.sin(t * 0.8) * H * 0.02;
  } else if (id.includes('aura')) {
    sc = 1 + Math.sin(t * 1.5) * 0.08;
  } else if (id.includes('limbo')) {
    offY = Math.sin(t * 0.6) * H * 0.03;
    alpha = 0.7 + Math.sin(t * 0.4) * 0.3;
  } else if (id.includes('void')) {
    sc = 1 + Math.sin(t * 0.8) * 0.12;
    rot = t * 0.2;
  } else if (id.includes('soul')) {
    offY = Math.sin(t * 0.5) * H * 0.02;
    alpha = 0.5 + Math.sin(t * 0.7) * 0.5;
  } else if (id.includes('ghost-drift')) {
    offX = Math.sin(t * 0.4) * W * 0.06;
    alpha = 0.6 + Math.sin(t * 0.5) * 0.4;
  } else if (id.includes('grave')) {
    offY = -Math.abs(Math.sin(t * 0.4)) * H * 0.06;
  } else if (id.includes('purgatory')) {
    sc = 1 + Math.sin(t * 1.2) * 0.05;
    alpha = 0.7 + Math.sin(t * 0.9) * 0.3;
  } else if (id.includes('eternal')) {
    alpha = Math.max(0.1, 1 - (t * 0.02) % 1);
  } else if (id.includes('halo')) {
    rot = t * 0.5;
    offY = Math.sin(t * 1.0) * H * 0.01;
  } else if (id.includes('glitch')) {
    if (Math.random() < 0.15) offX += (Math.random() - 0.5) * W * 0.03;
    if (Math.random() < 0.05) alpha = 0;
  } else if (id.includes('static')) {
    offX = (Math.random() - 0.5) * W * 0.015;
    offY = (Math.random() - 0.5) * H * 0.005;
    alpha = 0.7 + Math.random() * 0.3;
  } else if (id.includes('corrupt')) {
    if (Math.random() < 0.2) offX = (Math.random() - 0.5) * W * 0.02;
  } else if (id.includes('chromatic')) {
    offX = Math.sin(t * 3) * W * 0.005;
  } else if (id.includes('blood-moon')) {
    alpha = 0.85 + Math.sin(t * 0.5) * 0.15;
  } else if (id.includes('hell-warp')) {
    offX = Math.sin(t * 2) * W * 0.015;
    offY = Math.cos(t * 1.7) * H * 0.01;
    sc = 1 + Math.sin(t * 1.2) * 0.04;
  } else if (id.includes('grain') || id.includes('film')) {
    offX = (Math.random() - 0.5) * 2;
    offY = (Math.random() - 0.5) * 2;
  } else if (id.includes('celestial')) {
    offY = Math.sin(t * 0.5) * H * 0.03;
    sc = 1 + Math.sin(t * 0.7) * 0.06;
  } else if (id.includes('mirror')) {
    rot = Math.floor(t * 0.33) % 2 === 0 ? 0 : Math.PI;
  } else if (id.includes('shadow-clone')) {
    offX = Math.sin(t * 1.5) * W * 0.02;
  } else if (id.includes('blackout')) {
    const c = (t * 0.3) % 1;
    alpha = c < 0.4 ? 0 : Math.min(1, (c - 0.4) / 0.2);
  } else if (id.includes('underworld')) {
    sc = 1 + Math.sin(t * 1.0) * 0.06;
    alpha = 0.8 + Math.sin(t * 0.8) * 0.2;
  } else if (id.includes('moonlit')) {
    offY = Math.sin(t * 0.6) * H * 0.02;
    rot = Math.sin(t * 0.4) * 0.05;
  } else if (id.includes('astral')) {
    alpha = 0.6 + Math.sin(t * 0.9) * 0.4;
    sc = 1 + Math.sin(t * 0.7) * 0.04;
  } else if (id.includes('sigil')) {
    rot = Math.sin(t * 2) * 0.1;
    sc = 1 + Math.sin(t * 1.5) * 0.05;
  } else if (id.includes('fog-roll') || id.includes('fog')) {
    offX = Math.sin(t * 0.3) * W * 0.04;
    alpha = 0.6 + Math.sin(t * 0.5) * 0.4;
  } else if (id.includes('death-breath')) {
    sc = 1 + Math.sin(t * 0.6) * 0.04;
    alpha = 0.7 + Math.sin(t * 0.8) * 0.3;
  } else if (id.includes('infernal')) {
    sc = 1 + Math.sin(t * 2.5) * 0.07;
    alpha = 0.85 + Math.sin(t * 2) * 0.15;
  } else if (id.includes('laser')) {
    sc = 1 + Math.sin(t * 4) * 0.03;
  } else if (id.includes('demon-vision') || id.includes('demon')) {
    sc = 1 + Math.sin(t * 1.8) * 0.04;
    alpha = 0.9 + Math.sin(t * 2) * 0.1;
  } else if (id.includes('blood-splat') || id.includes('splat')) {
    const c = (t * 0.5) % 1;
    sc = 1 + Math.sin(c * Math.PI) * 0.15;
    alpha = c < 0.8 ? 1 : 1 - (c - 0.8) / 0.2;
  }

  return {
    offX, offY,
    extraScale: Math.max(0.01, sc),
    extraRot: rot,
    alpha: Math.max(0, Math.min(1, alpha)),
  };
}

// ─── Recording Settings Modal ────────────────────────────────────────────────
function RecordingSettingsModal({ settings, onSave, onStart, onCancel }: {
  settings: RecordingSettings;
  onSave: (s: RecordingSettings) => void;
  onStart: (s: RecordingSettings) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState<RecordingSettings>({ ...settings });

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-red-400" />
          <h3 className="text-white font-bold text-sm">Recording Settings</h3>
        </div>
        <div className="mb-4">
          <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Audio Source</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'microphone' as const, label: 'Microphone', sub: 'Browser permission required', icon: <Mic className="w-4 h-4" /> },
              { val: 'desktop' as const, label: 'Desktop Audio', sub: 'Captures tab/system sound', icon: <Speaker className="w-4 h-4" /> },
              { val: 'none' as const, label: 'No Audio', sub: 'Video only, no sound', icon: <MicOff className="w-4 h-4" /> },
            ].map(opt => (
              <button key={opt.val} onClick={() => setLocal(p => ({ ...p, audioSource: opt.val }))}
                className={`flex flex-col items-start gap-1 p-3 rounded-lg border transition-all text-left ${local.audioSource === opt.val ? 'border-red-500 bg-red-900/20 text-white' : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'}`}>
                <div className="flex items-center gap-1.5">{opt.icon}<span className="text-xs font-bold">{opt.label}</span></div>
                <span className="text-[9px] text-zinc-500">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-2">Video Quality</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'high' as const, label: 'High', sub: '12 Mbps' },
              { val: 'medium' as const, label: 'Medium', sub: '6 Mbps' },
              { val: 'low' as const, label: 'Low', sub: '3 Mbps' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setLocal(p => ({ ...p, quality: opt.val }))}
                className={`flex flex-col items-center gap-0.5 p-2.5 rounded-lg border transition-all ${local.quality === opt.val ? 'border-red-500 bg-red-900/20 text-white' : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'}`}>
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[9px] text-zinc-500">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 mb-4">
          <Monitor className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <p className="text-[9px] text-zinc-400 leading-relaxed">
            {local.audioSource === 'desktop'
              ? 'A browser popup will appear — select a tab or window and check the "Share audio" checkbox.'
              : local.audioSource === 'microphone'
              ? 'All animations, particles and visuals will be recorded. Click Allow when the permission popup appears.'
              : 'Video only will be recorded with no audio track.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { onSave(local); onStart(local); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded border border-red-500 transition-all">
            <CircleDot className="w-4 h-4" /> Start Recording
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded border border-zinc-700 transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({ video, onClose }: { video: ProjectVideo; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [url] = useState(() => URL.createObjectURL(video.blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
      if (e.key === 'ArrowLeft') videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      if (e.key === 'ArrowUp') { videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1); setVolume(videoRef.current.volume); }
      if (e.key === 'ArrowDown') { videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1); setVolume(videoRef.current.volume); }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape') { if (isFullscreen) toggleFullscreen(); else onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playing, isFullscreen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) { await containerRef.current.requestFullscreen(); setIsFullscreen(true); }
    else { await document.exitFullscreen(); setIsFullscreen(false); }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * videoRef.current.duration;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/96 flex items-center justify-center p-4" onClick={onClose}>
      <div ref={containerRef} onClick={e => e.stopPropagation()} onMouseMove={resetHideTimer}
        className="bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-700 relative w-full" style={{ maxWidth: '860px' }}>
        <div className={`flex items-center justify-between px-4 py-3 border-b border-zinc-800 transition-opacity ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`} style={{ background: '#09090b' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-white text-sm font-bold truncate">{video.name}</span>
            <span className="text-zinc-500 text-xs flex-shrink-0">{formatDur(duration)} · {formatSize(video.size)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => {
              const a = document.createElement('a'); a.href = url; a.download = video.name;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded border border-red-500">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="relative bg-black" style={{ lineHeight: 0 }}>
          <video ref={videoRef} src={url} onClick={togglePlay}
            onEnded={() => setPlaying(false)}
            onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
            onTimeUpdate={() => {
              if (!videoRef.current) return;
              const d = videoRef.current.duration || 1;
              setCurrentTime(videoRef.current.currentTime);
              setProgress((videoRef.current.currentTime / d) * 100);
            }}
            style={{ width: '100%', maxHeight: isFullscreen ? '100vh' : '58vh', display: 'block', cursor: 'pointer', background: '#000' }}
          />
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-red-700/80 rounded-full flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          )}
          <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${!showControls && playing && isFullscreen ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.9),transparent)', padding: '12px 12px 8px' }}>
            <div className="relative w-full h-2 bg-zinc-700 rounded-full mb-2 cursor-pointer group" onClick={seek}>
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-400 rounded-full shadow opacity-0 group-hover:opacity-100 -ml-1.5" style={{ left: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="w-8 h-8 bg-red-700 hover:bg-red-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <span className="text-white text-xs font-mono">{formatDur(currentTime)} / {formatDur(duration)}</span>
              <div className="flex-1" />
              <button onClick={() => { if (videoRef.current) { const m = !muted; videoRef.current.muted = m; setMuted(m); } }} className="text-zinc-400 hover:text-white p-1">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; } setMuted(v === 0); }}
                className="w-20 h-1 accent-red-500 cursor-pointer" />
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }} className="text-zinc-400 hover:text-white text-[10px] px-1.5 py-1 rounded border border-zinc-700 hover:border-zinc-500">-10s</button>
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); }} className="text-zinc-400 hover:text-white text-[10px] px-1.5 py-1 rounded border border-zinc-700 hover:border-zinc-500">+10s</button>
              <button onClick={toggleFullscreen} className="text-zinc-400 hover:text-white p-1">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-3 text-[8px] text-zinc-600">
          <span>Space: Play/Pause</span><span>←→: ±5s</span><span>↑↓: Volume</span><span>F: Fullscreen</span><span>Esc: Close</span>
        </div>
      </div>
    </div>
  );
}

// ─── Project Folder Popup (header dropdown) ───────────────────────────────────
function ProjectFolderPopup({ currentProject, projects, onOpen, onNew, onClose, onGoLibrary }: {
  currentProject: HorrorProject | null;
  projects: HorrorProject[];
  onOpen: (p: HorrorProject) => void;
  onNew: () => void;
  onClose: () => void;
  onGoLibrary: () => void;
}) {
  const [playingVideo, setPlayingVideo] = useState<ProjectVideo | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(currentProject?.id ?? null);

  return (
    <>
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
      <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Project Library</p>
          <button onClick={onGoLibrary} className="text-[9px] text-red-400 hover:text-red-300">Full Library →</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {projects.length === 0 && <p className="text-zinc-600 text-xs px-3 py-4 text-center">No projects yet</p>}
          {projects.map(p => {
            const videos = getProjectVideos(p.id);
            const isExpanded = expandedId === p.id;
            const isCurrent = currentProject?.id === p.id;
            return (
              <div key={p.id} className={`border-b border-zinc-800/50 ${isCurrent ? 'bg-red-900/10' : ''}`}>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50">
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-800 cursor-pointer" onClick={() => { onOpen(p); onClose(); }}>
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Skull className="w-5 h-5 text-zinc-600" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onOpen(p); onClose(); }}>
                    <p className="text-white text-xs font-bold truncate hover:text-red-300">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[8px] px-1 py-0.5 rounded ${p.status === 'finished' ? 'text-green-400 bg-green-900/20' : 'text-yellow-500 bg-yellow-900/20'}`}>
                        {p.status === 'finished' ? '✓ Done' : '● Draft'}
                      </span>
                      <span className="text-[8px] text-zinc-600">{p.images.length} imgs</span>
                      {videos.length > 0 && <span className="text-[8px] text-purple-400">{videos.length} vid{videos.length > 1 ? 's' : ''}</span>}
                      {isCurrent && <span className="text-[8px] text-red-400 font-bold">● Active</span>}
                    </div>
                  </div>
                  {videos.length > 0 && (
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-1 text-zinc-600 hover:text-zinc-300 flex-shrink-0">
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {isExpanded && videos.length > 0 && (
                  <div className="px-3 pb-2 space-y-1.5">
                    {videos.map(v => (
                      <div key={v.id} className="bg-zinc-800/60 rounded-lg border border-zinc-700/30 overflow-hidden">
                        <div className="w-full h-14 bg-zinc-900 relative cursor-pointer" onClick={() => setPlayingVideo(v)}>
                          {v.thumbnail && <img src={v.thumbnail} alt="" className="w-full h-full object-cover opacity-60" />}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-red-700/90 rounded-full flex items-center justify-center hover:bg-red-600"><Play className="w-4 h-4 text-white ml-0.5" /></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-zinc-400 truncate">{v.name}</p>
                            <p className="text-[8px] text-zinc-600">{formatDur(v.duration)} · {formatSize(v.size)}</p>
                          </div>
                          <button onClick={() => setPlayingVideo(v)} className="flex items-center gap-1 px-1.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[8px] rounded flex-shrink-0"><Play className="w-2 h-2" /> Play</button>
                          <button onClick={() => {
                            const url = URL.createObjectURL(v.blob);
                            const a = document.createElement('a'); a.href = url; a.download = v.name;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                          }} className="flex items-center gap-1 px-1.5 py-1 bg-red-700 hover:bg-red-600 text-white text-[8px] rounded font-bold flex-shrink-0"><Download className="w-2 h-2" /> DL</button>
                          <button onClick={() => removeProjectVideo(p.id, v.id)} className="p-1 text-zinc-600 hover:text-red-500 flex-shrink-0"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-zinc-800 p-2">
          <button onClick={() => { onNew(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 bg-red-700/30 hover:bg-red-700/50 text-red-300 text-xs font-bold rounded justify-center">
            <Plus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Project Dashboard (Full Library View) ────────────────────────────────────
function ProjectDashboard({ username, onNew, onOpen, onDelete }: {
  username: string;
  onNew: (name: string) => void;
  onOpen: (p: HorrorProject) => void;
  onDelete: (id: string) => void;
}) {
  const [projects, setProjects] = useState<HorrorProject[]>([]);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<ProjectVideo | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<HorrorProject | null>(null);

  useEffect(() => { setProjects(loadProjects()); }, []);
  const refresh = () => setProjects(loadProjects());
  const handleNew = () => { onNew(newName.trim() || `Project ${Date.now()}`); };

  // Mini preview of project images in dashboard
  const ProjectImageStrip = ({ proj }: { proj: HorrorProject }) => {
    const imgs = proj.images.slice(0, 4);
    if (imgs.length === 0) return (
      <div className="w-full h-28 bg-zinc-800/50 flex items-center justify-center mb-3 border border-zinc-700/30 rounded">
        <Skull className="w-10 h-10 text-zinc-700" />
      </div>
    );
    if (imgs.length === 1) return (
      <div className="w-full h-28 overflow-hidden mb-3 bg-zinc-800 rounded">
        <img src={imgs[0].url || ''} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    );
    return (
      <div className="w-full h-28 overflow-hidden mb-3 bg-zinc-800 rounded grid grid-cols-2 gap-0.5">
        {imgs.slice(0, 4).map((img, i) => (
          <div key={img.id} className={`overflow-hidden bg-zinc-900 ${imgs.length === 3 && i === 2 ? 'col-span-2' : ''}`}>
            <img src={img.url || ''} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-y-auto">
      <AppBackground />
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}

      {/* Project Detail Preview Modal */}
      {previewProject && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewProject(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-bold text-sm">{previewProject.name}</h3>
                <p className="text-[10px] text-zinc-500">{previewProject.images.length} images · {previewProject.aspectRatio} · {previewProject.animMode}</p>
              </div>
              <button onClick={() => setPreviewProject(null)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4">
              {/* Settings Summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-zinc-800/60 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-0.5">Ratio</p>
                  <p className="text-xs text-white font-bold">{previewProject.aspectRatio}</p>
                </div>
                <div className="bg-zinc-800/60 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-0.5">Anim Mode</p>
                  <p className="text-xs text-white font-bold capitalize">{previewProject.animMode}</p>
                </div>
                <div className="bg-zinc-800/60 rounded-lg p-2 text-center">
                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-0.5">Green Scrn</p>
                  <p className="text-xs text-white font-bold">{previewProject.greenScreen ? 'On' : 'Off'}</p>
                </div>
              </div>
              {/* Images Grid */}
              {previewProject.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Images ({previewProject.images.length})</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {previewProject.images.map(img => (
                      <div key={img.id} className="aspect-square rounded overflow-hidden bg-zinc-800 border border-zinc-700/30 relative group">
                        {img.url ? (
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-700" /></div>
                        )}
                        {(img.animations?.length ?? 0) > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                            <p className="text-[7px] text-red-400 truncate">{img.animations?.length} anim</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Sounds & Particles */}
              {(previewProject.activeSounds.length > 0 || previewProject.activeParticles.length > 0) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {previewProject.activeSounds.length > 0 && (
                    <div className="bg-zinc-800/40 rounded-lg p-2">
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1">Sounds</p>
                      <p className="text-xs text-white">{previewProject.activeSounds.length} active</p>
                    </div>
                  )}
                  {previewProject.activeParticles.length > 0 && (
                    <div className="bg-zinc-800/40 rounded-lg p-2">
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest mb-1">Particles</p>
                      <p className="text-xs text-white">{previewProject.activeParticles.length} active</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button onClick={() => { onOpen(previewProject); setPreviewProject(null); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded border border-red-500">
                <Edit3 className="w-4 h-4" /> Open & Edit
              </button>
              <button onClick={() => setPreviewProject(null)} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded border border-zinc-700">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-red-900/30 bg-zinc-900/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/60">
              <Skull className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white" style={{ fontFamily: 'Georgia, serif' }}>Horror Animation Studio</h1>
              <p className="text-[9px] text-zinc-500 tracking-widest uppercase">Project Library</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-semibold text-xs">{username}</span>
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              {!showInput ? (
                <button onClick={() => setShowInput(true)} className="flex items-center gap-2 px-5 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> New Project
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNew(); if (e.key === 'Escape') setShowInput(false); }}
                    placeholder="Project name..."
                    className="px-4 py-2.5 bg-zinc-800 border border-red-700/50 text-white text-sm outline-none focus:border-red-500 flex-1" />
                  <div className="flex gap-2">
                    <button onClick={handleNew} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold border border-red-500">Create</button>
                    <button onClick={() => setShowInput(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm border border-zinc-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen className="w-14 h-14 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 text-sm">No projects yet. Create your first horror project!</p>
              </div>
            ) : (
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Your Projects ({projects.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(p => {
                    const videos = getProjectVideos(p.id);
                    return (
                      <div key={p.id} className="border border-zinc-800 bg-zinc-900/50 hover:border-red-700/50 transition-all group relative">
                        {/* Thumbnail / image strip — clickable to open project */}
                        <div onClick={() => onOpen(p)} className="cursor-pointer p-4">
                          <ProjectImageStrip proj={p} />
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-red-300">{p.name}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {p.status === 'finished'
                                  ? <span className="flex items-center gap-1 text-[9px] text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded"><CheckCircle className="w-2.5 h-2.5" /> Finished</span>
                                  : <span className="flex items-center gap-1 text-[9px] text-yellow-500 border border-yellow-800/40 px-1.5 py-0.5 rounded"><Clock className="w-2.5 h-2.5" /> Draft</span>}
                                <span className="text-[9px] text-zinc-600">{new Date(p.updatedAt).toLocaleDateString()}</span>
                                <span className="text-[9px] text-zinc-600">{p.images.length} img{p.images.length !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={e => { e.stopPropagation(); setPreviewProject(p); }}
                                className="text-zinc-500 hover:text-blue-400 p-1" title="Preview details">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteProject(p.id); refresh(); onDelete(p.id); }}
                                className="text-zinc-700 hover:text-red-500 p-1" title="Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Settings quick-info bar */}
                        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[8px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">{p.aspectRatio}</span>
                          <span className="text-[8px] text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded capitalize">{p.animMode}</span>
                          {p.greenScreen && <span className="text-[8px] text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">Green Screen</span>}
                          {p.activeSounds.length > 0 && <span className="text-[8px] text-zinc-500">{p.activeSounds.length} sound{p.activeSounds.length !== 1 ? 's' : ''}</span>}
                          {p.activeParticles.length > 0 && <span className="text-[8px] text-zinc-500">{p.activeParticles.length} fx</span>}
                        </div>

                        {/* Videos section */}
                        {videos.length > 0 && (
                          <div className="border-t border-zinc-800 px-4 py-2">
                            <button onClick={e => { e.stopPropagation(); setExpandedId(expandedId === p.id ? null : p.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-red-400 w-full py-1">
                              <Film className="w-3 h-3" /><span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                              <span className="ml-auto text-[8px]">{expandedId === p.id ? '▲' : '▼'}</span>
                            </button>
                            {expandedId === p.id && (
                              <div className="mt-2 space-y-2 pb-2">
                                {videos.map(v => (
                                  <div key={v.id} className="bg-zinc-800/60 rounded-lg border border-zinc-700/30 overflow-hidden">
                                    <div className="w-full h-20 bg-zinc-900 relative cursor-pointer" onClick={e => { e.stopPropagation(); setPlayingVideo(v); }}>
                                      {v.thumbnail && <img src={v.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-red-700/90 rounded-full flex items-center justify-center hover:bg-red-600"><Play className="w-5 h-5 text-white ml-0.5" /></div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2">
                                      <div className="flex-1 min-w-0"><p className="text-[10px] text-zinc-300 truncate">{v.name}</p><p className="text-[9px] text-zinc-600">{formatDur(v.duration)} · {formatSize(v.size)}</p></div>
                                      <button onClick={e => { e.stopPropagation(); setPlayingVideo(v); }} className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[9px] rounded flex-shrink-0"><Play className="w-2.5 h-2.5" /> Play</button>
                                      <button onClick={e => {
                                        e.stopPropagation();
                                        const url = URL.createObjectURL(v.blob);
                                        const a = document.createElement('a'); a.href = url; a.download = v.name;
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                                      }} className="flex items-center gap-1 px-2 py-1 bg-red-700 hover:bg-red-600 text-white text-[9px] rounded flex-shrink-0 font-bold"><Download className="w-2.5 h-2.5" /> DL</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN STUDIO COMPONENT
// ═══════════════════════════════════════════════════
export default function HorrorStudio() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentProject, setCurrentProject] = useState<HorrorProject | null>(null);
  const [allProjects, setAllProjects] = useState<HorrorProject[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showRecordingSettings, setShowRecordingSettings] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings>({ audioSource: 'microphone', quality: 'high' });
  const username = 'Creator';

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9-1080');
  const [greenScreen, setGreenScreen] = useState(false);
  const [animMode, setAnimMode] = useState<AnimationMode>('single');
  const [activeParticles, setActiveParticles] = useState<string[]>([]);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [masterVolume, setMasterVolume] = useState(0.35);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [randomVisible, setRandomVisible] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'animations' | 'sounds' | 'tts' | 'transitions'>('animations');
  const [dragover, setDragover] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<ProjectVideo | null>(null);
  const [, forceUpdate] = useState(0);
  const [activeTransition, setActiveTransition] = useState('none');
  const [transitionDuration, setTransitionDuration] = useState(600);
  const transitionStateRef = useRef<TransitionState>(makeTransitionState());
  const fromCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const toCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSlideshowIdxRef = useRef(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideshowIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const randomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const rafHandleRef = useRef<number>(0);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animStartTimesRef = useRef<Record<string, number>>({});

  // ── Refs that always hold latest state (avoid stale closures) ──
  const imagesRef = useRef<UploadedImage[]>([]);
  const slideshowIdxRef = useRef(0);
  const randomVisibleRef = useRef<string[]>([]);
  const animModeRef = useRef<AnimationMode>('single');
  const selectedIdRef = useRef<string | null>(null);
  const greenScreenRef = useRef(false);
  const currentProjectRef = useRef<HorrorProject | null>(null);

  // Keep refs in sync
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { slideshowIdxRef.current = slideshowIdx; }, [slideshowIdx]);
  useEffect(() => { randomVisibleRef.current = randomVisible; }, [randomVisible]);
  useEffect(() => { animModeRef.current = animMode; }, [animMode]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { greenScreenRef.current = greenScreen; }, [greenScreen]);
  useEffect(() => { currentProjectRef.current = currentProject; }, [currentProject]);

  const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];
  const selectedImage = images.find(img => img.id === selectedId) || null;

  useEffect(() => { setAllProjects(loadProjects()); }, [showDashboard]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node))
        setShowProjectDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ════════════════════════════════════════════════════
  // AUTO-SAVE — uses refs to always get fresh state
  // ════════════════════════════════════════════════════
  const doAutoSave = useCallback(async (status?: 'draft' | 'finished') => {
    const proj = currentProjectRef.current;
    if (!proj) return;

    const currentImages = imagesRef.current;
    let thumbnail = proj.thumbnail;

    // Convert every image url to base64 for persistence
    const savedImages = await Promise.all(currentImages.map(async (img) => {
      // If already base64, use it directly
      let base64Url: string | null = img.url?.startsWith('data:') ? img.url : null;

      // Try from blob store first
      if (!base64Url) {
        const blobUrl = imageBlobStore[img.id];
        if (blobUrl) {
          if (blobUrl.startsWith('data:')) {
            base64Url = blobUrl;
          } else {
            try {
              base64Url = await urlToBase64(blobUrl);
              // Cache the base64 back into blob store so next save is instant
              imageBlobStore[img.id] = base64Url;
            } catch {
              base64Url = blobUrl;
            }
          }
        }
      }

      // Fallback to img.url
      if (!base64Url && img.url) {
        try {
          if (!img.url.startsWith('data:')) {
            base64Url = await urlToBase64(img.url);
          } else {
            base64Url = img.url;
          }
        } catch {
          base64Url = img.url;
        }
      }

      return {
        id: img.id,
        url: base64Url || img.url || '',
        name: img.name,
        animation: img.animation,
        animations: img.animations ?? [],
        position: img.position,
        scale: img.scale,
        rotation: img.rotation,
        opacity: img.opacity,
      };
    }));

    // Use first image as thumbnail if available
    if (savedImages.length > 0 && savedImages[0].url?.startsWith('data:')) {
      thumbnail = savedImages[0].url;
    }

    const updated: HorrorProject = {
      ...proj,
      updatedAt: Date.now(),
      status: status ?? proj.status,
      aspectRatio,
      greenScreen,
      animMode,
      activeParticles,
      activeSounds,
      masterVolume,
      thumbnail,
      images: savedImages,
    };

    saveProject(updated);
    setCurrentProject(updated);
    currentProjectRef.current = updated;
    setAllProjects(loadProjects());
    setAutoSaveMsg('Saved ✓');
    setTimeout(() => setAutoSaveMsg(''), 2000);
  }, [aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume]);

  // Trigger auto-save whenever any meaningful state changes
  useEffect(() => {
    if (!currentProjectRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => doAutoSave(), 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [images, aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume]);

 useEffect(() => {
    if (slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current);
    if (animMode === 'slideshow' && images.length > 1) {
      slideshowIntervalRef.current = setInterval(() => {
        setSlideshowIdx(i => {
          const nextIdx = (i + 1) % images.length;
          // Trigger transition if one is selected
          if (activeTransition !== 'none' && transitionDuration > 0) {
            prevSlideshowIdxRef.current = i;
            transitionStateRef.current = {
              active: true,
              id: activeTransition,
              progress: 0,
              durationMs: transitionDuration,
              startTime: performance.now(),
              fromImageId: images[i]?.id ?? null,
              toImageId: images[nextIdx]?.id ?? null,
            };
          }
          return nextIdx;
        });
      }, 2500 + transitionDuration);
    }
    return () => { if (slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current); };
  }, [animMode, images.length, activeTransition, transitionDuration]);

  useEffect(() => {
    if (randomIntervalRef.current) clearInterval(randomIntervalRef.current);
    if (animMode === 'random-appear' && images.length > 0) {
      randomIntervalRef.current = setInterval(() => {
        const img = images[Math.floor(Math.random() * images.length)];
        setRandomVisible(v => v.includes(img.id) ? v.filter(x => x !== img.id) : [...v, img.id]);
      }, 800);
    }
    return () => { if (randomIntervalRef.current) clearInterval(randomIntervalRef.current); };
  }, [animMode, images]);

  const getPreviewImages = useCallback((): UploadedImage[] => {
    if (images.length === 0) return [];
    switch (animMode) {
      case 'single': return selectedImage ? [selectedImage] : images.slice(0, 1);
      case 'slideshow': return [images[slideshowIdx % images.length]];
      case 'all-visible': return images;
      case 'random-appear': return images.filter(img => randomVisible.includes(img.id));
    }
  }, [images, animMode, selectedImage, slideshowIdx, randomVisible]);

  const previewImages = getPreviewImages();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const id = `img-${++imageCounter}`;
      imageBlobStore[id] = url;
      preloadImage(id, url);
      newImages.push({
        id, file, url, name: file.name,
        animation: null, animations: [], greenScreen: false,
        position: { x: 50, y: 50 }, scale: 1, rotation: 0, opacity: 1,
      });
    });
    setImages(prev => {
      const next = [...prev, ...newImages];
      if (!selectedId && next.length > 0) setSelectedId(next[0].id);
      return next;
    });
    if (newImages.length > 0 && !selectedId) setSelectedId(newImages[0].id);
  }, [selectedId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const updateImage = (id: string, updates: Partial<UploadedImage>) =>
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));

  const removeImage = (id: string) => {
    delete imageBlobStore[id]; delete imageElementCache[id];
    setImages(prev => {
      const next = prev.filter(img => img.id !== id);
      if (selectedId === id) setSelectedId(next.length > 0 ? next[0].id : null);
      return next;
    });
  };

const toggleAnimation = useCallback((animId: string) => {
    if (!selectedId) return;
    // Use functional update to always get fresh state — avoids stale closure bug
    setImages(prev => prev.map(img => {
      if (img.id !== selectedId) return img;
      const current: string[] = img.animations?.length
        ? img.animations
        : img.animation ? [img.animation] : [];
      const next = current.includes(animId)
        ? current.filter(a => a !== animId)
        : [...current, animId];
      return { ...img, animations: next, animation: next[0] ?? null };
    }));
  }, [selectedId]);

  const clearAllAnimations = () => { if (selectedId) updateImage(selectedId, { animations: [], animation: null }); };
  const toggleSound = (id: string) => setActiveSounds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleParticle = (id: string) => setActiveParticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDownload = () => {
    if (!previewRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(previewRef.current!, { useCORS: true, allowTaint: true, scale: 3, logging: false }).then(canvas => {
      const link = document.createElement('a');
        link.download = `${currentProject?.name ?? 'horror-overlay'}.png`;
        link.href = canvas.toDataURL('image/png'); link.click();
      });
    });
  };

  // ════════════════════════════════════════════════════
  // RECORDING
  // ════════════════════════════════════════════════════
  const startRecording = useCallback(async (settings: RecordingSettings) => {
    const outWidth = ratio.width;
    const outHeight = ratio.height;

    const currentImages = imagesRef.current;
    currentImages.forEach(img => { delete imageElementCache[img.id]; });
    await Promise.all(currentImages.map(img => preloadImage(img.id, imageBlobStore[img.id] || img.url)));

    const sessionStart = performance.now();
    animStartTimesRef.current = {};
    currentImages.forEach(img => { animStartTimesRef.current[img.id] = sessionStart; });

    const recCanvas = document.createElement('canvas');
    recCanvas.width = outWidth; recCanvas.height = outHeight;
    const ctx = recCanvas.getContext('2d', { alpha: false })!;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    let audioStream: MediaStream | null = null;
    if (settings.audioSource === 'microphone') {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000, channelCount: 2 },
          video: false,
        });
        audioStreamRef.current = audioStream;
      } catch (err) {
        console.warn('Mic permission denied:', err);
        audioStream = null; audioStreamRef.current = null;
      }
    } else if (settings.audioSource === 'desktop') {
      try {
        const ds = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        ds.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
        const ats: MediaStreamTrack[] = ds.getAudioTracks();
        audioStream = ats.length > 0 ? new MediaStream(ats) : null;
        audioStreamRef.current = audioStream;
      } catch (err) {
        console.warn('Desktop audio failed:', err);
        audioStream = null; audioStreamRef.current = null;
      }
    }

    const videoStream = recCanvas.captureStream(60);
    const allTracks = [...videoStream.getVideoTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])];
    const combinedStream = new MediaStream(allTracks);
    const bitrates: Record<string, number> = { high: 25_000_000, medium: 12_000_000, low: 6_000_000 };
    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';
    let recorder: MediaRecorder;
    try { recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: bitrates[settings.quality] }); }
    catch { recorder = new MediaRecorder(combinedStream); }

    chunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      cancelAnimationFrame(rafHandleRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(t => t.stop()); audioStreamRef.current = null; }

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const durationSec = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);

      if (blob.size < 1000) {
        alert('Recording failed — no data. Please try again.'); setRecording(false); setRecordingTime(0); return;
      }

      if (currentProjectRef.current) {
        setSavingVideo(true);
        const videoName = `${currentProjectRef.current.name}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
        let thumbnail = '';
        try {
          const tempUrl = URL.createObjectURL(blob);
          const vid = document.createElement('video');
          vid.src = tempUrl; vid.muted = true; vid.preload = 'metadata';
          await new Promise<void>(res => { vid.onloadeddata = () => res(); vid.onerror = () => res(); vid.load(); });
          vid.currentTime = Math.min(1.5, durationSec * 0.1);
          await new Promise<void>(res => { vid.onseeked = () => res(); setTimeout(res, 1500); });
          const tc = document.createElement('canvas');
          tc.width = 320; tc.height = Math.round(320 * outHeight / outWidth);
          tc.getContext('2d')!.drawImage(vid, 0, 0, tc.width, tc.height);
          thumbnail = tc.toDataURL('image/jpeg', 0.75);
          URL.revokeObjectURL(tempUrl);
        } catch {}
        addProjectVideo(currentProjectRef.current.id, {
          id: generateId(), name: videoName, blob,
          size: blob.size, duration: durationSec, createdAt: Date.now(), thumbnail,
        });
        setAutoSaveMsg(`✓ Video saved! ${outWidth}×${outHeight} · ${formatSize(blob.size)}`);
        setTimeout(() => setAutoSaveMsg(''), 8000);
        setSavingVideo(false);
        forceUpdate(n => n + 1);
      }
      setRecording(false); setRecordingTime(0);
    };

    const drawLoop = () => {
      const now = performance.now();
      const imgs = imagesRef.current;
      const mode = animModeRef.current;
      const selId = selectedIdRef.current;
      const ssIdx = slideshowIdxRef.current;
      const randVis = randomVisibleRef.current;
      const gs = greenScreenRef.current;

      // ── Background ──
      ctx.fillStyle = gs ? '#00ff00' : '#090909';
      ctx.fillRect(0, 0, outWidth, outHeight);
 
      // ── Tick transition ──
      const nowMs = performance.now();
      transitionStateRef.current = tickTransition(transitionStateRef.current, nowMs);
      const tState = transitionStateRef.current;
 
      // If transition is active, render from/to canvases with transition effect
      if (tState.active && tState.id !== 'none') {
        // Draw normally first to fromCanvas/toCanvas if we have them
        if (fromCanvasRef.current && toCanvasRef.current) {
          drawTransition(ctx, fromCanvasRef.current, toCanvasRef.current, tState.id, tState.progress, outWidth, outHeight);
          rafHandleRef.current = requestAnimationFrame(drawLoop);
          return; // Skip normal draw — transition handles it
        }
      }

      if (!gs) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.022)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= outWidth; x += outWidth / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, outHeight); ctx.stroke(); }
        for (let y = 0; y <= outHeight; y += outHeight / 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(outWidth, y); ctx.stroke(); }
        ctx.restore();
      }

      let drawList: UploadedImage[] = [];
      if (imgs.length > 0) {
        switch (mode) {
          case 'single': drawList = selId ? imgs.filter(i => i.id === selId) : imgs.slice(0, 1); break;
          case 'slideshow': drawList = [imgs[ssIdx % imgs.length]]; break;
          case 'all-visible': drawList = imgs; break;
          case 'random-appear': drawList = imgs.filter(i => randVis.includes(i.id)); break;
        }
      }

      for (const img of drawList) {
        const el = imageElementCache[img.id];
        if (!el || !el.complete || el.naturalWidth === 0) continue;
        if (!animStartTimesRef.current[img.id]) animStartTimesRef.current[img.id] = now;

        const t = (now - animStartTimesRef.current[img.id]) / 1000;
        const liveImg = imagesRef.current.find(i => i.id === img.id) ?? img;
        const anims = liveImg.animations ?? (liveImg.animation ? [liveImg.animation] : []);

        let totalOffX = 0, totalOffY = 0, totalScale = 1, totalRot = 0, totalAlpha = 1;
        for (const animId of anims) {
          const v = getAnimValues(animId, t, outWidth, outHeight);
          totalOffX += v.offX; totalOffY += v.offY;
          totalScale *= v.extraScale; totalRot += v.extraRot; totalAlpha *= v.alpha;
        }

        const naturalW = el.naturalWidth; const naturalH = el.naturalHeight;
        const maxW = outWidth * 0.48; const maxH = outHeight * 0.48;
        const baseScale = Math.min(maxW / naturalW, maxH / naturalH);
        const drawScale = baseScale * (liveImg.scale ?? 1) * totalScale;
        const dw = naturalW * drawScale; const dh = naturalH * drawScale;
        const cx = (liveImg.position.x / 100) * outWidth + totalOffX;
        const cy = (liveImg.position.y / 100) * outHeight + totalOffY;
        const userRotRad = ((liveImg.rotation ?? 0) * Math.PI) / 180;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (liveImg.opacity ?? 1) * totalAlpha));
        ctx.translate(cx, cy);
        ctx.rotate(userRotRad + totalRot);
        ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      if (!gs) {
        const grad = ctx.createRadialGradient(outWidth / 2, outHeight / 2, Math.min(outWidth, outHeight) * 0.25, outWidth / 2, outHeight / 2, Math.max(outWidth, outHeight) * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, outWidth, outHeight);
      }
      rafHandleRef.current = requestAnimationFrame(drawLoop);
    };

    drawLoop();
    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setRecording(true); setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    autoStopTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 5 * 60 * 1000);
  }, [ratio]);

  const handleRecord = useCallback(() => {
    if (recording) {
      cancelAnimationFrame(rafHandleRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      else { setRecording(false); setRecordingTime(0); }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      return;
    }
    setShowRecordingSettings(true);
  }, [recording]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isVertical = ratio.height > ratio.width;
  const getAnimClass = (img: UploadedImage) => {
    const anims = img.animations ?? (img.animation ? [img.animation] : []);
    return anims.map(a => `ha-${a}`).join(' ');
  };
  const selectedIdx = images.findIndex(img => img.id === selectedId);
  const goLeft = () => selectedIdx > 0 && setSelectedId(images[selectedIdx - 1].id);
  const goRight = () => selectedIdx < images.length - 1 && setSelectedId(images[selectedIdx + 1].id);

  // ─── Create new project ───────────────────────────────────────────────────
  const handleNewProject = (name: string) => {
    const proj: HorrorProject = {
      id: generateId(), name, status: 'draft',
      createdAt: Date.now(), updatedAt: Date.now(),
      aspectRatio: '16:9-1080', greenScreen: false, animMode: 'single',
      activeParticles: [], activeSounds: [], masterVolume: 0.35, images: [],
    };
    saveProject(proj);
    setCurrentProject(proj);
    currentProjectRef.current = proj;
    setImages([]); setSelectedId(null);
    setAspectRatio('16:9-1080'); setGreenScreen(false);
    setAnimMode('single'); setActiveParticles([]); setActiveSounds([]); setMasterVolume(0.35);
    setAllProjects(loadProjects());
    setShowDashboard(false); setShowNewProjectModal(false);
  };

  // ─── Open existing project — restores ALL state including images ───────────
  const handleOpenProject = useCallback(async (proj: HorrorProject) => {
    // Restore settings
    setCurrentProject(proj);
    currentProjectRef.current = proj;
    setAspectRatio(proj.aspectRatio);
    setGreenScreen(proj.greenScreen);
    setAnimMode(proj.animMode as AnimationMode);
    setActiveParticles(proj.activeParticles);
    setActiveSounds(proj.activeSounds);
    setMasterVolume(proj.masterVolume);

    // Restore images — each image has base64 url saved in project
    const restored: UploadedImage[] = proj.images.map(img => {
      const url = img.url || ''; // This is the base64 data URL

      if (url) {
        // Store in blob store and preload into image cache
        imageBlobStore[img.id] = url;
        preloadImage(img.id, url); // fire and forget — canvas will pick it up
      }

      return {
        id: img.id,
        file: new File([], img.name, { type: 'image/png' }),
        url: url,
        name: img.name,
        animation: img.animation ?? null,
        animations: img.animations ?? [],
        greenScreen: false,
        position: img.position ?? { x: 50, y: 50 },
        scale: img.scale ?? 1,
        rotation: img.rotation ?? 0,
        opacity: img.opacity ?? 1,
      };
    });

    setImages(restored);
    imagesRef.current = restored;
    setSelectedId(restored.length > 0 ? restored[0].id : null);
    setShowDashboard(false);
  }, []);

  const tagColor = (tag: string) =>
    tag === 'TikTok' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' :
    tag === 'Twitch' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
    tag === 'OBS' || tag === 'OBS 4K' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
    'bg-zinc-700/50 border-zinc-700 text-zinc-500';

  // ─── Preview Area Component ───────────────────────────────────────────────
  const PreviewArea = ({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    const sizeStyle = isFullscreen
      ? { width: isVertical ? '50vh' : '90vw', aspectRatio: `${ratio.width} / ${ratio.height}` }
      : { width: '100%', aspectRatio: `${ratio.width} / ${ratio.height}`, maxWidth: isVertical ? '280px' : '100%' };
    return (
      <div style={sizeStyle} className="relative overflow-hidden rounded-lg shadow-2xl shadow-black/80 border border-zinc-800">
        {recording && !isFullscreen && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full border border-red-500/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-300 text-[9px] font-bold">REC {formatTime(recordingTime)}</span>
          </div>
        )}
        <div ref={isFullscreen ? undefined : previewRef}
          className={`w-full h-full relative overflow-hidden ${greenScreen ? 'bg-[#00ff00]' : 'bg-zinc-950'}`}>
          {!greenScreen && (
            <div className="absolute inset-0 pointer-events-none opacity-30"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '10% 10%' }} />
          )}
         {previewImages.map((img, idx) => (
            <div
              key={img.id}
              className={`absolute ${getAnimClass(img)}`}
              style={{
                left: `${img.position.x}%`, top: `${img.position.y}%`,
                transform: `translate(-50%,-50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                opacity: img.opacity, zIndex: 5,
                // CSS transition for live preview (Filmora-style)
                transition: activeTransition !== 'none' && animMode === 'slideshow'
                  ? `opacity ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out`
                  : 'none',
              }}
            >
              style={{
                left: `${img.position.x}%`, top: `${img.position.y}%`,
                transform: `translate(-50%,-50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                opacity: img.opacity, zIndex: 5,
              }}>
              <img
                src={imageBlobStore[img.id] || img.url}
                alt={img.name}
                draggable={false}
                crossOrigin="anonymous"
                style={{ maxWidth: isFullscreen ? '450px' : '180px', maxHeight: isFullscreen ? '450px' : '180px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ))}
          {previewImages.length === 0 && !isFullscreen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-8 h-8 text-zinc-800" />
              <p className="text-[10px] text-zinc-700">Upload images to start</p>
            </div>
          )}
          <ParticleOverlay effects={activeParticles} width={ratio.width} height={ratio.height} />
          {!greenScreen && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%)' }} />
          )}
        </div>
      </div>
    );
  };

  // ─── Dashboard View ───────────────────────────────────────────────────────
  if (showDashboard) {
    return (
      <ProjectDashboard
        username={username}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onDelete={id => { deleteProject(id); setAllProjects(loadProjects()); }}
      />
    );
  }

  // ─── Main Studio View ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <AppBackground />
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}

      {showRecordingSettings && (
        <RecordingSettingsModal
          settings={recordingSettings}
          onSave={s => setRecordingSettings(s)}
          onStart={s => { setRecordingSettings(s); setShowRecordingSettings(false); startRecording(s); }}
          onCancel={() => setShowRecordingSettings(false)}
        />
      )}

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowNewProjectModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-sm mb-3">New Project</h3>
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewProject(newProjectName || `Project ${Date.now()}`); if (e.key === 'Escape') setShowNewProjectModal(false); }}
              placeholder="Project name..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-red-500 rounded mb-3" />
            <div className="flex gap-2">
              <button onClick={() => handleNewProject(newProjectName || `Project ${Date.now()}`)}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded border border-red-500">Create</button>
              <button onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded border border-zinc-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-red-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div ref={projectDropdownRef} className="relative">
            <button onClick={() => setShowProjectDropdown(p => !p)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all">
              <div className="w-6 h-6 bg-red-700 rounded flex items-center justify-center flex-shrink-0"><Skull className="w-3.5 h-3.5 text-white" /></div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">{currentProject?.name ?? 'Studio'}</p>
                <p className="text-[8px] text-zinc-500">{currentProject?.status === 'finished' ? '✓ Finished' : '● Draft'}</p>
              </div>
              <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform flex-shrink-0 ${showProjectDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProjectDropdown && (
              <ProjectFolderPopup
                currentProject={currentProject}
                projects={allProjects}
                onOpen={handleOpenProject}
                onNew={() => setShowNewProjectModal(true)}
                onClose={() => setShowProjectDropdown(false)}
                onGoLibrary={() => { setShowProjectDropdown(false); setShowDashboard(true); }}
              />
            )}
          </div>
          {autoSaveMsg && (
            <span className="text-[10px] text-green-400 bg-green-900/20 border border-green-800/30 px-2 py-0.5 rounded">{autoSaveMsg}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 mr-2">
            <span className="text-red-500/60">{images.length}</span> imgs ·
            <span className="text-red-500/60 ml-1">{activeSounds.length}</span> sounds ·
            <span className="text-red-500/60 ml-1">{activeParticles.length}</span> fx
          </div>
          <button onClick={() => doAutoSave('draft')}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] border border-zinc-700">
            <Save className="w-3 h-3" /> Save Draft
          </button>
          <button onClick={() => doAutoSave('finished')}
            className="flex items-center gap-1 px-2.5 py-1 bg-green-900/40 hover:bg-green-800/40 text-green-400 text-[10px] border border-green-800/40">
            <CheckCircle className="w-3 h-3" /> Finish
          </button>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1">
            <User className="w-3 h-3 text-red-400" /><span className="text-red-300">{username}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── LEFT PANEL ── */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-r border-zinc-800 overflow-hidden">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-3 mt-3 flex-shrink-0 rounded-lg border-2 border-dashed cursor-pointer transition-all p-3 flex flex-col items-center justify-center gap-1.5 ${dragover ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/20 hover:bg-zinc-800/40'}`}>
            <Upload className={`w-5 h-5 ${dragover ? 'text-red-400' : 'text-zinc-600'}`} />
            <p className={`text-[10px] font-medium ${dragover ? 'text-red-300' : 'text-zinc-500'}`}>Drop images or click</p>
            <p className="text-[9px] text-zinc-700">PNG · JPG · WebP · bulk</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={e => handleFiles(e.target.files)} className="hidden" />
          </div>

          {images.length > 0 && (
            <div className="mx-3 my-2 space-y-1 overflow-y-auto flex-shrink-0" style={{ maxHeight: '130px' }}>
              {images.map(img => {
                const activeAnims = img.animations ?? (img.animation ? [img.animation] : []);
                return (
                  <div key={img.id} onClick={() => setSelectedId(img.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border transition-all ${selectedId === img.id ? 'bg-red-500/15 border-red-500/40' : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800/60'}`}>
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                      <img
                        src={imageBlobStore[img.id] || img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-300 truncate">{img.name}</p>
                      {activeAnims.length > 0 && <p className="text-[9px] text-red-400">{activeAnims.length} anims</p>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} className="text-zinc-700 hover:text-red-400 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex border-b border-zinc-800 flex-shrink-0">
            {(['animations', 'sounds', 'tts', 'transitions'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-red-400 border-b-2 border-red-500 bg-red-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab === 'tts' ? 'TTS' : tab === 'animations' ? 'Anim' : tab === 'transitions' ? 'Trans' : 'Sound'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'animations' && (
              <AnimationPanel
                selectedAnimations={selectedImage?.animations ?? (selectedImage?.animation ? [selectedImage.animation] : [])}
                onToggle={toggleAnimation}
                onClearAll={clearAllAnimations}
                disabled={!selectedId}
              />
            )}
            {activeTab === 'sounds' && (
              <SoundLibrary activeSounds={activeSounds} onToggleSound={toggleSound} masterVolume={masterVolume} onVolumeChange={setMasterVolume} />
            )}
            {activeTab === 'tts' && <TTSPanel />}
            {activeTab === 'transitions' && (
              <TransitionPanel
                selectedTransition={activeTransition}
                transitionDuration={transitionDuration}
                onSelectTransition={(id, dur) => {
                  setActiveTransition(id);
                  setTransitionDuration(dur);
                }}
                disabled={animMode !== 'slideshow' && animMode !== 'all-visible'}
              />
            )}
          </div>
        </div>

        {/* ── CENTER CANVAS ── */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Preview</span>
              <span className="text-[10px] text-zinc-700 font-mono">{ratio.width}×{ratio.height}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${tagColor(ratio.tag)}`}>{ratio.tag}</span>
              {recording && <span className="text-[9px] text-red-400 animate-pulse font-bold">● REC {formatTime(recordingTime)}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleDownload} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700">
                <Download className="w-3 h-3" /> PNG
              </button>
              {currentProject && getProjectVideos(currentProject.id).length > 0 && (
                <button onClick={() => setShowProjectDropdown(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 text-[11px] text-purple-300 border border-purple-800/40">
                  <Film className="w-3 h-3" /> {getProjectVideos(currentProject.id).length} Video{getProjectVideos(currentProject.id).length !== 1 ? 's' : ''}
                </button>
              )}
              <button onClick={() => !recording && setShowRecordingSettings(true)} disabled={recording}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 disabled:opacity-40" title="Recording Settings">
                <Settings2 className="w-3 h-3" />
              </button>
              <button onClick={handleRecord} disabled={savingVideo}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${recording ? 'bg-red-500/20 border-red-500/40 text-red-300' : savingVideo ? 'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-wait' : 'bg-zinc-800 hover:bg-red-900/20 text-zinc-300 border-zinc-700 hover:border-red-800'}`}>
                <CircleDot className={`w-3 h-3 ${recording ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
                {savingVideo ? 'Saving…' : recording ? `Stop ${formatTime(recordingTime)}` : `Record ${ratio.width}×${ratio.height}`}
              </button>
              <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="flex items-center justify-center w-full h-full"><PreviewArea /></div>
          </div>
          {images.length > 1 && animMode === 'single' && (
            <div className="flex items-center justify-center gap-2 py-2 border-t border-zinc-800 flex-shrink-0 bg-zinc-900/30">
              <button onClick={goLeft} disabled={selectedIdx === 0} className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <div className="flex gap-1 items-center">
                {images.map(img => (
                  <button key={img.id} onClick={() => setSelectedId(img.id)}
                    className={`rounded-full transition-all ${selectedId === img.id ? 'bg-red-500 w-4 h-1.5' : 'bg-zinc-700 hover:bg-zinc-600 w-1.5 h-1.5'}`} />
                ))}
              </div>
              <button onClick={goRight} disabled={selectedIdx === images.length - 1} className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-l border-zinc-800 overflow-y-auto">
          <div className="p-3 space-y-4">
            <ControlPanel
              selectedImage={selectedImage}
              aspectRatio={aspectRatio}
              greenScreenEnabled={greenScreen}
              animationMode={animMode}
              activeParticles={activeParticles}
              onAspectRatioChange={setAspectRatio}
              onGreenScreenToggle={setGreenScreen}
              onAnimationModeChange={setAnimMode}
              onParticleToggle={toggleParticle}
              onUpdateImage={updateImage}
            />
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN OVERLAY ── */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 z-50 text-white bg-zinc-800 hover:bg-zinc-700 rounded-full p-2 border border-zinc-700">
            <X className="w-5 h-5" />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ width: isVertical ? '40vh' : '90vw', aspectRatio: `${ratio.width} / ${ratio.height}` }}>
            <PreviewArea isFullscreen />
          </div>
        </div>
      )}
    </div>
  );
}

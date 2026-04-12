import { useState, useRef, useCallback, useEffect } from 'react';
import { ANIMATION_PRESETS, ASPECT_RATIOS } from '@/lib/animations';
import type { UploadedImage, AnimationMode } from '@/lib/animations';
import { loadProjects, saveProject, deleteProject, generateId } from '@/lib/project-store';
import type { HorrorProject } from '@/lib/project-store';
import AppBackground from '@/components/AppBackground';
import AnimationPanel from '@/components/AnimationPanel';
import SoundLibrary from '@/components/SoundLibrary';
import ControlPanel from '@/components/ControlPanel';
import ParticleOverlay from '@/components/ParticleOverlay';
import TTSPanel from '@/components/TTSPanel';
import {
  Upload, ImageIcon, Download, CircleDot,
  ChevronLeft, ChevronRight, Maximize2, Skull, X,
  FolderOpen, Plus, Save, CheckCircle, Clock, Trash2, User,
  Film, Video, Play, Pause, Volume2, VolumeX,
  ChevronDown, Maximize, Minimize,
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

const imageBlobStore: Record<string, string> = {};
const imageElementCache: Record<string, HTMLImageElement> = {};

function loadImageElement(id: string, url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageElementCache[id]?.complete && imageElementCache[id].naturalWidth > 0) {
      resolve(imageElementCache[id]); return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageElementCache[id] = img; resolve(img); };
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => { imageElementCache[id] = img2; resolve(img2); };
      img2.onerror = reject;
      img2.src = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    };
    img.src = url;
  });
}

// ── ANIMATION STATE PER IMAGE ──
// Each image has its own animation time offset so they don't sync
const animTimeOffsets: Record<string, number> = {};

// Get real animation values from CSS animation ID
function getAnimValues(animId: string, t: number, outW: number, outH: number) {
  let offX = 0, offY = 0, extraScale = 1, extraRot = 0, alpha = 1;
  const id = animId.toLowerCase();

  // MOVEMENT
  if (id === 'float' || id === 'ghostly-float') {
    offY = Math.sin(t * 1.6) * outH * 0.025;
    offX = Math.sin(t * 0.8) * outW * 0.008;
  } else if (id === 'shake' || id === 'demonic-shake' || id === 'earthquake' || id === 'earthquake-terror') {
    const intensity = id.includes('earthquake') ? 0.025 : 0.012;
    offX = (Math.random() - 0.5) * outW * intensity;
    offY = (Math.random() - 0.5) * outH * (intensity * 0.8);
  } else if (id === 'swing' || id === 'pendulum-swing') {
    extraRot = Math.sin(t * 2.2) * 0.18;
  } else if (id === 'sway' || id === 'corpse-sway') {
    extraRot = Math.sin(t * 1.0) * 0.12;
    offY = Math.abs(Math.sin(t * 1.0)) * outH * 0.01;
  } else if (id === 'creep' || id === 'creeping-shadow') {
    offX = (((t * 0.05) % 1.2) - 0.1) * outW;
  } else if (id === 'drift-left') {
    offX = -(((t * 0.08) % 1.2) * outW);
  } else if (id === 'drift-right') {
    offX = ((t * 0.08) % 1.2) * outW;
  } else if (id === 'spiral' || id === 'death-spiral') {
    extraRot = t * 1.2;
    extraScale = 1 + Math.sin(t * 1.2) * 0.1;
  } else if (id === 'bounce' || id === 'demon-bounce') {
    offY = -Math.abs(Math.sin(t * 3.5)) * outH * 0.08;
  } else if (id === 'teleport' || id === 'shadow-teleport') {
    alpha = Math.floor(t * 3) % 2 === 0 ? 1 : 0;
    if (alpha === 1) { offX = (Math.random() - 0.5) * outW * 0.1; offY = (Math.random() - 0.5) * outH * 0.1; }
  } else if (id === 'slide-down' || id === 'descend-from-void') {
    offY = Math.sin(t * 0.7) * outH * 0.06;
  } else if (id === 'slide-up' || id === 'rise-from-below') {
    offY = -Math.sin(t * 0.7) * outH * 0.06;
  } else if (id === 'zigzag' || id === 'possessed-zigzag') {
    offX = Math.sin(t * 4) * outW * 0.04;
    offY = Math.sin(t * 8) * outH * 0.02;
  } else if (id === 'jerk' || id === 'possession-jerk') {
    offX = Math.random() < 0.3 ? (Math.random() - 0.5) * outW * 0.03 : 0;
    offY = Math.random() < 0.3 ? (Math.random() - 0.5) * outH * 0.03 : 0;
  } else if (id === 'orbit' || id === 'dark-orbit') {
    offX = Math.cos(t * 1.0) * outW * 0.06;
    offY = Math.sin(t * 1.0) * outH * 0.06;
  } else if (id === 'levitate-spin' || id === 'levitate-&-spin') {
    offY = Math.sin(t * 1.5) * outH * 0.02;
    extraRot = t * 0.4;
  } else if (id === 'crawl' || id === 'crawl-across') {
    offX = ((t * 0.04) % 1.5 - 0.25) * outW;
    offY = Math.sin(t * 2) * outH * 0.01;
  } else if (id === 'marionette' || id === 'marionette-drop') {
    offY = Math.abs(Math.sin(t * 2.5)) * outH * 0.05;
    extraRot = Math.sin(t * 2.5) * 0.08;
  } else if (id === 'tidal' || id === 'tidal-wave') {
    offX = Math.sin(t * 1.2) * outW * 0.08;
    extraScale = 1 + Math.sin(t * 1.2) * 0.05;
  } else if (id === 'chaotic' || id === 'chaotic-dance') {
    offX = (Math.random() - 0.5) * outW * 0.04;
    offY = (Math.random() - 0.5) * outH * 0.04;
    extraRot = (Math.random() - 0.5) * 0.2;
  } else if (id === 'rise-fall' || id === 'rise-and-fall') {
    offY = Math.sin(t * 1.3) * outH * 0.04;
  } else if (id === 'sidewind' || id === 'sidewinder') {
    offX = Math.sin(t * 2) * outW * 0.05;
    offY = Math.cos(t * 4) * outH * 0.015;
  } else if (id === 'pulse-move') {
    extraScale = 1 + Math.sin(t * 2) * 0.05;
    offX = Math.sin(t * 0.7) * outW * 0.015;
  } else if (id === 'warp-drift') {
    offX = Math.sin(t * 0.9) * outW * 0.03;
    offY = Math.cos(t * 1.1) * outH * 0.03;
    extraScale = 1 + Math.sin(t * 1.3) * 0.04;
  }

  // SCARE
  else if (id === 'jumpscare' || id === 'jump-scare') {
    const cycle = t % 3.0;
    if (cycle > 2.7) { extraScale = 1 + (cycle - 2.7) / 0.3 * 1.5; alpha = Math.min(1, (3.0 - cycle) * 10); }
  } else if (id === 'flash-blink') {
    alpha = Math.floor(t * 4) % 2 === 0 ? 1 : 0;
  } else if (id === 'sudden-loom') {
    const cycle = (t * 0.5) % 1;
    extraScale = cycle < 0.15 ? 1 + cycle / 0.15 * 0.6 : cycle < 0.25 ? 1.6 - (cycle - 0.15) / 0.1 * 0.6 : 1;
  } else if (id === 'evil-zoom' || id === 'evil-zoom-in') {
    extraScale = 1 + (t * 0.03) % 0.5;
  } else if (id === 'strobe' || id === 'terror-strobe') {
    alpha = Math.floor(t * 10) % 2 === 0 ? 1 : 0;
  } else if (id === 'blackout-reveal') {
    const cycle = (t * 0.3) % 1;
    alpha = cycle < 0.4 ? 0 : Math.min(1, (cycle - 0.4) / 0.2);
  } else if (id === 'rapid-approach') {
    const cycle = (t * 0.5) % 1;
    extraScale = 0.3 + cycle * 1.2;
    alpha = cycle < 0.9 ? 1 : 1 - (cycle - 0.9) / 0.1;
  } else if (id === 'crash-in') {
    const cycle = (t * 0.5) % 1;
    offX = cycle < 0.2 ? (0.2 - cycle) / 0.2 * -outW * 0.6 : 0;
    extraScale = cycle < 0.2 ? 0.5 + cycle / 0.2 * 0.5 : 1;
  } else if (id === 'slam-down') {
    const cycle = (t * 0.5) % 1;
    offY = cycle < 0.2 ? (0.2 - cycle) / 0.2 * -outH * 0.5 : 0;
  } else if (id === 'nuclear-pulse') {
    const cycle = (t * 0.7) % 1;
    extraScale = 1 + Math.sin(cycle * Math.PI) * 0.4;
    alpha = 1 - cycle * 0.3;
  } else if (id === 'warp-jump') {
    const cycle = (t * 0.4) % 1;
    extraScale = 1 + Math.sin(cycle * Math.PI * 2) * 0.15;
    offX = Math.sin(cycle * Math.PI * 4) * outW * 0.02;
  } else if (id === 'horror-snap') {
    offX = Math.random() < 0.2 ? (Math.random() - 0.5) * outW * 0.06 : 0;
    offY = Math.random() < 0.2 ? (Math.random() - 0.5) * outH * 0.06 : 0;
    extraRot = Math.random() < 0.1 ? (Math.random() - 0.5) * 0.4 : 0;
  } else if (id === 'rage-flash') {
    alpha = Math.floor(t * 5) % 3 === 0 ? 0.3 : 1;
  } else if (id === 'dive-bomb') {
    const cycle = (t * 0.5) % 1;
    offY = cycle < 0.3 ? -outH * 0.3 + cycle / 0.3 * outH * 0.3 : 0;
    extraScale = cycle < 0.3 ? 0.5 + cycle / 0.3 * 0.5 : 1;
  } else if (id === 'possession' || id === 'possession-burst') {
    offX = (Math.random() - 0.5) * outW * 0.03;
    offY = (Math.random() - 0.5) * outH * 0.03;
    extraScale = 1 + (Math.random() - 0.5) * 0.1;
  } else if (id === 'rage-burst') {
    const cycle = (t * 1.0) % 1;
    extraScale = 1 + Math.sin(cycle * Math.PI) * 0.3;
  } else if (id === 'terror-vibrate') {
    offX = (Math.random() - 0.5) * outW * 0.008;
    offY = (Math.random() - 0.5) * outH * 0.008;
  } else if (id === 'appear-ghost' || id === 'ghost-appear') {
    const cycle = (t * 0.4) % 1;
    alpha = cycle < 0.5 ? cycle * 2 : 1 - (cycle - 0.5) * 2;
  } else if (id === 'grab-reach' || id === 'grab-&-reach') {
    offX = Math.sin(t * 1.5) * outW * 0.03;
    extraScale = 1 + Math.sin(t * 1.5) * 0.05;
  } else if (id === 'shatter' || id === 'reality-shatter') {
    const cycle = (t * 0.5) % 1;
    if (cycle > 0.8) { offX = (Math.random() - 0.5) * outW * 0.04; offY = (Math.random() - 0.5) * outH * 0.04; }
  } else if (id === 'death-drop') {
    const cycle = (t * 0.4) % 1;
    offY = cycle * outH * 0.15;
    alpha = 1 - cycle * 0.8;
  }

  // ATMOSPHERIC
  else if (id === 'haunting' || id === 'haunting-fade') {
    alpha = 0.3 + Math.sin(t * 0.7) * 0.7;
    offY = Math.sin(t * 0.5) * outH * 0.015;
  } else if (id === 'pulse-glow' || id === 'blood-pulse-glow') {
    extraScale = 1 + Math.sin(t * Math.PI * 1.5) * 0.06;
  } else if (id === 'flicker' || id === 'light-flicker') {
    alpha = 0.6 + Math.sin(t * 7) * 0.4 + (Math.random() > 0.9 ? -0.4 : 0);
  } else if (id === 'shadow-breathe') {
    extraScale = 1 + Math.sin(t * 0.8) * 0.07;
    alpha = 0.8 + Math.sin(t * 0.8) * 0.2;
  } else if (id === 'spectral-shift') {
    alpha = 0.5 + Math.sin(t * 0.6) * 0.5;
    offX = Math.sin(t * 0.4) * outW * 0.01;
  } else if (id === 'nightmare-phase') {
    alpha = 0.4 + Math.abs(Math.sin(t * 0.5)) * 0.6;
  } else if (id === 'dark-ritual') {
    extraScale = 1 + Math.sin(t * 2) * 0.04;
    extraRot = Math.sin(t * 1.5) * 0.05;
  } else if (id === 'spirit-manifest') {
    alpha = Math.abs(Math.sin(t * 0.4));
    offY = Math.sin(t * 0.8) * outH * 0.02;
  } else if (id === 'aura-glow' || id === 'cursed-aura') {
    extraScale = 1 + Math.sin(t * 1.5) * 0.08;
  } else if (id === 'limbo-float') {
    offY = Math.sin(t * 0.6) * outH * 0.03;
    alpha = 0.7 + Math.sin(t * 0.4) * 0.3;
  } else if (id === 'void-portal') {
    extraScale = 1 + Math.sin(t * 0.8) * 0.12;
    extraRot = t * 0.2;
  } else if (id === 'soul-emerge') {
    offY = Math.sin(t * 0.5) * outH * 0.02;
    alpha = 0.5 + Math.sin(t * 0.7) * 0.5;
  } else if (id === 'ghost-drift' || id === 'ghost-drift-through') {
    offX = Math.sin(t * 0.4) * outW * 0.06;
    alpha = 0.6 + Math.sin(t * 0.5) * 0.4;
  } else if (id === 'grave-rise') {
    offY = -Math.abs(Math.sin(t * 0.4)) * outH * 0.06;
  } else if (id === 'purgatory' || id === 'purgatory-pulse') {
    extraScale = 1 + Math.sin(t * 1.2) * 0.05;
    alpha = 0.7 + Math.sin(t * 0.9) * 0.3;
  } else if (id === 'eternal-dark' || id === 'eternal-darkness') {
    alpha = Math.max(0.1, 1 - (t * 0.02) % 1);
  } else if (id === 'cursed-halo') {
    extraRot = t * 0.5;
    offY = Math.sin(t * 1.0) * outH * 0.01;
  }

  // VISUAL
  else if (id === 'glitch' || id === 'glitch-horror') {
    if (Math.random() < 0.15) { offX += (Math.random() - 0.5) * outW * 0.03; }
    if (Math.random() < 0.05) { alpha = 0; }
  } else if (id === 'flicker' || id === 'light-flicker') {
    alpha = 0.6 + Math.sin(t * 8) * 0.4;
  } else if (id === 'tv-static' || id === 'tv-static-corrupt') {
    offX = (Math.random() - 0.5) * outW * 0.015;
    offY = (Math.random() - 0.5) * outH * 0.005;
    alpha = 0.7 + Math.random() * 0.3;
  } else if (id === 'corruption' || id === 'digital-corruption' || id === 'pixel-corrupt') {
    if (Math.random() < 0.2) { offX = (Math.random() - 0.5) * outW * 0.02; }
  } else if (id === 'chromatic' || id === 'chromatic-aberration') {
    offX = Math.sin(t * 3) * outW * 0.005;
  } else if (id === 'possession-pulse') {
    extraScale = 1 + Math.sin(t * 3) * 0.06;
  } else if (id === 'shadow-clone') {
    offX = Math.sin(t * 1.5) * outW * 0.02;
  } else if (id === 'blood-moon' || id === 'blood-moon-filter') {
    alpha = 0.85 + Math.sin(t * 0.5) * 0.15;
  } else if (id === 'laser-eyes' || id === 'laser-eyes-glow') {
    extraScale = 1 + Math.sin(t * 4) * 0.03;
  } else if (id === 'mirror-world' || id === 'mirror-world-flip') {
    extraRot = Math.floor(t * 0.33) % 2 === 0 ? 0 : Math.PI;
  } else if (id === 'hell-warp') {
    offX = Math.sin(t * 2) * outW * 0.015;
    offY = Math.cos(t * 1.7) * outH * 0.01;
    extraScale = 1 + Math.sin(t * 1.2) * 0.04;
  } else if (id === 'film-grain' || id === 'horror-film-grain') {
    offX = (Math.random() - 0.5) * 2;
    offY = (Math.random() - 0.5) * 2;
  } else if (id === 'celestial-horror') {
    offY = Math.sin(t * 0.5) * outH * 0.03;
    extraScale = 1 + Math.sin(t * 0.7) * 0.06;
  }

  return { offX, offY, extraScale: Math.max(0.01, extraScale), extraRot, alpha: Math.max(0, Math.min(1, alpha)) };
}

// ── Full-Featured Video Player ──
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
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [url] = useState(() => URL.createObjectURL(video.blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') { videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5); }
      if (e.key === 'ArrowLeft') { videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); }
      if (e.key === 'ArrowUp') { videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1); setVolume(videoRef.current.volume); }
      if (e.key === 'ArrowDown') { videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1); setVolume(videoRef.current.volume); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
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
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * videoRef.current.duration;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url; a.download = video.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/96 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={containerRef}
        onClick={e => e.stopPropagation()}
        onMouseMove={resetHideTimer}
        className="bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-700 relative"
        style={{ width: '100%', maxWidth: '860px', margin: 'auto' }}
      >
        {/* Top bar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b border-zinc-800 transition-opacity ${isFullscreen && !showControls ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: '#09090b' }}>
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-white text-sm font-bold truncate">{video.name}</span>
            <span className="text-zinc-500 text-xs flex-shrink-0">{formatDur(duration)} · {formatSize(video.size)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded border border-red-500">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="relative bg-black" style={{ lineHeight: 0 }}>
          <video
            ref={videoRef} src={url} onClick={togglePlay}
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

          {/* Center play button overlay */}
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-red-700/80 rounded-full flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${!showControls && playing && isFullscreen ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)', padding: '12px 12px 8px' }}
          >
            {/* Progress bar */}
            <div className="relative w-full h-2 bg-zinc-700 rounded-full mb-2 cursor-pointer group" onClick={seek}>
              <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-400 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -ml-1.5"
                style={{ left: `${progress}%` }} />
            </div>

            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button onClick={togglePlay}
                className="w-8 h-8 bg-red-700 hover:bg-red-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Time */}
              <span className="text-white text-xs font-mono">{formatDur(currentTime)} / {formatDur(duration)}</span>

              <div className="flex-1" />

              {/* Volume */}
              <button onClick={() => { if (videoRef.current) { const m = !muted; videoRef.current.muted = m; setMuted(m); } }}
                className="text-zinc-400 hover:text-white p-1">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; } setMuted(v === 0); }}
                className="w-20 h-1 accent-red-500 cursor-pointer" />

              {/* Skip backward */}
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
                className="text-zinc-400 hover:text-white text-[10px] px-1.5 py-1 rounded border border-zinc-700 hover:border-zinc-500">-10s</button>

              {/* Skip forward */}
              <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10); }}
                className="text-zinc-400 hover:text-white text-[10px] px-1.5 py-1 rounded border border-zinc-700 hover:border-zinc-500">+10s</button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-zinc-400 hover:text-white p-1">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="px-4 py-1.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center gap-3 text-[8px] text-zinc-600">
          <span>Space: Play/Pause</span>
          <span>←→: ±5s</span>
          <span>↑↓: Volume</span>
          <span>F: Fullscreen</span>
          <span>Esc: Close</span>
        </div>
      </div>
    </div>
  );
}

// ── Project Folder Popup ──
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
                            <div className="w-8 h-8 bg-red-700/90 rounded-full flex items-center justify-center hover:bg-red-600">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
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

// ── Project Dashboard ──
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

  useEffect(() => { setProjects(loadProjects()); }, []);
  const refresh = () => setProjects(loadProjects());
  const handleNew = () => { onNew(newName.trim() || `Project ${Date.now()}`); };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-y-auto">
      <AppBackground />
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
      <div className="relative z-10 flex flex-col min-h-full">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-red-900/30 bg-zinc-900/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/60"><Skull className="w-5 h-5 text-white" /></div>
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
                        <div onClick={() => onOpen(p)} className="cursor-pointer p-4">
                          {p.thumbnail ? (
                            <div className="w-full h-28 overflow-hidden mb-3 bg-zinc-800 rounded"><img src={p.thumbnail} alt="" className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="w-full h-28 bg-zinc-800/50 flex items-center justify-center mb-3 border border-zinc-700/30 rounded"><Skull className="w-10 h-10 text-zinc-700" /></div>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-sm truncate group-hover:text-red-300">{p.name}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {p.status === 'finished'
                                  ? <span className="flex items-center gap-1 text-[9px] text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded"><CheckCircle className="w-2.5 h-2.5" /> Finished</span>
                                  : <span className="flex items-center gap-1 text-[9px] text-yellow-500 border border-yellow-800/40 px-1.5 py-0.5 rounded"><Clock className="w-2.5 h-2.5" /> Draft</span>}
                                <span className="text-[9px] text-zinc-600">{new Date(p.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteProject(p.id); refresh(); onDelete(p.id); }} className="text-zinc-700 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {videos.length > 0 && (
                          <div className="border-t border-zinc-800 px-4 py-2">
                            <button onClick={e => { e.stopPropagation(); setExpandedId(expandedId === p.id ? null : p.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-red-400 w-full py-1">
                              <Film className="w-3 h-3" /><span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span><span className="ml-auto text-[8px]">{expandedId === p.id ? '▲' : '▼'}</span>
                            </button>
                            {expandedId === p.id && (
                              <div className="mt-2 space-y-2 pb-2">
                                {videos.map(v => (
                                  <div key={v.id} className="bg-zinc-800/60 rounded-lg border border-zinc-700/30 overflow-hidden">
                                    <div className="w-full h-20 bg-zinc-900 relative cursor-pointer" onClick={e => { e.stopPropagation(); setPlayingVideo(v); }}>
                                      {v.thumbnail && <img src={v.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />}
                                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-red-700/90 rounded-full flex items-center justify-center hover:bg-red-600"><Play className="w-5 h-5 text-white ml-0.5" /></div></div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2">
                                      <div className="flex-1 min-w-0"><p className="text-[10px] text-zinc-300 truncate">{v.name}</p><p className="text-[9px] text-zinc-600">{formatDur(v.duration)} · {formatSize(v.size)}</p></div>
                                      <button onClick={e => { e.stopPropagation(); setPlayingVideo(v); }} className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[9px] rounded flex-shrink-0"><Play className="w-2.5 h-2.5" /> Play</button>
                                      <button onClick={e => {
                                        e.stopPropagation();
                                        const url = URL.createObjectURL(v.blob); const a = document.createElement('a');
                                        a.href = url; a.download = v.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
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

// ═══════════════════════════════════════════════════════════
// MAIN STUDIO
// ═══════════════════════════════════════════════════════════
export default function HorrorStudio() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentProject, setCurrentProject] = useState<HorrorProject | null>(null);
  const [allProjects, setAllProjects] = useState<HorrorProject[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
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
  const [activeTab, setActiveTab] = useState<'animations' | 'sounds' | 'tts'>('animations');
  const [dragover, setDragover] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<ProjectVideo | null>(null);
  const [, forceUpdate] = useState(0);

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

  // Live refs — no stale closures in rAF loop
  const imagesRef = useRef<UploadedImage[]>([]);
  const slideshowIdxRef = useRef(0);
  const randomVisibleRef = useRef<string[]>([]);
  const animModeRef = useRef<AnimationMode>('single');
  const selectedIdRef = useRef<string | null>(null);
  const greenScreenRef = useRef(false);
  const frameCountRef = useRef(0);
  const animStartTimesRef = useRef<Record<string, number>>({});

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { slideshowIdxRef.current = slideshowIdx; }, [slideshowIdx]);
  useEffect(() => { randomVisibleRef.current = randomVisible; }, [randomVisible]);
  useEffect(() => { animModeRef.current = animMode; }, [animMode]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { greenScreenRef.current = greenScreen; }, [greenScreen]);

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

  const doAutoSave = useCallback((status?: 'draft' | 'finished') => {
    if (!currentProject) return;
    let thumbnail = currentProject.thumbnail;
    if (images.length > 0) {
      const firstImg = images[0];
      thumbnail = imageBlobStore[firstImg.id] || firstImg.url || thumbnail;
    }
    const updated: HorrorProject = {
      ...currentProject, updatedAt: Date.now(),
      status: status ?? currentProject.status,
      aspectRatio, greenScreen, animMode,
      activeParticles, activeSounds, masterVolume, thumbnail,
      images: images.map(img => ({
        id: img.id, url: imageBlobStore[img.id] || img.url, name: img.name,
        animation: img.animation, animations: img.animations ?? [],
        position: img.position, scale: img.scale, rotation: img.rotation, opacity: img.opacity,
      })),
    };
    saveProject(updated);
    setCurrentProject(updated);
    setAllProjects(loadProjects());
    setAutoSaveMsg('Saved ✓');
    setTimeout(() => setAutoSaveMsg(''), 2000);
  }, [currentProject, aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume, images]);

  useEffect(() => {
    if (!currentProject) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => doAutoSave(), 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [images, aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume]);

  useEffect(() => {
    if (slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current);
    if (animMode === 'slideshow' && images.length > 1)
      slideshowIntervalRef.current = setInterval(() => setSlideshowIdx(i => (i + 1) % images.length), 2500);
    return () => { if (slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current); };
  }, [animMode, images.length]);

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
      loadImageElement(id, url).catch(() => {});
      newImages.push({ id, file, url, name: file.name, animation: null, animations: [], greenScreen: false, position: { x: 50, y: 50 }, scale: 1, rotation: 0, opacity: 1 });
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

  const toggleAnimation = (animId: string) => {
    if (!selectedId || !selectedImage) return;
    const current = selectedImage.animations ?? [];
    const updated = current.includes(animId) ? current.filter(a => a !== animId) : [...current, animId];
    updateImage(selectedId, { animations: updated });
  };

  const clearAllAnimations = () => { if (selectedId) updateImage(selectedId, { animations: [], animation: null }); };
  const toggleSound = (id: string) => setActiveSounds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleParticle = (id: string) => setActiveParticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDownload = () => {
    if (!previewRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(previewRef.current!, { useCORS: true, allowTaint: true, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${currentProject?.name ?? 'horror-overlay'}.png`;
        link.href = canvas.toDataURL('image/png'); link.click();
      });
    });
  };

  // ═══════════════════════════════════════════════════════════
  // RECORDING ENGINE
  // ═══════════════════════════════════════════════════════════
  const startRecording = useCallback(async () => {
    const outWidth = ratio.width;
    const outHeight = ratio.height;
    const recordingStartWallTime = performance.now();

    // Preload all images
    await Promise.allSettled(
      imagesRef.current.map(img => loadImageElement(img.id, imageBlobStore[img.id] || img.url))
    );

    // Init per-image animation start times
    imagesRef.current.forEach(img => {
      if (!animStartTimesRef.current[img.id]) animStartTimesRef.current[img.id] = recordingStartWallTime;
    });

    const recCanvas = document.createElement('canvas');
    recCanvas.width = outWidth; recCanvas.height = outHeight;
    const ctx = recCanvas.getContext('2d', { willReadFrequently: false })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Try to get microphone audio for recording sounds playing in the browser
    let audioStream: MediaStream | null = null;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        },
        video: false,
      });
      audioStreamRef.current = audioStream;
    } catch {
      audioStream = null;
      audioStreamRef.current = null;
    }

    const videoStream = recCanvas.captureStream(30);
    const tracks = [...videoStream.getVideoTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])];
    const combinedStream = new MediaStream(tracks);

    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

    let recorder: MediaRecorder;
    try { recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 12_000_000 }); }
    catch { recorder = new MediaRecorder(combinedStream); }

    chunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    frameCountRef.current = 0;

    recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

    recorder.onstop = async () => {
      cancelAnimationFrame(rafHandleRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (audioStreamRef.current) { audioStreamRef.current.getTracks().forEach(t => t.stop()); audioStreamRef.current = null; }

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const durationSec = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);

      if (blob.size < 1000) {
        alert('Recording failed. Try again.'); setRecording(false); setRecordingTime(0); return;
      }

      if (currentProject) {
        setSavingVideo(true);
        const ext = 'webm';
        const videoName = `${currentProject.name}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;

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

        addProjectVideo(currentProject.id, {
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

    // ── rAF drawing loop ──
    const drawFrame = () => {
      const now = performance.now();
      frameCountRef.current++;
      const imgs = imagesRef.current;
      const mode = animModeRef.current;
      const selId = selectedIdRef.current;
      const ssIdx = slideshowIdxRef.current;
      const randVis = randomVisibleRef.current;
      const gs = greenScreenRef.current;

      // Background
      ctx.fillStyle = gs ? '#00ff00' : '#090909';
      ctx.fillRect(0, 0, outWidth, outHeight);

      // Grid
      if (!gs) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.022)'; ctx.lineWidth = 0.5;
        for (let x = 0; x <= outWidth; x += outWidth / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, outHeight); ctx.stroke(); }
        for (let y = 0; y <= outHeight; y += outHeight / 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(outWidth, y); ctx.stroke(); }
        ctx.restore();
      }

      // Which images
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

        // Per-image elapsed time for independent animation
        const startTime = animStartTimesRef.current[img.id] ?? now;
        const t = (now - startTime) / 1000;

        const anims = img.animations ?? (img.animation ? [img.animation] : []);
        let totalOffX = 0, totalOffY = 0, totalScale = 1, totalRot = 0, totalAlpha = 1;

        for (const animId of anims) {
          const v = getAnimValues(animId, t, outWidth, outHeight);
          totalOffX += v.offX;
          totalOffY += v.offY;
          totalScale *= v.extraScale;
          totalRot += v.extraRot;
          totalAlpha *= v.alpha;
        }

        const cx = (img.position.x / 100) * outWidth;
        const cy = (img.position.y / 100) * outHeight;
        const userScale = img.scale ?? 1;
        const naturalW = el.naturalWidth;
        const naturalH = el.naturalHeight;
        const maxW = outWidth * 0.48;
        const maxH = outHeight * 0.48;
        const baseScale = Math.min(maxW / naturalW, maxH / naturalH);
        const drawScale = baseScale * userScale * totalScale;
        const dw = naturalW * drawScale;
        const dh = naturalH * drawScale;
        const userRotRad = ((img.rotation ?? 0) * Math.PI) / 180;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, (img.opacity ?? 1) * totalAlpha));
        ctx.translate(cx + totalOffX, cy + totalOffY);
        ctx.rotate(userRotRad + totalRot);
        ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Vignette
      if (!gs) {
        const grad = ctx.createRadialGradient(outWidth / 2, outHeight / 2, Math.min(outWidth, outHeight) * 0.25, outWidth / 2, outHeight / 2, Math.max(outWidth, outHeight) * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, outWidth, outHeight);
      }

      rafHandleRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setRecording(true); setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    autoStopTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, 5 * 60 * 1000);
  }, [currentProject, ratio]);

  const handleRecord = useCallback(() => {
    if (recording) {
      cancelAnimationFrame(rafHandleRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      else { setRecording(false); setRecordingTime(0); }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      return;
    }
    startRecording();
  }, [recording, startRecording]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isVertical = ratio.height > ratio.width;

  const getAnimClass = (img: UploadedImage) => {
    const anims = img.animations ?? (img.animation ? [img.animation] : []);
    return anims.map(a => `ha-${a}`).join(' ');
  };

  const selectedIdx = images.findIndex(img => img.id === selectedId);
  const goLeft = () => selectedIdx > 0 && setSelectedId(images[selectedIdx - 1].id);
  const goRight = () => selectedIdx < images.length - 1 && setSelectedId(images[selectedIdx + 1].id);

  const handleNewProject = (name: string) => {
    const proj: HorrorProject = {
      id: generateId(), name, status: 'draft', createdAt: Date.now(), updatedAt: Date.now(),
      aspectRatio: '16:9-1080', greenScreen: false, animMode: 'single',
      activeParticles: [], activeSounds: [], masterVolume: 0.35, images: [],
    };
    saveProject(proj); setCurrentProject(proj);
    setImages([]); setSelectedId(null); setAspectRatio('16:9-1080'); setGreenScreen(false);
    setAnimMode('single'); setActiveParticles([]); setActiveSounds([]); setMasterVolume(0.35);
    setAllProjects(loadProjects()); setShowDashboard(false); setShowNewProjectModal(false);
  };

  const handleOpenProject = (proj: HorrorProject) => {
    setCurrentProject(proj); setAspectRatio(proj.aspectRatio); setGreenScreen(proj.greenScreen);
    setAnimMode(proj.animMode as AnimationMode); setActiveParticles(proj.activeParticles);
    setActiveSounds(proj.activeSounds); setMasterVolume(proj.masterVolume);
    const restored: UploadedImage[] = proj.images.map(img => {
      const url = imageBlobStore[img.id] || img.url;
      if (url) loadImageElement(img.id, url).catch(() => {});
      return { id: img.id, file: new File([], img.name), url, name: img.name, animation: img.animation, animations: img.animations ?? [], greenScreen: false, position: img.position, scale: img.scale, rotation: img.rotation, opacity: img.opacity };
    });
    setImages(restored); setSelectedId(restored.length > 0 ? restored[0].id : null); setShowDashboard(false);
  };

  const tagColor = (tag: string) =>
    tag === 'TikTok' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' :
    tag === 'Twitch' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
    tag === 'OBS' || tag === 'OBS 4K' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
    'bg-zinc-700/50 border-zinc-700 text-zinc-500';

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
          {previewImages.map(img => (
            <div key={img.id} className={`absolute ${getAnimClass(img)}`}
              style={{ left: `${img.position.x}%`, top: `${img.position.y}%`, transform: `translate(-50%,-50%) scale(${img.scale}) rotate(${img.rotation}deg)`, opacity: img.opacity, zIndex: 5 }}>
              <img src={imageBlobStore[img.id] || img.url} alt={img.name} draggable={false} crossOrigin="anonymous"
                style={{ maxWidth: isFullscreen ? '450px' : '180px', maxHeight: isFullscreen ? '450px' : '180px', objectFit: 'contain', display: 'block' }} />
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

  if (showDashboard) {
    return <ProjectDashboard username={username} onNew={handleNewProject} onOpen={handleOpenProject} onDelete={id => { deleteProject(id); setAllProjects(loadProjects()); }} />;
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <AppBackground />
      {playingVideo && <VideoPlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowNewProjectModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-sm mb-3">New Project</h3>
            <input autoFocus value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewProject(newProjectName || `Project ${Date.now()}`); if (e.key === 'Escape') setShowNewProjectModal(false); }}
              placeholder="Project name..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm outline-none focus:border-red-500 rounded mb-3" />
            <div className="flex gap-2">
              <button onClick={() => handleNewProject(newProjectName || `Project ${Date.now()}`)} className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-bold rounded border border-red-500">Create</button>
              <button onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm rounded border border-zinc-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
              <ProjectFolderPopup currentProject={currentProject} projects={allProjects} onOpen={handleOpenProject}
                onNew={() => setShowNewProjectModal(true)} onClose={() => setShowProjectDropdown(false)}
                onGoLibrary={() => { setShowProjectDropdown(false); setShowDashboard(true); }} />
            )}
          </div>
          {autoSaveMsg && <span className="text-[10px] text-green-400 bg-green-900/20 border border-green-800/30 px-2 py-0.5 rounded">{autoSaveMsg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 mr-2">
            <span className="text-red-500/60">{images.length}</span> imgs ·
            <span className="text-red-500/60 ml-1">{activeSounds.length}</span> sounds ·
            <span className="text-red-500/60 ml-1">{activeParticles.length}</span> fx
          </div>
          <button onClick={() => doAutoSave('draft')} className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] border border-zinc-700">
            <Save className="w-3 h-3" /> Save Draft
          </button>
          <button onClick={() => doAutoSave('finished')} className="flex items-center gap-1 px-2.5 py-1 bg-green-900/40 hover:bg-green-800/40 text-green-400 text-[10px] border border-green-800/40">
            <CheckCircle className="w-3 h-3" /> Finish
          </button>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1">
            <User className="w-3 h-3 text-red-400" /><span className="text-red-300">{username}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-r border-zinc-800 overflow-hidden">
          <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragover(true); }} onDragLeave={() => setDragover(false)}
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
                      <img src={imageBlobStore[img.id] || img.url} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-300 truncate">{img.name}</p>
                      {activeAnims.length > 0 && <p className="text-[9px] text-red-400">{activeAnims.length} anims</p>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} className="text-zinc-700 hover:text-red-400 flex-shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex border-b border-zinc-800 flex-shrink-0">
            {(['animations', 'sounds', 'tts'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-red-400 border-b-2 border-red-500 bg-red-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab === 'tts' ? 'TTS' : tab === 'animations' ? 'Anim' : 'Sound'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'animations' && (
              <AnimationPanel selectedAnimations={selectedImage?.animations ?? (selectedImage?.animation ? [selectedImage.animation] : [])}
                onToggle={toggleAnimation} onClearAll={clearAllAnimations} disabled={!selectedId} />
            )}
            {activeTab === 'sounds' && (
              <SoundLibrary activeSounds={activeSounds} onToggleSound={toggleSound} masterVolume={masterVolume} onVolumeChange={setMasterVolume} />
            )}
            {activeTab === 'tts' && <TTSPanel />}
          </div>
        </div>

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

        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-l border-zinc-800 overflow-y-auto">
          <div className="p-3 space-y-4">
            <ControlPanel selectedImage={selectedImage} aspectRatio={aspectRatio} greenScreenEnabled={greenScreen}
              animationMode={animMode} activeParticles={activeParticles} onAspectRatioChange={setAspectRatio}
              onGreenScreenToggle={setGreenScreen} onAnimationModeChange={setAnimMode}
              onParticleToggle={toggleParticle} onUpdateImage={updateImage} />
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 z-50 text-white bg-zinc-800 hover:bg-zinc-700 rounded-full p-2 border border-zinc-700"><X className="w-5 h-5" /></button>
          <div onClick={e => e.stopPropagation()} style={{ width: isVertical ? '40vh' : '90vw', aspectRatio: `${ratio.width} / ${ratio.height}` }}>
            <PreviewArea isFullscreen />
          </div>
        </div>
      )}
    </div>
  );
}

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
  Film, Video, Play, Pause,
  ChevronDown, Monitor,
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
      resolve(imageElementCache[id]);
      return;
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

// ── Video Player Modal — properly centered ──
function VideoPlayer({ video, onClose }: { video: ProjectVideo; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url] = useState(() => URL.createObjectURL(video.blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play();
    setPlaying(!playing);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#18181b', border: '1px solid #3f3f46',
          borderRadius: '12px', overflow: 'hidden',
          width: '100%', maxWidth: '780px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
          margin: 'auto',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-red-400" />
            <span className="text-white text-sm font-bold truncate max-w-xs">{video.name}</span>
            <span className="text-zinc-500 text-xs">{formatDur(video.duration)} · {formatSize(video.size)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = url; a.download = video.name;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded border border-red-500 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="relative bg-black" style={{ lineHeight: 0 }}>
          <video
            ref={videoRef} src={url} onClick={togglePlay}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current?.duration)
                setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }}
            style={{ width: '100%', maxHeight: '65vh', display: 'block', cursor: 'pointer', background: '#000' }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
            <div
              className="w-full h-1.5 bg-zinc-700 rounded mb-2 cursor-pointer"
              onClick={e => {
                if (!videoRef.current) return;
                const r = e.currentTarget.getBoundingClientRect();
                videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * videoRef.current.duration;
              }}
            >
              <div className="h-full bg-red-500 rounded transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={togglePlay}
                className="w-8 h-8 bg-red-700 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <span className="text-white text-xs">{formatDur(video.duration)}</span>
              <span className="text-zinc-500 text-xs ml-auto">{formatSize(video.size)}</span>
            </div>
          </div>
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
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors">
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-800 cursor-pointer" onClick={() => { onOpen(p); onClose(); }}>
                    {p.thumbnail ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Skull className="w-5 h-5 text-zinc-600" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onOpen(p); onClose(); }}>
                    <p className="text-white text-xs font-bold truncate hover:text-red-300">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
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
                        <div className="flex items-center gap-2 p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-zinc-400 truncate">{v.name}</p>
                            <p className="text-[8px] text-zinc-600">{formatDur(v.duration)} · {formatSize(v.size)}</p>
                          </div>
                          <button onClick={() => setPlayingVideo(v)} className="flex items-center gap-1 px-1.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[8px] rounded"><Play className="w-2 h-2" /> Play</button>
                          <button onClick={() => {
                            const url = URL.createObjectURL(v.blob);
                            const a = document.createElement('a'); a.href = url; a.download = v.name;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                          }} className="flex items-center gap-1 px-1.5 py-1 bg-red-700 hover:bg-red-600 text-white text-[8px] rounded font-bold"><Download className="w-2 h-2" /> DL</button>
                          <button onClick={() => removeProjectVideo(p.id, v.id)} className="p-1 text-zinc-600 hover:text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
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
                <button onClick={() => setShowInput(true)} className="flex items-center gap-2 px-5 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 transition-all w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> New Project
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNew(); if (e.key === 'Escape') setShowInput(false); }}
                    placeholder="Project name..."
                    className="px-4 py-2.5 bg-zinc-800 border border-red-700/50 text-white text-sm outline-none focus:border-red-500 flex-1" />
                  <div className="flex gap-2">
                    <button onClick={handleNew} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold border border-red-500 transition-all">Create</button>
                    <button onClick={() => setShowInput(false)} className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm border border-zinc-700 transition-all">Cancel</button>
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
                                {p.status === 'finished' ? (
                                  <span className="flex items-center gap-1 text-[9px] text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded"><CheckCircle className="w-2.5 h-2.5" /> Finished</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[9px] text-yellow-500 border border-yellow-800/40 px-1.5 py-0.5 rounded"><Clock className="w-2.5 h-2.5" /> Draft</span>
                                )}
                                <span className="text-[9px] text-zinc-600">{new Date(p.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); deleteProject(p.id); refresh(); onDelete(p.id); }} className="text-zinc-700 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {videos.length > 0 && (
                          <div className="border-t border-zinc-800 px-4 py-2">
                            <button onClick={e => { e.stopPropagation(); setExpandedId(expandedId === p.id ? null : p.id); }} className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-red-400 w-full py-1">
                              <Film className="w-3 h-3" /><span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span><span className="ml-auto text-[8px]">{expandedId === p.id ? '▲' : '▼'}</span>
                            </button>
                            {expandedId === p.id && (
                              <div className="mt-2 space-y-2 pb-2">
                                {videos.map(v => (
                                  <div key={v.id} className="bg-zinc-800/60 rounded-lg border border-zinc-700/30 overflow-hidden">
                                    <div className="w-full h-20 bg-zinc-900 relative cursor-pointer" onClick={e => { e.stopPropagation(); setPlayingVideo(v); }}>
                                      {v.thumbnail && <img src={v.thumbnail} alt="" className="w-full h-full object-cover opacity-70" />}
                                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 bg-red-700/90 rounded-full flex items-center justify-center"><Play className="w-5 h-5 text-white ml-0.5" /></div></div>
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

// ─────────────────────────────────────────────
// MAIN STUDIO
// ─────────────────────────────────────────────
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

  // The preview container div ref — we measure its exact pixel size for recording
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

  // Live refs for recording loop (always latest state, no stale closures)
  const imagesRef = useRef<UploadedImage[]>([]);
  const slideshowIdxRef = useRef(0);
  const randomVisibleRef = useRef<string[]>([]);
  const animModeRef = useRef<AnimationMode>('single');
  const selectedIdRef = useRef<string | null>(null);
  const greenScreenRef = useRef(false);
  const frameCountRef = useRef(0);

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
    delete imageBlobStore[id];
    delete imageElementCache[id];
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

  // ══════════════════════════════════════════════════
  // CORE RECORDING ENGINE
  // Strategy:
  // 1. Measure the EXACT pixel rect of previewRef div on screen
  // 2. Create output canvas at the SELECTED RESOLUTION (e.g. 1080x1920 for TikTok)
  // 3. Draw images scaled/positioned to FILL that output canvas (cover mode)
  // 4. Apply real-time animations in canvas math
  // 5. Capture audio from Web Audio context if available
  // ══════════════════════════════════════════════════
  const startRecording = useCallback(async () => {
    // Get target resolution from selected aspect ratio
    const outWidth = ratio.width;
    const outHeight = ratio.height;

    // Pre-load all images
    const allImgs = imagesRef.current;
    await Promise.allSettled(
      allImgs.map(img => loadImageElement(img.id, imageBlobStore[img.id] || img.url))
    );

    // Create recording canvas at exact output resolution
    const recCanvas = document.createElement('canvas');
    recCanvas.width = outWidth;
    recCanvas.height = outHeight;
    const ctx = recCanvas.getContext('2d', { willReadFrequently: false })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── Audio: Try to capture from Web Audio API ──
    let audioStream: MediaStream | null = null;
    try {
      // Try to get system/mic audio
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      // No audio permission — record without audio (silent)
      audioStream = null;
    }

    // ── Video stream from canvas ──
    const videoStream = recCanvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...(audioStream ? audioStream.getAudioTracks() : []),
    ]);

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 12_000_000 });
    } catch {
      recorder = new MediaRecorder(combinedStream);
    }

    chunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    frameCountRef.current = 0;

    recorder.ondataavailable = e => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      cancelAnimationFrame(rafHandleRef.current);
      if (audioStream) audioStream.getTracks().forEach(t => t.stop());

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const durationSec = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);

      if (blob.size < 1000) {
        alert('Recording too short or failed. Please try again.');
        setRecording(false); setRecordingTime(0);
        return;
      }

      if (currentProject) {
        setSavingVideo(true);
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const videoName = `${currentProject.name}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${ext}`;

        let thumbnail = '';
        try {
          const tempUrl = URL.createObjectURL(blob);
          const vid = document.createElement('video');
          vid.src = tempUrl; vid.muted = true; vid.preload = 'metadata';
          await new Promise<void>(res => { vid.onloadeddata = () => res(); vid.onerror = () => res(); vid.load(); });
          vid.currentTime = Math.min(1, durationSec * 0.1);
          await new Promise<void>(res => { vid.onseeked = () => res(); setTimeout(res, 1500); });
          const tc = document.createElement('canvas');
          tc.width = 320; tc.height = Math.round(320 * outHeight / outWidth);
          tc.getContext('2d')!.drawImage(vid, 0, 0, tc.width, tc.height);
          thumbnail = tc.toDataURL('image/jpeg', 0.75);
          URL.revokeObjectURL(tempUrl);
        } catch {}

        const video: ProjectVideo = {
          id: generateId(), name: videoName, blob,
          size: blob.size, duration: durationSec, createdAt: Date.now(), thumbnail,
        };
        addProjectVideo(currentProject.id, video);
        setAutoSaveMsg(`✓ Video saved! ${outWidth}×${outHeight} · ${formatSize(blob.size)}`);
        setTimeout(() => setAutoSaveMsg(''), 8000);
        setSavingVideo(false);
        forceUpdate(n => n + 1);
      }

      setRecording(false); setRecordingTime(0);
    };

    // ── FRAME DRAWING LOOP ──
    // This draws the scene at the OUTPUT resolution (e.g. 1080x1920),
    // positioning images exactly as they appear in the preview,
    // scaled proportionally to fill the output canvas.
    const drawFrame = () => {
      const fc = ++frameCountRef.current;
      const imgs = imagesRef.current;
      const mode = animModeRef.current;
      const selId = selectedIdRef.current;
      const ssIdx = slideshowIdxRef.current;
      const randVis = randomVisibleRef.current;
      const gs = greenScreenRef.current;
      const t = fc / 30; // seconds elapsed at 30fps

      // Background
      ctx.fillStyle = gs ? '#00ff00' : '#0a0a0a';
      ctx.fillRect(0, 0, outWidth, outHeight);

      // Subtle grid (matches preview CSS grid)
      if (!gs) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= outWidth; x += outWidth / 10) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, outHeight); ctx.stroke(); }
        for (let y = 0; y <= outHeight; y += outHeight / 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(outWidth, y); ctx.stroke(); }
        ctx.restore();
      }

      // Which images to show this frame
      let drawList: UploadedImage[] = [];
      if (imgs.length > 0) {
        switch (mode) {
          case 'single': drawList = selId ? imgs.filter(i => i.id === selId) : imgs.slice(0, 1); break;
          case 'slideshow': drawList = [imgs[ssIdx % imgs.length]]; break;
          case 'all-visible': drawList = imgs; break;
          case 'random-appear': drawList = imgs.filter(i => randVis.includes(i.id)); break;
        }
      }

      // Draw each image with animations applied
      for (const img of drawList) {
        const el = imageElementCache[img.id];
        if (!el || !el.complete || el.naturalWidth === 0) continue;

        ctx.save();

        const anims = img.animations ?? (img.animation ? [img.animation] : []);

        // Position: percentage → absolute pixels in output canvas
        // img.position.x / 100 * outWidth = center X in output canvas
        const cx = (img.position.x / 100) * outWidth;
        const cy = (img.position.y / 100) * outHeight;

        // Scale: fit image within canvas, respecting user scale slider
        // Use "contain" logic relative to the output canvas
        const userScale = img.scale ?? 1;
        const naturalW = el.naturalWidth;
        const naturalH = el.naturalHeight;

        // Base: fit within 50% of the shorter canvas dimension
        const maxW = outWidth * 0.5;
        const maxH = outHeight * 0.5;
        const baseScale = Math.min(maxW / naturalW, maxH / naturalH);
        let drawScale = baseScale * userScale;

        // Animation modifiers
        let offX = 0, offY = 0, animAlpha = 1, animRot = 0;

        for (const anim of anims) {
          const a = anim.toLowerCase();
          if (a.includes('float') || a.includes('bob') || a.includes('hover')) {
            offY += Math.sin(t * 1.8) * (outHeight * 0.012);
          }
          if (a.includes('shake') || a.includes('tremor') || a.includes('quake')) {
            offX += (Math.random() - 0.5) * (outWidth * 0.01);
            offY += (Math.random() - 0.5) * (outHeight * 0.008);
          }
          if (a.includes('pulse') || a.includes('throb') || a.includes('breathe')) {
            drawScale *= 1 + Math.sin(t * Math.PI * 2) * 0.06;
          }
          if (a.includes('flicker') || a.includes('blink')) {
            animAlpha *= (Math.random() > 0.08 ? 1 : 0.15);
          }
          if (a.includes('glitch')) {
            offX += (Math.random() - 0.5) * (outWidth * 0.02);
            if (Math.random() < 0.05) animAlpha *= 0;
          }
          if (a.includes('spin') || a.includes('rotate')) {
            animRot += t * 0.8;
          }
          if (a.includes('sway') || a.includes('pendulum')) {
            animRot += Math.sin(t * 1.2) * 0.15;
          }
          if (a.includes('zoom') || a.includes('breathe')) {
            drawScale *= 1 + Math.sin(t * 0.7) * 0.08;
          }
          if (a.includes('drift')) {
            offX += Math.sin(t * 0.5) * (outWidth * 0.02);
          }
          if (a.includes('jitter')) {
            offX += (Math.random() - 0.5) * 6;
            offY += (Math.random() - 0.5) * 6;
          }
          if (a.includes('rise') || a.includes('ascend')) {
            offY -= (t * outHeight * 0.005) % outHeight;
          }
        }

        const userRotRad = ((img.rotation ?? 0) * Math.PI) / 180;
        const dw = naturalW * drawScale;
        const dh = naturalH * drawScale;

        ctx.translate(cx + offX, cy + offY);
        ctx.rotate(userRotRad + animRot);
        ctx.globalAlpha = (img.opacity ?? 1) * animAlpha;

        ctx.drawImage(el, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      // Vignette
      if (!gs) {
        ctx.save();
        const grad = ctx.createRadialGradient(outWidth / 2, outHeight / 2, Math.min(outWidth, outHeight) * 0.25, outWidth / 2, outHeight / 2, Math.max(outWidth, outHeight) * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.65)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, outWidth, outHeight);
        ctx.restore();
      }

      rafHandleRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
    recorder.start(250); // collect chunks every 250ms for smooth data
    mediaRecorderRef.current = recorder;
    setRecording(true); setRecordingTime(0);

    recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    autoStopTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
      cancelAnimationFrame(rafHandleRef.current);
    }, 5 * 60 * 1000);

  }, [currentProject, ratio]);

  const handleRecord = useCallback(() => {
    if (recording) {
      cancelAnimationFrame(rafHandleRef.current);
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      setRecording(false); setRecordingTime(0);
      return;
    }
    // Start immediately — no size selector needed, we always use the selected aspect ratio resolution
    startRecording();
  }, [recording, startRecording]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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
      id: generateId(), name, status: 'draft',
      createdAt: Date.now(), updatedAt: Date.now(),
      aspectRatio: '16:9-1080', greenScreen: false, animMode: 'single',
      activeParticles: [], activeSounds: [], masterVolume: 0.35, images: [],
    };
    saveProject(proj); setCurrentProject(proj);
    setImages([]); setSelectedId(null); setAspectRatio('16:9-1080');
    setGreenScreen(false); setAnimMode('single');
    setActiveParticles([]); setActiveSounds([]); setMasterVolume(0.35);
    setAllProjects(loadProjects()); setShowDashboard(false); setShowNewProjectModal(false);
  };

  const handleOpenProject = (proj: HorrorProject) => {
    setCurrentProject(proj); setAspectRatio(proj.aspectRatio);
    setGreenScreen(proj.greenScreen); setAnimMode(proj.animMode as AnimationMode);
    setActiveParticles(proj.activeParticles); setActiveSounds(proj.activeSounds);
    setMasterVolume(proj.masterVolume);
    const restored: UploadedImage[] = proj.images.map(img => {
      const url = imageBlobStore[img.id] || img.url;
      if (url) loadImageElement(img.id, url).catch(() => {});
      return { id: img.id, file: new File([], img.name), url, name: img.name, animation: img.animation, animations: img.animations ?? [], greenScreen: false, position: img.position, scale: img.scale, rotation: img.rotation, opacity: img.opacity };
    });
    setImages(restored);
    setSelectedId(restored.length > 0 ? restored[0].id : null);
    setShowDashboard(false);
  };

  const tagColor = (tag: string) =>
    tag === 'TikTok' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' :
    tag === 'Twitch' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
    tag === 'OBS' || tag === 'OBS 4K' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
    'bg-zinc-700/50 border-zinc-700 text-zinc-500';

  // ── Preview Canvas (CSS-rendered, matches recording layout) ──
  const PreviewArea = ({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    const sizeStyle = isFullscreen
      ? { width: isVertical ? '50vh' : '90vw', aspectRatio: `${ratio.width} / ${ratio.height}` }
      : { width: '100%', aspectRatio: `${ratio.width} / ${ratio.height}`, maxWidth: isVertical ? '280px' : '100%' };

    return (
      <div style={sizeStyle} className="relative overflow-hidden rounded-lg shadow-2xl shadow-black/80 border border-zinc-800">
        {/* Recording indicator overlay */}
        {recording && !isFullscreen && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-full border border-red-500/50">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-300 text-[9px] font-bold">REC {formatTime(recordingTime)}</span>
            <span className="text-zinc-500 text-[8px]">{ratio.width}×{ratio.height}</span>
          </div>
        )}
        <div
          ref={isFullscreen ? undefined : previewRef}
          className={`w-full h-full relative overflow-hidden ${greenScreen ? 'bg-[#00ff00]' : 'bg-zinc-950'}`}
        >
          {!greenScreen && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '10% 10%',
              }}
            />
          )}
          {previewImages.map(img => (
            <div
              key={img.id}
              className={`absolute ${getAnimClass(img)}`}
              style={{
                left: `${img.position.x}%`,
                top: `${img.position.y}%`,
                transform: `translate(-50%, -50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                opacity: img.opacity,
                zIndex: 5,
              }}
            >
              <img
                src={imageBlobStore[img.id] || img.url}
                alt={img.name}
                draggable={false}
                crossOrigin="anonymous"
                style={{
                  maxWidth: isFullscreen ? '450px' : '180px',
                  maxHeight: isFullscreen ? '450px' : '180px',
                  objectFit: 'contain',
                  display: 'block',
                }}
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
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }}
            />
          )}
        </div>
      </div>
    );
  };

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

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-red-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div ref={projectDropdownRef} className="relative">
            <button onClick={() => setShowProjectDropdown(p => !p)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-all">
              <div className="w-6 h-6 bg-red-700 rounded flex items-center justify-center flex-shrink-0">
                <Skull className="w-3.5 h-3.5 text-white" />
              </div>
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
          <button onClick={() => doAutoSave('draft')} className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] border border-zinc-700 transition-all">
            <Save className="w-3 h-3" /> Save Draft
          </button>
          <button onClick={() => doAutoSave('finished')} className="flex items-center gap-1 px-2.5 py-1 bg-green-900/40 hover:bg-green-800/40 text-green-400 text-[10px] border border-green-800/40 transition-all">
            <CheckCircle className="w-3 h-3" /> Finish
          </button>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1">
            <User className="w-3 h-3 text-red-400" />
            <span className="text-red-300">{username}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* LEFT PANEL */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-r border-zinc-800 overflow-hidden">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-3 mt-3 flex-shrink-0 rounded-lg border-2 border-dashed cursor-pointer transition-all p-3 flex flex-col items-center justify-center gap-1.5 ${dragover ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/20 hover:bg-zinc-800/40'}`}
          >
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
                    <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} className="text-zinc-700 hover:text-red-400 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
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
              <AnimationPanel
                selectedAnimations={selectedImage?.animations ?? (selectedImage?.animation ? [selectedImage.animation] : [])}
                onToggle={toggleAnimation} onClearAll={clearAllAnimations} disabled={!selectedId} />
            )}
            {activeTab === 'sounds' && (
              <SoundLibrary activeSounds={activeSounds} onToggleSound={toggleSound} masterVolume={masterVolume} onVolumeChange={setMasterVolume} />
            )}
            {activeTab === 'tts' && <TTSPanel />}
          </div>
        </div>

        {/* CENTER — Preview */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Preview</span>
              <span className="text-[10px] text-zinc-700 font-mono">{ratio.width}×{ratio.height}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${tagColor(ratio.tag)}`}>{ratio.tag}</span>
              {recording && (
                <span className="text-[9px] text-red-400 animate-pulse font-bold">● RECORDING → {ratio.width}×{ratio.height}</span>
              )}
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
              {/* RECORD BUTTON — shows current resolution */}
              <button
                onClick={handleRecord}
                disabled={savingVideo}
                title={recording ? 'Stop recording' : `Record at ${ratio.width}×${ratio.height} (${ratio.tag})`}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  recording
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : savingVideo
                    ? 'bg-zinc-700 text-zinc-500 border-zinc-600 cursor-wait'
                    : 'bg-zinc-800 hover:bg-red-900/20 text-zinc-300 border-zinc-700 hover:border-red-800'
                }`}
              >
                <CircleDot className={`w-3 h-3 ${recording ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
                {savingVideo ? 'Saving…' : recording ? `Stop ${formatTime(recordingTime)}` : `Record ${ratio.width}×${ratio.height}`}
              </button>
              <button onClick={() => setFullscreen(true)} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="flex items-center justify-center w-full h-full">
              <PreviewArea />
            </div>
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

        {/* RIGHT PANEL */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-l border-zinc-800 overflow-y-auto">
          <div className="p-3 space-y-4">
            <ControlPanel
              selectedImage={selectedImage} aspectRatio={aspectRatio}
              greenScreenEnabled={greenScreen} animationMode={animMode}
              activeParticles={activeParticles} onAspectRatioChange={setAspectRatio}
              onGreenScreenToggle={setGreenScreen} onAnimationModeChange={setAnimMode}
              onParticleToggle={toggleParticle} onUpdateImage={updateImage} />
          </div>
        </div>
      </div>

      {/* Fullscreen */}
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

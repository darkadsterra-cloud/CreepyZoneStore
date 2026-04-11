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
} from 'lucide-react';

let imageCounter = 0;

// ── Project Dashboard ──
function ProjectDashboard({
  username,
  onNew,
  onOpen,
  onDelete,
}: {
  username: string;
  onNew: (name: string) => void;
  onOpen: (p: HorrorProject) => void;
  onDelete: (id: string) => void;
}) {
  const [projects, setProjects] = useState<HorrorProject[]>([]);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => { setProjects(loadProjects()); }, []);

  const handleNew = () => {
    const name = newName.trim() || `Project ${Date.now()}`;
    onNew(name);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject(id);
    setProjects(loadProjects());
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <AppBackground />
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-red-900/30 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/60">
              <Skull className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white" style={{ fontFamily: 'Georgia, serif' }}>
                Horror Animation Studio
              </h1>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Project Library</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <User className="w-4 h-4 text-red-400" />
            <span className="text-red-300 font-semibold">{username}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {/* New Project */}
            <div className="mb-8">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 transition-all"
                >
                  <Plus className="w-4 h-4" /> New Project
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNew(); if (e.key === 'Escape') setShowInput(false); }}
                    placeholder="Project name..."
                    className="px-4 py-2.5 bg-zinc-800 border border-red-700/50 text-white text-sm outline-none focus:border-red-500 w-64"
                  />
                  <button onClick={handleNew}
                    className="px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold border border-red-500 transition-all">
                    Create
                  </button>
                  <button onClick={() => setShowInput(false)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm border border-zinc-700 transition-all">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
              <div className="text-center py-20">
                <FolderOpen className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-600 text-sm">No projects yet. Create your first horror project!</p>
              </div>
            ) : (
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Your Projects ({projects.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(p => (
                    <div key={p.id} onClick={() => onOpen(p)}
                      className="border border-zinc-800 bg-zinc-900/50 hover:border-red-700/50 transition-all cursor-pointer group p-4 relative"
                    >
                      {/* Thumbnail */}
                      {p.thumbnail ? (
                        <div className="w-full h-32 overflow-hidden mb-3 bg-zinc-800">
                          <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-zinc-800/50 flex items-center justify-center mb-3 border border-zinc-700/30">
                          <Skull className="w-10 h-10 text-zinc-700" />
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-sm truncate group-hover:text-red-300 transition-colors">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {p.status === 'finished' ? (
                              <span className="flex items-center gap-1 text-[9px] text-green-400 border border-green-800/40 px-1.5 py-0.5 rounded">
                                <CheckCircle className="w-2.5 h-2.5" /> Finished
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] text-yellow-500 border border-yellow-800/40 px-1.5 py-0.5 rounded">
                                <Clock className="w-2.5 h-2.5" /> Draft
                              </span>
                            )}
                            <span className="text-[9px] text-zinc-600">
                              {new Date(p.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-1">{p.images.length} image{p.images.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button
                          onClick={e => handleDelete(p.id, e)}
                          className="text-zinc-700 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Studio ──
export default function HorrorStudio() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [currentProject, setCurrentProject] = useState<HorrorProject | null>(null);
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

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const rafId = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideshowInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const randomInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];
  const selectedImage = images.find(img => img.id === selectedId) || null;

  // ── Auto Save ──
  const doAutoSave = useCallback((status?: 'draft' | 'finished') => {
    if (!currentProject) return;
    const updated: HorrorProject = {
      ...currentProject,
      updatedAt: Date.now(),
      status: status ?? currentProject.status,
      aspectRatio,
      greenScreen,
      animMode,
      activeParticles,
      activeSounds,
      masterVolume,
      images: images.map(img => ({
        id: img.id,
        url: img.url,
        name: img.name,
        animation: img.animation,
        animations: img.animations ?? [],
        position: img.position,
        scale: img.scale,
        rotation: img.rotation,
        opacity: img.opacity,
      })),
    };
    saveProject(updated);
    setCurrentProject(updated);
    setAutoSaveMsg('Auto-saved ✓');
    setTimeout(() => setAutoSaveMsg(''), 2000);
  }, [currentProject, aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume, images]);

  // Trigger auto-save on changes
  useEffect(() => {
    if (!currentProject) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => doAutoSave(), 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [images, aspectRatio, greenScreen, animMode, activeParticles, activeSounds, masterVolume]);

  // ── Slideshow ──
  useEffect(() => {
    if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    if (animMode === 'slideshow' && images.length > 1) {
      slideshowInterval.current = setInterval(() => setSlideshowIdx(i => (i + 1) % images.length), 2500);
    }
    return () => { if (slideshowInterval.current) clearInterval(slideshowInterval.current); };
  }, [animMode, images.length]);

  // ── Random ──
  useEffect(() => {
    if (randomInterval.current) clearInterval(randomInterval.current);
    if (animMode === 'random-appear' && images.length > 0) {
      randomInterval.current = setInterval(() => {
        const img = images[Math.floor(Math.random() * images.length)];
        setRandomVisible(v => v.includes(img.id) ? v.filter(x => x !== img.id) : [...v, img.id]);
      }, 800);
    }
    return () => { if (randomInterval.current) clearInterval(randomInterval.current); };
  }, [animMode, images]);

  const getPreviewImages = (): UploadedImage[] => {
    if (images.length === 0) return [];
    switch (animMode) {
      case 'single':        return selectedImage ? [selectedImage] : images.slice(0, 1);
      case 'slideshow':     return [images[slideshowIdx % images.length]];
      case 'all-visible':   return images;
      case 'random-appear': return images.filter(img => randomVisible.includes(img.id));
    }
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const id = `img-${++imageCounter}`;
      newImages.push({
        id, file, url, name: file.name,
        animation: null, animations: [],
        greenScreen: false,
        position: { x: 50, y: 50 },
        scale: 1, rotation: 0, opacity: 1,
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

  const updateImage = (id: string, updates: Partial<UploadedImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const removeImage = (id: string) => {
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

  const clearAllAnimations = () => {
    if (selectedId) updateImage(selectedId, { animations: [], animation: null });
  };

  const toggleSound = (id: string) => setActiveSounds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleParticle = (id: string) => setActiveParticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDownload = () => {
    if (!previewRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(previewRef.current!, { useCORS: true, allowTaint: true, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${currentProject?.name ?? 'horror-overlay'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  };

  // ── Recording — proper canvas capture ──
  const handleRecord = () => {
    if (recording) {
      mediaRecorder.current?.stop();
      setRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      return;
    }
    if (!previewRef.current) return;

    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    import('html2canvas').then(({ default: html2canvas }) => {
      const recCanvas = document.createElement('canvas');
      recCanvas.width = ratio.width;
      recCanvas.height = ratio.height;
      const ctx = recCanvas.getContext('2d')!;

      const stream = recCanvas.captureStream(30);

      // Try MP4 first, fallback to WebM
      const mimeTypes = [
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000, // 8Mbps — high quality
      });

      chunks.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };

      recorder.onstop = () => {
        cancelAnimationFrame(rafId.current);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const blob = new Blob(chunks.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentProject?.name ?? 'horror-overlay'}-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setRecordingTime(0);
      };

      // Draw frames
      const drawFrame = () => {
        if (!previewRef.current) return;
        html2canvas(previewRef.current, {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          width: previewRef.current.offsetWidth,
          height: previewRef.current.offsetHeight,
          backgroundColor: greenScreen ? '#00ff00' : '#000000',
          logging: false,
        }).then(frameCanvas => {
          ctx.clearRect(0, 0, recCanvas.width, recCanvas.height);
          ctx.drawImage(frameCanvas, 0, 0, recCanvas.width, recCanvas.height);
        }).catch(() => {});
        rafId.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
      recorder.start(200); // Collect data every 200ms — ensures data flows
      mediaRecorder.current = recorder;
      setRecording(true);

      // 5 minute max
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setRecording(false);
        }
      }, 5 * 60 * 1000);
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const previewImages = getPreviewImages();
  const isVertical = ratio.height > ratio.width;

  const getAnimClass = (img: UploadedImage) => {
    const anims = img.animations ?? (img.animation ? [img.animation] : []);
    return anims.map(a => `ha-${a}`).join(' ');
  };

  const selectedIdx = images.findIndex(img => img.id === selectedId);
  const goLeft  = () => selectedIdx > 0 && setSelectedId(images[selectedIdx - 1].id);
  const goRight = () => selectedIdx < images.length - 1 && setSelectedId(images[selectedIdx + 1].id);

  // ── Dashboard handlers ──
  const handleNewProject = (name: string) => {
    const proj: HorrorProject = {
      id: generateId(),
      name,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      aspectRatio: '16:9-1080',
      greenScreen: false,
      animMode: 'single',
      activeParticles: [],
      activeSounds: [],
      masterVolume: 0.35,
      images: [],
    };
    saveProject(proj);
    setCurrentProject(proj);
    setImages([]);
    setSelectedId(null);
    setAspectRatio('16:9-1080');
    setGreenScreen(false);
    setAnimMode('single');
    setActiveParticles([]);
    setActiveSounds([]);
    setMasterVolume(0.35);
    setShowDashboard(false);
  };

  const handleOpenProject = (proj: HorrorProject) => {
    setCurrentProject(proj);
    setAspectRatio(proj.aspectRatio);
    setGreenScreen(proj.greenScreen);
    setAnimMode(proj.animMode as AnimationMode);
    setActiveParticles(proj.activeParticles);
    setActiveSounds(proj.activeSounds);
    setMasterVolume(proj.masterVolume);
    // Restore images (URL-based only — file object not stored)
    const restored: UploadedImage[] = proj.images.map(img => ({
      id: img.id,
      file: new File([], img.name),
      url: img.url,
      name: img.name,
      animation: img.animation,
      animations: img.animations ?? [],
      greenScreen: false,
      position: img.position,
      scale: img.scale,
      rotation: img.rotation,
      opacity: img.opacity,
    }));
    setImages(restored);
    setSelectedId(restored.length > 0 ? restored[0].id : null);
    setShowDashboard(false);
  };

  const PreviewCanvas = ({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    const size = isFullscreen
      ? { width: isVertical ? '40vh' : '100vw', aspectRatio: `${ratio.width} / ${ratio.height}` }
      : { width: '100%', aspectRatio: `${ratio.width} / ${ratio.height}`, maxWidth: isVertical ? '280px' : '100%' };
    return (
      <div style={size} className="relative overflow-hidden rounded-lg shadow-2xl shadow-black/80 border border-zinc-800">
        <div
          ref={isFullscreen ? undefined : previewRef}
          className={`w-full h-full relative overflow-hidden ${greenScreen ? 'bg-[#00ff00]' : 'bg-zinc-950'}`}
        >
          {!greenScreen && (
            <div className="absolute inset-0 pointer-events-none opacity-30"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '10% 10%' }}
            />
          )}
          {previewImages.map(img => (
            <div key={img.id} className={`absolute ${getAnimClass(img)}`}
              style={{ left: `${img.position.x}%`, top: `${img.position.y}%`, transform: `translate(-50%, -50%) scale(${img.scale}) rotate(${img.rotation}deg)`, opacity: img.opacity, zIndex: 5 }}
            >
              <img src={img.url} alt={img.name} draggable={false}
                style={{ maxWidth: isFullscreen ? '400px' : '200px', maxHeight: isFullscreen ? '400px' : '200px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          ))}
          {previewImages.length === 0 && !isFullscreen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-10 h-10 text-zinc-800" />
              <p className="text-xs text-zinc-700">Upload images to start</p>
            </div>
          )}
          <ParticleOverlay effects={activeParticles} width={ratio.width} height={ratio.height} />
          {!greenScreen && (
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }}
            />
          )}
        </div>
      </div>
    );
  };

  const tagColor = (tag: string) =>
    tag === 'TikTok' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' :
    tag === 'Twitch' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
    tag === 'OBS' || tag === 'OBS 4K' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
    'bg-zinc-700/50 border-zinc-700 text-zinc-500';

  // ── Dashboard ──
  if (showDashboard) {
    return (
      <ProjectDashboard
        username={username}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onDelete={id => { deleteProject(id); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <AppBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-red-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDashboard(true)}
            className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/60 hover:bg-red-600 transition-colors">
            <Skull className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-wider horror-glow-text" style={{ fontFamily: 'Georgia, serif' }}>
              {currentProject?.name ?? 'Horror Animation Studio'}
            </h1>
            <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
              {currentProject?.status === 'finished' ? '✓ Finished' : '● Draft'}
              {autoSaveMsg && <span className="ml-2 text-green-500">{autoSaveMsg}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600 mr-2">
            <span className="text-red-500/60">{images.length}</span> images ·
            <span className="text-red-500/60 ml-1">{activeSounds.length}</span> sounds ·
            <span className="text-red-500/60 ml-1">{activeParticles.length}</span> particles
          </div>
          <button onClick={() => doAutoSave('draft')}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] border border-zinc-700 transition-all">
            <Save className="w-3 h-3" /> Save Draft
          </button>
          <button onClick={() => doAutoSave('finished')}
            className="flex items-center gap-1 px-2.5 py-1 bg-green-900/40 hover:bg-green-800/40 text-green-400 text-[10px] border border-green-800/40 transition-all">
            <CheckCircle className="w-3 h-3" /> Finish
          </button>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1">
            <User className="w-3 h-3 text-red-400" />
            <span className="text-red-300">{username}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* LEFT */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-r border-zinc-800 overflow-hidden">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`mx-3 mt-3 flex-shrink-0 rounded-lg border-2 border-dashed cursor-pointer transition-all p-3 flex flex-col items-center justify-center gap-1.5 ${dragover ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/20 hover:bg-zinc-800/40'}`}
          >
            <Upload className={`w-5 h-5 ${dragover ? 'text-red-400' : 'text-zinc-600'}`} />
            <p className={`text-[10px] font-medium ${dragover ? 'text-red-300' : 'text-zinc-500'}`}>Drop images or click to upload</p>
            <p className="text-[9px] text-zinc-700">PNG · JPG · WebP · bulk supported</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={e => handleFiles(e.target.files)} className="hidden" />
          </div>

          {images.length > 0 && (
            <div className="mx-3 my-2 space-y-1 overflow-y-auto flex-shrink-0" style={{ maxHeight: '130px' }}>
              {images.map(img => {
                const activeAnims = img.animations ?? (img.animation ? [img.animation] : []);
                return (
                  <div key={img.id} onClick={() => setSelectedId(img.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border transition-all ${selectedId === img.id ? 'bg-red-500/15 border-red-500/40' : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800/60'}`}
                  >
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-300 truncate">{img.name}</p>
                      {activeAnims.length > 0 && (
                        <p className="text-[9px] text-red-400">{activeAnims.length} anim{activeAnims.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} className="text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0">
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
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-red-400 border-b-2 border-red-500 bg-red-900/10' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {tab === 'tts' ? 'TTS' : tab === 'animations' ? 'Anim' : 'Sound'}
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
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 flex-shrink-0 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Preview</span>
              <span className="text-[10px] text-zinc-700 font-mono">{ratio.width}×{ratio.height}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${tagColor(ratio.tag)}`}>{ratio.tag}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors border border-zinc-700">
                <Download className="w-3 h-3" /> PNG
              </button>
              <button onClick={handleRecord}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${recording ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-zinc-800 hover:bg-red-900/20 text-zinc-300 border-zinc-700 hover:border-red-800'}`}
              >
                <CircleDot className={`w-3 h-3 ${recording ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
                {recording ? `Stop ${formatTime(recordingTime)}` : 'Record'}
              </button>
              <button onClick={() => setFullscreen(true)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors border border-zinc-700">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="flex items-center justify-center w-full h-full">
              <PreviewCanvas />
            </div>
          </div>

          {images.length > 1 && animMode === 'single' && (
            <div className="flex items-center justify-center gap-2 py-2 border-t border-zinc-800 flex-shrink-0 bg-zinc-900/30">
              <button onClick={goLeft} disabled={selectedIdx === 0}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1 items-center">
                {images.map(img => (
                  <button key={img.id} onClick={() => setSelectedId(img.id)}
                    className={`rounded-full transition-all ${selectedId === img.id ? 'bg-red-500 w-4 h-1.5' : 'bg-zinc-700 hover:bg-zinc-600 w-1.5 h-1.5'}`}
                  />
                ))}
              </div>
              <button onClick={goRight} disabled={selectedIdx === images.length - 1}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT */}
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

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-50 text-white bg-zinc-800 hover:bg-zinc-700 rounded-full p-2 border border-zinc-700">
            <X className="w-5 h-5" />
          </button>
          <div onClick={e => e.stopPropagation()} style={{ width: isVertical ? '40vh' : '90vw', aspectRatio: `${ratio.width} / ${ratio.height}` }}
            className="relative overflow-hidden rounded-xl shadow-2xl border border-zinc-700"
          >
            <div className={`w-full h-full relative overflow-hidden ${greenScreen ? 'bg-[#00ff00]' : 'bg-zinc-950'}`}>
              {previewImages.map(img => (
                <div key={img.id} className={`absolute ${getAnimClass(img)}`}
                  style={{ left: `${img.position.x}%`, top: `${img.position.y}%`, transform: `translate(-50%,-50%) scale(${img.scale}) rotate(${img.rotation}deg)`, opacity: img.opacity, zIndex: 5 }}
                >
                  <img src={img.url} alt="" draggable={false} style={{ maxWidth: '500px', maxHeight: '500px', objectFit: 'contain' }} />
                </div>
              ))}
              <ParticleOverlay effects={activeParticles} width={ratio.width} height={ratio.height} />
              {!greenScreen && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

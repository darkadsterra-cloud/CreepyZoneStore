import { useState, useRef, useCallback, useEffect } from 'react';
import { ANIMATION_PRESETS, ASPECT_RATIOS } from '@/lib/animations';
import type { UploadedImage, AnimationMode } from '@/lib/animations';
import AppBackground from '@/components/AppBackground';
import AnimationPanel from '@/components/AnimationPanel';
import SoundLibrary from '@/components/SoundLibrary';
import ControlPanel from '@/components/ControlPanel';
import ParticleOverlay from '@/components/ParticleOverlay';
import TTSPanel from '@/components/TTSPanel';
import {
  Upload, ImageIcon, Download, CircleDot,
  ChevronLeft, ChevronRight, Maximize2, Skull, X,
} from 'lucide-react';

let imageCounter = 0;

export default function HorrorStudio() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9-1080');
  const [greenScreen, setGreenScreen] = useState(false);
  const [animMode, setAnimMode] = useState<AnimationMode>('single');
  const [activeParticles, setActiveParticles] = useState<string[]>([]);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [masterVolume, setMasterVolume] = useState(0.35);
  const [recording, setRecording] = useState(false);
  const [slideshowIdx, setSlideshowIdx] = useState(0);
  const [randomVisible, setRandomVisible] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'animations' | 'sounds' | 'tts'>('animations');
  const [dragover, setDragover] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const slideshowInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const randomInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];
  const selectedImage = images.find(img => img.id === selectedId) || null;

  // Slideshow
  useEffect(() => {
    if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    if (animMode === 'slideshow' && images.length > 1) {
      slideshowInterval.current = setInterval(() => {
        setSlideshowIdx(i => (i + 1) % images.length);
      }, 2500);
    }
    return () => { if (slideshowInterval.current) clearInterval(slideshowInterval.current); };
  }, [animMode, images.length]);

  // Random appear
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
      case 'single':       return selectedImage ? [selectedImage] : images.slice(0, 1);
      case 'slideshow':    return [images[slideshowIdx % images.length]];
      case 'all-visible':  return images;
      case 'random-appear':return images.filter(img => randomVisible.includes(img.id));
    }
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const id = `img-${++imageCounter}`;
      newImages.push({ id, file, url, name: file.name, animation: null, greenScreen: false, position: { x: 50, y: 50 }, scale: 1, rotation: 0, opacity: 1 });
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

  const setAnimation = (animId: string | null) => {
    if (!selectedId) return;
    updateImage(selectedId, { animation: animId });
  };

  const toggleSound  = (id: string) => setActiveSounds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleParticle = (id: string) => setActiveParticles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDownload = () => {
    if (!previewRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(previewRef.current!, { useCORS: true, allowTaint: true, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'horror-overlay.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  };

  const handleRecord = () => {
    if (recording) { mediaRecorder.current?.stop(); setRecording(false); return; }
    const canvas = document.createElement('canvas');
    canvas.width = ratio.width; canvas.height = ratio.height;
    const stream = canvas.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    chunks.current = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'horror-overlay.webm'; link.click();
      URL.revokeObjectURL(url);
    };
    recorder.start(); mediaRecorder.current = recorder; setRecording(true);
    setTimeout(() => { if (recorder.state === 'recording') { recorder.stop(); setRecording(false); } }, 15000);
  };

  const previewImages = getPreviewImages();
  const isVertical = ratio.height > ratio.width;

  const getAnimClass = (img: UploadedImage) => img.animation ? `ha-${img.animation}` : '';

  const selectedIdx = images.findIndex(img => img.id === selectedId);
  const goLeft  = () => selectedIdx > 0 && setSelectedId(images[selectedIdx - 1].id);
  const goRight = () => selectedIdx < images.length - 1 && setSelectedId(images[selectedIdx + 1].id);

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
              <p className="text-[10px] text-zinc-800">They will appear here with animations</p>
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

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      <AppBackground />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-red-900/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/60">
            <Skull className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider horror-glow-text" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>
              Horror Animation Studio
            </h1>
            <p className="text-[9px] text-zinc-600 tracking-widest uppercase">Livestream Overlay Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1 text-zinc-600">
            <span className="text-red-500/60">{images.length}</span> images
            <span className="mx-1">·</span>
            <span className="text-red-500/60">{activeSounds.length}</span> sounds
            <span className="mx-1">·</span>
            <span className="text-red-500/60">{activeParticles.length}</span> particles
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ─── LEFT ─── */}
        <div className="w-[220px] flex-shrink-0 flex flex-col bg-zinc-900/80 border-r border-zinc-800 overflow-hidden">
          {/* Upload */}
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

          {/* Gallery */}
          {images.length > 0 && (
            <div className="mx-3 my-2 space-y-1 overflow-y-auto flex-shrink-0" style={{ maxHeight: '130px' }}>
              {images.map(img => (
                <div key={img.id} onClick={() => setSelectedId(img.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border transition-all ${selectedId === img.id ? 'bg-red-500/15 border-red-500/40' : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800/60'}`}
                >
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-300 truncate">{img.name}</p>
                    {img.animation && <p className="text-[9px] text-red-400 truncate">{ANIMATION_PRESETS.find(p => p.id === img.animation)?.name}</p>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeImage(img.id); }} className="text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
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
              <AnimationPanel selectedAnimation={selectedImage?.animation || null} onSelect={setAnimation} disabled={!selectedId} />
            )}
            {activeTab === 'sounds' && (
              <SoundLibrary activeSounds={activeSounds} onToggleSound={toggleSound} masterVolume={masterVolume} onVolumeChange={setMasterVolume} />
            )}
            {activeTab === 'tts' && <TTSPanel />}
          </div>
        </div>

        {/* ─── CENTER ─── */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-0">
          {/* Toolbar */}
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
                {recording ? 'Stop (15s)' : 'Record'}
              </button>
              <button onClick={() => setFullscreen(true)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors border border-zinc-700">
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="flex items-center justify-center w-full h-full">
              <PreviewCanvas />
            </div>
          </div>

          {/* Multi-image nav */}
          {images.length > 1 && animMode === 'single' && (
            <div className="flex items-center justify-center gap-2 py-2 border-t border-zinc-800 flex-shrink-0 bg-zinc-900/30">
              <button onClick={goLeft} disabled={selectedIdx === 0}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1 items-center">
                {images.map((img, i) => (
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

        {/* ─── RIGHT ─── */}
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

      {/* Fullscreen modal */}
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

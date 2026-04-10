import { useRef, useEffect, useState, useCallback } from 'react';
import { ANIMATION_PRESETS, ASPECT_RATIOS, type UploadedImage } from '@/lib/animations';
import { Download, Video, Square, Maximize2 } from 'lucide-react';

interface PreviewCanvasProps {
  images: UploadedImage[];
  selectedImageId: string | null;
  aspectRatio: string;
  greenScreenEnabled: boolean;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSelectImage: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
}

export default function PreviewCanvas({
  images,
  selectedImageId,
  aspectRatio,
  greenScreenEnabled,
  isRecording,
  onStartRecording,
  onStopRecording,
  onSelectImage,
  onUpdateImage,
}: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[0];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownloadFrame = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: greenScreenEnabled ? '#00ff00' : '#000000',
        scale: 2,
        useCORS: true,
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      });
      
      const link = document.createElement('a');
      link.download = `horror-overlay-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = ratio.width;
      canvas.height = ratio.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = greenScreenEnabled ? '#00ff00' : '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Horror Overlay', canvas.width / 2, canvas.height / 2);
      
      const link = document.createElement('a');
      link.download = `horror-overlay-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, [greenScreenEnabled, ratio]);

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-zinc-200">Preview</h2>
          <span className="text-xs text-zinc-500">{ratio.width}x{ratio.height}</span>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadFrame}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Download current frame as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Record
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition-colors animate-pulse"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-zinc-950/50 overflow-hidden">
        <div
          ref={canvasRef}
          className={`relative overflow-hidden rounded-lg shadow-2xl ${greenScreenEnabled ? 'green-screen-bg' : 'bg-black'}`}
          style={{
            aspectRatio: `${ratio.width}/${ratio.height}`,
            maxWidth: '100%',
            maxHeight: '100%',
            width: isFullscreen ? '100vw' : 'auto',
            height: isFullscreen ? '100vh' : '100%',
          }}
        >
          {images.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-zinc-600 text-sm">Upload images to start</p>
                <p className="text-zinc-700 text-xs mt-1">They will appear here with animations</p>
              </div>
            </div>
          )}

          {images.map(img => {
            const anim = ANIMATION_PRESETS.find(a => a.id === img.animation);
            const isSelected = img.id === selectedImageId;
            return (
              <div
                key={img.id}
                onClick={(e) => { e.stopPropagation(); onSelectImage(img.id); }}
                className={`absolute cursor-move transition-shadow ${anim ? anim.className : ''} ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/50' : ''}`}
                style={{
                  left: `${img.position.x}%`,
                  top: `${img.position.y}%`,
                  transform: `translate(-50%, -50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                  opacity: img.opacity,
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="max-w-[300px] max-h-[300px] object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            );
          })}

          {greenScreenEnabled && (
            <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1">
              <span className="text-[10px] text-green-400 font-mono">GREEN SCREEN</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

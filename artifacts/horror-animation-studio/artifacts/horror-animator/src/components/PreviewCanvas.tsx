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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
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

  // ✅ HIGH QUALITY PNG download — html2canvas ke sath scale:3
  const handleDownloadFrame = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: greenScreenEnabled ? '#00ff00' : '#000000',
        scale: 3,           // ✅ scale 2 se 3 kar diya — sharper output
        useCORS: true,
        allowTaint: true,   // ✅ cross-origin images bhi capture hogi
        logging: false,
        width: canvasRef.current.offsetWidth,
        height: canvasRef.current.offsetHeight,
      });

      const link = document.createElement('a');
      link.download = `horror-overlay-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);  // ✅ max quality
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [greenScreenEnabled]);

  // ✅ REAL VIDEO RECORDING — CSS animations bhi capture hongi
  const handleStartRecording = useCallback(async () => {
    if (!canvasRef.current) return;

    recordedChunksRef.current = [];

    // html2canvas se frame-by-frame render kar ke canvas mein daalo
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = ratio.width;
    offscreenCanvas.height = ratio.height;
    const ctx = offscreenCanvas.getContext('2d')!;

    const { default: html2canvas } = await import('html2canvas');

    // Stream canvas se lena
    const stream = offscreenCanvas.captureStream(30); // 30fps

    // ✅ High quality MediaRecorder settings
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,  // ✅ 8 Mbps — high quality
    });

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `horror-animation-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start(100); // ✅ har 100ms mein chunk save karo
    onStartRecording();

    // ✅ Frame loop — CSS animations ko canvas mein capture karo
    let animFrameId: number;
    const renderFrame = async () => {
      if (!canvasRef.current) return;
      try {
        const snapshot = await html2canvas(canvasRef.current, {
          backgroundColor: greenScreenEnabled ? '#00ff00' : '#000000',
          scale: ratio.width / canvasRef.current.offsetWidth,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.drawImage(snapshot, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      } catch { /* frame skip */ }
      animFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    // Recorder stop hone par frame loop bhi band karo
    const originalStop = recorder.stop.bind(recorder);
    recorder.stop = () => {
      cancelAnimationFrame(animFrameId);
      originalStop();
    };
  }, [ratio, greenScreenEnabled, onStartRecording]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    onStopRecording();
  }, [onStopRecording]);

  // ✅ Multiple animations support — animations array se saari classes lagao
  const getAnimationClasses = (img: UploadedImage): string => {
    const allAnimIds = [
      ...(img.animations || []),
      ...(img.animation ? [img.animation] : []),   // backward compat
    ];
    const unique = [...new Set(allAnimIds)];
    return unique
      .map(id => ANIMATION_PRESETS.find(a => a.id === id)?.animationCSS ?? '')
      .filter(Boolean)
      .join(', ');
  };

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
              onClick={handleStartRecording}   // ✅ naya handler
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Record {ratio.width}×{ratio.height}
            </button>
          ) : (
            <button
              onClick={handleStopRecording}    // ✅ naya handler
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition-colors animate-pulse"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop & Save
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
            const isSelected = img.id === selectedImageId;
            // ✅ Multiple animations — inline style mein combine karo
            const combinedAnimation = getAnimationClasses(img);

            return (
              <div
                key={img.id}
                onClick={(e) => { e.stopPropagation(); onSelectImage(img.id); }}
                className={`absolute cursor-move ${isSelected ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black/50' : ''}`}
                style={{
                  left: `${img.position.x}%`,
                  top: `${img.position.y}%`,
                  transform: `translate(-50%, -50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                  opacity: img.opacity,
                  zIndex: isSelected ? 10 : 1,
                  animation: combinedAnimation || undefined,  // ✅ multiple animations yahan
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

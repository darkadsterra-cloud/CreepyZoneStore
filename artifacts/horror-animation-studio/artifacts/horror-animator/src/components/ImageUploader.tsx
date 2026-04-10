import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus, X } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (files: FileList | File[]) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) onUpload(imageFiles);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  }, [onUpload]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative cursor-pointer border-2 border-dashed rounded-lg p-6 transition-all duration-300
        flex flex-col items-center justify-center gap-3 min-h-[140px]
        ${isDragging
          ? 'border-red-500 bg-red-500/10 scale-[1.02]'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-red-500/50 hover:bg-zinc-900/80'
        }
      `}
    >
      {isDragging ? (
        <>
          <Upload className="w-10 h-10 text-red-500 animate-bounce" />
          <p className="text-red-400 font-semibold text-sm">Drop images here...</p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ImagePlus className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 text-sm font-medium">Drop images or click to upload</p>
            <p className="text-zinc-500 text-xs mt-1">Supports bulk upload - PNG, JPG, WebP</p>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

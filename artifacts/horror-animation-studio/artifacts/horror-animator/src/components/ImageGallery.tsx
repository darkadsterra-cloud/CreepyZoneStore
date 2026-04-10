import { X, Check } from 'lucide-react';
import type { UploadedImage } from '@/lib/animations';

interface ImageGalleryProps {
  images: UploadedImage[];
  selectedImageId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function ImageGallery({ images, selectedImageId, onSelect, onRemove }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Uploaded Images ({images.length})
      </h3>
      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {images.map(img => (
          <div
            key={img.id}
            onClick={() => onSelect(img.id)}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden aspect-video
              border-2 transition-all duration-200
              ${selectedImageId === img.id
                ? 'border-red-500 ring-1 ring-red-500/30'
                : 'border-zinc-700 hover:border-zinc-500'
              }
            `}
          >
            <img
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover"
            />
            {img.animation && (
              <div className="absolute top-1 left-1 bg-red-500/80 rounded px-1 py-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
              <p className="text-[10px] text-zinc-300 truncate">{img.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

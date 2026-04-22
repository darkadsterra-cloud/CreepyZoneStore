import { useState, useCallback } from 'react';
import type { UploadedImage } from '@/lib/animations';

export function useHorrorStore() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('16:9-1080');
  const [greenScreenEnabled, setGreenScreenEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeSounds, setActiveSounds] = useState<string[]>([]);
  const [masterVolume, setMasterVolume] = useState(0.3);

  const addImages = useCallback((files: FileList | File[]) => {
    const newImages: UploadedImage[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      animation: null,
      animations: [],       // ✅ FIX: Required array — multiple animations support
      greenScreen: false,
      position: { x: 50, y: 50 },
      scale: 1,
      rotation: 0,
      opacity: 1,
    }));
    setImages(prev => [...prev, ...newImages]);
    if (newImages.length > 0 && !selectedImageId) {
      setSelectedImageId(newImages[0].id);
    }
  }, [selectedImageId]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [selectedImageId]);

  const updateImage = useCallback((id: string, updates: Partial<UploadedImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  }, []);

  const selectedImage = images.find(img => img.id === selectedImageId) || null;

  const toggleSound = useCallback((soundId: string) => {
    setActiveSounds(prev =>
      prev.includes(soundId) ? prev.filter(s => s !== soundId) : [...prev, soundId]
    );
  }, []);

  return {
    images,
    selectedImage,
    selectedImageId,
    setSelectedImageId,
    aspectRatio,
    setAspectRatio,
    greenScreenEnabled,
    setGreenScreenEnabled,
    isRecording,
    setIsRecording,
    activeSounds,
    toggleSound,
    setActiveSounds,
    masterVolume,
    setMasterVolume,
    addImages,
    removeImage,
    updateImage,
  };
}

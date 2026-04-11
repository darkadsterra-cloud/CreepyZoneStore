export interface ProjectVideo {
  id: string;
  name: string;
  url: string;        // blob URL (session only) ya base64
  blob?: string;      // base64 for persistence
  mimeType: string;
  size: number;
  duration: number;   // seconds
  createdAt: number;
  thumbnail?: string;
}

export interface HorrorProject {
  id: string;
  name: string;
  status: 'draft' | 'finished';
  createdAt: number;
  updatedAt: number;
  aspectRatio: string;
  greenScreen: boolean;
  animMode: string;
  activeParticles: string[];
  activeSounds: string[];
  masterVolume: number;
  thumbnail?: string;
  images: {
    id: string;
    url: string;
    name: string;
    animation: string | null;
    animations: string[];
    position: { x: number; y: number };
    scale: number;
    rotation: number;
    opacity: number;
  }[];
  videos: ProjectVideo[];
}

const STORAGE_KEY = 'horror_projects_v2';

export function loadProjects(): HorrorProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects: HorrorProject[] = JSON.parse(raw);
    // Restore blob URLs from base64
    return projects.map(p => ({
      ...p,
      videos: (p.videos ?? []).map(v => {
        if (v.blob && !v.url.startsWith('blob:')) {
          const byteStr = atob(v.blob);
          const arr = new Uint8Array(byteStr.length);
          for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
          const blob = new Blob([arr], { type: v.mimeType });
          return { ...v, url: URL.createObjectURL(blob) };
        }
        return v;
      }),
    }));
  } catch { return []; }
}

export function saveProject(project: HorrorProject) {
  try {
    const all = loadProjects();
    const idx = all.findIndex(p => p.id === project.id);
    if (idx >= 0) all[idx] = project;
    else all.unshift(project);
    // Save without blob URLs (too large) — blobs already stored separately
    const toSave = all.map(p => ({
      ...p,
      videos: (p.videos ?? []).map(v => ({ ...v, url: v.blob ? '' : v.url })),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) { console.error('Save failed', e); }
}

export function addVideoToProject(projectId: string, video: ProjectVideo) {
  const all = loadProjects();
  const proj = all.find(p => p.id === projectId);
  if (!proj) return;
  proj.videos = [video, ...(proj.videos ?? [])];
  proj.updatedAt = Date.now();
  saveProject(proj);
}

export function deleteVideoFromProject(projectId: string, videoId: string) {
  const all = loadProjects();
  const proj = all.find(p => p.id === projectId);
  if (!proj) return;
  proj.videos = (proj.videos ?? []).filter(v => v.id !== videoId);
  saveProject(proj);
}

export function deleteProject(id: string) {
  const all = loadProjects();
  const filtered = all.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

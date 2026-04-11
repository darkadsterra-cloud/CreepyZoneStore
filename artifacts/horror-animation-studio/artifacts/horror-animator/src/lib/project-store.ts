export interface ProjectImage {
  id: string;
  url: string;
  name: string;
  animation: string | null;
  animations: string[];
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
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
  images: ProjectImage[];
  thumbnail?: string;
}

const KEY = 'horror-studio-projects';

export function loadProjects(): HorrorProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProject(project: HorrorProject): void {
  const all = loadProjects();
  const idx = all.findIndex(p => p.id === project.id);
  if (idx >= 0) all[idx] = project;
  else all.unshift(project);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  const all = loadProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

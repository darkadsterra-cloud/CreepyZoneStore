import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music, Zap, Wind, Mic } from 'lucide-react';
import { HORROR_SOUNDS } from '@/lib/animations';

interface SoundLibraryProps {
  activeSounds: string[];
  onToggleSound: (id: string) => void;
  masterVolume: number;
  onVolumeChange: (v: number) => void;
}

const BASE = 'https://raw.githubusercontent.com/darkadsterra-cloud/CreepyZoneStore/main/artifacts/horror-animation-studio/artifacts/horror-animator/public/sounds/';

const SOUND_URLS: Record<string, string> = {
  // ── AMBIENT ──────────────────────────────────────────────
  'deep-drone':      BASE + 'soundreality-rumble-winds-253834.mp3',
  'wind-howl':       BASE + 'soundreality-rumble-winds-253834.mp3',
  'thunder-rumble':  BASE + 'soundreality-horror-kick-247743.mp3',
  'thunderstorm':    BASE + 'jorivermeer-horror-background-atmosphere-030-394198.mp3',
  'heavy-rain':      BASE + 'jorivermeer-horror-background-atmosphere-030-394198.mp3',
  'haunted-room':    BASE + 'universfield-horror-background-atmosphere-155482.mp3',
  'inferno':         BASE + 'universfield-horror-background-atmosphere-06-190279 (1).mp3',
  'void-hum':        BASE + 'universfield-dark-horror-soundscape-345814.mp3',
  'cemetery':        BASE + 'universfield-horror-background-atmosphere-08-215794.mp3',
  'static-loop':     BASE + 'freesound_community-horror-voice-flashbacks-14480.mp3',
  'dark-water':      BASE + 'universfield-horror-background-atmosphere-09-219111.mp3',
  'cave-drip':       BASE + 'universfield-horror-background-atmosphere-09-219111.mp3',
  'ritual-chant':    BASE + 'phatphrogstudio-spirit-angry-chanting-no-ai-479754 (1).mp3',
  'forest-night':    BASE + 'universfield-horror-background-atmosphere-for-suspense-166944.mp3',
  'dungeon-drip':    BASE + 'universfield-ghosts-on-film-185898.mp3',
  'sewer-ambience':  BASE + 'universfield-dark-horror-soundscape-345814.mp3',
  'tv-static':       BASE + 'freesound_community-horror-voice-flashbacks-14480.mp3',

  // ── EFFECTS ──────────────────────────────────────────────
  'heartbeat':       BASE + 'soundreality-horror-kick-247743.mp3',
  'door-creak':      BASE + 'simplesound-dark-horror-opener-443328.mp3',
  'chains':          BASE + 'alex_kizenkow-horror-hit-logo-142395.mp3',
  'glass-break':     BASE + 'simplesound-horror-trailer-443327.mp3',
  'knife-scrape':    BASE + 'alex_kizenkow-horror-hit-logo-142395.mp3',
  'bone-crack':      BASE + 'tannerwan-flesh-growing-horror-392380.mp3',
  'footsteps':       BASE + 'bryansantosobreton-biodynamic-impact-bream-tonal-dark-178441.mp3',
  'church-bell':     BASE + 'simplesound-horror-piano-443326.mp3',
  'thunder-strike':  BASE + 'soundreality-horror-kick-247743.mp3',
  'demon-roar':      BASE + 'dragon-studio-deep-guttural-growl-472039.mp3',
  'blood-drip':      BASE + 'tannerwan-flesh-growing-horror-392380.mp3',
  'electric-zap':    BASE + 'alex_kizenkow-horror-hit-logo-142395.mp3',
  'jumpscare-sting': BASE + 'freesound_community-echo-jumpscare-10511.mp3',
  'evil-laugh-sfx':  BASE + 'dragon-studio-evil-girl-laughing-401720.mp3',
  'death-rattle':    BASE + 'freesound_community-echoed-screams-103515.mp3',
  'sword-slash':     BASE + 'bryansantosobreton-biodynamic-impact-bream-tonal-dark-178441.mp3',

  // ── MUSIC ────────────────────────────────────────────────
  'dark-piano':      BASE + 'simplesound-horror-piano-443326.mp3',
  'horror-strings':  BASE + 'simplesound-horror-trailer-443327.mp3',
  'music-box':       BASE + 'universfield-scary-music-box-165983.mp3',
  'organ-drone':     BASE + 'universfield-dark-horror-soundscape-345814.mp3',
  'violin-shriek':   BASE + 'soundreality-horror-thriller-action-247745.mp3',
  'cello-deep':      BASE + 'soundreality-horror-thriller-action-247745.mp3',
  'choir-dark':      BASE + 'phatphrogstudio-spirit-angry-chanting-no-ai-479754 (1).mp3',
  'synth-horror':    BASE + 'universfield-tense-paranormal-horror-15s-498207.mp3',
  'lullaby-horror':  BASE + 'universfield-scary-music-box-165983.mp3',
  'funeral-march':   BASE + 'soundreality-horror-pad-pitch-crowd-391588.mp3',
  'requiem':         BASE + 'phatphrogstudio-spirit-angry-chanting-no-ai-479754 (1).mp3',
  'hell-symphony':   BASE + 'soundreality-horror-thriller-action-247745.mp3',

  // ── VOICES & SCREAMS ─────────────────────────────────────
  'scream':           BASE + 'freesound_community-scream-85218.mp3',
  'scream-female':    BASE + 'virtual_vibes-female-screaming-audio-hd-379382.mp3',
  'scream-distant':   BASE + 'freesound_community-scream-60747.mp3',
  'scream-child':     BASE + 'freesound_community-little-girl-screaming-101185.mp3',
  'growl':            BASE + 'dragon-studio-creepy-growling-sfx-472180.mp3',
  'laugh':            BASE + 'freesound_community-mocking-demon-laugh-growl-86811.mp3',
  'crying':           BASE + 'freesound_community-girl-scream-45657.mp3',
  'whisper':          BASE + 'phatphrogstudio-demon-voice-die-488316.mp3',
  'breathing':        BASE + 'freesound_community-scary-scream-3-81274.mp3',
  'moan':             BASE + 'freesound_community-zombie-pain-1-95166.mp3',
  'child-laugh':      BASE + 'dragon-studio-evil-girl-laughing-401720.mp3',
  'speak-evil':       BASE + 'phatphrogstudio-demon-voice-growling-503874.mp3',
  'wail':             BASE + 'virtual_vibes-woman-scream-sound-hd-379381.mp3',
  'hiss':             BASE + 'dragon-studio-creepy-monster-growling-472178.mp3',
  'howl':             BASE + 'freesound_community-monster-growls-70784.mp3',
  'possessed-scream': BASE + 'freesound_community-terrifying-scream-52389.mp3',
  'death-scream':     BASE + 'universfield-male-death-scream-horror-352706.mp3',
};

// Extra sounds from your files mapped to new IDs for bonus use
const EXTRA_SOUNDS: { id: string; name: string; category: string; url: string }[] = [
  { id: 'x-demon-voice-1',    name: 'Demon Voice I Sense You',   category: 'voice',   url: BASE + 'phatphrogstudio-lich-demonic-voice-i-sense-you-490452.mp3' },
  { id: 'x-demon-come-closer',name: 'Demon Come Closer',         category: 'voice',   url: BASE + 'phatphrogstudio-lich-demonic-voice-come-closer-502312.mp3' },
  { id: 'x-demon-no-mercy',   name: 'Demon No Mercy',            category: 'voice',   url: BASE + 'phatphrogstudio-demon-voice-no-mercy-477827.mp3' },
  { id: 'x-demon-no-running', name: 'Demon No More Running',     category: 'voice',   url: BASE + 'phatphrogstudio-demon-voice-no-more-running-480582.mp3' },
  { id: 'x-demon-flesh',      name: 'Demon Smell Your Flesh',    category: 'voice',   url: BASE + 'phatphrogstudio-demon-voice-smell-flesh-no-ai-479322.mp3' },
  { id: 'x-dragon-voice',     name: 'Dragon Voice',              category: 'voice',   url: BASE + 'phatphrogstudio-dragon-voice-growl-496281 (1).mp3' },
  { id: 'x-demonic-laughter', name: 'Demonic Laughter',          category: 'voice',   url: BASE + 'phatphrogstudio-oni-demon-voice-demonic-laughter-3-488654.mp3' },
  { id: 'x-evil-doll-laugh',  name: 'Evil Doll Laugh',           category: 'voice',   url: BASE + 'phatphrogstudio-evil-doll-voice-creepy-laugh-477344.mp3' },
  { id: 'x-spirit-whispers',  name: 'Spirit Whispers',           category: 'voice',   url: BASE + 'phatphrogstudio-demon-spirit-voice-ghost-whispers-amp-muttering-496706.mp3' },
  { id: 'x-monster-zombie',   name: 'Monster Zombie Scream',     category: 'voice',   url: BASE + 'dragon-studio-zombie-screech-sound-effect-311085.mp3' },
  { id: 'x-werewolf',         name: 'Werewolf Growl',            category: 'voice',   url: BASE + 'dragon-studio-werewolf-growl-511103.mp3' },
  { id: 'x-beast-growl',      name: 'Beast Growl',               category: 'voice',   url: BASE + 'dragon-studio-growl-of-the-beast-504521.mp3' },
  { id: 'x-monster-roar-2',   name: 'Monster Roar',              category: 'voice',   url: BASE + 'dragon-studio-monster-growl-390285.mp3' },
  { id: 'x-scary-scream',     name: 'Scary Scream',              category: 'voice',   url: BASE + 'dragon-studio-scary-scream-401725.mp3' },
  { id: 'x-zombie-female',    name: 'Female Zombie Scream',      category: 'voice',   url: BASE + 'dragon-studio-female-zombie-scream-324744.mp3' },
  { id: 'x-woman-scream',     name: 'Woman Screaming',           category: 'voice',   url: BASE + 'dragon-studio-woman-screaming-cfx-streaming-sound-effect-320169.mp3' },
  { id: 'x-multiple-screams', name: 'Multiple Female Screams',   category: 'voice',   url: BASE + 'freesound_community-multiple-female-screams-70736.mp3' },
  { id: 'x-very-intense-hell',name: 'Very Intense Hell Scream',  category: 'voice',   url: BASE + 'freesound_community-very-intense-hell-72137.mp3' },
  { id: 'x-scream-echo',      name: 'Scream With Echo',          category: 'voice',   url: BASE + 'freesound_community-scream-with-echo-46585.mp3' },
  { id: 'x-ghastly-groan',    name: 'Ghastly Groan',             category: 'voice',   url: BASE + 'freesound_community-ghastly-groan-48064.mp3' },
  { id: 'x-young-girl-scream',name: 'Young Girl Screaming',      category: 'voice',   url: BASE + 'freesound_community-young-girl-screaming-1-90510.mp3' },
  { id: 'x-angry-man-yell',   name: 'Angry Man Yell',            category: 'voice',   url: BASE + 'virtual_vibes-angry-man-yell-sound-hd-379386.mp3' },
  { id: 'x-ultra-scream',     name: 'Ultra Realistic Scream',    category: 'voice',   url: BASE + 'virtual_vibes-scary-woman-scream-ultra-realistic-379378.mp3' },
  { id: 'x-infinite-piano',   name: 'Infinite Expanse Piano',    category: 'music',   url: BASE + 'phatphrogstudio-infinite-expanse-piano-nova-trails-47747.mp3' },
  { id: 'x-cosmic-oblivion',  name: 'Cosmic Oblivion',           category: 'music',   url: BASE + 'phatphrogstudio-cosmic-oblivion-neon-nexus-477911.mp3' },
  { id: 'x-cyber-attack',     name: 'Cyber Attack',              category: 'music',   url: BASE + 'phatphrogstudio-cyber-attack-datastore-rebellion-477469.mp3' },
  { id: 'x-internal-fury',    name: 'Internal Fury',             category: 'music',   url: BASE + 'phatphrogstudio-internal-fury-fury27s-dance-477470.mp3' },
  { id: 'x-witch-action',     name: 'Witch Action Music',        category: 'music',   url: BASE + 'phatphrogstudio-pyro-witch-firebom-saga-royalty-free-action-music-502322.mp3' },
  { id: 'x-horror-thriller',  name: 'Horror Thriller',           category: 'music',   url: BASE + 'soundreality-horror-thriller-action-247745.mp3' },
  { id: 'x-horror-temptation',name: 'Horror Temptation',         category: 'music',   url: BASE + 'soundreality-temptation-249034.mp3' },
  { id: 'x-paranormal-15s',   name: 'Tense Paranormal',          category: 'music',   url: BASE + 'universfield-tense-paranormal-horror-15s-498138.mp3' },
  { id: 'x-paranormal-cinematic', name: 'Paranormal Cinematic',  category: 'music',   url: BASE + 'universfield-tense-paranormal-horror-cinematic-15s-498207.mp3' },
  { id: 'x-horror-suspense',  name: 'Horror Suspense',           category: 'music',   url: BASE + 'universfield-dark-horror-suspense-30s-355838.mp3' },
  { id: 'x-scary-atmosphere', name: 'Scary Atmosphere',          category: 'ambient', url: BASE + 'universfield-scary-horror-atmosphere-176754.mp3' },
  { id: 'x-forest-monster',   name: 'Forest Monster',            category: 'ambient', url: BASE + 'freesound_community-forest-monster-scream-1-104247.mp3' },
  { id: 'x-demon-haunting',   name: 'Demon Haunting',            category: 'ambient', url: BASE + 'freesound_community-033203_scary-demon-haunting-sound-76189.mp3' },
  { id: 'x-free-demon-ghost', name: 'Demon Ghost Sound',         category: 'ambient', url: BASE + 'freesound_community-free-demon-ghost-sounds-27789 (1).mp3' },
  { id: 'x-horror-atmosphere',name: 'Horror Atmosphere',         category: 'ambient', url: BASE + 'freesound_community-horror-ambiance-01-66708.mp3' },
  { id: 'x-intense-music',    name: 'Intense Horror Music',      category: 'music',   url: BASE + 'freesound_community-intense-horror-music-01-14890.mp3' },
  { id: 'x-eerie-scream',     name: 'Eerie Scream Growling',     category: 'voice',   url: BASE + 'gimsea-shark-eerie-scream-terrifying-growling-and-screaming-17-431581.mp3' },
  { id: 'x-demon-grow-halloween', name: 'Halloween Demon Growl', category: 'voice',   url: BASE + 'freesound_community-demon-growl-for-halloween-spooky-creepy-scary-monster-ghoul-ghost-sounds-100123.mp3' },
  { id: 'x-jusatt-scream-1',  name: 'Horror Scream cfx 1',      category: 'voice',   url: BASE + 'jusatt890-scream-horror-cfx-490899.mp3' },
  { id: 'x-jusatt-scream-2',  name: 'Horror Scream cfx 2',      category: 'voice',   url: BASE + 'jusatt890-scream-horror-cfx-490908.mp3' },
  { id: 'x-jusatt-scream-3',  name: 'Horror Scream cfx 3',      category: 'voice',   url: BASE + 'jusatt890-scream-horror-cfx-490909.mp3' },
  { id: 'x-jusatt-scream-4',  name: 'Horror Scream cfx 4',      category: 'voice',   url: BASE + 'jusatt890-scream-horror-cfx-490910.mp3' },
  { id: 'x-jusatt-scream-5',  name: 'Horror Scream cfx 5',      category: 'voice',   url: BASE + 'jusatt890-scream-horror-cfx-490916 (1).mp3' },
  { id: 'x-high-quality-screech', name: 'High Quality Screech',  category: 'voice',   url: BASE + 'freesound_community-high-quality-monster-screech-65012.mp3' },
  { id: 'x-demonic-woman',    name: 'Demonic Woman Scream',      category: 'voice',   url: BASE + 'freesound_community-demonic-woman-scream-6333.mp3' },
  { id: 'x-demonic-roar',     name: 'Demonic Roar 45k',         category: 'voice',   url: BASE + 'freesound_community-demonic-roar-45549.mp3' },
  { id: 'x-evil-cat',         name: 'Evil Cat Scream',           category: 'voice',   url: BASE + 'freesound_community-manei_corentin_2016_2017_evil-cat-scream-71799.mp3' },
  { id: 'x-monster-moan',     name: 'Monster Moan & Squeal',     category: 'voice',   url: BASE + 'wiktworklaweckords_llc-monster-moan-and-squeel-146632.mp3' },
  { id: 'x-snarls-growls-1',  name: 'Snarls & Growls 1',        category: 'voice',   url: BASE + 'voicebosch-snarls-and-growls-172823 (1).mp3' },
  { id: 'x-snarls-growls-2',  name: 'Snarls & Growls 2',        category: 'voice',   url: BASE + 'voicebosch-snarls-and-growls-172823.mp3' },
  { id: 'x-man-scream',       name: 'Man Scream',                category: 'voice',   url: BASE + 'universfield-man-scream-08-352430.mp3' },
  { id: 'x-distorted-scream', name: 'Distorted Demonic Scream',  category: 'voice',   url: BASE + 'u_503d70fc-distant-demonic-scream-and-debris-346596.mp3' },
  { id: 'x-distorted-demon-growl', name: 'Distorted Demon Growl',category: 'voice',   url: BASE + 'u_b1k8celi2s-distorted-demon-growl-203405.mp3' },
  { id: 'x-phobic-screaming', name: 'Phobic Screaming',          category: 'voice',   url: BASE + 'phobic-frantic-screaming-211549.mp3' },
  { id: 'x-scream-debris',    name: 'Scream of Agony',           category: 'voice',   url: BASE + 'soundreality-screams-of-agony-142447.mp3' },
  { id: 'x-horror-music-intense', name: 'Horror Music Intense',  category: 'music',   url: BASE + 'freesound_community-horror-intense-music-01-14890.mp3' },
  { id: 'x-demon-voice-mercy',name: 'Demon: No Mercy',           category: 'voice',   url: BASE + 'phatphrogstudio-demon-voice-no-mercy-477827.mp3' },
  { id: 'x-haunted-house',    name: 'Haunted House Entertainment',category: 'ambient', url: BASE + 'hauntedhousentertainment-demon-voice-246555.mp3' },
  { id: 'x-zombie-groans-3',  name: 'Zombie Groans 3',           category: 'voice',   url: BASE + 'freesound_community-zombie-groan-3-4663 (1).mp3' },
  { id: 'x-zombie-groan-104k',name: 'Zombie Groan',              category: 'voice',   url: BASE + 'freesound_community-zombie-groan-104542 (1).mp3' },
  { id: 'x-dinosaur-roar',    name: 'Dinosaur Roar',             category: 'voice',   url: BASE + 'dfdb-dinosaur-roar-with-screams-and-growth-193210.mp3' },
  { id: 'x-monster-roar-alex',name: 'Monster Roar (Big)',        category: 'voice',   url: BASE + 'alexiadavina-horror-sound-lurking-horror-monster-189948.mp3' },
  { id: 'x-alien-noise',      name: 'Low Pitch Alien Noise',     category: 'voice',   url: BASE + 'fluld8211-low-pitch-alien-noise-person-screaming-496480.mp3' },
];

const categoryMeta = {
  ambient: { label: 'Ambient',          icon: Wind,  color: 'text-blue-400'   },
  effect:  { label: 'Effects',          icon: Zap,   color: 'text-orange-400' },
  music:   { label: 'Music',            icon: Music, color: 'text-purple-400' },
  voice:   { label: 'Voices & Screams', icon: Mic,   color: 'text-red-400'    },
};

export default function SoundLibrary({ activeSounds, onToggleSound, masterVolume, onVolumeChange }: SoundLibraryProps) {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    ambient: true, effect: false, music: false, voice: false, extra: false,
  });
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Object.values(audioRefs.current).forEach(a => {
      a.volume = Math.max(0, Math.min(1, masterVolume));
    });
  }, [masterVolume]);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = ''; });
    };
  }, []);

  const startSound = useCallback((id: string, url: string) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].volume = masterVolume;
      audioRefs.current[id].play().catch(() => {});
      return;
    }
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, masterVolume));
    audio.src = url;
    audio.onerror = () => setLoadErrors(p => ({ ...p, [id]: true }));
    audio.play().catch(() => setLoadErrors(p => ({ ...p, [id]: true })));
    audioRefs.current[id] = audio;
  }, [masterVolume]);

  const stopSound = useCallback((id: string) => {
    const a = audioRefs.current[id];
    if (a) { a.pause(); a.currentTime = 0; }
  }, []);

  const handleToggle = (id: string, url: string) => {
    if (activeSounds.includes(id)) stopSound(id);
    else startSound(id, url);
    onToggleSound(id);
  };

  const renderSound = (id: string, name: string, description: string, url: string) => {
    const isActive = activeSounds.includes(id);
    const hasError = loadErrors[id];
    return (
      <button key={id} onClick={() => handleToggle(id, url)}
        className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-all w-full ${
          hasError
            ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
            : isActive
            ? 'bg-red-500/20 border border-red-500/40 text-red-300'
            : 'bg-zinc-800/30 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-red-500 animate-pulse' : hasError ? 'bg-orange-500' : 'bg-zinc-700'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium truncate">{name}</p>
          <p className="text-[8px] text-zinc-600 truncate">{hasError ? '⚠ Load failed' : description}</p>
        </div>
        {isActive && <span className="text-[8px] text-red-400 flex-shrink-0">▶</span>}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sound Library</h3>
        {activeSounds.length > 0 && (
          <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded">
            {activeSounds.length} playing
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activeSounds.length > 0
          ? <Volume2 className="w-3 h-3 text-zinc-400 flex-shrink-0" />
          : <VolumeX className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
        <input type="range" min="0" max="1" step="0.05" value={masterVolume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
        <span className="text-[9px] text-zinc-500 font-mono w-6">{Math.round(masterVolume * 100)}</span>
      </div>

      {/* Standard categories from HORROR_SOUNDS */}
      {(Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map(cat => {
        const meta = categoryMeta[cat];
        const Icon = meta.icon;
        const sounds = HORROR_SOUNDS.filter(s => s.category === cat);
        const activeInCat = sounds.filter(s => activeSounds.includes(s.id)).length;
        const isOpen = openCats[cat];
        return (
          <div key={cat} className="rounded-lg border border-zinc-800 overflow-hidden">
            <button onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
              <div className="flex items-center gap-2">
                <Icon className={`w-3 h-3 ${meta.color}`} />
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                {activeInCat > 0 && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded">{activeInCat} on</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-600">{sounds.length}</span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-1 gap-1 p-2 bg-zinc-900/30 max-h-[250px] overflow-y-auto">
                {sounds.map(s => renderSound(s.id, s.name, s.description, SOUND_URLS[s.id] || ''))}
              </div>
            )}
          </div>
        );
      })}

      {/* EXTRA sounds from your 137 files */}
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <button onClick={() => setOpenCats(p => ({ ...p, extra: !p.extra }))}
          className="w-full flex items-center justify-between p-2 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
          <div className="flex items-center gap-2">
            <Mic className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400">Extra Horror Sounds</span>
            {EXTRA_SOUNDS.filter(s => activeSounds.includes(s.id)).length > 0 && (
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded">
                {EXTRA_SOUNDS.filter(s => activeSounds.includes(s.id)).length} on
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-600">{EXTRA_SOUNDS.length}</span>
        </button>
        {openCats.extra && (
          <div className="grid grid-cols-1 gap-1 p-2 bg-zinc-900/30 max-h-[300px] overflow-y-auto">
            {EXTRA_SOUNDS.map(s => renderSound(s.id, s.name, s.category, s.url))}
          </div>
        )}
      </div>
    </div>
  );
}

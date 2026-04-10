export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  cssKeyframes: string;
  animationCSS: string;
  category: 'movement' | 'scare' | 'atmospheric' | 'visual';
  icon: string;
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ===== MOVEMENT =====
  { id: 'float', name: 'Ghostly Float', description: 'Eerie floating spirit motion', cssKeyframes: '', animationCSS: 'animation: ha-float 4s ease-in-out infinite', category: 'movement', icon: '👻' },
  { id: 'shake', name: 'Demonic Shake', description: 'Intense possession shaking', cssKeyframes: '', animationCSS: 'animation: ha-shake 0.3s ease-in-out infinite', category: 'movement', icon: '😈' },
  { id: 'creep', name: 'Creeping Shadow', description: 'Slow pan across screen', cssKeyframes: '', animationCSS: 'animation: ha-creep 6s ease-in-out infinite', category: 'movement', icon: '🕷️' },
  { id: 'swing', name: 'Pendulum Swing', description: 'Hanging pendulum sway', cssKeyframes: '', animationCSS: 'animation: ha-swing 2.5s ease-in-out infinite', category: 'movement', icon: '⚖️' },
  { id: 'drift-left', name: 'Drift Left', description: 'Slow drift to the left', cssKeyframes: '', animationCSS: 'animation: ha-drift-left 3s ease-in-out infinite', category: 'movement', icon: '←' },
  { id: 'drift-right', name: 'Drift Right', description: 'Slow drift to the right', cssKeyframes: '', animationCSS: 'animation: ha-drift-right 3s ease-in-out infinite', category: 'movement', icon: '→' },
  { id: 'spiral', name: 'Death Spiral', description: 'Spiraling rotation motion', cssKeyframes: '', animationCSS: 'animation: ha-spiral 3s linear infinite', category: 'movement', icon: '🌀' },
  { id: 'sway', name: 'Corpse Sway', description: 'Slow swaying like a hanging body', cssKeyframes: '', animationCSS: 'animation: ha-sway 3s ease-in-out infinite', category: 'movement', icon: '🪢' },
  { id: 'bounce', name: 'Demon Bounce', description: 'Erratic bouncing movement', cssKeyframes: '', animationCSS: 'animation: ha-bounce 1.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite', category: 'movement', icon: '🎃' },
  { id: 'teleport', name: 'Shadow Teleport', description: 'Blinks in and out of position', cssKeyframes: '', animationCSS: 'animation: ha-teleport 2s step-start infinite', category: 'movement', icon: '⚡' },
  { id: 'slide-down', name: 'Descend from Void', description: 'Slides down from top', cssKeyframes: '', animationCSS: 'animation: ha-slide-down 4s ease-in-out infinite', category: 'movement', icon: '⬇️' },
  { id: 'slide-up', name: 'Rise from Below', description: 'Rises up from below', cssKeyframes: '', animationCSS: 'animation: ha-slide-up 4s ease-in-out infinite', category: 'movement', icon: '⬆️' },
  { id: 'zigzag', name: 'Possessed Zigzag', description: 'Chaotic zigzag movement', cssKeyframes: '', animationCSS: 'animation: ha-zigzag 2s linear infinite', category: 'movement', icon: '⚡' },
  { id: 'earthquake', name: 'Earthquake Terror', description: 'Massive violent shaking', cssKeyframes: '', animationCSS: 'animation: ha-earthquake 0.1s ease-in-out infinite', category: 'movement', icon: '🌋' },
  { id: 'levitate-spin', name: 'Levitate & Spin', description: 'Floats while slowly spinning', cssKeyframes: '', animationCSS: 'animation: ha-levitate-spin 5s ease-in-out infinite', category: 'movement', icon: '🔄' },
  { id: 'marionette', name: 'Marionette Drop', description: 'Jerky puppet-like dropping', cssKeyframes: '', animationCSS: 'animation: ha-marionette 1.5s ease-in-out infinite', category: 'movement', icon: '🎭' },
  { id: 'crawl', name: 'Crawl Across', description: 'Low crawling motion', cssKeyframes: '', animationCSS: 'animation: ha-crawl 5s ease-in-out infinite', category: 'movement', icon: '🦟' },
  { id: 'jerk', name: 'Possession Jerk', description: 'Violent sudden jerking', cssKeyframes: '', animationCSS: 'animation: ha-jerk 0.8s ease-in-out infinite', category: 'movement', icon: '💀' },
  { id: 'orbit', name: 'Dark Orbit', description: 'Orbits around center point', cssKeyframes: '', animationCSS: 'animation: ha-orbit 4s linear infinite', category: 'movement', icon: '🌙' },
  { id: 'tidal', name: 'Tidal Wave', description: 'Sweeping wave motion', cssKeyframes: '', animationCSS: 'animation: ha-tidal 3s ease-in-out infinite', category: 'movement', icon: '🌊' },
  { id: 'chaotic', name: 'Chaotic Dance', description: 'Completely random chaotic motion', cssKeyframes: '', animationCSS: 'animation: ha-chaotic 0.5s linear infinite', category: 'movement', icon: '🔥' },
  { id: 'rise-fall', name: 'Rise and Fall', description: 'Smooth up and down cycle', cssKeyframes: '', animationCSS: 'animation: ha-rise-fall 3s ease-in-out infinite', category: 'movement', icon: '📈' },
  { id: 'sidewind', name: 'Sidewinder', description: 'Side to side slithering', cssKeyframes: '', animationCSS: 'animation: ha-sidewind 2s ease-in-out infinite', category: 'movement', icon: '🐍' },
  { id: 'pulse-move', name: 'Pulse & Move', description: 'Pulses while drifting', cssKeyframes: '', animationCSS: 'animation: ha-pulse-move 3s ease-in-out infinite', category: 'movement', icon: '💓' },
  { id: 'warp-drift', name: 'Warp Drift', description: 'Warping spatial drift', cssKeyframes: '', animationCSS: 'animation: ha-warp-drift 4s ease-in-out infinite', category: 'movement', icon: '🌌' },

  // ===== SCARE =====
  { id: 'jumpscare', name: 'Jump Scare', description: 'Sudden explosive zoom burst', cssKeyframes: '', animationCSS: 'animation: ha-jumpscare 3s ease-in-out infinite', category: 'scare', icon: '😱' },
  { id: 'flash-blink', name: 'Flash Blink', description: 'Rapid white flash strobe', cssKeyframes: '', animationCSS: 'animation: ha-flash-blink 0.5s step-start infinite', category: 'scare', icon: '⚡' },
  { id: 'sudden-loom', name: 'Sudden Loom', description: 'Grows suddenly huge then recoils', cssKeyframes: '', animationCSS: 'animation: ha-sudden-loom 2s ease-in-out infinite', category: 'scare', icon: '😰' },
  { id: 'evil-zoom', name: 'Evil Zoom In', description: 'Relentlessly zooms closer', cssKeyframes: '', animationCSS: 'animation: ha-evil-zoom 4s ease-in infinite', category: 'scare', icon: '🔍' },
  { id: 'strobe', name: 'Terror Strobe', description: 'Rapid full strobe flash', cssKeyframes: '', animationCSS: 'animation: ha-strobe 0.15s step-start infinite', category: 'scare', icon: '🔆' },
  { id: 'blackout-reveal', name: 'Blackout Reveal', description: 'Hides then suddenly appears', cssKeyframes: '', animationCSS: 'animation: ha-blackout-reveal 3s ease-in-out infinite', category: 'scare', icon: '🌑' },
  { id: 'rapid-approach', name: 'Rapid Approach', description: 'Rushes toward viewer fast', cssKeyframes: '', animationCSS: 'animation: ha-rapid-approach 2s ease-out infinite', category: 'scare', icon: '💨' },
  { id: 'mirror-flip', name: 'Mirror Flip Scare', description: 'Flips horizontally with flash', cssKeyframes: '', animationCSS: 'animation: ha-mirror-flip 2s ease-in-out infinite', category: 'scare', icon: '🪞' },
  { id: 'warp-jump', name: 'Warp Jump', description: 'Teleport warp with distortion', cssKeyframes: '', animationCSS: 'animation: ha-warp-jump 2.5s ease-in-out infinite', category: 'scare', icon: '🌀' },
  { id: 'crash-in', name: 'Crash In', description: 'Slams in from outside frame', cssKeyframes: '', animationCSS: 'animation: ha-crash-in 2s ease-out infinite', category: 'scare', icon: '💥' },
  { id: 'slam-down', name: 'Slam Down', description: 'Drops with violent impact', cssKeyframes: '', animationCSS: 'animation: ha-slam-down 2s ease-in-out infinite', category: 'scare', icon: '⬇️' },
  { id: 'eye-open', name: 'Eye Open', description: 'Appears like a blinking eye', cssKeyframes: '', animationCSS: 'animation: ha-eye-open 3s ease-in-out infinite', category: 'scare', icon: '👁️' },
  { id: 'death-drop', name: 'Death Drop', description: 'Falls and disappears below', cssKeyframes: '', animationCSS: 'animation: ha-death-drop 2.5s ease-in infinite', category: 'scare', icon: '💀' },
  { id: 'nuclear-pulse', name: 'Nuclear Pulse', description: 'Explosive radial blast pulse', cssKeyframes: '', animationCSS: 'animation: ha-nuclear-pulse 1.5s ease-out infinite', category: 'scare', icon: '☢️' },
  { id: 'distort-warp', name: 'Distort Warp', description: 'Reality-warping distortion', cssKeyframes: '', animationCSS: 'animation: ha-distort-warp 3s ease-in-out infinite', category: 'scare', icon: '🌪️' },
  { id: 'horror-snap', name: 'Horror Snap', description: 'Snaps violently in random directions', cssKeyframes: '', animationCSS: 'animation: ha-horror-snap 0.4s step-start infinite', category: 'scare', icon: '👿' },
  { id: 'rage-flash', name: 'Rage Flash', description: 'Red rage flash strobing', cssKeyframes: '', animationCSS: 'animation: ha-rage-flash 0.3s step-start infinite', category: 'scare', icon: '😡' },
  { id: 'final-reveal', name: 'Final Reveal', description: 'Slowly reveals from darkness', cssKeyframes: '', animationCSS: 'animation: ha-final-reveal 4s ease-in-out infinite', category: 'scare', icon: '🔦' },
  { id: 'dive-bomb', name: 'Dive Bomb', description: 'Dives from above at speed', cssKeyframes: '', animationCSS: 'animation: ha-dive-bomb 2s ease-in infinite', category: 'scare', icon: '💫' },
  { id: 'possession', name: 'Possession Burst', description: 'Chaotic possessed explosion', cssKeyframes: '', animationCSS: 'animation: ha-possession 0.5s ease-in-out infinite', category: 'scare', icon: '👾' },
  { id: 'rage-burst', name: 'Rage Burst', description: 'Explodes outward in rage', cssKeyframes: '', animationCSS: 'animation: ha-rage-burst 1s ease-out infinite', category: 'scare', icon: '💢' },
  { id: 'terror-vibrate', name: 'Terror Vibrate', description: 'High-frequency terror vibration', cssKeyframes: '', animationCSS: 'animation: ha-terror-vibrate 0.05s linear infinite', category: 'scare', icon: '📳' },
  { id: 'appear-ghost', name: 'Ghost Appear', description: 'Materializes from nothing', cssKeyframes: '', animationCSS: 'animation: ha-appear-ghost 2.5s ease-in-out infinite', category: 'scare', icon: '👻' },
  { id: 'grab-reach', name: 'Grab & Reach', description: 'Reaches out to grab viewer', cssKeyframes: '', animationCSS: 'animation: ha-grab-reach 2s ease-in-out infinite', category: 'scare', icon: '✋' },
  { id: 'shatter', name: 'Reality Shatter', description: 'Shatters into fragments', cssKeyframes: '', animationCSS: 'animation: ha-shatter 2s ease-in-out infinite', category: 'scare', icon: '💔' },

  // ===== ATMOSPHERIC =====
  { id: 'haunting', name: 'Haunting Fade', description: 'Ghostly appear/disappear with blur', cssKeyframes: '', animationCSS: 'animation: ha-haunting 6s ease-in-out infinite', category: 'atmospheric', icon: '🌫️' },
  { id: 'pulse-glow', name: 'Blood Pulse Glow', description: 'Pulsing red glow heartbeat', cssKeyframes: '', animationCSS: 'animation: ha-pulse-glow 2s ease-in-out infinite', category: 'atmospheric', icon: '❤️' },
  { id: 'flicker', name: 'Light Flicker', description: 'Dying light flickering', cssKeyframes: '', animationCSS: 'animation: ha-flicker 3s ease-in-out infinite', category: 'atmospheric', icon: '🕯️' },
  { id: 'shadow-breathe', name: 'Shadow Breathe', description: 'Slow dark breathing presence', cssKeyframes: '', animationCSS: 'animation: ha-shadow-breathe 4s ease-in-out infinite', category: 'atmospheric', icon: '🫁' },
  { id: 'fog-roll', name: 'Fog Roll', description: 'Rolling fog wisps', cssKeyframes: '', animationCSS: 'animation: ha-fog-roll 8s ease-in-out infinite', category: 'atmospheric', icon: '🌁' },
  { id: 'spectral-shift', name: 'Spectral Shift', description: 'Shifts between spectral states', cssKeyframes: '', animationCSS: 'animation: ha-spectral-shift 5s ease-in-out infinite', category: 'atmospheric', icon: '🌈' },
  { id: 'nightmare-phase', name: 'Nightmare Phase', description: 'Phases in and out of reality', cssKeyframes: '', animationCSS: 'animation: ha-nightmare-phase 6s ease-in-out infinite', category: 'atmospheric', icon: '😴' },
  { id: 'dark-ritual', name: 'Dark Ritual', description: 'Pulsing dark energy', cssKeyframes: '', animationCSS: 'animation: ha-dark-ritual 3s ease-in-out infinite', category: 'atmospheric', icon: '🔮' },
  { id: 'spirit-manifest', name: 'Spirit Manifest', description: 'Spirit slowly materializes', cssKeyframes: '', animationCSS: 'animation: ha-spirit-manifest 8s ease-in-out infinite', category: 'atmospheric', icon: '✨' },
  { id: 'aura-glow', name: 'Cursed Aura', description: 'Cursed glowing aura pulse', cssKeyframes: '', animationCSS: 'animation: ha-aura-glow 3s ease-in-out infinite', category: 'atmospheric', icon: '🌟' },
  { id: 'infernal-glow', name: 'Infernal Glow', description: 'Hellish orange-red glow', cssKeyframes: '', animationCSS: 'animation: ha-infernal-glow 2.5s ease-in-out infinite', category: 'atmospheric', icon: '🔥' },
  { id: 'grave-rise', name: 'Grave Rise', description: 'Rises from the grave mist', cssKeyframes: '', animationCSS: 'animation: ha-grave-rise 5s ease-out infinite', category: 'atmospheric', icon: '⚰️' },
  { id: 'moonlit-wail', name: 'Moonlit Wail', description: 'Wailing under the moon', cssKeyframes: '', animationCSS: 'animation: ha-moonlit-wail 6s ease-in-out infinite', category: 'atmospheric', icon: '🌕' },
  { id: 'astral-drain', name: 'Astral Drain', description: 'Life draining away slowly', cssKeyframes: '', animationCSS: 'animation: ha-astral-drain 4s ease-in-out infinite', category: 'atmospheric', icon: '🌀' },
  { id: 'limbo-float', name: 'Limbo Float', description: 'Floating between worlds', cssKeyframes: '', animationCSS: 'animation: ha-limbo-float 7s ease-in-out infinite', category: 'atmospheric', icon: '🕊️' },
  { id: 'sigil-burn', name: 'Sigil Burn', description: 'Burning sigil glow effect', cssKeyframes: '', animationCSS: 'animation: ha-sigil-burn 4s ease-in-out infinite', category: 'atmospheric', icon: '🔯' },
  { id: 'death-breath', name: 'Death Breath', description: 'Cold death breath mist', cssKeyframes: '', animationCSS: 'animation: ha-death-breath 5s ease-in-out infinite', category: 'atmospheric', icon: '💨' },
  { id: 'void-portal', name: 'Void Portal', description: 'Opening portal to the void', cssKeyframes: '', animationCSS: 'animation: ha-void-portal 6s ease-in-out infinite', category: 'atmospheric', icon: '🌑' },
  { id: 'purgatory', name: 'Purgatory Pulse', description: 'Purgatory dimension pulse', cssKeyframes: '', animationCSS: 'animation: ha-purgatory 4s ease-in-out infinite', category: 'atmospheric', icon: '☁️' },
  { id: 'underworld', name: 'Underworld Glow', description: 'Glowing from the underworld', cssKeyframes: '', animationCSS: 'animation: ha-underworld 3s ease-in-out infinite', category: 'atmospheric', icon: '⛓️' },
  { id: 'eternal-dark', name: 'Eternal Darkness', description: 'Swallowed by eternal dark', cssKeyframes: '', animationCSS: 'animation: ha-eternal-dark 8s ease-in-out infinite', category: 'atmospheric', icon: '🌚' },
  { id: 'terror-fog', name: 'Terror Fog', description: 'Dense terror fog swirl', cssKeyframes: '', animationCSS: 'animation: ha-terror-fog 10s ease-in-out infinite', category: 'atmospheric', icon: '🌫️' },
  { id: 'cursed-halo', name: 'Cursed Halo', description: 'Dark cursed halo above head', cssKeyframes: '', animationCSS: 'animation: ha-cursed-halo 3s linear infinite', category: 'atmospheric', icon: '👼' },
  { id: 'soul-emerge', name: 'Soul Emerge', description: 'Soul emerging from body', cssKeyframes: '', animationCSS: 'animation: ha-soul-emerge 6s ease-in-out infinite', category: 'atmospheric', icon: '💫' },
  { id: 'ghost-drift', name: 'Ghost Drift Through', description: 'Ghost drifts through walls', cssKeyframes: '', animationCSS: 'animation: ha-ghost-drift 8s ease-in-out infinite', category: 'atmospheric', icon: '🏚️' },

  // ===== VISUAL EFFECTS =====
  { id: 'glitch', name: 'Glitch Horror', description: 'Digital glitch with color split', cssKeyframes: '', animationCSS: 'animation: ha-glitch 4s ease-in-out infinite', category: 'visual', icon: '📺' },
  { id: 'blood-filter', name: 'Blood Filter', description: 'Deep blood red color wash', cssKeyframes: '', animationCSS: 'animation: ha-blood-filter 3s ease-in-out infinite', category: 'visual', icon: '🩸' },
  { id: 'chromatic', name: 'Chromatic Aberration', description: 'RGB color split distortion', cssKeyframes: '', animationCSS: 'animation: ha-chromatic 2s ease-in-out infinite', category: 'visual', icon: '🎨' },
  { id: 'tv-static', name: 'TV Static Corrupt', description: 'Television static corruption', cssKeyframes: '', animationCSS: 'animation: ha-tv-static 0.1s step-start infinite', category: 'visual', icon: '📡' },
  { id: 'heat-distort', name: 'Hell Heat Distort', description: 'Hell heat wave distortion', cssKeyframes: '', animationCSS: 'animation: ha-heat-distort 2s ease-in-out infinite', category: 'visual', icon: '🌡️' },
  { id: 'shadow-clone', name: 'Shadow Clone', description: 'Creates dark shadow copies', cssKeyframes: '', animationCSS: 'animation: ha-shadow-clone 3s ease-in-out infinite', category: 'visual', icon: '👥' },
  { id: 'corruption', name: 'Digital Corruption', description: 'Digital pixel corruption', cssKeyframes: '', animationCSS: 'animation: ha-corruption 0.5s step-start infinite', category: 'visual', icon: '💾' },
  { id: 'acid-burn', name: 'Acid Burn', description: 'Acid melting visual effect', cssKeyframes: '', animationCSS: 'animation: ha-acid-burn 4s ease-in-out infinite', category: 'visual', icon: '☣️' },
  { id: 'toxic-glow', name: 'Toxic Glow', description: 'Toxic green glowing pulse', cssKeyframes: '', animationCSS: 'animation: ha-toxic-glow 2.5s ease-in-out infinite', category: 'visual', icon: '🧪' },
  { id: 'possession-pulse', name: 'Possession Pulse', description: 'Demonic possession visual pulse', cssKeyframes: '', animationCSS: 'animation: ha-possession-pulse 1.5s ease-in-out infinite', category: 'visual', icon: '👿' },
  { id: 'cursed-invert', name: 'Cursed Invert', description: 'Color inversion curse', cssKeyframes: '', animationCSS: 'animation: ha-cursed-invert 2s step-start infinite', category: 'visual', icon: '🔄' },
  { id: 'hellfire-tint', name: 'Hellfire Tint', description: 'Orange hellfire color tint', cssKeyframes: '', animationCSS: 'animation: ha-hellfire-tint 3s ease-in-out infinite', category: 'visual', icon: '🔥' },
  { id: 'pixel-corrupt', name: 'Pixel Corrupt', description: 'Pixelation corruption glitch', cssKeyframes: '', animationCSS: 'animation: ha-pixel-corrupt 0.3s step-start infinite', category: 'visual', icon: '🖥️' },
  { id: 'void-tear', name: 'Void Tear', description: 'Tears in reality void', cssKeyframes: '', animationCSS: 'animation: ha-void-tear 3s ease-in-out infinite', category: 'visual', icon: '🌌' },
  { id: 'soul-drain', name: 'Soul Drain', description: 'Life color draining away', cssKeyframes: '', animationCSS: 'animation: ha-soul-drain 4s ease-in-out infinite', category: 'visual', icon: '💔' },
  { id: 'blood-moon', name: 'Blood Moon Filter', description: 'Blood moon red sky filter', cssKeyframes: '', animationCSS: 'animation: ha-blood-moon 5s ease-in-out infinite', category: 'visual', icon: '🌕' },
  { id: 'spectral-echo', name: 'Spectral Echo', description: 'Ghost trail echo effect', cssKeyframes: '', animationCSS: 'animation: ha-spectral-echo 2s ease-in-out infinite', category: 'visual', icon: '👁️' },
  { id: 'demon-vision', name: 'Demon Vision', description: 'Seeing through demon eyes', cssKeyframes: '', animationCSS: 'animation: ha-demon-vision 4s ease-in-out infinite', category: 'visual', icon: '👁' },
  { id: 'nightmare-overlay', name: 'Nightmare Overlay', description: 'Nightmare dream overlay', cssKeyframes: '', animationCSS: 'animation: ha-nightmare-overlay 6s ease-in-out infinite', category: 'visual', icon: '🌙' },
  { id: 'laser-eyes', name: 'Laser Eyes Glow', description: 'Glowing laser beam eyes', cssKeyframes: '', animationCSS: 'animation: ha-laser-eyes 1.5s ease-in-out infinite', category: 'visual', icon: '🔴' },
  { id: 'film-grain', name: 'Horror Film Grain', description: 'Old horror movie grain', cssKeyframes: '', animationCSS: 'animation: ha-film-grain 0.1s step-start infinite', category: 'visual', icon: '🎞️' },
  { id: 'mirror-world', name: 'Mirror World Flip', description: 'Flips into mirror dimension', cssKeyframes: '', animationCSS: 'animation: ha-mirror-world 3s step-start infinite', category: 'visual', icon: '🪞' },
  { id: 'hell-warp', name: 'Hell Warp', description: 'Reality warps to hellscape', cssKeyframes: '', animationCSS: 'animation: ha-hell-warp 4s ease-in-out infinite', category: 'visual', icon: '🌋' },
  { id: 'celestial-horror', name: 'Celestial Horror', description: 'Cosmic horror from above', cssKeyframes: '', animationCSS: 'animation: ha-celestial-horror 8s ease-in-out infinite', category: 'visual', icon: '🌠' },
  { id: 'blood-splat', name: 'Blood Splatter', description: 'Blood splatter pulse effect', cssKeyframes: '', animationCSS: 'animation: ha-blood-splat 2s ease-out infinite', category: 'visual', icon: '🩸' },
];

export const ASPECT_RATIOS = [
  { id: '16:9-1080', label: '1920×1080 — Full HD (Standard)', width: 1920, height: 1080, tag: 'Standard' },
  { id: '16:9-1440', label: '2560×1440 — 2K QHD', width: 2560, height: 1440, tag: '2K' },
  { id: '16:9-4k', label: '3840×2160 — 4K UHD', width: 3840, height: 2160, tag: '4K' },
  { id: '16:9-720', label: '1280×720 — HD 720p', width: 1280, height: 720, tag: 'HD' },
  { id: 'twitch', label: '1920×1080 — Twitch Standard', width: 1920, height: 1080, tag: 'Twitch' },
  { id: 'obs-canvas', label: '1920×1080 — OBS Canvas', width: 1920, height: 1080, tag: 'OBS' },
  { id: 'obs-4k', label: '3840×2160 — OBS 4K Canvas', width: 3840, height: 2160, tag: 'OBS 4K' },
  { id: 'tiktok', label: '1080×1920 — TikTok Vertical', width: 1080, height: 1920, tag: 'TikTok' },
  { id: 'tiktok-landscape', label: '1920×1080 — TikTok Landscape', width: 1920, height: 1080, tag: 'TikTok' },
  { id: '4:3-1080', label: '1440×1080 — 4:3 Legacy', width: 1440, height: 1080, tag: '4:3' },
  { id: '21:9-1080', label: '2560×1080 — Ultrawide', width: 2560, height: 1080, tag: 'Ultra' },
  { id: '21:9-1440', label: '3440×1440 — UW QHD', width: 3440, height: 1440, tag: 'Ultra' },
  { id: '1:1-1080', label: '1080×1080 — Square', width: 1080, height: 1080, tag: 'Square' },
  { id: '9:16-1080', label: '1080×1920 — Vertical 9:16', width: 1080, height: 1920, tag: 'Vertical' },
  { id: 'shorts', label: '1080×1920 — YouTube Shorts', width: 1080, height: 1920, tag: 'Shorts' },
  { id: 'insta-reel', label: '1080×1920 — Instagram Reel', width: 1080, height: 1920, tag: 'Reel' },
];

export interface HorrorSound {
  id: string;
  name: string;
  category: 'ambient' | 'effect' | 'music' | 'voice';
  description: string;
}

export const HORROR_SOUNDS: HorrorSound[] = [
  // AMBIENT
  { id: 'deep-drone', name: 'Deep Drone', category: 'ambient', description: 'Low rumbling subsonic drone' },
  { id: 'wind-howl', name: 'Wind Howl', category: 'ambient', description: 'Haunted howling wind' },
  { id: 'thunder-rumble', name: 'Thunder Rumble', category: 'ambient', description: 'Distant rolling thunder' },
  { id: 'cave-drip', name: 'Cave Drips', category: 'ambient', description: 'Eerie cave water drips' },
  { id: 'forest-night', name: 'Forest at Night', category: 'ambient', description: 'Dark forest ambience' },
  { id: 'haunted-room', name: 'Haunted Room', category: 'ambient', description: 'Creaking haunted house' },
  { id: 'inferno', name: 'Hellfire Crackle', category: 'ambient', description: 'Roaring hellfire flames' },
  { id: 'void-hum', name: 'Void Hum', category: 'ambient', description: 'Infinite void resonance' },
  { id: 'dark-water', name: 'Dark Water', category: 'ambient', description: 'Murky deep water sounds' },
  { id: 'ritual-chant', name: 'Ritual Chant', category: 'ambient', description: 'Demonic ritual chanting drone' },
  { id: 'cemetery', name: 'Cemetery Silence', category: 'ambient', description: 'Dead quiet cemetery wind' },
  { id: 'static-loop', name: 'TV Static Loop', category: 'ambient', description: 'Endless TV static noise' },

  // EFFECTS
  { id: 'heartbeat', name: 'Heartbeat', category: 'effect', description: 'Slow creepy heartbeat' },
  { id: 'door-creak', name: 'Door Creak', category: 'effect', description: 'Old door slowly creaking' },
  { id: 'chains', name: 'Chains Rattling', category: 'effect', description: 'Metal chains clanking' },
  { id: 'glass-break', name: 'Glass Shatter', category: 'effect', description: 'Shattering glass burst' },
  { id: 'knife-scrape', name: 'Knife Scrape', category: 'effect', description: 'Metal scraping sound' },
  { id: 'bone-crack', name: 'Bone Crack', category: 'effect', description: 'Sickening bone crunch' },
  { id: 'footsteps', name: 'Dragging Footsteps', category: 'effect', description: 'Heavy dragging steps' },
  { id: 'church-bell', name: 'Funeral Bell', category: 'effect', description: 'Slow tolling death bell' },
  { id: 'thunder-strike', name: 'Thunder Strike', category: 'effect', description: 'Direct lightning strike' },
  { id: 'demon-roar', name: 'Demon Roar', category: 'effect', description: 'Full demon roar explosion' },
  { id: 'blood-drip', name: 'Blood Drip', category: 'effect', description: 'Thick blood dripping' },
  { id: 'electric-zap', name: 'Electric Zap', category: 'effect', description: 'Electric shock zap burst' },

  // MUSIC
  { id: 'dark-piano', name: 'Dark Piano Melody', category: 'music', description: 'Haunting minor key piano' },
  { id: 'horror-strings', name: 'Horror Strings', category: 'music', description: 'Tense orchestral strings swell' },
  { id: 'music-box', name: 'Broken Music Box', category: 'music', description: 'Warped music box tune' },
  { id: 'organ-drone', name: 'Gothic Organ', category: 'music', description: 'Dark cathedral organ drone' },
  { id: 'violin-shriek', name: 'Violin Shriek', category: 'music', description: 'Screeching horror violin' },
  { id: 'cello-deep', name: 'Deep Cello', category: 'music', description: 'Haunting deep cello notes' },
  { id: 'choir-dark', name: 'Dark Choir', category: 'music', description: 'Demonic choral voices' },
  { id: 'synth-horror', name: 'Synth Horror', category: 'music', description: '80s horror synth atmosphere' },
  { id: 'lullaby-horror', name: 'Horror Lullaby', category: 'music', description: 'Creepy twisted lullaby' },
  { id: 'funeral-march', name: 'Funeral March', category: 'music', description: 'Slow funeral procession' },
  { id: 'requiem', name: 'Dark Requiem', category: 'music', description: 'Haunting requiem mass' },
  { id: 'hell-symphony', name: 'Hell Symphony', category: 'music', description: 'Full hellscape orchestral' },

  // VOICES
  { id: 'scream', name: 'Terror Scream', category: 'voice', description: 'Blood-curdling scream' },
  { id: 'growl', name: 'Demonic Growl', category: 'voice', description: 'Deep demonic growl' },
  { id: 'laugh', name: 'Maniacal Laugh', category: 'voice', description: 'Evil maniacal laughter' },
  { id: 'crying', name: 'Ghost Crying', category: 'voice', description: 'Mournful ghost sobbing' },
  { id: 'whisper', name: 'Demonic Whisper', category: 'voice', description: 'Close demonic whisper' },
  { id: 'breathing', name: 'Heavy Breathing', category: 'voice', description: 'Ragged heavy breathing' },
  { id: 'moan', name: 'Death Moan', category: 'voice', description: 'Low death moan groan' },
  { id: 'child-laugh', name: 'Ghost Child Laugh', category: 'voice', description: 'Creepy child laughter' },
  { id: 'speak-evil', name: 'Demonic Speech', category: 'voice', description: 'Backwards demonic speech' },
  { id: 'wail', name: 'Banshee Wail', category: 'voice', description: 'Piercing banshee wail' },
  { id: 'hiss', name: 'Serpent Hiss', category: 'voice', description: 'Demonic serpent hiss' },
  { id: 'howl', name: 'Werewolf Howl', category: 'voice', description: 'Monstrous werewolf howl' },
];

export interface ParticleEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const PARTICLE_EFFECTS: ParticleEffect[] = [
  { id: 'blood-drip', name: 'Blood Dripping', description: 'Blood drips from top', icon: '🩸' },
  { id: 'fire-flakes', name: 'Fire Embers', description: 'Rising fire ember flakes', icon: '🔥' },
  { id: 'ashes', name: 'Falling Ashes', description: 'Dark ash particles fall', icon: '💀' },
  { id: 'fog', name: 'Creeping Fog', description: 'Ground fog wisps', icon: '🌫️' },
  { id: 'sparks', name: 'Evil Sparks', description: 'Red spark bursts', icon: '⚡' },
  { id: 'skulls', name: 'Floating Skulls', description: 'Small skulls float up', icon: '💀' },
  { id: 'tears', name: 'Dark Tears', description: 'Dark tear drops fall', icon: '😭' },
  { id: 'lightning', name: 'Lightning Flashes', description: 'Background lightning', icon: '🌩️' },
];

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  animation: string | null;
  greenScreen: boolean;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
}

export type AnimationMode = 'single' | 'slideshow' | 'all-visible' | 'random-appear';

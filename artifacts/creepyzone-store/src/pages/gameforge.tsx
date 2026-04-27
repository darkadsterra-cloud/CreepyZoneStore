// artifacts/creepyzone-store/src/pages/gameforge.tsx
// Place GameForgeAI.tsx in: artifacts/creepyzone-store/src/components/GameForgeAI.tsx

export default function GameForgePage() {
  return (
    <div className="fixed inset-0 z-40" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* GameForge AI loads as full-screen tool — hides navbar/footer */}
      <GameForgeAI />
    </div>
  );
}

// ─── INLINE COMPONENT (no separate file needed) ───────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "ai";
  html: string;
  code?: string;
  images?: string[];
}

interface UploadedImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

interface SidebarCard {
  icon: string;
  bg: string;
  name: string;
  desc: string;
  tags: [string, string, string][];
  prompt: string;
}

const GENRES = [
  { id: "horror",     label: "☠️ Horror",      color: "#c41e3a" },
  { id: "match3",     label: "💎 Match-3",      color: "#f5c518" },
  { id: "arcade",     label: "👾 Arcade",       color: "#4fc3f7" },
  { id: "puzzle",     label: "🧩 Puzzle",       color: "#00e676" },
  { id: "runner",     label: "🏃 Runner",       color: "#ffb74d" },
  { id: "shooter",    label: "🚀 Shooter",      color: "#c41e3a" },
  { id: "platformer", label: "🎮 Platformer",   color: "#4fc3f7" },
  { id: "rpg",        label: "⚔️ RPG",          color: "#f5c518" },
  { id: "tower",      label: "🏰 Tower Def",    color: "#ce93d8" },
  { id: "idle",       label: "💰 Idle",         color: "#00e676" },
  { id: "racing",     label: "🏎️ Racing",       color: "#ffb74d" },
  { id: "custom",     label: "✨ Custom",        color: "#ce93d8" },
];

const SIDEBAR_DATA: Record<string, SidebarCard[]> = {
  horror: [
    { icon: "👻", bg: "rgba(196,30,58,.18)", name: "Horror Match-3", desc: "Ghosts, skulls, haunted tiles", tags: [["🎵 Music", "rgba(0,230,118,.15)", "#00e676"], ["3000+ Levels", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Match-3 game for CreepyZone: 6 evil tiles (Ghost, Skull, Bat, Spider, Potion, Grimoire), special tiles (Cursed Bomb, Ghost Chain, Witch Hat), 3000+ procedural levels, boss demon every 10 levels, haunted mansion background, creepy ambient music + match SFX (Web Audio API), mobile touch swipe controls, lives system. Single HTML file, sell-ready.` },
    { icon: "🏃", bg: "rgba(196,30,58,.18)", name: "Horror Runner", desc: "Graveyard endless runner", tags: [["📱 Touch", "rgba(79,195,247,.15)", "#7bd4f8"], ["Endless", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Endless Runner for CreepyZone: haunted graveyard, 3 lanes, swipe controls, obstacles (tombstones, bats, zombies), power-ups (Ghost Mode, Shield), worlds (Graveyard→Forest→Castle), creepy BGM + SFX. Single HTML file, sell-ready.` },
    { icon: "🏠", bg: "rgba(196,30,58,.18)", name: "Haunted Idle", desc: "Build your haunted empire", tags: [["💰 Idle", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Haunted House Idle game for CreepyZone: rooms (Dungeon, Crypt, Laboratory, Ghost Tower, Demon Throne), passive Soul Coin income, visitor scare mechanics, offline earnings, prestige system, creepy ambient music. Single HTML file, sell-ready.` },
    { icon: "🔫", bg: "rgba(196,30,58,.18)", name: "Demon Shooter", desc: "Horror wave shooter", tags: [["50 Waves", "rgba(196,30,58,.15)", "#ff6677"], ["Boss", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Horror Wave Shooter for CreepyZone: shoot demons/zombies/ghosts, 50 waves, boss demon every 10 waves, weapons (Holy Water, Silver Bullets, Flamethrower), dark cemetery background, horror music + SFX. Single HTML file, sell-ready.` },
    { icon: "🧩", bg: "rgba(196,30,58,.18)", name: "Haunted Puzzle", desc: "Sokoban in haunted mansion", tags: [["3000+ Levels", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Haunted Mansion Sokoban puzzle for CreepyZone: push coffins onto cursed sigils, 3000+ procedurally generated levels, flickering torch atmosphere, ghost character, eerie ambient music. Single HTML file, sell-ready.` },
    { icon: "🃏", bg: "rgba(196,30,58,.18)", name: "Creep Collector", desc: "Horror card collection", tags: [["Cards", "rgba(206,147,216,.15)", "#ce93d8"]], prompt: `Build a complete Horror Card Collector game for CreepyZone: 9 themed card sets (Vampire, Zombie, Witch, Demon, Ghost, Werewolf, Skeleton, Cursed Artifacts, Dark Rituals), rarities (Common/Rare/Super Rare), card packs, Grand Prize trail, daily login bonus, weekly missions. Single HTML file, sell-ready.` },
  ],
  match3: [
    { icon: "👻", bg: "rgba(245,197,24,.12)", name: "Horror Match-3", desc: "Evil tiles & haunted board", tags: [["☠️ Horror", "rgba(196,30,58,.15)", "#ff6677"], ["3000 Levels", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Horror Match-3: 6 evil tiles, special tiles (Cursed Bomb, Ghost Chain, Witch Hat), 3000+ procedural levels, boss demon every 10 levels, creepy music + SFX, mobile swipe controls, lives system. Single HTML file.` },
    { icon: "💎", bg: "rgba(245,197,24,.12)", name: "Candy Crush Style", desc: "Classic match-3 with combos", tags: [["5000 Levels", "rgba(108,99,255,.15)", "#a89cf7"]], prompt: `Build a complete Candy Crush-style Match-3: 6 gem types, special tiles (bomb, stripe, color blast, jelly), 5000 procedurally generated levels, combo cascade animations, cheerful BGM + pop SFX, mobile swipe/tap, lives system. Single HTML file.` },
    { icon: "🌟", bg: "rgba(245,197,24,.12)", name: "Match Villains Style", desc: "Full meta-game + match-3", tags: [["Meta", "rgba(206,147,216,.15)", "#ce93d8"]], prompt: `Build a complete Match Villains-inspired game: Match-3 core gameplay, Journey map, card collection meta-game (9 sets × 9 cards), Safe Cracker mini-game, Grand Prize trail, Shop, Teams & Leaderboard UI, Battle Pass tiers, daily/weekly Task Station. Single HTML file, sell-ready.` },
  ],
  arcade: [
    { icon: "🐔", bg: "rgba(79,195,247,.12)", name: "Chicken Invaders Style", desc: "Space shooter wave game", tags: [["50 Waves", "rgba(196,30,58,.15)", "#ff6677"], ["Boss", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Chicken Invaders-style arcade shooter: player spaceship shoots upward, 50 waves of alien chickens in formations, boss every 10 waves, power-ups, 3 lives, high score. Animated sprites, explosion particles, parallax starfield, chiptune BGM + SFX, mobile touch. Single HTML file, sell-ready.` },
    { icon: "👾", bg: "rgba(79,195,247,.12)", name: "Galaga Style", desc: "Formation dive attacks", tags: [["Chiptune", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Galaga-style arcade game: formation enemies that dive-bomb the player, enemy capture mechanic (tractor beam), 50 stages, challenge bonus stages, dual-ship mode, 8-bit chiptune music. Single HTML file.` },
    { icon: "🧱", bg: "rgba(79,195,247,.12)", name: "Breakout Style", desc: "Ball, paddle & bricks", tags: [["500 Levels", "rgba(108,99,255,.15)", "#a89cf7"]], prompt: `Build a complete Breakout/Arkanoid game: ball, paddle, procedural brick levels (500+ layouts), special bricks (hard, explosive, unbreakable, moving), power-ups (multi-ball, wide paddle, laser, slow, magnet), boss levels. Mobile: drag to move paddle. Single HTML file.` },
  ],
  puzzle: [
    { icon: "☠️", bg: "rgba(0,230,118,.1)", name: "Horror Sokoban", desc: "Push coffins in haunted mansion", tags: [["3000+ Levels", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Sokoban: push coffins onto cursed sigils, 3000+ procedurally generated solvable levels, haunted mansion with torch flicker, undo button, eerie ambient music. Single HTML file.` },
    { icon: "🔗", bg: "rgba(0,230,118,.1)", name: "Pipe Connect", desc: "Connect flows without overlap", tags: [["Infinite", "rgba(0,230,118,.15)", "#00e676"]], prompt: `Build a complete pipe connection puzzle game: connect colored endpoints on growing grids (5x5 to 12x12), procedural generation, timer mode, relaxed mode, satisfying completion animation, mobile touch. Single HTML file.` },
    { icon: "💡", bg: "rgba(0,230,118,.1)", name: "Logic Puzzle Pack", desc: "5 puzzle types in one", tags: [["Variety", "rgba(206,147,216,.15)", "#ce93d8"]], prompt: `Build a complete logic puzzle collection: 5 puzzle types (Sudoku-light, nonogram, maze, sliding tiles, pattern match), 100+ levels per type, calm ambient music, mobile-optimized touch. Single HTML file.` },
  ],
  runner: [
    { icon: "💀", bg: "rgba(255,183,77,.12)", name: "Horror Endless Runner", desc: "Graveyard survival run", tags: [["Endless", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Endless Runner: haunted graveyard, 3 lanes, swipe controls, obstacles (tombstones, bats, zombies), collectibles (skulls, candles), power-ups (Ghost Mode, Shield), worlds (Graveyard→Forest→Castle), creepy BGM. Single HTML file.` },
    { icon: "🦸", bg: "rgba(255,183,77,.12)", name: "Temple Run Style", desc: "3-lane endless runner", tags: [["Swipe", "rgba(79,195,247,.15)", "#7bd4f8"]], prompt: `Build a complete Temple Run / Subway Surfers style endless runner: 3 lanes, swipe controls, power-ups (magnet, shield, multiplier, jetpack), multiple themes, BGM + SFX, high score. Single HTML file.` },
  ],
  shooter: [
    { icon: "🚀", bg: "rgba(196,30,58,.12)", name: "Space Shooter", desc: "Bullet hell wave shooter", tags: [["100 Waves", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete space shooter: player ship, 100 waves of aliens, boss every 10 waves, power-ups, sci-fi BGM + laser/explosion SFX, parallax starfield, mobile touch. Single HTML file.` },
    { icon: "💀", bg: "rgba(196,30,58,.12)", name: "Demon Shooter", desc: "Horror wave shooter", tags: [["Horror", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Wave Shooter for CreepyZone: shoot demons/zombies/ghosts, 50 waves, boss every 10 waves, weapons (Holy Water, Silver Bullets, Flamethrower), dark cemetery background, horror music. Single HTML file.` },
    { icon: "✈️", bg: "rgba(196,30,58,.12)", name: "1942 Vertical", desc: "Top-down scrolling shooter", tags: [["100 Waves", "rgba(79,195,247,.15)", "#7bd4f8"]], prompt: `Build a complete 1942-style vertical scrolling shooter: war plane, scrolling battlefield, 100 waves, barrel roll dodge, boss warships, wingman power-up, war march BGM + SFX, mobile drag to move. Single HTML file.` },
  ],
  platformer: [
    { icon: "👻", bg: "rgba(79,195,247,.12)", name: "Horror Platformer", desc: "Side-scroller horror theme", tags: [["3000 Levels", "rgba(108,99,255,.15)", "#a89cf7"]], prompt: `Build a complete Horror Side-Scrolling Platformer for CreepyZone: ghost character, run/jump/double-jump/dash, 3000+ procedural levels, enemy types (zombies, bats, demons, mini-boss), horror chiptune BGM, mobile virtual joystick. Single HTML file.` },
    { icon: "🎮", bg: "rgba(79,195,247,.12)", name: "Classic Platformer", desc: "Mario-style jump and run", tags: [["3000 Levels", "rgba(108,99,255,.15)", "#a89cf7"]], prompt: `Build a complete Mario-style platformer: run and jump, double-jump, 3000+ procedural levels, enemies, coins, power-ups, parallax background, chiptune BGM, mobile virtual joystick. Single HTML file.` },
  ],
  rpg: [
    { icon: "⚔️", bg: "rgba(245,197,24,.12)", name: "Horror RPG", desc: "Dark dungeon crawler", tags: [["Infinite", "rgba(0,230,118,.15)", "#00e676"]], prompt: `Build a complete Horror Dungeon Crawler RPG for CreepyZone: top-down, BSP procedural dungeons, 8 monster types, turn-based combat, equipment system, level up, fog of war, dark atmospheric BGM, save/load localStorage. Single HTML file.` },
    { icon: "🗺️", bg: "rgba(245,197,24,.12)", name: "Classic RPG", desc: "Stats, dungeons, loot", tags: [["Procedural", "rgba(206,147,216,.15)", "#ce93d8"]], prompt: `Build a complete top-down RPG: procedural dungeons, turn-based combat, 5 enemy types, equipment, level up, mini-map, save/load, orchestral BGM. Single HTML file.` },
  ],
  tower: [
    { icon: "🏰", bg: "rgba(206,147,216,.15)", name: "Horror Tower Defense", desc: "Defend against undead waves", tags: [["100 Waves", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Tower Defense for CreepyZone: defend haunted mansion, tower types (Silver Cannon, Holy Fire, Ghost Trap, Demon Summoner), 100 waves, gold economy, tower upgrades (3 tiers), A* pathfinding, dark BGM + SFX, mobile touch. Single HTML file.` },
    { icon: "🏯", bg: "rgba(206,147,216,.15)", name: "Classic Tower Defense", desc: "Strategic placement", tags: [["100 Waves", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Tower Defense: 4 tower types (Arrow, Cannon, Magic, Freeze), 5 enemy types, 100 waves, gold economy, upgrade system (3 tiers), A* pathfinding, BGM + SFX, mobile touch. Single HTML file.` },
  ],
  idle: [
    { icon: "👻", bg: "rgba(0,230,118,.1)", name: "Haunted House Idle", desc: "Build your horror empire", tags: [["Idle", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Build a complete Haunted House Idle for CreepyZone: rooms (Dungeon, Crypt, Laboratory, Ghost Tower, Demon Throne), Soul Coin passive income, visitor scare mechanics, offline earnings, prestige system, creepy ambient music. Single HTML file.` },
    { icon: "💰", bg: "rgba(0,230,118,.1)", name: "Cookie Clicker Style", desc: "Classic incremental idle", tags: [["Incremental", "rgba(0,230,118,.15)", "#00e676"]], prompt: `Build a complete idle clicker: click to earn, passive buildings, upgrades, milestones, achievements, offline progress, prestige system, ambient BGM. Single HTML file.` },
  ],
  racing: [
    { icon: "🏎️", bg: "rgba(255,183,77,.12)", name: "Horror Kart Racing", desc: "Race in haunted environments", tags: [["Horror", "rgba(196,30,58,.15)", "#ff6677"]], prompt: `Build a complete Horror Kart Racing for CreepyZone: top-down racing through haunted environments (Cemetery, Demon Highway, Haunted Forest), power-ups (Oil Slick, Ghost Boost, Curse Bomb), AI ghost karts, best time, creepy racing BGM. Single HTML file.` },
    { icon: "🚗", bg: "rgba(255,183,77,.12)", name: "Top-Down Racer", desc: "Classic racing game", tags: [["50 Tracks", "rgba(79,195,247,.15)", "#7bd4f8"]], prompt: `Build a complete top-down racing game: procedural tracks (50+ layouts), AI opponents, power-ups (turbo, oil slick, shield), lap counter, best time, fast BGM + engine SFX, mobile drag-to-steer. Single HTML file.` },
  ],
  custom: [
    { icon: "👁️", bg: "rgba(206,147,216,.15)", name: "From Screenshot", desc: "Upload image → analyze & build", tags: [["Vision AI", "rgba(206,147,216,.15)", "#ce93d8"]], prompt: `Upload a screenshot of any game — I will analyze its mechanics, genre, UI patterns, and progression system, then build a complete new game in that exact style with CreepyZone horror theme or your specified theme.` },
    { icon: "🎨", bg: "rgba(206,147,216,.15)", name: "Custom Idea", desc: "Describe anything", tags: [["Open", "rgba(255,183,77,.15)", "#ffcc80"]], prompt: `Describe your custom game idea in detail and I will build it completely. Include: game type, theme, mechanics, special features, and target platform.` },
    { icon: "🖼️", bg: "rgba(206,147,216,.15)", name: "Thumbnail Generator", desc: "App store icon + banner", tags: [["PNG Download", "rgba(245,197,24,.12)", "#ffd700"]], prompt: `Generate a professional 512x512 horror game thumbnail for CreepyZone using HTML5 Canvas: pitch black background with deep red glow, terrifying monster drawn with Canvas shapes, glowing CREEPYZONE title with drip effect. Include a Download PNG button.` },
  ],
};

const SYSTEM_PROMPT = `You are CreepyZone GameForge AI — the ultimate game development agent for CreepyZone Store (creepy-zone-store.vercel.app).

You build COMPLETE, production-ready browser games as single HTML files covering ALL genres: horror, match-3, arcade, puzzle, runner, shooter, platformer, RPG, tower defense, idle, racing.
CreepyZone's PRIMARY theme is HORROR — default to horror aesthetics when no theme specified.

VISION / IMAGE ANALYSIS: When images are provided, identify GAME GENRE, KEY MECHANICS, UI PATTERNS, MONETIZATION PATTERNS, then build a NEW game with those mechanics + CreepyZone horror theme.

MANDATORY REQUIREMENTS:
- GRAPHICS: All Canvas-drawn sprites, particle effects, parallax backgrounds. Horror palette: #0a0a0f bg, #c41e3a accent.
- AUDIO: Web Audio API looping BGM + horror SFX (ghost wail, chains, heartbeat). Adaptive intensity.
- LEVELS: Seed-based RNG procedural generation, 3000+ unique levels.
- MOBILE: Touch controls, responsive canvas, no scroll interference.
- STRUCTURE: Main menu → Gameplay + HUD → Pause menu → Level complete → Game over → High scores (localStorage).

RESPONSE FORMAT:
1. Brief description of what you built
2. Complete HTML game in html code block
3. ✅ Features list (6 items)
4. 💡 Extend this by: (3 ideas)

Always respond in English. Make games genuinely fun, complete, and impressive.`;

function GameForgeAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [genre, setGenre] = useState("horror");
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [history, setHistory] = useState<{ role: string; content: unknown }[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, busy]);

  const autoResize = () => {
    if (textRef.current) {
      textRef.current.style.height = "auto";
      textRef.current.style.height = Math.min(textRef.current.scrollHeight, 140) + "px";
    }
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploads((prev) => [...prev, { dataUrl, base64: dataUrl.split(",")[1], mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeUpload = (i: number) => setUploads((prev) => prev.filter((_, idx) => idx !== i));

  const insertQ = useCallback((text: string) => {
    setInput(text);
    textRef.current?.focus();
    setTimeout(autoResize, 0);
  }, []);

  const downloadCode = (code: string) => {
    const blob = new Blob([code], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "creepyzone-game.html";
    a.click();
  };

  const copyCode = async (code: string, btn: HTMLButtonElement) => {
    await navigator.clipboard.writeText(code);
    btn.textContent = "✓ Copied!";
    setTimeout(() => { btn.textContent = "Copy"; }, 2000);
  };

  const send = async () => {
    if (busy || (!input.trim() && uploads.length === 0)) return;
    const text = input.trim();
    const hasImages = uploads.length > 0;
    const displayText = text || `[Uploaded ${uploads.length} screenshot(s) for analysis]`;

    let userContent: unknown;
    if (hasImages) {
      const parts: unknown[] = uploads.map((img) => ({
        type: "image",
        source: { type: "base64", media_type: img.mimeType, data: img.base64 },
      }));
      parts.push({ type: "text", text: text ? `${text}\n\nGenre context: ${genre}.` : `Analyze these game screenshots and build a new game with CreepyZone horror theme. Genre: ${genre}.` });
      userContent = parts;
    } else {
      userContent = `${text}\n\n[Genre: ${genre}]`;
    }

    setMessages((prev) => [...prev, { role: "user", html: displayText, images: hasImages ? uploads.map((u) => u.dataUrl) : undefined }]);
    setInput("");
    setUploads([]);
    setBusy(true);

    const newHistory = [...history, { role: "user", content: userContent }];
    setHistory(newHistory);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, system: SYSTEM_PROMPT, messages: newHistory }),
      });
      const data = await res.json();
      const reply: string = data.content[0].text;
      const codeMatch = reply.match(/```(?:html|javascript|js)?\n?([\s\S]*?)```/i);
      const code = codeMatch ? codeMatch[1].trim() : undefined;
      const cleanHtml = reply.replace(/```[\s\S]*?```/gi, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>").trim();
      setMessages((prev) => [...prev, { role: "ai", html: cleanHtml, code }]);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", html: "Connection error. Please try again." }]);
    }
    setBusy(false);
  };

  const currentCards = SIDEBAR_DATA[genre] || SIDEBAR_DATA.horror;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#07080d", color:"#eef0f8", fontFamily:"'Nunito','Segoe UI',sans-serif", overflow:"hidden" }}>
      {/* TOPBAR */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"0 20px", height:58, flexShrink:0, background:"#111420", borderBottom:"1px solid #1e2235", boxShadow:"0 2px 20px rgba(196,30,58,.12)" }}>
        <div style={{ fontSize:22, fontWeight:900, letterSpacing:1, color:"#c41e3a", textShadow:"0 0 18px rgba(196,30,58,.4)" }}>
          Creepy<span style={{ color:"#f5c518" }}>Zone</span> <span style={{ fontSize:14, color:"#5a6080", fontWeight:600 }}>GameForge AI</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:"rgba(206,147,216,.08)", border:"1px solid rgba(206,147,216,.22)", color:"#ce93d8" }}>👁️ Vision ON</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:"rgba(0,230,118,.08)", border:"1px solid rgba(0,230,118,.22)", color:"#00e676" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#00e676", animation:"pulse 2s infinite" }} />
          Agent Online
        </div>
        <div style={{ padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:700, background:"rgba(79,195,247,.06)", border:"1px solid rgba(79,195,247,.2)", color:"#4fc3f7", fontFamily:"monospace" }}>claude-sonnet-4</div>
      </div>

      {/* GENRE TABS */}
      <div style={{ display:"flex", overflowX:"auto", flexShrink:0, background:"#0c0e16", borderBottom:"1px solid #1e2235" }}>
        {GENRES.map((g) => (
          <button key={g.id} onClick={() => setGenre(g.id)} style={{ padding:"9px 16px", fontSize:11, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer", borderBottom: genre===g.id ? `2px solid ${g.color}` : "2px solid transparent", color: genre===g.id ? g.color : "#5a6080", background:"none", border:"none", borderBottom: genre===g.id ? `2px solid ${g.color}` : "2px solid transparent", borderRight:"1px solid #1e2235", flexShrink:0, transition:".15s", paddingTop:9, paddingBottom:9 }}>
            {g.label}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* SIDEBAR */}
        <div style={{ width:220, flexShrink:0, background:"#111420", borderRight:"1px solid #1e2235", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 14px 8px", fontSize:9, fontWeight:800, letterSpacing:2, textTransform:"uppercase", color:"#353a55", borderBottom:"1px solid #1e2235" }}>Templates</div>
          <div style={{ flex:1, overflowY:"auto", padding:6 }}>
            {currentCards.map((card, i) => (
              <div key={i} onClick={() => insertQ(card.prompt)} style={{ padding:"9px 11px", borderRadius:8, cursor:"pointer", border:"1px solid transparent", marginBottom:2, transition:".15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#161928"; (e.currentTarget as HTMLDivElement).style.borderColor = "#252a40"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <div style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, background:card.bg }}>{card.icon}</div>
                  <div style={{ fontSize:11, fontWeight:700 }}>{card.name}</div>
                </div>
                <div style={{ fontSize:10, color:"#5a6080", marginLeft:36, lineHeight:1.3 }}>{card.desc}</div>
                <div style={{ display:"flex", gap:3, marginLeft:36, marginTop:4, flexWrap:"wrap" }}>
                  {card.tags.map(([label, bg, color], ti) => (
                    <span key={ti} style={{ padding:"1px 6px", borderRadius:3, fontSize:9, fontWeight:700, background:bg, color }}>{label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORKSPACE */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* CHAT */}
          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:16 }}>
            {messages.length === 0 && (
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, background:"rgba(196,30,58,.15)", border:"1px solid rgba(196,30,58,.3)" }}>👻</div>
                <div style={{ maxWidth:"80%", padding:"18px 20px", background:"#111420", border:"1px solid #1e2235", borderRadius:"10px 10px 10px 2px" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:"#c41e3a", textShadow:"0 0 16px rgba(196,30,58,.35)", marginBottom:5 }}>Creepy<span style={{ color:"#f5c518" }}>Zone</span> GameForge</div>
                  <div style={{ fontSize:12, color:"#5a6080", lineHeight:1.6, marginBottom:12 }}>
                    Ultimate AI game agent for <strong style={{ color:"#c41e3a" }}>CreepyZone Store</strong>.<br/>
                    Upload ANY game screenshot — I analyze it and build a new game in that style with your theme.
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    {[["👁️ Vision Analysis","rgba(206,147,216,.12)","#ce93d8","Upload any game screenshot — I read genre, mechanics, UI and rebuild it"],["☠️ Horror Priority","rgba(196,30,58,.12)","#c41e3a","CreepyZone dark theme built-in — ghosts, haunted mechanics, blood-red atmosphere"],["🎵 Full Audio","rgba(0,230,118,.1)","#00e676","Creepy ambient music + horror SFX via Web Audio API — no files needed"],["📱 Sell Ready","rgba(79,195,247,.1)","#4fc3f7","Download HTML → APK guide → Gumroad & Play Store ready"]].map(([title, bg, color, desc]) => (
                      <div key={title as string} style={{ padding:"10px 12px", background:bg as string, border:`1px solid ${(bg as string).replace(".1)", ".2)")}`, borderRadius:8 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:color as string, marginBottom:3 }}>{title as string}</div>
                        <div style={{ fontSize:10, color:"#5a6080", lineHeight:1.4 }}>{desc as string}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display:"flex", gap:12, flexDirection: msg.role==="user" ? "row-reverse" : "row" }}>
                <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize: msg.role==="ai" ? 14 : 11, fontWeight:800, background: msg.role==="ai" ? "rgba(196,30,58,.15)" : "rgba(245,197,24,.1)", border: msg.role==="ai" ? "1px solid rgba(196,30,58,.3)" : "1px solid rgba(245,197,24,.2)", color: msg.role==="ai" ? "#c41e3a" : "#f5c518" }}>
                  {msg.role==="ai" ? "👻" : "YOU"}
                </div>
                <div style={{ maxWidth:"74%", padding:"12px 16px", borderRadius: msg.role==="ai" ? "10px 10px 10px 2px" : "10px 10px 2px 10px", fontSize:13, lineHeight:1.7, background: msg.role==="ai" ? "#111420" : "rgba(196,30,58,.07)", border: msg.role==="ai" ? "1px solid #1e2235" : "1px solid rgba(196,30,58,.18)" }}>
                  {msg.images && <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>{msg.images.map((src,ii) => <img key={ii} src={src} style={{ width:60, height:60, borderRadius:6, objectFit:"cover", border:"1px solid #252a40" }} alt="" />)}</div>}
                  <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                  {msg.code && (
                    <>
                      <div style={{ marginTop:12, borderRadius:8, overflow:"hidden", border:"1px solid #252a40" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", background:"#0d1117", flexWrap:"wrap", gap:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                            <span style={{ padding:"2px 8px", borderRadius:4, fontSize:9, fontWeight:700, fontFamily:"monospace", background:"rgba(196,30,58,.15)", color:"#c41e3a", border:"1px solid rgba(196,30,58,.2)" }}>HTML+JS GAME</span>
                            <span style={{ padding:"2px 8px", borderRadius:4, fontSize:9, fontWeight:700, fontFamily:"monospace", background:"rgba(0,230,118,.1)", color:"#00e676", border:"1px solid rgba(0,230,118,.2)" }}>🎵 Music</span>
                            <span style={{ padding:"2px 8px", borderRadius:4, fontSize:9, fontWeight:700, fontFamily:"monospace", background:"rgba(79,195,247,.08)", color:"#7bd4f8", border:"1px solid rgba(79,195,247,.2)" }}>📱 Mobile</span>
                            <span style={{ fontSize:10, color:"#5a6080", fontFamily:"monospace" }}>Open in browser</span>
                          </div>
                          <button onClick={(e) => copyCode(msg.code!, e.currentTarget)} style={{ padding:"4px 12px", background:"#161928", border:"1px solid #252a40", borderRadius:4, color:"#5a6080", fontSize:10, cursor:"pointer", fontFamily:"monospace" }}>Copy</button>
                        </div>
                        <pre style={{ background:"#07090f", padding:14, fontFamily:"monospace", fontSize:11, lineHeight:1.75, color:"#e6edf3", maxHeight:220, overflowY:"auto", whiteSpace:"pre-wrap", wordBreak:"break-all", margin:0 }}>{msg.code}</pre>
                      </div>
                      <div style={{ marginTop:10, padding:"12px 14px", background:"linear-gradient(135deg,rgba(196,30,58,.06),rgba(245,197,24,.03))", border:"1px solid rgba(196,30,58,.18)", borderRadius:9 }}>
                        <div style={{ fontSize:10, fontWeight:800, color:"#c41e3a", letterSpacing:1, marginBottom:8, textTransform:"uppercase" }}>⚡ Download & Publish</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                          {[["⬇️","Download HTML","Play in browser","rgba(79,195,247,.07)","rgba(79,195,247,.22)","#7bd4f8",() => downloadCode(msg.code!)],["📱","PWA Install","Add to homescreen","rgba(0,230,118,.06)","rgba(0,230,118,.2)","#5ef5a8",()=>{}],["🤖","APK Guide","Google Play","rgba(255,183,77,.07)","rgba(255,183,77,.2)","#ffcc80",()=>insertQ("Give me exact steps to convert my HTML game to Android APK using Capacitor.")],["🖼️","Thumbnail","App store icon","rgba(245,197,24,.06)","rgba(245,197,24,.2)","#ffe066",()=>insertQ("Generate a 512x512 horror game thumbnail for CreepyZone using Canvas. Include Download PNG button.")],["💰","Gumroad","Sell today","rgba(196,30,58,.09)","rgba(196,30,58,.22)","#ff8899",()=>insertQ("Give me a complete Gumroad listing guide for my CreepyZone horror game.")],["▶️","Play Store","Submit guide","rgba(0,230,118,.06)","rgba(0,230,118,.18)","#66ffbb",()=>insertQ("Give me the Google Play Store submission checklist for my CreepyZone horror game.")]].map(([icon,label,sub,bg,border,color,onClick]) => (
                            <button key={label as string} onClick={onClick as ()=>void} style={{ padding:"8px 6px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", border:`1px solid ${border}`, background:bg as string, color:color as string, display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:".15s" }}>
                              <span style={{ fontSize:15 }}>{icon as string}</span>
                              {label as string}
                              <small style={{ fontSize:9, opacity:.7 }}>{sub as string}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, background:"rgba(196,30,58,.15)", border:"1px solid rgba(196,30,58,.3)" }}>👻</div>
                <div style={{ display:"flex", gap:5, padding:"12px 16px", background:"#111420", border:"1px solid #1e2235", borderRadius:"10px 10px 10px 2px" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#c41e3a", animation:`blink 1.3s ${i*.2}s infinite` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding:"13px 20px 15px", background:"#111420", borderTop:"1px solid #1e2235", flexShrink:0 }}>
            {uploads.length > 0 && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                {uploads.map((u, i) => (
                  <div key={i} style={{ position:"relative" }}>
                    <img src={u.dataUrl} style={{ width:50, height:50, borderRadius:6, objectFit:"cover", border:"1px solid rgba(196,30,58,.3)" }} alt="" />
                    <button onClick={() => removeUpload(i)} style={{ position:"absolute", top:-5, right:-5, width:16, height:16, background:"#c41e3a", borderRadius:"50%", border:"none", color:"#fff", fontSize:9, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:9 }}>
              {[["☠️ Horror Match-3", SIDEBAR_DATA.horror[0].prompt],["👻 Horror Runner",SIDEBAR_DATA.horror[1].prompt],["💀 Demon Shooter",SIDEBAR_DATA.horror[3].prompt],["🌟 Match Villains",SIDEBAR_DATA.match3[2].prompt],["🏠 Haunted Idle",SIDEBAR_DATA.horror[2].prompt],["🖼️ Thumbnail","Generate a 512x512 horror game thumbnail for CreepyZone using HTML5 Canvas. Include a Download PNG button."]].map(([label, prompt]) => (
                <button key={label as string} onClick={() => insertQ(prompt as string)} style={{ padding:"5px 11px", background:"#161928", border:"1px solid #252a40", borderRadius:20, fontSize:11, fontWeight:600, color:"#5a6080", cursor:"pointer", transition:".15s", whiteSpace:"nowrap" }}
                  onMouseEnter={e => { (e.currentTarget).style.borderColor="#c41e3a"; (e.currentTarget).style.color="#c41e3a"; }}
                  onMouseLeave={e => { (e.currentTarget).style.borderColor="#252a40"; (e.currentTarget).style.color="#5a6080"; }}>
                  {label as string}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
              <div style={{ flex:1, position:"relative" }}>
                <textarea ref={textRef} value={input} onChange={e => { setInput(e.target.value); autoResize(); }} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
                  placeholder='Describe your game idea or upload screenshots... e.g. "Build a horror Match-3 with ghosts and haunted mansion"'
                  rows={1}
                  style={{ width:"100%", background:"#161928", border:"1.5px solid #252a40", borderRadius:10, padding:"11px 44px 11px 16px", fontFamily:"inherit", fontSize:13, color:"#eef0f8", resize:"none", outline:"none", minHeight:46, maxHeight:140, lineHeight:1.5 }}
                />
                <div onClick={() => fileRef.current?.click()} title="Upload screenshots" style={{ position:"absolute", right:10, bottom:10, width:28, height:28, background:"#111420", border:"1px solid #252a40", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#5a6080" }}>📎</div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} style={{ display:"none" }} />
              </div>
              <button onClick={send} disabled={busy} style={{ width:46, height:46, background:busy?"#5a1a2a":"#c41e3a", border:"none", borderRadius:10, color:"#fff", fontSize:18, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 14px rgba(196,30,58,.3)", transition:".15s" }}>▶</button>
            </div>
            <div style={{ fontSize:11, color:"#353a55", marginTop:7, display:"flex", gap:14, flexWrap:"wrap" }}>
              <span><kbd style={{ padding:"1px 6px", background:"#161928", border:"1px solid #252a40", borderRadius:4, fontFamily:"monospace", fontSize:10, color:"#5a6080" }}>Enter</kbd> send</span>
              <span><kbd style={{ padding:"1px 6px", background:"#161928", border:"1px solid #252a40", borderRadius:4, fontFamily:"monospace", fontSize:10, color:"#5a6080" }}>Shift+Enter</kbd> newline</span>
              <span>📎 Upload screenshots for vision analysis</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(0,230,118,.4)}50%{box-shadow:0 0 0 5px rgba(0,230,118,0)}}@keyframes blink{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}`}</style>
    </div>
  );
}

let sharedCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioContext();
    masterGainNode = sharedCtx.createGain();
    masterGainNode.gain.value = 0.35;
    masterGainNode.connect(sharedCtx.destination);
  }
  if (sharedCtx.state === 'suspended') sharedCtx.resume();
  return sharedCtx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGainNode!;
}

type SoundNodes = { stop: () => void };
const active = new Map<string, SoundNodes>();

// ── helpers ────────────────────────────────────────────────────────────────

function makeOsc(ctx: AudioContext, type: OscillatorType, freq: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

function makeGain(ctx: AudioContext, val: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = val;
  return g;
}

function makeNoise(ctx: AudioContext, seconds = 2, tinted = false): AudioBufferSourceNode {
  const sr = ctx.sampleRate;
  const len = sr * seconds;
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (tinted) {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + w * 0.5362) * 0.11;
    } else {
      d[i] = w;
    }
  }
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
}

function chain(...nodes: AudioNode[]): void {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
}

// ── sound builders ─────────────────────────────────────────────────────────

function buildDeepDrone(ctx: AudioContext): SoundNodes {
  const g = makeGain(ctx, 0);
  const o1 = makeOsc(ctx, 'sawtooth', 40);
  const o2 = makeOsc(ctx, 'sine', 40.5);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 200;
  chain(o1, f, g, getMaster());
  chain(o2, f);
  g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2);
  o1.start(); o2.start();
  return { stop: () => { try { g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1); setTimeout(() => { o1.stop(); o2.stop(); }, 1100); } catch {} } };
}

function buildWindHowl(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 3, true);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.5;
  const g = makeGain(ctx, 0);
  const lfo = makeOsc(ctx, 'sine', 0.3);
  const lfoG = makeGain(ctx, 300);
  chain(lfo, lfoG);
  lfoG.connect(f.frequency);
  chain(noise, f, g, getMaster());
  g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
  noise.start(); lfo.start();
  return { stop: () => { try { g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); setTimeout(() => { noise.stop(); lfo.stop(); }, 1600); } catch {} } };
}

function buildThunder(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 4, true);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 150;
  const g = makeGain(ctx, 0);
  chain(noise, f, g, getMaster());
  // periodic rumble
  const rumble = () => {
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.6, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.1, t + 1.5);
    g.gain.linearRampToValueAtTime(0, t + 3);
  };
  noise.start();
  rumble();
  const interval = setInterval(rumble, 4000);
  return { stop: () => { clearInterval(interval); try { noise.stop(); } catch {} } };
}

function buildHeartbeat(ctx: AudioContext): SoundNodes {
  let running = true;
  const beat = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const o1 = makeOsc(ctx, 'sine', 60);
    const o2 = makeOsc(ctx, 'sine', 58);
    const g1 = makeGain(ctx, 0);
    const g2 = makeGain(ctx, 0);
    o1.connect(g1); g1.connect(getMaster());
    o2.connect(g2); g2.connect(getMaster());
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.7, t + 0.04);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    g2.gain.setValueAtTime(0, t + 0.28);
    g2.gain.linearRampToValueAtTime(0.5, t + 0.32);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
    o1.start(t); o1.stop(t + 0.3);
    o2.start(t + 0.28); o2.stop(t + 0.6);
    setTimeout(beat, 1200);
  };
  beat();
  return { stop: () => { running = false; } };
}

function buildDoorCreak(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sawtooth', 300);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 800;
  chain(osc, f, g, getMaster());
  const creak = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(600, t + 1.5);
    osc.frequency.linearRampToValueAtTime(250, t + 3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.3);
    g.gain.setValueAtTime(0.25, t + 2.5);
    g.gain.linearRampToValueAtTime(0, t + 3.5);
  };
  osc.start();
  creak();
  const iv = setInterval(creak, 5000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); } catch {} } };
}

function buildScream(ctx: AudioContext): SoundNodes {
  // Screams: formant synthesis with rapid freq sweeps
  let running = true;
  const doScream = () => {
    if (!running) return;
    const t = ctx.currentTime;
    // Multiple harmonics for realistic scream
    const freqs = [1200, 2400, 3600];
    const oNodes: OscillatorNode[] = [];
    freqs.forEach((f, i) => {
      const o = makeOsc(ctx, 'sawtooth', f);
      const g = makeGain(ctx, 0);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = f;
      filter.Q.value = 3;
      o.connect(filter); filter.connect(g); g.connect(getMaster());
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3 / (i + 1), t + 0.08);
      o.frequency.linearRampToValueAtTime(f * 1.5, t + 0.2);
      o.frequency.linearRampToValueAtTime(f * 0.7, t + 0.7);
      o.frequency.linearRampToValueAtTime(f * 1.2, t + 1.0);
      g.gain.linearRampToValueAtTime(0, t + 1.5);
      o.start(t); o.stop(t + 1.6);
      oNodes.push(o);
    });
    setTimeout(() => { if (running) doScream(); }, 3500);
  };
  doScream();
  return { stop: () => { running = false; } };
}

function buildGrowl(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sawtooth', 60);
  const noise = makeNoise(ctx, 4, true);
  const dist = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (3 + 100) * x / (Math.PI + 100 * Math.abs(x));
  }
  dist.curve = curve;
  const g = makeGain(ctx, 0);
  const noiseG = makeGain(ctx, 0.2);
  chain(osc, dist, g, getMaster());
  chain(noise, noiseG, g);
  // growl envelope
  const growl = () => {
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.3);
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.5);
    osc.frequency.linearRampToValueAtTime(45, t + 1.5);
    g.gain.linearRampToValueAtTime(0, t + 2);
  };
  osc.start(); noise.start(); growl();
  const iv = setInterval(growl, 3000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); noise.stop(); } catch {} } };
}

function buildLaugh(ctx: AudioContext): SoundNodes {
  let running = true;
  const laugh = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const syllables = 8;
    for (let i = 0; i < syllables; i++) {
      const start = t + i * 0.18;
      const o = makeOsc(ctx, 'sawtooth', 220 + Math.random() * 80);
      const g = makeGain(ctx, 0);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 2;
      o.connect(f); f.connect(g); g.connect(getMaster());
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.35, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.01, start + 0.15);
      o.start(start); o.stop(start + 0.18);
    }
    setTimeout(laugh, 3500);
  };
  laugh();
  return { stop: () => { running = false; } };
}

function buildCrying(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sine', 300);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 2;
  chain(osc, f, g, getMaster());
  const cry = () => {
    const t = ctx.currentTime;
    // sob cycles
    for (let i = 0; i < 6; i++) {
      const st = t + i * 0.8;
      osc.frequency.setValueAtTime(350, st);
      osc.frequency.linearRampToValueAtTime(200, st + 0.4);
      osc.frequency.linearRampToValueAtTime(280, st + 0.7);
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(0.3, st + 0.05);
      g.gain.linearRampToValueAtTime(0, st + 0.7);
    }
  };
  osc.start(); cry();
  const iv = setInterval(cry, 5000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); } catch {} } };
}

function buildDarkPiano(ctx: AudioContext): SoundNodes {
  // Real piano-like: use sine + harmonics with attack/decay
  let running = true;
  const pianoNote = (freq: number, delay: number) => {
    if (!running) return;
    const t = ctx.currentTime + delay;
    const harmonics = [1, 2, 3, 4];
    harmonics.forEach((h, i) => {
      const o = makeOsc(ctx, 'sine', freq * h);
      const g = makeGain(ctx, 0);
      o.connect(g); g.connect(getMaster());
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.25 / (h * h), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2 - i * 0.2);
      o.start(t); o.stop(t + 2.1);
    });
  };
  // A minor arpeggio: A3, C4, E4, G4
  const melody = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63];
  let step = 0;
  const playNext = () => {
    if (!running) return;
    pianoNote(melody[step % melody.length], 0);
    step++;
    setTimeout(playNext, 700);
  };
  playNext();
  return { stop: () => { running = false; } };
}

function buildHorrorStrings(ctx: AudioContext): SoundNodes {
  // Tense strings: sawtooth with LFO vibrato and slow filter sweep
  const oscs: OscillatorNode[] = [];
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 600;
  const stringFreqs = [220, 277.18, 329.63, 369.99, 440];
  stringFreqs.forEach(freq => {
    const o = makeOsc(ctx, 'sawtooth', freq);
    const vibLFO = makeOsc(ctx, 'sine', 6);
    const vibG = makeGain(ctx, freq * 0.01);
    chain(vibLFO, vibG);
    vibG.connect(o.frequency);
    o.connect(f);
    vibLFO.start(); o.start();
    oscs.push(o, vibLFO as OscillatorNode);
  });
  f.connect(g); g.connect(getMaster());
  // swell
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 3);
  f.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 3);
  return { stop: () => { try { oscs.forEach(o => o.stop()); } catch {} } };
}

function buildMusicBox(ctx: AudioContext): SoundNodes {
  // Music box: high sine waves with fast decay, square LFO warping
  let running = true;
  const notes = [523.25, 493.88, 440, 392, 349.23, 392, 440, 493.88];
  let i = 0;
  const play = () => {
    if (!running) return;
    const o = makeOsc(ctx, 'sine', notes[i % notes.length]);
    const g = makeGain(ctx, 0);
    o.connect(g); g.connect(getMaster());
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o.start(t); o.stop(t + 0.85);
    i++;
    // Slightly random tempo like broken music box
    setTimeout(play, 400 + Math.random() * 300);
  };
  play();
  return { stop: () => { running = false; } };
}

function buildOrganDrone(ctx: AudioContext): SoundNodes {
  const baseFreq = 82.41; // E2
  const pipes = [1, 2, 3, 4, 6, 8];
  const oscs: OscillatorNode[] = [];
  const g = makeGain(ctx, 0);
  pipes.forEach((harmonic, i) => {
    const o = makeOsc(ctx, 'sawtooth', baseFreq * harmonic);
    const og = makeGain(ctx, 0.3 / (i + 1));
    o.connect(og); og.connect(g);
    o.start(); oscs.push(o);
  });
  const reverb = ctx.createConvolver();
  g.connect(reverb); reverb.connect(getMaster());
  g.connect(getMaster());
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);
  return { stop: () => { try { oscs.forEach(o => o.stop()); } catch {} } };
}

function buildViolinShriek(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sawtooth', 880);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 600;
  chain(osc, f, g, getMaster());
  const shriek = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(1760, t + 0.5);
    osc.frequency.linearRampToValueAtTime(660, t + 1.0);
    osc.frequency.linearRampToValueAtTime(1320, t + 1.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.1);
    g.gain.linearRampToValueAtTime(0, t + 2);
  };
  osc.start(); shriek();
  const iv = setInterval(shriek, 3000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); } catch {} } };
}

function buildDarkChoir(ctx: AudioContext): SoundNodes {
  // Choir: multiple detuned sines with formants
  const voices = [150, 175, 195, 210, 225];
  const oscs: OscillatorNode[] = [];
  const g = makeGain(ctx, 0);
  voices.forEach((freq, i) => {
    const o = makeOsc(ctx, 'sine', freq + i * 0.5);
    const og = makeGain(ctx, 0.2);
    const formant = ctx.createBiquadFilter();
    formant.type = 'peaking';
    formant.frequency.value = 800 + i * 200;
    formant.gain.value = 10;
    o.connect(formant); formant.connect(og); og.connect(g);
    o.start(); oscs.push(o);
  });
  g.connect(getMaster());
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 3);
  return { stop: () => { try { oscs.forEach(o => o.stop()); } catch {} } };
}

function buildWhisper(ctx: AudioContext): SoundNodes {
  // Whisper: shaped noise with formants
  const noise = makeNoise(ctx, 3, true);
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 1000; f1.Q.value = 3;
  const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2500; f2.Q.value = 5;
  const g = makeGain(ctx, 0.3);
  noise.connect(f1); noise.connect(f2);
  f1.connect(g); f2.connect(g); g.connect(getMaster());
  // modulate for whisper rhythm
  const lfo = makeOsc(ctx, 'sine', 3);
  const lfoG = makeGain(ctx, 0.15);
  chain(lfo, lfoG);
  lfoG.connect(g.gain);
  noise.start(); lfo.start();
  return { stop: () => { try { noise.stop(); lfo.stop(); } catch {} } };
}

function buildBreathing(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 4, true);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 2;
  const g = makeGain(ctx, 0);
  chain(noise, f, g, getMaster());
  const lfo = makeOsc(ctx, 'sine', 0.4);
  const lfoG = makeGain(ctx, 0.4);
  chain(lfo, lfoG);
  lfoG.connect(g.gain);
  g.gain.value = 0.4;
  noise.start(); lfo.start();
  return { stop: () => { try { noise.stop(); lfo.stop(); } catch {} } };
}

function buildMoan(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sine', 180);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
  chain(osc, f, g, getMaster());
  const moan = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.8);
    osc.frequency.linearRampToValueAtTime(160, t + 1.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 2);
  };
  osc.start(); moan();
  const iv = setInterval(moan, 3500);
  return { stop: () => { clearInterval(iv); try { osc.stop(); } catch {} } };
}

function buildChildLaugh(ctx: AudioContext): SoundNodes {
  let running = true;
  const laugh = () => {
    if (!running) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const start = t + i * 0.2;
      const o = makeOsc(ctx, 'sine', 500 + Math.random() * 100);
      const g = makeGain(ctx, 0);
      o.connect(g); g.connect(getMaster());
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.2, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      o.start(start); o.stop(start + 0.2);
    }
    setTimeout(laugh, 4000);
  };
  laugh();
  return { stop: () => { running = false; } };
}

function buildWail(ctx: AudioContext): SoundNodes {
  // Banshee wail: high pitched sweeping with vibrato
  const osc = makeOsc(ctx, 'sawtooth', 1200);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 2;
  chain(osc, f, g, getMaster());
  const wail = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(2000, t + 0.5);
    osc.frequency.linearRampToValueAtTime(1200, t + 1);
    osc.frequency.linearRampToValueAtTime(2400, t + 1.5);
    osc.frequency.linearRampToValueAtTime(600, t + 2.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.3);
    g.gain.linearRampToValueAtTime(0, t + 3);
  };
  osc.start(); wail();
  const iv = setInterval(wail, 5000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); } catch {} } };
}

function buildHowl(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sawtooth', 150);
  const noise = makeNoise(ctx, 3, true);
  const g = makeGain(ctx, 0);
  const noiseG = makeGain(ctx, 0.15);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = 2;
  osc.connect(f); f.connect(g); chain(noise, noiseG, g); g.connect(getMaster());
  const howl = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(350, t + 0.8);
    osc.frequency.linearRampToValueAtTime(280, t + 1.5);
    osc.frequency.linearRampToValueAtTime(400, t + 2);
    osc.frequency.linearRampToValueAtTime(200, t + 3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.4);
    g.gain.linearRampToValueAtTime(0, t + 3.5);
  };
  osc.start(); noise.start(); howl();
  const iv = setInterval(howl, 5000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); noise.stop(); } catch {} } };
}

function buildDemonRoar(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sawtooth', 50);
  const noise = makeNoise(ctx, 4, false);
  const dist = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = Math.tanh(x * 20); }
  dist.curve = curve;
  const g = makeGain(ctx, 0);
  const noiseG = makeGain(ctx, 0.3);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
  osc.connect(dist); dist.connect(g);
  chain(noise, noiseG, f, g); g.connect(getMaster());
  const roar = () => {
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(40, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.5);
    osc.frequency.linearRampToValueAtTime(30, t + 1.5);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 2.5);
  };
  osc.start(); noise.start(); roar();
  const iv = setInterval(roar, 4000);
  return { stop: () => { clearInterval(iv); try { osc.stop(); noise.stop(); } catch {} } };
}

function buildChains(ctx: AudioContext): SoundNodes {
  let running = true;
  const clank = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const n = makeNoise(ctx, 0.5, false);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 5;
    const g = makeGain(ctx, 0);
    chain(n, f, g, getMaster());
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    n.start(t); n.stop(t + 0.5);
    setTimeout(clank, 800 + Math.random() * 1200);
  };
  clank();
  return { stop: () => { running = false; } };
}

function buildStaticLoop(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 3, false);
  const g = makeGain(ctx, 0.2);
  chain(noise, g, getMaster());
  noise.start();
  return { stop: () => { try { noise.stop(); } catch {} } };
}

function buildGlassBreak(ctx: AudioContext): SoundNodes {
  let running = true;
  const doBreak = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const n = makeNoise(ctx, 0.3, false);
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
    const g = makeGain(ctx, 0);
    chain(n, f, g, getMaster());
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    n.start(t); n.stop(t + 0.3);
    setTimeout(doBreak, 5000);
  };
  doBreak();
  return { stop: () => { running = false; } };
}

function buildInferno(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 4, true);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.5;
  const g = makeGain(ctx, 0);
  const lfo = makeOsc(ctx, 'sine', 0.8);
  const lfoG = makeGain(ctx, 0.2);
  chain(lfo, lfoG);
  lfoG.connect(g.gain);
  chain(noise, f, g, getMaster());
  g.gain.value = 0.4;
  noise.start(); lfo.start();
  return { stop: () => { try { noise.stop(); lfo.stop(); } catch {} } };
}

function buildBloodDrip(ctx: AudioContext): SoundNodes {
  let running = true;
  const drip = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const o = makeOsc(ctx, 'sine', 1200);
    const g = makeGain(ctx, 0);
    o.connect(g); g.connect(getMaster());
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(t); o.stop(t + 0.2);
    setTimeout(drip, 500 + Math.random() * 800);
  };
  drip();
  return { stop: () => { running = false; } };
}

function buildElectricZap(ctx: AudioContext): SoundNodes {
  let running = true;
  const zap = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const n = makeNoise(ctx, 0.15, false);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 0.5;
    const g = makeGain(ctx, 0);
    chain(n, f, g, getMaster());
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.start(t); n.stop(t + 0.15);
    setTimeout(zap, 2000 + Math.random() * 3000);
  };
  zap();
  return { stop: () => { running = false; } };
}

function buildLullaby(ctx: AudioContext): SoundNodes {
  let running = true;
  const notes = [261.63, 293.66, 329.63, 261.63, 196, 220, 261.63];
  let i = 0;
  const play = () => {
    if (!running) return;
    const t = ctx.currentTime;
    const o = makeOsc(ctx, 'triangle', notes[i % notes.length]);
    const g = makeGain(ctx, 0);
    o.connect(g); g.connect(getMaster());
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.start(t); o.stop(t + 0.65);
    i++;
    setTimeout(play, 800);
  };
  play();
  return { stop: () => { running = false; } };
}

function buildFuneralMarch(ctx: AudioContext): SoundNodes {
  let running = true;
  const pattern = [196, 196, 196, 155.56, 0, 196, 0, 174.61, 196, 220, 261.63];
  let i = 0;
  const play = () => {
    if (!running) return;
    const freq = pattern[i % pattern.length];
    if (freq > 0) {
      const o = makeOsc(ctx, 'sawtooth', freq);
      const g = makeGain(ctx, 0);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
      chain(o, f, g, getMaster());
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.45);
    }
    i++;
    setTimeout(play, 500);
  };
  play();
  return { stop: () => { running = false; } };
}

function buildSynthHorror(ctx: AudioContext): SoundNodes {
  const osc1 = makeOsc(ctx, 'square', 110);
  const osc2 = makeOsc(ctx, 'square', 110.5);
  const lfo = makeOsc(ctx, 'sine', 0.2);
  const lfoG = makeGain(ctx, 20);
  chain(lfo, lfoG);
  lfoG.connect(osc1.frequency);
  lfoG.connect(osc2.frequency);
  const g = makeGain(ctx, 0);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
  chain(osc1, f, g, getMaster());
  osc2.connect(f);
  g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 2);
  osc1.start(); osc2.start(); lfo.start();
  return { stop: () => { try { osc1.stop(); osc2.stop(); lfo.stop(); } catch {} } };
}

function buildVoidHum(ctx: AudioContext): SoundNodes {
  const osc = makeOsc(ctx, 'sine', 25);
  const osc2 = makeOsc(ctx, 'sine', 50);
  const g = makeGain(ctx, 0);
  osc.connect(g); osc2.connect(g); g.connect(getMaster());
  g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
  osc.start(); osc2.start();
  return { stop: () => { try { osc.stop(); osc2.stop(); } catch {} } };
}

function buildHiss(ctx: AudioContext): SoundNodes {
  const noise = makeNoise(ctx, 2, false);
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
  const g = makeGain(ctx, 0.3);
  chain(noise, f, g, getMaster());
  noise.start();
  return { stop: () => { try { noise.stop(); } catch {} } };
}

function buildRitualChant(ctx: AudioContext): SoundNodes {
  const voices = [80, 90, 100, 110];
  const oscs: OscillatorNode[] = [];
  const g = makeGain(ctx, 0);
  voices.forEach(freq => {
    const o = makeOsc(ctx, 'sine', freq);
    const lfo = makeOsc(ctx, 'sine', 4);
    const lfoG = makeGain(ctx, freq * 0.01);
    chain(lfo, lfoG);
    lfoG.connect(o.frequency);
    o.connect(g);
    o.start(); lfo.start();
    oscs.push(o);
  });
  g.connect(getMaster());
  g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2);
  return { stop: () => { try { oscs.forEach(o => o.stop()); } catch {} } };
}

// ── public API ────────────────────────────────────────────────────────────

const builders: Record<string, (ctx: AudioContext) => SoundNodes> = {
  'deep-drone': buildDeepDrone,
  'wind-howl': buildWindHowl,
  'thunder-rumble': buildThunder,
  'cave-drip': buildBloodDrip,
  'forest-night': buildWindHowl,
  'haunted-room': buildDoorCreak,
  'inferno': buildInferno,
  'void-hum': buildVoidHum,
  'dark-water': (ctx) => { const n = buildWindHowl(ctx); return n; },
  'ritual-chant': buildRitualChant,
  'cemetery': buildWindHowl,
  'static-loop': buildStaticLoop,
  'heartbeat': buildHeartbeat,
  'door-creak': buildDoorCreak,
  'chains': buildChains,
  'glass-break': buildGlassBreak,
  'knife-scrape': (ctx) => {
    const o = makeOsc(ctx, 'sawtooth', 1500);
    const g = makeGain(ctx, 0);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 5;
    chain(o, f, g, getMaster());
    let running = true;
    const scrape = () => {
      if (!running) return;
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(2000, t);
      o.frequency.linearRampToValueAtTime(800, t + 0.8);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.1);
      g.gain.linearRampToValueAtTime(0, t + 0.9);
      setTimeout(scrape, 2500);
    };
    o.start(); scrape();
    return { stop: () => { running = false; try { o.stop(); } catch {} } };
  },
  'bone-crack': (ctx) => {
    let running = true;
    const crack = () => {
      if (!running) return;
      const n = makeNoise(ctx, 0.2, false);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 8;
      const g = makeGain(ctx, 0.6);
      chain(n, f, g, getMaster());
      n.start(); n.stop(ctx.currentTime + 0.15);
      setTimeout(crack, 3000);
    };
    crack();
    return { stop: () => { running = false; } };
  },
  'footsteps': (ctx) => {
    let running = true;
    const step = () => {
      if (!running) return;
      const n = makeNoise(ctx, 0.1, true);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
      const g = makeGain(ctx, 0.7);
      chain(n, f, g, getMaster());
      n.start(); n.stop(ctx.currentTime + 0.08);
      setTimeout(step, 700 + Math.random() * 300);
    };
    step();
    return { stop: () => { running = false; } };
  },
  'church-bell': (ctx) => {
    let running = true;
    const bell = () => {
      if (!running) return;
      const t = ctx.currentTime;
      [220, 440, 880, 1760].forEach((freq, i) => {
        const o = makeOsc(ctx, 'sine', freq);
        const g = makeGain(ctx, 0);
        o.connect(g); g.connect(getMaster());
        g.gain.setValueAtTime(0.3 / (i + 1), t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 4);
        o.start(t); o.stop(t + 4.5);
      });
      setTimeout(bell, 5000);
    };
    bell();
    return { stop: () => { running = false; } };
  },
  'thunder-strike': (ctx) => {
    let running = true;
    const strike = () => {
      if (!running) return;
      const n = makeNoise(ctx, 0.5, false);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200;
      const g = makeGain(ctx, 0);
      chain(n, f, g, getMaster());
      g.gain.setValueAtTime(1.0, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      n.start(); n.stop(ctx.currentTime + 0.6);
      setTimeout(strike, 4000);
    };
    strike();
    return { stop: () => { running = false; } };
  },
  'demon-roar': buildDemonRoar,
  'blood-drip': buildBloodDrip,
  'electric-zap': buildElectricZap,
  'dark-piano': buildDarkPiano,
  'horror-strings': buildHorrorStrings,
  'music-box': buildMusicBox,
  'organ-drone': buildOrganDrone,
  'violin-shriek': buildViolinShriek,
  'cello-deep': (ctx) => {
    const o = makeOsc(ctx, 'sawtooth', 65.41);
    const g = makeGain(ctx, 0);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    chain(o, f, g, getMaster());
    const lfo = makeOsc(ctx, 'sine', 5);
    const lfoG = makeGain(ctx, 2);
    chain(lfo, lfoG);
    lfoG.connect(o.frequency);
    g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 2);
    o.start(); lfo.start();
    return { stop: () => { try { o.stop(); lfo.stop(); } catch {} } };
  },
  'choir-dark': buildDarkChoir,
  'synth-horror': buildSynthHorror,
  'lullaby-horror': buildLullaby,
  'funeral-march': buildFuneralMarch,
  'requiem': buildRitualChant,
  'hell-symphony': (ctx) => {
    const nodes = [buildHorrorStrings(ctx), buildOrganDrone(ctx)];
    return { stop: () => nodes.forEach(n => n.stop()) };
  },
  'scream': buildScream,
  'growl': buildGrowl,
  'laugh': buildLaugh,
  'crying': buildCrying,
  'whisper': buildWhisper,
  'breathing': buildBreathing,
  'moan': buildMoan,
  'child-laugh': buildChildLaugh,
  'speak-evil': (ctx) => {
    const o = makeOsc(ctx, 'sawtooth', 120);
    const g = makeGain(ctx, 0);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 5;
    chain(o, f, g, getMaster());
    let running = true;
    const speak = () => {
      if (!running) return;
      const t = ctx.currentTime;
      o.frequency.setValueAtTime(100, t);
      o.frequency.setValueAtTime(140, t + 0.1);
      o.frequency.setValueAtTime(90, t + 0.2);
      o.frequency.setValueAtTime(130, t + 0.3);
      g.gain.setValueAtTime(0.35, t);
      g.gain.linearRampToValueAtTime(0, t + 0.5);
      setTimeout(speak, 2000);
    };
    o.start(); speak();
    return { stop: () => { running = false; try { o.stop(); } catch {} } };
  },
  'wail': buildWail,
  'hiss': buildHiss,
  'howl': buildHowl,
};

export class AudioEngine {
  playSound(id: string): void {
    this.stopSound(id);
    const builder = builders[id];
    if (!builder) return;
    try {
      const nodes = builder(getCtx());
      active.set(id, nodes);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
  stopSound(id: string): void {
    const n = active.get(id);
    if (n) { try { n.stop(); } catch {} active.delete(id); }
  }
  stopAll(): void {
    for (const id of active.keys()) this.stopSound(id);
  }
  isPlaying(id: string): boolean {
    return active.has(id);
  }
  setMasterVolume(v: number): void {
    getMaster().gain.value = Math.max(0, Math.min(1, v));
  }
  getCtx(): AudioContext { return getCtx(); }
  getDestination(): GainNode { return getMaster(); }
}

export const audioEngine = new AudioEngine();

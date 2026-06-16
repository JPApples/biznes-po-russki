// Lightweight audio: synthesized SFX + a gentle lo-fi ambient pad, with a global mute.
// Drop a real track at public/sounds/lofi.mp3 to replace the synth ambient.
// ponytail: Web Audio only — no deps, no asset fetch required.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem("biz-muted") === "1";
let ambientOn = false;
let ambientNodes: { stop: () => void } | null = null;
let bgEl: HTMLAudioElement | null = null;

function ac(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted(): boolean { return muted; }

export function setMuted(m: boolean): void {
  muted = m;
  try { localStorage.setItem("biz-muted", m ? "1" : "0"); } catch { /* ignore */ }
  if (master) master.gain.value = m ? 0 : 1;
  if (bgEl) bgEl.muted = m;
  if (m) stopAmbient();
  else startAmbient();
}

export function toggleMuted(): boolean { setMuted(!muted); return muted; }

/* ── synthesized one-shots ── */
function blip(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.12): void {
  if (muted) return;
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g).connect(master!);
  const t = c.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => blip(420, 0.07, "triangle", 0.06),
  cash: () => { blip(880, 0.06, "square", 0.05); setTimeout(() => blip(1320, 0.08, "square", 0.04), 55); },
  sip: () => { blip(200, 0.16, "sine", 0.1); setTimeout(() => blip(150, 0.2, "sine", 0.08), 90); }, // кофе/обед
  clink: () => { blip(2000, 0.05, "sine", 0.09); setTimeout(() => blip(2600, 0.06, "sine", 0.07), 45); }, // бар
  win: () => { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.12, "triangle", 0.09), i * 85)); },
  fail: () => blip(150, 0.3, "sawtooth", 0.08),
};

/* ── ambient lo-fi: prefer a real file, else a soft synth pad ── */
function startSynthPad(): void {
  if (ambientNodes) return;
  const c = ac();
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 700;
  const amb = c.createGain();
  amb.gain.value = 0.05;
  filt.connect(amb).connect(master!);
  // a quiet detuned chord (lo-fi-ish pad)
  const freqs = [110, 164.81, 220, 277.18];
  const oscs = freqs.map((f, i) => {
    const o = c.createOscillator();
    o.type = i % 2 ? "sine" : "triangle";
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 6;
    o.connect(filt);
    o.start();
    return o;
  });
  // slow swell LFO on the pad gain
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 0.025;
  lfo.connect(lfoGain).connect(amb.gain);
  lfo.start();
  ambientNodes = { stop: () => { oscs.forEach((o) => o.stop()); lfo.stop(); } };
}

export function startAmbient(): void {
  if (muted || ambientOn) return;
  ambientOn = true;
  if (!bgEl) {
    bgEl = new Audio("/sounds/lofi.mp3");
    bgEl.loop = true;
    bgEl.volume = 0.28;
    bgEl.onerror = () => { bgEl = null; startSynthPad(); }; // no file → synth pad
  }
  if (bgEl) {
    bgEl.muted = muted;
    bgEl.play().catch(() => startSynthPad());
  }
}

export function stopAmbient(): void {
  ambientOn = false;
  if (bgEl) { bgEl.pause(); }
  if (ambientNodes) { ambientNodes.stop(); ambientNodes = null; }
}

/** Call once on the first user gesture (browser autoplay policy). */
export function initAudioOnGesture(): void {
  ac();
  if (!muted) startAmbient();
}

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

function stopSynthPad(): void {
  if (ambientNodes) { ambientNodes.stop(); ambientNodes = null; }
}

export function startAmbient(): void {
  if (muted) return;
  ambientOn = true;
  if (!bgEl) {
    bgEl = new Audio("/sounds/lofi.mp3");
    bgEl.loop = true;
    bgEl.volume = 0.28;
    bgEl.preload = "auto";
    // Only fall back to the synth pad on a *genuine* load failure (missing/corrupt file).
    bgEl.onerror = () => { if (ambientOn && bgEl?.error) startSynthPad(); };
  }
  bgEl.muted = muted;
  // The real track is the music; the synth pad is only an emergency stand-in.
  // Re-attempt play() on every gesture so a once-blocked track recovers instead of
  // leaving the player stuck on the synth "hum".
  if (bgEl.paused) {
    const pr = bgEl.play();
    if (pr && typeof pr.then === "function") {
      pr.then(() => stopSynthPad()) // track is playing → silence any stand-in pad
        .catch((err: DOMException) => {
          // A quick pause()/navigation aborts play() harmlessly — don't start the hum for that.
          if (ambientOn && err && err.name !== "AbortError") startSynthPad();
        });
    }
  }
}

export function stopAmbient(): void {
  ambientOn = false;
  if (bgEl) { bgEl.pause(); }
  stopSynthPad();
}

/* ── looping event ambience: cafe murmur / bar buzz (filtered noise) ── */
let eventAmb: { stop: () => void } | null = null;
function noiseBuffer(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 2);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
export function startEventAmbience(kind: "cafe" | "bar"): () => void {
  stopEventAmbience();
  if (muted) return () => {};
  const c = ac();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.loop = true;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = kind === "bar" ? 1500 : 820; // bar brighter, cafe softer
  const g = c.createGain();
  g.gain.value = 0;
  src.connect(filt).connect(g).connect(master!);
  src.start();
  g.gain.linearRampToValueAtTime(kind === "bar" ? 0.06 : 0.045, c.currentTime + 0.6); // fade in
  // gentle wobble so it feels alive (crowd swell)
  const lfo = c.createOscillator();
  const lfoG = c.createGain();
  lfo.frequency.value = 0.15;
  lfoG.gain.value = 0.015;
  lfo.connect(lfoG).connect(g.gain);
  lfo.start();
  eventAmb = { stop: () => { try { src.stop(); lfo.stop(); } catch { /* ignore */ } } };
  return stopEventAmbience;
}
export function stopEventAmbience(): void {
  if (eventAmb) { eventAmb.stop(); eventAmb = null; }
}

/** Call once on the first user gesture (browser autoplay policy). */
export function initAudioOnGesture(): void {
  ac();
  if (!muted) startAmbient();
}

/** Guarantee audio starts on the first interaction anywhere (e.g. loading straight into a saved game). */
let gestureHooked = false;
export function hookFirstGesture(): void {
  if (gestureHooked) return;
  gestureHooked = true;
  const h = () => {
    initAudioOnGesture();
    window.removeEventListener("pointerdown", h);
    window.removeEventListener("keydown", h);
  };
  window.addEventListener("pointerdown", h);
  window.addEventListener("keydown", h);
}

/** Soft click on every button press, app-wide (juice).
 *  A button may override or silence its sound via data-sfx:
 *  "off"|"none" → silent, "sip"|"clink"|"cash" → that one-shot, else a soft click.
 *  A short de-dupe window prevents the same interaction from stacking sounds. */
let uiHooked = false;
let lastUiSfx = 0;
export function hookUiSounds(): void {
  if (uiHooked) return;
  uiHooked = true;
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as HTMLElement | null;
    const btn = t?.closest("button") as HTMLButtonElement | null;
    if (!btn || btn.disabled) return;
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (now - lastUiSfx < 80) return; // collapse duplicate/rapid events
    lastUiSfx = now;
    switch (btn.dataset.sfx) {
      case "off": case "none": return;
      case "sip": sfx.sip(); break;
      case "clink": sfx.clink(); break;
      case "cash": sfx.cash(); break;
      default: sfx.click();
    }
  });
}

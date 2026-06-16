import { GameEngine } from "../engine/engine";
import type { EngineSnapshot } from "../engine/engine";

const KEY = "biznes-po-russki-save-v1";

export function saveGame(eng: GameEngine): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(eng.toSnapshot()));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function loadGame(): GameEngine | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as EngineSnapshot;
    if (!snap?.player) return null;
    return GameEngine.fromSnapshot(snap);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

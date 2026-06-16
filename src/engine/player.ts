import type { Origin, Specialization, Trait, PlayerState, Effects } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function createPlayer(origin: Origin, spec: Specialization, trait: Trait): PlayerState {
  return {
    originId: origin.id,
    specId: spec.id,
    traitId: trait.id,
    originName: origin.name,
    specName: spec.name,
    traitName: trait.name,
    originEmoji: origin.emoji,
    specEmoji: spec.emoji,
    traitEmoji: trait.emoji,
    baseRevenue: spec.baseRevenue,
    multiplier: spec.multiplier,
    money: origin.money,
    time: origin.time,
    nerves: origin.nerves,
    reputation: origin.reputation,
    workLife: origin.workLife,
    shadow: 0,
    karma: 0,
    health: 80,
    energy: 70,
    month: 1,
    week: 1,
    beatIndex: 0,
    pending: [],
    queue: [],
    annaLoyalty: 50,
    maxLoyalty: 50,
    flags: { ...origin.flags },
    history: [],
    statsHistory: [],
    employees: [],
  };
}

/** Apply card/choice effects to a player (mutates a copy and returns it). */
export function applyEffects(p: PlayerState, e0: Effects): PlayerState {
  // ── trait mechanics that reshape incoming effects ──
  const e: Effects = { ...e0 };
  if (p.traitId === "empathy" && e.reputation && e.reputation < 0) e.reputation = Math.round(e.reputation / 2); // клиенты прощают
  if (p.traitId === "charisma" && e.reputation && e.reputation > 0) e.reputation = Math.round(e.reputation * 1.2); // блестящие выступления
  if (p.traitId === "workaholic" && e.nerves && e.nerves > 0) e.nerves = e.nerves * 2; // стресс растёт вдвое

  const repMul = typeof p.flags.repMultiplier === "number" ? (p.flags.repMultiplier as number) : 1;
  const next: PlayerState = { ...p };
  if (e.money !== undefined) next.money = next.money + e.money;
  if (e.shadow !== undefined) next.shadow = clamp(next.shadow + e.shadow, 0, 100);
  if (e.reputation !== undefined) next.reputation = clamp(next.reputation + e.reputation * repMul, -100, 100);
  if (e.nerves !== undefined) next.nerves = clamp(next.nerves + e.nerves, 0, 100);
  if (e.workLife !== undefined) next.workLife = clamp(next.workLife + e.workLife, 0, 100);
  if (e.karma !== undefined) next.karma = clamp(next.karma + e.karma, -100, 100);
  if (e.health !== undefined) next.health = clamp((next.health ?? 80) + e.health, 0, 100);
  if (e.energy !== undefined) next.energy = clamp((next.energy ?? 70) + e.energy, 0, 100);
  if (e.time !== undefined) next.time = (next.time ?? 0) + e.time;
  return next;
}

export function estimateRevenue(p: PlayerState): number {
  return Math.round(p.baseRevenue * p.multiplier * (1 + p.reputation / 100));
}

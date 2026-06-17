import type { PlayerState } from "../engine/types";

export interface Ach {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  test: (p: PlayerState) => boolean;
}

export const ACHIEVEMENTS: Ach[] = [
  { id: "rich", title: "Капитал", emoji: "💰", desc: "Накопить 100$", test: (p) => p.money >= 100 },
  { id: "shark", title: "Акула бизнеса", emoji: "🦈", desc: "Репутация 50%+", test: (p) => p.reputation >= 50 },
  { id: "clean", title: "Чистые руки", emoji: "✨", desc: "Тень закона 0% после 1-й недели", test: (p) => p.shadow === 0 && p.week >= 2 },
  { id: "survivor", title: "Пережил проверку", emoji: "🛡️", desc: "Прошёл налоговую проверку", test: (p) => !!p.flags.inspected },
  { id: "level3", title: "Предприниматель", emoji: "🏢", desc: "Достичь 3-го уровня", test: (p) => (p.xp || 0) >= 280 },
  { id: "balanced", title: "В балансе", emoji: "⚖️", desc: "Здоровье/энергия/баланс высоки, нервы низки", test: (p) => (p.health ?? 80) >= 60 && (p.energy ?? 70) >= 60 && p.workLife >= 60 && p.nerves <= 40 },
  { id: "saint", title: "Светлая карма", emoji: "😇", desc: "Карма 50+", test: (p) => p.karma >= 50 },
  { id: "month1", title: "Первый квартал пошёл", emoji: "📅", desc: "Закрыть Месяц 1", test: (p) => p.month >= 2 },
];

/** Achievements satisfied now but not yet recorded in p.flags.ach. */
export function newlyUnlocked(p: PlayerState): Ach[] {
  const have = new Set(((p.flags.ach as string[]) || []));
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.test(p));
}

export function unlockedCount(p: PlayerState): number {
  return ((p.flags.ach as string[]) || []).length;
}

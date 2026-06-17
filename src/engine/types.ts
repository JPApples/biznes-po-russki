export type ChoiceType = "reliable" | "situational" | "harmful" | "secret";

export interface Effects {
  money?: number;
  shadow?: number;
  reputation?: number;
  nerves?: number;
  workLife?: number;
  karma?: number;
  health?: number;
  energy?: number;
  time?: number;
}

/* ── Week-based Stage-1 content model ───────────────────────────── */
export type BeatKind = "choice" | "lunch" | "leisure" | "labor" | "minigame" | "advisor" | "check";

export interface BeatChoice {
  id: string;
  text: string;
  type: ChoiceType;
  effects: Effects;        // applied immediately
  next?: Effects;          // deferred — applied at the START of the next beat
  nextText?: string;       // human description of that next-day consequence
  outcome?: string;        // short result shown right after choosing
  anna?: string;           // advisor reaction (overrides generic pool)
  max?: string;
  bonus?: string;
  requireTrait?: string[]; // choice only available with one of these traitIds
}

export interface Beat {
  id: string;
  kind: BeatKind;
  day: number;             // 1..7
  dow: string;             // Понедельник…
  icon: string;
  title: string;
  text: string;
  choices?: BeatChoice[];
  minigame?: string;       // key into minigames map (kind=minigame / advisor)
  advisor?: "anna" | "max";// who shows up (kind=advisor → leads into a minigame)
  intro?: string;          // the appearance line
}

export interface WeekData {
  week: number;
  title: string;
  global?: string;         // monthly global-event note shown on week 1
  events: Beat[];
  diaryGood: string;
  diaryBad: string;
}

export interface MonthContent {
  month: number;
  title: string;
  global: string;
  weeks: WeekData[];
}

export interface PendingConsequence {
  effects: Effects;
  text: string;
}

export interface Choice {
  id: string;
  text: string;
  type: ChoiceType;
  effects: Effects;
  bonus?: string;
  partner?: boolean;
}

export interface Card {
  id: string;
  title: string;
  text: string;
  choices: Choice[];
}

export interface MonthData {
  events: Card[];
  checklist: Card | null;
}

export interface Origin {
  id: string;
  name: string;
  emoji: string;
  money: number;
  time: number;
  nerves: number;
  reputation: number;
  workLife: number;
  feature: string;
  flags: Record<string, unknown>;
}

export interface Specialization {
  id: string;
  name: string;
  emoji: string;
  baseRevenue: number;
  multiplier: number;
  needsOffice: boolean;
}

export interface Trait {
  id: string;
  name: string;
  emoji: string;
  effect: string;
}

export interface AdvisorData {
  name: string;
  emoji: string;
  role: string;
  startLoyalty: number;
  reactions: Record<ChoiceType, string[]>;
}

export interface BusinessAction {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  effect: string;
  minigame?: boolean;
  workLife?: number;
}

export interface KarmaLevel {
  min: number;
  label: string;
  emoji: string;
  color: string;
}

export interface MiniGame {
  id?: string;
  name: string;
  type: "order" | "select" | "quiz" | "slider" | "drag";
  prompt: string;
  items: string[];
  correct: string[];
  /* slider genre */
  min?: number;
  max?: number;
  target?: [number, number];
  unit?: string;
  hint?: string;
  /* rewards (week-stream beats) */
  win?: Effects;
  lose?: Effects;
  winText?: string;
  loseText?: string;
}

export interface Stage1Ending {
  id: string;
  title: string;
  emoji: string;
  desc: string;
  bonus: string;
  cond: string;
}

export interface EmployeeState {
  id: string;
  name: string;
  emoji: string;
  salary: number;
  skills: number;
  loyalty: number;
  special: string;
  description: string;
  hiredMonth: number;
}

export interface PlayerState {
  originId: string;
  specId: string;
  traitId: string;
  originName: string;
  specName: string;
  traitName: string;
  originEmoji: string;
  specEmoji: string;
  traitEmoji: string;
  baseRevenue: number;
  multiplier: number;
  money: number;
  time: number;
  nerves: number;
  reputation: number;
  workLife: number;
  shadow: number;
  karma: number;
  health: number;
  energy: number;
  xp: number;
  month: number;
  /* week-stream cursor (Month 1) */
  week: number;            // 1..4
  beatIndex: number;       // index within the current week's events
  pending: PendingConsequence[]; // deferred next-day consequences
  queue: Beat[];           // injected random events / inspections shown before the regular beat
  rates?: { rub: number; oil: number; it: number };      // macro market rates (light mechanic)
  ratesPrev?: { rub: number; oil: number; it: number };  // previous tick for delta display
  annaLoyalty: number;
  maxLoyalty: number;
  flags: Record<string, unknown>;
  history: { card: string; choice: string; month: number }[];
  statsHistory?: {
    month: number;
    money: number;
    nerves: number;
    reputation: number;
    shadow: number;
    income: number;
  }[];
  employees?: EmployeeState[];
}

export type Phase =
  | "event"
  | "beat"
  | "weekSummary"
  | "businessPlan"
  | "minigame"
  | "checklist"
  | "summary"
  | "ending";

export interface AdvisorLine {
  who: "anna" | "max";
  text: string;
}

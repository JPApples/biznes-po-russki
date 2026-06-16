import type {
  PlayerState, Phase, Card, Choice, AdvisorLine, BusinessAction, MiniGame, Stage1Ending, ChoiceType,
  MonthContent, WeekData, Beat, BeatChoice, PendingConsequence,
} from "./types";
import { applyEffects } from "./player";
import e1cards from "../data/e1_cards.json";
import month1 from "../data/month1.json";
import eventsData from "../data/events.json";
import advisorsData from "../data/advisors.json";
import config from "../data/config.json";
import employeesData from "../data/employees.json";

interface EmployeeData {
  id: string;
  name: string;
  emoji: string;
  salary: number;
  signing_bonus: number;
  skills: number;
  loyalty: number;
  special: string;
  description: string;
}

type MonthMap = Record<string, { events: Card[]; checklist: Card | null }>;
const MONTHS = e1cards as unknown as MonthMap;
const MONTH1 = month1 as unknown as MonthContent & { minigames: Record<string, MiniGame> };
const BUSINESS_ACTIONS = config.businessActions as BusinessAction[];
const MINIGAMES = config.minigames as Record<string, MiniGame>;
const ENDINGS = config.stage1Endings as Stage1Ending[];
const STAGE1_MONTHS = config.game.stage1Months;
const EMPLOYEES = employeesData as unknown as EmployeeData[];
// Random-event pool. AI can append more via GameEngine.addRandomEvents().
const RANDOM_POOL: Beat[] = [...((eventsData as { random: Beat[] }).random)];

const LOSE_RULES: { test: (p: PlayerState) => boolean; title: string; desc: string }[] = [
  { test: (p) => p.money < -20, title: "Банкротство", desc: "Долги превысили всё. Бизнес пришлось закрыть, а имущество — распродать." },
  { test: (p) => p.nerves >= 100, title: "Выгорание", desc: "Нервы сдали окончательно. Врачи прописали покой, а не бизнес." },
  { test: (p) => p.health <= 0, title: "Здоровье подвело", desc: "Ты загнал себя в больницу. Дело встало без хозяина." },
  { test: (p) => p.shadow >= 100, title: "Бизнес закрыт налоговой", desc: "Тень закона зашкалила. Проверка нашла всё и прикрыла лавочку." },
  { test: (p) => p.reputation <= -40, title: "Клиенты разбежались", desc: "Репутация рухнула в минус. Заказов нет, сарафан работает против тебя." },
  { test: (p) => p.workLife <= 0, title: "Жизнь развалилась", desc: "Работа съела всё. Семья и близкие ушли, ради чего был бизнес — непонятно." },
  { test: (p) => p.karma <= -70, title: "Проклятие репутации", desc: "Слишком много нечестных ходов. Партнёры и город отвернулись от тебя." },
];

const loyaltyDelta: Record<ChoiceType, { anna: number; max: number }> = {
  reliable: { anna: 5, max: -3 },
  situational: { anna: -1, max: 3 },
  harmful: { anna: -6, max: 5 },
  secret: { anna: 4, max: 4 },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface EngineSnapshot {
  player: PlayerState;
  phase: Phase;
  eventIndex: number;
  version: string;
}

export class GameEngine {
  player: PlayerState;
  phase: Phase = "event";
  eventIndex = 0;
  /** transient: consequences applied when entering the current beat (not persisted) */
  lastConsequences: PendingConsequence[] = [];

  constructor(player: PlayerState) {
    this.player = player;
    this.ensureFields();
    if (this.hasWeekStream()) this.phase = "beat";
    if (!this.player.statsHistory || this.player.statsHistory.length === 0) {
      this.player.statsHistory = [];
      this.recordStats(0);
    }
  }

  /** backfill fields added after early saves */
  private ensureFields(): void {
    const p = this.player as Partial<PlayerState> & PlayerState;
    if (p.health === undefined) p.health = 80;
    if (p.energy === undefined) p.energy = 70;
    if (p.week === undefined) p.week = 1;
    if (p.beatIndex === undefined) p.beatIndex = 0;
    if (!Array.isArray(p.pending)) p.pending = [];
    if (!Array.isArray(p.queue)) p.queue = [];
    if (!p.rates) p.rates = { rub: 92.5, oil: 74.2, it: 4100 };
    if (!p.ratesPrev) p.ratesPrev = { ...p.rates };
    if (!p.flags) p.flags = {};
    if (!p.history) p.history = [];
  }

  recordStats(income: number = 0): void {
    if (!this.player.statsHistory) this.player.statsHistory = [];
    const existingIndex = this.player.statsHistory.findIndex((pt) => pt.month === this.player.month);
    const dataPoint = {
      month: this.player.month,
      money: this.player.money,
      nerves: this.player.nerves,
      reputation: this.player.reputation,
      shadow: this.player.shadow,
      income,
    };
    if (existingIndex !== -1) this.player.statsHistory[existingIndex] = dataPoint;
    else this.player.statsHistory.push(dataPoint);
  }

  /* ════════════════ MONTH 1 — WEEK STREAM ════════════════ */

  hasWeekStream(): boolean {
    return this.player.month === MONTH1.month;
  }

  getMonthContent(): MonthContent {
    return MONTH1;
  }

  getWeek(): WeekData {
    return MONTH1.weeks[this.player.week - 1];
  }

  getCurrentBeat(): Beat | null {
    if (this.player.queue.length) return this.player.queue[0]; // injected event takes priority
    const wk = this.getWeek();
    if (!wk) return null;
    return this.player.beatIndex < wk.events.length ? wk.events[this.player.beatIndex] : null;
  }

  /** AI / future-proofing hook: add events into the runtime random pool. */
  addRandomEvents(beats: Beat[]): void {
    RANDOM_POOL.push(...beats);
  }

  /** Inspection scaled by current shadow — generated, not authored. */
  private makeInspection(): Beat {
    let fine = Math.max(3, Math.round(this.player.shadow / 4));
    let waived = false;
    if (this.player.traitId === "iron_logic" && !this.player.flags.fineWaived) { // железная логика: отмена 1 штрафа
      fine = 0; waived = true; this.player.flags.fineWaived = true;
    }
    return {
      id: "inspection", kind: "check", day: 0, dow: "Внезапно", icon: "danger",
      title: "Налоговая проверка",
      text: `К тебе пришла проверка. Тень закона ${this.player.shadow}% — есть к чему придраться.`,
      choices: [
        {
          id: "A",
          text: waived ? "Предъявить безупречные документы" : `Сотрудничать и заплатить штраф (${fine}$)`,
          type: "situational", effects: { money: -fine, shadow: -25, nerves: waived ? 0 : 8 },
          outcome: waived ? "Железная логика: придраться не к чему — штраф отменён." : `Штраф ${fine}$ уплачен, тень закона снижена.`,
          anna: "Лучше закрыть вопрос и спать спокойно.",
        },
        { id: "B", text: "Спорить и тянуть время", type: "harmful", effects: { shadow: 12, nerves: 15, karma: -2 }, outcome: "Проверка ушла злее, чем пришла. Станет только хуже.", max: "Качай права... хотя тут я бы притих." },
      ],
    };
  }

  /** Феникс: один рестарт с опытом вместо проигрыша. */
  private phoenixBeat(reason: string): Beat {
    return {
      id: "phoenix", kind: "choice", day: 0, dow: "Из пепла", icon: "fire",
      title: "Феникс: второй шанс",
      text: `Ты был на грани (${reason}), но твоя черта «Феникс» подняла тебя из пепла — с опытом и наукой. Второго такого спасения не будет.`,
      choices: [
        { id: "A", text: "Подняться и продолжить", type: "reliable", effects: { karma: 3, nerves: -10 }, outcome: "Ты выстоял. Теперь — осторожнее." },
      ],
    };
  }

  /** At the start of a week, maybe inject an inspection (shadow-driven) or a random event. */
  private maybeInject(): void {
    const p = this.player;
    if (p.shadow >= 55 && !p.flags.inspected) {
      p.queue.push(this.makeInspection());
      p.flags.inspected = true;
      return;
    }
    if (RANDOM_POOL.length && Math.random() < 0.6) {
      p.queue.push(pick(RANDOM_POOL));
    }
  }

  /** Macro market random-walk — small realistic moves (±~1.3%/step), not casino swings. */
  private driftRates(): void {
    const p = this.player;
    if (!p.rates) p.rates = { rub: 92.5, oil: 74.2, it: 4100 };
    p.ratesPrev = { ...p.rates };
    const walk = (v: number) => v * (1 + (Math.random() - 0.5) * 0.026);
    p.rates = {
      rub: Math.round(walk(p.rates.rub) * 100) / 100,
      oil: Math.round(walk(p.rates.oil) * 100) / 100,
      it: Math.round(walk(p.rates.it)),
    };
  }

  /** Light macro effect on monthly income (capped ±10%). */
  rateIncomeFactor(): number {
    const p = this.player;
    if (!p.rates) return 1;
    const oilDev = (p.rates.oil - 74.2) / 74.2;                              // нефть ↑ → спрос ↑
    const itDev = p.specId === "it" ? (p.rates.it - 4100) / 4100 : 0;        // IT-индекс ↑ → бонус IT
    const rubDev = (p.rates.rub - 92.5) / 92.5;                              // слабый рубль → дороже импорт
    const f = 1 + oilDev * 0.15 + itDev * 0.2 - rubDev * 0.1;
    return Math.max(0.9, Math.min(1.1, f));
  }

  /** Returns true (and ends the game) if any lose condition is met. */
  private checkLose(): boolean {
    const rule = LOSE_RULES.find((r) => r.test(this.player));
    if (!rule) return false;
    // Феникс: один раз вытаскивает из проигрыша вместо game over
    if (this.player.traitId === "phoenix" && !this.player.flags.revived) {
      const p = this.player;
      p.flags.revived = true;
      if (p.money < -20) p.money = 3;
      if (p.nerves >= 100) p.nerves = 60;
      if (p.health <= 0) p.health = 40;
      if (p.shadow >= 100) p.shadow = 60;
      if (p.reputation <= -40) p.reputation = -10;
      if (p.workLife <= 0) p.workLife = 30;
      if (p.karma <= -70) p.karma = -40;
      p.queue.unshift(this.phoenixBeat(rule.title));
      this.phase = "beat";
      return false;
    }
    this.player.flags.lossReason = rule.title;
    this.player.flags.lossDesc = rule.desc;
    this.phase = "ending";
    return true;
  }

  getBeatMiniGame(): MiniGame | null {
    const beat = this.getCurrentBeat();
    if (!beat || !beat.minigame) return null;
    return MONTH1.minigames[beat.minigame] ?? null;
  }

  weekProgress(): { day: number; total: number; week: number } {
    const wk = this.getWeek();
    return { day: this.player.beatIndex + 1, total: wk ? wk.events.length : 0, week: this.player.week };
  }

  /** filter out choices gated by traits the player doesn't have */
  availableBeatChoices(beat: Beat): BeatChoice[] {
    return (beat.choices ?? []).filter(
      (c) => !c.requireTrait || c.requireTrait.includes(this.player.traitId),
    );
  }

  private advisorLinesFor(type: ChoiceType, anna?: string, max?: string): AdvisorLine[] {
    const d = loyaltyDelta[type];
    const lf = this.player.traitId === "empathy" ? 1.5 : 1; // эмпатия: лояльность растёт быстрее
    const amp = (v: number) => (v > 0 ? Math.round(v * lf) : v);
    this.player.annaLoyalty = clamp(this.player.annaLoyalty + amp(d.anna), 0, 100);
    this.player.maxLoyalty = clamp(this.player.maxLoyalty + amp(d.max), 0, 100);
    const lines: AdvisorLine[] = [];
    if (anna) lines.push({ who: "anna", text: anna });
    else lines.push({ who: "anna", text: pick(advisorsData.anna.reactions[type]) });
    if (max) lines.push({ who: "max", text: max });
    else lines.push({ who: "max", text: pick(advisorsData.max.reactions[type]) });
    return lines;
  }

  /** Choose an option on a narrative beat. Returns reaction info; does NOT auto-advance. */
  chooseBeat(choiceId: string): { lines: AdvisorLine[]; choice: BeatChoice } | null {
    const beat = this.getCurrentBeat();
    if (!beat) return null;
    const choice = (beat.choices ?? []).find((c) => c.id === choiceId);
    if (!choice) return null;

    this.player = applyEffects(this.player, choice.effects);
    if (choice.next) {
      this.player.pending.push({
        effects: choice.next,
        text: choice.nextText ?? "Последствие вчерашнего выбора.",
      });
    }
    this.player.history.push({ card: beat.id, choice: choice.id, month: this.player.month });
    const lines = this.advisorLinesFor(choice.type, choice.anna, choice.max);
    return { lines, choice };
  }

  /** Resolve a mini-game beat (win/lose), apply its rewards. Does NOT advance. */
  resolveBeatMiniGame(win: boolean): { effectsText: string } {
    const mg = this.getBeatMiniGame();
    if (!mg) return { effectsText: "" };
    const eff = win ? mg.win : mg.lose;
    if (eff) this.player = applyEffects(this.player, eff);
    return { effectsText: (win ? mg.winText : mg.loseText) ?? "" };
  }

  /** Apply any queued consequences for the day we are entering. */
  private consumePending(): void {
    this.lastConsequences = [];
    if (this.player.pending.length) {
      for (const c of this.player.pending) {
        this.player = applyEffects(this.player, c.effects);
      }
      this.lastConsequences = this.player.pending;
      this.player.pending = [];
    }
  }

  /** Advance to the next beat / week summary. */
  advanceBeat(): void {
    if (this.player.queue.length) {
      this.player.queue.shift(); // injected event done — regular beat stays put
    } else {
      this.player.beatIndex += 1;
    }
    this.consumePending();
    if (this.checkLose()) return;
    if (this.player.queue.length) return; // another injected event next
    const wk = this.getWeek();
    if (!wk || this.player.beatIndex >= wk.events.length) {
      this.phase = "weekSummary";
    }
  }

  /** From the week-summary screen: go to next week, or wrap up Month 1. */
  advanceWeek(): void {
    if (this.player.week >= MONTH1.weeks.length) {
      // Month 1 finished → enter the monthly business-plan flow (shared with later months)
      this.player.pending = [];
      this.lastConsequences = [];
      this.phase = "businessPlan";
      return;
    }
    this.player.week += 1;
    this.player.beatIndex = 0;
    this.driftRates();
    this.consumePending();
    this.maybeInject();
    this.phase = "beat";
  }

  weekDiary(good: boolean): string {
    const wk = this.getWeek();
    if (!wk) return "";
    return good ? wk.diaryGood : wk.diaryBad;
  }

  /** Heuristic: was this week mostly handled well? (drives the diary tone) */
  weekWentWell(): boolean {
    return this.player.karma >= 0 && this.player.shadow < 40 && this.player.health > 35;
  }

  /* ════════════════ MONTHS 2-3 — CLASSIC FLOW ════════════════ */

  private month() {
    return MONTHS[String(this.player.month)] ?? { events: [], checklist: null };
  }

  getCurrentEvent(): Card | null {
    const ev = this.month().events;
    return this.eventIndex < ev.length ? ev[this.eventIndex] : null;
  }

  getChecklist(): Card | null {
    return this.month().checklist;
  }

  getBusinessActions(): BusinessAction[] {
    const actions = [...BUSINESS_ACTIONS];
    if ((this.player.employees || []).length < 1 && this.player.month >= 2) {
      return [
        { id: "hire", name: "Нанять сотрудника", emoji: "👥", cost: 0, effect: "Открыть найм сотрудников и выбрать кандидата" },
        ...actions,
      ];
    }
    return actions;
  }

  getMiniGame(): MiniGame | null {
    return MINIGAMES[this.player.specId] ?? null;
  }

  estimateRevenue(): number {
    return Math.round(this.player.baseRevenue * this.player.multiplier * (1 + this.player.reputation / 100));
  }

  private advisorReactions(type: ChoiceType): AdvisorLine[] {
    return this.advisorLinesFor(type);
  }

  private applyChoice(card: Card, choice: Choice): AdvisorLine[] {
    this.player = applyEffects(this.player, choice.effects);
    if (!this.player.history) this.player.history = [];
    this.player.history.push({ card: card.id, choice: choice.id, month: this.player.month });
    return this.advisorReactions(choice.type);
  }

  processEventChoice(choiceId: string): { lines: AdvisorLine[]; choice: Choice } | null {
    const card = this.getCurrentEvent();
    if (!card) return null;
    const choice = card.choices.find((c) => c.id === choiceId);
    if (!choice) return null;
    const lines = this.applyChoice(card, choice);
    this.eventIndex += 1;
    if (this.eventIndex >= this.month().events.length) this.phase = "businessPlan";
    return { lines, choice };
  }

  processBusinessAction(actionId: string): { action: BusinessAction; minigame: boolean; hiring?: boolean } {
    if (actionId === "hire") {
      const action: BusinessAction = { id: "hire", name: "Нанять сотрудника", emoji: "👥", cost: 0, effect: "Открыть найм сотрудников и выбрать кандидата" };
      return { action, minigame: false, hiring: true };
    }
    const action = BUSINESS_ACTIONS.find((a) => a.id === actionId) ?? BUSINESS_ACTIONS[BUSINESS_ACTIONS.length - 1];
    const cost = this.player.traitId === "charisma" ? Math.round(action.cost * 0.8) : action.cost; // обаяние: скидка 20%
    if (cost) this.player.money -= cost;
    if (action.workLife) this.player = applyEffects(this.player, { workLife: action.workLife });
    if (action.minigame && this.getMiniGame()) {
      this.phase = "minigame";
      return { action, minigame: true };
    }
    this.afterBusiness();
    return { action, minigame: false };
  }

  processHire(empId: string): { success: boolean } {
    const emp = EMPLOYEES.find((e) => e.id === empId);
    if (!emp) return { success: false };
    if (!this.player.employees) this.player.employees = [];
    this.player.employees.push({
      id: emp.id, name: emp.name, emoji: emp.emoji, salary: emp.salary,
      skills: emp.skills, loyalty: emp.loyalty, special: emp.special,
      description: emp.description, hiredMonth: this.player.month,
    });
    this.player.money -= emp.signing_bonus;
    this.afterBusiness();
    return { success: true };
  }

  getTotalSalary(): number {
    return (this.player.employees || []).reduce((sum, e) => sum + (e.salary || 0), 0);
  }

  processMiniGame(correct: boolean): void {
    if (correct) this.player = applyEffects(this.player, { reputation: 3, karma: 1 });
    this.afterBusiness();
  }

  private afterBusiness() {
    this.phase = this.getChecklist() ? "checklist" : "summary";
  }

  processChecklist(choiceId: string): { lines: AdvisorLine[]; choice: Choice } | null {
    const card = this.getChecklist();
    if (!card) {
      this.phase = "summary";
      return null;
    }
    const choice = card.choices.find((c) => c.id === choiceId);
    if (!choice) return null;
    const lines = this.applyChoice(card, choice);
    this.phase = "summary";
    return { lines, choice };
  }

  nextMonth(): void {
    this.driftRates();
    const rev = this.estimateRevenue();
    const salary = this.getTotalSalary();
    const netIncome = Math.round((rev - salary) * this.rateIncomeFactor()); // курсы слабо влияют на доход
    this.player.money += netIncome;
    this.recordStats(netIncome);

    this.player.month += 1;
    if (this.player.month > STAGE1_MONTHS) {
      this.phase = "ending";
    } else {
      this.eventIndex = 0;
      this.player.week = 1;
      this.player.beatIndex = 0;
      this.player.queue = [];
      this.player.flags.inspected = false;
      this.phase = this.hasWeekStream() ? "beat" : "event";
    }
  }

  getEnding(): Stage1Ending {
    if (this.player.flags.lossReason) {
      return {
        id: "lost",
        title: String(this.player.flags.lossReason),
        emoji: "💀",
        desc: String(this.player.flags.lossDesc ?? "Игра окончена."),
        bonus: "",
        cond: "",
      };
    }
    const { shadow, karma } = this.player;
    if (shadow === 0 && karma > 25) return ENDINGS.find((e) => e.id === "ideal")!;
    if (shadow < 20) return ENDINGS.find((e) => e.id === "good")!;
    if (shadow < 50) return ENDINGS.find((e) => e.id === "doubtful")!;
    return ENDINGS.find((e) => e.id === "risky")!;
  }

  toSnapshot(): EngineSnapshot {
    return { player: this.player, phase: this.phase, eventIndex: this.eventIndex, version: "1.1.0" };
  }

  static fromSnapshot(s: EngineSnapshot): GameEngine {
    const eng = new GameEngine(s.player);
    eng.phase = s.phase;
    eng.eventIndex = s.eventIndex;
    if (!eng.player.statsHistory || eng.player.statsHistory.length === 0) {
      eng.player.statsHistory = [];
      eng.recordStats(0);
    }
    return eng;
  }
}

import { useRef, useState } from "react";
import type { GameEngine } from "../engine/engine";
import type { AdvisorLine, Effects, PlayerState } from "../engine/types";
import ResourcePanel from "./ResourcePanel";
import Advisors from "./Advisors";
import MiniGame from "./MiniGame";
import {
  Save, LogOut, Megaphone, Cpu,
  ShieldCheck, Coffee, ChevronRight,
  AlertTriangle, ShieldAlert, Check,
  TrendingUp, Newspaper, Trophy, Award,
  Users, Phone, FolderOpen, Scale, Utensils, Heart, Handshake,
  Receipt, PartyPopper, AlarmClock, Star, Wallet, Banknote, Flame,
  FileText, Package, MessageSquare, Swords, Landmark, Sparkles, BookOpen,
  Volume2, VolumeX,
} from "lucide-react";
import employeesData from "../data/employees.json";
import { AdvisorAvatar } from "./Advisors";
import { sfx, toggleMuted, isMuted } from "../game/sound";
import { confettiBurst } from "../game/confetti";

const PHASE_NAME: Record<string, string> = {
  event: "Входящее событие",
  beat: "Событие дня",
  weekSummary: "Итоги недели",
  businessPlan: "Бизнес-план",
  minigame: "Мини-игра",
  checklist: "Чек-лист проверок",
  summary: "Итоги месяца",
};

const ACTION_ICONS: Record<string, any> = {
  marketing: Megaphone,
  product: Cpu,
  security: ShieldCheck,
  life: Coffee,
  skip: ChevronRight
};

const BEAT_ICONS: Record<string, any> = {
  phone: Phone, folder: FolderOpen, scale: Scale, lunch: Utensils, heart: Heart,
  handshake: Handshake, receipt: Receipt, megaphone: Megaphone, party: PartyPopper,
  alarm: AlarmClock, star: Star, wallet: Wallet, cash: Banknote, danger: AlertTriangle,
  fire: Flame, doc: FileText, box: Package, chat: MessageSquare, swords: Swords,
  bank: Landmark, mirror: Sparkles,
};

const KIND_ACCENT: Record<string, { label: string; cls: string }> = {
  choice: { label: "Событие", cls: "text-indigo-400" },
  lunch: { label: "Обед", cls: "text-amber-400" },
  leisure: { label: "Досуг", cls: "text-orange-400" },
  labor: { label: "Распорядок", cls: "text-rose-400" },
  minigame: { label: "Мини-игра", cls: "text-emerald-400" },
  check: { label: "Проверка", cls: "text-fuchsia-400" },
};

interface Pending { lines?: AdvisorLine[]; note?: string; title?: string; ok?: boolean; next?: () => void }

export default function GameScreen({
  engine, onChange, onSave, onMenu,
}: { engine: GameEngine; onChange: () => void; onSave: () => void; onMenu: () => void }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [delta, setDelta] = useState<Effects | null>(null);
  const [hiringMode, setHiringMode] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const flash = useRef(0);
  const p = engine.player;

  const showDelta = (e: Effects) => {
    flash.current += 1;
    setDelta(e);
    const myId = flash.current;
    setTimeout(() => { if (flash.current === myId) setDelta(null); }, 1500);
  };

  const advance = () => {
    const next = pending?.next;
    setPending(null);
    setHiringMode(false);
    next?.();
    onChange();
  };

  const wrap = (children: React.ReactNode, lines: AdvisorLine[] = []) => (
    <Frame engine={engine} lines={lines} delta={delta} flashKey={flash.current} onSave={onSave} onMenu={onMenu}>
      {children}
    </Frame>
  );

  // result view between an action and the next phase
  if (pending) {
    return wrap(
      <div className={"card glow-indigo " + (pending.ok === false ? "shake border-rose-500/30" : "fade-in border-emerald-500/30")}>
        {pending.title && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
            <span className={pending.ok ? "text-emerald-400" : "text-rose-400"}>
              {pending.ok ? <Check className="w-5 h-5 animate-pulse-glow" /> : <AlertTriangle className="w-5 h-5" />}
            </span>
            <div className={"card-title mb-0" + (pending.ok ? " bounce text-emerald-400" : " text-rose-400")}>
              {pending.title}
            </div>
          </div>
        )}
        {pending.note && <p className="card-text text-gray-300 leading-relaxed text-xs whitespace-pre-line">{pending.note}</p>}
        <button className="btn mt-4 py-2.5" onClick={advance}>Продолжить <ChevronRight className="w-4 h-4" /></button>
      </div>,
      pending.lines ?? []
    );
  }

  // BEAT (Month 1 week-stream)
  if (engine.phase === "beat") {
    const beat = engine.getCurrentBeat();
    if (!beat) { engine.advanceBeat(); onChange(); return null; }
    const cons = engine.lastConsequences;

    // Mini-game beat
    if (beat.kind === "minigame") {
      const mg = engine.getBeatMiniGame();
      if (!mg) { engine.advanceBeat(); onChange(); return null; }
      return wrap(
        <div className="phase-anim" key={"beat-mg" + beat.id}>
          {cons.length > 0 && <ConsequenceBanner cons={cons} />}
          <MiniGame mg={mg} specId={p.specId} traitId={p.traitId} onDone={(correct) => {
            if (correct) { sfx.win(); confettiBurst(); } else sfx.fail();
            const r = engine.resolveBeatMiniGame(correct);
            const eff = correct ? mg.win : mg.lose;
            if (eff) showDelta(eff);
            setPending({ ok: correct, title: correct ? "Мини-игра пройдена" : "Не получилось", note: r.effectsText, next: () => engine.advanceBeat() });
          }} />
        </div>
      );
    }

    // Narrative / lunch / leisure / labor beat
    const Icon = BEAT_ICONS[beat.icon] || Cpu;
    const acc = KIND_ACCENT[beat.kind] || KIND_ACCENT.choice;
    const choices = engine.availableBeatChoices(beat);
    return wrap(
      <div className="phase-anim" key={"beat" + beat.id}>
        {cons.length > 0 && <ConsequenceBanner cons={cons} />}
        {beat.advisor && beat.intro && (
          <div className={"advisor-pop " + beat.advisor}>
            <AdvisorAvatar who={beat.advisor} size={72} />
            <div className="min-w-0">
              <div className={"text-[10px] font-black uppercase tracking-wider " + (beat.advisor === "anna" ? "text-sky-400" : "text-orange-400")}>
                {beat.advisor === "anna" ? "Анна заходит" : "Макс заходит"}
              </div>
              <p className="text-xs text-gray-200 leading-snug mt-0.5">«{beat.intro}»</p>
            </div>
          </div>
        )}
        <div className="card glow-indigo">
          <div className={"card-title text-[11px] uppercase tracking-wider border-b border-gray-800 pb-2 mb-3 flex items-center gap-1.5 " + acc.cls}>
            <Icon className="w-4 h-4" /> {beat.dow} · {acc.label}
          </div>
          <p className="font-extrabold text-white text-base leading-tight mb-2">{beat.title}</p>
          <p className="card-text text-gray-300 text-xs leading-relaxed">{beat.text}</p>
        </div>
        <div className="stack">
          {choices.map((c) => (
            <button key={c.id} data-sfx={beat.kind === "lunch" ? "sip" : beat.kind === "leisure" ? "clink" : "click"} className={"choice " + c.type} onClick={() => {
              const r = engine.chooseBeat(c.id);
              if (!r) return;
              if ((r.choice.effects.money ?? 0) > 0) sfx.cash();
              showDelta(r.choice.effects);
              const note = [
                r.choice.outcome,
                r.choice.bonus ? `🎁 ${r.choice.bonus}` : "",
                r.choice.nextText ? `⏭️ Завтра: ${r.choice.nextText}` : "",
              ].filter(Boolean).join("\n");
              setPending({ lines: r.lines, ok: r.choice.type !== "harmful", title: "Выбор сделан", note, next: () => engine.advanceBeat() });
            }}>
              <span className="dot" /> {c.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // WEEK SUMMARY (Month 1)
  if (engine.phase === "weekSummary") {
    const wk = engine.getWeek();
    const good = engine.weekWentWell();
    const diary = engine.weekDiary(good);
    const lastWeek = p.week >= engine.getMonthContent().weeks.length;
    return wrap(
      <div className="phase-anim" key={"ws" + p.week}>
        <div className={"card " + (good ? "border-emerald-500/30 glow-indigo" : "border-rose-500/30")}>
          <div className="card-title text-sm uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Неделя {p.week}: {wk?.title} — дневник
          </div>
          <p className="card-text text-gray-200 text-sm leading-relaxed italic">«{diary}»</p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <MiniStat label="Деньги" val={`${p.money}$`} cls="text-emerald-400" />
            <MiniStat label="Карма" val={`${p.karma}`} cls="text-purple-400" />
            <MiniStat label="Тень" val={`${p.shadow}%`} cls="text-fuchsia-400" />
            <MiniStat label="Здоровье" val={`${p.health}%`} cls="text-rose-400" />
            <MiniStat label="Энергия" val={`${p.energy}%`} cls="text-cyan-400" />
            <MiniStat label="Репутация" val={`${p.reputation}%`} cls="text-amber-400" />
          </div>
          <button className="btn font-extrabold mt-5" onClick={() => { if (good) confettiBurst(); engine.advanceWeek(); onChange(); }}>
            {lastWeek ? "Свести итоги месяца →" : `Перейти к неделе ${p.week + 1} →`}
          </button>
        </div>
      </div>
    );
  }

  // EVENT
  if (engine.phase === "event") {
    const card = engine.getCurrentEvent();
    if (!card) { engine.phase = "businessPlan"; onChange(); return null; }
    return wrap(
      <div className="phase-anim" key={"ev" + engine.eventIndex}>
        <div className="card glow-indigo">
          <div className="card-title text-sm uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3">
            Случайное событие
          </div>
          <p className="font-extrabold text-white text-base leading-tight mb-2">{card.title}</p>
          <p className="card-text text-gray-300 text-xs leading-relaxed">{card.text}</p>
        </div>
        <div className="stack">
          {card.choices.map((c) => (
            <button key={c.id} className={"choice " + c.type} onClick={() => {
              const r = engine.processEventChoice(c.id);
              if (r) { showDelta(r.choice.effects); setPending({ lines: r.lines, ok: r.choice.type !== "harmful", title: "Выбор сделан", note: r.choice.bonus ? `🎁 Награда: ${r.choice.bonus}` : "Решение принято, советники отреагировали." }); }
            }}>
              <span className="dot" /> {c.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // BUSINESS PLAN
  if (engine.phase === "businessPlan") {
    if (hiringMode) {
      return wrap(
        <div className="phase-anim flex flex-col gap-3" key="hire">
          <div className="card border-indigo-500/20 bg-indigo-500/3 pb-4">
            <div className="card-title text-sm uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">👥 Найм персонала</span>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold text-indigo-300">
                Доступно кандидатов: {candidates.length}
              </span>
            </div>
            <p className="card-text text-gray-300 text-xs leading-relaxed">
              Выберите одного из доступных специалистов. Сильные специалисты требуют более высоких подъёмных и оклада, но приносят большую пользу.
            </p>
          </div>
          
          {/* Candidates Horizontal Carousel */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory pr-2 max-w-full">
            {candidates.map((e) => {
              const isAffordable = e.signing_bonus <= p.money;
              return (
                <div key={e.id} className="min-w-[190px] max-w-[190px] p-3.5 bg-gray-900/60 rounded-xl border border-white/5 flex flex-col justify-between snap-center relative overflow-hidden group hover:border-indigo-500/30 transition-all select-none">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="emp-ava">{(e.name || "?").trim().charAt(0)}</span>
                      <div>
                        <h5 className="text-[11px] font-black text-white leading-tight">{e.name}</h5>
                        <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider mt-0.5">{e.special}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-300 leading-normal font-medium mb-3 min-h-[40px]">{e.description}</p>
                    
                    <div className="space-y-1.5 border-t border-gray-800/60 pt-2 text-[9px] font-bold">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Навыки:</span>
                        <span className="text-white font-mono">{e.skills}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Оклад/мес:</span>
                        <span className="text-emerald-400 font-mono">{e.salary}💰</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Подъёмные:</span>
                        <span className="text-yellow-400 font-mono">{e.signing_bonus}💰</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="btn mt-3.5 py-1.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-400/20"
                    disabled={!isAffordable}
                    onClick={() => {
                      const result = engine.processHire(e.id);
                      if (result.success) {
                        setHiringMode(false);
                        setPending({ ok: true, title: "Сотрудник нанят", note: `👥 В вашу команду вошёл новый специалист: ${e.name.split(",")[0]}.` });
                        onChange();
                      }
                    }}
                  >
                    {isAffordable ? "Нанять" : "Недостаточно средств"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-1">
            <button className="btn ghost py-1.5 px-3 text-[10px]" onClick={() => setHiringMode(false)}>
              Назад в бизнес-план
            </button>
            <span className="text-[10px] text-gray-500 font-semibold italic">Прокрутите вправо ➜</span>
          </div>
        </div>,
        []
      );
    }

    return wrap(
      <div className="phase-anim" key="bp">
        <div className="card glow-indigo">
          <div className="card-title text-sm uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3">
            Тактическое планирование
          </div>
          <p className="card-text text-gray-300 text-xs leading-relaxed">
            Выберите одно инвестиционное направление на текущий месяц. Правильное вложение поднимет выручку, поправит здоровье или повысит качество.
          </p>
        </div>
        <div className="stack">
          {engine.getBusinessActions().map((a) => {
            const ActionIcon = ACTION_ICONS[a.id] || Cpu;
            const isAffordable = a.cost <= p.money;
            return (
              <button 
                key={a.id} 
                className={`choice action ${isAffordable ? "" : "opacity-40 cursor-not-allowed"}`} 
                disabled={!isAffordable}
                onClick={() => {
                  if (a.id === "hire") {
                    const shuffled = [...employeesData].sort(() => 0.5 - Math.random());
                    setCandidates(shuffled.slice(0, 5));
                    setHiringMode(true);
                    return;
                  }
                  const r = engine.processBusinessAction(a.id);
                  if (a.cost || a.workLife) showDelta({ money: a.cost ? -a.cost : undefined, workLife: a.workLife });
                  if (r.minigame) onChange();
                  else setPending({ ok: true, title: a.name, note: `${a.effect}${a.cost ? ` · Инвестировано: ${a.cost}💰` : ""}` });
                }}
              >
                <span className="a-emoji text-indigo-400 bg-white/5 p-1.5 rounded-lg border border-white/5">
                  <ActionIcon className="w-5 h-5" />
                </span>
                <div className="flex-1 text-left">
                  <div className="font-bold text-white text-xs md:text-sm">{a.name} {a.cost ? `(${a.cost}💰)` : ""}</div>
                  <div className="muted text-[11px] mt-0.5">{a.effect}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // MINIGAME (interactive)
  if (engine.phase === "minigame") {
    const mg = engine.getMiniGame();
    if (!mg) { engine.processMiniGame(false); onChange(); return null; }
    return wrap(
      <div className="phase-anim" key="mg">
        <MiniGame mg={mg} specId={p.specId} traitId={p.traitId} onDone={(correct) => {
          if (correct) { sfx.win(); confettiBurst(); } else sfx.fail();
          engine.processMiniGame(correct);
          if (correct) showDelta({ reputation: 3, karma: 1 });
          onChange();
        }} />
      </div>
    );
  }

  // CHECKLIST
  if (engine.phase === "checklist") {
    const card = engine.getChecklist();
    if (!card) { engine.phase = "summary"; onChange(); return null; }
    return wrap(
      <div className="phase-anim" key="cl">
        <div className="card border-fuchsia-500/20 bg-fuchsia-500/3">
          <div className="card-title text-sm uppercase tracking-wider text-fuchsia-400 border-b border-gray-800 pb-2 mb-3">
            Чек-лист проверок органов
          </div>
          <p className="font-extrabold text-white text-base leading-tight mb-2">{card.title}</p>
          <p className="card-text text-gray-300 text-xs leading-relaxed">{card.text}</p>
        </div>
        <div className="stack">
          {card.choices.map((c) => (
            <button key={c.id} className={"choice " + c.type} onClick={() => {
              const r = engine.processChecklist(c.id);
              if (r) { showDelta(r.choice.effects); setPending({ lines: r.lines, ok: r.choice.type !== "harmful", title: "Ответ зафиксирован", note: `Ваше решение обработано. Изменение кармы: ${(r.choice.effects.karma ?? 0) >= 0 ? "+" : ""}${r.choice.effects.karma ?? 0} ☯️` }); }
            }}>
              <span className="dot" /> {c.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // SUMMARY
  if (engine.phase === "summary") {
    const rev = engine.estimateRevenue();
    const salary = engine.getTotalSalary();
    const netIncome = rev - salary;
    return wrap(
      <div className="phase-anim" key="sum">
        <div className="card glow-indigo">
          <div className="card-title text-sm uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3">
            Финансовые итоги месяца
          </div>
          <div className="stat-row">
            <span>📈 Оценка выручки за месяц</span>
            <b className="text-emerald-400 font-mono">+{rev}💰</b>
          </div>
          {salary > 0 && (
            <div className="stat-row">
              <span>👥 Расходы на зарплаты штата</span>
              <b className="text-rose-400 font-mono">-{salary}💰</b>
            </div>
          )}
          {salary > 0 && (
            <div className="stat-row border-t border-gray-800/40 pt-1.5 font-bold">
              <span>📊 Чистая прибыль за месяц</span>
              <b className={netIncome >= 0 ? "text-emerald-400 font-mono font-black" : "text-rose-400 font-mono font-black"}>
                {netIncome >= 0 ? "+" : ""}{netIncome}💰
              </b>
            </div>
          )}
          <div className="stat-row">
            <span>💰 Доступные свободные средства</span>
            <b className="font-mono">{p.money}💰</b>
          </div>
          <div className="stat-row">
            <span>⭐ Репутация бренда стартапа</span>
            <b className="text-amber-400 font-mono">{p.reputation}%</b>
          </div>
          <div className="stat-row">
            <span>🌙 Интерес налоговой (Тень)</span>
            <b className="text-fuchsia-400 font-mono">{p.shadow}%</b>
          </div>
          <div className="stat-row">
            <span>☯️ Карма предпринимателя</span>
            <b className="text-purple-400 font-mono">{p.karma}</b>
          </div>
          
          {/* Glowing neon warnings */}
          {p.nerves < 20 && (
            <div className="p-3 rounded-xl border border-rose-500/25 bg-rose-500/5 text-xs text-rose-300 flex gap-2 items-start animate-pulse-warn mt-4">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-xs">Критический уровень стресса!</p>
                <p className="text-[10px] text-gray-400 leading-normal mt-0.5">Нервы на исходе. Сделайте Кофе-брейк в бизнес-плане, иначе игра закончится!</p>
              </div>
            </div>
          )}
          {p.shadow > 50 && (
            <div className="p-3 rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/5 text-xs text-fuchsia-300 flex gap-2 items-start animate-pulse-warn mt-3">
              <ShieldAlert className="w-4.5 h-4.5 text-fuchsia-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-white text-xs">Высокий интерес проверяющих!</p>
                <p className="text-[10px] text-gray-400 leading-normal mt-0.5">У вас слишком высокий теневой оборот. Рекомендуется инвестировать в Безопасность.</p>
              </div>
            </div>
          )}
          
          <button className="btn font-extrabold" style={{ marginTop: 20 }} onClick={() => { confettiBurst(); engine.nextMonth(); onChange(); }}>
            {p.month >= 3 ? "Подвести итоги этапа →" : "Перейти к следующему месяцу →"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function ConsequenceBanner({ cons }: { cons: { text: string }[] }) {
  return (
    <div className="conseq-banner fade-in">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">Последствие вчерашнего дня</div>
        {cons.map((c, i) => (
          <p key={i} className="text-[11px] text-gray-200 leading-snug mt-0.5">{c.text}</p>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, val, cls }: { label: string; val: string; cls: string }) {
  return (
    <div className="bg-gray-950/50 border border-white/5 rounded-xl py-2">
      <div className={"font-mono font-black text-sm " + cls}>{val}</div>
      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function Frame({
  engine, lines, delta, flashKey, onSave, onMenu, children,
}: {
  engine: GameEngine; lines: AdvisorLine[]; delta?: Effects | null; flashKey?: number;
  onSave: () => void; onMenu: () => void; children: React.ReactNode;
}) {
  const p = engine.player;
  const steps: Array<{ k: string; label: string }> = [
    { k: "event", label: "Событие" },
    { k: "businessPlan", label: "План" },
    { k: "checklist", label: "Чек" },
    { k: "summary", label: "Итоги" },
  ];
  const [muted, setMutedUI] = useState(isMuted());
  const active = engine.phase === "minigame" ? "businessPlan" : engine.phase;
  const weekStream = engine.hasWeekStream() && (engine.phase === "beat" || engine.phase === "weekSummary");
  const wk = weekStream ? engine.getWeek() : null;
  const wp = weekStream ? engine.weekProgress() : null;

  // Live market rates — real random-walk state from the engine (small, realistic moves)
  const rates = p.rates ?? { rub: 92.5, oil: 74.2, it: 4100 };
  const ratesPrev = p.ratesPrev ?? rates;
  const rubChange = rates.rub - ratesPrev.rub;
  const rubVal = rates.rub.toFixed(2);
  const rubPctVal = ratesPrev.rub ? (rubChange / ratesPrev.rub) * 100 : 0;

  const oilChange = rates.oil - ratesPrev.oil;
  const oilVal = rates.oil.toFixed(2);
  const oilPctVal = ratesPrev.oil ? (oilChange / ratesPrev.oil) * 100 : 0;

  const itChange = rates.it - ratesPrev.it;
  const itVal = Math.round(rates.it).toLocaleString();
  const itPctVal = ratesPrev.it ? (itChange / ratesPrev.it) * 100 : 0;

  // News Gazette Headline choice
  const news = getNewsHeadline(p.month, p.specId);

  // Achievements evaluation
  const achMillionaire = p.money >= 150;
  const achShadow = p.shadow >= 50;
  const achShark = p.reputation >= 50;

  return (
    <div className="game-layout">
      {/* LEFT COLUMN: Stat panel + Advisors dialogue */}
      <div className="layout-left">
        <ResourcePanel p={p} delta={delta} flashKey={flashKey} />
        
        {/* Employees Panel (Desktop only) */}
        <div className="glass-panel rounded-2xl border border-white/5 p-4 relative mt-1 desktop-advisors">
          <h5 className="font-bold text-[10px] uppercase tracking-wider text-gray-300 mb-3 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Команда штата
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-black text-indigo-300">
              {(p.employees || []).length} чел.
            </span>
          </h5>
          
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
            {(p.employees || []).length === 0 ? (
              <p className="text-[10px] text-gray-400 font-semibold italic text-center py-4 leading-normal">
                Штат пуст. Наймите помощников в фазе Бизнес-плана со 2-го месяца.
              </p>
            ) : (
              (p.employees || []).map((e) => (
                <div key={e.id} className="p-2 bg-gray-950/40 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="emp-ava sm shrink-0">{(e.name || "?").trim().charAt(0)}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate leading-tight">{e.name.split(",")[0]}</p>
                      <p className="text-[9px] text-indigo-400 font-extrabold truncate uppercase tracking-wide mt-0.5">{e.special}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-bold font-mono text-[9px]">
                    <span className="text-emerald-400">-{e.salary}💰</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Desktop stacked advisors */}
        <div className="desktop-advisors mt-4">
          <Advisors p={p} lines={lines} />
        </div>
      </div>

      {/* CENTER COLUMN: Main game events & actions cards */}
      <div className="layout-center">
        <div className="phase-head">
          <span className="badge">
            {weekStream ? `Месяц ${p.month} · Неделя ${p.week} · ${wk?.title ?? ""}` : `Месяц ${p.month} · ${PHASE_NAME[engine.phase]}`}
          </span>
          <div className="toolbar">
            <button className="icon-btn" title={muted ? "Включить звук" : "Выключить звук"} onClick={() => setMutedUI(toggleMuted())}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button className="icon-btn" title="Сохранить" onClick={onSave}>
              <Save className="w-4 h-4" />
            </button>
            <button className="icon-btn" title="Выйти в меню" onClick={onMenu}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {weekStream && wp ? (
          <div className="day-dots">
            {Array.from({ length: wp.total }).map((_, i) => (
              <span key={i} className={"day-dot" + (i < wp.day - 1 ? " done" : i === wp.day - 1 && engine.phase === "beat" ? " on" : "")} />
            ))}
            <span className="day-dots-label">{engine.phase === "weekSummary" ? "Неделя пройдена" : `День ${wp.day} из ${wp.total}`}</span>
          </div>
        ) : (
          <div className="steps">
            {steps.map((s) => (
              <span key={s.k} className={"step" + (s.k === active ? " on" : "")}>{s.label}</span>
            ))}
          </div>
        )}
        
        {children}

        {/* Mobile bottom-docked advisors */}
        <div className="mobile-advisors mt-2">
          <Advisors p={p} lines={lines} />
        </div>
      </div>

      {/* RIGHT COLUMN (PC Only): Gazette news, dynamic stock tickers, awards, and indicators analytics chart */}
      <div className="layout-right">
        {/* News Gazette */}
        <div className="glass-panel rounded-2xl border border-white/5 p-4 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent blur-xl pointer-events-none"></div>
          <div>
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <Newspaper className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              Ведомости Империи
            </h5>
            <div className="border-t border-gray-800/60 pt-2">
              <p className="text-xs font-bold text-white leading-snug">{news.title}</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal font-semibold">{news.desc}</p>
            </div>
          </div>
          <div className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-wider mt-3 border-t border-gray-800/40 pt-1.5 flex justify-between">
            <span>Выпуск №{p.month}</span>
            <span>Мнение Рынка</span>
          </div>
        </div>

        {/* Stock Tickers */}
        <div className="glass-panel rounded-2xl border border-white/5 p-3 flex justify-between gap-1 select-none">
          <div className="flex-1 text-center border-r border-gray-800/60 pr-1">
            <span className="text-[9px] text-gray-400 font-extrabold block">USD/RUB</span>
            <span className="text-xs font-black text-white font-mono block mt-0.5">{rubVal}₽</span>
            <span className={`text-[9px] font-bold block ${rubChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {rubChange >= 0 ? "+" : ""}{rubPctVal.toFixed(2)}% {rubChange >= 0 ? "▲" : "▼"}
            </span>
          </div>
          <div className="flex-1 text-center border-r border-gray-800/60 px-1">
            <span className="text-[9px] text-gray-400 font-extrabold block">BRENT OIL</span>
            <span className="text-xs font-black text-white font-mono block mt-0.5">${oilVal}</span>
            <span className={`text-[9px] font-bold block ${oilChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {oilChange >= 0 ? "+" : ""}{oilPctVal.toFixed(2)}% {oilChange >= 0 ? "▲" : "▼"}
            </span>
          </div>
          <div className="flex-1 text-center pl-1">
            <span className="text-[9px] text-gray-400 font-extrabold block">RTS IT Index</span>
            <span className="text-xs font-black text-white font-mono block mt-0.5">{itVal}</span>
            <span className={`text-[9px] font-bold block ${itChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {itChange >= 0 ? "+" : ""}{itPctVal.toFixed(2)}% {itChange >= 0 ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-3 gap-2 select-none">
          <div className={`p-2 border rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 ${achMillionaire ? "bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/15 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-gray-950/30 border-white/5 opacity-40"}`}>
            <Trophy className={`w-4 h-4 ${achMillionaire ? "text-emerald-400 filter drop-shadow-[0_0_2px_rgba(16,185,129,0.5)] animate-bounce" : "text-gray-500"}`} />
            <span className={`text-[8px] font-extrabold uppercase mt-1 ${achMillionaire ? "text-emerald-300" : "text-gray-300"}`}>Капитал</span>
          </div>
          <div className={`p-2 border rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 ${achShadow ? "bg-fuchsia-500/10 border-fuchsia-500/40 ring-2 ring-fuchsia-500/15 shadow-[0_0_10px_rgba(217,70,239,0.2)]" : "bg-gray-950/30 border-white/5 opacity-40"}`}>
            <Award className={`w-4 h-4 ${achShadow ? "text-fuchsia-400 filter drop-shadow-[0_0_2px_rgba(217,70,239,0.5)]" : "text-gray-500"}`} />
            <span className={`text-[8px] font-extrabold uppercase mt-1 ${achShadow ? "text-fuchsia-300" : "text-gray-300"}`}>Тень</span>
          </div>
          <div className={`p-2 border rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 ${achShark ? "bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/15 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-gray-950/30 border-white/5 opacity-40"}`}>
            <TrendingUp className={`w-4 h-4 ${achShark ? "text-amber-400 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]" : "text-gray-500"}`} />
            <span className={`text-[8px] font-extrabold uppercase mt-1 ${achShark ? "text-amber-300" : "text-gray-300"}`}>Акула</span>
          </div>
        </div>

        {/* Dynamic Analytics SVG curves chart */}
        <IndicatorChart p={p} />

        {/* Rotating business tip — fills space + nudges the player like a textbook */}
        <TipBox p={p} />
      </div>
    </div>
  );
}

const TIPS: string[] = [
  "Раздели личный и бизнес-счёт — налоговая это любит, а ты не запутаешься.",
  "Чек через «Мой налог» за пару секунд экономит штраф в тысячи.",
  "Тень закона копится тихо, а проверка приходит внезапно. Держи её низкой.",
  "Здоровье и энергия — твой главный актив. Без них бизнеса не будет.",
  "Баланс работы и жизни на нуле = выгорание. Отдых это инвестиция.",
  "Репутация — множитель выручки. Один честный чек работает на тебя годами.",
  "Карма в плюсе открывает бонусы. Помогай и будь честным — это окупается.",
  "Дешёвый обед на бегу бьёт по здоровью. Иногда выгоднее поесть нормально.",
  "Бар до утра весел сегодня — и дорог завтра. Считай последствия.",
  "Не гонись за быстрым налом без чека: это отложенный штраф.",
  "Слабый рубль — дороже импорт. Следи за курсами, планируй закупки.",
  "Постоянный клиент со скидкой надёжнее разового на полную цену.",
];

function TipBox({ p }: { p: PlayerState }) {
  const idx = ((p.month - 1) * 28 + (p.week - 1) * 7 + p.beatIndex) % TIPS.length;
  const moodAnna = p.annaLoyalty >= 60 ? "довольна" : p.annaLoyalty <= 40 ? "встревожена" : "нейтральна";
  const moodMax = p.maxLoyalty >= 60 ? "в ударе" : p.maxLoyalty <= 40 ? "ворчит" : "спокоен";
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-4 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-400/10 blur-2xl rounded-full pointer-events-none" />
      <h5 className="font-bold text-[11px] uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2 select-none">
        <span className="text-amber-300">💡</span> Совет дня
      </h5>
      <p className="text-xs text-gray-200 leading-relaxed border-t border-gray-800/60 pt-2">{TIPS[idx]}</p>
      <div className="mt-3 flex items-center justify-between text-[10px] font-bold border-t border-gray-800/40 pt-2">
        <span className="text-sky-400">Анна: {moodAnna}</span>
        <span className="text-orange-400">Макс: {moodMax}</span>
      </div>
    </div>
  );
}

// Interactive Indicators Curve Chart Component (with responsive custom hover tooltips)
function IndicatorChart({ p }: { p: PlayerState }) {
  const [activeTab, setActiveTab] = useState<"money" | "nerves" | "rep" | "shadow">("money");
  const [hoveredPoint, setHoveredPoint] = useState<{ month: number; value: number; x: number; y: number } | null>(null);

  const history = p.statsHistory || [];
  if (history.length < 2) {
    return (
      <div className="glass-panel rounded-2xl border border-white/5 p-4 relative flex flex-col min-h-[220px]">
        <h5 className="font-bold text-[11px] uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2 select-none">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          Динамика показателей
        </h5>
        <div className="relative w-full h-[110px] bg-gray-950/80 rounded-xl border border-white/5 flex items-center justify-center flex-grow">
          <span className="text-[10px] font-black tracking-wider uppercase text-indigo-400 opacity-80 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.4)]">
            Аналитика со 2-го месяца
          </span>
        </div>
      </div>
    );
  }

  const svgWidth = 300;
  const svgHeight = 110;

  const points = history.map((pt) => {
    let val = 0;
    if (activeTab === "money") val = pt.income;
    else if (activeTab === "nerves") val = pt.nerves;
    else if (activeTab === "rep") val = pt.reputation;
    else if (activeTab === "shadow") val = pt.shadow;
    return { month: pt.month, value: val };
  });

  const vals = points.map((pt) => pt.value);
  const minVal = Math.min(...vals, 0);
  const maxVal = Math.max(...vals, 10);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const mappedPoints = points.map((pt, index) => {
    const x = (index / (points.length - 1)) * (svgWidth - 24) + 12;
    const y = svgHeight - 12 - ((pt.value - minVal) / range) * (svgHeight - 24);
    return { x, y, month: pt.month, value: pt.value };
  });

  let strokeCol = "#10b981"; // Default Emerald
  let fillCol = "rgba(16,185,129,0.06)";
  if (activeTab === "nerves") { strokeCol = "#f43f5e"; fillCol = "rgba(244,63,94,0.06)"; }
  else if (activeTab === "rep") { strokeCol = "#fbbf24"; fillCol = "rgba(251,191,36,0.06)"; }
  else if (activeTab === "shadow") { strokeCol = "#d946ef"; fillCol = "rgba(217,70,239,0.06)"; }

  // Build stroke path string
  let dPath = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
  for (let i = 1; i < mappedPoints.length; i++) {
    dPath += ` L ${mappedPoints[i].x} ${mappedPoints[i].y}`;
  }
  const dAreaPath = `${dPath} L ${mappedPoints[mappedPoints.length - 1].x} ${svgHeight - 4} L ${mappedPoints[0].x} ${svgHeight - 4} Z`;

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-4 relative flex flex-col min-h-[220px]">
      <h5 className="font-bold text-[11px] uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-2 select-none">
        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
        Динамика показателей
      </h5>
      
      {/* Curves toggle buttons */}
      <div className="flex gap-1 mb-2.5 select-none shrink-0 overflow-x-auto">
        {(["money", "nerves", "rep", "shadow"] as const).map((tab) => {
          const labels = { money: "Прибыль", nerves: "Нервы", rep: "Реп", shadow: "Тень" };
          const active = activeTab === tab;
          let btnClass = "px-2 py-0.5 rounded text-[10px] font-black border transition-all ";
          if (active) {
            if (tab === "money") btnClass += "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
            else if (tab === "nerves") btnClass += "bg-rose-500/10 text-rose-300 border-rose-500/25";
            else if (tab === "rep") btnClass += "bg-amber-500/10 text-amber-300 border-amber-500/25";
            else if (tab === "shadow") btnClass += "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/25";
          } else {
            btnClass += "bg-gray-950/60 text-gray-400 border-white/5 hover:bg-gray-900";
          }
          return (
            <button key={tab} className={btnClass} onClick={() => { setActiveTab(tab); setHoveredPoint(null); }}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* SVG graph container */}
      <div className="relative w-full h-[110px] bg-gray-950/80 rounded-xl border border-white/5 overflow-hidden flex-grow flex items-center justify-center">
        <svg className="w-full h-full p-2 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
          <path d={dAreaPath} fill={fillCol} />
          <path d={dPath} stroke={strokeCol} strokeWidth="2.2" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${strokeCol}99)` }} />
          
          {mappedPoints.map((pDot, i) => (
            <circle
              key={i}
              cx={pDot.x}
              cy={pDot.y}
              r={hoveredPoint?.month === pDot.month ? 5.5 : 3.5}
              fill={hoveredPoint?.month === pDot.month ? "#ffffff" : strokeCol}
              stroke="#030712"
              strokeWidth="1.5"
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredPoint(pDot)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Custom interactive tooltip overlay */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-950/95 text-[10px] text-gray-100 border px-2 py-1.5 rounded-lg shadow-2xl pointer-events-none transition-all duration-150 z-20 font-bold font-mono"
            style={{ 
              left: `${Math.min(100 - 30, Math.max(5, (hoveredPoint.x / svgWidth) * 100 - 15))}%`, 
              top: `${Math.max(5, hoveredPoint.y - 34)}px`,
              borderColor: strokeCol
            }}
          >
            М{hoveredPoint.month}: {
              activeTab === "money" ? `Выручка: ${hoveredPoint.value > 0 ? "+" : ""}${hoveredPoint.value}💰` :
              activeTab === "nerves" ? `Нервы: ${hoveredPoint.value}%` :
              activeTab === "rep" ? `Репутация: ${hoveredPoint.value}%` :
              `Тень: ${hoveredPoint.value}%`
            }
          </div>
        )}
      </div>
    </div>
  );
}

// News headline dynamic choices
function getNewsHeadline(month: number, specId: string): { title: string; desc: string } {
  const IT_NEWS = [
    { title: `"Деплой в пятницу вечером признан новой субкультурой"`, desc: `Разработчики массово выкатывают горячие фиксы перед выходными, игнорируя тесты. Пользователи заявляют, что баги делают геймплей веселее.` },
    { title: `"Нейросети начали писать костыли за старших программистов"`, desc: `Новый российский ИИ-стартап обещает сократить расходы на кодинг до нуля. Единственная проблема — код молится на запуск.` },
    { title: `"Резкий дефицит джунов на рынке стартапов"`, desc: `IT-компании готовы нанимать студентов первого курса по фотографии паспорта и знанию слова 'React'.` }
  ];
  const EDU_NEWS = [
    { title: `"Курсы успешного успеха переполняют рунет"`, desc: `Инфопредприниматели бьют рекорды продаж. Самым популярным уроком стал вебинар о том, как правильно визуализировать Lambo.` },
    { title: `"Прогревы в соцсетях признаны новым видом искусства"`, desc: `Сторителлинг стал настолько экологичным, что подписчики отдают свои деньги добровольно и с чувством глубокой благодарности.` },
    { title: `"Вводятся новые стандарты для онлайн-школ"`, desc: `Минобрнауки планирует проверять курсы на уровень 'воды'. Процент практической пользы теперь должен быть не менее 40%.` }
  ];
  const PROD_NEWS = [
    { title: `"Заводской гудок признан новым трендом"`, desc: `Молодые стартаперы отказываются от коворкингов в пользу аренды токарных цехов. Каска и защитные очки — главный писк моды.` },
    { title: `"Токари шестого разряда стали элитой рынка труда"`, desc: `Крупные заводы ведут настоящую войну за квалифицированных мастеров, переманивая их бесплатным кефиром и ДМС.` },
    { title: `"Отечественные станки бьют рекорды производительности"`, desc: `Инженеры заявляют, что после смазки деталей и протирки фар станки начинают работать со скоростью звука.` }
  ];
  const CATERING_NEWS = [
    { title: `"Секретный ингредиент борща взволновал ресторанных критиков"`, desc: `Посетители гадают, добавляют ли в бульон секретную приправу или просто варят его на мясной косточке с душой и заботой.` },
    { title: `"Шаурма официально признана здоровым фитнес-обедом"`, desc: `Популярные диетологи доказали, что идеальный баланс белков курицы и клетчатки капусты продлевает жизнь на 10 лет.` },
    { title: `"Бариста соревнуются в рисовании налоговых деклараций на пенке"`, desc: `Посетители заказывают кофе без пенки, опасаясь намёков от искусных мастеров латте-арта.` }
  ];
  const RETAIL_NEWS = [
    { title: `"Мерчандайзинг творит чудеса на полках магазинов"`, desc: `Выкладка товаров на уровне глаз увеличила продажи акционных сухариков на 300%. Покупатели в замешательстве.` },
    { title: `"Пакет-майка стал главным доходным активом ритейла"`, desc: `Продажи брендированных пластиковых пакетов на кассе превысили чистую прибыль от импорта элитного шоколада.` },
    { title: `"Флуктуации ценников напугали покупателей"`, desc: `Администрация уверяет, что несовпадение цены на кассе и на витрине — это всего лишь квантовый сбой и шутка мерчандайзера.` }
  ];
  const SERVICES_NEWS = [
    { title: `"Очередь к барберам расписана до конца десятилетия"`, desc: `Мужчины готовы ждать годами ради стрижки бороды, бесплатного виски и душевного разговора о смысле жизни.` },
    { title: `"Салоны красоты тестируют вау-сервис с психоаналитиками"`, desc: `Клиентам предлагают чашку матча-латте, тёплый плед и сеанс проработки детских травм прямо во время мытья головы.` },
    { title: `"Ножницы стилистов признаны главным оружием стиля"`, desc: `Профессиональные парикмахеры заявляют, что качественная укладка способна спасти даже самое провальное свидание.` }
  ];
  const AGRI_NEWS = [
    { title: `"Элитная морковь бьёт рекорды урожайности"`, desc: `Фермеры рапортуют о великолепном качестве чернозёма. Намечаются рекордные поставки сочных яблок на экспорт.` },
    { title: `"Учёные вывели сорт картофеля, защищённый шифрованием"`, desc: `Колорадские жуки не могут расшифровать геном нового картофеля и объявили бессрочную голодовку.` },
    { title: `"Лунный календарь признан единственным верным роадмапом"`, desc: `Агрономы отказываются сеять пшеницу без сверки с фазами Луны, ссылаясь на риск ухудшения кармы урожая.` }
  ];

  let list = IT_NEWS;
  if (specId === "education") list = EDU_NEWS;
  else if (specId === "production") list = PROD_NEWS;
  else if (specId === "catering") list = CATERING_NEWS;
  else if (specId === "retail") list = RETAIL_NEWS;
  else if (specId === "services") list = SERVICES_NEWS;
  else if (specId === "agriculture") list = AGRI_NEWS;

  return list[(month - 1) % list.length];
}

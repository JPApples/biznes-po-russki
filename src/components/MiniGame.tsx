import { useMemo, useState, useEffect } from "react";
import type { MiniGame as MG } from "../engine/types";
import { sfx, startEventAmbience } from "../game/sound";
import {
  Laptop, GraduationCap, Factory, Utensils,
  ShoppingCart, Scissors, Sprout, CheckCircle2,
  XCircle, Loader2, Play, HelpCircle, SlidersHorizontal
} from "lucide-react";

type Result = "none" | "ok" | "fail";

// Fun check messages for suspense loader based on specialization
const CHECKING_MESSAGES: Record<string, string[]> = {
  it: ["Компилируем проект...", "Прогоняем юнит-тесты на проде...", "Ловим NullPointerException...", "Молимся за успешный деплой..."],
  education: ["Запускаем автовебинар...", "Модерируем чат от хейтеров...", "Проверяем конверсию лидов...", "Прогреваем холодную аудиторию..."],
  production: ["Проверяем давление в бойлере...", "Сверяем замеры с ГОСТом...", "Тестируем режущую фрезу...", "Разогреваем двигатели..."],
  catering: ["Замешиваем фирменный соус...", "Снимаем пробу шеф-поваром...", "Проверяем свежесть продуктов...", "Красиво сервируем тарелку..."],
  retail: ["Проверяем штрихкоды в системе...", "Сверяем ценники с кассой...", "Оцениваем выкладку на витрине...", "Заполняем журнал мерчандайзинга..."],
  services: ["Стерилизуем рабочие инструменты...", "Греем полотенца для лица...", "Наливаем ароматный эспрессо...", "Проверяем запись в CRM..."],
  agriculture: ["Измеряем влажность почвы...", "Проверяем теплицы на сквозняки...", "Сверяем фазы Луны...", "Оцениваем всхожесть семян..."]
};

// Specialization details
const SPEC_DETAILS: Record<string, { icon: any; color: string }> = {
  it: { icon: Laptop, color: "text-indigo-400" },
  education: { icon: GraduationCap, color: "text-violet-400" },
  production: { icon: Factory, color: "text-amber-400" },
  catering: { icon: Utensils, color: "text-rose-400" },
  retail: { icon: ShoppingCart, color: "text-emerald-400" },
  services: { icon: Scissors, color: "text-sky-400" },
  agriculture: { icon: Sprout, color: "text-green-400" }
};

// Renders the mini-game it is given (spec-appropriate game comes from the caller).
// showAnswer (perk «Интуиция» / «Железная логика») reveals the correct/wrong marking.
export default function MiniGame({ mg, specId = "it", traitId, onDone }: { mg: MG; specId?: string; traitId?: string; onDone: (correct: boolean) => void }) {
  const showAnswer = traitId === "intuition" || traitId === "iron_logic";
  switch (mg.type) {
    case "order": return <OrderGame mg={mg} specId={specId} showAnswer={showAnswer} onDone={onDone} />;
    case "quiz": return <QuizGame mg={mg} specId={specId} showAnswer={showAnswer} onDone={onDone} />;
    case "slider": return <SliderGame mg={mg} specId={specId} showAnswer={showAnswer} onDone={onDone} />;
    case "drag": return <DragGame mg={mg} onDone={onDone} />;
    default: return <SelectGame mg={mg} specId={specId} showAnswer={showAnswer} onDone={onDone} />;
  }
}

/* ---------- DRAG: drag (or tap) items onto a target — coffee/lunch/bar moments ---------- */
function DragGame({ mg, onDone }: { mg: MG; onDone: (c: boolean) => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [over, setOver] = useState(false);
  const targetGlyph = mg.correct[0] || "🎯";
  const isBar = /бар|чока|🍺|🥂/i.test(mg.name + mg.prompt);
  const allDone = placed.length >= mg.items.length;

  // ambient cafe / bar noise while the scene is open
  useEffect(() => {
    const stop = startEventAmbience(isBar ? "bar" : "cafe");
    return stop;
  }, [isBar]);

  const place = (i: number) => {
    if (placed.includes(i) || allDone) return;
    const np = [...placed, i];
    setPlaced(np);
    if (isBar) sfx.clink(); else sfx.sip();
    if (np.length >= mg.items.length) setTimeout(() => onDone(true), 700);
  };

  return (
    <div className="card fade-in mg glow-indigo">
      <div className="card-title text-sm md:text-base mb-1">{mg.name}</div>
      <p className="card-text text-gray-300 font-medium mb-3">{mg.prompt}</p>
      <div className="dnd-scene">
        <div className="dnd-items">
          {mg.items.map((it, i) => (
            placed.includes(i) ? null : (
              <div key={i} className="dnd-item" draggable
                onDragStart={(e) => e.dataTransfer.setData("text", String(i))}
                onClick={() => place(i)}
                title="Перетащи или тапни">
                {it}
              </div>
            )
          ))}
          {allDone && <span className="text-xs text-emerald-400 font-bold">Готово!</span>}
        </div>
        <div className={"dnd-target" + (over ? " over" : "") + (allDone ? " full" : "")}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const i = Number(e.dataTransfer.getData("text")); if (!Number.isNaN(i)) place(i); }}>
          <span className="dnd-target-glyph">{targetGlyph}</span>
          <span className="dnd-count">{placed.length}/{mg.items.length}</span>
        </div>
      </div>
      <p className="muted text-[11px] mt-2">Перетащи элементы на цель (или просто тапни).</p>
    </div>
  );
}

// Indirect hint from Anna — a nudge + where to look, never the literal answer.
function Hint({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div className="mg-hint">
      {open
        ? <p className="mg-hint-text fade-in">💡 <b className="text-sky-300">Анна намекает:</b> {text}</p>
        : <button className="mg-hint-btn" onClick={() => setOpen(true)}><HelpCircle className="w-3.5 h-3.5" /> Подсказка</button>}
    </div>
  );
}

// Suspense spinner before revealing results
function finish(
  result: boolean, 
  set: (r: Result) => void, 
  setChecking: (b: boolean) => void, 
  onDone: (c: boolean) => void
) {
  setChecking(true);
  setTimeout(() => {
    setChecking(false);
    set(result ? "ok" : "fail");
    // Win auto-advances; a loss waits for the player to press "Продолжить".
    if (result) setTimeout(() => onDone(true), 1600);
  }, 1400); // 1.4 seconds of gamified suspense
}

/* ---------- ORDER: tap items to build the correct sequence ---------- */
function OrderGame({ mg, specId, showAnswer, onDone }: { mg: MG; specId: string; showAnswer: boolean; onDone: (c: boolean) => void }) {
  const [seq, setSeq] = useState<string[]>([]);
  const [result, setResult] = useState<Result>("none");
  const [checking, setChecking] = useState(false);
  const pool = mg.items.filter((i) => !seq.includes(i));
  const slots = mg.correct.length; // distractors allowed: only need the correct count placed
  const done = seq.length === slots;
  const locked = result !== "none" || checking;

  const spec = SPEC_DETAILS[specId] || { icon: Laptop, color: "text-indigo-400" };
  const SpecIcon = spec.icon;

  const check = () => finish(seq.join("|") === mg.correct.join("|"), setResult, setChecking, onDone);

  return (
    <div className={"card fade-in mg" + (result === "fail" ? " shake border-rose-500/40" : result === "ok" ? " border-emerald-500/40 glow-emerald" : " glow-indigo")}>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
        <div className={`p-2 rounded-xl bg-white/5 ${spec.color}`}>
          <SpecIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="card-title mb-0 text-sm md:text-base">{mg.name}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Сортировка блоков</div>
        </div>
      </div>

      <p className="card-text text-gray-300 font-medium mb-2">{mg.prompt}</p>
      <Hint text={mg.hint} />

      {/* Selected Sequence Slots */}
      <div className="mg-seq">
        {Array.from({ length: slots }).map((_, i) => (
          <div key={i} className={"mg-slot" + (seq[i] ? " filled" : "")}>
            {seq[i] ? (
              <button 
                className="mg-chip in active" 
                disabled={locked} 
                onClick={() => setSeq(seq.filter((x) => x !== seq[i]))}
                title="Нажмите, чтобы убрать блок"
              >
                <span className="mg-num">{i + 1}</span> {seq[i]}
              </button>
            ) : (
              <span className="mg-ph">{i + 1}. Ожидает выбора...</span>
            )}
          </div>
        ))}
      </div>

      {/* Available items pool */}
      {pool.length > 0 && !locked && (
        <div className="mg-pool">
          {pool.map((item) => (
            <button key={item} className="mg-chip pop toggle active" onClick={() => setSeq([...seq, item])}>
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Loading Suspense Overlay */}
      {checking && <Loader specId={specId} />}

      {/* Feedback Panel */}
      {!checking && <Feedback result={result} showAnswer={showAnswer} correctText={mg.correct.join(" → ")} onContinue={() => onDone(false)} />}

      {/* Action buttons */}
      {!locked && (
        <button 
          className="btn" 
          style={{ marginTop: 16 }} 
          disabled={!done} 
          onClick={check}
        >
          <Play className="w-4 h-4" />
          {done ? "Проверить ✓" : `Заполни все блоки (${seq.length}/${slots})`}
        </button>
      )}
    </div>
  );
}

/* ---------- SELECT: toggle the correct set of items ---------- */
function SelectGame({ mg, specId, showAnswer, onDone }: { mg: MG; specId: string; showAnswer: boolean; onDone: (c: boolean) => void }) {
  const [sel, setSel] = useState<string[]>([]);
  const [result, setResult] = useState<Result>("none");
  const [checking, setChecking] = useState(false);
  const correctSet = useMemo(() => new Set(mg.correct), [mg.correct]);
  const locked = result !== "none" || checking;

  const spec = SPEC_DETAILS[specId] || { icon: Laptop, color: "text-indigo-400" };
  const SpecIcon = spec.icon;

  const toggle = (i: string) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const check = () => {
    const ok = sel.length === correctSet.size && sel.every((s) => correctSet.has(s));
    finish(ok, setResult, setChecking, onDone);
  };

  return (
    <div className={"card fade-in mg" + (result === "fail" ? " shake border-rose-500/40" : result === "ok" ? " border-emerald-500/40 glow-emerald" : " glow-indigo")}>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
        <div className={`p-2 rounded-xl bg-white/5 ${spec.color}`}>
          <SpecIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="card-title mb-0 text-sm md:text-base">{mg.name}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Множественный выбор</div>
        </div>
      </div>

      <p className="card-text text-gray-300 font-medium mb-2">{mg.prompt}</p>
      <Hint text={mg.hint} />

      {/* Selection grid */}
      <div className="mg-chips">
        {mg.items.map((item) => {
          const active = sel.includes(item);
          const reveal = showAnswer && locked && correctSet.has(item);
          return (
            <button 
              key={item} 
              disabled={locked}
              className={"mg-chip toggle" + (active ? " active" : "") + (reveal ? " reveal" : "")}
              onClick={() => toggle(item)}
            >
              {active ? "✓ " : ""}{item}
            </button>
          );
        })}
      </div>

      {/* Loading Suspense Overlay */}
      {checking && <Loader specId={specId} />}

      {/* Feedback Panel */}
      {!checking && <Feedback result={result} showAnswer={showAnswer} correctText={mg.correct.join(", ")} onContinue={() => onDone(false)} />}

      {/* Action buttons */}
      {!locked && (
        <button 
          className="btn" 
          style={{ marginTop: 16 }} 
          disabled={sel.length === 0} 
          onClick={check}
        >
          <Play className="w-4 h-4" />
          Проверить ✓
        </button>
      )}
    </div>
  );
}

/* ---------- QUIZ: pick the single correct answer (fast genre) ---------- */
function QuizGame({ mg, specId, showAnswer, onDone }: { mg: MG; specId: string; showAnswer: boolean; onDone: (c: boolean) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [result, setResult] = useState<Result>("none");
  const [checking, setChecking] = useState(false);
  const locked = result !== "none" || checking;
  const answer = mg.correct[0];
  const spec = SPEC_DETAILS[specId] || { icon: HelpCircle, color: "text-indigo-400" };
  const SpecIcon = spec.icon;

  const pick = (opt: string) => {
    if (locked) return;
    setSel(opt);
    finish(opt === answer, setResult, setChecking, onDone);
  };

  return (
    <div className={"card fade-in mg" + (result === "fail" ? " shake border-rose-500/40" : result === "ok" ? " border-emerald-500/40 glow-emerald" : " glow-indigo")}>
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
        <div className={`p-2 rounded-xl bg-white/5 ${spec.color}`}><SpecIcon className="w-5 h-5" /></div>
        <div>
          <div className="card-title mb-0 text-sm md:text-base">{mg.name}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Быстрый вопрос</div>
        </div>
      </div>
      <p className="card-text text-gray-300 font-medium mb-2">{mg.prompt}</p>
      <Hint text={mg.hint} />
      <div className="mg-chips">
        {mg.items.map((opt) => {
          const isSel = sel === opt;
          const reveal = showAnswer && locked && opt === answer;
          const wrong = showAnswer && locked && isSel && opt !== answer;
          return (
            <button key={opt} disabled={locked}
              className={"mg-chip toggle" + (isSel ? " active" : "") + (reveal ? " reveal" : "") + (wrong ? " wrong" : "")}
              onClick={() => pick(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
      {checking && <Loader specId={specId} />}
      {!checking && <Feedback result={result} showAnswer={showAnswer} correctText={answer} onContinue={() => onDone(false)} />}
    </div>
  );
}

/* ---------- SLIDER: drag the value into the correct range ---------- */
function SliderGame({ mg, specId, showAnswer, onDone }: { mg: MG; specId: string; showAnswer: boolean; onDone: (c: boolean) => void }) {
  const min = mg.min ?? 0;
  const max = mg.max ?? 100;
  const [lo, hi] = mg.target ?? [min, max];
  const unit = mg.unit ?? "";
  const [val, setVal] = useState(Math.round((min + max) / 2));
  const [result, setResult] = useState<Result>("none");
  const [checking, setChecking] = useState(false);
  const locked = result !== "none" || checking;
  const spec = SPEC_DETAILS[specId] || { icon: SlidersHorizontal, color: "text-indigo-400" };
  const SpecIcon = spec.icon;

  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const check = () => finish(val >= lo && val <= hi, setResult, setChecking, onDone);

  return (
    <div className={"card fade-in mg" + (result === "fail" ? " shake border-rose-500/40" : result === "ok" ? " border-emerald-500/40 glow-emerald" : " glow-indigo")}>
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800">
        <div className={`p-2 rounded-xl bg-white/5 ${spec.color}`}><SpecIcon className="w-5 h-5" /></div>
        <div>
          <div className="card-title mb-0 text-sm md:text-base">{mg.name}</div>
          <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Точная настройка</div>
        </div>
      </div>
      <p className="card-text text-gray-300 font-medium mb-2">{mg.prompt}</p>
      <Hint text={mg.hint} />

      <div className="mg-slider-val">{val}{unit}</div>
      <div className="mg-slider-track">
        <span className="mg-slider-band" style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
        <input className="mg-slider" type="range" min={min} max={max} value={val} disabled={locked}
          onChange={(e) => setVal(Number(e.target.value))} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
      {checking && <Loader specId={specId} />}
      {!checking && <Feedback result={result} showAnswer={showAnswer} correctText={`${lo}–${hi}${unit}`} onContinue={() => onDone(false)} />}

      {!locked && (
        <button className="btn" style={{ marginTop: 16 }} onClick={check}>
          <Play className="w-4 h-4" /> Зафиксировать
        </button>
      )}
    </div>
  );
}

// Suspense Loader component with random funny checking messages
function Loader({ specId }: { specId: string }) {
  const message = useMemo(() => {
    const list = CHECKING_MESSAGES[specId] || ["Анализируем выбор...", "Проверяем правильность решений..."];
    return list[Math.floor(Math.random() * list.length)];
  }, [specId]);

  return (
    <div className="my-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center justify-center text-center gap-3 animate-card-draw">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      <div>
        <p className="text-xs font-extrabold text-white uppercase tracking-wider">Запуск...</p>
        <p className="text-xs text-gray-400 italic mt-1">{message}</p>
      </div>
    </div>
  );
}

// Feedback Panel with Lucide check/x indicators
function Feedback({ result, correctText, showAnswer, onContinue }: { result: Result; correctText: string; showAnswer?: boolean; onContinue?: () => void }) {
  if (result === "none") return null;
  if (result === "ok") {
    return (
      <div className="mg-fb ok bounce flex gap-2.5 items-start">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse-glow" />
        <div>
          <p className="font-extrabold text-white text-sm">Великолепная работа!</p>
          <p className="text-gray-300 text-xs mt-0.5">Качество продукта выросло: репутация +3% ⭐, карма +1 ☯️.</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="mg-fb fail flex gap-2.5 items-start">
        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-extrabold text-white text-sm">Увы, ошибка в схеме!</p>
          <p className="text-gray-300 text-xs mt-0.5">
            Вы завалили тест качества.{showAnswer && <> Правильно: <b className="text-rose-300">{correctText}</b>.</>}
          </p>
        </div>
      </div>
      {onContinue && (
        <button className="btn" style={{ marginTop: 14 }} onClick={onContinue}>
          <Play className="w-4 h-4" /> Продолжить
        </button>
      )}
    </>
  );
}

import { useState } from "react";
import type { PlayerState, AdvisorLine } from "../engine/types";
import advisors from "../data/advisors.json";
import { ShieldCheck, Zap, MessageCircle } from "lucide-react";

/* Real-photo avatar (CSS-animated) for Anna / Max — cards and in-game pop-ins.
   Head-framed circular crop; gentle breathing via CSS. */
export function AdvisorAvatar({ who, size = 48 }: { who: "anna" | "max"; size?: number }) {
  return (
    <span className={"ava ava-" + who} style={{ width: size, height: size }}
      role="img" aria-label={who === "anna" ? "Анна" : "Макс"} />
  );
}

const ADVICE: Record<"anna" | "max", string[]> = {
  anna: [
    "Держи тень закона на нуле, проверки приходят внезапно.",
    "Каждый чек сегодня, это спокойный сон завтра.",
    "Не гонись за быстрыми деньгами в обход правил. Это дороже.",
    "Карма в плюсе открывает бонусы. Репутация работает на тебя.",
  ],
  max: [
    "Сидеть тихо, значит проиграть. Вкладывайся в маркетинг!",
    "Репутация, это твой множитель выручки. Качай её.",
    "Иногда рискнуть выгоднее, чем перестраховаться.",
    "Продукт решает. Прокачивай его в бизнес-плане каждый месяц.",
  ],
};

function AdvisorCard({
  who, name, role, line, loyalty, accent, Badge,
}: {
  who: "anna" | "max"; name: string; role: string; line?: string;
  loyalty: number; accent: "sky" | "orange";
  Badge: typeof ShieldCheck;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const ask = () => {
    const pool = ADVICE[who];
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) while (next === tip) next = pool[Math.floor(Math.random() * pool.length)];
    setTip(next);
  };
  const shown = tip ?? line;
  const a = accent === "sky"
    ? { text: "text-sky-400", grad: "from-sky-500 to-sky-400", chip: "bg-sky-500/10 border-sky-400/30 text-sky-400", line: "border-sky-500/30" }
    : { text: "text-orange-400", grad: "from-orange-500 to-amber-400", chip: "bg-orange-500/10 border-orange-400/30 text-orange-400", line: "border-orange-500/30" };

  return (
    <div className={"advisor " + who}>
      <button type="button" onClick={ask} title="Спросить совет" className={"av-btn " + a.text}>
        <AdvisorAvatar who={who} size={54} />
        <span className={"av-badge " + a.chip}><Badge className="w-3 h-3" /></span>
      </button>
      <div className="flex-1 min-w-0">
        <div className="adv-name">{name}</div>
        <div className={"adv-role " + a.text}>{role}</div>
        {shown && <div className={"line " + a.line + (tip ? " fade-in" : "")}>«{shown}»</div>}
        <button type="button" onClick={ask} className={"ask-btn " + a.text}>
          <MessageCircle className="w-3 h-3" /> Спросить совет
        </button>
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mb-1">
            <span>Доверие</span><span className={a.text}>{loyalty}%</span>
          </div>
          <div className="w-full bg-gray-950/80 rounded-full h-1 border border-white/5 overflow-hidden">
            <div className={"bg-gradient-to-r h-full rounded-full transition-all duration-500 " + a.grad} style={{ width: `${loyalty}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Advisors({ p, lines }: { p: PlayerState; lines: AdvisorLine[] }) {
  return (
    <div className="advisors">
      <AdvisorCard who="anna" name={advisors.anna.name} role={advisors.anna.role}
        line={lines.find((l) => l.who === "anna")?.text} loyalty={p.annaLoyalty}
        accent="sky" Badge={ShieldCheck} />
      <AdvisorCard who="max" name={advisors.max.name} role={advisors.max.role}
        line={lines.find((l) => l.who === "max")?.text} loyalty={p.maxLoyalty}
        accent="orange" Badge={Zap} />
    </div>
  );
}

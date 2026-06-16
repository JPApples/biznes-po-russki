import { useState } from "react";
import originsData from "../data/origins.json";
import specsData from "../data/specializations.json";
import traitsData from "../data/traits.json";
import type { Origin, Specialization, Trait, PlayerState } from "../engine/types";
import { createPlayer } from "../engine/player";
import { 
  ArrowLeft, Coins, Brain, 
  Star, Heart, Play
} from "lucide-react";

const ORIGINS = originsData as Origin[];
const SPECS = specsData as Specialization[];
const TRAITS = traitsData as Trait[];

function getCustomIcon(id: string) {
  switch (id) {
    // Origins
    case "office_worker":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "student":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      );
    case "craftsman":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "parent":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "ex_officer":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "freelancer":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34241 19.4883 5.48883 20.218 5.22639 20.8404C5.07402 21.2016 5.1436 21.6166 5.44026 21.8797C5.83617 22.1432 6.37703 21.9961 6.58661 21.5647C6.98565 20.7431 7.82025 20.2 8.78345 20.2H9.5C10.8807 20.2 12 21.0954 12 22Z" />
        </svg>
      );
    case "migrant":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "heir":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22V10h16v12" />
          <path d="M2 10l10-8 10 8" />
          <path d="M9 22v-4h6v4" />
        </svg>
      );

    // Specs
    case "retail":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "services":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "it":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "catering":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "education":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "production":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20M14 10V4l-4 3V4L4 7v13h10z" />
        </svg>
      );
    case "agriculture":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V14h3v3.5zm-3-5V9.5C10 8.67 10.67 8 11.5 8s1.5.67 1.5 1.5V12.5h-3z" />
        </svg>
      );

    // Traits
    case "iron_logic":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
        </svg>
      );
    case "empathy":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "charisma":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
      );
    case "workaholic":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "intuition":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="8" />
          <path d="M12 18H3c0-3 3-4 6-4" />
          <path d="M12 18h9c0-3-3-4-6-4" />
        </svg>
      );
    case "phoenix":
      return (
        <svg width="20" height="20" className="text-indigo-400 filter drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );

    default:
      return null;
  }
}

// Per-option categorical accent (intentional game affordance: helps scan choices).
const ACCENT: Record<string, string> = {
  // origins
  office_worker: "#818cf8", student: "#38bdf8", craftsman: "#fbbf24", parent: "#fb7185",
  ex_officer: "#34d399", freelancer: "#a78bfa", migrant: "#22d3ee", heir: "#facc15",
  // specs
  retail: "#34d399", services: "#38bdf8", it: "#818cf8", catering: "#fb7185",
  education: "#a78bfa", production: "#fbbf24", agriculture: "#4ade80",
  // traits
  iron_logic: "#818cf8", empathy: "#fb7185", charisma: "#fbbf24",
  workaholic: "#a78bfa", intuition: "#22d3ee", phoenix: "#fb923c",
};
const tint = (id: string) => ACCENT[id] ?? "#818cf8";

function Tile({ id, active, onClick, icon, name, sub }: {
  id: string; active: boolean; onClick: () => void;
  icon: React.ReactNode; name: string; sub: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"cc-tile" + (active ? " active" : "")}
      style={{ ["--accent" as string]: tint(id) }}
    >
      <span className="cc-ico">{icon}</span>
      <span className="cc-name">{name}</span>
      <span className="cc-sub">{sub}</span>
    </button>
  );
}

export default function CharacterCreation({
  onDone, onBack,
}: { onDone: (p: PlayerState) => void; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [spec, setSpec] = useState<Specialization | null>(null);
  const [trait, setTrait] = useState<Trait | null>(null);

  const back = () => (step === 0 ? onBack() : setStep(step - 1));
  const icon = (id: string, fallback: string) =>
    getCustomIcon(id) || <span className="text-lg">{fallback}</span>;

  return (
    <div className="screen fade-in cc-screen">
      <div className="phase-head mb-1">
        <button className="icon-btn" onClick={back} title="Назад">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="cc-steps" title={`Шаг ${step + 1} из 4`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={"cc-step-seg" + (i < step ? " done" : i === step ? " on" : "")} />
          ))}
        </div>
      </div>

      {/* Running build-so-far summary (steps after the first pick) */}
      {step > 0 && step < 3 && (
        <div className="cc-summary fade-in">
          {origin && <span className="cc-sum-chip">{icon(origin.id, origin.emoji)}<span>{origin.name}</span></span>}
          {spec && <span className="cc-sum-chip">{icon(spec.id, spec.emoji)}<span>{spec.name}</span></span>}
          {!trait && <span className="cc-sum-chip pending">{step === 1 ? "→ сфера" : "→ черта"}</span>}
        </div>
      )}

      {step === 0 && (
        <div className="phase-anim flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Происхождение</h2>
            <p className="text-xs text-gray-400 mt-1">Кем вы были до того, как решились на бизнес?</p>
          </div>
          <div className="cc-grid">
            {ORIGINS.map((o) => (
              <Tile key={o.id} id={o.id} active={origin?.id === o.id}
                onClick={() => { setOrigin(o); setStep(1); }}
                icon={icon(o.id, o.emoji)} name={o.name}
                sub={
                  <span className="cc-stats">
                    <span><Coins className="w-3 h-3 text-emerald-400" />{o.money}</span>
                    <span><Brain className="w-3 h-3 text-rose-400" />{o.nerves}</span>
                    <span><Star className="w-3 h-3 text-amber-400" />{o.reputation}</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="phase-anim flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Сфера бизнеса</h2>
            <p className="text-xs text-gray-400 mt-1">Где вы откроете своё первое дело?</p>
          </div>
          <div className="cc-grid">
            {SPECS.map((s) => (
              <Tile key={s.id} id={s.id} active={spec?.id === s.id}
                onClick={() => { setSpec(s); setStep(2); }}
                icon={icon(s.id, s.emoji)} name={s.name}
                sub={
                  <span className="cc-stats">
                    <span className="text-emerald-400">{s.baseRevenue}💰/мес</span>
                    <span className="text-indigo-300">рост ×{s.multiplier}</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="phase-anim flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Черта характера</h2>
            <p className="text-xs text-gray-400 mt-1">Ваша сильная пассивная черта.</p>
          </div>
          <div className="cc-grid">
            {TRAITS.map((t) => (
              <Tile key={t.id} id={t.id} active={trait?.id === t.id}
                onClick={() => { setTrait(t); setStep(3); }}
                icon={icon(t.id, t.emoji)} name={t.name}
                sub={<span className="cc-effect">{t.effect}</span>}
              />
            ))}
          </div>
        </div>
      )}

      {step === 3 && origin && spec && trait && (
        <div className="phase-anim flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Подтверждение</h2>
            <p className="text-xs text-gray-400 mt-1">Проверьте вашу карту предпринимателя перед началом стартапа.</p>
          </div>

          {/* Profile Card */}
          <div className="card glow-indigo">
            <div className="card-title text-sm uppercase tracking-wider text-indigo-400 mb-3 border-b border-gray-800 pb-2">
              Карта бизнеса
            </div>
            <div className="stat-row flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  {getCustomIcon(origin.id) || <span>{origin.emoji}</span>}
                </span> 
                Происхождение
              </span>
              <b>{origin.name}</b>
            </div>
            <div className="stat-row flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  {getCustomIcon(spec.id) || <span>{spec.emoji}</span>}
                </span> 
                Сфера
              </span>
              <b>{spec.name}</b>
            </div>
            <div className="stat-row flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  {getCustomIcon(trait.id) || <span>{trait.emoji}</span>}
                </span> 
                Черта характера
              </span>
              <b className="text-indigo-300">{trait.name}</b>
            </div>
          </div>

          {/* Resources card */}
          <div className="card border-emerald-500/20">
            <div className="card-title text-sm uppercase tracking-wider text-emerald-400 mb-3 border-b border-gray-800 pb-2">
              Стартовые ресурсы
            </div>
            <div className="stat-row">
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" /> Бюджет (Деньги)
              </span>
              <b className="text-emerald-400 font-mono">{origin.money}💰</b>
            </div>
            <div className="stat-row">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-rose-400" /> Нервы (Стресс)
              </span>
              <b className="text-rose-400 font-mono">{origin.nerves}%</b>
            </div>
            <div className="stat-row">
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Репутация
              </span>
              <b className="text-amber-400 font-mono">{origin.reputation}%</b>
            </div>
            <div className="stat-row">
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-sky-400" /> Баланс Жизни (WLB)
              </span>
              <b className="text-sky-400 font-mono">{origin.workLife}%</b>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 w-full">
            <button 
              className="btn" 
              onClick={() => onDone(createPlayer(origin, spec, trait))}
            >
              <Play className="w-4 h-4 fill-white" />
              Начать игру
            </button>
            <button 
              className="btn secondary mt-2" 
              onClick={() => setStep(2)}
            >
              Назад
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

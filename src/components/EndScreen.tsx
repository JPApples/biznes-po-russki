import { useState } from "react";
import type { GameEngine } from "../engine/engine";
import { 
  Trophy, ThumbsUp, AlertTriangle, AlertCircle, 
  Coins, Star, EyeOff, Sparkles, Gift, Home, 
  ArrowRight, HardHat, Brain, Heart
} from "lucide-react";

export default function EndScreen({ engine, onMenu }: { engine: GameEngine; onMenu: () => void }) {
  const [demo, setDemo] = useState(false);
  const p = engine.player;
  const ending = engine.getEnding();

  // Pick Lucide icon based on ending ID
  const EndingIcon = () => {
    switch (ending.id) {
      case "ideal":
        return <Trophy className="w-16 h-16 text-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] animate-bounce" />;
      case "good":
        return <ThumbsUp className="w-16 h-16 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />;
      case "doubtful":
        return <AlertTriangle className="w-16 h-16 text-amber-500 filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse-glow" />;
      case "risky":
      default:
        return <AlertCircle className="w-16 h-16 text-rose-500 filter drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse-warn" />;
    }
  };

  const borderClass = () => {
    switch (ending.id) {
      case "ideal": return "border-yellow-500/20 glow-emerald";
      case "good": return "border-emerald-500/20";
      case "doubtful": return "border-amber-500/20";
      case "risky": return "border-rose-500/25 animate-pulse-warn";
      default: return "border-white/5";
    }
  };

  if (demo) {
    return (
      <div className="screen center fade-in" style={{ gap: 20 }}>
        <div className="mb-2 relative animate-float">
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl"></div>
          <div className="w-20 h-24 rounded-2xl bg-indigo-500/5 border border-indigo-500/30 flex items-center justify-center">
            <HardHat className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">Конец демо-версии</h2>
        <p className="muted max-w-xs text-center leading-relaxed">
          Вы успешно преодолели первый квартал (3 месяца) стартапа в России! Продолжение игры (этапы со 2 по 6, до 36 месяцев, наём штата, кредиты и финальные судьбоносные концовки) — в активной разработке.
        </p>
        <button className="btn mt-4" onClick={onMenu}>
          <Home className="w-4 h-4" /> В главное меню
        </button>
      </div>
    );
  }

  return (
    <div className="screen center fade-in" style={{ gap: 16 }}>
      {/* Dynamic Animated Icon */}
      <div className="my-3 flex items-center justify-center w-24 h-24 rounded-full bg-white/5 border border-white/5">
        <EndingIcon />
      </div>

      <h1 className="text-2xl font-black uppercase text-center">{ending.title}</h1>
      <p className="card-text text-gray-300 text-center text-xs md:text-sm leading-relaxed max-w-[340px] px-2">{ending.desc}</p>
      
      {/* Quarter results sheet */}
      <div className={`card text-left w-full mt-2 ${borderClass()}`}>
        <div className="card-title text-xs uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3">
          Итоги первого квартала
        </div>
        
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-emerald-400" /> Деньги</span>
          <b className="text-emerald-400 font-mono">{p.money}💰</b>
        </div>
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-rose-400" /> Нервы</span>
          <b className="text-rose-400 font-mono">{p.nerves}%</b>
        </div>
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400" /> Репутация</span>
          <b className="text-amber-400 font-mono">{p.reputation}%</b>
        </div>
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-sky-400" /> Баланс жизни</span>
          <b className="text-sky-400 font-mono">{p.workLife}%</b>
        </div>
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-fuchsia-400" /> Тень закона</span>
          <b className="text-fuchsia-400 font-mono">{p.shadow}%</b>
        </div>
        <div className="stat-row">
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-400" /> Карма</span>
          <b className="text-purple-400 font-mono">{p.karma}</b>
        </div>
        
        {ending.bonus && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-2.5 text-xs text-indigo-300">
            <Gift className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-extrabold text-white text-[10px] uppercase tracking-wider">Пассивный бонус разблокирован</p>
              <p className="mt-0.5">{ending.bonus}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 w-full mt-4">
        {ending.id === "lost" ? (
          <button className="btn" onClick={onMenu}>
            Начать заново <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button className="btn" onClick={() => setDemo(true)}>
              Продолжить историю <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn secondary" onClick={onMenu}>
              В главное меню
            </button>
          </>
        )}
      </div>
    </div>
  );
}

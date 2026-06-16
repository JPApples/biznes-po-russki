import type { PlayerState, KarmaLevel, Effects } from "../engine/types";
import config from "../data/config.json";
import { Coins, Brain, Star, Heart, EyeOff, Sparkles, HeartPulse, Zap } from "lucide-react";

const levels = config.karmaLevels as KarmaLevel[];

function karmaLevel(karma: number): KarmaLevel {
  for (const l of levels) if (karma >= l.min) return l;
  return levels[levels.length - 1];
}

function Delta({ v, k }: { v?: number; k: number }) {
  if (!v) return null;
  return <span key={k} className={"delta float-up " + (v > 0 ? "up" : "down")}>{v > 0 ? "+" : ""}{v}</span>;
}

export default function ResourcePanel({
  p, delta, flashKey = 0,
}: { p: PlayerState; delta?: Effects | null; flashKey?: number }) {
  const k = karmaLevel(p.karma);
  const d = (delta ?? {}) as Record<string, number | undefined>;
  const health = p.health ?? 80;
  const energy = p.energy ?? 70;

  // pct = 0..100 level for the mini metric bar (null = no bar); bar = fill color
  const stats = [
    { key: "money", Icon: Coins, cls: "text-emerald-400", label: "Деньги", val: `${p.money}$`, extra: "", pct: null as number | null, bar: "" },
    { key: "nerves", Icon: Brain, cls: "text-rose-400", label: "Нервы", val: `${p.nerves}%`, extra: "", pct: p.nerves, bar: "#f43f5e" },
    { key: "reputation", Icon: Star, cls: "text-amber-400", label: "Репутация", val: `${p.reputation}%`, extra: "", pct: (p.reputation + 100) / 2, bar: "#fbbf24" },
    { key: "workLife", Icon: Heart, cls: "text-sky-400", label: "Баланс жизни", val: `${p.workLife}%`, extra: "", pct: p.workLife, bar: "#38bdf8" },
    { key: "health", Icon: HeartPulse, cls: health < 30 ? "text-rose-500" : "text-rose-300", label: "Здоровье", val: `${health}%`, extra: health < 30 ? " high" : "", pct: health, bar: "#fb7185" },
    { key: "energy", Icon: Zap, cls: energy < 30 ? "text-amber-500" : "text-cyan-300", label: "Энергия", val: `${energy}%`, extra: energy < 30 ? " high" : "", pct: energy, bar: "#22d3ee" },
    { key: "shadow", Icon: EyeOff, cls: p.shadow > 50 ? "text-rose-500" : "text-fuchsia-400", label: "Тень закона", val: `${p.shadow}%`, extra: " shadow" + (p.shadow > 50 ? " high" : ""), pct: p.shadow, bar: "#d946ef" },
    { key: "karma", Icon: Sparkles, cls: "text-purple-400", label: "Карма", val: `${p.karma} ${k.emoji}`, extra: " karma" + (p.karma > 0 ? " pos" : p.karma < 0 ? " neg" : ""), pct: null as number | null, bar: "" },
  ];

  return (
    <div className="resources">
      {stats.map((s) => {
        const Icon = s.Icon;
        return (
          <span key={s.key} className={"res" + s.extra + (s.pct != null ? " has-bar" : "")} title={s.label}>
            <Icon className={"w-4 h-4 shrink-0 " + s.cls} />
            <span className="res-label">{s.label}</span>
            <span key={s.key + (d[s.key] ? flashKey : 0)} className={"v" + (d[s.key] ? " pulse" : "")}>{s.val}</span>
            <Delta v={d[s.key]} k={flashKey} />
            {s.pct != null && (
              <span className="res-bar"><i style={{ width: `${Math.max(0, Math.min(100, s.pct))}%`, background: s.bar }} /></span>
            )}
          </span>
        );
      })}
      <div className="karma-bar" style={{ width: "100%", background: k.color, "--bar-color": k.color } as React.CSSProperties} title={k.label} />
    </div>
  );
}

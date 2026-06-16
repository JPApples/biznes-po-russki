import { useState, useEffect, useRef } from "react";
import { Play, FolderOpen, HelpCircle } from "lucide-react";

interface Props {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
}

export default function MainMenu({ hasSave, onNew, onContinue }: Props) {
  const [about, setAbout] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    interface ParticleType {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      update: () => void;
      draw: () => void;
    }

    const particles: ParticleType[] = [];
    const particleCount = 45;
    const mouse = { x: null as number | null, y: null as number | null, radius: 110 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    class Particle implements ParticleType {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rot: number;
      vrot: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5 - 0.1; // slight upward drift, like floating cash
        this.size = Math.random() * 1.6 + 1.1;
        this.rot = Math.random() * Math.PI * 2;
        this.vrot = (Math.random() - 0.5) * 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rot += this.vrot;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
          }
        }
      }

      draw() {
        if (!ctx) return;
        const w = this.size * 7;
        const h = this.size * 3.2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 1.6);
        ctx.fillStyle = "rgba(52, 211, 153, 0.45)";
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(16, 185, 129, 0.65)";
        ctx.stroke();
        ctx.fillStyle = "rgba(4, 30, 22, 0.85)";
        ctx.font = `${Math.round(h * 0.78)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("₽", 0, 0.5);
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="screen center fade-in relative overflow-hidden select-none" style={{ gap: 20 }}>
      {/* Fullscreen interactive particle canvas background spanning the entire viewport */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen z-0 opacity-45" style={{ pointerEvents: "none" }}
      />

      {/* City-skyline horizon — anchors the composition so the screen isn't an empty void */}
      <div className="menu-skyline" aria-hidden="true">
        <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
          <defs>
            <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#222c52" /><stop offset="1" stopColor="#0a0e1c" />
            </linearGradient>
          </defs>
          <path fill="url(#skyg)" d="M0 200 V150 H45 V110 H90 V160 H135 V90 H180 V130 H225 V60 H270 V120 H315 V100 H360 V70 H405 V125 H450 V95 H495 V145 H540 V105 H585 V140 H600 V200 Z" />
          <g fill="#fbbf24" opacity="0.6">
            <rect x="12" y="162" width="5" height="7" /><rect x="28" y="162" width="5" height="7" /><rect x="12" y="178" width="5" height="7" />
            <rect x="146" y="104" width="5" height="7" /><rect x="162" y="104" width="5" height="7" /><rect x="146" y="126" width="5" height="7" /><rect x="162" y="148" width="5" height="7" />
            <rect x="236" y="74" width="5" height="7" /><rect x="252" y="74" width="5" height="7" /><rect x="236" y="98" width="5" height="7" /><rect x="252" y="120" width="5" height="7" /><rect x="236" y="142" width="5" height="7" />
            <rect x="326" y="114" width="5" height="7" /><rect x="342" y="136" width="5" height="7" />
            <rect x="371" y="84" width="5" height="7" /><rect x="387" y="84" width="5" height="7" /><rect x="371" y="106" width="5" height="7" /><rect x="387" y="128" width="5" height="7" />
            <rect x="461" y="110" width="5" height="7" /><rect x="477" y="132" width="5" height="7" />
            <rect x="551" y="120" width="5" height="7" />
          </g>
          <circle className="sky-blink" cx="247" cy="52" r="2.2" fill="#f87171" />
          <circle className="sky-blink2" cx="382" cy="62" r="2.2" fill="#f87171" />
        </svg>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Premium glowing logo header */}
        <div className="mb-4 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-25"></div>
          <div className="w-20 h-20 md:w-24 md:h-20 rounded-full glass-panel flex items-center justify-center border border-indigo-500/30 relative">
            {/* Custom Crown SVG */}
            <svg 
              width="36" 
              height="36" 
              className="animate-float" 
              style={{ color: "#818cf8", filter: "drop-shadow(0 0 15px rgba(99,102,241,0.6))" }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="rgba(99, 102, 241, 0.15)" strokeWidth="2" />
              <path d="M3 20h18" strokeWidth="2.5" />
              <path d="M5 16c0 2.2 3.1 4 7 4s7-1.8 7-4" strokeDasharray="2 1" />
              <circle cx="12" cy="3" r="1" fill="currentColor" />
              <circle cx="2" cy="3" r="1" fill="currentColor" />
              <circle cx="22" cy="3" r="1" fill="currentColor" />
            </svg>
            <div className="radar-wave" style={{ "--radar-color": "rgba(99,102,241,0.2)", width: "140%", height: "140%" } as React.CSSProperties} />
            <div className="radar-wave" style={{ "--radar-color": "rgba(139,92,246,0.1)", width: "180%", height: "180%", animationDelay: "1.25s" } as React.CSSProperties} />
          </div>
        </div>

        <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-white leading-tight">
          БИЗНЕС <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-500">ПО-РУССКИ</span>
        </h1>
        <p className="text-gray-300 text-xs md:text-sm max-w-sm mx-auto mb-6 leading-relaxed font-medium">
          Текстовый бизнес-симулятор нового поколения. Пройдите путь от скромного стартапа до многомиллионной корпорации, балансируя на грани закона, долгов и собственного здоровья.
        </p>

        {about ? (
          <div className="card text-left w-full mt-4 glow-indigo animate-card-draw">
            <div className="card-title text-xs uppercase tracking-wider text-indigo-400 border-b border-gray-800 pb-2 mb-3">
              О симуляторе
            </div>
            <p className="card-text text-gray-300 leading-relaxed text-xs">
              Вы начинаете своё дело на просторах современной России. Каждый месяц — это новый ход, 
              состоящий из четырёх фаз: неожиданное <b>Входящее событие</b>, тактический <b>Бизнес-план</b>, 
              проверочный <b>Чек-лист проверок</b> и бухгалтерские <b>Итоги месяца</b>. 
            </p>
            <p className="card-text text-gray-300 leading-relaxed text-xs">
              Ваши решения напрямую влияют на бюджет, репутацию бренда, уровень стресса (нервы), 
              «тень закона» и кармический баланс перед вселенной. Советники Анна и Макс делятся советами — 
              но окончательный выбор за вами. Цель демо-версии — успешно развить дело за первые 3 месяца и заложить фундамент будущего холдинга.
            </p>
            <button className="btn secondary mt-4 py-2.5 text-xs font-bold" onClick={() => setAbout(false)}>
              Назад в меню
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full mt-4 max-w-[260px]">
            <button className="group relative w-full px-5 py-3 rounded-xl font-bold text-white shadow-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" onClick={onNew}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-600 transition-all duration-300"></div>
              <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-400 to-fuchsia-400 opacity-50 blur"></div>
              <span className="relative flex items-center justify-center gap-2 text-xs">
                <Play className="w-4 h-4 fill-white shrink-0" />
                Начать новую империю
              </span>
            </button>
            
            <button className="btn secondary py-3 text-xs" onClick={onContinue} disabled={!hasSave}>
              <FolderOpen className="w-4 h-4 shrink-0" />
              Продолжить карьеру
            </button>
            
            <button className="btn ghost py-1.5 text-xs" onClick={() => setAbout(true)}>
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              Об игре
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {["8 происхождений", "7 сфер бизнеса", "выживание и баланс"].map((t) => (
            <span key={t} className="text-[10px] font-bold tracking-wide text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-2.5 py-1">
              {t}
            </span>
          ))}
        </div>

        <p className="muted text-[10px] font-semibold tracking-wider mt-5 uppercase border-t border-gray-800/40 pt-3 w-full">
          Версия 0.1 · Этап 1 · 3 месяца
        </p>
      </div>
    </div>
  );
}

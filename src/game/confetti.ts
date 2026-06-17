// Tiny dependency-free confetti burst (Web Animations API), self-cleaning. Juice on wins.
export function confettiBurst(
  x: number = window.innerWidth / 2,
  y: number = window.innerHeight * 0.32,
  n: number = 30,
): void {
  if (typeof document === "undefined") return;
  const colors = ["#6366f1", "#34d399", "#fbbf24", "#f472b6", "#38bdf8", "#a78bfa"];
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    const c = colors[i % colors.length];
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 170;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 90;
    const sz = 6 + Math.random() * 6;
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz * 1.4}px;background:${c};border-radius:2px;will-change:transform,opacity`;
    p.animate(
      [
        { transform: "translate(-50%,-50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${180 + Math.random() * 360}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 280}px)) rotate(720deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" },
    );
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1900);
}

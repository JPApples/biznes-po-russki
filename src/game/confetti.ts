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

/** Brief centered toast banner (level-ups, milestones). */
export function flashToast(text: string): void {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText =
    "position:fixed;left:50%;top:17%;transform:translateX(-50%);z-index:10000;" +
    "background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:800;" +
    "padding:12px 22px;border-radius:14px;box-shadow:0 12px 34px -8px rgba(99,102,241,.7);" +
    "font-size:15px;letter-spacing:.3px;pointer-events:none;white-space:nowrap";
  el.animate(
    [
      { opacity: 0, transform: "translateX(-50%) translateY(-14px) scale(.9)" },
      { opacity: 1, transform: "translateX(-50%) translateY(0) scale(1)", offset: 0.15 },
      { opacity: 1, offset: 0.8 },
      { opacity: 0, transform: "translateX(-50%) translateY(-10px)" },
    ],
    { duration: 2600, easing: "ease" },
  );
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

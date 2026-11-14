/* Kanvas Ajaib: efek: konfeti, kilau, jejak bintang, ledakan sihir (kanvas overlay).
   Koordinat efek selalu 0–800; setScale(k) menyesuaikan dengan kanvas backing 800·k. */
window.KA = window.KA || {};

KA.fx = (function () {
  const W = 800;
  const MAX = 700;
  const COLORS = ["#FF6B6B", "#FFB86B", "#4ECDC4", "#45B7D1", "#B388FF", "#FFD93D"];
  let cv = null, cx = null, scale = 1;
  let parts = [];
  let last = 0;

  function reduced() {
    try { return !!(window.KA && KA.storage && KA.storage.reduceMotion && KA.storage.reduceMotion()); }
    catch (e) { return false; }
  }

  function init(canvas) {
    cv = canvas;
    cx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    parts = [];
    setScale(canvas && canvas.width ? canvas.width / W : 1);
  }

  function setScale(k) {
    scale = k > 0 ? k : 1;
    if (cx) cx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function push(p) {
    if (parts.length >= MAX) parts.shift();
    p.max = p.life;
    parts.push(p);
  }

  function spawnConfetti(n = 120) {
    if (!cx) return;
    if (reduced()) n = Math.min(24, Math.ceil(n / 5));
    const slow = reduced() ? 0.5 : 1;
    for (let i = 0; i < n; i++) {
      push({
        kind: "confetti",
        x: Math.random() * W,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3 * slow,
        vy: (2 + Math.random() * 4) * slow,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25 * slow,
        size: 6 + Math.random() * 8,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 260,
      });
    }
  }

  function sparkle(x, y, color = "#FFD93D") {
    if (!cx) return;
    const n = reduced() ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.5 + Math.random() * 2.2;
      push({
        kind: "spark", x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6,
        size: 2 + Math.random() * 3.5, color,
        life: 26 + Math.random() * 14,
      });
    }
  }

  function starTrail(x, y) {
    if (!cx) return;
    push({
      kind: "star",
      x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10,
      vx: 0, vy: -0.4,
      size: 5 + Math.random() * 6, color: "#FFD93D",
      life: 40, rot: Math.random() * Math.PI, vr: 0.05,
    });
  }

  /* ledakan sihir: cincin mengembang + bintang & kilau menyebar berwarna-warni */
  function burst(x, y) {
    if (!cx) return;
    const red = reduced();
    push({ kind: "ring", x, y, vx: 0, vy: 0, size: 10, grow: red ? 2.5 : 5, color: "#FFFFFF", life: 34 });
    push({ kind: "ring", x, y, vx: 0, vy: 0, size: 4, grow: red ? 1.8 : 3.4, color: "#FFD93D", life: 40 });
    const n = red ? 8 : 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      const sp = (red ? 1.2 : 2.5) + Math.random() * (red ? 1 : 4);
      const star = i % 3 === 0;
      push({
        kind: star ? "star" : "spark", x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        size: star ? 6 + Math.random() * 6 : 2.5 + Math.random() * 3,
        color: COLORS[i % COLORS.length],
        life: 40 + Math.random() * 25,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        drag: 0.95,
      });
    }
  }

  function starPath(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath();
  }

  function now() {
    return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  }

  function update() {
    if (!cx) return;
    const t = now();
    /* langkah waktu relatif terhadap 60 fps, dibatasi supaya tidak melompat */
    const dt = last ? Math.max(0.25, Math.min(3, (t - last) / 16.67)) : 1;
    last = t;
    cx.setTransform(scale, 0, 0, scale, 0, 0);
    cx.clearRect(0, 0, W, W);
    if (!parts.length) return;
    const alive = [];
    for (const p of parts) {
      p.life -= dt;
      if (p.life <= 0) continue;
      if (p.drag) { p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt); }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "confetti") {
        p.vy += 0.06 * dt;
        p.rot += p.vr * dt;
        if (p.y > W + 20) continue;
      } else if (p.kind === "ring") {
        p.size += p.grow * dt;
      } else {
        p.vy += 0.02 * dt;
        if (p.vr) p.rot += p.vr * dt;
      }
      alive.push(p);
      cx.save();
      cx.globalAlpha = p.kind === "ring" ? Math.max(0, p.life / p.max) * 0.8 : Math.min(1, p.life / 22);
      cx.translate(p.x, p.y);
      if (p.kind === "confetti") {
        cx.rotate(p.rot);
        cx.fillStyle = p.color;
        cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.kind === "spark") {
        cx.fillStyle = p.color;
        cx.beginPath();
        cx.arc(0, 0, p.size, 0, Math.PI * 2);
        cx.fill();
      } else if (p.kind === "ring") {
        cx.strokeStyle = p.color;
        cx.lineWidth = 4;
        cx.beginPath();
        cx.arc(0, 0, p.size, 0, Math.PI * 2);
        cx.stroke();
      } else {
        cx.rotate(p.rot || 0);
        cx.fillStyle = p.color;
        starPath(cx, p.size);
        cx.fill();
      }
      cx.restore();
    }
    parts = alive;
  }

  function clear() {
    parts = [];
    last = 0;
    if (cx) { cx.setTransform(scale, 0, 0, scale, 0, 0); cx.clearRect(0, 0, W, W); }
  }

  return {
    init, setScale, spawnConfetti, sparkle, starTrail, burst, update, clear,
    /* tambahan */
    count: () => parts.length,
  };
})();

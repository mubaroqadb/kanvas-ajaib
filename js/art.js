/* Kanvas Ajaib: seni: palet, stiker, ember cat (flood fill), kertas, render & ekspor karya.
   Semua akses DOM/canvas hanya di dalam fungsi, sehingga berkas ini bisa dimuat di Node. */
window.KA = window.KA || {};

KA.art = (function () {
  /* ---------- palet ---------- */
  /* light = tinta terang (untuk kertas gelap t4/malam), dark = tinta pekat (kertas terang) */
  const PEN_COLORS = {
    light: ["#ECF0F5", "#FF8A8A", "#FFC98B", "#7BE3B5", "#8FD3F0", "#D2B0FF"],
    dark: ["#333344", "#E63946", "#F4A261", "#2A9D8F", "#457B9D", "#8E44AD"],
  };
  const FILL_COLORS = [
    "#FFB3B3", "#FFD3A8", "#FFF1A6", "#C8F0B0", "#A8E6CF",
    "#A8DAF0", "#B9C6FF", "#D9B8FF", "#FFC2E2", "#E8D5C0",
  ];
  const FREE_COLORS = [
    "#333344", "#FFFFFF", "#E63946", "#FF8C42", "#FFD23F", "#7BC950",
    "#2A9D8F", "#45B7D1", "#3D5A98", "#8E44AD", "#FF7EB6", "#8B5E3C",
  ];

  function isDarkPaper(theme, paper) {
    if (paper) return paper === "paper_night";
    return theme === "t4" || theme === "t5";
  }
  function inkSet(theme, paper) { return isDarkPaper(theme, paper) ? PEN_COLORS.light : PEN_COLORS.dark; }

  /* ---------- stiker (path SVG viewBox 24, diisi) ---------- */
  const f1 = (n) => +n.toFixed(2);
  function circ(cx, cy, r) {
    return `M${f1(cx - r)} ${f1(cy)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0z`;
  }
  function flowerPath() {
    let d = "";
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      d += circ(12 + Math.cos(a) * 5.3, 12 + Math.sin(a) * 5.3, 4.4);
    }
    return d + circ(12, 12, 3.6);
  }
  function sunPath() {
    let d = circ(12, 12, 5.4);
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const p = (r, da) => `${f1(12 + Math.cos(a + da) * r)} ${f1(12 + Math.sin(a + da) * r)}`;
      d += `M${p(7.2, -0.32)}L${p(11.3, 0)}L${p(7.2, 0.32)}z`;
    }
    return d;
  }
  const STAMPS = {
    star: { name: "Bintang", d: "M12 2.2l2.95 6.1 6.7.95-4.85 4.7 1.15 6.65L12 17.45l-5.95 3.15 1.15-6.65L2.35 9.25l6.7-.95z" },
    heart: { name: "Hati", d: "M12 21s-8.5-5.1-8.5-11.2C3.5 6.6 5.8 4.5 8.5 4.5c1.6 0 2.8.8 3.5 1.9.7-1.1 1.9-1.9 3.5-1.9 2.7 0 5 2.1 5 5.3C20.5 15.9 12 21 12 21z",
      hi: "M7.2 7.3c-1.3.4-2 1.5-2 2.9h1.4c0-.8.4-1.4 1-1.6z" },
    sparkle: { name: "Kilau", d: "M11 1.8c.9 5.3 3.2 7.6 8.5 8.5-5.3.9-7.6 3.2-8.5 8.5-.9-5.3-3.2-7.6-8.5-8.5 5.3-.9 7.6-3.2 8.5-8.5zM19 15.2c.4 2 1.1 2.7 3 3-1.9.4-2.6 1.1-3 3-.4-1.9-1.1-2.6-3-3 1.9-.3 2.6-1 3-3z" },
    flower: { name: "Bunga", d: flowerPath(), hi: circ(12, 12, 2.6) },
    leaf: { name: "Daun", d: "M20.5 3C11 3 4 8 4 15c0 1.9.5 3.5 1.3 4.8L3.5 21.6l1.4 1.2 1.8-1.9c1.3.8 2.9 1.2 4.6 1.2 6.4 0 9.2-6.3 9.2-19.1z",
      hi: "M6.3 20.2c3-4.6 6.4-8.5 11-12l.6.7c-4.4 3.6-7.6 7.4-10.5 11.9z" },
    sun: { name: "Matahari", d: sunPath(), hi: "M9.4 10.3a3.2 3.2 0 0 1 2.6-1.6v1.3a1.9 1.9 0 0 0-1.5.9z" },
    moon: { name: "Bulan", d: "M21 14.2A9 9 0 0 1 9.8 3a9 9 0 1 0 11.2 11.2z" },
    cloud: { name: "Awan", d: "M6.5 19.5h11a4.5 4.5 0 0 0 .9-8.9 6 6 0 0 0-11.6-1.1 5 5 0 0 0-.3 10z",
      hi: "M8.3 11.2a3.6 3.6 0 0 1 3-2.3v1.3a2.4 2.4 0 0 0-1.9 1.5z" },
    rocket: { name: "Roket", d: "M12 1.8c3.6 2.6 5.4 6.6 5.4 11.2v3.5H6.6V13c0-4.6 1.8-8.6 5.4-11.2zM6.6 11.5L3 15.5v4l3.6-2zM17.4 11.5l3.6 4v4l-3.6-2zM9.5 17.8h5l-1 3.6-1.5 1.8-1.5-1.8z",
      hi: circ(12, 9.2, 2) },
  };

  /* ---------- ember cat: flood fill scanline, 4-arah, murni ---------- */
  function floodFill(walls, w, h, sx, sy) {
    const out = new Uint8Array(w * h);
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (!(sx >= 0 && sy >= 0 && sx < w && sy < h)) return out;
    if (walls[sy * w + sx]) return out;
    const stack = [sx, sy];
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      const row = y * w;
      if (out[row + x] || walls[row + x]) continue;
      let l = x, r = x;
      while (l > 0 && !walls[row + l - 1] && !out[row + l - 1]) l--;
      while (r < w - 1 && !walls[row + r + 1] && !out[row + r + 1]) r++;
      for (let i = l; i <= r; i++) out[row + i] = 1;
      for (let ny = y - 1; ny <= y + 1; ny += 2) {
        if (ny < 0 || ny >= h) continue;
        const nr = ny * w;
        let inSpan = false;
        for (let i = l; i <= r; i++) {
          const free = !walls[nr + i] && !out[nr + i];
          if (free && !inSpan) { stack.push(i, ny); inSpan = true; }
          else if (!free) inSpan = false;
        }
      }
    }
    return out;
  }

  /* ---------- utilitas canvas (hanya dipanggil di peramban) ---------- */
  function mkCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h == null ? w : h;
    return c;
  }

  /* acak deterministik: kertas yang sama selalu tampak sama */
  function seeded(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  const PAPER_STYLE = { paper_blueprint: "t1", paper_grass: "t2", paper_night: "t4" };

  function paintBackground(ctx, size, theme, paper) {
    const style = (paper && PAPER_STYLE[paper]) || theme || "plain";
    const k = size / 800;
    const lw = (n) => Math.max(0.5, n * k);
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (style === "t1") {
      ctx.fillStyle = "#EAF4FB";
      ctx.fillRect(0, 0, size, size);
      const n = 20;
      for (let i = 1; i < n; i++) {
        const p = Math.round((i * size) / n) + 0.5;
        const major = i % 5 === 0;
        ctx.strokeStyle = major ? "rgba(69,140,209,0.30)" : "rgba(69,140,209,0.14)";
        ctx.lineWidth = lw(major ? 2 : 1);
        ctx.beginPath();
        ctx.moveTo(p, 0); ctx.lineTo(p, size);
        ctx.moveTo(0, p); ctx.lineTo(size, p);
        ctx.stroke();
      }
    } else if (style === "t2") {
      ctx.fillStyle = "#EEF8E4";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "rgba(108,170,84,0.22)";
      const step = size / 25;
      for (let j = 0; j < 26; j++) {
        for (let i = 0; i < 26; i++) {
          const x = i * step + (j % 2 ? step / 2 : 0), y = j * step;
          ctx.beginPath();
          ctx.arc(x, y, lw(2.6), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      /* rumput kecil di beberapa tempat */
      const r = seeded(22);
      ctx.strokeStyle = "rgba(108,170,84,0.28)";
      ctx.lineWidth = lw(2);
      ctx.lineCap = "round";
      for (let t = 0; t < 14; t++) {
        const x = r() * size, y = r() * size;
        ctx.beginPath();
        ctx.moveTo(x - 6 * k, y); ctx.lineTo(x - 8 * k, y - 10 * k);
        ctx.moveTo(x, y); ctx.lineTo(x, y - 13 * k);
        ctx.moveTo(x + 6 * k, y); ctx.lineTo(x + 8 * k, y - 10 * k);
        ctx.stroke();
      }
    } else if (style === "t3") {
      ctx.fillStyle = "#F4E6CC";
      ctx.fillRect(0, 0, size, size);
      const r = seeded(33);
      ctx.lineCap = "round";
      for (let t = 0; t < 260; t++) {
        const x = r() * size, y = r() * size, a = r() * Math.PI, l = (6 + r() * 16) * k;
        ctx.strokeStyle = r() < 0.5 ? "rgba(160,110,60,0.12)" : "rgba(255,255,255,0.35)";
        ctx.lineWidth = lw(1.4);
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      }
      /* tepi sedikit lebih gelap, hangat */
      if (ctx.createRadialGradient) {
        const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.75);
        g.addColorStop(0, "rgba(180,120,60,0)");
        g.addColorStop(1, "rgba(180,120,60,0.14)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }
    } else if (style === "t5") {
      /* laut dalam: gradasi biru, gelembung, riak cahaya */
      if (ctx.createLinearGradient) {
        const g = ctx.createLinearGradient(0, 0, 0, size);
        g.addColorStop(0, "#1C5A7A");
        g.addColorStop(1, "#0F3350");
        ctx.fillStyle = g;
      } else ctx.fillStyle = "#164766";
      ctx.fillRect(0, 0, size, size);
      const r = seeded(55);
      ctx.strokeStyle = "rgba(170,225,255,0.10)";
      ctx.lineWidth = lw(3);
      for (let t = 0; t < 6; t++) {
        const y = (0.08 + r() * 0.3) * size;
        ctx.beginPath();
        for (let x = 0; x <= size; x += size / 40) {
          const yy = y + Math.sin((x / size) * Math.PI * 4 + t) * 6 * k;
          x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
      }
      for (let t = 0; t < 40; t++) {
        const x = r() * size, y = r() * size, rad = lw(2 + r() * 7);
        ctx.strokeStyle = `rgba(200,240,255,${(0.15 + r() * 0.3).toFixed(2)})`;
        ctx.lineWidth = lw(1.5);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (style === "t4") {
      ctx.fillStyle = "#2E3450";
      ctx.fillRect(0, 0, size, size);
      const r = seeded(44);
      for (let t = 0; t < 90; t++) {
        const x = r() * size, y = r() * size, rad = lw(0.8 + r() * 1.8);
        ctx.fillStyle = `rgba(255,248,220,${(0.25 + r() * 0.55).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      /* beberapa kilau empat sudut */
      ctx.fillStyle = "rgba(255,240,190,0.55)";
      for (let t = 0; t < 7; t++) {
        const x = r() * size, y = r() * size, s = (5 + r() * 5) * k;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.quadraticCurveTo(x, y, x + s, y);
        ctx.quadraticCurveTo(x, y, x, y + s);
        ctx.quadraticCurveTo(x, y, x - s, y);
        ctx.quadraticCurveTo(x, y, x, y - s);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#FFFDF7";
      ctx.fillRect(0, 0, size, size);
    }
    ctx.restore();
  }

  /* ---------- goresan ---------- */
  function strokeWidth(st, size) {
    const base = st.size == null ? 2.2 : st.size;
    return Math.max(0.75, ((st.pen === "brush" ? base * 1.6 : base) * size) / 100);
  }

  /* jalur halus: kurva kuadrat lewat titik tengah antar titik */
  function tracePath(ctx, pts, s) {
    ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
    if (pts.length === 2) { ctx.lineTo(pts[1][0] * s, pts[1][1] * s); return; }
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0] * s, pts[i][1] * s, mx * s, my * s);
    }
    const L = pts[pts.length - 1];
    ctx.lineTo(L[0] * s, L[1] * s);
  }

  function dot(ctx, p, s, w, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p[0] * s, p[1] * s, w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRainbow(ctx, pts, s, w, hue0) {
    if (pts.length < 2) { dot(ctx, pts[0], s, w, `hsl(${hue0},85%,58%)`); return; }
    let len = 0;
    const n = pts.length;
    const mid = (i) => [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    let from = pts[0];
    for (let i = 1; i < n; i++) {
      const to = i < n - 1 ? mid(i) : pts[n - 1];
      len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      ctx.strokeStyle = `hsl(${Math.round(hue0 + len * 7) % 360},85%,58%)`;
      ctx.beginPath();
      ctx.moveTo(from[0] * s, from[1] * s);
      if (i < n - 1) ctx.quadraticCurveTo(pts[i][0] * s, pts[i][1] * s, to[0] * s, to[1] * s);
      else ctx.lineTo(to[0] * s, to[1] * s);
      ctx.stroke();
      from = to;
    }
  }

  function drawStroke(ctx, st, size, idx) {
    const pts = st.pts;
    if (!pts || !pts.length) return;
    const s = size / 100;
    const w = strokeWidth(st, size);
    const color = st.color || "#333344";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = w;
    ctx.shadowBlur = 0;
    if (st.pen === "rainbow") { drawRainbow(ctx, pts, s, w, (idx * 47) % 360); return; }
    if (st.pen === "neon") {
      ctx.shadowColor = color;
      ctx.shadowBlur = Math.max(4, w * 2.2);
    }
    if (pts.length === 1) dot(ctx, pts[0], s, w, color);
    else {
      ctx.strokeStyle = color;
      ctx.beginPath(); tracePath(ctx, pts, s); ctx.stroke();
    }
    if (st.pen === "neon") {
      /* inti terang supaya tampak menyala */
      ctx.shadowBlur = 0;
      const core = "rgba(255,255,255,0.7)";
      if (pts.length === 1) dot(ctx, pts[0], s, w * 0.4, core);
      else {
        ctx.strokeStyle = core;
        ctx.lineWidth = w * 0.4;
        ctx.beginPath(); tracePath(ctx, pts, s); ctx.stroke();
      }
    }
  }

  function drawStrokes(ctx, strokes, size) {
    if (!strokes || !strokes.length) return;
    ctx.save();
    for (let i = 0; i < strokes.length; i++) drawStroke(ctx, strokes[i], size, i);
    ctx.restore();
  }

  /* ---------- isian: dinding = goresan, flood fill per benih ---------- */
  function parseColor(c) {
    if (typeof c === "string") {
      let m = /^#([0-9a-f]{3})$/i.exec(c);
      if (m) return m[1].split("").map((h) => parseInt(h + h, 16));
      m = /^#([0-9a-f]{6})/i.exec(c);
      if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
      m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
      if (m) return [+m[1], +m[2], +m[3]];
    }
    return [255, 214, 165];
  }

  let wallCache = { key: "", walls: null };
  function wallKey(strokes, res) {
    let k = res + ":" + strokes.length;
    for (const st of strokes) k += "|" + (st.pts ? st.pts.length : 0) + "," + (st.size || 0) + "," + (st.pen || "");
    return k;
  }

  function wallMask(strokes, res) {
    const key = wallKey(strokes, res);
    if (wallCache.key === key && wallCache.strokes === strokes) return wallCache.walls;
    const c = mkCanvas(res);
    const x = c.getContext("2d");
    const s = res / 100;
    x.lineCap = "round"; x.lineJoin = "round";
    x.strokeStyle = "#000"; x.fillStyle = "#000";
    for (const st of strokes) {
      const pts = st.pts;
      if (!pts || !pts.length) continue;
      /* sedikit lebih tebal dari goresan tampak, menutup celah kecil */
      const w = strokeWidth(st, res) + 1.5;
      x.lineWidth = w;
      if (pts.length === 1) { x.beginPath(); x.arc(pts[0][0] * s, pts[0][1] * s, w / 2, 0, Math.PI * 2); x.fill(); }
      else { x.beginPath(); tracePath(x, pts, s); x.stroke(); }
    }
    const data = x.getImageData(0, 0, res, res).data;
    const walls = new Uint8Array(res * res);
    for (let i = 0; i < walls.length; i++) walls[i] = data[i * 4 + 3] >= 64 ? 1 : 0;
    wallCache = { key, walls, strokes };
    return walls;
  }

  function buildFillCanvas(strokes, fills, res = 400) {
    const out = mkCanvas(res);
    if (!fills || !fills.length) return out;
    const walls = wallMask(strokes || [], res);
    const n = res * res;
    const col = new Int16Array(n); /* indeks isian + 1; 0 = kosong */
    fills.forEach((f, fi) => {
      const region = floodFill(walls, res, res, (f.x / 100) * res, (f.y / 100) * res);
      for (let i = 0; i < n; i++) if (region[i]) col[i] = fi + 1;
    });
    /* lebarkan isian 2 px ke bawah goresan supaya tidak ada celah putih */
    for (let pass = 0; pass < 2; pass++) {
      const prev = col.slice();
      for (let i = 0; i < n; i++) {
        if (prev[i] || !walls[i]) continue;
        const x = i % res;
        const v = (x > 0 && prev[i - 1]) || (x < res - 1 && prev[i + 1]) ||
          (i >= res && prev[i - res]) || (i < n - res && prev[i + res]) || 0;
        if (v) col[i] = v;
      }
    }
    const rgb = fills.map((f) => parseColor(f.c));
    const ctx = out.getContext("2d");
    const img = ctx.createImageData(res, res);
    const d = img.data;
    for (let i = 0; i < n; i++) {
      const v = col[i];
      if (!v) continue;
      const c = rgb[v - 1], j = i * 4;
      d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }

  /* ---------- stiker ---------- */
  const pathCache = {};
  function path2d(d) {
    if (typeof Path2D === "undefined") return null;
    return pathCache[d] || (pathCache[d] = new Path2D(d));
  }

  function drawStamps(ctx, stamps, size) {
    if (!stamps || !stamps.length) return;
    const s = size / 100;
    ctx.save();
    for (const st of stamps) {
      const def = STAMPS[st.id];
      const p = def && path2d(def.d);
      if (!p) continue;
      const k = (((st.s == null ? 12 : st.s) / 100) * size) / 24;
      ctx.save();
      ctx.translate(st.x * s, st.y * s);
      ctx.scale(k, k);
      ctx.translate(-12, -12);
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(40,40,60,0.25)";
      ctx.shadowBlur = 3 * k;
      ctx.shadowOffsetY = 0.6 * k;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.4;
      ctx.stroke(p);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = st.c || "#FFD23F";
      ctx.fill(p);
      if (def.hi) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill(path2d(def.hi));
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- karya utuh ---------- */
  function renderArtwork(entry, size = 400) {
    const c = mkCanvas(size);
    const ctx = c.getContext("2d");
    const e = entry || {};
    paintBackground(ctx, size, e.theme, e.paper);
    const strokes = (e.strokes || []).map((st) => (st.pen || !e.pen ? st : Object.assign({}, st, { pen: e.pen })));
    if (e.fills && e.fills.length) {
      const fc = buildFillCanvas(strokes, e.fills, 400);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fc, 0, 0, size, size);
      ctx.restore();
    }
    drawStrokes(ctx, strokes, size);
    drawStamps(ctx, e.stamps, size);
    return c;
  }

  function slug(t) {
    let s = String(t || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
    return s || "karya";
  }

  function exportPNG(entry) {
    const name = "kanvas-ajaib-" + slug(entry && entry.title) + ".png";
    const c = renderArtwork(entry, 800);
    const go = (url, revoke) => {
      const a = document.createElement("a");
      a.href = url; a.download = name; a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
    if (c.toBlob && typeof URL !== "undefined" && URL.createObjectURL) {
      c.toBlob((b) => (b ? go(URL.createObjectURL(b), true) : go(c.toDataURL("image/png"))), "image/png");
    } else go(c.toDataURL("image/png"));
    return name;
  }

  return {
    PEN_COLORS, FILL_COLORS, FREE_COLORS, STAMPS,
    floodFill, paintBackground, drawStrokes, buildFillCanvas, drawStamps, renderArtwork, exportPNG,
    /* tambahan */
    inkSet, isDarkPaper, slug,
  };
})();

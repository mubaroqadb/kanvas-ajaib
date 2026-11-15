/* Kanvas Ajaib: mesin kanvas berlapis (tpl · paint · draw · fx), pointer, semua mode, hantu duel.
   Tidak memanggil UI: semua kabar lewat onEvent(type, data). DOM hanya disentuh di dalam fungsi. */
window.KA = window.KA || {};

KA.engine = (function () {
  const L = 800;            // koordinat logika kanvas
  const U = L / 100;        // 1 satuan gambar (0–100) = 8 px logika
  const TAU = Math.PI * 2;
  const SIZES = [1.2, 2.2, 3.5];
  const DEFAULT_SIZE = 2.2;
  const COUNT_MS = 3000;    // hitung mundur duel & hafalan kilat
  const HINT_MS = 4000;
  const LAMP_MS = 1500;
  const ALIVE_MS = 2400;
  const GHOST_MS = 12000;   // durasi hantu sintetis
  const GHOST_COLOR = "#9B7BE0";
  const STAMP_SIZE = 12;
  const MIN_STEP = 0.6;     // jarak minimum antartitik (satuan); menyaring getaran mikro pena (Apple Pencil ±240 titik/dtk)
  const DRAWABLE = { draw: 1, memory: 1, duel: 1, free: 1, color: 1, puzzle: 1 };

  /* ---------- kanvas ---------- */
  let tplC = null, paintC = null, drawC = null, fxC = null, wrap = null;
  let tplX = null, paintX = null, drawX = null;
  let backing = 0, scaleK = 1;
  let bgCanvas = null, fillCanvas = null;
  let bound = false;

  /* ---------- status percobaan ---------- */
  let level = null, mode = null, theme = "t1", paper = null, phase = "idle";
  let assisted = false, tolMul = 1, onEvent = null;
  let strokes = [], fixedCount = 0, fills = [], stamps = [], actions = [];
  let live = null, step = 0;
  let streak = 0, streakMaxed = false;
  let t0 = 0, frozenElapsed = -1, firstDone = false;
  let cntEnd = 0, lastCount = 0;
  let hintUsed = false, hintUntil = 0, lampUsed = false, lampUntil = 0;
  let active = false, rafId = 0, aliveUntil = 0, fxUntil = 0, tplDirty = true, reduceMo = false;
  let tool = { kind: "pen", color: "#333333", size: DEFAULT_SIZE, stamp: null };

  /* pointer */
  let pid = null, cur = null, curMir = null;
  let lastSpark = 0, lastPerfect = 0, lastTrail = 0;

  /* hantu */
  let ghost = null;           // {strokes:[{pts, t}], score, dur}
  let ghostLive = null, ghostCursor = [], ghostDone = false, lastProgress = 0;

  /* nalar */
  let puzzle = null, pIdx = 0, pStep = null, hintBase = 0, hintLv = 0, wallStrokes = [];

  /* ================= utilitas ================= */
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const r2 = (v) => Math.round(v * 100) / 100;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  function emit(type, data) {
    if (onEvent) {
      try { onEvent(type, data); } catch (e) { if (typeof console !== "undefined") console.error(e); }
    }
  }
  function sfx(name, arg) {
    const a = KA.audio && KA.audio.sfx;
    if (a && typeof a[name] === "function") { try { a[name](arg); } catch (e) { /* audio opsional */ } }
  }
  function settings() { return (KA.storage && KA.storage.settings) || {}; }
  function vibrate() {
    if (settings().vibrate === false) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* abaikan */ } }
  }
  function reduceMotion() {
    try { return !!(KA.storage && KA.storage.reduceMotion && KA.storage.reduceMotion()); } catch (e) { return false; }
  }
  function owns(id) { try { return !!(KA.storage && KA.storage.owns(id)); } catch (e) { return false; } }
  function penId() {
    const eq = KA.storage && KA.storage.data && KA.storage.data.equipped;
    return (eq && eq.pen) || "default";
  }
  function isDarkPaper() { return theme === "t4" || theme === "t5" || paper === "paper_night"; }

  /* luminansi relatif warna hex (#rgb/#rrggbb); NaN bila bukan hex */
  function lum(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || "").trim());
    if (!m) return NaN;
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const v = [0, 2, 4].map((i) => {
      const c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  const meanLum = (arr) => arr.reduce((s, c) => s + lum(c), 0) / arr.length;

  /* palet pena yang kontras dengan kertas: kertas gelap → palet yang lebih terang */
  function penPalette() {
    const P = (KA.art && KA.art.PEN_COLORS) || {};
    const a = P.light || [], b = P.dark || [];
    if (!a.length && !b.length) return isDarkPaper() ? ["#ECF0F5"] : ["#333333"];
    if (!a.length || !b.length) return a.length ? a : b;
    const la = meanLum(a), lb = meanLum(b);
    if (isNaN(la) || isNaN(lb)) return isDarkPaper() ? b : a;
    const brighter = la >= lb ? a : b, darker = la >= lb ? b : a;
    return isDarkPaper() ? brighter : darker;
  }

  function colors(kind) {
    const A = KA.art || {};
    if (kind === "fill" || (!kind && (mode === "color" || (mode === "nalar" && pStep && pStep.input === "fill")))) return (A.FILL_COLORS || ["#FFD6E0"]).slice();
    if (mode === "free") return (A.FREE_COLORS || penPalette()).slice();
    return penPalette().slice();
  }

  /* ================= logika murni (diuji di Node) ================= */
  function mirrorPts(pts) { return pts.map((p) => [100 - p[0], p[1]]); }

  /* maju ke bagian berikut selama bagian kini ≥ 0,7 tergambar; kembalikan indeks baru */
  function nextStep(partFn, idx, total, thr = 0.7) {
    while (idx < total && partFn(idx) >= thr) idx++;
    return idx;
  }

  /* waktu (ms) tiap titik hantu: pakai ts rekaman bila lengkap, selain itu sebar rata menurut panjang */
  function ghostTimes(gStrokes, slow = 1, totalMs = GHOST_MS) {
    const hasTs = gStrokes.length && gStrokes.every((s) => Array.isArray(s.ts) && s.ts.length === s.pts.length);
    if (hasTs) {
      const base = Math.min(...gStrokes.map((s) => s.ts[0] || 0), 0);
      return gStrokes.map((s) => s.ts.map((t) => Math.max(0, (t - base)) * slow));
    }
    let total = 0;
    const accs = gStrokes.map((s) => {
      const acc = [total]; // panjang kumulatif lintas goresan
      for (let i = 1; i < s.pts.length; i++) {
        total += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
        acc.push(total);
      }
      return acc;
    });
    total = total || 1;
    return accs.map((acc) => acc.map((d) => (d / total) * totalMs * slow));
  }

  /* titik-titik antara a→b tiap ≤1 satuan (tanpa a), untuk cakupan langsung */
  function subdivide(a, b) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d));
    const out = [];
    for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    return out;
  }
  function liveFeed(lv, a, b) {
    if (!lv) return;
    if (!a) { lv.add(b[0], b[1], true); return; }
    for (const p of subdivide(a, b)) lv.add(p[0], p[1], true);
  }

  /* ================= kanvas & ukuran ================= */
  function init(c) {
    tplC = c.tpl; paintC = c.paint || null; drawC = c.draw; fxC = c.fx; wrap = c.wrap || null;
    tplX = tplC.getContext("2d");
    paintX = paintC ? paintC.getContext("2d") : null;
    drawX = drawC.getContext("2d");
    if (KA.fx && KA.fx.init && fxC) KA.fx.init(fxC);
    backing = 0;
    resize();
    if (!bound) {
      bound = true;
      bindPointer();
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => resize()).observe(wrap || drawC);
      }
      if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("resize", () => resize());
    }
  }

  function resize() {
    if (!drawC) return;
    const el = wrap || drawC;
    let css = el.clientWidth || 0;
    if (el.clientHeight) css = Math.min(css, el.clientHeight);
    if (!css) return; // tersembunyi; ResizeObserver akan memanggil lagi
    const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    const B = Math.max(1, Math.round(css * dpr));
    if (B === backing) return;
    backing = B; scaleK = B / L;
    for (const [cv, cx] of [[tplC, tplX], [paintC, paintX], [drawC, drawX]]) {
      if (!cv) continue;
      cv.width = B; cv.height = B;
      cx.setTransform(scaleK, 0, 0, scaleK, 0, 0);
    }
    if (fxC) { fxC.width = B; fxC.height = B; }
    if (KA.fx && KA.fx.setScale) KA.fx.setScale(scaleK);
    buildBg();
    renderPaint(false);
    redrawDraw();
    tplDirty = true;
    renderTpl(now());
  }

  function buildBg() {
    if (typeof document === "undefined" || !backing) { bgCanvas = null; return; }
    const B = backing;
    const c = bgCanvas && bgCanvas.width === B ? bgCanvas : document.createElement("canvas");
    c.width = B; c.height = B;
    const x = c.getContext("2d");
    x.clearRect(0, 0, B, B);
    const known = /^t[1-5]$/.test(theme || "");
    if (mode === "nalar") { // kertas polos; kisi teka-teki digambar sendiri di renderPuzzle
      x.fillStyle = theme === "t5" ? "#164766" : isDarkPaper() ? "#2B3150" : "#FFFDF6";
      x.fillRect(0, 0, B, B);
    } else if (KA.art && KA.art.paintBackground && (known || paper)) {
      KA.art.paintBackground(x, B, known ? theme : "t1", paper || null);
    } else {
      x.fillStyle = "#FFFFFF";
      x.fillRect(0, 0, B, B);
    }
    bgCanvas = c;
  }

  /* ================= render goresan ================= */
  function penStyle(ctx, st, hueLen) {
    const pen = st.pen || "default";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = st.size * U * (pen === "brush" ? 1.6 : 1);
    let col = st.color;
    if (pen === "rainbow") col = "hsl(" + (Math.round((hueLen || 0) * 6) % 360) + ",85%,58%)";
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    if (pen === "neon") { ctx.shadowColor = col; ctx.shadowBlur = 12; } else ctx.shadowBlur = 0;
  }

  /* gambar potongan baru setelah titik ke-i ditambahkan (kurva kuadrat titik-tengah) */
  function drawIncr(ctx, st, i) {
    const p = st.pts;
    ctx.save();
    penStyle(ctx, st, st._len);
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(p[0][0] * U, p[0][1] * U, ctx.lineWidth / 2, 0, TAU);
      ctx.fill();
    } else if (i >= 2) {
      const a = p[i - 1], b = p[i];
      const s = i === 2 ? p[0] : mid(p[i - 2], a), e = mid(a, b);
      ctx.beginPath();
      ctx.moveTo(s[0] * U, s[1] * U);
      ctx.quadraticCurveTo(a[0] * U, a[1] * U, e[0] * U, e[1] * U);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* cadangan bila KA.art belum ada: algoritme kurva yang sama */
  function drawStrokeFull(ctx, st) {
    const p = st.pts;
    if (!p || !p.length) return;
    ctx.save();
    penStyle(ctx, st, 0);
    ctx.beginPath();
    ctx.moveTo(p[0][0] * U, p[0][1] * U);
    if (p.length === 1) ctx.lineTo(p[0][0] * U + 0.01, p[0][1] * U);
    for (let j = 1; j < p.length - 1; j++) {
      const e = mid(p[j], p[j + 1]);
      ctx.quadraticCurveTo(p[j][0] * U, p[j][1] * U, e[0] * U, e[1] * U);
    }
    if (p.length > 1) ctx.lineTo(p[p.length - 1][0] * U, p[p.length - 1][1] * U);
    ctx.stroke();
    ctx.restore();
  }

  function paintStrokes(ctx, list) {
    if (!list.length) return;
    if (KA.art && KA.art.drawStrokes) KA.art.drawStrokes(ctx, list, L);
    else list.forEach((s) => drawStrokeFull(ctx, s));
  }

  function redrawDraw() {
    if (!drawX) return;
    drawX.clearRect(0, 0, L, L);
    if (mode === "nalar") drawPuzzleTop(drawX);
    paintStrokes(drawX, strokes);
    if (stamps.length && KA.art && KA.art.drawStamps) KA.art.drawStamps(drawX, stamps, L);
    const inprog = [cur, curMir].filter((s) => s && s.pts.length);
    paintStrokes(drawX, inprog);
  }

  /* isian ember cat: hasil KA.art.buildFillCanvas di lapisan paint */
  function renderPaint(rebuild) {
    if (!paintX) return;
    if (rebuild) {
      fillCanvas = fills.length && KA.art && KA.art.buildFillCanvas
        ? KA.art.buildFillCanvas(mode === "nalar" ? wallStrokes : strokes, fills, 400) : null;
    }
    paintX.clearRect(0, 0, L, L);
    if (fillCanvas) paintX.drawImage(fillCanvas, 0, 0, L, L);
  }

  /* ================= render template ================= */
  function tplRGB() { return isDarkPaper() ? "205,218,255" : "64,112,180"; }

  function strokePolys(polys, alpha, solid, t) {
    const c = tplX;
    c.save();
    c.scale(U, U);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = "rgba(" + tplRGB() + "," + alpha.toFixed(3) + ")";
    c.lineWidth = solid ? 0.75 : 0.55;
    if (solid) {
      if (!reduceMo) { c.shadowColor = "rgba(" + tplRGB() + ",0.7)"; c.shadowBlur = 8 * scaleK; }
    } else {
      c.setLineDash([1.4, 1.8]);
      c.lineDashOffset = reduceMo ? 0 : -((t / 400) % 3.2);
    }
    for (const pl of polys) {
      if (!pl || pl.length < 2) continue;
      c.beginPath();
      c.moveTo(pl[0][0], pl[0][1]);
      for (let i = 1; i < pl.length; i++) c.lineTo(pl[i][0], pl[i][1]);
      c.stroke();
    }
    c.restore();
  }

  function startDot(pt, alpha) {
    if (!pt) return;
    const c = tplX;
    c.save();
    c.globalAlpha = clamp(alpha, 0, 1);
    c.beginPath();
    c.arc(pt[0] * U, pt[1] * U, 1.5 * U, 0, TAU);
    c.fillStyle = "#2FBF71";
    c.fill();
    c.lineWidth = 0.35 * U;
    c.strokeStyle = "rgba(255,255,255,0.9)";
    c.stroke();
    c.restore();
  }

  function drawDots(alpha) {
    const c = tplX;
    c.save();
    for (const d of level._dots) {
      c.beginPath();
      if (d.first) {
        c.globalAlpha = 1;
        c.arc(d.x * U, d.y * U, 1.4 * U, 0, TAU);
        c.fillStyle = "#2FBF71";
        c.fill();
        c.lineWidth = 0.3 * U;
        c.strokeStyle = "rgba(255,255,255,0.9)";
        c.stroke();
      } else {
        c.globalAlpha = alpha;
        c.arc(d.x * U, d.y * U, 0.95 * U, 0, TAU);
        c.fillStyle = "rgb(" + tplRGB() + ")";
        c.fill();
      }
    }
    c.restore();
  }

  function drawAxis() {
    const c = tplX;
    c.save();
    c.strokeStyle = isDarkPaper() ? "rgba(200,180,255,0.6)" : "rgba(140,120,220,0.55)";
    c.lineWidth = 2;
    c.setLineDash([14, 10]);
    c.beginPath();
    c.moveTo(50 * U, 4 * U);
    c.lineTo(50 * U, 96 * U);
    c.stroke();
    c.restore();
  }

  function drawGhost(t) {
    if (!ghost) return;
    const el = t - t0;
    const c = tplX;
    c.save();
    c.globalAlpha = ghostDone ? 0.35 : 0.55;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = GHOST_COLOR;
    c.fillStyle = GHOST_COLOR;
    c.lineWidth = 2.2 * U;
    let tip = null;
    for (const g of ghost.strokes) {
      const p = g.pts, ts = g.t;
      if (!p.length || ts[0] > el) continue;
      c.beginPath();
      c.moveTo(p[0][0] * U, p[0][1] * U);
      let i = 1;
      for (; i < p.length && ts[i] <= el; i++) c.lineTo(p[i][0] * U, p[i][1] * U);
      if (i < p.length) {
        const f = clamp((el - ts[i - 1]) / Math.max(1, ts[i] - ts[i - 1]), 0, 1);
        tip = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f];
        c.lineTo(tip[0] * U, tip[1] * U);
      }
      c.stroke();
    }
    if (tip && !ghostDone) {
      c.globalAlpha = 0.9;
      c.beginPath();
      c.arc(tip[0] * U, tip[1] * U, 1.8 * U, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function renderTpl(t) {
    if (!tplX) return;
    tplDirty = false;
    tplX.clearRect(0, 0, L, L);
    if (bgCanvas) tplX.drawImage(bgCanvas, 0, 0, L, L);
    if (mode === "nalar") { renderPuzzle(t < aliveUntil); return; }
    if (!level || t < aliveUntil) return;

    if (mode === "boss" && phase === "duel") drawGhost(t);

    const pulse = reduceMo ? 0.6 : 0.5 + 0.16 * Math.sin(t / 450);
    const hint = t < hintUntil;
    const bright = assisted || hint;
    const polys = mode === "cermin" ? level._half : level._polylines;

    if (mode === "kilat") {
      if (phase === "memorize") { strokePolys(polys, 0.95, true, t); startDot(level._startPt, 1); }
      else if (bright || t < lampUntil) strokePolys(polys, 0.85, true, t);
    } else if (mode === "titik") {
      if (bright) strokePolys(polys, 0.7, true, t);
      drawDots(0.85);
    } else if (mode === "langkah") {
      const n = level._parts.length;
      if (bright) strokePolys(polys, 0.7, true, t);
      else strokePolys(polys.slice(0, Math.min(step, n)), 0.26, true, t);
      if (step < n) {
        strokePolys([polys[step]], bright ? 0.95 : Math.min(1, pulse + 0.25), !!bright, t);
        startDot(polys[step][0], 1);
      }
    } else {
      // tiru, cermin, boss
      if (bright) strokePolys(polys, 0.8, true, t);
      else strokePolys(polys, phase === "count" ? 0.5 : pulse, false, t);
      const sp = level._startPt;
      if (sp && (mode !== "cermin" || sp[0] <= 50)) startDot(sp, 1);
    }
    if (mode === "cermin") drawAxis();
  }

  /* template berdenyut tiap bingkai; dengan reduceMotion hanya jejak hantu yang bergerak */
  function tplAnimated() {
    if (mode === "nalar") return !reduceMo && hintKinds().has("nextDot");
    if (!level) return false;
    return !reduceMo || phase === "duel";
  }

  /* ================= siklus hidup ================= */
  function resetCommon(opts) {
    stopLoopInput();
    onEvent = (opts && opts.onEvent) || null;
    strokes = []; fixedCount = 0; fills = []; stamps = []; actions = [];
    live = null; step = 0; streak = 0; streakMaxed = false;
    t0 = 0; frozenElapsed = -1; firstDone = false; cntEnd = 0; lastCount = 0;
    hintUsed = false; hintUntil = 0; lampUsed = false; lampUntil = 0;
    ghost = null; ghostLive = null; ghostCursor = []; ghostDone = false; lastProgress = 0;
    assisted = false; tolMul = 1; paper = null; aliveUntil = 0;
    pid = null; cur = null; curMir = null;
    fillCanvas = null;
    puzzle = null; pIdx = 0; pStep = null; hintBase = 0; hintLv = 0; wallStrokes = [];
    reduceMo = reduceMotion();
    if (wrap) {
      clearAliveClasses();
      wrap.dataset.theme = theme;
    }
    if (KA.fx && KA.fx.clear) KA.fx.clear();
  }

  function begin() {
    if (wrap) wrap.dataset.theme = theme;
    resize();
    buildBg();
    renderPaint(true);
    redrawDraw();
    tplDirty = true;
    active = true;
    ensureLoop();
  }

  function setPhase(p, count) {
    phase = p;
    tplDirty = true;
    emit("phase", { phase: p, count: count == null ? null : count });
  }

  function startLevel(lv, opts) {
    opts = opts || {};
    if (lv.mode === "nalar" && KA.puzzles) { // level Nalar tidak punya geometri gambar
      const pz = KA.puzzles.get(lv.puzzleId);
      if (pz) return startPuzzle(pz, { onEvent: opts.onEvent, hintLevel: opts.assisted ? 2 : 0 });
    }
    level = lv; mode = lv.mode; theme = lv.theme;
    resetCommon(opts);
    paper = null;
    assisted = !!opts.assisted;
    tolMul = assisted ? 1.5 : 1;
    live = KA.scoring.createLive(lv, tolMul);
    tool = { kind: "pen", color: penPalette()[0], size: DEFAULT_SIZE, stamp: null };
    begin();
    const t = now();
    if (mode === "kilat") {
      cntEnd = t + COUNT_MS; lastCount = 3;
      setPhase("memorize", 3);
    } else if (mode === "boss") {
      setupGhost(lv);
      cntEnd = t + COUNT_MS; lastCount = 3;
      setPhase("count", 3);
    } else {
      t0 = t;
      setPhase("draw");
    }
  }

  function startFree(opts) {
    opts = opts || {};
    level = null; mode = "free";
    resetCommon(opts);
    const eq = KA.storage && KA.storage.data && KA.storage.data.equipped;
    paper = opts.paper !== undefined ? opts.paper : (eq && eq.paper) || null;
    theme = { paper_blueprint: "t1", paper_grass: "t2", paper_night: "t4" }[paper] || "free";
    tool = { kind: "pen", color: colors()[0], size: DEFAULT_SIZE, stamp: null };
    begin();
    t0 = now();
    setPhase("free");
  }

  function startColor(entry, opts) {
    opts = opts || {};
    level = null; mode = "color";
    theme = entry.theme || "t1";
    resetCommon(opts);
    paper = entry.paper || null;
    strokes = (entry.strokes || []).map(copyStroke);
    fixedCount = strokes.length;
    fills = (entry.fills || []).map((f) => ({ x: f.x, y: f.y, c: f.c }));
    stamps = (entry.stamps || []).map((s) => Object.assign({}, s));
    tool = { kind: "fill", color: colors("fill")[0], size: DEFAULT_SIZE, stamp: null };
    begin();
    t0 = now();
    setPhase("color");
  }

  function stopLoopInput() {
    if (pid != null && drawC && drawC.releasePointerCapture) {
      try { drawC.releasePointerCapture(pid); } catch (e) { /* abaikan */ }
    }
    pid = null; cur = null; curMir = null;
  }

  function stop() {
    if (active && frozenElapsed < 0) frozenElapsed = rawElapsed();
    active = false;
    fxUntil = Math.max(fxUntil, now() + 1500); // biarkan partikel selesai
    stopLoopInput();
  }

  function ensureLoop() {
    if (rafId || typeof requestAnimationFrame === "undefined") return;
    rafId = requestAnimationFrame(loop);
  }

  function loop(t) {
    rafId = 0;
    t = now();
    if (active) stepPhase(t);
    if (tplDirty || (active && tplAnimated())) renderTpl(t);
    if (KA.fx && KA.fx.update) KA.fx.update();
    if (active || t < fxUntil) rafId = requestAnimationFrame(loop);
  }

  function stepPhase(t) {
    if (phase === "memorize" || phase === "count") {
      const rem = Math.ceil((cntEnd - t) / 1000);
      if (rem > 0 && rem < lastCount) { lastCount = rem; emit("phase", { phase, count: rem }); }
      if (t >= cntEnd) {
        t0 = t;
        setPhase(phase === "memorize" ? "memory" : "duel");
      }
    } else if (phase === "duel") {
      stepGhost(t);
      if (t - lastProgress >= 100) {
        lastProgress = t;
        emit("progress", {
          me: live ? live.coverage() : 0,
          ghost: ghostLive ? ghostLive.coverage() : 0,
          ghostT: ghost ? clamp((t - t0) / ghost.dur, 0, 1) : 0,
        });
      }
    }
    if (hintUntil && t >= hintUntil + 50) { hintUntil = 0; tplDirty = true; }
    if (lampUntil && t >= lampUntil + 50) { lampUntil = 0; tplDirty = true; }
  }

  /* ================= hantu ================= */
  function setupGhost(lv) {
    const rec = KA.storage && KA.storage.data && KA.storage.data.ghostRec && KA.storage.data.ghostRec[lv.id];
    let src;
    if (rec && rec.strokes && rec.strokes.length) src = { strokes: rec.strokes, score: rec.score };
    else {
      let target = 760;
      if (KA.economy && KA.economy.ghostTarget) target = KA.economy.ghostTarget(lv.id);
      else {
        const isl = KA.levels && KA.levels.island && KA.levels.island(lv.island);
        if (isl && isl.ghostTarget) target = isl.ghostTarget;
      }
      src = KA.scoring.makeGhost(lv, target);
    }
    const gs = src.strokes.filter((s) => s && s.pts && s.pts.length);
    const slow = owns("turtle") ? 1.15 : 1;
    const times = ghostTimes(gs, slow);
    ghost = {
      strokes: gs.map((s, i) => ({ pts: s.pts, t: times[i] })),
      score: src.score || 0,
      dur: 1,
    };
    ghost.dur = Math.max(1, ...times.map((a) => (a.length ? a[a.length - 1] : 0)));
    ghostLive = KA.scoring.createLive(lv, 1);
    ghostCursor = ghost.strokes.map(() => 0);
  }

  function stepGhost(t) {
    if (!ghost) return;
    const el = t - t0;
    ghost.strokes.forEach((g, si) => {
      let i = ghostCursor[si];
      while (i < g.pts.length && g.t[i] <= el) {
        liveFeed(ghostLive, i ? g.pts[i - 1] : null, g.pts[i]);
        i++;
      }
      ghostCursor[si] = i;
    });
    if (!ghostDone && el >= ghost.dur) {
      ghostDone = true;
      tplDirty = true;
      emit("ghostDone");
    }
  }

  /* ================= pointer ================= */
  function toNorm(e) {
    const r = drawC.getBoundingClientRect();
    return [
      clamp(((e.clientX - r.left) / (r.width || 1)) * 100, 0, 100),
      clamp(((e.clientY - r.top) / (r.height || 1)) * 100, 0, 100),
    ];
  }

  function evTime(e) {
    const n = now();
    const ts = e && e.timeStamp;
    return ts && Math.abs(ts - n) < 5000 ? ts : n;
  }

  function bindPointer() {
    const c = drawC;
    c.style.touchAction = "none";
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);
    c.addEventListener("lostpointercapture", onUp);
  }

  function onDown(e) {
    if (!active || !DRAWABLE[phase]) return;
    if (pid != null) { e.preventDefault(); return; } // tolak telapak / jari kedua
    if (e.button != null && e.button > 0) return;
    e.preventDefault();
    if (KA.audio && KA.audio.unlock) { try { KA.audio.unlock(); } catch (er) { /* abaikan */ } }
    const p = toNorm(e);
    const kind = mode === "color" ? (tool.kind === "pen" ? null : tool.kind)
      : mode === "free" ? tool.kind
      : mode === "nalar" ? (pStep && pStep.input === "fill" ? "fill" : "pen") : "pen";
    if (kind === "fill") return addFill(p);
    if (kind === "stamp") return addStamp(p);
    if (kind !== "pen") return;

    pid = e.pointerId;
    try { c_capture(e.pointerId); } catch (er) { /* abaikan */ }
    const ts = Math.max(0, Math.round(evTime(e) - t0));
    cur = { color: tool.color, size: tool.size || DEFAULT_SIZE, pts: [p], ts: [ts], pen: penId(), _len: 0 };
    curMir = mode === "cermin"
      ? { color: cur.color, size: cur.size, pts: mirrorPts(cur.pts), ts: [ts], pen: cur.pen, _len: 0 } : null;
    drawIncr(drawX, cur, 0);
    if (curMir) drawIncr(drawX, curMir, 0);
    if (live) {
      live.endStroke();
      liveFeed(live, null, p);
      if (curMir) liveFeed(live, null, curMir.pts[0]);
    }
    if (!firstDone) { firstDone = true; emit("firstStroke"); }
    nearLineFeedback(p);
  }
  function c_capture(id) { if (drawC.setPointerCapture) drawC.setPointerCapture(id); }

  function onMove(e) {
    if (pid == null || e.pointerId !== pid || !cur) return;
    e.preventDefault();
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!evs || !evs.length) evs = [e];
    for (const ev of evs) addPoint(toNorm(ev), evTime(ev));
    checkStep();
  }

  function addPoint(p, tAbs) {
    const last = cur.pts[cur.pts.length - 1];
    const d = Math.hypot(p[0] - last[0], p[1] - last[1]);
    if (d < MIN_STEP) return;
    const ts = Math.max(cur.ts[cur.ts.length - 1], Math.round(tAbs - t0));
    cur.pts.push(p); cur.ts.push(ts); cur._len += d;
    drawIncr(drawX, cur, cur.pts.length - 1);
    if (live) liveFeed(live, last, p);
    if (curMir) {
      const mp = [100 - p[0], p[1]], ml = curMir.pts[curMir.pts.length - 1];
      curMir.pts.push(mp); curMir.ts.push(ts); curMir._len += d;
      drawIncr(drawX, curMir, curMir.pts.length - 1);
      if (live) liveFeed(live, ml, mp);
    }
    nearLineFeedback(p);
  }

  /* kilau + nada sesekali saat tinta dekat garis; jejak bintang untuk pena Kilau */
  function nearLineFeedback(p) {
    const t = now();
    if (cur && cur.pen === "sparkle" && t - lastTrail > 70 && KA.fx && KA.fx.starTrail) {
      lastTrail = t;
      KA.fx.starTrail(p[0] * U, p[1] * U);
    }
    if (!level) return;
    const tol = level.tol * tolMul;
    const d = KA.scoring.distT(level, p[0], p[1], tol);
    if (d > tol * 0.5) return;
    if (t - lastSpark > 140 && Math.random() < 0.35 && KA.fx && KA.fx.sparkle) {
      lastSpark = t;
      KA.fx.sparkle(p[0] * U, p[1] * U, "#FFD93D");
    }
    if (t - lastPerfect > 900 && Math.random() < 0.12) {
      lastPerfect = t;
      sfx("perfect");
    }
  }

  function onUp(e) {
    if (pid == null || (e && e.pointerId !== pid)) return;
    if (e && e.type === "pointerup" && e.clientX != null && cur) addPoint(toNorm(e), evTime(e));
    const id = pid;
    pid = null;
    if (e && e.type !== "lostpointercapture" && drawC.releasePointerCapture) {
      try { drawC.releasePointerCapture(id); } catch (er) { /* abaikan */ }
    }
    finishStroke();
  }

  function cleanStroke(st) {
    if (st.pts.length === 1) { // ketukan = titik (mata, jendela kecil)
      st.pts.push([st.pts[0][0] + 0.05, st.pts[0][1]]);
      st.ts.push(st.ts[0]);
    }
    delete st._len;
    return st;
  }

  function finishStroke() {
    if (!cur) return;
    const st = cleanStroke(cur), ms = curMir ? cleanStroke(curMir) : null;
    cur = null; curMir = null;
    if (live) live.endStroke();
    strokes.push(st);
    if (ms) strokes.push(ms);
    actions.push({ kind: "stroke", n: ms ? 2 : 1 });
    redrawDraw();
    tplDirty = true;
    if (mode === "free" && fills.length) renderPaint(true);

    if (level) {
      /* Kilat: posisi dari ingatan wajar meleset, jadi penilaian per goresan dilonggarkan */
      const good = KA.scoring.strokeQuality(level, st.pts, mode === "kilat" ? tolMul * 2 : tolMul);
      if (good) {
        streak++;
        if (mult() >= 2) streakMaxed = true;
        sfx("strokeGood");
        vibrate();
      } else {
        if (streak > 0) sfx("strokeBad");
        streak = 0;
      }
      emit("stroke", { good, mult: mult() });
      checkStep();
    }
    emit("changed");
  }

  function mult() { return Math.min(2, 1 + streak * 0.15); }

  /* mode Langkah: buka bagian berikut bila bagian kini cukup tergambar */
  function checkStep() {
    if (mode !== "langkah" || !live) return;
    const total = level._parts.length;
    const n = nextStep((i) => live.part(i), step, total);
    while (step < n) {
      emit("partDone", { index: step, total });
      step++;
      sfx("partDone");
      vibrate();
      tplDirty = true;
    }
  }

  /* ================= ember cat & stiker ================= */
  function firstAction() { if (!firstDone) { firstDone = true; emit("firstStroke"); } }

  function addFill(p) {
    if (mode === "nalar") {
      const spec = pStep && pStep.regions;
      const k = spec && KA.reason ? KA.reason.partAt(spec, p[0], p[1]) : -1;
      if (k < 0) { sfx("denied"); return; } // hanya di dalam bagian bangun
      const sd = regionSeed(spec, k);
      if (fills.some((f) => f.c === tool.color && KA.reason.partAt(spec, f.x, f.y) === k)) return;
      p = [sd.x, sd.y];
    }
    fills.push({ x: r2(p[0]), y: r2(p[1]), c: tool.color });
    actions.push({ kind: "fill" });
    renderPaint(true);
    sfx("fill");
    firstAction();
    emit("changed");
  }

  function addStamp(p) {
    if (!tool.stamp) return;
    stamps.push({ id: tool.stamp, x: r2(p[0]), y: r2(p[1]), s: tool.stampSize || STAMP_SIZE, c: tool.color });
    actions.push({ kind: "stamp" });
    redrawDraw();
    sfx("stamp");
    firstAction();
    emit("changed");
  }

  /* ================= aksi ================= */
  function resetStreak() {
    const had = streak > 0;
    streak = 0;
    if (had) emit("stroke", { good: false, mult: 1, reset: true });
  }

  function undo() {
    if (pid != null || !actions.length) return false;
    const a = actions.pop();
    if (a.kind === "stroke") {
      strokes.splice(Math.max(fixedCount, strokes.length - a.n), a.n);
      if (live) live.rebuild(strokes);
      if (fills.length) renderPaint(true);
      resetStreak();
    } else if (a.kind === "fill") {
      fills.pop();
      renderPaint(true);
    } else if (a.kind === "stamp") {
      stamps.pop();
    } else if (a.kind === "clear") {
      /* hapus semua bisa diurungkan: kembalikan goresan, isian, stiker, riwayat, dan langkah */
      const s = a.save;
      strokes = strokes.slice(0, fixedCount).concat(s.strokes);
      fills = s.fills; stamps = s.stamps; actions = s.actions;
      if (mode === "langkah") step = s.step;
      if (live) live.rebuild(strokes);
      renderPaint(true);
    }
    redrawDraw();
    tplDirty = true;
    sfx("undo");
    emit("changed");
    return true;
  }

  /* Hapus semua langsung bekerja (satu ketukan) dan tercatat sebagai satu aksi, jadi Urungkan mengembalikannya. */
  function clearAll() {
    stopLoopInput();
    if (strokes.length <= fixedCount && !fills.length && !stamps.length) return false;
    const save = { strokes: strokes.slice(fixedCount), fills: fills.slice(), stamps: stamps.slice(), actions: actions.slice(), step };
    strokes = strokes.slice(0, fixedCount);
    fills = []; stamps = []; actions = [{ kind: "clear", save }];
    if (live) live.reset();
    if (mode === "langkah") step = 0;
    renderPaint(true);
    redrawDraw();
    tplDirty = true;
    resetStreak();
    emit("changed");
    return true;
  }

  function canFinish() {
    if (mode === "color") return true;
    if (mode === "free" || mode === "nalar") return strokes.length + fills.length + stamps.length > 0;
    return !!level && strokes.length > 0 && !!DRAWABLE[phase];
  }

  function rawElapsed() { return t0 ? (now() - t0) / 1000 : 0; }
  function elapsed() { return frozenElapsed >= 0 ? frozenElapsed : rawElapsed(); }

  const HINT_MODES = { tiru: 1, titik: 1, langkah: 1, cermin: 1 };
  function hintLeft() { return !!level && !!HINT_MODES[mode] && !hintUsed && !assisted && active; }
  function showHint() {
    if (!hintLeft()) return false;
    hintUsed = true;
    hintUntil = now() + HINT_MS;
    tplDirty = true;
    return true;
  }
  function lampLeft() { return mode === "kilat" && !lampUsed && active && phase !== "memorize"; }
  function flashLamp() {
    if (!lampLeft() || phase !== "memory") return false;
    if (!owns("lamp")) return "need";
    lampUsed = true;
    lampUntil = now() + LAMP_MS;
    tplDirty = true;
    return true;
  }

  function colorsUsed() {
    const set = new Set();
    strokes.slice(fixedCount).forEach((s) => s.color && set.add(String(s.color).toLowerCase()));
    fills.forEach((f) => f.c && set.add(String(f.c).toLowerCase()));
    return set.size;
  }

  function evaluate() {
    const extra = {
      dur: Math.round(elapsed() * 10) / 10,
      colorsUsed: colorsUsed(),
      streakMaxed,
      fastGhost: mode === "boss" && !ghostDone && strokes.length > 0 && phase === "duel",
      ghostScore: ghost ? ghost.score : 0,
    };
    if (!level) return Object.assign({ score: 0, stars: 0, strokeCount: strokes.length }, extra);
    const res = KA.scoring.evaluate(level, strokes, { tolMul, assisted });
    return Object.assign(res, extra);
  }

  function copyStroke(s) {
    const o = { color: s.color, size: s.size, pts: s.pts.map((p) => [r2(p[0]), r2(p[1])]) };
    if (s.ts) o.ts = s.ts.slice();
    o.pen = s.pen || "default";
    return o;
  }

  function snapshot() {
    return {
      strokes: strokes.map(copyStroke),
      fills: fills.map((f) => ({ x: f.x, y: f.y, c: f.c })),
      stamps: stamps.map((s) => Object.assign({}, s)),
    };
  }

  /* ================= Tantangan Nalar ================= */
  /* benih isian di tengah bagian ke-k (sama dengan jawaban di puzzles.js) */
  function regionSeed(spec, k) {
    if (spec.kind === "sectors") {
      const rot = spec.rot != null ? spec.rot : -Math.PI / 2;
      const a = rot + ((k + 0.5) / spec.n) * TAU;
      return { x: spec.cx + Math.cos(a) * spec.r * 0.55, y: spec.cy + Math.sin(a) * spec.r * 0.55 };
    }
    const c = k % spec.cols, rw = Math.floor(k / spec.cols);
    return { x: spec.x + (spec.w * (c + 0.5)) / spec.cols, y: spec.y + (spec.h * (rw + 0.5)) / spec.rows };
  }
  const regionCount = (spec) => (spec.kind === "sectors" ? spec.n : spec.cols * spec.rows);

  function startPuzzle(pz, opts) {
    opts = opts || {};
    if (typeof pz === "string" && KA.puzzles) pz = KA.puzzles.get(pz);
    level = null; mode = "nalar";
    theme = "t" + (pz.island || 1);
    resetCommon(opts);
    puzzle = pz;
    hintBase = clamp(opts.hintLevel | 0, 0, 3);
    pStep = pz.steps[0];
    begin();
    t0 = now();
    setPuzzleStep(opts.stepIndex | 0);
  }

  function setPuzzleStep(i) {
    if (!puzzle) return false;
    pIdx = clamp(i | 0, 0, puzzle.steps.length - 1);
    pStep = puzzle.steps[pIdx];
    stopLoopInput();
    strokes = []; fixedCount = 0; fills = []; stamps = []; actions = [];
    streak = 0;
    hintLv = hintBase;
    const spec = pStep.regions;
    wallStrokes = spec && KA.reason
      ? KA.reason.regionOutline(spec).map((pts) => ({ color: "#000000", size: 1.6, pts })) : [];
    const fill = pStep.input === "fill";
    tool = { kind: fill ? "fill" : "pen", color: (fill ? colors("fill") : penPalette())[0], size: DEFAULT_SIZE, stamp: null };
    renderPaint(true);
    redrawDraw();
    tplDirty = true;
    phase = "puzzle";
    emit("phase", { phase: "puzzle", step: pIdx });
    emit("changed");
    return true;
  }

  function puzzleInput() {
    return {
      strokes: strokes.map(copyStroke),
      fills: fills.map((f) => ({ x: f.x, y: f.y, c: f.c })),
    };
  }

  /* tingkat petunjuk 0–3; visual bersifat kumulatif (tingkat 3 juga menampilkan visual tingkat 2) */
  function showPuzzleHint(lv) {
    if (!pStep) return null;
    hintLv = clamp(lv | 0, 0, 3);
    tplDirty = true;
    redrawDraw();
    return hintLv ? pStep.hints[hintLv - 1] || null : null;
  }

  function hintShows() {
    if (!pStep || !pStep.hints) return [];
    return pStep.hints.filter((h) => h && h.level <= hintLv && h.show).map((h) => h.show);
  }
  function hintKinds() { return new Set(hintShows().map((s) => s.kind)); }

  function inkRGB() { return isDarkPaper() ? "236,240,245" : "51,51,68"; }
  function font(sz) { return "bold " + Math.round(sz * U) + "px system-ui, -apple-system, 'Segoe UI', sans-serif"; }

  function polyPath(c, pl) {
    c.beginPath();
    c.moveTo(pl[0][0] * U, pl[0][1] * U);
    for (let i = 1; i < pl.length; i++) c.lineTo(pl[i][0] * U, pl[i][1] * U);
  }

  function drawGrid(g) {
    const c = tplX, G = g.size, [ox, oy] = g.origin;
    c.save();
    c.strokeStyle = isDarkPaper() ? "rgba(170,190,255,0.28)" : "rgba(69,140,209,0.30)";
    c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i <= g.cols; i++) { c.moveTo((ox + G * i) * U, oy * U); c.lineTo((ox + G * i) * U, (oy + G * g.rows) * U); }
    for (let j = 0; j <= g.rows; j++) { c.moveTo(ox * U, (oy + G * j) * U); c.lineTo((ox + G * g.cols) * U, (oy + G * j) * U); }
    c.stroke();
    const ax = g.axes;
    if (ax) {
      const len = G * ax.max;
      c.strokeStyle = "rgb(" + inkRGB() + ")";
      c.fillStyle = "rgb(" + inkRGB() + ")";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(ax.x0 * U, ax.y0 * U); c.lineTo((ax.x0 + len) * U, ax.y0 * U);
      c.moveTo(ax.x0 * U, ax.y0 * U); c.lineTo(ax.x0 * U, (ax.y0 - len) * U);
      c.stroke();
      c.font = font(2.6);
      c.textAlign = "center"; c.textBaseline = "top";
      for (let i = 0; i <= ax.max; i++) c.fillText(String(i), (ax.x0 + G * i) * U, (ax.y0 + 1.2) * U);
      c.textAlign = "right"; c.textBaseline = "middle";
      for (let j = 1; j <= ax.max; j++) c.fillText(String(j), (ax.x0 - 1.2) * U, (ax.y0 - G * j) * U);
    }
    c.restore();
  }

  function drawTemplateView(polys) {
    const c = tplX;
    c.save();
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "rgba(" + tplRGB() + ",0.9)";
    c.lineWidth = 0.6 * U;
    c.setLineDash([1.4 * U, 1.6 * U]);
    for (const pl of polys) if (pl && pl.length > 1) { polyPath(c, pl); c.stroke(); }
    c.restore();
  }

  function drawAxisView(a) {
    const c = tplX;
    c.save();
    c.strokeStyle = isDarkPaper() ? "rgba(200,180,255,0.75)" : "rgba(140,120,220,0.7)";
    c.lineWidth = 2.5;
    c.setLineDash([14, 10]);
    c.beginPath();
    if (a.dir === "h") { c.moveTo(4 * U, a.at * U); c.lineTo(96 * U, a.at * U); }
    else { c.moveTo(a.at * U, 4 * U); c.lineTo(a.at * U, 96 * U); }
    c.stroke();
    c.restore();
  }

  function drawDotsView(dots) {
    const c = tplX;
    c.save();
    c.font = font(3.4);
    c.textAlign = "left"; c.textBaseline = "bottom";
    for (const d of dots) {
      c.fillStyle = "rgb(" + inkRGB() + ")";
      c.beginPath();
      c.arc(d.x * U, d.y * U, 1.1 * U, 0, TAU);
      c.fill();
      if (d.label != null) {
        c.lineWidth = 4;
        c.strokeStyle = isDarkPaper() ? "rgba(43,49,80,0.85)" : "rgba(255,253,246,0.9)";
        c.strokeText(String(d.label), (d.x + 1.4) * U, (d.y - 1.2) * U);
        c.fillText(String(d.label), (d.x + 1.4) * U, (d.y - 1.2) * U);
      }
    }
    c.restore();
  }

  const SHAPE_FILL = { circle: "#FFB3B3", triangle: "#A8DAF0", square: "#C8F0B0" };
  function shapePath(c, kind, b) {
    const cx = (b.x + b.w / 2) * U, cy = (b.y + b.h / 2) * U, s = b.w * 0.35 * U;
    c.beginPath();
    if (kind === "circle") c.arc(cx, cy, s, 0, TAU);
    else if (kind === "triangle") { c.moveTo(cx, cy - s); c.lineTo(cx + s, cy + s * 0.8); c.lineTo(cx - s, cy + s * 0.8); c.closePath(); }
    else c.rect(cx - s, cy - s, 2 * s, 2 * s);
  }
  function drawBoxesView(boxes, hiIdx) {
    const c = tplX;
    c.save();
    boxes.forEach((b, i) => {
      const hi = hiIdx && hiIdx.has(i);
      c.beginPath();
      c.rect(b.x * U, b.y * U, b.w * U, b.h * U);
      c.fillStyle = hi ? "rgba(255,217,61,0.45)" : isDarkPaper() ? "rgba(255,255,255,0.06)" : "rgba(64,112,180,0.06)";
      c.fill();
      c.lineWidth = hi ? 4 : 2;
      c.strokeStyle = hi ? "#F4A100" : "rgba(" + tplRGB() + ",0.7)";
      if (b.blank) c.setLineDash([10, 8]);
      c.stroke();
      c.setLineDash([]);
      if (b.blank) {
        c.fillStyle = "rgba(" + tplRGB() + ",0.35)";
        c.font = font(b.h * 0.4);
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText("?", (b.x + b.w / 2) * U, (b.y + b.h / 2) * U);
      } else if (b.shape) {
        shapePath(c, b.shape, b);
        c.fillStyle = SHAPE_FILL[b.shape] || "#E8D5C0";
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = "rgb(" + inkRGB() + ")";
        c.stroke();
      }
    });
    c.restore();
  }

  function drawPivot(pv) {
    const c = tplX;
    c.save();
    c.beginPath();
    c.arc(pv.x * U, pv.y * U, 1.6 * U, 0, TAU);
    c.fillStyle = "#E63946";
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = "#FFFFFF";
    c.stroke();
    c.beginPath();
    c.arc(pv.x * U, pv.y * U, 0.45 * U, 0, TAU);
    c.fillStyle = "#FFFFFF";
    c.fill();
    c.restore();
  }

  function drawCard(labels) {
    const c = tplX;
    c.save();
    c.font = font(2.8);
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = "rgb(" + inkRGB() + ")";
    c.fillText(labels.join("  →  "), 50 * U, 4.6 * U);
    c.restore();
  }

  function partPath(c, spec, k) {
    c.beginPath();
    if (spec.kind === "sectors") {
      const rot = spec.rot != null ? spec.rot : -Math.PI / 2;
      const a0 = rot + (k / spec.n) * TAU, a1 = rot + ((k + 1) / spec.n) * TAU;
      c.moveTo(spec.cx * U, spec.cy * U);
      c.arc(spec.cx * U, spec.cy * U, spec.r * U, a0, a1);
      c.closePath();
    } else {
      const col = k % spec.cols, rw = Math.floor(k / spec.cols);
      c.rect((spec.x + (spec.w * col) / spec.cols) * U, (spec.y + (spec.h * rw) / spec.rows) * U,
        (spec.w / spec.cols) * U, (spec.h / spec.rows) * U);
    }
  }

  /* petunjuk visual di lapisan tpl (di bawah isian & goresan) */
  function drawHints(t) {
    const c = tplX;
    const view = pStep.view || {};
    const g = (view.grid) || (KA.puzzles && KA.puzzles.GRID) || { size: 8, origin: [10, 10] };
    for (const sh of hintShows()) {
      c.save();
      if (sh.kind === "dots" || sh.kind === "nextDot") {
        let pts = sh.pts || [];
        if (sh.kind === "nextDot") {
          const nd = KA.puzzles && KA.puzzles.nextDot ? KA.puzzles.nextDot(pStep, strokes) : null;
          pts = nd ? [[nd.x, nd.y]] : [];
        }
        const pulse = reduceMo || sh.kind === "dots" ? 1 : 0.8 + 0.25 * Math.sin(t / 220);
        for (const p of pts) {
          c.beginPath();
          c.arc(p[0] * U, p[1] * U, 2.4 * U * pulse, 0, TAU);
          c.fillStyle = "rgba(255,217,61,0.55)";
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = "#F4A100";
          c.stroke();
        }
      } else if (sh.kind === "cells") {
        c.fillStyle = "rgba(255,217,61,0.45)";
        c.strokeStyle = "#F4A100";
        c.lineWidth = 2;
        for (const [i, j] of sh.cells || []) {
          const x = g.origin[0] + g.size * i, y = g.origin[1] + g.size * j;
          c.fillRect(x * U, y * U, g.size * U, g.size * U);
          c.strokeRect(x * U, y * U, g.size * U, g.size * U);
        }
      } else if (sh.kind === "partial") {
        c.lineCap = "round"; c.lineJoin = "round";
        c.strokeStyle = "rgba(47,191,113,0.75)";
        c.lineWidth = 0.9 * U;
        c.setLineDash([1.2 * U, 1.2 * U]);
        for (const pl of sh.polylines || []) if (pl.length > 1) { polyPath(c, pl); c.stroke(); }
      } else if (sh.kind === "fills" && pStep.regions && KA.reason) {
        c.fillStyle = "rgba(255,217,61,0.5)";
        for (const f of sh.fills || []) {
          const k = KA.reason.partAt(pStep.regions, f.x, f.y);
          if (k >= 0) { partPath(c, pStep.regions, k); c.fill(); }
        }
      }
      c.restore();
    }
  }

  /* view langkah aktif di lapisan tpl; bare = tanpa petunjuk (saat gambar hidup) */
  function renderPuzzle(bare) {
    if (!pStep) return;
    const v = pStep.view || {};
    if (v.grid || puzzle.paper === "grid") drawGrid(v.grid || (KA.puzzles && KA.puzzles.GRID) || { size: 8, origin: [10, 10], cols: 10, rows: 10 });
    if (!bare && pStep.hints) drawHints(now());
    if (v.axis) drawAxisView(v.axis);
    if (v.template) drawTemplateView(v.template);
    if (v.boxes) {
      const hi = new Set();
      if (!bare) hintShows().forEach((s) => s.kind === "boxes" && (s.idx || []).forEach((i) => hi.add(i)));
      drawBoxesView(v.boxes, hi);
    }
    if (v.dots) drawDotsView(v.dots);
    if (v.pivot) drawPivot(v.pivot);
    if (v.card && v.card.length) drawCard(v.card);
  }

  /* lapisan draw (di atas isian): garis batas bagian + label nomor bagian (petunjuk 'labels') */
  function drawPuzzleTop(c) {
    const spec = pStep && pStep.regions;
    if (!spec || !KA.reason) return;
    c.save();
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = "rgb(" + inkRGB() + ")";
    c.lineWidth = 0.6 * U;
    for (const pl of KA.reason.regionOutline(spec)) { polyPath(c, pl); c.stroke(); }
    if (hintShows().some((s) => s.kind === "labels")) {
      c.font = font(4.2);
      c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 5;
      c.strokeStyle = "rgba(255,255,255,0.9)";
      c.fillStyle = "#E07A00";
      const n = regionCount(spec);
      for (let k = 0; k < n; k++) {
        const s = regionSeed(spec, k);
        c.strokeText(String(k + 1), s.x * U, s.y * U);
        c.fillText(String(k + 1), s.x * U, s.y * U);
      }
    }
    c.restore();
  }

  /* ================= gambar hidup ================= */
  function clearAliveClasses() {
    if (!wrap) return;
    Array.from(wrap.classList).forEach((c) => { if (c === "alive" || c.indexOf("anim-") === 0) wrap.classList.remove(c); });
  }

  function playAlive(anim) {
    return new Promise((resolve) => {
      const rm = reduceMotion();
      aliveUntil = now() + ALIVE_MS;
      fxUntil = Math.max(fxUntil, aliveUntil + 1500);
      tplDirty = true;
      clearAliveClasses();
      if (!rm && wrap) {
        void wrap.offsetWidth; // mulai ulang animasi CSS
        wrap.classList.add("alive", "anim-" + (anim || "twinkle"));
      }
      if (KA.fx) {
        if (!rm && KA.fx.burst) KA.fx.burst(L / 2, L / 2);
        if (KA.fx.sparkle) {
          const pts = strokes.flatMap((s) => s.pts);
          const n = Math.min(12, pts.length);
          for (let i = 0; i < n; i++) {
            const p = pts[Math.floor(Math.random() * pts.length)];
            KA.fx.sparkle(p[0] * U, p[1] * U, "#FFD93D");
          }
          if (!pts.length) KA.fx.sparkle(L / 2, L / 2, "#FFD93D");
        }
      }
      sfx("magic");
      ensureLoop();
      setTimeout(() => {
        clearAliveClasses();
        aliveUntil = 0;
        tplDirty = true;
        renderTpl(now());
        resolve();
      }, ALIVE_MS);
    });
  }

  return {
    init, startLevel, startFree, startColor, startPuzzle, stop, resize,
    setPuzzleStep, puzzleInput, showPuzzleHint,
    SIZES, colors,
    get tool() { return tool; },
    setTool(patch) { Object.assign(tool, patch || {}); },
    undo, clearAll, canFinish, elapsed,
    showHint, flashLamp, hintLeft, lampLeft,
    evaluate, snapshot, playAlive,
    get mode() { return mode; },
    get phase() { return phase; },
    get theme() { return theme; },
    get level() { return level; },
    get assisted() { return assisted; },
    get mult() { return mult(); },
    get step() { return step; },
    get ghostScore() { return ghost ? ghost.score : 0; },
    get puzzle() { return puzzle; },
    get puzzleStep() { return pIdx; },
    get hintLevel() { return hintLv; },
    /* logika murni untuk uji */
    _pure: { mirrorPts, nextStep, ghostTimes, subdivide, lum, regionSeed },
  };
})();

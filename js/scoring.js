/* Kanvas Ajaib: skor jujur: ketepatan, kelengkapan, kerapian, kelancaran.
   Murni (tanpa DOM) supaya bisa diuji di Node: node tests/run.js */
window.KA = window.KA || {};

KA.scoring = (function () {
  const CELL = 4;
  const STAR_REQ = [550, 750, 900];

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  /* ---------- grid titik untuk pencarian tetangga ---------- */
  function makeGrid(points, getX, getY) {
    const map = new Map();
    points.forEach((p, i) => {
      const k = ((getX(p) / CELL) | 0) + "," + ((getY(p) / CELL) | 0);
      let b = map.get(k);
      if (!b) map.set(k, (b = []));
      b.push(i);
    });
    return map;
  }

  /* jarak & indeks tetangga terdekat; `accept(i)` opsional untuk menyaring */
  function nearestIdx(map, points, getX, getY, x, y, maxD, accept) {
    const r = Math.ceil(maxD / CELL);
    const gx = (x / CELL) | 0, gy = (y / CELL) | 0;
    let best = maxD * maxD + 1e-9, bi = -1;
    for (let ox = -r; ox <= r; ox++) for (let oy = -r; oy <= r; oy++) {
      const b = map.get(gx + ox + "," + (gy + oy));
      if (!b) continue;
      for (const i of b) {
        if (accept && !accept(i)) continue;
        const dx = getX(points[i]) - x, dy = getY(points[i]) - y;
        const d = dx * dx + dy * dy;
        if (d < best) { best = d; bi = i; }
      }
    }
    return { d: bi < 0 ? Infinity : Math.sqrt(best), i: bi };
  }
  function nearest(map, points, getX, getY, x, y, maxD) {
    return nearestIdx(map, points, getX, getY, x, y, maxD).d;
  }

  const TX = (p) => p.x, TY = (p) => p.y;
  const AX = (p) => p[0], AY = (p) => p[1];

  function prepare(level) {
    if (!level._grid) level._grid = makeGrid(level._pts, TX, TY);
    return level._grid;
  }

  /* jarak titik ke template (Infinity bila > maxD) */
  function distT(level, x, y, maxD = 30) {
    return nearest(prepare(level), level._pts, TX, TY, x, y, maxD);
  }
  /* bagian template terdekat (-1 bila > maxD) */
  function partAt(level, x, y, maxD) {
    const r = nearestIdx(prepare(level), level._pts, TX, TY, x, y, maxD);
    return r.i < 0 ? -1 : level._pts[r.i].part;
  }

  /* ---------- resampling goresan: titik tiap `step` satuan ---------- */
  function resample(pts, step = 1) {
    if (!pts || !pts.length) return [];
    const out = [[pts[0][0], pts[0][1]]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (d === 0) continue;
      let t = step - carry;
      while (t <= d) {
        out.push([x1 + ((x2 - x1) * t) / d, y1 + ((y2 - y1) * t) / d]);
        t += step;
      }
      carry = d - (t - step);
    }
    const last = pts[pts.length - 1];
    const o = out[out.length - 1];
    if (Math.hypot(last[0] - o[0], last[1] - o[1]) > step * 0.3) out.push([last[0], last[1]]);
    return out;
  }

  const ptsOf = (st) => (st && st.pts ? st.pts : st);

  /* bobot kesearahan tinta (titik i pada goresan r) dengan tangen template p:
     |cos| ≥ 0,85 → 1; |cos| ≤ 0,5 → 0 */
  function alignWeight(r, i, p) {
    if (r.length < 3 || p.tx === undefined) return 1;
    const a = r[Math.max(0, i - 2)], b = r[Math.min(r.length - 1, i + 2)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return 1;
    const c = Math.abs((dx * p.tx + dy * p.ty) / len);
    return clamp01((c - 0.5) / 0.35);
  }

  /* getaran goresan: simpangan titik dari rata-rata tetangganya (jendela ±1) */
  function jitterOf(rs) {
    let sum = 0, n = 0;
    for (const r of rs) {
      for (let i = 1; i < r.length - 1; i++) {
        const ax = (r[i - 1][0] + r[i][0] + r[i + 1][0]) / 3;
        const ay = (r[i - 1][1] + r[i][1] + r[i + 1][1]) / 3;
        sum += Math.hypot(r[i][0] - ax, r[i][1] - ay);
        n++;
      }
    }
    return n ? sum / n : 0;
  }

  /* ---------- penyejajaran bentuk (mode Kilat) ----------
     Gambar dari ingatan wajar bergeser dan sedikit lebih besar/kecil. Sebelum dinilai, tinta digeser dan
     diskalakan seragam (tanpa putar) agar paling pas dengan template: inisialisasi dari kotak pembatas,
     lalu beberapa putaran ICP dengan 20% pasangan terjauh dibuang supaya goresan nyasar tidak menarik hasil. */
  const ALIGN_S = [0.7, 1.4];
  function boxOf(pts, gx, gy) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) { const x = gx(p), y = gy(p); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }
  function alignParams(level, ink, tol) {
    const id = { s: 1, tx: 0, ty: 0 };
    if (ink.length < 8) return id;
    const clampS = (v) => Math.max(ALIGN_S[0], Math.min(ALIGN_S[1], v));
    const bi = boxOf(ink, AX, AY), bt = boxOf(level._pts, TX, TY);
    const di = Math.max(bi.w, bi.h), dt = Math.max(bt.w, bt.h);
    let s = di > 1 ? clampS(dt / di) : 1;
    let tx = bt.cx - s * bi.cx, ty = bt.cy - s * bi.cy;
    const step = Math.max(1, Math.floor(ink.length / 500));
    const sample = ink.filter((_, i) => i % step === 0);
    const grid = prepare(level);
    for (let it = 0; it < 10; it++) {
      const pairs = [];
      for (const [x, y] of sample) {
        const px = s * x + tx, py = s * y + ty;
        const n = nearestIdx(grid, level._pts, TX, TY, px, py, 20);
        if (n.i >= 0) pairs.push([x, y, level._pts[n.i].x, level._pts[n.i].y, n.d]);
      }
      if (pairs.length < 8) break;
      pairs.sort((a, b) => a[4] - b[4]);
      const keep = pairs.slice(0, Math.max(8, Math.floor(pairs.length * 0.8)));
      let pcx = 0, pcy = 0, qcx = 0, qcy = 0;
      for (const [x, y, qx, qy] of keep) { pcx += x; pcy += y; qcx += qx; qcy += qy; }
      pcx /= keep.length; pcy /= keep.length; qcx /= keep.length; qcy /= keep.length;
      let num = 0, den = 0;
      for (const [x, y, qx, qy] of keep) { num += (x - pcx) * (qx - qcx) + (y - pcy) * (qy - qcy); den += (x - pcx) ** 2 + (y - pcy) ** 2; }
      const ns = den > 1e-6 ? clampS(num / den) : s;
      const ntx = qcx - ns * pcx, nty = qcy - ns * pcy;
      const moved = Math.abs(ns - s) * 50 + Math.abs(ntx - tx) + Math.abs(nty - ty);
      s = ns; tx = ntx; ty = nty;
      if (moved < 0.05) break;
    }
    /* Penyejajaran hanya dipercaya bila tinta benar-benar menempel pada bentuk: rata-rata jarak 80% tinta
       terdekat ≤ 0,34 × toleransi. Gambar ingatan yang jujur ≤ 0,32; coretan ≥ 0,35 (diukur di uji). */
    const ds = sample.map(([x, y]) => Math.min(30, nearestIdx(grid, level._pts, TX, TY, s * x + tx, s * y + ty, 30).d)).sort((a, b) => a - b);
    const k = ds.slice(0, Math.max(1, Math.floor(ds.length * 0.8)));
    const fit = k.reduce((a, b) => a + b, 0) / k.length / tol;
    return fit <= 0.34 ? { s, tx, ty, fit } : { s: 1, tx: 0, ty: 0, fit, rejected: true };
  }

  function gradeOf(score) {
    return score >= 950 ? "S" : score >= 850 ? "A" : score >= 700 ? "B" : score >= 550 ? "C" : "D";
  }
  function starsOf(score) {
    return score >= STAR_REQ[2] ? 3 : score >= STAR_REQ[1] ? 2 : score >= STAR_REQ[0] ? 1 : 0;
  }

  /*
   * level   : level ter-build
   * strokes : [{pts:[[x,y]...]}] atau [[x,y]...] (koordinat 0–100)
   * opts    : { tolMul = 1, assisted = false }
   */
  function evaluate(level, strokes, opts = {}) {
    const tolMul = opts.tolMul || 1;
    const tol = level.tol * tolMul;
    const T = level._pts;
    let raw = (strokes || []).map(ptsOf).filter((p) => p && p.length);
    let align = null;
    if (opts.align != null ? opts.align : level.mode === "kilat") {
      align = alignParams(level, raw.map((p) => resample(p, 1)).flat(), tol);
      const { s, tx, ty } = align;
      raw = raw.map((p) => p.map(([x, y]) => [s * x + tx, s * y + ty]));
    }
    const rs = raw.map((p) => resample(p, 1)).filter((r) => r.length);
    const ink = rs.flat();
    const empty = {
      precision: 0, cover: 0, neat: 0, smooth: 0, acc: 0, comp: 0, core: 0, score: 0,
      grade: "D", stars: 0, perfect: false, assisted: !!opts.assisted,
      parts: level._parts.map(() => 0), ptState: new Uint8Array(T.length),
      inkLen: 0, inkRatio: 0, strokeCount: 0, align,
    };
    if (ink.length < 2) return empty;

    let inkLen = 0;
    for (const r of rs) inkLen += Math.max(0, r.length - 1);

    /* kelengkapan: titik template yang dekat tinta. Tinta hanya menutup bagian
       template yang paling dekat dengannya, supaya menggambar satu garis tidak
       ikut "menutup" garis tetangga yang sejajar dan berdekatan. */
    const inkGrid = makeGrid(ink, AX, AY);
    const inkPart = ink.map(([x, y]) => partAt(level, x, y, tol * 1.6));
    const ptState = new Uint8Array(T.length);
    const partW = level._parts.map(() => 0), partCov = level._parts.map(() => 0);
    let coverW = 0, totalW = 0;
    T.forEach((p, i) => {
      const d = nearestIdx(inkGrid, ink, AX, AY, p.x, p.y, tol, (j) => inkPart[j] === p.part).d;
      ptState[i] = d <= tol ? 2 : nearest(inkGrid, ink, AX, AY, p.x, p.y, tol * 1.6) <= tol * 1.6 ? 1 : 0;
      totalW += p.w;
      partW[p.part] += p.w;
      if (ptState[i] === 2) { coverW += p.w; partCov[p.part] += p.w; }
    });
    /* bagian yang hanya terserempet dihitung jauh lebih kecil (kuadrat cakupan) */
    const partFrac = partCov.map((c, i) => (partW[i] ? c / partW[i] : 1));
    const cover = totalW ? partFrac.reduce((s, f, i) => s + partW[i] * f * f, 0) / totalW : 0;

    /* ketepatan: tinta yang berada di garis DAN searah dengan garisnya.
       Coretan yang memotong garis template tidak dihitung tepat. */
    let onLine = 0, tight = 0;
    for (const r of rs) {
      for (let i = 0; i < r.length; i++) {
        const [x, y] = r[i];
        const n = nearestIdx(prepare(level), T, TX, TY, x, y, tol);
        if (n.i < 0) continue;
        const w = alignWeight(r, i, T[n.i]);
        onLine += w;
        if (n.d <= tol * 0.5) tight += w;
      }
    }
    const precision = onLine / ink.length;
    const tightFrac = tight / ink.length;

    /* kerapian: tidak menebalkan bolak-balik */
    const inkRatio = inkLen / Math.max(1, level._totalLen);
    const neat = clamp01(1 - (inkRatio - 1.6) / 2);

    /* kelancaran: getaran kecil */
    const jit = jitterOf(rs);
    const smooth = clamp01(1 - (jit - 0.08) / 0.45);

    const core = precision + cover > 0 ? (2 * precision * cover) / (precision + cover) : 0;
    let score = Math.pow(core, 1.5) * (0.75 + 0.125 * neat + 0.125 * smooth) * 1000;
    if (opts.assisted) {
      if (core >= 0.6) score = Math.max(score, STAR_REQ[0]);
      score = Math.min(score, STAR_REQ[2] - 1);
    }
    score = Math.round(Math.min(1000, score));
    const perfect = tightFrac >= 0.5 && precision >= 0.85;

    return {
      precision, cover, neatF: neat, smoothF: smooth, core, jitter: jit, tightFrac,
      acc: Math.round(precision * 100),
      comp: Math.round(cover * 100),
      neat: Math.round(neat * 100),
      smooth: Math.round(smooth * 100),
      score, grade: gradeOf(score), stars: starsOf(score), perfect,
      assisted: !!opts.assisted,
      parts: partFrac,
      ptState, inkLen, inkRatio, strokeCount: rs.length, align,
    };
  }

  /* kualitas satu goresan → untuk streak & reaksi Noko */
  function strokeQuality(level, pts, tolMul = 1) {
    const r = resample(pts, 1);
    if (r.length < 3) return false;
    const tol = level.tol * tolMul;
    let good = 0;
    r.forEach(([x, y], i) => {
      const n = nearestIdx(prepare(level), level._pts, TX, TY, x, y, tol);
      if (n.i >= 0) good += alignWeight(r, i, level._pts[n.i]);
    });
    return good / r.length >= 0.6;
  }

  /* ---------- cakupan langsung (mode Langkah, bilah duel) ---------- */
  function createLive(level, tolMul = 1) {
    prepare(level);
    const tol = level.tol * tolMul;
    const T = level._pts;
    const covered = new Uint8Array(T.length);
    const partW = level._parts.map((p) => {
      let w = 0;
      for (let i = p.from; i < p.to; i++) w += T[i].w;
      return w;
    });
    const partCov = partW.map(() => 0);
    let totalW = partW.reduce((a, b) => a + b, 0), covW = 0;
    let lastPt = null;

    function mark(x, y) {
      const part = partAt(level, x, y, tol * 1.6);
      if (part < 0) return;
      const r = Math.ceil(tol / CELL);
      const gx = (x / CELL) | 0, gy = (y / CELL) | 0;
      for (let ox = -r; ox <= r; ox++) for (let oy = -r; oy <= r; oy++) {
        const b = level._grid.get(gx + ox + "," + (gy + oy));
        if (!b) continue;
        for (const i of b) {
          if (covered[i]) continue;
          const p = T[i];
          if (p.part !== part) continue;
          if ((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) <= tol * tol) {
            covered[i] = 1;
            covW += p.w;
            partCov[p.part] += p.w;
          }
        }
      }
    }

    return {
      /* tambah titik; interpolasi dari titik sebelumnya dalam goresan yang sama */
      add(x, y, newStroke) {
        if (newStroke || !lastPt) mark(x, y);
        else {
          const d = Math.hypot(x - lastPt[0], y - lastPt[1]);
          const n = Math.max(1, Math.ceil(d));
          for (let k = 1; k <= n; k++) mark(lastPt[0] + ((x - lastPt[0]) * k) / n, lastPt[1] + ((y - lastPt[1]) * k) / n);
        }
        lastPt = [x, y];
      },
      endStroke() { lastPt = null; },
      reset() { covered.fill(0); partCov.fill(0); covW = 0; lastPt = null; },
      rebuild(strokes) {
        this.reset();
        for (const s of strokes) {
          const pts = ptsOf(s);
          pts.forEach(([x, y], i) => this.add(x, y, i === 0));
          this.endStroke();
        }
      },
      coverage() { return totalW ? covW / totalW : 0; },
      part(i) { return partW[i] ? partCov[i] / partW[i] : 1; },
      get covered() { return covered; },
    };
  }

  /* ---------- hantu sintetis deterministik ---------- */
  function rng(seed) {
    let s = (seed * 2654435761) >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function ghostStrokes(level, amp, seed) {
    const rnd = rng(seed);
    const out = [];
    for (const pl of level._polylines) {
      const r = resample(pl, 1);
      let ox = (rnd() - 0.5) * amp, oy = (rnd() - 0.5) * amp;
      const pts = r.map(([x, y]) => {
        ox = Math.max(-amp, Math.min(amp, ox + (rnd() - 0.5) * amp * 0.35));
        oy = Math.max(-amp, Math.min(amp, oy + (rnd() - 0.5) * amp * 0.35));
        return [x + ox + (rnd() - 0.5) * 0.25, y + oy + (rnd() - 0.5) * 0.25];
      });
      out.push({ pts });
    }
    return out;
  }

  /* cari amplitudo getaran supaya skor hantu ≈ target */
  function makeGhost(level, target) {
    const seed = level.id * 97 + 13;
    let lo = 0, hi = level.tol * 3, best = null;
    for (let it = 0; it < 18; it++) {
      const amp = (lo + hi) / 2;
      const strokes = ghostStrokes(level, amp, seed);
      const score = evaluate(level, strokes).score;
      if (!best || Math.abs(score - target) < Math.abs(best.score - target)) best = { strokes, score, amp };
      if (score > target) lo = amp; else hi = amp;
    }
    return { strokes: best.strokes, score: best.score };
  }

  return {
    STAR_REQ, evaluate, strokeQuality, createLive, makeGhost, resample,
    distT, prepare, gradeOf, starsOf,
  };
})();

/* Kanvas Ajaib: penilai Tantangan Nalar (murni, tanpa DOM).
   Poligon dari goresan, sifat bangun, pengenal bentuk, urutan titik/koordinat,
   pecahan luas isian, luas persegi panjang, dan transformasi template. Koordinat 0–100. */
window.KA = window.KA || {};

KA.reason = (function () {
  const R2D = 180 / Math.PI;
  const RIGHT_TOL = 12;     // toleransi sudut siku (derajat)
  const PARALLEL_TOL = 10;  // toleransi sejajar (derajat)

  /* ================= utilitas geometri ================= */
  const ptsOf = (s) => ((s && s.pts ? s.pts : s) || []).filter((p) => p && isFinite(p[0]) && isFinite(p[1]));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function plen(p) { let d = 0; for (let i = 1; i < p.length; i++) d += dist(p[i - 1], p[i]); return d; }

  function resample(pts, step) {
    if (!pts.length) return [];
    const out = [[pts[0][0], pts[0][1]]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (d === 0) continue;
      let t = step - carry;
      while (t <= d) { out.push([x1 + ((x2 - x1) * t) / d, y1 + ((y2 - y1) * t) / d]); t += step; }
      carry = d - (t - step);
    }
    const last = pts[pts.length - 1], o = out[out.length - 1];
    if (dist(last, o) > step * 0.3) out.push([last[0], last[1]]);
    return out;
  }

  function segDist(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L2 = dx * dx + dy * dy;
    let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function polyDist(p, poly, closed) {
    let m = Infinity;
    const n = poly.length;
    for (let i = 0; i < n - 1; i++) m = Math.min(m, segDist(p, poly[i], poly[i + 1]));
    if (closed && n > 2) m = Math.min(m, segDist(p, poly[n - 1], poly[0]));
    if (n === 1) m = dist(p, poly[0]);
    return m;
  }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  function shoelace(v) {
    let a = 0;
    for (let i = 0; i < v.length; i++) { const p = v[i], q = v[(i + 1) % v.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return Math.abs(a) / 2;
  }
  function hull(pts) {
    const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  /* sudut belok di titik b (0 = lurus), derajat */
  function turnAt(a, b, c) {
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (!lu || !lv) return 0;
    return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv)))) * R2D;
  }

  /* ================= gabung goresan & penyederhanaan ================= */
  /* goresan yang ujungnya bersambung (≤ gap) digabung menjadi rantai */
  function joinStrokes(strokes, gap) {
    const segs = (strokes || []).map(ptsOf).filter((p) => p.length >= 2 && plen(p) > 0.5).map((p) => p.map((q) => [q[0], q[1]]));
    if (gap == null) {
      const b = bbox(segs.flat());
      gap = Math.max(2.5, 0.12 * Math.max(b.w, b.h, 1));
    }
    const used = segs.map(() => false), chains = [];
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      let ch = segs[i].slice();
      for (;;) {
        let best = null;
        for (let j = 0; j < segs.length; j++) {
          if (used[j]) continue;
          const s = segs[j], h = ch[0], t = ch[ch.length - 1], a = s[0], z = s[s.length - 1];
          const opts = [[dist(t, a), "ta"], [dist(t, z), "tz"], [dist(h, z), "hz"], [dist(h, a), "ha"]];
          for (const [d, k] of opts) if (d <= gap && (!best || d < best.d)) best = { d, k, j };
        }
        if (!best) break;
        used[best.j] = true;
        const s = segs[best.j];
        if (best.k === "ta") ch = ch.concat(s);
        else if (best.k === "tz") ch = ch.concat(s.slice().reverse());
        else if (best.k === "hz") ch = s.concat(ch);
        else ch = s.slice().reverse().concat(ch);
      }
      chains.push(ch);
    }
    return chains;
  }

  /* Ramer–Douglas–Peucker → indeks titik yang dipertahankan */
  function rdp(pts, eps, a = 0, b = pts.length - 1) {
    const keep = [a];
    const stack = [[a, b]];
    const mark = new Uint8Array(pts.length);
    mark[a] = mark[b] = 1;
    while (stack.length) {
      const [i, j] = stack.pop();
      let md = -1, mi = -1;
      for (let k = i + 1; k < j; k++) { const d = segDist(pts[k], pts[i], pts[j]); if (d > md) { md = d; mi = k; } }
      if (md > eps) { mark[mi] = 1; stack.push([i, mi], [mi, j]); }
    }
    keep.length = 0;
    for (let k = a; k <= b; k++) if (mark[k]) keep.push(k);
    return keep;
  }
  /* RDP untuk lingkar tertutup: loop[n-1] == loop[0]; hasil indeks dalam [0, n-1) */
  function rdpClosed(loop, eps) {
    const n = loop.length - 1;
    let far = 0, fd = -1;
    for (let k = 1; k < n; k++) { const d = dist(loop[k], loop[0]); if (d > fd) { fd = d; far = k; } }
    if (far === 0) return [0];
    const A = rdp(loop, eps, 0, far), B = rdp(loop, eps, far, n);
    return A.concat(B.slice(1, -1));
  }
  function simplify(pts, eps) { return rdp(pts, eps).map((i) => pts[i]); }

  function fitLine(pts) {
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of pts) { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    return { p: [cx, cy], d: [Math.cos(th), Math.sin(th)] };
  }
  function intersect(l1, l2) {
    const cr = l1.d[0] * l2.d[1] - l1.d[1] * l2.d[0];
    if (Math.abs(cr) < Math.sin(8 / R2D)) return null;
    const wx = l2.p[0] - l1.p[0], wy = l2.p[1] - l1.p[1];
    const t = (wx * l2.d[1] - wy * l2.d[0]) / cr;
    return [l1.p[0] + t * l1.d[0], l1.p[1] + t * l1.d[1]];
  }

  function gridOf(opts) {
    const g = opts && opts.grid;
    if (!g) return null;
    if (typeof g === "number") return { size: g, ox: (opts.origin || [0, 0])[0], oy: (opts.origin || [0, 0])[1] };
    return { size: g.size, ox: (g.origin || [0, 0])[0], oy: (g.origin || [0, 0])[1] };
  }
  const snapPt = (p, G) => [G.ox + Math.round((p[0] - G.ox) / G.size) * G.size, G.oy + Math.round((p[1] - G.oy) / G.size) * G.size];

  /* buang titik kembar & titik segaris (siklik bila tertutup) */
  function cleanVerts(v, closed, minTurn) {
    let out = v.slice();
    let changed = true;
    while (changed && out.length > (closed ? 3 : 2)) {
      changed = false;
      const n = out.length;
      for (let i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) continue;
        const a = out[(i - 1 + n) % n], b = out[i], c = out[(i + 1) % n];
        if (dist(a, b) < 1e-6 || turnAt(a, b, c) < minTurn) { out.splice(i, 1); changed = true; break; }
      }
    }
    if (closed && out.length > 1 && dist(out[0], out[out.length - 1]) < 1e-6) out.pop();
    return out;
  }

  /* ================= analisis bangun ================= */
  /* opts: {grid (ukuran kotak, angka) | {size, origin}, origin:[ox,oy]} */
  function analyze(strokes, opts) {
    opts = opts || {};
    const G = gridOf(opts);
    const allPts = (strokes || []).map(ptsOf).filter((p) => p.length);
    const totalInk = allPts.reduce((s, p) => s + plen(p), 0);
    const base = { empty: true, closed: false, verts: [], sides: 0, corners: 0, sideLens: [], angles: [], rightAngles: 0,
      parallelPairs: 0, area: 0, perimeter: 0, fitErr: 1, inkRatio: 0, isCircle: false, scribble: true, kind: null,
      size: 0, grid: G ? G.size : null, ideal: [] };
    if (totalInk < 2) return base;

    const ball = bbox(allPts.flat());
    const sizeAll = Math.max(ball.w, ball.h, 1);
    const chains = joinStrokes(strokes, Math.max(2.5, 0.12 * sizeAll, G ? 0.45 * G.size : 0));
    chains.sort((a, b) => plen(b) - plen(a));
    const main = chains[0];
    const mainLen = plen(main);
    const extraInk = totalInk - mainLen;
    let raw = resample(main, 1);
    const bb = bbox(raw);
    const size = Math.max(bb.w, bb.h, 1);

    /* tertutup? (celah kecil atau melewati titik awal) */
    let ct = Math.max(2.5, 0.15 * size);
    if (G) ct = Math.max(ct, 0.5 * G.size);
    let closed = false;
    const n0 = raw.length;
    if (n0 > 4 && dist(raw[0], raw[n0 - 1]) <= ct) closed = true;
    else if (n0 > 8) {
      let best = { d: Infinity };
      const ia = Math.floor(n0 * 0.3), jb = Math.floor(n0 * 0.7);
      for (let i = 0; i <= ia; i++) for (let j = jb; j < n0; j++) {
        const d = dist(raw[i], raw[j]);
        if (d < best.d) best = { d, i, j };
      }
      if (best.d <= ct * 0.7 && best.j - best.i > n0 * 0.5) { raw = raw.slice(best.i, best.j + 1); closed = true; }
    }

    const res = Object.assign({}, base, { empty: false, closed, size });
    const eps = Math.max(1.8, 0.05 * size);
    const minEdge = 0.12 * size;
    let verts;

    if (closed) {
      const loop = raw.concat([raw[0]]);
      const N = loop.length - 1;
      let ids = rdpClosed(loop, eps);
      /* gabung sisi pendek (sudut membulat) lalu buang titik segaris */
      for (let guard = 0; guard < 200 && ids.length > 3; guard++) {
        const m = ids.length;
        let si = -1, sl = Infinity;
        for (let k = 0; k < m; k++) { const l = dist(loop[ids[k]], loop[ids[(k + 1) % m]]); if (l < sl) { sl = l; si = k; } }
        if (sl < minEdge) {
          const a = ids[si], b = ids[(si + 1) % m];
          const mid = b > a ? Math.floor((a + b) / 2) : Math.floor((a + b + N) / 2) % N;
          ids = [...new Set(ids.filter((x) => x !== a && x !== b).concat([mid]))].sort((x, y) => x - y);
          continue;
        }
        let ti = -1, tv = Infinity;
        for (let k = 0; k < m; k++) {
          const t = turnAt(loop[ids[(k - 1 + m) % m]], loop[ids[k]], loop[ids[(k + 1) % m]]);
          if (t < tv) { tv = t; ti = k; }
        }
        if (tv < 25) { ids.splice(ti, 1); continue; }
        break;
      }
      /* perhalus sudut: potongkan garis hasil fitting tiap sisi */
      const m = ids.length;
      const lines = [];
      for (let k = 0; k < m; k++) {
        const a = ids[k], b = ids[(k + 1) % m];
        const seg = [];
        const cnt = b > a ? b - a : b + N - a;
        const trim = Math.floor(cnt * 0.15);
        for (let s = trim; s <= cnt - trim; s++) seg.push(loop[(a + s) % N]);
        lines.push(seg.length >= 3 ? fitLine(seg) : fitLine([loop[a], loop[b]]));
      }
      verts = ids.map((id, k) => {
        const p = m >= 3 ? intersect(lines[(k - 1 + m) % m], lines[k]) : null;
        return p && dist(p, loop[id]) < 0.3 * size ? p : loop[id].slice();
      });
      if (G) verts = verts.map((p) => snapPt(p, G));
      verts = cleanVerts(verts, true, G ? 3 : 8);
    } else {
      verts = rdp(raw, eps).map((i) => raw[i].slice());
      if (G) verts = verts.map((p) => snapPt(p, G));
      verts = cleanVerts(verts, false, G ? 3 : 25);
    }

    const n = verts.length;
    const edges = [];
    const ne = closed ? n : n - 1;
    for (let i = 0; i < ne; i++) edges.push([verts[i], verts[(i + 1) % n]]);
    const unit = G ? G.size : 1;
    res.verts = verts;
    res.sides = closed && n >= 3 ? n : Math.max(0, ne);
    res.corners = closed && n >= 3 ? n : Math.max(0, n - 2);
    res.sideLens = edges.map(([a, b]) => +(dist(a, b) / unit).toFixed(3));
    res.perimeter = edges.reduce((s, [a, b]) => s + dist(a, b), 0);
    if (closed && n >= 3) {
      res.angles = verts.map((v, i) => 180 - turnAt(verts[(i - 1 + n) % n], v, verts[(i + 1) % n]));
      res.rightAngles = res.angles.filter((a) => Math.abs(a - 90) <= RIGHT_TOL).length;
      res.area = shoelace(verts) / (unit * unit);
    }
    const dirs = edges.map(([a, b]) => Math.atan2(b[1] - a[1], b[0] - a[0]) * R2D);
    let pp = 0;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const adj = j === i + 1 || (closed && i === 0 && j === edges.length - 1);
      if (adj) continue;
      let d = Math.abs(dirs[i] - dirs[j]) % 180;
      if (d > 90) d = 180 - d;
      if (d <= PARALLEL_TOL) pp++;
    }
    res.parallelPairs = pp;

    /* kecocokan tinta dengan poligon & rasio tinta */
    let fe = 0;
    for (const p of raw) fe += polyDist(p, verts, closed && n >= 3);
    res.fitErr = raw.length ? fe / raw.length / size : 1;
    res.inkRatio = res.perimeter ? totalInk / res.perimeter : Infinity;

    /* lingkaran: tertutup, bulat (selubung cembung), jari-jari seragam */
    if (closed) {
      const H = hull(raw);
      const hA = shoelace(H), hP = plen(H.concat([H[0]]));
      const circ = hP ? (4 * Math.PI * hA) / (hP * hP) : 0;
      let cx = 0, cy = 0;
      for (const p of raw) { cx += p[0]; cy += p[1]; }
      cx /= raw.length; cy /= raw.length;
      const rs = raw.map((p) => Math.hypot(p[0] - cx, p[1] - cy));
      const R = rs.reduce((s, r) => s + r, 0) / rs.length;
      const cv = Math.sqrt(rs.reduce((s, r) => s + (r - R) * (r - R), 0) / rs.length) / (R || 1);
      const circErr = rs.reduce((s, r) => s + Math.abs(r - R), 0) / rs.length / size;
      res.circularity = circ;
      res.radiusCV = cv;
      /* poligon bersisi sedikit yang pas (segi lima, segi enam) bukan lingkaran */
      res.isCircle = circ > 0.86 && cv < 0.15 && totalInk / (2 * Math.PI * R) < 1.5 && extraInk < 0.2 * totalInk &&
        res.sides !== 4 && res.sides !== 3 && (res.sides >= 7 || circErr <= 1.5 * res.fitErr);
      if (res.isCircle) {
        const c = [];
        for (let i = 0; i <= 48; i++) c.push([cx + Math.cos((i / 48) * 2 * Math.PI) * R, cy + Math.sin((i / 48) * 2 * Math.PI) * R]);
        res.circle = { cx, cy, r: R };
        res.ideal = [c];
      }
    }
    if (!res.isCircle && n >= 2) res.ideal = [closed ? verts.concat([verts[0]]) : verts];

    res.scribble = !res.isCircle && (res.fitErr > 0.07 || res.inkRatio > 1.6 || extraInk > 0.25 * totalInk || res.sides > 8);
    res.kind = kindOf(res);
    return res;
  }

  function kindOf(a) {
    if (a.empty) return null;
    if (a.isCircle) return "circle";
    if (!a.closed || a.scribble) return null;
    if (a.sides === 3 && a.area * (a.grid || 1) * (a.grid || 1) > 0.08 * a.size * a.size) return "triangle";
    if (a.sides === 4 && a.rightAngles === 4) {
      const L = a.sideLens;
      const w = (L[0] + L[2]) / 2, h = (L[1] + L[3]) / 2;
      return Math.max(w, h) / Math.max(1e-6, Math.min(w, h)) <= 1.2 ? "square" : "rect";
    }
    return null;
  }

  function classify(strokes, opts) { return analyze(strokes, opts).kind; }

  /* ================= template & mutu gambar (memakai KA.scoring) ================= */
  function makeTemplate(polylines, tol) {
    const lv = { id: 0, pos: 0, island: 0, name: "nalar", mode: "tiru", anim: null, boss: false, tol: tol || 6,
      paths: () => polylines.map((p) => p.map((q) => [q[0], q[1]])) };
    KA.levels.build(lv);
    return lv;
  }
  const asTpl = (t, tol) => (t && t._pts ? t : makeTemplate(t, tol));

  function quality(strokes, ideal, tol) {
    if (!ideal || !ideal.length || !KA.scoring) return null;
    const r = KA.scoring.evaluate(asTpl(ideal, tol || 5), (strokes || []).map((s) => ({ pts: ptsOf(s) })));
    return r.core;
  }

  const NO_INK = "Ayo gambar dulu ya";
  const hasInk = (strokes) => (strokes || []).some((s) => ptsOf(s).length >= 2 && plen(ptsOf(s)) > 1);

  /* ================= pemeriksa: sifat bangun ================= */
  /* spec: {sides, equalSides, allRight, noRight, parallelPairs} */
  function checkShape(strokes, spec, opts) {
    if (!hasInk(strokes)) return { ok: false, reason: NO_INK };
    const a = analyze(strokes, opts);
    const fail = (reason) => ({ ok: false, reason, props: a });
    if (a.isCircle) return fail("Itu lingkaran, perlu sisi lurus");
    if (!a.closed) return fail("Bangunnya belum tertutup rapat");
    if (a.scribble) return fail("Garisnya belum lurus rapi");
    if (spec.sides && a.sides !== spec.sides) return fail(`Sisinya ada ${a.sides}, coba hitung lagi`);
    if (a.area * (a.grid || 1) * (a.grid || 1) < 0.08 * a.size * a.size) return fail("Bangunnya terlalu gepeng");
    if (spec.equalSides) {
      const L = a.sideLens, mx = Math.max(...L), mn = Math.min(...L);
      if (mx / Math.max(1e-6, mn) > (a.grid ? 1.08 : 1.15)) return fail("Sisinya belum sama panjang");
    }
    if (spec.allRight && a.rightAngles < a.corners) return fail(`Baru ${a.rightAngles} sudut siku, perlu ${a.corners}`);
    if (spec.noRight && a.rightAngles > 0) return fail("Ada sudut siku, miringkan sedikit");
    if (spec.parallelPairs && a.parallelPairs < spec.parallelPairs) return fail("Sisinya belum sejajar berpasangan");
    if (spec.parallelExact != null && a.parallelPairs !== spec.parallelExact)
      return fail(a.parallelPairs > spec.parallelExact ? "Terlalu banyak sisi sejajar" : "Perlu sepasang sisi sejajar");
    if (spec.rightAngles != null && a.rightAngles !== spec.rightAngles)
      return fail(`Ada ${a.rightAngles} sudut siku, perlu ${spec.rightAngles}`);
    if (spec.notEqual) {
      const L = a.sideLens, mx = Math.max(...L), mn = Math.min(...L);
      if (mx / Math.max(1e-6, mn) < (a.grid ? 1.15 : 1.25)) return fail("Itu persegi, buat lebih panjang");
    }
    return { ok: true, reason: "Hebat, bangunnya tepat!", props: a, quality: quality(strokes, a.ideal) };
  }

  /* ================= pemeriksa: luas persegi panjang ================= */
  /* opts: {grid, origin, area, notDims:[w,h] (jawaban pertama)} → key "3x4" (sisi pendek dulu) */
  function checkArea(strokes, opts) {
    if (!hasInk(strokes)) return { ok: false, reason: NO_INK };
    const a = analyze(strokes, opts);
    const fail = (reason) => ({ ok: false, reason, props: a });
    if (!a.closed) return fail("Bangunnya belum tertutup rapat");
    if (a.scribble) return fail("Gambar persegi panjang yang rapi");
    if (a.sides !== 4) return fail(`Sisinya ada ${a.sides}, perlu 4`);
    if (a.rightAngles < 4) return fail("Sudutnya belum siku semua");
    const L = a.sideLens;
    const w = Math.round((L[0] + L[2]) / 2 * 100) / 100, h = Math.round((L[1] + L[3]) / 2 * 100) / 100;
    const dims = [Math.min(w, h), Math.max(w, h)];
    const area = Math.round(a.area * 100) / 100;
    const key = dims.map((d) => +d.toFixed(2)).join("x");
    if (Math.abs(area - opts.area) > 0.05) return Object.assign(fail(`Luasnya ${+area.toFixed(1)} kotak, perlu ${opts.area}`), { key, dims, area });
    if (opts.notDims) {
      const nd = opts.notDims.slice().sort((x, y) => x - y);
      if (Math.abs(nd[0] - dims[0]) < 0.05 && Math.abs(nd[1] - dims[1]) < 0.05)
        return Object.assign(fail("Ukurannya sama, coba yang lain"), { key, dims, area });
    }
    return { ok: true, reason: `Benar, ${dims[0]} kali ${dims[1]}!`, props: a, key, dims, area, quality: quality(strokes, a.ideal) };
  }

  /* ================= pemeriksa: keliling persegi panjang ================= */
  /* opts: {grid, origin, perimeter, notDims} → seperti checkArea, tetapi yang diukur keliling */
  function checkPerimeter(strokes, opts) {
    if (!hasInk(strokes)) return { ok: false, reason: NO_INK };
    const a = analyze(strokes, opts);
    const fail = (reason) => ({ ok: false, reason, props: a });
    if (!a.closed) return fail("Pagarnya belum tertutup rapat");
    if (a.scribble) return fail("Gambar persegi panjang yang rapi");
    if (a.sides !== 4) return fail(`Sisinya ada ${a.sides}, perlu 4`);
    if (a.rightAngles < 4) return fail("Sudutnya belum siku semua");
    const L = a.sideLens;
    const w = Math.round((L[0] + L[2]) / 2 * 100) / 100, h = Math.round((L[1] + L[3]) / 2 * 100) / 100;
    const dims = [Math.min(w, h), Math.max(w, h)];
    const per = Math.round((2 * (w + h)) * 100) / 100;
    const key = dims.map((d) => +d.toFixed(2)).join("x");
    if (Math.abs(per - opts.perimeter) > 0.1) return Object.assign(fail(`Kelilingnya ${+per.toFixed(1)} kotak, perlu ${opts.perimeter}`), { key, dims, per });
    if (opts.notDims) {
      const nd = opts.notDims.slice().sort((x, y) => x - y);
      if (Math.abs(nd[0] - dims[0]) < 0.05 && Math.abs(nd[1] - dims[1]) < 0.05)
        return Object.assign(fail("Ukurannya sama, coba yang lain"), { key, dims, per });
    }
    return { ok: true, reason: `Benar, ${dims[0]} dan ${dims[1]}!`, props: a, key, dims, per, quality: quality(strokes, a.ideal) };
  }

  /* ================= pemeriksa: urutan titik / koordinat ================= */
  /* targets: [{x,y,label}] berurutan; opts: {tol, decoys:[{x,y,label}], closed, prefix:'Nomor'|'Titik'} */
  function pathTrace(strokes, targets, opts) {
    const tol = opts.tol || 3.2;
    const inks = (strokes || []).map(ptsOf).map((p) => resample(p, 0.5)).filter((p) => p.length);
    const seq = [];
    let decoyHit = null;
    for (const ink of inks) {
      for (const p of ink) {
        if (!decoyHit) for (const d of opts.decoys || []) if (dist(p, [d.x, d.y]) <= tol) { decoyHit = d; break; }
        let hit = -1, hd = tol;
        targets.forEach((t, i) => { const d = dist(p, [t.x, t.y]); if (d <= hd) { hd = d; hit = i; } });
        if (hit >= 0 && seq[seq.length - 1] !== hit) seq.push(hit);
      }
    }
    let idx = 0, skipped = -1;
    for (const t of seq) {
      if (t === idx) idx++;
      else if (t > idx && skipped < 0) { skipped = idx; break; }
      if (idx >= targets.length) break;
    }
    return { inks, seq, idx, skipped, decoyHit, tol };
  }
  function pathProgress(strokes, targets, opts) {
    const t = pathTrace(strokes, targets, opts || {});
    return t.skipped >= 0 ? t.skipped : Math.min(t.idx, targets.length - 1);
  }
  function checkPath(strokes, targets, opts) {
    opts = opts || {};
    const fmt = (l) => (opts.prefix ? opts.prefix + " " + l : String(l));
    const first = targets[0];
    if (!hasInk(strokes)) return { ok: false, reason: `Mulai dari ${fmt(first.label)}`, next: 0 };
    const T = pathTrace(strokes, targets, opts);
    const fail = (reason, next) => ({ ok: false, reason, next });
    if (T.decoyHit) return fail(`${fmt(T.decoyHit.label)} bukan jalannya`, T.idx);
    if (T.skipped >= 0) return fail(T.skipped === 0 ? `Mulai dari ${fmt(first.label)}` : `${fmt(targets[T.skipped].label)} terlewat`, T.skipped);
    if (T.idx < targets.length) return fail(T.idx === 0 ? `Mulai dari ${fmt(first.label)}` : `Lanjutkan ke ${fmt(targets[T.idx].label)}`, T.idx);
    /* setiap ruas harus benar-benar tergambar */
    const cov = Math.max(T.tol, 3);
    const ink = T.inks.flat();
    const near = (p, r) => { for (const q of ink) if (Math.abs(q[0] - p[0]) <= r && Math.abs(q[1] - p[1]) <= r && dist(p, q) <= r) return true; return false; };
    const pairs = [];
    for (let i = 0; i < targets.length - 1; i++) pairs.push([targets[i], targets[i + 1]]);
    if (opts.closed && targets.length > 2) pairs.push([targets[targets.length - 1], targets[0]]);
    for (const [a, b] of pairs) {
      const smp = resample([[a.x, a.y], [b.x, b.y]], 1);
      const okN = smp.filter((p) => near(p, cov)).length;
      if (okN / smp.length < 0.75) return fail(`Sambungkan ${a.label} ke ${b.label}`, targets.indexOf(b));
    }
    /* tinta harus tetap di jalur */
    const path = pairs.map(([a, b]) => [[a.x, a.y], [b.x, b.y]]);
    let on = 0;
    for (const p of ink) { let m = Infinity; for (const [a, b] of path) m = Math.min(m, segDist(p, a, b)); if (m <= cov * 1.3) on++; }
    if (on / ink.length < 0.85) return fail("Garisnya keluar dari jalur", targets.length);
    const ideal = [targets.map((t) => [t.x, t.y]).concat(opts.closed ? [[first.x, first.y]] : [])];
    return { ok: true, reason: "Hebat, urutannya benar!", next: targets.length, quality: quality(strokes, ideal) };
  }

  /* ================= pemeriksa: jiplak template tersembunyi ================= */
  /* target: polylines atau template; opts: {tol, wrong:[{polylines|tpl, reason}], minCore} */
  function checkTrace(strokes, target, opts) {
    opts = opts || {};
    if (!hasInk(strokes)) return { ok: false, reason: NO_INK };
    const S = (strokes || []).map((s) => ({ pts: ptsOf(s) }));
    const tpl = asTpl(target, opts.tol);
    const r = KA.scoring.evaluate(tpl, S);
    if (r.stars >= 1 && r.core >= (opts.minCore || 0.6)) return { ok: true, reason: "Pas sekali, hebat!", quality: r.core, res: r };
    for (const w of opts.wrong || []) {
      const wr = KA.scoring.evaluate(asTpl(w.tpl || w.polylines, opts.tol), S);
      if (wr.score > r.score && wr.score >= 450) return { ok: false, reason: w.reason, quality: r.core, res: r };
    }
    let reason = "Hampir, coba lebih rapi";
    if (r.comp < 60 && r.acc >= 60) reason = "Masih ada bagian yang kurang";
    else if (r.acc < 60) reason = "Garisnya belum di tempatnya";
    return { ok: false, reason, quality: r.core, res: r };
  }

  /* ================= pemeriksa: pola bentuk dalam kotak ================= */
  const SHAPE_NAME = { circle: "lingkaran", triangle: "segitiga", square: "persegi", rect: "persegi panjang" };
  function strokesInBox(strokes, box) {
    const mx = box.w * 0.15, my = box.h * 0.15;
    return (strokes || []).filter((s) => {
      const p = ptsOf(s);
      if (!p.length) return false;
      const inside = p.filter(([x, y]) => x >= box.x - mx && x <= box.x + box.w + mx && y >= box.y - my && y <= box.y + box.h + my).length;
      return inside / p.length >= 0.6;
    });
  }
  /* boxes: [{x,y,w,h}], expected: ['circle'|'triangle'|'square'|'rect'] */
  function checkPattern(strokes, boxes, expected) {
    if (!hasInk(strokes)) return { ok: false, reason: NO_INK };
    const kinds = [];
    let qmin = 1;
    for (let i = 0; i < boxes.length; i++) {
      const st = strokesInBox(strokes, boxes[i]);
      if (!hasInk(st)) return { ok: false, reason: `Kotak ${i + 1} masih kosong`, kinds };
      const a = analyze(st);
      let k = a.kind;
      kinds.push(k);
      if (!k) return { ok: false, reason: `Kotak ${i + 1} belum jelas bentuknya`, kinds };
      if (expected[i] === "square" && k === "rect") k = "square";
      if (k !== expected[i]) return { ok: false, reason: `Kotak ${i + 1} belum cocok polanya`, kinds };
      const q = quality(st, a.ideal, Math.max(2.5, a.size * 0.12));
      if (q != null) qmin = Math.min(qmin, q);
    }
    return { ok: true, reason: "Polanya tepat sekali!", kinds, quality: qmin };
  }

  /* ================= wilayah berjuring/petak & pecahan isian ================= */
  /* spec: {kind:'sectors', cx, cy, r, n, rot?} | {kind:'cells', x, y, w, h, cols, rows} */
  function regionOutline(spec) {
    const out = [];
    if (spec.kind === "sectors") {
      const rot = spec.rot != null ? spec.rot : -Math.PI / 2;
      const c = [];
      for (let i = 0; i <= 72; i++) c.push([spec.cx + Math.cos((i / 72) * 2 * Math.PI) * spec.r, spec.cy + Math.sin((i / 72) * 2 * Math.PI) * spec.r]);
      out.push(c);
      for (let k = 0; k < spec.n; k++) {
        const a = rot + (k / spec.n) * 2 * Math.PI;
        out.push([[spec.cx, spec.cy], [spec.cx + Math.cos(a) * spec.r, spec.cy + Math.sin(a) * spec.r]]);
      }
    } else {
      const { x, y, w, h, cols, rows } = spec;
      out.push([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
      for (let i = 1; i < cols; i++) out.push([[x + (w * i) / cols, y], [x + (w * i) / cols, y + h]]);
      for (let j = 1; j < rows; j++) out.push([[x, y + (h * j) / rows], [x + w, y + (h * j) / rows]]);
    }
    return out;
  }
  /* bagian ke-berapa titik (x,y) berada; -1 bila di luar bangun */
  function partAt(spec, x, y) {
    if (spec.kind === "sectors") {
      const dx = x - spec.cx, dy = y - spec.cy;
      if (Math.hypot(dx, dy) >= spec.r) return -1;
      const rot = spec.rot != null ? spec.rot : -Math.PI / 2;
      let a = Math.atan2(dy, dx) - rot;
      a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return Math.min(spec.n - 1, Math.floor(a / ((2 * Math.PI) / spec.n)));
    }
    const { x: rx, y: ry, w, h, cols, rows } = spec;
    if (x <= rx || x >= rx + w || y <= ry || y >= ry + h) return -1;
    return Math.min(rows - 1, Math.floor(((y - ry) / h) * rows)) * cols + Math.min(cols - 1, Math.floor(((x - rx) / w) * cols));
  }
  function rasterWalls(polylines, res) {
    const walls = new Uint8Array(res * res);
    const s = res / 100;
    for (const pl of polylines) for (const [x, y] of resample(pl, 0.4 / s)) {
      const px = Math.floor(x * s), py = Math.floor(y * s);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = px + dx, Y = py + dy;
        if (X >= 0 && Y >= 0 && X < res && Y < res) walls[Y * res + X] = 1;
      }
    }
    return walls;
  }
  const maskCache = new Map();
  function regionMasks(spec, res) {
    res = res || 200;
    const key = JSON.stringify(spec) + "@" + res;
    if (maskCache.has(key)) return maskCache.get(key);
    const outline = regionOutline(spec);
    const walls = rasterWalls(outline, res);
    const n = spec.kind === "sectors" ? spec.n : spec.cols * spec.rows;
    const parts = Array.from({ length: n }, () => new Uint8Array(res * res));
    const shape = new Uint8Array(res * res);
    for (let py = 0; py < res; py++) for (let px = 0; px < res; px++) {
      const i = py * res + px;
      const k = partAt(spec, ((px + 0.5) / res) * 100, ((py + 0.5) / res) * 100);
      if (k < 0) continue;
      shape[i] = 1;
      if (!walls[i]) parts[k][i] = 1;
    }
    const m = { res, walls, parts, shape, outline };
    maskCache.set(key, m);
    return m;
  }
  function flood(walls, w, h, sx, sy) {
    if (KA.art && KA.art.floodFill) return KA.art.floodFill(walls, w, h, sx, sy);
    const out = new Uint8Array(w * h);
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h || walls[sy * w + sx]) return out;
    const st = [sy * w + sx];
    while (st.length) {
      const i = st.pop();
      if (out[i] || walls[i]) continue;
      out[i] = 1;
      const x = i % w;
      if (x > 0) st.push(i - 1);
      if (x < w - 1) st.push(i + 1);
      if (i >= w) st.push(i - w);
      if (i < w * (h - 1)) st.push(i + w);
    }
    return out;
  }
  /* seeds: [{x,y}] (0–100) → mask isian gabungan memakai flood fill ember cat */
  function fillFromSeeds(walls, res, seeds) {
    const out = new Uint8Array(res * res);
    for (const s of seeds || []) {
      const r = flood(walls, res, res, (s.x / 100) * res, (s.y / 100) * res);
      for (let i = 0; i < r.length; i++) if (r[i]) out[i] = 1;
    }
    return out;
  }
  /* input: {parts:[Uint8Array], fill:Uint8Array, shape?}; target: pecahan (0..1) */
  function checkFraction(input, target, opts) {
    opts = opts || {};
    const parts = input.parts, fill = input.fill;
    const n = parts.length;
    let tot = 0, filled = 0, kFull = 0;
    const inShape = input.shape || null;
    for (const p of parts) {
      let a = 0, f = 0;
      for (let i = 0; i < p.length; i++) if (p[i]) { a++; if (fill[i]) f++; }
      tot += a; filled += f;
      if (a && f / a >= 0.5) kFull++;
    }
    let outside = 0;
    if (inShape) for (let i = 0; i < fill.length; i++) if (fill[i] && !inShape[i]) outside++;
    const frac = tot ? filled / tot : 0;
    if (!filled && !outside) return { ok: false, reason: "Ayo warnai dulu ya", frac, count: 0 };
    if (outside > 0.05 * tot) return { ok: false, reason: "Warnai di dalam bangunnya", frac, count: kFull };
    const tolF = opts.tol != null ? opts.tol : 0.05;
    if (Math.abs(frac - target) <= tolF) return { ok: true, reason: `Tepat, ${kFull}/${n} berwarna!`, frac, count: kFull };
    return { ok: false, reason: frac < target ? `Baru ${kFull}/${n} yang berwarna` : `Kebanyakan, ${kFull}/${n} berwarna`, frac, count: kFull };
  }
  /* jalan pintas: spec wilayah + benih ember cat */
  function checkFill(spec, seeds, target, opts) {
    const m = regionMasks(spec, (opts && opts.res) || 200);
    const fill = fillFromSeeds(m.walls, m.res, seeds);
    return checkFraction({ parts: m.parts, fill, shape: m.shape }, target, opts);
  }

  /* ================= transformasi polyline ================= */
  const mapPl = (pls, f) => pls.map((pl) => pl.map((p) => f(p)));
  function translate(pls, dx, dy) { return mapPl(pls, ([x, y]) => [x + dx, y + dy]); }
  /* putar 90° di sekitar (cx,cy); cw = searah jarum jam di layar (y ke bawah) */
  function rotate90(pls, cx, cy, cw = true) {
    return mapPl(pls, ([x, y]) => (cw ? [cx - (y - cy), cy + (x - cx)] : [cx + (y - cy), cy - (x - cx)]));
  }
  /* putar sembarang sudut (derajat, searah jarum jam di layar) di sekitar (cx,cy) */
  function rotate(pls, cx, cy, deg) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return mapPl(pls, ([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  }
  function reflect(pls, axis, at = 50) {
    return mapPl(pls, ([x, y]) => (axis === "h" ? [x, 2 * at - y] : [2 * at - x, y]));
  }
  /* potong ke separuh bidang: axis 'v' (x) atau 'h' (y); side −1 simpan ≤ at, +1 simpan ≥ at */
  function clipHalf(pls, axis, at, side) {
    const c = (p) => (axis === "h" ? p[1] : p[0]);
    const inside = (p) => (side < 0 ? c(p) <= at + 1e-9 : c(p) >= at - 1e-9);
    const out = [];
    for (const pl of pls) {
      let cur = [];
      for (let i = 0; i < pl.length; i++) {
        const p = pl[i];
        if (i > 0) {
          const q = pl[i - 1];
          if (inside(q) !== inside(p) && c(p) !== c(q)) {
            const t = (at - c(q)) / (c(p) - c(q));
            const x = [q[0] + (p[0] - q[0]) * t, q[1] + (p[1] - q[1]) * t];
            if (inside(q)) { cur.push(x); out.push(cur); cur = []; } else cur = [x];
          }
        }
        if (inside(p)) cur.push(p.slice());
      }
      if (cur.length) out.push(cur);
    }
    return out.filter((r) => r.length >= 2 && plen(r) > 0.05);
  }

  return {
    /* geometri */
    resample, joinStrokes, rdp, simplify, analyze, classify, SHAPE_NAME,
    /* template & mutu */
    makeTemplate, quality,
    /* pemeriksa */
    checkShape, checkArea, checkPerimeter, checkPath, pathProgress, checkTrace, checkPattern, strokesInBox,
    checkFraction, checkFill, regionOutline, regionMasks, fillFromSeeds, partAt,
    /* transformasi */
    translate, rotate90, rotate, reflect, clipHalf,
    RIGHT_TOL, PARALLEL_TOL,
  };
})();

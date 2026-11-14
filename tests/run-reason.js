/* Uji Tantangan Nalar, jalankan: node tests/run-reason.js
   Kriteria GAME-DESIGN §16 no. 13–19 + kelengkapan data 8 teka-teki. Mandiri (tidak dipanggil run.js). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

/* makeEnv dari run.js; uji bawaan run.js ikut berjalan saat require, keluarannya dibungkam */
const log = console.log;
console.log = () => {};
let makeEnv;
try { ({ makeEnv } = require("./run.js")); } finally { console.log = log; }

const { KA } = makeEnv();
{
  /* muat reason.js & puzzles.js ke konteks yang berbagi objek KA yang sama */
  const ctx = { console, Math, Date, JSON, Uint8Array, Uint8ClampedArray, Map, Set, KA, navigator: {} };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["reason.js", "puzzles.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
  }
}
const R = KA.reason, P = KA.puzzles;

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "\n      " + detail : "")); }
}

/* ---------------- fixture ---------------- */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const dens = (pl, step = 0.7) => {
  const o = [];
  for (let i = 0; i < pl.length - 1; i++) {
    const [a, b] = pl[i], [c, d] = pl[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / step));
    for (let k = 0; k < n; k++) o.push([a + ((c - a) * k) / n, b + ((d - b) * k) / n]);
  }
  o.push(pl[pl.length - 1]);
  return o;
};
/* tangan bergetar sedang (sama dengan uji gambar): geser pelan ±1,5 + getar 0,3 */
function trem(pl, seed, drift = 1.5, shake = 0.3) {
  const r = rng(seed);
  let ox = 0, oy = 0;
  return dens(pl).map(([x, y]) => {
    ox = Math.max(-drift, Math.min(drift, ox + (r() - 0.5) * 0.4));
    oy = Math.max(-drift, Math.min(drift, oy + (r() - 0.5) * 0.4));
    return [x + ox + (r() - 0.5) * shake, y + oy + (r() - 0.5) * shake];
  });
}
const S = (...pls) => pls.map((p) => ({ pts: p }));
const perfectS = (pls) => pls.map((p) => ({ pts: dens(p, 0.5) }));
const tremS = (pls, seed) => pls.map((p, i) => ({ pts: trem(p, seed * 7 + i) }));
const closeP = (p) => p.concat([p[0]]);
const cell = (i, j) => [10 + 8 * i, 10 + 8 * j];
const cc = (pts) => closeP(pts.map(([i, j]) => cell(i, j)));
const GOPT = { grid: 8, origin: [10, 10] };
const words = (s) => String(s).trim().split(/\s+/).length;
const reasons = new Set();
const note = (r) => { if (r && r.reason) reasons.add(r.reason); return r; };
const step = (pid, i) => P.get(pid).steps[i];
const run = (pid, i, input) => note(step(pid, i).check(input));

/* coretan: zigzag, spiral, lingkaran konsentris, kisi, jalan acak */
function scribbles() {
  const out = [];
  for (const sp of [4, 6, 10]) {
    const h = [], v = [];
    for (let y = 4; y <= 96; y += sp) h.push([4, y], [96, y + sp / 2]);
    for (let x = 4; x <= 96; x += sp) v.push([x, 4], [x + sp / 2, 96]);
    out.push([`zigzag mendatar ${sp}`, S(dens(h))], [`zigzag tegak ${sp}`, S(dens(v))], [`zigzag silang ${sp}`, S(dens(h), dens(v))]);
    const sp2 = [];
    for (let th = 0; ; th += 0.05) { const r = (sp * th) / (2 * Math.PI); if (r > 46) break; sp2.push([50 + Math.cos(th) * r, 50 + Math.sin(th) * r]); }
    out.push([`spiral ${sp}`, S(dens(sp2))]);
    const rings = [];
    for (let r = sp / 2; r <= 46; r += sp) { const c = []; for (let i = 0; i <= 64; i++) c.push([50 + Math.cos((i / 64) * 6.2832) * r, 50 + Math.sin((i / 64) * 6.2832) * r]); rings.push(dens(c)); }
    out.push([`lingkaran konsentris ${sp}`, S(...rings)]);
    const g = [];
    for (let k = 4; k <= 96; k += sp) { g.push(dens([[4, k], [96, k]])); g.push(dens([[k, 4], [k, 96]])); }
    out.push([`kisi ${sp}`, S(...g)]);
  }
  for (const [seed, len] of [[1, 600], [2, 2000], [3, 6000]]) {
    const r = rng(seed);
    let x = 50, y = 50, a = r() * 6.28;
    const p = [[x, y]];
    for (let d = 0; d < len; d += 0.8) {
      a += (r() - 0.5) * 0.9; x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.8;
      if (x < 4 || x > 96) { a = Math.PI - a; x = Math.max(4, Math.min(96, x)); }
      if (y < 4 || y > 96) { a = -a; y = Math.max(4, Math.min(96, y)); }
      p.push([x, y]);
    }
    out.push([`jalan acak ${len}`, S(p)]);
  }
  /* coretan kecil yang menutupi tiap kotak/area tengah */
  const small = [];
  for (let k = 0; k < 14; k++) small.push([20 + (k % 2) * 60, 20 + k * 4.5]);
  out.push(["zigzag tengah", S(dens(small))]);
  return out;
}
const SCRIBBLES = scribbles();

/* ===================================================================== */
console.log("\n[13] Penilai sifat bangun");
{
  const tri = closeP([[30, 70], [50, 30], [72, 68]]);
  let ok3 = 0;
  for (let s = 1; s <= 6; s++) if (R.analyze(S(trem(tri, s))).sides === 3) ok3++;
  check("segitiga bergetar (tanpa kisi) → 3 sisi, 6/6", ok3 === 6, `${ok3}/6`);
  const triG = cc([[2, 7], [5, 2], [8, 7]]);
  check("segitiga bergetar di kisi lulus soal '3 sisi, 3 sudut'",
    [1, 2, 3].every((s) => run("bangun", 0, { strokes: tremS([triG], s) }).ok));
  check("segitiga dari 3 goresan terpisah dikenali", R.analyze(S(dens([[30, 70], [50, 30]]), dens([[50.5, 30.5], [72, 68]]), dens([[72.5, 68], [30.5, 70]]))).sides === 3);

  const sq = cc([[2, 2], [6, 2], [6, 6], [2, 6]]);
  const kinds = [1, 2, 3, 4].map((s) => R.analyze(tremS([sq], s), GOPT));
  check("persegi 4×4 kotak bergetar → 'square', sisi 4 kotak", kinds.every((a) => a.kind === "square" && a.sideLens.every((l) => l === 4)),
    kinds.map((a) => a.kind + " " + a.sideLens.join("/")).join("; "));
  check("persegi 4×4 lulus soal persegi", [1, 2, 3].every((s) => run("bangun", 1, { strokes: tremS([sq], s) }).ok));
  check("persegi tanpa kisi → 'square'", R.classify(S(trem(closeP([[26, 26], [58, 26], [58, 58], [26, 58]]), 9))) === "square");

  const par = cc([[2, 3], [6, 3], [8, 7], [4, 7]]);
  const pa = R.analyze(tremS([par], 2), GOPT);
  check("jajargenjang: 0 sudut siku, 2 pasang sejajar", pa.rightAngles === 0 && pa.parallelPairs === 2 && pa.sides === 4,
    `siku ${pa.rightAngles}, sejajar ${pa.parallelPairs}`);
  const paFree = R.analyze(S(trem(closeP([[18, 26], [50, 26], [66, 50], [34, 50]]), 3)));
  check("jajargenjang tanpa kisi: tidak bersudut siku", paFree.rightAngles === 0 && paFree.kind === null);
  check("jajargenjang lulus soal ketiga", [1, 2, 3].every((s) => run("bangun", 2, { strokes: tremS([par], s) }).ok));
  const rSq3 = run("bangun", 2, { strokes: tremS([sq], 1) });
  check("persegi ditolak soal jajargenjang (ada sudut siku)", !rSq3.ok && /siku/.test(rSq3.reason), rSq3.reason);
  const rRect = run("bangun", 1, { strokes: tremS([cc([[1, 2], [7, 2], [7, 5], [1, 5]])], 1) });
  check("persegi panjang ditolak soal persegi", !rRect.ok && /sama panjang/.test(rRect.reason), rRect.reason);
  const pent = closeP([cell(5, 1), cell(8, 4), cell(7, 8), cell(3, 8), cell(2, 4)]);
  const rp = run("bangun", 1, { strokes: tremS([pent], 2) });
  check("segi lima ditolak soal segi empat: 'Sisinya ada 5, coba hitung lagi'", !rp.ok && rp.reason === "Sisinya ada 5, coba hitung lagi", rp.reason);
  const rp3 = run("bangun", 2, { strokes: tremS([pent], 3) });
  check("segi lima ditolak soal jajargenjang", !rp3.ok && /5/.test(rp3.reason), rp3.reason);
  const open = run("bangun", 0, { strokes: S(dens([cell(2, 7), cell(5, 2), cell(8, 7)])) });
  check("bangun tidak tertutup ditolak", !open.ok && /tertutup/.test(open.reason), open.reason);
}

console.log("\n[14] Luas Kotak");
{
  const rect = (w, h, i0 = 1, j0 = 1) => cc([[i0, j0], [i0 + w, j0], [i0 + w, j0 + h], [i0, j0 + h]]);
  const L1 = (pl, s) => run("luas", 0, { strokes: s ? tremS([pl], s) : perfectS([pl]) });
  check("3×4 dan 4×3 diterima", L1(rect(3, 4)).ok && L1(rect(4, 3), 2).ok);
  check("2×6 dan 6×2 diterima", L1(rect(2, 6), 1).ok && L1(rect(6, 2)).ok);
  const r33 = L1(rect(3, 3), 3), r25 = L1(rect(2, 5), 4);
  check("3×3 ditolak dengan alasan luas", !r33.ok && r33.reason === "Luasnya 9 kotak, perlu 12", r33.reason);
  check("2×5 ditolak dengan alasan luas", !r25.ok && r25.reason === "Luasnya 10 kotak, perlu 12", r25.reason);
  const first = L1(rect(3, 4), 5);
  const second = (pl) => run("luas", 1, { strokes: perfectS([pl]), prev: [first] });
  const same = second(rect(4, 3, 3, 3));
  check("jawaban kedua berukuran sama (4×3 setelah 3×4) tidak dihitung", !same.ok && /sama/.test(same.reason), same.reason);
  check("jawaban kedua 2×6 diterima", second(rect(2, 6)).ok);
  check("jajargenjang berluas 12 ditolak", !L1(cc([[1, 1], [5, 1], [7, 4], [3, 4]])).ok);
  const sumOne = P.summarize("luas", [first, null], 0);
  const sumTwo = P.summarize("luas", [first, second(rect(6, 2))], 0);
  check("bintang Luas Kotak: tanpa jawaban kedua 2, dengan jawaban kedua 3", P.stars(sumOne) === 2 && P.stars(sumTwo) === 3,
    `${P.stars(sumOne)} / ${P.stars(sumTwo)}`);
}

console.log("\n[15] Hitung Loncat & Peta Koordinat");
{
  for (const [pid, i, key] of [["loncat", 0, "8"], ["loncat", 1, "9"], ["koordinat", 0, "(3,5)"], ["koordinat", 1, "(7,2)"]]) {
    const st = step(pid, i);
    const T = st.targets.map((t) => [t.x, t.y]);
    const full = closeP(T);
    check(`${st.id}: urutan benar lulus (satu goresan)`, run(pid, i, { strokes: perfectS([full]) }).ok);
    check(`${st.id}: urutan benar lulus (bergetar, per ruas)`,
      run(pid, i, { strokes: full.slice(0, -1).map((p, k) => ({ pts: trem([p, full[k + 1]], 50 + k) })) }).ok);
    const k = st.targets.findIndex((t) => String(t.label) === key);
    const skip = closeP(T.filter((_, j) => j !== k));
    const rs = run(pid, i, { strokes: perfectS([skip]) });
    check(`${st.id}: melompati ${key} gagal, alasan menyebut ${key}`, !rs.ok && rs.reason.includes(key), rs.reason);
    const d = st.decoys[0];
    const viaDecoy = closeP(T.slice(0, 2).concat([[d.x, d.y]], T.slice(2)));
    const rd = run(pid, i, { strokes: perfectS([viaDecoy]) });
    check(`${st.id}: menyinggahi pengecoh ${d.label} gagal, alasan menyebutnya`, !rd.ok && rd.reason.includes(String(d.label)), rd.reason);
    const rev = run(pid, i, { strokes: perfectS([closeP(T.slice().reverse())]) });
    check(`${st.id}: urutan terbalik gagal`, !rev.ok, rev.reason);
    const lift = T.slice(0, 3).map((p) => p);
    const rl = run(pid, i, { strokes: perfectS([lift, closeP(T).slice(3)]) });
    check(`${st.id}: ruas yang tidak digambar gagal ('Sambungkan')`, !rl.ok && /Sambungkan/.test(rl.reason), rl.reason);
    const nd = P.nextDot(st, perfectS([T.slice(0, 4)]));
    check(`${st.id}: nextDot menyorot titik ke-5`, nd && nd.label === st.targets[4].label, nd && nd.label);
  }
  const st = step("koordinat", 0);
  check("Peta Koordinat: pengecoh = koordinat tertukar", st.decoys.length >= 3 && st.decoys.every((d) => /^\(\d+,\d+\)$/.test(d.label)));
  const off = st.targets.map((t) => [t.x + 0.28 * 8, t.y - 0.25 * 8]); // 0,375 kotak
  check("simpangan ≤0,4 kotak tetap lulus", run("koordinat", 0, { strokes: perfectS([closeP(off)]) }).ok);
  const far = st.targets.map((t, j) => (j === 3 ? [t.x + 0.7 * 8, t.y] : [t.x, t.y]));
  check("simpangan 0,7 kotak gagal", !run("koordinat", 0, { strokes: perfectS([closeP(far)]) }).ok);
}

console.log("\n[16] Pecahan Warna");
{
  const sp = step("pecahan", 0), sc = step("pecahan", 1);
  const seedsS = [0, 1, 2, 3].map((k) => sp.answer.fills[k] || null);
  const seedAt = (spec, k) => {
    const n = spec.kind === "sectors" ? spec.n : spec.cols * spec.rows;
    for (let y = 1; y < 100; y += 1) for (let x = 1; x < 100; x += 1) if (R.partAt(spec, x, y) === k && R.partAt(spec, x + 2, y + 2) === k && R.partAt(spec, x - 2, y - 2) === k) return { x, y };
    return null;
  };
  const allSeeds = (spec, n) => Array.from({ length: n }, (_, k) => seedAt(spec, k));
  const S4 = allSeeds(sp.regions, 4), S6 = allSeeds(sc.regions, 6);
  const combos = (n, k) => { const o = []; const rec = (s, a) => { if (a.length === k) { o.push(a); return; } for (let i = s; i < n; i++) rec(i + 1, a.concat(i)); }; rec(0, []); return o; };
  const c34 = combos(4, 3).map((c) => run("pecahan", 0, { fills: c.map((k) => S4[k]) }));
  check("3/4: keempat kombinasi 3 juring diterima", c34.every((r) => r.ok), c34.map((r) => r.reason).join("; "));
  const c24 = combos(4, 2).map((c) => run("pecahan", 0, { fills: c.map((k) => S4[k]) }));
  check("2/4 ditolak, alasan 'Baru 2/4 yang berwarna'", c24.every((r) => !r.ok && r.reason === "Baru 2/4 yang berwarna"), c24[0].reason);
  check("4/4 ditolak", !run("pecahan", 0, { fills: S4 }).ok);
  const c46 = combos(6, 4).map((c) => run("pecahan", 1, { fills: c.map((k) => S6[k]) }));
  check("2/3: semua 15 kombinasi 4 petak diterima", c46.every((r) => r.ok));
  const c36 = combos(6, 3).map((c) => run("pecahan", 1, { fills: c.map((k) => S6[k]) }));
  check("3 petak ditolak untuk 2/3", c36.every((r) => !r.ok), c36[0].reason);
  check("mengisi juring yang sama dua kali tidak dihitung dua", !run("pecahan", 0, { fills: [S4[0], S4[0], S4[1]] }).ok);
  const outside = run("pecahan", 0, { fills: [S4[0], S4[1], S4[2], { x: 3, y: 3 }] });
  check("mengecat di luar bangun ditolak", !outside.ok && /di dalam/.test(outside.reason), outside.reason);
  check("benih contoh jawaban lolos", run("pecahan", 0, { fills: sp.answer.fills }).ok && run("pecahan", 1, { fills: sc.answer.fills }).ok);
  void seedsS;
}

console.log("\n[17] Geser dan Putar");
{
  for (const i of [0, 1]) {
    const st = step("geser", i);
    check(`${st.id}: jiplakan sempurna hasil transformasi lulus`, run("geser", i, { strokes: perfectS(st.answer.polylines) }).ok);
    check(`${st.id}: jiplakan bergetar lulus`, [1, 2, 3].every((s) => run("geser", i, { strokes: tremS(st.answer.polylines, s) }).ok));
    const orig = run("geser", i, { strokes: perfectS(st.view.template) });
    check(`${st.id}: gambar di posisi awal tidak lulus`, !orig.ok && /Belum (digeser|diputar)/.test(orig.reason), orig.reason);
  }
  const st = step("geser", 1);
  const ccw = R.rotate90(st.view.template, st.view.pivot.x, st.view.pivot.y, false);
  const rc = run("geser", 1, { strokes: perfectS(ccw) });
  check("putar berlawanan arah tidak lulus", !rc.ok && /sebaliknya/.test(rc.reason), rc.reason);
  const g2 = R.translate(step("geser", 0).view.template, 16, 0);
  const rg = run("geser", 0, { strokes: perfectS(g2) });
  check("geser 2 kotak tidak lulus", !rg.ok, rg.reason);
  const sq = [[0, 0], [10, 0]];
  check("rotate90 searah jarum jam: kanan → bawah", JSON.stringify(R.rotate90([sq], 0, 0, true)[0][1]) === "[0,10]");
}

console.log("\n[18] Pola Berulang: pengenal bentuk");
{
  const box = { x: 20, y: 20, w: 40, h: 40 };
  const circle = []; for (let i = 0; i <= 40; i++) circle.push([40 + Math.cos((i / 40) * 6.2832) * 14, 40 + Math.sin((i / 40) * 6.2832) * 14]);
  const oval = []; for (let i = 0; i <= 40; i++) oval.push([40 + Math.cos((i / 40) * 6.2832) * 16, 40 + Math.sin((i / 40) * 6.2832) * 13]);
  const tri = closeP([[40, 25], [55, 53], [25, 53]]);
  const sq = closeP([[27, 27], [53, 27], [53, 53], [27, 53]]);
  const cases = [["circle", circle], ["circle", oval], ["triangle", tri], ["square", sq]];
  const bad = [];
  for (const [k, pl] of cases) for (let s = 1; s <= 5; s++) {
    const got = R.classify(S(trem(pl, s * 3)));
    if (got !== k) bad.push(`${k}#${s}→${got}`);
  }
  check("lingkaran, segitiga, persegi bergetar dikenali (5 benih)", !bad.length, bad.join(", "));
  const small = [];
  for (const [k, pl] of cases) for (let s = 1; s <= 3; s++) {
    const sm = pl.map(([x, y]) => [x * 0.55 + 10, y * 0.55 + 10]);
    const got = R.classify(S(trem(sm, s, 1, 0.3)));
    if (got !== k) small.push(`${k}#${s}→${got}`);
  }
  check("bentuk kecil (±15 satuan) juga dikenali", !small.length, small.join(", "));
  const hex = closeP([0, 1, 2, 3, 4, 5].map((k) => [50 + 20 * Math.cos((k * Math.PI) / 3), 50 + 20 * Math.sin((k * Math.PI) / 3)]));
  const pent = closeP([0, 1, 2, 3, 4].map((k) => [50 + 20 * Math.cos(-Math.PI / 2 + (k * 2 * Math.PI) / 5), 50 + 20 * Math.sin(-Math.PI / 2 + (k * 2 * Math.PI) / 5)]));
  check("segi lima & segi enam bukan lingkaran", R.classify(S(trem(pent, 1))) !== "circle" && R.classify(S(trem(hex, 1))) !== "circle");
  const scrib = SCRIBBLES.filter(([, s]) => R.classify(s) !== null).map(([n, s]) => `${n}→${R.classify(s)}`);
  check("coretan tidak dikenali sebagai bentuk apa pun", !scrib.length, scrib.join(", "));
  const zz = []; for (let k = 0; k < 10; k++) zz.push([22 + (k % 2) * 36, 22 + k * 4]);
  const loopy = []; for (let t = 0; t < 30; t += 0.1) loopy.push([40 + Math.cos(t) * 14 + Math.cos(t * 7) * 4, 40 + Math.sin(t) * 14 + Math.sin(t * 5) * 4]);
  check("coretan dalam kotak tidak dikenali", R.classify(S(dens(zz))) === null && R.classify(S(loopy)) === null,
    `${R.classify(S(dens(zz)))} / ${R.classify(S(loopy))}`);
  check("bentuk kosong → null", R.classify([]) === null);
  void box;
  for (const i of [0, 1]) {
    const st = step("pola", i);
    check(`${st.id}: jawaban bergetar lulus`, [1, 2, 3].every((s) => run("pola", i, { strokes: tremS(st.answer.polylines, s) }).ok));
    const swapped = run("pola", i, { strokes: perfectS(st.answer.polylines.slice().reverse().map((pl, k) => {
      const from = st.blanks[1 - k], to = st.blanks[k];
      return pl.map(([x, y]) => [x - from.x + to.x, y - from.y + to.y]);
    })) });
    check(`${st.id}: bentuk tertukar ditolak, alasan menyebut kotak`, !swapped.ok && /Kotak \d/.test(swapped.reason), swapped.reason);
    const one = run("pola", i, { strokes: perfectS([st.answer.polylines[0]]) });
    check(`${st.id}: kotak kedua kosong ditolak`, !one.ok && /Kotak 2 masih kosong/.test(one.reason), one.reason);
  }
}

console.log("\n[19] Coretan tidak pernah lulus di level Nalar");
{
  const leaks = [];
  for (const pz of P.list) pz.steps.forEach((st, i) => {
    if (st.input === "fill") {
      const sp = st.regions;
      const grid = []; for (let y = 3; y < 100; y += 6) for (let x = 3; x < 100; x += 6) grid.push({ x, y });
      const inside = grid.filter((p) => R.partAt(sp, p.x, p.y) >= 0);
      for (const [name, fills] of [["isi semua", inside], ["ketuk di mana-mana", grid], ["kosong", []]]) {
        const r = note(st.check({ fills }));
        if (r.ok) leaks.push(`${st.id} ${name}`);
      }
      return;
    }
    const prev = st.bonus === "second" ? [pz.steps[0].check({ strokes: perfectS(pz.steps[0].answer.polylines) })] : [];
    for (const [name, strokes] of SCRIBBLES) {
      const r = note(st.check({ strokes, prev }));
      if (r.ok) leaks.push(`${st.id} ${name}`);
    }
  });
  check("tidak ada coretan yang lulus di 8 teka-teki", !leaks.length, leaks.slice(0, 10).join(", "));
}

console.log("\n[+] Kelengkapan data 10 teka-teki");
{
  const L = P.list;
  const want = [["bangun", 1, 4], ["lipat", 1, 8], ["loncat", 2, 4], ["pola", 2, 8], ["koordinat", 3, 4], ["geser", 3, 8], ["pecahan", 4, 4], ["luas", 4, 8], ["putar", 5, 4], ["keliling", 5, 8]];
  check("10 teka-teki di pulau & posisi yang benar", L.length === 10 && want.every(([id, isl, pos]) => { const p = P.at(isl, pos); return p && p.id === id; }));
  const ANIMS = ["twinkle", "beat", "pop", "spin", "fly", "sway", "swim", "scuttle", "flap", "crawl", "drive", "launch", "float", "rock", "hop"];
  const probs = [];
  for (const pz of L) {
    if (!pz.name || !pz.topic || !ANIMS.includes(pz.anim)) probs.push(`${pz.id}: name/topic/anim`);
    if (!pz.steps.length) probs.push(`${pz.id}: tanpa langkah`);
    pz.steps.forEach((st, i) => {
      const tag = `${pz.id}#${i + 1}`;
      if (!st.id || !st.text || !st.task || !st.view || !st.answer) probs.push(`${tag}: bidang wajib`);
      if (words(st.text) < 2 || words(st.text) > 6) probs.push(`${tag}: teks Noko ${words(st.text)} kata`);
      if (st.anim && !ANIMS.includes(st.anim)) probs.push(`${tag}: anim`);
      if (!["draw", "fill"].includes(st.input)) probs.push(`${tag}: input`);
      if (typeof st.check !== "function") probs.push(`${tag}: check`);
      if (!Array.isArray(st.hints) || st.hints.length !== 3 || st.hints.some((h, k) => h.level !== k + 1 || !h.text)) probs.push(`${tag}: 3 petunjuk`);
      else {
        if (st.hints.some((h) => words(h.text) > 6 || words(h.text) < 2)) probs.push(`${tag}: panjang petunjuk`);
        if (!st.hints[1].show || !st.hints[2].show) probs.push(`${tag}: petunjuk visual/sebagian`);
      }
      /* jawaban contoh lulus pemeriksanya sendiri */
      const prev = st.bonus === "second" ? [pz.steps[0].check({ strokes: perfectS(pz.steps[0].answer.polylines) })] : [];
      const r = st.input === "fill" ? st.check({ fills: st.answer.fills }) : st.check({ strokes: perfectS(st.answer.polylines), prev });
      if (!r.ok) probs.push(`${tag}: jawaban contoh gagal (${r.reason})`);
      const pts = []
        .concat(st.answer.polylines ? st.answer.polylines.flat() : [])
        .concat(st.view.template ? st.view.template.flat() : [])
        .concat(st.view.dots ? st.view.dots.map((d) => [d.x, d.y]) : []);
      if (pts.some(([x, y]) => !(x >= 4 && x <= 96 && y >= 4 && y <= 96))) probs.push(`${tag}: titik di luar kertas`);
    });
  }
  check("setiap langkah lengkap (teks, tampilan, jawaban, 3 petunjuk, check) & jawaban contoh lulus", !probs.length, probs.join("; "));

  /* jalur titik: pengecoh jauh dari jalur, titik lain tidak menempel di ruas */
  const segD = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const pathBad = [];
  for (const [pid, i] of [["loncat", 0], ["loncat", 1], ["koordinat", 0], ["koordinat", 1]]) {
    const st = step(pid, i);
    const T = st.targets, n = T.length;
    const segs = T.map((t, k) => [[t.x, t.y], [T[(k + 1) % n].x, T[(k + 1) % n].y], k]);
    for (const d of st.decoys) for (const [a, b] of segs) if (segD([d.x, d.y], a, b) < 3.2 * 2) pathBad.push(`${st.id}: pengecoh ${d.label}`);
    T.forEach((t, j) => segs.forEach(([a, b, k]) => {
      if (j === k || j === (k + 1) % n) return;
      if (segD([t.x, t.y], a, b) < 3.2 * 1.5) pathBad.push(`${st.id}: ${t.label} menempel ruas ${k}`);
    }));
  }
  check("data jalur aman (pengecoh & titik tidak menempel ruas)", !pathBad.length, pathBad.join("; "));
  const lip = P.get("lipat").steps;
  const symOk = lip.every((st) => {
    const ax = st.view.axis;
    const mir = R.reflect(st.answer.polylines, ax.dir, ax.at);
    const T = R.makeTemplate(st.view.template, 2);
    return KA.scoring.evaluate(T, mir.map((p) => ({ pts: dens(p, 0.5) }))).stars === 3;
  });
  check("Lipat Cermin: separuh hilang = cerminan separuh tampil (tegak lalu mendatar)", symOk && lip[0].view.axis.dir === "v" && lip[1].view.axis.dir === "h");
  check("Lipat Cermin: menjiplak separuh yang tampil tidak lulus", lip.every((st) => !st.check({ strokes: perfectS(st.view.template) }).ok));
  check("Lipat Cermin: separuh hilang bergetar lulus", lip.every((st) => [1, 2].every((s) => st.check({ strokes: tremS(st.answer.polylines, s) }).ok)));
  const lo = P.get("loncat").steps;
  check("Hitung Loncat: kelipatan 2 lalu kelipatan 3, dengan pengecoh bukan kelipatan",
    lo[0].targets.every((t, k) => t.label === 2 * (k + 1)) && lo[1].targets.every((t, k) => t.label === 3 * (k + 1)) &&
    lo[0].decoys.every((d) => d.label % 2) && lo[1].decoys.every((d) => d.label % 3) && lo.every((s) => s.decoys.length >= 2));
  const pc = P.get("pecahan").steps;
  check("Pecahan Warna: lingkaran 4 juring → 3/4, persegi panjang 6 petak → 2/3",
    pc[0].regions.kind === "sectors" && pc[0].regions.n === 4 && Math.abs(pc[0].target - 0.75) < 1e-9 &&
    pc[1].regions.cols * pc[1].regions.rows === 6 && Math.abs(pc[1].target - 2 / 3) < 1e-9);
}

console.log("\n[+] Bintang Nalar (§6a) & alasan Noko");
{
  const s = P.stars;
  check("salah → 0 bintang, serapi apa pun", s({ correct: false, quality: 1 }) === 0);
  check("benar dengan petunjuk → 1", s({ correct: true, hintLevel: 2, quality: 1 }) === 1 && s({ correct: true, hintLevel: 1, secondAnswer: true }) === 1);
  check("benar tanpa petunjuk → 2; rapi (≥0,85) → 3", s({ correct: true, hintLevel: 0, quality: 0.8 }) === 2 && s({ correct: true, quality: 0.9 }) === 3);
  check("teka-teki tanpa gambar (pecahan) benar tanpa petunjuk → 3", s({ correct: true }) === 3);
  const sq = P.summarize("bangun", [0, 1, 2].map((i) => step("bangun", i).check({ strokes: perfectS(step("bangun", i).answer.polylines) })), 0);
  check("rangkuman: jiplakan rapi semua soal → 3 bintang", sq.correct && s(sq) === 3, JSON.stringify(sq));
  const partial = P.summarize("bangun", [step("bangun", 0).check({ strokes: perfectS(step("bangun", 0).answer.polylines) }), null, null], 0);
  check("rangkuman: soal belum selesai → 0 bintang", s(partial) === 0);
  const long = [...reasons].filter((r) => words(r) < 2 || words(r) > 6);
  check(`alasan Noko 2–6 kata (${reasons.size} alasan berbeda)`, !long.length, long.join(" | "));
}

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exitCode = fail ? 1 : 0;

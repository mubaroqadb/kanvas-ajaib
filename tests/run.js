/* Uji penerimaan Kanvas Ajaib: jalankan: node tests/run.js
   Memuat modul game di sandbox vm (tanpa browser) dan memeriksa kriteria di GAME-DESIGN.md §15. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JS = path.join(__dirname, "..", "js");

function makeEnv(store = {}) {
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const ctx = { console, Math, Date, JSON, Uint8Array, Uint8ClampedArray, Map, Set, localStorage, navigator: {} };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["storage.js", "levels.js", "scoring.js", "economy.js", "art.js"]) {
    const p = path.join(JS, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
  }
  return { KA: ctx.KA, store };
}

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "\n      " + detail : "")); }
}

/* ---------- fixture goresan ---------- */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const dens = (pl, step = 0.5) => {
  const o = [];
  for (let i = 0; i < pl.length - 1; i++) {
    const [a, b] = pl[i], [c, d] = pl[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / step));
    for (let k = 0; k < n; k++) o.push([a + ((c - a) * k) / n, b + ((d - b) * k) / n]);
  }
  o.push(pl[pl.length - 1]);
  return o;
};
const mirror = (p) => p.map(([x, y]) => [100 - x, y]);

function perfect(lv, KA) {
  if (lv.mode === "cermin") return lv._half.map((p) => dens(p)).flatMap((p) => [p, mirror(p)]);
  return lv._polylines.map((p) => dens(p));
}

/* tangan bergetar sedang: geser pelan ±drift + getar kecil */
function tremor(lv, seed, drift = 1.5, shake = 0.3) {
  const r = rng(seed);
  const base = lv.mode === "cermin" ? lv._half : lv._polylines;
  const strokes = base.map((pl) => {
    let ox = 0, oy = 0;
    return dens(pl, 0.7).map(([x, y]) => {
      ox = Math.max(-drift, Math.min(drift, ox + (r() - 0.5) * 0.4));
      oy = Math.max(-drift, Math.min(drift, oy + (r() - 0.5) * 0.4));
      return [x + ox + (r() - 0.5) * shake, y + oy + (r() - 0.5) * shake];
    });
  });
  return lv.mode === "cermin" ? strokes.flatMap((p) => [p, mirror(p)]) : strokes;
}

function zigzags(spacing) {
  const h = [], v = [], d = [];
  for (let y = 4; y <= 96; y += spacing) h.push([4, y], [96, y + spacing / 2]);
  for (let x = 4; x <= 96; x += spacing) v.push([x, 4], [x + spacing / 2, 96]);
  for (let k = -96; k <= 96; k += spacing) d.push([Math.max(4, k), Math.max(4, -k)], [Math.min(96, 100 + k), Math.min(96, 100 - k)]);
  return [[dens(h)], [dens(v)], [dens(h), dens(v)], [dens(d)]];
}

/* ===================================================================== */
const { KA } = makeEnv();
const L = KA.levels, S = KA.scoring;
const ev = (lv, strokes, opts) => S.evaluate(lv, strokes.map((p) => ({ pts: p })), opts);

console.log("\n[1] Coretan menutupi kanvas → 0 bintang di semua level");
{
  let worst = { score: -1 };
  for (const lv of L.drawingLevels()) {
    for (const sp of [3, 4, 5, 6, 8, 10, 12]) {
      for (const z of zigzags(sp)) {
        const r = ev(lv, z);
        if (r.score > worst.score) worst = { score: r.score, lv: lv.name, sp, r };
      }
    }
  }
  check("skor coretan tertinggi < 550", worst.score < 550,
    `terburuk: ${worst.lv} jarak ${worst.sp} → ${worst.score} (tepat ${worst.r.acc}, lengkap ${worst.r.comp}, rapi ${worst.r.neat})`);
  console.log(`      (coretan terburuk: ${worst.lv}, jarak ${worst.sp}, skor ${worst.score})`);
}

console.log("\n[2] Jiplakan sempurna → 3 bintang di semua level");
{
  const bad = L.drawingLevels().map((lv) => [lv, ev(lv, perfect(lv))]).filter(([, r]) => r.stars < 3);
  check(`${L.drawingLevels().length}/${L.drawingLevels().length} level gambar 3 bintang`, !bad.length, bad.map(([lv, r]) => `${lv.name}(${lv.mode}) ${r.score}`).join(", "));
}

console.log("\n[3] Getaran tangan sedang → ≥2 bintang");
{
  const bad = [];
  let min = 1001;
  for (const lv of L.drawingLevels()) for (const seed of [1, 2, 3]) {
    const r = ev(lv, tremor(lv, lv.id * 10 + seed));
    min = Math.min(min, r.score);
    if (r.stars < 2) bad.push(`${lv.name} ${r.score} (t${r.acc} l${r.comp} r${r.neat} h${r.smooth})`);
  }
  check("semua level ≥2 bintang", !bad.length, bad.slice(0, 6).join(", "));
  console.log(`      (skor minimum ${min})`);
}

console.log("\n[4] Hanya separuh panjang template → ≤1 bintang");
{
  const bad = [];
  for (const lv of L.drawingLevels()) {
    const parts = lv._polylines.map((p) => dens(p));
    const half = [];
    let len = 0;
    for (const pl of parts) {
      const pts = [];
      for (let i = 0; i < pl.length; i++) {
        if (i) len += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
        if (len > lv._totalLen / 2) break;
        pts.push(pl[i]);
      }
      if (pts.length > 1) half.push(pts);
      if (len > lv._totalLen / 2) break;
    }
    const r = ev(lv, half);
    if (r.stars > 1) bad.push(`${lv.name} ${r.score}`);
  }
  check("semua level ≤1 bintang", !bad.length, bad.join(", "));
}

console.log("\n[5] Menebalkan bolak-balik 4× → Kerapian < 50");
{
  const bad = [];
  for (const lv of L.drawingLevels()) {
    const once = perfect(lv);
    const four = [];
    for (let k = 0; k < 4; k++) for (const p of once) four.push(k % 2 ? [...p].reverse() : p);
    const r = ev(lv, four);
    if (r.neat >= 50) bad.push(`${lv.name} ${r.neat}`);
  }
  check("Kerapian < 50 di semua level", !bad.length, bad.join(", "));
}

console.log("\n[6] Mode Cermin");
{
  const cer = L.drawingLevels().filter((l) => l.mode === "cermin");
  const asym = cer.filter((l) => !L.isSymmetric(l));
  check(`${cer.length} level Cermin semuanya simetris`, !asym.length, asym.map((l) => l.name).join(", "));
  const badHalf = [];
  for (const lv of cer) {
    for (const pl of lv._half) for (const [x, y] of dens(pl, 0.5)) {
      if (x > 50.0001 || S.distT(lv, x, y, 5) > 0.8) { badHalf.push(`${lv.name} (${x.toFixed(1)},${y.toFixed(1)})`); break; }
    }
  }
  check("template separuh tanpa titik palsu & tetap di kiri", !badHalf.length, badHalf.join(", "));
  const notThree = cer.map((lv) => [lv, ev(lv, perfect(lv))]).filter(([, r]) => r.stars < 3);
  check("jiplak separuh kiri (dicerminkan) → 3 bintang", !notThree.length, notThree.map(([l, r]) => `${l.name} ${r.score}`).join(", "));
}

console.log("\n[7] Duel Hantu");
{
  const bad = [];
  for (const lv of L.drawingLevels().filter((l) => l.boss)) {
    const target = L.island(lv.island).ghostTarget;
    const g1 = S.makeGhost(lv, target), g2 = S.makeGhost(lv, target);
    if (Math.abs(g1.score - target) > 40) bad.push(`${lv.name}: ${g1.score} vs target ${target}`);
    if (g1.score !== g2.score) bad.push(`${lv.name}: tidak deterministik`);
    console.log(`      ${lv.name}: target ${target} → hantu ${g1.score}`);
  }
  check("skor hantu ±40 dari target & deterministik", !bad.length, bad.join("; "));
}

console.log("\n[11] Mode Bantu");
{
  const bad = [];
  for (const lv of L.drawingLevels()) {
    const rPerf = ev(lv, perfect(lv), { tolMul: 1.5, assisted: true });
    if (rPerf.stars > 2) bad.push(`${lv.name}: bantu ${rPerf.stars} bintang`);
    const r = ev(lv, tremor(lv, lv.id, 3.5, 0.6), { tolMul: 1.5, assisted: true });
    if (r.core >= 0.6 && r.stars < 1) bad.push(`${lv.name}: jujur tapi 0 bintang`);
  }
  check("maks 2 bintang dan jujur dijamin 1 bintang", !bad.length, bad.slice(0, 6).join("; "));
}

console.log("\n[+] Data level");
{
  const ids = L.list.map((l) => l.id);
  check("55 arena, id 1..55 unik", ids.length === 55 && new Set(ids).size === 55 && Math.max(...ids) === 55);
  check("45 level gambar + 10 Nalar di posisi 4 & 8, boss di posisi 11",
    L.drawingLevels().length === 45 && L.list.filter((l) => l.mode === "nalar").every((l) => (l.pos === 4 || l.pos === 8) && l.puzzleId && !l._pts) &&
    L.list.filter((l) => l.boss).every((l) => l.pos === 11));
  check("setiap level punya mode & animasi", L.list.every((l) => l.mode && l.anim));
  check("nama lama terpetakan semua", L.OLD_ORDER.every((n) => L.byName(n)));
  check("setiap level Titik punya ≥3 titik per bagian",
    L.drawingLevels().filter((l) => l.mode === "titik").every((l) => l._polylines.every((_, i) => l._dots.filter((d) => d.part === i).length >= 3)));
}

module.exports = { makeEnv, check, perfect, tremor, dens, get result() { return { pass, fail }; } };

if (require.main === module) {
  const more = path.join(__dirname, "run-state.js");
  if (fs.existsSync(more)) require(more);
  const r = module.exports.result;
  console.log(`\n${r.pass} lulus, ${r.fail} gagal`);
  process.exitCode = r.fail ? 1 : 0;
}

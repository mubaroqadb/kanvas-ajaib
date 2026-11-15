/* Uji penilai bentuk Nalar terhadap gambar pena/jari sungguhan: getaran, bergeser dari kisi, sisi terpisah.
   Jalankan: node tests/run-pena.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ctx = { console, Math, Uint8Array, Uint8ClampedArray, Map, Set, JSON };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ["levels.js", "scoring.js", "art.js", "reason.js", "puzzles.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx, { filename: f });
}
const R = ctx.KA.reason;

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "\n      " + detail : "")); }
}

const G = 8, O = 10, OPT = { grid: G, origin: [O, O] };
const c = (i, j) => [O + G * i, O + G * j];
let sd = 5;
const r = () => { sd ^= sd << 13; sd >>>= 0; sd ^= sd >>> 17; sd ^= sd << 5; sd >>>= 0; return sd / 4294967296; };
/* titik tiap 0,6 satuan (jarak minimum engine) dengan getaran ±sh/2 */
function seg(a, b, sh) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.6);
  const o = [];
  for (let k = 0; k <= n; k++) o.push([a[0] + ((b[0] - a[0]) * k) / n + (r() - 0.5) * sh, a[1] + ((b[1] - a[1]) * k) / n + (r() - 0.5) * sh]);
  return o;
}
const off = (p, dx, dy) => [p[0] + dx, p[1] + dy];
/* satu goresan mengelilingi bangun */
const one = (vs, dx = 0, dy = 0, sh = 0.3) => {
  const pts = [];
  vs.concat([vs[0]]).forEach((p, i, arr) => { if (i) pts.push(...seg(off(arr[i - 1], dx, dy), off(p, dx, dy), sh)); });
  return [{ pts }];
};
/* tiap sisi goresan sendiri; gap > 0 = berhenti sebelum sudut, over > 0 = lewat sudut */
const sides = (vs, gap, over, dx = 0, dy = 0, sh = 0.3) => vs.map((a, i) => {
  const b = vs[(i + 1) % vs.length];
  const ux = b[0] - a[0], uy = b[1] - a[1], e = (over - gap) / Math.hypot(ux, uy);
  return { pts: seg(off([a[0] - ux * e, a[1] - uy * e], dx, dy), off([b[0] + ux * e, b[1] + uy * e], dx, dy), sh) };
});

const BANGUN = {
  persegi: { vs: [c(2, 2), c(6, 2), c(6, 6), c(2, 6)], spec: { sides: 4, equalSides: true, allRight: true } },
  "persegi besar": { vs: [c(1, 1), c(7, 1), c(7, 7), c(1, 7)], spec: { sides: 4, equalSides: true, allRight: true } },
  segitiga: { vs: [c(2, 7), c(5, 2), c(8, 7)], spec: { sides: 3 } },
  "persegi panjang": { vs: [c(1, 3), c(7, 3), c(7, 6), c(1, 6)], spec: { sides: 4, allRight: true, notEqual: true } },
};
const GAYA = [
  ["satu goresan rapi", (v) => one(v)],
  ["getar pena 0,4", (v) => one(v, 0, 0, 0.4)],
  ["getar 0,8", (v) => one(v, 0, 0, 0.8)],
  ["geser 3 dari kisi + getar", (v) => one(v, 3, 2, 0.5)],
  ["sisi terpisah, celah 4", (v) => sides(v, 4, 0)],
  ["sisi terpisah, lewat sudut 4", (v) => sides(v, 0, 4)],
  ["sisi terpisah, celah 3 + geser 2 + getar", (v) => sides(v, 3, 0, 2, 2, 0.6)],
];

console.log("\n[1] Gambar rapi dengan pena atau jari diterima");
for (const [nama, b] of Object.entries(BANGUN)) {
  const gagal = [];
  for (const [gaya, f] of GAYA) {
    const st = f(b.vs);
    const res = R.checkShape(st, b.spec, OPT);
    if (!res.ok) {
      const a = R.analyze(st, OPT);
      gagal.push(`${gaya}: ${res.reason} (fit ${a.fitErr.toFixed(3)}, tinta ${a.inkRatio.toFixed(2)}, sisi ${a.sides})`);
    }
  }
  check(`${nama}: ${GAYA.length} gaya menggambar lulus`, !gagal.length, gagal.join("; "));
}

console.log("\n[2] Luas dan keliling dengan sisi terpisah");
{
  const rc = [c(2, 2), c(5, 2), c(5, 6), c(2, 6)]; // 3 × 4
  const a = R.checkArea(sides(rc, 3, 0, 1, 1, 0.5), Object.assign({ area: 12 }, OPT));
  const p = R.checkPerimeter(sides(rc, 0, 3, 0, 0, 0.5), Object.assign({ perimeter: 14 }, OPT));
  check("luas 12 dari sisi terpisah diterima", a.ok, a.reason);
  check("keliling 14 dari sisi terpisah diterima", p.ok, p.reason);
}

console.log("\n[3] Coretan tetap ditolak");
{
  const lolos = [];
  for (const sp of [3, 5, 8]) {
    const z = [];
    for (let y = 14; y <= 70; y += sp) z.push([14, y], [62, y + sp / 2]);
    const pts = [];
    z.forEach((p, i) => { if (i) pts.push(...seg(z[i - 1], p, 0.3)); });
    for (const [nama, b] of Object.entries(BANGUN)) if (R.checkShape([{ pts }], b.spec, OPT).ok) lolos.push(`${nama} zigzag ${sp}`);
    const spiral = [];
    for (let t = 0; t < 40; t += 0.08) { const rr = (sp * t) / 6.283; if (rr > 26) break; spiral.push([42 + Math.cos(t) * rr, 42 + Math.sin(t) * rr]); }
    for (const [nama, b] of Object.entries(BANGUN)) if (R.checkShape([{ pts: spiral }], b.spec, OPT).ok) lolos.push(`${nama} spiral ${sp}`);
  }
  check("zigzag dan spiral tidak pernah lulus", !lolos.length, lolos.join(", "));
}

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exitCode = fail ? 1 : 0;

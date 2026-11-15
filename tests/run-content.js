/* Uji konten v3.2: Pulau 5, semua set soal Nalar, Tantangan Harian.
   Jalankan: node tests/run-content.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JS = path.join(__dirname, "..", "js");
function boot(store = {}) {
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const ctx = { console, Math, Date, JSON, Uint8Array, Uint8ClampedArray, Map, Set, localStorage, navigator: {} };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["storage.js", "levels.js", "scoring.js", "economy.js", "art.js", "reason.js", "puzzles.js"]) {
    vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), ctx, { filename: f });
  }
  ctx.KA.storage.init();
  return ctx.KA;
}

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "\n      " + detail : "")); }
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const dens = (pl, step = 0.6) => {
  const o = [];
  for (let i = 0; i < pl.length - 1; i++) {
    const [a, b] = pl[i], [c, d] = pl[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(c - a, d - b) / step));
    for (let k = 0; k < n; k++) o.push([a + ((c - a) * k) / n, b + ((d - b) * k) / n]);
  }
  o.push(pl[pl.length - 1]);
  return o;
};
const shaky = (pl, r, amp) => dens(pl).map(([x, y]) => [x + (r() - 0.5) * amp, y + (r() - 0.5) * amp]);

const KA = boot();
const L = KA.levels, P = KA.puzzles, S = KA.scoring, E = KA.economy;

console.log("\n[1] Pulau 5: Dasar Laut");
{
  const isl = L.islandLevels(5);
  check("11 arena di Pulau 5 dengan boss di posisi 11", isl.length === 11 && isl[10].boss && isl[10].name === "Raja Gurita");
  check("Nalar Pulau 5 = Simetri Putar & Keliling Pagar",
    isl[3].puzzleId === "putar" && isl[7].puzzleId === "keliling");
  check("kertas t5 gelap → tinta terang", KA.art.isDarkPaper("t5", null) && KA.art.inkSet("t5", null) === KA.art.PEN_COLORS.light);
  const boss = isl[10];
  const g = S.makeGhost(boss, L.island(5).ghostTarget);
  check("hantu Raja Gurita ±40 dari target 890", Math.abs(g.score - 890) <= 40, `skor ${g.score}`);
  check("pulau 5 terkunci sebelum boss 4 kalah", !L.isIslandOpen(5));
}

console.log("\n[2] Semua set soal Nalar");
{
  const zig = [];
  for (let y = 4; y <= 96; y += 5) zig.push([4, y], [96, y + 2.5]);
  const bad = [];
  let steps = 0, sets = 0;
  for (const pz of P.list) {
    const n = P.variants(pz.id);
    if (n < 3) bad.push(`${pz.id}: hanya ${n} set`);
    for (let v = 0; v < n; v++) {
      sets++;
      P.use(pz.id, v);
      const prev = [], prevShaky = [];
      pz.steps.forEach((s, i) => {
        steps++;
        const ans = s.answer.fills
          ? { strokes: [], fills: s.answer.fills.map((f) => ({ x: f.x, y: f.y, c: "#f88" })) }
          : { strokes: s.answer.polylines.map((pl) => ({ pts: dens(pl) })), fills: [] };
        const r = P.checkStep(pz.id, i, Object.assign({ prev }, ans));
        if (!r.ok) bad.push(`${s.id}: jawaban acuan ditolak (${r.reason})`);
        prev.push(r);
        if (!s.answer.fills) {
          const rr = rng(steps * 31 + 7);
          const sh = { strokes: s.answer.polylines.map((pl) => ({ pts: shaky(pl, rr, 1.2) })), fills: [], prev: prevShaky };
          const r2 = P.checkStep(pz.id, i, sh);
          if (!r2.ok) bad.push(`${s.id}: jawaban bergetar ditolak (${r2.reason})`);
          prevShaky.push(r2);
          const z = P.checkStep(pz.id, i, { strokes: [{ pts: dens(zig, 1) }], fills: [], prev });
          if (z.ok) bad.push(`${s.id}: coretan lulus`);
        }
        if (s.hints.length !== 3 || !s.text || !s.task) bad.push(`${s.id}: data langkah tidak lengkap`);
      });
    }
  }
  check(`${P.list.length} teka-teki × 3 set: jawaban benar lulus, jawaban bergetar lulus, coretan ditolak`, !bad.length,
    bad.slice(0, 8).join("; "));
  console.log(`      (${sets} set, ${steps} langkah)`);
  const ids = new Set();
  P.list.forEach((pz) => { for (let v = 0; v < P.variants(pz.id); v++) { P.use(pz.id, v); pz.steps.forEach((s) => ids.add(s.id)); } });
  check("id langkah unik di semua set", ids.size === P.list.reduce((a, pz) => a + pz.sets.reduce((b, st) => b + st.length, 0), 0));
  P.use("luas", 4);
  check("use() berputar: set ke-4 = set 1", P.get("luas").variant === 1 && P.get("luas").steps[0].id === "luasb1");
  check("checkStep memakai set aktif", P.checkStep("luas", 0, { strokes: [{ pts: dens(P.get("luas").steps[0].answer.polylines[0]) }] }).ok);
  P.use("luas", 0);
}

console.log("\n[3] Tantangan Harian");
{
  const st = KA.storage;
  const a = E.dailyChallenge("2026-11-14"), b = E.dailyChallenge("2026-11-14");
  check("deterministik untuk tanggal yang sama", a.levelId === b.levelId && a.twist === b.twist);
  const lv = L.get(a.levelId);
  check("level harian = level gambar terbuka, bukan boss", lv && lv.mode !== "nalar" && !lv.boss && L.isUnlocked(lv.id));
  /* membuka level baru tidak mengubah tantangan hari yang sama */
  st.recordLevel(1, { stars: 3, score: 950, grade: "S" }, {});
  st.recordLevel(2, { stars: 3, score: 950, grade: "S" }, {});
  const c = E.dailyChallenge("2026-11-14");
  check("pilihan dibekukan sepanjang hari", c.levelId === a.levelId && c.twist === a.twist);

  /* pelintiran valid di banyak tanggal */
  const probs = [];
  for (let k = 0; k < 120; k++) {
    const day = new Date(2026, 0, 1 + k);
    const ds = E.todayStr(day);
    const ch = E.dailyChallenge(ds);
    const base = L.get(ch.levelId);
    if (ch.twist === "cermin" && !L.isSymmetric(base)) probs.push(`${ds}: cermin pada ${base.name}`);
    if (ch.twist !== "sempurna" && ch.twist === base.mode) probs.push(`${ds}: pelintiran sama dengan mode asal`);
    const dl = E.dailyLevel(ds);
    const perfect = dl.mode === "cermin"
      ? base._half.map((p) => dens(p)).flatMap((p) => [p, p.map(([x, y]) => [100 - x, y])])
      : base._polylines.map((p) => dens(p));
    const r = S.evaluate(dl, perfect.map((p) => ({ pts: p })));
    if (r.stars < 3) probs.push(`${ds}: jiplak sempurna ${base.name}/${dl.mode} hanya ${r.stars} bintang`);
  }
  check("120 hari: pelintiran valid dan jiplak sempurna 3 bintang", !probs.length, probs.slice(0, 5).join("; "));

  /* hadiah sekali sehari dan hari beruntun */
  const KB = boot();
  const E2 = KB.economy, st2 = KB.storage;
  const coins0 = st2.data.coins;
  const d1 = E2.dailyChallenge("2026-11-10");
  const r1 = E2.completeDaily(d1.target, "2026-11-10");
  const r1b = E2.completeDaily(3, "2026-11-10");
  check("hadiah hanya sekali per hari", r1.first && r1.reward === 40 && !r1b.first && r1b.reward === 0 && st2.data.coins === coins0 + 40);
  const rLow = (E2.dailyChallenge("2026-11-11"), E2.completeDaily(0, "2026-11-11"));
  check("di bawah target tidak dapat hadiah", !rLow.first && rLow.reward === 0);
  const r2 = E2.completeDaily(3, "2026-11-11");
  check("hari berikutnya: beruntun 2, hadiah 45", r2.first && r2.streak === 2 && r2.reward === 45);
  E2.dailyChallenge("2026-11-13");
  const r3 = E2.completeDaily(3, "2026-11-13");
  check("bolong sehari: beruntun kembali 1", r3.first && r3.streak === 1);
  for (let k = 14; k <= 18; k++) { E2.dailyChallenge(`2026-11-${k}`); E2.completeDaily(3, `2026-11-${k}`); }
  check("lima hari beruntun → lencana Rajin Harian", E2.checkBadges({}).some((x) => x.id === "harian"));
  check("level harian berbagi geometri dan toleransi disesuaikan",
    (() => {
      const dl = E2.dailyLevel("2026-11-20"), base = KB.levels.get(dl.id);
      const tolOk = Math.abs(dl.tol - (base.tol / KB.levels.MODE_TOL[base.mode]) * KB.levels.MODE_TOL[dl.mode]) < 0.01;
      return dl._pts === base._pts && dl.daily === true && tolOk;
    })());
}

console.log("\n[4] Mode Kilat menilai bentuk, bukan posisi");
{
  const kil = L.drawingLevels().filter((l) => l.mode === "kilat");
  const r = rng(99);
  const moved = (lv, dx, dy, s) => lv._polylines.map((pl) => ({ pts: dens(pl).map(([x, y]) => [50 + (x - 50) * s + dx, 50 + (y - 50) * s + dy]) }));
  const bad = [];
  for (const lv of kil) for (const [dx, dy, s] of [[8, -6, 1], [-7, 5, 1.15], [5, 4, 0.85]]) {
    const e = S.evaluate(lv, moved(lv, dx, dy, s));
    if (e.stars < 3) bad.push(`${lv.name} (${dx},${dy},${s}) ${e.score}`);
  }
  check("bentuk tepat yang bergeser atau berubah ukuran tetap 3 bintang", !bad.length, bad.slice(0, 5).join("; "));
  /* gambar ingatan realistis: geser & skala acak, tiap bagian meleset sendiri, tangan bergetar */
  const memory = (lv) => {
    const dx = (r() - 0.5) * 16, dy = (r() - 0.5) * 16, sx = 0.85 + r() * 0.3, sy = sx * (0.92 + r() * 0.16);
    return lv._polylines.map((pl) => {
      const ox = (r() - 0.5) * 6, oy = (r() - 0.5) * 6;
      return { pts: dens(pl).map(([x, y]) => [50 + (x - 50) * sx + dx + ox + (r() - 0.5) * 0.4, 50 + (y - 50) * sy + dy + oy + (r() - 0.5) * 0.4]) };
    });
  };
  let zero = 0, sum = 0, n = 0;
  for (const lv of kil) for (let k = 0; k < 10; k++) { const e = S.evaluate(lv, memory(lv)); if (e.stars === 0) zero++; sum += e.stars; n++; }
  check("gambar ingatan sedang: tidak ada 0 bintang, rata-rata ≥2 bintang", zero === 0 && sum / n >= 2, `0 bintang: ${zero}, rata-rata ${(sum / n).toFixed(2)}`);
  const tiru = L.drawingLevels().find((l) => l.mode === "tiru");
  check("mode Tiru tetap menilai posisi (tidak disejajarkan)", S.evaluate(tiru, moved(tiru, 8, -6, 1)).stars < 3 && !S.evaluate(tiru, moved(tiru, 8, -6, 1)).align);
}

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exitCode = fail ? 1 : 0;

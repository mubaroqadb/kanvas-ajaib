/* Uji modul seni/audio/efek/ikon Kanvas Ajaib: jalankan: node tests/run-art.js
   Memeriksa flood fill ember cat (§15 no. 12) dan memastikan art/audio/fx/icons bisa dimuat tanpa DOM. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JS = path.join(__dirname, "..", "js");

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? "\n      " + detail : "")); }
}
function attempt(name, fn) {
  try { fn(); } catch (e) { check(name, false, (e && e.stack) || String(e)); }
}

/* ---------- lingkungan dasar: makeEnv dari run.js (memuat art.js), dengan cadangan ---------- */
let KA = null;
{
  const log = console.log;
  try {
    console.log = () => {}; /* run.js mencetak uji penerimaannya sendiri; diamkan */
    KA = require("./run.js").makeEnv().KA;
  } catch (e) {
    KA = null;
  } finally {
    console.log = log;
  }
  if (!KA || !KA.art) {
    const ctx = { console, Math, Date, JSON, Uint8Array, Uint8ClampedArray, Map, Set };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(JS, "art.js"), "utf8"), ctx, { filename: "art.js" });
    KA = ctx.KA;
  }
}
const A = KA.art;

/* ---------- alat bantu uji ---------- */
function boxWalls(w, h, x0, y0, x1, y1) {
  const m = new Uint8Array(w * h);
  for (let x = x0; x <= x1; x++) { m[y0 * w + x] = 1; m[y1 * w + x] = 1; }
  for (let y = y0; y <= y1; y++) { m[y * w + x0] = 1; m[y * w + x1] = 1; }
  return m;
}
const count = (r) => { let n = 0; for (let i = 0; i < r.length; i++) n += r[i] ? 1 : 0; return n; };
function bfs(walls, w, h, sx, sy) {
  const out = new Uint8Array(w * h);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || walls[sy * w + sx]) return out;
  const q = [sy * w + sx];
  out[q[0]] = 1;
  while (q.length) {
    const i = q.pop(), x = i % w, y = (i / w) | 0;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (!walls[j] && !out[j]) { out[j] = 1; q.push(j); }
    }
  }
  return out;
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

console.log("\n[12] Ember cat (floodFill)");
attempt("floodFill", () => {
  const W = 40, H = 40;
  const walls = boxWalls(W, H, 10, 10, 29, 29);
  const inner = A.floodFill(walls, W, H, 20, 20);
  let outside = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (inner[y * W + x] && !(x > 10 && x < 29 && y > 10 && y < 29)) outside++;
  }
  check("kotak tertutup → isi hanya bagian dalam (18×18 = 324 piksel)", count(inner) === 324 && outside === 0,
    `terisi ${count(inner)}, di luar kotak ${outside}`);
  check("hasil berupa Uint8Array seukuran kanvas", inner instanceof Uint8Array && inner.length === W * H);

  const outer = A.floodFill(walls, W, H, 2, 2);
  check("benih di luar kotak tidak masuk ke dalam (1600 − 400 = 1200)", count(outer) === 1200, `terisi ${count(outer)}`);

  const leaky = walls.slice();
  leaky[10 * W + 20] = 0; /* lubang 1 piksel di dinding atas */
  const leak = A.floodFill(leaky, W, H, 20, 20);
  check("dinding berlubang → bocor ke seluruh area (1600 − 75 dinding = 1525)", count(leak) === 1525, `terisi ${count(leak)}`);

  check("benih di dinding → region kosong", count(A.floodFill(walls, W, H, 10, 15)) === 0);
  check("benih di luar kanvas → region kosong",
    count(A.floodFill(walls, W, H, -1, 5)) === 0 && count(A.floodFill(walls, W, H, 5, 40)) === 0);
  check("benih pecahan dibulatkan ke bawah", count(A.floodFill(walls, W, H, 20.7, 20.2)) === 324);

  /* garis diagonal (sambung 8-arah) tetap menahan isian 4-arah */
  const diag = new Uint8Array(W * H);
  for (let i = 0; i < W; i++) diag[i * W + i] = 1;
  const half = A.floodFill(diag, W, H, 30, 5);
  check("garis diagonal menahan isian 4-arah (780 piksel)", count(half) === (W * W - W) / 2, `terisi ${count(half)}`);

  /* bentuk acak: hasil scanline = BFS 4-arah */
  let bad = 0;
  for (let t = 0; t < 60; t++) {
    const r = rng(t + 7), w = 37 + (t % 5), h = 23 + (t % 3);
    const m = new Uint8Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = r() < 0.38 ? 1 : 0;
    const sx = (r() * w) | 0, sy = (r() * h) | 0;
    const a = A.floodFill(m, w, h, sx, sy), b = bfs(m, w, h, sx, sy);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { bad++; break; }
  }
  check("60 peta acak: scanline identik dengan BFS 4-arah", bad === 0, `${bad} berbeda`);

  const big = A.floodFill(new Uint8Array(400 * 400), 400, 400, 0, 0);
  check("kanvas kosong 400×400 terisi penuh", count(big) === 160000);
});

console.log("\n[+] Data seni");
attempt("data seni", () => {
  check("PEN_COLORS 6 terang + 6 gelap", A.PEN_COLORS.light.length === 6 && A.PEN_COLORS.dark.length === 6);
  check("FILL_COLORS 10, FREE_COLORS 12", A.FILL_COLORS.length === 10 && A.FREE_COLORS.length === 12);
  const packs = (KA.economy && KA.economy.STICKER_PACKS) ||
    { stk_love: ["star", "heart", "sparkle"], stk_nature: ["flower", "leaf", "sun"], stk_sky: ["moon", "cloud", "rocket"] };
  const ids = Object.values(packs).flat();
  const miss = ids.filter((id) => !A.STAMPS[id] || !A.STAMPS[id].name || !/^M[\d.\s\-]/.test(A.STAMPS[id].d));
  check(`STAMPS lengkap untuk ${ids.length} stiker`, ids.length === 9 && !miss.length, miss.join(", "));
  check("nama berkas ekspor aman", A.slug("Bintang Ceria!") === "bintang-ceria" && A.slug("") === "karya");
});

/* ---------- lingkungan tiruan peramban (tanpa rendering) ---------- */
function mockBrowser(opts = {}) {
  const timers = [];
  let wallsFor = null;
  const audioLog = { osc: 0, noise: 0 };
  function ctx2d(canvas) {
    const t = {
      canvas,
      getImageData(x, y, w, h) {
        const data = new Uint8ClampedArray(w * h * 4);
        if (wallsFor) { const m = wallsFor(w, h); for (let i = 0; i < w * h; i++) data[i * 4 + 3] = m[i] ? 255 : 0; }
        return { data, width: w, height: h };
      },
      createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }; },
      putImageData(img) { canvas._img = img; },
      createRadialGradient() { return { addColorStop() {} }; },
      createLinearGradient() { return { addColorStop() {} }; },
      drawImage(src) { canvas._drawn = (canvas._drawn || 0) + 1; },
    };
    return new Proxy(t, { get: (o, k) => (k in o ? o[k] : () => {}) });
  }
  const makeCanvas = () => {
    const c = { width: 300, height: 150, style: {} };
    const x = ctx2d(c);
    c.getContext = () => x;
    c.toDataURL = () => "data:image/png;base64,";
    return c;
  };
  const anchors = [];
  const document = {
    hidden: false,
    createElement: (tag) => {
      if (tag === "canvas") return makeCanvas();
      const a = { style: {}, click() { anchors.push({ href: a.href, download: a.download }); }, remove() {} };
      return a;
    },
    body: { appendChild() {} },
    addEventListener() {},
  };
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = (extra) => Object.assign({ connect() {}, disconnect() {}, start() {}, stop() {}, gain: param(), frequency: param(), Q: param() }, extra || {});
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.state = "running"; this.sampleRate = 8000; this.destination = node(); }
    resume() { this.state = "running"; }
    suspend() { this.state = "suspended"; }
    createGain() { return node(); }
    createOscillator() { audioLog.osc++; return node({ type: "sine" }); }
    createBufferSource() { audioLog.noise++; return node({ buffer: null }); }
    createBiquadFilter() { return node({ type: "lowpass" }); }
    createDynamicsCompressor() { return node(); }
    createBuffer(ch, n) { return { getChannelData: () => new Float32Array(n) }; }
  }
  const store = opts.storage;
  const g = {
    console, Math, Date, JSON, Uint8Array, Uint8ClampedArray, Int16Array, Float32Array, Map, Set, Proxy, Object,
    document,
    Path2D: class { constructor(d) { this.d = d; } },
    URL: { createObjectURL: () => "blob:x", revokeObjectURL() {} },
    performance: { now: () => Date.now() },
    setInterval: (fn) => { timers.push(fn); return timers.length; },
    clearInterval: (id) => { timers[id - 1] = null; },
    setTimeout: () => 0,
  };
  if (opts.audio) g.AudioContext = FakeAudioContext;
  g.window = g;
  vm.createContext(g);
  if (store) {
    vm.runInContext("window.KA = window.KA || {};", g);
    g.KA.storage = store;
  }
  for (const f of ["audio.js", "fx.js", "icons.js", "art.js"]) {
    vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), g, { filename: f });
  }
  return {
    KA: g.KA, g, anchors, audioLog,
    setWalls: (fn) => { wallsFor = fn; },
    runTimers: () => timers.forEach((fn) => fn && fn()),
    activeTimers: () => timers.filter(Boolean).length,
    makeCanvas,
  };
}

console.log("\n[+] Modul dimuat di Node tanpa DOM");
for (const f of ["art.js", "audio.js", "fx.js", "icons.js"]) {
  attempt(f, () => {
    const g = { console, Math, Date, JSON, Uint8Array, Uint8ClampedArray };
    g.window = g;
    vm.createContext(g);
    vm.runInContext(fs.readFileSync(path.join(JS, f), "utf8"), g, { filename: f });
    const name = f.replace(".js", "");
    check(`${f} termuat → KA.${name}`, !!(g.KA && g.KA[name]));
    if (name === "audio") {
      /* tanpa AudioContext: semua panggilan diam-diam tidak berbuat apa-apa */
      const au = g.KA.audio;
      Object.keys(au.sfx).forEach((k) => au.sfx[k](1));
      au.startMusic("island2"); au.stopMusic(); au.unlock();
      check("audio tanpa AudioContext tidak melempar galat", true);
    }
  });
}

console.log("\n[+] Kontrak API");
attempt("kontrak", () => {
  const { KA: K } = mockBrowser();
  const want = {
    art: ["PEN_COLORS", "FILL_COLORS", "FREE_COLORS", "STAMPS", "floodFill", "paintBackground", "drawStrokes",
      "buildFillCanvas", "drawStamps", "renderArtwork", "exportPNG"],
    audio: ["sfx", "startMusic", "stopMusic", "unlock"],
    fx: ["init", "setScale", "spawnConfetti", "sparkle", "starTrail", "burst", "update", "clear"],
    icons: ["svg", "thumb", "mini", "noko"],
  };
  for (const m in want) {
    const miss = want[m].filter((k) => K[m][k] == null);
    check(`KA.${m} lengkap`, !miss.length, "hilang: " + miss.join(", "));
  }
  const sfx = ["click", "strokeGood", "strokeBad", "perfect", "star", "coin", "buy", "denied", "fanfare", "badge", "undo",
    "magic", "fill", "stamp", "partDone", "tick", "ghostWin"];
  const missS = sfx.filter((k) => typeof K.audio.sfx[k] !== "function");
  check("17 SFX tersedia", !missS.length, missS.join(", "));
});

console.log("\n[+] Ikon & Noko");
attempt("ikon", () => {
  const { KA: K } = mockBrowser();
  const I = K.icons;
  const names = ["trash", "user", "users", "chart", "download", "upload", "bucket", "sticker", "pin", "play", "paper", "music",
    "hat", "eye", "eyeoff", "settings", "dots", "steps", "mirror", "bulb", "gift", "home", "star", "coin", "lock"];
  const empty = names.filter((n) => !/<svg[^>]*>.+<\/svg>$/.test(I.svg(n)));
  check(`${names.length} ikon kontrak tidak kosong`, !empty.length, empty.join(", "));
  check("ikon terisi memakai <g fill>", /<g fill="currentColor" stroke="none">/.test(I.svg("star", 24, "", true)));
  check("tidak ada emoji di ikon", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(names.map((n) => I.svg(n)).join("")));
  const balanced = (s) => {
    const stack = [];
    for (const m of s.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
      if (m[3]) continue;
      if (!m[1]) stack.push(m[2]);
      else if (stack.pop() !== m[2]) return false;
    }
    return stack.length === 0;
  };
  const bad = [];
  for (const e of ["happy", "wow", "oops"]) {
    for (const h of [null, "hat_sailor", "hat_glasses", "hat_scarf", "hat_wizard", "hat_crown"]) {
      const s = I.noko(e, 80, { hat: h, color: "#4ECDC4" });
      if (!/^<svg[^>]*viewBox="0 0 140 140"/.test(s) || !balanced(s) || !s.includes("#4ECDC4") || !s.includes(`noko-${e}`)) bad.push(`${e}/${h}`);
    }
  }
  check("noko: 3 ekspresi × 6 topi → SVG utuh berwarna", !bad.length, bad.join(", "));
  const hats = ["hat_sailor", "hat_glasses", "hat_scarf", "hat_wizard", "hat_crown"].map((h) => I.noko("happy", 80, { hat: h }));
  check("tiap topi menghasilkan gambar berbeda", new Set(hats).size === 5 && !hats.includes(I.noko("happy", 80)));
  check("noko bawaan berwarna #FF6B6B", I.noko().includes("#FF6B6B") && I.noko("aneh").includes("noko-happy"));
});

console.log("\n[+] Render karya (DOM tiruan)");
attempt("render", () => {
  const env = mockBrowser();
  const Ar = env.KA.art;
  const st = () => [{ color: "#333344", size: 2.2, pts: [[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]] }];
  /* dinding kotak 10..29 pada res 40 → isian dalam 18×18 + pelebaran 2 px ke dinding = 20×20 */
  env.setWalls((w, h) => boxWalls(w, h, 10, 10, 29, 29));
  const fc = Ar.buildFillCanvas(st(), [{ x: 50, y: 50, c: "#FF0000" }], 40);
  const d = fc._img && fc._img.data;
  let n = 0, wrong = 0, outside = 0;
  if (d) for (let i = 0; i < 1600; i++) {
    if (!d[i * 4 + 3]) continue;
    n++;
    const x = i % 40, y = (i / 40) | 0;
    if (d[i * 4] !== 255 || d[i * 4 + 1] !== 0 || d[i * 4 + 2] !== 0) wrong++;
    if (x < 10 || x > 29 || y < 10 || y > 29) outside++;
  }
  check("buildFillCanvas: isian berhenti di dinding goresan (400 px, tak bocor)", n === 400 && !wrong && !outside,
    `terisi ${n}, salah warna ${wrong}, di luar ${outside}`);
  const fc2 = Ar.buildFillCanvas(st(), [{ x: 50, y: 50, c: "#00F" }, { x: 2, y: 2, c: "rgb(0, 200, 0)" }], 40);
  let blue = 0, green = 0;
  for (let i = 0; i < 1600; i++) {
    const p = fc2._img.data.slice(i * 4, i * 4 + 4);
    if (p[3] && p[2] === 255) blue++;
    if (p[3] && p[1] === 200) green++;
  }
  check("dua benih → dua region berwarna sendiri", blue >= 324 && green >= 1200 && blue + green === 1600, `biru ${blue}, hijau ${green}`);
  const fc3 = Ar.buildFillCanvas(st(), [{ x: 25, y: 50, c: "#FF0000" }], 40); /* x=10 = dinding */
  check("benih di dinding → tidak ada isian", !fc3._img || ![...fc3._img.data].some((v) => v));
  env.setWalls(null);

  const entry = {
    id: "g1", kind: "free", title: "Roket Ajaib!", theme: "t4", paper: null, pen: "neon",
    strokes: [{ color: "#FF6B6B", size: 2.2, pts: [[10, 10], [20, 30], [40, 35], [60, 20]] },
      { color: "#FFF", size: 3.5, pts: [[50, 50]], pen: "rainbow" },
      { color: "#FFF", size: 1.2, pts: [[5, 5], [6, 50], [70, 70]], pen: "rainbow" },
      { color: "#2A9D8F", size: 2.2, pts: [[30, 30], [31, 31]], pen: "brush" }],
    fills: [{ x: 50, y: 50, c: "#FFD3A8" }],
    stamps: [{ id: "rocket", x: 50, y: 50, s: 15, c: "#E63946" }, { id: "tidak-ada", x: 1, y: 1, s: 5, c: "#000" }],
  };
  for (const th of ["t1", "t2", "t3", "t4", null]) {
    for (const pp of [null, "paper_blueprint", "paper_grass", "paper_night"]) {
      Ar.renderArtwork(Object.assign({}, entry, { theme: th, paper: pp }), 120);
    }
  }
  const c = Ar.renderArtwork(entry, 200);
  check("renderArtwork → kanvas ukuran diminta, semua kertas & pena tanpa galat", c.width === 200 && c.height === 200 && c._drawn === 1);
  check("renderArtwork menerima entri kosong", Ar.renderArtwork({}, 50).width === 50);
  const name = Ar.exportPNG(entry);
  check("exportPNG mengunduh kanvas-ajaib-<judul>.png", name === "kanvas-ajaib-roket-ajaib.png" &&
    env.anchors.length === 1 && env.anchors[0].download === name, JSON.stringify(env.anchors));
  check("inkSet: kertas malam → tinta terang", Ar.inkSet("t1", "paper_night") === Ar.PEN_COLORS.light && Ar.inkSet("t4", "paper_grass") === Ar.PEN_COLORS.dark);
});

console.log("\n[+] Efek (fx)");
attempt("fx", () => {
  let rm = false;
  const env = mockBrowser({ storage: { settings: {}, reduceMotion: () => rm } });
  const F = env.KA.fx;
  let clock = 0;
  env.g.performance.now = () => (clock += 1000 / 60); /* tiap update() = satu bingkai 60 fps */
  const cv = env.makeCanvas(); cv.width = 1600; cv.height = 1600;
  F.init(cv); F.setScale(2);
  F.spawnConfetti(100);
  check("konfeti 100 partikel", F.count() === 100);
  F.burst(400, 400); F.sparkle(10, 10); F.starTrail(20, 20);
  const n = F.count();
  for (let i = 0; i < 400; i++) F.update();
  check("burst/sparkle/starTrail menambah partikel & semuanya habis setelah ±7 dtk", n > 100 && F.count() === 0, `awal ${n}, sisa ${F.count()}`);
  rm = true;
  F.clear();
  F.spawnConfetti(120);
  check("reduceMotion: konfeti dikurangi (≤24)", F.count() > 0 && F.count() <= 24, `${F.count()}`);
  F.clear();
  check("clear() mengosongkan", F.count() === 0);
});

console.log("\n[+] Audio (AudioContext tiruan)");
attempt("audio", () => {
  const settings = { soundOn: true, musicOn: true };
  const env = mockBrowser({ audio: true, storage: { settings } });
  const au = env.KA.audio, log = env.audioLog;
  const ac = au.unlock();
  check("unlock() mengembalikan AudioContext", !!ac && ac.state === "running");
  const counts = {};
  for (const tr of ["island1", "island2", "island3", "island4", "mus_ombak", "mus_hutan", "mus_bintang"]) {
    au.startMusic(tr);
    const t0 = ac.currentTime, o0 = log.osc + log.noise;
    for (let k = 0; k < 160; k++) { ac.currentTime += 0.025; env.runTimers(); } /* 4 detik */
    counts[tr] = log.osc + log.noise - o0;
  }
  const silent = Object.keys(counts).filter((k) => counts[k] < 8);
  check("7 lagu menjadwalkan nada (≥8 per 4 dtk)", !silent.length, JSON.stringify(counts));
  check("lagu berbeda karakter (jumlah nada tidak semuanya sama)", new Set(Object.values(counts)).size >= 3, JSON.stringify(counts));
  au.stopMusic();
  let o1 = log.osc;
  for (let k = 0; k < 40; k++) { ac.currentTime += 0.025; env.runTimers(); }
  check("stopMusic() menghentikan penjadwalan", log.osc === o1 && env.activeTimers() === 0);
  au.startMusic("island1");
  settings.musicOn = false;
  for (let k = 0; k < 4; k++) { ac.currentTime += 0.025; env.runTimers(); }
  o1 = log.osc;
  for (let k = 0; k < 40; k++) { ac.currentTime += 0.025; env.runTimers(); }
  check("musicOn=false → tidak ada nada musik baru", log.osc === o1);
  settings.musicOn = true;
  for (let k = 0; k < 40; k++) { ac.currentTime += 0.025; env.runTimers(); }
  check("musicOn kembali true → musik berlanjut", log.osc > o1);
  au.stopMusic();
  const before = log.osc + log.noise;
  Object.keys(au.sfx).forEach((k) => au.sfx[k](2));
  check("semua SFX menghasilkan suara saat soundOn", log.osc + log.noise - before >= Object.keys(au.sfx).length);
  settings.soundOn = false;
  const b2 = log.osc + log.noise;
  Object.keys(au.sfx).forEach((k) => au.sfx[k](0));
  check("soundOn=false → SFX diam", log.osc + log.noise === b2);
});

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exitCode = fail ? 1 : 0;
module.exports = { result: { pass, fail } };

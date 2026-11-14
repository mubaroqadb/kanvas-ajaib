/* Uji status: storage v4, ekonomi, lencana, migrasi (GAME-DESIGN §15 no. 8, 9, 10) + ketahanan skor.
   Dimuat di akhir tests/run.js. */
const { makeEnv, check, dens } = require("./run.js");

const RES = (score, extra = {}) => {
  const stars = score >= 900 ? 3 : score >= 750 ? 2 : score >= 550 ? 1 : 0;
  const grade = score >= 950 ? "S" : score >= 850 ? "A" : score >= 700 ? "B" : score >= 550 ? "C" : "D";
  return Object.assign({ score, stars, grade, perfect: false }, extra);
};
function boot(store = {}) {
  const env = makeEnv(store);
  env.KA.storage.init();
  return env;
}

/* ---------------- [8] boss per pulau ---------------- */
console.log("\n[8] Pulau 2 terbuka setelah boss 1 kalah; 4× menang = 1 lencana boss");
{
  const { KA } = boot();
  const st = KA.storage, L = KA.levels, E = KA.economy;
  const boss1 = L.list.find((l) => l.boss && l.island === 1);
  check("Pulau 2 terkunci di awal", !L.isIslandOpen(2));
  st.recordLevel(boss1.id, RES(700), { bossWin: false });
  check("kalah boss → Pulau 2 tetap terkunci", !L.isIslandOpen(2) && st.level(boss1.id).bossLosses === 1);
  let bossBadges = 0;
  for (let k = 0; k < 4; k++) {
    st.recordLevel(boss1.id, RES(880), { bossWin: true });
    bossBadges += E.checkBadges({ stars: 2 }).filter((b) => /^boss/.test(b.id)).length;
  }
  check("menang boss 1 → Pulau 2 terbuka", L.isIslandOpen(2) && L.isUnlocked(boss1.id + 1));
  check("Pulau 3 masih terkunci", !L.isIslandOpen(3));
  check("4× menang boss 1 → tepat 1 lencana boss", bossBadges === 1 && st.hasBadge("boss1") && !st.hasBadge("boss2"),
    `lencana boss: ${bossBadges}, ${JSON.stringify(st.data.badges)}`);
  check("bossWonIsland per pulau", JSON.stringify(st.data.bossWonIsland) === '{"1":true}');
}

/* ---------------- [9] toko berslot ---------------- */
console.log("\n[9] Toko berslot: membeli Lampu Noko tidak melepas pensil");
{
  const { KA } = boot();
  const st = KA.storage, E = KA.economy;
  st.addCoins(3000);
  check("beli Pensil Neon", st.buy("neon", E.item("neon").price));
  check("pakai Neon di slot pen", st.equip("pen", "neon") && st.data.equipped.pen === "neon");
  check("beli Lampu Noko", st.buy("lamp", E.item("lamp").price));
  check("pensil tetap Neon setelah beli lampu", st.data.equipped.pen === "neon");
  check("barang pasif tidak bisa di-equip", !st.equip("passive", "lamp") && !st.equip("pen", "lamp") && st.data.equipped.pen === "neon");
  st.buy("hat_crown", E.item("hat_crown").price);
  st.equip("hat", "hat_crown");
  st.buy("mus_hutan", 300); st.equip("music", "mus_hutan");
  check("pakai topi/musik tidak melepas pensil", st.data.equipped.pen === "neon" && st.data.equipped.hat === "hat_crown" && st.data.equipped.music === "mus_hutan");
  check("tidak bisa equip barang yang belum dimiliki", !st.equip("pen", "sparkle") && st.data.equipped.pen === "neon");
  check("barang salah slot ditolak", !st.equip("hat", "neon"));
  check("lepas topi → null, pensil tetap", st.equip("hat", null) && st.data.equipped.hat === null && st.data.equipped.pen === "neon");
  check("koin tidak cukup → gagal beli", (() => { st.addCoins(-99999); return !st.buy("sparkle", 400) && !st.owns("sparkle"); })());
  check("Pensil Andalan selalu dimiliki", st.owns("default"));
  const ids = E.ITEMS.map((i) => i.id);
  const want = ["default", "neon", "brush", "rainbow", "sparkle", "hat_sailor", "hat_glasses", "hat_scarf", "hat_wizard", "hat_crown",
    "paper_blueprint", "paper_grass", "paper_night", "stk_love", "stk_nature", "stk_sky", "mus_ombak", "mus_hutan", "mus_bintang", "lamp", "turtle"];
  check("ITEMS sesuai kontrak (21 id)", ids.length === want.length && want.every((w) => ids.includes(w)));
  const total = E.ITEMS.reduce((s, i) => s + i.price, 0);
  check("total isi toko ≈ 5.800", Math.abs(total - 5800) <= 100, `total ${total}`);
  st.addCoins(1000); st.buy("stk_sky", 450);
  check("ownedStickers dari paket", JSON.stringify(E.ownedStickers()) === '["moon","cloud","rocket"]');
}

/* ---------------- [10] migrasi ---------------- */
console.log("\n[10] Migrasi save v3 → v4");
function v3Save() {
  return {
    v: 3,
    levels: {
      1: { stars: 3, best: 960, grade: "S", done: true, bossWon: false },  // Bintang
      2: { stars: 2, best: 800, grade: "B", done: true, bossWon: false },  // Hati
      4: { stars: 0, best: 300, grade: "D", done: true, bossWon: false },  // Matahari (belum lulus)
      9: { stars: 2, best: 820, grade: "B", done: true, bossWon: true },   // Kastel (boss 1)
      10: { stars: 1, best: 600, grade: "C", done: true, bossWon: false }, // Ikan
      12: { stars: 3, best: 930, grade: "A", done: true, bossWon: false }, // Kucing
      20: { stars: 2, best: 780, grade: "B", done: true, bossWon: false }, // Roket
      27: { stars: 1, best: 620, grade: "C", done: true, bossWon: false }, // Robot Raksasa (kalah)
    },
    coins: 1234,
    items: ["neon", "lamp", "rainbow"],
    equipped: "rainbow",
    badges: ["first", "line3", "pelaut", "penjelajah", "kolektor"],
    daily: "2026-11-12",
    seenIntro: true,
    soundOn: false,
    gallery: [
      { id: 1731400000000, title: "Bintang", levelName: "Lv 1 · Kota Bentuk", theme: "t1", stars: 0, score: 0,
        strokes: [{ color: "#333", size: 2.2, pts: [[10, 10], [20, 20]] }], created: "12/11/2026" },
    ],
    pass: 3,
    stats: { kilat: 7, cermin: 9, maxColors: 4, bossWins: 3 },
    lastIsland: 2,
  };
}
{
  const old = v3Save();
  const store = { "kanvasAjaib.v3": JSON.stringify(old) };
  const { KA } = boot(store);
  const st = KA.storage, L = KA.levels;
  const d = st.data;
  check("koin dipertahankan", d.coins === 1234, `koin ${d.coins}`);
  check("barang dipertahankan", ["neon", "lamp", "rainbow"].every((i) => st.owns(i)) && d.items.length === 3);
  check("equipped string → equipped.pen", d.equipped.pen === "rainbow" && d.equipped.hat === null);
  let okStars = true, msg = [];
  let oldTotal = 0;
  for (const [oid, rec] of Object.entries(old.levels)) {
    oldTotal += rec.stars;
    const lv = L.byName(L.OLD_ORDER[oid - 1]);
    const nr = st.level(lv.id);
    if (!nr || nr.stars !== rec.stars || nr.best !== rec.best) { okStars = false; msg.push(`${lv.name}: ${JSON.stringify(nr)}`); }
  }
  check("bintang dipetakan ke level bernama sama", okStars, msg.join("; "));
  check("total bintang sama", st.totalStars() === oldTotal, `${st.totalStars()} vs ${oldTotal}`);
  const ikan = L.byName("Ikan");
  check("contoh: Ikan (lama id 10) → id baru " + ikan.id, st.level(ikan.id) && st.level(ikan.id).stars === 1);
  check("bossWon lama → bossWonIsland & Pulau 2 terbuka", d.bossWonIsland[1] === true && L.isIslandOpen(2) && !d.bossWonIsland[3]);
  check("level 0 bintang tidak 'done'", st.level(L.byName("Matahari").id).done === false);
  check("pemain lama: seenIntro", d.seenIntro === true);
  check("soundOn lama → settings", st.settings.soundOn === false);
  check("lencana boss/kolektor lama dibuang, lencana setara dipertahankan",
    JSON.stringify(d.badges) === '["first","line3"]', JSON.stringify(d.badges));
  check("galeri lama dimigrasi", d.gallery.length === 1 && d.gallery[0].levelId === L.byName("Bintang").id &&
    d.gallery[0].kind === "level" && /^2026-11-12T/.test(d.gallery[0].created) && Array.isArray(d.gallery[0].fills));
  check("pass & daily dipertahankan", d.pass === 3 && d.daily === "2026-11-12");
  check("statistik mode dihitung ulang dari level ber-bintang", d.stats.kilat === 0 && d.stats.cermin === 1,
    JSON.stringify(d.stats));
  check("tersimpan di kunci v4", !!store["kanvasAjaib.v4"] && JSON.parse(store["kanvasAjaib.v4"]).v === 4);
  KA.economy.checkBadges({});
  check("lencana boss 1 diberikan ulang dari bossWonIsland", st.hasBadge("boss1") && !st.hasBadge("boss2"));

  /* muat ulang dari v4: tidak dimigrasi ulang */
  st.addCoins(6);
  const again = boot(store).KA.storage;
  check("muat ulang v4 mempertahankan data", again.data.coins === 1240 && again.totalStars() === oldTotal);
}
{
  const old = v3Save();
  old.equipped = "lamp";
  const { KA } = boot({ "kanvasAjaib.v3": JSON.stringify(old) });
  check("equipped lama 'lamp' → pen 'default'", KA.storage.data.equipped.pen === "default" && KA.storage.owns("lamp"));
}
{
  const v2 = { v: 2, levels: { 1: { stars: 2, best: 790, grade: "B", done: true } }, coins: 77, items: ["brush"], equipped: "brush", badges: [], soundOn: true };
  const { KA } = boot({ "kanvasAjaib.v2": JSON.stringify(v2) });
  const d = KA.storage.data;
  check("migrasi v2 → v4", d.coins === 77 && d.equipped.pen === "brush" && KA.storage.level(1).stars === 2 && d.seenIntro);
}
{
  const { KA } = boot({ "kanvasAjaib.v3": "{rusak" });
  check("save rusak → profil baru tanpa error", KA.storage.data.coins === 0 && KA.storage.listProfiles().length === 1);
}

/* ---------------- profil ---------------- */
console.log("\n[+] Profil keluarga & pengaturan");
{
  const store = {};
  const { KA } = boot(store);
  const st = KA.storage;
  const first = st.activeId;
  st.addCoins(100);
  const a = st.addProfile("Ayu", "#ff0"), b = st.addProfile("Bima"), c = st.addProfile("Citra");
  check("maks 4 profil", a && b && c && st.addProfile("Dodo") === null && st.listProfiles().length === 4);
  check("nama kosong ditolak", st.addProfile("  ") === null);
  st.switchProfile(a);
  check("progres terpisah per profil", st.data.coins === 0 && st.data.name === "Ayu");
  st.recordLevel(1, RES(910));
  st.addGallery({ title: "x", strokes: [] });
  check("listProfiles memuat bintang", st.listProfiles().find((p) => p.id === a).stars === 3 &&
    st.listProfiles().find((p) => p.id === first).stars === 0);
  check("profileData", st.profileData(first).coins === 100 && st.profileData("zzz") === null);
  st.setSetting("soundOn", false);
  st.switchProfile(first);
  check("pengaturan per perangkat (tidak ikut profil)", st.settings.soundOn === false);
  check("setSetting kunci asing ditolak", st.setSetting("hack", 1) === false);
  st.setSetting("reduceMotion", true);
  check("reduceMotion manual", st.reduceMotion() === true);
  st.setSetting("reduceMotion", null);
  check("reduceMotion null → ikuti sistem (tanpa matchMedia = false)", st.reduceMotion() === false);
  check("renameProfile", st.renameProfile(b, "Bimo", "#123") && st.profileData(b).name === "Bimo" && st.profileData(b).color === "#123");
  check("hapus profil aktif → pindah ke profil lain", st.switchProfile(c) && st.deleteProfile(c) && st.activeId !== c && st.listProfiles().length === 3);
  st.deleteProfile(a); st.deleteProfile(b);
  check("profil terakhir tidak bisa dihapus", st.deleteProfile(st.activeId) === false && st.listProfiles().length === 1);
  const reload = boot(store).KA.storage;
  check("profil & aktif tersimpan lintas muat", reload.listProfiles().length === 1 && reload.activeId === st.activeId && reload.data.coins === 100);

  /* ekspor / impor */
  st.addProfile("Ayu");
  st.switchProfile(st.listProfiles()[1].id);
  st.addCoins(321);
  const json = st.exportProfile();
  st.addCoins(-321);
  check("importProfile memulihkan profil bernama sama", st.importProfile(json) && st.data.coins === 321 && st.listProfiles().length === 2);
  check("importProfile menolak JSON rusak", !st.importProfile("{oops") && !st.importProfile('{"a":1}'));
  const j2 = JSON.parse(json); j2.data.name = "Baru";
  check("importProfile nama baru → profil baru", st.importProfile(JSON.stringify(j2)) && st.listProfiles().length === 3 && st.data.name === "Baru");
}

/* ---------------- galeri & dinding ---------------- */
console.log("\n[+] Galeri (maks 30) & Dinding (maks 6)");
{
  const { KA } = boot();
  const st = KA.storage;
  const ids = [];
  for (let i = 0; i < 8; i++) ids.push(st.addGallery({ title: "k" + i, kind: "free", strokes: [] }));
  const walled = ids.slice(0, 6).map((id) => st.toggleWall(id));
  check("6 karya terpajang", walled.every(Boolean) && st.data.wall.length === 6);
  check("karya ke-7 ditolak (dinding penuh)", st.toggleWall(ids[6]) === false && st.data.wall.length === 6);
  for (let i = 8; i < 40; i++) ids.push(st.addGallery({ title: "k" + i, kind: "free", strokes: [] }));
  const g = st.data.gallery;
  check("galeri maks 30", g.length === 30, `panjang ${g.length}`);
  check("karya terpajang tidak terhapus otomatis", ids.slice(0, 6).every((id) => g.some((x) => x.id === id)));
  check("karya tertua tak terpajang yang dibuang", !g.some((x) => x.id === ids[6]) && g[0].id === ids[39]);
  check("id unik", new Set(g.map((x) => x.id)).size === g.length);
  check("updateGallery", st.updateGallery(ids[39], { colored: true, id: "hack" }) && g[0].colored && g[0].id === ids[39]);
  check("toggleWall melepas", st.toggleWall(ids[0]) === false && st.data.wall.length === 5);
  st.toggleWall(ids[1]);
  check("hapus karya juga melepas dari dinding", st.removeGallery(ids[2]) && !st.data.wall.includes(ids[2]));
  for (let i = 0; i < 310; i++) st.logAttempt({ levelId: 1, score: i });
  check("catatan percobaan maks 300 (terbaru dipertahankan)", st.data.attempts.length === 300 && st.data.attempts[299].score === 309 && st.data.attempts[0].score === 10);
  check("setGhostRec hanya menyimpan yang lebih baik",
    st.setGhostRec(9, { score: 900, strokes: [] }) && !st.setGhostRec(9, { score: 850, strokes: [] }) && st.data.ghostRec[9].score === 900);
}

/* ---------------- kuota penuh ---------------- */
console.log("\n[+] localStorage penuh / melempar");
{
  let limit = Infinity;
  const raw = {};
  const store = new Proxy(raw, {
    set(t, k, v) {
      if (String(v).length > limit) { const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e; }
      t[k] = v; return true;
    },
  });
  const { KA } = boot(store);
  const st = KA.storage;
  const big = Array.from({ length: 400 }, (_, i) => [i % 100, (i * 7) % 100]);
  const ids = [];
  for (let i = 0; i < 12; i++) ids.push(st.addGallery({ title: "k" + i, strokes: [{ color: "#000", size: 2, pts: big }] }));
  st.toggleWall(ids[0]);
  limit = raw["kanvasAjaib.v4"].length - 9000; // paksa penuh
  st.addCoins(5);
  const saved = JSON.parse(raw["kanvasAjaib.v4"]);
  const prof = saved.profiles[saved.activeId];
  check("kuota penuh → galeri tertua dipangkas lalu tersimpan", prof.coins === 5 && prof.gallery.length < 12 && prof.gallery.length > 0,
    `galeri ${prof.gallery.length}, koin ${prof.coins}`);
  check("karya terpajang tidak ikut dipangkas", prof.gallery.some((g) => g.id === ids[0]));
  limit = 10; // tidak mungkin disimpan
  let threw = false;
  try { st.addCoins(1); } catch (e) { threw = true; }
  check("simpan gagal total tidak melempar", !threw && st.data.coins === 6);

  const throwing = { "kanvasAjaib.v3": "x" };
  Object.defineProperty(throwing, "kanvasAjaib.v4", { get() { throw new Error("SecurityError"); }, enumerable: true });
  let ok = true;
  try { const e3 = makeEnv(throwing); e3.KA.storage.init(); e3.KA.storage.addCoins(1); ok = e3.KA.storage.data.coins === 1; } catch (e) { ok = false; }
  check("localStorage melempar saat dibaca → tetap jalan di memori", ok);
}

/* ---------------- ekonomi ---------------- */
console.log("\n[+] Ekonomi: koin, harian, Jalan Bintang, hantu, bantuan");
{
  const { KA } = boot();
  const st = KA.storage, E = KA.economy, L = KA.levels;
  const cf = (o) => E.coinsFor(o).total;
  check("lulus pertama = skor ÷ 10", cf({ res: RES(870), firstTime: true, prevBest: 0 }) === 87);
  check("tanpa bintang = 5", cf({ res: RES(400), firstTime: false, prevBest: 0 }) === 5);
  check("rekor baru = 10 + selisih ÷ 5", cf({ res: RES(900), firstTime: false, prevBest: 800 }) === 30);
  check("ulang tanpa rekor = 2", cf({ res: RES(700), firstTime: false, prevBest: 800 }) === 2);
  check("Zona Sempurna +10", cf({ res: RES(980, { perfect: true }), firstTime: false, prevBest: 990 }) === 12);
  check("menang boss +50, Secepat Hantu +20", cf({ res: RES(850), firstTime: true, prevBest: 0, bossWin: true, fastGhost: true }) === 85 + 70);
  check("boss kalah (belum pernah menang) = semangat 5", cf({ res: RES(820), firstTime: false, prevBest: 0, bossWin: false }) === 5);
  check("passed:false memaksa koin semangat", cf({ res: RES(820), firstTime: false, prevBest: 600, passed: false }) === 5);
  check("baris koin berlabel", E.coinsFor({ res: RES(870), firstTime: true }).lines.every((l) => typeof l.label === "string" && l.n > 0));

  /* recordLevel → firstTime/newBest/fails */
  let r = st.recordLevel(1, RES(400));
  check("0 bintang: bukan firstTime, fails 1", !r.firstTime && !r.passed && st.level(1).fails === 1 && !st.level(1).done);
  check("offerAssist belum (fails 1)", !E.offerAssist(1));
  st.recordLevel(1, RES(300));
  check("offerAssist setelah 2 gagal beruntun", E.offerAssist(1));
  r = st.recordLevel(1, RES(760), { assisted: true });
  check("lulus pertama setelah gagal → firstTime & fails 0", r.firstTime && st.level(1).fails === 0 && !E.offerAssist(1));
  r = st.recordLevel(1, RES(900));
  check("rekor baru terdeteksi", !r.firstTime && r.newBest && st.level(1).best === 900 && st.level(1).stars === 3);
  r = st.recordLevel(1, RES(500));
  check("percobaan buruk tidak menurunkan bintang", st.level(1).stars === 3 && st.level(1).best === 900 && !r.newBest);

  /* hantu melemah */
  const boss = L.list.find((l) => l.boss && l.island === 2);
  const base = L.island(2).ghostTarget;
  const seq = [E.ghostTarget(boss.id)];
  for (let k = 0; k < 5; k++) { st.recordLevel(boss.id, RES(700), { bossWin: false }); seq.push(E.ghostTarget(boss.id)); }
  check("target hantu turun 40 per kekalahan, min 680", seq.join(",") === [800, 760, 720, 680, 680, 680].join(",") && base === 800, seq.join(","));
  check("kalah boss tidak mencatat bintang/lulus", st.level(boss.id).stars === 0 && !st.level(boss.id).done);
  st.recordLevel(boss.id, RES(700), { bossWin: true });
  check("menang → hantu kembali penuh", E.ghostTarget(boss.id) === 800 && st.level(boss.id).bossLosses === 0 && st.level(boss.id).done);
  check("Mode Bantu tidak ditawarkan di boss", !E.offerAssist(boss.id));

  /* harian & Jalan Bintang */
  const c0 = st.data.coins;
  check("bonus harian 50 sekali per hari", E.dailyBonus() === 50 && E.dailyBonus() === 0 && st.data.coins === c0 + 50);
  check("30 tingkat Jalan Bintang", E.PASS_TIERS.length === 30 && E.PASS_TIERS[0].reward === 20 && E.PASS_TIERS[29].req === 90);
  const pass0 = st.data.pass;
  const cp = E.claimPass();
  const stars = st.totalStars();
  check("claimPass mengklaim tingkat yang cukup bintang", st.data.pass === Math.floor(stars / 3) &&
    cp.total === cp.tiers.reduce((s, t) => s + 15 + 5 * t, 0) && (pass0 < st.data.pass) === cp.claimed);
  check("claimPass kedua tidak memberi lagi", !E.claimPass().claimed);
}

/* ---------------- lencana ---------------- */
console.log("\n[+] Lencana (20)");
{
  const { KA } = boot();
  const st = KA.storage, E = KA.economy;
  check("22 lencana, id unik, 4 cabang", E.BADGES.length === 22 && new Set(E.BADGES.map((b) => b.id)).size === 22 &&
    ["presisi", "petualang", "kreatif"].every((br) => E.BADGES.filter((b) => b.branch === br).length >= 5) &&
    E.BADGES.filter((b) => b.branch === "nalar").map((b) => b.id).join() === "pemikir,tanpapetunjuk");
  check("tidak ada lencana di awal", E.checkBadges({}).length === 0);
  check("streak dari percobaan 0 bintang tidak dihitung", E.checkBadges({ streakMaxed: true, stars: 0 }).length === 0);
  check("streak dari percobaan ber-bintang dihitung", E.checkBadges({ streakMaxed: true, stars: 1 }).map((b) => b.id).join() === "steady");
  st.incStat("cermin", 4);
  check("Arsitek Cermin belum (4)", !E.checkBadges({}).some((b) => b.id === "arsitek"));
  st.incStat("cermin");
  check("Arsitek Cermin (5 percobaan Cermin ≥1 bintang)", E.checkBadges({}).some((b) => b.id === "arsitek"));
  check("Kolektor Warna dari ctx.colorsUsed", E.checkBadges({ colorsUsed: 6 }).some((b) => b.id === "warna"));
  const id = st.addGallery({ title: "a", strokes: [] });
  st.toggleWall(id);
  check("Dermawan saat memajang", E.checkBadges({}).some((b) => b.id === "dermawan"));
  check("lencana tidak diberikan dua kali", E.checkBadges({ colorsUsed: 9, streakMaxed: true, stars: 3 }).length === 0);
}

console.log("\n[+] Nalar: lencana, koin, Maestro hanya level gambar");
{
  const { KA } = boot();
  const st = KA.storage, E = KA.economy, L = KA.levels;
  const NZ = L.nalarLevels();
  const NRES = (stars) => ({ stars, score: [0, 600, 800, 950][stars], grade: ["D", "C", "B", "S"][stars], nalar: { correct: stars > 0 } });
  check("10 level Nalar", NZ.length === 10 && NZ.every((l) => l.mode === "nalar"));
  check("koin Nalar lulus pertama = 30 per bintang", E.coinsFor({ res: NRES(2), firstTime: true, passed: true }).total === 60);
  check("Nalar salah = koin semangat", E.coinsFor({ res: NRES(0), firstTime: false, passed: false }).total === 5);
  st.recordLevel(NZ[0].id, NRES(3));
  check("grade S dari Nalar tidak memberi Perfectionis", !E.checkBadges({ stars: 3 }).some((b) => b.id === "perfy"));
  NZ.slice(1, 5).forEach((l) => st.recordLevel(l.id, NRES(2)));
  check("Tanpa Petunjuk setelah 5 Nalar ≥2 bintang", E.checkBadges({ stars: 2 }).some((b) => b.id === "tanpapetunjuk"));
  NZ.slice(5, 7).forEach((l) => st.recordLevel(l.id, NRES(1)));
  check("Pemikir Cilik belum (7)", !E.checkBadges({ stars: 1 }).some((b) => b.id === "pemikir"));
  st.recordLevel(NZ[7].id, NRES(1));
  check("Pemikir Cilik (8 Nalar ≥1 bintang)", E.checkBadges({ stars: 1 }).some((b) => b.id === "pemikir"));
  L.drawingLevels().forEach((l) => st.recordLevel(l.id, RES(800), { bossWin: !!l.boss }));
  check("Maestro Kanvas hanya menghitung level gambar", E.checkBadges({ stars: 2 }).some((b) => b.id === "master"));
  check("Mode Bantu Nalar setelah 2 gagal", (() => { const { KA: K2 } = boot(); K2.storage.recordLevel(4, NRES(0)); K2.storage.recordLevel(4, NRES(0)); return K2.economy.offerAssist(4); })());
}

/* ---------------- ketahanan skor ---------------- */
console.log("\n[+] Ketahanan skor terhadap pola coretan lain (< 550 di semua level)");
{
  const { KA } = makeEnv();
  const L = KA.levels, S = KA.scoring;
  const ev = (lv, strokes) => S.evaluate(lv, strokes.map((p) => ({ pts: p })));
  const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  const spiral = (gap, cx = 50, cy = 50) => {
    const p = [];
    for (let th = 0; ; th += 0.05) {
      const r = (gap * th) / (2 * Math.PI);
      if (r > 47) break;
      p.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]);
    }
    return [dens(p)];
  };
  const rings = (gap) => {
    const out = [];
    for (let r = gap / 2; r <= 47; r += gap) {
      const p = [];
      for (let i = 0; i <= 64; i++) p.push([50 + Math.cos((i / 64) * 2 * Math.PI) * r, 50 + Math.sin((i / 64) * 2 * Math.PI) * r]);
      out.push(dens(p));
    }
    return out;
  };
  const grid = (gap) => {
    const out = [];
    for (let v = 4; v <= 96; v += gap) { out.push(dens([[4, v], [96, v]])); out.push(dens([[v, 4], [v, 96]])); }
    return out;
  };
  const walk = (seed, len) => {
    const r = rng(seed);
    let x = 50, y = 50, a = r() * 6.28;
    const p = [[x, y]];
    for (let d = 0; d < len; d += 0.8) {
      a += (r() - 0.5) * 0.9;
      x += Math.cos(a) * 0.8; y += Math.sin(a) * 0.8;
      if (x < 4 || x > 96) { a = Math.PI - a; x = Math.max(4, Math.min(96, x)); }
      if (y < 4 || y > 96) { a = -a; y = Math.max(4, Math.min(96, y)); }
      p.push([x, y]);
    }
    return [p];
  };

  const families = {
    "spiral rapat": [4, 5, 6, 7, 8, 10].map((g) => [`jarak ${g}`, spiral(g)]),
    "lingkaran konsentris": [4, 5, 6, 7, 8, 10].map((g) => [`jarak ${g}`, rings(g)]),
    "kisi": [4, 5, 6, 7, 8, 10].map((g) => [`jarak ${g}`, grid(g)]),
    "jalan-acak padat": [[1, 1500], [2, 3000], [3, 6000], [4, 10000]].map(([s, n]) => [`benih ${s}, ${n} satuan`, walk(s, n)]),
  };
  for (const [fam, variants] of Object.entries(families)) {
    let worst = { score: -1 };
    const over = [];
    for (const lv of L.drawingLevels()) for (const [label, strokes] of variants) {
      const r = ev(lv, strokes);
      if (r.score > worst.score) worst = { score: r.score, lv: lv.name, label, r };
      if (r.score >= 550) over.push(`${lv.name} ${label}: ${r.score} (t${r.acc} l${r.comp} r${r.neat})`);
    }
    check(`${fam}: skor tertinggi < 550`, worst.score < 550, over.slice(0, 8).join("; ") + (over.length > 8 ? ` … (+${over.length - 8})` : ""));
    console.log(`      (terburuk: ${worst.lv}, ${worst.label}, skor ${worst.score}; tepat ${worst.r.acc}, lengkap ${worst.r.comp}, rapi ${worst.r.neat})`);
  }
}

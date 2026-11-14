/* Kanvas Ajaib: ekonomi: toko berslot, koin, bonus harian, Jalan Bintang, lencana, hantu & bantuan */
window.KA = window.KA || {};

KA.economy = (function () {
  /* ---------- Toko Noko (§10b), slot terpisah ---------- */
  const ITEMS = [
    { id: "default", slot: "pen", name: "Pensil Andalan", icon: "pencil", price: 0, desc: "Pensil setia untuk setiap petualangan.", alwaysOwned: true },
    { id: "neon", slot: "pen", name: "Pensil Neon", icon: "zap", price: 120, desc: "Goresan menyala seperti lampu." },
    { id: "brush", slot: "pen", name: "Kuas Tebal", icon: "brush", price: 150, desc: "Goresan tebal nan gagah." },
    { id: "rainbow", slot: "pen", name: "Pensil Pelangi", icon: "rainbow", price: 250, desc: "Warnanya berganti sendiri." },
    { id: "sparkle", slot: "pen", name: "Pensil Kilau", icon: "sparkle", price: 400, desc: "Bintang kecil ikut menari." },

    { id: "hat_sailor", slot: "hat", name: "Topi Pelaut", icon: "hat", price: 200, desc: "Noko siap berlayar." },
    { id: "hat_glasses", slot: "hat", name: "Kacamata", icon: "hat", price: 250, desc: "Noko jadi tampak pintar." },
    { id: "hat_scarf", slot: "hat", name: "Syal", icon: "hat", price: 300, desc: "Hangat di pulau berangin." },
    { id: "hat_wizard", slot: "hat", name: "Topi Penyihir", icon: "hat", price: 500, desc: "Sihirnya makin terasa." },
    { id: "hat_crown", slot: "hat", name: "Mahkota", icon: "hat", price: 600, desc: "Raja kanvas sejati." },

    { id: "paper_blueprint", slot: "paper", name: "Kertas Blueprint", icon: "paper", price: 150, desc: "Kertas biru untuk Kanvas Bebas." },
    { id: "paper_grass", slot: "paper", name: "Kertas Rumput", icon: "paper", price: 150, desc: "Kertas hijau untuk Kanvas Bebas." },
    { id: "paper_night", slot: "paper", name: "Kertas Langit Malam", icon: "paper", price: 200, desc: "Kertas gelap berbintang." },

    { id: "stk_love", slot: "stickers", name: "Stiker Bintang & Hati", icon: "sticker", price: 200, desc: "Bintang, hati, dan kilau." },
    { id: "stk_nature", slot: "stickers", name: "Stiker Alam", icon: "sticker", price: 350, desc: "Bunga, daun, dan matahari." },
    { id: "stk_sky", slot: "stickers", name: "Stiker Langit", icon: "sticker", price: 450, desc: "Bulan, awan, dan roket." },

    { id: "mus_ombak", slot: "music", name: "Lagu Ombak", icon: "music", price: 300, desc: "Kotak musik bernada laut." },
    { id: "mus_hutan", slot: "music", name: "Lagu Hutan", icon: "music", price: 300, desc: "Kotak musik bernada hutan." },
    { id: "mus_bintang", slot: "music", name: "Lagu Bintang", icon: "music", price: 300, desc: "Kotak musik bernada malam." },

    { id: "lamp", slot: "passive", name: "Lampu Noko", icon: "lamp", price: 300, desc: "Mode Kilat: 1 kedipan ekstra." },
    { id: "turtle", slot: "passive", name: "Kura-kura Waktu", icon: "turtle", price: 350, desc: "Hantu menggambar 15% lebih lambat." },
  ];
  const SLOTS = ["pen", "hat", "paper", "stickers", "music", "passive"];

  const STICKER_PACKS = {
    stk_love: ["star", "heart", "sparkle"],
    stk_nature: ["flower", "leaf", "sun"],
    stk_sky: ["moon", "cloud", "rocket"],
  };

  const item = (id) => ITEMS.find((i) => i.id === id) || null;
  const itemsBySlot = (slot) => ITEMS.filter((i) => i.slot === slot);

  function ownedStickers() {
    const out = [];
    for (const pack of Object.keys(STICKER_PACKS)) if (KA.storage.owns(pack)) out.push(...STICKER_PACKS[pack]);
    return out;
  }

  /* ---------- Jalan Bintang: 30 tingkat, tiap 3 bintang ---------- */
  const PASS_TIERS = [];
  for (let t = 1; t <= 30; t++) PASS_TIERS.push({ tier: t, req: 3 * t, reward: 15 + 5 * t });

  /* klaim semua tingkat yang bintangnya sudah cukup → {claimed, total, tiers} */
  function claimPass() {
    const d = KA.storage.data;
    const stars = KA.storage.totalStars();
    let total = 0;
    const tiers = [];
    for (const tr of PASS_TIERS) {
      if (tr.tier <= d.pass) continue;
      if (stars < tr.req) break;
      total += tr.reward;
      tiers.push(tr.tier);
      d.pass = tr.tier;
    }
    if (total) KA.storage.addCoins(total);
    return { claimed: tiers.length > 0, total, tiers };
  }

  function todayStr(date) {
    const d = date || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* bonus harian: 50 bila hari ini belum diambil (dan langsung dikreditkan), selain itu 0 */
  function dailyBonus() {
    const today = todayStr();
    if (KA.storage.data.daily === today) return 0;
    KA.storage.markDaily(today);
    KA.storage.addCoins(50);
    return 50;
  }

  /* ---------- koin per percobaan (§10a) ----------
     ctx: {res, firstTime, prevBest, bossWin, fastGhost, passed?}
     passed (opsional, dari recordLevel), bila false, percobaan dihitung "tanpa bintang".
     Tanpa passed: lulus = res.stars ≥ 1, kecuali percobaan bukan-pertama tanpa rekor lama
     (prevBest 0) yang berarti boss yang belum pernah dimenangkan. */
  function coinsFor(ctx) {
    ctx = ctx || {};
    const res = ctx.res || { score: 0, stars: 0 };
    const score = Number(res.score) || 0;
    const prevBest = Number(ctx.prevBest) || 0;
    const lines = [];
    let passed = ctx.passed != null ? !!ctx.passed : (res.stars || 0) >= 1;
    if (ctx.passed == null && !ctx.firstTime && !prevBest && !ctx.bossWin) passed = false;

    if (!passed) lines.push({ label: "Koin semangat", n: 5 });
    else if (ctx.firstTime && res.nalar) lines.push({ label: "Lulus pertama", n: 30 * (res.stars || 1) }); /* Nalar: 30 per bintang */
    else if (ctx.firstTime) lines.push({ label: "Lulus pertama", n: Math.max(1, Math.round(score / 10)) });
    else if (score > prevBest) lines.push({ label: "Rekor baru", n: 10 + Math.round((score - prevBest) / 5) });
    else lines.push({ label: "Main ulang", n: 2 });

    if (passed && res.perfect) lines.push({ label: "Zona Sempurna", n: 10 });
    if (ctx.bossWin) {
      lines.push({ label: "Menang boss", n: 50 });
      if (ctx.fastGhost) lines.push({ label: "Secepat Hantu", n: 20 });
    }
    return { total: lines.reduce((s, l) => s + l.n, 0), lines };
  }

  /* ---------- Lencana (§11) ---------- */
  const lvs = (p) => Object.values(p.levels || {});
  const starCount = (p) => lvs(p).reduce((s, l) => s + (l.stars || 0), 0);
  const bossIsl = (i) => (p) => !!(p.bossWonIsland && p.bossWonIsland[i]);
  /* lencana berbasis konteks hanya dari percobaan ≥1 bintang (bila ctx.stars diberikan) */
  const okCtx = (c) => !!c && (c.stars == null || c.stars >= 1);
  const modeOf = (id) => { const lv = KA.levels.get(+id); return lv ? lv.mode : null; };
  const drawRecs = (p) => Object.entries(p.levels || {}).filter(([id]) => modeOf(id) !== "nalar").map(([, l]) => l);
  const nalarRecs = (p) => Object.entries(p.levels || {}).filter(([id]) => modeOf(id) === "nalar").map(([, l]) => l);

  const BADGES = [
    { id: "first", branch: "presisi", icon: "pencil", name: "Goresan Pertama", desc: "Lulus level pertamamu.",
      check: (p) => lvs(p).some((l) => l.done && l.stars >= 1) },
    { id: "line3", branch: "presisi", icon: "ruler", name: "Penakluk Garis", desc: "Raih bintang di 3 level.",
      check: (p) => lvs(p).filter((l) => l.stars >= 1).length >= 3 },
    { id: "steady", branch: "presisi", icon: "flame", name: "Tangan Steady", desc: "Capai streak goresan ×2.",
      check: (p, c) => okCtx(c) && !!c.streakMaxed },
    { id: "perfy", branch: "presisi", icon: "sparkle", name: "Perfectionis", desc: "Raih nilai S.",
      check: (p) => drawRecs(p).some((l) => l.grade === "S" && l.stars >= 1) },
    { id: "master", branch: "presisi", icon: "palette", name: "Maestro Kanvas", desc: "Dua bintang di semua level gambar.",
      check: (p) => KA.levels.drawingLevels().every((lv) => ((p.levels || {})[lv.id] || {}).stars >= 2) },

    { id: "boss1", branch: "petualang", icon: "flag", name: "Pelaut Berani", desc: "Kalahkan boss Pulau 1.", check: bossIsl(1) },
    { id: "boss2", branch: "petualang", icon: "flame", name: "Sang Naga", desc: "Kalahkan boss Pulau 2.", check: bossIsl(2) },
    { id: "boss3", branch: "petualang", icon: "gear", name: "Pemburu Robot", desc: "Kalahkan boss Pulau 3.", check: bossIsl(3) },
    { id: "boss4", branch: "petualang", icon: "moon", name: "Legenda Langit", desc: "Kalahkan boss Pulau 4.", check: bossIsl(4) },
    { id: "boss5", branch: "petualang", icon: "wave", name: "Penguasa Laut", desc: "Kalahkan boss Pulau 5.", check: bossIsl(5) },
    { id: "harian", branch: "petualang", icon: "flag", name: "Rajin Harian", desc: "Tantangan Harian 5 hari beruntun.",
      check: (p) => (p.stats.dailyStreak || 0) >= 5 },
    { id: "fastghost", branch: "petualang", icon: "ghost", name: "Secepat Hantu", desc: "Selesai sebelum hantu.",
      check: (p, c) => (p.stats.fastGhost || 0) >= 1 || (okCtx(c) && !!c.fastGhost) },
    { id: "legenda", branch: "petualang", icon: "trophy", name: "Bintang 90", desc: "Kumpulkan 90 bintang.",
      check: (p) => starCount(p) >= 90 },

    { id: "warna", branch: "kreatif", icon: "palette", name: "Kolektor Warna", desc: "Pakai 6 warna sekaligus.",
      check: (p, c) => (p.stats.maxColors || 0) >= 6 || (okCtx(c) && (c.colorsUsed || 0) >= 6) },
    { id: "arsitek", branch: "kreatif", icon: "mirror", name: "Arsitek Cermin", desc: "Lulus 5 kali mode Cermin.",
      check: (p) => (p.stats.cermin || 0) >= 5 },
    { id: "ilmuwan", branch: "kreatif", icon: "zap", name: "Ilmuwan Ingatan", desc: "Lulus 5 kali mode Kilat.",
      check: (p) => (p.stats.kilat || 0) >= 5 },
    { id: "pewarna", branch: "kreatif", icon: "bucket", name: "Pewarna", desc: "Warnai 5 karya.",
      check: (p) => (p.stats.colored || 0) >= 5 },
    { id: "bebas", branch: "kreatif", icon: "brush", name: "Pelukis Bebas", desc: "Buat 3 karya bebas.",
      check: (p) => (p.stats.free || 0) >= 3 },
    { id: "kurator", branch: "kreatif", icon: "image", name: "Kurator", desc: "Simpan 10 karya.",
      check: (p) => (p.gallery || []).length >= 10 },
    { id: "dermawan", branch: "kreatif", icon: "heart", name: "Dermawan", desc: "Pajang karya di Dinding.",
      check: (p) => (p.wall || []).length >= 1 },

    { id: "pemikir", branch: "nalar", icon: "bulb", name: "Pemikir Cilik", desc: "Raih bintang di 8 teka-teki Nalar.",
      check: (p) => nalarRecs(p).filter((l) => l.stars >= 1).length >= 8 },
    { id: "tanpapetunjuk", branch: "nalar", icon: "eye", name: "Tanpa Petunjuk", desc: "Dua bintang di 5 teka-teki Nalar.",
      check: (p) => nalarRecs(p).filter((l) => l.stars >= 2).length >= 5 },
  ];

  /* periksa semua lencana; kembalikan daftar lencana BARU */
  function checkBadges(ctx) {
    const p = KA.storage.data;
    const won = [];
    for (const b of BADGES) {
      if (KA.storage.hasBadge(b.id)) continue;
      let ok = false;
      try { ok = !!b.check(p, ctx || {}); } catch (e) { ok = false; }
      if (ok && KA.storage.grantBadge(b.id)) won.push(b);
    }
    return won;
  }

  /* ---------- Tantangan Harian ----------
     Satu level gambar per hari dengan pelintiran mode. Pilihan dibekukan di profil saat pertama dibuka hari itu,
     supaya tidak berubah ketika level baru terbuka di tengah hari. */
  const TWIST = {
    kilat: { label: "Dari Ingatan", icon: "zap", target: 2 },
    titik: { label: "Sambung Titik", icon: "dots", target: 2 },
    cermin: { label: "Cermin", icon: "mirror", target: 2 },
    sempurna: { label: "Sempurna", icon: "sparkle", target: 3 },
  };
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dayShift(dateStr, n) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return todayStr(new Date(y, m - 1, d + n));
  }
  function pickDaily(date) {
    const L = KA.levels;
    let pool = L.drawingLevels().filter((l) => !l.boss && L.isUnlocked(l.id));
    if (!pool.length) pool = L.drawingLevels().filter((l) => !l.boss && l.island === 1);
    const h = hashStr("kanvas-ajaib-" + date);
    const lv = pool[h % pool.length];
    const twists = Object.keys(TWIST).filter((t) => t !== lv.mode && (t !== "cermin" || L.isSymmetric(lv)));
    return { levelId: lv.id, twist: twists[(h >>> 8) % twists.length] };
  }
  /* keadaan tantangan hari ini (dibuat bila belum ada) */
  function dailyChallenge(date) {
    const d = KA.storage.data;
    date = date || todayStr();
    let ch = d.dailyCh;
    if (!ch || ch.date !== date || !KA.levels.get(ch.levelId)) {
      const pick = pickDaily(date);
      ch = { date, levelId: pick.levelId, twist: pick.twist, done: false, best: 0,
        streak: ch ? ch.streak || 0 : 0, lastDone: ch ? ch.lastDone || null : null };
      d.dailyCh = ch;
      KA.storage.save();
    }
    const tw = TWIST[ch.twist] || TWIST.sempurna;
    const base = KA.levels.get(ch.levelId);
    const live = ch.lastDone === date || ch.lastDone === dayShift(date, -1) ? ch.streak || 0 : 0;
    return Object.assign({}, ch, { label: tw.label, icon: tw.icon, target: tw.target,
      mode: ch.twist === "sempurna" ? base.mode : ch.twist, streakNow: live, level: base });
  }
  /* level yang dimainkan untuk tantangan hari ini */
  function dailyLevel(date) {
    const ch = dailyChallenge(date);
    const lv = KA.levels.withMode(ch.level, ch.mode);
    lv.daily = true;
    return lv;
  }
  /* catat hasil; hadiah hanya sekali per hari saat target bintang tercapai */
  function completeDaily(stars, date) {
    const ch = dailyChallenge(date);
    const d = KA.storage.data;
    const st = d.dailyCh;
    st.best = Math.max(st.best || 0, stars || 0);
    let reward = 0;
    const first = !st.done && stars >= ch.target;
    if (first) {
      st.streak = st.lastDone === dayShift(ch.date, -1) ? (st.streak || 0) + 1 : 1;
      st.lastDone = ch.date;
      st.done = true;
      reward = 40 + 5 * Math.min(st.streak - 1, 6);
      KA.storage.addCoins(reward);
      KA.storage.incStat("dailyDone");
      KA.storage.maxStat("dailyStreak", st.streak);
    }
    KA.storage.save();
    return { reward, first, streak: st.streak || 0, target: ch.target, done: st.done };
  }

  /* ---------- hantu melemah & Mode Bantu (§6) ---------- */
  function ghostTarget(levelId) {
    const lv = KA.levels.get(levelId);
    const isl = lv ? KA.levels.island(lv.island) : null;
    const base = isl ? isl.ghostTarget : 760;
    const rec = KA.storage.level(levelId);
    const losses = (rec && rec.bossLosses) || 0;
    return Math.max(680, base - 40 * losses);
  }

  /* tawarkan Mode Bantu setelah ≥2 percobaan beruntun tanpa bintang (bukan untuk boss) */
  function offerAssist(levelId) {
    const lv = KA.levels.get(levelId);
    if (!lv || lv.boss) return false;
    const rec = KA.storage.level(levelId);
    return !!rec && (rec.fails || 0) >= 2;
  }

  return {
    ITEMS, SLOTS, STICKER_PACKS, PASS_TIERS, BADGES,
    item, itemsBySlot, ownedStickers,
    claimPass, coinsFor, dailyBonus, checkBadges, todayStr,
    ghostTarget, offerAssist,
    TWIST, dailyChallenge, dailyLevel, completeDaily,
  };
})();

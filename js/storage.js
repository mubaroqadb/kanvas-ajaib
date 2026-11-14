/* Kanvas Ajaib: penyimpanan v4: profil keluarga (maks 4), pengaturan per perangkat,
   migrasi v2/v3 → v4. Semua akses localStorage dibungkus try/catch. */
window.KA = window.KA || {};

KA.storage = (function () {
  const KEY = "kanvasAjaib.v4";
  const OLD_KEYS = ["kanvasAjaib.v3", "kanvasAjaib.v2"];
  const MAX_PROFILES = 4;
  const MAX_GALLERY = 30;
  const MAX_WALL = 6;
  const MAX_ATTEMPTS = 300;
  const SLOTS = ["pen", "hat", "music", "paper"];
  const PROFILE_COLORS = ["#ff7a59", "#4c9aff", "#2fbf71", "#b36bff"];
  /* lencana lama yang artinya sama di v4 (lencana boss dihitung ulang dari bossWonIsland) */
  const KEEP_OLD_BADGES = ["first", "line3", "steady", "perfy", "master", "legenda", "arsitek", "ilmuwan", "kurator"];

  const defaultSettings = () => ({ soundOn: true, musicOn: true, showTimer: false, vibrate: true, reduceMotion: null });

  const defaultStats = () => ({ kilat: 0, cermin: 0, colored: 0, free: 0, maxColors: 0, fastGhost: 0, sCount: 0, dailyDone: 0, dailyStreak: 0 });

  function freshProfile(name, color) {
    return {
      name: name || "Pemain 1",
      color: color || PROFILE_COLORS[0],
      levels: {},
      coins: 0,
      items: [],
      equipped: { pen: "default", hat: null, music: null, paper: null },
      badges: [],
      gallery: [],
      wall: [],
      pass: 0,
      stats: defaultStats(),
      bossWonIsland: {},
      attempts: [],
      ghostRec: {},
      lastIsland: 1,
      seenIslands: [],
      seenIntro: false,
      daily: null,
      dailyCh: null,
      playMs: 0,
    };
  }

  const freshRoot = () => ({ v: 4, seq: 0, activeId: null, order: [], profiles: {}, settings: defaultSettings() });

  /* lengkapi profil hasil muat/impor dengan bidang bawaan (aman terhadap data rusak/lama) */
  function normProfile(p) {
    const f = freshProfile();
    if (!p || typeof p !== "object") return f;
    const o = Object.assign(f, p);
    o.equipped = Object.assign(freshProfile().equipped, p.equipped && typeof p.equipped === "object" ? p.equipped : {});
    if (!o.equipped.pen) o.equipped.pen = "default";
    o.stats = Object.assign(defaultStats(), p.stats && typeof p.stats === "object" ? p.stats : {});
    for (const k of ["levels", "bossWonIsland", "ghostRec"]) if (!o[k] || typeof o[k] !== "object" || Array.isArray(o[k])) o[k] = {};
    for (const k of ["items", "badges", "gallery", "wall", "attempts", "seenIslands"]) if (!Array.isArray(o[k])) o[k] = [];
    o.coins = Math.max(0, Number(o.coins) || 0);
    o.pass = Number(o.pass) || 0;
    o.playMs = Number(o.playMs) || 0;
    return o;
  }

  function normRoot(r) {
    const n = Object.assign(freshRoot(), r);
    n.v = 4;
    n.settings = Object.assign(defaultSettings(), r && r.settings);
    n.profiles = {};
    const order = Array.isArray(r && r.order) ? r.order : Object.keys((r && r.profiles) || {});
    n.order = [];
    for (const id of order) {
      if (r.profiles && r.profiles[id] && n.order.length < MAX_PROFILES) {
        n.profiles[id] = normProfile(r.profiles[id]);
        n.order.push(id);
      }
    }
    if (!n.order.length) addProfileTo(n, "Pemain 1", PROFILE_COLORS[0]);
    if (!n.profiles[n.activeId]) n.activeId = n.order[0];
    n.seq = Math.max(Number(n.seq) || 0, n.order.length);
    return n;
  }

  function addProfileTo(r, name, color, data) {
    let id;
    do { r.seq = (Number(r.seq) || 0) + 1; id = "p" + r.seq; } while (r.profiles[id]);
    const p = data ? normProfile(data) : freshProfile(name, color);
    if (name) p.name = name;
    if (color) p.color = color;
    r.profiles[id] = p;
    r.order.push(id);
    if (!r.activeId) r.activeId = id;
    return id;
  }

  /* ---------------- akses localStorage yang aman ---------------- */
  function lsGet(k) {
    try { return typeof localStorage !== "undefined" ? localStorage.getItem(k) : null; } catch (e) { return null; }
  }
  function isQuota(e) {
    return !!e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 || e.code === 1014 || /quota/i.test(String(e.message || "")));
  }

  /* ---------------- migrasi v2/v3 → profil v4 ---------------- */
  function isoFrom(created, fallbackMs) {
    if (typeof created === "string") {
      const m = created.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // format id-ID lama: dd/mm/yyyy
      if (m) {
        const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
        if (!isNaN(d)) return d.toISOString();
      }
      const d = new Date(created);
      if (!isNaN(d)) return d.toISOString();
    }
    const d = new Date(typeof fallbackMs === "number" ? fallbackMs : Date.now());
    return isNaN(d) ? new Date().toISOString() : d.toISOString();
  }

  function migrateOld(old) {
    const L = KA.levels;
    const p = freshProfile("Pemain 1", PROFILE_COLORS[0]);
    if (!old || typeof old !== "object") return p;

    /* level: id lama → nama lama → id baru */
    const oldLevels = old.levels && typeof old.levels === "object" ? old.levels : {};
    for (const k of Object.keys(oldLevels)) {
      const rec = oldLevels[k] || {};
      const name = L.OLD_ORDER[Number(k) - 1];
      const lv = name ? L.byName(name) : null;
      if (!lv) continue;
      const stars = Math.max(0, Math.min(3, Number(rec.stars) || 0));
      const bossWon = !!rec.bossWon && lv.boss;
      p.levels[lv.id] = {
        stars,
        best: Math.max(0, Number(rec.best) || 0),
        grade: typeof rec.grade === "string" ? rec.grade : "D",
        done: lv.boss ? bossWon : stars >= 1,
        bossWon,
        fails: 0,
        bossLosses: 0,
      };
      if (bossWon) p.bossWonIsland[lv.island] = true;
    }

    p.coins = Math.max(0, Number(old.coins) || 0);
    const known = KA.economy && KA.economy.ITEMS ? new Set(KA.economy.ITEMS.map((i) => i.id)) : null;
    p.items = (Array.isArray(old.items) ? old.items : []).filter((id, i, a) =>
      typeof id === "string" && id !== "default" && a.indexOf(id) === i && (!known || known.has(id)));
    const PENS = ["default", "neon", "brush", "rainbow", "sparkle"];
    const eq = typeof old.equipped === "string" ? old.equipped : old.equipped && old.equipped.pen;
    p.equipped.pen = PENS.includes(eq) && (eq === "default" || p.items.includes(eq)) ? eq : "default";

    p.badges = (Array.isArray(old.badges) ? old.badges : []).filter((b) => KEEP_OLD_BADGES.includes(b));
    p.daily = typeof old.daily === "string" ? old.daily : null;
    p.pass = Math.max(0, Math.min(30, Number(old.pass) || 0));
    p.lastIsland = Math.max(1, Math.min(4, Number(old.lastIsland) || 1));
    p.seenIntro = true; // pemain lama tidak perlu intro lagi

    /* statistik: hitung ulang secara jujur dari level ber-bintang */
    const st = p.stats;
    for (const id of Object.keys(p.levels)) {
      const lv = L.get(Number(id)), r = p.levels[id];
      if (!lv || r.stars < 1) continue;
      if (lv.mode === "kilat") st.kilat++;
      if (lv.mode === "cermin") st.cermin++;
      if (r.grade === "S") st.sCount++;
    }
    st.maxColors = Math.max(0, Number(old.stats && old.stats.maxColors) || 0);

    /* pulau yang sudah pernah dimainkan tidak menampilkan kartu pembuka lagi */
    const seen = new Set([1]);
    for (const id of Object.keys(p.levels)) { const lv = L.get(Number(id)); if (lv) seen.add(lv.island); }
    p.seenIslands = [...seen].sort();

    /* galeri lama: {id(number), title, levelName, theme, stars, score, strokes, created} */
    const og = Array.isArray(old.gallery) ? old.gallery : [];
    p.gallery = og.filter((g) => g && Array.isArray(g.strokes)).slice(0, MAX_GALLERY).map((g, i) => {
      const lv = typeof g.title === "string" ? L.byName(g.title) : null;
      return {
        id: "g" + String(g.id != null ? g.id : Date.now() + "_" + i),
        kind: "level",
        title: String(g.title || (lv ? lv.name : "Karya")),
        levelId: lv ? lv.id : null,
        theme: g.theme || (lv ? lv.theme : "t1"),
        paper: null,
        pen: "default",
        anim: lv ? lv.anim : null,
        stars: Number(g.stars) || 0,
        score: Number(g.score) || 0,
        strokes: g.strokes,
        fills: [],
        stamps: [],
        created: isoFrom(g.created, typeof g.id === "number" ? g.id : undefined),
        colored: false,
      };
    });
    return p;
  }

  /* ---------------- status ---------------- */
  let root = normRoot(freshRoot()); // sementara (sebelum init), tidak disimpan
  let ready = false;

  function init() {
    let r = null;
    const raw = lsGet(KEY);
    if (raw) {
      try { r = normRoot(JSON.parse(raw)); } catch (e) { r = null; }
    }
    if (!r) {
      for (const k of OLD_KEYS) {
        const o = lsGet(k);
        if (!o) continue;
        try {
          const old = JSON.parse(o);
          const n = freshRoot();
          const id = addProfileTo(n, null, null, migrateOld(old));
          n.activeId = id;
          if (old && typeof old.soundOn === "boolean") n.settings.soundOn = old.soundOn;
          r = normRoot(n);
          break;
        } catch (e) { /* save lama rusak: coba kunci berikutnya */ }
      }
    }
    root = r || normRoot(freshRoot());
    ready = true;
    save();
    return root;
  }

  /* pangkas karya galeri tertua yang tidak dipajang (profil dengan galeri terbanyak lebih dulu) */
  function pruneOne() {
    const ids = [...root.order].sort((a, b) => root.profiles[b].gallery.length - root.profiles[a].gallery.length);
    for (const id of ids) {
      const p = root.profiles[id];
      for (let i = p.gallery.length - 1; i >= 0; i--) {
        if (!p.wall.includes(p.gallery[i].id)) { p.gallery.splice(i, 1); return true; }
      }
    }
    return false;
  }

  function save() {
    if (!ready) return false;
    for (let guard = 0; guard < 200; guard++) {
      try {
        localStorage.setItem(KEY, JSON.stringify(root));
        return true;
      } catch (e) {
        if (!isQuota(e) || !pruneOne()) return false;
      }
    }
    return false;
  }

  const P = () => root.profiles[root.activeId];
  const lvRec = (id) => P().levels[id] || null;
  const starsOf = (p) => Object.values(p.levels).reduce((s, l) => s + (Number(l.stars) || 0), 0);

  function itemDef(id) {
    return KA.economy && KA.economy.ITEMS ? KA.economy.ITEMS.find((i) => i.id === id) || null : null;
  }

  function newGalleryId(p) {
    let id;
    do { id = "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
    while (p.gallery.some((g) => g.id === id));
    return id;
  }

  return {
    init,
    save,
    get data() { return P(); },
    get settings() { return root.settings; },
    get activeId() { return root.activeId; },
    get gallery() { return P().gallery; },
    MAX_PROFILES, MAX_GALLERY, MAX_WALL,

    /* ---------- pengaturan per perangkat ---------- */
    setSetting(k, v) {
      if (!(k in defaultSettings())) return false;
      root.settings[k] = v;
      save();
      return true;
    },
    reduceMotion() {
      const s = root.settings.reduceMotion;
      if (s === true || s === false) return s;
      try {
        return !!(typeof window !== "undefined" && window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      } catch (e) { return false; }
    },

    /* ---------- profil ---------- */
    listProfiles() {
      return root.order.map((id) => {
        const p = root.profiles[id];
        return { id, name: p.name, color: p.color, stars: starsOf(p) };
      });
    },
    addProfile(name, color) {
      name = String(name || "").trim().slice(0, 16);
      if (!name || root.order.length >= MAX_PROFILES) return null;
      const id = addProfileTo(root, name, color || PROFILE_COLORS[root.order.length % PROFILE_COLORS.length]);
      save();
      return id;
    },
    switchProfile(id) {
      if (!root.profiles[id]) return false;
      root.activeId = id;
      save();
      return true;
    },
    renameProfile(id, name, color) {
      const p = root.profiles[id];
      if (!p) return false;
      name = String(name == null ? p.name : name).trim().slice(0, 16);
      if (name) p.name = name;
      if (color) p.color = color;
      save();
      return true;
    },
    deleteProfile(id) {
      if (!root.profiles[id] || root.order.length <= 1) return false;
      delete root.profiles[id];
      root.order = root.order.filter((x) => x !== id);
      if (root.activeId === id) root.activeId = root.order[0];
      save();
      return true;
    },
    profileData(id) { return root.profiles[id] || null; },

    /* ---------- level ---------- */
    level(id) { return lvRec(id); },

    /* Boss: bintang/rekor hanya dicatat saat menang (kalah boss tidak dihitung "lulus").
       Mengembalikan {firstTime, prev, newBest, passed}. */
    recordLevel(id, res, opts) {
      opts = opts || {};
      const p = P();
      const lv = KA.levels ? KA.levels.get(id) : null;
      const isBoss = !!(lv && lv.boss);
      const prev = Object.assign({ stars: 0, best: 0, grade: "D", done: false, bossWon: false, fails: 0, bossLosses: 0 },
        p.levels[id] || {});
      const stars = Number(res && res.stars) || 0;
      const score = Number(res && res.score) || 0;
      const bossWin = !!opts.bossWin;
      const counts = !isBoss || bossWin;
      const passed = isBoss ? bossWin : stars >= 1;
      const next = Object.assign({}, prev);
      if (counts) {
        next.stars = Math.max(prev.stars, stars);
        if (score > prev.best) { next.best = score; next.grade = (res && res.grade) || prev.grade; }
      }
      next.done = prev.done || passed;
      next.fails = stars === 0 ? prev.fails + 1 : 0;
      if (isBoss) {
        if (bossWin) {
          next.bossWon = true;
          next.bossLosses = 0;
          p.bossWonIsland[lv.island] = true;
        } else next.bossLosses = prev.bossLosses + 1;
      }
      p.levels[id] = next;
      save();
      const firstTime = !prev.done && passed;
      return { firstTime, prev, newBest: counts && prev.done && score > prev.best, passed };
    },

    /* ---------- koin & toko ---------- */
    addCoins(n) { const p = P(); p.coins = Math.max(0, p.coins + (Number(n) || 0)); save(); return p.coins; },
    owns(id) {
      if (id === "default") return true;
      const it = itemDef(id);
      return !!(it && it.alwaysOwned) || P().items.includes(id);
    },
    buy(id, price) {
      const p = P();
      price = Number(price);
      if (!(price >= 0) || this.owns(id) || p.coins < price) return false;
      p.coins -= price;
      p.items.push(id);
      save();
      return true;
    },
    /* hanya mengubah satu slot; barang pasif/stiker tidak dipakai lewat slot */
    equip(slot, id) {
      const p = P();
      if (!SLOTS.includes(slot)) return false;
      if (id == null) {
        p.equipped[slot] = slot === "pen" ? "default" : null;
        save();
        return true;
      }
      const it = itemDef(id);
      if (it && it.slot !== slot) return false;
      if (!this.owns(id)) return false;
      p.equipped[slot] = id;
      save();
      return true;
    },

    /* ---------- lencana ---------- */
    hasBadge(id) { return P().badges.includes(id); },
    grantBadge(id) {
      const p = P();
      if (p.badges.includes(id)) return false;
      p.badges.push(id);
      save();
      return true;
    },

    /* ---------- galeri & dinding ---------- */
    addGallery(entry) {
      const p = P();
      const e = Object.assign({ kind: "level", fills: [], stamps: [], colored: false }, entry);
      if (!e.id || p.gallery.some((g) => g.id === e.id)) e.id = newGalleryId(p);
      if (!e.created) e.created = new Date().toISOString();
      p.gallery.unshift(e);
      while (p.gallery.length > MAX_GALLERY) {
        let i = p.gallery.length - 1;
        while (i >= 0 && p.wall.includes(p.gallery[i].id)) i--;
        if (i < 0) break;
        p.gallery.splice(i, 1);
      }
      save();
      return e.id;
    },
    updateGallery(id, patch) {
      const g = P().gallery.find((x) => x.id === id);
      if (!g) return false;
      Object.assign(g, patch, { id });
      save();
      return true;
    },
    removeGallery(id) {
      const p = P();
      const n = p.gallery.length;
      p.gallery = p.gallery.filter((g) => g.id !== id);
      p.wall = p.wall.filter((w) => w !== id);
      save();
      return p.gallery.length < n;
    },
    /* → true bila kini terpajang; false bila dilepas atau dinding penuh */
    toggleWall(id) {
      const p = P();
      if (p.wall.includes(id)) { p.wall = p.wall.filter((w) => w !== id); save(); return false; }
      if (p.wall.length >= MAX_WALL || !p.gallery.some((g) => g.id === id)) return false;
      p.wall.push(id);
      save();
      return true;
    },

    /* ---------- statistik & progres ---------- */
    incStat(k, n) { const s = P().stats; s[k] = (Number(s[k]) || 0) + (n == null ? 1 : n); save(); return s[k]; },
    maxStat(k, v) { const s = P().stats; if (v > (Number(s[k]) || 0)) { s[k] = v; save(); } return s[k]; },
    setLastIsland(i) { P().lastIsland = i; save(); },
    totalStars() { return starsOf(P()); },
    logAttempt(rec) {
      const a = P().attempts;
      a.push(Object.assign({ t: new Date().toISOString() }, rec));
      if (a.length > MAX_ATTEMPTS) a.splice(0, a.length - MAX_ATTEMPTS);
      save();
    },
    /* menyimpan rekaman hantu hanya bila lebih baik dari rekaman sebelumnya → bool */
    setGhostRec(levelId, rec) {
      const g = P().ghostRec;
      if (!rec || !Array.isArray(rec.strokes)) return false;
      if (g[levelId] && (g[levelId].score || 0) > (rec.score || 0)) return false;
      g[levelId] = { score: rec.score || 0, strokes: rec.strokes };
      save();
      return true;
    },
    markIslandSeen(i) { const p = P(); if (!p.seenIslands.includes(i)) { p.seenIslands.push(i); save(); } },
    markIntro() { P().seenIntro = true; save(); },
    markDaily(str) { P().daily = str; save(); },
    addPlayMs(ms) { const p = P(); p.playMs += Math.max(0, Number(ms) || 0); save(); },

    /* ---------- cadangan ---------- */
    exportProfile() {
      return JSON.stringify({ app: "kanvasAjaib", kind: "profile", v: 4, exported: new Date().toISOString(), data: P() });
    },
    /* pulihkan: timpa profil bernama sama, atau tambah profil baru bila masih ada slot → bool */
    importProfile(json) {
      let o;
      try { o = typeof json === "string" ? JSON.parse(json) : json; } catch (e) { return false; }
      if (!o || typeof o !== "object") return false;
      const d = o.kind === "profile" && o.data ? o.data : o;
      if (!d || typeof d !== "object" || !d.levels || typeof d.levels !== "object" || Array.isArray(d.levels)) return false;
      const prof = normProfile(JSON.parse(JSON.stringify(d)));
      const nm = String(prof.name || "").trim().toLowerCase();
      let id = root.order.find((x) => root.profiles[x].name.trim().toLowerCase() === nm);
      if (id) root.profiles[id] = prof;
      else if (root.order.length < MAX_PROFILES) id = addProfileTo(root, prof.name, prof.color, prof);
      else return false;
      root.activeId = id;
      save();
      return true;
    },
  };
})();

/* Kanvas Ajaib: layar menu: beranda, toko, galeri, lencana, keluarga, pengaturan, laporan */
window.KA = window.KA || {};

KA.screens = (function () {
  const $ = (id) => document.getElementById(id);
  const ic = (n, s = 22, c = "", f = false) => KA.icons.svg(n, s, c, f);
  const S = () => KA.storage;
  const D = () => KA.storage.data;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function sfx(name, arg) {
    const f = KA.audio && KA.audio.sfx && KA.audio.sfx[name];
    if (typeof f === "function") { try { f(arg); } catch (e) { /* audio opsional */ } }
  }

  const SCREENS = ["scr-home", "scr-game", "scr-shop", "scr-gallery", "scr-badges", "scr-family", "scr-settings", "scr-report"];
  const MODE = {
    tiru: { icon: "pencil", label: "Tiru" },
    titik: { icon: "dots", label: "Titik" },
    langkah: { icon: "steps", label: "Langkah" },
    kilat: { icon: "zap", label: "Kilat" },
    cermin: { icon: "mirror", label: "Cermin" },
    boss: { icon: "ghost", label: "Duel Hantu" },
    nalar: { icon: "bulb", label: "Nalar" },
  };
  const NOKO_COLORS = ["#FF8A5B", "#3A86FF", "#2BB673", "#9B5DE5", "#F15BB5", "#F4B400"];
  const DEFAULT_ANIM = "twinkle";
  let island = 1;
  let current = "scr-home";

  /* ---------------- util umum ---------------- */
  function show(id) {
    SCREENS.forEach((s) => { const el = $(s); if (el) el.hidden = s !== id; });
    current = id;
    const el = $(id);
    if (el && el.classList.contains("page")) el.scrollTop = 0;
  }

  function toast(html, ms = 2600, cls = "") {
    const box = $("toasts");
    const t = document.createElement("div");
    t.className = "toast " + cls;
    t.setAttribute("role", "status");
    t.innerHTML = html;
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, ms);
  }

  /* lencana baru selalu diumumkan, bergiliran */
  const badgeQ = [];
  let badgeBusy = false;
  function announceBadges(list) {
    (list || []).forEach((b) => {
      const o = typeof b === "string" ? KA.economy.BADGES.find((x) => x.id === b) : b;
      if (o) badgeQ.push(o);
    });
    pumpBadges();
  }
  function pumpBadges() {
    if (badgeBusy || !badgeQ.length) return;
    badgeBusy = true;
    const b = badgeQ.shift();
    sfx("badge");
    toast(`<span class="toast-ic">${ic(b.icon, 28)}</span><span class="toast-txt"><small>Lencana baru!</small><b>${esc(b.name)}</b></span>`, 3200, "badge");
    setTimeout(() => { badgeBusy = false; pumpBadges(); }, 1900);
  }
  function badges(ctx) { announceBadges(KA.economy.checkBadges(ctx || {})); }

  /* tombol berbahaya: ketukan pertama minta konfirmasi, ketukan kedua menjalankan */
  function twoTap(btn, onConfirm, label = "Yakin?") {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.classList.contains("confirm")) {
        clearTimeout(btn._t);
        btn.classList.remove("confirm");
        btn.innerHTML = btn._orig;
        btn.setAttribute("aria-label", btn._label || "");
        onConfirm();
        return;
      }
      btn._orig = btn.innerHTML;
      btn._label = btn.getAttribute("aria-label") || "";
      btn.classList.add("confirm");
      btn.innerHTML = `${ic("trash", 18)}<span>${label}</span>`;
      btn.setAttribute("aria-label", label + " Ketuk lagi untuk menghapus");
      sfx("click");
      btn._t = setTimeout(() => {
        btn.classList.remove("confirm");
        btn.innerHTML = btn._orig;
        btn.setAttribute("aria-label", btn._label);
      }, 2800);
    });
  }

  function noko(expr = "happy", size = 72, opt = {}) {
    const d = D();
    const o = { hat: opt.hat !== undefined ? opt.hat : (d.equipped && d.equipped.hat), color: opt.color || d.color };
    if (KA.icons.noko) return KA.icons.noko(expr, size, o);
    return ic("brush", size);
  }

  function dl(name, text, type) {
    const blob = text instanceof Blob ? text : new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function dateStr(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  function starsRow(n, size = 14, max = 3) {
    let h = "";
    for (let i = 0; i < max; i++) h += `<span class="cstar${i < n ? " lit" : ""}">${ic("star", size, "", true)}</span>`;
    return `<span class="stars" aria-label="${n} bintang">${h}</span>`;
  }

  /* ---------------- modal umum ---------------- */
  let modalDone = null;
  function openModal(html, cls = "", onClose = null) {
    const card = $("modalBoxCard");
    card.className = "modal-card " + cls;
    card.innerHTML = html;
    $("modalBox").hidden = false;
    modalDone = onClose;
    const f = card.querySelector("[data-focus]") || card.querySelector("button");
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
    return card;
  }
  function closeModal() {
    $("modalBox").hidden = true;
    const cb = modalDone;
    modalDone = null;
    if (cb) cb();
  }

  function applyMotion() {
    const st = S().settings || {};
    document.body.classList.toggle("reduce-motion", !!S().reduceMotion());
    document.body.classList.toggle("motion-ok", st.reduceMotion === false);
  }

  /* ---------------- karya: bingkai + animasi hidup ---------------- */
  function themeOf(entry) {
    const p = entry && entry.paper;
    if (p === "paper_blueprint") return "t1";
    if (p === "paper_grass") return "t2";
    if (p === "paper_night") return "t4";
    return (entry && entry.theme) || "free";
  }
  function artFrame(entry, cssSize) {
    const fr = document.createElement("button");
    fr.className = "art-frame";
    fr.dataset.theme = themeOf(entry);
    fr.setAttribute("aria-label", "Putar animasi " + (entry.title || "karya"));
    const px = Math.min(640, Math.round(cssSize * Math.min(2, window.devicePixelRatio || 1)));
    let c;
    try { c = KA.art.renderArtwork(entry, px); } catch (e) { c = document.createElement("canvas"); }
    fr.appendChild(c);
    fr.addEventListener("click", () => playFrame(fr, entry.anim));
    return fr;
  }
  function playFrame(fr, anim) {
    if (fr.classList.contains("alive")) return;
    const a = anim || DEFAULT_ANIM;
    fr.classList.add("alive", "anim-" + a);
    sfx("magic");
    setTimeout(() => fr.classList.remove("alive", "anim-" + a), 2450);
  }

  /* ================= BERANDA ================= */
  function greetLine() {
    const d = D();
    const h = new Date().getHours();
    const name = (d.name || "").split(" ")[0];
    const pool = [
      name ? `Halo, ${name}!` : "Halo, teman!",
      h < 11 ? "Selamat pagi!" : h < 15 ? "Selamat siang!" : h < 18 ? "Selamat sore!" : "Selamat malam!",
      "Ayo menggambar!",
      "Gambarmu akan hidup!",
      "Siap berpetualang?",
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderHome() {
    const d = D();
    island = d.lastIsland && KA.levels.isIslandOpen(d.lastIsland) ? d.lastIsland : 1;
    document.body.dataset.island = island;
    $("homeNoko").innerHTML = noko("happy", 88);
    $("homeSay").textContent = greetLine();
    $("homeName").textContent = d.name || "Pemain";
    $("chipCoins").textContent = d.coins;
    $("chipStars").textContent = S().totalStars();
    renderDaily();
    renderTabs();
    renderGrid();
    renderPass();
    renderWall();
  }

  /* kartu Tantangan Harian di beranda */
  function renderDaily() {
    const btn = $("dailyCard");
    if (!btn || !KA.economy.dailyChallenge) return;
    const ch = KA.economy.dailyChallenge();
    const lv = ch.level;
    btn.classList.toggle("done", !!ch.done);
    btn.innerHTML = `
      <span class="daily-thumb">${KA.icons.thumb(lv, 46)}</span>
      <span class="daily-info">
        <small>${ic("flag", 13)} Tantangan Harian</small>
        <b>${esc(lv.name)} · ${ic(ch.icon, 14)} ${esc(ch.label)}</b>
        <span class="daily-meta">${ch.done ? `${ic("check", 14)} Tuntas hari ini` : `Target ${starsRow(ch.target, 12, ch.target)}`}
          ${ch.streakNow ? `<span class="daily-streak">${ic("flame", 13)} ${ch.streakNow} hari</span>` : ""}</span>
      </span>
      <span class="daily-go">${ic(ch.done ? "retry" : "play", 22)}</span>`;
    btn.onclick = () => { sfx("click"); KA.main.startDaily(); };
  }

  /* Buku Mewarnai: halaman dari level gambar yang sudah lulus */
  function openColoringBook() {
    const levels = KA.levels.drawingLevels();
    const open = (lv) => ((S().level(lv.id) || {}).stars || 0) >= 1;
    const nOpen = levels.filter(open).length;
    const cells = levels.map((lv) => {
      const ok = open(lv);
      return `<button class="book-cell${ok ? "" : " locked"}" data-id="${lv.id}" ${ok ? "" : "disabled"} aria-label="${esc(lv.name)}${ok ? "" : ", terkunci"}">
        <span class="book-thumb" data-island="${lv.island}">${ok ? KA.icons.thumb(lv, 48) : ic("lock", 22)}</span>
        <small>${esc(lv.name)}</small></button>`;
    }).join("");
    openModal(`
      <h2>${ic("bucket", 24)} Buku Mewarnai</h2>
      <p class="hint-line">${nOpen ? `${nOpen} halaman terbuka. Lulus level gambar untuk membuka halaman baru.` : "Lulus level gambar untuk membuka halaman pertama."}</p>
      <div class="book-grid">${cells}</div>
      <button class="modal-btn" data-act="ok">${ic("back", 18)} Tutup</button>`, "book-modal");
    const card = $("modalBoxCard");
    card.querySelector("[data-act=ok]").addEventListener("click", () => { sfx("click"); closeModal(); });
    card.querySelectorAll(".book-cell:not(.locked)").forEach((b) => b.addEventListener("click", () => {
      closeModal();
      KA.main.startColoringPage(+b.dataset.id);
    }));
  }

  function islandStars(levels, i) {
    return KA.levels.islandLevels(i).reduce((s, lv) => s + ((levels[lv.id] || {}).stars || 0), 0);
  }

  function renderTabs() {
    const tabs = $("islandTabs");
    tabs.innerHTML = "";
    for (const isl of KA.levels.islands) {
      const open = KA.levels.isIslandOpen(isl.id);
      const b = document.createElement("button");
      b.className = "island-tab" + (isl.id === island ? " active" : "") + (open ? "" : " locked");
      b.dataset.island = isl.id;
      b.setAttribute("aria-pressed", isl.id === island ? "true" : "false");
      b.setAttribute("aria-label", `Pulau ${isl.id}, ${isl.name}${open ? "" : ", terkunci"}`);
      const st = islandStars(D().levels, isl.id);
      b.innerHTML = `<span class="tab-ic">${ic(open ? isl.icon : "lock", 24)}</span>
        <span class="tab-name">${esc(isl.name)}</span>
        <small>${open ? `${ic("star", 11, "", true)} ${st}/${KA.levels.islandLevels(isl.id).length * 3}` : "Terkunci"}</small>`;
      b.addEventListener("click", () => {
        if (!open) {
          sfx("denied");
          toast(`${ic("lock", 18)} Kalahkan hantu pulau sebelumnya!`);
          return;
        }
        sfx("click");
        island = isl.id;
        S().setLastIsland(isl.id);
        renderHome();
        maybeIslandIntro();
        if (KA.main && KA.main.playMusic) KA.main.playMusic();
      });
      tabs.appendChild(b);
    }
    const isl = KA.levels.island(island);
    $("islandLine").innerHTML = `${ic(isl.icon, 18)} Pulau ${island} · <b>${esc(isl.name)}</b>`;
  }

  function renderGrid() {
    const grid = $("levelGrid");
    grid.innerHTML = "";
    for (const lv of KA.levels.islandLevels(island)) {
      const rec = S().level(lv.id) || {};
      const unlocked = KA.levels.isUnlocked(lv.id);
      const m = MODE[lv.mode] || MODE.tiru;
      const card = document.createElement("button");
      const isNalar = lv.mode === "nalar";
      const pz = isNalar && KA.puzzles ? KA.puzzles.get(lv.puzzleId) : null;
      card.className = "level-card" + (unlocked ? "" : " locked") + (lv.boss ? " boss" : "") + (isNalar ? " nalar" : "") + (rec.stars ? " done" : "");
      card.setAttribute("aria-label", `${lv.name}, mode ${m.label}, ${rec.stars || 0} bintang${unlocked ? "" : ", terkunci"}`);
      const sub = lv.boss
        ? (rec.bossWon ? "Hantu kalah!" : "Duel Hantu")
        : isNalar ? ((pz && pz.topic) || "Nalar")
        : rec.done ? "Rekor " + (rec.best || 0) : m.label;
      const thumb = isNalar ? `<span class="nalar-thumb">${ic("bulb", 40)}</span>` : KA.icons.thumb(lv, 52);
      card.innerHTML = `
        <span class="mode-ic" title="${m.label}">${ic(m.icon, 16)}</span>
        <span class="thumb-wrap">${thumb}${unlocked ? "" : `<span class="lock-badge">${ic("lock", 14)}</span>`}</span>
        <span class="name">${esc(lv.name)}</span>
        ${starsRow(rec.stars || 0, 13)}
        <span class="best">${esc(sub)}</span>`;
      card.addEventListener("click", () => {
        if (!unlocked) {
          sfx("denied");
          toast(`${ic("lock", 18)} Dapatkan 1 bintang di level sebelumnya`);
          return;
        }
        KA.main.startLevel(lv);
      });
      grid.appendChild(card);
    }
  }

  function renderPass() {
    const tiers = KA.economy.PASS_TIERS || [];
    const stars = S().totalStars();
    const done = D().pass || 0;
    const next = tiers.find((t) => t.tier > done);
    const bar = $("passRow");
    if (!next) {
      bar.innerHTML = `<span class="pass-label">${ic("trophy", 18)} Jalan Bintang tamat! Kamu legenda!</span>`;
      return;
    }
    const prev = tiers.find((t) => t.tier === next.tier - 1);
    const lo = prev ? prev.req : 0;
    const frac = Math.max(0, Math.min(1, (stars - lo) / Math.max(1, next.req - lo)));
    bar.innerHTML = `
      <span class="pass-label">${ic("flag", 18)} Jalan Bintang <b>${next.tier}</b>/${tiers.length}</span>
      <span class="pass-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(frac * 100)}"><span style="width:${frac * 100}%"></span></span>
      <span class="pass-req">${ic("star", 13, "ic-star", true)} ${stars}/${next.req} <span class="pass-gift">${ic("gift", 15)} +${next.reward}</span></span>`;
  }

  function renderWall() {
    const d = D();
    const g = $("wallGrid");
    g.innerHTML = "";
    const items = (d.wall || []).map((id) => (d.gallery || []).find((e) => e.id === id)).filter(Boolean).slice(0, 6);
    if (!items.length) {
      g.innerHTML = `<p class="empty-note">${ic("pin", 20)} Pajang karya terbaikmu dari Galeri di sini.</p>`;
      return;
    }
    items.forEach((e) => {
      const cell = document.createElement("div");
      cell.className = "wall-cell";
      cell.appendChild(artFrame(e, 104));
      g.appendChild(cell);
    });
  }

  /* dipanggil saat tiba di beranda: bonus harian & kartu pembuka pulau */
  function arriveHome() {
    renderHome();
    const bonus = KA.economy.dailyBonus(); /* sudah menambah koin sendiri */
    if (bonus > 0) {
      $("chipCoins").textContent = D().coins;
      sfx("coin");
      toast(`${ic("gift", 22)} Bonus harian <b>+${bonus}</b> ${ic("coin", 18, "ic-coin")}`, 3000, "gold");
      $("homeSay").textContent = "Ada hadiah harian!";
    }
    maybeIslandIntro();
  }

  function maybeIslandIntro() {
    const seen = D().seenIslands || [];
    if (seen.includes(island) || !$("modalBox").hidden) return;
    const isl = KA.levels.island(island);
    document.body.dataset.island = island;
    openModal(`
      <div class="island-card" data-island="${isl.id}">
        <div class="island-badge">${ic(isl.icon, 44)}</div>
        <p class="kicker">Pulau ${isl.id}</p>
        <h2>${esc(isl.name)}</h2>
        <div class="noko-line"><span class="noko-mid">${noko("wow", 72)}</span><p class="bubble">${esc(isl.intro || "Ayo berpetualang!")}</p></div>
        <button class="modal-btn primary" data-act="ok" data-focus>${ic("next", 20)} Ayo!</button>
      </div>`, "island-modal");
    S().markIslandSeen(island);
    sfx("magic");
    $("modalBoxCard").querySelector("[data-act=ok]").addEventListener("click", () => { sfx("click"); closeModal(); });
  }

  /* ================= INTRO & PEMILIH PROFIL ================= */
  function showIntro(done) {
    const rows = [
      ["pencil", "Ikuti garis, mulai dari titik hijau"],
      ["sparkle", "Gambar yang rapi akan hidup"],
      ["ghost", "Kalahkan Hantu Skor di ujung pulau"],
    ];
    openModal(`
      <div class="intro">
        <span class="noko-mid">${noko("wow", 96)}</span>
        <h2>Halo, aku Noko!</h2>
        <ul class="intro-list">${rows.map(([i, t]) => `<li>${ic(i, 26)}<span>${t}</span></li>`).join("")}</ul>
        <button class="modal-btn primary big" data-act="ok" data-focus>${ic("play", 22)} Ayo mulai!</button>
      </div>`, "intro-modal", done);
    $("modalBoxCard").querySelector("[data-act=ok]").addEventListener("click", () => {
      S().markIntro();
      if (KA.audio.unlock) KA.audio.unlock();
      sfx("click");
      closeModal();
    });
  }

  function pickProfile(done) {
    const list = S().listProfiles();
    const card = openModal(`
      <h2>Siapa yang bermain?</h2>
      <div class="profile-pick">${list.map((p) => `
        <button class="pick-btn${p.id === S().activeId ? " active" : ""}" data-id="${esc(p.id)}">
          <span class="noko-sm">${noko("happy", 60, { color: p.color, hat: null })}</span>
          <b>${esc(p.name)}</b><small>${ic("star", 12, "", true)} ${p.stars || 0}</small>
        </button>`).join("")}</div>`, "pick-modal", done);
    card.querySelectorAll(".pick-btn").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.id;
      if (String(id) !== String(S().activeId)) switchTo(id);
      sfx("click");
      closeModal();
    }));
  }

  function switchTo(id) {
    const p = S().listProfiles().find((x) => String(x.id) === String(id));
    S().switchProfile(p ? p.id : id);
    if (KA.main && KA.main.onProfileChanged) KA.main.onProfileChanged();
  }

  /* ================= TOKO ================= */
  const SLOTS = [
    { id: "pen", name: "Pensil", icon: "pencil" },
    { id: "hat", name: "Topi", icon: "hat" },
    { id: "paper", name: "Kertas", icon: "paper" },
    { id: "stickers", name: "Stiker", icon: "sticker" },
    { id: "music", name: "Musik", icon: "music" },
    { id: "passive", name: "Bantuan", icon: "bulb" },
  ];
  const EQUIPPABLE = { pen: true, hat: true, paper: true, music: true };
  let shopSlot = "pen";
  let previewHat;

  function openShop(slot) {
    if (slot) shopSlot = slot;
    previewHat = undefined;
    show("scr-shop");
    renderShop();
  }

  function owns(it) { return !!(it.alwaysOwned || S().owns(it.id)); }
  function equippedId(slot) { return (D().equipped || {})[slot] || null; }

  function stampPreview(packId, size = 22) {
    const ids = (KA.economy.STICKER_PACKS || {})[packId] || [];
    const st = (KA.art && KA.art.STAMPS) || {};
    return ids.map((id) => st[id]
      ? `<svg class="ic stamp-ic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${st[id].d}" fill="currentColor"/></svg>`
      : "").join("");
  }

  function renderShop() {
    const d = D();
    $("shopCoins").textContent = d.coins;
    const hat = previewHat !== undefined ? previewHat : equippedId("hat");
    const items = KA.economy.ITEMS.filter((it) => it.slot === shopSlot);
    const say = shopSlot === "hat" ? (previewHat !== undefined ? "Cocok untukku?" : "Pilih topiku!")
      : shopSlot === "passive" ? "Bantuan diam-diam!" : "Mau beli apa?";
    $("shopBody").innerHTML = `
      <div class="shop-hero">
        <span class="noko-mid">${noko(previewHat !== undefined ? "wow" : "happy", 96, { hat })}</span>
        <p class="bubble">${say}</p>
      </div>
      <div class="seg-tabs" role="tablist">${SLOTS.map((s) => `
        <button role="tab" class="seg${s.id === shopSlot ? " active" : ""}" data-slot="${s.id}" aria-selected="${s.id === shopSlot}">
          ${ic(s.icon, 20)}<span>${s.name}</span></button>`).join("")}</div>
      <div class="shop-list">${items.map((it) => shopRow(it, hat)).join("")}</div>`;
    const body = $("shopBody");
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => {
      shopSlot = b.dataset.slot;
      previewHat = undefined;
      sfx("click");
      renderShop();
    }));
    body.querySelectorAll(".shop-item").forEach((row) => {
      const it = KA.economy.ITEMS.find((x) => x.id === row.dataset.id);
      if (it.slot === "hat") row.addEventListener("click", () => {
        previewHat = it.id;
        sfx("click");
        renderShop();
      });
      const btn = row.querySelector("button.act");
      if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); shopAct(it); });
    });
  }

  function shopRow(it, previewing) {
    const o = owns(it);
    const eq = equippedId(it.slot) === it.id || (it.slot === "pen" && it.id === "default" && !equippedId("pen"));
    let btn;
    if (!o) {
      const poor = D().coins < it.price;
      btn = `<button class="act buy${poor ? " poor" : ""}" aria-label="Beli ${esc(it.name)} ${it.price} koin">${ic("coin", 16, "ic-coin")} ${it.price}</button>`;
    } else if (EQUIPPABLE[it.slot]) {
      btn = eq
        ? (it.slot === "pen" ? `<span class="tag on">${ic("check", 16)} Dipakai</span>`
          : `<button class="act off" aria-label="Lepas ${esc(it.name)}">${ic("check", 16)} Dipakai</button>`)
        : `<button class="act equip">Pakai</button>`;
    } else {
      btn = `<span class="tag on">${ic("check", 16)} Aktif</span>`;
    }
    const icon = it.slot === "stickers" ? `<span class="stamp-set">${stampPreview(it.id)}</span>`
      : it.slot === "hat" ? `<span class="noko-xs">${noko("happy", 44, { hat: it.id })}</span>`
      : ic(it.icon, 30);
    return `<div class="shop-item${o ? " owned" : ""}${eq ? " equipped" : ""}${previewing === it.id && it.slot === "hat" ? " previewing" : ""}" data-id="${it.id}" data-slot="${it.slot}">
      <span class="item-ic">${icon}</span>
      <span class="info"><b>${esc(it.name)}</b><small>${esc(it.desc || "")}</small></span>
      ${btn}</div>`;
  }

  function shopAct(it) {
    const o = owns(it);
    if (!o) {
      if (!S().buy(it.id, it.price)) {
        sfx("denied");
        toast(`${ic("coin", 18, "ic-coin")} Koinnya belum cukup. Ayo menggambar lagi!`);
        return;
      }
      sfx("buy");
      if (EQUIPPABLE[it.slot]) S().equip(it.slot, it.id);
      toast(`${ic(it.icon, 20)} <b>${esc(it.name)}</b> jadi milikmu!`, 2600, "gold");
      badges({});
      if (it.slot === "music" && KA.main.playMusic) KA.main.playMusic();
    } else if (EQUIPPABLE[it.slot]) {
      const eq = equippedId(it.slot) === it.id;
      if (eq && it.slot === "pen") return;
      S().equip(it.slot, eq ? (it.slot === "pen" ? "default" : null) : it.id);
      sfx("click");
      if (it.slot === "music" && KA.main.playMusic) KA.main.playMusic();
    }
    if (it.slot === "hat") previewHat = undefined;
    renderShop();
  }

  /* ================= GALERI ================= */
  function openGallery() {
    show("scr-gallery");
    renderGallery();
  }

  function renderGallery() {
    const d = D();
    const g = d.gallery || [];
    $("galleryCount").textContent = `${g.length}/30`;
    const body = $("galleryBody");
    body.innerHTML = "";
    if (!g.length) {
      body.innerHTML = `<div class="empty-big"><span class="noko-mid">${noko("oops", 90)}</span>
        <p><b>Galeri masih kosong.</b><br>Selesaikan level atau coba Kanvas Bebas!</p></div>`;
      return;
    }
    body.insertAdjacentHTML("beforeend", `<p class="hint-line">${ic("play", 16)} Ketuk gambar untuk menghidupkannya.</p>`);
    const grid = document.createElement("div");
    grid.className = "gallery-grid";
    body.appendChild(grid);
    g.forEach((e) => {
      const onWall = (d.wall || []).includes(e.id);
      const card = document.createElement("article");
      card.className = "gallery-card" + (onWall ? " pinned" : "");
      card.appendChild(artFrame(e, 170));
      const info = document.createElement("div");
      info.className = "g-info";
      info.innerHTML = `<b>${esc(e.title || "Karya")}</b>
        <span class="g-meta">${e.kind === "level" ? starsRow(e.stars || 0, 12) : e.kind === "coloring" ? `<span class="g-free">${ic("bucket", 13)} Mewarnai</span>` : `<span class="g-free">${ic("palette", 13)} Bebas</span>`}
        <small>${dateStr(e.created)}</small></span>`;
      card.appendChild(info);
      const acts = document.createElement("div");
      acts.className = "g-acts";
      acts.innerHTML = `
        <button class="mini-btn" data-a="color" aria-label="Warnai">${ic("bucket", 18)}</button>
        <button class="mini-btn${onWall ? " on" : ""}" data-a="pin" aria-label="${onWall ? "Lepas dari Dinding" : "Pajang di Dinding"}" aria-pressed="${onWall}">${ic("pin", 18)}</button>
        <button class="mini-btn" data-a="dl" aria-label="Unduh PNG">${ic("download", 18)}</button>
        <button class="mini-btn danger" data-a="del" aria-label="Hapus karya">${ic("trash", 18)}</button>`;
      card.appendChild(acts);
      acts.querySelector("[data-a=color]").addEventListener("click", () => KA.main.startColor(e, "gallery"));
      acts.querySelector("[data-a=pin]").addEventListener("click", () => {
        const was = (D().wall || []).includes(e.id);
        S().toggleWall(e.id);
        const now = (D().wall || []).includes(e.id);
        if (!was && !now) {
          sfx("denied");
          toast(`${ic("pin", 18)} Dinding penuh (maks. 6 karya)`);
          return;
        }
        sfx(now ? "stamp" : "click");
        if (now) toast(`${ic("pin", 18)} Dipajang di Dinding Keluarga!`);
        badges({});
        renderGallery();
      });
      acts.querySelector("[data-a=dl]").addEventListener("click", () => {
        sfx("click");
        try { KA.art.exportPNG(e); } catch (err) { toast("Gagal mengunduh gambar"); }
      });
      twoTap(acts.querySelector("[data-a=del]"), () => {
        S().removeGallery(e.id);
        sfx("undo");
        renderGallery();
      }, "Hapus?");
      grid.appendChild(card);
    });
  }

  /* ================= LENCANA ================= */
  const BRANCHES = [
    { id: "presisi", name: "Presisi", icon: "target" },
    { id: "petualang", name: "Petualang", icon: "flag" },
    { id: "kreatif", name: "Kreatif", icon: "palette" },
    { id: "nalar", name: "Nalar", icon: "bulb" },
  ];
  function openBadges() {
    show("scr-badges");
    const all = KA.economy.BADGES;
    const got = all.filter((b) => S().hasBadge(b.id)).length;
    $("badgeCount").textContent = `${got}/${all.length}`;
    $("badgesBody").innerHTML = BRANCHES.map((br) => {
      const list = all.filter((b) => b.branch === br.id);
      if (!list.length) return "";
      const n = list.filter((b) => S().hasBadge(b.id)).length;
      return `<section class="branch" data-branch="${br.id}">
        <h2 class="sec-title">${ic(br.icon, 20)} ${br.name} <small>${n}/${list.length}</small></h2>
        <div class="badge-grid">${list.map((b) => {
          const own = S().hasBadge(b.id);
          return `<div class="badge-card${own ? " own" : ""}">
            <span class="badge-ic">${ic(own ? b.icon : "lock", 30)}</span>
            <b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`;
        }).join("")}</div></section>`;
    }).join("");
  }

  /* ================= KELUARGA ================= */
  let famForm = null; // null | {mode:'add'} | {mode:'edit', id}

  function openFamily() {
    famForm = null;
    show("scr-family");
    renderFamily();
  }

  function renderFamily() {
    const list = S().listProfiles();
    const active = S().activeId;
    const body = $("familyBody");
    const formHtml = () => {
      const p = famForm.mode === "edit" ? list.find((x) => String(x.id) === String(famForm.id)) : null;
      const col = famForm.color || (p && p.color) || NOKO_COLORS[list.length % NOKO_COLORS.length];
      famForm.color = col;
      return `<form class="fam-form" autocomplete="off">
        <span class="noko-mid">${noko("happy", 76, { color: col, hat: null })}</span>
        <label class="field"><span>Nama</span><input id="famName" maxlength="12" required value="${esc(p ? p.name : "")}" placeholder="Nama anak" data-focus></label>
        <div class="field"><span>Warna Noko</span><div class="color-pick">${NOKO_COLORS.map((c, i) =>
          `<button type="button" class="swatch${c === col ? " active" : ""}" data-col="${c}" style="--sw:${c}" aria-label="Warna ${i + 1}" aria-pressed="${c === col}"></button>`).join("")}</div></div>
        <div class="form-btns">
          <button type="button" class="modal-btn" data-a="cancel">Batal</button>
          <button type="submit" class="modal-btn primary">${ic("check", 18)} Simpan</button>
        </div></form>`;
    };

    body.innerHTML = `
      <div class="profile-list">${list.map((p) => `
        <div class="profile-card${String(p.id) === String(active) ? " active" : ""}" data-id="${esc(p.id)}">
          <button class="profile-main" data-a="use" aria-label="Main sebagai ${esc(p.name)}">
            <span class="noko-sm">${noko("happy", 56, { color: p.color, hat: null })}</span>
            <span class="p-info"><b>${esc(p.name)}</b><small>${ic("star", 12, "", true)} ${p.stars || 0} bintang${String(p.id) === String(active) ? " · sedang main" : ""}</small></span>
          </button>
          <button class="mini-btn" data-a="edit" aria-label="Ubah ${esc(p.name)}">${ic("pencil", 18)}</button>
          ${list.length > 1 ? `<button class="mini-btn danger" data-a="del" aria-label="Hapus profil ${esc(p.name)}">${ic("trash", 18)}</button>` : ""}
        </div>`).join("")}</div>
      ${famForm ? formHtml() : (list.length < 4
        ? `<button class="wide-btn" data-a="add">${ic("user", 20)} Tambah profil (${list.length}/4)</button>`
        : `<p class="empty-note">Maksimal 4 profil.</p>`)}
      <h2 class="sec-title">${ic("trophy", 20)} Papan Keluarga</h2>
      <div class="board">${list.map(boardRow).join("")}</div>
      <button class="wide-btn ghosty" data-a="report">${ic("chart", 20)} Laporan Orang Tua/Guru</button>`;

    body.querySelectorAll(".profile-card").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector("[data-a=use]").addEventListener("click", () => {
        if (String(id) === String(S().activeId)) { sfx("click"); return; }
        switchTo(id);
        sfx("click");
        toast(`${ic("user", 18)} Halo, <b>${esc(D().name)}</b>!`);
        renderFamily();
      });
      row.querySelector("[data-a=edit]").addEventListener("click", () => {
        famForm = { mode: "edit", id };
        sfx("click");
        renderFamily();
      });
      const del = row.querySelector("[data-a=del]");
      if (del) twoTap(del, () => {
        const realId = (S().listProfiles().find((x) => String(x.id) === String(id)) || {}).id;
        S().deleteProfile(realId !== undefined ? realId : id);
        if (KA.main && KA.main.onProfileChanged) KA.main.onProfileChanged();
        sfx("undo");
        renderFamily();
      }, "Hapus?");
    });
    const add = body.querySelector("[data-a=add]");
    if (add) add.addEventListener("click", () => { famForm = { mode: "add" }; sfx("click"); renderFamily(); });
    body.querySelector("[data-a=report]").addEventListener("click", () => gate(openReport));

    const form = body.querySelector(".fam-form");
    if (form) {
      const nameEl = form.querySelector("#famName");
      setTimeout(() => nameEl.focus({ preventScroll: true }), 30);
      form.querySelectorAll("[data-col]").forEach((b) => b.addEventListener("click", () => {
        famForm.color = b.dataset.col;
        const keep = nameEl.value;
        renderFamily();
        const n = $("famName");
        if (n) n.value = keep;
      }));
      form.querySelector("[data-a=cancel]").addEventListener("click", () => { famForm = null; renderFamily(); });
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = nameEl.value.trim().slice(0, 12);
        if (!name) { nameEl.focus(); return; }
        if (famForm.mode === "add") {
          const id = S().addProfile(name, famForm.color);
          if (id == null) { sfx("denied"); toast("Profil sudah penuh"); return; }
          toast(`${ic("user", 18)} Profil <b>${esc(name)}</b> dibuat!`);
        } else {
          const realId = (S().listProfiles().find((x) => String(x.id) === String(famForm.id)) || {}).id;
          S().renameProfile(realId !== undefined ? realId : famForm.id, name, famForm.color);
          if (KA.main && KA.main.onProfileChanged) KA.main.onProfileChanged();
        }
        sfx("buy");
        famForm = null;
        renderFamily();
      });
    }
  }

  function boardRow(p) {
    let pd = null;
    try { pd = S().profileData(p.id); } catch (e) { pd = null; }
    const levels = (pd && pd.levels) || {};
    const cells = KA.levels.islands.map((isl) => {
      let s = 0, a = 0;
      KA.levels.islandLevels(isl.id).forEach((lv) => {
        const r = levels[lv.id];
        if (r && r.grade === "S") s++;
        else if (r && r.grade === "A") a++;
      });
      return `<div class="b-cell" data-island="${isl.id}" title="${esc(isl.name)}">
        <span class="b-ic">${ic(isl.icon, 16)}</span>
        <b>${ic("star", 11, "", true)} ${islandStars(levels, isl.id)}</b>
        <small>S ${s} · A ${a}</small></div>`;
    }).join("");
    return `<div class="board-row"><div class="b-name"><span class="noko-xs">${noko("happy", 36, { color: p.color, hat: null })}</span><b>${esc(p.name)}</b></div><div class="b-cells">${cells}</div></div>`;
  }

  /* ================= PENGATURAN ================= */
  function openSettings() {
    show("scr-settings");
    renderSettings();
  }

  function renderSettings() {
    const st = S().settings || {};
    const toggle = (k, icon, label, hint) => `
      <div class="set-row">
        <span class="set-ic">${ic(icon, 24)}</span>
        <span class="set-txt"><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span>
        <button class="switch" role="switch" aria-checked="${!!st[k]}" aria-label="${label}" data-k="${k}"><i></i></button>
      </div>`;
    const rm = st.reduceMotion;
    const musicItems = KA.economy.ITEMS.filter((it) => it.slot === "music");
    const curMus = equippedId("music");
    $("settingsBody").innerHTML = `
      <div class="set-card">
        ${toggle("soundOn", "vol", "Suara", "Bunyi pena, bintang, koin")}
        ${toggle("musicOn", "music", "Musik", "Lagu latar")}
        ${toggle("showTimer", "clock", "Tampilkan waktu", "Waktu tidak memengaruhi skor")}
        ${toggle("vibrate", "zap", "Getar", "Getar halus saat menggambar")}
        <div class="set-row col">
          <span class="set-ic">${ic("sparkle", 24)}</span>
          <span class="set-txt"><b>Kurangi gerak</b><small>Animasi lebih tenang</small></span>
          <div class="seg-mini" role="radiogroup" aria-label="Kurangi gerak">
            ${[[null, "Ikuti perangkat"], [true, "Nyala"], [false, "Mati"]].map(([v, l]) =>
              `<button role="radio" class="seg${rm === v ? " active" : ""}" aria-checked="${rm === v}" data-rm="${v}">${l}</button>`).join("")}
          </div>
        </div>
      </div>
      <h2 class="sec-title">${ic("music", 20)} Kotak Musik</h2>
      <div class="set-card">
        <button class="mus-row${!curMus ? " active" : ""}" data-mus="">${ic("flag", 22)}<span><b>Lagu Pulau</b><small>Berganti sesuai pulau</small></span>${!curMus ? ic("check", 20) : ""}</button>
        ${musicItems.map((it) => {
          const o = owns(it);
          return `<button class="mus-row${curMus === it.id ? " active" : ""}${o ? "" : " locked"}" data-mus="${it.id}">
            ${ic(o ? it.icon || "music" : "lock", 22)}<span><b>${esc(it.name)}</b><small>${o ? esc(it.desc || "") : "Beli di Toko"}</small></span>${curMus === it.id ? ic("check", 20) : ""}</button>`;
        }).join("")}
      </div>
      <div class="set-links">
        <button class="wide-btn" data-a="family">${ic("users", 20)} Profil Keluarga</button>
        <button class="wide-btn ghosty" data-a="report">${ic("chart", 20)} Laporan Orang Tua/Guru</button>
      </div>`;
    const body = $("settingsBody");
    body.querySelectorAll(".switch").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.k;
      const v = !(S().settings || {})[k];
      S().setSetting(k, v);
      if (k === "soundOn" && v) { if (KA.audio.unlock) KA.audio.unlock(); sfx("click"); }
      if (k === "musicOn") { if (v) { if (KA.audio.unlock) KA.audio.unlock(); KA.main.playMusic(); } else KA.audio.stopMusic(); }
      if (k !== "soundOn") sfx("click");
      renderSettings();
    }));
    body.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => {
      const raw = b.dataset.rm;
      S().setSetting("reduceMotion", raw === "null" ? null : raw === "true");
      applyMotion();
      sfx("click");
      renderSettings();
    }));
    body.querySelectorAll("[data-mus]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.mus || null;
      if (id && !S().owns(id)) { sfx("denied"); openShop("music"); return; }
      S().equip("music", id);
      sfx("click");
      if (KA.main.playMusic) KA.main.playMusic();
      renderSettings();
    }));
    body.querySelector("[data-a=family]").addEventListener("click", () => { sfx("click"); openFamily(); });
    body.querySelector("[data-a=report]").addEventListener("click", () => gate(openReport));
  }

  /* ================= GERBANG DEWASA ================= */
  function gate(onPass) {
    const a = 6 + Math.floor(Math.random() * 4);
    const b = 3 + Math.floor(Math.random() * 7);
    const ans = a * b;
    const opts = new Set([ans]);
    const cand = [ans + a, ans - b, ans + b, ans - a, ans + 10, ans - 1];
    while (opts.size < 3) opts.add(cand[Math.floor(Math.random() * cand.length)]);
    const arr = [...opts].sort(() => Math.random() - 0.5);
    const card = openModal(`
      <div class="gate">
        <span class="gate-ic">${ic("lock", 34)}</span>
        <h2>Khusus orang dewasa</h2>
        <p>Berapa hasil <b>${a} × ${b}</b>?</p>
        <div class="gate-opts">${arr.map((n) => `<button class="modal-btn" data-n="${n}">${n}</button>`).join("")}</div>
        <button class="link-btn" data-a="cancel">Batal</button>
      </div>`, "gate-modal");
    card.querySelectorAll("[data-n]").forEach((btn) => btn.addEventListener("click", () => {
      const ok = Number(btn.dataset.n) === ans;
      closeModal();
      if (ok) { sfx("click"); onPass(); }
      else { sfx("denied"); toast("Jawabannya belum tepat"); }
    }));
    card.querySelector("[data-a=cancel]").addEventListener("click", closeModal);
  }

  /* ================= LAPORAN ================= */
  function openReport() {
    show("scr-report");
    renderReport();
  }

  const avg = (arr, k) => arr.length ? arr.reduce((s, r) => s + (Number(r[k]) || 0), 0) / arr.length : 0;
  const r0 = (n) => Math.round(n);

  function trendSvg(A) {
    const pts = A.slice(-60);
    const W = 340, H = 150, L = 30, R = 8, T = 10, B = 22;
    const x = (i) => L + (pts.length < 2 ? (W - L - R) / 2 : (i * (W - L - R)) / (pts.length - 1));
    const y = (s) => T + (1 - Math.max(0, Math.min(1000, s)) / 1000) * (H - T - B);
    const lines = [550, 750, 900].map((v) =>
      `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 4}" y="${y(v) + 4}" class="gt">${v}</text>`).join("");
    const path = pts.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(r.score || 0).toFixed(1)}`).join(" ");
    const dots = pts.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.score || 0).toFixed(1)}" r="3" class="d s${r.stars || 0}"/>`).join("");
    return `<svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren skor ${pts.length} percobaan terakhir">
      <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" class="ax"/>${lines}
      <path d="${path}" class="ln"/>${dots}
      <text x="${L}" y="${H - 5}" class="gt start">lama</text><text x="${W - R}" y="${H - 5}" class="gt end">baru</text></svg>`;
  }

  /* Penalaran per topik Nalar: benar di percobaan pertama, petunjuk, jumlah percobaan */
  function reasoningSection(A, d) {
    const NZ = KA.levels.nalarLevels ? KA.levels.nalarLevels() : KA.levels.list.filter((l) => l.mode === "nalar");
    if (!NZ.length) return "";
    const rows = NZ.map((lv) => {
      const pz = KA.puzzles ? KA.puzzles.get(lv.puzzleId) : null;
      const at = A.filter((r) => r.levelId === lv.id && r.mode === "nalar");
      const correct = at.filter((r) => r.correct).length;
      const clean = at.filter((r) => r.correct && r.firstTry).length;
      const hinted = at.filter((r) => (r.hintLevel || 0) > 0);
      const maxHint = at.reduce((m, r) => Math.max(m, r.hintLevel || 0), 0);
      const stars = ((d.levels || {})[lv.id] || {}).stars || 0;
      const lastWrong = at.slice().reverse().find((r) => !r.correct && r.reason);
      return `<tr>
        <th scope="row"><b>${esc((pz && pz.topic) || lv.name)}</b><small>${esc(lv.name)} · Pulau ${lv.island}</small>${starsRow(stars, 11)}${lastWrong ? `<em>"${esc(lastWrong.reason)}"</em>` : ""}</th>
        <td>${at.length}</td><td>${at.length ? `${correct}` : "–"}</td><td>${at.length ? clean : "–"}</td>
        <td>${at.length ? (hinted.length ? `${hinted.length}× <small>maks ${maxHint}</small>` : "tidak") : "–"}</td></tr>`;
    }).join("");
    return `<section class="rep-card">
      <h2 class="sec-title">${ic("bulb", 20)} Penalaran</h2>
      <div class="table-wrap"><table class="reason-table">
        <thead><tr><th scope="col">Topik</th><th scope="col">Coba</th><th scope="col">Benar</th><th scope="col">Langsung benar</th><th scope="col">Petunjuk</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="privacy">"Langsung benar" = benar tanpa salah sekali pun. Kutipan miring = alasan salah terakhir dari penilai.</p>
    </section>`;
  }

  function renderReport() {
    const d = D();
    const A = (d.attempts || []).slice().sort((p, q) => String(p.t).localeCompare(String(q.t)));
    const mins = Math.round((d.playMs || 0) / 60000);
    const time = mins >= 60 ? `${Math.floor(mins / 60)} j ${mins % 60} m` : mins === 0 && d.playMs > 0 ? "< 1 m" : `${mins} m`;
    const done = KA.levels.list.filter((lv) => ((d.levels || {})[lv.id] || {}).stars >= 1).length;
    const AD = A.filter((r) => r.mode !== "nalar"); /* skor gambar; Nalar dilaporkan terpisah */
    const first = AD.slice(0, 10), last = AD.slice(-10);
    const SUBS = [["acc", "Ketepatan", "target"], ["comp", "Kelengkapan", "ruler"], ["neat", "Kerapian", "brush"], ["smooth", "Kelancaran", "pencil"]];
    const kil = A.filter((r) => r.mode === "kilat"), cer = A.filter((r) => r.mode === "cermin");
    const metric = (label, icon, val, note) => `<div class="metric">${ic(icon, 22)}<span><small>${label}</small><b>${val}</b><em>${note}</em></span></div>`;

    $("reportBody").innerHTML = `
      <p class="report-who">${ic("user", 18)} Profil: <b>${esc(d.name || "Pemain")}</b></p>
      <div class="tiles">
        <div class="tile">${ic("clock", 22)}<b>${time}</b><small>Waktu bermain</small></div>
        <div class="tile">${ic("pencil", 22)}<b>${A.length}</b><small>Percobaan tercatat</small></div>
        <div class="tile">${ic("flag", 22)}<b>${done}/${KA.levels.list.length}</b><small>Level tuntas</small></div>
        <div class="tile">${ic("star", 22, "", true)}<b>${S().totalStars()}/${KA.levels.totalStars}</b><small>Bintang</small></div>
      </div>
      <section class="rep-card">
        <h2 class="sec-title">${ic("chart", 20)} Tren skor</h2>
        ${AD.length ? trendSvg(AD) : `<p class="empty-note">Belum ada percobaan menggambar.</p>`}
      </section>
      <section class="rep-card">
        <h2 class="sec-title">${ic("target", 20)} Sub-skor: 10 awal vs 10 terakhir</h2>
        ${AD.length ? `<div class="cmp-legend"><i class="lg a"></i>10 awal <i class="lg b"></i>10 terakhir</div>
        <div class="cmp">${SUBS.map(([k, l, i]) => {
          const a = r0(avg(first, k)), b = r0(avg(last, k));
          const diff = b - a;
          return `<div class="cmp-row"><span class="cmp-l">${ic(i, 18)} ${l}</span>
            <span class="cmp-bars"><span class="bar a" style="width:${a}%"></span><span class="bar b" style="width:${b}%"></span></span>
            <span class="cmp-d ${diff > 0 ? "up" : diff < 0 ? "down" : ""}"><small>${a}→${b}</small><b>${diff > 0 ? "+" : ""}${diff}</b></span></div>`;
        }).join("")}</div>` : `<p class="empty-note">Belum ada data.</p>`}
      </section>
      <section class="rep-card">
        <h2 class="sec-title">${ic("sparkle", 20)} Keterampilan</h2>
        <div class="metrics">
          ${metric("Ingatan visual (Kelengkapan di Kilat)", "zap", kil.length ? r0(avg(kil, "comp")) : "–", `${kil.length} percobaan`)}
          ${metric("Simetri (skor Cermin)", "mirror", cer.length ? r0(avg(cer, "score")) : "–", `${cer.length} percobaan`)}
          ${metric("Kelancaran goresan", "pencil", AD.length ? r0(avg(last, "smooth")) : "–", AD.length ? `awal ${r0(avg(first, "smooth"))}` : "")}
          ${metric("Dibantu (Mode Bantu)", "wand", A.filter((r) => r.assisted).length, "percobaan")}
        </div>
      </section>
      ${reasoningSection(A, d)}
      <section class="rep-card">
        <h2 class="sec-title">${ic("download", 20)} Ekspor & cadangan</h2>
        <div class="exp-btns">
          <button class="wide-btn" data-a="csv">${ic("download", 20)} Unduh CSV percobaan</button>
          <button class="wide-btn" data-a="json">${ic("download", 20)} Cadangkan profil (JSON)</button>
          <button class="wide-btn ghosty" data-a="restore">${ic("upload", 20)} Pulihkan dari cadangan</button>
          <input type="file" id="restoreFile" accept=".json,application/json" hidden>
        </div>
        <p class="privacy">Data hanya tersimpan di perangkat ini dan tidak pernah dikirim ke mana pun. Untuk penelitian, gunakan data hanya dengan persetujuan orang tua dan izin etik lembaga.</p>
      </section>`;

    const body = $("reportBody");
    body.querySelector("[data-a=csv]").addEventListener("click", () => {
      const cols = ["t", "levelId", "name", "mode", "assisted", "dur", "score", "stars", "acc", "comp", "neat", "smooth", "strokes", "inkRatio",
        "correct", "hintLevel", "firstTry", "wrong", "reason"];
      const q = (v) => {
        const s = v == null ? "" : typeof v === "number" ? String(Math.round(v * 1000) / 1000) : String(v);
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [cols.join(",")].concat(A.map((r) => cols.map((c) => q(r[c])).join(","))).join("\n");
      dl(`kanvas-ajaib-${slug(d.name)}-percobaan.csv`, "﻿" + csv, "text/csv;charset=utf-8");
      sfx("click");
    });
    body.querySelector("[data-a=json]").addEventListener("click", () => {
      dl(`kanvas-ajaib-${slug(d.name)}-cadangan.json`, S().exportProfile(), "application/json");
      sfx("click");
    });
    const file = body.querySelector("#restoreFile");
    twoTap(body.querySelector("[data-a=restore]"), () => file.click(), "Timpa profil ini?");
    file.addEventListener("change", () => {
      const f = file.files && file.files[0];
      if (!f) return;
      f.text().then((txt) => {
        const ok = S().importProfile(txt);
        if (ok) {
          if (KA.main && KA.main.onProfileChanged) KA.main.onProfileChanged();
          sfx("buy");
          toast(`${ic("check", 18)} Profil berhasil dipulihkan`);
          renderReport();
        } else {
          sfx("denied");
          toast("Berkas cadangan tidak dikenali");
        }
      });
    });
  }

  function slug(s) { return String(s || "pemain").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pemain"; }

  /* ================= PASANG TOMBOL TETAP ================= */
  function init() {
    $("btnFree").addEventListener("click", () => { sfx("click"); KA.main.startFree(); });
    $("btnShop").addEventListener("click", () => { sfx("click"); openShop(); });
    $("btnGallery").addEventListener("click", () => { sfx("click"); openGallery(); });
    $("btnBook").addEventListener("click", () => { sfx("click"); openColoringBook(); });
    $("btnBadges").addEventListener("click", () => { sfx("click"); openBadges(); });
    $("btnFamily").addEventListener("click", () => { sfx("click"); openFamily(); });
    $("btnSettings").addEventListener("click", () => { sfx("click"); openSettings(); });
    $("chipProfile").addEventListener("click", () => {
      sfx("click");
      if (S().listProfiles().length > 1) pickProfile(() => { renderHome(); });
      else openFamily();
    });
    document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => KA.main.goHome()));
    $("homeNoko").addEventListener("click", () => {
      $("homeSay").textContent = greetLine();
      sfx("click");
    });
    $("modalBox").addEventListener("click", (e) => {
      if (e.target === $("modalBox") && $("modalBoxCard").classList.contains("gate-modal")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("modalBox").hidden && $("modalBoxCard").classList.contains("gate-modal")) closeModal();
    });
  }

  return {
    init, show, toast, twoTap, noko, announceBadges, badges, applyMotion, artFrame, playFrame, themeOf,
    renderHome, arriveHome, maybeIslandIntro, showIntro, pickProfile,
    openShop, openGallery, openColoringBook, openBadges, openFamily, openSettings, openReport, gate,
    openModal, closeModal, MODE, download: dl,
    get island() { return island; },
    get current() { return current; },
  };
})();

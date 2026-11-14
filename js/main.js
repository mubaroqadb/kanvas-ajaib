/* Kanvas Ajaib: boot, alur level, hasil, Kanvas Bebas, mode Warnai, musik */
window.KA = window.KA || {};

KA.main = (function () {
  const $ = (id) => document.getElementById(id);
  const ic = (n, s = 22, c = "", f = false) => KA.icons.svg(n, s, c, f);
  const UI = () => KA.screens;
  const S = () => KA.storage;
  const D = () => KA.storage.data;
  const E = () => KA.engine;
  function sfx(name, arg) {
    const f = KA.audio && KA.audio.sfx && KA.audio.sfx[name];
    if (typeof f === "function") { try { f(arg); } catch (e) { /* audio opsional */ } }
  }

  /* konteks permainan aktif:
     {kind:'level'|'free'|'color', lv, assisted, entry, from, t0, finished, saved, idea} */
  let G = null;
  let timerH = 0, overlayH = 0, sayH = 0, lastSay = 0, sayExpr = "";
  let resultCtx = null;

  const IDEAS = [
    ["Hewan kesukaan", "Gambar hewan kesukaanmu"],
    ["Rumah impian", "Gambar rumah impianmu"],
    ["Kendaraan ajaib", "Gambar kendaraan ajaib"],
    ["Wajah gembira", "Gambar wajah yang tersenyum"],
    ["Monster lucu", "Gambar monster yang lucu"],
    ["Taman bunga", "Gambar taman penuh bunga"],
    ["Robot temanku", "Gambar robot temanmu"],
    ["Di bawah laut", "Gambar dunia bawah laut"],
    ["Makanan favorit", "Gambar makanan favoritmu"],
    ["Pemandangan", "Gambar gunung dan matahari"],
    ["Pesawat luar angkasa", "Gambar pesawat luar angkasa"],
    ["Keluargaku", "Gambar keluargamu"],
  ];

  const LINES = {
    good: ["Garisnya pas!", "Rapi sekali!", "Terus begitu!", "Mantap!"],
    great: ["Wah, keren sekali!", "Tanganmu stabil!", "Luar biasa!"],
    bad: ["Pelan-pelan saja", "Ikuti garisnya, ya", "Tidak apa-apa!"],
    start: ["Ayo mulai!", "Kamu pasti bisa!", "Siap menggambar?"],
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- musik ---------------- */
  function playMusic() {
    const st = S().settings || {};
    if (!st.musicOn) { KA.audio.stopMusic(); return; }
    const isl = G && G.lv ? G.lv.island : UI().island || 1;
    KA.audio.startMusic(D().equipped && D().equipped.music ? D().equipped.music : "island" + isl);
  }

  /* ---------------- Noko pojok kanvas ---------------- */
  function say(text, expr = "happy", force = false) {
    const now = performance.now();
    if (!force && now - lastSay < 1300) return;
    lastSay = now;
    if (expr !== sayExpr) { $("nokoFace").innerHTML = UI().noko(expr, 64); sayExpr = expr; }
    const b = $("nokoSay");
    b.textContent = text;
    b.classList.add("show");
    $("nokoCorner").dataset.expr = expr;
    clearTimeout(sayH);
    sayH = setTimeout(() => b.classList.remove("show"), 2300);
  }

  /* ---------------- overlay di atas kanvas ---------------- */
  function overlay(html, veil = false) {
    const o = $("bigOverlay");
    clearTimeout(overlayH);
    if (!html) { o.hidden = true; o.innerHTML = ""; return; }
    o.className = veil ? "veil" : "";
    o.innerHTML = html;
    o.hidden = false;
  }
  function flash(html, ms) {
    overlay(html);
    overlayH = setTimeout(() => overlay(null), ms);
  }

  /* ---------------- alat ---------------- */
  /* engine memilih palet sesuai mode: pena (level), FREE_COLORS (bebas), FILL_COLORS (warnai) */
  function colorsFor() { return G ? E().colors() || [] : []; }

  function stampSvg(id, size = 26) {
    if (KA.icons.stamp) return KA.icons.stamp(id, size, "currentColor");
    const st = KA.art && KA.art.STAMPS && KA.art.STAMPS[id];
    return st ? `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${st.d}" fill="currentColor"/></svg>` : "";
  }

  function ownedStamps() {
    try { return KA.economy.ownedStickers() || []; } catch (e) { return []; }
  }

  function buildTools() {
    const t = E().tool || {};
    const kind = t.kind || "pen";
    const kinds = G.kind === "level" || G.kind === "nalar" ? [] : G.kind === "free" ? ["pen", "fill", "stamp"] : ["fill", "stamp"];
    const stamps = ownedStamps();
    const kindsShown = kinds.filter((k) => k !== "stamp" || stamps.length);

    /* jenis alat */
    const kr = $("kindRow");
    kr.hidden = kindsShown.length < 2;
    const KN = { pen: ["pencil", "Pena"], fill: ["bucket", "Ember cat"], stamp: ["sticker", "Stiker"] };
    kr.innerHTML = kindsShown.map((k) => `<button class="kind-btn${k === kind ? " active" : ""}" data-kind="${k}" aria-pressed="${k === kind}" aria-label="${KN[k][1]}">${ic(KN[k][0], 22)}<small>${KN[k][1]}</small></button>`).join("");
    kr.querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.kind;
      const patch = { kind: k };
      if (k === "stamp" && !(E().tool || {}).stamp) patch.stamp = stamps[0];
      E().setTool(patch);
      sfx("click");
      buildTools();
    }));

    /* warna */
    const cols = colorsFor();
    const cr = $("colorRow");
    cr.innerHTML = cols.map((c, i) => `<button class="swatch${c === t.color ? " active" : ""}" style="--sw:${c}" data-c="${c}" aria-label="Warna ${i + 1}" aria-pressed="${c === t.color}"></button>`).join("");
    cr.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => {
      E().setTool({ color: b.dataset.c });
      sfx("click");
      buildTools();
    }));

    /* ukuran pena */
    const sr = $("sizeRow");
    sr.hidden = kind !== "pen";
    const SZ = E().SIZES || [];
    sr.innerHTML = SZ.map((s, i) => `<button class="size-btn${s === t.size ? " active" : ""}" data-s="${i}" aria-label="Ukuran ${["kecil", "sedang", "besar"][i] || i + 1}" aria-pressed="${s === t.size}"><span class="dot" style="--d:${6 + i * 6}px"></span></button>`).join("");
    sr.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
      E().setTool({ size: SZ[+b.dataset.s] });
      sfx("click");
      buildTools();
    }));

    /* stiker */
    const st = $("stampRow");
    st.hidden = kind !== "stamp";
    st.innerHTML = stamps.map((id) => {
      const name = (KA.art.STAMPS[id] || {}).name || id;
      return `<button class="stamp-btn${t.stamp === id ? " active" : ""}" data-st="${id}" style="color:${t.color || "#333"}" aria-label="Stiker ${name}" aria-pressed="${t.stamp === id}">${stampSvg(id)}</button>`;
    }).join("");
    st.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => {
      E().setTool({ stamp: b.dataset.st });
      sfx("click");
      buildTools();
    }));
  }

  function syncActions() {
    if (!G) return;
    if (G.kind === "nalar") return syncNalar();
    $("btnSkip").hidden = true;
    $("btnHint").innerHTML = `${ic("eye", 22)}<small>Bantu aku</small>`;
    const lv = G.lv;
    const hintModes = { tiru: 1, titik: 1, langkah: 1, cermin: 1 };
    const hb = $("btnHint");
    hb.hidden = !(G.kind === "level" && hintModes[lv.mode] && !G.assisted);
    hb.disabled = !E().hintLeft();
    const lb = $("btnLamp");
    lb.hidden = !(G.kind === "level" && lv.mode === "kilat");
    const owns = S().owns("lamp");
    lb.disabled = owns && !E().lampLeft();
    lb.classList.toggle("need", !owns);
    $("btnFinish").disabled = G.finished || (G.kind !== "color" && !E().canFinish());
  }

  function lockCanvas(on) { $("canvasWrap").classList.toggle("locked", !!on); }

  /* ---------------- event dari engine ---------------- */
  function parsePhase(data, extra) {
    if (typeof data === "string") return { ph: data, n: typeof extra === "number" ? extra : undefined };
    if (data && typeof data === "object") {
      const n = data.count != null ? data.count : data.n != null ? data.n : data.left != null ? data.left : data.sec;
      return { ph: data.phase || data.name || data.type, n };
    }
    return { ph: "", n: undefined };
  }

  function onEvent(type, data, extra) {
    if (!G) return;
    switch (type) {
      case "firstStroke":
        if (G.kind !== "nalar") say(pick(LINES.start), "happy", true);
        break;
      case "phase": {
        const { ph, n } = parsePhase(data, extra);
        if ((ph === "memorize" || ph === "count") && n != null) sfx("tick");
        if (ph === "memorize") {
          overlay(`<div class="count-num">${n != null ? n : ""}</div><div class="count-hint">${ic("eye", 22)} Ingat bentuknya!</div>`);
          if (n == null || n >= 3) say("Ingat bentuknya!", "wow", true);
        } else if (ph === "memory") {
          flash(`<div class="count-hint">${ic("zap", 22)} Gambar dari ingatan!</div>`, 1500);
          say("Sekarang dari ingatan!", "happy", true);
        } else if (ph === "count") {
          overlay(`<div class="count-num">${n != null ? n : ""}</div><div class="count-hint">${ic("ghost", 22)} Hantu bersiap…</div>`, true);
          if (n == null || n >= 3) say("Hantu datang!", "wow", true);
        } else if (ph === "duel") {
          flash(`<div class="count-hint go">${ic("play", 22)} Mulai!</div>`, 900);
          say("Ayo kalahkan hantu!", "happy", true);
        } else {
          overlay(null);
        }
        syncActions();
        break;
      }
      case "stroke": {
        if (G.kind === "nalar") { syncActions(); break; }
        const d = data || {};
        setStreak(d.mult || 1);
        if (d.reset) { syncActions(); break; }
        if (d.good && (d.mult || 1) >= 2) say(pick(LINES.great), "wow");
        else if (d.good) { if (Math.random() < 0.35) say(pick(LINES.good), "happy"); }
        else say(pick(LINES.bad), "oops");
        syncActions();
        break;
      }
      case "partDone": {
        const d = data || {};
        const all = d.total && d.index + 1 >= d.total;
        say(all ? "Semua bagian beres!" : "Satu bagian beres!", "wow", true);
        break;
      }
      case "progress": {
        const d = data || {};
        $("duelMe").style.width = Math.round(Math.max(0, Math.min(1, d.me || 0)) * 100) + "%";
        $("duelGhost").style.width = Math.round(Math.max(0, Math.min(1, d.ghost || 0)) * 100) + "%";
        break;
      }
      case "ghostDone":
        say("Hantu sudah selesai!", "oops", true);
        $("duelBar").classList.add("ghost-done");
        break;
      case "changed":
        syncActions();
        break;
    }
  }

  function setStreak(mult) {
    const el = $("topStreak");
    if (mult > 1.001) {
      el.hidden = false;
      $("streakText").textContent = "×" + mult.toFixed(1);
      el.classList.toggle("hot", mult >= 2);
    } else el.hidden = true;
  }

  /* ---------------- timer (opsional) ---------------- */
  function startTimer() {
    clearInterval(timerH);
    const on = !!(S().settings || {}).showTimer && G && (G.kind === "level" || G.kind === "nalar");
    $("topTimer").hidden = !on;
    if (!on) return;
    const tick = () => {
      let s = Number(E().elapsed()) || 0;
      if (s > 36000) s /= 1000; /* bila engine memberi milidetik */
      s = Math.floor(s);
      $("timerText").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    };
    tick();
    timerH = setInterval(tick, 500);
  }

  /* ---------------- masuk / keluar layar game ---------------- */
  function flushPlay() {
    if (G && G.t0) {
      const ms = performance.now() - G.t0;
      if (ms > 0 && ms < 6 * 3600e3) S().addPlayMs(ms);
      G.t0 = performance.now();
    }
  }

  function stopGame() {
    clearInterval(timerH);
    clearTimeout(overlayH);
    flushPlay();
    try { E().stop(); } catch (e) { /* engine mungkin belum mulai */ }
    overlay(null);
    lockCanvas(false);
    $("modalResult").hidden = true;
    $("canvasWrap").classList.remove("alive");
    if (KA.fx && KA.fx.clear) KA.fx.clear();
    G = null;
  }

  function enterGame(ctx, title, tagHtml, theme) {
    stopGame();
    G = Object.assign({ t0: performance.now(), finished: false }, ctx);
    UI().show("scr-game");
    const wrap = $("canvasWrap");
    wrap.dataset.theme = theme;
    document.body.dataset.island = ctx.lv ? ctx.lv.island : document.body.dataset.island;
    $("scr-game").dataset.kind = ctx.kind;
    $("scr-game").dataset.boss = ctx.lv && ctx.lv.boss ? "1" : "0";
    $("gameTitle").textContent = title;
    $("modeTag").innerHTML = tagHtml || "";
    $("modeTag").hidden = !tagHtml;
    $("duelBar").hidden = !(ctx.lv && ctx.lv.boss);
    $("duelBar").classList.remove("ghost-done");
    $("duelMe").style.width = "0%";
    $("duelGhost").style.width = "0%";
    $("ideaCard").hidden = ctx.kind !== "free";
    $("taskCard").hidden = ctx.kind !== "nalar";
    $("btnSkip").hidden = true;
    $("finishLabel").textContent = ctx.kind === "level" ? "Selesai" : ctx.kind === "nalar" ? "Periksa" : "Simpan";
    setStreak(1);
    sayExpr = "";
    $("nokoSay").classList.remove("show");
    $("nokoFace").innerHTML = UI().noko("happy", 64);
    sayExpr = "happy";
  }

  function modeTag(lv, assisted) {
    const m = UI().MODE[lv.mode] || UI().MODE.tiru;
    return `<span class="tag-in${lv.boss ? " boss" : ""}">${ic(m.icon, 16)} ${m.label}</span>` +
      (assisted ? `<span class="tag-in assist">${ic("wand", 16)} Mode Bantu</span>` : "");
  }

  /* ================= LEVEL ================= */
  function startLevel(lv, opts = {}) {
    if (typeof lv === "number") lv = KA.levels.get(lv);
    if (!lv) return goHome();
    if (lv.mode === "nalar") return startNalar(lv, opts);
    sfx("click");
    const daily = opts.daily || null;
    const assisted = !daily && !!opts.assisted;
    const tag = daily ? `<span class="tag-in daily">${ic(daily.icon || "flag", 16)} Harian · ${esc(daily.label)}</span>` + modeTag(lv, false) : modeTag(lv, assisted);
    enterGame({ kind: "level", lv, assisted, daily }, daily ? "Harian: " + lv.name : lv.name, tag, lv.theme);
    if (!daily && S().setLastIsland) S().setLastIsland(lv.island);
    E().startLevel(lv, { assisted, onEvent });
    const cols = E().colors();
    const cur = E().tool || {};
    E().setTool({ kind: "pen", color: cols.includes(cur.color) ? cur.color : cols[0], size: (E().SIZES || [])[1] });
    buildTools();
    syncActions();
    startTimer();
    playMusic();
    const first = {
      tiru: "Ikuti garisnya!", titik: "Sambung titiknya!", langkah: "Satu bagian dulu!",
      kilat: "Ingat baik-baik!", cermin: "Gambar sisi kiri!", boss: "Hantu menantangmu!",
    };
    say(daily ? `Target ${daily.target} bintang!` : first[lv.mode] || "Ayo menggambar!", lv.boss ? "wow" : "happy", true);
  }

  /* Tantangan Harian: level hari ini dengan pelintiran mode */
  function startDaily() {
    const ch = KA.economy.dailyChallenge();
    startLevel(KA.economy.dailyLevel(), { daily: ch });
  }

  async function finishLevel() {
    if (!G || G.finished || !E().canFinish()) return;
    G.finished = true;
    syncActions();
    lockCanvas(true);
    clearInterval(timerH);
    overlay(null);

    const lv = G.lv, assisted = G.assisted;
    const res = E().evaluate();
    const snap = E().snapshot();
    const d = D();
    if (lv.boss && res.ghostScore == null) res.ghostScore = E().ghostScore || 0;
    const bossWin = !!lv.boss && res.score >= (res.ghostScore || 0);
    const passed = lv.boss ? bossWin : res.stars >= 1;
    const fastGhost = !!(bossWin && res.fastGhost);
    const prevGhost = (d.ghostRec || {})[lv.id];

    const daily = G.daily;
    const rec = daily ? { firstTime: false, passed, prev: {} } : S().recordLevel(lv.id, res, { bossWin, assisted }) || {};
    const prev = rec.prev || {};
    S().logAttempt({
      t: new Date().toISOString(), levelId: lv.id, name: lv.name, mode: lv.mode, assisted, daily: !!daily,
      dur: Math.round((res.dur || 0) * 10) / 10, score: res.score, stars: res.stars,
      acc: res.acc, comp: res.comp, neat: res.neat, smooth: res.smooth,
      strokes: res.strokeCount, inkRatio: Math.round((res.inkRatio || 0) * 100) / 100,
    });

    /* statistik & konteks lencana hanya dari percobaan berbintang */
    if (res.stars >= 1) {
      if (lv.mode === "kilat") S().incStat("kilat");
      if (lv.mode === "cermin") S().incStat("cermin");
      if (res.grade === "S") S().incStat("sCount");
      if (res.colorsUsed) S().maxStat("maxColors", res.colorsUsed);
    }
    const bctx = { streakMaxed: !!res.streakMaxed, fastGhost, colorsUsed: res.colorsUsed || 0, stars: res.stars };
    if (fastGhost) S().incStat("fastGhost");
    /* storage hanya menyimpan rekaman yang lebih baik */
    if (bossWin && (!prevGhost || res.score > (prevGhost.score || 0))) {
      S().setGhostRec(lv.id, { score: res.score, strokes: snap.strokes });
    }

    /* koin */
    let coins, pass = { claimed: false, total: 0, tiers: [] }, dailyRes = null;
    if (daily) {
      /* completeDaily sudah mengkreditkan hadiahnya sendiri */
      dailyRes = KA.economy.completeDaily(res.stars);
      coins = { total: dailyRes.reward, lines: dailyRes.reward ? [{ label: `Tantangan Harian (${dailyRes.streak} hari)`, n: dailyRes.reward }] : [] };
    } else {
      coins = KA.economy.coinsFor({ res, firstTime: !!rec.firstTime, prevBest: prev.best || 0, bossWin, fastGhost, passed: rec.passed != null ? !!rec.passed : passed }) || { total: 0, lines: [] };
      if (coins.total) S().addCoins(coins.total);
      const before = d.coins;
      pass = KA.economy.claimPass() || pass;
      if (pass.total > 0 && D().coins === before) S().addCoins(pass.total);
    }

    /* galeri otomatis untuk karya yang lulus */
    let entry = null;
    if (passed) {
      entry = {
        id: "k" + Date.now().toString(36), kind: "level", title: lv.name, levelId: lv.id, theme: lv.theme,
        paper: null, pen: (d.equipped && d.equipped.pen) || "default", anim: lv.anim,
        stars: res.stars, score: res.score, strokes: snap.strokes, fills: snap.fills || [], stamps: snap.stamps || [],
        created: new Date().toISOString(), colored: false,
      };
      const gid = S().addGallery(entry);
      if (gid != null) entry.id = gid;
    }

    const newBadges = KA.economy.checkBadges(bctx) || [];

    /* gambar menjadi hidup */
    if (passed) {
      say(lv.boss ? "Hantu kalah!" : "Gambarmu hidup!", "wow", true);
      try { await E().playAlive(lv.anim); } catch (e) { /* tetap lanjut */ }
    } else {
      say(lv.boss ? "Hampir menang!" : "Hampir! Coba lagi", "oops", true);
      await new Promise((r) => setTimeout(r, 450));
    }
    if (!G || G.lv !== lv) return; /* pemain sudah keluar */

    showResult({ lv, res, rec, coins, pass, entry, bossWin, passed, fastGhost, assisted, daily, dailyRes });
    UI().announceBadges(newBadges);
  }

  /* ---------------- modal hasil ---------------- */
  function showResult(r) {
    resultCtx = r;
    const { lv, res, coins, pass, bossWin, passed, fastGhost } = r;
    const m = $("modalResult");
    m.hidden = false;
    m.querySelector(".modal-card").scrollTop = 0;

    const expr = passed ? (res.stars >= 3 || bossWin ? "wow" : "happy") : "oops";
    $("resNoko").innerHTML = UI().noko(expr, 72);
    $("resTitle").textContent = lv.boss
      ? (bossWin ? "Hantu Terkalahkan!" : "Hantunya masih menang")
      : passed ? ["Bagus!", "Keren sekali!", "Luar biasa!"][res.stars - 1] : "Hampir! Coba lagi";
    const nz = res.nalar;
    if (nz) $("resTitle").textContent = passed ? ["Benar!", "Pintar sekali!", "Jenius kecil!"][res.stars - 1] : "Hampir! Coba lagi";
    const sub = [];
    sub.push(`${lv.name} · ${(UI().MODE[lv.mode] || {}).label || ""}`);
    if (r.assisted) sub.push("Mode Bantu");
    if (r.daily) sub.push(r.dailyRes && r.dailyRes.done ? `Tantangan Harian tuntas!` : `Harian: target ${r.daily.target} bintang`);
    if (r.rec && r.rec.newBest && !r.rec.firstTime) sub.push("Rekor baru!");
    $("resSub").textContent = sub.join(" · ");

    /* duel */
    const duel = $("resDuel");
    duel.hidden = !lv.boss;
    if (lv.boss) {
      const lossMsg = !bossWin && (S().level(lv.id) || {}).bossLosses > 0 && !(D().ghostRec || {})[lv.id]
        ? "Hantunya mulai lelah!" : "Coba lagi, kamu hampir menang!";
      duel.innerHTML = `
        <div class="vs ${bossWin ? "win" : "lose"}">
          <span class="side ghost">${ic("ghost", 26)}<small>Hantu</small><b>${res.ghostScore || 0}</b></span>
          <span class="mid">vs</span>
          <span class="side me">${ic("pencil", 26)}<small>Kamu</small><b>${res.score}</b></span>
        </div>
        <p class="duel-note">${bossWin ? (lv.id >= KA.levels.list.length ? "Semua pulau tamat!" : "Pulau baru terbuka!") : lossMsg}</p>
        ${fastGhost ? `<p class="fast">${ic("zap", 18)} Secepat Hantu!</p>` : ""}`;
    }

    /* bintang */
    const st = $("resStars");
    st.innerHTML = [0, 1, 2].map(() => `<span class="rstar">${ic("star", 44, "", true)}</span>`).join("");
    let shown = 0;
    const els = st.children;
    const stepStar = () => {
      if (shown >= res.stars || m.hidden) return;
      els[shown].classList.add("lit");
      sfx("star", shown);
      shown++;
      setTimeout(stepStar, 360);
    };
    setTimeout(stepStar, 250);

    $("resGrade").textContent = res.grade;
    $("resGrade").className = "grade g-" + res.grade;
    $("resPerfect").hidden = !res.perfect;
    countUp($("resScore"), res.score, 900);

    /* Nalar: ringkasan penalaran menggantikan peta & sub-skor gambar */
    $("resNalar").hidden = !nz;
    m.querySelector(".res-score-row").hidden = !!nz; /* skor Nalar hanya turunan bintang */
    m.querySelector(".res-body").hidden = !!nz;
    if (nz) {
      const row = (ok, icon, text) => `<li class="${ok ? "ok" : "no"}">${ic(ok ? "check" : icon, 20)}<span>${text}</span></li>`;
      $("resNalar").innerHTML = `
        <div class="nalar-say"><span class="noko-xs">${UI().noko(passed ? "wow" : "oops", 36)}</span>
          <p class="bubble">${esc(passed ? (nz.firstTry && !nz.hintLevel ? "Langsung benar, hebat!" : "Kamu berhasil memecahkannya!") : (nz.reason || "Belum tepat, coba lagi"))}</p></div>
        <ul class="nalar-list">
          ${row(nz.correct, "x", nz.correct ? "Semua jawaban benar" : `Baru ${nz.solved} dari ${nz.total} soal benar`)}
          ${row(!nz.hintLevel, "bulb", nz.hintLevel ? `Memakai petunjuk tingkat ${nz.hintLevel}` : "Tanpa petunjuk")}
          ${row(nz.firstTry, "retry", nz.firstTry ? "Benar pada percobaan pertama" : `${nz.wrong} kali dicoba ulang`)}
          ${nz.secondAnswer !== undefined ? row(nz.secondAnswer, "plus", nz.secondAnswer ? "Menemukan cara kedua!" : "Cara kedua belum ditemukan") : ""}
        </ul>`;
    }

    /* sub-skor */
    const SUBS = [["acc", "Ketepatan", "target"], ["comp", "Kelengkapan", "ruler"], ["neat", "Kerapian", "brush"], ["smooth", "Kelancaran", "pencil"]];
    $("resSubs").innerHTML = SUBS.map(([k, l, i]) => {
      const v = Math.max(0, Math.min(100, res[k] || 0));
      return `<div class="sub-row"><span class="sub-l">${ic(i, 18)} ${l}</span>
        <span class="sub-bar"><span class="${v >= 80 ? "hi" : v >= 55 ? "mid" : "lo"}" style="width:${v}%"></span></span><b>${v}</b></div>`;
    }).join("");

    /* peta ketepatan (khusus level gambar) */
    if (!nz) drawAccuracyMap(lv, res, r.entry);
    const parts = res.parts || [];
    const red = parts.filter((f) => f < 0.7).length;
    $("resMapSay").innerHTML = `<span class="noko-xs">${UI().noko(red ? "oops" : "wow", 32)}</span><span>${
      red === 0 ? "Semua bagian hijau!" : red === 1 ? "1 bagian masih merah!" : `${red} bagian masih merah!`}</span>`;

    /* koin */
    const lines = (coins.lines || []).slice();
    if (pass && pass.total > 0) lines.push({ label: "Jalan Bintang", n: pass.total });
    const total = (coins.total || 0) + ((pass && pass.total) || 0);
    $("resCoins").innerHTML = lines.map((x) => `<span class="coin-line">${esc(x.label)} <b>+${x.n}</b></span>`).join("") +
      `<span class="coin-total">${ic("coin", 20, "ic-coin")} +${total}</span>`;
    if (total) setTimeout(() => sfx("coin"), 700);

    /* tombol */
    const recNow = S().level(lv.id) || {};
    const cleared = lv.boss ? !!recNow.bossWon : (recNow.stars || 0) >= 1;
    const next = KA.levels.get(lv.id + 1);
    const nb = $("btnNext");
    const last = !next;
    nb.disabled = r.daily ? false : !cleared || (!last && !KA.levels.isUnlocked(next.id));
    $("nextLabel").textContent = r.daily ? "Beranda" : last ? "Tamat!" : lv.boss ? "Pulau Berikutnya" : "Lanjut";
    $("btnColor").hidden = !r.entry;
    $("btnAssist").hidden = !!r.daily || lv.boss || r.assisted || passed || !KA.economy.offerAssist(lv.id);

    if (passed) {
      KA.fx.spawnConfetti(lv.boss ? 160 : 40 + res.stars * 40);
      fxLoop(4200);
      sfx("fanfare");
    } else if (lv.boss) {
      sfx("ghostWin"); /* hantu yang menang: bunyi lembut */
    }
    setTimeout(() => { if (!m.hidden) (nb.disabled ? $("btnRetry") : nb).focus({ preventScroll: true }); }, 60);
  }

  /* engine hanya memutar fx selama loop-nya; layar hasil butuh loop sendiri */
  let fxRaf = 0, fxEnd = 0;
  function fxLoop(ms) {
    fxEnd = performance.now() + ms;
    if (fxRaf) return;
    const step = (t) => {
      if (KA.fx && KA.fx.update) KA.fx.update();
      if (t < fxEnd) fxRaf = requestAnimationFrame(step);
      else fxRaf = 0;
    };
    fxRaf = requestAnimationFrame(step);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function countUp(el, target, ms) {
    if (S().reduceMotion()) { el.textContent = target; return; }
    const t0 = performance.now();
    const token = (el._cu = (el._cu || 0) + 1);
    const step = () => {
      if (el._cu !== token) return;
      const p = Math.max(0, Math.min(1, (performance.now() - t0) / ms));
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    /* jaminan angka akhir walau rAF tertahan (tab latar) */
    setTimeout(() => { if (el._cu === token) el.textContent = target; }, ms + 80);
  }

  function drawAccuracyMap(lv, res, entry) {
    const c = $("resMap");
    const size = c.width;
    const x = c.getContext("2d");
    x.clearRect(0, 0, size, size);
    try { KA.art.paintBackground(x, size, lv.theme, null); }
    catch (e) { x.fillStyle = lv.theme === "t4" ? "#232A4A" : lv.theme === "t5" ? "#164766" : "#FFFFFF"; x.fillRect(0, 0, size, size); }
    /* goresan anak, samar */
    const strokes = entry ? entry.strokes : (E().snapshot() || {}).strokes || [];
    x.save();
    x.globalAlpha = 0.28;
    try { KA.art.drawStrokes(x, strokes, size); }
    catch (e) {
      x.lineCap = x.lineJoin = "round";
      strokes.forEach((s) => {
        x.strokeStyle = s.color || "#555";
        x.lineWidth = Math.max(1, (s.size || 2) / 100 * size);
        x.beginPath();
        s.pts.forEach(([px, py], i) => (i ? x.lineTo(px * size / 100, py * size / 100) : x.moveTo(px * size / 100, py * size / 100)));
        x.stroke();
      });
    }
    x.restore();
    /* template per titik: hijau tepat, kuning dekat, merah terlewat */
    const COL = ["#E5484D", "#F5B700", "#20A464"];
    const st = res.ptState || [];
    const k = size / 100;
    const r = Math.max(2.2, size / 120);
    lv._pts.forEach((p, i) => {
      x.fillStyle = COL[st[i] || 0];
      x.beginPath();
      x.arc(p.x * k, p.y * k, r, 0, Math.PI * 2);
      x.fill();
    });
  }

  function closeResult() {
    $("modalResult").hidden = true;
    if (KA.fx && KA.fx.clear) KA.fx.clear();
  }

  /* ================= TANTANGAN NALAR ================= */
  const MAX_WRONG = 3; /* salah ke-3 pada satu soal mengakhiri percobaan (bisa Coba Lagi / Mode Bantu) */

  function startNalar(lv, opts = {}) {
    /* set soal bergiliran: percobaan ke-n memakai set n mod jumlah set */
    const tries = (D().attempts || []).filter((a) => a.puzzleId === lv.puzzleId).length;
    const pz = KA.puzzles.use ? KA.puzzles.use(lv.puzzleId, tries) : KA.puzzles.get(lv.puzzleId);
    if (!pz) return goHome();
    sfx("click");
    const assisted = !!opts.assisted;
    const tag = `<span class="tag-in nalar">${ic("bulb", 16)} ${esc(pz.topic || "Nalar")}</span>` +
      (assisted ? `<span class="tag-in assist">${ic("wand", 16)} Mode Bantu</span>` : "");
    enterGame({ kind: "nalar", lv, assisted, pz, step: 0, results: [], hintBase: assisted ? 2 : 0, hintMax: 0, hintOpt: false,
      wrong: 0, wrongStep: 0, lastReason: "" }, lv.name, tag, lv.theme);
    if (S().setLastIsland) S().setLastIsland(lv.island);
    E().startPuzzle(pz, { stepIndex: 0, hintLevel: G.hintBase, onEvent });
    nalarStepUI(true);
    startTimer();
    playMusic();
  }

  function curStep() { return G.pz.steps[G.step]; }

  /* hint yang dipakai pada soal wajib menentukan bintang; di soal tambahan hanya membatalkan bonus */
  function noteHint(level) {
    if (curStep().optional) { if (level > 0) G.hintOpt = true; }
    else G.hintMax = Math.max(G.hintMax, level);
  }

  function nalarStepUI(first) {
    const st = curStep();
    const n = G.pz.steps.length;
    $("taskStep").textContent = st.optional ? "Bonus" : `${G.step + 1}/${G.pz.steps.filter((s) => !s.optional).length}`;
    $("taskStep").classList.toggle("bonus", !!st.optional);
    $("taskText").textContent = st.task;
    $("taskReason").hidden = true;
    const frac = st.view && st.view.fraction;
    $("taskFrac").hidden = !frac;
    $("taskFrac").textContent = frac || "";
    G.wrongStep = 0;
    noteHint(G.hintBase);
    buildTools();
    syncActions();
    const h = G.hintBase ? (st.hints[G.hintBase - 1] || {}).text : "";
    say(h && first !== false ? h : st.text, first ? "happy" : "wow", true);
    if (h) setTimeout(() => { if (G && G.kind === "nalar" && curStep() === st) say(st.text, "happy", true); }, 2600);
    void n;
  }

  function syncNalar() {
    const st = curStep();
    const hl = E().hintLevel | 0;
    const hb = $("btnHint");
    hb.hidden = false;
    hb.disabled = G.finished || hl >= 3;
    hb.innerHTML = `${ic("bulb", 22)}<small>Petunjuk${hl ? ` ${hl}/3` : ""}</small>`;
    hb.setAttribute("aria-label", `Petunjuk, tingkat ${hl} dari 3`);
    $("btnLamp").hidden = true;
    $("btnSkip").hidden = !st.optional || G.finished;
    $("btnFinish").disabled = G.finished || !E().canFinish();
  }

  function nalarHint() {
    if (!G || G.finished) return;
    const next = Math.min(3, (E().hintLevel | 0) + 1);
    const h = E().showPuzzleHint(next);
    noteHint(next);
    sfx("magic");
    if (h && h.text) say(h.text, "wow", true);
    syncActions();
  }

  function checkNalar() {
    if (!G || G.finished || !E().canFinish()) return;
    const st = curStep();
    const input = Object.assign({}, E().puzzleInput(), { prev: G.results });
    let r;
    try { r = KA.puzzles.checkStep(G.pz.id, G.step, input) || { ok: false }; }
    catch (e) { r = { ok: false, reason: "Coba gambar lagi" }; }
    if (!r.ok) {
      G.wrong++; G.wrongStep++;
      G.lastReason = r.reason || "Belum tepat";
      sfx("denied");
      $("taskReason").textContent = G.lastReason;
      $("taskReason").hidden = false;
      $("taskCard").classList.remove("shake"); void $("taskCard").offsetWidth; $("taskCard").classList.add("shake");
      if (G.wrongStep >= MAX_WRONG) {
        if (st.optional) { say(G.lastReason, "oops", true); return finishNalar(); }
        return finishNalar(true);
      }
      say(G.lastReason, "oops", true);
      if (G.wrongStep === MAX_WRONG - 1 && (E().hintLevel | 0) < 3) {
        setTimeout(() => { if (G && G.kind === "nalar" && !G.finished) say("Coba tombol Petunjuk!", "happy", true); }, 2600);
      }
      return;
    }
    /* benar */
    G.results[G.step] = st.optional && G.hintOpt ? Object.assign({}, r, { ok: false, viaHint: true }) : r;
    sfx("partDone");
    say(r.reason || "Benar!", "wow", true);
    $("taskReason").hidden = true;
    const next = G.step + 1;
    if (next >= G.pz.steps.length) return finishNalar();
    G.finished = true; /* kunci sebentar selama jeda */
    lockCanvas(true);
    syncActions();
    setTimeout(() => {
      if (!G || G.kind !== "nalar") return;
      G.finished = false;
      lockCanvas(false);
      G.step = next;
      E().setPuzzleStep(next);
      nalarStepUI(false);
    }, 1100);
  }

  async function finishNalar(failed) {
    if (!G || G.kind !== "nalar") return;
    G.finished = true;
    syncActions();
    lockCanvas(true);
    clearInterval(timerH);
    const lv = G.lv, pz = G.pz, assisted = G.assisted;
    const sum = KA.puzzles.summarize(pz, failed ? [] : G.results, G.hintMax);
    const stars = failed ? 0 : KA.puzzles.stars(sum);
    const score = [0, 600, 800, 950][stars];
    const required = pz.steps.filter((s) => !s.optional);
    const solved = required.filter((s) => { const i = pz.steps.indexOf(s); return G.results[i] && G.results[i].ok; }).length;
    const nalar = {
      correct: !!sum.correct && !failed, hintLevel: G.hintMax, firstTry: G.wrong === 0, wrong: G.wrong,
      solved, total: required.length, secondAnswer: sum.secondAnswer, reason: failed ? G.lastReason : "",
    };
    const inp = E().puzzleInput() || {};
    let dur = Number(E().elapsed()) || 0;
    if (dur > 36000) dur /= 1000;
    const res = {
      stars, score, grade: KA.scoring.gradeOf(score), perfect: false, assisted, nalar,
      strokeCount: (inp.strokes || []).length, dur,
    };
    const passed = stars >= 1;
    const rec = S().recordLevel(lv.id, res, { assisted }) || {};
    const prev = rec.prev || {};
    S().logAttempt({
      t: new Date().toISOString(), levelId: lv.id, name: lv.name, mode: "nalar", assisted,
      dur: Math.round(dur * 10) / 10, score, stars, acc: null, comp: null, neat: null, smooth: null,
      strokes: res.strokeCount, inkRatio: null,
      correct: nalar.correct, hintLevel: nalar.hintLevel, firstTry: nalar.firstTry, wrong: nalar.wrong,
      reason: G.lastReason || "", topic: pz.topic || "", puzzleId: pz.id,
    });
    const coins = KA.economy.coinsFor({ res, firstTime: !!rec.firstTime, prevBest: prev.best || 0, passed: rec.passed != null ? !!rec.passed : passed }) || { total: 0, lines: [] };
    if (coins.total) S().addCoins(coins.total);
    const before = D().coins;
    const pass = KA.economy.claimPass() || { claimed: false, total: 0, tiers: [] };
    if (pass.total > 0 && D().coins === before) S().addCoins(pass.total);
    const newBadges = KA.economy.checkBadges({ stars }) || [];

    if (passed) {
      say("Gambarmu hidup!", "wow", true);
      try { await E().playAlive(lv.anim || pz.anim); } catch (e) { /* lanjut */ }
    } else {
      say(G.lastReason || "Hampir! Coba lagi", "oops", true);
      await new Promise((r) => setTimeout(r, 900));
    }
    if (!G || G.lv !== lv) return;
    showResult({ lv, res, rec, coins, pass, entry: null, bossWin: false, passed, fastGhost: false, assisted });
    UI().announceBadges(newBadges);
  }

  /* ================= KANVAS BEBAS ================= */
  const PAPER_THEME = { paper_blueprint: "t1", paper_grass: "t2", paper_night: "t4" };

  function newIdea() {
    let i;
    do { i = Math.floor(Math.random() * IDEAS.length); } while (G && G.idea === i && IDEAS.length > 1);
    G.idea = i;
    $("ideaText").textContent = IDEAS[i][1];
  }

  function startFree() {
    const paper = (D().equipped && D().equipped.paper) || null;
    enterGame({ kind: "free", paper }, "Kanvas Bebas", `<span class="tag-in">${ic("palette", 16)} Bebas</span>`, PAPER_THEME[paper] || "free");
    E().startFree({ paper, onEvent });
    const cols = E().colors();
    E().setTool({ kind: "pen", color: cols[0], size: (E().SIZES || [])[1], stamp: ownedStamps()[0] });
    newIdea();
    buildTools();
    syncActions();
    playMusic();
    say("Gambar sesukamu!", "happy", true);
  }

  function colorCount(snap) {
    const set = new Set();
    (snap.strokes || []).forEach((s) => s.color && set.add(String(s.color).toLowerCase()));
    (snap.fills || []).forEach((f) => f.c && set.add(String(f.c).toLowerCase()));
    (snap.stamps || []).forEach((s) => s.c && set.add(String(s.c).toLowerCase()));
    return set.size;
  }

  function saveFree() {
    if (!G || G.finished) return;
    const snap = E().snapshot() || {};
    if (!(snap.strokes || []).length && !(snap.fills || []).length && !(snap.stamps || []).length) {
      say("Gambar dulu, ya!", "oops", true);
      return;
    }
    G.finished = true;
    const d = D();
    const entry = {
      id: "f" + Date.now().toString(36), kind: "free", title: IDEAS[G.idea || 0][0], levelId: null,
      theme: PAPER_THEME[G.paper] || "free", paper: G.paper || null, pen: (d.equipped && d.equipped.pen) || "default",
      anim: null, stars: 0, score: 0, strokes: snap.strokes || [], fills: snap.fills || [], stamps: snap.stamps || [],
      created: new Date().toISOString(), colored: (snap.fills || []).length > 0,
    };
    const gid = S().addGallery(entry);
    if (gid != null) entry.id = gid;
    S().incStat("free");
    const n = colorCount(snap);
    if (n) S().maxStat("maxColors", n);
    sfx("magic");
    UI().toast(`${ic("image", 20)} Tersimpan di Galeri!`);
    UI().badges({ colorsUsed: n });
    stopGame();
    UI().openGallery();
    playMusic();
  }

  /* ================= BUKU MEWARNAI ================= */
  function startColoringPage(lv) {
    if (typeof lv === "number") lv = KA.levels.get(lv);
    if (!lv || !lv._polylines) return;
    const ink = (KA.art.inkSet ? KA.art.inkSet(lv.theme, null) : ["#333344"])[0];
    startColor({
      id: "w" + Date.now().toString(36), kind: "coloring", title: lv.name, levelId: lv.id, theme: lv.theme,
      paper: null, pen: "default", anim: lv.anim, stars: 0, score: 0,
      strokes: lv._polylines.map((pl) => ({ color: ink, size: 1.2, pts: pl.map((p) => [p[0], p[1]]) })),
      fills: [], stamps: [], created: new Date().toISOString(), colored: false,
    }, "book");
  }

  /* ================= MODE WARNAI ================= */
  function startColor(entry, from) {
    if (!entry) return;
    const fresh = (D().gallery || []).find((e) => e.id === entry.id) || entry;
    const lv = fresh.levelId ? KA.levels.get(fresh.levelId) : null;
    closeResult();
    enterGame({ kind: "color", entry: fresh, from: from || "gallery", lv: null, island: lv ? lv.island : null },
      "Warnai: " + (fresh.title || "Karya"), `<span class="tag-in">${ic("bucket", 16)} Warnai</span>`, UI().themeOf(fresh));
    if (lv) document.body.dataset.island = lv.island;
    E().startColor(fresh, { onEvent });
    const cols = E().colors();
    E().setTool({ kind: "fill", color: cols[0], stamp: ownedStamps()[0] });
    buildTools();
    syncActions();
    say("Pilih warna, ketuk area!", "happy", true);
  }

  function saveColor() {
    if (!G || G.finished) return;
    G.finished = true;
    const snap = E().snapshot() || {};
    const entry = G.entry;
    const wasColored = !!entry.colored; /* updateGallery bisa mengubah objek yang sama */
    const inGallery = (D().gallery || []).some((e) => e.id === entry.id);
    if (inGallery) S().updateGallery(entry.id, { fills: snap.fills || [], stamps: snap.stamps || [], colored: true });
    else S().addGallery(Object.assign({}, entry, { fills: snap.fills || [], stamps: snap.stamps || [], colored: true }));
    if (!wasColored) S().incStat("colored");
    const n = colorCount({ strokes: entry.strokes, fills: snap.fills, stamps: snap.stamps });
    if (n) S().maxStat("maxColors", n);
    sfx("buy");
    UI().toast(`${ic("bucket", 20)} Warnanya tersimpan!`);
    UI().badges({ colorsUsed: n });
    stopGame();
    UI().openGallery();
    playMusic();
  }

  /* ================= navigasi ================= */
  function goHome() {
    stopGame();
    UI().show("scr-home");
    UI().arriveHome();
    playMusic();
    sfx("click");
  }

  function onProfileChanged() {
    UI().applyMotion();
    if (UI().current === "scr-home") UI().renderHome();
  }

  function paintStaticIcons(root) {
    (root || document).querySelectorAll("[data-ic]").forEach((el) => {
      if (el.firstElementChild) return;
      el.innerHTML = ic(el.dataset.ic, +(el.dataset.size || 22), "", el.dataset.ic === "star");
    });
  }

  function wireGame() {
    $("btnBack").addEventListener("click", goHome);
    $("btnUndo").addEventListener("click", () => { E().undo(); syncActions(); });
    UI().twoTap($("btnClear"), () => { E().clearAll(); setStreak(1); syncActions(); }, "Yakin?");
    $("btnHint").addEventListener("click", () => {
      if (G && G.kind === "nalar") return nalarHint();
      if (E().showHint()) { sfx("click"); say("Lihat baik-baik!", "wow", true); }
      syncActions();
    });
    $("btnSkip").addEventListener("click", () => {
      if (!G || G.kind !== "nalar" || G.finished) return;
      sfx("click");
      finishNalar();
    });
    $("btnLamp").addEventListener("click", () => {
      const r = E().flashLamp();
      if (r === true) { sfx("click"); say("Lampu menyala!", "wow", true); }
      else if (r === "need") { sfx("denied"); UI().toast(`${ic("bulb", 20)} Lampu Noko ada di Toko`); }
      syncActions();
    });
    $("btnFinish").addEventListener("click", () => {
      if (!G) return;
      sfx("click");
      if (G.kind === "level") finishLevel();
      else if (G.kind === "nalar") checkNalar();
      else if (G.kind === "free") saveFree();
      else saveColor();
    });
    $("ideaCard").addEventListener("click", () => { if (G && G.kind === "free") { newIdea(); sfx("click"); } });

    /* modal hasil */
    $("btnRetry").addEventListener("click", () => {
      const r = resultCtx;
      closeResult();
      if (r.daily) startDaily();
      else startLevel(r.lv, { assisted: r.assisted });
    });
    $("btnAssist").addEventListener("click", () => { const r = resultCtx; closeResult(); startLevel(r.lv, { assisted: true }); });
    $("btnColor").addEventListener("click", () => { const r = resultCtx; if (r && r.entry) startColor(r.entry, "result"); });
    $("btnNext").addEventListener("click", () => {
      const r = resultCtx;
      closeResult();
      if (r.daily) return goHome();
      const next = KA.levels.get(r.lv.id + 1);
      if (next && KA.levels.isUnlocked(next.id)) {
        if (next.island !== r.lv.island) {
          S().setLastIsland(next.island);
          goHome(); /* tampilkan kartu pembuka pulau baru */
        } else startLevel(next);
      } else goHome();
    });
    $("btnResHome").addEventListener("click", goHome);
  }

  /* ================= BOOT ================= */
  function boot() {
    S().init();
    paintStaticIcons();
    UI().applyMotion();
    E().init({ tpl: $("tpl"), paint: $("paint"), draw: $("draw"), fx: $("fx"), wrap: $("canvasWrap") });
    UI().init();
    wireGame();

    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const h = () => UI().applyMotion();
      if (mq.addEventListener) mq.addEventListener("change", h);
    }

    UI().show("scr-home");
    UI().renderHome();

    const steps = [];
    if (S().listProfiles().length > 1) steps.push((done) => UI().pickProfile(done));
    if (!D().seenIntro) steps.push((done) => UI().showIntro(done));
    const run = () => {
      const s = steps.shift();
      if (s) s(run);
      else { UI().arriveHome(); playMusic(); }
    };
    run();

    /* browser membuka kunci audio hanya setelah interaksi */
    const unlock = () => {
      if (KA.audio.unlock) KA.audio.unlock();
      playMusic();
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { flushPlay(); KA.audio.stopMusic(); }
      else { if (G) G.t0 = performance.now(); playMusic(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return {
    boot, startLevel, startDaily, startFree, startColor, startColoringPage, goHome, playMusic, onProfileChanged, paintStaticIcons,
    get ctx() { return G; },
  };
})();

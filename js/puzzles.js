/* Kanvas Ajaib: data dan alur 10 Tantangan Nalar (GAME-DESIGN §6). Murni, memakai KA.reason saat runtime.
   Tiap teka-teki punya beberapa set soal (`sets`); `use(id, v)` memilih set yang aktif, dan `steps` selalu
   menunjuk ke set aktif sehingga engine, checkStep, dan summarize memakai soal yang sama. */
window.KA = window.KA || {};

KA.puzzles = (function () {
  const G = 8, O = 10;                 // kisi: kotak 8 satuan, 10×10 kotak dari 10 sampai 90
  const GRID = { size: G, origin: [O, O], cols: 10, rows: 10 };
  const GOPT = { grid: G, origin: [O, O] };
  const cell = (i, j) => [O + G * i, O + G * j];          // titik kisi (j ke bawah)
  const cc = (pts) => pts.map(([i, j]) => cell(i, j));
  const closeP = (p) => p.concat([p[0]]);
  const R = () => KA.reason;

  const hints = (t1, t2, show2, t3, show3) => [
    { level: 1, text: t1 },
    { level: 2, text: t2, show: show2 },
    { level: 3, text: t3, show: show3 },
  ];
  const firstEdges = (pl, k) => [pl.slice(0, k + 1)];

  /* ================= Pulau 1: Bangun Rahasia ================= */
  function shapeStep(id, text, task, spec, ans, h1) {
    const n = ans.length - 1;
    return {
      id, text, task, input: "draw",
      view: { grid: GRID },
      answer: { polylines: [ans] },
      hints: hints(h1, n <= 4 ? "Sambungkan titik-titik ini" : "Titik-titik ini membantumu",
        { kind: "dots", pts: ans.slice(0, n) }, "Dua sisi sudah ada", { kind: "partial", polylines: firstEdges(ans, 2) }),
      check: (inp) => R().checkShape(inp.strokes, spec, GOPT),
    };
  }
  const SH = {
    tri: closeP(cc([[2, 7], [5, 2], [8, 7]])),
    sq: closeP(cc([[2, 2], [6, 2], [6, 6], [2, 6]])),
    par: closeP(cc([[2, 3], [6, 3], [8, 7], [4, 7]])),
    rtri: closeP(cc([[2, 2], [2, 7], [7, 7]])),
    rect: closeP(cc([[1, 3], [7, 3], [7, 6], [1, 6]])),
    trap: closeP(cc([[3, 2], [6, 2], [8, 6], [1, 6]])),
    rhom: closeP(cc([[5, 1], [8, 5], [5, 9], [2, 5]])),
    pent: closeP(cc([[5, 1], [9, 4], [7, 8], [3, 8], [1, 4]])),
    hex: closeP(cc([[3, 2], [7, 2], [9, 5], [7, 8], [3, 8], [1, 5]])),
  };
  const bangun = {
    id: "bangun", island: 1, pos: 4, name: "Bangun Rahasia", topic: "Sifat bangun datar", anim: "pop", paper: "grid",
    sets: [
      [
        shapeStep("bangun1", "Tebak bangun rahasiaku!", "3 sisi, 3 sudut", { sides: 3 }, SH.tri, "Tiga garis lurus saling bertemu"),
        shapeStep("bangun2", "Sekarang bangun kedua!", "4 sisi sama panjang, semua sudut siku",
          { sides: 4, equalSides: true, allRight: true }, SH.sq, "Semua sisinya sama panjang"),
        shapeStep("bangun3", "Ini yang paling sulit!", "4 sisi, sepasang-sepasang sejajar, tidak ada sudut siku",
          { sides: 4, parallelPairs: 2, noRight: true }, SH.par, "Seperti persegi yang didorong miring"),
      ],
      [
        shapeStep("bangun1b", "Tebak bangun rahasiaku!", "3 sisi, tepat 1 sudut siku", { sides: 3, rightAngles: 1 }, SH.rtri,
          "Satu sudutnya seperti pojok buku"),
        shapeStep("bangun2b", "Sekarang bangun kedua!", "4 sudut siku, tapi bukan persegi",
          { sides: 4, allRight: true, notEqual: true }, SH.rect, "Dua sisi panjang, dua sisi pendek"),
        shapeStep("bangun3b", "Ini yang paling sulit!", "4 sisi, hanya sepasang sisi sejajar",
          { sides: 4, parallelExact: 1 }, SH.trap, "Atas dan bawah sejajar, samping miring"),
      ],
      [
        shapeStep("bangun1c", "Tebak bangun rahasiaku!", "4 sisi sama panjang, tidak ada sudut siku",
          { sides: 4, equalSides: true, noRight: true }, SH.rhom, "Seperti layang-layang yang sama sisi"),
        shapeStep("bangun2c", "Sekarang bangun kedua!", "5 sisi, 5 sudut", { sides: 5 }, SH.pent, "Hitung sisinya sampai lima"),
        shapeStep("bangun3c", "Ini yang paling sulit!", "6 sisi, 6 sudut", { sides: 6 }, SH.hex, "Seperti sarang lebah"),
      ],
    ],
  };

  /* ================= Pulau 1: Lipat Cermin ================= */
  function foldStep(id, text, task, full, axis, anim, h1) {
    const r = R();
    const shown = r.clipHalf(full, axis, 50, -1);
    const missing = r.clipHalf(full, axis, 50, +1);
    const corners = missing.flat().filter((p, i, a) => a.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.5) === i);
    return {
      id, text, task, input: "draw", anim,
      view: { template: shown, axis: { dir: axis, at: 50 } },
      answer: { polylines: missing },
      hints: hints(h1, "Titik-titik ini membantumu", { kind: "dots", pts: corners },
        "Separuhnya sudah ada", { kind: "partial", polylines: missing.map((pl) => pl.slice(0, Math.ceil(pl.length / 2))) }),
      check: (inp) => R().checkTrace(inp.strokes, missing, {
        tol: 7, wrong: [{ polylines: shown, reason: "Gambar di sisi sebelahnya" }],
      }),
    };
  }
  const mirrorH = (top) => [top.concat(top.slice(0, -1).reverse().map(([x, y]) => [x, 100 - y]))];
  const FOLD = {
    tree: [closeP([[50, 14], [68, 38], [59, 38], [74, 60], [55, 60], [55, 82], [45, 82], [45, 60], [26, 60], [41, 38], [32, 38]])],
    fish: mirrorH([[14, 50], [28, 36], [50, 30], [68, 38], [86, 26], [86, 50]]),
    rocket: [closeP([[50, 10], [60, 26], [60, 64], [70, 78], [60, 74], [56, 84], [44, 84], [40, 74], [30, 78], [40, 64], [40, 26]])],
    arrow: mirrorH([[12, 50], [12, 40], [58, 40], [58, 26], [88, 50]]),
    crown: [closeP([[24, 74], [24, 40], [37, 56], [50, 30], [63, 56], [76, 40], [76, 74]])],
    leaf: mirrorH([[10, 50], [30, 34], [50, 28], [70, 34], [90, 50]]),
  };
  function buildLipat() {
    return {
      id: "lipat", island: 1, pos: 8, name: "Lipat Cermin", topic: "Simetri lipat", anim: "sway", paper: "plain",
      sets: [
        [
          foldStep("lipat1", "Lipat kertasnya di tengah!", "Gambar separuh kanan pohon", FOLD.tree, "v", "sway", "Kanan sama dengan kiri"),
          foldStep("lipat2", "Sekarang lipat mendatar!", "Gambar separuh bawah ikan", FOLD.fish, "h", "swim", "Bawah sama dengan atas"),
        ],
        [
          foldStep("lipat1b", "Lipat kertasnya di tengah!", "Gambar separuh kanan roket", FOLD.rocket, "v", "launch", "Kanan sama dengan kiri"),
          foldStep("lipat2b", "Sekarang lipat mendatar!", "Gambar separuh bawah panah", FOLD.arrow, "h", "fly", "Bawah sama dengan atas"),
        ],
        [
          foldStep("lipat1c", "Lipat kertasnya di tengah!", "Gambar separuh kanan mahkota", FOLD.crown, "v", "twinkle", "Kanan sama dengan kiri"),
          foldStep("lipat2c", "Sekarang lipat mendatar!", "Gambar separuh bawah daun", FOLD.leaf, "h", "sway", "Bawah sama dengan atas"),
        ],
      ],
    };
  }

  /* ================= Pulau 2: Hitung Loncat ================= */
  const lbl = (arr) => arr.map(([label, x, y]) => ({ label, x, y }));
  /* titik bentuk diberi label start, start+k, ...; pengecoh = [label, x, y] */
  const seqDots = (pts, start, k) => pts.map(([x, y], i) => ({ label: start + i * k, x, y }));
  function jumpStep(id, text, task, targets, decoys, anim, h1) {
    const path = closeP(targets.map((t) => [t.x, t.y]));
    return {
      id, text, task, input: "draw", anim,
      view: { dots: targets.concat(decoys).sort((a, b) => a.label - b.label).map((d) => ({ x: d.x, y: d.y, label: String(d.label) })) },
      targets, decoys, closed: true,
      answer: { polylines: [path] },
      hints: hints(h1, "Titik berikutnya menyala", { kind: "nextDot" },
        "Separuh jalan sudah ada", { kind: "partial", polylines: [path.slice(0, Math.ceil(path.length / 2))] }),
      check: (inp) => R().checkPath(inp.strokes, targets, { tol: 3.2, decoys, closed: true, prefix: "Nomor" }),
    };
  }
  const JUMP = {
    fish: lbl([[2, 18, 50], [4, 30, 36], [6, 48, 30], [8, 64, 35], [10, 74, 45], [12, 88, 33],
      [14, 88, 67], [16, 74, 55], [18, 64, 65], [20, 48, 70], [22, 30, 64]]),
    fishD: lbl([[7, 40, 50], [11, 58, 51], [15, 50, 88]]),
    cat: lbl([[3, 30, 80], [6, 30, 42], [9, 36, 20], [12, 46, 34], [15, 54, 34], [18, 64, 20],
      [21, 70, 42], [24, 70, 80], [27, 58, 90], [30, 42, 90]]),
    catD: lbl([[10, 50, 60], [16, 50, 10], [20, 86, 60], [25, 14, 60]]),
    house: seqDots([[25, 82], [25, 46], [50, 20], [75, 46], [75, 82], [58, 82], [58, 62], [42, 62], [42, 82]], 4, 4),
    houseD: lbl([[10, 50, 48], [18, 88, 30], [22, 12, 30]]),
    star: seqDots([[50, 16], [58.8, 39.9], [84.2, 40.9], [64.3, 56.6], [71.2, 81.1], [50, 67], [28.8, 81.1], [35.7, 56.6], [15.8, 40.9], [41.2, 39.9]], 5, 5),
    starD: lbl([[12, 50, 52], [23, 12, 15], [37, 88, 88]]),
    boat: seqDots([[20, 62], [48, 62], [48, 18], [78, 56], [52, 56], [52, 62], [84, 62], [72, 80], [30, 80]], 10, 2),
    boatD: lbl([[15, 30, 35], [21, 90, 30], [19, 50, 90]]),
    rocket: seqDots([[50, 10], [60, 26], [60, 64], [70, 78], [50, 72], [30, 78], [40, 64], [40, 26]], 10, 10),
    rocketD: lbl([[35, 50, 45], [45, 85, 20], [55, 15, 50]]),
  };
  const loncat = {
    id: "loncat", island: 2, pos: 4, name: "Hitung Loncat", topic: "Pola bilangan", anim: "hop", paper: "plain",
    sets: [
      [
        jumpStep("loncat1", "Loncat dua-dua, yuk!", "Hubungkan 2, 4, 6, ... sampai 22, lalu kembali ke 2",
          JUMP.fish, JUMP.fishD, "swim", "Tambah 2 setiap loncat"),
        jumpStep("loncat2", "Sekarang loncat tiga-tiga!", "Hubungkan 3, 6, 9, ... sampai 30, lalu kembali ke 3",
          JUMP.cat, JUMP.catD, "sway", "Tambah 3 setiap loncat"),
      ],
      [
        jumpStep("loncat1b", "Loncat empat-empat, yuk!", "Hubungkan 4, 8, 12, ... sampai 36, lalu kembali ke 4",
          JUMP.house, JUMP.houseD, "pop", "Tambah 4 setiap loncat"),
        jumpStep("loncat2b", "Sekarang loncat lima-lima!", "Hubungkan 5, 10, 15, ... sampai 50, lalu kembali ke 5",
          JUMP.star, JUMP.starD, "twinkle", "Tambah 5 setiap loncat"),
      ],
      [
        jumpStep("loncat1c", "Mulai dari 10, loncat dua!", "Hubungkan 10, 12, 14, ... sampai 26, lalu kembali ke 10",
          JUMP.boat, JUMP.boatD, "rock", "Tambah 2 setiap loncat"),
        jumpStep("loncat2c", "Sekarang loncat sepuluh!", "Hubungkan 10, 20, 30, ... sampai 80, lalu kembali ke 10",
          JUMP.rocket, JUMP.rocketD, "launch", "Tambah 10 setiap loncat"),
      ],
    ],
  };

  /* ================= Pulau 2: Pola Berulang ================= */
  function idealShape(kind, b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, s = b.w * 0.35;
    if (kind === "circle") {
      const p = [];
      for (let i = 0; i <= 40; i++) p.push([cx + Math.cos((i / 40) * 2 * Math.PI) * s, cy + Math.sin((i / 40) * 2 * Math.PI) * s]);
      return p;
    }
    if (kind === "triangle") return closeP([[cx, cy - s], [cx + s, cy + s * 0.8], [cx - s, cy + s * 0.8]]);
    return closeP([[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]]);
  }
  function patternStep(id, text, task, seq, expect, unit, anim) {
    const w = 10, gap = 2, tot = seq.length * w + (seq.length - 1) * gap, x0 = (100 - tot) / 2;
    const given = seq.map((shape, i) => ({ x: x0 + i * (w + gap), y: 14, w, h: w, shape }));
    const blanks = [{ x: 14, y: 46, w: 32, h: 32, blank: true }, { x: 54, y: 46, w: 32, h: 32, blank: true }];
    const answer = expect.map((k, i) => idealShape(k, blanks[i]));
    return {
      id, text, task, input: "draw", anim,
      view: { boxes: given.concat(blanks) },
      blanks, expect,
      answer: { polylines: answer },
      hints: hints("Cari bagian yang berulang", "Ini bagian yang berulang", { kind: "boxes", idx: given.slice(0, unit).map((_, i) => i) },
        "Kotak pertama sudah terisi", { kind: "partial", polylines: [answer[0]] }),
      check: (inp) => R().checkPattern(inp.strokes, blanks, expect),
    };
  }
  const C = "circle", T = "triangle", S = "square";
  const pola = {
    id: "pola", island: 2, pos: 8, name: "Pola Berulang", topic: "Pola bentuk", anim: "twinkle", paper: "plain",
    sets: [
      [
        patternStep("pola1", "Apa bentuk berikutnya?", "Gambar dua bentuk berikutnya", [C, T, C, T, C, T], [C, T], 2, "twinkle"),
        patternStep("pola2", "Polanya makin panjang!", "Gambar dua bentuk berikutnya", [C, T, S, C, T, S, C], [T, S], 3, "twinkle"),
      ],
      [
        patternStep("pola1b", "Apa bentuk berikutnya?", "Gambar dua bentuk berikutnya", [T, S, T, S, T], [S, T], 2, "twinkle"),
        patternStep("pola2b", "Polanya makin panjang!", "Gambar dua bentuk berikutnya", [S, C, C, S, C, C, S], [C, C], 3, "twinkle"),
      ],
      [
        patternStep("pola1c", "Apa bentuk berikutnya?", "Gambar dua bentuk berikutnya", [C, C, T, C, C, T, C], [C, T], 3, "twinkle"),
        patternStep("pola2c", "Polanya makin panjang!", "Gambar dua bentuk berikutnya", [S, T, C, S, T, C, S, T], [C, S], 3, "twinkle"),
      ],
    ],
  };

  /* ================= Pulau 3: Peta Koordinat ================= */
  const coord = (i, j) => [O + G * i, 100 - O - G * j];   // (0,0) kiri bawah, y ke atas
  function coordStep(id, text, task, pairs, anim) {
    const targets = pairs.map(([i, j]) => { const [x, y] = coord(i, j); return { x, y, label: `(${i},${j})`, i, j }; });
    const path = closeP(targets.map((t) => [t.x, t.y]));
    /* pengecoh: koordinat tertukar (j,i) yang tidak terletak di jalur */
    const segD = (p, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
      return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    };
    const decoys = [];
    for (const [i, j] of pairs) {
      if (i === j || j > 10 || i > 10) continue;
      const [x, y] = coord(j, i);
      let m = Infinity;
      for (let k = 0; k < path.length - 1; k++) m = Math.min(m, segD([x, y], path[k], path[k + 1]));
      if (m > G * 0.9 && !decoys.some((d) => d.x === x && d.y === y)) decoys.push({ x, y, label: `(${j},${i})` });
    }
    return {
      id, text, task, input: "draw", anim,
      view: { grid: Object.assign({ axes: { x0: O, y0: 100 - O, max: 10 } }, GRID), card: targets.map((t) => t.label) },
      targets, decoys, closed: true,
      answer: { polylines: [path] },
      hints: hints("Ke kanan dulu, lalu naik", "Titik berikutnya menyala", { kind: "nextDot" },
        "Separuh jalan sudah ada", { kind: "partial", polylines: [path.slice(0, Math.ceil(path.length / 2))] }),
      check: (inp) => R().checkPath(inp.strokes, targets, { tol: 0.4 * G, decoys, closed: true, prefix: "Titik" }),
    };
  }
  const MAPTXT = "Hubungkan titik sesuai kartu, lalu kembali ke awal";
  const koordinat = {
    id: "koordinat", island: 3, pos: 4, name: "Peta Koordinat", topic: "Koordinat", anim: "drive", paper: "grid",
    sets: [
      [
        coordStep("koordinat1", "Ikuti peta harta karun!", MAPTXT, [[1, 2], [1, 5], [3, 5], [4, 7], [7, 7], [8, 5], [9, 5], [9, 2]], "drive"),
        coordStep("koordinat2", "Satu peta lagi!", MAPTXT, [[5, 10], [7, 7], [7, 2], [9, 0], [1, 0], [3, 2], [3, 7]], "launch"),
      ],
      [
        coordStep("koordinat1b", "Ikuti peta harta karun!", MAPTXT, [[1, 1], [1, 6], [5, 9], [9, 6], [9, 1]], "pop"),
        coordStep("koordinat2b", "Satu peta lagi!", MAPTXT, [[0, 5], [3, 8], [6, 8], [8, 6], [10, 8], [10, 2], [8, 4], [6, 2], [3, 2]], "swim"),
      ],
      [
        coordStep("koordinat1c", "Ikuti peta harta karun!", MAPTXT, [[5, 10], [8, 6], [5, 1], [2, 6]], "fly"),
        coordStep("koordinat2c", "Satu peta lagi!", MAPTXT, [[4, 0], [4, 3], [1, 3], [5, 8], [9, 3], [6, 3], [6, 0]], "sway"),
      ],
    ],
  };

  /* ================= Pulau 3: Geser dan Putar ================= */
  function moveStep(id, text, task, shape, dx, dy, wrongs, h1, hintCells) {
    const r = R();
    const moved = r.translate(shape, dx * G, dy * G);
    return {
      id, text, task, input: "draw", anim: "rock",
      view: { grid: GRID, template: shape },
      answer: { polylines: moved },
      hints: hints(h1, "Hitung kotaknya", { kind: "cells", cells: hintCells },
        "Satu sisi sudah ada", { kind: "partial", polylines: [moved[0].slice(0, 3)] }),
      check: (inp) => r.checkTrace(inp.strokes, moved, {
        tol: 6, wrong: [{ polylines: shape, reason: "Belum digeser, coba lagi" }].concat(wrongs.map(([wx, wy]) => ({
          polylines: r.translate(shape, wx * G, wy * G), reason: "Hitung lagi kotaknya",
        }))),
      }),
    };
  }
  function turnStep(id, text, task, shape, pivotCell, turn, h1) {
    const r = R();
    const [px, py] = cell(pivotCell[0], pivotCell[1]);
    const cw = (pl) => r.rotate90(pl, px, py, true), ccw = (pl) => r.rotate90(pl, px, py, false);
    const target = turn === "cw" ? cw(shape) : turn === "ccw" ? ccw(shape) : cw(cw(shape));
    const wrong = [{ polylines: shape, reason: "Belum diputar, coba lagi" }];
    if (turn !== "cw") wrong.push({ polylines: cw(shape), reason: turn === "ccw" ? "Putar ke arah sebaliknya" : "Itu baru seperempat putaran" });
    if (turn !== "ccw") wrong.push({ polylines: ccw(shape), reason: turn === "cw" ? "Putar ke arah sebaliknya" : "Itu baru seperempat putaran" });
    if (turn !== "half") wrong.push({ polylines: cw(cw(shape)), reason: "Itu setengah putaran" });
    return {
      id, text, task, input: "draw", anim: "rock",
      view: { grid: GRID, template: shape, pivot: { x: px, y: py } },
      answer: { polylines: target },
      hints: hints(h1, "Ujung tiang pindah ke sini", { kind: "dots", pts: [target[0][1]] },
        "Tiangnya sudah ada", { kind: "partial", polylines: [target[0].slice(0, 2)] }),
      check: (inp) => r.checkTrace(inp.strokes, target, { tol: 6, wrong }),
    };
  }
  function buildGeser() {
    const L = [closeP(cc([[1, 2], [1, 7], [2, 7], [2, 3], [4, 3], [4, 2]]))];
    const Tsh = [closeP(cc([[2, 1], [7, 1], [7, 2], [5, 2], [5, 5], [4, 5], [4, 2], [2, 2]]))];
    const Z = [closeP(cc([[6, 2], [8, 2], [8, 4], [9, 4], [9, 6], [6, 6]]))];
    const flag = [cc([[5, 5], [5, 1], [8, 2], [5, 3]])];
    const flag2 = [cc([[5, 5], [5, 2], [7, 3], [5, 4]])];
    return {
      id: "geser", island: 3, pos: 8, name: "Geser dan Putar", topic: "Transformasi", anim: "rock", paper: "grid",
      sets: [
        [
          moveStep("geser1", "Ayo pindahkan bentuknya!", "Geser 3 kotak ke kanan", L, 3, 0, [[2, 0], [4, 0]],
            "Setiap titik pindah 3 kotak", [[1, 2], [2, 2], [3, 2]]),
          turnStep("geser2", "Sekarang putar benderanya!", "Putar seperempat putaran searah jarum jam", flag, [5, 5], "cw",
            "Tiangnya jadi mendatar"),
        ],
        [
          moveStep("geser1b", "Ayo pindahkan bentuknya!", "Geser 2 kotak ke bawah", Tsh, 0, 2, [[0, 1], [0, 3]],
            "Setiap titik turun 2 kotak", [[2, 1], [2, 2]]),
          turnStep("geser2b", "Sekarang putar benderanya!", "Putar seperempat putaran berlawanan arah jarum jam", flag, [5, 5], "ccw",
            "Tiangnya jadi mendatar ke kiri"),
        ],
        [
          moveStep("geser1c", "Ayo pindahkan bentuknya!", "Geser 4 kotak ke kiri", Z, -4, 0, [[-3, 0], [-5, 0]],
            "Setiap titik pindah 4 kotak", [[6, 2], [5, 2], [4, 2], [3, 2]]),
          turnStep("geser2c", "Sekarang putar benderanya!", "Putar setengah putaran", flag2, [5, 5], "half",
            "Tiangnya jadi menghadap ke bawah"),
        ],
      ],
    };
  }

  /* ================= Pulau 4: Pecahan Warna ================= */
  function seedOf(spec, k) {
    if (spec.kind === "sectors") {
      const rot = spec.rot != null ? spec.rot : -Math.PI / 2;
      const a = rot + ((k + 0.5) / spec.n) * 2 * Math.PI;
      return { x: spec.cx + Math.cos(a) * spec.r * 0.55, y: spec.cy + Math.sin(a) * spec.r * 0.55 };
    }
    const c = k % spec.cols, rw = Math.floor(k / spec.cols);
    return { x: spec.x + (spec.w * (c + 0.5)) / spec.cols, y: spec.y + (spec.h * (rw + 0.5)) / spec.rows };
  }
  function fracStep(id, text, task, spec, num, den, anim, h1) {
    const n = spec.kind === "sectors" ? spec.n : spec.cols * spec.rows;
    const need = Math.round((num / den) * n);
    return {
      id, text, task, input: "fill", anim,
      view: { regions: spec, fraction: `${num}/${den}` },
      regions: spec, target: num / den,
      answer: { fills: Array.from({ length: need }, (_, k) => seedOf(spec, k)) },
      hints: hints(h1, "Hitung semua bagiannya", { kind: "labels" },
        "Satu bagian sudah berwarna", { kind: "fills", fills: [seedOf(spec, 0)] }),
      check: (inp) => R().checkFill(spec, inp.fills || [], num / den),
    };
  }
  const pie = (n) => ({ kind: "sectors", cx: 50, cy: 52, r: 32, n });
  const bar = (cols, rows) => ({ kind: "cells", x: 20, y: rows > 2 ? 22 : 32, w: 60, h: rows > 2 ? 60 : 40, cols, rows });
  const pecahan = {
    id: "pecahan", island: 4, pos: 4, name: "Pecahan Warna", topic: "Pecahan", anim: "spin", paper: "plain",
    sets: [
      [
        fracStep("pecahan1", "Warnai kue bulanku!", "Warnai 3/4 lingkaran", pie(4), 3, 4, "spin", "3 dari 4 bagian"),
        fracStep("pecahan2", "Sekarang kue kotak!", "Warnai 2/3 persegi panjang", bar(3, 2), 2, 3, "twinkle", "2/3 sama dengan 4/6"),
      ],
      [
        fracStep("pecahan1b", "Warnai pizza bundarku!", "Warnai 5/8 lingkaran", pie(8), 5, 8, "spin", "5 dari 8 bagian"),
        fracStep("pecahan2b", "Sekarang kue kotak!", "Warnai 3/4 persegi panjang", bar(4, 2), 3, 4, "twinkle", "3/4 sama dengan 6/8"),
      ],
      [
        fracStep("pecahan1c", "Warnai kue bulanku!", "Warnai 1/2 lingkaran", pie(6), 1, 2, "spin", "1/2 sama dengan 3/6"),
        fracStep("pecahan2c", "Sekarang kue kotak!", "Warnai 2/3 persegi", bar(3, 3), 2, 3, "twinkle", "2/3 sama dengan 6/9"),
      ],
    ],
  };

  /* ================= Pulau 4: Luas Kotak, Pulau 5: Keliling Pagar ================= */
  function sizeSteps(prefix, kind, value, a1, a2, word) {
    const check = (strokes, notDims) => kind === "area"
      ? R().checkArea(strokes, Object.assign({ area: value, notDims }, GOPT))
      : R().checkPerimeter(strokes, Object.assign({ perimeter: value, notDims }, GOPT));
    const h1 = kind === "area" ? "Luas = panjang kali lebar" : "Keliling = jumlah semua sisi";
    return [
      {
        id: prefix + "1", text: kind === "area" ? `Bangun kebun ${value} kotak!` : `Pagar sepanjang ${value} kotak!`,
        task: `Gambar persegi panjang yang ${word} ${value} kotak`, input: "draw", anim: "pop",
        view: { grid: GRID },
        answer: { polylines: [a1] },
        hints: hints(h1, "Satu kotak satuan menyala", { kind: "cells", cells: [[a1[0][0] / G - O / G, a1[0][1] / G - O / G]] },
          "Dua sisi sudah ada", { kind: "partial", polylines: firstEdges(a1, 2) }),
        check: (inp) => check(inp.strokes, null),
      },
      {
        id: prefix + "2", text: "Ada cara lain?", task: `Gambar persegi panjang ${word} ${value} kotak dengan ukuran berbeda`,
        input: "draw", anim: "pop", optional: true, bonus: "second",
        view: { grid: GRID },
        answer: { polylines: [a2] },
        hints: hints("Coba sisi yang lebih panjang", "Satu kotak satuan menyala", { kind: "cells", cells: [[a2[0][0] / G - O / G, a2[0][1] / G - O / G]] },
          "Dua sisi sudah ada", { kind: "partial", polylines: firstEdges(a2, 2) }),
        check: (inp) => {
          const first = (inp.prev || []).find((p) => p && p.ok && p.dims);
          return check(inp.strokes, first ? first.dims : null);
        },
      },
    ];
  }
  const rc = (i0, j0, w, h) => closeP(cc([[i0, j0], [i0 + w, j0], [i0 + w, j0 + h], [i0, j0 + h]]));
  const luas = {
    id: "luas", island: 4, pos: 8, name: "Luas Kotak", topic: "Luas", anim: "pop", paper: "grid",
    sets: [
      sizeSteps("luas", "area", 12, rc(2, 2, 3, 4), rc(1, 3, 6, 2), "luasnya"),
      sizeSteps("luasb", "area", 16, rc(3, 3, 4, 4), rc(1, 4, 8, 2), "luasnya"),
      sizeSteps("luasc", "area", 18, rc(2, 2, 3, 6), rc(0, 4, 9, 2), "luasnya"),
    ],
  };
  const keliling = {
    id: "keliling", island: 5, pos: 8, name: "Keliling Pagar", topic: "Keliling", anim: "pop", paper: "grid",
    sets: [
      sizeSteps("keliling", "per", 14, rc(2, 2, 3, 4), rc(1, 3, 5, 2), "kelilingnya"),
      sizeSteps("kelilingb", "per", 16, rc(2, 2, 3, 5), rc(1, 3, 6, 2), "kelilingnya"),
      sizeSteps("kelilingc", "per", 12, rc(2, 2, 2, 4), rc(1, 3, 5, 1), "kelilingnya"),
    ],
  };

  /* ================= Pulau 5: Simetri Putar ================= */
  /* `arm` = daftar polyline satu lengan; lengan diputar n kali di sekitar pusat; `miss` = indeks lengan yang hilang */
  function rotStep(id, text, task, arm, n, miss, anim, h1) {
    const r = R();
    const arms = Array.from({ length: n }, (_, i) => r.rotate(arm, 50, 50, (360 / n) * i));
    const shown = arms.filter((_, i) => !miss.includes(i)).flat();
    const missing = arms.filter((_, i) => miss.includes(i)).flat();
    const tips = missing.map((pl) => pl.reduce((b, p) => (Math.hypot(p[0] - 50, p[1] - 50) > Math.hypot(b[0] - 50, b[1] - 50) ? p : b), pl[0]));
    return {
      id, text, task, input: "draw", anim,
      view: { template: shown, pivot: { x: 50, y: 50 } },
      answer: { polylines: missing },
      hints: hints(h1, "Ujung lengannya di sini", { kind: "dots", pts: tips },
        "Separuh lengan sudah ada", { kind: "partial", polylines: missing.map((pl) => pl.slice(0, Math.ceil(pl.length / 2))) }),
      check: (inp) => r.checkTrace(inp.strokes, missing, { tol: 7 }),
    };
  }
  const ARM = {
    pinwheel: [closeP([[50, 50], [50, 18], [66, 34]])],
    starfish: [closeP([[44, 47], [50, 15], [56, 47]])],
    propeller: [closeP([[50, 50], [44, 24], [50, 14], [56, 24]])],
    petal: [closeP([[50, 50], [44, 34], [50, 20], [56, 34]])],
    cross: [[[45, 45], [45, 16], [55, 16], [55, 45]]],
    flake: [[[50, 50], [50, 16]], [[50, 28], [43, 21]], [[50, 28], [57, 21]]],
  };
  function buildPutar() {
    return {
      id: "putar", island: 5, pos: 4, name: "Simetri Putar", topic: "Simetri putar", anim: "spin", paper: "plain",
      sets: [
        [
          rotStep("putar1", "Kincirnya kehilangan baling!", "Lengkapi kincir, setiap lengan sama", ARM.pinwheel, 4, [1], "spin",
            "Putar lengan seperempat putaran"),
          rotStep("putar2", "Bintang laut butuh lengan!", "Lengkapi 2 lengan yang hilang", ARM.starfish, 5, [2, 4], "spin",
            "Lima lengan sama besar"),
        ],
        [
          rotStep("putar1b", "Baling-balingnya patah!", "Lengkapi baling-baling, setiap daun sama", ARM.propeller, 3, [2], "spin",
            "Tiga daun, putar sepertiga"),
          rotStep("putar2b", "Bunganya kurang kelopak!", "Lengkapi 2 kelopak yang hilang", ARM.petal, 6, [1, 4], "spin",
            "Enam kelopak sama besar"),
        ],
        [
          rotStep("putar1c", "Tanda tambahnya rusak!", "Lengkapi 2 lengan yang hilang", ARM.cross, 4, [1, 2], "spin",
            "Putar lengan seperempat putaran"),
          rotStep("putar2c", "Kepingan salju kurang satu!", "Lengkapi lengan yang hilang", ARM.flake, 6, [3], "spin",
            "Enam lengan sama persis"),
        ],
      ],
    };
  }

  /* ---------- daftar (dibangun malas karena beberapa template memakai KA.reason) ---------- */
  let LIST = null;
  function all() {
    if (!LIST) {
      LIST = [bangun, buildLipat(), loncat, pola, koordinat, buildGeser(), pecahan, luas, buildPutar(), keliling];
      LIST.forEach((p) => { p.variant = 0; p.steps = p.sets[0]; });
    }
    return LIST;
  }

  /* ---------- bintang Nalar (§6a) ---------- */
  function stars(o) {
    o = o || {};
    if (!o.correct) return 0;
    if ((o.hintLevel || 0) > 0) return 1;
    if (o.secondAnswer === true) return 3;
    if (o.secondAnswer === false) return 2;
    if (o.quality == null) return 3;
    return o.quality >= 0.85 ? 3 : 2;
  }
  /* rangkum hasil langkah → masukan stars(): results[i] = hasil check langkah i (atau null) */
  function summarize(puzzle, results, hintLevel) {
    const p = typeof puzzle === "string" ? get(puzzle) : puzzle;
    const req = p.steps.map((s, i) => [s, results[i]]).filter(([s]) => !s.optional);
    const correct = req.every(([, r]) => r && r.ok);
    const qs = req.map(([, r]) => r && r.quality).filter((q) => q != null);
    const bonus = p.steps.findIndex((s) => s.bonus === "second");
    return {
      correct,
      hintLevel: hintLevel || 0,
      quality: qs.length ? Math.min(...qs) : null,
      secondAnswer: bonus >= 0 ? !!(results[bonus] && results[bonus].ok) : undefined,
    };
  }

  function get(id) { return all().find((p) => p.id === id) || null; }

  /* pilih set soal aktif (v berputar sesuai jumlah set) */
  function use(id, v) {
    const p = get(id);
    if (!p) return null;
    const n = p.sets.length;
    p.variant = (((v | 0) % n) + n) % n;
    p.steps = p.sets[p.variant];
    return p;
  }

  return {
    get list() { return all(); },
    get,
    use,
    variants(id) { const p = get(id); return p ? p.sets.length : 0; },
    at(island, pos) { return all().find((p) => p.island === island && p.pos === pos) || null; },
    forIsland(i) { return all().filter((p) => p.island === i); },
    checkStep(id, stepIndex, input) { return get(id).steps[stepIndex].check(input || {}); },
    /* titik yang perlu disorot untuk petunjuk tingkat 2 ('nextDot') */
    nextDot(step, strokes) {
      if (!step.targets) return null;
      const i = R().pathProgress(strokes || [], step.targets, { tol: 3.2, decoys: step.decoys });
      return step.targets[i] || null;
    },
    stars, summarize,
    GRID,
  };
})();

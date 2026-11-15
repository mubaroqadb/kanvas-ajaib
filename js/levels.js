/* Kanvas Ajaib: 5 pulau × (8 level gambar + 2 Nalar + boss): data, mode, animasi, geometri turunan */
window.KA = window.KA || {};

KA.levels = (function () {
  const TAU = Math.PI * 2;

  /* ---- helper geometri (koordinat 0–100) ---- */
  const close = (p) => [...p, p[0]];

  function circle(cx, cy, r, steps = 32) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return p;
  }

  function arc(cx, cy, r, a0, a1, steps = 22) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return p;
  }

  function ellipse(cx, cy, rx, ry, steps = 36) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return p;
  }

  function line(x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; }

  function star(cx, cy, ro, ri, n = 5, rot = -Math.PI / 2) {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? ri : ro;
      const a = rot + (i / (n * 2)) * TAU;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return close(p);
  }

  function heart(cx, cy, s, steps = 48) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      p.push([cx + x * s, cy - y * s]);
    }
    return p;
  }

  function wave(x0, y0, x1, y1, amp, waves, steps = 40) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      p.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * TAU * waves) * amp]);
    }
    return p;
  }

  /* gelombang tegak: simpangan ke samping (x) sepanjang garis vertikal */
  function vwave(x, y0, y1, amp, waves, steps = 30) {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      p.push([x + Math.sin(t * TAU * waves) * amp, y0 + (y1 - y0) * t]);
    }
    return p;
  }

  const UP = [Math.PI, TAU]; // busur melengkung ke atas (sumbu y kanvas ke bawah)

  /* ================= PULAU 1 · KOTA BENTUK ================= */
  const L1 = [
    { name: "Bintang", mode: "tiru", anim: "twinkle", paths: () => [star(50, 53, 34, 14)] },
    { name: "Hati", mode: "tiru", anim: "beat", paths: () => [heart(50, 46, 2.1)] },
    { name: "Rumah", mode: "langkah", anim: "pop", paths: () => [
      close([[28, 78], [28, 50], [50, 28], [72, 50], [72, 78]]),
      [[45, 78], [45, 62], [55, 62], [55, 78]],
      close([[58, 56], [66, 56], [66, 64], [58, 64]]),
    ] },
    { name: "Matahari", mode: "cermin", anim: "spin", paths: () => {
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        rays.push(line(50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26, 50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38));
      }
      return [circle(50, 50, 20), ...rays];
    } },
    { name: "Jendela", mode: "titik", anim: "pop", paths: () => [
      close([[25, 25], [75, 25], [75, 75], [25, 75]]),
      line(50, 25, 50, 75), line(25, 50, 75, 50), line(20, 80, 80, 80),
    ] },
    { name: "Pesawat Kertas", mode: "kilat", anim: "fly", paths: () => [
      close([[18, 68], [80, 40], [32, 46]]),
      line(80, 40, 42, 62),
      close([[18, 68], [42, 62], [38, 74]]),
    ] },
    { name: "Jembatan", mode: "langkah", anim: "sway", paths: () => [
      line(15, 45, 85, 45),
      arc(50, 45, 25, 0, Math.PI),
      ...[35, 50, 65].map((x) => line(x, 45, x, 45 + Math.sqrt(Math.max(0, 625 - (x - 50) * (x - 50))))),
      line(10, 82, 90, 82), line(22, 82, 22, 45), line(78, 82, 78, 45),
    ] },
    { name: "Menara", mode: "cermin", anim: "sway", paths: () => [
      [[42, 18], [40, 40], [30, 82]],
      [[58, 18], [60, 40], [70, 82]],
      close([[42, 18], [50, 6], [58, 18]]),
      line(40, 40, 60, 40), line(36, 58, 64, 58), line(26, 82, 74, 82),
    ] },
    { name: "Kastel", boss: true, mode: "boss", anim: "pop", paths: () => [
      close([[30, 80], [30, 45], [70, 45], [70, 80]]),
      [[30, 45], [30, 40], [36, 40], [36, 45], [42, 45], [42, 40], [48, 40], [48, 45], [54, 45], [54, 40], [60, 40], [60, 45], [66, 45], [66, 40], [70, 40], [70, 45]],
      close([[20, 80], [20, 35], [32, 35], [32, 80]]),
      close([[68, 80], [68, 35], [80, 35], [80, 80]]),
      close([[20, 35], [26, 26], [32, 35]]),
      close([[68, 35], [74, 26], [80, 35]]),
      [[45, 80], [45, 75]], arc(50, 75, 5, ...UP), [[55, 75], [55, 80]],
    ] },
  ];

  /* ================= PULAU 2 · HEWAN SAHABAT ================= */
  const L2 = [
    { name: "Ikan", mode: "tiru", anim: "swim", paths: () => [
      ellipse(42, 50, 20, 13),
      close([[62, 50], [78, 38], [78, 62]]),
      circle(32, 46, 2.5),
    ] },
    { name: "Kucing", mode: "langkah", anim: "sway", paths: () => [
      circle(50, 55, 20),
      close([[36, 42], [30, 26], [46, 38]]),
      close([[64, 42], [70, 26], [54, 38]]),
      circle(43, 52, 2), circle(57, 52, 2),
      line(34, 56, 20, 52), line(34, 60, 20, 62), line(66, 56, 80, 52), line(66, 60, 80, 62),
    ] },
    { name: "Kepiting", mode: "cermin", anim: "scuttle", paths: () => [
      ellipse(50, 56, 15, 10),
      circle(28, 44, 6), circle(72, 44, 6),
      line(36, 50, 31, 47), line(64, 50, 69, 47),
      line(40, 64, 36, 74), line(50, 66, 50, 76), line(60, 64, 64, 74),
      circle(44, 51, 1.8), circle(56, 51, 1.8),
    ] },
    { name: "Burung", mode: "titik", anim: "flap", paths: () => [
      circle(48, 55, 16),
      circle(64, 42, 8),
      close([[71, 42], [80, 45], [71, 48]]),
      close([[38, 52], [30, 42], [44, 46]]),
      line(32, 60, 22, 56), line(32, 63, 22, 63),
      circle(66, 40, 1.5),
      line(46, 71, 44, 80), line(52, 71, 54, 80),
    ] },
    { name: "Siput", mode: "tiru", anim: "crawl", paths: () => [
      line(25, 75, 78, 75),
      [[78, 75], [80, 60], [72, 52]],
      line(72, 52, 78, 42), line(72, 52, 68, 40),
      circle(48, 60, 15),
      arc(48, 60, 10, 1.4, 5.2),
    ] },
    { name: "Kupu-kupu", mode: "cermin", anim: "flap", paths: () => [
      ellipse(50, 55, 3, 14),
      line(48, 42, 43, 32), line(52, 42, 57, 32),
      circle(36, 44, 13), circle(64, 44, 13),
      circle(40, 66, 9), circle(60, 66, 9),
    ] },
    { name: "Landak", mode: "kilat", anim: "crawl", paths: () => [
      [[26, 62], [30, 50], [34, 60], [40, 42], [44, 56], [50, 38], [54, 56], [60, 42], [64, 58], [70, 50], [74, 62]],
      line(26, 62, 78, 62),
      circle(79, 60, 2), circle(70, 57, 1.5),
      line(36, 62, 34, 70), line(66, 62, 68, 70),
    ] },
    { name: "Penguin", mode: "langkah", anim: "sway", paths: () => [
      close([[38, 25], [62, 25], [70, 50], [62, 78], [38, 78], [30, 50]]),
      circle(43, 38, 1.5), circle(57, 38, 1.5),
      close([[46, 44], [54, 44], [50, 49]]),
      [[38, 30], [28, 48], [38, 64]],
      [[62, 30], [72, 48], [62, 64]],
      line(42, 78, 40, 84), line(58, 78, 60, 84),
    ] },
    { name: "Naga", boss: true, mode: "boss", anim: "flap", paths: () => [
      wave(20, 65, 70, 45, 6, 1.5),
      close([[70, 45], [84, 47], [72, 52]]),
      [[45, 48], [52, 30], [58, 46], [64, 28], [68, 44]],
      close([[20, 65], [12, 58], [22, 58]]),
      circle(74, 46, 1.5),
      line(40, 70, 38, 78), line(55, 66, 54, 74),
    ] },
  ];

  /* ================= PULAU 3 · RONGSOKAN ================= */
  const L3 = [
    { name: "Mobil", mode: "tiru", anim: "drive", paths: () => [
      close([[22, 62], [22, 50], [32, 50], [38, 40], [58, 40], [64, 50], [78, 50], [78, 62]]),
      circle(34, 64, 6), circle(66, 64, 6),
      close([[41, 49], [43, 42], [50, 42], [50, 49]]),
      close([[53, 49], [53, 42], [59, 42], [63, 49]]),
    ] },
    { name: "Roket", mode: "cermin", anim: "launch", paths: () => [
      close([[42, 70], [42, 35], [50, 18], [58, 35], [58, 70]]),
      circle(50, 38, 5),
      close([[42, 70], [32, 80], [42, 55]]),
      close([[58, 70], [68, 80], [58, 55]]),
      [[46, 72], [50, 80], [54, 72]],
    ] },
    { name: "Sepeda", mode: "langkah", anim: "drive", paths: () => [
      circle(30, 62, 12), circle(70, 62, 12),
      close([[30, 62], [44, 40], [58, 62]]),
      line(44, 40, 40, 34), line(37, 34, 43, 34),
      line(58, 62, 66, 40), line(61, 40, 72, 40),
      circle(44, 62, 3),
    ] },
    { name: "Balon Udara", mode: "cermin", anim: "float", paths: () => [
      circle(50, 42, 20),
      close([[44, 68], [56, 68], [56, 76], [44, 76]]),
      line(43, 58, 45, 68), line(57, 58, 55, 68),
    ] },
    { name: "Kapal", mode: "titik", anim: "rock", paths: () => [
      close([[20, 60], [80, 60], [72, 75], [28, 75]]),
      line(50, 60, 50, 25),
      close([[50, 25], [72, 32], [50, 45]]),
      wave(15, 82, 85, 82, 1.5, 3),
    ] },
    { name: "Kereta", mode: "kilat", anim: "drive", paths: () => [
      close([[18, 40], [82, 40], [82, 70], [18, 70]]),
      close([[26, 48], [36, 48], [36, 58], [26, 58]]),
      close([[44, 48], [54, 48], [54, 58], [44, 58]]),
      circle(30, 74, 5), circle(50, 74, 5), circle(70, 74, 5),
      close([[24, 40], [24, 30], [32, 30], [32, 40]]),
      line(12, 82, 88, 82),
    ] },
    { name: "Truk", mode: "langkah", anim: "drive", paths: () => [
      close([[20, 45], [40, 45], [40, 65], [20, 65]]),
      close([[40, 50], [75, 50], [75, 65], [40, 65]]),
      circle(28, 68, 5), circle(60, 68, 5), circle(70, 68, 5),
      line(14, 76, 86, 76),
      circle(30, 55, 3),
    ] },
    { name: "Helikopter", mode: "kilat", anim: "fly", paths: () => [
      ellipse(50, 55, 18, 10),
      line(68, 55, 85, 50), line(85, 50, 85, 42),
      line(30, 40, 70, 40), line(50, 45, 50, 40),
      line(34, 66, 62, 66), line(40, 63, 40, 66), line(56, 63, 56, 66),
    ] },
    { name: "Robot Raksasa", boss: true, mode: "boss", anim: "hop", paths: () => [
      close([[35, 25], [65, 25], [65, 50], [35, 50]]),
      circle(45, 35, 3), circle(55, 35, 3),
      line(42, 44, 58, 44),
      line(50, 25, 50, 15), circle(50, 13, 2),
      close([[30, 50], [70, 50], [70, 78], [30, 78]]),
      [[30, 55], [18, 55], [18, 68]],
      [[70, 55], [82, 55], [82, 68]],
      line(40, 78, 40, 88), line(60, 78, 60, 88),
    ] },
  ];

  /* ================= PULAU 4 · LANGIT AJAIB ================= */
  const L4 = [
    { name: "Pelangi", mode: "tiru", anim: "twinkle", paths: () => [
      arc(50, 78, 32, ...UP), arc(50, 78, 24, ...UP), arc(50, 78, 16, ...UP),
      line(14, 78, 22, 78), line(78, 78, 86, 78),
    ] },
    { name: "Lentera", mode: "cermin", anim: "float", paths: () => [
      line(45, 14, 55, 14), line(50, 14, 50, 20),
      close([[42, 20], [58, 20], [56, 26], [44, 26]]),
      close([[40, 26], [60, 26], [64, 45], [60, 62], [40, 62], [36, 45]]),
      circle(50, 45, 8),
      close([[46, 62], [54, 62], [52, 66], [48, 66]]),
    ] },
    { name: "Unicorn", mode: "langkah", anim: "hop", paths: () => [
      ellipse(40, 58, 17, 9),
      line(30, 66, 28, 80), line(38, 67, 38, 81), line(48, 66, 50, 80),
      line(54, 52, 58, 36),
      circle(61, 30, 9),
      line(63, 22, 66, 10),
      circle(59, 29, 1.5),
      [[52, 40], [55, 34], [52, 28]],
      [[23, 58], [15, 62], [20, 68], [13, 72]],
    ] },
    { name: "Medali", mode: "titik", anim: "spin", paths: () => [
      circle(50, 50, 20), circle(50, 50, 14),
      star(50, 50, 10, 4.5),
      line(44, 69, 38, 86), line(56, 69, 62, 86),
      close([[38, 86], [32, 72], [44, 78]]),
      close([[62, 86], [68, 72], [56, 78]]),
    ] },
    { name: "Komet", mode: "kilat", anim: "fly", paths: () => [
      circle(62, 38, 12),
      line(53, 46, 18, 70), line(60, 49, 30, 78), line(67, 50, 46, 80),
      star(78, 22, 6, 2.6),
      circle(58, 35, 1.5),
    ] },
    { name: "Mahkota", mode: "cermin", anim: "twinkle", paths: () => [
      close([[25, 70], [25, 45], [35, 55], [50, 35], [65, 55], [75, 45], [75, 70]]),
      line(25, 63, 75, 63),
      circle(35, 57, 2.5), circle(50, 56, 2.5), circle(65, 57, 2.5),
    ] },
    { name: "Kastel Awan", mode: "langkah", anim: "float", paths: () => [
      line(25, 70, 75, 70),
      arc(35, 70, 10, ...UP), arc(50, 70, 12, ...UP), arc(65, 70, 10, ...UP),
      close([[40, 70], [40, 48], [60, 48], [60, 70]]),
      [[40, 48], [40, 44], [44, 44], [44, 48], [48, 48], [48, 44], [52, 44], [52, 48], [56, 48], [56, 44], [60, 44], [60, 48]],
      line(50, 44, 50, 32), close([[50, 32], [58, 35], [50, 38]]),
      [[45, 70], [45, 64]], arc(50, 64, 5, ...UP), [[55, 64], [55, 70]],
    ] },
    { name: "Pegasus", mode: "kilat", anim: "flap", paths: () => [
      ellipse(42, 60, 17, 9),
      circle(63, 38, 9),
      close([[61, 30], [58, 22], [65, 27]]),
      circle(60, 36, 1.5),
      [[44, 52], [58, 34], [52, 52], [66, 40], [58, 56]],
      line(32, 68, 30, 82), line(40, 69, 40, 83), line(50, 68, 52, 82), line(56, 64, 60, 78),
      [[25, 60], [17, 64], [22, 70], [15, 74]],
      [[56, 34], [59, 28], [54, 26]],
    ] },
    { name: "Phoenix", boss: true, mode: "boss", anim: "flap", paths: () => [
      circle(50, 32, 8),
      close([[56, 30], [66, 33], [56, 36]]),
      circle(48, 30, 1.5),
      ellipse(50, 55, 10, 14),
      [[40, 48], [24, 30], [34, 52], [16, 48], [32, 60]],
      [[60, 48], [76, 30], [66, 52], [84, 48], [68, 60]],
      [[46, 70], [42, 84], [48, 80], [44, 90]],
      [[54, 70], [58, 84], [52, 80], [56, 90]],
    ] },
  ];

  /* ================= PULAU 5 · DASAR LAUT ================= */
  const shellRibs = () => [-0.75, -0.35, 0, 0.35, 0.75].map((d) => {
    const a = 1.5 * Math.PI + d;
    return line(50, 77, 50 + Math.cos(a) * 27, 60 + Math.sin(a) * 27);
  });
  const L5 = [
    { name: "Bintang Laut", mode: "tiru", anim: "spin", paths: () => [star(50, 52, 36, 15), circle(50, 52, 4)] },
    { name: "Ubur-ubur", mode: "cermin", anim: "float", paths: () => [
      arc(50, 46, 22, ...UP), line(28, 46, 72, 46),
      vwave(36, 46, 82, 3, 1.5), vwave(64, 46, 82, -3, 1.5),
      vwave(45, 46, 76, 2.5, 1.5), vwave(55, 46, 76, -2.5, 1.5),
    ] },
    { name: "Kuda Laut", mode: "langkah", anim: "rock", paths: () => [
      [[58, 18], [66, 22], [78, 26], [78, 31], [66, 31], [63, 40], [66, 52], [63, 64], [54, 74], [44, 77], [38, 71], [43, 65], [50, 68]],
      [[58, 18], [50, 24], [47, 38], [51, 52], [48, 64], [50, 68]],
      circle(63, 25, 1.5),
      [[48, 40], [40, 44], [48, 50]],
    ] },
    { name: "Kerang", mode: "cermin", anim: "pop", paths: () => [
      arc(50, 60, 30, ...UP),
      [[80, 60], [56, 80], [44, 80], [20, 60]],
      ...shellRibs(),
    ] },
    { name: "Penyu", mode: "titik", anim: "crawl", paths: () => [
      ellipse(50, 54, 20, 15),
      circle(50, 32, 6),
      close([[44, 48], [56, 48], [60, 54], [56, 60], [44, 60], [40, 54]]),
      close([[33, 44], [20, 37], [29, 50]]), close([[67, 44], [80, 37], [71, 50]]),
      close([[35, 64], [24, 72], [39, 68]]), close([[65, 64], [76, 72], [61, 68]]),
      [[47, 69], [50, 75], [53, 69]],
    ] },
    { name: "Kapal Selam", mode: "kilat", anim: "drive", paths: () => [
      ellipse(48, 58, 28, 12),
      close([[40, 46], [40, 36], [54, 36], [54, 46]]),
      [[47, 36], [47, 26], [55, 26]],
      circle(36, 58, 3), circle(48, 58, 3), circle(60, 58, 3),
      close([[76, 58], [85, 49], [85, 67]]),
    ] },
    { name: "Paus", mode: "langkah", anim: "swim", paths: () => [
      ellipse(44, 58, 28, 16),
      close([[72, 58], [86, 45], [83, 58], [86, 71]]),
      circle(28, 54, 2),
      line(18, 62, 30, 64),
      [[38, 42], [38, 32]], [[38, 33], [32, 25]], [[38, 33], [44, 25]],
    ] },
    { name: "Mercusuar", mode: "kilat", anim: "twinkle", paths: () => [
      close([[42, 82], [45, 34], [55, 34], [58, 82]]),
      close([[43, 34], [43, 24], [57, 24], [57, 34]]),
      close([[41, 24], [50, 14], [59, 24]]),
      line(44, 50, 56, 50), line(43, 66, 57, 66), line(30, 82, 70, 82),
      line(60, 27, 74, 23), line(60, 31, 74, 35), line(40, 27, 26, 23), line(40, 31, 26, 35),
    ] },
    { name: "Raja Gurita", boss: true, mode: "boss", anim: "sway", paths: () => [
      ellipse(50, 37, 18, 16),
      circle(44, 37, 2.5), circle(56, 37, 2.5),
      close([[40, 23], [42, 13], [46, 19], [50, 11], [54, 19], [58, 13], [60, 23]]),
      vwave(34, 50, 86, 3, 1.5), vwave(42, 52, 86, -3, 1.5), vwave(50, 53, 88, 3, 1.5),
      vwave(58, 52, 86, -3, 1.5), vwave(66, 50, 86, 3, 1.5),
    ] },
  ];

  /* ================= pulau ================= */
  const ISLANDS = [
    { id: 1, name: "Kota Bentuk", theme: "t1", icon: "palette", ghostTarget: 760,
      intro: "Kota ini terbuat dari bentuk-bentuk. Ayo hidupkan!" },
    { id: 2, name: "Hewan Sahabat", theme: "t2", icon: "heart", ghostTarget: 800,
      intro: "Hewan-hewan tertidur. Gambar mereka supaya bangun!" },
    { id: 3, name: "Rongsokan", theme: "t3", icon: "gear", ghostTarget: 840,
      intro: "Mesin-mesin rusak. Gambar ulang supaya melaju!" },
    { id: 4, name: "Langit Ajaib", theme: "t4", icon: "moon", ghostTarget: 870,
      intro: "Langit malam penuh keajaiban. Gambar yang bercahaya!" },
    { id: 5, name: "Dasar Laut", theme: "t5", icon: "wave", ghostTarget: 890,
      intro: "Laut dalam penuh rahasia. Gambar penghuninya!" },
  ];
  const LISTS = [L1, L2, L3, L4, L5];

  /* urutan nama level di save v2/v3 (untuk migrasi id → id baru) */
  const OLD_ORDER = [
    "Bintang", "Hati", "Rumah", "Matahari", "Jendela", "Jembatan", "Menara", "Pesawat Kertas", "Kastel",
    "Ikan", "Kepiting", "Kucing", "Burung", "Siput", "Kupu-kupu", "Landak", "Penguin", "Naga",
    "Mobil", "Roket", "Kapal", "Sepeda", "Kereta", "Balon Udara", "Truk", "Helikopter", "Robot Raksasa",
    "Pelangi", "Unicorn", "Kastel Awan", "Lentera", "Komet", "Medali", "Mahkota", "Pegasus", "Phoenix",
  ];

  const MODE_TOL = { tiru: 1, titik: 1, langkah: 1.1, kilat: 1.2, cermin: 1, boss: 1 };
  const TOL_BASE = [6.5, 6, 5.5, 5.2, 5];

  /* Tantangan Nalar di posisi 4 dan 8 (data teka-teki di KA.puzzles; dimuat setelah levels.js) */
  const PER_ISLAND = 11;
  const NALAR = [
    [{ puzzleId: "bangun", name: "Bangun Rahasia", anim: "pop" }, { puzzleId: "lipat", name: "Lipat Cermin", anim: "sway" }],
    [{ puzzleId: "loncat", name: "Hitung Loncat", anim: "hop" }, { puzzleId: "pola", name: "Pola Berulang", anim: "twinkle" }],
    [{ puzzleId: "koordinat", name: "Peta Koordinat", anim: "drive" }, { puzzleId: "geser", name: "Geser dan Putar", anim: "rock" }],
    [{ puzzleId: "pecahan", name: "Pecahan Warna", anim: "spin" }, { puzzleId: "luas", name: "Luas Kotak", anim: "pop" }],
    [{ puzzleId: "putar", name: "Simetri Putar", anim: "spin" }, { puzzleId: "keliling", name: "Keliling Pagar", anim: "pop" }],
  ];
  const NALAR_POS = [4, 8];

  const ALL = [];
  ISLANDS.forEach((isl, iIsl) => {
    const base = { island: isl.id, islandName: isl.name, theme: isl.theme };
    let p = 0;
    const push = (o) => { p++; ALL.push(Object.assign({ id: iIsl * PER_ISLAND + p, pos: p }, base, o)); };
    LISTS[iIsl].forEach((lv, i) => {
      while (NALAR_POS.includes(p + 1)) {
        const nz = NALAR[iIsl][NALAR_POS.indexOf(p + 1)];
        push({ name: nz.name, mode: "nalar", puzzleId: nz.puzzleId, anim: nz.anim, boss: false, nalar: true });
      }
      /* toleransi tetap dihitung dari urutan level gambar (tidak berubah oleh sisipan Nalar) */
      const d = i + 1;
      push({
        name: lv.name,
        mode: lv.mode,
        anim: lv.anim,
        boss: !!lv.boss,
        tol: +(Math.max(4.5, TOL_BASE[iIsl] - (d - 1) * 0.1) * MODE_TOL[lv.mode]).toFixed(2),
        paths: lv.paths,
      });
    });
  });
  const isDrawing = (l) => l.mode !== "nalar";

  /* ---- geometri turunan ---- */
  function polyLen(pl) {
    let d = 0;
    for (let i = 1; i < pl.length; i++) d += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
    return d;
  }

  /* titik template rapat (≤1,5 satuan), tiap titik tahu bagiannya */
  function samplePaths(paths) {
    const pts = [];
    const parts = [];
    paths.forEach((pl, pi) => {
      const from = pts.length;
      let len = 0;
      for (let i = 0; i < pl.length - 1; i++) {
        const [x1, y1] = pl[i], [x2, y2] = pl[i + 1];
        const d = Math.hypot(x2 - x1, y2 - y1);
        if (d === 0) continue;
        const n = Math.max(1, Math.ceil(d / 1.5));
        for (let k = 0; k < n; k++) {
          pts.push({ x: x1 + ((x2 - x1) * k) / n, y: y1 + ((y2 - y1) * k) / n, w: d / n, part: pi,
            tx: (x2 - x1) / d, ty: (y2 - y1) / d });
        }
        len += d;
      }
      const last = pl[pl.length - 1];
      const isClosed = Math.hypot(last[0] - pl[0][0], last[1] - pl[0][1]) < 0.01;
      if (!isClosed && pts.length > from) {
        const prev = pts[pts.length - 1];
        pts.push({ x: last[0], y: last[1], w: 0.0001, part: pi, tx: prev.tx, ty: prev.ty });
      }
      parts.push({ from, to: pts.length, len });
    });
    return { pts, parts };
  }

  /* potong polyline ke separuh kiri (x ≤ 50), bisa menghasilkan beberapa ruas */
  function clipLeft(pl) {
    const runs = [];
    let cur = [];
    for (let i = 0; i < pl.length; i++) {
      const [x, y] = pl[i];
      if (i > 0) {
        const [px, py] = pl[i - 1];
        const inPrev = px <= 50, inNow = x <= 50;
        if (inPrev !== inNow && x !== px) {
          const t = (50 - px) / (x - px);
          const cross = [50, py + (y - py) * t];
          if (inPrev) { cur.push(cross); runs.push(cur); cur = []; }
          else cur = [cross];
        }
      }
      if (x <= 50) cur.push([x, y]);
    }
    if (cur.length) runs.push(cur);
    return runs.filter((r) => r.length >= 2 && polyLen(r) > 0.05);
  }

  /* titik-titik untuk mode Titik: tiap ±8 satuan sepanjang bagian */
  function makeDots(paths) {
    const dots = [];
    paths.forEach((pl, pi) => {
      const len = polyLen(pl);
      const n = Math.max(3, Math.round(len / 8));
      const isClosed = Math.hypot(pl[pl.length - 1][0] - pl[0][0], pl[pl.length - 1][1] - pl[0][1]) < 0.01;
      const count = isClosed ? n : n + 1;
      for (let k = 0; k < count; k++) {
        const target = (len * k) / n;
        let acc = 0;
        for (let i = 1; i < pl.length; i++) {
          const d = Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
          if (acc + d >= target - 1e-9 || i === pl.length - 1) {
            const t = d ? Math.min(1, (target - acc) / d) : 0;
            dots.push({ x: pl[i - 1][0] + (pl[i][0] - pl[i - 1][0]) * t, y: pl[i - 1][1] + (pl[i][1] - pl[i - 1][1]) * t, part: pi, first: k === 0 });
            break;
          }
          acc += d;
        }
      }
    });
    return dots;
  }

  /* simetris kiri–kanan: setiap titik yang dicerminkan punya pasangan ≤1 satuan */
  function isSymmetric(level) {
    const T = level._pts;
    return T.every((p) => T.some((q) => Math.abs(q.x - (100 - p.x)) < 1 && Math.abs(q.y - p.y) < 1 &&
      Math.hypot(q.x - (100 - p.x), q.y - p.y) <= 1));
  }

  function build(level) {
    const paths = level.paths();
    const { pts, parts } = samplePaths(paths);
    level._polylines = paths;
    level._pts = pts;
    level._parts = parts;
    level._totalLen = parts.reduce((s, p) => s + p.len, 0);
    level._startPt = paths[0][0];
    level._half = paths.flatMap(clipLeft);
    level._dots = makeDots(paths);
    level._grid = null; // diisi scoring.prepare
  }
  ALL.filter(isDrawing).forEach(build);

  const TOTAL_STARS = ALL.length * 3;

  return {
    list: ALL,
    islands: ISLANDS,
    totalStars: TOTAL_STARS,
    OLD_ORDER,
    get(id) { return ALL.find((l) => l.id === id) || null; },
    byName(name) { return ALL.find((l) => l.name === name) || null; },
    island(id) { return ISLANDS.find((i) => i.id === id) || null; },
    islandLevels(islandId) { return ALL.filter((l) => l.island === islandId); },
    isIslandOpen(islandId) {
      if (islandId === 1) return true;
      const boss = ALL.find((l) => l.island === islandId - 1 && l.boss);
      const prevBoss = boss && KA.storage.level(boss.id);
      return !!(prevBoss && prevBoss.bossWon);
    },
    /* level selain Nalar (punya geometri gambar & skor gambar) */
    drawingLevels() { return ALL.filter(isDrawing); },
    nalarLevels() { return ALL.filter((l) => !isDrawing(l)); },
    PER_ISLAND,
    MODE_TOL,
    /* salinan level dengan mode lain (Tantangan Harian); geometri dibagi, toleransi disesuaikan */
    withMode(lv, mode) {
      const c = Object.create(lv);
      c.mode = mode;
      c.tol = +((lv.tol / (MODE_TOL[lv.mode] || 1)) * (MODE_TOL[mode] || 1)).toFixed(2);
      c._grid = null;
      return c;
    },
    isUnlocked(id) {
      if (id === 1) return true;
      const lv = ALL.find((l) => l.id === id);
      if (!lv) return false;
      if (lv.pos === 1) return this.isIslandOpen(lv.island);
      const prev = KA.storage.level(id - 1);
      return !!(prev && prev.stars >= 1);
    },
    build, isSymmetric, clipLeft, polyLen,
  };
})();

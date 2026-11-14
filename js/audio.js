/* Kanvas Ajaib: audio sintetis WebAudio (tanpa berkas).
   Musik dijadwalkan pada jam AudioContext (lookahead) supaya tidak tersendat. */
window.KA = window.KA || {};

KA.audio = (function () {
  const LOOKAHEAD = 0.1;   /* detik ke depan yang dijadwalkan */
  const TICK_MS = 25;      /* selang pemeriksaan penjadwal */

  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let timer = null;
  let cur = null;          /* lagu aktif: {id, def, step, next, gain, muted} */

  /* ---------- setelan (dibaca saat runtime, toleran) ---------- */
  function settings() {
    try {
      const s = window.KA && KA.storage;
      return (s && (s.settings || s.data)) || {};
    } catch (e) { return {}; }
  }
  function soundOn() { return settings().soundOn !== false; }
  function musicOn() { return settings().musicOn !== false; }

  /* ---------- konteks & bus ---------- */
  function ac() {
    if (!ctx) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.9;
      let out = master;
      if (ctx.createDynamicsCompressor) {
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp);
        out = comp;
      }
      out.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
      if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("visibilitychange", () => {
          if (!ctx) return;
          if (document.hidden) { if (ctx.state === "running") ctx.suspend(); }
          else if (ctx.state === "suspended") ctx.resume();
        });
      }
    }
    if (ctx.state === "suspended" && !(typeof document !== "undefined" && document.hidden)) {
      try { ctx.resume(); } catch (e) { /* abaikan */ }
    }
    return ctx;
  }

  function unlock() {
    const c = ac();
    if (c && cur && !timer) beginTimer();
    return c;
  }

  function noise() {
    if (!noiseBuf) {
      const n = Math.floor(ctx.sampleRate * 0.5);
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      let s = 12345;
      for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
    }
    return noiseBuf;
  }

  /* ---------- pembangkit nada ---------- */
  /* o: {type, gain, attack, slide, vib, bus, at (waktu absolut)} */
  function voice(freq, dur, o) {
    const c = ctx;
    const t0 = o.at != null ? o.at : c.currentTime + (o.when || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + o.slide), t0 + dur);
    if (o.vib) {
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = o.vibRate || 6;
      lg.gain.value = o.vib;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    }
    const peak = Math.max(0.0002, o.gain == null ? 0.1 : o.gain);
    const atk = Math.min(o.attack || 0.012, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseHit(dur, o) {
    const c = ctx;
    const t0 = o.at != null ? o.at : c.currentTime + (o.when || 0);
    const src = c.createBufferSource();
    src.buffer = noise();
    const f = c.createBiquadFilter();
    f.type = o.filter || "bandpass";
    f.frequency.setValueAtTime(o.freq || 1500, t0);
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t0 + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.05, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* SFX: hanya bila suara menyala & audio tersedia */
  function sfxOk() { return soundOn() && !!ac(); }
  function tone(freq, dur = 0.15, type = "sine", gain = 0.12, when = 0, slide = 0) {
    voice(freq, dur, { type, gain, when, slide });
  }

  const mk = (fn) => function () { if (!sfxOk()) return; try { fn.apply(null, arguments); } catch (e) { /* audio tidak boleh mematahkan game */ } };

  const sfx = {
    click: mk(() => tone(520, 0.07, "triangle", 0.08)),
    strokeGood: mk(() => { tone(740, 0.09, "sine", 0.1); tone(988, 0.12, "sine", 0.09, 0.07); }),
    strokeBad: mk(() => tone(200, 0.18, "sine", 0.07, 0, -70)),
    perfect: mk(() => { tone(1568, 0.12, "triangle", 0.08); tone(2093, 0.18, "sine", 0.06, 0.06); }),
    star: mk((i) => {
      const f = [660, 880, 1175][i | 0] || 1175;
      tone(f, 0.3, "triangle", 0.15);
      tone(f * 2, 0.22, "sine", 0.05, 0.04);
    }),
    coin: mk(() => { tone(988, 0.08, "square", 0.05); tone(1319, 0.16, "square", 0.05, 0.07); }),
    buy: mk(() => { [523, 659, 784].forEach((f, i) => tone(f, i === 2 ? 0.24 : 0.1, "triangle", 0.12, i * 0.09)); }),
    denied: mk(() => { tone(240, 0.12, "triangle", 0.08, 0, -40); tone(200, 0.2, "triangle", 0.07, 0.12, -50); }),
    fanfare: mk(() => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.11));
      tone(1319, 0.55, "sine", 0.11, 0.5);
      tone(659, 0.55, "sine", 0.06, 0.5);
    }),
    badge: mk(() => { tone(784, 0.15, "sine", 0.12); tone(1047, 0.15, "sine", 0.12, 0.12); tone(1319, 0.38, "sine", 0.12, 0.24); }),
    undo: mk(() => tone(360, 0.1, "sine", 0.07, 0, -130)),
    magic: mk(() => {
      /* sihir hidup: kilau pentatonik naik + desir */
      const notes = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637];
      notes.forEach((f, i) => {
        tone(f, 0.35, "sine", 0.06, i * 0.07);
        tone(f * 1.5, 0.2, "triangle", 0.025, i * 0.07 + 0.03);
      });
      voice(420, 0.9, { type: "sine", gain: 0.04, slide: 1200, attack: 0.3, vib: 8, vibRate: 7 });
      noiseHit(0.9, { filter: "bandpass", freq: 3000, sweep: 9000, q: 2, gain: 0.025 });
    }),
    fill: mk(() => {
      voice(300, 0.2, { type: "sine", gain: 0.12, slide: 360 });
      noiseHit(0.14, { filter: "lowpass", freq: 1400, sweep: 400, gain: 0.04, when: 0.02 });
    }),
    stamp: mk(() => {
      voice(900, 0.09, { type: "sine", gain: 0.12, slide: -700 });
      noiseHit(0.03, { filter: "highpass", freq: 3000, gain: 0.04 });
      tone(1320, 0.12, "triangle", 0.04, 0.05);
    }),
    partDone: mk(() => { tone(880, 0.16, "sine", 0.1); tone(1320, 0.3, "sine", 0.09, 0.1); tone(1760, 0.3, "triangle", 0.03, 0.12); }),
    tick: mk(() => { tone(1800, 0.035, "sine", 0.06); tone(900, 0.03, "triangle", 0.03); }),
    ghostWin: mk(() => {
      /* hantu menang: "wuu-uu" jenaka, tidak menakutkan */
      voice(560, 0.6, { type: "sine", gain: 0.07, slide: -200, attack: 0.08, vib: 14, vibRate: 5 });
      voice(420, 0.7, { type: "sine", gain: 0.06, slide: -170, attack: 0.08, vib: 12, vibRate: 5, when: 0.5 });
    }),
  };

  /* ---------- musik ---------- */
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  /* akor ditulis sebagai nada midi; arp = indeks nada akor per langkah (null = jeda) */
  const TRACKS = {
    /* Kota Bentuk: ceria & mantap, C mayor */
    island1: {
      bpm: 108, spb: 2, bar: 8,
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
      arp: [0, 1, 2, 3, 2, 1, 2, 1], arpWave: "triangle", arpGain: 0.05, arpDur: 1.6,
      bass: [0, 4], bassWave: "sine", bassGain: 0.07,
      mel: [79, 0, 0, 0, 76, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0, 77, 0, 0, 0, 72, 0, 0, 0, 74, 0, 79, 0, 0, 0, 0, 0],
      melWave: "sine", melGain: 0.045, melDur: 3,
    },
    /* Hewan Sahabat: melompat-lompat, G pentatonik, petikan pendek */
    island2: {
      bpm: 122, spb: 2, bar: 8,
      chords: [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]],
      arp: [0, null, 2, 1, null, 2, 3, null], arpWave: "sine", arpGain: 0.07, arpDur: 0.6,
      bass: [0, 3, 6], bassWave: "triangle", bassGain: 0.06, bassDur: 0.8,
      mel: [0, 0, 0, 0, 0, 0, 83, 81, 79, 0, 0, 0, 0, 0, 76, 79, 0, 0, 0, 0, 0, 0, 79, 81, 83, 0, 81, 0, 0, 0, 0, 0],
      melWave: "triangle", melGain: 0.04, melDur: 0.9,
    },
    /* Rongsokan: mekanis, D dorian, langkah 1/16 + ketukan logam */
    island3: {
      bpm: 96, spb: 4, bar: 16,
      chords: [[50, 53, 57], [50, 53, 57], [55, 59, 62], [53, 57, 60]],
      arp: [0, null, 1, 2, null, 1, 0, null, 2, null, 1, 3, null, 2, 1, null], arpWave: "square", arpGain: 0.022, arpDur: 0.7, arpOct: 12,
      bass: [0, 3, 6, 10], bassWave: "triangle", bassGain: 0.08, bassDur: 1.2,
      perc: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    },
    /* Langit Ajaib: melamun, akor ketujuh, nada panjang + kilau acak tetap */
    island4: {
      bpm: 72, spb: 2, bar: 8,
      chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
      arp: [0, 1, 2, 3, 4, 3, 2, 1], arpWave: "sine", arpGain: 0.05, arpDur: 3, arpAtk: 0.06,
      bass: [0], bassWave: "sine", bassGain: 0.06, bassDur: 8,
      sparkle: true,
    },
    /* Dasar Laut: arpegio mengalun pelan, D dorian, gelembung kilau */
    island5: {
      bpm: 80, spb: 3, bar: 12,
      chords: [[50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57], [45, 48, 52, 55]],
      arp: [0, 2, 1, 3, 2, 1, 0, 2, 3, 1, 2, null], arpWave: "triangle", arpGain: 0.04, arpDur: 1.6, arpAtk: 0.03, arpOct: 12,
      bass: [0, 6], bassWave: "sine", bassGain: 0.07, bassDur: 3,
      sparkle: true,
    },
    /* Kotak Musik, Lagu Ombak: walsa 3/4 bergulung, F mayor */
    mus_ombak: {
      bpm: 88, spb: 2, bar: 6,
      chords: [[53, 57, 60], [58, 62, 65], [60, 64, 67], [53, 57, 60]],
      arp: [0, 1, 2, 3, 2, 1], arpWave: "sine", arpGain: 0.055, arpDur: 2.2, arpAtk: 0.03,
      bass: [0], bassWave: "triangle", bassGain: 0.06, bassDur: 5,
      mel: [77, 0, 0, 0, 81, 0, 82, 0, 0, 0, 81, 79, 79, 0, 0, 0, 76, 0, 77, 0, 0, 0, 0, 0],
      melWave: "triangle", melGain: 0.04, melDur: 3,
    },
    /* Kotak Musik, Lagu Hutan: seruling E minor pentatonik bergetar */
    mus_hutan: {
      bpm: 100, spb: 2, bar: 8,
      chords: [[52, 55, 59], [50, 54, 57], [48, 52, 55], [50, 54, 57]],
      arp: [0, null, null, 2, null, 1, null, null], arpWave: "triangle", arpGain: 0.05, arpDur: 1,
      bass: [0], bassWave: "sine", bassGain: 0.06, bassDur: 4,
      mel: [76, 0, 79, 0, 81, 0, 0, 0, 83, 0, 81, 79, 76, 0, 0, 0, 74, 0, 76, 0, 79, 0, 0, 0, 76, 0, 74, 0, 71, 0, 0, 0],
      melWave: "sine", melGain: 0.05, melDur: 1.8, melVib: 5,
    },
    /* Kotak Musik, Lagu Bintang: lonceng kotak musik, nada tinggi */
    mus_bintang: {
      bpm: 92, spb: 2, bar: 8,
      chords: [[60, 64, 67], [65, 69, 72], [60, 64, 67], [67, 71, 74]],
      arp: [0, null, 2, null, 1, null, 2, null], arpWave: "sine", arpGain: 0.03, arpDur: 1.5, arpOct: -12,
      mel: [84, 0, 84, 0, 91, 0, 91, 0, 93, 0, 93, 0, 91, 0, 0, 0, 89, 0, 89, 0, 88, 0, 88, 0, 86, 0, 86, 0, 84, 0, 0, 0],
      melWave: "triangle", melGain: 0.045, melDur: 1.6, bell: true,
    },
  };

  function chordTone(ch, i) { return ch[i % ch.length] + 12 * Math.floor(i / ch.length); }

  function scheduleStep(tr, step, t) {
    const d = tr.def, sd = 60 / d.bpm / d.spb;
    const bar = Math.floor(step / d.bar) % d.chords.length, pos = step % d.bar;
    const ch = d.chords[bar], bus = tr.gain;
    const ai = d.arp && d.arp[pos];
    if (ai != null) {
      voice(N(chordTone(ch, ai) + (d.arpOct || 0)), sd * (d.arpDur || 1), { type: d.arpWave, gain: d.arpGain, attack: d.arpAtk || 0.008, bus, at: t });
    }
    if (d.bass && d.bass.indexOf(pos) >= 0) {
      voice(N(ch[0] - 12), sd * (d.bassDur || 2), { type: d.bassWave, gain: d.bassGain, attack: 0.01, bus, at: t });
    }
    if (d.mel) {
      const m = d.mel[step % d.mel.length];
      if (m) {
        voice(N(m), sd * (d.melDur || 1.5), { type: d.melWave, gain: d.melGain, attack: d.melVib ? 0.05 : 0.01, vib: d.melVib, vibRate: 5, bus, at: t });
        if (d.bell) voice(N(m + 19), sd * 0.8, { type: "sine", gain: d.melGain * 0.3, attack: 0.004, bus, at: t });
      }
    }
    if (d.perc && d.perc[pos]) {
      noiseHit(pos % 4 === 0 ? 0.06 : 0.03, { filter: "highpass", freq: pos % 4 === 0 ? 5000 : 7000, gain: pos % 4 === 0 ? 0.03 : 0.015, bus, at: t });
    }
    if (d.sparkle && (step * 7) % 11 === 3) {
      voice(N(chordTone(ch, (step % 3) + 4) + 12), sd * 2.5, { type: "sine", gain: 0.02, attack: 0.02, bus, at: t });
    }
  }

  function tick() {
    if (!ctx || !cur) return;
    const now = ctx.currentTime;
    const on = musicOn();
    if (cur.gain && on === cur.muted) {
      cur.muted = !on;
      cur.gain.gain.cancelScheduledValues(now);
      cur.gain.gain.setTargetAtTime(on ? 1 : 0.0001, now, 0.06);
    }
    if (!on || ctx.state !== "running") { cur.next = Math.max(cur.next, now + 0.05); return; }
    if (cur.next < now - 0.2) cur.next = now + 0.03; /* tab sempat tertahan: jangan menumpuk */
    const sd = 60 / cur.def.bpm / cur.def.spb;
    let guard = 0;
    while (cur.next < now + LOOKAHEAD && guard++ < 32) {
      try { scheduleStep(cur, cur.step, cur.next); } catch (e) { /* abaikan */ }
      cur.step++;
      cur.next += sd;
    }
  }

  function beginTimer() {
    if (!ctx || !cur) return;
    if (!cur.gain) {
      cur.gain = ctx.createGain();
      cur.gain.gain.value = musicOn() ? 1 : 0.0001;
      cur.muted = !musicOn();
      cur.gain.connect(musicBus);
      cur.next = ctx.currentTime + 0.06;
    }
    if (!timer) timer = setInterval(tick, TICK_MS);
    tick();
  }

  function trackId(track) {
    if (typeof track === "number") track = "island" + track;
    return TRACKS[track] ? track : "island1";
  }

  function startMusic(track) {
    const id = trackId(track);
    if (cur && cur.id === id) { if (ctx && !timer) beginTimer(); return; }
    stopMusic();
    cur = { id, def: TRACKS[id], step: 0, next: 0, gain: null, muted: false };
    if (ac()) beginTimer();
  }

  function stopMusic() {
    if (timer) { clearInterval(timer); timer = null; }
    if (cur && cur.gain && ctx) {
      const g = cur.gain, now = ctx.currentTime;
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, 0.08);
        setTimeout(() => { try { g.disconnect(); } catch (e) { /* abaikan */ } }, 600);
      } catch (e) { /* abaikan */ }
    }
    cur = null;
  }

  return {
    sfx, startMusic, stopMusic, unlock,
    /* tambahan */
    TRACKS: Object.keys(TRACKS),
    current: () => (cur ? cur.id : null),
  };
})();

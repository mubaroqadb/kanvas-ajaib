/* Kanvas Ajaib: pustaka ikon SVG inline (tanpa emoji, tanpa dependensi) */
window.KA = window.KA || {};

KA.icons = (function () {
  /* jalur dalam viewBox 24×24, stroke konsisten */
  const P = {
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22v-9h6v9"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
    coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3.5h2.8l2.4 11.5a1.7 1.7 0 0 0 1.7 1.35h7.9a1.7 1.7 0 0 0 1.66-1.3L20.5 7H6"/>',
    award: '<circle cx="12" cy="8" r="5.5"/><path d="M8.4 12.9L7 21.5l5-2.6 5 2.6-1.4-8.6"/>',
    vol: '<path d="M11 5L6.5 9H3v6h3.5L11 19V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    volx: '<path d="M11 5L6.5 9H3v6h3.5L11 19V5z"/><path d="M22 9.5l-5.5 5.5M16.5 9.5l5.5 5.5"/>',
    undo: '<path d="M3.5 4.5v5.5h5.5"/><path d="M4 15a8.7 8.7 0 1 0 1.8-9.2L3.5 10"/>',
    eraser: '<path d="M7.5 21H21"/><path d="M5.5 14.5L14 6a2.1 2.1 0 0 1 3 0l2.6 2.6a2.1 2.1 0 0 1 0 3L11 20H7l-1.5-1.5a2.8 2.8 0 0 1 0-4z"/>',
    check: '<path d="M20 6.5L9.5 17 4.5 12"/>',
    retry: '<path d="M20.5 4.5V10H15"/><path d="M20 15a8.7 8.7 0 1 1-1.8-9.2l2.3 3.7"/>',
    next: '<path d="M4.5 12h15"/><path d="M13 5.5l6.5 6.5-6.5 6.5"/>',
    flag: '<path d="M5 21.5V3.5"/><path d="M5 4.5c2.8-1.6 5.2 1.6 8 0s5.2-1.6 6 0v8.5c-2.8 1.6-5.2-1.6-8 0s-5.2 1.6-6 0z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v4.5l3 2"/>',
    flame: '<path d="M12 2.5C12 2.5 5.8 8.6 5.8 13.9a6.2 6.2 0 0 0 12.4 0c0-2.5-1.3-4.4-2.5-6.1-.8 1.5-1.8 2-1.8 2S12 6.8 12 2.5z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    brush: '<path d="M18.5 2.5l3 3L12.5 14.5l-3-3z"/><path d="M9.5 11.5l-4.3 4.3c-1 1-1.6 2.6-1.7 4.7 2.1-.1 3.7-.7 4.7-1.7l4.3-4.3"/>',
    ruler: '<path d="M16.5 2.5l5 5L8 21l-5-5z"/><path d="M7.5 15.5l1.8 1.8M10.5 12.5l1.8 1.8M13.5 9.5l1.8 1.8M16.5 6.5l1.8 1.8"/>',
    zap: '<path d="M13 2.5L3.5 14H12l-1 7.5L20.5 10H12z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    trophy: '<path d="M8 21.5h8M12 17.5v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
    palette: '<path d="M12 2.5a9.5 9.5 0 0 0 0 19c1.3 0 2-.9 2-1.9 0-1.2-1-1.7-1-2.5 0-1 .8-1.6 2-1.6h2.4a4.4 4.4 0 0 0 4.1-4.5c0-5.4-4.4-8.5-9.5-8.5z"/><circle cx="7.6" cy="10.4" r="1.05"/><circle cx="12" cy="7.4" r="1.05"/><circle cx="16.4" cy="9.4" r="1.05"/>',
    wand: '<path d="M4.5 19.5L15 9"/><path d="M15 4V2M15 18v-2M10 9H8M22 9h-2M18.2 12.2l1.4 1.4M18.2 5.8l1.4-1.4M11.8 5.8l-1.4-1.4"/>',
    back: '<path d="M19.5 12h-15"/><path d="M11 5.5L4.5 12l6.5 6.5"/>',
    pencil: '<path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
    rainbow: '<path d="M3 17.5a9 9 0 0 1 18 0"/><path d="M7 17.5a5 5 0 0 1 10 0"/><path d="M10.5 17.5a1.5 1.5 0 0 1 3 0"/>',
    heart: '<path d="M12 20.5s-8-4.6-8-10.4C4 7 6.2 5 8.8 5c1.8 0 3.2 1.3 3.2 1.3S13.4 5 15.2 5C17.8 5 20 7 20 10.1c0 5.8-8 10.4-8 10.4z"/>',
    mirror: '<rect x="8" y="2.5" width="8" height="14" rx="4"/><path d="M12 16.5V19M8.5 21.5h7"/><path d="M4 5l2 2M4 12h2.6M20 5l-2 2M20 12h-2.6" stroke-dasharray="1.5 1.5"/>',
    ghost: '<path d="M4.5 21V10a7.5 7.5 0 0 1 15 0v11l-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2z"/><circle cx="9.5" cy="10.5" r="1.2"/><circle cx="14.5" cy="10.5" r="1.2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M3 17l5-4.5 4 3.5 3.5-3L21 17"/>',
    lamp: '<path d="M9 2.5h6v3H9z"/><path d="M8 5.5h8v5l-2 2.5h-4l-2-2.5z"/><path d="M10.5 13h3l-1 8.5h-1z"/><path d="M12 7.5v3" stroke-dasharray="1.2 1.4"/>',
    turtle: '<ellipse cx="12" cy="13" rx="7.5" ry="5.5"/><path d="M9.5 8.5V13M14.5 8.5V13M12 8.2V13M7 13h10"/><path d="M4.5 13L2 11M4.5 14.5L2.5 17M19.5 13l2.5-2M19.5 14.5l2 2.5"/><circle cx="12" cy="13" r="1.1"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
    wave: '<path d="M2 9c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.5 5 0"/><path d="M2 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-1.5 5 0"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    /* ---- ikon v3 ---- */
    trash: '<path d="M3.5 6.5h17"/><path d="M8.5 6.5v-2A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5v2"/><path d="M5.5 6.5l1 13.2a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-13.2"/><path d="M10 11v6M14 11v6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 6.3"/>',
    chart: '<path d="M3.5 3.5v17h17"/><path d="M7.5 15.5l4-4.5 3 3 5-6"/>',
    download: '<path d="M12 3.5v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20.5h16"/>',
    upload: '<path d="M12 16V4"/><path d="M7 8.5l5-5 5 5"/><path d="M4 20.5h16"/>',
    bucket: '<path d="M4.6 9.6l6.9-6.9 8.1 8.1-6.9 6.9a2.1 2.1 0 0 1-3 0l-5.1-5.1a2.1 2.1 0 0 1 0-3z"/><path d="M4 11.2h15.2"/><path d="M20.5 15s1.6 2.1 1.6 3.3a1.6 1.6 0 0 1-3.2 0c0-1.2 1.6-3.3 1.6-3.3z"/>',
    sticker: '<path d="M14.5 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7.5z"/><path d="M14.5 21v-3.5a3 3 0 0 1 3-3H21"/><circle cx="9" cy="9.5" r=".8"/><circle cx="15" cy="9.5" r=".8"/><path d="M8.5 13.5c1.4 1.2 3.6 1.4 5.2.6"/>',
    pin: '<path d="M9 3.5h6l-1 6 3.5 3.5v1.5h-11V13L10 9.5z"/><path d="M12 14.5v6.5"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    paper: '<path d="M6 2.5h8.5L19 7v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1-1.5z"/><path d="M14 2.5v5h5"/><path d="M8.5 12.5h7M8.5 16.5h5"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    hat: '<path d="M7 17V7.5A1.5 1.5 0 0 1 8.5 6h7A1.5 1.5 0 0 1 17 7.5V17"/><path d="M3 17.5h18"/><path d="M7 13.5h10"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>',
    settings: '<path d="M4 7h9.5M18.5 7H20M4 17h3.5M12.5 17H20"/><circle cx="16" cy="7" r="2.3"/><circle cx="10" cy="17" r="2.3"/>',
    dots: '<circle cx="4" cy="17" r="1.2"/><circle cx="6.8" cy="10.2" r="1.2"/><circle cx="12" cy="6.5" r="1.2"/><circle cx="17.2" cy="10.2" r="1.2"/><circle cx="20" cy="17" r="1.2"/>',
    steps: '<path d="M3.5 20.5h5v-5h5v-5h5v-5h2"/>',
    bulb: '<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.4v.5h6v-.5c0-1 .3-1.8 1-2.4A6.5 6.5 0 0 0 12 2.5z"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20v-8"/><path d="M12 8v13.5"/><path d="M12 8S10.5 3 8 3.5a2.25 2.25 0 0 0 0 4.5zM12 8s1.5-5 4-4.5a2.25 2.25 0 0 1 0 4.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.8v.1"/>',
  };

  const FILL_OK = new Set(["star", "flame", "zap", "sparkle", "heart", "play"]);

  function svg(name, size = 24, cls = "", filled = false) {
    let body = P[name] || "";
    if (filled && FILL_OK.has(name)) body = `<g fill="currentColor" stroke="none">${body}</g>`;
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /* thumbnail level: digenerate dari polyline template itu sendiri */
  function thumb(lv, size = 40, cls = "") {
    let d = "";
    for (const pl of lv._polylines) {
      d += pl.map(([x, y], i) => (i ? `L${x.toFixed(1)} ${y.toFixed(1)}` : `M${x.toFixed(1)} ${y.toFixed(1)}`)).join(" ") + " ";
    }
    return `<svg class="ic thumb ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d.trim()}"/></svg>`;
  }

  function mini(lv, size = 20) { return thumb(lv, size); }

  /* stiker (dari KA.art.STAMPS) sebagai SVG terisi, untuk tombol alat */
  function stamp(id, size = 24, color = "currentColor", cls = "") {
    const def = window.KA && KA.art && KA.art.STAMPS && KA.art.STAMPS[id];
    if (!def) return svg("sticker", size, cls);
    const hi = def.hi ? `<path d="${def.hi}" fill="#fff" fill-opacity=".6"/>` : "";
    return `<svg class="ic stamp ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${def.d}" fill="${color}"/>${hi}</svg>`;
  }

  /* ---------- Noko: maskot kuas ---------- */
  function shade(hex, amt) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#3A3A4A";
    const n = parseInt(m[1], 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
    const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  const INK = "#3A3A4A";
  const HATS = {
    hat_sailor:
      '<path d="M52 36Q52 14 70 14Q88 14 88 36Z" fill="#FFFFFF" stroke="#2F4B8C" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M50 33Q70 27 90 33L90 40Q70 34 50 40Z" fill="#2F4B8C" stroke="#22386A" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="70" cy="14" r="3.4" fill="#E63946"/>',
    hat_glasses:
      '<g fill="rgba(180,220,255,0.28)" stroke="#2D2D3A" stroke-width="3">' +
      '<circle cx="59" cy="58" r="10.5"/><circle cx="81" cy="58" r="10.5"/></g>' +
      '<path d="M69.5 56.5Q70 54.5 70.5 56.5M48.5 56L43 53.5M91.5 56L97 53.5" fill="none" stroke="#2D2D3A" stroke-width="3" stroke-linecap="round"/>',
    hat_scarf:
      '<path d="M40 82Q70 94 100 82L100 93Q70 105 40 93Z" fill="#E63946" stroke="#A61E2B" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M83 93L92 117L82 119L77 96Z" fill="#E63946" stroke="#A61E2B" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M50 89.5Q70 97 90 89.5M83 104l7-2M84.5 110l7-2" fill="none" stroke="#FFD3D6" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M83 119v4M86.5 118.5v4M90 118v4" stroke="#A61E2B" stroke-width="2" stroke-linecap="round"/>',
    hat_wizard:
      '<path d="M50 34C56 20 66 9 81 3C78 14 83 24 90 34Z" fill="#6C4AB6" stroke="#4A2F86" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M38 36Q70 25 102 36Q70 44 38 36Z" fill="#7B57C7" stroke="#4A2F86" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M69 15q1 5 5 6q-4 1-5 6q-1-5-5-6q4-1 5-6z" fill="#FFD93D"/><circle cx="79" cy="27" r="1.8" fill="#FFD93D"/><circle cx="60" cy="28" r="1.4" fill="#FFD93D"/>',
    hat_crown:
      '<path d="M52 37L50 16L60 26L70 11L80 26L90 16L88 37Z" fill="#FFD23F" stroke="#C99A0A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M53 32h34" stroke="#E8B820" stroke-width="2"/>' +
      '<circle cx="70" cy="30" r="2.8" fill="#E63946"/><circle cx="60" cy="31" r="2.1" fill="#45B7D1"/><circle cx="80" cy="31" r="2.1" fill="#2A9D8F"/>' +
      '<g fill="#FFE98A" stroke="#C99A0A" stroke-width="1.5"><circle cx="50" cy="16" r="2.4"/><circle cx="70" cy="11" r="2.4"/><circle cx="90" cy="16" r="2.4"/></g>',
  };

  function noko(expr = "happy", size = 96, opts = {}) {
    const o = opts || {};
    const col = /^#[0-9a-f]{6}$/i.test(o.color || "") ? o.color : "#FF6B6B";
    const dark = shade(col, 0.32);
    const e = expr === "wow" || expr === "oops" ? expr : "happy";
    const big = e === "wow";
    const erx = big ? 9 : 7.5, ery = big ? 10 : 8.5;
    const pr = big ? 3.4 : 4.2;
    const pdy = e === "oops" ? 2.2 : 0.8;
    let face = "";
    for (const cx of [60, 80]) {
      face += `<ellipse cx="${cx}" cy="58" rx="${erx}" ry="${ery}" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>`;
      face += `<circle cx="${cx + (e === "oops" ? -0.8 : 0.8)}" cy="${58 + pdy}" r="${pr}" fill="${INK}"/>`;
      face += `<circle cx="${cx + 2.2}" cy="${55.4 + pdy * 0.5}" r="1.6" fill="#FFFFFF"/>`;
    }
    if (e !== "oops") face += '<g fill="#FF8FA3" fill-opacity=".55"><ellipse cx="50" cy="69" rx="4.5" ry="3"/><ellipse cx="90" cy="69" rx="4.5" ry="3"/></g>';
    if (e === "happy") {
      face += `<path d="M62 70Q70 80 78 70Z" fill="#5A2633" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        '<path d="M66.5 74.5Q70 72.6 73.5 74.5Q70 77.6 66.5 74.5Z" fill="#FF8FA3"/>';
    } else if (e === "wow") {
      face += `<ellipse cx="70" cy="75" rx="4" ry="5" fill="#5A2633" stroke="${INK}" stroke-width="2"/>` +
        `<path d="M52 44Q59 38.5 66 42.5M74 42.5Q81 38.5 88 44" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    } else {
      face += `<path d="M59 75q2.75-3 5.5 0t5.5 0t5.5 0t5.5 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M51 47L64 43M76 43L89 47" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` +
        '<path d="M97 44q4.5 6.5 0 9q-4.5-2.5 0-9z" fill="#8FD3F0" stroke="#4E9FC4" stroke-width="1.2"/>';
    }
    const hat = o.hat && HATS[o.hat] ? HATS[o.hat] : "";
    return `<svg class="noko noko-${e}" width="${size}" height="${size}" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Noko">` +
      /* gagang kayu */
      '<path d="M57 100C57 110 62 118 62 126A8 8 0 0 0 78 126C78 118 83 110 83 100Z" fill="#C98B52" stroke="#8E5A2E" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M73 106Q74.5 116 73 124" fill="none" stroke="#B07440" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M62 105Q64 113 66 122" fill="none" stroke="#FFFFFF" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>' +
      /* bulu kuas berwarna */
      `<path d="M46 86C40 66 42 44 56 32C62 27 68 25 72 18C76 25 79 28 84 32C98 44 100 66 94 86Z" fill="${col}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="M58 84C57 76 57 70 59 64M82 84C83 77 83 72 82 67" fill="none" stroke="${dark}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>` +
      '<path d="M51 52C50.5 44 53.5 38 58.5 34" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>' +
      /* cincin logam */
      '<path d="M47 83H93Q97 83 96.5 87L93 99Q92.5 103 88 103H52Q47.5 103 47 99L43.5 87Q43 83 47 83Z" fill="#CFD6E0" stroke="#8A94A6" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M45.5 89.5h49M47 95.5h46" stroke="#AEB7C4" stroke-width="2"/>' +
      '<rect x="51" y="86" width="5" height="13" rx="2.5" fill="#FFFFFF" fill-opacity=".65"/>' +
      face + hat + "</svg>";
  }

  return { svg, thumb, mini, stamp, noko, HATS: Object.keys(HATS) };
})();

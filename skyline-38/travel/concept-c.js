(() => {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const QA = qs.has('qa');
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const MOTION_KEY = 'lm.ui.motion';
  const PAUSE_KEY = 'lm.travel-c.paused';
  const modeFromQuery = (value) => {
    if (value === 'reduce' || value === 'off') return 'reduce';
    if (value === 'calm' || value === 'info') return 'calm';
    if (value === 'on' || value === 'full') return 'full';
    return null;
  };
  const modeFromStorage = (value) => {
    if (value === 'off') return 'reduce';
    // Older Info click stored as "reduce" or "1"
    if (value === 'reduce' || value === 'calm' || value === 'info' || value === '1') return 'calm';
    if (value === 'full' || value === 'on' || value === '0') return 'full';
    return null;
  };
  const LEGACY_MOTION_KEY = 'lm.travel-c.static';
  const readStoredMotion = () => {
    try {
      let mode = modeFromStorage(localStorage.getItem(MOTION_KEY));
      if (mode) return mode;
      const legacy = localStorage.getItem(LEGACY_MOTION_KEY);
      mode = modeFromStorage(legacy);
      if (!mode) return null;
      writeStoredMotion(mode);
      try {
        localStorage.removeItem(LEGACY_MOTION_KEY);
      } catch {}
      return mode;
    } catch {
      return null;
    }
  };
  const writeStoredMotion = (mode) => {
    try {
      localStorage.setItem(MOTION_KEY, mode === 'reduce' ? 'off' : mode);
    } catch {}
  };
  const readStoredPause = () => {
    try {
      return sessionStorage.getItem(PAUSE_KEY) === '1';
    } catch {
      return false;
    }
  };
  const writeStoredPause = (on) => {
    try {
      sessionStorage.setItem(PAUSE_KEY, on ? '1' : '0');
    } catch {}
  };
  const qsMotion = qs.get('motion');
  const MOTION = modeFromQuery(qsMotion) || readStoredMotion() || (mq.matches ? 'reduce' : 'full');
  const STATIC = MOTION === 'calm' || MOTION === 'reduce';
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const applyMotion = (mode) => {
    root.dataset.motion = mode;
    root.removeAttribute('data-layout');
    root.classList.toggle('is-static', mode === 'reduce' || mode === 'calm');
    root.classList.toggle('is-calm', mode === 'calm');
    root.classList.toggle('is-motion', mode === 'full');
  };
  applyMotion(MOTION);
  if (MOTION === 'full' && readStoredPause()) root.classList.add('paused');
  if (QA) root.classList.add('qa');
  const motionReduced = () => {
    const mode = root.dataset.motion;
    if (mode === 'reduce') return true;
    if (mode === 'full') return false;
    return mq.matches;
  };
  const avatarLive = () => !motionReduced() && !root.classList.contains('paused');
  const CALM_IDLE_MS = 5000;
  const CALM_SNAP_MS = 4800;
  const CALM_IDLE_LAST = 3800;
  let calmIdleStart = 0;
  let calmIdleUntil = 0;
  let calmIdleT = 0;
  let calmSnapT = 0;
  let calmShotUntil = 0;
  let calmShotT = 0;
  let blinkOffT = [];
  const avatarIdleOk = () => {
    if (!avatarLive()) return false;
    if (root.dataset.motion === 'full') return true;
    const now = performance.now();
    return now < calmIdleUntil || now < calmShotUntil;
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ramp = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  const smooth = (a, b, x) => {
    const t = ramp(a, b, x);
    return t * t * (3 - 2 * t);
  };
  const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const outCubic = (t) => 1 - (1 - t) ** 3;
  const outBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
  const N = (v) => Math.round(v * 10) / 10;
  const html = (s) => {
    const t = document.createElement('template');
    t.innerHTML = s.trim();
    return t.content.firstElementChild;
  };
  const rng = (seed) => {
    let s = seed;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------- colour ---------- */
  const INK = '#2b1b14';
  const C = {
    paper: '#fff6e4',
    cream: '#fff4e2',
    sand: '#f3e2c0',
    tomato: '#e2492f',
    marigold: '#f6b43c',
    lagoon: '#1f7f7a',
    leaf: '#62a64e',
    blush: '#f2a08a',
    plum: '#4a3570',
    wood: '#b9773f',
    steel: '#8d8178',
    glass: '#bfe6ee',
  };
  const SK = {
    skin: 'var(--lu-skin)',
    skinD: 'var(--lu-skin-d)',
    blush: 'var(--lu-blush)',
    hair: 'var(--lu-hair)',
    sideburn: 'var(--lu-sideburn)',
    fade: 'var(--lu-fade)',
    beard: 'var(--lu-beard)',
    amber: 'var(--lu-amber)',
    tort: 'var(--lu-tort)',
    lip: 'var(--lu-lip)',
  };
  const STATIC_EXPR = {
    hero: 'wow',
    plan: 'wave',
    aa: 'read',
    sandals: 'beach',
    bsc: 'grad',
    fluky: 'wave',
    move: 'sleep',
    booking: 'wink',
  };
  const hexRGB = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hexRGB(a);
    const B = hexRGB(b);
    return `#${A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')}`;
  };
  const dk = (c, t = 0.2) => mix(c, INK, t);

  /* ---------- svg helpers ---------- */
  const ol = (w, c = INK) => ` stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const rect = (x, y, w, h, f, a = '') => `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" fill="${f}"${a}/>`;
  const rr = (x, y, w, h, r, f, a = '') => `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" rx="${N(r)}" fill="${f}"${a}/>`;
  const circ = (x, y, r, f, a = '') => `<circle cx="${N(x)}" cy="${N(y)}" r="${N(r)}" fill="${f}"${a}/>`;
  const ell = (x, y, rx, ry, f, a = '') => `<ellipse cx="${N(x)}" cy="${N(y)}" rx="${N(rx)}" ry="${N(ry)}" fill="${f}"${a}/>`;
  const path = (d, f, a = '') => `<path d="${d}" fill="${f}"${a}/>`;
  const pts = (p) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${N(x)} ${N(y)}`).join('');
  const poly = (p, f, a = '') => path(`${pts(p)}Z`, f, a);
  const line = (d, s, w, a = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${a}/>`;
  const at = (x, y, s, inner, a = '') => `<g transform="translate(${N(x)} ${N(y)})${s === 1 ? '' : ` scale(${N(s * 1000) / 1000})`}"${a}>${inner}</g>`;
  const anim = (cls, inner, style = '') => `<g class="${cls}"${style ? ` style="${style}"` : ''}>${inner}</g>`;
  const text = (x, y, s, size, f, a = '') => `<text x="${N(x)}" y="${N(y)}" font-size="${size}" fill="${f}"${a}>${s}</text>`;
  const curve = (p, close = false) => {
    const n = p.length;
    if (close) {
      const m = (i) => [(p[i % n][0] + p[(i + 1) % n][0]) / 2, (p[i % n][1] + p[(i + 1) % n][1]) / 2];
      let d = `M${N(m(n - 1)[0])} ${N(m(n - 1)[1])}`;
      for (let i = 0; i < n; i++) d += `Q${N(p[i][0])} ${N(p[i][1])} ${N(m(i)[0])} ${N(m(i)[1])}`;
      return `${d}Z`;
    }
    let d = `M${N(p[0][0])} ${N(p[0][1])}`;
    for (let k = 1; k < n - 1; k++) d += `Q${N(p[k][0])} ${N(p[k][1])} ${N((p[k][0] + p[k + 1][0]) / 2)} ${N((p[k][1] + p[k + 1][1]) / 2)}`;
    return `${d}L${N(p[n - 1][0])} ${N(p[n - 1][1])}`;
  };
  const svgBox = (x0, y0, w, h, inner) => `<svg class="art" width="${N(w)}" height="${N(h)}" viewBox="${N(x0)} ${N(y0)} ${N(w)} ${N(h)}">${inner}</svg>`;

  // flat colour bands from y0 down to y1, thinning toward y1 (pow < 1) or thickening (pow > 1)
  function bands(x0, x1, y0, y1, cols, pow = 0.72) {
    let s = '';
    let prev = y0;
    for (let i = 0; i < cols.length; i++) {
      const e = i === cols.length - 1 ? y1 : y0 + (y1 - y0) * ((i + 1) / cols.length) ** pow;
      s += rect(x0, prev, x1 - x0, e - prev + 0.8, cols[i]);
      prev = e;
    }
    return s;
  }
  const sunDisc = (x, y, r, c, rings) => rings.map((rc, i) => circ(x, y, r * (1 + (rings.length - i) * 0.3), rc)).join('') + circ(x, y, r, c);

  /* ---------- clouds: an ink rim, a shaded base and a light top ---------- */
  const PUFFS = [
    [
      [16, -11, 12],
      [33, -21, 17],
      [54, -27, 21],
      [74, -18, 15],
      [88, -10, 10],
    ],
    [
      [14, -9, 10],
      [30, -18, 15],
      [48, -24, 17],
      [66, -21, 15],
      [83, -12, 11],
    ],
    [
      [18, -12, 13],
      [37, -27, 19],
      [58, -35, 21],
      [76, -22, 15],
      [89, -11, 9],
    ],
  ];
  function cloud(x, y, w, o = {}) {
    const P = PUFFS[(o.t ?? 0) % 3];
    const k = w / 100;
    const X = (v) => x + v * k;
    const Y = (v) => y + v * k;
    const ow = o.ow ?? 0;
    const light = o.light || '#fffaf0';
    const shade = o.shade || '#f1dfc0';
    let s = '';
    if (ow) {
      for (const [cx, cy, r] of P) s += circ(X(cx), Y(cy), r * k + ow, INK);
      s += rr(X(4) - ow, Y(-12) - ow, 92 * k + 2 * ow, 12 * k + 2 * ow, 6 * k + ow, INK);
    }
    for (const [cx, cy, r] of P) s += circ(X(cx), Y(cy), r * k, shade);
    s += rr(X(4), Y(-12), 92 * k, 12 * k, 6 * k, shade);
    for (const [cx, cy, r] of P) s += circ(X(cx - r * 0.06), Y(cy - r * 0.15), r * k * 0.84, light);
    return s;
  }

  /* ---------- the plane, side view, nose right, in a 640 × 260 box ---------- */
  const PLANE = { w: 640, h: 260, cx: 330, cy: 132, foot: 241 };
  // Eleven cabin windows, tail to nose. Luis sits in the second window from the front.
  const LUIS_WIN = 9;
  const LUIS_WIN_X = 178 + LUIS_WIN * 30;
  const LUIS_WIN_Y = 106;
  function wheel(cx, cy, r) {
    return `<g class="wh" style="transform-origin:${cx}px ${cy}px">${circ(cx, cy, r, INK)}${circ(cx, cy, r * 0.5, '#a39282')}${line(`M${cx - r * 0.5} ${cy}H${cx + r * 0.5}M${cx} ${cy - r * 0.5}V${cy + r * 0.5}`, INK, 2.2)}</g>`;
  }
  // the porthole figure at 12% in its own 200 × 240 viewBox, head centred in the window; the shade is the window's own
  const TINY_S = 0.12;
  function tinyLuis(cx, cy, id) {
    const x = cx - 100 * TINY_S;
    const y = cy + 0.8 - 118 * TINY_S;
    return `<g class="tl"><g class="tl-bob" style="transform-origin:${cx}px ${cy + 6}px"><svg viewBox="0 0 200 240" x="${N(x)}" y="${N(y)}" width="${N(200 * TINY_S)}" height="${N(240 * TINY_S)}" overflow="visible"><defs>${luisPortholeHandClip(id)}</defs>${luisFigure(id)}</svg></g><g class="shade">${rect(cx - 9, cy - 20, 18, 12, '#efdcbc')}${line(`M${cx - 8} ${cy - 14}H${cx + 8}M${cx - 8} ${cy - 11.2}H${cx + 8}`, '#dcc49c', 0.55)}</g></g>`;
  }
  function planeSVG(id) {
    const body = 'M100 88L466 82C538 80 597 100 611 127C620 147 604 167 568 171L204 175C152 175 108 157 72 125L60 114C58 98 76 89 100 88Z';
    let s = `<defs><clipPath id="pb${id}"><path d="${body}"/></clipPath></defs>`;
    // contrail puffs from the engine
    s += '<g class="puffs">';
    for (let i = 0; i < 5; i++) s += circ(282, 190, 13, '#fffaf0', ` class="puff" style="animation-delay:${-i * 0.3}s"`);
    s += '</g>';
    // gear sits behind the body so it folds up into it
    s += `<g class="gM" style="transform-origin:258px 162px">${rect(253, 158, 10, 62, '#7d6a5c', ol(3))}${rect(240, 214, 36, 6, '#7d6a5c', ol(2.5))}${wheel(244, 226, 15)}${wheel(272, 226, 15)}</g>`;
    s += `<g class="gN" style="transform-origin:548px 160px">${rect(544, 158, 8, 60, '#7d6a5c', ol(3))}${line('M548 176L560 168', INK, 3)}${wheel(548, 228, 13)}</g>`;
    s += path('M94 92L52 20Q48 10 60 10L98 10Q108 10 114 20L186 90Z', C.lagoon, ol(5));
    s += path('M70 40L102 40L118 56L78 56Z', '#2f9a93');
    s += circ(90, 40, 14, C.cream, ol(3.5));
    s += circ(90, 40, 6.5, C.marigold, ol(2));
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      s += line(`M${N(90 + Math.cos(a) * 8.5)} ${N(40 + Math.sin(a) * 8.5)}L${N(90 + Math.cos(a) * 11)} ${N(40 + Math.sin(a) * 11)}`, C.marigold, 2.2);
    }
    s += path('M94 122L32 134Q22 139 32 144L130 140Z', C.sand, ol(4.5));
    s += path(body, C.cream);
    s += `<g clip-path="url(#pb${id})">${rect(40, 147, 600, 40, '#efdbb9')}${rect(40, 127, 600, 11, C.tomato)}${rect(40, 122, 600, 3.5, C.marigold)}${rect(40, 84, 600, 6, '#fffdf6')}</g>`;
    s += path(body, 'none', ol(5));
    for (let i = 0; i < 11; i++) {
      const x = 178 + i * 30;
      s += circ(x, LUIS_WIN_Y, 9.5, C.glass, ol(3));
      if (i === LUIS_WIN) s += `<g clip-path="url(#pw${id})">${tinyLuis(x, LUIS_WIN_Y, `t${id}`)}</g><clipPath id="pw${id}"><circle cx="${x}" cy="${LUIS_WIN_Y}" r="8"/></clipPath><circle class="win-luis" cx="${x}" cy="${LUIS_WIN_Y}" r="8" fill="none"/>`;
      else s += line(`M${x - 5} ${103}Q${x - 3} ${99} ${x + 1} ${99}`, '#fff', 2);
    }
    s += '<g class="lit">';
    for (let i = 0; i < 11; i++) if (i !== LUIS_WIN) s += circ(178 + i * 30, LUIS_WIN_Y, 7.5, '#ffd36b');
    s += '</g>';
    s += rr(508, 92, 24, 56, 9, 'none', ol(2.5));
    s += path('M554 100L588 101Q600 105 605 118L560 118Z', INK);
    s += path('M562 104L574 104L569 114L558 114Z', '#5f97a6');
    s += path('M578 104L588 105L590 114L574 114Z', '#5f97a6');
    s += path('M388 144L262 149L202 212Q196 220 206 220L246 220Z', C.sand, ol(5));
    s += path('M246 220L206 220L214 210L256 208Z', '#e0c391');
    s += path('M318 158L348 158L342 170L324 170Z', '#d9c39c', ol(3));
    s += rr(274, 166, 106, 46, 23, C.tomato, ol(5));
    s += path('M352 168L360 168Q380 168 380 189Q380 210 360 210L352 210Z', C.cream, ol(3));
    s += ell(381, 189, 9, 20, INK);
    s += `<g class="sp">${circ(382, 189, 7, C.cream)}${line('M382 182.5Q388 186 382 189Q376 192 382 195.5', C.tomato, 2.6)}</g>`;
    s += `<g class="bcn">${circ(330, 80, 12, '#ff7a5c', ' opacity=".4"')}${circ(330, 80, 5, '#ff3b2b', ol(2))}</g>`;
    s += `<g class="stb">${circ(206, 215, 10, '#fff', ' opacity=".7"')}</g>`;
    return s;
  }
  // top view for the globe, nose right, in a 120 × 100 box
  function planeTop() {
    return (
      path('M64 48L40 8Q38 3 44 3L52 3L82 44Z', C.sand, ol(3.5)) +
      path('M64 52L40 92Q38 97 44 97L52 97L82 56Z', C.sand, ol(3.5)) +
      path('M22 49L10 30L17 30L32 46Z', C.lagoon, ol(3)) +
      path('M22 51L10 70L17 70L32 54Z', C.lagoon, ol(3)) +
      rr(6, 41, 108, 18, 9, C.cream, ol(3.5)) +
      rect(14, 47.5, 92, 5, C.tomato) +
      path('M98 44Q108 46 110 50Q108 54 98 56Z', INK) +
      rr(52, 22, 16, 8, 4, C.tomato, ol(2.5)) +
      rr(52, 70, 16, 8, 4, C.tomato, ol(2.5))
    );
  }

  /* ---------- Luis at the window, in a 200 × 240 box. No other person is drawn anywhere. ---------- */
  // the inside edge of the rim stroke, so no part of an arm can show past the ring
  function luisPortholeHandClip(id) {
    return `<clipPath id="lhand${id}"><rect x="25.5" y="25.5" width="149" height="189" rx="68.5"/></clipPath>`;
  }
  // the lm-avatar v0.1.1 wave arm, moved 8 left and 3 down; the hand at 93% about the wrist, so the swing clears both the rim and the head
  const LU_ARM = path('M147.3 174L149 106A6 6 0 0 1 161 106L162.8 174Z', SK.skin, ol(2.5)) + path('M137 214C139 198 141 182 143.5 167Q155 163 166.5 168C167.5 184 169 201 171 216L149 226Z', C.marigold, `${ol(3)} class="lu-sleeve"`);
  const LU_PALM = 'M150.6 91.6C149.9 86.6 169.7 83.8 170.4 88.8L171.8 98.7C172.8 105.6 168.2 108.8 163.2 109.5C158.3 110.2 153 108.4 152 101.5Z';
  const luHand = (inner) => `<g class="lu-hand"><g transform="matrix(.93 0 0 .93 4.41 10.56)">${inner}</g></g>`;
  // a finger from its base to a round tip, r wide either side
  const pill = (x0, y0, x1, y1, r) => {
    const l = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / l) * r;
    const ny = ((x1 - x0) / l) * r;
    return `M${N(x0 + nx)} ${N(y0 + ny)}L${N(x1 + nx)} ${N(y1 + ny)}A${r} ${r} 0 0 0 ${N(x1 - nx)} ${N(y1 - ny)}L${N(x0 - nx)} ${N(y0 - ny)}Z`;
  };
  function luisReactWaveArt() {
    const fingers = ['M156.3 90.4L151.9 74A2.7 2.7 0 0 0 146.7 75.4L151.1 91.8Z', 'M160.7 89L157.3 69.3A2.7 2.7 0 0 0 151.9 70.3L155.4 90Z', 'M165.4 88.6L163.8 69.7A2.7 2.7 0 0 0 158.4 70.2L160 89.1Z', 'M170.3 90.2L170.5 75.2A2.7 2.7 0 0 0 165.1 75.1L164.9 90.1Z'];
    const thumb = 'M157.9 99.1L151.7 91.2A3.1 3.1 0 0 0 146.9 95L153 102.9Z';
    return `<g class="lu-wave">${LU_ARM}${luHand(fingers.map((d) => path(d, SK.skin, ol(2.5))).join('') + path(thumb, SK.skin, ol(2.5)) + path(LU_PALM, SK.skin, ol(2.5)))}</g>`;
  }
  function luisReactLaughArt() {
    return `<g class="lu-laugh">${path('M76 138Q100 166 124 138Q100 152 76 138Z', SK.lip, ol(1.8, '#1a100b'))}${path('M80 139.5Q100 149.5 120 139.5', '#fff7ea')}</g>`;
  }
  function luisReactPeaceArt() {
    // index and middle up in a V, ring and little finger folded over the palm, the thumb across them
    const v = path(pill(153.8, 90.5, 147, 67, 3), SK.skin, ol(2.5)) + path(pill(158.8, 89.5, 164.4, 66, 3), SK.skin, ol(2.5));
    const fold = rr(161.4, 84.4, 5.8, 8.6, 2.9, SK.skin, ol(2.5)) + rr(166.4, 85.6, 5.6, 8, 2.8, SK.skin, ol(2.5));
    const thumb = line('M153.8 98.8L164.8 93.6', INK, 8.8) + line('M153.8 98.8L164.8 93.6', SK.skin, 6.2);
    return `<g class="lu-peace">${LU_ARM}${luHand(v + path(LU_PALM, SK.skin, ol(2.5)) + fold + thumb)}</g>`;
  }
  // the seat and the figure in it, in the porthole's 200 × 240 units; the plane-window Luis is this, shrunk
  function luisFigure(id) {
    let s = '';
    s += `<g class="lu-seat">${path('M42 240L45 112Q48 72 100 68Q152 72 155 112L158 240Z', C.lagoon, ol(3))}${rr(76, 88, 48, 26, 13, C.cream, ol(2.5))}${line('M58 150H142', '#16625e', 3)}</g>`;
    s += '<g class="lu-bob">';
    s += `<g class="lu-torso">${path('M24 240Q26 204 62 194Q82 188 100 189Q118 188 138 194Q174 204 176 240Z', C.marigold, ol(3))}${path('M84 190Q100 214 116 190Z', C.cream, ol(2.5))}${path('M81 189L96 224L68 205Z', '#d8901f', ol(2.5))}${path('M119 189L104 224L132 205Z', '#d8901f', ol(2.5))}${circ(100, 232, 2.6, INK)}</g>`;
    s += `<g clip-path="url(#lhand${id})">${luisReactWaveArt()}${luisReactPeaceArt()}</g>`;
    s += rect(88, 150, 24, 42, SK.skinD);
    s += '<g class="lu-head">';
    s += `<g class="lu-bun">${circ(100, 60, 14.5, SK.hair, ol(3))}${line('M91 56Q100 49 109 56', '#4b3428', 2.2)}${line('M93 63Q100 59 107 63', '#4b3428', 2)}${rr(89, 70, 22, 7, 3.5, C.tomato, ol(2))}</g>`;
    s += `<g class="lu-ears">${ell(63, 122, 8.5, 12, SK.skin, ol(3))}${ell(137, 122, 8.5, 12, SK.skin, ol(3))}${line('M62 116Q57 122 63 128', SK.skinD, 2.4)}${line('M138 116Q143 122 137 128', SK.skinD, 2.4)}</g>`;
    s += ell(100, 118, 37, 45, SK.skin, ol(3));
    s += path('M63.5 116Q62 99 68 90L76 93Q70 103 70.5 116Z', SK.sideburn);
    s += path('M136.5 116Q138 99 132 90L124 93Q130 103 129.5 116Z', SK.sideburn);
    s += `<g class="lu-hair">${path('M64 104Q62 69 100 67Q138 69 136 104Q130 87 116 83Q100 79 84 83Q70 87 64 104Z', SK.hair, ol(2.5))}${path('M70.6 81.5L80.5 84Q75.5 90 73.5 97Q72 102 70 107H65.3V105Q63.9 92.8 70.6 81.5Z', SK.sideburn)}${path('M129.4 81.5L119.5 84Q124.5 90 126.5 97Q128 102 130 107H134.7V105Q136.1 92.8 129.4 81.5Z', SK.sideburn)}${path('M66.3 90.6L75.6 92.6Q74.2 94.6 73.5 97Q72 102 70 107H65.3V105Q64.5 97.9 66.3 90.6Z', SK.fade)}${path('M133.7 90.6L124.4 92.6Q125.8 94.6 126.5 97Q128 102 130 107H134.7V105Q135.5 97.9 133.7 90.6Z', SK.fade)}${line('M82 77Q95 71 110 74', '#4b3428', 2)}</g>`;
    s += `<g class="lu-beard">${path('M63 106C61 142 72 171 100 178C128 171 139 142 137 106L131 106C131 124 126 134 118 137C110 131 90 131 82 137C74 134 69 124 69 106Z', SK.beard, ol(3))}${line('M86 162Q100 170 114 162', '#3f2a20', 2)}</g>`;
    s += '<g class="lu-face">';
    s += ell(75, 128, 7, 4, SK.blush, ' opacity=".55"') + ell(125, 128, 7, 4, SK.blush, ' opacity=".55"');
    s += `<g class="lu-nose">${path('M100 111Q95 125 93 130Q100 135 107 130Q105 125 100 111Z', SK.skinD)}${circ(97, 128, 1.6, '#e1ad84')}</g>`;
    s += path('M83 138Q91 129 100 132Q109 129 117 138Q108 142 100 139Q92 142 83 138Z', SK.hair);
    s += path('M83.1 149.9A3.5 3.5 0 0 1 89.9 148.3C90.9 152.1 90.7 157.8 88.8 158.3C86.9 158.8 84.1 153.8 83.1 149.9Z', SK.skin);
    s += path('M110.1 148.3A3.5 3.5 0 0 1 116.9 149.9C115.9 153.8 113.1 158.8 111.2 158.3C109.3 157.8 109.1 152.1 110.1 148.3Z', SK.skin);
    s += `<g class="ms">${path('M88 144.5Q100 158 112 144.5Q100 149.5 88 144.5Z', SK.lip, ol(1.8, '#1a100b'))}${path('M90.5 145.6Q100 149.6 109.5 145.6L108.6 148Q100 151.4 91.4 148Z', '#fff7ea')}</g>`;
    s += `<g class="mo">${ell(100, 148, 6, 7.4, SK.lip, ol(1.8, '#1a100b'))}${ell(100, 151.5, 3.6, 2.4, '#d9705e')}</g>`;
    s += `<g class="mw">${path('M85 143Q100 162 115 143Q100 149 85 143Z', SK.lip, ol(1.8, '#1a100b'))}${path('M88 144.2Q100 149.2 112 144.2L110.6 147.6Q100 152 89.4 147.6Z', '#fff7ea')}${ell(100, 155, 4.5, 2.2, '#d9705e')}</g>`;
    s += `<g class="mx">${ell(100, 153, 9.4, 11.4, SK.lip, ol(1.8, '#1a100b'))}${ell(100, 153.6, 6.3, 8.2, '#2a120c')}${ell(100, 159.4, 4.4, 2.5, '#d9705e')}</g>`;
    s += `<g class="eo l">${ell(85, 113, 3.4, 4.3, SK.hair)}${circ(86.3, 111.4, 1.2, '#fff')}</g>`;
    s += `<g class="eo r">${ell(115, 113, 3.4, 4.3, SK.hair)}${circ(116.3, 111.4, 1.2, '#fff')}</g>`;
    s += `<g class="ec l">${line('M80 113Q85 117.5 90 113', SK.hair, 2.6)}</g>`;
    s += `<g class="ec r">${line('M110 113Q115 117.5 120 113', SK.hair, 2.6)}</g>`;
    // wink: the cheek pushes up into the bottom of the left lens under a heavy squint, and the smile climbs on that side
    s += `<g class="wk">${path('M74 126Q85 108.5 96 126Z', SK.skin)}${ell(77.5, 122.5, 6, 3.2, SK.blush, ' opacity=".6"')}${line('M76 123Q85 110.5 94 123', SK.skinD, 2.2)}${line('M78.2 113.6Q85 108.4 91.8 113', SK.hair, 3.8)}${line('M78.2 113.6L75.8 116', SK.hair, 2.6)}${path('M85.5 141Q95 155.5 113 146.5Q99 149 85.5 141Z', SK.lip, ol(1.8, '#1a100b'))}${path('M88.6 143.4Q98.5 149.4 110.4 147.2L108.6 149.3Q98 152 90 145.8Z', '#fff7ea')}${line('M84.2 138.4Q82.4 141.2 84.4 144', '#3f2a20', 1.8)}</g>`;
    s += circ(85, 113, 12.5, 'rgba(255,255,255,.14)') + circ(115, 113, 12.5, 'rgba(255,255,255,.14)');
    s += `<g class="lu-shades">${circ(85, 113, 12.5, '#3a2a22', ' opacity=".82"')}${circ(115, 113, 12.5, '#3a2a22', ' opacity=".82"')}${line('M79.5 116.5L86.5 109.5', '#fff', 1.8, ' opacity=".9"')}${line('M109.5 116.5L116.5 109.5', '#fff', 1.8, ' opacity=".9"')}</g>`;
    s += circ(85, 113, 12.5, 'none', ol(4.6, SK.tort)) + circ(115, 113, 12.5, 'none', ol(4.6, SK.tort));
    s += circ(85, 113, 12.5, 'none', ` stroke="#c9843c" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1.4 3.6 3.2 5.4 0.8 4.2 2.2 6"`);
    s += circ(115, 113, 12.5, 'none', ` stroke="#c9843c" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2.6 4.8 1 3.8 3.6 6.2 1.4 4" stroke-dashoffset="7"`);
    s += line('M97.5 112Q100 108.5 102.5 112', SK.tort, 3.6) + line('M72.5 110L64 106', SK.tort, 3) + line('M127.5 110L136 106', SK.tort, 3);
    s += `<g class="lu-glint">${line('M78 106Q81 103 85 103', '#fff', 1.8, ' opacity=".75"')}${line('M108 106Q111 103 115 103', '#fff', 1.8, ' opacity=".75"')}</g>`;
    s += `<g class="brw"><g class="bl">${line('M75 96Q85 90.5 94 95', SK.hair, 4.8)}</g><g class="br">${line('M106 95Q115 90.5 125 96', SK.hair, 4.8)}</g></g>`;
    s += `<g class="lu-cap">${path('M72 78L128 78L100 58Z', '#1a1a1a', ol(2.5))}${rect(72, 78, 56, 8, '#1a1a1a', ol(2))}${circ(100, 90, 3, C.marigold)}</g>`;
    s += `<g class="lu-book">${rr(118, 168, 34, 26, 4, '#fff', ol(2.5))}${line('M124 174H146M124 180H146M124 186H140', INK, 1.8)}</g>`;
    s += luisReactLaughArt();
    s += '</g></g></g>';
    return s;
  }
  function luisSVG(id) {
    let s = `<defs><clipPath id="lw${id}"><rect x="24" y="24" width="152" height="192" rx="70"/></clipPath>${luisPortholeHandClip(id)}</defs>`;
    s += rr(15, 18, 184, 224, 88, 'rgba(43,27,20,.3)');
    s += rr(8, 8, 184, 224, 88, C.cream, ol(5));
    s += rr(17, 17, 166, 206, 79, '#eadbbf', ol(3));
    s += `<g clip-path="url(#lw${id})">`;
    s += rect(0, 0, 200, 240, '#f5e1bb');
    s += rect(0, 150, 200, 4, '#e8cfa3');
    s += luisFigure(id);
    s += `<g class="zz" font-family="Bricolage Display, sans-serif" font-weight="800" fill="${INK}">${text(146, 92, 'z', 18, INK)}${text(156, 74, 'z', 22, INK)}${text(166, 54, 'z', 26, INK)}</g>`;
    s += path('M38 74L74 38L88 38L42 84Z', '#fff', ' opacity=".2"') + path('M42 104L106 40L116 40L46 114Z', '#fff', ' opacity=".12"');
    s += `<g class="shade">${rect(18, -210, 164, 232, '#efdcbc')}${line('M18 -20H182M18 -2H182', '#dcc49c', 3)}${rr(88, 12, 24, 9, 4.5, '#d4bf99', ol(2.2))}</g>`;
    s += '</g>';
    s += rr(24, 24, 152, 192, 70, 'none', ol(3));
    return s;
  }

  /* ---------- props ---------- */
  function suitcase(x, y, w, h, c, o = {}) {
    const lw = o.lw ?? 4;
    let s = rr(x + w * 0.33, y - h * 0.17, w * 0.34, h * 0.22, h * 0.07, 'none', ol(lw));
    s += rr(x, y, w, h, Math.min(w, h) * 0.16, c, ol(lw));
    s += rect(x + w * 0.2, y + lw / 2, w * 0.09, h - lw, dk(c, 0.18)) + rect(x + w * 0.71, y + lw / 2, w * 0.09, h - lw, dk(c, 0.18));
    if (o.tag) s += circ(x + w * 0.5, y + h * 0.45, Math.min(w, h) * 0.15, o.tag, ol(2.5));
    return s;
  }
  function frond(x, y, ang, len, c = '#4f9a48') {
    const a = (ang * Math.PI) / 180;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len + len * 0.32;
    const mx = x + Math.cos(a) * len * 0.55;
    const my = y + Math.sin(a) * len * 0.55 - len * 0.06;
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    const wd = len * 0.17;
    let s = path(`M${N(x)} ${N(y)}Q${N(mx + nx * wd * 2)} ${N(my + ny * wd * 2)} ${N(ex)} ${N(ey)}Q${N(mx - nx * wd)} ${N(my - ny * wd)} ${N(x)} ${N(y)}Z`, c, ol(3.5));
    s += line(`M${N(x)} ${N(y)}Q${N(mx)} ${N(my)} ${N(ex)} ${N(ey)}`, dk(c, 0.3), 2.4);
    return s;
  }
  function palm(x, y, h, lean, o = {}) {
    const tx = x + lean;
    const ty = y - h;
    const qx = x + lean * 0.05;
    const qy = y - h * 0.55;
    const tw = o.tw ?? 16;
    const d = `M${N(x)} ${N(y)}Q${N(qx)} ${N(qy)} ${N(tx)} ${N(ty)}`;
    let s = line(d, INK, tw + 8) + line(d, '#b07a4c', tw);
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * qx + t * t * tx;
      const py = (1 - t) ** 2 * y + 2 * (1 - t) * t * qy + t * t * ty;
      s += line(`M${N(px - tw * 0.45)} ${N(py + 2)}Q${N(px)} ${N(py - 3)} ${N(px + tw * 0.45)} ${N(py + 2)}`, '#7f5333', 2.4);
    }
    let cr = '';
    const L = h * 0.44;
    for (const [a, f] of [
      [-200, 0.82],
      [-160, 1],
      [-125, 1.06],
      [-60, 1.06],
      [-22, 1],
      [18, 0.82],
      [-92, 0.7],
    ])
      cr += frond(tx, ty, a, L * f, o.leaf);
    cr += circ(tx - 7, ty + 9, 8, '#7a4b2a', ol(3)) + circ(tx + 8, ty + 10, 8, '#7a4b2a', ol(3)) + circ(tx + 1, ty + 17, 8, '#8a5a34', ol(3));
    s += `<g class="sway" style="transform-origin:${N(tx)}px ${N(ty)}px;--t:${o.t ?? 4.6}s;--a:-2.5deg;--b:3deg">${cr}</g>`;
    return s;
  }
  function pine(x, y, h, c) {
    return poly(
      [
        [x, y - h],
        [x + h * 0.2, y - h * 0.62],
        [x + h * 0.11, y - h * 0.62],
        [x + h * 0.3, y - h * 0.2],
        [x + h * 0.04, y - h * 0.2],
        [x + h * 0.04, y],
        [x - h * 0.04, y],
        [x - h * 0.04, y - h * 0.2],
        [x - h * 0.3, y - h * 0.2],
        [x - h * 0.11, y - h * 0.62],
        [x - h * 0.2, y - h * 0.62],
      ],
      c,
    );
  }
  function flower(cx, cy, r, c) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      s += circ(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.56, c, ol(2));
    }
    return s + circ(cx, cy, r * 0.34, C.marigold, ol(1.6));
  }
  function bush(x, y, s, fc, seed) {
    const r = rng(seed);
    const P = [
      [-34, -20, 26],
      [0, -32, 32],
      [34, -18, 24],
    ];
    let g = P.map(([cx, cy, q]) => circ(cx, cy, q + 3.5, INK)).join('') + rr(-63.5, -24, 127, 28, 12, INK);
    g += P.map(([cx, cy, q]) => circ(cx, cy, q, '#4f9446')).join('') + rr(-60, -20.5, 120, 21, 9, '#4f9446');
    g += P.map(([cx, cy, q]) => circ(cx - q * 0.12, cy - q * 0.22, q * 0.66, '#5fa955')).join('');
    for (const [fx, fy] of [
      [-30, -30],
      [6, -48],
      [34, -24],
      [-8, -16],
    ])
      g += flower(fx + r() * 6, fy + r() * 4, 8.5, fc);
    return at(x, y, s, g);
  }
  function raysLayer(cx, cy, R, n, c, o, name) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + Math.PI / n;
      d += `M0 0L${N(Math.cos(a0) * R)} ${N(Math.sin(a0) * R)}L${N(Math.cos(a1) * R)} ${N(Math.sin(a1) * R)}Z`;
    }
    return LY(Infinity, cx - R, cy - R, cx + R, cy + R, '', { html: `<div class="rays"><svg class="art" width="${N(2 * R)}" height="${N(2 * R)}" viewBox="${N(-R)} ${N(-R)} ${N(2 * R)} ${N(2 * R)}"><path d="${d}" fill="${c}" opacity="${o}"/></svg></div>`, name });
  }
  function foam(x0, x1, y, c = '#fffaf0', t = 3.4) {
    let d = `M${x0} ${y}`;
    for (let x = x0; x < x1; x += 40) d += `Q${x + 10} ${y - 9} ${x + 20} ${y}Q${x + 30} ${y + 7} ${x + 40} ${y}`;
    return anim('wave', line(d, c, 5), `--t:${t}s;--dx:10px`);
  }
  function gear(cx, cy, r, c, teeth, cls) {
    let d = '';
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rr2 = i % 2 ? r : r * 1.22;
      const a2 = a + Math.PI / (teeth * 2);
      d += `${i ? 'L' : 'M'}${N(cx + Math.cos(a) * rr2)} ${N(cy + Math.sin(a) * rr2)}L${N(cx + Math.cos(a2) * rr2)} ${N(cy + Math.sin(a2) * rr2)}`;
    }
    return `<g class="${cls}">${path(`${d}Z`, c, ol(3.5))}${circ(cx, cy, r * 0.35, C.cream, ol(3))}</g>`;
  }

  /* ---------- islands, each in a 1000 × 560 box with the waterline at y 440 ---------- */
  function isleAA(id) {
    let s = '';
    for (const x of [150, 310, 480, 650, 820]) s += rect(x - 10, 360, 20, 112, '#8b6d55', ol(4));
    s += rr(88, 336, 824, 44, 12, '#eadfc8', ol(5));
    let hz = '';
    for (let x = 60; x < 940; x += 36) hz += poly([[x, 382], [x + 18, 382], [x + 34, 362], [x + 16, 362]], C.tomato);
    s += `<clipPath id="hz${id}"><rect x="91" y="362" width="818" height="15" rx="6"/></clipPath><g clip-path="url(#hz${id})">${rect(91, 362, 818, 18, C.cream)}${hz}</g>`;
    s += line('M91 362H909', INK, 3);
    // a parked jet under inspection
    s += at(104, 236, 0.66, `${path('M20 52L210 48C246 47 274 58 282 72C286 82 276 90 258 92L60 94C40 94 26 84 16 70L12 62C11 56 14 52 20 52Z', C.cream, ol(5))}${path('M24 54L6 14Q5 8 12 8L30 8Q36 8 39 12L76 52Z', C.lagoon, ol(5))}${rect(30, 70, 250, 7, C.tomato)}${path('M20 52L210 48C246 47 274 58 282 72C286 82 276 90 258 92L60 94C40 94 26 84 16 70L12 62C11 56 14 52 20 52Z', 'none', ol(5))}${[90, 115, 140, 165, 190].map((x) => circ(x, 62, 6, C.glass, ol(2.5))).join('')}${path('M180 76L118 78L90 104Q87 108 93 108L114 108Z', C.sand, ol(4.5))}${circ(80, 136 - 30, 9, INK)}${circ(236, 108, 9, INK)}${rect(77, 92, 6, 12, '#7d6a5c')}${rect(233, 92, 6, 12, '#7d6a5c')}`);
    s += anim('mag', `${line('M216 300L240 330', '#7a4b2a', 11)}${line('M216 300L240 330', INK, 3, ' opacity=".0"')}${circ(198, 276, 30, 'rgba(191,230,238,.55)', ol(5))}${path('M182 262Q192 252 206 254', 'none', ' stroke="#fff" stroke-width="4" stroke-linecap="round"')}`);
    // belt, bags and the x-ray
    s += rr(330, 292, 390, 22, 11, '#5b4a42', ol(4));
    for (let x = 346; x < 712; x += 30) s += `<g class="spin" style="--t:1.4s">${circ(x, 303, 6, '#a39282')}${line(`M${x - 4} 303H${x + 4}`, INK, 2)}</g>`;
    s += rect(350, 314, 10, 24, '#5b4a42', ol(3)) + rect(690, 314, 10, 24, '#5b4a42', ol(3));
    let bags = '';
    const BAGS = [
      [C.tomato, 62, 46],
      [C.lagoon, 50, 58],
      [C.marigold, 70, 40],
      ['#7b5ea7', 54, 50],
    ];
    for (let r = 0; r < 2; r++)
      BAGS.forEach(([c, w, h], i) => {
        const x = -440 + r * 440 + 330 + i * 110 + (110 - w) / 2 - 110;
        bags += suitcase(x, 292 - h, w, h, c, { lw: 3.5, tag: i % 2 ? C.cream : null });
      });
    s += `<clipPath id="bc${id}"><rect x="330" y="150" width="390" height="146"/></clipPath><g clip-path="url(#bc${id})"><g class="belt" style="--dx:440px;--t:7s">${bags}</g></g>`;
    s += rr(452, 172, 176, 138, 18, C.cream, ol(5));
    s += rr(472, 222, 136, 84, 10, '#3a2a24');
    for (let i = 0; i < 6; i++) s += rect(474 + i * 22.4, 222, 20, 74, i % 2 ? '#c23b26' : C.tomato, ` class="strip" style="animation-delay:${-i * 0.21}s"`);
    s += rr(452, 172, 176, 40, 14, '#efe4cd', ol(4)) + text(540, 199, 'X-RAY', 20, INK, ' text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="500" letter-spacing="3"');
    s += rect(532, 132, 10, 42, '#7d6a5c', ol(3)) + rr(494, 82, 88, 58, 10, INK) + rr(502, 90, 72, 42, 6, '#173f4f');
    s += `<clipPath id="mon${id}"><rect x="502" y="90" width="72" height="42" rx="6"/></clipPath><g clip-path="url(#mon${id})">${rr(518, 100, 40, 26, 5, 'none', ol(3, '#ff9a3d'))}${rr(531, 95, 14, 6, 3, 'none', ol(2.5, '#ff9a3d'))}${rect(524, 106, 12, 8, '#3e8bff')}${circ(547, 115, 5, '#43e39b')}<g class="scan">${rect(502, 88, 72, 3, '#e6fcff', ' opacity=".8"')}</g></g>`;
    // clipboard with the four checks
    s += at(640, 214, 1, `${rr(0, 8, 64, 86, 8, C.wood, ol(4))}${rr(7, 18, 50, 70, 4, C.cream, ol(2.5))}${rr(20, 2, 24, 14, 4, C.steel, ol(3))}${[0, 1, 2, 3].map((i) => rr(13, 26 + i * 15, 9, 9, 2, '#fff', ol(2)) + line(`M15 ${31 + i * 15}L18 ${34 + i * 15}L24 ${25 + i * 15}`, C.tomato, 2.6, ` pathLength="1" class="tick" style="--d:${i * 0.5}s"`) + rect(28, 29 + i * 15, 22 - (i % 2) * 6, 3, '#cdb894')).join('')}`);
    // passport and the stamp
    s += at(742, 186, 1, `${path('M8 32L80 24L152 32L152 150L80 142L8 150Z', '#3f2f6e', ol(5))}${path('M16 36L78 30L78 138L16 144Z', C.cream, ol(3.5))}${path('M82 30L144 36L144 144L82 138Z', '#fffaf0', ol(3.5))}${[0, 1, 2, 3].map((i) => line(`M24 ${92 + i * 11}L70 ${88 + i * 11}`, '#cdb894', 3)).join('')}${rr(26, 44, 26, 32, 4, 'none', ol(2.5, '#cdb894'))}${circ(113, 70, 20, 'none', ol(3.5, C.tomato))}${text(113, 75, 'VISA', 12, C.tomato, ' text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="500"')}${anim('inkmark', `${circ(113, 116, 14, 'none', ol(3, '#7b5ea7'))}${line('M104 116H122', '#7b5ea7', 3)}`)}${anim('stamper', `${rr(98, 76, 30, 10, 3, '#7a4b2a', ol(3))}${rect(108, 52, 10, 26, '#7a4b2a', ol(3))}${circ(113, 46, 11, C.tomato, ol(3.5))}`)}`);
    return s;
  }

  function isleSandals(id) {
    let s = '';
    s += path('M54 444C110 398 196 378 300 370C420 360 560 354 690 362C810 370 890 404 946 444Z', '#f6d79b', ol(5));
    s += path('M100 434C210 414 330 406 480 404C640 404 790 412 900 432L938 444L62 444Z', '#e9c27c');
    s += palm(236, 390, 250, -46, { tw: 17 });
    s += palm(352, 378, 184, 34, { tw: 14, t: 5.3 });
    s += ell(300, 392, 60, 8, '#e0b56c');
    // sandcastle with a Sass flag
    s += at(452, 372, 1, `${rect(0, -44, 92, 44, '#ebc683', ol(4))}${rect(-12, -70, 34, 70, '#ebc683', ol(4))}${rect(70, -70, 34, 70, '#ebc683', ol(4))}${path('M-12 -70v-8h8v8h9v-8h8v8h9v-8h8v8', 'none', ol(4))}${path('M70 -70v-8h8v8h9v-8h8v8h9v-8h8v8', 'none', ol(4))}${rr(36, -26, 20, 26, 10, '#c9a062', ol(3))}${line('M5 -78V-118', INK, 3)}${anim('flag', `${path('M5 -118L52 -108L5 -98Z', C.tomato, ol(3))}${text(10, -104, 'Sass', 10, C.cream, ' font-family="Bricolage, sans-serif" font-weight="700"')}`)}`);
    // umbrella and loungers
    s += at(640, 372, 1, `${line('M0 0V-150', INK, 7)}${line('M0 0V-150', '#e9dcc4', 3)}${path('M-96 -118Q-80 -176 0 -184Q80 -176 96 -118Q72 -132 48 -118Q24 -132 0 -118Q-24 -132 -48 -118Q-72 -132 -96 -118Z', C.cream, ol(5))}${path('M-96 -118Q-80 -176 0 -184L-24 -126Q-36 -132 -48 -118Q-72 -132 -96 -118Z', C.tomato)}${path('M0 -184Q30 -176 48 -118Q36 -132 24 -126Z', C.tomato)}${path('M0 -184Q80 -176 96 -118Q72 -132 48 -118', C.tomato, ' opacity="0"')}${path('M-96 -118Q-80 -176 0 -184Q80 -176 96 -118Q72 -132 48 -118Q24 -132 0 -118Q-24 -132 -48 -118Q-72 -132 -96 -118Z', 'none', ol(5))}${circ(0, -188, 6, C.marigold, ol(3))}`);
    s += at(540, 372, 1, `${path('M0 -10L74 -10L96 -36', 'none', ol(10))}${path('M0 -10L74 -10L96 -36', 'none', ' stroke="#fff4e2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"')}${line('M8 -10V0M66 -10V0', INK, 4)}`);
    s += at(668, 372, 1, `${path('M0 -10L74 -10L96 -36', 'none', ol(10))}${path('M0 -10L74 -10L96 -36', 'none', ' stroke="#4fb3a6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"')}${line('M8 -10V0M66 -10V0', INK, 4)}`);
    s += at(560, 392, 1, `${ell(0, 0, 13, 6, C.marigold, ol(3))}${ell(26, 3, 13, 6, C.marigold, ol(3))}${line('M-4 0Q0 -6 4 0M22 3Q26 -3 30 3', INK, 2.5)}`);
    // the two sites on a signpost
    s += at(836, 380, 1, `${rect(-6, -150, 12, 150, C.wood, ol(4))}${path('M-70 -146H40L58 -130L40 -114H-70Z', C.cream, ol(4))}${text(-60, -124, 'sandals.com', 19, INK, ' font-family="Bricolage, sans-serif" font-weight="700"')}${path('M70 -100H-40L-58 -84L-40 -68H70Z', C.cream, ol(4))}${text(-44, -78, 'beaches.com', 19, INK, ' font-family="Bricolage, sans-serif" font-weight="700"')}`);
    s += anim('crab', at(780, 428, 1, `${anim('claw', `${path('M-28 -10Q-44 -26 -34 -36Q-26 -30 -30 -22Q-22 -26 -20 -16Z', C.tomato, ol(3))}`)}${anim('claw', `${path('M28 -10Q44 -26 34 -36Q26 -30 30 -22Q22 -26 20 -16Z', C.tomato, ol(3))}`, 'animation-delay:-.25s')}${ell(0, -6, 22, 13, C.tomato, ol(3.5))}${line('M-8 -16V-26M8 -16V-26', INK, 3)}${circ(-8, -28, 4, '#fff', ol(2))}${circ(8, -28, 4, '#fff', ol(2))}${line('M-18 2L-26 8M-10 5L-14 12M18 2L26 8M10 5L14 12', INK, 3)}`));
    s += foam(60, 940, 446);
    return s;
  }

  function isleBSc(id) {
    let s = '';
    s += path('M60 444C130 372 250 312 420 300C600 290 770 330 870 392C904 414 924 430 936 444Z', '#7dbb5a', ol(5));
    s += path('M110 428C240 404 400 396 560 398C720 402 840 414 922 438L936 444L66 444Z', '#5f9e46');
    s += path('M70 444C120 434 200 430 300 430C500 430 760 432 932 444Z', '#f0d39a');
    // tree
    s += at(208, 340, 1, `${rect(-9, -60, 18, 64, '#8a5a34', ol(4))}${anim('sway', `${circ(-26, -86, 34, '#4e9442', ol(4))}${circ(22, -96, 40, '#4e9442', ol(4))}${circ(-6, -126, 38, '#5aa64b', ol(4))}${circ(-4, -86, 30, '#5aa64b')}${circ(-14, -132, 14, '#79c062')}`, 'transform-origin:0px -60px;--t:5s;--a:-2deg;--b:2deg')}`);
    // faculty building with a clock
    s += at(530, 314, 1, `${rect(-170, -10, 340, 18, '#e3d4b8', ol(4))}${rect(-150, -150, 300, 142, C.cream, ol(5))}${[-110, -50, 10, 70].map((x) => rect(x, -138, 26, 128, '#f6ecd8', ol(3.5))).join('')}${rect(-162, -162, 324, 18, '#eadfc8', ol(4))}${path('M-172 -162L0 -236L172 -162Z', C.tomato, ol(5))}${circ(0, -192, 22, C.cream, ol(4))}${anim('spin', line('M0 -192V-208', INK, 3), '--t:60s;transform-box:view-box;transform-origin:0px -192px')}${anim('spin', line('M0 -192H11', INK, 3.5), '--t:240s;transform-box:view-box;transform-origin:0px -192px')}${rect(-22, -60, 44, 50, '#7a4b2a', ol(4))}${rect(-12, -262, 24, 30, C.cream, ol(4))}${path('M-16 -262L0 -280L16 -262Z', C.tomato, ol(4))}${line('M0 -280V-312', INK, 3)}${anim('flag', path('M0 -312L36 -302L0 -292Z', C.marigold, ol(3)))}`);
    // mortarboards in the air
    const board = (c) => `${path('M-26 0L0 -12L26 0L0 12Z', INK)}${path('M-14 4L-14 14Q0 20 14 14L14 4L0 10Z', '#3d2c24', ol(2))}${line('M0 0L18 6L18 20', c, 3)}${circ(18, 22, 3.5, c)}`;
    s += at(770, 360, 1, `<g class="toss" style="--t:2.8s;--d:-.4s;--dx:10px;--r:190deg">${board(C.marigold)}</g>`);
    s += at(830, 380, 1, `<g class="toss" style="--t:3.2s;--d:-1.6s;--dx:-8px;--r:-210deg">${board(C.blush)}</g>`);
    s += at(720, 384, 0.9, `<g class="toss" style="--t:3s;--d:-2.4s;--dx:6px;--r:170deg">${board(C.cream)}</g>`);
    // diploma
    s += at(330, 404, 1, `${rr(-40, -12, 80, 24, 12, C.cream, ol(4))}${ell(-40, 0, 7, 12, '#efe2c8', ol(3))}${rect(-6, -13, 12, 26, C.tomato)}${path('M-6 13L-12 30L-2 24L0 13Z', C.tomato, ol(2.5))}${path('M6 13L12 30L2 24L0 13Z', C.tomato, ol(2.5))}`);
    s += foam(70, 930, 446);
    return s;
  }

  function isleFluky(id) {
    let s = '';
    // the dock on the right, its posts in the water
    s += [784, 846, 908, 968].map((x) => rect(x - 7, 400, 14, 58, '#7f6250', ol(3.5))).join('');
    s += rect(748, 394, 240, 16, '#c08a56', ol(4)) + line('M808 396V408M868 396V408M928 396V408', '#8f5a2c', 2.5);
    s += rr(962, 372, 16, 24, 6, '#5b4a42', ol(3.5)) + line('M970 380Q990 396 984 420', INK, 3);
    // the rock: faceted, with strata and boulders at the waterline
    const rock = 'M60 444C88 400 130 374 188 366L280 356C330 338 420 334 520 340C620 345 720 350 790 366C826 376 846 404 852 444Z';
    s += path(rock, '#b59a80', ol(5));
    s += `<clipPath id="rk${id}"><path d="${rock}"/></clipPath><g clip-path="url(#rk${id})">`;
    s += poly([[60, 444], [150, 396], [240, 420], [330, 392], [430, 414], [520, 396], [640, 416], [740, 394], [852, 444]], '#a3876d');
    s += poly([[120, 444], [210, 424], [290, 444]], '#8e735c') + poly([[440, 444], [530, 420], [600, 444]], '#8e735c') + poly([[680, 444], [760, 418], [830, 444]], '#8e735c');
    s += line('M150 404Q300 384 470 392Q620 398 760 382', '#8c7058', 3) + line('M110 426Q260 414 420 420', '#8c7058', 2.5);
    s += '</g>';
    s += path('M188 368C260 352 360 346 520 348C640 350 740 356 800 372C760 364 660 358 520 358C380 356 270 362 188 368Z', '#6aa84f', ol(3));
    for (const [x, y, q, c] of [
      [108, 436, 20, '#c2a88e'],
      [140, 442, 14, '#9a7f67'],
      [812, 434, 22, '#c2a88e'],
      [840, 442, 13, '#9a7f67'],
    ])
      s += ell(x, y, q * 1.3, q, c, ol(3.5));
    // chimneys (one per co-founder) with smoke; the gears turn inside the roof
    const bandC = [C.marigold, C.lagoon, C.blush, C.leaf];
    let sm = '';
    const puff = `${circ(0, 0, 23, INK)}${circ(-17, 7, 17, INK)}${circ(17, 6, 18, INK)}${circ(0, 0, 20, '#eadfd2')}${circ(-17, 7, 14, '#eadfd2')}${circ(17, 6, 15, '#eadfd2')}${circ(-1, -3, 16, '#fffaf0')}${circ(-18, 4, 10, '#fffaf0')}${circ(15, 3, 11, '#fffaf0')}`;
    [336, 410, 484, 558].forEach((x, i) => {
      s += rect(x - 15, 130, 30, 120, C.cream, ol(4)) + rect(x - 15, 152, 30, 16, bandC[i]) + rect(x - 15, 152, 30, 16, 'none', ol(3)) + rr(x - 19, 122, 38, 14, 4, '#5b4a42', ol(3.5));
      for (let k = 0; k < 3; k++) sm += at(x, 108, 1, `<g class="smoke" style="--t:3.6s;--d:${-(k * 1.2 + i * 0.45).toFixed(2)}s;--dx:${36 + i * 8}px;--dy:-190px;--s:1.9">${puff}</g>`);
    });
    s += gear(666, 224, 40, C.marigold, 10, 'spin');
    s += gear(610, 212, 19, C.tomato, 7, 'spin rev');
    s += sm;
    s += rect(296, 236, 420, 120, C.cream, ol(5));
    s += path('M296 238L296 196L366 236L366 196L436 236L436 196L506 236L506 196L576 236L576 196L646 236L646 196L716 236Z', C.lagoon, ol(5));
    for (let i = 0; i < 6; i++) s += rr(316 + i * 64, 262, 40, 34, 5, '#ffd36b', ol(3.5)) + line(`M${336 + i * 64} 262V296`, INK, 2.5);
    s += rr(470, 300, 64, 56, 6, C.tomato, ol(4));
    // sign with a four-leaf clover
    const leaf = (r) => `<g transform="rotate(${r})">${path('M0 0C-14 -10 -16 -30 -6 -34C-2 -36 0 -30 0 -26C0 -30 2 -36 6 -34C16 -30 14 -10 0 0Z', C.leaf, ol(3))}</g>`;
    s += at(232, 300, 1, `${rect(-6, 0, 12, 56, C.wood, ol(3.5))}${rr(-74, -58, 148, 62, 12, C.cream, ol(4.5))}${text(-30, -32, 'Fluky', 22, INK, ' font-family="Bricolage Display, sans-serif" font-weight="800"')}${text(-30, -10, 'Factory', 18, INK, ' font-family="Bricolage Display, sans-serif" font-weight="800"')}${at(-50, -28, 0.62, `<g class="spin" style="--t:14s">${leaf(0)}${leaf(90)}${leaf(180)}${leaf(270)}${circ(0, 0, 5, '#3f7d35')}</g>`)}`);
    // crates on the dock, one per project, the featured one with a star
    const crate = (x, y, w, h, label, feat) => `${rect(x, y, w, h, '#c98a4a', ol(4))}${line(`M${x + 4} ${y + 4}L${x + w - 4} ${y + h - 4}`, '#a8703a', 3)}${rr(x + 9, y + h * 0.26, w - 18, h * 0.48, 4, C.cream, ol(2.5))}${text(x + w / 2, y + h * 0.59, label, 14, INK, ' text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="500"')}${feat ? `${circ(x + w - 6, y + 4, 15, C.marigold, ol(3))}${at(x + w - 6, y + 4, 1.25, path('M0 -8l2.4 5 5.4.6-4 3.6 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.6 5.4-.6z', INK))}` : ''}`;
    s += crate(758, 340, 112, 56, 'EXCURSIONS', false);
    s += crate(876, 330, 104, 66, 'CATCH', true);
    s += crate(778, 290, 90, 50, 'MAYAN', false);
    s += crate(890, 286, 78, 44, 'FERRY', false);
    return s + foam(70, 990, 446);
  }

  /* ---------- Amsterdam: canal houses that draw in ---------- */
  function brickPattern() {
    return `<defs><pattern id="amsbrick" width="18" height="10" patternUnits="userSpaceOnUse"><path d="M0 0.4Q9 -0.1 18 0.5M0 5.1Q9 4.6 18 5.3M0 9.6Q9 10.1 18 9.5M0 0.4Q0.3 2.6 0 5.1M9 5.1Q9.4 7.4 9 9.6" fill="none" stroke="#2b1b14" stroke-width="0.7" stroke-linecap="round" opacity="0.38"/></pattern></defs>`;
  }
  // q scales every gable, window, door and beam offset with the house (q = 1 keeps the desktop drawing unchanged)
  function house(x, base, w, h, kind, c, o = {}, q = 1) {
    const top = base - h;
    const g = (v) => top + v * q;
    let sil;
    if (kind === 'step') {
      const s = w / 6;
      sil = [[x, base], [x, g(70)], [x + s, g(70)], [x + s, g(46)], [x + 2 * s, g(46)], [x + 2 * s, g(22)], [x + 2.4 * s, g(22)], [x + 2.4 * s, top], [x + 3.6 * s, top], [x + 3.6 * s, g(22)], [x + 4 * s, g(22)], [x + 4 * s, g(46)], [x + 5 * s, g(46)], [x + 5 * s, g(70)], [x + w, g(70)], [x + w, base]];
    } else if (kind === 'neck') {
      sil = [[x, base], [x, g(64)], [x + w * 0.22, g(64)], [x + w * 0.22, g(10)], [x + w * 0.5, g(-6)], [x + w * 0.78, g(10)], [x + w * 0.78, g(64)], [x + w, g(64)], [x + w, base]];
    } else if (kind === 'bell') {
      sil = [[x, base], [x, g(72)], [x + w * 0.12, g(66)], [x + w * 0.2, g(30)], [x + w * 0.34, g(12)], [x + w * 0.5, top], [x + w * 0.66, g(12)], [x + w * 0.8, g(30)], [x + w * 0.88, g(66)], [x + w, g(72)], [x + w, base]];
    } else {
      sil = [[x, base], [x, g(40)], [x + w * 0.5, g(-14)], [x + w, g(40)], [x + w, base]];
    }
    const d = pts(sil);
    let win = '';
    let wd = '';
    const cols = q === 1 && w > 120 ? 3 : 2;
    const m = 12 * q;
    const wh = 40 * q;
    const rs = 58 * q;
    const ww = (w - 2 * m - (cols - 1) * m) / cols;
    const rows = Math.max(0, Math.floor((h - 120 * q) / rs));
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < cols; k++) {
        const wx = x + m + k * (ww + m);
        const wy = g(84) + r * rs;
        if (o.trim) win += rect(wx - 3 * q, wy - 3 * q, ww + 6 * q, wh + 6 * q, '#fffef8', ol(2 * Math.min(1, q * 1.4)));
        win += rect(wx, wy, ww, wh, '#fffaf0') + rect(wx + 4 * q, wy + 4 * q, ww - 8 * q, wh - 8 * q, '#2d5560') + rect(wx + ww / 2 - 1.5 * q, wy + 4 * q, 3 * q, wh - 8 * q, '#fffaf0');
        wd += `M${N(wx)} ${N(wy)}h${N(ww)}v${N(wh)}h${N(-ww)}Z`;
      }
    let beam = '';
    if (o.beam) {
      const px = x + w * 0.5;
      const py = kind === 'neck' ? g(-6) : kind === 'tri' ? g(-14) : top;
      const len = Math.max(26 * q, Math.min(w * 0.46, 52 * q));
      const bx = px + len;
      const by = py - len * 0.06;
      beam = `M${N(px)} ${N(py)}L${N(bx)} ${N(by)}M${N(px + len * 0.62)} ${N(py + (by - py) * 0.62)}L${N(px + len * 0.18)} ${N(py + 18 * q)}M${N(bx)} ${N(by)}v${N(10 * q)}M${N(bx - 5 * q)} ${N(by + 10 * q)}L${N(bx + 1 * q)} ${N(by + 15 * q)}`;
    }
    const brick = o.brick ? `<clipPath id="hbk${o.id}"><path d="${d}Z"/></clipPath><g clip-path="url(#hbk${o.id})">${rect(x - 4, g(-20), w + 8, base - top + 24 * q, 'url(#amsbrick)')}</g>` : '';
    const dw = 30 * q;
    const dh = 50 * q;
    const door = rect(x + w / 2 - dw / 2, base - dh, dw, dh, dk(c, 0.35)) + rect(x + w / 2 - dw / 2, base - dh, dw, dh, 'none', ol(3 * Math.min(1, q * 1.4)));
    return {
      fill: `${path(`${d}Z`, c)}${brick}${win}${door}${rect(x + w / 2 - 3 * q, g(58), 6 * q, 18 * q, '#5b4a42')}`,
      line: `${d}Z${wd}${beam}`,
    };
  }
  function windmill(x, y, s) {
    const sail = (r) => `<g transform="rotate(${r})">${rect(-5, -96, 10, 92, '#5b4a42')}${rect(5, -92, 20, 72, '#fff4e2', ' opacity=".9"')}${line('M5 -74H25M5 -56H25M5 -38H25', '#5b4a42', 2)}</g>`;
    return at(x, y, s, `${poly([[-22, 0], [22, 0], [12, -118], [-12, -118]], '#6b5146')}${path('M-16 -118Q0 -140 16 -118Z', '#5b4a42')}<g transform="translate(0 -124)"><g class="spin" style="--t:9s;transform-box:view-box;transform-origin:0 0">${sail(0)}${sail(90)}${sail(180)}${sail(270)}${circ(0, 0, 6, '#5b4a42')}</g></g>`);
  }
  function stampSVG() {
    const R = 100;
    const ring = (r, w) => circ(0, 0, r, 'none', ` stroke="#d63c25" stroke-width="${w}"`);
    let s = `<defs><path id="stp" d="M-78 0A78 78 0 1 1 78 0A78 78 0 1 1 -78 0"/></defs>`;
    s += ring(R, 8) + ring(R - 14, 3) + ring(58, 3);
    s += `<text font-family="Bricolage Display, sans-serif" font-weight="800" font-size="22" fill="#d63c25" letter-spacing="3"><textPath href="#stp" startOffset="2%">AMSTERDAM · ARRIVALS · AMSTERDAM · ARRIVALS ·</textPath></text>`;
    s += text(0, 18, '2017', 46, '#d63c25', ' text-anchor="middle" font-family="Bricolage Display, sans-serif" font-weight="800"');
    s += at(-20, -44, 0.34, planeTop().replaceAll(INK, '#d63c25').replaceAll(C.cream, 'none').replaceAll(C.sand, 'none').replaceAll(C.lagoon, 'none').replaceAll(C.tomato, '#d63c25'));
    const r = rng(7);
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2;
      const d = r() * R;
      s += circ(Math.cos(a) * d, Math.sin(a) * d, 1 + r() * 2.6, '#fff4e2');
    }
    return s;
  }

  /* ---------- globe: Natural Earth 110 m land (public domain), orthographic about 46° W 31° N, R = 500 ---------- */
  const GLOBE = { land: 'M286 571Q290 571 299 574Q309 578 314 583Q320 589 318 590Q317 592 309 589Q302 587 299 589Q296 592 292 589Q289 585 283 584Q277 584 276 581Q275 578 282 579Q290 581 287 576Q283 571 286 571ZM236 527Q244 532 261 549Q277 566 265 563Q252 560 255 559Q258 557 253 550Q249 544 239 538Q229 531 230 530Q230 528 219 527Q208 526 218 524Q228 522 236 527ZM446 325Q444 329 442 332Q440 336 442 335Q444 333 444 336Q445 338 451 340Q458 342 456 345Q455 348 457 347Q459 347 460 352Q461 357 459 360Q458 364 455 363Q451 362 452 358Q452 354 448 357Q444 361 442 360Q441 360 443 358Q445 357 443 355Q440 354 431 353Q423 352 430 340Q438 328 442 325Q447 321 446 325ZM691 274Q693 283 691 287Q689 291 685 291Q682 292 681 287Q681 283 678 279Q675 276 676 270Q678 264 683 264Q688 265 691 274ZM674 234Q677 232 678 237Q679 241 683 239Q686 237 688 244Q690 250 707 257Q724 264 727 269Q730 274 730 277Q730 280 723 284Q716 288 713 292Q710 297 708 297Q707 297 709 290Q711 283 706 283Q701 282 702 280Q704 278 700 274Q697 270 700 269Q703 268 702 266Q701 264 695 263Q690 262 687 258Q684 255 684 257Q684 259 680 254Q676 250 673 242Q671 235 674 234ZM596 200Q604 195 608 199Q613 203 608 211Q602 219 595 219Q587 219 588 217Q589 215 584 214Q580 213 582 211Q584 209 580 209Q576 208 576 206Q577 204 582 204Q588 205 596 200ZM376 161Q377 163 374 166Q371 169 375 167Q379 166 375 173Q372 180 381 173Q391 166 393 168Q396 170 392 178Q387 187 383 188Q379 189 376 187Q373 186 366 190Q359 195 339 202Q319 209 312 215Q306 221 308 222Q310 224 307 231Q304 237 306 237Q309 238 315 250Q321 262 326 264Q331 267 327 274Q324 281 324 290Q325 300 331 296Q336 292 338 283Q339 274 349 269Q360 265 360 255Q361 246 365 243Q369 240 373 231Q377 222 384 224Q392 225 394 231Q397 237 400 238Q403 239 401 247Q398 255 400 258Q403 262 412 255Q421 248 424 262Q428 276 426 278Q425 281 434 289Q443 297 446 302Q449 308 449 313Q448 317 435 324Q422 330 405 328Q389 325 372 336Q355 347 370 340Q385 334 389 334Q393 334 395 337Q397 339 394 341Q391 344 391 352Q390 359 399 362Q407 365 411 361Q415 357 416 361Q417 366 398 373Q380 381 378 380Q375 379 376 376Q377 372 383 370Q389 367 381 366Q373 366 363 370Q352 374 349 379Q345 384 347 388Q348 391 336 391Q324 391 330 393Q335 394 329 393Q322 393 317 399Q312 406 311 403Q310 400 310 405Q310 410 305 414Q301 418 303 410Q304 402 303 406Q301 411 300 409Q298 408 298 420Q298 433 276 444Q253 456 252 476Q250 497 247 503Q245 510 241 505Q237 501 237 486Q238 471 235 466Q233 460 229 461Q226 462 223 457Q220 452 213 449Q205 446 202 450Q200 455 191 447Q181 439 177 438Q173 437 163 441Q153 446 145 464Q136 483 136 492Q135 500 137 509Q138 519 141 524Q145 529 156 530Q168 531 171 525Q174 519 184 521Q195 523 184 544Q172 564 185 569Q198 574 202 579Q207 584 203 601Q199 617 206 629Q213 642 220 641Q227 640 237 647Q247 654 251 652Q256 650 259 645Q263 639 269 640Q274 641 281 637Q288 634 290 636Q292 638 289 640Q286 642 286 652Q286 662 289 659Q292 656 290 652Q289 647 294 646Q299 646 301 643Q302 640 308 648Q314 656 327 660Q341 665 343 663Q346 661 356 662Q366 664 362 664Q358 665 360 667Q361 669 367 673Q374 676 374 679Q375 682 381 686Q388 689 396 698Q404 707 417 709Q431 711 442 718Q454 724 457 733Q461 742 463 743Q465 744 462 749Q459 755 468 757Q477 759 477 763Q477 766 481 764Q484 762 497 765Q510 769 511 773Q512 777 532 777Q552 777 564 783Q576 790 584 791Q593 793 595 799Q597 805 595 811Q593 817 578 831Q562 846 559 860Q556 875 548 886Q541 898 537 901Q532 904 510 909Q487 914 484 916Q480 919 479 925Q478 931 461 942Q444 953 427 950Q411 948 418 953Q425 958 423 961Q420 963 405 962Q390 961 392 964Q395 967 386 966Q377 965 383 968Q390 971 381 972Q373 974 379 977Q386 979 381 981Q376 982 380 983Q385 985 368 981Q352 977 341 971Q330 965 330 963Q329 961 333 962Q337 964 335 961Q334 959 331 959Q327 959 321 950Q315 941 317 933Q319 926 315 918Q312 910 311 893Q310 875 307 866Q304 858 281 841Q258 824 241 795Q224 766 219 760Q213 755 212 750Q211 745 217 739Q222 734 218 731Q214 728 214 723Q214 719 217 713Q220 707 224 707Q229 706 230 702Q232 697 237 694Q242 691 241 680Q241 668 235 657Q230 646 225 647Q221 648 222 652Q223 655 221 656Q220 656 209 648Q199 639 195 631Q190 622 190 624Q189 626 187 624Q186 621 186 617Q186 612 182 601Q178 589 167 581Q155 573 147 558Q139 544 134 543Q128 542 114 519Q100 497 97 487Q95 477 98 467Q101 458 99 439Q97 419 101 386Q104 353 101 360Q97 366 93 401Q90 436 88 437Q86 438 85 426Q85 415 87 410Q89 405 88 394Q87 382 90 381Q92 379 98 357Q103 336 103 324Q103 313 112 293Q120 273 147 244Q173 214 171 220Q169 227 175 221Q181 215 184 203Q188 192 212 166Q236 141 237 135Q239 130 250 116Q261 101 258 102Q255 102 254 99Q253 96 260 95Q268 93 255 91Q242 90 243 85Q245 79 247 83Q249 86 254 86Q259 85 263 80Q266 75 280 68Q294 62 298 62Q302 62 300 65Q299 68 312 60Q326 53 322 58Q318 63 331 58Q344 54 343 55Q342 56 345 57Q349 59 350 62Q350 65 344 70Q338 74 329 87Q320 99 326 103Q332 106 330 107Q328 109 331 108Q335 108 331 111Q328 115 331 115Q334 114 331 116Q328 117 330 118Q332 118 332 126Q332 133 328 137Q325 141 328 143Q332 145 330 147Q329 150 336 148Q343 147 343 153Q343 159 347 161Q350 163 353 161Q357 159 354 164Q352 168 359 165Q367 161 368 157Q369 153 376 149Q383 145 381 151Q379 158 377 159Q374 160 376 161ZM357 117Q365 118 363 118Q361 119 363 120Q366 120 364 122Q363 124 366 124Q368 123 365 127Q361 131 367 129Q373 127 365 138Q357 150 353 151Q349 152 348 149Q346 145 339 141Q331 137 334 132Q338 126 342 128Q346 131 344 127Q342 123 345 122Q349 122 349 119Q348 117 357 117ZM408 145Q406 146 405 149Q404 151 411 149Q417 147 415 152Q412 157 417 156Q422 156 423 161Q425 167 427 167Q430 167 433 176Q436 185 433 186Q430 187 438 195Q446 203 441 209Q435 215 432 209Q429 204 427 204Q425 204 426 215Q428 226 427 229Q425 231 420 226Q414 221 417 228Q419 236 411 230Q404 225 400 217Q397 209 391 208Q384 206 387 204Q390 202 396 203Q403 205 408 199Q413 194 411 182Q408 170 404 170Q400 171 393 165Q386 160 390 154Q394 148 399 146Q404 143 408 143Q411 144 408 145ZM357 115Q346 116 343 115Q341 114 344 110Q347 107 357 104Q367 101 369 103Q370 104 368 110Q367 115 357 115ZM413 120Q416 120 416 126Q415 132 422 134Q429 137 428 139Q428 142 421 141Q413 140 409 136Q405 133 409 129Q412 124 412 122Q411 120 413 120ZM381 15Q397 11 390 14Q383 17 396 13Q408 9 437 5Q465 1 512 2Q558 3 589 9Q619 14 663 30Q707 45 735 60Q762 74 800 102Q837 130 858 153Q880 175 907 213Q934 251 937 260Q940 269 935 265Q930 261 931 266Q932 270 942 282Q952 294 948 281Q943 269 958 302Q972 336 980 372Q988 409 983 395Q979 382 967 366Q956 350 946 343Q935 335 933 330Q930 324 933 333Q936 341 930 336Q925 331 942 350Q960 369 976 395Q992 422 988 401Q985 380 991 414Q997 449 997 501Q997 552 988 597Q980 641 969 671Q958 700 935 741Q913 782 893 808Q873 833 887 808Q901 783 903 769Q905 755 914 733Q923 711 923 693Q922 674 915 665Q908 657 911 639Q913 622 909 617Q906 613 899 620Q892 627 887 622Q883 617 864 633Q846 649 838 652Q829 654 820 661Q810 669 805 669Q800 669 787 664Q774 659 764 647Q754 636 747 632Q740 629 739 623Q738 618 734 614Q730 610 733 603Q737 596 737 588Q737 579 731 564Q725 549 730 528Q735 507 746 486Q757 466 755 455Q752 443 756 434Q761 425 761 417Q761 409 772 407Q783 405 789 395Q796 384 809 374Q822 365 825 360Q828 356 830 357Q833 359 834 356Q835 353 840 367Q846 380 869 379Q892 378 890 364Q888 350 896 348Q903 346 909 342Q914 338 915 331Q915 325 917 325Q919 326 920 320Q921 315 909 294Q897 272 897 281Q896 289 894 289Q892 288 892 293Q891 299 888 300Q885 302 876 295Q867 288 866 268Q865 248 871 243Q876 238 875 231Q874 224 871 221Q867 218 858 218Q849 219 844 209Q838 200 840 209Q841 218 846 219Q850 221 851 227Q852 233 848 232Q844 231 843 228Q841 224 838 227Q835 229 844 246Q853 263 859 266Q864 269 864 276Q864 283 862 282Q860 280 858 281Q857 283 858 288Q860 293 857 293Q855 293 863 300Q872 308 870 308Q869 309 871 315Q874 322 861 313Q847 305 843 300Q840 294 820 290Q800 285 803 292Q806 298 826 303Q845 308 845 310Q846 311 842 311Q839 311 843 321Q848 331 842 325Q836 319 827 318Q817 316 805 311Q792 306 791 314Q790 321 783 326Q776 330 779 335Q781 339 778 346Q775 352 778 361Q781 371 779 382Q778 393 772 396Q766 398 765 403Q764 407 759 404Q754 401 748 404Q741 407 730 383Q718 359 720 354Q722 350 738 345Q753 340 753 337Q753 334 749 326Q745 319 733 315Q722 311 720 308Q718 306 725 303Q731 300 728 296Q725 292 727 293Q730 293 733 288Q736 283 734 280Q733 277 735 272Q737 267 735 261Q732 255 737 250Q741 245 731 233Q721 221 722 217Q723 213 728 221Q734 229 740 233Q746 236 747 233Q748 229 752 230Q756 230 757 223Q758 215 761 214Q765 213 764 209Q763 205 756 198Q749 192 749 190Q748 188 752 188Q756 188 748 183Q740 178 742 173Q744 167 743 164Q741 162 739 162Q737 162 736 169Q734 176 730 175Q726 175 719 170Q712 166 704 155Q696 144 694 144Q691 144 691 147Q691 149 702 164Q714 180 720 182Q726 183 736 198Q746 212 744 213Q742 214 744 217Q746 220 745 221Q743 223 727 213Q711 203 712 209Q714 214 709 216Q704 217 693 208Q683 198 681 186Q680 174 668 155Q657 135 656 126Q655 117 663 118Q670 118 669 117Q668 116 673 114Q677 112 684 110Q691 109 697 114Q702 119 699 122Q695 126 707 127Q719 129 714 127Q709 124 712 123Q714 122 707 116Q699 110 701 109Q703 108 693 105Q683 102 684 100Q685 98 691 100Q698 102 688 93Q678 85 681 85Q683 84 679 80Q674 76 676 76Q678 76 672 74Q665 72 667 67Q670 63 660 62Q650 62 640 58Q630 54 654 56Q678 58 670 56Q662 53 645 52Q627 52 632 51Q636 50 630 47Q624 44 619 45Q613 46 607 43Q601 40 577 37Q553 34 553 32Q553 30 547 27Q542 25 549 25Q557 24 553 22Q550 20 534 18Q517 17 513 14Q508 11 464 14Q420 18 396 27Q371 36 359 36Q348 36 350 34Q353 33 344 35Q336 36 344 31Q351 25 364 21Q376 17 371 18Q365 19 381 15ZM865 195Q874 200 884 210Q895 220 896 217Q897 214 895 210Q892 206 882 194Q871 183 868 182Q866 180 869 184Q872 188 863 184Q854 179 846 169Q838 160 847 175Q856 190 865 195ZM463 102Q477 103 479 106Q482 108 472 114Q462 119 457 120Q452 120 452 122Q451 125 445 127Q438 129 439 131Q440 133 436 134Q432 134 426 131Q420 127 425 124Q430 121 431 123Q432 125 432 122Q433 119 439 115Q445 111 448 111Q451 112 448 110Q445 109 447 105Q450 101 463 102ZM510 103Q518 102 523 103Q527 104 522 107Q517 110 522 109Q527 108 528 111Q530 113 533 110Q535 107 539 108Q542 109 540 113Q537 117 545 126Q552 134 550 136Q548 137 554 144Q561 150 558 151Q556 151 558 153Q561 155 558 157Q555 158 558 161Q561 164 558 164Q555 165 561 169Q568 173 566 174Q564 176 560 173Q556 171 556 175Q557 179 563 178Q568 177 563 184Q557 191 552 193Q546 195 540 204Q534 212 528 214Q522 216 518 227Q513 237 512 247Q511 257 508 257Q505 257 502 254Q499 251 495 251Q490 251 484 240Q478 230 476 217Q473 204 479 195Q485 186 480 186Q474 187 475 183Q476 179 480 180Q484 181 479 177Q473 173 475 170Q477 167 475 158Q473 148 463 145Q454 141 453 138Q452 135 457 135Q461 134 457 131Q452 128 461 126Q469 123 468 121Q468 119 474 115Q479 111 487 110Q495 109 498 111Q502 113 501 111Q499 108 501 106Q503 105 510 103Z' };
  // the route on the sphere as [lat, lon]: Honduras, Miami for the Sandals years, then across the Atlantic to Amsterdam
  const GEO = { hon: [14.91, -86.59], mia: [25.76, -80.19], ams: [52.37, 4.9] };
  const RAD = Math.PI / 180;
  const unit3 = ([la, lo]) => [Math.cos(la * RAD) * Math.cos(lo * RAD), Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD)];
  function slerp3(a, b, t) {
    const w = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
    const s = Math.sin(w);
    return a.map((v, i) => (Math.sin((1 - t) * w) * v + Math.sin(t * w) * b[i]) / s);
  }
  // the same orthographic view as the land; lift raises a point off the surface, which pushes it out from the centre
  function globeXY(v, lift = 0) {
    const lat = Math.asin(v[2]);
    const dl = Math.atan2(v[1], v[0]) + 46 * RAD;
    const x = Math.cos(lat) * Math.sin(dl);
    const y = Math.cos(31 * RAD) * Math.sin(lat) - Math.sin(31 * RAD) * Math.cos(lat) * Math.cos(dl);
    return [500 + 500 * (1 + lift) * x, 500 - 500 * (1 + lift) * y];
  }
  GLOBE.hon = globeXY(unit3(GEO.hon));
  GLOBE.mia = globeXY(unit3(GEO.mia));
  GLOBE.ams = globeXY(unit3(GEO.ams));
  // each leg is a great circle flown at a height that peaks mid-leg, so it bows away from the centre like a flight arc
  function arcLeg(a, b, peak, n = 80) {
    const A = unit3(a);
    const B = unit3(b);
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      out.push(globeXY(slerp3(A, B, t), peak * Math.sin(Math.PI * t)));
    }
    return out;
  }
  function buildRoute() {
    const legB = arcLeg(GEO.mia, GEO.ams, 0.2);
    // the short hop to Miami is one cubic that arrives on the Atlantic arc's heading, so Miami is a waypoint, not a corner;
    // it leaves Honduras on that heading mirrored about the chord, which keeps the hop a single shallow bow
    const [H, M] = [GLOBE.hon, GLOBE.mia];
    const L = Math.hypot(M[0] - H[0], M[1] - H[1]);
    const ch = [(M[0] - H[0]) / L, (M[1] - H[1]) / L];
    const t1 = [legB[1][0] - M[0], legB[1][1] - M[1]];
    const l1 = Math.hypot(...t1);
    const out = [t1[0] / l1, t1[1] / l1];
    const dt = 2 * (out[0] * ch[0] + out[1] * ch[1]);
    const lead = [dt * ch[0] - out[0], dt * ch[1] - out[1]];
    const c1 = [H[0] + (lead[0] * L) / 3, H[1] + (lead[1] * L) / 3];
    const c2 = [M[0] - (out[0] * L) / 3, M[1] - (out[1] * L) / 3];
    const legA = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const u = 1 - t;
      legA.push([0, 1].map((d) => u * u * u * H[d] + 3 * u * u * t * c1[d] + 3 * u * t * t * c2[d] + t * t * t * M[d]));
    }
    const dense = [...legA, ...legB.slice(1)];
    // even spacing, so the dashes match and the plane flies at one speed
    const cum = [0];
    for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const total = cum[cum.length - 1];
    const n = Math.round(total / 22);
    const route = [];
    let j = 1;
    for (let i = 0; i <= n; i++) {
      const d = (total * i) / n;
      while (j < cum.length - 1 && cum[j] < d) j++;
      const u = (d - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
      route.push([dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * u, dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * u]);
    }
    GLOBE.route = route;
    GLOBE.tMia = cum[legA.length - 1] / total;
    // the move sits over open water, two thirds of the way across and clear of Newfoundland
    GLOBE.tMid = GLOBE.tMia + (1 - GLOBE.tMia) * 0.66;
    GLOBE.mid = routeAt(GLOBE.tMid);
  }
  function routeAt(t) {
    const rt = GLOBE.route;
    const f = clamp(t, 0, 1) * (rt.length - 1);
    const i = Math.min(rt.length - 2, Math.floor(f));
    const u = f - i;
    return [rt[i][0] + (rt[i + 1][0] - rt[i][0]) * u, rt[i][1] + (rt[i + 1][1] - rt[i][1]) * u];
  }
  buildRoute();
  // where each stop puts the plane: the Honduras years stay home, Sandals is Miami, the move is mid-ocean
  const STOP_AT = { hero: 'hon', plan: 'hon', aa: 'hon', bsc: 'hon', fluky: 'hon', sandals: 'mia', move: 'mid', booking: 'ams' };
  const PLACE_T = { hon: 0, mia: GLOBE.tMia, mid: GLOBE.tMid, ams: 1 };
  const STOP_T = Object.fromEntries(Object.entries(STOP_AT).map(([k, at]) => [k, PLACE_T[at]]));
  if (QA) window.__lmGlobe = { route: GLOBE.route, places: { hon: GLOBE.hon, mia: GLOBE.mia, mid: GLOBE.mid, ams: GLOBE.ams }, STOP_AT, STOP_T, pose: (k) => routePose(STOP_T[k]), svg: (k) => globeSvg(1, k, true) };
  function routePose(t) {
    const rt = GLOBE.route;
    const n = rt.length - 1;
    const f = clamp(t, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const u = f - i;
    const a = rt[i];
    const b = rt[i + 1];
    return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
  }
  function globeSvg(reveal, activeK, withPins = true) {
    const rv = STATIC ? 1 : reveal;
    const tStop = STOP_T[activeK] ?? 0;
    const rt = GLOBE.route;
    const n = rt.length - 1;
    let dash = '';
    // flown so far in tomato, the rest of the way in a pale dash
    for (let i = 1; i <= n; i++) {
      const [a, b] = [rt[i - 1], rt[i]];
      const flown = i / n <= tStop + 1e-6;
      const shown = i / n <= rv + 0.02;
      dash += `<path class="rd" d="M${N(a[0])} ${N(a[1])}L${N(lerp(a[0], b[0], 0.62))} ${N(lerp(a[1], b[1], 0.62))}" fill="none" stroke="${flown ? C.tomato : '#fff3df'}" stroke-width="${flown ? 5.5 : 4}" stroke-linecap="round" vector-effect="non-scaling-stroke" style="opacity:${shown ? (flown ? 1 : 0.9) : 0.14}"/>`;
    }
    const pose = routePose(tStop);
    const here = STOP_AT[activeK] ?? 'hon';
    const pin = (at, r = 9) => {
      const p = GLOBE[at];
      return `<g opacity="${at === here ? 1 : 0.5}">${circ(p[0], p[1], r, C.marigold, ol(3.5))}${circ(p[0], p[1], r / 3, INK)}</g>`;
    };
    const pins = withPins ? `${pin('hon')}${pin('mia')}${pin('mid', 7)}${pin('ams')}` : '';
    const plane = `<g transform="translate(${N(pose.x)} ${N(pose.y)}) rotate(${N(pose.deg)}) scale(0.62) translate(-60 -50)">${planeTop()}</g>`;
    return `<svg class="art" viewBox="0 0 1000 1000" width="100%" height="100%" role="img" aria-hidden="true"><defs><clipPath id="mgclip"><circle cx="500" cy="500" r="500"/></clipPath></defs><g transform="translate(0 0) scale(1)"><g class="gz">${circ(500, 500, 500, '#2f86a8')}<g clip-path="url(#mgclip)">${circ(500, 500, 430, '#3592b3')}<path d="${GLOBE.land}" fill="#8cc06a" stroke="${INK}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${path('M-20 -20H1020V1020H-20ZM-110 420A530 530 0 1 0 950 420A530 530 0 1 0 -110 420Z', '#163a52', ' fill-rule="evenodd" opacity=".26"')}${path('M-20 -20H1020V1020H-20ZM10 540A530 530 0 1 0 1070 540A530 530 0 1 0 10 540Z', '#fffaf0', ' fill-rule="evenodd" opacity=".3"')}</g>${circ(500, 500, 500, 'none', ' stroke="#2b1b14" stroke-width="4.5" vector-effect="non-scaling-stroke"')}${dash}${pins}${plane}</g></g></svg>`;
  }

  /* ================= scenes ================= */
  const SKY = {
    hero: ['#f29a3a', '#f4a742', '#f6b34c', '#f8bf5a', '#f9ca6b', '#fbd580', '#fce09a', '#fdebb7'],
    high: ['#3f8fc4', '#4c9bcc', '#5aa7d3', '#69b3da', '#7bbfe0', '#8ecae5', '#a3d5ea', '#bae0ef'],
    aa: ['#4cacd5', '#59b4d9', '#67bcdd', '#76c4e1', '#86cce5', '#98d4e9', '#abdced', '#bfe4f1'],
    sandals: ['#ec6a58', '#ee7760', '#f08568', '#f29372', '#f4a17c', '#f6af88', '#f8bd95', '#f9cba4'],
    bsc: ['#1d877d', '#229087', '#289a90', '#31a39a', '#3dada3', '#4bb7ad', '#5dc1b7', '#72cbc1'],
    fluky: ['#d6412b', '#da4b32', '#de5539', '#e26042', '#e56b4c', '#e87857', '#eb8564', '#ee9372'],
    move: ['#1f1840', '#251d4a', '#2c2354', '#33295e', '#3b3068', '#443872', '#4e417c', '#594b86'],
    booking: ['#f19c74', '#f4a87e', '#f6b389', '#f8bf95', '#f9caa1', '#fbd4ad', '#fcdebb', '#fde8c9'],
  };
  const SEA = {
    aa: ['#2c84ad', '#2a789f', '#276b90', '#235e80'],
    sandals: ['#45bfb4', '#35aba2', '#2a958f', '#227f7b'],
    bsc: ['#2c6f95', '#286386', '#235777', '#1e4b68'],
    fluky: ['#1f7470', '#1c6764', '#185a58', '#144d4c'],
    move: ['#2a3266', '#242b5a', '#1f254e', '#1a1f43'],
  };

  // a layer in screen coordinates over [x0, x1] × [y0, y1] at depth z (Infinity holds still)
  const LY = (z, x0, y0, x1, y1, inner, o = {}) => ({ z, x0, y0, w: x1 - x0, h: y1 - y0, inner, ...o });

  function farClouds(G, z, y0, y1, n, light, shade, seed) {
    const r = rng(seed);
    let s = '';
    const span = G.W * 1.8;
    for (let i = 0; i < n; i++) {
      const w = G.U * (90 + r() * 120);
      const x = -0.4 * G.W + (i + r() * 0.6) * (span / n);
      const y = lerp(y0, y1, r());
      s += anim('drift', cloud(x, y, w, { t: i, light, shade }), `--t:${14 + r() * 10}s;--dx:${N((r() * 2 - 1) * 26)}px`);
    }
    return LY(z, -0.4 * G.W, -0.2 * G.H, 1.4 * G.W, G.H, s);
  }

  function gulls(G, z, n, seed, y0, y1) {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = -0.2 * G.W + r() * 1.4 * G.W;
      const y = lerp(y0, y1, r());
      const sc = (0.8 + r() * 0.6) * Math.max(0.7, G.U);
      s += anim('drift', at(x, y, sc, `<g class="flap" style="animation-delay:${N(-r())}s">${line('M-12 0Q-6 -7 0 0Q6 -7 12 0', INK, 2.6)}</g>`), `--t:${9 + r() * 6}s;--dx:${N(30 + r() * 40)}px;--dy:${N(-6 + r() * 12)}px`);
    }
    return LY(z, -0.4 * G.W, 0, 1.4 * G.W, G.H, s);
  }

  function seaScene(G, k, o) {
    const { W, H, Hs, U } = G;
    const hy = G.hy;
    const L = [];
    L.push(LY(Infinity, 0, 0, W, Hs, bands(0, W, 0, hy, SKY[k])));
    if (o.rays) {
      const R = Math.hypot(Math.max(o.sunAt.x, W - o.sunAt.x), Math.max(o.sunAt.y, Hs - o.sunAt.y)) * 1.04;
      L.push(raysLayer(o.sunAt.x, o.sunAt.y, R, 16, o.rays, 0.2));
    }
    let refl = '';
    if (o.low) {
      const r = rng(o.seed + 11);
      for (let i = 0; i < 9; i++) {
        const yy = hy + 6 + i * (H * 0.022) * (1 + i * 0.25);
        const ww = o.sunAt.r * (1.5 - i * 0.1) * (0.7 + r() * 0.5);
        refl += anim('shim', rect(o.sunAt.x - ww / 2, yy, ww, 3.5, o.low, ' opacity=".75"'), `--t:${1.8 + r()}s;animation-delay:${N(-r() * 2)}s`);
      }
    }
    L.push(LY(Infinity, 0, 0, W, Hs, (o.sun || '') + bands(0, W, hy, Hs, SEA[k], 1.3) + rect(0, hy, W, 2.5, mix(SEA[k][0], '#fff8ec', 0.45)) + refl));
    L.push(farClouds(G, 6, 0.1 * H, hy - 0.1 * H, 6, o.cl1, o.cl2, o.seed));
    if (o.isles) L.push(LY(4.5, -0.4 * W, hy - 60 * U, 1.4 * W, hy + 2, o.isles));
    if (o.gulls) L.push(gulls(G, 3.6, 4, o.seed + 5, H * 0.12, hy - H * 0.06));
    L.push({ z: 3.2, title: true });
    let wv = '';
    const r = rng(o.seed + 3);
    for (let i = 0; i < 18; i++) {
      const x = -0.3 * W + r() * 1.6 * W;
      const y = hy + 10 + r() ** 1.3 * (Hs - hy - 10);
      const w = (14 + r() * 26) * U * (1 + (y - hy) / (Hs - hy));
      wv += anim('shim', line(`M${N(x)} ${N(y)}h${N(w)}`, o.wave, 3), `--t:${2 + r() * 2}s;animation-delay:${N(-r() * 3)}s`);
    }
    L.push(LY(2, -0.4 * W, hy, 1.4 * W, Hs, wv));
    const isle = G.isle;
    L.push(LY(1.3, isle.x - 20, isle.y - 600 * isle.s, isle.x + 1020 * isle.s, isle.y + 140 * isle.s, ell(isle.x + isle.cx * isle.s, isle.y + 10 * isle.s, 470 * isle.s, 26 * isle.s, dk(SEA[k][1], 0.18), ' opacity=".55"') + at(isle.x, isle.y - 440 * isle.s, isle.s, o.island), { wc: true }));
    // two rows of swell along the bottom edge, crests leaning with the wind and capped with foam
    const swell = (z, y0, per, amp, fill, seed) => {
      let d = `M${N(-per)} ${N(Hs + 40)}L${N(-per)} ${N(y0)}`;
      let fm = '';
      const n = 3;
      for (let x = -per, i = 0; x < W + 2 * per; x += per / n, i++) {
        const p = per / n;
        const a = amp * [1, 0.78, 0.9][(i + seed) % n];
        const cx = x + p * 0.6;
        d += `C${N(x + p * 0.24)} ${N(y0)} ${N(x + p * 0.38)} ${N(y0 - a)} ${N(cx)} ${N(y0 - a)}C${N(x + p * 0.74)} ${N(y0 - a)} ${N(x + p * 0.8)} ${N(y0 - a * 0.3)} ${N(x + p)} ${N(y0)}`;
        fm += line(`M${N(x + p * 0.4)} ${N(y0 - a * 0.6)}Q${N(x + p * 0.47)} ${N(y0 - a * 0.93)} ${N(cx)} ${N(y0 - a * 0.94)}`, '#fffaf0', N(Math.max(3, 4.5 * U)));
        fm += circ(x + p * 0.8, y0 - a * 0.12, Math.max(2.4, 3.6 * U), '#fffaf0') + circ(x + p * 0.9, y0 + a * 0.18, Math.max(1.8, 2.6 * U), '#fffaf0', ' opacity=".8"');
      }
      d += `L${N(W + 2 * per)} ${N(Hs + 40)}Z`;
      return LY(z, -per, y0 - amp - 10, W + 2 * per, Hs + 40, path(d, fill, ol(3.5)) + fm, { wrap: per, front: true });
    };
    const per = Math.max(300, W * 0.42);
    L.push(swell(0.9, Hs - (G.desk ? 0.1 : 0.075) * H, per * 0.8, 15 * U, mix(SEA[k][2], SEA[k][1], 0.4), 1));
    L.push(swell(0.72, Hs - (G.desk ? 0.045 : 0.035) * H, per, 20 * U, dk(SEA[k][3], 0.1), 0));
    return L;
  }

  /* ================= motion version ================= */
  const stage = $('#stage');
  const track = $('#track');
  const copies = $$('.copy');
  const cins = copies.map((c) => $('.cin', c));
  const byK = Object.fromEntries(copies.map((c, i) => [c.dataset.k, i]));
  const spacer = $('#spacer');
  const contact = $('#contact');
  const hud = $('#hud');
  let LAY = null;
  const st = { y: 0, raf: 0, last: 0, vis: null, act: '', v: 0, pitch: 0, pv: 0, str: 0, sv: 0, lastY: 0 };

  let svhEl;
  let safeEl;
  function svh() {
    if (!svhEl) {
      svhEl = document.createElement('div');
      svhEl.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
      document.body.appendChild(svhEl);
    }
    return svhEl.offsetHeight || innerHeight;
  }
  function safeAreaBottom() {
    if (!safeEl) {
      safeEl = document.createElement('div');
      safeEl.style.cssText =
        'position:fixed;left:0;bottom:0;width:0;height:0;padding-bottom:max(0px, env(safe-area-inset-bottom));visibility:hidden;pointer-events:none';
      document.body.appendChild(safeEl);
    }
    return safeEl.offsetHeight || 0;
  }
  // Phones: always the small viewport (toolbar shown). Headless WebKit often reports svh === window height; QA can pass ?svh=.
  function layoutH(desk) {
    if (desk) return svh();
    let h = svh();
    const vv = window.visualViewport;
    if (vv?.height > 0) h = Math.min(h, vv.height);
    const o = qs.get('svh');
    if (o !== null) h = Math.min(h, Math.max(320, Number(o) || h));
    else if (QA && h >= innerHeight - 12 && innerHeight > 700) h = innerHeight - 180;
    return h;
  }
  function portChrome() {
    const pad = 16;
    const breathe = 10;
    const safe = safeAreaBottom();
    const bottom = pad + breathe + safe;
    return { pad, breathe, safe, bottom };
  }
  function mobileCardBox(h, hero, H, chrome) {
    const short = H < 720;
    const estTitle = H * (short ? 0.19 : 0.22);
    const minTop = Math.max(52, H * 0.07) + estTitle;
    const bottom = chrome.bottom;
    if (hero) {
      const slack = 6;
      const maxH = Math.min(h + slack, H * 0.52);
      let top = H - bottom - Math.min(h + slack, maxH);
      top = Math.max(top, minTop * 0.85);
      const bh = Math.min(h + slack, maxH, H - bottom - top);
      return { top, maxH: bh, bh };
    }
    let top = H - bottom - h;
    let maxH = h;
    if (top < minTop) {
      top = minTop;
      maxH = Math.max(H * 0.26, H - bottom - top);
    }
    const bh = Math.min(h, maxH);
    if (top + bh > H - bottom) top = Math.max(minTop, H - bottom - bh);
    return { top, maxH, bh };
  }

  // a title as absolutely placed letters, so each can drop on its own while keeping the font's kerning
  function titleHTML(lines, fs, color, ext) {
    const m = html(`<div class="ttl" style="font-size:${N(fs)}px;visibility:hidden"></div>`);
    stage.appendChild(m);
    let out = '';
    let i = 0;
    let wmax = 0;
    for (const ln of lines) {
      const sp = document.createElement('span');
      sp.textContent = ln;
      m.appendChild(sp);
      const tn = sp.firstChild;
      const rg = document.createRange();
      rg.selectNodeContents(tn);
      const r0 = rg.getBoundingClientRect();
      let row = '';
      for (let c = 0; c < ln.length; c++) {
        rg.setStart(tn, c);
        rg.setEnd(tn, c + 1);
        const b = rg.getBoundingClientRect();
        if (ln[c] !== ' ') row += `<span class="L" style="left:${N(b.left - r0.left)}px;animation-delay:${i * 34}ms">${ln[c]}</span>`;
        i++;
      }
      wmax = Math.max(wmax, r0.width);
      out += `<span class="ln" style="width:${N(r0.width)}px;height:${N(fs * 0.86)}px">${row}</span>`;
      sp.remove();
    }
    m.remove();
    return { html: `<div class="ttl" style="font-size:${N(fs)}px;color:${color};--x:${ext}">${out}</div>`, w: wmax, h: lines.length * fs * 0.86 };
  }
  let measureEl;
  function lineWidth(s) {
    if (!measureEl) measureEl = html('<div class="ttl" style="visibility:hidden;font-size:100px"><span></span></div>');
    if (!measureEl.isConnected) stage.appendChild(measureEl);
    measureEl.firstChild.textContent = s;
    return measureEl.firstChild.getBoundingClientRect().width / 100;
  }
  function fitTitle(lines, box, cap) {
    const wm = Math.max(...lines.map(lineWidth));
    return Math.max(24, Math.min(cap, box.w / wm, box.h / (lines.length * 0.86)));
  }

  // the timeline, in viewport heights: scenes and the cloud banks between them
  const PLAN = [
    { k: 'hero', len: 2.7 },
    { w: 'up', len: 0.8 },
    { k: 'plan', len: 2.3 },
    { w: 'down', len: 0.8 },
    { k: 'aa', len: 1.45 },
    { w: 'pass', len: 0.8 },
    { k: 'sandals', len: 1.45 },
    { w: 'pass', len: 0.8 },
    { k: 'bsc', len: 1.2 },
    { w: 'pass', len: 0.8 },
    { k: 'fluky', len: 1.45 },
    { w: 'dusk', len: 0.9 },
    { k: 'move', len: 1.45 },
    { w: 'dawn', len: 0.9 },
    { k: 'booking', len: 2.75 },
  ];
  // titles drop in as the incoming bank parts over them; until about 0.75 of a bank they are fully covered
  const TTL_IN = 0.8;
  // an overflowing card starts scrolling its text 0.3 VH after it comes in, but never before the page has moved
  const capLead = (cap) => Math.max(0.02, cap[0] + 0.3);
  const WIPE = {
    up: { axis: 'y', dir: 1, light: '#fffaf0', shade: '#dfe3e2', far: ['#cfe6f1', '#b6d8ea'], seed: 31 },
    down: { axis: 'y', dir: -1, light: '#fffaf0', shade: '#dfe3e2', far: ['#dceff6', '#c0e0ee'], seed: 47 },
    pass: { axis: 'x', dir: -1, light: '#fffaf0', seed: 59 },
    dusk: { axis: 'x', dir: -1, light: '#fde4da', shade: '#e3aab3', far: ['#f3b9b0', '#a888b4'], seed: 71 },
    dawn: { axis: 'x', dir: -1, light: '#fff3e2', shade: '#f4c9a8', far: ['#ffdcc0', '#f2b892'], seed: 83 },
  };
  // the side passes pick up the colour of the sky they fly into
  const wipeCfg = (name, to, i) => {
    const c = { ...WIPE[name], seed: WIPE[name].seed + i * 101 };
    if (name === 'pass') {
      c.far = [mix(SKY[to][2], '#fff6ea', 0.5), mix(SKY[to][5], '#fff6ea', 0.62)];
      c.shade = mix(SKY[to][1], '#f7ecdf', 0.74);
    }
    return c;
  };
  const DEPTH = [2.9, 3.3, 3.8, 4.5, 5.4];
  const STREAK_D = 7.2;
  const NUM_D = 4.1;

  // one layer of a cloud bank: cumulus lobes with smaller bumps on their outer side, cel shading from above,
  // highlights on the near layers, and lumps inside the wall that is on screen at the cut
  function bankSVG(W, H, axis, i, cfg) {
    const A = axis === 'x' ? W : H;
    const T = axis === 'x' ? H : W;
    const len = A * 2.4;
    const r = rng(cfg.seed + i * 17);
    const front = i >= 3;
    const ow = i >= 2 ? 4 : 0;
    const light = i < 2 ? cfg.far[i] : cfg.light;
    const shade = i < 2 ? mix(cfg.far[i], cfg.shade, 0.55) : cfg.shade;
    const P = [];
    const IN = [];
    const lobe = (list, u, v, R, ang, hi) => {
      list.push([u, v, R, hi]);
      const n = 2 + Math.floor(r() * 3);
      for (let j = 0; j < n; j++) {
        const a = ang + (r() * 2 - 1) * 1.2;
        const q = R * (0.3 + r() * 0.24);
        list.push([u + Math.cos(a) * (R - q * 0.3), v + Math.sin(a) * (R - q * 0.3), q, hi && q > T * 0.045]);
      }
    };
    if (!front) {
      for (const [u0, ang] of [
        [A * 0.7, Math.PI],
        [A * 1.7, 0],
      ]) {
        for (let v = -0.15 * T; v < 1.15 * T; ) {
          const R = T * (0.08 + r() * 0.085);
          lobe(P, u0 + Math.cos(ang) * R * (0.05 + r() * 0.25), v, R, ang, i === 2);
          v += R * (1.15 + r() * 0.45);
        }
        for (let k = 0; k < 4; k++) lobe(P, u0 + Math.cos(ang) * A * (0.08 + r() * 0.2), r() * T, T * (0.03 + r() * 0.035), ang, false);
      }
      if (i === 2) for (let k = 0; k < 11; k++) lobe(IN, A * (0.78 + r() * 0.84), T * (0.04 + r() * 0.92), T * (0.06 + r() * 0.07), -Math.PI / 2, true);
    } else {
      for (let k = 0; k < 8; k++) {
        const top = k % 2 === (i === 3 ? 1 : 0);
        const R = T * (0.1 + r() * 0.09);
        const u = A * (0.32 + (k / 7) * 1.76 + (r() - 0.5) * 0.1);
        const v = top ? -R * (0.15 + r() * 0.35) : T + R * (0.15 + r() * 0.35);
        lobe(P, u, v, R, top ? Math.PI / 2 : -Math.PI / 2, true);
        lobe(P, u + R * (0.7 + r() * 0.4), v + (top ? -1 : 1) * R * 0.25, R * 0.75, top ? Math.PI / 2 : -Math.PI / 2, true);
      }
    }
    const XY = (u, v) => (axis === 'x' ? [u, v] : [v, u]);
    const core = (e, f) => (front ? '' : axis === 'x' ? rect(A * 0.7 - e, -40 - e, A + 2 * e, T + 80 + 2 * e, f) : rect(-40 - e, A * 0.7 - e, T + 80 + 2 * e, A + 2 * e, f));
    const put = (list, dr, f, sh = 0, withCore = true) => {
      let o = withCore ? core(dr, f) : '';
      for (const [u, v, R] of list) {
        const [x, y] = XY(u, v);
        o += circ(x - R * sh * 0.05, y - R * sh * 0.17, R * (sh ? 0.85 : 1) + dr, f);
      }
      return o;
    };
    const glints = (list) => {
      let o = '';
      for (const [u, v, R, hi] of list) {
        if (!hi) continue;
        const [x0, y0] = XY(u, v);
        const x = x0 - R * 0.05;
        const y = y0 - R * 0.17;
        const q = R * 0.6;
        const [a0, a1] = [3.55, 4.25];
        o += `M${N(x + Math.cos(a0) * q)} ${N(y + Math.sin(a0) * q)}A${N(q)} ${N(q)} 0 0 1 ${N(x + Math.cos(a1) * q)} ${N(y + Math.sin(a1) * q)}`;
      }
      return o ? `<path d="${o}" fill="none" stroke="#fff" stroke-width="${N(clamp(T * 0.009, 3, 8))}" stroke-linecap="round" opacity=".9"/>` : '';
    };
    let s = '';
    if (ow) s += put(P, ow, INK);
    s += put(P, 0, shade);
    s += put(P, 0, light, 1);
    if (IN.length) s += put(IN, 0, shade, 0, false) + put(IN, 0, light, 1, false) + glints(IN);
    if (i >= 2) s += glints(P);
    const [w, h] = axis === 'x' ? [len, T] : [T, len];
    return { html: `<svg class="art" width="${N(w)}" height="${N(h)}" viewBox="0 0 ${N(w)} ${N(h)}">${s}</svg>`, A, front };
  }
  // wind streaks that rush past in front of everything, round head first, kept off the middle band
  function streakSVG(W, H, axis, sd, seed) {
    const A = axis === 'x' ? W : H;
    const T = axis === 'x' ? H : W;
    const r = rng(seed);
    const XY = (u, v) => (axis === 'x' ? `${N(u)} ${N(v)}` : `${N(v)} ${N(u)}`);
    let d = '';
    for (let k = 0; k < 14; k++) {
      const v = T * (k % 2 ? 0.04 + r() * 0.26 : 0.7 + r() * 0.26);
      const l = A * (0.1 + r() * 0.26) * sd;
      const u = A * (0.6 + r() * 1.2);
      const t = clamp(T * 0.006, 3, 6) * (1 + r() * 1.2);
      d += `M${XY(u, v - t)}L${XY(u + l, v)}L${XY(u, v + t)}A${N(t)} ${N(t)} 0 0 ${(sd > 0) === (axis === 'x') ? 1 : 0} ${XY(u, v - t)}Z`;
    }
    const [w, h] = axis === 'x' ? [A * 2.4, T] : [T, A * 2.4];
    return `<svg class="art" width="${N(w)}" height="${N(h)}" viewBox="0 0 ${N(w)} ${N(h)}"><path d="${d}" fill="#fff" opacity=".8"/></svg>`;
  }
  // the next stop's number, big, among the clouds
  function numSVG(n, fs, face) {
    const w = fs * 0.62;
    const h = fs * 1.02;
    const t = `font-family="Bricolage Display, sans-serif" font-weight="800" style="font-stretch:75%" text-anchor="middle"`;
    return {
      w,
      h,
      html: `<svg class="art" width="${N(w)}" height="${N(h)}" viewBox="0 0 ${N(w)} ${N(h)}"><g transform="rotate(-4 ${N(w / 2)} ${N(h / 2)})">${text(w / 2, fs * 0.13, 'STOP', N(fs * 0.085), INK, ' text-anchor="middle" font-family="IBM Plex Mono, monospace" font-weight="500" letter-spacing="4"')}${text(w / 2 + fs * 0.045, fs * 0.92, n, N(fs), INK, ` ${t}`)}${text(w / 2, fs * 0.87, n, N(fs), face, ` ${t} stroke="${INK}" stroke-width="${N(fs * 0.022)}" paint-order="stroke" stroke-linejoin="round"`)}</g></svg>`,
    };
  }

  function layout() {
    const W = stage.clientWidth;
    const Hs = stage.clientHeight;
    const desk = W >= 560 && W / (svh() || innerHeight) >= 1.15;
    const H = layoutH(desk);
    const VH = innerHeight;
    const chrome = desk ? null : portChrome();
    if (!desk) root.style.setProperty('--port-svh', `${N(H)}px`);
    else root.style.removeProperty('--port-svh');
    root.classList.toggle('m-desk', desk);
    root.classList.toggle('m-port', !desk);
    const U = desk ? Math.min(W / 1280, H / 800) : Math.min(W / 430, H / 860);
    const G = { W, H, Hs, VH, desk, port: !desk, U, m: desk ? Math.max(24, W * 0.04) : 20 };

    // captions first: the scenes are composed around them. The porthole rides the top-right corner of each card on
    // phones and of the boarding pass on desktops, so that corner is kept clear of text.
    const hudH = desk ? clamp(H * 0.25, Math.min(140, H * 0.3), 236) : clamp(H * 0.115, 82, 112);
    const hudW = hudH * (200 / 240);
    root.style.setProperty('--hfw', `${N(desk ? hudW * 0.38 - 16 : hudW - 14)}px`);
    root.style.setProperty('--hfh', `${N(desk ? hudH * 0.38 - 12 : hudH * 0.48 - 12)}px`);
    const ovs = {};
    const cap = {};
    for (const [i, cp] of copies.entries()) {
      cp.classList.remove('ov', 'sh');
      cp.style.top = '0px';
      cp.style.height = '';
      cins[i].style.transform = '';
      cins[i].style.paddingRight = '';
      cins[i]._sh = -1;
      const hero = desk && cp.dataset.k === 'hero';
      const hw = clamp(W * 0.38, 280, 470);
      cp.style.left = hero ? `${N(Math.min(W * 0.56, W - hw - hudW * 0.38 - 10))}px` : '';
      cp.style.width = hero ? `${N(hw)}px` : '';
    }
    for (const [i, cp] of copies.entries()) {
      const k = cp.dataset.k;
      let h = cins[i].offsetHeight;
      let top;
      let maxH;
      if (k === 'hero') {
        if (desk) {
          maxH = H * 0.5;
          top = H * 0.4;
          // on a short desktop the boarding pass rises as far as the title and the porthole allow; if its text still
          // has to scroll, the column keeps clear of the porthole on its corner
          if (h > maxH) {
            const rise = (hh) => Math.max(H * 0.34, 62 + hudH * 0.62, H - 12 - hh);
            top = rise(h);
            if (h > H - 12 - top) {
              cins[i].style.paddingRight = `${N(hudW * 0.52 + 3)}px`;
              h = cins[i].offsetHeight;
              top = rise(h);
            }
            maxH = H - 12 - top;
          }
        } else {
          const box = mobileCardBox(h, true, H, chrome);
          top = box.top;
          maxH = box.maxH;
        }
      } else if (!desk) {
        const box = mobileCardBox(h, false, H, chrome);
        top = box.top;
        maxH = box.maxH;
      } else {
        maxH = H * 0.6;
        top = H * 0.95 - Math.min(h, maxH);
      }
      const bh = Math.min(h, maxH);
      cp.style.top = `${N(top)}px`;
      cp.style.height = `${N(bh)}px`;
      const ov = h > maxH ? Math.ceil(h - maxH + 30) : 0;
      cp.classList.toggle('ov', ov > 0);
      ovs[k] = ov;
      cap[k] = { top, h: bh, left: cp.offsetLeft, right: cp.offsetLeft + cp.offsetWidth };
    }

    // timeline in px; each scene runs on its own clock τ (viewport heights) from the start of its incoming bank
    const segs = [];
    const S = {};
    let y = 0;
    for (const [j, p] of PLAN.entries()) {
      if (p.k) {
        const extra = (ovs[p.k] || 0) / VH;
        const prev = PLAN[j - 1];
        const next = PLAN[j + 1];
        const wIn = prev ? prev.len : 0;
        const wOut = next ? next.len : 0;
        S[p.k] = { k: p.k, t0: y - wIn * VH, wIn, body: [wIn, wIn + p.len + extra], wOut, end: wIn + p.len + extra + wOut, extra };
        segs.push({ t: 's', k: p.k, start: y, len: (p.len + extra) * VH });
        y += (p.len + extra) * VH;
      } else {
        segs.push({ t: 'w', w: p.w, from: PLAN[j - 1].k, to: PLAN[j + 1].k, start: y, len: p.len * VH });
        y += p.len * VH;
      }
    }
    spacer.style.height = `${N(Math.max(0, y + VH - H))}px`;

    // composition per scene
    const titleTop = desk ? H * 0.065 : Math.max(56, H * 0.075);
    const titleBox = (k, capH) => {
      if (desk) return { x: G.m, y: titleTop, w: W * 0.6, h: Math.max(H * 0.14, cap[k].top - titleTop - H * 0.05) };
      return { x: 20, y: titleTop, w: W - 40, h: Math.min(H * 0.22, cap[k].top - titleTop - (capH ?? H * 0.3)) };
    };
    const SC = {};
    const TT = {
      hero: { lines: desk ? ['Luis Matute'] : ['Luis', 'Matute'], color: INK, ext: C.tomato },
      plan: { lines: desk ? ['Six stops.'] : ['Six', 'stops.'], color: INK, ext: C.tomato },
      aa: { lines: ['American', 'Airlines'], color: INK, ext: '#2a7aa3' },
      sandals: { lines: ['Sandals', 'Resorts'], color: INK, ext: '#c54b3d' },
      bsc: { lines: ['BSc'], color: INK, ext: '#13675f' },
      fluky: { lines: ['Fluky', 'Factory'], color: INK, ext: '#9e2a18' },
      move: { lines: desk ? ['The move.'] : ['The', 'move.'], color: '#fff4e2', ext: '#120d2c' },
      booking: { lines: desk ? ['Booking.com'] : ['Booking', '.com'], color: INK, ext: '#c8603f' },
    };
    const titles = {};
    for (const k of Object.keys(TT)) {
      let box;
      if (k === 'hero') box = desk ? { x: G.m, y: titleTop, w: W * 0.86, h: H * 0.27 } : { x: 20, y: titleTop, w: W - 40, h: H * 0.24 };
      else box = titleBox(k);
      const short = !desk && H < 720;
      const cap0 =
        { bsc: desk ? H * 0.34 : short ? H * 0.16 : H * 0.2, hero: desk ? H * 0.25 : short ? H * 0.11 : H * 0.13 }[
          k
        ] ?? (desk ? H * 0.2 : short ? H * 0.09 : H * 0.11);
      const fs = fitTitle(TT[k].lines, box, cap0);
      const t = titleHTML(TT[k].lines, fs, TT[k].color, TT[k].ext);
      titles[k] = { ...t, x: box.x, y: box.y, fs };
    }

    // the free zone for art on phones lies between the title and the card
    const zone = (k) => {
      const t = titles[k];
      const top = t.y + t.h + t.fs * 0.12 + H * 0.01;
      const bot = cap[k].top - H * 0.015;
      return { top, bot, h: bot - top };
    };
    const hudDesk = { x: W - hudW - Math.max(16, W * 0.025), y: H - hudH - Math.max(16, H * 0.035), h: hudH };
    // while a tall card scrolls its text, the porthole rises off the card so it never covers a line
    const lift = (k, tau) => (STATIC || !ovs[k] ? 0 : Math.min(hudH * 0.5, clamp((tau - capLead(SC[k].cap)) * VH, 0, ovs[k])));
    const hudPort = (k, tau = 0) => ({ x: W - hudW - 8, y: cap[k].top - hudH * 0.52 - lift(k, tau), h: hudH });
    // the contact card rises over the last scene. On desktops it stops short of the porthole; on phones it picks the
    // porthole up on its corner (dock, in track px) and keeps its text out from under it
    const arr = $('.arr', contact);
    arr.style.maxWidth = desk ? `${N(hudDesk.x - 12 - arr.getBoundingClientRect().left)}px` : '';
    let dock = Infinity;
    if (!desk) {
      const ac = getComputedStyle(arr);
      const ar = arr.getBoundingClientRect();
      root.style.setProperty('--cfw', `${N(ar.right - parseFloat(ac.borderRightWidth) - parseFloat(ac.paddingRight) - (W - hudW - 17))}px`);
      root.style.setProperty('--cfh', `${N(hudH * 0.48 + 6 - parseFloat(ac.borderTopWidth) - parseFloat(ac.paddingTop))}px`);
      dock = arr.getBoundingClientRect().top - track.getBoundingClientRect().top - hudH * 0.52;
    }
    const tyEnd = document.documentElement.scrollHeight - innerHeight - (track.getBoundingClientRect().top + scrollY);

    // ---- hero: runway under the name, take-off, climb
    {
      const k = 'hero';
      const t = titles[k];
      const gy = desk ? H * 0.845 : Math.min(cap.hero.top - H * 0.06, t.y + t.h + H * 0.25);
      const rwT = gy - 6 * U;
      const rwB = gy + (desk ? 34 : 26) * U;
      const wy = (rwT + rwB) / 2 + 3 * U;
      const pw = desk ? Math.min(W * 0.44, H * 0.78) : W * 0.82;
      const ps = pw / PLANE.w;
      const x0 = desk ? W * 0.29 : W * 0.5;
      const xL = desk ? W * 0.64 : W * 0.6;
      const Lr = desk ? W * 1.0 : W * 1.1;
      const tR = [0.35, 1.55];
      const v = (2 * Lr) / (tR[1] - tR[0]);
      const gyPlane = wy - (PLANE.foot - PLANE.cy) * ps;
      const climbTop = desk ? H * 0.4 : (t.y + t.h + gy) / 2;
      // rotation pivots on the main gear while the wheels are still down
      const pivot = (r) => {
        const a = (r * Math.PI) / 180;
        const [dx, dy] = [258 - PLANE.cx, PLANE.foot - PLANE.cy];
        return (dx * Math.sin(a) + dy * Math.cos(a) - dy) * ps;
      };
      const pose = (tau) => {
        let x;
        let yy = gyPlane;
        const lo = tR[1];
        if (tau < lo) x = x0 + Lr * ramp(tR[0], lo, tau) ** 2;
        else x = x0 + Lr + v * (tau - lo);
        const r = -10 * smooth(1.28, 1.55, tau) - 3 * smooth(1.55, 1.9, tau) + 6 * smooth(2.1, 2.9, tau);
        if (tau <= lo) yy -= pivot(r);
        else {
          const a = tau - lo;
          const vy = v * 0.26;
          yy = gyPlane - pivot(-10) * (1 - smooth(lo, lo + 0.25, tau)) - (a < 0.3 ? (vy * a * a) / 0.6 : vy * 0.15 + vy * (a - 0.3));
          if (tau > 2.05) yy -= (tau - 2.05) ** 2 * H * 1.1;
        }
        return { x, y: yy, r };
      };
      const cam = (tau) => {
        const p = pose(tau);
        const tx = lerp(x0, xL, smooth(tR[0], 1.4, tau)) - (xL - (desk ? W * 0.58 : W * 0.5)) * smooth(1.6, 2.3, tau);
        const px = Math.max(0, p.x - tx);
        const ty = lerp(gyPlane, climbTop, smooth(1.62, 2.2, tau));
        const py = Math.min(0, p.y - ty);
        return { x: px, y: py, d: 0 };
      };
      const pyMax = -(cam(3.2).y || 0);
      const pxMax = cam(3.2).x;
      const L = [];
      // the sky above the hero's bands slides down into view as the plane climbs
      const skyH = H * 1.7;
      const HIGH = ['#3c8cc2', '#4797ca', '#54a3d1', '#62aed7', '#73b9dc', '#87c4df', '#a0cfdf', '#bcd9d6', '#d8dfc6', '#eedcae', '#f5c98a', '#f4b46a'];
      L.push(LY(Infinity, 0, -skyH, W, Hs, bands(0, W, -skyH, 0, HIGH, 1) + bands(0, W, 0, gy, SKY.hero) + rect(0, gy, W, Hs - gy + 2, SKY.hero[7]), { name: 'sky', wc: true }));
      const sx = desk ? W * 0.87 : W * 0.84;
      const sy = desk ? H * 0.19 : t.y + t.h * 0.3;
      const sr = desk ? H * 0.075 : W * 0.085;
      L.push(raysLayer(sx, sy, Math.max(W, H) * 0.9, 14, '#fff6dc', 0.2, 'rays'));
      L.push(LY(Infinity, sx - sr * 2, sy - sr * 2, sx + sr * 2, sy + sr * 2, sunDisc(sx, sy, sr, '#fff3d0', ['#fde3a6', '#fdd88f']), { name: 'sun' }));
      // far mountains and pine hills
      const ridge = (z, base, amp, seed, step) => {
        const r = rng(seed);
        const x1 = W + pxMax / z + W * 0.3;
        const p = [[-0.3 * W, base + 40]];
        for (let x = -0.3 * W; x <= x1; x += step * U) p.push([x, base - amp * (0.35 + r() * 0.65)]);
        p.push([x1, base + 40]);
        return { d: curve(p), x1 };
      };
      {
        const a = ridge(8, gy - 0.06 * H, H * 0.2, 3, 150);
        const b = ridge(5.5, gy - 0.025 * H, H * 0.13, 5, 115);
        L.push(LY(8, -0.3 * W, gy - 0.32 * H, a.x1, Hs + pyMax / 8 + 10, `${path(`${a.d}Z`, '#e3a07f')}${rect(-0.3 * W, gy, a.x1 + 0.3 * W, Hs + pyMax, '#e3a07f')}`));
        L.push(LY(5.5, -0.3 * W, gy - 0.2 * H, b.x1, Hs + pyMax / 5.5 + 10, `${path(`${b.d}Z`, '#cf8268')}${rect(-0.3 * W, gy, b.x1 + 0.3 * W, Hs + pyMax, '#cf8268')}`));
        const r = rng(9);
        const x1 = W + pxMax / 3.4 + W * 0.3;
        let pn = '';
        const hp = [[-0.3 * W, gy + 30]];
        for (let x = -0.3 * W; x <= x1; x += 90 * U) hp.push([x, gy - H * (0.035 + r() * 0.045)]);
        hp.push([x1, gy + 30]);
        for (let x = -0.28 * W; x < x1; x += (22 + r() * 28) * U) pn += pine(x, gy - H * (0.025 + r() * 0.03), (40 + r() * 46) * U, r() < 0.5 ? '#3f7d50' : '#4a8b59');
        L.push(LY(3.4, -0.3 * W, gy - 0.2 * H, x1, Hs + pyMax / 3.4 + 10, `${pn}${path(`${curve(hp)}Z`, '#5c9a5e')}${rect(-0.3 * W, gy, x1 + 0.3 * W, Hs + pyMax, '#5c9a5e')}`));
      }
      L.push({ z: 4.4, title: true });
      // airport: tower, hangar, windsock and palms
      {
        const s = U * (desk ? 1 : 0.8);
        const tw = `${rect(-16, -170, 32, 170, C.cream, ol(4))}${rect(-16, -120, 32, 8, C.tomato)}${rect(-16, -120, 32, 8, 'none', ol(3))}${path('M-34 -170L34 -170L26 -214L-26 -214Z', C.tomato, ol(4))}${rect(-24, -206, 48, 22, '#2d5560', ol(3))}${line('M-8 -206V-184M8 -206V-184', C.cream, 2)}${rect(-30, -224, 60, 10, '#eadfc8', ol(3.5))}${line('M0 -224V-252', INK, 3)}${anim('bcn', circ(0, -254, 5, '#ff3b2b', ol(2)))}`;
        const hg = `${path('M0 0L0 -60Q90 -130 180 -60L180 0Z', C.lagoon, ol(4))}${path('M20 -76Q90 -118 160 -76', 'none', ol(3, '#16625e'))}${rect(18, -46, 144, 46, '#2d5560', ol(3))}${line('M54 -46V0M90 -46V0M126 -46V0', '#204a54', 3)}`;
        const ws = `${line('M0 0V-110', INK, 4)}${anim('sway', `${path('M2 -108L58 -100L58 -84L2 -78Z', C.tomato, ol(3))}${rect(20, -104, 12, 22, C.cream)}`, 'transform-origin:2px -94px;--t:1.2s;--a:-6deg;--b:5deg')}`;
        const tX = desk ? W * 0.535 : W * 0.93;
        const hX = desk ? W * 0.6 : -W * 0.02;
        const inner = at(tX, gy, s, tw) + at(hX, gy, s, hg) + at(desk ? W * 0.82 : W * 0.97, gy, s, ws) + palm(desk ? W * 0.035 : W * 0.04, gy + 2, 150 * s, 18 * s, { tw: 11 * s }) + palm(desk ? W * 0.93 : W * 1.3, gy + 2, 132 * s, -20 * s, { tw: 10 * s, t: 5.1 }) + palm(W * 1.25, gy + 2, 140 * s, -16 * s, { tw: 10 * s });
        L.push(LY(1.8, -0.2 * W, gy - 280 * s, W * 1.5, gy + 10, inner));
      }
      // runway: a repeating strip
      {
        const per = Math.max(120, W * 0.18);
        let s = rect(-per, rwT, W + 3 * per, rwB - rwT, '#5e4c45') + rect(-per, rwB, W + 3 * per, Hs + pyMax - rwB + 40, '#7fb35f');
        s += rect(-per, rwT + 2 * U, W + 3 * per, 2.5 * U, '#d9c8ae') + rect(-per, rwB - 5 * U, W + 3 * per, 2.5 * U, '#d9c8ae');
        s += rect(-per, rwB, W + 3 * per, 6 * U, '#6a9a50');
        for (let x = -per; x < W + 2 * per; x += per) {
          s += rect(x + per * 0.2, (rwT + rwB) / 2 - 1 * U, per * 0.4, 4 * U, C.cream);
          s += circ(x + per * 0.05, rwB + 1 * U, 4.2 * U, '#ffd36b', ol(2));
          s += anim('tw', circ(x + per * 0.55, rwT - 1, 3.4 * U, '#ffd36b', ol(1.6)), `--t:.7s;animation-delay:${N((x / per) * 0.12)}s`);
        }
        L.push(LY(1, -per, rwT - 10, W + 2 * per, Hs + pyMax + 40, s, { wrap: per }));
        let th = '';
        for (let i = 0; i < 6; i++) th += rect(x0 - pw * 0.66 + i * 12 * U, rwT + 6 * U, 7 * U, rwB - rwT - 12 * U, C.cream);
        L.push(LY(1, x0 - pw, rwT, x0, rwB, th));
      }
      // foreground: grass and flowering bushes
      {
        const per = Math.max(300, W * 0.46);
        const r = rng(4);
        const base = rwB + 16 * U;
        let s = rect(-per, base, W + 3 * per, Hs + pyMax * 1.7, '#6da653');
        for (let x = -per; x < W + 2 * per; x += per) {
          for (let i = 0; i < 6; i++) {
            const gx = x + (i / 6) * per + r() * 24;
            const gh = (16 + r() * 22) * U;
            s += path(`M${N(gx)} ${N(base + 2)}l${N(-6 * U)} ${N(-gh)}l${N(10 * U)} ${N(gh * 0.6)}l${N(6 * U)} ${N(-gh * 0.9)}l${N(4 * U)} ${N(gh * 0.9)}Z`, i % 2 ? '#4f8f45' : '#5b9b4c', ol(2.5));
          }
          s += bush(x + per * 0.34, base + 8 * U, U * 1.05, C.tomato, 1);
          s += bush(x + per * 0.8, base + 10 * U, U * 0.85, '#f39ab0', 2);
        }
        L.push(LY(0.62, -per, rwB - 30 * U, W + 2 * per, Hs + pyMax * 1.7 + 40, s, { wrap: per, front: true }));
      }
      // clouds that come down into view on the climb
      {
        let s = '';
        const r = rng(12);
        for (let i = 0; i < 8; i++) {
          const w = (150 + r() * 160) * U;
          s += cloud(-0.2 * W + r() * 1.4 * W, -H * (0.12 + i * 0.12 + r() * 0.06), w, { t: i, ow: 3.5 });
        }
        L.push(LY(2, -0.4 * W, -1.4 * H, 1.6 * W, 0, s, { name: 'cl' }));
      }
      SC[k] = {
        layers: L,
        bg: SKY.hero[7],
        foot: '#6da653',
        title: titles[k],
        ttl: [-1, 1.25],
        cap: [-1, 0.42 + S[k].extra],
        plane: (tau) => {
          const p = pose(tau);
          const c = cam(tau);
          return { x: p.x - c.x, y: p.y - c.y, s: ps, r: p.r, o: 1, gear: smooth(1.72, 2.0, tau), roll: (p.x - x0) / ps, fly: tau > 1.5, ground: tau < 1.55 };
        },
        cam,
        update: (tau, ly) => {
          ly.sky.el.style.transform = `translate3d(0,${N(skyH * smooth(1.8, 2.95, tau))}px,0)`;
          const o = N((1 - smooth(1.9, 2.6, tau)) * 100) / 100;
          ly.sun.el.style.opacity = o;
          ly.rays.el.style.opacity = o;
        },
        look: (tau) => {
          const p = SC.hero.plane(tau);
          return tau < 0.35 ? [p.x + pw * 0.1, p.y] : [p.x + pw * 0.3, p.y - H * 0.1];
        },
        expr: (tau) => (tau > 1.3 && tau < 1.95 ? 'wow' : ''),
        hud: (tau) => {
          const home = desk ? hudDesk : hudPort('aa');
          const corner = desk ? { x: cap.hero.right - hudW * 0.62, y: cap.hero.top - hudH * 0.62, h: hudH } : hudPort('hero', tau);
          const e = smooth(0.38 + S[k].extra, 1.0 + S[k].extra, tau);
          return { x: lerp(corner.x, home.x, e), y: lerp(corner.y, home.y, e), h: hudH };
        },
        hint: (tau) => tau < 0.4 + S[k].extra,
      };
    }

    // ---- flight plan: the camera pulls far back over the Atlantic
    {
      const k = 'plan';
      const t = titles[k];
      const z = zone(k);
      const R = desk ? Math.min(H * 0.42, (W - cap.plan.right) * 0.42) : Math.min(W * 0.42, z.h * 0.46);
      const gc = desk ? { x: cap.plan.right + (W - cap.plan.right) * 0.5, y: H * 0.54 } : { x: W * 0.5, y: z.top + z.h * 0.5 };
      const sc = R / 500;
      const hon = { x: gc.x + (GLOBE.hon[0] - 500) * sc, y: gc.y + (GLOBE.hon[1] - 500) * sc };
      const S0 = 7.5;
      const L = [];
      let deco = rect(0, 0, W, Hs, '#fbf0d9');
      deco += circ(gc.x, gc.y, R * 1.32, '#f6e4c3') + circ(gc.x, gc.y, R * 1.15, '#f2dcb4');
      const rr0 = rng(21);
      for (let i = 0; i < 14; i++) {
        const sx = rr0() * W;
        const sy = rr0() * Hs;
        const sz = (5 + rr0() * 8) * U;
        deco += anim('tw', path(`M${N(sx)} ${N(sy - sz)}Q${N(sx)} ${N(sy)} ${N(sx + sz)} ${N(sy)}Q${N(sx)} ${N(sy)} ${N(sx)} ${N(sy + sz)}Q${N(sx)} ${N(sy)} ${N(sx - sz)} ${N(sy)}Q${N(sx)} ${N(sy)} ${N(sx)} ${N(sy - sz)}Z`, C.marigold), `--t:${2 + rr0() * 2}s;animation-delay:${-rr0() * 2}s`);
      }
      L.push(LY(Infinity, 0, 0, W, Hs, deco));
      // the globe draws in screen space with strokes that keep their width while it zooms
      let dash = '';
      const rt = GLOBE.route;
      for (let i = 1; i < rt.length; i += 1) {
        const [a, b] = [rt[i - 1], rt[i]];
        dash += `<path class="rd" d="M${N(a[0])} ${N(a[1])}L${N(lerp(a[0], b[0], 0.5))} ${N(lerp(a[1], b[1], 0.5))}" fill="none" stroke="${C.tomato}" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" style="opacity:0"/>`;
      }
      // labels sit beside the pins on desktops; on phones they go below and above so they stay on screen
      const lw = (label) => label.length * 10.4 + 16;
      const pin = (p, label, side, t = 0) => {
        if (!label) return `<g class="pin" data-x="${N(p[0])}" data-y="${N(p[1])}" data-t="${N(t * 1000) / 1000}">${circ(0, 0, 6.5, C.marigold, ol(3))}${circ(0, 0, 2.2, INK)}</g>`;
        const w = lw(label);
        const [bx, by, tx, anchor] = { l: [-14 - w, -15, -22, 'end'], r: [14, -15, 22, 'start'], b: [-w / 2, 22, 0, 'middle'], t: [-w / 2, -46, 0, 'middle'] }[side];
        return `<g class="pin" data-x="${N(p[0])}" data-y="${N(p[1])}" data-t="${N(t * 1000) / 1000}">${circ(0, 0, 9, C.marigold, ol(3.5))}${circ(0, 0, 3, INK)}${rr(bx, by, w, 30, 15, C.paper, ol(3))}${text(tx, by + 21, label, 17, INK, ` font-family="Bricolage, sans-serif" font-weight="700" text-anchor="${anchor}"`)}</g>`;
      };
      const gsvg = `<svg class="art" width="${N(W)}" height="${N(Hs)}" viewBox="0 0 ${N(W)} ${N(Hs)}"><defs><clipPath id="gclip"><circle cx="500" cy="500" r="500"/></clipPath></defs><g class="gz">${circ(500, 500, 500, '#2f86a8')}<g clip-path="url(#gclip)">${circ(500, 500, 430, '#3592b3')}<path d="${GLOBE.land}" fill="#8cc06a" stroke="${INK}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${path('M-20 -20H1020V1020H-20ZM-110 420A530 530 0 1 0 950 420A530 530 0 1 0 -110 420Z', '#163a52', ' fill-rule="evenodd" opacity=".26"')}${path('M-20 -20H1020V1020H-20ZM10 540A530 530 0 1 0 1070 540A530 530 0 1 0 10 540Z', '#fffaf0', ' fill-rule="evenodd" opacity=".3"')}${ell(318, 250, 120, 62, '#fffaf0', ' opacity=".14" transform="rotate(-36 318 250)"')}</g>${circ(500, 500, 500, 'none', ' stroke="#2b1b14" stroke-width="4.5" vector-effect="non-scaling-stroke"')}${dash}</g></svg>`;
      L.push(LY(Infinity, 0, 0, W, Hs, '', { html: gsvg, name: 'globe' }));
      // a few clouds around the globe
      let cl = '';
      const rc = rng(5);
      const cq = U * (desk ? 1 : 0.7);
      for (let i = 0; i < 5; i++) {
        const a = -0.6 + i * 1.3 + rc() * 0.5;
        const cx = gc.x + Math.cos(a) * R * (desk ? 1.08 : 1.14) - 60 * cq;
        const cy = gc.y + Math.sin(a) * R * 0.98;
        cl += anim('drift', cloud(cx, cy, (110 + rc() * 70) * cq, { t: i, ow: 3.5 }), `--t:${12 + rc() * 6}s;--dx:${N(18 + rc() * 14)}px`);
      }
      L.push(LY(Infinity, 0, 0, W, Hs, cl, { name: 'gcl' }));
      L.push({ z: Infinity, title: true });
      // on narrow desktops the labels move below and inside so they clear the card and the screen edge
      const ams = { x: gc.x + (GLOBE.ams[0] - 500) * sc };
      const hSide = desk && hon.x - 14 - lw('Honduras') > cap[k].right + 10 ? 'l' : 'b';
      const aSide = !desk ? 't' : ams.x + 14 + lw('Amsterdam') < W - 10 ? 'r' : 'l';
      L.push(LY(Infinity, 0, 0, W, Hs, '', { html: `<svg class="art" width="${N(W)}" height="${N(Hs)}" viewBox="0 0 ${N(W)} ${N(Hs)}">${pin(GLOBE.hon, 'Honduras', hSide)}${pin(GLOBE.mia, 'Miami', 'r', GLOBE.tMia)}${pin(GLOBE.mid, '', '', GLOBE.tMid)}${pin(GLOBE.ams, 'Amsterdam', aSide, 1)}<g class="ptop">${at(-60, -50, 1, planeTop())}</g></svg>`, name: 'pins' }));
      // the pull-back: zoom and the screen point that Honduras sits on
      const end = S[k].body[1];
      const view = (tau) => {
        const e = inOutCubic(ramp(0.3, 1.85, tau));
        const k2 = S0 ** (1 - e) * (1 + smooth(end + 0.1, end + 0.8, tau) * 1.6) * sc;
        const f = smooth(0.3, 1.6, tau);
        const hs = { x: lerp(W * 0.5, hon.x, f), y: lerp(H * 0.5, hon.y, f) };
        return { k2, hs, tx: hs.x - GLOBE.hon[0] * k2, ty: hs.y - GLOBE.hon[1] * k2 };
      };
      // the title drops in once the shrinking globe has cleared it (by as much as it will at rest), and the card follows
      const tb = [t.x, t.y, t.x + t.w + t.fs * 0.06, t.y + t.h + t.fs * 0.22];
      const gap = (tau) => {
        const { k2, tx, ty } = view(tau);
        const [cx, cy] = [tx + 500 * k2, ty + 500 * k2];
        return Math.hypot(cx - clamp(cx, tb[0], tb[2]), cy - clamp(cy, tb[1], tb[3])) - 500 * k2;
      };
      const need = Math.min(H * 0.02, gap(1.85) - 2);
      let tIn = 1.85;
      while (tIn > 0.75 && gap(tIn - 0.05) >= need) tIn -= 0.05;
      SC[k] = {
        layers: L,
        bg: '#fbf0d9',
        foot: '#fbf0d9',
        title: t,
        ttl: [tIn, end + 0.25],
        cap: [Math.max(1.45, tIn + 0.35), end + 0.2],
        plane: () => ({ x: W * 0.5, y: -H * 0.4, s: 0.1, r: 0, o: 0 }),
        cam: () => ({ x: 0, y: 0, d: 0 }),
        init: (ly) => {
          const g = ly.globe.el;
          ly.g = { gz: $('.gz', g), rd: $$('.rd', g), pins: $$('.pin', ly.pins.el), pt: $('.ptop', ly.pins.el) };
        },
        update: (tau, ly) => {
          const { k2, tx, ty } = view(tau);
          const s = k2 / sc;
          ly.g.gz.setAttribute('transform', `translate(${N(tx)} ${N(ty)}) scale(${N(k2 * 10000) / 10000})`);
          const rv = ramp(1.15, 2.0, tau);
          ly.g.rd.forEach((d, i) => {
            const o = i / ly.g.rd.length < rv ? 1 : 0;
            if (d._o !== o) {
              d._o = o;
              d.style.opacity = o;
            }
          });
          for (const p of ly.g.pins) {
            const px = tx + p.dataset.x * k2;
            const py = ty + p.dataset.y * k2;
            p.setAttribute('transform', `translate(${N(px)} ${N(py)})`);
            const pt = Number(p.dataset.t);
            p.style.opacity = pt ? N(ramp(pt - 0.06, pt, rv) * 100) / 100 : smooth(0.5, 0.8, tau);
          }
          const ic = Math.min(3.2, s ** 0.8) * U * (desk ? 0.5 : 0.42);
          const target = STOP_T[planHover] ?? 0;
          if (STATIC || root.classList.contains('paused')) planNow = target;
          else planNow += (target - planNow) * 0.22;
          if (Math.abs(target - planNow) > 0.003) kick();
          const pose = routePose(planNow);
          const px = tx + pose.x * k2;
          const py = ty + pose.y * k2;
          ly.g.pt.setAttribute('transform', `translate(${N(px)} ${N(py)}) rotate(${N(pose.deg)}) scale(${N(ic * 1000) / 1000})`);
          ly.gcl.el.style.opacity = N(smooth(1.0, 1.8, tau) * 100) / 100;
        },
        look: () => [gc.x, gc.y],
        expr: (tau) => (tau < 1.2 ? 'wow' : ''),
        hud: (tau) => (desk ? hudDesk : hudPort(k, tau)),
      };
    }

    // ---- the four stops at sea
    // each island is drawn in a 1000-wide box; ext is the drawn width and cx its middle
    const isleFor = (k) => {
      const { ext, cx } = STOPS[k];
      if (desk) {
        const left = cap[k].right - W * 0.01;
        const right = W - hudW - Math.max(16, W * 0.025) + hudW * 0.25;
        const s = Math.min((right - left) / ext, (H * 0.44) / 330);
        return { x: (left + right) / 2 - cx * s, y: G.hy + H * 0.11, s, cx };
      }
      const z = zone(k);
      const s = Math.min((W * 0.96) / ext, (z.h * 0.5) / 300);
      return { x: W * 0.5 - cx * s, y: Math.min(z.bot + H * 0.02, G.hy + H * 0.16), s, cx };
    };
    const STOPS = {
      aa: { island: isleAA, ext: 840, cx: 500, sunAt: (g) => (desk ? { x: W * 0.55, y: H * 0.15, r: H * 0.055 } : { x: W * 0.84, y: g.z.top + g.z.h * 0.08, r: W * 0.06 }), sunC: ['#fff8e0', '#d3eff7', '#bfe6f2'], rays: '#ffffff', cl1: '#e6f5fa', cl2: '#cbe9f3', wave: '#7fc0dc', seed: 41, gulls: true },
      sandals: { island: isleSandals, ext: 880, cx: 500, sunAt: (g) => ({ x: desk ? W * 0.62 : W * 0.72, y: g.hy - H * 0.01, r: desk ? H * 0.12 : W * 0.15 }), sunC: ['#fff1c7', '#fbc79d', '#fab88f'], rays: '#fff1c7', low: '#fff1c7', cl1: '#fbd2bd', cl2: '#f4b49c', wave: '#a3e3da', seed: 52, gulls: true },
      bsc: { island: isleBSc, ext: 870, cx: 498, sunAt: (g) => (desk ? { x: W * 0.5, y: H * 0.17, r: H * 0.05 } : { x: W * 0.84, y: g.z.top + g.z.h * 0.08, r: W * 0.055 }), sunC: ['#fff6d6', '#82d3c9', '#6dc9be'], rays: '#e9fff8', cl1: '#b9e6df', cl2: '#93d6cc', wave: '#5c9bc0', seed: 63, gulls: true },
      fluky: { island: isleFluky, ext: 930, cx: 525, sunAt: (g) => (desk ? { x: W * 0.5, y: H * 0.2, r: H * 0.07 } : { x: W * 0.24, y: g.hy - H * 0.005, r: W * 0.12 }), sunC: ['#ffe7b0', '#f4a07f', '#f0906f'], rays: '#ffd9a8', low: desk ? null : '#ffd9a8', cl1: '#f5b39b', cl2: '#e98f75', wave: '#3f9a92', seed: 74 },
    };
    for (const k of ['aa', 'sandals', 'bsc', 'fluky']) {
      const t = titles[k];
      const z = zone(k);
      G.hy = desk ? H * 0.6 : z.top + z.h * 0.4;
      G.z = z;
      G.isle = isleFor(k);
      const o = STOPS[k];
      const sa = o.sunAt(G);
      const isles = (() => {
        const r = rng(o.seed + 7);
        let s = '';
        const c = mix(SKY[k][6], SEA[k][0], 0.45);
        for (let i = 0; i < 4; i++) {
          const x = -0.3 * W + r() * 1.6 * W;
          const w = (80 + r() * 140) * U;
          const h = (14 + r() * 26) * U;
          s += path(`M${N(x)} ${N(G.hy + 2)}Q${N(x + w * 0.3)} ${N(G.hy - h)} ${N(x + w * 0.55)} ${N(G.hy - h * 0.8)}Q${N(x + w * 0.8)} ${N(G.hy - h * 0.5)} ${N(x + w)} ${N(G.hy + 2)}Z`, c);
        }
        return s;
      })();
      const L = seaScene(G, k, { island: o.island(k), sun: sunDisc(sa.x, sa.y, sa.r, o.sunC[0], o.sunC.slice(1)), sunAt: sa, rays: o.rays, low: o.low, cl1: o.cl1, cl2: o.cl2, wave: o.wave, seed: o.seed, isles, gulls: o.gulls });
      const hy = G.hy;
      const pw = desk ? Math.min(W * 0.25, H * 0.42) : W * 0.46;
      const ps = pw / PLANE.w;
      const pxy = desk ? { x: W * 0.74, y: H * 0.255 } : { x: W * 0.5, y: z.top + PLANE.h * ps * 0.42 };
      const S2 = S[k];
      const isle = G.isle;
      SC[k] = {
        layers: L,
        bg: SKY[k][7],
        foot: dk(SEA[k][3], 0.1),
        title: t,
        ttl: [S2.wIn * TTL_IN, S2.body[1] + 0.15],
        cap: [S2.wIn + 0.05, S2.body[1] - 0.04],
        plane: (tau) => {
          const u = tau / S2.end;
          return { x: pxy.x + (u - 0.5) * W * 0.06, y: pxy.y + Math.sin(u * 6) * H * 0.008, s: ps, r: -1.5, o: 1, gear: 1, fly: true };
        },
        cam: (tau) => ({ x: lerp(-0.12, 0.12, tau / S2.end) * W, y: (1 - smooth(0, S2.wIn + 0.3, tau)) * (k === 'aa' ? -0.25 : 0) * H, d: 0.3 * (1 - smooth(0, S2.wIn, tau)) + 0.26 * smooth(S2.body[1], S2.end, tau) }),
        look: () => [isle.x + 500 * isle.s, isle.y - 120 * isle.s],
        expr: () => '',
        hud: (tau) => (desk ? hudDesk : hudPort(k, tau)),
        hy,
      };
    }

    // ---- the move: night over the Atlantic
    {
      const k = 'move';
      const t = titles[k];
      const z = zone(k);
      const hy = desk ? H * 0.66 : z.top + z.h * 0.66;
      G.hy = hy;
      const L = [];
      let sky = bands(0, W, 0, hy, SKY.move) + bands(0, W, hy, Hs, SEA.move, 1.3);
      const r = rng(88);
      let stars = '';
      for (let i = 0; i < 60; i++) stars += anim('tw', circ(r() * W, r() * hy * 0.95, (0.8 + r() * 1.8) * Math.max(U, 0.6), '#fff4e2'), `--t:${1.6 + r() * 2.5}s;animation-delay:${-r() * 3}s`);
      for (let i = 0; i < 7; i++) {
        const sx = r() * W;
        const sy = r() * hy * 0.8;
        const q = (6 + r() * 7) * Math.max(U, 0.6);
        stars += anim('tw', path(`M${N(sx)} ${N(sy - q)}Q${N(sx)} ${N(sy)} ${N(sx + q)} ${N(sy)}Q${N(sx)} ${N(sy)} ${N(sx)} ${N(sy + q)}Q${N(sx)} ${N(sy)} ${N(sx - q)} ${N(sy)}Q${N(sx)} ${N(sy)} ${N(sx)} ${N(sy - q)}Z`, '#fff4e2'), `--t:${2.2 + r() * 2}s;animation-delay:${-r() * 3}s`);
      }
      // two shooting stars on long, offset loops
      for (const [sx, sy, d] of [
        [0.62, 0.1, 0],
        [0.34, 0.2, -4.2],
      ])
        stars += `<g class="shoot" style="animation-delay:${d}s">${line(`M${N(sx * W)} ${N(sy * H)}l${N(70 * U)} ${N(-32 * U)}`, '#fff4e2', 2.4, ' opacity=".6"')}${circ(sx * W, sy * H, 2.6 * Math.max(U, 0.7), '#fff4e2')}</g>`;
      const mx = desk ? W * 0.82 : W * 0.92;
      const my = desk ? H * 0.2 : z.top + z.h * 0.14;
      const mr = desk ? H * 0.065 : W * 0.08;
      const moon = `<mask id="moonm"><rect x="${N(mx - mr)}" y="${N(my - mr)}" width="${N(2 * mr)}" height="${N(2 * mr)}" fill="#fff"/>${circ(mx + mr * 0.44, my - mr * 0.3, mr * 0.84, '#000')}</mask><g mask="url(#moonm)">${circ(mx, my, mr, '#fff1cf')}${circ(mx - mr * 0.52, my + mr * 0.12, mr * 0.16, '#efdcae')}${circ(mx - mr * 0.3, my + mr * 0.52, mr * 0.1, '#efdcae')}${circ(mx - mr * 0.66, my - mr * 0.3, mr * 0.08, '#efdcae')}</g>`;
      sky += stars + circ(mx, my, mr * 1.9, '#352b62') + circ(mx, my, mr * 1.45, '#3e3470') + moon;
      let path0 = '';
      for (let i = 0; i < 12; i++) path0 += anim('shim', rect(mx - mr * (0.6 + r()), hy + 8 + i * (Hs - hy) / 13, mr * (0.6 + r() * 1.4), 3, '#fff1cf', ' opacity=".55"'), `--t:${1.8 + r()}s;animation-delay:${-r() * 2}s`);
      L.push(LY(Infinity, 0, 0, W, Hs, sky + path0));
      L.push(farClouds(G, 6, 0.3 * H, hy - 0.05 * H, 5, '#6a5ca0', '#4b3f7c', 97));
      // a ship on the horizon with its windows lit
      {
        const sx = desk ? W * 0.56 : W * 0.66;
        const q = U * (desk ? 0.8 : 0.62);
        const ship = `${path('M-80 0L80 0L66 18L-70 18Z', '#18143a')}${rect(-46, -22, 92, 22, '#231d4c')}${rect(-22, -40, 44, 18, '#231d4c')}${rect(8, -62, 12, 22, '#231d4c')}${[-36, -24, -12, 0, 12, 24].map((x) => rect(x, -14, 7, 6, '#ffd36b')).join('')}${rect(-14, -34, 6, 6, '#ffd36b')}${rect(0, -34, 6, 6, '#ffd36b')}${anim('bcn', circ(14, -66, 3.5, '#ff6b5c'))}`;
        L.push(LY(4.2, -0.4 * W, hy - 90 * U, 1.4 * W, hy + 20 * U, at(sx, hy + 6 * q, q, ship)));
      }
      L.push({ z: 3.2, title: true });
      // the lighthouse on its rock, sweeping its beam
      {
        const lh = desk ? W * 0.21 : W * 0.15;
        const q = U * (desk ? 1 : 0.8);
        const tower = `<g class="beam" style="transform-origin:0px -118px">${path('M0 -118L330 -168L330 -64Z', '#fff1cf', ' opacity=".2"')}</g>${path('M-70 6Q-60 -20 -30 -24Q-6 -34 22 -26Q58 -20 74 6Z', '#1b1640', ol(3, '#120d2c'))}${poly([[-20, -22], [20, -22], [13, -104], [-13, -104]], '#fff1df', ol(3, '#120d2c'))}${poly([[-18.4, -40], [18.4, -40], [16.8, -58], [-16.8, -58]], C.tomato)}${poly([[-15.2, -76], [15.2, -76], [13.7, -94], [-13.7, -94]], C.tomato)}${rr(-19, -110, 38, 8, 3, '#2a2450', ol(2.5, '#120d2c'))}${rect(-11, -130, 22, 20, '#ffd36b', ol(2.5, '#120d2c'))}${path('M-15 -130L0 -146L15 -130Z', C.tomato, ol(2.5, '#120d2c'))}${anim('tw', circ(0, -120, 22, '#ffd36b', ' opacity=".28"'), '--t:1.8s')}`;
        L.push(LY(2.8, -0.4 * W, hy - 200 * q, 1.4 * W, hy + 30 * q, at(lh, hy + 4 * q, q, tower)));
      }
      // moonlit clouds drifting at the plane's height
      {
        const r2 = rng(19);
        let s = '';
        for (let i = 0; i < 3; i++) {
          const w = (170 + r2() * 110) * U;
          s += anim('drift', cloud((desk ? 0.44 : 0.1) * W + i * (desk ? 0.24 : 0.36) * W + r2() * 40 * U, (desk ? 0.4 : 0.36) * H + r2() * 0.12 * H, w, { t: i, ow: 3.5, light: '#8b7cc4', shade: '#5a4c92' }), `--t:${16 + r2() * 6}s;--dx:${N(20 + r2() * 20)}px`);
        }
        L.push(LY(2.2, -0.4 * W, 0, 1.4 * W, Hs, s.replaceAll(INK, '#1b1640')));
      }
      const pw = desk ? Math.min(W * 0.27, H * 0.46) : W * 0.56;
      const ps = pw / PLANE.w;
      const pxy = desk ? { x: lerp(cap[k].right, W, 0.46), y: lerp(t.y + t.h, hy, 0.5) } : { x: W * 0.46, y: z.top + z.h * 0.3 };
      const S2 = S[k];
      SC[k] = {
        layers: L,
        bg: SKY.move[7],
        foot: SEA.move[3],
        title: t,
        ttl: [S2.wIn * TTL_IN, S2.body[1] + 0.15],
        cap: [S2.wIn + 0.05, S2.body[1] - 0.04],
        plane: (tau) => {
          const u = tau / S2.end;
          return { x: pxy.x + (u - 0.5) * W * 0.08, y: pxy.y, s: ps, r: -1, o: 1, gear: 1, fly: true, night: true };
        },
        cam: (tau) => ({ x: lerp(-0.1, 0.1, tau / S2.end) * W, y: 0, d: 0 }),
        look: () => [W * 0.3, H * 0.7],
        expr: (tau) => (tau > S2.wIn + 0.25 && tau < S2.body[1] - 0.1 ? 'sleep' : ''),
        hud: (tau) => (desk ? hudDesk : hudPort(k, tau)),
      };
    }

    // ---- Amsterdam: the canal houses draw in, the plane lands, the stamp comes down
    {
      const k = 'booking';
      const t = titles[k];
      const z = zone(k);
      const S2 = S[k];
      const hy = desk ? H * 0.6 : z.top + z.h * 0.42;
      const L = [];
      const sx = desk ? W * 0.84 : W * 0.82;
      // where "Landed." sits once the contact section has scrolled up over this scene
      const cb = contact.getBoundingClientRect();
      const hb = $('#h-contact').getBoundingClientRect();
      const head = { right: hb.right - cb.left + 6, bottom: hb.bottom - cb.top + 6 };
      L.push(LY(Infinity, 0, 0, W, Hs, bands(0, W, 0, hy, SKY.booking) + rect(0, hy, W, Hs - hy, '#9fc77c')));
      L.push(LY(14, sx - H * 0.3, hy - H * 0.4, sx + H * 0.3, hy + H * 0.2, sunDisc(sx, hy - H * 0.02, H * 0.09, '#fff3d0', ['#fcd2a8', '#fbc79a']), { name: 'sun' }));
      // tulip fields and a windmill
      {
        const cols = [C.tomato, C.marigold, '#f39ab0', C.cream, C.tomato, '#f39ab0'];
        let s = '';
        const fb = hy + (desk ? 0.05 : 0.06) * H;
        for (let i = 0; i < 6; i++) {
          const y0 = lerp(hy, fb, i / 6);
          const y1 = lerp(hy, fb, (i + 1) / 6);
          s += rect(-0.4 * W, y0, 1.8 * W, y1 - y0 + 0.5, i % 2 ? '#7eb35c' : cols[i]);
        }
        // the left mill's sails (220 units above its base, 97 across) stay clear of the title and the contact heading:
        // on phones the mill shrinks to fit under them, and on short desktops it stands to the right of the heading
        const room = hy + 2 - Math.max(t.y + t.h + t.fs * 0.1, head.bottom) - 6;
        const ms = desk ? U * 0.9 : Math.min(U * 0.9, room / 220);
        const mx = !desk ? W * 0.1 : room < 220 * ms ? head.right + 12 + 97 * ms : W * 0.12;
        if (ms > U * 0.3) s += windmill(mx, hy + 2, ms);
        s += windmill(W * 0.95, hy + 1, U * 0.6);
        L.push(LY(4, -0.4 * W, hy - 140 * U, 1.4 * W, fb + 2, s));
      }
      L.push({ z: 3.2, title: true });
      // houses
      const hs = desk ? Math.min(1, (H * 0.36) / 380) * Math.max(0.8, W / 1600) : Math.min(0.62, (z.h * 0.42) / 330);
      const base = hy + (desk ? 0.17 : 0.14) * H;
      const kinds = ['step', 'bell', 'neck', 'tri', 'step', 'neck', 'bell', 'tri', 'step'];
      const colsH = ['#d9553a', '#2c7f7a', '#f0b13d', '#f6e7c8', '#5a3f6b', '#5d9a52', '#b5523b', '#f2a08a', '#3f6f96'];
      let fills = brickPattern();
      let lines = '';
      const narrow = W < 600;
      const tag = (hh, sw) => {
        fills += `<g class="hf" style="opacity:0">${hh.fill}</g>`;
        lines += `<path class="hl" d="${hh.line}" fill="none" stroke="${INK}" stroke-width="${N(sw)}" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
      };
      let top = base - 460 * hs;
      if (narrow) {
        // phones: a fixed row of five wider canal houses whose gables scale with them (design/skyline/SPEC.md)
        const row = [
          ['neck', '#f0b13d', 1.62, false],
          ['step', '#d9553a', 1.86, true],
          ['bell', '#2c7f7a', 1.7, false],
          ['step', '#5a3f6b', 1.78, false],
          ['neck', '#3f6f96', 1.66, true],
        ];
        const w = W * 0.212;
        const gap = Math.max(2, W * 0.006);
        const sw = Math.max(2.5, W * 0.0075);
        let x = -W * 0.03;
        row.forEach(([kind, c, r, beam], i) => {
          const brick = i === 1 || i === 3;
          tag(house(x, base, w, w * r, kind, c, { id: i, brick, trim: brick, beam }, w / 130), sw);
          x += w + gap;
        });
        top = base - 2 * w;
      } else {
        let x = desk ? cap[k].right - W * 0.05 : -W * 0.08;
        let hi = 0;
        while (x < W * 1.15) {
          const w = (110 + ((hi * 37) % 50)) * hs;
          const h = (300 + ((hi * 53) % 90)) * hs;
          const brick = hi === 1 || hi === 4 || hi === 7;
          tag(house(x, base, w, h, kinds[hi % 9], colsH[hi % 9], { id: hi, brick, trim: brick, beam: hi === 1 || hi === 4 }), Math.max(2.5, 4 * hs));
          x += w + 4 * hs;
          hi++;
        }
      }
      L.push(LY(1.6, -0.3 * W, top, 1.3 * W, base + 4, fills + lines, { name: 'houses' }));
      // canal with reflections and a boat, then the runway in front
      {
        const cy0 = base;
        const cy1 = base + (desk ? 0.09 : 0.08) * H;
        const rwT = cy1 + 8 * U;
        let s = rect(-0.4 * W, cy0, 1.8 * W, 10 * U, '#8e7f74') + rect(-0.4 * W, cy0 + 10 * U, 1.8 * W, cy1 - cy0 - 10 * U, '#2f6f7d');
        const r = rng(3);
        for (let i = 0; i < 18; i++) s += anim('shim', rect(-0.3 * W + i * 0.09 * W, cy0 + 16 * U + r() * (cy1 - cy0 - 24 * U), (20 + r() * 40) * U, 3, '#9cd0d6', ' opacity=".7"'), `--t:${2 + r() * 2}s;animation-delay:${-r() * 3}s`);
        s += anim('bob', at(desk ? W * 0.62 : W * 0.6, cy0 + (cy1 - cy0) * 0.62, U * (desk ? 0.9 : 0.7), `${path('M-70 0L70 0L58 18L-58 18Z', '#7a4b2a', ol(4))}${rr(-40, -22, 70, 22, 8, C.lagoon, ol(4))}${rect(-30, -16, 14, 10, C.glass)}${rect(-8, -16, 14, 10, C.glass)}`), '--t:2.8s');
        for (let i = 0; i < 3; i++) s += at((desk ? W * 0.3 : W * 0.18) + i * 46 * U, cy0 + 2, U * 0.8, `${circ(-16, -14, 13, 'none', ol(3.5))}${circ(16, -14, 13, 'none', ol(3.5))}${path('M-16 -14L-4 -32L12 -32L16 -14M-4 -32L2 -14L12 -32M-8 -38H2', 'none', ol(3.5, i % 2 ? C.tomato : C.lagoon))}`);
        s += rect(-0.4 * W, cy1, 1.8 * W, rwT - cy1, '#8e7f74') + rect(-0.4 * W, rwT, 1.8 * W, Hs - rwT + 20, '#5e4c45');
        for (let i = 0; i < 16; i++) s += rect(-0.3 * W + i * 0.12 * W, rwT + (Hs - rwT) * 0.3, 0.05 * W, 4 * U, C.cream);
        L.push(LY(1, -0.4 * W, cy0 - 40 * U, 1.4 * W, Hs + 20, s, { name: 'ground' }));
        G.rwT = rwT;
      }
      // tulips in the foreground corners
      {
        let s = '';
        const r = rng(14);
        for (let i = 0; i < 14; i++) {
          const fx = (i < 7 ? -0.05 * W + i * 26 * U : W * 0.86 + (i - 7) * 26 * U) + r() * 8;
          const fy = Hs + 4;
          const fh = (50 + r() * 50) * U;
          const c = [C.tomato, C.marigold, '#f39ab0'][i % 3];
          s += anim('sway', `${line(`M${N(fx)} ${N(fy)}Q${N(fx + 6)} ${N(fy - fh * 0.5)} ${N(fx)} ${N(fy - fh)}`, '#3f7d35', 4)}${path(`M${N(fx - 10 * U)} ${N(fy - fh)}Q${N(fx - 11 * U)} ${N(fy - fh - 22 * U)} ${N(fx - 4 * U)} ${N(fy - fh - 16 * U)}L${N(fx)} ${N(fy - fh - 24 * U)}L${N(fx + 4 * U)} ${N(fy - fh - 16 * U)}Q${N(fx + 11 * U)} ${N(fy - fh - 22 * U)} ${N(fx + 10 * U)} ${N(fy - fh)}Q${N(fx)} ${N(fy - fh + 8 * U)} ${N(fx - 10 * U)} ${N(fy - fh)}Z`, c, ol(3))}`, `transform-origin:${N(fx)}px ${N(fy)}px;--t:${2.4 + r()}s;--a:-4deg;--b:4deg`);
        }
        L.push(LY(0.7, -0.4 * W, Hs - 200 * U, 1.4 * W, Hs + 10, s, { front: true }));
      }
      // the stamp
      const stR = desk ? Math.min(H * 0.17, W * 0.1) : Math.min(W * 0.2, (W - head.right - 24) / 2);
      const stC = desk ? { x: W * 0.74, y: H * 0.3 } : { x: Math.max(W * 0.72, head.right + 8 + stR), y: z.top + z.h * 0.34 };
      if (!desk) {
        // the ring (104 units) lands clear of the porthole below it, wherever the cards have lifted that to
        const pr = { x: W - hudW - 8, y: STATIC ? cap[k].top - hudH * 0.52 : Math.min(cap[k].top - hudH * 0.52 - Math.min(hudH * 0.5, ovs[k] || 0), dock - tyEnd) };
        const dx = Math.max(0, pr.x - stC.x);
        const clear = stR * 1.04 + 8;
        if (dx < clear) stC.y = Math.min(stC.y, pr.y - Math.sqrt(clear ** 2 - dx ** 2));
      }
      L.push(LY(Infinity, stC.x - stR * 1.3, stC.y - stR * 1.3, stC.x + stR * 1.3, stC.y + stR * 1.3, '', { html: `<svg class="art" width="${N(stR * 2.6)}" height="${N(stR * 2.6)}" viewBox="-130 -130 260 260">${stampSVG()}</svg>`, name: 'stamp', front: true }));
      const pw = desk ? Math.min(W * 0.3, H * 0.5) : W * 0.6;
      const ps = pw / PLANE.w;
      const gyPlane = G.rwT + (Hs - G.rwT) * 0.32 - (PLANE.foot - PLANE.cy) * ps;
      const tdT = S2.wIn + 1.85;
      const landX = desk ? lerp(cap[k].right, W, 0.42) : W * 0.5;
      SC[k] = {
        layers: L,
        bg: SKY.booking[7],
        foot: '#5e4c45',
        title: t,
        ttl: [S2.wIn * TTL_IN, tdT + 0.25],
        cap: [S2.wIn + 0.25, tdT + 0.2],
        plane: (tau) => {
          const a = ramp(S2.wIn * 0.2, tdT, tau);
          const e = 1 - (1 - a) ** 2;
          // in portrait the contact card rises over the runway, so the plane taxis off before it gets there
          const off = desk ? 0 : ramp(S2.body[1] + 0.1, S2.body[1] + 0.7, tau) ** 2 * W * 1.3;
          const x = lerp(desk ? W * 0.32 : W * 0.3, landX, e) + Math.max(0, tau - tdT) * W * 0.05 + off;
          const y0 = desk ? H * 0.2 : z.top;
          const yy = lerp(y0, gyPlane, a ** 1.6);
          const flare = smooth(tdT - 0.4, tdT, tau) * (1 - smooth(tdT, tdT + 0.3, tau));
          return { x, y: yy, s: ps, r: 4 - 3 * flare * 2 + smooth(tdT, tdT + 0.2, tau) * -1, o: 1, gear: 0, fly: tau < tdT, ground: tau >= tdT, roll: tau >= tdT ? (tau - tdT) * 900 : 0, touch: tdT };
        },
        cam: (tau) => ({ x: lerp(-0.06, 0.06, ramp(0, S2.end, tau)) * W, y: (1 - smooth(0, S2.wIn + 0.4, tau)) * -0.2 * H, d: 0 }),
        init: (ly) => {
          ly.h = { f: $$('.hf', ly.houses.el), l: $$('.hl', ly.houses.el) };
        },
        update: (tau, ly) => {
          const n = ly.h.l.length;
          ly.h.l.forEach((p, i) => {
            const a = S2.wIn + 0.1 + (i / n) * 0.7;
            const v = N((1 - smooth(a, a + 0.7, tau)) * 1000) / 1000;
            if (p._v !== v) {
              p._v = v;
              p.style.strokeDashoffset = v;
            }
            const f = N(smooth(a + 0.45, a + 0.85, tau) * 100) / 100;
            if (ly.h.f[i]._v !== f) {
              ly.h.f[i]._v = f;
              ly.h.f[i].style.opacity = f;
            }
          });
          ly.sun.el.style.transform = `translate3d(0,${N(H * 0.12 * (1 - smooth(0, 2.2, tau)))}px,0)`;
          const sa = ramp(S2.body[1] - 0.5, S2.body[1] - 0.1, tau);
          const sv = sa <= 0 ? 0 : sa;
          const sc2 = sv ? lerp(2.6, 1, outBack(sv)) : 2.6;
          ly.stamp.el.style.opacity = sv ? 1 : 0;
          ly.stamp.el.style.transform = `translate(${N(stR * 1.3)}px,${N(stR * 1.3)}px) rotate(${N(lerp(-26, -9, outCubic(sv)))}deg) scale(${N(sc2 * 1000) / 1000}) translate(${N(-stR * 1.3)}px,${N(-stR * 1.3)}px)`;
        },
        look: (tau) => (tau > S2.body[1] - 0.5 ? [stC.x, stC.y] : [W * 0.5, base]),
        expr: (tau) => (tau > S2.body[1] - 0.15 ? 'wink' : tau > tdT - 0.1 && tau < tdT + 0.35 ? 'wow' : ''),
        hud: (tau) => (desk ? hudDesk : hudPort(k, tau)),
      };
    }

    // DOM
    stage.innerHTML = '';
    const back = html('<div class="grp" style="z-index:1"></div>');
    const wipeB = html('<div class="wipe" style="z-index:2"></div>');
    const planeEl = html(planeHTML('m'));
    const front = html('<div class="grp" style="z-index:4"></div>');
    const wipeF = html('<div class="wipe" style="z-index:5"></div>');
    stage.append(back, wipeB, planeEl, front, wipeF, html(grainHTML()));
    const scenes = {};
    for (const [k, sc] of Object.entries(SC)) {
      const b = html('<div class="sc off"></div>');
      const f = html('<div class="sc off"></div>');
      b.style.background = sc.bg;
      const ly = {};
      const list = [];
      for (const l of sc.layers) {
        let el;
        if (l.title) {
          el = html(`<div class="ly wc" style="left:${N(sc.title.x)}px;top:${N(sc.title.y)}px;width:${N(sc.title.w)}px;height:${N(sc.title.h)}px">${sc.title.html}</div>`);
          l.x0 = sc.title.x;
          l.y0 = sc.title.y;
          ly.title = { el, ttl: $('.ttl', el) };
        } else {
          el = html(`<div class="ly${l.wc || (l.z !== Infinity && l.z < 2.5) ? ' wc' : ''}" style="left:${N(l.x0)}px;top:${N(l.y0)}px;width:${N(l.w)}px;height:${N(l.h)}px">${l.html ?? svgBox(l.x0, l.y0, l.w, l.h, l.inner)}</div>`);
        }
        (l.front ? f : b).appendChild(el);
        const rec = { el, z: l.z, x0: l.x0, y0: l.y0, wrap: l.wrap, tf: '' };
        if (l.name) ly[l.name] = rec;
        list.push(rec);
      }
      back.appendChild(b);
      front.appendChild(f);
      scenes[k] = { ...sc, b, f, ly, list, S: S[k], on: false };
      sc.init?.(ly);
    }
    // cloud banks: five depths, wind streaks and the next stop's number, one set per pass
    const NUMS = { aa: ['1', '#3d9ad0'], sandals: ['2', '#ef6f5a'], bsc: ['3', '#22a093'], fluky: ['4', C.tomato], move: ['5', '#7563bd'], booking: ['6', '#f2913f'] };
    const wsegs = segs.filter((s) => s.t === 'w');
    for (const [j, sg] of wsegs.entries()) {
      const cfg = wipeCfg(sg.w, sg.to, j);
      const A = cfg.axis === 'x' ? W : Hs;
      const els = [];
      const set = DEPTH.map((D, i) => {
        const bk = bankSVG(W, Hs, cfg.axis, i, cfg);
        const el = html(`<div class="wl">${bk.html}</div>`);
        (bk.front ? wipeF : wipeB).appendChild(el);
        els.push(el);
        return { el, D };
      });
      let num = null;
      if (NUMS[sg.to]) {
        const n = numSVG(NUMS[sg.to][0], Math.min(Hs * 0.56, W * 0.85), NUMS[sg.to][1]);
        num = { ...n, el: html(`<div class="wl">${n.html}</div>`) };
        wipeB.appendChild(num.el);
        els.push(num.el);
      }
      const streak = html(`<div class="wl">${streakSVG(W, Hs, cfg.axis, -cfg.dir, cfg.seed + 5)}</div>`);
      wipeF.appendChild(streak);
      els.push(streak);
      sg.bank = { cfg, A, set, num, streak, els, vis: false };
    }
    LAY = { W, H, Hs, VH, desk, chrome, segs, wsegs, S, scenes, planeEl, pb: $('.pb', planeEl), wh: $$('.wh', planeEl), gM: $('.gM', planeEl), gN: $('.gN', planeEl), top: track.getBoundingClientRect().top + scrollY, hudW, hudH, cap, dock };
    st.vis = null;
    st.act = '';
    bindTinies();
    if (QA) window.__lm = { moments: moments(), layout: LAY };
    placeGlobeDock();
  }

  const planeHTML = (id, cls = '', style = '') => `<div class="plane${cls}" style="z-index:3;width:${PLANE.w}px;height:${PLANE.h}px${style}"><div class="pb"><div class="tb"><svg class="art" width="${PLANE.w}" height="${PLANE.h}" viewBox="0 0 ${PLANE.w} ${PLANE.h}">${planeSVG(id)}</svg></div></div></div>`;
  const planeCls = (p) => `${p.fly ? ' fly' : ''}${p.ground ? ' grd' : ''}${p.night ? ' night' : ''}${p.turb ? ' turb' : ''}`;
  const grainHTML = () => `<div class="grain" style="z-index:6;background-image:url(${grainURL()});background-size:180px"></div>`;
  function grainURL() {
    if (grainURL.u) return grainURL.u;
    const c = document.createElement('canvas');
    c.width = c.height = 180;
    const x = c.getContext('2d');
    const d = x.createImageData(180, 180);
    const r = rng(99);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = r() < 0.5 ? 255 : 120 + r() * 60;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = r() < 0.35 ? 46 : 0;
    }
    x.putImageData(d, 0, 0);
    grainURL.u = c.toDataURL();
    return grainURL.u;
  }

  function moments() {
    const top = track.getBoundingClientRect().top + scrollY;
    const VH = LAY.VH;
    const m = {};
    const at2 = (k, tau) => Math.round(top + LAY.S[k].t0 + tau * VH);
    m.hero = 0;
    m.roll = at2('hero', 1.0);
    m.liftoff = at2('hero', 1.62);
    m.climb = at2('hero', 2.35);
    const wseg = LAY.segs.filter((s) => s.t === 'w');
    m.up = Math.round(top + wseg[0].start + wseg[0].len * 0.5);
    m.globe = at2('plan', LAY.S.plan.wIn + 0.45);
    m.plan = at2('plan', LAY.S.plan.body[0] + 1.5);
    for (const k of ['aa', 'sandals', 'bsc', 'fluky', 'move']) m[k] = at2(k, LAY.S[k].body[0] + 0.45);
    wseg.forEach((s, i) => {
      if (i > 0) m[`bank-${i}`] = Math.round(top + s.start + s.len * (i % 2 ? 0.36 : 0.62));
    });
    for (const k of ['aa', 'sandals', 'fluky']) if (LAY.S[k].extra) m[`end-${k}`] = at2(k, LAY.S[k].body[1] - 0.06);
    const b = LAY.S.booking;
    m.approach = at2('booking', b.wIn + 0.7);
    m.booking = at2('booking', b.wIn + 1.45);
    m.touchdown = at2('booking', b.wIn + 2.0);
    m.stamp = Math.round(top + b.t0 + b.body[1] * VH - 2);
    m.contact = Math.round(contact.getBoundingClientRect().top + scrollY);
    return m;
  }

  const css = (m) => `matrix(${N(m[0] * 1000) / 1000},${N(m[1] * 1000) / 1000},${N(m[2] * 1000) / 1000},${N(m[3] * 1000) / 1000},${N(m[4])},${N(m[5])})`;

  function segAt(y) {
    let s = LAY.segs[0];
    for (const sg of LAY.segs) if (y >= sg.start) s = sg;
    return s;
  }

  function showScene(k) {
    for (const [kk, sc] of Object.entries(LAY.scenes)) {
      const on = kk === k;
      if (on === sc.on) continue;
      sc.on = on;
      sc.b.classList.toggle('off', !on);
      sc.f.classList.toggle('off', !on);
      for (const l of sc.list) l.tf = '';
      if (sc.ly.title) sc.ly.title.ttl.classList.remove('on');
    }
  }

  function placeLayers(sc, cam) {
    const { W, H } = LAY;
    for (const l of sc.list) {
      if (l.z === Infinity) continue;
      const k = l.z / (l.z - cam.d);
      let tx = (W / 2 - l.x0) * (1 - k) - (cam.x * k) / l.z;
      const ty = (H / 2 - l.y0) * (1 - k) - (cam.y * k) / l.z;
      if (l.wrap) tx = -(((cam.x / l.z) % l.wrap) + l.wrap) % l.wrap;
      const tf = `translate3d(${N(tx)}px,${N(ty)}px,0)${k !== 1 ? ` scale(${N(k * 1000) / 1000})` : ''}`;
      if (tf !== l.tf) {
        l.tf = tf;
        l.el.style.transform = tf;
      }
    }
  }

  function apply(y, now, ty = y) {
    const sg = segAt(y);
    const { VH, scenes } = LAY;
    let k;
    let w = -1;
    let other = null;
    if (sg.t === 's') k = sg.k;
    else {
      w = clamp((y - sg.start) / sg.len, 0, 1);
      k = w < 0.5 ? sg.from : sg.to;
      other = w < 0.5 ? sg.to : sg.from;
    }
    const sc = scenes[k];
    if (st.vis !== k) {
      st.vis = k;
      showScene(k);
    }
    const tau = (y - sc.S.t0) / VH;
    const cam = sc.cam(tau);
    placeLayers(sc, cam);
    sc.update?.(tau, sc.ly);

    // title and caption
    const tOn = tau >= sc.ttl[0] && tau <= sc.ttl[1];
    if (sc.ly.title && sc.ly.title.on !== tOn) {
      sc.ly.title.on = tOn;
      sc.ly.title.ttl.classList.toggle('on', tOn);
    }
    let act = tau >= sc.cap[0] && tau <= sc.cap[1] ? k : '';
    if (act && cardCoveredByContact(copies[byK[act]])) act = '';
    if (act !== st.act) {
      const prev = st.act;
      st.act = act;
      if (prev) {
        const ci = cins[byK[prev]];
        if (ci) {
          ci.style.transform = '';
          ci._sh = -1;
        }
        copies[byK[prev]]?.classList.remove('sh');
        const shutMore = closeOtherMores(act);
        if (shutMore.length) {
          queueMicrotask(() => {
            relayoutAfterMore();
            focusMoreToggleIfVisible(shutMore[0]);
          });
        }
      }
      for (const cp of copies) cp.classList.toggle('on', cp.dataset.k === act);
      if (act) setGlobeStop(act);
    }
    if (act) {
      const ov = sc.S.extra * VH;
      if (ov) {
        const lead = capLead(sc.cap);
        const sh = clamp((tau - lead) * VH, 0, ov);
        const ci = cins[byK[k]];
        if (ci._sh !== sh) {
          ci._sh = sh;
          ci.style.transform = sh ? `translate3d(0,${N(-sh)}px,0)` : '';
          copies[byK[k]].classList.toggle('sh', sh > 4);
        }
      }
    }

    // banks
    for (const ws of LAY.wsegs) {
      const B = ws.bank;
      if (ws !== sg) {
        if (B.vis) {
          B.vis = false;
          for (const el of B.els) el.style.display = '';
        }
        continue;
      }
      if (!B.vis) {
        B.vis = true;
        for (const el of B.els) el.style.display = 'block';
      }
      const { A, cfg } = B;
      const along = (el, pos, cross = 0) => {
        el.style.transform = cfg.axis === 'x' ? `translate3d(${N(pos)}px,${N(cross)}px,0)` : `translate3d(${N(cross)}px,${N(pos)}px,0)`;
      };
      const sd = -cfg.dir;
      for (const b of B.set) along(b.el, -0.7 * A + (0.5 - w) * b.D * A * sd);
      along(B.streak, -0.7 * A + (0.5 - w) * STREAK_D * A * sd);
      if (B.num) {
        // the number lingers mid-pass, then hurries out with the clouds
        const x = 0.5 - w;
        const g = x * (0.3 + 2.8 * x * x);
        const n = B.num;
        const [nA, nT, T] = cfg.axis === 'x' ? [n.w, n.h, LAY.Hs] : [n.h, n.w, LAY.W];
        along(n.el, (A - nA) / 2 + g * NUM_D * A * sd, (T - nT) / 2 + (cfg.axis === 'x' ? T * 0.1 : 0));
        n.el.style.opacity = N(smooth(0.2, 0.32, w) * (1 - smooth(0.68, 0.8, w)) * 100) / 100;
      }
    }

    // plane: blended across a bank between the two scenes' poses
    let p = sc.plane(tau);
    if (other) {
      const so = scenes[other];
      const q = so.plane((y - so.S.t0) / VH);
      const e = smooth(0.2, 0.8, w);
      const [A, B] = w < 0.5 ? [p, q] : [q, p];
      p = { ...p, x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), s: lerp(A.s, B.s, e), r: lerp(A.r, B.r, e), o: lerp(A.o, B.o, e) };
      if (sg.w === 'up') p.y -= LAY.H * 0.9 * smooth(0.15, 0.55, w);
      if (sg.w === 'down') p.y -= LAY.H * 0.9 * (1 - smooth(0.45, 0.85, w));
    }
    const turb = !!other && w > 0.18 && w < 0.82;
    p.turb = turb;
    setPlane(p, now);

    // Luis
    let hp = blendHud(sc, tau, other, y, w);
    // the contact card scrolls natively, so it carries the porthole by the raw scroll rather than the eased one
    if (LAY.dock - ty < hp.y) hp = { ...hp, y: LAY.dock - ty };
    const hint = !!sc.hint?.(tau);
    setHud(hp, hint);
    paintSeat(hint && p.o > 0, p);
    if (turb !== HUD.turb) {
      HUD.turb = turb;
      hud.classList.toggle('turb', turb);
    }
    rig.script = sc.look(tau);
    setExpr(other && w > 0.3 && w < 0.7 ? (sg.w === 'up' || sg.w === 'dawn' ? 'wow' : 'eek') : sc.expr(tau));
    kickRig();
  }

  function blendHud(sc, tau, other, y, w) {
    const a = sc.hud(tau);
    if (!other) return a;
    const so = LAY.scenes[other];
    const b = so.hud((y - so.S.t0) / LAY.VH);
    const e = smooth(0.25, 0.75, w);
    const [A, B] = w < 0.5 ? [a, b] : [b, a];
    return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), h: lerp(A.h, B.h, e) };
  }

  // the plane's pose as a matrix about its centre, with the scroll pitch and stretch on top
  function planeTf(p, pitch = 0, str = 0) {
    const r = ((p.r + pitch) * Math.PI) / 180;
    const sx = p.s * (1 + str);
    const sy = p.s * (1 - str * 0.8);
    const co = Math.cos(r);
    const si = Math.sin(r);
    const M = [co * sx, si * sx, -si * sy, co * sy, 0, 0];
    M[4] = p.x - (M[0] * PLANE.cx + M[2] * PLANE.cy);
    M[5] = p.y - (M[1] * PLANE.cx + M[3] * PLANE.cy);
    return css(M);
  }
  const gearTf = (g, a) => (g ? `rotate(${N(a * g)}deg) scale(${N(1 - 0.25 * g)})` : '');
  const PL = { tf: '', cls: '', o: -1, g: -1, wr: -1 };
  function setPlane(p, now) {
    const { planeEl, wh, gM, gN } = LAY;
    const o = N(clamp(p.o, 0, 1) * 100) / 100;
    if (o !== PL.o) {
      PL.o = o;
      planeEl.style.opacity = o;
      planeEl.style.visibility = o ? '' : 'hidden';
    }
    if (!o) return;
    const tf = planeTf(p, st.pitch, st.str);
    if (tf !== PL.tf) {
      PL.tf = tf;
      planeEl.style.transform = tf;
    }
    const cls = planeCls(p);
    if (cls !== PL.cls) {
      PL.cls = cls;
      planeEl.className = `plane${cls}`;
    }
    const g = N(p.gear * 100) / 100;
    if (g !== PL.g) {
      PL.g = g;
      gM.style.transform = gearTf(g, -96);
      gN.style.transform = gearTf(g, 100);
    }
    const wr = Math.round((p.roll || 0) / 14) % 360;
    if (wr !== PL.wr) {
      PL.wr = wr;
      for (const w of wh) w.style.transform = `rotate(${wr * 57.3}deg)`;
    }
    if (p.touch && !PL.touched && p.ground) {
      PL.touched = true;
      rig.bump = 9;
    }
    if (p.touch && !p.ground) PL.touched = false;
  }

  /* ---------- Luis rig ---------- */
  const rig = { x: 0, y: 0, vx: 0, vy: 0, bx: 0, by: 0, bvx: 0, bvy: 0, bump: 0, vb: 0, raf: 0, last: 0, script: null, ptr: { x: 0, y: 0, t: -1e9 }, glance: [0, 0], parts: null, expr: '', react: '', reactIx: -1, reactTimer: 0, savedExpr: '', reactFrame: null, box: null };
  const REACT_SEQ = ['wave', 'wink', 'wow', 'laugh', 'peace'];
  const REACT_LABEL = { wave: 'Luis waves.', wink: 'Luis winks.', wow: 'Luis looks surprised.', laugh: 'Luis laughs.', peace: 'Luis gives a peace sign.' };
  const NOTE = '<p class="note">Luis, window seat</p>';
  function rigParts(L) {
    const q = (s) => $(s, L);
    const P = { head: q('.lu-head'), face: q('.lu-face'), nose: q('.lu-nose'), beard: q('.lu-beard'), hair: q('.lu-hair'), ears: q('.lu-ears'), bun: q('.lu-bun'), torso: q('.lu-torso'), seat: q('.lu-seat') };
    P.head.style.transformOrigin = '100px 172px';
    P.torso.style.transformOrigin = '100px 240px';
    return P;
  }
  // where the head turns, from -1 to 1 on each axis, to face a point on screen from the window at box b
  function gaze(b, tgt) {
    const ex = b.x + ((b.h * 200) / 240) * 0.5;
    const ey = b.y + b.h * 0.47;
    return [Math.tanh((tgt[0] - ex) / Math.max(innerWidth * 0.3, b.h)), Math.tanh((tgt[1] - ey) / Math.max(innerHeight * 0.3, b.h))];
  }
  const SLEEP = [-0.35, 0.5];
  function poseLuis(P, x, y, o = {}) {
    const { bump = 0, bx = 0, by = 0, tilt = 0 } = o;
    P.head.style.transform = `translate(${N(x * 3)}px,${N(y * 2 + bump)}px) rotate(${N(x * 4.5 + tilt)}deg)`;
    P.face.style.transform = `translate(${N(x * 7.5)}px,${N(y * 4.5)}px)`;
    P.nose.style.transform = `translate(${N(x * 2.6)}px,${N(y * 1.2)}px)`;
    P.beard.style.transform = `translate(${N(x * 3.6)}px,${N(y * 2.2)}px)`;
    P.hair.style.transform = `translate(${N(x * 1.6)}px,${N(y * -0.8)}px)`;
    P.ears.style.transform = `translate(${N(-x * 3.4)}px,${N(y * 1)}px)`;
    P.bun.style.transform = `translate(${N(-x * 5 + bx * 6)}px,${N(-y * 2.4 + by * 4)}px)`;
    P.torso.style.transform = `translate(0,${N(bump * 0.5)}px) rotate(${N(x * 1.3)}deg)`;
    P.seat.style.transform = `translate(${N(-x * 2.2)}px,0)`;
  }
  function poseTiny(el, x, y, o = {}) {
    el.lmParts ||= rigParts(el);
    poseLuis(el.lmParts, x, y, o);
  }
  function setAvatarClass(el, cls) {
    if (el instanceof SVGElement) el.setAttribute('class', cls);
    else el.className = cls;
  }
  function paintAvatarClasses() {
    const patch = (el, tiny, base, react) => {
      if (!el) return;
      const face = react || base;
      const blink = el.classList.contains('blink');
      let cls = tiny ? 'tl' : 'lu';
      if (face) cls += ` ex-${face}`;
      if (react) cls += ' react';
      if (blink) cls += ' blink';
      setAvatarClass(el, cls);
    };
    const hudReact = rig.reactFrame ? '' : rig.react;
    patch(rig.svg, false, rig.expr, hudReact);
    for (const t of rig.tinies || []) patch(t, true, rig.expr, hudReact);
    // each static frame keeps its own stop's expression; only the frame that was pressed reacts
    for (const fr of $$('.frame')) {
      const lu = $('.lu', fr);
      if (!lu) continue;
      const r = rig.reactFrame === fr ? rig.react : '';
      patch(lu, false, lu.dataset.ex || '', r);
      for (const t of $$('.tl', fr)) patch(t, true, lu.dataset.ex || '', r);
    }
  }
  function bindTinies() {
    rig.tinies = $$('#stage .tl');
    paintAvatarClasses();
    for (const t of rig.tinies) poseTiny(t, rig.x, rig.y, { tilt: rig.expr === 'sleep' ? 9 : 0 });
  }
  function planeLocal(p, lx, ly, pitch = 0, str = 0) {
    const r = ((p.r + pitch) * Math.PI) / 180;
    const sx = p.s * (1 + str);
    const sy = p.s * (1 - str * 0.8);
    const co = Math.cos(r);
    const si = Math.sin(r);
    const dx = lx - PLANE.cx;
    const dy = ly - PLANE.cy;
    return [p.x + co * sx * dx - si * sy * dy, p.y + si * sx * dx + co * sy * dy];
  }
  /* ---------- seat line: one pen stroke from the label to Luis's window ---------- */
  const NOTE_TILT = (7 * Math.PI) / 180;
  const SEAT_HEAD = 8;
  const SEAT_STROKE = 8.6;
  const SEAT_HALO = SEAT_STROKE / 2;
  const SEAT_CLEAR = 8;
  const SEAT_NOTE_HALO = 4;
  const SEAT_EDGE = SEAT_HALO + SEAT_CLEAR;
  const SEAT_LOOP_MIN = SEAT_STROKE * 1.5;
  // loops along the stroke: where (share of the length), how big (share of the base radius), how far the loop travels (k * r), and its lean
  const SEAT_LOOPS = {
    1: [{ f: 0.48, r: 1.12, k: 1.15, tilt: 0.15 }],
    2: [
      { f: 0.32, r: 1.12, k: 1.15, tilt: 0.15 },
      { f: 0.64, r: 0.82, k: 1.02, tilt: -0.08 },
    ],
    3: [
      { f: 0.26, r: 1, k: 1.15, tilt: 0.16 },
      { f: 0.49, r: 0.66, k: 1, tilt: -0.1 },
      { f: 0.71, r: 1.22, k: 1.25, tilt: 0.12 },
    ],
  };
  // +1 puts a loop on the outside of the route's bend
  const SEAT_SIDES = [
    [1, 1, 1],
    [-1, -1, -1],
    [1, -1, 1],
    [-1, 1, -1],
  ];
  const SEAT_SIDE_COST = [0, 0.12, 0.22, 0.3];
  const SEAT_TURNS = [0, -0.45, 0.45, -0.9, 0.9, -1.35, 1.35];
  const SEAT_HANDLES = [
    [0.34, 0.34],
    [0.52, 0.48],
    [0.72, 0.6],
    [0.5, 0.28],
    [0.3, 0.56],
    [0.95, 0.7],
    [1.15, 0.5],
    [0.6, 0.95],
  ];
  const SEAT_SCALES = [1, 0.82, 0.66];
  // the loops can slide along the route together to dodge whatever is under them
  const SEAT_SHIFTS = [0, -0.06, 0.06];
  const inRect = (r, x, y) => x > r.left && x < r.right && y > r.top && y < r.bottom;
  const turnV = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const unitV = (x, y) => {
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };
  function shiftRect(r, x, y) {
    return { left: r.left - x, top: r.top - y, right: r.right - x, bottom: r.bottom - y, width: r.width, height: r.height };
  }
  // Centerline clearance: halo, shadow (down-right), and a little air so the ink never sits on the card.
  function padCard(rect) {
    return { left: rect.left - 20, top: rect.top - 18, right: rect.right + 28, bottom: rect.bottom + 26 };
  }
  function padTitle(rect, W, H) {
    const s = W > H ? 1.4 : 1;
    return {
      left: rect.left - 14 * s,
      top: rect.top - 12 * s,
      right: rect.right + 18 * s,
      bottom: rect.bottom + 16 * s,
    };
  }
  function padInk(rect, m = SEAT_HALO + SEAT_CLEAR) {
    return { left: rect.left - m, top: rect.top - m, right: rect.right + m, bottom: rect.bottom + m };
  }
  function seatTight(G) {
    const gap = G.pass && G.titleRaw ? G.pass.top - G.titleRaw.bottom : 80;
    return gap < SEAT_HALO * 2 + SEAT_CLEAR * 2 + 16;
  }
  function rectGap(x, y, r) {
    if (!r) return Infinity;
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    if (x > r.left && x < r.right && y > r.top && y < r.bottom) {
      return -Math.min(x - r.left, r.right - x, y - r.top, r.bottom - y);
    }
    return Math.hypot(dx, dy);
  }
  // The label is turned -7deg, so its bounding box is looser than the words. This rebuilds the turned box.
  function noteFrame(nb) {
    const c = Math.cos(NOTE_TILT);
    const s = Math.sin(NOTE_TILT);
    const w = (nb.width * c - nb.height * s) / (c * c - s * s);
    const h = (nb.height * c - nb.width * s) / (c * c - s * s);
    const cx = (nb.left + nb.right) / 2;
    const cy = (nb.top + nb.bottom) / 2;
    const U = [c, -s];
    const V = [s, c];
    return {
      w,
      h,
      U,
      V,
      at: (a, b) => [cx + U[0] * a + V[0] * b, cy + U[1] * a + V[1] * b],
      has: (x, y) => Math.abs((x - cx) * U[0] + (y - cy) * U[1]) < w / 2 + 2 && Math.abs((x - cx) * V[0] + (y - cy) * V[1]) < h / 2 + 2,
    };
  }
  // the pen leaves the label from the end of the words, or from under or over them
  function seatStarts(F) {
    const back = [-F.U[0], -F.U[1]];
    const up = [-F.V[0], -F.V[1]];
    const out = [{ p: F.at(-F.w / 2 - 8, 3), t: back, cost: 0 }];
    for (const a of [-0.3, 0.02, 0.3]) {
      out.push({ p: F.at(a * F.w, F.h / 2 + 7), t: F.V, cost: 0.15 + a * 0.3 });
      out.push({ p: F.at(a * F.w, -F.h / 2 - 7), t: up, cost: 0.35 + a * 0.3 });
    }
    return out;
  }
  function bezAt(c, t) {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const d = 3 * u * t * t;
    const e = t * t * t;
    return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
  }
  function bezDir(c, t) {
    const u = 1 - t;
    return unitV(
      3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]),
      3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]),
    );
  }
  const SPINE_N = 120;
  // cost of one pixel of ink over something it should keep off, per unit of weight
  const SOFT_PX = 0.02;
  function spineOf(c, n) {
    const pts = [c[0]];
    const ls = [0];
    for (let i = 1; i <= n; i++) {
      const p = bezAt(c, i / n);
      const q = pts[i - 1];
      pts.push(p);
      ls.push(ls[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]));
    }
    return { c, n, pts, ls, len: ls[n] };
  }
  // position and direction at arc length u
  function spineAt(sp, u) {
    u = clamp(u, 0, sp.len);
    let lo = 0;
    let hi = sp.n;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (sp.ls[m] <= u) lo = m;
      else hi = m;
    }
    const f = clamp((u - sp.ls[lo]) / (sp.ls[hi] - sp.ls[lo] || 1), 0, 1);
    if (sp.chain || !sp.c) {
      const a = sp.pts[lo];
      const b = sp.pts[hi];
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: unitV(b[0] - a[0], b[1] - a[1]) };
    }
    const t = (lo + f) / sp.n;
    return { p: bezAt(sp.c, t), d: bezDir(sp.c, t) };
  }
  // One candidate flight path: a single cubic, so it can only bow, never kink.
  function seatSpine(G, si, ai, ki, hi, n = SPINE_N) {
    const st = G.starts[si];
    const t0 = turnV(st.t, SEAT_TURNS[ai]);
    const t1 = turnV([1, 0], (ki * Math.PI) / 6);
    const E = [G.wx - t1[0] * G.rim, G.wy - t1[1] * G.rim];
    const S = st.p;
    const D = Math.hypot(E[0] - S[0], E[1] - S[1]);
    if (D < 30) return null;
    const [h0, h1] = SEAT_HANDLES[hi];
    const sp = spineOf([S, [S[0] + t0[0] * D * h0, S[1] + t0[1] * D * h0], [E[0] - t1[0] * D * h1, E[1] - t1[1] * D * h1], E], n);
    let hard = 0;
    let soft = 0;
    let bend = 0;
    let sharp = Infinity;
    let h = null;
    const P = sp.pts;
    for (let i = 0; i < P.length; i++) {
      const [x, y] = P[i];
      if (x < SEAT_HALO || y < SEAT_HALO || x > G.W - SEAT_HALO || y > G.H - SEAT_HALO) return null;
      if (G.hard && inRect(G.hard, x, y)) hard++;
      if (G.title && inRect(G.title, x, y)) hard++;
      soft += G.weigh(x, y);
      if (!i) continue;
      const seg = Math.hypot(x - P[i - 1][0], y - P[i - 1][1]);
      const hh = Math.atan2(y - P[i - 1][1], x - P[i - 1][0]);
      if (h != null) {
        const d = Math.abs(Math.atan2(Math.sin(hh - h), Math.cos(hh - h)));
        bend += d;
        if (d > 1e-4) sharp = Math.min(sharp, seg / d);
      }
      h = hh;
    }
    if (bend > (G.tight ? 5.6 : 4) || sharp < G.sharp) return null;
    // arriving along the fuselage would run over the other windows, and from below it crosses the stripe
    const along = t1[0] * G.axis[0] + t1[1] * G.axis[1];
    const rise = t1[0] * G.axis[1] - t1[1] * G.axis[0];
    // a short hop has no room for loops, so it may swing wider
    const T = Math.max(D * 1.08, G.minLen);
    const stretch = sp.len > T ? (2.2 * (sp.len - T)) / T : (4 * (T - sp.len)) / T;
    // a ruler-straight run reads as a diagram, not a doodle
    const flat = Math.max(0, 0.7 - bend) * 1.6;
    let cost = st.cost + Math.abs(SEAT_TURNS[ai]) * 0.3 + bend * 0.3 + flat + stretch + soft * (sp.len / n) * SOFT_PX + 2.5 * along * along;
    if (rise > 0) cost += 1.1 * rise;
    return { sp, hard, cost, key: [si, ai, ki, hi] };
  }
  function seatLoops(sp, ci, scale, G, shift) {
    const L = sp.len;
    const n = G.loopCount || (L > 340 ? 3 : 2);
    const plan =
      G.tight && n === 1
        ? [{ f: 0.16, r: 1.12, k: 1.15, tilt: 0.15 }]
        : G.tight && n === 2
          ? [
              { f: 0.12, r: 1.05, k: 1.12, tilt: 0.14 },
              { f: 0.24, r: 0.86, k: 1.02, tilt: -0.08 },
            ]
          : SEAT_LOOPS[n];
    if (!plan) return null;
    const base = clamp(Math.max(L * 0.055, Math.min(G.W, G.H) * 0.03), 15, 25) * scale;
    const minR = G.loopMin || 11;
    const loops = [];
    for (let i = 0; i < plan.length; i++) {
      const q = plan[i];
      const r = Math.max(minR, base * q.r);
      const w = r * q.k;
      const c = L * (q.f + shift);
      const a = spineAt(sp, c);
      const b0 = spineAt(sp, Math.max(0, c - w)).d;
      const b1 = spineAt(sp, Math.min(L, c + w)).d;
      const out = b0[0] * b1[1] - b0[1] * b1[0] > 0 ? -1 : 1;
      let side = SEAT_SIDES[ci][i] * out;
      if (G.tight && G.titleRaw) {
        const M0 = turnV([-a.d[1], a.d[0]], q.tilt);
        const peak = [a.p[0] + M0[0] * 2 * r, a.p[1] + M0[1] * 2 * r];
        const inPocket = peak[0] > G.titleRaw.right - 4 && peak[1] < (G.pass?.top ?? G.H) - 4;
        side = inPocket ? 1 : -1;
      }
      loops.push({ c, w, r, side, tilt: q.tilt, T: turnV(a.d, q.tilt * side), M: turnV([-a.d[1], a.d[0]], q.tilt * side) });
    }
    // a clean run off the label, and a straight approach for the arrow
    if (loops[0].c - loops[0].w < 16 || loops[loops.length - 1].c + loops[loops.length - 1].w > L - 30) return null;
    for (let i = 1; i < loops.length; i++) if (loops[i - 1].c + loops[i - 1].w + 0.9 * (loops[i - 1].r + loops[i].r) > loops[i].c - loops[i].w) return null;
    return loops;
  }
  // eased trochoid: the loop leaves and rejoins the route with zero offset and zero slope, so there is no corner
  function seatAt(R, u) {
    const a = spineAt(R.sp, u);
    let x = a.p[0];
    let y = a.p[1];
    for (const l of R.loops) {
      const s = (u - l.c + l.w) / (2 * l.w);
      if (s <= 0 || s >= 1) continue;
      const ph = 2 * Math.PI * s - Math.sin(2 * Math.PI * s);
      const al = l.r * Math.sin(ph);
      const ac = l.side * l.r * (1 - Math.cos(ph));
      x += l.T[0] * al + l.M[0] * ac;
      y += l.T[1] * al + l.M[1] * ac;
    }
    return [x, y];
  }
  // the spine is already checked, so only the loops need a look
  function seatCheck(R, G, behind) {
    let soft = 0;
    for (const l of R.loops) {
      for (let u = l.c - l.w; u <= l.c + l.w; u += 2.5) {
        const [x, y] = seatAt(R, u);
        if (x < SEAT_HALO || y < SEAT_HALO || x > G.W - SEAT_HALO || y > G.H - SEAT_HALO) return null;
        if (!behind && G.hard && inRect(G.hard, x, y)) return null;
        if (!behind && G.title && inRect(G.title, x, y)) return null;
        soft += G.weigh(x, y) * 2.5;
      }
    }
    return soft;
  }
  // fix: the loop choice [sides, size, shift] to keep, or none to try them all
  function seatWithLoops(G, cand, behind, fix) {
    let best = null;
    for (let ci = 0; ci < SEAT_SIDES.length; ci++) {
      for (let hi = 0; hi < SEAT_SHIFTS.length; hi++) {
        if (fix && (ci !== fix[0] || hi !== fix[2])) continue;
        for (let ki = fix ? fix[1] : 0; ki < SEAT_SCALES.length; ki++) {
          const loops = seatLoops(cand.sp, ci, SEAT_SCALES[ki], G, SEAT_SHIFTS[hi]);
          if (!loops) continue;
          const R = { sp: cand.sp, loops };
          const soft = seatCheck(R, G, behind);
          if (soft == null) continue;
          // a loop reads as a plane looping when it bulges upward; sideways it reads as a knot
          const lean = loops.reduce((sum, l) => sum + 0.35 * (1 + l.side * l.M[1]), 0);
          const cost = cand.cost + soft * SOFT_PX + SEAT_SIDE_COST[ci] + ki * 0.35 + (hi ? 0.08 : 0) + lean;
          if (!best || cost < best.cost) best = { ...R, cost, behind, key: [...cand.key, ci, ki, hi] };
          break;
        }
      }
    }
    return best;
  }
  // a coarse pass over every candidate, then the best ones again at full detail
  function seatSearch(G) {
    const rough = [];
    for (let si = 0; si < G.starts.length; si++)
      for (let ai = 0; ai < SEAT_TURNS.length; ai++)
        for (let ki = 0; ki < 12; ki++)
          for (let hi = 0; hi < SEAT_HANDLES.length; hi++) {
            const c = seatSpine(G, si, ai, ki, hi, 24);
            if (c) rough.push(c);
          }
    rough.sort((a, b) => a.hard - b.hard || a.cost - b.cost);
    const all = [];
    for (let i = 0; i < rough.length && i < 160; i++) {
      const c = seatSpine(G, ...rough[i].key);
      if (c) all.push(c);
    }
    if (!all.length) return null;
    const clear = all.filter((c) => !c.hard);
    const behind = !clear.length;
    const pool = behind ? all.sort((a, b) => a.hard - b.hard || a.cost - b.cost) : clear.sort((a, b) => a.cost - b.cost);
    let best = null;
    let found = 0;
    for (let i = 0; i < pool.length && i < 120 && found < 8; i++) {
      const r = seatWithLoops(G, pool[i], behind);
      if (!r) continue;
      found++;
      if (!best || r.cost < best.cost) best = r;
    }
    return best || { sp: pool[0].sp, loops: [], behind, key: null };
  }
  // the same choice as last frame, on the new geometry, while it still fits
  function seatReuse(G, memo) {
    const k = memo.key;
    if (!k) return null;
    const c = seatSpine(G, k[0], k[1], k[2], k[3]);
    if (!c || (c.hard && !memo.behind)) return null;
    return seatWithLoops(G, c, memo.behind, k.slice(4));
  }
  function seatHermite(R) {
    const L = R.sp.len;
    const F = (u) => seatAt(R, clamp(u, 0, L));
    const dF = (u) => {
      const a = Math.max(0, u - 0.25);
      const b = Math.min(L, u + 0.25);
      const p = F(a);
      const q = F(b);
      return [(q[0] - p[0]) / (b - a), (q[1] - p[1]) / (b - a)];
    };
    const inLoop = (u) => R.loops.some((l) => u > l.c - l.w + 0.5 && u < l.c + l.w - 0.5);
    const us = [];
    const n = Math.max(2, Math.ceil(L / 56));
    for (let i = 0; i <= n; i++) if (!inLoop((L * i) / n)) us.push((L * i) / n);
    for (const l of R.loops) for (let j = 0; j <= 16; j++) us.push(l.c - l.w + (2 * l.w * j) / 16);
    us.sort((a, b) => a - b);
    const knots = us.filter((u, i) => !i || u - us[i - 1] > 0.5);
    const cubics = [];
    let p = F(knots[0]);
    let dp = dF(knots[0]);
    for (let i = 1; i < knots.length; i++) {
      const h = (knots[i] - knots[i - 1]) / 3;
      const q = F(knots[i]);
      const dq = dF(knots[i]);
      cubics.push([p, [p[0] + dp[0] * h, p[1] + dp[1] * h], [q[0] - dq[0] * h, q[1] - dq[1] * h], q]);
      p = q;
      dp = dq;
    }
    return { L, F, dF, cubics, end: p };
  }
  function seatInkReport(R, G) {
    if (!R?.sp) return { passGap: -1, titleGap: -1, minGap: -1, on: false };
    const { cubics } = seatHermite(R);
    let passGap = Infinity;
    let titleGap = Infinity;
    let on = cubics.length > 0;
    for (const raw of cubics) {
      const c = raw.map((p) => [N(p[0]), N(p[1])]);
      const span = Math.hypot(c[3][0] - c[0][0], c[3][1] - c[0][1]) + 8;
      const steps = Math.max(16, Math.ceil(span / 1.5));
      for (let i = 0; i <= steps; i++) {
        const [x, y] = bezAt(c, i / steps);
        if (x < SEAT_EDGE || y < SEAT_EDGE || x > G.W - SEAT_EDGE || y > G.H - SEAT_EDGE) on = false;
        if (G.pass) passGap = Math.min(passGap, rectGap(x, y, G.pass) - SEAT_HALO);
        if (G.titleRaw) titleGap = Math.min(titleGap, rectGap(x, y, G.titleRaw) - SEAT_HALO);
      }
    }
    for (const l of R.loops) {
      const a = spineAt(R.sp, l.c);
      const peak = [a.p[0] + l.M[0] * 2 * l.r, a.p[1] + l.M[1] * 2 * l.r];
      if (peak[0] < SEAT_EDGE || peak[1] < SEAT_EDGE || peak[0] > G.W - SEAT_EDGE || peak[1] > G.H - SEAT_EDGE) on = false;
    }
    return { passGap, titleGap, minGap: Math.min(passGap, titleGap), on };
  }
  function seatInkOk(rep) {
    return !!rep.on && rep.minGap >= SEAT_CLEAR;
  }
  // Same cubic and loops as the tall route, scaled uniformly toward the start–end chord.
  function seatChordScale(R, s) {
    if (!R?.sp?.c || R.sp.chain) return R;
    if (s >= 0.999) return R;
    const [S, C1, C2, E] = R.sp.c;
    const dx = E[0] - S[0];
    const dy = E[1] - S[1];
    const D = Math.hypot(dx, dy) || 1;
    const U = [dx / D, dy / D];
    const V = [-U[1], U[0]];
    const loc = (p) => {
      const x = p[0] - S[0];
      const y = p[1] - S[1];
      return [x * U[0] + y * U[1], x * V[0] + y * V[1]];
    };
    const world = (a, b) => [S[0] + U[0] * a + V[0] * b, S[1] + U[1] * a + V[1] * b];
    const p1 = loc(C1);
    const p2 = loc(C2);
    const sp = spineOf([S, world(D / 3 + s * (p1[0] - D / 3), s * p1[1]), world((2 * D) / 3 + s * (p2[0] - (2 * D) / 3), s * p2[1]), E], SPINE_N);
    const loops = R.loops.map((l) => {
      const c = sp.len * (l.c / R.sp.len);
      const r = l.r * s;
      const w = l.w * s;
      const a = spineAt(sp, c);
      const tilt = l.tilt || 0;
      return { c, w, r, side: l.side, tilt, T: turnV(a.d, tilt * l.side), M: turnV([-a.d[1], a.d[0]], tilt * l.side) };
    });
    return { ...R, sp, loops };
  }
  function seatScaleToClear(R, G) {
    if (!R) return null;
    if (seatInkOk(seatInkReport(R, G))) return R;
    const minR = R.loops.reduce((m, l) => Math.min(m, l.r), Infinity);
    const sFloor = Number.isFinite(minR) && minR > 0 ? Math.min(1, SEAT_LOOP_MIN / minR) : 1;
    let lo = sFloor;
    let hi = 1;
    let best = null;
    for (let i = 0; i < 16; i++) {
      const s = (lo + hi) / 2;
      const Q = seatChordScale(R, s);
      if (seatInkOk(seatInkReport(Q, G))) {
        best = Q;
        lo = s;
      } else hi = s;
    }
    if (!best) {
      const Q = seatChordScale(R, sFloor);
      if (seatInkOk(seatInkReport(Q, G))) best = Q;
    }
    return best;
  }
  function seatOnSpine(G, src, n) {
    if (!src?.sp) return null;
    return seatWithLoops({ ...G, loopCount: n, loopMin: SEAT_LOOP_MIN }, { sp: src.sp, cost: src.cost || 0, key: src.key || [0, 0, 0, 0] }, false);
  }
  // Use the found doodle as-is when it already clears. Otherwise scale that same stroke to the band above the pass; drop 2→1 loops before flattening.
  function seatPrefer(R, G) {
    if (!R) return null;
    if (seatInkOk(seatInkReport(R, G))) return R;
    const two = R.loops.length === 1 ? seatOnSpine(G, R, 2) || R : R;
    const scaledTwo = seatScaleToClear(two, G);
    if (scaledTwo) return scaledTwo;
    const one = seatOnSpine(G, two, 1);
    if (!one) return null;
    if (seatInkOk(seatInkReport(one, G))) return one;
    return seatScaleToClear(one, G);
  }
  function seatNoteEl(root) {
    return (root && $('.note', root)) || document.querySelector('body > .note');
  }
  function seatNoteHome(note) {
    if (!note) return;
    note.classList.remove('parked');
    note.style.left = '';
    note.style.top = '';
    note.style.right = '';
    note.style.margin = '';
    note.style.position = '';
    note.style.transform = '';
    const home = note._seatHome;
    if (home?.parent && note.parentNode !== home.parent) home.parent.insertBefore(note, home.next);
    note._seatHome = null;
  }
  // portrait HUD sits on the pass; the -7° AABB + paper halo dip into it. Lift, then route from that box.
  function seatNoteLiftForPass(note, pass, W, H) {
    if (!note || note.classList.contains('parked') || !pass) return;
    if (!(W <= 430 && W < H)) return;
    const r = note.getBoundingClientRect();
    const gap = pass.top - r.bottom;
    const need = SEAT_CLEAR + SEAT_NOTE_HALO;
    if (gap >= need) return;
    const lift = Math.ceil((need - gap + 0.6) * 10) / 10;
    note.style.transform = `translateY(${-lift}px) rotate(-7deg)`;
  }
  function seatNotePark(note, left, top, host) {
    const parkHost = host || document.body;
    if (!note._seatHome) note._seatHome = { parent: note.parentNode, next: note.nextSibling };
    if (note.parentNode !== parkHost) parkHost.appendChild(note);
    note.classList.add('parked');
    const origin = parkHost === document.body ? { left: 0, top: 0 } : parkHost.getBoundingClientRect();
    note.style.position = parkHost === document.body ? 'fixed' : 'absolute';
    note.style.right = 'auto';
    note.style.margin = '0';
    const x = left - origin.left;
    const y = top - origin.top;
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    const r = note.getBoundingClientRect();
    note.style.left = `${x + (left - r.left)}px`;
    note.style.top = `${y + (top - r.top)}px`;
  }
  function seatClearExtras(R, G) {
    const boxes = [...(G.pills || []), G.hud].filter((b) => b && b.width > 2);
    if (!boxes.length) return true;
    const { cubics } = seatHermite(R);
    for (const raw of cubics) {
      const c = raw.map((p) => [N(p[0]), N(p[1])]);
      const span = Math.hypot(c[3][0] - c[0][0], c[3][1] - c[0][1]) + 8;
      const steps = Math.max(8, Math.ceil(span / 3));
      for (let i = 0; i <= steps; i++) {
        const [x, y] = bezAt(c, i / steps);
        for (const b of boxes) if (rectGap(x, y, b) - SEAT_HALO < SEAT_CLEAR) return false;
      }
    }
    for (const l of R.loops) {
      const a = spineAt(R.sp, l.c);
      const peak = [a.p[0] + l.M[0] * 2 * l.r, a.p[1] + l.M[1] * 2 * l.r];
      for (const b of boxes) if (rectGap(peak[0], peak[1], b) - SEAT_HALO < SEAT_CLEAR) return false;
    }
    return true;
  }
  // one trochoid on a short cubic, same stroke as the tall doodle
  function seatShortLoop(sp) {
    const L = sp.len;
    const r = SEAT_LOOP_MIN;
    const w = r * 1.15;
    const c = L * 0.48;
    if (c - w < 14 || c + w > L - 22) return null;
    const a = spineAt(sp, c);
    const left = [-a.d[1], a.d[0]];
    const side = left[1] <= 0 ? 1 : -1;
    const tilt = 0.15;
    return [{ c, w, r, side, tilt, T: turnV(a.d, tilt * side), M: turnV([-a.d[1], a.d[0]], tilt * side) }];
  }
  function seatStartsNear(F, wx, wy) {
    const all = seatStarts(F);
    all.push({ p: F.at(F.w / 2 + 8, 3), t: F.U, cost: 0.05 });
    all.sort((a, b) => Math.hypot(a.p[0] - wx, a.p[1] - wy) - Math.hypot(b.p[0] - wx, b.p[1] - wy));
    return all.slice(0, 4);
  }
  function seatShortArrow(G) {
    let best = null;
    let bestGap = -99;
    for (const st of seatStartsNear(noteFrame(G.note), G.wx, G.wy)) {
      const S = st.p;
      const tWin = unitV(G.wx - S[0], G.wy - S[1]);
      const End = [G.wx - tWin[0] * G.rim, G.wy - tWin[1] * G.rim];
      const D = Math.hypot(End[0] - S[0], End[1] - S[1]);
      if (D < 56 || D > 180) continue;
      const t0s = [st.t, tWin, turnV(tWin, 0.5), turnV(tWin, -0.5), turnV(st.t, 0.4), turnV(st.t, -0.4)];
      const hs = [
        [0.34, 0.34],
        [0.5, 0.4],
        [0.28, 0.48],
        [0.6, 0.3],
      ];
      for (const t0 of t0s) {
        for (const [h0, h1] of hs) {
          const sp = spineOf([S, [S[0] + t0[0] * D * h0, S[1] + t0[1] * D * h0], [End[0] - tWin[0] * D * h1, End[1] - tWin[1] * D * h1], End], SPINE_N);
          if (sp.len < 78 || sp.len > 220) continue;
          let edge = false;
          for (const p of sp.pts) {
            if (p[0] < SEAT_EDGE || p[1] < SEAT_EDGE || p[0] > G.W - SEAT_EDGE || p[1] > G.H - SEAT_EDGE) {
              edge = true;
              break;
            }
          }
          if (edge) continue;
          const loops = seatShortLoop(sp);
          if (!loops) continue;
          const R = { sp, loops, cost: st.cost + sp.len * 0.01, key: null, behind: false };
          const rep = seatInkReport(R, G);
          if (!seatInkOk(rep) || !seatClearExtras(R, G)) continue;
          if (rep.minGap > bestGap) {
            bestGap = rep.minGap;
            best = R;
          }
        }
      }
    }
    return best;
  }
  // when the tall doodle cannot clear, sit the label by the window and draw a short one-loop arrow
  function seatParkRoute(g, noteEl, baseG) {
    const home = noteEl.getBoundingClientRect();
    const nw = home.width;
    const nh = home.height;
    if (nw < 8 || nh < 8) return null;
    const obstacles = [g.title, g.card, g.hud, ...(g.pills || [])].filter((b) => b && b.width > 2);
    const ink = SEAT_EDGE;
    const air = SEAT_CLEAR;
    const spots = [];
    for (const dist of [78, 92, 106, 120, 136]) {
      for (const deg of [-90, -112, -68, -134, -48, 180, 158, 202, 0, -18, 18]) {
        const rad = (deg * Math.PI) / 180;
        spots.push({
          left: g.wx + Math.cos(rad) * dist - nw / 2,
          top: g.wy + Math.sin(rad) * dist - nh / 2,
          pref: Math.abs(deg + 90) + dist * 0.03,
        });
      }
    }
    const skyTop = (g.title?.bottom ?? ink) + air;
    const skyBot = g.wy - 40;
    if (skyBot - skyTop > nh + 4) {
      const top = clamp((skyTop + skyBot - nh) / 2, skyTop, skyBot - nh);
      for (const dx of [-nw * 0.35, -nw * 0.1, nw * 0.12]) {
        spots.push({ left: g.wx - nw / 2 + dx, top, pref: 1 });
      }
    }
    for (const dx of [-nw * 0.2, 0, nw * 0.15]) {
      spots.push({ left: g.wx - nw / 2 + dx, top: g.wy - 102 - nh, pref: 10 });
      spots.push({ left: g.wx - nw - 18, top: g.wy - nh / 2 + dx * 0.4, pref: 22 });
      spots.push({ left: g.wx + 18, top: g.wy - nh / 2 + dx * 0.4, pref: 26 });
    }
    spots.sort((a, b) => a.pref - b.pref);
    let best = null;
    for (const s of spots) {
      const box = { left: s.left, top: s.top, right: s.left + nw, bottom: s.top + nh, width: nw, height: nh };
      if (box.left < ink || box.top < ink || box.right > g.W - ink || box.bottom > g.H - ink) continue;
      if (obstacles.some((b) => box.left < b.right + air && box.right > b.left - air && box.top < b.bottom + air && box.bottom > b.top - air)) continue;
      if (g.body) {
        const samples = [
          [box.left + nw * 0.2, box.top + nh * 0.5],
          [box.left + nw * 0.5, box.top + nh * 0.5],
          [box.left + nw * 0.8, box.top + nh * 0.5],
        ];
        if (samples.some((p) => g.body(p[0], p[1]))) continue;
      }
      seatNotePark(noteEl, s.left, s.top, g.noteHost);
      const note = noteEl.getBoundingClientRect();
      const F = noteFrame(note);
      const G = { ...baseG, note, starts: seatStarts(F) };
      const R = seatShortArrow(G);
      if (!R) continue;
      const rep = seatInkReport(R, G);
      if (!best || (rep.minGap || -99) > (best.gap || -99)) best = { R, park: { left: s.left, top: s.top }, gap: rep.minGap };
      if (rep.minGap >= 12 && s.pref < 36) break;
    }
    if (best) {
      seatNotePark(noteEl, best.park.left, best.park.top, g.noteHost);
      return best;
    }
    seatNoteHome(noteEl);
    return null;
  }
  // Hermite pieces from the exact curve: every join shares its tangent, so the stroke has no kinks.
  function seatPath(R) {
    const { L, dF, cubics, end: p } = seatHermite(R);
    const [m0] = cubics[0] || [p];
    let d = `M${N(m0[0])} ${N(m0[1])}`;
    for (const c of cubics) {
      d += `C${N(c[1][0])} ${N(c[1][1])} ${N(c[2][0])} ${N(c[2][1])} ${N(c[3][0])} ${N(c[3][1])}`;
    }
    const dir = unitV(...dF(L));
    const arm = (a) => {
      const v = turnV(dir, a);
      return `${N(p[0] - v[0] * SEAT_HEAD)} ${N(p[1] - v[1] * SEAT_HEAD)}`;
    };
    // one subpath to the end, so the dash draws the head last in every engine
    return `${d}L${arm(0.5)}L${N(p[0])} ${N(p[1])}L${arm(-0.5)}`;
  }
  // g: label box, window centre and rim, plane axis, card, other boxes to keep clear of, and the drawing size
  function seatRoute(g, memo = {}) {
    const noteEl = g.noteEl;
    const q = (v) => Math.round(v / 16);
    const titleRaw = g.title && g.title.width > 2 && g.title.height > 2 ? g.title : null;
    const passRaw = g.card && g.card.width > 2 && g.card.height > 2 ? g.card : null;
    const layoutSig = [
      g.W,
      g.H,
      q(g.wx),
      q(g.wy),
      passRaw ? [q(passRaw.left), q(passRaw.top), q(passRaw.right), q(passRaw.bottom)] : '',
      titleRaw ? [q(titleRaw.left), q(titleRaw.top), q(titleRaw.right), q(titleRaw.bottom)] : '',
    ].join();
    if (memo.parked && memo.park && memo.shortR && memo.layoutSig === layoutSig && noteEl) {
      seatNotePark(noteEl, memo.park.left, memo.park.top, g.noteHost);
      return { d: seatPath(memo.shortR), behind: false };
    }
    if (noteEl) seatNoteHome(noteEl);
    if (noteEl) seatNoteLiftForPass(noteEl, passRaw, g.W, g.H);
    if (noteEl) g.note = noteEl.getBoundingClientRect();
    if (!g.note?.width) return { d: '', behind: false };
    const F = noteFrame(g.note);
    const boxes = g.avoid.filter((b) => b && b.width > 2 && b.height > 2);
    const [r0, r1] = g.row;
    const rl = Math.hypot(r1[0] - r0[0], r1[1] - r0[1]) || 1;
    const ru = [(r1[0] - r0[0]) / rl, (r1[1] - r0[1]) / rl];
    const pills = (g.pills || []).filter((b) => b && b.width > 2 && b.height > 2);
    const tight = !!(passRaw && titleRaw && seatTight({ pass: passRaw, titleRaw }));
    const card = passRaw ? (tight ? padInk(passRaw) : padCard(passRaw)) : null;
    const title = titleRaw ? (tight ? padInk(titleRaw) : padTitle(titleRaw, g.W, g.H)) : null;
    // ink over the label, the title or the porthole costs a little; over the other cabin windows, more
    const weigh = (x, y) => {
      let w = F.has(x, y) ? 1 : 0;
      if (title && inRect(title, x, y)) w += 4;
      for (const b of boxes) if (x > b.left - 8 && x < b.right + 8 && y > b.top - 8 && y < b.bottom + 8) w++;
      const a = clamp((x - r0[0]) * ru[0] + (y - r0[1]) * ru[1], 0, rl);
      const off = Math.hypot(x - r0[0] - ru[0] * a, y - r0[1] - ru[1] * a);
      if (Math.hypot(x - g.wx, y - g.wy) > g.rim * 1.8) {
        if (off < g.rim) w += 2;
        if (g.body(x, y)) w += 1;
      }
      return w;
    };
    const G = {
      ...g,
      hard: card,
      pass: passRaw,
      titleRaw,
      title,
      pills,
      tight,
      weigh,
      starts: seatStarts(F),
      minLen: clamp(Math.min(g.W, g.H) * 0.68, tight ? 180 : 250, 360),
      sharp: tight ? 12 : clamp(Math.min(g.W, g.H) * 0.05, 22, 32),
      sig: [
        g.W,
        g.H,
        q(g.wx),
        q(g.wy),
        q(g.note.left),
        q(g.note.top),
        card ? [q(card.left), q(card.top), q(card.right), q(card.bottom)] : '',
        title ? [q(title.left), q(title.top), q(title.right), q(title.bottom)] : '',
      ].join(),
    };
    const t0 = performance.now();
    // keep the drawn route while the plane moves; switch only to a clearly better one
    let R = memo.parked ? null : seatReuse(G, memo);
    if (R && (R.sp?.chain || !seatInkOk(seatInkReport(R, G)))) R = seatPrefer(R, G);
    if (!R || (memo.sig !== G.sig && !(t0 - memo.at < 400))) {
      memo.at = t0;
      const keep = (Q, cur) => {
        if (!Q?.sp) return cur;
        const qRep = seatInkReport(Q, G);
        const qOk = seatInkOk(qRep);
        if (!cur) return Q;
        const cRep = seatInkReport(cur, G);
        const cOk = seatInkOk(cRep);
        if (qOk && !cOk) return Q;
        if (!qOk && cOk) return cur;
        if ((qRep.minGap || -99) > (cRep.minGap || -99) + 0.3) return Q;
        if ((Q.loops?.length || 0) >= (cur.loops?.length || 0) && Q.cost < (cur.cost || 9e9) - 0.05 && (qRep.minGap || -99) >= (cRep.minGap || -99) - 1) return Q;
        return cur;
      };
      const found = seatSearch(G);
      let fresh = seatPrefer(found, G) || found;
      if (!fresh || !seatInkOk(seatInkReport(fresh, G))) {
        const one = seatSearch({ ...G, loopCount: 1, loopMin: SEAT_LOOP_MIN });
        fresh = keep(seatPrefer(one, G) || one, fresh);
      }
      if (fresh && (!R || fresh.cost < (R.cost || 9e9) - 0.25 || !seatInkOk(seatInkReport(R, G)))) R = fresh;
    }
    if (R && !tight && seatInkOk(seatInkReport(R, G))) {
      memo.parked = false;
      memo.park = null;
      memo.shortR = null;
      memo.layoutSig = layoutSig;
      memo.key = R.key;
      memo.behind = false;
      memo.sig = G.sig;
      return { d: seatPath(R), behind: false };
    }
    if (noteEl) seatNoteHome(noteEl);
    const parked = noteEl ? seatParkRoute(g, noteEl, G) : null;
    if (parked) {
      memo.parked = true;
      memo.park = parked.park;
      memo.shortR = parked.R;
      memo.layoutSig = layoutSig;
      memo.key = null;
      memo.behind = false;
      memo.sig = G.sig;
      return { d: seatPath(parked.R), behind: false };
    }
    if (!R) return { d: '', behind: false };
    memo.key = R.key;
    memo.behind = false;
    memo.sig = G.sig;
    memo.layoutSig = layoutSig;
    if (noteEl) seatNoteLiftForPass(noteEl, passRaw, g.W, g.H);
    return { d: seatPath(R), behind: false };
  }
  const seatLine = $('#seatLine');
  const seatPaths = seatLine ? $$('path', seatLine) : [];
  const heroCard = $('[data-k="hero"]');
  const seatMemo = {};
  // the control tower, measured from its beacon (r 5, 254 above the ground, cab 34 either side)
  function towerRect(bcn) {
    const b = bcn?.getBoundingClientRect();
    if (!b?.width) return null;
    const s = b.width / 10;
    const cx = b.left + b.width / 2;
    return { left: cx - 34 * s, right: cx + 34 * s, top: b.top, bottom: b.top + 260 * s, width: 68 * s, height: 260 * s };
  }
  // the pass rises into place after the frame loop has gone idle, so route around where it lands
  function settledRect(el) {
    const tf = getComputedStyle(el).transform;
    const m = new DOMMatrixReadOnly(tf === 'none' || tf === '' ? undefined : tf);
    return shiftRect(el.getBoundingClientRect(), m.e, m.f);
  }
  function seatPills() {
    return [$('#motionToggle'), $('#pause')]
      .map((el) => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect())
      .filter(Boolean);
  }
  function seatCardRect(el) {
    const vis = el.getBoundingClientRect();
    const set = settledRect(el);
    const left = Math.min(vis.left, set.left);
    const top = Math.min(vis.top, set.top);
    const right = Math.max(vis.right, set.right);
    const bottom = Math.max(vis.bottom, set.bottom);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }
  // the window ring is r 9.5 with a 3 outline; the arrow stops just short of it
  function seatWindow(p, pitch = 0, str = 0) {
    const [wx, wy] = planeLocal(p, LUIS_WIN_X, LUIS_WIN_Y, pitch, str);
    const r = ((p.r + pitch) * Math.PI) / 180;
    const row = [planeLocal(p, 178, LUIS_WIN_Y, pitch, str), planeLocal(p, 478, LUIS_WIN_Y, pitch, str)];
    const co = Math.cos(r);
    const si = Math.sin(r);
    const sx = p.s * (1 + str);
    const sy = p.s * (1 - str * 0.8);
    // inside the fuselage outline, in the plane's own units
    const body = (x, y) => {
      const lx = (co * (x - p.x) + si * (y - p.y)) / sx + PLANE.cx;
      const ly = (-si * (x - p.x) + co * (y - p.y)) / sy + PLANE.cy;
      return lx > 62 && lx < 612 && ly > 84 && ly < 172;
    };
    return { wx, wy, rim: 11 * p.s + 3.5, axis: [co, si], row, body };
  }
  function paintSeat(on, p) {
    if (!seatLine) return;
    const note = seatNoteEl(hud);
    if (!on || !p) {
      seatNoteHome(note);
      seatLine.classList.remove('on', 'behind');
      return;
    }
    if (!note) return;
    const title = $('#stage .ttl.on');
    const titleRect = title?.getBoundingClientRect();
    const pills = seatPills();
    const hudRect = hud.getBoundingClientRect();
    const route = seatRoute(
      {
        ...seatWindow(p, st.pitch, st.str),
        note: note.getBoundingClientRect(),
        noteEl: note,
        hud: hudRect,
        card: heroCard && seatCardRect(heroCard),
        title: titleRect,
        pills,
        avoid: [titleRect, hudRect, towerRect($('#stage .bcn')), ...pills],
        noteHost: document.body,
        W: innerWidth,
        H: innerHeight,
      },
      seatMemo,
    );
    if (seatPaths[0].getAttribute('d') !== route.d) {
      for (const path of seatPaths) path.setAttribute('d', route.d);
    }
    seatLine.classList.toggle('behind', route.behind);
    if (!seatLine.classList.contains('on')) requestAnimationFrame(() => seatLine.classList.add('on'));
  }
  function cardCoveredByContact(card) {
    const arr = $('.arr', contact);
    if (!arr || !card) return false;
    const a = arr.getBoundingClientRect();
    if (a.bottom < 8 || a.top > innerHeight - 8) return false;
    const c = card.getBoundingClientRect();
    const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left);
    const oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    return ox > 24 && oy > 24;
  }
  function focusMoreToggleIfVisible(btn) {
    if (!btn?.isConnected) return;
    const r = btn.getBoundingClientRect();
    if (r.bottom < 4 || r.top > innerHeight - 4) return;
    btn.focus({ preventScroll: true });
  }
  function closeOtherMores(keep) {
    const closed = [];
    for (const btn of $$('.more-btn[aria-expanded="true"]')) {
      if (btn.closest('.copy')?.dataset.k === keep) continue;
      btn.setAttribute('aria-expanded', 'false');
      const body = document.getElementById(btn.getAttribute('aria-controls'));
      if (body) body.hidden = true;
      closed.push(btn);
    }
    return closed;
  }
  let moreLock = false;
  function relayoutAfterMore() {
    if (moreLock || !LAY || STATIC) return;
    moreLock = true;
    const y0 = scrollY;
    const h0 = document.documentElement.scrollHeight;
    layout();
    const delta = h0 - document.documentElement.scrollHeight;
    if (delta > 2) scrollTo(0, Math.max(0, y0 - delta));
    st.y = scrollY - LAY.top;
    apply(st.y, performance.now());
    moreLock = false;
  }
  function buildHud() {
    const stray = document.querySelector('body > .note');
    if (stray) stray.remove();
    hud.innerHTML = `<button type="button" class="lu-hit" aria-label="Say hi to Luis"><svg class="lu" viewBox="0 0 200 240">${luisSVG('h')}</svg></button>${NOTE}`;
    rig.svg = $('.lu', hud);
    rig.parts = rigParts(rig.svg);
  }
  function setReact(r) {
    rig.react = r || '';
    paintAvatarClasses();
    kickRig();
  }
  function cycleAvatarReact(frame = null) {
    clearTimeout(rig.reactTimer);
    if (rig.reactFrame !== frame) setReact('');
    rig.reactFrame = frame;
    rig.reactIx = (rig.reactIx + 1) % REACT_SEQ.length;
    const r = REACT_SEQ[rig.reactIx];
    rig.savedExpr = rig.expr;
    setReact(r);
    const live = $('#avatarLive');
    if (live) live.textContent = REACT_LABEL[r] || '';
    document.dispatchEvent(new CustomEvent('lm:avatar-react', { detail: { reaction: r, index: rig.reactIx } }));
    if (motionReduced()) return;
    rig.reactTimer = setTimeout(() => {
      setReact('');
      rig.reactFrame = null;
      setExpr(rig.savedExpr);
    }, 1200);
  }
  function setupAvatarReact() {
    document.addEventListener('click', (ev) => {
      const hit = ev.target.closest('.lu-hit');
      if (!hit) return;
      cycleAvatarReact(hit.closest('.frame'));
    });
  }
  const HUD = { tf: '', h: 0, hint: null, turb: false };
  function setHud(p, hint) {
    if (p.h !== HUD.h) {
      HUD.h = p.h;
      hud.style.width = `${N((p.h * 200) / 240)}px`;
      hud.style.height = `${N(p.h)}px`;
    }
    const tf = `translate3d(${N(p.x)}px,${N(p.y)}px,0)`;
    if (tf !== HUD.tf) {
      HUD.tf = tf;
      hud.style.transform = tf;
    }
    rig.box = p;
    if (hint !== HUD.hint) {
      HUD.hint = hint;
      hud.classList.toggle('hint', hint);
    }
  }
  function setExpr(e) {
    if (rig.react) return;
    if (e === rig.expr) return;
    rig.expr = e || '';
    paintAvatarClasses();
  }
  function kickRig() {
    if (!rig.raf) {
      rig.last = 0;
      rig.raf = requestAnimationFrame(rigTick);
    }
  }
  function poseIdle() {
    const o = { bump: rig.bump, bx: rig.bx, by: rig.by };
    if (STATIC) {
      for (const fr of $$('.frame')) {
        const lu = $('.lu', fr);
        if (!lu) continue;
        const sleep = lu.dataset.ex === 'sleep';
        const [bx, by, tilt] = fr.lmGaze || (sleep ? [-0.35, 0.5, 9] : [0, 0, 0]);
        const x = sleep ? bx : bx + rig.x;
        const y = sleep ? by : by + rig.y;
        const extra = { ...o, tilt: sleep ? 9 : tilt };
        lu.lmParts ||= rigParts(lu);
        poseLuis(lu.lmParts, x, y, extra);
        const tl = $('.tl', fr);
        if (tl) poseTiny(tl, x, y, extra);
      }
      return;
    }
    const tilt = rig.expr === 'sleep' ? 9 : 0;
    if (rig.parts) poseLuis(rig.parts, rig.x, rig.y, { ...o, tilt });
    for (const t of rig.tinies || []) poseTiny(t, rig.x, rig.y, { ...o, tilt });
  }
  function blinkTargets() {
    if (STATIC) return [...$$('.frame .lu'), ...$$('.frame .tl')];
    return [rig.svg, ...(rig.tinies || [])].filter(Boolean);
  }
  function rigTick(now) {
    rig.raf = 0;
    if (!avatarLive()) return;
    const dt = Math.min(0.05, rig.last ? (now - rig.last) / 1000 : 1 / 60);
    rig.last = now;
    const b = rig.box;
    if (!STATIC && !b) return;
    let tx;
    let ty;
    if (STATIC) {
      [tx, ty] = rig.glance;
    } else {
      const usePtr = FINE && now - rig.ptr.t < 3500;
      const tgt = usePtr ? [rig.ptr.x, rig.ptr.y] : rig.script;
      [tx, ty] = tgt ? gaze(b, tgt) : [0, 0];
      if (!usePtr) {
        tx = clamp(tx + rig.glance[0], -1, 1);
        ty = clamp(ty + rig.glance[1], -1, 1);
      }
    }
    if (!STATIC && rig.expr === 'sleep') [tx, ty] = SLEEP;
    // with a hand raised beside his head, Luis never turns into it, and the ears (which drift the other way) stay clear
    if (rig.react === 'wave' || rig.react === 'peace') tx = clamp(tx, -0.4, 0);
    // under-damped spring with a little settle; the bun lags behind and swings
    const kk = 70;
    const cc = 2 * 0.72 * Math.sqrt(kk);
    rig.vx += ((tx - rig.x) * kk - rig.vx * cc) * dt;
    rig.vy += ((ty - rig.y) * kk - rig.vy * cc) * dt;
    rig.x += rig.vx * dt;
    rig.y += rig.vy * dt;
    const kb = 120;
    const cb = 2 * 0.3 * Math.sqrt(kb);
    rig.bvx += ((-rig.vx * 0.9 - rig.bx) * kb - rig.bvx * cb) * dt;
    rig.bvy += ((-rig.vy * 0.6 - rig.by) * kb - rig.bvy * cb) * dt;
    rig.bx += rig.bvx * dt;
    rig.by += rig.bvy * dt;
    const kp = 260;
    rig.vb += (-rig.bump * kp - rig.vb * 2 * 0.35 * Math.sqrt(kp)) * dt;
    rig.bump += rig.vb * dt;
    poseIdle();
    const moving = Math.abs(rig.vx) + Math.abs(rig.vy) + Math.abs(rig.bvx) + Math.abs(rig.vb) > 0.004 || Math.abs(tx - rig.x) + Math.abs(ty - rig.y) > 0.002;
    if (moving) rig.raf = requestAnimationFrame(rigTick);
  }
  let blinkT = 0;
  let glanceT = 0;
  function blinkOnce() {
    const asleep = STATIC ? false : rig.expr === 'sleep';
    if (asleep) return;
    const blinkOn = (on) => {
      for (const el of blinkTargets()) {
        if (el.classList.contains('ex-sleep')) continue;
        el.classList.toggle('blink', on);
      }
    };
    blinkOn(true);
    blinkOffT.push(setTimeout(() => blinkOn(false), 120 + Math.random() * 40));
  }
  function blinkLoop(wait) {
    clearTimeout(blinkT);
    if (!avatarIdleOk()) return;
    blinkT = setTimeout(() => {
      if (!avatarIdleOk()) return;
      blinkOnce();
      if (Math.random() < 0.18 && avatarIdleOk()) {
        setTimeout(() => {
          if (avatarIdleOk()) blinkOnce();
        }, 300);
      }
      blinkLoop();
    }, wait ?? 2400 + Math.random() * 3200);
  }
  function glanceLoop(wait) {
    clearTimeout(glanceT);
    if (!avatarIdleOk()) return;
    glanceT = setTimeout(() => {
      if (!avatarIdleOk()) return;
      const r = Math.random();
      rig.glance = r < 0.4 ? [0, 0] : [(Math.random() * 2 - 1) * 0.5, (Math.random() * 2 - 1) * 0.3];
      kickRig();
      glanceLoop();
    }, wait ?? 1600 + Math.random() * 2400);
  }
  function stopCalmIdle() {
    clearTimeout(blinkT);
    clearTimeout(glanceT);
    rig.glance = [0, 0];
    kickRig();
  }
  function restCalmAvatar() {
    clearTimeout(blinkT);
    clearTimeout(glanceT);
    for (const t of blinkOffT) clearTimeout(t);
    blinkOffT = [];
    for (const el of blinkTargets()) el.classList.remove('blink');
    rig.glance = [0, 0];
    rig.x = 0;
    rig.y = 0;
    rig.vx = 0;
    rig.vy = 0;
    rig.bx = 0;
    rig.by = 0;
    rig.bvx = 0;
    rig.bvy = 0;
    rig.bump = 0;
    rig.vb = 0;
    cancelAnimationFrame(rig.raf);
    rig.raf = 0;
    poseIdle();
  }
  function snapCalmIdle() {
    calmIdleUntil = 0;
    restCalmAvatar();
  }
  function startCalmShot(ms = 1800) {
    if (root.dataset.motion !== 'calm' || motionReduced()) return;
    const now = performance.now();
    if (calmIdleStart && now < calmIdleStart + CALM_SNAP_MS) return;
    const span = Math.min(ms, 4500);
    calmShotUntil = now + span;
    blinkOnce();
    rig.glance = [(Math.random() * 2 - 1) * 0.45, (Math.random() * 2 - 1) * 0.25];
    kickRig();
    clearTimeout(calmShotT);
    calmShotT = setTimeout(() => {
      rig.glance = [0, 0];
      kickRig();
    }, Math.min(span, 1800));
  }
  function setupCalmAvatarCue() {
    const cue = (ev) => {
      if (!ev.target.closest?.('.lu-hit')) return;
      startCalmShot(ev.type === 'click' ? 1200 : 1800);
    };
    document.addEventListener('pointerenter', cue, true);
    document.addEventListener('focusin', cue);
    document.addEventListener('click', cue);
  }

  /* ---------- loop ---------- */
  function frame(now) {
    st.raf = 0;
    const dt = Math.min(0.05, st.last ? (now - st.last) / 1000 : 1 / 60);
    st.last = now;
    const ty = scrollY - LAY.top;
    const a = QA ? 1 : 1 - Math.exp(-dt / 0.085);
    const prev = st.y;
    st.y += (ty - st.y) * a;
    if (Math.abs(ty - st.y) < 0.3) st.y = ty;
    // scroll speed drives a pitch spring and a little stretch on the plane
    const v = (st.y - prev) / dt / LAY.H;
    if (!QA) {
      const target = clamp(-v * 2.2, -7, 7);
      st.pv += ((target - st.pitch) * 90 - st.pv * 2 * 0.42 * Math.sqrt(90)) * dt;
      st.pitch += st.pv * dt;
      const ts = clamp(Math.abs(v) * 0.03, 0, 0.06);
      st.sv += ((ts - st.str) * 160 - st.sv * 2 * 0.5 * Math.sqrt(160)) * dt;
      st.str += st.sv * dt;
    }
    apply(st.y, now, ty);
    const settling = Math.abs(st.pv) + Math.abs(st.pitch) * 0.2 + Math.abs(st.sv) + Math.abs(st.str) > 0.002;
    if (st.y !== ty || settling) st.raf = requestAnimationFrame(frame);
    else st.last = 0;
  }
  const kick = () => {
    if (!st.raf) st.raf = requestAnimationFrame(frame);
  };

  function fontsReady() {
    const want = [document.fonts.load('800 100px "Bricolage Display"'), document.fonts.load('400 17px Bricolage'), document.fonts.load('700 17px Bricolage'), document.fonts.load('600 27px Caveat'), document.fonts.load('500 12px "IBM Plex Mono"')];
    return Promise.race([Promise.all(want), new Promise((r) => setTimeout(r, 2500))]);
  }

  let globeReveal = 1;
  let globeK = 'hero';
  let globeAnim = 0;
  let planHover = null;
  let planNow = 0;
  const GLOBE_STOPS = [
    ['aa', 'American Airlines', 'side-r'],
    ['bsc', 'BSc Computer Science', 'side-r'],
    ['sandals', 'Sandals Resorts', 'side-r'],
    ['fluky', 'Fluky Factory', 'side-r'],
    ['move', 'The move', 'side-l'],
    ['booking', 'Booking.com', 'side-l'],
  ];

  function paintGlobe(host, k, reveal, withPins = true) {
    if (!host) return;
    host.innerHTML = globeSvg(reveal, k, withPins);
  }

  function markGlobeStops() {
    for (const b of $$('.gstop')) b.classList.toggle('on', b.dataset.stop === globeK);
  }

  function setGlobeStop(k) {
    if (!k) return;
    if (k === 'plan') k = 'hero';
    globeK = k;
    paintGlobe($('#globeBtn'), globeK, 1, true);
    const art = $('#globeArt');
    if ($('#globeOverlay') && !$('#globeOverlay').hidden && art) paintGlobe(art, globeK, STATIC ? 1 : globeReveal, false);
    markGlobeStops();
  }

  function syncMotionToggle() {
    const btn = $('#motionToggle');
    if (!btn) return;
    const on = root.dataset.motion === 'calm';
    btn.setAttribute('aria-pressed', String(on));
    const long = btn.querySelector('.mt-s-long');
    const short = btn.querySelector('.mt-s-short');
    if (long) long.textContent = on ? 'Full flight' : 'Just the info';
    if (short) short.textContent = on ? 'Flight' : 'Info';
  }

  function setupMotionToggle() {
    syncMotionToggle();
    $('#motionToggle')?.addEventListener('click', () => {
      const next = root.dataset.motion === 'calm' ? 'full' : 'calm';
      writeStoredMotion(next);
      const u = new URL(location.href);
      u.searchParams.delete('layout');
      if (u.searchParams.has('motion')) u.searchParams.set('motion', next === 'full' ? 'on' : 'calm');
      location.assign(`${u.pathname}${u.search}${u.hash}`);
    });
  }

  function setupMore() {
    for (const btn of $$('.more-btn')) {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        const body = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(open));
        body.hidden = !open;
        if (!STATIC && LAY) {
          layout();
          st.y = scrollY - LAY.top;
          apply(st.y, performance.now());
          kick();
        } else if (STATIC) buildStatic();
      });
    }
  }

  // stop buttons sit on their places; where several share one (three in Honduras, with Miami close by),
  // they spread apart until each 44 px target is clear of the others, and a short lead ties each back to its pin
  function layoutGlobeStops() {
    const host = $('#globeStops');
    const px = host?.getBoundingClientRect().width;
    if (!px) return;
    const u = 1000 / px;
    const gap = 50 * u;
    const pad = 24 * u;
    const B = $$('.gstop', host).map((el, i) => {
      const a = GLOBE[STOP_AT[el.dataset.stop]];
      // a deterministic start on a small fan, so equal anchors separate the same way every time
      const ang = Math.PI * (0.75 + i * 0.32);
      return { el, a, x: a[0] + Math.cos(ang) * 4, y: a[1] + Math.sin(ang) * 4 };
    });
    const pins = Object.keys(PLACE_T).map((k) => GLOBE[k]);
    for (let it = 0; it < 240; it++) {
      for (let i = 0; i < B.length; i++) {
        for (let j = i + 1; j < B.length; j++) {
          const dx = B[j].x - B[i].x;
          const dy = B[j].y - B[i].y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < gap) {
            const f = (gap - d) / 2 / d;
            B[i].x -= dx * f;
            B[i].y -= dy * f;
            B[j].x += dx * f;
            B[j].y += dy * f;
          }
        }
        // keep off the other places' pins so a lead never ends under someone else's button
        const b = B[i];
        for (const p of pins) {
          if (p === b.a) continue;
          const dx = b.x - p[0];
          const dy = b.y - p[1];
          const d = Math.hypot(dx, dy) || 1;
          const keep = gap * 0.62;
          if (d < keep) {
            b.x += (dx / d) * (keep - d);
            b.y += (dy / d) * (keep - d);
          }
        }
        b.x += (b.a[0] - b.x) * 0.04;
        b.y += (b.a[1] - b.y) * 0.04;
        b.x = clamp(b.x, pad, 1000 - pad);
        b.y = clamp(b.y, pad, 1000 - pad);
      }
    }
    let leads = '';
    for (const b of B) {
      b.el.style.left = `${N(b.x / 10)}%`;
      b.el.style.top = `${N(b.y / 10)}%`;
      b.el.classList.toggle('side-l', b.x > 560);
      b.el.classList.toggle('side-r', b.x <= 560);
      if (Math.hypot(b.x - b.a[0], b.y - b.a[1]) > 10 * u) leads += `<path d="M${N(b.a[0])} ${N(b.a[1])}L${N(b.x)} ${N(b.y)}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
    }
    const svg = $('.gleads', host);
    if (svg) svg.innerHTML = leads;
  }

  const GLOBE_PAD = 12;
  const GLOBE_GAP = 8;
  const GLOBE_SIZE = 72;
  function visibleBox(el) {
    if (!el || el.hidden) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return r;
  }
  function boxGap(a, b) {
    const overlapX = a.left < b.right && b.left < a.right;
    const overlapY = a.top < b.bottom && b.top < a.bottom;
    if (overlapX && overlapY) {
      return -Math.min(a.right - b.left, b.right - a.left, a.bottom - b.top, b.bottom - a.top);
    }
    const dx = Math.max(a.left - b.right, b.left - a.right, 0);
    const dy = Math.max(a.top - b.bottom, b.top - a.bottom, 0);
    if (overlapX) return dy;
    if (overlapY) return dx;
    return Math.hypot(dx, dy);
  }
  function placeGlobeDock() {
    const dock = $('#globeDock');
    if (!dock) return;
    const W = innerWidth;
    const H = innerHeight;
    const desk = W >= 560 && W / (svh() || H) >= 1.15;
    const mode = root.dataset.motion;
    const size = Math.max(visibleBox(dock)?.width || 0, GLOBE_SIZE);
    const pills = [...($('#topbar')?.children || [])].map(visibleBox).filter(Boolean);
    const chromeBottom = pills.reduce((m, p) => Math.max(m, p.bottom), 0);
    const tryPos = (left, top) => {
      const box = { left, top, right: left + size, bottom: top + size };
      if (box.left < GLOBE_PAD - 0.5 || box.top < GLOBE_PAD - 0.5 || box.right > W - GLOBE_PAD + 0.5 || box.bottom > H - GLOBE_PAD + 0.5) return null;
      for (const p of pills) {
        if (boxGap(box, p) < GLOBE_GAP) return null;
      }
      return box;
    };
    let box = null;
    if (mode === 'calm' || mode === 'reduce') {
      box = tryPos(W - GLOBE_PAD - size, GLOBE_PAD);
      if (!box && chromeBottom) box = tryPos(W - GLOBE_PAD - size, chromeBottom + GLOBE_GAP);
    } else if (!desk) {
      const top = chromeBottom ? chromeBottom + 12 : 68;
      box = tryPos(W - GLOBE_PAD - size, top);
    } else {
      box = tryPos(W - GLOBE_PAD - size, H - GLOBE_PAD - size);
    }
    if (!box && chromeBottom) box = tryPos(W - GLOBE_PAD - size, chromeBottom + GLOBE_GAP);
    if (!box) box = tryPos(W - GLOBE_PAD - size, H - GLOBE_PAD - size);
    if (!box && pills.length) {
      const rightPill = pills.reduce((a, b) => (a.right > b.right ? a : b));
      box = tryPos(rightPill.left - GLOBE_GAP - size, GLOBE_PAD);
    }
    if (!box) {
      box = { left: W - GLOBE_PAD - size, top: mode === 'full' && desk ? H - GLOBE_PAD - size : GLOBE_PAD };
    }
    dock.style.left = `${N(box.left)}px`;
    dock.style.top = `${N(box.top)}px`;
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
  }

  function setupGlobe() {
    const dock = $('#globeDock');
    const btn = $('#globeBtn');
    const overlay = $('#globeOverlay');
    const close = $('#globeClose');
    const stage = $('#globeArt');
    const stops = $('#globeStops');
    if (!dock || !btn || !overlay || !stage) return;
    dock.hidden = false;
    placeGlobeDock();
    paintGlobe(btn, globeK, 1, true);

    // hover opens the map, so the click that follows lands on the backdrop over the button; that click keeps it open
    let hovered = false;
    const shutGlobe = () => {
      hovered = false;
      overlay.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      cancelAnimationFrame(globeAnim);
      btn.focus();
    };

    if (stops && !stops.querySelector('.gstop')) {
      if (!stops.querySelector('svg.gleads'))
        stops.insertAdjacentHTML('afterbegin', '<svg class="gleads" viewBox="0 0 1000 1000" aria-hidden="true"></svg>');
      for (const [k, label] of GLOBE_STOPS) {
        const b = html(`<button class="gstop" type="button" data-stop="${k}"><span class="dot" aria-hidden="true"></span><span class="lab">${label}</span></button>`);
        b.lmStop = 1;
        b.addEventListener('click', () => {
          shutGlobe();
          goStop(k, btn);
        });
        stops.appendChild(b);
      }
    }
    // Stops stamped from the timeline (Astro) already exist. Bind those too.
    for (const b of $$('.gstop', stops || document)) {
      if (b.lmStop) continue;
      b.lmStop = 1;
      b.addEventListener('click', () => {
        shutGlobe();
        goStop(b.dataset.stop, btn);
      });
    }
    markGlobeStops();

    const openGlobe = () => {
      overlay.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      close.focus();
      layoutGlobeStops();
      if (STATIC) {
        globeReveal = 1;
        paintGlobe(stage, globeK, 1, false);
        return;
      }
      globeReveal = 0;
      paintGlobe(stage, globeK, 0, false);
      const t0 = performance.now();
      const run = (now) => {
        globeReveal = clamp((now - t0) / 2200, 0, 1);
        paintGlobe(stage, globeK, globeReveal, false);
        if (globeReveal < 1) globeAnim = requestAnimationFrame(run);
      };
      cancelAnimationFrame(globeAnim);
      globeAnim = requestAnimationFrame(run);
    };

    addEventListener('resize', () => {
      if (!overlay.hidden) layoutGlobeStops();
    });
    btn.addEventListener('click', () => {
      if (overlay.hidden) openGlobe();
      else if (hovered) hovered = false;
      else shutGlobe();
    });
    close.addEventListener('click', shutGlobe);
    overlay.addEventListener('click', (e) => {
      if (e.target !== overlay) return;
      const r = btn.getBoundingClientRect();
      if (hovered && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) hovered = false;
      else shutGlobe();
    });
    addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' && !overlay.hidden) shutGlobe();
      },
      { passive: true },
    );
    if (FINE && !QA) {
      btn.addEventListener('mouseenter', () => {
        if (!overlay.hidden) return;
        openGlobe();
        hovered = true;
      });
    }
  }

  function watchStaticStops() {
    const io = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const cp = $('.copy', e.target) || e.target;
          const k = cp.dataset?.k;
          if (!k) continue;
          if (!best || e.intersectionRatio > best.r) best = { k, r: e.intersectionRatio };
        }
        if (best) setGlobeStop(best.k);
      },
      { threshold: [0.25, 0.5, 0.75] },
    );
    for (const fr of $$('.frame')) io.observe(fr);
  }

  function setupPause() {
    const btn = $('#pause');
    if (!btn) return;
    const show = root.dataset.motion === 'full';
    btn.hidden = !show;
    if (!show) return;
    if (root.classList.contains('paused')) btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      root.classList.toggle('paused', on);
      writeStoredPause(on);
      if (on) {
        clearTimeout(blinkT);
        clearTimeout(glanceT);
      } else {
        blinkLoop();
        glanceLoop();
      }
    });
  }
  function startAvatarIdle() {
    setupPause();
    setupCalmAvatarCue();
    if (QA || !avatarLive()) return;
    if (root.dataset.motion === 'calm') {
      calmIdleStart = performance.now();
      calmIdleUntil = calmIdleStart + CALM_IDLE_LAST;
      blinkLoop(400);
      glanceLoop(350);
      clearTimeout(calmIdleT);
      clearTimeout(calmSnapT);
      calmIdleT = setTimeout(stopCalmIdle, CALM_IDLE_LAST);
      calmSnapT = setTimeout(snapCalmIdle, CALM_SNAP_MS);
      return;
    }
    blinkLoop();
    glanceLoop();
  }

  async function startMotion() {
    await fontsReady();
    buildHud();
    layout();
    st.y = scrollY - LAY.top;
    apply(st.y, performance.now());
    kick();
    addEventListener('scroll', kick, { passive: true });
    if (FINE)
      addEventListener(
        'pointermove',
        (e) => {
          rig.ptr = { x: e.clientX, y: e.clientY, t: performance.now() };
          kickRig();
        },
        { passive: true },
      );
    startAvatarIdle();
    setupGlobe();
    applyStopHash();
    let lastW = innerWidth;
    let lastH = innerHeight;
    const relayout = () => {
      layout();
      st.y = scrollY - LAY.top;
      apply(st.y, performance.now());
    };
    addEventListener('resize', () => {
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 140) return;
      lastW = innerWidth;
      lastH = innerHeight;
      relayout();
    });
    if (window.visualViewport) {
      let vvH = window.visualViewport.height;
      window.visualViewport.addEventListener('resize', () => {
        if (LAY?.desk) return;
        const nh = window.visualViewport.height;
        if (nh >= vvH - 2) return;
        vvH = nh;
        relayout();
      });
    }
  }

  /* ================= static version ================= */
  // each caption gets a still of its scene at the moment it is read, composed as in the motion version
  // [scene, plane] clocks; in Amsterdam the stamp is down, and on phones the plane is still on approach above the card
  function restTau(k, S2, desk) {
    if (k === 'hero') return [0, 0];
    if (k === 'booking') return [S2.body[1] - 0.05, desk ? S2.body[1] - 0.05 : S2.wIn + 1.45];
    const t = k === 'plan' ? S2.body[0] + 1.5 : S2.body[0] + 0.45;
    return [t, t];
  }
  function buildStatic() {
    for (const n of $$('body > .note')) n.remove();
    const host = $('#copies');
    for (const cp of copies) host.appendChild(cp);
    for (const f of $$('.frame', host)) f.remove();
    applyMotion('full');
    layout();
    applyMotion(MOTION);
    spacer.style.height = '';
    $('.arr', contact).style.maxWidth = '';
    const { H, Hs, desk, scenes, cap } = LAY;
    for (const [i, cp] of copies.entries()) {
      const k = cp.dataset.k;
      const sc = scenes[k];
      const [tau, tp] = restTau(k, sc.S, desk);
      placeLayers(sc, sc.cam(tau));
      sc.update?.(tau, sc.ly);
      sc.ly.title?.ttl.classList.add('on');
      sc.b.classList.remove('off');
      sc.f.classList.remove('off');
      sc.b.style.zIndex = 1;
      sc.f.style.zIndex = 4;
      const fig = html(`<div class="fig" aria-hidden="true" style="height:${N(Hs)}px"></div>`);
      fig.append(sc.b, sc.f);
      const p = sc.plane(tp);
      if (p.o > 0) {
        const pe = html(planeHTML(`s${i}`, planeCls(p), `;transform:${planeTf(p)}`));
        $('.gM', pe).style.transform = gearTf(p.gear, -96);
        $('.gN', pe).style.transform = gearTf(p.gear, 100);
        fig.append(pe);
      }
      fig.insertAdjacentHTML('beforeend', grainHTML());
      const fr = html(`<div class="frame" data-stop="${k}" style="background:${sc.foot}"></div>`);
      host.appendChild(fr);
      fr.append(fig, cp);
      cp.classList.remove('ov', 'on', 'sh');
      cp.style.height = '';
      // cards sit where the motion version shows them; a card too tall for that spot grows the frame downward
      const h = cp.offsetHeight;
      const c = cap[k];
      let top;
      if (desk && k !== 'hero') top = Math.max(H * 0.95 - h, sc.title.y + sc.title.h + H * 0.03);
      else if (desk) top = c.top;
      else {
        const bottom = portChrome().bottom;
        top = Math.max(H - bottom - h, c.top - 10);
        const titleClear = sc.title.y + sc.title.h + H * 0.045;
        top = Math.max(top, titleClear);
        if (top + h > H - bottom) top = Math.max(titleClear, H - bottom - h);
      }
      cp.style.top = `${N(top)}px`;
      fr.style.height = `${N(Math.max(Hs, top + h + (desk ? H * 0.05 : portChrome().bottom)))}px`;
      const b = sc.hud(tau);
      const box = { ...b, y: b.y + (desk && k !== 'hero' ? 0 : top - c.top) };
      const e = STATIC_EXPR[k] || sc.expr(tau);
      const hint = k === 'hero' && !!sc.hint?.(tau);
      const hd = html(`<div class="hud${hint ? ' hint' : ''}" style="left:${N(box.x)}px;top:${N(box.y)}px;width:${N((box.h * 200) / 240)}px;height:${N(box.h)}px"><button type="button" class="lu-hit" aria-label="Say hi to Luis"><svg class="lu${e ? ` ex-${e}` : ''}" data-ex="${e}" viewBox="0 0 200 240">${luisSVG(`s${i}`)}</svg></button>${hint ? NOTE : ''}</div>`);
      fr.appendChild(hd);
      const [gx, gy] = e === 'sleep' ? SLEEP : gaze(box, sc.look(tau));
      poseLuis(rigParts($('.lu', hd)), gx, gy, { tilt: e === 'sleep' ? 9 : 0 });
      fr.lmGaze = e === 'sleep' ? [-0.35, 0.5, 9] : [gx, gy, 0];
      const tl = $('.tl', fig);
      if (tl) {
        if (e) tl.classList.add(`ex-${e}`);
        poseTiny(tl, gx, gy, { tilt: e === 'sleep' ? 9 : 0 });
      }
      if (hint && p.o > 0) {
        const svg = html(`<svg class="seat-line" aria-hidden="true" width="100%" height="100%"><path stroke="#fff6e4" stroke-width="8.6" pathLength="1"/><path stroke="#2b1b14" stroke-width="2.6" pathLength="1"/></svg>`);
        fr.appendChild(svg);
        const paintStaticSeat = () => {
          const tower = towerRect($('.bcn', fig));
          const titleRect = $('.ttl', fig)?.getBoundingClientRect();
          const pills = seatPills();
          const note = seatNoteEl(hd) || seatNoteEl(fr);
          if (!note) return;
          const hudRect = hd.getBoundingClientRect();
          const route = seatRoute(
            {
              ...seatWindow(p),
              note: note?.getBoundingClientRect(),
              noteEl: note,
              noteHost: fr,
              hud: hudRect,
              card: seatCardRect(cp),
              title: titleRect,
              pills,
              avoid: [titleRect, hudRect, tower, ...pills],
              W: innerWidth,
              H: innerHeight,
            },
            {},
          );
          svg.classList.toggle('behind', route.behind);
          svg.classList.toggle('on', !!route.d);
          for (const path of $$('path', svg)) path.setAttribute('d', route.d);
        };
        paintStaticSeat();
        requestAnimationFrame(paintStaticSeat);
      }
    }
    stage.innerHTML = '';
  }
  async function startStatic() {
    await fontsReady();
    buildStatic();
    startAvatarIdle();
    setupGlobe();
    watchStaticStops();
    applyStopHash();
    let lastW = innerWidth;
    addEventListener('resize', () => {
      if (innerWidth === lastW) return;
      lastW = innerWidth;
      buildStatic();
    });
  }

  function setupExternalLinks() {
    for (const a of $$('a[href^="http"]')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      if (!a.querySelector('.vh')) {
        const s = document.createElement('span');
        s.className = 'vh';
        s.textContent = ' (opens in a new tab)';
        a.appendChild(s);
      }
    }
  }
  // a jump hands focus back to the control that asked when the heading cannot take it; a plan row that has
  // scrolled away is hidden too, so the globe button takes it then, and the stop is read out
  function focusStopHeading(k, from) {
    const h = $(`#h-${k}`);
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    if (!from || (h && document.activeElement === h)) return;
    for (const el of [from, $('#globeBtn')]) {
      el?.focus({ preventScroll: true });
      if (el && document.activeElement === el) break;
    }
    const live = $('#stopLive');
    if (!live || !h) return;
    live.textContent = '';
    setTimeout(() => {
      live.textContent = h.textContent;
    }, 60);
  }
  function whenStopRevealed(k, cb) {
    const cp = $(`.copy[data-k="${k}"]`);
    if (!cp || cp.classList.contains('on')) {
      cb();
      return;
    }
    let done = false;
    let raf = 0;
    const finish = () => {
      if (done) return;
      done = true;
      obs.disconnect();
      cancelAnimationFrame(raf);
      cb();
    };
    const obs = new MutationObserver(() => {
      if (cp.classList.contains('on')) finish();
    });
    obs.observe(cp, { attributes: true, attributeFilter: ['class'] });
    // a slow machine gets enough frames to show the card, not just the clock
    const t0 = performance.now();
    let frames = 0;
    const wait = () => {
      if (performance.now() - t0 > 3200 && ++frames > 12) finish();
      else raf = requestAnimationFrame(wait);
    };
    raf = requestAnimationFrame(wait);
  }
  function afterScrollFocusStop(k, instant, from) {
    const focus = () => whenStopRevealed(k, () => focusStopHeading(k, from));
    if (instant) {
      focus();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      focus();
    };
    addEventListener('scrollend', finish, { once: true, passive: true });
    setTimeout(finish, 1400);
  }
  function stopFromHash() {
    const m = /^#stop-([a-z]+)$/.exec(location.hash);
    return m?.[1] || null;
  }
  function applyStopHash() {
    const k = stopFromHash();
    if (!k) return;
    if (STATIC) {
      const el = document.getElementById(`stop-${k}`) || $(`.copy[data-k="${k}"]`);
      el?.scrollIntoView({ behavior: 'instant', block: 'start' });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => focusStopHeading(k));
      });
      return;
    }
    if (!LAY) return;
    const m = moments();
    if (m[k] == null) return;
    scrollTo({ top: m[k], behavior: 'instant' });
    st.y = m[k] - LAY.top;
    apply(st.y, performance.now());
    kick();
    afterScrollFocusStop(k, true);
  }
  function goStop(k, from) {
    if (!k) return;
    const instant = STATIC || mq.matches;
    if (STATIC) {
      const fr = $(`.frame[data-stop="${k}"]`) || $(`#stop-${k}`);
      fr?.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'start' });
      afterScrollFocusStop(k, instant, from);
      return;
    }
    if (LAY) {
      const m = moments();
      if (m[k] != null) scrollTo({ top: m[k], behavior: instant ? 'instant' : 'smooth' });
    }
    afterScrollFocusStop(k, instant, from);
  }
  function aimPlan(k) {
    planHover = k || null;
    if (STATIC) {
      planNow = STOP_T[k] ?? 0;
      const sc = LAY?.scenes?.plan;
      if (sc?.update) {
        const [tau] = restTau('plan', sc.S, LAY.desk);
        sc.update(tau, sc.ly);
      }
      return;
    }
    if (root.classList.contains('paused')) planNow = STOP_T[k] ?? 0;
    kick();
  }
  function setupPlanJumps() {
    const leave = (ev) => {
      if (ev.relatedTarget?.closest?.('.plan-jump')) return;
      aimPlan(null);
    };
    for (const a of $$('.plan-jump')) {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        goStop(a.dataset.stop, a);
      });
      a.addEventListener('pointerenter', () => aimPlan(a.dataset.stop));
      a.addEventListener('focus', () => aimPlan(a.dataset.stop));
      a.addEventListener('pointerleave', leave);
      a.addEventListener('blur', leave);
    }
  }

  setupExternalLinks();
  setupMotionToggle();
  setupMore();
  setupPlanJumps();
  setupAvatarReact();
  if (STATIC) startStatic();
  else startMotion();
})();

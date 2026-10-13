// Consent-gated Google Analytics 4 for luismatute.me.
// Injected at build time by scripts/prototype-analytics.mjs (the design file is
// not edited). Nothing talks to Google until the visitor presses Accept: gtag.js
// is not even requested before that. See docs/analytics.md for the event list.
(() => {
  const ID = 'G-S5PNJ7M4V3';
  const KEY = 'lm.consent'; // localStorage: {"v":1,"choice":"granted"|"denied","ts":<ms>}
  // Bump VERSION when what we collect changes: everyone is asked again.
  const VERSION = 1;
  const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // re-ask after 12 months
  const SEEN = 'lm.stops'; // sessionStorage, written only after consent
  const PENDING = 'lm.pending'; // sessionStorage, an event parked across a reload
  const root = document.documentElement;
  const banner = document.getElementById('cc');

  const readChoice = () => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!c || c.v !== VERSION || typeof c.ts !== 'number') return null;
      const age = Date.now() - c.ts;
      if (age > MAX_AGE || age < -24 * 60 * 60 * 1000) return null;
      return c.choice === 'granted' || c.choice === 'denied' ? c.choice : null;
    } catch {
      return null;
    }
  };
  const writeChoice = (choice) => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ v: VERSION, choice, ts: Date.now() }),
      );
    } catch {}
  };

  // ---- gtag, loaded only after Accept -------------------------------------
  let granted = false;
  let loaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    // biome-ignore lint/complexity/noArguments: gtag.js expects the Arguments object, not an array.
    window.dataLayer.push(arguments);
  }

  // page_location without query string or hash, except the campaign tags;
  // same for a same-site referrer. Other referrers keep only their origin.
  const KEEP = ['utm_source', 'utm_medium', 'utm_campaign'];
  const clean = (href) => {
    const u = new URL(href, location.href);
    const q = new URLSearchParams();
    for (const k of KEEP)
      if (u.searchParams.has(k)) q.set(k, u.searchParams.get(k));
    const qs = q.toString();
    return `${u.origin}${u.pathname}${qs ? `?${qs}` : ''}`;
  };
  const referrer = () => {
    try {
      if (!document.referrer) return undefined;
      const r = new URL(document.referrer);
      return r.origin === location.origin ? clean(r.href) : `${r.origin}/`;
    } catch {
      return undefined;
    }
  };

  function startGa() {
    granted = true;
    window[`ga-disable-${ID}`] = false;
    if (loaded) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    loaded = true;
    // Consent Mode v2: everything denied by default, set before gtag.js loads.
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    gtag('set', 'ads_data_redaction', true);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', ID, {
      page_location: clean(location.href),
      page_referrer: referrer(),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
    document.head.appendChild(s);
  }

  function stopGa() {
    granted = false;
    if (!loaded) return;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    window[`ga-disable-${ID}`] = true;
    // Drop the GA cookies set while consent was given.
    const host = location.hostname;
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim();
      if (!/^_ga(_|$)/.test(name)) continue;
      for (const domain of [
        '',
        `; domain=${host}`,
        `; domain=.${host.replace(/^www\./, '')}`,
      ]) {
        // biome-ignore lint/suspicious/noDocumentCookie: expiring GA cookies; Cookie Store API is not in Safari.
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
      }
    }
  }

  const track = (name, params = {}) => {
    if (granted) gtag('event', name, params);
  };

  // ---- banner ---------------------------------------------------------------
  // The banner takes the first free slot (no overlap with the stop cards, the
  // boarding pass, the globe button or the top bar). Slots are CSS classes; the
  // banner is re-checked on scroll and resize while it is open. A slot change
  // hides it for a frame first, so it never counts as a layout shift.
  const SLOTS = ['s-bl', 's-br', 's-tr', 's-tl'];
  const AVOID =
    '.card, .pass, .globe-btn, .motion-toggle, .pause, .hud .lu, #h-contact, #contact a, [data-cc-avoid]';
  // Phones at 320px and phones in landscape get a compact one-line banner. If
  // even that finds no free slot, it sits at the bottom and lifts the card
  // layer (and the avatar and a bottom globe button) by its height.
  const COMPACT = matchMedia('(max-width: 360px), (max-height: 430px)');
  const LIFT = 's-lift';
  let slot = null;
  let pending = false;

  const visibleRects = () => {
    const out = [];
    for (const el of document.querySelectorAll(AVOID)) {
      if (banner.contains(el)) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight)
        continue;
      const cs = getComputedStyle(el);
      if (
        cs.visibility === 'hidden' ||
        Number(cs.opacity) < 0.05 ||
        cs.display === 'none'
      )
        continue;
      // In-flow content (the contact section) scrolls; the page gets bottom
      // padding when the banner sits at the bottom, so it can scroll clear.
      r.inFlow = !!el.closest('#contact');
      out.push(r);
    }
    return out;
  };
  const overlap = (a, b) =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  const ALL = [...SLOTS, LIFT];
  const setSlot = (s) => {
    banner.classList.remove(...ALL);
    if (s) banner.classList.add(s);
  };

  // How far the card layer must move up to clear a bottom banner, or null if
  // that would push a card into the top bar or the globe button.
  const LIFTED = '.copy, .pass, .hud .lu';
  const FIXED = '.motion-toggle, .pause, .globe-btn';
  function liftBy() {
    setSlot(LIFT);
    const top = banner.getBoundingClientRect().top;
    const shown = (sel) =>
      [...document.querySelectorAll(sel)].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return (
          r.width &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          cs.visibility !== 'hidden' &&
          Number(cs.opacity) >= 0.05
        );
      });
    const cards = shown(LIFTED).map((el) => el.getBoundingClientRect());
    const lift = Math.ceil(
      Math.max(0, ...cards.map((r) => r.bottom + 6 - top)),
    );
    // The bottom globe button (landscape) moves up too.
    const fixed = shown(FIXED)
      .filter((el) => !(el.matches('.globe-btn') && root.matches('.m-desk')))
      .map((el) => el.getBoundingClientRect());
    for (const c of cards)
      for (const f of fixed) {
        const xs = Math.min(c.right, f.right) - Math.max(c.left, f.left);
        if (xs > 0 && c.top - lift < f.bottom + 6 && c.bottom - lift > f.top)
          return null;
      }
    return lift;
  }

  function place() {
    pending = false;
    if (!open || banner.hidden) return;
    const compact = COMPACT.matches;
    banner.classList.toggle('cc-compact', compact);
    // Pages in normal flow (no motion, or the /ui/ docs: data-cc-flow) pin the
    // banner to the bottom and pad the page end.
    const isStatic =
      root.classList.contains('is-static') || 'ccFlow' in root.dataset;
    let best;
    let padEnd = false;
    if (compact && !isStatic && root.classList.contains('cc-lift')) {
      best = LIFT; // once lifted, stay lifted until the banner closes
    } else {
      root.classList.remove('cc-lift');
      const obstacles = visibleRects();
      const cost = (s, fixedOnly = false) => {
        setSlot(s);
        const r = banner.getBoundingClientRect();
        const pad = {
          left: r.left - 6,
          right: r.right + 6,
          top: r.top - 6,
          bottom: r.bottom + 6,
        };
        return obstacles.reduce(
          (sum, o) => sum + (fixedOnly && o.inFlow ? 0 : overlap(pad, o)),
          0,
        );
      };
      const costs = Object.fromEntries(SLOTS.map((s) => [s, cost(s)]));
      const free = SLOTS.find((s) => costs[s] === 0);
      if (slot && costs[slot] === 0)
        best = slot; // keep a slot while it is free
      else if (free) best = free;
      else if (isStatic) {
        // No motion: the cards scroll in normal flow, so nothing stays covered.
        // Pin to the bottom and pad the page so its end can scroll clear.
        best = 's-bl';
      } else if (compact && liftBy() !== null) {
        best = LIFT;
      } else if (cost('s-bl', true) === 0) {
        best = 's-bl'; // only in-flow content below it: pad the page end
        padEnd = true;
      } else {
        // Nothing free: least overlap, without jumping around for small gains.
        best = SLOTS.reduce((m, s) => (costs[s] < costs[m] ? s : m));
        if (slot && costs[best] > costs[slot] * 0.5) best = slot;
      }
    }
    if (best === LIFT && !root.classList.contains('cc-lift')) {
      root.style.setProperty('--cc-lift', `${liftBy()}px`);
      root.classList.add('cc-lift');
    }
    // Static page, or lifted: pad the end of the page (once, and only ever
    // grow it) so the in-flow content, like the contact section, can scroll
    // clear of the banner. The padding never moves anything above it.
    if (isStatic || best === LIFT || padEnd) {
      setSlot(best);
      const h = Math.ceil(banner.offsetHeight + 24);
      if (h > (parseFloat(root.style.getPropertyValue('--cc-h')) || 0))
        root.style.setProperty('--cc-h', `${h}px`);
      root.classList.add('cc-pad');
    }
    // Measuring moved the banner; put it back where it is shown right now.
    setSlot(slot);
    if (best === slot) return;
    slot = best;
    // Take it out of layout for a frame, move it, show it again (fade unless
    // reduced motion): it reappears rather than moves, so no layout shift.
    const firstShow = banner.classList.contains('cc-moving');
    if (!firstShow) banner.hidden = true;
    banner.classList.remove('cc-in');
    requestAnimationFrame(() => {
      setSlot(slot);
      requestAnimationFrame(() => {
        if (!open) return;
        banner.hidden = false;
        banner.classList.remove('cc-moving');
        banner.classList.add('cc-in');
      });
    });
  }
  const schedule = () => {
    if (!pending && open && !banner.hidden) {
      pending = true;
      requestAnimationFrame(place);
    }
  };

  let timer = 0;
  let opener = null;
  let open = false;
  function openBanner() {
    if (!banner || open) return;
    open = true;
    banner.hidden = false;
    banner.classList.remove('cc-in');
    banner.classList.add('cc-moving');
    slot = null;
    schedule();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    // Cards fade in and out after scrolling stops, so keep checking while open.
    timer = setInterval(schedule, 400);
  }
  function closeBanner() {
    if (!banner) return;
    open = false;
    banner.hidden = true;
    banner.classList.remove('cc-in');
    root.classList.remove('cc-pad', 'cc-lift');
    clearInterval(timer);
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
  }

  function choose(choice) {
    writeChoice(choice);
    const hadFocus = banner?.contains(document.activeElement);
    closeBanner();
    if (choice === 'granted') {
      startGa();
      catchUp();
      onScroll();
    } else stopGa();
    // Don't strand keyboard users on a hidden element: back to the "Cookie
    // settings" button that opened it, else to the next thing in the page.
    const back =
      opener || document.querySelector('.skip, main a[href], main button');
    opener = null;
    if (hadFocus) back?.focus({ preventScroll: true });
  }

  // ---- events (sent only while consent is granted) --------------------------
  const stopOf = (el) => {
    const k = el?.closest?.('[data-k]')?.dataset.k;
    return k && k !== 'hero' && k !== 'plan' ? k : undefined;
  };
  const text = (el) =>
    (el?.textContent || '')
      .replace(/\(opens in a new tab\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  const CONTACT = {
    'mailto:': 'email',
    'x.com': 'x',
    'twitter.com': 'x',
    'github.com': 'github',
  };

  // Capture phase: runs before the page's own handlers (the motion toggle
  // reloads the page), so state is read before the click changes it.
  document.addEventListener(
    'click',
    (ev) => {
      const t = ev.target instanceof Element ? ev.target : null;
      if (!t) return;
      const cc = t.closest('[data-cc]');
      if (cc) return choose(cc.dataset.cc === 'granted' ? 'granted' : 'denied');
      if (t.closest('[data-cc-open]')) {
        opener = t.closest('[data-cc-open]');
        return openBanner();
      }
      if (!granted) return;

      const a = t.closest('a[href]');
      if (a) {
        const href = a.getAttribute('href');
        if (a.closest('#contact')) {
          const method = Object.entries(CONTACT).find(([k]) =>
            href.includes(k),
          )?.[1];
          if (method)
            track('contact_click', {
              method,
              link_url: href.startsWith('mailto:') ? 'mailto' : a.href,
            });
        }
        let url = null;
        try {
          url = new URL(a.href);
        } catch {}
        if (
          url &&
          /^https?:$/.test(url.protocol) &&
          url.hostname !== location.hostname
        ) {
          const label =
            text(a.querySelector('.shot-cap')) ||
            a.querySelector('img[alt]')?.getAttribute('alt') ||
            a.getAttribute('aria-label') ||
            text(a);
          track('outbound_click', {
            link_url: url.href,
            link_domain: url.hostname,
            link_text: label.slice(0, 100),
            stop_id: stopOf(a),
            link_kind: a.matches('.shot-link') ? 'screenshot' : 'link',
          });
        }
        if (a.matches('.plan-jump'))
          track('flight_plan_click', { stop_id: a.dataset.stop });
        return;
      }
      const more = t.closest('.more-btn');
      if (more) {
        if (more.getAttribute('aria-expanded') !== 'true')
          track('more_open', {
            stop_id:
              stopOf(more) ||
              more.getAttribute('aria-controls')?.replace(/^more-/, ''),
          });
        return;
      }
      const gstop = t.closest('.gstop[data-stop]');
      if (gstop)
        return track('globe_stop_click', { stop_id: gstop.dataset.stop });
      const globe = t.closest('#globeBtn, .globe-btn');
      if (globe) {
        if (globe.getAttribute('aria-expanded') !== 'true') track('globe_open');
        return;
      }
      if (t.closest('#motionToggle, .motion-toggle')) {
        // Pressing it switches between the full flight and "just the info".
        // The page reloads straight away, so the event is parked in
        // sessionStorage and sent by the next page load.
        const willAnimate = root.classList.contains('is-static');
        try {
          sessionStorage.setItem(
            PENDING,
            JSON.stringify([
              'motion_toggle',
              { motion: willAnimate ? 'on' : 'off' },
            ]),
          );
        } catch {
          track('motion_toggle', { motion: willAnimate ? 'on' : 'off' });
        }
        return;
      }
      const pause = t.closest('#pause, .pause');
      if (pause) {
        const pausing = pause.getAttribute('aria-pressed') !== 'true';
        return track('pause_toggle', { state: pausing ? 'paused' : 'playing' });
      }
    },
    true,
  );

  // avatar_click: the page announces each avatar reaction with an
  // `lm:avatar-react` event (PR #13): detail.reaction is the name (wave, wink,
  // wow, laugh, peace) and detail.index its index. No class sniffing.
  document.addEventListener('lm:avatar-react', (ev) => {
    const d = ev.detail || {};
    const name = typeof d.reaction === 'string' ? d.reaction : undefined;
    const index = Number.isInteger(d.index)
      ? d.index
      : Number.isInteger(d.reaction)
        ? d.reaction
        : undefined;
    track('avatar_click', {
      reaction: name ?? (index === undefined ? 'unknown' : String(index)),
      reaction_index: index,
    });
  });

  // stop_view: once per session per stop. With motion the cards are stacked in
  // a sticky layer and the visible one has .on; without motion they scroll in
  // normal flow, so an IntersectionObserver decides.
  const seen = new Set();
  try {
    for (const k of JSON.parse(sessionStorage.getItem(SEEN) || '[]'))
      seen.add(k);
  } catch {}
  const viewed = (k) => {
    if (!granted || !k || seen.has(k)) return;
    seen.add(k);
    try {
      sessionStorage.setItem(SEEN, JSON.stringify([...seen]));
    } catch {}
    track('stop_view', { stop_id: k });
  };
  const stops = () => document.querySelectorAll('[id^="stop-"][data-k]');
  const isMotion = () =>
    root.classList.contains('is-motion') &&
    !root.classList.contains('is-static');
  const mo = new MutationObserver((list) => {
    if (!isMotion()) return;
    for (const m of list)
      if (m.target.classList.contains('on')) viewed(m.target.dataset.k);
  });
  const io = new IntersectionObserver(
    (entries) => {
      if (isMotion()) return;
      for (const e of entries) if (e.isIntersecting) viewed(e.target.dataset.k);
    },
    { threshold: 0.5 },
  );
  const watchStops = () => {
    for (const el of stops()) {
      mo.observe(el, { attributes: true, attributeFilter: ['class'] });
      io.observe(el);
    }
    catchUp();
  };
  // The stop already on screen when consent is given counts as viewed.
  function catchUp() {
    if (!isMotion()) return;
    for (const el of stops())
      if (el.classList.contains('on')) viewed(el.dataset.k);
  }

  // scroll_depth: 25/50/75/100 once per page load.
  const depths = new Set();
  const onScroll = () => {
    if (!granted) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max <= 0 ? 100 : (scrollY / max) * 100;
    for (const d of [25, 50, 75, 100]) {
      if (pct >= d - 0.5 && !depths.has(d)) {
        depths.add(d);
        track('scroll_depth', { percent: d });
      }
    }
  };
  addEventListener('scroll', onScroll, { passive: true });

  // ---- start ------------------------------------------------------------------
  const choice = readChoice();
  if (choice === 'granted') startGa();
  // First show waits for the hero to settle (the boarding pass animates in),
  // so the banner picks its slot once instead of jumping.
  else if (choice === null)
    setTimeout(openBanner, document.readyState === 'complete' ? 600 : 900);
  try {
    const parked = JSON.parse(sessionStorage.getItem(PENDING) || 'null');
    sessionStorage.removeItem(PENDING);
    if (Array.isArray(parked)) track(parked[0], parked[1]);
  } catch {}
  watchStops();
  if (granted) onScroll();
  // Expose a tiny handle for debugging and tests (no data in it).
  window.lmConsent = { choice: () => readChoice(), open: openBanner };
})();

import { defineLmUi } from './ui/components/index.js';
      import { illustrationNames, inlineIllustration, tokens } from './ui/index.js';

      defineLmUi();

      const swatches = document.querySelector('#swatches');
      for (const [name, value] of Object.entries(tokens.color)) {
        if (typeof value !== 'string' || !value.startsWith('#')) continue;
        const el = document.createElement('div');
        el.className = 'swatch';
        const chip = document.createElement('i');
        chip.style.background = value;
        const label = document.createElement('span');
        label.textContent = `${name} ${value}`;
        el.append(chip, label);
        swatches.append(el);
      }

      const themes = document.querySelector('#themes');
      for (const [name, theme] of Object.entries(tokens.themes)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-card';
        btn.dataset.theme = name;
        const sky = theme.sky.map((hex) => `${hex} ${100 / theme.sky.length}%`).join(', ');
        const band = document.createElement('i');
        band.className = 'sky';
        band.style.display = 'block';
        band.style.height = '72px';
        band.style.background = `linear-gradient(${sky})`;
        const label = document.createElement('span');
        label.textContent = `${name} ${theme.label}`;
        btn.append(band, label);
        btn.addEventListener('click', () => {
          document.documentElement.dataset.theme = name;
          for (const card of themes.querySelectorAll('.theme-card')) card.classList.toggle('on', card === btn);
        });
        themes.append(btn);
      }

      const type = document.querySelector('#type');
      const samples = [
        ['display', 'Landed.', 'lm-display'],
        ['kicker', 'Stop 1 of 6', 'lm-kicker'],
        ['body', 'Born in Honduras. At Booking.com in Amsterdam since October 2017.', ''],
        ['hand', 'hola', 'lm-hand'],
      ];
      for (const [name, text, cls] of samples) {
        const p = document.createElement('p');
        p.className = `type-row ${cls}`.trim();
        p.textContent = text;
        p.title = name;
        type.append(p);
      }

      document.querySelector('#motion-note').textContent =
        `pop ${tokens.easing.pop} · out ${tokens.easing.out} · drop ${tokens.duration.drop} · sway ${tokens.duration.sway}`;

      const plan = document.querySelector('#plan');
      plan.stops = [
        { href: '#stop-aa', years: '2006–2011', label: 'American Airlines' },
        { href: '#stop-sandals', years: '2011–2017', label: 'Sandals Resorts' },
        { href: '#stop-bsc', years: '2012', label: 'BSc Computer Science' },
        { href: '#stop-fluky', years: 'c. 2012–2019', label: 'Fluky Factory' },
        { href: '#stop-move', years: '2017', label: 'The move' },
        { href: '#stop-booking', years: 'Since 2017', label: 'Booking.com' },
      ];

      const poses = document.querySelector('#poses');
      for (const pose of ['', 'wow', 'wave', 'read', 'beach', 'grad', 'sleep', 'wink', 'eek']) {
        const fig = document.createElement('figure');
        const avatar = document.createElement('lm-avatar');
        avatar.setAttribute('static', '');
        if (pose) avatar.setAttribute('pose', pose);
        avatar.setAttribute('label', pose ? `Luis, ${pose}` : 'Luis at the window');
        const cap = document.createElement('figcaption');
        cap.textContent = pose || 'rest';
        fig.append(avatar, cap);
        poses.append(fig);
      }

      const art = document.querySelector('#art');
      for (const name of illustrationNames()) {
        const fig = document.createElement('figure');
        fig.innerHTML = inlineIllustration(name, `kit-${name}`);
        const cap = document.createElement('figcaption');
        cap.textContent = name;
        fig.append(cap);
        art.append(fig);
      }

import { defineLmUi } from './ui/components/index.js';
      import { inlineIllustration } from './ui/index.js';

      defineLmUi();

      for (const el of document.querySelectorAll('[data-art]')) {
        el.innerHTML = inlineIllustration(el.dataset.art, `${el.dataset.art}-${el.className.replace(/\s+/g, '-')}`);
        if (el.classList.contains('sky') || el.classList.contains('sea')) {
          el.querySelector('svg')?.setAttribute('preserveAspectRatio', 'none');
        }
      }

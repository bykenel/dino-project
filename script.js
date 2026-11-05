import { Runner } from './resources/dino_game/offline.js';
import {
  applyStaticI18n,
  flagForToggle,
  langToggleAria,
  onLocaleChange,
  toggleLocale,
} from './resources/dino_game/i18n.js';

function syncLangButton() {
  const btn = document.querySelector('[data-lang-toggle]');
  if (!btn) {
    return;
  }
  btn.textContent = flagForToggle();
  btn.setAttribute('aria-label', langToggleAria());
}

function refreshPageI18n() {
  applyStaticI18n(document);
  syncLangButton();
}

window.addEventListener('load', () => {
  refreshPageI18n();

  const langBtn = document.querySelector('[data-lang-toggle]');
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLocale();
    });
  }

  onLocaleChange(() => {
    refreshPageI18n();
  });

  const trexGameContainer = document.querySelector('.trex-game');
  new Runner(trexGameContainer);
});

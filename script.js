import { Runner } from './resources/dino_game/offline.js';

window.addEventListener('load', () => {
  const trexGameContainer = document.querySelector('.trex-game');
  new Runner(trexGameContainer);
});

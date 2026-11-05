/**
 * Desert Revenge — pt-BR / en-US UI strings.
 */

const LOCALE_KEY = "revengeLocale";
const DEFAULT_LOCALE = "pt-BR";
const LOCALES = ["pt-BR", "en-US"];

const STRINGS = {
  "pt-BR": {
    subtitle: "Minere ossos, pare o dinossauro!",
    credit: "Baseado no T-Rex Runner do Chromium",
    ranking: "Ranking",
    rankingNote: "Melhores tempos neste navegador",
    rankingEmpty: "Nenhum tempo salvo ainda.",
    rankingColRank: "#",
    rankingColNick: "Nick",
    rankingColTime: "Tempo",
    rankingColEscape: "Fuga",
    rankingColBones: "Ossos",
    rankingClose: "Fechar",
    statBones: "Ossos",
    statWave: "Onda",
    statClick: "Por clique",
    statPassive: "Passivo",
    statHp: "Vida do Dino",
    statEscape: "Fuga",
    clicker: "Minerar Ossos",
    clickerAria: "Minerar ossos",
    hintWave: "Onda aumenta o ganho por clique, mas o dino fica mais esperto!",
    hintPause: "[P] pausa",
    paused: "Pausado",
    "hazard.bush": "Cacto",
    "hazard.ptero": "Pterodáctilo",
    "hazard.boulder": "Cacto Grande",
    "hazard.meteor": "Meteoro",
    startBlurb:
      "Impeça o dinossauro antes que ele consiga escapar! Colete ossos, posicione obstáculos pelo caminho e dispare meteoros para vencer.",
    start: "Iniciar",
    restart: "Jogar Novamente",
    submit: "Enviar",
    endTitle: "Fim de jogo",
    victoryTitle: "Vitória",
    victoryLead: "O deserto não perdoa... o dinossauro foi derrotado!",
    victoryStats:
      "Fuga: {escape}% \nTempo: {time}s \nOssos gastos: {bones}",
    victoryRecord: "Novo recorde!",
    victoryBestEscape: "Melhor fuga: {escape}%",
    victoryBestTime: "Melhor tempo: {time}s",
    defeatTitle: "Derrota",
    defeatClose: "Quase! O dinossauro escapou. Tente de novo!",
    defeatFar: "O dinossauro escapou. Tente de novo!",
    defeatStats: "Vida restante: {hp}/{maxHp} \nOssos gastos: {bones}",
    defeatTip:
      "Dica: \n[3] Cacto Grande + [2] Pterodáctilo \ncausam dano extra.",
    nickLabel: "Nick (3 letras)",
    nickAria: "Nick de 3 letras",
    scoreInvalid: "Use exatamente 3 letras (A–Z).",
    scoreNotBetter: "Tempo não melhorou para este nick.",
    scoreCreated: "Salvo no ranking!",
    scoreImproved: "Novo melhor tempo!",
    combo: "Combo!",
    langAria: "Mudar para inglês",
  },
  "en-US": {
    subtitle: "Mine bones, stop the dinosaur!",
    credit: "Based on Chromium's T-Rex Runner",
    ranking: "Ranking",
    rankingNote: "Best times on this browser",
    rankingEmpty: "No times saved yet.",
    rankingColRank: "#",
    rankingColNick: "Nick",
    rankingColTime: "Time",
    rankingColEscape: "Escape",
    rankingColBones: "Bones",
    rankingClose: "Close",
    statBones: "Bones",
    statWave: "Wave",
    statClick: "Per click",
    statPassive: "Passive",
    statHp: "Dino HP",
    statEscape: "Escape",
    clicker: "Mine Bones",
    clickerAria: "Mine bones",
    hintWave: "Wave boosts click reward, but the dino gets smarter!",
    hintPause: "[P] pause",
    paused: "Paused",
    "hazard.bush": "Cactus",
    "hazard.ptero": "Pterodactyl",
    "hazard.boulder": "Big Cactus",
    "hazard.meteor": "Meteor",
    startBlurb:
      "Stop the dinosaur before it escapes! Collect bones, drop hazards on the track, and fire meteors to win.",
    start: "Start",
    restart: "Play Again",
    submit: "Submit",
    endTitle: "Game over",
    victoryTitle: "Victory",
    victoryLead: "The desert shows no mercy... the dinosaur is down!",
    victoryStats:
      "Escape: {escape}% \nTime: {time}s \nBones spent: {bones}",
    victoryRecord: "New record!",
    victoryBestEscape: "Best escape: {escape}%",
    victoryBestTime: "Best time: {time}s",
    defeatTitle: "Defeat",
    defeatClose: "So close! The dinosaur got away. Try again!",
    defeatFar: "The dinosaur escaped. Try again!",
    defeatStats: "HP left: {hp}/{maxHp} \nBones spent: {bones}",
    defeatTip:
      "Tip: \n[3] Big Cactus + [2] Pterodactyl \ndeal bonus damage.",
    nickLabel: "Nick (3 letters)",
    nickAria: "3-letter nick",
    scoreInvalid: "Use exactly 3 letters (A–Z).",
    scoreNotBetter: "Time did not improve for this nick.",
    scoreCreated: "Saved to the ranking!",
    scoreImproved: "New best time!",
    combo: "Combo!",
    langAria: "Switch to Portuguese",
  },
};

let currentLocale = DEFAULT_LOCALE;
const listeners = new Set();

function normalizeLocale(locale) {
  return LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

function readStoredLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_KEY));
  } catch (e) {
    return DEFAULT_LOCALE;
  }
}

function writeStoredLocale(locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch (e) {
    /* ignore */
  }
}

function applyHtmlLang(locale) {
  if (document.documentElement) {
    document.documentElement.lang = locale;
  }
}

/**
 * @param {string} key
 * @param {Object=} vars
 * @return {string}
 */
export function t(key, vars) {
  const dict = STRINGS[currentLocale] || STRINGS[DEFAULT_LOCALE];
  let text = dict[key];
  if (text == null) {
    text = STRINGS[DEFAULT_LOCALE][key] || key;
  }
  if (vars) {
    Object.keys(vars).forEach((name) => {
      text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(vars[name]));
    });
  }
  return text;
}

export function getLocale() {
  return currentLocale;
}

/**
 * @param {string} locale
 */
export function setLocale(locale) {
  const next = normalizeLocale(locale);
  if (next === currentLocale) {
    applyHtmlLang(next);
    return;
  }
  currentLocale = next;
  writeStoredLocale(next);
  applyHtmlLang(next);
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch (e) {
      /* ignore */
    }
  });
}

/**
 * @param {function(string): void} fn
 * @return {function(): void} unsubscribe
 */
export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Apply translations to elements with data-i18n / data-i18n-aria.
 * @param {ParentNode=} root
 */
export function applyStaticI18n(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (key) {
      el.setAttribute("aria-label", t(key));
    }
  });
}

/**
 * Flag emoji for the *other* locale (what clicking will switch to).
 * @param {string=} locale
 * @return {string}
 */
export function flagForToggle(locale) {
  const loc = locale || currentLocale;
  return loc === "pt-BR" ? "🇺🇸" : "🇧🇷";
}

/**
 * Aria label for the language toggle (describes the target language).
 * @param {string=} locale
 * @return {string}
 */
export function langToggleAria(locale) {
  const loc = locale || currentLocale;
  return loc === "pt-BR"
    ? STRINGS["pt-BR"].langAria
    : STRINGS["en-US"].langAria;
}

/**
 * Toggle between pt-BR and en-US.
 * @return {string} new locale
 */
export function toggleLocale() {
  const next = currentLocale === "pt-BR" ? "en-US" : "pt-BR";
  setLocale(next);
  return next;
}

/** Init from localStorage on first import. */
currentLocale = readStoredLocale();
applyHtmlLang(currentLocale);

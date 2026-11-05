


const LOCALE_KEY = "revengeLocale";
const DEFAULT_LOCALE = "pt-BR";
const LOCALES = ["pt-BR", "en-US"];

const STRINGS = {
  "pt-BR": {
    subtitle: "Colete ossos e pare o dinossauro!",
    credit: "Inspirado no T-Rex Runner do Chromium",
    ranking: "Ranking",
    rankingNote: "Melhores tempos neste navegador",
    rankingEmpty: "Nenhum tempo registrado.",
    rankingColRank: "#",
    rankingColNick: "Nick",
    rankingColTime: "Tempo",
    rankingColEscape: "Fuga",
    rankingColBones: "Ossos",
    rankingClose: "Fechar",
    statBones: "Ossos",
    statWave: "Onda",
    statClick: "Por clique",
    statPassive: "Automático",
    statHp: "Vida do dino",
    statEscape: "Fuga",
    clicker: "Minerar ossos",
    clickerAria: "Minerar ossos",
    hintWave: "Cada onda aumenta seus ganhos mas deixa o dino mais esperto!",
    hintPause: "[P] pausar",
    paused: "Pausado",
    "hazard.bush": "Cacto",
    "hazard.ptero": "Pterodáctilo",
    "hazard.boulder": "Cacto gigante",
    "hazard.meteor": "Meteoro",
    startBlurb:
      "Não deixe o dinossauro escapar! Colete ossos, coloque obstáculos e lance meteoros para detê-lo.",
    start: "Começar",
    restart: "Jogar novamente",
    submit: "Enviar",
    endTitle: "Fim de jogo",
    victoryTitle: "Vitória!",
    victoryLead: "O deserto não perdoa... o dinossauro foi derrotado!",
    victoryStats: "Fuga: {escape}% \nTempo: {time}s \nOssos gastos: {bones}",
    victoryRecord: "Novo recorde!",
    victoryBestEscape: "Menor fuga: {escape}%",
    victoryBestTime: "Melhor tempo: {time}s",
    defeatTitle: "Derrota!",
    defeatClose: "Quase lá! O dinossauro escapou. Tente de novo!",
    defeatFar: "O dinossauro escapou! Tente novamente.",
    defeatStats: "Vida restante: {hp}/{maxHp} \nOssos gastos: {bones}",
    defeatTip:
      "Dica: \n[3] Cacto gigante + [2] Pterodáctilo \ncausam dano extra.",
    nickLabel: "Nick (3 letras)",
    nickAria: "Nick com 3 letras",
    scoreInvalid: "Digite exatamente 3 letras (A–Z).",
    scoreNotBetter: "Seu tempo não superou o recorde deste nick.",
    scoreCreated: "Adicionado ao ranking!",
    scoreImproved: "Novo melhor tempo!",
    combo: "Combo!",
    langAria: "Mudar para inglês",
  },
  "en-US": {
    subtitle: "Collect bones and stop the dino!",
    credit: "Inspired by Chromium's T-Rex Runner",
    ranking: "Ranking",
    rankingNote: "Best times on this browser",
    rankingEmpty: "No times recorded yet.",
    rankingColRank: "#",
    rankingColNick: "Nick",
    rankingColTime: "Time",
    rankingColEscape: "Escape",
    rankingColBones: "Bones",
    rankingClose: "Close",
    statBones: "Bones",
    statWave: "Wave",
    statClick: "Per click",
    statPassive: "Auto",
    statHp: "Dino HP",
    statEscape: "Escape",
    clicker: "Collect bones",
    clickerAria: "Collect bones",
    hintWave: "Each wave boosts your gains but makes the dino smarter!",
    hintPause: "[P] pause",
    paused: "Paused",
    "hazard.bush": "Cactus",
    "hazard.ptero": "Pterodactyl",
    "hazard.boulder": "Giant Cactus",
    "hazard.meteor": "Meteor",
    startBlurb:
      "Don't let the dinosaur escape! Collect bones, place obstacles and launch meteors to stop it.",
    start: "Start",
    restart: "Play again",
    submit: "Submit",
    endTitle: "Game over",
    victoryTitle: "Victory!",
    victoryLead: "The desert shows no mercy... the dinosaur is defeated!",
    victoryStats: "Escape: {escape}% \nTime: {time}s \nBones spent: {bones}",
    victoryRecord: "New record!",
    victoryBestEscape: "Lowest escape: {escape}%",
    victoryBestTime: "Best time: {time}s",
    defeatTitle: "Defeat!",
    defeatClose: "So close! The dinosaur escaped. Try again!",
    defeatFar: "The dinosaur escaped! Try again.",
    defeatStats: "HP left: {hp}/{maxHp} \nBones spent: {bones}",
    defeatTip: "Tip: \n[3] Giant Cactus + [2] Pterodactyl \ndeal extra damage.",
    nickLabel: "Nick (3 letters)",
    nickAria: "3-letter nick",
    scoreInvalid: "Enter exactly 3 letters (A–Z).",
    scoreNotBetter: "Your time didn't beat this nick's record.",
    scoreCreated: "Added to the ranking!",
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
    
  }
}

function applyHtmlLang(locale) {
  if (document.documentElement) {
    document.documentElement.lang = locale;
  }
}



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
      
    }
  });
}



export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}



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

const FLAG_SVG = {
  "en-US":
    '<svg class="revenge-flag" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="22" height="16" fill="#b22234"/><path d="M0 2.46h22M0 5.54h22M0 8.62h22M0 11.69h22M0 14.77h22" stroke="#fff" stroke-width="1.23"/><rect width="8.8" height="8.55" fill="#3c3b6e"/></svg>',
  "pt-BR":
    '<svg class="revenge-flag" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="22" height="16" fill="#009c3b"/><path d="M11 1.6L20.2 8 11 14.4 1.8 8Z" fill="#ffdf00"/><circle cx="11" cy="8" r="3.2" fill="#002776"/></svg>',
};



export function toggleTargetLocale(locale) {
  return (locale || currentLocale) === "pt-BR" ? "en-US" : "pt-BR";
}



export function flagForToggle(locale) {
  return FLAG_SVG[toggleTargetLocale(locale)];
}



export function langToggleAria(locale) {
  const loc = locale || currentLocale;
  return loc === "pt-BR"
    ? STRINGS["pt-BR"].langAria
    : STRINGS["en-US"].langAria;
}



export function toggleLocale() {
  const next = currentLocale === "pt-BR" ? "en-US" : "pt-BR";
  setLocale(next);
  return next;
}


currentLocale = readStoredLocale();
applyHtmlLang(currentLocale);

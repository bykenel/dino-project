import { REVENGE_CONFIG } from "./revenge_config.js";
import { listScores, submitScore } from "./scoreboard.js";
import { applyStaticI18n, onLocaleChange, t } from "./i18n.js";

const BEST_RUN_KEY = "revengeBestRun";
const HAZARD_IDS = ["bush", "ptero", "boulder", "meteor"];

/**
 * DOM HUD for Revenge of the Desert (stats, clicker, shop, end overlay).
 */
export class GameHud {
  /**
   * @param {HTMLElement} mountEl
   * @param {Object} handlers
   * @param {function(): void} handlers.onClicker
   * @param {function(string): void} handlers.onSpawn
   * @param {function(): void} handlers.onRestart
   * @param {function(): void} handlers.onStart
   */
  constructor(mountEl, handlers) {
    this.mountEl = mountEl;
    this.overlayRoot = mountEl.parentElement || mountEl;
    this.handlers = handlers;
    this.lastVictoryStats = null;
    this.lastEndKind = null;
    this.lastEndStats = null;
    this.lastScoreStatusKey = null;
    this.unsubLocale = null;
    this.build();
  }

  build() {
    this.mountEl.innerHTML = `
      <div class="revenge-dashboard">
        <div class="revenge-stat">
          <span class="revenge-stat-label" data-i18n="statBones">Ossos</span>
          <span class="revenge-stat-value" data-bones>0</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label" data-i18n="statWave">Onda</span>
          <span class="revenge-stat-value" data-wave>1</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label" data-i18n="statClick">Por clique</span>
          <span class="revenge-stat-value" data-click-reward>+2</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label" data-i18n="statPassive">Passivo</span>
          <span class="revenge-stat-value" data-cps>2/s</span>
        </div>
        <div class="revenge-stat revenge-stat-meter">
          <div class="revenge-stat-meter-head">
            <span class="revenge-stat-label" data-i18n="statHp">Vida do Dino</span>
            <span class="revenge-stat-value revenge-stat-inline" data-hp-text>100/100</span>
          </div>
          <div class="revenge-bar" aria-hidden="true">
            <div class="revenge-bar-track"></div>
            <div class="revenge-bar-fill revenge-bar-hp" data-hp-fill></div>
          </div>
        </div>
        <div class="revenge-stat revenge-stat-meter">
          <div class="revenge-stat-meter-head">
            <span class="revenge-stat-label" data-i18n="statEscape">Fuga</span>
            <span class="revenge-stat-value revenge-stat-inline" data-escape-text>0%</span>
          </div>
          <div class="revenge-bar" aria-hidden="true">
            <div class="revenge-bar-track"></div>
            <div class="revenge-bar-fill revenge-bar-escape" data-escape-fill></div>
          </div>
        </div>
      </div>

      <div class="revenge-controls">
        <div class="revenge-clicker-wrap">
          <button type="button" class="revenge-clicker" data-clicker data-i18n-aria="clickerAria" aria-label="Minerar ossos">
            <span class="revenge-clicker-icon" aria-hidden="true">🦴</span>
            <span class="revenge-clicker-label" data-i18n="clicker">Minerar Ossos</span>
          </button>
          <div class="revenge-float-layer" data-float-layer></div>
        </div>

        <div class="revenge-shop">
          <button type="button" class="revenge-shop-btn" data-spawn="bush">
            <span class="revenge-shop-key">1</span>
            <span class="revenge-shop-name" data-i18n="hazard.bush">${t("hazard.bush")}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.bush.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="ptero">
            <span class="revenge-shop-key">2</span>
            <span class="revenge-shop-name" data-i18n="hazard.ptero">${t("hazard.ptero")}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.ptero.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="boulder">
            <span class="revenge-shop-key">3</span>
            <span class="revenge-shop-name" data-i18n="hazard.boulder">${t("hazard.boulder")}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.boulder.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="meteor">
            <span class="revenge-shop-key">4</span>
            <span class="revenge-shop-name" data-i18n="hazard.meteor">${t("hazard.meteor")}</span>
            <span class="revenge-shop-cost" data-meteor-cost>${REVENGE_CONFIG.HAZARDS.meteor.cost}🦴</span>
          </button>
        </div>
      </div>
      
      <p class="revenge-hint" data-i18n="hintWave">
        Onda aumenta o ganho por clique, mas o dino fica mais esperto!
      </p>
      <p class="revenge-hint" data-i18n="hintPause">
        [P] pausa
      </p>
    `;

    // Damage/combo floats + pause chip sit on the canvas game area only.
    const gameEl = document.querySelector(".trex-game");
    if (gameEl) {
      gameEl.classList.add("revenge-game-stage");
      const gameFx = document.createElement("div");
      gameFx.className = "revenge-game-fx";
      gameFx.innerHTML = `
        <div class="revenge-canvas-floats" data-canvas-floats></div>
        <div class="revenge-pause-chip hidden" data-pause-chip data-i18n="paused">Pausado</div>
      `;
      gameEl.appendChild(gameFx);
      this.gameFx = gameFx;
    }

    // Overlays cover HUD + canvas (parent wrap).
    const overlayHost = document.createElement("div");
    overlayHost.className = "revenge-overlay-host";
    overlayHost.innerHTML = `
      <div class="revenge-overlay hidden" data-overlay>
        <div class="revenge-overlay-card">
          <h2 data-overlay-title data-i18n="endTitle">Fim de jogo</h2>
          <p data-overlay-msg></p>
          <div class="revenge-score-form hidden" data-score-form>
            <label class="revenge-score-label" for="revenge-nick" data-i18n="nickLabel">Nick (3 letras)</label>
            <div class="revenge-score-row">
              <input
                id="revenge-nick"
                class="revenge-nick-input"
                data-nick
                type="text"
                maxlength="3"
                autocomplete="off"
                spellcheck="false"
                data-i18n-aria="nickAria"
                aria-label="Nick de 3 letras"
              />
              <button type="button" class="revenge-restart-btn" data-submit-score data-i18n="submit">Enviar</button>
            </div>
            <p class="revenge-score-status" data-score-status></p>
          </div>
          <button type="button" class="revenge-restart-btn" data-restart data-i18n="restart">Jogar Novamente</button>
        </div>
      </div>
      <div class="revenge-start-overlay" data-start-overlay>
        <div class="revenge-overlay-card">
          <p data-i18n="startBlurb">Impeça o dinossauro antes que ele consiga escapar! Colete ossos, posicione obstáculos pelo caminho e dispare meteoros para vencer.</p>
          <button type="button" class="revenge-restart-btn" data-start data-i18n="start">Iniciar</button>
        </div>
      </div>
      <div class="revenge-overlay hidden" data-ranking-overlay>
        <div class="revenge-overlay-card revenge-ranking-card">
          <h2 data-i18n="ranking">Ranking</h2>
          <p class="revenge-ranking-note" data-i18n="rankingNote">Melhores tempos neste navegador</p>
          <div class="revenge-ranking-table-wrap">
            <table class="revenge-ranking-table">
              <thead>
                <tr>
                  <th data-i18n="rankingColRank">#</th>
                  <th data-i18n="rankingColNick">Nick</th>
                  <th data-i18n="rankingColTime">Tempo</th>
                  <th data-i18n="rankingColEscape">Fuga</th>
                  <th data-i18n="rankingColBones">Ossos</th>
                </tr>
              </thead>
              <tbody data-ranking-body></tbody>
            </table>
          </div>
          <button type="button" class="revenge-restart-btn" data-ranking-close data-i18n="rankingClose">Fechar</button>
        </div>
      </div>
    `;
    this.overlayRoot.appendChild(overlayHost);
    this.overlayHost = overlayHost;

    const fxRoot = this.gameFx || this.overlayHost;

    this.els = {
      bones: this.mountEl.querySelector("[data-bones]"),
      hpFill: this.mountEl.querySelector("[data-hp-fill]"),
      hpText: this.mountEl.querySelector("[data-hp-text]"),
      escapeFill: this.mountEl.querySelector("[data-escape-fill]"),
      escapeText: this.mountEl.querySelector("[data-escape-text]"),
      wave: this.mountEl.querySelector("[data-wave]"),
      clickReward: this.mountEl.querySelector("[data-click-reward]"),
      cps: this.mountEl.querySelector("[data-cps]"),
      clicker: this.mountEl.querySelector("[data-clicker]"),
      floatLayer: this.mountEl.querySelector("[data-float-layer]"),
      canvasFloats: fxRoot.querySelector("[data-canvas-floats]"),
      pauseChip: fxRoot.querySelector("[data-pause-chip]"),
      overlay: this.overlayHost.querySelector("[data-overlay]"),
      overlayTitle: this.overlayHost.querySelector("[data-overlay-title]"),
      overlayMsg: this.overlayHost.querySelector("[data-overlay-msg]"),
      startOverlay: this.overlayHost.querySelector("[data-start-overlay]"),
      spawnBtns: {
        bush: this.mountEl.querySelector('[data-spawn="bush"]'),
        ptero: this.mountEl.querySelector('[data-spawn="ptero"]'),
        boulder: this.mountEl.querySelector('[data-spawn="boulder"]'),
        meteor: this.mountEl.querySelector('[data-spawn="meteor"]'),
      },
      meteorCost: this.mountEl.querySelector("[data-meteor-cost]"),
      restart: this.overlayHost.querySelector("[data-restart]"),
      start: this.overlayHost.querySelector("[data-start]"),
      rankingBtn: document.querySelector("[data-ranking]"),
      rankingOverlay: this.overlayHost.querySelector("[data-ranking-overlay]"),
      rankingBody: this.overlayHost.querySelector("[data-ranking-body]"),
      rankingClose: this.overlayHost.querySelector("[data-ranking-close]"),
      scoreForm: this.overlayHost.querySelector("[data-score-form]"),
      nickInput: this.overlayHost.querySelector("[data-nick]"),
      submitScore: this.overlayHost.querySelector("[data-submit-score]"),
      scoreStatus: this.overlayHost.querySelector("[data-score-status]"),
    };

    applyStaticI18n(this.mountEl);
    if (this.gameFx) {
      applyStaticI18n(this.gameFx);
    }
    applyStaticI18n(this.overlayHost);

    this.unsubLocale = onLocaleChange(() => this.refreshLocale());

    this.els.clicker.addEventListener("click", (e) => {
      e.preventDefault();
      this.handlers.onClicker();
    });

    HAZARD_IDS.forEach((id) => {
      this.els.spawnBtns[id].addEventListener("click", (e) => {
        e.preventDefault();
        this.handlers.onSpawn(id);
      });
    });

    this.els.restart.addEventListener("click", (e) => {
      e.preventDefault();
      this.handlers.onRestart();
    });

    this.els.start.addEventListener("click", (e) => {
      e.preventDefault();
      this.hideStart();
      this.handlers.onStart();
    });

    if (this.els.rankingBtn) {
      this.els.rankingBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.openRanking();
      });
    }
    if (this.els.rankingClose) {
      this.els.rankingClose.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeRanking();
      });
    }
    if (this.els.submitScore) {
      this.els.submitScore.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleScoreSubmit();
      });
    }
    if (this.els.nickInput) {
      this.els.nickInput.addEventListener("input", () => {
        this.els.nickInput.value = this.els.nickInput.value
          .toUpperCase()
          .replace(/[^A-Z]/g, "")
          .slice(0, 3);
      });
      this.els.nickInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleScoreSubmit();
        }
      });
    }
  }

  /**
   * Re-apply static + open overlay strings after locale change.
   */
  refreshLocale() {
    applyStaticI18n(this.mountEl);
    if (this.gameFx) {
      applyStaticI18n(this.gameFx);
    }
    if (this.overlayHost) {
      applyStaticI18n(this.overlayHost);
    }

    if (
      this.lastEndKind === "victory" &&
      this.lastEndStats &&
      this.els.overlay &&
      !this.els.overlay.classList.contains("hidden")
    ) {
      this.renderVictoryMessage(this.lastEndStats);
    } else if (
      this.lastEndKind === "defeat" &&
      this.lastEndStats &&
      this.els.overlay &&
      !this.els.overlay.classList.contains("hidden")
    ) {
      this.renderDefeatMessage(this.lastEndStats);
    }

    if (this.lastScoreStatusKey && this.els.scoreStatus) {
      this.els.scoreStatus.textContent = t(this.lastScoreStatusKey);
    }

    if (
      this.els.rankingOverlay &&
      !this.els.rankingOverlay.classList.contains("hidden")
    ) {
      this.renderRanking();
    }
  }

  /**
   * Show floating +N near the clicker.
   * @param {number} amount
   */
  showClickFeedback(amount) {
    const el = document.createElement("span");
    el.className = "revenge-float-text";
    el.textContent = `+${amount}`;
    const x = 40 + Math.random() * 40;
    const y = 20 + Math.random() * 30;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.els.floatLayer.appendChild(el);
    this.els.clicker.classList.add("revenge-clicker-pulse");
    setTimeout(() => {
      this.els.clicker.classList.remove("revenge-clicker-pulse");
    }, 120);
    setTimeout(() => el.remove(), 700);
  }

  /**
   * Damage / combo float over the canvas game area.
   * @param {number|string} amount
   * @param {Object=} opts
   * @param {boolean=} opts.meteor
   * @param {boolean=} opts.combo
   */
  showDamageFloat(amount, opts) {
    opts = opts || {};
    if (!this.els.canvasFloats) {
      return;
    }
    const el = document.createElement("span");
    el.className = "revenge-damage-float";
    if (opts.meteor) {
      el.classList.add("is-meteor");
    }
    if (opts.combo) {
      el.classList.add("is-combo");
      el.textContent =
        typeof amount === "string" ? amount : t("combo");
    } else {
      el.textContent = `−${amount}`;
    }
    el.style.left = `${42 + Math.random() * 30}%`;
    el.style.top = `${22 + Math.random() * 36}%`;
    this.els.canvasFloats.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /**
   * @param {HTMLElement} containerEl runner container
   */
  shakeCanvas(containerEl) {
    if (!containerEl) {
      return;
    }
    containerEl.classList.remove("revenge-shake");
    void containerEl.offsetWidth;
    containerEl.classList.add("revenge-shake");
    setTimeout(() => containerEl.classList.remove("revenge-shake"), 220);
  }

  setPaused(paused) {
    if (this.els.pauseChip) {
      this.els.pauseChip.classList.toggle("hidden", !paused);
    }
  }

  /**
   * @param {Object} state
   */
  update(state) {
    const {
      bones,
      hp,
      maxHp,
      escapeProgress,
      wave,
      clickReward,
      cps,
      playing,
      ended,
      paused,
      meteorOnCooldown,
      meteorCooldownRemainingMs,
      obstacleCapReached,
    } = state;

    this.els.bones.textContent = Math.floor(bones);
    this.els.wave.textContent = String(wave);
    this.els.clickReward.textContent = `+${clickReward}`;
    this.els.cps.textContent = `${cps}/s`;
    this.els.hpText.textContent = `${Math.max(0, Math.ceil(hp))}/${maxHp}`;
    this.els.hpFill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
    this.els.escapeText.textContent = `${Math.min(100, Math.floor(escapeProgress))}%`;
    this.els.escapeFill.style.width = `${Math.min(100, escapeProgress)}%`;
    this.setPaused(!!paused);

    const coolingMs = Math.max(0, meteorCooldownRemainingMs || 0);
    if (this.els.meteorCost) {
      if (coolingMs > 0) {
        this.els.meteorCost.textContent = `${(coolingMs / 1000).toFixed(1)}s`;
        this.els.meteorCost.classList.add("is-cooldown");
      } else {
        this.els.meteorCost.textContent = `${REVENGE_CONFIG.HAZARDS.meteor.cost}🦴`;
        this.els.meteorCost.classList.remove("is-cooldown");
      }
    }

    HAZARD_IDS.forEach((id) => {
      const cfg = REVENGE_CONFIG.HAZARDS[id];
      const btn = this.els.spawnBtns[id];
      const afford = bones >= cfg.cost;
      const cooling = id === "meteor" && meteorOnCooldown;
      const capped = id !== "meteor" && obstacleCapReached;
      const disabled =
        !playing || ended || paused || !afford || cooling || capped;
      btn.classList.toggle("is-disabled", disabled);
      btn.disabled = disabled;
    });

    this.els.clicker.disabled = ended || paused;
    this.els.clicker.classList.toggle("is-disabled", ended || paused);
  }

  /**
   * @param {Object} stats
   */
  renderVictoryMessage(stats) {
    const escapePct = Math.min(100, Math.floor(stats.escapeProgress || 0));
    const elapsedSec = ((stats.elapsedMs || 0) / 1000).toFixed(1);
    const bonesSpent = Math.floor(stats.bonesSpent || 0);
    const isRecord = !!stats.isRecord;

    let msg =
      `${t("victoryLead")}` +
      `\n\n` +
      t("victoryStats", {
        escape: escapePct,
        time: elapsedSec,
        bones: bonesSpent,
      }) +
      `\n`;
    if (isRecord) {
      msg += `\n${t("victoryRecord")}`;
    }
    const best = this.readBestRun();
    if (best) {
      if (Number.isFinite(best.escapePct)) {
        msg += `\n${t("victoryBestEscape", { escape: best.escapePct })}`;
      }
      if (Number.isFinite(best.elapsedMs) && best.elapsedMs > 0) {
        msg += `\n${t("victoryBestTime", {
          time: (best.elapsedMs / 1000).toFixed(1),
        })}`;
      }
    }

    this.els.overlayTitle.removeAttribute("data-i18n");
    this.els.overlayTitle.textContent = t("victoryTitle");
    this.els.overlayMsg.textContent = msg;
  }

  /**
   * @param {Object} stats
   */
  showVictory(stats) {
    stats = stats || {};
    const escapePct = Math.min(100, Math.floor(stats.escapeProgress || 0));
    const bonesSpent = Math.floor(stats.bonesSpent || 0);
    const record = this.updateBestRun({
      escapePct,
      elapsedMs: stats.elapsedMs || 0,
    });

    const endStats = {
      escapeProgress: escapePct,
      elapsedMs: stats.elapsedMs || 0,
      bonesSpent,
      isRecord: record,
    };
    this.lastEndKind = "victory";
    this.lastEndStats = endStats;
    this.lastVictoryStats = {
      escapePct,
      elapsedMs: stats.elapsedMs || 0,
      bonesSpent,
    };
    this.lastScoreStatusKey = null;
    this.renderVictoryMessage(endStats);
    this.resetScoreForm();
    this.els.scoreForm.classList.remove("hidden");
    this.els.overlay.classList.remove("hidden");
  }

  /**
   * @param {Object} stats
   */
  renderDefeatMessage(stats) {
    const hpLeft = Math.max(0, Math.ceil(stats.hpLeft || 0));
    const maxHp = stats.maxHp || REVENGE_CONFIG.MAX_HP;
    const bonesSpent = Math.floor(stats.bonesSpent || 0);
    const quase = maxHp > 0 && hpLeft / maxHp <= 0.4;

    let msg = quase ? t("defeatClose") : t("defeatFar");
    msg += `\n\n${t("defeatStats", { hp: hpLeft, maxHp, bones: bonesSpent })}`;
    msg += `\n\n${t("defeatTip")}`;

    this.els.overlayTitle.removeAttribute("data-i18n");
    this.els.overlayTitle.textContent = t("defeatTitle");
    this.els.overlayMsg.textContent = msg;
  }

  /**
   * @param {Object} stats
   */
  showDefeat(stats) {
    stats = stats || {};
    this.lastEndKind = "defeat";
    this.lastEndStats = {
      hpLeft: stats.hpLeft || 0,
      maxHp: stats.maxHp || REVENGE_CONFIG.MAX_HP,
      bonesSpent: stats.bonesSpent || 0,
    };
    this.lastVictoryStats = null;
    this.lastScoreStatusKey = null;
    this.renderDefeatMessage(this.lastEndStats);
    this.els.scoreForm.classList.add("hidden");
    this.els.overlay.classList.remove("hidden");
  }

  resetScoreForm() {
    if (!this.els.scoreForm) {
      return;
    }
    this.els.nickInput.value = "";
    this.els.nickInput.disabled = false;
    this.els.submitScore.disabled = false;
    this.els.scoreStatus.textContent = "";
    this.lastScoreStatusKey = null;
  }

  handleScoreSubmit() {
    if (!this.lastVictoryStats) {
      return;
    }
    const result = submitScore({
      nick: this.els.nickInput.value,
      escapePct: this.lastVictoryStats.escapePct,
      elapsedMs: this.lastVictoryStats.elapsedMs,
      bonesSpent: this.lastVictoryStats.bonesSpent,
    });
    if (result.reason === "invalid") {
      this.lastScoreStatusKey = "scoreInvalid";
      this.els.scoreStatus.textContent = t("scoreInvalid");
      return;
    }
    if (result.reason === "not_better") {
      this.lastScoreStatusKey = "scoreNotBetter";
      this.els.scoreStatus.textContent = t("scoreNotBetter");
      return;
    }
    if (result.reason === "created") {
      this.lastScoreStatusKey = "scoreCreated";
      this.els.scoreStatus.textContent = t("scoreCreated");
    } else if (result.reason === "improved") {
      this.lastScoreStatusKey = "scoreImproved";
      this.els.scoreStatus.textContent = t("scoreImproved");
    }
    this.els.nickInput.disabled = true;
    this.els.submitScore.disabled = true;
  }

  openRanking() {
    this.renderRanking();
    this.els.rankingOverlay.classList.remove("hidden");
  }

  closeRanking() {
    this.els.rankingOverlay.classList.add("hidden");
  }

  renderRanking() {
    const rows = listScores();
    if (!rows.length) {
      this.els.rankingBody.innerHTML = `<tr><td colspan="5">${t(
        "rankingEmpty"
      )}</td></tr>`;
      return;
    }
    this.els.rankingBody.innerHTML = rows
      .map((row, i) => {
        const time = ((row.elapsedMs || 0) / 1000).toFixed(1);
        return `<tr>
          <td>${i + 1}</td>
          <td>${row.nick}</td>
          <td>${time}s</td>
          <td>${row.escapePct}%</td>
          <td>${row.bonesSpent}</td>
        </tr>`;
      })
      .join("");
  }

  readBestRun() {
    try {
      const raw = localStorage.getItem(BEST_RUN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * @return {boolean}
   */
  updateBestRun(run) {
    const prev = this.readBestRun() || {
      escapePct: Infinity,
      elapsedMs: Infinity,
    };
    let improved = false;
    const next = {
      escapePct: prev.escapePct,
      elapsedMs: prev.elapsedMs,
    };
    if (run.escapePct < prev.escapePct) {
      next.escapePct = run.escapePct;
      improved = true;
    }
    if (run.elapsedMs > 0 && run.elapsedMs < prev.elapsedMs) {
      next.elapsedMs = run.elapsedMs;
      improved = true;
    }
    if (improved) {
      try {
        localStorage.setItem(BEST_RUN_KEY, JSON.stringify(next));
      } catch (e) {
        /* ignore */
      }
    }
    return improved;
  }

  hideOverlay() {
    this.els.overlay.classList.add("hidden");
    this.els.scoreForm.classList.add("hidden");
    this.lastEndKind = null;
    this.lastEndStats = null;
    this.closeRanking();
  }

  hideStart() {
    this.els.startOverlay.classList.add("hidden");
  }

  showStart() {
    this.els.startOverlay.classList.remove("hidden");
  }

  destroy() {
    if (this.unsubLocale) {
      this.unsubLocale();
      this.unsubLocale = null;
    }
    this.mountEl.innerHTML = "";
    if (this.overlayHost) {
      this.overlayHost.remove();
      this.overlayHost = null;
    }
    if (this.gameFx) {
      this.gameFx.remove();
      this.gameFx = null;
    }
  }
}

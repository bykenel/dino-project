import { REVENGE_CONFIG } from "./revenge_config.js";
import { listScores, submitScore } from "./scoreboard.js";

const BEST_RUN_KEY = "revengeBestRun";

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
    this.build();
  }

  build() {
    this.mountEl.innerHTML = `
      <div class="revenge-dashboard">
        <div class="revenge-stat">
          <span class="revenge-stat-label">Ossos</span>
          <span class="revenge-stat-value" data-bones>0</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label">Onda</span>
          <span class="revenge-stat-value" data-wave>1</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label">Por clique</span>
          <span class="revenge-stat-value" data-click-reward>+2</span>
        </div>
        <div class="revenge-stat">
          <span class="revenge-stat-label">Passivo</span>
          <span class="revenge-stat-value" data-cps>2/s</span>
        </div>
        <div class="revenge-stat revenge-stat-meter">
          <div class="revenge-stat-meter-head">
            <span class="revenge-stat-label">Vida do Dino</span>
            <span class="revenge-stat-value revenge-stat-inline" data-hp-text>100/100</span>
          </div>
          <div class="revenge-bar" aria-hidden="true">
            <div class="revenge-bar-track"></div>
            <div class="revenge-bar-fill revenge-bar-hp" data-hp-fill></div>
          </div>
        </div>
        <div class="revenge-stat revenge-stat-meter">
          <div class="revenge-stat-meter-head">
            <span class="revenge-stat-label">Fuga</span>
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
          <button type="button" class="revenge-clicker" data-clicker aria-label="Minerar ossos">
            <span class="revenge-clicker-icon" aria-hidden="true">🦴</span>
            <span class="revenge-clicker-label">Minerar Ossos</span>
          </button>
          <div class="revenge-float-layer" data-float-layer></div>
        </div>

        <div class="revenge-shop">
          <button type="button" class="revenge-shop-btn" data-spawn="bush">
            <span class="revenge-shop-key">1</span>
            <span class="revenge-shop-name">${REVENGE_CONFIG.HAZARDS.bush.label}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.bush.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="ptero">
            <span class="revenge-shop-key">2</span>
            <span class="revenge-shop-name">${REVENGE_CONFIG.HAZARDS.ptero.label}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.ptero.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="boulder">
            <span class="revenge-shop-key">3</span>
            <span class="revenge-shop-name">${REVENGE_CONFIG.HAZARDS.boulder.label}</span>
            <span class="revenge-shop-cost">${REVENGE_CONFIG.HAZARDS.boulder.cost}🦴</span>
          </button>
          <button type="button" class="revenge-shop-btn" data-spawn="meteor">
            <span class="revenge-shop-key">4</span>
            <span class="revenge-shop-name">${REVENGE_CONFIG.HAZARDS.meteor.label}</span>
            <span class="revenge-shop-cost" data-meteor-cost>${REVENGE_CONFIG.HAZARDS.meteor.cost}🦴</span>
          </button>
        </div>
      </div>
      
      <p class="revenge-hint">
        Onda aumenta o ganho por clique, mas o dino fica mais esperto!
      </p>
      <p class="revenge-hint">
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
        <div class="revenge-pause-chip hidden" data-pause-chip>Pausado</div>
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
          <h2 data-overlay-title>Fim de jogo</h2>
          <p data-overlay-msg></p>
          <div class="revenge-score-form hidden" data-score-form>
            <label class="revenge-score-label" for="revenge-nick">Nick (3 letras)</label>
            <div class="revenge-score-row">
              <input
                id="revenge-nick"
                class="revenge-nick-input"
                data-nick
                type="text"
                maxlength="3"
                autocomplete="off"
                spellcheck="false"
                aria-label="Nick de 3 letras"
              />
              <button type="button" class="revenge-restart-btn" data-submit-score>Enviar</button>
            </div>
            <p class="revenge-score-status" data-score-status></p>
          </div>
          <button type="button" class="revenge-restart-btn" data-restart>Jogar Novamente</button>
        </div>
      </div>
      <div class="revenge-start-overlay" data-start-overlay>
        <div class="revenge-overlay-card">
          <p>Impeça o dinossauro antes que ele consiga escapar! Colete ossos, posicione obstáculos pelo caminho e dispare meteoros para vencer.</p>
          <button type="button" class="revenge-restart-btn" data-start>Iniciar</button>
        </div>
      </div>
      <div class="revenge-overlay hidden" data-ranking-overlay>
        <div class="revenge-overlay-card revenge-ranking-card">
          <h2>Ranking</h2>
          <p class="revenge-ranking-note">Melhores tempos neste navegador</p>
          <div class="revenge-ranking-table-wrap">
            <table class="revenge-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nick</th>
                  <th>Tempo</th>
                  <th>Fuga</th>
                  <th>Ossos</th>
                </tr>
              </thead>
              <tbody data-ranking-body></tbody>
            </table>
          </div>
          <button type="button" class="revenge-restart-btn" data-ranking-close>Fechar</button>
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

    this.lastVictoryStats = null;

    this.els.clicker.addEventListener("click", (e) => {
      e.preventDefault();
      this.handlers.onClicker();
    });

    Object.keys(this.els.spawnBtns).forEach((id) => {
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
      el.textContent = typeof amount === "string" ? amount : "Combo!";
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

    const hazards = ["bush", "ptero", "boulder", "meteor"];
    hazards.forEach((id) => {
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
  showVictory(stats) {
    stats = stats || {};
    const escapePct = Math.min(100, Math.floor(stats.escapeProgress || 0));
    const elapsedSec = ((stats.elapsedMs || 0) / 1000).toFixed(1);
    const bonesSpent = Math.floor(stats.bonesSpent || 0);
    const record = this.updateBestRun({
      escapePct,
      elapsedMs: stats.elapsedMs || 0,
    });

    let msg =
      `O deserto não perdoa... o dinossauro foi derrotado!` +
      `\n\nFuga: ${escapePct}% \nTempo: ${elapsedSec}s \nOssos gastos: ${bonesSpent}\n`;
    if (record) {
      msg += `\nNovo recorde!`;
    }
    const best = this.readBestRun();
    if (best) {
      if (Number.isFinite(best.escapePct)) {
        msg += `\nMelhor fuga: ${best.escapePct}%`;
      }
      if (Number.isFinite(best.elapsedMs) && best.elapsedMs > 0) {
        msg += `\nMelhor tempo: ${(best.elapsedMs / 1000).toFixed(1)}s`;
      }
    }

    this.lastVictoryStats = {
      escapePct,
      elapsedMs: stats.elapsedMs || 0,
      bonesSpent,
    };
    this.els.overlayTitle.textContent = "Vitória";
    this.els.overlayMsg.textContent = msg;
    this.resetScoreForm();
    this.els.scoreForm.classList.remove("hidden");
    this.els.overlay.classList.remove("hidden");
  }

  /**
   * @param {Object} stats
   */
  showDefeat(stats) {
    stats = stats || {};
    const hpLeft = Math.max(0, Math.ceil(stats.hpLeft || 0));
    const maxHp = stats.maxHp || REVENGE_CONFIG.MAX_HP;
    const bonesSpent = Math.floor(stats.bonesSpent || 0);
    const quase = maxHp > 0 && hpLeft / maxHp <= 0.4;

    let msg = quase
      ? "Quase! O dinossauro escapou. Tente de novo!"
      : "O dinossauro escapou. Tente de novo!";
    msg += `\n\nVida restante: ${hpLeft}/${maxHp} \nOssos gastos: ${bonesSpent}`;
    msg += `\n\nDica: \n[3] Cacto Grande + [2] Pterodáctilo \ncausam dano extra.`;

    this.lastVictoryStats = null;
    this.els.overlayTitle.textContent = "Derrota";
    this.els.overlayMsg.textContent = msg;
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
      this.els.scoreStatus.textContent = "Use exatamente 3 letras (A–Z).";
      return;
    }
    if (result.reason === "not_better") {
      this.els.scoreStatus.textContent = "Tempo não melhorou para este nick.";
      return;
    }
    if (result.reason === "created") {
      this.els.scoreStatus.textContent = "Salvo no ranking!";
    } else if (result.reason === "improved") {
      this.els.scoreStatus.textContent = "Novo melhor tempo!";
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
      this.els.rankingBody.innerHTML =
        '<tr><td colspan="5">Nenhum tempo salvo ainda.</td></tr>';
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
    this.closeRanking();
  }

  hideStart() {
    this.els.startOverlay.classList.add("hidden");
  }

  showStart() {
    this.els.startOverlay.classList.remove("hidden");
  }

  destroy() {
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

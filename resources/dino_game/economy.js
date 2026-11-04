import { REVENGE_CONFIG } from './revenge_config.js';

/**
 * Clicker currency + wave-scaled click reward for Revenge of the Desert.
 * Passive CPS stays fixed at BASE_CPS.
 */
export class Economy {
  constructor() {
    this.reset();
  }

  reset() {
    this.bones = REVENGE_CONFIG.STARTING_BONES;
    this.cps = REVENGE_CONFIG.BASE_CPS;
    this.passiveAccumulator = 0;
    this.bonesSpent = 0;
    this.setWave(1);
  }

  /**
   * Scale click mining with wave; passive CPS unchanged.
   * clickReward = CLICK_REWARD + (wave - 1) * CLICK_PER_WAVE
   * @param {number} wave
   */
  setWave(wave) {
    this.clickReward =
      REVENGE_CONFIG.CLICK_REWARD +
      (Math.max(1, wave) - 1) * REVENGE_CONFIG.CLICK_PER_WAVE;
  }

  canAfford(amount) {
    return this.bones >= amount;
  }

  spend(amount) {
    if (!this.canAfford(amount)) {
      return false;
    }
    this.bones -= amount;
    this.bonesSpent += amount;
    return true;
  }

  /**
   * Manual clicker reward (wave-scaled).
   * @return {number} Amount granted.
   */
  click() {
    const reward = this.clickReward;
    this.bones += reward;
    return reward;
  }

  /**
   * Passive income tick (fixed BASE_CPS).
   * @param {number} deltaTime ms
   */
  tick(deltaTime) {
    this.passiveAccumulator += (this.cps * deltaTime) / 1000;
    if (this.passiveAccumulator >= 1) {
      const whole = Math.floor(this.passiveAccumulator);
      this.bones += whole;
      this.passiveAccumulator -= whole;
    }
  }
}

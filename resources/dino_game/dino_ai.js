import { Trex } from './trex.js';
import { REVENGE_CONFIG } from './revenge_config.js';



export class DinoAI {
  constructor() {
    this.reset();
  }

  reset() {
    this.missChance = 0.34;
    this.pteroMissChance = REVENGE_CONFIG.PTERO_MISS_CHANCE;
    this.reactionScale = 0.85;
    this.duckingUntil = 0;
    this.duckTarget = null;
    this.lastDecisionObstacle = null;
  }

  

  setWave(wave) {
    this.missChance = Math.max(0.14, 0.34 - (wave - 1) * 0.035);
    
    this.pteroMissChance = Math.max(
      REVENGE_CONFIG.PTERO_MISS_FLOOR,
      REVENGE_CONFIG.PTERO_MISS_CHANCE - (wave - 1) * 0.015
    );
    this.reactionScale = Math.max(0.68, 0.85 - (wave - 1) * 0.035);
  }

  

  isFullyClear(obstacle, tRex) {
    const width = obstacle.width || 46;
    return obstacle.xPos + width < tRex.xPos;
  }

  

  isMidPteroDanger(obstacle, tRex) {
    if (!obstacle || obstacle.remove) {
      return false;
    }
    if (!obstacle.typeConfig || obstacle.typeConfig.type !== 'PTERODACTYL') {
      return false;
    }
    if (obstacle.yPos > 75) {
      return false;
    }
    return !this.isFullyClear(obstacle, tRex);
  }

  

  endDuck(tRex) {
    tRex.setDuck(false);
    this.duckingUntil = 0;
    this.duckTarget = null;
  }

  

  update(deltaTime, obstacles, tRex, currentSpeed, now, canAct) {
    if (!canAct || !tRex || tRex.status === Trex.status.CRASHED) {
      return;
    }

    
    if (this.duckTarget) {
      if (
        this.duckTarget.remove ||
        this.isFullyClear(this.duckTarget, tRex)
      ) {
        this.endDuck(tRex);
      } else if (
        this.isMidPteroDanger(this.duckTarget, tRex) &&
        !tRex.jumping
      ) {
        
        tRex.setDuck(true);
      }
    }

    
    if (
      tRex.ducking &&
      !this.duckTarget &&
      (!this.duckingUntil || now >= this.duckingUntil)
    ) {
      this.endDuck(tRex);
    }

    const threat = this.findThreat(obstacles, tRex);
    if (!threat) {
      if (tRex.ducking && !this.duckTarget) {
        this.endDuck(tRex);
      }
      return;
    }

    const type = threat.typeConfig.type;
    const dist = threat.xPos - (tRex.xPos + tRex.config.WIDTH);

    
    const jumpThreshold = (70 + currentSpeed * 6) * this.reactionScale;
    
    const duckReaction = Math.min(1, this.reactionScale + 0.18);
    const duckThreshold = (125 + currentSpeed * 7) * duckReaction;

    if (type === 'PTERODACTYL') {
      
      const needsDuck = threat.yPos <= 75;

      if (needsDuck && this.isFullyClear(threat, tRex)) {
        if (tRex.ducking) {
          this.endDuck(tRex);
        }
        return;
      }

      if (dist < duckThreshold && !this.isFullyClear(threat, tRex)) {
        
        const missRate = needsDuck ? this.pteroMissChance : this.missChance;
        if (this.shouldMiss(threat, missRate)) {
          return;
        }
        if (needsDuck) {
          if (!tRex.jumping) {
            tRex.setDuck(true);
            
            if (this.duckTarget !== threat) {
              this.duckTarget = threat;
              this.duckingUntil =
                now + REVENGE_CONFIG.PTERO_DUCK_LOCK_MS + currentSpeed * 16;
            }
          }
        } else if (!tRex.jumping) {
          this.endDuck(tRex);
          tRex.startJump(currentSpeed);
        }
      }
      return;
    }

    
    if (dist < jumpThreshold && dist > -10) {
      if (this.shouldMiss(threat)) {
        return;
      }
      if (!tRex.jumping) {
        this.endDuck(tRex);
        tRex.startJump(currentSpeed);
      }
    }
  }

  

  findThreat(obstacles, tRex) {
    let bestAhead = null;
    let bestAheadDist = Infinity;
    let bestAny = null;
    let bestAnyDist = Infinity;

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (o.remove) {
        continue;
      }
      const dist = o.xPos - tRex.xPos;
      if (dist > -40 && dist < bestAnyDist) {
        bestAnyDist = dist;
        bestAny = o;
      }
      if (dist >= -10 && dist < bestAheadDist) {
        bestAheadDist = dist;
        bestAhead = o;
      }
    }

    return bestAhead || bestAny;
  }

  

  shouldMiss(obstacle, missRate) {
    if (this.lastDecisionObstacle === obstacle) {
      return this._missLocked;
    }
    this.lastDecisionObstacle = obstacle;
    const rate = missRate == null ? this.missChance : missRate;
    this._missLocked = Math.random() < rate;
    return this._missLocked;
  }
}

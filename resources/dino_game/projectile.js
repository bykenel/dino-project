import { CollisionBox } from './offline-sprite-definitions.js';

/**
 * Canvas-drawn meteor / cursor strike projectile.
 */
export class Projectile {
  /**
   * @param {number} targetX canvas x
   * @param {number} targetY canvas y
   * @param {number} damage
   */
  constructor(targetX, targetY, damage) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.x = targetX;
    this.y = -20;
    this.radius = 10;
    this.speed = 0.55; // px per ms
    this.remove = false;
    /** Reached impact point / showing FX (not the same as damage dealt). */
    this.arrived = false;
    /** Damage already applied once. */
    this.damageApplied = false;
    this.impactTimer = 0;
  }

  /**
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (this.arrived) {
      this.impactTimer += deltaTime;
      // Wait briefly for damage if iframes blocked the first frame; then despawn.
      if (this.damageApplied && this.impactTimer > 200) {
        this.remove = true;
      } else if (!this.damageApplied && this.impactTimer > 1000) {
        this.remove = true;
      }
      return;
    }

    this.y += this.speed * deltaTime;
    if (this.y >= this.targetY) {
      this.y = this.targetY;
      this.arrived = true;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.save();
    if (this.arrived) {
      ctx.fillStyle = 'rgba(255, 120, 40, 0.7)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Trail
      const grad = ctx.createLinearGradient(this.x, this.y - 28, this.x, this.y);
      grad.addColorStop(0, 'rgba(255, 180, 60, 0)');
      grad.addColorStop(1, 'rgba(255, 90, 20, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(this.x - 3, this.y - 28, 6, 28);

      ctx.fillStyle = '#c44';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fc6';
      ctx.beginPath();
      ctx.arc(this.x - 2, this.y - 2, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Axis-aligned box for collision vs Trex.
   * @return {!CollisionBox}
   */
  getCollisionBox() {
    return new CollisionBox(
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
}

/**
 * Simple AABB overlap used for meteor vs dino.
 * @param {!CollisionBox} a
 * @param {!CollisionBox} b
 * @return {boolean}
 */
export function boxesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

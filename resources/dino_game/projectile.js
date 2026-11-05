import { CollisionBox } from './offline-sprite-definitions.js';



export class Projectile {
  

  constructor(targetX, targetY, damage) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = damage;
    this.x = targetX;
    this.y = -20;
    this.radius = 10;
    this.speed = 0.55; 
    this.remove = false;
    
    this.arrived = false;
    
    this.damageApplied = false;
    this.impactTimer = 0;
  }

  

  update(deltaTime) {
    if (this.arrived) {
      this.impactTimer += deltaTime;
      
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

  

  draw(ctx) {
    ctx.save();
    if (this.arrived) {
      ctx.fillStyle = 'rgba(255, 120, 40, 0.7)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      
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

  

  getCollisionBox() {
    return new CollisionBox(
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
}



export function boxesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

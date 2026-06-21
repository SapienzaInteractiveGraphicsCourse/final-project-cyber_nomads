import { scene } from './scene.js';
import { EnemyBullet } from './bullet.js';

const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x800000, emissive: 0xff0000, emissiveIntensity: 0.3,
  roughness: 0.4, metalness: 0.8,
});

const coreMat = new THREE.MeshStandardMaterial({
  color: 0xff0000, emissive: 0xff2200, emissiveIntensity: 2.5,
});

// Wave-tier material variants
const bodyMats = [
  bodyMat,
  new THREE.MeshStandardMaterial({
    color: 0x400080, emissive: 0x8800ff, emissiveIntensity: 0.3,
    roughness: 0.4, metalness: 0.8,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x333333, emissive: 0xffffff, emissiveIntensity: 0.4,
    roughness: 0.3, metalness: 0.9,
  }),
];

const coreMats = [
  coreMat,
  new THREE.MeshStandardMaterial({
    color: 0xaa00ff, emissive: 0xcc44ff, emissiveIntensity: 2.5,
  }),
  new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 3.0,
  }),
];

export class Enemy {
  /**
   * @param {number} wave — number of the wave (affects speed)
   */
  constructor(wave) {
    // Difficulty multiplier
    const diff = window._difficulty || 1;
    this.hp    = Math.ceil(2 * diff);
    this.speed = (2.5 + wave * 0.3) * (0.8 + diff * 0.2);
    this.shootTimer = (2 + Math.random() * 2) / diff;
    this.hx = 0.7;
    this.hz = 0.7;
    this.isDying = false;
    this.deathTween = null;
    this.baseY = 0.6;
    this.hitFlashTimer = 0;

    // Choose material tier by wave
    const tier = wave < 4 ? 0 : wave < 7 ? 1 : 2;
    this.bodyMat = bodyMats[tier];
    this.coreMat = coreMats[tier];

    this._buildMesh();
    this._spawnAtRandomEdge();
    scene.add(this.group);
  }

  _buildMesh() {
    this.group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), this.bodyMat);
    body.castShadow = true;
    this.group.add(body);

    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this.coreMat);
    this.core.position.y = 0.3;
    this.group.add(this.core);

    this.rotors = [];
    this.arms = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 5), this.bodyMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(Math.cos(angle) * 0.7, 0.1, Math.sin(angle) * 0.7);
      arm.rotation.y = angle;
      this.group.add(arm);
      this.arms.push(arm);

      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8), this.bodyMat);
      rotor.position.set(Math.cos(angle) * 0.9, 0.2, Math.sin(angle) * 0.9);
      this.group.add(rotor);
      this.rotors.push(rotor);
    }
  }

  _spawnAtRandomEdge() {
    const angle  = Math.random() * Math.PI * 2;
    const radius = 35 + Math.random() * 5;
    this.group.position.set(
      Math.cos(angle) * radius,
      0.6,
      Math.sin(angle) * radius
    );
  }

  get position() { return this.group.position; }

  /**
   * @param {number} dt
   * @param {THREE.Vector3} targetPos — pos of tank
   * @param {EnemyBullet[]} bulletPool — array of enemy bullets
   * @param {Function} obstacleCheck — (pos, radius) => boolean
   * @returns {number} damage to player for this frame (0 or >0 on contact)
   */
  update(dt, targetPos, bulletPool, obstacleCheck) {
    // Rotor spin
    this.rotors.forEach(r => r.rotation.y += dt * 8);
    // Arm wobble
    this.arms.forEach((a, i) => {
      a.rotation.z = Math.PI / 2 + Math.sin(performance.now() * 0.003 + i) * 0.05;
    });
    // Core pulse
    const coreScale = 1 + Math.sin(performance.now() * 0.005) * 0.1;
    this.core.scale.setScalar(coreScale);

    this.core.rotation.y += dt * 3;

    // Hover bob
    this.group.position.y = this.baseY + Math.sin(performance.now() * 0.004) * 0.15;

    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.coreMat.emissiveIntensity = 3.0;
    } else {
      this.coreMat.emissiveIntensity = 2.5;
    }

    const ep = this.group.position;
    const dx = targetPos.x - ep.x;
    const dz = targetPos.z - ep.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 2.0) {
      const nx = ep.x + (dx / dist) * this.speed * dt;
      const nz = ep.z + (dz / dist) * this.speed * dt;
      if (!obstacleCheck(new THREE.Vector3(nx, 0, nz), 1.0)) {
        ep.x = nx;
        ep.z = nz;
      }
    }

    this.group.rotation.y = Math.atan2(dx, dz);

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      const dir = new THREE.Vector3(dx, 0, dz).normalize();
      bulletPool.push(new EnemyBullet(ep.clone(), dir));
      this.shootTimer = Math.max(0.5, 1.5 + Math.random() * 2 - (this.speed - 2.5) * 0.1);
    }

    // damage on contact
    return dist < 2.0 ? 15 * dt : 0;
  }

  destroy() {
    scene.remove(this.group);
  }

  hitFlash() {
    this.hitFlashTimer = 0.15;
    this.coreMat.emissiveIntensity = 3.0;
  }

  startDeath() {
    if (this.isDying) return;
    this.isDying = true;

    // Brief point light at death position
    const deathLight = new THREE.PointLight(0xff4400, 6, 6);
    deathLight.position.copy(this.group.position);
    scene.add(deathLight);
    new TWEEN.Tween({ i: 6 })
      .to({ i: 0 }, 300)
      .onUpdate(s => { deathLight.intensity = s.i; })
      .onComplete(() => scene.remove(deathLight))
      .start();

    const scaleObj = { s: 1 };
    this.deathTween = new TWEEN.Tween(scaleObj)
      .to({ s: 0 }, 300)
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(() => { this.group.scale.setScalar(scaleObj.s); })
      .onComplete(() => { scene.remove(this.group); })
      .start();
  }
}

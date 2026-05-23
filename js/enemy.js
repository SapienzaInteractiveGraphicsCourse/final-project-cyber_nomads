import { scene } from './scene.js';
import { EnemyBullet } from './bullet.js';

const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x800000, emissive: 0xff0000, emissiveIntensity: 0.3,
  roughness: 0.4, metalness: 0.8,
});

const coreMat = new THREE.MeshStandardMaterial({
  color: 0xff0000, emissive: 0xff2200, emissiveIntensity: 1.5,
});

export class Enemy {
  /**
   * @param {number} wave — number of the wave (affects speed)
   */
  constructor(wave) {
    this.hp    = 2;
    this.speed = 2.5 + wave * 0.3;
    this.shootTimer = 2 + Math.random() * 2;
    this.hx = 0.7; // half-extent for collision 
    this.hz = 0.7;

    this._buildMesh();
    this._spawnAtRandomEdge();
    scene.add(this.group);
  }

  _buildMesh() {
    this.group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), bodyMat);
    body.castShadow = true;
    this.group.add(body);

    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), coreMat);
    this.core.position.y = 0.3;
    this.group.add(this.core);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 5), bodyMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(Math.cos(angle) * 0.7, 0.1, Math.sin(angle) * 0.7);
      arm.rotation.y = angle;
      this.group.add(arm);

      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8), bodyMat);
      rotor.position.set(Math.cos(angle) * 0.9, 0.2, Math.sin(angle) * 0.9);
      this.group.add(rotor);
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

    this.core.rotation.y += dt * 3;

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
}

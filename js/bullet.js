import { scene } from './scene.js';

const playerBulletMat = new THREE.MeshStandardMaterial({
  color: 0xff9900, emissive: 0xff6600, emissiveIntensity: 2, roughness: 0.3,
});

const enemyBulletMat = new THREE.MeshStandardMaterial({
  color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2,
});

export class PlayerBullet {
  constructor(position, direction) {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), playerBulletMat);
    this.mesh.position.copy(position);
    this.dir   = direction.clone();
    this.speed = 28;
    this.life  = 1.5; 
    scene.add(this.mesh);
  }

  /** @returns {boolean} true if the bullet is still alive */
  update(dt) {
    this.life -= dt;
    this.mesh.position.x += this.dir.x * this.speed * dt;
    this.mesh.position.z += this.dir.z * this.speed * dt;
    return this.life > 0;
  }

  destroy() {
    scene.remove(this.mesh);
  }
}

export class EnemyBullet {
  constructor(position, direction) {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 5), enemyBulletMat);
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.8;
    this.dir   = direction.clone();
    this.speed = 10;
    this.life  = 3;
    scene.add(this.mesh);
  }

  update(dt) {
    this.life -= dt;
    this.mesh.position.x += this.dir.x * this.speed * dt;
    this.mesh.position.z += this.dir.z * this.speed * dt;
    return this.life > 0;
  }

  destroy() {
    scene.remove(this.mesh);
  }
}

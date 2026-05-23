import * as THREE from 'three';
import { DRONE, ARENA_SIZE, COLORS } from '../utils/constants.js';
import { randomRange } from '../utils/math.js';

export class Drone {
  constructor(target) {
    this.target = target;
    this.hp = DRONE.MAX_HP;
    this.alive = true;
    this.speed = randomRange(DRONE.SPEED * 0.7, DRONE.SPEED * 1.3);
    this.scoreValue = DRONE.SCORE_VALUE;

    this.mesh = new THREE.Group();
    this._buildBody();

    // Spawn at random arena edge
    const half = ARENA_SIZE / 2 - 5;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) this.mesh.position.set(randomRange(-half, half), 0, -half);
    else if (side === 1) this.mesh.position.set(randomRange(-half, half), 0, half);
    else if (side === 2) this.mesh.position.set(-half, 0, randomRange(-half, half));
    else this.mesh.position.set(half, 0, randomRange(-half, half));

    this.mesh.position.y = randomRange(1.5, 4);

    // Altitude variation — drones actively change height so cannon pitch matters
    this.minHeight = 0.6;
    this.maxHeight = 5.5;
    this.targetHeight = this.mesh.position.y;
    this.heightTimer = Math.random() * 2; // stagger height changes across drones

    // Drift offset
    this.drift = {
      x: randomRange(-0.5, 0.5),
      z: randomRange(-0.5, 0.5),
      phase: Math.random() * Math.PI * 2,
      speed: randomRange(0.5, 1.5),
    };

    // Health bar
    const barGeo = new THREE.BoxGeometry(1, 0.08, 0.08);
    const barMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    this.healthBar = new THREE.Mesh(barGeo, barMat);
    this.healthBar.position.y = 1.5;
    this.mesh.add(this.healthBar);
  }

  _buildBody() {
    // Main spherical body
    const bodyGeo = new THREE.IcosahedronGeometry(0.6, 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: COLORS.DRONE,
      roughness: 0.2,
      metalness: 0.6,
      emissive: COLORS.DRONE,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    this.mesh.add(body);

    // Rotating outer ring
    const ringGeo = new THREE.TorusGeometry(0.8, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.MAGENTA,
      emissive: COLORS.NEON_MAGENTA,
      emissiveIntensity: 0.8,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 3;
    this.mesh.add(this.ring);

    // Second ring
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.y = Math.PI / 2;
    this.ring2 = ring2;
    this.mesh.add(ring2);

    // Eye
    const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: COLORS.CYAN,
      emissive: COLORS.NEON_CYAN,
      emissiveIntensity: 2,
    });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.z = 0.5;
    this.mesh.add(eye);
  }

  update(dt, playerPos) {
    if (!this.alive) return;

    // Move toward player
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.1) {
      const speed = this.speed * dt;
      this.mesh.position.x += (dx / dist) * speed + this.drift.x * Math.sin(this.drift.phase) * dt;
      this.mesh.position.z += (dz / dist) * speed + this.drift.z * Math.cos(this.drift.phase) * dt;
    }
    this.drift.phase += this.drift.speed * dt;

    // Altitude variation — periodically pick a new target height, smooth lerp toward it
    this.heightTimer -= dt;
    if (this.heightTimer <= 0) {
      this.targetHeight = randomRange(this.minHeight, this.maxHeight);
      this.heightTimer = randomRange(1.5, 3.5);
    }
    this.mesh.position.y += (this.targetHeight - this.mesh.position.y) * Math.min(1, dt * 1.8);

    // Ring animation
    this.ring.rotation.z += dt * 2;
    this.ring2.rotation.z -= dt * 1.7;

    // Face player
    this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

    // Health bar
    this.healthBar.scale.x = this.hp / DRONE.MAX_HP;
    this.healthBar.position.x = -(1 - this.hp / DRONE.MAX_HP) / 2;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  get position() { return this.mesh.position; }
}

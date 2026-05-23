import * as THREE from 'three';
import { COLORS } from '../utils/constants.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawn(position, color, count = 15, spread = 3) {
    for (let i = 0; i < count; i++) {
      const size = 0.05 + Math.random() * 0.2;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({ color });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(position);
      p.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          Math.random() * spread * 1.5,
          (Math.random() - 0.5) * spread
        ),
        life: 0.3 + Math.random() * 0.6,
        age: 0,
      };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  spawnMuzzleFlash(position, direction) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: COLORS.CYAN });
      const p = new THREE.Mesh(geo, mat);
      p.position.copy(position);
      const vel = direction.clone().multiplyScalar(4 + Math.random() * 10);
      vel.x += (Math.random() - 0.5) * 3;
      vel.y += (Math.random() - 0.5) * 3;
      vel.z += (Math.random() - 0.5) * 3;
      p.userData = { velocity: vel, life: 0.1 + Math.random() * 0.2, age: 0 };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  spawnExplosion(position) {
    this.spawn(position, COLORS.MAGENTA, 25, 5);
    this.spawn(position, COLORS.CYAN, 15, 4);

    // Flash light
    const light = new THREE.PointLight(COLORS.MAGENTA, 15, 10, 2);
    light.position.copy(position);
    this.scene.add(light);
    // Decay the light
    const decay = () => {
      light.intensity -= 0.5;
      if (light.intensity <= 0) {
        this.scene.remove(light);
      } else {
        requestAnimationFrame(decay);
      }
    };
    decay();
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.age += dt;
      if (p.userData.age >= p.userData.life) {
        this.scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        this.particles.splice(i, 1);
      } else {
        p.position.addScaledVector(p.userData.velocity, dt);
        p.userData.velocity.y -= 9.8 * dt; // gravity
        p.scale.setScalar(1 - p.userData.age / p.userData.life);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    }
    this.particles = [];
  }
}

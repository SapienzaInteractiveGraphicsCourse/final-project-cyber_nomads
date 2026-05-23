import * as THREE from 'three';
import { BULLET, COLORS } from '../utils/constants.js';

export class Bullet {
  constructor(origin, direction) {
    const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.BULLET,
      emissive: COLORS.NEON_CYAN,
      emissiveIntensity: 2,
    });
    this.mesh = new THREE.Mesh(geo, mat);

    // Trail
    const trailGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    trailGeo.rotateX(Math.PI / 2);
    const trailMat = new THREE.MeshBasicMaterial({ color: COLORS.CYAN, transparent: true, opacity: 0.5 });
    this.trail = new THREE.Mesh(trailGeo, trailMat);
    this.mesh.add(this.trail);
    this.trail.position.z = -0.6;

    this.mesh.position.copy(origin);
    this.direction = direction.clone().normalize();
    this.mesh.lookAt(origin.clone().add(this.direction));

    this.age = 0;
    this.alive = true;

    // Point light for glow
    this.light = new THREE.PointLight(COLORS.CYAN, 3, 4);
    this.mesh.add(this.light);
  }

  update(dt) {
    this.age += dt;
    if (this.age > BULLET.LIFETIME) {
      this.alive = false;
      return;
    }
    this.mesh.position.addScaledVector(this.direction, BULLET.SPEED * dt);
  }

  get position() { return this.mesh.position; }
}

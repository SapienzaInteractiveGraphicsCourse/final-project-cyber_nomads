import { scene } from './scene.js';

const playerBulletMat = new THREE.MeshStandardMaterial({
  color: 0xff9900, emissive: 0xff8800, emissiveIntensity: 4, roughness: 0.3,
});

const enemyBulletMat = new THREE.MeshStandardMaterial({
  color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2,
});

// Bullet glow sprite textures
function makeGlowTexture(r, g, b) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const gd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gd.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gd.addColorStop(0.4, `rgba(${r},${g},${b},0.6)`);
  gd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gd;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

let playerGlowTex = makeGlowTexture(255, 136, 0);
const enemyGlowTex = makeGlowTexture(255, 0, 0);
let playerTrailColor = 0xff6600;

function hexToRgb(color) {
  const hex = color.replace('#', '');
  const value = parseInt(hex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function setPlayerBulletColor(color) {
  const rgb = hexToRgb(color);
  playerBulletMat.color.set(color);
  playerBulletMat.emissive.set(color);
  playerGlowTex.dispose();
  playerGlowTex = makeGlowTexture(rgb.r, rgb.g, rgb.b);
  playerTrailColor = color;
}

export class PlayerBullet {
  constructor(position, direction) {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), playerBulletMat);
    this.mesh.position.copy(position);
    this.dir   = direction.clone();
    this.speed = 28;
    this.life  = 1.5;

    // Glow sprite
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: playerGlowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    }));
    this.glow.scale.set(0.8, 0.8, 1);
    this.glow.position.copy(position);
    scene.add(this.glow);

    // Trail
    this.trail = [];
    const trailMat = new THREE.LineBasicMaterial({
      color: playerTrailColor,
      transparent: true,
      opacity: 0.3,
    });
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(15); // 5 points * 3 coords
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(this.trailLine);

    scene.add(this.mesh);
  }

  /** @returns {boolean} true if the bullet is still alive */
  update(dt) {
    this.life -= dt;
    this.mesh.position.x += this.dir.x * this.speed * dt;
    this.mesh.position.z += this.dir.z * this.speed * dt;
    this.glow.position.copy(this.mesh.position);

    // Update trail
    this.trail.push(this.mesh.position.clone());
    if (this.trail.length > 5) this.trail.shift();
    const posArr = this.trailLine.geometry.attributes.position.array;
    const count = this.trail.length;
    for (let i = 0; i < count; i++) {
      posArr[i * 3]     = this.trail[i].x;
      posArr[i * 3 + 1] = this.trail[i].y;
      posArr[i * 3 + 2] = this.trail[i].z;
    }
    this.trailLine.geometry.attributes.position.needsUpdate = true;
    this.trailLine.geometry.setDrawRange(0, count);

    // Apply config color
    if (window._bulletColor) {
      this.mesh.material.emissive.set(window._bulletColor);
    }

    return this.life > 0;
  }

  destroy() {
    scene.remove(this.mesh);
    scene.remove(this.glow);
    scene.remove(this.trailLine);
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

    // Glow sprite
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: enemyGlowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    }));
    this.glow.scale.set(0.6, 0.6, 1);
    this.glow.position.copy(position);
    scene.add(this.glow);

    // Shorter trail
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xff2200,
      transparent: true,
      opacity: 0.25,
    });
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(9);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(this.trailLine);

    this.trail = [];
    scene.add(this.mesh);
  }

  update(dt) {
    this.life -= dt;
    this.mesh.position.x += this.dir.x * this.speed * dt;
    this.mesh.position.z += this.dir.z * this.speed * dt;
    this.glow.position.copy(this.mesh.position);

    this.trail.push(this.mesh.position.clone());
    if (this.trail.length > 3) this.trail.shift();
    const posArr = this.trailLine.geometry.attributes.position.array;
    const count = this.trail.length;
    for (let i = 0; i < count; i++) {
      posArr[i * 3]     = this.trail[i].x;
      posArr[i * 3 + 1] = this.trail[i].y;
      posArr[i * 3 + 2] = this.trail[i].z;
    }
    this.trailLine.geometry.attributes.position.needsUpdate = true;
    this.trailLine.geometry.setDrawRange(0, count);

    return this.life > 0;
  }

  destroy() {
    scene.remove(this.mesh);
    scene.remove(this.glow);
    scene.remove(this.trailLine);
  }
}

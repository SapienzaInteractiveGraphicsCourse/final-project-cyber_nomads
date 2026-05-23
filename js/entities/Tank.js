import * as THREE from 'three';
import { TANK, ARENA_SIZE, COLORS } from '../utils/constants.js';
import { TextureGenerator } from '../utils/TextureGenerator.js';

export class Tank {
  constructor() {
    this._tracks = [];
    this._setupDone = false;

    this.root = new THREE.Group();
    this.chassis = new THREE.Group();
    this.turret = new THREE.Group();
    this.cannon = new THREE.Group();

    // Create headlight immediately (no textures needed)
    this.headlight = new THREE.SpotLight(
      COLORS.CYAN, TANK.HEADLIGHT_INTENSITY, TANK.HEADLIGHT_RANGE, Math.PI / 6, 0.3, 0.5
    );
    this.headlight.castShadow = true;
    this.headlight.shadow.mapSize.set(512, 512);
    this.headlight.target.position.set(0, 0, 20);
    this.turret.add(this.headlight);
    this.turret.add(this.headlight.target);

    this.currentTurretAngle = 0;
    this.currentCannonPitch = 0;
    this.targetCannonPitch = 0;
    this.fireCooldown = 0;
    this.hp = TANK.MAX_HP;
    this.alive = true;
    this.speed = 0;
    this.headlightsOn = true;

    this._init();
  }

  async _init() {
    const [colorTex, normalTex, roughTex, emissTex] = await Promise.all([
      TextureGenerator.createPanelTexture(),
      TextureGenerator.createNormalMap(),
      TextureGenerator.createRoughnessMap(),
      TextureGenerator.createEmissiveMap(),
    ]);

    const ct = new THREE.CanvasTexture(colorTex);
    const nt = new THREE.CanvasTexture(normalTex);
    const rt = new THREE.CanvasTexture(roughTex);
    const et = new THREE.CanvasTexture(emissTex);

    this._buildChassis(ct, nt, rt, et);
    this._buildTurret(ct, nt, rt);
    this._buildCannon(ct, rt);

    this.chassis.add(this.turret);
    this.turret.add(this.cannon);
    this.root.add(this.chassis);

    this.turret.position.y = TANK.BODY_SIZE.y + 0.15;
    this.cannon.position.z = TANK.TURRET_RADIUS + 0.3;

    // Position headlight on turret
    this.headlight.position.set(0, 0.3, 1.2);

    this._setupDone = true;
  }

  _buildChassis(ct, nt, rt, et) {
    const bodyGeo = new THREE.BoxGeometry(TANK.BODY_SIZE.x, TANK.BODY_SIZE.y, TANK.BODY_SIZE.z);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: ct,
      normalMap: nt,
      roughnessMap: rt,
      roughness: 0.35,
      metalness: 0.9,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = TANK.BODY_SIZE.y / 2 + TANK.TRACK_SIZE.y;
    body.castShadow = true;
    this.chassis.add(body);

    // Neon stripes with emissive texture
    const stripeGeo = new THREE.BoxGeometry(TANK.BODY_SIZE.x + 0.05, 0.05, 0.3);
    const stripeMat = new THREE.MeshStandardMaterial({
      map: ct,
      emissiveMap: et,
      emissive: COLORS.NEON_CYAN,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    for (let z = -1; z <= 1; z += 2) {
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = TANK.BODY_SIZE.y + TANK.TRACK_SIZE.y;
      stripe.position.z = z;
      this.chassis.add(stripe);
    }

    // Tracks
    [-1, 1].forEach((side) => {
      const trackGeo = new THREE.BoxGeometry(TANK.TRACK_SIZE.x, TANK.TRACK_SIZE.y, TANK.TRACK_SIZE.z);
      const trackMat = new THREE.MeshStandardMaterial({
        color: COLORS.PLAYER_TRACK,
        roughness: 0.3,
        metalness: 0.8,
      });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.position.set(side * (TANK.BODY_SIZE.x / 2 + TANK.TRACK_SIZE.x / 2), TANK.TRACK_SIZE.y / 2, 0);
      track.castShadow = true;
      track.receiveShadow = true;
      this.chassis.add(track);

      for (let z = -1.4; z <= 1.4; z += 0.7) {
        const wheelGeo = new THREE.CylinderGeometry(TANK.WHEEL_RADIUS, TANK.WHEEL_RADIUS, 0.2, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.3, metalness: 0.9 });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * (TANK.BODY_SIZE.x / 2 + TANK.TRACK_SIZE.x / 2 + 0.05), TANK.WHEEL_RADIUS, z);
        wheel.castShadow = true;
        this.chassis.add(wheel);
        this._tracks.push(wheel);
      }
    });
  }

  _buildTurret(ct, nt, rt) {
    const turretGeo = new THREE.CylinderGeometry(TANK.TURRET_RADIUS, TANK.TURRET_RADIUS * 1.1, TANK.TURRET_HEIGHT, 16);
    const turretMat = new THREE.MeshStandardMaterial({
      map: ct,
      normalMap: nt,
      roughnessMap: rt,
      roughness: 0.35,
      metalness: 0.8,
    });
    const turretMesh = new THREE.Mesh(turretGeo, turretMat);
    turretMesh.castShadow = true;
    this.turret.add(turretMesh);

    const ringGeo = new THREE.TorusGeometry(TANK.TURRET_RADIUS + 0.05, 0.06, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: COLORS.MAGENTA,
      emissive: COLORS.NEON_MAGENTA,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = TANK.TURRET_HEIGHT / 2;
    this.turret.add(ring);
  }

  _buildCannon(ct, rt) {
    const cannonGeo = new THREE.CylinderGeometry(TANK.CANNON_RADIUS, TANK.CANNON_RADIUS * 1.3, TANK.CANNON_LENGTH, 8);
    cannonGeo.rotateX(Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({
      map: ct,
      roughnessMap: rt,
      roughness: 0.25,
      metalness: 0.9,
    });
    const cannonMesh = new THREE.Mesh(cannonGeo, cannonMat);
    cannonMesh.position.z = TANK.CANNON_LENGTH / 2;
    cannonMesh.castShadow = true;
    this.cannon.add(cannonMesh);

    const muzzleGeo = new THREE.CylinderGeometry(TANK.CANNON_RADIUS * 1.5, TANK.CANNON_RADIUS * 1.8, 0.2, 8);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzleMat = new THREE.MeshStandardMaterial({
      color: COLORS.CYAN,
      emissive: COLORS.NEON_CYAN,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    this.muzzleGlow = new THREE.Mesh(muzzleGeo, muzzleMat);
    this.muzzleGlow.position.z = TANK.CANNON_LENGTH + 0.05;
    this.cannon.add(this.muzzleGlow);
  }

  getCannonTip() {
    const tip = new THREE.Vector3(0, 0, TANK.CANNON_LENGTH + 0.15);
    this.cannon.localToWorld(tip);
    return tip;
  }

  getCannonDirection() {
    const origin = this.cannon.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, 1);
    this.cannon.localToWorld(dir);
    dir.sub(origin).normalize();
    return dir;
  }

  update(dt, input, camera, raycaster = null) {
    if (!this.alive || !this._setupDone) return null;

    // Movement
    let moveX = 0, moveZ = 0;
    if (input.isDown('w') || input.isDown('arrowup')) moveZ -= 1;
    if (input.isDown('s') || input.isDown('arrowdown')) moveZ += 1;
    if (input.isDown('a') || input.isDown('arrowleft')) moveX -= 1;
    if (input.isDown('d') || input.isDown('arrowright')) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    this.speed = len * TANK.SPEED;

    if (len > 0.1) {
      const targetAngle = Math.atan2(moveX, moveZ);
      const diff = targetAngle - this.chassis.rotation.y;
      const shortDiff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.chassis.rotation.y += shortDiff * Math.min(1, dt * 10);
    }

    const dx = moveX * TANK.SPEED * dt;
    const dz = moveZ * TANK.SPEED * dt;
    this.root.position.x += dx;
    this.root.position.z += dz;

    const half = ARENA_SIZE / 2 - 2;
    this.root.position.x = Math.max(-half, Math.min(half, this.root.position.x));
    this.root.position.z = Math.max(-half, Math.min(half, this.root.position.z));

    // Turret aiming via mouse X on ground plane
    if (raycaster) {
      raycaster.setFromCamera(new THREE.Vector2(input.mouse.x, input.mouse.y), camera);
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const relX = hitPoint.x - this.root.position.x;
        const relZ = hitPoint.z - this.root.position.z;
        const targetTurretAngle = Math.atan2(relX, relZ) - this.chassis.rotation.y;
        let diff = targetTurretAngle - this.currentTurretAngle;
        diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
        this.currentTurretAngle += diff * Math.min(1, dt * 10);
      }
    }

    // Cannon pitch via mouse wheel — scroll up raises cannon, scroll down lowers it
    const wheel = input.consumeWheel();
    if (wheel !== 0) {
      this.targetCannonPitch += wheel * 0.04;
      this.targetCannonPitch = Math.max(TANK.CANNON_MIN_PITCH, Math.min(TANK.CANNON_MAX_PITCH, this.targetCannonPitch));
    }
    this.currentCannonPitch += (this.targetCannonPitch - this.currentCannonPitch) * Math.min(1, dt * 6);

    this.turret.rotation.y = this.currentTurretAngle;
    this.cannon.rotation.x = this.currentCannonPitch;

    if (input.wasJustPressed('l')) {
      this.headlightsOn = !this.headlightsOn;
      this.headlight.intensity = this.headlightsOn ? TANK.HEADLIGHT_INTENSITY : 0;
    }

    if (len > 0.1) {
      this._tracks.forEach((w) => { w.rotation.x += this.speed * dt * 0.8; });
    }

    const pos = this.root.position;
    camera.position.x = pos.x;
    camera.position.z = pos.z + 35;
    camera.lookAt(pos.x, 0, pos.z);

    this.fireCooldown = Math.max(0, this.fireCooldown - dt);

    if (input.mouseDown && this.fireCooldown <= 0) {
      this.muzzleGlow.material.emissiveIntensity = 2.0;
      this.fireCooldown = TANK.FIRE_COOLDOWN;
      return { origin: this.getCannonTip(), direction: this.getCannonDirection() };
    }
    this.muzzleGlow.material.emissiveIntensity = 0.4;

    return null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.alive = false;
      const fragments = [];
      for (let i = 0; i < 20; i++) {
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? COLORS.CYAN : COLORS.MAGENTA,
          emissive: Math.random() > 0.5 ? COLORS.NEON_CYAN : COLORS.NEON_MAGENTA,
          emissiveIntensity: 1,
        });
        const frag = new THREE.Mesh(geo, mat);
        frag.position.copy(this.root.position);
        frag.position.y = 1;
        frag.userData = {
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            Math.random() * 8 + 2,
            (Math.random() - 0.5) * 15
          ),
          life: 1.5,
        };
        fragments.push(frag);
      }
      return fragments;
    }
    return null;
  }

  getHealthPercent() { return this.hp / TANK.MAX_HP; }
}

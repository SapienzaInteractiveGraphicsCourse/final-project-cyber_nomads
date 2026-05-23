# Cyber-Tank Arena: Neon Protocol — Requirements Implementation Report

This report maps each course requirement to the specific code that fulfills it, with file paths, line numbers, and technical explanations.

---

## Requirement 1: Hierarchical Models

**Requirement**: A multi-level hierarchical 3D model where transformations propagate through parent-child relationships.

### Implementation: 3-Tier Tank Hierarchy

```
Root (THREE.Group) — world position, clamped to arena bounds
 └── Chassis (THREE.Group) — WASD movement + Y-axis rotation
      ├── Body (BoxGeometry) — main hull
      ├── Neon Stripes (×2) — emissive side panels
      ├── Tracks (×2) — side track boxes
      │    └── Wheels (×10, 5 per side) — CylinderGeometry, rotate on X when moving
      └── Turret (THREE.Group) — Y-axis rotation independent of chassis
           ├── Turret Cylinder — main turret body
           ├── Torus Ring — neon magenta decorative ring
           ├── SpotLight + target — toggleable headlight
           └── Cannon (THREE.Group) — X-axis pitch independent of turret
                ├── Cannon Cylinder — barrel
                └── Muzzle Glow — emissive ring at tip
```

**Code**: `js/entities/Tank.js`

### How Hierarchy Is Built

```js
// Tank.js — constructor (lines 10–13) creates independent groups:
this.root = new THREE.Group();
this.chassis = new THREE.Group();
this.turret = new THREE.Group();
this.cannon = new THREE.Group();

// Tank.js — _init() (lines 53–55) assembles the hierarchy:
this.chassis.add(this.turret);
this.turret.add(this.cannon);
this.root.add(this.chassis);

// Turret is offset above chassis, cannon offset forward from turret:
this.turret.position.y = TANK.BODY_SIZE.y + 0.15;  // line 57
this.cannon.position.z = TANK.TURRET_RADIUS + 0.3;  // line 58
```

### How Hierarchy Propagates Transforms

**Chassis rotation** (movement direction) does NOT affect turret world orientation — the turret counter-rotates to stay aimed at the mouse:

```js
// Tank.js line 229 — subtract chassis rotation so turret stays on target:
const targetTurretAngle = Math.atan2(relX, relZ) - this.chassis.rotation.y;
this.turret.rotation.y = this.currentTurretAngle;  // line 244
```

**Cannon pitch** is relative to the turret — it pitches up/down independently:

```js
// Tank.js line 245:
this.cannon.rotation.x = this.currentCannonPitch;
```

**`localToWorld()` for bullet spawning** — the cannon tip position is converted from cannon-local space through all three levels into world space:

```js
// Tank.js lines 176–180:
getCannonTip() {
  const tip = new THREE.Vector3(0, 0, TANK.CANNON_LENGTH + 0.15);
  this.cannon.localToWorld(tip);  // transforms through chassis→turret→cannon
  return tip;
}
```

This is the key matrix multiplication: `M_world = M_root × M_chassis × M_turret × M_cannon × tip_local`. Three.js's `localToWorld()` performs this chain automatically.

### Additional Hierarchy: Drones

Each drone (`js/entities/Drone.js`) is a `THREE.Group` containing:
- Icosahedron body (castShadow)
- 2 counter-rotating Torus rings (different initial rotations)
- Sphere eye (cyan emissive)
- Health bar (BoxGeometry, scales with HP)

---

## Requirement 2: Lights & Textures (PBR Materials)

**Requirement**: Multiple light sources and PBR texture maps (color, normal, roughness, emissive) — no external image files.

### 2a. Light Sources (5 active)

| # | Light | Type | Color | Purpose | Code |
|---|-------|------|-------|---------|------|
| 1 | Ambient | `AmbientLight` | `#111133` (0.6) | Night fill, prevents pure black shadows | `SceneSetup.js:37` |
| 2 | Moon | `DirectionalLight` | `#4444aa` (1.5) | Primary scene light, casts shadows (2048² map) | `SceneSetup.js:41` |
| 3 | Center Glow | `PointLight` | Magenta (20) | Arena center accent, creates atmosphere | `SceneSetup.js:52` |
| 4 | Headlight | `SpotLight` | Cyan (10) | Toggleable tank headlight, casts shadows (512²) | `Tank.js:16` |
| 5 | Explosion | `PointLight` | Magenta (15) | Dynamic: spawned per drone kill, decays to 0 | `ParticleSystem.js:52` |

**Shadow mapping** is enabled on both the directional light (2048×2048) and the spot headlight (512×512) with PCFSoft shadows:

```js
// SceneSetup.js lines 9–10:
this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Tank.js lines 19–20:
this.headlight.castShadow = true;
this.headlight.shadow.mapSize.set(512, 512);
```

### 2b. PBR Textures (Procedural via Canvas 2D API)

All textures are generated at runtime using the HTML5 Canvas API — **zero external image files**. Code: `js/utils/TextureGenerator.js`

| Map | Method | Resolution | Content | Material Property |
|-----|--------|------------|---------|-------------------|
| **Color** | `createPanelTexture()` | 256×256 | Dark metal base (`#1a1a2e`), grid panel lines (32px), circular bolts at intersections, 20 random scratch strokes | `map` |
| **Normal** | `createNormalMap()` | 256×256 | Flat base `rgb(128,128,255)`, darker panel ridges `rgb(128,128,220)`, raised bolt bumps `rgb(128,128,200)` | `normalMap` |
| **Roughness** | `createRoughnessMap()` | 256×256 | Smooth dark base `rgb(30,30,30)`, 40 scratch strokes in light gray for worn/scratched areas | `roughnessMap` |
| **Emissive** | `createEmissiveMap()` | 256×256 | Black background, cyan grid lines with `shadowBlur: 8`, magenta horizontal lines with `shadowBlur: 6` | `emissiveMap` |

Each texture returns a `Promise<Image>` via `canvas.toDataURL()` → `new Image()`, then wrapped in `THREE.CanvasTexture`:

```js
// Tank.js lines 37–47:
const [colorTex, normalTex, roughTex, emissTex] = await Promise.all([
  TextureGenerator.createPanelTexture(),
  TextureGenerator.createNormalMap(),
  TextureGenerator.createRoughnessMap(),
  TextureGenerator.createEmissiveMap(),
]);
const ct = new THREE.CanvasTexture(colorTex);
// ... applied to MeshStandardMaterial
```

### 2c. Material Application

**Tank chassis** (`Tank.js:68–74`) — all 4 PBR maps:
```js
new THREE.MeshStandardMaterial({
  map: ct, normalMap: nt, roughnessMap: rt,
  roughness: 0.6, metalness: 0.7,
});
```

**Neon stripes** (`Tank.js:82–88`) — color + emissive:
```js
new THREE.MeshStandardMaterial({
  map: ct, emissiveMap: et,
  emissive: COLORS.NEON_CYAN, emissiveIntensity: 1.0,
  roughness: 0.2,
});
```

**Turret** (`Tank.js:125–131`) — color, normal, roughness:
```js
new THREE.MeshStandardMaterial({
  map: ct, normalMap: nt, roughnessMap: rt,
  roughness: 0.35, metalness: 0.8,
});
```

**Cannon** (`Tank.js:152–157`) — color, roughness:
```js
new THREE.MeshStandardMaterial({
  map: ct, roughnessMap: rt,
  roughness: 0.25, metalness: 0.9,
});
```

**Drone materials** — emissive `MeshStandardMaterial` for the body (red glow), torus rings (magenta glow), and eye (cyan glow).

**Arena boundaries** — emissive magenta walls with `emissiveIntensity: 0.5`.

### 2d. Rendering Configuration

```js
// SceneSetup.js lines 11–12:
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 1.2;

// SceneSetup.js line 16 — depth fog:
this.scene.fog = new THREE.FogExp2(0x050510, 0.0004);
```

---

## Requirement 3: User Interaction

**Requirement**: Real-time interactive control of the 3D scene via keyboard and mouse.

### 3a. Input Capture

Code: `js/core/InputManager.js`

| Input | Method | Details |
|-------|--------|---------|
| WASD / Arrow keys | `keydown`/`keyup` events | Boolean state map + `justPressed` Set for one-shot actions |
| Mouse position | `mousemove` event | Normalized device coordinates (-1 to +1) |
| Mouse wheel | `wheel` event (`passive: false`) | Accumulated delta with `consumeWheel()` pattern |
| Left mouse button | `mousedown`/`mouseup` | Boolean flag |
| Context menu | `contextmenu` | Prevented (right-click disabled) |

### 3b. Control Mapping

| Input | Action | Implementation |
|-------|--------|---------------|
| W / ↑ | Move forward (away from camera, toward -Z) | `Tank.js:195–196` |
| S / ↓ | Move backward (toward camera, toward +Z) | `Tank.js:195–196` |
| A / ← | Strafe left | `Tank.js:197` |
| D / → | Strafe right | `Tank.js:197` |
| **Mouse X** | Turret horizontal aim | Ground-plane raycast → angle relative to chassis → `turret.rotation.y` (`Tank.js:222–233`) |
| **Mouse Wheel** | Cannon pitch | Scroll up raises cannon, scroll down lowers. `targetCannonPitch ±= wheel * 0.04`, clamped to `[-0.5, 0.15]`, smooth lerp (`Tank.js:238–242`) |
| **Left Click** | Fire cannon | Spawns Bullet at `getCannonTip()` with `getCannonDirection()` (`Tank.js:263–266`) |
| **L key** | Toggle headlight | Sets `headlight.intensity` to 0 or `HEADLIGHT_INTENSITY` (`Tank.js:247–249`) |

### 3c. Turret Aiming via Ground-Plane Raycasting

```js
// Tank.js lines 222–233:
raycaster.setFromCamera(new THREE.Vector2(input.mouse.x, input.mouse.y), camera);
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
  const relX = hitPoint.x - this.root.position.x;
  const relZ = hitPoint.z - this.root.position.z;
  const targetTurretAngle = Math.atan2(relX, relZ) - this.chassis.rotation.y;
  // smooth interpolation...
}
```

The ray is cast from the camera through the mouse position. It intersects the y=0 ground plane, giving the world-space target point. The angle to that point (minus chassis rotation) becomes the turret target.

### 3d. Camera Follow

The camera follows the tank from a top-down perspective:
```js
// Tank.js lines 257–259:
camera.position.x = pos.x;
camera.position.z = pos.z + 35;
camera.lookAt(pos.x, 0, pos.z);
```

---

## Requirement 4: Animations (All Hand-Coded)

**Requirement**: All animations implemented manually in JavaScript — no imported animation data, no keyframe files, no glTF animations.

### Animation Catalog

| Element | Method | Code Reference | Details |
|---------|--------|---------------|---------|
| **Turret rotation** | Smooth interpolation | `Tank.js:231–232` | `diff * Math.min(1, dt * 10)` toward mouse target angle |
| **Cannon pitch** | Smooth interpolation | `Tank.js:242` | `lerp factor = dt * 6` toward `targetCannonPitch` |
| **Wheel treads** | Continuous rotation | `Tank.js:253` | `wheel.rotation.x += speed * dt * 0.8` only when moving |
| **Chassis turning** | Angular interpolation | `Tank.js:205–209` | Shortest-angle rotation toward movement direction, `dt * 10` |
| **Drone ring 1** | Continuous spin | `Drone.js:115` | `ring.rotation.z += dt * 2` |
| **Drone ring 2** | Counter-spin | `Drone.js:116` | `ring2.rotation.z -= dt * 1.7` |
| **Drone altitude** | Periodic retarget + lerp | `Drone.js:107–112` | Every 1.5–3.5s picks random height 0.6–5.5, lerps at `dt * 1.8` |
| **Drone lateral drift** | Sinusoidal offset | `Drone.js:101–102` | `sin(phase) * drift.x` and `cos(phase) * drift.z` with per-drone speed |
| **Drone facing** | `lookAt()` each frame | `Drone.js:119` | Faces toward player position at drone's own height |
| **Bullet flight** | Linear velocity | `Bullet.js:41` | `addScaledVector(direction, SPEED * dt)` |
| **Muzzle flash** | Burst particles with velocity | `ParticleSystem.js:31–44` | 8 spheres expanding along fire direction + random spread |
| **Explosion** | Dual-color particle burst | `ParticleSystem.js:47–64` | 25 magenta + 15 cyan particles, 5–4 spread, + decaying PointLight |
| **Death debris** | Physics fragments | `Tank.js:278–297` | 20 colored boxes with random velocity, gravity, rotation |
| **Particle lifecycle** | Age-based decay | `ParticleSystem.js:67–81` | `scale = 1 - age/life`, gravity `-9.8 * dt`, removal on timeout |
| **Debris physics** | Gravity + rotation | `main.js:173–185` | `velocity.y -= 9.8 * dt`, `rotation.x += dt * 5`, `rotation.y += dt * 3` |
| **Health bar** | Scale transform | `Drone.js:122–123` | `scale.x = hp / maxHP`, bar shifts left to stay left-aligned |

### Frame-Rate Independence

All animations use delta-time (`dt`) scaling via `THREE.Clock`:
```js
// main.js line 104:
const dt = Math.min(this.clock.getDelta(), 0.1); // capped at 100ms to prevent tunneling
```

### Animation Design Pattern

Every animation follows the same pattern: compute a target value, then smooth-lerp the current value toward it using `dt * rate`. Example from turret:

```
targetAngle = atan2(mouseWorldX - tankX, mouseWorldZ - tankZ) - chassis.rotation.y
diff = shortestAngle(currentAngle, targetAngle)
currentAngle += diff * min(1, dt * 10)
```

This pattern appears in: turret rotation, cannon pitch, chassis turning, drone height changes.

---

## Requirement 5: Game Loop & State Management

**Requirement**: Real-time game with state transitions, collision detection, scoring.

### Game States

```js
// constants.js lines 52–56:
STATE.START  → start screen with high score
STATE.PLAYING → HUD visible, game loop active
STATE.GAMEOVER → final score, restart prompt
```

Transitions handled in `main.js:43–49` via keydown listener, and `UIController.js:21–26` for UI visibility toggling.

### Collision Detection

**Bullet ↔ Drone** (`main.js:148–169`): Distance-based, radius 1.0. On hit: drone takes damage, bullet destroyed, explosion particles spawned.

**Drone ↔ Player** (`main.js:135–145`): Distance-based, radius 2.5. Continuous damage per second. On death: tank debris fragments spawned.

### Wave System

```js
// main.js lines 92–98:
_spawnWave() {
  this.dronesRemaining = 3 + this.wave * 2;
  // spawns drones at random arena edges
}
```

Wave completes when `dronesRemaining` reaches 0, then `wave++` and next wave spawns.

### Persistence

High score saved to `localStorage` key `ctaHighScore`, displayed on start screen and game over screen (`UIController.js:47–48`).

---

## Summary Table

| Requirement | Status | Key Files | Key Techniques |
|-------------|--------|-----------|----------------|
| Hierarchical Models | Implemented | `Tank.js`, `Drone.js` | THREE.Group nesting, `localToWorld()`, independent rotation per tier |
| PBR Textures | Implemented | `TextureGenerator.js`, `Tank.js` | Canvas 2D procedural generation, `MeshStandardMaterial`, 4 map types |
| Multiple Lights | Implemented | `SceneSetup.js`, `Tank.js`, `ParticleSystem.js` | 5 light types, shadow mapping (2048²+512²), dynamic explosion lights |
| User Interaction | Implemented | `InputManager.js`, `Tank.js`, `main.js` | 7 distinct inputs, ground-plane raycasting, wheel-driven pitch, camera follow |
| Hand-Coded Animations | Implemented | `Tank.js`, `Drone.js`, `ParticleSystem.js`, `main.js` | 16 unique animations, all delta-time scaled, smooth interpolation |

# Cyber-Tank Arena: Neon Protocol

## Project Summary

A fast-paced 3D top-down shooter built with **Three.js** and **WebGL**. The player controls a cyber tank in a neon-lit arena, fighting waves of autonomous drones. The goal is to survive as long as possible while scoring points.

---

## Technical Implementation

### Environment & Library

| Dependency | Version | Purpose |
|------------|---------|---------|
| Three.js | 0.157.0 | 3D rendering via WebGL |
| ES6 Modules | native | Code organization, no bundler |
| HTML/CSS | — | UI overlay (HUD, start/game-over screens) |

All dependencies are loaded via import map from unpkg CDN. No build tools or Node.js required. Open `index.html` through any HTTP server.

### Project Structure

```
js/
├── main.js                   Entry point, game loop, collision handling
├── core/
│   ├── InputManager.js       Keyboard + mouse input capture
│   └── SceneSetup.js         Scene, camera, renderer, lights, arena
├── entities/
│   ├── Tank.js               Player tank (3-tier hierarchy)
│   ├── Bullet.js             Projectiles with trails
│   ├── Drone.js              Enemy AI entities
│   └── ParticleSystem.js     Muzzle flash, explosions, debris
├── ui/
│   └── UIController.js       HUD, start screen, game over
└── utils/
    ├── constants.js          Game configuration values
    ├── math.js               Vector helpers (distance, clamp, lerp)
    └── TextureGenerator.js   Procedural PBR texture generation
```

---

## Course Requirements Fulfillment

### 1. Hierarchical Models

The player tank is a **3-level hierarchical structure**:

```
Root (position)
 └── Chassis (WASD movement, body + tracks + wheels)
      └── Turret (independent Y-axis rotation via mouse X)
           └── Cannon (independent X-axis pitch via mouse Y)
```

Matrix transformations propagate correctly through the hierarchy:
- Chassis translates and rotates with WASD movement
- Turret `rotation.y` is set relative to the chassis, independent of chassis orientation
- Cannon `rotation.x` is set relative to the turret, independent of turret rotation
- `localToWorld()` converts cannon-tip coordinates to world space for bullet spawning

The turret-to-world aiming is computed by subtracting chassis rotation from the target angle:

```js
const targetTurretAngle = Math.atan2(relX, relZ) - this.chassis.rotation.y;
```

### 2. Lights & Textures

**Lighting (4 active sources):**
1. **AmbientLight** — dim blue-purple fill (moonlight ambient)
2. **DirectionalLight** — moonlight with shadow mapping (2048×2048 shadow map)
3. **PointLight** — magenta arena center accent glow
4. **SpotLight** — toggleable tank headlight with shadow casting (512×512 shadow map)
5. **Dynamic PointLights** — spawned on explosions (decay over time)

**Textures (procedural PBR, generated via Canvas API):**

| Map Type | Purpose | Generation Method |
|----------|---------|-------------------|
| Color map | Panel lines, bolts, wear/scratches | Canvas 2D drawing |
| Normal map | Ridge detail for panels and bolts | RGB encoded normal vectors |
| Roughness map | Scratched/smooth variation | Grayscale noise strokes |
| Emissive map | Neon cyan/magenta glow lines | Colored lines with shadow blur |

Textures are applied to the tank chassis, turret, and cannon via `MeshStandardMaterial` with `map`, `normalMap`, `roughnessMap`, and `emissiveMap` properties.

### 3. User Interaction

| Input | Action |
|-------|--------|
| W / Arrow Up | Move forward (away from camera) |
| S / Arrow Down | Move backward (toward camera) |
| A / Arrow Left | Strafe left |
| D / Arrow Right | Strafe right |
| Mouse X | Turret horizontal aim (ground-plane raycast) |
| Mouse Wheel | Cannon pitch (scroll up = raise, scroll down = lower) |
| Left Mouse Button | Fire cannon |
| L | Toggle headlight on/off |
| Any key | Start game / Restart after death |

The cursor is a visible crosshair for precise aiming.

### 4. Animations (All Hand-Coded)

All animations are implemented manually in JavaScript — **no imported animation data**.

| Element | Animation Method |
|---------|-----------------|
| Turret rotation | Smooth interpolation toward mouse target angle |
| Cannon pitch | Smooth interpolation toward mouse Y position |
| Wheel treads | Continuous X-axis rotation when tank moves |
| Drone rings | Counter-rotating torus rings at different speeds |
| Drone hover | Active altitude variation — drones periodically pick random target heights (0.6–5.5) and smooth-lerp toward them, making cannon pitch mechanically meaningful |
| Drone drift | Per-drone sinusoidal lateral movement |
| Muzzle flash | Expanding particles with short lifetime |
| Explosions | Particle burst in two colors + decaying PointLight |
| Death debris | Physical fragments with gravity and rotation |
| Bullet trails | Semi-transparent cylinders following projectiles |

Tween.js was planned for optional smooth transitions; all current animations use linear interpolation with delta-time scaling for frame-rate independence.

---

## Game Mechanics

### Combat Loop
1. Player survives waves of drones
2. Destroy drones to earn points (100 per drone)
3. Each wave spawns more drones (3 + wave × 2)
4. Drones drift toward the player and deal contact damage
5. Player has 100 HP; health bar turns orange/red below 30%

### Game States
- **Start Screen**: Title with neon styling, high score display, "Press any key" prompt
- **Playing**: HUD with health bar, score, wave number; crosshair cursor
- **Game Over**: Final score display, new high score detection, restart prompt

### Persistence
High score is saved to `localStorage` and displayed on the start screen.

---

## Visual Design

- **Cyberpunk aesthetic**: cyan (#0ff) + magenta (#f0f) dual-color palette
- **Neon glow**: emissive materials and shadow-blur CSS effects
- **Starfield**: 800 randomly placed points in the sky
- **Fog**: Exponential fog creates depth in the dark arena
- **ACES filmic tone mapping**: For HDR-like rendering
- **Shadow mapping**: Directional light + headlight spot shadows
- **Night skyline**: Dark background with subtle starfield, bounded arena with glowing walls

---

## How to Run

```bash
# From project root
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

No installation, no build step. Requires a modern browser with WebGL support.

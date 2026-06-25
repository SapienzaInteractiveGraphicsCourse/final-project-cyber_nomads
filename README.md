# 🛡️ Cyber-Tank Arena: Nomads

> A dynamic 3D top-down shooter set in a digital nomad setting. Control a cyber tank, destroy waves of enemy drones, and survive in a technologically advanced steppe arena.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?logo=three.js)
![Tween.js](https://img.shields.io/badge/Tween.js-18.6.4-blue)
![ES6 Modules](https://img.shields.io/badge/ES6-Modules-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎮 Play

Open the project via Live Server in VS Code, and the game will run directly in your browser. No installations, no build tools.

---

## 📊 Presentation

[Cyber-Tank Arena Presentation](https://canva.link/yats469s96uvwe2)
[Cyber-Tank Arena Report](https://docs.google.com/document/d/1LRpywCe4mWSHMFvNNtxPr0jFmba_XIf1BYEmFPfIu0o/edit?usp=sharing)

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move back |
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| Mouse | Aim turret |
| `LMB` | Shoot |
| `L` | Toggle headlights |
| `X` | Toggle wireframe |
| `Tab` | Open config panel |

---

## ✨ Features

### Player Tank
- Hierarchical 3D model built from geometric primitives (5-level scene graph)
- PBR materials with 4 texture maps: diffuse, normal, roughness, emissive
- Independent turret rotation toward mouse cursor
- Barrel recoil animation on each shot (Tween.js)
- Chassis suspension wobble (roll on turn, tilt on acceleration)
- 6 spinning wheels (3 per side)
- Runtime colour customisation via config panel

### Enemy Drones
- 3 visual tiers that change with wave progression:
  - **Tier 0** (waves 1–3): Red body and core
  - **Tier 1** (waves 4–6): Purple body and core
  - **Tier 2** (waves 7+): White/chrome body and white core
- AI tracking toward player with obstacle avoidance
- Shooting with difficulty-scaled fire rate
- Contact damage when close (15 HP/s)
- Animations: rotor spin, arm wobble, core pulse, hover bob, hit flash
- Death animation: PointLight flash + scale shrink (Tween.js)

### Combat System
- Player bullets: speed 28, 5-point trail, orange glow sprite
- Enemy bullets: speed 10, 3-point trail, red glow sprite
- Fire rate limiting: 250 ms between shots (4 shots/sec)
- Invulnerability frames: 0.5 s after taking damage
- Score: 100 + wave × 10 per kill | XP: 25 per kill

### Arena
- 100×100 ground plane with procedural dirt texture (12×12 tiling)
- Orange boundary lines at ±40 units
- 1 200-point starfield with twinkling animation
- 13 obstacles with hover bob, slow rotation, and pulsing emissive glow
- Exponential fog (FogExp2, density 0.018)

### Lighting
- **AmbientLight**: blue-tinted base illumination, hue shifts per wave
- **DirectionalLight**: sun with 4096×4096 PCFSoftShadowMap
- **SpotLight**: tank headlights (toggleable, visible cone mesh)
- **PointLight**: muzzle flash + enemy death flash

### Camera
- 3 switchable modes via config panel:
  - **Default**: top-down follow with smooth interpolation
  - **Chase**: close behind tank, follows movement direction
  - **Orbit**: circles continuously at radius 10

### Visual Effects
- Cineon tone mapping (exposure 1.2)
- Muzzle flash sprite with additive blending
- Bullet glow sprites with procedural radial gradients
- Bullet trails using BufferGeometry with manual vertex updates
- Low HP red vignette overlay with pulsing HP bar
- Invulnerability chassis flashing

### Configuration Panel (Tab)
- Tank colour picker
- Bullet colour picker
- Ambient light colour picker
- HUD accent colour picker
- Camera mode selector (Default / Chase / Orbit)
- Difficulty selector (Easy / Normal / Hard)

### Difficulty System
- **Easy / Normal / Hard** affects:
  - Enemy HP (ceil(2 × difficulty))
  - Enemy speed (scales with wave + difficulty)
  - Enemy shoot rate (faster at higher difficulty, min 0.5 s)

### Wave System
- Wave 1: 5 enemies
- Formula: 5 + wave × 2 enemies per wave
- Enemies spawn one at a time with 400 ms stagger
- Wave announcement on HUD with fade animation

---

## 🏗️ Architecture

```
final-project-cyber_nomads/
├── index.html          # Canvas + UI overlay (HUD, config, game-over)
├── css/
│   └── style.css       # Cyberpunk UI styling
└── js/
    ├── main.js         # Game loop, state, collision, wave spawning
    ├── scene.js        # Renderer, camera, fog, resize handler
    ├── tank.js         # Player tank hierarchy + PBR materials
    ├── enemy.js        # Drone AI, tiers, death animation
    ├── bullet.js       # Player & enemy bullet classes + trails
    ├── arena.js        # Ground, boundaries, starfield, obstacles
    ├── lights.js       # 4 light types + headlight toggle
    ├── textures.js     # 5 procedural Canvas textures
    ├── input.js        # Keyboard + mouse raycasting
    └── hud.js          # Score, HP bar, wave announcement
```

---

## 🔧 Technical Details

| Setting | Value |
|---------|-------|
| Shadow map type | PCFSoftShadowMap |
| Sun shadow resolution | 4096 × 4096 |
| Headlight shadow resolution | 512 × 512 |
| Tone mapping | Cineon, exposure 1.2 |
| Fog | FogExp2, density 0.018 |
| Tank metalness | 0.7 |
| Tank roughness | 0.6 |
| Emissive intensity | 0.4 |
| Pixel ratio cap | 2 |
| Max delta time | 50 ms |

---

## 🎯 Course Requirements

- ✅ **Hierarchical Modelling**: 5-level tank scene graph with independent animations
- ✅ **Lighting**: 4 light types (Ambient, Directional, Spot, Point)
- ✅ **Textures**: 5 procedural maps (base colour, normal, roughness, emissive, ground)
- ✅ **User Interaction**: keyboard, mouse, shooting, light toggle, config panel, restart
- ✅ **Animations**: 10+ types using JavaScript + Tween.js
- ✅ **Rendering**: PBR materials, shadow mapping, tone mapping, fog

---

## 📦 Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| [Three.js](https://threejs.org/) | r128 | 3D rendering engine |
| [Tween.js](https://github.com/tweenjs/tween.js) | 18.6.4 | Smooth animations |

Both loaded via CDN — no `npm install` required.

---

## 👩‍💻 Authors

The project was completed as part of the **Interactive Graphics** course for Professor Marco Scerfe.

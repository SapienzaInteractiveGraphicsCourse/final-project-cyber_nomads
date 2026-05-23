# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cyber-Tank Arena: Nomads** — a 3D top-down shooter built with Three.js. Control a cyber tank, destroy enemy drones, and survive in a steppe arena. No build tools: vanilla ES6 modules loaded directly in the browser.

## How to Run

Run a local HTTP server from the project root:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in a browser. Opening `index.html` directly (`file://`) won't work because ES6 module imports require CORS-enabled serving.

VS Code Live Server extension also works.

## Architecture

### Entry Point

`index.html` loads Three.js and game modules from CDN/CDN or local paths via `<script type="importmap">` / `<script type="module">`.

### Module Structure (planned)

```
js/
├── main.js              # App entry: scene setup, render loop
├── core/
│   ├── Game.js          # Game state, start/stop/reset
│   ├── SceneSetup.js    # Scene, camera, renderer, lighting
│   └── InputManager.js  # Keyboard + mouse input
├── entities/
│   ├── Tank.js          # Player tank (hull + turret)
│   ├── Bullet.js        # Projectiles
│   └── Drone.js         # Enemy drone AI
├── world/
│   ├── Arena.js         # Ground, boundaries
│   ├── Obstacles.js     # Arena objects
│   └── Lighting.js      # Dynamic lighting, headlights
├── ui/
│   ├── HUD.js           # Health, score, ammo overlay
│   └── Menu.js          # Start screen, game over
└── utils/
    ├── math.js           # Vector helpers
    └── constants.js      # Config values
```

### Key Dependencies

- **Three.js** — 3D rendering
- **Tween.js** (@tweenjs/tween.js) — smooth animations/camera transitions
- **ES6 Modules** — no bundler, loaded via importmap or direct URLs

### Conventions

- ES6 modules with named exports
- No bundler; import maps for CDN dependencies
- Single class per file, PascalCase filenames matching class names
- Constants in `utils/constants.js`
- All game entities extend or compose Three.js `Object3D`

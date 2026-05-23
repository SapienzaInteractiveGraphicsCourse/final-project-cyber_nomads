import * as THREE from 'three';
import { SceneSetup } from './core/SceneSetup.js';
import { InputManager } from './core/InputManager.js';
import { Tank } from './entities/Tank.js';
import { Bullet } from './entities/Bullet.js';
import { Drone } from './entities/Drone.js';
import { ParticleSystem } from './entities/ParticleSystem.js';
import { UIController } from './ui/UIController.js';
import { STATE, DRONE, TANK as TANK_CFG, ARENA_SIZE } from './utils/constants.js';
import { distance3D } from './utils/math.js';

const RENDER_UPDATE = new CustomEvent('render-update');

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.sceneSetup = new SceneSetup(this.canvas);
    this.input = new InputManager();
    this.ui = new UIController();
    this.particles = new ParticleSystem(this.sceneSetup.scene);

    this.tank = null;
    this.bullets = [];
    this.drones = [];
    this.debris = [];

    this.score = 0;
    this.wave = 1;
    this.dronesRemaining = 0;

    this.raycaster = new THREE.Raycaster();

    this.clock = new THREE.Clock();
    this._boundHandleKey = this._handleKeyDown.bind(this);
  }

  start() {
    this.input.init();
    window.addEventListener('keydown', this._boundHandleKey);
    this._loop();
  }

  _handleKeyDown(e) {
    if (this.ui.state === STATE.START) {
      this._startGame();
    } else if (this.ui.state === STATE.GAMEOVER) {
      this._resetGame();
    }
  }

  _startGame() {
    this.ui.showState(STATE.PLAYING);
    this.ui.updateScore(0);
    this.ui.updateWave(this.wave);

    // Clean up any previous entities
    this._clearEntities();

    this.tank = new Tank();
    this.sceneSetup.scene.add(this.tank.root);
    this.sceneSetup.scene.add(this.tank.headlight);
    this.sceneSetup.scene.add(this.tank.headlight.target);

    this._spawnWave();
  }

  _resetGame() {
    this.score = 0;
    this.wave = 1;
    this.bullets = [];
    this.drones = [];
    this.debris = [];
    this.particles.clear();
    this._startGame();
  }

  _clearEntities() {
    this.bullets.forEach(b => this.sceneSetup.scene.remove(b.mesh));
    this.drones.forEach(d => this.sceneSetup.scene.remove(d.mesh));
    this.debris.forEach(d => this.sceneSetup.scene.remove(d));
    this.particles.clear();
    if (this.tank) {
      this.sceneSetup.scene.remove(this.tank.root);
      this.sceneSetup.scene.remove(this.tank.headlight);
      this.sceneSetup.scene.remove(this.tank.headlight.target);
    }
    this.bullets = [];
    this.drones = [];
    this.debris = [];
  }

  _spawnWave() {
    this.dronesRemaining = 3 + this.wave * 2;
    for (let i = 0; i < this.dronesRemaining; i++) {
      const drone = new Drone(this.tank.root.position);
      this.sceneSetup.scene.add(drone.mesh);
      this.drones.push(drone);
    }
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.ui.state !== STATE.PLAYING) {
      this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);
      return;
    }

    // Tank update
    const fireRequest = this.tank.update(dt, this.input, this.sceneSetup.camera, this.raycaster);
    if (fireRequest) {
      const bullet = new Bullet(fireRequest.origin, fireRequest.direction);
      this.sceneSetup.scene.add(bullet.mesh);
      this.bullets.push(bullet);
      this.particles.spawnMuzzleFlash(fireRequest.origin, fireRequest.direction);
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(dt);
      if (!this.bullets[i].alive) {
        this.sceneSetup.scene.remove(this.bullets[i].mesh);
        this.bullets.splice(i, 1);
      }
    }

    // Update drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      drone.update(dt, this.tank.root.position);

      // Drone damage to player
      const dist = distance3D(drone.position, this.tank.root.position);
      if (dist < 2.5) {
        this.tank.takeDamage(DRONE.DAMAGE_PER_SECOND * dt);
        this.ui.updateHealth(this.tank.getHealthPercent());

        if (!this.tank.alive) {
          this._handlePlayerDeath();
          break;
        }
      }
    }

    // Bullet-drone collision
    for (let b = this.bullets.length - 1; b >= 0; b--) {
      let bulletHit = false;
      for (let d = this.drones.length - 1; d >= 0; d--) {
        const dist = distance3D(this.bullets[b].position, this.drones[d].position);
        if (dist < 1.0) {
          const killed = this.drones[d].takeDamage(25);
          if (killed) {
            this.particles.spawnExplosion(this.drones[d].position);
            this.sceneSetup.scene.remove(this.drones[d].mesh);
            this.drones.splice(d, 1);
            this.dronesRemaining--;
            this.score += DRONE.SCORE_VALUE;
            this.ui.updateScore(this.score);
          }
          bulletHit = true;
          break;
        }
      }
      if (bulletHit && b < this.bullets.length) {
        this.sceneSetup.scene.remove(this.bullets[b].mesh);
        this.bullets.splice(b, 1);
      }
    }

    // Update debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.userData.life -= dt;
      if (d.userData.life <= 0) {
        this.sceneSetup.scene.remove(d);
        this.debris.splice(i, 1);
      } else {
        d.position.addScaledVector(d.userData.velocity, dt);
        d.userData.velocity.y -= 9.8 * dt;
        d.rotation.x += dt * 5;
        d.rotation.y += dt * 3;
      }
    }

    // Particles
    this.particles.update(dt);

    // Check wave completion
    if (this.dronesRemaining <= 0) {
      this.wave++;
      this.ui.updateWave(this.wave);
      this._spawnWave();
    }

    this.input.clearFrame();
    this.sceneSetup.renderer.render(this.sceneSetup.scene, this.sceneSetup.camera);
  }

  _handlePlayerDeath() {
    const frags = this.tank.takeDamage(1000);
    if (frags) {
      frags.forEach(f => {
        this.sceneSetup.scene.add(f);
        this.debris.push(f);
      });
    }
    this.sceneSetup.scene.remove(this.tank.root);
    this.tank = null;
    this.ui.showGameOver(this.score);
  }
}

const game = new Game();
game.start();

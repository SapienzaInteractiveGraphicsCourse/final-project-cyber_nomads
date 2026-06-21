import { scene, renderer, camera }              from './scene.js';
import { headlight, muzzleLight, ambientLight } from './lights.js';
import { tankGroup, chassis, wheels,
         turretGroup, barrelGroup,
         muzzleTip, headlightMount,
         setTankColor }                         from './tank.js';
import { obstacles, ARENA_SIZE, starField, obsMat } from './arena.js';
import { keys, mouse, initMouseTracking,
         onShoot }                              from './input.js';
import { PlayerBullet, setPlayerBulletColor }  from './bullet.js';
import { Enemy }                                from './enemy.js';
import { updateHUD, announceWave,
         showGameOver, hideGameOver,
         setHudAccentColor }                    from './hud.js';

let score = 0, xp = 0, hp = 100, wave = 1, alive = true;
let waveKills = 0, waveTarget = 5;
let invulnTimer = 0;
let lastShotTime = 0;

const playerBullets = [];
const enemyBullets  = [];
const enemies       = [];
const spawnTimeouts = [];
const waveTimeouts  = [];

let tankSpeed = 0;
let tankAngle = 0;
const TANK_MAX_SPEED = 6;

// Camera modes: 0=default follow, 1=close chase, 2=orbit
let cameraMode = 0;
let orbitAngle = 0;
let chaseAngle = 0;
let wireframeMode = false;
let configOpen = false;

initMouseTracking(camera);
onShoot(shoot);

function circleRect(cx, cz, cr, rx, rz, hw, hd) {
  const nearX = Math.max(rx - hw, Math.min(cx, rx + hw));
  const nearZ = Math.max(rz - hd, Math.min(cz, rz + hd));
  const dx = cx - nearX, dz = cz - nearZ;
  return dx * dx + dz * dz < cr * cr;
}

function checkObstacle(pos, radius) {
  return obstacles.some(obs => {
    const op = obs.mesh.position;
    return circleRect(pos.x, pos.z, radius, op.x, op.z, obs.hx, obs.hz);
  });
}

// Muzzle flash sprite (created once)
const muzzleFlashCanvas = document.createElement('canvas');
muzzleFlashCanvas.width = muzzleFlashCanvas.height = 64;
const mfCtx = muzzleFlashCanvas.getContext('2d');
const mfGrad = mfCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
mfGrad.addColorStop(0, 'rgba(255,200,100,1)');
mfGrad.addColorStop(0.3, 'rgba(255,120,20,0.8)');
mfGrad.addColorStop(1, 'rgba(255,60,0,0)');
mfCtx.fillStyle = mfGrad;
mfCtx.fillRect(0, 0, 64, 64);
const muzzleFlashTex = new THREE.CanvasTexture(muzzleFlashCanvas);
const muzzleFlashMat = new THREE.SpriteMaterial({
  map: muzzleFlashTex,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false,
  opacity: 0,
});
const muzzleFlashSprite = new THREE.Sprite(muzzleFlashMat);
muzzleFlashSprite.scale.set(2, 2, 1);
scene.add(muzzleFlashSprite);

function shoot() {
  if (!alive) return;
  const now = performance.now();
  if (now - lastShotTime < 250) return;
  lastShotTime = now;

  const dir = new THREE.Vector3();
  turretGroup.getWorldDirection(dir);
  dir.negate(); dir.y = 0; dir.normalize();

  const muzzlePos = new THREE.Vector3();
  muzzleTip.getWorldPosition(muzzlePos);

  playerBullets.push(new PlayerBullet(muzzlePos, dir));

  // Small muzzle flash at barrel tip — additive sprite, no scene-wide light
  muzzleFlashSprite.position.copy(muzzlePos);
  muzzleFlashMat.opacity = 0.35;
  muzzleFlashSprite.scale.set(0.6, 0.6, 1);
  new TWEEN.Tween({ o: 0.35, s: 0.6 })
    .to({ o: 0, s: 0.15 }, 80)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(s => {
      muzzleFlashMat.opacity = s.o;
      muzzleFlashSprite.scale.set(s.s, s.s, 1);
    })
    .start();
}

function spawnWave(count) {
  waveTarget = count;
  waveKills  = 0;
  for (let i = 0; i < count; i++) {
    const id = setTimeout(() => {
      if (!alive) return;
      enemies.push(new Enemy(wave));
    }, i * 400);
    spawnTimeouts.push(id);
  }
  announceWave(wave);
}

function getMoveDirection(ax, az) {
  if (cameraMode === 0) return new THREE.Vector2(ax, az).normalize();

  const forward = new THREE.Vector2(
    tankGroup.position.x - camera.position.x,
    tankGroup.position.z - camera.position.z
  ).normalize();
  const right = new THREE.Vector2(-forward.y, forward.x);

  return new THREE.Vector2()
    .addScaledVector(right, ax)
    .addScaledVector(forward, -az)
    .normalize();
}

function updateTank(dt) {
  let ax = 0, az = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    az -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  az += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  ax -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) ax += 1;

  const moving = ax !== 0 || az !== 0;

  if (moving) {
    const dir = getMoveDirection(ax, az);
    const targetAngle = Math.atan2(dir.x, dir.y);
    if (cameraMode === 1 && az < 0) chaseAngle = targetAngle;
    let diff = targetAngle - tankAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    tankAngle += diff * 0.15;
    tankSpeed = Math.min(tankSpeed + dt * 12, TANK_MAX_SPEED);
  } else {
    tankSpeed *= 0.85;
  }

  if (tankSpeed > 0.05) {
    const nx = tankGroup.position.x + Math.sin(tankAngle) * tankSpeed * dt;
    const nz = tankGroup.position.z + Math.cos(tankAngle) * tankSpeed * dt;

    if (!checkObstacle(new THREE.Vector3(nx, 0, nz), 1.8)) {
      tankGroup.position.x = Math.max(-ARENA_SIZE, Math.min(ARENA_SIZE, nx));
      tankGroup.position.z = Math.max(-ARENA_SIZE, Math.min(ARENA_SIZE, nz));
    }

    chassis.rotation.y = tankAngle;
    // Fix: wheels should roll on local X axis
    const spin = tankSpeed * dt * 3;
    wheels.forEach(w => w.rotation.x += spin);
  }

  // Chassis suspension wobble
  let targetRoll = -ax * 0.05;
  let targetTilt = az * 0.03;
  // If not moving, gently spring back
  if (!moving) { targetRoll *= 0.3; targetTilt *= 0.3; }
  chassis.rotation.z += (targetRoll - chassis.rotation.z) * 0.08;
  chassis.rotation.x += (targetTilt - chassis.rotation.x) * 0.08;

  const dx = mouse.x - tankGroup.position.x;
  const dz = mouse.z - tankGroup.position.z;
  const targetTurretAngle = Math.atan2(dx, dz) + Math.PI;
  const turretWorldAngle  = chassis.rotation.y + turretGroup.rotation.y;
  let tDiff = targetTurretAngle - turretWorldAngle;
  while (tDiff >  Math.PI) tDiff -= Math.PI * 2;
  while (tDiff < -Math.PI) tDiff += Math.PI * 2;
  turretGroup.rotation.y += tDiff * 0.12;

  const headPos = new THREE.Vector3();
  headlightMount.getWorldPosition(headPos);
  headlight.position.copy(headPos);

  const barrelWorldPos = new THREE.Vector3();
  muzzleTip.getWorldPosition(barrelWorldPos);
  headlight.target.position.copy(barrelWorldPos);

  // Camera mode
  const tp = tankGroup.position;
  if (cameraMode === 0) {
    // Default top-down follow
    camera.position.x += (tp.x - camera.position.x) * 0.06;
    camera.position.z += (tp.z + 16 - camera.position.z) * 0.06;
    camera.position.y += (18 - camera.position.y) * 0.06;
    camera.lookAt(tp.x, 0, tp.z);
  } else if (cameraMode === 1) {
    // Close chase
    const behindX = tp.x - Math.sin(chaseAngle) * 10;
    const behindZ = tp.z - Math.cos(chaseAngle) * 10;
    camera.position.x += (behindX - camera.position.x) * 0.08;
    camera.position.z += (behindZ - camera.position.z) * 0.08;
    camera.position.y += (tp.y + 7 - camera.position.y) * 0.08;
    camera.lookAt(tp.x, tp.y + 1.3, tp.z);
  } else if (cameraMode === 2) {
    // Orbit
    orbitAngle += 0.005;
    const orbitRadius = 10;
    const orbitX = tp.x + Math.sin(orbitAngle) * orbitRadius;
    const orbitZ = tp.z + Math.cos(orbitAngle) * orbitRadius;
    camera.position.x += (orbitX - camera.position.x) * 0.04;
    camera.position.z += (orbitZ - camera.position.z) * 0.04;
    camera.position.y += (tp.y + 8 - camera.position.y) * 0.04;
    camera.lookAt(tp.x, tp.y + 1, tp.z);
  }
}

function updatePlayerBullets(dt) {
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    const alive = b.update(dt);

    if (!alive || checkObstacle(b.mesh.position, 0.2) ||
        Math.abs(b.mesh.position.x) > ARENA_SIZE + 2 ||
        Math.abs(b.mesh.position.z) > ARENA_SIZE + 2) {
      b.destroy();
      playerBullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      if (b.mesh.position.distanceTo(enemies[j].position) < 1.2) {
        enemies[j].hp--;
        enemies[j].hitFlash();
        if (enemies[j].hp <= 0) {
          enemies[j].startDeath();
          enemies.splice(j, 1);
          score += 100 + wave * 10;
          xp    += 25;
          waveKills++;
          if (waveKills >= waveTarget && enemies.length === 0) {
            wave++;
            const id = setTimeout(() => {
              if (!alive) return;
              spawnWave(5 + wave * 2);
            }, 2500);
            waveTimeouts.push(id);
          }
        }
        b.destroy();
        playerBullets.splice(i, 1);
        break;
      }
    }
  }
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.isDying) continue;
    const dmg = e.update(dt, tankGroup.position, enemyBullets, checkObstacle);
    hp -= invulnTimer <= 0 ? dmg : 0;
    if (dmg > 0 && invulnTimer <= 0) invulnTimer = 0.5;
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    const alive = b.update(dt);

    if (!alive || checkObstacle(b.mesh.position, 0.15)) {
      b.destroy(); enemyBullets.splice(i, 1); continue;
    }

    if (b.mesh.position.distanceTo(tankGroup.position) < 1.5 && invulnTimer <= 0) {
      hp -= 8;
      invulnTimer = 0.5;
      b.destroy(); enemyBullets.splice(i, 1);
    }
  }
}

function restart() {
  spawnTimeouts.forEach(clearTimeout); spawnTimeouts.length = 0;
  waveTimeouts.forEach(clearTimeout);  waveTimeouts.length = 0;

  score = 0; xp = 0; hp = 100; wave = 1; alive = true;
  waveKills = 0; waveTarget = 5;
  invulnTimer = 0; lastShotTime = 0;

  tankGroup.position.set(0, 0, 0);
  tankAngle = 0; tankSpeed = 0;
  chassis.rotation.y = 0;
  turretGroup.rotation.y = 0;
  barrelGroup.position.z = 0;

  camera.position.set(0, 18, 16);
  camera.lookAt(0, 0, 0);

  headlight.intensity = 3.5;
  muzzleLight.intensity = 0;

  playerBullets.forEach(b => b.destroy()); playerBullets.length = 0;
  enemyBullets.forEach(b  => b.destroy()); enemyBullets.length  = 0;
  enemies.forEach(e => {
    if (e.deathTween) e.deathTween.stop();
    e.destroy();
  });
  enemies.length = 0;

  hideGameOver();
  spawnWave(5);
}

document.getElementById('restart-btn').addEventListener('click', restart);

// Config panel controls
document.getElementById('cfg-tank').addEventListener('input', e => {
  setTankColor(e.target.value);
});
document.getElementById('cfg-bullet').addEventListener('input', e => {
  setPlayerBulletColor(e.target.value);
});
document.getElementById('cfg-ambient').addEventListener('input', e => {
  ambientLight.color.set(e.target.value);
});
document.getElementById('cfg-accent').addEventListener('input', e => {
  setHudAccentColor(e.target.value);
  document.getElementById('config-panel').style.borderColor = e.target.value;
  document.getElementById('config-panel').style.color = e.target.value;
  document.querySelectorAll('#config-panel input, #config-panel select').forEach(el => {
    el.style.borderColor = e.target.value;
    if (el.tagName === 'SELECT') el.style.color = e.target.value;
  });
});
document.getElementById('cfg-camera').addEventListener('change', e => {
  cameraMode = Number(e.target.value);
});
document.getElementById('cfg-difficulty').addEventListener('change', e => {
  window._difficulty = parseFloat(e.target.value);
});

// Camera mode / wireframe / config panel keys
window.addEventListener('keydown', e => {
  if (e.code === 'KeyX') {
    wireframeMode = !wireframeMode;
    [chassis, ...wheels].forEach(m => { if (m.material) m.material.wireframe = wireframeMode; });
    // Toggle on all scene meshes
    scene.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.wireframe = wireframeMode);
        else obj.material.wireframe = wireframeMode;
      }
    });
  }
  if (e.code === 'Tab') {
    e.preventDefault();
    const panel = document.getElementById('config-panel');
    configOpen = !configOpen;
    panel.style.display = configOpen ? 'flex' : 'none';
    if (!configOpen) {
      Object.keys(keys).forEach(code => { keys[code] = false; });
    }
  }
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  TWEEN.update();
  const now = performance.now();

  // Obstacle hover + slow rotation
  obstacles.forEach(o => {
    o.mesh.position.y = o.baseY + Math.sin(now * 0.001 + o.phase) * 0.3;
    o.mesh.rotation.y += dt * o.rotSpeed;
  });

  // Obstacle emissive pulse
  obsMat.emissiveIntensity = 0.08 + Math.sin(now * 0.0005) * 0.04;

  // Starfield rotation + twinkle
  starField.rotation.y += dt * 0.005;
  starField.material.opacity = 0.6 + Math.sin(now * 0.001) * 0.3 + Math.sin(now * 0.003) * 0.1;

  // Ambient color shift by wave
  const targetHue = 0.6 + wave * 0.015;
  const currentHSL = {};
  ambientLight.color.getHSL(currentHSL);
  const newHue = currentHSL.h + (targetHue - currentHSL.h) * 0.02;
  ambientLight.color.setHSL(newHue, 0.4, 0.5);

  if (!configOpen && invulnTimer > 0) invulnTimer -= dt;

  if (alive && !configOpen) {
    updateTank(dt);
    updatePlayerBullets(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);

    // Invulnerability flash on chassis
    chassis.material.emissiveIntensity = invulnTimer > 0
      ? 0.4 + Math.sin(performance.now() * 0.03) * 0.6
      : 0.4;

    updateHUD(score, wave, enemies.length, xp, hp);

    if (hp <= 0) {
      alive = false;
      spawnTimeouts.forEach(clearTimeout); spawnTimeouts.length = 0;
      waveTimeouts.forEach(clearTimeout);  waveTimeouts.length = 0;
      showGameOver(wave, score, xp);
    }
  }

  renderer.render(scene, camera);
}

spawnWave(5);
animate();

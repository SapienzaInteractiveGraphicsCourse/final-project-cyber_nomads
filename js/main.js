import { scene, renderer, camera }              from './scene.js';
import { headlight, muzzleLight }               from './lights.js';
import { tankGroup, chassis, wheels,
         turretGroup, barrelGroup,
         muzzleTip, headlightMount }            from './tank.js';
import { obstacles, ARENA_SIZE }                from './arena.js';
import { keys, mouse, initMouseTracking,
         onShoot }                              from './input.js';
import { PlayerBullet }                         from './bullet.js';
import { Enemy }                                from './enemy.js';
import { updateHUD, announceWave,
         showGameOver, hideGameOver }           from './hud.js';

let score = 0, xp = 0, hp = 100, wave = 1, alive = true;
let waveKills = 0, waveTarget = 5;

const playerBullets = [];
const enemyBullets  = [];
const enemies       = [];

let tankSpeed = 0;
let tankAngle = 0;
const TANK_MAX_SPEED = 6;

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

function shoot() {
  if (!alive) return;

  const dir = new THREE.Vector3();
  turretGroup.getWorldDirection(dir);
  dir.negate(); dir.y = 0; dir.normalize();

  const muzzlePos = new THREE.Vector3();
  muzzleTip.getWorldPosition(muzzlePos);

  playerBullets.push(new PlayerBullet(muzzlePos, dir));

  const recoil = { z: 0 };
  new TWEEN.Tween(recoil)
    .to({ z: 0.4 }, 60)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => { barrelGroup.position.z = recoil.z; })
    .chain(
      new TWEEN.Tween(recoil)
        .to({ z: 0 }, 180)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(() => { barrelGroup.position.z = recoil.z; })
    )
    .start();

  muzzleLight.intensity = 8;
  muzzleLight.position.copy(muzzlePos);
  new TWEEN.Tween({ i: 8 })
    .to({ i: 0 }, 120)
    .onUpdate(o => { muzzleLight.intensity = o.i; })
    .start();
}

function spawnWave(count) {
  waveTarget = count;
  waveKills  = 0;
  for (let i = 0; i < count; i++) {
    setTimeout(() => enemies.push(new Enemy(wave)), i * 400);
  }
  announceWave(wave);
}

function updateTank(dt) {
  let ax = 0, az = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    az -= 1;
  if (keys['KeyS'] || keys['ArrowDown'])  az += 1;
  if (keys['KeyA'] || keys['ArrowLeft'])  ax -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) ax += 1;

  const moving = ax !== 0 || az !== 0;

  if (moving) {
    const dir = new THREE.Vector2(ax, az).normalize();
    const targetAngle = Math.atan2(dir.x, dir.y);
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
    const spin = tankSpeed * dt * 1.5;
    wheels.forEach(w => w.rotation.y += spin);
  }

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

  camera.position.x += (tankGroup.position.x - camera.position.x) * 0.06;
  camera.position.z += (tankGroup.position.z + 16 - camera.position.z) * 0.06;
  camera.lookAt(tankGroup.position.x, 0, tankGroup.position.z);
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
        if (enemies[j].hp <= 0) {
          enemies[j].destroy();
          enemies.splice(j, 1);
          score += 100 + wave * 10;
          xp    += 25;
          waveKills++;
          if (waveKills >= waveTarget && enemies.length === 0) {
            wave++;
            setTimeout(() => spawnWave(5 + wave * 2), 2500);
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
    const dmg = e.update(dt, tankGroup.position, enemyBullets, checkObstacle);
    hp -= dmg;
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    const alive = b.update(dt);

    if (!alive || checkObstacle(b.mesh.position, 0.15)) {
      b.destroy(); enemyBullets.splice(i, 1); continue;
    }

    if (b.mesh.position.distanceTo(tankGroup.position) < 1.5) {
      hp -= 8;
      b.destroy(); enemyBullets.splice(i, 1);
    }
  }
}

function restart() {
  score = 0; xp = 0; hp = 100; wave = 1; alive = true;
  waveKills = 0; waveTarget = 5;
  tankGroup.position.set(0, 0, 0);
  tankAngle = 0; tankSpeed = 0;

  playerBullets.forEach(b => b.destroy()); playerBullets.length = 0;
  enemyBullets.forEach(b  => b.destroy()); enemyBullets.length  = 0;
  enemies.forEach(e => e.destroy());       enemies.length       = 0;

  hideGameOver();
  spawnWave(5);
}

document.getElementById('restart-btn').addEventListener('click', restart);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  TWEEN.update();

  if (alive) {
    updateTank(dt);
    updatePlayerBullets(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateHUD(score, wave, enemies.length, xp, hp);

    if (hp <= 0) {
      alive = false;
      showGameOver(wave, score, xp);
    }
  }

  renderer.render(scene, camera);
}

spawnWave(5);
animate();

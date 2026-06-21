const scoreEl   = document.getElementById('score-val');
const waveEl    = document.getElementById('wave-val');
const enemiesEl = document.getElementById('enemies-val');
const xpEl      = document.getElementById('xp-val');
const hpBarEl   = document.getElementById('hp-bar');
const waveAnn   = document.getElementById('wave-announce');
const gameOver  = document.getElementById('game-over');
const finalStats= document.getElementById('final-stats');

export function updateHUD(score, wave, enemyCount, xp, hp) {
  scoreEl.textContent   = score;
  waveEl.textContent    = wave;
  enemiesEl.textContent = enemyCount;
  xpEl.textContent      = xp;

  const pct = Math.max(0, Math.min(100, hp));
  hpBarEl.style.width      = pct + '%';
  hpBarEl.style.background = pct > 50 ? '#f97316' : pct > 25 ? '#fbbf24' : '#ef4444';
}

export function announceWave(waveNumber) {
  waveAnn.textContent = `WAVE ${waveNumber}`;
  waveAnn.style.opacity = 1;
  setTimeout(() => { waveAnn.style.opacity = 0; }, 2000);
}

export function showGameOver(wave, score, xp) {
  finalStats.innerHTML =
    `WAVE REACHED: ${wave}<br>SCORE: ${score}<br>XP EARNED: ${xp}`;
  gameOver.style.display = 'flex';
}

export function hideGameOver() {
  gameOver.style.display = 'none';
}

let hudAccentColor = '#f97316';

export function setHudAccentColor(color) {
  hudAccentColor = color;
  document.querySelectorAll('.hud-block').forEach(el => {
    el.style.borderColor = color;
    el.style.color = color;
  });
  const hpBarBg = document.getElementById('hp-bar-bg');
  if (hpBarBg) hpBarBg.style.borderColor = color;
  document.getElementById('crosshair').style.borderColor = color;
}

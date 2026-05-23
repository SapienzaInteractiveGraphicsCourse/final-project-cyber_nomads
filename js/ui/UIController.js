import { STATE } from '../utils/constants.js';

export class UIController {
  constructor() {
    this.startScreen = document.getElementById('start-screen');
    this.hud = document.getElementById('hud');
    this.gameOver = document.getElementById('game-over');
    this.finalScore = document.getElementById('final-score');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.healthBar = document.getElementById('health-bar');
    this.scoreEl = document.getElementById('score');
    this.waveEl = document.getElementById('wave');

    this.state = STATE.START;
    this.score = 0;
    this.wave = 1;
    this.highScore = parseInt(localStorage.getItem('ctaHighScore') || '0', 10);
    this._showHighScore();
  }

  showState(state) {
    this.state = state;
    this.startScreen.classList.toggle('hidden', state !== STATE.START);
    this.hud.classList.toggle('hidden', state !== STATE.PLAYING);
    this.gameOver.classList.toggle('hidden', state !== STATE.GAMEOVER);
  }

  updateHealth(percent) {
    this.healthBar.style.width = `${percent * 100}%`;
    this.healthBar.classList.toggle('danger', percent < 0.3);
  }

  updateScore(points) {
    this.score = points;
    this.scoreEl.textContent = `SCORE ${String(points).padStart(6, '0')}`;
  }

  updateWave(num) {
    this.wave = num;
    this.waveEl.textContent = `WAVE ${num}`;
  }

  showGameOver(finalScoreValue) {
    this.showState(STATE.GAMEOVER);
    this.finalScore.textContent = `SCORE ${String(finalScoreValue).padStart(6, '0')}`;
    if (finalScoreValue > this.highScore) {
      this.highScore = finalScoreValue;
      localStorage.setItem('ctaHighScore', String(this.highScore));
      this.finalScore.textContent += '  NEW HIGH SCORE';
    }
    this._showHighScore();
  }

  _showHighScore() {
    if (this.highScore > 0) {
      this.highScoreDisplay.textContent = `High Score: ${String(this.highScore).padStart(6, '0')}`;
    }
  }

  get isPlaying() { return this.state === STATE.PLAYING; }
}

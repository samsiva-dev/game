/* ══ DevArcade — App Core ══ */

const App = {
  current: 'hub',

  launchGame(game) {
    this.showScreen('screen-' + game);
    this.current = game;
    if (game === 'typer')   TyperGame.init();
    if (game === 'bugbash') BugBash.init();
    if (game === 'runner')  RunnerGame.init();
  },

  goHome() {
    TyperGame.stop();
    BugBash.stop();
    RunnerGame.stop();
    this.showScreen('screen-hub');
    this.current = 'hub';
    this.refreshHubStats();
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  /* ─ Scores (localStorage) ─ */
  getScore(key) {
    return parseInt(localStorage.getItem('devarcade_' + key) || '0', 10);
  },

  saveScore(key, val) {
    const prev = this.getScore(key);
    if (val > prev) localStorage.setItem('devarcade_' + key, String(val));
  },

  refreshHubStats() {
    const wpm  = this.getScore('wpm');
    const bugs = this.getScore('bugs');
    const run  = this.getScore('run');
    set('hub-wpm',  wpm  || '—');
    set('hub-bugs', bugs || '—');
    set('hub-run',  run  ? run + 'm' : '—');
    set('card-wpm',  wpm  || '—');
    set('card-bugs', bugs || '—');
    set('card-run',  run  ? run + 'm' : '—');
  },
};

/* ─ Utility ─ */
function $(id) { return document.getElementById(id); }
function set(id, val) { const el = $(id); if (el) el.textContent = val; }

/* ══ Matrix Rain Background ══ */
(function initMatrix() {
  const canvas = $('matrix-canvas');
  const ctx = canvas.getContext('2d');
  const CHARS = '{}[]()<>;.,!=+-*/&|^%$#@0123456789ABCDEFabcdefconst let var fn';

  let cols, drops;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / 18);
    drops = new Array(cols).fill(1).map(() => Math.random() * canvas.height / 14);
  }

  function draw() {
    ctx.fillStyle = 'rgba(13,17,23,0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#39d353';
    ctx.font = '13px JetBrains Mono, monospace';

    for (let i = 0; i < cols; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      ctx.fillStyle = `rgba(57,211,83,${0.06 + Math.random() * 0.09})`;
      ctx.fillText(char, i * 18, drops[i] * 14);
      if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5;
    }
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 80);
})();

/* ── Init ── */
window.addEventListener('DOMContentLoaded', () => {
  App.refreshHubStats();
});

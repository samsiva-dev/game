/* ══ Bug Squasher — Whack-a-Mole Style ══ */

const BugBash = (() => {
  const COLS = 5, ROWS = 4, TOTAL = COLS * ROWS;

  /* Bug stage definitions */
  const STAGES = [
    { icon: '·',  label: '',         color: '',             pts: 0,    ms: null },
    { icon: '🐛', label: 'BUG',      color: 'var(--green)', pts: 10,   ms: 4500 },
    { icon: '🐛', label: 'GROWING',  color: 'var(--yellow)',pts: 25,   ms: 3200 },
    { icon: '⚠️', label: 'WARNING',  color: 'var(--orange)',pts: 50,   ms: 2500 },
    { icon: '❌', label: 'ERROR',    color: 'var(--red)',   pts: 100,  ms: 1800 },
    { icon: '💀', label: 'CRITICAL', color: '#ff0',         pts: 0,    ms: null },
  ];

  /* ─ State ─ */
  let cells = [];           // [{stage, timerId, elem}]
  let score = 0;
  let combo = 1;
  let lastSquashAt = 0;
  let timeLeft = 60;
  let clockId = null;
  let spawnId = null;
  let running = false;
  let spawnRate = 2500;

  const wrap = () => $('bugbash-wrap');

  /* ── Init ── */
  function init() {
    stop();
    renderSetup();
  }

  function renderSetup() {
    wrap().innerHTML = `
      <div class="bugbash-setup">
        <h2>// Production is on fire!</h2>
        <p>Click bugs before they escalate to CRITICAL.<br>
           Higher stages = more points, but CRITICAL steals <strong style="color:var(--red)">200 pts</strong>!</p>
        <div class="bug-stages-legend">
          ${STAGES.slice(1).map(s =>
            `<span class="legend-item" style="border-color:${s.color};color:${s.color}">
              ${s.icon} ${s.label} ${s.pts > 0 ? '+' + s.pts : s.pts}
            </span>`
          ).join('')}
        </div>
        <button class="btn-primary" id="bugbash-start-btn">▶ Deploy Hotfix</button>
      </div>`;
    $('bugbash-start-btn').addEventListener('click', startGame);
  }

  /* ── Game Start ── */
  function startGame() {
    score = 0; combo = 1; timeLeft = 60; spawnRate = 2500; running = true;
    set('bugbash-score', 0);
    set('bugbash-combo', '×1');
    set('bugbash-time', 60);

    buildGrid();
    startClock();
    scheduleSpawn();
  }

  function buildGrid() {
    cells = [];
    const grid = document.createElement('div');
    grid.className = 'bug-grid';
    grid.id = 'bug-grid';

    for (let i = 0; i < TOTAL; i++) {
      const cell = { stage: 0, timerId: null, elem: null };
      const el = document.createElement('div');
      el.className = 'bug-cell stage-0';
      el.dataset.idx = i;
      el.innerHTML = `<span class="bug-cell-icon">·</span><span class="bug-cell-label"></span>`;
      el.addEventListener('click', () => onCellClick(i));
      cell.elem = el;
      cells.push(cell);
      grid.appendChild(el);
    }

    wrap().innerHTML = '';
    wrap().appendChild(grid);
  }

  /* ── Spawning ── */
  function scheduleSpawn() {
    if (!running) return;
    spawnId = setTimeout(() => {
      spawnBug();
      spawnRate = Math.max(1000, spawnRate - 50); // accelerate
      scheduleSpawn();
    }, spawnRate + Math.random() * 600 - 300);
  }

  function spawnBug() {
    const empty = cells.filter(c => c.stage === 0);
    if (!empty.length) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    setCellStage(cell, 1);
  }

  /* ── Stage Lifecycle ── */
  function setCellStage(cell, stage) {
    clearTimeout(cell.timerId);
    cell.stage = stage;
    renderCell(cell);

    if (stage === 0 || stage === 5) return; // terminal states handled elsewhere

    const ms = STAGES[stage].ms;
    if (ms) {
      cell.timerId = setTimeout(() => {
        if (!running) return;
        if (cell.stage < 5) {
          setCellStage(cell, cell.stage + 1);
        }
        if (cell.stage === 5) {
          // CRITICAL spreads after 1.5s then deducts points
          cell.timerId = setTimeout(() => {
            if (!running) return;
            onCriticalEscape(cell);
          }, 1500);
        }
      }, ms);
    }
  }

  function onCriticalEscape(cell) {
    score = Math.max(0, score + STAGES[5].pts);
    set('bugbash-score', score);
    showScorePop(cell.elem, STAGES[5].pts);

    // Try to spread to one neighbor
    const idx = cells.indexOf(cell);
    const neighbors = getNeighbors(idx).filter(i => cells[i].stage === 0);
    if (neighbors.length) {
      setCellStage(cells[neighbors[0]], 1);
    }
    // Reset this cell
    setCellStage(cell, 0);
  }

  function getNeighbors(idx) {
    const row = Math.floor(idx / COLS), col = idx % COLS;
    const ns = [];
    if (row > 0)        ns.push(idx - COLS);
    if (row < ROWS - 1) ns.push(idx + COLS);
    if (col > 0)        ns.push(idx - 1);
    if (col < COLS - 1) ns.push(idx + 1);
    return ns;
  }

  /* ── Click Handler ── */
  function onCellClick(i) {
    if (!running) return;
    const cell = cells[i];
    if (cell.stage === 0) return;

    const now = Date.now();
    if (now - lastSquashAt < 1200) {
      combo = Math.min(combo + 1, 8);
    } else {
      combo = 1;
    }
    lastSquashAt = now;

    const pts = STAGES[cell.stage].pts * combo;
    score += pts;
    set('bugbash-score', score);
    set('bugbash-combo', '×' + combo);

    showScorePop(cell.elem, '+' + pts);
    cell.elem.classList.add('squashed');
    setTimeout(() => {
      cell.elem.classList.remove('squashed');
      setCellStage(cell, 0);
    }, 400);
    clearTimeout(cell.timerId);
  }

  /* ── Rendering ── */
  function renderCell(cell) {
    const el = cell.elem;
    if (!el) return;
    el.className = `bug-cell stage-${cell.stage}`;
    el.querySelector('.bug-cell-icon').textContent = STAGES[cell.stage].icon;
    el.querySelector('.bug-cell-label').textContent = STAGES[cell.stage].label;
  }

  /* ── Score Popup ── */
  function showScorePop(elem, text) {
    const rect = elem.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = String(text);
    pop.style.left = rect.left + rect.width / 2 - 20 + 'px';
    pop.style.top  = rect.top + 'px';
    pop.style.color = String(text).startsWith('-') ? 'var(--red)' : combo > 3 ? 'var(--yellow)' : 'var(--green)';
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 900);
  }

  /* ── Clock ── */
  function startClock() {
    clockId = setInterval(() => {
      if (!running) return;
      timeLeft--;
      set('bugbash-time', timeLeft);
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  /* ── Game Over ── */
  function endGame() {
    running = false;
    clearInterval(clockId);
    clearTimeout(spawnId);
    cells.forEach(c => clearTimeout(c.timerId));

    App.saveScore('bugs', score);
    const isNew = score >= App.getScore('bugs');

    wrap().innerHTML = `
      <div class="bugbash-result">
        <div class="result-title ${score > 0 ? 'success' : 'timeout'}">
          ${score > 500 ? '🏆 Legendary Dev!' : score > 200 ? '🎉 Bugs Crushed!' : '😅 Production Survived...'}
        </div>
        ${isNew && score > 0 ? '<p style="color:var(--yellow);font-family:var(--font-mono);margin:.5rem 0">🏆 New High Score!</p>' : ''}
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-val">${score}</span>
            <span class="result-stat-label">Points</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${combo}</span>
            <span class="result-stat-label">Max Combo</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-primary" onclick="BugBash.init()">▶ Play Again</button>
          <button class="btn-secondary" onclick="App.goHome()">← Hub</button>
        </div>
      </div>`;
  }

  function stop() {
    running = false;
    clearInterval(clockId);
    clearTimeout(spawnId);
    cells.forEach(c => clearTimeout(c.timerId));
  }

  return { init, stop };
})();

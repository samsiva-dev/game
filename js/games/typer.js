/* ══ TypeScript Speedrun — Typing Game ══ */

const TyperGame = (() => {
  /* ─ Snippet Database ─ */
  const SNIPPETS = {
    javascript: [
      { level: 'easy', code:
`const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet("World"));` },
      { level: 'medium', code:
`async function fetchUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}` },
      { level: 'hard', code:
`const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};` },
      { level: 'hard', code:
`function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}` },
    ],
    python: [
      { level: 'easy', code:
`def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)` },
      { level: 'medium', code:
`def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1` },
      { level: 'hard', code:
`from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print([fib(i) for i in range(10)])` },
    ],
    rust: [
      { level: 'medium', code:
`fn is_prime(n: u64) -> bool {
    if n < 2 { return false; }
    for i in 2..=((n as f64).sqrt() as u64) {
        if n % i == 0 { return false; }
    }
    true
}` },
      { level: 'hard', code:
`fn factorial(n: u64) -> u64 {
    match n {
        0 | 1 => 1,
        _ => n * factorial(n - 1),
    }
}

fn main() {
    println!("{}", factorial(10));
}` },
    ],
    css: [
      { level: 'easy', code:
`.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 8px;
  background: #1c2128;
  border: 1px solid #30363d;
}` },
      { level: 'medium', code:
`@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.appear {
  animation: fadeIn 300ms ease forwards;
}` },
    ],
  };

  /* ─ State ─ */
  let lang = 'javascript';
  let snippet = null;
  let chars = [];
  let index = 0;
  let errors = 0;
  let totalTyped = 0;
  let startTime = null;
  let timerInterval = null;
  let timeLeft = 60;
  let active = false;

  /* ─ DOM refs ─ */
  const wrap = () => $('typer-wrap');

  /* ─ Init: show setup UI ─ */
  function init() {
    stop();
    renderSetup();
  }

  function renderSetup() {
    wrap().innerHTML = `
      <div class="typer-setup">
        <h2>// Ready to type?</h2>
        <p>Pick a language and difficulty, then start typing the code shown.</p>
        <div class="typer-options">
          <div class="option-group">
            <label>Language</label>
            <select id="typer-lang">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="css">CSS</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" id="typer-go-btn">▶ Start Typing</button>
      </div>`;

    $('typer-lang').addEventListener('change', e => { lang = e.target.value; });
    $('typer-go-btn').addEventListener('click', startGame);
  }

  function pickSnippet() {
    const pool = SNIPPETS[lang] || SNIPPETS.javascript;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function startGame() {
    snippet = pickSnippet();
    chars = snippet.code.split('');
    index = 0;
    errors = 0;
    totalTyped = 0;
    startTime = null;
    timeLeft = 60;
    active = true;

    renderGame();
    tickTimer();
  }

  function renderGame() {
    wrap().innerHTML = `
      <div class="timer-bar"><div class="timer-fill" id="typer-fill" style="width:100%"></div></div>
      <div class="code-display" id="typer-display">
        <span class="code-lang-badge">${lang.toUpperCase()}</span>
        <span id="typer-chars"></span>
      </div>
      <input class="typer-input-capture" id="typer-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="text">
      <p style="font-family:var(--font-mono);font-size:.78rem;color:var(--muted);text-align:center;margin-top:8px">
        Click above area then type — Backspace allowed
      </p>`;

    document.getElementById('typer-display').addEventListener('click', () => {
      document.getElementById('typer-input').focus();
    });

    updateCharDisplay();

    const inp = document.getElementById('typer-input');
    inp.focus();
    inp.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (!active) return;
    if (e.key === 'Tab') { e.preventDefault(); return; }

    if (e.key === 'Backspace') {
      if (index > 0) index--;
      updateCharDisplay();
      return;
    }

    if (e.key.length !== 1) return;
    if (!startTime) startTime = Date.now();

    const expected = chars[index];
    totalTyped++;
    if (e.key !== expected) errors++;
    index++;

    updateCharDisplay();
    updateHUD();

    if (index >= chars.length) {
      finishGame(true);
    }
  }

  function updateCharDisplay() {
    const container = document.getElementById('typer-chars');
    if (!container) return;

    let html = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i] === ' ' ? ' ' : chars[i] === '\n' ? '\n' : chars[i];
      if (i < index) {
        html += `<span class="char-correct">${escHtml(ch)}</span>`;
      } else if (i === index) {
        html += `<span class="char-cursor">${escHtml(ch)}</span>`;
      } else {
        html += `<span class="char-pending">${escHtml(ch)}</span>`;
      }
    }
    container.innerHTML = html;

    // Scroll cursor into view
    const cursor = container.querySelector('.char-cursor');
    if (cursor) cursor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function updateHUD() {
    if (!startTime) return;
    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const wpm = elapsed > 0 ? Math.round((totalTyped / 5) / elapsed) : 0;
    const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;
    set('typer-wpm', wpm);
    set('typer-acc', acc + '%');
  }

  function tickTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!active) return;
      timeLeft--;
      set('typer-time', timeLeft);
      const fill = document.getElementById('typer-fill');
      if (fill) {
        const pct = (timeLeft / 60) * 100;
        fill.style.width = pct + '%';
        fill.style.background = timeLeft <= 15 ? 'var(--red)' : timeLeft <= 30 ? 'var(--orange)' : 'var(--yellow)';
      }
      if (timeLeft <= 0) finishGame(false);
    }, 1000);
  }

  function finishGame(completed) {
    active = false;
    clearInterval(timerInterval);

    const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0.001;
    const wpm = Math.round((index / 5) / elapsed);
    const acc = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100;

    App.saveScore('wpm', wpm);

    const isNew = wpm >= App.getScore('wpm');

    wrap().innerHTML = `
      <div class="typer-result">
        <div class="result-title ${completed ? 'success' : 'timeout'}">
          ${completed ? '🎉 Code Complete!' : '⏱ Time\'s Up!'}
        </div>
        ${isNew && wpm > 0 ? '<p style="color:var(--yellow);font-family:var(--font-mono);margin:.5rem 0">🏆 New Personal Best!</p>' : ''}
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-val">${wpm}</span>
            <span class="result-stat-label">WPM</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${acc}%</span>
            <span class="result-stat-label">Accuracy</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${index}</span>
            <span class="result-stat-label">Chars Typed</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-val">${errors}</span>
            <span class="result-stat-label">Mistakes</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="btn-primary" onclick="TyperGame.init()">▶ Play Again</button>
          <button class="btn-secondary" onclick="App.goHome()">← Hub</button>
        </div>
      </div>`;
  }

  function stop() {
    active = false;
    clearInterval(timerInterval);
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { init, stop };
})();

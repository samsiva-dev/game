/* ══ Dev Runner — Endless Canvas Runner ══ */

const RunnerGame = (() => {
  /* ─ Canvas Setup ─ */
  let canvas, ctx, W, H, groundY;
  let raf = null;
  let gameState = 'idle'; // idle | playing | dead

  /* ─ Game State ─ */
  let frame, speed, distance;
  let player, obstacles, collectibles, bgChars, particles;

  /* ─ Input ─ */
  const keys = { jump: false, duck: false };

  /* ── Init (called each time screen opens) ── */
  function init() {
    canvas = $('runner-canvas');
    ctx    = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    showOverlay('Dev Runner', '// Dodge errors · Collect coffee · Ship it!', '▶ Start Game', start);

    // Bind keys
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);

    // Touch support (use onclick to avoid accumulating listeners)
    canvas.onclick = () => { if (gameState === 'playing') doJump(); else if (gameState === 'dead') start(); };
    canvas.addEventListener('touchstart', e => { e.preventDefault(); if (gameState === 'playing') doJump(); else if (gameState === 'dead') start(); }, { passive: false });

    gameState = 'idle';
  }

  function resizeCanvas() {
    const wrap = $('runner-wrap');
    W = Math.min(wrap.clientWidth - 48, 900);
    H = Math.min(Math.floor(W * 0.42), 380);
    canvas.width  = W;
    canvas.height = H;
    groundY = H - 70;
  }

  /* ─ Overlay ─ */
  function showOverlay(title, sub, btnText, btnFn) {
    const ov = $('runner-overlay');
    ov.classList.remove('hidden');
    $('overlay-title').textContent = title;
    $('overlay-subtitle').textContent = sub;
    const btn = $('runner-start-btn');
    btn.textContent = btnText;
    // Rebind
    btn.onclick = btnFn;
  }

  function hideOverlay() {
    $('runner-overlay').classList.add('hidden');
  }

  /* ── Start / Reset ── */
  function start() {
    cancelAnimationFrame(raf);
    hideOverlay();
    gameState = 'playing';
    frame = 0;
    speed = 4.5;
    distance = 0;

    player = {
      x: 110, y: groundY - 56,
      w: 28, h: 56,
      vy: 0, jumping: false, ducking: false,
      animTick: 0,
      invincible: false, invTimer: 0,
    };

    obstacles    = [];
    collectibles = [];
    particles    = [];
    bgChars      = buildBgChars();

    loop();
  }

  /* ── Main Loop ── */
  function loop() {
    update();
    render();
    if (gameState === 'playing') {
      raf = requestAnimationFrame(loop);
    }
  }

  /* ── Update ── */
  function update() {
    frame++;
    distance++;
    speed = Math.min(4.5 + distance * 0.003, 14);

    // HUD
    set('runner-dist',  Math.floor(distance / 6) + 'm');
    set('runner-speed', speed.toFixed(1) + '×');

    // Player physics
    const GRAVITY = 0.72;

    if (keys.jump && !player.jumping && !player.ducking) doJump();
    if (keys.duck && !player.jumping) startDuck();
    if (!keys.duck && player.ducking) endDuck();

    if (player.jumping) {
      player.vy += GRAVITY;
      player.y  += player.vy;
      if (player.y >= groundY - player.h) {
        player.y  = groundY - player.h;
        player.vy = 0;
        player.jumping = false;
      }
    }

    if (player.invincible) {
      player.invTimer--;
      if (player.invTimer <= 0) player.invincible = false;
    }

    if (!player.ducking && !player.jumping) player.animTick++;

    // Spawn obstacles — interval shrinks with speed
    const spawnGap = Math.max(48, Math.floor(130 - speed * 5));
    if (frame % spawnGap === 0) spawnObstacle();

    // Spawn collectibles
    if (frame % 220 === 0) spawnCollectible();

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }

      // Collision
      if (!player.invincible && rectsOverlap(player, o, 5)) {
        spawnDeathParticles();
        gameState = 'dead';
        const dist = Math.floor(distance / 6);
        App.saveScore('run', dist);
        const isNew = dist >= App.getScore('run');
        setTimeout(() => {
          showOverlay(
            isNew && dist > 0 ? `🏆 ${dist}m — New Best!` : `💥 Runtime Error`,
            `// You made it ${dist}m before crashing`,
            '▶ Restart',
            start
          );
        }, 800);
        return;
      }
    }

    // Move collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      c.x -= speed;
      c.bobY = Math.sin(frame * 0.07) * 5;
      if (c.x + c.w < -20) { collectibles.splice(i, 1); continue; }

      if (!c.collected && rectsOverlap(player, { x: c.x, y: c.y + c.bobY, w: c.w, h: c.h }, 2)) {
        c.collected = true;
        player.invincible = true;
        player.invTimer = 140;
        spawnCoffeeParticles(c);
        collectibles.splice(i, 1);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Background chars drift
    bgChars.forEach(c => {
      c.x -= c.spd;
      if (c.x < -20) { c.x = W + 10; c.y = 20 + Math.random() * (groundY - 40); }
    });
  }

  function doJump() {
    if (!player.jumping && !player.ducking) {
      player.vy = -15.5;
      player.jumping = true;
    }
  }

  function startDuck() {
    if (!player.jumping) {
      player.ducking = true;
      player.h = 30;
      player.y = groundY - 30;
    }
  }

  function endDuck() {
    player.ducking = false;
    player.h = 56;
    if (!player.jumping) player.y = groundY - 56;
  }

  /* ── Spawners ── */
  const OBS_TYPES = [
    { id: 'bug',  label: '🐛 BUG',  w: 28, h: 52, color: '#39d353', ground: true  },
    { id: 'err',  label: '⚠️ ERR',  w: 28, h: 72, color: '#ff7b72', ground: true  },
    { id: 'null', label: 'null',     w: 22, h: 36, color: '#d2a8ff', ground: true  },
    { id: 'mtg',  label: '📅 MTG',  w: 68, h: 28, color: '#e3b341', ground: false, yOffset: 80 },
    { id: 'seg',  label: 'SEGFAULT', w: 24, h: 60, color: '#ffa657', ground: true  },
  ];

  function spawnObstacle() {
    const t = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
    obstacles.push({
      ...t,
      x: W + 40,
      y: t.ground ? groundY - t.h : groundY - t.yOffset - t.h,
    });
  }

  function spawnCollectible() {
    collectibles.push({
      x: W + 40, y: groundY - 100,
      w: 28, h: 28, bobY: 0, collected: false,
    });
  }

  /* ── Particles ── */
  function spawnDeathParticles() {
    for (let i = 0; i < 18; i++) {
      const ang = (Math.PI * 2 * i) / 18;
      particles.push({
        x: player.x + player.w / 2, y: player.y + player.h / 2,
        vx: Math.cos(ang) * (2 + Math.random() * 3),
        vy: Math.sin(ang) * (2 + Math.random() * 3) - 2,
        life: 35 + Math.random() * 20,
        color: '#ff7b72',
        r: 3 + Math.random() * 3,
      });
    }
  }

  function spawnCoffeeParticles(c) {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: c.x + c.w / 2, y: c.y + c.h / 2,
        vx: (Math.random() - 0.5) * 5,
        vy: -2 - Math.random() * 3,
        life: 25 + Math.random() * 15,
        color: '#e3b341',
        r: 2 + Math.random() * 2,
      });
    }
  }

  /* ── Render ── */
  function render() {
    ctx.clearRect(0, 0, W, H);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#050a0f');
    sky.addColorStop(1, '#0d1117');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Background code characters
    bgChars.forEach(c => {
      ctx.font = `${c.sz}px JetBrains Mono, monospace`;
      ctx.fillStyle = `rgba(57,211,83,${c.op})`;
      ctx.fillText(c.ch, c.x, c.y);
    });

    // Ground
    const grd = ctx.createLinearGradient(0, groundY, 0, H);
    grd.addColorStop(0, '#1a2030');
    grd.addColorStop(1, '#0d1117');
    ctx.fillStyle = grd;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = '#39d353';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#39d353';
    ctx.beginPath();
    ctx.moveTo(0, groundY); ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Obstacles
    obstacles.forEach(drawObstacle);

    // Collectibles (coffee)
    collectibles.forEach(c => {
      ctx.font = `22px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('☕', c.x + c.w / 2, c.y + c.h + c.bobY);
      ctx.textAlign = 'left';

      ctx.strokeStyle = 'rgba(227,179,65,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 + c.bobY, c.w, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.max(0, Math.floor((p.life / 50) * 255)).toString(16).padStart(2, '0');
      ctx.fill();
    });

    // Player
    drawPlayer();

    // HUD overlay on canvas
    ctx.fillStyle = 'rgba(57,211,83,.9)';
    ctx.font = `bold 13px JetBrains Mono, monospace`;
    ctx.fillText(`${Math.floor(distance / 6)}m`, 12, 24);

    if (player.invincible) {
      const t = Math.sin(frame * 0.2) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(227,179,65,${t})`;
      ctx.font = `bold 12px JetBrains Mono, monospace`;
      ctx.fillText('☕ CAFFEINATED!', W / 2 - 60, 24);
    }

    // Death flash
    if (gameState === 'dead') {
      ctx.fillStyle = 'rgba(255,123,114,0.18)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawObstacle(o) {
    const glow = o.color;

    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.fillStyle = glow + '22';
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeRect(o.x, o.y, o.w, o.h);

    ctx.shadowBlur = 0;
    ctx.fillStyle = glow;
    ctx.font = `bold 8px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    // Split label on space for two lines
    const parts = o.label.split(' ');
    if (parts.length === 2) {
      ctx.fillText(parts[0], o.x + o.w / 2, o.y + o.h / 2 - 4);
      ctx.fillText(parts[1], o.x + o.w / 2, o.y + o.h / 2 + 7);
    } else {
      ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);
    }
    ctx.textAlign = 'left';
  }

  function drawPlayer() {
    const p = player;
    const cx = p.x + p.w / 2;

    if (p.invincible) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#e3b341';
    }

    const legPhase = (p.animTick % 16) / 16;
    const leg1 = p.ducking ? 0 : Math.sin(legPhase * Math.PI * 2) * 10;
    const leg2 = p.ducking ? 0 : Math.sin(legPhase * Math.PI * 2 + Math.PI) * 10;

    if (!p.ducking) {
      // Legs
      ctx.fillStyle = '#4a5568';
      ctx.save(); ctx.translate(cx - 6, p.y + p.h * 0.55); ctx.rotate(leg1 * Math.PI / 180);
      ctx.fillRect(-4, 0, 8, p.h * 0.3);
      ctx.restore();
      ctx.save(); ctx.translate(cx + 6, p.y + p.h * 0.55); ctx.rotate(leg2 * Math.PI / 180);
      ctx.fillRect(-4, 0, 8, p.h * 0.3);
      ctx.restore();
    }

    // Body (hoodie)
    ctx.fillStyle = '#79c0ff';
    ctx.fillRect(p.x + 3, p.y + (p.ducking ? 0 : 20), p.w - 6, p.h * (p.ducking ? 1 : 0.42));

    if (!p.ducking) {
      // Head
      ctx.fillStyle = '#ffd27a';
      ctx.beginPath();
      ctx.arc(cx, p.y + 11, 11, 0, Math.PI * 2);
      ctx.fill();

      // Glasses
      ctx.strokeStyle = '#79c0ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 10, p.y + 8, 7, 5);
      ctx.strokeRect(cx + 3,  p.y + 8, 7, 5);
      ctx.beginPath(); ctx.moveTo(cx - 3, p.y + 11); ctx.lineTo(cx + 3, p.y + 11);
      ctx.stroke();

      // Hair
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(cx - 10, p.y + 3, 20, 7);
      ctx.beginPath(); ctx.arc(cx, p.y + 3, 10, Math.PI, 0); ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  /* ── Background Chars ── */
  function buildBgChars() {
    const pool = '{}[];=>const let async await null undefined NaN void return if for'.split('');
    const arr = [];
    for (let i = 0; i < 55; i++) {
      arr.push({
        x:   Math.random() * W,
        y:   20 + Math.random() * (groundY - 40),
        ch:  pool[Math.floor(Math.random() * pool.length)],
        spd: 0.4 + Math.random() * 1.2,
        op:  0.04 + Math.random() * 0.08,
        sz:  10 + Math.random() * 10,
      });
    }
    return arr;
  }

  /* ── Collision ── */
  function rectsOverlap(a, b, pad) {
    return (
      a.x + pad < b.x + b.w - pad &&
      a.x + a.w - pad > b.x + pad &&
      a.y + pad < b.y + b.h - pad &&
      a.y + a.h - pad > b.y + pad
    );
  }

  /* ── Input ── */
  function onKeyDown(e) {
    if (!['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) return;
    e.preventDefault();
    if (e.code === 'ArrowDown' || e.code === 'KeyS') { keys.duck = true; return; }
    if (gameState === 'playing') { keys.jump = true; doJump(); }
    else if (gameState === 'dead') start();
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.duck = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = false;
  }

  /* ── Stop (when leaving screen) ── */
  function stop() {
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
    if (canvas) window.removeEventListener('resize', resizeCanvas);
    gameState = 'idle';
    set('runner-dist',  '0m');
    set('runner-speed', '1×');
  }

  return { init, stop };
})();

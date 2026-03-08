(() => {
  "use strict";

  const STORAGE_KEY = "tap-siege-best-score";

  const CONFIG = {
    maxHp: 100,
    levelDurationMs: 10000,
    spawnStartMs: 1150,
    spawnMinMs: 330,
    spawnStepMs: 72,
    enemyLifeStartMs: 2500,
    enemyLifeMinMs: 900,
    enemyLifeStepMs: 115,
    missDamageBase: 11,
    missDamageScale: 1.4,
    maxEnemiesStart: 4,
    maxEnemiesCap: 10,
    survivalScorePerSecond: 1,
  };

  const ui = {
    app: document.querySelector(".app"),
    startScreen: document.getElementById("start-screen"),
    playScreen: document.getElementById("play-screen"),
    endScreen: document.getElementById("end-screen"),
    hud: document.getElementById("hud"),
    arena: document.getElementById("arena"),
    fxLayer: document.getElementById("fx-layer"),
    toast: document.getElementById("toast"),
    startBtn: document.getElementById("start-btn"),
    restartBtn: document.getElementById("restart-btn"),
    backBtn: document.getElementById("back-btn"),
    reviveBtn: document.getElementById("revive-btn"),
    doubleBtn: document.getElementById("double-btn"),
    hpFill: document.getElementById("hp-fill"),
    hpText: document.getElementById("hp-text"),
    scoreValue: document.getElementById("score-value"),
    timeValue: document.getElementById("time-value"),
    levelValue: document.getElementById("level-value"),
    bestValue: document.getElementById("best-value"),
    finalScore: document.getElementById("final-score"),
    finalTime: document.getElementById("final-time"),
    finalBest: document.getElementById("final-best"),
  };

  if (!ui.app) {
    return;
  }

  const state = {
    running: false,
    hp: CONFIG.maxHp,
    level: 1,
    killScore: 0,
    elapsedMs: 0,
    elapsedOffsetMs: 0,
    startMs: 0,
    frameHandle: 0,
    spawnHandle: 0,
    enemyId: 0,
    enemies: new Map(),
    bestScore: readBestScore(),
    reviveUsed: false,
    doubledUsed: false,
    finalScore: 0,
    toastHandle: 0,
  };

  bindEvents();
  renderHud();
  showStartScreen();

  function bindEvents() {
    ui.startBtn.addEventListener("click", startRun);
    ui.restartBtn.addEventListener("click", startRun);
    ui.backBtn.addEventListener("click", showStartScreen);
    ui.reviveBtn.addEventListener("click", handleRevive);
    ui.doubleBtn.addEventListener("click", handleDoubleReward);

    ui.arena.addEventListener("pointerdown", (event) => {
      if (event.target !== ui.arena) {
        return;
      }
      const point = getArenaPoint(event);
      spawnTapSparks(point.x, point.y, 4);
    });
  }

  function showStartScreen() {
    stopRunLoop();
    clearEnemies();
    state.running = false;
    state.hp = CONFIG.maxHp;
    state.level = 1;
    state.killScore = 0;
    state.elapsedMs = 0;
    state.elapsedOffsetMs = 0;
    state.reviveUsed = false;
    state.doubledUsed = false;
    state.finalScore = 0;

    toggle(ui.startScreen, true);
    toggle(ui.endScreen, false);
    toggle(ui.hud, false);
    toggle(ui.playScreen, false);

    renderHud();
    updateEndSummary();
  }

  function startRun() {
    stopRunLoop();
    clearEnemies();

    state.running = true;
    state.hp = CONFIG.maxHp;
    state.level = 1;
    state.killScore = 0;
    state.elapsedMs = 0;
    state.elapsedOffsetMs = 0;
    state.startMs = performance.now();
    state.reviveUsed = false;
    state.doubledUsed = false;
    state.finalScore = 0;

    toggle(ui.startScreen, false);
    toggle(ui.endScreen, false);
    toggle(ui.hud, true);
    toggle(ui.playScreen, true);

    renderHud();
    scheduleSpawn(220);
    runFrame();
    showToast("Survive as long as possible.", 1000);
  }

  function runFrame(now = performance.now()) {
    if (!state.running) {
      return;
    }

    state.elapsedMs = state.elapsedOffsetMs + (now - state.startMs);
    state.level = 1 + Math.floor(state.elapsedMs / CONFIG.levelDurationMs);
    renderHud();

    state.frameHandle = window.requestAnimationFrame(runFrame);
  }

  function scheduleSpawn(delayMs) {
    clearTimeout(state.spawnHandle);
    state.spawnHandle = window.setTimeout(() => {
      if (!state.running) {
        return;
      }
      spawnEnemy();
      scheduleSpawn(getSpawnIntervalMs());
    }, delayMs);
  }

  function spawnEnemy() {
    if (!state.running) {
      return;
    }

    if (state.enemies.size >= getEnemyCap()) {
      return;
    }

    const arenaRect = ui.arena.getBoundingClientRect();
    if (arenaRect.width < 40 || arenaRect.height < 40) {
      return;
    }

    const id = ++state.enemyId;
    const isElite = Math.random() < Math.min(0.12 + state.level * 0.02, 0.42);
    const maxSize = isElite ? 84 : 76;
    const minSize = isElite ? 60 : 50;
    const size = clamp(randomInt(minSize, maxSize) - state.level, 44, 88);

    const maxX = Math.max(8, arenaRect.width - size - 8);
    const maxY = Math.max(8, arenaRect.height - size - 8);
    const x = randomInt(8, Math.floor(maxX));
    const y = randomInt(8, Math.floor(maxY));

    const enemy = document.createElement("button");
    enemy.type = "button";
    enemy.className = `enemy${isElite ? " enemy--elite" : ""}`;
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    enemy.style.setProperty("--size", `${size}px`);

    const hitPoints = isElite ? 2 : 1;
    if (hitPoints > 1) {
      const core = document.createElement("span");
      core.className = "enemy__core";
      core.textContent = String(hitPoints);
      enemy.append(core);
    }

    const unit = {
      id,
      element: enemy,
      hp: hitPoints,
      points: isElite ? 26 : 10,
      damage: Math.round(CONFIG.missDamageBase + (state.level - 1) * CONFIG.missDamageScale + (isElite ? 3 : 0)),
      timer: 0,
    };

    enemy.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hitEnemy(id, event);
    });

    ui.arena.append(enemy);

    const lifeMs = getEnemyLifeMs();
    unit.timer = window.setTimeout(() => {
      escapeEnemy(id);
    }, lifeMs);

    state.enemies.set(id, unit);
  }

  function hitEnemy(id, event) {
    if (!state.running) {
      return;
    }

    const target = state.enemies.get(id);
    if (!target) {
      return;
    }

    const point = getArenaPoint(event);
    spawnTapSparks(point.x, point.y, 8);

    if (navigator.vibrate) {
      navigator.vibrate(8);
    }

    target.hp -= 1;
    target.element.classList.add("is-hit");
    window.setTimeout(() => {
      target.element.classList.remove("is-hit");
    }, 70);

    if (target.hp > 0) {
      const core = target.element.querySelector(".enemy__core");
      if (core) {
        core.textContent = String(target.hp);
      }
      return;
    }

    const gained = target.points + Math.max(0, state.level - 1);
    state.killScore += gained;

    destroyEnemy(target, false, point.x, point.y);
    spawnFloatText(`+${gained}`, point.x, point.y, "#ffe89a");
    renderHud();
  }

  function escapeEnemy(id) {
    if (!state.running) {
      return;
    }

    const target = state.enemies.get(id);
    if (!target) {
      return;
    }

    const center = getEnemyCenter(target.element);
    destroyEnemy(target, true, center.x, center.y);
    applyDamage(target.damage);
    spawnFloatText(`-${target.damage} HP`, center.x, center.y, "#ffd8df");
    showToast(`Breach! -${target.damage} HP`, 900);
    triggerShake();
  }

  function destroyEnemy(target, escaped, x, y) {
    clearTimeout(target.timer);
    state.enemies.delete(target.id);

    target.element.classList.add(escaped ? "is-escape" : "is-defeated");
    window.setTimeout(() => {
      target.element.remove();
    }, escaped ? 290 : 240);

    spawnTapSparks(x, y, escaped ? 4 : 6);
  }

  function applyDamage(amount) {
    state.hp = clamp(state.hp - amount, 0, CONFIG.maxHp);
    renderHud();

    if (state.hp <= 0) {
      endRun();
    }
  }

  function endRun() {
    if (!state.running) {
      return;
    }

    state.running = false;
    state.elapsedOffsetMs = state.elapsedMs;
    state.finalScore = getCurrentScore();

    persistBest(state.finalScore);
    stopRunLoop();
    clearEnemies();

    toggle(ui.hud, false);
    toggle(ui.playScreen, false);
    toggle(ui.endScreen, true);

    ui.reviveBtn.disabled = state.reviveUsed;
    ui.doubleBtn.disabled = state.doubledUsed;
    ui.doubleBtn.textContent = state.doubledUsed ? "x2 Reward Claimed" : "Watch Ad for x2 Reward";

    updateEndSummary();
  }

  async function handleRevive() {
    if (state.running || state.reviveUsed) {
      return;
    }

    ui.reviveBtn.disabled = true;
    const rewarded = await showRewardedAd("revive");

    if (!rewarded) {
      ui.reviveBtn.disabled = false;
      showToast("Ad was skipped or unavailable.", 1000);
      return;
    }

    state.reviveUsed = true;
    state.hp = Math.max(30, Math.round(CONFIG.maxHp * 0.4));

    toggle(ui.endScreen, false);
    toggle(ui.hud, true);
    toggle(ui.playScreen, true);

    state.running = true;
    state.startMs = performance.now();
    state.elapsedOffsetMs = state.elapsedMs;

    clearEnemies();
    renderHud();
    scheduleSpawn(280);
    runFrame();

    showToast("Revived. Keep tapping.", 1000);
  }

  async function handleDoubleReward() {
    if (state.running || state.doubledUsed) {
      return;
    }

    ui.doubleBtn.disabled = true;
    const rewarded = await showRewardedAd("double_reward");

    if (!rewarded) {
      ui.doubleBtn.disabled = false;
      showToast("Ad was skipped or unavailable.", 1000);
      return;
    }

    state.doubledUsed = true;
    state.finalScore *= 2;
    persistBest(state.finalScore);

    ui.doubleBtn.disabled = true;
    ui.doubleBtn.textContent = "x2 Reward Claimed";

    updateEndSummary();
    showToast(`Reward doubled: ${state.finalScore}`, 1200);
  }

  function stopRunLoop() {
    clearTimeout(state.spawnHandle);
    window.cancelAnimationFrame(state.frameHandle);
    state.spawnHandle = 0;
    state.frameHandle = 0;
  }

  function clearEnemies() {
    for (const enemy of state.enemies.values()) {
      clearTimeout(enemy.timer);
      enemy.element.remove();
    }
    state.enemies.clear();
  }

  function renderHud() {
    const hpPct = Math.round((state.hp / CONFIG.maxHp) * 100);

    ui.hpFill.style.width = `${hpPct}%`;
    ui.hpFill.style.filter = hpPct <= 30 ? "saturate(1.45) brightness(1.05)" : "none";
    ui.hpText.textContent = String(state.hp);

    ui.scoreValue.textContent = String(getCurrentScore());
    ui.timeValue.textContent = formatTime(state.elapsedMs);
    ui.levelValue.textContent = String(state.level);
    ui.bestValue.textContent = String(state.bestScore);
  }

  function updateEndSummary() {
    ui.finalScore.textContent = String(state.finalScore);
    ui.finalTime.textContent = formatTime(state.elapsedMs);
    ui.finalBest.textContent = String(state.bestScore);
  }

  function persistBest(score) {
    if (score <= state.bestScore) {
      return;
    }
    state.bestScore = score;
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch (_error) {
      // ignore storage failures in private mode/restricted env
    }
    renderHud();
  }

  function readBestScore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    } catch (_error) {
      return 0;
    }
  }

  function getCurrentScore() {
    const survival = Math.floor(state.elapsedMs / 1000) * CONFIG.survivalScorePerSecond;
    return state.killScore + survival;
  }

  function getSpawnIntervalMs() {
    const raw = CONFIG.spawnStartMs - (state.level - 1) * CONFIG.spawnStepMs;
    return clamp(raw + randomInt(-90, 90), CONFIG.spawnMinMs, CONFIG.spawnStartMs);
  }

  function getEnemyLifeMs() {
    const raw = CONFIG.enemyLifeStartMs - (state.level - 1) * CONFIG.enemyLifeStepMs;
    return clamp(raw + randomInt(-140, 140), CONFIG.enemyLifeMinMs, CONFIG.enemyLifeStartMs);
  }

  function getEnemyCap() {
    return clamp(CONFIG.maxEnemiesStart + Math.floor((state.level - 1) / 2), CONFIG.maxEnemiesStart, CONFIG.maxEnemiesCap);
  }

  function spawnTapSparks(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const radius = randomInt(10, 42);
      spark.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
      spark.style.setProperty("--dy", `${Math.sin(angle) * radius}px`);

      ui.fxLayer.append(spark);
      window.setTimeout(() => spark.remove(), 540);
    }
  }

  function spawnFloatText(text, x, y, color) {
    const node = document.createElement("span");
    node.className = "float-score";
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.color = color;
    ui.fxLayer.append(node);
    window.setTimeout(() => node.remove(), 640);
  }

  function showToast(message, duration = 1000) {
    ui.toast.textContent = message;
    toggle(ui.toast, true);
    clearTimeout(state.toastHandle);
    state.toastHandle = window.setTimeout(() => {
      toggle(ui.toast, false);
    }, duration);
  }

  function triggerShake() {
    ui.app.classList.remove("shake");
    void ui.app.offsetWidth;
    ui.app.classList.add("shake");
    window.setTimeout(() => {
      ui.app.classList.remove("shake");
    }, 290);
  }

  function getEnemyCenter(node) {
    const x = node.offsetLeft + node.offsetWidth / 2;
    const y = node.offsetTop + node.offsetHeight / 2;
    return { x, y };
  }

  function getArenaPoint(event) {
    const rect = ui.arena.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    return { x, y };
  }

  function showRewardedAd(placement) {
    const hooks = window.H5AdHooks;

    return new Promise((resolve) => {
      if (hooks && typeof hooks.showRewardedAd === "function") {
        let settled = false;
        const settle = (value) => {
          if (settled) {
            return;
          }
          settled = true;
          resolve(Boolean(value));
        };

        try {
          const maybePromise = hooks.showRewardedAd({
            placement,
            onReward: () => settle(true),
            onClose: () => settle(false),
            onError: () => settle(false),
          });

          if (maybePromise && typeof maybePromise.then === "function") {
            maybePromise.then((value) => settle(value)).catch(() => settle(false));
          }

          window.setTimeout(() => settle(false), 12000);
          return;
        } catch (_error) {
          settle(false);
          return;
        }
      }

      showToast(`Mock ad: ${placement.replace("_", " ")}`, 700);
      window.setTimeout(() => resolve(true), 900);
    });
  }

  function toggle(node, visible) {
    node.classList.toggle("hidden", !visible);
  }

  function formatTime(ms) {
    return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
  }

  function randomInt(min, max) {
    const low = Math.ceil(Math.min(min, max));
    const high = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (high - low + 1)) + low;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();

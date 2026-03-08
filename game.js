(() => {
  "use strict";

  const STORAGE_KEY = "tap-siege-best-score";

  const CONFIG = {
    maxHp: 100,
    levelDurationMs: 10000,
    startSpawnDelayMs: 850,
    spawnStartMs: 1260,
    spawnMinMs: 430,
    spawnStepMs: 72,
    enemyLifeStartMs: 3020,
    enemyLifeMinMs: 1080,
    enemyLifeStepMs: 120,
    missDamageBase: 7,
    missDamageScale: 0.9,
    earlyProtectionMs: 12000,
    earlyDamageMultiplier: 0.68,
    eliteUnlockMs: 6500,
    eliteChanceStart: 0.05,
    eliteChanceStep: 0.018,
    eliteChanceCap: 0.32,
    maxEnemiesStart: 4,
    maxEnemiesCap: 9,
    comboWindowMs: 1400,
    comboBonusPerStack: 2,
    comboBonusCap: 16,
    survivalScorePerSecond: 1,
  };

  const ENEMY_TYPES = [
    {
      key: "slime",
      icon: "🟢",
      badge: "胶",
      baseHp: 1,
      hitReward: 1,
      damageOffset: -1,
      lifeOffset: 210,
      sizeMin: 54,
      sizeMax: 82,
      spawnWeight: 0.34,
      levelWeightStep: -0.012,
    },
    {
      key: "fang",
      icon: "😈",
      badge: "速",
      baseHp: 1,
      hitReward: 1,
      damageOffset: 1,
      lifeOffset: -260,
      sizeMin: 50,
      sizeMax: 76,
      spawnWeight: 0.27,
      levelWeightStep: 0.006,
    },
    {
      key: "bot",
      icon: "🤖",
      badge: "甲",
      baseHp: 2,
      hitReward: 2,
      damageOffset: 1,
      lifeOffset: 60,
      sizeMin: 50,
      sizeMax: 78,
      spawnWeight: 0.24,
      levelWeightStep: 0.005,
    },
    {
      key: "ghost",
      icon: "👻",
      badge: "灵",
      baseHp: 1,
      hitReward: 2,
      damageOffset: 0,
      lifeOffset: -70,
      sizeMin: 56,
      sizeMax: 84,
      spawnWeight: 0.15,
      levelWeightStep: 0.009,
    },
  ];

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
    statusText: document.getElementById("status-text"),
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
    comboCount: 0,
    lastKillMs: 0,
    scorePopHandle: 0,
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
      spawnTapSparks(point.x, point.y, 4, 0.9);
      spawnHitFlash(point.x, point.y, 0.6);
      emitSfx("tap_blank", { x: point.x, y: point.y });
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
    state.comboCount = 0;
    state.lastKillMs = 0;
    ui.reviveBtn.textContent = "观看广告复活";
    ui.doubleBtn.textContent = "观看广告领取双倍结算";

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
    state.enemyId = 0;
    state.comboCount = 0;
    state.lastKillMs = 0;
    ui.reviveBtn.textContent = "观看广告复活";
    ui.doubleBtn.textContent = "观看广告领取双倍结算";

    toggle(ui.startScreen, false);
    toggle(ui.endScreen, false);
    toggle(ui.hud, true);
    toggle(ui.playScreen, true);

    renderHud();
    scheduleSpawn(CONFIG.startSpawnDelayMs);
    runFrame();
    emitSfx("start");
    showToast("开局缓冲缩短：马上进入高密度点击。", 1000);
  }

  function runFrame(now = performance.now()) {
    if (!state.running) {
      return;
    }

    state.elapsedMs = state.elapsedOffsetMs + (now - state.startMs);
    state.level = 1 + Math.floor(state.elapsedMs / CONFIG.levelDurationMs);
    if (state.comboCount > 0 && now - state.lastKillMs > CONFIG.comboWindowMs) {
      state.comboCount = 0;
    }
    renderHud();

    state.frameHandle = window.requestAnimationFrame(runFrame);
  }

  function scheduleSpawn(delayMs) {
    clearTimeout(state.spawnHandle);
    state.spawnHandle = window.setTimeout(() => {
      if (!state.running) {
        return;
      }
      const batchCount = getSpawnBatchCount();
      for (let i = 0; i < batchCount; i += 1) {
        if (!spawnEnemy()) {
          break;
        }
      }
      scheduleSpawn(getSpawnIntervalMs());
    }, delayMs);
  }

  function spawnEnemy() {
    if (!state.running) {
      return false;
    }

    if (state.enemies.size >= getEnemyCap()) {
      return false;
    }

    const arenaRect = ui.arena.getBoundingClientRect();
    if (arenaRect.width < 40 || arenaRect.height < 40) {
      return false;
    }

    const id = ++state.enemyId;
    const type = pickEnemyType();
    const isElite = Math.random() < getEliteChance();
    const maxSize = type.sizeMax + (isElite ? 4 : 0);
    const minSize = type.sizeMin + (isElite ? 2 : 0);
    const size = clamp(randomInt(minSize, maxSize) - Math.floor(state.level / 2), 44, 92);

    const maxX = Math.max(8, arenaRect.width - size - 8);
    const maxY = Math.max(8, arenaRect.height - size - 8);
    const x = randomInt(8, Math.floor(maxX));
    const y = randomInt(8, Math.floor(maxY));

    const enemy = document.createElement("button");
    enemy.type = "button";
    enemy.className = `enemy enemy--${type.key}${isElite ? " enemy--elite" : ""}`;
    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    enemy.style.setProperty("--size", `${size}px`);

    const face = document.createElement("span");
    face.className = "enemy__face";
    face.textContent = type.icon;
    enemy.append(face);

    const badge = document.createElement("span");
    badge.className = "enemy__badge";
    badge.textContent = type.badge;
    enemy.append(badge);

    const hitPoints = type.baseHp + (isElite ? 1 : 0);
    if (hitPoints > 1) {
      const core = document.createElement("span");
      core.className = "enemy__core";
      core.textContent = String(hitPoints);
      enemy.append(core);
    }

    if (isElite) {
      const eliteMark = document.createElement("span");
      eliteMark.className = "enemy__elite-mark";
      eliteMark.textContent = "★";
      enemy.append(eliteMark);
    }

    const hitReward = type.hitReward + (isElite ? 1 : 0);
    const baseTotalPoints = isElite ? 26 : 10;
    const killPoints = Math.max(2, baseTotalPoints - hitReward * hitPoints);

    const unit = {
      id,
      element: enemy,
      hp: hitPoints,
      typeKey: type.key,
      hitReward,
      points: killPoints,
      damage: Math.max(
        1,
        Math.round(CONFIG.missDamageBase + (state.level - 1) * CONFIG.missDamageScale + type.damageOffset + (isElite ? 2 : 0))
      ),
      timer: 0,
    };

    enemy.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hitEnemy(id, event);
    });

    ui.arena.append(enemy);

    const lifeMs = getEnemyLifeMs(type, isElite);
    unit.timer = window.setTimeout(() => {
      escapeEnemy(id);
    }, lifeMs);

    state.enemies.set(id, unit);
    return true;
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
    const impactPower = target.hp > 1 ? 1.05 : 1.2;
    spawnTapSparks(point.x, point.y, 9, impactPower);
    spawnHitFlash(point.x, point.y, impactPower);

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    const hitGain = target.hitReward;
    state.killScore += hitGain;
    spawnCoinParticles(point.x, point.y, clamp(hitGain + 1, 2, 5), 1);
    spawnFloatText(`+${hitGain} 金币`, point.x, point.y - 8, "#ffe788", "float-score--coin");
    pulseScoreHud();
    emitSfx("hit", { reward: hitGain, type: target.typeKey, x: point.x, y: point.y });

    target.hp -= 1;
    target.element.classList.add("is-hit");
    window.setTimeout(() => {
      target.element.classList.remove("is-hit");
    }, 90);

    if (target.hp > 0) {
      const core = target.element.querySelector(".enemy__core");
      if (core) {
        core.textContent = String(target.hp);
      }
      renderHud();
      return;
    }

    const comboBonus = updateComboAndGetBonus();
    const gained = target.points + Math.max(0, state.level - 1) + comboBonus;
    state.killScore += gained;

    spawnBurstRing(point.x, point.y, target.element.classList.contains("enemy--elite") ? 1.3 : 1.05);
    spawnCoinParticles(point.x, point.y, 7, 1.35);
    destroyEnemy(target, false, point.x, point.y);
    spawnFloatText(`+${gained} 击破`, point.x, point.y - 16, "#fff2a0", "float-score--kill");
    if (comboBonus > 0) {
      spawnFloatText(`连击 x${state.comboCount} +${comboBonus}`, point.x, point.y - 38, "#95f7ff", "float-score--combo");
      if (state.comboCount >= 3 && state.comboCount % 3 === 0) {
        showToast(`连击 ${state.comboCount}！奖励提升`, 650);
      }
    }
    emitSfx("kill", { reward: gained + hitGain, combo: state.comboCount, type: target.typeKey, x: point.x, y: point.y });
    if (navigator.vibrate) {
      navigator.vibrate([8, 14, 10]);
    }
    pulseScoreHud();
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

    state.comboCount = 0;
    const center = getEnemyCenter(target.element);
    destroyEnemy(target, true, center.x, center.y);
    const damageTaken = getEscapeDamage(target.damage);
    applyDamage(damageTaken);
    spawnFloatText(`-${damageTaken} 耐久`, center.x, center.y, "#ffd8df");
    spawnHitFlash(center.x, center.y, 1.05, "#ff94ac");
    if (isEarlyProtectionActive()) {
      showToast(`漏怪！开局减伤中 -${damageTaken} 耐久`, 900);
    } else {
      showToast(`漏怪！-${damageTaken} 耐久`, 900);
    }
    emitSfx("hurt", { damage: damageTaken, x: center.x, y: center.y });
    triggerShake();
  }

  function destroyEnemy(target, escaped, x, y) {
    clearTimeout(target.timer);
    state.enemies.delete(target.id);

    target.element.classList.add(escaped ? "is-escape" : "is-defeated");
    window.setTimeout(() => {
      target.element.remove();
    }, escaped ? 310 : 260);

    spawnTapSparks(x, y, escaped ? 4 : 8, escaped ? 0.85 : 1.15);
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
    emitSfx("game_over", { score: state.finalScore, timeMs: Math.round(state.elapsedMs) });

    persistBest(state.finalScore);
    stopRunLoop();
    clearEnemies();

    toggle(ui.hud, false);
    toggle(ui.playScreen, false);
    toggle(ui.endScreen, true);

    ui.reviveBtn.disabled = state.reviveUsed;
    ui.reviveBtn.textContent = state.reviveUsed ? "复活机会已使用" : "观看广告复活";
    ui.doubleBtn.disabled = state.doubledUsed;
    ui.doubleBtn.textContent = state.doubledUsed ? "双倍结算已领取" : "观看广告领取双倍结算";

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
      showToast("未获得复活奖励，请稍后重试。", 1000);
      return;
    }

    state.reviveUsed = true;
    state.hp = Math.max(30, Math.round(CONFIG.maxHp * 0.4));
    ui.reviveBtn.textContent = "复活机会已使用";

    toggle(ui.endScreen, false);
    toggle(ui.hud, true);
    toggle(ui.playScreen, true);

    state.running = true;
    state.startMs = performance.now();
    state.elapsedOffsetMs = state.elapsedMs;
    state.comboCount = 0;
    state.lastKillMs = 0;

    clearEnemies();
    renderHud();
    scheduleSpawn(900);
    runFrame();

    emitSfx("revive");
    showToast("复活成功，稳住节奏继续守线。", 1000);
  }

  async function handleDoubleReward() {
    if (state.running || state.doubledUsed) {
      return;
    }

    ui.doubleBtn.disabled = true;
    const rewarded = await showRewardedAd("double_reward");

    if (!rewarded) {
      ui.doubleBtn.disabled = false;
      showToast("未获得双倍奖励，请稍后重试。", 1000);
      return;
    }

    state.doubledUsed = true;
    state.finalScore *= 2;
    persistBest(state.finalScore);
    emitSfx("double_reward", { finalScore: state.finalScore });

    ui.doubleBtn.disabled = true;
    ui.doubleBtn.textContent = "双倍结算已领取";

    updateEndSummary();
    showToast(`双倍结算生效：${state.finalScore} 分`, 1200);
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

    if (ui.statusText) {
      ui.statusText.textContent = getStatusText();
    }
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
    return clamp(raw + randomInt(-60, 60), CONFIG.spawnMinMs, CONFIG.spawnStartMs);
  }

  function getSpawnBatchCount() {
    const extraChance = clamp(0.2 + (state.level - 1) * 0.05, 0.2, 0.58);
    if (Math.random() >= extraChance) {
      return 1;
    }
    if (state.level >= 6 && Math.random() < 0.16) {
      return 3;
    }
    return 2;
  }

  function getEnemyLifeMs(type, isElite) {
    const raw = CONFIG.enemyLifeStartMs - (state.level - 1) * CONFIG.enemyLifeStepMs;
    const withType = raw + type.lifeOffset + (isElite ? -90 : 0);
    return clamp(withType + randomInt(-130, 120), CONFIG.enemyLifeMinMs, CONFIG.enemyLifeStartMs + 280);
  }

  function getEnemyCap() {
    return clamp(CONFIG.maxEnemiesStart + Math.floor((state.level - 1) / 2), CONFIG.maxEnemiesStart, CONFIG.maxEnemiesCap);
  }

  function getEliteChance() {
    if (state.elapsedMs < CONFIG.eliteUnlockMs) {
      return 0;
    }

    const scaled = CONFIG.eliteChanceStart + Math.max(0, state.level - 2) * CONFIG.eliteChanceStep;
    return clamp(scaled, 0, CONFIG.eliteChanceCap);
  }

  function isEarlyProtectionActive() {
    return state.elapsedMs < CONFIG.earlyProtectionMs;
  }

  function getEscapeDamage(baseDamage) {
    const multiplier = isEarlyProtectionActive() ? CONFIG.earlyDamageMultiplier : 1;
    return Math.max(1, Math.round(baseDamage * multiplier));
  }

  function getStatusText() {
    if (!state.running) {
      return "规则：点敌人得分，漏怪扣耐久，每秒 +1 生存分。";
    }

    if (state.elapsedMs < CONFIG.startSpawnDelayMs) {
      const left = Math.max(0, CONFIG.startSpawnDelayMs - state.elapsedMs);
      return `开局缓冲中：约 ${(left / 1000).toFixed(1)} 秒后出现敌人。`;
    }

    if (isEarlyProtectionActive()) {
      const left = Math.ceil((CONFIG.earlyProtectionMs - state.elapsedMs) / 1000);
      const reduction = Math.round((1 - CONFIG.earlyDamageMultiplier) * 100);
      return `前期护航中：漏怪伤害降低 ${reduction}%（剩余约 ${left} 秒）。`;
    }

    if (state.hp <= 30) {
      return "耐久偏低：优先清理靠边目标，避免连续漏怪。";
    }

    if (state.level >= 4) {
      return "高压阶段：敌人更快更多，优先点掉精英目标。";
    }

    if (state.comboCount >= 2) {
      return `连击进行中 x${state.comboCount}：连续击破可叠加奖励。`;
    }

    return "得分 = 命中金币 + 击败得分 + 生存分（每秒 +1）。";
  }

  function pickEnemyType() {
    let totalWeight = 0;
    const weighted = ENEMY_TYPES.map((type) => {
      const dynamicWeight = Math.max(0.06, type.spawnWeight + Math.max(0, state.level - 1) * type.levelWeightStep);
      totalWeight += dynamicWeight;
      return {
        type,
        weight: dynamicWeight,
      };
    });

    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.type;
      }
    }
    return weighted[weighted.length - 1].type;
  }

  function updateComboAndGetBonus() {
    const now = performance.now();
    if (now - state.lastKillMs <= CONFIG.comboWindowMs) {
      state.comboCount += 1;
    } else {
      state.comboCount = 1;
    }
    state.lastKillMs = now;
    return clamp((state.comboCount - 1) * CONFIG.comboBonusPerStack, 0, CONFIG.comboBonusCap);
  }

  function spawnTapSparks(x, y, count, intensity = 1) {
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const radius = randomInt(Math.round(12 * intensity), Math.round(44 * intensity));
      spark.style.setProperty("--spark-size", `${Math.max(6, Math.round(8 * intensity))}px`);
      spark.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
      spark.style.setProperty("--dy", `${Math.sin(angle) * radius}px`);

      ui.fxLayer.append(spark);
      window.setTimeout(() => spark.remove(), 540);
    }
  }

  function spawnHitFlash(x, y, intensity = 1, color = "#fff4b8") {
    const flash = document.createElement("span");
    flash.className = "hit-flash";
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.style.setProperty("--flash-size", `${Math.round(42 * intensity)}px`);
    flash.style.setProperty("--flash-color", color);
    ui.fxLayer.append(flash);
    window.setTimeout(() => flash.remove(), 260);
  }

  function spawnBurstRing(x, y, intensity = 1) {
    const burst = document.createElement("span");
    burst.className = "burst-ring";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    burst.style.setProperty("--ring-scale", String(intensity));
    ui.fxLayer.append(burst);
    window.setTimeout(() => burst.remove(), 320);
  }

  function spawnCoinParticles(x, y, count, intensity = 1) {
    for (let i = 0; i < count; i += 1) {
      const coin = document.createElement("span");
      coin.className = "coin";
      coin.textContent = "¥";
      coin.style.left = `${x}px`;
      coin.style.top = `${y}px`;

      const angle = randomInt(-70, 240) * (Math.PI / 180);
      const radius = randomInt(Math.round(26 * intensity), Math.round(64 * intensity));
      const lift = randomInt(26, 70);
      coin.style.setProperty("--dx", `${Math.cos(angle) * radius}px`);
      coin.style.setProperty("--dy", `${Math.sin(angle) * radius - lift}px`);
      coin.style.setProperty("--rot", `${randomInt(-180, 180)}deg`);
      coin.style.setProperty("--delay", `${Math.random() * 0.08}s`);

      ui.fxLayer.append(coin);
      window.setTimeout(() => coin.remove(), 700);
    }
  }

  function spawnFloatText(text, x, y, color, variantClass = "") {
    const node = document.createElement("span");
    node.className = variantClass ? `float-score ${variantClass}` : "float-score";
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.color = color;
    ui.fxLayer.append(node);
    window.setTimeout(() => node.remove(), 760);
  }

  function pulseScoreHud() {
    ui.scoreValue.classList.remove("is-pop");
    void ui.scoreValue.offsetWidth;
    ui.scoreValue.classList.add("is-pop");
    clearTimeout(state.scorePopHandle);
    state.scorePopHandle = window.setTimeout(() => {
      ui.scoreValue.classList.remove("is-pop");
    }, 260);
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

  function emitSfx(name, payload = {}) {
    try {
      window.dispatchEvent(
        new CustomEvent("h5game:sfx", {
          detail: {
            name,
            ...payload,
            time: Date.now(),
          },
        })
      );
    } catch (_error) {
      // ignore in strict/restricted runtime
    }
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

      showToast(`模拟广告：${placement === "revive" ? "复活奖励" : "双倍结算奖励"}`, 700);
      window.setTimeout(() => resolve(true), 900);
    });
  }

  function toggle(node, visible) {
    node.classList.toggle("hidden", !visible);
  }

  function formatTime(ms) {
    return `${(Math.max(0, ms) / 1000).toFixed(1)}秒`;
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

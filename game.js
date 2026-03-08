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
    feverChargeMax: 100,
    feverDurationMs: 8200,
    feverScoreMultiplier: 2,
    feverExtendOnKillMs: 260,
    feverExtendCapMs: 2600,
    skillChargeMax: 100,
    skillHitDamage: 1,
    chestDropMinMs: 11500,
    chestDropMaxMs: 18000,
    chestStayMs: 6200,
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

  const MISSION_POOL = [
    {
      id: "kill_total",
      title: "悬赏任务：击破 28 个敌人",
      target: 28,
      rewardText: "奖励 +180 分 +15 耐久",
    },
    {
      id: "elite_kill",
      title: "悬赏任务：击破 5 个精英敌人",
      target: 5,
      rewardText: "奖励 +220 分 +12 耐久",
    },
    {
      id: "survive",
      title: "悬赏任务：存活 48 秒",
      target: 48,
      rewardText: "奖励 +200 分 +18 耐久",
    },
    {
      id: "open_chest",
      title: "悬赏任务：开启 2 个幸运补给箱",
      target: 2,
      rewardText: "奖励 +210 分 +16 耐久",
    },
  ];

  const SHARE_SLOGANS = [
    "我这局已经把手速拉满，你敢来破吗？",
    "别只会旁观，来正面超分。",
    "本局打到指尖发烫，轮到你守线。",
    "敢不敢 1 局超我？输了就在群里认怂。",
    "我把防线顶住了，你能坚持更久吗？",
    "战报已出，欢迎来踢馆。",
  ];

  const SHARE_CHALLENGES = [
    "挑战词：下一位超分的人，今晚点奶茶。",
    "挑战词：谁先破纪录，谁就是本群手速王。",
    "挑战词：30 秒内冲破我的阶段，再来叫板。",
    "挑战词：不服就开一局，晒图说话。",
    "挑战词：超分失败请发红包安慰全场。",
    "挑战词：今晚谁是防线天花板，就看这一局。",
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
    copyShareBtn: document.getElementById("copy-share-btn"),
    rerollShareBtn: document.getElementById("reroll-share-btn"),
    skillBtn: document.getElementById("skill-btn"),
    hpFill: document.getElementById("hp-fill"),
    hpText: document.getElementById("hp-text"),
    feverFill: document.getElementById("fever-fill"),
    feverText: document.getElementById("fever-text"),
    scoreValue: document.getElementById("score-value"),
    timeValue: document.getElementById("time-value"),
    levelValue: document.getElementById("level-value"),
    bestValue: document.getElementById("best-value"),
    missionText: document.getElementById("mission-text"),
    statusText: document.getElementById("status-text"),
    finalScore: document.getElementById("final-score"),
    finalTime: document.getElementById("final-time"),
    finalBest: document.getElementById("final-best"),
    shareCard: document.getElementById("share-card"),
    shareRank: document.getElementById("share-rank"),
    shareTitle: document.getElementById("share-title"),
    shareSlogan: document.getElementById("share-slogan"),
    shareLevel: document.getElementById("share-level"),
    shareCombo: document.getElementById("share-combo"),
    shareMission: document.getElementById("share-mission"),
    shareChallenge: document.getElementById("share-challenge"),
    sharePreview: document.getElementById("share-preview"),
    endTitle: document.getElementById("end-title"),
    endCopy: document.querySelector("#end-screen .panel-copy"),
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
    feverCharge: 0,
    feverActive: false,
    feverEndMs: 0,
    skillCharge: 0,
    maxCombo: 0,
    mission: createMission(),
    chestHandle: 0,
    chest: null,
    chestOpenCount: 0,
    chestId: 0,
    shareSloganIndex: 0,
    shareChallengeIndex: 0,
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
    ui.copyShareBtn.addEventListener("click", handleCopyShareText);
    ui.rerollShareBtn.addEventListener("click", rerollShareCopy);
    ui.skillBtn.addEventListener("click", useSkill);

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
    clearLuckyChest();
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
    state.maxCombo = 0;
    state.feverCharge = 0;
    state.feverActive = false;
    state.feverEndMs = 0;
    state.skillCharge = 0;
    state.enemyId = 0;
    state.mission = createMission();
    state.chestOpenCount = 0;
    state.shareSloganIndex = randomInt(0, SHARE_SLOGANS.length - 1);
    state.shareChallengeIndex = randomInt(0, SHARE_CHALLENGES.length - 1);
    ui.reviveBtn.textContent = "观看广告复活";
    ui.doubleBtn.textContent = "观看广告领取双倍结算";
    ui.skillBtn.textContent = "技能充能中";
    ui.skillBtn.disabled = true;
    ui.copyShareBtn.textContent = "一键复制挑战文案";
    ui.rerollShareBtn.disabled = false;
    ui.app.classList.remove("is-fever");

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
    clearLuckyChest();

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
    state.maxCombo = 0;
    state.feverCharge = 0;
    state.feverActive = false;
    state.feverEndMs = 0;
    state.skillCharge = 0;
    state.mission = createMission();
    state.chestOpenCount = 0;
    state.shareSloganIndex = randomInt(0, SHARE_SLOGANS.length - 1);
    state.shareChallengeIndex = randomInt(0, SHARE_CHALLENGES.length - 1);
    ui.reviveBtn.textContent = "观看广告复活";
    ui.doubleBtn.textContent = "观看广告领取双倍结算";
    ui.skillBtn.textContent = "技能充能中";
    ui.skillBtn.disabled = true;
    ui.copyShareBtn.textContent = "一键复制挑战文案";
    ui.rerollShareBtn.disabled = false;
    ui.app.classList.remove("is-fever");

    toggle(ui.startScreen, false);
    toggle(ui.endScreen, false);
    toggle(ui.hud, true);
    toggle(ui.playScreen, true);

    renderHud();
    scheduleSpawn(CONFIG.startSpawnDelayMs);
    scheduleChestDrop(7400);
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
    if (state.feverActive && state.elapsedMs >= state.feverEndMs) {
      deactivateFever();
    }
    if (state.comboCount > 0 && now - state.lastKillMs > CONFIG.comboWindowMs) {
      state.comboCount = 0;
    }
    updateMissionByTime();
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
      isElite,
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

    const hitGain = getScoreWithFever(target.hitReward);
    state.killScore += hitGain;
    spawnCoinParticles(point.x, point.y, clamp(hitGain + 1, 2, 5), 1);
    spawnFloatText(`+${hitGain} 金币`, point.x, point.y - 8, "#ffe788", "float-score--coin");
    pulseScoreHud();
    emitSfx("hit", { reward: hitGain, type: target.typeKey, x: point.x, y: point.y });
    onCombatScored({ isKill: false, isElite: target.isElite });

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
    const gainedBase = target.points + Math.max(0, state.level - 1) + comboBonus;
    const gained = getScoreWithFever(gainedBase);
    state.killScore += gained;
    onCombatScored({ isKill: true, isElite: target.isElite });
    advanceMission("kill_total", 1);
    if (target.isElite) {
      advanceMission("elite_kill", 1);
    }

    spawnBurstRing(point.x, point.y, target.isElite ? 1.3 : 1.05);
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
    state.feverActive = false;
    state.feverEndMs = 0;
    ui.app.classList.remove("is-fever");
    emitSfx("game_over", { score: state.finalScore, timeMs: Math.round(state.elapsedMs) });

    persistBest(state.finalScore);
    stopRunLoop();
    clearEnemies();
    clearLuckyChest();

    toggle(ui.hud, false);
    toggle(ui.playScreen, false);
    toggle(ui.endScreen, true);

    ui.reviveBtn.disabled = state.reviveUsed;
    ui.reviveBtn.textContent = state.reviveUsed ? "复活机会已使用" : "观看广告复活";
    ui.doubleBtn.disabled = state.doubledUsed;
    ui.doubleBtn.textContent = state.doubledUsed ? "双倍结算已领取" : "观看广告领取双倍结算";
    ui.copyShareBtn.disabled = false;
    ui.rerollShareBtn.disabled = false;

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
    state.feverActive = false;
    state.feverEndMs = 0;
    state.feverCharge = Math.max(state.feverCharge, 28);
    state.skillCharge = Math.max(state.skillCharge, 34);
    ui.app.classList.remove("is-fever");

    clearEnemies();
    clearLuckyChest();
    renderHud();
    scheduleSpawn(900);
    scheduleChestDrop(5600);
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
    clearTimeout(state.chestHandle);
    window.cancelAnimationFrame(state.frameHandle);
    state.spawnHandle = 0;
    state.chestHandle = 0;
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
    renderFeverHud();
    renderSkillHud();
    renderMissionHud();

    if (ui.statusText) {
      ui.statusText.textContent = getStatusText();
    }
  }

  function updateEndSummary() {
    ui.finalScore.textContent = String(state.finalScore);
    ui.finalTime.textContent = formatTime(state.elapsedMs);
    ui.finalBest.textContent = String(state.bestScore);
    renderShareCard();
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
    const feverBonus = state.feverActive ? 80 : 0;
    return clamp(raw - feverBonus + randomInt(-60, 60), CONFIG.spawnMinMs, CONFIG.spawnStartMs);
  }

  function getSpawnBatchCount() {
    const feverBoost = state.feverActive ? 0.12 : 0;
    const extraChance = clamp(0.2 + (state.level - 1) * 0.05 + feverBoost, 0.2, 0.66);
    if (Math.random() >= extraChance) {
      return 1;
    }
    if ((state.level >= 6 || state.feverActive) && Math.random() < 0.16 + (state.feverActive ? 0.08 : 0)) {
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

  function renderFeverHud() {
    if (!ui.feverFill || !ui.feverText) {
      return;
    }

    if (state.feverActive) {
      const leftMs = Math.max(0, state.feverEndMs - state.elapsedMs);
      const pct = clamp((leftMs / CONFIG.feverDurationMs) * 100, 0, 100);
      ui.feverFill.style.width = `${pct}%`;
      ui.feverFill.classList.add("is-active");
      ui.feverText.textContent = `爆发 ${(leftMs / 1000).toFixed(1)}秒`;
      return;
    }

    const pct = clamp(Math.round(state.feverCharge), 0, 100);
    ui.feverFill.style.width = `${pct}%`;
    ui.feverFill.classList.remove("is-active");
    ui.feverText.textContent = `${pct}%`;
  }

  function renderSkillHud() {
    if (!ui.skillBtn) {
      return;
    }
    const ready = state.skillCharge >= CONFIG.skillChargeMax;
    ui.skillBtn.disabled = !state.running || !ready;
    ui.skillBtn.textContent = ready ? "释放雷暴" : `技能 ${Math.round(state.skillCharge)}%`;
  }

  function renderMissionHud() {
    if (!ui.missionText || !state.mission) {
      return;
    }
    const coreText = `${state.mission.title}（${state.mission.progress}/${state.mission.target}）`;
    ui.missionText.textContent = state.mission.completed
      ? `悬赏任务已完成：${state.mission.rewardText}`
      : coreText;
  }

  function createMission() {
    const template = MISSION_POOL[randomInt(0, MISSION_POOL.length - 1)];
    return {
      id: template.id,
      title: template.title,
      target: template.target,
      rewardText: template.rewardText,
      progress: 0,
      completed: false,
    };
  }

  function updateMissionByTime() {
    if (!state.running || !state.mission || state.mission.completed || state.mission.id !== "survive") {
      return;
    }
    const seconds = Math.floor(state.elapsedMs / 1000);
    const next = clamp(seconds, 0, state.mission.target);
    if (next > state.mission.progress) {
      state.mission.progress = next;
    }
    if (state.mission.progress >= state.mission.target) {
      completeMission();
    }
  }

  function advanceMission(missionId, amount) {
    if (!state.running || !state.mission || state.mission.completed || state.mission.id !== missionId) {
      return;
    }
    state.mission.progress = clamp(state.mission.progress + amount, 0, state.mission.target);
    if (state.mission.progress >= state.mission.target) {
      completeMission();
    }
  }

  function completeMission() {
    if (!state.mission || state.mission.completed) {
      return;
    }

    state.mission.completed = true;

    let rewardScore = 180;
    let rewardHp = 15;
    let rewardFever = 22;
    let rewardSkill = 26;
    if (state.mission.id === "elite_kill") {
      rewardScore = 220;
      rewardHp = 12;
      rewardFever = 20;
      rewardSkill = 30;
    } else if (state.mission.id === "survive") {
      rewardScore = 200;
      rewardHp = 18;
      rewardFever = 24;
      rewardSkill = 24;
    } else if (state.mission.id === "open_chest") {
      rewardScore = 210;
      rewardHp = 16;
      rewardFever = 20;
      rewardSkill = 28;
    }

    const scoreGain = getScoreWithFever(rewardScore);
    state.killScore += scoreGain;
    state.hp = clamp(state.hp + rewardHp, 0, CONFIG.maxHp);
    addFeverCharge(rewardFever);
    addSkillCharge(rewardSkill);

    const center = getArenaCenter();
    spawnBurstRing(center.x, center.y, 1.9);
    spawnCoinParticles(center.x, center.y, 14, 1.6);
    spawnFloatText(`悬赏达成 +${scoreGain} 分`, center.x, center.y - 20, "#b4ffe9", "float-score--mission");
    showToast(`悬赏完成！+${scoreGain} 分，耐久回复 ${rewardHp}`, 1250);
    pulseScoreHud();
    emitSfx("mission_clear", { missionId: state.mission.id, score: scoreGain, hp: rewardHp });
  }

  function onCombatScored({ isKill, isElite }) {
    const comboBoost = Math.max(0, state.comboCount - 1);
    const skillGain = isKill ? 18 : 7;
    addSkillCharge(skillGain + (isElite ? (isKill ? 10 : 5) : 0) + comboBoost);

    if (state.feverActive) {
      if (isKill) {
        extendFever(CONFIG.feverExtendOnKillMs + (isElite ? 110 : 0));
      }
      return;
    }

    const feverGain = isKill ? 16 : 4;
    addFeverCharge(feverGain + (isElite ? (isKill ? 10 : 4) : 0) + comboBoost);
  }

  function getScoreWithFever(baseValue) {
    const scaled = state.feverActive ? baseValue * CONFIG.feverScoreMultiplier : baseValue;
    return Math.max(0, Math.round(scaled));
  }

  function addFeverCharge(amount) {
    if (amount <= 0) {
      return;
    }
    if (state.feverActive) {
      extendFever(Math.round(amount * 26));
      return;
    }
    state.feverCharge = clamp(state.feverCharge + amount, 0, CONFIG.feverChargeMax);
    if (state.feverCharge >= CONFIG.feverChargeMax) {
      activateFever();
    }
  }

  function activateFever() {
    if (state.feverActive) {
      return;
    }
    state.feverActive = true;
    state.feverCharge = CONFIG.feverChargeMax;
    state.feverEndMs = state.elapsedMs + CONFIG.feverDurationMs;
    ui.app.classList.add("is-fever");
    const center = getArenaCenter();
    spawnBurstRing(center.x, center.y, 2.5);
    spawnCoinParticles(center.x, center.y, 18, 2);
    showToast(`狂热爆发 ${Math.round(CONFIG.feverDurationMs / 1000)} 秒：击败得分 x${CONFIG.feverScoreMultiplier}`, 1300);
    emitSfx("fever_start", { duration: CONFIG.feverDurationMs });
    if (navigator.vibrate) {
      navigator.vibrate([16, 22, 16]);
    }
  }

  function extendFever(ms) {
    if (!state.feverActive || ms <= 0) {
      return;
    }
    const maxEnd = state.elapsedMs + CONFIG.feverDurationMs + CONFIG.feverExtendCapMs;
    state.feverEndMs = Math.min(maxEnd, state.feverEndMs + ms);
  }

  function deactivateFever() {
    if (!state.feverActive) {
      return;
    }
    state.feverActive = false;
    state.feverEndMs = 0;
    state.feverCharge = 0;
    ui.app.classList.remove("is-fever");
    showToast("狂热结束，继续连击可再次点燃。", 900);
    emitSfx("fever_end");
  }

  function addSkillCharge(amount) {
    if (amount <= 0) {
      return;
    }
    const wasReady = state.skillCharge >= CONFIG.skillChargeMax;
    state.skillCharge = clamp(state.skillCharge + amount, 0, CONFIG.skillChargeMax);
    const readyNow = state.skillCharge >= CONFIG.skillChargeMax;
    if (!wasReady && readyNow) {
      showToast("技能已就绪：释放雷暴清场！", 900);
      emitSfx("skill_ready");
      if (navigator.vibrate) {
        navigator.vibrate([8, 12, 8]);
      }
    }
  }

  function useSkill() {
    if (!state.running || state.skillCharge < CONFIG.skillChargeMax) {
      return;
    }

    const targets = Array.from(state.enemies.values());
    if (targets.length === 0) {
      showToast("场上暂无目标，先攒一波敌人再释放。", 800);
      return;
    }

    state.skillCharge = 0;
    let kills = 0;
    let eliteKills = 0;
    let totalGain = 0;
    const center = getArenaCenter();

    spawnBurstRing(center.x, center.y, 2.2);
    spawnHitFlash(center.x, center.y, 2.2, "#a6fff5");
    spawnTapSparks(center.x, center.y, 16, 1.7);

    for (const target of targets) {
      const point = getEnemyCenter(target.element);
      target.hp -= CONFIG.skillHitDamage;
      spawnHitFlash(point.x, point.y, 1.05, "#9ffaf2");
      target.element.classList.add("is-hit");
      window.setTimeout(() => {
        target.element.classList.remove("is-hit");
      }, 100);

      if (target.hp > 0) {
        const core = target.element.querySelector(".enemy__core");
        if (core) {
          core.textContent = String(target.hp);
        }
        continue;
      }

      const gain = getScoreWithFever(target.points + Math.max(0, state.level - 1) + 4);
      kills += 1;
      totalGain += gain;
      if (target.isElite) {
        eliteKills += 1;
      }
      destroyEnemy(target, false, point.x, point.y);
    }

    if (kills > 0) {
      state.killScore += totalGain;
      advanceMission("kill_total", kills);
      if (eliteKills > 0) {
        advanceMission("elite_kill", eliteKills);
      }
      addFeverCharge(8 + kills * 3 + eliteKills * 4);
      spawnCoinParticles(center.x, center.y, clamp(8 + kills * 2, 10, 22), 1.5);
      spawnFloatText(`雷暴击破 ${kills} 个 +${totalGain}`, center.x, center.y - 24, "#98fff2", "float-score--skill");
      pulseScoreHud();
      showToast(`雷暴出击！清场 ${kills} 个目标`, 1000);
    } else {
      addFeverCharge(10);
      showToast("雷暴命中！敌人已被压低血量。", 850);
    }

    emitSfx("skill_cast", { kills, score: totalGain });
    if (navigator.vibrate) {
      navigator.vibrate([14, 18, 12]);
    }
    renderHud();
  }

  function scheduleChestDrop(delayMs = randomInt(CONFIG.chestDropMinMs, CONFIG.chestDropMaxMs)) {
    clearTimeout(state.chestHandle);
    if (!state.running) {
      return;
    }
    const delay = Math.max(2200, delayMs);
    state.chestHandle = window.setTimeout(() => {
      if (!state.running) {
        return;
      }
      if (!state.chest) {
        spawnLuckyChest();
      }
      scheduleChestDrop(randomInt(CONFIG.chestDropMinMs, CONFIG.chestDropMaxMs));
    }, delay);
  }

  function spawnLuckyChest() {
    if (!state.running || state.chest) {
      return;
    }

    const arenaRect = ui.arena.getBoundingClientRect();
    if (arenaRect.width < 40 || arenaRect.height < 40) {
      return;
    }

    const id = ++state.chestId;
    const chest = document.createElement("button");
    chest.type = "button";
    chest.className = "lucky-chest";
    chest.setAttribute("aria-label", "幸运补给箱");

    const size = 58;
    const maxX = Math.max(10, Math.floor(arenaRect.width - size - 10));
    const maxY = Math.max(10, Math.floor(arenaRect.height - size - 10));
    chest.style.left = `${randomInt(10, maxX)}px`;
    chest.style.top = `${randomInt(10, maxY)}px`;

    const icon = document.createElement("span");
    icon.className = "lucky-chest__icon";
    icon.textContent = "🎁";
    const label = document.createElement("span");
    label.className = "lucky-chest__label";
    label.textContent = "补给";
    chest.append(icon, label);

    chest.addEventListener("pointerdown", (event) => {
      openLuckyChest(id, event);
    });

    ui.arena.append(chest);
    const timer = window.setTimeout(() => {
      expireLuckyChest(id);
    }, CONFIG.chestStayMs);

    state.chest = {
      id,
      element: chest,
      timer,
    };
    showToast("幸运补给箱空降！点它抢奖励。", 900);
  }

  function openLuckyChest(chestId, event) {
    if (!state.running || !state.chest || state.chest.id !== chestId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const center = getEnemyCenter(state.chest.element);
    const reward = pickChestReward();
    state.chestOpenCount += 1;
    removeLuckyChest(true);
    advanceMission("open_chest", 1);

    if (reward.type === "score") {
      const gain = getScoreWithFever(reward.amount);
      state.killScore += gain;
      pulseScoreHud();
      spawnFloatText(`补给暴击 +${gain} 分`, center.x, center.y - 18, "#ffe999", "float-score--chest");
      showToast(`幸运补给：直升 +${gain} 分`, 1000);
    } else if (reward.type === "heal") {
      const before = state.hp;
      state.hp = clamp(state.hp + reward.amount, 0, CONFIG.maxHp);
      const actual = state.hp - before;
      spawnFloatText(`耐久回复 +${actual}`, center.x, center.y - 18, "#afffd8", "float-score--chest");
      showToast(`幸运补给：耐久回复 ${actual}`, 1000);
    } else if (reward.type === "fever") {
      addFeverCharge(reward.amount);
      spawnFloatText(`狂热充能 +${reward.amount}%`, center.x, center.y - 18, "#b3f8ff", "float-score--chest");
      showToast(`幸运补给：狂热能量 +${reward.amount}%`, 1000);
    } else if (reward.type === "skill") {
      addSkillCharge(reward.amount);
      spawnFloatText(`技能充能 +${reward.amount}%`, center.x, center.y - 18, "#9ff2ff", "float-score--chest");
      showToast(`幸运补给：技能能量 +${reward.amount}%`, 1000);
    } else {
      const gain = getScoreWithFever(reward.score);
      state.killScore += gain;
      state.hp = clamp(state.hp + reward.hp, 0, CONFIG.maxHp);
      addFeverCharge(reward.fever);
      addSkillCharge(reward.skill);
      pulseScoreHud();
      spawnFloatText(`神箱爆发 +${gain} 分`, center.x, center.y - 18, "#fff2a9", "float-score--chest");
      showToast("神箱爆发：分数、耐久、双能量全到手！", 1200);
    }

    spawnBurstRing(center.x, center.y, 1.6);
    spawnCoinParticles(center.x, center.y, 11, 1.3);
    emitSfx("chest_open", { reward: reward.type });
    renderHud();
  }

  function pickChestReward() {
    const roll = Math.random();
    if (roll < 0.33) {
      return { type: "score", amount: randomInt(95, 165) + state.level * 5 };
    }
    if (roll < 0.57) {
      return { type: "heal", amount: randomInt(12, 20) };
    }
    if (roll < 0.79) {
      return { type: "fever", amount: randomInt(24, 38) };
    }
    if (roll < 0.95) {
      return { type: "skill", amount: randomInt(30, 48) };
    }
    return {
      type: "jackpot",
      score: randomInt(180, 260),
      hp: randomInt(8, 14),
      fever: 22,
      skill: 24,
    };
  }

  function expireLuckyChest(chestId) {
    if (!state.chest || state.chest.id !== chestId) {
      return;
    }
    removeLuckyChest(false);
    showToast("补给箱飞走了，下一波更值钱。", 780);
  }

  function removeLuckyChest(opened) {
    if (!state.chest) {
      return;
    }
    clearTimeout(state.chest.timer);
    const node = state.chest.element;
    state.chest = null;
    node.classList.add(opened ? "is-opened" : "is-expired");
    window.setTimeout(() => {
      node.remove();
    }, opened ? 300 : 220);
  }

  function clearLuckyChest() {
    if (!state.chest) {
      return;
    }
    clearTimeout(state.chest.timer);
    state.chest.element.remove();
    state.chest = null;
  }

  function renderShareCard() {
    if (!ui.shareRank || !ui.shareTitle || !ui.sharePreview) {
      return;
    }

    const snapshot = getShareSnapshot();
    ui.shareRank.textContent = `称号：${snapshot.rank}`;
    ui.shareTitle.textContent = snapshot.title;
    ui.shareSlogan.textContent = snapshot.slogan;
    ui.shareLevel.textContent = String(snapshot.level);
    ui.shareCombo.textContent = `x${snapshot.maxCombo}`;
    ui.shareMission.textContent = snapshot.missionState;
    ui.shareChallenge.textContent = `${snapshot.challenge} ${snapshot.targetLine}`;
    ui.sharePreview.textContent = buildShareText(snapshot);

    if (ui.endTitle) {
      ui.endTitle.textContent = snapshot.endTitle;
    }
    if (ui.endCopy) {
      ui.endCopy.textContent = snapshot.endCopy;
    }
  }

  function getShareSnapshot() {
    const score = Math.max(0, state.finalScore);
    const seconds = Math.floor(Math.max(0, state.elapsedMs) / 1000);
    const rankData = getRankData(score);
    const slogan = SHARE_SLOGANS[state.shareSloganIndex % SHARE_SLOGANS.length];
    const challenge = SHARE_CHALLENGES[state.shareChallengeIndex % SHARE_CHALLENGES.length];
    return {
      score,
      seconds,
      timeText: formatTime(state.elapsedMs),
      level: state.level,
      maxCombo: Math.max(0, state.maxCombo),
      best: state.bestScore,
      rank: rankData.rank,
      title: rankData.title,
      endTitle: rankData.endTitle,
      endCopy: rankData.endCopy,
      slogan,
      challenge,
      missionState: state.mission && state.mission.completed ? "已完成" : "未完成",
      targetScore: score + Math.max(88, Math.round(score * 0.12)),
      targetLine: `目标线：${score + Math.max(88, Math.round(score * 0.12))} 分`,
    };
  }

  function getRankData(score) {
    if (score >= 2300) {
      return {
        rank: "核爆统帅",
        title: "全屏燃烧，城墙由你封神",
        endTitle: "封神战报",
        endCopy: "你把节奏打成了核爆场面，下一位挑战者压力拉满。",
      };
    }
    if (score >= 1550) {
      return {
        rank: "天花板守线王",
        title: "压强拉满，群聊警报已触发",
        endTitle: "高能战报",
        endCopy: "这局已经够狠，适合直接发群挑衅。",
      };
    }
    if (score >= 980) {
      return {
        rank: "高压猎手",
        title: "节奏在线，防线没有白给",
        endTitle: "强势战报",
        endCopy: "已经进入上头区间，再来一局冲天花板。",
      };
    }
    if (score >= 520) {
      return {
        rank: "街区守卫",
        title: "基础盘稳住了，差一波爆发",
        endTitle: "继续加压",
        endCopy: "手感已经起来，补一局就有机会翻倍。",
      };
    }
    return {
      rank: "新兵试炼者",
      title: "热身完成，下一局开冲",
      endTitle: "挑战继续",
      endCopy: "先把节奏打顺，再用分享挑战把朋友拉进来。",
    };
  }

  function buildShareText(snapshot) {
    const url = window.location.href.split("#")[0];
    return [
      "【点点击破·群聊手速挑战】",
      `我刚打出 ${snapshot.score} 分（${snapshot.timeText} / 阶段${snapshot.level} / 最高连击x${snapshot.maxCombo}）`,
      `称号：${snapshot.rank}`,
      `悬赏任务：${snapshot.missionState}`,
      snapshot.slogan,
      `${snapshot.challenge} ${snapshot.targetLine}`,
      `你能超过我吗？开局链接：${url}`,
    ].join("\n");
  }

  function rerollShareCopy() {
    if (state.running) {
      return;
    }
    state.shareSloganIndex = randomInt(0, SHARE_SLOGANS.length - 1);
    state.shareChallengeIndex = randomInt(0, SHARE_CHALLENGES.length - 1);
    ui.copyShareBtn.textContent = "一键复制挑战文案";
    renderShareCard();
    showToast("挑衅词已更新，换一句继续约战。", 850);
  }

  async function handleCopyShareText() {
    if (state.running) {
      return;
    }
    const text = buildShareText(getShareSnapshot());
    const copied = await copyTextToClipboard(text);
    if (copied) {
      ui.copyShareBtn.textContent = "文案已复制，去群里开战";
      showToast("挑战文案已复制，马上发到群聊。", 1100);
      return;
    }
    showToast("复制失败，请手动长按复制。", 1000);
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_error) {
        // fallback to legacy copy path
      }
    }
    return copyTextFallback(text);
  }

  function copyTextFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.top = "-999px";
    textarea.style.left = "-999px";
    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (_error) {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  function getStatusText() {
    if (!state.running) {
      return "规则：点敌人得分，漏怪扣耐久，每秒 +1 生存分。";
    }

    if (state.feverActive) {
      const leftMs = Math.max(0, state.feverEndMs - state.elapsedMs);
      return `狂热爆发：剩余 ${(leftMs / 1000).toFixed(1)} 秒，击败得分 x${CONFIG.feverScoreMultiplier}。`;
    }

    if (state.skillCharge >= CONFIG.skillChargeMax) {
      return "技能已就绪：点击“雷暴清场”快速止血并收割。";
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

    if (state.mission && !state.mission.completed) {
      return `${state.mission.title}（${state.mission.progress}/${state.mission.target}）`;
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
    state.maxCombo = Math.max(state.maxCombo, state.comboCount);
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

  function getArenaCenter() {
    const x = ui.arena.clientWidth / 2;
    const y = ui.arena.clientHeight / 2;
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

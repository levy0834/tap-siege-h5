# Tap Siege - H5 Click Survival MVP

A mobile-first static web game prototype built with pure HTML, CSS, and JavaScript.

## Features

- Start screen with quick rules and single-tap game start.
- Gameplay HUD with live HP bar, score, survival time, level, and best score.
- Click/tap attack loop with juicy feedback (sparks, floating score text, hit states, screen shake, vibration where available).
- HP fail condition: enemies that escape deal damage; run ends at 0 HP.
- Escalating difficulty every 10 seconds via spawn rate, enemy cap, and pressure.
- End screen with final score/time, restart flow, and back-to-start flow.
- Mocked ad placeholder buttons:
  - `Watch Ad to Revive`
  - `Watch Ad for x2 Reward`
- Local best-score persistence via `localStorage`.

## Project structure

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml         # Optional GitHub Pages deployment workflow
├── game.js                   # Game state machine + gameplay logic + ad hooks
├── index.html                # App layout: start/HUD/play/end screens
├── styles.css                # Mobile-first visual system and animations
└── README.md
```

## Local preview

No build step required.

1. Start a local static server in this folder:

```bash
python3 -m http.server 5173
```

2. Open:

```text
http://localhost:5173
```

Tip: use mobile emulation in browser devtools for quick H5 validation.

## GitHub Pages deployment

A minimal workflow is included at `.github/workflows/pages.yml`.

1. Push this project to a GitHub repository (default branch `main`).
2. In GitHub repo settings, open **Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).
4. After deployment, your site will be live at the Pages URL shown in workflow output.

## Ad integration hook (mock-ready)

`game.js` looks for `window.H5AdHooks.showRewardedAd(...)` before falling back to a mock success flow.

Hook contract:

```js
window.H5AdHooks = {
  showRewardedAd({ placement, onReward, onClose, onError }) {
    // placement: "revive" | "double_reward"
    // Call onReward() when reward is granted.
    // Call onClose() if user closes without reward.
    // Call onError(err) on failure.
  },
};
```

## 5 next improvements

1. Add enemy variety with distinct behaviors (armor, speed, split, heal).
2. Introduce combo/crit systems and richer score multipliers.
3. Add real audio (BGM/SFX) and sprite sheets for stronger game feel.
4. Integrate production ad SDK + analytics events (start, fail, revive, reward claim).
5. Add automated checks (lint/tests) and basic balancing configs for easier tuning.

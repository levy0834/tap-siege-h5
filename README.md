# 点点击破 - H5 生存点击小游戏（MVP）

一个面向移动端的静态网页小游戏原型，使用纯 HTML、CSS、JavaScript 实现，无需构建工具。

## 玩法与规则

- 点击敌人获得击败分：普通敌人基础 +10，精英敌人基础 +26（阶段越高会有额外加分）。
- 敌人逃脱会扣除耐久值，精英敌人逃脱伤害更高。
- 每存活 1 秒可获得 1 点生存分。
- 每约 10 秒提升一个阶段：敌人出现更快、停留时间更短、同屏上限提高。
- 开局有短暂缓冲，且前期漏怪伤害降低，便于玩家进入节奏。

## 项目结构

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml         # 可选：GitHub Pages 自动部署
├── game.js                   # 游戏状态机、战斗逻辑、广告接口
├── index.html                # 页面结构：开始页 / HUD / 战斗区 / 结算页
├── styles.css                # 移动端样式与动画
└── README.md
```

## 本地运行

无需安装依赖，也无需构建。

1. 在项目目录启动静态服务器：

```bash
python3 -m http.server 5173
```

2. 浏览器打开：

```text
http://localhost:5173
```

建议在浏览器开发者工具中启用移动端模拟进行 H5 体验验证。

## GitHub Pages 部署

仓库内已包含最小化部署工作流 `.github/workflows/pages.yml`。

1. 将项目推送到 GitHub 仓库（默认分支 `main`）。
2. 在仓库 **Pages** 设置里将来源切换为 **GitHub Actions**。
3. 推送到 `main`（或在 Actions 手动触发工作流）。
4. 部署完成后可在工作流输出中查看 Pages 访问地址。

## 广告接口（占位可接入）

`game.js` 会优先调用 `window.H5AdHooks.showRewardedAd(...)`，否则回落到本地模拟成功流程。

```js
window.H5AdHooks = {
  showRewardedAd({ placement, onReward, onClose, onError }) {
    // placement: "revive" | "double_reward"
    // 发奖时调用 onReward()
    // 用户无奖励关闭时调用 onClose()
    // 失败时调用 onError(err)
  },
};
```

## 后续可扩展方向

1. 增加更多敌人类型（护甲、分裂、加速、治疗等）。
2. 增加连击/暴击等分数系统，提高策略深度。
3. 接入真实音效与资源图集，提升反馈表现。
4. 接入正式广告 SDK 与埋点（开始、失败、复活、领奖）。
5. 增加自动化检查与平衡参数配置，便于持续调优。

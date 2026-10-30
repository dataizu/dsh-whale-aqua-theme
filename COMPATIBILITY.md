# 版本兼容性报告：DSH 0.2.x / Desktop

> 结论一句话：**v1.0.0 不适配当前 DeepSeek Harness（Desktop 0.2.1-rc.2），而且不只是"样式过期"——插件本身无法加载。v2.0.0 已按 0.2.x 重写，背景动画与鲸鱼发送按钮保留，皮肤层全部重新映射。**

## 0. 测试环境

| 项 | 值 |
|---|---|
| 客户端 | DeepSeek Harness Desktop（Electron 外壳，Windows x64） |
| 运行时版本 | `@deepseek-ai/dsh` / `dsh-desktop` **0.2.1-rc.2**（从 `app.asar` 的 `package.json` 读取） |
| 页面来源 | `dsh-app://app/`（自定义协议；回环 `http://127.0.0.1:<port>` 只作为被转发的后端） |
| Profile | 独立测试 profile（端口 61650），不动用户正在使用的 desktop profile |
| 验证方式 | 无头 Edge + CDP 截图 / 读取计算样式；对照安装包内实际 JS/CSS 源码，不依赖猜测 |

旧主题（v1.0.0）的开发基线是 0.1.x（2026-08 的 DeepSeek Harmony 早期版本）。

## 1. 两个层面的断裂

### 1.1 加载层：插件注册 id 不匹配（致命，0.1.x 时代"能跑"的做法在 0.2.x 直接失败）

0.2.x 的 `@deepseek-ai/dsh-client-modules` 用**包名**作为 boot 图节点 id，并要求浏览器面 bundle 注册的 id 与之一致：

```js
// v1.0.0（错）
window.__ModuleLoader__.load({ id: 'dsh-whale-aqua', factory: … })
// v2.0.0（对）
window.__ModuleLoader__.load({ id: 'dsh-whale-aqua-theme', factory: … })
```

实测错误（`logs/boot-probe.json`）：

```
client-modules: duplicate factory registration for "dsh-whale-aqua" (bundle executed twice without invalidate?)
… loaded without registering "dsh-whale-aqua-theme" via __ModuleLoader__.load
web boot: 1 entry did not activate
```

界面直接停在 **“Failed to load plugins / dsh-whale-aqua-theme”**。修正 id 后插件恢复正常加载。

同时确认以下 0.2.x 加载约定仍然成立（v1 的写法不用改）：

- `package.json`：`dsh.client.platform` 必须是字符串 **`"web"`**（其它值会被静默跳过）；必须提供 `exports["./client"]`；
- `cordis.patch.yml` 的 `- insert: [{ id, name: <包名> }]` 格式不变；
- 浏览器面仍返回 `{ name, inject, apply(ctx) }`，`ctx.effect()` 负责卸载清理。

### 1.2 皮肤层：业务类名哈希全部失效（88/88 命中 0）

0.2.x 重写了 UI（布局、会话、侧边栏、设置、轨迹全部换组件），旧主题依赖的 CSS Modules 哈希类名在安装包内**一个都不存在**：

| 区域 | v1.0.0 选择器（0.1.x） | 0.2.1-rc.2 现状 |
|---|---|---|
| 侧边栏 | `hHd-Xa_*` | `_2H3hWW_*`（SidebarRoot） |
| 会话头/视图标签 | `wSkVaW_*` | `Dc7zOa_*` + `[data-conversation-tabs] button[role=tab]` |
| 输入框 | `uV2eYG_card` / `textarea:focus` | `[data-composer-card]` / `[data-composer-input]:focus`（内容已改为 contenteditable，不再有 textarea） |
| 消息气泡 / think | `gdEzaW_*`、`Sxvs8a_*` | `cJsG2q_bubble`（assistant 无头像节点）、`[data-variant=think][data-state=running]` 仍有效 |
| 轨迹 | `Y0dWHa_*` | `haSm5q_*`；`tr[data-kind]`、`[data-selected]` 等属性选择器仍有效 |
| 设置 | `VOzbGW_*`、`zGbnIq_*`、`_WvWnq_section` | `wCInkW_*`、`_3nPmjq_*`、六套按 Tab 拆分的 `*_section` |
| 通用 UI 套件（弹窗/菜单/按钮/Toast） | `_dialog_15u5s_22`、`_button_kz6gm_4` 等 | 迁移到 `dsh-web-frontend` 共享 CSS：`_dialog_o6lrb_33`、`_button_1rv3m_2` 等 |

实测：v1 的 88 个业务类名在运行页面中命中的元素数为 **0**。完整映射见 `reports/map.json`（96 条：86 条唯一确定，9 条多候选，1 条组件已删除）。

### 1.3 仍然有效的部分（v1 的好消息）

| 能力 | 结论 | 证据 |
|---|---|---|
| 设计令牌 `--dsw-*` | 62 个旧令牌中 60 个仍存在，仅 `--dsw-shadow-lv1/lv3` 在 0.2.1 中不再定义 | 对照 `dsh-client-ui-theme` 设计平台 CSS |
| `body[data-ds-dark-theme]` | 有效 | 运行时确认 |
| 发送按钮鲸鱼 | **原样可用**：`[data-composer-card]` 仍存在、主按钮 class 仍含 `_primary`（`RlGAzG_primary`）、运行态仍用 `<rect>` 停止方块，`:has(rect)` 判断成立 | 运行时截图确认鲸鱼点阵渲染 |
| 水中鲸鱼背景动画 | 脚本可用（canvas 生成、气泡/鲸鱼绘制逻辑与 DOM 无关） | 截图确认水面渐变、气泡、鲸鱼巡游 |
| 主题卸载清理 | `ctx.effect` 约定不变 | `dsh-client-modules` / cordis client 约定 |

## 2. Desktop 版带来的新变化（v2 新增的一层）

0.2.x 引入 Electron 桌面外壳，主题必须理解这些标记，否则会出现"水景被整屏底板盖住""标题栏空洞"之类问题：

| 信号 | 说明 | 主题应对 |
|---|---|---|
| `html[data-platform="win32"]` | preload 写入的平台标记 | 用于平台分支 |
| `html[data-windows-titlebar]` + `--dsh-windows-titlebar-height: 40px` | Windows 隐藏原生标题栏，顶部 40px 是拖拽带 | 保留拖拽带不透明、`-webkit-app-region: drag`；水景从带下开始 |
| `html[data-ds-theme-source]` | `system/light/dark`，同步原生外观 | 不需要处理 |
| `window.dshDesktop` / `dshDesktopBoot` / `dshPlatform` | Desktop 专属桥 | 仅作为"桌面模式"判断依据之一 |
| `app.asar` 窗口 `backgroundColor:#00000000`、`titleBarStyle:hidden` | 窗口本身透明，UI 自绘 | 需要主题自己保证底板透明/玻璃色 |

**重要**：0.2.1-rc.2 中**没有** `data-dsh-desktop-mode`、也**没有** `.dshDesktopFrame` / `.dshDesktopSidebarSurface` 这些类（它们来自更新的 nightly 版本，网上其它主题里的同名选择器不要照抄）。

### 背景 canvas 的层级坑

旧主题把 `#dsh-bg-canvas` 设为 `position:fixed; z-index:0`。在 0.2.x 里应用内容同样处于正常层叠流中，`z-index:0` 的定位元素会**盖在正文之上**（实测确认）。v2 改为：

```css
#dsh-bg-canvas { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
html, body, #root { background: transparent !important; }
```

并清掉会盖住水景的整屏底板（`.BynINW_frame`、`.BynINW_centerCol`、侧边栏、右栏、会话根等）。Windows 顶部 40px 标题栏拖拽带保留实色——因为原生窗口按钮颜色是由 preload 采样 `--dsw-specific-sidebar-fill` 后同步的，这条令牌必须保持不透明。

## 3. v2.0.0 改造清单

1. **插件身份**：`client.js` 注册 id 改为包名；新增 `scripts/build-client.mjs` 从 `src/*.css|js` 生成 `client.js`，避免样式与内嵌字符串不同步。
2. **令牌层**（`src/tokens.css`）：59 个旧令牌原值保留，1 个兼容补丁（`--dsw-alias-label-quaternary`：0.2.1 不再定义但仍有组件无 fallback 引用），新增 0.2.1 必需令牌 `--dsw-alias-state-idle-primary`（明/暗两套），并采纳半径/焦点环/菜单/侧边栏等新令牌以贴合 macOS 观感。
3. **外壳层**（`src/shell.css`）：水景透明底板、Windows 标题栏拖拽带、桌面平台分支、减少透明度偏好。
4. **分区层**（`src/regions.css`）：侧边栏 / 会话 / 输入框 / 消息与 think / 轨迹 / 设置 / 弹层，按 0.2.1 新类名 + 语义钩子（`[data-conversation-tabs]`、`[role=treeitem][aria-selected]`、`[data-variant=think]`、`[data-kind]` 等）重写；优先语义选择器，必须用哈希的地方集中在文件顶部"版本适配层"并标注所属包，方便下次升级替换。
5. **发送按钮**（`src/whale-icon.css`）：选择器保持原样可用；仅按 0.2.1 的 34px 圆形按钮微调水滴/光环位置。
6. **文档**：README 更新版本矩阵与安装方式；`reports/` 保留审计产物（映射表、DOM 参考、令牌 diff）。

### 3.1 v2.1.0 桌面端补全（2026-10-18）

实际在 Desktop 中使用后发现两处体验问题，v2.1 已修复：

1. **对话区水景回归**：v2.0 给会话滚动区叠了 0.72 白 + 18px 模糊的"磨砂"层，导致水色/气泡/鲸鱼在消息区几乎不可见。v2.1 改为**淡水位面纱**（0.12→0.26 渐变、无模糊），并略微提高画布水色透明度，让 aquarium 在消息区完整透出（明/暗两套）；
2. **桌面端新增元素补全**：0.2.x 相比 0.1.x 多出的界面元素此前是原生样式，现已按 macOS 语言统一：Windows 40px 标题栏拖拽带水色渐变、会话头部信息胶囊（智能体团队/模式/子智能体/后台任务）、运行状态浮条、工具调用卡片、Markdown 代码块/表格/行内代码、队列坞、右侧栏玻璃、侧边栏底部发丝线、输入框座渐变（去掉生硬接缝）、自动化任务页透明化 + iOS 分段筛选、消息行内文件链接/耗时胶囊/图片圆角等。

这些改动都在 `src/regions.css` 末尾的 §15 段，按"语义选择器优先、哈希集中在少量规则"维护。

### 3.2 v2.2.0 视觉与性能升级（2026-10-19）

在 v2.1 基础上完成的一轮系统性优化（经独立回归与实机截图验证）：

1. **「珍珠玻璃」视觉体系**：侧边栏 / 视图标签 / 选中会话行 / 输入框 / 菜单统一为低饱和珍珠质感；设置面板按 macOS Tahoe System Settings 重做（920px、26px 圆角、独立圆角导航、分类彩色图标 chip、分组卡片、胶囊下拉、明暗双套）；
2. **环境氛围**：顶部新增日/月天空（暖色夕阳 / 冷色月夜）与缓慢飞行的海鸥，仅装饰、aria-hidden、pointer-events:none；背景鲸鱼恢复官方 DeepSeek 轮廓并加入水面倒影、尾部传播波动，点阵与纹理共享同一波函数；
3. **性能与健壮性**：移除侧边栏/右栏大范围 blur；发送按钮从「600ms 轮询 + 常驻 rAF」改为 MutationObserver 合并更新（空闲只画一次）；背景 rAF 在隐藏/失焦/reduced-motion 时取消并在恢复时继续，无补帧跳跃；canvas 失败时保留原生发送图标；减少透明度偏好恢复为**不透明**底色回退；
4. **回归测试**：新增 `scripts/theme-regression.mjs`（无第三方依赖，Node VM + 有界 DOM/Canvas 桩），覆盖按钮挂载/停止态/注入清理/卸载、rAF 取消与恢复、reduced-motion、canvas 失败回退等；构建仍可复现（client.js 由 src 完整重建，两次构建哈希一致）；
5. **本版修正**：设置导航图标不再用 `:nth-child` 替换成可能错位的自定义图标（导航项数量/顺序变化时图标会串位），改为保留 DSH 原生图标、仅按位置着色；减少透明度回退改回不透明。

### 3.3 v2.3.0 选择器自愈 + 磨砂鲸鱼（2026-10-25 ~ 10-28，适配 rc.3）

1. **运行时选择器自愈（最重要的架构变化）**：`src/apply.js` 内置 120 条「稳定 local 名 ↔ 已知哈希」绑定；插件加载时读取页面内各 `<style data-plugin-css>` 的实时哈希表，把主题 CSS 中写死的哈希选择器自动改写为 `:is(.已知哈希, .当前哈希)`。**DSH 升级换哈希后主题可以自愈**，不再依赖人工移植（rc.2 → rc.3 的 151 个 module 已实测全部命中、120 条绑定零缺口）；
2. **磨砂鲸鱼材质**：背景鲸鱼改为缓存的冰蓝渐变 + 半透明躯干 + 轻微轮廓高光，点阵改成 32 个确定性缓存微粒，删除每帧 560 次点阵圆点绘制；不新增 canvas / rAF / timer；
3. **Windows 关闭透明效果（EnableTransparency=0）的适配**：`prefers-reduced-transparency: reduce` 下改为「不透明局部 canvas 裁剪复制现有水景」，侧栏保留水景观感、文字仍为实色降级；DSH preload 用于探测标题栏 caption 颜色的隐藏 span 改为透明背景，使原生窗口按钮透出天空色；
4. **输入框光环重做**：呼吸光环移到 `::before`（支持 reduced-motion / forced-colors / 减少透明度降级），保留发送/聚焦/排队三种状态；
5. **运维事实**：10-28 插件目录被一次包更新用 GitHub 上的 v2.2.0 覆盖（安装目录只剩 `files` 清单内文件），Codex 执行 update-repair 恢复；本版推送后，后续包更新拉到的就是含全部修复的版本，不会再被覆盖回退。
## 4. 以后 DSH 升级了怎么维护

1. 升级后若"皮肤部分失效"，先看是否只是哈希变化：从 `app.asar` 解包（或 `node_modules/@deepseek-ai/dsh-client-ui-*`）里重新提取每个 bundle 的 `*_module_css_default` 映射表；
2. 按"局部名（local suffix）"匹配旧选择器，生成新的哈希替换表（本次方法见 `reports/map.json` / `reports/selector-map.md`）；
3. 只改 `src/regions.css` 顶部"版本适配层"里的哈希常量即可，语义选择器（data-*/role/aria）通常跨版本稳定；
4. 背景动画、鲸鱼按钮、设计令牌层一般无需改动。

## 5. 验证证据（本次测试）

在独立测试 profile（端口 61650，不触碰用户正在使用的 desktop profile）上，用无头 Edge + CDP 实测：

- **启动/加载**：`bootClean`、`themeStylePresent`（主题样式注入 71.5KB）、`bgCanvasPresent`（`z-index:-1`）、`canvasBehindUi`、`bodyTransparent`、`composerPresent`、`sendButtonPresent`、`noConsoleErrors` —— 全部通过；
- **皮肤计算样式断言 16/17 通过**：侧边栏玻璃（`blur(14px)` + `rgba(242,242,247,0.62)`）、新建会话按钮 `#007AFF`、输入框圆角 18px、iMessage 气泡 18px、视图标签 999px 胶囊 + `#007AFF`、选中会话行 `#0A60FF`、助手鲸鱼头像（`::before` mask）、think 卡片（`--dsw-alias-bg-layer-2` + 蓝色左边框）、设置导航 220px、Windows 40px 标题栏拖拽带、轨迹彩色方框徽章、菜单圆角。唯一未通过项是"轨迹选中行"——测试夹具里没有选中行，属于测试覆盖缺口而非主题缺陷；
- **明/暗 + 1600×1000/1280×820 + desktop 仿真**截图：聊天、新会话、设置、轨迹、输入框（空闲/运行态）、菜单；
- **类名命中**：旧主题 88 个业务类名在 0.2.1 运行页面命中 **0**；外壳层 8 个类各命中 1（证明"旧皮肤全灭、外壳层有效"）；
- **反例证据（v1 未改造前）**：插件加载失败，界面停在 "Failed to load plugins / dsh-whale-aqua-theme"。

产物位置（本次工作区）：`.scratch-verify/shots/2026-10-18T04-58-43-pass3/`、`reports/`。仓库内更新后的截图见 `screenshots/`。

> 说明：无头环境默认命中 `prefers-reduced-transparency: reduce`，此时侧边栏按无障碍回退为不透明；截图时已模拟 `no-preference` 以呈现玻璃效果，真实桌面默认即玻璃。

## 6. 安装与回滚

```bash
# 安装（Desktop / Web 皆可；Desktop 使用 desktop profile）
dsh plugin --profile desktop add https://github.com/dataizu/dsh-whale-aqua-theme
# 或本地开发安装
dsh plugin --profile desktop add /path/to/dsh-whale-aqua-theme
```

卸载：删除 profile 下 `cordis.patch.yml` 中 `id: dsh-whale-aqua` 的 `insert` 行（或在插件市场移除），重启 DSH 生效。主题运行期只注入一个 `<style data-dsh-whale-aqua>` 和一个背景 canvas，停用即回收，不改任何 dist 文件。

> 注意：若同时安装其他皮肤类插件（如 open-sea-skin），两套皮肤会互相覆盖，请一次只启用一个主题插件。

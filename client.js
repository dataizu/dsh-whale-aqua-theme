// dsh-whale-aqua-theme —— 浏览器面（client face）· DSH 0.2.x（Desktop / Web）适配版。
// 由 scripts/build-client.mjs 从 src/*.css 与 src/*.js 生成，请勿直接编辑本文件。
//
// 加载约定（DSH >= 0.2.0，见 @deepseek-ai/dsh-client-modules）：
//   - 包 package.json 必须声明 dsh.client.platform = "web" 且 exports["./client"] 指向本文件；
//   - 本 bundle 通过 window.__ModuleLoader__.load({ id, factory }) 注册，
//     id 必须等于包名 "dsh-whale-aqua-theme"，否则模块系统会报
//     "loaded without registering ..." / "duplicate factory registration"；
//   - factory 返回 { name, inject, apply }，插件停止时 ctx.effect 清理全部副作用
//     （<style>、全屏 canvas、window 监听、rAF 循环、setInterval、按钮 canvas）。
//
// 内容：
//   1. whale-icon.css + tokens.css + shell.css + regions.css 随插件注入；
//   2. 水中鲸鱼背景动画与发送按钮点阵鲸鱼（生命周期全部纳入 ctx.effect）。
window.__ModuleLoader__.load({
  id: "dsh-whale-aqua-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var THEME_VERSION = "2.3.0";
    // ---- 皮肤样式（源文件见 src/*.css）----
    var WHALE_ICON_CSS = "/* =============================================================================\n   whale-icon.css — dot-matrix whale send button (DSH 0.2.1-rc.2 verified)\n   -----------------------------------------------------------------------------\n   Ported from dsh-whale-aqua-theme (0.1.x) src/whale-icon.css — the selectors are\n   unchanged because 0.2.1 kept the contract the original was written against:\n\n     [data-composer-card]              runtime: <div class=\"RlGAzG_card\"\n                                       data-composer-card=\"true\">  (composer card)\n     button[class*=\"_primary\"]         runtime: <button class=\"RlGAzG_primary\">\n                                       (send/stop button, 34x34 circle)\n     :has(rect)                        running state = the button's svg swaps the\n                                       arrow path for the stop-square <rect>\n                                       (bundle JSX; confirmed by Lead/verifier)\n     canvas                            background.js appends a dot-matrix whale\n                                       <canvas> overlay into the button; the\n                                       native SVG is hidden only after successful\n                                       attachment, preserving its fallback otherwise.\n\n   MERGE TARGET : src/whale-icon.css (first CSS injected, before tokens/shell/\n   regions). No external assets.\n\n   TODO(verify): the old bubble positions (left 8.75px / top 6.3px, 3.5px) were\n   tuned on the 0.1.x button; the 0.2.1 button is 34x34 with a 999px radius. If\n   the bench shows bubbles drifting outside the halo, nudge left/top only here.\n   ============================================================================= */\n\n[data-composer-card] button[class*=\"_primary\"] {\n  position: relative;\n}\n[data-composer-card] button[class*=\"_primary\"][data-dsh-whale-attached] svg {\n  display: none;\n}\n/* Running state keeps the original animated whale, halo, and rising bubbles. */\n[data-composer-card] button[class*=\"_primary\"]:has(rect) {\n  animation: dsh-whale-halo 2.4s ease-in-out infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  content: \"\";\n  position: absolute;\n  border-radius: 50%;\n  pointer-events: none;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before {\n  left: 8.75px;\n  top: 6.3px;\n  width: 3.5px;\n  height: 3.5px;\n  background: rgba(255,255,255,0.85);\n  animation: dsh-whale-bubble 2.8s ease-in infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  left: 10.25px;\n  top: 6.9px;\n  width: 2.5px;\n  height: 2.5px;\n  background: rgba(255,255,255,0.7);\n  animation: dsh-whale-bubble 2.8s ease-in 1.3s infinite;\n}\n@keyframes dsh-whale-bubble {\n  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }\n  15% { opacity: 0.9; }\n  55% { transform: translate(1.2px, -5px) scale(1); opacity: 0.75; }\n  100% { transform: translate(-0.6px, -11px) scale(0.45); opacity: 0; }\n}\n@keyframes dsh-whale-halo {\n  0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5); }\n  70% { box-shadow: 0 0 0 6px rgba(0, 122, 255, 0); }\n  100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }\n}\n@media (prefers-reduced-motion: reduce) {\n  [data-composer-card] button[class*=\"_primary\"]:has(rect),\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n    animation: none;\n  }\n}\n";
    var TOKENS_CSS = "/* =============================================================================\n   tokens.css — Apple/macOS design-token layer for DSH 0.2.1-rc.2\n   -----------------------------------------------------------------------------\n   Port of dsh-whale-aqua-theme (built for DSH 0.1.x) src/apple-style.css:1-172\n   + the global primitives that used to live at the end of that palette block.\n\n   MERGE TARGET : src/apple-style.css (injected as APPLE_STYLE_CSS)\n   INJECT ORDER : whale-icon.css -> APPLE_STYLE_CSS -> shell.css -> regions.css\n                  (see src/apply.js). So every rule here can be overridden by\n                  shell.css / regions.css, and it can override the 0.2.1 design\n                  platform because the plugin <style> is appended to <head>\n                  after the platform stylesheet.\n\n   EVIDENCE\n     - 0.2.1 token definitions : @deepseek-ai/dsh-client-ui-theme/lib/client.js\n       (formatted copy .scratch-asar/css-fmt/dsh-client-ui-theme__lib__client.js.css\n        lines 110-124 base/easing/radius, 131-511 alias tokens, 512-513 darwin menu,\n        526-554 scrollbar/gradient/shadow/focus, 746-766 shiki)\n     - consumers: `var(--token)` occurrences across all 0.2.1 client bundles\n       (dsh-client-ui-* + dsh-web-frontend shell CSS). Counts in the inline\n       comments are combined-scan totals (formatted CSS *and* raw client.js\n       strings, so ~2x the CSS-only counts listed in token-diff.md) — they exist\n       to show a token is alive, not as exact numbers.\n     - desktop shell probes : lib/preload-app.cjs:586 probes\n       `--dsw-specific-sidebar-fill` + `--dsw-alias-label-primary` for the native\n       Windows caption color -> those two MUST stay opaque (see below).\n\n   SECTIONS\n     A. Light palette  : 59 kept Apple tokens + 1 compatibility patch + adopted\n                         (old palette had 62 --dsw-* tokens: 60 carried here,\n                          1 refactored to --dsw-menu-surface-fill,\n                          1 dropped: --dsw-specific-tip, 0 consumers)\n                         + 1 NEW-REQUIRED token (state-idle-primary, contract)\n     B. Dark palette   : body[data-ds-dark-theme]\n     C. Darwin scope   : only where 0.2.1 itself scopes a token (menu material)\n     D. Global primitives (selection / focus / scrollbar / icon strokes / accent)\n     E. Parity + TODO  : tokens kept for 0.1.x parity but unused in 0.2.1\n\n   STATUS LEGEND (see token-diff.md for the full table)\n     KEPT      name + Apple value unchanged, token still defined & consumed\n     PATCH     removed from 0.2.1 design platform but still referenced by\n               bundles without a fallback -> we must define it\n     ADOPTED   new 0.2.1 token set to the old Apple design language\n     NEW-REQ   required by 0.2.1's custom-theme contract (BUILTIN_INSPECT_TOKENS,\n               light + dark) but absent from the 0.1.x palette\n     PARITY    still defined by 0.2.1 but no current consumer; harmless, prunable\n   ========================================================================== */\n\n/* =============================================================================\n   A. LIGHT PALETTE  — body { ... }   (identity: #007AFF / #1D1D1F / #F5F5F7 /\n                                       #F2F2F7, exactly the 0.1.x Apple palette)\n   ========================================================================== */\nbody {\n  /* --- surfaces / layers --- */\n  --dsw-alias-bg-base: #FFFFFF !important;                          /* KEPT  (0.2.1 body background-color + 77 consumers) */\n  --dsw-alias-bg-layer-1: #FFFFFF !important;                       /* KEPT  (97) */\n  --dsw-alias-bg-layer-2: #F5F5F7 !important;                       /* KEPT  (47)  Apple grouped-content grey */\n  --dsw-alias-bg-layer-3: #FFFFFF !important;                       /* KEPT  (26) */\n  --dsw-alias-bg-overlay: #FFFFFF !important;                       /* KEPT  (2; user-questions badge) */\n  --dsw-specific-sidebar-fill: #F2F2F7 !important;                   /* KEPT & MUST STAY OPAQUE: probed by Electron\n                                                             caption sync (preload-app.cjs:586) and used by\n                                                             the 40px [data-windows-titlebar] band in\n                                                             shell.css -> never alpha here. */\n  --dsw-specific-input-major: #FFFFFF !important;                    /* KEPT  (18) composer card surface */\n  --dsw-specific-selector: rgba(0, 0, 0, 0.05) !important;           /* KEPT  (4)  segmented/select chip fill */\n  --dsw-alias-bg-module-platform: rgba(0, 0, 0, 0.04) !important;    /* KEPT  (64) toolbars / nav icons */\n  --dsw-alias-bg-multi-select: rgba(0, 0, 0, 0.04) !important;       /* PARITY (0 consumers) */\n  --dsw-alias-bg-skeleton: rgba(0, 0, 0, 0.05) !important;           /* KEPT  (15) */\n\n  /* --- borders --- */\n  --dsw-alias-border-l1: rgba(0, 0, 0, 0.06) !important;             /* KEPT  (113) hairline */\n  --dsw-alias-border-l2: rgba(0, 0, 0, 0.10) !important;             /* KEPT  (169) */\n  --dsw-alias-border-l2-darkmode-thin: rgba(0, 0, 0, 0.08) !important; /* KEPT (17) .5px strokes */\n  --dsw-alias-border-l3: rgba(0, 0, 0, 0.14) !important;             /* KEPT  (111) */\n  --dsw-alias-border-l4: rgba(0, 0, 0, 0.20) !important;             /* KEPT  (85) */\n\n  /* --- brand / state --- */\n  --dsw-alias-brand-primary: #007AFF !important;                     /* KEPT  (17) */\n  --dsw-alias-state-business-primary: #007AFF !important;            /* KEPT  (334) accent blue */\n  --dsw-alias-state-error-primary: #FF3B30 !important;               /* KEPT  (224) Apple red */\n  --dsw-alias-state-success-primary: #34C759 !important;             /* KEPT  (42)  Apple green */\n  --dsw-alias-state-success-tertiary: rgba(52, 199, 89, 0.12) !important;   /* KEPT (5) */\n  --dsw-alias-state-warn-primary: #FF9500 !important;                /* KEPT  (20)  Apple orange */\n  --dsw-alias-state-warn-tertiary: rgba(255, 149, 0, 0.12) !important;      /* KEPT (27) */\n  /* NEW-REQUIRED: 0.2.1's theme contract (BUILTIN_INSPECT_TOKENS in\n     dsh-client-ui-theme) requires light+dark values for 14 alias tokens,\n     including --dsw-alias-state-idle-primary, which the 0.1.x palette never\n     defined. Value = Apple systemGray4 pair, consistent with the #2C2C2E/\n     #3A3A3C surfaces and the idle dot role in 0.2.1 (base was neutral-300). */\n  --dsw-alias-state-idle-primary: #C7C7CC !important;\n\n  /* --- labels --- */\n  --dsw-alias-label-primary: #1D1D1F !important;                     /* KEPT  (605) MUST stay opaque: caption probe */\n  --dsw-alias-label-primary-dimmed: rgba(29, 29, 31, 0.55) !important; /* KEPT (8) */\n  --dsw-alias-label-primary-foreground: #FFFFFF !important;          /* KEPT  (15) text on primary buttons */\n  --dsw-alias-label-primary-inverted: #FFFFFF !important;            /* KEPT  (8) */\n  --dsw-alias-label-secondary: #545458 !important;                   /* KEPT  (468) */\n  --dsw-alias-label-tertiary: #82828A !important;                    /* KEPT  (640) */\n  --dsw-alias-label-caption: #94949C !important;                     /* KEPT  (173) */\n  --dsw-alias-label-dimmed: #A9A9B0 !important;                      /* KEPT  (17) */\n  /* PATCH: 0.2.1 design platform no longer defines --dsw-alias-label-quaternary,\n     but @deepseek-ai/dsh-client-ui-agent-preset + dsh-client-ui-sidebar-browser\n     still use it for :disabled color WITHOUT a fallback (see token-diff.md).\n     Without this line the declaration is invalid at computed-value time. */\n  --dsw-alias-label-quaternary: rgba(60, 60, 67, 0.18) !important;\n\n  /* --- buttons --- */\n  --dsw-alias-button-primary-fill: #007AFF !important;               /* KEPT  (10) */\n  --dsw-alias-button-primary-hover: #0077ED !important;              /* KEPT  (5) */\n  --dsw-alias-button-info-fill: #007AFF !important;                  /* KEPT  (6) */\n  --dsw-alias-button-info-hover: #0077ED !important;                 /* KEPT  (2) */\n  --dsw-alias-button-contrast-fill: #1D1D1F !important;              /* KEPT  (6) */\n  --dsw-alias-button-elevated-fill: #FFFFFF !important;              /* KEPT  (4)  sidebar new-session / workspace btn */\n  --dsw-alias-button-floating-fill: #FFFFFF !important;              /* KEPT  (6) */\n  --dsw-alias-button-floating-hover: #F2F2F7 !important;             /* KEPT  (6) */\n  --dsw-alias-button-tool-bar-fill: rgba(0, 0, 0, 0.04) !important;  /* KEPT  (1, desktop shell menu bar) */\n  --dsw-alias-button-tool-bar-hover: rgba(0, 0, 0, 0.08) !important; /* KEPT  (1) */\n  --dsw-alias-button-ghost-active-fill: rgba(0, 122, 255, 0.12) !important;   /* KEPT (7) */\n  --dsw-alias-button-ghost-active-border: rgba(0, 122, 255, 0.5) !important;  /* KEPT (5) */\n  --dsw-alias-button-ghost-active-hover: rgba(0, 122, 255, 0.16) !important;  /* PARITY (0) */\n\n  /* --- interaction fills --- */\n  --dsw-alias-interactive-bg-hover: rgba(0, 0, 0, 0.05) !important;       /* KEPT (291) */\n  --dsw-alias-interactive-bg-active: rgba(0, 0, 0, 0.09) !important;      /* KEPT (7) */\n  --dsw-alias-interactive-bg-hover-solid: #F2F2F7 !important;             /* KEPT (20) */\n  --dsw-alias-interactive-bg-hover-danger: rgba(255, 59, 48, 0.08) !important; /* KEPT (20) */\n\n  /* --- scrollbars --- */\n  --dsw-alias-scrollbar-bg-l1: rgba(0, 0, 0, 0.16) !important;       /* KEPT  (6) */\n  --dsw-alias-scrollbar-hover-l1: rgba(0, 0, 0, 0.32) !important;    /* KEPT  (2) */\n  --dsw-alias-scrollbar-bg-l2: rgba(0, 0, 0, 0.12) !important;       /* KEPT  (68) */\n  --dsw-alias-scrollbar-hover-l2: rgba(0, 0, 0, 0.28) !important;    /* KEPT  (68) */\n\n  /* --- shadows / blur --- */\n  --dsw-shadow-lv1: 0 1px 2px rgba(0, 0, 0, 0.04) !important;        /* PARITY: 0 consumers in 0.2.1 */\n  --dsw-shadow-lv2: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;  /* KEPT (2) */\n  --dsw-shadow-lv3: 0 12px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06) !important; /* KEPT (2, desktop shell) */\n  --dsw-mask-blur: blur(20px) !important;                            /* KEPT  (6)  used as backdrop-filter */\n\n  /* --- misc static --- */\n  --dsw-static-deepseek-450: #007AFF !important;                     /* KEPT  (5)  dark-mode brand alias */\n\n  /* --- custom props (not --dsw-*, still live in 0.2.1) --- */\n  --dsh-scrollbar-width: 6px !important;                             /* KEPT: 0.2.1 ::-webkit-scrollbar{width:var(--dsh-scrollbar-width)} */\n  --ds-ease-in-out: cubic-bezier(0.32, 0.72, 0, 1) !important;       /* KEPT: Apple springy ease, 20+ transitions in 0.2.1 */\n\n  /* ==========================================================================\n     ADOPTED — 0.2.1-only tokens mapped to the old Apple design language\n     ========================================================================== */\n\n  /* 1) Menu material.  0.2.1 refactored the old direct --dsw-specific-menu into\n     --dsw-menu-surface-fill (body{--dsw-specific-menu:var(--dsw-menu-surface-fill)})\n     + --dsw-menu-backdrop-filter. We therefore drive the upstream token; the\n     old 0.1.x look was rgba(255,255,255,0.85) + saturate(180%) blur(30px)\n     (old ._list_19372_8 / ._submenu_19372_9 rule). Do NOT set\n     --dsw-specific-menu directly (it would not cover future material users). */\n  --dsw-menu-surface-fill: rgba(255, 255, 255, 0.85) !important;\n  --dsw-menu-backdrop-filter: saturate(180%) blur(30px) !important;\n\n  /* 2) Radius scale.  0.2.1 base_css_default defines\n     xs:4 sm:8 md:12 lg:16 xl:20 panel:28. Old Apple skin used\n     buttons 8-10, cards 10-14, conversation bubble 18, panels/dialogs 16.\n     Mapping (old rule -> 0.2.1 token consumer found in bundles):\n       ._button_* ._card_* (10)        -> --dsw-radius-md      (158 consumers)\n       .bqrRRG_card (14) / cards       -> --dsw-radius-lg      (113)\n       .gdEzaW_bubble (18), ._2H3hWW_* -> --dsw-radius-xl      (52; incl. .cJsG2q_bubble)\n       dialog / panel (16)             -> --dsw-radius-panel   (13; composer + dialogs)\n     TODO(verify): composer card is .RlGAzG_card{border-radius:var(--dsw-radius-panel)}\n     so it lands at 16 here; the old composer was 18 -> regions.css re-applies 18\n     on [data-composer-card]. Check on bench. */\n  --dsw-radius-md: 10px !important;\n  --dsw-radius-lg: 14px !important;\n  --dsw-radius-xl: 18px !important;\n  --dsw-radius-panel: 16px !important;\n\n  /* 3) Focus ring.  0.2.1 focus_css_default: :root{--dsw-focus-ring-width:2px},\n     components do `outline: var(--dsw-focus-ring-width) solid\n     var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary))` (189 sites).\n     --dsw-focus-ring-color has no default -> old global Apple ring color goes here. */\n  --dsw-focus-ring-color: rgba(0, 122, 255, 0.55) !important;\n\n  /* 4) Settings grouped cards.  0.2.1 ships fill=bg-layer-2 / stroke=border-l4 via\n     body{--dsw-alias-settings-card-fill:...} (5+5 consumers). Old macOS settings\n     card was bg-layer-1 + hairline border-l1, radius 10 (old ._WvWnq_section). */\n  --dsw-alias-settings-card-fill: var(--dsw-alias-bg-layer-1) !important;\n  --dsw-alias-settings-card-stroke: var(--dsw-alias-border-l1) !important;\n\n  /* 5) Brand accent, new name.  0.2.1 changed --dsw-alias-brand-primary to a\n     near-black neutral and introduced --dsw-alias-brand-primary-new-colorprimary-new-color\n     (default #4176e6 light) used by settings links, trajectory rails/selection\n     (25 sites). The old design language accent is #007AFF -> feed it here so the\n     trajectory rail / settings link stay Apple blue, not DeepSeek purple-blue. */\n  --dsw-alias-brand-primary-new-colorprimary-new-color: #007AFF !important;\n\n  /* 6) Settings sidebar nav active accent (0.2.1-only; used by user-questions nav).\n     Old macOS System-Settings active row: blue 12% tint. */\n  --dsw-specific-sidebar-nav-item-active-accent: rgba(0, 122, 255, 0.12) !important;\n  --dsw-specific-sidebar-nav-item-hover: rgba(0, 0, 0, 0.05) !important;   /* KEPT (2) */\n  --dsw-specific-sidebar-nav-item-active: rgba(0, 122, 255, 0.12) !important; /* KEPT (2) */\n\n  /* 7) Links.  0.2.1 --dsw-alias-link default #4176e6 (deepseek-500), 18 consumers\n     (markdown links etc). Old Apple accent blue is #007AFF. */\n  --dsw-alias-link: #007AFF !important;\n\n  /* NOTE (deliberately NOT adopted): --dsw-specific-bubble.\n     0.2.1 uses it for the iMessage-style user bubble (.cJsG2q_bubble, radius-xl,\n     color label-primary) BUT also for goal cards and user-questions cards.\n     The old skin needs a saturated #007AFF fill + white text, which would leak\n     into those cards -> the bubble is re-skinned per-region in regions.css\n     instead of globally in the token layer. Same for --dsw-specific-bubble-highlight\n     (only used by the experimental session inspector). */\n}\n\n/* =============================================================================\n   B. DARK PALETTE — body[data-ds-dark-theme]\n   (identity: #0A84FF / #F5F5F7 / #2C2C2E / #3A3A3C)\n   ========================================================================== */\nbody[data-ds-dark-theme] {\n  /* --- surfaces / layers --- */\n  --dsw-alias-bg-base: #1C1C1E !important;                          /* KEPT */\n  --dsw-alias-bg-layer-1: #2C2C2E !important;                       /* KEPT */\n  --dsw-alias-bg-layer-2: #3A3A3C !important;                       /* KEPT */\n  --dsw-alias-bg-layer-3: #3A3A3C !important;                       /* KEPT */\n  --dsw-alias-bg-overlay: #2C2C2E !important;                       /* KEPT */\n  --dsw-specific-sidebar-fill: #2C2C2E !important;                   /* KEPT & OPAQUE (caption probe) */\n  --dsw-specific-input-major: #2C2C2E !important;                    /* KEPT */\n  --dsw-specific-selector: rgba(255, 255, 255, 0.10) !important;     /* KEPT */\n  --dsw-alias-bg-module-platform: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-alias-bg-multi-select: rgba(255, 255, 255, 0.08) !important; /* PARITY */\n  --dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.08) !important;     /* KEPT */\n\n  /* --- borders --- */\n  --dsw-alias-border-l1: rgba(255, 255, 255, 0.08) !important;       /* KEPT */\n  --dsw-alias-border-l2: rgba(255, 255, 255, 0.14) !important;       /* KEPT */\n  --dsw-alias-border-l2-darkmode-thin: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-alias-border-l3: rgba(255, 255, 255, 0.18) !important;       /* KEPT */\n  --dsw-alias-border-l4: rgba(255, 255, 255, 0.24) !important;       /* KEPT */\n\n  /* --- brand / state --- */\n  --dsw-alias-brand-primary: #0A84FF !important;                     /* KEPT */\n  --dsw-alias-state-business-primary: #0A84FF !important;            /* KEPT */\n  --dsw-alias-state-error-primary: #FF453A !important;               /* KEPT */\n  --dsw-alias-state-success-primary: #30D158 !important;             /* KEPT */\n  --dsw-alias-state-success-tertiary: rgba(48, 209, 88, 0.16) !important;   /* KEPT */\n  --dsw-alias-state-warn-primary: #FF9F0A !important;                /* KEPT */\n  --dsw-alias-state-warn-tertiary: rgba(255, 159, 10, 0.16) !important;     /* KEPT */\n  --dsw-alias-state-idle-primary: #48484A !important;                /* NEW-REQUIRED (contract), see light block */\n\n  /* --- labels --- */\n  --dsw-alias-label-primary: #F5F5F7 !important;                     /* KEPT & OPAQUE (caption probe) */\n  --dsw-alias-label-primary-dimmed: rgba(245, 245, 247, 0.55) !important; /* KEPT */\n  --dsw-alias-label-primary-foreground: #FFFFFF !important;          /* KEPT */\n  --dsw-alias-label-primary-inverted: #1C1C1E !important;            /* KEPT */\n  --dsw-alias-label-secondary: #B8B8C0 !important;                   /* KEPT */\n  --dsw-alias-label-tertiary: #8E8E98 !important;                    /* KEPT */\n  --dsw-alias-label-caption: #7E7E88 !important;                     /* KEPT */\n  --dsw-alias-label-dimmed: #6C6C76 !important;                      /* KEPT */\n  --dsw-alias-label-quaternary: rgba(235, 235, 245, 0.18) !important; /* PATCH (see light block) */\n\n  /* --- buttons --- */\n  --dsw-alias-button-primary-fill: #0A84FF !important;               /* KEPT */\n  --dsw-alias-button-primary-hover: #2E90FA !important;              /* KEPT */\n  --dsw-alias-button-info-fill: #0A84FF !important;                  /* KEPT */\n  --dsw-alias-button-info-hover: #2E90FA !important;                 /* KEPT */\n  --dsw-alias-button-contrast-fill: #F5F5F7 !important;              /* KEPT */\n  --dsw-alias-button-elevated-fill: #2C2C2E !important;              /* KEPT */\n  --dsw-alias-button-floating-fill: #3A3A3C !important;              /* KEPT */\n  --dsw-alias-button-floating-hover: #48484A !important;             /* KEPT */\n  --dsw-alias-button-tool-bar-fill: rgba(255, 255, 255, 0.06) !important; /* KEPT */\n  --dsw-alias-button-tool-bar-hover: rgba(255, 255, 255, 0.10) !important; /* KEPT */\n  --dsw-alias-button-ghost-active-fill: rgba(10, 132, 255, 0.20) !important;  /* KEPT */\n  --dsw-alias-button-ghost-active-border: rgba(10, 132, 255, 0.60) !important; /* KEPT */\n  --dsw-alias-button-ghost-active-hover: rgba(10, 132, 255, 0.24) !important;  /* PARITY */\n\n  /* --- interaction fills --- */\n  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08) !important;      /* KEPT */\n  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.12) !important;     /* KEPT */\n  --dsw-alias-interactive-bg-hover-solid: #3A3A3C !important;                  /* KEPT */\n  --dsw-alias-interactive-bg-hover-danger: rgba(255, 69, 58, 0.12) !important; /* KEPT */\n\n  /* --- scrollbars --- */\n  --dsw-alias-scrollbar-bg-l1: rgba(255, 255, 255, 0.20) !important;   /* KEPT */\n  --dsw-alias-scrollbar-hover-l1: rgba(255, 255, 255, 0.35) !important;/* KEPT */\n  --dsw-alias-scrollbar-bg-l2: rgba(255, 255, 255, 0.16) !important;   /* KEPT */\n  --dsw-alias-scrollbar-hover-l2: rgba(255, 255, 255, 0.30) !important;/* KEPT */\n\n  /* --- shadows / blur --- */\n  --dsw-shadow-lv1: 0 1px 2px rgba(0, 0, 0, 0.40) !important;          /* PARITY */\n  --dsw-shadow-lv2: 0 4px 16px rgba(0, 0, 0, 0.50), 0 1px 3px rgba(0, 0, 0, 0.40) !important;   /* KEPT */\n  --dsw-shadow-lv3: 0 12px 40px rgba(0, 0, 0, 0.60), 0 2px 8px rgba(0, 0, 0, 0.50) !important;  /* KEPT */\n  --dsw-mask-blur: blur(20px) !important;                              /* KEPT */\n\n  /* --- misc static --- */\n  --dsw-static-deepseek-450: #0A84FF !important;                       /* KEPT */\n\n  /* --- custom props --- */\n  --dsh-scrollbar-width: 6px !important;                               /* KEPT */\n  --ds-ease-in-out: cubic-bezier(0.32, 0.72, 0, 1) !important;         /* KEPT */\n\n  /* --- ADOPTED (dark variants) --- */\n  --dsw-menu-surface-fill: rgba(36, 36, 38, 0.85) !important;          /* old 0.1.x dark menu */\n  --dsw-menu-backdrop-filter: saturate(180%) blur(30px) !important;\n  --dsw-focus-ring-color: rgba(10, 132, 255, 0.65) !important;\n  --dsw-alias-brand-primary-new-colorprimary-new-color: #0A84FF !important;\n  --dsw-specific-sidebar-nav-item-active-accent: rgba(10, 132, 255, 0.24) !important;\n  --dsw-specific-sidebar-nav-item-hover: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-specific-sidebar-nav-item-active: rgba(10, 132, 255, 0.24) !important; /* KEPT */\n  --dsw-alias-link: #0A84FF !important;\n  /* Radius + settings-card fill/stroke are theme-independent / var()-derived,\n     so they intentionally stay in the light block only:\n       --dsw-alias-settings-card-fill:var(--dsw-alias-bg-layer-1) resolves to\n       #2C2C2E here because layer-1 is redefined above; same for the stroke. */\n}\n\n/* =============================================================================\n   C. DARWIN SCOPE — only token 0.2.1 itself scopes on html[data-platform=darwin]\n     is the menu material (theme css lines 512-513):\n       html[data-platform=darwin] body{--dsw-specific-menu:#f8f9faf0}\n     We keep the macOS menu translucent like the rest of the skin. This is the\n     only platform-scoped override; window chrome / caption colors are untouched.\n     (Author runs Windows; darwin values kept conservative and commented.)\n   ========================================================================== */\nhtml[data-platform=darwin] body {\n  --dsw-specific-menu: rgba(255, 255, 255, 0.85) !important;\n}\nhtml[data-platform=darwin] body[data-ds-dark-theme] {\n  --dsw-specific-menu: rgba(36, 36, 38, 0.85) !important;\n}\n\n/* =============================================================================\n   D. GLOBAL PRIMITIVES (no CSS-module hashes; carried over verbatim from the\n      0.1.x palette block because they are cross-cutting chrome)\n   ========================================================================== */\n\n/* Text selection: Apple accent tint (old apple-style.css v0.1.x). */\n::selection {\n  background: rgba(0, 122, 255, 0.22);\n}\nbody[data-ds-dark-theme] ::selection {\n  background: rgba(10, 132, 255, 0.35);\n}\n\n/* Focus ring: 0.2.1 already renders components' rings from\n   --dsw-focus-ring-width/-color (declared above). Old skin also used a 2px\n   offset; a bare `outline-color` here avoids overriding component outlines. */\n:focus-visible {\n  outline-color: var(--dsw-focus-ring-color, rgba(0, 122, 255, 0.55));\n  outline-offset: 2px;\n}\n/* 0.2.1's focus_css_default nulls the ring for pointer modality:\n   html[data-input-modality=pointer] body :focus-visible:not(:read-write).\n   That rule wins on the focused element itself (higher specificity), so mouse\n   users keep the native no-ring behavior; keyboard users get the Apple ring. */\n\n/* Scrollbar size (0.2.1 consumes --dsh-scrollbar-width, declared above).\n   Old skin also forced 6px directly; that is now redundant and would fight\n   --dsh-scrollbar-width, so no ::-webkit-scrollbar rule is re-declared here. */\n\n/* Checkbox / radio accent (old global rule). */\nbody input[type=\"checkbox\"],\nbody input[type=\"radio\"] {\n  accent-color: var(--dsw-alias-button-info-fill, #007AFF);\n}\n\n/* Rounder SVG icon joins (old global rule; purely visual). */\nsvg path[stroke],\nsvg circle[stroke],\nsvg rect[stroke],\nsvg line[stroke] {\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\nsvg[viewBox=\"0 0 16 16\"] path[stroke] {\n  stroke-width: 1.5px;\n}\n\n/* =============================================================================\n   E. PARITY + DROPPED + TODO\n     Tokens kept although 0.2.1 has no current consumer (0 var() references):\n       --dsw-alias-bg-multi-select          (still defined by 0.2.1)\n       --dsw-alias-button-ghost-active-hover(still defined by 0.2.1)\n       --dsw-shadow-lv1 / lv3               (lv3 is consumed by the desktop shell\n                                             shell CSS; lv1 only by old region rules)\n     Dropped (reason):\n       --dsw-specific-tip  still defined by 0.2.1 (theme css:397/511) but no\n                           consumer in 0.2.1 and no rule in the old theme consumed\n                           it either; its old value #F5F5F7 / #2C2C2E is ~the\n                           0.2.1 default, so dropping it changes nothing.\n     Refactored (reason):\n       --dsw-specific-menu -> now derived by 0.2.1 from --dsw-menu-surface-fill,\n                           so only the upstream token is overridden (block A).\n   TODO(verify@bench): screenshot light+dark settings, composer and menus to\n   confirm radius scale, menu alpha and focus ring. Anything that looks off is a\n   value-only change here.\n   ========================================================================== */\n";
    var SHELL_CSS = "/* =============================================================================\n   shell.css — 水中鲸鱼外壳层 + DSH Desktop 窗口适配\n   -----------------------------------------------------------------------------\n   目标版本：DSH 0.2.x（在 Desktop 0.2.1-rc.2 上验证）。\n   职责：\n     1. 让 <canvas id=\"dsh-bg-canvas\">（z-index:-1，body 首个子节点）真正透出来：\n        把 window / frame / 侧边栏 / 会话根节点这些“整屏底板”改为透明或玻璃色。\n     2. 处理 DSH Desktop（Electron）独有的标记：\n          html[data-platform=\"win32\"|\"darwin\"]   —— 由 preload 写入（lib/preload-app.cjs）\n          html[data-windows-titlebar]           —— Windows 隐藏标题栏模式（40px 拖拽带）\n          --dsh-windows-titlebar-height: 40px\n          html[data-fullscreen]                 —— 全屏时去掉顶部留白\n     3. 保留窗口标题栏拖拽区（-webkit-app-region）与原生窗口按钮的安全区。\n\n   选择器说明（0.2.1-rc.2 构建的 CSS Modules 哈希，升级后可能变化）：\n     .BynINW_frame / _centerCol / _sidebarCol / _rightbarCol / _bottomRow\n        → @deepseek-ai/dsh-client-ui-layout（应用网格骨架）\n     语义钩子（跨版本更稳）：html[data-platform]、html[data-windows-titlebar]、\n        [data-windows-titlebar] 前缀、.dshDesktop 相关由 preload 写入的属性。\n   维护方式：升级 DSH 后若外壳底板变白，只需在下面“版本适配层”里更新哈希前缀。\n   ============================================================================= */\n\n/* ---------------------------------------------------------------------------\n   1. 底板全透明：web 模式与 Desktop 模式一致\n   ------------------------------------------------------------------------- */\nhtml,\nbody,\n#root {\n  background: transparent !important;\n}\n\n/* 0.2.x 的 boot 内联样式会给 body 写 background-color，\n   这里必须用 !important 覆盖，否则整屏 canvas 被白底遮住。 */\nbody {\n  background-color: transparent !important;\n  /* 玻璃色（亮/暗）——侧边栏、次级面板共用 */\n  --dsh-aqua-sidebar-light: rgba(246, 248, 252, 0.40);\n  --dsh-aqua-sidebar-dark: rgba(28, 31, 39, 0.42);\n  --dsh-aqua-pane-light: rgba(250, 251, 255, 0.42);\n  --dsh-aqua-pane-dark: rgba(18, 21, 28, 0.42);\n  --dsh-aqua-sidebar: var(--dsh-aqua-sidebar-light);\n  --dsh-aqua-pane: var(--dsh-aqua-pane-light);\n}\n\nbody[data-ds-dark-theme] {\n  --dsh-aqua-sidebar: var(--dsh-aqua-sidebar-dark);\n  --dsh-aqua-pane: var(--dsh-aqua-pane-dark);\n}\n\n/* ---------------------------------------------------------------------------\n   2. 应用骨架（@deepseek-ai/dsh-client-ui-layout）\n      原始规则：.BynINW_frame{background:var(--dsw-alias-bg-base)}\n                [data-windows-titlebar] .BynINW_frame{background:var(--dsw-specific-sidebar-fill)}\n                .BynINW_centerCol{background:var(--dsw-alias-bg-base)}\n   ------------------------------------------------------------------------- */\n.BynINW_frame,\n[data-windows-titlebar] .BynINW_frame,\n[data-platform=\"darwin\"] .BynINW_frame {\n  background: transparent !important;\n}\n\n.BynINW_centerCol,\n[data-windows-titlebar] .BynINW_centerCol,\n[data-platform=\"darwin\"] .BynINW_centerCol {\n  background: transparent !important;\n}\n\n.BynINW_sidebarCol,\n[data-platform=\"darwin\"] .BynINW_sidebarCol,\n[data-platform=\"darwin\"] [data-ds-dark-theme] .BynINW_sidebarCol {\n  background: var(--dsh-aqua-sidebar) !important;\n  backdrop-filter: none;\n  -webkit-backdrop-filter: none;\n}\n\n/* Opaque host base plus a local water canvas keeps the sidebar legible even\n   when Windows disables desktop transparency. The isolated negative layer\n   paints above the host background but below every existing child. */\n[class*=\"_sidebarCol\"][data-dsh-sidebar-water-host] {\n  position: relative;\n  isolation: isolate;\n}\n[class*=\"_sidebarCol\"][data-dsh-sidebar-water-host] > canvas[data-dsh-sidebar-water] {\n  position: absolute;\n  inset: 0;\n  z-index: -1;\n  display: block;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n}\n\n.BynINW_rightbarCol,\n[data-platform=\"darwin\"] .BynINW_rightbarCol {\n  background: var(--dsh-aqua-pane) !important;\n  backdrop-filter: none;\n  -webkit-backdrop-filter: none;\n}\n\n.BynINW_bottomRow {\n  background: var(--dsh-aqua-pane) !important;\n}\n\n/* Windows 隐藏标题栏：40px 拖拽带保持“窗口条”实色并继续可拖动；\n   水位从标题栏下沿开始，避免原生窗口按钮压在水面上产生色差。\n   原生标题栏按钮颜色由 preload 用 --dsw-specific-sidebar-fill 探测后同步，\n   所以这条带子只做轻微水色渐变，不整体改成透明。 */\n[data-windows-titlebar] .BynINW_frame:before {\n  background:\n    linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 60%, rgba(255, 255, 255, 0) 100%),\n    var(--dsw-specific-sidebar-fill) !important;\n  -webkit-app-region: drag;\n}\n\n/* Only the hidden native-caption color probe should be transparent; its text\n   color remains the value consumed by the preload/titlebar overlay. */\nhtml[data-windows-titlebar] body > span[style*=\"visibility: hidden\"][style*=\"pointer-events: none\"][style*=\"background-color: var(--dsw-specific-sidebar-fill)\"][style*=\"color: var(--dsw-alias-label-primary)\"] {\n  background-color: transparent !important;\n}\n\nhtml[data-windows-titlebar][data-fullscreen] .BynINW_frame {\n  padding-top: 0 !important;\n}\n\n/* ---------------------------------------------------------------------------\n   3. 会话视图底板（@deepseek-ai/dsh-client-ui-conversation）\n      原始规则：.Dc7zOa_root{background:var(--dsw-alias-bg-base)}\n   ------------------------------------------------------------------------- */\n.Dc7zOa_root {\n  background: transparent !important;\n}\n\n/* 会话滚动区/消息区保持透明，让水色透出；具体卡片仍用自己的 token 底色。 */\n.Dc7zOa_header,\n.Dc7zOa_titleRow {\n  background: transparent !important;\n}\n\n/* ---------------------------------------------------------------------------\n   4. Window 拖拽语义（DSH 0.2.x 统一约定）\n      html[data-platform] / [data-window-drag] 由 Web 前端与 preload 维护；\n      这里只保证主题不会破坏拖拽区的点击穿透。\n   ------------------------------------------------------------------------- */\nhtml[data-platform=\"darwin\"] [data-window-drag],\nhtml[data-windows-titlebar] .BynINW_frame:before {\n  -webkit-app-region: drag;\n}\n\n/* 侧边栏/会话区内部的交互元素永远不参与窗口拖拽 */\n.BynINW_sidebarCol button,\n.BynINW_sidebarCol input,\n.BynINW_centerCol button,\n.BynINW_centerCol input,\n.Dc7zOa_root button,\n.Dc7zOa_root input {\n  -webkit-app-region: no-drag;\n}\n\n/* ---------------------------------------------------------------------------\n   5. 无障碍：用户要求减少透明/动效时不叠玻璃\n   ------------------------------------------------------------------------- */\n@media (prefers-reduced-transparency: reduce) {\n  .BynINW_sidebarCol {\n    /* Accessibility fallback: reduced transparency must stay OPAQUE, so revert\n       to the solid host sidebar fill instead of the translucent glass colour. */\n    background: var(--dsw-specific-sidebar-fill) !important;\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n  }\n  .BynINW_rightbarCol {\n    background: var(--dsw-specific-sidebar-fill) !important;\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n  }\n}\n";
    var REGIONS_CSS = "/* =============================================================================\r\n   regions.css — per-region macOS skin for DSH 0.2.1-rc.2\r\n   -----------------------------------------------------------------------------\r\n   Port of dsh-whale-aqua-theme (DSH 0.1.x) src/apple-style.css lines 119-250\r\n   + the adapter needed for 0.2.1's renamed CSS modules.\r\n\r\n   MERGE TARGET : src/regions.css   (inject order whale-icon -> tokens ->\r\n                  shell -> regions, so this file wins over tokens/shell where a\r\n                  real selector matches)\r\n   Source of truth for selectors:\r\n     - reports/map.json (task-1: 96 old classes -> 0.2.1 classes + semantic hooks)\r\n     - .scratch-asar/css-fmt/<pkg>__lib__client.js.css (0.2.1 CSS modules)\r\n     - .scratch-asar/extracted/.../dsh-web-frontend/dist/assets/index-*.css\r\n       (shared UI kit, family-B `_x_hash` modules)\r\n     body - runtime DOM: .scratch-verify/logs/run1/{dom-tree.txt,markup-composer.html},\r\n       discover2-settings-rows.json + conversation/trajectory/settings JSX in the\r\n       0.2.1 bundles (for data-* hooks).\r\n\r\n   INTEGRATION RULES (Lead):\r\n     - shell.css OWNS html/body/#root/.BynINW_* / .Dc7zOa_root backgrounds (aquarium\r\n       transparency, !important). This file does NOT set backgrounds on those.\r\n     - The one inner \"opaque plate\" that must be cleared is the sidebar inner\r\n       root (._2H3hWW_root) — see §1. Any other plate exception is marked\r\n       \"PLATE EXCEPTION\" so it can be reviewed.\r\n     - Colours come from tokens.css; radii here are only where the old screenshots\r\n       differ from the 0.2.1 design-system default.\r\n\r\n   ============================ 0.2.1 SELECTOR ADAPTER =========================\r\n   HASH GROUPS (owning package -> local prefixes used below). Future upgrades:\r\n   only touch this mapping table, not the rules.\r\n     @deepseek-ai/dsh-client-ui-conversation : Dc7zOa_*  ConversationRoot\r\n                                               RlGAzG_*  InputBar/composer\r\n                                               _2WTFBq_* ContextMeter\r\n                                               Hqq-bq_*  HeroShell\r\n     @deepseek-ai/dsh-client-ui-chat         : cJsG2q_*  MessageItem (bubble)\r\n                                               v5IAXa_*  AssistantMarkdown\r\n                                               xz4KEq_*  ChatView (scroll/root)\r\n                                               _3GBCTG_* ReasoningRow (think)\r\n     @deepseek-ai/dsh-client-ui-trajectory   : haSm5q_*  TrajectoryTable\r\n     @deepseek-ai/dsh-client-ui-settings-general  : wCInkW_* SettingsRoot\r\n     @deepseek-ai/dsh-client-ui-settings-account  : _8RVnMG_* , KrzJGG_*\r\n     @deepseek-ai/dsh-client-ui-settings-models   : _3nPmjq_*\r\n     @deepseek-ai/dsh-client-ui-theme             : v01cdW_* AppearanceRow\r\n     @deepseek-ai/dsh-client-ui-sidebar           : _2H3hWW_* SidebarRoot\r\n     @deepseek-ai/dsh-client-ui-workspace         : hIlkoa_* Rows,\r\n                                                    _9lTDKa_* WorkspaceBrowser\r\n     @deepseek-ai/dsh-client-ui-directory-picker-browse : Fv-y6W_*\r\n     @deepseek-ai/dsh-client-ui-tool              : pFy1Ka_* ToolRow\r\n     @deepseek-ai/dsh-client-ui-cordis            : _3jVEXG_* CordisRunRow\r\n     settings per-tab select triggers (settings rows):\r\n       dsh-client-locale Hefa_q_selector, dsh-client-ui-permission-presets\r\n       body _3HsggG_selector, dsh-client-ui-chat XZcbxG_selector,\r\n       dsh-client-ui-conversation mP3ANa_selector\r\n     dsh-web-frontend shared UI kit (index-*.css):\r\n       body _button_1rv3m_*, _list_4ub78_*, _submenu_4ub78_*, _item_4ub78_*,\r\n       body _denseList_4ub78_*, _check_4ub78_*, _root_4ub78_*, _surface_ri079_*,\r\n       body _dialog_o6lrb_*, _confirmation_cjd8z_*, _toast_l6cvn_*,\r\n       body _bubble_12mhf_* (tooltip), _pill_1bqmh_*, _card_38jqx_* (hovercard),\r\n       _backdrop_19zw2_*, _close_19zw2_*, _markdown_1ypvv_* (markdown typography)\r\n\r\n   Semantic hooks used (verified in 0.2.1 bundles/runtime):\r\n     [data-composer-card] [data-composer-input] [data-composer-seat]\r\n     [data-conversation-tabs] [role=tab] [aria-selected]\r\n     [data-conversation-region] [data-conversation-scroll]\r\n     [role=treeitem][data-row-key^=session|search:] [aria-selected=true]\r\n     [data-variant=think][data-state=running] [data-chat-flow-kind]\r\n     [data-selected=true] [data-kind=...] [data-collapsed-summary] [data-role-kind]\r\n     nav button[aria-current=true]\r\n   ========================================================================== */\r\n\r\n/* ============================================================================\r\n   §1. SIDEBAR  (_2H3hWW_*  — @deepseek-ai/dsh-client-ui-sidebar)\r\n   Old: .hHd-Xa_root / .hHd-Xa_newSession / .qDHVXG_sectionLabel\r\n   ========================================================================== */\r\n\r\n/* PLATE EXCEPTION (approved by Lead): shell.css makes .BynINW_sidebarCol glass,\r\n   but the sidebar inner root re-paints the opaque --dsw-specific-sidebar-fill.\r\n   Clear it so the aquarium glass shows through. The 40px Windows drag band in\r\n   shell.css keeps its solid fill, so the native caption probe is unaffected. */\r\nbody ._2H3hWW_root {\r\n  background: transparent !important;\r\n}\r\n\r\n/* Old 0.1.x macOS: filled blue \"new session\" button (0.2.1 defaults to a white\r\n   elevated button). Not applied in collapsed rail mode (old rule had :not). */\r\nbody ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession {\r\n  background: linear-gradient(180deg, #3579bd 0%, #2e6db0 100%);\r\n  border-color: transparent;\r\n  color: #FFFFFF;\r\n  border-radius: 12px;\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.30), 0 2px 5px rgba(37, 82, 137, 0.16);\r\n}\r\nbody ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession:hover {\r\n  background: linear-gradient(180deg, #3b7fc8 0%, #2e6eaf 100%);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.26), 0 2px 6px rgba(37, 82, 137, 0.20);\r\n}\r\nbody ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession:focus-visible {\r\n  outline: 2px solid #80afe6;\r\n  outline-offset: 2px;\r\n}\r\nbody ._2H3hWW_newSession ._2H3hWW_newSessionShortcut,\r\nbody ._2H3hWW_newSession ._2H3hWW_newSessionShortcut * {\r\n  color: rgba(255, 255, 255, 0.96) !important;\r\n}\r\nbody ._2H3hWW_newSession ._2H3hWW_newSessionShortcut {\r\n  padding: 1px 5px;\r\n  border: 1px solid rgba(255, 255, 255, 0.32);\r\n  border-radius: 6px;\r\n  background: rgba(20, 48, 82, 0.20);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.14);\r\n}\r\nbody[data-ds-dark-theme] ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession {\r\n  background: linear-gradient(180deg, #4679aa 0%, #365f89 100%);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.18), 0 2px 5px rgba(0, 0, 0, 0.20);\r\n}\r\nbody[data-ds-dark-theme] ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession:hover {\r\n  background: linear-gradient(180deg, #3f709f 0%, #315579 100%);\r\n}\r\n\r\n/* Workspace/session list section label: 11px semibold (Finder style).\r\n   Old .qDHVXG_sectionLabel -> ._9lTDKa_sectionLabel (@deepseek-ai/dsh-client-ui-workspace). */\r\nbody ._9lTDKa_sectionLabel {\r\n  font-size: 11px;\r\n  font-weight: 600;\r\n}\r\n\r\n/* ============================================================================\r\n   §2. SESSION ROWS / WORKSPACE TREE\r\n   body Old: .YDXeBa_sessionRow / _selected / _time / _meta / _slot,\r\n        body .YDXeBa_searchResultRow / _searchResultSnippet / _searchResultWorkspace,\r\n        .YDXeBa_selected, ._matrix_10orb_4, ._dot_10orb_3\r\n   New: @deepseek-ai/dsh-client-ui-workspace/Rows  hIlkoa_*\r\n   Semantic: [role=treeitem][data-row-key^=\"session:\"|\"search:\"][aria-selected=true]\r\n   (runtime: run1 sessionRows = \"hIlkoa_sessionRow hIlkoa_selected\")\r\n   ========================================================================== */\r\n\r\n/* Finder-style solid blue selected row (light #0A60FF per old 0.1.x; dark #0A84FF). */\r\nbody [role=\"treeitem\"][data-row-key^=\"session:\"][aria-selected=\"true\"],\r\nbody [role=\"treeitem\"][data-row-key^=\"search:\"][aria-selected=\"true\"],\r\nbody .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  background: #0A60FF;\r\n  color: #FFFFFF;\r\n}\r\nbody[data-ds-dark-theme] [role=\"treeitem\"][data-row-key^=\"session:\"][aria-selected=\"true\"],\r\nbody[data-ds-dark-theme] [role=\"treeitem\"][data-row-key^=\"search:\"][aria-selected=\"true\"],\r\nbody[data-ds-dark-theme] .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody[data-ds-dark-theme] .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  background: #0A84FF;\r\n}\r\n\r\n/* Secondary text on the blue selection: white at 78% (old rule). */\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_time,\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_meta,\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_slot,\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_searchResultSnippet,\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_searchResultWorkspace {\r\n  color: rgba(255, 255, 255, 0.78);\r\n}\r\n\r\n/* Running-indicator dot turns white on the blue selection.\r\n   Old ._matrix_10orb_4 (missing in 0.2.1, map.json) / ._dot_10orb_3\r\n   -> the 0.2.1 equivalent is .hIlkoa_dot (workspace/Rows). */\r\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_dot {\r\n  color: #FFFFFF;\r\n}\r\n\r\n/* ============================================================================\r\n   §3. CONVERSATION HEADER + VIEW TABS\r\n   Old: .wSkVaW_header / .wSkVaW_tabs / .wSkVaW_tab / .wSkVaW_tabActive\r\n   New: @deepseek-ai/dsh-client-ui-conversation/ConversationRoot Dc7zOa_*\r\n        semantic: [data-conversation-tabs][role=tablist] > button[role=tab][aria-selected]\r\n   0.2.1 defaults to underline tabs; the old skin used an iOS segmented pill.\r\n   ========================================================================== */\r\n\r\n/* Remove the legacy header divider (old rule). */\r\nbody .Dc7zOa_header {\r\n  border-bottom-color: transparent;\r\n}\r\n\r\n/* iOS-style segmented control container. */\r\nbody [data-conversation-tabs] {\r\n  gap: 0;\r\n  margin-top: 8px;\r\n  padding: 3px;\r\n  width: fit-content;\r\n  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, 0.04));\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: 999px;\r\n}\r\n\r\n/* Segment label. */\r\nbody [data-conversation-tabs] button[role=\"tab\"] {\r\n  color: var(--dsw-alias-label-primary);\r\n  padding: 5px 18px;\r\n  border-radius: 999px;\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n  line-height: 20px;\r\n  transition:\r\n    background-color 0.2s var(--ds-ease-in-out),\r\n    color 0.2s var(--ds-ease-in-out);\r\n}\r\nbody [data-conversation-tabs] button[role=\"tab\"]:hover {\r\n  background: var(--dsw-alias-interactive-bg-hover);\r\n}\r\n\r\n/* Selected segment: filled Apple blue + white label (old active pill). */\r\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\r\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover {\r\n  background: var(--dsw-alias-button-info-fill, #007AFF);\r\n  color: #FFFFFF;\r\n}\r\n\r\n/* Remove the 0.2.1 underline (old rule killed wSkVaW_tab:after). */\r\nbody .Dc7zOa_header:after,\r\nbody [data-conversation-tabs] button[role=\"tab\"]:after {\r\n  display: none;\r\n}\r\n\r\n/* ============================================================================\r\n   §4. CONVERSATION SURFACES — frosted glass over the aquarium\r\n   Old: .fV0t5q_root (bg layer-1 — DROPPED, would re-opaque shell areas) and\r\n        .Md3f7G_scroll (frosted backdrop).\r\n   reports/selector-map.md §3.16: old scroll maps to .xz4KEq_scroll (inner) OR\r\n   .Dc7zOa_scrollBody (outer); the outer scrollport is what visually reads as\r\n   \"the conversation surface\", so the frost goes on the semantic\r\n   [data-conversation-scroll] host. It is scoped to an open session\r\n   ([data-conversation-session] on the conversation body) so the empty-state\r\n   hero keeps the full aquarium visible.\r\n   PLATE EXCEPTION (report to Lead): .Dc7zOa_composerSeat keeps 0.2.1's sticky\r\n   gradient painted with --dsw-alias-bg-base (#FFFFFF); the optional de-seam\r\n   override is documented in NOTES.md §4 and is NOT shipped until verified.\r\n   ---------------------------------------------------------------------------\r\n   2026-10-18 v2.1: the previous rgba(255,255,255,.72) + blur(18px) frost was\r\n   too opaque — the aquarium was invisible in the message area (the exact\r\n   regression the author reported). The conversation surface is now a light\r\n   WATER VEIL so the canvas (water gradient + bubbles + whale) reads through,\r\n   while assistant text keeps contrast on the pale water.\r\n   ========================================================================== */\r\nbody [data-conversation-session] [data-conversation-scroll] {\r\n  background: linear-gradient(\r\n    180deg,\r\n    rgba(255, 255, 255, 0.12) 0%,\r\n    rgba(255, 255, 255, 0.26) 38%,\r\n    rgba(238, 245, 255, 0.20) 100%\r\n  );\r\n  -webkit-backdrop-filter: none;\r\n  backdrop-filter: none;\r\n}\r\nbody[data-ds-dark-theme] [data-conversation-session] [data-conversation-scroll] {\r\n  background: linear-gradient(\r\n    180deg,\r\n    rgba(8, 10, 16, 0.26) 0%,\r\n    rgba(10, 12, 19, 0.38) 45%,\r\n    rgba(12, 15, 22, 0.30) 100%\r\n  );\r\n}\r\n\r\n/* ============================================================================\r\n   §5. iMESSAGE-STYLE USER BUBBLE\r\n   Old: .gdEzaW_bubble (+ ._markdown_1nba0_5 and compaction children)\r\n   New: @deepseek-ai/dsh-client-ui-chat/MessageItem  .cJsG2q_bubble\r\n        (no stable attribute — inside [data-conversation-region=\"chat\"])\r\n        bubble markdown: shared UI kit ._markdown_1ypvv_5\r\n   ========================================================================== */\r\nbody .cJsG2q_bubble {\r\n  background: var(--dsw-alias-button-info-fill, #007AFF);\r\n  color: #FFFFFF;\r\n  border-radius: 18px; /* old 18px; radius-xl token is also 18 — explicit for the old rule */\r\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.10);\r\n}\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5 {\r\n  color: #FFFFFF;\r\n}\r\nbody .cJsG2q_bubble a,\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5 a {\r\n  color: #FFFFFF;\r\n  text-decoration: underline;\r\n  text-underline-offset: 2px;\r\n}\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5 :not(pre) > code {\r\n  background-color: rgba(255, 255, 255, 0.24);\r\n  color: #FFFFFF;\r\n}\r\nbody .cJsG2q_bubble .cJsG2q_compactionTitle,\r\nbody .cJsG2q_bubble .cJsG2q_compactionSummary,\r\nbody .cJsG2q_bubble .cJsG2q_compactionBody,\r\nbody .cJsG2q_bubble .cJsG2q_compactionLeading {\r\n  color: rgba(255, 255, 255, 0.82);\r\n}\r\nbody .cJsG2q_bubble .cJsG2q_compactionSep {\r\n  background: rgba(255, 255, 255, 0.6);\r\n}\r\n\r\n/* ============================================================================\r\n   §6. ASSISTANT WHALE AVATAR\r\n   Old: .Sxvs8a_root (padding-left 36px + 20x14.7px whale mask at top-left)\r\n   map.json: Sxvs8a_root = ambiguous, recommended .v5IAXa_root\r\n   (@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown) — one root per assistant\r\n   answer. The whale SVG path is the same data URI as 0.1.x (no external asset).\r\n   TODO(verify): old avatar was attached to the assistant *row*; 0.2.1 renders\r\n   reasoning in a separate node, so the avatar currently starts at the answer\r\n   markdown block. Compare against reference screenshots on the bench.\r\n   ========================================================================== */\r\nbody .v5IAXa_root {\r\n  position: relative;\r\n  padding-left: 36px;\r\n}\r\nbody .v5IAXa_root::before {\r\n  content: \"\";\r\n  position: absolute;\r\n  left: 0;\r\n  top: 5px;\r\n  width: 20px;\r\n  height: 14.7px;\r\n  background: var(--dsw-alias-state-business-primary, #007AFF);\r\n  -webkit-mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\r\n  mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\r\n}\r\n\r\n/* ============================================================================\r\n   §7. THINK CARD (semantic, selector unchanged from 0.1.x)\r\n   Old: [data-variant=\"think\"] / [data-state=\"running\"]\r\n   0.2.1: ReasoningRow root div carries data-variant=\"think\" data-state=running|ok\r\n          (dsh-client-ui-chat JSX + _3GBCTG_root styles)\r\n   ========================================================================== */\r\nbody [data-variant=\"think\"] {\r\n  background: var(--dsw-alias-bg-layer-2);\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n  border-left: 3px solid var(--dsw-alias-state-business-primary, #007AFF);\r\n  border-radius: 10px;\r\n  padding: 8px 14px;\r\n  margin: 4px 0 0;\r\n}\r\nbody [data-variant=\"think\"][data-state=\"running\"] {\r\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 5%, var(--dsw-alias-bg-layer-2));\r\n  box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 25%, transparent);\r\n}\r\n\r\n/* ============================================================================\r\n   §8. TRAJECTORY  (@deepseek-ai/dsh-client-ui-trajectory  haSm5q_*)\r\n   Old: .Y0dWHa_kindTag / .Y0dWHa_table tr[data-selected=true] /\r\n        .Y0dWHa_detailTabs / _detailTab / _detailTabActive /\r\n        tr[data-collapsed-summary] td\r\n   Dropped (see NOTES.md): old per-event card + timeline-dot rules\r\n   body (Y0dWHa_table border-spacing, td.Y0dWHa_event cards, ::before dots,\r\n   Y0dWHa_turnRail display:none) — 0.2.1 redesigned the trajectory with its own\r\n   turn/selection rails and the reference screenshot intent is \"boxed coloured\r\n   badges + blue selected row\", which is what we port here.\r\n   ========================================================================== */\r\n\r\n/* Boxed, coloured kind badge (0.2.1 per-kind colour classes set currentColor). */\r\nbody .haSm5q_kindTag {\r\n  border-radius: 5px;\r\n  border: 1.5px solid currentColor;\r\n  background: color-mix(in srgb, currentColor 16%, transparent);\r\n  height: 20px;\r\n  font-size: 11px;\r\n  font-weight: 700;\r\n}\r\n\r\n/* Keep the trajectory canvas transparent so the existing aquarium remains visible. */\r\nbody .hGyLPq_root,\nbody .haSm5q_split,\nbody .haSm5q_tablePane,\nbody .haSm5q_table {\n  background: transparent !important;\n}\nbody .QnvEwG_root,\nbody .ZNyiNW_plot {\n  background: rgba(250, 251, 255, 0.86) !important;\n}\nbody[data-ds-dark-theme] .QnvEwG_root,\nbody[data-ds-dark-theme] .ZNyiNW_plot {\n  background: rgba(29, 33, 41, 0.9) !important;\n}\nbody .haSm5q_table th {\r\n  background: rgba(250, 251, 255, 0.86) !important;\r\n}\r\nbody .haSm5q_table tbody tr[data-collapsed-summary] td {\r\n  background: rgba(245, 247, 251, 0.28) !important;\r\n}\r\nbody .haSm5q_historyLoadingBar,\r\nbody .haSm5q_historyLoadButton {\r\n  background: rgba(250, 251, 255, 0.84) !important;\r\n}\r\nbody[data-ds-dark-theme] .haSm5q_table th {\r\n  background: rgba(29, 33, 41, 0.9) !important;\r\n}\r\nbody[data-ds-dark-theme] .haSm5q_table tbody tr[data-collapsed-summary] td {\r\n  background: rgba(22, 26, 34, 0.38) !important;\r\n}\r\nbody[data-ds-dark-theme] .haSm5q_historyLoadingBar,\r\nbody[data-ds-dark-theme] .haSm5q_historyLoadButton {\r\n  background: rgba(29, 33, 41, 0.9) !important;\r\n}\r\n\r\n/* Blue selected row (0.2.1 base uses interactive-bg-active). */\r\nbody .haSm5q_table tbody tr[data-selected=\"true\"] {\r\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 10%, transparent);\r\n}\r\n\r\n/* iOS-style pill detail tabs (old rule; 0.2.1 base has underline tabs). */\nbody .haSm5q_detailTabs {\r\n  gap: 4px;\r\n  padding: 4px 8px;\r\n  height: 38px;\r\n  align-items: center;\r\n}\r\nbody .haSm5q_detailTab {\r\n  border-radius: 999px;\r\n  padding: 3px 12px;\r\n  line-height: 18px;\r\n}\r\nbody .haSm5q_detailTabActive,\r\nbody .haSm5q_detailTabActive:hover {\r\n  background: var(--dsw-alias-button-info-fill, #007AFF);\r\n  color: #FFFFFF;\r\n}\r\nbody .haSm5q_detailTabActive:after {\r\n  display: none;\r\n}\r\n\r\n/* ============================================================================\r\n   body §9. SETTINGS  (@deepseek-ai/dsh-client-ui-settings-general wCInkW_*,\r\n                  body settings-account _8RVnMG_* and KrzJGG_*, settings-models _3nPmjq_*,\r\n                  theme v01cdW_*)\r\n   Old: .VOzbGW_* / ._WvWnq_section / .ydkMvW_section / .zGbnIq_* /\r\n        ._8HJdBW_themeCube / ._card_1b2ny_13\r\n   ========================================================================== */\r\n\r\n/* ---- 9.1 nav rail ------------------------------------------------------- */\r\n/* Old macOS System-Settings rail: 220px, 17px semibold title, squircle icons. */\r\nbody .wCInkW_nav {\r\n  width: 220px;\r\n}\r\nbody .wCInkW_navTitle {\r\n  font-size: 17px;\r\n  font-weight: 600;\r\n}\r\nbody .wCInkW_navCell {\n  box-sizing: border-box;\n  height: 38px;\n  padding: 7px 10px;\n  border-radius: 8px;\n}\r\nbody .wCInkW_navCell.wCInkW_active,\r\nbody .wCInkW_navCell[aria-current=\"true\"] {\r\n  border-radius: 8px;\r\n  background: #2864d9;\r\n  color: #fff;\r\n  box-shadow: none;\r\n}\r\n/* Native nav order: account, general, models, plugins, agents. */\r\nbody .wCInkW_navIcon {\r\n  display: block;\r\n  width: 24px;\r\n  height: 24px;\r\n  padding: 4px;\r\n  box-sizing: border-box;\r\n  border-radius: 6px;\r\n  background: #8e8e93;\r\n  color: #fff;\r\n  box-shadow: none;\r\n}\r\n/* Phosphor Icons, MIT License, Copyright (c) 2023 Phosphor Icons.\r\n   Permission is hereby granted, free of charge, to any person obtaining a copy\r\n   of this software and associated documentation files (the \"Software\"), to deal\r\n   in the Software without restriction, including without limitation the rights\r\n   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\r\n   copies of the Software, and to permit persons to whom the Software is\r\n   furnished to do so, subject to the following conditions:\r\n   The above copyright notice and this permission notice shall be included in all\r\n   copies or substantial portions of the Software.\r\n   THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\r\n   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\n   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\r\n   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\n   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\n   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\r\n   SOFTWARE. SVG source commit: 2b75f3ad12b420c9504ef05df8d2564a28f8500e. */\r\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(-n+5) .wCInkW_navIcon {\n  background-repeat: no-repeat;\n  background-position: center;\n  background-size: 100% 100%;\n  border: 1px solid rgba(255, 255, 255, 0.22);\n}\n/* Category accent chips. The DSH host inserts its own per-tab glyphs and their\n   order can change (an account row may or may not be present), so the glyph is\n   always the host's own: only the chip colour follows the position. This keeps\n   every tab labelled with the right icon after any re-ordering. */\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(1) .wCInkW_navIcon { background-color: #8e8e93; }\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(2) .wCInkW_navIcon { background-color: #8e8e93; }\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(3) .wCInkW_navIcon { background-color: #3281f6; }\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(4) .wCInkW_navIcon { background-color: #e68b2d; }\nbody .wCInkW_navList > .wCInkW_navCell:nth-child(5) .wCInkW_navIcon { background-color: #8057c7; }\n\n/* Active row keeps the same chip; the filled blue pill already carries the\n   state, and the native glyph inherits the host's foreground colour. */\nbody .wCInkW_navList > .wCInkW_navCell.wCInkW_active .wCInkW_navIcon,\nbody .wCInkW_navList > .wCInkW_navCell[aria-current=\"true\"] .wCInkW_navIcon {\n  color: #FFFFFF;\n}\n\n/* ---- 9.2 panel shell ---------------------------------------------------- */\r\n/* Old settings dialog: 1000px wide, 16px radius (radius-panel token = 16). */\r\nbody .wCInkW_panel {\r\n  width: 920px;\r\n  border-radius: 26px;\r\n  background: #fff;\r\n  max-width: calc(100vw - 48px);\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_panel { background: #24262b; }\r\nbody .wCInkW_nav {\r\n  width: 220px;\r\n  margin: 8px;\r\n  padding: 22px 12px 10px;\r\n  border-radius: 20px;\r\n  background: rgba(244, 244, 246, 0.9);\r\n}\r\nbody .wCInkW_trigger {\r\n  border-radius: 8px;\r\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 253, 0.94));\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.92), 0 1px 3px rgba(39, 61, 91, 0.08);\r\n}\r\nbody .wCInkW_trigger:hover {\r\n  background: linear-gradient(180deg, #fff, #f1f5fb);\r\n}\r\nbody .wCInkW_trigger:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.58);\r\n  outline-offset: 1px;\r\n}\r\n\r\n/* Popup-select trigger inside settings rows: old macOS bordered white menu\r\n   button. 0.2.1's per-tab selectors are grey pills (bg-module-platform, no\r\n   border) owned by different packages (runtime classes confirmed in\r\n   discover2-settings-rows.json):\r\n     .Hefa_q_selector     dsh-client-locale (language)\r\n     ._3HsggG_selector    dsh-client-ui-permission-presets (access mode)\r\n     .XZcbxG_selector     dsh-client-ui-chat (workspace steps / perf details)\r\n     .mP3ANa_selector     dsh-client-ui-conversation (busy-send behaviour)\r\n   Only surface/border are restyled — base size/contents stay so no chevron\r\n   clipping. 0.2.1 has no wrapper class on these popup selects (_root_4ub78_1 is\r\n   the generic menu anchor), so the selectors are matched directly. */\r\nbody .wCInkW_panel .Hefa_q_selector,\r\nbody .wCInkW_panel ._3HsggG_selector,\r\nbody .wCInkW_panel .XZcbxG_selector,\nbody .wCInkW_panel .mP3ANa_selector {\n  border: 1px solid #d9dde3;\n  background: #f7f8fa;\n  border-radius: 999px;\n  box-shadow: none;\r\n}\r\nbody .wCInkW_panel .Hefa_q_selector:hover,\r\nbody .wCInkW_panel ._3HsggG_selector:hover,\r\nbody .wCInkW_panel .XZcbxG_selector:hover,\r\nbody .wCInkW_panel .mP3ANa_selector:hover {\r\n  background: #f7f8fa;\r\n}\r\nbody .wCInkW_panel .Hefa_q_selector:focus-visible,\r\nbody .wCInkW_panel ._3HsggG_selector:focus-visible,\r\nbody .wCInkW_panel .XZcbxG_selector:focus-visible,\r\nbody .wCInkW_panel .mP3ANa_selector:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.58);\r\n  outline-offset: 1px;\r\n}\r\n/* LanguageRow's trigger is independently styled inside the settings panel. */\r\nbody .wCInkW_panel .Hefa_q_selector[aria-expanded=\"true\"],\r\nbody .wCInkW_panel ._3HsggG_selector[aria-expanded=\"true\"],\r\nbody .wCInkW_panel .XZcbxG_selector[aria-expanded=\"true\"],\r\nbody .wCInkW_panel .mP3ANa_selector[aria-expanded=\"true\"] {\r\n  border-color: #aebed0;\r\n  background: #f1f5fa;\r\n  box-shadow: none;\r\n}\r\nbody .Hefa_q_selector:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.58);\r\n  outline-offset: 1px;\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_navCell.wCInkW_active,\r\nbody[data-ds-dark-theme] .wCInkW_navCell[aria-current=\"true\"] {\r\n  background: #2864d9;\r\n  color: #fff;\r\n  box-shadow: none;\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_nav {\r\n  background: rgba(45, 47, 52, 0.92);\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_panel .Hefa_q_selector,\r\nbody[data-ds-dark-theme] .wCInkW_panel ._3HsggG_selector,\r\nbody[data-ds-dark-theme] .wCInkW_panel .XZcbxG_selector,\r\nbody[data-ds-dark-theme] .wCInkW_panel .mP3ANa_selector {\r\n  background: #30343a;\r\n  border-color: #4b525c;\r\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_panel .Hefa_q_selector:hover,\r\nbody[data-ds-dark-theme] .wCInkW_panel ._3HsggG_selector:hover,\r\nbody[data-ds-dark-theme] .wCInkW_panel .XZcbxG_selector:hover,\r\nbody[data-ds-dark-theme] .wCInkW_panel .mP3ANa_selector:hover {\r\n  background: #393e45;\r\n}\r\nbody[data-ds-dark-theme] .wCInkW_panel .Hefa_q_selector[aria-expanded=\"true\"],\r\nbody[data-ds-dark-theme] .wCInkW_panel ._3HsggG_selector[aria-expanded=\"true\"],\r\nbody[data-ds-dark-theme] .wCInkW_panel .XZcbxG_selector[aria-expanded=\"true\"],\r\nbody[data-ds-dark-theme] .wCInkW_panel .mP3ANa_selector[aria-expanded=\"true\"] {\r\n  border-color: #74869c;\r\n  background: #35404d;\r\n  box-shadow: none;\r\n}\r\n\r\n/* Grouped settings card (old ._WvWnq_section: layer-1 + hairline + 10px).\r\n   runtime-dom.md §9: 0.2.1 has no shared SettingsSection class — the old\r\n   _WvWnq_section/ydkMvW_section look must be applied to every per-tab section\r\n   module (account / general / models / plugin-inventory / plugins / subagent).\r\n   Final 0.1.x cascade was the card rule (it came after the divider rule), so\r\n   the card wins here too. */\r\nbody ._8RVnMG_section,\r\nbody ._3nPmjq_section,\r\nbody .RotMhW_section,\r\nbody .amjGKq_section,\r\nbody .pbObnW_section {\r\n  background: var(--dsw-alias-bg-layer-1);\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: 10px;\r\n  padding: 0 16px;\r\n  overflow: hidden;\r\n}\r\n\r\n/* General settings are grouped by their actual slot rows, not as one large card. */\r\nbody .zZnCHW_section {\r\n  background: transparent;\r\n  border: 0;\r\n  border-radius: 0;\r\n  padding: 0;\r\n  overflow: visible;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  min-width: 0;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > :not(.mY-j6a_row) {\r\n  box-sizing: border-box;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  padding-inline: 16px;\r\n  background: #f5f5f7;\r\n  border-bottom: 1px solid #e4e4e8;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > :first-child {\r\n  border-radius: 12px 12px 0 0;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > :last-child {\r\n  border-bottom: 0;\r\n  border-radius: 0 0 12px 12px;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > :has(+ .mY-j6a_row) {\r\n  border-bottom: 0;\r\n  border-radius: 0 0 12px 12px;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > .mY-j6a_row {\r\n  margin: 16px 16px 0;\r\n  padding-inline: 0;\r\n  background: transparent;\r\n  border: 0;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > .v01cdW_group {\r\n  box-sizing: border-box;\r\n  min-width: 0;\r\n  margin-block: 16px;\r\n  padding: 16px;\r\n  background: #f5f5f7;\r\n  border: 0;\r\n  border-radius: 12px;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > .o02QSW_group {\r\n  box-sizing: border-box;\r\n  min-width: 0;\r\n  padding: 16px;\r\n  background: #f5f5f7;\r\n  border: 0;\r\n  border-radius: 12px 12px 0 0;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > .o02QSW_group:last-child {\r\n  border-radius: 12px;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > :has(+ .v01cdW_group) {\r\n  border-bottom: 0;\r\n  border-radius: 0 0 12px 12px;\r\n}\r\nbody .zZnCHW_section > [data-slot=\"settings.general.item\"] > .v01cdW_group + * {\r\n  border-radius: 12px 12px 0 0;\r\n}\r\nbody[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > :not(.mY-j6a_row),\r\nbody[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > .v01cdW_group,\r\nbody[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > .o02QSW_group {\r\n  background: #292c31;\r\n  border-bottom-color: rgba(255, 255, 255, 0.08);\r\n}\r\nbody[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > .mY-j6a_row { background: transparent; }\r\n\r\n/* Account notice card (old ._card_1b2ny_13, owner guess AccountNotice ->\r\n   .KrzJGG_card; map.json's generic pick differs, semantic owner wins). */\r\nbody .KrzJGG_card {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* ---- 9.3 models tab cards/buttons (old zGbnIq_* rules) ------------------ */\r\nbody ._3nPmjq_primaryButton,\r\nbody ._3nPmjq_secondaryButton,\r\nbody ._3nPmjq_dangerButton {\r\n  border-radius: 10px;\r\n}\r\nbody ._3nPmjq_rowActions ._3nPmjq_secondaryButton,\r\nbody ._3nPmjq_rowActions ._3nPmjq_dangerButton {\r\n  border-radius: 8px;\r\n}\r\nbody ._3nPmjq_addButton,\r\nbody ._3nPmjq_addModelButton,\r\nbody ._3nPmjq_linkButton {\r\n  border-radius: 8px;\r\n}\r\nbody ._3nPmjq_rowCard,\r\nbody ._3nPmjq_editor,\r\nbody ._3nPmjq_addCard,\r\nbody ._3nPmjq_setupCard {\r\n  border-radius: 10px;\r\n}\r\nbody ._3nPmjq_modelEntry {\r\n  border-radius: 6px;\r\n}\r\n\r\n/* ---- 9.4 appearance theme cubes (old _8HJdBW_themeCube) ----------------- */\r\nbody .v01cdW_themeCube {\r\n  border-radius: 10px;\r\n  padding: 12px 24px;\r\n  background: #f5f5f7;\r\n  border-color: #d9d9de;\r\n  color: var(--dsw-alias-label-primary);\r\n  font-size: 13px;\r\n  line-height: 18px;\r\n}\r\nbody .v01cdW_themeCube.v01cdW_selected {\r\n  background: #f5f5f7;\r\n  border-color: #3478f6;\r\n  color: var(--dsw-alias-label-primary);\r\n  box-shadow: 0 0 0 1px #3478f6;\r\n}\r\nbody .v01cdW_themeCube svg {\r\n  color: #747b84;\r\n}\r\nbody .v01cdW_themeCube.v01cdW_selected svg {\r\n  color: #3478f6;\r\n}\r\nbody[data-ds-dark-theme] .v01cdW_themeCube {\r\n  background: #303238;\r\n  border-color: #4b4f57;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\nbody[data-ds-dark-theme] .v01cdW_themeCube.v01cdW_selected {\r\n  background: #303238;\r\n  border-color: #6ca3ff;\r\n  box-shadow: 0 0 0 1px #6ca3ff;\r\n}\r\nbody[data-ds-dark-theme] .v01cdW_themeCube svg { color: #b0b5bd; }\r\nbody[data-ds-dark-theme] .v01cdW_themeCube.v01cdW_selected svg { color: #6ca3ff; }\r\n\r\n/* ============================================================================\r\n   §10. COMPOSER  (@deepseek-ai/dsh-client-ui-conversation RlGAzG_*)\r\n   Old: [data-composer-card] radius, jelly glow (focus / running / sending)\r\n   body Semantic: [data-composer-card], [data-composer-input] contenteditable,\r\n             :has(rect) = send button shows the stop square (running)\r\n   ========================================================================== */\r\n\r\n/* 18px composer radius (old rule; token radius-panel renders 16 for dialogs). */\r\nbody [data-composer-card] {\r\n  border-radius: 18px;\r\n}\r\n\r\n/* Jelly glow ring (hidden until focus/running). */\r\nbody [data-composer-card]::after {\r\n  content: \"\";\r\n  position: absolute;\r\n  inset: -2px;\r\n  border-radius: inherit;\r\n  padding: 2px;\r\n  background: linear-gradient(\r\n    110deg,\r\n    rgba(0, 150, 255, 0) 15%,\r\n    rgba(0, 150, 255, 0.9) 38%,\r\n    rgba(0, 220, 255, 0.95) 50%,\r\n    rgba(0, 150, 255, 0.9) 62%,\r\n    rgba(0, 150, 255, 0) 85%\r\n  );\r\n  background-size: 250% 250%;\r\n  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);\r\n  -webkit-mask-composite: xor;\r\n  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);\r\n  mask-composite: exclude;\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  z-index: 1;\r\n}\r\n\r\n/* Focus: blue border + soft Apple focus halo.\r\n   0.1.x used textarea:focus; 0.2.1's editor is a contenteditable\r\n   [data-composer-input] div. */\r\nbody [data-composer-card]:has([data-composer-input]:focus) {\r\n  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 45%, transparent);\r\n  box-shadow:\r\n    var(--dsw-shadow-lv2),\r\n    0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 12%, transparent);\r\n}\r\n\r\n/* Running: breathing halo + flowing jelly ring (stop-square rect in the send\r\n   button is the 0.2.1 running marker — verified in bundle JSX, sent by Lead). */\r\nbody [data-composer-card]:has(rect) {\r\n  animation: dsh-jelly-breathe 2.6s ease-in-out infinite;\r\n}\r\nbody [data-composer-card]:has(rect)::after {\r\n  opacity: 1;\r\n  animation: dsh-jelly-flow 3.2s linear infinite;\r\n}\r\n\r\n/* Sending: white shimmer. 0.1.x keyed off textarea[data-phase=\"submitting\"];\r\n   0.2.1's editor is a contenteditable div. The pending state shows as the\r\n   `.RlGAzG_pending` 8px dot inside the card (`RlGAzG_input-pending` is only a\r\n   @keyframes name, not a class — do not use it as a selector). */\r\nbody [data-composer-card]:has(.RlGAzG_pending)::after {\r\n  opacity: 1;\r\n  background: linear-gradient(\r\n    110deg,\r\n    rgba(255, 255, 255, 0) 15%,\r\n    rgba(255, 255, 255, 0.95) 38%,\r\n    rgba(190, 235, 255, 1) 50%,\r\n    rgba(255, 255, 255, 0.95) 62%,\r\n    rgba(255, 255, 255, 0) 85%\r\n  );\r\n  background-size: 250% 250%;\r\n  animation: dsh-jelly-send 0.7s ease-in-out infinite;\r\n}\r\n\r\n@keyframes dsh-jelly-breathe {\r\n  0%, 100% {\r\n    box-shadow: 0 0 0 0 rgba(0, 160, 255, 0), var(--dsw-shadow-lv2);\r\n  }\r\n  50% {\r\n    box-shadow:\r\n      0 0 26px 3px rgba(0, 160, 255, 0.32),\r\n      0 0 64px 10px rgba(70, 190, 255, 0.16),\r\n      var(--dsw-shadow-lv2);\r\n  }\r\n}\r\n@keyframes dsh-jelly-flow {\r\n  0% {\r\n    background-position: 0% 50%;\r\n  }\r\n  100% {\r\n    background-position: 150% 50%;\r\n  }\r\n}\r\n@keyframes dsh-jelly-send {\r\n  0%, 100% {\r\n    background-position: 0% 50%;\r\n    opacity: 0.55;\r\n  }\r\n  50% {\r\n    background-position: 150% 50%;\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  body [data-composer-card]:has(rect),\r\n  body [data-composer-card]::after {\r\n    animation: none;\r\n  }\r\n  body [data-composer-card]:has(rect)::after {\r\n    opacity: 0.55;\r\n  }\r\n}\r\n\r\n/* ============================================================================\r\n   §11. SHARED UI KIT — menus / popovers / dialogs / toast / tooltip / pills\r\n        (dsh-web-frontend index-*.css, family-B modules; see adapter table)\r\n   body Old: ._list_19372_8/_submenu_19372_9, ._item_19372_91, ._check_19372_181,\r\n        body ._dialog_15u5s_22, ._confirmation_1nu42_1, ._toast_fvpz7_7,\r\n        body ._bubble_owhem_8, ._pill_e3ygd_1, ._button_kz6gm_4, ._sm_kz6gm_30,\r\n        body ._card_1b2ny_13, ._backdrop_18d3q_1, ._close_18d3q_30,\r\n        ._root_19372_1 (popup select), ._markdown_1nba0_5\r\n   body NOTE: dialog radius (old 16) is already covered by the radius-panel token,\r\n   button radius (10) by radius-md, sm button radius (8) by radius-sm. The menu\r\n   fill + blur are token-driven (--dsw-menu-surface-fill /\r\n   --dsw-menu-backdrop-filter in tokens.css).\r\n   ========================================================================== */\r\n\r\n/* Finder-style menu surface radius (0.2.1 surface = radius-lg 14 -> old 10).\r\n   TODO(verify): menu surface menu family is ._surface_ri079_1 (shell CSS). */\r\nbody ._surface_ri079_1 {\n  border-radius: 16px;\n  border: 1px solid rgba(0, 0, 0, 0.10);\r\n  background: #fdfdfd;\r\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);\r\n}\r\nbody[data-ds-dark-theme] ._surface_ri079_1 {\r\n  border-color: rgba(255, 255, 255, 0.12);\r\n  background: #30343a;\r\n  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32);\r\n}\r\nbody,\r\nbody[data-ds-dark-theme] { --dsw-menu-backdrop-filter: saturate(150%) blur(12px) !important; }\r\n@media (prefers-reduced-transparency: reduce) {\r\n  body .wCInkW_panel { background: #fff !important; }\r\n  body .wCInkW_nav { background: #f4f4f6 !important; }\r\n  body .zZnCHW_section > [data-slot=\"settings.general.item\"] > :is(._3HsggG_row, .Hefa_q_row, .XZcbxG_row, .mP3ANa_row, .PUqB7a_row, ._3Y3Nma_setting),\r\n  body .zZnCHW_section > [data-slot=\"settings.general.item\"] > .v01cdW_group,\r\n  body .zZnCHW_section > [data-slot=\"settings.general.item\"] > .o02QSW_group { background: #f5f5f7 !important; }\r\n  body[data-ds-dark-theme] .wCInkW_panel { background: #24262b !important; }\r\n  body[data-ds-dark-theme] .wCInkW_nav { background: #2d2f34 !important; }\r\n  body[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > :is(._3HsggG_row, .Hefa_q_row, .XZcbxG_row, .mP3ANa_row, .PUqB7a_row, ._3Y3Nma_setting),\r\n  body[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > .v01cdW_group,\r\n  body[data-ds-dark-theme] .zZnCHW_section > [data-slot=\"settings.general.item\"] > .o02QSW_group { background: #292c31 !important; }\r\n  body,\r\n  body[data-ds-dark-theme] { --dsw-menu-backdrop-filter: none !important; }\r\n}\r\n\r\n/* Menu rows keep host heights; add only gentle spacing, surface, and focus. */\r\nbody ._item_4ub78_90 {\n  padding-inline: 10px;\n  border-radius: 10px;\n}\r\nbody ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):hover:not(:disabled),\nbody ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):focus-visible:not(:disabled) {\n  background: #f0f2f5;\r\n}\r\nbody ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) {\n  border-radius: 10px;\n  color: #fff;\r\n  background: #2864d9;\r\n  box-shadow: none;\r\n}\r\nbody ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226) {\r\n  color: #fff;\r\n  background: #2864d9;\r\n  box-shadow: none;\r\n}\r\nbody ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) ._check_4ub78_179,\r\nbody ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226) ._check_4ub78_179 { color: #fff; }\r\nbody ._item_4ub78_90:is(._selected_4ub78_216, ._selectedFill_4ub78_221):not(._danger_4ub78_226):is(:hover, :focus-visible) {\n  background: #2864d9 !important;\n  color: #fff !important;\n}\nbody ._denseList_4ub78_124 ._item_4ub78_90 {\n  padding-inline: 10px;\n  border-radius: 9px;\n}\nbody[data-ds-dark-theme] ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):hover:not(:disabled),\nbody[data-ds-dark-theme] ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):focus-visible:not(:disabled) {\n  background: #3a3e44;\n}\nbody[data-ds-dark-theme] ._item_4ub78_90:is(._selected_4ub78_216, ._selectedFill_4ub78_221):not(._danger_4ub78_226):is(:hover, :focus-visible) {\n  background: #2864d9 !important;\n  color: #fff !important;\n}\nbody[data-ds-dark-theme] ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226) {\r\n  background: #2864d9;\r\n  color: #fff;\r\n  box-shadow: none;\r\n}\r\nbody[data-ds-dark-theme] ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) {\r\n  background: #2864d9;\r\n  color: #fff;\r\n  box-shadow: none;\r\n}\r\n/* Select checkmark: Apple blue (old rule). */\r\nbody ._check_4ub78_179 {\r\n  color: var(--dsw-alias-state-business-primary, #007AFF);\r\n}\r\n\r\n/* Dialog backdrop: old ._backdrop blurred the page behind a modal. */\r\nbody ._backdrop_19zw2_2 {\r\n  -webkit-backdrop-filter: var(--dsw-mask-blur);\r\n  backdrop-filter: var(--dsw-mask-blur);\r\n}\r\n/* Old round close button hover. */\r\nbody ._close_19zw2_37:hover {\r\n  background: var(--dsw-alias-interactive-bg-hover);\r\n}\r\nbody ._close_19zw2_37 {\r\n  border-radius: 9px;\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.64), 0 1px 3px rgba(34, 55, 84, 0.08);\r\n}\r\nbody ._close_19zw2_37:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.58);\r\n  outline-offset: 1px;\r\n}\r\nbody[data-ds-dark-theme] ._close_19zw2_37 {\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.09), 0 1px 3px rgba(0, 0, 0, 0.18);\r\n}\r\n\r\n/* Toast radius (old 10; 0.2.1 base radius-lg 14). */\r\nbody ._toast_l6cvn_6 {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* Tooltip bubble radius (old 6; 0.2.1 base radius-sm 8). */\r\nbody ._bubble_12mhf_1 {\r\n  border-radius: 6px;\r\n}\r\n\r\n/* Status pill radius (old 8; 0.2.1 base 999). */\r\nbody ._pill_1bqmh_1 {\r\n  border-radius: 8px;\r\n}\r\n\r\n/* Hovercard radius (old 10; 0.2.1 base radius-lg 14). */\r\nbody ._card_38jqx_9 {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* ============================================================================\r\n   §12. SMALL REGIONS\r\n   ========================================================================== */\r\n\r\n/* Context/meter bar (old nLMEza_bar radius 10; 0.2.1 999px pill). */\r\nbody ._2WTFBq_bar {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* Hero workspace trigger + directory modal input (old radius 10). */\r\nbody .Hqq-bq_workspace {\r\n  border-radius: 10px;\r\n}\r\nbody .Hqq-bq_modalInput {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* Tool io card (old o3BgMG_ioCard radius 10; 0.2.1 radius-lg 14). */\r\nbody .pFy1Ka_ioCard {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* Cordis run rows (old cvtE3a_business 10 / cvtE3a_message 6). */\r\nbody ._3jVEXG_business {\r\n  border-radius: 10px;\r\n}\r\nbody ._3jVEXG_message {\r\n  border-radius: 6px;\r\n}\r\n\r\n/* Directory picker rows (old ZuhsRW_* mapping; base uses interactive-bg-active). */\r\nbody .Fv-y6W_rowSelected,\r\nbody .Fv-y6W_rowSelected:hover {\r\n  background: rgba(0, 122, 255, 0.14);\r\n}\r\nbody[data-ds-dark-theme] .Fv-y6W_rowSelected,\r\nbody[data-ds-dark-theme] .Fv-y6W_rowSelected:hover {\r\n  background: rgba(10, 132, 255, 0.22);\r\n}\r\nbody .Fv-y6W_createInput {\r\n  border-radius: 10px;\r\n}\r\nbody .Fv-y6W_loadingFloat {\r\n  border-radius: 8px;\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n}\r\n\r\n/* ============================================================================\r\n   §13. DROPPED OLD RULES (documented here + NOTES.md)\r\n     .fV0t5q_root{background:layer-1}            -> would re-opaque the\r\n        conversation area shell.css keeps transparent; frost lives in §4.\r\n     .pI_x6G_frame{background:transparent}       -> superseded by shell.css\r\n        (.BynINW_frame etc. !important); old frame class no longer exists.\r\n     .Y0dWHa_table border-spacing / td cards / ::before timeline dots /\r\n        td::after rail line / .Y0dWHa_table .Y0dWHa_turnRail{display:none}\r\n        -> 0.2.1 trajectory is a redesigned table with its own turn/selection\r\n        rails; reference-screenshot intent (boxed badges + blue selection) is\r\n        ported in §8, the card experiment is not.\r\n     ._7yHdaG_panel{border-radius:10px 10px 0 0} -> ambiguous map entry\r\n        (amjGKq_panel = plugin-manager page, not a bottom sheet any more).\r\n     .bqrRRG_card{border-radius:14px} / .qSYn7G_card{box-shadow:lv1}\r\n        -> ambiguous card modules; radius-lg token already renders 14px and\r\n        elevation tokens cover panel shadows.\r\n     .ydkMvW_section dividers -> ambiguous per-tab section modules; 0.2.1 rows\r\n        carry their own dividers (e.g. settings-locale .Hefa_q_row).\r\n     #dsh-bg-canvas{...} -> the canvas is positioned inline by background.js\r\n        (position:fixed;inset:0;z-index:-1), no CSS needed.\r\n     ::-webkit-scrollbar{width:6px} -> covered by --dsh-scrollbar-width token.\r\n     body .VOzbGW/YDXeBa/wSkVaW/... -> all old CSS-module hashes are dead;\r\n        every rule above uses the 0.2.1 adapter or a semantic hook.\r\n   ========================================================================== */\r\n\r\n/* ============================================================================\r\n   §15. 0.2.x DESKTOP EXTRAS (v2.1, 2026-10-18)\r\n   Surfaces that did not exist (or were not covered) in the 0.1.x skin.\r\n   All classes below were verified in the installed 0.2.1-rc.2 bundles:\r\n     .Dc7zOa_header*      dsh-client-ui-conversation/ConversationRoot\r\n     .xz4KEq_running      dsh-client-ui-chat/ChatView\r\n     [data-tool] / card   dsh-client-ui-tool + per-tool modules\r\n     .OUqwTW_*            dsh-client-ui-sidebar-right\r\n     ._2WTFBq_bar         dsh-client-ui-context (meter)\r\n   ========================================================================== */\r\n\r\n/* Header chips (agent team / mode / subagent count / background jobs):\r\n   quiet macOS pills instead of bare text buttons. */\r\nbody .Dc7zOa_headerActions button,\r\nbody .Dc7zOa_headerUtilities button,\r\nbody .Dc7zOa_headerCorner button,\r\nbody [data-slot=\"conversation.session.header.utilities\"] button,\r\nbody [data-slot=\"conversation.session.header.corner\"] button {\r\n  border-radius: 999px !important;\r\n  padding: 4px 10px !important;\r\n  min-height: 26px;\r\n  font-size: 12px !important;\r\n  color: var(--dsw-alias-label-secondary);\r\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(242, 246, 251, 0.76));\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.90), 0 1px 3px rgba(39, 61, 91, 0.08);\r\n  transition: background-color .16s var(--ds-ease-in-out), color .16s var(--ds-ease-in-out);\r\n}\r\nbody .Dc7zOa_headerActions button:hover,\r\nbody .Dc7zOa_headerUtilities button:hover,\r\nbody .Dc7zOa_headerCorner button:hover,\r\nbody [data-slot=\"conversation.session.header.utilities\"] button:hover,\r\nbody [data-slot=\"conversation.session.header.corner\"] button:hover {\r\n  background: linear-gradient(180deg, #fff, #edf3fa);\r\n  color: var(--dsw-alias-label-primary);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.94), 0 2px 5px rgba(39, 61, 91, 0.12);\r\n}\r\nbody .Dc7zOa_headerActions button:focus-visible,\r\nbody .Dc7zOa_headerUtilities button:focus-visible,\r\nbody .Dc7zOa_headerCorner button:focus-visible,\r\nbody [data-slot=\"conversation.session.header.utilities\"] button:focus-visible,\r\nbody [data-slot=\"conversation.session.header.corner\"] button:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.58);\r\n  outline-offset: 1px;\r\n}\r\nbody[data-ds-dark-theme] .Dc7zOa_headerActions button,\r\nbody[data-ds-dark-theme] .Dc7zOa_headerUtilities button,\r\nbody[data-ds-dark-theme] .Dc7zOa_headerCorner button,\r\nbody[data-ds-dark-theme] [data-slot=\"conversation.session.header.utilities\"] button,\r\nbody[data-ds-dark-theme] [data-slot=\"conversation.session.header.corner\"] button {\r\n  background: linear-gradient(180deg, rgba(57, 66, 81, 0.96), rgba(43, 51, 64, 0.96));\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.09), 0 1px 3px rgba(0, 0, 0, 0.18);\r\n}\r\nbody[data-ds-dark-theme] .Dc7zOa_headerActions button:hover,\r\nbody[data-ds-dark-theme] .Dc7zOa_headerUtilities button:hover,\r\nbody[data-ds-dark-theme] .Dc7zOa_headerCorner button:hover,\r\nbody[data-ds-dark-theme] [data-slot=\"conversation.session.header.utilities\"] button:hover,\r\nbody[data-ds-dark-theme] [data-slot=\"conversation.session.header.corner\"] button:hover {\r\n  background: linear-gradient(180deg, #465268, #394558);\r\n}\r\n\r\n/* Running strip: align the live status with the conversation body. */\nbody .xz4KEq_running {\n  box-sizing: border-box;\n  width: min(100%, 560px);\n  max-width: 100%;\n  margin: 8px 0 14px;\n  padding: 12px 16px;\n  border-radius: 16px;\n  background: rgba(239, 245, 253, 0.92);\n  border: 1px solid rgba(125, 153, 188, 0.24);\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.82), 0 2px 6px rgba(38, 58, 88, 0.07);\n  -webkit-backdrop-filter: none;\n  backdrop-filter: none;\n}\nbody .xz4KEq_runningDivider { display: none !important; }\nbody .xz4KEq_runningContent {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n  min-width: 0;\n}\nbody .xz4KEq_runningText { min-width: 0; white-space: normal; color: #355d84; }\nbody .xz4KEq_runningText,\nbody .xz4KEq_runningText * {\n  background-image: none !important;\n  -webkit-text-fill-color: currentColor;\n  animation: none !important;\n}\nbody[data-ds-dark-theme] .xz4KEq_running {\n  background: rgba(38, 47, 61, 0.94);\n  border-color: rgba(149, 173, 205, 0.24);\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.18);\n}\nbody[data-ds-dark-theme] .xz4KEq_runningText { color: #dce8f8; }\n\n/* Running status uses the exact DeepSeek logo path as a single mask. */\nbody .xz4KEq_runningIcon {\n  position: relative;\n  flex: 0 0 38px;\n  width: 38px;\n  height: 26px;\n  overflow: visible;\n  color: #397dbf;\n  animation: xz4keq-running-bob 2.4s ease-in-out infinite;\n}\nbody .xz4KEq_runningIcon .xz4KEq_runningWhaleAnimated,\nbody .xz4KEq_runningIcon .xz4KEq_runningWhaleStill { display: none !important; }\nbody .xz4KEq_runningIcon::before {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  display: block;\n  background: currentColor;\n  -webkit-mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2023.6%2017.2%22%3E%3Cpath%20d%3D%22M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z%22%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\n  mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2023.6%2017.2%22%3E%3Cpath%20d%3D%22M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z%22%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\n}\nbody[data-ds-dark-theme] .xz4KEq_runningIcon { color: #9bc8f2; }\n@keyframes xz4keq-running-bob {\n  0%, 100% { transform: translateY(1.5px) rotate(-2deg); }\n  50% { transform: translateY(-1.5px) rotate(2deg); }\n}\n@media (prefers-reduced-motion: reduce) {\n  body .xz4KEq_runningIcon { animation: none !important; transform: none !important; }\n}\n@media (forced-colors: active) {\n  body .xz4KEq_runningIcon { color: CanvasText; forced-color-adjust: none; }\n  body .xz4KEq_runningIcon::before { background: CanvasText; }\n}\n@media (prefers-reduced-transparency: reduce) {\n  body .xz4KEq_running { background: #eff5fd !important; }\n  body[data-ds-dark-theme] .xz4KEq_running { background: #262f3d !important; }\n}\n\r\n/* Tool cards (read/write/edit/pwsh/…): macOS inset surface. */\r\nbody [data-tool] [class*=\"_card\"] {\r\n  border-radius: 12px;\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n}\r\n\r\n/* Markdown: code blocks / inline code / tables get the same radii as the rest. */\r\nbody ._markdown_1ypvv_5 pre {\r\n  border-radius: 12px;\r\n  border: 1px solid var(--dsw-alias-border-l2);\r\n}\r\nbody ._markdown_1ypvv_5 :not(pre) > code {\r\n  border-radius: 5px;\r\n  padding: 1px 5px;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n}\r\nbody ._markdown_1ypvv_5 table {\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: 10px;\r\n  overflow: hidden;\r\n}\r\n\r\n/* Queue dock / context meter: rounded, quiet. */\r\nbody [data-queue-dock] {\r\n  border-radius: 12px;\r\n}\r\nbody ._2WTFBq_bar {\r\n  border-radius: 10px;\r\n}\r\n\r\n/* Right sidebar (session details / files): let the aquarium glass through. */\r\nbody .OUqwTW_panel,\r\nbody .OUqwTW_panelBody,\r\nbody .OUqwTW_tabBody {\r\n  background: transparent !important;\r\n}\r\n\r\n/* Sidebar footer: hairline separator above \"更多\". */\r\nbody ._2H3hWW_footArea {\r\n  border-top: 1px solid var(--dsw-alias-border-l1);\r\n}\r\n\r\n/* Composer seat: replace the opaque sticky gradient with a soft fade, so the\r\n   water keeps flowing under the input bar (was a visible seam on Desktop). */\r\nbody [data-composer-seat],\r\nbody .Dc7zOa_composerSeat {\r\n  background: linear-gradient(\r\n    180deg,\r\n    rgba(255, 255, 255, 0) 0%,\r\n    rgba(255, 255, 255, 0.35) 55%,\r\n    rgba(255, 255, 255, 0.5) 100%\r\n  ) !important;\r\n}\r\nbody[data-ds-dark-theme] [data-composer-seat],\r\nbody[data-ds-dark-theme] .Dc7zOa_composerSeat {\r\n  background: linear-gradient(\r\n    180deg,\r\n    rgba(10, 12, 19, 0) 0%,\r\n    rgba(10, 12, 19, 0.45) 55%,\r\n    rgba(10, 12, 19, 0.6) 100%\r\n  ) !important;\r\n}\r\n\r\n/* Windows 40px window-chrome band: keep it solid for the native caption probe\r\n   but let a hint of water sit at its top edge. (Same selector as shell.css;\r\n   regions.css is injected later, so this wins.) */\r\n[data-windows-titlebar] .BynINW_frame:before {\n  background:\n    radial-gradient(ellipse at 75% 0%, rgba(234, 179, 136, 0.34) 0%, rgba(234, 179, 136, 0.12) 34%, rgba(234, 179, 136, 0) 68%),\n    linear-gradient(180deg, rgba(232, 214, 199, 0.28) 0%, rgba(242, 242, 247, 0) 78%),\n    var(--dsw-specific-sidebar-fill) !important;\n}\nhtml[data-windows-titlebar] body[data-ds-dark-theme] .BynINW_frame:before,\nbody[data-ds-dark-theme][data-windows-titlebar] .BynINW_frame:before,\n[data-ds-dark-theme] [data-windows-titlebar] .BynINW_frame:before {\n  background:\n    radial-gradient(ellipse at 75% 0%, rgba(123, 154, 202, 0.22) 0%, rgba(123, 154, 202, 0.08) 34%, rgba(123, 154, 202, 0) 68%),\n    linear-gradient(180deg, rgba(79, 101, 139, 0.18) 0%, rgba(44, 48, 58, 0) 78%),\n    var(--dsw-specific-sidebar-fill) !important;\n}\n\r\n/* Secondary full-page surfaces (schedule page, account overlay): transparent so\r\n   the aquarium reads through instead of a flat white sheet. */\r\nbody .S0jZwq_page,\r\nbody .TaJwIq_overlay {\r\n  background: transparent !important;\r\n}\r\n\r\n/* Schedule page filter tabs: iOS segmented pill (same treatment as view tabs). */\r\nbody .S0jZwq_filterTabs {\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n  border-radius: 999px;\r\n  padding: 3px;\r\n  gap: 0;\r\n}\r\nbody .S0jZwq_filterTab {\r\n  border-radius: 999px;\r\n  padding: 5px 14px;\r\n  height: 28px;\r\n  color: var(--dsw-alias-label-primary);\r\n}\r\nbody .S0jZwq_filterTab:hover {\r\n  background: var(--dsw-alias-interactive-bg-hover);\r\n}\r\nbody .S0jZwq_filterTabActive,\r\nbody .S0jZwq_filterTabActive:hover {\r\n  background: var(--dsw-alias-button-info-fill);\r\n  color: #FFFFFF;\r\n}\r\n\r\n/* Message row extras: turn summary chip, inline file links, hover actions,\r\n   image frames, \"open with\" buttons. Classes from dsh-client-ui-chat /\r\n   dsh-client-ui-tool / dsh-client-ui-attachment in 0.2.1-rc.2. */\r\nbody button._4AI11G_root[data-turn-process] {\r\n  box-sizing: border-box;\r\n  width: 100%;\r\n  height: calc(33px + var(--dsh-content-font-delta, 0px));\r\n  margin-left: 0;\r\n  padding: 0 12px;\r\n  border: 1px solid rgba(113, 134, 163, 0.20);\r\n  border-radius: 11px;\r\n  background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(239, 244, 251, 0.70));\r\n  color: var(--dsw-alias-label-secondary);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.94), 0 1px 3px rgba(36, 57, 87, 0.08);\r\n  text-align: left;\r\n}\r\nbody button._4AI11G_root[data-turn-process]:hover:not(:disabled) {\r\n  background: linear-gradient(180deg, #fff, #edf3fa);\r\n}\r\nbody button._4AI11G_root[data-turn-process]:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.62);\r\n  outline-offset: 1px;\r\n}\r\nbody[data-ds-dark-theme] button._4AI11G_root[data-turn-process] {\r\n  border-color: rgba(193, 209, 231, 0.16);\r\n  background: linear-gradient(180deg, rgba(42, 50, 64, 0.90), rgba(34, 41, 54, 0.82));\r\n  color: #d6e0ef;\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.20);\r\n}\r\nbody[data-ds-dark-theme] button._4AI11G_root[data-turn-process]:hover:not(:disabled) {\r\n  background: linear-gradient(180deg, #3a4659, #303b4d);\r\n}\r\nbody .WW4l1q_title {\r\n  color: var(--dsw-alias-label-secondary);\r\n}\r\nbody .pFy1Ka_fileLink {\r\n  border-radius: 6px;\r\n  padding: 1px 6px;\r\n  background: var(--dsw-alias-bg-module-platform);\r\n  text-decoration: none;\r\n}\r\nbody .pFy1Ka_fileLink:hover {\r\n  background: var(--dsw-alias-interactive-bg-hover-solid);\r\n}\r\nbody .xD_KDq_action,\r\nbody .vpunvW_action {\r\n  border-radius: 7px;\r\n}\r\nbody .Nhu-QW_frame {\r\n  border-radius: 12px;\r\n  overflow: hidden;\r\n  border: 1px solid var(--dsw-alias-border-l1);\r\n}\r\nbody .WgQWqa_main {\r\n  border-radius: 8px;\r\n}\r\n\r\n/* 2026-10-18 pearl-glass polish: keep the glass quiet and the labels readable. */\r\nbody [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"],\r\nbody .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  background: #dceaff !important;\r\n  color: #17385e !important;\r\n}\r\nbody[data-ds-dark-theme] [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"],\r\nbody[data-ds-dark-theme] .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody[data-ds-dark-theme] .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  background: #263c59 !important;\r\n  color: #e4efff !important;\r\n}\r\nbody [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"],\r\nbody .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  border-radius: 10px;\r\n  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(101, 151, 214, 0.07)) !important;\r\n  box-shadow: inset 2px 0 rgba(65, 124, 190, 0.66), inset 0 1px rgba(255, 255, 255, 0.60), 0 1px 3px rgba(42, 72, 111, 0.08);\r\n}\r\nbody[data-ds-dark-theme] [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"],\r\nbody[data-ds-dark-theme] .hIlkoa_sessionRow.hIlkoa_selected,\r\nbody[data-ds-dark-theme] .hIlkoa_searchResultRow.hIlkoa_selected {\r\n  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(5, 13, 25, 0.10)) !important;\r\n  box-shadow: inset 2px 0 rgba(126, 174, 225, 0.72), inset 0 1px rgba(255, 255, 255, 0.08), 0 1px 3px rgba(0, 0, 0, 0.18);\r\n}\r\nbody [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"] *,\r\nbody .hIlkoa_sessionRow.hIlkoa_selected *,\r\nbody .hIlkoa_searchResultRow.hIlkoa_selected * {\r\n  color: inherit !important;\r\n}\r\nbody [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"]:focus-visible,\r\nbody [role=\"treeitem\"]:is([data-row-key^=\"session:\"], [data-row-key^=\"search:\"])[aria-selected=\"true\"]:focus-within {\r\n  outline: 2px solid #6a9fe7;\r\n  outline-offset: -2px;\r\n}\r\n\r\nbody [data-conversation-tabs] {\r\n  box-sizing: border-box;\r\n  background: linear-gradient(180deg, #fbfcfe, #edf2f9);\r\n  border-color: rgba(105, 127, 160, 0.18);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.92), 0 1px 4px rgba(41, 62, 92, 0.10);\r\n  height: 34px;\r\n  padding: 2px;\r\n}\r\nbody [data-conversation-tabs] button[role=\"tab\"] {\r\n  box-sizing: border-box;\r\n  height: 28px;\r\n  padding: 3px 16px;\r\n  border: 1px solid transparent;\r\n  font-size: 14px;\r\n  font-weight: 500;\r\n  line-height: 20px;\r\n}\r\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\r\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover {\r\n  background: #2864d9;\r\n  color: #fff;\r\n  border: 1px solid rgba(18, 58, 130, 0.45);\r\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.24), 0 1px 2px rgba(26, 53, 93, 0.16);\r\n}\r\nbody [data-conversation-tabs] button[role=\"tab\"]:focus-visible {\r\n  outline: 2px solid rgba(91, 145, 207, 0.62);\r\n  outline-offset: 1px;\r\n}\r\nbody[data-ds-dark-theme] [data-conversation-tabs] {\r\n  background: linear-gradient(180deg, #2c3340, #252c38);\r\n  border-color: rgba(200, 216, 240, 0.12);\r\n}\r\nbody[data-ds-dark-theme] [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\r\nbody[data-ds-dark-theme] [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover {\r\n  background: #2864d9;\r\n  color: #fff;\r\n  border-color: rgba(138, 177, 245, 0.45);\r\n}\r\nbody .cJsG2q_bubble {\r\n  background: rgba(208, 226, 250, 0.92);\r\n  color: #183657;\r\n  box-shadow: 0 1px 2px rgba(34, 61, 96, 0.08);\r\n}\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5,\r\nbody .cJsG2q_bubble a,\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5 a,\r\nbody .cJsG2q_bubble .cJsG2q_compactionTitle,\r\nbody .cJsG2q_bubble .cJsG2q_compactionSummary,\r\nbody .cJsG2q_bubble .cJsG2q_compactionBody,\r\nbody .cJsG2q_bubble .cJsG2q_compactionLeading {\r\n  color: #183657;\r\n}\r\nbody .cJsG2q_bubble ._markdown_1ypvv_5 :not(pre) > code {\r\n  background-color: rgba(24, 54, 87, 0.10);\r\n  color: #183657;\r\n}\r\nbody[data-ds-dark-theme] .cJsG2q_bubble {\r\n  background: rgba(53, 76, 108, 0.92);\r\n  color: #e8f1ff;\r\n}\r\nbody[data-ds-dark-theme] .cJsG2q_bubble ._markdown_1ypvv_5,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble a,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble ._markdown_1ypvv_5 a {\r\n  color: #e8f1ff;\r\n}\r\nbody[data-ds-dark-theme] .cJsG2q_bubble .cJsG2q_compactionTitle,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble .cJsG2q_compactionSummary,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble .cJsG2q_compactionBody,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble .cJsG2q_compactionLeading,\r\nbody[data-ds-dark-theme] .cJsG2q_bubble ._markdown_1ypvv_5 :not(pre) > code {\r\n  color: #e8f1ff;\r\n}\r\n\r\nbody [data-composer-card] {\n  border-radius: 22px;\n  background: rgba(255, 255, 255, 0.94);\n  border-color: rgba(112, 128, 148, 0.22);\n  border-top-color: rgba(255, 255, 255, 0.98);\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.94), 0 2px 6px rgba(38, 50, 68, 0.07), 0 1px 2px rgba(38, 50, 68, 0.05);\n  transition: border-color 160ms ease, box-shadow 160ms ease;\r\n}\r\nbody [data-composer-card]::after {\n  opacity: 0 !important;\n  background: none !important;\n  animation: none !important;\n}\nbody [data-composer-card]:has(rect) { animation: none !important; }\nbody [data-composer-card]:has(button[class*=\"_primary\"] svg rect),\nbody [data-composer-card]:has(.RlGAzG_pending),\nbody [data-composer-card]:has([data-composer-input]:focus) {\n  box-shadow: inset 0 0 0 1px rgba(66, 132, 213, 0.72), 0 0 0 1px rgba(66, 132, 213, 0.22), 0 2px 6px rgba(38, 50, 68, 0.07);\n}\nbody[data-ds-dark-theme] [data-composer-card] {\n  background: rgba(29, 34, 43, 0.96);\n  border-color: rgba(192, 207, 229, 0.22);\n  border-top-color: rgba(255, 255, 255, 0.12);\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.07), 0 2px 6px rgba(0, 0, 0, 0.20), 0 1px 2px rgba(0, 0, 0, 0.12);\n}\nbody[data-ds-dark-theme] [data-composer-card]:has(button[class*=\"_primary\"] svg rect),\nbody[data-ds-dark-theme] [data-composer-card]:has(.RlGAzG_pending),\nbody[data-ds-dark-theme] [data-composer-card]:has([data-composer-input]:focus) {\n  box-shadow: inset 0 0 0 1px rgba(117, 169, 235, 0.76), 0 0 0 1px rgba(89, 151, 224, 0.32), 0 2px 6px rgba(0, 0, 0, 0.20);\n}\nbody [data-composer-card]:has(rect)::after,\nbody [data-composer-card]:has(.RlGAzG_pending)::after {\n  opacity: 0 !important;\n  background: none !important;\n  animation: none !important;\n}\nbody [data-composer-card]:has(button[class*=\"_primary\"] svg rect)::before,\nbody [data-composer-card]:has(.RlGAzG_pending)::before {\n  content: \"\";\n  position: absolute;\n  inset: -3px;\r\n  z-index: 2;\r\n  box-sizing: border-box;\n  border: 2px solid rgba(40, 137, 255, 0.95);\r\n  border-radius: 25px;\r\n  box-shadow: 0 0 0 3px rgba(68, 156, 255, 0.14), 0 0 14px rgba(48, 139, 255, 0.38);\r\n  pointer-events: none;\n  animation: dsh-composer-breathe 2.6s ease-in-out infinite;\n}\nbody[data-ds-dark-theme] [data-composer-card]:has(button[class*=\"_primary\"] svg rect)::before,\nbody[data-ds-dark-theme] [data-composer-card]:has(.RlGAzG_pending)::before {\n  border-color: rgba(117, 169, 235, 0.72);\n  box-shadow: 0 0 0 3px rgba(89, 151, 224, 0.16), 0 0 14px rgba(89, 151, 224, 0.38);\r\n}\n@keyframes dsh-composer-breathe {\n  0%, 100% { opacity: 0.05; }\r\n  50% { opacity: 1; }\r\n}\n/* Keep the focus outline from visually masking the running pulse. */\r\nbody [data-composer-card]:has(button[class*=\"_primary\"] svg rect),\r\nbody[data-ds-dark-theme] [data-composer-card]:has(button[class*=\"_primary\"] svg rect) {\r\n  box-shadow: inset 0 0 0 1px rgba(116, 143, 177, 0.24), 0 2px 6px rgba(38, 50, 68, 0.07);\r\n}\r\n@media (prefers-reduced-motion: reduce) {\n  body [data-composer-card]:has(button[class*=\"_primary\"] svg rect)::before,\n  body [data-composer-card]:has(.RlGAzG_pending)::before {\n    opacity: 0.55;\n    animation: none !important;\n  }\n}\n@media (forced-colors: active) {\n  body [data-composer-card]:has(button[class*=\"_primary\"] svg rect)::before,\n  body [data-composer-card]:has(.RlGAzG_pending)::before {\n    border-color: Highlight;\n    box-shadow: none;\n    opacity: 1;\n    animation: none !important;\n  }\n}\n@media (prefers-reduced-transparency: reduce) {\n  body button._4AI11G_root[data-turn-process] {\r\n    background: #f1f5fb !important;\r\n    background-image: none !important;\r\n  }\r\n  body[data-ds-dark-theme] button._4AI11G_root[data-turn-process] {\r\n    background: #293240 !important;\r\n    background-image: none !important;\r\n  }\r\n  body ._2H3hWW_newSession ._2H3hWW_newSessionShortcut { background: #2d669f; }\r\n  body .wCInkW_trigger,\r\n  body .wCInkW_panel .Hefa_q_selector,\r\n  body .wCInkW_panel ._3HsggG_selector,\r\n  body .wCInkW_panel .XZcbxG_selector,\r\n  body .wCInkW_panel .mP3ANa_selector { background: #fff !important; }\r\n  body .wCInkW_navCell.wCInkW_active,\r\n  body .wCInkW_navCell[aria-current=\"true\"] { background: #2864d9 !important; color: #fff !important; box-shadow: none; }\r\n  body .wCInkW_navIcon { background-color: #8e8e93 !important; color: #fff !important; box-shadow: none; }\r\n  body .wCInkW_navList > .wCInkW_navCell:nth-child(3) .wCInkW_navIcon { background-color: #3281f6 !important; }\r\n  body .wCInkW_navList > .wCInkW_navCell:nth-child(4) .wCInkW_navIcon { background-color: #e68b2d !important; }\r\n  body .wCInkW_navList > .wCInkW_navCell:nth-child(5) .wCInkW_navIcon { background-color: #8057c7 !important; }\r\n  body .wCInkW_panel .Hefa_q_selector[aria-expanded=\"true\"],\r\n  body .wCInkW_panel ._3HsggG_selector[aria-expanded=\"true\"],\r\n  body .wCInkW_panel .XZcbxG_selector[aria-expanded=\"true\"],\r\n  body .wCInkW_panel .mP3ANa_selector[aria-expanded=\"true\"] { background: #f1f5fa !important; box-shadow: 0 1px 2px rgba(0,0,0,.04); }\r\n  body ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):hover:not(:disabled),\n  body ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):focus-visible:not(:disabled) { background: #f0f2f5 !important; }\n  body ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226),\r\n  body ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) { color: #fff !important; background: #2864d9 !important; box-shadow: none; }\r\n  body ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) ._check_4ub78_179,\r\n  body ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226) ._check_4ub78_179 { color: #fff !important; }\r\n  body .v01cdW_themeCube.v01cdW_selected { background: #f5f5f7 !important; border-color: #3478f6 !important; box-shadow: 0 0 0 1px #3478f6; }\r\n  body ._surface_ri079_1 { background: #fdfdfd !important; box-shadow: 0 6px 18px rgba(0,0,0,.12); }\r\n  body .Dc7zOa_headerActions button,\r\n  body .Dc7zOa_headerUtilities button,\r\n  body .Dc7zOa_headerCorner button,\r\n  body [data-slot=\"conversation.session.header.utilities\"] button,\r\n  body [data-slot=\"conversation.session.header.corner\"] button { background: #f5f8fc !important; }\r\n  body[data-ds-dark-theme] ._2H3hWW_newSession ._2H3hWW_newSessionShortcut { background: #315579; }\r\n  body[data-ds-dark-theme] .wCInkW_trigger,\r\n  body[data-ds-dark-theme] .wCInkW_panel .Hefa_q_selector,\r\n  body[data-ds-dark-theme] .wCInkW_panel ._3HsggG_selector,\r\n  body[data-ds-dark-theme] .wCInkW_panel .XZcbxG_selector,\r\n  body[data-ds-dark-theme] .wCInkW_panel .mP3ANa_selector { background: #30343a !important; }\r\n  body[data-ds-dark-theme] .wCInkW_navCell.wCInkW_active,\r\n  body[data-ds-dark-theme] .wCInkW_navCell[aria-current=\"true\"] { background: #2864d9 !important; color: #fff !important; box-shadow: none; }\r\n  body[data-ds-dark-theme] .wCInkW_navIcon { background-color: #8e8e93 !important; color: #fff !important; box-shadow: none; }\n  body[data-ds-dark-theme] .wCInkW_navList > .wCInkW_navCell:nth-child(3) .wCInkW_navIcon { background-color: #3281f6 !important; }\r\n  body[data-ds-dark-theme] .wCInkW_navList > .wCInkW_navCell:nth-child(4) .wCInkW_navIcon { background-color: #e68b2d !important; }\r\n  body[data-ds-dark-theme] .wCInkW_navList > .wCInkW_navCell:nth-child(5) .wCInkW_navIcon { background-color: #8057c7 !important; }\r\n  body[data-ds-dark-theme] .wCInkW_panel .Hefa_q_selector[aria-expanded=\"true\"],\r\n  body[data-ds-dark-theme] .wCInkW_panel ._3HsggG_selector[aria-expanded=\"true\"],\r\n  body[data-ds-dark-theme] .wCInkW_panel .XZcbxG_selector[aria-expanded=\"true\"],\r\n  body[data-ds-dark-theme] .wCInkW_panel .mP3ANa_selector[aria-expanded=\"true\"] { background: #35404d !important; box-shadow: 0 1px 2px rgba(0,0,0,.24); }\r\n  body[data-ds-dark-theme] ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):hover:not(:disabled),\n  body[data-ds-dark-theme] ._item_4ub78_90:not(._danger_4ub78_226):not(:is(._selected_4ub78_216, ._selectedFill_4ub78_221)):focus-visible:not(:disabled) { background: #3a3e44 !important; }\n  body[data-ds-dark-theme] ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226),\r\n  body[data-ds-dark-theme] ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) { color: #fff !important; background: #2864d9 !important; box-shadow: none; }\r\n  body[data-ds-dark-theme] ._item_4ub78_90._selected_4ub78_216:not(._danger_4ub78_226) ._check_4ub78_179,\r\n  body[data-ds-dark-theme] ._item_4ub78_90._selectedFill_4ub78_221:not(._danger_4ub78_226) ._check_4ub78_179 { color: #fff !important; }\r\n  body[data-ds-dark-theme] .v01cdW_themeCube { background: #303238 !important; border-color: #4b4f57 !important; }\r\n  body[data-ds-dark-theme] .v01cdW_themeCube.v01cdW_selected { background: #303238 !important; border-color: #6ca3ff !important; box-shadow: 0 0 0 1px #6ca3ff; }\r\n  body[data-ds-dark-theme] ._surface_ri079_1 { background: #30343a !important; box-shadow: 0 6px 18px rgba(0,0,0,.32); }\r\n  body[data-ds-dark-theme] .Dc7zOa_headerActions button,\r\n  body[data-ds-dark-theme] .Dc7zOa_headerUtilities button,\r\n  body[data-ds-dark-theme] .Dc7zOa_headerCorner button,\r\n  body[data-ds-dark-theme] [data-slot=\"conversation.session.header.utilities\"] button,\r\n  body[data-ds-dark-theme] [data-slot=\"conversation.session.header.corner\"] button { background: #333d4c !important; }\r\n  body [data-conversation-tabs] { background: #f7f9fd !important; }\r\n  body [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\r\n  body [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover { background: #2864d9 !important; color: #fff !important; }\r\n  body .cJsG2q_bubble { background: #d0e2fa !important; }\r\n  body [data-composer-card] { background: #fff !important; }\r\n  body[data-ds-dark-theme] [data-conversation-tabs] { background: #1f242e !important; }\r\n  body[data-ds-dark-theme] [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\r\n  body[data-ds-dark-theme] [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover { background: #2864d9 !important; color: #fff !important; }\r\n  body[data-ds-dark-theme] .cJsG2q_bubble { background: #354c6c !important; }\r\n  body[data-ds-dark-theme] [data-composer-card] { background: #1d222b !important; }\r\n  body .hGyLPq_root,\n  body .haSm5q_split,\n  body .haSm5q_tablePane { background: transparent !important; }\n  body .haSm5q_table { background: rgba(250, 251, 255, 0.24) !important; }\n  body .haSm5q_table th,\n  body .haSm5q_historyLoadingBar,\n  body .haSm5q_historyLoadButton,\n  body .QnvEwG_root,\n  body .ZNyiNW_plot { background: #f4f6fa !important; }\n  body .haSm5q_table tbody tr[data-collapsed-summary] td { background: #f4f6fa !important; }\n  body[data-ds-dark-theme] .haSm5q_split,\n  body[data-ds-dark-theme] .hGyLPq_root,\n  body[data-ds-dark-theme] .haSm5q_tablePane,\n  body[data-ds-dark-theme] .haSm5q_table th,\n  body[data-ds-dark-theme] .haSm5q_historyLoadingBar,\n  body[data-ds-dark-theme] .haSm5q_historyLoadButton,\n  body[data-ds-dark-theme] .haSm5q_table tbody tr[data-collapsed-summary] td,\n  body[data-ds-dark-theme] .QnvEwG_root,\n  body[data-ds-dark-theme] .ZNyiNW_plot { background: #242830 !important; }\n  body[data-ds-dark-theme] .haSm5q_table { background: rgba(18, 21, 28, 0.28) !important; }\n  body [data-conversation-tabs], body .cJsG2q_bubble, body [data-composer-card] {\r\n    backdrop-filter: none;\r\n    -webkit-backdrop-filter: none;\r\n  }\r\n}\r\n@media (prefers-reduced-motion: reduce) {\r\n  body [data-composer-card] { transition: none; }\r\n}\r\n";

    // ---- 背景动画 + 发送按钮鲸鱼（src/background.js）----
function startBackground() {
  var __disposed = false;
  var __winListeners = [];
  function __on(t, type, fn, opts) { t.addEventListener(type, fn, opts); __winListeners.push([t, type, fn]); }
  var __pre = document.getElementById('dsh-bg-canvas');
  if (__pre && __pre.parentNode) __pre.parentNode.removeChild(__pre);
  var motionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(motionQuery && motionQuery.matches);
  var canvas = document.createElement('canvas');
  canvas.id = 'dsh-bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  // z-index:-1 + first body child: DSH >= 0.2.0 paints its own surfaces above in-flow
  // content (BynINW_frame / conversation root), so a z-index:0 overlay would sit ON TOP of
  // the UI. Negative z-index keeps the aquarium behind every app surface; the skin's shell
  // rules make those surfaces translucent so the water shows through.
  canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%';
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) { canvas.parentNode.removeChild(canvas); return function () {}; }
  var DPR = Math.min(window.devicePixelRatio || 1, 1.25);
  var vw = window.innerWidth, vh = window.innerHeight;
  var skyCanvas = document.createElement('canvas');
  skyCanvas.setAttribute('aria-hidden', 'true');
  skyCanvas.style.cssText = 'position:fixed;top:0;left:0;z-index:3;pointer-events:none;width:100%;height:40px;display:none';
  document.body.appendChild(skyCanvas);
  var skyCtx = skyCanvas.getContext('2d');
  function hasTitlebarSky() {
    var root = document.documentElement;
    var marker = root && (root.hasAttribute('data-windows-titlebar') ||
      (root.querySelector && root.querySelector('[data-windows-titlebar]')));
    return !!marker && !document.fullscreenElement && !(root && root.hasAttribute('data-fullscreen'));
  }
  var titlebarSky = hasTitlebarSky() && !!skyCtx;
  skyCanvas.style.display = titlebarSky ? 'block' : 'none';
  var sidebarHostSelector = '[class*="_sidebarCol"]';
  var sidebarHost = null, sidebarCanvas = null, sidebarCtx = null;
  var sidebarResizeObserver = null, sidebarMountObserver = null, sidebarThemeObserver = null;
  var sidebarRect = null, sidebarHostHadMarker = false, sidebarHostMarkerValue = null;
  function updateSidebarBounds() {
    if (!sidebarHost || !sidebarCanvas || typeof sidebarHost.getBoundingClientRect !== 'function') return;
    var rect = sidebarHost.getBoundingClientRect();
    sidebarRect = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    var width = Math.max(1, Math.ceil(Math.max(0, rect.width) * DPR));
    var height = Math.max(1, Math.ceil(Math.max(0, rect.height) * DPR));
    if (sidebarCanvas.width !== width) sidebarCanvas.width = width;
    if (sidebarCanvas.height !== height) sidebarCanvas.height = height;
    sidebarCtx = sidebarCanvas.getContext('2d');
    if (rect.width <= 0 || rect.height <= 0) sidebarRect = null;
  }
  function paintSidebarWater() {
    if (!sidebarCtx || !sidebarCanvas || !sidebarHost || !sidebarRect) return;
    var rect = sidebarRect;
    if (rect.width <= 0 || rect.height <= 0) return;
    sidebarCtx.globalAlpha = 1;
    sidebarCtx.globalCompositeOperation = 'source-over';
    sidebarCtx.fillStyle = document.body.hasAttribute('data-ds-dark-theme') ? '#1c1f27' : '#f6f8fc';
    sidebarCtx.fillRect(0, 0, sidebarCanvas.width, sidebarCanvas.height);
    var sx = Math.max(0, Math.min(canvas.width, rect.left * DPR));
    var sy = Math.max(0, Math.min(canvas.height, rect.top * DPR));
    var sr = Math.max(sx, Math.min(canvas.width, rect.right * DPR));
    var sb = Math.max(sy, Math.min(canvas.height, rect.bottom * DPR));
    var sw = sr - sx, sh = sb - sy;
    if (sw <= 0 || sh <= 0) return;
    var dx = Math.max(0, sx - rect.left * DPR);
    var dy = Math.max(0, sy - rect.top * DPR);
    sidebarCtx.drawImage(canvas, sx, sy, sw, sh, dx, dy, sw, sh);
  }
  function detachSidebarWater() {
    if (sidebarResizeObserver) sidebarResizeObserver.disconnect();
    sidebarResizeObserver = null;
    if (sidebarCanvas && sidebarCanvas.parentNode) sidebarCanvas.parentNode.removeChild(sidebarCanvas);
    if (sidebarHost) {
      if (sidebarHostHadMarker) sidebarHost.setAttribute('data-dsh-sidebar-water-host', sidebarHostMarkerValue || '');
      else sidebarHost.removeAttribute('data-dsh-sidebar-water-host');
    }
    sidebarHost = null; sidebarCanvas = null; sidebarCtx = null; sidebarRect = null;
    sidebarHostHadMarker = false; sidebarHostMarkerValue = null;
  }
  function attachSidebarWater(host) {
    if (!host || host.isConnected === false || sidebarHost === host || typeof document.createElement !== 'function') return;
    detachSidebarWater();
    sidebarHost = host;
    sidebarHostHadMarker = host.hasAttribute('data-dsh-sidebar-water-host');
    sidebarHostMarkerValue = sidebarHostHadMarker ? host.getAttribute('data-dsh-sidebar-water-host') : null;
    if (!sidebarHostHadMarker) host.setAttribute('data-dsh-sidebar-water-host', '');
    sidebarCanvas = document.createElement('canvas');
    sidebarCanvas.setAttribute('data-dsh-sidebar-water', '');
    sidebarCanvas.setAttribute('aria-hidden', 'true');
    sidebarCtx = sidebarCanvas.getContext('2d');
    if (!sidebarCtx) { detachSidebarWater(); return; }
    host.insertBefore(sidebarCanvas, host.firstChild);
    updateSidebarBounds();
    if (typeof ResizeObserver === 'function') {
      sidebarResizeObserver = new ResizeObserver(function () { updateSidebarBounds(); paintSidebarWater(); });
      sidebarResizeObserver.observe(host);
    } else if (window.ResizeObserver) {
      sidebarResizeObserver = new window.ResizeObserver(function () { updateSidebarBounds(); paintSidebarWater(); });
      sidebarResizeObserver.observe(host);
    }
    paintSidebarWater();
  }
  function initSidebarWater() {
    if (typeof document.querySelector !== 'function') return;
    var host = document.querySelector(sidebarHostSelector);
    if (host) attachSidebarWater(host);
    if (typeof MutationObserver !== 'function' || !document.body) return;
    sidebarThemeObserver = new MutationObserver(function () {
      if (__disposed || reduced) return;
      if (paused || document.hidden) queueMicrotask(function () { if (!__disposed) draw(simTime, 0); });
      else paintSidebarWater();
    });
    sidebarThemeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
    sidebarMountObserver = new MutationObserver(function () {
      if (__disposed) return;
      if (sidebarHost && sidebarHost.isConnected !== false) return;
      if (sidebarHost) detachSidebarWater();
      var nextHost = typeof document.querySelector === 'function' ? document.querySelector(sidebarHostSelector) : null;
      if (nextHost) attachSidebarWater(nextHost);
    });
    sidebarMountObserver.observe(document.body, { childList: true, subtree: true });
  }
  var sunsetCanvas = document.createElement('canvas');
  var sunsetCtx = sunsetCanvas.getContext('2d');
var WHALE = 'M22.917 1.43C22.671 1.31 22.566 1.539 22.422 1.655C22.373 1.693 22.332 1.742 22.29 1.787C21.932 2.17 21.513 2.421 20.966 2.391C20.166 2.346 19.483 2.598 18.879 3.21C18.75 2.455 18.324 2.005 17.675 1.716C17.335 1.566 16.992 1.415 16.754 1.089C16.588 0.856 16.542 0.597 16.459 0.342C16.406 0.188 16.354 0.03 16.176 0.004C15.984 -0.026 15.908 0.135 15.833 0.27C15.531 0.822 15.414 1.43 15.425 2.046C15.452 3.432 16.037 4.535 17.199 5.32C17.331 5.41 17.365 5.5 17.324 5.632C17.244 5.902 17.15 6.165 17.067 6.435C17.014 6.608 16.935 6.646 16.75 6.57C16.112 6.304 15.561 5.909 15.074 5.433C14.248 4.633 13.5 3.751 12.568 3.06C12.349 2.898 12.13 2.748 11.903 2.605C10.952 1.682 12.028 0.923 12.277 0.833C12.538 0.739 12.368 0.416 11.526 0.42C10.684 0.424 9.914 0.706 8.933 1.081C8.789 1.138 8.638 1.179 8.484 1.213C7.593 1.044 6.668 1.006 5.702 1.115C3.883 1.318 2.43 2.178 1.362 3.646C0.079 5.41 -0.223 7.415 0.147 9.506C0.535 11.71 1.66 13.535 3.389 14.962C5.181 16.441 7.246 17.166 9.601 17.027C11.032 16.944 12.624 16.753 14.421 15.232C14.874 15.458 15.35 15.548 16.138 15.615C16.746 15.672 17.331 15.585 17.784 15.491C18.493 15.341 18.444 14.684 18.188 14.564C16.108 13.595 16.565 13.989 16.15 13.67C17.206 12.42 18.82 10.198 19.318 7.172C19.367 6.838 19.43 6.368 19.422 6.097C19.418 5.932 19.456 5.868 19.645 5.849C20.166 5.789 20.671 5.647 21.136 5.391C22.483 4.655 23.027 3.446 23.155 1.997C23.174 1.776 23.151 1.547 22.917 1.43ZM11.175 14.474C9.159 12.889 8.182 12.368 7.778 12.39C7.401 12.412 7.469 12.844 7.552 13.126C7.639 13.404 7.752 13.596 7.91 13.84C8.02 14.001 8.095 14.241 7.801 14.422C7.152 14.823 6.023 14.287 5.97 14.26C4.657 13.486 3.559 12.466 2.785 11.069C2.037 9.725 1.603 8.283 1.532 6.744C1.513 6.372 1.622 6.241 1.992 6.173C2.479 6.083 2.981 6.064 3.468 6.136C5.525 6.436 7.276 7.356 8.744 8.813C9.582 9.642 10.216 10.634 10.869 11.602C11.563 12.631 12.31 13.611 13.262 14.415C13.598 14.696 13.866 14.91 14.122 15.068C13.349 15.155 12.058 15.173 11.175 14.475L11.175 14.474ZM12.141 8.26C12.141 8.095 12.273 7.963 12.439 7.963C12.476 7.963 12.51 7.971 12.541 7.982C12.582 7.997 12.62 8.019 12.65 8.053C12.704 8.106 12.734 8.181 12.734 8.26C12.734 8.425 12.602 8.556 12.436 8.556C12.27 8.556 12.141 8.425 12.141 8.26ZM15.142 9.799C14.949 9.878 14.756 9.945 14.572 9.953C14.284 9.968 13.972 9.851 13.802 9.709C13.538 9.487 13.348 9.363 13.27 8.977C13.236 8.812 13.254 8.556 13.284 8.41C13.352 8.094 13.277 7.892 13.054 7.708C12.874 7.558 12.643 7.516 12.39 7.516C12.296 7.516 12.209 7.475 12.144 7.441C12.039 7.389 11.952 7.257 12.035 7.096C12.062 7.043 12.19 6.916 12.22 6.893C12.564 6.698 12.96 6.762 13.326 6.908C13.666 7.047 13.922 7.302 14.292 7.663C14.67 8.098 14.738 8.218 14.952 8.545C15.122 8.801 15.277 9.063 15.383 9.364C15.447 9.551 15.364 9.705 15.142 9.799Z",fill:"currentColor';
  // 修正复制路径尾部的 SVG 属性污染，保留其余路径数据不变。
  WHALE = WHALE.replace('",fill:"currentColor', '');
  /* ---------------- frosted whale texture ---------------- */
  // 原始品牌路径缓存为半透明磨砂纹理；活动时只做轻微分片波动。
  var WHALE_UW = 23.6, WHALE_UH = 17.2;
  var MASK_GRID_W = 40, MASK_GRID_H = 29, WHALE_STRIPS = 64;
  var whaleStrips = [];
  for (var wsi = 0; wsi < WHALE_STRIPS; wsi++) whaleStrips.push(wsi);
  var whalePath = new Path2D(WHALE);
  var whaleTexture = document.createElement('canvas');
  whaleTexture.width = 708; whaleTexture.height = 516;
  var whaleTextureCtx = whaleTexture.getContext('2d');
  if (!whaleTextureCtx) { canvas.parentNode.removeChild(canvas); if (skyCanvas.parentNode) skyCanvas.parentNode.removeChild(skyCanvas); return function () {}; }
  var WHALE_WARP_PAD = 24, WHALE_WARP_WIDTH = 512;
  var WHALE_WARP_HEIGHT = Math.ceil(WHALE_WARP_WIDTH * WHALE_UH / WHALE_UW) + WHALE_WARP_PAD * 2;
  var whaleWarp = document.createElement('canvas');
  whaleWarp.width = WHALE_WARP_WIDTH;
  whaleWarp.height = WHALE_WARP_HEIGHT;
  var whaleWarpCtx = whaleWarp.getContext('2d');
  var whaleTextureKey = '';
  function paintWhaleTexture(rgb) {
    if (whaleTextureKey === rgb) return;
    whaleTextureCtx.clearRect(0, 0, whaleTexture.width, whaleTexture.height);
    whaleTextureCtx.save();
    var tk = whaleTexture.width / WHALE_UW;
    whaleTextureCtx.translate(0.223 * tk, 0.026 * tk);
    whaleTextureCtx.scale(tk, tk);
    if (rgb === '255,255,255') {
      whaleTextureCtx.fillStyle = 'rgb(255,255,255)';
      whaleTextureCtx.fill(whalePath);
    } else {
      whaleTextureCtx.save();
      whaleTextureCtx.clip(whalePath);
      var frost = whaleTextureCtx.createLinearGradient(0, 0, 0, WHALE_UH);
      frost.addColorStop(0, 'rgba(' + rgb + ',0.88)');
      frost.addColorStop(0.22, 'rgba(' + rgb + ',0.62)');
      frost.addColorStop(0.56, 'rgba(' + rgb + ',0.40)');
      frost.addColorStop(0.82, 'rgba(' + rgb + ',0.23)');
      frost.addColorStop(1, 'rgba(' + rgb + ',0.11)');
      whaleTextureCtx.fillStyle = frost;
      whaleTextureCtx.fillRect(0, 0, WHALE_UW, WHALE_UH);

      var sheen = whaleTextureCtx.createLinearGradient(0, 2.2, 0, 10.5);
      sheen.addColorStop(0, 'rgba(242,250,255,0.34)');
      sheen.addColorStop(0.34, 'rgba(229,244,255,0.18)');
      sheen.addColorStop(1, 'rgba(229,244,255,0)');
      whaleTextureCtx.fillStyle = sheen;
      whaleTextureCtx.fillRect(0, 0, WHALE_UW, 11);

      var edgeSheen = whaleTextureCtx.createLinearGradient(0, 0, 0, WHALE_UH);
      edgeSheen.addColorStop(0, 'rgba(240,250,255,0.22)');
      edgeSheen.addColorStop(0.38, 'rgba(232,246,255,0.10)');
      edgeSheen.addColorStop(0.76, 'rgba(226,242,255,0.035)');
      edgeSheen.addColorStop(1, 'rgba(226,242,255,0)');
      whaleTextureCtx.strokeStyle = edgeSheen;
      whaleTextureCtx.lineWidth = 0.07;
      whaleTextureCtx.stroke(whalePath);
      for (var pi = 0; pi < whaleParticles.length; pi++) {
        var particle = whaleParticles[pi];
        whaleTextureCtx.fillStyle = 'rgba(' + rgb + ',' + particle.alpha.toFixed(3) + ')';
        whaleTextureCtx.beginPath();
        whaleTextureCtx.arc(particle.x, particle.y, particle.radius, 0, 6.2832);
        whaleTextureCtx.fill();
      }
      whaleTextureCtx.restore();
    }
    whaleTextureCtx.restore();
    whaleTextureKey = rgb;
  }
  paintWhaleTexture('255,255,255');
  var maskCells = [];
  (function () {
    var px = whaleTextureCtx.getImageData(0, 0, whaleTexture.width, whaleTexture.height).data;
    for (var gy = 0; gy < MASK_GRID_H; gy++) {
      for (var gx = 0; gx < MASK_GRID_W; gx++) {
        var tx = Math.min(whaleTexture.width - 1, Math.floor((gx + 0.5) * whaleTexture.width / MASK_GRID_W));
        var ty = Math.min(whaleTexture.height - 1, Math.floor((gy + 0.5) * whaleTexture.height / MASK_GRID_H));
        var al = px[(ty * whaleTexture.width + tx) * 4 + 3];
        if (al > 176) maskCells.push({ gx: gx, gy: gy });
      }
    }
  })();
  maskCells.sort(function (a, b) {
    var ah = (((a.gx + 1) * 73856093) ^ ((a.gy + 1) * 19349663)) >>> 0;
    var bh = (((b.gx + 1) * 73856093) ^ ((b.gy + 1) * 19349663)) >>> 0;
    return ah - bh;
  });
  var whaleParticles = [];
  var particleCount = Math.min(32, maskCells.length, Math.max(20, Math.round(maskCells.length * 0.06)));
  for (var pidx = 0; pidx < particleCount; pidx++) {
    var cell = maskCells[Math.floor((pidx + 0.5) * maskCells.length / particleCount)];
    var seed = (((cell.gx + 1) * 73856093) ^ ((cell.gy + 1) * 19349663)) >>> 0;
    whaleParticles.push({
      x: (cell.gx + 0.5) * WHALE_UW / MASK_GRID_W + (((seed & 255) / 255) - 0.5) * (WHALE_UW / MASK_GRID_W) * 0.48,
      y: (cell.gy + 0.5) * WHALE_UH / MASK_GRID_H + ((((seed >>> 8) & 255) / 255) - 0.5) * (WHALE_UH / MASK_GRID_H) * 0.48,
      radius: 0.045 + ((seed >>> 16) & 7) / 7 * 0.075,
      alpha: 0.18 + ((seed >>> 20) & 7) / 7 * 0.23
    });
  }
  maskCells.length = 0;
  whaleTextureKey = '';
  /* ---------------- palette (follows theme) ---------------- */
  function pal() {
    var dark = document.body.hasAttribute('data-ds-dark-theme');
    return {
      waterTop: dark ? 'rgba(100,135,255,0.16)' : 'rgba(110,140,255,0.14)',
      waterMid: dark ? 'rgba(80,115,240,0.07)' : 'rgba(90,120,240,0.06)',
      waterBot: 'rgba(90,120,240,0)',
      surface: dark ? 'rgba(175,205,255,0.30)' : 'rgba(155,185,255,0.26)',
      bubble: dark ? '150,185,255' : '95,135,255',
      whale: dark ? '150,185,255' : '116,154,190',
      sunset: dark ? '132,161,204' : '217,150,108'
    };
  }
  function surfaceY() { return Math.max(88, Math.min(128, vh * 0.12)); }
  function skyX() { return Math.max(28, Math.min(vw * 0.75, vw - 170)); }
  function paintSunsetCache() {
    if (!sunsetCtx) return;
    var h = Math.min(220, Math.max(120, vh * 0.30));
    sunsetCanvas.width = Math.max(1, Math.ceil(vw * DPR));
    sunsetCanvas.height = Math.max(1, Math.ceil(h * DPR));
    sunsetCtx = sunsetCanvas.getContext('2d');
    if (!sunsetCtx) return;
    var dark = document.body.hasAttribute('data-ds-dark-theme');
    var sw = sunsetCanvas.width, sh = sunsetCanvas.height;
    sunsetCtx.clearRect(0, 0, sw, sh);
    var sky = sunsetCtx.createLinearGradient(0, 0, 0, sh);
    sky.addColorStop(0, dark ? 'rgba(93,119,162,0.14)' : 'rgba(224,174,145,0.13)');
    sky.addColorStop(0.44, dark ? 'rgba(74,91,124,0.10)' : 'rgba(197,203,211,0.10)');
    sky.addColorStop(1, dark ? 'rgba(62,75,101,0)' : 'rgba(150,180,211,0)');
    sunsetCtx.fillStyle = sky;
    sunsetCtx.fillRect(0, 0, sw, sh);
    var cx = skyX() * DPR;
    var cy = 20 * DPR;
    function glow(rx, ry, color) {
      sunsetCtx.save();
      sunsetCtx.translate(cx, cy);
      sunsetCtx.scale(1, ry / rx);
      sunsetCtx.fillStyle = color;
      sunsetCtx.beginPath(); sunsetCtx.arc(0, 0, rx * DPR, 0, 6.2832); sunsetCtx.fill();
      sunsetCtx.restore();
    }
    if (typeof sunsetCtx.createRadialGradient === 'function') {
      sunsetCtx.save();
      sunsetCtx.translate(cx, cy);
      sunsetCtx.scale(1, 0.54);
      var halo = sunsetCtx.createRadialGradient(0, 0, 4 * DPR, 0, 0, 58 * DPR);
      halo.addColorStop(0, dark ? 'rgba(137,169,218,0.18)' : 'rgba(244,181,131,0.22)');
      halo.addColorStop(0.42, dark ? 'rgba(108,140,190,0.07)' : 'rgba(235,164,116,0.08)');
      halo.addColorStop(1, dark ? 'rgba(108,140,190,0)' : 'rgba(235,164,116,0)');
      sunsetCtx.fillStyle = halo;
      sunsetCtx.fillRect(-58 * DPR, -58 * DPR, 116 * DPR, 116 * DPR);
      sunsetCtx.restore();
    } else {
      glow(42, 24, dark ? 'rgba(108,140,190,0.055)' : 'rgba(235,164,116,0.060)');
      glow(26, 15, dark ? 'rgba(137,169,218,0.085)' : 'rgba(244,181,131,0.080)');
    }
    if (dark) {
      sunsetCtx.fillStyle = 'rgba(215,229,248,0.84)';
      sunsetCtx.save();
      sunsetCtx.translate(cx - 16 * DPR, cy - 16 * DPR);
      sunsetCtx.scale(DPR, DPR);
      sunsetCtx.fill(new Path2D('M21.4 3.1A13 13 0 1 0 28.9 21.5A11.1 11.1 0 0 1 21.4 3.1Z'));
      sunsetCtx.restore();
    } else {
      var sun = sunsetCtx.createLinearGradient(0, cy - 14 * DPR, 0, cy + 14 * DPR);
      sun.addColorStop(0, 'rgba(255,226,184,0.82)');
      sun.addColorStop(1, 'rgba(233,164,107,0.62)');
      sunsetCtx.fillStyle = sun;
      sunsetCtx.beginPath(); sunsetCtx.arc(cx, cy, 13 * DPR, 0, 6.2832); sunsetCtx.fill();
    }
  }
  function drawSkyBirds(target, now) {
    var safeLeft = 210, safeRight = vw - 170;
    if (safeRight - safeLeft < 90 || document.body.hasAttribute('data-ds-dark-theme')) return;
    var t = reduced ? 0 : now;
    target.save();
    target.scale(DPR, DPR);
    target.strokeStyle = 'rgba(78,91,111,0.62)';
    target.lineWidth = 1.25;
    target.lineCap = 'round';
    for (var bi = 0; bi < 3; bi++) {
      var span = safeRight - safeLeft;
      var x = safeLeft + ((t * (0.008 + bi * 0.002) + bi * span * 0.39) % span);
      var y = 10 + bi * 8 + Math.sin(t * 0.001 + bi * 1.8) * 1.2;
      var flap = reduced ? 1.8 : Math.sin(t * 0.0032 + bi * 1.7) * 1.8;
      target.beginPath();
      target.moveTo(x - 7, y + flap);
      target.quadraticCurveTo(x - 3.5, y - 1.8 - flap, x, y);
      target.quadraticCurveTo(x + 3.5, y - 1.8 + flap, x + 7, y + flap);
      target.stroke();
    }
    target.restore();
  }
  var whaleW = Math.min(380, vw * 0.34);
  var whaleLaneRatio = vh < 760 ? 0.60 : 0.74;
  var whale = { x: vw * 0.36, bandY: vh * whaleLaneRatio, y: vh * whaleLaneRatio, amp: vh * 0.065, ph: Math.random() * 6.283, dir: 1, speed: 28, flee: 0, fvx: 0, fvy: 0, tvx: 0, tvy: 0, fleeLevel: 0, cool: 0, turn: 0, turnDir: 0, turnScale: 1, tilt: 0, pathVy: 0 };
  function whaleWave(xn, now) {
    if (reduced || !whaleWarpCtx) return 0;
    xn = Math.max(0, Math.min(1, xn));
    var envelope = Math.pow(xn, 1.65);
    var phase = now * 0.001745 - xn * 5.4 + whale.ph;
    return whaleW * 0.043 * envelope * Math.sin(phase);
  }
  function resize() {
    var oldW = vw || window.innerWidth, oldH = vh || window.innerHeight;
    var nx = whale ? whale.x / oldW : 0.30, ny = whale ? whale.bandY / oldH : 0.60;
    vw = window.innerWidth; vh = window.innerHeight;
    whaleLaneRatio = vh < 760 ? 0.60 : 0.74;
    DPR = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.floor(vw * DPR);
    canvas.height = Math.floor(vh * DPR);
    skyCanvas.width = Math.max(1, Math.ceil(vw * DPR));
    skyCanvas.height = Math.max(1, Math.ceil(40 * DPR));
    skyCtx = skyCanvas.getContext('2d');
    titlebarSky = hasTitlebarSky() && !!skyCtx;
    skyCanvas.style.display = titlebarSky ? 'block' : 'none';
    updateSidebarBounds();
    paintSunsetCache();
    whaleW = Math.min(380, vw * 0.34);
    if (whale) {
      var leftSafe = vw >= 900 ? Math.min(280, vw * 0.20) : 0;
      whale.x = Math.max(leftSafe + whaleW * 0.5, Math.min(vw - whaleW * 0.5, nx * vw));
      whale.bandY = Math.max(vh * 0.56, Math.min(vh * 0.80, ny * vh));
      whale.amp = vh * 0.065;
      whale.y = whale.bandY;
    }
  }
  resize();
  initSidebarWater();
  __on(window, 'resize', function () { resize(); draw(simTime, 0); });
  __on(document, 'fullscreenchange', function () { resize(); draw(simTime, 0); });
  var paused = typeof document.hasFocus === 'function' && !document.hasFocus();
  __on(window, 'blur', function () { paused = true; syncAnimation(); });
  __on(window, 'focus', function () { paused = false; syncAnimation(); });
  __on(document, 'visibilitychange', syncAnimation);
  /* ---------------- bubbles ---------------- */
  var BUB_CAP = 90;
  var bubbles = [];
  var pops = [];
  var bubbleSeq = 0;
  var mouse = { x: -9999, y: -9999 };
  __on(window, 'mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  function newBubble(x, y, fast) {
    var b = {
      id: ++bubbleSeq,
      bx: x, y: y,
      r: fast ? 2.6 + Math.random() * 5.4 : 3.2 + Math.random() * 6.8,
      vr: fast ? 0.048 + Math.random() * 0.042 : 0.020 + Math.random() * 0.026,
      vx: (Math.random() - 0.5) * 0.004,
      wob: 4 + Math.random() * 10,
      wp: 0.75 + Math.random() * 1.45,
      ph: Math.random() * 6.283,
      a: fast ? 0.22 + Math.random() * 0.12 : 0.14 + Math.random() * 0.12,
      age: Math.random() * 8000,
      born: fast ? 0 : 900,
      hitCd: 0,
      morph: 0,
      morphDur: 220,
      dead: 0
    };
    b.vr = b.vr * (0.72 + b.r / 8);
    return b;
  }
  function spawnAmbient() {
    if (bubbles.length >= BUB_CAP) return;
    bubbles.push(newBubble(Math.random() * vw, vh + 8 + Math.random() * 30, false));
  }
  function burst(x, y, n) {
    for (var i = 0; i < n; i++) {
      if (bubbles.length >= BUB_CAP) break;
      bubbles.push(newBubble(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 10, true));
    }
  }
  for (var si = 0; si < 68; si++) bubbles.push(newBubble(Math.random() * vw, Math.random() * vh, false));
  var bubbleSpawnCarry = 0;
  /* ---------------- whale ---------------- */
  function startWhaleTurn() {
    if (whale.turn > 0) return;
    whale.turn = 720;
    whale.turnDir = -whale.dir;
    whale.speed = 0;
  }
  function updateWhale(dt, now) {
    var half = whaleW * 0.5;
    var leftSafe = vw >= 900 ? Math.min(280, vw * 0.20) : 0;
    var minX = leftSafe + half, maxX = Math.max(minX, vw - half);
    var mx = whale.x - mouse.x, my = whale.y - mouse.y;
    var md = Math.sqrt(mx * mx + my * my);
    if (mouse.x > -9000 && md < 170 && now > whale.cool && whale.flee <= 0) {
      whale.cool = now + 3200;
      whale.flee = 1500;
      whale.turn = 0; whale.turnDir = 0; whale.turnScale = 1;
      var ang = md > 0.001 ? Math.atan2(my, mx) : (whale.dir > 0 ? Math.PI : 0);
      var fleeSpeed = Math.min(140, 55 + 85 * (1 - md / 170));
      whale.tvx = Math.cos(ang) * fleeSpeed;
      whale.tvy = Math.sin(ang) * fleeSpeed;
      if (Math.abs(whale.tvx) > 0.5) whale.dir = whale.tvx > 0 ? 1 : -1;
      // 吐泡锚点随镜像后的头部移动（路径头朝左，dir=+1 时镜像到右侧）。
      burst(whale.x + whale.dir * whaleW * 0.47, whale.y - whaleW * WHALE_UH / WHALE_UW * 0.34, 7);
    }
    var fleeTarget = whale.flee > 0 ? 1 : 0;
    whale.fleeLevel += (fleeTarget - whale.fleeLevel) * (1 - Math.exp(-dt / 180));
    if (whale.flee > 0) whale.flee -= dt;
    // 受惊速度指数衰减并平滑接近目标，始终封顶 140px/s。
    var decay = Math.pow(0.13, dt / 1100);
    whale.tvx *= decay; whale.tvy *= decay;
    var ease = 1 - Math.exp(-dt / 120);
    whale.fvx += (whale.tvx - whale.fvx) * ease;
    whale.fvy += (whale.tvy - whale.fvy) * ease;
    var fv = Math.sqrt(whale.fvx * whale.fvx + whale.fvy * whale.fvy);
    if (fv > 140) { whale.fvx *= 140 / fv; whale.fvy *= 140 / fv; }
    whale.x += whale.fvx * dt / 1000;
    whale.bandY += whale.fvy * dt / 1000;
    if (whale.flee <= 0) {
      whale.bandY += (vh * whaleLaneRatio - whale.bandY) * (1 - Math.exp(-dt / 1800));
      if (whale.turn > 0) {
        whale.turn = Math.max(0, whale.turn - dt);
        var turnPhase = 1 - whale.turn / 720;
        if (turnPhase >= 0.5 && whale.turnDir) { whale.dir = whale.turnDir; whale.turnDir = 0; }
        whale.turnScale = 0.18 + 0.82 * Math.abs(Math.cos(turnPhase * Math.PI));
        whale.speed += (0 - whale.speed) * (1 - Math.exp(-dt / 90));
      } else {
        whale.turnScale += (1 - whale.turnScale) * (1 - Math.exp(-dt / 180));
        var edgeDist = whale.dir > 0 ? maxX - whale.x : whale.x - minX;
        var edgeRatio = Math.max(0, Math.min(1, edgeDist / Math.max(1, whaleW * 0.46)));
        var smoothEdge = edgeRatio * edgeRatio * (3 - 2 * edgeRatio);
        var targetSpeed = 28 * (0.06 + 0.94 * smoothEdge);
        whale.speed += (targetSpeed - whale.speed) * (1 - Math.exp(-dt / 360));
        whale.x += whale.dir * whale.speed * dt / 1000;
        if ((whale.dir > 0 && whale.x >= maxX - 1) || (whale.dir < 0 && whale.x <= minX + 1)) startWhaleTurn();
      }
    }
    // 受惊时朝向跟随水平速度；常规转身只在最窄相位翻面，避免镜像跳变。
    if (whale.flee > 0 && whale.turn <= 0 && Math.abs(whale.fvx) > 0.5) whale.dir = whale.fvx > 0 ? 1 : -1;
    if (whale.x < minX) { whale.x = minX; if (whale.flee > 0 && whale.fvx < 0) whale.fvx *= -0.25; else startWhaleTurn(); }
    if (whale.x > maxX) { whale.x = maxX; if (whale.flee > 0 && whale.fvx > 0) whale.fvx *= -0.25; else startWhaleTurn(); }
    var laneRate = 0.00062;
    var lanePhase = now * laneRate + whale.ph;
    whale.pathVy = Math.cos(lanePhase) * whale.amp * laneRate * 1000 + whale.fvy;
    whale.y = whale.bandY + Math.sin(lanePhase) * whale.amp;
    var whaleH = whaleW * WHALE_UH / WHALE_UW;
    var safeTop = Math.max(vh * 0.27, whaleH * 0.5 + 14);
    var safeBottom = Math.max(safeTop, vh - whaleH * 0.5 - 18);
    if (whale.y < safeTop) { whale.y = safeTop; whale.bandY = safeTop - Math.sin(lanePhase) * whale.amp; whale.pathVy = 0; }
    if (whale.y > safeBottom) { whale.y = safeBottom; whale.bandY = safeBottom - Math.sin(lanePhase) * whale.amp; whale.pathVy = 0; }
    var tiltTarget;
    if (whale.fleeLevel > 0.05) tiltTarget = whale.dir * Math.atan2(whale.fvy, Math.abs(whale.fvx) + 10) * 0.28;
    else tiltTarget = whale.dir * Math.atan2(whale.pathVy, Math.max(24, whale.speed)) * 0.22;
    tiltTarget = Math.max(-0.15, Math.min(0.15, tiltTarget));
    whale.tilt += (tiltTarget - whale.tilt) * (1 - Math.exp(-dt / 220));
  }
  function bubbleX(b) {
    return b.bx + Math.sin(b.age * 0.001 * b.wp + b.ph) * b.wob;
  }
  // 34px 空间网格：只检查九宫格近邻，融合面积守恒；未融合则柔和侧滑。
  function collideBubbles() {
    var cellSize = 34;
    var grid = {};
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      if (b.dead || b.born < 160) continue;
      var bx = bubbleX(b);
      var cx = Math.floor(bx / cellSize), cy = Math.floor(b.y / cellSize);
      var merged = false;
      for (var oy = -1; oy <= 1 && !merged; oy++) {
        for (var ox = -1; ox <= 1 && !merged; ox++) {
          var bucket = grid[(cx + ox) + ',' + (cy + oy)];
          if (!bucket) continue;
          for (var bi = 0; bi < bucket.length; bi++) {
            var o = bucket[bi];
            if (o.dead || b.hitCd > b.age || o.hitCd > o.age) continue;
            var obx = bubbleX(o);
            var dx = bx - obx, dy = b.y - o.y;
            var touch = (b.r + o.r) * 0.94;
            var d2 = dx * dx + dy * dy;
            if (d2 >= touch * touch) continue;
            var nr = Math.sqrt(b.r * b.r + o.r * o.r);
            if (nr <= 15.5 && Math.random() < 0.70) {
              var ba = b.r * b.r, oa = o.r * o.r, area = ba + oa;
              var mergedX = (bx * ba + obx * oa) / area;
              o.bx = mergedX - Math.sin(o.age * 0.001 * o.wp + o.ph) * o.wob;
              o.y = (b.y * ba + o.y * oa) / area;
              o.vx = (b.vx * ba + o.vx * oa) / area;
              o.vr = ((b.vr * ba + o.vr * oa) / area) * 1.06;
              o.a = (b.a * ba + o.a * oa) / area;
              o.wob = Math.max(3, ((b.wob * ba + o.wob * oa) / area) * 0.82);
              o.wp = (b.wp * ba + o.wp * oa) / area;
              o.r = nr;
              o.morph = o.morphDur = 220;
              o.hitCd = o.age + 240;
              o.born = Math.max(o.born, b.born);
              b.dead = 1;
              merged = true;
              break;
            }
            var dist = Math.sqrt(d2);
            var nx = dist > 0.001 ? dx / dist : (b.id % 2 ? 1 : -1);
            var ny = dist > 0.001 ? dy / dist : 0;
            var push = Math.max(0.4, (touch - dist) * 0.42);
            var totalArea = b.r * b.r + o.r * o.r;
            var bm = o.r * o.r / totalArea, om = b.r * b.r / totalArea;
            b.bx += nx * push * bm; b.y += ny * push * bm;
            o.bx -= nx * push * om; o.y -= ny * push * om;
            b.vx = Math.max(-0.018, Math.min(0.018, b.vx + nx * 0.0018 * bm));
            o.vx = Math.max(-0.018, Math.min(0.018, o.vx - nx * 0.0018 * om));
            b.hitCd = b.age + 200; o.hitCd = o.age + 200;
          }
        }
      }
      if (!merged) {
        var key = cx + ',' + cy;
        if (!grid[key]) grid[key] = [];
        grid[key].push(b);
      }
    }
    for (var ri = bubbles.length - 1; ri >= 0; ri--) if (bubbles[ri].dead) bubbles.splice(ri, 1);
  }
  function updateBubbles(dt) {
    var surf = surfaceY();
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.age += dt;
      b.born += dt;
      b.morph = Math.max(0, b.morph - dt);
      b.bx += b.vx * dt;
      b.vx *= Math.pow(0.38, dt / 1000);
      b.y -= b.vr * dt;
      var edgePad = b.r + 3;
      if (b.bx < edgePad) { b.bx = edgePad; b.vx = Math.abs(b.vx) * 0.35; }
      if (b.bx > vw - edgePad) { b.bx = vw - edgePad; b.vx = -Math.abs(b.vx) * 0.35; }
      if (mouse.x > -9000) {
        var dx = b.bx + Math.sin(b.age * 0.001 * b.wp + b.ph) * b.wob - mouse.x;
        var dy = b.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 4900) {
          var dd = Math.sqrt(d2) || 1;
          b.bx += (dx / dd) * 1.2 * dt / 16;
        }
      }
      if (b.y < surf) {
        pops.push({ x: b.bx + Math.sin(b.age * 0.001 * b.wp + b.ph) * b.wob, y: surf, r: b.r, life: 0, phase: b.ph });
        bubbles.splice(i, 1);
      }
    }
    collideBubbles();
    // 以时间预算补充到 60-90 枚，避免帧率改变上升速度或数量。
    bubbleSpawnCarry += dt * 0.014;
    while (bubbleSpawnCarry >= 1 && bubbles.length < BUB_CAP) {
      bubbleSpawnCarry -= 1;
      spawnAmbient();
    }
  }
  // 水面带参数：基准、厚度、振幅、相位、透明度、角速度；主周期控制在 5-8 秒。
  function drawSurfaceBand(P, now, baseY, thickness, amp, phase, alpha, speed) {
    var step = 28;
    var x, topY, bottomY;
    var travel = now * speed + phase;
    var heave = Math.sin(now * speed * 0.76 + phase) * amp * 0.34;
    ctx.beginPath();
    for (x = -step; x <= vw + step; x += step) {
      topY = baseY + heave
        + Math.sin(x * 0.0074 - travel) * amp
        + Math.sin(x * 0.0162 + travel * 0.68 + phase) * amp * 0.28;
      if (x === -step) ctx.moveTo(x * DPR, topY * DPR); else ctx.lineTo(x * DPR, topY * DPR);
    }
    for (x = vw + step; x >= -step; x -= step) {
      bottomY = baseY + thickness + heave * 0.72
        + Math.sin(x * 0.0061 + travel * 0.78 + phase + 1.25) * amp * 0.46
        + Math.sin(x * 0.0134 - travel * 0.52 + phase * 0.6) * amp * 0.20;
      ctx.lineTo(x * DPR, bottomY * DPR);
    }
    ctx.closePath();
    var bandG = ctx.createLinearGradient(0, (baseY - amp) * DPR, 0, (baseY + thickness + amp) * DPR);
    bandG.addColorStop(0, 'rgba(' + P.bubble + ',0)');
    bandG.addColorStop(0.42, 'rgba(' + P.bubble + ',' + alpha.toFixed(3) + ')');
    bandG.addColorStop(1, 'rgba(' + P.bubble + ',0)');
    ctx.fillStyle = bandG;
    ctx.fill();
  }
  function draw(now, dt) {
    var P = pal();
    var surf = vh * 0.12;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var wg = ctx.createLinearGradient(0, 0, 0, vh * DPR);
    wg.addColorStop(0, P.waterTop); wg.addColorStop(0.45, P.waterMid); wg.addColorStop(1, P.waterBot);
    ctx.fillStyle = wg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (sunsetCanvas.width && sunsetCanvas.height) ctx.drawImage(sunsetCanvas, 0, 0);
    if (titlebarSky && skyCtx) {
      skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
      if (sunsetCanvas.width && sunsetCanvas.height) {
        skyCtx.drawImage(sunsetCanvas, 0, 0, skyCanvas.width, skyCanvas.height,
          0, 0, skyCanvas.width, skyCanvas.height);
      }
      drawSkyBirds(skyCtx, now);
    } else {
      drawSkyBirds(ctx, now);
    }
    // 水面参数：光晕延伸约 1.8 倍水面高度；两层波带保持低透明并错相缓移。
    var sh = Math.min(vh * 0.24, surf * 1.82) * DPR;
    var sg = ctx.createLinearGradient(0, 0, 0, sh);
    sg.addColorStop(0, P.surface);
    sg.addColorStop(0.34, 'rgba(' + P.bubble + ',0.075)');
    sg.addColorStop(0.72, 'rgba(' + P.bubble + ',0.025)');
    sg.addColorStop(1, 'rgba(' + P.bubble + ',0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, canvas.width, sh);
    drawSurfaceBand(P, now, surf - 7, 13, 5.8, 0.35, 0.074, 0.00105);
    drawSurfaceBand(P, now, surf + 11, 19, 4.8, 2.15, 0.050, -0.00082);
    // 少量断续反光：短弧错落分布并以不同速度漂移，不形成连续平行线。
    var glints = [0.08, 0.36, 0.64, 0.92];
    var glintRange = vw + 160;
    ctx.lineCap = 'round';
    for (var gi = 0; gi < glints.length; gi++) {
      var drift = now * (0.0080 + (gi % 3) * 0.0018) * (gi % 2 ? -1 : 1);
      var gx = ((glints[gi] * glintRange + drift) % glintRange + glintRange) % glintRange - 80;
      var gw = 24 + (gi % 3) * 13;
      var gy = surf - 4 + Math.sin(gx * 0.007 + now * (0.00082 + (gi % 2) * 0.00018) + gi * 1.31) * (4 + (gi % 2) * 2);
      ctx.strokeStyle = 'rgba(' + P.bubble + ',' + (0.125 - (gi % 3) * 0.015).toFixed(3) + ')';
      ctx.lineWidth = (0.72 + (gi % 2) * 0.18) * DPR;
      ctx.beginPath();
      ctx.moveTo(gx * DPR, gy * DPR);
      ctx.quadraticCurveTo((gx + gw * 0.48) * DPR, (gy - 3.2 - (gi % 2) * 1.6) * DPR, (gx + gw) * DPR, (gy + 0.8) * DPR);
      ctx.stroke();
    }
    // Eight sun/moon reflections stay in the narrow sky-to-water band.
    var sunX = skyX();
    var reflectBottom = Math.max(1, surf - 5);
    var reflectTop = titlebarSky ? 44 : Math.min(44, Math.max(0, surf * 0.30));
    if (reflectBottom < reflectTop + 6) reflectTop = Math.max(0, reflectBottom - 10);
    if (reflectBottom > reflectTop) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, reflectTop * DPR, vw * DPR, (reflectBottom - reflectTop) * DPR);
      ctx.clip();
      for (var ri = 0; ri < 8; ri++) {
        var phase = now * 0.00062 + ri * 1.43;
        var width = 20 + ri * (58 / 7);
        var rx = sunX - width * 0.5 + Math.sin(phase) * 8;
        var yn = (ri + 0.5) / 8;
        var ry = reflectTop + yn * (reflectBottom - reflectTop) + Math.sin(phase * 0.8) * Math.min(1, (reflectBottom - reflectTop) * 0.04);
        var opacity = 0.22 - ri * (0.16 / 7);
        ctx.strokeStyle = 'rgba(' + P.sunset + ',' + opacity.toFixed(3) + ')';
        ctx.lineWidth = 1 * DPR;
        ctx.beginPath();
        ctx.moveTo(rx * DPR, ry * DPR);
        ctx.quadraticCurveTo((rx + width * 0.5) * DPR, (ry - 1.2 + Math.sin(phase) * 0.8) * DPR, (rx + width) * DPR, (ry + 0.7) * DPR);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.lineCap = 'butt';
    var whaleH = whaleW * WHALE_UH / WHALE_UW;
    ctx.save();
    ctx.translate(whale.x * DPR, whale.y * DPR);
    ctx.rotate(whale.tilt);
    ctx.scale(-whale.dir * whale.turnScale, 1);
    paintWhaleTexture(P.whale);
    ctx.globalAlpha = 0.15 + whale.fleeLevel * 0.02;
    if (reduced || !whaleWarpCtx) {
      ctx.drawImage(whaleTexture, -whaleW * 0.5 * DPR, -whaleH * 0.5 * DPR, whaleW * DPR, whaleH * DPR);
    } else {
      whaleWarpCtx.clearRect(0, 0, WHALE_WARP_WIDTH, WHALE_WARP_HEIGHT);
      whaleWarpCtx.globalAlpha = 1;
      var srcStrip = whaleTexture.width / WHALE_STRIPS;
      for (var wi = 0; wi < whaleStrips.length; wi++) {
        var strip = whaleStrips[wi];
        var srcLeft = Math.max(0, strip * srcStrip - 1);
        var srcRight = Math.min(whaleTexture.width, (strip + 1) * srcStrip + 1);
        var dstLeft = Math.max(0, srcLeft / whaleTexture.width * WHALE_WARP_WIDTH - (strip > 0 ? 0.55 : 0));
        var dstRight = Math.min(WHALE_WARP_WIDTH, srcRight / whaleTexture.width * WHALE_WARP_WIDTH + (strip < WHALE_STRIPS - 1 ? 0.55 : 0));
        var stripXn = (strip + 0.5) / WHALE_STRIPS;
        var stripOffset = whaleWave(stripXn, now) / whaleW * WHALE_WARP_WIDTH;
        var bandWidth = WHALE_WARP_WIDTH / WHALE_STRIPS;
        whaleWarpCtx.save();
        whaleWarpCtx.beginPath();
        whaleWarpCtx.rect(strip * bandWidth, 0, bandWidth, WHALE_WARP_HEIGHT);
        whaleWarpCtx.clip();
        whaleWarpCtx.drawImage(whaleTexture, srcLeft, 0, srcRight - srcLeft, whaleTexture.height,
          dstLeft, WHALE_WARP_PAD + stripOffset,
          dstRight - dstLeft, WHALE_WARP_WIDTH * whaleTexture.height / whaleTexture.width);
        whaleWarpCtx.restore();
      }
      var padScale = WHALE_WARP_PAD * whaleW / WHALE_WARP_WIDTH;
      ctx.drawImage(whaleWarp,
        -whaleW * 0.5 * DPR, (-whaleH * 0.5 - padScale) * DPR,
        whaleW * DPR, WHALE_WARP_HEIGHT * whaleW / WHALE_WARP_WIDTH * DPR);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    for (var j = 0; j < bubbles.length; j++) {
      var b = bubbles[j];
      var bx = bubbleX(b);
      var prog = Math.min(1, (vh - b.y) / vh);
      var rr = b.r * (1 + 0.18 * prog);
      var centerBand = Math.abs(bx / vw - 0.5) < 0.16;
      var alpha = b.a * (centerBand ? 0.66 : 1);
      var appear = Math.min(1, b.born / 650);
      var bottomFade = b.y > vh * 0.92 ? Math.max(0, (vh - b.y) / (vh * 0.08)) : 1;
      alpha *= appear * bottomFade;
      var morphEnv = b.morph > 0 ? Math.sin(Math.PI * (1 - b.morph / b.morphDur)) : 0;
      var morphScale = 1 + morphEnv * 0.13 * Math.sin(b.age * 0.020 + b.ph);
      ctx.save();
      ctx.translate(bx * DPR, b.y * DPR);
      ctx.scale(morphScale, 1 / morphScale);
      ctx.fillStyle = 'rgba(' + P.bubble + ',' + (alpha * 0.10).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(0, 0, rr * DPR, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(' + P.bubble + ',' + (alpha * 0.88).toFixed(3) + ')';
      ctx.lineWidth = (0.68 + rr * 0.032) * DPR;
      ctx.beginPath(); ctx.arc(0, 0, rr * DPR, 0, 6.2832); ctx.stroke();
      // 玻璃高光：小泡只保留柔和外圈；较大泡使用偏心短弧，不再绘制实心圆点。
      if (rr >= 5.0) {
        ctx.strokeStyle = 'rgba(' + P.bubble + ',' + (alpha * 0.92).toFixed(3) + ')';
        ctx.lineWidth = Math.min(1.15, 0.58 + rr * 0.055) * DPR;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-rr * 0.09 * DPR, -rr * 0.08 * DPR, rr * 0.62 * DPR, 3.48, 4.42);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
      ctx.restore();
    }
    for (var q = pops.length - 1; q >= 0; q--) {
      var pp = pops[q];
      pp.life += dt;
      var pr = pp.r + pp.life * 0.022;
      var pa = Math.max(0, 0.26 * (1 - pp.life / 520));
      if (pa <= 0) { pops.splice(q, 1); continue; }
      ctx.strokeStyle = 'rgba(' + P.bubble + ',' + pa.toFixed(3) + ')';
      ctx.lineWidth = 0.9 * DPR;
      ctx.beginPath(); ctx.arc(pp.x * DPR, pp.y * DPR, pr * DPR, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = 'rgba(' + P.bubble + ',' + (pa * 0.55).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(pp.x * DPR, pp.y * DPR, (pr * 0.58 + Math.sin(pp.life * 0.006 + pp.phase) * 1.2) * DPR, 0, 6.2832); ctx.stroke();
    }
    paintSidebarWater();
  }
  var simTime = 0;
  var lastT = 0;
  var backgroundFrame = null;
  function step(ts) {
    backgroundFrame = null;
    if (__disposed || document.hidden || paused || reduced) return;
    if (!lastT) lastT = ts;
    if (ts - lastT >= 41) {
      var dt = Math.min(Math.max(ts - lastT, 0), 66);
      lastT = ts;
      simTime += dt;
      updateWhale(dt, simTime);
      updateBubbles(dt);
      draw(simTime, dt);
      drawButtonWhales(simTime, true);
    }
    backgroundFrame = requestAnimationFrame(step);
  }
  function syncAnimation() {
    if (backgroundFrame !== null) cancelAnimationFrame(backgroundFrame);
    backgroundFrame = null;
    lastT = 0;
    if (__disposed) return;
    if (reduced) { draw(simTime, 0); drawButtonWhales(simTime, false); }
    else if (!document.hidden && !paused) {
      drawButtonWhales(simTime, false);
      backgroundFrame = requestAnimationFrame(step);
    }
  }
  function onMotionChange() { reduced = !!motionQuery.matches; syncAnimation(); }
  if (motionQuery) {
    if (motionQuery.addEventListener) __on(motionQuery, 'change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
  }
  draw(simTime, 0);
  syncAnimation();
/* ==== Send-button dot-matrix whale (static, updated on DOM changes) ==== */
  var BGW = 20, BGH = 15;
  var bCells = [];
  (function () {
    var bs = document.createElement('canvas');
    bs.width = BGW * 2; bs.height = BGH * 2;
    var bsc = bs.getContext('2d');
    if (!bsc) return;
    bsc.fillStyle = '#fff';
    var bp = new Path2D(WHALE);
    var bk = Math.min((BGW * 2 - 2) / 23.16, (BGH * 2 - 2) / 17.04);
    bsc.translate(((BGW * 2) - 23.16 * bk) / 2, ((BGH * 2) - 17.04 * bk) / 2);
    bsc.scale(bk, bk);
    bsc.fill(bp);
    var bpix = bsc.getImageData(0, 0, BGW * 2, BGH * 2).data;
    for (var by = 0; by < BGH; by++) {
      for (var bx = 0; bx < BGW; bx++) {
        var ba = bpix[((by * 2 + 1) * BGW * 2 + (bx * 2 + 1)) * 4 + 3];
        if (ba > 128) {
          var yb = (by + 0.5) / BGH;
          var cr = Math.round(255 + (175 - 255) * yb);
          var cg = Math.round(255 + (215 - 255) * yb);
          bCells.push({ gx: bx, gy: by, rgb: cr + ',' + cg + ',255' });
        }
      }
    }
  })();
  var buttonSelector = '[data-composer-card] button[class*="_primary"]';
  var ownedButtons = [];
  var buttonUpdateQueued = false;
  function removeButtonWhale(btn) {
    var cvs = btn.__dshWhaleCanvas;
    if (cvs && cvs.parentNode) cvs.parentNode.removeChild(cvs);
    btn.removeAttribute('data-dsh-whale-attached');
    delete btn.__dshWhaleCanvas;
    delete btn.__dshWhaleRunning;
    delete btn.__lastRunning;
  }
  function paintButtonWhale(cvs, running, now) {
    running = !!running && !reduced;
    if (!bCells.length) return false;
    var c2 = cvs.getContext('2d');
    if (!c2) return false;
    c2.clearRect(0, 0, cvs.width, cvs.height);
    var pitch = cvs.width * 0.82 / BGW;
    var t = now * 0.0052;
    var bob = running ? Math.sin(now * 0.0022) * 1.6 : 0;
    for (var i = 0; i < bCells.length; i++) {
      var c = bCells[i];
      c2.fillStyle = 'rgba(' + c.rgb + ',0.92)';
      c2.beginPath();
      var xn = (c.gx + 0.5) / BGW;
      var dy = (c.gy + 0.5 - BGH / 2) * pitch;
      if (running) dy += Math.pow(xn, 1.35) * 4 * Math.sin(t - xn * 6.5) + bob;
      c2.arc(cvs.width / 2 + (c.gx + 0.5 - BGW / 2) * pitch,
        cvs.height / 2 + dy, pitch * 0.38, 0, 6.2832);
      c2.fill();
    }
    return true;
  }
  function updateButtons() {
    buttonUpdateQueued = false;
    if (__disposed) return;
    var buttons = Array.from(document.querySelectorAll(buttonSelector));
    ownedButtons = ownedButtons.filter(function (btn) {
      if (buttons.indexOf(btn) >= 0) return true;
      removeButtonWhale(btn);
      return false;
    });
    buttons.forEach(function (btn) {
      var cvs = btn.__dshWhaleCanvas;
      if (!cvs || cvs.parentNode !== btn) {
        removeButtonWhale(btn);
        cvs = document.createElement('canvas');
        cvs.setAttribute('data-dsh-whale-canvas', '');
        cvs.setAttribute('aria-hidden', 'true');
        cvs.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3';
        cvs.width = 68; cvs.height = 68;
        // Paint before hiding the native icon, even if initialization happens
        // in a blurred window. This is one static draw, not an animation loop.
        if (!paintButtonWhale(cvs, false, 0)) return;
        cvs.__dshWhalePainted = true;
        btn.appendChild(cvs);
        btn.__dshWhaleCanvas = cvs;
        btn.setAttribute('data-dsh-whale-attached', '');
        if (ownedButtons.indexOf(btn) < 0) ownedButtons.push(btn);
      }
      var svg = btn.querySelector('svg');
      var running = !!(svg && svg.querySelector('rect'));
      var changed = btn.__dshWhaleRunning !== running;
      btn.__dshWhaleRunning = running;
      cvs.style.display = '';
      if ((changed || !cvs.__dshWhalePainted) && !document.hidden && !paused) {
        paintButtonWhale(cvs, running, simTime);
        cvs.__dshWhalePainted = true;
      }
    });
  }
  function drawButtonWhales(now, runningOnly) {
    if (__disposed || document.hidden || paused || !ownedButtons) return;
    for (var i = 0; i < ownedButtons.length; i++) {
      var btn = ownedButtons[i];
      if (runningOnly && !btn.__dshWhaleRunning) continue;
      var cvs = btn.__dshWhaleCanvas;
      if (!cvs || cvs.parentNode !== btn) continue;
      paintButtonWhale(cvs, !!btn.__dshWhaleRunning, now);
      cvs.__dshWhalePainted = true;
    }
  }
  function isButton(node) {
    return node && node.tagName === 'BUTTON' && String(node.className).indexOf('_primary') >= 0;
  }
  function inComposer(node) {
    for (; node; node = node.parentNode) {
      if (node.hasAttribute && node.hasAttribute('data-composer-card')) return true;
    }
    return false;
  }
  function hasRelevantNode(node) {
    if (!node || !node.tagName || node.tagName === 'CANVAS') return false;
    if (isButton(node) || node.hasAttribute('data-composer-card')) return true;
    return Array.from(node.children || []).some(hasRelevantNode);
  }
  function relevantMutation(record) {
    if (record.type === 'attributes') return record.attributeName === 'data-composer-card' ||
      (inComposer(record.target) && record.target.tagName === 'BUTTON');
    var changed = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || []));
    // Canvas attachment/removal is our own change. SVG stop swaps and newly
    // mounted composers matter; streamed message text does not trigger scans.
    if (changed.length && changed.every(function (n) { return n.tagName === 'CANVAS'; })) return false;
    return inComposer(record.target) || changed.some(hasRelevantNode) ||
      ownedButtons.some(function (btn) { return !btn.isConnected; });
  }
  var buttonObserver = new MutationObserver(function (records) {
    if (__disposed || buttonUpdateQueued || !records.some(relevantMutation)) return;
    buttonUpdateQueued = true;
    queueMicrotask(updateButtons);
  });
  updateButtons();
  buttonObserver.observe(document.body, { childList: true, subtree: true,
    attributes: true, attributeFilter: ['class', 'data-composer-card'] });
  var themeObserver = new MutationObserver(function () {
    if (!__disposed) paintSunsetCache();
    if (!__disposed && reduced) draw(simTime, 0);
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });

  return function () {
    __disposed = true;
    if (backgroundFrame !== null) cancelAnimationFrame(backgroundFrame);
    backgroundFrame = null;
    buttonObserver.disconnect();
    themeObserver.disconnect();
    if (sidebarMountObserver) sidebarMountObserver.disconnect();
    if (sidebarThemeObserver) sidebarThemeObserver.disconnect();
    sidebarMountObserver = null;
    sidebarThemeObserver = null;
    detachSidebarWater();
    if (motionQuery && !motionQuery.addEventListener && motionQuery.removeListener) motionQuery.removeListener(onMotionChange);
    for (var i = 0; i < __winListeners.length; i++) {
      var L = __winListeners[i];
      L[0].removeEventListener(L[1], L[2]);
    }
    ownedButtons.forEach(removeButtonWhale);
    ownedButtons = [];
    if (skyCanvas && skyCanvas.parentNode) skyCanvas.parentNode.removeChild(skyCanvas);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}

var STABLE_CLASS_BINDINGS = {"@deepseek-ai/dsh-client-locale/LanguageRow.module.css":{"Hefa_q_row":"row","Hefa_q_selector":"selector"},"@deepseek-ai/dsh-client-ui-attachment/MessageImage.module.css":{"Nhu-QW_frame":"frame"},"@deepseek-ai/dsh-client-ui-chat/ChatView.module.css":{"xz4KEq_running":"running","xz4KEq_runningContent":"runningContent","xz4KEq_runningDivider":"runningDivider","xz4KEq_runningIcon":"runningIcon","xz4KEq_runningText":"runningText","xz4KEq_runningWhaleAnimated":"runningWhaleAnimated","xz4KEq_runningWhaleStill":"runningWhaleStill"},"@deepseek-ai/dsh-client-ui-chat/ChatGroupSeat.module.css":{"WW4l1q_title":"title"},"@deepseek-ai/dsh-client-ui-chat/MessageItem.module.css":{"cJsG2q_bubble":"bubble","cJsG2q_compactionBody":"compactionBody","cJsG2q_compactionLeading":"compactionLeading","cJsG2q_compactionSep":"compactionSep","cJsG2q_compactionSummary":"compactionSummary","cJsG2q_compactionTitle":"compactionTitle"},"@deepseek-ai/dsh-client-ui-chat/MessageIconActions.module.css":{"xD_KDq_action":"action"},"@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown.module.css":{"v5IAXa_root":"root"},"@deepseek-ai/dsh-client-ui-chat/TurnProcessNodeView.module.css":{"_4AI11G_root":"root"},"@deepseek-ai/dsh-client-ui-chat/PreferenceRow.module.css":{"XZcbxG_row":"row","XZcbxG_selector":"selector"},"@deepseek-ai/dsh-client-ui-conversation/EnterBehaviorRow.module.css":{"mP3ANa_row":"row","mP3ANa_selector":"selector"},"@deepseek-ai/dsh-client-ui-conversation/ConversationRoot.module.css":{"Dc7zOa_composerSeat":"composerSeat","Dc7zOa_header":"header","Dc7zOa_headerActions":"headerActions","Dc7zOa_headerCorner":"headerCorner","Dc7zOa_headerUtilities":"headerUtilities","Dc7zOa_root":"root","Dc7zOa_titleRow":"titleRow"},"@deepseek-ai/dsh-client-ui-conversation/HeroShell.module.css":{"Hqq-bq_modalInput":"modalInput","Hqq-bq_workspace":"workspace"},"@deepseek-ai/dsh-client-ui-conversation/ContextMeter.module.css":{"_2WTFBq_bar":"bar"},"@deepseek-ai/dsh-client-ui-conversation/InputBar.module.css":{"RlGAzG_pending":"pending"},"@deepseek-ai/dsh-client-ui-cordis/CordisRunRow.module.css":{"_3jVEXG_business":"business","_3jVEXG_message":"message"},"@deepseek-ai/dsh-client-ui-directory-picker-browse/DirectoryBrowser.module.css":{"Fv-y6W_createInput":"createInput","Fv-y6W_loadingFloat":"loadingFloat","Fv-y6W_rowSelected":"rowSelected"},"@deepseek-ai/dsh-client-ui-layout/AppFrame.module.css":{"BynINW_bottomRow":"bottomRow","BynINW_centerCol":"centerCol","BynINW_frame":"frame","BynINW_rightbarCol":"rightbarCol","BynINW_sidebarCol":"sidebarCol"},"@deepseek-ai/dsh-client-ui-message-feedback/MessageFeedbackActions.module.css":{"vpunvW_action":"action"},"@deepseek-ai/dsh-client-ui-open-in-app/OpenTargetButton.module.css":{"WgQWqa_main":"main"},"@deepseek-ai/dsh-client-ui-permission-presets/PermissionRow.module.css":{"_3HsggG_row":"row","_3HsggG_selector":"selector"},"@deepseek-ai/dsh-client-ui-schedule/TaskManagerPage.module.css":{"S0jZwq_filterTab":"filterTab","S0jZwq_filterTabActive":"filterTabActive","S0jZwq_filterTabs":"filterTabs","S0jZwq_page":"page"},"@deepseek-ai/dsh-client-ui-settings-account/PlatformOverlay.module.css":{"TaJwIq_overlay":"overlay"},"@deepseek-ai/dsh-client-ui-settings-account/AccountNotice.module.css":{"KrzJGG_card":"card"},"@deepseek-ai/dsh-client-ui-settings-account/AccountSection.module.css":{"_8RVnMG_section":"section"},"@deepseek-ai/dsh-client-ui-settings-general/SettingsRoot.module.css":{"wCInkW_active":"active","wCInkW_nav":"nav","wCInkW_navCell":"navCell","wCInkW_navIcon":"navIcon","wCInkW_navList":"navList","wCInkW_navTitle":"navTitle","wCInkW_panel":"panel","wCInkW_trigger":"trigger"},"@deepseek-ai/dsh-client-ui-settings-general/GeneralSection.module.css":{"zZnCHW_section":"section"},"@deepseek-ai/dsh-client-ui-settings-general/CurrentVersionRow.module.css":{"mY-j6a_row":"row"},"@deepseek-ai/dsh-client-ui-settings-models/ModelsSection.module.css":{"_3nPmjq_addButton":"addButton","_3nPmjq_addCard":"addCard","_3nPmjq_addModelButton":"addModelButton","_3nPmjq_dangerButton":"dangerButton","_3nPmjq_editor":"editor","_3nPmjq_linkButton":"linkButton","_3nPmjq_modelEntry":"modelEntry","_3nPmjq_primaryButton":"primaryButton","_3nPmjq_rowActions":"rowActions","_3nPmjq_rowCard":"rowCard","_3nPmjq_secondaryButton":"secondaryButton","_3nPmjq_section":"section","_3nPmjq_setupCard":"setupCard"},"@deepseek-ai/dsh-client-ui-settings-plugin-inventory/PluginInventorySettingsTab.module.css":{"RotMhW_section":"section"},"@deepseek-ai/dsh-client-ui-settings-plugins/PluginsSettingsSection.module.css":{"amjGKq_section":"section"},"@deepseek-ai/dsh-client-ui-settings-session-log/UploadRow.module.css":{"PUqB7a_row":"row"},"@deepseek-ai/dsh-client-ui-settings-subagent/SubagentCard.module.css":{"pbObnW_section":"section"},"@deepseek-ai/dsh-client-ui-shortcuts/Reference.module.css":{"_3Y3Nma_setting":"setting"},"@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css":{"_2H3hWW_collapsed":"collapsed","_2H3hWW_footArea":"footArea","_2H3hWW_newSession":"newSession","_2H3hWW_newSessionShortcut":"newSessionShortcut","_2H3hWW_root":"root"},"@deepseek-ai/dsh-client-ui-sidebar-right/SidebarRight.module.css":{"OUqwTW_panel":"panel","OUqwTW_panelBody":"panelBody","OUqwTW_tabBody":"tabBody"},"@deepseek-ai/dsh-client-ui-theme/AppearanceRow.module.css":{"v01cdW_group":"group","v01cdW_selected":"selected","v01cdW_themeCube":"themeCube"},"@deepseek-ai/dsh-client-ui-theme/FontSettingsGroup.module.css":{"o02QSW_group":"group"},"@deepseek-ai/dsh-client-ui-tool/ToolRow.module.css":{"pFy1Ka_fileLink":"fileLink","pFy1Ka_ioCard":"ioCard"},"@deepseek-ai/dsh-client-ui-trajectory/TrajectoryTable.module.css":{"haSm5q_detailTab":"detailTab","haSm5q_detailTabActive":"detailTabActive","haSm5q_detailTabs":"detailTabs","haSm5q_historyLoadButton":"historyLoadButton","haSm5q_historyLoadingBar":"historyLoadingBar","haSm5q_kindTag":"kindTag","haSm5q_split":"split","haSm5q_table":"table","haSm5q_tablePane":"tablePane"},"@deepseek-ai/dsh-client-ui-trajectory/TrajectoryToolbar.module.css":{"QnvEwG_root":"root"},"@deepseek-ai/dsh-client-ui-trajectory/TrajectoryTimeline.module.css":{"ZNyiNW_plot":"plot"},"@deepseek-ai/dsh-client-ui-trajectory/views.module.css":{"hGyLPq_root":"root"},"@deepseek-ai/dsh-client-ui-workspace/Rows.module.css":{"hIlkoa_dot":"dot","hIlkoa_meta":"meta","hIlkoa_searchResultRow":"searchResultRow","hIlkoa_searchResultSnippet":"searchResultSnippet","hIlkoa_searchResultWorkspace":"searchResultWorkspace","hIlkoa_selected":"selected","hIlkoa_sessionRow":"sessionRow","hIlkoa_slot":"slot","hIlkoa_time":"time"},"@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css":{"_9lTDKa_sectionLabel":"sectionLabel"}};

function apply(ctx) {
  // 皮肤样式注入（卸载时移除；先清理可能残留的同名 <style>）。
  // 顺序：发送按钮 → 设计令牌 → 外壳/桌面层 → 分区皮肤。
  ctx.effect(() => {
    var stale = document.querySelectorAll('style[data-dsh-whale-aqua]');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }

    function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
    function rewriteSelector(selector, aliases) {
      var out = '', changed = false, i = 0;
      while (i < selector.length) {
        if (selector.slice(i, i + 2) === '/*') {
          var commentEnd = selector.indexOf('*/', i + 2);
          var commentStop = commentEnd < 0 ? selector.length : commentEnd + 2;
          out += selector.slice(i, commentStop); i = commentStop; continue;
        }
        var ch = selector[i];
        if (ch === '"' || ch === "'") {
          var quote = ch, quotedEnd = i + 1;
          while (quotedEnd < selector.length) {
            if (selector[quotedEnd] === '\\') { quotedEnd += 2; continue; }
            if (selector[quotedEnd++] === quote) break;
          }
          out += selector.slice(i, quotedEnd); i = quotedEnd; continue;
        }
        if (ch === '.' && i + 1 < selector.length && /[_a-zA-Z-]/.test(selector[i + 1])) {
          var end = i + 2;
          while (end < selector.length && /[a-zA-Z0-9_-]/.test(selector[end])) end++;
          var className = selector.slice(i + 1, end);
          if (hasOwn(aliases, className)) {
            out += ':is(.' + className + ',.' + aliases[className] + ')';
            changed = true;
          } else out += selector.slice(i, end);
          i = end; continue;
        }
        out += ch; i++;
      }
      return changed ? out : selector;
    }
    function findRuleDelimiter(css, start, limit) {
      var parens = 0, brackets = 0, quote = '', comment = false;
      for (var i = start; i < limit; i++) {
        var ch = css[i], next = css[i + 1];
        if (comment) { if (ch === '*' && next === '/') { comment = false; i++; } continue; }
        if (quote) {
          if (ch === '\\') { i++; continue; }
          if (ch === quote) quote = '';
          continue;
        }
        if (ch === '/' && next === '*') { comment = true; i++; continue; }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === '(') parens++;
        else if (ch === ')' && parens) parens--;
        else if (ch === '[') brackets++;
        else if (ch === ']' && brackets) brackets--;
        else if (!parens && !brackets && (ch === '{' || ch === ';' || ch === '}')) return { index: i, char: ch };
      }
      return { index: limit, char: '' };
    }
    function findBlockEnd(css, open, limit) {
      var depth = 1, quote = '', comment = false, parens = 0, brackets = 0;
      for (var i = open + 1; i < limit; i++) {
        var ch = css[i], next = css[i + 1];
        if (comment) { if (ch === '*' && next === '/') { comment = false; i++; } continue; }
        if (quote) {
          if (ch === '\\') { i++; continue; }
          if (ch === quote) quote = '';
          continue;
        }
        if (ch === '/' && next === '*') { comment = true; i++; continue; }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === '(') parens++;
        else if (ch === ')' && parens) parens--;
        else if (ch === '[') brackets++;
        else if (ch === ']' && brackets) brackets--;
        else if (!parens && !brackets && ch === '{') depth++;
        else if (!parens && !brackets && ch === '}' && --depth === 0) return i;
      }
      return limit;
    }
    function classifyPrelude(prelude) {
      var head = prelude, i = 0;
      while (i < head.length) {
        while (/\s/.test(head[i] || '')) i++;
        if (head.slice(i, i + 2) !== '/*') break;
        var end = head.indexOf('*/', i + 2);
        if (end < 0) return '';
        i = end + 2;
      }
      return head.slice(i).trim();
    }
    function rewriteRuleList(css, start, limit, aliases) {
      var out = '', cursor = start;
      while (cursor < limit) {
        var delimiter = findRuleDelimiter(css, cursor, limit);
        if (!delimiter.char) { out += css.slice(cursor, limit); break; }
        if (delimiter.char === ';' || delimiter.char === '}') {
          out += css.slice(cursor, delimiter.index + 1);
          cursor = delimiter.index + 1;
          continue;
        }
        var prelude = css.slice(cursor, delimiter.index);
        var close = findBlockEnd(css, delimiter.index, limit);
        var atRule = classifyPrelude(prelude);
        if (/^@(media|supports|container|layer|document|scope)\b/i.test(atRule)) {
          out += prelude + '{' + rewriteRuleList(css, delimiter.index + 1, close, aliases) + '}';
        } else if (atRule.charAt(0) === '@') {
          out += css.slice(cursor, close + (close < limit ? 1 : 0));
        } else {
          out += rewriteSelector(prelude, aliases) + css.slice(delimiter.index, close + (close < limit ? 1 : 0));
        }
        cursor = close + (close < limit ? 1 : 0);
      }
      return out;
    }
    function resolveAliases() {
      var styles = document.head.querySelectorAll('style[data-plugin-css]');
      var byTag = Object.create(null), aliases = Object.create(null), ambiguous = Object.create(null);
      for (var si = 0; si < styles.length; si++) {
        var tagId = styles[si].getAttribute('data-plugin-css');
        if (hasOwn(STABLE_CLASS_BINDINGS, tagId)) {
          if (!byTag[tagId]) byTag[tagId] = [];
          byTag[tagId].push(styles[si]);
        }
      }
      Object.keys(STABLE_CLASS_BINDINGS).forEach(function (tagId) {
        var moduleStyles = byTag[tagId];
        if (!moduleStyles) return;
        var bindings = STABLE_CLASS_BINDINGS[tagId];
        var candidates = Object.create(null);
        Object.keys(bindings).forEach(function (oldClass) { candidates[oldClass] = []; });
        for (var mi = 0; mi < moduleStyles.length; mi++) {
          var cssClasses = (moduleStyles[mi].textContent || '').match(/\.([_a-zA-Z-][a-zA-Z0-9_-]*)/g) || [];
          for (var ci = 0; ci < cssClasses.length; ci++) {
            var token = cssClasses[ci].slice(1);
            Object.keys(bindings).forEach(function (oldClass) {
              if (token.endsWith('_' + bindings[oldClass]) && candidates[oldClass].indexOf(token) < 0) {
                candidates[oldClass].push(token);
              }
            });
          }
        }
        Object.keys(bindings).forEach(function (oldClass) {
          if (candidates[oldClass].length !== 1) return;
          var candidate = candidates[oldClass][0];
          if (candidate === oldClass) return;
          if (hasOwn(aliases, oldClass) && aliases[oldClass] !== candidate) {
            delete aliases[oldClass];
            ambiguous[oldClass] = true;
          } else if (!ambiguous[oldClass]) aliases[oldClass] = candidate;
        });
      });
      return aliases;
    }
    var baseCss = [WHALE_ICON_CSS, TOKENS_CSS, SHELL_CSS, REGIONS_CSS].join('\n');
    function renderThemeCss(aliases) { return rewriteRuleList(baseCss, 0, baseCss.length, aliases); }

    var el = document.createElement('style');
    el.setAttribute('data-dsh-whale-aqua', THEME_VERSION);
    el.textContent = renderThemeCss(resolveAliases());
    document.head.appendChild(el);
    var observer = new MutationObserver(function (records) {
      var relevant = false;
      for (var ri = 0; ri < records.length && !relevant; ri++) {
        var record = records[ri];
        if (record.target !== document.head) continue;
        var nodes = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || []));
        for (var ni = 0; ni < nodes.length; ni++) {
          var node = nodes[ni];
          if (node === el || !node || node.nodeType !== 1 || node.tagName !== 'STYLE') continue;
          var tagId = node.getAttribute('data-plugin-css');
          if (hasOwn(STABLE_CLASS_BINDINGS, tagId)) { relevant = true; break; }
        }
      }
      if (!relevant) return;
      var nextCss = renderThemeCss(resolveAliases());
      if (nextCss !== el.textContent) el.textContent = nextCss;
    });
    observer.observe(document.head, { childList: true });
    return () => {
      observer.disconnect();
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  });

  // 背景 + 发送按钮动画：startBackground 返回清理函数，直接作为 effect disposer。
  ctx.effect(startBackground);
}
    exports.apply = apply;
    return module.exports;
  },
});

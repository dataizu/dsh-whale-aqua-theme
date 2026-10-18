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

    var THEME_VERSION = "2.1.0";
    // ---- 皮肤样式（源文件见 src/*.css）----
    var WHALE_ICON_CSS = "/* =============================================================================\n   whale-icon.css — dot-matrix whale send button (DSH 0.2.1-rc.2 verified)\n   -----------------------------------------------------------------------------\n   Ported from dsh-whale-aqua-theme (0.1.x) src/whale-icon.css — the selectors are\n   unchanged because 0.2.1 kept the contract the original was written against:\n\n     [data-composer-card]              runtime: <div class=\"RlGAzG_card\"\n                                       data-composer-card=\"true\">  (composer card)\n     button[class*=\"_primary\"]         runtime: <button class=\"RlGAzG_primary\">\n                                       (send/stop button, 34x34 circle)\n     :has(rect)                        running state = the button's svg swaps the\n                                       arrow path for the stop-square <rect>\n                                       (bundle JSX; confirmed by Lead/verifier)\n     canvas                            background.js appends a dot-matrix whale\n                                       <canvas> overlay into the button; the\n                                       original SVG is hidden by this file.\n\n   MERGE TARGET : src/whale-icon.css (first CSS injected, before tokens/shell/\n   regions). No external assets.\n\n   TODO(verify): the old bubble positions (left 8.75px / top 6.3px, 3.5px) were\n   tuned on the 0.1.x button; the 0.2.1 button is 34x34 with a 999px radius. If\n   the bench shows bubbles drifting outside the halo, nudge left/top only here.\n   ============================================================================= */\n\n[data-composer-card] button[class*=\"_primary\"] {\n  position: relative;\n}\n[data-composer-card] button[class*=\"_primary\"] svg:has(path),\n[data-composer-card] button[class*=\"_primary\"] svg:has(rect) {\n  display: none;\n}\n/* Running state: the whale swims underwater (gentle glide + rising bubbles). */\n[data-composer-card] button[class*=\"_primary\"]:has(rect) {\n  animation: dsh-whale-halo 2.4s ease-in-out infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  content: \"\";\n  position: absolute;\n  border-radius: 50%;\n  pointer-events: none;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before {\n  left: 8.75px;\n  top: 6.3px;\n  width: 3.5px;\n  height: 3.5px;\n  background: rgba(255,255,255,0.85);\n  animation: dsh-whale-bubble 2.8s ease-in infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  left: 10.25px;\n  top: 6.9px;\n  width: 2.5px;\n  height: 2.5px;\n  background: rgba(255,255,255,0.7);\n  animation: dsh-whale-bubble 2.8s ease-in 1.3s infinite;\n}\n@keyframes dsh-whale-bubble {\n  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }\n  15% { opacity: 0.9; }\n  55% { transform: translate(1.2px, -5px) scale(1); opacity: 0.75; }\n  100% { transform: translate(-0.6px, -11px) scale(0.45); opacity: 0; }\n}\n@keyframes dsh-whale-halo {\n  0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5); }\n  70% { box-shadow: 0 0 0 6px rgba(0, 122, 255, 0); }\n  100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }\n}\n@media (prefers-reduced-motion: reduce) {\n  [data-composer-card] button[class*=\"_primary\"]:has(rect),\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n    animation: none;\n  }\n}\n";
    var TOKENS_CSS = "/* =============================================================================\n   tokens.css — Apple/macOS design-token layer for DSH 0.2.1-rc.2\n   -----------------------------------------------------------------------------\n   Port of dsh-whale-aqua-theme (built for DSH 0.1.x) src/apple-style.css:1-172\n   + the global primitives that used to live at the end of that palette block.\n\n   MERGE TARGET : src/apple-style.css (injected as APPLE_STYLE_CSS)\n   INJECT ORDER : whale-icon.css -> APPLE_STYLE_CSS -> shell.css -> regions.css\n                  (see src/apply.js). So every rule here can be overridden by\n                  shell.css / regions.css, and it can override the 0.2.1 design\n                  platform because the plugin <style> is appended to <head>\n                  after the platform stylesheet.\n\n   EVIDENCE\n     - 0.2.1 token definitions : @deepseek-ai/dsh-client-ui-theme/lib/client.js\n       (formatted copy .scratch-asar/css-fmt/dsh-client-ui-theme__lib__client.js.css\n        lines 110-124 base/easing/radius, 131-511 alias tokens, 512-513 darwin menu,\n        526-554 scrollbar/gradient/shadow/focus, 746-766 shiki)\n     - consumers: `var(--token)` occurrences across all 0.2.1 client bundles\n       (dsh-client-ui-* + dsh-web-frontend shell CSS). Counts in the inline\n       comments are combined-scan totals (formatted CSS *and* raw client.js\n       strings, so ~2x the CSS-only counts listed in token-diff.md) — they exist\n       to show a token is alive, not as exact numbers.\n     - desktop shell probes : lib/preload-app.cjs:586 probes\n       `--dsw-specific-sidebar-fill` + `--dsw-alias-label-primary` for the native\n       Windows caption color -> those two MUST stay opaque (see below).\n\n   SECTIONS\n     A. Light palette  : 59 kept Apple tokens + 1 compatibility patch + adopted\n                         (old palette had 62 --dsw-* tokens: 60 carried here,\n                          1 refactored to --dsw-menu-surface-fill,\n                          1 dropped: --dsw-specific-tip, 0 consumers)\n                         + 1 NEW-REQUIRED token (state-idle-primary, contract)\n     B. Dark palette   : body[data-ds-dark-theme]\n     C. Darwin scope   : only where 0.2.1 itself scopes a token (menu material)\n     D. Global primitives (selection / focus / scrollbar / icon strokes / accent)\n     E. Parity + TODO  : tokens kept for 0.1.x parity but unused in 0.2.1\n\n   STATUS LEGEND (see token-diff.md for the full table)\n     KEPT      name + Apple value unchanged, token still defined & consumed\n     PATCH     removed from 0.2.1 design platform but still referenced by\n               bundles without a fallback -> we must define it\n     ADOPTED   new 0.2.1 token set to the old Apple design language\n     NEW-REQ   required by 0.2.1's custom-theme contract (BUILTIN_INSPECT_TOKENS,\n               light + dark) but absent from the 0.1.x palette\n     PARITY    still defined by 0.2.1 but no current consumer; harmless, prunable\n   ========================================================================== */\n\n/* =============================================================================\n   A. LIGHT PALETTE  — body { ... }   (identity: #007AFF / #1D1D1F / #F5F5F7 /\n                                       #F2F2F7, exactly the 0.1.x Apple palette)\n   ========================================================================== */\nbody {\n  /* --- surfaces / layers --- */\n  --dsw-alias-bg-base: #FFFFFF !important;                          /* KEPT  (0.2.1 body background-color + 77 consumers) */\n  --dsw-alias-bg-layer-1: #FFFFFF !important;                       /* KEPT  (97) */\n  --dsw-alias-bg-layer-2: #F5F5F7 !important;                       /* KEPT  (47)  Apple grouped-content grey */\n  --dsw-alias-bg-layer-3: #FFFFFF !important;                       /* KEPT  (26) */\n  --dsw-alias-bg-overlay: #FFFFFF !important;                       /* KEPT  (2; user-questions badge) */\n  --dsw-specific-sidebar-fill: #F2F2F7 !important;                   /* KEPT & MUST STAY OPAQUE: probed by Electron\n                                                             caption sync (preload-app.cjs:586) and used by\n                                                             the 40px [data-windows-titlebar] band in\n                                                             shell.css -> never alpha here. */\n  --dsw-specific-input-major: #FFFFFF !important;                    /* KEPT  (18) composer card surface */\n  --dsw-specific-selector: rgba(0, 0, 0, 0.05) !important;           /* KEPT  (4)  segmented/select chip fill */\n  --dsw-alias-bg-module-platform: rgba(0, 0, 0, 0.04) !important;    /* KEPT  (64) toolbars / nav icons */\n  --dsw-alias-bg-multi-select: rgba(0, 0, 0, 0.04) !important;       /* PARITY (0 consumers) */\n  --dsw-alias-bg-skeleton: rgba(0, 0, 0, 0.05) !important;           /* KEPT  (15) */\n\n  /* --- borders --- */\n  --dsw-alias-border-l1: rgba(0, 0, 0, 0.06) !important;             /* KEPT  (113) hairline */\n  --dsw-alias-border-l2: rgba(0, 0, 0, 0.10) !important;             /* KEPT  (169) */\n  --dsw-alias-border-l2-darkmode-thin: rgba(0, 0, 0, 0.08) !important; /* KEPT (17) .5px strokes */\n  --dsw-alias-border-l3: rgba(0, 0, 0, 0.14) !important;             /* KEPT  (111) */\n  --dsw-alias-border-l4: rgba(0, 0, 0, 0.20) !important;             /* KEPT  (85) */\n\n  /* --- brand / state --- */\n  --dsw-alias-brand-primary: #007AFF !important;                     /* KEPT  (17) */\n  --dsw-alias-state-business-primary: #007AFF !important;            /* KEPT  (334) accent blue */\n  --dsw-alias-state-error-primary: #FF3B30 !important;               /* KEPT  (224) Apple red */\n  --dsw-alias-state-success-primary: #34C759 !important;             /* KEPT  (42)  Apple green */\n  --dsw-alias-state-success-tertiary: rgba(52, 199, 89, 0.12) !important;   /* KEPT (5) */\n  --dsw-alias-state-warn-primary: #FF9500 !important;                /* KEPT  (20)  Apple orange */\n  --dsw-alias-state-warn-tertiary: rgba(255, 149, 0, 0.12) !important;      /* KEPT (27) */\n  /* NEW-REQUIRED: 0.2.1's theme contract (BUILTIN_INSPECT_TOKENS in\n     dsh-client-ui-theme) requires light+dark values for 14 alias tokens,\n     including --dsw-alias-state-idle-primary, which the 0.1.x palette never\n     defined. Value = Apple systemGray4 pair, consistent with the #2C2C2E/\n     #3A3A3C surfaces and the idle dot role in 0.2.1 (base was neutral-300). */\n  --dsw-alias-state-idle-primary: #C7C7CC !important;\n\n  /* --- labels --- */\n  --dsw-alias-label-primary: #1D1D1F !important;                     /* KEPT  (605) MUST stay opaque: caption probe */\n  --dsw-alias-label-primary-dimmed: rgba(29, 29, 31, 0.55) !important; /* KEPT (8) */\n  --dsw-alias-label-primary-foreground: #FFFFFF !important;          /* KEPT  (15) text on primary buttons */\n  --dsw-alias-label-primary-inverted: #FFFFFF !important;            /* KEPT  (8) */\n  --dsw-alias-label-secondary: #545458 !important;                   /* KEPT  (468) */\n  --dsw-alias-label-tertiary: #82828A !important;                    /* KEPT  (640) */\n  --dsw-alias-label-caption: #94949C !important;                     /* KEPT  (173) */\n  --dsw-alias-label-dimmed: #A9A9B0 !important;                      /* KEPT  (17) */\n  /* PATCH: 0.2.1 design platform no longer defines --dsw-alias-label-quaternary,\n     but @deepseek-ai/dsh-client-ui-agent-preset + dsh-client-ui-sidebar-browser\n     still use it for :disabled color WITHOUT a fallback (see token-diff.md).\n     Without this line the declaration is invalid at computed-value time. */\n  --dsw-alias-label-quaternary: rgba(60, 60, 67, 0.18) !important;\n\n  /* --- buttons --- */\n  --dsw-alias-button-primary-fill: #007AFF !important;               /* KEPT  (10) */\n  --dsw-alias-button-primary-hover: #0077ED !important;              /* KEPT  (5) */\n  --dsw-alias-button-info-fill: #007AFF !important;                  /* KEPT  (6) */\n  --dsw-alias-button-info-hover: #0077ED !important;                 /* KEPT  (2) */\n  --dsw-alias-button-contrast-fill: #1D1D1F !important;              /* KEPT  (6) */\n  --dsw-alias-button-elevated-fill: #FFFFFF !important;              /* KEPT  (4)  sidebar new-session / workspace btn */\n  --dsw-alias-button-floating-fill: #FFFFFF !important;              /* KEPT  (6) */\n  --dsw-alias-button-floating-hover: #F2F2F7 !important;             /* KEPT  (6) */\n  --dsw-alias-button-tool-bar-fill: rgba(0, 0, 0, 0.04) !important;  /* KEPT  (1, desktop shell menu bar) */\n  --dsw-alias-button-tool-bar-hover: rgba(0, 0, 0, 0.08) !important; /* KEPT  (1) */\n  --dsw-alias-button-ghost-active-fill: rgba(0, 122, 255, 0.12) !important;   /* KEPT (7) */\n  --dsw-alias-button-ghost-active-border: rgba(0, 122, 255, 0.5) !important;  /* KEPT (5) */\n  --dsw-alias-button-ghost-active-hover: rgba(0, 122, 255, 0.16) !important;  /* PARITY (0) */\n\n  /* --- interaction fills --- */\n  --dsw-alias-interactive-bg-hover: rgba(0, 0, 0, 0.05) !important;       /* KEPT (291) */\n  --dsw-alias-interactive-bg-active: rgba(0, 0, 0, 0.09) !important;      /* KEPT (7) */\n  --dsw-alias-interactive-bg-hover-solid: #F2F2F7 !important;             /* KEPT (20) */\n  --dsw-alias-interactive-bg-hover-danger: rgba(255, 59, 48, 0.08) !important; /* KEPT (20) */\n\n  /* --- scrollbars --- */\n  --dsw-alias-scrollbar-bg-l1: rgba(0, 0, 0, 0.16) !important;       /* KEPT  (6) */\n  --dsw-alias-scrollbar-hover-l1: rgba(0, 0, 0, 0.32) !important;    /* KEPT  (2) */\n  --dsw-alias-scrollbar-bg-l2: rgba(0, 0, 0, 0.12) !important;       /* KEPT  (68) */\n  --dsw-alias-scrollbar-hover-l2: rgba(0, 0, 0, 0.28) !important;    /* KEPT  (68) */\n\n  /* --- shadows / blur --- */\n  --dsw-shadow-lv1: 0 1px 2px rgba(0, 0, 0, 0.04) !important;        /* PARITY: 0 consumers in 0.2.1 */\n  --dsw-shadow-lv2: 0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;  /* KEPT (2) */\n  --dsw-shadow-lv3: 0 12px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06) !important; /* KEPT (2, desktop shell) */\n  --dsw-mask-blur: blur(20px) !important;                            /* KEPT  (6)  used as backdrop-filter */\n\n  /* --- misc static --- */\n  --dsw-static-deepseek-450: #007AFF !important;                     /* KEPT  (5)  dark-mode brand alias */\n\n  /* --- custom props (not --dsw-*, still live in 0.2.1) --- */\n  --dsh-scrollbar-width: 6px !important;                             /* KEPT: 0.2.1 ::-webkit-scrollbar{width:var(--dsh-scrollbar-width)} */\n  --ds-ease-in-out: cubic-bezier(0.32, 0.72, 0, 1) !important;       /* KEPT: Apple springy ease, 20+ transitions in 0.2.1 */\n\n  /* ==========================================================================\n     ADOPTED — 0.2.1-only tokens mapped to the old Apple design language\n     ========================================================================== */\n\n  /* 1) Menu material.  0.2.1 refactored the old direct --dsw-specific-menu into\n     --dsw-menu-surface-fill (body{--dsw-specific-menu:var(--dsw-menu-surface-fill)})\n     + --dsw-menu-backdrop-filter. We therefore drive the upstream token; the\n     old 0.1.x look was rgba(255,255,255,0.85) + saturate(180%) blur(30px)\n     (old ._list_19372_8 / ._submenu_19372_9 rule). Do NOT set\n     --dsw-specific-menu directly (it would not cover future material users). */\n  --dsw-menu-surface-fill: rgba(255, 255, 255, 0.85) !important;\n  --dsw-menu-backdrop-filter: saturate(180%) blur(30px) !important;\n\n  /* 2) Radius scale.  0.2.1 base_css_default defines\n     xs:4 sm:8 md:12 lg:16 xl:20 panel:28. Old Apple skin used\n     buttons 8-10, cards 10-14, conversation bubble 18, panels/dialogs 16.\n     Mapping (old rule -> 0.2.1 token consumer found in bundles):\n       ._button_* ._card_* (10)        -> --dsw-radius-md      (158 consumers)\n       .bqrRRG_card (14) / cards       -> --dsw-radius-lg      (113)\n       .gdEzaW_bubble (18), ._2H3hWW_* -> --dsw-radius-xl      (52; incl. .cJsG2q_bubble)\n       dialog / panel (16)             -> --dsw-radius-panel   (13; composer + dialogs)\n     TODO(verify): composer card is .RlGAzG_card{border-radius:var(--dsw-radius-panel)}\n     so it lands at 16 here; the old composer was 18 -> regions.css re-applies 18\n     on [data-composer-card]. Check on bench. */\n  --dsw-radius-md: 10px !important;\n  --dsw-radius-lg: 14px !important;\n  --dsw-radius-xl: 18px !important;\n  --dsw-radius-panel: 16px !important;\n\n  /* 3) Focus ring.  0.2.1 focus_css_default: :root{--dsw-focus-ring-width:2px},\n     components do `outline: var(--dsw-focus-ring-width) solid\n     var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary))` (189 sites).\n     --dsw-focus-ring-color has no default -> old global Apple ring color goes here. */\n  --dsw-focus-ring-color: rgba(0, 122, 255, 0.55) !important;\n\n  /* 4) Settings grouped cards.  0.2.1 ships fill=bg-layer-2 / stroke=border-l4 via\n     body{--dsw-alias-settings-card-fill:...} (5+5 consumers). Old macOS settings\n     card was bg-layer-1 + hairline border-l1, radius 10 (old ._WvWnq_section). */\n  --dsw-alias-settings-card-fill: var(--dsw-alias-bg-layer-1) !important;\n  --dsw-alias-settings-card-stroke: var(--dsw-alias-border-l1) !important;\n\n  /* 5) Brand accent, new name.  0.2.1 changed --dsw-alias-brand-primary to a\n     near-black neutral and introduced --dsw-alias-brand-primary-new-colorprimary-new-color\n     (default #4176e6 light) used by settings links, trajectory rails/selection\n     (25 sites). The old design language accent is #007AFF -> feed it here so the\n     trajectory rail / settings link stay Apple blue, not DeepSeek purple-blue. */\n  --dsw-alias-brand-primary-new-colorprimary-new-color: #007AFF !important;\n\n  /* 6) Settings sidebar nav active accent (0.2.1-only; used by user-questions nav).\n     Old macOS System-Settings active row: blue 12% tint. */\n  --dsw-specific-sidebar-nav-item-active-accent: rgba(0, 122, 255, 0.12) !important;\n  --dsw-specific-sidebar-nav-item-hover: rgba(0, 0, 0, 0.05) !important;   /* KEPT (2) */\n  --dsw-specific-sidebar-nav-item-active: rgba(0, 122, 255, 0.12) !important; /* KEPT (2) */\n\n  /* 7) Links.  0.2.1 --dsw-alias-link default #4176e6 (deepseek-500), 18 consumers\n     (markdown links etc). Old Apple accent blue is #007AFF. */\n  --dsw-alias-link: #007AFF !important;\n\n  /* NOTE (deliberately NOT adopted): --dsw-specific-bubble.\n     0.2.1 uses it for the iMessage-style user bubble (.cJsG2q_bubble, radius-xl,\n     color label-primary) BUT also for goal cards and user-questions cards.\n     The old skin needs a saturated #007AFF fill + white text, which would leak\n     into those cards -> the bubble is re-skinned per-region in regions.css\n     instead of globally in the token layer. Same for --dsw-specific-bubble-highlight\n     (only used by the experimental session inspector). */\n}\n\n/* =============================================================================\n   B. DARK PALETTE — body[data-ds-dark-theme]\n   (identity: #0A84FF / #F5F5F7 / #2C2C2E / #3A3A3C)\n   ========================================================================== */\nbody[data-ds-dark-theme] {\n  /* --- surfaces / layers --- */\n  --dsw-alias-bg-base: #1C1C1E !important;                          /* KEPT */\n  --dsw-alias-bg-layer-1: #2C2C2E !important;                       /* KEPT */\n  --dsw-alias-bg-layer-2: #3A3A3C !important;                       /* KEPT */\n  --dsw-alias-bg-layer-3: #3A3A3C !important;                       /* KEPT */\n  --dsw-alias-bg-overlay: #2C2C2E !important;                       /* KEPT */\n  --dsw-specific-sidebar-fill: #2C2C2E !important;                   /* KEPT & OPAQUE (caption probe) */\n  --dsw-specific-input-major: #2C2C2E !important;                    /* KEPT */\n  --dsw-specific-selector: rgba(255, 255, 255, 0.10) !important;     /* KEPT */\n  --dsw-alias-bg-module-platform: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-alias-bg-multi-select: rgba(255, 255, 255, 0.08) !important; /* PARITY */\n  --dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.08) !important;     /* KEPT */\n\n  /* --- borders --- */\n  --dsw-alias-border-l1: rgba(255, 255, 255, 0.08) !important;       /* KEPT */\n  --dsw-alias-border-l2: rgba(255, 255, 255, 0.14) !important;       /* KEPT */\n  --dsw-alias-border-l2-darkmode-thin: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-alias-border-l3: rgba(255, 255, 255, 0.18) !important;       /* KEPT */\n  --dsw-alias-border-l4: rgba(255, 255, 255, 0.24) !important;       /* KEPT */\n\n  /* --- brand / state --- */\n  --dsw-alias-brand-primary: #0A84FF !important;                     /* KEPT */\n  --dsw-alias-state-business-primary: #0A84FF !important;            /* KEPT */\n  --dsw-alias-state-error-primary: #FF453A !important;               /* KEPT */\n  --dsw-alias-state-success-primary: #30D158 !important;             /* KEPT */\n  --dsw-alias-state-success-tertiary: rgba(48, 209, 88, 0.16) !important;   /* KEPT */\n  --dsw-alias-state-warn-primary: #FF9F0A !important;                /* KEPT */\n  --dsw-alias-state-warn-tertiary: rgba(255, 159, 10, 0.16) !important;     /* KEPT */\n  --dsw-alias-state-idle-primary: #48484A !important;                /* NEW-REQUIRED (contract), see light block */\n\n  /* --- labels --- */\n  --dsw-alias-label-primary: #F5F5F7 !important;                     /* KEPT & OPAQUE (caption probe) */\n  --dsw-alias-label-primary-dimmed: rgba(245, 245, 247, 0.55) !important; /* KEPT */\n  --dsw-alias-label-primary-foreground: #FFFFFF !important;          /* KEPT */\n  --dsw-alias-label-primary-inverted: #1C1C1E !important;            /* KEPT */\n  --dsw-alias-label-secondary: #B8B8C0 !important;                   /* KEPT */\n  --dsw-alias-label-tertiary: #8E8E98 !important;                    /* KEPT */\n  --dsw-alias-label-caption: #7E7E88 !important;                     /* KEPT */\n  --dsw-alias-label-dimmed: #6C6C76 !important;                      /* KEPT */\n  --dsw-alias-label-quaternary: rgba(235, 235, 245, 0.18) !important; /* PATCH (see light block) */\n\n  /* --- buttons --- */\n  --dsw-alias-button-primary-fill: #0A84FF !important;               /* KEPT */\n  --dsw-alias-button-primary-hover: #2E90FA !important;              /* KEPT */\n  --dsw-alias-button-info-fill: #0A84FF !important;                  /* KEPT */\n  --dsw-alias-button-info-hover: #2E90FA !important;                 /* KEPT */\n  --dsw-alias-button-contrast-fill: #F5F5F7 !important;              /* KEPT */\n  --dsw-alias-button-elevated-fill: #2C2C2E !important;              /* KEPT */\n  --dsw-alias-button-floating-fill: #3A3A3C !important;              /* KEPT */\n  --dsw-alias-button-floating-hover: #48484A !important;             /* KEPT */\n  --dsw-alias-button-tool-bar-fill: rgba(255, 255, 255, 0.06) !important; /* KEPT */\n  --dsw-alias-button-tool-bar-hover: rgba(255, 255, 255, 0.10) !important; /* KEPT */\n  --dsw-alias-button-ghost-active-fill: rgba(10, 132, 255, 0.20) !important;  /* KEPT */\n  --dsw-alias-button-ghost-active-border: rgba(10, 132, 255, 0.60) !important; /* KEPT */\n  --dsw-alias-button-ghost-active-hover: rgba(10, 132, 255, 0.24) !important;  /* PARITY */\n\n  /* --- interaction fills --- */\n  --dsw-alias-interactive-bg-hover: rgba(255, 255, 255, 0.08) !important;      /* KEPT */\n  --dsw-alias-interactive-bg-active: rgba(255, 255, 255, 0.12) !important;     /* KEPT */\n  --dsw-alias-interactive-bg-hover-solid: #3A3A3C !important;                  /* KEPT */\n  --dsw-alias-interactive-bg-hover-danger: rgba(255, 69, 58, 0.12) !important; /* KEPT */\n\n  /* --- scrollbars --- */\n  --dsw-alias-scrollbar-bg-l1: rgba(255, 255, 255, 0.20) !important;   /* KEPT */\n  --dsw-alias-scrollbar-hover-l1: rgba(255, 255, 255, 0.35) !important;/* KEPT */\n  --dsw-alias-scrollbar-bg-l2: rgba(255, 255, 255, 0.16) !important;   /* KEPT */\n  --dsw-alias-scrollbar-hover-l2: rgba(255, 255, 255, 0.30) !important;/* KEPT */\n\n  /* --- shadows / blur --- */\n  --dsw-shadow-lv1: 0 1px 2px rgba(0, 0, 0, 0.40) !important;          /* PARITY */\n  --dsw-shadow-lv2: 0 4px 16px rgba(0, 0, 0, 0.50), 0 1px 3px rgba(0, 0, 0, 0.40) !important;   /* KEPT */\n  --dsw-shadow-lv3: 0 12px 40px rgba(0, 0, 0, 0.60), 0 2px 8px rgba(0, 0, 0, 0.50) !important;  /* KEPT */\n  --dsw-mask-blur: blur(20px) !important;                              /* KEPT */\n\n  /* --- misc static --- */\n  --dsw-static-deepseek-450: #0A84FF !important;                       /* KEPT */\n\n  /* --- custom props --- */\n  --dsh-scrollbar-width: 6px !important;                               /* KEPT */\n  --ds-ease-in-out: cubic-bezier(0.32, 0.72, 0, 1) !important;         /* KEPT */\n\n  /* --- ADOPTED (dark variants) --- */\n  --dsw-menu-surface-fill: rgba(36, 36, 38, 0.85) !important;          /* old 0.1.x dark menu */\n  --dsw-menu-backdrop-filter: saturate(180%) blur(30px) !important;\n  --dsw-focus-ring-color: rgba(10, 132, 255, 0.65) !important;\n  --dsw-alias-brand-primary-new-colorprimary-new-color: #0A84FF !important;\n  --dsw-specific-sidebar-nav-item-active-accent: rgba(10, 132, 255, 0.24) !important;\n  --dsw-specific-sidebar-nav-item-hover: rgba(255, 255, 255, 0.08) !important; /* KEPT */\n  --dsw-specific-sidebar-nav-item-active: rgba(10, 132, 255, 0.24) !important; /* KEPT */\n  --dsw-alias-link: #0A84FF !important;\n  /* Radius + settings-card fill/stroke are theme-independent / var()-derived,\n     so they intentionally stay in the light block only:\n       --dsw-alias-settings-card-fill:var(--dsw-alias-bg-layer-1) resolves to\n       #2C2C2E here because layer-1 is redefined above; same for the stroke. */\n}\n\n/* =============================================================================\n   C. DARWIN SCOPE — only token 0.2.1 itself scopes on html[data-platform=darwin]\n     is the menu material (theme css lines 512-513):\n       html[data-platform=darwin] body{--dsw-specific-menu:#f8f9faf0}\n     We keep the macOS menu translucent like the rest of the skin. This is the\n     only platform-scoped override; window chrome / caption colors are untouched.\n     (Author runs Windows; darwin values kept conservative and commented.)\n   ========================================================================== */\nhtml[data-platform=darwin] body {\n  --dsw-specific-menu: rgba(255, 255, 255, 0.85) !important;\n}\nhtml[data-platform=darwin] body[data-ds-dark-theme] {\n  --dsw-specific-menu: rgba(36, 36, 38, 0.85) !important;\n}\n\n/* =============================================================================\n   D. GLOBAL PRIMITIVES (no CSS-module hashes; carried over verbatim from the\n      0.1.x palette block because they are cross-cutting chrome)\n   ========================================================================== */\n\n/* Text selection: Apple accent tint (old apple-style.css v0.1.x). */\n::selection {\n  background: rgba(0, 122, 255, 0.22);\n}\nbody[data-ds-dark-theme] ::selection {\n  background: rgba(10, 132, 255, 0.35);\n}\n\n/* Focus ring: 0.2.1 already renders components' rings from\n   --dsw-focus-ring-width/-color (declared above). Old skin also used a 2px\n   offset; a bare `outline-color` here avoids overriding component outlines. */\n:focus-visible {\n  outline-color: var(--dsw-focus-ring-color, rgba(0, 122, 255, 0.55));\n  outline-offset: 2px;\n}\n/* 0.2.1's focus_css_default nulls the ring for pointer modality:\n   html[data-input-modality=pointer] body :focus-visible:not(:read-write).\n   That rule wins on the focused element itself (higher specificity), so mouse\n   users keep the native no-ring behavior; keyboard users get the Apple ring. */\n\n/* Scrollbar size (0.2.1 consumes --dsh-scrollbar-width, declared above).\n   Old skin also forced 6px directly; that is now redundant and would fight\n   --dsh-scrollbar-width, so no ::-webkit-scrollbar rule is re-declared here. */\n\n/* Checkbox / radio accent (old global rule). */\nbody input[type=\"checkbox\"],\nbody input[type=\"radio\"] {\n  accent-color: var(--dsw-alias-button-info-fill, #007AFF);\n}\n\n/* Rounder SVG icon joins (old global rule; purely visual). */\nsvg path[stroke],\nsvg circle[stroke],\nsvg rect[stroke],\nsvg line[stroke] {\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\nsvg[viewBox=\"0 0 16 16\"] path[stroke] {\n  stroke-width: 1.5px;\n}\n\n/* =============================================================================\n   E. PARITY + DROPPED + TODO\n     Tokens kept although 0.2.1 has no current consumer (0 var() references):\n       --dsw-alias-bg-multi-select          (still defined by 0.2.1)\n       --dsw-alias-button-ghost-active-hover(still defined by 0.2.1)\n       --dsw-shadow-lv1 / lv3               (lv3 is consumed by the desktop shell\n                                             shell CSS; lv1 only by old region rules)\n     Dropped (reason):\n       --dsw-specific-tip  still defined by 0.2.1 (theme css:397/511) but no\n                           consumer in 0.2.1 and no rule in the old theme consumed\n                           it either; its old value #F5F5F7 / #2C2C2E is ~the\n                           0.2.1 default, so dropping it changes nothing.\n     Refactored (reason):\n       --dsw-specific-menu -> now derived by 0.2.1 from --dsw-menu-surface-fill,\n                           so only the upstream token is overridden (block A).\n   TODO(verify@bench): screenshot light+dark settings, composer and menus to\n   confirm radius scale, menu alpha and focus ring. Anything that looks off is a\n   value-only change here.\n   ========================================================================== */\n";
    var SHELL_CSS = "/* =============================================================================\n   shell.css — 水中鲸鱼外壳层 + DSH Desktop 窗口适配\n   -----------------------------------------------------------------------------\n   目标版本：DSH 0.2.x（在 Desktop 0.2.1-rc.2 上验证）。\n   职责：\n     1. 让 <canvas id=\"dsh-bg-canvas\">（z-index:-1，body 首个子节点）真正透出来：\n        把 window / frame / 侧边栏 / 会话根节点这些“整屏底板”改为透明或玻璃色。\n     2. 处理 DSH Desktop（Electron）独有的标记：\n          html[data-platform=\"win32\"|\"darwin\"]   —— 由 preload 写入（lib/preload-app.cjs）\n          html[data-windows-titlebar]           —— Windows 隐藏标题栏模式（40px 拖拽带）\n          --dsh-windows-titlebar-height: 40px\n          html[data-fullscreen]                 —— 全屏时去掉顶部留白\n     3. 保留窗口标题栏拖拽区（-webkit-app-region）与原生窗口按钮的安全区。\n\n   选择器说明（0.2.1-rc.2 构建的 CSS Modules 哈希，升级后可能变化）：\n     .BynINW_frame / _centerCol / _sidebarCol / _rightbarCol / _bottomRow\n        → @deepseek-ai/dsh-client-ui-layout（应用网格骨架）\n     语义钩子（跨版本更稳）：html[data-platform]、html[data-windows-titlebar]、\n        [data-windows-titlebar] 前缀、.dshDesktop 相关由 preload 写入的属性。\n   维护方式：升级 DSH 后若外壳底板变白，只需在下面“版本适配层”里更新哈希前缀。\n   ============================================================================= */\n\n/* ---------------------------------------------------------------------------\n   1. 底板全透明：web 模式与 Desktop 模式一致\n   ------------------------------------------------------------------------- */\nhtml,\nbody,\n#root {\n  background: transparent !important;\n}\n\n/* 0.2.x 的 boot 内联样式会给 body 写 background-color，\n   这里必须用 !important 覆盖，否则整屏 canvas 被白底遮住。 */\nbody {\n  background-color: transparent !important;\n  /* 玻璃色（亮/暗）——侧边栏、次级面板共用 */\n  --dsh-aqua-sidebar-light: rgba(242, 242, 247, 0.62);\n  --dsh-aqua-sidebar-dark: rgba(32, 34, 40, 0.62);\n  --dsh-aqua-pane-light: rgba(250, 251, 255, 0.42);\n  --dsh-aqua-pane-dark: rgba(18, 21, 28, 0.42);\n  --dsh-aqua-sidebar: var(--dsh-aqua-sidebar-light);\n  --dsh-aqua-pane: var(--dsh-aqua-pane-light);\n}\n\nbody[data-ds-dark-theme] {\n  --dsh-aqua-sidebar: var(--dsh-aqua-sidebar-dark);\n  --dsh-aqua-pane: var(--dsh-aqua-pane-dark);\n}\n\n/* ---------------------------------------------------------------------------\n   2. 应用骨架（@deepseek-ai/dsh-client-ui-layout）\n      原始规则：.BynINW_frame{background:var(--dsw-alias-bg-base)}\n                [data-windows-titlebar] .BynINW_frame{background:var(--dsw-specific-sidebar-fill)}\n                .BynINW_centerCol{background:var(--dsw-alias-bg-base)}\n   ------------------------------------------------------------------------- */\n.BynINW_frame,\n[data-windows-titlebar] .BynINW_frame,\n[data-platform=\"darwin\"] .BynINW_frame {\n  background: transparent !important;\n}\n\n.BynINW_centerCol,\n[data-windows-titlebar] .BynINW_centerCol,\n[data-platform=\"darwin\"] .BynINW_centerCol {\n  background: transparent !important;\n}\n\n.BynINW_sidebarCol,\n[data-platform=\"darwin\"] .BynINW_sidebarCol,\n[data-platform=\"darwin\"] [data-ds-dark-theme] .BynINW_sidebarCol {\n  background: var(--dsh-aqua-sidebar) !important;\n  backdrop-filter: blur(14px) saturate(140%);\n  -webkit-backdrop-filter: blur(14px) saturate(140%);\n}\n\n.BynINW_rightbarCol,\n[data-platform=\"darwin\"] .BynINW_rightbarCol {\n  background: var(--dsh-aqua-pane) !important;\n  backdrop-filter: blur(14px) saturate(140%);\n  -webkit-backdrop-filter: blur(14px) saturate(140%);\n}\n\n.BynINW_bottomRow {\n  background: var(--dsh-aqua-pane) !important;\n}\n\n/* Windows 隐藏标题栏：40px 拖拽带保持“窗口条”实色并继续可拖动；\n   水位从标题栏下沿开始，避免原生窗口按钮压在水面上产生色差。\n   原生标题栏按钮颜色由 preload 用 --dsw-specific-sidebar-fill 探测后同步，\n   所以这条带子只做轻微水色渐变，不整体改成透明。 */\n[data-windows-titlebar] .BynINW_frame:before {\n  background:\n    linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 60%, rgba(255, 255, 255, 0) 100%),\n    var(--dsw-specific-sidebar-fill) !important;\n  -webkit-app-region: drag;\n}\n\nhtml[data-windows-titlebar][data-fullscreen] .BynINW_frame {\n  padding-top: 0 !important;\n}\n\n/* ---------------------------------------------------------------------------\n   3. 会话视图底板（@deepseek-ai/dsh-client-ui-conversation）\n      原始规则：.Dc7zOa_root{background:var(--dsw-alias-bg-base)}\n   ------------------------------------------------------------------------- */\n.Dc7zOa_root {\n  background: transparent !important;\n}\n\n/* 会话滚动区/消息区保持透明，让水色透出；具体卡片仍用自己的 token 底色。 */\n.Dc7zOa_header,\n.Dc7zOa_titleRow {\n  background: transparent !important;\n}\n\n/* ---------------------------------------------------------------------------\n   4. Window 拖拽语义（DSH 0.2.x 统一约定）\n      html[data-platform] / [data-window-drag] 由 Web 前端与 preload 维护；\n      这里只保证主题不会破坏拖拽区的点击穿透。\n   ------------------------------------------------------------------------- */\nhtml[data-platform=\"darwin\"] [data-window-drag],\nhtml[data-windows-titlebar] .BynINW_frame:before {\n  -webkit-app-region: drag;\n}\n\n/* 侧边栏/会话区内部的交互元素永远不参与窗口拖拽 */\n.BynINW_sidebarCol button,\n.BynINW_sidebarCol input,\n.BynINW_centerCol button,\n.BynINW_centerCol input,\n.Dc7zOa_root button,\n.Dc7zOa_root input {\n  -webkit-app-region: no-drag;\n}\n\n/* ---------------------------------------------------------------------------\n   5. 无障碍：用户要求减少透明/动效时不叠玻璃\n   ------------------------------------------------------------------------- */\n@media (prefers-reduced-transparency: reduce) {\n  .BynINW_sidebarCol,\n  .BynINW_rightbarCol {\n    background: var(--dsw-specific-sidebar-fill) !important;\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n  }\n}\n";
    var REGIONS_CSS = "/* =============================================================================\n   regions.css — per-region macOS skin for DSH 0.2.1-rc.2\n   -----------------------------------------------------------------------------\n   Port of dsh-whale-aqua-theme (DSH 0.1.x) src/apple-style.css lines 119-250\n   + the adapter needed for 0.2.1's renamed CSS modules.\n\n   MERGE TARGET : src/regions.css   (inject order whale-icon -> tokens ->\n                  shell -> regions, so this file wins over tokens/shell where a\n                  real selector matches)\n   Source of truth for selectors:\n     - reports/map.json (task-1: 96 old classes -> 0.2.1 classes + semantic hooks)\n     - .scratch-asar/css-fmt/<pkg>__lib__client.js.css (0.2.1 CSS modules)\n     - .scratch-asar/extracted/.../dsh-web-frontend/dist/assets/index-*.css\n       (shared UI kit, family-B `_x_hash` modules)\n     body - runtime DOM: .scratch-verify/logs/run1/{dom-tree.txt,markup-composer.html},\n       discover2-settings-rows.json + conversation/trajectory/settings JSX in the\n       0.2.1 bundles (for data-* hooks).\n\n   INTEGRATION RULES (Lead):\n     - shell.css OWNS html/body/#root/.BynINW_* / .Dc7zOa_root backgrounds (aquarium\n       transparency, !important). This file does NOT set backgrounds on those.\n     - The one inner \"opaque plate\" that must be cleared is the sidebar inner\n       root (._2H3hWW_root) — see §1. Any other plate exception is marked\n       \"PLATE EXCEPTION\" so it can be reviewed.\n     - Colours come from tokens.css; radii here are only where the old screenshots\n       differ from the 0.2.1 design-system default.\n\n   ============================ 0.2.1 SELECTOR ADAPTER =========================\n   HASH GROUPS (owning package -> local prefixes used below). Future upgrades:\n   only touch this mapping table, not the rules.\n     @deepseek-ai/dsh-client-ui-conversation : Dc7zOa_*  ConversationRoot\n                                               RlGAzG_*  InputBar/composer\n                                               _2WTFBq_* ContextMeter\n                                               Hqq-bq_*  HeroShell\n     @deepseek-ai/dsh-client-ui-chat         : cJsG2q_*  MessageItem (bubble)\n                                               v5IAXa_*  AssistantMarkdown\n                                               xz4KEq_*  ChatView (scroll/root)\n                                               _3GBCTG_* ReasoningRow (think)\n     @deepseek-ai/dsh-client-ui-trajectory   : haSm5q_*  TrajectoryTable\n     @deepseek-ai/dsh-client-ui-settings-general  : wCInkW_* SettingsRoot\n     @deepseek-ai/dsh-client-ui-settings-account  : _8RVnMG_* , KrzJGG_*\n     @deepseek-ai/dsh-client-ui-settings-models   : _3nPmjq_*\n     @deepseek-ai/dsh-client-ui-theme             : v01cdW_* AppearanceRow\n     @deepseek-ai/dsh-client-ui-sidebar           : _2H3hWW_* SidebarRoot\n     @deepseek-ai/dsh-client-ui-workspace         : hIlkoa_* Rows,\n                                                    _9lTDKa_* WorkspaceBrowser\n     @deepseek-ai/dsh-client-ui-directory-picker-browse : Fv-y6W_*\n     @deepseek-ai/dsh-client-ui-tool              : pFy1Ka_* ToolRow\n     @deepseek-ai/dsh-client-ui-cordis            : _3jVEXG_* CordisRunRow\n     settings per-tab select triggers (settings rows):\n       dsh-client-locale Hefa_q_selector, dsh-client-ui-permission-presets\n       body _3HsggG_selector, dsh-client-ui-chat XZcbxG_selector,\n       dsh-client-ui-conversation mP3ANa_selector\n     dsh-web-frontend shared UI kit (index-*.css):\n       body _button_1rv3m_*, _list_4ub78_*, _submenu_4ub78_*, _item_4ub78_*,\n       body _denseList_4ub78_*, _check_4ub78_*, _root_4ub78_*, _surface_ri079_*,\n       body _dialog_o6lrb_*, _confirmation_cjd8z_*, _toast_l6cvn_*,\n       body _bubble_12mhf_* (tooltip), _pill_1bqmh_*, _card_38jqx_* (hovercard),\n       _backdrop_19zw2_*, _close_19zw2_*, _markdown_1ypvv_* (markdown typography)\n\n   Semantic hooks used (verified in 0.2.1 bundles/runtime):\n     [data-composer-card] [data-composer-input] [data-composer-seat]\n     [data-conversation-tabs] [role=tab] [aria-selected]\n     [data-conversation-region] [data-conversation-scroll]\n     [role=treeitem][data-row-key^=session|search:] [aria-selected=true]\n     [data-variant=think][data-state=running] [data-chat-flow-kind]\n     [data-selected=true] [data-kind=...] [data-collapsed-summary] [data-role-kind]\n     nav button[aria-current=true]\n   ========================================================================== */\n\n/* ============================================================================\n   §1. SIDEBAR  (_2H3hWW_*  — @deepseek-ai/dsh-client-ui-sidebar)\n   Old: .hHd-Xa_root / .hHd-Xa_newSession / .qDHVXG_sectionLabel\n   ========================================================================== */\n\n/* PLATE EXCEPTION (approved by Lead): shell.css makes .BynINW_sidebarCol glass,\n   but the sidebar inner root re-paints the opaque --dsw-specific-sidebar-fill.\n   Clear it so the aquarium glass shows through. The 40px Windows drag band in\n   shell.css keeps its solid fill, so the native caption probe is unaffected. */\nbody ._2H3hWW_root {\n  background: transparent !important;\n}\n\n/* Old 0.1.x macOS: filled blue \"new session\" button (0.2.1 defaults to a white\n   elevated button). Not applied in collapsed rail mode (old rule had :not). */\nbody ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession {\n  background: var(--dsw-alias-button-primary-fill);\n  border-color: transparent;\n  color: #FFFFFF;\n  border-radius: 8px;\n}\nbody ._2H3hWW_root:not(._2H3hWW_collapsed) ._2H3hWW_newSession:hover {\n  background: var(--dsw-alias-button-primary-hover);\n}\n\n/* Workspace/session list section label: 11px semibold (Finder style).\n   Old .qDHVXG_sectionLabel -> ._9lTDKa_sectionLabel (@deepseek-ai/dsh-client-ui-workspace). */\nbody ._9lTDKa_sectionLabel {\n  font-size: 11px;\n  font-weight: 600;\n}\n\n/* ============================================================================\n   §2. SESSION ROWS / WORKSPACE TREE\n   body Old: .YDXeBa_sessionRow / _selected / _time / _meta / _slot,\n        body .YDXeBa_searchResultRow / _searchResultSnippet / _searchResultWorkspace,\n        .YDXeBa_selected, ._matrix_10orb_4, ._dot_10orb_3\n   New: @deepseek-ai/dsh-client-ui-workspace/Rows  hIlkoa_*\n   Semantic: [role=treeitem][data-row-key^=\"session:\"|\"search:\"][aria-selected=true]\n   (runtime: run1 sessionRows = \"hIlkoa_sessionRow hIlkoa_selected\")\n   ========================================================================== */\n\n/* Finder-style solid blue selected row (light #0A60FF per old 0.1.x; dark #0A84FF). */\nbody [role=\"treeitem\"][data-row-key^=\"session:\"][aria-selected=\"true\"],\nbody [role=\"treeitem\"][data-row-key^=\"search:\"][aria-selected=\"true\"],\nbody .hIlkoa_sessionRow.hIlkoa_selected,\nbody .hIlkoa_searchResultRow.hIlkoa_selected {\n  background: #0A60FF;\n  color: #FFFFFF;\n}\nbody[data-ds-dark-theme] [role=\"treeitem\"][data-row-key^=\"session:\"][aria-selected=\"true\"],\nbody[data-ds-dark-theme] [role=\"treeitem\"][data-row-key^=\"search:\"][aria-selected=\"true\"],\nbody[data-ds-dark-theme] .hIlkoa_sessionRow.hIlkoa_selected,\nbody[data-ds-dark-theme] .hIlkoa_searchResultRow.hIlkoa_selected {\n  background: #0A84FF;\n}\n\n/* Secondary text on the blue selection: white at 78% (old rule). */\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_time,\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_meta,\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_slot,\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_searchResultSnippet,\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_searchResultWorkspace {\n  color: rgba(255, 255, 255, 0.78);\n}\n\n/* Running-indicator dot turns white on the blue selection.\n   Old ._matrix_10orb_4 (missing in 0.2.1, map.json) / ._dot_10orb_3\n   -> the 0.2.1 equivalent is .hIlkoa_dot (workspace/Rows). */\nbody [role=\"treeitem\"][aria-selected=\"true\"] .hIlkoa_dot {\n  color: #FFFFFF;\n}\n\n/* ============================================================================\n   §3. CONVERSATION HEADER + VIEW TABS\n   Old: .wSkVaW_header / .wSkVaW_tabs / .wSkVaW_tab / .wSkVaW_tabActive\n   New: @deepseek-ai/dsh-client-ui-conversation/ConversationRoot Dc7zOa_*\n        semantic: [data-conversation-tabs][role=tablist] > button[role=tab][aria-selected]\n   0.2.1 defaults to underline tabs; the old skin used an iOS segmented pill.\n   ========================================================================== */\n\n/* Remove the legacy header divider (old rule). */\nbody .Dc7zOa_header {\n  border-bottom-color: transparent;\n}\n\n/* iOS-style segmented control container. */\nbody [data-conversation-tabs] {\n  gap: 0;\n  margin-top: 8px;\n  padding: 3px;\n  width: fit-content;\n  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, 0.04));\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 999px;\n}\n\n/* Segment label. */\nbody [data-conversation-tabs] button[role=\"tab\"] {\n  color: var(--dsw-alias-label-primary);\n  padding: 5px 18px;\n  border-radius: 999px;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 20px;\n  transition:\n    body background-color 0.2s var(--ds-ease-in-out),\n    color 0.2s var(--ds-ease-in-out);\n}\nbody [data-conversation-tabs] button[role=\"tab\"]:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n/* Selected segment: filled Apple blue + white label (old active pill). */\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"],\nbody [data-conversation-tabs] button[role=\"tab\"][aria-selected=\"true\"]:hover {\n  background: var(--dsw-alias-button-info-fill, #007AFF);\n  color: #FFFFFF;\n}\n\n/* Remove the 0.2.1 underline (old rule killed wSkVaW_tab:after). */\nbody .Dc7zOa_header:after,\nbody [data-conversation-tabs] button[role=\"tab\"]:after {\n  display: none;\n}\n\n/* ============================================================================\n   §4. CONVERSATION SURFACES — frosted glass over the aquarium\n   Old: .fV0t5q_root (bg layer-1 — DROPPED, would re-opaque shell areas) and\n        .Md3f7G_scroll (frosted backdrop).\n   reports/selector-map.md §3.16: old scroll maps to .xz4KEq_scroll (inner) OR\n   .Dc7zOa_scrollBody (outer); the outer scrollport is what visually reads as\n   \"the conversation surface\", so the frost goes on the semantic\n   [data-conversation-scroll] host. It is scoped to an open session\n   ([data-conversation-session] on the conversation body) so the empty-state\n   hero keeps the full aquarium visible.\n   PLATE EXCEPTION (report to Lead): .Dc7zOa_composerSeat keeps 0.2.1's sticky\n   gradient painted with --dsw-alias-bg-base (#FFFFFF); the optional de-seam\n   override is documented in NOTES.md §4 and is NOT shipped until verified.\n   ---------------------------------------------------------------------------\n   2026-10-18 v2.1: the previous rgba(255,255,255,.72) + blur(18px) frost was\n   too opaque — the aquarium was invisible in the message area (the exact\n   regression the author reported). The conversation surface is now a light\n   WATER VEIL so the canvas (water gradient + bubbles + whale) reads through,\n   while assistant text keeps contrast on the pale water.\n   ========================================================================== */\nbody [data-conversation-session] [data-conversation-scroll] {\n  background: linear-gradient(\n    180deg,\n    rgba(255, 255, 255, 0.12) 0%,\n    rgba(255, 255, 255, 0.26) 38%,\n    rgba(238, 245, 255, 0.20) 100%\n  );\n  -webkit-backdrop-filter: none;\n  backdrop-filter: none;\n}\nbody[data-ds-dark-theme] [data-conversation-session] [data-conversation-scroll] {\n  background: linear-gradient(\n    180deg,\n    rgba(8, 10, 16, 0.26) 0%,\n    rgba(10, 12, 19, 0.38) 45%,\n    rgba(12, 15, 22, 0.30) 100%\n  );\n}\n\n/* ============================================================================\n   §5. iMESSAGE-STYLE USER BUBBLE\n   Old: .gdEzaW_bubble (+ ._markdown_1nba0_5 and compaction children)\n   New: @deepseek-ai/dsh-client-ui-chat/MessageItem  .cJsG2q_bubble\n        (no stable attribute — inside [data-conversation-region=\"chat\"])\n        bubble markdown: shared UI kit ._markdown_1ypvv_5\n   ========================================================================== */\nbody .cJsG2q_bubble {\n  background: var(--dsw-alias-button-info-fill, #007AFF);\n  color: #FFFFFF;\n  border-radius: 18px; /* old 18px; radius-xl token is also 18 — explicit for the old rule */\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.10);\n}\nbody .cJsG2q_bubble ._markdown_1ypvv_5 {\n  color: #FFFFFF;\n}\nbody .cJsG2q_bubble a,\nbody .cJsG2q_bubble ._markdown_1ypvv_5 a {\n  color: #FFFFFF;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\nbody .cJsG2q_bubble ._markdown_1ypvv_5 :not(pre) > code {\n  background-color: rgba(255, 255, 255, 0.24);\n  color: #FFFFFF;\n}\nbody .cJsG2q_bubble .cJsG2q_compactionTitle,\nbody .cJsG2q_bubble .cJsG2q_compactionSummary,\nbody .cJsG2q_bubble .cJsG2q_compactionBody,\nbody .cJsG2q_bubble .cJsG2q_compactionLeading {\n  color: rgba(255, 255, 255, 0.82);\n}\nbody .cJsG2q_bubble .cJsG2q_compactionSep {\n  background: rgba(255, 255, 255, 0.6);\n}\n\n/* ============================================================================\n   §6. ASSISTANT WHALE AVATAR\n   Old: .Sxvs8a_root (padding-left 36px + 20x14.7px whale mask at top-left)\n   map.json: Sxvs8a_root = ambiguous, recommended .v5IAXa_root\n   (@deepseek-ai/dsh-client-ui-chat/AssistantMarkdown) — one root per assistant\n   answer. The whale SVG path is the same data URI as 0.1.x (no external asset).\n   TODO(verify): old avatar was attached to the assistant *row*; 0.2.1 renders\n   reasoning in a separate node, so the avatar currently starts at the answer\n   markdown block. Compare against reference screenshots on the bench.\n   ========================================================================== */\nbody .v5IAXa_root {\n  position: relative;\n  padding-left: 36px;\n}\nbody .v5IAXa_root::before {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  top: 5px;\n  width: 20px;\n  height: 14.7px;\n  background: var(--dsw-alias-state-business-primary, #007AFF);\n  -webkit-mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\n  mask: url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;\n}\n\n/* ============================================================================\n   §7. THINK CARD (semantic, selector unchanged from 0.1.x)\n   Old: [data-variant=\"think\"] / [data-state=\"running\"]\n   0.2.1: ReasoningRow root div carries data-variant=\"think\" data-state=running|ok\n          (dsh-client-ui-chat JSX + _3GBCTG_root styles)\n   ========================================================================== */\nbody [data-variant=\"think\"] {\n  background: var(--dsw-alias-bg-layer-2);\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-left: 3px solid var(--dsw-alias-state-business-primary, #007AFF);\n  border-radius: 10px;\n  padding: 8px 14px;\n  margin: 4px 0 0;\n}\nbody [data-variant=\"think\"][data-state=\"running\"] {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 5%, var(--dsw-alias-bg-layer-2));\n  box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 25%, transparent);\n}\n\n/* ============================================================================\n   §8. TRAJECTORY  (@deepseek-ai/dsh-client-ui-trajectory  haSm5q_*)\n   Old: .Y0dWHa_kindTag / .Y0dWHa_table tr[data-selected=true] /\n        .Y0dWHa_detailTabs / _detailTab / _detailTabActive /\n        tr[data-collapsed-summary] td\n   Dropped (see NOTES.md): old per-event card + timeline-dot rules\n   body (Y0dWHa_table border-spacing, td.Y0dWHa_event cards, ::before dots,\n   Y0dWHa_turnRail display:none) — 0.2.1 redesigned the trajectory with its own\n   turn/selection rails and the reference screenshot intent is \"boxed coloured\n   badges + blue selected row\", which is what we port here.\n   ========================================================================== */\n\n/* Boxed, coloured kind badge (0.2.1 per-kind colour classes set currentColor). */\nbody .haSm5q_kindTag {\n  border-radius: 5px;\n  border: 1.5px solid currentColor;\n  background: color-mix(in srgb, currentColor 16%, transparent);\n  height: 20px;\n  font-size: 11px;\n  font-weight: 700;\n}\n\n/* Blue selected row (0.2.1 base uses interactive-bg-active). */\nbody .haSm5q_table tbody tr[data-selected=\"true\"] {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 10%, transparent);\n}\n\n/* Collapsed-summary rows keep a subtle platform fill (old rule). */\nbody .haSm5q_table tbody tr[data-collapsed-summary] td {\n  background: var(--dsw-alias-bg-module-platform);\n}\n\n/* iOS-style pill detail tabs (old rule; 0.2.1 base has underline tabs). */\nbody .haSm5q_detailTabs {\n  gap: 4px;\n  padding: 4px 8px;\n  height: 38px;\n  align-items: center;\n}\nbody .haSm5q_detailTab {\n  border-radius: 999px;\n  padding: 3px 12px;\n  line-height: 18px;\n}\nbody .haSm5q_detailTabActive,\nbody .haSm5q_detailTabActive:hover {\n  background: var(--dsw-alias-button-info-fill, #007AFF);\n  color: #FFFFFF;\n}\nbody .haSm5q_detailTabActive:after {\n  display: none;\n}\n\n/* ============================================================================\n   body §9. SETTINGS  (@deepseek-ai/dsh-client-ui-settings-general wCInkW_*,\n                  body settings-account _8RVnMG_* and KrzJGG_*, settings-models _3nPmjq_*,\n                  theme v01cdW_*)\n   Old: .VOzbGW_* / ._WvWnq_section / .ydkMvW_section / .zGbnIq_* /\n        ._8HJdBW_themeCube / ._card_1b2ny_13\n   ========================================================================== */\n\n/* ---- 9.1 nav rail ------------------------------------------------------- */\n/* Old macOS System-Settings rail: 220px, 17px semibold title, squircle icons. */\nbody .wCInkW_nav {\n  width: 220px;\n}\nbody .wCInkW_navTitle {\n  font-size: 17px;\n  font-weight: 600;\n}\nbody .wCInkW_navCell {\n  border-radius: 8px;\n}\n/* Squircle icon chip (0.2.1 base only sets flex:none). */\nbody .wCInkW_navIcon {\n  display: block;\n  width: 26px;\n  height: 26px;\n  padding: 5px;\n  box-sizing: border-box;\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-module-platform);\n  color: var(--dsw-alias-state-business-primary, #007AFF);\n}\n/* Active row: blue chip + white glyph (token drives the row tint:\n   --dsw-specific-sidebar-nav-item-active). */\nbody .wCInkW_navCell.wCInkW_active .wCInkW_navIcon,\nbody .wCInkW_navCell[aria-current=\"true\"] .wCInkW_navIcon {\n  background: var(--dsw-alias-button-info-fill, #007AFF);\n  color: #FFFFFF;\n}\n\n/* ---- 9.2 panel shell ---------------------------------------------------- */\n/* Old settings dialog: 1000px wide, 16px radius (radius-panel token = 16). */\nbody .wCInkW_panel {\n  width: 1000px;\n  max-width: calc(100vw - 48px);\n}\nbody .wCInkW_trigger {\n  border-radius: 8px;\n}\n\n/* Popup-select trigger inside settings rows: old macOS bordered white menu\n   button. 0.2.1's per-tab selectors are grey pills (bg-module-platform, no\n   border) owned by different packages (runtime classes confirmed in\n   discover2-settings-rows.json):\n     .Hefa_q_selector     dsh-client-locale (language)\n     ._3HsggG_selector    dsh-client-ui-permission-presets (access mode)\n     .XZcbxG_selector     dsh-client-ui-chat (workspace steps / perf details)\n     .mP3ANa_selector     dsh-client-ui-conversation (busy-send behaviour)\n   Only surface/border are restyled — base size/contents stay so no chevron\n   clipping. 0.2.1 has no wrapper class on these popup selects (_root_4ub78_1 is\n   the generic menu anchor), so the selectors are matched directly. */\nbody .wCInkW_options .Hefa_q_selector,\nbody .wCInkW_options ._3HsggG_selector,\nbody .wCInkW_options .XZcbxG_selector,\nbody .wCInkW_options .mP3ANa_selector {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-1);\n  border-radius: 8px;\n  box-shadow: var(--dsw-shadow-lv1);\n}\nbody .wCInkW_options .Hefa_q_selector:hover,\nbody .wCInkW_options ._3HsggG_selector:hover,\nbody .wCInkW_options .XZcbxG_selector:hover,\nbody .wCInkW_options .mP3ANa_selector:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n/* Grouped settings card (old ._WvWnq_section: layer-1 + hairline + 10px).\n   runtime-dom.md §9: 0.2.1 has no shared SettingsSection class — the old\n   _WvWnq_section/ydkMvW_section look must be applied to every per-tab section\n   module (account / general / models / plugin-inventory / plugins / subagent).\n   Final 0.1.x cascade was the card rule (it came after the divider rule), so\n   the card wins here too. */\nbody ._8RVnMG_section,\nbody .zZnCHW_section,\nbody ._3nPmjq_section,\nbody .RotMhW_section,\nbody .amjGKq_section,\nbody .pbObnW_section {\n  background: var(--dsw-alias-bg-layer-1);\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  padding: 0 16px;\n  overflow: hidden;\n}\n\n/* Account notice card (old ._card_1b2ny_13, owner guess AccountNotice ->\n   .KrzJGG_card; map.json's generic pick differs, semantic owner wins). */\nbody .KrzJGG_card {\n  border-radius: 10px;\n}\n\n/* ---- 9.3 models tab cards/buttons (old zGbnIq_* rules) ------------------ */\nbody ._3nPmjq_primaryButton,\nbody ._3nPmjq_secondaryButton,\nbody ._3nPmjq_dangerButton {\n  border-radius: 10px;\n}\nbody ._3nPmjq_rowActions ._3nPmjq_secondaryButton,\nbody ._3nPmjq_rowActions ._3nPmjq_dangerButton {\n  border-radius: 8px;\n}\nbody ._3nPmjq_addButton,\nbody ._3nPmjq_addModelButton,\nbody ._3nPmjq_linkButton {\n  border-radius: 8px;\n}\nbody ._3nPmjq_rowCard,\nbody ._3nPmjq_editor,\nbody ._3nPmjq_addCard,\nbody ._3nPmjq_setupCard {\n  border-radius: 10px;\n}\nbody ._3nPmjq_modelEntry {\n  border-radius: 6px;\n}\n\n/* ---- 9.4 appearance theme cubes (old _8HJdBW_themeCube) ----------------- */\nbody .v01cdW_themeCube {\n  position: relative;\n  border-radius: 10px;\n  padding: 12px 24px;\n  font-size: 13px;\n  line-height: 18px;\n}\nbody .v01cdW_themeCube.v01cdW_selected {\n  background: var(--dsw-alias-button-primary-fill, #007AFF);\n  border-color: transparent;\n  color: #FFFFFF;\n}\nbody .v01cdW_themeCube.v01cdW_selected::after {\n  content: \"\\2713\";\n  position: absolute;\n  top: 6px;\n  right: 9px;\n  font-size: 12px;\n  font-weight: 700;\n  line-height: 1;\n}\n\n/* ============================================================================\n   §10. COMPOSER  (@deepseek-ai/dsh-client-ui-conversation RlGAzG_*)\n   Old: [data-composer-card] radius, jelly glow (focus / running / sending)\n   body Semantic: [data-composer-card], [data-composer-input] contenteditable,\n             :has(rect) = send button shows the stop square (running)\n   ========================================================================== */\n\n/* 18px composer radius (old rule; token radius-panel renders 16 for dialogs). */\nbody [data-composer-card] {\n  border-radius: 18px;\n}\n\n/* Jelly glow ring (hidden until focus/running). */\nbody [data-composer-card]::after {\n  content: \"\";\n  position: absolute;\n  inset: -2px;\n  border-radius: inherit;\n  padding: 2px;\n  background: linear-gradient(\n    110deg,\n    body rgba(0, 150, 255, 0) 15%,\n    body rgba(0, 150, 255, 0.9) 38%,\n    body rgba(0, 220, 255, 0.95) 50%,\n    body rgba(0, 150, 255, 0.9) 62%,\n    rgba(0, 150, 255, 0) 85%\n  );\n  background-size: 250% 250%;\n  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);\n  -webkit-mask-composite: xor;\n  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);\n  mask-composite: exclude;\n  opacity: 0;\n  pointer-events: none;\n  z-index: 1;\n}\n\n/* Focus: blue border + soft Apple focus halo.\n   0.1.x used textarea:focus; 0.2.1's editor is a contenteditable\n   [data-composer-input] div. */\nbody [data-composer-card]:has([data-composer-input]:focus) {\n  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 45%, transparent);\n  box-shadow:\n    body var(--dsw-shadow-lv2),\n    0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary, #007AFF) 12%, transparent);\n}\n\n/* Running: breathing halo + flowing jelly ring (stop-square rect in the send\n   button is the 0.2.1 running marker — verified in bundle JSX, sent by Lead). */\nbody [data-composer-card]:has(rect) {\n  animation: dsh-jelly-breathe 2.6s ease-in-out infinite;\n}\nbody [data-composer-card]:has(rect)::after {\n  opacity: 1;\n  animation: dsh-jelly-flow 3.2s linear infinite;\n}\n\n/* Sending: white shimmer. 0.1.x keyed off textarea[data-phase=\"submitting\"];\n   0.2.1's editor is a contenteditable div. The pending state shows as the\n   `.RlGAzG_pending` 8px dot inside the card (`RlGAzG_input-pending` is only a\n   @keyframes name, not a class — do not use it as a selector). */\nbody [data-composer-card]:has(.RlGAzG_pending)::after {\n  opacity: 1;\n  background: linear-gradient(\n    110deg,\n    body rgba(255, 255, 255, 0) 15%,\n    body rgba(255, 255, 255, 0.95) 38%,\n    body rgba(190, 235, 255, 1) 50%,\n    body rgba(255, 255, 255, 0.95) 62%,\n    rgba(255, 255, 255, 0) 85%\n  );\n  background-size: 250% 250%;\n  animation: dsh-jelly-send 0.7s ease-in-out infinite;\n}\n\n@keyframes dsh-jelly-breathe {\n  0%, 100% {\n    box-shadow: 0 0 0 0 rgba(0, 160, 255, 0), var(--dsw-shadow-lv2);\n  }\n  50% {\n    box-shadow:\n      0 0 26px 3px rgba(0, 160, 255, 0.32),\n      0 0 64px 10px rgba(70, 190, 255, 0.16),\n      var(--dsw-shadow-lv2);\n  }\n}\n@keyframes dsh-jelly-flow {\n  0% {\n    background-position: 0% 50%;\n  }\n  100% {\n    background-position: 150% 50%;\n  }\n}\n@keyframes dsh-jelly-send {\n  0%, 100% {\n    background-position: 0% 50%;\n    opacity: 0.55;\n  }\n  50% {\n    background-position: 150% 50%;\n    opacity: 1;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  body [data-composer-card]:has(rect),\n  body [data-composer-card]::after {\n    animation: none;\n  }\n  body [data-composer-card]:has(rect)::after {\n    opacity: 0.55;\n  }\n}\n\n/* ============================================================================\n   §11. SHARED UI KIT — menus / popovers / dialogs / toast / tooltip / pills\n        (dsh-web-frontend index-*.css, family-B modules; see adapter table)\n   body Old: ._list_19372_8/_submenu_19372_9, ._item_19372_91, ._check_19372_181,\n        body ._dialog_15u5s_22, ._confirmation_1nu42_1, ._toast_fvpz7_7,\n        body ._bubble_owhem_8, ._pill_e3ygd_1, ._button_kz6gm_4, ._sm_kz6gm_30,\n        body ._card_1b2ny_13, ._backdrop_18d3q_1, ._close_18d3q_30,\n        ._root_19372_1 (popup select), ._markdown_1nba0_5\n   body NOTE: dialog radius (old 16) is already covered by the radius-panel token,\n   button radius (10) by radius-md, sm button radius (8) by radius-sm. The menu\n   fill + blur are token-driven (--dsw-menu-surface-fill /\n   --dsw-menu-backdrop-filter in tokens.css).\n   ========================================================================== */\n\n/* Finder-style menu surface radius (0.2.1 surface = radius-lg 14 -> old 10).\n   TODO(verify): menu surface menu family is ._surface_ri079_1 (shell CSS). */\nbody ._surface_ri079_1 {\n  border-radius: 10px;\n}\n\n/* Menu row height/radius (old normal 28/6, dense 26/5). */\nbody ._item_4ub78_90 {\n  min-height: 28px;\n  border-radius: 6px;\n}\nbody ._denseList_4ub78_124 ._item_4ub78_90 {\n  min-height: 26px;\n  border-radius: 5px;\n}\n/* Select checkmark: Apple blue (old rule). */\nbody ._check_4ub78_179 {\n  color: var(--dsw-alias-state-business-primary, #007AFF);\n}\n\n/* Dialog backdrop: old ._backdrop blurred the page behind a modal. */\nbody ._backdrop_19zw2_2 {\n  -webkit-backdrop-filter: var(--dsw-mask-blur);\n  backdrop-filter: var(--dsw-mask-blur);\n}\n/* Old round close button hover. */\nbody ._close_19zw2_37:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n\n/* Toast radius (old 10; 0.2.1 base radius-lg 14). */\nbody ._toast_l6cvn_6 {\n  border-radius: 10px;\n}\n\n/* Tooltip bubble radius (old 6; 0.2.1 base radius-sm 8). */\nbody ._bubble_12mhf_1 {\n  border-radius: 6px;\n}\n\n/* Status pill radius (old 8; 0.2.1 base 999). */\nbody ._pill_1bqmh_1 {\n  border-radius: 8px;\n}\n\n/* Hovercard radius (old 10; 0.2.1 base radius-lg 14). */\nbody ._card_38jqx_9 {\n  border-radius: 10px;\n}\n\n/* ============================================================================\n   §12. SMALL REGIONS\n   ========================================================================== */\n\n/* Context/meter bar (old nLMEza_bar radius 10; 0.2.1 999px pill). */\nbody ._2WTFBq_bar {\n  border-radius: 10px;\n}\n\n/* Hero workspace trigger + directory modal input (old radius 10). */\nbody .Hqq-bq_workspace {\n  border-radius: 10px;\n}\nbody .Hqq-bq_modalInput {\n  border-radius: 10px;\n}\n\n/* Tool io card (old o3BgMG_ioCard radius 10; 0.2.1 radius-lg 14). */\nbody .pFy1Ka_ioCard {\n  border-radius: 10px;\n}\n\n/* Cordis run rows (old cvtE3a_business 10 / cvtE3a_message 6). */\nbody ._3jVEXG_business {\n  border-radius: 10px;\n}\nbody ._3jVEXG_message {\n  border-radius: 6px;\n}\n\n/* Directory picker rows (old ZuhsRW_* mapping; base uses interactive-bg-active). */\nbody .Fv-y6W_rowSelected,\nbody .Fv-y6W_rowSelected:hover {\n  background: rgba(0, 122, 255, 0.14);\n}\nbody[data-ds-dark-theme] .Fv-y6W_rowSelected,\nbody[data-ds-dark-theme] .Fv-y6W_rowSelected:hover {\n  background: rgba(10, 132, 255, 0.22);\n}\nbody .Fv-y6W_createInput {\n  border-radius: 10px;\n}\nbody .Fv-y6W_loadingFloat {\n  border-radius: 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* ============================================================================\n   §13. DROPPED OLD RULES (documented here + NOTES.md)\n     .fV0t5q_root{background:layer-1}            -> would re-opaque the\n        conversation area shell.css keeps transparent; frost lives in §4.\n     .pI_x6G_frame{background:transparent}       -> superseded by shell.css\n        (.BynINW_frame etc. !important); old frame class no longer exists.\n     .Y0dWHa_table border-spacing / td cards / ::before timeline dots /\n        td::after rail line / .Y0dWHa_table .Y0dWHa_turnRail{display:none}\n        -> 0.2.1 trajectory is a redesigned table with its own turn/selection\n        rails; reference-screenshot intent (boxed badges + blue selection) is\n        ported in §8, the card experiment is not.\n     ._7yHdaG_panel{border-radius:10px 10px 0 0} -> ambiguous map entry\n        (amjGKq_panel = plugin-manager page, not a bottom sheet any more).\n     .bqrRRG_card{border-radius:14px} / .qSYn7G_card{box-shadow:lv1}\n        -> ambiguous card modules; radius-lg token already renders 14px and\n        elevation tokens cover panel shadows.\n     .ydkMvW_section dividers -> ambiguous per-tab section modules; 0.2.1 rows\n        carry their own dividers (e.g. settings-locale .Hefa_q_row).\n     #dsh-bg-canvas{...} -> the canvas is positioned inline by background.js\n        (position:fixed;inset:0;z-index:-1), no CSS needed.\n     ::-webkit-scrollbar{width:6px} -> covered by --dsh-scrollbar-width token.\n     body .VOzbGW/YDXeBa/wSkVaW/... -> all old CSS-module hashes are dead;\n        every rule above uses the 0.2.1 adapter or a semantic hook.\n   ========================================================================== */\n\n/* ============================================================================\n   §15. 0.2.x DESKTOP EXTRAS (v2.1, 2026-10-18)\n   Surfaces that did not exist (or were not covered) in the 0.1.x skin.\n   All classes below were verified in the installed 0.2.1-rc.2 bundles:\n     .Dc7zOa_header*      dsh-client-ui-conversation/ConversationRoot\n     .xz4KEq_running      dsh-client-ui-chat/ChatView\n     [data-tool] / card   dsh-client-ui-tool + per-tool modules\n     .OUqwTW_*            dsh-client-ui-sidebar-right\n     ._2WTFBq_bar         dsh-client-ui-context (meter)\n   ========================================================================== */\n\n/* Header chips (agent team / mode / subagent count / background jobs):\n   quiet macOS pills instead of bare text buttons. */\nbody .Dc7zOa_headerActions button,\nbody .Dc7zOa_headerUtilities button,\nbody .Dc7zOa_headerCorner button,\nbody [data-slot=\"conversation.session.header.utilities\"] button,\nbody [data-slot=\"conversation.session.header.corner\"] button {\n  border-radius: 999px !important;\n  padding: 4px 10px !important;\n  min-height: 26px;\n  font-size: 12px !important;\n  color: var(--dsw-alias-label-secondary);\n  transition: background-color .16s var(--ds-ease-in-out), color .16s var(--ds-ease-in-out);\n}\nbody .Dc7zOa_headerActions button:hover,\nbody .Dc7zOa_headerUtilities button:hover,\nbody .Dc7zOa_headerCorner button:hover,\nbody [data-slot=\"conversation.session.header.utilities\"] button:hover,\nbody [data-slot=\"conversation.session.header.corner\"] button:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n/* Running strip: floating frosted pill instead of a full-width bar. */\nbody .xz4KEq_running {\n  margin: 4px auto 10px;\n  padding: 5px 14px;\n  width: fit-content;\n  max-width: 80%;\n  border-radius: 999px;\n  background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent);\n  border: 1px solid var(--dsw-alias-border-l1);\n  box-shadow: var(--dsw-shadow-lv1);\n  -webkit-backdrop-filter: blur(10px);\n  backdrop-filter: blur(10px);\n}\n\n/* Tool cards (read/write/edit/pwsh/…): macOS inset surface. */\nbody [data-tool] [class*=\"_card\"] {\n  border-radius: 12px;\n  border: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* Markdown: code blocks / inline code / tables get the same radii as the rest. */\nbody ._markdown_1ypvv_5 pre {\n  border-radius: 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n}\nbody ._markdown_1ypvv_5 :not(pre) > code {\n  border-radius: 5px;\n  padding: 1px 5px;\n  background: var(--dsw-alias-bg-module-platform);\n}\nbody ._markdown_1ypvv_5 table {\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 10px;\n  overflow: hidden;\n}\n\n/* Queue dock / context meter: rounded, quiet. */\nbody [data-queue-dock] {\n  border-radius: 12px;\n}\nbody ._2WTFBq_bar {\n  border-radius: 10px;\n}\n\n/* Right sidebar (session details / files): let the aquarium glass through. */\nbody .OUqwTW_panel,\nbody .OUqwTW_panelBody,\nbody .OUqwTW_tabBody {\n  background: transparent !important;\n}\n\n/* Sidebar footer: hairline separator above \"更多\". */\nbody ._2H3hWW_footArea {\n  border-top: 1px solid var(--dsw-alias-border-l1);\n}\n\n/* Composer seat: replace the opaque sticky gradient with a soft fade, so the\n   water keeps flowing under the input bar (was a visible seam on Desktop). */\nbody [data-composer-seat],\nbody .Dc7zOa_composerSeat {\n  background: linear-gradient(\n    180deg,\n    rgba(255, 255, 255, 0) 0%,\n    rgba(255, 255, 255, 0.35) 55%,\n    rgba(255, 255, 255, 0.5) 100%\n  ) !important;\n}\nbody[data-ds-dark-theme] [data-composer-seat],\nbody[data-ds-dark-theme] .Dc7zOa_composerSeat {\n  background: linear-gradient(\n    180deg,\n    rgba(10, 12, 19, 0) 0%,\n    rgba(10, 12, 19, 0.45) 55%,\n    rgba(10, 12, 19, 0.6) 100%\n  ) !important;\n}\r\n\n/* Windows 40px window-chrome band: keep it solid for the native caption probe\n   but let a hint of water sit at its top edge. (Same selector as shell.css;\n   regions.css is injected later, so this wins.) */\n[data-windows-titlebar] .BynINW_frame:before {\n  background:\n    linear-gradient(180deg, rgba(206, 224, 255, 0.60) 0%, rgba(242, 242, 247, 0) 72%),\n    var(--dsw-specific-sidebar-fill) !important;\n}\nbody[data-ds-dark-theme][data-windows-titlebar] .BynINW_frame:before,\n[data-ds-dark-theme] [data-windows-titlebar] .BynINW_frame:before {\n  background:\n    linear-gradient(180deg, rgba(56, 78, 136, 0.45) 0%, rgba(44, 44, 46, 0) 72%),\n    var(--dsw-specific-sidebar-fill) !important;\n}\r\n\n/* Secondary full-page surfaces (schedule page, account overlay): transparent so\n   the aquarium reads through instead of a flat white sheet. */\nbody .S0jZwq_page,\nbody .TaJwIq_overlay {\n  background: transparent !important;\n}\n\n/* Schedule page filter tabs: iOS segmented pill (same treatment as view tabs). */\nbody .S0jZwq_filterTabs {\n  background: var(--dsw-alias-bg-module-platform);\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: 999px;\n  padding: 3px;\n  gap: 0;\n}\nbody .S0jZwq_filterTab {\n  border-radius: 999px;\n  padding: 5px 14px;\n  height: 28px;\n  color: var(--dsw-alias-label-primary);\n}\nbody .S0jZwq_filterTab:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\nbody .S0jZwq_filterTabActive,\nbody .S0jZwq_filterTabActive:hover {\n  background: var(--dsw-alias-button-info-fill);\n  color: #FFFFFF;\n}\r\n\n/* Message row extras: turn summary chip, inline file links, hover actions,\n   image frames, \"open with\" buttons. Classes from dsh-client-ui-chat /\n   dsh-client-ui-tool / dsh-client-ui-attachment in 0.2.1-rc.2. */\nbody ._4AI11G_root {\n  border-radius: 999px;\n  padding: 3px 10px;\n  margin-left: -10px;\n  color: var(--dsw-alias-label-tertiary);\n  transition: background-color .15s var(--ds-ease-in-out);\n}\nbody ._4AI11G_root:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\nbody .WW4l1q_title {\n  color: var(--dsw-alias-label-secondary);\n}\nbody .pFy1Ka_fileLink {\n  border-radius: 6px;\n  padding: 1px 6px;\n  background: var(--dsw-alias-bg-module-platform);\n  text-decoration: none;\n}\nbody .pFy1Ka_fileLink:hover {\n  background: var(--dsw-alias-interactive-bg-hover-solid);\n}\nbody .xD_KDq_action,\nbody .vpunvW_action {\n  border-radius: 7px;\n}\nbody .Nhu-QW_frame {\n  border-radius: 12px;\n  overflow: hidden;\n  border: 1px solid var(--dsw-alias-border-l1);\n}\nbody .WgQWqa_main {\n  border-radius: 8px;\n}\r\n";

    // ---- 背景动画 + 发送按钮鲸鱼（src/background.js）----
function startBackground() {
  var __disposed = false;
  var __winListeners = [];
  function __on(t, type, fn, opts) { t.addEventListener(type, fn, opts); __winListeners.push([t, type, fn]); }
  var __pre = document.getElementById('dsh-bg-canvas');
  if (__pre && __pre.parentNode) __pre.parentNode.removeChild(__pre);
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  var DPR = Math.min(window.devicePixelRatio || 1, 1.25);
  var vw = window.innerWidth, vh = window.innerHeight;
var WHALE = 'M22.917 1.43C22.671 1.31 22.566 1.539 22.422 1.655C22.373 1.693 22.332 1.742 22.29 1.787C21.932 2.17 21.513 2.421 20.966 2.391C20.166 2.346 19.483 2.598 18.879 3.21C18.75 2.455 18.324 2.005 17.675 1.716C17.335 1.566 16.992 1.415 16.754 1.089C16.588 0.856 16.542 0.597 16.459 0.342C16.406 0.188 16.354 0.03 16.176 0.004C15.984 -0.026 15.908 0.135 15.833 0.27C15.531 0.822 15.414 1.43 15.425 2.046C15.452 3.432 16.037 4.535 17.199 5.32C17.331 5.41 17.365 5.5 17.324 5.632C17.244 5.902 17.15 6.165 17.067 6.435C17.014 6.608 16.935 6.646 16.75 6.57C16.112 6.304 15.561 5.909 15.074 5.433C14.248 4.633 13.5 3.751 12.568 3.06C12.349 2.898 12.13 2.748 11.903 2.605C10.952 1.682 12.028 0.923 12.277 0.833C12.538 0.739 12.368 0.416 11.526 0.42C10.684 0.424 9.914 0.706 8.933 1.081C8.789 1.138 8.638 1.179 8.484 1.213C7.593 1.044 6.668 1.006 5.702 1.115C3.883 1.318 2.43 2.178 1.362 3.646C0.079 5.41 -0.223 7.415 0.147 9.506C0.535 11.71 1.66 13.535 3.389 14.962C5.181 16.441 7.246 17.166 9.601 17.027C11.032 16.944 12.624 16.753 14.421 15.232C14.874 15.458 15.35 15.548 16.138 15.615C16.746 15.672 17.331 15.585 17.784 15.491C18.493 15.341 18.444 14.684 18.188 14.564C16.108 13.595 16.565 13.989 16.15 13.67C17.206 12.42 18.82 10.198 19.318 7.172C19.367 6.838 19.43 6.368 19.422 6.097C19.418 5.932 19.456 5.868 19.645 5.849C20.166 5.789 20.671 5.647 21.136 5.391C22.483 4.655 23.027 3.446 23.155 1.997C23.174 1.776 23.151 1.547 22.917 1.43ZM11.175 14.474C9.159 12.889 8.182 12.368 7.778 12.39C7.401 12.412 7.469 12.844 7.552 13.126C7.639 13.404 7.752 13.596 7.91 13.84C8.02 14.001 8.095 14.241 7.801 14.422C7.152 14.823 6.023 14.287 5.97 14.26C4.657 13.486 3.559 12.466 2.785 11.069C2.037 9.725 1.603 8.283 1.532 6.744C1.513 6.372 1.622 6.241 1.992 6.173C2.479 6.083 2.981 6.064 3.468 6.136C5.525 6.436 7.276 7.356 8.744 8.813C9.582 9.642 10.216 10.634 10.869 11.602C11.563 12.631 12.31 13.611 13.262 14.415C13.598 14.696 13.866 14.91 14.122 15.068C13.349 15.155 12.058 15.173 11.175 14.475L11.175 14.474ZM12.141 8.26C12.141 8.095 12.273 7.963 12.439 7.963C12.476 7.963 12.51 7.971 12.541 7.982C12.582 7.997 12.62 8.019 12.65 8.053C12.704 8.106 12.734 8.181 12.734 8.26C12.734 8.425 12.602 8.556 12.436 8.556C12.27 8.556 12.141 8.425 12.141 8.26ZM15.142 9.799C14.949 9.878 14.756 9.945 14.572 9.953C14.284 9.968 13.972 9.851 13.802 9.709C13.538 9.487 13.348 9.363 13.27 8.977C13.236 8.812 13.254 8.556 13.284 8.41C13.352 8.094 13.277 7.892 13.054 7.708C12.874 7.558 12.643 7.516 12.39 7.516C12.296 7.516 12.209 7.475 12.144 7.441C12.039 7.389 11.952 7.257 12.035 7.096C12.062 7.043 12.19 6.916 12.22 6.893C12.564 6.698 12.96 6.762 13.326 6.908C13.666 7.047 13.922 7.302 14.292 7.663C14.67 8.098 14.738 8.218 14.952 8.545C15.122 8.801 15.277 9.063 15.383 9.364C15.447 9.551 15.364 9.705 15.142 9.799Z",fill:"currentColor';
  // 修正复制路径尾部的 SVG 属性污染，保留其余路径数据不变。
  WHALE = WHALE.replace('",fill:"currentColor', '');
  /* ---------------- whale texture + dot cells ---------------- */
  // 统一纹理坐标：64 条重叠纵片与点阵共用同一波函数，避免动态脱壳和竖缝。
  var WHALE_UW = 23.6, WHALE_UH = 17.2, WHALE_STRIPS = 64;
  var GW = 40, GH = 29;
  var whalePath = new Path2D(WHALE);
  var whaleTexture = document.createElement('canvas');
  whaleTexture.width = 708; whaleTexture.height = 516;
  var whaleTextureCtx = whaleTexture.getContext('2d');
  var whaleWarp = document.createElement('canvas');
  var whaleWarpCtx = whaleWarp.getContext('2d');
  var whaleTextureKey = '';
  function paintWhaleTexture(rgb) {
    if (whaleTextureKey === rgb) return;
    whaleTextureCtx.clearRect(0, 0, whaleTexture.width, whaleTexture.height);
    whaleTextureCtx.save();
    var tk = whaleTexture.width / WHALE_UW;
    whaleTextureCtx.translate(0.223 * tk, 0.026 * tk);
    whaleTextureCtx.scale(tk, tk);
    whaleTextureCtx.fillStyle = 'rgb(' + rgb + ')';
    whaleTextureCtx.fill(whalePath);
    whaleTextureCtx.restore();
    whaleTextureKey = rgb;
  }
  paintWhaleTexture('255,255,255');
  var cells = [];
  (function () {
    var px = whaleTextureCtx.getImageData(0, 0, whaleTexture.width, whaleTexture.height).data;
    for (var gy = 0; gy < GH; gy++) {
      for (var gx = 0; gx < GW; gx++) {
        var tx = Math.min(whaleTexture.width - 1, Math.floor((gx + 0.5) * whaleTexture.width / GW));
        var ty = Math.min(whaleTexture.height - 1, Math.floor((gy + 0.5) * whaleTexture.height / GH));
        var al = px[(ty * whaleTexture.width + tx) * 4 + 3];
        if (al > 176) cells.push({ gx: gx, gy: gy });
      }
    }
  })();
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
      whale: dark ? '150,185,255' : '95,135,255'
    };
  }
  var whaleW = Math.min(380, vw * 0.34);
  var whaleLaneRatio = vh < 760 ? 0.60 : 0.74;
  var whale = { x: vw * 0.36, bandY: vh * whaleLaneRatio, y: vh * whaleLaneRatio, amp: vh * 0.065, ph: Math.random() * 6.283, dir: 1, speed: 28, flee: 0, fvx: 0, fvy: 0, tvx: 0, tvy: 0, fleeLevel: 0, cool: 0, turn: 0, turnDir: 0, turnScale: 1, tilt: 0, pathVy: 0 };
  function resize() {
    var oldW = vw || window.innerWidth, oldH = vh || window.innerHeight;
    var nx = whale ? whale.x / oldW : 0.30, ny = whale ? whale.bandY / oldH : 0.60;
    vw = window.innerWidth; vh = window.innerHeight;
    whaleLaneRatio = vh < 760 ? 0.60 : 0.74;
    DPR = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.floor(vw * DPR);
    canvas.height = Math.floor(vh * DPR);
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
  __on(window, 'resize', resize);
  var paused = false;
  __on(window, 'blur', function () { paused = true; });
  __on(window, 'focus', function () { paused = false; });
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
  // 唯一身体形变：头端不足 0.5% 体长，中段渐增，尾端正常 6%、受惊最高 7%。
  function whaleWave(xn, now, amp) {
    xn = Math.max(0, Math.min(1, xn));
    var envelope = 0.004 + 0.996 * Math.pow(xn, 2.05);
    var rate = 0.00370 * (1 + whale.fleeLevel * 0.42);
    return amp * envelope * Math.sin(now * rate - xn * 6.2 + whale.ph);
  }
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
    var surf = vh * 0.12;
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
    var glints = [0.05, 0.18, 0.32, 0.49, 0.66, 0.81, 0.94];
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
    ctx.lineCap = 'butt';
    var pitch = whaleW / GW;
    var whaleH = whaleW * WHALE_UH / WHALE_UW;
    var tailAmp = whaleW * (0.060 + 0.010 * whale.fleeLevel);
    var wa = 0.44 + whale.fleeLevel * 0.12;
    var dotR = Math.max(1.05, Math.min(1.48, pitch * 0.14));
    ctx.save();
    ctx.translate(whale.x * DPR, whale.y * DPR);
    ctx.rotate(whale.tilt);
    ctx.scale(-whale.dir * whale.turnScale, 1);
    paintWhaleTexture(P.whale);
    var warpPad = Math.ceil(tailAmp + 4);
    var warpW = Math.ceil(whaleW + 8), warpH = Math.ceil(whaleH + warpPad * 2);
    if (whaleWarp.width !== warpW || whaleWarp.height !== warpH) { whaleWarp.width = warpW; whaleWarp.height = warpH; whaleWarpCtx = whaleWarp.getContext('2d'); }
    whaleWarpCtx.clearRect(0, 0, warpW, warpH);
    var srcStrip = whaleTexture.width / WHALE_STRIPS;
    var dstStrip = whaleW / WHALE_STRIPS;
    for (var ws = 0; ws < WHALE_STRIPS; ws++) {
      var stripXn = (ws + 0.5) / WHALE_STRIPS;
      var srcLeft = Math.max(0, ws * srcStrip - 2);
      var srcRight = Math.min(whaleTexture.width, (ws + 1) * srcStrip + 2);
      var dstLeft = 4 + ws * dstStrip - (ws > 0 ? 1.2 : 0);
      var dstRight = 4 + (ws + 1) * dstStrip + (ws < WHALE_STRIPS - 1 ? 1.2 : 0);
      whaleWarpCtx.drawImage(whaleTexture, srcLeft, 0, srcRight - srcLeft, whaleTexture.height, dstLeft, warpPad + whaleWave(stripXn, now, tailAmp), dstRight - dstLeft, whaleH);
    }
    ctx.globalAlpha = 0.055 + whale.fleeLevel * 0.018;
    ctx.drawImage(whaleWarp, -warpW * 0.5 * DPR, -warpH * 0.5 * DPR, warpW * DPR, warpH * DPR);
    ctx.globalAlpha = 1;
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var dx = (c.gx + 0.5 - GW / 2) * pitch;
      var dy = (c.gy + 0.5 - GH / 2) * (whaleH / GH);
      var xn = (c.gx + 0.5) / GW;
      dy += whaleWave(xn, now, tailAmp);
      var yb = (c.gy + 0.5) / GH;
      var cr = Math.round(180 - (180 - 95) * yb);
      var cg2 = Math.round(200 - (200 - 135) * yb);
      var cellAlpha = wa * (0.78 + Math.sin(Math.PI * xn) * 0.14) * (0.88 + (1 - yb) * 0.12);
      ctx.fillStyle = 'rgba(' + cr + ',' + cg2 + ',255,' + cellAlpha.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(dx * DPR, dy * DPR, dotR * DPR, 0, 6.2832); ctx.fill();
    }
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
  }
  var simTime = 0;
  var lastT = 0;
  if (reduced) {
    // reduced-motion 只绘制一帧静态背景，不能 return，后缀发送按钮仍需初始化。
    draw(0, 0);
  } else {
    function step(ts) {
      if (__disposed) return;
      requestAnimationFrame(step);
      if (document.hidden || paused) { lastT = ts; return; }
      if (!lastT) { lastT = ts; return; }
      if (ts - lastT < 41) return;
      var dt = Math.min(Math.max(ts - lastT, 0), 66);
      lastT = ts;
      simTime += dt;
      updateWhale(dt, simTime);
      updateBubbles(dt);
      draw(simTime, dt);
    }
    requestAnimationFrame(step);
  }
/* ==== Send-button dot-matrix whale (60fps) ==== */
  var BGW = 20, BGH = 15;
  var bCells = [];
  (function () {
    var bs = document.createElement('canvas');
    bs.width = BGW * 2; bs.height = BGH * 2;
    var bsc = bs.getContext('2d');
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
  function attachButtonWhale() {
    var btns = document.querySelectorAll('[data-composer-card] button[class*="_primary"]');
    for (var bi = 0; bi < btns.length; bi++) {
      var btn = btns[bi];
      if (btn.__dshWhaleCanvas && btn.__dshWhaleCanvas.parentElement === btn) continue;
      var cvs = document.createElement('canvas');
      cvs.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3';
      cvs.width = 68; cvs.height = 68;
      btn.appendChild(cvs);
      btn.__dshWhaleCanvas = cvs;
    }
  }
  var __btnTimer = setInterval(attachButtonWhale, 600);
  var lastBtnDraw = 0;
  function drawButtonWhale() {
    if (document.hidden || paused) return;
    var need = false;
    var probe = document.querySelectorAll('[data-composer-card] button[class*="_primary"]');
    for (var pi = 0; pi < probe.length; pi++) {
      var psvg = probe[pi].querySelector('svg');
      var prun = !!(psvg && psvg.querySelector('rect'));
      if (prun || probe[pi].__lastRunning !== prun) { need = true; break; }
    }
    if (!need) return;
    var nowMs = Date.now();
    if (nowMs - lastBtnDraw < 33) return;
    lastBtnDraw = nowMs;
    var btns = probe;
    for (var bi = 0; bi < btns.length; bi++) {
      var btn = btns[bi];
      var cvs = btn.__dshWhaleCanvas;
      if (!cvs || cvs.parentElement !== btn) continue;
      var c2 = cvs.getContext('2d');
      c2.clearRect(0, 0, cvs.width, cvs.height);
      var svg = btn.querySelector('svg');
      var running = !!(svg && svg.querySelector('rect'));
      btn.__lastRunning = running;
      var now = Date.now();
      var W = cvs.width, H = cvs.height;
      var whaleW = W * 0.82;
      var pitch = whaleW / BGW;
      var cx = W / 2, cy = H / 2;
      var t = now * 0.0052;
      var bob = running ? Math.sin(now * 0.0022) * 1.6 : 0;
      for (var i = 0; i < bCells.length; i++) {
        var c = bCells[i];
        var dx = (c.gx + 0.5 - BGW / 2) * pitch;
        var dy = (c.gy + 0.5 - BGH / 2) * pitch;
        if (running) {
          var xn = (c.gx + 0.5) / BGW;
          dy += Math.pow(xn, 1.35) * 4 * Math.sin(t - xn * 6.5);
          dy += bob;
        }
        c2.fillStyle = 'rgba(' + c.rgb + ',0.92)';
        c2.beginPath();
        c2.arc(cx + dx, cy + dy, pitch * 0.38, 0, 6.2832);
        c2.fill();
      }
    }
  }
  (function btnLoop() {
    if (__disposed) return;
    requestAnimationFrame(btnLoop);
    drawButtonWhale();
  })();

  return function () {
    __disposed = true;
    clearInterval(__btnTimer);
    for (var i = 0; i < __winListeners.length; i++) {
      var L = __winListeners[i];
      L[0].removeEventListener(L[1], L[2]);
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    var stale = document.querySelectorAll('[data-composer-card] button[class*=\"_primary\"]');
    for (var k = 0; k < stale.length; k++) {
      var c = stale[k].__dshWhaleCanvas;
      if (c && c.parentNode) c.parentNode.removeChild(c);
      try { delete stale[k].__dshWhaleCanvas; delete stale[k].__lastRunning; } catch (e) {}
    }
  };
}

function apply(ctx) {
  // 皮肤样式注入（卸载时移除；先清理可能残留的同名 <style>）。
  // 顺序：发送按钮 → 设计令牌 → 外壳/桌面层 → 分区皮肤。
  ctx.effect(() => {
    var stale = document.querySelectorAll('style[data-dsh-whale-aqua]');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }
    var el = document.createElement('style');
    el.setAttribute('data-dsh-whale-aqua', THEME_VERSION);
    el.textContent = [WHALE_ICON_CSS, TOKENS_CSS, SHELL_CSS, REGIONS_CSS].join('\n');
    document.head.appendChild(el);
    return () => { if (el.parentNode) el.parentNode.removeChild(el); };
  });

  // 背景 + 发送按钮动画：startBackground 返回清理函数，直接作为 effect disposer。
  ctx.effect(startBackground);
}
    exports.apply = apply;
    return module.exports;
  },
});

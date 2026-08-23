// dsh-whale-aqua —— 浏览器面（client face）。
// 由 DSH web 前端的 __ModuleLoader__ 按 cordis.patch.yml 的 insert 行加载。
// 内容：
//   1. 注入 whale-icon.css + apple-style.css（随插件停止自动移除 <style> 元素）；
//   2. 启动水中鲸鱼背景动画与发送按钮点阵鲸鱼（自仓库 install/background-snippet.html 移植，
//      全部副作用——全屏 canvas、window 监听、rAF 循环、setInterval、按钮 canvas
//      ——纳入 ctx.effect 清理函数，插件 stop/update 不泄漏）。
window.__ModuleLoader__.load({
  id: 'dsh-whale-aqua',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    // ---- 皮肤样式（原仓库 apple-style.css 与 whale-icon.css 全文内嵌）----
    var WHALE_ICON_CSS = "/* Permanent DeepSeek whale send icon (deployment-local customization).\n   The dot-matrix canvas overlay (attached by the background script) renders\n   the whale; the original SVG stays hidden in the DOM — its <rect> is what\n   marks the running state for :has() selectors and the canvas probe.\n   Running state: underwater swim + bubbles + pulsing halo.\n   Revert: delete this file and remove its <link> in index.html. */\n[data-composer-card] button[class*=\"_primary\"] {\n  position: relative;\n}\n[data-composer-card] button[class*=\"_primary\"] svg:has(path),\n[data-composer-card] button[class*=\"_primary\"] svg:has(rect) {\n  display: none;\n}\n/* Running state: the whale swims underwater (gentle glide + rising bubbles). */\n[data-composer-card] button[class*=\"_primary\"]:has(rect) {\n  animation: dsh-whale-halo 2.4s ease-in-out infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  content: \"\";\n  position: absolute;\n  border-radius: 50%;\n  pointer-events: none;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::before {\n  left: 8.75px;\n  top: 6.3px;\n  width: 3.5px;\n  height: 3.5px;\n  background: rgba(255,255,255,0.85);\n  animation: dsh-whale-bubble 2.8s ease-in infinite;\n}\n[data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n  left: 10.25px;\n  top: 6.9px;\n  width: 2.5px;\n  height: 2.5px;\n  background: rgba(255,255,255,0.7);\n  animation: dsh-whale-bubble 2.8s ease-in 1.3s infinite;\n}\n@keyframes dsh-whale-bubble {\n  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }\n  15% { opacity: 0.9; }\n  55% { transform: translate(1.2px, -5px) scale(1); opacity: 0.75; }\n  100% { transform: translate(-0.6px, -11px) scale(0.45); opacity: 0; }\n}\n@keyframes dsh-whale-halo {\n  0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.5); }\n  70% { box-shadow: 0 0 0 6px rgba(0, 122, 255, 0); }\n  100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }\n}\n@media (prefers-reduced-motion: reduce) {\n  [data-composer-card] button[class*=\"_primary\"]:has(rect),\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::before,\n  [data-composer-card] button[class*=\"_primary\"]:has(rect)::after {\n    animation: none;\n  }\n}\n";
    var APPLE_STYLE_CSS = "/* Permanent Apple/macOS style (deployment-local customization).\n   Companion to whale-icon.css; mirrors the apple-2 plugin layer.\n   Revert: delete this file and remove its <link> in index.html. */\nbody {\n--dsw-alias-bg-base:#FFFFFF;\n--dsw-alias-bg-layer-1:#FFFFFF;\n--dsw-alias-bg-layer-2:#F5F5F7;\n--dsw-alias-bg-overlay:#FFFFFF;\n--dsw-alias-border-l1:rgba(0,0,0,0.06);\n--dsw-alias-border-l2:rgba(0,0,0,0.10);\n--dsw-alias-brand-primary:#007AFF;\n--dsw-alias-label-primary:#1D1D1F;\n--dsw-alias-label-secondary:#545458;\n--dsw-alias-state-error-primary:#FF3B30;\n--dsw-alias-state-success-primary:#34C759;\n--dsw-alias-state-warn-primary:#FF9500;\n--dsw-specific-sidebar-fill:#F2F2F7;\n--dsw-alias-label-tertiary:#82828A;\n--dsw-alias-label-caption:#94949C;\n--dsw-alias-label-dimmed:#A9A9B0;\n--dsw-alias-label-primary-foreground:#FFFFFF;\n--dsw-alias-label-primary-inverted:#FFFFFF;\n--dsw-alias-button-primary-fill:#007AFF;\n--dsw-alias-button-primary-hover:#0077ED;\n--dsw-alias-button-info-fill:#007AFF;\n--dsw-alias-button-info-hover:#0077ED;\n--dsw-alias-button-contrast-fill:#1D1D1F;\n--dsw-alias-button-elevated-fill:#FFFFFF;\n--dsw-alias-button-floating-fill:#FFFFFF;\n--dsw-alias-button-floating-hover:#F2F2F7;\n--dsw-alias-button-tool-bar-fill:rgba(0,0,0,0.04);\n--dsw-alias-button-tool-bar-hover:rgba(0,0,0,0.08);\n--dsw-alias-button-ghost-active-fill:rgba(0,122,255,0.12);\n--dsw-alias-button-ghost-active-border:rgba(0,122,255,0.5);\n--dsw-alias-button-ghost-active-hover:rgba(0,122,255,0.16);\n--dsw-alias-interactive-bg-hover:rgba(0,0,0,0.05);\n--dsw-alias-interactive-bg-active:rgba(0,0,0,0.09);\n--dsw-alias-interactive-bg-hover-solid:#F2F2F7;\n--dsw-alias-interactive-bg-hover-danger:rgba(255,59,48,0.08);\n--dsw-alias-bg-module-platform:rgba(0,0,0,0.04);\n--dsw-alias-bg-multi-select:rgba(0,0,0,0.04);\n--dsw-alias-bg-skeleton:rgba(0,0,0,0.05);\n--dsw-alias-border-l2-darkmode-thin:rgba(0,0,0,0.08);\n--dsw-alias-border-l3:rgba(0,0,0,0.14);\n--dsw-alias-border-l4:rgba(0,0,0,0.20);\n--dsw-alias-state-business-primary:#007AFF;\n--dsw-specific-input-major:#FFFFFF;\n--dsw-specific-menu:rgba(255,255,255,0.85);\n--dsw-specific-selector:rgba(0,0,0,0.05);\n--dsw-alias-scrollbar-bg-l1:rgba(0,0,0,0.16);\n--dsw-alias-scrollbar-hover-l1:rgba(0,0,0,0.32);\n--dsw-alias-scrollbar-bg-l2:rgba(0,0,0,0.12);\n--dsw-alias-scrollbar-hover-l2:rgba(0,0,0,0.28);\n--dsw-shadow-lv1:0 1px 2px rgba(0,0,0,0.04);\n--dsw-shadow-lv2:0 4px 16px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.04);\n--dsw-shadow-lv3:0 12px 40px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.06);\n--dsw-mask-blur:blur(20px);\n--dsw-static-deepseek-450:#007AFF;\n--ds-ease-in-out:cubic-bezier(0.32,0.72,0,1);\n--dsh-scrollbar-width:6px;\n}\nbody[data-ds-dark-theme] {\n--dsw-alias-bg-base:#1C1C1E;\n--dsw-alias-bg-layer-1:#2C2C2E;\n--dsw-alias-bg-layer-2:#3A3A3C;\n--dsw-alias-bg-overlay:#2C2C2E;\n--dsw-alias-border-l1:rgba(255,255,255,0.08);\n--dsw-alias-border-l2:rgba(255,255,255,0.14);\n--dsw-alias-brand-primary:#0A84FF;\n--dsw-alias-label-primary:#F5F5F7;\n--dsw-alias-label-secondary:#B8B8C0;\n--dsw-alias-state-error-primary:#FF453A;\n--dsw-alias-state-success-primary:#30D158;\n--dsw-alias-state-warn-primary:#FF9F0A;\n--dsw-specific-sidebar-fill:#2C2C2E;\n--dsw-alias-label-tertiary:#8E8E98;\n--dsw-alias-label-caption:#7E7E88;\n--dsw-alias-label-dimmed:#6C6C76;\n--dsw-alias-label-primary-foreground:#FFFFFF;\n--dsw-alias-label-primary-inverted:#1C1C1E;\n--dsw-alias-button-primary-fill:#0A84FF;\n--dsw-alias-button-primary-hover:#2E90FA;\n--dsw-alias-button-info-fill:#0A84FF;\n--dsw-alias-button-info-hover:#2E90FA;\n--dsw-alias-button-contrast-fill:#F5F5F7;\n--dsw-alias-button-elevated-fill:#2C2C2E;\n--dsw-alias-button-floating-fill:#3A3A3C;\n--dsw-alias-button-floating-hover:#48484A;\n--dsw-alias-button-tool-bar-fill:rgba(255,255,255,0.06);\n--dsw-alias-button-tool-bar-hover:rgba(255,255,255,0.10);\n--dsw-alias-button-ghost-active-fill:rgba(10,132,255,0.20);\n--dsw-alias-button-ghost-active-border:rgba(10,132,255,0.60);\n--dsw-alias-button-ghost-active-hover:rgba(10,132,255,0.24);\n--dsw-alias-interactive-bg-hover:rgba(255,255,255,0.08);\n--dsw-alias-interactive-bg-active:rgba(255,255,255,0.12);\n--dsw-alias-interactive-bg-hover-solid:#3A3A3C;\n--dsw-alias-interactive-bg-hover-danger:rgba(255,69,58,0.12);\n--dsw-alias-bg-module-platform:rgba(255,255,255,0.08);\n--dsw-alias-bg-multi-select:rgba(255,255,255,0.08);\n--dsw-alias-bg-skeleton:rgba(255,255,255,0.08);\n--dsw-alias-border-l2-darkmode-thin:rgba(255,255,255,0.08);\n--dsw-alias-border-l3:rgba(255,255,255,0.18);\n--dsw-alias-border-l4:rgba(255,255,255,0.24);\n--dsw-alias-state-business-primary:#0A84FF;\n--dsw-specific-input-major:#2C2C2E;\n--dsw-specific-menu:rgba(36,36,38,0.85);\n--dsw-specific-selector:rgba(255,255,255,0.10);\n--dsw-alias-scrollbar-bg-l1:rgba(255,255,255,0.20);\n--dsw-alias-scrollbar-hover-l1:rgba(255,255,255,0.35);\n--dsw-alias-scrollbar-bg-l2:rgba(255,255,255,0.16);\n--dsw-alias-scrollbar-hover-l2:rgba(255,255,255,0.30);\n--dsw-shadow-lv1:0 1px 2px rgba(0,0,0,0.40);\n--dsw-shadow-lv2:0 4px 16px rgba(0,0,0,0.50),0 1px 3px rgba(0,0,0,0.40);\n--dsw-shadow-lv3:0 12px 40px rgba(0,0,0,0.60),0 2px 8px rgba(0,0,0,0.50);\n--dsw-mask-blur:blur(20px);\n--dsw-static-deepseek-450:#0A84FF;\n--ds-ease-in-out:cubic-bezier(0.32,0.72,0,1);\n--dsh-scrollbar-width:6px;\n}body .hHd-Xa_root{background:transparent}\n.hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_newSession{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:#FFFFFF;border-radius:8px}\n.hHd-Xa_root:not(.hHd-Xa_collapsed) .hHd-Xa_newSession:hover{background:var(--dsw-alias-button-primary-hover)}\n[data-composer-card].uV2eYG_card{border-radius:18px}\nbody .wSkVaW_header{border-bottom-color:transparent}\n::-webkit-scrollbar{width:6px;height:6px}\n::selection{background:rgba(0,122,255,0.22)}\nbody[data-ds-dark-theme] ::selection{background:rgba(10,132,255,0.35)}\n:focus-visible{outline:2px solid rgba(0,122,255,0.55);outline-offset:2px}\nbody[data-ds-dark-theme] :focus-visible{outline-color:rgba(10,132,255,0.65)}\nsvg path[stroke],svg circle[stroke],svg rect[stroke],svg line[stroke]{stroke-linecap:round;stroke-linejoin:round}\nsvg[viewBox=\"0 0 16 16\"] path[stroke]{stroke-width:1.5px}\nbody .VOzbGW_panel{border-radius:16px;width:1000px;max-width:calc(100vw - 48px)}\nbody .VOzbGW_trigger{border-radius:8px}\nbody .VOzbGW_navCell{border-radius:8px}\n._dialog_15u5s_22{border-radius:16px}\n._confirmation_1nu42_1{border-radius:16px}\n._toast_fvpz7_7{border-radius:10px}\n._bubble_owhem_8{border-radius:6px}\n._card_1b2ny_13{border-radius:10px}\n._pill_e3ygd_1{border-radius:8px}\n._button_kz6gm_4{border-radius:10px}\n._button_kz6gm_4._sm_kz6gm_30{border-radius:8px}\n._list_19372_8,._submenu_19372_9{border-radius:10px;-webkit-backdrop-filter:saturate(180%) blur(30px);backdrop-filter:saturate(180%) blur(30px)}\n._item_19372_91{min-height:30px;border-radius:6px}\n._denseList_19372_118 ._item_19372_91{min-height:26px;border-radius:5px}\nbody .YDXeBa_sessionRow.YDXeBa_selected,body .YDXeBa_searchResultRow.YDXeBa_selected{background:#0A60FF;color:#FFFFFF}\nbody[data-ds-dark-theme] .YDXeBa_sessionRow.YDXeBa_selected,body[data-ds-dark-theme] .YDXeBa_searchResultRow.YDXeBa_selected{background:#0A84FF}\nbody .YDXeBa_sessionRow.YDXeBa_selected .YDXeBa_time,body .YDXeBa_sessionRow.YDXeBa_selected .YDXeBa_meta,body .YDXeBa_sessionRow.YDXeBa_selected .YDXeBa_slot,body .YDXeBa_searchResultRow.YDXeBa_selected .YDXeBa_searchResultSnippet,body .YDXeBa_searchResultRow.YDXeBa_selected .YDXeBa_searchResultWorkspace{color:rgba(255,255,255,0.78)}\nbody .qDHVXG_sectionLabel{font-size:11px;font-weight:600}\n/* Conversation view: iMessage-style user bubble + Think card + assistant whale avatar. */\nbody .gdEzaW_bubble{background:var(--dsw-alias-button-info-fill,#007AFF);color:#FFFFFF;border-radius:18px;box-shadow:0 1px 3px rgba(0,0,0,0.10)}\nbody .gdEzaW_bubble ._markdown_1nba0_5{color:#FFFFFF}\nbody .gdEzaW_bubble a,body .gdEzaW_bubble ._markdown_1nba0_5 a{color:#FFFFFF;text-decoration:underline;text-underline-offset:2px}\nbody .gdEzaW_bubble ._markdown_1nba0_5 :not(pre)>code{background-color:rgba(255,255,255,0.24);color:#FFFFFF}\nbody .gdEzaW_bubble .gdEzaW_compactionTitle,body .gdEzaW_bubble .gdEzaW_compactionSummary,body .gdEzaW_bubble .gdEzaW_compactionBody,body .gdEzaW_bubble .gdEzaW_compactionLeading{color:rgba(255,255,255,0.82)}\nbody .gdEzaW_bubble .gdEzaW_compactionSep{background:rgba(255,255,255,0.6)}\nbody .Sxvs8a_root{position:relative;padding-left:36px}\nbody .Sxvs8a_root::before{content:\"\";position:absolute;left:0;top:5px;width:20px;height:14.7px;background:var(--dsw-alias-state-business-primary,#007AFF);-webkit-mask:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z%22%2Cfill%3A%22currentColor'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2023.16%2017.04'%3E%3Cpath%20fill%3D'black'%20d%3D'M22.917%201.43C22.671%201.31%2022.566%201.539%2022.422%201.655C22.373%201.693%2022.332%201.742%2022.29%201.787C21.932%202.17%2021.513%202.421%2020.966%202.391C20.166%202.346%2019.483%202.598%2018.879%203.21C18.75%202.455%2018.324%202.005%2017.675%201.716C17.335%201.566%2016.992%201.415%2016.754%201.089C16.588%200.856%2016.542%200.597%2016.459%200.342C16.406%200.188%2016.354%200.03%2016.176%200.004C15.984%20-0.026%2015.908%200.135%2015.833%200.27C15.531%200.822%2015.414%201.43%2015.425%202.046C15.452%203.432%2016.037%204.535%2017.199%205.32C17.331%205.41%2017.365%205.5%2017.324%205.632C17.244%205.902%2017.15%206.165%2017.067%206.435C17.014%206.608%2016.935%206.646%2016.75%206.57C16.112%206.304%2015.561%205.909%2015.074%205.433C14.248%204.633%2013.5%203.751%2012.568%203.06C12.349%202.898%2012.13%202.748%2011.903%202.605C10.952%201.682%2012.028%200.923%2012.277%200.833C12.538%200.739%2012.368%200.416%2011.526%200.42C10.684%200.424%209.914%200.706%208.933%201.081C8.789%201.138%208.638%201.179%208.484%201.213C7.593%201.044%206.668%201.006%205.702%201.115C3.883%201.318%202.43%202.178%201.362%203.646C0.079%205.41%20-0.223%207.415%200.147%209.506C0.535%2011.71%201.66%2013.535%203.389%2014.962C5.181%2016.441%207.246%2017.166%209.601%2017.027C11.032%2016.944%2012.624%2016.753%2014.421%2015.232C14.874%2015.458%2015.35%2015.548%2016.138%2015.615C16.746%2015.672%2017.331%2015.585%2017.784%2015.491C18.493%2015.341%2018.444%2014.684%2018.188%2014.564C16.108%2013.595%2016.565%2013.989%2016.15%2013.67C17.206%2012.42%2018.82%2010.198%2019.318%207.172C19.367%206.838%2019.43%206.368%2019.422%206.097C19.418%205.932%2019.456%205.868%2019.645%205.849C20.166%205.789%2020.671%205.647%2021.136%205.391C22.483%204.655%2023.027%203.446%2023.155%201.997C23.174%201.776%2023.151%201.547%2022.917%201.43ZM11.175%2014.474C9.159%2012.889%208.182%2012.368%207.778%2012.39C7.401%2012.412%207.469%2012.844%207.552%2013.126C7.639%2013.404%207.752%2013.596%207.91%2013.84C8.02%2014.001%208.095%2014.241%207.801%2014.422C7.152%2014.823%206.023%2014.287%205.97%2014.26C4.657%2013.486%203.559%2012.466%202.785%2011.069C2.037%209.725%201.603%208.283%201.532%206.744C1.513%206.372%201.622%206.241%201.992%206.173C2.479%206.083%202.981%206.064%203.468%206.136C5.525%206.436%207.276%207.356%208.744%208.813C9.582%209.642%2010.216%2010.634%2010.869%2011.602C11.563%2012.631%2012.31%2013.611%2013.262%2014.415C13.598%2014.696%2013.866%2014.91%2014.122%2015.068C13.349%2015.155%2012.058%2015.173%2011.175%2014.475L11.175%2014.474ZM12.141%208.26C12.141%208.095%2012.273%207.963%2012.439%207.963C12.476%207.963%2012.51%207.971%2012.541%207.982C12.582%207.997%2012.62%208.019%2012.65%208.053C12.704%208.106%2012.734%208.181%2012.734%208.26C12.734%208.425%2012.602%208.556%2012.436%208.556C12.27%208.556%2012.141%208.425%2012.141%208.26ZM15.142%209.799C14.949%209.878%2014.756%209.945%2014.572%209.953C14.284%209.968%2013.972%209.851%2013.802%209.709C13.538%209.487%2013.348%209.363%2013.27%208.977C13.236%208.812%2013.254%208.556%2013.284%208.41C13.352%208.094%2013.277%207.892%2013.054%207.708C12.874%207.558%2012.643%207.516%2012.39%207.516C12.296%207.516%2012.209%207.475%2012.144%207.441C12.039%207.389%2011.952%207.257%2012.035%207.096C12.062%207.043%2012.19%206.916%2012.22%206.893C12.564%206.698%2012.96%206.762%2013.326%206.908C13.666%207.047%2013.922%207.302%2014.292%207.663C14.67%208.098%2014.738%208.218%2014.952%208.545C15.122%208.801%2015.277%209.063%2015.383%209.364C15.447%209.551%2015.364%209.705%2015.142%209.799Z%22%2Cfill%3A%22currentColor'%2F%3E%3C%2Fsvg%3E\") center / contain no-repeat}\nbody [data-variant=\"think\"]{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-left:3px solid var(--dsw-alias-state-business-primary,#007AFF);border-radius:10px;padding:8px 14px;margin:4px 0 0}\nbody [data-variant=\"think\"][data-state=\"running\"]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 5%,var(--dsw-alias-bg-layer-2));box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 25%,transparent)}\n/* Trajectory: bold boxed colored kind badges + blue selected row. */\nbody .Y0dWHa_kindTag{border-radius:5px;border:1.5px solid currentColor;background:color-mix(in srgb,currentColor 16%,transparent);height:20px;font-size:11px;font-weight:700}\nbody .Y0dWHa_table tbody tr[data-selected=true]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 10%,transparent)}\n/* View tabs (对话/轨迹): iOS-style segmented pill switcher. */\nbody .wSkVaW_tabs{gap:0;margin-top:8px;padding:3px;width:fit-content;background:var(--dsw-alias-bg-module-platform,rgba(0,0,0,0.04));border:1px solid var(--dsw-alias-border-l1);border-radius:999px}\nbody .wSkVaW_tab{color:var(--dsw-alias-label-primary);padding:5px 18px 5px;border-radius:999px;font-size:13px;font-weight:500;line-height:20px;transition:background-color .2s var(--ds-ease-in-out),color .2s var(--ds-ease-in-out)}\nbody .wSkVaW_tab:hover{background:var(--dsw-alias-interactive-bg-hover)}\nbody .wSkVaW_tabActive,body .wSkVaW_tabActive:hover{background:var(--dsw-alias-button-info-fill,#007AFF);color:#FFFFFF}\n/* Remove legacy header divider + tab underlines under the pill switcher. */\nbody .wSkVaW_header:after{display:none}\nbody .wSkVaW_tab:after{display:none}/* Comprehensive macOS pass: remaining tokens + every panel/control. */\nbody{--dsw-alias-bg-layer-3:#FFFFFF;--dsw-alias-label-quaternary:rgba(60,60,67,0.18);--dsw-alias-label-primary-dimmed:rgba(29,29,31,0.55);--dsw-specific-tip:#F5F5F7;--dsw-alias-state-warn-tertiary:rgba(255,149,0,0.12);--dsw-alias-state-success-tertiary:rgba(52,199,89,0.12)}\nbody[data-ds-dark-theme]{--dsw-alias-bg-layer-3:#3A3A3C;--dsw-alias-label-quaternary:rgba(235,235,245,0.18);--dsw-alias-label-primary-dimmed:rgba(245,245,247,0.55);--dsw-specific-tip:#2C2C2E;--dsw-alias-state-warn-tertiary:rgba(255,159,10,0.16);--dsw-alias-state-success-tertiary:rgba(48,209,88,0.16)}\nbody input[type=checkbox],body input[type=radio]{accent-color:var(--dsw-alias-button-info-fill,#007AFF)}\nbody .zGbnIq_primaryButton,body .zGbnIq_secondaryButton,body .zGbnIq_dangerButton{border-radius:10px}\nbody .zGbnIq_rowActions .zGbnIq_secondaryButton,body .zGbnIq_rowActions .zGbnIq_dangerButton{border-radius:8px}\nbody .zGbnIq_addButton,body .zGbnIq_addModelButton,body .zGbnIq_linkButton{border-radius:8px}\nbody .zGbnIq_rowCard,body .zGbnIq_editor,body .zGbnIq_addCard,body .zGbnIq_setupCard{border-radius:10px}\nbody .zGbnIq_modelEntry{border-radius:6px}\nbody .nLMEza_bar{border-radius:10px}\nbody .cvtE3a_business{border-radius:10px}\nbody .cvtE3a_message{border-radius:6px}\nbody .o3BgMG_ioCard{border-radius:10px}\nbody .bqrRRG_card{border-radius:14px}\nbody ._7yHdaG_panel{border-radius:10px 10px 0 0}\nbody .qSYn7G_card{box-shadow:var(--dsw-shadow-lv1)}\nbody .ydkMvW_section{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--dsw-alias-border-l1)}\nbody .ydkMvW_section:last-child{border-bottom:none}\n/* macOS pass: hero, directory picker, trajectory details, lightbox. */\nbody .pXSMma_workspace{border-radius:10px}\nbody .pXSMma_modalInput{border-radius:10px}\nbody .ZuhsRW_rowSelected,body .ZuhsRW_rowSelected:hover{background:rgba(0,122,255,0.14)}\nbody[data-ds-dark-theme] .ZuhsRW_rowSelected,body[data-ds-dark-theme] .ZuhsRW_rowSelected:hover{background:rgba(10,132,255,0.22)}\nbody .ZuhsRW_createInput{border-radius:10px}\nbody .ZuhsRW_loadingFloat{border-radius:8px;border:1px solid var(--dsw-alias-border-l1)}\nbody .fV0t5q_root{background:var(--dsw-alias-bg-layer-1)}\nbody .Y0dWHa_table tbody tr[data-collapsed-summary] td{background:var(--dsw-alias-bg-module-platform)}\nbody .Y0dWHa_detailTabs{gap:4px;padding:4px 8px;height:38px;align-items:center}\nbody .Y0dWHa_detailTab{border-radius:999px;padding:3px 12px;line-height:18px}\nbody .Y0dWHa_detailTabActive,body .Y0dWHa_detailTabActive:hover{background:var(--dsw-alias-button-info-fill,#007AFF);color:#FFFFFF}\nbody .Y0dWHa_detailTabActive:after{display:none}\nbody ._close_18d3q_30:hover{background:var(--dsw-alias-interactive-bg-hover)}\nbody ._backdrop_18d3q_1{-webkit-backdrop-filter:var(--dsw-mask-blur);backdrop-filter:var(--dsw-mask-blur)}\n/* Settings: macOS System Settings style (squircle nav icons + blue active + grouped cards). */\nbody{--dsw-specific-sidebar-nav-item-hover:rgba(0,0,0,0.05);--dsw-specific-sidebar-nav-item-active:rgba(0,122,255,0.12)}\nbody[data-ds-dark-theme]{--dsw-specific-sidebar-nav-item-hover:rgba(255,255,255,0.08);--dsw-specific-sidebar-nav-item-active:rgba(10,132,255,0.24)}\nbody .VOzbGW_nav{width:220px}\nbody .VOzbGW_navTitle{font-size:17px;font-weight:600}\nbody .VOzbGW_navIcon{display:block;width:26px;height:26px;padding:5px;box-sizing:border-box;border-radius:8px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-state-business-primary,#007AFF)}\nbody .VOzbGW_navCell.VOzbGW_active .VOzbGW_navIcon{background:var(--dsw-alias-button-info-fill,#007AFF);color:#FFFFFF}\nbody ._WvWnq_section{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:0 16px;overflow:hidden}\n/* Trajectory: per-event cards + left vertical timeline with kind dots. */\nbody .Y0dWHa_table{border-collapse:separate;border-spacing:0 6px}\nbody .Y0dWHa_table .Y0dWHa_turnRail{display:none}\nbody .Y0dWHa_table tbody tr:not([data-collapsed-summary]):not([data-virtual-spacer]):not([data-history-load]):not([data-request-only=true]) td.Y0dWHa_event{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;box-shadow:var(--dsw-shadow-lv1);padding-top:10px;padding-bottom:10px}\nbody .Y0dWHa_table tbody tr:not([data-collapsed-summary]):not([data-virtual-spacer]):not([data-history-load]):not([data-request-only=true]):not([data-selected=true]):hover td.Y0dWHa_event{background:var(--dsw-alias-interactive-bg-hover-solid);border-color:var(--dsw-alias-border-l2)}\nbody .Y0dWHa_table tbody tr[data-selected=true] td.Y0dWHa_event{background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 8%,var(--dsw-alias-bg-layer-1));border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 30%,transparent)}\nbody .Y0dWHa_table tbody tr:not([data-request-only=true]) td.Y0dWHa_event::after{content:\"\";position:absolute;left:16px;top:0;bottom:0;width:2px;background:var(--dsw-alias-border-l2);pointer-events:none;z-index:1}\nbody .Y0dWHa_table tbody tr:not([data-request-only=true]) td.Y0dWHa_event::before{content:\"\";position:absolute;left:12.5px;top:16px;width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-label-tertiary);border:2px solid var(--dsw-alias-bg-layer-1);box-shadow:0 0 0 1px var(--dsw-alias-border-l2);z-index:2}\nbody .Y0dWHa_table tbody tr[data-kind=tool] td.Y0dWHa_event::before,body .Y0dWHa_table tbody tr[data-kind=subtool] td.Y0dWHa_event::before{background:var(--dsw-alias-state-warn-primary,#FF9500)}\nbody .Y0dWHa_table tbody tr[data-kind=message] td.Y0dWHa_event::before{background:#4176E6}\nbody .Y0dWHa_table tbody tr[data-kind=user] td.Y0dWHa_event::before{background:var(--dsw-alias-state-business-primary,#007AFF)}\nbody .Y0dWHa_table tbody tr[data-kind=context] td.Y0dWHa_event::before{background:var(--dsw-alias-state-success-primary,#34C759)}\nbody .Y0dWHa_table tbody tr[data-error=true] td.Y0dWHa_event::before{background:var(--dsw-alias-state-error-primary,#FF3B30)}\n/* Selected (blue) session rows: running indicator switches to white for visibility. */\nbody .YDXeBa_sessionRow.YDXeBa_selected ._matrix_10orb_4,body .YDXeBa_searchResultRow.YDXeBa_selected ._matrix_10orb_4{color:#FFFFFF}\nbody .YDXeBa_sessionRow.YDXeBa_selected ._dot_10orb_3:not([data-state=done]):not([data-state=warning]):not([data-state=error]),body .YDXeBa_searchResultRow.YDXeBa_selected ._dot_10orb_3:not([data-state=done]):not([data-state=warning]):not([data-state=error]){color:#FFFFFF}\n/* DeepSeek Harness hero effect: mouse-follow particle canvas backdrop. */\n#dsh-bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%}\nbody .pI_x6G_frame{background:transparent}\n/* Settings: unified macOS selectors, popup menus, theme cubes. */\nbody .VOzbGW_options ._root_19372_1 > button{height:28px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);padding:0 10px;gap:8px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv1)}\nbody .VOzbGW_options ._root_19372_1 > button:hover{background:var(--dsw-alias-interactive-bg-hover)}\nbody ._item_19372_91{font-size:13px;min-height:28px}\nbody ._check_19372_181{color:var(--dsw-alias-state-business-primary,#007AFF)}\nbody ._8HJdBW_themeCube{position:relative;border-radius:10px;padding:12px 24px;font-size:13px;line-height:18px}\nbody ._8HJdBW_themeCube._8HJdBW_selected{background:var(--dsw-alias-button-primary-fill,#007AFF);border-color:transparent;color:#FFFFFF}\nbody ._8HJdBW_themeCube._8HJdBW_selected::after{content:\"\\2713\";position:absolute;top:6px;right:9px;font-size:12px;font-weight:700;line-height:1}\n/* Composer: jellyfish glow (running/sending/focus) + radius fix. */\n[data-composer-card]::after{content:\"\";position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:linear-gradient(110deg,rgba(0,150,255,0) 15%,rgba(0,150,255,0.9) 38%,rgba(0,220,255,0.95) 50%,rgba(0,150,255,0.9) 62%,rgba(0,150,255,0) 85%);background-size:250% 250%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;opacity:0;pointer-events:none;z-index:1}\n[data-composer-card]:has(textarea:focus){border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 45%,transparent);box-shadow:var(--dsw-shadow-lv2),0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#007AFF) 12%,transparent)}\n[data-composer-card]:has(rect){animation:dsh-jelly-breathe 2.6s ease-in-out infinite}\n[data-composer-card]:has(rect)::after{opacity:1;animation:dsh-jelly-flow 3.2s linear infinite}\n[data-composer-card]:has(textarea[data-phase=\"submitting\"])::after{opacity:1;background:linear-gradient(110deg,rgba(255,255,255,0) 15%,rgba(255,255,255,0.95) 38%,rgba(190,235,255,1) 50%,rgba(255,255,255,0.95) 62%,rgba(255,255,255,0) 85%);background-size:250% 250%;animation:dsh-jelly-send 0.7s ease-in-out infinite}\n@keyframes dsh-jelly-breathe{0%,100%{box-shadow:0 0 0 0 rgba(0,160,255,0),var(--dsw-shadow-lv2)}50%{box-shadow:0 0 26px 3px rgba(0,160,255,0.32),0 0 64px 10px rgba(70,190,255,0.16),var(--dsw-shadow-lv2)}}\n@keyframes dsh-jelly-flow{0%{background-position:0% 50%}100%{background-position:150% 50%}}\n@keyframes dsh-jelly-send{0%,100%{background-position:0% 50%;opacity:0.55}50%{background-position:150% 50%;opacity:1}}\n@media (prefers-reduced-motion:reduce){[data-composer-card]:has(rect),[data-composer-card]::after{animation:none}[data-composer-card]:has(rect)::after{opacity:0.55}}\n/* Conversation text: frosted glass backdrop for readability. */\nbody .Md3f7G_scroll{background:rgba(255,255,255,0.88);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%)}\nbody[data-ds-dark-theme] .Md3f7G_scroll{background:rgba(28,28,30,0.88)}\n";

    // ---- 背景动画 + 发送按钮鲸鱼（含生命周期改造，见文件头说明）----

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
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;width:100%;height:100%';
  document.body.appendChild(canvas);
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
      waterTop: dark ? 'rgba(100,135,255,0.12)' : 'rgba(110,140,255,0.10)',
      waterMid: dark ? 'rgba(80,115,240,0.05)' : 'rgba(90,120,240,0.04)',
      waterBot: 'rgba(90,120,240,0)',
      surface: dark ? 'rgba(175,205,255,0.26)' : 'rgba(155,185,255,0.22)',
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
      // 皮肤样式注入（卸载时移除；先清理可能残留的同名 <style>）
      ctx.effect(() => {
        var old = document.querySelector('style[data-dsh-whale-aqua]');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var el = document.createElement('style');
        el.setAttribute('data-dsh-whale-aqua', '1');
        el.textContent = WHALE_ICON_CSS + '\n' + APPLE_STYLE_CSS;
        document.head.appendChild(el);
        return () => { if (el.parentNode) el.parentNode.removeChild(el); };
      });
      // 背景 + 按钮动画：startBackground 返回清理函数，直接作为 effect disposer
      ctx.effect(startBackground);
    }

    exports.apply = apply;
    return module.exports;
  },
});

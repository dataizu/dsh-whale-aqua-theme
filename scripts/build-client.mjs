#!/usr/bin/env node
/**
 * Build dsh-whale-aqua-theme's client bundle.
 *
 * Sources (src/):
 *   whale-icon.css – send-button / dot-matrix whale rules
 *   tokens.css     – Apple design-token layer (light + dark)
 *   shell.css      – aquarium transparency layer + desktop (Electron) window chrome
 *   regions.css    – per-surface macOS skin (sidebar, chat, settings, trajectory…)
 *   background.js  – aquarium canvas + send-button animation controller
 *   apply.js       – cordis client-half plugin: injects the CSS, starts the background
 *
 * Output: client.js – the single CJS-form bundle the DSH web module loader serves
 * (`window.__ModuleLoader__.load({ id, factory })`). The registration id MUST be
 * the package name (`dsh-whale-aqua-theme`): DSH >= 0.2.0 keys factories by that
 * id and refuses a bundle whose id does not match the boot-graph row.
 *
 * Also writes the legacy combined stylesheet to the repo root so the old
 * dist-patching install path keeps working for 0.1.x hosts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (name) => readFileSync(join(root, 'src', name), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const asString = (name) => JSON.stringify(src(name));

const header = `// dsh-whale-aqua-theme —— 浏览器面（client face）· DSH 0.2.x（Desktop / Web）适配版。
// 由 scripts/build-client.mjs 从 src/*.css 与 src/*.js 生成，请勿直接编辑本文件。
//
// 加载约定（DSH >= 0.2.0，见 @deepseek-ai/dsh-client-modules）：
//   - 包 package.json 必须声明 dsh.client.platform = "web" 且 exports["./client"] 指向本文件；
//   - 本 bundle 通过 window.__ModuleLoader__.load({ id, factory }) 注册，
//     id 必须等于包名 "${pkg.name}"，否则模块系统会报
//     "loaded without registering ..." / "duplicate factory registration"；
//   - factory 返回 { name, inject, apply }，插件停止时 ctx.effect 清理全部副作用
//     （<style>、全屏 canvas、window 监听、rAF 循环、setInterval、按钮 canvas）。
//
// 内容：
//   1. whale-icon.css + tokens.css + shell.css + regions.css 随插件注入；
//   2. 水中鲸鱼背景动画与发送按钮点阵鲸鱼（生命周期全部纳入 ctx.effect）。
window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var THEME_VERSION = ${JSON.stringify(pkg.version)};
    // ---- 皮肤样式（源文件见 src/*.css）----
    var WHALE_ICON_CSS = ${asString('whale-icon.css')};
    var TOKENS_CSS = ${asString('tokens.css')};
    var SHELL_CSS = ${asString('shell.css')};
    var REGIONS_CSS = ${asString('regions.css')};

    // ---- 背景动画 + 发送按钮鲸鱼（src/background.js）----
`;

const apply = src('apply.js');

const tail = `    exports.apply = apply;
    return module.exports;
  },
});
`;

const out = `${header}${src('background.js')}\n${apply}${tail}`;
writeFileSync(join(root, 'client.js'), out, 'utf8');

// Legacy dist-patch path: one combined stylesheet, in injection order.
const legacyCss = [
  src('whale-icon.css'),
  src('tokens.css'),
  src('shell.css'),
  src('regions.css'),
].join('\n');
writeFileSync(join(root, 'whale-icon.css'), src('whale-icon.css'), 'utf8');
writeFileSync(join(root, 'apple-style.css'), legacyCss, 'utf8');

console.log(`built client.js (${out.length} bytes) for ${pkg.name}@${pkg.version}`);

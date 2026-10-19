import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const regions = readFileSync(join(root, 'src/regions.css'), 'utf8');
const iconCss = readFileSync(join(root, 'src/whale-icon.css'), 'utf8');
const backgroundSource = readFileSync(join(root, 'src/background.js'), 'utf8');
const failures = [];

function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
}

function fakeCanvasContext() {
  const ctx = { clearCount: 0, fillCount: 0 };
  for (const method of ['save', 'restore', 'translate', 'scale', 'rotate', 'fill', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'quadraticCurveTo', 'stroke', 'arc', 'drawImage', 'rect', 'clip']) ctx[method] = () => {};
  ctx.clearRect = () => { ctx.clearCount++; };
  ctx.createLinearGradient = () => ({ addColorStop() {} });
  ctx.getImageData = (_x, _y, width, height) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    return { data };
  };
  return ctx;
}

function makeEnvironment({ reduced = false, failButtonCanvas = false, failBackgroundCanvas = false, legacyMedia = false } = {}) {
  const observers = new Set();
  const microtasks = [];
  const frames = new Map();
  const intervals = new Map();
  let nextFrame = 1, nextInterval = 1;
  function isWithin(node, ancestor) { for (let current = node; current; current = current.parentNode) if (current === ancestor) return true; return false; }
  function queueMutation(target, record) {
    for (const observer of observers) {
      if (!observer.active || !observer.options || !(target === observer.target || (observer.options.subtree && isWithin(target, observer.target)))) continue;
      if (record.type === 'childList' && observer.options.childList) observer.records.push(record);
      if (record.type === 'attributes' && observer.options.attributes && (!observer.options.attributeFilter || observer.options.attributeFilter.includes(record.attributeName))) observer.records.push(record);
    }
  }
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
    dispatchEvent(type, event = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(event); }
    listenerCount() { let count = 0; for (const set of this.listeners.values()) count += set.size; return count; }
  }
  class Element extends Target {
    constructor(tag) {
      super(); this.tagName = tag.toUpperCase(); this.children = []; this.parentNode = null; this.attributes = new Map();
      this.style = { cssText: '', display: '' }; this.width = 0; this.height = 0; this.textContent = '';
      this.context = this.tagName === 'CANVAS' ? fakeCanvasContext() : null;
    }
    get parentElement() { return this.parentNode; }
    get firstChild() { return this.children[0] || null; }
    get isConnected() { return isWithin(this, document.body); }
    get className() { return this.getAttribute('class') || ''; }
    set className(value) { this.setAttribute('class', value); }
    appendChild(node) { return this.insertBefore(node, null); }
    insertBefore(node, before) {
      if (node.parentNode) node.parentNode.removeChild(node);
      const index = before ? this.children.indexOf(before) : -1;
      if (index < 0) this.children.push(node); else this.children.splice(index, 0, node);
      node.parentNode = this; queueMutation(this, { type: 'childList', target: this, addedNodes: [node], removedNodes: [] }); return node;
    }
    removeChild(node) {
      const index = this.children.indexOf(node); if (index < 0) throw new Error('child not found');
      this.children.splice(index, 1); node.parentNode = null;
      queueMutation(this, { type: 'childList', target: this, addedNodes: [], removedNodes: [node] }); return node;
    }
    setAttribute(name, value) { const oldValue = this.getAttribute(name); this.attributes.set(name, String(value)); if (oldValue !== String(value)) queueMutation(this, { type: 'attributes', target: this, attributeName: name }); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { if (this.attributes.delete(name)) queueMutation(this, { type: 'attributes', target: this, attributeName: name }); }
    getContext() { return (failButtonCanvas && this.hasAttribute('data-dsh-whale-canvas')) || (failBackgroundCanvas && this.id === 'dsh-bg-canvas') ? null : this.context; }
    querySelector(selector) {
      const wanted = selector === 'svg' ? 'SVG' : selector === 'rect' ? 'RECT' : selector === 'path' ? 'PATH' : null;
      const visit = (node) => { for (const child of node.children) { if (child.tagName === wanted) return child; const found = visit(child); if (found) return found; } return null; };
      return visit(this);
    }
  }
  class MutationObserverStub {
    constructor(callback) { this.callback = callback; this.records = []; this.active = true; observers.add(this); }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.active = false; this.records.length = 0; observers.delete(this); }
  }
  const body = new Element('body');
  const document = Object.assign(new Target(), {
    body, head: new Element('head'), hidden: false,
    createElement(tag) { return new Element(tag); },
    getElementById(id) { return walk(body).find((node) => node.id === id) || null; },
    querySelectorAll(selector) {
      if (selector !== '[data-composer-card] button[class*="_primary"]') return [];
      return walk(body).filter((node) => node.tagName === 'BUTTON' && node.className.includes('_primary') && hasComposerCard(node));
    }
  });
  function walk(node) { return [node, ...node.children.flatMap(walk)]; }
  function hasComposerCard(node) { for (let current = node.parentNode; current; current = current.parentNode) if (current.hasAttribute('data-composer-card')) return true; return false; }
  class MediaQuery extends Target {
    constructor() { super(); this.matches = reduced; }
    set(value) { this.matches = value; this.dispatchEvent('change', { matches: value }); }
  }
  const media = new MediaQuery();
  if (legacyMedia) {
    media.addListener = (fn) => Target.prototype.addEventListener.call(media, 'change', fn);
    media.removeListener = (fn) => Target.prototype.removeEventListener.call(media, 'change', fn);
    media.addEventListener = undefined;
  }
  const window = Object.assign(new Target(), {
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
    matchMedia: () => media
  });
  function flushWork() {
    for (let count = 0; count < 40; count++) {
      let didWork = false;
      for (const observer of [...observers]) if (observer.active && observer.records.length) { const records = observer.records.splice(0); observer.callback(records); didWork = true; }
      const job = microtasks.shift(); if (job) { job(); didWork = true; }
      if (!didWork) return;
    }
    throw new Error('observer/microtask loop did not settle');
  }
  const context = {
    document, window, matchMedia: window.matchMedia, MutationObserver: MutationObserverStub, Path2D: class Path2D { constructor(path) { this.path = path; } },
    requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setInterval(fn) { const id = nextInterval++; intervals.set(id, fn); return id; }, clearInterval(id) { intervals.delete(id); },
    queueMicrotask(fn) { microtasks.push(fn); }, Math, Date, console
  };
  vm.createContext(context);
  const startBackground = vm.runInContext(`${backgroundSource}\nstartBackground`, context);
  return {
    document, body, window, media, observers, frames, intervals, microtasks, context, startBackground, flushWork,
    makeButton(running = false) {
      const card = new Element('div'); card.setAttribute('data-composer-card', 'true');
      const button = new Element('button'); button.className = 'RlGAzG_primary';
      const svg = new Element('svg'); svg.appendChild(new Element(running ? 'rect' : 'path')); button.appendChild(svg); card.appendChild(button); body.appendChild(card);
      return { card, button, svg };
    },
    clearCount() { return walk(body).filter((node) => node.tagName === 'CANVAS').reduce((sum, node) => sum + (node.context?.clearCount || 0), 0); },
    runFrame(timestamp = 100) { const entry = frames.entries().next().value; if (entry) { frames.delete(entry[0]); entry[1](timestamp); } },
    dispatchMutation() { flushWork(); }
  };
}

function declarationValueErrors(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const errors = [];
  for (const block of clean.split('}')) {
    const open = block.lastIndexOf('{'); if (open < 0) continue;
    for (const raw of block.slice(open + 1).split(';')) {
      const colon = raw.indexOf(':'); if (colon < 0) continue;
      const property = raw.slice(0, colon).trim(); const value = raw.slice(colon + 1).trim();
      if (/^[-\w]+$/.test(property) && /\bbody\b/.test(value)) errors.push(`${property}: ${value}`);
    }
  }
  return errors;
}

test('regions.css declaration values contain no stray body tokens', () => {
  assert.deepEqual(declarationValueErrors(regions), []);
});

test('pearl polish preserves readable selected labels, soft bubble, and reduced blur surfaces', () => {
  assert.match(regions, /aria-selected="true"[\s\S]*?background:\s*#dceaff[\s\S]*?color:\s*#17385e/i);
  assert.match(regions, /data-ds-dark-theme\][\s\S]*?background:\s*#263c59[\s\S]*?color:\s*#e4efff/i);
  assert.match(regions, /\.cJsG2q_bubble\s*\{[\s\S]*?background:\s*rgba\(208, 226, 250, 0\.92\)[\s\S]*?color:\s*#183657/i);
  assert.match(regions, /cJsG2q_bubble \.(_markdown_1ypvv_5) :not\(pre\) > code[\s\S]*?color:\s*#183657/);
  assert.match(regions, /data-ds-dark-theme\] \.cJsG2q_bubble \.cJsG2q_compactionTitle[\s\S]*?color:\s*#e8f1ff/);
  assert.match(regions, /data-composer-card\]:has\(rect\) \{\s*animation:\s*none !important/);
  assert.match(regions, /prefers-reduced-transparency:\s*reduce[\s\S]*?\.cJsG2q_bubble \{ background:\s*#d0e2fa !important/);
  assert.match(regions, /data-composer-card\]\s*\{[\s\S]*?border-radius:\s*22px[\s\S]*?background:\s*rgba\(255, 255, 255, 0\.94\)/i);
  assert.match(regions, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(readFileSync(join(root, 'src/shell.css'), 'utf8'), /backdrop-filter:\s*blur\(\s*(1[3-9]|[2-9]\d)px/i);
});

test('successful whale attachment hides native SVG in idle and running states', () => {
  assert.match(iconCss, /button[^{}]*data-dsh-whale-attached[^{}]*svg\s*\{\s*display:\s*none\s*;/s);
  assert.doesNotMatch(iconCss, /:has\(rect\)[^{}]*canvas\[data-dsh-whale-canvas\][^{}]*\{\s*display:\s*none\s*;/s);
  assert.match(backgroundSource, /Math\.pow\(xn,\s*1\.35\)\s*\*\s*4\s*\*\s*Math\.sin\(t\s*-\s*xn\s*\*\s*6\.5\)/);
  assert.match(backgroundSource, /Math\.sin\(now\s*\*\s*0\.0022\)\s*\*\s*1\.6/);
  assert.doesNotMatch(backgroundSource, /setInterval\s*\(/);
});

test('running whale stays visible and animates on accepted background frames; idle draws once', () => {
  const env = makeEnvironment(); const pair = env.makeButton(true); const dispose = env.startBackground();
  const whaleCanvas = pair.button.children.find((node) => node.hasAttribute('data-dsh-whale-canvas'));
  assert.equal(whaleCanvas.style.display, '');
  const initial = whaleCanvas.context.clearCount;
  env.runFrame(100); env.runFrame(150);
  assert.ok(whaleCanvas.context.clearCount > initial, 'running whale redraws with background frames');
  const runningCount = whaleCanvas.context.clearCount;
  pair.svg.removeChild(pair.svg.children[0]); pair.svg.appendChild(new (pair.svg.constructor)('path')); env.flushWork();
  assert.equal(whaleCanvas.style.display, '');
  const idleCount = whaleCanvas.context.clearCount;
  env.runFrame(200); env.runFrame(250);
  assert.ok(idleCount > runningCount, 'state transition redraws the whale once');
  assert.equal(whaleCanvas.context.clearCount, idleCount, 'idle whale does not redraw per frame');
  pair.svg.removeChild(pair.svg.children[0]); pair.svg.appendChild(new (pair.svg.constructor)('rect')); env.flushWork();
  env.media.set(true);
  assert.equal(env.frames.size, 0, 'reduced motion stops the background frame');
  const reducedCount = whaleCanvas.context.clearCount;
  env.runFrame(300);
  assert.equal(whaleCanvas.context.clearCount, reducedCount, 'running whale stays static in reduced motion');
  env.media.set(false);
  assert.equal(env.frames.size, 1, 'restoring motion reuses the background frame');
  const resumedCount = whaleCanvas.context.clearCount;
  env.runFrame(300); env.runFrame(350);
  assert.ok(whaleCanvas.context.clearCount > resumedCount, 'running animation resumes on accepted frames');
  env.document.hidden = true; env.document.dispatchEvent('visibilitychange');
  const hiddenCount = whaleCanvas.context.clearCount;
  assert.equal(env.frames.size, 0);
  env.runFrame(400); assert.equal(whaleCanvas.context.clearCount, hiddenCount, 'hidden view does no repeating whale work');
  env.document.hidden = false; env.document.dispatchEvent('visibilitychange');
  dispose();
});

test('initial attachment while unfocused paints a static whale before hiding the fallback icon', () => {
  const env = makeEnvironment(); env.document.hasFocus = () => false;
  const pair = env.makeButton(true); const dispose = env.startBackground();
  const canvas = pair.button.children.find((n) => n.hasAttribute('data-dsh-whale-canvas'));
  assert.ok(canvas.context.clearCount > 0, 'the whale must be painted before native SVG is hidden');
  assert.equal(env.frames.size, 0); dispose();
});

test('initial idle button attaches once, observer ignores its own canvas, and no polling/button rAF remains', () => {
  const env = makeEnvironment(); env.makeButton(); const dispose = env.startBackground();
  const button = env.document.querySelectorAll('[data-composer-card] button[class*="_primary"]')[0];
  assert.equal(button.hasAttribute('data-dsh-whale-attached'), true);
  assert.equal(button.children.filter((node) => node.hasAttribute('data-dsh-whale-canvas')).length, 1);
  assert.equal(env.intervals.size, 0);
  assert.equal(env.frames.size, 1, 'only the aquarium background owns a repeating frame');
  env.flushWork(); assert.equal(env.microtasks.length, 0, 'canvas insertion must not schedule another button update');
  dispose();
});

test('reduced motion draws once, responds to runtime preference, blur and visibility, and static resize', () => {
  const reduced = makeEnvironment({ reduced: true }); const runningPair = reduced.makeButton(true); const stop = reduced.startBackground();
  assert.equal(reduced.frames.size, 0);
  const whaleCanvas = runningPair.button.children.find((node) => node.hasAttribute('data-dsh-whale-canvas'));
  assert.equal(whaleCanvas.style.display, '');
  const whaleDraws = whaleCanvas.context.clearCount;
  reduced.runFrame(100); assert.equal(whaleCanvas.context.clearCount, whaleDraws, 'reduced motion has no repeating whale draws');
  const before = reduced.clearCount(); reduced.window.innerWidth = 1440; reduced.window.dispatchEvent('resize');
  assert.ok(reduced.clearCount() > before, 'resize redraws the static background'); stop();

  const env = makeEnvironment(); const dispose = env.startBackground();
  assert.equal(env.frames.size, 1); env.media.set(true); assert.equal(env.frames.size, 0);
  env.media.set(false); assert.equal(env.frames.size, 1);
  env.window.dispatchEvent('blur'); assert.equal(env.frames.size, 0);
  env.window.dispatchEvent('focus'); assert.equal(env.frames.size, 1);
  env.document.hidden = true; env.document.dispatchEvent('visibilitychange'); assert.equal(env.frames.size, 0);
  env.document.hidden = false; env.document.dispatchEvent('visibilitychange'); assert.equal(env.frames.size, 1);
  dispose();
});

test('button insertion, stop-state swap, and removal update and clean their owned canvas', () => {
  const env = makeEnvironment(); const first = env.makeButton(); const dispose = env.startBackground(); env.flushWork();
  const second = env.makeButton(); env.flushWork();
  assert.equal(second.button.hasAttribute('data-dsh-whale-attached'), true);
  second.svg.appendChild(new (second.svg.constructor)('rect')); env.flushWork();
  const whaleCanvas = second.button.children.find((node) => node.hasAttribute('data-dsh-whale-canvas'));
  assert.equal(whaleCanvas.style.display, '');
  assert.ok(whaleCanvas.context.clearCount > 1, 'running transition redraws whale instead of replacing it with native stop');
  second.svg.removeChild(second.svg.children.find((node) => node.tagName === 'RECT')); env.flushWork();
  assert.equal(whaleCanvas.style.display, '');
  second.card.parentNode.removeChild(second.card); env.flushWork();
  assert.equal(second.button.hasAttribute('data-dsh-whale-attached'), false);
  assert.equal(whaleCanvas.parentNode, null);
  dispose(); assert.equal(first.button.hasAttribute('data-dsh-whale-attached'), false);
});

test('a failed button canvas context leaves the native send icon available', () => {
  const env = makeEnvironment({ failButtonCanvas: true }); const pair = env.makeButton(); const dispose = env.startBackground();
  assert.equal(pair.button.hasAttribute('data-dsh-whale-attached'), false);
  assert.equal(pair.button.children.some((node) => node.hasAttribute('data-dsh-whale-canvas')), false);
  dispose();
});

test('dispose cancels frames and disconnects listeners/observers while removing injected state', () => {
  const env = makeEnvironment(); const pair = env.makeButton(); const dispose = env.startBackground(); env.flushWork();
  assert.ok(env.observers.size >= 1);
  dispose();
  assert.equal(env.frames.size, 0);
  assert.equal(env.window.listenerCount() + env.document.listenerCount() + env.media.listenerCount(), 0);
  assert.equal(env.observers.size, 0);
  assert.equal(env.body.children.some((node) => node.id === 'dsh-bg-canvas'), false);
  assert.equal(pair.button.hasAttribute('data-dsh-whale-attached'), false);
  assert.equal(pair.button.children.some((node) => node.hasAttribute('data-dsh-whale-canvas')), false);
});

test('static theme changes redraw, composer attribute removal cleans up, queued work is safe after dispose', () => {
  const env = makeEnvironment({ reduced: true }); const pair = env.makeButton(); const dispose = env.startBackground();
  const before = env.clearCount(); env.body.setAttribute('data-ds-dark-theme', ''); env.flushWork();
  assert.ok(env.clearCount() > before); assert.equal(env.frames.size, 0);
  pair.card.removeAttribute('data-composer-card'); env.flushWork();
  assert.equal(pair.button.hasAttribute('data-dsh-whale-attached'), false);
  env.makeButton();
  for (const observer of [...env.observers]) if (observer.records.length) observer.callback(observer.records.splice(0));
  dispose(); env.flushWork();
  assert.equal(env.frames.size, 0); assert.equal(env.observers.size, 0);
  assert.equal(env.body.children.some((card) => card.children.some((btn) => btn.hasAttribute('data-dsh-whale-attached'))), false);
});

test('legacy media listener is removed and failed background canvas leaves no scheduled work', () => {
  const legacy = makeEnvironment({ legacyMedia: true }); const stop = legacy.startBackground();
  legacy.media.set(true); assert.equal(legacy.frames.size, 0); stop(); assert.equal(legacy.media.listenerCount(), 0);
  const failed = makeEnvironment({ failBackgroundCanvas: true }); const pair = failed.makeButton(); const dispose = failed.startBackground();
  assert.equal(pair.button.hasAttribute('data-dsh-whale-attached'), false);
  assert.equal(failed.body.children.some((node) => node.id === 'dsh-bg-canvas'), false);
  assert.equal(failed.frames.size, 0); dispose();
});

if (failures.length) {
  console.error(`\n${failures.length} regression check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('\nAll theme regression checks passed.');
}

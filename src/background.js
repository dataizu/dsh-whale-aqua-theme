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

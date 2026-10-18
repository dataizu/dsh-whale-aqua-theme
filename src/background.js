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

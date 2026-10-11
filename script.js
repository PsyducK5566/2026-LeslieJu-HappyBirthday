/* ===========================================================
   背景動畫：半透明非洲菊花瓣緩緩飄落 + 微光粒子浮動
   =========================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("petal-canvas");
  if (!canvas || !canvas.getContext) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;

  var ctx = canvas.getContext("2d");
  var W = 0, H = 0, dpr = 1;
  var petals = [], sparkles = [];
  var rafId = null;

  var PETAL_COLORS = ["#F48FB1", "#F8BBD0", "#FFFFFF", "#FCE4EC", "#EC407A"];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // 依畫面大小決定數量，手機上自動減量以維持流暢
  function counts() {
    var area = W * H;
    return {
      petals:   Math.max(10, Math.min(34, Math.round(area / 32000))),
      sparkles: Math.max(12, Math.min(46, Math.round(area / 22000)))
    };
  }

  function makePetal(seeded) {
    return {
      x: rand(-40, W + 40),
      y: seeded ? rand(-H, H) : rand(-120, -20),
      size: rand(9, 22),
      speed: rand(14, 42),           // px / 秒
      drift: rand(-16, 16),          // 水平漂移
      swing: rand(0.3, 0.9),         // 左右擺盪頻率
      phase: rand(0, Math.PI * 2),
      spin: rand(-0.5, 0.5),         // 自轉速度 (rad/s)
      angle: rand(0, Math.PI * 2),
      alpha: rand(0.22, 0.55),
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
    };
  }

  function makeSparkle(seeded) {
    return {
      x: rand(0, W),
      y: seeded ? rand(0, H) : rand(H * 0.6, H + 40),
      r: rand(0.8, 2.6),
      speed: rand(6, 20),
      phase: rand(0, Math.PI * 2),
      swing: rand(0.4, 1.1),
      alpha: rand(0.25, 0.7)
    };
  }

  function build() {
    var n = counts();
    petals = [];
    sparkles = [];
    for (var i = 0; i < n.petals; i++) petals.push(makePetal(true));
    for (var j = 0; j < n.sparkles; j++) sparkles.push(makeSparkle(true));
  }

  // 單片非洲菊花瓣：細長帶圓尖的造型
  function drawPetal(p, t) {
    var s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    // 隨飄落輕微翻面，模擬花瓣旋轉的厚薄變化
    var flip = Math.abs(Math.cos(t * 0.7 + p.phase)) * 0.75 + 0.25;
    ctx.scale(flip, 1);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo( s * 0.42, -s * 0.18,  s * 0.34, s * 0.42, 0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.34,  s * 0.42, -s * 0.42, -s * 0.18, 0, -s * 0.5);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(s) {
    ctx.save();
    ctx.globalAlpha = s.alpha;
    var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,245,250,.55)");
    g.addColorStop(1, "rgba(255,245,250,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  var last = 0;
  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.05);   // 分頁切回時避免大跳動
    last = now;
    var t = now / 1000;

    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.y += p.speed * dt;
      p.x += (p.drift + Math.sin(t * p.swing + p.phase) * 18) * dt;
      p.angle += p.spin * dt;
      if (p.y - p.size > H) {
        petals[i] = makePetal(false);
      } else if (p.x < -80) {
        p.x = W + 60;
      } else if (p.x > W + 80) {
        p.x = -60;
      }
      drawPetal(p, t);
    }

    for (var j = 0; j < sparkles.length; j++) {
      var s = sparkles[j];
      s.y -= s.speed * dt;                                  // 微光由下往上浮
      s.x += Math.sin(t * s.swing + s.phase) * 10 * dt;
      if (s.y + s.r * 4 < 0) sparkles[j] = makeSparkle(false);
      drawSparkle(s);
    }
  }

  function start() {
    if (rafId === null) { last = 0; rafId = requestAnimationFrame(frame); }
  }
  function stop() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  });

  // 分頁隱藏時暫停，省電也避免回來瞬間爆衝
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  // 使用者中途改為「減少動態」時即時停止
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", function (e) {
      if (e.matches) { stop(); ctx.clearRect(0, 0, W, H); canvas.style.display = "none"; }
    });
  }

  resize();
  start();
})();

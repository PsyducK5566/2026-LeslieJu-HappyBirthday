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

  // 彩蛋：B-612 小行星偶爾緩緩飄過
  var planet = null;
  var nextPlanetAt = rand(12, 20);   // 秒（以動畫累計時間計）
  var clock = 0;

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

  // B-612：帶兩座小火山與一朵小玫瑰的小星球
  function makePlanet() {
    var r = rand(20, 28);
    var ltr = Math.random() < 0.5;
    return {
      r: r,
      x: ltr ? -r * 3 : W + r * 3,
      dir: ltr ? 1 : -1,
      baseY: rand(H * 0.12, H * 0.45),
      speed: Math.max(W / 40, 24),   // 約 40 秒橫越畫面
      angle: rand(0, Math.PI * 2),
      spin: rand(0.08, 0.16) * (ltr ? 1 : -1),
      phase: rand(0, Math.PI * 2)
    };
  }

  function drawPlanet(pl, t) {
    var r = pl.r;
    var y = pl.baseY + Math.sin(t * 0.4 + pl.phase) * 14;
    ctx.save();
    ctx.translate(pl.x, y);
    ctx.globalAlpha = 0.6;

    var glow = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.2);
    glow.addColorStop(0, "rgba(255,255,255,.55)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(pl.angle);

    // 地表上的小東西：兩座火山、一朵玫瑰
    function onSurface(deg, draw) {
      ctx.save();
      ctx.rotate(deg * Math.PI / 180);
      ctx.translate(0, -r + 1);
      draw();
      ctx.restore();
    }
    ctx.fillStyle = "#7986CB";
    [-62, -38].forEach(function (deg) {
      onSurface(deg, function () {
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, 0);
        ctx.lineTo(-r * 0.08, -r * 0.24);
        ctx.lineTo( r * 0.08, -r * 0.24);
        ctx.lineTo( r * 0.2, 0);
        ctx.closePath();
        ctx.fill();
      });
    });
    onSurface(28, function () {
      ctx.strokeStyle = "#6A9F58";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 0.42);
      ctx.stroke();
      ctx.fillStyle = "#EC407A";
      ctx.beginPath();
      ctx.arc(0, -r * 0.48, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    });

    var body = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    body.addColorStop(0, "#F3E5F5");
    body.addColorStop(1, "#9FA8DA");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(26,35,126,.12)";
    [[0.3, 0.2, 0.18], [-0.35, 0.35, 0.12], [0.05, -0.3, 0.1]].forEach(function (c) {
      ctx.beginPath();
      ctx.arc(c[0] * r, c[1] * r, c[2] * r, 0, Math.PI * 2);
      ctx.fill();
    });

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

    // 小行星畫在最底層，花瓣與微光從它前面飄過
    clock += dt;
    if (!planet && clock >= nextPlanetAt) planet = makePlanet();
    if (planet) {
      planet.x += planet.speed * planet.dir * dt;
      planet.angle += planet.spin * dt;
      if (planet.x < -planet.r * 4 || planet.x > W + planet.r * 4) {
        planet = null;
        nextPlanetAt = clock + rand(30, 55);
      } else {
        drawPlanet(planet, t);
      }
    }

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


/* ===========================================================
   開場流程：儀式按鈕 → 過場句 → 祝福頁
   彩蛋出自《小王子》第 21 章的狐狸：
   - 狐狸每隔一段時間「坐得更靠近一點」
   - 下午三點到四點之間打開，過場句會換成「四點鐘」那段話
   - 祝福語左下角的玻璃罩（花瓣背景裡另有 B-612 小行星）
   =========================================================== */
(function () {
  "use strict";

  var body = document.body;
  var intro = document.getElementById("intro");
  var btn = document.getElementById("rite-btn");
  var fox = document.getElementById("fox");
  var interlude = document.getElementById("interlude");
  var stage = document.getElementById("stage");
  if (!intro || !btn || !interlude || !stage) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INTRO_FADE = reduceMotion ? 0 : 800;
  var INTERLUDE_HOLD = 5600;   // 過場句停留時間（含兩行的淡入）
  var INTERLUDE_FADE = reduceMotion ? 0 : 900;

  // 狐狸：每 7 秒靠近一步，共 6 步
  var step = 0;
  var foxTimer = fox ? setInterval(function () {
    step++;
    fox.style.setProperty("--step", step);
    if (step >= 6) clearInterval(foxTimer);
  }, 7000) : null;

  // 四點鐘彩蛋
  if (new Date().getHours() === 15) {
    document.getElementById("interlude-quote").textContent =
      "If you come at four o'clock in the afternoon, then at three o'clock I shall begin to be happy.";
    document.getElementById("interlude-coda").textContent = "It's almost four o'clock.";
  }

  var holdTimer = null;
  var opened = false;

  function openStage() {
    if (opened) return;
    opened = true;
    clearTimeout(holdTimer);
    interlude.classList.add("is-leaving");
    setTimeout(function () {
      interlude.hidden = true;
      body.classList.add("is-open");
      stage.focus({ preventScroll: true });
    }, INTERLUDE_FADE);
  }

  btn.addEventListener("click", function () {
    btn.disabled = true;
    if (foxTimer) clearInterval(foxTimer);
    intro.classList.add("is-leaving");
    setTimeout(function () {
      intro.hidden = true;
      interlude.hidden = false;
      holdTimer = setTimeout(openStage, INTERLUDE_HOLD);
    }, INTRO_FADE);
  }, { once: true });

  // 過場句可點一下或按任意鍵略過
  interlude.addEventListener("click", openStage);
  document.addEventListener("keydown", function () {
    if (!interlude.hidden) openStage();
  });
})();

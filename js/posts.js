/* =========================================================
   Motion (adapted from the Posts dashboard)
   1) Scroll reveal: list rows, cards and panels fade up in sequence
   2) Dashboard hero: physics shapes that fall, stack, and get
      pushed around by the mouse (uses js/matter.min.js)
   Without JavaScript the page still shows everything (static shapes).
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1) Scroll reveal
     --------------------------------------------------------- */
  var GROUPS = [
    ".list > .row",
    ".kcards > .kcard",
    ".metrics > .metric",
    ".charts > .panel",
    ".roi > .roi-card",
    ".approvals-time",
    ".kanban > .kcol",
    ".cal > .cal-cell",
    ".main > .guide",
    ".logos > .logo-tile",
    ".swatches > .swatch",
    ".chips > .chip",
    ".empty",
    ".pipeline",
    ".notice",
    ".legal > *",
    ".ai-grid > .ai-card",
    ".main > .case",
    ".steps > .step",
    ".timeline",
    ".two-col > .prose",
    ".main > .prose",
    ".vtl > .vtl-item"
  ];

  function setupReveal() {
    var items = [];
    GROUPS.forEach(function (sel) {
      var step = sel.indexOf("cal-cell") > -1 || sel.indexOf("chip") > -1 || sel.indexOf("swatch") > -1 ? 18 : 70;
      document.querySelectorAll(sel).forEach(function (el, i) {
        if (el.classList.contains("reveal")) return;
        el.classList.add("reveal");
        el.style.setProperty("--d", Math.min(i * step, 600) + "ms");
        items.push(el);
      });
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     2) Physics shapes in the dashboard hero
     --------------------------------------------------------- */

  // Shape artwork, drawn in a -50..50 box
  var ART = {
    flower: '<circle cx="0" cy="-20" r="27"/><circle cx="20" cy="0" r="27"/><circle cx="0" cy="20" r="27"/><circle cx="-20" cy="0" r="27"/>',
    blob: '<circle cx="-22" cy="-22" r="24"/><circle cx="22" cy="-22" r="24"/><circle cx="-22" cy="22" r="24"/><circle cx="22" cy="22" r="24"/><circle cx="0" cy="0" r="32"/>',
    clover: '<circle cx="0" cy="-24" r="24"/><circle cx="24" cy="0" r="24"/><circle cx="0" cy="24" r="24"/><circle cx="-24" cy="0" r="24"/><circle cx="0" cy="0" r="16"/>',
    square: '<rect x="-46" y="-46" width="92" height="92" rx="10"/>',
    dot: '<circle cx="0" cy="0" r="49"/>'
  };

  // type, colour, size as a share of hero width, how many
  var SET = [
    ["flower", "var(--lilac)", 0.20, 2],
    ["blob", "var(--lime)", 0.15, 3],
    ["clover", "var(--ink)", 0.10, 3],
    ["square", "var(--blue)", 0.07, 3],
    ["dot", "var(--orange)", 0.048, 3]
  ];

  function setupPhysics() {
    var hero = document.querySelector(".hero");
    if (!hero || reduceMotion || !window.Matter) return;

    var M = window.Matter;
    var Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Runner = M.Runner;

    var field = document.createElement("div");
    field.className = "shape-field";
    field.setAttribute("aria-hidden", "true");
    hero.appendChild(field);
    hero.classList.add("has-physics");

    var engine = Engine.create();
    engine.gravity.y = 1;
    var runner = Runner.create();
    var world = engine.world;

    var bodies = [];   // { body, el, size }
    var walls = [];
    var W = 0, H = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function buildWalls() {
      if (walls.length) Composite.remove(world, walls);
      var t = 200; // wall thickness
      var opts = { isStatic: true, friction: 0.4, restitution: 0.2 };
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, opts),          // floor
        Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, opts),             // left
        Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, opts),          // right
        Bodies.rectangle(W / 2, -H * 1.3 - t / 2, W + t * 2, t, opts)    // high ceiling
      ];
      Composite.add(world, walls);
    }

    function buildShapes() {
      bodies.forEach(function (b) { b.el.remove(); });
      if (bodies.length) Composite.remove(world, bodies.map(function (b) { return b.body; }));
      bodies = [];

      var list = [];
      SET.forEach(function (s) { for (var i = 0; i < s[3]; i++) list.push(s); });
      // shuffle so colours mix as they fall
      list.sort(function () { return Math.random() - 0.5; });

      list.forEach(function (s, i) {
        var type = s[0], size = Math.round(W * s[2]);
        var x = rand(size, W - size);
        var y = -i * (H * 0.09) - rand(20, 80);   // staggered drop
        var common = { restitution: 0.25, friction: 0.3, frictionAir: 0.012, density: 0.0015 };
        var body;
        if (type === "square") {
          body = Bodies.rectangle(x, y, size * 0.92, size * 0.92, Object.assign({ chamfer: { radius: size * 0.1 } }, common));
        } else {
          var r = { flower: 0.46, blob: 0.45, clover: 0.44, dot: 0.49 }[type];
          body = Bodies.circle(x, y, size * r, common);
        }
        Body.setAngle(body, rand(0, Math.PI * 2));
        Body.setAngularVelocity(body, rand(-0.05, 0.05));

        var el = document.createElement("div");
        el.className = "pshape";
        el.style.width = el.style.height = size + "px";
        el.innerHTML = '<svg viewBox="-50 -50 100 100" style="fill:' + s[1] + '">' + ART[type] + "</svg>";
        field.appendChild(el);

        bodies.push({ body: body, el: el, size: size });
      });

      Composite.add(world, bodies.map(function (b) { return b.body; }));
    }

    function measure() {
      W = hero.clientWidth;
      H = hero.clientHeight;
    }

    // draw DOM from physics each frame
    M.Events.on(engine, "afterUpdate", function () {
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i], p = b.body.position, half = b.size / 2;
        b.el.style.transform =
          "translate(" + (p.x - half).toFixed(1) + "px," + (p.y - half).toFixed(1) + "px) rotate(" + b.body.angle.toFixed(3) + "rad)";
      }
    });

    /* ----- mouse / touch pushes shapes away ----- */
    var last = null;
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var now = performance.now();
      var vx = 0, vy = 0;
      if (last) {
        var dt = Math.max(now - last.t, 8);
        vx = (mx - last.x) / dt * 16;   // px per physics step
        vy = (my - last.y) / dt * 16;
      }
      last = { x: mx, y: my, t: now };

      var reach = W * 0.09;
      for (var i = 0; i < bodies.length; i++) {
        var body = bodies[i].body;
        var dx = body.position.x - mx, dy = body.position.y - my;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var radius = bodies[i].size / 2 + reach;
        if (dist > radius) continue;

        var k = 1 - dist / radius;              // 0 at edge, 1 at centre
        var push = 6 * k;
        var nvx = body.velocity.x + (dx / dist) * push + vx * 0.35 * k;
        var nvy = body.velocity.y + (dy / dist) * push + vy * 0.35 * k - 3 * k;
        var max = 28;
        nvx = Math.max(-max, Math.min(max, nvx));
        nvy = Math.max(-max, Math.min(max, nvy));
        Body.setVelocity(body, { x: nvx, y: nvy });
        Body.setAngularVelocity(body, body.angularVelocity + (dx > 0 ? 1 : -1) * 0.06 * k);
      }
    });
    hero.addEventListener("pointerleave", function () { last = null; });

    /* ----- start, and rebuild on big resizes ----- */
    measure();
    buildWalls();
    buildShapes();
    Runner.run(runner, engine);

    var lastW = W;
    if ("ResizeObserver" in window) {
      var timer;
      new ResizeObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          measure();
          buildWalls();
          if (Math.abs(W - lastW) / lastW > 0.15) { buildShapes(); lastW = W; }
        }, 150);
      }).observe(hero);
    }

    // pause the simulation while the tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) Runner.stop(runner);
      else Runner.run(runner, engine);
    });
  }

  function init() {
    setupReveal();
    setupPhysics();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

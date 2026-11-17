/* =========================================================
   Posts — motion & interactions (no framework)

   1. Scroll reveal            8.  Notification panel
   2. Hero physics shapes      9.  Evaluation checklist
   3. Toasts                   10. Welcome dialog
   4. Dialogs + forms          11. Guided tour (7 steps, across pages)
   5. Dropdowns                12. Calendar (month nav, "+" per day)
   6. Tabs / cards / chips     13. Reports: date range + CSV export
   7. Popovers                 14. Mobile menu

   Without JavaScript every page still shows in full.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var PAGE = (location.pathname.split("/").pop() || "index.html").replace(/\?.*$/, "") || "index.html";
  var IS_APP = false;   // portfolio: no welcome dialog or guided tour

  function h(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* small persistent store (localStorage can be unavailable) */
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem("posts:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem("posts:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ }
    }
  };

  var ICON = {
    x: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6"/></svg>',
    check: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    chev: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    cal: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    upload: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M8 11V3M4.5 6.5 8 3l3.5 3.5M2.5 11v2.5h11V11" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    arrow: '<svg viewBox="0 0 16 12" width="16" height="12" aria-hidden="true" class="nudge"><line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/><polygon points="8,1 14,6 8,11" fill="currentColor"/></svg>',
    flow: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="5" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 6H14a3 3 0 0 1 3 3v6.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    history: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M12 8v4l3 2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
  };

  /* =========================================================
     1) Scroll reveal
     ========================================================= */
  var GROUPS = [
    ".list > .row", ".kcards > .kcard", ".metrics > .metric", ".charts > .panel", ".roi > .roi-card",
    ".approvals-time", ".kanban > .kcol", ".cal > .cal-cell", ".main > .guide", ".logos > .logo-tile",
    ".swatches > .swatch", ".chips > .chip", ".empty", ".pipeline", ".notice", ".legal > *",
    ".ai-grid > .ai-card", ".main > .case", ".steps > .step", ".timeline", ".two-col > .prose",
    ".main > .prose", ".jobs > .job", ".cert-grid > .cert",
    ".fn-funnel > .fn-step", ".fn-lenses > .fn-lens", ".fn-goals > .fn-goal", ".fn-two > .prose", ".section > .prose"
  ];
  var io = null;
  function reveal(el, delay) {
    el.classList.add("reveal");
    el.style.setProperty("--d", (delay || 0) + "ms");
    if (reduceMotion || !io) { el.classList.add("in"); return; }
    io.observe(el);
  }
  function setupReveal() {
    if (!reduceMotion && "IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    }
    GROUPS.forEach(function (sel) {
      var step = /cal-cell|chip|swatch/.test(sel) ? 18 : 70;
      $$(sel).forEach(function (el, i) {
        if (!el.classList.contains("reveal")) reveal(el, Math.min(i * step, 600));
      });
    });
  }

  /* =========================================================
     2) Physics shapes in the dashboard hero
     ========================================================= */
  var ART = {
    flower: '<circle cx="0" cy="-20" r="27"/><circle cx="20" cy="0" r="27"/><circle cx="0" cy="20" r="27"/><circle cx="-20" cy="0" r="27"/>',
    blob: '<circle cx="-22" cy="-22" r="24"/><circle cx="22" cy="-22" r="24"/><circle cx="-22" cy="22" r="24"/><circle cx="22" cy="22" r="24"/><circle cx="0" cy="0" r="32"/>',
    clover: '<circle cx="0" cy="-24" r="24"/><circle cx="24" cy="0" r="24"/><circle cx="0" cy="24" r="24"/><circle cx="-24" cy="0" r="24"/><circle cx="0" cy="0" r="16"/>',
    square: '<rect x="-46" y="-46" width="92" height="92" rx="10"/>',
    dot: '<circle cx="0" cy="0" r="49"/>'
  };
  var SET = [
    ["flower", "var(--lilac)", 0.20, 2],
    ["blob", "var(--lime)", 0.15, 3],
    ["clover", "var(--ink)", 0.10, 3],
    ["square", "var(--blue)", 0.07, 3],
    ["dot", "var(--orange)", 0.048, 3]
  ];

  function setupPhysics() {
    var hero = $(".hero");
    if (!hero || reduceMotion || !window.Matter) return;

    var M = window.Matter, Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Runner = M.Runner;
    var field = h('<div class="shape-field" aria-hidden="true"></div>');
    hero.appendChild(field);
    hero.classList.add("has-physics");

    var engine = Engine.create(), runner = Runner.create(), world = engine.world;
    var bodies = [], walls = [], W = 0, H = 0;
    function rand(a, b) { return a + Math.random() * (b - a); }

    function buildWalls() {
      if (walls.length) Composite.remove(world, walls);
      var t = 200, o = { isStatic: true, friction: 0.4, restitution: 0.2 };
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, o),
        Bodies.rectangle(-t / 2, -H / 2, t, H * 4, o),
        Bodies.rectangle(W + t / 2, -H / 2, t, H * 4, o),
        Bodies.rectangle(W / 2, -H * 1.3 - t / 2, W + t * 2, t, o)
      ];
      Composite.add(world, walls);
    }

    function buildShapes() {
      bodies.forEach(function (b) { b.el.remove(); });
      if (bodies.length) Composite.remove(world, bodies.map(function (b) { return b.body; }));
      bodies = [];
      var list = [];
      SET.forEach(function (s) { for (var i = 0; i < s[3]; i++) list.push(s); });
      list.sort(function () { return Math.random() - 0.5; });

      list.forEach(function (s, i) {
        var type = s[0], size = Math.round(W * s[2]);
        var x = rand(size, W - size), y = -i * (H * 0.09) - rand(20, 80);
        var common = { restitution: 0.25, friction: 0.3, frictionAir: 0.012, density: 0.0015 };
        var body = type === "square"
          ? Bodies.rectangle(x, y, size * 0.92, size * 0.92, Object.assign({ chamfer: { radius: size * 0.1 } }, common))
          : Bodies.circle(x, y, size * { flower: 0.46, blob: 0.45, clover: 0.44, dot: 0.49 }[type], common);
        Body.setAngle(body, rand(0, Math.PI * 2));
        Body.setAngularVelocity(body, rand(-0.05, 0.05));
        var el = h('<div class="pshape" style="width:' + size + "px;height:" + size + 'px"><svg viewBox="-50 -50 100 100" style="fill:' + s[1] + '">' + ART[type] + "</svg></div>");
        field.appendChild(el);
        bodies.push({ body: body, el: el, size: size });
      });
      Composite.add(world, bodies.map(function (b) { return b.body; }));
    }

    function measure() { W = hero.clientWidth; H = hero.clientHeight; }

    M.Events.on(engine, "afterUpdate", function () {
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i], p = b.body.position, half = b.size / 2;
        b.el.style.transform = "translate(" + (p.x - half).toFixed(1) + "px," + (p.y - half).toFixed(1) + "px) rotate(" + b.body.angle.toFixed(3) + "rad)";
      }
    });

    var last = null;
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var now = performance.now(), vx = 0, vy = 0;
      if (last) { var dt = Math.max(now - last.t, 8); vx = (mx - last.x) / dt * 16; vy = (my - last.y) / dt * 16; }
      last = { x: mx, y: my, t: now };
      var reach = W * 0.09;
      bodies.forEach(function (b) {
        var body = b.body, dx = body.position.x - mx, dy = body.position.y - my;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1, radius = b.size / 2 + reach;
        if (dist > radius) return;
        var k = 1 - dist / radius, push = 6 * k, max = 28;
        var nvx = body.velocity.x + (dx / dist) * push + vx * 0.35 * k;
        var nvy = body.velocity.y + (dy / dist) * push + vy * 0.35 * k - 3 * k;
        Body.setVelocity(body, { x: Math.max(-max, Math.min(max, nvx)), y: Math.max(-max, Math.min(max, nvy)) });
        Body.setAngularVelocity(body, body.angularVelocity + (dx > 0 ? 1 : -1) * 0.06 * k);
      });
    });
    hero.addEventListener("pointerleave", function () { last = null; });

    measure(); buildWalls(); buildShapes(); Runner.run(runner, engine);

    var lastW = W, timer;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          measure(); buildWalls();
          if (Math.abs(W - lastW) / lastW > 0.15) { buildShapes(); lastW = W; }
        }, 150);
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) Runner.stop(runner); else Runner.run(runner, engine);
    });
  }

  /* =========================================================
     3) Toasts
     ========================================================= */
  var toastBox;
  function toast(msg) {
    if (!toastBox) { toastBox = h('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(toastBox); }
    var t = h('<div class="toast">' + ICON.check + "<span>" + esc(msg) + "</span></div>");
    toastBox.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 250);
    }, 2600);
  }

  /* =========================================================
     4) Dialogs
     ========================================================= */
  var openLayers = [];   // stack of { el, close }

  function lockScroll(on) { document.documentElement.classList.toggle("no-scroll", on); }

  /* Generic animated overlay: backdrop + panel. Returns { el, close }. */
  function overlay(panelHtml, opts) {
    opts = opts || {};
    var wrap = h('<div class="layer ' + (opts.cls || "") + '"><div class="backdrop"></div>' + panelHtml + "</div>");
    document.body.appendChild(wrap);
    var panel = wrap.lastElementChild;
    var prevFocus = document.activeElement;
    lockScroll(true);
    requestAnimationFrame(function () { wrap.classList.add("open"); });

    var api = {
      el: wrap,
      panel: panel,
      close: function () {
        if (api.closed) return;
        api.closed = true;
        wrap.classList.remove("open");
        wrap.classList.add("closing");
        openLayers = openLayers.filter(function (l) { return l !== api; });
        if (!openLayers.length) lockScroll(false);
        setTimeout(function () { wrap.remove(); }, reduceMotion ? 0 : 200);
        if (prevFocus && prevFocus.focus) prevFocus.focus();
        if (opts.onClose) opts.onClose();
      }
    };
    openLayers.push(api);
    $(".backdrop", wrap).addEventListener("click", function () { if (opts.backdropCloses !== false) api.close(); });
    $$("[data-close]", wrap).forEach(function (b) { b.addEventListener("click", api.close); });

    // focus first field
    setTimeout(function () {
      var f = panel.querySelector("input:not([type=hidden]), textarea, button.sel, [data-next], [data-go-tour], button:not(.dlg-x)");
      if (f) f.focus({ preventScroll: true });
    }, 60);
    return api;
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (closeDropdown()) return;
      if (closePopover()) return;
      var top = openLayers[openLayers.length - 1];
      if (top) top.close();
    }
    if (e.key === "Tab" && openLayers.length) {   // keep focus inside the open dialog
      var panel = openLayers[openLayers.length - 1].panel;
      var f = $$('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])', panel).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ----- form field builders ----- */
  function fText(name, label, ph, req, type) {
    return '<label class="field"><span class="lbl">' + label + '</span><input name="' + name + '" type="' + (type || "text") + '" placeholder="' + (ph || "") + '"' + (req ? ' data-req="' + esc(req) + '"' : "") + ' /><em class="err"></em></label>';
  }
  function fArea(name, label, ph, req) {
    return '<label class="field"><span class="lbl">' + label + '</span><textarea name="' + name + '" rows="3" placeholder="' + (ph || "") + '"' + (req ? ' data-req="' + esc(req) + '"' : "") + "></textarea><em class=\"err\"></em></label>";
  }
  function fSelect(name, label, ph, options, req) {
    return '<div class="field"><span class="lbl">' + label + '</span><button type="button" class="sel sel-field" name="' + name + '" data-dd=\'' + esc(JSON.stringify(options)) + "' data-ph=\"" + esc(ph) + '"' + (req ? ' data-req="' + esc(req) + '"' : "") + '><span class="sel-val is-ph">' + ph + "</span>" + ICON.chev + '</button><em class="err"></em></div>';
  }
  function fDate(name, label, req) {
    return '<label class="field"><span class="lbl">' + label + '</span><span class="date-input">' + ICON.cal + '<input name="' + name + '" type="date"' + (req ? ' data-req="' + esc(req) + '"' : "") + ' /></span><em class="err"></em></label>';
  }
  function row2(a, b) { return '<div class="field-row">' + a + b + "</div>"; }

  var FORMS = {
    campaign: {
      title: "Create Campaign", submit: "Create Campaign", done: "Campaign created",
      body: function () {
        return fText("name", "Name *", "Campaign name", "Campaign name is required") +
          fText("objective", "Objective *", "What's the goal?", "Objective is required") +
          fArea("description", "Description", "") +
          row2(fSelect("type", "Type", "Select type", ["Email", "Social Media", "Paid Ads", "Blog/Content", "Video", "Landing Page", "Multi-Channel"]),
               fSelect("status", "Status", "Planning", ["Planning", "Active", "Completed", "On Hold"])) +
          row2(fSelect("owner", "Owner *", "Select owner", [], "Owner is required"),
               fText("budget", "Budget", "", null, "number")) +
          row2(fDate("start", "Start *", "Start date is required"), fDate("end", "End *", "End date is required"));
      },
      validate: function (f, errs) {
        if (f.budget.value && +f.budget.value < 0) errs.budget = "Budget must be a positive number";
        if (f.start.value && f.end.value && f.end.value < f.start.value) errs.end = "End date cannot be before start date";
      }
    },
    task: {
      title: "New Task", submit: "Create Task", done: "Task created",
      body: function () {
        return fText("title", "Title *", "", "Title is required") +
          fArea("description", "Description", "") +
          row2(fSelect("campaign", "Campaign", "Select", []), fSelect("priority", "Priority", "Medium", ["Low", "Medium", "High", "Urgent"])) +
          row2(fSelect("assignee", "Assignee", "Select", []), fDate("due", "Due Date"));
      }
    },
    item: {
      title: "Add to Library", submit: "Save", done: "Added to library",
      body: function () {
        return fText("name", "Name *", "", "Name is required") +
          row2(fSelect("category", "Category", "Content Template", ["Content Template", "Brand Asset"]),
               fSelect("type", "Type", "Other", ["Blog", "Email", "Social", "Ad", "Video", "Landing Page", "Other"])) +
          fArea("description", "Description", "") +
          fArea("starter", "Starter Content *", "", "Starter content is required") +
          '<label class="upload">' + ICON.upload + '<span>Upload file</span><input type="file" hidden /></label>';
      }
    },
    member: {
      title: "Add team member", submit: "Add Member", done: "Member added",
      body: function () {
        return fText("name", "Name *", "", "Name is required") +
          fText("email", "Email", "", null, "email") +
          row2(fSelect("role", "Role", "Contributor", ["Admin", "Manager", "Contributor", "Reviewer"]), fText("title", "Title", ""));
      }
    },
    rule: {
      title: "Approval routing rule", submit: "Create Rule", done: "Rule created",
      body: function () {
        return fText("name", "Rule Name *", "e.g. Social posts → Brand review", "Rule name is required") +
          row2(fSelect("type", "Asset Type", "Any", ["Any", "Blog", "Email", "Social", "Ad", "Video", "Landing Page", "Other"]),
               fSelect("campaign", "Campaign", "Any campaign", ["Any campaign"])) +
          '<div class="field"><span class="lbl">Approval Stages (in order)</span><ol class="stages"></ol>' +
          '<button type="button" class="btn-ghost" data-add-stage>+ Add stage</button></div>';
      },
      init: function (panel) {
        var list = $(".stages", panel);
        function addStage() {
          var n = list.children.length + 1;
          var li = h('<li class="stage"><span class="stage-n">' + n + '</span><input placeholder="Stage name" />' +
            '<button type="button" class="sel sel-field" data-dd=\'["Unassigned"]\' data-ph="Approver"><span class="sel-val is-ph">Approver</span>' + ICON.chev + "</button></li>");
          list.appendChild(li);
        }
        addStage();
        $("[data-add-stage]", panel).addEventListener("click", addStage);
      }
    }
  };

  function openForm(kind, preset) {
    var def = FORMS[kind];
    if (!def) return;
    var dlg = overlay(
      '<form class="dialog" role="dialog" aria-modal="true" aria-label="' + esc(def.title) + '" novalidate>' +
        '<header class="dlg-head"><h2>' + def.title + '</h2><button type="button" class="dlg-x" data-close aria-label="Close">' + ICON.x + "</button></header>" +
        '<div class="dlg-body">' + def.body() + "</div>" +
        '<button type="submit" class="btn-block">' + def.submit + "</button>" +
      "</form>"
    );
    var form = dlg.panel;
    if (def.init) def.init(form);
    if (preset) Object.keys(preset).forEach(function (k) { if (form.elements[k]) form.elements[k].value = preset[k]; });

    form.addEventListener("input", function (e) { clearErr(e.target.closest(".field")); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errs = {};
      $$("[data-req]", form).forEach(function (f) {
        var val = f.tagName === "BUTTON" ? f.dataset.value : f.value.trim();
        if (!val) errs[f.getAttribute("name")] = f.dataset.req;
      });
      if (def.validate) def.validate(form.elements, errs);
      $$(".field", form).forEach(clearErr);
      var first = null;
      Object.keys(errs).forEach(function (n) {
        var f = form.querySelector('[name="' + n + '"]');
        if (!f) return;
        var field = f.closest(".field");
        field.classList.add("has-err");
        $(".err", field).textContent = errs[n];
        if (!first) first = f;
      });
      if (first) { first.focus(); form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake"); return; }
      dlg.close();
      toast(def.done);
    });
  }
  function clearErr(field) {
    if (!field) return;
    field.classList.remove("has-err");
    var e = $(".err", field); if (e) e.textContent = "";
  }

  /* =========================================================
     5) Dropdowns (data-dd='["A","B"]')
     ========================================================= */
  var dd = null;   // { btn, el }
  function closeDropdown() {
    if (!dd) return false;
    var cur = dd; dd = null;
    cur.btn.setAttribute("aria-expanded", "false");
    cur.el.classList.remove("open");
    setTimeout(function () { cur.el.remove(); }, 150);
    return true;
  }
  function openDropdown(btn) {
    if (dd && dd.btn === btn) { closeDropdown(); return; }
    closeDropdown();
    var opts = JSON.parse(btn.getAttribute("data-dd") || "[]");
    var current = btn.dataset.value || ($(".sel-val", btn).classList.contains("is-ph") ? "" : $(".sel-val", btn).textContent);
    var items = opts.length
      ? opts.map(function (o, i) {
          return '<li role="option" tabindex="-1" data-i="' + i + '" aria-selected="' + (o === current) + '">' +
            '<span class="tick">' + (o === current ? ICON.check : "") + "</span>" + esc(o) + "</li>";
        }).join("")
      : '<li class="dd-empty">No options</li>';
    var el = h('<ul class="dd" role="listbox">' + items + "</ul>");
    document.body.appendChild(el);

    var r = btn.getBoundingClientRect();
    el.style.minWidth = r.width + "px";
    el.style.left = (r.left + window.scrollX) + "px";
    var below = r.bottom + 6, height = el.offsetHeight;
    var top = below + height > window.innerHeight && r.top - height - 6 > 0 ? r.top - height - 6 : below;
    el.style.top = (top + window.scrollY) + "px";
    el.style.transformOrigin = top < r.top ? "bottom" : "top";

    btn.setAttribute("aria-expanded", "true");
    dd = { btn: btn, el: el };
    requestAnimationFrame(function () { el.classList.add("open"); });

    var lis = $$("li[role=option]", el);
    var active = Math.max(0, opts.indexOf(current));
    if (lis[active]) lis[active].focus();

    el.addEventListener("click", function (e) {
      var li = e.target.closest("li[role=option]");
      if (!li) return;
      choose(btn, opts[+li.dataset.i]);
      closeDropdown();
      btn.focus();
    });
    el.addEventListener("keydown", function (e) {
      var i = lis.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (lis[i + 1] || lis[0]).focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (lis[i - 1] || lis[lis.length - 1]).focus(); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (i > -1) { choose(btn, opts[i]); closeDropdown(); btn.focus(); } }
      if (e.key === "Tab") closeDropdown();
    });
  }
  function choose(btn, value) {
    var v = $(".sel-val", btn);
    v.textContent = value;
    v.classList.remove("is-ph");
    btn.dataset.value = value;
    clearErr(btn.closest(".field"));
    btn.dispatchEvent(new CustomEvent("change", { bubbles: true }));
  }
  function resetDropdowns(scope) {
    $$("[data-dd]", scope).forEach(function (b) {
      var opts = JSON.parse(b.getAttribute("data-dd"));
      if (b.dataset.ph) { $(".sel-val", b).textContent = b.dataset.ph; $(".sel-val", b).classList.add("is-ph"); delete b.dataset.value; }
      else if (opts.length) choose(b, opts[0]);
    });
  }

  /* =========================================================
     7) Popovers (notifications, date range, evaluation)
     ========================================================= */
  var pop = null;   // { el, anchor, backdrop }
  function closePopover() {
    if (!pop) return false;
    var cur = pop; pop = null;
    cur.el.classList.remove("open");
    if (cur.backdrop) cur.backdrop.classList.remove("open");
    if (cur.anchor) cur.anchor.setAttribute("aria-expanded", "false");
    setTimeout(function () { cur.el.remove(); if (cur.backdrop) cur.backdrop.remove(); }, 180);
    return true;
  }
  function openPopover(anchor, html, opts) {
    opts = opts || {};
    if (pop && pop.anchor === anchor) { closePopover(); return null; }
    closePopover();
    var backdrop = opts.dim ? h('<div class="pop-backdrop"></div>') : null;
    if (backdrop) { document.body.appendChild(backdrop); backdrop.addEventListener("click", closePopover); }
    var el = h('<div class="popover ' + (opts.cls || "") + '" role="dialog">' + html + "</div>");
    document.body.appendChild(el);

    var r = anchor.getBoundingClientRect(), w = el.offsetWidth, ht = el.offsetHeight;
    var place = opts.place || "below";
    var left, top;
    if (place === "above") { left = r.left; top = r.top - ht - 8; el.style.transformOrigin = "bottom left"; }
    else if (place === "above-right") { left = r.right - w; top = r.top - ht - 8; el.style.transformOrigin = "bottom right"; }
    else { left = r.right - w; top = r.bottom + 8; el.style.transformOrigin = "top right"; }
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    top = Math.max(8, top);
    el.style.left = left + "px";
    el.style.top = top + "px";

    anchor.setAttribute("aria-expanded", "true");
    pop = { el: el, anchor: anchor, backdrop: backdrop };
    requestAnimationFrame(function () { el.classList.add("open"); if (backdrop) backdrop.classList.add("open"); });
    $$("[data-pop-close]", el).forEach(function (b) { b.addEventListener("click", closePopover); });
    return el;
  }
  document.addEventListener("mousedown", function (e) {
    if (dd && !dd.el.contains(e.target) && !dd.btn.contains(e.target)) closeDropdown();
    if (pop && !pop.el.contains(e.target) && !pop.anchor.contains(e.target) && !(pop.backdrop && pop.backdrop.contains(e.target))) closePopover();
  });
  window.addEventListener("resize", function () { closeDropdown(); closePopover(); });

  function openNotifications(anchor) {
    var el = openPopover(anchor,
      '<header class="pop-head"><h2>Notifications</h2><button type="button" class="dlg-x" data-pop-close aria-label="Close">' + ICON.x + "</button></header>" +
      '<div class="pop-empty"><span class="empty-ico">' + ICON.bell + "</span><h3>All caught up</h3><p>No notifications right now.</p></div>",
      { place: "above", dim: true, cls: "pop-notif" });
    if (el) evalCheck("open_notifications");
  }

  function openRange(anchor) {
    var label = $("[data-range-label]", anchor);
    var parts = label.textContent.split("–").map(function (s) { return s.trim().split(".").reverse().join("-"); });
    var el = openPopover(anchor,
      '<form class="range-form"><div class="field-row">' +
      '<label class="field"><span class="lbl">From</span><span class="date-input">' + ICON.cal + '<input name="from" type="date" value="' + parts[0] + '"></span></label>' +
      '<label class="field"><span class="lbl">To</span><span class="date-input">' + ICON.cal + '<input name="to" type="date" value="' + parts[1] + '"></span></label>' +
      '</div><button type="submit" class="btn-block">Apply</button></form>', { cls: "pop-range" });
    if (!el) return;
    $("form", el).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target.elements, fmt = function (v) { return v.split("-").reverse().join("."); };
      if (f.from.value && f.to.value && f.to.value >= f.from.value) {
        label.textContent = fmt(f.from.value) + " – " + fmt(f.to.value);
        closePopover();
      } else {
        f.to.closest(".field").classList.add("has-err");
      }
    });
  }

  /* =========================================================
     9) Evaluation checklist
     ========================================================= */
  var EVAL = [
    ["ai_summary", "Run an AI summary"],
    ["suggest_reviewers", "Try Suggest reviewers"],
    ["approve_asset", "Approve an asset"],
    ["version_history", "View version history"],
    ["open_notifications", "Open notifications"],
    ["roi_lens", "Review the ROI lens"]
  ];
  function evalState() { return store.get("eval", {}); }
  function evalCount() {
    var s = evalState(), n = EVAL.filter(function (e) { return s[e[0]]; }).length;
    $$("[data-eval-count]").forEach(function (b) { b.textContent = n + "/" + EVAL.length; });
    return n;
  }
  function evalCheck(id, val) {
    var s = evalState();
    s[id] = val === undefined ? true : val;
    store.set("eval", s);
    evalCount();
  }
  function openEval(anchor) {
    var s = evalState();
    var rows = EVAL.map(function (e) {
      return '<li><label class="check"><input type="checkbox" data-id="' + e[0] + '"' + (s[e[0]] ? " checked" : "") + '><span class="box">' + ICON.check + "</span><span>" + e[1] + "</span></label></li>";
    }).join("");
    var el = openPopover(anchor,
      '<header class="pop-head"><h2>Evaluation checklist</h2><button type="button" class="dlg-x" data-pop-close aria-label="Close evaluation checklist">' + ICON.x + "</button></header>" +
      '<div class="progress"><span>Progress</span><b data-eval-count></b></div><div class="bar-track"><i class="bar-fill"></i></div>' +
      '<ul class="checklist">' + rows + "</ul>", { place: "above-right", cls: "pop-eval" });
    if (!el) return;
    function paint() {
      var n = evalCount();
      $(".bar-fill", el).style.width = (n / EVAL.length * 100) + "%";
    }
    paint();
    el.addEventListener("change", function (e) {
      if (e.target.dataset.id) { evalCheck(e.target.dataset.id, e.target.checked); paint(); }
    });
  }

  /* =========================================================
     10) Welcome dialog (first visit)
     ========================================================= */
  var FEATURES = [
    ["flow", "Sequential approval workflows", "Multi-stage review with automatic routing rules."],
    ["shield", "Role-based access control", "Enforced server-side at the data layer."],
    ["spark", "AI-assisted review", "Summaries, drafted feedback & reviewer suggestions."],
    ["history", "Versioning + audit trail", "Every change tracked, fully accountable."],
    ["chart", "Analytics & ROI", "Cycle times, throughput, and program value."]
  ];
  function openWelcome() {
    var list = FEATURES.map(function (f) {
      return '<li><span class="feat-ico">' + ICON[f[0]] + "</span><div><p class=\"feat-t\">" + f[1] + "</p><p class=\"feat-b\">" + esc(f[2]) + "</p></div></li>";
    }).join("");
    var dlg = overlay(
      '<div class="dialog welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">' +
        '<button type="button" class="dlg-x corner" data-close aria-label="Close">' + ICON.x + "</button>" +
        '<p class="eyebrow">Enterprise evaluation</p>' +
        '<h2 id="welcome-title">Welcome to Posts — let\'s get moving</h2>' +
        "<p class=\"lead\">Posts replaces your trackers, review threads, and approval spreadsheets with one fast, focused workspace. Here's what powers it.</p>" +
        '<ul class="features">' + list + "</ul>" +
        '<div class="dlg-actions"><button type="button" class="btn-sm btn-sm-dark big" data-go-tour>Take the tour ' + ICON.arrow + '</button>' +
        '<button type="button" class="btn-sm btn-sm-light big" data-close>Explore on my own</button></div>' +
      "</div>", { onClose: function () { store.set("welcomed", true); } });
    $("[data-go-tour]", dlg.el).addEventListener("click", function () { dlg.close(); startTour(); });
  }

  /* =========================================================
     11) Guided tour — 7 steps, each on its own page
     ========================================================= */
  var TOUR = [
    ["index.html", "Dashboard", "Your command center. See pipeline health at a glance — active campaigns, assets awaiting approval, and overdue work — so leadership always knows where things stand."],
    ["approvals.html", "Approval Queue", "Sequential, multi-stage review with a Kanban-style queue. Reviewers approve, reject, or request changes — and can draft constructive feedback or get reviewer suggestions with AI."],
    ["team.html", "Routing Rules", "Define sequential approval workflows per asset type or campaign. Each stage routes to the right approver automatically — configure these in the Routing Rules section on this page."],
    ["calendar.html", "Content Calendar", "A month-at-a-glance view of asset deadlines and campaign windows, color-coded by approval status, so nothing slips through the cracks."],
    ["reports.html", "Analytics & ROI", "Quantify the program — approval cycle times, throughput, and the ROI & Cost Lens. The metrics enterprise buyers need to justify and optimize their investment."],
    ["team.html", "Team & RBAC", "Role-based access control with Admin, Manager, Contributor, and Reviewer roles — enforced server-side at the data layer, not just hidden in the UI."],
    ["activity.html", "Activity & Audit Trail", "A complete, immutable record of every state change — who did what and when — for full accountability and compliance."]
  ];
  var tourLayer = null;

  function startTour() { goTourStep(0); }
  function endTour() {
    store.set("tour", null);
    if (tourLayer) { var l = tourLayer; tourLayer = null; l.close(); }
  }
  function goTourStep(i) {
    store.set("tour", { step: i });
    var target = TOUR[i][0];
    if (target === PAGE) showTourCard(i);
    else location.href = target;
  }
  function showTourCard(i) {
    var step = TOUR[i], last = i === TOUR.length - 1;
    // on the Team page, show the tab the step talks about
    var teamTabs = $('[data-tabs="team"]');
    if (teamTabs) teamTabs.children[step[1] === "Routing Rules" ? 1 : 0].click();
    var html =
      '<div class="dialog tour-card" role="dialog" aria-modal="true" aria-label="' + esc(step[1]) + '">' +
        '<button type="button" class="dlg-x corner" data-skip aria-label="Skip tour" title="Skip tour">' + ICON.x + "</button>" +
        '<p class="step-n">Step ' + (i + 1) + " of " + TOUR.length + "</p>" +
        "<h3>" + esc(step[1]) + "</h3><p class=\"tour-body\">" + esc(step[2]) + "</p>" +
        '<div class="tour-dots">' + TOUR.map(function (_, k) { return '<i class="' + (k === i ? "on" : k < i ? "done" : "") + '"></i>'; }).join("") + "</div>" +
        '<div class="dlg-actions">' +
          '<button type="button" class="btn-sm btn-sm-light big" data-back' + (i === 0 ? " disabled" : "") + ">Back</button>" +
          '<button type="button" class="btn-sm btn-sm-dark big" data-next>' + (last ? "Finish" : "Next " + ICON.arrow) + "</button>" +
        "</div>" +
      "</div>";
    if (tourLayer) {   // same page: swap the card content with a quick cross-fade
      var old = tourLayer.panel, card = h(html);
      card.classList.add("swap-in");
      old.replaceWith(card);
      tourLayer.panel = card;
      bindTour(card, i);
      requestAnimationFrame(function () { card.classList.remove("swap-in"); });
      return;
    }
    tourLayer = overlay(html, { cls: "tour-layer", onClose: function () { if (tourLayer) { tourLayer = null; store.set("tour", null); } } });
    bindTour(tourLayer.panel, i);
  }
  function bindTour(card, i) {
    $("[data-skip]", card).addEventListener("click", endTour);
    $("[data-back]", card).addEventListener("click", function () { if (i > 0) goTourStep(i - 1); });
    $("[data-next]", card).addEventListener("click", function () {
      if (i === TOUR.length - 1) endTour(); else goTourStep(i + 1);
    });
  }

  /* =========================================================
     12) Calendar
     ========================================================= */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var YEAR_SHIFT = 9;   // the app is set in 2035
  function setupCalendar() {
    var grid = $("[data-cal]");
    if (!grid) return;
    var today = new Date();
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var label = $("[data-cal-label]");

    function render(dir) {
      var y = view.getFullYear(), m = view.getMonth();
      label.textContent = MONTHS[m] + " " + (y + YEAR_SHIFT);
      $$(".cal-cell", grid).forEach(function (c) { c.remove(); });

      var start = new Date(y, m, 1 - new Date(y, m, 1).getDay());
      var weeks = Math.ceil((new Date(y, m, 1).getDay() + new Date(y, m + 1, 0).getDate()) / 7);
      for (var i = 0; i < weeks * 7; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var inMonth = d.getMonth() === m;
        var isToday = d.toDateString() === today.toDateString();
        var iso = (d.getFullYear() + YEAR_SHIFT) + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        var cell = h('<div class="cal-cell' + (inMonth ? "" : " muted") + (isToday ? " today" : "") + '">' +
          (isToday ? '<div class="today-bar"><b>' + MONTHS[m] + " " + d.getDate() + "</b><span>Today</span></div>" : "<span>" + d.getDate() + "</span>") +
          '<button type="button" class="cal-add" data-day="' + iso + '" aria-label="Add to this day" title="Add to this day">+</button></div>');
        grid.appendChild(cell);
        if (!reduceMotion && dir) {
          cell.classList.add("slide-" + dir);
          cell.style.animationDelay = Math.min(i * 8, 240) + "ms";
        }
      }
    }
    render();
    grid.classList.add("cal-live");

    $("[data-cal-prev]").addEventListener("click", function () { view.setMonth(view.getMonth() - 1); render("prev"); });
    $("[data-cal-next]").addEventListener("click", function () { view.setMonth(view.getMonth() + 1); render("next"); });
    $("[data-cal-today]").addEventListener("click", function () { view = new Date(today.getFullYear(), today.getMonth(), 1); render("next"); });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cal-add");
      if (b) openForm("task", { due: b.dataset.day });
    });
  }

  /* =========================================================
     13) Reports: CSV export + ROI lens visit
     ========================================================= */
  function exportCsv() {
    var head = ["Title", "Type", "Campaign", "Assignee", "Status", "Version", "Created", "Due"];
    var blob = new Blob([head.join(",") + "\n"], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    var d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = "posts-report-" + d.toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("CSV exported");
  }
  function watchRoi() {
    var roi = $(".roi");
    if (!roi || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { evalCheck("roi_lens"); o.disconnect(); }
    }, { threshold: 0.5 });
    o.observe(roi);
  }

  /* =========================================================
     6) Tabs, selectable cards, chips + global click routing
     ========================================================= */
  function selectIn(group, btn) {
    $$("button", group).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("on", on);
      if (b.hasAttribute("aria-pressed")) b.setAttribute("aria-pressed", on);
      if (b.getAttribute("role") === "tab") b.setAttribute("aria-selected", on);
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var b;

    if ((b = t.closest("[data-dd]"))) { e.preventDefault(); openDropdown(b); return; }
    if ((b = t.closest("[data-dd-reset]"))) { resetDropdowns(b.closest(".filters, .page-actions") || document); return; }
    if ((b = t.closest("[data-open]"))) { openForm(b.dataset.open); return; }
    if ((b = t.closest('[data-pop="notif"]'))) { closeMenu(); openNotifications(b); return; }
    if ((b = t.closest('[data-pop="range"]'))) { openRange(b); return; }
    if ((b = t.closest("[data-eval]"))) { openEval(b); return; }
    if ((b = t.closest("[data-tour-start]"))) { closeMenu(); startTour(); return; }
    if ((b = t.closest("[data-export]"))) { exportCsv(); return; }
    if ((b = t.closest("[data-menu]"))) { toggleMenu(); return; }

    var tabBtn = t.closest("[data-tabs] > button");
    if (tabBtn) {
      var group = tabBtn.parentElement, name = group.dataset.tabs;
      var idx = Array.prototype.indexOf.call(group.children, tabBtn);
      selectIn(group, tabBtn);
      $$('[data-tab-panel^="' + name + ':"]').forEach(function (p) {
        var show = p.dataset.tabPanel === name + ":" + idx;
        p.hidden = !show;
        if (show && !reduceMotion) { p.classList.remove("tab-in"); void p.offsetWidth; p.classList.add("tab-in"); }
      });
      return;
    }
    var fb = t.closest("[data-filter]");
    if (fb) {
      selectIn(fb.parentElement, fb);
      var g = fb.dataset.filter;
      $$("[data-group]").forEach(function (sec) {
        var show = g === "all" || sec.dataset.group === g;
        sec.hidden = !show;
        if (show && !reduceMotion) { sec.classList.remove("tab-in"); void sec.offsetWidth; sec.classList.add("tab-in"); }
      });
      return;
    }
    var card = t.closest("[data-pick] > button, [data-chips] > button");
    if (card) selectIn(card.parentElement, card);
  });

  /* =========================================================
     Asset pipeline: hovering a column or legend item focuses it
     ========================================================= */
  function setupPipeline() {
    var box = $("[data-pipeline]");
    if (!box) return;
    function focus(i) {
      box.classList.toggle("has-focus", i !== null);
      $$("[data-i]", box).forEach(function (el) { el.classList.toggle("is-focus", el.dataset.i === i); });
    }
    box.addEventListener("pointerover", function (e) {
      var t = e.target.closest("[data-i]");
      focus(t ? t.dataset.i : null);
    });
    box.addEventListener("pointerleave", function () { focus(null); });
    // keyboard: make columns focusable too
    $$("[data-i]", box).forEach(function (el) {
      el.tabIndex = 0;
      el.addEventListener("focus", function () { focus(el.dataset.i); });
      el.addEventListener("blur", function () { focus(null); });
    });
  }

  /* =========================================================
     Portfolio: count-up numbers ([data-count] animate 0 → value when seen)
     ========================================================= */
  function setupCountUp() {
    var els = $$("[data-count]");
    if (!els.length) return;
    function run(el) {
      var to = parseFloat(el.dataset.count), pre = el.dataset.pre || "", suf = el.dataset.suf || "";
      if (reduceMotion) { el.textContent = pre + to + suf; return; }
      var t0 = null, dur = 1100;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + Math.round(to * e) + suf;
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var o = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { run(x.target); o.unobserve(x.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { o.observe(el); });
  }

  /* =========================================================
     Page change fallback
     Chrome / Edge / Safari animate page changes with View Transitions
     (see style.css). Other browsers: slide the sidebar line to the
     clicked item and fade the content out, then navigate.
     ========================================================= */
  var nativePageTransitions = "PageRevealEvent" in window;
  function setupNavFallback() {
    if (nativePageTransitions || reduceMotion) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href$='.html']");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
      if (a.getAttribute("href") === PAGE) { e.preventDefault(); return; }
      e.preventDefault();
      var ind = $(".nav-ind"), navTarget = a.closest(".nav") ? a : $('.nav a[href="' + a.getAttribute("href") + '"]');
      if (ind && navTarget && ind.offsetParent) {
        var from = ind.parentElement.getBoundingClientRect(), to = navTarget.getBoundingClientRect();
        ind.style.transform = "translateY(" + (to.top - from.top) + "px)";
      }
      document.documentElement.classList.add("leaving");
      setTimeout(function () { location.href = a.href; }, 230);
    });
    // coming back with the browser's Back button: undo the fade
    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) {
        document.documentElement.classList.remove("leaving");
        var ind = $(".nav-ind"); if (ind) ind.style.transform = "";
      }
    });
  }

  /* =========================================================
     14) Mobile menu
     ========================================================= */
  function toggleMenu(force) {
    var open = typeof force === "boolean" ? force : !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", open);
    var b = $("[data-menu]");
    if (b) { b.setAttribute("aria-expanded", open); b.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
  }
  function closeMenu() { if (document.body.classList.contains("menu-open")) toggleMenu(false); }

  /* =========================================================
     Init
     ========================================================= */
  function init() {
    setupReveal();
    setupPhysics();
    setupCalendar();
    setupPipeline();
    setupNavFallback();
    setupCountUp();
    if (PAGE === "reports.html") watchRoi();
    evalCount();

    if (!IS_APP) return;
    var tour = store.get("tour", null);
    if (tour && TOUR[tour.step]) {
      if (TOUR[tour.step][0] === PAGE) setTimeout(function () { showTourCard(tour.step); }, 350);
      else store.set("tour", null);
    } else if (!store.get("welcomed", false)) {
      setTimeout(openWelcome, 600);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

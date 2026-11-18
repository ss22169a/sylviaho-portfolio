/* MEMS carousel: animate each slide when it scrolls into view; arrow buttons page the row. */
(function () {
  var deck = document.querySelector("[data-mems]");
  if (!deck) return;
  var row = deck.querySelector(".ms-track-row");
  var slides = [].slice.call(deck.querySelectorAll(".ms"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(el) {
    var to = +el.dataset.to, t0 = null, dur = 1500;
    if (reduce) { el.textContent = to.toLocaleString("en-US"); return; }
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * k).toLocaleString("en-US");
      if (k < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 600);
  }

  function play(s) {
    if (s.classList.contains("on")) return;
    s.classList.add("on");
    var n = s.querySelector("[data-to]");
    if (n) countUp(n);
  }

  if (!("IntersectionObserver" in window)) { slides.forEach(play); }
  else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) play(e.target); });
    }, { root: null, threshold: 0.55 });
    slides.forEach(function (s) { io.observe(s); });
  }

  deck.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ms]");
    if (!b) return;
    var w = slides[0].getBoundingClientRect().width + 9;
    row.scrollBy({ left: +b.dataset.ms * w, behavior: reduce ? "auto" : "smooth" });
  });
})();

/* DM anatomy viewer: highlight a section of the page from the list. */
(function () {
  var v = document.querySelector("[data-dm]");
  if (!v) return;
  var steps = [].slice.call(v.querySelectorAll(".dm-step")), pinned = null;
  function show(z) {
    if (z) v.dataset.on = z; else delete v.dataset.on;
    steps.forEach(function (s) { s.classList.toggle("on", s.dataset.z === z); });
  }
  steps.forEach(function (s) {
    s.addEventListener("mouseenter", function () { show(s.dataset.z); });
    s.addEventListener("mouseleave", function () { show(pinned); });
    s.addEventListener("click", function () { pinned = pinned === s.dataset.z ? null : s.dataset.z; show(pinned); });
  });
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var i = 0, timer = null;
    new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.isIntersecting && !timer && !pinned) {
          timer = setInterval(function () {
            if (pinned || v.matches(":hover")) return;
            show(steps[i % steps.length].dataset.z); i++;
            if (i > steps.length) { clearInterval(timer); show(null); }
          }, 1400);
        }
      });
    }, { threshold: 0.5 }).observe(v);
  }
})();

/* Ad-ops alert demo: slide in when visible, dismiss, re-appear after a pause */
(function () {
  var d = document.querySelector('.al-demo'); if (!d) return;
  var x = d.querySelector('.al-x'), t;
  function show() { d.classList.remove('gone'); d.classList.add('show'); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(show, 400); o.disconnect(); } }); }, { threshold: 0.6 }).observe(d);
  } else { show(); }
  x.addEventListener('click', function () { d.classList.add('gone'); clearTimeout(t); t = setTimeout(show, 4000); });
})();

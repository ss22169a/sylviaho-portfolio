/* Ad-CTR model on the search-dilemma page: blended CTR as AI Overview coverage changes. */
(function () {
  var m = document.querySelector("[data-sx]");
  if (!m) return;
  var a = +m.dataset.a, n = +m.dataset.n, l = +m.dataset.l;
  var r = m.querySelector("input"), q = function (s) { return m.querySelector(s); };
  function upd() {
    var s = r.value / 100, b = s * a + (1 - s) * n, c = s * a * l + (1 - s) * n;
    q("[data-sx-s]").textContent = r.value + "%";
    q("[data-sx-b]").textContent = b.toFixed(1) + "%";
    q("[data-sx-l]").textContent = ((1 - b / n) * 100).toFixed(1) + "%";
    q("[data-sx-c]").textContent = c.toFixed(1) + "%";
    r.style.setProperty("--p", r.value + "%");
  }
  r.addEventListener("input", upd); upd();
})();

// Lifecycle matrix: hover / focus tooltip for scatter points
(function () {
  var wrap = document.querySelector('.lc-wrap');
  if (!wrap) return;
  var tip = wrap.querySelector('.lc-tip');
  function show(el) {
    var parts = (el.getAttribute('data-tip') || '').split(' | ');
    tip.innerHTML = '<b>' + parts[0] + '</b>' + parts.slice(1).map(function (p) { return '<span>' + p + '</span>'; }).join('');
    var r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    var x = r.left + r.width / 2 - w.left, y = r.top - w.top;
    tip.style.left = Math.min(Math.max(x, 130), w.width - 130) + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('on');
  }
  function hide() { tip.classList.remove('on'); }
  wrap.querySelectorAll('.lc-pt').forEach(function (el) {
    el.addEventListener('mouseenter', function () { show(el); });
    el.addEventListener('focus', function () { show(el); });
    el.addEventListener('mouseleave', hide);
    el.addEventListener('blur', hide);
  });
})();

/* Market Watch map: click/tap/Enter zooms to a market and shows its narrative; Esc or "World view" resets. No deps. */
(function () {
  "use strict";
  var svg = document.querySelector(".mw-svg"), panel = document.getElementById("mw-panel");
  if (!svg || !panel) return;
  var reset = document.querySelector(".mw-reset"), full = svg.getAttribute("data-vb").split(" ").map(Number);
  var world = (svg.getAttribute("data-world") || svg.getAttribute("data-vb")).split(" ").map(Number);  // zoom may go anywhere on the world
  var cur = full.slice(), raf = null, active = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function setVB(v) {
    cur = v; svg.setAttribute("viewBox", v.map(function (n) { return n.toFixed(1); }).join(" "));
    var cw = svg.getBoundingClientRect().width || full[2], k = v[2] / cw;  // labels keep a constant on-screen size
    all(".mw-lab").forEach(function (g) { g.setAttribute("transform", "translate(" + g.getAttribute("data-x") + "," + g.getAttribute("data-y") + ") scale(" + k.toFixed(3) + ")"); });
  }
  function animate(to) {
    if (raf) cancelAnimationFrame(raf);
    if (reduce) { setVB(to); return; }
    var from = cur.slice(), t0 = null, D = 550;
    function step(t) {
      t0 = t0 || t; var p = Math.min(1, (t - t0) / D), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setVB(from.map(function (a, i) { return a + (to[i] - a) * e; }));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }
  function target(code) {
    var g = svg.querySelector('.mw-mk[data-m="' + code + '"]'), b = g && g.getAttribute("data-bbox");
    if (!b) return full.slice();
    b = b.split(",").map(Number);
    var w = b[2] - b[0], h = b[3] - b[1], cx = b[0] + w / 2, cy = b[1] + h / 2, ar = full[2] / full[3];
    var small = w < 40 && h < 40;                       // small markets (KR, TH, PH…) get more context around them
    w = Math.max(w * (small ? 2.6 : 1.7), small ? 150 : 130); h = Math.max(h * (small ? 2.6 : 1.7), (small ? 150 : 130) / ar);
    if (w / h > ar) h = w / ar; else w = h * ar;
    w = Math.min(w, world[2]); h = Math.min(h, world[3]);
    var x = Math.max(world[0], Math.min(world[0] + world[2] - w, cx - w / 2)), y = Math.max(world[1], Math.min(world[1] + world[3] - h, cy - h / 2));
    return [x, y, w, h];
  }
  function mark(code) {
    all("[data-m]").forEach(function (el) {
      var on = el.getAttribute("data-m") === code;
      el.classList.toggle("on", on);
      if (el.classList.contains("mw-mk")) el.setAttribute("aria-pressed", on ? "true" : "false");
      if (el.classList.contains("mw-chip")) { if (on) el.setAttribute("aria-current", "true"); else el.removeAttribute("aria-current"); }
    });
  }
  function select(code, opts) {
    opts = opts || {};
    active = code; mark(code); panel.classList.add("has"); svg.classList.add("zoomed");
    if (reset) reset.hidden = false;
    animate(target(code));
    var art = document.getElementById("m-" + code);
    if (art && opts.focus) art.focus({ preventScroll: true });
    if (opts.scroll && window.innerWidth <= 900 && art) {
      var r = panel.getBoundingClientRect();
      if (r.top > window.innerHeight * .75 || r.bottom < 80) panel.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    if (history.replaceState) history.replaceState(null, "", "#m-" + code);
  }
  function clear(focusBack) {
    var was = active; active = null; mark(null); panel.classList.remove("has"); svg.classList.remove("zoomed");
    if (reset) reset.hidden = true;
    animate(full.slice());
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (focusBack && was) { var g = svg.querySelector('.mw-mk[data-m="' + was + '"]'); if (g) g.focus(); }
  }
  all(".mw-mk").forEach(function (g) {
    g.setAttribute("aria-pressed", "false");
    g.addEventListener("click", function () { select(g.getAttribute("data-m"), { scroll: true }); });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); select(g.getAttribute("data-m"), { focus: false }); }
    });
  });
  all(".mw-chip, .mw-rank a").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); select(a.getAttribute("data-m"), { scroll: true, focus: true }); });
  });
  if (reset) reset.addEventListener("click", function () { clear(false); });
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && active) {
      var np = document.querySelector(".rp-navpanel"); if (np && !np.hidden) return; // the Pages menu handles its own Esc
      clear(true);
    }
  });
  window.addEventListener("resize", function () { setVB(cur); });
  setVB(cur);
  var m = /^#m-([A-Z]{2})$/.exec(location.hash);
  if (m && document.getElementById("m-" + m[1])) { reduce = true; select(m[1]); reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
})();

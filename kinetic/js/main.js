/* ============================================================
   KINETIC — vanilla JS, zero dependencies.
   Modular, guard-claused inits.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav ---------- */
  function initMobileNav() {
    var nav = document.getElementById("mainNav");
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!nav || !toggle || !links) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- sticky header shadow ---------- */
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("scrolled", window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- schedule day tabs ---------- */
  function initScheduleTabs() {
    var tablist = document.querySelector(".sched__tabs");
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) {
          panel.classList.toggle("is-active", selected);
          if (selected) { panel.removeAttribute("hidden"); }
          else { panel.setAttribute("hidden", ""); }
        }
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var idx = i;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { idx = (i + 1) % tabs.length; }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { idx = (i - 1 + tabs.length) % tabs.length; }
        else if (e.key === "Home") { idx = 0; }
        else if (e.key === "End") { idx = tabs.length - 1; }
        else { return; }
        e.preventDefault();
        activate(tabs[idx], true);
      });
    });
  }

  /* ---------- animated stat counters ---------- */
  function initCounters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      if (isNaN(target)) return;
      if (reduceMotion) { el.textContent = target.toLocaleString("en-US"); return; }
      var start = null;
      var dur = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(target * eased);
        el.textContent = val.toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString("en-US");
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- results filter ---------- */
  function initFilter() {
    var group = document.querySelector(".filters");
    var grid = document.getElementById("resultsGrid");
    if (!group || !grid) return;
    var buttons = Array.prototype.slice.call(group.querySelectorAll(".filter"));
    var items = Array.prototype.slice.call(grid.querySelectorAll(".result"));

    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      var f = btn.getAttribute("data-filter");
      buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      items.forEach(function (item) {
        var show = f === "all" || item.getAttribute("data-category") === f;
        item.classList.toggle("is-hidden", !show);
      });
    });
  }

  /* ---------- diet plan tabs ---------- */
  function initDietPlanTabs() {
    var wrap = document.querySelector(".diet-plan__wrapper");
    if (!wrap) return;
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll(".diet-plan__tab"));
    var panels = Array.prototype.slice.call(wrap.querySelectorAll(".diet-plan__panel"));
    if (!tabs.length || !panels.length) return;

    function activate(index) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", selected ? "true" : "false");
      });
      panels.forEach(function (panel, i) {
        var selected = i === index;
        panel.classList.toggle("is-active", selected);
        panel.setAttribute("aria-hidden", selected ? "false" : "true");
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(i); });
    });
  }

  /* ---------- attendance log ---------- */
  function initAttendanceLog() {
    var form = document.getElementById("attendanceForm");
    var list = document.getElementById("attendanceList");
    if (!form || !list) return;

    var storageKey = "arushFitStudioAttendance";
    var today = new Date();
    var todayValue = today.toISOString().split("T")[0];
    var dateInput = document.getElementById("visitDate");
    if (dateInput) dateInput.value = todayValue;

    function readEntries() {
      try {
        var raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function writeEntries(entries) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(entries));
      } catch (e) {
        // ignore storage issues in private browsing or restricted environments
      }
    }

    function formatDuration(inTime, outTime) {
      if (!inTime) return "No time logged";
      if (!outTime) return "Still in gym";

      var inParts = inTime.split(":").map(Number);
      var outParts = outTime.split(":").map(Number);
      var startMinutes = inParts[0] * 60 + inParts[1];
      var endMinutes = outParts[0] * 60 + outParts[1];
      var diff = Math.max(0, endMinutes - startMinutes);
      var hours = Math.floor(diff / 60);
      var minutes = diff % 60;
      return hours + "h " + minutes + "m";
    }

    function renderEntries() {
      var entries = readEntries();
      if (!entries.length) {
        list.innerHTML = '<li class="attendance__empty">No member check-ins yet.</li>';
        return;
      }

      list.innerHTML = entries.slice().reverse().map(function (entry) {
        var outValue = entry.outTime ? entry.outTime : "—";
        var duration = formatDuration(entry.inTime, entry.outTime);
        return '<li class="attendance__item">' +
          '<div class="attendance__meta"><strong>' + (entry.name || "Member") + '</strong><span>' + entry.date + ' · ' + entry.inTime + ' to ' + outValue + '</span></div>' +
          '<span class="attendance__duration">' + duration + '</span>' +
        '</li>';
      }).join("");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var memberName = document.getElementById("memberName").value.trim();
      var visitDate = document.getElementById("visitDate").value;
      var inTime = document.getElementById("inTime").value;
      var outTime = document.getElementById("outTime").value;

      if (!memberName || !visitDate || !inTime) {
        return;
      }

      var entries = readEntries();
      entries.push({
        id: Date.now(),
        name: memberName,
        date: visitDate,
        inTime: inTime,
        outTime: outTime || ""
      });
      writeEntries(entries);
      form.reset();
      if (dateInput) dateInput.value = todayValue;
      renderEntries();
    });

    renderEntries();
  }

  /* ---------- testimonial rotator ---------- */
  function initTestimonials() {
    var wrap = document.querySelector(".testis");
    if (!wrap) return;
    var slides = Array.prototype.slice.call(wrap.querySelectorAll(".testi"));
    var dots = Array.prototype.slice.call(wrap.querySelectorAll(".testi-dot"));
    if (slides.length < 2) return;
    var current = 0;
    var timer = null;

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === current); });
    }
    function next() { show(current + 1); }

    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      timer = window.setInterval(next, 6500);
    }
    function stopAuto() { if (timer) { window.clearInterval(timer); timer = null; } }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); startAuto(); });
    });
    wrap.addEventListener("mouseenter", stopAuto);
    wrap.addEventListener("mouseleave", startAuto);
    wrap.addEventListener("focusin", stopAuto);

    startAuto();
  }

  /* ---------- boot ---------- */
  function boot() {
    initMobileNav();
    initHeaderScroll();
    initScheduleTabs();
    initCounters();
    initReveal();
    initFilter();
    initDietPlanTabs();
    initAttendanceLog();
    initTestimonials();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

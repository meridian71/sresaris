/* CRESARIS GROUP — i18n + interactions. No dependencies. */
(function () {
  "use strict";

  var LANGS = ["ru", "en", "kk"];
  var DEFAULT_LANG = "ru";
  var DICT = window.__CRESARIS_I18N__ || { ru: {}, en: {}, kk: {} };
  var lang = DEFAULT_LANG;

  // Mark that scripting is available: the reveal animation only hides
  // elements when it can also reveal them again.
  document.documentElement.classList.add("js");

  function dictValue(key) {
    return (DICT[lang] && DICT[lang][key]) || "";
  }

  function applyLang(next) {
    lang = LANGS.indexOf(next) === -1 ? DEFAULT_LANG : next;
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);

    // Every switchable element carries all three languages; the build
    // refuses to emit a page where one of them is missing.
    document.querySelectorAll("[data-ru][data-en][data-kk]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang);
      if (v !== null && v !== "") el.textContent = v;
    });

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n-placeholder"));
      if (v) el.setAttribute("placeholder", v);
    });

    // Accessible names follow the language too.
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n-aria"));
      if (v) el.setAttribute("aria-label", v);
    });

    // The page title, the description and the social preview follow the
    // language as well.
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n-title"));
      if (v) document.title = v;
    });
    document.querySelectorAll("[data-i18n-desc]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n-desc"));
      if (v) el.setAttribute("content", v);
    });
    document.querySelectorAll("[data-i18n-content]").forEach(function (el) {
      var v = dictValue(el.getAttribute("data-i18n-content"));
      if (v) el.setAttribute("content", v);
    });

    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      var on = b.getAttribute("data-set-lang") === lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set-lang]");
    if (!b) return;
    applyLang(b.getAttribute("data-set-lang"));
    try { history.replaceState(null, "", "?lang=" + lang); } catch (err) {}
  });

  var m = /[?&]lang=(ru|en|kk)/.exec(location.search);
  applyLang(m ? m[1] : DEFAULT_LANG);

  /* ------------------------------------------------------------ reveal */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 })
    : null;

  if (io) {
    reveals.forEach(function (el, i) {
      el.style.setProperty("--d", (i % 6) * 60 + "ms");
      io.observe(el);
    });
  }

  /* Geometric backstop. The IntersectionObserver is the primary mechanism,
     but content must never depend on it: if it does not fire (background
     tab, exotic engine, print) the reveal is performed by measuring
     element rectangles instead. Runs throttled on scroll and resize. */
  var ticking = false;
  function geometricReveal() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      if (el.classList.contains("is-in")) continue;
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) {
        el.classList.add("is-in");
        if (io) io.unobserve(el);
      }
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      geometricReveal();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  window.addEventListener("load", geometricReveal);
  geometricReveal();

  /* ------------------------------------------------------------ current nav */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") + ".html" === here) a.setAttribute("aria-current", "page");
  });

  /* ------------------------------------------------------------ card flip */
  var toggle = document.querySelector("[data-card-toggle]");
  var card = document.querySelector(".card");
  if (toggle && card) {
    var FLIP = {
      ru: { front: "Показать лицевую", back: "Показать оборот" },
      en: { front: "Show front", back: "Show reverse" },
      kk: { front: "Алдыңғы жағын көрсету", back: "Артқы жағын көрсету" }
    };
    toggle.addEventListener("click", function () {
      var flipped = card.classList.toggle("is-flipped");
      toggle.setAttribute("aria-pressed", flipped ? "true" : "false");
      var words = FLIP[lang] || FLIP.ru;
      var text = flipped ? words.front : words.back;
      toggle.textContent = text;
      LANGS.forEach(function (l) {
        toggle.setAttribute("data-" + l, FLIP[l][flipped ? "front" : "back"]);
      });
    });
  }
})();

/* Kacper — trener personalny: interakcje strony (wersja demonstracyjna, bez backendu) */
(function () {
  'use strict';

  var root = document.body.getAttribute('data-root') || '';
  var P = window.PRODUCTS || {};
  var ORDER_KEY = 'kt_order';
  var LAST_KEY = 'kt_last_order';

  /* ---------- helpers ---------- */
  function store(kind) {
    try { return kind === 'session' ? window.sessionStorage : window.localStorage; } catch (e) { return null; }
  }
  function read(key, fallback, kind) {
    var s = store(kind);
    if (!s) return fallback;
    try { var v = JSON.parse(s.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function write(key, val, kind) {
    var s = store(kind);
    if (!s) return;
    try { s.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  var fmtInt = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 });
  function money(v) { return fmtInt.format(v); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ICONS = {
    check: '<path d="M5 12l5 5L20 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-10-1 10-4 16-10 16"/><path d="M4 21c4-6 8-9 12-11"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  function icon(n, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[n] + '</svg>';
  }
  var CHECK_ANIM = '<div class="check-anim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>';

  function coverHtml(p) {
    if (p.kind === 'service') {
      return '<div class="cover cover--phone" aria-hidden="true"><div class="mini-phone"><div class="mini-phone__screen">' +
        '<div class="bubble bubble--in">Jak poszedł dziś trening?</div><div class="bubble bubble--out">Rekord w przysiadzie! 💪</div>' +
        '<div class="mini-phone__bar"><span></span>Raport tygodniowy</div></div></div></div>';
    }
    return '<div class="cover cover--' + p.tone + '" aria-hidden="true"><div class="cover__sheet cover__sheet--back"></div><div class="cover__sheet">' +
      '<span class="cover__tag">PDF</span><span class="cover__ico">' + icon(p.icon) + '</span><b class="cover__title">' + p.cover[0] + '</b>' +
      '<span class="cover__meta">' + p.cover[1] + '</span><span class="cover__brand">KACPER<i>.</i></span></div></div>';
  }

  /* ---------- designer notes (demo only): pink tags that show the client what we will replace ---------- */
  var PEN = '<svg class="dn__pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var CAM = '<svg class="dn__pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>';
  var SQUIGGLE = '<svg class="dn__arrow" viewBox="0 0 38 34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 3c3 9 10 12 16 13s11 5 12 14"/><path d="M26 25l6 6 3-8"/></svg>';
  $$('[data-note]').forEach(function (el) {
    var kind = el.getAttribute('data-note-kind') || 'text';
    var pos = el.getAttribute('data-note-pos') || 'tl';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var tag = document.createElement('kt-note');
    tag.className = 'dn dn--' + pos;
    tag.setAttribute('aria-hidden', 'true');
    tag.innerHTML = (kind === 'photo' ? CAM : PEN) + esc(el.getAttribute('data-note')) + SQUIGGLE;
    el.appendChild(tag);
    if (kind === 'photo') ['tl', 'tr', 'bl', 'br'].forEach(function (c) {
      var s = document.createElement('kt-corner');
      s.className = 'dn-c dn-c--' + c;
      el.appendChild(s);
    });
  });
  function notesLabel() {
    var on = document.documentElement.classList.contains('dn-on');
    $$('[data-notes-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var l = $('[data-notes-label]', b);
      if (l) l.textContent = on ? 'Notatki: wł.' : 'Notatki: wył.';
    });
  }
  $$('[data-notes-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var on = document.documentElement.classList.toggle('dn-on');
      try { localStorage.setItem('kt_notes', on ? 'on' : 'off'); } catch (e) {}
      notesLabel();
    });
  });
  notesLabel();

  /* ---------- theme ---------- */
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') || 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  });

  /* ---------- header & drawer ---------- */
  var header = $('.header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var drawer = $('.drawer');
  var burger = $('.burger');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  $$('[data-drawer-close]').forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });
  if (drawer) $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* ---------- reveal & counters ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.hasAttribute('data-count')) countUp(en.target);
      if (en.target.classList.contains('ba')) hintSlider(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observe(el) { if (io) io.observe(el); else el.classList.add('in'); }
  $$('[data-reveal], [data-count]').forEach(observe);
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (el.getAttribute('data-suffix') || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- before / after sliders ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setPos(ba, v) {
    v = Math.max(0, Math.min(100, v));
    ba.style.setProperty('--pos', v + '%');
    var r = $('.ba__range', ba);
    if (r) r.value = Math.round(v);
  }
  function hintSlider(ba) {
    if (reduce || ba.dataset.touched) return;
    var keys = [[0, 50], [500, 28], [1100, 72], [1700, 50]], t0 = null;
    function step(t) {
      if (ba.dataset.touched) return;
      if (!t0) t0 = t;
      var e = t - t0, i = 0;
      while (i < keys.length - 1 && e > keys[i + 1][0]) i++;
      if (i >= keys.length - 1) { setPos(ba, 50); return; }
      var a = keys[i], b = keys[i + 1], k = (e - a[0]) / (b[0] - a[0]);
      k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setPos(ba, a[1] + (b[1] - a[1]) * k);
      requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 350);
  }
  $$('.ba').forEach(function (ba) {
    observe(ba);
    var range = $('.ba__range', ba);
    var drag = false;
    function fromEvent(e) {
      var rect = ba.getBoundingClientRect();
      setPos(ba, (e.clientX - rect.left) / rect.width * 100);
    }
    range.addEventListener('input', function () { ba.dataset.touched = 1; setPos(ba, +range.value); });
    ba.addEventListener('pointerdown', function (e) { ba.dataset.touched = 1; drag = true; ba.classList.add('is-drag'); fromEvent(e); });
    ba.addEventListener('pointermove', function (e) { if (drag) fromEvent(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { ba.addEventListener(ev, function () { drag = false; ba.classList.remove('is-drag'); }); });
  });

  /* ---------- swipe rails on phones: dots under horizontal card lists ---------- */
  var rails = [];
  $$('.rail').forEach(function (rail) {
    var items = Array.prototype.slice.call(rail.children);
    if (items.length < 2) return;
    var dots = document.createElement('div');
    dots.className = 'rail-dots';
    var btns = items.map(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Pokaż ' + (i + 1) + ' z ' + items.length);
      b.addEventListener('click', function () {
        var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
        rail.scrollTo({ left: it.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft - pad, behavior: 'smooth' });
      });
      dots.appendChild(b);
      return b;
    });
    rail.parentNode.insertBefore(dots, rail.nextSibling);
    function update() {
      var pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0, x0 = rail.getBoundingClientRect().left + pad, best = -1, bestD = 1e9;
      items.forEach(function (it, i) {
        btns[i].hidden = it.hidden;
        if (it.hidden) return;
        var d = Math.abs(it.getBoundingClientRect().left - x0);
        if (d < bestD) { bestD = d; best = i; }
      });
      btns.forEach(function (b, i) { b.classList.toggle('on', i === best); });
    }
    var raf = 0;
    rail.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
    rails.push(update);
  });

  /* ---------- metamorphoses filter ---------- */
  var mgrid = $('[data-meta-grid]');
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-filter]').forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.getAttribute('data-filter');
      $$('[data-goal]', mgrid).forEach(function (el) { el.hidden = f !== 'all' && el.getAttribute('data-goal') !== f; });
      mgrid.scrollLeft = 0;
      rails.forEach(function (u) { u(); });
    });
  });

  /* ---------- quiz ---------- */
  var GOAL_LABEL = { redukcja: 'Redukcja', masa: 'Masa i siła', forma: 'Lepsza kondycja' };
  $$('[data-quiz]').forEach(function (qz) {
    var ans = {};
    var dots = $$('.quiz__dots span', qz);
    var res = $('[data-result]', qz);
    function show(n) {
      $$('.quiz__q', qz).forEach(function (q) { q.classList.toggle('is-active', q.getAttribute('data-q') === String(n)); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i < n); });
    }
    function result() {
      $$('.quiz__q', qz).forEach(function (q) { q.classList.remove('is-active'); });
      dots.forEach(function (d) { d.classList.add('on'); });
      var html;
      if (ans[1] === 'torun') {
        write('kt_goal', GOAL_LABEL[ans[2]], 'session');
        html = '<div class="quiz__rec"><div class="cover cover--dark" aria-hidden="true"><div class="cover__sheet cover__sheet--back"></div><div class="cover__sheet"><span class="cover__tag">TORUŃ</span><span class="cover__ico">' + icon('pin') + '</span><b class="cover__title">Trening<br>1-na-1</b><span class="cover__meta">lub w parze</span><span class="cover__brand">KACPER<i>.</i></span></div></div>' +
          '<div><small>Polecam Ci</small><h3>Treningi ze mną w Toruniu</h3><p>Cel: ' + esc(GOAL_LABEL[ans[2]]).toLowerCase() + '. Zacznijmy od bezpłatnej konsultacji — oddzwonię w ciągu 24 h.</p></div>' +
          '<div class="quiz__rec-btns"><a class="btn btn--accent btn--lg" href="' + root + 'index.html#konsultacja" data-goto-lead>Umów konsultację ' + icon('arrow', 'arr') + '</a><button class="quiz__again" type="button">Zacznij od nowa</button></div></div>';
      } else {
        var id = ans[3] === 'opieka' ? 'prowadzenie-online' : (window.QUIZ_REC || {})[ans[2]] || 'pakiet-trening-dieta';
        var p = P[id];
        var why = id === 'prowadzenie-online' ? 'Indywidualny plan i korekty co tydzień — najszybsza droga do celu bez trenera na sali.' :
          id === 'plan-treningowy' ? 'Do budowy mięśni najważniejszy jest dobrze ułożony trening z progresją.' :
          'Przy tym celu najlepiej działa połączenie treningu i diety — w pakiecie taniej niż osobno.';
        html = '<div class="quiz__rec">' + coverHtml(p) + '<div><small>Polecam Ci</small><h3>' + esc(p.name) + '</h3><p>' + why + '</p></div>' +
          '<div class="quiz__rec-btns"><a class="btn btn--accent btn--lg" href="' + root + p.url + '">' + (p.kind === 'service' ? 'od ' : '') + money(p.from) + ' — zobacz ' + icon('arrow', 'arr') + '</a><button class="quiz__again" type="button">Zacznij od nowa</button></div></div>';
      }
      res.innerHTML = html;
      res.hidden = false;
      var again = $('.quiz__again', res);
      if (again) again.addEventListener('click', function () { ans = {}; res.hidden = true; show(1); });
      var go = $('[data-goto-lead]', res);
      if (go) go.addEventListener('click', presetGoal);
    }
    $$('.quiz__q button', qz).forEach(function (b) {
      b.addEventListener('click', function () {
        var q = +b.closest('.quiz__q').getAttribute('data-q');
        ans[q] = b.getAttribute('data-a');
        if (q === 1) show(2);
        else if (q === 2) { if (ans[1] === 'torun') result(); else show(3); }
        else result();
      });
    });
  });

  /* ---------- lead form (3 steps) ---------- */
  function presetGoal() {
    var g = read('kt_goal', null, 'session');
    if (!g) return;
    $$('[data-lead] input[name="cel"]').forEach(function (i) { if (i.value === g) i.checked = true; });
  }
  presetGoal();
  $$('[data-lead]').forEach(function (form) {
    var step = 1;
    var bar = $('[data-lead-bar]', form), no = $('[data-step-no]', form);
    function go(n) {
      step = n;
      $$('.lead__pane', form).forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-pane') === String(n)); });
      bar.style.width = (n / 3 * 100) + '%';
      no.textContent = n;
    }
    function nudge() { form.classList.remove('is-error'); void form.offsetWidth; form.classList.add('is-error'); }
    $$('input[name="cel"]', form).forEach(function (i) { i.addEventListener('change', function () { setTimeout(function () { go(2); }, 260); }); });
    $$('[data-lead-back]', form).forEach(function (b) { b.addEventListener('click', function () { go(Math.max(1, step - 1)); }); });
    $('[data-lead-next]', form).addEventListener('click', function () {
      if (!$('input[name="forma"]:checked', form)) return nudge();
      go(3);
      var f = $('input[name="imie"]', form); if (f) f.focus({ preventScroll: true });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!$('input[name="cel"]:checked', form)) return go(1), nudge();
      if (!$('input[name="forma"]:checked', form)) return go(2), nudge();
      var ok = true;
      $$('.field', form).forEach(function (fl) {
        var inp = $('input', fl);
        var bad = !inp.checkValidity();
        fl.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      var zg = $('input[name="zgoda"]', form);
      zg.closest('.check').classList.toggle('invalid', !zg.checked);
      if (!zg.checked) ok = false;
      if (!ok) return;
      var name = $('input[name="imie"]', form).value.trim();
      var cel = $('input[name="cel"]:checked', form).value, forma = $('input[name="forma"]:checked', form).value;
      form.innerHTML = '<div class="done-msg">' + CHECK_ANIM + '<h3>Dzięki, ' + esc(name) + '!</h3>' +
        '<p>Oddzwonię w ciągu 24 godzin, żeby umówić bezpłatną konsultację.<br><b>Cel:</b> ' + esc(cel) + ' · <b>Forma:</b> ' + esc(forma) + '</p>' +
        '<p class="note">Wersja demonstracyjna — zgłoszenie nie zostało wysłane. W wersji docelowej trafi na Twój e-mail i telefon.</p></div>';
    });
    $$('input', form).forEach(function (inp) {
      inp.addEventListener('input', function () { var f = inp.closest('.field'); if (f && inp.checkValidity()) f.classList.remove('invalid'); });
      inp.addEventListener('change', function () { var c = inp.closest('.check'); if (c && inp.checked) c.classList.remove('invalid'); });
    });
  });

  /* ---------- product page: variants & buy ---------- */
  function priceOf(id, opts) {
    var p = P[id], price = null;
    p.groups.forEach(function (g) {
      g.options.forEach(function (o) { if (o.v === opts[g.key] && o.price != null) price = o.price; });
    });
    return price == null ? p.from : price;
  }
  function optLabels(id, opts) {
    var out = [];
    P[id].groups.forEach(function (g) {
      g.options.forEach(function (o) { if (o.v === opts[g.key]) out.push(o.label); });
    });
    return out.join(' · ');
  }
  var buy = $('[data-buy]');
  if (buy) {
    var pid = buy.getAttribute('data-buy');
    function opts() {
      var o = {};
      P[pid].groups.forEach(function (g) { var c = $('input[name="' + g.key + '"]:checked', buy); o[g.key] = c ? c.value : g.options[0].v; });
      return o;
    }
    function updatePrice() {
      var v = money(priceOf(pid, opts()));
      $$('[data-price]').forEach(function (el) {
        if (el.textContent === v) return;
        el.textContent = v;
        el.classList.remove('price-bump'); void el.offsetWidth; el.classList.add('price-bump');
      });
    }
    buy.addEventListener('change', updatePrice);
    buy.addEventListener('submit', function (e) {
      e.preventDefault();
      write(ORDER_KEY, { lines: [{ id: pid, opts: opts() }] }, 'session');
      location.href = root + 'zamowienie.html';
    });
    var mb = $('[data-buy-submit]');
    if (mb) mb.addEventListener('click', function () { buy.requestSubmit ? buy.requestSubmit() : buy.dispatchEvent(new Event('submit', { cancelable: true })); });
  }

  /* ---------- checkout ---------- */
  var co = $('[data-checkout]');
  if (co) {
    var form = $('#checkout-form');
    var sum = $('#co-summary');
    var order = read(ORDER_KEY, null, 'session');
    var DEFAULTS = { miejsce: 'silownia', kcal: '2200' };
    var lines = (order && order.lines || []).filter(function (l) { return P[l.id]; });
    if (!lines.length) {
      co.innerHTML = '<div class="empty-state"><h2>Nie wybrano produktu</h2><p>Wybierz plan lub prowadzenie online, aby złożyć zamówienie.</p><a class="btn btn--accent btn--lg" href="' + root + 'oferta.html#online">Zobacz ofertę</a></div>';
    } else {
      var bumped = false;
      var original = lines.slice();
      var bumpable = lines.length === 1 && (lines[0].id === 'plan-treningowy' || lines[0].id === 'plan-zywieniowy');
      function kind() { return lines.some(function (l) { return P[l.id].kind === 'service'; }) ? 'service' : 'pdf'; }
      function total() { return lines.reduce(function (s, l) { return s + priceOf(l.id, l.opts); }, 0); }
      function render() {
        var items = lines.map(function (l) {
          var p = P[l.id];
          return '<div class="sum-item"><div class="sum-item__media">' + coverHtml(p) + '</div><div><b>' + esc(p.name) + '</b><small>' + esc(optLabels(l.id, l.opts)) + '</small>' +
            '<small>' + (p.kind === 'service' ? 'Ankieta startowa na e-mail od razu' : 'PDF na e-mail od razu po płatności') + '</small></div>' +
            '<span class="sum-item__price">' + money(priceOf(l.id, l.opts)) + '</span></div>';
        }).join('');
        var bump = '';
        if (bumpable) {
          var pak = P['pakiet-trening-dieta'];
          var diff = priceOf('pakiet-trening-dieta', {}) - priceOf(original[0].id, original[0].opts);
          bump = '<label class="bump"><input type="checkbox" data-bump' + (bumped ? ' checked' : '') + '><span><b>Zamień na ' + esc(pak.name) + '</b> — dopłacasz tylko ' + money(diff) + ' i dostajesz też ' +
            (original[0].id === 'plan-treningowy' ? 'plan żywieniowy' : 'plan treningowy') + '.</span></label>';
        }
        var t = total();
        sum.innerHTML = '<h2>Twoje zamówienie</h2>' + items + bump +
          '<div class="summary__row"><span>Dostawa</span><b>e-mail · 0 zł</b></div>' +
          '<div class="summary__row summary__total"><span>Do zapłaty</span><b>' + money(t) + '</b></div>' +
          '<button class="btn btn--accent btn--lg btn--block" type="submit" form="checkout-form">' + icon('lock') + ' Kupuję i płacę ' + money(t) + '</button>' +
          '<p class="summary__note">' + icon('lock') + '<span>Klikając, składasz zamówienie z obowiązkiem zapłaty. Płatność obsługuje Autopay. Cena jest ceną końcową.</span></p>';
        var mini = $('#co-mini');
        if (mini) mini.innerHTML = items;
        $$('[data-co-total]').forEach(function (el) { el.textContent = money(t); });
        var k = kind();
        $('[data-consent="digital"]', form).hidden = k !== 'pdf';
        $('[data-consent="service"]', form).hidden = k !== 'service';
        $('#phone').required = k === 'service';
        $('[data-phone-req]', form).textContent = k === 'service' ? '*' : '(opcjonalnie)';
      }
      sum.addEventListener('change', function (e) {
        if (!e.target.hasAttribute('data-bump')) return;
        bumped = e.target.checked;
        if (bumped) {
          var o = original[0].opts;
          lines = [{ id: 'pakiet-trening-dieta', opts: { miejsce: o.miejsce || DEFAULTS.miejsce, kcal: o.kcal || DEFAULTS.kcal } }];
        } else lines = original.slice();
        render();
      });
      render();
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        $$('.field', form).forEach(function (f) {
          var inp = $('input', f);
          var bad = !inp.checkValidity();
          f.classList.toggle('invalid', bad);
          if (bad) ok = false;
        });
        $$('[data-consent]', form).forEach(function (c) {
          if (c.hidden) { c.classList.remove('invalid'); return; }
          var on = $('input', c).checked;
          c.classList.toggle('invalid', !on);
          if (!on) ok = false;
        });
        if (!ok) {
          var first = $('.invalid', form);
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        var d = new Date();
        var no = 'KT-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
        var pay = $('input[name="pay"]:checked', form).closest('.opt').querySelector('b').textContent;
        write(LAST_KEY, { no: no, lines: lines, total: total(), pay: pay, kind: kind(), name: form.elements.firstname.value.trim(), email: form.elements.email.value.trim() }, 'session');
        write(ORDER_KEY, null, 'session');
        location.href = root + 'potwierdzenie.html';
      });
      $$('input', form).forEach(function (inp) {
        inp.addEventListener('input', function () { var f = inp.closest('.field'); if (f && inp.checkValidity()) f.classList.remove('invalid'); });
        inp.addEventListener('change', function () { var c = inp.closest('[data-consent]'); if (c && inp.checked) c.classList.remove('invalid'); });
      });
    }
  }

  /* ---------- confirmation ---------- */
  var conf = $('#confirm-root');
  if (conf) {
    var o = read(LAST_KEY, null, 'session');
    if (o) {
      $('[data-c-title]', conf).textContent = 'Dziękuję, ' + o.name + '!';
      $('[data-c-lead]', conf).innerHTML = 'Zamówienie <b>' + esc(o.no) + '</b> opłacone (' + esc(o.pay) + '). Potwierdzenie wysłałem na <b>' + esc(o.email) + '</b>.';
      var rows = o.lines.filter(function (l) { return P[l.id]; }).map(function (l) {
        var p = P[l.id];
        return '<div class="summary__row"><span>' + esc(p.name) + '<br><small>' + esc(optLabels(l.id, l.opts)) + '</small></span><b>' + money(priceOf(l.id, l.opts)) + '</b></div>';
      }).join('');
      var next = o.kind === 'service'
        ? '<ol class="next"><li><span><b>Sprawdź e-mail</b><span>Wysłałem ankietę startową: cel, zdrowie, sprzęt i grafik.</span></span></li><li><span><b>Wypełnij ankietę</b><span>Zajmie Ci około 10 minut.</span></span></li><li><span><b>Plan w 3 dni robocze</b><span>Dostaniesz plan i zaproszenie na czat.</span></span></li></ol>'
        : '<a class="btn btn--accent btn--lg btn--block" href="#" data-demo-dl>' + icon('download') + ' Pobierz plan (PDF)</a><p class="note">Link do pobrania jest też w e-mailu. W wersji demonstracyjnej plik nie jest pobierany.</p>' +
          '<ol class="next"><li><span><b>Zapisz plik</b><span>Na telefonie lub komputerze — link działa 30 dni.</span></span></li><li><span><b>Przeczytaj wstęp</b><span>Wyjaśniam, jak zacząć i jak notować postępy.</span></span></li><li><span><b>Pierwszy trening</b><span>Najlepiej jeszcze w tym tygodniu!</span></span></li></ol>';
      var box = $('[data-c-box]', conf);
      box.innerHTML = '<h2>Twoje zamówienie</h2>' + rows + '<div class="summary__row summary__total"><span>Zapłacono</span><b>' + money(o.total) + '</b></div>' + next;
      box.hidden = false;
      var dl = $('[data-demo-dl]', box);
      if (dl) dl.addEventListener('click', function (e) { e.preventDefault(); dl.textContent = 'Wersja demo — plik nie jest pobierany'; });
    }
  }

  /* ---------- sticky mobile bar ---------- */
  var mbar = $('[data-mbar]');
  if (mbar) {
    document.body.classList.add('has-mbar');
    var hideFor = $('.buybox') || $('.hero') || $('.page-head') || $('.page-hero');
    var finalCta = mbar.getAttribute('data-hide-when') ? $(mbar.getAttribute('data-hide-when')) : $('.final-cta');
    var heroVisible = true, finalVisible = false;
    function upd() { mbar.classList.toggle('show', !heroVisible && !finalVisible); }
    if ('IntersectionObserver' in window) {
      if (hideFor) new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; upd(); }).observe(hideFor);
      else heroVisible = false;
      if (finalCta) new IntersectionObserver(function (en) { finalVisible = en[0].isIntersecting; upd(); }).observe(finalCta);
    } else { heroVisible = false; }
    upd();
  }

  /* ---------- cookies ---------- */
  var cookies = $('.cookies');
  if (cookies) {
    if (!read('kt_cookies', null)) setTimeout(function () { cookies.classList.add('show'); }, 900);
    $$('[data-cookies]', cookies).forEach(function (b) {
      b.addEventListener('click', function () {
        write('kt_cookies', { choice: b.getAttribute('data-cookies'), at: Date.now() });
        cookies.classList.remove('show');
      });
    });
    $$('[data-cookies-open]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); cookies.classList.add('show'); }); });
  }
})();

/* ======================================================
   Hero: зациклена анімація «Шаблони» в мок-браузері.
   Курсор обирає картку → шаблон розкривається на весь «екран» →
   кілька секунд прокрутки вниз → назад до списку → наступний шаблон.
   Шаблони беруться з розмітки (li.tpl-show__card в index.html),
   тож новий шаблон додається одним <li> — скрипт правити не треба.
   ====================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-tpl-show]');
  if (!root) return;

  var body    = root.querySelector('.tpl-show__body');
  var list    = root.querySelector('.tpl-show__list');
  var cards   = Array.prototype.slice.call(root.querySelectorAll('.tpl-show__card'));
  var view    = root.querySelector('.tpl-show__view');
  var viewImg = view.querySelector('img');
  var cursor  = root.querySelector('.tpl-show__cursor');
  var urlEl   = root.querySelector('[data-tpl-url]');
  var countEl = root.querySelector('[data-tpl-count]');
  var homeUrl = urlEl.textContent;

  if (countEl) countEl.textContent = plural(cards.length);
  if (!cards.length || !view.animate) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var EASE = 'cubic-bezier(.45,0,.2,1)';

  /* --- Пауза, коли блок поза екраном або вкладка прихована --- */
  var visible = false;
  var waiters = [];
  function active() { return visible && !document.hidden; }
  function wake() { if (active()) waiters.splice(0).forEach(function (r) { r(); }); }
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    wake();
  }, { threshold: 0.25 }).observe(root);
  document.addEventListener('visibilitychange', wake);

  function ready() {
    return active() ? Promise.resolve() : new Promise(function (r) { waiters.push(r); });
  }
  function step(ms) {
    return new Promise(function (r) { setTimeout(r, ms); }).then(ready);
  }

  /* --- Геометрія відносно «екрана» браузера --- */
  function rel(el) {
    var a = el.getBoundingClientRect();
    var b = body.getBoundingClientRect();
    return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
  }
  function moveCursor(x, y) {
    cursor.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }

  // Якщо шаблонів більше, ніж влазить, — докручуємо список до потрібної картки.
  function reveal(card) {
    var top = card.offsetTop;
    var bottom = top + card.offsetHeight;
    var target = null;
    if (top < list.scrollTop + 40) target = Math.max(0, top - 54);
    else if (bottom > list.scrollTop + list.clientHeight - 12) target = bottom - list.clientHeight + 16;
    if (target === null) return false;
    var from = list.scrollTop;
    var start = performance.now();
    (function frame(now) {
      var p = Math.min(1, (now - start) / 500);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      list.scrollTop = from + (target - from) * e;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
    return true;
  }

  /* --- Картка → повний розмір (FLIP: масштаб + висота під пропорції мініатюри) --- */
  function startFrame(card) {
    var t = rel(card.querySelector('.tpl-show__thumb'));
    var s = t.w / body.clientWidth;
    return {
      transform: 'translate(' + t.x + 'px,' + t.y + 'px) scale(' + s + ')',
      height: (t.h / s) + 'px',
      borderRadius: (10 / s) + 'px'
    };
  }
  function frames() {
    return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  }

  // Заздалегідь (поки курсор їде до картки) кладемо шаблон у «вікно» невидимим
  // поверх мініатюри: браузер встигає декодувати й відмалювати велику картинку,
  // і в момент відкриття немає білого екрана.
  async function prime(card, img) {
    var src = img.currentSrc || img.src;
    if (viewImg.getAttribute('src') !== src) viewImg.src = src;
    try { await viewImg.decode(); } catch (e) {}
    var f = startFrame(card);
    view.style.transform = f.transform;
    view.style.height = f.height;
    view.style.borderRadius = f.borderRadius;
    view.style.opacity = '0';
    view.style.visibility = 'visible';
    await frames();
  }

  function open(card) {
    var from = startFrame(card);
    from.opacity = 1;
    root.classList.add('is-open');
    view.style.opacity = '1';
    return view.animate([
      from,
      { transform: 'translate(0px,0px) scale(1)', height: body.clientHeight + 'px',
        borderRadius: '0px', opacity: 1 }
    ], { duration: 650, easing: EASE, fill: 'forwards' }).finished;
  }

  function resetView() {
    view.getAnimations().forEach(function (a) { a.cancel(); });
    viewImg.getAnimations().forEach(function (a) { a.cancel(); });
    view.style.cssText = '';
  }

  function scrollDown() {
    var max = viewImg.offsetHeight - body.clientHeight;
    var dist = Math.max(0, Math.min(max, body.clientHeight * 2.4));
    return viewImg.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(' + -dist + 'px)' }
    ], { duration: 3800, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished;
  }

  function close() {
    root.classList.remove('is-open');
    return view.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 400, easing: 'ease', fill: 'forwards'
    }).finished.then(resetView);
  }

  async function run() {
    await ready();
    root.classList.add('is-running');
    moveCursor(body.clientWidth * 0.8, body.clientHeight * 0.85);
    await step(900);

    for (var i = 0; ; i = (i + 1) % cards.length) {
      var card = cards[i];
      var img = card.querySelector('img');

      if (reveal(card)) await step(600);

      var t = rel(card.querySelector('.tpl-show__thumb'));
      moveCursor(t.x + t.w * 0.55, t.y + t.h * 0.5);
      await Promise.all([prime(card, img), step(850)]);

      card.classList.add('is-hover');
      await step(250);
      cursor.classList.add('is-click');
      card.classList.add('is-pressed');
      await step(170);
      cursor.classList.remove('is-click');
      card.classList.remove('is-pressed');
      await ready();
      await frames();   // після повернення на вкладку даємо браузеру домалювати кадр

      cursor.style.opacity = '0';
      urlEl.textContent = card.getAttribute('data-url') || homeUrl;
      await open(card);
      card.classList.remove('is-hover');

      await step(500);
      await scrollDown();
      await step(700);

      urlEl.textContent = homeUrl;
      await close();
      cursor.style.opacity = '';
      await step(450);
    }
  }

  function plural(n) {
    var m10 = n % 10, m100 = n % 100;
    var word = (m10 === 1 && m100 !== 11) ? 'шаблон'
      : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? 'шаблони'
      : 'шаблонів';
    return n + ' ' + word;
  }

  run();
})();

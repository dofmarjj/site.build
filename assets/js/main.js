/* ===================================================
   Tagwise — main.js
   - Прелоадер
   - Мобільне меню
   - FAQ-акордеон
   - Розгортання детального прайсу
   - Відправка форми через fetch
   - Кнопка «вгору»
   =================================================== */

/* ---- Прелоадер (запускається відразу, до DOMContentLoaded) ---- */
(function () {
  var el      = document.getElementById('tw-preloader');
  if (!el) return;
  var MIN_SHOW = 1200;  // мінімум показу — щоб анімація відіграла
  var MAX_SHOW = 6000;  // страховка на випадок довгого завантаження
  var start   = Date.now();
  var hidden  = false;

  function hide() {
    if (hidden) return;
    hidden = true;
    var wait = Math.max(0, MIN_SHOW - (Date.now() - start));
    setTimeout(function () {
      el.classList.add('is-done');
      setTimeout(function () { el.style.display = 'none'; }, 500);
    }, wait);
  }

  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
  setTimeout(hide, MAX_SHOW);
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Мобільне меню ---- */
  const navToggle = document.getElementById('nav-toggle');
  const siteNav   = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open', !expanded);
    });

    // Закрити при кліку на посилання
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
      });
    });

    // Закрити при кліку поза меню
    document.addEventListener('click', e => {
      if (!navToggle.contains(e.target) && !siteNav.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
      }
    });
  }

  /* ---- FAQ-акордеон ---- */
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const panelId    = trigger.getAttribute('aria-controls');
      const panel      = document.getElementById(panelId);

      // Закрити всі інші
      document.querySelectorAll('.faq-trigger').forEach(t => {
        if (t !== trigger) {
          t.setAttribute('aria-expanded', 'false');
          const p = document.getElementById(t.getAttribute('aria-controls'));
          if (p) p.setAttribute('aria-hidden', 'true');
        }
      });

      trigger.setAttribute('aria-expanded', String(!isExpanded));
      if (panel) panel.setAttribute('aria-hidden', String(isExpanded));
    });
  });

  /* ---- Розгортання детального прайсу ---- */
  document.querySelectorAll('.price-details-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const target   = document.getElementById(targetId);
      if (!target) return;

      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      target.classList.toggle('is-open', !isOpen);
    });
  });

  /* ---- Форма заявки ---- */
  const form      = document.getElementById('lead-form');
  const msgEl     = document.getElementById('form-msg');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const name    = form.querySelector('#f-name').value.trim();
      const what    = form.querySelector('#f-what').value.trim();
      const contact = form.querySelector('#f-contact').value.trim();
      const agree   = form.querySelector('#f-agree').checked;
      const hp      = form.querySelector('#f-hp').value;

      if (!name || !what || !contact) {
        showMsg('error', 'Будь ласка, заповніть усі поля.');
        return;
      }
      if (!agree) {
        showMsg('error', 'Підтвердіть згоду з умовами оферти.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Надсилаємо…';
      clearMsg();

      try {
        const res = await fetch('/api/lead.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, what, contact, agree, hp }),
        });

        const data = await res.json();

        if (data.ok) {
          form.reset();
          showMsg('success', 'Заявку надіслано! Відповімо протягом робочого дня.');
        } else {
          showMsg('error', data.error || 'Щось пішло не так. Спробуйте ще раз або напишіть нам у Telegram.');
        }
      } catch (err) {
        showMsg('error', 'Не вдалося надіслати заявку. Перевірте з’єднання з мережею.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Надіслати заявку';
      }
    });
  }

  function showMsg(type, text) {
    if (!msgEl) return;
    msgEl.className = 'form-message is-' + type;
    msgEl.textContent = text;
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function clearMsg() {
    if (!msgEl) return;
    msgEl.className = 'form-message';
    msgEl.textContent = '';
  }

  /* ---- Кнопка «вгору» ---- */
  const scrollBtn = document.createElement('button');
  scrollBtn.className = 'scroll-top';
  scrollBtn.setAttribute('aria-label', 'Прокрутити на початок');
  scrollBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
  document.body.appendChild(scrollBtn);

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('is-visible', window.scrollY > 320);
  }, { passive: true });

});

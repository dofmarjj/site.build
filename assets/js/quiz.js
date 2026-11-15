/* ===================================================
   Tagwise — quiz.js
   Квіз «Підберемо рішення за 30 секунд»
   Відкривається через data-quiz="start|nosite|hassite"
   =================================================== */
(function () {
  'use strict';

  // ── Ціни (єдине джерело — відповідає прайсу на сайті) ──
  const PRICES = {
    marketplace: { label: 'Синхронізація з маркетплейсами', price: 200, monthly: 30 },
    excel:       { label: 'Імпорт цін і залишків з Excel',  price: 100 },
    tg_notif:    { label: 'Сповіщення в Telegram',           price: 70  },
    nova_poshta: { label: 'Нова Пошта (ТТН)',                price: 260 },
    online_pay:  { label: 'Онлайн-оплата',                   price: 130 },
    tg_bot:      { label: 'Telegram-бот',                    price: 320, isFrom: true },
  };

  const TEMPLATES = {
    'Зоотовари':    { name: 'Лапка',      tag: 'ЗОО', link: 'demos/lapka/index.html' },
    'Будматеріали': { name: 'БудМайстер', tag: 'БУД', link: 'demos/budmaster/index.html' },
    'Квіти':        { name: 'Квіти',      tag: 'КВТ', link: 'demos/kvity/index.html' },
  };

  // ── Стан ──
  let st = {
    steps: ['root'],
    cur: 0,
    startFrom: 0,
    answers: {},
  };

  // ── Визначення кроків ──
  const DEFS = {
    root: {
      q: 'Що у вас зараз?',
      type: 'single',
      choices: ['Сайту ще немає', 'Сайт уже є', 'Просто дивлюсь'],
    },
    ns_what: {
      q: 'Що продаєте?',
      type: 'single',
      choices: ['Зоотовари', 'Будматеріали', 'Квіти', 'Одяг і взуття', 'Косметика', 'Інше'],
    },
    ns_where: {
      q: 'Де зараз продаєте?',
      type: 'single',
      choices: ['Ще ніде', 'Instagram або Telegram', 'Prom або Rozetka', 'Офлайн-магазин'],
    },
    ns_count: {
      q: 'Скільки товарів планується?',
      type: 'single',
      choices: ['До 20', '20–100', 'Понад 100'],
    },
    hs_need: {
      q: 'Що потрібно?',
      type: 'single',
      choices: [
        { label: 'Автоматизувати',  desc: 'ціни, залишки, замовлення' },
        { label: 'Доробити сайт',   desc: 'дизайн, функції, сторінки' },
        { label: 'І те, і те',      desc: '' },
      ],
    },
    hs_where: {
      q: 'Де продаєте?',
      hint: 'Оберіть усі відповідні варіанти',
      type: 'multi',
      choices: ['Prom', 'Rozetka', 'Instagram або Telegram', 'Свій сайт', 'Офлайн'],
    },
    hs_time: {
      q: 'Що забирає найбільше часу?',
      hint: 'Оберіть усі відповідні варіанти',
      type: 'multi',
      choices: [
        'Оновлення цін і залишків',
        'Переписування замовлень',
        'Оформлення ТТН',
        'Прийом оплати',
        'Відповіді клієнтам',
      ],
    },
    hs_platform: {
      q: 'На чому ваш сайт?',
      type: 'single',
      choices: ['Horoshop', 'Prom', 'WordPress', 'Інше'],
    },
    hs_fix: {
      q: 'Що потрібно доробити?',
      hint: 'Оберіть усі відповідні варіанти',
      type: 'multi',
      choices: ['Дизайн', 'Нові сторінки', 'Оплата і доставка', 'Швидкість', 'Інше'],
    },
  };

  // ── GA4 ──
  function track(event, params) {
    if (typeof gtag === 'function') gtag('event', event, params || {});
  }

  // ── Відкрити/закрити квіз ──
  function openQuiz(branch) {
    const qz = document.getElementById('qz');
    if (!qz) return;

    st.steps   = ['root'];
    st.cur     = 0;
    st.answers = {};

    if (branch === 'nosite') {
      st.answers.root = 'Сайту ще немає';
      st.steps = ['root', 'ns_what', 'ns_where', 'ns_count', 'result'];
      st.cur = 1;
      st.startFrom = 1;
    } else if (branch === 'hassite') {
      st.answers.root = 'Сайт уже є';
      st.steps = ['root', 'hs_need'];
      st.cur = 1;
      st.startFrom = 1;
    } else {
      st.startFrom = 0;
    }

    sessionStorage.setItem('qz_opened', '1');
    qz.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    track('quiz_open', { from: branch || 'start' });

    renderStep();
  }

  function closeQuiz() {
    const qz = document.getElementById('qz');
    if (!qz) return;
    qz.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ── Обробка вибору ──
  function handleSelect(stepKey, value) {
    const def = DEFS[stepKey];
    if (!def) return;

    if (def.type === 'multi') {
      const cur = Array.isArray(st.answers[stepKey]) ? st.answers[stepKey] : [];
      const idx = cur.indexOf(value);
      st.answers[stepKey] = idx === -1 ? [...cur, value] : cur.filter(v => v !== value);
      renderStep();
      return;
    }

    st.answers[stepKey] = value;

    if (stepKey === 'root') {
      if (value === 'Просто дивлюсь') { closeQuiz(); return; }
      st.steps = value === 'Сайту ще немає'
        ? ['root', 'ns_what', 'ns_where', 'ns_count', 'result']
        : ['root', 'hs_need'];
    }

    if (stepKey === 'hs_need') {
      const idx = st.steps.indexOf('hs_need');
      st.steps = st.steps.slice(0, idx + 1);
      if (value === 'Автоматизувати') {
        st.steps.push('hs_where', 'hs_time', 'result');
      } else if (value === 'Доробити сайт') {
        st.steps.push('hs_platform', 'hs_fix', 'result');
      } else {
        st.steps.push('hs_where', 'hs_time', 'hs_platform', 'hs_fix', 'result');
      }
    }

    // Показати вибір, не просуватись автоматично
    renderStep();
  }

  function nextStep() {
    st.cur++;
    track('quiz_step', { step: st.steps[st.cur], step_num: st.cur });
    renderStep();
  }

  function prevStep() {
    if (st.cur <= st.startFrom) {
      if (st.startFrom > 0) closeQuiz();
      return;
    }
    st.cur--;
    renderStep();
  }

  // ── Рендер кроку ──
  function renderStep() {
    const body = document.getElementById('qz-body');
    const bar  = document.getElementById('qz-bar');
    if (!body) return;

    const isResult = st.steps[st.cur] === 'result';
    const nonResult = st.steps.filter(s => s !== 'result');
    const visCount  = nonResult.length - st.startFrom;
    const dispNum   = st.cur - st.startFrom + 1;
    const progress  = isResult ? 100 : Math.round((dispNum / (visCount + 1)) * 100);
    if (bar) bar.style.width = progress + '%';

    if (isResult) { renderResult(body); return; }

    const stepKey = st.steps[st.cur];
    const def = DEFS[stepKey];
    if (!def) return;

    const isMulti  = def.type === 'multi';
    const curAns   = st.answers[stepKey] !== undefined ? st.answers[stepKey] : (isMulti ? [] : null);
    const hasBack  = st.cur > 0;
    const hasAns   = isMulti ? (Array.isArray(curAns) && curAns.length > 0) : (curAns !== null && curAns !== undefined);
    const totalStr = st.steps.includes('result') ? ` з ${visCount}` : '';

    body.innerHTML = `
      <div class="qz__step">
        <div>
          <div class="qz__meta">Питання ${dispNum}${totalStr}</div>
          <div class="qz__q">${def.q}</div>
          ${def.hint ? `<div class="qz__hint-text">${def.hint}</div>` : ''}
        </div>
        <div class="qz__choices" id="qz-choices"></div>
        <div class="qz__nav">
          ${hasBack ? `<button class="qz__back" id="qz-back">← Назад</button>` : ''}
          <button class="btn btn--primary" id="qz-next" style="margin-left:auto"${hasAns ? '' : ' disabled'}>Далі →</button>
        </div>
      </div>`;

    const choicesEl = document.getElementById('qz-choices');
    def.choices.forEach(ch => {
      const label      = typeof ch === 'string' ? ch : ch.label;
      const desc       = typeof ch === 'object' && ch.desc ? ch.desc : '';
      const isSelected = isMulti ? curAns.includes(label) : curAns === label;

      const btn = document.createElement('button');
      btn.className = 'qz__choice' + (isSelected ? ' is-selected' : '');
      btn.innerHTML = `
        <span class="qz__choice-mark">${isSelected
          ? '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : ''}</span>
        <span>
          <span style="display:block;font-weight:500">${label}</span>
          ${desc ? `<span class="qz__choice-desc">${desc}</span>` : ''}
        </span>`;
      btn.addEventListener('click', () => handleSelect(stepKey, label));
      choicesEl.appendChild(btn);
    });

    document.getElementById('qz-back')?.addEventListener('click', prevStep);
    document.getElementById('qz-next')?.addEventListener('click', nextStep);
  }

  // ── Результати ──
  function renderResult(body) {
    st.answers.root === 'Сайту ще немає' ? renderResultA(body) : renderResultB(body);
  }

  function renderResultA(body) {
    const niche = st.answers.ns_what || '';
    const count = st.answers.ns_count || '';
    const where = st.answers.ns_where || '';
    const tmpl  = TEMPLATES[niche] || null;

    const notes = [];
    if (count === 'Понад 100')       notes.push('Понад 100 товарів → рекомендуємо власний домен від $10/міс');
    if (where === 'Prom або Rozetka') notes.push('Продаєте на Prom/Rozetka → перенесемо товари, імпорт $100');

    body.innerHTML = `
      <div class="qz__result">
        <div>
          <div class="qz__meta">Готово!</div>
          <div class="qz__result-title">Вам підійде безкоштовний магазин</div>
          <div class="qz__result-sub">Запустимо за 3–5 днів на нашому хостингу. Платити не потрібно.</div>
        </div>

        ${tmpl ? `
        <div class="qz__tmpl">
          <div class="qz__tmpl-icon">${tmpl.tag}</div>
          <div>
            <div style="font-weight:600;font-size:15px">Шаблон «${tmpl.name}»</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:4px">готовий шаблон під вашу нішу</div>
            <a href="${tmpl.link}" target="_blank" rel="noopener" style="font-size:13px;color:var(--green)">Переглянути приклад →</a>
          </div>
        </div>` : ''}

        <div class="qz__includes">
          <div class="qz__inc-row"><span>✓ Шаблон під вашу нішу</span><strong style="color:var(--green)">$0</strong></div>
          <div class="qz__inc-row"><span>✓ Хостинг і адреса на нашому домені</span><strong style="color:var(--green)">$0</strong></div>
          <div class="qz__inc-row"><span>✓ Ваш логотип, тексти, до 20 товарів</span><strong style="color:var(--green)">$0</strong></div>
        </div>

        ${notes.length ? `<div class="qz__notes">${notes.map(n => `<div class="qz__note">→ ${n}</div>`).join('')}</div>` : ''}

        <div class="qz__contact-wrap">
          <div style="font-weight:600;font-size:15px">Залишіть контакт — надішлемо приклад під вашу нішу</div>
          <input class="qz__input" id="qz-contact" type="text" placeholder="@username або +380…" autocomplete="tel">
          <label class="qz__checkbox"><input type="checkbox" id="qz-agree"> Погоджуюся з умовами <a href="offer.html">публічної оферти</a></label>
          <div class="qz__msg" id="qz-msg"></div>
          <button class="btn btn--accent btn--lg" id="qz-submit" style="width:100%">Отримати безкоштовний сайт</button>
        </div>

        <button class="qz__back" id="qz-back">← Назад</button>
      </div>`;

    document.getElementById('qz-submit')?.addEventListener('click', () => submitLead('nosite'));
    document.getElementById('qz-back')?.addEventListener('click', prevStep);
  }

  function renderResultB(body) {
    const pains     = st.answers.hs_time    || [];
    const whereList = st.answers.hs_where   || [];
    const need      = st.answers.hs_need    || '';
    const hasFix    = need === 'Доробити сайт' || need === 'І те, і те';
    const hasMarket = whereList.some(w => w === 'Prom' || w === 'Rozetka');

    const matched = [];
    if (pains.includes('Оновлення цін і залишків')) {
      matched.push(hasMarket
        ? { label: PRICES.marketplace.label, priceStr: `$${PRICES.marketplace.price}`, extra: `+$${PRICES.marketplace.monthly}/міс` }
        : { label: PRICES.excel.label,       priceStr: `$${PRICES.excel.price}` });
    }
    if (pains.includes('Переписування замовлень')) matched.push({ label: PRICES.tg_notif.label,    priceStr: `$${PRICES.tg_notif.price}` });
    if (pains.includes('Оформлення ТТН'))          matched.push({ label: PRICES.nova_poshta.label, priceStr: `$${PRICES.nova_poshta.price}` });
    if (pains.includes('Прийом оплати'))           matched.push({ label: PRICES.online_pay.label,  priceStr: `$${PRICES.online_pay.price}` });
    if (pains.includes('Відповіді клієнтам'))      matched.push({ label: PRICES.tg_bot.label,      priceStr: `від $${PRICES.tg_bot.price}` });
    if (hasFix) matched.push({ label: 'Доробка сайту', priceStr: 'після аудиту', price: 0 });

    let oneoff = 0, monthly = 0;
    if (pains.includes('Оновлення цін і залишків') && hasMarket) { oneoff += PRICES.marketplace.price; monthly += PRICES.marketplace.monthly; }
    else if (pains.includes('Оновлення цін і залишків'))          { oneoff += PRICES.excel.price; }
    if (pains.includes('Переписування замовлень')) oneoff += PRICES.tg_notif.price;
    if (pains.includes('Оформлення ТТН'))          oneoff += PRICES.nova_poshta.price;
    if (pains.includes('Прийом оплати'))           oneoff += PRICES.online_pay.price;
    if (pains.includes('Відповіді клієнтам'))      oneoff += PRICES.tg_bot.price;

    let totalStr = oneoff > 0 ? `$${oneoff}` : '';
    if (monthly > 0) totalStr += ` + $${monthly}/міс`;
    const showTotal = matched.length > 1 && oneoff > 0;

    body.innerHTML = `
      <div class="qz__result">
        <div>
          <div class="qz__meta">Готово!</div>
          <div class="qz__result-title">${matched.length ? 'Ось що підійде під ваші задачі' : 'Підберемо рішення особисто'}</div>
          <div class="qz__result-sub">Усі послуги — фіксована ціна наперед.</div>
        </div>

        ${matched.length ? `
        <div class="qz__services">
          ${matched.map(s => `
          <div class="qz__svc">
            <span class="qz__svc-label">${s.label}</span>
            <div class="qz__svc-price">${s.priceStr}${s.extra ? `<span class="qz__svc-extra">${s.extra}</span>` : ''}</div>
          </div>`).join('')}
        </div>
        ${showTotal ? `<div class="qz__total"><span>Орієнтовно:</span><span>${totalStr}</span></div>` : ''}
        ` : ''}

        <div class="qz__contact-wrap">
          <div style="font-weight:600;font-size:15px">Залишіть контакт — проведемо безкоштовний аудит</div>
          <input class="qz__input" id="qz-contact" type="text" placeholder="@username або +380…" autocomplete="tel">
          <label class="qz__checkbox"><input type="checkbox" id="qz-agree"> Погоджуюся з умовами <a href="offer.html">публічної оферти</a></label>
          <div class="qz__msg" id="qz-msg"></div>
          <button class="btn btn--accent btn--lg" id="qz-submit" style="width:100%">Записатися на безкоштовний аудит</button>
        </div>

        <button class="qz__back" id="qz-back">← Назад</button>
      </div>`;

    document.getElementById('qz-submit')?.addEventListener('click', () => submitLead('hassite'));
    document.getElementById('qz-back')?.addEventListener('click', prevStep);
  }

  // ── Відправка заявки ──
  function getUtm() {
    const p = new URLSearchParams(window.location.search);
    return { utm_source: p.get('utm_source') || '', utm_medium: p.get('utm_medium') || '', utm_campaign: p.get('utm_campaign') || '' };
  }

  async function submitLead(branch) {
    const contactEl = document.getElementById('qz-contact');
    const agreeEl   = document.getElementById('qz-agree');
    const msgEl     = document.getElementById('qz-msg');
    const submitBtn = document.getElementById('qz-submit');
    if (!contactEl || !agreeEl || !msgEl || !submitBtn) return;

    const contact = contactEl.value.trim();
    if (contact.length < 3) { showMsg(msgEl, 'error', 'Вкажіть Telegram або телефон.'); return; }
    if (!agreeEl.checked)   { showMsg(msgEl, 'error', 'Підтвердіть згоду з умовами.'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Надсилаємо…';
    showMsg(msgEl, '', '');

    const pains     = st.answers.hs_time  || [];
    const whereList = st.answers.hs_where || [];
    const hasMarket = whereList.some(w => w === 'Prom' || w === 'Rozetka');
    const services  = [];
    if (pains.includes('Оновлення цін і залишків')) services.push(hasMarket ? `${PRICES.marketplace.label} $${PRICES.marketplace.price} + $${PRICES.marketplace.monthly}/міс` : `${PRICES.excel.label} $${PRICES.excel.price}`);
    if (pains.includes('Переписування замовлень')) services.push(`${PRICES.tg_notif.label} $${PRICES.tg_notif.price}`);
    if (pains.includes('Оформлення ТТН'))          services.push(`${PRICES.nova_poshta.label} $${PRICES.nova_poshta.price}`);
    if (pains.includes('Прийом оплати'))           services.push(`${PRICES.online_pay.label} $${PRICES.online_pay.price}`);
    if (pains.includes('Відповіді клієнтам'))      services.push(`${PRICES.tg_bot.label} від $${PRICES.tg_bot.price}`);

    const lead = { source: 'quiz', branch, contact, agree: true, answers: st.answers, services, ...getUtm() };

    let sent = false;

    // Спробуємо PHP-бекенд
    try {
      const res  = await fetch('/api/lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) sent = true;
      }
    } catch (_) {}

    // Фоллбек: прямий Telegram Bot API
    if (!sent && window.__TG) {
      try {
        const text = window.__TG.formatQuiz(branch, st.answers, services, contact);
        const r = await window.__TG.send(text);
        if (r && r.ok) sent = true;
      } catch (_) {}
    }

    if (sent) {
      track('lead_submit', { branch, source: 'quiz' });
      showMsg(msgEl, 'success', '✓ Заявку надіслано! Відповімо протягом робочого дня.');
      contactEl.disabled = true;
      agreeEl.disabled   = true;
      submitBtn.style.display = 'none';
    } else {
      showMsg(msgEl, 'error', 'Щось пішло не так. Спробуйте ще раз або напишіть нам у Telegram.');
      resetBtn(submitBtn, branch);
    }
  }

  function showMsg(el, type, text) {
    el.className = type ? 'qz__msg is-' + type : 'qz__msg';
    el.textContent = text;
  }
  function resetBtn(btn, branch) {
    btn.disabled = false;
    btn.textContent = branch === 'nosite' ? 'Отримати безкоштовний сайт' : 'Записатися на безкоштовний аудит';
  }

  // ── Плаваюча підказка ──
  function initHint() {
    const hint = document.getElementById('qz-hint');
    if (!hint) return;
    if (sessionStorage.getItem('qz_opened') || sessionStorage.getItem('qz_hint')) return;

    setTimeout(() => {
      if (sessionStorage.getItem('qz_opened')) return;
      hint.hidden = false;
      sessionStorage.setItem('qz_hint', '1');
    }, 20000);

    hint.querySelector('.qz-hint__close')?.addEventListener('click', () => { hint.hidden = true; });
  }

  // ── Ініціалізація ──
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-quiz]');
      if (!el) return;
      e.preventDefault();
      const val = el.dataset.quiz;
      openQuiz(val === 'start' ? null : val);
    });

    const qzEl = document.getElementById('qz');
    qzEl?.querySelector('.qz__backdrop')?.addEventListener('click', closeQuiz);
    qzEl?.querySelector('.qz__close')?.addEventListener('click', closeQuiz);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeQuiz(); });

    initHint();
  });

})();

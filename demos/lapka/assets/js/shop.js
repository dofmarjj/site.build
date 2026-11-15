/* ============================================================
   Лапка — Зоомагазин | shop.js
   ============================================================ */

(function () {
  'use strict';

  /* ---- Sticky header shadow ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---- Mobile menu ---- */
  const hamburger  = document.querySelector('.hamburger');
  const mobileNav  = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    // close on nav link click
    mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ---- Product gallery thumbnails ---- */
  const thumbs = document.querySelectorAll('.gallery-thumb');
  if (thumbs.length) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        // In a real implementation, swap the main image src here
        const mainPlaceholder = document.querySelector('.gallery-placeholder span:first-child');
        if (mainPlaceholder) {
          mainPlaceholder.textContent = thumb.textContent;
        }
      });
    });
  }

  /* ---- Product tabs ---- */
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (tabBtns.length) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ---- Quantity buttons ---- */
  document.querySelectorAll('.qty-wrap').forEach(wrap => {
    const minus = wrap.querySelector('.qty-btn--minus');
    const plus  = wrap.querySelector('.qty-btn--plus');
    const input = wrap.querySelector('.qty-input');
    if (!minus || !plus || !input) return;
    minus.addEventListener('click', () => {
      const val = parseInt(input.value, 10);
      if (val > 1) input.value = val - 1;
    });
    plus.addEventListener('click', () => {
      const val = parseInt(input.value, 10);
      input.value = val + 1;
    });
    input.addEventListener('change', () => {
      const val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) input.value = 1;
    });
  });

  /* ---- Weight / size selector ---- */
  document.querySelectorAll('.weight-options').forEach(group => {
    group.querySelectorAll('.weight-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.weight-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  });

  /* ---- Toast notifications ---- */
  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✓</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 310);
    }, 2500);
  }

  /* ---- Add to cart buttons ---- */
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Товар додано до кошика ✓');
      // Brief visual feedback
      const original = btn.textContent;
      btn.textContent = 'Додано!';
      btn.style.background = 'var(--primary)';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
      }, 1200);
    });
  });

  /* ---- Sidebar filters toggle (mobile) ---- */
  const filtersToggle = document.querySelector('.filters-toggle');
  const sidebar       = document.querySelector('.sidebar');
  if (filtersToggle && sidebar) {
    filtersToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      filtersToggle.querySelector('.filters-toggle__text').textContent =
        open ? 'Сховати фільтри' : 'Показати фільтри';
    });
  }

  /* ---- Price range slider sync ---- */
  const priceSlider = document.querySelector('.price-slider');
  const priceMax    = document.querySelector('.price-max');
  if (priceSlider && priceMax) {
    priceSlider.addEventListener('input', () => {
      priceMax.value = priceSlider.value + ' ₴';
    });
  }

})();

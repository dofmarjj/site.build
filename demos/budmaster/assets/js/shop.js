/* ============================================================
   БудМайстер — Будівельні матеріали | shop.js
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
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
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
        // Swap main gallery icon to match selected thumb
        const mainIcon = document.querySelector('.gallery-placeholder__icon');
        if (mainIcon) {
          mainIcon.textContent = thumb.querySelector('.thumb-icon') ?
            thumb.querySelector('.thumb-icon').textContent : thumb.textContent.trim();
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

  /* ---- Weight / фасування selector ---- */
  document.querySelectorAll('.weight-options').forEach(group => {
    group.querySelectorAll('.weight-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.weight-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        // Update displayed price from data attribute
        const price = pill.dataset.price;
        if (price) {
          const priceEl = document.querySelector('.product-price');
          if (priceEl) priceEl.textContent = price + ' ₴';
        }
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
      setTimeout(() => toast.remove(), 320);
    }, 2500);
  }

  /* ---- Add to cart buttons ---- */
  document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Товар додано до кошика');
      const original = btn.textContent;
      btn.textContent = 'Додано ✓';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1400);
    });
  });

  /* ---- Sidebar filters toggle (mobile) ---- */
  const filtersToggle = document.querySelector('.filters-toggle');
  const sidebar       = document.querySelector('.sidebar');
  if (filtersToggle && sidebar) {
    filtersToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      const textEl = filtersToggle.querySelector('.filters-toggle__text');
      if (textEl) textEl.textContent = open ? 'Сховати фільтри' : 'Показати фільтри';
    });
  }

})();

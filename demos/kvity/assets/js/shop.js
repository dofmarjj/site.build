/* Florie — shop interactions */

(function () {
  let cartQty = 0;

  // Mobile nav
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      const open = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
    });
  }

  // Toast
  window.showToast = function (msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  };

  // Add to cart
  window.addToCart = function (btn, name) {
    cartQty++;
    const counter = document.getElementById('cartCount');
    if (counter) counter.textContent = cartQty;
    showToast(name + " — додано до кошика");
  };

  // Gallery thumbs
  window.switchImg = function (thumb, src) {
    const main = document.getElementById('mainImg');
    if (main) main.src = src;
    document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
  };

  // Option pills — single-select per group
  window.selectPill = function (pill) {
    const group = pill.closest('.option-pills');
    if (!group) return;
    group.querySelectorAll('.option-pill').forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
  };

  // Time slots — single-select
  window.selectSlot = function (slot) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
  };
})();

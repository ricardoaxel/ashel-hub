export function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;

  function closeMenu() {
    nav.classList.remove('active');
    btn.classList.remove('active');
    if (window.innerWidth <= 768) {
      const h = document.querySelector('.header-right');
      if (h) {
        const lang = h.querySelector('.lang-toggle');
        h.insertBefore(nav, lang);
      }
      nav.style.position = '';
      nav.style.background = '';
      nav.style.zIndex = '';
    }
  }

  btn.addEventListener('click', () => {
    if (nav.classList.contains('active')) { closeMenu(); return; }
    nav.classList.add('active');
    btn.classList.add('active');
    if (window.innerWidth <= 768) {
      document.body.appendChild(nav);
      nav.style.position = 'fixed';
      nav.style.background = 'rgba(0, 0, 0, 0.85)';
      nav.style.zIndex = '99999';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) closeMenu();
  });

  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setTimeout(closeMenu, 200));
  });
}

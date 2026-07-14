export function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  const header = document.querySelector('.header');
  if (!btn || !nav) return;
  let overlay = null;

  function closeMenu() {
    nav.classList.remove('active');
    btn.classList.remove('active');
    if (overlay) { overlay.remove(); overlay = null; }
    if (window.innerWidth <= 768) {
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        const lang = headerRight.querySelector('.lang-toggle');
        headerRight.insertBefore(nav, lang);
      }
      nav.style.position = '';
      nav.style.top = '';
      nav.style.left = '';
      nav.style.right = '';
      nav.style.bottom = '';
      nav.style.height = '';
      nav.style.background = '';
      nav.style.zIndex = '';
      nav.style.padding = '';
    }
  }

  function openMenu() {
    nav.classList.add('active');
    btn.classList.add('active');

    if (window.innerWidth <= 768) {
      document.body.appendChild(nav);
      nav.style.position = 'fixed';
      nav.style.top = 'auto';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.bottom = '0';
      nav.style.height = '75vh';
      nav.style.background = 'rgba(0, 0, 0, 0.92)';
      nav.style.zIndex = '99999';
      nav.style.padding = '2rem 0 1rem';

      // Create dismiss overlay for the top 25%
      overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '75vh';
      overlay.style.zIndex = '99998';
      overlay.style.cursor = 'pointer';
      overlay.addEventListener('click', closeMenu);
      document.body.appendChild(overlay);
    }
  }

  btn.addEventListener('click', () => {
    if (nav.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) closeMenu();
  });

  // Close when a nav link is clicked
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      setTimeout(closeMenu, 150);
    });
  });
}

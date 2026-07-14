export function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('active');
    btn.classList.toggle('active');

    if (window.innerWidth <= 768) {
      if (isOpen) {
        document.body.appendChild(nav);
        nav.style.position = 'fixed';
        nav.style.top = '0';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.bottom = '0';
        nav.style.background = 'rgba(0, 0, 0, 0.85)';
        nav.style.zIndex = '99';
      } else {
        const header = document.querySelector('.header-right');
        if (header) {
          const lang = header.querySelector('.lang-toggle');
          header.insertBefore(nav, lang);
          nav.style.position = '';
          nav.style.top = '';
          nav.style.left = '';
          nav.style.right = '';
          nav.style.bottom = '';
          nav.style.background = '';
          nav.style.zIndex = '';
        }
      }
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        nav.classList.remove('active');
        btn.classList.remove('active');
        if (window.innerWidth <= 768) {
          const header = document.querySelector('.header-right');
          if (header) {
            const lang = header.querySelector('.lang-toggle');
            header.insertBefore(nav, lang);
            nav.style.position = '';
            nav.style.top = '';
            nav.style.left = '';
            nav.style.right = '';
            nav.style.bottom = '';
            nav.style.background = '';
            nav.style.zIndex = '';
          }
        }
      }
    });
  });
}

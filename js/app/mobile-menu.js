export function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;
  let isAnimating = false;

  function moveNavToBody() {
    document.body.appendChild(nav);
    nav.style.position = 'fixed';
    nav.style.top = '0';
    nav.style.left = '0';
    nav.style.right = '0';
    nav.style.bottom = '0';
    nav.style.zIndex = '99';
  }

  function moveNavBack() {
    const h = document.querySelector('.header-right');
    if (!h) return;
    const lang = h.querySelector('.lang-toggle');
    h.insertBefore(nav, lang);
    nav.style.position = '';
    nav.style.top = '';
    nav.style.left = '';
    nav.style.right = '';
    nav.style.bottom = '';
    nav.style.zIndex = '';
  }

  btn.addEventListener('click', () => {
    if (isAnimating) return;
    const opening = !nav.classList.contains('active');
    btn.classList.toggle('active');

    if (opening) {
      moveNavToBody();
      // Force browser to acknowledge the DOM change before adding active class
      requestAnimationFrame(() => {
        nav.classList.add('active');
      });
    } else {
      nav.classList.remove('active');
      isAnimating = true;
      setTimeout(() => {
        moveNavBack();
        isAnimating = false;
      }, 500);
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
        isAnimating = true;
        setTimeout(() => {
          moveNavBack();
          isAnimating = false;
        }, 500);
      }
    });
  });
}

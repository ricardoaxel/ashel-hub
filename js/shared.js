const params = new URLSearchParams(window.location.search);
const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
let currentLocale = params.get('locale') || localStorage.getItem('locale') || browserLang;
let i18nData = null;
let siteData = null;
const colorCache = {};
const colorThief = new ColorThief();

// ---- i18n ----
function applyTranslations() {
  if (!i18nData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const keys = key.split('.');
    let value = t;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') el.textContent = value;
  });
  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.lang === currentLocale);
  });
  document.documentElement.lang = currentLocale;
}

function setLocale(lang, onLocaleChange) {
  currentLocale = lang;
  localStorage.setItem('locale', lang);
  const url = new URL(window.location);
  url.searchParams.set('locale', lang);
  window.history.replaceState({}, '', url);
  applyTranslations();
  if (typeof onLocaleChange === 'function') onLocaleChange();
}

function initLangToggle(onLocaleChange) {
  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setLocale(opt.dataset.lang, onLocaleChange);
    });
  });
}

// ---- Color Extraction ----
function extractColors(imageUrl) {
  return fetch(imageUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const palette = colorThief.getPalette(img, 16);
            const analyzeColor = (c) => {
              const max = Math.max(...c);
              const min = Math.min(...c);
              const brightness = (c[0] + c[1] + c[2]) / 3;
              const saturation = max === 0 ? 0 : (max - min) / max;
              return {
                r: c[0],
                g: c[1],
                b: c[2],
                brightness,
                saturation,
                score: saturation * 0.6 + (brightness > 80 && brightness < 200 ? 0.4 : 0),
              };
            };
            const analyzed = palette.map(analyzeColor).sort((a, b) => b.score - a.score);
            let accent = analyzed[0];
            if (accent.brightness < 80 && analyzed.length > 1) {
              accent =
                analyzed.filter((c) => c.brightness >= 60 && c.saturation > 0.25)[0] || analyzed[0];
            }
            const brighten = (c, factor) => {
              const r = Math.min(255, Math.floor(c.r * factor));
              const g = Math.min(255, Math.floor(c.g * factor));
              const b = Math.min(255, Math.floor(c.b * factor));
              return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            };
            const factor = accent.brightness < 100 ? 1.4 : 1.25;
            const c1 = brighten(accent, factor);
            const secondary =
              analyzed.filter(
                (c) => Math.abs(c.score - accent.score) > 0.1 && c.brightness >= 50
              )[0] ||
              analyzed[1] ||
              accent;
            const c2 = brighten(secondary, 1.3);
            const tertiary =
              analyzed.filter(
                (c) =>
                  c !== secondary &&
                  Math.abs(c.score - secondary.score) > 0.05 &&
                  c.brightness >= 50
              )[0] ||
              analyzed[2] ||
              secondary;
            const c3 = brighten(tertiary, 1.15);
            URL.revokeObjectURL(url);
            resolve([c1, c2, c3]);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    });
}

function applyProjectColors(projectId, colors) {
  colorCache[projectId] = colors;
  const root = document.documentElement.style;
  root.setProperty('--section-accent', colors[0]);
  root.setProperty('--section-accent-secondary', colors[1]);
  root.setProperty('--section-accent-tertiary', colors[2]);
}

// ---- Cursor ----
let cursorDot, cursorRing, cursorMouseX, cursorMouseY, cursorRingX, cursorRingY;
let currentSectionColor = '#ff2d55';
let fallbackColor = '#ff2d55';

function initCursor() {
  cursorDot = document.querySelector('.cursor-dot');
  cursorRing = document.querySelector('.cursor-ring');
  if (!cursorDot || !cursorRing) return;

  cursorMouseX = window.innerWidth / 2;
  cursorMouseY = window.innerHeight / 2;
  cursorRingX = 0;
  cursorRingY = 0;

  document.addEventListener('mousemove', (e) => {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;
    cursorDot.style.transform = `translate(${cursorMouseX - 3}px, ${cursorMouseY - 3}px)`;
    updateCursorColor();
  });

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const card = getMostVisibleCard();
        if (card) {
          fallbackColor = card.style.getPropertyValue('--section-accent').trim() || '#ff2d55';
        }
        updateCursorColor();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  animateCursorRing();
}

function getMostVisibleCard() {
  const cards = document.querySelectorAll('.project-card');
  let bestCard = null;
  let maxVisible = 0;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(window.innerHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight;
      bestCard = card;
    }
  });

  return bestCard;
}

function getCursorColor() {
  const el = document.elementFromPoint(cursorMouseX, cursorMouseY);
  if (!el) return fallbackColor;

  const card = el.closest('.project-card');
  if (card) {
    const color = card.style.getPropertyValue('--section-accent').trim();
    if (color) return color;
  }

  return fallbackColor;
}

function updateCursorColor() {
  const color = getCursorColor();
  if (color !== currentSectionColor) {
    currentSectionColor = color;
    cursorRing.style.borderColor = color;
  }
}

function animateCursorRing() {
  cursorRingX += (cursorMouseX - cursorRingX) * 0.15;
  cursorRingY += (cursorMouseY - cursorRingY) * 0.15;
  cursorRing.style.transform = `translate(${cursorRingX - 18}px, ${cursorRingY - 18}px)`;
  requestAnimationFrame(animateCursorRing);
}

function attachCursor(el) {
  if (!cursorRing) return;
  el.addEventListener('mouseenter', () => {
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--section-accent').trim() ||
      '#ff2d55';
    cursorRing.style.width = '60px';
    cursorRing.style.height = '60px';
    cursorRing.style.borderColor = accent;
  });
  el.addEventListener('mouseleave', () => {
    cursorRing.style.width = '36px';
    cursorRing.style.height = '36px';
    cursorRing.style.borderColor = currentSectionColor;
  });
}

// ---- Mobile Menu ----
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('active');
    btn.classList.toggle('active');
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        nav.classList.remove('active');
        btn.classList.remove('active');
      }
    });
  });
}

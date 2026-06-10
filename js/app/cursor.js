let cursorDot, cursorRing, cursorMouseX, cursorMouseY, cursorRingX, cursorRingY;
let currentSectionColor = '#ff2d55';
let fallbackColor = '#ff2d55';
let cursorRAF = null;
let cursorIdleTimer = null;

function startCursorRing() {
  if (cursorRAF) return;
  animateCursorRing();
}

function stopCursorRing() {
  if (cursorRAF) {
    cancelAnimationFrame(cursorRAF);
    cursorRAF = null;
  }
}

export function initCursor() {
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
    const card = e.target.closest('.project-card');
    if (card) {
      const c = card.style.getPropertyValue('--section-accent').trim();
      if (c) fallbackColor = c;
    }
    applyCursorColor();
    clearTimeout(cursorIdleTimer);
    startCursorRing();
    cursorIdleTimer = setTimeout(stopCursorRing, 2000);
  });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const card = getMostVisibleCard();
        if (card) {
          const c = card.style.getPropertyValue('--section-accent').trim();
          if (c) fallbackColor = c;
        }
        applyCursorColor();
        ticking = false;
      });
      ticking = true;
    }
  });
}

function getMostVisibleCard() {
  const cards = document.querySelectorAll('.project-card');
  let bestCard = null;
  let maxVisible = 0;
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const visible = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
    if (visible > maxVisible) {
      maxVisible = visible;
      bestCard = card;
    }
  });
  return bestCard;
}

function applyCursorColor() {
  if (fallbackColor === '#ff2d55') {
    const rootAccent = document.documentElement.style.getPropertyValue('--section-accent').trim();
    if (rootAccent) fallbackColor = rootAccent;
  }
  if (fallbackColor !== currentSectionColor) {
    currentSectionColor = fallbackColor;
    cursorRing.style.borderColor = currentSectionColor;
  }
}

function animateCursorRing() {
  cursorRingX += (cursorMouseX - cursorRingX) * 0.15;
  cursorRingY += (cursorMouseY - cursorRingY) * 0.15;
  cursorRing.style.transform = `translate(${cursorRingX - 18}px, ${cursorRingY - 18}px)`;
  cursorRAF = requestAnimationFrame(animateCursorRing);
}

export function attachCursor(el) {
  if (!cursorRing) return;
  el.addEventListener('mouseenter', () => {
    cursorRing.style.width = '60px';
    cursorRing.style.height = '60px';
  });
  el.addEventListener('mouseleave', () => {
    cursorRing.style.width = '36px';
    cursorRing.style.height = '36px';
    cursorRing.style.borderColor = currentSectionColor;
  });
}

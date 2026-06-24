import { getSiteData, getI18nData } from './data.js';
import { getLocale } from './i18n.js';
import { openModal } from './modal.js';

let intervalId = null;
let currentIndex = 0;
let totalCount = 0;
let globalIndices = [];
let busy = false;
const CYCLE_MS = 7000;
const BG_OPACITY = 0.6;

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve;
    img.src = src;
  });
}

async function showIllustration(items, index, bg1, bg2) {
  if (busy) return;
  busy = true;
  const item = items[index];
  if (!item) { busy = false; return; }
  currentIndex = index;
  const nextBg = currentIndex % 2 === 0 ? bg1 : bg2;
  const prevBg = currentIndex % 2 === 0 ? bg2 : bg1;
  await preload(item.src);
  nextBg.style.backgroundImage = `url("${item.src}")`;
  nextBg.style.opacity = BG_OPACITY;
  prevBg.style.opacity = 0;
  const counter = document.getElementById('hero-illustration-counter');
  if (counter) {
    const globalIdx = globalIndices[index];
    const num = String(globalIdx).padStart(2, '0');
    const total = String(totalCount).padStart(2, '0');
    counter.textContent = `${num}/${total}`;
  }
  busy = false;
}

function startCycling(items, bg1, bg2) {
  stopCycling();
  currentIndex = 0;
  showIllustration(items, 0, bg1, bg2);
  intervalId = setInterval(() => {
    const next = (currentIndex + 1) % items.length;
    showIllustration(items, next, bg1, bg2);
  }, CYCLE_MS);
}

function stopCycling() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

const DARK_INDICES = [4, 17, 3, 9, 14, 12, 10, 11, 5, 8, 15];

export function initIllustration() {
  const data = getSiteData();
  const allItems = data?.illustrations;
  if (!allItems || allItems.length === 0) return;

  const items = DARK_INDICES.map(i => allItems[i - 1]).filter(Boolean);
  if (items.length === 0) return;

  totalCount = allItems.length;
  globalIndices = DARK_INDICES.slice(0, items.length);

  const i18n = getI18nData();
  const locale = getLocale();
  const t = i18n?.[locale] || i18n?.en;
  const labelText = document.querySelector('.hero-illustration-label-text');
  if (labelText) {
    labelText.textContent = t?.labels?.illustrationLabel || 'Illustration';
  }

  const label = document.getElementById('hero-illustration-label');
  const bg1 = document.getElementById('hero-illustration-bg-1');
  const bg2 = document.getElementById('hero-illustration-bg-2');

  if (!label || !bg1 || !bg2) return;

  label.classList.add('visible');

  startCycling(items, bg1, bg2);

  label.addEventListener('click', () => {
    openModal(items, currentIndex);
  });
}

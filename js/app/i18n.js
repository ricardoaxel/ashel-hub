import { getI18nData } from './data.js';

const params = new URLSearchParams(window.location.search);
let currentLocale =
  params.get('locale') ||
  localStorage.getItem('locale') ||
  (navigator.language.startsWith('en') ? 'en' : 'es');
let localeListeners = [];

/** Returns the current locale code (e.g. 'en', 'es'). */
export function getLocale() {
  return currentLocale;
}

/**
 * Updates all [data-i18n] elements and .lang-option active states
 * to match the current locale.
 */
export function applyTranslations() {
  const i18nData = getI18nData();
  if (!i18nData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const keys = key.split('.');
    let value = t;
    for (const k of keys) value = value?.[k];
    if (typeof value === 'string') el.textContent = value;
  });
  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.classList.toggle('active', opt.dataset.lang === currentLocale);
  });
  document.documentElement.lang = currentLocale;
}

/** Switches locale, persists to localStorage/URL, updates DOM, fires listeners. */
export function setLocale(lang) {
  currentLocale = lang;
  localStorage.setItem('locale', lang);
  const url = new URL(window.location);
  url.searchParams.set('locale', lang);
  window.history.replaceState({}, '', url);
  applyTranslations();
  localeListeners.forEach((fn) => fn());
}

export function onLocaleChange(fn) {
  localeListeners.push(fn);
}

export function initLangToggle() {
  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setLocale(opt.dataset.lang);
    });
  });
}

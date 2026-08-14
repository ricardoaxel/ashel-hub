/**
 * Shared utility helpers used across renderers and modules.
 */

/**
 * Makes any element keyboard/screen-reader accessible like a button.
 * Idempotent: marks the element with data-accessible and skips if already processed,
 * preventing duplicate listeners when renderers run multiple times.
 */
export function makeAccessible(el, callback, label) {
  if (!el || el.dataset.accessible === 'true') return;
  el.dataset.accessible = 'true';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  if (label) el.setAttribute('aria-label', label);
  el.addEventListener('click', callback);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  });
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatCount(n) {
  return pad2(n);
}

export function translateDate(dateStr, t) {
  if (!dateStr || !t?.labels?.months) return dateStr;
  return dateStr.replace(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
    (m) => t.labels.months[m] || m
  );
}

export function getLocaleDisplayName(locale) {
  return locale?.startsWith('es') ? 'es' : 'en';
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
}

export function parseYear(yearStr) {
  if (!yearStr) return 0;
  try {
    return parseInt(String(yearStr).split(' ').pop()) || 0;
  } catch (_) {
    return 0;
  }
}

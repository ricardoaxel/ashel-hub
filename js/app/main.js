import { loadData, getSiteData, getI18nData, getProject, abortPendingLoads } from './data.js';
import { applyTranslations, initLangToggle, onLocaleChange } from './i18n.js';
import { initCursor } from './cursor.js';
import { initMobileMenu } from './mobile-menu.js';
import { extractColors, colorCache, getColorFallback, saveColorCache } from './colors.js';
import { renderIndexContent, getHeroColors, applyCardColors } from './render/index.js';
import { initModal } from './modal.js';
import { initIllustration } from './illustration.js';
import { setCurrentProject, renderProjectContent } from './render/project.js';
import { renderIllustrationsContent } from './render/illustrations.js';
import { renderOtherContent } from './render/other.js';
import { initWaveCanvas } from './wave-canvas.js';
import { initBubbles } from './bubbles.js';
import { TIMINGS } from './config.js';
import { getLocaleDisplayName } from './utils.js';
import { initAnalytics } from './analytics.js';

const pageName = document.body.dataset.page || 'index';
const isProjectPage = pageName === 'project';
const isIllustrationPage = pageName === 'illustrations';
const isOtherPage = pageName === 'other';
const params = new URLSearchParams(window.location.search);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function scrollKey() {
  return 'scrollPos:' + location.pathname + location.search;
}

function scrollToHashTarget(hash = window.location.hash, behavior = 'instant') {
  if (!hash || hash === '#') return false;

  let target;
  if (hash.startsWith('#project-')) {
    const targetId = `project-${hash.replace('#project-', '')}`;
    target = document.getElementById(targetId);
  } else {
    const targetId = hash.slice(1);
    target = document.getElementById(targetId);
  }

  if (!target) return false;

  const header = document.querySelector('.header');
  const headerHeight = header ? header.offsetHeight : 0;
  const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 24;

  window.scrollTo({ top: Math.max(0, y), behavior });

  // Clean the hash for project back-links; keep section anchors in the URL.
  if (hash.startsWith('#project-')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  return true;
}

let isReRendering = false;

function saveScroll() {
  if (isReRendering) return;
  try { sessionStorage.setItem(scrollKey(), String(window.scrollY)); } catch (_) {}
}

function restoreScroll() {
  try {
    if (scrollToHashTarget()) return;

    const saved = sessionStorage.getItem(scrollKey());
    if (!saved) return;
    sessionStorage.removeItem(scrollKey());
    const y = parseInt(saved, 10);
    if (y <= 0) return;
    const apply = () => window.scrollTo({ top: y, behavior: 'instant' });
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply, 100);
    setTimeout(apply, 300);
  } catch (_) {}
}

let scrollTimer = null;
function throttleSave() {
  if (scrollTimer || isReRendering) return;
  scrollTimer = setTimeout(() => {
    scrollTimer = null;
    saveScroll();
  }, TIMINGS.scrollSaveThrottleMs);
}

window.addEventListener('scroll', throttleSave, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveScroll();
});

window.addEventListener('pagehide', () => {
  saveScroll();
  abortPendingLoads();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) restoreScroll();
});

// Same-page hash anchors should also respect the header offset + margin.
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const hash = anchor.getAttribute('href');
  if (scrollToHashTarget(hash, 'smooth')) {
    e.preventDefault();
  }
});

window.addEventListener('hashchange', () => {
  scrollToHashTarget(window.location.hash, 'smooth');
});

function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  if (window._loaderTextTimer) {
    clearTimeout(window._loaderTextTimer);
    window._loaderTextTimer = null;
  }
  loader.style.transition = `opacity ${TIMINGS.pageLoaderFadeMs}ms ease`;
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), TIMINGS.pageLoaderFadeMs);
}

function reRender() {
  isReRendering = true;
  const savedY = window.scrollY;

  if (isProjectPage) renderProjectContent();
  else if (isIllustrationPage) renderIllustrationsContent();
  else if (isOtherPage) renderOtherContent();
  else renderIndexContent(true);

  window.scrollTo({ top: savedY, behavior: 'instant' });
  requestAnimationFrame(() => {
    window.scrollTo({ top: savedY, behavior: 'instant' });
    isReRendering = false;
  });
}

if (!isProjectPage && !isIllustrationPage && !isOtherPage) initWaveCanvas(getHeroColors);

loadData()
  .then(() => {
    try {
      applyTranslations();
      const i18n = getI18nData();
      const loc = getLocaleDisplayName(navigator.language);
      const tPage = i18n?.[loc] || i18n?.en || {};

      if (isProjectPage) {
        const projectId = params.get('id');
        if (!projectId) {
          window.location.href = 'index.html';
          return;
        }
        setCurrentProject(projectId);
        renderProjectContent();
        initModal();
        const p = getProject(projectId);
        if (p) document.title = `${p.name} | Ashel`;
        restoreScroll();
        hidePageLoader();
      } else if (isIllustrationPage) {
        renderIllustrationsContent();
        initModal();
        document.title = `${tPage.labels?.illustrationsSection || 'Illustrations'} | Ashel`;
        restoreScroll();
        hidePageLoader();
      } else if (isOtherPage) {
        renderOtherContent();
        initModal();
        document.title = `${tPage.labels?.otherSection || 'Extras'} | Ashel`;
        restoreScroll();
        hidePageLoader();
      } else {
        renderIndexContent();
        initModal();
        initIllustration();
        initBubbles(getSiteData());
        restoreScroll();
        hidePageLoader();
      }

      const siteData = getSiteData();
      if (!isProjectPage && !isIllustrationPage && !isOtherPage && siteData?.projects?.[0]?.cover) {
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'image';
        preload.href = siteData.projects[0].cover;
        document.head.appendChild(preload);
      }
      if (siteData && !isIllustrationPage && !isOtherPage) {
        const extractionPromises = siteData.projects.map((project) =>
          extractColors(project.cover)
            .then((colors) => {
              colorCache[project.id] = colors;
              if (!isProjectPage) applyCardColors();
            })
            .catch(() => {
              colorCache[project.id] = getColorFallback(project);
              if (!isProjectPage) applyCardColors();
            })
        );
        Promise.all(extractionPromises).then(() => saveColorCache());
      }
    } catch (renderErr) {
      console.error('Render error:', renderErr);
      showError('renderError');
    }
  })
  .catch((err) => {
    console.error('Failed to load data:', err);
    showError('dataError');
  });

function showError(type) {
  const locale = getLocaleDisplayName(navigator.language);
  const i18n = getI18nData();
  const t = (i18n?.[locale] || i18n?.en || {});
  const fallbacks = { renderError: 'Render error', dataError: 'Error loading data' };
  const msg = t.site?.[type === 'renderError' ? 'errorRender' : 'errorData'] || fallbacks[type] || 'Unknown error';
  const prefix = locale === 'es' ? 'Error: ' : 'Error: ';
  const text = prefix + msg;
  const errorHtml = `<div class="error-message">${text}</div>`;
  if (isProjectPage) {
    const el = document.getElementById('project-content');
    if (el) el.innerHTML = errorHtml;
  } else if (isIllustrationPage) {
    const el = document.getElementById('illustrations-content');
    if (el) el.innerHTML = errorHtml;
  } else if (isOtherPage) {
    const el = document.getElementById('other-content');
    if (el) el.innerHTML = errorHtml;
  } else {
    const main = document.querySelector('main');
    if (main) main.innerHTML = errorHtml;
    else document.body.innerHTML = errorHtml;
  }
  hidePageLoader();
}

initLangToggle();
onLocaleChange(reRender);
initMobileMenu();
initAnalytics();
initCursor();

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

const isProjectPage = window.location.pathname.includes('project.html');
const isIllustrationPage = window.location.pathname.includes('illustrations.html');
const isOtherPage = window.location.pathname.includes('other.html');
const params = new URLSearchParams(window.location.search);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function scrollKey() {
  return 'scrollPos:' + location.pathname + location.search;
}

let isReRendering = false;

function saveScroll() {
  if (isReRendering) return;
  try { sessionStorage.setItem(scrollKey(), String(window.scrollY)); } catch (_) {}
}

function restoreScroll() {
  try {
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
  }, 150);
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

function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  if (window._loaderTextTimer) {
    clearTimeout(window._loaderTextTimer);
    window._loaderTextTimer = null;
  }
  loader.style.transition = 'opacity 0.35s ease';
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 350);
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
      const loc = navigator.language.startsWith('es') ? 'es' : 'en';
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
  const locale = navigator.language.startsWith('en') ? 'en' : 'es';
  const i18n = getI18nData();
  const t = (i18n?.[locale] || i18n?.en || {});
  const fallbacks = { renderError: 'Render error', dataError: 'Error loading data' };
  const msg = t.site?.[type === 'renderError' ? 'errorRender' : 'errorData'] || fallbacks[type] || 'Unknown error';
  const prefix = locale === 'es' ? 'Error: ' : 'Error: ';
  const text = prefix + msg;
  if (isProjectPage) {
    const el = document.getElementById('project-content');
    if (el) el.innerHTML = `<div class="loading">${text}</div>`;
  } else if (isIllustrationPage) {
    const el = document.getElementById('illustrations-content');
    if (el) el.innerHTML = `<div class="loading">${text}</div>`;
  } else if (isOtherPage) {
    const el = document.getElementById('other-content');
    if (el) el.innerHTML = `<div class="loading">${text}</div>`;
  } else {
    document.body.innerHTML = `<div class="loading" style="padding:10rem 2rem;text-align:center;font-family:var(--mono);color:var(--text-dim)">${text}</div>`;
  }
  hidePageLoader();
}

initLangToggle();
onLocaleChange(reRender);
initMobileMenu();
initCursor();

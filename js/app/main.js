import { loadData, getSiteData, getProject } from './data.js';
import { applyTranslations, initLangToggle, onLocaleChange } from './i18n.js';
import { initCursor } from './cursor.js';
import { initMobileMenu } from './mobile-menu.js';
import { extractColors, colorCache, getColorFallback, saveColorCache } from './colors.js';
import { renderIndexContent, getHeroColors, applyCardColors } from './render/index.js';
import { initModal } from './modal.js';
import { initIllustration } from './illustration.js';
import { setCurrentProject, renderProjectContent } from './render/project.js';
import { renderIllustrationsContent } from './render/illustrations.js';
import { initWaveCanvas } from './wave-canvas.js';
import { initBubbles } from './bubbles.js';

const isProjectPage = window.location.pathname.includes('project.html');
const isIllustrationPage = window.location.pathname.includes('illustrations.html');
const params = new URLSearchParams(window.location.search);

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
  if (isProjectPage) renderProjectContent();
  else if (isIllustrationPage) renderIllustrationsContent();
  else renderIndexContent();
}

if (!isProjectPage && !isIllustrationPage) initWaveCanvas(getHeroColors);

loadData()
  .then(() => {
    applyTranslations();

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
      hidePageLoader();
    } else if (isIllustrationPage) {
      renderIllustrationsContent();
      initModal();
      document.title = `Illustrations | Ashel`;
      hidePageLoader();
    } else {
      renderIndexContent();
      initModal();
      initIllustration();
      initBubbles(getSiteData());
      hidePageLoader();
    }

    const siteData = getSiteData();
    if (!isProjectPage && !isIllustrationPage && siteData?.projects?.[0]?.cover) {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.href = siteData.projects[0].cover;
      document.head.appendChild(preload);
    }
    if (siteData && !isIllustrationPage) {
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
  })
  .catch((err) => {
    console.error('Failed to load data:', err);
    const locale = (navigator.language.startsWith('es') ? 'es' : 'en');
    const msg = locale === 'es' ? 'Error al cargar datos' : 'Error loading data';
    if (isProjectPage) {
      document.getElementById('project-content').innerHTML =
        `<div class="loading">${msg}</div>`;
    } else if (isIllustrationPage) {
      document.getElementById('illustrations-content').innerHTML =
        `<div class="loading">${msg}</div>`;
    } else {
      document.body.innerHTML = `<div class="loading" style="padding:10rem 2rem;text-align:center;font-family:var(--mono);color:var(--text-dim)">${msg}</div>`;
    }
    hidePageLoader();
  });

initLangToggle();
onLocaleChange(reRender);
initMobileMenu();
initCursor();

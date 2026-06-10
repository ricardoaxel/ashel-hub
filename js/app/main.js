import { loadData, getSiteData, getProject } from './data.js';
import { applyTranslations, initLangToggle, onLocaleChange } from './i18n.js';
import { initCursor } from './cursor.js';
import { initMobileMenu } from './mobile-menu.js';
import { extractColors, colorCache, getColorFallback, saveColorCache } from './colors.js';
import { renderIndexContent, getHeroColors, applyCardColors } from './render/index.js';
import { setCurrentProject, renderProjectContent } from './render/project.js';
import { initWaveCanvas } from './wave-canvas.js';
import { initBubbles } from './bubbles.js';

const isProjectPage = window.location.pathname.includes('project.html');
const params = new URLSearchParams(window.location.search);

function hidePageLoader() {
  if (window._loaderTimer) { clearTimeout(window._loaderTimer); window._loaderTimer = null; }
  if (window._loaderTextTimer) { clearTimeout(window._loaderTextTimer); window._loaderTextTimer = null; }
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  if (loader.style.display === 'none') { loader.remove(); return; }
  loader.style.transition = 'opacity 0.35s ease';
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 350);
}

function reRender() {
  if (isProjectPage) renderProjectContent();
  else renderIndexContent();
}

if (!isProjectPage) initWaveCanvas(getHeroColors);

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
      const p = getProject(projectId);
      if (p) document.title = `${p.name} | Ashel`;
      hidePageLoader();
    } else {
      renderIndexContent();
      initBubbles(getSiteData());
      hidePageLoader();
    }

    const siteData = getSiteData();
    if (!isProjectPage && siteData?.projects?.[0]?.cover) {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.href = siteData.projects[0].cover;
      document.head.appendChild(preload);
    }
    if (siteData) {
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
    if (isProjectPage) {
      document.getElementById('project-content').innerHTML =
        '<div class="loading">Error loading data</div>';
    }
    hidePageLoader();
  });

initLangToggle();
onLocaleChange(reRender);
initMobileMenu();
initCursor();

import { loadData, getSiteData, getProject } from './data.js';
import { applyTranslations, initLangToggle, onLocaleChange } from './i18n.js';
import { initCursor } from './cursor.js';
import { initMobileMenu } from './mobile-menu.js';
import { extractColors, colorCache, getColorFallback, applyProjectColors } from './colors.js';
import { renderIndexContent, getHeroColors, applyCardColors } from './render/index.js';
import { setCurrentProject, renderProjectContent } from './render/project.js';
import { initWaveCanvas } from './wave-canvas.js';
import { initBubbles } from './bubbles.js';

const isProjectPage = window.location.pathname.includes('project.html');
const params = new URLSearchParams(window.location.search);

function reRender() {
  if (isProjectPage) renderProjectContent();
  else renderIndexContent();
}

if (!isProjectPage) initWaveCanvas(getHeroColors);

loadData()
  .then(() => {
    applyTranslations();

    let projectId;
    if (isProjectPage) {
      projectId = params.get('id');
      if (!projectId) {
        window.location.href = 'index.html';
        return;
      }
      setCurrentProject(projectId);
      renderProjectContent();
      const p = getProject(projectId);
      if (p) document.title = `${p.name} | Ashel`;
    } else {
      renderIndexContent();
      initBubbles(getSiteData());
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
      siteData.projects.forEach((project) => {
        extractColors(project.cover)
          .then((colors) => {
            colorCache[project.id] = colors;
            if (isProjectPage) {
              if (project.id === projectId) applyProjectColors(project.id, colors);
            } else {
              applyCardColors();
            }
          })
          .catch(() => {
            const fallback = getColorFallback(project);
            colorCache[project.id] = fallback;
            if (isProjectPage) {
              if (project.id === projectId) applyProjectColors(project.id, fallback);
            } else {
              applyCardColors();
            }
          });
      });
    }
  })
  .catch((err) => {
    console.error('Failed to load data:', err);
    if (isProjectPage) {
      document.getElementById('project-content').innerHTML =
        '<div class="loading">Error loading data</div>';
    }
  });

initLangToggle();
onLocaleChange(reRender);
initMobileMenu();
initCursor();

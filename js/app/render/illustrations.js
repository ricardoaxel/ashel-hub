import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { openModal } from '../modal.js';
import { attachCursor } from '../cursor.js';
import { makeAccessible, pad2 } from '../utils.js';

export function renderIllustrationsContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const items = siteData.illustrations;
  if (!items || items.length === 0) return;

  const first = items[0];
  const sectionLabel = t.labels?.illustrationsSection || 'Illustrations';
  const count = pad2(items.length);

  document.getElementById('illustrations-content').innerHTML = `
    <div class="ill-hero">
      <div class="ill-hero-bg" id="ill-hero-bg" style="background-image: url('${first.src}')"></div>
      <div class="ill-hero-overlay"></div>
      <div class="ill-hero-content">
        <div class="ill-hero-sub">${sectionLabel} <span class="count">${count}</span></div>
        <h1 class="ill-hero-title">${sectionLabel}</h1>
        <p class="ill-hero-desc">${t.site?.visualsDesc || ''}</p>
      </div>
    </div>
    <div class="ill-section">
      <div class="ill-header">
        <a href="index.html" class="back-link">&larr; ${t.site?.backToProjects || 'Back'}</a>
      </div>
      <div class="ill-grid" id="ill-grid">
        ${items
          .map(
            (item, i) => `
          <div class="ill-grid-item" data-label="Illustration ${pad2(i + 1)}" data-index="${i}" role="button" tabindex="0" aria-label="${t.labels?.illustration || 'Illustration'} ${pad2(i + 1)}">
            <img src="${item.src}" alt="" loading="lazy" decoding="async">
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.ill-grid-item').forEach((el) => {
    const index = parseInt(el.dataset.index, 10);
    makeAccessible(el, () => openModal(items, index));
  });

  document.querySelectorAll('a, .ill-grid-item, button').forEach(attachCursor);
}

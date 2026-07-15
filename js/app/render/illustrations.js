import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { openModal } from '../modal.js';
import { attachCursor } from '../cursor.js';

export function renderIllustrationsContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const items = siteData.illustrations;
  if (!items || items.length === 0) return;

  const first = items[0];

  document.getElementById('illustrations-content').innerHTML = `
    <div class="ill-hero">
      <div class="ill-hero-bg" id="ill-hero-bg" style="background-image: url('${first.src}')"></div>
      <div class="ill-hero-overlay"></div>
      <div class="ill-hero-content">
        <div class="ill-hero-sub">${t.labels?.illustrationsSection || 'Illustrations'} <span class="count">${String(items.length).padStart(2, '0')}</span></div>
        <h1 class="ill-hero-title">${t.labels?.illustrationsSection || 'Illustrations'}</h1>
      </div>
    </div>
    <div class="ill-section">
      <div class="ill-header">
        <div>
          <h2>${t.labels?.illustrationsSection || 'Illustrations'} <span class="count">${String(items.length).padStart(2, '0')}</span></h2>
          <p class="ill-desc">${t.site?.visualsDesc || ''}</p>
        </div>
        <a href="index.html" class="page-back">← ${t.site?.backToProjects || 'Back'}</a>
      </div>
      <div class="ill-grid" id="ill-grid">
        ${items
          .map(
            (item, i) => `
          <div class="ill-grid-item" data-label="Illustration ${String(i + 1).padStart(2, '0')}" data-index="${i}">
            <img src="${item.src}" alt="" loading="lazy" decoding="async">
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.ill-grid-item').forEach((el) => {
    const index = parseInt(el.dataset.index, 10);
    el.addEventListener('click', () => openModal(items, index));
  });

  document.querySelectorAll('a, .ill-grid-item, button').forEach(attachCursor);
}

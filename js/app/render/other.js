import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { openModal } from '../modal.js';
import { attachCursor } from '../cursor.js';

export function renderOtherContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const items = siteData.other;
  if (!items || items.length === 0) return;

  const label = t.labels?.otherSection || t.nav?.other || 'Other';

  document.getElementById('other-content').innerHTML = `
    <div class="other-header">
      <div class="other-header-content">
        <div class="other-sub">${label} <span class="count">${String(items.length).padStart(2, '0')}</span></div>
        <h1 class="other-title">${label}</h1>
        <p class="other-desc">${t.site?.otherDesc || 'Side projects, collaborations, experiments, and other odds & ends.'}</p>
        <a href="index.html" class="page-back">← ${t.site?.backToProjects || 'Back'}</a>
      </div>
    </div>
    <div class="other-section">
      <div class="other-grid" id="other-grid">
        ${items
          .map(
            (item, i) => `
          <div class="other-card" data-index="${i}">
            ${item.type === 'bandcamp' ? `
            <div class="other-embed">
              ${item.embed}
            </div>` : item.type === 'youtube' && item.videoId ? `
            <div class="other-video">
              <iframe src="https://www.youtube.com/embed/${item.videoId}" frameborder="0" allowfullscreen loading="lazy" style="width:100%;aspect-ratio:16/9"></iframe>
            </div>` : `
            <div class="other-thumb">
              <a href="${item.url}" target="_blank">
                <img src="${item.thumbnail || ''}" alt="${item.title}" loading="lazy">
              </a>
            </div>`}
            <div class="other-card-info">
              <h3 class="other-card-title">${item.title}</h3>
              ${item.description ? `<p class="other-card-desc">${item.description}</p>` : ''}
              <a href="${item.url}" target="_blank" class="other-link">${t.labels?.visitLink || 'Visit →'}</a>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('a, .other-card, button').forEach(attachCursor);
}

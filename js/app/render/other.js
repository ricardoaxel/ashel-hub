import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { attachCursor } from '../cursor.js';

export function renderOtherContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const items = siteData.other;
  if (!items || items.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  function renderEmbed(item) {
    if (item.embed) return item.embed;
    if (item.type === 'youtube' && item.videoId)
      return `<iframe src="https://www.youtube.com/embed/${item.videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
    return `<span style="font-family:var(--mono);font-size:0.7rem;color:var(--text-muted)">${item.type}</span>`;
  }

  const gridItems = items.filter((item) => item.type !== 'soundcloud');
  const scItems = items.filter((item) => item.type === 'soundcloud');

  const gridHtml = gridItems.length
    ? `<div style="padding:0 2rem">
        <div class="other-detail-grid">
          ${gridItems
            .map(
              (item) => `
            <div class="other-detail-card">
              <div class="embed-area">${renderEmbed(item)}</div>
              <div class="card-info">
                <h3 class="card-title">${item.title}</h3>
                ${item.description ? `<p class="card-desc">${item.description}</p>` : ''}
                <a href="${item.url}" target="_blank" class="card-link">${t.labels?.visitLink || 'Visit →'}</a>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>`
    : '';

  const scHtml = scItems.length
    ? scItems
        .map(
          (item) => `
      <div style="padding:3rem 2rem 4rem">
        <div class="section-label" style="border:none;padding:0;margin-bottom:1.5rem">
          <span>${item.title}</span>
        </div>
        <div class="soundcloud-wrap">
          ${item.embed ? item.embed.replace('height="450"', 'height="350"') : ''}
        </div>
      </div>`
        )
        .join('')
    : '';

  document.getElementById('other-content').innerHTML = `
    <div class="detail-header" style="padding-bottom:2rem">
      <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
      <div style="margin-top:2rem">
        <div class="section-label" style="border:none;padding:0">
          <span>${t.labels?.otherSection || 'Extras'}</span>
          <span class="count">${String(items.length).padStart(2, '0')}</span>
        </div>
        <p style="font-family:var(--mono);font-size:0.8rem;color:var(--text-dim);line-height:1.8;margin-top:1rem;max-width:600px">
          ${t.site?.otherDesc || 'Side projects, collaborations, experiments, and other odds & ends.'}
        </p>
      </div>
    </div>
    ${gridHtml}
    ${scHtml}
  `;

  document.querySelectorAll('a, button').forEach(attachCursor);
}

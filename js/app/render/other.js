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
    <div style="padding:0 2rem 4rem">
      <div class="other-detail-grid">
        ${items.map((item, i) => `
          <div class="other-detail-card" style="border:1px solid var(--border);background:var(--bg)">
            ${item.type === 'bandcamp' && item.embed ? `
            <div>${item.embed}</div>` : item.type === 'youtube' && item.videoId ? `
            <div><iframe src="https://www.youtube.com/embed/${item.videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe></div>` : `
            <div style="text-align:center;font-family:var(--mono);font-size:0.7rem;color:var(--text-muted)">${item.type}</div>`}
            <div style="padding:1.5rem;border-top:1px solid var(--border)">
              <h3 style="font-family:var(--serif);font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">${item.title}</h3>
              ${item.description ? `<p style="font-family:var(--mono);font-size:0.75rem;color:var(--text-dim);line-height:1.6;margin-bottom:1rem">${item.description}</p>` : ''}
              <a href="${item.url}" target="_blank" style="font-family:var(--mono);font-size:0.65rem;color:var(--section-accent,var(--accent));text-transform:uppercase;letter-spacing:0.15em;text-decoration:none">${t.labels?.visitLink || 'Visit →'}</a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('a, button').forEach(attachCursor);
}

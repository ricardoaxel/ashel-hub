import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { openModal } from '../modal.js';
import { attachCursor } from '../cursor.js';
import { makeAccessible, pad2 } from '../utils.js';
import { renderEmbed, adjustSoundCloudHeight, createYouTubePlayer } from '../media.js';

export function renderOtherContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const items = siteData.other;
  const liveSessions = siteData.liveSessions || [];
  if (!items || items.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  const gridItems = items.filter((item) => item.type !== 'soundcloud');
  const scItems = items.filter((item) => item.type === 'soundcloud');

  const gridHtml = gridItems.length
    ? `<div class="other-grid-wrapper">
        <div class="other-detail-grid">
          ${gridItems
            .map(
              (item) => `
            <div class="other-detail-card">
              <div class="embed-area">${renderEmbed(item)}</div>
              <div class="card-info">
                <h3 class="card-title">${item.title}</h3>
                ${t.labels?.otherDescs?.[item.title] || item.description ? `<p class="card-desc">${t.labels?.otherDescs?.[item.title] || item.description}</p>` : ''}
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="card-link">${t.labels?.visitLink || 'Visit →'}</a>
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
      <div class="soundcloud-section">
        <div class="section-label bare soundcloud-section-label">
          <span>${item.title}</span>
        </div>
        <div class="soundcloud-wrap">
          ${adjustSoundCloudHeight(item.embed, 350)}
        </div>
      </div>`
        )
        .join('')
    : '';

  const liveHtml = liveSessions.length
    ? `
    <div class="live-sessions-section">
      <div class="section-label bare live-section-label">
        <span>${t.site?.liveSessions || 'Sesiones en vivo'}</span>
        <span class="count">${pad2(liveSessions.length)}</span>
      </div>
      <p class="live-sessions-desc">
        ${t.site?.liveSessionsDesc || 'Participación en grabación y mezcla de las siguientes sesiones en vivo.'}
      </p>
      <div class="videos-grid live-grid">
        ${liveSessions
          .map(
            (s, i) => `
          <div class="video-card video-facade" data-live-index="${i}" data-video-id="${s.videoId}" data-video-title="${(s.title || '').replace(/"/g, '&quot;')}" role="button" tabindex="0" aria-label="${t.site?.nowPlaying || 'Play'} ${(s.title || '').replace(/"/g, '&quot;')}">
            <img src="https://i1.ytimg.com/vi/${s.videoId}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
            <span class="video-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M8 5v14l11-7z"/></svg>
            </span>
          </div>`
          )
          .join('')}
      </div>
    </div>`
    : '';

  document.getElementById('other-content').innerHTML = `
    <div class="detail-header other-detail-header">
      <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
      <div class="other-detail-intro">
        <div class="section-label bare">
          <span>${t.labels?.otherSection || 'Extras'}</span>
          <span class="count">${pad2(items.length)}</span>
        </div>
        <p class="other-detail-desc">
          ${t.site?.otherDesc || 'Side projects, collaborations, experiments, and other odds & ends.'}
        </p>
      </div>
    </div>
    ${gridHtml}
    ${scHtml}
    ${liveHtml}
  `;

  document.querySelectorAll('.video-card[data-live-index]').forEach((el) => {
    const index = parseInt(el.dataset.liveIndex, 10);
    if (el.classList.contains('video-facade')) {
      const activate = () => {
        const videoId = el.dataset.videoId;
        const title = el.dataset.videoTitle || '';
        el.classList.remove('video-facade');
        el.innerHTML = createYouTubePlayer(videoId, { title });
      };
      el.addEventListener('click', activate);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    } else {
      el.addEventListener('click', () => openModal(liveSessions, index));
    }
  });

  document.querySelectorAll('a, button').forEach(attachCursor);
}

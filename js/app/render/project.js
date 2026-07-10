import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { attachCursor, refreshCursorColor } from '../cursor.js';
import { colorCache, getColorFallback, extractColors, applyProjectColors } from '../colors.js';
import { openModal } from '../modal.js';

let currentProject = null;
let currentProjectId = null;

export function setCurrentProject(id) {
  currentProjectId = id;
  const data = getSiteData();
  currentProject = data?.projects.find((p) => p.id === id) || null;
}

function translateDate(dateStr, t) {
  if (!dateStr || !t?.labels?.months) return dateStr;
  return dateStr.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => t.labels.months[m] || m);
}

export function renderProjectContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  const t = i18nData?.[currentLocale] || i18nData?.en || {};
  if (!i18nData || !siteData || !currentProject) {
    document.getElementById('project-content').innerHTML = `
      <div class="container" style="padding-top: 120px; text-align: center;">
        <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
        <h1>${t.site?.notFound || 'Project not found'}</h1>
      </div>`;
    return;
  }
  const project = currentProject;
  const projT = t.projects?.[project.id] || {};

  const genresHtml = project.genres.map((g) => `<span class="genre-tag">${g}</span>`).join('');
  const membersHtml = project.members
    .map((m) => `<li><strong>${m.name}</strong> — ${projT.members?.[m.name] || m.role}</li>`)
    .join('');
  const linksHtml = project.links
    .map((l) => {
      const icons = {
        Instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
        YouTube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="3"/><polygon points="10,8 10,16 17,12" fill="currentColor" stroke="none"/></svg>',
        Bandcamp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><polygon points="3,16 8.5,8 21,8" fill="currentColor" stroke="none" opacity="0.3"/><polygon points="3,16 8.5,8 21,8" stroke="currentColor" fill="none"/></svg>',
        Facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
      };
      const svg = icons[l.label] || '';
      return `<a href="${l.url}" target="_blank" class="btn-icon" title="${l.label}">${svg}</a>`;
    })
    .join('');
  const descriptionHtml = (projT.description || project.description)
    .map((p) => `<p class="detail-description">${p}</p>`)
    .join('');

  function renderFeatured(release) {
    if (!release) return '';
    const desc = projT.releases?.[release.name] || release.description;
    const tracks = release.tracks;
    const tracklistHtml = tracks?.length
      ? `<div class="tracklist">
          <h4>${t.site?.tracklist || 'Tracklist'}</h4>
          <ol>
            ${tracks.map((tr) => `<li>${tr}</li>`).join('')}
          </ol>
        </div>`
      : '';
    return `
      <section class="featured-release" id="featured-section">
        <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
          <span>${t.site?.featuredRelease || 'Featured Release'}</span>
          <span class="count">${translateDate(release.year, t)}</span>
        </div>
        <h2>${t.site?.nowPlaying || 'Now Playing'}</h2>
        <h3>${release.name}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
        ${release.embed ? `<div class="detail-player-section">${release.embed}<div class="player-ghost"></div></div>` : ''}
        ${tracklistHtml}
      </section>`;
  }

  const defaultFeatured = project.releases.find((r) => r.featured) || project.releases[0];

  const typeOrder = ['Album', 'EP', 'Single', 'Cover'];
  const grouped = {};
  project.releases.forEach((r) => {
    const t = r.type || 'Single';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(r);
  });

  const selectorHtml =
    project.releases.length > 1
      ? `
      <div class="album-selector-wrap">
        <label>${t.site?.albumLabel || 'Release'}</label>
        <select id="album-selector">
          ${typeOrder
            .filter((typeName) => grouped[typeName])
            .map(
              (typeName) => `
          <optgroup label="${t.labels?.releaseTypes?.[typeName] || typeName}">
            ${grouped[typeName].map((r) => `<option value="${r.name}" ${r.name === defaultFeatured.name ? 'selected' : ''}>${r.name} (${translateDate(r.year, t)})</option>`).join('')}
          </optgroup>`
            )
            .join('')}
        </select>
      </div>`
      : '';

  const releasesHtml = project.releases
    .map(
      (r) => `
      <a href="${r.url}" target="_blank" class="album-card">
        <img src="${r.cover}" alt="${r.name}" class="album-cover" loading="lazy" decoding="async">
        <div class="album-info">
          <span class="album-type">${t.labels?.releaseTypes?.[r.type] || r.type}</span>
          <p class="album-name">${r.name}</p>
          <p class="album-year">${translateDate(r.year, t)}</p>
        </div>
      </a>`
    )
    .join('');

  const sortedFlyers = project.flyers?.length
    ? [...project.flyers].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      })
    : [];

  const flyersCount = project.flyers?.length || 0;

  document.getElementById('project-content').innerHTML = `
    <section class="detail-header">
      <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
      <div class="detail-hero">
        <div class="detail-left">
          <img src="${project.cover}" alt="${project.name}" class="detail-cover" decoding="async">
          ${renderFeatured(defaultFeatured)}
        </div>
        <div class="detail-info">
          <h1>${project.name}</h1>
          ${project.yearsActive ? `
          <div class="detail-timeline">
            <div class="tl-track">
              <span class="tl-dot"></span>
              <span class="tl-line"></span>
              <span class="tl-dot"></span>
            </div>
            <div class="tl-labels">
              <span class="tl-year">${project.yearsActive.start}</span>
              <span class="tl-year">${project.yearsActive.end || t.labels?.present || 'Present'}</span>
            </div>
          </div>` : ''}
          <div class="detail-genres">${genresHtml}</div>
          <p class="detail-location">${t.labels?.location || 'Location'}: ${project.location}</p>
          ${descriptionHtml}
          ${selectorHtml}
          <div class="detail-members">
            <h3>${t.labels?.members || 'Members'}</h3>
            <ul class="member-list">${membersHtml}</ul>
          </div>
          <div class="detail-links">${linksHtml}</div>
        </div>
      </div>
    </section>

    <section class="discography">
      <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
        <span>${t.site?.discography || 'Discography'}</span>
        <span class="count">${String(project.releases.length).padStart(2, '0')}</span>
      </div>
      <div class="discography-grid">${releasesHtml}</div>
    </section>

    ${
      project.photos?.length
        ? `
    <section class="project-photos">
      <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
        <span>${t.site?.photos || 'Photos'}</span>
        <span class="count">${String(project.photos.length).padStart(2, '0')}</span>
      </div>
      <div class="photos-grid" id="photos-grid">
        ${project.photos
          .slice(0, 6)
          .map(
            (p, i) => `
          <div class="photo-card" data-type="photos" data-index="${i}">
            <img src="${p.src}" alt="${p.caption || ''}" loading="lazy" decoding="async">
            ${p.caption ? `<span class="photo-caption">${p.caption}</span>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
      ${
        project.photos.length > 6
          ? `<div class="illustration-show-more"><a href="#" id="photos-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${String(project.photos.length).padStart(2, '0')}</span></a></div>`
          : ''
      }
    </section>`
        : ''
    }

    ${
      sortedFlyers.length
        ? `
    <section class="project-photos" id="flyers-section">
      <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
        <span>${t.site?.flyers || 'Flyers'}</span>
        <span class="count">${String(flyersCount).padStart(2, '0')}</span>
      </div>
      <div class="illustrations-grid" id="flyers-grid">
        ${sortedFlyers
          .slice(0, 6)
          .map(
            (f, i) => `
          <div class="illustration-item" data-label="${(f.caption || '').replace(/"/g, '&quot;')}" data-type="flyers" data-index="${i}">
            <img src="${f.src}" alt="${f.caption || ''}" loading="lazy" decoding="async">
          </div>
        `
          )
          .join('')}
      </div>
      ${
        sortedFlyers.length > 6
          ? `<div class="illustration-show-more"><a href="#" id="flyers-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${String(sortedFlyers.length).padStart(2, '0')}</span></a></div>`
          : ''
      }
    </section>`
        : ''
    }

    ${
      project.videos?.length
        ? `
    <section class="project-videos">
      <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
        <span>${t.site?.videos || 'Videos'}</span>
        <span class="count">${String(project.videos.length).padStart(2, '0')}</span>
      </div>
      <div class="videos-grid">
        ${project.videos
          .map(
            (v, i) => `
          <div class="video-card" data-video-index="${i}">
            <iframe src="https://www.youtube.com/embed/${v.videoId}" frameborder="0" allowfullscreen loading="lazy" style="position:absolute;inset:0;width:100%;height:100%" title="${v.title}"></iframe>
          </div>
        `
          )
          .join('')}
      </div>
    </section>`
        : ''
    }`;

  document.querySelectorAll('a, button, .album-card, .photo-card').forEach(attachCursor);

  // Photos show more
  const photosBtn = document.getElementById('photos-show-more');
  photosBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const grid = document.getElementById('photos-grid');
    if (!grid) return;
    const remaining = project.photos.slice(6);
    const extraHtml = remaining
      .map(
        (p, i) => `
      <div class="photo-card" data-type="photos" data-index="${6 + i}">
        <img src="${p.src}" alt="${p.caption || ''}" loading="lazy" decoding="async">
        ${p.caption ? `<span class="photo-caption">${p.caption}</span>` : ''}
      </div>`
      )
      .join('');
    grid.insertAdjacentHTML('beforeend', extraHtml);
    photosBtn.remove();
  });

  const showMoreBtn = document.getElementById('flyers-show-more');
  showMoreBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const grid = document.getElementById('flyers-grid');
    if (!grid) return;
    const remaining = sortedFlyers.slice(6);
    const extraHtml = remaining
      .map(
        (f, i) => `
      <div class="illustration-item" data-label="${(f.caption || '').replace(/"/g, '&quot;')}" data-type="flyers" data-index="${6 + i}">
        <img src="${f.src}" alt="${f.caption || ''}" loading="lazy" decoding="async">
      </div>`
      )
      .join('');
    grid.insertAdjacentHTML('beforeend', extraHtml);
    showMoreBtn.remove();
    document.querySelectorAll('#flyers-grid .illustration-item').forEach((card) => {
      const index = parseInt(card.dataset.index, 10);
      card.addEventListener('click', () => openModal(sortedFlyers, index));
    });
  });

  // Flyers modal click handler
  document.querySelectorAll('#flyers-grid .illustration-item').forEach((card) => {
    const index = parseInt(card.dataset.index, 10);
    card.addEventListener('click', () => openModal(sortedFlyers, index));
  });

  document.querySelectorAll('.photo-card').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const index = parseInt(card.dataset.index);
      const items = type === 'photos' ? project.photos : sortedFlyers;
      if (!items?.[index]) return;
      if (!items[index].caption && items[index].src?.startsWith('data:')) return;
      openModal(items, index);
    });
  });

  document.querySelectorAll('.video-card').forEach((card) => {
    const index = parseInt(card.dataset.videoIndex, 10);
    card.addEventListener('click', () => openModal(project.videos, index));
  });

  const selector = document.getElementById('album-selector');
  selector?.addEventListener('change', () => {
    const selected = project.releases.find((r) => r.name === selector.value);
    const section = document.getElementById('featured-section');
    const cover = document.querySelector('.detail-cover');
    if (section && selected) {
      cover?.classList.add('fade-out');
      section.classList.add('fade-out');
      const url = new URL(window.location);
      url.searchParams.set('album', selected.name);
      window.history.replaceState({}, '', url);
      setTimeout(() => {
        section.outerHTML = renderFeatured(selected);
        if (cover) cover.src = selected.cover;
        setTimeout(() => {
          document.querySelector('.detail-cover')?.classList.remove('fade-out');
          document.getElementById('featured-section')?.classList.remove('fade-out');
        }, 30);
        setTimeout(() => {
          const g = document.querySelector('.player-ghost');
          if (g) g.classList.add('hide');
        }, 120);
        extractColors(selected.cover)
          .then((colors) => {
            const root = document.documentElement.style;
            root.setProperty('--section-accent', colors[0]);
            root.setProperty('--section-accent-secondary', colors[1]);
            root.setProperty('--section-accent-tertiary', colors[2]);
            const iframe = document.querySelector('.detail-player-section iframe');
            if (iframe) {
              const hex = colors[0].replace('#', '');
              iframe.src = iframe.src.replace(/linkcol=[a-f0-9]{6}/i, `linkcol=${hex}`);
            }
            refreshCursorColor();
          })
          .catch(() => {});
      }, 200);
    }
  });

  const colors = colorCache[project.id];
  if (colors) {
    const root = document.documentElement.style;
    root.setProperty('--section-accent', colors[0]);
    root.setProperty('--section-accent-secondary', colors[1]);
    root.setProperty('--section-accent-tertiary', colors[2]);
    updateEmbedColor(colors[0]);
    refreshCursorColor();
  } else {
    const fallback = getColorFallback(project);
    const root = document.documentElement.style;
    root.setProperty('--section-accent', fallback[0]);
    root.setProperty('--section-accent-secondary', fallback[1]);
    root.setProperty('--section-accent-tertiary', fallback[2]);
    updateEmbedColor(fallback[0]);
    refreshCursorColor();
  }

  // Auto-select album from URL param
  const albumParam = new URLSearchParams(window.location.search).get('album');
  const sel = document.getElementById('album-selector');
  const autoAlbum = albumParam && sel && project.releases.find((r) => r.name === albumParam);
  if (autoAlbum) {
    sel.value = autoAlbum.name;
    // Directly apply album colors instead of dispatching event
    const section = document.getElementById('featured-section');
    if (section) {
      section.outerHTML = renderFeatured(autoAlbum);
      document.querySelector('.detail-cover').src = autoAlbum.cover;
      setTimeout(() => {
        const g = document.querySelector('.player-ghost');
        if (g) g.classList.add('hide');
      }, 400);
      extractColors(autoAlbum.cover)
        .then((colors) => {
          const root = document.documentElement.style;
          root.setProperty('--section-accent', colors[0]);
          root.setProperty('--section-accent-secondary', colors[1]);
          root.setProperty('--section-accent-tertiary', colors[2]);
          const iframe = document.querySelector('.detail-player-section iframe');
          if (iframe) {
            const hex = colors[0].replace('#', '');
            iframe.src = iframe.src.replace(/linkcol=[a-f0-9]{6}/i, `linkcol=${hex}`);
          }
          refreshCursorColor();
        })
        .catch(() => {});
    }
  }

  if (!autoAlbum) {
    extractColors(project.cover)
      .then((extracted) => {
        applyProjectColors(project.id, extracted);
        updateEmbedColor(extracted[0]);
        refreshCursorColor();
      })
      .catch(() => {
        const fb = getColorFallback(project);
        applyProjectColors(project.id, fb);
        updateEmbedColor(fb[0]);
        refreshCursorColor();
      });
  }
}

function updateEmbedColor(color) {
  const iframe = document.querySelector('.detail-player-section iframe');
  if (iframe) {
    const hex = color.replace('#', '');
    iframe.src = iframe.src.replace(/linkcol=[a-f0-9]{6}/i, `linkcol=${hex}`);
  }
}

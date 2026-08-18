import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { attachCursor, refreshCursorColor } from '../cursor.js';
import { colorCache, getColorFallback, extractColors, applyProjectColors } from '../colors.js';
import { openModal } from '../modal.js';
import { makeAccessible, pad2, translateDate, sortByDateDesc } from '../utils.js';
import { BREAKPOINTS, PREVIEW_COUNTS, SOCIAL_ICONS } from '../config.js';

let currentProject = null;
let currentProjectId = null;

export function setCurrentProject(id) {
  currentProjectId = id;
  const data = getSiteData();
  currentProject = data?.projects.find((p) => p.id === id) || null;
}

function renderFeaturedRelease(project, release, t) {
  if (!release) return '';
  const projT = t.projects?.[project.id] || {};
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
      <div class="section-label bare section-label--spaced">
        <span>${t.site?.featuredRelease || 'Featured Release'}</span>
        <span class="count">${translateDate(release.year, t)}</span>
      </div>
      <h2>${t.site?.nowPlaying || 'Now Playing'} <span class="mobile-year">${translateDate(release.year, t)}</span></h2>
      <h3>${release.name}</h3>
      <img src="${release.cover}" alt="${release.name}" class="album-cover-featured" loading="lazy">
      ${desc ? `<p>${desc}</p>` : ''}
      ${release.embed ? `<div class="detail-player-section">${release.embed}<div class="player-ghost"></div></div>` : ''}
      ${tracklistHtml}
    </section>`;
}

function renderGenres(genres) {
  return genres.map((g) => `<span class="genre-tag">${g}</span>`).join('');
}

function renderMembers(project, t) {
  const projT = t.projects?.[project.id] || {};
  return project.members
    .map((m) => `<li><strong>${m.name}</strong> — ${projT.members?.[m.name] || m.role}</li>`)
    .join('');
}

function renderLinks(links) {
  return links
    .map((l) => {
      const svg = SOCIAL_ICONS[l.label] || '';
      return `<a href="${l.url}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="${l.label}">${svg}</a>`;
    })
    .join('');
}

function renderDescription(project, t) {
  const projT = t.projects?.[project.id] || {};
  return (projT.description || project.description)
    .map((p) => `<p class="detail-description">${p}</p>`)
    .join('');
}

function renderAlbumSelector(project, defaultFeatured, t) {
  if (project.releases.length <= 1) return '';

  const typeOrder = ['Album', 'EP', 'Single', 'Cover'];
  const grouped = {};
  project.releases.forEach((r) => {
    const typeName = r.type || 'Single';
    if (!grouped[typeName]) grouped[typeName] = [];
    grouped[typeName].push(r);
  });

  return `
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
    </div>`;
}

function renderDiscography(project, t) {
  const releasesHtml = project.releases
    .map(
      (r) => `
      <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="album-card">
        <img src="${r.cover}" alt="${r.name}" class="album-cover" loading="lazy" decoding="async">
        <div class="album-info">
          <span class="album-type">${t.labels?.releaseTypes?.[r.type] || r.type}</span>
          <p class="album-name">${r.name}</p>
          <p class="album-year">${translateDate(r.year, t)}</p>
        </div>
      </a>`
    )
    .join('');

  return `
    <section class="discography">
      <div class="section-label bare section-label--spaced">
        <span>${t.site?.discography || 'Discography'}</span>
        <span class="count">${pad2(project.releases.length)}</span>
      </div>
      <div class="discography-grid">${releasesHtml}</div>
    </section>`;
}

function renderPhotos(project, t, photoPreview) {
  if (!project.photos?.length) return '';

  const photos = project.photos.map((p) => ({ ...p, projectName: project.name }));
  const photosHtml = photos
    .slice(0, photoPreview)
    .map(
      (p, i) => `
      <div class="photo-card" data-type="photos" data-index="${i}" role="button" tabindex="0" aria-label="${t.site?.photos || 'Photo'} ${i + 1}: ${project.name}">
        <img src="${p.src}" alt="${project.name}" loading="lazy" decoding="async">
        <span class="photo-caption">${project.name}</span>
      </div>`
    )
    .join('');

  return `
    <section class="project-photos">
      <div class="section-label bare section-label--spaced">
        <span>${t.site?.photos || 'Photos'}</span>
        <span class="count">${pad2(project.photos.length)}</span>
      </div>
      <div class="photos-grid" id="photos-grid">${photosHtml}</div>
      ${
        project.photos.length > photoPreview
          ? `<div class="illustration-show-more"><a href="#" id="photos-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(project.photos.length)}</span></a></div>`
          : ''
      }
    </section>`;
}

function renderFlyers(project, t, flyerPreview) {
  const sortedFlyers = project.flyers?.length ? sortByDateDesc(project.flyers) : [];
  if (!sortedFlyers.length) return '';

  const flyersHtml = sortedFlyers
    .slice(0, flyerPreview)
    .map(
      (f, i) => `
      <div class="illustration-item" data-label="${(f.caption || '').replace(/"/g, '&quot;')}" data-type="flyers" data-index="${i}" role="button" tabindex="0" aria-label="${t.site?.flyers || 'Flyer'} ${i + 1}: ${(f.caption || '').replace(/"/g, '&quot;')}">
        <img src="${f.src}" alt="${f.caption || ''}" loading="lazy" decoding="async">
      </div>`
    )
    .join('');

  return `
    <section class="project-photos" id="flyers-section">
      <div class="section-label bare section-label--spaced">
        <span>${t.site?.flyers || 'Flyers'}</span>
        <span class="count">${pad2(sortedFlyers.length)}</span>
      </div>
      <div class="illustrations-grid" id="flyers-grid">${flyersHtml}</div>
      ${
        sortedFlyers.length > flyerPreview
          ? `<div class="illustration-show-more"><a href="#" id="flyers-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(sortedFlyers.length)}</span></a></div>`
          : ''
      }
    </section>`;
}

function renderVideos(project, t) {
  if (!project.videos?.length) return '';

  const videosHtml = project.videos
    .map(
      (v, i) => `
      <div class="video-card" data-video-index="${i}" role="button" tabindex="0" aria-label="${t.site?.videos || 'Video'}: ${v.title}">
        <iframe class="video-iframe" src="https://www.youtube.com/embed/${v.videoId}" frameborder="0" allowfullscreen loading="lazy" title="${v.title}" tabindex="-1"></iframe>
      </div>`
    )
    .join('');

  return `
    <section class="project-videos">
      <div class="section-label bare section-label--spaced">
        <span>${t.site?.videos || 'Videos'}</span>
        <span class="count">${pad2(project.videos.length)}</span>
      </div>
      <div class="videos-grid">${videosHtml}</div>
    </section>`;
}

function renderDetailHeader(project, t, defaultFeatured) {
  const timelineHtml = project.yearsActive
    ? `
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
    </div>`
    : '';

  return `
    <section class="detail-header">
      <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
      <div class="detail-hero">
        <div class="detail-left">
          <img src="${project.cover}" alt="${project.name}" class="detail-cover" decoding="async">
          ${renderFeaturedRelease(project, defaultFeatured, t)}
        </div>
        <div class="detail-info">
          <h1>${project.name}</h1>
          ${timelineHtml}
          <div class="detail-genres">${renderGenres(project.genres)}</div>
          <p class="detail-location">${t.labels?.location || 'Location'}: ${project.location}</p>
          ${renderDescription(project, t)}
          ${renderAlbumSelector(project, defaultFeatured, t)}
          <div class="detail-members">
            <h3>${t.labels?.members || 'Members'}</h3>
            <ul class="member-list">${renderMembers(project, t)}</ul>
          </div>
          <div class="detail-links">${renderLinks(project.links)}</div>
        </div>
      </div>
    </section>`;
}

function updateEmbedColor(color) {
  const iframe = document.querySelector('.detail-player-section iframe');
  if (iframe) {
    const hex = color.replace('#', '');
    iframe.src = iframe.src.replace(/linkcol=[a-f0-9]{6}/i, `linkcol=${hex}`);
  }
}

function applyProjectColorSet(colors) {
  const root = document.documentElement.style;
  root.setProperty('--section-accent', colors[0]);
  root.setProperty('--section-accent-secondary', colors[1]);
  root.setProperty('--section-accent-tertiary', colors[2]);
  updateEmbedColor(colors[0]);
  refreshCursorColor();
}

function setupAlbumSelector(project, t) {
  const selector = document.getElementById('album-selector');
  if (!selector) return;

  selector.addEventListener('change', () => {
    const selected = project.releases.find((r) => r.name === selector.value);
    const section = document.getElementById('featured-section');
    if (!section || !selected) return;

    section.classList.add('fade-out');
    const url = new URL(window.location);
    url.searchParams.set('album', selected.name);
    window.history.replaceState({}, '', url);

    setTimeout(() => {
      section.outerHTML = renderFeaturedRelease(project, selected, t);
      setTimeout(() => {
        document.getElementById('featured-section')?.classList.remove('fade-out');
      }, 30);
      setTimeout(() => {
        document.querySelector('.player-ghost')?.classList.add('hide');
      }, 120);
      extractColors(selected.cover)
        .then((colors) => {
          applyProjectColorSet(colors);
        })
        .catch(() => {});
    }, 200);
  });
}

function setupShowMoreButtons(project, t, photoPreview, flyerPreview, isMobile) {
  const projectPhotos = project.photos?.map((p) => ({ ...p, projectName: project.name })) || [];
  const sortedFlyers = project.flyers?.length ? sortByDateDesc(project.flyers) : [];

  const photosBtn = document.getElementById('photos-show-more');
  photosBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      if (isMobile) {
        openModal(projectPhotos, photoPreview);
        return;
      }
      const grid = document.getElementById('photos-grid');
      if (!grid) return;
      const remaining = project.photos.slice(photoPreview);
      const extraHtml = remaining
        .map(
          (p, i) => `
        <div class="photo-card" data-type="photos" data-index="${photoPreview + i}" role="button" tabindex="0" aria-label="${t.site?.photos || 'Photo'} ${photoPreview + i + 1}: ${project.name}">
          <img src="${p.src}" alt="${project.name}" loading="lazy" decoding="async">
          <span class="photo-caption">${project.name}</span>
        </div>`
        )
        .join('');
      grid.insertAdjacentHTML('beforeend', extraHtml);
      photosBtn.remove();
    } catch (_) {}
  });

  const flyersBtn = document.getElementById('flyers-show-more');
  flyersBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      if (isMobile) {
        openModal(sortedFlyers, flyerPreview);
        return;
      }
      const grid = document.getElementById('flyers-grid');
      if (!grid) return;
      const remaining = sortedFlyers.slice(flyerPreview);
      const extraHtml = remaining
        .map(
          (f, i) => `
        <div class="illustration-item" data-label="${(f.caption || '').replace(/"/g, '&quot;')}" data-type="flyers" data-index="${flyerPreview + i}" role="button" tabindex="0" aria-label="${t.site?.flyers || 'Flyer'} ${flyerPreview + i + 1}: ${(f.caption || '').replace(/"/g, '&quot;')}">
          <img src="${f.src}" alt="${f.caption || ''}" loading="lazy" decoding="async">
        </div>`
        )
        .join('');
      grid.insertAdjacentHTML('beforeend', extraHtml);
      flyersBtn.remove();
    } catch (_) {}
  });
}

function setupModals(project) {
  const sortedFlyers = project.flyers?.length ? sortByDateDesc(project.flyers) : [];
  const projectPhotos = project.photos?.map((p) => ({ ...p, projectName: project.name })) || [];

  document.querySelectorAll('#flyers-grid .illustration-item').forEach((card) => {
    const index = parseInt(card.dataset.index, 10);
    makeAccessible(card, () => openModal(sortedFlyers, index));
  });

  document.querySelectorAll('.photo-card').forEach((card) => {
    makeAccessible(card, () => {
      const type = card.dataset.type;
      const index = parseInt(card.dataset.index, 10);
      const items = type === 'photos' ? projectPhotos : sortedFlyers;
      if (!items?.[index]) return;
      if (!items[index].caption && items[index].src?.startsWith('data:')) return;
      openModal(items, index);
    });
  });

  document.querySelectorAll('.video-card').forEach((card) => {
    const index = parseInt(card.dataset.videoIndex, 10);
    makeAccessible(card, () => openModal(project.videos, index));
  });
}

function applyInitialColors(project) {
  const colors = colorCache[project.id];
  if (colors) {
    applyProjectColorSet(colors);
    return;
  }

  const fallback = getColorFallback(project);
  applyProjectColorSet(fallback);
}

export function renderProjectContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  const t = i18nData?.[currentLocale] || i18nData?.en || {};
  const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
  const photoPreview = isMobile ? PREVIEW_COUNTS.photos.mobile : PREVIEW_COUNTS.photos.desktop;
  const flyerPreview = isMobile ? PREVIEW_COUNTS.flyers.mobile : PREVIEW_COUNTS.flyers.desktop;

  if (!i18nData || !siteData || !currentProject) {
    document.getElementById('project-content').innerHTML = `
      <div class="error-message error-message--page">
        <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
        <h1>${t.site?.notFound || 'Project not found'}</h1>
      </div>`;
    return;
  }

  const project = currentProject;
  const defaultFeatured = project.releases.find((r) => r.featured) || project.releases[0];
  const sortedFlyers = project.flyers?.length ? sortByDateDesc(project.flyers) : [];

  document.getElementById('project-content').innerHTML = `
    ${renderDetailHeader(project, t, defaultFeatured)}
    ${renderDiscography(project, t)}
    ${renderPhotos(project, t, photoPreview)}
    ${renderFlyers(project, t, flyerPreview)}
    ${renderVideos(project, t)}`;

  document.querySelectorAll('a, button, .album-card, .photo-card').forEach(attachCursor);

  setupShowMoreButtons(project, t, photoPreview, flyerPreview, isMobile);
  setupModals(project);
  setupAlbumSelector(project, t);
  applyInitialColors(project);

  // Auto-select album from URL param
  const albumParam = new URLSearchParams(window.location.search).get('album');
  const sel = document.getElementById('album-selector');
  const autoAlbum = albumParam && sel && project.releases.find((r) => r.name === albumParam);
  if (autoAlbum) {
    sel.value = autoAlbum.name;
    const section = document.getElementById('featured-section');
    if (section) {
      section.outerHTML = renderFeaturedRelease(project, autoAlbum, t);
      setTimeout(() => {
        document.querySelector('.player-ghost')?.classList.add('hide');
      }, 400);
      extractColors(autoAlbum.cover)
        .then((colors) => applyProjectColorSet(colors))
        .catch(() => {});
    }
  } else {
    extractColors(project.cover)
      .then((colors) => {
        applyProjectColors(project.id, colors);
        applyProjectColorSet(colors);
      })
      .catch(() => {
        const fb = getColorFallback(project);
        applyProjectColors(project.id, fb);
        applyProjectColorSet(fb);
      });
  }

  // Hide skeleton ghost after initial load
  setTimeout(() => {
    document.querySelector('.player-ghost')?.classList.add('hide');
  }, 120);
}

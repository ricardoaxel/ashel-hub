import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { attachCursor } from '../cursor.js';
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
    .map((l) => `<a href="${l.url}" target="_blank" class="btn-small">${l.label}</a>`)
    .join('');
  const descriptionHtml = (projT.description || project.description)
    .map((p) => `<p class="detail-description">${p}</p>`)
    .join('');

  function renderFeatured(release) {
    if (!release) return '';
    const desc = projT.releases?.[release.name] || release.description;
    return `
      <section class="featured-release" id="featured-section">
        <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
          <span>${t.site?.featuredRelease || 'Featured Release'}</span>
          <span class="count">${translateDate(release.year, t)}</span>
        </div>
        <h2>${t.site?.nowPlaying || 'Now Playing'}</h2>
        <h3>${release.name}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
        ${release.embed ? `<div class="detail-player-section">${release.embed}</div>` : ''}
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
            .filter((t) => grouped[t])
            .map(
              (t) => `
          <optgroup label="${t.labels?.releaseTypes?.[t] || t}">
            ${grouped[t].map((r) => `<option value="${r.name}" ${r.name === defaultFeatured.name ? 'selected' : ''}>${r.name} (${translateDate(r.year, t)})</option>`).join('')}
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
        return new Date(a.date) - new Date(b.date);
      })
    : [];

  const flyersCount = project.flyers?.length || 0;

  const noFlyersPlaceholder = [
    {
      src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#1a1a1a"/><g stroke="#333" stroke-width="1" opacity="0.3"><line x1="0" y1="0" x2="800" y2="600"/><line x1="200" y1="0" x2="800" y2="400"/><line x1="400" y1="0" x2="800" y2="200"/><line x1="0" y1="200" x2="600" y2="800"/><line x1="0" y1="400" x2="400" y2="800"/></g><text x="400" y="290" font-family="monospace" font-size="28" fill="#444" text-anchor="middle" letter-spacing="4">NO FLYERS</text><text x="400" y="330" font-family="monospace" font-size="14" fill="#333" text-anchor="middle" letter-spacing="2">AVAILABLE</text></svg>')}`,
      caption: '',
    },
  ];

  const displayFlyers = sortedFlyers.length ? sortedFlyers : noFlyersPlaceholder;

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
      <div class="photos-grid">
        ${project.photos
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
    </section>`
        : ''
    }

    <section class="project-photos">
      <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
        <span>${t.site?.flyers || 'Flyers'}</span>
        <span class="count">${String(flyersCount).padStart(2, '0')}</span>
      </div>
      <div class="photos-grid">
        ${displayFlyers
          .map(
            (f, i) => `
          <div class="photo-card" data-type="flyers" data-index="${i}">
            <img src="${f.src}" alt="${f.caption || ''}" loading="lazy" decoding="async">
            ${f.caption ? `<span class="photo-caption">${f.caption}</span>` : ''}
          </div>
        `
          )
          .join('')}
      </div>
    </section>`;

  document.querySelectorAll('a, button, .album-card, .photo-card').forEach(attachCursor);

  document.querySelectorAll('.photo-card').forEach((card) => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      const index = parseInt(card.dataset.index);
      const items = type === 'photos' ? project.photos : displayFlyers;
      if (!items?.[index]) return;
      if (!items[index].caption && items[index].src?.startsWith('data:')) return;
      openModal(items, index);
    });
  });

  const selector = document.getElementById('album-selector');
  selector?.addEventListener('change', () => {
    const selected = project.releases.find((r) => r.name === selector.value);
    const section = document.getElementById('featured-section');
    if (section && selected) {
      section.outerHTML = renderFeatured(selected);
      document.querySelector('.detail-cover').src = selected.cover;
      extractColors(selected.cover)
        .then((colors) => {
          const root = document.documentElement.style;
          root.setProperty('--section-accent', colors[0]);
          root.setProperty('--section-accent-secondary', colors[1]);
          root.setProperty('--section-accent-tertiary', colors[2]);
        })
        .catch(() => {});
    }
  });

  const colors = colorCache[project.id];
  if (colors) {
    const root = document.documentElement.style;
    root.setProperty('--section-accent', colors[0]);
    root.setProperty('--section-accent-secondary', colors[1]);
    root.setProperty('--section-accent-tertiary', colors[2]);
  } else {
    const fallback = getColorFallback(project);
    const root = document.documentElement.style;
    root.setProperty('--section-accent', fallback[0]);
    root.setProperty('--section-accent-secondary', fallback[1]);
    root.setProperty('--section-accent-tertiary', fallback[2]);
  }

  extractColors(project.cover)
    .then((extracted) => applyProjectColors(project.id, extracted))
    .catch(() => applyProjectColors(project.id, getColorFallback(project)));
}

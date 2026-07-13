import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { colorCache, getColorFallback } from '../colors.js';
import { attachCursor } from '../cursor.js';
import { openModal } from '../modal.js';

let heroColors = ['#ff2d55', '#5856d6', '#00d4aa'];

export function getHeroColors() {
  return heroColors;
}

function updateHeroColors() {
  const data = getSiteData();
  if (!data) return;
  const top3 = data.projects.slice(0, 3);
  const allLoaded = top3.every((p) => colorCache[p.id]);
  if (!allLoaded) return;
  heroColors = [colorCache[top3[0].id][0], colorCache[top3[1].id][0], colorCache[top3[2].id][0]];
}

export function applyCardColors() {
  const data = getSiteData();
  if (!data) return;
  const cards = document.querySelectorAll('.project-card');
  data.projects.forEach((project, index) => {
    const colors = colorCache[project.id];
    if (!colors) return;
    const card = cards[index];
    if (card) {
      card.style.setProperty('--section-accent', colors[0]);
      card.style.setProperty('--section-accent-secondary', colors[1]);
      card.style.setProperty('--section-accent-tertiary', colors[2]);
      const badge = card.querySelector('.project-badge');
      if (badge) badge.style.background = colors[0];
      card.querySelectorAll('.genre-tag').forEach((g) => {
        g.style.borderColor = colors[0];
      });
    }
  });
  updateHeroColors();
}

export function renderIndexContent() {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const data = siteData;

  document.getElementById('hero-tagline').textContent = t.site?.subtitle || data.site.subtitle;

  const marqueeItems = data.projects
    .map(
      (p) =>
        `<span>${p.name} <span class="accent">—</span> ${p.genres.slice(0, 2).join(' / ')}</span>`
    )
    .join('');
  document.getElementById('marquee').innerHTML = marqueeItems + marqueeItems;
  setTimeout(() => {
    document.querySelector('.marquee-content')?.classList.add('animate');
  }, 2000);

  const projectsHtml = data.projects
    .map(
      (p, i) => `
      <a href="project.html?id=${p.id}" class="project-card" id="project-${p.id}">
        <div class="project-cover-wrap">
          <img src="${p.cover}" alt="${p.name}" class="project-cover" loading="lazy" decoding="async">
          ${p.badge ? `<span class="project-badge">${p.badge}</span>` : ''}
        </div>
        <div class="project-info">
          <span class="project-number">${String(i + 1).padStart(2, '0')}</span>
          ${p.yearsActive ? `
          <div class="project-timeline">
            <div class="tl-track">
              <span class="tl-dot"></span>
              <span class="tl-line"></span>
              <span class="tl-dot"></span>
            </div>
            <div class="tl-labels">
              <span class="tl-year">${p.yearsActive.start}</span>
              <span class="tl-year">${p.yearsActive.end || t.labels?.present || 'Present'}</span>
            </div>
          </div>` : ''}
          <h2 class="project-name">${p.name}</h2>
          <div class="project-genres">
            ${p.genres.map((g) => `<span class="genre-tag">${g}</span>`).join('')}
          </div>
          <p class="project-desc">${t.projects?.[p.id]?.shortDescription || p.shortDescription}</p>
          <span class="project-arrow">→</span>
        </div>
      </a>`
    )
    .join('');
  document.getElementById('projects-grid').innerHTML = projectsHtml;

  document.getElementById('project-count').textContent = String(data.projects.length).padStart(
    2,
    '0'
  );

  // ── Release Timeline ──
  const allReleases = [];
  data.projects.forEach((p) => {
    (p.releases || []).forEach((r) => {
      if (r.type === 'Single' || r.type === 'Cover') return;
      let year = 0;
      try { year = parseInt((r.year || '').split(' ').pop()) || 0; } catch (_) {}
      allReleases.push({
        project: p.id,
        projectName: p.name,
        name: r.name,
        year,
        cover: r.cover,
        url: r.url,
      });
    });
  });
  allReleases.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));

  if (allReleases.length) {
    const minYear = allReleases[0].year;
    const maxYear = allReleases[allReleases.length - 1].year;
    const yearSpan = maxYear - minYear || 1;
    const total = allReleases.length;

    // Build unique sorted years list
    const years = [...new Set(allReleases.map((r) => r.year))].sort();

    // Equal spacing for releases (6% to 94% to avoid edge clipping)
    const coverItems = allReleases.map((r, i) => ({
      ...r,
      pct: total > 1 ? (6 + (i / (total - 1)) * 88).toFixed(1) : '50',
    }));

    // Equal spacing for years (6% to 94% to avoid edge clipping)
    const yearItems = years.map((y, i) => ({
      year: y,
      pct: years.length > 1 ? (6 + (i / (years.length - 1)) * 88).toFixed(1) : '50',
    }));

    const timelineHtml = `
      <div class="release-timeline" id="release-timeline">
        <div class="tl-rail">
          <div class="tl-rail-track">
            <span class="tl-rail-dot"></span>
            <span class="tl-rail-line"></span>
            <span class="tl-rail-dot"></span>
          </div>

          ${yearItems
            .map(
              (y) => `
          <span class="tl-year-tick" style="left:${y.pct}%">
            <span class="tl-year-tick-label">${y.year}</span>
            <span class="tl-year-tick-line"></span>
          </span>`
            )
            .join('')}

          ${coverItems
            .map(
              (r) => `
          <a href="project.html?id=${r.project}&album=${encodeURIComponent(r.name)}" class="tl-item" style="left:${r.pct}%">
            <span class="tl-item-label">
              <span class="tl-item-proj">${r.projectName}</span>
              <span class="tl-item-name">${r.name} (${r.year})</span>
            </span>
            <span class="tl-pin"></span>
            <span class="tl-cover" style="background-image:url(${r.cover})"></span>
          </a>`
            )
            .join('')}
        </div>
      </div>`;

    const projectsSection = document.getElementById('projects');
    const grid = document.getElementById('projects-grid');
    if (projectsSection && grid) {
      grid.insertAdjacentHTML('beforebegin', timelineHtml);
    }
  }

  // Single compact card linking to extras page
  const otherCount = (data.other || []).length;
  if (otherCount) {
    const grid = document.getElementById('projects-grid');
    const otherHtml = `
      <a href="other.html" class="project-card other-card">
        <div class="project-cover-wrap other-cover-wrap">
          <div class="other-badge">✦</div>
        </div>
        <div class="project-info other-info">
          <div>
            <span class="project-number">${String(data.projects.length + 1).padStart(2, '0')}</span>
            <div class="project-timeline">
              <div class="tl-track"><span class="tl-dot"></span><span class="tl-line"></span><span class="tl-dot"></span></div>
              <div class="tl-labels"><span class="tl-year">misc</span><span class="tl-year">${String(otherCount).padStart(2, '0')}</span></div>
            </div>
            <h2 class="project-name">Extras</h2>
          </div>
          <span class="project-arrow">→</span>
        </div>
      </a>`;
    grid.insertAdjacentHTML('beforeend', otherHtml);
  }

  const allPhotos = [];
  data.projects.forEach((p) => {
    if (p.photos) {
      p.photos.forEach((photo) => {
        allPhotos.push({ ...photo, projectName: p.name });
      });
    }
  });
  for (let i = allPhotos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPhotos[i], allPhotos[j]] = [allPhotos[j], allPhotos[i]];
  }
  const galleryPreviewCount = Math.min(9, allPhotos.length);
  document.getElementById('gallery-count').textContent = String(allPhotos.length).padStart(
    2,
    '0'
  );
  const galleryHtml = allPhotos
    .slice(0, galleryPreviewCount)
    .map(
      (photo, i) => `
      <div class="gallery-item" data-label="${photo.projectName}" data-index="${i}">
        <img src="${photo.src}" alt="${photo.caption || photo.projectName}" loading="lazy" decoding="async">
      </div>`
    )
    .join('');
  document.getElementById('gallery-grid').innerHTML = galleryHtml;
  document.querySelectorAll('.gallery-item').forEach((el) => {
    const index = parseInt(el.dataset.index, 10);
    el.addEventListener('click', () => openModal(allPhotos, index));
  });
  if (allPhotos.length > galleryPreviewCount) {
    const grid = document.getElementById('gallery-grid');
    const showMore = document.createElement('div');
    showMore.className = 'illustration-show-more';
    showMore.innerHTML = `<a href="#" id="gallery-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${String(allPhotos.length).padStart(2, '0')}</span></a>`;
    grid.parentNode.appendChild(showMore);
    showMore.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      showMore.remove();
      const remaining = allPhotos.slice(galleryPreviewCount);
      const extraHtml = remaining
        .map(
          (photo, i) => `
        <div class="gallery-item" data-label="${photo.projectName}" data-index="${galleryPreviewCount + i}">
          <img src="${photo.src}" alt="${photo.caption || photo.projectName}" loading="lazy" decoding="async">
        </div>`
        )
        .join('');
      grid.insertAdjacentHTML('beforeend', extraHtml);
      document.querySelectorAll('.gallery-item').forEach((el) => {
        const index = parseInt(el.dataset.index, 10);
        el.addEventListener('click', () => openModal(allPhotos, index));
      });
    });
  }

  document.getElementById('illustrations-count').textContent = String(data.illustrations.length).padStart(
    2,
    '0'
  );

  const previewCount = Math.min(6, data.illustrations.length);
  const illustrationsHtml = data.illustrations
    .slice(0, previewCount)
    .map(
      (item, i) => `
      <div class="illustration-item" data-label="Illustration ${String(i + 1).padStart(2, '0')}" data-index="${i}">
        <img src="${item.src}" alt="" loading="lazy" decoding="async">
      </div>`
    )
    .join('');
  document.getElementById('illustrations-grid').innerHTML = illustrationsHtml;

  const totalCount = data.illustrations.length;
  const grid = document.getElementById('illustrations-grid');
  if (totalCount > previewCount) {
    const showMore = document.createElement('div');
    showMore.className = 'illustration-show-more';
    showMore.innerHTML = `<a href="illustrations.html">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${String(totalCount).padStart(2, '0')}</span></a>`;
    grid.parentNode.appendChild(showMore);
  }

  const dataIllustrations = data.illustrations;
  document.querySelectorAll('.illustration-item').forEach((el) => {
    const index = parseInt(el.dataset.index, 10);
    el.addEventListener('click', () => openModal(dataIllustrations, index));
  });

  const mainIds = data.site.mainVideos || [];
  const allVideos = [];
  mainIds.forEach((id) => {
    for (const p of data.projects) {
      const v = (p.videos || []).find((v) => v.videoId === id);
      if (v) {
        allVideos.push({ ...v, projectName: p.name, projectId: p.id });
        break;
      }
    }
  });
  const videoPreviewCount = Math.min(6, allVideos.length);
  document.getElementById('videos-count').textContent = String(allVideos.length).padStart(2, '0');
  const videosHtml = allVideos
    .slice(0, videoPreviewCount)
    .map(
      (v, i) => `
      <div class="video-card" data-video-index="${i}">
        <iframe src="https://www.youtube.com/embed/${v.videoId}" frameborder="0" allowfullscreen loading="lazy" style="position:absolute;inset:0;width:100%;height:100%" title="${v.title}"></iframe>
      </div>`
    )
    .join('');
  document.getElementById('videos-grid').innerHTML = videosHtml;
  document.querySelectorAll('.video-card').forEach((el) => {
    const index = parseInt(el.dataset.videoIndex, 10);
    el.addEventListener('click', () => openModal(allVideos, index));
  });

  const socialHtml = data.site.social
    .map((s) => `<a href="${s.url}" target="_blank">${s.label}</a>`)
    .join('');
  document.getElementById('social-links').innerHTML = socialHtml;

  const statKeys = ['projects', 'tracks', 'years'];
  const statLabels = t.stats || {
    projects: 'Projects',
    tracks: 'Tracks Released',
    years: 'Years Active',
  };
  const bioText = t.site?.bio || data.site.bio;

  document.getElementById('about-text').innerHTML = `
    <h3>Ashel</h3>
    ${bioText.map((b) => `<p>${b}</p>`).join('')}
    <div class="stats">
      ${data.site.stats
        .map(
          (s, i) => `
        <div class="stat">
          <span class="stat-number">${s.number}</span>
          <span class="stat-label">${statLabels[statKeys[i]] || s.label}</span>
        </div>`
        )
        .join('')}
    </div>`;

  applyCardColors();

  document
    .querySelectorAll('a, .project-card, .album-card, .gallery-item, .illustration-item, button')
    .forEach(attachCursor);
}

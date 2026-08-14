import { getSiteData, getI18nData } from '../data.js';
import { getLocale } from '../i18n.js';
import { colorCache, getColorFallback } from '../colors.js';
import { attachCursor } from '../cursor.js';
import { openModal } from '../modal.js';
import { makeAccessible, pad2, shuffleArray } from '../utils.js';
import { BREAKPOINTS, PREVIEW_COUNTS, DEFAULT_HERO_COLORS } from '../config.js';

let heroColors = [...DEFAULT_HERO_COLORS];

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

function renderProjectCard(p, i, t) {
  const timelineHtml = p.yearsActive
    ? `
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
    </div>`
    : '';

  return `
    <a href="project.html?id=${p.id}" class="project-card" id="project-${p.id}">
      <div class="project-cover-wrap">
        <img src="${p.cover}" alt="${p.name}" class="project-cover" loading="eager" decoding="async">
        ${p.badge ? `<span class="project-badge">${p.badge}</span>` : ''}
      </div>
      <div class="project-info">
        <span class="project-number">${pad2(i + 1)}</span>
        ${timelineHtml}
        <h2 class="project-name">${p.name}</h2>
        <div class="project-genres">
          ${p.genres.map((g) => `<span class="genre-tag">${g}</span>`).join('')}
        </div>
        <p class="project-desc">${t.projects?.[p.id]?.shortDescription || p.shortDescription}</p>
        <span class="project-arrow">→</span>
      </div>
    </a>`;
}

function renderMarquee(data, isUpdate) {
  const marquee = document.getElementById('marquee');
  if (!isUpdate || !marquee.innerHTML.trim()) {
    const marqueeItems = data.projects
      .map(
        (p) =>
          `<span>${p.name} <span class="accent">—</span> ${p.genres.slice(0, 2).join(' / ')}</span>`
      )
      .join('');
    marquee.innerHTML = marqueeItems + marqueeItems;
    setTimeout(() => {
      document.querySelector('.marquee-content')?.classList.add('animate');
    }, 2000);
  }
}

function renderProjectsGrid(data, t, isUpdate) {
  const grid = document.getElementById('projects-grid');
  const existingCards = grid.querySelectorAll('.project-card:not(.other-card)');

  if (isUpdate && existingCards.length === data.projects.length) {
    existingCards.forEach((card, i) => {
      const p = data.projects[i];
      const desc = card.querySelector('.project-desc');
      if (desc) desc.textContent = t.projects?.[p.id]?.shortDescription || p.shortDescription;
      if (p.yearsActive && !p.yearsActive.end) {
        const endYear = card.querySelector('.project-timeline .tl-labels .tl-year:last-child');
        if (endYear) endYear.textContent = t.labels?.present || 'Present';
      }
    });
  } else {
    grid.innerHTML = data.projects.map((p, i) => renderProjectCard(p, i, t)).join('');
  }

  document.getElementById('project-count').textContent = pad2(data.projects.length);
}

function renderReleaseTimeline(data, isUpdate) {
  if (isUpdate) return;

  const allReleases = [];
  data.projects.forEach((p) => {
    (p.releases || []).forEach((r) => {
      if (r.type === 'Single' || r.type === 'Cover') return;
      const year = parseInt((r.year || '').split(' ').pop()) || 0;
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

  if (!allReleases.length) return;

  const years = [...new Set(allReleases.map((r) => r.year))].sort();
  const total = allReleases.length;

  // Position ticks/items between 6% and 94% of the rail to avoid edge clipping.
  const MIN_PCT = 6;
  const MAX_PCT = 94;
  const spread = (index, count) =>
    count > 1 ? (MIN_PCT + (index / (count - 1)) * (MAX_PCT - MIN_PCT)).toFixed(1) : '50';

  const coverItems = allReleases.map((r, i) => ({ ...r, pct: spread(i, total) }));
  const yearItems = years.map((y, i) => ({ year: y, pct: spread(i, years.length) }));

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
        <span class="tl-year-tick" style="--tl-pct:${y.pct}%">
          <span class="tl-year-tick-label">${y.year}</span>
          <span class="tl-year-tick-line"></span>
        </span>`
          )
          .join('')}

        ${coverItems
          .map(
            (r) => `
        <a href="project.html?id=${r.project}&album=${encodeURIComponent(r.name)}" class="tl-item" style="--tl-pct:${r.pct}%">
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
    const old = document.getElementById('release-timeline');
    if (old) old.remove();
    grid.insertAdjacentHTML('beforebegin', timelineHtml);
  }
}

function renderOtherCard(data, t, isUpdate) {
  const grid = document.getElementById('projects-grid');
  const otherCount = (data.other || []).length;
  const existingOther = grid.querySelector('.other-card');

  if (!otherCount) {
    if (existingOther) existingOther.remove();
    return;
  }

  if (isUpdate && existingOther) {
    const otherLabel = existingOther.querySelector('.tl-labels .tl-year:first-child');
    if (otherLabel) otherLabel.textContent = t.site?.otherLabel || 'misc';
    const otherTitle = existingOther.querySelector('.project-name');
    if (otherTitle) otherTitle.textContent = t.labels?.otherSection || 'Extras';
    const otherDesc = existingOther.querySelector('.other-desc');
    if (otherDesc)
      otherDesc.textContent =
        t.site?.otherDesc || 'Side projects, collaborations, experiments, and other odds & ends.';
    return;
  }

  const otherHtml = `
    <a href="other.html" class="project-card other-card">
      <div class="project-cover-wrap other-cover-wrap">
        <div class="other-badge">✦</div>
      </div>
      <div class="project-info other-info">
        <div>
          <span class="project-number">${pad2(data.projects.length + 1)}</span>
          <div class="project-timeline">
            <div class="tl-track"><span class="tl-dot"></span><span class="tl-line"></span><span class="tl-dot"></span></div>
            <div class="tl-labels"><span class="tl-year">${t.site?.otherLabel || 'misc'}</span><span class="tl-year">${pad2(otherCount)}</span></div>
          </div>
          <h2 class="project-name">${t.labels?.otherSection || 'Extras'}</h2>
          <p class="other-desc">${t.site?.otherDesc || 'Side projects, collaborations, experiments, and other odds & ends.'}</p>
        </div>
        <span class="project-arrow">→</span>
      </div>
    </a>`;
  if (existingOther) existingOther.remove();
  grid.insertAdjacentHTML('beforeend', otherHtml);
}

function getGalleryPhotos(data) {
  const allPhotos = [];
  data.projects.forEach((p) => {
    if (p.photos) {
      p.photos.forEach((photo) => {
        allPhotos.push({ ...photo, projectName: p.name });
      });
    }
  });
  return shuffleArray(allPhotos);
}

function renderGallery(data, t, isUpdate) {
  const allPhotos = getGalleryPhotos(data);
  const isMobile = window.innerWidth <= BREAKPOINTS.mobile;
  const columns = isMobile ? PREVIEW_COUNTS.gallery.mobileColumns : PREVIEW_COUNTS.gallery.desktopColumns;
  const galleryPreviewCount = Math.min(columns * PREVIEW_COUNTS.gallery.multiplier, allPhotos.length);

  document.getElementById('gallery-count').textContent = pad2(allPhotos.length);

  if (isUpdate) {
    const gallerySection = document.getElementById('gallery-grid')?.parentNode;
    const galleryShowMore = gallerySection?.querySelector('.illustration-show-more a');
    if (galleryShowMore) {
      galleryShowMore.innerHTML = `${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(allPhotos.length)}</span>`;
    }
    return;
  }

  const galleryHtml = allPhotos
    .slice(0, galleryPreviewCount)
    .map(
      (photo, i) => `
      <div class="gallery-item" data-label="${photo.projectName}" data-index="${i}" role="button" tabindex="0" aria-label="${t.site?.photos || 'Photo'} ${i + 1}: ${photo.projectName}">
        <img src="${photo.src}" alt="${photo.projectName}" loading="lazy" decoding="async">
      </div>`
    )
    .join('');
  document.getElementById('gallery-grid').innerHTML = galleryHtml;

  document.querySelectorAll('.gallery-item').forEach((el) => {
    const index = parseInt(el.dataset.index, 10);
    makeAccessible(el, () => openModal(allPhotos, index));
  });

  if (allPhotos.length <= galleryPreviewCount) return;

  const galleryGrid = document.getElementById('gallery-grid');
  const section = galleryGrid.parentNode;
  section.querySelectorAll('.illustration-show-more').forEach((el) => el.remove());

  const showMore = document.createElement('div');
  showMore.className = 'illustration-show-more';
  showMore.innerHTML = `<a href="#" id="gallery-show-more">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(allPhotos.length)}</span></a>`;
  section.appendChild(showMore);

  showMore.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    if (isMobile) {
      openModal(allPhotos, galleryPreviewCount);
      return;
    }
    showMore.remove();
    const remaining = allPhotos.slice(galleryPreviewCount);
    const extraHtml = remaining
      .map(
        (photo, i) => `
        <div class="gallery-item" data-label="${photo.projectName}" data-index="${galleryPreviewCount + i}">
          <img src="${photo.src}" alt="${photo.projectName}" loading="lazy" decoding="async">
        </div>`
      )
      .join('');
    galleryGrid.insertAdjacentHTML('beforeend', extraHtml);
    document.querySelectorAll('.gallery-item').forEach((el) => {
      const index = parseInt(el.dataset.index, 10);
      makeAccessible(el, () => openModal(allPhotos, index));
    });
  });
}

function renderIllustrationsPreview(data, t, isUpdate) {
  const totalCount = data.illustrations.length;
  const width = window.innerWidth;
  const illColumns =
    width <= BREAKPOINTS.small
      ? PREVIEW_COUNTS.illustrations.small
      : width <= BREAKPOINTS.mobile
        ? PREVIEW_COUNTS.illustrations.mobile
        : PREVIEW_COUNTS.illustrations.desktop;
  const previewCount = Math.min(illColumns * PREVIEW_COUNTS.illustrations.multiplier, totalCount);
  const illGrid = document.getElementById('illustrations-grid');
  const illSection = illGrid.parentNode;

  document.getElementById('illustrations-count').textContent = pad2(totalCount);

  if (!isUpdate) {
    const illustrationsHtml = data.illustrations
      .slice(0, previewCount)
      .map(
        (item, i) => `
        <div class="illustration-item" data-label="${t.labels?.illustration || 'Illustration'} ${pad2(i + 1)}" data-index="${i}" role="button" tabindex="0" aria-label="${t.labels?.illustration || 'Illustration'} ${pad2(i + 1)}">
          <img src="${item.src}" alt="" loading="lazy" decoding="async">
        </div>`
      )
      .join('');
    illGrid.innerHTML = illustrationsHtml;

    illSection.querySelectorAll('.illustration-show-more').forEach((el) => el.remove());
    if (totalCount > previewCount) {
      const showMore = document.createElement('div');
      showMore.className = 'illustration-show-more';
      showMore.innerHTML = `<a href="illustrations.html">${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(totalCount)}</span></a>`;
      illSection.appendChild(showMore);
    }

    document.querySelectorAll('.illustration-item').forEach((el) => {
      const index = parseInt(el.dataset.index, 10);
      makeAccessible(el, () => openModal(data.illustrations, index));
    });
  } else {
    const illItems = illGrid.querySelectorAll('.illustration-item');
    illItems.forEach((item, i) => {
      item.dataset.label = `${t.labels?.illustration || 'Illustration'} ${pad2(i + 1)}`;
    });
    const illShowMore = illSection.querySelector('.illustration-show-more a');
    if (illShowMore) {
      illShowMore.innerHTML = `${t.labels?.viewAll || 'VIEW ALL'} <span class="count">${pad2(totalCount)}</span>`;
    }
  }
}

function renderVideosPreview(data, t, isUpdate) {
  if (isUpdate) return;

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

  const width = window.innerWidth;
  const videoPreviewCount = Math.min(
    width <= BREAKPOINTS.mobile
      ? PREVIEW_COUNTS.videos.mobile
      : width <= BREAKPOINTS.tablet
        ? PREVIEW_COUNTS.videos.tablet
        : PREVIEW_COUNTS.videos.desktop,
    allVideos.length
  );

  document.getElementById('videos-count').textContent = pad2(allVideos.length);
  const videosHtml = allVideos
    .slice(0, videoPreviewCount)
    .map(
      (v, i) => `
      <div class="video-card" data-video-index="${i}" role="button" tabindex="0" aria-label="${t.site?.videos || 'Video'}: ${v.title}">
        <iframe class="video-iframe" src="https://www.youtube.com/embed/${v.videoId}" frameborder="0" allowfullscreen loading="lazy" title="${v.title}" tabindex="-1"></iframe>
      </div>`
    )
    .join('');
  document.getElementById('videos-grid').innerHTML = videosHtml;

  document.querySelectorAll('.video-card').forEach((el) => {
    const index = parseInt(el.dataset.videoIndex, 10);
    makeAccessible(el, () => openModal(allVideos, index));
  });
}

function renderSocialLinks(data, isUpdate) {
  if (isUpdate) return;
  const socialHtml = data.site.social
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`)
    .join('');
  document.getElementById('social-links').innerHTML = socialHtml;
}

function renderAbout(data, t, isUpdate) {
  const statKeys = ['projects', 'tracks', 'years'];
  const statLabels = t.stats || {
    projects: 'Projects',
    tracks: 'Tracks Released',
    years: 'Years Active',
  };
  const bioText = t.site?.bio || data.site.bio;
  const aboutEl = document.getElementById('about-text');

  if (!isUpdate) {
    aboutEl.innerHTML = `
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
  } else {
    const bioParagraphs = aboutEl.querySelectorAll('p');
    bioParagraphs.forEach((p, i) => {
      if (bioText[i]) p.textContent = bioText[i];
    });
    const statEls = aboutEl.querySelectorAll('.stat-label');
    statEls.forEach((el, i) => {
      el.textContent = statLabels[statKeys[i]] || data.site.stats[i]?.label;
    });
  }
}

export function renderIndexContent(isUpdate = false) {
  const i18nData = getI18nData();
  const siteData = getSiteData();
  const currentLocale = getLocale();
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const data = siteData;

  document.getElementById('hero-tagline').textContent = t.site?.subtitle || data.site.subtitle;

  renderMarquee(data, isUpdate);
  renderProjectsGrid(data, t, isUpdate);
  renderReleaseTimeline(data, isUpdate);
  renderOtherCard(data, t, isUpdate);
  renderGallery(data, t, isUpdate);
  renderIllustrationsPreview(data, t, isUpdate);
  renderVideosPreview(data, t, isUpdate);
  renderSocialLinks(data, isUpdate);
  renderAbout(data, t, isUpdate);

  applyCardColors();

  document
    .querySelectorAll('a, .project-card, .album-card, .gallery-item, .illustration-item, button')
    .forEach(attachCursor);
}

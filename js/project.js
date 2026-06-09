let currentProject = null;

function renderProjectContent() {
  if (!i18nData || !siteData || !currentProject) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const project = currentProject;
  const projT = t.projects?.[project.id] || {};

  const genresHtml = project.genres.map((g) => `<span class="genre-tag">${g}</span>`).join('');
  const membersHtml = project.members
    .map((m) => `<li><strong>${m.name}</strong> \u2014 ${projT.members?.[m.name] || m.role}</li>`)
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
    const embed = release.embed
      ? release.embed
      : '';
    return `
      <section class="featured-release" id="featured-section">
        <div class="section-label" style="border: none; padding: 0; margin-bottom: 2rem;">
          <span>${t.site?.featuredRelease || 'Featured Release'}</span>
          <span class="count">${release.year}</span>
        </div>
        <h2>${t.site?.nowPlaying || 'Now Playing'}</h2>
        <h3>${release.name}</h3>
        ${desc ? `<p>${desc}</p>` : ''}
        ${embed ? `<div class="detail-player-section">${embed}</div>` : ''}
      </section>`;
  }

  const defaultFeatured = project.releases.find((r) => r.featured) || project.releases[0];

  const selectorHtml =
    project.releases.length > 1
      ? `
      <div class="album-selector-wrap">
        <label>${t.site?.albumLabel || 'Album'}</label>
        <select id="album-selector">
          ${project.releases.map((r) => `<option value="${r.name}" ${r.name === defaultFeatured.name ? 'selected' : ''}>${r.name} (${r.year})</option>`).join('')}
        </select>
      </div>`
      : '';

  const releasesHtml = project.releases
    .map(
      (r) => `
      <a href="${r.url}" target="_blank" class="album-card">
        <img src="${r.cover}" alt="${r.name}" class="album-cover" loading="lazy">
        <div class="album-info">
          <span class="album-type">${r.type}</span>
          <p class="album-name">${r.name}</p>
          <p class="album-year">${r.year}</p>
        </div>
      </a>`
    )
    .join('');

  document.getElementById('project-content').innerHTML = `
    <section class="detail-header">
      <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
      <div class="detail-hero">
          <div class="detail-left">
            <img src="${project.cover}" alt="${project.name}" class="detail-cover">
            ${renderFeatured(defaultFeatured)}
          </div>
        <div class="detail-info">
          <h1>${project.name}</h1>
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
    </section>`;

  document.querySelectorAll('a, button, .album-card').forEach(attachCursor);

  const selector = document.getElementById('album-selector');
  selector?.addEventListener('change', () => {
    const selected = project.releases.find((r) => r.name === selector.value);
    const section = document.getElementById('featured-section');
    if (section && selected) {
      section.outerHTML = renderFeatured(selected);
      document.querySelector('.detail-cover').src = selected.cover;
    }
  });

  extractColors(project.cover)
    .then((colors) => {
      const root = document.documentElement.style;
      root.setProperty('--section-accent', colors[0]);
      root.setProperty('--section-accent-secondary', colors[1]);
      root.setProperty('--section-accent-tertiary', colors[2]);
    })
    .catch(() => {
      if (project.accent) {
        const root = document.documentElement.style;
        root.setProperty('--section-accent', project.accent);
        root.setProperty('--section-accent-secondary', project.accentSecondary || project.accent);
        root.setProperty('--section-accent-tertiary', project.accentTertiary || project.accent);
      }
    });
}

// ---- Init ----
const projectId = params.get('id');

if (!projectId) {
  window.location.href = 'index.html';
} else {
  Promise.all([
    fetch('data.json').then((r) => r.json()),
    fetch('assets/i18n.json', { cache: 'no-store' }).then((r) => r.json()),
  ])
    .then(([data, i18nRes]) => {
      i18nData = i18nRes;
      siteData = data;
      currentProject = data.projects.find((p) => p.id === projectId);
      applyTranslations();

      if (!currentProject) {
        const t = i18nData?.[currentLocale] || i18nData?.en || {};
        document.getElementById('project-content').innerHTML = `
          <div class="container" style="padding-top: 120px; text-align: center;">
            <a href="index.html#projects" class="back-link">&larr; ${t.site?.backToProjects || 'Back to Projects'}</a>
            <h1>${t.site?.notFound || 'Project not found'}</h1>
          </div>`;
        return;
      }

      document.title = `${currentProject.name} | Ashel`;
      renderProjectContent();
    })
    .catch((err) => {
      document.getElementById('project-content').innerHTML = `
        <div class="loading">Error loading data</div>`;
      console.error(err);
    });
}

initLangToggle(() => renderProjectContent());
initMobileMenu();
initCursor();

let heroColors = ['#ff2d55', '#5856d6', '#00d4aa'];

function updateHeroColors() {
  const top3 = siteData.projects.slice(0, 3);
  const allLoaded = top3.every((p) => colorCache[p.id]);
  if (!allLoaded) return;
  heroColors = [colorCache[top3[0].id][0], colorCache[top3[1].id][0], colorCache[top3[2].id][0]];
}

function applyCardColors() {
  const cards = document.querySelectorAll('.project-card');
  const items = document.querySelectorAll('.gallery-item');
  siteData.projects.forEach((project, index) => {
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
    const item = items[index];
    if (item) {
      item.style.setProperty('--section-accent', colors[0]);
      item.style.setProperty('--section-accent-secondary', colors[1]);
    }
  });
  updateHeroColors();
}

function renderIndexContent() {
  if (!i18nData || !siteData) return;
  const t = i18nData[currentLocale] || i18nData.en;
  const data = siteData;

  document.getElementById('hero-tagline').textContent = t.site?.subtitle || data.site.subtitle;

  const marqueeItems = data.projects
    .map(
      (p) =>
        `<span>${p.name} <span class="accent">\u2014</span> ${p.genres.slice(0, 2).join(' / ')}</span>`
    )
    .join('');
  document.getElementById('marquee').innerHTML = marqueeItems + marqueeItems;

  const projectsHtml = data.projects
    .map(
      (p, i) => `
      <a href="project.html?id=${p.id}" class="project-card" id="project-${p.id}">
        <div class="project-cover-wrap">
          <img src="${p.cover}" alt="${p.name}" class="project-cover" loading="lazy">
          ${p.badge ? `<span class="project-badge">${p.badge}</span>` : ''}
        </div>
        <div class="project-info">
          <span class="project-number">${String(i + 1).padStart(2, '0')}</span>
          <h2 class="project-name">${p.name}</h2>
          <div class="project-genres">
            ${p.genres.map((g) => `<span class="genre-tag">${g}</span>`).join('')}
          </div>
          <p class="project-desc">${t.projects?.[p.id]?.shortDescription || p.shortDescription}</p>
          <span class="project-arrow">\u2192</span>
        </div>
      </a>`
    )
    .join('');
  document.getElementById('projects-grid').innerHTML = projectsHtml;

  document.getElementById('project-count').textContent = String(data.projects.length).padStart(
    2,
    '0'
  );

  const galleryHtml = data.projects
    .map(
      (p) => `
      <div class="gallery-item" data-label="${p.name}">
        <img src="${p.cover}" alt="${p.name}" loading="lazy">
      </div>`
    )
    .join('');
  document.getElementById('gallery-grid').innerHTML = galleryHtml;

  const socialHtml = data.site.social
    .map((s) => `<a href="${s.url}" target="_blank">${s.label}</a>`)
    .join('');
  document.getElementById('social-links').innerHTML = socialHtml;

  const statLabels = t.stats || {
    projects: 'Projects',
    tracks: 'Tracks Released',
    years: 'Years Active',
  };
  const statKeys = ['projects', 'tracks', 'years'];
  const bioText = t.site?.bio || data.site.bio;
  const aboutHtml = `
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
  document.getElementById('about-text').innerHTML = aboutHtml;

  applyCardColors();
  document
    .querySelectorAll('a, .project-card, .album-card, .gallery-item, button')
    .forEach(attachCursor);
}

// ---- Wave Canvas ----
function initWaveCanvas() {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animationId;
  let time = 0;
  let mouseX = 0.5;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
  });

  const bands = 128;
  const frequencies = new Float32Array(bands).fill(0);
  const targetFrequencies = new Float32Array(bands).fill(0);

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height;
    }
    reset() {
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      this.x = cx + (Math.random() - 0.5) * canvas.width * 0.6;
      this.y = cy + (Math.random() - 0.5) * canvas.height * 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3 - 0.1;
      this.radius = Math.random() * 2 + 0.5;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.colorIndex = Math.floor(Math.random() * 3);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      const cx = canvas.width / 2;
      const cy = canvas.height * 0.45;
      const dx = cx - this.x;
      const dy = cy - this.y;
      this.vx += dx * 0.00003;
      this.vy += dy * 0.00003;
      this.vx *= 0.999;
      this.vy *= 0.999;
      if (
        this.x < -20 ||
        this.x > canvas.width + 20 ||
        this.y < -20 ||
        this.y > canvas.height + 20
      ) {
        this.reset();
      }
    }
    draw(ctx, colors) {
      const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.5 + 0.5;
      const r = this.radius * (0.8 + pulse * 0.4);
      const alpha = this.opacity * (0.6 + pulse * 0.4);
      const rgb = hexToRgb(colors[this.colorIndex]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      ctx.fill();
    }
  }

  let particles = [];
  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }
  initParticles(50);
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles(50);
  });

  function generateNextFrame() {
    for (let i = 0; i < bands; i++) {
      const base = Math.sin(time * 0.02 + i * 0.1) * 0.3;
      const noise = (Math.random() - 0.5) * 0.2;
      const beat = Math.sin(time * 0.05) * 0.4 * (i < 20 ? 1 : 0.3);
      const harmonic = Math.sin(i * 0.3 + time * 0.03) * 0.2;
      const mouseInfluence = Math.sin(i * 0.05 + mouseX * Math.PI * 2) * 0.3;
      targetFrequencies[i] = Math.max(
        0,
        Math.min(1, base + noise + beat + harmonic + mouseInfluence + 0.5)
      );
    }
  }

  function updateFrequencies() {
    for (let i = 0; i < bands; i++) {
      frequencies[i] += (targetFrequencies[i] - frequencies[i]) * 0.15;
    }
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  function drawWaveform() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerY = canvas.height * 0.45;
    const amplitude = canvas.height * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    const colors = heroColors;
    const opacities = [0.3, 0.2, 0.15];

    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath();
      const rgb = hexToRgb(colors[layer]);
      ctx.strokeStyle = `rgba(${rgb}, ${opacities[layer]})`;
      ctx.lineWidth = layer === 0 ? 2 : 1;
      const yShift = layer * 15;
      const phaseShift = layer * 0.5;

      for (let x = 0; x < canvas.width; x++) {
        const i = Math.floor((x / canvas.width) * bands);
        const freq = frequencies[i] || 0;
        const wave = Math.sin(x * 0.01 + time * 0.02 + phaseShift) * freq * amplitude;
        const y = centerY + yShift + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    particles.forEach((p) => {
      p.update();
      p.draw(ctx, colors);
    });
  }

  function animate() {
    time++;
    generateNextFrame();
    updateFrequencies();
    drawWaveform();
    animationId = requestAnimationFrame(animate);
  }
  animate();
}

// ---- Bubbles ----
function initBubbles() {
  const bubblesContainer = document.getElementById('hero-bubbles');
  if (!bubblesContainer) return;
  const activeBubbles = [];

  const allReleases = siteData.projects.flatMap((p) =>
    p.releases.map((r) => ({ ...r, projectId: p.id, projectName: p.name }))
  );

  const shuffled = [...allReleases].sort(() => Math.random() - 0.5);
  let releaseIndex = 0;

  function getDimensions() {
    const hero = document.querySelector('.hero');
    return { w: hero.offsetWidth, h: hero.offsetHeight };
  }

  function createBubble() {
    if (releaseIndex >= shuffled.length) {
      releaseIndex = 0;
      shuffled.sort(() => Math.random() - 0.5);
    }
    const release = shuffled[releaseIndex++];
    const dim = getDimensions();
    const size = Math.random() * 70 + 30;
    const halfSize = size / 2;
    const bubble = document.createElement('div');
    bubble.className = 'hero-bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    let x = halfSize + Math.random() * (dim.w - size - halfSize * 2);
    let y = halfSize + Math.random() * (dim.h - size - halfSize * 2);
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.1 + Math.random() * 0.4;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bubble.style.transform = `translate(${x}px, ${y}px)`;

    const img = document.createElement('img');
    img.src = release.cover;
    img.alt = release.name;
    img.loading = 'lazy';
    bubble.appendChild(img);
    bubblesContainer.appendChild(bubble);

    const bubbleObj = { el: bubble, x, y, vx, vy, size, release, hovered: false, currentScale: 1 };
    bubble.addEventListener('mouseenter', () => (bubbleObj.hovered = true));
    bubble.addEventListener('mouseleave', () => (bubbleObj.hovered = false));

    bubble.addEventListener('click', () => {
      const card = document.getElementById(`project-${release.projectId}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow =
          '0 0 0 2px var(--section-accent, #ff2d55), 0 0 20px rgba(255,45,85,0.3)';
        setTimeout(() => {
          card.style.boxShadow = 'none';
        }, 500);
      }
    });

    activeBubbles.push(bubbleObj);
  }

  for (let i = 0; i < allReleases.length; i++) createBubble();

  function animateBubbles() {
    const dim = getDimensions();
    for (const b of activeBubbles) {
      b.x += b.vx;
      b.y += b.vy;
      const halfSize = b.size / 2;

      if (b.x <= halfSize) {
        b.x = halfSize;
        b.vx = Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
        b.vy += (Math.random() - 0.5) * 0.1;
      } else if (b.x >= dim.w - halfSize - b.size) {
        b.x = dim.w - halfSize - b.size;
        b.vx = -Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
        b.vy += (Math.random() - 0.5) * 0.1;
      }
      if (b.y <= halfSize) {
        b.y = halfSize;
        b.vy = Math.abs(b.vy) * (0.9 + Math.random() * 0.2);
        b.vx += (Math.random() - 0.5) * 0.1;
      } else if (b.y >= dim.h - halfSize - b.size) {
        b.y = dim.h - halfSize - b.size;
        b.vy = -Math.abs(b.vy) * (0.9 + Math.random() * 0.2);
        b.vx += (Math.random() - 0.5) * 0.1;
      }

      const dist = Math.hypot(b.x - dim.w / 2, b.y - dim.h / 2);
      const maxDist = Math.max(dim.w, dim.h) * 0.6;
      const baseOpacity = 0.35 + (1 - dist / maxDist) * 0.1;
      const target = b.hovered ? 0.9 : baseOpacity;
      const current = parseFloat(b.el.style.opacity || baseOpacity);
      const opacity = current + (target - current) * 0.08;

      const hoverTargetWidth = 100;
      const targetScale = b.hovered ? hoverTargetWidth / b.size : 1;
      b.currentScale = b.currentScale + (targetScale - b.currentScale) * 0.08;

      b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.currentScale})`;
      b.el.style.opacity = opacity;
    }
    requestAnimationFrame(animateBubbles);
  }
  requestAnimationFrame(animateBubbles);
}

// ---- Init ----
Promise.all([
  fetch('assets/i18n.json', { cache: 'no-store' }).then((r) => r.json()),
  fetch('data.json', { cache: 'no-store' }).then((r) => r.json()),
])
  .then(([translations, data]) => {
    i18nData = translations;
    siteData = data;
    applyTranslations();
    renderIndexContent();
    initWaveCanvas();
    initBubbles();

    siteData.projects.forEach((project) => {
      extractColors(project.cover)
        .then((colors) => {
          colorCache[project.id] = colors;
          applyCardColors();
        })
        .catch(() => {
          if (project.accent) {
            colorCache[project.id] = [
              project.accent,
              project.accentSecondary || project.accent,
              project.accentTertiary || project.accent,
            ];
            applyCardColors();
          }
        });
    });
  })
  .catch((err) => console.error('Failed to load data:', err));

initLangToggle(() => renderIndexContent());
initMobileMenu();
initCursor();

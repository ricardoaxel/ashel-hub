let bubblesRAF = null;
let bubblesVisible = true;

export function initBubbles(siteData) {
  const container = document.getElementById('hero-bubbles');
  if (!container) return;
  const hero = container.closest('.hero');
  if (hero) {
    const obs = new IntersectionObserver(
      ([e]) => {
        bubblesVisible = e.isIntersecting;
        if (bubblesVisible && !bubblesRAF) {
          bubblesRAF = requestAnimationFrame(animateBubbles);
        }
      },
      { threshold: 0 }
    );
    obs.observe(hero);
  }
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
    bubble.style.opacity = '0';

    const img = document.createElement('img');
    img.src = release.cover.replace('assets/images/', 'assets/images/thumbs/');
    img.alt = release.name;
    img.decoding = 'async';
    bubble.appendChild(img);
    container.appendChild(bubble);

    const obj = { el: bubble, x, y, vx, vy, size, release, hovered: false, currentScale: 1 };
    bubble.addEventListener('mouseenter', () => {
      obj.hovered = true;
    });
    bubble.addEventListener('mouseleave', () => {
      obj.hovered = false;
    });
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

    activeBubbles.push(obj);
  }

  for (let i = 0; i < allReleases.length; i++) createBubble();

  function animateBubbles() {
    if (!bubblesVisible) {
      bubblesRAF = null;
      return;
    }
    const dim = getDimensions();
    for (const b of activeBubbles) {
      b.x += b.vx;
      b.y += b.vy;
      const half = b.size / 2;

      if (b.x <= half) {
        b.x = half;
        b.vx = Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
        b.vy += (Math.random() - 0.5) * 0.1;
      } else if (b.x >= dim.w - half - b.size) {
        b.x = dim.w - half - b.size;
        b.vx = -Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
        b.vy += (Math.random() - 0.5) * 0.1;
      }
      if (b.y <= half) {
        b.y = half;
        b.vy = Math.abs(b.vy) * (0.9 + Math.random() * 0.2);
        b.vx += (Math.random() - 0.5) * 0.1;
      } else if (b.y >= dim.h - half - b.size) {
        b.y = dim.h - half - b.size;
        b.vy = -Math.abs(b.vy) * (0.9 + Math.random() * 0.2);
        b.vx += (Math.random() - 0.5) * 0.1;
      }

      const dist = Math.hypot(b.x - dim.w / 2, b.y - dim.h / 2);
      const maxDist = Math.max(dim.w, dim.h) * 0.6;
      const baseOpacity = 0.35 + (1 - dist / maxDist) * 0.1;
      const target = b.hovered ? 0.9 : baseOpacity;
      const current = parseFloat(b.el.style.opacity || baseOpacity);
      b.el.style.opacity = current + (target - current) * 0.08;

      const targetScale = b.hovered ? 100 / b.size : 1;
      b.currentScale += (targetScale - b.currentScale) * 0.08;
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) scale(${b.currentScale})`;
    }
    bubblesRAF = requestAnimationFrame(animateBubbles);
  }
  bubblesRAF = requestAnimationFrame(animateBubbles);
}

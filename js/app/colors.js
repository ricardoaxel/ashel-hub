let colorThief = null;
try {
  colorThief = new ColorThief();
} catch (_) {}
const colorCache = {};

try {
  const raw = sessionStorage.getItem('colorCache');
  if (raw) Object.assign(colorCache, JSON.parse(raw));
} catch (_) {}

export function saveColorCache() {
  try {
    sessionStorage.setItem('colorCache', JSON.stringify(colorCache));
  } catch (_) {}
}

const imageCache = new Map();

function getLoadedImage(url) {
  if (imageCache.has(url)) return imageCache.get(url);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
  imageCache.set(url, promise);
  return promise;
}

/** Converts hex color to "r,g,b" string for rgba(). */
export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function brighten(c, factor) {
  const r = Math.min(255, Math.floor(c.r * factor));
  const g = Math.min(255, Math.floor(c.g * factor));
  const b = Math.min(255, Math.floor(c.b * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export async function extractColors(imageUrl) {
  if (!colorThief) throw new Error('ColorThief not loaded yet');
  const img = await getLoadedImage(imageUrl);
  const palette = colorThief.getPalette(img, 16);
  const analyze = (c) => {
    const max = Math.max(...c);
    const min = Math.min(...c);
    const brightness = (c[0] + c[1] + c[2]) / 3;
    const saturation = max === 0 ? 0 : (max - min) / max;
    return {
      r: c[0],
      g: c[1],
      b: c[2],
      brightness,
      saturation,
      score: saturation * 0.6 + (brightness > 80 && brightness < 200 ? 0.4 : 0),
    };
  };
  const analyzed = palette.map(analyze).sort((a, b) => b.score - a.score);
  let accent = analyzed[0];
  if (accent.brightness < 80 && analyzed.length > 1) {
    accent = analyzed.filter((c) => c.brightness >= 60 && c.saturation > 0.25)[0] || analyzed[0];
  }
  const factor = accent.brightness < 100 ? 1.4 : 1.25;
  const c1 = brighten(accent, factor);
  const secondary =
    analyzed.filter((c) => Math.abs(c.score - accent.score) > 0.1 && c.brightness >= 50)[0] ||
    analyzed[1] ||
    accent;
  const c2 = brighten(secondary, 1.3);
  const tertiary =
    analyzed.filter(
      (c) => c !== secondary && Math.abs(c.score - secondary.score) > 0.05 && c.brightness >= 50
    )[0] ||
    analyzed[2] ||
    secondary;
  const c3 = brighten(tertiary, 1.15);
  return [c1, c2, c3];
}

export { colorCache };

export function applyProjectColors(projectId, colors) {
  colorCache[projectId] = colors;
  saveColorCache();
  const root = document.documentElement.style;
  root.setProperty('--section-accent', colors[0]);
  root.setProperty('--section-accent-secondary', colors[1]);
  root.setProperty('--section-accent-tertiary', colors[2]);
}

export function getColorFallback(project) {
  return [
    project.accent || '#ff2d55',
    project.accentSecondary || project.accent || '#5856d6',
    project.accentTertiary || project.accent || '#00d4aa',
  ];
}

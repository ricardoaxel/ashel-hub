let siteData = null;
let i18nData = null;
let loadPromise = null;

function fetchJSON(url, signal) {
  return fetch(url, { signal }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return r.json();
  });
}

export async function loadData() {
  if (loadPromise) return loadPromise;
  loadPromise = _load().catch(() => {
    loadPromise = null;
    return _load();
  });
  return loadPromise;
}

async function _load() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const [site, i18n] = await Promise.all([
      fetchJSON('data.json', ctrl.signal),
      fetchJSON('assets/i18n.json', ctrl.signal),
    ]);
    siteData = site;
    i18nData = i18n;
    return { siteData, i18nData };
  } finally {
    clearTimeout(timer);
  }
}

export function getSiteData() {
  return siteData;
}

export function getI18nData() {
  return i18nData;
}

export function getProject(id) {
  return siteData?.projects.find((p) => p.id === id) || null;
}

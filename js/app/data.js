let siteData = null;
let i18nData = null;
let loadPromise = null;

/**
 * Fetches data.json and i18n.json, caches the result.
 * Subsequent calls return the cached promise.
 */
export async function loadData() {
  if (loadPromise) return loadPromise;
  loadPromise = _load().catch(() => _load());
  return loadPromise;
}

async function _load() {
  const [site, i18n] = await Promise.all([
    fetch('data.json').then((r) => r.json()),
    fetch('assets/i18n.json').then((r) => r.json()),
  ]);
  siteData = site;
  i18nData = i18n;
  return { siteData, i18nData };
}

/** Returns cached site data (data.json). */
export function getSiteData() {
  return siteData;
}
/** Returns cached i18n data (i18n.json). */
export function getI18nData() {
  return i18nData;
}
/** Looks up a project by id from cached site data. */
export function getProject(id) {
  return siteData?.projects.find((p) => p.id === id) || null;
}

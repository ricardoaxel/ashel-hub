let siteData = null;
let i18nData = null;
let loadPromise = null;

/**
 * Fetches data.json and i18n.json, caches the result.
 * Subsequent calls return the cached promise.
 */
export async function loadData() {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all([
    fetch('data.json', { cache: 'no-store' }).then((r) => r.json()),
    fetch('assets/i18n.json', { cache: 'no-store' }).then((r) => r.json()),
  ]).then(
    ([site, i18n]) => {
      siteData = site;
      i18nData = i18n;
      return { siteData, i18nData };
    },
    (err) => {
      loadPromise = null;
      throw err;
    }
  );
  return loadPromise;
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

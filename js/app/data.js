let siteData = null;
let i18nData = null;
let loadPromise = null;

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

export function getSiteData() {
  return siteData;
}
export function getI18nData() {
  return i18nData;
}
export function getProject(id) {
  return siteData?.projects.find((p) => p.id === id) || null;
}

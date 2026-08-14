/**
 * Immediate initializer for the page loader and cached project colors.
 * Must stay a plain script (not a module) so it runs synchronously
 * before the rest of the application loads.
 */
(function () {
  var locale = new URLSearchParams(window.location.search).get('locale');
  try {
    locale = locale || localStorage.getItem('locale');
  } catch (e) {}
  locale = locale || navigator.language;

  var loaderText = document.getElementById('loader-text');
  if (loaderText) {
    loaderText.textContent = locale.startsWith('es') ? 'Cargando' : 'Loading';
  }

  window._loaderTextTimer = setTimeout(function () {
    var t = document.getElementById('loader-text');
    if (t) t.style.opacity = '1';
  }, 500);

  // Restore cached project accent colors on project detail pages
  // to avoid a flash of the default palette.
  if (window.location.pathname.includes('project.html')) {
    try {
      var cache = JSON.parse(sessionStorage.getItem('colorCache') || 'null');
      if (!cache) return;
      var id = new URLSearchParams(window.location.search).get('id');
      var colors = cache[id];
      if (!colors) return;
      var root = document.documentElement.style;
      root.setProperty('--section-accent', colors[0]);
      root.setProperty('--section-accent-secondary', colors[1]);
      root.setProperty('--section-accent-tertiary', colors[2]);
    } catch (e) {}
  }
})();

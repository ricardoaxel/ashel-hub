# Observations

- A handful of images on disk aren't referenced in `data.json` (e.g., `hostem-ira.jpg`, `ashel-circles.jpg`, `ashel-glass.jpg`, etc.) — could be used to expand the gallery beyond project covers
- When the album selector changes on the project page, the cover image swaps but colors don't recalculate (minor UX gap)
- No dev server or build setup — this is a static site, can be served with any static file server

## Maintainability refactor notes

Completed in branch `refactor/maintainability-zero-build`:

- Centralized configuration in `js/app/config.js` (breakpoints, preview counts, embed URLs, timings, z-index, fallback texts)
- Shared utilities in `js/app/utils.js` (`makeAccessible`, `pad2`, `translateDate`, `sortByDateDesc`, etc.)
- Media embed helpers in `js/app/media.js` (YouTube, SoundCloud, Bandcamp)
- Removed duplicate `makeAccessible` definitions across renderers
- Replaced hardcoded `DARK_INDICES` with `useInHero` flag in `data.json`
- Extracted duplicated inline loader script into `js/app/init-loader.js`
- Added `data-page` to each HTML page and updated `main.js` page detection
- Moved inline styles to CSS classes (`section-label--spaced`, `video-iframe`, `error-message`, etc.)
- Split monolithic `render/index.js` and `render/project.js` into smaller single-purpose functions
- Made `makeAccessible` idempotent to avoid listener leaks on re-renders
- Added spacing/radius/z-index tokens to `css/base.css`
- Removed unused `css/styles.css` and updated `README.md`

Still possible (kept simple on purpose):

- Distribute `css/responsive.css` into per-component media queries
- Add a schema/documentation for `data.json` fields
- Further reduce inline `style` attributes for dynamic background images

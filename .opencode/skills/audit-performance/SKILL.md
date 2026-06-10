---
name: audit-performance
description: Audit a static HTML/CSS/JS portfolio for performance bottlenecks and apply fixes
license: MIT
compatibility: opencode
metadata:
  audience: developer
  workflow: performance
---

## What I do

- Scan the codebase for common performance issues: image weight, render-blocking resources, animation rAF waste, layout thrashing, cache policy, CLS
- Produce a prioritized audit table (critical → low)
- Apply fixes one commit at a time, ordered by impact

## When to use me

Use this when the user reports the site feels slow, laggy, or buggy — especially on initial load, scrolling, or tab switching.

## Audit checklist (in priority order)

### 1. Image weight
- List every image referenced in `data.json` and HTML `<img>` tags
- Check file sizes with `ls -lh` / `stat`
- Identify broken/placeholder images (< 100 bytes)
- Compress: `sips --resampleHeightWidthMax 1200 -s format jpeg -s formatOptions 80`
- Generate bubble thumbnails: `sips --resampleHeightWidthMax 150 -s format jpeg -s formatOptions 60`
- Remove unreferenced/broken files

### 2. Render-blocking resources
- Check `<head>` for `<script>` tags without `async` or `defer`
- Check for CSS `@import` chains (sequential, render-blocking)
  - Fix: replace `@import` with parallel `<link>` tags in HTML
- Check for `@import url(...)` of Google Fonts inside CSS
  - Fix: move to `<link>` in `<head>` + add `preconnect` hints

### 3. Double downloads
- Check if images are fetched a second time for processing (e.g. ColorThief)
  - Fix: shared `Image` cache (`Map<url, Promise<Image>>`)
  - Use direct `new Image()` + `src` instead of `fetch` → `blob` → `ObjectURL`

### 4. Cache policy
- Check `fetch()` calls for `cache: 'no-store'`
  - Fix: remove or use `'no-cache'` (revalidate)
- Check for `Cache-Control` headers on the server (if applicable)

### 5. Animation rAF waste
- Check for `requestAnimationFrame` loops that run continuously
  - Fix 1: add idle timeout (e.g. cursor ring stops after 2s)
  - Fix 2: add `IntersectionObserver` + `threshold: 0` to stop when off-screen
  - Fix 3: use `requestAnimationFrame` timestamp for smooth delta time
- Check `visibilitychange` handler: cancel rAF when hidden, resume when visible

### 6. Hot paths (mousemove / scroll)
- Check for `document.elementFromPoint()` on every `mousemove`
  - Fix: use `e.target.closest()` instead
- Check for `getBoundingClientRect()` inside scroll handlers
  - Fix: throttle with rAF, cache last result
- Check for `getComputedStyle()` calls in frequent handlers

### 7. Layout shift (CLS)
- Check `<img>` tags missing `width` / `height` or container missing `aspect-ratio`
  - Fix: add `aspect-ratio` to CSS for image wrappers

### 8. Image decoding
- Check if `<img>` tags need `decoding="async"`
  - Fix: add to every `<img>` tag (HTML + JS template literals)

### 9. CSS paint properties
- Check for `transition: all` — prefer specific properties
- Check for expensive SVG filters (`feTurbulence`) on mobile — weigh visual value vs. cost

### 10. Preload critical assets
- Add `<link rel="preload" as="image">` for first-viewport images after data loads
- Add `<link rel="preconnect">` for third-party origins (CDN, fonts)

## Commit discipline

Each fix category is a separate commit with a clear message format:

```
perf: <short description of what and why>
```

Example:
```
perf: compress all referenced images from 72MB to 7.4MB
```

## Tools available

- `sips` (macOS) — image resizing and JPEG compression
- `stat -f%z` (macOS) or `stat -c%s` (Linux) — file size
- `du -sh` — directory total size
- `node --check` — JS syntax validation
- Browser DevTools Network / Performance / Lighthouse tabs

## Project-specific context

- Images in `assets/images/` referenced by `data.json` → project covers + release covers
- `about.jpg` referenced statically in `index.html`
- Gallery and bubbles reuse the same image files — need separate thumbnails for small-display use
- ColorThief CDN loads asynchronously; `colors.js` must guard `new ColorThief()` with try/catch
- All JS is ES modules (`type="module"`) — deferred by default, no need for `defer`
- CSS is 14 separate files linked directly in `<head>` (not `@import` chain)
- Animations: wave canvas (`rAF`), hero bubbles (`rAF`), cursor ring (`rAF` with idle stop)

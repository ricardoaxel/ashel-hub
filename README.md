# Ashel — Music Portfolio

A data-driven portfolio site showcasing music projects, releases, and embedded Bandcamp players. Built with vanilla JS (ES modules), custom cursor, canvas-based audio visualization, and dynamic color extraction from album art.

## Architecture

```
├── index.html              # Main portfolio page
├── project.html            # Per-project detail page
├── data.json               # All project/release data (single source of truth)
├── css/
│   ├── styles.css          # Import hub (14 CSS modules)
│   ├── base.css            # Reset, variables, typography
│   ├── layout.css          # Header, hero, marquee, footer
│   ├── effects.css         # Noise/scanlines overlays
│   ├── responsive.css      # All media queries
│   └── components/         # Per-component stylesheets
└── js/
    └── app/                # ES modules
        ├── main.js         # Entry point (page detection, boot sequence)
        ├── data.js         # Fetch + cache layer for data.json / i18n.json
        ├── i18n.js         # Locale engine (EN/ES), onLocaleChange events
        ├── colors.js       # ColorThief extraction, palette scoring
        ├── cursor.js       # Custom cursor (dot + ring)
        ├── mobile-menu.js  # Mobile nav toggle
        ├── wave-canvas.js  # Hero waveform visualization
        ├── bubbles.js      # Floating album cover bubbles
        └── render/         # Page renderers
            ├── index.js
            └── project.js
```

## Setup

1. Edit `data.json` to add/remove projects and releases
2. Add cover images to `assets/images/` matching paths in `data.json`
3. Edit `assets/i18n.json` for translations (EN/ES)
4. Swap portrait in `assets/images/about.jpg`

## Requirements

Uses ES modules (`<script type="module">`) — requires an HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` directly from disk (`file://`) will not work due to browser module restrictions.

## Customizing

- **Colors**: Edit CSS variables in `css/base.css` `:root`
- **Fonts**: Change `font-family` in `css/base.css` `body`
- **Layout**: Breakpoints in `css/responsive.css`

## Tech

- Zero frameworks, zero build tools
- ES modules with shared data layer
- ColorThief for dynamic accent extraction from album covers
- Canvas-based audio waveform visualization
- EN/ES i18n with URL-persisted locale
- Custom cursor with section-aware color blending

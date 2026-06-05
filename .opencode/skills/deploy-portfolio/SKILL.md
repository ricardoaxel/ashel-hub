---
name: deploy-portfolio
description: Deploy the Ashel music portfolio to GitHub Pages and manage the build process
license: MIT
compatibility: opencode
metadata:
  audience: developer
  workflow: github-pages
---

## What I do

- Build and verify the static HTML/CSS portfolio
- Push changes to the `main` branch on GitHub
- Verify GitHub Pages is serving correctly
- Check for CORS issues with external assets

## When to use me

Use this when the user asks to deploy, push updates live, or check if the site is working.

## Project context

- Pure HTML/CSS/JS — no build step needed
- GitHub Pages serves from `main` branch root
- Assets in `assets/images/` must be local (Bandcamp CORS blocks remote images)
- Dynamic color extraction uses `color-thief` CDN
- Live at: https://ricardoaxel.github.io/ashel-hub/

/**
 * Media embed helpers (YouTube, SoundCloud, Bandcamp, generic).
 */

import { EMBED_URLS } from './config.js';

export function getYouTubeEmbedUrl(videoId, autoplay = false) {
  return EMBED_URLS.youtubeEmbed(videoId, autoplay);
}

export function getYouTubeWatchUrl(videoId) {
  return EMBED_URLS.youtubeWatch(videoId);
}

export function getYouTubeThumbnailUrl(videoId) {
  return EMBED_URLS.youtubeThumbnail(videoId);
}

export function createYouTubeIframe(videoId, options = {}) {
  const { autoplay = false, title = '', attrs = {} } = options;
  const src = getYouTubeEmbedUrl(videoId, autoplay);
  const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
  const extraAttrs = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  return `<iframe src="${src}" frameborder="0" allowfullscreen loading="lazy"${titleAttr}${extraAttrs}></iframe>`;
}

export function createResponsiveIframe(src, options = {}) {
  const { title = '', allow = '', attrs = {} } = options;
  const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
  const allowAttr = allow ? ` allow="${allow}"` : '';
  const extraAttrs = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
  return `<iframe src="${src}" frameborder="0" allowfullscreen loading="lazy"${titleAttr}${allowAttr}${extraAttrs}></iframe>`;
}

export function createVideoFacade(videoId, title = '') {
  const safeTitle = title.replace(/"/g, '&quot;');
  return `
    <div class="video-card video-facade" data-video-id="${videoId}" data-video-title="${safeTitle}" role="button" tabindex="0" aria-label="Play ${safeTitle}">
      <img src="${getYouTubeThumbnailUrl(videoId)}" alt="" loading="lazy" decoding="async">
      <span class="video-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M8 5v14l11-7z"/></svg>
      </span>
    </div>`;
}

export function createYouTubePlayer(videoId, options = {}) {
  const src = getYouTubeEmbedUrl(videoId, true);
  const title = options.title || '';
  return createResponsiveIframe(src, {
    title,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  });
}

export function renderEmbed(item) {
  if (item.embed) return item.embed;
  if (item.type === 'youtube' && item.videoId) {
    return createYouTubeIframe(item.videoId, { title: item.title });
  }
  return `<span class="embed-type-label">${item.type}</span>`;
}

export function adjustSoundCloudHeight(embedHtml, height = 350) {
  if (!embedHtml) return '';
  return embedHtml.replace(/height="\d+"/, `height="${height}"`);
}

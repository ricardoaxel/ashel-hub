/**
 * Centralized configuration and design tokens.
 * Edit values here instead of hunting through renderers.
 */

export const BREAKPOINTS = {
  small: 480,
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export const PREVIEW_COUNTS = {
  illustrations: { small: 1, mobile: 2, desktop: 4, multiplier: 2 },
  photos: { mobile: 3, desktop: 6 },
  flyers: { mobile: 3, desktop: 6 },
  videos: { mobile: 3, tablet: 4, desktop: 6 },
  gallery: { mobileColumns: 2, desktopColumns: 3, multiplier: 2 },
};

export const TIMINGS = {
  illustrationCycleMs: 7000,
  cursorIdleTimeoutMs: 2000,
  loaderFadeDelayMs: 500,
  pageLoaderFadeMs: 350,
  scrollSaveThrottleMs: 150,
};

export const EMBED_URLS = {
  youtubeEmbed: (id, autoplay = false) =>
    `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1' : ''}`,
  youtubeWatch: (id) => `https://www.youtube.com/watch?v=${id}`,
  youtubeThumbnail: (id) => `https://i1.ytimg.com/vi/${id}/hqdefault.jpg`,
};

export const Z_INDEX = {
  cursor: 1000000,
  modal: 1000,
  nav: 100,
  menu: 99,
  pageLoader: 99999,
  noise: 9000,
};

export const FALLBACK_TEXTS = {
  present: 'Present',
  viewAll: 'VIEW ALL',
  extras: 'Extras',
  otherLabel: 'misc',
  otherDesc: 'Side projects, collaborations, experiments, and other odds & ends.',
  illustration: 'Illustration',
  illustrationsSection: 'Illustrations',
  photo: 'Photo',
  flyer: 'Flyer',
  video: 'Video',
  backToProjects: 'Back to Projects',
  notFound: 'Project not found',
  featuredRelease: 'Featured Release',
  nowPlaying: 'Now Playing',
  discography: 'Discography',
  photos: 'Photos',
  flyers: 'Flyers',
  videos: 'Videos',
  members: 'Members',
  location: 'Location',
  tracklist: 'Tracklist',
  visitLink: 'Visit →',
  liveSessions: 'Live Sessions',
  liveSessionsDesc:
    'Participation in the recording and mixing of the following live sessions.',
  builtWith: 'Built with obsession',
  loading: 'Loading',
  loadingEs: 'Cargando',
};

export const RELEASE_TYPE_ORDER = ['Album', 'EP', 'Single', 'Cover'];

export const SOCIAL_ICONS = {
  Instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1"/></svg>',
  YouTube:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="2" y="5" width="20" height="14" rx="3"/><polygon points="10,8 10,16 17,12" fill="currentColor" stroke="none"/></svg>',
  Bandcamp:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><polygon points="3,16 8.5,8 21,8" fill="currentColor" stroke="none" opacity="0.3"/><polygon points="3,16 8.5,8 21,8" stroke="currentColor" fill="none"/></svg>',
  Facebook:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
};

export const DEFAULT_HERO_COLORS = ['#ff2d55', '#5856d6', '#00d4aa'];

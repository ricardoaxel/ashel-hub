/**
 * PostHog analytics helpers.
 *
 * Tracking is anonymous by default. The PostHog snippet is configured with
 * person_profiles: 'identified_only' and persistence: 'localStorage', so no
 * cookies are written and no named person profiles are created for visitors.
 */

function safeCapture(event, properties = {}) {
  if (
    typeof window !== 'undefined' &&
    window.posthog &&
    typeof window.posthog.capture === 'function'
  ) {
    window.posthog.capture(event, properties);
  }
}

function getProjectIdFromCard(card) {
  if (card.id && card.id.startsWith('project-')) {
    return card.id.replace('project-', '');
  }
  const href = card.getAttribute('href');
  if (href) {
    const match = href.match(/[?&]id=([^&]+)/);
    if (match) return match[1];
  }
  return null;
}

function inferSection(el) {
  const section = el.closest('section');
  if (!section) return 'unknown';
  return section.id || section.className.split(' ')[0] || 'unknown';
}

export function initAnalytics() {
  // Locale toggles
  document.querySelectorAll('.lang-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      safeCapture('locale_changed', { language: btn.dataset.lang });
    });
  });

  // Click delegation for tracked elements
  document.addEventListener('click', (e) => {
    const target = e.target;

    // Project cards on the index page
    const projectCard = target.closest('.project-card:not(.other-card)');
    if (projectCard) {
      safeCapture('project_clicked', {
        project_id: getProjectIdFromCard(projectCard),
        project_name:
          projectCard.querySelector('.project-name')?.textContent?.trim() || '',
      });
      return;
    }

    // "Other projects" card on the index page
    if (target.closest('.project-card.other-card')) {
      safeCapture('view_all_clicked', {
        section: 'other_projects',
        destination: 'other.html',
      });
      return;
    }

    // "View all" / "Show more" links
    const viewAllLink = target.closest('.illustration-show-more a');
    if (viewAllLink) {
      safeCapture('view_all_clicked', { section: inferSection(viewAllLink) });
      return;
    }

    // Video cards (index preview, project page, live sessions)
    const videoCard = target.closest('.video-card');
    if (videoCard) {
      const title =
        videoCard.dataset.videoTitle ||
        videoCard.getAttribute('aria-label') ||
        '';
      const source = videoCard.closest('.live-sessions-section')
        ? 'live_sessions'
        : 'project_videos';
      safeCapture('video_played', { video_title: title, source });
      return;
    }

    // Social links in the footer
    const socialLink = target.closest('#social-links a');
    if (socialLink) {
      safeCapture('social_clicked', {
        platform: socialLink.textContent.trim(),
        url: socialLink.href,
      });
      return;
    }

    // External project links on detail / other pages
    const projectLink = target.closest(
      '.detail-links a, .other-detail-card a.card-link'
    );
    if (projectLink) {
      safeCapture('social_clicked', {
        platform:
          projectLink.getAttribute('title') ||
          projectLink.textContent.trim(),
        url: projectLink.href,
      });
      return;
    }

    // Next project navigation
    const nextProjectLink = target.closest('.next-project-link');
    if (nextProjectLink) {
      safeCapture('next_project_clicked', {
        destination: nextProjectLink.getAttribute('aria-label') || '',
      });
      return;
    }
  });

  // Album selector on the project detail page
  document.addEventListener('change', (e) => {
    if (e.target.id === 'album-selector') {
      safeCapture('album_selected', { album_name: e.target.value });
    }
  });
}

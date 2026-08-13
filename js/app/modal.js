let lightbox = null;
let lbOpen = false;
let lbPushed = false;

function toSlide(item) {
  if (item.videoId || item.source === 'youtube' || item.type === 'video') {
    return {
      href: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
      type: 'video',
      source: 'youtube',
      title: item.title || item.caption || '',
    };
  }

  return {
    href: item.src,
    type: 'image',
    title: item.projectName || item.caption || item.title || '',
    alt: item.projectName || item.caption || item.title || '',
  };
}

function addMobileTapZones(slide) {
  if (slide.dataset.tapZonesAdded) return;
  slide.dataset.tapZonesAdded = 'true';

  // Skip video slides; they have their own controls and swipe still works
  if (slide.querySelector('.gvideo-container') || slide.querySelector('.gslide-video')) return;

  const inner = slide.querySelector('.gslide-inner-content');
  if (!inner) return;

  const makeZone = (direction) => {
    const zone = document.createElement('div');
    zone.className = `glightbox-tap-zone glightbox-tap-zone-${direction}`;
    zone.setAttribute('aria-hidden', 'true');
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '-1');

    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    zone.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchMoved = false;
      },
      { passive: true }
    );

    zone.addEventListener(
      'touchmove',
      (e) => {
        const t = e.changedTouches[0];
        const dx = Math.abs(t.clientX - touchStartX);
        const dy = Math.abs(t.clientY - touchStartY);
        if (dx > 12 || dy > 12) touchMoved = true;
      },
      { passive: true }
    );

    zone.addEventListener('touchend', (e) => {
      if (touchMoved) return;
      e.preventDefault();
      e.stopPropagation();
      if (direction === 'right') {
        lightbox?.nextSlide();
      } else {
        lightbox?.prevSlide();
      }
    });

    return zone;
  };

  inner.appendChild(makeZone('left'));
  inner.appendChild(makeZone('right'));
}

function syncControls() {
  if (!lightbox) return;
  const container = document.querySelector('.glightbox-container');
  if (!container) return;

  const index = lightbox.getActiveSlideIndex();
  const total = lightbox.elements.length;
  const element = lightbox.elements[index] || {};

  let counter = container.querySelector('.gcounter');
  if (!counter) {
    counter = document.createElement('div');
    counter.className = 'gcounter';
    container.appendChild(counter);
  }
  counter.textContent = `${index + 1} / ${total}`;

  // Title badge lives directly in the container (outside the slider) so it
  // stays fixed while the slider animates during drag/keyboard navigation.
  let badge = container.querySelector('.gbadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'gbadge';
    container.appendChild(badge);
  }
  const title = element.title || '';
  badge.textContent = title;
  badge.classList.toggle('is-empty', !title);

  container.classList.toggle('is-first', index === 0);
  container.classList.toggle('is-last', index === total - 1);
}

function handlePopState() {
  if (lbOpen) closeModal();
}

export function initModal() {
  lightbox = window.GLightbox({
    selector: null,
    touchNavigation: true,
    keyboardNavigation: true,
    closeOnOutsideClick: true,
    loop: false,
    autoplayVideos: true,
    preload: true,
    openEffect: 'fade',
    closeEffect: 'fade',
    slideEffect: 'slide',
    skin: 'ashel',
    moreLength: 0,
    descPosition: 'bottom',
    onOpen: () => {
      lbOpen = true;
      if (!lbPushed) {
        lbPushed = true;
        history.pushState({ _glightbox: true }, '');
      }
      syncControls();
    },
    onClose: () => {
      lbOpen = false;
      if (lbPushed) {
        lbPushed = false;
        if (history.state && history.state._glightbox) history.back();
      }
    },
    afterSlideLoad: (data) => {
      addMobileTapZones(data.slide);
      syncControls();
    },
    afterSlideChange: () => {
      syncControls();
    },
  });
  window._lightbox = lightbox;
  window.addEventListener('popstate', handlePopState);
}

export function openModal(items, index = 0) {
  if (!lightbox) initModal();
  lightbox.setElements(items.map(toSlide));
  lightbox.openAt(index);
}

export function closeModal() {
  if (lightbox && document.querySelector('.glightbox-container')) lightbox.close();
}

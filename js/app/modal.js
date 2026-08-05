let lightbox = null;

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
    afterSlideLoad: (data) => {
      addMobileTapZones(data.slide);
    },
  });
  window._lightbox = lightbox;
}

export function openModal(items, index = 0) {
  if (!lightbox) initModal();
  lightbox.setElements(items.map(toSlide));
  lightbox.openAt(index);
}

export function closeModal() {
  lightbox?.close();
}

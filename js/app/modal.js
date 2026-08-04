let modalEl = null;
let imgEl = null;
let videoEl = null;
let captionEl = null;
let counterEl = null;

let items = [];
let currentIndex = 0;
let animating = false;
let exitTimer = null;
let enterTimer = null;
let openGuard = false;
let openGuardTimer = null;

let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

function clearTimers() {
  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimer = null;
  }
  if (enterTimer) {
    clearTimeout(enterTimer);
    enterTimer = null;
  }
  if (openGuardTimer) {
    clearTimeout(openGuardTimer);
    openGuardTimer = null;
  }
}

function setContent() {
  const item = items?.[currentIndex];
  if (!item) return;

  const isVideo = !!item.videoId;
  if (imgEl) imgEl.style.display = isVideo ? 'none' : '';
  if (videoEl) videoEl.style.display = isVideo ? '' : 'none';

  if (isVideo) {
    videoEl.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1`;
    videoEl.title = item.title || '';
  } else {
    imgEl.src = item.src;
    imgEl.alt = item.caption || '';
  }

  captionEl.textContent = item.caption || item.title || '';
  counterEl.textContent = `${currentIndex + 1} / ${items.length}`;
}

function show() {
  setContent();
  modalEl.classList.add('active');
  document.documentElement.classList.add('modal-open');
}

function close() {
  clearTimers();
  animating = false;
  openGuard = false;

  try {
    modalEl?.classList.remove('active');
    if (videoEl) {
      videoEl.src = '';
      videoEl.style.display = 'none';
    }
    if (imgEl) {
      imgEl.style.display = '';
      imgEl.classList.remove('is-fading');
    }
  } catch (_) {}

  document.documentElement.classList.remove('modal-open');
}

function animateTo(newIndex) {
  if (animating || newIndex < 0 || newIndex >= items.length) return;
  if (newIndex === currentIndex) return;

  const nextItem = items[newIndex];
  const isVideo = !!nextItem.videoId;

  if (isVideo) {
    currentIndex = newIndex;
    setContent();
    return;
  }

  animating = true;
  imgEl.classList.add('is-fading');

  exitTimer = setTimeout(() => {
    currentIndex = newIndex;
    imgEl.src = nextItem.src;
    imgEl.alt = nextItem.caption || '';
    captionEl.textContent = nextItem.caption || nextItem.title || '';
    counterEl.textContent = `${currentIndex + 1} / ${items.length}`;
    imgEl.classList.remove('is-fading');

    enterTimer = setTimeout(() => {
      animating = false;
      enterTimer = null;
    }, 250);

    exitTimer = null;
  }, 250);
}

function prev() {
  animateTo(currentIndex - 1);
}

function next() {
  animateTo(currentIndex + 1);
}

function handleKeydown(e) {
  if (!modalEl?.classList.contains('active')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
}

function handleTouchStart(e) {
  const t = e.changedTouches[0];
  touchStartX = t.screenX;
  touchStartY = t.screenY;
  touchMoved = false;
}

function handleTouchMove(e) {
  const t = e.changedTouches[0];
  const dx = Math.abs(t.screenX - touchStartX);
  const dy = Math.abs(t.screenY - touchStartY);
  if (dx > 20 || dy > 20) {
    touchMoved = true;
  }
}

function handleTouchEnd(e) {
  if (!touchMoved) return;

  const t = e.changedTouches[0];
  const dx = t.screenX - touchStartX;
  const dy = t.screenY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    e.preventDefault();
    if (dx < 0) next();
    else prev();
  }
}

function handleImageClick(e) {
  if (openGuard || touchMoved) return;

  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 3) prev();
  else if (x > (rect.width * 2) / 3) next();
}

export function initModal() {
  modalEl = document.getElementById('gallery-modal');
  if (!modalEl) return;

  document.documentElement.classList.remove('modal-open');

  imgEl = modalEl.querySelector('.modal-image');
  videoEl = modalEl.querySelector('.modal-video');
  captionEl = modalEl.querySelector('.modal-caption');
  counterEl = modalEl.querySelector('.modal-counter');

  videoEl.style.display = 'none';

  modalEl.querySelector('.modal-close')?.addEventListener('click', close);
  modalEl.querySelector('.modal-prev')?.addEventListener('click', prev);
  modalEl.querySelector('.modal-next')?.addEventListener('click', next);

  modalEl.addEventListener('touchstart', handleTouchStart, { passive: true });
  modalEl.addEventListener('touchmove', handleTouchMove, { passive: true });
  modalEl.addEventListener('touchend', handleTouchEnd, { passive: false });

  imgEl?.addEventListener('click', handleImageClick);

  modalEl.addEventListener('click', (e) => {
    if (touchMoved) return;
    if (e.target === modalEl) close();
  });

  document.addEventListener('keydown', handleKeydown);
}

export function openModal(newItems, index) {
  clearTimers();
  items = newItems;
  currentIndex = index;
  animating = false;
  touchMoved = false;
  openGuard = true;

  if (imgEl) {
    imgEl.classList.remove('is-fading');
  }

  openGuardTimer = setTimeout(() => {
    openGuard = false;
    openGuardTimer = null;
  }, 350);

  show();
}

export function closeModal() {
  close();
}

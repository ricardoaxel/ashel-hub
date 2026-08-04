let modalEl = null;
let imgEl = null;
let videoEl = null;
let captionEl = null;
let counterEl = null;

let items = [];
let currentIndex = 0;

let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

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
  try {
    modalEl?.classList.remove('active');
    if (videoEl) {
      videoEl.src = '';
      videoEl.style.display = 'none';
    }
    if (imgEl) {
      imgEl.style.display = '';
    }
  } catch (_) {}
  document.documentElement.classList.remove('modal-open');
}

function goTo(newIndex) {
  if (newIndex < 0 || newIndex >= items.length) return;
  if (newIndex === currentIndex) return;
  currentIndex = newIndex;
  setContent();
}

function prev() {
  goTo(currentIndex - 1);
}

function next() {
  goTo(currentIndex + 1);
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

  modalEl.addEventListener('click', (e) => {
    if (touchMoved) return;
    if (e.target === modalEl) close();
  });

  document.addEventListener('keydown', handleKeydown);
}

export function openModal(newItems, index) {
  items = newItems;
  currentIndex = index;
  touchMoved = false;
  show();
}

export function closeModal() {
  close();
}

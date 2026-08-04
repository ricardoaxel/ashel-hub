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

const SWIPE_THRESHOLD = 50;
const MOVE_THRESHOLD = 10;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

function clearAnimationTimers() {
  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimer = null;
  }
  if (enterTimer) {
    clearTimeout(enterTimer);
    enterTimer = null;
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
  clearAnimationTimers();
  animating = false;

  try {
    modalEl?.classList.remove('active');
    if (videoEl) {
      videoEl.src = '';
      videoEl.style.display = 'none';
    }
    if (imgEl) {
      imgEl.style.display = '';
      imgEl.className = 'modal-image';
    }
  } catch (_) {}

  document.documentElement.classList.remove('modal-open');
}

function animateTo(newIndex, dir) {
  if (animating || newIndex < 0 || newIndex >= items.length) return;
  if (newIndex === currentIndex) return;

  const isVideo = !!items[newIndex].videoId;
  if (isVideo) {
    currentIndex = newIndex;
    setContent();
    return;
  }

  animating = true;
  const exitClass = dir === 'next' ? 'slide-out-left' : 'slide-out-right';
  const enterClass = dir === 'next' ? 'slide-in-right' : 'slide-in-left';

  imgEl.classList.add(exitClass);

  exitTimer = setTimeout(() => {
    currentIndex = newIndex;
    const item = items[currentIndex];
    imgEl.src = item.src;
    imgEl.alt = item.caption || '';
    captionEl.textContent = item.caption || item.title || '';
    counterEl.textContent = `${currentIndex + 1} / ${items.length}`;

    imgEl.classList.remove(exitClass);
    imgEl.classList.add(enterClass);

    enterTimer = setTimeout(() => {
      imgEl.classList.remove(enterClass);
      animating = false;
      enterTimer = null;
    }, 250);

    exitTimer = null;
  }, 200);
}

function prev() {
  animateTo(currentIndex - 1, 'prev');
}

function next() {
  animateTo(currentIndex + 1, 'next');
}

function handleKeydown(e) {
  if (!modalEl?.classList.contains('active')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
}

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
  touchMoved = false;
}

function handleTouchMove(e) {
  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
    touchMoved = true;
  }
}

function handleTouchEnd(e) {
  if (!touchMoved) return;

  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx < 0) next();
    else prev();
  }
}

function handleImageClick(e) {
  if (touchMoved) return;

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
  modalEl.addEventListener('touchend', handleTouchEnd, { passive: true });

  imgEl?.addEventListener('click', handleImageClick);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });

  document.addEventListener('keydown', handleKeydown);
}

export function openModal(newItems, index) {
  clearAnimationTimers();
  items = newItems;
  currentIndex = index;
  animating = false;
  if (imgEl) imgEl.className = 'modal-image';
  show();
}

export function closeModal() {
  close();
}

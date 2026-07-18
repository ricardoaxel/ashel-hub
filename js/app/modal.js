let modalEl = null;
let imgEl = null;
let videoEl = null;
let captionEl = null;
let counterEl = null;
let items = [];
let currentIndex = 0;

function show() {
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

function open(newItems, index) {
  items = newItems;
  currentIndex = index;
  show();
  modalEl.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function close() {
  try {
    modalEl?.classList.remove('active');
    if (videoEl) { videoEl.src = ''; videoEl.style.display = 'none'; }
    if (imgEl) imgEl.style.display = '';
  } catch (_) {}
  document.body.style.overflow = '';
}

function prev() {
  if (currentIndex > 0) {
    currentIndex--;
    show();
  }
}

function next() {
  if (currentIndex < items.length - 1) {
    currentIndex++;
    show();
  }
}

function handleKeydown(e) {
  if (!modalEl?.classList.contains('active')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0) next();
    else prev();
  }
}

function handleImageClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width / 3) prev();
  else if (x > rect.width * 2 / 3) next();
}

export function initModal() {
  modalEl = document.getElementById('gallery-modal');
  if (!modalEl) return;

  imgEl = modalEl.querySelector('.modal-image');
  videoEl = modalEl.querySelector('.modal-video');
  captionEl = modalEl.querySelector('.modal-caption');
  counterEl = modalEl.querySelector('.modal-counter');

  videoEl.style.display = 'none';

  modalEl.querySelector('.modal-close')?.addEventListener('click', close);
  modalEl.querySelector('.modal-prev')?.addEventListener('click', prev);
  modalEl.querySelector('.modal-next')?.addEventListener('click', next);

  modalEl.addEventListener('touchstart', handleTouchStart, { passive: true });
  modalEl.addEventListener('touchend', handleTouchEnd, { passive: true });

  imgEl?.addEventListener('click', handleImageClick);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });

  document.addEventListener('keydown', handleKeydown);
}

export function openModal(newItems, index) {
  open(newItems, index);
}

export function closeModal() {
  close();
}

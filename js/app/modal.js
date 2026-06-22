let modalEl = null;
let imgEl = null;
let captionEl = null;
let counterEl = null;
let items = [];
let currentIndex = 0;

function show() {
  const item = items[currentIndex];
  imgEl.src = item.src;
  imgEl.alt = item.caption || '';
  captionEl.textContent = item.caption || '';
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
  modalEl.classList.remove('active');
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

export function initModal() {
  modalEl = document.getElementById('gallery-modal');
  if (!modalEl) return;

  imgEl = modalEl.querySelector('.modal-image');
  captionEl = modalEl.querySelector('.modal-caption');
  counterEl = modalEl.querySelector('.modal-counter');

  modalEl.querySelector('.modal-close')?.addEventListener('click', close);
  modalEl.querySelector('.modal-prev')?.addEventListener('click', prev);
  modalEl.querySelector('.modal-next')?.addEventListener('click', next);

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

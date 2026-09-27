// ========================================
// MOBIEL MENU
// ========================================

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}


// ========================================
// JAARTAL FOOTER
// ========================================

const year = document.querySelector('#year');

if (year) {
  year.textContent = new Date().getFullYear();
}


// ========================================
// PRODUCT GALERIJ
// Werkt automatisch op alle productpagina's
// ========================================

const gallery = document.querySelector('[data-product-gallery]');
const lightbox = document.querySelector('[data-gallery-lightbox]');

if (gallery && lightbox) {

  const mainImage = gallery.querySelector('[data-gallery-main]');
  const openButton = gallery.querySelector('[data-gallery-open]');
  const thumbnails = [...gallery.querySelectorAll('[data-gallery-thumbnail]')];

  const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
  const closeButton = lightbox.querySelector('[data-gallery-close]');
  const previousButton = lightbox.querySelector('[data-gallery-previous]');
  const nextButton = lightbox.querySelector('[data-gallery-next]');

  const currentCounter = lightbox.querySelector('[data-gallery-current]');
  const totalCounter = lightbox.querySelector('[data-gallery-total]');

  let currentIndex = 0;
  let isZoomed = false;

  let touchStartX = 0;
  let touchStartY = 0;


  // ========================================
  // FOTO SELECTEREN
  // ========================================

  function selectImage(index) {

    currentIndex = index;

    const thumbnail = thumbnails[currentIndex];
    const imageSource = thumbnail.dataset.image;
    const imageAlt = thumbnail.dataset.alt || '';

    // Grote afbeelding op productpagina
    mainImage.src = imageSource;
    mainImage.alt = imageAlt;

    // Afbeelding in lightbox
    lightboxImage.src = imageSource;
    lightboxImage.alt = imageAlt;

    // Zoom altijd resetten wanneer foto wisselt
    resetZoom();

    // Actieve thumbnail
    thumbnails.forEach((item, itemIndex) => {

      const isActive = itemIndex === currentIndex;

      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));

    });

    // Teller
    if (currentCounter) {
      currentCounter.textContent = String(currentIndex + 1);
    }
  }


  // ========================================
  // LIGHTBOX OPENEN
  // ========================================

  function openLightbox() {

    selectImage(currentIndex);

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';

    closeButton?.focus();
  }


  // ========================================
  // LIGHTBOX SLUITEN
  // ========================================

  function closeLightbox() {

    resetZoom();

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';

    openButton?.focus();
  }


  // ========================================
  // FOTO ZOOM
  // ========================================

  function toggleZoom() {

    isZoomed = !isZoomed;

    lightbox.classList.toggle('is-zoomed', isZoomed);
    lightboxImage.classList.toggle('is-zoomed', isZoomed);

  }


  function resetZoom() {

    isZoomed = false;

    lightbox.classList.remove('is-zoomed');
    lightboxImage.classList.remove('is-zoomed');

  }


  // Klik op foto = in-/uitzoomen
  lightboxImage.addEventListener('click', (event) => {

    event.stopPropagation();

    toggleZoom();

  });


  // ========================================
  // VORIGE / VOLGENDE FOTO
  // ========================================

  function showPreviousImage() {

    const previousIndex =
      (currentIndex - 1 + thumbnails.length) % thumbnails.length;

    selectImage(previousIndex);

  }


  function showNextImage() {

    const nextIndex =
      (currentIndex + 1) % thumbnails.length;

    selectImage(nextIndex);

  }


  // ========================================
  // THUMBNAILS
  // ========================================

  thumbnails.forEach((thumbnail, index) => {

    thumbnail.addEventListener('click', () => {
      selectImage(index);
    });

  });


  // ========================================
  // LIGHTBOX BEDIENING
  // ========================================

  openButton?.addEventListener('click', openLightbox);

  closeButton?.addEventListener('click', closeLightbox);

  previousButton?.addEventListener('click', showPreviousImage);

  nextButton?.addEventListener('click', showNextImage);


  // Klik buiten foto / pijlen / sluitknop = lightbox sluiten
  lightbox.addEventListener('click', (event) => {

    const clickedImage =
      event.target.closest('[data-lightbox-image]');

    const clickedNavigation =
      event.target.closest('.lightbox-navigation');

    const clickedClose =
      event.target.closest('[data-gallery-close]');

    if (!clickedImage && !clickedNavigation && !clickedClose) {
      closeLightbox();
    }

  });


  // ========================================
  // SWIPE OP TOUCHSCREEN
  // ========================================

  lightbox.addEventListener(
    'touchstart',
    (event) => {

      if (event.touches.length !== 1) {
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;

    },
    { passive: true }
  );


  lightbox.addEventListener(
    'touchend',
    (event) => {

      if (event.changedTouches.length !== 1) {
        return;
      }

      // Niet wisselen wanneer ingezoomd
      if (isZoomed) {
        return;
      }

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;

      const differenceX = touchEndX - touchStartX;
      const differenceY = touchEndY - touchStartY;

      const minimumSwipeDistance = 50;

      // Alleen horizontale swipe accepteren
      if (
        Math.abs(differenceX) > minimumSwipeDistance &&
        Math.abs(differenceX) > Math.abs(differenceY)
      ) {

        // Naar links swipen = volgende foto
        if (differenceX < 0) {
          showNextImage();
        }

        // Naar rechts swipen = vorige foto
        else {
          showPreviousImage();
        }
      }

    },
    { passive: true }
  );


  // ========================================
  // TOETSENBORD
  // ========================================

  document.addEventListener('keydown', (event) => {

    if (!lightbox.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {

      // Eerst zoom verlaten
      if (isZoomed) {
        resetZoom();
      }

      // Anders lightbox sluiten
      else {
        closeLightbox();
      }
    }

    if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }

    if (event.key === 'ArrowRight') {
      showNextImage();
    }

  });


  // ========================================
  // STARTSTATUS
  // ========================================

  if (totalCounter) {
    totalCounter.textContent = String(thumbnails.length);
  }

  if (thumbnails.length > 0) {
    selectImage(0);
  }
}
// F1.js
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    const gallery = document.getElementById('galleryScroll');
    if (!gallery) return;

    const imgs = Array.from(gallery.querySelectorAll('.gallery-item img'));
    if (!imgs.length) return;

    const lightbox = document.getElementById('lightbox');
    const lbImage = document.getElementById('lightboxImage');
    const lbCaption = document.getElementById('lightboxCaption');
    const btnClose = document.querySelector('.lightbox-close');
    const btnPrev = document.querySelector('.lightbox-nav.prev');
    const btnNext = document.querySelector('.lightbox-nav.next');
    const stage = document.querySelector('.lightbox-stage');

    let currentIndex = 0;
    let opening = false;
    let navLocked = false;
    let lastFocused = null;

    /* Utility: center a card in the gallery view */
    function centerCardInView(index) {
      const img = imgs[index];
      const item = img && img.closest('.gallery-item');
      if (!item) return;
      const galleryRect = gallery.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const scrollLeft = gallery.scrollLeft;
      const desiredLeft = scrollLeft + (itemRect.left - galleryRect.left) - (galleryRect.width / 2) + (itemRect.width / 2);
      gallery.scrollTo({ left: desiredLeft, behavior: 'smooth' });
    }

    /* Focus-trap helpers for lightbox */
    function getFocusableInLightbox() {
      if (!lightbox) return [];
      return Array.from(lightbox.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
    }

    function trapFocus(e) {
      if (!lightbox || lightbox.getAttribute('aria-hidden') === 'true') return;
      if (e.key !== 'Tab') return;

      const focusables = getFocusableInLightbox();
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        // shift + tab
        if (active === first || active === lightbox) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // tab
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    /* Show lightbox.
       index: image index
       options.center (default true) - whether to center the card in gallery.
    */
    function showLightbox(index, options = {}) {
      if (!lightbox || opening) return;
      const srcImg = imgs[index];
      if (!srcImg) return;
      opening = true;
      lastFocused = document.activeElement;

      if (options.center !== false) centerCardInView(index);

      const full = srcImg.dataset.full || srcImg.src;

      // small delay to allow the center animation to start (keeps UX smooth)
      setTimeout(() => {
        lbImage.src = full;
        lbImage.alt = srcImg.alt || '';
        lbCaption.textContent = srcImg.alt || '';
        lightbox.setAttribute('aria-hidden', 'false');
        lightbox.setAttribute('aria-modal', 'true');
        currentIndex = index;
        // prevent background scroll
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        // focus management
        if (btnClose) {
          try { btnClose.focus(); } catch (e) { /* ignore */ }
        } else if (stage) {
          try { stage.focus(); } catch (e) { /* ignore */ }
        }
        opening = false;
      }, 180);
    }

    function hideLightbox() {
      if (!lightbox) return;
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.removeAttribute('aria-modal');
      lbImage.src = '';
      lbCaption.textContent = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      // return focus to the last focused element if possible
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) { /* ignore */ }
      }
    }

    /* Navigation helper with a small lock/debounce */
    function navigateTo(index) {
      if (navLocked) return;
      navLocked = true;
      const newIndex = (index + imgs.length) % imgs.length;
      // When already open, don't re-center; just update image
      const shouldCenter = lightbox && lightbox.getAttribute('aria-hidden') === 'true' ? true : false;
      showLightbox(newIndex, { center: shouldCenter });
      // unlock after a small delay that matches showLightbox timing
      setTimeout(() => { navLocked = false; }, 240);
    }

    /* Build clickable/keyboard thumbnails */
    imgs.forEach((img, idx) => {
      // accessible
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(idx);
      });
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo(idx);
        }
      });
    });

    /* Close button */
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        hideLightbox();
      });
    }

    /* Backdrop click to close */
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        // clicking the backdrop (lightbox itself) closes
        if (e.target === lightbox) hideLightbox();
      });
    }

    /* Prev / Next buttons */
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(currentIndex - 1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(currentIndex + 1);
      });
    }

    /* Keyboard handling while lightbox open */
    document.addEventListener('keydown', (e) => {
      if (!lightbox || lightbox.getAttribute('aria-hidden') === 'true') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        hideLightbox();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateTo(currentIndex - 1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateTo(currentIndex + 1);
        return;
      }

      // focus trap for Tab navigation
      trapFocus(e);
    });

    /* Keep lightbox stage focusable for screen readers */
    if (stage) stage.setAttribute('tabindex', '-1');

    /* Safety: if user resizes, ensure the centering remains reasonable (optional) */
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // if lightbox open, re-center the current card subtly
        if (lightbox && lightbox.getAttribute('aria-hidden') === 'false') {
          centerCardInView(currentIndex);
        }
      }, 250);
    });

    /* Ensure touch users can swipe in mobile if you want — basic support (optional) */
    // Minimal swipe detection: horizontal only
    (function addSwipeSupport() {
      let startX = null;
      let startY = null;
      const threshold = 60; // px

      lightbox && lightbox.addEventListener('touchstart', function (ev) {
        if (!ev.touches || ev.touches.length > 1) return;
        startX = ev.touches[0].clientX;
        startY = ev.touches[0].clientY;
      }, { passive: true });

      lightbox && lightbox.addEventListener('touchend', function (ev) {
        if (!startX || !ev.changedTouches || ev.changedTouches.length > 1) { startX = null; startY = null; return; }
        const dx = ev.changedTouches[0].clientX - startX;
        const dy = ev.changedTouches[0].clientY - startY;
        // ignore vertical swipes
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
          if (dx > 0) {
            navigateTo(currentIndex - 1);
          } else {
            navigateTo(currentIndex + 1);
          }
        }
        startX = null; startY = null;
      }, { passive: true });
    })();

    // Expose a tiny debug API on window if needed (only in dev)
    try {
      Object.defineProperty(window, '__diyaLightbox', {
        value: { showLightbox, hideLightbox, navigateTo },
        writable: false,
        configurable: true,
        enumerable: false
      });
    } catch (e) { /* ignore */ }
  });
})();

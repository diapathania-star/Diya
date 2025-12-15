// F2.js 
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
      const desiredLeft = scrollLeft + (itemRect.left - galleryRect.left) - 
        (galleryRect.width / 2) + (itemRect.width / 2);
        
      gallery.scrollTo({
        left: desiredLeft,
        behavior: 'smooth'
      });
    }
    
    /* Utility: Get all focusable elements within the lightbox */
    function getFocusableElements() {
      if (!lightbox) return [];
      return Array.from(lightbox.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetWidth > 0 && el.offsetHeight > 0);
    }
    
    /* Trap focus inside the lightbox for accessibility */
    function trapFocus(e) {
      if (lightbox.getAttribute('aria-hidden') === 'true' || navLocked) return;
      
      const focusables = getFocusableElements();
      if (focusables.length === 0) {
        // Allow focus on the stage if nothing else is focusable
        if (stage && document.activeElement !== stage) {
          e.preventDefault();
          stage.focus();
        }
        return;
      }
      
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      
      if (e.shiftKey) { // shift + tab
        if (active === first || active === lightbox) {
          e.preventDefault();
          last.focus();
        }
      } else { // tab
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
          try {
            btnClose.focus();
          } catch (e) { /* ignore */ }
        } else if (stage) {
          try {
            stage.focus();
          } catch (e) { /* ignore */ }
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
      
      // return focus to the last focused element
      if (lastFocused) {
        try {
          lastFocused.focus();
        } catch (e) { /* ignore */ }
        lastFocused = null;
      }
    }
    
    /* Navigation utility */
    function navigateTo(index) {
      if (navLocked) return;
      navLocked = true;
      
      let newIndex = index;
      
      // loop logic
      if (newIndex < 0) {
        newIndex = imgs.length - 1;
      } else if (newIndex >= imgs.length) {
        newIndex = 0;
      }
      
      // Determine if we should center the gallery view or not (only center if coming from outside)
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
      
      if (e.key === 'Escape') { // Esc key closes
        e.preventDefault();
        hideLightbox();
      } else if (e.key === 'ArrowRight') { // Right arrow for next
        e.preventDefault();
        navigateTo(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') { // Left arrow for previous
        e.preventDefault();
        navigateTo(currentIndex - 1);
      } else if (e.key === 'Tab') { // Tab key focus trap
        trapFocus(e);
      }
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
    
    /* Basic swipe support on mobile */
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
        
        startX = null; 
        startY = null; 
      });
    })();
  });
})();


// -------------------------
// Section reveal on scroll
// -------------------------
(function () {
  'use strict';

  if (!('IntersectionObserver' in window)) {
    // If browser doesn't support it, just show everything
    var fallbackSections = document.querySelectorAll('.reveal-section');
    fallbackSections.forEach(function (el) {
      el.classList.add('in-view');
    });
    return;
  }

  var sections = document.querySelectorAll('.reveal-section');
  if (!sections.length) return;

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target); // only animate once
      }
    });
  }, {
    threshold: 0.15
  });

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();



// -------------------------
// Four Pillars – switch content on click
// -------------------------
(function () {
  'use strict';

  function initPillars() {
    var pills = document.querySelectorAll('.pillar-pill');
    var titleEl = document.querySelector('.pillar-title');
    var bodyEl = document.querySelector('.pillar-body');
    var linkEl = document.querySelector('.pillar-link');

    if (!pills.length || !titleEl || !bodyEl || !linkEl) return;

    var PILLAR_DATA = {
      unlearning: {
        title: 'Unlearning',
        body:
          "Letting go of old scripts, ego, and “this is how it’s done” so you can see your work and yourself with fresh eyes.",
        hash: '#unlearning'
      },
      rebuilding: {
        title: 'Rebuilding',
        body:
          "Designing new systems, habits, and structures that actually match who you are now – not who you were five years ago.",
        hash: '#rebuilding'
      },
      aesthetic: {
        title: 'Aesthetic presence',
        body:
          "How your work feels and looks in the world – online and offline – so your presence is quiet, intentional, and memorable.",
        hash: '#aesthetic-presence'
      },
      human: {
        title: 'Human experience',
        body:
          "Working in a way that protects your nervous system, your time, and your relationships, instead of burning them for output.",
        hash: '#human-experience'
      }
    };

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var key = pill.dataset.pillar;
        var data = PILLAR_DATA[key];
        if (!data) return;

        // active state
        pills.forEach(function (p) {
          p.classList.remove('is-active');
        });
        pill.classList.add('is-active');

        // update panel content
        titleEl.textContent = data.title;
        bodyEl.textContent = data.body;
        linkEl.href = 'comingsoon.html' + data.hash; // change file name if needed
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPillars);
  } else {
    initPillars();
  }
})();


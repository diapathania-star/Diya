// Accordions
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.acc button');
  if (!btn) return;
  const acc = btn.closest('.acc');
  const expanded = acc.getAttribute('aria-expanded') === 'true';
  acc.setAttribute('aria-expanded', String(!expanded));
  btn.setAttribute('aria-expanded', String(!expanded));
});

// Reading progress
const progress = document.getElementById('readProgress');
function onScroll() {
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
  if (progress) progress.style.width = (scrolled * 100).toFixed(2) + '%';
}
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Gallery lightbox
const dlg = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
const lbClose = document.getElementById('lb-close');

document.querySelectorAll('.g-item').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    if (!dlg) return;
    const href = a.getAttribute('href');
    const img = a.querySelector('img');
    lbImg.src = href;
    lbImg.alt = img?.alt || a.dataset.caption || '';
    lbCap.textContent = a.dataset.caption || img?.alt || '';
    dlg.showModal();
  });
});
if (lbClose && dlg) {
  lbClose.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => {
    const rect = dlg.getBoundingClientRect();
    if (!(e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom)) {
      dlg.close();
    }
  });
}

// Calm reveal on scroll (respects prefers-reduced-motion)
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window) || !els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: .12, rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
})();

// Corner radial progress + back to top
(function(){
  const btn = document.getElementById('radialProgress');
  if(!btn) return;
  const fg = btn.querySelector('.rp-fg');
  const len = 2 * Math.PI * 20; // circle length with r=20
  function setProgress(){
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    fg.style.strokeDasharray = `${len}`;
    fg.style.strokeDashoffset = `${len - p*len}`;
  }
  document.addEventListener('scroll', setProgress, {passive:true});
  window.addEventListener('resize', setProgress);
  setProgress();
  btn.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));
})();

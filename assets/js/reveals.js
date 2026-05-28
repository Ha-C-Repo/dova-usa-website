/*
 * D.O.V.A. line reveals, count-up tickers, and scroll-progress bar.
 * Vanilla. No GSAP plugins required.
 */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // === Scroll progress bar (sets --scroll-progress on body) ===
  function updateProgress() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? (window.scrollY / docH) * 100 : 0;
    document.body.style.setProperty('--scroll-progress', p.toFixed(2) + '%');
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // === SplitText (vanilla): wrap each line of an element ===
  function splitIntoLines(el) {
    if (el.dataset.split === 'done') return;
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.textContent = '';
    // We treat each word as a span. CSS .reveal-line handles overflow.
    // For multi-line headings, browser handles wrap; we wrap the WHOLE element as one line container
    // and let CSS overflow:hidden + transform clip the slide-up.
    el.classList.add('reveal-line');
    const inner = document.createElement('span');
    inner.textContent = text;
    el.appendChild(inner);
    el.dataset.split = 'done';
  }

  // Apply to H1, H2, eyebrows
  const headings = document.querySelectorAll('.imm2-h1 .gradline, h2.s-h2, .eyebrow, .imm2-eyebrow, .hero-h1, .hero-sub, .imm2-sub');
  headings.forEach(splitIntoLines);

  // IntersectionObserver to trigger reveal
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal-line').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal-line').forEach(el => el.classList.add('is-in'));
  }

  // === Count-up tickers on .stat-n ===
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const startVal = 0;
    const isInt = Number.isInteger(target) && Math.abs(target) >= 10;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutQuart(t);
      const val = startVal + (target - startVal) * eased;
      el.dataset.formattedValue = isInt ? Math.round(val).toLocaleString() : val.toFixed(0);
      // Preserve any <span class="hi"> suffix
      const hi = el.querySelector('.hi');
      const num = isInt ? Math.round(val).toLocaleString() : val.toString();
      if (hi) {
        el.firstChild.nodeValue = num;
      } else {
        el.textContent = num;
      }
      if (t < 1) requestAnimationFrame(frame);
      else el.classList.remove('is-counting');
    }
    el.classList.add('is-counting');
    requestAnimationFrame(frame);
  }
  document.querySelectorAll('.stat-n').forEach(el => {
    // Read the displayed number, treat as the target
    const raw = (el.firstChild && el.firstChild.nodeType === 3) ? el.firstChild.nodeValue : el.textContent;
    const m = raw && raw.match(/(\d[\d,]*)/);
    if (!m) return;
    const target = parseInt(m[1].replace(/,/g, ''), 10);
    if (!target || target < 2) return;
    el.dataset.target = target;
  });
  if (!reduced && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const t = parseInt(e.target.dataset.target, 10);
          if (!isNaN(t)) animateCounter(e.target, t, 1100);
          io2.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat-n[data-target]').forEach(el => io2.observe(el));
  }
})();
/*
 * DOVA site-wide interactivity layer.
 *
 * Loaded on every page after main.js and reveals.js. Auto-initializes
 * on DOMContentLoaded. Honors prefers-reduced-motion. Adds:
 *
 *   - Custom cursor with cyan halo, magnetic on .magnetic CTAs.
 *   - 3D tilt on cards with [data-tilt] or .tilt-card class.
 *   - Section reveal-on-scroll for [data-reveal] and major blocks.
 *   - Ambient grid behind elements with .bg-grid-cyan.
 *   - Smooth Lenis init when window.Lenis is present but not yet started.
 *
 * No external dependencies beyond what the page already loads.
 */

(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Custom cursor with magnetic effect ----------
  function initCursor() {
    if (reduce) return;
    if ('ontouchstart' in window && window.innerWidth < 920) return;
    if (document.querySelector('.dova-cursor')) return;

    const cursor = document.createElement('div');
    cursor.className = 'dova-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);

    const dot = document.createElement('div');
    dot.className = 'dova-cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;
    let dx = mx, dy = my;
    let magnetTarget = null;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    // Detect magnetic targets and pull cursor toward their center
    function findMagnet() {
      const r = 90;
      const candidates = document.querySelectorAll('.magnetic, .btn-p, .btn-s, .btn-p-w, .btn-s-w, .imm2-btn-p, .imm2-btn-s, .nav-cta');
      let best = null, bestDist = r;
      candidates.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const ex = rect.left + rect.width / 2;
        const ey = rect.top + rect.height / 2;
        const d = Math.hypot(ex - mx, ey - my);
        if (d < bestDist) { bestDist = d; best = { el, ex, ey }; }
      });
      magnetTarget = best;
    }

    function loop() {
      findMagnet();
      const tx = magnetTarget ? magnetTarget.ex * 0.4 + mx * 0.6 : mx;
      const ty = magnetTarget ? magnetTarget.ey * 0.4 + my * 0.6 : my;
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      dx += (mx - dx) * 0.6;
      dy += (my - dy) * 0.6;
      cursor.style.transform = 'translate(' + (cx - 22) + 'px, ' + (cy - 22) + 'px)';
      dot.style.transform = 'translate(' + (dx - 3) + 'px, ' + (dy - 3) + 'px)';
      cursor.classList.toggle('is-magnet', !!magnetTarget);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('mouseleave', () => {
      cursor.classList.add('is-hidden');
      dot.classList.add('is-hidden');
    });
    document.addEventListener('mouseenter', () => {
      cursor.classList.remove('is-hidden');
      dot.classList.remove('is-hidden');
    });
  }

  // ---------- 3D tilt on cards ----------
  function initTilt() {
    if (reduce) return;
    const selectors = '.aud-card, .d-card, .step, .feature, .layer, .vert-card, .post-card, [data-tilt]';
    const cards = document.querySelectorAll(selectors);
    cards.forEach((card) => {
      let bound = false;
      card.addEventListener('mouseenter', () => {
        if (bound) return;
        bound = true;
        card.style.willChange = 'transform';
        card.style.transition = 'transform 0.18s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s ease, border-color 0.3s ease';
      });
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const maxTilt = 5; // degrees
        const tiltX = -dy * maxTilt;
        const tiltY = dx * maxTilt;
        const lift = -4;
        card.style.transform = 'perspective(900px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg) translateY(' + lift + 'px)';
      });
      card.addEventListener('mouseleave', () => {
        bound = false;
        card.style.transform = '';
        setTimeout(() => { card.style.willChange = ''; }, 220);
      });
    });
  }

  // ---------- Section reveals ----------
  function initReveals() {
    if (reduce || !('IntersectionObserver' in window)) return;
    const els = document.querySelectorAll(
      '.section .inner > *, .b-cta > *, [data-reveal], .step, .aud-card, .d-card, .feature, .prob-item, .stats-bar > *'
    );
    els.forEach((el) => {
      if (el.classList.contains('no-reveal')) return;
      el.classList.add('dova-reveal');
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.dova-reveal').forEach((el) => io.observe(el));
  }

  // ---------- Ambient grid backgrounds ----------
  function initAmbientGrid() {
    // Auto-add the grid layer to opt-in containers
    document.querySelectorAll('.bg-grid-cyan').forEach((el) => {
      if (el.querySelector('.dova-grid-layer')) return;
      const layer = document.createElement('div');
      layer.className = 'dova-grid-layer';
      layer.setAttribute('aria-hidden', 'true');
      el.insertBefore(layer, el.firstChild);
    });
  }

  // ---------- Lenis if not started ----------
  function initLenisIfNeeded() {
    if (reduce) return;
    if (!window.Lenis) return;
    if (window.__dovaLenisStarted) return;
    window.__dovaLenisStarted = true;
    try {
      const lenis = new window.Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false
      });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        lenis.on('scroll', window.ScrollTrigger.update);
      }
    } catch (e) { /* swallow */ }
  }

  // ---------- 100 percent dot matrix populator ----------
  function initStatMatrix() {
    const svgNS = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('.stat-matrix').forEach((g) => {
      if (g.dataset.filled) return;
      g.dataset.filled = 'true';
      const cols = 20, rows = 5, sx = 38, sy = 6, gap = 4.5, r = 1.4;
      let i = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const c = document.createElementNS(svgNS, 'circle');
          c.setAttribute('cx', sx + col * gap);
          c.setAttribute('cy', sy + row * gap);
          c.setAttribute('r', r);
          c.setAttribute('fill', '#00C8E8');
          // Stagger the matrix fill so it reads as a wave
          const delay = ((col + row) * 18) + (row * 12);
          c.style.animationDelay = delay + 'ms';
          c.style.transformOrigin = (sx + col * gap) + 'px ' + (sy + row * gap) + 'px';
          g.appendChild(c);
          i++;
        }
      }
    });
  }

  // ---------- Boot ----------
  function boot() {
    initCursor();
    initTilt();
    initReveals();
    initAmbientGrid();
    initStatMatrix();
    initLenisIfNeeded();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

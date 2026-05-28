/*
 * D.O.V.A. page transitions.
 * Intercept same-origin <a> clicks. Fade and slide-up the content,
 * navigate, fade in. ~300ms total. Skipped on prefers-reduced-motion
 * and on cmd/ctrl/shift/alt clicks (new-tab intent).
 */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('animate' in document.documentElement)) return; // need Web Animations API

  // Overlay for the curtain effect
  const overlay = document.createElement('div');
  overlay.id = 'dova-transition';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: '#050E1C',
    zIndex: '9998',
    opacity: '0',
    pointerEvents: 'none',
    transformOrigin: 'top center'
  });
  document.documentElement.appendChild(overlay);

  // Fade-in on arrival
  document.documentElement.style.opacity = '0';
  window.addEventListener('pageshow', () => {
    document.documentElement.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 320, easing: 'cubic-bezier(0.2,0.8,0.2,1)', fill: 'forwards' }
    );
  });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#')) return;
    if (a.target === '_blank') return;
    if (a.hasAttribute('download')) return;
    // External link guard
    let url;
    try { url = new URL(href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    // Cancel Lenis if active
    if (window.__lenis && typeof window.__lenis.stop === 'function') window.__lenis.stop();

    overlay.animate(
      [{ opacity: 0, transform: 'translateY(8%)' }, { opacity: 1, transform: 'translateY(0%)' }],
      { duration: 260, easing: 'cubic-bezier(0.4,0.0,0.2,1)', fill: 'forwards' }
    );
    document.documentElement.animate(
      [{ filter: 'blur(0px)' }, { filter: 'blur(2px)' }],
      { duration: 240, easing: 'cubic-bezier(0.4,0.0,0.2,1)', fill: 'forwards' }
    );
    setTimeout(() => { window.location.href = url.toString(); }, 270);
  }, true);
})();
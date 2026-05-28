/*
 * Cinematic bed video attacher.
 * Only attempts the video request if a webm or mp4 sibling file exists.
 * Uses fetch HEAD to confirm before assigning src.
 */
(function () {
  'use strict';
  const v = document.querySelector('.cinematic-bed-video');
  if (!v) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 768px)').matches) return; // skip on small screens to save data
  const webm = v.dataset.src;
  const mp4  = v.dataset.srcMp4;
  function tryAttach(url) {
    return fetch(url, { method: 'HEAD' }).then(r => r.ok ? url : null).catch(() => null);
  }
  Promise.all([tryAttach(webm), tryAttach(mp4)]).then(([w, m]) => {
    const src = w || m;
    if (!src) return; // leave the CSS fallback running
    v.src = src;
    v.addEventListener('loadeddata', () => v.classList.add('is-loaded'), { once: true });
    v.play().catch(() => {});
  });
})();
/*
 * D.O.V.A. interactive primitives.
 * Vanilla ports of Magic UI / Aceternity patterns (MIT).
 * Source patterns: magicui.design (animated underline, magnetic button),
 *                  ui.aceternity.com (spotlight hover card).
 * Voice firewall: no copy from upstream is shipped here, only the interaction model.
 *
 * Gates:
 *   - All effects respect prefers-reduced-motion.
 *   - All effects use @media (hover: hover) at the CSS layer.
 *   - Magnetic strength capped at 8 px to stay subtle.
 */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  // === Magnetic buttons ===
  const MAGNETIC_RANGE = 8;       // max px deflection
  const MAGNETIC_FALLOFF = 0.4;   // multiplier
  document.querySelectorAll('.magnetic').forEach((el) => {
    let rect = null;
    let rafId = 0;
    let tx = 0, ty = 0;

    function onEnter() { rect = el.getBoundingClientRect(); }
    function onMove(e) {
      if (!rect) rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * MAGNETIC_FALLOFF;
      const dy = (e.clientY - cy) * MAGNETIC_FALLOFF;
      tx = Math.max(-MAGNETIC_RANGE, Math.min(MAGNETIC_RANGE, dx));
      ty = Math.max(-MAGNETIC_RANGE, Math.min(MAGNETIC_RANGE, dy));
      if (!rafId) rafId = requestAnimationFrame(apply);
    }
    function apply() {
      el.style.transform = `translate(${tx}px, ${ty}px)`;
      rafId = 0;
    }
    function onLeave() {
      tx = 0; ty = 0;
      el.style.transform = '';
      rect = null;
    }

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
  });

  // === Spotlight hover (CSS vars driven by mousemove) ===
  document.querySelectorAll('.spotlight').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--sx', x + '%');
      el.style.setProperty('--sy', y + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--sx');
      el.style.removeProperty('--sy');
    });
  });
})();

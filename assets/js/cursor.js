/*
 * D.O.V.A. custom cursor.
 * 16 px ring follows mouse with spring physics.
 * Scales to 40 px on .magnetic, <a>, <button>, [role=button].
 * Hidden on touch and on prefers-reduced-motion.
 */
(function () {
  'use strict';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cursor = document.createElement('div');
  cursor.id = 'dova-cursor';
  document.documentElement.appendChild(cursor);

  // Target coords (mouse) and tracked coords (animated)
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty;
  const lerp = (a, b, t) => a + (b - a) * t;

  document.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  // Hover detection on interactive elements
  const HOVER_SEL = 'a, button, [role=button], .magnetic, .spotlight, input, textarea, select, label';
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest(HOVER_SEL)) cursor.classList.add('is-hover');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest(HOVER_SEL)) cursor.classList.remove('is-hover');
  }, { passive: true });
  document.addEventListener('pointerdown', () => cursor.classList.add('is-press'), { passive: true });
  document.addEventListener('pointerup',   () => cursor.classList.remove('is-press'), { passive: true });
  window.addEventListener('blur',    () => cursor.style.opacity = '0');
  window.addEventListener('focus',   () => cursor.style.opacity = '1');

  function tick() {
    cx = lerp(cx, tx, 0.22);
    cy = lerp(cy, ty, 0.22);
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
})();
/**
 * smoothScrollToTop — manual rAF-driven smooth scroll to y=0.
 *
 * We can't use `window.scrollTo({ behavior: 'smooth' })` because
 * framer-motion's layout-measurement system calls
 * `window.scrollTo(x, y)` to preserve scroll position when motion
 * components measure or remount, which cancels the browser's native
 * smooth-scroll. By stepping every animation frame ourselves with
 * `behavior: 'instant'`, our call overrides framer-motion's restore
 * inside the same rAF window — the user sees a clean ease and the
 * page actually reaches y=0.
 */
export function smoothScrollToTop(durationMs = 750) {
  if (typeof window === 'undefined') return;
  const startY = window.scrollY;
  if (startY === 0) return;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
    const y = startY * (1 - eased);
    window.scrollTo({ top: y, behavior: 'instant' });
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

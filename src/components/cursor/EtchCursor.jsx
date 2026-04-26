import { useEffect, useRef } from 'react';
import { useMotion } from '../../app/motion.jsx';

/**
 * EtchCursor — replaces the native cursor with a tiny copper bead that
 * leaves a faint, slowly-fading etch on the substrate as you move.
 *
 * Two canvases work together:
 *
 *   • etch canvas (z-1, behind content)  — long-lived, low-alpha trail
 *     that lives on the silicon plane. Fades over ETCH_LIFETIME.
 *   • bead canvas (z-70, above content)  — the bead at the cursor point,
 *     a soft halo, and a subtle ring when hovering interactive elements.
 *
 * The bead is the user's "now". The etch is "where you've been" — and
 * because it lives BEHIND the prose, it never fights the text.
 *
 * Motion gating:
 *   full → bead + animated halo + etch trail + hover ring (smoothed)
 *   calm → bead only, instant hover state (no halo pulse, no trail)
 *   off  → component returns null, native cursor restored.
 *
 * Disabled on coarse-pointer devices (touch). Theme-aware: reads
 * --accent-amber on mount and on theme change.
 */

const ETCH_LIFETIME = 6500;
const ETCH_MAX_POINTS = 220;
const ETCH_SAMPLE_MIN_DIST = 4; // px — below this, skip new sample
const HOVER_SELECTORS =
  'a, button, [role="button"], input, textarea, select, [contenteditable=""], [contenteditable="true"], .pad';

export default function EtchCursor() {
  const { level } = useMotion();
  const beadCanvasRef = useRef(null);
  const etchCanvasRef = useRef(null);

  useEffect(() => {
    if (level === 'off') return undefined;
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(pointer: fine)').matches
    ) {
      return undefined;
    }

    const beadCanvas = beadCanvasRef.current;
    const etchCanvas = etchCanvasRef.current;
    if (!beadCanvas || !etchCanvas) return undefined;
    const beadCtx = beadCanvas.getContext('2d');
    const etchCtx = etchCanvas.getContext('2d');
    if (!beadCtx || !etchCtx) return undefined;

    document.body.classList.add('cursor-hidden');

    let dpr = window.devicePixelRatio || 1;
    function resize() {
      dpr = window.devicePixelRatio || 1;
      [beadCanvas, etchCanvas].forEach((c) => {
        c.width = window.innerWidth * dpr;
        c.height = window.innerHeight * dpr;
        c.style.width = `${window.innerWidth}px`;
        c.style.height = `${window.innerHeight}px`;
      });
    }
    resize();
    window.addEventListener('resize', resize);

    // Theme-aware copper. Read once, refresh on theme attribute change.
    let copperRGB = readCopper();
    function readCopper() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-amber')
        .trim();
      const parsed = parseColor(raw);
      return parsed || [245, 180, 97];
    }
    const themeObserver = new MutationObserver(() => {
      copperRGB = readCopper();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let active = false;
    let pressed = false;
    let hoverT = 0; // smoothed [0..1]

    /** @type {{x:number,y:number,t:number}[]} */
    const points = [];
    const animated = level !== 'calm';

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      active = true;
      const last = points[points.length - 1];
      if (
        !last ||
        Math.hypot(mx - last.x, my - last.y) >= ETCH_SAMPLE_MIN_DIST
      ) {
        points.push({ x: mx, y: my, t: performance.now() });
        if (points.length > ETCH_MAX_POINTS) points.shift();
      }
    }
    function onLeave() {
      active = false;
    }
    function onDown() {
      pressed = true;
    }
    function onUp() {
      pressed = false;
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    function isInteractive(el) {
      while (el && el !== document.body) {
        if (el instanceof Element && el.matches?.(HOVER_SELECTORS)) {
          // Skip explicitly disabled controls.
          if (
            (el.tagName === 'BUTTON' || el.tagName === 'INPUT') &&
            el.disabled
          ) {
            return false;
          }
          return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    let raf = 0;
    function frame(now) {
      // Drop dead points before drawing so the array stays bounded.
      while (points.length && now - points[0].t > ETCH_LIFETIME) {
        points.shift();
      }

      // ---- Etch canvas (substrate plane) ----
      etchCtx.setTransform(1, 0, 0, 1, 0, 0);
      etchCtx.clearRect(0, 0, etchCanvas.width, etchCanvas.height);
      etchCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (animated && points.length > 1) {
        etchCtx.lineCap = 'round';
        etchCtx.lineJoin = 'round';
        const [r, g, b] = copperRGB;
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1];
          const c = points[i];
          const ageA = (now - a.t) / ETCH_LIFETIME;
          const ageC = (now - c.t) / ETCH_LIFETIME;
          const age = Math.max(ageA, ageC);
          const alpha = Math.max(0, (1 - age) * 0.16);
          if (alpha <= 0) continue;
          etchCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          etchCtx.lineWidth = 0.9;
          etchCtx.beginPath();
          etchCtx.moveTo(a.x, a.y);
          etchCtx.lineTo(c.x, c.y);
          etchCtx.stroke();
        }
      }

      // ---- Bead canvas (above content) ----
      beadCtx.setTransform(1, 0, 0, 1, 0, 0);
      beadCtx.clearRect(0, 0, beadCanvas.width, beadCanvas.height);
      beadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (active) {
        const el = document.elementFromPoint(mx, my);
        const target = isInteractive(el) ? 1 : 0;
        // Smooth in animated mode; snap in calm mode so it feels sharp.
        hoverT += (target - hoverT) * (animated ? 0.18 : 1);

        const [r, g, b] = copperRGB;

        // Soft halo behind the bead. Grows slightly on hover.
        const haloR = 11 + hoverT * 5;
        const halo = beadCtx.createRadialGradient(mx, my, 0, mx, my, haloR);
        halo.addColorStop(
          0,
          `rgba(${r}, ${g}, ${b}, ${0.18 + hoverT * 0.16})`,
        );
        halo.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.05)`);
        halo.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        beadCtx.fillStyle = halo;
        beadCtx.beginPath();
        beadCtx.arc(mx, my, haloR, 0, Math.PI * 2);
        beadCtx.fill();

        // Hover ring — thin, fades in with hoverT. Not pulsing — calm.
        if (hoverT > 0.04) {
          beadCtx.strokeStyle = `rgba(255, 230, 180, ${hoverT * 0.7})`;
          beadCtx.lineWidth = 0.9;
          beadCtx.beginPath();
          beadCtx.arc(mx, my, 6 + hoverT * 1.6, 0, Math.PI * 2);
          beadCtx.stroke();
        }

        // Bead.
        const beadR = pressed ? 1.7 : 2.4 + hoverT * 0.8;
        beadCtx.fillStyle = 'rgba(255, 232, 184, 1)';
        beadCtx.beginPath();
        beadCtx.arc(mx, my, beadR, 0, Math.PI * 2);
        beadCtx.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      themeObserver.disconnect();
      document.body.classList.remove('cursor-hidden');
    };
  }, [level]);

  if (level === 'off') return null;

  return (
    <>
      <canvas
        ref={etchCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
      />
      <canvas
        ref={beadCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70]"
      />
    </>
  );
}

/* --- helpers --- */

function parseColor(raw) {
  if (!raw) return null;
  // Hex: #rgb, #rrggbb
  if (raw.startsWith('#')) {
    if (raw.length === 4) {
      const r = parseInt(raw[1] + raw[1], 16);
      const g = parseInt(raw[2] + raw[2], 16);
      const b = parseInt(raw[3] + raw[3], 16);
      if ([r, g, b].every(Number.isFinite)) return [r, g, b];
      return null;
    }
    if (raw.length === 7) {
      const r = parseInt(raw.slice(1, 3), 16);
      const g = parseInt(raw.slice(3, 5), 16);
      const b = parseInt(raw.slice(5, 7), 16);
      if ([r, g, b].every(Number.isFinite)) return [r, g, b];
      return null;
    }
  }
  // rgb(r, g, b) / rgba(r, g, b, a)
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

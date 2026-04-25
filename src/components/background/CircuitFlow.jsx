import { useEffect, useRef } from 'react';
import { useTheme } from '../../app/theme.jsx';

/**
 * CircuitFlow — quiet substrate background.
 *
 * Award-winning chip pages put the silicon in ONE focal hero, not across the
 * viewport. So the page background does almost nothing: a deep gradient, a
 * very faint photolithography dot grid, four corner alignment marks, and a
 * single slow soft bloom that drifts. Anything more competes with the
 * actual subject.
 *
 * Reduced-motion: paints one frame.
 */
export default function CircuitFlow() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const PAL = {
      dark: {
        a: '#05060a',
        b: '#0a0d15',
        dot: 'rgba(125, 249, 255, 0.05)',
        rule: 'rgba(255, 255, 255, 0.08)',
        bloom: 'rgba(125, 249, 255, 0.10)',
      },
      light: {
        a: '#f6f1e3',
        b: '#ece5d2',
        dot: 'rgba(14, 26, 43, 0.06)',
        rule: 'rgba(14, 26, 43, 0.18)',
        bloom: 'rgba(184, 106, 31, 0.12)',
      },
    };

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let bloomT = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      const palette = themeRef.current === 'light' ? PAL.light : PAL.dark;
      ctx.clearRect(0, 0, width, height);

      // Substrate gradient — deep, asymmetric.
      const grad = ctx.createRadialGradient(
        width * 0.62,
        height * 0.42,
        0,
        width * 0.62,
        height * 0.42,
        Math.max(width, height) * 0.95,
      );
      grad.addColorStop(0, palette.a);
      grad.addColorStop(1, palette.b);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Photolithography dot grid — almost invisible, just enough texture.
      ctx.fillStyle = palette.dot;
      for (let yy = 0; yy < height; yy += 24) {
        for (let xx = 0; xx < width; xx += 24) {
          ctx.fillRect(xx, yy, 1, 1);
        }
      }

      // Slow drifting bloom — single soft halo that orbits slowly.
      const bx = width * (0.5 + 0.28 * Math.cos(t * 0.00012));
      const by = height * (0.5 + 0.18 * Math.sin(t * 0.00009));
      const radius = Math.max(width, height) * 0.5;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      bloom.addColorStop(0, palette.bloom);
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, width, height);

      // Corner alignment marks — four crosshairs only.
      ctx.strokeStyle = palette.rule;
      ctx.lineWidth = 1;
      const cm = 14;
      [
        [16, 16],
        [width - 16, 16],
        [16, height - 16],
        [width - 16, height - 16],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x - cm, y);
        ctx.lineTo(x + cm, y);
        ctx.moveTo(x, y - cm);
        ctx.lineTo(x, y + cm);
        ctx.stroke();
      });
    }

    let raf = 0;
    function frame(now) {
      bloomT = now;
      draw(bloomT);
      raf = requestAnimationFrame(frame);
    }

    resize();
    if (reduceMotion) {
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      resize();
      if (reduceMotion) draw(bloomT);
      else raf = requestAnimationFrame(frame);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100vw', height: '100dvh' }}
    />
  );
}

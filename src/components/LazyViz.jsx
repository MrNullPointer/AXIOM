import { Suspense, useEffect, useRef, useState } from 'react';

/**
 * LazyViz — defer both the chunk download AND the React mount of a
 * visualizer until the user scrolls near it.
 *
 *   <LazyViz Component={lazyComp} minHeight={420} />
 *
 * The wrapper reserves `minHeight` so the page doesn't jump when the viz
 * mounts. An IntersectionObserver with a 400 px rootMargin starts the
 * mount slightly before the viz enters the viewport so the chunk has time
 * to land before the user actually sees the area.
 *
 * Pass `eager` for above-the-fold spots (e.g. the hero) — the chunk still
 * loads asynchronously via Suspense, but no observer is needed.
 *
 * Pass `name` so concepts that share a visualizer (hero + mechanism use
 * the same encoding viz on the ISA page) get the same skeleton labelling.
 */
export default function LazyViz({
  Component,
  minHeight = 360,
  eager = false,
  name,
}) {
  const ref = useRef(null);
  const [shouldMount, setShouldMount] = useState(eager);

  useEffect(() => {
    if (shouldMount) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          obs.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shouldMount]);

  return (
    <div ref={ref} style={{ minHeight }}>
      {shouldMount ? (
        <Suspense fallback={<VizSkeleton minHeight={minHeight} name={name} />}>
          <Component />
        </Suspense>
      ) : (
        <VizSkeleton minHeight={minHeight} name={name} />
      )}
    </div>
  );
}

function VizSkeleton({ minHeight, name }) {
  return (
    <div
      className="glass relative overflow-hidden rounded-2xl"
      style={{
        minHeight,
        borderColor: 'var(--rule-strong)',
      }}
      aria-hidden="true"
    >
      <div
        className="absolute left-5 top-3 marker"
        style={{ color: 'var(--ink-faint)' }}
      >
        {name ? `loading · ${name}` : 'loading'}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px animate-pulse"
        style={{ background: 'var(--rule-strong)' }}
      />
    </div>
  );
}

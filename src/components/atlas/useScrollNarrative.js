import { useEffect, useRef, useState } from 'react';

/**
 * useScrollNarrative — drives the atlas scroll story.
 *
 * Pass a ref to the tall scroll-narrative section. Returns the current
 * progress through that section (0..1), the active stage index, and the
 * within-stage t (0..1). All three update on scroll via a rAF-throttled
 * listener so we do at most one DOM read + one setState per frame even
 * if the browser fires scroll events at >60Hz.
 *
 *   const ref = useRef(null);
 *   const { progress, stageIndex, stageT } = useScrollNarrative(ref, 7);
 *   <section ref={ref} style={{ height: '700vh' }}>...</section>
 *
 * Progress is computed as -rect.top / (rect.height - viewport.h), so the
 * narrative starts at 0 the moment the section's top reaches the top of
 * the viewport, and reaches 1 when the section's bottom reaches the
 * bottom of the viewport — which is exactly when the sticky child stops
 * sticking.
 */
export function useScrollNarrative(containerRef, totalStages, subStagesPerStage = 1, options = {}) {
  const { onTick } = options;
  const [state, setState] = useState({
    progress: 0,
    stageIndex: 0,
    stageT: 0,
    subStageIndex: 0,
    subStageT: 0,
    inView: false,
  });
  const rafRef = useRef(0);
  const pendingRef = useRef(false);
  // Track latest onTick in a ref so we don't restart the rAF loop on
  // every re-render when the parent passes an inline callback.
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    function read() {
      pendingRef.current = false;
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const total = Math.max(1, rect.height - viewportH);
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      const inView = rect.top < viewportH && rect.bottom > 0;
      const scaled = p * totalStages;
      const stageIndex = Math.min(totalStages - 1, Math.floor(scaled));
      const stageT = Math.max(0, Math.min(1, scaled - stageIndex));
      const subScaled = stageT * subStagesPerStage;
      const subStageIndex = Math.min(subStagesPerStage - 1, Math.floor(subScaled));
      const subStageT = Math.max(0, Math.min(1, subScaled - subStageIndex));
      // High-frequency tick — runs every animation frame regardless of
      // whether React state changed. The Atlas page uses this to write
      // BG zoom + dim CSS variables without paying the cost of a
      // useEffect re-run per frame.
      if (onTickRef.current) {
        onTickRef.current({ progress: p, stageIndex, stageT, subStageIndex, subStageT, inView });
      }
      setState((prev) => {
        if (
          prev.progress === p &&
          prev.stageIndex === stageIndex &&
          prev.stageT === stageT &&
          prev.subStageIndex === subStageIndex &&
          prev.subStageT === subStageT &&
          prev.inView === inView
        ) {
          return prev;
        }
        return { progress: p, stageIndex, stageT, subStageIndex, subStageT, inView };
      });
    }

    function onScroll() {
      if (pendingRef.current) return;
      pendingRef.current = true;
      rafRef.current = requestAnimationFrame(read);
    }

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, totalStages]);

  return state;
}

/**
 * StageAnimations — physics-first-principles deep visualizations.
 *
 * The actual viz code lives in per-stage modules under stages/, each
 * lazy-loaded so the atlas homepage's initial bundle only carries the
 * code for the first stage(s) the reader will see. As scroll advances,
 * upcoming stages are prefetched in the background — see
 * prefetchStage() / prefetchAll().
 *
 * Every stage of the cache-miss narrative gets THREE deep SVG
 * visualizations driven by the user's scroll depth:
 *
 *   L0 BLOCK   — the chip component in context
 *   L1 CELL    — one functional cell inside that component
 *   L2 ATOMIC  — the device-physics primitive that makes the cell work
 *
 * accent color is set per-stage by STAGE_COLORS in scenarioStages.js
 * and passed through as an SVG fill/stroke + a CSS variable.
 *
 * scrub=true couples animation frames to scroll progress (subStageT)
 * via the .sv-stage-scrub override in StageAnimations.css. When off,
 * animations run on their own clock — used by MobileNarrative's
 * tap-through carousel and any standalone embed.
 */

import { lazy, Suspense } from 'react';
import './StageAnimations.css';

// Per-stage modules. Each ships its own bundle chunk; the import()
// promise is cached after the first call, so subsequent renders of
// the same stage are synchronous from the cache.
const stageLoaders = {
  intro:      () => import('./stages/intro.jsx'),
  issue:      () => import('./stages/pipeline.jsx'),
  'l1-l2':    () => import('./stages/sram.jsx'),
  bus:        () => import('./stages/bus.jsx'),
  'l3-dram':  () => import('./stages/dram.jsx'),
  coherence:  () => import('./stages/coherence.jsx'),
  fill:       () => import('./stages/fill.jsx'),
  retire:     () => import('./stages/retire.jsx'),
  recap:      () => import('./stages/recap.jsx'),
};

// React.lazy components — built once at module load so each stage has
// a stable component identity across renders (avoids spurious
// remount-and-refetch cycles).
const stageComponents = Object.fromEntries(
  Object.entries(stageLoaders).map(([id, loader]) => [id, lazy(loader)]),
);

/**
 * prefetchStage(id) — kick off the dynamic import for a specific stage
 * without rendering it. Use this from a scroll-proximity hook so the
 * chunk is on disk by the time the user actually scrolls to that
 * stage. Cheap to call repeatedly; the loader caches the promise.
 */
export function prefetchStage(id) {
  const loader = stageLoaders[id];
  if (loader) loader();
}

/**
 * prefetchAll() — eagerly fetch every stage chunk. Use during idle time
 * once the page settles, so background tabs don't pay the cost of
 * download mid-scroll. Each call is idempotent.
 */
export function prefetchAll() {
  for (const id in stageLoaders) stageLoaders[id]();
}

// Empty fallback — the plucked card already has its chrome (header,
// code line, side panel) rendered around the viz, so the fallback
// just needs to take up the same space silently while the chunk
// resolves. Stage chunks are small (~5-25 KB gzipped) and load in
// well under a frame on a warm cache, so the fallback is rarely
// visible in practice.
function StageFallback() {
  return <div className="sv-host" aria-hidden="true" />;
}

export default function StageAnimation({
  stageId,
  subStageIndex = 0,
  subStageT = 0,
  accent = '#7df9ff',
  scrub = false,
}) {
  const Component = stageComponents[stageId];
  if (!Component) return null;
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  const t = Math.max(0, Math.min(1, subStageT));

  const viz = (
    <Suspense fallback={<StageFallback />}>
      <Component subStageIndex={lvl} accent={accent} />
    </Suspense>
  );

  // Scroll-coupled scrub: when the parent is driving substage progress
  // via scroll (PluckedStage on the atlas), wrap the viz so every CSS
  // keyframe inside is paused and frozen at frame `t * 4s` of a
  // unified 4 s clock. Animations advance with scroll position instead
  // of looping on their own clock — the viz is scrubbable. When scrub
  // is off (mobile carousel, static contexts), animations keep their
  // independent loops. SMIL <animate> elements (a few electron drift
  // orbits) aren't paused by CSS animation-play-state and stay on
  // their own clock — that's intentional ambient motion.
  if (!scrub) return viz;
  return (
    <div
      className="sv-stage-scrub"
      style={{ '--sv-t': t, display: 'contents' }}
    >
      {viz}
    </div>
  );
}

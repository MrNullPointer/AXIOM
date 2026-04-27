import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DieHero from '../components/atlas/DieHero.jsx';
import EtchedHeadline from '../components/atlas/EtchedHeadline.jsx';
import MobileBlocks from '../components/atlas/MobileBlocks.jsx';
import MobileNarrative from '../components/atlas/MobileNarrative.jsx';
import StageCallout from '../components/atlas/StageCallout.jsx';
import PluckedStage from '../components/atlas/PluckedStage.jsx';
import { prefetchStage, prefetchAll } from '../components/atlas/StageAnimations.jsx';
import { SCENARIO_STAGES } from '../components/atlas/scenarioStages.js';
import { useScrollNarrative } from '../components/atlas/useScrollNarrative.js';
import {
  useSetNarrativeStage,
  useSetNarrativeActive,
} from '../components/atlas/narrativeContext.jsx';

const ease = [0.22, 1, 0.36, 1];

/**
 * Atlas — the home page.
 *
 *   1. HERO. Atlas die at the top of the page in normal flow.
 *   2. NARRATIVE. 700vh scroll section. The atlas hero scrolls away.
 *      The BG die-shot dolly-zooms in (camera reveal). For each stage,
 *      a foreground card is plucked from the BG floorplan: it names the
 *      chip component being walked through (CPU pipeline, L1 cache,
 *      ring bus, DRAM controller, etc.) and shows that component's
 *      mechanism with a deep mini-visualization. Stage callout in the
 *      bottom-right shows the technical readout.
 */
export default function Atlas() {
  const [hovered, setHovered] = useState(null);
  const narrativeRef = useRef(null);
  // 6 substages per stage so the user descends, resurfaces, AND gets a
  // breath where the BG die-shot fully reveals before the next pluck:
  //   substage 0 → L0 BLOCK         (entering)
  //   substage 1 → L1 CELL          (going deeper)
  //   substage 2 → L2 ATOMIC        (deepest physics)
  //   substage 3 → L1 CELL          (building back up)
  //   substage 4 → L0 BLOCK         (back to context)
  //   substage 5 → REST             (card fades, BG visible, hand-off)
  // The depth mapping + rest detection live inside PluckedStage; here
  // we just request 6 sub-divisions so scroll math lines up.
  const SUB_STAGES = 6;
  // Per-frame writer — runs inside the rAF loop so BG zoom + dim
  // CSS vars update at scroll speed without re-running a React effect
  // 60 times a second. Reads no React state; everything it needs comes
  // from the tick payload.
  const onScrollTick = ({ progress: p, inView: iv, subStageIndex: si, subStageT: st }) => {
    if (!iv) {
      document.body.style.removeProperty('--bg-zoom');
      document.body.style.removeProperty('--narrative-dim');
      return;
    }
    const revealT = Math.min(1, p / 0.04);
    const eased = 1 - Math.pow(1 - revealT, 3);
    const zoom = 1 + 0.16 * eased;
    let dim = eased;

    // Recap (last stage): fade the dim overlay back to 0 so the recap
    // reads at the same brightness as the home page (y=0). Intermediate
    // stages keep their full dim. The fade happens over the first ~half
    // of the recap stage so the user has time to register the lift.
    const totalStages = SCENARIO_STAGES.length;
    const recapStartProgress = (totalStages - 1) / totalStages;
    if (p > recapStartProgress) {
      const recapT = (p - recapStartProgress) / (1 / totalStages);
      const fadeT = Math.min(1, recapT * 2); // hit 0 at the recap midpoint
      dim = Math.max(0, dim * (1 - fadeT));
    }

    // Rest beat between stages (existing): briefly let the BG breathe
    // before the next pluck.
    const stageIdx = Math.floor(p * totalStages);
    const isLast = stageIdx === totalStages - 1;
    const isRest = si === SUB_STAGES - 1 && !isLast;
    if (isRest) {
      const restEase = Math.sin(st * Math.PI);
      dim = dim * (1 - 0.7 * restEase);
    }

    document.body.style.setProperty('--bg-zoom', zoom.toFixed(4));
    document.body.style.setProperty('--narrative-dim', dim.toFixed(4));
  };
  const { progress, stageIndex, inView, subStageIndex, subStageT } =
    useScrollNarrative(narrativeRef, SCENARIO_STAGES.length, SUB_STAGES, { onTick: onScrollTick });
  const setNarrativeStage = useSetNarrativeStage();
  const setNarrativeActive = useSetNarrativeActive();
  const stage = SCENARIO_STAGES[stageIndex];
  // The last 1/6 of every deep-dive stage is the "rest" beat. The plucked
  // card bows out so the BG die-shot is briefly fully visible before the
  // next stage's pluck begins. Skipped on:
  //   • the final stage, so the user doesn't see an empty card at the
  //     very end of the narrative.
  //   • flat stages (intro/recap), which span their whole scroll-window
  //     with one continuous visualization — taking their last sixth away
  //     would leave the card empty for ~110 px of scroll right when the
  //     reader is finishing the overview.
  const isLastStage = stageIndex === SCENARIO_STAGES.length - 1;
  const isFlatStage = stage && (stage.id === 'intro' || stage.id === 'recap');
  const isRestBeat =
    subStageIndex === SUB_STAGES - 1 && !isLastStage && !isFlatStage;

  useEffect(() => {
    setNarrativeStage(null);
    return () => setNarrativeStage(null);
  }, [setNarrativeStage]);

  // Publish whether the user is currently inside the narrative scroll
  // section. App.jsx Layout drops CircuitFlow density when this is true
  // so we don't paint a rich chip surface under the dim overlay.
  useEffect(() => {
    setNarrativeActive(!!inView);
    return () => setNarrativeActive(false);
  }, [inView, setNarrativeActive]);

  // BG zoom + dim are written by useScrollNarrative's onTick callback
  // above — keeps the per-frame style writes out of React's effect
  // queue (was re-running ~60×/s during scroll). Only need a single
  // cleanup to clear the vars on unmount.
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('--bg-zoom');
      document.body.style.removeProperty('--narrative-dim');
    };
  }, []);

  // Lazy-load each stage's viz chunk on scroll proximity. We always
  // prefetch the active stage's chunk + the next two so the bundle is
  // ready before scroll reveals it. After the page has been idle for a
  // moment, prefetch every remaining chunk so back-and-forth scrolling
  // stays instant. Idempotent — the import() promises are cached.
  useEffect(() => {
    if (!inView) return;
    for (let i = 0; i <= 2; i++) {
      const id = SCENARIO_STAGES[stageIndex + i]?.id;
      if (id) prefetchStage(id);
    }
  }, [stageIndex, inView]);

  // Keyboard navigation through the narrative.
  //
  // We don't snap to substages anymore. Substage-snapping made each
  // arrow press jump ~17 % of an animation timeline, and the browser's
  // native smooth-scroll lands in 150–300 ms regardless of distance, so
  // animations had no time to play and the card-shell crossfade got
  // interrupted. Now we run a custom RAF tween (cubic-in-out) and let
  // the rAF tick translate the moving scrollY into --sv-t for free.
  //
  // Bindings:
  //   Arrow ↓/↑/←/→      relative scroll, ~8.5 % viewport, 320 ms
  //   PageDown/PageUp    jump to next/prev stage start (lands 8 % in
  //                      so the card has plucked + first beat is up)
  //   Home / End         document top / bottom, 720 ms
  //
  // Held key: each repeat extends the in-flight target instead of
  // restarting the tween, so motion stays continuous. Reversing
  // direction snaps the base back to current scrollY so up-after-down
  // feels immediate. Reduced-motion users get instant scrollTo.
  useEffect(() => {
    let raf = 0;
    let from = 0;
    let target = 0;
    let t0 = 0;
    let duration = 0;

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function maxScrollY() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function tick(now) {
      const t = duration > 0 ? Math.min(1, (now - t0) / duration) : 1;
      window.scrollTo(0, from + (target - from) * ease(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }
    function reduceMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    function scrollByAnimated(delta, ms) {
      const max = maxScrollY();
      if (reduceMotion()) {
        window.scrollTo(0, Math.max(0, Math.min(max, window.scrollY + delta)));
        return;
      }
      // Same-direction press: extend the in-flight target, so a held
      // arrow chains into continuous motion instead of stuttering on
      // each repeat. Reverse-direction press: snap base to current
      // scrollY so the user feels the reversal immediately.
      const inFlight = raf !== 0;
      const sameDir = inFlight && Math.sign(delta) === Math.sign(target - from);
      const base = sameDir ? target : window.scrollY;
      target = Math.max(0, Math.min(max, base + delta));
      from = window.scrollY;
      t0 = performance.now();
      duration = ms;
      if (!inFlight) raf = requestAnimationFrame(tick);
    }
    function scrollToAnimated(absY, ms) {
      const dest = Math.max(0, Math.min(maxScrollY(), absY));
      if (reduceMotion()) {
        window.scrollTo(0, dest);
        return;
      }
      target = dest;
      from = window.scrollY;
      t0 = performance.now();
      duration = ms;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function isTypingTarget() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      return false;
    }
    function getNarrativeBounds() {
      const el = narrativeRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const total = Math.max(1, rect.height - window.innerHeight);
      return { top, total };
    }
    // Stage index inferred from the *target* of the in-flight tween
    // when there is one — this way rapid PageDown presses chain across
    // stages instead of re-targeting the same one mid-flight.
    function currentStageIdx() {
      const b = getNarrativeBounds();
      if (!b) return 0;
      const ref = raf ? target : window.scrollY;
      const totalStages = SCENARIO_STAGES.length;
      const p = Math.max(0, Math.min(0.9999, (ref - b.top) / b.total));
      return Math.min(totalStages - 1, Math.floor(p * totalStages));
    }
    function jumpToStage(idx) {
      const b = getNarrativeBounds();
      if (!b) return;
      const totalStages = SCENARIO_STAGES.length;
      const clamped = Math.max(0, Math.min(totalStages - 1, idx));
      // Land 8 % into the stage so the card shell has plucked and the
      // first animation beat is visible — not at the prior stage's
      // rest beat.
      const targetProgress = (clamped + 0.08) / totalStages;
      scrollToAnimated(b.top + targetProgress * b.total, 720);
    }
    // Arrow step = half of one narrative substage. With 6 substages per
    // stage and 9 stages, two presses per substage means: press 1 lands
    // mid-substage (typing already complete + linger started), press 2
    // crosses into the next substage. Reading time is whatever pause
    // the user takes between presses. Outside the narrative (hero,
    // footer) we fall back to a viewport-relative step so scrolling
    // feels normal there too.
    function arrowStepPx() {
      const b = getNarrativeBounds();
      const fallback = Math.round(window.innerHeight * 0.06);
      if (!b) return fallback;
      const subPx = b.total / (SCENARIO_STAGES.length * SUB_STAGES);
      return Math.max(36, Math.round(subPx * 0.5));
    }
    function onKey(e) {
      if (isTypingTarget()) return;
      // Don't override system shortcuts (Cmd+ArrowDown, Ctrl+End, etc).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const arrowPx = arrowStepPx();
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          scrollByAnimated(arrowPx, 320);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          scrollByAnimated(-arrowPx, 320);
          break;
        case 'PageDown':
          e.preventDefault();
          jumpToStage(currentStageIdx() + 1);
          break;
        case 'PageUp':
          e.preventDefault();
          jumpToStage(currentStageIdx() - 1);
          break;
        case 'Home':
          e.preventDefault();
          scrollToAnimated(0, 720);
          break;
        case 'End':
          e.preventDefault();
          scrollToAnimated(maxScrollY(), 720);
          break;
        default:
          break;
      }
    }
    // If the user wheel-scrolls or trackpads while a tween is running,
    // the manual scroll fights the tween. Cancel the tween on any
    // user-initiated scroll input so manual scroll wins.
    function onWheel() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  useEffect(() => {
    const ric =
      typeof window !== 'undefined' && window.requestIdleCallback
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1500);
    const cancel =
      typeof window !== 'undefined' && window.cancelIdleCallback
        ? window.cancelIdleCallback
        : clearTimeout;
    const handle = ric(() => prefetchAll(), { timeout: 4000 });
    return () => cancel(handle);
  }, []);

  // Card is visible from 1.5% (just after the reveal-zoom finishes at
  // 4%) to the very end of the narrative. With 9 stages each ~11% wide,
  // intro is 0-11% so we want the card up early. During the rest beat
  // the viz hides so the BG can breathe between plucks; the callout
  // stays so the breadcrumb doesn't blink. We deliberately do NOT cap
  // the upper end — the recap waterfall is the closing punchline and
  // must stay legible through the final scroll pixels.
  const calloutVisible = inView && progress > 0.015;
  const stageVizVisible = calloutVisible && !isRestBeat;

  return (
    <>
      {/* BG dim overlay — fades dark as user scrolls into the narrative,
          so the plucked card commands attention against a near-black wash. */}
      <div className="atlas-narrative-dim" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="relative pt-6 pb-10 sm:pt-12 sm:pb-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-12 -right-12 -top-6 h-[120%]"
            style={{
              background:
                'radial-gradient(ellipse 60% 70% at 22% 50%, var(--hero-fade), var(--hero-fade-mid) 45%, transparent 75%)',
            }}
          />
          <div className="relative">
            <EtchedHeadline />
            <p className="lede mt-5 max-w-xl">
              A visual encyclopedia of computer architecture. Every concept lives
              on the die where it actually runs. Scroll
              <ScrollHintChevron />
              to follow a single instruction across the chip — or hover any
              block to enter.
            </p>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.1 }}
          aria-label="Die floorplan"
        >
          <div className="hidden md:block">
            <DieHero hovered={hovered} setHovered={setHovered} />
          </div>
          <div className="md:hidden flex flex-col gap-10">
            <MobileBlocks />
            <MobileNarrative />
          </div>
        </motion.section>
      </div>

      <section
        ref={narrativeRef}
        aria-label="Cache-miss narrative"
        className="relative hidden md:block"
        style={{ height: '650vh' }}
      >
        {/* Sticky spacer keeps the sticky-positioning context alive but
            doesn't render visible content; the plucked card is rendered
            outside (position: fixed) so it lives over the BG canvas. */}
        <div className="sticky top-0 h-screen" aria-hidden="true" />

        <PluckedStage
          stage={stage}
          subStageIndex={subStageIndex}
          subStageT={subStageT}
          visible={stageVizVisible}
        />

        <StageCallout
          stage={stage}
          stageIndex={stageIndex}
          totalStages={SCENARIO_STAGES.length}
          visible={calloutVisible}
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 sm:px-10 mt-10">
        <div className="marker mb-3">scope</div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          <Stat label="domains" value="10" />
          <Stat label="concepts" value="3" />
          <Stat label="visualizers" value="3" />
          <Stat label="lineages" value="ARM · x86 · RISC-V" />
        </ul>
      </section>

      <div className="h-24" />
    </>
  );
}

function StageStageBig({ stage, stageIndex, visible }) {
  if (!stage) return null;
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="atlas-stage-big mx-auto"
        style={{
          maxWidth: '720px',
          padding: '36px 44px',
          borderRadius: '14px',
          background: 'rgba(8, 12, 22, 0.72)',
          border: '1px solid var(--rule-strong)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow:
            '0 60px 140px -40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: '14px',
          }}
        >
          <span>
            stage {String(stageIndex + 1).padStart(2, '0')} ·{' '}
            <span style={{ color: 'rgb(var(--pad-glow))' }}>{stage.title}</span>
          </span>
          <span style={{ color: 'rgb(var(--pad-glow))' }}>{stage.id}</span>
        </div>
        <div
          style={{
            fontSize: '14px',
            color: 'var(--ink)',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--rule)',
          }}
        >
          <span style={{ color: 'var(--ink-faint)' }}>›</span> {stage.code}
        </div>
        <div style={{ paddingTop: '20px', minHeight: '160px' }}>
          <StageAnimation stageId={stage.id} accent={`rgb(var(--pad-glow))`} />
        </div>
      </div>
    </div>
  );
}

/**
 * ScrollHintChevron — small downward chevron tucked inline next to
 * "Scroll" in the lede. Bobs once every couple seconds to read as a
 * first-time hint without becoming a metronome. The bob is the only
 * thing that draws the eye to it. Disappears once the user has scrolled
 * past the hero so it stops competing with the narrative breadcrumb.
 */
function ScrollHintChevron() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setHidden(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <span
      aria-hidden="true"
      className="atlas-scroll-hint"
      style={{
        display: 'inline-flex',
        width: '0.9em',
        height: '0.9em',
        marginLeft: '0.18em',
        marginRight: '0.05em',
        verticalAlign: '-0.12em',
        color: 'rgb(var(--pad-glow))',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 320ms ease',
      }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <li
      className="flex items-baseline justify-between border-b pb-2"
      style={{ borderColor: 'var(--rule)' }}
    >
      <span className="marker">{label}</span>
      <span className="font-mono text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </li>
  );
}

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
  // The last 1/6 of every stage is the "rest" beat. The plucked card
  // bows out so the BG die-shot is briefly fully visible before the next
  // stage's pluck begins. Disabled on the final stage so the user
  // doesn't see an empty card at the very end of the narrative.
  const isLastStage = stageIndex === SCENARIO_STAGES.length - 1;
  const isRestBeat = subStageIndex === SUB_STAGES - 1 && !isLastStage;

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

  // Keyboard navigation through the narrative. Arrow keys step one
  // substage at a time, PageUp/Down step a full stage, Home/End jump
  // to the narrative's start/end. We only intercept when the narrative
  // is in view and the user isn't typing into an input. Each press
  // smooth-scrolls; the rAF tick converts the moving scrollY into
  // substage-progress on the way.
  //
  // Implementation note: holding an arrow key fires repeats faster
  // than a smooth-scroll completes, so reading "current substage"
  // from window.scrollY mid-flight would re-target the same substage
  // and the user would feel stuck. We track the *commanded* substage
  // in a ref and increment from there. When the user mouse-scrolls or
  // taps a different control, the ref re-syncs to the actual position
  // on the first quiet frame after scroll settles.
  const keyTargetRef = useRef(0);
  useEffect(() => {
    const subTotal = SCENARIO_STAGES.length * SUB_STAGES;

    function isTypingTarget() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      return false;
    }
    function currentSubstageIdx() {
      const el = narrativeRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight);
      const p = Math.max(0, Math.min(1, -rect.top / total));
      return Math.min(subTotal - 1, Math.floor(p * subTotal));
    }
    function scrollToSubstage(idx) {
      const el = narrativeRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(subTotal - 1, idx));
      keyTargetRef.current = clamped;
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const total = Math.max(1, rect.height - window.innerHeight);
      // Aim ~25 % into the substage so the script has a moment to
      // type before the next press could advance again.
      const target = top + ((clamped + 0.25) / subTotal) * total;
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
    function narrativeIsActive() {
      const el = narrativeRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }
    // Re-sync the commanded ref to the actual scroll position when
    // the user is no longer in the middle of a key-driven scroll.
    // Detect "settled" by debouncing the scroll event — if 180 ms
    // pass with no further scroll, the smooth-scroll has either
    // finished or the user mouse-scrolled to a new place.
    let settleTimer = 0;
    function onScrollSettle() {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        keyTargetRef.current = currentSubstageIdx();
      }, 180);
    }
    // Initial sync once the ref is mounted — without this, the very
    // first key press from a mouse-scrolled position uses the stale
    // 0 default and snaps the user back to the start of the narrative.
    keyTargetRef.current = currentSubstageIdx();
    function onKey(e) {
      if (isTypingTarget()) return;
      if (!narrativeIsActive()) return;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          scrollToSubstage(keyTargetRef.current + 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          scrollToSubstage(keyTargetRef.current - 1);
          break;
        case 'PageDown':
          e.preventDefault();
          scrollToSubstage(
            Math.min(subTotal - 1, (Math.floor(keyTargetRef.current / SUB_STAGES) + 1) * SUB_STAGES),
          );
          break;
        case 'PageUp':
          e.preventDefault();
          scrollToSubstage(
            Math.max(0, (Math.floor(keyTargetRef.current / SUB_STAGES) - 1) * SUB_STAGES),
          );
          break;
        case 'Home':
          e.preventDefault();
          scrollToSubstage(0);
          break;
        case 'End':
          e.preventDefault();
          scrollToSubstage(subTotal - 1);
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollSettle, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollSettle);
      window.clearTimeout(settleTimer);
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
  // 4%) to the very end. With 9 stages each ~11% wide, intro is 0-11%
  // so we want the card up early. During the rest beat the viz hides
  // so the BG can breathe between plucks; the callout stays so the
  // breadcrumb doesn't blink.
  const calloutVisible = inView && progress > 0.015 && progress < 0.99;
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

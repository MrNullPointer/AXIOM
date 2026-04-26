import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import DieHero from '../components/atlas/DieHero.jsx';
import EtchedHeadline from '../components/atlas/EtchedHeadline.jsx';
import MobileBlocks from '../components/atlas/MobileBlocks.jsx';
import MobileNarrative from '../components/atlas/MobileNarrative.jsx';
import StageCallout from '../components/atlas/StageCallout.jsx';
import PluckedStage from '../components/atlas/PluckedStage.jsx';
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
  // 5 substages per stage so the user descends AND resurfaces:
  //   substage 0 → L0 BLOCK         (entering)
  //   substage 1 → L1 CELL          (going deeper)
  //   substage 2 → L2 ATOMIC        (deepest physics)
  //   substage 3 → L1 CELL          (building back up)
  //   substage 4 → L0 BLOCK         (back to context, then next stage)
  // The depth mapping happens inside PluckedStage; here we just request
  // 5 sub-divisions so scroll math + breadcrumb pip count line up.
  const SUB_STAGES = 5;
  const { progress, stageIndex, inView, subStageIndex, subStageT } =
    useScrollNarrative(narrativeRef, SCENARIO_STAGES.length, SUB_STAGES);
  const setNarrativeStage = useSetNarrativeStage();
  const setNarrativeActive = useSetNarrativeActive();
  const stage = SCENARIO_STAGES[stageIndex];

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

  // BG zoom-in reveal — chip comes to foreground over the first 12% of
  // scroll. Simultaneously, --narrative-dim ramps up so the BG fades to
  // a deep wash and the plucked card dominates the viewport.
  useEffect(() => {
    if (!inView) {
      document.body.style.removeProperty('--bg-zoom');
      document.body.style.removeProperty('--narrative-dim');
      return undefined;
    }
    const revealT = Math.min(1, progress / 0.12);
    const eased = 1 - Math.pow(1 - revealT, 3);
    const zoom = 1 + 0.16 * eased;
    // Dim ramps to 1 over the same window — so the BG dims as the chip
    // zooms in, focal pull onto the plucked card.
    document.body.style.setProperty('--bg-zoom', zoom.toFixed(4));
    document.body.style.setProperty('--narrative-dim', eased.toFixed(4));
    return () => {
      document.body.style.removeProperty('--bg-zoom');
      document.body.style.removeProperty('--narrative-dim');
    };
  }, [progress, inView]);

  // Card is visible from 4% (just after the reveal-zoom kicks in) to
  // the very end of the narrative. Earlier threshold means stage 0
  // (Pipeline) — which only spans 0-14% of total scroll — is actually
  // visible at all three of its substages.
  const calloutVisible = inView && progress > 0.04 && progress < 0.99;
  const stageVizVisible = calloutVisible;

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
            <MobileNarrative />
            <MobileBlocks />
          </div>
        </motion.section>
      </div>

      <section
        ref={narrativeRef}
        aria-label="Cache-miss narrative"
        className="relative hidden md:block"
        style={{ height: '700vh' }}
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

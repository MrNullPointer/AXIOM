import { forwardRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import StageAnimation from './StageAnimations.jsx';
import SideBlockThumbnail from './SideBlockThumbnail.jsx';
import StageTerminal from './StageTerminal.jsx';
import { getScript } from './narrativeScripts.js';
import { STAGE_SOURCE_RECTS, STAGE_COLORS } from './scenarioStages.js';
import { smoothScrollToTop } from '../../app/scroll.js';

// Substage → depth mapping for the symmetric resurface narrative + rest.
// Going down: 0,1,2 maps to depths 0,1,2.
// Coming back up: 3,4 maps to depths 1,0.
// Substage 5 is a rest beat — the card itself is hidden by the parent,
// so the depth value here is only used if rest gets rendered briefly
// (we keep it on the same depth as substage 4 to avoid a final flicker).
// The same depth viz mounts on the way down and again on the way up,
// but with AnimatePresence the crossfade transitions both directions.
const SUBSTAGE_TO_DEPTH = [0, 1, 2, 1, 0, 0];

// intro/recap don't have an L0/L1/L2 depth pattern — they're single
// overview/summary visualizations that span the entire stage.
const FLAT_STAGES = new Set(['intro', 'recap']);

/**
 * PluckedStage — the foreground card that "plucks" the active stage's
 * component out of the BG die-shot.
 *
 * Three layers of motion:
 *
 *   1. Stage-level pluck: when stage.id changes, the outer card flies
 *      from its source rect on the BG to a centred card.
 *
 *   2. Substage-level zoom: within a single stage, scroll progresses
 *      through 5 substages mapping to depths [0,1,2,1,0]. Going down
 *      reveals progressively deeper physics; coming back up rebuilds
 *      the layer so the user always returns to context before the
 *      next instruction.
 *
 *   3. Depth crossfade: AnimatePresence keys on (stage, depth) so each
 *      depth viz mounts/unmounts smoothly with a spring transition.
 *      Substage 0 and 4 share the same depth (0) — they don't trigger
 *      a re-mount because they're never simultaneously active.
 */
export default function PluckedStage({ stage, subStageIndex = 0, subStageT = 0, visible }) {
  const flat = stage && FLAT_STAGES.has(stage.id);
  const depthIndex = flat ? 0 : (SUBSTAGE_TO_DEPTH[subStageIndex] ?? 0);
  const ascending = !flat && subStageIndex > 2;
  const reduce = useReducedMotion();
  return (
    // Default-mode AnimatePresence (NOT mode="popLayout"). popLayout
    // triggers framer-motion's layout measurement system, which
    // captures + restores window.scrollY around each measurement —
    // that cancels any in-flight smooth scroll (e.g. from the "↑
    // atlas" button). Default mode lets exiting + entering cards
    // overlap via their own initial/animate/exit transitions, no
    // layout measurement needed.
    <AnimatePresence>
      {visible && stage ? (
        <Card
          key={stage.id}
          stage={stage}
          subStageIndex={subStageIndex}
          subStageT={subStageT}
          depthIndex={depthIndex}
          ascending={ascending}
          flat={flat}
          reduce={reduce}
          script={getScript(stage.id, subStageIndex)}
        />
      ) : null}
    </AnimatePresence>
  );
}

const Card = forwardRef(function Card({ stage, subStageT, depthIndex, ascending, flat, reduce, script }, ref) {
  const hasTerminal = !!script;
  const src = STAGE_SOURCE_RECTS[stage.id] || { x: 0.5, y: 0.5, w: 0.05, h: 0.05 };
  const color = STAGE_COLORS[stage.id] || 'rgb(var(--pad-glow))';

  // Reduced-motion: snap from the same end-state, skip the pluck physics
  // and the depth-crossfade spring entirely. The card still cross-fades
  // softly via opacity so AnimatePresence keying stays meaningful.
  const initial = reduce
    ? { top: '50vh', left: '50vw', width: 'min(1100px, 95vw)', height: 'min(620px, 84vh)', opacity: 0, x: '-50%', y: '-50%' }
    : {
        top: `${src.y * 100}vh`,
        left: `${src.x * 100}vw`,
        width: `${src.w * 100}vw`,
        height: `${src.h * 100}vh`,
        opacity: 0,
        filter: 'blur(8px)',
        scale: 0.6,
      };
  const animate = {
    top: '50vh',
    left: '50vw',
    width: 'min(1100px, 95vw)',
    height: 'min(620px, 84vh)',
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    x: '-50%',
    y: '-50%',
  };
  const exit = reduce
    ? { ...initial, transition: { duration: 0.18 } }
    : { ...initial, transition: { duration: 0.42 } };

  const cardTransition = reduce
    ? { duration: 0.25 }
    : {
        type: 'spring',
        stiffness: 78,
        damping: 20,
        mass: 0.9,
        opacity: { duration: 0.35 },
        filter: { duration: 0.35 },
      };

  return (
    <motion.div
      ref={ref}
      className="atlas-plucked-card"
      initial={initial}
      animate={animate}
      exit={exit}
      transition={cardTransition}
      style={{
        position: 'fixed',
        zIndex: 30,
        '--stage-color': color,
      }}
    >
      <div
        className="atlas-plucked-chrome"
        style={{
          width: '100%',
          height: '100%',
          padding: '32px 40px 36px',
          borderRadius: '16px',
          background: 'rgba(8, 12, 22, 0.88)',
          border: `1px solid ${color}55`,
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          boxShadow: `
            0 60px 140px -40px rgba(0,0,0,0.85),
            0 0 80px -20px ${color}33,
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header — stage tag on the left, "↑ atlas" return button on
            the right. The button is the primary discoverable way to
            jump back to the homepage from anywhere in the narrative —
            glass-styled pill, accent border, gentle lift on hover.
            Available on every stage including intro / recap. */}
        <div
          className="flex items-center justify-between"
          style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          <span>
            {flat ? (stage.id === 'intro' ? 'overview · ' : 'recap · ') : 'stage · '}
            <span style={{ color }}>{stage.title}</span>
          </span>
          <AtlasReturnButton color={color} />
        </div>

        {/* Code line */}
        <div
          style={{
            fontSize: '13px',
            color: 'var(--ink)',
            paddingBottom: '10px',
            borderBottom: `1px solid ${color}22`,
          }}
        >
          <span style={{ color: 'var(--ink-faint)' }}>›</span> {stage.code}
        </div>

        {/* Depth breadcrumb only for the seven deep-dive stages — the
            overview cards aren't a zoom into anything. */}
        {!flat && (
          <DepthBreadcrumb depthIndex={depthIndex} ascending={ascending} color={color} />
        )}

        {/* Body grid: side panel · viz on the top row, narration
            terminal spanning the bottom row. Below 1280 px the side
            panel collapses to a horizontal strip — see
            plucked-card.css. Flat stages (intro/recap) drop the side
            panel and let the visualization fill full width. The
            terminal row only renders when the current substage has a
            script (`hasTerminal`); otherwise the body collapses back
            to a single row so the viz keeps its full vertical budget. */}
        <div
          className={
            'atlas-plucked-body'
            + (flat ? ' atlas-plucked-body-flat' : '')
            + (hasTerminal ? ' atlas-plucked-body-with-terminal' : '')
          }
        >
          {!flat && (
            <div className="atlas-plucked-side" style={{ borderColor: `${color}22` }}>
              <SideBlockThumbnail
                activeBlockId={stage.blockId}
                color={color}
              />
            </div>
          )}

          <div className="atlas-plucked-viz" style={{ position: 'relative', minHeight: 0 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${stage.id}-${depthIndex}`}
                initial={
                  reduce
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: ascending ? 1.08 : 0.92,
                        y: ascending ? -8 : 8,
                      }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  reduce
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: ascending ? 0.92 : 1.08,
                        y: ascending ? 8 : -8,
                      }
                }
                transition={
                  reduce
                    ? { duration: 0.18 }
                    : {
                        type: 'spring',
                        stiffness: 110,
                        damping: 22,
                        opacity: { duration: 0.32 },
                      }
                }
                style={{ width: '100%', height: '100%', position: 'absolute' }}
              >
                <StageAnimation
                  stageId={stage.id}
                  subStageIndex={depthIndex}
                  subStageT={subStageT}
                  accent={color}
                  scrub
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {hasTerminal && (
            <div className="atlas-plucked-terminal-slot">
              <StageTerminal script={script} t={subStageT} accent={color} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/**
 * AtlasReturnButton — the "↑ atlas" affordance in the card header.
 *
 * Smoothly scrolls the page back to the top (the atlas hero) with a
 * gentle ease, regardless of how deep into the narrative the user is.
 * Glass-styled pill, accent-tinted, lifts on hover. Pointer events are
 * scoped via CSS (.atlas-return-btn) so the button works inside the
 * otherwise pointer-events:none plucked card.
 *
 * Reduced-motion users get an instant scroll-to-top instead of the
 * smooth animation.
 */
function AtlasReturnButton({ color }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const handleClick = () => {
    // If we're not on the homepage, navigate there first (the
    // ScrollToTop component in App.jsx will instant-scroll on the
    // route change). If we're already on '/', smooth-scroll to top.
    if (location.pathname !== '/') {
      navigate('/');
      return;
    }
    if (reduce) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    smoothScrollToTop();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="atlas-return-btn"
      aria-label="Return to atlas"
      style={{ '--btn-accent': color }}
    >
      <svg
        viewBox="0 0 24 24"
        width="11"
        height="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 14 12 8 18 14" />
      </svg>
      <span>atlas</span>
    </button>
  );
}

/**
 * DepthBreadcrumb — three pip indicators showing current depth (L0/L1/L2)
 * within the current stage. Active pip is filled + labeled.
 */
function DepthBreadcrumb({ depthIndex, ascending, color }) {
  const labels = ['BLOCK', 'CELL', 'ATOMIC'];
  return (
    <div
      className="flex items-center gap-2"
      style={{
        fontSize: '9px',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--ink-soft)',
      }}
    >
      <span style={{ opacity: 0.85 }}>depth</span>
      {/* Direction arrow — down while descending, up while resurfacing */}
      <span
        aria-hidden="true"
        style={{
          color,
          opacity: 0.85,
          transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          transform: ascending ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}
      >
        ↓
      </span>
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: i === depthIndex ? '18px' : '6px',
              height: '2px',
              background:
                i === depthIndex
                  ? color
                  : i < depthIndex
                    ? 'var(--rule-strong)'
                    : 'var(--rule)',
              transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), background 320ms ease',
            }}
          />
          <span
            style={{
              color: i === depthIndex ? color : 'var(--ink-soft)',
              fontWeight: i === depthIndex ? 500 : 400,
              opacity: i === depthIndex ? 1 : 0.55,
            }}
          >
            L{i} · {labels[i]}
          </span>
        </span>
      ))}
    </div>
  );
}

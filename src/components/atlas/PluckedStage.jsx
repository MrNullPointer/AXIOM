import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import StageAnimation from './StageAnimations.jsx';
import SideBlockThumbnail from './SideBlockThumbnail.jsx';
import { STAGE_SOURCE_RECTS, STAGE_COLORS } from './scenarioStages.js';

// Substage → depth mapping for the symmetric resurface narrative.
// Going down: 0,1,2 maps to depths 0,1,2.
// Coming back up: 3,4 maps to depths 1,0.
// The same depth viz mounts on the way down and again on the way up,
// but with AnimatePresence the crossfade transitions both directions.
const SUBSTAGE_TO_DEPTH = [0, 1, 2, 1, 0];

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
  const depthIndex = SUBSTAGE_TO_DEPTH[subStageIndex] ?? 0;
  const ascending = subStageIndex > 2;
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout">
      {visible && stage ? (
        <Card
          key={stage.id}
          stage={stage}
          subStageIndex={subStageIndex}
          subStageT={subStageT}
          depthIndex={depthIndex}
          ascending={ascending}
          reduce={reduce}
        />
      ) : null}
    </AnimatePresence>
  );
}

function Card({ stage, subStageT, depthIndex, ascending, reduce }) {
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
        {/* Header — stage tag + plucked-from indicator */}
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
            stage · <span style={{ color }}>{stage.title}</span>
          </span>
          <span style={{ color, opacity: 0.7 }}>plucked from die</span>
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

        {/* Depth breadcrumb — shows current zoom level (using depthIndex
            so the same dot lights on the way down and on the way back). */}
        <DepthBreadcrumb depthIndex={depthIndex} ascending={ascending} color={color} />

        {/* Two-column body. Below the layout breakpoint (~1280px) it
            collapses to a single column with the side-panel acting as a
            compact horizontal strip — see plucked-card.css. */}
        <div className="atlas-plucked-body">
          <div className="atlas-plucked-side" style={{ borderColor: `${color}22` }}>
            <SideBlockThumbnail
              activeBlockId={stage.blockId}
              color={color}
            />
          </div>

          <div style={{ position: 'relative', minHeight: 0 }}>
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
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
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

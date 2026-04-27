/**
 * StageCallout — slim cycle-counter ribbon for the active scroll stage.
 *
 * A horizontal strip at the bottom-center of the viewport showing the
 * running cycle ledger as the user descends through the cache miss:
 * stage X/9 · TITLE · local cycles · cumulative cycles · progress dots.
 *
 * The plucked card already carries title, code line, and depth
 * breadcrumb; this ribbon is purely the persistent counter so the
 * "287 cycles total" punchline stays in the user's eye even while
 * the card's content rotates per substage.
 *
 * Sits below the card on the same vertical axis. Pointer events are
 * disabled so the ribbon never traps scroll over the narrative.
 *
 * Two timing roles share this ribbon:
 *
 *   • Counter (X / 09) and the dot timeline are pure scroll-progress
 *     indicators. They update instantly so the ribbon is always honest
 *     about where the user is in the journey.
 *
 *   • Title, +latency, Σcumulative are stage-specific labels. The
 *     plucked card takes ~350 ms to arrive at center after a stage
 *     boundary; if these labels swap instantly, the user reads the
 *     new stage name while the old card is still flying away. They are
 *     wrapped in an AnimatePresence mode="wait" keyed on stage.id so
 *     they crossfade in step with the card cycle. The fade duration
 *     matches the in-card terminal crossfade (180 ms) so the two read
 *     as a single ribbon-and-card breath at every stage flip.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function StageCallout({ stage, stageIndex, totalStages, visible }) {
  const reduce = useReducedMotion();
  if (!stage) return null;
  const labelFade = reduce
    ? { duration: 0.10, ease: 'easeOut' }
    : { duration: 0.18, ease: 'easeOut' };
  return (
    <div
      className="atlas-stage-callout pointer-events-none fixed z-30"
      style={{
        left: '50%',
        bottom: '20px',
        transform: `translateX(-50%) translateY(${visible ? '0' : '12px'})`,
        opacity: visible ? 1 : 0,
        transition: `opacity 320ms ${ease}, transform 320ms ${ease}`,
        width: 'min(720px, 92vw)',
      }}
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div
        className="flex items-center gap-5 overflow-hidden rounded-full px-5 py-2"
        style={{
          background: 'rgba(8, 12, 22, 0.82)',
          border: '1px solid var(--rule-strong)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow:
            '0 18px 36px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {/* Stage counter — scroll-progress indicator, updates instantly. */}
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {String(stageIndex + 1).padStart(2, '0')} / {String(totalStages).padStart(2, '0')}
        </span>

        {/* Stage-specific labels — keyed on stage.id, crossfade in step
            with the plucked card. initial={false} so the very first
            mount doesn't fade (the ribbon's outer opacity transition
            already handles entrance). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage.id}
            className="flex flex-1 items-center gap-5"
            style={{ minWidth: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={labelFade}
          >
            <span
              style={{
                fontSize: '12px',
                letterSpacing: '0.18em',
                color: 'var(--ink)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {stage.title}
            </span>

            <span style={{ flex: 1 }} />

            <span
              style={{
                fontSize: '11px',
                color: 'var(--ink-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>+</span>{' '}
              <span style={{ color: 'var(--ink)' }}>{stage.latency}</span>
            </span>

            <span
              style={{
                fontSize: '11px',
                color: 'var(--ink-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>Σ</span>{' '}
              <span style={{ color: `rgb(var(--pad-glow))`, fontWeight: 500 }}>
                {stage.cumulative}
              </span>
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Dot timeline — scroll-progress indicator, animates in place
            via per-dot CSS transition. Stays outside the swap so dots
            never blink at stage boundaries. */}
        <span className="flex items-center gap-1" style={{ paddingLeft: '4px' }}>
          {Array.from({ length: totalStages }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: i === stageIndex ? '14px' : '4px',
                height: '2px',
                background:
                  i === stageIndex
                    ? `rgb(var(--pad-glow))`
                    : i < stageIndex
                      ? 'var(--rule-strong)'
                      : 'var(--rule)',
                transition: `width 320ms ${ease}, background 320ms ${ease}`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

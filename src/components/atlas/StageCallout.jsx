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
 */

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function StageCallout({ stage, stageIndex, totalStages, visible }) {
  if (!stage) return null;
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

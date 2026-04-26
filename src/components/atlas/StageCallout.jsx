/**
 * StageCallout — terminal-style technical readout for the active scroll stage.
 *
 * One stable panel that fades content per stage, rather than 7 separate
 * panels animating in/out. Sits fixed at the bottom-right of the viewport
 * during the scroll narrative; ignores pointer events so the user can
 * still interact with the atlas behind it.
 *
 * Typography: JetBrains Mono throughout — Consolas-like, technical, the
 * right register for cycle counts and instruction encodings. The title
 * carries the stage name in big mono uppercase; the code line is the
 * instruction or operation; desc is the prose explanation; the counter
 * row shows local + cumulative cycle cost.
 */

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function StageCallout({ stage, stageIndex, totalStages, visible }) {
  if (!stage) return null;
  return (
    <div
      className="atlas-stage-callout pointer-events-none fixed z-30"
      style={{
        right: '32px',
        bottom: '32px',
        width: 'min(440px, 92vw)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 320ms ${ease}, transform 320ms ${ease}`,
      }}
      aria-live="polite"
      aria-hidden={!visible}
    >
      <div
        className="overflow-hidden rounded-md"
        style={{
          background: 'rgba(8, 12, 22, 0.78)',
          border: '1px solid var(--rule-strong)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {/* Top bar: stage counter + tag */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderBottom: '1px solid var(--rule)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.22em',
              color: 'var(--ink-faint)',
              textTransform: 'uppercase',
            }}
          >
            stage {String(stageIndex + 1).padStart(2, '0')} / {String(totalStages).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.22em',
              color: `rgb(var(--pad-glow))`,
              textTransform: 'uppercase',
            }}
          >
            {stage.id}
          </span>
        </div>

        {/* Title — the stage name, big mono caps */}
        <div className="px-4 pt-4">
          <div
            style={{
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--ink)',
              lineHeight: 1.1,
            }}
          >
            {stage.title}
          </div>
        </div>

        {/* Code — the instruction / operation, terminal style */}
        <div className="px-4 pt-2">
          <div
            style={{
              fontSize: '13px',
              color: `rgb(var(--pad-glow))`,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>›</span>{' '}
            {stage.code}
          </div>
        </div>

        {/* Description — short prose explanation */}
        <div className="px-4 pt-3 pb-4">
          <p
            style={{
              fontSize: '12.5px',
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {stage.desc}
          </p>
        </div>

        {/* Counter row — local + cumulative cycles */}
        <div
          className="flex items-stretch"
          style={{ borderTop: '1px solid var(--rule)' }}
        >
          <div className="flex-1 px-4 py-3" style={{ borderRight: '1px solid var(--rule)' }}>
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '0.22em',
                color: 'var(--ink-faint)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              latency
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--ink)',
                fontWeight: 500,
              }}
            >
              {stage.latency}
            </div>
          </div>
          <div className="flex-1 px-4 py-3">
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '0.22em',
                color: 'var(--ink-faint)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              cumulative
            </div>
            <div
              style={{
                fontSize: '14px',
                color: `rgb(var(--pad-glow))`,
                fontWeight: 500,
              }}
            >
              {stage.cumulative}
            </div>
          </div>
        </div>

        {/* Progress dots — one per stage, current one filled */}
        <div
          className="flex items-center gap-1 px-4 py-3"
          style={{
            borderTop: '1px solid var(--rule)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          {Array.from({ length: totalStages }).map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: i === stageIndex ? '18px' : '6px',
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
        </div>
      </div>
    </div>
  );
}

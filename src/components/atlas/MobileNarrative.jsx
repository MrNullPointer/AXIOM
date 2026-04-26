import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import StageAnimation from './StageAnimations.jsx';
import { SCENARIO_STAGES, STAGE_COLORS } from './scenarioStages.js';
import { DOMAINS } from '../../data/domains.js';

/**
 * MobileNarrative — tap-through version of the desktop scroll narrative.
 *
 * On viewports below the md breakpoint, scroll-driven 700vh storytelling
 * doesn't fit. Instead we render the same 7-stage walkthrough as a
 * carousel: one card at a time, prev/next buttons + dot pagination, and
 * the same per-stage technical readout (latency, cumulative, code line,
 * description) the desktop callout uses.
 *
 * The card is a static L0 viz — no scroll-coupled depth changes. The
 * idea is the user taps through the cache-miss story end-to-end and
 * still walks away with the cycle-cost punchline.
 */
export default function MobileNarrative() {
  const [stageIdx, setStageIdx] = useState(0);
  const stage = SCENARIO_STAGES[stageIdx];
  const total = SCENARIO_STAGES.length;
  const color = STAGE_COLORS[stage.id] || 'rgb(var(--pad-glow))';
  const block = DOMAINS.find((d) => d.id === stage.blockId);

  const go = (n) => {
    const next = Math.max(0, Math.min(total - 1, stageIdx + n));
    setStageIdx(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <div className="flex items-baseline justify-between">
        <div
          className="font-mono uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            color: 'var(--ink-faint)',
          }}
        >
          anatomy of a cache miss
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: '11px',
            letterSpacing: '0.18em',
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
          }}
        >
          {String(stageIdx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      {/* Card */}
      <article
        className="relative overflow-hidden rounded-md"
        style={{
          border: `1px solid ${color}55`,
          background: 'rgba(8, 12, 22, 0.78)',
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow: `0 24px 60px -20px rgba(0,0,0,0.6), 0 0 60px -28px ${color}66, inset 0 1px 0 rgba(255,255,255,0.05)`,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            borderBottom: `1px solid ${color}22`,
            background: 'rgba(0,0,0,0.25)',
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          <span>
            stage · <span style={{ color }}>{stage.title}</span>
          </span>
          <span style={{ color }}>{stage.id}</span>
        </div>

        {/* Viz panel — fixed aspect ratio so phone keyboards don't squish it */}
        <div style={{ position: 'relative', height: '220px', padding: '8px' }}>
          <StageAnimation stageId={stage.id} subStageIndex={0} accent={color} />
        </div>

        {/* Code + body */}
        <div className="px-4 pt-3 pb-4" style={{ borderTop: `1px solid ${color}22` }}>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--ink)',
              marginBottom: '10px',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>›</span> {stage.code}
          </div>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
            }}
          >
            {stage.desc}
          </p>
        </div>

        {/* Cycle counters */}
        <div
          className="flex items-stretch"
          style={{ borderTop: `1px solid ${color}22` }}
        >
          <Counter label="latency" value={stage.latency} color={color} />
          <Counter label="cumulative" value={stage.cumulative} color={color} highlight />
        </div>

        {/* Where on the chip */}
        {block ? (
          <Link
            to={`/d/${block.id}`}
            className="flex items-center justify-between px-4 py-3"
            style={{
              borderTop: `1px solid ${color}22`,
              background: 'rgba(0,0,0,0.25)',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            <span>
              on chip · <span style={{ color }}>{block.label}</span>
            </span>
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color }}
            >
              enter <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </Link>
        ) : null}
      </article>

      {/* Pager — prev / dots / next */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={stageIdx === 0}
          aria-label="Previous stage"
          className="pad inline-flex h-10 w-10 items-center justify-center rounded-full border"
          style={{
            borderColor: 'var(--rule-strong)',
            background: 'var(--glass-bg)',
            color: stageIdx === 0 ? 'var(--ink-faint)' : 'var(--ink)',
            opacity: stageIdx === 0 ? 0.45 : 1,
          }}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {SCENARIO_STAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStageIdx(i)}
              aria-label={`Go to stage ${i + 1}`}
              style={{
                width: i === stageIdx ? '20px' : '6px',
                height: '4px',
                borderRadius: '2px',
                border: 'none',
                background:
                  i === stageIdx
                    ? color
                    : i < stageIdx
                      ? 'var(--rule-strong)'
                      : 'var(--rule)',
                transition: 'width 240ms cubic-bezier(0.22, 1, 0.36, 1), background 240ms ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={stageIdx === total - 1}
          aria-label="Next stage"
          className="pad inline-flex h-10 w-10 items-center justify-center rounded-full border"
          style={{
            borderColor: 'var(--rule-strong)',
            background: 'var(--glass-bg)',
            color: stageIdx === total - 1 ? 'var(--ink-faint)' : 'var(--ink)',
            opacity: stageIdx === total - 1 ? 0.45 : 1,
          }}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Counter({ label, value, color, highlight }) {
  return (
    <div
      className="flex-1 px-4 py-3"
      style={{
        borderRight: highlight ? 'none' : 'inherit',
        borderLeft: highlight ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div
        style={{
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: 'var(--ink-faint)',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: highlight ? color : 'var(--ink)',
          fontWeight: 500,
        }}
      >
        {value}
      </div>
    </div>
  );
}

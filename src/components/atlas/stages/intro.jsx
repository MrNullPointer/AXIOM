import { Host, L } from './_primitives.jsx';

// ===================================================================
// INTRO — what the user is about to see
// ===================================================================

/**
 * IntroOverview — a horizontal journey map of the seven stages.
 *
 * Each visible element keys its reveal off the parent's --sv-t custom
 * property (set by .sv-stage-scrub). As scroll progresses 0 → 1 across
 * the entire intro stage (all 6 substages aggregated), the sequence
 * unfolds:
 *
 *   t = 0.00 — 0.06   instruction tablet pops in
 *   t = 0.04 — 0.30   journey path draws left → right
 *   t = 0.10 — 0.62   seven stops appear one by one
 *   t = 0.55 — 0.98   the byte (packet) traces the path
 *   t = 0.70 — 0.92   "ideal vs. this trip" cycle bars grow
 *   t = 0.86 — 1.00   closing footer fades in
 *
 * The fallback value `var(--sv-t, 1)` resolves to 1 when the parent is
 * not scrubbing (mobile carousel, static contexts), so every element
 * lands in its finished state instead of starting hidden.
 */

const STAGE_TIPS = [
  { id: 'issue',     label: 'ISSUE',  color: '#7df9ff', cyc:   1 },
  { id: 'l1-l2',     label: 'L1/L2',  color: '#7cf3c0', cyc:  16 },
  { id: 'bus',       label: 'RING',   color: '#f5b461', cyc:   6 },
  { id: 'l3-dram',   label: 'DRAM',   color: '#ff9b54', cyc: 240 },
  { id: 'coherence', label: 'COHERE', color: '#ff7a90', cyc:   8 },
  { id: 'fill',      label: 'FILL',   color: '#a78bfa', cyc:  15 },
  { id: 'retire',    label: 'RETIRE', color: '#ffd66a', cyc:   1 },
];

// Helper: build a CSS calc that fades 0 → 1 as --sv-t crosses [from, to].
//   reveal(0.10, 0.18) at t=0.05 → 0; at t=0.14 → 0.5; at t=0.18 → 1.
// CSS clamp keeps the result in [0, 1] without needing JS branches.
function reveal(from, to) {
  const span = Math.max(0.001, to - from);
  return `clamp(0, calc((var(--sv-t, 1) - ${from}) / ${span}), 1)`;
}

// Same shape but inverted — starts at 1, fades to 0 across [from, to].
function fadeOut(from, to) {
  const span = Math.max(0.001, to - from);
  return `clamp(0, calc((${to} - var(--sv-t, 1)) / ${span}), 1)`;
}

function IntroOverview({ accent }) {
  const startX = 60;
  const endX = 540;
  const trackY = 200;
  const step = (endX - startX) / (STAGE_TIPS.length - 1);
  const pathD = STAGE_TIPS
    .map((_, i) => {
      const x = startX + i * step;
      const y = trackY + (i % 2 === 0 ? -10 : 10);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Trace draw: stroke-dashoffset goes from 100 (hidden) to 0 (drawn) as
  // --sv-t advances over [0.04, 0.30]. We use clamp on the offset so the
  // trace can't overshoot or run negative when t is out of range.
  const traceOffset = `clamp(0, calc((0.30 - var(--sv-t, 1)) / 0.26 * 100), 100)`;

  // Packet position along the path. offset-path + offset-distance is
  // the modern CSS way to position an element along an arbitrary path.
  // The trace finishes drawing at t=0.30, packet starts moving at 0.55
  // — there's a deliberate beat between "path drawn" and "packet runs"
  // so the eye reads them as separate phases.
  const packetDist = `clamp(0%, calc((var(--sv-t, 1) - 0.55) / 0.43 * 100%), 100%)`;
  // Packet visibility — fully opaque while traveling, hidden before/after.
  const packetOpacity = `clamp(0, calc(min(var(--sv-t, 1) - 0.50, 1.02 - var(--sv-t, 1)) * 20), 1)`;

  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        {/* Static heading + subhead — visible from the start so the
            reader has the framing before any motion happens. */}
        <L x={300} y={28} text="ANATOMY OF A CACHE MISS" color={accent} em={0.95} size={13} />
        <L x={300} y={48} text="one byte · seven stops · ~287 cycles" color={accent} em={0.55} size={10} />

        {/* Instruction tablet — first thing to pop in */}
        <g
          transform="translate(220, 76)"
          style={{
            opacity: reveal(0.00, 0.06),
            transformOrigin: '80px 17px',
            transformBox: 'fill-box',
          }}
        >
          <rect width="160" height="34" rx="3" fill={accent} fillOpacity="0.06"
            stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <L x={80} y={22} text="ld x1, [x2]" color={accent} em={0.9} size={13} />
        </g>
        <line x1="300" y1="112" x2="300" y2={trackY - 18} stroke={accent}
          strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 3"
          style={{ opacity: reveal(0.02, 0.10) }} />

        {/* Journey track — guide line first, then the bright trace
            draws over it as --sv-t advances. */}
        <path d={pathD} stroke={accent} strokeOpacity="0.30" strokeWidth="1.2" fill="none"
          strokeDasharray="3 4" />
        <path d={pathD} stroke={accent} strokeOpacity="0.95" strokeWidth="1.6" fill="none"
          pathLength="100"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: traceOffset,
            filter: `drop-shadow(0 0 4px ${accent})`,
          }}
        />

        {/* Stops — each appears at its own --sv-t threshold so the
            sequence reads left → right as the user scrolls. The bright
            inner dot picks up a subtle pulse only after the stop is
            fully revealed. */}
        {STAGE_TIPS.map((s, i) => {
          const x = startX + i * step;
          const y = trackY + (i % 2 === 0 ? -10 : 10);
          // Spread reveals across [0.10, 0.62] — 7 stops, so each gets
          // ~0.075 of the timeline, with a 0.05 fade window per stop.
          const t0 = 0.10 + i * 0.075;
          const t1 = t0 + 0.05;
          // Scale grows from 0.7 to 1 over the same window — a tiny
          // "settle" that reads as the node clicking into place.
          const scaleExpr = `calc(0.7 + ${reveal(t0, t1)} * 0.3)`;
          return (
            <g
              key={s.id}
              style={{
                opacity: reveal(t0, t1),
                transform: `scale(${scaleExpr})`,
                transformOrigin: `${x}px ${y}px`,
                transformBox: 'fill-box',
              }}
            >
              <circle cx={x} cy={y} r="13" fill="rgba(8, 12, 22, 0.95)"
                stroke={s.color} strokeOpacity="0.85" strokeWidth="1.2" />
              <circle cx={x} cy={y} r="5" fill={s.color} fillOpacity="0.85"
                style={{ filter: `drop-shadow(0 0 6px ${s.color})` }} />
              <L x={x} y={y + (i % 2 === 0 ? 32 : -22)} text={s.label}
                color={s.color} em={0.9} size={10} />
              <L x={x} y={y + (i % 2 === 0 ? 46 : -36)}
                text={s.cyc === 1 ? '1 cyc' : `${s.cyc} cyc`}
                color={s.color} em={0.55} size={9} />
            </g>
          );
        })}

        {/* The byte — single packet that traces the seven stops once.
            Uses CSS offset-path so its position along the path is
            driven directly by --sv-t. Glow filter inline so the dot
            reads as a hot moving signal, not a static dot. */}
        <circle
          r="4.5"
          cx="0"
          cy="0"
          fill={accent}
          style={{
            offsetPath: `path('${pathD}')`,
            offsetDistance: packetDist,
            opacity: packetOpacity,
            filter: `drop-shadow(0 0 10px ${accent})`,
          }}
        />

        {/* Cycle comparison: ideal (L1 hit, 4 cyc) vs. this trip (287). */}
        <g transform="translate(40, 320)" style={{ opacity: reveal(0.66, 0.74) }}>
          <L x={0} y={0} text="ideal · L1 hit" color={accent} anchor="start" em={0.6} size={9} />
          <rect x={0} y={6} width={40} height={10} rx="1" fill={accent} fillOpacity="0.55"
            style={{
              transform: `scaleX(${reveal(0.68, 0.78)})`,
              transformOrigin: 'left',
              transformBox: 'fill-box',
            }} />
          <L x={50} y={15} text="4" color={accent} anchor="start" em={0.85} size={11}
            style={{ opacity: reveal(0.74, 0.80) }} />
        </g>
        <g transform="translate(40, 350)" style={{ opacity: reveal(0.74, 0.82) }}>
          <L x={0} y={0} text="this trip · all the way to DRAM"
            color={accent} anchor="start" em={0.6} size={9} />
          <rect x={0} y={6} width={520} height={10} rx="1" fill={accent} fillOpacity="0.85"
            style={{
              filter: `drop-shadow(0 0 8px ${accent})`,
              transform: `scaleX(${reveal(0.78, 0.94)})`,
              transformOrigin: 'left',
              transformBox: 'fill-box',
            }} />
          <L x={530} y={15} text="287" color={accent} anchor="end" em={1} size={11}
            style={{ opacity: reveal(0.92, 0.97) }} />
        </g>

        {/* Footer hint — visible at the start to invite scrolling, then
            swapped out for the closing line as the bars fill in. */}
        <L x={300} y={380}
          text="scroll to walk the slow path" color={accent} em={0.55} size={9}
          style={{ opacity: fadeOut(0.05, 0.20) }} />
        <L x={300} y={380}
          text="seventy times slower than a hit · this is why caches exist"
          color={accent} em={0.7} size={10}
          style={{ opacity: reveal(0.86, 0.96) }} />
      </svg>
    </Host>
  );
}

export default function IntroStage({ accent }) {
  return IntroOverview({ accent });
}

import { Host, L } from './_primitives.jsx';

// ===================================================================
// RECAP — what just happened
// ===================================================================

/**
 * RecapWaterfall — the cumulative cycle cost of the seven stages as a
 * vertical waterfall, with bars that grow one by one as scroll
 * progresses through the recap stage's full window.
 *
 * Each bar reads its --sv-t threshold off the parent's
 * .sv-stage-scrub variable. Bars do not animate via CSS keyframes
 * because keyframe staggers collapse under scrub mode — instead the
 * scaleY transform is computed inline as a calc() over --sv-t so the
 * sequence is truly scroll-coupled.
 *
 *   t = 0.00 — 0.05   axes + L1-hit baseline appear
 *   t = 0.05 — 0.85   seven bars rise in order, ~0.10 apart
 *   t = 0.55 — 0.70   "↓ the cliff" caption fades in beside DRAM
 *   t = 0.86 — 1.00   locality footer fades in
 *
 * In non-scrub contexts (mobile carousel) every element lands fully
 * formed because the var(--sv-t, 1) fallback resolves to 1.
 */

function reveal(from, to) {
  const span = Math.max(0.001, to - from);
  return `clamp(0, calc((var(--sv-t, 1) - ${from}) / ${span}), 1)`;
}

function RecapWaterfall({ accent }) {
  const stops = [
    { id: 'issue',     label: 'ISSUE',  color: '#7df9ff', cyc:   1, cum:   1 },
    { id: 'l1-l2',     label: 'L1/L2',  color: '#7cf3c0', cyc:  16, cum:  17 },
    { id: 'bus',       label: 'RING',   color: '#f5b461', cyc:   6, cum:  23 },
    { id: 'l3-dram',   label: 'DRAM',   color: '#ff9b54', cyc: 240, cum: 263 },
    { id: 'coherence', label: 'COHERE', color: '#ff7a90', cyc:   8, cum: 271 },
    { id: 'fill',      label: 'FILL',   color: '#a78bfa', cyc:  15, cum: 286 },
    { id: 'retire',    label: 'RETIRE', color: '#ffd66a', cyc:   1, cum: 287 },
  ];
  const baseY = 312;
  const topY = 110;
  const totalH = baseY - topY;
  const colW = 60;
  const x0 = 80;
  // log scale so DRAM doesn't dwarf everything else but stays the cliff
  const scale = (cum) => Math.log10(1 + cum) / Math.log10(1 + 287);

  // Bars rise across [0.05, 0.85]. Each bar gets ~0.115 of the timeline
  // with a 0.07 fade window — visibly staggered but never feels slow.
  const barWindow = 0.115;
  const barFade = 0.07;
  const dramThresh = 0.05 + 3 * barWindow; // bar 3 (DRAM) start

  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26} text="THE BILL" color={accent} em={0.95} size={13} />
        <L x={300} y={44} text="cumulative cycles · log scale" color={accent} em={0.55} size={10} />

        {/* Cliff caption fades in just before the DRAM bar lands. */}
        <g transform="translate(560, 26)"
          style={{ opacity: reveal(dramThresh - 0.06, dramThresh + barFade) }}>
          <L x={0} y={0} text="↓  the cliff" color="#ff9b54" anchor="end" em={0.85} size={10} />
          <L x={0} y={14} text="240 cyc · DRAM" color="#ff9b54" anchor="end" em={0.6} size={9} />
        </g>

        {/* Y axis — visible immediately so the bars rise into a frame. */}
        <g style={{ opacity: reveal(0.00, 0.05) }}>
          <line x1={x0 - 4} y1={topY} x2={x0 - 4} y2={baseY}
            stroke={accent} strokeOpacity="0.3" strokeWidth="0.8" />
          {[1, 10, 100].map((tick) => {
            const y = baseY - scale(tick) * totalH;
            return (
              <g key={tick}>
                <line x1={x0 - 6} y1={y} x2={x0 - 2} y2={y}
                  stroke={accent} strokeOpacity="0.4" />
                <L x={x0 - 10} y={y + 3} text={`${tick}`}
                  color={accent} anchor="end" em={0.55} size={8} />
                <line x1={x0} y1={y} x2={x0 + stops.length * colW + 20} y2={y}
                  stroke={accent} strokeOpacity="0.08" strokeWidth="0.6"
                  strokeDasharray="2 4" />
              </g>
            );
          })}
          <L x={x0 - 14} y={topY - 4} text="cyc"
            color={accent} anchor="end" em={0.5} size={8} />
        </g>

        {/* L1-hit baseline — appears with the axes. */}
        {(() => {
          const y = baseY - scale(4) * totalH;
          return (
            <g style={{ opacity: reveal(0.02, 0.08) }}>
              <line x1={x0} y1={y} x2={x0 + stops.length * colW} y2={y}
                stroke={accent} strokeOpacity="0.5" strokeWidth="1"
                strokeDasharray="4 3" />
              <L x={x0 + stops.length * colW + 6} y={y + 3}
                text="L1-hit ideal · 4"
                color={accent} anchor="start" em={0.7} size={9} />
            </g>
          );
        })()}

        {/* Bars — one per stage, each with its own --sv-t threshold.
            scaleY grows from 0 to 1 with transform-origin at the base
            so the bar appears to push up from the chart floor. */}
        {stops.map((s, i) => {
          const cumH = scale(s.cum) * totalH;
          const prevH = i === 0 ? 0 : scale(stops[i - 1].cum) * totalH;
          const x = x0 + i * colW;
          const yTop = baseY - cumH;
          const t0 = 0.05 + i * barWindow;
          const t1 = t0 + barFade;
          const grow = reveal(t0, t1);
          // The label below the bar lands a hair after the bar settles.
          const labelOp = reveal(t0 + barFade * 0.5, t1 + barFade * 0.5);
          return (
            <g key={s.id}>
              {/* Step rise — the new contribution this stage adds. */}
              <rect
                x={x + 8}
                y={yTop}
                width={colW - 16}
                height={Math.max(2, cumH - prevH)}
                fill={s.color}
                fillOpacity="0.88"
                stroke={s.color}
                strokeOpacity="0.95"
                strokeWidth="0.8"
                style={{
                  transform: `scaleY(${grow})`,
                  transformOrigin: `${x + 8}px ${baseY}px`,
                  transformBox: 'fill-box',
                  filter: `drop-shadow(0 0 8px ${s.color})`,
                  opacity: grow,
                }}
              />
              {/* Cumulative shadow under the new contribution. */}
              <rect
                x={x + 8}
                y={baseY - prevH}
                width={colW - 16}
                height={prevH}
                fill={s.color}
                fillOpacity="0.16"
                style={{
                  transform: `scaleY(${grow})`,
                  transformOrigin: `${x + 8}px ${baseY}px`,
                  transformBox: 'fill-box',
                  opacity: grow,
                }}
              />
              {/* Tick to the next bar's top — reads as a waterfall. */}
              {i < stops.length - 1 && (
                <line
                  x1={x + colW - 8}
                  y1={yTop}
                  x2={x + colW + 8}
                  y2={yTop}
                  stroke={s.color}
                  strokeOpacity="0.5"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  style={{ opacity: reveal(t1, t1 + 0.05) }}
                />
              )}
              {/* Stage label + delta */}
              <L x={x + colW / 2} y={baseY + 18}
                text={s.label} color={s.color} em={0.85} size={9}
                style={{ opacity: labelOp }} />
              <L x={x + colW / 2} y={baseY + 32}
                text={`+${s.cyc}`} color={s.color} em={0.7} size={10}
                style={{ opacity: labelOp }} />
            </g>
          );
        })}

        {/* Closing line — punchline locality message. Reveal window
            tuned so the line is fully readable a bit before the
            user reaches the bottom of the narrative scroll. */}
        <L x={300} y={386}
          text="next 64 sequential bytes hit L1 · this is locality"
          color={accent} em={0.6} size={10}
          style={{ opacity: reveal(0.80, 0.90) }} />
      </svg>
    </Host>
  );
}

export default function RecapStage({ accent }) {
  return RecapWaterfall({ accent });
}

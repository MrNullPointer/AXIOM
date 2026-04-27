import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

// ===================================================================
// RECAP — what just happened
// ===================================================================

/**
 * RecapWaterfall — the cumulative cycle cost of the seven stages as a
 * vertical waterfall. The DRAM step is the visually obvious cliff.
 *
 * First-principles framing:
 *   • Each bar's height = that stage's contribution in cycles.
 *   • The vertical axis is logarithmic (clamped) so DRAM doesn't
 *     visually erase the smaller stages — each one is still readable.
 *   • A faint "L1 hit baseline" line sits at 4 cycles on the left so
 *     the user can see how much was paid above the best case.
 */
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
  // Plot area: leave room above for title + cliff annotation, room
  // below for stage labels + footer. baseY is the chart bottom; topY
  // is the chart top (max bar height). The cliff label is placed
  // inside the title band so it never collides with the chart.
  const baseY = 312;
  const topY = 110;
  const totalH = baseY - topY;
  const colW = 60;
  const x0 = 80;
  // log scale so DRAM doesn't dwarf everything else but stays the cliff
  const scale = (cum) => Math.log10(1 + cum) / Math.log10(1 + 287);
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26} text="THE BILL" color={accent} em={0.95} size={13} />
        <L x={300} y={44} text="cumulative cycles · log scale" color={accent} em={0.55} size={10} />

        {/* DRAM cliff caption — a short, accent-coloured note on the
            right-hand side of the title band. Positioning it here
            avoids overlapping the y-axis label or the bars. */}
        <g transform="translate(560, 26)">
          <L x={0} y={0} text="↓  the cliff" color="#ff9b54" anchor="end" em={0.85} size={10} />
          <L x={0} y={14} text="240 cyc · DRAM" color="#ff9b54" anchor="end" em={0.6} size={9} />
        </g>

        {/* Y axis */}
        <line x1={x0 - 4} y1={topY} x2={x0 - 4} y2={baseY} stroke={accent} strokeOpacity="0.3" strokeWidth="0.8" />
        {[1, 10, 100].map((tick) => {
          const y = baseY - scale(tick) * totalH;
          return (
            <g key={tick}>
              <line x1={x0 - 6} y1={y} x2={x0 - 2} y2={y} stroke={accent} strokeOpacity="0.4" />
              <L x={x0 - 10} y={y + 3} text={`${tick}`} color={accent} anchor="end" em={0.55} size={8} />
              <line x1={x0} y1={y} x2={x0 + stops.length * colW + 20} y2={y}
                stroke={accent} strokeOpacity="0.08" strokeWidth="0.6" strokeDasharray="2 4" />
            </g>
          );
        })}
        <L x={x0 - 14} y={topY - 4} text="cyc" color={accent} anchor="end" em={0.5} size={8} />

        {/* L1-hit baseline (faint dashed reference at 4 cyc) */}
        {(() => {
          const y = baseY - scale(4) * totalH;
          return (
            <g>
              <line x1={x0} y1={y} x2={x0 + stops.length * colW} y2={y}
                stroke={accent} strokeOpacity="0.5" strokeWidth="1" strokeDasharray="4 3" />
              <L x={x0 + stops.length * colW + 6} y={y + 3} text="L1-hit ideal · 4"
                color={accent} anchor="start" em={0.7} size={9} />
            </g>
          );
        })()}

        {/* Bars */}
        {stops.map((s, i) => {
          const cumH = scale(s.cum) * totalH;
          const prevH = i === 0 ? 0 : scale(stops[i - 1].cum) * totalH;
          const x = x0 + i * colW;
          const yTop = baseY - cumH;
          return (
            <g key={s.id} className="sv-recap-bar"
              style={{ animationDelay: `${i * 0.25}s` }}>
              {/* Step rise (this stage's contribution) */}
              <rect x={x + 8} y={yTop} width={colW - 16} height={Math.max(2, cumH - prevH)}
                fill={s.color} fillOpacity="0.88"
                stroke={s.color} strokeOpacity="0.95" strokeWidth="0.8"
                style={{ filter: `drop-shadow(0 0 8px ${s.color})` }} />
              {/* Cumulative shadow under */}
              <rect x={x + 8} y={baseY - prevH} width={colW - 16} height={prevH}
                fill={s.color} fillOpacity="0.16" />
              {/* Tick to next bar's top to read as a waterfall */}
              {i < stops.length - 1 && (
                <line x1={x + colW - 8} y1={yTop} x2={x + colW + 8} y2={yTop}
                  stroke={s.color} strokeOpacity="0.5" strokeWidth="0.8"
                  strokeDasharray="2 2" />
              )}
              {/* Stage label + delta — sit a clear gap below baseY */}
              <L x={x + colW / 2} y={baseY + 18} text={s.label} color={s.color} em={0.85} size={9} />
              <L x={x + colW / 2} y={baseY + 32}
                text={`+${s.cyc}`} color={s.color} em={0.7} size={10} />
            </g>
          );
        })}

        {/* Footer summary — single line, anchored at the chart center */}
        <L x={300} y={386}
          text="next 64 sequential bytes hit L1 · this is locality"
          color={accent} em={0.6} size={10} />
      </svg>
    </Host>
  );
}

export default function RecapStage({ accent }) {
  return RecapWaterfall({ accent });
}

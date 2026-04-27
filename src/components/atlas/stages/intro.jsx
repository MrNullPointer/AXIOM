import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

// ===================================================================
// INTRO — what the user is about to see
// ===================================================================

/**
 * IntroOverview — a horizontal journey map of the seven stages with a
 * pulse traveling left → right, a vertical "ideal vs. actual" cycle
 * comparison on the right, and the load instruction floating above.
 *
 * First-principles framing:
 *   • The instruction is `ld x1, [x2]` — read one byte from memory.
 *   • If [x2] is in L1, we get the byte in ~4 cycles.
 *   • If it has fallen out of every level of cache, the byte costs
 *     ~287 cycles. We are about to walk that slow path.
 *
 * The seven nodes correspond 1:1 to the seven stage colours so the
 * user reads them again as the deep-dive vizes appear, anchoring the
 * mental model from the start.
 */
const STAGE_TIPS = [
  { id: 'issue',     label: 'ISSUE',      color: '#7df9ff', cyc:   1 },
  { id: 'l1-l2',     label: 'L1/L2',      color: '#7cf3c0', cyc:  16 },
  { id: 'bus',       label: 'RING',       color: '#f5b461', cyc:   6 },
  { id: 'l3-dram',   label: 'DRAM',       color: '#ff9b54', cyc: 240 },
  { id: 'coherence', label: 'COHERE',     color: '#ff7a90', cyc:   8 },
  { id: 'fill',      label: 'FILL',       color: '#a78bfa', cyc:  15 },
  { id: 'retire',    label: 'RETIRE',     color: '#ffd66a', cyc:   1 },
];

function IntroOverview({ accent }) {
  const startX = 60;
  const endX = 540;
  const trackY = 200;
  const step = (endX - startX) / (STAGE_TIPS.length - 1);
  // path along the seven stops — a flat line with subtle vertical
  // perturbation so the eye reads it as a journey, not a ruler.
  const pathD = STAGE_TIPS
    .map((_, i) => {
      const x = startX + i * step;
      const y = trackY + (i % 2 === 0 ? -10 : 10);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        {/* Headline + subtle instruction tag */}
        <L x={300} y={28} text="ANATOMY OF A CACHE MISS" color={accent} em={0.95} size={13} />
        <L x={300} y={48} text="one byte · seven stops · ~287 cycles" color={accent} em={0.55} size={10} />

        {/* Instruction tablet floating above the path */}
        <g transform="translate(220, 76)">
          <rect width="160" height="34" rx="3" fill={accent} fillOpacity="0.06"
            stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <L x={80} y={22} text="ld x1, [x2]" color={accent} em={0.9} size={13} />
        </g>
        <line x1="300" y1="112" x2="300" y2={trackY - 18} stroke={accent}
          strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* Journey track */}
        <path d={pathD} stroke={accent} strokeOpacity="0.35" strokeWidth="1.2" fill="none"
          strokeDasharray="3 4" />
        <path d={pathD} stroke={accent} strokeOpacity="0.95" strokeWidth="1.6" fill="none"
          className="sv-intro-trace" pathLength="100" />

        {/* Stops */}
        {STAGE_TIPS.map((s, i) => {
          const x = startX + i * step;
          const y = trackY + (i % 2 === 0 ? -10 : 10);
          return (
            <g key={s.id} className="sv-intro-stop" style={{ animationDelay: `${i * 0.32}s` }}>
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

        {/* Single packet — the byte traveling the whole route. Reads
            "we are following one packet" not "many packets in flight". */}
        <circle r="4.5" fill={accent}
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
          className="sv-intro-packet">
          <animateMotion dur="6s" repeatCount="indefinite" path={pathD} />
        </circle>

        {/* Cycle comparison: ideal (L1 hit) vs. actual (this trip) */}
        <g transform="translate(40, 320)">
          <L x={0} y={0} text="ideal · L1 hit" color={accent} anchor="start" em={0.6} size={9} />
          <rect x={0} y={6} width={40} height={10} rx="1" fill={accent} fillOpacity="0.55" />
          <L x={50} y={15} text="4" color={accent} anchor="start" em={0.85} size={11} />
        </g>
        <g transform="translate(40, 350)">
          <L x={0} y={0} text="this trip · all the way to DRAM" color={accent} anchor="start" em={0.6} size={9} />
          <rect x={0} y={6} width={520} height={10} rx="1" fill={accent} fillOpacity="0.85"
            style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
          <L x={530} y={15} text="287" color={accent} anchor="end" em={1} size={11} />
        </g>
        <L x={300} y={380} text="scroll to walk the slow path" color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}


export default function IntroStage({ accent }) {
  return IntroOverview({ accent });
}

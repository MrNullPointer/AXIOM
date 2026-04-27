import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';


// ===================================================================
// Stage 2 — RING BUS
// ===================================================================

/**
 * BusL0 — ring interconnect topology.
 *
 * Four stops on a ring: C0 (issuer), C1, C2 (L3 slice / target), C3.
 * The request packet rides clockwise from C0 → C1 → C2; the response
 * (smaller, faded) returns clockwise from C2 → C3 → C0. Each packet
 * fades in at its source and out at its destination so the loop has
 * no teleport seam.
 */
function BusL0({ accent }) {
  const stops = [
    { id: 'C0', cx: 80,  cy: 200, label: 'Core 0',   role: 'issuer' },
    { id: 'C1', cx: 300, cy: 80,  label: 'Core 1' },
    { id: 'C2', cx: 520, cy: 200, label: 'L3 Slice', role: 'target' },
    { id: 'C3', cx: 300, cy: 320, label: 'Core 3' },
  ];
  // Top arc: C0 → C1 → C2 (request)
  const reqPath = 'M 80 200 A 220 120 0 0 1 520 200';
  // Bottom arc: C2 → C3 → C0 (response)
  const respPath = 'M 520 200 A 220 120 0 0 1 80 200';
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Ring Interconnect · 4 Stops · Request + Response"
          color={accent} em={0.9} size={11} />

        {/* Ring track — outer rail, inner dashed rail */}
        <ellipse cx="300" cy="200" rx="220" ry="120" fill="none"
          stroke={accent} strokeOpacity="0.25" strokeWidth="1.4" />
        <ellipse cx="300" cy="200" rx="204" ry="104" fill="none"
          stroke={accent} strokeOpacity="0.14" strokeWidth="0.8"
          strokeDasharray="3 4" />

        {/* Direction arrows (clockwise) — at top + bottom */}
        <path d="M 295 84 L 309 76 L 309 92 Z" fill={accent} fillOpacity="0.55" />
        <path d="M 305 316 L 291 324 L 291 308 Z" fill={accent} fillOpacity="0.55" />

        {/* REQUEST — single packet rides the top arc, fading in at C0
            and fading out at C2. Slowed to 4s with envelope opacity. */}
        <circle r="5.5" fill={accent}
          style={{ filter: `drop-shadow(0 0 10px ${accent})` }}>
          <animateMotion dur="4s" repeatCount="indefinite" path={reqPath} />
          <animate attributeName="opacity"
            values="0;1;1;0" keyTimes="0;0.12;0.85;1"
            dur="4s" repeatCount="indefinite" />
        </circle>
        {/* Trailing decay packets, staggered so the ring reads as
            continuous request traffic. Each fades cleanly. */}
        {[1.0, 2.0, 3.0].map((delay, i) => (
          <circle key={i} r="3" fill={accent}>
            <animateMotion dur="4s" repeatCount="indefinite"
              begin={`${delay}s`} path={reqPath} />
            <animate attributeName="opacity"
              values="0;0.5;0.5;0" keyTimes="0;0.12;0.85;1"
              dur="4s" repeatCount="indefinite"
              begin={`${delay}s`} />
          </circle>
        ))}

        {/* RESPONSE — smaller packet on bottom arc, returning from C2
            to C0 a beat after the request lands. */}
        <circle r="4" fill={accent} fillOpacity="0.7">
          <animateMotion dur="4s" repeatCount="indefinite" begin="2s" path={respPath} />
          <animate attributeName="opacity"
            values="0;0.7;0.7;0" keyTimes="0;0.12;0.85;1"
            dur="4s" repeatCount="indefinite" begin="2s" />
        </circle>
        {[3.0, 5.0].map((delay, i) => (
          <circle key={`resp-${i}`} r="2.4" fill={accent}>
            <animateMotion dur="4s" repeatCount="indefinite"
              begin={`${delay}s`} path={respPath} />
            <animate attributeName="opacity"
              values="0;0.4;0.4;0" keyTimes="0;0.12;0.85;1"
              dur="4s" repeatCount="indefinite"
              begin={`${delay}s`} />
          </circle>
        ))}

        {/* Stops */}
        {stops.map((s) => {
          const isCore = s.role === 'issuer';
          const isTgt  = s.role === 'target';
          const r = isCore || isTgt ? 24 : 19;
          return (
            <g key={s.id}>
              <circle cx={s.cx} cy={s.cy} r={r + 6}
                fill={accent} fillOpacity="0.06" />
              <circle cx={s.cx} cy={s.cy} r={r} fill={accent}
                fillOpacity={isCore ? 0.55 : isTgt ? 0.45 : 0.18}
                stroke={accent}
                strokeOpacity={isCore || isTgt ? 0.95 : 0.5}
                strokeWidth={isCore || isTgt ? 1.4 : 0.9}
                style={{
                  filter: isCore || isTgt
                    ? `drop-shadow(0 0 10px ${accent})`
                    : 'none',
                }} />
              <L x={s.cx} y={s.cy + 4} text={s.id} color={accent}
                em={isCore || isTgt ? 1 : 0.85} size={11} />
              <L x={s.cx} y={s.cy + r + 18} text={s.label} color={accent}
                em={isCore || isTgt ? 0.85 : 0.55} size={9} />
            </g>
          );
        })}

        <L x={80} y={278} text="↑ issue" color={accent} em={0.7} size={9} />
        <L x={520} y={278} text="↓ recv" color={accent} em={0.7} size={9} />

        <L x={300} y={388}
          text="64-byte packet · 1 hop / cycle · request top arc, response bottom arc"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

/**
 * BusL1 — voltage on a single bus wire over time.
 *
 * Every bit transition charges or discharges the wire's lumped
 * capacitance — the dynamic-power story behind why interconnect
 * dominates modern chip energy budgets. Trace shows the actual
 * voltage waveform; cursor sweeps the time axis in lockstep with
 * the trace's draw-in animation so they read as the same event.
 *
 * Bit values are annotated above each level so the user can read
 * "1 0 1 0 1" along with the curve.
 */
function BusL1({ accent }) {
  // Trace defined as level-changes at known x positions. Both the
  // trace and the sweeping cursor share these so they stay in sync.
  const xMin   = 70;
  const xMax   = 540;
  const yHigh  = 110;        // VDD level
  const yLow   = 310;        // GND level
  const segments = [
    { x: 70,  bit: 0 },
    { x: 140, bit: 0 },
    { x: 195, bit: 1 },
    { x: 290, bit: 1 },
    { x: 345, bit: 0 },
    { x: 425, bit: 0 },
    { x: 480, bit: 1 },
    { x: 540, bit: 1 },
  ];
  // Build the path d-string from segments
  const d = segments.map((seg, i) => {
    const y = seg.bit ? yHigh : yLow;
    if (i === 0) return `M ${seg.x} ${y}`;
    const prev = segments[i - 1];
    const prevY = prev.bit ? yHigh : yLow;
    if (prev.bit !== seg.bit) {
      // vertical transition first, then horizontal hold
      return `L ${seg.x} ${prevY} L ${seg.x} ${y}`;
    }
    return `L ${seg.x} ${y}`;
  }).join(' ');
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Voltage on a Single Wire · CV²f Energy / Transition"
          color={accent} em={0.9} size={11} />

        {/* Axes */}
        <line x1={xMin - 10} y1={50} x2={xMin - 10} y2={yLow + 30}
          stroke={accent} strokeOpacity="0.5" strokeWidth="1" />
        <line x1={xMin - 10} y1={yLow + 30} x2={xMax + 20} y2={yLow + 30}
          stroke={accent} strokeOpacity="0.5" strokeWidth="1" />
        <L x={xMin - 16} y={yHigh + 4} text="VDD" color={accent} anchor="end" em={0.7} size={9} />
        <L x={xMin - 16} y={yLow + 4} text="0 V" color={accent} anchor="end" em={0.7} size={9} />
        <L x={xMax + 14} y={yLow + 50} text="t" color={accent} anchor="end" em={0.85} size={12} />

        {/* Reference dashed lines */}
        <line x1={xMin} y1={yHigh} x2={xMax} y2={yHigh}
          stroke={accent} strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="3 3" />
        <line x1={xMin} y1={yLow} x2={xMax} y2={yLow}
          stroke={accent} strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="3 3" />

        {/* Bit annotation above each plateau */}
        {segments.slice(0, -1).map((seg, i) => {
          const next = segments[i + 1];
          if (next.bit !== seg.bit) return null;
          const cx = (seg.x + next.x) / 2;
          const y = seg.bit ? yHigh - 14 : yLow + 22;
          return (
            <text key={i} x={cx} y={y} textAnchor="middle"
              fontSize="11" fontFamily={FONT}
              fill={accent} fillOpacity="0.85"
              letterSpacing="0.12em">
              {seg.bit}
            </text>
          );
        })}

        {/* Voltage trace — draws in left to right with the cursor */}
        <path d={d}
          stroke={accent} strokeWidth="2.2" fill="none"
          className="sv-bus-trace"
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />

        {/* Sweep cursor — `.sv-bus-cursor` keyframe drives translateX
             from 60→540, so the line authored at x=0 lands at the
             trace's x range automatically. */}
        <line x1={0} y1={50} x2={0} y2={yLow + 22} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.2"
          className="sv-bus-cursor" />

        <L x={300} y={388}
          text="every 0→1 charges C_wire to V_DD · every 1→0 dumps Q to GND"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * BusL2 — CMOS inverter driver.
 *
 * One wire on the bus is driven by a CMOS inverter:
 *   • PMOS pull-up between VDD and Out — turns ON when In is low.
 *   • NMOS pull-down between Out and GND — turns ON when In is high.
 *   • C_load is the lumped capacitance of the wire + receiver gates.
 *
 * The dynamic-power story (CV²f per transition) is the first-principles
 * reason interconnect dominates modern chip energy budgets.
 */
function BusL2({ accent }) {
  // Layout: VDD rail at top, GND at bottom, totem-pole driver in the
  // middle, output wire runs horizontally to a C_load on the right.
  const vddY  = 60;
  const gndY  = 340;
  const fetX  = 220;          // PMOS + NMOS x-axis
  const pY    = 130;          // PMOS center
  const nY    = 270;          // NMOS center
  const outY  = 200;          // shared output node
  const inX   = 100;          // input arrives here, fans up + down
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26} text="CMOS Inverter Driver · CV²f / cycle" color={accent} em={0.9} size={11} />

        {/* VDD rail */}
        <line x1={60} y1={vddY} x2={540} y2={vddY} stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.6" />
        <L x={66} y={vddY - 6} text="VDD" color={accent} anchor="start" em={0.75} size={10} />
        {/* GND rail */}
        <line x1={60} y1={gndY} x2={540} y2={gndY} stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.6" />
        <L x={66} y={gndY + 16} text="GND" color={accent} anchor="start" em={0.75} size={10} />

        {/* PMOS pull-up (vertical, source connects to VDD, drain to Out) */}
        <PMOS x={fetX} y={pY} accent={accent} scale={1.3} />
        <L x={fetX + 36} y={pY - 4} text="PMOS · pull-up"
          color={accent} anchor="start" em={0.75} size={9} />
        {/* PMOS drain (top of FET = pY - 22*1.3 = pY - 28.6) → VDD */}
        <line x1={fetX} y1={vddY} x2={fetX} y2={pY - 29} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={vddY} accent={accent} />
        <Pin x={fetX} y={pY - 29} accent={accent} r={1.8} />
        {/* PMOS source (bottom = pY + 28.6) → Out node */}
        <line x1={fetX} y1={pY + 29} x2={fetX} y2={outY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={pY + 29} accent={accent} r={1.8} />

        {/* NMOS pull-down (vertical, drain to Out, source to GND) */}
        <NMOS x={fetX} y={nY} accent={accent} scale={1.3} />
        <L x={fetX + 36} y={nY + 8} text="NMOS · pull-down"
          color={accent} anchor="start" em={0.75} size={9} />
        {/* NMOS drain (top = nY - 28.6) → Out node */}
        <line x1={fetX} y1={outY} x2={fetX} y2={nY - 29} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={nY - 29} accent={accent} r={1.8} />
        {/* NMOS source (bottom) → GND */}
        <line x1={fetX} y1={nY + 29} x2={fetX} y2={gndY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={gndY} accent={accent} />
        <Pin x={fetX} y={nY + 29} accent={accent} r={1.8} />

        {/* Out node — junction where PMOS source + NMOS drain meet */}
        <Pin x={fetX} y={outY} accent={accent} r={3} />

        {/* In input — wires UP to PMOS gate and DOWN to NMOS gate */}
        <L x={inX - 10} y={outY + 4} text="In" color={accent} anchor="end" em={0.95} size={12} />
        <line x1={inX} y1={outY} x2={fetX - 39} y2={outY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={inX} y={outY} accent={accent} />
        {/* Vertical bus from In to both gates */}
        <line x1={fetX - 39} y1={pY} x2={fetX - 39} y2={nY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1.2" />
        {/* In → PMOS gate (gate at fetX - 30*1.3 = fetX - 39, pY) */}
        <Pin x={fetX - 39} y={outY} accent={accent} r={2} />
        <Pin x={fetX - 39} y={pY} accent={accent} r={2} />
        <Pin x={fetX - 39} y={nY} accent={accent} r={2} />

        {/* Out wire — runs horizontal toward C_load */}
        <line x1={fetX} y1={outY} x2={460} y2={outY} stroke={accent}
          strokeWidth="1.6" className="sv-bus-out" />
        <Pin x={460} y={outY} accent={accent} />

        {/* C_load — parallel-plate capacitor symbol */}
        <g transform={`translate(${460}, ${outY})`}>
          <line x1="0" y1="0" x2="0" y2="40" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          {/* Top plate */}
          <line x1="-14" y1="44" x2="14" y2="44" stroke={accent}
            strokeOpacity="0.85" strokeWidth="2.4" />
          {/* Bottom plate (curved, ground-side) */}
          <path d="M -12 52 Q 0 56 12 52" stroke={accent}
            strokeOpacity="0.85" strokeWidth="2.4" fill="none" />
          <line x1="0" y1="56" x2="0" y2={gndY - outY} stroke={accent}
            strokeOpacity="0.4" strokeWidth="0.9" />
          <L x={20} y={50} text="C_load" color={accent} anchor="start" em={0.75} size={10} />
        </g>

        <L x={520} y={outY - 8} text="Out" color={accent} anchor="end" em={0.95} size={12} />

        {/* Animated charge — when input goes low, current flows from
            VDD through PMOS to Out, charging C_load. We show this with
            three dots traveling from the FET column to the C_load. */}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill={accent}
            className="sv-bus-charge"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
            <animate attributeName="cx" from={fetX} to={460}
              dur="2.8s" repeatCount="indefinite"
              begin={`${i * 0.9}s`} />
            <animate attributeName="cy" values={`${outY};${outY};${outY}`}
              dur="2.8s" repeatCount="indefinite"
              begin={`${i * 0.9}s`} />
            <animate attributeName="opacity"
              values="0;1;1;0" keyTimes="0;0.15;0.85;1"
              dur="2.8s" repeatCount="indefinite"
              begin={`${i * 0.9}s`} />
          </circle>
        ))}
      </svg>
    </Host>
  );
}


export default function BusStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [BusL0, BusL1, BusL2][lvl]({ accent });
}

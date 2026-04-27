/**
 * StageAnimations — physics-first-principles deep visualizations.
 *
 * Each stage of the cache-miss narrative gets THREE deep SVG visualizations
 * driven by the user's scroll depth:
 *
 *   L0 BLOCK   — the chip component in context
 *   L1 CELL    — one functional cell inside that component
 *   L2 ATOMIC  — the device-physics primitive that makes the cell work
 *
 * Labels are deliberate: small mono uppercase, accent-color, with leader
 * lines from labeled elements to text where elements are far from the
 * label position. Tag the essentials only — over-labeling reads as
 * clutter; under-labeling reads as decoration.
 *
 * accent color is set per-stage by STAGE_COLORS in scenarioStages.js
 * and passed through as an SVG fill/stroke + a CSS variable.
 */

import './StageAnimations.css';

const FONT = "'JetBrains Mono', ui-monospace, monospace";

export default function StageAnimation({
  stageId,
  subStageIndex = 0,
  accent = '#7df9ff',
}) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  switch (stageId) {
    case 'intro':
      return IntroOverview({ accent });
    case 'issue':
      return [PipelineL0, PipelineL1, PipelineL2][lvl]({ accent });
    case 'l1-l2':
      return [SramL0, SramL1, SramL2][lvl]({ accent });
    case 'bus':
      return [BusL0, BusL1, BusL2][lvl]({ accent });
    case 'l3-dram':
      return [DramL0, DramL1, DramL2][lvl]({ accent });
    case 'coherence':
      return [CoherenceL0, CoherenceL1, CoherenceL2][lvl]({ accent });
    case 'fill':
      return [FillL0, FillL1, FillL2][lvl]({ accent });
    case 'retire':
      return [RetireL0, RetireL1, RetireL2][lvl]({ accent });
    case 'recap':
      return RecapWaterfall({ accent });
    default:
      return null;
  }
}

// ===================================================================
// Shared primitives
// ===================================================================

function Host({ accent, children }) {
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      {children}
    </div>
  );
}

// L — small mono caps label, sits at (x, y). Uppercase + letter-spacing
// gives it the engineering-readout feel without competing with the viz.
function L({ x, y, text, color, anchor = 'middle', em = 0.7, size = 10 }) {
  return (
    <text x={x} y={y} fontSize={size} fontFamily={FONT}
      fill={color} fillOpacity={em}
      textAnchor={anchor}
      letterSpacing="0.18em"
      style={{ textTransform: 'uppercase' }}>
      {text}
    </text>
  );
}

// LL — leader-line annotation. Anchors a label at (lx, ly) and draws a
// thin connector from the labeled element at (px, py) to it. Use when
// the label can't sit directly next to its target without crowding.
function LL({ px, py, lx, ly, text, color, anchor = 'start', size = 9 }) {
  return (
    <g>
      <circle cx={px} cy={py} r="2" fill={color} fillOpacity="0.7" />
      <line x1={px} y1={py} x2={lx} y2={ly}
        stroke={color} strokeOpacity="0.35" strokeWidth="0.6" />
      <text
        x={lx + (anchor === 'start' ? 4 : -4)}
        y={ly + 3}
        fontSize={size} fontFamily={FONT}
        fill={color} fillOpacity="0.75"
        textAnchor={anchor}
        letterSpacing="0.18em"
        style={{ textTransform: 'uppercase' }}>
        {text}
      </text>
    </g>
  );
}

/**
 * Schematic primitives — designed so terminals are at predictable
 * offsets so external wires connect cleanly:
 *
 *   Vertical FET (NMOS / PMOS, channel runs vertically):
 *     drain  at (x,    y - 22*scale)   ← top
 *     source at (x,    y + 22*scale)   ← bottom
 *     gate   at (x - 30*scale, y)      ← left input
 *
 *   Horizontal FET (NMOS_H / PMOS_H, channel runs horizontally —
 *   used for SRAM/DRAM access transistors and any device whose
 *   gate is driven by a wordline that runs over it from above):
 *     gate   at (x,            y - 30*scale)   ← top input
 *     source at (x - 22*scale, y)              ← left
 *     drain  at (x + 22*scale, y)              ← right
 *
 *   Inverter:
 *     input  at (x - 10, y)              ← left
 *     output at (x + w + 18, y)          ← right
 *
 *   NAND2:
 *     inputs at (x - 12, y - 8) and (x - 12, y + 8)
 *     output at (x + w + 18, y)
 *
 * Callers should reference *_TERMINALS constants instead of hand-
 * coding offsets, so wires update if symbol geometry is tweaked.
 */

// Terminal coordinate constants. Use as e.g.:
//   const [gx, gy] = NMOS_TERMINALS.gate;
//   <line x1={x + gx*scale} y1={y + gy*scale} x2={...} y2={...} />
export const NMOS_TERMINALS = {
  gate:   [-30, 0],
  drain:  [0, -22],
  source: [0,  22],
};
export const PMOS_TERMINALS = NMOS_TERMINALS;
export const NMOS_H_TERMINALS = {
  gate:   [0, -30],
  source: [-22, 0],
  drain:  [ 22, 0],
};
export const PMOS_H_TERMINALS = NMOS_H_TERMINALS;
export function inverterTerminals(w = 28) {
  return { in: [-10, 0], out: [w + 18, 0] };
}
export function nandTerminals(w = 30) {
  return { inA: [-12, -8], inB: [-12, 8], out: [w + 18, 0] };
}

/**
 * Pin — small filled dot drawn at a terminal to mark it as a real
 * connection point. Use at every wire-meets-symbol junction so 1-2px
 * misalignment reads as a deliberate via and the eye snaps to a clear
 * connection rather than a gap.
 */
function Pin({ x, y, accent, r = 2.4, opacity = 0.95 }) {
  return <circle cx={x} cy={y} r={r} fill={accent} fillOpacity={opacity} />;
}

function NMOS({ x, y, accent, scale = 1, lit = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={lit ? 'sv-fet-lit' : ''}>
      {/* Drain lead (top) — sits on the centerline */}
      <line x1="0" y1="-22" x2="0" y2="-12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-6" y1="-12" x2="0" y2="-12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Source lead (bottom) — also centerline */}
      <line x1="0" y1="12" x2="0" y2="22" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-6" y1="12" x2="0" y2="12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Channel — segmented to indicate enhancement-mode (off until WL high) */}
      <line x1="-6" y1="-12" x2="-6" y2="-3.5" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      <line x1="-6" y1="3.5" x2="-6" y2="12" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      {/* Gate plate — separated from channel by oxide gap */}
      <line x1="-12" y1="-12" x2="-12" y2="12" stroke={accent} strokeOpacity="0.95" strokeWidth="2.2" strokeLinecap="round" />
      {/* Gate input lead */}
      <line x1="-30" y1="0" x2="-12" y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* Body arrow (NMOS = arrow points TOWARD the channel, into substrate) */}
      <path d="M 5 0 L -1 -3.5 L -1 3.5 Z" fill={accent} fillOpacity="0.92" />
    </g>
  );
}

function PMOS({ x, y, accent, scale = 1, lit = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={lit ? 'sv-fet-lit' : ''}>
      <line x1="0" y1="-22" x2="0" y2="-12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-6" y1="-12" x2="0" y2="-12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="0" y1="12" x2="0" y2="22" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-6" y1="12" x2="0" y2="12" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-6" y1="-12" x2="-6" y2="-3.5" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      <line x1="-6" y1="3.5" x2="-6" y2="12" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      <line x1="-12" y1="-12" x2="-12" y2="12" stroke={accent} strokeOpacity="0.95" strokeWidth="2.2" strokeLinecap="round" />
      {/* Inversion bubble on the gate marks PMOS — active-low */}
      <circle cx="-22" cy="0" r="2.6" fill="none" stroke={accent} strokeOpacity="0.95" strokeWidth="1.2" />
      <line x1="-30" y1="0" x2="-25" y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-19" y1="0" x2="-12" y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* Body arrow (PMOS = arrow points AWAY from channel) */}
      <path d="M -1 0 L 5 -3.5 L 5 3.5 Z" fill={accent} fillOpacity="0.92" />
    </g>
  );
}

/**
 * NMOS_H — horizontal-orientation NMOS for SRAM/DRAM access devices.
 * Gate driven from above (wordline runs over the device); channel
 * runs left-to-right between source (left) and drain (right).
 *
 * Terminals (relative to scale-1 device): see NMOS_H_TERMINALS.
 */
function NMOS_H({ x, y, accent, scale = 1, lit = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={lit ? 'sv-fet-lit' : ''}>
      {/* Gate input lead from above */}
      <line x1="0" y1="-30" x2="0" y2="-14" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* Gate plate — horizontal bar */}
      <line x1="-12" y1="-14" x2="12" y2="-14" stroke={accent} strokeOpacity="0.95" strokeWidth="2.2" strokeLinecap="round" />
      {/* Channel — segmented horizontal bar (off until gate high) */}
      <line x1="-12" y1="-6" x2="-3.5" y2="-6" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      <line x1="3.5" y1="-6" x2="12" y2="-6" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      {/* Source lead (left) */}
      <line x1="-12" y1="-6" x2="-12" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-12" y1="0" x2="-22" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Drain lead (right) */}
      <line x1="12" y1="-6" x2="12" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="0" x2="22" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Body arrow (NMOS = arrow points TOWARD channel from below) */}
      <path d="M 0 6 L -3.5 0 L 3.5 0 Z" fill={accent} fillOpacity="0.92" />
    </g>
  );
}

/**
 * PMOS_H — horizontal-orientation PMOS. Gate driven from above with
 * an inversion bubble (active-low). Channel runs left-to-right.
 */
function PMOS_H({ x, y, accent, scale = 1, lit = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={lit ? 'sv-fet-lit' : ''}>
      {/* Gate input lead — broken by inversion bubble */}
      <line x1="0" y1="-30" x2="0" y2="-22" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="0" cy="-19.5" r="2.6" fill="none" stroke={accent} strokeOpacity="0.95" strokeWidth="1.2" />
      <line x1="0" y1="-17" x2="0" y2="-14" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* Gate plate */}
      <line x1="-12" y1="-14" x2="12" y2="-14" stroke={accent} strokeOpacity="0.95" strokeWidth="2.2" strokeLinecap="round" />
      {/* Channel */}
      <line x1="-12" y1="-6" x2="-3.5" y2="-6" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      <line x1="3.5" y1="-6" x2="12" y2="-6" stroke={accent} strokeOpacity="0.85" strokeWidth="1.6" />
      {/* Source lead (left) */}
      <line x1="-12" y1="-6" x2="-12" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-12" y1="0" x2="-22" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Drain lead (right) */}
      <line x1="12" y1="-6" x2="12" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="0" x2="22" y2="0" stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinecap="round" />
      {/* Body arrow (PMOS = arrow points AWAY from channel) */}
      <path d="M 0 0 L -3.5 6 L 3.5 6 Z" fill={accent} fillOpacity="0.92" />
    </g>
  );
}

/**
 * Inverter — triangle + bubble. Input lead on the left, output lead
 * on the right. Set rotate=180 to flip horizontally (output → left).
 */
function Inverter({ x, y, w = 28, accent, rotate = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      {/* Input lead */}
      <line x1="-10" y1="0" x2="0" y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* Triangle body */}
      <path d={`M 0 ${-w / 2} L ${w} 0 L 0 ${w / 2} Z`}
        fill={accent} fillOpacity="0.06"
        stroke={accent} strokeOpacity="0.92" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Inversion bubble */}
      <circle cx={w + 4} cy="0" r="3" fill="none" stroke={accent} strokeOpacity="0.95" strokeWidth="1.2" />
      {/* Output lead */}
      <line x1={w + 7} y1="0" x2={w + 18} y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/**
 * NAND2 — D-shape body with 2 inputs at top/bottom-left and inverter
 * bubble at output. Inputs at (0, ±8). Output at (w + 8, 0).
 */
function NAND({ x, y, accent, w = 30 }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Input leads */}
      <line x1="-12" y1="-8" x2="0" y2="-8" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="-12" y1="8" x2="0" y2="8" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
      {/* D-shape body */}
      <path d={`M 0 ${-w / 2} L ${w * 0.5} ${-w / 2} A ${w / 2} ${w / 2} 0 0 1 ${w * 0.5} ${w / 2} L 0 ${w / 2} Z`}
        fill={accent} fillOpacity="0.06"
        stroke={accent} strokeOpacity="0.92" strokeWidth="1.3" strokeLinejoin="round" />
      {/* Output bubble + lead */}
      <circle cx={w + 4} cy="0" r="3" fill="none" stroke={accent} strokeOpacity="0.95" strokeWidth="1.2" />
      <line x1={w + 7} y1="0" x2={w + 18} y2="0" stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

// ===================================================================
// Stage 0 — PIPELINE
// ===================================================================

/**
 * PipelineL0 — 5-stage in-order pipeline: IF → ID → RR → IS → EX.
 *
 * Each stage is a column with a big mono code (IF/ID/...), a name, a
 * one-line hint about what happens there, and a pipeline-register
 * latch glyph showing the boundary buffer between stages. A single
 * instruction token "ld x1, [x2]" glides across all five stages once
 * per cycle, with proper opacity envelope so the loop has no seam.
 *
 * The teaching: pipelining doesn't make one instruction faster, it
 * keeps all five stages busy on different instructions so throughput
 * approaches one instruction per cycle.
 */
function PipelineL0({ accent }) {
  const stages = [
    { code: 'IF', label: 'FETCH',   hint: 'pc → i-cache' },
    { code: 'ID', label: 'DECODE',  hint: 'opcode · regs' },
    { code: 'RR', label: 'RENAME',  hint: 'arch → phys' },
    { code: 'IS', label: 'ISSUE',   hint: 'wait for ops' },
    { code: 'EX', label: 'EXECUTE', hint: 'alu · mem · br' },
  ];
  const colW    = 108;
  const colStart = 30;
  const colY    = 88;
  const colH    = 200;
  const latchY  = colY + 130;
  const tokenY  = 320;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="CPU Pipeline · 5 Stages · 1 Instruction / Cycle"
          color={accent} em={0.9} size={11} />

        {/* CLK rail across the top */}
        <L x={22} y={58} text="CLK" color={accent} anchor="start" em={0.85} size={10} />
        <path d={`M 60 64 L 96 64 L 96 48 L 132 48 L 132 64 L 168 64 L 168 48 L 204 48 L 204 64 L 240 64 L 240 48 L 276 48 L 276 64 L 312 64 L 312 48 L 348 48 L 348 64 L 384 64 L 384 48 L 420 48 L 420 64 L 456 64 L 456 48 L 492 48 L 492 64 L 528 64 L 528 48 L 564 48 L 564 64 L 580 64`}
          stroke={accent} strokeWidth="1.3" fill="none" opacity="0.55" />

        {/* 5 stage columns with proper labels */}
        {stages.map((s, i) => {
          const x = colStart + i * colW;
          const w = colW - 14;
          return (
            <g key={s.code}>
              {/* Column body */}
              <rect x={x} y={colY} width={w} height={colH} rx={4}
                fill={accent} fillOpacity="0.04"
                stroke={accent} strokeOpacity="0.5" strokeWidth="1" />
              {/* Stage two-letter code (large mono) */}
              <text x={x + w / 2} y={colY + 44} textAnchor="middle"
                fontSize="28" fontFamily={FONT}
                fill={accent} fillOpacity="0.85"
                letterSpacing="0.04em">
                {s.code}
              </text>
              {/* Full stage name */}
              <L x={x + w / 2} y={colY + 70} text={s.label}
                color={accent} em={0.9} size={10} />
              {/* What happens here */}
              <L x={x + w / 2} y={colY + 88} text={s.hint}
                color={accent} em={0.5} size={8} />

              {/* Pipeline register (latch) glyph between stages */}
              <rect x={x + 10} y={latchY} width={w - 20} height={28} rx={2}
                fill={accent} fillOpacity="0.15"
                stroke={accent} strokeOpacity="0.6" strokeWidth="0.8"
                className="sv-pipe-latch"
                style={{ animationDelay: `${i * 0.6}s` }} />
              <L x={x + w / 2} y={latchY + 18}
                text={`${s.code} → ${stages[i + 1] ? stages[i + 1].code : 'WB'}`}
                color={accent} em={0.55} size={8} />

              {/* Inter-stage bus connecting this latch to the next column */}
              {i < stages.length - 1 && (
                <g className={`sv-pipe-bus sv-pipe-bus-${i}`}>
                  <line x1={x + w} y1={latchY + 14} x2={x + colW + 10} y2={latchY + 14}
                    stroke={accent} strokeOpacity="0.65" strokeWidth="1.2" />
                  <Pin x={x + w} y={latchY + 14} accent={accent} r={1.6} />
                  <Pin x={x + colW + 10} y={latchY + 14} accent={accent} r={1.6} />
                </g>
              )}
            </g>
          );
        })}

        {/* The instruction token — single packet glides across all 5
            stages over one cycle, then fades out. New token enters the
            next cycle, which is the whole point of pipelining. */}
        <g>
          <rect y={tokenY - 14} width={94} height={28} rx={3}
            fill={accent} fillOpacity="0.95"
            stroke={accent} strokeOpacity="1" strokeWidth="1"
            style={{ filter: `drop-shadow(0 0 14px ${accent})` }}>
            <animate attributeName="x"
              values={`-100;${colStart};${colStart + colW};${colStart + colW * 2};${colStart + colW * 3};${colStart + colW * 4};${colStart + colW * 5 - 6}`}
              keyTimes="0;0.06;0.24;0.42;0.6;0.78;1"
              dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity"
              values="0;1;1;1;1;1;0"
              keyTimes="0;0.08;0.24;0.42;0.6;0.78;1"
              dur="6s" repeatCount="indefinite" />
          </rect>
          <text y={tokenY + 4} textAnchor="middle"
            fontSize="12" fontFamily={FONT}
            fill="rgba(0,0,0,0.92)"
            letterSpacing="0.04em">
            <animate attributeName="x"
              values={`-53;${colStart + 47};${colStart + colW + 47};${colStart + colW * 2 + 47};${colStart + colW * 3 + 47};${colStart + colW * 4 + 47};${colStart + colW * 5 + 41}`}
              keyTimes="0;0.06;0.24;0.42;0.6;0.78;1"
              dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity"
              values="0;1;1;1;1;1;0"
              keyTimes="0;0.08;0.24;0.42;0.6;0.78;1"
              dur="6s" repeatCount="indefinite" />
            ld x1, [x2]
          </text>
        </g>

        <L x={300} y={388}
          text="each clock edge → token advances one stage · throughput ≈ 1 instr / cycle"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * PipelineL1 — out-of-order issue: reservation stations + wakeup matrix.
 *
 * Six RS slots wait for both operands to be ready. When a producer
 * completes, its tag is broadcast on the wakeup matrix; consumers
 * matching the tag flip their operand-ready bit. Once both ops are
 * ready, the slot becomes a candidate for issue and an arbitrator
 * sends one chosen op down to execute.
 */
function PipelineL1({ accent }) {
  const rsX     = 50;
  const rsW     = 280;
  const rowH    = 32;
  const rowGap  = 6;
  const rsTopY  = 80;
  const numRows = 6;
  const matrixX = rsX + rsW + 60;
  const matrixCols = 6;
  const colSpacing = 22;
  const rowSpacing = rowH + rowGap;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Out-of-Order Issue · Reservation Stations + Wakeup"
          color={accent} em={0.9} size={11} />

        {/* Section labels */}
        <L x={rsX} y={rsTopY - 14} text="Reservation Stations · 6 slots"
          color={accent} anchor="start" em={0.85} size={10} />
        <L x={matrixX} y={rsTopY - 14} text="Wakeup Matrix"
          color={accent} anchor="start" em={0.85} size={10} />

        {/* Column headers above the RS grid (small, faint) */}
        <g transform={`translate(${rsX}, ${rsTopY - 4})`}
          fill={accent} fillOpacity="0.55"
          fontSize="8" fontFamily={FONT} letterSpacing="0.18em"
          style={{ textTransform: 'uppercase' }}>
          <text x={26} textAnchor="middle">A?</text>
          <text x={62} textAnchor="middle">B?</text>
          <text x={140} textAnchor="middle">opcode</text>
          <text x={232} textAnchor="middle">tag</text>
          <text x={272} textAnchor="middle">→</text>
        </g>

        {/* RS rows — each shows op-A ready, op-B ready, opcode field, tag, issue stub */}
        {Array.from({ length: numRows }).map((_, i) => {
          const y = rsTopY + i * rowSpacing;
          const aReady = true;
          const bReady = i < 3;
          const ready  = aReady && bReady;
          return (
            <g key={i} className="sv-pipe-rs"
              style={{ animationDelay: `${i * 0.18}s` }}>
              {/* Row outline */}
              <rect x={rsX} y={y} width={rsW} height={rowH} rx={2}
                fill={accent} fillOpacity={ready ? 0.05 : 0}
                stroke={accent}
                strokeOpacity={ready ? 0.7 : 0.35}
                strokeWidth={ready ? 1 : 0.7} />
              {/* Op-A ready bit */}
              <circle cx={rsX + 26} cy={y + rowH / 2} r={6}
                fill={aReady ? accent : 'none'}
                fillOpacity={aReady ? 0.9 : 0.18}
                stroke={accent} strokeOpacity="0.85" strokeWidth="0.8" />
              {/* Op-B ready bit */}
              <circle cx={rsX + 62} cy={y + rowH / 2} r={6}
                fill={bReady ? accent : 'none'}
                fillOpacity={bReady ? 0.9 : 0.18}
                stroke={accent} strokeOpacity={bReady ? 0.85 : 0.45} strokeWidth="0.8" />
              {/* Opcode field */}
              <rect x={rsX + 92} y={y + rowH / 2 - 6} width={100} height={12}
                fill={accent} fillOpacity={ready ? 0.45 : 0.18}
                stroke={accent} strokeOpacity={0.4} strokeWidth="0.5" />
              <text x={rsX + 142} y={y + rowH / 2 + 3.5}
                textAnchor="middle" fontSize="8" fontFamily={FONT}
                fill={ready ? 'rgba(0,0,0,0.9)' : accent}
                fillOpacity={ready ? 0.9 : 0.7}
                letterSpacing="0.15em" style={{ textTransform: 'uppercase' }}>
                {['ld', 'add', 'sub', 'mul', 'st', 'cmp'][i]}
              </text>
              {/* Producer tag */}
              <rect x={rsX + 210} y={y + rowH / 2 - 6} width={44} height={12}
                fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="0.5" />
              <text x={rsX + 232} y={y + rowH / 2 + 3.5}
                textAnchor="middle" fontSize="8" fontFamily={FONT}
                fill={accent} fillOpacity="0.6">
                t{i + 1}
              </text>
              {/* Issue stub on the right */}
              <line x1={rsX + rsW} y1={y + rowH / 2}
                x2={rsX + rsW + 28} y2={y + rowH / 2}
                stroke={accent} strokeOpacity={ready ? 0.85 : 0.25}
                strokeWidth={ready ? 1.2 : 0.7} />
              <Pin x={rsX + rsW + 28} y={y + rowH / 2} accent={accent}
                r={ready ? 2.4 : 1.6} opacity={ready ? 0.95 : 0.4} />
            </g>
          );
        })}

        {/* Issue arbiter — picks one ready slot per cycle */}
        <g>
          <rect x={rsX + rsW + 36} y={rsTopY + (numRows * rowSpacing) / 2 - 24}
            width={64} height={48} rx={4}
            fill={accent} fillOpacity="0.06"
            stroke={accent} strokeOpacity="0.65" strokeWidth="1" />
          <L x={rsX + rsW + 68} y={rsTopY + (numRows * rowSpacing) / 2}
            text="ARB" color={accent} em={0.95} size={11} />
          <L x={rsX + rsW + 68} y={rsTopY + (numRows * rowSpacing) / 2 + 14}
            text="picks 1/cyc" color={accent} em={0.5} size={8} />
        </g>

        {/* Wakeup matrix — broadcast tags from the bypass network */}
        <g transform={`translate(${matrixX}, ${rsTopY})`}>
          {Array.from({ length: numRows }).map((_, r) =>
            Array.from({ length: matrixCols }).map((_, c) => {
              const lit = c <= r % 4;
              return (
                <circle key={`${r}-${c}`}
                  cx={c * colSpacing} cy={r * rowSpacing + rowH / 2}
                  r={3.4}
                  fill={accent}
                  fillOpacity={lit ? 0.95 : 0.18}
                  className={`sv-pipe-wakeup sv-pipe-wakeup-${c}`}
                  style={{ animationDelay: `${c * 0.18}s` }} />
              );
            })
          )}
          {/* Bottom axis: tag IDs */}
          {Array.from({ length: matrixCols }).map((_, c) => (
            <text key={`col-${c}`}
              x={c * colSpacing} y={numRows * rowSpacing + 10}
              textAnchor="middle" fontSize="8" fontFamily={FONT}
              fill={accent} fillOpacity="0.55"
              letterSpacing="0.15em">
              t{c}
            </text>
          ))}
        </g>

        <L x={300} y={388}
          text="op-A + op-B both lit → slot is ready · ARB picks one per cycle"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * PipelineL2 — D flip-flop drawn as two D-latches (master / slave).
 *
 * Pipeline registers between stages are negative-edge-triggered
 * D-FFs: the master latch is transparent while CLK=1 and captures
 * on the falling edge; the slave latch drives Q while CLK=0. Stages
 * thus advance once per clock period.
 *
 * Drawing the SR/NAND core inside each latch is too much detail at
 * this depth; the relevant teaching is the two-stage latch + clock
 * relationship. So master/slave are abstract boxes labeled
 * "transparent when CLK=1/0" with explicit pins.
 */
function PipelineL2({ accent }) {
  const dataY = 165;
  const clkY  = 305;
  const masterX = 130;
  const slaveX  = 350;
  const boxW = 130;
  const boxH = 100;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={28} text="Edge-Triggered D-FF · Master / Slave" color={accent} em={0.9} size={11} />

        {/* D input — labeled, with a pin where it enters the master */}
        <L x={36} y={dataY + 4} text="D" color={accent} anchor="end" em={1} size={13} />
        <line x1={46} y1={dataY} x2={masterX} y2={dataY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={masterX} y={dataY} accent={accent} />

        {/* MASTER latch box */}
        <rect x={masterX} y={dataY - 50} width={boxW} height={boxH} rx={4}
          fill={accent} fillOpacity="0.05"
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
        <L x={masterX + boxW / 2} y={dataY - 60} text="MASTER" color={accent} em={0.85} size={11} />
        <text x={masterX + boxW / 2} y={dataY - 4} textAnchor="middle"
          fontSize="22" fontFamily={FONT}
          fill={accent} fillOpacity="0.55" letterSpacing="0.06em">L1</text>
        <text x={masterX + boxW / 2} y={dataY + 22} textAnchor="middle"
          fontSize="9" fontFamily={FONT}
          fill={accent} fillOpacity="0.55" letterSpacing="0.18em"
          style={{ textTransform: 'uppercase' }}>open when CLK = 1</text>

        {/* Master Q → Slave D wire */}
        <line x1={masterX + boxW} y1={dataY} x2={slaveX} y2={dataY}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.4"
          className="sv-pipe-master-out" />
        <Pin x={masterX + boxW} y={dataY} accent={accent} />
        <Pin x={slaveX} y={dataY} accent={accent} />
        <L x={(masterX + boxW + slaveX) / 2} y={dataY - 8}
          text="Q_m" color={accent} em={0.6} size={9} />

        {/* SLAVE latch box */}
        <rect x={slaveX} y={dataY - 50} width={boxW} height={boxH} rx={4}
          fill={accent} fillOpacity="0.05"
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
        <L x={slaveX + boxW / 2} y={dataY - 60} text="SLAVE" color={accent} em={0.85} size={11} />
        <text x={slaveX + boxW / 2} y={dataY - 4} textAnchor="middle"
          fontSize="22" fontFamily={FONT}
          fill={accent} fillOpacity="0.55" letterSpacing="0.06em">L2</text>
        <text x={slaveX + boxW / 2} y={dataY + 22} textAnchor="middle"
          fontSize="9" fontFamily={FONT}
          fill={accent} fillOpacity="0.55" letterSpacing="0.18em"
          style={{ textTransform: 'uppercase' }}>open when CLK = 0</text>

        {/* Slave Q → output */}
        <line x1={slaveX + boxW} y1={dataY} x2={555} y2={dataY}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.4"
          className="sv-pipe-q" />
        <Pin x={slaveX + boxW} y={dataY} accent={accent} />
        <circle cx={550} cy={dataY} r={5} fill={accent} className="sv-pipe-q-dot" />
        <L x={560} y={dataY + 4} text="Q" color={accent} anchor="end" em={1} size={13} />

        {/* CLK rail — runs across the bottom */}
        <L x={36} y={clkY + 4} text="CLK" color={accent} anchor="end" em={0.9} size={11} />
        <line x1={46} y1={clkY} x2={556} y2={clkY} stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.4" className="sv-pipe-clk-master" />
        {/* Square-wave glyph on the CLK line for clarity */}
        <path d={`M ${100} ${clkY} L ${130} ${clkY} L ${130} ${clkY - 18} L ${180} ${clkY - 18} L ${180} ${clkY} L ${230} ${clkY} L ${230} ${clkY - 18} L ${280} ${clkY - 18} L ${280} ${clkY} L ${330} ${clkY} L ${330} ${clkY - 18} L ${380} ${clkY - 18} L ${380} ${clkY} L ${430} ${clkY} L ${430} ${clkY - 18} L ${480} ${clkY - 18} L ${480} ${clkY} L ${510} ${clkY}`}
          stroke={accent} strokeOpacity="0.4" strokeWidth="0.9" fill="none" />

        {/* CLK → master enable (direct) */}
        <Pin x={masterX + boxW / 2} y={clkY} accent={accent} />
        <line x1={masterX + boxW / 2} y1={clkY} x2={masterX + boxW / 2} y2={dataY + 50}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
        <L x={masterX + boxW / 2 + 10} y={clkY - 8} text="CLK"
          color={accent} anchor="start" em={0.55} size={9} />

        {/* CLK → INV → CLK̄ → slave enable */}
        <Pin x={slaveX + boxW / 2} y={clkY} accent={accent} />
        <line x1={slaveX + boxW / 2} y1={clkY} x2={slaveX + boxW / 2} y2={clkY - 30}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
        {/* Down-pointing inverter triangle (CLK input on top, CLK̄ output below) */}
        <g transform={`translate(${slaveX + boxW / 2}, ${clkY - 50})`}>
          <path d="M -12 -10 L 12 -10 L 0 8 Z" fill={accent} fillOpacity="0.06"
            stroke={accent} strokeOpacity="0.85" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="0" cy="12" r="3" fill="none" stroke={accent}
            strokeOpacity="0.95" strokeWidth="1.1" />
        </g>
        <line x1={slaveX + boxW / 2} y1={clkY - 35} x2={slaveX + boxW / 2} y2={clkY - 50}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
        <line x1={slaveX + boxW / 2} y1={clkY - 65} x2={slaveX + boxW / 2} y2={dataY + 50}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
        <L x={slaveX + boxW / 2 + 10} y={clkY - 58}
          text="CLK̄" color={accent} anchor="start" em={0.6} size={9} />

        {/* Caption */}
        <L x={300} y={385}
          text="data captured on falling edge · Q changes once per cycle"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 1 — L1/L2 SRAM
// ===================================================================

/**
 * SramL0 — 4-way set-associative L1 D-cache, miss flow.
 *
 * Address splits into TAG / SET / OFFSET. The set-decoder picks one
 * row of the cache; all 4 way-tags in that row compare against the
 * address tag in parallel; if any match (HIT) we read the data from
 * that way. If all 4 mismatch (MISS) the request walks down to L2.
 *
 * The lit row shows the "look-up in flight" with comparator diamonds
 * over each way and a miss circle when no tag matched. The arrow
 * down to L2 ramps in cleanly once the comparators settle.
 */
function SramL0({ accent }) {
  const ways = 4;
  const sets = 8;
  const tagW = 70;
  const dataChunks = 8;
  const dataChunkW = 22;
  const dataW = dataChunks * (dataChunkW + 4);
  const xOff = 80;
  const rowH = 32;
  const rowGap = 6;
  const litSet = 3;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 700 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={350} y={26}
          text="L1 D-Cache · 4-Way · 32 KB · Tag Compare in Parallel"
          color={accent} em={0.9} size={11} />

        {/* Address breakdown bar at the top */}
        <g transform="translate(40, 50)">
          <rect width={620} height={22} rx={2}
            fill={accent} fillOpacity="0.06"
            stroke={accent} strokeOpacity="0.55" strokeWidth="0.8" />
          <line x1={300} y1={0} x2={300} y2={22} stroke={accent} strokeOpacity="0.55" />
          <line x1={460} y1={0} x2={460} y2={22} stroke={accent} strokeOpacity="0.55" />
          <text x={150} y={15} textAnchor="middle"
            fontSize="9" fontFamily={FONT}
            fill={accent} fillOpacity="0.85"
            letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
            tag (37 b)
          </text>
          <text x={380} y={15} textAnchor="middle"
            fontSize="9" fontFamily={FONT}
            fill={accent} fillOpacity="0.85"
            letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
            set (5 b)
          </text>
          <text x={540} y={15} textAnchor="middle"
            fontSize="9" fontFamily={FONT}
            fill={accent} fillOpacity="0.85"
            letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
            offset (6 b)
          </text>
          <L x={36} y={15} text="addr" color={accent} anchor="end" em={0.7} size={9} />
        </g>

        {/* Tag Array header / Data Array header */}
        <L x={xOff + (ways * tagW) / 2} y={92} text="Tag Array · 4 Ways"
          color={accent} em={0.85} size={10} />
        <L x={xOff + ways * tagW + 16 + dataW / 2} y={92} text="Data Array · 64-byte lines"
          color={accent} em={0.85} size={10} />

        {/* Cache rows — 8 sets, the lit set blinks during the lookup */}
        {Array.from({ length: sets }).map((_, s) => {
          const y = 102 + s * (rowH + rowGap);
          const isLit = s === litSet;
          return (
            <g key={s}>
              {/* Row outline */}
              <rect x={xOff - 14} y={y - 2} width={ways * tagW + dataW + 30} height={rowH + 4}
                rx={2}
                fill={isLit ? accent : 'transparent'}
                fillOpacity={isLit ? 0.06 : 0}
                stroke={isLit ? accent : 'rgba(255,255,255,0.06)'}
                strokeOpacity={isLit ? 0.6 : 1}
                strokeWidth="0.6"
                className={isLit ? 'sv-sram-set' : ''} />
              {/* Way-tag boxes */}
              {Array.from({ length: ways }).map((_, w) => {
                const wx = xOff + w * tagW;
                return (
                  <g key={w}>
                    <rect x={wx} y={y} width={tagW - 6} height={rowH} rx={1}
                      fill="none"
                      stroke={accent} strokeOpacity={isLit ? 0.55 : 0.2}
                      strokeWidth="0.7" />
                    {/* Way label (only on first row) */}
                    {s === 0 && (
                      <text x={wx + (tagW - 6) / 2} y={y - 6}
                        textAnchor="middle" fontSize="8" fontFamily={FONT}
                        fill={accent} fillOpacity="0.55" letterSpacing="0.18em"
                        style={{ textTransform: 'uppercase' }}>
                        W{w}
                      </text>
                    )}
                    {/* Tag value (faint, just for visual density) */}
                    <text x={wx + (tagW - 6) / 2} y={y + rowH / 2 + 3}
                      textAnchor="middle" fontSize="9" fontFamily={FONT}
                      fill={accent} fillOpacity={isLit ? 0.7 : 0.3}
                      letterSpacing="0.12em">
                      0x{(0x4f + s * 7 + w).toString(16)}
                    </text>
                    {/* Comparator diamond (only on lit row) */}
                    {isLit && (
                      <g transform={`translate(${wx + (tagW - 6) / 2}, ${y + rowH / 2})`}>
                        <path d="M 0 -10 L 10 0 L 0 10 L -10 0 Z"
                          fill={accent} fillOpacity="0.95"
                          className="sv-sram-cmp"
                          style={{ animationDelay: `${w * 0.18}s`, filter: `drop-shadow(0 0 6px ${accent})` }} />
                        <text x={0} y={3.5} textAnchor="middle"
                          fontSize="9" fontFamily={FONT}
                          fill="rgba(0,0,0,0.85)" letterSpacing="0.1em">≠</text>
                      </g>
                    )}
                  </g>
                );
              })}
              {/* Data chunks */}
              {Array.from({ length: dataChunks }).map((_, c) => (
                <rect key={c}
                  x={xOff + ways * tagW + 16 + c * (dataChunkW + 4)}
                  y={y}
                  width={dataChunkW} height={rowH} rx={1}
                  fill={accent}
                  fillOpacity={isLit ? 0.18 : 0.06}
                  stroke={accent}
                  strokeOpacity={isLit ? 0.4 : 0.15}
                  strokeWidth="0.6" />
              ))}
              {/* Set number on the left */}
              <text x={xOff - 22} y={y + rowH / 2 + 3} textAnchor="end"
                fontSize="8" fontFamily={FONT}
                fill={accent} fillOpacity={isLit ? 0.85 : 0.4}
                letterSpacing="0.12em">
                set {s.toString().padStart(2, '0')}
              </text>
            </g>
          );
        })}

        {/* Set-decoder chevron pointing at the lit row */}
        <g transform={`translate(28, ${102 + litSet * (rowH + rowGap) + rowH / 2 - 8})`}>
          <path d="M 0 0 L 18 8 L 0 16 Z" fill={accent} className="sv-sram-chev" />
          <L x={-4} y={11} text="set 03" color={accent} anchor="end" em={0.85} size={10} />
        </g>

        {/* Result — all comparators say ≠, so it's a miss. Arrow points down to L2. */}
        <g transform="translate(360, 350)">
          <line x1={0} y1={0} x2={0} y2={26} stroke={accent}
            strokeWidth="2" className="sv-sram-fwd"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
          <path d="M -7 18 L 0 26 L 7 18" stroke={accent} strokeWidth="1.6" fill="none"
            className="sv-sram-fwd"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
          <L x={16} y={20} text="miss → L2" color={accent} anchor="start" em={0.95} size={10} />
        </g>
      </svg>
    </div>
  );
}

/**
 * SramL1 — the iconic 6T SRAM cell.
 *
 *   • WL (wordline) runs horizontally over the cell. When asserted,
 *     it turns on both access transistors (M5 + M6).
 *   • Two NMOS access transistors (M5, M6) drawn HORIZONTALLY — gates
 *     driven from above by WL; channel runs left/right between BL and
 *     the internal storage nodes Q / Q̄.
 *   • Cross-coupled inverters in the middle (top-INV pulls Q̄ from Q,
 *     bottom-INV pulls Q from Q̄). The two stable states encode the
 *     stored bit.
 *   • VDD / GND rails power the inverters.
 *
 * Each junction has a Pin so wire→symbol connections read as deliberate
 * vias and never look "floating".
 */
function SramL1({ accent }) {
  // Layout coordinates — chosen so wires are short, orthogonal, and
  // cross only where they must (cross-coupling).
  const wlY    = 80;
  const cellY  = 130;
  const qY     = 220;
  const invTopY = 200;
  const invBotY = 280;
  const blX  = 80;
  const blbX = 520;
  const m5X  = 170;
  const m6X  = 430;
  const qX   = 250;
  const qbX  = 350;
  const vddY = 160;
  const gndY = 320;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        {/* WL — horizontal at top, drives both access gates */}
        <line x1="40" y1={wlY} x2="560" y2={wlY} stroke={accent}
          strokeWidth="2.5" className="sv-sram-wl" opacity="0.65" />
        <L x={26} y={wlY + 4} text="WL" color={accent} anchor="end" em={0.9} size={11} />
        <Pin x={m5X} y={wlY} accent={accent} />
        <Pin x={m6X} y={wlY} accent={accent} />

        {/* M5 — horizontal NMOS, gate up to WL, source ← BL, drain → Q */}
        <line x1={m5X} y1={wlY} x2={m5X} y2={cellY - 30} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />
        <NMOS_H x={m5X} y={cellY} accent={accent} />
        <L x={m5X} y={cellY + 24} text="M5" color={accent} em={0.75} size={9} />
        {/* BL → M5 source */}
        <line x1={blX} y1={cellY} x2={m5X - 22} y2={cellY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" className="sv-sram-bl" />
        <Pin x={blX} y={cellY} accent={accent} />
        {/* M5 drain → Q */}
        <line x1={m5X + 22} y1={cellY} x2={qX} y2={cellY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={qX} y1={cellY} x2={qX} y2={qY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />

        {/* M6 — mirror of M5 on the right */}
        <line x1={m6X} y1={wlY} x2={m6X} y2={cellY - 30} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />
        <NMOS_H x={m6X} y={cellY} accent={accent} />
        <L x={m6X} y={cellY + 24} text="M6" color={accent} em={0.75} size={9} />
        {/* M6 source ← Q̄ (left side of M6) */}
        <line x1={qbX} y1={cellY} x2={m6X - 22} y2={cellY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={qbX} y1={cellY} x2={qbX} y2={qY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" />
        {/* M6 drain → BL̄ */}
        <line x1={m6X + 22} y1={cellY} x2={blbX} y2={cellY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.3" className="sv-sram-blb" />
        <Pin x={blbX} y={cellY} accent={accent} />

        {/* BL / BL̄ — vertical drops to bit-line bus below the cell */}
        <line x1={blX} y1={cellY} x2={blX} y2={370} stroke={accent}
          strokeWidth="1.8" className="sv-sram-bl" opacity="0.6" />
        <L x={blX} y={388} text="BL" color={accent} em={0.95} size={11} />
        <line x1={blbX} y1={cellY} x2={blbX} y2={370} stroke={accent}
          strokeWidth="1.8" className="sv-sram-blb" opacity="0.6" />
        <L x={blbX} y={388} text="BL̄" color={accent} em={0.95} size={11} />

        {/* VDD rail */}
        <line x1={qX} y1={vddY} x2={qbX} y2={vddY} stroke={accent}
          strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
        <L x={300} y={vddY - 6} text="VDD" color={accent} em={0.6} size={9} />

        {/* Cross-coupled inverters
            INV1: input from Q, output to Q̄ (top row, points right)
            INV2: input from Q̄, output to Q (bottom row, points left) */}
        <Inverter x={266} y={invTopY} w={36} accent={accent} />
        {/* Q → INV1 input */}
        <line x1={qX} y1={qY} x2={qX} y2={invTopY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        <line x1={qX} y1={invTopY} x2={256} y2={invTopY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        {/* INV1 output → Q̄ (output ends at 266+36+18=320) */}
        <line x1={320} y1={invTopY} x2={qbX} y2={invTopY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        <line x1={qbX} y1={invTopY} x2={qbX} y2={qY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />

        <Inverter x={334} y={invBotY} w={36} accent={accent} rotate={180} />
        {/* Q̄ → INV2 input (rotated, input at +10 = 344) */}
        <line x1={qbX} y1={qY} x2={qbX} y2={invBotY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        <line x1={qbX} y1={invBotY} x2={344} y2={invBotY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        {/* INV2 output → Q (rotated, output at -36-18+334=280) */}
        <line x1={280} y1={invBotY} x2={qX} y2={invBotY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />
        <line x1={qX} y1={invBotY} x2={qX} y2={qY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1" />

        {/* GND rail */}
        <line x1={qX} y1={gndY} x2={qbX} y2={gndY} stroke={accent}
          strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
        <L x={300} y={gndY + 14} text="GND" color={accent} em={0.6} size={9} />

        {/* Storage nodes — Q (active), Q̄ (complement) */}
        <Pin x={qX} y={qY} accent={accent} r={5.5} />
        <circle cx={qX} cy={qY} r={5.5} fill="none" stroke={accent}
          strokeOpacity="0.45" strokeWidth="0.8" className="sv-sram-q" />
        <L x={qX - 12} y={qY + 4} text="Q" color={accent} anchor="end" em={1} size={13} />
        <Pin x={qbX} y={qY} accent={accent} r={5.5} opacity={0.5} />
        <L x={qbX + 12} y={qY + 4} text="Q̄" color={accent} anchor="start" em={1} size={13} />

        {/* Stored-bit ring — pulses with Q to underline "this is the
            cell that holds one bit" */}
        <circle cx={qX} cy={qY} r={14} fill="none" stroke={accent}
          strokeOpacity="0.45" strokeWidth="0.8" className="sv-sram-q-pulse" />

        {/* Header */}
        <L x={300} y={28} text="6T Cell · 2 Access + 4 Latch Transistors"
          color={accent} em={0.85} size={11} />
      </svg>
    </div>
  );
}

/**
 * SramL2 — MOSFET cross-section drawn as a stack of named layers.
 *
 * Top to bottom (the actual lithography sequence):
 *   M1 metal contacts       ← copper interconnect to the device
 *   Polysilicon gate        ← the gate electrode
 *   Gate oxide (SiO₂, ~few nm) ← the dielectric
 *   Inversion channel       ← electrons here when V_GS > V_th
 *   n⁺ source / n⁺ drain    ← heavily doped diffusion regions
 *   p-substrate (Si bulk)   ← the wafer
 *
 * The visual depth comes from layered rectangles (each layer drawn
 * over the one below) plus annotation strips on the right. Electrons
 * animate left → right through the channel when the gate is on.
 */
function SramL2({ accent }) {
  // Layer y-bands (top, height) — stacked vertically with no gaps
  const m1Y      = 60;
  const m1H      = 22;
  const polyY    = 100;
  const polyH    = 30;
  const oxideY   = polyY + polyH;        // 130
  const oxideH   = 6;
  const channelY = oxideY + oxideH;      // 136
  const channelH = 14;
  const diffY    = channelY + channelH;  // 150
  const diffH    = 60;
  const subY     = diffY + diffH;        // 210
  const subH     = 130;
  const xLeft    = 80;
  const xRight   = 620;
  const channelXLeft  = 230;
  const channelXRight = 470;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 700 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={350} y={28}
          text="MOSFET Cross-Section · Stacked Layers" color={accent} em={0.95} size={11} />

        {/* Layer: M1 contact pads above source and drain */}
        <rect x={xLeft + 30} y={m1Y} width={120} height={m1H} rx={2}
          fill={accent} fillOpacity="0.58"
          stroke={accent} strokeOpacity="0.95" strokeWidth="0.9" />
        <L x={xLeft + 90} y={m1Y + 14} text="M1 contact" color="rgba(0,0,0,0.85)" em={0.9} size={9} />

        <rect x={xRight - 150} y={m1Y} width={120} height={m1H} rx={2}
          fill={accent} fillOpacity="0.58"
          stroke={accent} strokeOpacity="0.95" strokeWidth="0.9" />
        <L x={xRight - 90} y={m1Y + 14} text="M1 contact" color="rgba(0,0,0,0.85)" em={0.9} size={9} />

        {/* Vias from M1 down through poly level into n⁺ regions */}
        <rect x={xLeft + 84} y={m1Y + m1H} width={12} height={polyY - (m1Y + m1H)}
          fill={accent} fillOpacity="0.5" />
        <rect x={xRight - 96} y={m1Y + m1H} width={12} height={polyY - (m1Y + m1H)}
          fill={accent} fillOpacity="0.5" />

        {/* Layer: polysilicon gate (sits between the two M1 pads) */}
        <rect x={channelXLeft} y={polyY} width={channelXRight - channelXLeft} height={polyH} rx={1}
          fill={accent} fillOpacity="0.72"
          stroke={accent} strokeOpacity="0.95" strokeWidth="1"
          className="sv-trans-gate" />
        <L x={350} y={polyY + 18} text="Polysilicon Gate" color="rgba(0,0,0,0.85)" em={0.95} size={10} />
        {/* Gate contact stub up to "WL · VDD" */}
        <rect x={345} y={m1Y + m1H} width={10} height={polyY - (m1Y + m1H)}
          fill={accent} fillOpacity="0.5" />
        <line x1={350} y1={36} x2={350} y2={m1Y} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <L x={350} y={48} text="WL · V_DD" color={accent} em={0.7} size={10} />

        {/* Layer: gate oxide (SiO₂) — thin bright strip. Label sits
            BELOW the cross-section so it doesn't overlap any layer. */}
        <rect x={channelXLeft} y={oxideY} width={channelXRight - channelXLeft} height={oxideH}
          fill={accent} fillOpacity="0.95" />

        {/* Layer: inversion channel (forms when gate high) */}
        <rect x={channelXLeft} y={channelY} width={channelXRight - channelXLeft} height={channelH}
          fill={accent} fillOpacity="0.22"
          className="sv-trans-channel" />

        {/* Layer: n⁺ Source and n⁺ Drain regions (sit at the same depth
            band, separated by the channel above) */}
        <rect x={xLeft} y={diffY} width={channelXLeft - xLeft} height={diffH}
          fill={accent} fillOpacity="0.32"
          stroke={accent} strokeOpacity="0.85" strokeWidth="1" rx={2} />
        <L x={(xLeft + channelXLeft) / 2} y={diffY + 28} text="n⁺ Source"
          color={accent} em={0.95} size={11} />
        <L x={(xLeft + channelXLeft) / 2} y={diffY + 44} text="(heavily doped)"
          color={accent} em={0.5} size={8} />

        <rect x={channelXRight} y={diffY} width={xRight - channelXRight} height={diffH}
          fill={accent} fillOpacity="0.32"
          stroke={accent} strokeOpacity="0.85" strokeWidth="1" rx={2} />
        <L x={(channelXRight + xRight) / 2} y={diffY + 28} text="n⁺ Drain"
          color={accent} em={0.95} size={11} />
        <L x={(channelXRight + xRight) / 2} y={diffY + 44} text="(heavily doped)"
          color={accent} em={0.5} size={8} />

        {/* Layer: p-substrate (the bulk wafer) */}
        <rect x={xLeft} y={subY} width={xRight - xLeft} height={subH}
          fill={accent} fillOpacity="0.08"
          stroke={accent} strokeOpacity="0.4" strokeWidth="0.8" rx={2} />
        {/* Subtle dot-pattern hint for "this is silicon" without being noisy */}
        {Array.from({ length: 18 }).map((_, c) =>
          Array.from({ length: 4 }).map((_, r) => (
            <circle key={`${c}-${r}`}
              cx={xLeft + 24 + c * 30}
              cy={subY + 24 + r * 24}
              r="1.4" fill={accent} fillOpacity="0.18" />
          )),
        )}
        <L x={350} y={subY + subH / 2 + 4} text="p-Substrate (Si Bulk)"
          color={accent} em={0.7} size={11} />

        {/* Body terminal */}
        <rect x={310} y={subY + subH - 4} width={80} height={16} rx={2}
          fill={accent} fillOpacity="0.5"
          stroke={accent} strokeOpacity="0.85" strokeWidth="0.9" />
        <L x={350} y={subY + subH + 6} text="Body" color="rgba(0,0,0,0.85)" em={0.85} size={10} />

        {/* Layer-pointer captions on the LEFT — leader lines pulled
            out to a column at x=24 so they never overlap a layer rect. */}
        <g>
          {/* SiO₂ gate oxide */}
          <line x1={channelXLeft} y1={oxideY + oxideH / 2}
            x2={24} y2={oxideY + oxideH / 2}
            stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
          <text x={20} y={oxideY + oxideH / 2 + 3}
            fontSize="9" fontFamily={FONT}
            fill={accent} fillOpacity="0.8"
            textAnchor="end"
            letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
            SiO₂ · 1.5 nm
          </text>
          {/* Inversion channel */}
          <line x1={channelXLeft} y1={channelY + channelH / 2}
            x2={24} y2={channelY + channelH / 2}
            stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
          <text x={20} y={channelY + channelH / 2 + 3}
            fontSize="9" fontFamily={FONT}
            fill={accent} fillOpacity="0.8"
            textAnchor="end"
            letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
            Inversion Channel
          </text>
        </g>

        {/* Electrons drifting through the channel */}
        {Array.from({ length: 6 }).map((_, i) => (
          <circle key={i} r="3" cy={channelY + channelH / 2} fill={accent}
            className="sv-trans-elec"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
            <animate attributeName="cx"
              values={`${channelXLeft};${channelXLeft};${channelXRight};${channelXRight}`}
              keyTimes="0;0.15;0.85;1"
              dur="3.6s" repeatCount="indefinite"
              begin={`${i * 0.5}s`} />
            <animate attributeName="opacity"
              values="0;1;1;0" keyTimes="0;0.15;0.85;1"
              dur="3.6s" repeatCount="indefinite"
              begin={`${i * 0.5}s`} />
          </circle>
        ))}

        {/* Layer key on the right */}
        <g transform={`translate(${xRight + 6}, ${m1Y + m1H / 2})`}>
          {[
            { y: 0,                                 label: 'M1' },
            { y: polyY - m1Y,                       label: 'POLY' },
            { y: oxideY - m1Y,                      label: 'OXIDE' },
            { y: channelY - m1Y + channelH / 2 - 4, label: 'CHANNEL' },
            { y: diffY - m1Y + diffH / 2 - 4,       label: 'n⁺' },
            { y: subY - m1Y + 60,                   label: 'p-SUB' },
          ].map((l, i) => (
            <text key={i} x={0} y={l.y + 4}
              fontSize="8" fontFamily={FONT}
              fill={accent} fillOpacity="0.5"
              letterSpacing="0.18em" textAnchor="start"
              style={{ textTransform: 'uppercase' }}>
              {l.label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

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

// ===================================================================
// Stage 3 — DRAM
// ===================================================================

/**
 * DramL0 — DRAM array access. Two-phase address: RAS picks a row,
 * the entire row's charges dump onto bitlines and are amplified by
 * sense-amps; then CAS picks the column to read out. RAS itself is
 * destructive — the row needs to be written back at the end.
 *
 * Real-life cost: ~40 cycles to activate, ~200 to read out (CAS) —
 * which is the cliff in the "287 cycle" cache miss.
 */
function DramL0({ accent }) {
  const ctrlX = 40,  ctrlY = 80,  ctrlW = 130,  ctrlH = 70;
  const arrayX = 240, arrayY = 80;
  const cellSz = 16, cellGap = 4;
  const arrayCols = 16, arrayRows = 9;
  const arrayW = arrayCols * (cellSz + cellGap);
  const arrayH = arrayRows * (cellSz + cellGap);
  const sensesY = arrayY + arrayH + 16;
  const litRow  = 4;
  const litCol  = 9;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="DRAM Array · RAS → Activate → CAS → Read"
          color={accent} em={0.9} size={11} />

        {/* Memory controller box on the left */}
        <rect x={ctrlX} y={ctrlY} width={ctrlW} height={ctrlH} rx={4}
          fill={accent} fillOpacity="0.05"
          stroke={accent} strokeOpacity="0.65" strokeWidth="1.1" />
        <L x={ctrlX + ctrlW / 2} y={ctrlY + 26} text="Memory" color={accent} em={0.95} size={11} />
        <L x={ctrlX + ctrlW / 2} y={ctrlY + 44} text="Controller" color={accent} em={0.95} size={11} />
        <circle cx={ctrlX + ctrlW / 2} cy={ctrlY + ctrlH / 2 + 8} r="14"
          fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2"
          className="sv-dram-ctrl-pulse" />

        {/* addr/cmd bus from controller to array */}
        <line x1={ctrlX + ctrlW} y1={ctrlY + ctrlH / 2}
          x2={arrayX} y2={ctrlY + ctrlH / 2}
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.4"
          className="sv-dram-addr-bus" />
        <Pin x={ctrlX + ctrlW} y={ctrlY + ctrlH / 2} accent={accent} r={1.8} />
        <L x={(ctrlX + ctrlW + arrayX) / 2} y={ctrlY + ctrlH / 2 - 8}
          text="addr / cmd" color={accent} em={0.6} size={9} />

        {/* DRAM array — grid of cells */}
        <L x={arrayX + arrayW / 2} y={arrayY - 14} text="DRAM Bank" color={accent} em={0.85} size={10} />
        {Array.from({ length: arrayRows }).map((_, r) =>
          Array.from({ length: arrayCols }).map((_, c) => (
            <rect key={`${r}-${c}`}
              x={arrayX + c * (cellSz + cellGap)}
              y={arrayY + r * (cellSz + cellGap)}
              width={cellSz} height={cellSz}
              fill={accent} fillOpacity="0.15" rx={1} />
          )),
        )}

        {/* RAS: row-activate stripe */}
        <rect x={arrayX - 4}
          y={arrayY + litRow * (cellSz + cellGap) - 2}
          width={arrayW + 8} height={cellSz + 4}
          fill={accent} opacity="0"
          className="sv-dram-row" />
        {/* Row label + RAS leader */}
        <L x={arrayX - 16}
          y={arrayY + litRow * (cellSz + cellGap) + cellSz / 2 + 4}
          text="row" color={accent} anchor="end" em={0.65} size={9} />
        <L x={arrayX + arrayW + 14}
          y={arrayY + litRow * (cellSz + cellGap) + cellSz / 2 + 4}
          text="RAS · activate" color={accent} anchor="start" em={0.6} size={9} />

        {/* CAS: column-select stripe */}
        <rect x={arrayX + litCol * (cellSz + cellGap) - 2}
          y={arrayY - 4}
          width={cellSz + 4} height={arrayH + 8}
          fill={accent} opacity="0"
          className="sv-dram-col" />
        <L x={arrayX + litCol * (cellSz + cellGap) + cellSz / 2}
          y={arrayY - 4} text="col" color={accent} em={0.65} size={9} />

        {/* Sense amplifiers — triangles below the array */}
        <g transform={`translate(${arrayX}, ${sensesY})`}>
          {Array.from({ length: arrayCols }).map((_, c) => (
            <path key={c}
              d={`M ${c * (cellSz + cellGap)} 0 L ${c * (cellSz + cellGap) + cellSz} 0 L ${c * (cellSz + cellGap) + cellSz / 2} 16 Z`}
              fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="0.8" />
          ))}
          {/* Activated sense amp band — fades in after RAS */}
          <rect x={0} y={0} width={arrayW} height={16}
            fill={accent} className="sv-dram-sense" opacity="0" />
        </g>
        <L x={arrayX + arrayW + 14} y={sensesY + 12} text="sense amps"
          color={accent} anchor="start" em={0.6} size={9} />

        {/* Output line: from sense amp at lit column down to data-out */}
        <line x1={arrayX + litCol * (cellSz + cellGap) + cellSz / 2} y1={sensesY + 16}
          x2={arrayX + litCol * (cellSz + cellGap) + cellSz / 2} y2={365}
          stroke={accent} strokeWidth="1.6" className="sv-dram-out-line" />
        <Pin x={arrayX + litCol * (cellSz + cellGap) + cellSz / 2} y={365} accent={accent} />
        <L x={arrayX + litCol * (cellSz + cellGap) + cellSz / 2 + 10} y={369}
          text="CAS · data out · 64 bits" color={accent} anchor="start" em={0.6} size={9} />

        {/* Cycle-cost annotation */}
        <L x={300} y={388}
          text="RAS ≈ 40 cyc · CAS ≈ 200 cyc · this is the DRAM cliff"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * DramL1 — 1T1C DRAM cell. Real DRAM density wins because it stores
 * one bit per { 1 access transistor + 1 capacitor } — vs. 6 transistors
 * for SRAM. The trade-off: charge leaks off the cap, so the row must
 * be refreshed every ~64 ms.
 *
 * Layout:
 *   • WL drives the access gate from above.
 *   • BL on the left of the access transistor — driven low (precharge)
 *     before read; the cap's charge dumps onto BL during read.
 *   • Storage cap (Cs) on the right of the access transistor; bottom
 *     plate tied to GND.
 */
function DramL1({ accent }) {
  const wlY  = 80;
  const txY  = 160;
  const blX  = 110;
  const m1X  = 250;
  const capX = 410;
  const capTopY = 260;
  const capBotY = 280;
  const gndY = 340;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="1T1C Cell · One Transistor + One Capacitor"
          color={accent} em={0.9} size={11} />

        {/* WL */}
        <line x1={40} y1={wlY} x2={560} y2={wlY} stroke={accent}
          strokeWidth="2.4" className="sv-dram-wl" opacity="0.7" />
        <L x={28} y={wlY + 4} text="WL" color={accent} anchor="end" em={0.95} size={11} />
        <Pin x={m1X} y={wlY} accent={accent} />

        {/* M1 access transistor — gate up to WL */}
        <line x1={m1X} y1={wlY} x2={m1X} y2={txY - 30} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <NMOS_H x={m1X} y={txY} accent={accent} scale={1.3} />
        <L x={m1X} y={txY + 32} text="M1 · access" color={accent} em={0.75} size={9} />

        {/* BL on the left, vertical full-height */}
        <line x1={blX} y1={60} x2={blX} y2={370} stroke={accent}
          strokeWidth="2" className="sv-dram-bl" opacity="0.65" />
        <L x={blX} y={388} text="BL" color={accent} em={0.95} size={12} />

        {/* BL → M1 source (left lead) */}
        <line x1={blX} y1={txY} x2={m1X - 22 * 1.3} y2={txY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={blX} y={txY} accent={accent} />

        {/* M1 drain → Cs top plate */}
        <line x1={m1X + 22 * 1.3} y1={txY} x2={capX} y2={txY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <line x1={capX} y1={txY} x2={capX} y2={capTopY - 4} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />

        {/* Cs — top plate */}
        <line x1={capX - 24} y1={capTopY} x2={capX + 24} y2={capTopY} stroke={accent}
          strokeOpacity="0.95" strokeWidth="2.6" />
        {/* Cs — bottom plate (curved, ground convention) */}
        <path d={`M ${capX - 22} ${capBotY} Q ${capX} ${capBotY + 6} ${capX + 22} ${capBotY}`}
          stroke={accent} strokeOpacity="0.95" strokeWidth="2.4" fill="none" />
        <L x={capX + 32} y={capTopY + 4} text="Cs" color={accent} anchor="start" em={1} size={13} />
        <L x={capX + 32} y={capTopY + 18} text="storage cap" color={accent} anchor="start" em={0.6} size={9} />

        {/* Cs bottom → GND */}
        <line x1={capX} y1={capBotY + 4} x2={capX} y2={gndY} stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1={capX - 18} y1={gndY} x2={capX + 18} y2={gndY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.6" />
        <line x1={capX - 12} y1={gndY + 6} x2={capX + 12} y2={gndY + 6} stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.4" />
        <line x1={capX - 6} y1={gndY + 12} x2={capX + 6} y2={gndY + 12} stroke={accent}
          strokeOpacity="0.4" strokeWidth="1.2" />
        <L x={capX} y={gndY + 28} text="GND" color={accent} em={0.7} size={9} />

        {/* Charge cloud — animated transfer from cap → BL during read */}
        <g className="sv-dram-charge-cloud">
          {[0, 1, 2].map((i) => (
            <circle key={i} cy={txY} r="3" fill={accent}
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
              <animate attributeName="cx"
                values={`${capX};${capX};${blX};${blX}`}
                keyTimes="0;0.2;0.7;1"
                dur="3.6s" repeatCount="indefinite"
                begin={`${i * 0.45}s`} />
              <animate attributeName="opacity"
                values="0;1;1;0" keyTimes="0;0.15;0.85;1"
                dur="3.6s" repeatCount="indefinite"
                begin={`${i * 0.45}s`} />
            </circle>
          ))}
        </g>
        <L x={300} y={386}
          text="WL high → charge dumps from Cs onto BL · reading is destructive · refresh every 64 ms"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * DramL2 — DRAM storage capacitor — parallel plates with the
 * dielectric between them and a charge density indicating which
 * logical state is stored.
 *
 * Field lines run vertically between top and bottom plates; the
 * stored charge sits as a population of electrons on the bottom
 * plate when storing a 0 (or top when storing a 1; we show "1" with
 * charge near the top plate). Refresh exists because the cap leaks
 * charge over ~ms timescales — DRAM's fundamental limitation.
 */
function DramL2({ accent }) {
  const xL = 130, xR = 470;
  const topPlateY = 100, plateH = 22;
  const botPlateY = 280;
  const dielTop = topPlateY + plateH;
  const dielBot = botPlateY;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Storage Capacitor · Charge → Bit · Leakage → Refresh"
          color={accent} em={0.9} size={11} />

        {/* Top plate (BL side) */}
        <rect x={xL} y={topPlateY} width={xR - xL} height={plateH} rx={2}
          fill={accent} fillOpacity="0.65"
          stroke={accent} strokeOpacity="0.95" strokeWidth="1" />
        <L x={300} y={topPlateY - 8} text="Top Plate (BL)" color={accent} em={0.85} size={10} />
        <Pin x={300} y={topPlateY} accent={accent} />
        <line x1={300} y1={50} x2={300} y2={topPlateY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <L x={306} y={68} text="BL" color={accent} anchor="start" em={0.7} size={10} />

        {/* Bottom plate (GND side) */}
        <rect x={xL} y={botPlateY} width={xR - xL} height={plateH} rx={2}
          fill={accent} fillOpacity="0.65"
          stroke={accent} strokeOpacity="0.95" strokeWidth="1" />
        <L x={300} y={botPlateY + plateH + 16} text="Bottom Plate (GND)" color={accent} em={0.85} size={10} />
        <Pin x={300} y={botPlateY + plateH} accent={accent} />
        <line x1={300} y1={botPlateY + plateH} x2={300} y2={358} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <line x1={284} y1={358} x2={316} y2={358} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.6" />
        <line x1={290} y1={364} x2={310} y2={364} stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.4" />
        <line x1={296} y1={370} x2={304} y2={370} stroke={accent}
          strokeOpacity="0.4" strokeWidth="1.2" />

        {/* Dielectric region with field lines (vertical, fading further from plates) */}
        <rect x={xL} y={dielTop} width={xR - xL} height={dielBot - dielTop}
          fill={accent} fillOpacity="0.05" />
        {Array.from({ length: 14 }).map((_, i) => {
          const fx = xL + 12 + i * ((xR - xL - 24) / 13);
          return (
            <line key={i}
              x1={fx} y1={dielTop + 2}
              x2={fx} y2={dielBot - 2}
              stroke={accent} strokeOpacity="0.18" strokeWidth="0.7" />
          );
        })}
        <L x={xR + 14} y={(dielTop + dielBot) / 2}
          text="dielectric" color={accent} anchor="start" em={0.65} size={9} />
        <L x={xR + 14} y={(dielTop + dielBot) / 2 + 14}
          text="(SiO₂ / hi-κ)" color={accent} anchor="start" em={0.55} size={8} />

        {/* Stored charge — electrons clustered on the top side
            (representing logic 1). Animated subtle bobbing. */}
        <g>
          {Array.from({ length: 16 }).map((_, i) => {
            const col = i % 8;
            const row = Math.floor(i / 8);
            return (
              <circle key={i}
                cx={xL + 50 + col * 40}
                cy={dielTop + 14 + row * 10}
                r={3.4} fill={accent}
                fillOpacity="0.9"
                style={{ filter: `drop-shadow(0 0 5px ${accent})` }} />
            );
          })}
        </g>
        <L x={xL + 12} y={dielTop + 22}
          text="stored charge → logic 1" color={accent} anchor="start" em={0.55} size={9} />

        {/* Leakage drift — a few electrons drift downward over the
            cycle, fading as they "escape". This is why DRAM needs
            refresh every ~64 ms in real silicon. */}
        {Array.from({ length: 4 }).map((_, i) => (
          <circle key={`leak-${i}`}
            cx={xL + 80 + i * 80} r="2.6" fill={accent}
            style={{ filter: `drop-shadow(0 0 4px ${accent})` }}>
            <animate attributeName="cy"
              values={`${dielTop + 30};${dielTop + 30};${dielBot - 8};${dielBot - 8}`}
              keyTimes="0;0.25;0.85;1"
              dur="6s" repeatCount="indefinite"
              begin={`${i * 1.5}s`} />
            <animate attributeName="opacity"
              values="0;0.55;0.05;0"
              keyTimes="0;0.25;0.85;1"
              dur="6s" repeatCount="indefinite"
              begin={`${i * 1.5}s`} />
          </circle>
        ))}
        <L x={xR - 4} y={dielBot + 4}
          text="↘ leakage · why refresh exists"
          color={accent} anchor="end" em={0.6} size={9} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 4 — COHERENCE
// ===================================================================

/**
 * CoherenceL0 — four cores, a directory, and the snoop bus.
 *
 * Topology fix (was 4 random diagonals): now the snoop bus is an
 * actual horizontal bus running across the middle of the chip. Each
 * core taps the bus, the directory taps it too. When C0 modifies a
 * line, snoop messages travel left+right across the bus to the other
 * cores; their cached copies (if any) get invalidated.
 *
 * The directory's sharer bitmap shows which cores currently hold a
 * copy of this line. After the snoop completes, only C0's bit stays
 * lit (Modified, exclusive owner).
 */
function CoherenceL0({ accent }) {
  const cores = [
    { id: 'C0', x: 40,  y: 40,  state: 'M' },
    { id: 'C1', x: 460, y: 40,  state: 'I' },
    { id: 'C2', x: 40,  y: 280, state: 'I' },
    { id: 'C3', x: 460, y: 280, state: 'I' },
  ];
  const busY = 200;
  const dirX = 220;
  const dirY = busY - 30;
  const dirW = 160;
  const dirH = 60;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Coherence · 4 Cores + Directory + Snoop Bus"
          color={accent} em={0.9} size={11} />

        {/* The four cores at the corners */}
        {cores.map((c) => {
          const lit = c.state === 'M';
          return (
            <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
              <rect width={100} height={100} rx={3}
                fill={lit ? accent : 'none'}
                fillOpacity={lit ? 0.18 : 0}
                stroke={accent} strokeOpacity={lit ? 0.95 : 0.45} strokeWidth="1"
                className={lit ? 'sv-coh-core-lit' : ''} />
              <L x={50} y={-6} text={c.id} color={accent} em={1} size={12} />
              <L x={50} y={14} text="L1" color={accent} em={0.55} size={8} />
              {/* Cache-line states small grid */}
              {[0, 1].map((row) => (
                <g key={row} transform={`translate(8, ${24 + row * 32})`}>
                  {[0, 1, 2, 3].map((w) => {
                    const target = row === 0 && w === 1;
                    return (
                      <rect key={w} x={w * 21} y={0} width={18} height={26} rx={1}
                        fill={target && lit ? accent : 'none'}
                        fillOpacity={target && lit ? 0.85 : 0}
                        stroke={accent}
                        strokeOpacity={target ? 0.85 : 0.3}
                        strokeWidth={target ? 1 : 0.6} />
                    );
                  })}
                </g>
              ))}
              {/* State marker — big M / I bottom-right */}
              <text x={92} y={94} textAnchor="end"
                fontSize="22" fontFamily={FONT}
                fill={accent} fillOpacity={lit ? 1 : 0.4}
                letterSpacing="0.06em"
                style={lit ? { filter: `drop-shadow(0 0 10px ${accent})` } : undefined}>
                {c.state}
              </text>
            </g>
          );
        })}

        {/* Snoop bus — proper horizontal bus running through the middle.
            Two parallel rails so it reads as a real bus, not a wire. */}
        <line x1={20} y1={busY - 4} x2={580} y2={busY - 4}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1.2" />
        <line x1={20} y1={busY + 4} x2={580} y2={busY + 4}
          stroke={accent} strokeOpacity="0.55" strokeWidth="1.2" />
        <L x={20} y={busY - 12} text="snoop bus" color={accent} anchor="start" em={0.7} size={9} />

        {/* Tap stubs — each core / directory has a stub from its edge to the bus */}
        {cores.map((c) => {
          // Core box is 100×100. Bottom mid is at (c.x+50, c.y+100).
          // Top mid is at (c.x+50, c.y).
          const isTop = c.y < busY;
          const stubX = c.x + 50;
          const stubFromY = isTop ? c.y + 100 : c.y;
          return (
            <g key={`tap-${c.id}`}>
              <line x1={stubX} y1={stubFromY} x2={stubX} y2={busY + (isTop ? -4 : 4)}
                stroke={accent} strokeOpacity="0.65" strokeWidth="1.2" />
              <Pin x={stubX} y={busY} accent={accent} r={2.4} />
            </g>
          );
        })}

        {/* Directory — sits inline on the bus in the middle */}
        <rect x={dirX} y={dirY} width={dirW} height={dirH} rx={4}
          fill={accent} fillOpacity="0.16"
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.1" />
        <L x={300} y={dirY - 6} text="Directory · sharer bitmap"
          color={accent} em={0.85} size={10} />
        {/* Bus stubs to directory */}
        <line x1={dirX} y1={busY} x2={dirX - 12} y2={busY} stroke={accent}
          strokeOpacity="0.55" strokeWidth="1" />
        <line x1={dirX + dirW} y1={busY} x2={dirX + dirW + 12} y2={busY} stroke={accent}
          strokeOpacity="0.55" strokeWidth="1" />
        <Pin x={dirX} y={busY} accent={accent} r={1.8} />
        <Pin x={dirX + dirW} y={busY} accent={accent} r={1.8} />
        {/* Per-core sharer bits inside the directory */}
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${dirX + 16 + i * 36}, ${dirY + 12})`}>
            <L x={10} y={-2} text={`C${i}`} color={accent} em={0.6} size={8} />
            <rect width={20} height={36} y={2} rx={2}
              fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.7" />
            <rect x={3} y={6} width={14} height={28}
              fill={accent}
              fillOpacity={i === 0 ? 0.85 : 0.18}
              className={`sv-coh-bit sv-coh-dir-bit-${i}-0`} />
          </g>
        ))}

        {/* Snoop packets — animated dots traveling along the bus from
            C0 outward to C1 and C3 (and the directory). Each fades in
            at C0 and out at the recipient. */}
        {[
          // C0 → directory
          { from: [90, busY], to: [dirX, busY], delay: 0 },
          // C0 → C2 (down-left)
          { from: [90, busY], to: [90, cores[2].y], delay: 0.5 },
          // directory → C1 (right edge)
          { from: [dirX + dirW, busY], to: [510, busY], delay: 1.0 },
          // directory → C3 (down-right)
          { from: [dirX + dirW, busY], to: [510, busY], delay: 1.5 },
          { from: [510, busY], to: [510, cores[3].y], delay: 2.0 },
        ].map((p, i) => (
          <circle key={i} r="3.6" fill={accent}
            style={{ filter: `drop-shadow(0 0 7px ${accent})` }}>
            <animateMotion dur="4s" repeatCount="indefinite"
              begin={`${p.delay}s`}
              path={`M ${p.from[0]} ${p.from[1]} L ${p.to[0]} ${p.to[1]}`} />
            <animate attributeName="opacity"
              values="0;1;1;0" keyTimes="0;0.15;0.85;1"
              dur="4s" repeatCount="indefinite"
              begin={`${p.delay}s`} />
          </circle>
        ))}

        <L x={300} y={388}
          text="C0 modifies → snoop fires on bus → others invalidate · directory updates"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * CoherenceL1 — 2-bit MESI cacheline state register, drawn as two
 * D flip-flops feeding a 4-state decoder.
 *
 *   D_set ─→ [FF · bit 1] ─Q1─┐
 *                              ├─→ [DECODER] ─→ {M, E, S, I}
 *   D_set ─→ [FF · bit 0] ─Q0─┘                  ↑
 *                                                 current state lights
 *
 * MESI encoding (one common choice):
 *   11 = Modified · 10 = Exclusive · 01 = Shared · 00 = Invalid
 * The directory's clock latches the new state on each transition.
 */
function CoherenceL1({ accent }) {
  // Bit 1 = '1' and Bit 0 = '1' → state Modified (this line is dirty,
  // owned by us). Highlighted in the decoder.
  const states = [
    { code: '11', label: 'M', name: 'Modified',  active: true  },
    { code: '10', label: 'E', name: 'Exclusive', active: false },
    { code: '01', label: 'S', name: 'Shared',    active: false },
    { code: '00', label: 'I', name: 'Invalid',   active: false },
  ];
  const ffY    = 110;
  const ffH    = 80;
  const ff1X   = 120;
  const ff0X   = 360;
  const ffW    = 120;
  const decY   = 270;
  const decH   = 70;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Cacheline State Register · 2 Bits → 4 MESI States"
          color={accent} em={0.9} size={11} />

        {/* D inputs at top (next-state from coherence FSM) */}
        {[ff1X, ff0X].map((x, i) => (
          <g key={`d-${i}`}>
            <L x={x + ffW / 2} y={62} text={i === 0 ? 'D_next₁' : 'D_next₀'}
              color={accent} em={0.7} size={9} />
            <line x1={x + ffW / 2} y1={70} x2={x + ffW / 2} y2={ffY}
              stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
            <Pin x={x + ffW / 2} y={ffY} accent={accent} />
          </g>
        ))}

        {/* Two D flip-flop boxes */}
        {[
          { x: ff1X, label: 'FF · bit 1', q: 'Q₁', val: '1' },
          { x: ff0X, label: 'FF · bit 0', q: 'Q₀', val: '1' },
        ].map((ff, i) => (
          <g key={`ff-${i}`}>
            <rect x={ff.x} y={ffY} width={ffW} height={ffH} rx={4}
              fill={accent} fillOpacity="0.05"
              stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
            <L x={ff.x + ffW / 2} y={ffY - 8} text={ff.label}
              color={accent} em={0.85} size={10} />
            <text x={ff.x + ffW / 2} y={ffY + ffH / 2 + 10} textAnchor="middle"
              fontSize="36" fontFamily={FONT}
              fill={accent} fillOpacity="0.85"
              style={{ filter: `drop-shadow(0 0 8px ${accent})` }}>
              {ff.val}
            </text>
            {/* CK input on the left side of each FF */}
            <line x1={ff.x - 28} y1={ffY + ffH - 16} x2={ff.x} y2={ffY + ffH - 16}
              stroke={accent} strokeOpacity="0.65" strokeWidth="1.1" />
            <Pin x={ff.x - 28} y={ffY + ffH - 16} accent={accent} r={1.6} />
            <Pin x={ff.x} y={ffY + ffH - 16} accent={accent} r={1.6} />
            <L x={ff.x - 32} y={ffY + ffH - 12} text="CK"
              color={accent} anchor="end" em={0.6} size={9} />
            {/* Q output */}
            <line x1={ff.x + ffW} y1={ffY + ffH / 2} x2={ff.x + ffW + 28} y2={ffY + ffH / 2}
              stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
            <Pin x={ff.x + ffW} y={ffY + ffH / 2} accent={accent} />
            <L x={ff.x + ffW + 36} y={ffY + ffH / 2 + 4} text={ff.q}
              color={accent} anchor="start" em={0.95} size={11} />
          </g>
        ))}

        {/* Q-bus running down to the decoder */}
        <line x1={ff1X + ffW + 28} y1={ffY + ffH / 2} x2={ff1X + ffW + 28} y2={decY - 6}
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.1" />
        <line x1={ff0X + ffW + 28} y1={ffY + ffH / 2} x2={ff0X + ffW + 28} y2={decY - 6}
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.1" />
        <Pin x={ff1X + ffW + 28} y={decY - 6} accent={accent} r={1.6} />
        <Pin x={ff0X + ffW + 28} y={decY - 6} accent={accent} r={1.6} />

        {/* Decoder box */}
        <rect x={50} y={decY} width={500} height={decH} rx={4}
          fill={accent} fillOpacity="0.05"
          stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
        <L x={300} y={decY - 8} text="2 → 4 Decoder · MESI"
          color={accent} em={0.85} size={10} />

        {/* The four state cells inside the decoder */}
        {states.map((s, i) => {
          const cellW = 110;
          const cellPad = 10;
          const cellX = 50 + 14 + i * (cellW + cellPad);
          return (
            <g key={s.code} className={s.active ? 'sv-coh-state-active' : ''}>
              <rect x={cellX} y={decY + 10} width={cellW} height={decH - 20} rx={3}
                fill={accent} fillOpacity={s.active ? 0.85 : 0.08}
                stroke={accent} strokeOpacity={s.active ? 1 : 0.4}
                strokeWidth={s.active ? 1.4 : 0.8}
                style={s.active ? { filter: `drop-shadow(0 0 12px ${accent})` } : undefined} />
              <text x={cellX + cellW / 2} y={decY + decH / 2 - 2}
                textAnchor="middle" fontSize="20" fontFamily={FONT}
                fill={s.active ? 'rgba(0,0,0,0.85)' : accent}
                fillOpacity={s.active ? 1 : 0.65}>
                {s.label}
              </text>
              <text x={cellX + cellW / 2} y={decY + decH / 2 + 14}
                textAnchor="middle" fontSize="9" fontFamily={FONT}
                fill={s.active ? 'rgba(0,0,0,0.85)' : accent}
                fillOpacity={s.active ? 0.85 : 0.5}
                letterSpacing="0.18em" style={{ textTransform: 'uppercase' }}>
                {s.code} · {s.name}
              </text>
            </g>
          );
        })}

        {/* Pointer from active cell up to the decoder boundary */}
        <line x1={120} y1={decY + 10} x2={ff1X + ffW + 28} y2={decY - 6}
          stroke={accent} strokeOpacity="0.35" strokeWidth="0.8"
          strokeDasharray="3 3" />

        <L x={300} y={386}
          text={'Q₁Q₀ = 11 → state = M (modified) · directory installs new state on CK'}
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

/**
 * CoherenceL2 — one bit of MESI state stored in a cross-coupled NAND
 * SR latch.
 *
 * Two NAND2 gates wired so each gate's output feeds the *other* gate's
 * input:
 *
 *   S̄ ───[A]── NAND1 ──→ Q ─────────────┐
 *               ▲                       │
 *               └──────────────────┐    │
 *                                  │    │
 *   R̄ ───[B]── NAND2 ──→ Q̄ ──┘    │
 *               ▲                       │
 *               └───────────────────────┘
 *
 * Active-low S̄ sets Q=1; active-low R̄ resets Q=0; both high holds.
 * The directory bit cell uses one of these per sharer. CK is the
 * directory clock that triggers comparator updates.
 */
function CoherenceL2({ accent }) {
  // Both NANDs at the same y, side by side. Cross-coupling drawn as
  // two arcs that loop above/below to keep wires from crossing on top
  // of each other.
  const w = 44;
  const n1X = 200;
  const n2X = 360;
  const nY  = 170;
  // Each NAND's pin coordinates given our primitive:
  //   inputs at (cx-12, cy-8) and (cx-12, cy+8)
  //   output  at (cx + w + 18, cy)
  const n1 = {
    inA: [n1X - 12, nY - 8],
    inB: [n1X - 12, nY + 8],
    out: [n1X + w + 18, nY],
  };
  const n2 = {
    inA: [n2X - 12, nY - 8],
    inB: [n2X - 12, nY + 8],
    out: [n2X + w + 18, nY],
  };
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Cross-Coupled NAND SR Latch · 1 Bit of Directory State"
          color={accent} em={0.9} size={11} />

        {/* External inputs — S̄ (set, active-low) and R̄ (reset, active-low) */}
        <L x={64} y={n1.inA[1] + 4} text="S̄" color={accent} anchor="end" em={1} size={13} />
        <line x1={74} y1={n1.inA[1]} x2={n1.inA[0]} y2={n1.inA[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={n1.inA[0]} y={n1.inA[1]} accent={accent} />

        <L x={64} y={n2.inB[1] + 4} text="R̄" color={accent} anchor="end" em={1} size={13} />
        <line x1={74} y1={n2.inB[1]} x2={n2.inB[0]} y2={n2.inB[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        {/* R̄ wire jumps over to NAND2's lower input — it routes underneath the latch */}
        <Pin x={n2.inB[0]} y={n2.inB[1]} accent={accent} />

        {/* The two NAND gates */}
        <NAND x={n1X} y={nY} accent={accent} w={w} />
        <NAND x={n2X} y={nY} accent={accent} w={w} />
        <L x={n1X + w / 2} y={nY - 36} text="NAND1" color={accent} em={0.7} size={9} />
        <L x={n2X + w / 2} y={nY - 36} text="NAND2" color={accent} em={0.7} size={9} />

        {/* NAND1 output → Q output and to NAND2's top input (cross-coupled) */}
        <line x1={n1.out[0]} y1={n1.out[1]} x2={n2X - 30} y2={n1.out[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3"
          className="sv-coh-bit-pulse" />
        <Pin x={n1.out[0]} y={n1.out[1]} accent={accent} />
        {/* Q tap (output goes off to the right as Q) */}
        <line x1={n1.out[0] + 6} y1={n1.out[1]} x2={n1.out[0] + 6} y2={nY - 70}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n1.out[0] + 6} y1={nY - 70} x2={500} y2={nY - 70}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={500} y={nY - 70} accent={accent} />
        <L x={510} y={nY - 66} text="Q" color={accent} anchor="start" em={1} size={13} />
        {/* Cross-coupling: from NAND1 output, route up over NAND2 and down to its top input */}
        <line x1={n2X - 30} y1={n1.out[1]} x2={n2X - 30} y2={nY - 30}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n2X - 30} y1={nY - 30} x2={n2.inA[0] - 6} y2={nY - 30}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n2.inA[0] - 6} y1={nY - 30} x2={n2.inA[0] - 6} y2={n2.inA[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n2.inA[0] - 6} y1={n2.inA[1]} x2={n2.inA[0]} y2={n2.inA[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={n2.inA[0]} y={n2.inA[1]} accent={accent} />

        {/* NAND2 output → Q̄ and to NAND1's bottom input */}
        <line x1={n2.out[0]} y1={n2.out[1]} x2={n2.out[0] + 60} y2={n2.out[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={n2.out[0]} y={n2.out[1]} accent={accent} />
        {/* Q̄ tap routes down */}
        <line x1={n2.out[0] + 36} y1={n2.out[1]} x2={n2.out[0] + 36} y2={nY + 80}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n2.out[0] + 36} y1={nY + 80} x2={500} y2={nY + 80}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={500} y={nY + 80} accent={accent} />
        <L x={510} y={nY + 84} text="Q̄" color={accent} anchor="start" em={1} size={13} />
        {/* Cross-coupling: from NAND2 output, route under NAND1 and up to its bottom input */}
        <line x1={n2.out[0] + 60} y1={n2.out[1]} x2={n2.out[0] + 60} y2={nY + 50}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n2.out[0] + 60} y1={nY + 50} x2={n1.inB[0] - 6} y2={nY + 50}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n1.inB[0] - 6} y1={nY + 50} x2={n1.inB[0] - 6} y2={n1.inB[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <line x1={n1.inB[0] - 6} y1={n1.inB[1]} x2={n1.inB[0]} y2={n1.inB[1]}
          stroke={accent} strokeOpacity="0.85" strokeWidth="1.3" />
        <Pin x={n1.inB[0]} y={n1.inB[1]} accent={accent} />

        {/* CK rail — directory clock */}
        <line x1={40} y1={310} x2={540} y2={310} stroke={accent}
          strokeWidth="1.4" className="sv-coh-clk" opacity="0.65" />
        <L x={28} y={314} text="CK" color={accent} anchor="end" em={0.85} size={11} />
        {/* Square-wave clock glyph */}
        <path d={`M 60 310 L 110 310 L 110 296 L 160 296 L 160 310 L 210 310 L 210 296 L 260 296 L 260 310 L 310 310 L 310 296 L 360 296 L 360 310 L 410 310 L 410 296 L 460 296 L 460 310 L 510 310`}
          stroke={accent} strokeWidth="1" fill="none" opacity="0.7" />

        {/* Caption */}
        <L x={300} y={384}
          text="S̄ low → set (Q=1) · R̄ low → reset · both high → hold"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 5 — FILL CASCADE
// ===================================================================

/**
 * FillL0 — the cacheline cascades back through the hierarchy.
 *
 * The 64 B line lands at L3 first, then is installed at L2, then at
 * L1. Each level may evict an LRU line to make room. The cycle cost
 * (~5 cyc per level) accumulates but the next access to anything in
 * that line will hit L1 — the locality payoff.
 */
function FillL0({ accent }) {
  const levels = [
    { y: 80,  sets: 16, delay: 0.0, label: 'L3 · 8 MB',   step: '1', cycles: '+0 cyc' },
    { y: 180, sets: 12, delay: 1.2, label: 'L2 · 256 KB', step: '2', cycles: '+5 cyc' },
    { y: 280, sets: 8,  delay: 2.4, label: 'L1 · 32 KB',  step: '3', cycles: '+10 cyc' },
  ];
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Cacheline Cascade · L3 → L2 → L1 · 64-byte line at every level"
          color={accent} em={0.9} size={11} />

        {levels.map((lvl, levelIdx) => (
          <g key={levelIdx} transform={`translate(0, ${lvl.y})`}>
            {/* Order pip + level label — left edge */}
            <circle cx={28} cy={30} r={13}
              fill={accent} fillOpacity="0.2"
              stroke={accent} strokeOpacity="0.9" strokeWidth="1" />
            <text x={28} y={34} textAnchor="middle"
              fontSize="13" fontFamily={FONT}
              fill={accent} fillOpacity="0.95"
              letterSpacing="0.08em">
              {lvl.step}
            </text>
            <L x={50} y={24} text={lvl.label} color={accent} anchor="start" em={0.9} size={11} />
            <L x={50} y={40} text={lvl.cycles} color={accent} anchor="start" em={0.6} size={9} />

            {/* Set boxes for this level */}
            <g transform={`translate(150, 0)`}>
              {Array.from({ length: lvl.sets }).map((_, s) => (
                <rect key={s}
                  x={s * 26} y={0}
                  width={22} height={60}
                  fill={accent} fillOpacity="0.05"
                  stroke={accent} strokeOpacity="0.3" strokeWidth="0.6" />
              ))}

              {/* The newly installed line — fades in at this level on
                  its delay, lands as a tight bundle of bytes inside one
                  set. Marker shows "the line is HERE now". */}
              <g className={`sv-fill-line sv-fill-line-${levelIdx}`}
                style={{ animationDelay: `${lvl.delay}s` }}>
                <rect x={2} y={4} width={18} height={52} rx={1}
                  fill={accent} fillOpacity="0.85"
                  stroke={accent} strokeOpacity="0.95" strokeWidth="0.8"
                  style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
                {Array.from({ length: 8 }).map((_, c) => (
                  <rect key={c}
                    x={4 + c * 2} y={8}
                    width={1.4} height={44}
                    fill="rgba(0,0,0,0.7)" />
                ))}
              </g>

              {/* LRU eviction — only L2 and L1 have to evict to make room */}
              {levelIdx < 2 && (
                <g className={`sv-fill-victim sv-fill-victim-${levelIdx}`}
                  style={{ animationDelay: `${lvl.delay + 0.4}s` }}>
                  <rect x={lvl.sets * 26 - 24} y={4}
                    width={22} height={52} rx={1}
                    fill="none" stroke={accent} strokeOpacity="0.65"
                    strokeDasharray="3 2" strokeWidth="0.9" />
                  <L x={lvl.sets * 26 - 13} y={72} text="LRU evict"
                    color={accent} em={0.6} size={8} />
                </g>
              )}
            </g>
          </g>
        ))}

        {/* Cascade arrows between levels — vertical lines from the
            current level's pip down to the next level's pip. */}
        <g>
          <path d="M 28 116 L 28 162 L 22 156 M 28 162 L 34 156"
            stroke={accent} strokeWidth="1.6" fill="none"
            className="sv-fill-arrow sv-fill-arrow-0"
            style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
          <path d="M 28 216 L 28 262 L 22 256 M 28 262 L 34 256"
            stroke={accent} strokeWidth="1.6" fill="none"
            className="sv-fill-arrow sv-fill-arrow-1"
            style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        </g>

        <L x={300} y={388}
          text="line installed at every level · next access hits L1"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

/**
 * FillL1 — one cache set, 4 ways, the new 64-byte line landing in W1.
 *
 * Each way row is a tag + 8 byte-chunks. Bytes land sequentially
 * (chunk-by-chunk) over the cycle, with a stagger so the user sees
 * the line "filling in" rather than appearing all at once. The LRU
 * column on the right shows W0 was the eviction target.
 */
function FillL1({ accent }) {
  const ways = [0, 1, 2, 3];
  const newWay = 1;
  const lruWay = 0;
  const rowH = 60;
  const rowGap = 18;
  const rowStartX = 60;
  const rowW = 420;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="One Set · 4 Ways · New 64-byte line installed in W1"
          color={accent} em={0.9} size={11} />

        {/* Header above the byte chunks */}
        <L x={rowStartX + 50} y={56}
          text="tag" color={accent} em={0.55} size={8} />
        <L x={rowStartX + 250} y={56}
          text="8 × 8-byte chunks · 64 B total" color={accent} em={0.55} size={8} />

        {ways.map((w) => {
          const y = 70 + w * (rowH + rowGap);
          const isNew = w === newWay;
          const isLru = w === lruWay;
          return (
            <g key={w}>
              <L x={rowStartX - 12} y={y + rowH / 2 + 4}
                text={`W${w}`} color={accent} anchor="end"
                em={isNew ? 0.95 : 0.55} size={11} />
              <rect x={rowStartX} y={y} width={rowW} height={rowH} rx={3}
                fill={isNew ? accent : 'none'}
                fillOpacity={isNew ? 0.04 : 0}
                stroke={accent}
                strokeOpacity={isNew ? 0.9 : isLru ? 0.55 : 0.3}
                strokeDasharray={isLru ? '3 3' : 'none'}
                strokeWidth={isNew ? 1.1 : 0.8} />
              {/* Tag block */}
              <rect x={rowStartX + 12} y={y + 14} width={86} height={rowH - 28} rx={1}
                fill={accent}
                fillOpacity={isNew ? 0.85 : 0.18}
                className={isNew ? 'sv-fill-tag-new' : ''} />
              <text x={rowStartX + 55} y={y + rowH / 2 + 3}
                textAnchor="middle" fontSize="9" fontFamily={FONT}
                fill={isNew ? 'rgba(0,0,0,0.85)' : accent}
                fillOpacity={isNew ? 0.95 : 0.4}
                letterSpacing="0.12em">
                0x4080
              </text>
              {/* 8 byte chunks — for the new way, each lands on a stagger */}
              {Array.from({ length: 8 }).map((_, c) => (
                <rect key={c}
                  x={rowStartX + 110 + c * 38}
                  y={y + 14} width={32} height={rowH - 28} rx={1}
                  fill={accent}
                  fillOpacity={isNew ? 0.85 : 0.18}
                  className={isNew ? 'sv-fill-byte' : ''}
                  style={isNew ? { animationDelay: `${c * 0.18}s` } : undefined} />
              ))}
              {/* LRU pip on the right */}
              {isLru && (
                <g transform={`translate(${rowStartX + rowW + 14}, ${y + rowH / 2})`}>
                  <circle r={9} fill={accent} fillOpacity="0.85"
                    className="sv-fill-lru-set"
                    style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
                  <L x={20} y={3} text="LRU · evict"
                    color={accent} anchor="start" em={0.6} size={8} />
                </g>
              )}
            </g>
          );
        })}

        <L x={300} y={388}
          text="bytes land left → right · tag stamped first · LRU pushed out"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * FillL2 — one byte (8 bit cells) all written together when WL goes
 * high. This is the bottom of the cache fill — the byte just landed.
 *
 *   WL ──────────────────────────────  (one wordline asserts all 8 cells)
 *      │     │     │     ...
 *      ▼     ▼     ▼
 *    [M0]  [M1]  [M2]  ...   (NMOS_H access transistors)
 *   /     /     /
 *  BL0   BL1   BL2   ...     (one bit-line per bit)
 *      │     │     │
 *    [S0]  [S1]  [S2]  ...   (storage cells — abstract bit boxes)
 */
function FillL2({ accent }) {
  const wlY      = 70;
  const txY      = 140;
  const cellY    = 210;
  const cellH    = 56;
  const blFootY  = 320;
  const numBits  = 8;
  const colW     = 62;
  const margin   = (600 - numBits * colW) / 2;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="One Byte · 8 Cells · WL Asserts All Eight"
          color={accent} em={0.9} size={11} />

        {/* WL */}
        <line x1={margin - 16} y1={wlY} x2={margin + numBits * colW + 16} y2={wlY}
          stroke={accent} strokeWidth="2.4" opacity="0.7" className="sv-fill-wl" />
        <L x={margin - 26} y={wlY + 4} text="WL" color={accent} anchor="end" em={0.95} size={11} />

        {Array.from({ length: numBits }).map((_, i) => {
          const cx = margin + i * colW + colW / 2;
          const blX = cx - 22 * 0.85;
          const cellLeft = cx - 16;
          return (
            <g key={i}>
              {/* WL gate-tap */}
              <Pin x={cx} y={wlY} accent={accent} />
              <line x1={cx} y1={wlY} x2={cx} y2={txY - 26} stroke={accent}
                strokeOpacity="0.85" strokeWidth="1.2" />

              {/* Access transistor */}
              <NMOS_H x={cx} y={txY} accent={accent} scale={0.85} />

              {/* BL on the LEFT — vertical drop to bus footer */}
              <Pin x={blX} y={txY} accent={accent} r={1.8} />
              <line x1={blX} y1={txY} x2={blX} y2={blFootY} stroke={accent}
                strokeOpacity="0.65" strokeWidth="1.1" className="sv-fill-bl"
                style={{ animationDelay: `${i * 0.08}s` }} />
              <L x={blX} y={blFootY + 14} text={`BL${numBits - 1 - i}`}
                color={accent} em={0.55} size={8} />

              {/* Drain → storage cell on the RIGHT */}
              <line x1={cx + 22 * 0.85} y1={txY} x2={cx + 22 * 0.85} y2={cellY}
                stroke={accent} strokeOpacity="0.85" strokeWidth="1.2" />
              <Pin x={cx + 22 * 0.85} y={cellY} accent={accent} r={1.8} />

              {/* Storage-cell box (abstract 1-bit latch); first 4 bits
                  are written 1, last 4 are 0 — visualize the byte
                  pattern landing. */}
              <rect x={cellLeft} y={cellY} width={32} height={cellH} rx="2"
                fill={accent} fillOpacity={i < 4 ? 0.85 : 0.28}
                stroke={accent} strokeOpacity="0.7" strokeWidth="0.9"
                className="sv-fill-cell"
                style={{ animationDelay: `${i * 0.07}s` }} />
              <text x={cx} y={cellY + cellH / 2 + 5} textAnchor="middle"
                fontSize="13" fontFamily={FONT}
                fill={i < 4 ? 'rgba(0,0,0,0.85)' : accent}
                fillOpacity={i < 4 ? 1 : 0.85}>
                {i < 4 ? '1' : '0'}
              </text>

              {/* Bit label below the storage cell */}
              <L x={cx} y={cellY + cellH + 16} text={`b${numBits - 1 - i}`}
                color={accent} em={0.85} size={10} />
            </g>
          );
        })}

        <L x={300} y={388}
          text="WL high → all 8 access gates open → byte writes in parallel"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 6 — RETIRE
// ===================================================================

/**
 * RetireL0 — reorder buffer + register file at retire time.
 *
 * Out-of-order cores execute speculatively, but architectural state
 * only changes IN ORDER, at retire. The ROB is a circular buffer of
 * pending instructions; the retire pointer advances when the head
 * instruction's result is ready and no exceptions are pending. The
 * head's result writes back to its destination register (here x1)
 * and the entry frees up.
 */
function RetireL0({ accent }) {
  const robY    = 80;
  const robH    = 38;
  const robW    = 32;
  const robGap  = 4;
  const robStart = 36;
  const numEntries = 16;
  const headIdx = 4;     // the head of the ROB — about to retire (load)
  const rfY     = 200;
  const rfRows  = 4;
  const rfCols  = 8;
  const rfRowH  = 36;
  const rfColW  = 60;
  const rfStartX = 36;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="In-Order Retire · ROB Head → Architectural Register"
          color={accent} em={0.9} size={11} />

        {/* ROB header */}
        <L x={robStart} y={robY - 14} text="Reorder Buffer · 16 entries"
          color={accent} anchor="start" em={0.85} size={10} />

        {/* ROB entries — each labeled with an instruction. Head entry
            (the load) is highlighted; preceding entries fade because
            they've already retired. */}
        {Array.from({ length: numEntries }).map((_, i) => {
          const x = robStart + i * (robW + robGap);
          const isHead = i === headIdx;
          const retired = i < headIdx;
          const inFlight = i > headIdx;
          const op = ['add','sub','st','xor','ld','mul','sub','and','or','cmp','add','ld','st','sub','xor','add'][i];
          return (
            <g key={i}>
              <rect x={x} y={robY} width={robW} height={robH} rx={2}
                fill={isHead ? accent : 'none'}
                fillOpacity={isHead ? 0.55 : retired ? 0.04 : 0}
                stroke={accent}
                strokeOpacity={isHead ? 1 : retired ? 0.18 : 0.45}
                strokeWidth={isHead ? 1.2 : 0.7}
                className={isHead ? 'sv-retire-rob-load' : ''}
                style={isHead ? { filter: `drop-shadow(0 0 8px ${accent})` } : undefined} />
              <text x={x + robW / 2} y={robY + robH / 2 + 4}
                textAnchor="middle" fontSize="9" fontFamily={FONT}
                fill={isHead ? 'rgba(0,0,0,0.9)' : accent}
                fillOpacity={isHead ? 0.95 : retired ? 0.3 : 0.6}
                letterSpacing="0.12em" style={{ textTransform: 'uppercase' }}>
                {op}
              </text>
              {/* Tiny entry index above */}
              <text x={x + robW / 2} y={robY - 2}
                textAnchor="middle" fontSize="7" fontFamily={FONT}
                fill={accent} fillOpacity={isHead ? 0.85 : 0.4}
                letterSpacing="0.18em">
                {i.toString().padStart(2, '0')}
              </text>
            </g>
          );
        })}

        {/* Retire-pointer — sits at the head, animates a short rightward
            tug each cycle to suggest "advance after this one retires". */}
        <g transform={`translate(${robStart + headIdx * (robW + robGap) + robW / 2}, ${robY + robH + 4})`}
          className="sv-retire-pointer">
          <path d="M 0 0 L -8 12 L 8 12 Z" fill={accent}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />
          <L x={0} y={28} text="retire" color={accent} em={0.85} size={9} />
          <L x={0} y={42} text="head" color={accent} em={0.55} size={8} />
        </g>

        {/* Writeback wire — from the head ROB entry down to x1 in the RF */}
        <line
          x1={robStart + headIdx * (robW + robGap) + robW / 2}
          y1={robY + robH + 22}
          x2={rfStartX + 1 * rfColW + rfColW / 2}
          y2={rfY}
          stroke={accent} strokeWidth="1.4" strokeOpacity="0.85"
          className="sv-retire-wire"
          style={{ filter: `drop-shadow(0 0 4px ${accent})` }} />
        <Pin x={rfStartX + 1 * rfColW + rfColW / 2} y={rfY} accent={accent} r={2} />

        {/* Register file — 32 architectural regs in a 4x8 grid */}
        <L x={rfStartX} y={rfY - 14} text="Architectural Register File · 32 regs"
          color={accent} anchor="start" em={0.85} size={10} />
        <g transform={`translate(${rfStartX}, ${rfY})`}>
          {Array.from({ length: rfRows * rfCols }).map((_, i) => {
            const r = Math.floor(i / rfCols);
            const c = i % rfCols;
            const isX1 = i === 1;
            return (
              <g key={i} transform={`translate(${c * rfColW}, ${r * rfRowH})`}>
                <rect width={rfColW - 4} height={rfRowH - 6} rx={2}
                  fill={isX1 ? accent : accent}
                  fillOpacity={isX1 ? 0.95 : 0.05}
                  stroke={accent}
                  strokeOpacity={isX1 ? 1 : 0.35} strokeWidth="0.9"
                  style={{ filter: isX1 ? `drop-shadow(0 0 12px ${accent})` : 'none' }}
                  className={isX1 ? 'sv-retire-x1' : ''} />
                <text x={(rfColW - 4) / 2} y={rfRowH / 2 - 1}
                  textAnchor="middle" fontSize="11" fontFamily={FONT}
                  fill={isX1 ? 'rgba(0,0,0,0.92)' : accent}
                  fillOpacity={isX1 ? 1 : 0.75}
                  letterSpacing="0.06em">
                  x{i}
                </text>
                {isX1 && (
                  <text x={(rfColW - 4) / 2} y={rfRowH / 2 + 12}
                    textAnchor="middle" fontSize="8" fontFamily={FONT}
                    fill="rgba(0,0,0,0.85)" letterSpacing="0.1em"
                    className="sv-retire-value">
                    0xDEAD…
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <L x={300} y={388}
          text="head retires → x1 ← 0xDEADBEEF · ROB head pointer advances"
          color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

/**
 * RetireL1 — one architectural register's row of 16 bit cells.
 *
 * Same topology as a 6T SRAM cell row, drawn at fewer bits since the
 * teaching is "this is where x1 lives". WL[1] selects this row; the
 * 16 access transistors connect each storage cell to its bit-line.
 */
function RetireL1({ accent }) {
  const wlY     = 70;
  const txY     = 130;
  const cellY   = 200;
  const cellH   = 60;
  const blFootY = 320;
  const numBits = 16;
  const colW    = 33;
  const margin  = (600 - numBits * colW) / 2;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="One Register Row · 16 Bit Cells · WL[1] Selects x1"
          color={accent} em={0.9} size={11} />

        {/* WL[1] */}
        <line x1={margin - 14} y1={wlY} x2={margin + numBits * colW + 14} y2={wlY}
          stroke={accent} strokeWidth="2.4" opacity="0.7" className="sv-retire-wl" />
        <L x={margin - 22} y={wlY + 4} text="WL[1]" color={accent} anchor="end" em={0.9} size={11} />

        {Array.from({ length: numBits }).map((_, i) => {
          const cx = margin + i * colW + colW / 2;
          const scale = 0.6;
          const blX = cx - 22 * scale;
          const cellLeft = cx - 10;
          // x1 = 0xDEADBEEF mod 2^16 = 0xBEEF = 1011_1110_1110_1111
          const bit = ((0xBEEF >> (numBits - 1 - i)) & 1) === 1;
          return (
            <g key={i}>
              <Pin x={cx} y={wlY} accent={accent} r={1.6} />
              <line x1={cx} y1={wlY} x2={cx} y2={txY - 18} stroke={accent}
                strokeOpacity="0.85" strokeWidth="1" />

              <NMOS_H x={cx} y={txY} accent={accent} scale={scale} />

              {/* BL — vertical drop on the LEFT */}
              <line x1={blX} y1={txY} x2={blX} y2={blFootY} stroke={accent}
                strokeOpacity="0.6" strokeWidth="1" className="sv-retire-bl"
                style={{ animationDelay: `${i * 0.04}s` }} />
              <Pin x={blX} y={txY} accent={accent} r={1.4} />

              {/* Drain → storage cell */}
              <line x1={cx + 22 * scale} y1={txY} x2={cx + 22 * scale} y2={cellY} stroke={accent}
                strokeOpacity="0.85" strokeWidth="1" />
              <Pin x={cx + 22 * scale} y={cellY} accent={accent} r={1.4} />

              {/* Storage cell */}
              <rect x={cellLeft} y={cellY} width={20} height={cellH} rx="2"
                fill={accent} fillOpacity={bit ? 0.85 : 0.28}
                stroke={accent} strokeOpacity="0.6" strokeWidth="0.8"
                className="sv-retire-cell"
                style={{ animationDelay: `${i * 0.05}s` }} />
              <text x={cx} y={cellY + cellH / 2 + 4} textAnchor="middle"
                fontSize="10" fontFamily={FONT}
                fill={bit ? 'rgba(0,0,0,0.85)' : accent}
                fillOpacity={bit ? 1 : 0.85}>
                {bit ? '1' : '0'}
              </text>

              <L x={cx} y={blFootY + 12} text={`b${numBits - 1 - i}`}
                color={accent} em={0.55} size={8} />
            </g>
          );
        })}

        <L x={300} y={386}
          text="x1 ← 0xBEEF · 16 bit-lines write in parallel"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

/**
 * RetireL2 — register-file write driver. Same totem-pole CMOS pattern
 * as BusL2 but driving a bitline (BL) into the register cell.
 *
 *   • In · Data fans out to both gates.
 *   • PMOS pulls Out high (to VDD) when In = 0.
 *   • NMOS pulls Out low (to GND) when In = 1.
 *   • Out drives BL into the register cell that holds x1's bit.
 *
 * Identical CMOS physics as BusL2 — different role, same circuit.
 */
function RetireL2({ accent }) {
  const vddY = 60;
  const gndY = 340;
  const fetX = 300;
  const pY   = 130;
  const nY   = 270;
  const outY = 200;
  const inX  = 100;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={26}
          text="Register-File Write Driver · CMOS Totem-Pole"
          color={accent} em={0.9} size={11} />

        {/* VDD / GND rails */}
        <line x1={60} y1={vddY} x2={540} y2={vddY} stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.6" />
        <L x={66} y={vddY - 6} text="VDD" color={accent} anchor="start" em={0.75} size={10} />
        <line x1={60} y1={gndY} x2={540} y2={gndY} stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.6" />
        <L x={66} y={gndY + 16} text="GND" color={accent} anchor="start" em={0.75} size={10} />

        {/* PMOS pull-up */}
        <PMOS x={fetX} y={pY} accent={accent} scale={1.4} />
        <L x={fetX + 40} y={pY - 4} text="PMOS · pull-up" color={accent} anchor="start" em={0.75} size={9} />
        <line x1={fetX} y1={vddY} x2={fetX} y2={pY - 31} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={vddY} accent={accent} />
        <Pin x={fetX} y={pY - 31} accent={accent} r={1.8} />
        <line x1={fetX} y1={pY + 31} x2={fetX} y2={outY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={pY + 31} accent={accent} r={1.8} />

        {/* NMOS pull-down */}
        <NMOS x={fetX} y={nY} accent={accent} scale={1.4} />
        <L x={fetX + 40} y={nY + 8} text="NMOS · pull-down" color={accent} anchor="start" em={0.75} size={9} />
        <line x1={fetX} y1={outY} x2={fetX} y2={nY - 31} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={nY - 31} accent={accent} r={1.8} />
        <line x1={fetX} y1={nY + 31} x2={fetX} y2={gndY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" />
        <Pin x={fetX} y={gndY} accent={accent} />
        <Pin x={fetX} y={nY + 31} accent={accent} r={1.8} />

        {/* Out node */}
        <Pin x={fetX} y={outY} accent={accent} r={3} />

        {/* In · Data → fans up + down to both gates */}
        <L x={inX - 10} y={outY + 4} text="In · Data" color={accent} anchor="end" em={0.95} size={11} />
        <line x1={inX} y1={outY} x2={fetX - 42} y2={outY} stroke={accent}
          strokeOpacity="0.85" strokeWidth="1.4" className="sv-retire-data" />
        <Pin x={inX} y={outY} accent={accent} />
        <line x1={fetX - 42} y1={pY} x2={fetX - 42} y2={nY} stroke={accent}
          strokeOpacity="0.7" strokeWidth="1.2" />
        <Pin x={fetX - 42} y={outY} accent={accent} r={2} />
        <Pin x={fetX - 42} y={pY} accent={accent} r={2} />
        <Pin x={fetX - 42} y={nY} accent={accent} r={2} />

        {/* Out wire — drives BL */}
        <line x1={fetX} y1={outY} x2={540} y2={outY} stroke={accent}
          strokeWidth="1.6" opacity="0.85" className="sv-retire-out" />
        <Pin x={540} y={outY} accent={accent} />
        <L x={550} y={outY - 6} text="Out → BL" color={accent} anchor="end" em={0.95} size={11} />

        {/* Animated current — flows from FET column out to BL */}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill={accent}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
            <animate attributeName="cx" from={fetX} to={540}
              dur="3.2s" repeatCount="indefinite"
              begin={`${i * 1.05}s`} />
            <animate attributeName="cy" values={`${outY};${outY};${outY}`}
              dur="3.2s" repeatCount="indefinite"
              begin={`${i * 1.05}s`} />
            <animate attributeName="opacity"
              values="0;1;1;0" keyTimes="0;0.15;0.85;1"
              dur="3.2s" repeatCount="indefinite"
              begin={`${i * 1.05}s`} />
          </circle>
        ))}
      </svg>
    </Host>
  );
}

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

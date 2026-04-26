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

function NMOS({ x, y, accent, scale = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <line x1="-22" y1="0" x2="-8" y2="0" stroke={accent} strokeOpacity="0.7" strokeWidth="1.4" />
      <line x1="-8" y1="-14" x2="-8" y2="14" stroke={accent} strokeOpacity="0.7" strokeWidth="1.4" />
      <line x1="-8" y1="-12" x2="6" y2="-22" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
      <line x1="-8" y1="12" x2="6" y2="22" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
      <path d="M -3 -3 L 4 0 L -3 3 Z" fill={accent} opacity="0.65" />
    </g>
  );
}

function PMOS({ x, y, accent, scale = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <line x1="-22" y1="0" x2="-12" y2="0" stroke={accent} strokeOpacity="0.7" strokeWidth="1.4" />
      <circle cx="-10" cy="0" r="2.5" fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1" />
      <line x1="-8" y1="-14" x2="-8" y2="14" stroke={accent} strokeOpacity="0.7" strokeWidth="1.4" />
      <line x1="-8" y1="-12" x2="6" y2="-22" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
      <line x1="-8" y1="12" x2="6" y2="22" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
    </g>
  );
}

function Inverter({ x, y, w = 28, accent, rotate = 0 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate})`}>
      <path d={`M 0 -${w / 2} L ${w} 0 L 0 ${w / 2} Z`} fill="none"
        stroke={accent} strokeOpacity="0.7" strokeWidth="1.3" />
      <circle cx={w + 4} cy="0" r="3" fill="none" stroke={accent}
        strokeOpacity="0.7" strokeWidth="1.1" />
    </g>
  );
}

function NAND({ x, y, accent, w = 30 }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d={`M 0 -${w/2} L ${w*0.5} -${w/2} A ${w/2} ${w/2} 0 0 1 ${w*0.5} ${w/2} L 0 ${w/2} Z`}
        fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="1.2" />
      <circle cx={w + 4} cy="0" r="3" fill="none" stroke={accent}
        strokeOpacity="0.7" strokeWidth="1.1" />
    </g>
  );
}

// ===================================================================
// Stage 0 — PIPELINE
// ===================================================================

function PipelineL0({ accent }) {
  const stages = ['FETCH', 'DECODE', 'RENAME', 'ISSUE', 'EXECUTE'];
  const colW = 110;
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={14} y={22} text="CLK" color={accent} anchor="start" em={0.55} size={10} />
        <path
          d="M 30 30 L 80 30 L 80 14 L 140 14 L 140 30 L 200 30 L 200 14 L 260 14 L 260 30 L 320 30 L 320 14 L 380 14 L 380 30 L 440 30 L 440 14 L 500 14 L 500 30 L 570 30"
          stroke={accent} strokeWidth="1.6" fill="none" opacity="0.65" />

        {stages.map((label, i) => {
          const x = 30 + i * colW;
          return (
            <g key={label} transform={`translate(${x}, 70)`}>
              <rect width="90" height="240" rx="4" fill="none"
                stroke={accent} strokeOpacity="0.4" strokeWidth="1" />
              <L x={45} y={-8} text={label} color={accent} em={0.85} size={10} />
              {[0, 1, 2, 3].map((j) => (
                <rect key={j} x="14" y={20 + j * 50} width="62" height="32"
                  rx="2" fill={accent} fillOpacity="0.15"
                  stroke={accent} strokeOpacity="0.4" strokeWidth="0.7"
                  className="sv-pipe-latch"
                  style={{ animationDelay: `${i * 0.48}s` }} />
              ))}
              {i < stages.length - 1 && (
                <g className={`sv-pipe-bus sv-pipe-bus-${i}`}>
                  {[0, 1, 2, 3].map((j) => (
                    <line key={j} x1="90" y1={36 + j * 50} x2={colW + 14}
                      y2={36 + j * 50} stroke={accent}
                      strokeOpacity="0.55" strokeWidth="0.9" />
                  ))}
                </g>
              )}
            </g>
          );
        })}

        <circle r="6" cy="190" fill={accent}
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}>
          <animate attributeName="cx"
            values="74;184;294;404;514;514"
            keyTimes="0;0.20;0.40;0.60;0.80;1"
            dur="2.4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </Host>
  );
}

function PipelineL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={40} y={32} text="Reservation Stations" color={accent} anchor="start" em={0.85} size={11} />
        <L x={420} y={32} text="Wakeup Matrix" color={accent} anchor="start" em={0.85} size={11} />

        <g transform="translate(40, 50)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} transform={`translate(0, ${i * 40})`}
              className="sv-pipe-rs"
              style={{ animationDelay: `${i * 0.18}s` }}>
              <rect width="280" height="32" rx="2" fill="none"
                stroke={accent} strokeOpacity="0.5" strokeWidth="0.9" />
              <circle cx="40" cy="16" r="6" fill={accent}
                fillOpacity="0.85" />
              <circle cx="80" cy="16" r="6" fill={accent}
                fillOpacity={i < 3 ? 0.85 : 0.2} />
              <rect x="120" y="10" width="100" height="12"
                fill={accent} fillOpacity="0.3" />
              <line x1="280" y1="16" x2="320" y2="16"
                stroke={accent} strokeWidth="1" strokeOpacity="0.6" />
              <circle cx="320" cy="16" r="3" fill={accent} />
            </g>
          ))}
        </g>
        {/* Operand-ready / op-encoding leader labels on top RS */}
        <LL px={80} py={66} lx={82} ly={300} text="Op-A · Op-B Ready" color={accent} anchor="start" />
        <LL px={170} py={66} lx={170} ly={320} text="opcode encoding" color={accent} anchor="start" />

        <g transform="translate(420, 50)">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 6 }).map((_, c) => (
              <circle key={`${r}-${c}`} cx={c * 22} cy={r * 38} r="3"
                fill={accent} className={`sv-pipe-wakeup sv-pipe-wakeup-${c}`}
                style={{ animationDelay: `${c * 0.15}s` }} />
            )),
          )}
        </g>

        <path d="M 360 250 L 380 270 L 360 290 Z" fill={accent}
          className="sv-pipe-issue-arrow" />
        <L x={400} y={282} text="Issue →" color={accent} anchor="start" em={0.7} size={9} />
      </svg>
    </Host>
  );
}

function PipelineL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={20} y={195} text="D" color={accent} anchor="start" em={0.6} size={11} />
        <line x1="30" y1="200" x2="100" y2="200" stroke={accent}
          strokeWidth="1.4" opacity="0.6" />
        <path d="M 30 215 L 50 215 L 50 195 L 70 195 L 70 215 L 90 215"
          stroke={accent} strokeWidth="1.2" fill="none" opacity="0.7" />

        <g transform="translate(140, 120)">
          <NAND x={0} y={0} accent={accent} w={36} />
          <NAND x={0} y={140} accent={accent} w={36} />
          <NAND x={70} y={20} accent={accent} w={36} />
          <NAND x={70} y={60} accent={accent} w={36} />
          <line x1="110" y1="20" x2="120" y2="20" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <line x1="120" y1="20" x2="120" y2="60" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <line x1="120" y1="60" x2="0" y2="60" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <line x1="110" y1="60" x2="-10" y2="60" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
        </g>
        <L x={195} y={108} text="Master Latch" color={accent} em={0.75} size={10} />

        <g transform="translate(360, 120)">
          <NAND x={0} y={0} accent={accent} w={36} />
          <NAND x={0} y={80} accent={accent} w={36} />
          <NAND x={70} y={20} accent={accent} w={36} />
          <NAND x={70} y={60} accent={accent} w={36} />
          <line x1="110" y1="20" x2="120" y2="20" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
          <line x1="120" y1="20" x2="120" y2="60" stroke={accent} strokeOpacity="0.55" strokeWidth="0.9" />
        </g>
        <L x={415} y={108} text="Slave Latch" color={accent} em={0.75} size={10} />

        <line x1="260" y1="140" x2="360" y2="140" stroke={accent}
          strokeWidth="1.2" className="sv-pipe-master-out" />

        <line x1="480" y1="140" x2="560" y2="140" stroke={accent}
          strokeWidth="1.4" className="sv-pipe-q" />
        <circle cx="560" cy="140" r="4" fill={accent}
          className="sv-pipe-q-dot" />
        <L x={555} y={128} text="Q" color={accent} anchor="end" em={0.85} size={11} />

        <line x1="100" y1="200" x2="200" y2="200" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" />
        <line x1="200" y1="200" x2="200" y2="160" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" className="sv-pipe-clk-master" />
        <line x1="200" y1="200" x2="420" y2="200" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" />
        <line x1="420" y1="200" x2="420" y2="160" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" className="sv-pipe-clk-slave" />
        <L x={310} y={216} text="CLK" color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 1 — L1/L2 SRAM
// ===================================================================

function SramL0({ accent }) {
  const ways = 4;
  const sets = 8;
  const tagW = 70;
  const dataW = 190;
  const xOff = 60;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 700 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={60} y={14} text="L1 D-Cache · 4-Way · 32 KB" color={accent} anchor="start" em={0.85} size={11} />
        <L x={60 + 4 * 70 + 24, x => x} y={14} text="Data Lines" color={accent} anchor="start" em={0.65} size={10} />
        <L x={64} y={343} text="L2 · 256 KB" color={accent} anchor="start" em={0.7} size={10} />

        {Array.from({ length: sets }).map((_, s) => {
          const y = 24 + s * 38;
          const isLitSet = s === 3;
          return (
            <g key={s} transform={`translate(${xOff}, ${y})`}>
              <rect x="-12" y="-2" width={tagW * ways + dataW + 60} height="32"
                rx="2"
                fill={isLitSet ? accent : 'transparent'}
                fillOpacity={isLitSet ? 0.06 : 0}
                stroke={isLitSet ? accent : 'rgba(255,255,255,0.06)'}
                strokeOpacity={isLitSet ? 0.55 : 1}
                strokeWidth="0.6"
                className={isLitSet ? 'sv-sram-set' : ''} />
              {Array.from({ length: ways }).map((_, w) => (
                <g key={w} transform={`translate(${w * tagW}, 0)`}>
                  <rect width={tagW - 6} height="28" rx="1" fill="none"
                    stroke={accent} strokeOpacity={isLitSet ? 0.5 : 0.18}
                    strokeWidth="0.6" />
                </g>
              ))}
              {isLitSet && Array.from({ length: ways }).map((_, w) => (
                <g key={w} transform={`translate(${w * tagW + 16}, 14)`}>
                  <path d="M 0 -8 L 8 0 L 0 8 L -8 0 Z" fill={accent}
                    className="sv-sram-cmp"
                    style={{ animationDelay: `${w * 0.12}s` }} />
                  <circle r="9" fill="none" stroke={accent}
                    strokeOpacity="0.9" strokeWidth="1"
                    className="sv-sram-miss"
                    style={{ animationDelay: `${0.4 + w * 0.12}s` }} />
                </g>
              ))}
              {Array.from({ length: ways }).map((_, w) => (
                <rect key={w}
                  x={ways * tagW + w * 24}
                  y="0"
                  width="20"
                  height="28"
                  rx="1"
                  fill={accent} fillOpacity={isLitSet ? 0.22 : 0.06} />
              ))}
            </g>
          );
        })}
        {/* "TAG ARRAY" annotation under the cache */}
        <L x={60 + (4 * 70) / 2} y={328} text="Tag Array" color={accent} em={0.6} size={9} />
        <L x={60 + 4 * 70 + 48} y={328} text="Data Array" color={accent} em={0.6} size={9} anchor="start" />

        {/* Selector chevron pointing at lit set */}
        <g transform="translate(20, 130)">
          <path d="M 0 16 L 24 8 L 24 24 Z" fill={accent} className="sv-sram-chev" />
          <L x={28} y={20} text="Set 11" color={accent} anchor="start" em={0.85} size={10} />
        </g>

        {/* Forward arrow */}
        <g transform="translate(280, 348)">
          <path d="M 0 0 L 0 36 L -10 26 M 0 36 L 10 26"
            stroke={accent} strokeWidth="1.6" fill="none"
            className="sv-sram-fwd-arrow" />
          <L x={16} y={28} text="miss → L2" color={accent} anchor="start" em={0.85} size={10} />
        </g>

        <g transform="translate(120, 350)" opacity="0.4">
          <rect width="450" height="36" rx="2" fill="none"
            stroke={accent} strokeOpacity="0.45" strokeWidth="0.8" />
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x={6 + i * 28} y="6" width="22" height="24"
              fill={accent} fillOpacity="0.10" />
          ))}
        </g>
      </svg>
    </div>
  );
}

function SramL1({ accent }) {
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <line x1="40" y1="60" x2="560" y2="60" stroke={accent}
          strokeWidth="2.5" className="sv-sram-wl" opacity="0.55" />
        <L x={26} y={56} text="WL" color={accent} anchor="end" em={0.85} size={11} />

        <line x1="160" y1="60" x2="160" y2="370" stroke={accent}
          strokeWidth="1.8" className="sv-sram-bl" opacity="0.55" />
        <L x={160} y={388} text="BL" color={accent} em={0.85} size={11} />

        <line x1="440" y1="60" x2="440" y2="370" stroke={accent}
          strokeWidth="1.8" className="sv-sram-blb" opacity="0.55" />
        <L x={440} y={388} text="BL̄" color={accent} em={0.85} size={11} />

        <NMOS x={160} y={60} accent={accent} />
        <L x={130} y={92} text="M5" color={accent} anchor="end" em={0.7} size={9} />

        <NMOS x={440} y={60} accent={accent} />
        <L x={470} y={92} text="M6" color={accent} anchor="start" em={0.7} size={9} />

        <circle cx="220" cy="200" r="6" fill={accent} className="sv-sram-q" />
        <L x={210} y={195} text="Q" color={accent} anchor="end" em={0.9} size={11} />

        <circle cx="380" cy="200" r="6" fill={accent} opacity="0.45" />
        <L x={395} y={195} text="Q̄" color={accent} anchor="start" em={0.9} size={11} />

        <Inverter x={285} y={200} w={32} accent={accent} />
        <Inverter x={315} y={280} w={32} accent={accent} rotate={180} />

        <line x1="220" y1="206" x2="220" y2="280" stroke={accent}
          strokeOpacity="0.45" strokeWidth="1" />
        <line x1="380" y1="280" x2="380" y2="206" stroke={accent}
          strokeOpacity="0.45" strokeWidth="1" />
        <line x1="280" y1="200" x2="220" y2="200" stroke={accent}
          strokeOpacity="0.55" strokeWidth="0.9" />
        <line x1="322" y1="200" x2="380" y2="200" stroke={accent}
          strokeOpacity="0.55" strokeWidth="0.9" />
        <line x1="312" y1="280" x2="380" y2="280" stroke={accent}
          strokeOpacity="0.55" strokeWidth="0.9" />
        <line x1="220" y1="280" x2="280" y2="280" stroke={accent}
          strokeOpacity="0.55" strokeWidth="0.9" />

        <line x1="200" y1="148" x2="400" y2="148" stroke={accent}
          strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
        <L x={205} y={144} text="VDD" color={accent} anchor="start" em={0.55} size={9} />
        <line x1="200" y1="332" x2="400" y2="332" stroke={accent}
          strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3 3" />
        <L x={205} y={328} text="GND" color={accent} anchor="start" em={0.55} size={9} />

        <circle cx="220" cy="200" r="14" fill="none" stroke={accent}
          strokeOpacity="0.45" strokeWidth="0.8" className="sv-sram-q-pulse" />
      </svg>
    </div>
  );
}

function SramL2({ accent }) {
  const cols = 22, rows = 7, stepX = 28, stepY = 28;
  const ox = 32, oy = 220;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 700 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <rect x="220" y="80" width="260" height="44" rx="2"
          fill={accent} opacity="0.45" className="sv-trans-gate" />
        <L x={350} y={106} text="Gate (Poly)" color="rgba(0,0,0,0.85)" em={0.95} size={11} />
        <rect x="220" y="124" width="260" height="6" fill={accent} opacity="0.7" />
        <LL px={460} py={127} lx={520} ly={150} text="SiO₂ Oxide" color={accent} anchor="start" />

        <line x1="40" y1="50" x2="660" y2="50" stroke={accent}
          strokeWidth="2.2" className="sv-sram-wl" opacity="0.6" />
        <L x={48} y={42} text="WL · VDD" color={accent} anchor="start" em={0.7} size={10} />
        <line x1="350" y1="50" x2="350" y2="80" stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.2" />

        {Array.from({ length: rows }).map((_, ry) =>
          Array.from({ length: cols }).map((_, cx) => {
            const x = ox + cx * stepX;
            const y = oy + ry * stepY;
            const inSource = cx < 6;
            const inDrain = cx >= cols - 6;
            return (
              <g key={`${ry}-${cx}`}>
                <circle cx={x} cy={y} r={inSource || inDrain ? 3 : 2}
                  fill={accent}
                  fillOpacity={inSource || inDrain ? 0.55 : 0.18} />
                {cx < cols - 1 && (
                  <line x1={x + 2} y1={y} x2={x + stepX - 2} y2={y}
                    stroke={accent} strokeOpacity="0.10" strokeWidth="0.5" />
                )}
                {ry < rows - 1 && (
                  <line x1={x} y1={y + 2} x2={x} y2={y + stepY - 2}
                    stroke={accent} strokeOpacity="0.10" strokeWidth="0.5" />
                )}
              </g>
            );
          }),
        )}

        <g className="sv-trans-channel">
          <rect x={ox + 6 * stepX - 4} y={oy - 18}
            width={(cols - 12) * stepX + 8} height="14"
            fill={accent} opacity="0.22" rx="2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} r="3" cy={oy - 11} fill={accent}
              className="sv-trans-elec"
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
              <animate attributeName="cx"
                from={ox + 6 * stepX} to={ox + (cols - 6) * stepX}
                dur="1.8s" repeatCount="indefinite"
                begin={`${i * 0.22}s`} />
            </circle>
          ))}
        </g>
        <L x={350} y={oy + (rows - 0.5) * stepY + 8} text="p-Substrate (Si Bulk)" color={accent} em={0.65} size={10} />

        <rect x={ox - 4} y={oy - 4} width={6 * stepX + 4} height={(rows - 1) * stepY + 8}
          fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="1.2" rx="3" />
        <L x={ox + 3 * stepX} y={oy - 12} text="n⁺ Source" color={accent} em={0.85} size={10} />

        <rect x={ox + (cols - 6) * stepX - 4} y={oy - 4}
          width={6 * stepX + 4} height={(rows - 1) * stepY + 8}
          fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="1.2" rx="3" />
        <L x={ox + (cols - 3) * stepX} y={oy - 12} text="n⁺ Drain" color={accent} em={0.85} size={10} />

        <L x={350} y={oy - 26} text="Inversion Channel" color={accent} em={0.7} size={9} />
      </svg>
    </div>
  );
}

// ===================================================================
// Stage 2 — RING BUS
// ===================================================================

function BusL0({ accent }) {
  // Ring topology — four cores arranged around an inner ring track.
  // Each core has a stop; the request rides the ring clockwise from
  // C0 (issuer) through one stop to the L3 slice on the opposite side.
  // Spokes show the data bus (D7..D0) feeding into each core.
  const stops = [
    { id: 'C0', cx: 80,  cy: 200, label: 'Core 0',   role: 'issuer' },
    { id: 'C1', cx: 300, cy: 80,  label: 'Core 1' },
    { id: 'C2', cx: 520, cy: 200, label: 'L3 Slice', role: 'target' },
    { id: 'C3', cx: 300, cy: 320, label: 'Core 3' },
  ];
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Ring Interconnect · 4 Stops · Bidirectional" color={accent} em={0.85} size={11} />

        {/* Ring track — outer + inner rails + clockwise direction arrow */}
        <ellipse cx="300" cy="200" rx="200" ry="110" fill="none"
          stroke={accent} strokeOpacity="0.22" strokeWidth="1.4" />
        <ellipse cx="300" cy="200" rx="186" ry="96" fill="none"
          stroke={accent} strokeOpacity="0.14" strokeWidth="0.8"
          strokeDasharray="3 4" />

        {/* Animated packet — rides the ring clockwise from C0 to C2 */}
        <circle r="5" fill={accent}
          style={{ filter: `drop-shadow(0 0 8px ${accent})` }}>
          <animateMotion dur="3.2s" repeatCount="indefinite"
            path="M 100 200 A 200 110 0 0 1 500 200" />
        </circle>
        {/* Trailing decay packets so the ring reads as continuous traffic */}
        {[0.6, 1.4, 2.2].map((delay, i) => (
          <circle key={i} r="3" fill={accent} fillOpacity="0.55">
            <animateMotion dur="3.2s" repeatCount="indefinite"
              begin={`${delay}s`}
              path="M 100 200 A 200 110 0 0 1 500 200" />
          </circle>
        ))}

        {/* Stops */}
        {stops.map((s) => {
          const isCore = s.role === 'issuer';
          const isTgt  = s.role === 'target';
          const r = isCore || isTgt ? 22 : 18;
          return (
            <g key={s.id}>
              <circle cx={s.cx} cy={s.cy} r={r + 6} fill={accent} fillOpacity="0.06" />
              <circle cx={s.cx} cy={s.cy} r={r} fill={accent}
                fillOpacity={isCore ? 0.55 : isTgt ? 0.45 : 0.18}
                stroke={accent}
                strokeOpacity={isCore || isTgt ? 0.95 : 0.45}
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

        {/* "From" / "to" arrowed notation under issuer + target */}
        <L x={80} y={278} text="↑ issue" color={accent} em={0.7} size={9} />
        <L x={520} y={278} text="↓ recv" color={accent} em={0.7} size={9} />

        <L x={300} y={388}
          text="64-Byte Packet · 1 Hop / Cycle · 2 Hops to L3"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

function BusL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={50} y={32} text="Voltage on a Single Wire" color={accent} anchor="start" em={0.85} size={11} />
        {/* Voltage axis + ticks */}
        <line x1="50" y1="50" x2="50" y2="350" stroke={accent}
          strokeOpacity="0.45" strokeWidth="1" />
        <line x1="50" y1="350" x2="560" y2="350" stroke={accent}
          strokeOpacity="0.45" strokeWidth="1" />
        <L x={42} y={104} text="VDD" color={accent} anchor="end" em={0.6} size={9} />
        <L x={42} y={324} text="0 V" color={accent} anchor="end" em={0.6} size={9} />
        <L x={555} y={368} text="t" color={accent} anchor="end" em={0.7} size={11} />

        <line x1="50" y1="100" x2="560" y2="100" stroke={accent}
          strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="3 3" />
        <line x1="50" y1="320" x2="560" y2="320" stroke={accent}
          strokeOpacity="0.18" strokeWidth="0.6" strokeDasharray="3 3" />

        <path
          d="M 60 320 L 130 320 L 180 100 L 280 100 L 330 320 L 430 320 L 480 100 L 540 100"
          stroke={accent} strokeWidth="2.4" fill="none"
          className="sv-bus-trace"
          style={{ filter: `drop-shadow(0 0 6px ${accent})` }} />

        <line x1="0" y1="50" x2="0" y2="350" stroke={accent}
          strokeOpacity="0.75" strokeWidth="1" className="sv-bus-cursor" />
      </svg>
    </Host>
  );
}

function BusL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="CMOS Inverter Driver" color={accent} em={0.85} size={11} />

        <line x1="60" y1="40" x2="540" y2="40" stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.6" />
        <L x={64} y={32} text="VDD" color={accent} anchor="start" em={0.7} size={10} />
        <line x1="60" y1="360" x2="540" y2="360" stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.6" />
        <L x={64} y={376} text="GND" color={accent} anchor="start" em={0.7} size={10} />

        <g transform="translate(180, 0)">
          <PMOS x={0} y={120} accent={accent} scale={1.4} />
          <L x={20} y={88} text="PMOS" color={accent} anchor="start" em={0.7} size={9} />
          <NMOS x={0} y={260} accent={accent} scale={1.4} />
          <L x={20} y={296} text="NMOS" color={accent} anchor="start" em={0.7} size={9} />
          <line x1="0" y1="78" x2="0" y2="40" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.4" />
          <line x1="0" y1="150" x2="0" y2="232" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.4" />
          <line x1="0" y1="290" x2="0" y2="360" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.4" />
          <line x1="-80" y1="120" x2="-22" y2="120" stroke={accent}
            strokeOpacity="0.6" strokeWidth="1" />
          <line x1="-80" y1="260" x2="-22" y2="260" stroke={accent}
            strokeOpacity="0.6" strokeWidth="1" />
          <line x1="-80" y1="120" x2="-80" y2="260" stroke={accent}
            strokeOpacity="0.6" strokeWidth="1" />
        </g>
        <L x={94} y={196} text="In" color={accent} anchor="end" em={0.85} size={11} />

        <line x1="180" y1="190" x2="540" y2="190" stroke={accent}
          strokeWidth="1.6" className="sv-bus-out" />
        <L x={550} y={186} text="Out" color={accent} anchor="end" em={0.85} size={11} />

        <g transform="translate(440, 190)">
          <line x1="0" y1="0" x2="0" y2="40" stroke={accent}
            strokeOpacity="0.55" strokeWidth="1" />
          <line x1="-12" y1="42" x2="12" y2="42" stroke={accent}
            strokeOpacity="0.65" strokeWidth="2" />
          <line x1="-10" y1="48" x2="10" y2="48" stroke={accent}
            strokeOpacity="0.65" strokeWidth="2" />
          <line x1="0" y1="48" x2="0" y2="68" stroke={accent}
            strokeOpacity="0.4" strokeWidth="0.8" />
          <L x={20} y={48} text="C_load" color={accent} anchor="start" em={0.7} size={9} />
        </g>

        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill={accent}
            className="sv-bus-charge"
            style={{ filter: `drop-shadow(0 0 4px ${accent})` }}>
            <animate attributeName="cx" from="180" to="440"
              dur="1.4s" repeatCount="indefinite"
              begin={`${i * 0.45}s`} />
            <animate attributeName="cy" values="190;190;190"
              dur="1.4s" repeatCount="indefinite"
              begin={`${i * 0.45}s`} />
          </circle>
        ))}
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 3 — DRAM
// ===================================================================

function DramL0({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <rect x="40" y="30" width="120" height="60" rx="3" fill={accent}
          fillOpacity="0.15" stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
        <L x={100} y={56} text="Mem" color={accent} em={0.85} size={11} />
        <L x={100} y={72} text="Ctrl" color={accent} em={0.85} size={11} />
        <circle cx="100" cy="60" r="14" fill="none" stroke={accent}
          strokeOpacity="0.7" strokeWidth="1.2" className="sv-dram-ctrl-pulse" />

        <line x1="160" y1="60" x2="280" y2="60" stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.2" className="sv-dram-addr-bus" />
        <L x={220} y={52} text="addr / cmd" color={accent} em={0.55} size={9} />

        <g transform="translate(280, 30)">
          {Array.from({ length: 12 }).map((_, r) =>
            Array.from({ length: 14 }).map((_, c) => (
              <rect key={`${r}-${c}`} x={c * 20} y={r * 20}
                width="14" height="14" fill={accent}
                fillOpacity="0.18" />
            )),
          )}
          <rect x="-4" y="78" width="284" height="14" fill={accent}
            opacity="0" className="sv-dram-row" />
          <rect x="158" y="-4" width="14" height="248" fill={accent}
            opacity="0" className="sv-dram-col" />
        </g>
        <L x={420} y={22} text="DRAM Array" color={accent} em={0.85} size={11} />
        <L x={420} y={106} text="RAS · activate row" color={accent} em={0.6} size={9} />
        <L x={448} y={300} text="CAS · column" color={accent} em={0.6} size={9} />

        <g transform="translate(280, 290)">
          {Array.from({ length: 14 }).map((_, c) => (
            <path key={c} d={`M ${c * 20} 0 L ${c * 20 + 14} 0 L ${c * 20 + 7} 16 Z`}
              fill="none" stroke={accent} strokeOpacity="0.5" strokeWidth="0.8" />
          ))}
          <rect x="0" y="0" width="280" height="16" fill={accent}
            className="sv-dram-sense" opacity="0" />
        </g>
        <L x={420} y={332} text="Sense Amplifiers" color={accent} em={0.7} size={10} />

        <line x1="420" y1="320" x2="420" y2="370" stroke={accent}
          strokeWidth="1.4" className="sv-dram-out-line" />
        <L x={428} y={372} text="data out" color={accent} anchor="start" em={0.55} size={9} />
      </svg>
    </Host>
  );
}

function DramL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="1T1C Cell · One Transistor + One Capacitor" color={accent} em={0.85} size={11} />

        <line x1="40" y1="100" x2="560" y2="100" stroke={accent}
          strokeWidth="2.2" className="sv-dram-wl" opacity="0.55" />
        <L x={28} y={96} text="WL" color={accent} anchor="end" em={0.85} size={11} />

        <line x1="300" y1="100" x2="300" y2="370" stroke={accent}
          strokeWidth="1.8" className="sv-dram-bl" opacity="0.55" />
        <L x={300} y={388} text="BL" color={accent} em={0.85} size={11} />

        <NMOS x={300} y={100} accent={accent} scale={1.5} />
        <L x={332} y={108} text="M1 · Access" color={accent} anchor="start" em={0.7} size={9} />

        <line x1="300" y1="155" x2="300" y2="220" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.4" />
        <line x1="270" y1="222" x2="330" y2="222" stroke={accent}
          strokeOpacity="0.75" strokeWidth="3" />
        <line x1="276" y1="230" x2="324" y2="230" stroke={accent}
          strokeOpacity="0.75" strokeWidth="3" />
        <L x={344} y={228} text="Cs (Storage Cap)" color={accent} anchor="start" em={0.75} size={10} />
        <line x1="300" y1="230" x2="300" y2="270" stroke={accent}
          strokeOpacity="0.5" strokeWidth="1" />
        <line x1="280" y1="272" x2="320" y2="272" stroke={accent}
          strokeOpacity="0.5" strokeWidth="1" />
        <line x1="288" y1="278" x2="312" y2="278" stroke={accent}
          strokeOpacity="0.5" strokeWidth="1" />
        <L x={300} y={296} text="GND" color={accent} em={0.55} size={9} />

        <g className="sv-dram-charge-cloud">
          {[-8, 0, 8].map((dx, i) => (
            <circle key={i} cx={300 + dx} r="3" fill={accent}
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
              <animate attributeName="cy"
                values="220;220;130;130" keyTimes="0;0.3;0.7;1"
                dur="2.4s" repeatCount="indefinite"
                begin={`${i * 0.1}s`} />
              <animate attributeName="opacity"
                values="0;1;1;0" keyTimes="0;0.3;0.7;1"
                dur="2.4s" repeatCount="indefinite"
                begin={`${i * 0.1}s`} />
            </circle>
          ))}
        </g>
        <L x={206} y={180} text="Charge ↑" color={accent} anchor="end" em={0.6} size={9} />
      </svg>
    </Host>
  );
}

function DramL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Capacitor Plates · Stored Charge" color={accent} em={0.85} size={11} />

        <rect x="120" y="100" width="360" height="22" rx="2" fill={accent}
          opacity="0.55" />
        <L x={300} y={94} text="Top Plate (BL)" color={accent} em={0.7} size={10} />
        <rect x="120" y="278" width="360" height="22" rx="2" fill={accent}
          opacity="0.55" />
        <L x={300} y={324} text="Bottom Plate (GND)" color={accent} em={0.7} size={10} />

        <rect x="120" y="126" width="360" height="148" fill={accent}
          opacity="0.08" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={150 + i * 45} y1="126" x2={150 + i * 45} y2="274"
            stroke={accent} strokeOpacity="0.12" strokeWidth="0.6" />
        ))}
        <L x={494} y={204} text="Dielectric" color={accent} anchor="start" em={0.6} size={9} />

        <g>
          {Array.from({ length: 18 }).map((_, i) => (
            <circle key={i} cx={140 + (i % 9) * 38} cy={262 + Math.floor(i / 9) * 8}
              r="3.5" fill={accent}
              style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
              className="sv-cap-charge"
              opacity={0.85} />
          ))}
        </g>

        {Array.from({ length: 6 }).map((_, i) => (
          <circle key={i} cx={180 + i * 60} r="3" fill={accent}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            className="sv-cap-discharge"
            opacity="0">
            <animate attributeName="cy"
              values="270;270;120;120" keyTimes="0;0.4;0.85;1"
              dur="3s" repeatCount="indefinite"
              begin={`${i * 0.1}s`} />
            <animate attributeName="opacity"
              values="0;1;1;0" keyTimes="0;0.4;0.85;1"
              dur="3s" repeatCount="indefinite"
              begin={`${i * 0.1}s`} />
          </circle>
        ))}

        <line x1="300" y1="40" x2="300" y2="100" stroke={accent}
          strokeWidth="1.4" opacity="0.7" />
        <line x1="300" y1="300" x2="300" y2="360" stroke={accent}
          strokeWidth="1.4" opacity="0.7" />
        <line x1="280" y1="362" x2="320" y2="362" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" />
        <line x1="288" y1="368" x2="312" y2="368" stroke={accent}
          strokeOpacity="0.5" strokeWidth="0.9" />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 4 — COHERENCE
// ===================================================================

function CoherenceL0({ accent }) {
  // Per-core L1 detail: each core shows two L1 cache rows (data + tag),
  // with the issuer's line shaded as Modified (M) and a snoop in flight
  // to the others. The directory in the centre shows the sharer bitmap.
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        {[
          { id: 'C0', x: 40,  y: 40,  state: 'M' },
          { id: 'C1', x: 460, y: 40,  state: 'I' },
          { id: 'C2', x: 40,  y: 240, state: 'I' },
          { id: 'C3', x: 460, y: 240, state: 'I' },
        ].map((c, i) => {
          const lit = c.state === 'M';
          return (
            <g key={i} transform={`translate(${c.x}, ${c.y})`}>
              <rect width="100" height="120" rx="3" fill={lit ? accent : 'none'}
                fillOpacity={lit ? 0.18 : 0}
                stroke={accent} strokeOpacity={lit ? 0.85 : 0.4} strokeWidth="1"
                className={lit ? 'sv-coh-core-lit' : ''} />
              <L x={50} y={-6} text={c.id} color={accent} em={0.85} size={11} />

              {/* L1 mini — two rows of 4 ways each. Top row is the line of
                  interest; the bottom row is "neighbours". */}
              <L x={6}  y={28} text="L1" color={accent} em={0.55} size={7} anchor="start" />
              <L x={94} y={28} text={c.state} color={accent}
                anchor="end" em={lit ? 1 : 0.5} size={9} />
              {[0, 1].map((row) => (
                <g key={row} transform={`translate(8, ${30 + row * 36})`}>
                  {[0, 1, 2, 3].map((w) => {
                    const target = row === 0 && w === 1;
                    return (
                      <rect key={w} x={w * 21} y="0" width="18" height="28" rx="1"
                        fill={target && lit ? accent : 'none'}
                        fillOpacity={target && lit ? 0.85 : 0}
                        stroke={accent}
                        strokeOpacity={target ? 0.85 : 0.3}
                        strokeWidth={target ? 1 : 0.6} />
                    );
                  })}
                </g>
              ))}
              {/* Cacheline tag swatch */}
              <rect x="8" y="100" width="84" height="14" rx="1"
                fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="0.6" />
              <L x={50} y={111} text="0x4080" color={accent} em={0.55} size={8} />
            </g>
          );
        })}

        <rect x="220" y="150" width="160" height="100" rx="3" fill={accent}
          fillOpacity="0.2" stroke={accent} strokeOpacity="0.7" strokeWidth="1" />
        <L x={300} y={144} text="Directory" color={accent} em={0.85} size={11} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${240 + i * 32}, 172)`}>
            <L x={9} y={-2} text={`C${i}`} color={accent} em={0.55} size={8} />
            <rect width="18" height="14" y="3" fill="none"
              stroke={accent} strokeOpacity="0.4" strokeWidth="0.6" />
            <rect x="2" y="5" width="6" height="10" fill={accent}
              className={`sv-coh-bit sv-coh-dir-bit-${i}-0`} />
            <rect x="10" y="5" width="6" height="10" fill={accent}
              className={`sv-coh-bit sv-coh-dir-bit-${i}-1`} />
          </g>
        ))}

        {[
          { from: [140, 100], to: [220, 200] },
          { from: [460, 100], to: [380, 200] },
          { from: [140, 300], to: [220, 200] },
          { from: [460, 300], to: [380, 200] },
        ].map((p, i) => (
          <g key={i}>
            <line x1={p.from[0]} y1={p.from[1]} x2={p.to[0]} y2={p.to[1]}
              stroke={accent} strokeOpacity="0.3" strokeWidth="0.8"
              strokeDasharray="3 3" />
            <circle r="4" fill={accent}
              style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
              <animateMotion dur="2.4s" repeatCount="indefinite"
                begin={`${i * 0.18}s`}
                path={`M ${p.from[0]} ${p.from[1]} L ${p.to[0]} ${p.to[1]}`} />
            </circle>
          </g>
        ))}
        <L x={300} y={278} text="snoop bus" color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

function CoherenceL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Cacheline State Register · 2 Bits" color={accent} em={0.85} size={11} />

        {[
          { x: 100, label: 'Bit 1' },
          { x: 340, label: 'Bit 0' },
        ].map((b, i) => (
          <g key={i} transform={`translate(${b.x}, 130)`}>
            <rect width="160" height="140" rx="4" fill="none"
              stroke={accent} strokeOpacity="0.55" strokeWidth="1" />
            <L x={80} y={-6} text={b.label} color={accent} em={0.7} size={10} />
            <Inverter x={20} y={70} w={36} accent={accent} />
            <Inverter x={104} y={70} w={36} accent={accent} rotate={180} />
            <circle cx="80" cy="70" r="6" fill={accent}
              fillOpacity={i === 0 ? 0.9 : 0.3}
              className={i === 0 ? 'sv-coh-bit-set' : 'sv-coh-bit-clr'} />
            <rect x="60" y="100" width="40" height="20" fill={accent}
              fillOpacity={i === 0 ? 0.85 : 0.18}
              className={i === 0 ? 'sv-coh-bit-pulse' : ''} />
          </g>
        ))}
        <line x1="260" y1="200" x2="340" y2="200" stroke={accent}
          strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 3" />

        <g transform="translate(250, 320)">
          <rect width="50" height="40" fill={accent} fillOpacity="0.95"
            style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
          <rect x="60" width="50" height="40" fill={accent} fillOpacity="0.95"
            style={{ filter: `drop-shadow(0 0 8px ${accent})` }} />
          <L x={50} y={56} text="State = M (10)" color={accent} em={0.85} size={11} />
        </g>
      </svg>
    </Host>
  );
}

function CoherenceL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Cross-Coupled NAND Latch (1 Bit)" color={accent} em={0.85} size={11} />

        <g transform="translate(80, 100)">
          <NAND x={0} y={0} accent={accent} w={48} />
          <NAND x={0} y={140} accent={accent} w={48} />
          <NAND x={120} y={40} accent={accent} w={48} />
          <NAND x={120} y={100} accent={accent} w={48} />

          <line x1="172" y1="40" x2="200" y2="40" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1="200" y1="40" x2="200" y2="100" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1="200" y1="100" x2="-16" y2="100" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1="172" y1="100" x2="220" y2="100" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1="220" y1="100" x2="220" y2="40" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
          <line x1="220" y1="40" x2="-16" y2="40" stroke={accent}
            strokeOpacity="0.7" strokeWidth="1.2" />
        </g>

        <line x1="40" y1="290" x2="540" y2="290" stroke={accent}
          strokeWidth="1.4" className="sv-coh-clk" opacity="0.65" />
        <L x={28} y={294} text="CK" color={accent} anchor="end" em={0.7} size={10} />
        <path d="M 40 305 L 80 305 L 80 285 L 120 285 L 120 305 L 160 305 L 160 285 L 200 285 L 200 305 L 240 305"
          stroke={accent} strokeWidth="1" fill="none" opacity="0.7" />

        <L x={64} y={92} text="NAND1" color={accent} em={0.6} size={9} />
        <L x={64} y={232} text="NAND2" color={accent} em={0.6} size={9} />
        <L x={184} y={132} text="Q" color={accent} anchor="start" em={0.85} size={11} />
        <L x={184} y={192} text="Q̄" color={accent} anchor="start" em={0.85} size={11} />
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 5 — FILL CASCADE
// ===================================================================

function FillL0({ accent }) {
  const levels = [
    { y: 40,  sets: 16, delay: 0,   label: 'L3 · 8 MB',  step: '1', cycles: 't+0' },
    { y: 160, sets: 12, delay: 0.7, label: 'L2 · 256 KB', step: '2', cycles: 't+5' },
    { y: 280, sets: 8,  delay: 1.4, label: 'L1 · 32 KB', step: '3', cycles: 't+10' },
  ];
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Cacheline Cascade · L3 → L2 → L1"
          color={accent} em={0.85} size={11} />
        {levels.map((lvl, levelIdx) => (
          <g key={levelIdx} transform={`translate(0, ${lvl.y})`}>
            {/* Order pip — numbered circle anchors the level */}
            <circle cx="20" cy="30" r="11" fill={accent} fillOpacity="0.18"
              stroke={accent} strokeOpacity="0.85" strokeWidth="1" />
            <L x={20} y={34} text={lvl.step} color={accent} em={1} size={11} />
            <L x={42} y={26} text={lvl.label} color={accent} anchor="start" em={0.85} size={11} />
            <L x={42} y={40} text={lvl.cycles} color={accent} anchor="start" em={0.55} size={9} />
            <g transform="translate(140, 0)">
              {Array.from({ length: lvl.sets }).map((_, s) => (
                <rect key={s} x={s * 30} y="0" width="26" height="60"
                  fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="0.7" />
              ))}
              <g className={`sv-fill-line sv-fill-line-${levelIdx}`}
                style={{ animationDelay: `${lvl.delay}s` }}>
                {Array.from({ length: 8 }).map((_, c) => (
                  <rect key={c} x={c * 3 + 4} y="6" width="2.4" height="48"
                    fill={accent} opacity="0.95" />
                ))}
              </g>
              {levelIdx < 2 && (
                <g className={`sv-fill-victim sv-fill-victim-${levelIdx}`}
                  style={{ animationDelay: `${lvl.delay + 0.3}s` }}>
                  <rect x={lvl.sets * 30 - 26} y="6" width="26" height="48"
                    fill="none" stroke={accent} strokeOpacity="0.55"
                    strokeDasharray="2 2" strokeWidth="0.8" />
                  <L x={lvl.sets * 30 - 13} y={70} text="LRU evict" color={accent} em={0.55} size={8} />
                </g>
              )}
            </g>
          </g>
        ))}
        {/* Cascade arrows — staggered to match fill timing */}
        <g opacity="0.65">
          <path d="M 20 110 L 20 152 L 14 146 M 20 152 L 26 146"
            stroke={accent} strokeWidth="1.4" fill="none"
            className="sv-fill-arrow sv-fill-arrow-0" />
          <path d="M 20 230 L 20 272 L 14 266 M 20 272 L 26 266"
            stroke={accent} strokeWidth="1.4" fill="none"
            className="sv-fill-arrow sv-fill-arrow-1" />
        </g>
        <L x={300} y={388}
          text="64-Byte Line · Installed at Every Level"
          color={accent} em={0.6} size={9} />
      </svg>
    </Host>
  );
}

function FillL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="One Set · 4 Ways · 64-Byte Line" color={accent} em={0.85} size={11} />

        {[0, 1, 2, 3].map((w) => (
          <g key={w} transform={`translate(40, ${50 + w * 80})`}>
            <L x={-4} y={36} text={`W${w}`} color={accent} anchor="end" em={w === 1 ? 0.95 : 0.55} size={11} />
            <rect width="440" height="60" rx="3" fill="none"
              stroke={accent} strokeOpacity={w === 1 ? 0.8 : 0.3}
              strokeWidth="0.9" />
            <rect x="14" y="14" width="80" height="32" rx="1" fill={accent}
              fillOpacity={w === 1 ? 0.85 : 0.25}
              className={w === 1 ? 'sv-fill-tag-new' : ''} />
            {w === 0 && <L x={54} y={6} text="tag" color={accent} em={0.55} size={8} />}
            {Array.from({ length: 8 }).map((_, c) => (
              <rect key={c} x={120 + c * 38} y="14" width="32" height="32"
                fill={accent} fillOpacity={w === 1 ? 0.85 : 0.18}
                className={w === 1 ? 'sv-fill-byte' : ''}
                style={{ animationDelay: `${c * 0.12}s` }} />
            ))}
            {w === 0 && <L x={272} y={6} text="8 × 8-Byte Chunks" color={accent} em={0.55} size={8} />}
          </g>
        ))}

        <g transform="translate(510, 50)">
          <L x={20} y={-4} text="LRU" color={accent} em={0.7} size={9} />
          {[0, 1, 2, 3].map((w) => (
            <g key={w} transform={`translate(0, ${w * 80})`}>
              <circle cx="20" cy="30" r="8" fill={accent}
                fillOpacity={w === 0 ? 0.85 : 0.25}
                className={w === 0 ? 'sv-fill-lru-set' : ''} />
            </g>
          ))}
        </g>
      </svg>
    </Host>
  );
}

function FillL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="One Byte · 8 Bit Cells · WL Asserted" color={accent} em={0.85} size={11} />

        <line x1="20" y1="80" x2="580" y2="80" stroke={accent}
          strokeWidth="2.4" opacity="0.65" className="sv-fill-wl" />
        <L x={10} y={76} text="WL" color={accent} anchor="end" em={0.85} size={11} />

        {Array.from({ length: 8 }).map((_, i) => {
          const x = 60 + i * 64;
          return (
            <g key={i}>
              <line x1={x} y1="80" x2={x} y2="320" stroke={accent}
                strokeWidth="1.4" opacity="0.5"
                className="sv-fill-bl"
                style={{ animationDelay: `${i * 0.06}s` }} />
              <line x1={x + 28} y1="80" x2={x + 28} y2="320" stroke={accent}
                strokeWidth="1.4" opacity="0.4" />
              <NMOS x={x} y={80} accent={accent} scale={0.8} />
              <NMOS x={x + 28} y={80} accent={accent} scale={0.8} />
              <rect x={x - 4} y="180" width="36" height="50" fill={accent}
                fillOpacity={i % 2 === 0 ? 0.85 : 0.3}
                stroke={accent} strokeOpacity="0.6" strokeWidth="0.8"
                className="sv-fill-cell"
                style={{ animationDelay: `${i * 0.08}s` }} />
              <L x={x + 14} y={345} text={`b${7 - i}`} color={accent} em={0.7} size={10} />
            </g>
          );
        })}
      </svg>
    </Host>
  );
}

// ===================================================================
// Stage 6 — RETIRE
// ===================================================================

function RetireL0({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={20} y={28} text="Reorder Buffer · 16 Entries" color={accent} anchor="start" em={0.85} size={11} />

        {Array.from({ length: 16 }).map((_, i) => {
          const isLoad = i === 4;
          return (
            <rect key={i} x={20 + i * 36} y="40" width="32" height="36" rx="2"
              fill={isLoad ? accent : 'none'} fillOpacity={isLoad ? 0.45 : 0}
              stroke={accent} strokeOpacity={isLoad ? 0.95 : 0.3} strokeWidth="0.9"
              className={isLoad ? 'sv-retire-rob-load' : ''} />
          );
        })}

        <g className="sv-retire-pointer">
          <path d="M 36 90 L 46 100 L 26 100 Z" fill={accent} />
          <L x={36} y={120} text="Retire" color={accent} em={0.85} size={10} />
        </g>

        <L x={20} y={156} text="Register File · 32 Architectural Regs" color={accent} anchor="start" em={0.85} size={11} />
        <g transform="translate(20, 160)">
          {Array.from({ length: 32 }).map((_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const isX1 = i === 1;
            return (
              <g key={i} transform={`translate(${c * 70}, ${r * 50})`}>
                <rect width="60" height="40" rx="2"
                  fill={isX1 ? accent : 'none'} fillOpacity={isX1 ? 0.95 : 0}
                  stroke={accent} strokeOpacity={isX1 ? 1 : 0.35} strokeWidth="0.9"
                  style={{ filter: isX1 ? `drop-shadow(0 0 12px ${accent})` : 'none' }}
                  className={isX1 ? 'sv-retire-x1' : ''} />
                <L x={30} y={26}
                  text={`x${i}`}
                  color={isX1 ? 'rgba(0,0,0,0.85)' : accent}
                  em={isX1 ? 1 : 0.55} size={10} />
              </g>
            );
          })}
        </g>

        <line x1="180" y1="78" x2="80" y2="160" stroke={accent}
          strokeWidth="1.4" opacity="0.7" className="sv-retire-wire" />
      </svg>
    </Host>
  );
}

function RetireL1({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="One Register Row · 16 Bit Cells" color={accent} em={0.85} size={11} />

        <line x1="20" y1="80" x2="580" y2="80" stroke={accent}
          strokeWidth="2.4" opacity="0.65" className="sv-retire-wl" />
        <L x={10} y={76} text="WL[1]" color={accent} anchor="end" em={0.85} size={11} />

        {Array.from({ length: 16 }).map((_, i) => {
          const x = 30 + i * 36;
          return (
            <g key={i}>
              <line x1={x} y1="80" x2={x} y2="340" stroke={accent}
                strokeWidth="1.2" opacity="0.5" className="sv-retire-bl"
                style={{ animationDelay: `${i * 0.04}s` }} />
              <NMOS x={x} y={80} accent={accent} scale={0.7} />
              <rect x={x - 8} y="200" width="20" height="50" rx="2"
                fill={accent} fillOpacity="0.55"
                className="sv-retire-cell"
                style={{ animationDelay: `${i * 0.05}s` }} />
              <L x={x} y={365} text={`b${15 - i}`} color={accent} em={0.55} size={9} />
            </g>
          );
        })}
        <L x={300} y={394} text="BL · Bitlines (one per bit)" color={accent} em={0.55} size={9} />
      </svg>
    </Host>
  );
}

function RetireL2({ accent }) {
  return (
    <Host accent={accent}>
      <svg viewBox="0 0 600 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
        <L x={300} y={22} text="Write Driver · PMOS Pull-Up + NMOS Pull-Down" color={accent} em={0.85} size={11} />

        <line x1="80" y1="40" x2="520" y2="40" stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.6" />
        <L x={84} y={32} text="VDD" color={accent} anchor="start" em={0.7} size={10} />
        <line x1="80" y1="360" x2="520" y2="360" stroke={accent}
          strokeOpacity="0.6" strokeWidth="1.6" />
        <L x={84} y={376} text="GND" color={accent} anchor="start" em={0.7} size={10} />

        <PMOS x={300} y={120} accent={accent} scale={1.6} />
        <L x={324} y={88} text="PMOS · Pull-Up" color={accent} anchor="start" em={0.7} size={9} />
        <line x1="300" y1="78" x2="300" y2="40" stroke={accent}
          strokeOpacity="0.7" strokeWidth="1.4" />

        <NMOS x={300} y={280} accent={accent} scale={1.6} />
        <L x={324} y={300} text="NMOS · Pull-Down" color={accent} anchor="start" em={0.7} size={9} />
        <line x1="300" y1="320" x2="300" y2="360" stroke={accent}
          strokeOpacity="0.7" strokeWidth="1.4" />

        <line x1="300" y1="158" x2="300" y2="240" stroke={accent}
          strokeWidth="2" className="sv-retire-out" opacity="0.85" />

        <line x1="300" y1="200" x2="540" y2="200" stroke={accent}
          strokeWidth="1.6" opacity="0.7" />
        <L x={550} y={196} text="Out → BL" color={accent} anchor="end" em={0.85} size={11} />

        <line x1="80" y1="200" x2="180" y2="200" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" className="sv-retire-data" />
        <L x={70} y={196} text="In · Data" color={accent} anchor="end" em={0.85} size={11} />
        <line x1="180" y1="200" x2="180" y2="120" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="180" y1="200" x2="180" y2="280" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="180" y1="120" x2="278" y2="120" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="180" y1="280" x2="278" y2="280" stroke={accent}
          strokeOpacity="0.65" strokeWidth="1.2" />

        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill={accent}
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}>
            <animate attributeName="cx" from="300" to="540" dur="1.6s"
              repeatCount="indefinite" begin={`${i * 0.5}s`} />
            <animate attributeName="cy" values="200" dur="1.6s"
              repeatCount="indefinite" begin={`${i * 0.5}s`} />
          </circle>
        ))}
      </svg>
    </Host>
  );
}

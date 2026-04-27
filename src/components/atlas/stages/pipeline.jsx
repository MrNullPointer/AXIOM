import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

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


export default function PipelineStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [PipelineL0, PipelineL1, PipelineL2][lvl]({ accent });
}

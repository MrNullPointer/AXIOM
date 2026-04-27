import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

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


export default function RetireStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [RetireL0, RetireL1, RetireL2][lvl]({ accent });
}

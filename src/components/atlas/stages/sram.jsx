import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

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
  const xKeyCol  = 660;        // Layer-key column anchor — pushed 40 px
                                // right of the diagram so labels never
                                // crowd the cross-section even when the
                                // SVG scales up to its full container width.
  const channelXLeft  = 230;
  const channelXRight = 470;
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      <svg viewBox="0 0 770 400" className="sv-svg" preserveAspectRatio="xMidYMid meet">
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

        {/* Layer key column on the right — each label aligned to its
            layer's vertical centre with a thin tick line drawn from the
            diagram edge to the label. Anchored at xKeyCol so the column
            never crowds the cross-section, even at full container width. */}
        {[
          { y: m1Y + m1H / 2,                  label: 'M1' },
          { y: polyY + polyH / 2,              label: 'POLY' },
          { y: oxideY + oxideH / 2,            label: 'OXIDE' },
          { y: channelY + channelH / 2,        label: 'CHANNEL' },
          { y: diffY + diffH / 2,              label: 'n⁺' },
          { y: subY + subH / 2,                label: 'p-SUB' },
        ].map((l, i) => (
          <g key={i}>
            <line x1={xRight + 6} y1={l.y} x2={xKeyCol - 4} y2={l.y}
              stroke={accent} strokeOpacity="0.32" strokeWidth="0.6" />
            <text x={xKeyCol} y={l.y + 3}
              fontSize="8" fontFamily={FONT}
              fill={accent} fillOpacity="0.65"
              letterSpacing="0.2em" textAnchor="start"
              style={{ textTransform: 'uppercase' }}>
              {l.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function SramStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [SramL0, SramL1, SramL2][lvl]({ accent });
}

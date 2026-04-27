import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

// ===================================================================
// Stage 3 — DRAM
// ===================================================================

/**
 * DramL0 — DRAM array access. Two-phase address: RAS picks a row,
 * the entire row's charges dump onto bitlines and are amplified by
 * sense-amps; then CAS picks the column to read out. RAS itself is
 * destructive — the row needs to be written back at the end.
 *
 * Real-life cost: at typical client clocks the full memctrl → DDR
 * round-trip (queueing, command, activate, CAS, burst, return) lands
 * around ~240 core cycles — that's the cliff in the "287 cycle" miss.
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
          text="memctrl + DDR round-trip ≈ 240 core cycles · this is the DRAM cliff"
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


export default function DramStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [DramL0, DramL1, DramL2][lvl]({ accent });
}

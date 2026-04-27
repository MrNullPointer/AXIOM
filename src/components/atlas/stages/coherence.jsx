import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

// ===================================================================
// Stage 4 — COHERENCE
// ===================================================================

/**
 * CoherenceL0 — four cores, a directory, and the snoop bus.
 *
 * Read-miss snoop: C0 has just experienced a read miss on the load and
 * is about to install the line. The directory checks every other core's
 * state; C1 already holds the line in [S]hared. Since no core holds it
 * Modified, the line is safe to install Shared in C0 and the directory
 * adds C0 to the sharer bitmap.
 *
 * The directory's sharer bitmap shows which cores hold a copy. After
 * the snoop, both C0 and C1 are lit (the two current sharers); C2 and
 * C3 stay invalid.
 */
function CoherenceL0({ accent }) {
  const cores = [
    { id: 'C0', x: 40,  y: 40,  state: 'S' },
    { id: 'C1', x: 460, y: 40,  state: 'S' },
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
          const lit = c.state !== 'I';
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
              fillOpacity={(i === 0 || i === 1) ? 0.85 : 0.18}
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
          text="C0 read-miss → directory checks · no M owners → install [S]hared"
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


export default function CoherenceStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [CoherenceL0, CoherenceL1, CoherenceL2][lvl]({ accent });
}

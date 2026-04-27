import {
  Host, L, LL, Pin,
  NMOS, PMOS, NMOS_H, PMOS_H,
  Inverter, NAND,
  FONT,
} from './_primitives.jsx';

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


export default function FillStage({ subStageIndex = 0, accent }) {
  const lvl = Math.min(2, Math.max(0, subStageIndex));
  return [FillL0, FillL1, FillL2][lvl]({ accent });
}

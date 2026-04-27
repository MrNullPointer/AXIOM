/**
 * Shared primitives for per-stage visualizations.
 *
 * Stage modules (pipeline, sram, bus, dram, coherence, fill, retire,
 * intro, recap) import what they need from here. Keeping these in one
 * file means each lazy-loaded stage chunk pulls only the primitives it
 * actually references, and the symbol geometry stays consistent across
 * stages — wires line up because every FET / inverter / NAND uses the
 * same terminal offsets.
 *
 * The accompanying StageAnimations.css supplies all the keyframes and
 * the .sv-stage-scrub override that pins animations to scroll-position.
 * The CSS is loaded once by the StageAnimations entry-point, so per-
 * stage modules don't need to import it directly.
 */

export const FONT = "'JetBrains Mono', ui-monospace, monospace";

/**
 * Host — visualization root. Sets the per-stage accent colour as a CSS
 * variable so descendant elements can pick it up via
 * `var(--stage-accent)` for fills, strokes, and drop-shadows. Layout
 * is a stretchable column so the SVG fills the available card area.
 */
export function Host({ accent, children }) {
  return (
    <div className="sv-host" style={{ '--stage-accent': accent }}>
      {children}
    </div>
  );
}

// L — small mono caps label, sits at (x, y). Uppercase + letter-spacing
// gives it the engineering-readout feel without competing with the viz.
// `style` is merged in so callers can drive opacity / transform with
// CSS calc() expressions (used by --sv-t-driven progressive reveals).
export function L({ x, y, text, color, anchor = 'middle', em = 0.7, size = 10, style }) {
  return (
    <text x={x} y={y} fontSize={size} fontFamily={FONT}
      fill={color} fillOpacity={em}
      textAnchor={anchor}
      letterSpacing="0.18em"
      style={{ textTransform: 'uppercase', ...style }}>
      {text}
    </text>
  );
}

// LL — leader-line annotation. Anchors a label at (lx, ly) and draws a
// thin connector from the labeled element at (px, py) to it. Use when
// the label can't sit directly next to its target without crowding.
export function LL({ px, py, lx, ly, text, color, anchor = 'start', size = 9 }) {
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
export function Pin({ x, y, accent, r = 2.4, opacity = 0.95 }) {
  return <circle cx={x} cy={y} r={r} fill={accent} fillOpacity={opacity} />;
}

export function NMOS({ x, y, accent, scale = 1, lit = false }) {
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

export function PMOS({ x, y, accent, scale = 1, lit = false }) {
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
export function NMOS_H({ x, y, accent, scale = 1, lit = false }) {
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
export function PMOS_H({ x, y, accent, scale = 1, lit = false }) {
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
export function Inverter({ x, y, w = 28, accent, rotate = 0 }) {
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
export function NAND({ x, y, accent, w = 30 }) {
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

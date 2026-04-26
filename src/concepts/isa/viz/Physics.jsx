import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PhysicsLadder — five stacked panels showing how an opcode is built up from
 * the only primitive silicon offers: a switch.
 *
 * A clock pulse travels bottom→top every cycle, "lighting up" each layer in
 * sequence. Hover a layer to freeze it and see the physics blurb.
 *
 * Layers, bottom to top:
 *   1. electrons drifting through a doped channel
 *   2. transistor I–V curve crossing threshold
 *   3. NAND gate evaluating its truth table
 *   4. an 8-bit register latching a pattern
 *   5. an opcode — the smallest voltage change an architect named meaningful
 */
const LAYER_COUNT = 5;
const CYCLE_MS = 5000;
const STEP_MS = CYCLE_MS / LAYER_COUNT;

export default function PhysicsLadder() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [frozen, setFrozen] = useState(null);

  useEffect(() => {
    if (reduce || frozen !== null) return;
    const t = setInterval(() => {
      setActive((a) => (a + 1) % LAYER_COUNT);
    }, STEP_MS);
    return () => clearInterval(t);
  }, [reduce, frozen]);

  const current = frozen !== null ? frozen : active;

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">five layers · one clock pulse</div>
        <div className="marker" style={{ color: 'var(--ink-faint)' }}>
          {frozen !== null ? 'frozen — click to release' : 'auto'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        <div
          className="relative flex flex-col-reverse"
          onMouseLeave={() => setFrozen(null)}
        >
          {LAYERS.map((layer, i) => (
            <Layer
              key={layer.id}
              index={i}
              layer={layer}
              active={current === i}
              onEnter={() => setFrozen(i)}
            />
          ))}
        </div>

        <Sidebar layer={LAYERS[current]} index={current} />
      </div>
    </div>
  );
}

function Layer({ index, layer, active, onEnter }) {
  return (
    <motion.div
      onMouseEnter={onEnter}
      onFocus={onEnter}
      tabIndex={0}
      className="relative cursor-default border-t px-5 py-5 outline-none"
      style={{
        borderColor: 'var(--rule)',
        background: active ? 'var(--bg-soft)' : 'transparent',
      }}
      animate={{ opacity: active ? 1 : 0.55 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span
            className="display text-2xl tabular-nums"
            style={{ color: active ? 'var(--accent-1)' : 'var(--ink-faint)' }}
          >
            0{index + 1}
          </span>
          <span className="display text-lg">{layer.name}</span>
        </div>
        <span className="marker" style={{ color: 'var(--ink-faint)' }}>
          {layer.unit}
        </span>
      </div>

      <div className="mt-4 h-[78px]">{layer.render(active)}</div>
    </motion.div>
  );
}

function Sidebar({ layer, index }) {
  return (
    <div
      className="border-t px-5 py-5 lg:border-l lg:border-t-0"
      style={{ borderColor: 'var(--rule)', background: 'var(--bg-soft)' }}
    >
      <div className="marker">layer 0{index + 1}</div>
      <div className="display mt-2 text-xl">{layer.name}</div>
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: 'var(--ink-soft)' }}
      >
        {layer.blurb}
      </p>
      <div
        className="mt-4 border-t pt-3 text-xs leading-relaxed"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink-faint)' }}
      >
        {layer.aside}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Per-layer renderers. Each is a tiny SVG/HTML scene tuned to the
 * physical idea at that level of abstraction.
 * ------------------------------------------------------------------ */
const LAYERS = [
  {
    id: 'electrons',
    name: 'electrons',
    unit: '~10⁻¹⁹ C · sub-picosecond',
    blurb:
      'Apply a voltage across a doped silicon channel. Free electrons drift toward the positive terminal at roughly 10⁵ m/s. A transistor is just a faucet on this current — nothing more.',
    aside:
      'Below this layer there is no "bit". Just charge, fields, and the periodic table.',
    render: (active) => <ElectronChannel active={active} />,
  },
  {
    id: 'transistor',
    name: 'transistor',
    unit: 'Vth ≈ 0.3 V · ~5 fJ / switch',
    blurb:
      'A FET\'s gate voltage modulates the channel\'s conductivity. Push past the threshold (~0.3V on a modern FinFET) and it conducts; below, it pinches off. Switch — that is the only primitive.',
    aside:
      'Modern logic nodes pack ~250 million of these per square millimetre. Each switches in tens of picoseconds.',
    render: (active) => <TransistorCurve active={active} />,
  },
  {
    id: 'gate',
    name: 'logic gate',
    unit: '~6 transistors · ~10 ps delay',
    blurb:
      'Wire two transistors in series under a load and you have NAND — a complete basis. Every Boolean function the CPU computes reduces, in principle, to NAND trees.',
    aside:
      'NAND alone is functionally complete. NOT, AND, OR, XOR, MUX, ADDER — all of it.',
    render: (active) => <NANDGate active={active} />,
  },
  {
    id: 'register',
    name: 'register',
    unit: 'state · clocked',
    blurb:
      'Cross-couple a pair of NANDs and you have a latch — a circuit that remembers. Eight latches behind a clock edge become a byte that names itself: register x5.',
    aside:
      'Combinational logic computes; sequential logic remembers. Together they are sufficient for any computation.',
    render: (active) => <Register active={active} />,
  },
  {
    id: 'opcode',
    name: 'opcode',
    unit: 'the contract',
    blurb:
      'An instruction is the smallest voltage change an architect promised would mean something. Below the line, electrons just flow. Above it, a compiler can plan.',
    aside:
      'Everything in this concept page sits on this line. Below: physics. Above: software.',
    render: (active) => <Opcode active={active} />,
  },
];

/* ---- layer 1: electron channel ---------------------------------- */
function ElectronChannel({ active }) {
  const dots = Array.from({ length: 14 });
  return (
    <svg viewBox="0 0 320 60" className="h-full w-full">
      <defs>
        <linearGradient id="silicon" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--rule-strong)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--rule)" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x="0" y="20" width="320" height="20" fill="url(#silicon)" />
      <line
        x1="0"
        y1="20"
        x2="320"
        y2="20"
        stroke="var(--rule-strong)"
        strokeWidth="0.6"
      />
      <line
        x1="0"
        y1="40"
        x2="320"
        y2="40"
        stroke="var(--rule-strong)"
        strokeWidth="0.6"
      />
      {/* gate */}
      <rect
        x="140"
        y="8"
        width="40"
        height="10"
        fill="var(--accent-2)"
        opacity="0.55"
        rx="1"
      />
      <text
        x="160"
        y="6"
        fontSize="6"
        textAnchor="middle"
        fill="var(--ink-faint)"
        fontFamily="JetBrains Mono, monospace"
      >
        GATE
      </text>
      {/* electrons */}
      {dots.map((_, i) => (
        <motion.circle
          key={i}
          r="1.6"
          cy={26 + (i % 3) * 4}
          fill="var(--accent-1)"
          initial={{ cx: -10 }}
          animate={active ? { cx: [-10, 330] } : { cx: -10 }}
          transition={{
            duration: 1.6,
            delay: (i * 0.12) % 1.6,
            ease: 'linear',
            repeat: active ? Infinity : 0,
          }}
        />
      ))}
      <text
        x="6"
        y="56"
        fontSize="6"
        fill="var(--ink-faint)"
        fontFamily="JetBrains Mono, monospace"
      >
        − source
      </text>
      <text
        x="280"
        y="56"
        fontSize="6"
        fill="var(--ink-faint)"
        fontFamily="JetBrains Mono, monospace"
      >
        + drain
      </text>
    </svg>
  );
}

/* ---- layer 2: transistor I-V curve ------------------------------ */
function TransistorCurve({ active }) {
  // Sweep gate voltage from 0 to 1 V; current is sub-threshold then steep.
  const path = 'M 10 60 Q 90 60 130 56 Q 170 50 200 18 L 290 8';
  return (
    <svg viewBox="0 0 320 70" className="h-full w-full">
      {/* axes */}
      <line
        x1="10"
        y1="62"
        x2="300"
        y2="62"
        stroke="var(--rule-strong)"
        strokeWidth="0.6"
      />
      <line
        x1="10"
        y1="6"
        x2="10"
        y2="62"
        stroke="var(--rule-strong)"
        strokeWidth="0.6"
      />
      {/* threshold marker */}
      <line
        x1="170"
        y1="6"
        x2="170"
        y2="62"
        stroke="var(--accent-warn)"
        strokeWidth="0.6"
        strokeDasharray="2 2"
      />
      <text
        x="172"
        y="14"
        fontSize="6"
        fill="var(--accent-warn)"
        fontFamily="JetBrains Mono, monospace"
      >
        Vth
      </text>
      {/* curve */}
      <path
        d={path}
        fill="none"
        stroke="var(--accent-1)"
        strokeWidth="1.2"
      />
      {/* sweeping point */}
      <motion.circle
        r="3"
        fill="var(--accent-1)"
        initial={{ cx: 10, cy: 60 }}
        animate={
          active
            ? {
                cx: [10, 130, 170, 200, 290],
                cy: [60, 56, 52, 18, 8],
              }
            : { cx: 10, cy: 60 }
        }
        transition={{
          duration: 2.4,
          ease: [0.55, 0.05, 0.6, 1],
          repeat: active ? Infinity : 0,
        }}
      />
      {/* labels */}
      <text
        x="296"
        y="68"
        fontSize="6"
        textAnchor="end"
        fill="var(--ink-faint)"
        fontFamily="JetBrains Mono, monospace"
      >
        VGS →
      </text>
      <text
        x="14"
        y="10"
        fontSize="6"
        fill="var(--ink-faint)"
        fontFamily="JetBrains Mono, monospace"
      >
        IDS
      </text>
    </svg>
  );
}

/* ---- layer 3: NAND truth table sweep ---------------------------- */
const NAND_ROWS = [
  { a: 0, b: 0, q: 1 },
  { a: 0, b: 1, q: 1 },
  { a: 1, b: 0, q: 1 },
  { a: 1, b: 1, q: 0 },
];

function NANDGate({ active }) {
  const [row, setRow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setRow((r) => (r + 1) % 4), 700);
    return () => clearInterval(t);
  }, [active]);
  const r = NAND_ROWS[row];
  return (
    <div className="flex items-center gap-5">
      {/* schematic */}
      <svg viewBox="0 0 120 70" className="h-full w-[140px]">
        <line
          x1="6"
          y1="22"
          x2="40"
          y2="22"
          stroke="var(--rule-strong)"
        />
        <line
          x1="6"
          y1="48"
          x2="40"
          y2="48"
          stroke="var(--rule-strong)"
        />
        {/* AND body */}
        <path
          d="M 40 12 L 60 12 A 22 22 0 0 1 60 58 L 40 58 Z"
          fill="var(--bg)"
          stroke="var(--rule-strong)"
        />
        {/* NOT bubble */}
        <circle
          cx="86"
          cy="35"
          r="3"
          fill="var(--bg)"
          stroke="var(--rule-strong)"
        />
        <line
          x1="89"
          y1="35"
          x2="114"
          y2="35"
          stroke="var(--rule-strong)"
        />
        {/* input dots */}
        <motion.circle
          cx="6"
          cy="22"
          r="3"
          fill="#6e7488"
          animate={{
            fill: r.a ? 'var(--accent-1)' : 'var(--ink-faint)',
          }}
        />
        <motion.circle
          cx="6"
          cy="48"
          r="3"
          fill="#6e7488"
          animate={{
            fill: r.b ? 'var(--accent-1)' : 'var(--ink-faint)',
          }}
        />
        {/* output */}
        <motion.circle
          cx="114"
          cy="35"
          r="3.5"
          fill="#6e7488"
          animate={{
            fill: r.q ? 'var(--accent-3)' : 'var(--ink-faint)',
          }}
        />
        <text
          x="2"
          y="18"
          fontSize="6"
          fill="var(--ink-faint)"
          fontFamily="JetBrains Mono, monospace"
        >
          A
        </text>
        <text
          x="2"
          y="60"
          fontSize="6"
          fill="var(--ink-faint)"
          fontFamily="JetBrains Mono, monospace"
        >
          B
        </text>
        <text
          x="116"
          y="32"
          fontSize="6"
          fill="var(--ink-faint)"
          fontFamily="JetBrains Mono, monospace"
        >
          Q
        </text>
      </svg>

      {/* truth table */}
      <div className="font-mono text-[10px] tabular-nums">
        <div
          className="marker mb-1 text-[9px]"
          style={{ color: 'var(--ink-faint)' }}
        >
          A · B · Q
        </div>
        {NAND_ROWS.map((rr, i) => (
          <div
            key={i}
            className="flex gap-2 transition-colors"
            style={{
              color: i === row ? 'var(--ink)' : 'var(--ink-faint)',
              opacity: i === row ? 1 : 0.55,
            }}
          >
            <span>{rr.a}</span>
            <span>{rr.b}</span>
            <span style={{ color: rr.q ? 'var(--accent-3)' : 'inherit' }}>
              {rr.q}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- layer 4: 8-bit register, bits flipping --------------------- */
function Register({ active }) {
  const [bits, setBits] = useState([1, 0, 1, 0, 0, 1, 0, 1]);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setBits((b) => b.map(() => (Math.random() < 0.5 ? 0 : 1)));
    }, 500);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className="flex items-center gap-3">
      <div
        className="marker"
        style={{ color: 'var(--ink-faint)' }}
      >
        x5
      </div>
      <div className="flex gap-1">
        {bits.map((b, i) => (
          <motion.div
            key={i}
            className="grid h-9 w-7 place-items-center rounded font-mono text-sm tabular-nums"
            animate={{
              borderColor: b ? 'var(--accent-1)' : 'var(--rule-strong)',
              color: b ? 'var(--accent-1)' : 'var(--ink-faint)',
              background: b
                ? 'rgba(125,249,255,0.06)'
                : 'rgba(125,249,255,0)',
            }}
            transition={{ duration: 0.2 }}
            style={{
              border: '1px solid var(--rule-strong)',
            }}
          >
            {b}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---- layer 5: opcode reveal ------------------------------------- */
function Opcode({ active }) {
  return (
    <div className="flex h-full items-center">
      <motion.div
        animate={{
          opacity: active ? 1 : 0.45,
          letterSpacing: active ? '0.02em' : '-0.02em',
        }}
        transition={{ duration: 0.5 }}
        className="font-mono text-2xl"
        style={{ color: 'var(--ink)' }}
      >
        <span style={{ color: 'var(--accent-1)' }}>add</span>{' '}
        <span style={{ color: 'var(--ink-soft)' }}>x5, x6, x7</span>
      </motion.div>
      <div className="ml-auto marker" style={{ color: 'var(--ink-faint)' }}>
        ← contract line
      </div>
    </div>
  );
}

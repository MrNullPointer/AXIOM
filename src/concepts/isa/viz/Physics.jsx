import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Pause, Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * PhysicsLadder — five stacked panels showing how an opcode is built up
 * from the only primitive silicon offers: a switch.
 *
 * Interactive: an auto-stepping clock pulse walks bottom→top, but the user
 * can pause, step, reset, click a layer to pin it, click NAND inputs to
 * drive the truth table by hand, and toggle individual register bits.
 *
 * Layers, bottom to top:
 *   1. electrons drifting through a doped channel (drift / saturation)
 *   2. transistor I–V curve crossing threshold (Vth, sub-threshold slope)
 *   3. CMOS NAND2 (4 transistors, 2 PMOS pull-up + 2 NMOS pull-down)
 *   4. an 8-bit register — each bit is clickable
 *   5. an opcode — the smallest voltage change an architect named
 */
const LAYER_COUNT = 5;
const STEP_MS = 1100;

export default function PhysicsLadder() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(null);
  const [playing, setPlaying] = useState(true);

  // NAND interactive inputs — global to the component so the user's choice
  // persists when the layer is pinned.
  const [nandA, setNandA] = useState(0);
  const [nandB, setNandB] = useState(0);
  const [nandManual, setNandManual] = useState(false);

  // Register interactive bits — user can click to flip.
  const [regBits, setRegBits] = useState([0, 0, 1, 0, 0, 1, 0, 1]);
  const [regManual, setRegManual] = useState(false);

  useEffect(() => {
    if (!playing || reduce || pinned !== null) return;
    const t = setInterval(() => setActive((a) => (a + 1) % LAYER_COUNT), STEP_MS);
    return () => clearInterval(t);
  }, [playing, reduce, pinned]);

  const current = pinned !== null ? pinned : active;

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">
          five layers · one clock pulse · {pinned !== null ? 'pinned' : playing ? 'auto' : 'paused'}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPinned(null);
              setActive((a) => (a - 1 + LAYER_COUNT) % LAYER_COUNT);
              setPlaying(false);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Previous layer"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <ChevronLeft size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label={playing ? 'Pause' : 'Play'}
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            {playing ? (
              <Pause size={11} aria-hidden="true" />
            ) : (
              <Play size={11} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setPinned(null);
              setActive((a) => (a + 1) % LAYER_COUNT);
              setPlaying(false);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Next layer"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <ChevronRight size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPinned(null);
              setActive(0);
              setPlaying(true);
            }}
            className="ml-1 grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Reset"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <RotateCcw size={11} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
        <div className="relative flex flex-col-reverse">
          {LAYERS.map((layer, i) => (
            <Layer
              key={layer.id}
              index={i}
              layer={layer}
              active={current === i}
              pinned={pinned === i}
              onClick={() => {
                if (pinned === i) {
                  setPinned(null);
                  setPlaying(true);
                } else {
                  setPinned(i);
                  setPlaying(false);
                }
              }}
              ctx={{
                nandA, nandB, nandManual,
                onNand: (a, b) => { setNandA(a); setNandB(b); setNandManual(true); },
                regBits, regManual,
                onRegFlip: (idx) => {
                  setRegBits((bits) => bits.map((b, j) => (j === idx ? 1 - b : b)));
                  setRegManual(true);
                },
              }}
            />
          ))}
        </div>

        <Sidebar layer={LAYERS[current]} index={current} pinned={pinned !== null} />
      </div>
    </div>
  );
}

function Layer({ index, layer, active, pinned, onClick, ctx }) {
  return (
    <motion.div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      className="relative cursor-pointer border-t px-5 py-5 outline-none focus-visible:ring"
      style={{
        borderColor: 'var(--rule)',
        background: pinned
          ? 'rgba(125,249,255,0.04)'
          : active ? 'var(--bg-soft)' : 'transparent',
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
          {pinned ? (
            <span
              className="marker text-[9px]"
              style={{ color: 'var(--accent-1)' }}
            >
              ● pinned · click to release
            </span>
          ) : null}
        </div>
        <span className="marker" style={{ color: 'var(--ink-faint)' }}>
          {layer.unit}
        </span>
      </div>

      <div className="mt-4 h-[78px]" onClick={(e) => e.stopPropagation()}>
        {layer.render(active, ctx)}
      </div>
    </motion.div>
  );
}

function Sidebar({ layer, index, pinned }) {
  return (
    <div
      className="border-t px-5 py-5 lg:border-l lg:border-t-0"
      style={{ borderColor: 'var(--rule)', background: 'var(--bg-soft)' }}
    >
      <div className="marker">
        layer 0{index + 1}
        {pinned ? ' · pinned' : ''}
      </div>
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
      {layer.tip ? (
        <div
          className="mt-3 rounded border px-3 py-2 text-[11px]"
          style={{ borderColor: 'var(--rule-strong)', color: 'var(--accent-1)' }}
        >
          {layer.tip}
        </div>
      ) : null}
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
    unit: 'q ≈ 1.6×10⁻¹⁹ C · v_sat ≈ 10⁵ m/s',
    blurb:
      'Apply a voltage across a doped silicon channel. Above the threshold gate voltage, free electrons drift down the inversion layer; their velocity rises roughly linearly with field until it saturates near v_sat ≈ 1×10⁵ m/s due to optical-phonon scattering. A field-effect transistor (FET) is just a faucet on this current — its conductance bends to the gate voltage and nothing else.',
    aside:
      'Below this layer there is no "bit". Just charge, electric fields, scattering events, and the periodic table.',
    tip: 'Click this panel to pin it and observe the drift more carefully.',
    render: (active) => <ElectronChannel active={active} />,
  },
  {
    id: 'transistor',
    name: 'transistor',
    unit: 'Vth ≈ 0.3 V · ~80 mV/dec sub-threshold · ~1 fJ / switch',
    blurb:
      'A FET\'s gate voltage modulates the channel\'s conductivity. Below threshold, current falls roughly an order of magnitude per ~80 mV (the sub-threshold slope, bounded near 60 mV/dec by kT/q at room temperature). Push past the threshold (~0.3 V on a modern FinFET, lower on gate-all-around nodes) and the channel conducts; a single switching event dissipates roughly ½CV² in the load capacitance, around 1 fJ on a leading-edge node.',
    aside:
      'A 5 nm logic process packs ~250 million transistors per square millimetre. Each switches in tens of picoseconds when loaded with realistic fanout.',
    tip: 'The sweep crosses the dashed Vth line — that is the inflection between off and on.',
    render: (active) => <TransistorCurve active={active} />,
  },
  {
    id: 'gate',
    name: 'CMOS NAND2',
    unit: '4 transistors · ~10 ps stage delay',
    blurb:
      'Wire two PMOS in parallel pulling the output up, two NMOS in series pulling it down, and you have a CMOS NAND2 — exactly four transistors. NAND alone is functionally complete: every Boolean function the CPU computes reduces, in principle, to NAND trees. Sub-1 V supplies and ~10 ps stage delays mean a 32-bit ripple adder settles in roughly 1 ns even before carry-lookahead.',
    aside:
      'NAND alone is functionally complete: NOT, AND, OR, XOR, MUX, ADDER — all of it. That is why CMOS standard-cell libraries give it the smallest pitch in the catalog.',
    tip: 'Click A or B to flip an input by hand. Q = ¬(A ∧ B) — confirm the truth table yourself.',
    render: (active, ctx) => <NANDGate active={active} ctx={ctx} />,
  },
  {
    id: 'register',
    name: 'register',
    unit: 'state · clocked',
    blurb:
      'Cross-couple a pair of NANDs and you have an SR latch — a circuit that remembers. Stack a master and slave latch behind a clock edge and you have a flip-flop: D-in, Q-out, transparent only at the rising edge. Eight flip-flops behind one clock become a byte that names itself: register x5. A modern out-of-order core has 100–300 such physical registers per architectural register, hidden behind a renamer.',
    aside:
      'Combinational logic computes; sequential logic remembers. Together they are sufficient for any computation a Turing machine can perform.',
    tip: 'Click a bit to flip it and watch the byte rename itself. The hex above updates live.',
    render: (active, ctx) => <Register active={active} ctx={ctx} />,
  },
  {
    id: 'opcode',
    name: 'opcode',
    unit: 'the contract',
    blurb:
      'An instruction is the smallest voltage change an architect promised would mean something. Below the line, electrons just flow. Above it, a compiler can plan, an OS can multiplex, and a thirty-year-old binary can still execute on a chip designed last week.',
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
      <line x1="0" y1="20" x2="320" y2="20" stroke="var(--rule-strong)" strokeWidth="0.6" />
      <line x1="0" y1="40" x2="320" y2="40" stroke="var(--rule-strong)" strokeWidth="0.6" />
      {/* gate */}
      <rect x="140" y="8" width="40" height="10" fill="var(--accent-2)" opacity="0.55" rx="1" />
      <text x="160" y="6" fontSize="6" textAnchor="middle" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">GATE</text>
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
      <text x="6" y="56" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">− source</text>
      <text x="280" y="56" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">+ drain</text>
    </svg>
  );
}

/* ---- layer 2: transistor I-V curve ------------------------------ */
function TransistorCurve({ active }) {
  const path = 'M 10 60 Q 90 60 130 56 Q 170 50 200 18 L 290 8';
  return (
    <svg viewBox="0 0 320 70" className="h-full w-full">
      <line x1="10" y1="62" x2="300" y2="62" stroke="var(--rule-strong)" strokeWidth="0.6" />
      <line x1="10" y1="6" x2="10" y2="62" stroke="var(--rule-strong)" strokeWidth="0.6" />
      <line x1="170" y1="6" x2="170" y2="62" stroke="var(--accent-warn)" strokeWidth="0.6" strokeDasharray="2 2" />
      <text x="172" y="14" fontSize="6" fill="var(--accent-warn)" fontFamily="JetBrains Mono, monospace">Vth</text>
      <path d={path} fill="none" stroke="var(--accent-1)" strokeWidth="1.2" />
      <motion.circle
        r="3"
        fill="var(--accent-1)"
        initial={{ cx: 10, cy: 60 }}
        animate={
          active ? { cx: [10, 130, 170, 200, 290], cy: [60, 56, 52, 18, 8] } : { cx: 10, cy: 60 }
        }
        transition={{ duration: 2.4, ease: [0.55, 0.05, 0.6, 1], repeat: active ? Infinity : 0 }}
      />
      <text x="296" y="68" fontSize="6" textAnchor="end" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">VGS →</text>
      <text x="14" y="10" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">IDS</text>
    </svg>
  );
}

/* ---- layer 3: NAND truth table sweep + interactive -------------- */
const NAND_ROWS = [
  { a: 0, b: 0, q: 1 },
  { a: 0, b: 1, q: 1 },
  { a: 1, b: 0, q: 1 },
  { a: 1, b: 1, q: 0 },
];

function NANDGate({ active, ctx }) {
  const [autoRow, setAutoRow] = useState(0);
  useEffect(() => {
    if (!active || ctx.nandManual) return;
    const t = setInterval(() => setAutoRow((r) => (r + 1) % 4), 700);
    return () => clearInterval(t);
  }, [active, ctx.nandManual]);

  const a = ctx.nandManual ? ctx.nandA : NAND_ROWS[autoRow].a;
  const b = ctx.nandManual ? ctx.nandB : NAND_ROWS[autoRow].b;
  const q = a && b ? 0 : 1; // NAND
  const matchingIdx = NAND_ROWS.findIndex((r) => r.a === a && r.b === b);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 70" className="h-full w-[140px]">
        <line x1="6" y1="22" x2="40" y2="22" stroke="var(--rule-strong)" />
        <line x1="6" y1="48" x2="40" y2="48" stroke="var(--rule-strong)" />
        <path d="M 40 12 L 60 12 A 22 22 0 0 1 60 58 L 40 58 Z" fill="var(--bg)" stroke="var(--rule-strong)" />
        <circle cx="86" cy="35" r="3" fill="var(--bg)" stroke="var(--rule-strong)" />
        <line x1="89" y1="35" x2="114" y2="35" stroke="var(--rule-strong)" />
        {/* clickable input dots */}
        <g
          onClick={() => ctx.onNand(a ? 0 : 1, b)}
          style={{ cursor: 'pointer' }}
        >
          <motion.circle cx="6" cy="22" r="6" fill="transparent" />
          <motion.circle cx="6" cy="22" r="3" animate={{ fill: a ? 'var(--accent-1)' : 'var(--ink-faint)' }} />
        </g>
        <g
          onClick={() => ctx.onNand(a, b ? 0 : 1)}
          style={{ cursor: 'pointer' }}
        >
          <motion.circle cx="6" cy="48" r="6" fill="transparent" />
          <motion.circle cx="6" cy="48" r="3" animate={{ fill: b ? 'var(--accent-1)' : 'var(--ink-faint)' }} />
        </g>
        <motion.circle cx="114" cy="35" r="3.5" animate={{ fill: q ? 'var(--accent-3)' : 'var(--ink-faint)' }} />
        <text x="2" y="18" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">A</text>
        <text x="2" y="60" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">B</text>
        <text x="116" y="32" fontSize="6" fill="var(--ink-faint)" fontFamily="JetBrains Mono, monospace">Q</text>
      </svg>

      <div className="font-mono text-[10px] tabular-nums">
        <div className="marker mb-1 text-[9px]" style={{ color: 'var(--ink-faint)' }}>
          A · B · Q  {ctx.nandManual ? '· manual' : '· auto'}
        </div>
        {NAND_ROWS.map((rr, i) => (
          <div
            key={i}
            className="flex gap-2 transition-colors"
            style={{
              color: i === matchingIdx ? 'var(--ink)' : 'var(--ink-faint)',
              opacity: i === matchingIdx ? 1 : 0.55,
            }}
          >
            <span>{rr.a}</span>
            <span>{rr.b}</span>
            <span style={{ color: rr.q ? 'var(--accent-3)' : 'inherit' }}>{rr.q}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- layer 4: 8-bit register, clickable bits ------------------- */
function Register({ active, ctx }) {
  const [autoBits, setAutoBits] = useState([1, 0, 1, 0, 0, 1, 0, 1]);
  useEffect(() => {
    if (!active || ctx.regManual) return;
    const t = setInterval(() => {
      setAutoBits((b) => b.map(() => (Math.random() < 0.5 ? 0 : 1)));
    }, 500);
    return () => clearInterval(t);
  }, [active, ctx.regManual]);

  const bits = ctx.regManual ? ctx.regBits : autoBits;
  const hex = parseInt(bits.join(''), 2).toString(16).padStart(2, '0').toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <div className="marker" style={{ color: 'var(--ink-faint)' }}>x5</div>
        <div className="font-mono text-[9px] mt-1" style={{ color: 'var(--accent-1)' }}>
          0x{hex}
        </div>
      </div>
      <div className="flex gap-1">
        {bits.map((b, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => ctx.onRegFlip(i)}
            className="grid h-9 w-7 place-items-center rounded font-mono text-sm tabular-nums cursor-pointer"
            animate={{
              borderColor: b ? 'var(--accent-1)' : 'var(--rule-strong)',
              color: b ? 'var(--accent-1)' : 'var(--ink-faint)',
              background: b ? 'rgba(125,249,255,0.06)' : 'rgba(125,249,255,0)',
            }}
            transition={{ duration: 0.2 }}
            style={{ border: '1px solid var(--rule-strong)' }}
            aria-label={`bit ${7 - i} = ${b}, click to flip`}
          >
            {b}
          </motion.button>
        ))}
      </div>
      <div className="font-mono text-[9px]" style={{ color: 'var(--ink-faint)' }}>
        {ctx.regManual ? 'manual' : 'auto'}
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
      <div className="ml-auto marker" style={{ color: 'var(--ink-faint)' }}>← contract line</div>
    </div>
  );
}

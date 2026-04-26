import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Taxonomy — four orthogonal axes along which every ISA can be classified.
 * Click chips to filter; the panel below resolves to the real ISAs that
 * occupy that intersection.
 *
 * Axes:
 *   complexity:  what one instruction is allowed to do
 *   storage:     where operands live by default
 *   data shape:  what the hardware understands natively
 *   ordering:    what other observers can see
 */

const AXES = [
  {
    id: 'complexity',
    label: 'complexity',
    options: [
      ['oisc', 'OISC', 'one instruction is enough · subleq'],
      ['misc', 'MISC', 'minimal instruction set · stack/Forth'],
      ['risc', 'RISC', 'one cycle of work per instruction'],
      ['cisc', 'CISC', 'microcoded, multi-step instructions'],
      ['vliw', 'VLIW', 'compiler bundles independent ops'],
      ['epic', 'EPIC', 'VLIW + speculation + predication'],
    ],
  },
  {
    id: 'storage',
    label: 'operand storage',
    options: [
      ['stack', 'stack', 'operands live on a managed stack'],
      ['acc', 'accumulator', 'one implicit register'],
      ['regmem', 'register-memory', 'instructions can touch memory'],
      ['ldst', 'load-store', 'memory only via load/store'],
    ],
  },
  {
    id: 'data',
    label: 'data shape',
    options: [
      ['scalar', 'scalar', 'one number per register'],
      ['simd', 'SIMD', 'fixed-width packed vectors'],
      ['vector', 'vector', 'length-agnostic vectors'],
      ['matrix', 'matrix', 'tile-shaped operands'],
      ['flow', 'dataflow', 'execution follows data dependencies'],
    ],
  },
  {
    id: 'ordering',
    label: 'memory ordering',
    options: [
      ['sc', 'sequential', 'one global interleaving'],
      ['tso', 'TSO', 'stores can hide in a buffer (x86)'],
      ['weak', 'weak', 'reorder freely until a fence (ARM, RISC-V)'],
      ['rc', 'release-consistent', 'order tied to acquire/release'],
    ],
  },
];

const ISAS = [
  {
    name: 'x86-64',
    blurb:
      'Variable-length CISC, register-memory, scalar/SIMD (AVX-512), TSO ordering. Microcoded internally to RISC-like μops.',
    tags: ['cisc', 'regmem', 'scalar', 'simd', 'tso'],
  },
  {
    name: 'ARM AArch64',
    blurb:
      'Fixed 32-bit RISC, load-store, scalar + SIMD (NEON) + length-agnostic SVE, weak ordering with explicit barriers.',
    tags: ['risc', 'ldst', 'scalar', 'simd', 'vector', 'weak'],
  },
  {
    name: 'RISC-V (RV64GCV)',
    blurb:
      'Open, modular, fixed-width RISC. Load-store. Optional Vector extension. Weak memory model (RVWMO).',
    tags: ['risc', 'ldst', 'scalar', 'vector', 'weak'],
  },
  {
    name: 'Itanium (IA-64)',
    blurb:
      'EPIC: bundles of three instructions with explicit parallelism, predication, and speculation. The compiler did the scheduling.',
    tags: ['epic', 'vliw', 'ldst', 'scalar', 'rc'],
  },
  {
    name: 'TI C6000 DSP',
    blurb:
      'Pure VLIW. Eight functional units, fetch packets of eight 32-bit instructions executed in parallel. No hazard hardware.',
    tags: ['vliw', 'ldst', 'scalar', 'rc'],
  },
  {
    name: '6502',
    blurb:
      'Accumulator architecture. One A register, two index regs (X, Y). Variable-length instructions. Drove the Apple II, NES, Commodore 64.',
    tags: ['cisc', 'acc', 'scalar', 'sc'],
  },
  {
    name: 'JVM bytecode',
    blurb:
      'Stack machine. Operands implicit on the operand stack. Designed for portability and compact verification, not raw speed.',
    tags: ['misc', 'stack', 'scalar', 'sc'],
  },
  {
    name: 'subleq (OISC)',
    blurb:
      'A single instruction: subtract and branch if less-or-equal. Turing-complete. Pedagogically pure; physically impractical.',
    tags: ['oisc', 'regmem', 'scalar', 'sc'],
  },
  {
    name: 'Forth / GreenArrays',
    blurb:
      'Minimal, stack-oriented. The GA144 puts 144 of these tiny machines on a chip — MISC at scale.',
    tags: ['misc', 'stack', 'scalar', 'sc'],
  },
  {
    name: 'NVIDIA SASS',
    blurb:
      'GPU shader ISA. Wide SIMT, predicated, statically scheduled. Effectively dataflow under the hood.',
    tags: ['vliw', 'ldst', 'simd', 'flow', 'rc'],
  },
  {
    name: 'AMX / SME',
    blurb:
      'Matrix tile extensions. The register file holds 2-D tiles; one instruction multiplies them. Built for transformer math.',
    tags: ['risc', 'ldst', 'matrix', 'weak'],
  },
  {
    name: 'Cell SPE',
    blurb:
      'PS3-era. Synergistic Processing Elements: in-order, dual-issue, software-managed local store. RISC-load-store with vector everything.',
    tags: ['risc', 'ldst', 'simd', 'weak'],
  },
];

const DEFAULTS = {
  complexity: 'risc',
  storage: 'ldst',
  data: 'scalar',
  ordering: 'weak',
};

export default function Taxonomy() {
  const [sel, setSel] = useState(DEFAULTS);

  const matches = useMemo(() => {
    const wanted = Object.values(sel);
    return ISAS.filter((isa) => wanted.every((t) => isa.tags.includes(t)));
  }, [sel]);

  const reset = () => setSel(DEFAULTS);

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">four axes · twelve real ISAs</div>
        <button
          type="button"
          onClick={reset}
          className="marker text-[10px] underline-offset-4 hover:underline"
          style={{ color: 'var(--ink-faint)' }}
        >
          reset
        </button>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col gap-4">
          {AXES.map((axis) => (
            <Axis
              key={axis.id}
              axis={axis}
              value={sel[axis.id]}
              onChange={(v) => setSel((s) => ({ ...s, [axis.id]: v }))}
            />
          ))}
        </div>

        <div
          className="mt-6 border-t pt-5"
          style={{ borderColor: 'var(--rule)' }}
        >
          <div className="marker mb-3" style={{ color: 'var(--ink-faint)' }}>
            ISAs at this intersection · {matches.length}
          </div>
          {matches.length === 0 ? (
            <div
              className="text-sm italic"
              style={{ color: 'var(--ink-faint)' }}
            >
              No real ISA sits exactly here. The interesting empty cells are
              hints about why architects pick the trade-offs they do.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {matches.map((isa) => (
                  <motion.div
                    key={isa.name}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: 'var(--rule-strong)',
                      background: 'var(--bg-soft)',
                    }}
                  >
                    <div className="display text-base">{isa.name}</div>
                    <p
                      className="mt-1.5 text-xs leading-relaxed"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {isa.blurb}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Axis({ axis, value, onChange }) {
  const selected = axis.options.find((o) => o[0] === value);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_180px] sm:items-center">
      <div className="marker">{axis.label}</div>
      <div className="flex flex-wrap gap-1.5">
        {axis.options.map(([id, label]) => {
          const isActive = id === value;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="marker rounded-full border px-2.5 py-1 text-[10px] transition-colors"
              style={{
                borderColor: isActive ? 'var(--ink)' : 'var(--rule-strong)',
                background: isActive ? 'var(--bg-soft)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div
        className="text-xs italic"
        style={{ color: 'var(--ink-soft)' }}
      >
        {selected?.[2]}
      </div>
    </div>
  );
}

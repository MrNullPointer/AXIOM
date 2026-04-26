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
      'Variable-length CISC, register-memory two-operand, scalar/SIMD (SSE → AVX-512), TSO ordering. Microcoded internally to RISC-like μops; modern cores have a μop cache that hides the legacy decoder on hot paths.',
    tags: ['cisc', 'regmem', 'scalar', 'simd', 'tso'],
  },
  {
    name: 'ARM AArch64',
    blurb:
      'Fixed 32-bit RISC, load-store, scalar + SIMD (NEON) + length-agnostic SVE, weak ordering with explicit DMB barriers. Adds pointer authentication, MTE, and SME tile extensions.',
    tags: ['risc', 'ldst', 'scalar', 'simd', 'vector', 'weak'],
  },
  {
    name: 'ARM Cortex-M (Thumb-2)',
    blurb:
      'Variable-length 16/32-bit Thumb-2 encoding for embedded cores. Same load-store, three-operand RISC philosophy, but optimized for code density on flash-constrained microcontrollers.',
    tags: ['risc', 'ldst', 'scalar', 'sc'],
  },
  {
    name: 'RISC-V (RV64GCV)',
    blurb:
      'Open, modular, fixed-width RISC. Load-store. Optional Vector extension is length-agnostic. Weak memory model (RVWMO); Ztso opt-in for x86-style binary translation.',
    tags: ['risc', 'ldst', 'scalar', 'vector', 'weak'],
  },
  {
    name: 'MIPS',
    blurb:
      'Original load-store RISC blueprint (Stanford 1981, commercial 1985). Five-stage pipeline, branch delay slot, no condition flags. Survives in academia and networking silicon.',
    tags: ['risc', 'ldst', 'scalar', 'weak'],
  },
  {
    name: 'POWER / PowerPC',
    blurb:
      'IBM\'s RISC family. Load-store, fixed 32-bit, condition register (CR0–CR7) instead of single flags. Weak memory model. Powers IBM mainframes, Power Systems, and historically Apple G3–G5 / PS3 PPE.',
    tags: ['risc', 'ldst', 'scalar', 'simd', 'weak'],
  },
  {
    name: 'SPARC',
    blurb:
      'Sun\'s RISC. Famous for register windows: each call rotates the visible 32-register window through a larger physical file. Eliminates most argument-passing spills at the cost of context-switch state.',
    tags: ['risc', 'ldst', 'scalar', 'tso'],
  },
  {
    name: 'DEC Alpha',
    blurb:
      'First mainstream 64-bit ISA (1992). Aggressively clean. The weakest memory model of any commercial architecture — almost everything could reorder. Killed by economics, not engineering.',
    tags: ['risc', 'ldst', 'scalar', 'weak'],
  },
  {
    name: 'IBM Z (z/Architecture)',
    blurb:
      'Mainframe CISC. 64-bit descendant of System/360 (1964). Decimal arithmetic, vector facility, pervasive cryptography in-ISA, sequential consistency for legacy code, fault-tolerant from the silicon up.',
    tags: ['cisc', 'regmem', 'scalar', 'simd', 'sc'],
  },
  {
    name: 'Itanium (IA-64)',
    blurb:
      'EPIC: bundles of three instructions with explicit parallelism, predication, and speculation. The compiler did the scheduling. Brilliant idea, hostile to real-world workloads with cache-miss-driven control flow.',
    tags: ['epic', 'vliw', 'ldst', 'scalar', 'rc'],
  },
  {
    name: 'TI C6000 DSP',
    blurb:
      'Pure VLIW. Eight functional units, fetch packets of eight 32-bit instructions executed in parallel. No hazard hardware — the compiler is responsible for not stepping on itself.',
    tags: ['vliw', 'ldst', 'scalar', 'rc'],
  },
  {
    name: '6502',
    blurb:
      'Accumulator architecture (1975). One A register, two index regs (X, Y). Variable-length instructions, no general MUL/DIV. Drove the Apple II, NES, Commodore 64, and BBC Micro.',
    tags: ['cisc', 'acc', 'scalar', 'sc'],
  },
  {
    name: 'JVM bytecode',
    blurb:
      'Stack machine. Operands implicit on the operand stack. Designed for portability and compact bytecode verification, not raw speed. JIT-compiled to register-based machine code at runtime.',
    tags: ['misc', 'stack', 'scalar', 'sc'],
  },
  {
    name: 'WebAssembly',
    blurb:
      'Modern stack machine bytecode targeting both browsers and standalone runtimes. Structured control flow, statically typed locals, no raw pointers — designed for safe compilation to native or sandboxed execution.',
    tags: ['misc', 'stack', 'scalar', 'sc'],
  },
  {
    name: 'subleq (OISC)',
    blurb:
      'A single instruction: subtract and branch if less-or-equal. Turing-complete. Pedagogically pure; physically impractical because every operation that we usually call free now costs at least one branch.',
    tags: ['oisc', 'regmem', 'scalar', 'sc'],
  },
  {
    name: 'Forth / GreenArrays',
    blurb:
      'Minimal, stack-oriented. The GA144 puts 144 of these tiny machines on a chip — MISC at scale. Astonishing perf-per-watt for embedded signal processing.',
    tags: ['misc', 'stack', 'scalar', 'sc'],
  },
  {
    name: 'NVIDIA SASS / PTX',
    blurb:
      'GPU shader ISA. Wide SIMT, predicated, statically scheduled. PTX is the user-visible virtual ISA; SASS is the per-architecture machine ISA. Effectively dataflow under the hood.',
    tags: ['vliw', 'ldst', 'simd', 'flow', 'rc'],
  },
  {
    name: 'AMD GCN / RDNA',
    blurb:
      'AMD GPU ISA. Wave-front SIMD with scalar + vector lanes. Scalar lane handles control flow and uniform values; vector lanes do the parallel work. Distinct from NVIDIA in that the scalar lane is exposed in the ISA.',
    tags: ['risc', 'ldst', 'simd', 'flow', 'rc'],
  },
  {
    name: 'Intel AMX · Apple AMX · ARM SME',
    blurb:
      'Matrix tile extensions. The register file holds 2-D tiles; one instruction multiplies them. Built for transformer math — the abstract machine grew a new register class.',
    tags: ['risc', 'ldst', 'matrix', 'weak'],
  },
  {
    name: 'Cell SPE',
    blurb:
      'PS3-era. Synergistic Processing Elements: in-order, dual-issue, software-managed local store. RISC load-store with vector everything; an early demonstration of explicit-DMA accelerators.',
    tags: ['risc', 'ldst', 'simd', 'weak'],
  },
  {
    name: 'Google TPU MXU',
    blurb:
      'Domain-specific systolic array. The MXU is a 128×128 8-bit multiply-accumulate fabric exposed through a small instruction set centered on matrix multiply, transpose, and activation. Dataflow inside, control-flow outside.',
    tags: ['risc', 'ldst', 'matrix', 'flow', 'rc'],
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
        <div className="marker">four axes · {ISAS.length} real ISAs</div>
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

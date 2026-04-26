import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Evolution — six decades of ISA history on a single horizontal axis.
 * Hover or focus a marker to see what that machine introduced. Era bands
 * underneath show the dominant idea of each period.
 */

const RANGE = { start: 1960, end: 2030 };
const SPAN = RANGE.end - RANGE.start;

const ERAS = [
  { from: 1960, to: 1980, label: 'CISC genesis · microcode is king' },
  { from: 1980, to: 1995, label: 'RISC wars · simplicity wins clock speed' },
  { from: 1995, to: 2010, label: 'OoO + speculation · ILP plateau' },
  { from: 2010, to: 2026, label: 'mobile + open + accelerated' },
];

const MARKS = [
  {
    year: 1964,
    name: 'IBM System/360',
    family: 'CISC',
    blurb:
      'Defined the modern notion of an "architecture" — a stable contract decoupled from the implementation. Same ISA, multiple speed/price points.',
  },
  {
    year: 1971,
    name: 'Intel 4004',
    family: 'CISC',
    blurb:
      'First commercial microprocessor. 4-bit, 92,000 instructions/sec. Less compute than a single modern μop, but it kicked off everything.',
  },
  {
    year: 1975,
    name: 'MOS 6502',
    family: 'accumulator',
    blurb:
      'Cheap, accumulator-based. Drove the Apple II, Commodore 64, NES. Showed that an ISA can be a market force, not just a spec.',
  },
  {
    year: 1978,
    name: 'Intel 8086',
    family: 'CISC · variable',
    blurb:
      '16-bit, segmented memory, variable-length encoding. Every x86 chip since carries its bones — including the prefix bytes.',
  },
  {
    year: 1981,
    name: 'IBM 801 / Berkeley RISC',
    family: 'RISC',
    blurb:
      'Patterson, Sequin, Cocke argue: simpler instructions, more registers, single-cycle execution beats microcode at the same transistor budget.',
  },
  {
    year: 1985,
    name: 'MIPS R2000 · ARM1',
    family: 'RISC · load-store',
    blurb:
      'First commercial RISC chips. Fixed-width 32-bit, load-store, three-operand. Set the template every modern ISA still follows.',
  },
  {
    year: 1992,
    name: 'DEC Alpha',
    family: 'RISC · 64-bit',
    blurb:
      'First mainstream 64-bit ISA. Aggressively clean. Killed by economics, not engineering.',
  },
  {
    year: 1996,
    name: 'MMX / SSE',
    family: 'SIMD bolt-on',
    blurb:
      'x86 grafts SIMD onto an integer-first ISA. Begins the era of multimedia and DSP work moving onto the CPU.',
  },
  {
    year: 2001,
    name: 'Itanium (IA-64)',
    family: 'EPIC · VLIW',
    blurb:
      'The compiler bundles three instructions into a 128-bit word. Predication, speculation, explicit parallelism. Brilliant idea, hostile to real workloads.',
  },
  {
    year: 2003,
    name: 'AMD64 (x86-64)',
    family: 'CISC · 64-bit',
    blurb:
      'AMD extends x86 to 64 bits and doubles the GPRs. Backwards-compatible, pragmatic, and decisively wins the war Itanium meant to start.',
  },
  {
    year: 2011,
    name: 'ARMv8 / AArch64',
    family: 'RISC · 64-bit',
    blurb:
      'Clean 64-bit redesign. 31 GPRs, fixed encoding, weak ordering, pointer authentication. The architecture that would unseat x86 on the desktop a decade later.',
  },
  {
    year: 2010,
    name: 'RISC-V',
    family: 'open · modular RISC',
    blurb:
      'Berkeley publishes a small base ISA (RV32I/RV64I) plus optional extensions. Royalty-free. Becomes the lingua franca of academic and open silicon.',
  },
  {
    year: 2017,
    name: 'NVIDIA Tensor Cores',
    family: 'matrix accelerator',
    blurb:
      'GPU ISA gains matrix multiply-accumulate as a primitive. The transformer era starts here.',
  },
  {
    year: 2020,
    name: 'Intel AMX · Apple AMX',
    family: 'matrix tile ISA',
    blurb:
      'CPU register files learn to hold 2-D tiles. One instruction multiplies them. Dense linear algebra moves back onto the CPU.',
  },
  {
    year: 2023,
    name: 'ARM SME · RISC-V V',
    family: 'length-agnostic vector',
    blurb:
      'Vector length leaves the ISA — code runs unchanged on 128-bit and 2048-bit implementations. The vector machine, finally portable.',
  },
];

export default function Evolution() {
  const [active, setActive] = useState(MARKS.findIndex((m) => m.year === 2010));

  const m = MARKS[active];

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">six decades · one axis</div>
        <div
          className="marker tabular-nums"
          style={{ color: 'var(--ink-faint)' }}
        >
          {RANGE.start} → {RANGE.end}
        </div>
      </div>

      <div className="px-5 pb-2 pt-7">
        {/* era bands */}
        <div className="relative h-7 w-full">
          {ERAS.map((era) => {
            const left = ((era.from - RANGE.start) / SPAN) * 100;
            const width = ((era.to - era.from) / SPAN) * 100;
            return (
              <div
                key={era.label}
                className="absolute top-0 flex h-full items-center px-2 text-[9px] uppercase tracking-[0.22em]"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background:
                    'linear-gradient(180deg, var(--bg-soft), transparent)',
                  borderLeft: '1px solid var(--rule)',
                  color: 'var(--ink-faint)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={era.label}
              >
                {era.label}
              </div>
            );
          })}
        </div>

        {/* axis */}
        <div className="relative mt-1 h-20 w-full">
          <div
            className="absolute left-0 right-0 top-1/2 h-px"
            style={{ background: 'var(--rule-strong)' }}
          />
          {/* decade ticks */}
          {[1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030].map((y) => {
            const left = ((y - RANGE.start) / SPAN) * 100;
            return (
              <div
                key={y}
                className="absolute top-1/2 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <div
                  className="h-2 w-px"
                  style={{ background: 'var(--rule-strong)' }}
                />
                <div
                  className="mt-1 marker text-[9px]"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {y}
                </div>
              </div>
            );
          })}
          {/* marks */}
          {MARKS.map((mark, i) => {
            const left = ((mark.year - RANGE.start) / SPAN) * 100;
            const isActive = i === active;
            return (
              <button
                key={`${mark.year}-${mark.name}`}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none"
                style={{ left: `${left}%` }}
                aria-label={`${mark.year} ${mark.name}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    background: isActive
                      ? 'var(--accent-1)'
                      : 'var(--ink-faint)',
                  }}
                  transition={{ duration: 0.18 }}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: 'var(--ink-faint)' }}
                />
                {isActive ? (
                  <motion.div
                    layoutId="evo-pulse"
                    className="absolute -inset-2 rounded-full"
                    style={{ border: '1px solid var(--accent-1)' }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="border-t px-5 py-5"
        style={{ borderColor: 'var(--rule)', background: 'var(--bg-soft)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${m.year}-${m.name}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <div
                  className="display text-2xl"
                  style={{ color: 'var(--ink)' }}
                >
                  {m.name}
                </div>
                <div
                  className="marker mt-1"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {m.family}
                </div>
              </div>
              <div
                className="display text-3xl tabular-nums"
                style={{ color: 'var(--accent-1)' }}
              >
                {m.year}
              </div>
            </div>
            <p
              className="mt-3 max-w-3xl text-sm leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              {m.blurb}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

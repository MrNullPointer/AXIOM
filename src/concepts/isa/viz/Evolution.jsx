import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Evolution — six decades of ISA history on a single horizontal axis.
 *
 * Interactive: hover or click any marker to read its blurb; use the
 * prev/next buttons or arrow keys to walk chronologically; toggle family
 * chips to dim irrelevant markers and focus on one lineage.
 */

const RANGE = { start: 1960, end: 2030 };
const SPAN = RANGE.end - RANGE.start;

const ERAS = [
  { from: 1960, to: 1980, label: 'CISC genesis · microcode is king' },
  { from: 1980, to: 1995, label: 'RISC wars · simplicity wins clock speed' },
  { from: 1995, to: 2010, label: 'OoO + speculation · ILP plateau' },
  { from: 2010, to: 2026, label: 'mobile · open · accelerated' },
  { from: 2026, to: 2030, label: 'matrix · confidential · post-Moore' },
];

const MARKS = [
  { year: 1964, name: 'IBM System/360', family: 'CISC',
    blurb: 'Defined the modern notion of an "architecture" — a stable contract decoupled from the implementation. Same ISA, multiple speed/price points. Microcode let the contract span machines from the slow Model 30 to the fast Model 75.' },
  { year: 1971, name: 'Intel 4004', family: 'CISC',
    blurb: 'First commercial microprocessor. 4-bit, 92 kIPS, 2,300 transistors. Less compute than a single modern μop, but it kicked off everything that came after.' },
  { year: 1975, name: 'MOS 6502', family: 'accumulator',
    blurb: 'Cheap, accumulator-based. Drove the Apple II, Commodore 64, NES, BBC Micro, Atari 2600. Showed that an ISA can be a market force, not just a spec.' },
  { year: 1978, name: 'Intel 8086', family: 'CISC',
    blurb: '16-bit, segmented memory, variable-length encoding. Every x86 chip since carries its bones — including the prefix bytes, the AX/BX/CX/DX register naming, and the segment/offset addressing model.' },
  { year: 1981, name: 'IBM 801 / Berkeley RISC', family: 'RISC',
    blurb: 'Patterson, Sequin, Cocke argue: simpler instructions, more registers, single-cycle execution beats microcode at the same transistor budget. The seed of every modern load-store ISA.' },
  { year: 1985, name: 'MIPS R2000 · ARM1', family: 'RISC',
    blurb: 'First-wave commercial RISC chips (R2000 shipped 1986; ARM1 was an Acorn test chip in 1985). Fixed-width 32-bit, load-store, three-operand. Set the template every modern ISA still follows.' },
  { year: 1986, name: 'SPARC', family: 'RISC',
    blurb: 'Sun Microsystems\' RISC. Famous for register windows that rotate the visible 32-register set on each call, eliminating most argument-passing spills at the cost of context-switch state.' },
  { year: 1992, name: 'DEC Alpha', family: 'RISC',
    blurb: 'First mainstream 64-bit ISA. Aggressively clean, weakest commercial memory model ever shipped. Killed by Compaq\'s acquisition and the rise of x86 server economics, not by engineering.' },
  { year: 1996, name: 'MMX / SSE', family: 'SIMD',
    blurb: 'x86 grafts SIMD onto an integer-first ISA. Begins the era of multimedia and DSP work moving onto the CPU instead of dedicated coprocessors.' },
  { year: 2001, name: 'Itanium (IA-64)', family: 'EPIC',
    blurb: 'The compiler bundles three instructions into a 128-bit word. Predication, speculation, explicit parallelism. Brilliant idea, hostile to real workloads with cache-miss-driven control flow. Last shipped 2017.' },
  { year: 2003, name: 'AMD64 (x86-64)', family: 'CISC',
    blurb: 'AMD extends x86 to 64 bits and doubles the GPRs (RAX–R15). Backwards-compatible, pragmatic, and decisively wins the war Itanium meant to start. Intel adopts it as Intel 64 in 2004.' },
  { year: 2010, name: 'RISC-V', family: 'RISC',
    blurb: 'Berkeley publishes a small base ISA (RV32I/RV64I) plus optional extensions. Royalty-free. Becomes the lingua franca of academic silicon, embedded controllers, and a growing list of accelerators.' },
  { year: 2011, name: 'ARMv8 / AArch64', family: 'RISC',
    blurb: 'Clean 64-bit redesign. 31 GPRs, fixed encoding, weak ordering, exception levels EL0–EL3. The architecture that would unseat x86 on Apple\'s Mac line a decade later with the M-series.' },
  { year: 2017, name: 'NVIDIA Volta · Tensor Cores', family: 'matrix',
    blurb: 'GPU ISA gains matrix multiply-accumulate as a primitive (4×4×4 in V100, scaling up since). The transformer era starts here.' },
  { year: 2017, name: 'ARMv8.3 PAC', family: 'security',
    blurb: 'Pointer Authentication: the ISA grows new instructions to sign and verify pointers using a tweakable PAC, mitigating ROP/JOP. Followed by BTI (8.5), MTE (8.5), and SCTLR2 / GPC (8.7+).' },
  { year: 2020, name: 'Apple M1 · Intel/Apple AMX', family: 'matrix',
    blurb: 'CPU register files learn to hold 2-D tiles. One instruction multiplies them. Dense linear algebra moves back onto the CPU; Apple ships M1 with a private AMX coprocessor exposed only to vendor libraries.' },
  { year: 2021, name: 'RISC-V V 1.0', family: 'vector',
    blurb: 'The Vector extension is ratified. Vector length leaves the ISA — the same binary runs on a 128-bit microcontroller and a 4096-bit server core unchanged. The classic Cray vector machine, finally portable.' },
  { year: 2023, name: 'ARMv9.2 · SVE2 · SME', family: 'matrix',
    blurb: 'Scalable Matrix Extension adds streaming-mode tile registers. Combined with SVE2 length-agnostic vectors and confidential-compute (CCA, RME), the contract picks up matrix and security columns in the same generation.' },
  { year: 2024, name: 'AVX10 · APX', family: 'CISC',
    blurb: 'Intel converges AVX-512 features onto a unified AVX10 across P- and E-cores, and APX expands GPRs from 16 to 32 with a new REX2 prefix. The first real expansion of the architectural register file in x86-64\'s 21-year history.' },
  { year: 2025, name: 'Confidential compute (TDX · SEV-SNP · CCA)', family: 'security',
    blurb: 'The contract grows a third axis beyond user/kernel: hardware-enforced confidential VMs whose state is encrypted in memory and whose attestation lives in the ISA. The OS is no longer the highest-trust party.' },
];

const FAMILIES = ['CISC', 'RISC', 'accumulator', 'EPIC', 'SIMD', 'vector', 'matrix', 'security'];

export default function Evolution() {
  const [active, setActive] = useState(MARKS.findIndex((m) => m.year === 2010));
  const [families, setFamilies] = useState(new Set(FAMILIES));

  const m = MARKS[active];

  // arrow-key navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActive((i) => Math.min(MARKS.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleFamily = (f) => {
    setFamilies((curr) => {
      const next = new Set(curr);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">six decades · one axis · ← / → to walk</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Previous milestone"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <ChevronLeft size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setActive((i) => Math.min(MARKS.length - 1, i + 1))}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Next milestone"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <ChevronRight size={12} aria-hidden="true" />
          </button>
          <div className="marker tabular-nums ml-2" style={{ color: 'var(--ink-faint)' }}>
            {RANGE.start} → {RANGE.end}
          </div>
        </div>
      </div>

      {/* family filter */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <span className="marker mr-2" style={{ color: 'var(--ink-faint)' }}>filter</span>
        {FAMILIES.map((f) => {
          const on = families.has(f);
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggleFamily(f)}
              className="marker rounded-full border px-2 py-1 text-[10px] transition-colors"
              style={{
                borderColor: on ? 'var(--ink)' : 'var(--rule-strong)',
                color: on ? 'var(--ink)' : 'var(--ink-faint)',
                background: on ? 'var(--bg-soft)' : 'transparent',
              }}
            >
              {f}
            </button>
          );
        })}
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
                  background: 'linear-gradient(180deg, var(--bg-soft), transparent)',
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
          <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: 'var(--rule-strong)' }} />
          {[1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030].map((y) => {
            const left = ((y - RANGE.start) / SPAN) * 100;
            return (
              <div key={y} className="absolute top-1/2 -translate-x-1/2" style={{ left: `${left}%` }}>
                <div className="h-2 w-px" style={{ background: 'var(--rule-strong)' }} />
                <div className="mt-1 marker text-[9px]" style={{ color: 'var(--ink-faint)' }}>{y}</div>
              </div>
            );
          })}
          {MARKS.map((mark, i) => {
            const left = ((mark.year - RANGE.start) / SPAN) * 100;
            const isActive = i === active;
            const visible = families.has(mark.family);
            return (
              <button
                key={`${mark.year}-${mark.name}`}
                type="button"
                onMouseEnter={() => visible && setActive(i)}
                onFocus={() => visible && setActive(i)}
                onClick={() => visible && setActive(i)}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 outline-none"
                style={{
                  left: `${left}%`,
                  opacity: visible ? 1 : 0.2,
                  cursor: visible ? 'pointer' : 'default',
                }}
                aria-label={`${mark.year} ${mark.name}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    background: isActive ? 'var(--accent-1)' : 'var(--ink-faint)',
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
                <div className="display text-2xl" style={{ color: 'var(--ink)' }}>{m.name}</div>
                <div className="marker mt-1" style={{ color: 'var(--ink-faint)' }}>{m.family}</div>
              </div>
              <div className="display text-3xl tabular-nums" style={{ color: 'var(--accent-1)' }}>
                {m.year}
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {m.blurb}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

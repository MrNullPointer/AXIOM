// Deep-dive content for the ISA concept page. Pure data — the page template
// renders these sections in order, each with its own animation slot.

export const content = {
  problem: {
    title: 'The contract',
    paragraphs: [
      'Two parties — the compiler that emits instructions and the silicon that executes them — must agree on what an instruction means without renegotiating each time. Without a stable contract, neither side can evolve without breaking the other.',
      'The ISA is that contract. It names the registers, defines the shape of every opcode, declares what addressing modes exist, prescribes a memory ordering model, and lists the privileged operations that the OS depends on.',
    ],
    aside: [
      { label: 'opcodes', value: 'finite, named, sized' },
      { label: 'registers', value: 'count, width, naming' },
      { label: 'addressing', value: 'direct, indirect, indexed…' },
      { label: 'memory model', value: 'what other cores can observe' },
      { label: 'privilege', value: 'rings, exceptions, traps' },
    ],
  },

  mechanism: {
    title: 'Same operation, three contracts',
    paragraphs: [
      'The visualization below shows one operation — `add x5, x6, x7` — encoded under three different rule books. Hover any field name to track how that field travels across architectures. Same logical add, wildly different bits.',
      'Variable-length encodings (x86) trade decode complexity for code density; fixed-length encodings (ARM, RISC-V) trade density for trivially parallel decode. Both choices are right; they just optimize for different things.',
    ],
    visualizerSlot: 'isa-encoding',
  },

  tradeoffs: {
    title: 'The contract sets ceilings',
    paragraphs: [
      'Decode width caps front-end IPC — a 1–15 byte encoding is harder to fan out than a 4-byte one, so x86 cores invest heavily in μop caches to amortize the cost. Rich addressing modes hide work inside one instruction; simple modes externalize it. Privilege rings, capability instructions, and pointer authentication all live in the contract — the silicon only enforces what the ISA defines.',
    ],
    lenses: {
      performance: 'Decode width and instruction density set the ceiling on front-end throughput.',
      power: 'Simpler decode and fewer mode bits cost less energy per instruction. The "RISC tax" was real — and so was the "CISC tax."',
      area: 'Microcoded complexity buys feature breadth at the cost of die area and verification surface.',
      security: 'Privilege rings, capability instructions, and pointer authentication all live here.',
    },
  },

  lineages: {
    title: 'Three living lineages',
    rows: [
      {
        name: 'ARM (AArch64)',
        kicker: 'fixed · load–store · weak',
        body: '32-bit fixed encoding, load/store architecture, 31 GPRs, weak memory model. Modern parts add pointer authentication and Memory Tagging Extension.',
      },
      {
        name: 'x86-64',
        kicker: 'variable · two-operand · TSO',
        body: '1–15 byte encoding, two-operand form, rich addressing modes, strong (TSO) memory ordering. Decades of legacy modes layered on for backwards compatibility.',
      },
      {
        name: 'RISC-V',
        kicker: 'open · modular · fixed',
        body: 'Small base ISA (RV64I) plus optional extensions (M, A, F, D, C, V). Designed for academic clarity and composability rather than density.',
      },
    ],
  },
};

// Deep-dive content for the ISA concept page. Pure data — the page template
// renders these sections in order, each with its own animation slot.
//
// Sections marked optional (physics, operands, taxonomy, ordering, evolution)
// are only rendered when present, so other concepts using ConceptPage stay
// unchanged.

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

  physics: {
    title: 'From electrons to opcodes',
    paragraphs: [
      'Below the contract there is no "instruction". There is only charge. Strip a transistor down to its physical reality and it is a doped silicon channel whose conductivity bends to a gate voltage. Push the gate above its threshold and electrons drift; drop below and the channel pinches off. That is the only primitive silicon offers — a switch.',
      'Wire millions of those switches into NAND, NOR, XOR. NAND alone is functionally complete: it can synthesise every Boolean function the CPU will ever evaluate. Wire those gates into latches that hold state, and latches into eight-wide registers that name state. Now the chip can not only compute — it can remember.',
      'An instruction is the smallest voltage change an architect agreed to call meaningful. The five-rung ladder below makes the path explicit: drift, switch, gate, register, opcode. Each layer is just a denser interpretation of the layer beneath it. Hover a layer to freeze it.',
    ],
    visualizerSlot: 'isa-physics',
  },

  mechanism: {
    title: 'Same operation, three contracts',
    paragraphs: [
      'Once we have an opcode, the next question is: what shape does it take? The visualization below shows one operation — `add x5, x6, x7` — encoded under three different rule books. Hover any field name to track how that field travels across architectures. Same logical add, wildly different bits.',
      'Variable-length encodings (x86) trade decode complexity for code density; fixed-length encodings (ARM, RISC-V) trade density for trivially parallel decode. Both choices are right; they just optimize for different things.',
    ],
    visualizerSlot: 'isa-encoding',
  },

  operands: {
    title: 'How many operands does an instruction have?',
    paragraphs: [
      'The first axis along which ISAs split is operand count — how many places an instruction is allowed to name. A pure stack machine names zero; an accumulator machine names one; x86 names two; RISC machines name three. Same arithmetic, very different code.',
      'Watch the same expression `(a + b) × c` compile under each contract. Implicit operands (stack, accumulator) buy code density but force a sequential dependency through an architectural register. Explicit operands (RISC) cost bytes but expose independence — every load can issue in parallel, every result can sit in its own register, every dependency is named.',
      'This is why the front end of a modern x86 core spends so many transistors converting two-operand ops into RISC-style three-operand μops internally: pipelines like seeing the dependencies, and the only way to see them is to name them.',
    ],
    visualizerSlot: 'isa-operands',
  },

  taxonomy: {
    title: 'The family tree',
    paragraphs: [
      'Every ISA picks a position along four orthogonal axes: how much each instruction does (complexity), where its operands live (storage), what data shape the hardware understands natively, and what other observers are allowed to see (memory ordering).',
      'Most popular ISAs cluster around RISC + load-store + scalar + weak. The interesting machines are the outliers: stack VMs that traded speed for portability, EPIC that bet on the compiler, dataflow GPUs whose program counter is implicit, matrix tile ISAs that put 2-D operands in the register file because transformers needed them.',
      'Adjust the chips below to walk the matrix. Each combination resolves to the real ISAs that occupy that intersection — and the empty cells say something about which trade-offs hardware never seems to actually want.',
    ],
    visualizerSlot: 'isa-taxonomy',
  },

  ordering: {
    title: 'What can other cores see?',
    paragraphs: [
      'A single-core ISA only owes you sequential semantics for your own instructions. Add a second core and the contract has to grow a clause: when this core writes X and that one reads X, what is allowed? The answer is the memory model, and it differs more between popular ISAs than almost anything else in this concept page.',
      'Sequential consistency is the strongest guarantee — there exists a single global interleaving of every memory operation consistent with each core\'s program order. It is the easiest to reason about, and the hardest to implement quickly.',
      'x86\'s Total Store Ordering parks each core\'s stores in a private buffer that drains to memory eventually, so two cores can each fire their loads before either store is globally visible. The infamous (0,0) outcome below is legal x86. ARM and RISC-V go further still: almost any reordering is fair game until you insert a fence.',
      'The same two-line program produces different observable behaviours under each model. The visualizer below runs it under all three.',
    ],
    visualizerSlot: 'isa-ordering',
  },

  tradeoffs: {
    title: 'The contract sets ceilings',
    paragraphs: [
      'Decode width caps front-end IPC — a 1–15 byte encoding is harder to fan out than a 4-byte one, so x86 cores invest heavily in μop caches to amortize the cost. Rich addressing modes hide work inside one instruction; simple modes externalize it. Privilege rings, capability instructions, and pointer authentication all live in the contract — the silicon only enforces what the ISA defines.',
    ],
    lenses: {
      performance:
        'Decode width and instruction density set the ceiling on front-end throughput. Three-operand naming exposes parallelism the back end can actually exploit.',
      power:
        'Simpler decode and fewer mode bits cost less energy per instruction. The "RISC tax" was real — and so was the "CISC tax."',
      area:
        'Microcoded complexity buys feature breadth at the cost of die area and verification surface. Modular ISAs (RISC-V) defer the cost to the implementer.',
      security:
        'Privilege rings, capability instructions, pointer authentication, and memory tagging all live here. The silicon enforces only what the ISA defines.',
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

  evolution: {
    title: 'Six decades of contract revision',
    paragraphs: [
      'The ISA design space has been walked, mostly, from the corners inward. CISC came first because microcode was cheaper than compilers. RISC arrived once compilers caught up and clock speed mattered more than code density. EPIC bet that compilers had caught up enough to schedule instructions statically — a bet that lost. Modern ARM/RISC-V look RISC because the compiler problem was won, and modern x86 looks RISC inside because the front end translates everything to μops anyway.',
      'The frontier today is not scalar throughput. It is data shape: vector lengths becoming length-agnostic, matrix tiles entering the register file, neural ops becoming a primitive. The contract is still being rewritten — just at a different layer.',
    ],
    visualizerSlot: 'isa-evolution',
  },
};

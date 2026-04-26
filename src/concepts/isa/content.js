// Deep-dive content for the ISA concept page. Pure data — the page template
// renders these sections in order, each with its own animation slot.
//
// Sections marked optional (physics, state, operands, taxonomy, ordering,
// evolution) are only rendered when present, so other concepts using
// ConceptPage stay unchanged.
//
// Style guide for this file:
//   • First-principles narrative, layered from physics to product.
//   • Expand every acronym on first use within a section.
//   • Quantitative trade-offs whenever they exist.
//   • No marketing prose, no decorative bullets.

export const content = {
  /* --------------------------------------------------------------- *
   * 01 · The Contract
   * --------------------------------------------------------------- */
  problem: {
    title: 'The contract between hardware and software',
    paragraphs: [
      'An Instruction Set Architecture (ISA) is the formal agreement that lets a compiler emit bytes today and a CPU built ten years from now still understand them. It is not the silicon, and it is not the program — it is the abstract machine that sits between, frozen in a specification document so that both sides can evolve independently.',
      'Concretely, an ISA fixes seven things: (1) the named state a program can observe — general-purpose registers, a program counter, status flags, and any control / status registers (CSRs) the OS depends on; (2) the encoding of every instruction — opcode bits, operand fields, and any prefixes or suffixes; (3) the address space — endianness, alignment rules, and the layout of virtual memory; (4) the calling convention boundary — which registers are caller-saved versus callee-saved, how arguments and return values move; (5) the memory consistency model — what a second observer is allowed to see; (6) the exception and privilege model — rings or exception levels, how interrupts are taken, what the OS can do that user code cannot; and (7) the optional extension surface — vector, floating-point, atomic, cryptographic instructions and how a program asks the chip whether it has them.',
      'Everything else — pipeline depth, branch predictor, cache geometry, voltage rails, the number of execution ports — is an implementation detail. The same ISA can be a 25 mm² in-order microcontroller running at 100 MHz on five milliwatts, or a 600 mm² out-of-order monster pushing 6 GHz at 250 W. As long as both honor the contract, software cannot tell them apart except through performance.',
      'This separation is why the ISA matters out of all proportion to its size. The x86 ISA is roughly 1,500 instructions documented across thousands of pages, but the contract it represents is a forty-year compatibility commitment that pins what every Intel and AMD core has had to support since 1986. Break the contract and a billion compiled binaries stop working.',
    ],
    aside: [
      { label: 'state', value: 'GPRs · PC · flags · CSRs · vector regs' },
      { label: 'encoding', value: 'opcode + fields + prefixes' },
      { label: 'addressing', value: 'endianness · alignment · VA layout' },
      { label: 'ABI', value: 'caller / callee saves · arg passing' },
      { label: 'memory model', value: 'what a second core may observe' },
      { label: 'privilege', value: 'rings · ELs · M/S/U modes · traps' },
      { label: 'extensions', value: 'V · SVE · AMX · crypto · atomics' },
    ],
  },

  /* --------------------------------------------------------------- *
   * 02 · From electrons to opcodes
   * --------------------------------------------------------------- */
  physics: {
    title: 'From electrons to opcodes',
    paragraphs: [
      'Below the contract there is no "instruction". There is only charge. Strip a transistor down to its physical reality and it is a doped silicon channel whose conductivity bends to a gate voltage. Push the gate above its threshold (Vth ≈ 0.3 V on a modern FinFET, falling toward 0.2 V on gate-all-around nodes) and electrons drift through the inversion layer, saturating around v_sat ≈ 10⁵ m/s. Drop below threshold and the channel pinches off — leakage falls roughly an order of magnitude per ~80 mV of swing. That is the only primitive silicon offers: a switch with a soft transition, paid for in CV²f energy every time it flips.',
      'A complementary metal-oxide-semiconductor (CMOS) NAND2 gate uses exactly four transistors — two PMOS in parallel pulling the output up, two NMOS in series pulling it down. NAND alone is functionally complete: every Boolean function the CPU will ever evaluate decomposes into a tree of NANDs. Wire those gates into cross-coupled latches that hold state, and latches into eight-wide registers that name state. Now the chip can not only compute — it can remember.',
      'An instruction is the smallest voltage change an architect agreed to call meaningful. Above the contract line, the compiler sees `add x5, x6, x7`. Below it, those nine characters resolve into a 32-bit constant routed to the decoder, which fans out enable signals to an adder, whose carry chain settles in roughly a hundred picoseconds, whose result is captured by a register file write port at the next clock edge. The five-rung ladder below makes the path explicit: drift → switch → gate → register → opcode. Each layer is just a denser interpretation of the layer beneath it. Hover a layer to freeze it.',
    ],
    visualizerSlot: 'isa-physics',
  },

  /* --------------------------------------------------------------- *
   * 03 · Programmer-visible state (NEW)
   * --------------------------------------------------------------- */
  state: {
    title: 'Programmer-visible state',
    paragraphs: [
      'The first thing a programmer ever sees of an ISA is its state — the named bits the contract guarantees will exist. This state is the abstract machine\'s memory in the formal sense: any program is a finite sequence of transformations from one state to another, and the ISA defines exactly which fields those transformations are allowed to read and write.',
      'Three buckets matter. The general-purpose register file (GPRs) names the working set: 16 64-bit registers in x86-64 (RAX–R15), 31 in AArch64 (X0–X30, with X31 doubling as the zero register or stack pointer depending on instruction), 32 in RISC-V (x0–x31, with x0 hardwired to zero). Wider register files cost more rename storage but reduce spill traffic to the stack. The program counter (PC) names the instruction stream — sometimes architecturally writable (ARM allowed direct PC writes in A32; AArch64 removed that and forces explicit branch instructions). And the status / control surface — x86\'s RFLAGS, ARM\'s NZCV condition flags and PSTATE, RISC-V\'s CSR address space — exposes the flags and configuration the OS and exception handlers depend on.',
      'Above that base, modern ISAs add architectural state for vectors, predicates, matrix tiles, transactional memory, and key-derivation. Each addition is a new column in the context-switch save area: every register the ISA exposes is a register the kernel must save and restore on a context switch, which is why ABI authors fight hard before letting new state in.',
      'Privilege is also state. x86 separates user (ring 3) from kernel (ring 0) with rings 1 and 2 effectively unused. ARMv8 defines four exception levels — EL0 (user), EL1 (kernel), EL2 (hypervisor), EL3 (secure monitor) — with different banked registers per level. RISC-V uses three modes: U (user), S (supervisor), M (machine), with H (hypervisor) added as an extension. The privilege bit is what makes a CPU more than a calculator: it is what lets an OS hold the keys to memory mapping, interrupt vectors, and I/O.',
    ],
    visualizerSlot: 'isa-state',
  },

  /* --------------------------------------------------------------- *
   * 04 · Mechanism — the encoding
   * --------------------------------------------------------------- */
  mechanism: {
    title: 'Same operation, three contracts',
    paragraphs: [
      'Once we have an opcode, the next question is: what shape does it take in memory? An instruction encoding is a packing problem — the contract reserves bit-fields for an opcode, for the destination register, for the source registers, for any immediate constant, and for any function-modifier bits the opcode family needs. Different ISAs solve the packing problem differently, and their choices ripple all the way through the front end of every CPU that has ever decoded them.',
      'The visualization below shows one operation — `add x5, x6, x7` — encoded under three different rule books. RISC-V uses an R-type layout: funct7[31:25] | rs2[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0], packing two 7-bit function fields around the opcode so that an arithmetic instruction reuses the same 7-bit primary opcode for ADD, SUB, AND, OR, XOR, SLL, SRL, SRA — the funct3 / funct7 fields differentiate them. ARM AArch64 uses a 32-bit fixed encoding too, but with completely different bit-positions: sf|op|S[31:29] | 01011[28:24] | shift[23:22] | 0[21] | Rm[20:16] | imm6[15:10] | Rn[9:5] | Rd[4:0]. Every A64 instruction is exactly four bytes — there is no other option, which is what makes parallel decode so cheap.',
      'x86-64 is the outlier. Its encoding is variable length, anywhere from one byte (a single-byte opcode like NOP) to fifteen (the architectural maximum, set by the prefix-stacking limit). The same arithmetic ADD becomes a REX prefix (0x48, requesting 64-bit operand size) followed by the opcode byte (0x01 for "ADD r/m, r") and a ModR/M byte that encodes the addressing mode in mod[7:6] (11 = register direct), the source register in reg[5:3] (rbx = 011) and the destination register in r/m[2:0] (rax = 000). So `add rax, rbx` is exactly three bytes — but the same instruction with a memory operand or a different addressing mode could be ten.',
      'Variable-length encodings (x86) trade decode complexity for code density: the average x86 instruction is ~4.25 bytes, comparable to ARM\'s flat 4 bytes, but common short forms can be 1–2 bytes, so hot loops can fit in fewer cache lines. Fixed-length encodings (ARM A64, RISC-V without the C extension, MIPS, SPARC) trade density for trivially parallel decode — every instruction starts at a known offset, so the front end can fetch a 32-byte cache line and dispatch eight instructions in one cycle without first finding their boundaries. RISC-V hedges with the optional C (compressed) extension that lets the most common instructions take 16 bits, recovering most of the density at the cost of two-byte alignment.',
      'Hover any field name to track how that field travels across architectures. Same logical add, wildly different bits.',
    ],
    visualizerSlot: 'isa-encoding',
  },

  /* --------------------------------------------------------------- *
   * 05 · Operand count
   * --------------------------------------------------------------- */
  operands: {
    title: 'How many operands does an instruction name?',
    paragraphs: [
      'The first axis along which ISAs split is operand count — how many places an instruction is allowed to name. A pure stack machine names zero; an accumulator machine names one; classical x86 names two; RISC machines name three; some VLIW (Very Long Instruction Word) bundles name many at once. Same arithmetic, very different code.',
      'Watch the same expression `(a + b) × c` compile under each contract. Implicit operands (stack, accumulator) buy code density but force a sequential dependency through one architectural location — every instruction reads and writes the same place, so the data-dependency graph is a straight line. Explicit operands (RISC) cost bytes but expose independence: every load can issue in parallel, every result can sit in its own register, every dependency is named so the out-of-order engine can see it.',
      'This is why the front end of a modern x86 core spends so many transistors converting two-operand ops into RISC-style three-operand μops (micro-operations) internally. Pipelines like seeing the dependencies, and the only way to see them is to name them. The cost is roughly 50–100 KB of μop cache per core (Intel\'s decoded-stream buffer holds ~1,500 μops; AMD\'s op-cache holds ~4,000) so that hot loops bypass the legacy decoders entirely.',
      'A second-order effect: operand count interacts with the calling convention. A three-operand load-store ISA can pass eight integer arguments in registers (System V AMD64 passes six; ARM AAPCS64 passes eight; RISC-V psABI passes eight) without spilling, because there are 30+ registers to draw from. A two-operand register-memory ISA with 16 architectural registers spills earlier and makes the stack hotter — which is exactly the kind of work the renamer hides at runtime.',
    ],
    visualizerSlot: 'isa-operands',
  },

  /* --------------------------------------------------------------- *
   * 06 · Taxonomy
   * --------------------------------------------------------------- */
  taxonomy: {
    title: 'The family tree',
    paragraphs: [
      'Every ISA picks a position along four orthogonal axes: how much each instruction does (complexity), where its operands live (storage), what data shape the hardware understands natively, and what other observers are allowed to see (memory ordering).',
      'Most popular contemporary ISAs cluster around RISC + load-store + scalar/vector + weak. The interesting machines are the outliers: stack VMs that traded speed for portability and verifiability (JVM, WebAssembly), EPIC (Explicitly Parallel Instruction Computing) that bet the compiler could schedule better than the hardware (Itanium, lost), dataflow GPUs whose program counter is implicit (NVIDIA SASS, AMD GCN), matrix-tile ISAs that put 2-D operands directly in the register file because transformer math demanded them (Apple AMX, Intel AMX, ARM SME).',
      'Adjust the chips below to walk the matrix. Each combination resolves to the real ISAs that occupy that intersection — and the empty cells say something about which trade-offs hardware never seems to actually want.',
    ],
    visualizerSlot: 'isa-taxonomy',
  },

  /* --------------------------------------------------------------- *
   * 07 · Memory ordering
   * --------------------------------------------------------------- */
  ordering: {
    title: 'What can other cores see?',
    paragraphs: [
      'A single-core ISA only owes you sequential semantics for your own instructions. Add a second core and the contract has to grow a clause: when this core writes X and that one reads X, what is allowed? The answer is the memory consistency model, and it differs more between popular ISAs than almost anything else in this concept page.',
      'Sequential consistency (SC), defined formally by Lamport in 1979, is the strongest guarantee — there exists a single global interleaving of every memory operation consistent with each core\'s program order. It is the easiest to reason about, and the hardest to implement quickly: every store has to appear globally before the next instruction proceeds, which serializes the store-buffer drain and kills throughput.',
      'x86\'s Total Store Ordering (TSO), formalized in Sewell et al. 2010, parks each core\'s stores in a private FIFO buffer that drains to the cache hierarchy eventually. Loads can bypass the buffer for the same core\'s own stores (store-to-load forwarding) but other cores see a delayed view, so two cores can each fire their loads before either store is globally visible. The infamous (0,0) outcome of the store-buffer test below is legal x86 — any lock-free programmer who has hit it once never forgets. To recover SC behaviour x86 provides MFENCE (full barrier), LFENCE (load-load), and SFENCE (store-store).',
      'ARM (formalized as ARMv8-A memory model) and RISC-V (RVWMO — RISC-V Weak Memory Ordering, ratified 2019) go further. Almost any reordering is fair game: load-load, load-store, store-load, store-store, and even dependent reordering through register renaming. To pin down ordering ARM offers DMB (Data Memory Barrier) with options ISH/ISHST/ISHLD for inner-shareable / store-only / load-only, plus acquire-release loads and stores (LDAR / STLR) that compile cheaply onto release-consistent hardware. RISC-V offers FENCE rw,rw with predecessor/successor sets and the optional Ztso extension that opts a hart into TSO semantics for compatibility.',
      'The same two-line program produces different observable behaviours under each model. The visualizer below runs it under all three and names the fence instruction that would forbid the surprise.',
    ],
    visualizerSlot: 'isa-ordering',
  },

  /* --------------------------------------------------------------- *
   * 08 · Trade-offs (lenses)
   * --------------------------------------------------------------- */
  tradeoffs: {
    title: 'The contract sets ceilings',
    paragraphs: [
      'Every ISA decision propagates outward into latency, bandwidth, energy, area, complexity, and security. Decode width caps front-end IPC (instructions-per-cycle) — a 1–15 byte encoding is harder to fan out than a 4-byte one, which is why x86 cores invest 5–10% of their die area in μop caches to amortize the cost (Intel Sunny Cove\'s decoded-stream buffer is ~1.5K entries; AMD Zen 4\'s op-cache is ~6.75K). Rich addressing modes hide work inside one instruction; simple modes externalize it onto extra instructions. Privilege rings, capability instructions, pointer authentication, and memory tagging all live in the contract — the silicon enforces only what the ISA defines.',
      'A useful rule of thumb: contract complexity costs roughly 5–15% of die area on a wide out-of-order core relative to a clean-slate equivalent. That is the so-called CISC tax, mostly paid by the front end. The corresponding RISC tax — extra instructions to do work that a CISC encoding folds into one — is largely erased by μop fusion and macro-op fusion in modern wide cores, but it shows up sharply in tiny embedded cores where the front end is single-issue and code-cache pressure is real.',
    ],
    lenses: {
      performance:
        'Decode width and instruction density set the ceiling on front-end throughput (instructions-per-cycle). Three-operand naming exposes parallelism the back end can actually exploit: a wide out-of-order core typically issues 6–8 μops/cycle on x86 / Apple silicon, but only when the rename graph is wide enough to feed it. Fixed-width ISAs reach high decode IPC on a smaller transistor budget; variable-width ISAs reach the same IPC by spending those transistors on a μop cache.',
      power:
        'Simpler decode and fewer mode bits cost less energy per instruction. Decode + dispatch on a high-end x86 core is ~25–35 pJ per instruction; on an in-order RISC-V or ARM Cortex-M core it can be sub-5 pJ. The rest of the energy goes to register file, ALU (Arithmetic Logic Unit), data-cache access, and clock distribution — but the ISA decision sets the front-end floor and is one of the few knobs an architect cannot turn without breaking software.',
      area:
        'Microcoded complexity buys feature breadth at the cost of die area, validation surface, and verification effort. A Skylake-class x86 core occupies ~7 mm² on a 14 nm node; a similar-IPC ARM Cortex-X1 occupies ~2.5 mm² on 5 nm. Process shrinks dominate, but the architectural tax is real. Modular ISAs (RISC-V) defer the cost to the implementer — RV32E is single-issue and ~4× smaller than RV32I plus M, A, F, D extensions.',
      compiler:
        'A three-operand load-store ISA lets the compiler\'s register allocator see independence directly — graph-coloring allocators (Chaitin 1982, modern variants in LLVM and GCC) work better when there are 30+ registers and instructions never have implicit destinations. Two-operand and accumulator ISAs force the allocator to insert spills earlier and rely on the back-end renamer to unwind them. Predicated execution (ARM A32, Itanium) lets the compiler turn short branches into straight-line code, which the branch predictor never has to learn.',
      os:
        'The OS lives in the privileged half of the contract. x86 gives it rings 0–3, the IDT (Interrupt Descriptor Table), control registers (CR0/CR2/CR3/CR4), MSRs (Model-Specific Registers), and SYSCALL/SYSRET fast-path instructions. ARMv8 gives it EL0–EL3, the VBAR (Vector Base Address Register), TTBR0/TTBR1 page-table roots, and SVC/HVC/SMC system-call gates. RISC-V gives it U/S/M modes and a clean CSR (Control and Status Register) namespace with mtvec/stvec for trap vectors. Whichever shape, the OS is whoever holds the privileged-mode key and the page-table root.',
      security:
        'Privilege rings, exception levels, capability instructions, pointer authentication (ARMv8.3 PAC), branch-target identification (ARMv8.5 BTI), memory tagging (ARMv8.5 MTE), x86 CET (Control-flow Enforcement Technology) shadow stacks, and Intel TDX / AMD SEV-SNP confidential-compute extensions all live here. The silicon only enforces what the ISA defines: every CVE that ends in "speculative execution" is in some sense a place where the implementation broke the contract by leaking information through a side channel the contract did not name.',
      verification:
        'A formal model of the ISA is the spec the chip is verified against. ARM publishes ASL (Architecture Specification Language); RISC-V uses Sail for its golden model; both feed simulators, fuzzers, and theorem provers. Larger contracts are harder to verify — one reason RISC-V\'s base is deliberately small is so that a formal proof of the base ISA fits in a graduate-student\'s thesis and every extension is verified independently.',
    },
  },

  /* --------------------------------------------------------------- *
   * 09 · Lineages
   * --------------------------------------------------------------- */
  lineages: {
    title: 'Three living lineages',
    rows: [
      {
        name: 'ARM (AArch64)',
        kicker: 'fixed · load–store · weak',
        body:
          '32-bit fixed encoding, 31 general-purpose registers (X0–X30) plus a dedicated zero/SP register, four exception levels (EL0–EL3) with banked SPSR/ELR. Load-store with rich pre/post-indexed addressing. Weak memory ordering with explicit DMB/DSB barriers and acquire/release variants (LDAR/STLR). Modern parts add pointer authentication (PAC, ARMv8.3), Memory Tagging Extension (MTE, ARMv8.5), Branch Target Identification (BTI), and the Scalable Vector Extension SVE/SVE2 plus the Scalable Matrix Extension SME for length-agnostic vector and tile operations.',
      },
      {
        name: 'x86-64',
        kicker: 'variable · two-operand · TSO',
        body:
          '1–15 byte variable-length encoding with REX/VEX/EVEX prefix stacks. Two-operand register-memory form, rich addressing modes (base + index×scale + disp32). 16 general-purpose registers (RAX–R15), four privilege rings (0–3, only 0 and 3 used in practice). Total Store Ordering memory model with MFENCE/LFENCE/SFENCE barriers. Decades of legacy modes layered on for backwards compatibility — real, protected, long; AVX, AVX2, AVX-512, AVX10; SGX, TDX, CET. AMD64\'s 2003 extension doubled GPRs and added PC-relative addressing.',
      },
      {
        name: 'RISC-V',
        kicker: 'open · modular · fixed',
        body:
          'Small base ISA (RV32I or RV64I, 47 base instructions) plus optional standard extensions: M (multiply/divide), A (atomics), F/D/Q (floating-point), C (16-bit compressed), V (vector), B (bit-manipulation), Zicsr (CSRs), Zicntr (counters), H (hypervisor). Open standard, royalty-free. Three privilege modes (M/S/U) plus optional H. RVWMO weak memory model with optional Ztso for x86 binary translation. Designed for academic clarity, formal verifiability (Sail golden model), and composability — implementers ship only the extensions they need.',
      },
    ],
  },

  /* --------------------------------------------------------------- *
   * 10 · Evolution
   * --------------------------------------------------------------- */
  evolution: {
    title: 'Six decades of contract revision',
    paragraphs: [
      'The ISA design space has been walked, mostly, from the corners inward. CISC came first because microcode was cheaper than compilers and DRAM was expensive — every byte of code density saved a memory cycle that a 1965 mainframe could not afford. RISC arrived once compilers caught up, gates got cheap, and clock speed mattered more than code density: the Berkeley RISC, Stanford MIPS, and IBM 801 projects all bet that a compiler with a good register allocator could beat human-written microcode at simpler, single-cycle instructions. EPIC bet that compilers had caught up enough to schedule instructions statically across a deep pipeline — a bet that lost to dynamic out-of-order execution because runtime information (cache misses, branch behaviour, memory latency) is exactly what a static schedule cannot see.',
      'Modern ARM/RISC-V look RISC because the compiler problem was won and silicon has surplus area to spend on out-of-order back ends. Modern x86 looks RISC inside because the front end translates everything to μops anyway — the decoder is the only part that still sees the legacy contract, and even it is shadowed by a μop cache that hides on most hot paths. The real architectural axis since 2010 has not been scalar throughput. It has been data shape: vector lengths becoming length-agnostic (ARM SVE, RISC-V V), matrix tiles entering the register file (Apple AMX, Intel AMX, ARM SME), neural ops becoming a primitive (NVIDIA Tensor Cores, Apple Neural Engine ISAs, Google TPU MXU), and confidential-compute boundaries entering the contract (Intel TDX, AMD SEV-SNP, ARM CCA). The contract is still being rewritten — just at a different layer.',
    ],
    visualizerSlot: 'isa-evolution',
  },
};

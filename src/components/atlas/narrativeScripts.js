/**
 * Per-substage terminal scripts for the cache-miss narrative.
 *
 * Each stage has up to 6 entries — one per substage in the
 * SUBSTAGE_TO_DEPTH = [0, 1, 2, 1, 0, 0] descend/resurface pattern:
 *
 *   0 — L0 BLOCK descending     (frame the question)
 *   1 — L1 CELL descending      (open one level deeper)
 *   2 — L2 ATOMIC deepest       (the physics)
 *   3 — L1 CELL resurfacing     (synthesize what we saw)
 *   4 — L0 BLOCK resurfacing    (scale up · why the cycle cost)
 *   5 — REST                    (card hidden — script unused)
 *
 * Flat stages (intro, recap) only render a single overview viz, so the
 * script for substage 0 is the only one that displays — the substage
 * index is also pinned to 0 by PluckedStage's FLAT_STAGES guard.
 *
 * Lines whose first non-whitespace character is `$` render as a command
 * prompt; lines starting with `→` render as a result; lines starting
 * with `▾` mark "go deeper", `▴` mark "come back up". Plain lines
 * render as muted body text. The terminal types the whole script
 * character-by-character in proportion to subStageT (0..1), so the
 * script length should be tuned to feel comfortable across plausible
 * scroll speeds — short enough that fast scrolling still finishes the
 * thought, long enough that slow reading isn't bored.
 */

export const NARRATIVE_SCRIPTS = {
  // =====================================================================
  // Stage 'intro' — THE TRIP
  //
  // Flat overview. Frame the load instruction and the cliff: 4 cycles
  // best case vs. ~287 cycles when the entire cache hierarchy says no.
  // =====================================================================
  intro: [
    [
      '$ trace ld x1, [x2]',
      '  scenario: cold line · no cache hit',
      '  best path  · L1 hit       →   4 cyc',
      '  slow path  · all miss     → 287 cyc',
      '→ 70× cost · same single byte',
      '  follow it through 7 hops ▾',
    ],
  ],

  // =====================================================================
  // Stage 'issue' — ISSUE
  //
  // Top-down: 5 stages of the in-order pipe → out-of-order issue queue
  //   → the D flip-flop that latches every stage on each clock edge.
  // Bottom-up: latch is two cross-coupled gates · one per RS slot ·
  //   the full pipe runs at 1 IPC → instruction sent to memory.
  // =====================================================================
  issue: [
    [
      '$ pipe ld x1, [x2] --trace',
      '  IF → ID → RR → IS → EX',
      '  one stage per clock edge',
      '→ scheduler dispatches load · 1 cyc',
      '  what schedules it? open the issue queue ▾',
    ],

    [
      '$ inspect issue.queue --xray',
      '  6 reservation stations',
      '  · each waits for 2 ready operands',
      '  · wakeup matrix broadcasts producer tags',
      '  · arbiter picks one ready slot per cycle',
      '  but every slot latches on a clock — ▾',
    ],

    [
      '$ inspect pipeline.reg --device',
      '  master / slave D flip-flop',
      '  · master is transparent while CLK = 1',
      '  · slave drives Q while CLK = 0',
      '  · capture on the falling edge',
      '→ this is how time exists in a CPU.',
    ],

    [
      '$ assemble RS slot ▴',
      '  2 D-FFs latch the operand-ready bits',
      '  CAM cell matches the wakeup tag',
      '→ 1 slot · ready-ready-go · 1 issue/cyc',
    ],

    [
      '$ assemble pipeline ▴',
      '  5 stages · 1 latch boundary each',
      '  pipelining ≠ faster · same latency',
      '  pipelining = busy · 5 in flight per cyc',
      '→ load dispatched · request walks to L1 ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'l1-l2' — L1 / L2 MISS
  //
  // Top-down: L1 misses → why? open the comparator → 6T cell → MOSFET.
  // Bottom-up: cell is 6 of those switches → cache is 512 of those cells
  //            wide, that's why a miss costs 4 cycles, walk to L2.
  // =====================================================================
  'l1-l2': [
    [
      '$ probe l1.d-cache --addr=0x4080',
      '  way 0  tag ≠   way 1  tag ≠',
      '  way 2  tag ≠   way 3  tag ≠',
      '→ MISS · 4 cycles',
      '  why? open the tag comparator ▾',
    ],

    [
      '$ inspect tag.bit[0] --xray',
      '  6T SRAM cell',
      '  · 4 transistors form a latch',
      '  · 2 access transistors (M5, M6)',
      '  · WL high → BL · BL̄ read state',
      '  but each transistor is a switch — ▾',
    ],

    [
      '$ inspect M5 --device-physics',
      '  NMOS · n⁺ source / drain in p-substrate',
      '  poly gate over 1.5 nm SiO₂',
      '  V_GS > V_th (≈ 0.4 V)',
      '  → electrons drift to oxide interface',
      '  → inversion layer forms · channel conducts',
      '→ this is the CMOS switch.',
    ],

    [
      '$ assemble cell ▴',
      '  4 switches build the latch',
      '  2 switches gate the storage node',
      '→ 1 stored bit · 6 transistors · ~120 nm²',
    ],

    [
      '$ assemble cache ▴',
      '  32 KB · 4-way · 64 B lines',
      '  one wordline drives 512 cells',
      '  4 tag comparators fire in parallel',
      '  sense amps settle · result in 4 cycles',
      '→ all 4 missed · walking to L2 ▾▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'bus' — RING BUS
  //
  // Top-down: ring topology → one wire's voltage trace → CMOS inverter
  //   driving that wire (the dynamic-power story).
  // Bottom-up: one driver = 2 switches · the whole bus is many of those
  //   · CV²f per transition · why interconnect dominates power.
  // =====================================================================
  bus: [
    [
      '$ route packet --src=core0 --dst=L3.slice2',
      '  ring · 4 stops · clockwise',
      '  C0 → C1 → C2 → … → C0',
      '→ 1 hop ≈ 1 cycle · 6 hops total',
      '  each hop is a wire transition ▾',
    ],

    [
      '$ scope bus.wire[31] --window=20ns',
      '  voltage swings VDD ↔ GND per bit',
      '  · charge wire · drive 1',
      '  · discharge wire · drive 0',
      '  · slew rate set by driver strength',
      '  what flips that wire? open the driver ▾',
    ],

    [
      '$ inspect driver --device-physics',
      '  CMOS inverter · totem-pole pair',
      '  · PMOS pulls Out → VDD when In = 0',
      '  · NMOS pulls Out → GND when In = 1',
      '  · C_load · ½ C V² per transition',
      '→ P_dyn = α · C · V² · f · this is why.',
    ],

    [
      '$ assemble driver ▴',
      '  2 transistors fan out to a wire',
      '  every wire on the bus has its own',
      '→ 1 lane · 1 inverter · 1 CV²f cost',
    ],

    [
      '$ assemble ring ▴',
      '  hundreds of wires · running in parallel',
      '  every cycle · every transition · CV²f',
      '  → interconnect ≈ 30 % of chip power',
      '→ packet arrives at L3 slice ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'l3-dram' — L3 MISS · DRAM
  //
  // Top-down: L3 misses → memctrl drives RAS / CAS → activate one row,
  //   amplify, read out one column → the 1T1C cell → the storage cap.
  // Bottom-up: capacitor stores ~30 fF · cell is 1 transistor + 1 cap
  //   · array is millions of those · why DRAM is the cliff.
  // =====================================================================
  'l3-dram': [
    [
      '$ probe l3.slice --tag-miss',
      '→ MISS · escalate to memctrl',
      '  RAS · activate row',
      '  CAS · select column',
      '→ 40 + 200 cycles · the cliff',
      '  why so slow? open the array ▾',
    ],

    [
      '$ inspect dram.cell --xray',
      '  1T1C · one transistor + one capacitor',
      '  · WL high → access NMOS conducts',
      '  · charge dumps from Cs onto BL',
      '  · sense amp resolves 0 or 1',
      '  · reading destroys the value',
      '  what stores it? open the cap ▾',
    ],

    [
      '$ inspect Cs --device-physics',
      '  parallel-plate cap · ~30 fF',
      '  · top plate above access drain',
      '  · dielectric (high-k) between',
      '  · bottom plate to GND',
      '  · charge leaks · refresh every 64 ms',
      '→ memory is a bucket of electrons.',
    ],

    [
      '$ assemble cell ▴',
      '  1 transistor gates the bucket',
      '  1 capacitor holds the charge',
      '→ 1 bit · 1T1C · ~6 F²',
    ],

    [
      '$ assemble bank ▴',
      '  16 384 rows · 8 192 cols · activated as one',
      '  RAS · row dump · 40 cyc',
      '  CAS · column read · 200 cyc',
      '  refresh row / 64 ms · always · forever',
      '→ line on the bus · cascading back ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'coherence' — COHERENCE
  //
  // Top-down: 4 cores · 1 directory · snoop bus → MESI state machine
  //   → the SR latch storing one bit of MESI state.
  // Bottom-up: 1 latch = 2 cross-coupled NANDs · 2 bits = 4 states ·
  //   the directory tracks who holds the line.
  // =====================================================================
  coherence: [
    [
      '$ snoop bus --line=0x4080',
      '  C0 reads · C1 holds [S]hared',
      '  C2 holds [I]nvalid · C3 holds [I]',
      '→ no Modified copies · safe to install',
      '  directory updates sharer bitmap ▾',
    ],

    [
      '$ inspect mesi.state --decode',
      '  2-bit state register per cacheline',
      '  · 11 = Modified · exclusive owner',
      '  · 10 = Exclusive · clean, sole copy',
      '  · 01 = Shared · multiple readers',
      '  · 00 = Invalid · do not use',
      '  what holds those 2 bits? ▾',
    ],

    [
      '$ inspect sr.latch --device-physics',
      '  cross-coupled NAND2 pair',
      '  · output of A feeds input of B',
      '  · output of B feeds input of A',
      '  · two stable points (set / reset)',
      '  · bistability stores 1 bit',
      '→ memory = positive feedback frozen still.',
    ],

    [
      '$ assemble bit ▴',
      '  2 NANDs · 8 transistors',
      '  S̄ / R̄ inputs flip the latch',
      '→ 1 bit of MESI · per cacheline',
    ],

    [
      '$ assemble directory ▴',
      '  every line · 2 state bits + sharer bitmap',
      '  snoop · invalidate · update · all atomic',
      '  8 cycles to settle the protocol',
      '→ line installed · S → S → fill cascade ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'fill' — FILL CASCADE
  //
  // Top-down: 64 B line cascades L3 → L2 → L1 → byte → bit cell.
  // Bottom-up: bit lands when WL fires · 8 bits make a byte · 64 bytes
  //   make a line · the next 64 sequential reads will hit L1.
  // =====================================================================
  fill: [
    [
      '$ fill line=0x4080 --64B',
      '  L3 ← memory · install',
      '  L2 ← L3      · install + LRU evict',
      '  L1 ← L2      · install + LRU evict',
      '→ 15 cycles · line installed at every level',
      '  zoom one level — how does a byte land? ▾',
    ],

    [
      '$ inspect set --4-way --way=W1',
      '  way 0 ─ tag · 8 byte chunks',
      '  way 1 ◀ NEW · bytes streaming in',
      '  way 2 ─ tag · 8 byte chunks',
      '  way 3 ─ tag · 8 byte chunks (LRU evicted)',
      '  · bytes land chunk-by-chunk',
      '  what writes one byte? open it ▾',
    ],

    [
      '$ inspect byte --8-cells',
      '  WL high · all 8 access transistors on',
      '  BL[0..7] drive in parallel',
      '  · cells flip via positive feedback',
      '  · settle time ≈ 1 cycle',
      '→ 8 bits committed simultaneously.',
    ],

    [
      '$ assemble line ▴',
      '  64 bytes · 512 bits · 1 wordline',
      '  fills in one access cycle',
      '→ 1 cacheline · the unit of locality',
    ],

    [
      '$ assemble cascade ▴',
      '  L3 + L2 + L1 · all hold the line now',
      '  next 64 sequential reads → L1 hit',
      '  · 1 expensive miss · 63 cheap hits',
      '→ this is locality · the only reason caches work ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'retire' — RETIRE
  //
  // Top-down: ROB head retires in order → register-file row writes the
  //   architectural x1 → the CMOS driver pushing one bit onto BL.
  // Bottom-up: 1 driver = 2 switches · 64 of those write a register ·
  //   one register writes · ROB head advances · instruction is done.
  // =====================================================================
  retire: [
    [
      '$ rob.head --status',
      '  inst : ld x1, [x2]',
      '  data : 0xDEADBEEF',
      '  faults: none',
      '→ retire · architectural state advances',
      '  what physically writes x1? ▾',
    ],

    [
      '$ inspect regfile.x1 --row',
      '  16 bit cells per register',
      '  · WL[1] selects the x1 row',
      '  · 16 access transistors open',
      '  · 16 bitlines drive new data',
      '  · cells flip · x1 = 0xDEADBEEF',
      '  what drives one bitline? ▾',
    ],

    [
      '$ inspect bl.driver --device-physics',
      '  CMOS inverter · same totem pole as bus',
      '  · PMOS pulls BL → VDD when In = 0',
      '  · NMOS pulls BL → GND when In = 1',
      '  · drives the storage node hard',
      '→ same 2 transistors · different role.',
    ],

    [
      '$ assemble driver ▴',
      '  2 switches · 1 bitline',
      '  every bit · its own driver pair',
      '→ 1 bit · committed in 1 cycle',
    ],

    [
      '$ assemble retire ▴',
      '  64 bits land in x1 simultaneously',
      '  ROB head advances · slot frees',
      '  next instruction takes the head',
      '→ load complete · 287 cycles total ▾',
    ],

    null,
  ],

  // =====================================================================
  // Stage 'recap' — THE COST
  //
  // Flat summary. Stack up the seven hops, name the cliff, end on the
  // locality payoff so the reader leaves with the moral.
  // =====================================================================
  recap: [
    [
      '$ tally --trace=ld_x1',
      '  issue           1',
      '  l1 + l2 miss   16',
      '  ring bus        6',
      '  l3 + dram     240',
      '  coherence       8',
      '  fill cascade   15',
      '  retire          1',
      '→ Σ = 287 cycles · 1 byte used',
      '  but the next 63 reads → free.',
    ],
  ],
};

/**
 * Look up the script for the current (stageId, subStageIndex). Returns
 * null when no script is defined or the substage is the rest beat.
 */
export function getScript(stageId, subStageIndex) {
  const stageScripts = NARRATIVE_SCRIPTS[stageId];
  if (!stageScripts) return null;
  return stageScripts[subStageIndex] ?? null;
}

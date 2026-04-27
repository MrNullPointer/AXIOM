// Per-stage source rects on the BG canvas — these are the physical
// locations on the chip floorplan where each stage's component lives.
// Each card is plucked FROM that rect and animated to the centre of the
// viewport. Coordinates are viewport-relative fractions (0..1).
//
// Approximations chosen to align roughly with CircuitFlow's region
// layout: focal core in the centre, cache columns left+right of it,
// HBM bands at the outer edges, mixed regions in the inner sides.
export const STAGE_SOURCE_RECTS = {
  intro:      { x: 0.50, y: 0.50, w: 0.50, h: 0.50 }, // whole-chip overview
  issue:      { x: 0.46, y: 0.42, w: 0.10, h: 0.18 }, // CPU pipeline (focal)
  'l1-l2':    { x: 0.06, y: 0.22, w: 0.08, h: 0.55 }, // L1/L2 cache columns
  bus:        { x: 0.20, y: 0.46, w: 0.60, h: 0.10 }, // ring interconnect
  'l3-dram':  { x: 0.00, y: 0.20, w: 0.05, h: 0.60 }, // HBM band (far edge)
  coherence:  { x: 0.18, y: 0.40, w: 0.10, h: 0.20 }, // coherence directory
  fill:       { x: 0.40, y: 0.40, w: 0.20, h: 0.20 }, // L3 slice (inner)
  retire:     { x: 0.46, y: 0.42, w: 0.08, h: 0.16 }, // register file (focal)
  recap:      { x: 0.50, y: 0.50, w: 0.50, h: 0.50 }, // whole-chip summary
};

// Per-stage accent colour. Tied to the chip-component "tribe":
//   compute (cyan) · L1/L2 SRAM (mint) · interconnect (copper) ·
//   DRAM (amber) · coherence (rose) · fill cascade (violet) · retire (gold).
// Each viz uses its colour for active wires, lit gates, charge transfers,
// state changes — so each stage has a visually distinct identity.
//
// intro/recap use a neutral pewter so they read as "meta" cards rather
// than competing with the seven coloured stages.
export const STAGE_COLORS = {
  intro:      '#cfd8e3', // pewter (neutral overview)
  issue:      '#7df9ff', // cyan
  'l1-l2':    '#7cf3c0', // mint
  bus:        '#f5b461', // copper
  'l3-dram':  '#ff9b54', // amber
  coherence:  '#ff7a90', // rose
  fill:       '#a78bfa', // violet
  retire:     '#ffd66a', // warm gold
  recap:      '#cfd8e3', // pewter (neutral summary)
};

// Scroll-narrative stages — "Anatomy of a cache miss".
//
// Each stage corresponds to a slice of total scroll progress on the atlas
// page. As the user scrolls, the active stage changes, the named domain
// block lifts to the foreground in the floorplan, the stage callout panel
// updates with technical detail, and the BG canvas's scripted journey
// advances to the matching electron path.
//
// `blockId` matches an `id` in src/data/domains.js so DieHero can lift the
// right block. `code` is the technical one-liner (terminal style),
// `desc` is the prose explanation, `latency` is the local cost, and
// `cumulative` is the running total — the whole point of the story is
// to show that cumulative.

export const SCENARIO_STAGES = [
  {
    id: 'intro',
    title: 'THE TRIP',
    blockId: 'microarchitecture',
    code: 'lb x1, 0(x2)   ; fetch one byte from memory',
    desc: 'A single load instruction. If x2 points to a hot cache line, this resolves in ~4 cycles. If it misses every level of cache and walks all the way to DRAM, the same byte costs ~287 cycles. We are about to watch the slow path — the seven hops one byte takes when the caches all say no.',
    latency: '0 cycles',
    cumulative: '0 cycles',
  },
  {
    id: 'issue',
    title: 'ISSUE',
    blockId: 'microarchitecture',
    code: 'lb x1, 0(x2)',
    desc: 'Load instruction enters the pipeline. The scheduler computes the effective address from x2 and dispatches a memory request.',
    latency: '1 cycle',
    cumulative: '1 cycle',
  },
  {
    id: 'l1-l2',
    title: 'L1 / L2 MISS',
    blockId: 'memory',
    code: 'tag mismatch · L1 → L2',
    desc: 'L1 (32KB, 4-way) returns a tag mismatch. Request walks one level down to L2 (256KB). Still no hit.',
    latency: '4 + 12 cycles',
    cumulative: '17 cycles',
  },
  {
    id: 'bus',
    title: 'RING BUS',
    blockId: 'interconnect',
    code: 'NoC fabric · ring hop',
    desc: 'The request leaves the core and rides the on-die ring interconnect to a banked L3 slice (8 MB, shared across all cores).',
    latency: '6 cycles',
    cumulative: '23 cycles',
  },
  {
    id: 'l3-dram',
    title: 'L3 MISS · DRAM',
    blockId: 'memory',
    code: 'memctrl → DDR · RAS · CAS',
    desc: 'L3 tag mismatch. Memory controller activates a row, drives the column address, waits for the sense amps. This is the cliff — external DRAM lives an order of magnitude further from the core than any cache.',
    latency: '40 + 200 cycles',
    cumulative: '263 cycles',
  },
  {
    id: 'coherence',
    title: 'COHERENCE',
    blockId: 'coherence',
    code: 'MESI snoop · directory update',
    desc: 'Other cores are snooped to ensure no one holds the line in Modified state. The directory installs the new line in Shared.',
    latency: '8 cycles',
    cumulative: '271 cycles',
  },
  {
    id: 'fill',
    title: 'FILL CASCADE',
    blockId: 'interconnect',
    code: '64B line · L3 → L2 → L1',
    desc: 'The 64-byte cacheline rides back through the hierarchy, installed at every level so the next access to anything nearby will hit L1.',
    latency: '15 cycles',
    cumulative: '286 cycles',
  },
  {
    id: 'retire',
    title: 'RETIRE',
    blockId: 'microarchitecture',
    code: 'x1 ← 0xDEADBEEF',
    desc: 'Data lands in the architectural register file. The instruction retires from the reorder buffer. One byte cost roughly 287 cycles — the entire point of why caches exist.',
    latency: '1 cycle',
    cumulative: '~287 cycles',
  },
  {
    id: 'recap',
    title: 'THE COST',
    blockId: 'microarchitecture',
    code: '287 cycles · 64 B fetched · 1 B used',
    desc: 'A cache hit would have cost 4 cycles. We paid 287 because the line was cold — 70× slower. The good news: the 64 B that just landed will satisfy the next ~64 sequential accesses for almost free. That is locality, and it is the only thing that makes computers fast.',
    latency: '—',
    cumulative: '~287 cycles',
  },
];

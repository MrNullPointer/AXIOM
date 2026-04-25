// The atlas's top-level structure: domains laid out as a die floorplan.
// Each entry's `floor` describes its rectangle on a 12×8 grid (col, row, w, h)
// so the SVG floorplan can be data-driven and scale to thousands of concepts
// later (concepts get sub-blocks inside their parent domain).

export const DOMAINS = [
  {
    id: 'isa',
    label: 'ISA',
    full: 'Instruction Set Architecture',
    blurb: 'The contract between hardware and software.',
    floor: { col: 0, row: 0, w: 4, h: 3 },
    accent: 'amber',
  },
  {
    id: 'microarchitecture',
    label: 'Microarchitecture',
    full: 'Pipelines, predictors, schedulers',
    blurb: 'How a core actually executes the contract.',
    floor: { col: 4, row: 0, w: 5, h: 3 },
    accent: 'cyan',
  },
  {
    id: 'memory',
    label: 'Memory',
    full: 'Caches, TLB, virtual memory, DRAM',
    blurb: 'The pyramid that keeps the core fed.',
    floor: { col: 9, row: 0, w: 3, h: 3 },
    accent: 'mint',
  },
  {
    id: 'coherence',
    label: 'Coherence',
    full: 'Consistency, atomics, fences',
    blurb: 'What other cores can observe — and when.',
    floor: { col: 0, row: 3, w: 3, h: 2 },
    accent: 'violet',
  },
  {
    id: 'interconnect',
    label: 'Interconnect',
    full: 'Buses, NoC, chiplets, fabrics',
    blurb: 'How parts of the chip talk to each other.',
    floor: { col: 3, row: 3, w: 3, h: 2 },
    accent: 'blue',
  },
  {
    id: 'os',
    label: 'OS Interface',
    full: 'Privilege, traps, scheduling, MMU',
    blurb: 'Where software meets the metal.',
    floor: { col: 6, row: 3, w: 3, h: 2 },
    accent: 'cyan',
  },
  {
    id: 'security',
    label: 'Security',
    full: 'Side channels, isolation, attestation',
    blurb: 'What the architecture must — and must not — leak.',
    floor: { col: 9, row: 3, w: 3, h: 2 },
    accent: 'rose',
  },
  {
    id: 'power',
    label: 'Power',
    full: 'DVFS, clock gating, thermals',
    blurb: 'Joules per instruction is the new ceiling.',
    floor: { col: 0, row: 5, w: 4, h: 3 },
    accent: 'amber',
  },
  {
    id: 'accelerators',
    label: 'Accelerators',
    full: 'GPUs, NPUs, DSPs, custom silicon',
    blurb: 'When the general-purpose pipeline isn’t enough.',
    floor: { col: 4, row: 5, w: 5, h: 3 },
    accent: 'violet',
  },
  {
    id: 'tooling',
    label: 'Tooling',
    full: 'Compilers, simulators, profilers, ISA sim',
    blurb: 'How architecture is designed and measured.',
    floor: { col: 9, row: 5, w: 3, h: 3 },
    accent: 'mint',
  },
];

export function getDomain(id) {
  return DOMAINS.find((d) => d.id === id);
}

// Mapping from CSS variable names to accent values.
export const ACCENT_VAR = {
  amber: 'var(--accent-2)',
  cyan: 'var(--accent-1)',
  mint: 'var(--accent-3)',
  violet: 'var(--accent-2)',
  blue: 'var(--accent-1)',
  rose: 'var(--accent-warn)',
};

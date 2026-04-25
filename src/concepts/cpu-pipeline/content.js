export const content = {
  problem: {
    title: 'Why pipeline at all',
    paragraphs: [
      'A single-cycle CPU wastes most of its silicon most of the time. Each instruction needs fetch, decode, execute, memory, and writeback — but those resources sit idle while waiting their turn.',
      'A pipeline overlaps the work. Each stage operates on a different instruction every cycle, and throughput approaches one instruction per cycle in the steady state.',
    ],
    aside: [
      { label: 'IF', value: 'fetch the next instruction' },
      { label: 'ID', value: 'decode + read registers' },
      { label: 'EX', value: 'compute / branch resolve' },
      { label: 'MEM', value: 'load or store' },
      { label: 'WB', value: 'commit to register file' },
    ],
  },

  mechanism: {
    title: 'Cycle by cycle',
    paragraphs: [
      'The visualization below is a 5-stage in-order pipeline running a 7-instruction sequence. Each row is an instruction; each column is a clock cycle; cells colour by the stage occupied that cycle.',
      'Press play to advance the clock. Toggle mispredict to see the front-end squashed when the branch resolves the wrong way — every in-flight IF/ID instruction is discarded, the front-end refills from the correct PC, and you eat the bubble.',
    ],
    visualizerSlot: 'pipeline-timeline',
  },

  tradeoffs: {
    title: 'What you pay for IPC',
    paragraphs: [
      'A 5-stage in-order pipeline tops out near IPC = 1. To go further you add issue width, register renaming, reorder buffers, predictors, and load/store queues — and you pay for every speculative cycle that gets squashed. Spectre lives in this margin: speculative state leaks via the cache and other shared microarchitectural surfaces.',
    ],
    lenses: {
      performance: 'IPC × frequency = throughput. Pipeline depth raises the clock ceiling but increases mispredict cost.',
      power: 'Squashed speculation is energy spent for nothing. Modern cores pay heavily in prediction to avoid it.',
      area: 'Reorder buffers, rename tables, and load/store queues dominate the area of a high-end core.',
      security: 'Speculative side effects on shared state — caches, predictors — are the substrate of Spectre-class attacks.',
    },
  },

  lineages: {
    title: 'Three lineages, three flavors',
    rows: [
      {
        name: 'ARM',
        kicker: 'wide front-end, deep ROB',
        body: 'Apple Firestorm/Avalanche cores run 8+ wide decode with deep reorder buffers. Cortex-A spans simple in-order to wide OoO.',
      },
      {
        name: 'x86-64',
        kicker: 'µop cache amortizes decode',
        body: 'Intel P-cores and AMD Zen feature 6+ wide decode and hundreds of ROB entries. Variable-length decode is hidden behind a μop cache.',
      },
      {
        name: 'RISC-V',
        kicker: 'in-order to wide OoO',
        body: 'Implementations span tiny in-order microcontrollers (SiFive E series) to wide OoO designs (SiFive P870, Tenstorrent Ascalon).',
      },
    ],
  },
};

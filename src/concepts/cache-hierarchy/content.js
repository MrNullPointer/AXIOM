export const content = {
  problem: {
    title: 'The memory wall',
    paragraphs: [
      'CPUs got fast. DRAM did not. An uncached load can cost the equivalent of hundreds of arithmetic operations. Without caches, modern cores would idle on every memory access.',
      'The pyramid exists because no single technology can be both dense and fast. Each level above DRAM is built from faster (and more expensive) silicon, and every layer trades capacity for latency.',
    ],
    aside: [
      { label: 'register', value: '0 cyc' },
      { label: 'L1', value: '~4 cyc · 32–64 KB' },
      { label: 'L2', value: '~12–15 cyc · 0.5–2 MB' },
      { label: 'L3', value: '~30–50 cyc · tens of MB' },
      { label: 'DRAM', value: '200+ cyc · gigabytes' },
    ],
  },

  mechanism: {
    title: 'Walk the pyramid',
    paragraphs: [
      'The visualization below spawns a steady stream of memory accesses. Each access enters L1; on a miss it cascades to L2, then L3, then DRAM. The level that finally serves the access lights up, and its total latency is recorded on the latency tape.',
      'Real workloads have skewed access patterns — the higher levels serve the vast majority of traffic. The hierarchy works because of locality, not in spite of it.',
    ],
    visualizerSlot: 'cache-pyramid',
  },

  tradeoffs: {
    title: 'Locality is the lever',
    paragraphs: [
      'Loop tiling, struct-of-arrays layouts, prefetch hints, and warm working sets compound into multi-x speedups. Cache-friendly code is also low-power code. Cache-unfriendly code leaks: timing differences between hits and misses are the substrate of Flush+Reload, Prime+Probe, and the entire family of cache-based side channels.',
    ],
    lenses: {
      performance: 'Hit rate dominates real workloads. A 1% miss-rate change can swing throughput by 10×.',
      power: 'A DRAM access uses ~100× the energy of an L1 hit. Cache-friendly code is low-power code.',
      area: 'SRAM dominates the die photo of modern CPUs and GPUs. A single L3 slice can outweigh a core.',
      security: 'Flush+Reload, Prime+Probe, and friends all live in the timing gap between a hit and a miss.',
    },
  },

  lineages: {
    title: 'How the lineages stack memory',
    rows: [
      {
        name: 'ARM',
        kicker: 'huge unified L2 + system cache',
        body: 'Apple M-series uses very large unified L2 plus a system-level cache shared with the GPU and NPU. Cortex designs vary by tier.',
      },
      {
        name: 'x86-64',
        kicker: 'three deep levels + V-cache',
        body: 'Intel and AMD ship three-level hierarchies. Some Ryzen parts add 3D-stacked L3 (V-cache), pushing cache capacity dramatically beyond planar limits.',
      },
      {
        name: 'RISC-V',
        kicker: 'wide range, coherence varies',
        body: 'Implementations span no-cache microcontrollers up to multi-MB L2 designs. Coherence protocol is implementation-defined.',
      },
    ],
  },
};

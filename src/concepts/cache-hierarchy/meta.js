export const meta = {
  id: 'cache-hierarchy',
  slug: 'cache-hierarchy',
  title: 'Cache Hierarchy',
  shortDescription:
    'A pyramid of fast-but-small to slow-but-vast memory that hides DRAM latency.',
  intuition:
    'DRAM is hundreds of cycles away. Caches keep recently and nearby-touched data on-die so the pipeline can keep eating. The hierarchy is layered because each level trades capacity for latency.',
  domain: 'memory',
  subdomain: 'caches',
  difficulty: 'core',
  layers: ['microarchitecture', 'memory'],
  prerequisites: ['cpu-pipeline'],
  related: ['cpu-pipeline', 'what-is-an-isa'],
  architectureRelevance: ['arm', 'x86', 'risc-v'],
  hasVisualizer: true,
  hasLab: false,
  performanceRelevance: 'critical',
  securityRelevance: 'high',
  status: 'published',
};

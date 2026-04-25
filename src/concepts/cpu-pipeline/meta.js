export const meta = {
  id: 'cpu-pipeline',
  slug: 'cpu-pipeline',
  title: 'CPU Pipeline',
  shortDescription:
    'How modern cores overlap instruction work to issue many results per cycle.',
  intuition:
    'A pipeline is an assembly line for instructions. Each stage works on a different instruction at the same time — throughput goes up; the cost is the hazards you now have to manage.',
  domain: 'microarchitecture',
  subdomain: 'execution-engine',
  difficulty: 'core',
  layers: ['microarchitecture'],
  prerequisites: ['what-is-an-isa'],
  related: ['cache-hierarchy', 'what-is-an-isa'],
  architectureRelevance: ['arm', 'x86', 'risc-v'],
  hasVisualizer: true,
  hasLab: false,
  performanceRelevance: 'critical',
  securityRelevance: 'high',
  status: 'published',
};

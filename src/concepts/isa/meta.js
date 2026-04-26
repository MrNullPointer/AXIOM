export const meta = {
  id: 'what-is-an-isa',
  slug: 'what-is-an-isa',
  title: 'What is an ISA?',
  shortDescription:
    'The contract between hardware and software — the formal abstract machine that lets a compiler emit bytes today and silicon execute them ten years from now.',
  intuition:
    'An Instruction Set Architecture (ISA) is a contract: programmer-visible state (registers, program counter, flags, CSRs), the encoding of every instruction, an addressing model, a calling convention, a memory consistency model, and a privilege/exception model. Above the line, compilers and operating systems. Below the line, silicon is free to do almost anything — pipeline depth, cache geometry, branch predictor, voltage, frequency — as long as the contract is honored.',
  domain: 'isa',
  subdomain: 'foundations',
  difficulty: 'foundational',
  layers: ['ISA', 'compiler', 'OS', 'security'],
  prerequisites: [],
  related: ['cpu-pipeline', 'cache-hierarchy'],
  architectureRelevance: ['arm', 'x86', 'risc-v'],
  hasVisualizer: true,
  hasLab: false,
  performanceRelevance: 'medium',
  securityRelevance: 'high',
  status: 'published',
};

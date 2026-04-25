// Single registry of all concepts. Each entry exports its meta, content, and
// visualizer. To add a new concept, create a folder and add an import here.

import { meta as isaMeta } from './isa/meta.js';
import { content as isaContent } from './isa/content.js';
import ISAVisualizer from './isa/visualizer.jsx';

import { meta as pipelineMeta } from './cpu-pipeline/meta.js';
import { content as pipelineContent } from './cpu-pipeline/content.js';
import PipelineVisualizer from './cpu-pipeline/visualizer.jsx';

import { meta as cacheMeta } from './cache-hierarchy/meta.js';
import { content as cacheContent } from './cache-hierarchy/content.js';
import CacheVisualizer from './cache-hierarchy/visualizer.jsx';

export const CONCEPTS = [
  { meta: isaMeta, content: isaContent, Visualizer: ISAVisualizer },
  { meta: pipelineMeta, content: pipelineContent, Visualizer: PipelineVisualizer },
  { meta: cacheMeta, content: cacheContent, Visualizer: CacheVisualizer },
];

export function getConcept(slug) {
  return CONCEPTS.find((c) => c.meta.slug === slug);
}

export function conceptsByDomain(domainId) {
  return CONCEPTS.filter((c) => c.meta.domain === domainId);
}

export function relatedConcepts(meta) {
  if (!meta?.related) return [];
  return meta.related
    .map((slug) => CONCEPTS.find((c) => c.meta.slug === slug))
    .filter(Boolean);
}

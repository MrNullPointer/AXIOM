// Single registry of all concepts. Each entry exports its meta, content,
// and a lazy-loaded set of visualizers keyed by section slot.
//
// Why lazy: visualizers are the heaviest code on the site (canvas / SVG +
// framer-motion machinery). Splitting them per chunk means the atlas
// homepage never pays for the cache visualizer, and a concept page
// downloads each visualizer chunk only when the reader scrolls near it.
//
// Meta and content stay eager — search, related-concept lookups, and the
// atlas all need them, and they're cheap.

import { lazy } from 'react';

import { meta as isaMeta } from './isa/meta.js';
import { content as isaContent } from './isa/content.js';

import { meta as pipelineMeta } from './cpu-pipeline/meta.js';
import { content as pipelineContent } from './cpu-pipeline/content.js';

import { meta as cacheMeta } from './cache-hierarchy/meta.js';
import { content as cacheContent } from './cache-hierarchy/content.js';

const ISAEncoding = lazy(() => import('./isa/viz/Encoding.jsx'));
const ISAPhysics = lazy(() => import('./isa/viz/Physics.jsx'));
const ISAOperands = lazy(() => import('./isa/viz/Operands.jsx'));
const ISATaxonomy = lazy(() => import('./isa/viz/Taxonomy.jsx'));
const ISAOrdering = lazy(() => import('./isa/viz/Ordering.jsx'));
const ISAEvolution = lazy(() => import('./isa/viz/Evolution.jsx'));

const PipelineVisualizer = lazy(() => import('./cpu-pipeline/visualizer.jsx'));
const CacheVisualizer = lazy(() => import('./cache-hierarchy/visualizer.jsx'));

export const CONCEPTS = [
  {
    meta: isaMeta,
    content: isaContent,
    Visualizer: ISAEncoding,
    visualizers: {
      'isa-encoding': ISAEncoding,
      'isa-physics': ISAPhysics,
      'isa-operands': ISAOperands,
      'isa-taxonomy': ISATaxonomy,
      'isa-ordering': ISAOrdering,
      'isa-evolution': ISAEvolution,
    },
    // Approximate min-heights so the page doesn't jump when chunks land.
    vizMinHeights: {
      'isa-encoding': 360,
      'isa-physics': 560,
      'isa-operands': 460,
      'isa-taxonomy': 540,
      'isa-ordering': 500,
      'isa-evolution': 360,
    },
  },
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

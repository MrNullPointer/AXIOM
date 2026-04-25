# Axiom Agent Guide

> **Axiom: From electrons to execution.**  
> A visual encyclopedia of computer architecture. Make invisible silicon visible.

## Project goal

Axiom is a static, GitHub Pages-friendly React site that explains computer architecture from first principles using rigorous writing, deep visualizations, and interactive animations.

The visual identity is: **black silicon + etched traces + flowing signals + liquid glass UI**.

Avoid generic circuit-board clip art. The site should feel like looking through glass into a living silicon die.

## Stack

- Vite + React + React Router
- Tailwind CSS
- Lucide React
- Fuse.js for search
- Vitest for tests
- Canvas / SVG / WebGL for visualizers
- No backend in v1

## Design rules

Use a four-layer visual system:

1. **Silicon substrate**: dark graphite, wafer rings, lithography grid, subtle noise.
2. **Gradient mesh**: section-aware atmosphere for ISA, Memory, Microarchitecture, OS, Power, Security, Accelerators.
3. **Circuit flow canvas**: animated traces, vias, buses, pulses, cache bursts, clock waves.
4. **Liquid glass UI**: navbar, cards, panels, command palette, and simulator containers.

Animations must teach the concept. Decorative motion is a bug. Always respect `prefers-reduced-motion`.

## First milestone

Build these before expanding content:

- Homepage
- Glass navbar
- `CircuitFlowBackground`
- Concept index
- Concept cards
- Cmd/Ctrl+K command palette
- Three flagship pages:
  - What Is an ISA?
  - CPU Pipeline
  - Cache Hierarchy

These three pages define the identity of the site.

## Concept page contract

Every concept page must explain:

- What problem the concept solves
- The mechanism that implements it
- Latency, bandwidth, power, area, energy, security, and complexity trade-offs
- ARM / x86 / RISC-V differences where relevant
- Real software, compiler, OS, debugging, and performance implications

Standard flow:

Hero visualization → Intuition → Mechanism → Timing and cost → Architecture lenses → Interactive lab → ARM/x86/RISC-V comparison → Related concepts.

## Component structure

Keep systems modular.

- Background: `SiliconSubstrate`, `SiliconGradientMesh`, `CircuitFlowBackground`
- Shell: `GlassNavbar`, `CommandPalette`
- Content: `ConceptCard`, `ConceptGrid`, `ConceptHero`, `ConceptLensTabs`
- Visualizers: `PipelineVisualizer`, `CacheVisualizer`, `TLBVisualizer`, `BranchPredictorVisualizer`, `OoOVisualizer`, `MemoryModelVisualizer`, `RooflineExplorer`

Separate metadata, content, visualizers, search, design tokens, hooks, and navigation.

## Metadata rule

Every concept must export metadata:

`id`, `slug`, `title`, `shortDescription`, `domain`, `difficulty`, `layers`, `prerequisites`, `related`, `archRelevance`, `hasVisualizer`, `hasLab`, `perfRelevance`, `securityRelevance`.

This metadata powers search, graph, related concepts, and learning paths.

## Agent rules

- Prefer editing existing systems over creating duplicates.
- New concept pages go under `src/concepts/<slug>/`.
- New visualizers go under `src/visualizers/`.
- Do not add new top-level dependencies without asking.
- Keep GitHub Pages compatibility.
- Do not add SSR, backend APIs, or databases in v1.
- Maintain keyboard access, readable contrast, and reduced-motion support.

## Commands

Update if scripts change.

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`

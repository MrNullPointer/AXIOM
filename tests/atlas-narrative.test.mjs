// Content-consistency suite for the cache-miss narrative. Each test
// pins a piece of pedagogy that prior reviewers flagged — if any of
// these strings drift, we want CI to catch it before another reader
// ever sees it. Pure string checks; no JSX execution needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const read = (rel) => readFileSync(resolve(repo, rel), 'utf-8');

test('SRAM address breakdown reflects 32KB / 4-way / 64B geometry', () => {
  const src = read('src/components/atlas/stages/sram.jsx');
  // 32KB / 4-way / 64B line ⇒ 128 sets ⇒ 7 set-index bits, 6 offset bits.
  // For a 48-bit virtual address that leaves 35 tag bits.
  assert.match(src, /tag \(35 b\)/, 'expected tag (35 b)');
  assert.match(src, /set \(7 b\)/, 'expected set (7 b)');
  assert.match(src, /offset \(6 b\)/, 'expected offset (6 b)');
  // Guard against the prior wrong values returning.
  assert.doesNotMatch(src, /tag \(37 b\)/, 'old tag (37 b) must not return');
  assert.doesNotMatch(src, /set \(5 b\)/, 'old set (5 b) must not return');
});

test('byte-load uses RISC-V lb, never the ambiguous ld x1, [x2]', () => {
  const stages = read('src/components/atlas/scenarioStages.js');
  const scripts = read('src/components/atlas/narrativeScripts.js');
  assert.match(stages, /lb x1, 0\(x2\)/, 'scenarioStages.js must use lb');
  assert.match(scripts, /lb x1, 0\(x2\)/, 'narrativeScripts.js must use lb');
  // ld x1, [x2] mixes AArch64 syntax with RISC-V — it's the original
  // accuracy bug. Forbid both bracketed forms across the narrative.
  for (const [path, src] of [
    ['scenarioStages.js', stages],
    ['narrativeScripts.js', scripts],
  ]) {
    assert.doesNotMatch(src, /ld x1, ?\[x2\]/, `${path} still has ld x1, [x2]`);
  }
});

test('DRAM cell physics: bitline ≈ ½VDD precharge, plate ≈ Vplate (not GND)', () => {
  const src = read('src/components/atlas/stages/dram.jsx');
  assert.match(src, /Vplate/, 'expected Vplate as bottom-plate bias');
  assert.match(src, /½VDD|VDD\/2/, 'expected ½VDD precharge reference');
  // The pre-fix narrative described a grounded bottom plate; that is
  // physically misleading for a modern 1T1C cell.
  assert.doesNotMatch(
    src,
    /bottom plate[^.\n]{0,40}\bGND\b/i,
    'bottom plate must not be described as GND',
  );
});

test('cacheline fill explicitly marks the inclusive-hierarchy caveat', () => {
  const src = read('src/components/atlas/stages/fill.jsx');
  assert.match(
    src,
    /inclusive/i,
    'fill stage must mark the inclusive-hierarchy assumption',
  );
});

test('coherence visual encodes a read-shared install (matches narration)', () => {
  const src = read('src/components/atlas/stages/coherence.jsx');
  // After the fix the visual installs [S]hared on two cores, not a
  // [M]odified write-invalidate. We check that the S state is present
  // in the per-core state table. (The literal 'M' may still appear in
  // labels/captions, so we only assert S exists.)
  assert.match(
    src,
    /state:\s*['"]S['"]/,
    "coherence stage must mark a core's state as 'S'",
  );
});

test('retire stage labels the 16-cell rendering as a slice of x1', () => {
  const src = read('src/components/atlas/stages/retire.jsx');
  // The visual draws 16 bit-cells but x1 is 64 bits wide. Either the
  // label says "slice" or it spells out the relationship explicitly.
  assert.match(
    src,
    /slice|16 ?Bits|16-bit/i,
    'retire stage must clarify the 16-bit slice vs 64-bit register',
  );
});

test('intro stage publishes the simulation-assumptions contract', () => {
  // The narrative makes specific cycle claims (4 / 287). Without a
  // visible toy-model contract a serious reader cannot tell whether
  // those numbers come from a real microarchitecture or are made up.
  // The intro terminal must declare frequency, cache geometry, and
  // coherence so the cycle ledger is grounded in stated assumptions.
  const scripts = read('src/components/atlas/narrativeScripts.js');
  assert.match(scripts, /3 ?GHz/, 'intro must declare core frequency');
  assert.match(scripts, /L1 ?32K/, 'intro must declare L1 size');
  assert.match(scripts, /4w|4-way/, 'intro must declare L1 associativity');
  assert.match(scripts, /64B|64 ?B/, 'intro must declare cache-line size');
  assert.match(scripts, /MESI/, 'intro must declare the coherence model');
});

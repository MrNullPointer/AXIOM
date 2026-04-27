/**
 * Per-substage terminal scripts for the cache-miss narrative.
 *
 * Each stage has up to 6 entries — one per substage in the
 * SUBSTAGE_TO_DEPTH = [0, 1, 2, 1, 0, 0] descend/resurface pattern:
 *
 *   0 — L0 BLOCK descending     (frame the question)
 *   1 — L1 CELL descending      (open one level deeper)
 *   2 — L2 ATOMIC deepest       (the physics)
 *   3 — L1 CELL resurfacing     (synthesize what we saw)
 *   4 — L0 BLOCK resurfacing    (scale up · why the cycle cost)
 *   5 — REST                    (card hidden — script unused)
 *
 * Lines whose first non-whitespace character is `$` render as a command
 * prompt; lines starting with `→` render as a result; lines starting
 * with `▾` mark "go deeper", `▴` mark "come back up". Plain lines
 * render as muted body text. The terminal types the whole script
 * character-by-character in proportion to subStageT (0..1), so the
 * script length should be tuned to feel comfortable across plausible
 * scroll speeds — short enough that fast scrolling still finishes the
 * thought, long enough that slow reading isn't bored.
 *
 * For step A only the 'l1-l2' stage is fully scripted. Other stages
 * fall back to a one-line placeholder; the terminal panel is hidden
 * for stages with no script.
 */

export const NARRATIVE_SCRIPTS = {
  // =====================================================================
  // Stage 'l1-l2' — L1 / L2 MISS
  //
  // Top-down: L1 misses → why? open the comparator → 6T cell → MOSFET.
  // Bottom-up: cell is 6 of those switches → cache is 512 of those cells
  //            wide, that's why a miss costs 4 cycles, walk to L2.
  // =====================================================================
  'l1-l2': [
    // Substage 0 — L0 BLOCK · we just missed in L1, frame the question.
    [
      '$ probe l1.d-cache --addr=0x4080',
      '  way 0  tag ≠   way 1  tag ≠',
      '  way 2  tag ≠   way 3  tag ≠',
      '→ MISS · 4 cycles',
      '  why? open the tag comparator ▾',
    ],

    // Substage 1 — L1 CELL · each tag bit is one 6T SRAM cell.
    [
      '$ inspect tag.bit[0] --xray',
      '  6T SRAM cell',
      '  · 4 transistors form a latch',
      '  · 2 access transistors (M5, M6)',
      '  · WL high → BL · BL̄ read state',
      '  but each transistor is a switch — ▾',
    ],

    // Substage 2 — L2 ATOMIC · the MOSFET. The whole point of the descent.
    [
      '$ inspect M5 --device-physics',
      '  NMOS · n⁺ source / drain in p-substrate',
      '  poly gate over 1.5 nm SiO₂',
      '  V_GS > V_th (≈ 0.4 V)',
      '  → electrons drift to oxide interface',
      '  → inversion layer forms · channel conducts',
      '→ this is the CMOS switch.',
    ],

    // Substage 3 — L1 CELL ascending · synthesize: the cell is 6 switches.
    [
      '$ assemble cell ▴',
      '  4 switches build the latch',
      '  2 switches gate the storage node',
      '→ 1 stored bit · 6 transistors · ~120 nm²',
    ],

    // Substage 4 — L0 BLOCK ascending · scale up, justify cycle cost.
    [
      '$ assemble cache ▴',
      '  32 KB · 4-way · 64 B lines',
      '  one wordline drives 512 cells',
      '  4 tag comparators fire in parallel',
      '  sense amps settle · result in 4 cycles',
      '→ all 4 missed · walking to L2 ▾▾',
    ],

    // Substage 5 — rest. Card hidden, script unused.
    null,
  ],
};

/**
 * Look up the script for the current (stageId, subStageIndex). Returns
 * null when no script is defined or the substage is the rest beat.
 */
export function getScript(stageId, subStageIndex) {
  const stageScripts = NARRATIVE_SCRIPTS[stageId];
  if (!stageScripts) return null;
  return stageScripts[subStageIndex] ?? null;
}

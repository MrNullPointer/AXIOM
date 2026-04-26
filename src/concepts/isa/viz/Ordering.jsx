import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

/**
 * Ordering — the classic Dekker / store-buffer test, run under three
 * memory models with an optional fence inserted between each core's store
 * and load.
 *
 *   Core 0:  ST X = 1   ; [fence?] ; r1 = LD Y
 *   Core 1:  ST Y = 1   ; [fence?] ; r2 = LD X
 *
 * Under sequential consistency, (r1, r2) = (0, 0) is impossible.
 * Under TSO (x86), it IS possible — the store buffer hides the write
 *   from the other core long enough for both loads to fire first.
 *   MFENCE / LOCK-prefixed atomic restores SC for the windowed program.
 * Under weak ordering (ARM, RISC-V), even more reorderings are observable;
 *   DMB ISH (ARM) or FENCE rw,rw (RISC-V) are the equivalent fix.
 *
 * The "fence inserted" toggle re-runs the trace with the fence in place
 * so the user can watch the (0,0) outcome become impossible.
 */

const MODELS = [
  {
    id: 'sc',
    label: 'sequential',
    one: 'one global interleaving',
    forbid: 'forbids (0,0)',
    color: 'var(--accent-3)',
  },
  {
    id: 'tso',
    label: 'TSO · x86',
    one: 'stores hide in core-local buffers',
    forbid: 'allows (0,0)',
    color: 'var(--accent-amber)',
  },
  {
    id: 'weak',
    label: 'weak · ARM/RISC-V',
    one: 'reorder freely until a fence',
    forbid: 'allows (0,0), (0,1), (1,0)',
    color: 'var(--accent-warn)',
  },
];

const FENCE_FOR = {
  sc:   { name: '— SC has no surprise to forbid —', kind: 'noop' },
  tso:  { name: 'MFENCE',     kind: 'full' },
  weak: { name: 'DMB ISH / FENCE rw,rw', kind: 'full' },
};

const FENCES = {
  sc: [
    { arch: 'all', insn: '— SC is the model itself —', note: 'no fence is needed; the hardware is already SC' },
  ],
  tso: [
    { arch: 'x86', insn: 'MFENCE',  note: 'full barrier · drains the store buffer before the next load' },
    { arch: 'x86', insn: 'LOCK pre.', note: 'any LOCK-prefixed RMW (XCHG, LOCK ADD…) implies a full fence' },
    { arch: 'x86', insn: 'SFENCE',  note: 'store-store only · cheap, used for non-temporal stores' },
    { arch: 'x86', insn: 'LFENCE',  note: 'load-load + speculation barrier · used post-Spectre as a serializer' },
  ],
  weak: [
    { arch: 'ARM',     insn: 'DMB ISH',     note: 'data memory barrier · inner-shareable · all-to-all order' },
    { arch: 'ARM',     insn: 'DMB ISHST',   note: 'store-store only · cheaper than full DMB' },
    { arch: 'ARM',     insn: 'LDAR / STLR', note: 'acquire load / release store · pairwise ordering, cheaper than DMB' },
    { arch: 'RISC-V',  insn: 'FENCE rw,rw', note: 'predecessor=rw, successor=rw · full fence equivalent' },
    { arch: 'RISC-V',  insn: 'FENCE.TSO',   note: 'TSO-equivalent fence (Ztso opt-in or hint)' },
    { arch: 'RISC-V',  insn: 'AQ/RL bits',  note: 'on AMO/LR/SC instructions · cheap pairwise ordering' },
  ],
};

export default function Ordering() {
  const reduce = useReducedMotion();
  const [model, setModel] = useState('sc');
  const [fence, setFence] = useState(false);
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);

  const trace = useMemo(() => buildTrace(model, fence), [model, fence]);
  const m = MODELS.find((mm) => mm.id === model);
  const phase = trace[tick % trace.length];

  useEffect(() => {
    if (!playing || reduce) return;
    const t = setInterval(() => setTick((n) => (n + 1) % trace.length), 900);
    return () => clearInterval(t);
  }, [playing, reduce, trace.length]);

  // Reset tick when switching models or toggling fence so the choreography
  // starts fresh and the user actually sees the change.
  useEffect(() => { setTick(0); }, [model, fence]);

  const allows = ALLOWS[model][fence ? 'fenced' : 'free'];
  const fenceMeta = FENCE_FOR[model];
  const fenceDisabled = model === 'sc';

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">two cores · two locations · three rule books</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {MODELS.map((mm) => (
            <button
              key={mm.id}
              type="button"
              onClick={() => setModel(mm.id)}
              className="marker rounded-full border px-2.5 py-1 text-[10px] transition-colors"
              style={{
                borderColor: model === mm.id ? 'var(--ink)' : 'var(--rule-strong)',
                color: model === mm.id ? 'var(--ink)' : 'var(--ink-faint)',
                background: model === mm.id ? 'var(--bg-soft)' : 'transparent',
              }}
            >
              {mm.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => !fenceDisabled && setFence((f) => !f)}
            disabled={fenceDisabled}
            className="ml-2 marker rounded-full border px-2.5 py-1 text-[10px] transition-colors"
            style={{
              borderColor: fence ? 'var(--accent-1)' : 'var(--rule-strong)',
              color: fence ? 'var(--accent-1)' : 'var(--ink-faint)',
              background: fence ? 'rgba(125,249,255,0.06)' : 'transparent',
              opacity: fenceDisabled ? 0.4 : 1,
              cursor: fenceDisabled ? 'not-allowed' : 'pointer',
            }}
            title={fenceDisabled ? 'no fence needed under SC' : 'toggle fence'}
          >
            {fence ? '✓ fence inserted' : '+ insert fence'}
          </button>
          <button
            type="button"
            onClick={() => { setPlaying(false); setTick(0); }}
            className="ml-1 grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Reset"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink-faint)' }}
          >
            <RotateCcw size={11} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setTick((n) => (n + 1) % trace.length)}
            className="marker rounded-full border px-2.5 py-1 text-[10px]"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            step ▸
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label={playing ? 'Pause' : 'Play'}
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            {playing ? <Pause size={11} aria-hidden="true" /> : <Play size={11} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-px lg:grid-cols-[1fr_340px]"
        style={{ background: 'var(--rule)' }}
      >
        <div className="px-5 py-5" style={{ background: 'var(--bg)' }}>
          <Stage phase={phase} model={model} fence={fence} fenceName={fenceMeta.name} />
        </div>

        <div className="px-5 py-5" style={{ background: 'var(--bg-soft)' }}>
          <div className="marker">model</div>
          <div className="display mt-1 text-lg" style={{ color: m.color }}>
            {m.label}
            {fence && !fenceDisabled ? (
              <span className="ml-2 marker text-[9px]" style={{ color: 'var(--accent-1)' }}>
                + {fenceMeta.name}
              </span>
            ) : null}
          </div>
          <div className="marker mt-1" style={{ color: 'var(--ink-faint)' }}>
            {m.one}
          </div>

          <div
            className="mt-4 border-t pt-4 text-xs leading-relaxed"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink-soft)' }}
          >
            {ABOUT[model]}
          </div>

          <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
            <div className="marker">observable outcomes (r1, r2)</div>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs tabular-nums">
              {OUTCOMES.map((o) => {
                const allowed = allows.includes(o);
                return (
                  <div
                    key={o}
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      background: allowed ? 'rgba(125,243,192,0.08)' : 'transparent',
                      border: '1px solid var(--rule-strong)',
                      color: allowed ? 'var(--ink)' : 'var(--ink-faint)',
                      opacity: allowed ? 1 : 0.5,
                    }}
                  >
                    <span>{o}</span>
                    <span
                      className="marker text-[9px]"
                      style={{ color: allowed ? 'var(--accent-3)' : 'var(--accent-warn)' }}
                    >
                      {allowed ? 'allowed' : 'forbidden'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] italic" style={{ color: 'var(--ink-faint)' }}>
              {fence && !fenceDisabled
                ? `with ${fenceMeta.name} between store and load · (0,0) becomes forbidden`
                : m.forbid}
            </div>
          </div>

          <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
            <div className="marker">fences that forbid the surprise</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {FENCES[model].map((f) => (
                <div
                  key={`${f.arch}-${f.insn}`}
                  className="rounded border px-2 py-1.5"
                  style={{ borderColor: 'var(--rule-strong)' }}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="marker text-[9px]" style={{ color: 'var(--ink-faint)' }}>
                      {f.arch}
                    </span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--accent-1)' }}>
                      {f.insn}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] leading-snug" style={{ color: 'var(--ink-faint)' }}>
                    {f.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const OUTCOMES = ['(0,0)', '(0,1)', '(1,0)', '(1,1)'];

const ALLOWS = {
  sc:   { free: ['(0,1)', '(1,0)', '(1,1)'],                  fenced: ['(0,1)', '(1,0)', '(1,1)']                  },
  tso:  { free: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'],         fenced: ['(0,1)', '(1,0)', '(1,1)']                  },
  weak: { free: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'],         fenced: ['(0,1)', '(1,0)', '(1,1)']                  },
};

const ABOUT = {
  sc: 'Sequential consistency (Lamport, 1979) means there exists a single global interleaving of all memory operations consistent with each core\'s program order. Easy to reason about, expensive to implement: every store has to appear before the next instruction can proceed.',
  tso: 'Total Store Ordering lets each core hide its stores in a private FIFO buffer that drains to the cache hierarchy eventually. Loads can bypass the buffer for the same core (store-to-load forwarding), but other cores see a delayed view — so both loads can race ahead of both stores. Formalized for x86 in Sewell et al. 2010.',
  weak: 'Weak ordering (ARMv8-A model, RVWMO) reserves the right to reorder load-load, load-store, store-load, store-store, and even dependent ops through register renaming until you insert a fence. Cheaper hardware, more responsibility on the compiler and on lock-free code authors. Acquire/release loads and stores compile cheaply onto release-consistent hardware.',
};

/* ------------------------------------------------------------------ *
 * Trace builder — sequence of phases the animation walks through.
 * Each phase is { mem, c0, c1, log[] } describing the visible state.
 * ------------------------------------------------------------------ */
function buildTrace(model, fence) {
  if (model === 'sc') {
    return [
      { c0: 'pending ST X=1', c1: 'pending ST Y=1', mem: { x: 0, y: 0 }, log: [] },
      { c0: 'ST X=1 → mem', c1: 'pending ST Y=1', mem: { x: 1, y: 0 }, log: ['core 0 store globally visible'] },
      { c0: 'pending LD Y', c1: 'ST Y=1 → mem', mem: { x: 1, y: 1 }, log: ['core 1 store globally visible'] },
      { c0: 'r1 = LD Y → 1', c1: 'pending LD X', mem: { x: 1, y: 1 }, log: ['r1 = 1'] },
      { c0: 'done', c1: 'r2 = LD X → 1', mem: { x: 1, y: 1 }, log: ['r2 = 1'] },
      { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, log: ['outcome (1,1)'], outcome: '(1,1)' },
    ];
  }
  if (model === 'tso') {
    if (fence) {
      return [
        { c0: 'ST X=1 → buf', c1: 'ST Y=1 → buf', mem: { x: 0, y: 0 }, buf: { c0: 'X=1', c1: 'Y=1' }, log: ['stores parked in store buffers'] },
        { c0: 'MFENCE: drain', c1: 'MFENCE: drain', mem: { x: 1, y: 1 }, buf: {}, log: ['MFENCE forces store buffer to commit before next load'] },
        { c0: 'r1 = LD Y → 1', c1: 'r2 = LD X → 1', mem: { x: 1, y: 1 }, buf: {}, log: ['loads now see the committed stores'] },
        { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, buf: {}, log: ['outcome ∈ {(1,1)} for this interleaving · (0,0) is forbidden'], outcome: '(1,1)' },
      ];
    }
    return [
      { c0: 'ST X=1 → buf', c1: 'ST Y=1 → buf', mem: { x: 0, y: 0 }, buf: { c0: 'X=1', c1: 'Y=1' }, log: ['both stores parked in core-local store buffers'] },
      { c0: 'r1 = LD Y → 0', c1: 'r2 = LD X → 0', mem: { x: 0, y: 0 }, buf: { c0: 'X=1', c1: 'Y=1' }, log: ['loads bypass buffer; main memory still 0'] },
      { c0: 'buf drains', c1: 'buf drains', mem: { x: 1, y: 1 }, buf: {}, log: ['stores reach memory — too late for the loads'] },
      { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, buf: {}, log: ['outcome (0,0) — surprising but legal · MFENCE would forbid'], outcome: '(0,0)' },
    ];
  }
  // weak
  if (fence) {
    return [
      { c0: 'ST X=1', c1: 'ST Y=1', mem: { x: 1, y: 1 }, log: ['stores commit'] },
      { c0: 'DMB ISH', c1: 'DMB ISH', mem: { x: 1, y: 1 }, log: ['fence: predecessor stores must commit before successor loads'] },
      { c0: 'r1 = LD Y → 1', c1: 'r2 = LD X → 1', mem: { x: 1, y: 1 }, log: ['loads observe the committed stores'] },
      { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, log: ['fenced · (0,0) forbidden'], outcome: '(1,1)' },
    ];
  }
  return [
    { c0: 'pending ST X=1', c1: 'pending ST Y=1', mem: { x: 0, y: 0 }, log: ['no fence — order is up to the hardware'] },
    { c0: 'r1 = LD Y → 0', c1: 'r2 = LD X → 0', mem: { x: 0, y: 0 }, log: ['loads issue early; stores not yet visible'] },
    { c0: 'ST X=1 → mem', c1: 'ST Y=1 → mem', mem: { x: 1, y: 1 }, log: ['stores commit eventually'] },
    { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, log: ['outcome (0,0) — DMB ISH (ARM) or FENCE rw,rw (RV) would forbid'], outcome: '(0,0)' },
  ];
}

/* ------------------------------------------------------------------ *
 * Stage layout: Core 0 │ shared memory │ Core 1
 * ------------------------------------------------------------------ */
function Stage({ phase, model, fence, fenceName }) {
  const showFence = fence && model !== 'sc';
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Core
        name="core 0"
        program={['ST X = 1', showFence ? fenceName : null, 'r1 = LD Y'].filter(Boolean)}
        status={phase.c0}
        bufLabel={phase.buf?.c0}
        side="left"
        fenceLineIndex={showFence ? 1 : -1}
      />

      <SharedMemory mem={phase.mem} />

      <Core
        name="core 1"
        program={['ST Y = 1', showFence ? fenceName : null, 'r2 = LD X'].filter(Boolean)}
        status={phase.c1}
        bufLabel={phase.buf?.c1}
        side="right"
        fenceLineIndex={showFence ? 1 : -1}
      />

      <div
        className="md:col-span-3 mt-2 rounded-md px-3 py-2 text-xs"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--rule)',
          color: 'var(--ink-soft)',
        }}
      >
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>trace</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${model}-${fence}-${phase.c0}-${phase.c1}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {phase.log.length === 0 ? <span>—</span> : phase.log.join(' · ')}
            {phase.outcome ? (
              <span className="ml-2 marker" style={{ color: fence && model !== 'sc' ? 'var(--accent-3)' : 'var(--accent-warn)' }}>
                outcome {phase.outcome}
              </span>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Core({ name, program, status, bufLabel, side, fenceLineIndex }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: 'var(--rule-strong)', background: 'var(--bg-soft)' }}
    >
      <div className="marker">{name}</div>
      <ol className="mt-2 flex flex-col gap-1 font-mono text-[12px]" style={{ color: 'var(--ink)' }}>
        {program.map((p, i) => (
          <li
            key={i}
            style={{
              color: i === fenceLineIndex ? 'var(--accent-1)' : 'inherit',
              fontWeight: i === fenceLineIndex ? 600 : 400,
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>{i + 1}.</span> {p}
          </li>
        ))}
      </ol>
      <div className="marker mt-3 truncate" style={{ color: 'var(--accent-1)' }} title={status}>
        {status}
      </div>
      <div className="mt-3">
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>store buffer</div>
        <div
          className="grid h-8 place-items-center rounded border font-mono text-[11px]"
          style={{
            borderColor: bufLabel ? 'var(--accent-amber)' : 'var(--rule)',
            background: bufLabel ? 'rgba(245,180,97,0.08)' : 'transparent',
            color: bufLabel ? 'var(--accent-amber)' : 'var(--ink-faint)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={bufLabel ?? 'empty'}
              initial={{ opacity: 0, x: side === 'left' ? -6 : 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: side === 'left' ? 6 : -6 }}
              transition={{ duration: 0.18 }}
            >
              {bufLabel ?? '—'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SharedMemory({ mem }) {
  return (
    <div
      className="grid place-items-center rounded-xl border p-3"
      style={{ borderColor: 'var(--rule-strong)', background: 'var(--bg)' }}
    >
      <div className="marker mb-2" style={{ color: 'var(--ink-faint)' }}>shared memory</div>
      <div className="grid grid-cols-2 gap-3">
        {(['x', 'y']).map((k) => (
          <div key={k} className="text-center">
            <div className="marker" style={{ color: 'var(--ink-faint)' }}>{k.toUpperCase()}</div>
            <motion.div
              key={`${k}-${mem[k]}`}
              initial={{ scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-1 grid h-12 w-14 place-items-center rounded-md border font-mono text-xl tabular-nums"
              style={{
                borderColor: mem[k] === 1 ? 'var(--accent-1)' : 'var(--rule-strong)',
                color: mem[k] === 1 ? 'var(--accent-1)' : 'var(--ink-soft)',
              }}
            >
              {mem[k]}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

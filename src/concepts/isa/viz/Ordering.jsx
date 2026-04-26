import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

/**
 * Ordering — the classic Dekker / store-buffer test, run under three memory
 * models. Two cores, two locations.
 *
 *   Core 0:  ST X = 1   ;   r1 = LD Y
 *   Core 1:  ST Y = 1   ;   r2 = LD X
 *
 * Under sequential consistency, (r1, r2) = (0, 0) is impossible.
 * Under TSO (x86), it IS possible — the store buffer hides the write from
 *   the other core long enough for both loads to fire first.
 * Under weak ordering (ARM, RISC-V), even more reorderings are observable;
 *   the program needs an explicit fence to recover SC behaviour.
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

export default function Ordering() {
  const reduce = useReducedMotion();
  const [model, setModel] = useState('sc');
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || reduce) return;
    const t = setInterval(() => setTick((n) => (n + 1) % 6), 900);
    return () => clearInterval(t);
  }, [playing, reduce]);

  // Reset tick when switching models so the choreography starts fresh.
  useEffect(() => {
    setTick(0);
  }, [model]);

  const trace = useMemo(() => buildTrace(model), [model]);
  const m = MODELS.find((mm) => mm.id === model);
  const phase = trace[tick % trace.length];

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
        <div className="flex items-center gap-1.5">
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
            onClick={() => {
              setPlaying(false);
              setTick(0);
            }}
            className="ml-2 grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Reset"
            style={{
              borderColor: 'var(--rule-strong)',
              color: 'var(--ink-faint)',
            }}
          >
            <RotateCcw size={11} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label={playing ? 'Pause' : 'Play'}
            style={{
              borderColor: 'var(--rule-strong)',
              color: 'var(--ink)',
            }}
          >
            {playing ? (
              <Pause size={11} aria-hidden="true" />
            ) : (
              <Play size={11} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px lg:grid-cols-[1fr_320px]"
        style={{ background: 'var(--rule)' }}
      >
        <div
          className="px-5 py-5"
          style={{ background: 'var(--bg)' }}
        >
          <Stage phase={phase} model={model} />
        </div>

        <div
          className="px-5 py-5"
          style={{ background: 'var(--bg-soft)' }}
        >
          <div className="marker">model</div>
          <div className="display mt-1 text-lg" style={{ color: m.color }}>
            {m.label}
          </div>
          <div
            className="marker mt-1"
            style={{ color: 'var(--ink-faint)' }}
          >
            {m.one}
          </div>

          <div
            className="mt-4 border-t pt-4 text-xs leading-relaxed"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink-soft)' }}
          >
            {ABOUT[model]}
          </div>

          <div
            className="mt-5 border-t pt-4"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div className="marker">observable outcomes (r1, r2)</div>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs tabular-nums">
              {OUTCOMES.map((o) => {
                const allowed = ALLOWS[model].includes(o);
                return (
                  <div
                    key={o}
                    className="flex items-center justify-between rounded px-2 py-1"
                    style={{
                      background: allowed
                        ? 'rgba(125,243,192,0.08)'
                        : 'transparent',
                      border: '1px solid var(--rule-strong)',
                      color: allowed ? 'var(--ink)' : 'var(--ink-faint)',
                      opacity: allowed ? 1 : 0.5,
                    }}
                  >
                    <span>{o}</span>
                    <span
                      className="marker text-[9px]"
                      style={{
                        color: allowed
                          ? 'var(--accent-3)'
                          : 'var(--accent-warn)',
                      }}
                    >
                      {allowed ? 'allowed' : 'forbidden'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-3 text-[11px] italic"
              style={{ color: 'var(--ink-faint)' }}
            >
              {m.forbid}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const OUTCOMES = ['(0,0)', '(0,1)', '(1,0)', '(1,1)'];

const ALLOWS = {
  sc: ['(0,1)', '(1,0)', '(1,1)'],
  tso: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'],
  weak: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'],
};

const ABOUT = {
  sc: 'Sequential consistency means there exists a single global interleaving of all memory operations consistent with each core\'s program order. Easy to reason about, expensive to implement at scale.',
  tso: 'Total Store Ordering lets each core hide its stores in a private buffer that drains to memory eventually. Loads can bypass the buffer for the same core, but other cores see a delayed view — so both loads can race ahead of both stores.',
  weak: 'Weak ordering reserves the right to reorder almost anything until you insert a fence. Cheaper hardware, more responsibility on the compiler and on lock-free code authors.',
};

/* ------------------------------------------------------------------ *
 * Trace builder — sequence of phases the animation walks through.
 * Each phase is { mem, c0, c1, log[] } describing the visible state.
 * ------------------------------------------------------------------ */
function buildTrace(model) {
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
    return [
      { c0: 'ST X=1 → buf', c1: 'ST Y=1 → buf', mem: { x: 0, y: 0 }, buf: { c0: 'X=1', c1: 'Y=1' }, log: ['both stores parked in core-local store buffers'] },
      { c0: 'r1 = LD Y → 0', c1: 'r2 = LD X → 0', mem: { x: 0, y: 0 }, buf: { c0: 'X=1', c1: 'Y=1' }, log: ['loads bypass buffer; main memory still 0'] },
      { c0: 'buf drains', c1: 'buf drains', mem: { x: 1, y: 1 }, buf: {}, log: ['stores reach memory — too late for the loads'] },
      { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, buf: {}, log: ['outcome (0,0) — surprising but legal'], outcome: '(0,0)' },
    ];
  }
  // weak
  return [
    { c0: 'pending ST X=1', c1: 'pending ST Y=1', mem: { x: 0, y: 0 }, log: ['no fence — order is up to the hardware'] },
    { c0: 'r1 = LD Y → 0', c1: 'r2 = LD X → 0', mem: { x: 0, y: 0 }, log: ['loads issue early; stores not yet visible'] },
    { c0: 'ST X=1 → mem', c1: 'ST Y=1 → mem', mem: { x: 1, y: 1 }, log: ['stores commit eventually'] },
    { c0: 'done', c1: 'done', mem: { x: 1, y: 1 }, log: ['outcome (0,0) — needs DMB / FENCE to forbid'], outcome: '(0,0)' },
  ];
}

/* ------------------------------------------------------------------ *
 * Stage layout: Core 0 │ shared memory │ Core 1
 * ------------------------------------------------------------------ */
function Stage({ phase, model }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Core
        name="core 0"
        program={['ST X = 1', 'r1 = LD Y']}
        status={phase.c0}
        bufLabel={phase.buf?.c0}
        side="left"
      />

      <SharedMemory mem={phase.mem} />

      <Core
        name="core 1"
        program={['ST Y = 1', 'r2 = LD X']}
        status={phase.c1}
        bufLabel={phase.buf?.c1}
        side="right"
      />

      <div
        className="md:col-span-3 mt-2 rounded-md px-3 py-2 text-xs"
        style={{
          background: 'var(--bg-soft)',
          border: '1px solid var(--rule)',
          color: 'var(--ink-soft)',
        }}
      >
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>
          trace
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${model}-${phase.c0}-${phase.c1}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {phase.log.length === 0 ? <span>—</span> : phase.log.join(' · ')}
            {phase.outcome ? (
              <span
                className="ml-2 marker"
                style={{ color: 'var(--accent-warn)' }}
              >
                outcome {phase.outcome}
              </span>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Core({ name, program, status, bufLabel, side }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        borderColor: 'var(--rule-strong)',
        background: 'var(--bg-soft)',
      }}
    >
      <div className="marker">{name}</div>
      <ol
        className="mt-2 flex flex-col gap-1 font-mono text-[12px]"
        style={{ color: 'var(--ink)' }}
      >
        {program.map((p, i) => (
          <li key={i}>
            <span style={{ color: 'var(--ink-faint)' }}>{i + 1}.</span> {p}
          </li>
        ))}
      </ol>
      <div
        className="marker mt-3 truncate"
        style={{ color: 'var(--accent-1)' }}
        title={status}
      >
        {status}
      </div>
      <div className="mt-3">
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>
          store buffer
        </div>
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
      style={{
        borderColor: 'var(--rule-strong)',
        background: 'var(--bg)',
      }}
    >
      <div className="marker mb-2" style={{ color: 'var(--ink-faint)' }}>
        shared memory
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(['x', 'y']).map((k) => (
          <div key={k} className="text-center">
            <div
              className="marker"
              style={{ color: 'var(--ink-faint)' }}
            >
              {k.toUpperCase()}
            </div>
            <motion.div
              key={`${k}-${mem[k]}`}
              initial={{ scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="mt-1 grid h-12 w-14 place-items-center rounded-md border font-mono text-xl tabular-nums"
              style={{
                borderColor:
                  mem[k] === 1 ? 'var(--accent-1)' : 'var(--rule-strong)',
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

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';

/**
 * OperandCount — same expression `(a + b) * c` compiled four ways:
 *   0-operand stack machine   (Burroughs / JVM / WebAssembly)
 *   1-operand accumulator     (6502 / 8080)
 *   2-operand register-memory (x86)
 *   3-operand load-store      (RISC-V / ARM)
 *
 * Step button advances all four in lockstep so the reader sees how operand
 * count trades code density for register pressure and dependency depth.
 *
 * Footer summarizes:
 *   bytes — encoded instruction byte count at the end of the program
 *   chain — length of the architectural-register dependency chain
 */

const STACK = {
  name: 'stack · 0-operand',
  example: 'Burroughs B5000 · JVM · WebAssembly',
  bytes: 11,            // 4 × push (2B each w/ small index) + 2 × arith (1B each), illustrative
  chain: 5,             // every step writes the same TOS
  steps: [
    { asm: 'push a', stack: ['a'], note: 'fetch a → top of stack' },
    { asm: 'push b', stack: ['a', 'b'], note: 'fetch b → top of stack' },
    { asm: 'add', stack: ['(a+b)'], note: 'pop two, push sum' },
    { asm: 'push c', stack: ['(a+b)', 'c'], note: 'fetch c → top of stack' },
    { asm: 'mul', stack: ['(a+b)*c'], note: 'pop two, push product' },
  ],
};

const ACC = {
  name: 'accumulator · 1-operand',
  example: '6502 · 8080 · early micros',
  bytes: 9,             // 3 × 3-byte instructions w/ absolute address operand
  chain: 3,             // every step writes ACC
  steps: [
    { asm: 'lda a', acc: 'a', note: 'load a into ACC' },
    { asm: 'add b', acc: '(a+b)', note: 'ACC ← ACC + b' },
    { asm: 'mul c', acc: '(a+b)*c', note: 'ACC ← ACC * c' },
  ],
};

const X86 = {
  name: 'register-memory · 2-operand',
  example: 'x86 / x86-64',
  bytes: 21,            // ~7B per RIP-relative mov/add/imul w/ disp32
  chain: 3,             // every step is rax ← rax ⊕ mem
  steps: [
    {
      asm: 'mov rax, [a]',
      regs: { rax: 'a' },
      note: 'rax ← mem[a]',
    },
    {
      asm: 'add rax, [b]',
      regs: { rax: '(a+b)' },
      note: 'dest ← dest + src',
    },
    {
      asm: 'imul rax, [c]',
      regs: { rax: '(a+b)*c' },
      note: 'dest ← dest * src',
    },
  ],
};

const RISC = {
  name: 'load-store · 3-operand',
  example: 'RISC-V · ARM AArch64 · MIPS',
  bytes: 20,            // 5 × 4-byte fixed instructions
  chain: 3,             // ld a → ld b can issue in parallel; add → mul is the chain
  steps: [
    { asm: 'ld   x1, a', regs: { x1: 'a' }, note: 'x1 ← mem[a] · independent' },
    { asm: 'ld   x2, b', regs: { x1: 'a', x2: 'b' }, note: 'x2 ← mem[b] · independent of x1' },
    {
      asm: 'add  x3, x1, x2',
      regs: { x1: 'a', x2: 'b', x3: '(a+b)' },
      note: 'dest = src1 + src2',
    },
    {
      asm: 'ld   x4, c',
      regs: { x1: 'a', x2: 'b', x3: '(a+b)', x4: 'c' },
      note: 'x4 ← mem[c] · independent again',
    },
    {
      asm: 'mul  x5, x3, x4',
      regs: {
        x1: 'a',
        x2: 'b',
        x3: '(a+b)',
        x4: 'c',
        x5: '(a+b)*c',
      },
      note: 'dest = src1 * src2',
    },
  ],
};

const TRACKS = [STACK, ACC, X86, RISC];
const MAX_STEPS = Math.max(...TRACKS.map((t) => t.steps.length));

export default function Operands() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || reduce) return;
    const t = setInterval(() => {
      setStep((s) => {
        const next = s + 1;
        if (next > MAX_STEPS) {
          return 0;
        }
        return next;
      });
    }, 1100);
    return () => clearInterval(t);
  }, [playing, reduce]);

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">
          (a + b) × c · same expression · four contracts
        </div>
        <div className="flex items-center gap-2">
          <div
            className="marker tabular-nums"
            style={{ color: 'var(--ink-faint)' }}
          >
            step {Math.min(step, MAX_STEPS)} / {MAX_STEPS}
          </div>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setStep(0);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border"
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
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, MAX_STEPS))}
            className="ml-1 marker rounded-full border px-3 py-1 text-[10px]"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            step ▸
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4"
        style={{ borderColor: 'var(--rule)' }}
      >
        {TRACKS.map((t) => (
          <Track key={t.name} track={t} step={step} />
        ))}
      </div>

      <div
        className="grid grid-cols-2 gap-px border-t lg:grid-cols-4"
        style={{ borderColor: 'var(--rule)', background: 'var(--rule)' }}
      >
        {TRACKS.map((t) => (
          <div
            key={t.name}
            className="flex items-baseline justify-between px-5 py-3"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="marker" style={{ color: 'var(--ink-faint)' }}>
              {t.steps.length} ops
            </div>
            <div
              className="font-mono text-[11px] tabular-nums"
              style={{ color: 'var(--ink-soft)' }}
            >
              ≈{t.bytes}B · chain {t.chain}
            </div>
          </div>
        ))}
      </div>

      <div
        className="border-t px-5 py-3 text-xs"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink-faint)' }}
      >
        Same arithmetic. Implicit operands save bytes; explicit operands buy schedulability — only the load-store track has independent loads, so a wide back end can issue x1 and x2 in the same cycle. Stack and accumulator chain everything through one architectural location, which is exactly what an out-of-order engine cannot widen.
      </div>
    </div>
  );
}

function Track({ track, step }) {
  const visible = track.steps.slice(0, Math.min(step, track.steps.length));
  const current = track.steps[Math.min(step, track.steps.length) - 1];
  const done = step >= track.steps.length;
  return (
    <div className="px-5 py-5">
      <div className="display text-base">{track.name}</div>
      <div className="marker mt-1" style={{ color: 'var(--ink-faint)' }}>
        {track.example}
      </div>

      <div className="mt-4 min-h-[140px]">
        <ol className="flex flex-col gap-1.5 font-mono text-[12px]">
          {track.steps.map((s, i) => {
            const reached = i < visible.length;
            const isActive = reached && i === visible.length - 1;
            return (
              <li
                key={i}
                className="flex items-baseline gap-2 transition-colors"
                style={{
                  color: reached
                    ? isActive
                      ? 'var(--ink)'
                      : 'var(--ink-soft)'
                    : 'var(--ink-faint)',
                  opacity: reached ? 1 : 0.35,
                }}
              >
                <span
                  className="tabular-nums"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ color: isActive ? 'var(--accent-1)' : 'inherit' }}>
                  {s.asm}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-4">
        <StateView track={track} step={step} />
      </div>

      <div
        className="mt-3 min-h-[18px] text-[11px] italic"
        style={{ color: 'var(--ink-soft)' }}
      >
        {current?.note ?? (done ? '✓ result on top of state' : '—')}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * StateView dispatches per machine type — stack, accumulator, regs.
 * ------------------------------------------------------------------ */
function StateView({ track, step }) {
  const idx = Math.min(step, track.steps.length) - 1;
  const s = track.steps[idx];

  if (track.steps[0].stack) {
    const stack = s?.stack ?? [];
    return (
      <div>
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>
          stack
        </div>
        <div
          className="flex min-h-[80px] flex-col-reverse gap-1 rounded-md p-2"
          style={{ background: 'var(--bg-soft)' }}
        >
          <AnimatePresence initial={false}>
            {stack.map((v, i) => (
              <motion.div
                key={`${i}-${v}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="rounded border px-2 py-1 font-mono text-xs"
                style={{
                  borderColor:
                    i === stack.length - 1
                      ? 'var(--accent-1)'
                      : 'var(--rule-strong)',
                  color:
                    i === stack.length - 1 ? 'var(--accent-1)' : 'var(--ink)',
                }}
              >
                {v}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (track.steps[0].acc !== undefined) {
    return (
      <div>
        <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>
          ACC
        </div>
        <motion.div
          key={s?.acc ?? '—'}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-md border px-3 py-3 font-mono text-sm"
          style={{
            borderColor: s ? 'var(--accent-1)' : 'var(--rule-strong)',
            color: s ? 'var(--accent-1)' : 'var(--ink-faint)',
            background: 'var(--bg-soft)',
          }}
        >
          {s?.acc ?? '—'}
        </motion.div>
      </div>
    );
  }

  // register file
  const regs = s?.regs ?? {};
  const slots = Object.keys(track.steps[track.steps.length - 1].regs);
  return (
    <div>
      <div className="marker mb-1" style={{ color: 'var(--ink-faint)' }}>
        registers
      </div>
      <div
        className="grid grid-cols-1 gap-1 rounded-md p-2"
        style={{ background: 'var(--bg-soft)' }}
      >
        {slots.map((r) => (
          <div
            key={r}
            className="flex items-baseline gap-2 font-mono text-[11px]"
          >
            <span style={{ color: 'var(--ink-faint)', width: 28 }}>{r}</span>
            <motion.span
              key={regs[r] ?? '—'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              style={{
                color: regs[r] ? 'var(--ink)' : 'var(--ink-faint)',
              }}
            >
              {regs[r] ?? '—'}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}

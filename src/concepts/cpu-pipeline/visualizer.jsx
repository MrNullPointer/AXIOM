import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';

/**
 * PipelineVisualizer — scrubbable cycle timeline.
 *
 * Each row is an instruction; each column is a cycle; cells colour by stage.
 * Hazards (RAW between consecutive instructions) are drawn as glowing
 * forwarding arcs from the producer's EX/MEM cell to the consumer's EX cell.
 *
 * "Branch mispredict" toggle squashes everything in the front-end after the beq.
 */
const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
const STAGE_COLORS = {
  IF: 'var(--accent-1)',
  ID: 'var(--accent-2)',
  EX: 'var(--accent-3)',
  MEM: 'var(--accent-1)',
  WB: 'var(--accent-2)',
};

const PROGRAM = [
  { asm: 'lw   x5, 0(x6)', dest: 'x5', srcs: ['x6'], isLoad: true },
  { asm: 'add  x7, x5, x8', dest: 'x7', srcs: ['x5', 'x8'] },
  { asm: 'sub  x9, x7, x1', dest: 'x9', srcs: ['x7', 'x1'] },
  { asm: 'beq  x9, x0, +12', dest: null, srcs: ['x9', 'x0'], isBranch: true },
  { asm: 'or   x2, x3, x4', dest: 'x2', srcs: ['x3', 'x4'] },
  { asm: 'and  x10,x2, x5', dest: 'x10', srcs: ['x2', 'x5'] },
  { asm: 'sw   x10,4(x6)', dest: null, srcs: ['x10', 'x6'], isStore: true },
];

const CYCLES = 14;

export default function PipelineVisualizer() {
  const [cycle, setCycle] = useState(7);
  const [playing, setPlaying] = useState(false);
  const [mispredict, setMispredict] = useState(false);
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());

  useEffect(() => {
    if (!playing) return;
    function tick(now) {
      const dt = now - lastRef.current;
      if (dt > 600) {
        lastRef.current = now;
        setCycle((c) => (c + 1) % CYCLES);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const grid = useMemo(() => buildGrid(mispredict), [mispredict]);
  const hazards = useMemo(() => detectHazards(), []);

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">five-stage pipeline · cycle by cycle</div>
        <div className="flex items-center gap-2">
          <Pill active={!mispredict} onClick={() => setMispredict(false)}>
            predict taken
          </Pill>
          <Pill active={mispredict} onClick={() => setMispredict(true)}>
            <Zap size={11} aria-hidden="true" /> mispredict
          </Pill>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="ml-2 grid h-7 w-7 place-items-center rounded-full border"
            aria-label={playing ? 'Pause' : 'Play'}
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            {playing ? <Pause size={11} /> : <Play size={11} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setCycle(0);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border"
            aria-label="Reset"
            style={{ borderColor: 'var(--rule-strong)', color: 'var(--ink)' }}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="mb-2 grid"
          style={{ gridTemplateColumns: `12rem repeat(${CYCLES}, minmax(28px, 1fr))` }}
        >
          <div />
          {Array.from({ length: CYCLES }, (_, i) => (
            <div
              key={i}
              className="text-center font-mono text-[10px] tabular-nums"
              style={{ color: i === cycle ? 'var(--ink)' : 'var(--ink-faint)' }}
            >
              {i}
            </div>
          ))}
        </div>

        {PROGRAM.map((instr, row) => {
          return (
            <div
              key={row}
              className="grid items-center"
              style={{ gridTemplateColumns: `12rem repeat(${CYCLES}, minmax(28px, 1fr))` }}
            >
              <div className="py-1 pr-3 font-mono text-xs" style={{ color: 'var(--ink-soft)' }}>
                {instr.asm}
              </div>
              {Array.from({ length: CYCLES }, (_, col) => {
                const cell = grid[row]?.[col];
                if (!cell) return <div key={col} className="h-6" />;
                if (cell === 'SQUASH') {
                  return (
                    <div
                      key={col}
                      className="mx-px my-px rounded-sm border text-center font-mono text-[9px]"
                      style={{
                        borderColor: 'var(--accent-warn)',
                        color: 'var(--accent-warn)',
                        background: 'transparent',
                      }}
                      title="Squashed by branch mispredict"
                    >
                      ✕
                    </div>
                  );
                }
                const isCurrent = col === cycle;
                return (
                  <motion.div
                    key={col}
                    className="mx-px my-px rounded-sm text-center font-mono text-[9px]"
                    initial={false}
                    animate={{
                      opacity: isCurrent ? 1 : col < cycle ? 0.45 : 0.18,
                      scale: isCurrent ? 1 : 0.96,
                    }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background: STAGE_COLORS[cell],
                      color: 'var(--bg)',
                      paddingTop: 1,
                      paddingBottom: 1,
                    }}
                  >
                    {cell}
                  </motion.div>
                );
              })}
            </div>
          );
        })}

        <HazardOverlay hazards={hazards} cycle={cycle} mispredict={mispredict} />

        <div
          className="marker mt-3 flex items-center justify-between border-t pt-3"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span>cycle · {String(cycle).padStart(2, '0')}</span>
          <span style={{ color: mispredict ? 'var(--accent-warn)' : 'var(--ink-faint)' }}>
            {mispredict ? '⚡ branch mispredict — front-end squashed' : 'branch predicted taken — pipeline full'}
          </span>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-3 border-t px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        {STAGES.map((s) => (
          <span key={s} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: STAGE_COLORS[s] }}
              aria-hidden="true"
            />
            <span className="marker" style={{ color: 'var(--ink-faint)' }}>
              {s}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="marker flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px]"
      style={{
        borderColor: active ? 'var(--ink)' : 'var(--rule-strong)',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
        background: active ? 'var(--glass-bg)' : 'transparent',
      }}
    >
      {children}
    </button>
  );
}

function buildGrid(mispredict) {
  // grid[row][col] = stage name | 'SQUASH' | undefined
  const grid = PROGRAM.map(() => new Array(CYCLES).fill(undefined));
  let rowOffset = 0;
  PROGRAM.forEach((instr, row) => {
    const start = row + rowOffset;
    STAGES.forEach((stage, i) => {
      const col = start + i;
      if (col >= CYCLES) return;
      grid[row][col] = stage;
    });
  });

  if (mispredict) {
    const branchRow = PROGRAM.findIndex((p) => p.isBranch);
    // After branch enters EX (resolution), squash anything younger in IF/ID.
    const branchEx = branchRow + 2; // start + 2 is EX
    for (let r = branchRow + 1; r < PROGRAM.length; r++) {
      for (let c = 0; c < CYCLES; c++) {
        const v = grid[r][c];
        if (!v) continue;
        if ((v === 'IF' || v === 'ID') && c <= branchEx) {
          grid[r][c] = 'SQUASH';
        }
        // delete subsequent stages of squashed instructions; they'll re-enter
        if (c > branchEx) {
          // shift their pipeline to start refilling at branchEx+1
          grid[r][c] = undefined;
        }
      }
      // After squash, instructions re-fetch from cycle branchEx+1
      const refetchStart = branchEx + 1 + (r - branchRow - 1);
      STAGES.forEach((stage, i) => {
        const col = refetchStart + i;
        if (col >= CYCLES) return;
        grid[r][col] = stage;
      });
    }
  }

  return grid;
}

function detectHazards() {
  const out = [];
  for (let i = 1; i < PROGRAM.length; i++) {
    const cur = PROGRAM[i];
    for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
      const prev = PROGRAM[j];
      if (prev.dest && cur.srcs.includes(prev.dest)) {
        out.push({ from: j, to: i });
      }
    }
  }
  return out;
}

function HazardOverlay({ hazards, cycle, mispredict }) {
  if (mispredict) return null;
  return (
    <div className="marker mt-3 flex flex-wrap gap-3" style={{ color: 'var(--ink-faint)' }}>
      <span>raw hazards · forwarded ↓</span>
      {hazards.map((h, i) => (
        <span
          key={i}
          className="rounded-full border px-2 py-0.5"
          style={{
            borderColor: 'var(--accent-3)',
            color: cycle >= h.to + 2 ? 'var(--accent-3)' : 'var(--ink-faint)',
          }}
        >
          {PROGRAM[h.from].asm.split(' ')[0]} → {PROGRAM[h.to].asm.split(' ')[0]}
        </span>
      ))}
    </div>
  );
}

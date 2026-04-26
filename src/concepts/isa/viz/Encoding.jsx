import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * EncodingVisualizer — same instruction `add x5, x6, x7` decoded across three
 * architectures. Hover any field to see what those bits mean across all of them.
 */
const FIELDS = ['opcode', 'dest', 'source 1', 'source 2', 'function'];

const ARCHES = [
  {
    name: 'RISC-V',
    asm: 'add x5, x6, x7',
    encoding: '32-bit fixed',
    bytes: 4,
    bits: [
      { label: 'opcode', value: '0110011', span: 7, color: 'var(--accent-1)' },
      { label: 'dest', value: '00101', span: 5, color: 'var(--accent-2)' },
      { label: 'function', value: '000', span: 3, color: 'var(--accent-3)' },
      { label: 'source 1', value: '00110', span: 5, color: 'var(--accent-2)' },
      { label: 'source 2', value: '00111', span: 5, color: 'var(--accent-2)' },
      { label: 'function', value: '0000000', span: 7, color: 'var(--accent-3)' },
    ],
  },
  {
    name: 'ARM (AArch64)',
    asm: 'add x5, x6, x7',
    encoding: '32-bit fixed',
    bytes: 4,
    bits: [
      { label: 'opcode', value: '10001011', span: 8, color: 'var(--accent-1)' },
      { label: 'function', value: '00000', span: 5, color: 'var(--accent-3)' },
      { label: 'source 2', value: '00111', span: 5, color: 'var(--accent-2)' },
      { label: 'function', value: '000000', span: 6, color: 'var(--accent-3)' },
      { label: 'source 1', value: '00110', span: 5, color: 'var(--accent-2)' },
      { label: 'dest', value: '00101', span: 5, color: 'var(--accent-2)' },
    ],
  },
  {
    name: 'x86-64',
    asm: 'add rax, rbx',
    encoding: 'variable, 1–15 bytes',
    bytes: 3,
    bits: [
      { label: 'opcode', value: '01001000', span: 8, color: 'var(--accent-1)' },
      { label: 'opcode', value: '00000001', span: 8, color: 'var(--accent-1)' },
      { label: 'dest', value: '11', span: 2, color: 'var(--accent-2)' },
      { label: 'source 2', value: '011', span: 3, color: 'var(--accent-2)' },
      { label: 'source 1', value: '000', span: 3, color: 'var(--accent-2)' },
    ],
  },
];

export default function EncodingVisualizer() {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">same instruction · three contracts</div>
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((f) => (
            <button
              key={f}
              type="button"
              onMouseEnter={() => setHovered(f)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(f)}
              onBlur={() => setHovered(null)}
              className="marker rounded-full border px-2 py-1 text-[10px] transition-colors"
              style={{
                borderColor: hovered === f ? 'var(--ink)' : 'var(--rule-strong)',
                color: hovered === f ? 'var(--ink)' : 'var(--ink-faint)',
                background: hovered === f ? 'var(--glass-bg)' : 'transparent',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0"
        style={{ borderColor: 'var(--rule)' }}
      >
        {ARCHES.map((arch) => (
          <ArchPanel key={arch.name} arch={arch} hovered={hovered} />
        ))}
      </div>
    </div>
  );
}

function ArchPanel({ arch, hovered }) {
  const totalBits = arch.bits.reduce((n, b) => n + b.span, 0);
  return (
    <div className="px-5 py-5" style={{ borderColor: 'var(--rule)' }}>
      <div className="flex items-baseline justify-between">
        <h4 className="display text-xl">{arch.name}</h4>
        <div className="marker" style={{ color: 'var(--ink-faint)' }}>
          {arch.bytes} B · {totalBits}b
        </div>
      </div>

      <div className="font-mono text-base mt-3" style={{ color: 'var(--ink)' }}>
        <span style={{ color: 'var(--accent-1)' }}>{arch.asm.split(' ')[0]}</span>{' '}
        <span style={{ color: 'var(--ink-soft)' }}>
          {arch.asm.split(' ').slice(1).join(' ')}
        </span>
      </div>

      <div
        className="mt-5 grid w-full overflow-hidden rounded-md"
        style={{
          gridTemplateColumns: arch.bits.map((b) => `${b.span}fr`).join(' '),
          background: 'var(--rule)',
          gap: '1px',
        }}
      >
        {arch.bits.map((b, i) => {
          const dim = hovered && b.label !== hovered;
          return (
            <motion.div
              key={i}
              className="px-1 py-2 text-center"
              animate={{ opacity: dim ? 0.18 : 1 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--bg-soft)',
                borderTop: `2px solid ${b.color}`,
              }}
            >
              <div
                className="font-mono text-[10px] tabular-nums"
                style={{ color: 'var(--ink)' }}
              >
                {b.value}
              </div>
              <div className="marker mt-1 text-[9px]" style={{ color: 'var(--ink-faint)' }}>
                {b.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="marker mt-4" style={{ color: 'var(--ink-faint)' }}>
        encoding · {arch.encoding}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * EncodingVisualizer — same instruction `add x5, x6, x7` decoded across
 * three architectures. Hover any role chip to see how that semantic field
 * is laid out under each contract.
 *
 * Field roles (semantic, not bit-positional):
 *   prefix      — REX/VEX/EVEX or sub-opcode-class bits (x86, ARM)
 *   opcode      — primary operation selector
 *   funct       — secondary function bits that pick a specific op
 *   addr-mode   — ModR/M.mod or ARM shift-type bits selecting addressing
 *   src1        — first source register (rs1, Rn, r/m)
 *   src2        — second source register (rs2, Rm, reg)
 *   dest        — destination register (rd, Rd, r/m)
 *   imm         — immediate / shift amount (when present)
 *
 * Bit-position annotations follow each architecture's reference manual:
 *   RISC-V Unprivileged ISA spec, R-type:    funct7 | rs2 | rs1 | funct3 | rd | opcode
 *   ARM A64 ADD (shifted register, 64-bit):  sf|0|0 | 01011 | shift | 0 | Rm | imm6 | Rn | Rd
 *   x86-64 ADD r/m64, r64:                   REX(0x48) + opcode(0x01) + ModR/M(mod|reg|r/m)
 */

const FIELD_ROLES = [
  'prefix',
  'opcode',
  'funct',
  'addr-mode',
  'src1',
  'src2',
  'dest',
];

const ARCHES = [
  {
    name: 'RISC-V (RV64I R-type)',
    asm: 'add x5, x6, x7',
    encoding: '32-bit fixed · R-type',
    bytes: 4,
    note: 'funct7 | rs2 | rs1 | funct3 | rd | opcode (MSB → LSB)',
    bits: [
      { role: 'funct',  label: 'funct7',  value: '0000000', span: 7, range: '[31:25]' },
      { role: 'src2',   label: 'rs2',     value: '00111',   span: 5, range: '[24:20]' },
      { role: 'src1',   label: 'rs1',     value: '00110',   span: 5, range: '[19:15]' },
      { role: 'funct',  label: 'funct3',  value: '000',     span: 3, range: '[14:12]' },
      { role: 'dest',   label: 'rd',      value: '00101',   span: 5, range: '[11:7]'  },
      { role: 'opcode', label: 'opcode',  value: '0110011', span: 7, range: '[6:0]'   },
    ],
  },
  {
    name: 'ARM AArch64 (ADD shifted-register)',
    asm: 'add x5, x6, x7',
    encoding: '32-bit fixed · A64',
    bytes: 4,
    note: 'sf|op|S | 01011 | shift | 0 | Rm | imm6 | Rn | Rd (MSB → LSB)',
    bits: [
      { role: 'opcode',    label: 'sf|op|S|01011', value: '10001011', span: 8, range: '[31:24]' },
      { role: 'addr-mode', label: 'shift|0',       value: '000',      span: 3, range: '[23:21]' },
      { role: 'src2',      label: 'Rm',            value: '00111',    span: 5, range: '[20:16]' },
      { role: 'funct',     label: 'imm6',          value: '000000',   span: 6, range: '[15:10]' },
      { role: 'src1',      label: 'Rn',            value: '00110',    span: 5, range: '[9:5]'   },
      { role: 'dest',      label: 'Rd',            value: '00101',    span: 5, range: '[4:0]'   },
    ],
  },
  {
    name: 'x86-64 (ADD r/m64, r64)',
    asm: 'add rax, rbx',
    encoding: 'variable · 1–15 bytes',
    bytes: 3,
    note: 'REX prefix(0x48) | opcode(0x01) | ModR/M(mod | reg | r/m)',
    bits: [
      { role: 'prefix',    label: 'REX.W',  value: '01001000', span: 8, range: 'prefix byte' },
      { role: 'opcode',    label: 'opcode', value: '00000001', span: 8, range: 'opcode byte' },
      { role: 'addr-mode', label: 'mod',    value: '11',       span: 2, range: 'ModR/M[7:6]' },
      { role: 'src2',      label: 'reg',    value: '011',      span: 3, range: 'ModR/M[5:3]' },
      { role: 'dest',      label: 'r/m',    value: '000',      span: 3, range: 'ModR/M[2:0]' },
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
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">same instruction · three contracts · hover a role to trace it</div>
        <div className="flex flex-wrap gap-2">
          {FIELD_ROLES.map((f) => (
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

function roleColor(role) {
  switch (role) {
    case 'opcode':    return 'var(--accent-1)';
    case 'funct':     return 'var(--accent-3)';
    case 'addr-mode': return 'var(--accent-amber)';
    case 'prefix':    return 'var(--accent-warn)';
    case 'src1':
    case 'src2':
    case 'dest':      return 'var(--accent-2)';
    default:          return 'var(--rule-strong)';
  }
}

function ArchPanel({ arch, hovered }) {
  const totalBits = arch.bits.reduce((n, b) => n + b.span, 0);
  return (
    <div className="px-5 py-5" style={{ borderColor: 'var(--rule)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="display text-base lg:text-lg leading-tight">{arch.name}</h4>
        <div className="marker shrink-0" style={{ color: 'var(--ink-faint)' }}>
          {arch.bytes} B · {totalBits} b
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
          const dim = hovered && b.role !== hovered;
          return (
            <motion.div
              key={i}
              className="px-1 py-2 text-center"
              animate={{ opacity: dim ? 0.18 : 1 }}
              transition={{ duration: 0.25 }}
              style={{
                background: 'var(--bg-soft)',
                borderTop: `2px solid ${roleColor(b.role)}`,
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
              <div className="marker mt-0.5 text-[8px]" style={{ color: 'var(--ink-faint)', opacity: 0.65 }}>
                {b.range}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="marker mt-4" style={{ color: 'var(--ink-faint)' }}>
        encoding · {arch.encoding}
      </div>
      <div className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--ink-faint)' }}>
        {arch.note}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * State — programmer-visible state across the three living lineages.
 *
 * The point of this visualization is to make the abstract machine concrete.
 * An ISA is a finite collection of named bits the contract says exist; this
 * panel enumerates those bits for each architecture so the reader can see
 * exactly how much "state" they are reasoning about when they write code
 * for one or another.
 *
 * Tabs along the top let the reader pick a lineage; the body groups the
 * state into four columns:
 *
 *   1. General-purpose registers
 *   2. Program counter & flags / PSTATE
 *   3. Vector / floating-point / matrix register file
 *   4. Privilege model (rings / ELs / U-S-M)
 */

const ARCHES = [
  {
    id: 'arm',
    label: 'ARM AArch64',
    accent: 'var(--accent-1)',
    gprs: {
      title: '31 × 64-bit GPRs',
      detail:
        'X0–X30 (W0–W30 are 32-bit views). X29 is the frame pointer (FP) by AAPCS64 convention; X30 is the link register (LR). There is no architectural X31 — the encoding maps it to either WZR/XZR (zero register) or SP (stack pointer) depending on the instruction. Reading XZR yields zero; writing it discards.',
      grid: ['X0','X1','X2','X3','X4','X5','X6','X7','X8','X9','X10','X11','X12','X13','X14','X15','X16','X17','X18','X19','X20','X21','X22','X23','X24','X25','X26','X27','X28','X29','X30','SP/ZR'],
    },
    pcFlags: {
      title: 'PC + PSTATE',
      detail:
        'PC is not a writable GPR in A64 — branches go through B/BR/BL/BLR. PSTATE bundles condition flags NZCV (Negative, Zero, Carry, oVerflow), interrupt mask bits DAIF, current EL, single-step state, and stack-pointer selection bit SPSel. On exception entry, PSTATE is banked into SPSR_ELx and the return address into ELR_ELx so the OS can resume.',
      bits: ['N','Z','C','V','D','A','I','F','EL[1:0]','SPSel','SS','IL'],
    },
    vec: {
      title: '32 × 128-bit V regs · SVE/SME tiles',
      detail:
        'V0–V31 are 128-bit SIMD/FP registers (NEON). Each can be addressed as B/H/S/D/Q for 8/16/32/64/128-bit lanes. SVE/SVE2 widens these to vector-length-agnostic Z0–Z31 (128–2048 bits, implementation-defined); SME adds a 2-D ZA matrix tile array up to SVL × SVL bytes. Predicate registers P0–P15 (one bit per byte lane) gate per-lane execution.',
      grid: ['V0','V1','V2','V3','V4','V5','V6','V7','V8','V9','V10','V11','V12','V13','V14','V15','V16','V17','V18','V19','V20','V21','V22','V23','V24','V25','V26','V27','V28','V29','V30','V31'],
    },
    privilege: {
      title: 'Exception levels EL0 → EL3',
      detail:
        'EL0 = user, EL1 = kernel, EL2 = hypervisor, EL3 = secure monitor. Each level has its own banked stack pointer (SP_ELx), saved program status (SPSR_ELx), exception link register (ELR_ELx), and translation table base (TTBR0/TTBR1_ELx). Transitions use SVC (to EL1), HVC (to EL2), SMC (to EL3), or are taken implicitly on exceptions through VBAR_ELx vectors.',
      tiers: [
        { name: 'EL3', role: 'secure monitor / firmware' },
        { name: 'EL2', role: 'hypervisor' },
        { name: 'EL1', role: 'OS kernel' },
        { name: 'EL0', role: 'user code' },
      ],
    },
  },

  {
    id: 'x86',
    label: 'x86-64',
    accent: 'var(--accent-2)',
    gprs: {
      title: '16 × 64-bit GPRs',
      detail:
        'RAX–RDX, RSI, RDI, RBP, RSP, R8–R15. Legacy partial-register names persist (EAX = low 32, AX = low 16, AL/AH = byte halves) which is one source of partial-register stalls in older microarchitectures. RIP is not a GPR but is RIP-relative addressable through ModR/M. Two segment-base MSRs (FSBASE, GSBASE) act as per-thread / per-CPU pointers and are heavily used by TLS and kernel per-CPU data.',
      grid: ['RAX','RBX','RCX','RDX','RSI','RDI','RBP','RSP','R8','R9','R10','R11','R12','R13','R14','R15'],
    },
    pcFlags: {
      title: 'RIP + RFLAGS',
      detail:
        'RIP is the instruction pointer (read-only architecturally; written via JMP/CALL/RET). RFLAGS is a 64-bit status register; the low 32 bits expose CF, ZF, SF, OF, AF, PF (arithmetic), DF (direction), IF (interrupts), TF (trap), IOPL[1:0], NT, RF, VM, AC, VIF, VIP, ID. CR0/CR2/CR3/CR4/CR8 hold mode bits, page-fault address, page-table root, feature enables, and task priority. MSRs (Model-Specific Registers) like EFER, IA32_SYSENTER_*, FS/GS_BASE, IA32_STAR/LSTAR/CSTAR/FMASK live in a 32-bit address space accessed by RDMSR/WRMSR.',
      bits: ['CF','PF','AF','ZF','SF','TF','IF','DF','OF','IOPL','NT','RF','VM','AC','ID'],
    },
    vec: {
      title: 'XMM/YMM/ZMM · 16 → 32 × 128/256/512-bit',
      detail:
        'XMM0–XMM15 (SSE, 128-bit), widened to YMM0–YMM15 (AVX/AVX2, 256-bit) and to ZMM0–ZMM31 (AVX-512, 512-bit; doubles the count). Eight opmask registers k0–k7 gate AVX-512 lanes. AMX adds 8 × 1 KB TMM tile registers and a TILECFG descriptor for matrix multiply-accumulate. The legacy x87 FPU stack (ST0–ST7) and MMX (MM0–MM7, aliased to x87) survive but are off the modern hot path.',
      grid: ['ZMM0','ZMM1','ZMM2','ZMM3','ZMM4','ZMM5','ZMM6','ZMM7','ZMM8','ZMM9','ZMM10','ZMM11','ZMM12','ZMM13','ZMM14','ZMM15','ZMM16','ZMM17','ZMM18','ZMM19','ZMM20','ZMM21','ZMM22','ZMM23','ZMM24','ZMM25','ZMM26','ZMM27','ZMM28','ZMM29','ZMM30','ZMM31'],
    },
    privilege: {
      title: 'Rings 0 / 1 / 2 / 3',
      detail:
        'Architecturally four rings, but in practice only ring 0 (kernel) and ring 3 (user) are used; rings 1 and 2 sit unused except in some legacy paravirtualization schemes. Transitions go through SYSCALL/SYSRET (fast path, AMD64) or SYSENTER/SYSEXIT (Intel legacy), or through INT/IRET for legacy interrupts. Newer extensions add VMX root/non-root for Intel virtualization, SMM (System Management Mode) below ring 0, and confidential-VM modes (TDX, SEV-SNP).',
      tiers: [
        { name: 'SMM', role: 'firmware-only mode' },
        { name: 'Ring 0', role: 'kernel · privileged' },
        { name: 'Ring 1/2', role: '(legacy / unused)' },
        { name: 'Ring 3', role: 'user code' },
      ],
    },
  },

  {
    id: 'riscv',
    label: 'RISC-V',
    accent: 'var(--accent-3)',
    gprs: {
      title: '32 × XLEN-bit GPRs (x0 hardwired 0)',
      detail:
        'x0–x31. x0 is the constant zero register — reads return 0, writes are silently discarded, which lets every instruction encode "compare-with-zero" or "move-to-zero" cleanly. ABI names: ra (x1, return address), sp (x2), gp (x3), tp (x4), t0–t6 (temporaries), s0–s11 (callee-saved), a0–a7 (argument / return). XLEN ∈ {32, 64, 128} chosen by the base ISA (RV32I, RV64I, RV128I).',
      grid: ['x0/zero','x1/ra','x2/sp','x3/gp','x4/tp','x5/t0','x6/t1','x7/t2','x8/s0','x9/s1','x10/a0','x11/a1','x12/a2','x13/a3','x14/a4','x15/a5','x16/a6','x17/a7','x18/s2','x19/s3','x20/s4','x21/s5','x22/s6','x23/s7','x24/s8','x25/s9','x26/s10','x27/s11','x28/t3','x29/t4','x30/t5','x31/t6'],
    },
    pcFlags: {
      title: 'PC · CSR address space',
      detail:
        'No condition flags. RISC-V branches inspect register values directly (BEQ rs1,rs2; BLT rs1,rs2). All status bits live in the 12-bit CSR address space accessed by CSRRW/CSRRS/CSRRC: mstatus, mepc, mtvec, mcause, mtval, satp (page-table root), pmpcfg/pmpaddr (memory protection), cycle/time/instret counters. Choosing not to encode flags removed a global serializing dependency from arithmetic instructions — a deliberate concession to out-of-order implementation.',
      bits: ['mstatus','mtvec','mepc','mcause','mtval','satp','pmpcfg','cycle','time','instret'],
    },
    vec: {
      title: 'F/D/Q regs · V vector regs · length-agnostic',
      detail:
        'Optional F (32 × FLEN=32), D (FLEN=64), Q (FLEN=128) extensions add a separate 32-register floating-point file f0–f31. The V extension adds 32 vector registers v0–v31 each VLEN bits wide (implementation-defined, 128–65536 bits). Vector code does not bake VLEN into the encoding — instructions parameterize on vtype (element width, group multiplier) and vl (active length) so the same binary runs on 128-bit and 4096-bit cores unchanged.',
      grid: ['v0','v1','v2','v3','v4','v5','v6','v7','v8','v9','v10','v11','v12','v13','v14','v15','v16','v17','v18','v19','v20','v21','v22','v23','v24','v25','v26','v27','v28','v29','v30','v31'],
    },
    privilege: {
      title: 'Modes M / S / U (+ optional H)',
      detail:
        'M (machine, highest), S (supervisor), U (user). Hypervisor extension adds an HS mode and virtualizes S/U into VS/VU. Mode-specific CSRs share suffix conventions (mstatus/sstatus, mepc/sepc, mtvec/stvec). Traps redirect to the lowest-numbered mode that can handle them; mret/sret/uret return. PMP (Physical Memory Protection) and the MMU\'s satp register live in M and S respectively.',
      tiers: [
        { name: 'M', role: 'machine · firmware / SBI' },
        { name: 'HS', role: 'hypervisor (H ext.)' },
        { name: 'S', role: 'supervisor / OS' },
        { name: 'U', role: 'user code' },
      ],
    },
  },
];

export default function StateVisualizer() {
  const [active, setActive] = useState(ARCHES[0].id);
  const arch = ARCHES.find((a) => a.id === active);

  return (
    <div
      className="glass overflow-hidden rounded-2xl"
      style={{ borderColor: 'var(--rule-strong)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="marker">programmer-visible state · what the contract names</div>
        <div className="flex items-center gap-1.5">
          {ARCHES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setActive(a.id)}
              className="marker rounded-full border px-2.5 py-1 text-[10px] transition-colors"
              style={{
                borderColor: active === a.id ? 'var(--ink)' : 'var(--rule-strong)',
                color: active === a.id ? 'var(--ink)' : 'var(--ink-faint)',
                background: active === a.id ? 'var(--bg-soft)' : 'transparent',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={arch.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 gap-px lg:grid-cols-2"
          style={{ background: 'var(--rule)' }}
        >
          <Block accent={arch.accent} title={arch.gprs.title} body={arch.gprs.detail}>
            <RegGrid items={arch.gprs.grid} accent={arch.accent} />
          </Block>

          <Block accent={arch.accent} title={arch.pcFlags.title} body={arch.pcFlags.detail}>
            <FlagRow items={arch.pcFlags.bits} accent={arch.accent} />
          </Block>

          <Block accent={arch.accent} title={arch.vec.title} body={arch.vec.detail}>
            <RegGrid items={arch.vec.grid} accent={arch.accent} compact />
          </Block>

          <Block accent={arch.accent} title={arch.privilege.title} body={arch.privilege.detail}>
            <PrivLadder tiers={arch.privilege.tiers} accent={arch.accent} />
          </Block>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Block({ title, body, children, accent }) {
  return (
    <div
      className="px-5 py-5"
      style={{ background: 'var(--bg)' }}
    >
      <div className="display text-base" style={{ color: accent }}>{title}</div>
      <div className="mt-3">{children}</div>
      <p
        className="mt-3 text-[12px] leading-relaxed"
        style={{ color: 'var(--ink-soft)' }}
      >
        {body}
      </p>
    </div>
  );
}

function RegGrid({ items, accent, compact }) {
  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${compact ? 8 : 4}, minmax(0, 1fr))`,
      }}
    >
      {items.map((r) => (
        <div
          key={r}
          className="rounded border px-1.5 py-1 text-center font-mono text-[10px]"
          style={{
            borderColor: 'var(--rule-strong)',
            background: 'var(--bg-soft)',
            color: 'var(--ink)',
          }}
          title={r}
        >
          <span style={{ color: accent }}>{r}</span>
        </div>
      ))}
    </div>
  );
}

function FlagRow({ items, accent }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((b) => (
        <span
          key={b}
          className="rounded border px-2 py-1 font-mono text-[10px]"
          style={{
            borderColor: 'var(--rule-strong)',
            background: 'var(--bg-soft)',
            color: accent,
          }}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

function PrivLadder({ tiers, accent }) {
  return (
    <div className="flex flex-col gap-1">
      {tiers.map((t, i) => (
        <div
          key={t.name}
          className="flex items-center justify-between rounded border px-3 py-2"
          style={{
            borderColor: 'var(--rule-strong)',
            background: i === 0 ? 'var(--bg-soft)' : 'var(--bg)',
          }}
        >
          <span className="font-mono text-[11px]" style={{ color: accent }}>
            {t.name}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
            {t.role}
          </span>
        </div>
      ))}
    </div>
  );
}

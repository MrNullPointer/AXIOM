import { Activity, Waves, PowerOff } from 'lucide-react';
import { useMotion } from '../../app/motion.jsx';

/**
 * MotionToggle — single button that cycles the background animation through
 * full → calm → off. Optional: the page works identically at every level,
 * the canvas just does less work (calm) or paints once and freezes (off).
 *
 * Each tier shows its own icon so the current state is glanceable.
 */
const TIERS = {
  full: {
    Icon: Activity,
    label: 'background motion: full',
    next: 'calm',
    nextLabel: 'switch to calm',
  },
  calm: {
    Icon: Waves,
    label: 'background motion: calm',
    next: 'off',
    nextLabel: 'switch to off',
  },
  off: {
    Icon: PowerOff,
    label: 'background motion: off',
    next: 'full',
    nextLabel: 'switch to full',
  },
};

export default function MotionToggle() {
  const { level, cycle } = useMotion();
  const tier = TIERS[level] ?? TIERS.full;
  const { Icon } = tier;
  const aria = `${tier.label} — click to ${tier.nextLabel}`;
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={aria}
      title={aria}
      className="pad inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      style={{
        borderColor: 'var(--rule-strong)',
        color: level === 'off' ? 'var(--ink-faint)' : 'var(--ink)',
        background: 'var(--glass-bg)',
      }}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

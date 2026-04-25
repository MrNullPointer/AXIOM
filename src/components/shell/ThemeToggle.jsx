import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../app/theme.jsx';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="group inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs"
      style={{
        borderColor: 'var(--rule-strong)',
        color: 'var(--ink)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <span className="relative grid h-4 w-4 place-items-center">
        <Sun
          size={13}
          className="absolute transition-all duration-500"
          style={{
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'rotate(-90deg) scale(0.6)' : 'rotate(0) scale(1)',
          }}
          aria-hidden="true"
        />
        <Moon
          size={13}
          className="absolute transition-all duration-500"
          style={{
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.6)',
          }}
          aria-hidden="true"
        />
      </span>
      <span className="marker" style={{ color: 'var(--ink-faint)' }}>
        {isDark ? 'dark' : 'light'}
      </span>
    </button>
  );
}

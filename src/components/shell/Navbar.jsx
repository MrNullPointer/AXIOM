import { Link, NavLink } from 'react-router-dom';
import { Command } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import ThemeToggle from './ThemeToggle.jsx';

function isMacLike() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
}

export default function Navbar({ onOpenSearch }) {
  const mod = isMacLike() ? '⌘' : 'Ctrl';

  return (
    <header
      className="sticky top-0 z-40"
      style={{ pointerEvents: 'none' }}
    >
      <div className="px-4 pt-4 sm:px-6 sm:pt-5" style={{ pointerEvents: 'none' }}>
        <nav
          className="glass-strong mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-3 py-2 sm:px-4"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center gap-5">
            <Wordmark />
            <ul className="hidden items-center gap-1 sm:flex">
              <NavItem to="/" end>
                Atlas
              </NavItem>
              <NavItem to="/index">Index</NavItem>
            </ul>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs"
              aria-label="Open search"
              style={{
                borderColor: 'var(--rule-strong)',
                color: 'var(--ink)',
                background: 'var(--glass-bg)',
              }}
            >
              <Command size={12} aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
              <kbd
                className="ml-1 hidden rounded px-1.5 py-0.5 font-mono text-[10px] sm:inline"
                style={{ background: 'var(--rule)', color: 'var(--ink-faint)' }}
              >
                {mod} K
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ to, end, children }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          [
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            isActive ? 'font-medium' : '',
          ].join(' ')
        }
        style={({ isActive }) => ({
          color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
          background: isActive ? 'var(--glass-bg)' : 'transparent',
        })}
      >
        {children}
      </NavLink>
    </li>
  );
}

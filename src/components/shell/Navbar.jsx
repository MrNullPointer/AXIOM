import { NavLink, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import Wordmark from './Wordmark.jsx';
import MotionToggle from './MotionToggle.jsx';
import { smoothScrollToTop } from '../../app/scroll.js';

export default function Navbar({ onOpenSearch }) {
  const location = useLocation();
  // Same scroll-to-top as the Wordmark — clicking "Atlas" while on
  // '/' should glide back to the top. Native smooth-scroll gets
  // cancelled by framer-motion's layout system, so we use the
  // manual rAF helper from app/scroll.js.
  const handleAtlasClick = () => {
    if (location.pathname === '/') {
      smoothScrollToTop();
    }
  };
  return (
    <header
      className="sticky top-0 z-40"
      style={{ pointerEvents: 'none' }}
    >
      <div className="px-3 pt-3 sm:px-6 sm:pt-5" style={{ pointerEvents: 'none' }}>
        <nav
          className="glass-strong mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-3 py-2 sm:px-4"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <Wordmark />
            <ul className="flex items-center gap-1">
              <NavItem to="/" end onClick={handleAtlasClick}>
                Atlas
              </NavItem>
              <NavItem to="/index">Index</NavItem>
            </ul>
          </div>
          <div className="flex items-center gap-1.5">
            <IconButton onClick={onOpenSearch} ariaLabel="Open search">
              <Search size={15} aria-hidden="true" />
            </IconButton>
            <MotionToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}

function IconButton({ onClick, ariaLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="pad inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      style={{
        borderColor: 'var(--rule-strong)',
        color: 'var(--ink)',
        background: 'var(--glass-bg)',
      }}
    >
      {children}
    </button>
  );
}

function NavItem({ to, end, children, onClick }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        onClick={onClick}
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

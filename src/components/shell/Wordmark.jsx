import { Link } from 'react-router-dom';

export default function Wordmark() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5"
      aria-label="Axiom — return to atlas"
    >
      <Glyph />
      <span className="display text-[18px] tracking-tight" style={{ color: 'var(--ink)' }}>
        Axiom
      </span>
    </Link>
  );
}

function Glyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden="true"
      className="transition-transform duration-700 group-hover:rotate-90"
    >
      <circle cx="11" cy="11" r="10" fill="none" stroke="var(--ink)" strokeWidth="0.7" opacity="0.3" />
      <circle cx="11" cy="11" r="6" fill="none" stroke="var(--ink)" strokeWidth="0.7" opacity="0.55" />
      <circle cx="11" cy="11" r="2" fill="var(--accent-1)" />
      <line x1="0" y1="11" x2="22" y2="11" stroke="var(--ink)" strokeWidth="0.6" opacity="0.4" />
      <line x1="11" y1="0" x2="11" y2="22" stroke="var(--ink)" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

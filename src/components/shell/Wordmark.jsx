import { Link, useLocation } from 'react-router-dom';
import { smoothScrollToTop } from '../../app/scroll.js';

export default function Wordmark() {
  const location = useLocation();
  // Click "Axiom" → always end up at the top of the atlas. If already
  // on '/', react-router skips navigation; we run a manual rAF smooth
  // scroll so the page actually moves (native smooth-scroll gets
  // cancelled by framer-motion's layout measurements — see scroll.js).
  const handleClick = () => {
    if (location.pathname === '/') {
      smoothScrollToTop();
    }
    // For other paths, react-router navigates and App's <ScrollToTop>
    // does an instant-scroll to the top — same end state.
  };
  return (
    <Link
      to="/"
      onClick={handleClick}
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

/**
 * Glyph — a stack of liquid-glass plates around a glowing register-file
 * core. The mark is read top-down as a chip floorplan: outer chip frame,
 * L3 ring, L1 ring (warm), and the bright "axiom" register file at the
 * centre. Light comes from above — top edges are bright, bottom edges
 * fade into the substrate, and each plate casts a thin shadow on the
 * one beneath, giving the icon real volume at any size.
 *
 * On hover the whole stack tilts slightly and the core warms up.
 */
function Glyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden="true"
      className="overflow-visible transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:perspective(140px)_rotateX(14deg)_rotateY(-8deg)]"
    >
      <defs>
        {/* Top-down lighting: every frame stroke fades from a bright top to
            a dim bottom edge, which is what reads as volume on a 22px icon. */}
        <linearGradient id="ax-frame-stroke" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.38" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.18" />
        </linearGradient>
        {/* Warm amber stroke for the L1 ring, same top-to-bottom volume curve. */}
        <linearGradient id="ax-warm-stroke" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffe4a8" stopOpacity="1" />
          <stop offset="55%" stopColor="#f5b461" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#9a5a18" stopOpacity="0.85" />
        </linearGradient>
        {/* Bright core ball — radial gradient with an off-centre highlight
            so the centre square reads as a tiny illuminated dome. */}
        <radialGradient id="ax-core-fill" cx="48%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#fff5d8" />
          <stop offset="45%" stopColor="#ffd28a" />
          <stop offset="100%" stopColor="#8c4f12" />
        </radialGradient>
        {/* Diffuse halo around the core. */}
        <radialGradient id="ax-core-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd28a" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#f5b461" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f5b461" stopOpacity="0" />
        </radialGradient>
        {/* Thin specular highlight on the top-left of the chip frame. */}
        <linearGradient id="ax-spec" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Drop shadow under the outer chip — anchors the whole stack on the
          substrate. */}
      <rect
        x="1.5"
        y="2"
        width="19"
        height="19"
        rx="3.2"
        fill="rgba(0,0,0,0.55)"
        opacity="0.55"
      />

      {/* Outer chip frame — light glass plate. */}
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="3"
        fill="rgba(255,255,255,0.02)"
        stroke="url(#ax-frame-stroke)"
        strokeWidth="0.85"
      />

      {/* L3 plate — sits one layer deeper. Casts its own thin shadow. */}
      <rect
        x="4.4"
        y="4.6"
        width="13.4"
        height="13.4"
        rx="2"
        fill="rgba(0,0,0,0.30)"
      />
      <rect
        x="4"
        y="4"
        width="14"
        height="14"
        rx="2"
        fill="rgba(255,255,255,0.02)"
        stroke="url(#ax-frame-stroke)"
        strokeWidth="0.95"
      />

      {/* L1 plate — warm, deepest layer before the core. */}
      <rect
        x="7.4"
        y="7.5"
        width="7.6"
        height="7.6"
        rx="1.4"
        fill="rgba(0,0,0,0.32)"
      />
      <rect
        x="7"
        y="7"
        width="8"
        height="8"
        rx="1.5"
        fill="rgba(245,180,97,0.06)"
        stroke="url(#ax-warm-stroke)"
        strokeWidth="1.05"
      />

      {/* Diffuse core halo — radiates beyond the inner frame, softening
          how the bright centre meets the L1 plate. */}
      <circle cx="11" cy="11" r="4.2" fill="url(#ax-core-halo)" />

      {/* Bright register-file core — the focal "axiom". Tiny inner
          highlight gives the dome the look of a polished gem. */}
      <rect
        x="9.4"
        y="9.4"
        width="3.2"
        height="3.2"
        rx="0.55"
        fill="url(#ax-core-fill)"
      />
      <ellipse cx="10.6" cy="10.1" rx="0.65" ry="0.35" fill="#ffffff" opacity="0.7" />

      {/* Top specular sheen on the outer frame — the single line that sells
          the "glass viewed from above" feel. */}
      <line
        x1="3.5"
        y1="1.1"
        x2="11"
        y2="1.1"
        stroke="url(#ax-spec)"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

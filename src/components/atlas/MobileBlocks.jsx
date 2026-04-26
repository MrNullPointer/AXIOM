import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ACCENT_VAR, DOMAINS } from '../../data/domains.js';
import { conceptsByDomain } from '../../concepts/index.js';

/**
 * MobileBlocks — vertical stack of glass cards used on viewports too narrow
 * for the die floorplan to render legibly. Same content as the back of the
 * desktop flip cards, always visible. Keeps the chip aesthetic via corner
 * ticks and accent borders.
 */
export default function MobileBlocks() {
  return (
    <ul className="flex flex-col gap-3">
      {DOMAINS.map((d, i) => {
        const concepts = conceptsByDomain(d.id);
        const accent = ACCENT_VAR[d.accent] || 'var(--accent-1)';
        return (
          <li key={d.id}>
            <Link
              to={`/d/${d.id}`}
              aria-label={`${d.full} — enter`}
              className="relative block overflow-hidden rounded-md p-4"
              style={{
                border: '1px solid var(--rule)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(14px) saturate(160%)',
              }}
            >
              <CornerTicks color="var(--ink-faint)" />
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  color: accent,
                }}
              >
                {String(i + 1).padStart(2, '0')} · block
              </div>
              <div
                className="display mt-2 leading-none"
                style={{ fontSize: '36px', letterSpacing: '-0.015em', color: 'var(--ink)' }}
              >
                {d.label}
              </div>
              <p
                className="mt-3"
                style={{
                  fontFamily:
                    "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                  fontSize: '15px',
                  lineHeight: 1.55,
                  color: 'var(--ink-soft)',
                }}
              >
                {d.blurb}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {concepts.length} live
                </span>
                <span
                  className="inline-flex items-center gap-1.5 font-mono uppercase"
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.18em',
                    color: accent,
                  }}
                >
                  enter
                  <ArrowUpRight size={12} aria-hidden="true" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CornerTicks({ color }) {
  const tick = (extra) => ({
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: color,
    pointerEvents: 'none',
    ...extra,
  });
  return (
    <>
      <span style={tick({ top: 0, left: 0, borderTop: '1px solid', borderLeft: '1px solid' })} />
      <span style={tick({ top: 0, right: 0, borderTop: '1px solid', borderRight: '1px solid' })} />
      <span style={tick({ bottom: 0, left: 0, borderBottom: '1px solid', borderLeft: '1px solid' })} />
      <span style={tick({ bottom: 0, right: 0, borderBottom: '1px solid', borderRight: '1px solid' })} />
    </>
  );
}

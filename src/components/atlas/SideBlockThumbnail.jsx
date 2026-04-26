import { DOMAINS } from '../../data/domains.js';

/**
 * SideBlockThumbnail — mini chip floorplan rendered as a context panel
 * inside the plucked card. Shows ALL 10 atlas blocks in their grid
 * positions; the block currently being walked-through is highlighted
 * with the stage's accent color and given a subtle outer glow.
 *
 * Sits on the LEFT side of the plucked card so the user always knows
 * WHICH chip component the deep visualization on the right belongs to.
 * No text inside the thumbnail itself — the active block has a colored
 * fill, the rest are dim outlined rectangles. Below the thumbnail: the
 * active block's name (the only text in the side panel).
 */
export default function SideBlockThumbnail({ activeBlockId, color }) {
  const active = DOMAINS.find((d) => d.id === activeBlockId);
  // Floorplan grid is 12 cols × 8 rows
  return (
    <div
      className="flex h-full w-full flex-col items-stretch justify-between"
      style={{
        gap: '14px',
        padding: '4px 8px 4px 0',
      }}
    >
      {/* Mini chip thumbnail */}
      <div style={{ flex: '0 0 auto' }}>
        <div
          style={{
            fontSize: '9px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: '8px',
          }}
        >
          chip locator
        </div>
        <svg
          viewBox="0 0 240 160"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Die outline + corner ticks */}
          <rect
            x="2"
            y="2"
            width="236"
            height="156"
            rx="3"
            fill="none"
            stroke="var(--rule-strong)"
            strokeWidth="0.7"
          />
          {[
            [4, 4, 12, 4, 4, 12],
            [236, 4, 228, 4, 236, 12],
            [4, 156, 12, 156, 4, 148],
            [236, 156, 228, 156, 236, 148],
          ].map((pts, i) => (
            <polyline
              key={i}
              fill="none"
              stroke={color}
              strokeOpacity="0.5"
              strokeWidth="0.8"
              points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
            />
          ))}

          {/* All 10 blocks */}
          {DOMAINS.map((d) => {
            const x = 2 + (d.floor.col / 12) * 236 + 2;
            const y = 2 + (d.floor.row / 8) * 156 + 2;
            const w = (d.floor.w / 12) * 236 - 4;
            const h = (d.floor.h / 8) * 156 - 4;
            const isActive = d.id === activeBlockId;
            return (
              <g key={d.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="2"
                  fill={isActive ? color : 'none'}
                  fillOpacity={isActive ? 0.35 : 0}
                  stroke={isActive ? color : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isActive ? 1.2 : 0.6}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none',
                    transition:
                      'fill-opacity 360ms ease, stroke 360ms ease, stroke-width 360ms ease, filter 360ms ease',
                  }}
                />
                {/* Tiny dot inside active block (focus marker) */}
                {isActive && (
                  <circle
                    cx={x + w / 2}
                    cy={y + h / 2}
                    r="2"
                    fill={color}
                    style={{
                      filter: `drop-shadow(0 0 4px ${color})`,
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active block name + tagline */}
      <div style={{ flex: '0 0 auto' }}>
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: '6px',
          }}
        >
          we are inside
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            color,
            lineHeight: 1.15,
          }}
        >
          {active?.label || '—'}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--ink-soft)',
            marginTop: '8px',
            lineHeight: 1.45,
          }}
        >
          {active?.blurb || ''}
        </div>
      </div>
    </div>
  );
}

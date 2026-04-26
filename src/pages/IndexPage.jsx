import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONCEPTS } from '../concepts/index.js';
import { ACCENT_VAR, DOMAINS, getDomain } from '../data/domains.js';
import { prefetchConceptPage } from '../app/prefetch.js';

export default function IndexPage() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('all');

  const fuse = useMemo(
    () =>
      new Fuse(
        CONCEPTS.map((c) => c.meta),
        {
          keys: ['title', 'shortDescription', 'domain', 'layers'],
          threshold: 0.36,
          ignoreLocation: true,
        },
      ),
    [],
  );

  const filtered = useMemo(() => {
    let list = query.trim()
      ? fuse.search(query).map((r) => r.item)
      : CONCEPTS.map((c) => c.meta);
    if (domain !== 'all') list = list.filter((m) => m.domain === domain);
    return list;
  }, [query, domain, fuse]);

  // Shared liquid-glass surface — translucent dark wash + backdrop blur
  // so the muted die-shot bleeds through every panel on the page.
  const glassSurface = {
    background: 'rgba(8, 12, 22, 0.55)',
    border: '1px solid var(--rule)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  };
  const glassRow = {
    background: 'rgba(8, 12, 22, 0.50)',
    backdropFilter: 'blur(18px) saturate(150%)',
    WebkitBackdropFilter: 'blur(18px) saturate(150%)',
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <div className="marker">index</div>
        <h1 className="display mt-3 text-[clamp(36px,4.4vw,64px)]">
          Every concept, listed.
        </h1>
        <p className="lede mt-3">
          A flat alphabetical view of the atlas. Filter by domain or search any
          field.
        </p>
      </header>

      <div
        className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl p-3"
        style={glassSurface}
      >
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Search size={14} style={{ color: 'var(--ink-faint)' }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts…"
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--ink)' }}
            aria-label="Search concepts"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <Filter active={domain === 'all'} onClick={() => setDomain('all')}>
            all
          </Filter>
          {DOMAINS.map((d) => (
            <Filter
              key={d.id}
              active={domain === d.id}
              onClick={() => setDomain(d.id)}
            >
              {d.label}
            </Filter>
          ))}
        </div>
      </div>

      <ul
        className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border md:grid-cols-2"
        style={{
          borderColor: 'var(--rule-strong)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        {filtered.length === 0 ? (
          <li
            className="md:col-span-2 px-6 py-10 text-center"
            style={{ ...glassRow, color: 'var(--ink-faint)' }}
          >
            No concepts match.
          </li>
        ) : (
          filtered.map((m) => (
            <ConceptRow key={m.slug} meta={m} glassRow={glassRow} />
          ))
        )}
      </ul>
    </div>
  );
}

/**
 * ConceptRow — a single concept row in the index list.
 *
 * On hover, the card lifts a subtle accent glow keyed to the concept's
 * domain. Implementation is a CSS variable + opacity transition so the
 * glow fades in/out smoothly without re-rendering.
 */
function ConceptRow({ meta, glassRow }) {
  const dom = getDomain(meta.domain);
  const accent = ACCENT_VAR[dom?.accent] || 'var(--accent-1)';
  const [hover, setHover] = useState(false);

  return (
    <li
      onMouseEnter={() => {
        setHover(true);
        prefetchConceptPage();
      }}
      onMouseLeave={() => setHover(false)}
      onFocus={() => {
        setHover(true);
        prefetchConceptPage();
      }}
      onBlur={() => setHover(false)}
      style={{
        ...glassRow,
        position: 'relative',
        transition:
          'box-shadow 360ms cubic-bezier(0.22,1,0.36,1), background 360ms ease',
        boxShadow: hover
          ? `inset 0 0 60px ${accent}22, inset 0 0 0 1px ${accent}55`
          : 'inset 0 0 0 1px rgba(255,255,255,0)',
        background: hover
          ? `linear-gradient(180deg, rgba(8,12,22,0.55), rgba(8,12,22,0.40))`
          : glassRow.background,
      }}
    >
      {/* Soft top accent rule that fades in on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-500"
        style={{
          background: accent,
          opacity: hover ? 0.85 : 0,
        }}
      />
      {/* Subtle bottom-bleed glow keyed to the accent. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 bottom-0 h-12 transition-opacity duration-500"
        style={{
          background: `radial-gradient(60% 100% at 50% 100%, ${accent}28, transparent 70%)`,
          opacity: hover ? 1 : 0,
        }}
      />
      <Link
        to={`/c/${meta.slug}`}
        className="group relative flex items-start justify-between gap-4 px-5 py-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full transition-shadow duration-500"
              style={{
                background: accent,
                boxShadow: hover ? `0 0 10px ${accent}` : 'none',
              }}
              aria-hidden="true"
            />
            <span className="marker" style={{ color: 'var(--ink-faint)' }}>
              {meta.domain} · {meta.difficulty}
            </span>
          </div>
          <div
            className="mt-2 text-[17px] font-medium leading-tight tracking-[-0.01em] transition-colors"
            style={{ color: hover ? 'var(--ink)' : 'var(--ink)' }}
          >
            {meta.title}
          </div>
          <p
            className="mt-1.5 line-clamp-2 text-[14px] leading-snug"
            style={{ color: 'var(--ink-soft)' }}
          >
            {meta.shortDescription}
          </p>
        </div>
        <ArrowUpRight
          size={14}
          aria-hidden="true"
          className="mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: hover ? accent : 'var(--ink-faint)' }}
        />
      </Link>
    </li>
  );
}

function Filter({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="marker rounded-lg px-2.5 py-1.5"
      style={{
        background: active ? 'var(--glass-bg)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-faint)',
      }}
    >
      {children}
    </button>
  );
}

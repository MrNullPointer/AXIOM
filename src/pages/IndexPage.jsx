import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONCEPTS } from '../concepts/index.js';
import { ACCENT_VAR, DOMAINS, getDomain } from '../data/domains.js';

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
        className="glass mt-8 flex flex-wrap items-center gap-3 rounded-2xl p-3"
      >
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: 'var(--rule)' }}
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
        style={{ borderColor: 'var(--rule-strong)', background: 'var(--rule)' }}
      >
        {filtered.length === 0 ? (
          <li
            className="md:col-span-2 px-6 py-10 text-center"
            style={{ background: 'var(--bg)', color: 'var(--ink-faint)' }}
          >
            No concepts match.
          </li>
        ) : (
          filtered.map((m) => {
            const dom = getDomain(m.domain);
            const accent = ACCENT_VAR[dom?.accent] || 'var(--accent-1)';
            return (
              <li key={m.slug} style={{ background: 'var(--bg)' }}>
                <Link
                  to={`/c/${m.slug}`}
                  className="group flex items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: accent }}
                        aria-hidden="true"
                      />
                      <span
                        className="marker"
                        style={{ color: 'var(--ink-faint)' }}
                      >
                        {m.domain} · {m.difficulty}
                      </span>
                    </div>
                    <div
                      className="mt-2 text-[17px] font-medium leading-tight tracking-[-0.01em]"
                      style={{ color: 'var(--ink)' }}
                    >
                      {m.title}
                    </div>
                    <p
                      className="mt-1.5 line-clamp-2 text-[14px] leading-snug"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {m.shortDescription}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                    className="mt-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: 'var(--ink-faint)' }}
                  />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
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

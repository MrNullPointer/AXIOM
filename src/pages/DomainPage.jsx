import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { ACCENT_VAR, getDomain } from '../data/domains.js';
import { conceptsByDomain } from '../concepts/index.js';
import { prefetchConceptPage } from '../app/prefetch.js';

export default function DomainPage() {
  const { domain: id } = useParams();
  const domain = getDomain(id);

  if (!domain) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="marker">unknown domain</div>
        <h1 className="display mt-3 text-4xl">No such block on this die.</h1>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm"
          style={{ color: 'var(--accent-1)' }}
        >
          <ArrowLeft size={14} aria-hidden="true" /> back to atlas
        </Link>
      </div>
    );
  }

  const concepts = conceptsByDomain(domain.id);
  const accent = ACCENT_VAR[domain.accent] || 'var(--accent-1)';

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs"
        style={{ color: 'var(--ink-faint)' }}
      >
        <ArrowLeft size={12} aria-hidden="true" /> atlas
      </Link>

      <header className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <div className="marker" style={{ color: accent }}>
            domain · {domain.id}
          </div>
          <h1 className="display mt-3 text-[clamp(40px,5vw,76px)]">
            {domain.label}
          </h1>
          <p className="lede mt-4">{domain.blurb}</p>
        </div>
        <aside className="lg:col-span-4">
          <ul className="flex flex-col gap-2">
            <Stat label="full name" value={domain.full} />
            <Stat label="live" value={`${concepts.length}`} />
          </ul>
        </aside>
      </header>

      <div className="hairline mt-8" />

      <section className="mt-8">
        <div className="marker">concepts</div>
        {concepts.length === 0 ? (
          <div
            className="glass mt-4 rounded-2xl p-10 text-center"
            style={{ color: 'var(--ink-faint)' }}
          >
            <p className="text-sm">No concepts published in this domain yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((c) => (
              <ConceptCard key={c.meta.slug} concept={c.meta} accent={accent} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <li
      className="flex items-baseline justify-between gap-3 border-b pb-1.5"
      style={{ borderColor: 'var(--rule)' }}
    >
      <span className="marker">{label}</span>
      <span className="font-mono text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </li>
  );
}

function ConceptCard({ concept, accent }) {
  return (
    <Link
      to={`/c/${concept.slug}`}
      onMouseEnter={prefetchConceptPage}
      onFocus={prefetchConceptPage}
      className="group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-5"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: accent, opacity: 0.7 }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between">
        <div className="marker" style={{ color: 'var(--ink-faint)' }}>
          {concept.difficulty} · {concept.layers.join(' · ')}
        </div>
        <ArrowUpRight
          size={14}
          aria-hidden="true"
          style={{ color: 'var(--ink-faint)' }}
        />
      </div>
      <h3 className="display mt-4 text-2xl">{concept.title}</h3>
      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: 'var(--ink-soft)' }}
      >
        {concept.shortDescription}
      </p>
    </Link>
  );
}

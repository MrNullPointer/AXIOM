import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Cpu, Shield, Square, Zap } from 'lucide-react';
import { CONCEPTS, getConcept, relatedConcepts } from '../concepts/index.js';
import { ACCENT_VAR, getDomain } from '../data/domains.js';
import LazyViz from '../components/LazyViz.jsx';

// Reading-scale presets. Stored in localStorage so the choice persists
// across sessions and concept pages.
const READING_SCALES = [
  { id: 's', scale: 0.92, label: 'Small text' },
  { id: 'm', scale: 1.0, label: 'Medium text' },
  { id: 'l', scale: 1.18, label: 'Large text' },
];
const READING_SCALE_KEY = 'axiom-reading-scale';

function readStoredScale() {
  if (typeof window === 'undefined') return 1;
  const raw = window.localStorage.getItem(READING_SCALE_KEY);
  const num = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(num) ? num : 1;
}

// All possible sections in their canonical order. The TOC is filtered to
// only those whose content key is present, so concepts without (say) a
// physics or ordering section just don't render those entries.
const ALL_SECTIONS = [
  { id: 'intuition', label: 'Intuition', alwaysShow: true },
  { id: 'problem', label: 'Problem' },
  { id: 'physics', label: 'Physics' },
  { id: 'state', label: 'Machine state' },
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'operands', label: 'Operands' },
  { id: 'taxonomy', label: 'Taxonomy' },
  { id: 'ordering', label: 'Ordering' },
  { id: 'tradeoffs', label: 'Trade-offs' },
  { id: 'lineages', label: 'Lineages' },
  { id: 'evolution', label: 'Evolution' },
  { id: 'related', label: 'Related', alwaysShow: true },
];

const LENS_ICON = { performance: Zap, power: Cpu, area: Square, security: Shield };

export default function ConceptPage() {
  const { slug } = useParams();
  const concept = getConcept(slug);
  const [readingScale, setReadingScale] = useState(readStoredScale);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(READING_SCALE_KEY, String(readingScale));
    }
  }, [readingScale]);

  if (!concept) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="marker">unknown concept</div>
        <h1 className="display mt-3 text-4xl">Not on the die yet.</h1>
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

  const {
    meta,
    content,
    Visualizer,
    visualizers = {},
    vizMinHeights = {},
  } = concept;
  const domain = getDomain(meta.domain);
  const accent = ACCENT_VAR[domain?.accent] || 'var(--accent-1)';
  const related = relatedConcepts(meta);

  // Sections that have content for this concept.
  const sections = ALL_SECTIONS.filter(
    (s) => s.alwaysShow || content[s.id],
  );

  // Resolve a visualizer for an optional section, by slot id.
  const slotViz = (slot) => visualizers[slot] || null;
  const slotHeight = (slot) => vizMinHeights[slot] || 360;

  return (
    <article
      className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ '--reading-scale': readingScale }}
    >
      <Breadcrumb domain={domain} title={meta.title} />

      <Hero
        meta={meta}
        domain={domain}
        accent={accent}
        Visualizer={Visualizer}
        heroHeight={slotHeight('isa-encoding')}
      />

      <div className="hairline mt-12" />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <TOC
          sections={sections}
          accent={accent}
          readingScale={readingScale}
          onScaleChange={setReadingScale}
        />
        <main className="lg:col-span-9 lg:col-start-4">
          <Section id="intuition" eyebrow="intuition">
            <p className="lede">{meta.intuition}</p>
          </Section>

          <Section id="problem" eyebrow="problem" title={content.problem.title}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 body-prose">
                {content.problem.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {content.problem.aside ? (
                <Aside
                  title="lives in this concept"
                  items={content.problem.aside}
                />
              ) : null}
            </div>
          </Section>

          {content.physics ? (
            <ProseAndViz
              id="physics"
              eyebrow="physics"
              section={content.physics}
              Viz={slotViz(content.physics.visualizerSlot)}
              minHeight={slotHeight(content.physics.visualizerSlot)}
            />
          ) : null}

          {content.state ? (
            <ProseAndViz
              id="state"
              eyebrow="machine state"
              section={content.state}
              Viz={slotViz(content.state.visualizerSlot)}
              minHeight={slotHeight(content.state.visualizerSlot)}
            />
          ) : null}

          <Section
            id="mechanism"
            eyebrow="mechanism"
            title={content.mechanism.title}
          >
            <div className="body-prose">
              {content.mechanism.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-8">
              <LazyViz
                Component={Visualizer}
                minHeight={slotHeight(content.mechanism.visualizerSlot)}
                name="encoding"
                eager
              />
            </div>
          </Section>

          {content.operands ? (
            <ProseAndViz
              id="operands"
              eyebrow="operands"
              section={content.operands}
              Viz={slotViz(content.operands.visualizerSlot)}
              minHeight={slotHeight(content.operands.visualizerSlot)}
            />
          ) : null}

          {content.taxonomy ? (
            <ProseAndViz
              id="taxonomy"
              eyebrow="taxonomy"
              section={content.taxonomy}
              Viz={slotViz(content.taxonomy.visualizerSlot)}
              minHeight={slotHeight(content.taxonomy.visualizerSlot)}
            />
          ) : null}

          {content.ordering ? (
            <ProseAndViz
              id="ordering"
              eyebrow="memory ordering"
              section={content.ordering}
              Viz={slotViz(content.ordering.visualizerSlot)}
              minHeight={slotHeight(content.ordering.visualizerSlot)}
            />
          ) : null}

          <Section
            id="tradeoffs"
            eyebrow="trade-offs"
            title={content.tradeoffs.title}
          >
            <div className="body-prose">
              {content.tradeoffs.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <LensGrid lenses={content.tradeoffs.lenses} accent={accent} />
          </Section>

          <Section
            id="lineages"
            eyebrow="lineages"
            title={content.lineages.title}
          >
            <div
              className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border lg:grid-cols-3"
              style={{
                borderColor: 'var(--rule-strong)',
                background: 'var(--rule)',
              }}
            >
              {content.lineages.rows.map((row) => (
                <div
                  key={row.name}
                  className="px-5 py-5"
                  style={{ background: 'var(--bg)' }}
                >
                  <div className="display text-xl">{row.name}</div>
                  <div
                    className="marker mt-1"
                    style={{ color: 'var(--ink-faint)' }}
                  >
                    {row.kicker}
                  </div>
                  <p
                    className="mt-3 text-sm leading-relaxed"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {row.body}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {content.evolution ? (
            <ProseAndViz
              id="evolution"
              eyebrow="evolution"
              section={content.evolution}
              Viz={slotViz(content.evolution.visualizerSlot)}
              minHeight={slotHeight(content.evolution.visualizerSlot)}
            />
          ) : null}

          <Section id="related" eyebrow="related">
            {related.length === 0 ? (
              <p style={{ color: 'var(--ink-faint)' }}>No related concepts yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.meta.slug}
                    to={`/c/${r.meta.slug}`}
                    className="pad glass group flex items-center justify-between rounded-xl px-4 py-3"
                  >
                    <div>
                      <div
                        className="marker"
                        style={{ color: 'var(--ink-faint)' }}
                      >
                        {r.meta.domain}
                      </div>
                      <div className="display mt-1 text-lg">{r.meta.title}</div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      aria-hidden="true"
                      style={{ color: 'var(--ink-faint)' }}
                    />
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <NextPrev current={meta} />
        </main>
      </div>
    </article>
  );
}

function Breadcrumb({ domain, title }) {
  return (
    <nav
      className="flex items-center gap-2 text-xs"
      style={{ color: 'var(--ink-faint)' }}
      aria-label="Breadcrumb"
    >
      <Link to="/" className="hover:underline">
        atlas
      </Link>
      <span>·</span>
      {domain ? (
        <Link to={`/d/${domain.id}`} className="hover:underline">
          {domain.label}
        </Link>
      ) : null}
      <span>·</span>
      <span style={{ color: 'var(--ink)' }}>{title}</span>
    </nav>
  );
}

function Hero({ meta, domain, accent, Visualizer, heroHeight }) {
  return (
    <header className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <div className="marker" style={{ color: accent }}>
          {meta.domain} · {meta.difficulty}
        </div>
        <h1 className="display mt-3 text-[clamp(36px,4.6vw,72px)]">
          {meta.title}
        </h1>
        <p className="lede mt-4">{meta.shortDescription}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {meta.layers.map((l) => (
            <span
              key={l}
              className="marker rounded-full border px-2.5 py-1"
              style={{ borderColor: 'var(--rule-strong)' }}
            >
              {l}
            </span>
          ))}
          {meta.architectureRelevance.map((a) => (
            <span
              key={a}
              className="marker rounded-full border px-2.5 py-1"
              style={{ borderColor: 'var(--rule-strong)' }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>
      <motion.div
        className="lg:col-span-7"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <LazyViz
          Component={Visualizer}
          minHeight={heroHeight}
          name="hero"
          eager
        />
      </motion.div>
    </header>
  );
}

function TOC({ sections, accent, readingScale, onScaleChange }) {
  const [active, setActive] = useState('intuition');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <aside
      className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start"
      aria-label="Table of contents"
    >
      <div className="marker mb-3">on this page</div>
      <ul className="flex flex-col gap-1.5">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-center gap-3 py-1 text-sm transition-colors"
                style={{
                  color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
                }}
              >
                <span
                  aria-hidden="true"
                  className="block transition-all"
                  style={{
                    width: isActive ? 22 : 8,
                    height: 1,
                    background: isActive ? accent : 'var(--rule-strong)',
                  }}
                />
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>

      <FontSizeControl scale={readingScale} onChange={onScaleChange} />
    </aside>
  );
}

/**
 * FontSizeControl — three-step text-size selector. Three "A" glyphs at
 * increasing sizes; tapping one applies that scale to the article body
 * via the `--reading-scale` CSS variable. The choice persists in
 * localStorage so a returning reader keeps their setting.
 */
function FontSizeControl({ scale, onChange }) {
  return (
    <div className="mt-8">
      <div className="marker mb-3">text size</div>
      <div
        className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
        style={{ border: '1px solid var(--rule)', background: 'var(--glass-bg)' }}
        role="radiogroup"
        aria-label="Reading text size"
      >
        {READING_SCALES.map((s, i) => {
          const isActive = Math.abs(s.scale - scale) < 0.01;
          // Tiny / standard / large "A" glyphs. The visual scale of each
          // button conveys what the option does without needing labels.
          const glyphSize = [12, 14, 17][i];
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={s.label}
              title={s.label}
              onClick={() => onChange(s.scale)}
              className="grid h-8 w-9 place-items-center rounded-md transition-colors"
              style={{
                background: isActive ? 'var(--rule)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-faint)',
                fontFamily: "'Fraunces', ui-serif, Georgia, serif",
                fontSize: `${glyphSize}px`,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              A
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ProseAndViz — generic optional section: prose paragraphs followed by a
 * visualizer that lazy-loads its chunk and mounts when scrolled near the
 * viewport. Used for physics, operands, taxonomy, ordering, evolution.
 */
function ProseAndViz({ id, eyebrow, section, Viz, minHeight }) {
  return (
    <Section id={id} eyebrow={eyebrow} title={section.title}>
      <div className="body-prose">
        {section.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {Viz ? (
        <div className="mt-8">
          <LazyViz Component={Viz} minHeight={minHeight} name={id} />
        </div>
      ) : null}
    </Section>
  );
}

function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 py-14 first:pt-0">
      <div className="marker mb-3">{eyebrow}</div>
      {title ? (
        <h2 className="display mb-6 text-[clamp(28px,3.4vw,52px)]">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

function Aside({ title, items }) {
  return (
    <aside className="glass rounded-xl p-4">
      <div className="marker">{title}</div>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((it) => (
          <li
            key={it.label}
            className="border-b pb-2 last:border-b-0"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div className="marker" style={{ color: 'var(--ink-faint)' }}>
              {it.label}
            </div>
            <div
              className="mt-0.5 font-mono text-sm"
              style={{ color: 'var(--ink)' }}
            >
              {it.value}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function LensGrid({ lenses, accent }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Object.entries(lenses).map(([key, body]) => {
        const Icon = LENS_ICON[key] || Cpu;
        return (
          <div
            key={key}
            className="glass rounded-xl p-4"
            style={{ borderColor: 'var(--rule-strong)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 place-items-center rounded-md"
                style={{ background: 'var(--rule)' }}
              >
                <Icon size={12} style={{ color: accent }} aria-hidden="true" />
              </span>
              <span
                className="marker"
                style={{ color: 'var(--ink)' }}
              >
                {key}
              </span>
            </div>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'var(--ink-soft)' }}
            >
              {body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function NextPrev({ current }) {
  const order = CONCEPTS.map((c) => c.meta);
  const idx = order.findIndex((m) => m.slug === current.slug);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx < order.length - 1 ? order[idx + 1] : null;
  return (
    <div
      className="mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between"
      style={{ borderColor: 'var(--rule)' }}
    >
      {prev ? (
        <Link
          to={`/c/${prev.slug}`}
          className="pad glass flex flex-1 items-center gap-3 rounded-xl px-4 py-3"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <div className="text-left">
            <div className="marker">previous</div>
            <div className="text-sm" style={{ color: 'var(--ink)' }}>
              {prev.title}
            </div>
          </div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={`/c/${next.slug}`}
          className="pad glass flex flex-1 items-center justify-end gap-3 rounded-xl px-4 py-3"
        >
          <div className="text-right">
            <div className="marker">next</div>
            <div className="text-sm" style={{ color: 'var(--ink)' }}>
              {next.title}
            </div>
          </div>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

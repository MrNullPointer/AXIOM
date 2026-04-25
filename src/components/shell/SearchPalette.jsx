import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { CornerDownLeft, Search } from 'lucide-react';
import { CONCEPTS } from '../../concepts/index.js';
import { DOMAINS } from '../../data/domains.js';

function buildEntries() {
  const fromConcepts = CONCEPTS.map((c) => ({
    id: 'concept:' + c.meta.id,
    title: c.meta.title,
    blurb: c.meta.shortDescription,
    kind: 'concept',
    domain: c.meta.domain,
    layers: c.meta.layers,
    path: '/c/' + c.meta.slug,
  }));
  const fromDomains = DOMAINS.map((d) => ({
    id: 'domain:' + d.id,
    title: d.label,
    blurb: d.blurb,
    kind: 'domain',
    domain: d.id,
    layers: [],
    path: '/d/' + d.id,
  }));
  return [...fromConcepts, ...fromDomains];
}

export default function SearchPalette({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const entries = useMemo(buildEntries, []);
  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: 'title', weight: 0.55 },
          { name: 'blurb', weight: 0.25 },
          { name: 'domain', weight: 0.1 },
          { name: 'layers', weight: 0.1 },
        ],
        threshold: 0.36,
        ignoreLocation: true,
      }),
    [entries],
  );

  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLInputElement && !open) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return entries.slice(0, 8);
    return fuse.search(query).slice(0, 12).map((r) => r.item);
  }, [query, entries, fuse]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  function go(item) {
    onOpenChange(false);
    navigate(item.path);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) go(item);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[18vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl"
        style={{ animation: 'fadeIn 250ms ease-out' }}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--rule)' }}
        >
          <Search size={16} style={{ color: 'var(--ink-faint)' }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search concepts and domains…"
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--ink)' }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd
            className="hidden rounded-md border px-1.5 py-0.5 font-mono text-[10px] sm:inline"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink-faint)' }}
          >
            esc
          </kbd>
        </div>

        <ul
          className="max-h-[55vh] overflow-y-auto py-1.5"
          role="listbox"
          aria-label="Results"
        >
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>
              No matches.
            </li>
          ) : (
            results.map((item, i) => {
              const isActive = i === active;
              return (
                <li key={item.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                    style={{ background: isActive ? 'var(--glass-bg)' : 'transparent' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="marker text-[10px]"
                          style={{ color: 'var(--ink-faint)' }}
                        >
                          {item.kind}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: 'var(--ink)' }}
                        >
                          {item.title}
                        </span>
                      </div>
                      <div
                        className="mt-1 truncate text-xs"
                        style={{ color: 'var(--ink-faint)' }}
                      >
                        {item.blurb}
                      </div>
                    </div>
                    {isActive ? (
                      <CornerDownLeft
                        size={12}
                        style={{ color: 'var(--ink-faint)' }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div
          className="flex items-center justify-between border-t px-3 py-2 text-[11px]"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink-faint)' }}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono">↑ ↓ navigate</span>
            <span className="font-mono">↵ open</span>
          </div>
          <span className="marker">Axiom · search</span>
        </div>
      </div>
    </div>
  );
}
